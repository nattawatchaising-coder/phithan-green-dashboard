function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const p3sR = (v, n) => Math.round((+v || 0) * (n || 100)) / (n || 100);
const p3sClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P3S_COMPASS = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
const p3sCompass = deg => P3S_COMPASS[Math.round((deg % 360 + 360) % 360 / 45) % 8];
function p3sRY(x, z, a) {
  return {
    x: x * Math.cos(a) + z * Math.sin(a),
    z: -x * Math.sin(a) + z * Math.cos(a)
  };
}
function p3sRot(x, z, rad) {
  const c = Math.cos(rad),
    s = Math.sin(rad);
  return {
    x: x * c - z * s,
    z: x * s + z * c
  };
}
function p3sCentroid(pts) {
  if (!pts.length) return {
    x: 0,
    z: 0
  };
  let a = 0,
    cx = 0,
    cz = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j].x * pts[i].z - pts[i].x * pts[j].z;
    a += f;
    cx += (pts[j].x + pts[i].x) * f;
    cz += (pts[j].z + pts[i].z) * f;
  }
  if (Math.abs(a) < 1e-9) return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    z: pts.reduce((s, p) => s + p.z, 0) / pts.length
  };
  return {
    x: cx / (3 * a),
    z: cz / (3 * a)
  };
}
function p3sDistSeg(p, a, b) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    L2 = dx * dx + dz * dz;
  const t = L2 ? p3sClamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L2, 0, 1) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}
const _p3sFaceCache = new WeakMap();
function p3sFaces2D(roof) {
  const hit = _p3sFaceCache.get(roof);
  if (hit) return hit;
  let out = [];
  try {
    if (roof.kind === "poly") {
      if (Array.isArray(roof.pts) && roof.pts.length >= 3) {
        const ph = p3PhOf(roof);
        const pts3 = roof.pts.map((p, i) => ({
          x: (+roof.x || 0) + (+p.x || 0),
          y: ph[i],
          z: (+roof.z || 0) + (+p.z || 0)
        }));
        out = [{
          side: null,
          pts: pts3.map(q => ({
            x: q.x,
            z: q.z
          })),
          asp: p3sFaceAsp(pts3)
        }];
      }
    } else if (roof.kind === "dome") {
      const D = p3DomeGeo(roof),
        a = -(((+roof.az || 180) - 180) * P3_DEG);
      out = [{
        side: null,
        pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => {
          const q = p3sRY(sx * D.len / 2, sz * D.span / 2, a);
          return {
            x: q.x + (+roof.x || 0),
            z: q.z + (+roof.z || 0)
          };
        })
      }];
    } else {
      const all = Object.assign({}, roof, {
        sideA: true,
        sideB: true,
        sideC: true,
        sideD: true
      });
      out = p3RoofSurf(all).map(s => ({
        side: s.side,
        pts: s.pts.map(q => ({
          x: q.x,
          z: q.z
        })),
        asp: p3sFaceAsp(s.pts)
      }));
    }
  } catch (e) {
    out = [];
  }
  _p3sFaceCache.set(roof, out);
  return out;
}
function p3sRoofPts(roof) {
  const o = [];
  p3sFaces2D(roof).forEach(f => f.pts.forEach(p => o.push(p)));
  return o;
}
function p3sRoofHit(roof, w) {
  return p3sFaces2D(roof).some(f => p3InPoly(w.x, w.z, f.pts));
}
function p3sRoofCenter(roof) {
  if (roof.kind === "poly") {
    const f = p3sFaces2D(roof)[0];
    return f ? p3sCentroid(f.pts) : {
      x: +roof.x || 0,
      z: +roof.z || 0
    };
  }
  const pts = p3sRoofPts(roof);
  if (!pts.length) return {
    x: +roof.x || 0,
    z: +roof.z || 0
  };
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    z: pts.reduce((s, p) => s + p.z, 0) / pts.length
  };
}
function p3sHull(pts) {
  const P = pts.map(p => [p.x, p.z]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (P.length < 3) return pts.slice();
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [],
    up = [];
  P.forEach(p => {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  });
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  up.pop();
  lo.pop();
  return lo.concat(up).map(q => ({
    x: q[0],
    z: q[1]
  }));
}
function p3sOutline(roof) {
  if (roof.kind === "poly") {
    const f = p3sFaces2D(roof)[0];
    return f ? f.pts : [];
  }
  return p3sHull(p3sRoofPts(roof));
}
const _p3sQuadCache = new WeakMap();
function p3sQuads(roof, want) {
  if (!want) {
    const hit = _p3sQuadCache.get(roof);
    if (hit) return hit;
  }
  let pan;
  try {
    pan = p3Panels(roof, want);
  } catch (e) {
    return [];
  }
  const blocks = pan.blocks || [];
  const X = p3Xf(roof, pan);
  const RX = X.RX,
    RY = X.RY,
    chain = X.chain,
    world = X.world;
  const out = [];
  (pan.list || []).forEach(p => {
    const blk = blocks[p.blk] || {
      rot: 0,
      tilt: 0
    };
    const ry = p3BlkRy(roof, blk),
      T = (+blk.tilt || 0) * P3_DEG;
    const c0 = roof.kind === "dome" || roof.kind === "poly" ? {
      x: p.x,
      y: p.y || 0,
      z: p.z
    } : {
      x: p.x,
      y: 0,
      z: p.z
    };
    const cw = world(chain(p.side, c0, false), false);
    let U, V;
    if (roof.kind === "poly" && pan.plane) {
      const P = pan.plane,
        cr = Math.cos(ry),
        sr = Math.sin(ry),
        cT = Math.cos(T),
        sT = Math.sin(T);
      const mix = (a, b, c) => ({
        x: a * P.u.x + b * P.n.x - c * P.v.x,
        y: a * P.u.y + b * P.n.y - c * P.v.y,
        z: a * P.u.z + b * P.n.z - c * P.v.z
      });
      U = mix(cr * p.pw / 2, 0, -sr * p.pw / 2);
      V = mix(cT * sr * p.pd / 2, -sT * p.pd / 2, cT * cr * p.pd / 2);
    } else if (roof.kind === "dome") {
      U = world(chain(null, {
        x: p.pw / 2,
        y: 0,
        z: 0
      }, true), true);
      V = world(chain(null, RX({
        x: 0,
        y: 0,
        z: p.pd / 2
      }, p.rx || 0), true), true);
    } else {
      U = world(chain(p.side, RY({
        x: p.pw / 2,
        y: 0,
        z: 0
      }, ry), true), true);
      V = world(chain(p.side, RY(RX({
        x: 0,
        y: 0,
        z: p.pd / 2
      }, T), ry), true), true);
    }
    out.push({
      key: p.key,
      blk: p.blk || 0,
      side: p.side || null,
      skip: !!p.skip,
      slot: !!p.slot,
      cx: cw.x,
      cz: cw.z,
      pts: [{
        x: cw.x - U.x - V.x,
        z: cw.z - U.z - V.z
      }, {
        x: cw.x + U.x - V.x,
        z: cw.z + U.z - V.z
      }, {
        x: cw.x + U.x + V.x,
        z: cw.z + U.z + V.z
      }, {
        x: cw.x - U.x + V.x,
        z: cw.z - U.z + V.z
      }]
    });
  });
  if (!want) _p3sQuadCache.set(roof, out);
  return out;
}
const _p3sPathCache = new WeakMap();
const _p3sGrpCache = new WeakMap();
function p3sQuadPaths(roof) {
  const hit = _p3sPathCache.get(roof);
  if (hit) return hit;
  const on = [],
    off = [];
  const f = v => Math.round(v * 1000) / 1000;
  p3sQuads(roof).forEach(q => {
    const d = "M" + q.pts.map(p => f(p.x) + " " + f(p.z)).join("L") + "Z";
    if (q.skip) off.push(d);else {
      (on[q.blk] = on[q.blk] || []).push(d);
    }
  });
  const out = {
    on: on.map(a => a ? a.join("") : ""),
    off: off.join("")
  };
  _p3sPathCache.set(roof, out);
  return out;
}
function p3sCount(roof) {
  try {
    return p3Panels(roof).count;
  } catch (e) {
    return 0;
  }
}
function p3sSurfFn(roof, side) {
  let pan;
  try {
    pan = p3Panels(roof);
  } catch (e) {
    return null;
  }
  if (!pan.toMesh || roof.kind === "dome") return null;
  const X = p3Xf(roof, pan);
  return (u, v) => {
    const m = pan.toMesh({
      u,
      v
    });
    const c = X.world(X.chain(side, {
      x: m.x,
      y: m.y || 0,
      z: m.z
    }, false), false);
    return {
      x: c.x,
      z: c.z
    };
  };
}
function p3sJac(fn, u, v) {
  const a = fn(u, v),
    b = fn(u + 1, v),
    c = fn(u, v + 1);
  return {
    a: b.x - a.x,
    b: c.x - a.x,
    c: b.z - a.z,
    d: c.z - a.z
  };
}
function p3sInvJ(J, dx, dz) {
  const det = J.a * J.d - J.b * J.c;
  if (Math.abs(det) < 1e-9) return {
    du: 0,
    dv: 0
  };
  return {
    du: (J.d * dx - J.b * dz) / det,
    dv: (-J.c * dx + J.a * dz) / det
  };
}
function p3sAlignRot(roof, side, ang) {
  const fn = p3sSurfFn(roof, side);
  if (!fn) return 0;
  const J = p3sJac(fn, 0, 0);
  const s = J.a * J.d - J.b * J.c < 0 ? -1 : 1;
  const phi0 = Math.atan2(J.c, J.a);
  let r = s * (ang - phi0) / P3_DEG;
  r = (r % 180 + 180) % 180;
  if (r > 90) r -= 180;
  if (r > 45) r -= 90;else if (r < -45) r += 90;
  return p3sR(r, 10);
}
function p3sFitRot(r, side) {
  if (r.kind === "poly") {
    const P = r.pts || [],
      n = P.length;
    if (n > 2 && p3sPolyPitch(r) > 0.4) {
      const ph = p3PhOf(r);
      let lo = 0;
      if (r.p3sLow != null) lo = (+r.p3sLow % n + n) % n;else {
        let bv = 1e9;
        P.forEach((_, i) => {
          const v = ph[i] + ph[(i + 1) % n];
          if (v < bv) {
            bv = v;
            lo = i;
          }
        });
      }
      const a = P[lo],
        b = P[(lo + 1) % n];
      return p3sAlignRot(r, null, Math.atan2(b.z - a.z, b.x - a.x));
    }
    return p3sAlignRot(r, null, p3sLongEdgeAng(p3sFaces2D(r)[0].pts));
  }
  return p3sAlignRot(r, side, p3sLongEdgeAng(p3sOutline(r)));
}
function p3sFillPatch(r, orient) {
  let rot = 0;
  if (r.kind === "poly") {
    const pl = p3PolyPlane(r);
    if (pl && (pl.tiltCos > 0.999 || p3sPolyPitch(r) > 0.4)) rot = p3sFitRot(r);
  }
  return {
    blocks: [Object.assign(p3NewBlk(0), {
      orient: orient || "portrait",
      rot
    })],
    skips: {},
    noPanel: null
  };
}
const P3S_OBS = [["turbine", "ลูกหมุน", 0.6, 0.6, 0.5], ["vent", "ปล่องดูดควัน", 0.6, 0.6, 1.5], ["sky", "หลังคาช่องแสง", 6, 1, 0.15], ["rail", "ราวกันตก", 6, 0.3, 1.1], ["walkway", "ทางเดิน", 6, 0.3, 0.05], ["ladder", "บันไดลิง", 0.8, 0.8, 4], ["pipe", "ท่อน้ำ PPR", 6, 0.025, 0.05], ["tray", "รางไฟ", 6, 0.1, 0.05], ["bldg", "ตึก", 8, 6, 6], ["tree", "ต้นไม้", 3, 3, 5]];
const P3S_ZONE_C = ["#f59e0b", "#0ea5e9", "#a855f7", "#ef4444", "#10b981", "#ec4899"];
const P3S_OBS_LINE = {
  rail: 1,
  walkway: 1,
  sky: 1,
  pipe: 1,
  tray: 1
};
const P3S_TAP_KEEP = 0.25;
const P3S_PIPE_D = [[0.02, "20 มม. (½\")"], [0.025, "25 มม. (¾\")"], [0.032, "32 มม. (1\")"]];
const P3S_TRAY_W = [[0.05, "5 ซม."], [0.1, "10 ซม."], [0.15, "15 ซม."], [0.2, "20 ซม."]];
function p3sNearOnPath(P, w) {
  let best = null;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1],
      b = P[i],
      dx = b.x - a.x,
      dz = b.z - a.z,
      L2 = dx * dx + dz * dz || 1e-9;
    const t = Math.max(0, Math.min(1, ((w.x - a.x) * dx + (w.z - a.z) * dz) / L2)),
      x = a.x + dx * t,
      z = a.z + dz * t,
      d = Math.hypot(w.x - x, w.z - z);
    if (!best || d < best.d) {
      const L = Math.sqrt(L2);
      best = {
        x,
        z,
        d,
        t: {
          x: dx / L,
          z: dz / L
        }
      };
    }
  }
  return best;
}
const _p3sTx = {};
function p3sGrassTex(THREE) {
  if (_p3sTx.grass) return _p3sTx.grass;
  const N = 256,
    c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  g.fillStyle = "#8ea468";
  g.fillRect(0, 0, N, N);
  let sd = 11;
  const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * N,
      y = rnd() * N,
      r = 10 + rnd() * 34,
      v = rnd();
    g.fillStyle = v < 0.5 ? "rgba(120,146,92,.16)" : "rgba(196,206,150,.16)";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 5000; i++) {
    const v = rnd();
    g.fillStyle = v < 0.5 ? "rgba(88,116,64,.28)" : "rgba(214,222,170,.24)";
    g.fillRect(rnd() * N, rnd() * N, 1, 1 + Math.floor(rnd() * 3));
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return _p3sTx.grass = t;
}
function p3sFadeTex(THREE) {
  if (_p3sTx.fade) return _p3sTx.fade;
  const N = 256,
    c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d"),
    im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N,
      v = (y + 0.5) / N,
      e = Math.min(u, 1 - u, v, 1 - v),
      a = Math.max(0, Math.min(1, e / 0.06)),
      k = Math.round(255 * a * a * (3 - 2 * a)),
      i = (y * N + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = k;
    im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return _p3sTx.fade = new THREE.CanvasTexture(c);
}
function p3sAOTex(THREE) {
  if (_p3sTx.ao) return _p3sTx.ao;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 64;
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    const t = y / 63;
    g.fillStyle = "rgba(0,0,0," + (0.62 * Math.pow(1 - t, 2)).toFixed(3) + ")";
    g.fillRect(0, y, 4, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return _p3sTx.ao = t;
}
function p3sPanAOTex(THREE) {
  if (_p3sTx.pan) return _p3sTx.pan;
  const N = 64,
    c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d"),
    im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N,
      v = (y + 0.5) / N,
      e = Math.min(u, 1 - u, v, 1 - v) / 0.16,
      a = Math.max(0, Math.min(1, e)),
      i = (y * N + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 0;
    im.data[i + 3] = Math.round(255 * 0.5 * a * a * (3 - 2 * a));
  }
  g.putImageData(im, 0, 0);
  return _p3sTx.pan = new THREE.CanvasTexture(c);
}
let _p3sLogo = null;
function p3sLogoImg() {
  if (!_p3sLogo && typeof brandDocURL === "function") {
    _p3sLogo = new Image();
    _p3sLogo.src = brandDocURL();
  }
  return _p3sLogo;
}
function p3sDrawInfo(g, W, H, info) {
  const k = W / 3840,
    ff = getComputedStyle(document.body).fontFamily || "sans-serif";
  const F = (w, px) => w + " " + Math.round(px * k) + "px " + ff;
  const lines = [[F(800, 66), info.title || "", "#0F2B33"], [F(600, 40), info.sub || "", "#25414a"], [F(500, 32), info.note || "", "#5B8A8A"]].filter(l => l[1]);
  const logo = p3sLogoImg(),
    lh = 104 * k,
    hasLogo = !!(logo && logo.complete && logo.naturalWidth);
  const brand = typeof BRANDING !== "undefined" && BRANDING.legal || "";
  g.save();
  let tw = 0;
  lines.forEach(l => {
    g.font = l[0];
    tw = Math.max(tw, g.measureText(l[1]).width);
  });
  g.font = F(800, 30);
  const lw = hasLogo ? lh * logo.naturalWidth / logo.naturalHeight : 0,
    bw = lw + (hasLogo ? 18 * k : 0) + g.measureText(brand).width;
  tw = Math.max(tw, bw);
  const pad = 46 * k,
    gap = 16 * k,
    hs = [44, 66, 40, 32],
    cw = tw + pad * 2;
  const ch = pad * 2 + lh + gap * 2.6 + lines.reduce((a, l, i) => a + (i ? gap : 0) + parseFloat(l[0].split(" ")[1]) * 1.25, 0);
  const x0 = 80 * k,
    y0 = H - 80 * k - ch,
    R = 30 * k;
  g.beginPath();
  g.moveTo(x0 + R, y0);
  g.arcTo(x0 + cw, y0, x0 + cw, y0 + ch, R);
  g.arcTo(x0 + cw, y0 + ch, x0, y0 + ch, R);
  g.arcTo(x0, y0 + ch, x0, y0, R);
  g.arcTo(x0, y0, x0 + cw, y0, R);
  g.closePath();
  g.shadowColor = "rgba(0,0,0,.28)";
  g.shadowBlur = 40 * k;
  g.shadowOffsetY = 10 * k;
  g.fillStyle = "#ffffff";
  g.fill();
  g.shadowColor = "transparent";
  let y = y0 + pad;
  if (hasLogo) {
    g.globalCompositeOperation = "multiply";
    g.drawImage(logo, x0 + pad, y, lw, lh);
    g.globalCompositeOperation = "source-over";
  }
  g.font = F(800, 30);
  g.fillStyle = "#0F2B33";
  g.textBaseline = "middle";
  g.fillText(brand, x0 + pad + lw + (hasLogo ? 18 * k : 0), y + lh / 2);
  y += lh + gap * 0.9;
  g.textBaseline = "top";
  g.fillStyle = "#22B36A";
  g.fillRect(x0 + pad, y, 90 * k, 5 * k);
  y += 5 * k + gap * 1.7;
  lines.forEach((l, i) => {
    if (i) y += gap;
    g.font = l[0];
    g.fillStyle = l[2];
    g.fillText(l[1], x0 + pad, y);
    y += parseFloat(l[0].split(" ")[1]) * 1.25;
  });
  g.restore();
  void hs;
}
let _p3sTrayTex = null;
function p3sTrayTex(THREE) {
  if (_p3sTrayTex) return _p3sTrayTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const g = c.getContext("2d");
  g.fillStyle = "#d4d9df";
  g.fillRect(0, 0, 128, 32);
  g.fillStyle = "#59626c";
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 32;
    g.beginPath();
    g.moveTo(x + 4, 11);
    g.lineTo(x + 16, 11);
    g.arc(x + 16, 16, 5, -Math.PI / 2, Math.PI / 2);
    g.lineTo(x + 4, 21);
    g.arc(x + 4, 16, 5, Math.PI / 2, Math.PI * 1.5);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  _p3sTrayTex = t;
  return t;
}
function p3sObsPath(o) {
  const x = +o.x || 0,
    z = +o.z || 0;
  if (Array.isArray(o.pts) && o.pts.length >= 2) return o.pts.map(q => ({
    x: x + (+q.x || 0),
    z: z + (+q.z || 0)
  }));
  const L = (+o.w || 1) / 2,
    a = (+o.rot || 0) * P3_DEG,
    ux = Math.cos(a),
    uz = Math.sin(a);
  return [{
    x: x - ux * L,
    z: z - uz * L
  }, {
    x: x + ux * L,
    z: z + uz * L
  }];
}
function p3sRailPosts(P) {
  const out = [P[0]];
  for (let i = 1; i < P.length; i++) {
    const A = P[i - 1],
      B = P[i],
      n = Math.max(1, Math.ceil(Math.hypot(B.x - A.x, B.z - A.z) / 2));
    for (let k = 1; k <= n; k++) out.push({
      x: A.x + (B.x - A.x) * k / n,
      z: A.z + (B.z - A.z) * k / n
    });
  }
  return out;
}
const p3sPathLen = P => {
  let L = 0;
  for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
  return L;
};
function p3sSegRect(a, b, hw, ext) {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1,
    ux = (b.x - a.x) / L,
    uz = (b.z - a.z) / L,
    vx = -uz * hw,
    vz = ux * hw,
    ex = ux * (ext || 0),
    ez = uz * (ext || 0);
  return [{
    x: a.x - ex + vx,
    z: a.z - ez + vz
  }, {
    x: b.x + ex + vx,
    z: b.z + ez + vz
  }, {
    x: b.x + ex - vx,
    z: b.z + ez - vz
  }, {
    x: a.x - ex - vx,
    z: a.z - ez - vz
  }];
}
function p3sObsKeep(o, pad) {
  if (!P3S_OBS_LINE[o.p3sType]) return [p3sObsRect(o, pad)];
  const P = p3sObsPath(o),
    hw = Math.max(0.05, (+o.d || 0.3) / 2) + (pad || 0),
    out = [];
  for (let i = 1; i < P.length; i++) out.push(p3sSegRect(P[i - 1], P[i], hw, hw));
  return out;
}
const p3sObsType = o => o.p3sType || (o.kind === "tree" ? "tree" : "box");
const P3S_ON_ROOF = {
  turbine: 0.15,
  vent: 0.15,
  sky: 0.05,
  rail: 0.1,
  walkway: 0.05,
  ladder: 0.4
};
function p3sObsRect(o, pad) {
  const w = (+o.w || 1) / 2 + (pad || 0),
    d = (+o.d || 1) / 2 + (pad || 0),
    a = (+o.rot || 0) * P3_DEG,
    c = Math.cos(a),
    s = Math.sin(a),
    x = +o.x || 0,
    z = +o.z || 0;
  return [[-w, -d], [w, -d], [w, d], [-w, d]].map(([u, v]) => ({
    x: x + u * c - v * s,
    z: z + u * s + v * c
  }));
}
function p3sSyncObs(s) {
  if (!s || !Array.isArray(s.roofs)) return s;
  const obs = (s.obstacles || []).filter(o => P3S_ON_ROOF[o.p3sType] != null);
  const taps = [];
  (s.obstacles || []).forEach(o => {
    if (o.p3sType === "pipe") (o.taps || []).forEach((t, k) => taps.push({
      id: o.id + "@" + k,
      x: (+o.x || 0) + (+t.x || 0),
      z: (+o.z || 0) + (+t.z || 0)
    }));
  });
  let ch = false;
  const roofs = s.roofs.map(r => {
    let out = [];
    try {
      out = p3sOutline(r) || [];
    } catch (e) {
      out = [];
    }
    const ox = +r.x || 0,
      oz = +r.z || 0;
    const list = [];
    if (out.length >= 3) obs.forEach(o => {
      const K0 = p3sObsKeep(o, 0),
        K = p3sObsKeep(o, P3S_ON_ROOF[o.p3sType]);
      K0.forEach((R, k) => {
        const mx = R.reduce((t, q) => t + q.x, 0) / 4,
          mz = R.reduce((t, q) => t + q.z, 0) / 4;
        if (!(p3InPoly(mx, mz, out) || R.some(q => p3InPoly(q.x, q.z, out)))) return;
        list.push({
          id: K0.length > 1 ? o.id + "#" + k : o.id,
          pts: K[k].map(p => ({
            x: p3sR(p.x - ox, 1000),
            z: p3sR(p.z - oz, 1000)
          }))
        });
      });
    });
    if (out.length >= 3) taps.forEach(t => {
      if (!p3InPoly(t.x, t.z, out)) return;
      const h = P3S_TAP_KEEP;
      list.push({
        id: t.id,
        pts: [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => ({
          x: p3sR(t.x + u - ox, 1000),
          z: p3sR(t.z + v - oz, 1000)
        }))
      });
    });
    if (JSON.stringify(r.obs && r.obs.length ? r.obs : []) === JSON.stringify(list)) return r;
    ch = true;
    const n = Object.assign({}, r);
    if (list.length) n.obs = list;else delete n.obs;
    return n;
  });
  return ch ? Object.assign({}, s, {
    roofs
  }) : s;
}
function p3sLadderFit(roofs, x, z) {
  let best = null;
  (roofs || []).forEach(r => {
    let o = [];
    try {
      o = p3sOutline(r) || [];
    } catch (e) {
      o = [];
    }
    if (o.length < 3) return;
    let ar = 0;
    o.forEach((a, i) => {
      const b = o[(i + 1) % o.length];
      ar += a.x * b.z - b.x * a.z;
    });
    o.forEach((a, i) => {
      const b = o[(i + 1) % o.length],
        dx = b.x - a.x,
        dz = b.z - a.z,
        L2 = dx * dx + dz * dz;
      if (L2 < 1e-6) return;
      const L = Math.sqrt(L2),
        mg = Math.min(0.45, L / 2) / L,
        t = Math.max(mg, Math.min(1 - mg, ((x - a.x) * dx + (z - a.z) * dz) / L2)),
        qx = a.x + dx * t,
        qz = a.z + dz * t,
        d = Math.hypot(x - qx, z - qz);
      if (d > 3 || best && d >= best.d) return;
      const tx = dx / L,
        tz = dz / L,
        sg = ar > 0 ? 1 : -1;
      best = {
        d,
        q: {
          x: qx,
          z: qz
        },
        t: {
          x: tx,
          z: tz
        },
        n: {
          x: tz * sg,
          z: -tx * sg
        }
      };
    });
  });
  return best;
}
const p3sObsName = o => {
  const t = P3S_OBS.find(x => x[0] === p3sObsType(o));
  return t ? t[1] : "สิ่งบดบัง";
};
function p3sLongEdgeAng(pts) {
  let best = 0,
    ang = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length],
      L = Math.hypot(b.x - a.x, b.z - a.z);
    if (L > best) {
      best = L;
      ang = Math.atan2(b.z - a.z, b.x - a.x);
    }
  }
  return ang;
}
function p3sPitchPh(pts, lowIdx, base, pitchDeg) {
  const n = pts.length;
  if (n < 3) return pts.map(() => base);
  const A = pts[(lowIdx % n + n) % n],
    B = pts[((lowIdx % n + n) % n + 1) % n];
  const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
  let nx = -(B.z - A.z) / L,
    nz = (B.x - A.x) / L;
  const c = p3sCentroid(pts);
  if ((c.x - A.x) * nx + (c.z - A.z) * nz < 0) {
    nx = -nx;
    nz = -nz;
  }
  const t = Math.tan(p3sClamp(+pitchDeg || 0, 0, 60) * P3_DEG);
  return pts.map(p => p3sR(base + Math.max(0, (p.x - A.x) * nx + (p.z - A.z) * nz) * t));
}
function p3sEdgeBearing(pts, i) {
  const n = pts.length,
    A = pts[i],
    B = pts[(i + 1) % n];
  const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
  let nx = -(B.z - A.z) / L,
    nz = (B.x - A.x) / L;
  const c = p3sCentroid(pts);
  if ((c.x - A.x) * nx + (c.z - A.z) * nz > 0) {
    nx = -nx;
    nz = -nz;
  }
  return (Math.atan2(nx, -nz) / P3_DEG + 360) % 360;
}
function p3sSouthEdge(pts) {
  let best = 0,
    bd = 1e9;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.abs(p3sEdgeBearing(pts, i) - 180);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}
function p3sPolyPitch(roof) {
  try {
    const pl = p3PolyPlane(roof);
    return pl ? p3sR(Math.acos(p3sClamp(pl.tiltCos, -1, 1)) / P3_DEG, 10) : 0;
  } catch (e) {
    return 0;
  }
}
function p3sWeldFacets(roofs, focusIds, opt) {
  opt = opt || {};
  const tol = opt.tol || 0.4;
  const F = [];
  (roofs || []).forEach((r, ri) => {
    if (r.kind !== "poly" || !Array.isArray(r.pts) || r.pts.length < 3) return;
    const pitch = p3sPolyPitch(r);
    if (!(pitch > 0.4) && !r.p3sFacet) return;
    const ox = +r.x || 0,
      oz = +r.z || 0,
      ph = p3PhOf(r),
      n = r.pts.length;
    let lo = 0;
    if (r.p3sLow != null) lo = (+r.p3sLow % n + n) % n;else {
      let bv = 1e9;
      for (let i = 0; i < n; i++) {
        const v = ph[i] + ph[(i + 1) % n];
        if (v < bv) {
          bv = v;
          lo = i;
        }
      }
    }
    const P = r.pts.map((p, i) => ({
      x: ox + (+p.x || 0),
      z: oz + (+p.z || 0),
      y: ph[i],
      orig: i
    }));
    F.push({
      r,
      ri,
      P,
      lo,
      pitch,
      A: {
        x: P[lo].x,
        z: P[lo].z
      },
      B: {
        x: P[(lo + 1) % n].x,
        z: P[(lo + 1) % n].z
      },
      e: Math.min(ph[lo], ph[(lo + 1) % n])
    });
  });
  const none = {
    roofs,
    n: 0,
    gap: 0
  };
  if (F.length < 2) return none;
  F.forEach((f, fi) => {
    const out = [];
    f.P.forEach((a, i) => {
      out.push(a);
      const b = f.P[(i + 1) % f.P.length],
        L2 = (b.x - a.x) * (b.x - a.x) + (b.z - a.z) * (b.z - a.z);
      if (L2 < 1e-6) return;
      const ins = [];
      F.forEach((g, gi) => {
        if (gi === fi) return;
        g.P.forEach(v => {
          if (Math.hypot(v.x - a.x, v.z - a.z) < tol || Math.hypot(v.x - b.x, v.z - b.z) < tol) return;
          if (p3sDistSeg(v, a, b) >= tol) return;
          const t = ((v.x - a.x) * (b.x - a.x) + (v.z - a.z) * (b.z - a.z)) / L2;
          if (t <= 0 || t >= 1 || ins.some(q => Math.abs(q.t - t) * Math.sqrt(L2) < tol)) return;
          ins.push({
            t
          });
        });
      });
      ins.sort((p, q) => p.t - q.t).forEach(q => out.push({
        x: a.x + (b.x - a.x) * q.t,
        z: a.z + (b.z - a.z) * q.t,
        y: a.y + (b.y - a.y) * q.t,
        orig: -1
      }));
    });
    f.P = out;
  });
  const V = [];
  F.forEach((f, fi) => f.P.forEach(p => V.push({
    fi,
    p
  })));
  const par = V.map((_, i) => i),
    fnd = i => par[i] === i ? i : par[i] = fnd(par[i]);
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    if (V[i].fi !== V[j].fi && Math.hypot(V[i].p.x - V[j].p.x, V[i].p.z - V[j].p.z) < tol) par[fnd(i)] = fnd(j);
  }
  const CM = {};
  V.forEach((v, i) => {
    const k = fnd(i);
    (CM[k] = CM[k] || []).push(v);
  });
  const clusters = Object.keys(CM).map(k => CM[k]).filter(c => new Set(c.map(v => v.fi)).size > 1);
  if (!clusters.length) return none;
  const fp = F.map((_, i) => i),
    ff = i => fp[i] === i ? i : fp[i] = ff(fp[i]);
  clusters.forEach(c => c.forEach(v => {
    fp[ff(v.fi)] = ff(c[0].fi);
  }));
  const focus = focusIds && focusIds.length ? new Set(focusIds) : null;
  const act = new Set();
  F.forEach((f, i) => {
    if (!focus || focus.has(f.r.id)) act.add(ff(i));
  });
  const linked = new Set();
  clusters.forEach(c => c.forEach(v => linked.add(v.fi)));
  const use = F.map((f, i) => act.has(ff(i)) && linked.has(i));
  const U = [];
  use.forEach((u, i) => {
    if (u) U.push(i);
  });
  if (!U.length) return none;
  const uc = clusters.filter(c => use[c[0].fi]);
  V.forEach((v, i) => {
    v.p.cid = fnd(i);
    v.p.y0 = v.p.y;
  });
  const ek = (a, b) => a < b ? a + "_" + b : b + "_" + a,
    ecount = {};
  U.forEach(fi => {
    const P = F[fi].P;
    P.forEach((a, i) => {
      const k = ek(a.cid, P[(i + 1) % P.length].cid);
      ecount[k] = (ecount[k] || 0) + 1;
    });
  });
  U.forEach(fi => {
    const f = F[fi],
      P = f.P;
    f.loP = Math.max(0, P.findIndex(q => q.orig === f.lo));
    if (f.r.p3sEaveFix) return;
    let best = -1,
      bl = 0;
    P.forEach((a, i) => {
      const b = P[(i + 1) % P.length];
      if (ecount[ek(a.cid, b.cid)] > 1) return;
      const L = Math.hypot(b.x - a.x, b.z - a.z);
      if (L > bl + 1e-6) {
        bl = L;
        best = i;
      }
    });
    if (best >= 0) f.loP = best;
  });
  const med = a => {
    const b = a.slice().sort((x, y) => x - y);
    return b.length ? b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2 : null;
  };
  const fp0 = focus ? U.find(fi => focus.has(F[fi].r.id)) : null;
  let pc = opt.pitch != null ? +opt.pitch : null;
  if (pc == null && fp0 != null && +F[fp0].r.p3sPitch > 0) pc = +F[fp0].r.p3sPitch;
  if (pc == null) pc = med(U.map(fi => +F[fi].r.p3sPitch).filter(v => v > 0));
  if (pc == null) pc = med(U.map(fi => F[fi].pitch).filter(v => v >= 3));
  if (pc == null) pc = 20;
  pc = p3sClamp(pc, 1, 60);
  const k = Math.tan(pc * P3_DEG);
  const e = p3sR(med(U.map(fi => {
    const P = F[fi].P,
      i = F[fi].loP;
    return Math.min(P[i].y, P[(i + 1) % P.length].y);
  })) || 3);
  for (let it = 0; it < 4; it++) {
    U.forEach(fi => {
      const P = F[fi].P,
        A = P[F[fi].loP],
        B = P[(F[fi].loP + 1) % P.length];
      const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
      let nx = -(B.z - A.z) / L,
        nz = (B.x - A.x) / L;
      const c = p3sCentroid(P);
      if ((c.x - A.x) * nx + (c.z - A.z) * nz < 0) {
        nx = -nx;
        nz = -nz;
      }
      P.forEach(q => {
        q.y = e + k * Math.max(0, (q.x - A.x) * nx + (q.z - A.z) * nz);
      });
    });
    uc.forEach(c => {
      const sx = c.reduce((a, v) => a + v.p.x, 0) / c.length,
        sz = c.reduce((a, v) => a + v.p.z, 0) / c.length,
        sy = c.reduce((a, v) => a + v.p.y, 0) / c.length;
      c.forEach(v => {
        v.p.x = sx;
        v.p.z = sz;
        v.p.y = sy;
      });
    });
  }
  let gap = 0;
  U.forEach(fi => F[fi].P.forEach(q => {
    gap = Math.max(gap, Math.abs(q.y - q.y0));
  }));
  const out = roofs.slice();
  U.forEach(fi => {
    const f = F[fi],
      r = f.r,
      ox = +r.x || 0,
      oz = +r.z || 0;
    const nr = Object.assign({}, r, {
      pts: f.P.map(p => ({
        x: p3sR(p.x - ox),
        z: p3sR(p.z - oz)
      })),
      ph: f.P.map(p => p3sR(p.y)),
      p3sLow: f.loP,
      p3sPitch: p3sR(pc, 10)
    });
    if (opt.mark) nr.p3sFacet = true;
    out[f.ri] = nr;
  });
  return {
    roofs: out,
    n: U.length,
    gap
  };
}
function p3sBounds(st, photoAR) {
  let minX = 1e9,
    maxX = -1e9,
    minZ = 1e9,
    maxZ = -1e9;
  const eat = (x, z) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  };
  (st.roofs || []).forEach(r => p3sRoofPts(r).forEach(p => eat(p.x, p.z)));
  (st.obstacles || []).forEach(o => {
    const R = Math.max(+o.w || 1, +o.d || 1) / 2;
    eat((+o.x || 0) - R, (+o.z || 0) - R);
    eat((+o.x || 0) + R, (+o.z || 0) + R);
  });
  if (minX <= maxX) {
    const pad = Math.max(3, (maxX - minX) * 0.15);
    return {
      minX: minX - pad,
      maxX: maxX + pad,
      minZ: minZ - pad,
      maxZ: maxZ + pad
    };
  }
  if (st.baseMap && st.baseMap.url) {
    const W = (+st.baseMap.widthM || 30) / 2;
    eat(-W, -W);
    eat(W, W);
  }
  if (st.photo) {
    const W = (+st.photoW || 30) / 2,
      H = W * (photoAR || 1);
    eat((+st.photoX || 0) - W, (+st.photoZ || 0) - H);
    eat((+st.photoX || 0) + W, (+st.photoZ || 0) + H);
  }
  if (minX > maxX) return {
    minX: -15,
    maxX: 15,
    minZ: -12,
    maxZ: 12
  };
  return {
    minX,
    maxX,
    minZ,
    maxZ
  };
}
function p3sLoad(saved, job) {
  const base = p3Blank(job);
  if (!saved) return base;
  const m = Object.assign({}, base, saved, {
    sun: Object.assign({}, base.sun, saved.sun || {})
  });
  m.roofs = (saved.roofs || []).map(r => Object.assign({}, p3NewRoof(1), r, {
    skips: r.skips || {},
    pts: r.pts || null
  }));
  m.obstacles = saved.obstacles || [];
  m.measures = saved.measures || [];
  return m;
}
function p3sBlkStore(roof) {
  return p3Blocks(roof).map(b => ({
    id: b.id,
    orient: b.orient,
    rows: b.rows,
    cols: b.cols,
    gap: b.gap,
    du: b.du,
    dv: b.dv,
    rot: b.rot,
    tilt: b.tilt,
    skips: b.skips,
    adds: b.adds,
    gc: b.gc,
    gr: b.gr,
    gg: b.gg,
    keep: b.keep,
    face: b.face || null,
    patch: b.patch || null,
    only: b.patch ? b.only : null
  }));
}
function p3sZoneSplit(roof, sides) {
  const bs = p3sBlkStore(roof);
  if (!sides || sides.length < 2 || bs.every(b => b.face)) return bs;
  const src = [];
  bs.forEach((b, i) => {
    if (b.face) src.push({
      b,
      i
    });else sides.forEach(s => src.push({
      b: Object.assign({}, b, {
        face: s
      }),
      i,
      s
    }));
  });
  const remap = (m, i, j, face) => {
    const o = {},
      op = i === 0 ? "" : "b" + i + "_",
      np = j === 0 ? "" : "b" + j + "_";
    Object.keys(m || {}).forEach(k => {
      if (p3sBlkOfKey(k) !== i) return;
      const rest = k.slice(op.length);
      if (face && rest.indexOf(face + "_") !== 0) return;
      o[np + rest] = m[k];
    });
    return o;
  };
  return src.map((x, j) => Object.assign({}, x.b, {
    id: x.s ? (x.b.id || "b") + x.s : x.b.id,
    skips: remap(x.b.skips, x.i, j, x.b.face),
    adds: remap(x.b.adds, x.i, j, x.b.face),
    only: x.b.patch ? remap(x.b.only, x.i, j, x.b.face) : null
  }));
}
function p3sSideFix(r, o) {
  const nr = Object.assign({}, r, o),
    bs = p3sBlkStore(r);
  if (!bs.some(b => b.face)) return o;
  const add = [];
  ["A", "B", "C", "D"].forEach(s => {
    const on = s === "A" || s === "B" ? nr["side" + s] !== false : nr["side" + s] === true;
    if (on && !bs.some(b => b.face === s)) add.push(Object.assign({}, bs[0], {
      id: p3Id("pb"),
      face: s,
      skips: {},
      adds: {},
      only: {},
      du: 0,
      dv: 0
    }));
  });
  return add.length ? Object.assign({}, o, {
    blocks: bs.concat(add)
  }) : o;
}
function p3sSidesOf(roof) {
  try {
    const f = p3Panels(Object.assign({}, roof, {
      noPanel: null
    })).faces || [];
    return f.map(x => x.side).filter(Boolean);
  } catch (e) {
    return [];
  }
}
function p3sSplitAll(roof, bs) {
  const sides = p3sSidesOf(roof);
  if (sides.length < 2) return bs;
  return p3sZoneSplit(Object.assign({}, roof, {
    blocks: bs
  }), sides);
}
function p3sPatchGroups(bs) {
  const rcOf = k => {
    const m = /(-?\d+)_(-?\d+)$/.exec(k);
    return m ? [k.slice(0, m.index), +m[1], +m[2]] : null;
  };
  const src = [];
  bs.forEach((b, i) => {
    const op = i === 0 ? "" : "b" + i + "_";
    if (!b.patch) {
      src.push({
        b,
        i
      });
      return;
    }
    const ks = Object.keys(b.only || {}).filter(k => b.only[k] && p3sBlkOfKey(k) === i).map(k => k.slice(op.length));
    const par = {};
    ks.forEach(k => {
      par[k] = k;
    });
    const find = k => {
      while (par[k] !== k) {
        par[k] = par[par[k]];
        k = par[k];
      }
      return k;
    };
    ks.forEach(k => {
      const a = rcOf(k);
      if (!a) return;
      [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => {
        const n = a[0] + (a[1] + dr) + "_" + (a[2] + dc);
        if (par[n] != null) par[find(n)] = find(k);
      });
    });
    const comp = {};
    ks.forEach(k => {
      const r = find(k);
      (comp[r] = comp[r] || []).push(k);
    });
    const cs = Object.keys(comp).map(r => comp[r]);
    if (!cs.length) {
      src.push({
        b,
        i,
        rests: [],
        empty: true
      });
      return;
    }
    cs.forEach((c, n) => src.push({
      b: n ? Object.assign({}, b, {
        id: p3Id("pb")
      }) : b,
      i,
      rests: c
    }));
  });
  const keep = src.filter((x, xi) => !x.empty || !src.some((y, yi) => yi !== xi && (y.b.face || "") === (x.b.face || "") && (!y.empty || yi < xi)));
  return keep.map((x, j) => {
    const op = x.i === 0 ? "" : "b" + x.i + "_",
      np = j === 0 ? "" : "b" + j + "_";
    const re = m => {
      const o = {};
      Object.keys(m || {}).forEach(k => {
        if (p3sBlkOfKey(k) !== x.i) return;
        o[np + k.slice(op.length)] = m[k];
      });
      return o;
    };
    if (!x.b.patch) return Object.assign({}, x.b, {
      skips: re(x.b.skips),
      adds: re(x.b.adds)
    });
    const only = {};
    x.rests.forEach(k => {
      only[np + k] = true;
    });
    return Object.assign({}, x.b, {
      only,
      skips: {},
      adds: {}
    });
  });
}
function p3sMarqPatch(r, bs, inR) {
  const R = blocks => Object.assign({}, r, {
    noPanel: null,
    blocks
  });
  const onQ = p3sQuads(R(bs)).filter(q => !q.skip && !q.slot);
  const gridOf = (blocks, i) => p3sQuads(R(blocks.map((b, k) => k === i ? Object.assign({}, b, {
    patch: false,
    only: null,
    skips: {},
    adds: {}
  }) : Object.assign({}, b, {
    patch: true,
    only: {}
  })))).filter(q => !q.slot && q.blk === i);
  const busy = (q, i) => onQ.some(o => o.blk !== i && (p3InPoly(q.cx, q.cz, o.pts) || p3InPoly(o.cx, o.cz, q.pts)));
  const near = (b, k) => {
    const m = /(-?\d+)_(-?\d+)$/.exec(k);
    if (!m) return false;
    const pre = k.slice(0, m.index);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (b.only[pre + (+m[1] + dr) + "_" + (+m[2] + dc)]) return true;
    return false;
  };
  const nb = bs.map(b => Object.assign({}, b, {
    only: b.patch ? Object.assign({}, b.only || {}) : b.only
  }));
  let added = 0;
  const done = {};
  nb.forEach((b, i) => {
    const f = b.face || "";
    if (!b.patch || done[f] || !Object.keys(b.only).length) return;
    const cand = gridOf(nb, i).filter(q => inR(q) && !b.only[q.key] && !busy(q, i));
    if (!cand.length || !cand.some(q => near(b, q.key))) return;
    cand.forEach(q => {
      b.only[q.key] = true;
    });
    added += cand.length;
    done[f] = 1;
  });
  const faces = [];
  nb.forEach(b => {
    const f = b.face || "";
    if (b.patch && faces.indexOf(f) < 0) faces.push(f);
  });
  faces.forEach(f => {
    if (done[f] || onQ.some(o => inR(o) && ((bs[o.blk] || {}).face || "") === f)) return;
    let i = nb.findIndex(b => b.patch && (b.face || "") === f && !Object.keys(b.only).length);
    if (i < 0) {
      const t = nb.find(b => b.patch && (b.face || "") === f);
      nb.push(Object.assign({}, t, {
        id: p3Id("pb"),
        du: 0,
        dv: 0,
        rot: +p3sFillPatch(r, "portrait").blocks[0].rot || 0,
        only: {},
        skips: {},
        adds: {}
      }));
      i = nb.length - 1;
    }
    const cand = gridOf(nb, i).filter(q => inR(q) && !busy(q, i));
    cand.forEach(q => {
      nb[i].only[q.key] = true;
    });
    added += cand.length;
  });
  if (!added) {
    const rm = onQ.filter(inR);
    if (!rm.length) return null;
    rm.forEach(q => {
      const b = nb[q.blk];
      if (!b) return;
      if (b.patch) delete b.only[q.key];else {
        b.skips = Object.assign({}, b.skips || {});
        b.skips[q.key] = true;
      }
    });
  }
  return p3sPatchGroups(nb);
}
function p3sRotKeep(r, bs0, bs1) {
  const idx = bs1.map((b, i) => i).filter(i => bs1[i].patch && bs0[i] && Math.abs((+bs0[i].rot || 0) - (+bs1[i].rot || 0)) > 1e-6);
  if (!idx.length) return bs1;
  const cen = bs => {
    const m = {};
    p3sQuads(Object.assign({}, r, {
      noPanel: null,
      blocks: bs
    })).forEach(q => {
      if (q.skip || q.slot) return;
      const o = m[q.blk] = m[q.blk] || {
        x: 0,
        z: 0,
        n: 0
      };
      o.x += q.cx;
      o.z += q.cz;
      o.n++;
    });
    return m;
  };
  const c0 = cen(bs0);
  let out = bs1.slice();
  for (let it = 0; it < 2; it++) {
    const r1 = Object.assign({}, r, {
        noPanel: null,
        blocks: out
      }),
      c1 = cen(out);
    let pan;
    try {
      pan = p3Panels(r1);
    } catch (e) {
      return out;
    }
    idx.forEach(i => {
      const a = c0[i],
        b = c1[i];
      if (!a || !b) return;
      const rc = (pan.rects || []).find(x => x.blk === i),
        fn = rc && p3sSurfFn(r1, rc.side);
      if (!fn) return;
      const d = p3sInvJ(p3sJac(fn, rc.cu, rc.cv), a.x / a.n - b.x / b.n, a.z / a.n - b.z / b.n);
      out[i] = Object.assign({}, out[i], {
        du: p3sR((+out[i].du || 0) + d.du, 1000),
        dv: p3sR((+out[i].dv || 0) + d.dv, 1000)
      });
    });
  }
  return out;
}
const p3sBlkOfKey = key => {
  const m = /^b(\d+)_/.exec(key || "");
  return m ? +m[1] : 0;
};
const _p3sImgs = {};
function p3sImg(url) {
  if (!_p3sImgs[url]) {
    _p3sImgs[url] = new Promise((res, rej) => {
      const im = new Image();
      if (!/^data:/.test(url)) im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => {
        delete _p3sImgs[url];
        rej(new Error("โหลดภาพไม่สำเร็จ"));
      };
      im.src = url;
    });
  }
  return _p3sImgs[url];
}
function p3sSimplify(pts, eps) {
  if (pts.length < 4) return pts.slice();
  const dp = (a, b, arr) => {
    let mx = -1,
      mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = p3sDistSeg(arr[i], arr[a], arr[b]);
      if (d > mx) {
        mx = d;
        mi = i;
      }
    }
    if (mx > eps) return dp(a, mi, arr).concat(dp(mi, b, arr).slice(1));
    return [arr[a], arr[b]];
  };
  let far = 0,
    fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[0].x, pts[i].z - pts[0].z);
    if (d > fd) {
      fd = d;
      far = i;
    }
  }
  const A = dp(0, far, pts),
    B = dp(far, pts.length, pts.concat([pts[0]]));
  return A.concat(B.slice(1, -1));
}
function p3sClean(pts) {
  let P = pts.slice();
  for (let it = 0; it < 2000 && P.length > 4; it++) {
    const n = P.length;
    let worst = -1,
      wv = 1e9;
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n],
        b = P[i],
        c = P[(i + 1) % n];
      const l1 = Math.hypot(b.x - a.x, b.z - a.z),
        l2 = Math.hypot(c.x - b.x, c.z - b.z);
      const t = Math.abs(Math.atan2((b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x), (b.x - a.x) * (c.x - b.x) + (b.z - a.z) * (c.z - b.z)));
      const score = Math.min(l1, l2) < 0.8 ? Math.min(l1, l2) - 10 : t < 15 * P3_DEG ? t : 1e9;
      if (score < wv) {
        wv = score;
        worst = i;
      }
    }
    if (worst < 0 || wv >= 1e9) break;
    P.splice(worst, 1);
  }
  return P;
}
async function p3sTrace(st, seed, tol) {
  const layers = [];
  try {
    if (st.baseMap && st.baseMap.url) layers.push({
      img: await p3sImg(st.baseMap.url),
      base: true
    });
    if (st.photo) layers.push({
      img: await p3sImg(st.photo),
      base: false
    });
  } catch (e) {
    return {
      err: e.message
    };
  }
  if (!layers.length) return {
    err: "ยังไม่มีภาพพื้นหลัง — เพิ่มภาพดาวเทียมหรือรูปโดรนก่อน"
  };
  const res = 0.1,
    Wm = 120,
    N = Math.round(Wm / res);
  const cv = document.createElement("canvas");
  cv.width = N;
  cv.height = N;
  const ctx = cv.getContext("2d", {
    willReadFrequently: true
  });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, N, N);
  const ox = seed.x - Wm / 2,
    oz = seed.z - Wm / 2;
  ctx.setTransform(1 / res, 0, 0, 1 / res, -ox / res, -oz / res);
  layers.forEach(L => {
    if (L.base) {
      const W = +st.baseMap.widthM || 30;
      ctx.drawImage(L.img, -W / 2, -W / 2, W, W);
    } else {
      const pw = +st.photoW || 30,
        ph = pw * (L.img.naturalHeight / (L.img.naturalWidth || 1));
      ctx.save();
      ctx.translate(+st.photoX || 0, +st.photoZ || 0);
      ctx.rotate((+st.photoRot || 0) * P3_DEG);
      ctx.drawImage(L.img, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  let data;
  try {
    data = ctx.getImageData(0, 0, N, N).data;
  } catch (e) {
    return {
      err: "ภาพนี้ใช้ตัวช่วยวาดไม่ได้ (ภาพจากเซิร์ฟเวอร์อื่น) — วาดเองได้ตามปกติ"
    };
  }
  const R = new Float32Array(N * N),
    G = new Float32Array(N * N),
    B = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let r = 0,
      g = 0,
      b = 0,
      n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx,
        yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
      const k = (yy * N + xx) * 4;
      r += data[k];
      g += data[k + 1];
      b += data[k + 2];
      n++;
    }
    const i = y * N + x;
    R[i] = r / n;
    G[i] = g / n;
    B[i] = b / n;
  }
  const sx = Math.floor(N / 2),
    sy = Math.floor(N / 2);
  let mr = 0,
    mg = 0,
    mb = 0,
    mn = 0;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const i = (sy + dy) * N + sx + dx;
    mr += R[i];
    mg += G[i];
    mb += B[i];
    mn++;
  }
  mr /= mn;
  mg /= mn;
  mb /= mn;
  const T2 = tol * tol;
  const mask = new Uint8Array(N * N),
    q = new Int32Array(N * N);
  let qh = 0,
    qt = 0,
    area = 0,
    edge = 0;
  mask[sy * N + sx] = 1;
  q[qt++] = sy * N + sx;
  while (qh < qt) {
    const i = q[qh++];
    area++;
    const x = i % N,
      y = i / N | 0;
    if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edge++;
    const nb = [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1];
    for (let k = 0; k < 4; k++) {
      const j = nb[k];
      if (j < 0 || mask[j]) continue;
      const dr = R[j] - mr,
        dg = G[j] - mg,
        db = B[j] - mb;
      if (dr * dr + dg * dg + db * db <= T2) {
        mask[j] = 1;
        q[qt++] = j;
      }
    }
  }
  if (area < 120) return {
    err: "พื้นที่ที่จับได้เล็กเกินไป — ลองเพิ่มความไว หรือแตะกลางหลังคาให้ชัดขึ้น"
  };
  if (edge > N * 0.6 || area > N * N * 0.7) return {
    err: "สีหลังคากลืนกับรอบข้าง ขอบไม่ชัด — ลองลดความไว หรือวาดเอง"
  };
  const morph = (src, grow) => {
    const out = new Uint8Array(N * N),
      rad = 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = grow ? 0 : 1;
      for (let dy = -rad; dy <= rad && (grow ? !v : v); dy++) for (let dx = -rad; dx <= rad; dx++) {
        const xx = x + dx,
          yy = y + dy;
        const s = xx < 0 || yy < 0 || xx >= N || yy >= N ? 0 : src[yy * N + xx];
        if (grow && s) {
          v = 1;
          break;
        }
        if (!grow && !s) {
          v = 0;
          break;
        }
      }
      out[y * N + x] = v;
    }
    return out;
  };
  let m2 = morph(morph(mask, true), false);
  const outside = new Uint8Array(N * N);
  qh = 0;
  qt = 0;
  for (let i = 0; i < N; i++) [i, (N - 1) * N + i, i * N, i * N + N - 1].forEach(j => {
    if (!m2[j] && !outside[j]) {
      outside[j] = 1;
      q[qt++] = j;
    }
  });
  while (qh < qt) {
    const i = q[qh++],
      x = i % N,
      y = i / N | 0;
    [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1].forEach(j => {
      if (j >= 0 && !m2[j] && !outside[j]) {
        outside[j] = 1;
        q[qt++] = j;
      }
    });
  }
  for (let i = 0; i < N * N; i++) if (!outside[i]) m2[i] = 1;
  const ins = (x, y) => x >= 0 && y >= 0 && x < N && y < N && m2[y * N + x] === 1;
  const nxt = new Map();
  const add = (ax, ay, bx, by) => {
    const k = ax + "," + ay;
    const a = nxt.get(k);
    const v = [bx, by];
    if (a) a.push(v);else nxt.set(k, [v]);
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!m2[y * N + x]) continue;
    if (!ins(x, y - 1)) add(x, y, x + 1, y);
    if (!ins(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!ins(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!ins(x - 1, y)) add(x, y + 1, x, y);
  }
  let best = null;
  nxt.forEach((_, k0) => {
    if (!nxt.get(k0) || !nxt.get(k0).length) return;
    const loop = [];
    let k = k0,
      guard = 0;
    while (guard++ < 400000) {
      const arr = nxt.get(k);
      if (!arr || !arr.length) break;
      const v = arr.pop();
      if (!arr.length) nxt.delete(k);
      const [x, y] = k.split(",").map(Number);
      loop.push({
        x,
        z: y
      });
      k = v[0] + "," + v[1];
      if (k === k0) break;
    }
    if (loop.length > 8 && (!best || loop.length > best.length)) best = loop;
  });
  if (!best) return {
    err: "หาขอบหลังคาไม่เจอ — ลองแตะใหม่หรือวาดเอง"
  };
  let poly = p3sClean(p3sSimplify(best, 0.45 / res).map(p => ({
    x: p3sR(ox + p.x * res),
    z: p3sR(oz + p.z * res)
  })));
  if (poly.length < 3) return {
    err: "หาขอบหลังคาไม่เจอ — ลองแตะใหม่หรือวาดเอง"
  };
  const mr0 = p3MinRect(poly),
    A = p3Area(poly);
  if (mr0 && A / mr0.area > 0.9) {
    const c = Math.cos(mr0.ang),
      s = Math.sin(mr0.ang);
    poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const u = a * mr0.w / 2,
        v = b * mr0.d / 2;
      return {
        x: p3sR(mr0.cx + u * c - v * s),
        z: p3sR(mr0.cz + u * s + v * c)
      };
    });
  }
  return {
    pts: poly,
    area: p3sR(p3Area(poly), 10),
    warn: poly.length > 14 ? "ขอบหยักผิดปกติ อาจรวมพื้นที่รอบ ๆ เข้ามา — ลองลดความไว หรือใช้แล้วลากมุมปรับ" : null
  };
}
async function p3sEdgeField(st, center, Wm, res) {
  const layers = [];
  try {
    if (st.baseMap && st.baseMap.url) layers.push({
      img: await p3sImg(st.baseMap.url),
      base: true
    });
    if (st.photo) layers.push({
      img: await p3sImg(st.photo),
      base: false
    });
  } catch (e) {
    return {
      err: e.message
    };
  }
  if (!layers.length) return {
    err: "ยังไม่มีภาพพื้นหลัง"
  };
  const N = Math.round(Wm / res);
  const cv = document.createElement("canvas");
  cv.width = N;
  cv.height = N;
  const ctx = cv.getContext("2d", {
    willReadFrequently: true
  });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, N, N);
  const ox = center.x - Wm / 2,
    oz = center.z - Wm / 2;
  ctx.setTransform(1 / res, 0, 0, 1 / res, -ox / res, -oz / res);
  layers.forEach(L => {
    if (L.base) {
      const W = +st.baseMap.widthM || 30;
      ctx.drawImage(L.img, -W / 2, -W / 2, W, W);
    } else {
      const pw = +st.photoW || 30,
        ph = pw * (L.img.naturalHeight / (L.img.naturalWidth || 1));
      ctx.save();
      ctx.translate(+st.photoX || 0, +st.photoZ || 0);
      ctx.rotate((+st.photoRot || 0) * P3_DEG);
      ctx.globalAlpha = 1;
      ctx.drawImage(L.img, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();
    }
  });
  let data;
  try {
    data = ctx.getImageData(0, 0, N, N).data;
  } catch (e) {
    return {
      err: "ภาพนี้อ่านขอบไม่ได้ (ภาพจากเซิร์ฟเวอร์อื่น)"
    };
  }
  const Y = new Float32Array(N * N),
    hist = new Uint32Array(256);
  for (let i = 0, k = 0; i < N * N; i++, k += 4) {
    const v = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
    Y[i] = v;
    if (data[k + 3] > 0) hist[v | 0]++;
  }
  let tot = 0;
  for (let i = 0; i < 256; i++) tot += hist[i];
  let acc = 0,
    lo = 0,
    hi = 255;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc < tot * 0.02) lo = i;
    if (acc < tot * 0.98) hi = i + 1;
  }
  const sc = 255 / Math.max(12, hi - lo);
  const B = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = y * N + x;
    B[i] = (Y[i - N - 1] + Y[i - N] + Y[i - N + 1] + Y[i - 1] + Y[i] + Y[i + 1] + Y[i + N - 1] + Y[i + N] + Y[i + N + 1]) / 9;
  }
  for (let i = 0; i < N * N; i++) B[i] = Math.max(0, Math.min(255, (B[i] - lo) * sc));
  const gx = new Float32Array(N * N),
    gz = new Float32Array(N * N),
    mag = new Float32Array(N * N);
  const samp = [];
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
    const i = y * N + x;
    const a = B[i - N - 1],
      b = B[i - N],
      c = B[i - N + 1],
      d = B[i - 1],
      f = B[i + 1],
      g = B[i + N - 1],
      h = B[i + N],
      k = B[i + N + 1];
    const X = c + 2 * f + k - (a + 2 * d + g),
      Z = g + 2 * h + k - (a + 2 * b + c);
    gx[i] = X;
    gz[i] = Z;
    const m = Math.hypot(X, Z);
    mag[i] = m;
    if ((i & 63) === 0) samp.push(m);
  }
  samp.sort((p, q) => p - q);
  const p90 = samp[Math.floor(samp.length * 0.9)] || 1;
  return {
    ox,
    oz,
    res,
    N,
    gx,
    gz,
    mag,
    p90,
    Wm,
    cx: center.x,
    cz: center.z
  };
}
function p3sEF(F, x, z) {
  const px = Math.round((x - F.ox) / F.res),
    pz = Math.round((z - F.oz) / F.res);
  if (px < 2 || pz < 2 || px >= F.N - 2 || pz >= F.N - 2) return -1;
  return pz * F.N + px;
}
function p3sDetectAxis(F, c, R) {
  const bins = 180,
    H = new Float64Array(bins);
  const r = Math.round(R / F.res),
    cx = Math.round((c.x - F.ox) / F.res),
    cz = Math.round((c.z - F.oz) / F.res);
  const thr = F.p90 * 0.6;
  for (let y = Math.max(2, cz - r); y < Math.min(F.N - 2, cz + r); y++) for (let x = Math.max(2, cx - r); x < Math.min(F.N - 2, cx + r); x++) {
    const i = y * F.N + x,
      m = F.mag[i];
    if (m < thr) continue;
    let a = Math.atan2(F.gz[i], F.gx[i]) / P3_DEG;
    a = (a % 90 + 90) % 90;
    H[Math.floor(a / 90 * bins) % bins] += m * m;
  }
  let best = -1,
    bv = 0;
  for (let i = 0; i < bins; i++) {
    let v = 0;
    for (let k = -3; k <= 3; k++) v += H[(i + k + bins) % bins] * (4 - Math.abs(k));
    if (v > bv) {
      bv = v;
      best = i;
    }
  }
  if (best < 0 || !(bv > 0)) return null;
  const v = i => {
    let s = 0;
    for (let k = -3; k <= 3; k++) s += H[(i + k + 2 * bins) % bins] * (4 - Math.abs(k));
    return s;
  };
  const y0 = v(best - 1),
    y1 = v(best),
    y2 = v(best + 1),
    den = y0 - 2 * y1 + y2;
  const off = Math.abs(den) > 1e-9 ? p3sClamp(0.5 * (y0 - y2) / den, -0.5, 0.5) : 0;
  let deg = (best + 0.5 + off) * 90 / bins;
  if (deg > 45) deg -= 90;
  return p3sR(deg, 10);
}
function p3sRay(F, s, ux, uz, maxL) {
  const step = F.res,
    n = Math.floor(maxL / step),
    prof = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const i = p3sEF(F, s.x + ux * k * step, s.z + uz * k * step);
    if (i < 0) {
      prof[k] = 0;
      continue;
    }
    prof[k] = Math.abs(F.gx[i] * ux + F.gz[i] * uz);
  }
  const sm = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let a = 0,
      c = 0;
    for (let j = -2; j <= 2; j++) {
      if (k + j >= 0 && k + j < n) {
        a += prof[k + j];
        c++;
      }
    }
    sm[k] = a / c;
  }
  let mx = 0;
  for (let k = 0; k < n; k++) mx = Math.max(mx, sm[k]);
  if (!(mx > F.p90 * 0.35)) return null;
  const k0 = Math.round(0.8 / step);
  for (let k = k0 + 1; k < n - 1; k++) {
    if (sm[k] >= mx * 0.42 && sm[k] >= sm[k - 1] && sm[k] >= sm[k + 1]) return k * step;
  }
  return null;
}
const P3S_KINDS = [["flat", "ราบ"], ["parapet", "ดาดฟ้ามีขอบกันตก"], ["shed", "เพิง"], ["gable", "จั่ว"], ["hip", "ปั้นหยา"], ["manila", "มนิลา"], ["dome", "ครึ่งวงกลม"], ["lshape", "จั่วตัว L"], ["tshape", "จั่วตัว T"], ["mgable", "จั่วหลายช่วง"], ["monitor", "จั่วยกสัน"], ["saw", "ฟันเลื่อย"], ["carport", "โรงจอดรถโซลาร์"], ["ground", "ติดตั้งบนพื้นดิน"], ["facet", "ทีละผืน"]];
const P3S_KINDS_BASE = P3S_KINDS.filter(o => ["flat", "shed", "gable", "hip", "dome", "facet"].indexOf(o[0]) >= 0);
const P3S_KIND_TH = P3S_KINDS.reduce((a, o) => {
  a[o[0]] = o[1];
  return a;
}, {});
const P3S_KIND_D = {
  flat: "ดาดฟ้า · หลังคาเรียบ",
  parapet: "ดาดฟ้าคอนกรีต · ขอบกันตกสูง 1 ม. แผงเว้นขอบ",
  shed: "ลาดด้านเดียว · ต้องแตะขอบด้านต่ำ",
  gable: "สองลาด สันตามด้านยาว",
  hip: "สี่ลาด",
  manila: "ปั้นหยา + จั่วเล็กบนยอด (บ้าน)",
  dome: "โค้งตามด้านยาว · กลับทิศได้",
  lshape: "บ้านมีปีกยื่นที่ปลายด้านหนึ่ง",
  tshape: "บ้านมีปีกยื่นตรงกลาง",
  mgable: "โรงงาน/โกดัง · จั่วต่อกันหลายช่วง (ทรง M)",
  monitor: "โกดัง · จั่วเล็กซ้อนบนสัน เว้นช่องระบายอากาศ",
  saw: "โรงงาน · ลาดเดียวซ้ำ ลาดลงทิศใต้",
  carport: "หลังคาบนเสา ไม่มีผนัง · ลาด 5°",
  ground: "โซลาร์ฟาร์ม · แผงบนขาตั้งเอียง 15°",
  facet: "หลังคาซับซ้อน · คลิกไล่มุม"
};
const P3S_MATS = [["metal", "เมทัลชีทลอน"], ["kliplok", "เมทัลชีทล็อกตะเข็บ (Kliplok)"], ["sandwich", "เมทัลชีทบุฉนวน PU"], ["cpac", "กระเบื้องคอนกรีต"], ["ceramic", "กระเบื้องเซรามิก/ดินเผา"], ["shingle", "ชิงเกิ้ลรูฟ"], ["fiber", "กระเบื้องลอนคู่"], ["concrete", "พื้นคอนกรีต (ดาดฟ้า)"]];
const P3S_ROOF_COLS = [["#e8e6df", "ขาวครีม"], ["#b9bec4", "เงิน"], ["#5d636a", "เทาเข้ม"], ["#2e3236", "ดำ"], ["#a8322c", "แดง"], ["#c4622d", "ส้มอิฐ"], ["#6b4430", "น้ำตาล"], ["#2f5d8a", "น้ำเงิน"], ["#3d6e4a", "เขียว"], ["#b8a27a", "ทราย"]];
function p3sRoofMat(r) {
  if (r && r.p3sMat && P3S_MATS.some(o => o[0] === r.p3sMat)) return r.p3sMat;
  const k = r && r.p3sKind;
  if (k === "parapet") return "concrete";
  if (k === "manila" || k === "lshape" || k === "tshape") return "cpac";
  return "metal";
}
const P3S_MULTI = {
  mgable: 1,
  saw: 1,
  monitor: 1,
  manila: 1,
  lshape: 1,
  tshape: 1
};
const P3S_SPANS = {
  mgable: 1,
  saw: 1
};
function p3sRoofFromRect(wpts, kind, n, EAVE) {
  if (kind === "parapet" || kind === "ground") {
    const r = p3sRoofFromRect(wpts, "flat", n, kind === "ground" ? 0.05 : EAVE);
    if (!r) return null;
    if (kind === "parapet") {
      r.p3sParapet = 1;
      r.margin = 0.8;
    } else {
      r.p3sGround = true;
      r.margin = 1;
      r.blocks = [Object.assign({}, r.blocks[0], {
        tilt: 15
      })];
    }
    r.p3sKind = kind;
    return r;
  }
  if (kind === "carport") {
    const r = p3sRoofFromRect(wpts, "shed", n, 2.6);
    if (!r) return null;
    r.ph = p3sPitchPh(r.pts, r.p3sLow, 2.6, 5);
    r.p3sOpen = true;
    r.p3sKind = kind;
    return r;
  }
  let nr;
  if (kind === "gable" || kind === "hip" || kind === "dome") {
    const R = p3MinRect(wpts);
    if (!R) return null;
    const long = Math.max(R.w, R.d),
      short = Math.min(R.w, R.d);
    const ang = R.w >= R.d ? R.ang : R.ang + Math.PI / 2;
    const az = p3sR(((180 + ang / P3_DEG) % 360 + 360) % 360, 10);
    const base = kind === "gable" ? Object.assign(p3NewGable(n), {
      ridge: p3sR(long),
      span: p3sR(short),
      pitch: 20
    }) : kind === "dome" ? Object.assign(p3NewDome(n), {
      ridge: p3sR(long),
      span: p3sR(short),
      rise: p3sR(short / 2),
      maxTilt: 90
    }) : Object.assign(p3NewHip(n), {
      w: p3sR(long),
      d: p3sR(short),
      pitch: 25
    });
    nr = Object.assign(base, {
      x: p3sR(R.cx),
      z: p3sR(R.cz),
      az,
      h: EAVE
    });
  } else {
    const c = p3sCentroid(wpts);
    const rel = wpts.map(p => ({
      x: p3sR(p.x - c.x),
      z: p3sR(p.z - c.z)
    }));
    nr = Object.assign(p3NewRoof(n), {
      kind: "poly",
      x: p3sR(c.x),
      z: p3sR(c.z),
      h: 0.05,
      pts: rel,
      ph: rel.map(() => EAVE),
      margin: 0.3
    });
    if (kind === "shed") {
      const lo = p3sSouthEdge(rel);
      nr.p3sLow = lo;
      nr.ph = p3sPitchPh(rel, lo, EAVE, 10);
    } else {
      const rot = p3sAlignRot(nr, null, p3sLongEdgeAng(wpts));
      nr.blocks = [Object.assign(p3NewBlk(0), {
        rot
      })];
    }
  }
  nr.noPanel = true;
  return nr;
}
function p3sMultiRoof(wpts, kind, spans, n0, EAVE) {
  const R = p3MinRect(wpts);
  if (!R) return [];
  const N = Math.max(2, Math.min(20, Math.round(+spans || 3)));
  const uL = R.w >= R.d ? {
    x: Math.cos(R.ang),
    z: Math.sin(R.ang)
  } : {
    x: -Math.sin(R.ang),
    z: Math.cos(R.ang)
  };
  const uS = {
      x: -uL.z,
      z: uL.x
    },
    long = Math.max(R.w, R.d),
    short = Math.min(R.w, R.d),
    sw = short / N;
  const grp = p3Id("g"),
    out = [];
  const box = (q, o, lL, lS) => {
    const cx = R.cx + uL.x * q + uS.x * o,
      cz = R.cz + uL.z * q + uS.z * o;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => ({
      x: p3sR(cx + uL.x * a * lL / 2 + uS.x * b * lS / 2),
      z: p3sR(cz + uL.z * a * lL / 2 + uS.z * b * lS / 2)
    }));
  };
  const tag = list => list.filter(Boolean).map(r => Object.assign(r, {
    grp,
    p3sMulti: kind,
    p3sKind: kind
  }));
  const T = d => Math.tan(d * P3_DEG);
  if (kind === "monitor") {
    const main = p3sRoofFromRect(box(0, 0, long, short), "gable", n0, EAVE),
      sS = Math.max(1.5, short * 0.22);
    const up = p3sRoofFromRect(box(0, 0, long * 0.92, sS), "gable", n0 + 1, EAVE);
    if (main && up) {
      main.pitch = 20;
      up.pitch = 20;
      up.h = p3sR(EAVE + short / 2 * T(20) - sS / 2 * T(20) + 0.9);
    }
    return tag([main, up]);
  }
  if (kind === "manila") {
    const hip = p3sRoofFromRect(box(0, 0, long, short), "hip", n0, EAVE);
    const gl = Math.max(1, long - short / 2),
      cap = p3sRoofFromRect(box(0, 0, gl, short / 2), "gable", n0 + 1, EAVE);
    if (hip && cap) {
      hip.pitch = 30;
      cap.pitch = 30;
      cap.h = p3sR(EAVE + short / 4 * T(30) + 0.04);
      if (gl < short / 2) {
        cap.ridge = p3sR(gl);
        cap.span = p3sR(short / 2);
      }
    }
    return tag([hip, cap]);
  }
  if (kind === "lshape" || kind === "tshape") {
    const s0 = Math.min(short * 0.45, long * 0.4);
    const t0 = box(0, -1, long, 1),
      b0 = Math.abs(p3sEdgeBearing(t0, 0) - 0),
      b2 = Math.abs(p3sEdgeBearing(t0, 2) - 0);
    const nS = Math.min(b0, 360 - b0) <= Math.min(b2, 360 - b2) ? -1 : 1;
    const oM = nS * (short / 2 - s0 / 2),
      far = -nS * short / 2,
      legL = short - s0 / 2;
    const main = p3sRoofFromRect(box(0, oM, long, s0), "gable", n0, EAVE);
    const leg = p3sRoofFromRect(box(kind === "lshape" ? -long / 2 + s0 / 2 : 0, (oM + far) / 2, s0, legL), "gable", n0 + 1, EAVE);
    if (main && leg) {
      main.pitch = 25;
      leg.pitch = 25;
    }
    return tag([main, leg]);
  }
  for (let i = 0; i < N; i++) {
    const o = -short / 2 + (i + 0.5) * sw,
      cx = R.cx + uS.x * o,
      cz = R.cz + uS.z * o;
    const P = (a, b) => ({
      x: p3sR(cx + uL.x * a * long / 2 + uS.x * b * sw / 2),
      z: p3sR(cz + uL.z * a * long / 2 + uS.z * b * sw / 2)
    });
    const pts = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)];
    const r = p3sRoofFromRect(pts, kind === "saw" ? "shed" : "gable", n0 + i, EAVE);
    if (!r) continue;
    if (kind === "saw") {
      let lo = 0,
        bv = Infinity;
      [0, 2].forEach(k => {
        const v = Math.abs(p3sEdgeBearing(r.pts, k) - 180);
        if (v < bv) {
          bv = v;
          lo = k;
        }
      });
      r.p3sLow = lo;
      r.ph = p3sPitchPh(r.pts, lo, EAVE, 20);
    }
    r.grp = grp;
    r.p3sMulti = kind;
    r.p3sKind = kind;
    out.push(r);
  }
  return out;
}
function P3SKindArt({
  k
}) {
  const st = {
    fill: "rgba(37,99,235,.14)",
    stroke: "#1e3a8a",
    strokeWidth: 1.6,
    strokeLinejoin: "round"
  };
  const ln = {
    fill: "none",
    stroke: "#1e3a8a",
    strokeWidth: 1.6,
    strokeLinejoin: "round"
  };
  return React.createElement("svg", {
    width: "64",
    height: "42",
    viewBox: "0 0 64 42"
  }, k === "flat" && React.createElement("path", _extends({
    d: "M8 24 L30 16 L56 22 L34 31 Z"
  }, st)), k === "shed" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M8 28 L32 34 L56 18 L32 10 Z"
  }, st)), React.createElement("path", _extends({
    d: "M8 28 L8 34 L32 40 L32 34"
  }, ln))), k === "gable" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M6 26 L22 12 L50 12 L58 28 L30 30 Z"
  }, st)), React.createElement("path", _extends({
    d: "M22 12 L30 30 M6 26 L30 30"
  }, ln))), k === "hip" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M6 28 L20 14 L44 14 L58 28 Z"
  }, st)), React.createElement("path", _extends({
    d: "M20 14 L26 28 M44 14 L40 28 M6 28 L58 28"
  }, ln))), k === "dome" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M6 32 A16 16 0 0 1 38 32 L58 26 A16 16 0 0 0 26 26 Z"
  }, st)), React.createElement("path", _extends({
    d: "M22 16 L42 10"
  }, ln))), k === "mgable" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M4 30 L12 18 L20 30 L28 18 L36 30 L44 18 L52 30 Z"
  }, st))), k === "saw" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M4 32 L4 18 L18 32 L18 18 L32 32 L32 18 L46 32 L46 18 L60 32 Z"
  }, st))), ["parapet", "manila", "lshape", "tshape", "monitor", "carport", "ground"].indexOf(k) >= 0 && React.createElement("path", _extends({
    d: "M8 26 L30 16 L56 22 L34 32 Z"
  }, st)), k === "facet" && React.createElement(React.Fragment, null, React.createElement("path", _extends({
    d: "M6 30 L22 14 L40 14 L40 22 L58 22 L58 34 L6 34 Z"
  }, st)), [[6, 30], [22, 14], [40, 14], [40, 22], [58, 22], [58, 34], [6, 34]].map(([x, y], i) => React.createElement("circle", {
    key: i,
    cx: x,
    cy: y,
    r: 2.4,
    fill: "#fff",
    stroke: "#1e3a8a",
    strokeWidth: 1.4
  }))));
}
function p3sMergeRect(parts, axisDeg) {
  const a = (axisDeg || 0) * P3_DEG,
    u = {
      x: Math.cos(a),
      z: Math.sin(a)
    },
    v = {
      x: -Math.sin(a),
      z: Math.cos(a)
    };
  let u0 = 1e9,
    u1 = -1e9,
    v0 = 1e9,
    v1 = -1e9;
  parts.forEach(P => P.forEach(q => {
    const pu = q.x * u.x + q.z * u.z,
      pv = q.x * v.x + q.z * v.z;
    if (pu < u0) u0 = pu;
    if (pu > u1) u1 = pu;
    if (pv < v0) v0 = pv;
    if (pv > v1) v1 = pv;
  }));
  const P = (su, sv) => ({
    x: p3sR(u.x * su + v.x * sv),
    z: p3sR(u.z * su + v.z * sv)
  });
  return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
}
function p3sRotPts(pts, deg) {
  if (!deg) return pts;
  const n = pts.length,
    cx = pts.reduce((a, q) => a + q.x, 0) / n,
    cz = pts.reduce((a, q) => a + q.z, 0) / n;
  const c = Math.cos(deg * P3_DEG),
    sn = Math.sin(deg * P3_DEG);
  return pts.map(q => {
    const dx = q.x - cx,
      dz = q.z - cz;
    return {
      x: p3sR(cx + dx * c - dz * sn),
      z: p3sR(cz + dx * sn + dz * c)
    };
  });
}
function p3sRayRect(F, seed, axisDeg) {
  const a = (axisDeg || 0) * P3_DEG,
    u = {
      x: Math.cos(a),
      z: Math.sin(a)
    },
    v = {
      x: -Math.sin(a),
      z: Math.cos(a)
    };
  const L = Math.min(60, F.Wm / 2 - 2);
  const r = p3sRay(F, seed, u.x, u.z, L),
    l = p3sRay(F, seed, -u.x, -u.z, L);
  const d = p3sRay(F, seed, v.x, v.z, L),
    t = p3sRay(F, seed, -v.x, -v.z, L);
  if (r == null || l == null || d == null || t == null) return {
    err: "หาขอบไม่ครบ 4 ด้าน — ลองแตะใกล้กลางหลังคาขึ้น หรือวาดเอง"
  };
  const P = (su, sv) => ({
    x: p3sR(seed.x + u.x * su + v.x * sv),
    z: p3sR(seed.z + u.z * su + v.z * sv)
  });
  const pts = [P(-l, -t), P(r, -t), P(r, d), P(-l, d)];
  return {
    pts,
    area: p3sR((r + l) * (d + t), 10)
  };
}
function p3sEdgeSnap(F, w, R, dir) {
  if (!F || F.err) return null;
  const thr = F.p90 * 0.9;
  let best = null,
    bv = 0;
  if (dir) {
    const n = Math.ceil(R / F.res);
    for (let k = -n; k <= n; k++) {
      const x = w.x + dir.x * k * F.res,
        z = w.z + dir.z * k * F.res,
        i = p3sEF(F, x, z);
      if (i < 0) continue;
      const m = Math.abs(F.gx[i] * dir.x + F.gz[i] * dir.z) * (1 - 0.4 * Math.abs(k) / n);
      if (m > bv) {
        bv = m;
        best = {
          x,
          z
        };
      }
    }
  } else {
    const r = Math.ceil(R / F.res),
      cx = Math.round((w.x - F.ox) / F.res),
      cz = Math.round((w.z - F.oz) / F.res);
    for (let y = cz - r; y <= cz + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x < 2 || y < 2 || x >= F.N - 2 || y >= F.N - 2) continue;
      const dd = Math.hypot(x - cx, y - cz);
      if (dd > r) continue;
      const m = F.mag[y * F.N + x] * (1 - 0.4 * dd / r);
      if (m > bv) {
        bv = m;
        best = {
          x: F.ox + x * F.res,
          z: F.oz + y * F.res
        };
      }
    }
  }
  return best && bv > thr ? {
    x: p3sR(best.x),
    z: p3sR(best.z)
  } : null;
}
function p3sFaceAsp(pts3) {
  if (!pts3 || pts3.length < 3) return null;
  let n = p3Newell(pts3);
  if (n.y < 0) n = {
    x: -n.x,
    y: -n.y,
    z: -n.z
  };
  const pitch = Math.acos(p3sClamp(n.y, -1, 1)) / P3_DEG;
  if (pitch < 1.5) return {
    pitch: 0,
    az: null
  };
  return {
    pitch: p3sR(pitch, 10),
    az: (Math.atan2(n.x, -n.z) / P3_DEG + 360) % 360,
    dx: n.x,
    dz: n.z
  };
}
const p3sNormAxis = deg => {
  let d = (+deg % 90 + 90) % 90;
  if (d > 45) d -= 90;
  return p3sR(d, 10);
};
function P3SCamGlyph({
  k
}) {
  const F = React.Fragment,
    g = {
      bird: React.createElement(F, null, React.createElement("path", {
        d: "M3 10.5 12 6l9 4.5v4.8L12 19.8l-9-4.5z"
      }), React.createElement("path", {
        d: "M3 10.5 12 15l9-4.5M12 15v4.8"
      }), React.createElement("path", {
        d: "M7.5 8.2 12 6l4.5 2.2",
        opacity: ".45"
      })),
      front: React.createElement(F, null, React.createElement("path", {
        d: "M5 19.5v-8.2L12 5.5l7 5.8v8.2"
      }), React.createElement("path", {
        d: "M2.5 19.5h19"
      }), React.createElement("path", {
        d: "M9.5 19.5v-4.5h5v4.5",
        opacity: ".55"
      })),
      top: React.createElement(F, null, React.createElement("rect", {
        x: "4",
        y: "5",
        width: "16",
        height: "14",
        rx: "1.5"
      }), React.createElement("path", {
        d: "M4 12h16"
      }), React.createElement("path", {
        d: "M8 7.5v2.5M11 7.5v2.5M14 7.5v2.5M17 7.5v2.5",
        opacity: ".55"
      })),
      close: React.createElement(F, null, React.createElement("path", {
        d: "M3 18 8.5 7H21l-5.5 11z"
      }), React.createElement("path", {
        d: "M5.75 12.5h12.5M7.2 18l5.5-11M11.4 18l5.5-11",
        opacity: ".6"
      })),
      am: React.createElement(F, null, React.createElement("path", {
        d: "M2.5 18.5h19"
      }), React.createElement("path", {
        d: "M7 18.5a5 5 0 0 1 10 0"
      }), React.createElement("path", {
        d: "M12 7v2.5M5.2 11.2l1.6 1.4M18.8 11.2l-1.6 1.4"
      }), React.createElement("path", {
        d: "M9.5 4.5 12 2.5l2.5 2"
      })),
      pm: React.createElement(F, null, React.createElement("path", {
        d: "M2.5 18.5h19"
      }), React.createElement("path", {
        d: "M7 18.5a5 5 0 0 1 10 0"
      }), React.createElement("path", {
        d: "M12 7v2.5M5.2 11.2l1.6 1.4M18.8 11.2l-1.6 1.4"
      }), React.createElement("path", {
        d: "M9.5 2.5 12 4.5l2.5-2"
      })),
      expand: React.createElement(F, null, React.createElement("path", {
        d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
      })),
      shrink: React.createElement(F, null, React.createElement("path", {
        d: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
      })),
      cam: React.createElement(F, null, React.createElement("path", {
        d: "M3.5 8.5A1.5 1.5 0 0 1 5 7h2.6l1.6-2.2h5.6L16.4 7H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"
      }), React.createElement("circle", {
        cx: "12",
        cy: "12.8",
        r: "3.6"
      }))
    };
  return React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "24",
    height: "24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, g[k]);
}
function P3SIcon({
  name,
  size
}) {
  const s = size || 18;
  const F = React.Fragment;
  const ic = {
    cursor: React.createElement(F, null, React.createElement("path", {
      d: "M3.4 2.2 12.6 7l-4 1.2 2.3 4.4-1.7.9-2.3-4.4-3 2.9z"
    })),
    hand: React.createElement(F, null, React.createElement("path", {
      d: "M5.3 8.2V3.7a1 1 0 0 1 2 0v3.9M7.3 7.3V2.8a1 1 0 0 1 2 0v4.5M9.3 7.4V3.7a1 1 0 0 1 2 0v4.6M11.3 7a1 1 0 0 1 2 0v2.8a4.7 4.7 0 0 1-4.7 4.7h-.4a4.4 4.4 0 0 1-3.7-2L2.6 9.4a1 1 0 0 1 1.6-1.2l1.1 1.1"
    })),
    polygon: React.createElement(F, null, React.createElement("path", {
      d: "M3 6 8 2.4l5 3.7-1.9 7H4.9z"
    }), React.createElement("circle", {
      cx: "3",
      cy: "6",
      r: "1.1",
      fill: "currentColor"
    }), React.createElement("circle", {
      cx: "13",
      cy: "6.1",
      r: "1.1",
      fill: "currentColor"
    }), React.createElement("circle", {
      cx: "4.9",
      cy: "13.1",
      r: "1.1",
      fill: "currentColor"
    })),
    rect: React.createElement(F, null, React.createElement("rect", {
      x: "2.4",
      y: "3.6",
      width: "11.2",
      height: "8.8",
      rx: ".8"
    }), React.createElement("circle", {
      cx: "2.4",
      cy: "3.6",
      r: "1.1",
      fill: "currentColor"
    }), React.createElement("circle", {
      cx: "13.6",
      cy: "12.4",
      r: "1.1",
      fill: "currentColor"
    })),
    panel: React.createElement(F, null, React.createElement("path", {
      d: "M3.2 4.2h9.6l1.4 8H1.8z"
    }), React.createElement("path", {
      d: "M6.4 4.2 6 12.2M9.6 4.2l.4 8M2.5 8.2h11"
    })),
    undo: React.createElement(F, null, React.createElement("path", {
      d: "M5.4 3.6 2.4 6.6l3 3"
    }), React.createElement("path", {
      d: "M2.8 6.6h6.6a3.9 3.9 0 0 1 0 7.8H7.2"
    })),
    redo: React.createElement(F, null, React.createElement("path", {
      d: "m10.6 3.6 3 3-3 3"
    }), React.createElement("path", {
      d: "M13.2 6.6H6.6a3.9 3.9 0 0 0 0 7.8h2.2"
    })),
    magic: React.createElement(F, null, React.createElement("path", {
      d: "m2.6 13.4 7.6-7.6M9.2 2.4l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5zM12.8 6.8l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z"
    })),
    fit: React.createElement(F, null, React.createElement("path", {
      d: "M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"
    })),
    minus: React.createElement(F, null, React.createElement("path", {
      d: "M3.3 8h9.4"
    })),
    x: React.createElement(F, null, React.createElement("path", {
      d: "m4 4 8 8M12 4l-8 8"
    })),
    copy: React.createElement(F, null, React.createElement("rect", {
      x: "5.2",
      y: "5.2",
      width: "8.4",
      height: "8.4",
      rx: "1.4"
    }), React.createElement("path", {
      d: "M10.8 5.2V3.6a1.2 1.2 0 0 0-1.2-1.2H3.6a1.2 1.2 0 0 0-1.2 1.2v6a1.2 1.2 0 0 0 1.2 1.2h1.6"
    })),
    back: React.createElement(F, null, React.createElement("path", {
      d: "M9.8 3.4 5.2 8l4.6 4.6"
    })),
    swap: React.createElement(F, null, React.createElement("path", {
      d: "M2.6 5.4h10l-2.6-2.6M13.4 10.6h-10l2.6 2.6"
    })),
    rotate: React.createElement(F, null, React.createElement("path", {
      d: "M13.2 7.6A5.2 5.2 0 1 1 11.4 4"
    }), React.createElement("path", {
      d: "M11.8 1.6v2.8H9"
    })),
    align: React.createElement(F, null, React.createElement("path", {
      d: "M2.5 13.5h11"
    }), React.createElement("rect", {
      x: "3.4",
      y: "5.6",
      width: "3.6",
      height: "6",
      rx: ".6"
    }), React.createElement("rect", {
      x: "9",
      y: "2.6",
      width: "3.6",
      height: "9",
      rx: ".6"
    })),
    target: React.createElement(F, null, React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "5.6"
    }), React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "2"
    }), React.createElement("path", {
      d: "M8 .9v2M8 13.1v2M.9 8h2M13.1 8h2"
    })),
    info: React.createElement(F, null, React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "6.2"
    }), React.createElement("path", {
      d: "M8 7.2v4M8 4.9v.1"
    })),
    axis: React.createElement(F, null, React.createElement("path", {
      d: "M2 12.5 13.5 3"
    }), React.createElement("path", {
      d: "M2 12.5h4.2M2 12.5V8.3",
      opacity: ".55"
    }), React.createElement("circle", {
      cx: "2",
      cy: "12.5",
      r: "1.2",
      fill: "currentColor"
    }), React.createElement("circle", {
      cx: "13.5",
      cy: "3",
      r: "1.2",
      fill: "currentColor"
    })),
    walk: React.createElement(F, null, React.createElement("path", {
      d: "M2.5 2.5h3.6v11H2.5zM9.9 2.5h3.6v11H9.9z"
    }), React.createElement("path", {
      d: "M8 3v1.6M8 7.2v1.6M8 11.4V13"
    })),
    edge: React.createElement(F, null, React.createElement("path", {
      d: "M2 13 7 4l3 5 4-6"
    }), React.createElement("circle", {
      cx: "7",
      cy: "4",
      r: "1.3",
      fill: "currentColor"
    })),
    sun: React.createElement(F, null, React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "2.8"
    }), React.createElement("path", {
      d: "M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1"
    }))
  };
  if (!ic[name]) return React.createElement(P3Icon, {
    name: name,
    size: s
  });
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flex: "0 0 auto"
    }
  }, ic[name]);
}
function P3SNum({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
  digits,
  auto,
  hint
}) {
  const [txt, setTxt] = React.useState(null);
  const lo = min == null ? -1e9 : min,
    hi = max == null ? 1e9 : max;
  const d = digits == null ? 2 : digits;
  const isAuto = auto && !(+value > 0);
  const shown = txt != null ? txt : isAuto ? "" : value == null || isNaN(+value) ? "" : String(p3sR(+value, Math.pow(10, d)));
  const put = v => onChange(p3sClamp(p3sR(v, Math.pow(10, d)), lo, hi));
  const st = step || 1;
  return React.createElement("label", {
    className: "p3s-fld"
  }, label && React.createElement("span", {
    className: "lb"
  }, label, hint && React.createElement("i", null, hint)), React.createElement("span", {
    className: "p3s-well"
  }, React.createElement("button", {
    type: "button",
    className: "sb",
    tabIndex: -1,
    onClick: e => {
      e.preventDefault();
      put((+value || 0) - st);
      setTxt(null);
    }
  }, "\u2212"), React.createElement("input", {
    type: "text",
    inputMode: "decimal",
    value: shown,
    placeholder: isAuto ? auto : "",
    onFocus: e => {
      setTxt(shown);
      const el = e.target;
      setTimeout(() => {
        try {
          el.select();
        } catch (er) {}
      }, 0);
    },
    onChange: e => {
      const t = e.target.value;
      setTxt(t);
      const v = parseFloat(t);
      if (!isNaN(v)) put(v);else if (t === "" && auto) onChange(0);
    },
    onBlur: () => setTxt(null),
    onKeyDown: e => {
      if (e.key === "Enter") e.target.blur();
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        put((+value || 0) + (e.key === "ArrowUp" ? st : -st));
        setTxt(null);
      }
    }
  }), unit && React.createElement("span", {
    className: "u"
  }, unit), React.createElement("button", {
    type: "button",
    className: "sb",
    tabIndex: -1,
    onClick: e => {
      e.preventDefault();
      put((+value || 0) + st);
      setTxt(null);
    }
  }, "+")));
}
function P3SText({
  label,
  value,
  onChange
}) {
  return React.createElement("label", {
    className: "p3s-fld"
  }, label && React.createElement("span", {
    className: "lb"
  }, label), React.createElement("span", {
    className: "p3s-well"
  }, React.createElement("input", {
    type: "text",
    value: value || "",
    onChange: e => onChange(e.target.value)
  })));
}
function P3SSeg({
  value,
  options,
  onChange,
  full
}) {
  return React.createElement("div", {
    className: "p3s-seg" + (full ? " full" : "")
  }, options.map(([v, lb, dis]) => React.createElement("button", {
    key: String(v),
    type: "button",
    "data-on": value === v ? "1" : "0",
    disabled: !!dis,
    onClick: () => onChange(v)
  }, lb)));
}
function P3SRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
  right
}) {
  const pct = max > min ? p3sClamp(((+value || 0) - min) / (max - min) * 100, 0, 100) : 0;
  return React.createElement("label", {
    className: "p3s-fld"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex"
    }
  }, React.createElement("span", null, label), right != null && React.createElement("b", {
    style: {
      marginLeft: "auto",
      color: "var(--text-1)"
    }
  }, right)), React.createElement("input", {
    className: "p3s-range",
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    style: {
      "--p": pct
    },
    onChange: e => onChange(+e.target.value)
  }));
}
const P3S_CSS = `
.p3s{color:var(--text-1);-webkit-tap-highlight-color:transparent}
.p3s button{font-family:inherit}
.p3s-head{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--surface);box-shadow:var(--shadow-sm);position:relative;z-index:4;min-height:56px;box-sizing:border-box}
.p3s-ttl{flex:1;min-width:0}
.p3s-ttl .k{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--text-3)}
.p3s-ttl .n{font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p3s-btn{height:38px;padding:0 13px;border-radius:11px;border:0;background:var(--surface2);color:var(--text-1);font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;flex:0 0 auto;transition:background .15s}
.p3s-btn:hover{background:var(--surface3)}
.p3s-btn:disabled{opacity:.4;cursor:default}
.p3s-btn.pri{background:var(--primary);color:#fff}
.p3s-btn.pri:hover{filter:brightness(1.06)}
.p3s-btn.pri:disabled{background:var(--surface2);color:var(--text-3);opacity:1}
.p3s-btn.ghost{background:transparent}
.p3s-btn.ghost:hover{background:var(--surface2)}
.p3s-btn.dngr{color:var(--tint-red-tx,#b91c1c)}
.p3s-btn.ico{width:38px;padding:0}
.p3s-btn.wide{width:100%}
.p3s-btn.big{height:46px;font-size:14px;border-radius:13px}
.p3s-kpi{display:flex;align-items:baseline;gap:4px}
.p3s-kpi b{font-size:19px;font-weight:800;letter-spacing:-.3px;font-variant-numeric:tabular-nums}
.p3s-kpi span{font-size:11px;font-weight:700;color:var(--text-3)}
.p3s-seg{display:inline-flex;background:var(--surface2);border-radius:11px;padding:3px;gap:2px;box-shadow:var(--shadow-inset);flex:0 0 auto}
.p3s-seg.full{display:flex}
.p3s-seg.full button{flex:1}
.p3s-seg button{height:32px;padding:0 12px;border:0;border-radius:9px;background:transparent;font-size:12.5px;font-weight:700;color:var(--text-2);cursor:pointer;white-space:nowrap}
.p3s-seg button[data-on="1"]{background:var(--surface);color:var(--text-1);box-shadow:var(--shadow-sm)}
.p3s-seg button:disabled{opacity:.35;cursor:default}
.p3s-body{flex:1;min-height:0;display:flex}
.p3s-tools{width:78px;flex:0 0 78px;background:var(--surface);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:3px;padding:8px 6px;overflow-y:auto;position:relative;z-index:3;box-sizing:border-box}
.p3s-tool{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px 7px;border:0;border-radius:13px;background:transparent;color:var(--text-2);font-size:10.5px;font-weight:700;cursor:pointer;min-height:58px;line-height:1.15;text-align:center}
.p3s-tool:hover{background:var(--surface2);color:var(--text-1)}
.p3s-tool[data-on="1"]{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-tool kbd{position:absolute;top:4px;right:6px;font:700 9px/1 inherit;color:var(--text-3);opacity:.8}
.p3s-tool[data-on="1"] kbd{color:var(--primary-dark)}
.p3s-tsep{height:1px;background:var(--surface3);margin:4px 8px}
.p3s-stage{flex:1;min-width:0;position:relative;overflow:hidden;background:#dfe5dc;touch-action:none;user-select:none;-webkit-user-select:none}
.p3s-stage>svg{position:absolute;inset:0;display:block}
.p3s-moving path,.p3s-moving polygon{shape-rendering:optimizeSpeed}
.p3s-side{width:340px;flex:0 0 340px;background:var(--bg);overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;position:relative;z-index:3;box-sizing:border-box;box-shadow:var(--shadow-sm)}
.p3s-card{background:var(--surface);border-radius:15px;box-shadow:var(--shadow-card);padding:13px;display:flex;flex-direction:column;gap:10px}
.p3s-h{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--text-3)}
.p3s-h .t{flex:1}
.p3s-ttl2{font-size:15px;font-weight:800;color:var(--text-1);display:flex;align-items:center;gap:8px}
.p3s-g2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.p3s-rlist .p3s-g2{grid-template-columns:1fr;gap:6px}
.p3s-rlist label.p3s-fld{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
.p3s-rlist label.p3s-fld .lb{flex:1;min-width:0}
.p3s-rlist label.p3s-fld .p3s-well{flex:0 0 160px;width:160px}
.p3s-fld{display:flex;flex-direction:column;gap:5px;min-width:0}
.p3s-cols{display:flex;flex-wrap:wrap;gap:6px}
.p3s-col{width:22px;height:22px;border-radius:50%;border:0;padding:0;cursor:pointer;box-shadow:var(--shadow-sm)}
.p3s-col.def{background:conic-gradient(#9aa1a8 0 25%,#c86a3c 0 50%,#878c93 0 75%,#e8e6df 0)}
.p3s-col[data-on]{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--accent,#2563eb)}
.p3s-fld .lb{font-size:11px;font-weight:700;color:var(--text-3);display:flex;gap:6px;align-items:baseline}
.p3s-fld .lb i{font-style:normal;font-weight:600;color:var(--text-3);opacity:.8;font-size:10.5px;margin-left:auto}
.p3s-well{display:flex;align-items:center;height:42px;border-radius:11px;background:var(--surface2);box-shadow:var(--shadow-inset);padding:0 4px;gap:2px;box-sizing:border-box}
.p3s-well:focus-within{box-shadow:var(--shadow-inset),0 0 0 2px var(--primary-soft)}
.p3s-well input,.p3s-well select{flex:1;min-width:0;width:100%;border:0!important;background:transparent!important;box-shadow:none!important;outline:none!important;font:inherit;font-size:14px;font-weight:700;color:var(--text-1);padding:0 6px!important;height:100%;text-align:center;border-radius:0!important}
.p3s-well input[type=text]:not([inputmode]){text-align:left}
.p3s-well select{text-align:left}
.p3s-well .u{font-size:11.5px;color:var(--text-3);font-weight:700;padding-right:2px}
.p3s-well .sb{width:30px;height:30px;flex:0 0 30px;border:0;border-radius:8px;background:transparent;color:var(--text-2);font-size:17px;font-weight:600;cursor:pointer;display:grid;place-items:center;line-height:1}
.p3s-well .sb:hover{background:var(--surface);color:var(--text-1)}
.p3s-note{font-size:11.5px;color:var(--text-3);line-height:1.5}
.p3s-note:not(.keep){display:none}
.p3s-wiz .wd{display:none}
.p3s-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.p3s-stat>div{background:var(--surface2);border-radius:11px;padding:8px 10px}
.p3s-stat .l{font-size:10px;font-weight:700;color:var(--text-3)}
.p3s-stat .v{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}
.p3s-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.p3s-list{display:flex;flex-direction:column;gap:4px}
.p3s-li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;background:transparent;border:0;cursor:pointer;text-align:left;font-size:13px;font-weight:700;color:var(--text-1);width:100%}
.p3s-li:hover{background:var(--surface2)}
.p3s-li[data-on="1"]{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-li small{margin-left:auto;font-size:11.5px;color:var(--text-3);font-weight:700}
.p3s-step{display:flex;gap:11px;align-items:flex-start}
.p3s-step .no{width:26px;height:26px;border-radius:50%;flex:0 0 26px;display:grid;place-items:center;font-size:12px;font-weight:800;background:var(--surface2);color:var(--text-2)}
.p3s-step[data-done="1"] .no{background:var(--primary);color:#fff}
.p3s-step .bd{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.p3s-step .tt{font-size:13.5px;font-weight:800}
.p3s-step .ds{font-size:11.5px;color:var(--text-3);line-height:1.45}
.p3s-wiz .dots{display:flex;gap:4px}
.p3s-wiz .dot:disabled{opacity:.45;cursor:not-allowed}
.p3s-wiz .dot{flex:1;min-width:0;height:26px;border:0;border-radius:8px;background:var(--surface2);box-shadow:var(--shadow-inset);color:var(--text-3);font-size:11.5px;font-weight:800;cursor:pointer;display:grid;place-items:center;padding:0}
.p3s-wiz .dot[data-done="1"]{background:var(--primary-soft,rgba(16,185,129,.16));color:var(--primary);box-shadow:none}
.p3s-wiz .dot[data-on="1"]{background:var(--primary);color:#fff;box-shadow:none}
.p3s-wiz .wt{font-size:14.5px;font-weight:800;line-height:1.35}
.p3s-wiz .wd{font-size:12px;color:var(--text-2);line-height:1.5}
.p3s-wiz .wd b{color:var(--text)}
.p3s-wiz .chips{display:flex;flex-wrap:wrap;gap:5px}
.p3s-wiz .chips .p3s-btn{height:28px;font-size:11.5px;padding:0 9px}
.p3s-tool[data-dim="1"]{opacity:.28;cursor:not-allowed}
.p3s-wiznav{position:sticky;bottom:-14px;margin:auto -14px -14px;padding:10px 14px 14px;background:var(--bg);box-shadow:0 -6px 14px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:6px;z-index:4}
.p3s-wiznav .p3s-row{gap:8px}
.p3s-tool[data-hint="1"]{box-shadow:0 0 0 2px var(--primary) inset}
.p3s-float{position:absolute;background:var(--surface);border-radius:14px;box-shadow:var(--shadow-card);display:flex;align-items:center;gap:6px;padding:5px;z-index:2}
.p3s-ctx{top:12px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);flex-wrap:wrap;justify-content:center}
.p3s-mtip{position:absolute;z-index:4;pointer-events:none;background:#ea580c;color:#fff;font-size:12px;font-weight:800;border-radius:9px;padding:5px 9px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.p3s-ctx .lbl{font-size:11px;font-weight:800;color:var(--text-3);padding:0 4px 0 8px}
.p3s-zoom{right:12px;bottom:12px;flex-direction:column}
.p3s-ftool{position:absolute;left:12px;top:12px;z-index:3;display:flex;flex-direction:column;gap:8px;align-items:center}
.p3s-ftool .b{width:44px;height:44px;border-radius:50%;border:0;padding:0;background:var(--surface);color:var(--text-2);box-shadow:var(--shadow-card);display:grid;place-items:center;cursor:pointer}
.p3s-ftool .b:hover{color:var(--text-1)}
.p3s-ftool .b[data-on="1"]{background:var(--primary-soft);color:var(--primary-dark);box-shadow:var(--shadow-card),0 0 0 2px var(--primary) inset}
.p3s-ftool .b.g{background:#16a34a;color:#fff}
.p3s-ftool .b.g:hover{background:#15803d}
.p3s-ftool .b:disabled{opacity:.38;cursor:not-allowed}
.p3s-mode{position:absolute;left:66px;z-index:3;height:28px;padding:0 12px;border-radius:99px;background:rgba(15,23,42,.84);color:#fff;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;pointer-events:none;white-space:nowrap;transition:top .15s}
.p3s-mode b{font-weight:800;color:#86efac}
.p3s-mode:before{content:"";position:absolute;left:-5px;top:9px;border:5px solid transparent;border-left:0;border-right-color:rgba(15,23,42,.84)}
.p3s-oprev{position:fixed;z-index:60;width:264px;box-sizing:border-box;background:var(--surface);border-radius:14px;box-shadow:var(--shadow-card);padding:10px;pointer-events:none;display:flex;flex-direction:column;gap:6px}
.p3s-oprev img,.p3s-oprev .ph{width:244px;height:168px;border-radius:10px;display:block;background:var(--surface2)}
.p3s-oprev .ph{display:grid;place-items:center;font-size:12px;color:var(--text-3)}
.p3s-oprev .t{font-size:13.5px;font-weight:800;display:flex;align-items:baseline;gap:6px}
.p3s-oprev .t small{font-size:11px;font-weight:600;color:var(--text-3)}
.p3s-oprev .d{font-size:11.5px;color:var(--text-2);line-height:1.45}
.p3s-ftool .sep{display:block;width:22px;height:2px;border-radius:2px;background:rgba(15,23,42,.2)}
.p3s-msel{left:50%;bottom:58px;transform:translateX(-50%);flex-wrap:wrap;justify-content:center;max-width:calc(100% - 24px)}
.p3s-msel .lbl{font-size:12px;font-weight:800;color:var(--text-2);padding:0 6px 0 8px}
.p3s-mon{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.p3s-sec{display:flex;flex-direction:column;gap:7px}
.p3s-sec>.lb{font-size:11px;font-weight:700;color:var(--text-3);display:flex;align-items:baseline;gap:8px}
.p3s-sec>.lb em{font-style:normal;font-weight:600;color:var(--primary);margin-left:auto}
.p3s-cams{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;background:var(--surface2);box-shadow:var(--shadow-inset);border-radius:14px;padding:4px}
.p3s-cams button{border:0;background:transparent;border-radius:11px;padding:9px 2px 7px;display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--text-2);cursor:pointer;transition:background .15s,color .15s}
.p3s-cams button:hover:not(:disabled){color:var(--text-1);background:color-mix(in srgb,var(--surface) 55%,transparent)}
.p3s-cams button[data-on="1"]{background:var(--surface);color:var(--primary);box-shadow:var(--shadow-sm)}
.p3s-cams button:disabled{opacity:.35;cursor:default}
.p3s-lights{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.p3s-lights button{border:0;min-height:48px;border-radius:13px;background:var(--surface2);display:flex;align-items:center;gap:9px;padding:6px 10px;cursor:pointer;color:var(--text-2);text-align:left;transition:background .2s,color .2s}
.p3s-lights button:hover:not(:disabled){color:var(--text-1)}
.p3s-lights button svg{flex:0 0 22px;width:22px;height:22px}
.p3s-lights b{display:block;font-size:12.5px;color:inherit}
.p3s-lights small{display:block;font-size:10px;font-weight:600;opacity:.75;line-height:1.25}
.p3s-lights button[data-on="1"][data-k="am"]{background:linear-gradient(135deg,#fff4d1,#ffd88a);color:#7a4b00;box-shadow:var(--shadow-sm)}
.p3s-lights button[data-on="1"][data-k="pm"]{background:linear-gradient(135deg,#ffd9b8,#f5a06a);color:#6e2604;box-shadow:var(--shadow-sm)}
.p3s-lights button:disabled{opacity:.4;cursor:default}
.p3s-btn.p3s-cta{width:100%;height:58px;border-radius:15px;justify-content:flex-start;padding:0 16px;gap:13px;box-shadow:var(--shadow-sm)}
.p3s-cta svg{width:26px;height:26px;flex:0 0 26px}
.p3s-cta .ct{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25;min-width:0}
.p3s-cta .ct b{font-size:15px}
.p3s-cta .ct small{font-size:10.5px;font-weight:600;opacity:.82;white-space:normal;text-align:left}
.p3s-btn.p3s-vid.on{background:linear-gradient(90deg,var(--tint-red-bg,#fee2e2) var(--pc,0%),var(--surface2) var(--pc,0%));color:var(--tint-red-tx,#b91c1c)}
.p3s-savebar{display:flex;align-items:center;gap:10px;margin-top:4px;padding:8px 8px 8px 12px;border-radius:13px;background:var(--surface2);box-shadow:var(--shadow-inset)}
.p3s-savebar .st{flex:1;display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;color:var(--text-2);min-width:0}
.p3s-savebar .st i{width:8px;height:8px;border-radius:50%;background:#10b981;flex:0 0 8px}
.p3s-savebar .st.dirty i{background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.18)}
.p3s-savebar .p3s-btn{flex:0 0 auto}
.p3s-side[data-hide="1"]{display:none}
.p3s-v3top{position:absolute;right:12px;top:12px;z-index:4;display:flex;align-items:center;gap:8px}
.p3s-v3top .b{height:40px;border:0;border-radius:20px;padding:0 14px 0 11px;background:var(--surface);color:var(--text-1);box-shadow:var(--shadow-card);display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;cursor:pointer}
.p3s-v3top .b svg{width:20px;height:20px}
.p3s-v3top .b:hover{color:var(--primary)}
.p3s-v3top .rec{height:32px;border-radius:16px;padding:0 12px;background:rgba(15,23,42,.72);color:#fff;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700}
.p3s-v3top .rec i,.p3s-v3bar .stop i{width:9px;height:9px;border-radius:50%;background:#ef4444;animation:p3sRec 1s ease-in-out infinite}
@keyframes p3sRec{50%{opacity:.25}}
.p3s-v3bar{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:4px;padding:5px;border-radius:18px;background:var(--surface);box-shadow:var(--shadow-card);max-width:calc(100% - 24px);overflow-x:auto}
.p3s-v3bar button{border:0;background:transparent;color:var(--text-2);height:46px;border-radius:13px;padding:0 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:10.5px;font-weight:700;cursor:pointer;white-space:nowrap;flex:0 0 auto}
.p3s-v3bar button svg{width:20px;height:20px}
.p3s-v3bar button:hover:not(:disabled){color:var(--text-1);background:var(--surface2)}
.p3s-v3bar button.cam[data-on="1"]{background:var(--surface2);color:var(--primary);box-shadow:var(--shadow-inset)}
.p3s-v3bar button:disabled{opacity:.35;cursor:default}
.p3s-v3bar .sep{width:2px;height:28px;border-radius:2px;background:var(--surface2);margin:0 4px;flex:0 0 2px}
.p3s-v3bar button.shot{background:var(--primary);color:#fff;flex-direction:row;gap:8px;padding:0 16px;font-size:13px}
.p3s-v3bar button.shot:hover{background:var(--primary);filter:brightness(1.06);color:#fff}
.p3s-v3bar button.stop{flex-direction:row;gap:9px;padding:0 18px;font-size:13px;color:var(--tint-red-tx,#b91c1c);background:var(--tint-red-bg,#fee2e2)}
.p3s-v3bar button.stop:hover{color:var(--tint-red-tx,#b91c1c);background:var(--tint-red-bg,#fee2e2);filter:brightness(.97)}
@media (max-width:640px){.p3s-v3bar button span{display:none}.p3s-v3bar button.shot span,.p3s-v3bar button.stop{display:flex}.p3s-v3top .b span{display:none}.p3s-v3top .b{padding:0 10px}}
.p3s-monnav{display:flex;align-items:center;gap:8px}
.p3s-monnav .p3s-btn{width:36px;height:36px;padding:0;flex:0 0 36px;font-size:20px;justify-content:center}
.p3s-monnav b{flex:1;text-align:center;font-size:15px;font-weight:800}
.p3s-mon .p3s-btn{padding:0;height:30px;font-size:12px;justify-content:center}
.p3s-hint{position:absolute;left:12px;bottom:12px;z-index:2;max-width:calc(100% - 90px);background:rgba(15,23,42,.82);color:#fff;font-size:12.5px;font-weight:600;border-radius:11px;padding:8px 12px;line-height:1.45;pointer-events:none;backdrop-filter:blur(6px)}
.p3s-hint b{color:#86efac;font-weight:800}
.p3s-hint kbd{font:700 11px inherit;background:rgba(255,255,255,.16);border-radius:5px;padding:1px 5px;margin:0 1px}
.p3s-scale{position:absolute;right:66px;bottom:16px;z-index:2;font-size:11px;font-weight:800;color:#0f172a;text-shadow:0 0 3px #fff,0 0 3px #fff;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.p3s-scale i{display:block;height:6px;border:2px solid #0f172a;border-top:0;box-shadow:0 1px 0 #fff}
.p3s-north{position:absolute;top:12px;right:12px;z-index:2;width:42px;height:42px;border-radius:50%;background:var(--surface);box-shadow:var(--shadow-card);display:grid;place-items:center;pointer-events:none}
.p3s-empty{position:absolute;inset:0;display:grid;place-items:center;z-index:2;padding:20px;pointer-events:none}
.p3s-empty .box{pointer-events:auto;background:var(--surface);border-radius:20px;box-shadow:var(--shadow-card);padding:22px;max-width:440px;width:100%;display:flex;flex-direction:column;gap:12px;box-sizing:border-box}
.p3s-empty h3{margin:0;font-size:17px;font-weight:800}
.p3s-empty p{margin:0;font-size:13px;color:var(--text-2);line-height:1.55}
.p3s-pop{position:absolute;z-index:3;left:50%;top:64px;transform:translateX(-50%);width:min(360px,calc(100% - 24px));background:var(--surface);border-radius:15px;box-shadow:var(--shadow-card);padding:13px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
.p3s-kpick{position:absolute;inset:0;z-index:6;background:rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
.p3s-kpick .in{background:var(--surface);border-radius:18px;box-shadow:var(--shadow-card);padding:16px;width:min(640px,100%);display:flex;flex-direction:column;gap:12px;box-sizing:border-box;max-height:100%;overflow:auto}
.p3s-kpick .tt{font-size:16px;font-weight:800;color:var(--text)}
.p3s-kpick .gr{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.p3s-kpick .k{border:none;background:var(--surface2);box-shadow:var(--shadow-inset);border-radius:14px;padding:10px 6px 9px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;font:inherit;color:var(--text)}
.p3s-kpick .k b{font-size:13.5px}
.p3s-kpick .k .pic{width:100%;aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:#e3edf5;display:flex;align-items:center;justify-content:center}
.p3s-kpick .k .pic img{width:100%;height:100%;object-fit:cover;display:block}
.p3s-kspan{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.p3s-kspan>span{font-size:13px;font-weight:700;color:var(--text-2)}
.p3s-kspan>b{min-width:26px;text-align:center;font-size:16px}
.p3s-kspan .p3s-btn:not(.pri){width:36px;padding:0;justify-content:center;font-size:18px}
.p3s-kpick .k small{font-size:10.5px;color:var(--text-3);text-align:center;line-height:1.3}
.p3s-kpick .k[data-on="1"]{background:var(--surface);box-shadow:0 0 0 2.5px var(--primary),var(--shadow-sm)}
@media (max-width:620px){.p3s-kpick .gr{grid-template-columns:repeat(2,1fr)}}
.p3s-range{width:100%;accent-color:var(--primary);height:26px;margin:0;box-shadow:none!important;background:transparent!important}
.p3s-mbar{display:none}
.p3s-sheetbar{display:none}
.p3s-hh{cursor:inherit}
.p3s-hh:hover{stroke-width:3}
.p3s-badge{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:99px;font-size:11px;font-weight:800;background:var(--surface2);color:var(--text-2)}
.p3s-badge.ok{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-badge.warn{background:var(--tint-amber-bg,#fef3c7);color:var(--tint-amber-tx,#92400e)}
@media (max-width:860px){
  .p3s-head{padding:7px 10px;gap:7px;min-height:52px}
  .p3s-ttl .k{display:none}
  .p3s-ttl .n{font-size:13.5px}
  .p3s-body{flex-direction:column}
  .p3s-tools{display:none}
  .p3s-side{width:auto;flex:0 0 auto;max-height:42vh;padding:10px 12px 12px;box-shadow:0 -6px 18px rgba(0,0,0,.08)}
  .p3s-side[data-min="1"]{max-height:none;padding-bottom:0}
  .p3s-wiznav{bottom:-12px;margin:auto -12px -12px;padding:8px 12px 12px}
  .p3s-side[data-min="1"]>*:not(.p3s-sheetbar){display:none}
  .p3s-sheetbar{display:flex;align-items:center;gap:8px;border:0;background:transparent;width:100%;padding:0 2px 4px;font-size:12.5px;font-weight:800;color:var(--text-2);cursor:pointer}
  .p3s-sheetbar .gr{width:36px;height:4px;border-radius:9px;background:var(--surface3);margin:0 auto}
  .p3s-mbar{display:flex;gap:2px;padding:5px 6px calc(5px + env(safe-area-inset-bottom));background:var(--surface);box-shadow:0 -1px 0 var(--surface3);overflow-x:auto;position:relative;z-index:4}
  .p3s-mbar .p3s-tool{flex:1 0 58px;min-height:52px;font-size:10px}
  .p3s-mbar .p3s-tool kbd{display:none}
  .p3s-hint{bottom:34px;left:8px;right:62px;max-width:none;font-size:12px}
  .p3s-scale{right:62px}
  .p3s-ctx{top:8px}
}
`;
function p3sBuild3D(THREE, grp, st, tex) {
  const pans = [];
  const add = o => {
    grp.add(o);
    return o;
  };
  const bH = +st.buildH || 0;
  let minX = 1e9,
    maxX = -1e9,
    minZ = 1e9,
    maxZ = -1e9,
    maxY = 0;
  const eat = (x, y, z) => {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
    maxY = Math.max(maxY, y);
  };
  const G = Math.max(40, +st.groundW || 40);
  const gT = p3sGrassTex(THREE).clone();
  gT.needsUpdate = true;
  gT.repeat.set(G * 3 / 6, G * 3 / 6);
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(G * 3, G * 3), new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: gT
  })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  if (st.baseMap && st.baseMap.url) {
    const W = Math.max(2, +st.baseMap.widthM || 30);
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshBasicMaterial({
      map: tex(st.baseMap.url)
    })));
    m.rotation.x = -Math.PI / 2;
    m.position.y = -0.02;
    m.userData.tint = 1;
  }
  if (st.photo) {
    const pw = +st.photoW || 30;
    const t = tex(st.photo, tx => {
      const im = tx.image;
      if (!im) return;
      pm.geometry.dispose();
      pm.geometry = new THREE.PlaneGeometry(pw, pw * (im.height / im.width));
    });
    const b = p3sClamp(st.photoBright == null ? 0.7 : +st.photoBright, 0.25, 1);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw), new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      alphaMap: p3sFadeTex(THREE),
      opacity: p3sClamp(+st.photoOpacity || 0.95, 0.15, 1),
      color: new THREE.Color(b + 0.2, b + 0.2, b + 0.2)
    }));
    if (t.image && t.image.width) pm.geometry = new THREE.PlaneGeometry(pw, pw * (t.image.height / t.image.width));
    pm.userData.tint = b + 0.2;
    pm.rotation.x = -Math.PI / 2;
    const pg = add(new THREE.Group());
    pg.position.set(+st.photoX || 0, -0.01, +st.photoZ || 0);
    pg.rotation.y = -((+st.photoRot || 0) * P3_DEG);
    pg.add(pm);
  }
  const tile = (g, w, h, x0, y0, tw, th) => {
    const gr = g.createLinearGradient(x0, 0, x0 + tw, 0);
    gr.addColorStop(0, "#9a9a9a");
    gr.addColorStop(0.3, "#f2f2f2");
    gr.addColorStop(0.62, "#d0d0d0");
    gr.addColorStop(1, "#8c8c8c");
    g.fillStyle = gr;
    g.fillRect(x0, y0, tw, th);
    g.fillStyle = "rgba(0,0,0,.38)";
    g.fillRect(x0, y0 + th - Math.max(2, th * 0.1), tw, Math.max(2, th * 0.1));
  };
  const MDEF = {
    metal: {
      tw: 1,
      th: 1,
      c: 0x9aa1a8,
      cap: 0x7d858d,
      fas: 0x8a9198,
      H: 0.2,
      cw: 128,
      ch: 16,
      draw: g => {
        g.fillStyle = "#e3e7ea";
        g.fillRect(0, 0, 128, 16);
        for (let i = 0; i < 4; i++) {
          const x = i * 32;
          g.fillStyle = "#f7f8f9";
          g.fillRect(x, 0, 4, 16);
          g.fillStyle = "#c3c9cf";
          g.fillRect(x + 4, 0, 3, 16);
          g.fillStyle = "#d6dbdf";
          g.fillRect(x + 7, 0, 2, 16);
        }
      }
    },
    kliplok: {
      tw: 0.7,
      th: 1,
      c: 0xa3abb3,
      cap: 0x7d858d,
      fas: 0x8a9198,
      H: 0.2,
      cw: 128,
      ch: 8,
      draw: g => {
        g.fillStyle = "#e9ecef";
        g.fillRect(0, 0, 128, 8);
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, 5, 8);
        g.fillStyle = "#a9b0b8";
        g.fillRect(5, 0, 6, 8);
        g.fillStyle = "#dadee2";
        g.fillRect(48, 0, 2, 8);
        g.fillRect(88, 0, 2, 8);
      }
    },
    sandwich: {
      tw: 1,
      th: 1,
      c: 0xb9c2ca,
      cap: 0x8f98a0,
      fas: 0x9ea7af,
      H: 0.32,
      cw: 128,
      ch: 16,
      draw: g => {
        g.fillStyle = "#e6e9ec";
        g.fillRect(0, 0, 128, 16);
        for (let i = 0; i < 4; i++) {
          const x = i * 32;
          g.fillStyle = "#fbfcfd";
          g.fillRect(x, 0, 6, 16);
          g.fillStyle = "#c2c8ce";
          g.fillRect(x + 6, 0, 4, 16);
        }
      }
    },
    cpac: {
      tw: 0.33,
      th: 0.32,
      c: 0x878c93,
      cap: 0x5f646b,
      fas: 0xece8df,
      H: 0.25,
      house: 1,
      cw: 64,
      ch: 64,
      draw: g => tile(g, 64, 64, 0, 0, 64, 64)
    },
    ceramic: {
      tw: 0.22,
      th: 0.36,
      c: 0xc86a3c,
      cap: 0x9c4a26,
      fas: 0xece8df,
      H: 0.22,
      house: 1,
      cw: 64,
      ch: 128,
      draw: g => {
        tile(g, 64, 128, 0, 0, 64, 64);
        tile(g, 64, 128, -32, 64, 64, 64);
        tile(g, 64, 128, 32, 64, 64, 64);
      }
    },
    shingle: {
      tw: 1,
      th: 0.28,
      c: 0x6c7076,
      cap: 0x4c5056,
      fas: 0xece8df,
      H: 0.22,
      house: 1,
      cw: 128,
      ch: 64,
      draw: g => {
        let sd = 7;
        const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
        for (let row = 0; row < 2; row++) for (let k = -1; k < 3; k++) {
          const x = k * 43 + (row ? 21 : 0),
            y = row * 32,
            v = 200 + Math.floor(rnd() * 45);
          g.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
          g.fillRect(x, y, 43, 32);
          g.fillStyle = "rgba(0,0,0,.45)";
          g.fillRect(x, y, 2, 32);
        }
        g.fillStyle = "rgba(0,0,0,.4)";
        g.fillRect(0, 29, 128, 3);
        g.fillRect(0, 61, 128, 3);
      }
    },
    fiber: {
      tw: 0.18,
      th: 1.2,
      c: 0xbab9b1,
      cap: 0x9d9c94,
      fas: 0xa9a8a0,
      H: 0.15,
      cw: 32,
      ch: 64,
      draw: g => {
        for (let x = 0; x < 32; x++) {
          const v = Math.round(190 + 55 * Math.cos(x / 32 * Math.PI * 2));
          g.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
          g.fillRect(x, 0, 1, 64);
        }
        g.fillStyle = "rgba(0,0,0,.28)";
        g.fillRect(0, 60, 32, 4);
      }
    },
    concrete: {
      tw: 1,
      th: 1,
      c: 0xc6c2ba,
      cap: 0xa8a49c,
      fas: 0xbdb9b1,
      H: 0.25,
      house: 1,
      cw: 64,
      ch: 64,
      draw: g => {
        g.fillStyle = "#ebe8e2";
        g.fillRect(0, 0, 64, 64);
        let sd = 3;
        for (let i = 0; i < 260; i++) {
          sd = (sd * 9301 + 49297) % 233280;
          const x = sd % 64;
          sd = (sd * 9301 + 49297) % 233280;
          const y = sd % 64;
          g.fillStyle = i % 2 ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.35)";
          g.fillRect(x, y, 2, 2);
        }
        g.fillStyle = "rgba(0,0,0,.14)";
        g.fillRect(0, 0, 64, 1);
        g.fillRect(0, 0, 1, 64);
      }
    }
  };
  const MT = {};
  const MTX = {};
  let aoMatV = null,
    panAO = null;
  const aoMat = () => aoMatV || (aoMatV = new THREE.MeshBasicMaterial({
    map: p3sAOTex(THREE),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  }));
  const aoMesh = (pos, uv, mat) => {
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    add(new THREE.Mesh(g, mat)).renderOrder = 1;
  };
  const apP = [],
    apU = [];
  const matSet = (key, col) => {
    const ck = key + "|" + (col || "");
    if (MT[ck]) return MT[ck];
    const D = MDEF[key] || MDEF.metal;
    let t = MTX[key];
    if (!t) {
      const c = document.createElement("canvas");
      c.width = D.cw;
      c.height = D.ch;
      D.draw(c.getContext("2d"));
      t = MTX[key] = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 2;
      t.repeat.set(1 / D.tw, 1 / D.th);
    }
    const cc = col && /^#[0-9a-f]{6}$/i.test(col) ? new THREE.Color(col) : null;
    return MT[ck] = {
      roof: new THREE.MeshLambertMaterial({
        color: cc ? cc.clone() : D.c,
        map: t,
        side: THREE.DoubleSide
      }),
      cap: new THREE.MeshLambertMaterial({
        color: cc ? cc.clone().multiplyScalar(0.78) : D.cap,
        side: THREE.DoubleSide
      }),
      fas: new THREE.MeshLambertMaterial({
        color: cc && !D.house ? cc.clone().multiplyScalar(0.9) : D.fas,
        side: THREE.DoubleSide
      }),
      H: D.H,
      house: !!D.house
    };
  };
  const roofMat = matSet("metal").roof;
  let curMS = matSet("metal");
  const fasciaQ = [],
    fqPush = (...a) => a.forEach(o => {
      o.m = curMS;
      fasciaQ.push(o);
    });
  const gravelMat = new THREE.MeshLambertMaterial({
    color: 0xb8b0a0,
    side: THREE.DoubleSide
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x9aa3ac,
    metalness: 0.4,
    roughness: 0.5
  });
  const parMat = new THREE.MeshLambertMaterial({
    color: 0xd8d4cb,
    side: THREE.DoubleSide
  });
  const bar = (a, b, w, h) => {
    const L = a.distanceTo(b);
    if (L < 0.01) return;
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, L), steelMat));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.lookAt(b);
    m.castShadow = true;
    m.receiveShadow = true;
  };
  const meshOf = (arr, mat) => {
    if (!arr.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, mat));
    m.castShadow = true;
    m.receiveShadow = true;
  };
  const wallTex = (() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#ebe8e1";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 4; i++) {
      const x = i * 32;
      g.fillStyle = "#d9d5cc";
      g.fillRect(x, 0, 5, 128);
      g.fillStyle = "#f6f4ef";
      g.fillRect(x + 5, 0, 3, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  })();
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: wallTex,
    side: THREE.DoubleSide
  });
  const plasterMat = new THREE.MeshLambertMaterial({
    color: 0xf1ece2,
    side: THREE.DoubleSide
  });
  const baseMat = new THREE.MeshLambertMaterial({
    color: 0x8b8f94,
    side: THREE.DoubleSide
  });
  const trimMat = new THREE.LineBasicMaterial({
    color: 0x9c968a
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x475569
  });
  const polyMesh = (pts3, azDeg, mat) => {
    const contour = pts3.map(p => new THREE.Vector2(p.x, p.z));
    let tris = [];
    try {
      tris = THREE.ShapeUtils.triangulateShape(contour, []);
    } catch (e) {
      tris = [];
    }
    if (!tris.length) for (let i = 1; i < pts3.length - 1; i++) tris.push([0, i, i + 1]);
    const pos = [],
      uv = [];
    let nx = 0,
      ny = 0,
      nz = 0;
    for (let i = 0; i < pts3.length; i++) {
      const a = pts3[i],
        b = pts3[(i + 1) % pts3.length];
      nx += (a.y - b.y) * (a.z + b.z);
      ny += (a.z - b.z) * (a.x + b.x);
      nz += (a.x - b.x) * (a.y + b.y);
    }
    if (ny < 0) {
      nx = -nx;
      nz = -nz;
      ny = -ny;
    }
    const nl = Math.hypot(nx, ny, nz) || 1,
      hl = Math.hypot(nx, nz);
    let hx, hz;
    if (hl / nl > 0.02) {
      hx = nx / hl;
      hz = nz / hl;
    } else {
      const a = (+azDeg || 180) * P3_DEG;
      hx = Math.sin(a);
      hz = -Math.cos(a);
    }
    const cs = Math.max(0.2, ny / nl);
    tris.forEach(t => t.forEach(i => {
      const q = pts3[i];
      pos.push(q.x, q.y, q.z);
      uv.push(-hz * q.x + hx * q.z, (hx * q.x + hz * q.z) / cs);
    }));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat || roofMat);
    m.castShadow = true;
    m.receiveShadow = true;
    add(m);
    const lp = pts3.concat([pts3[0]]).map(p => new THREE.Vector3(p.x, p.y + 0.02, p.z));
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), edgeMat)).userData.helper = true;
    return tris.map(t => t.map(i => pts3[i]));
  };
  const surfY = (tris, x, z) => {
    for (let i = 0; i < tris.length; i++) {
      const [A, B, C] = tris[i];
      const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z);
      if (Math.abs(d) < 1e-9) continue;
      const a = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d,
        b = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d,
        c = 1 - a - b;
      if (a > -1e-3 && b > -1e-3 && c > -1e-3) return a * A.y + b * B.y + c * C.y;
    }
    return null;
  };
  const insetPoly = (pts, d) => {
    const n = pts.length;
    let A = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i],
        b = pts[(i + 1) % n];
      A += a.x * b.z - b.x * a.z;
    }
    const sg = A > 0 ? 1 : -1,
      L = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i],
        b = pts[(i + 1) % n],
        dx = b.x - a.x,
        dz = b.z - a.z,
        l = Math.hypot(dx, dz) || 1;
      L.push({
        x: a.x - dz / l * sg * d,
        z: a.z + dx / l * sg * d,
        dx,
        dz
      });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const P = L[(i + n - 1) % n],
        Q = L[i],
        den = P.dx * Q.dz - P.dz * Q.dx;
      if (Math.abs(den) < 1e-9) {
        out.push({
          x: Q.x,
          z: Q.z
        });
        continue;
      }
      const t = ((Q.x - P.x) * Q.dz - (Q.z - P.z) * Q.dx) / den;
      out.push({
        x: P.x + P.dx * t,
        z: P.z + P.dz * t
      });
    }
    return out;
  };
  const wall = (foot0, tris, hMin, convex, wm) => {
    if (!(hMin > 0.2) || !foot0 || foot0.length < 3) return;
    let foot = foot0;
    if (convex) {
      let mnx = Infinity,
        mxx = -Infinity,
        mnz = Infinity,
        mxz = -Infinity;
      foot0.forEach(p => {
        mnx = Math.min(mnx, p.x);
        mxx = Math.max(mxx, p.x);
        mnz = Math.min(mnz, p.z);
        mxz = Math.max(mxz, p.z);
      });
      const d = Math.min(0.5, Math.min(mxx - mnx, mxz - mnz) * 0.04);
      if (d > 0.05) foot = insetPoly(foot0, d);
    }
    let A = 0;
    foot.forEach((a, i) => {
      const b = foot[(i + 1) % foot.length];
      A += a.x * b.z - b.x * a.z;
    });
    const sg = A > 0 ? 1 : -1;
    const topAt = (x, z) => {
      const y = surfY(tris, x, z);
      return y == null ? hMin : Math.max(0.3, y - 0.04);
    };
    const wp = [],
      wu = [],
      bp = [],
      tl = [],
      ep = [],
      eu = [];
    const quad = (arr, a, b, y0a, y1a, y0b, y1b, o) => {
      const ox = o ? o.x : 0,
        oz = o ? o.z : 0;
      arr.push(a.x + ox, y0a, a.z + oz, b.x + ox, y0b, b.z + oz, b.x + ox, y1b, b.z + oz, a.x + ox, y0a, a.z + oz, b.x + ox, y1b, b.z + oz, a.x + ox, y1a, a.z + oz);
    };
    let run = 0;
    foot.forEach((a, i) => {
      const b = foot[(i + 1) % foot.length],
        dx = b.x - a.x,
        dz = b.z - a.z,
        len = Math.hypot(dx, dz);
      if (len < 0.05) return;
      const out = {
        x: dz / len * sg * 0.03,
        z: -dx / len * sg * 0.03
      };
      const n = Math.max(1, Math.ceil(len / 1));
      for (let k = 0; k < n; k++) {
        const t0 = k / n,
          t1 = (k + 1) / n;
        const P = {
            x: a.x + dx * t0,
            z: a.z + dz * t0
          },
          Q = {
            x: a.x + dx * t1,
            z: a.z + dz * t1
          };
        const hP = topAt(P.x, P.z),
          hQ = topAt(Q.x, Q.z);
        quad(wp, P, Q, 0, hP, 0, hQ);
        const u0 = run + len * t0,
          u1 = run + len * t1;
        wu.push(u0, 0, u1, 0, u1, hQ, u0, 0, u1, hQ, u0, hP);
        tl.push(P.x, hP, P.z, Q.x, hQ, Q.z);
        const lP = Math.max(0.05, hP - 0.9),
          lQ = Math.max(0.05, hQ - 0.9);
        quad(ep, P, Q, lP, hP, lQ, hQ, {
          x: out.x * 1.5,
          z: out.z * 1.5
        });
        eu.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
      }
      run += len;
      const bh = Math.min(0.6, hMin * 0.15);
      quad(bp, a, b, 0, bh, 0, bh, out);
    });
    const mk = (arr, mat, uv) => {
      if (!arr.length) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
      if (uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      const m = add(new THREE.Mesh(g, mat));
      m.castShadow = true;
      m.receiveShadow = true;
    };
    mk(wp, wm || wallMat, wu);
    mk(bp, baseMat);
    const AW = 1.1,
      ap = [],
      au = [],
      nE = foot.map((a, i) => {
        const b = foot[(i + 1) % foot.length],
          L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        return {
          x: (b.z - a.z) / L * sg,
          z: -(b.x - a.x) / L * sg
        };
      });
    const off = foot.map((a, i) => {
      const n0 = nE[(i - 1 + foot.length) % foot.length],
        n1 = nE[i];
      let mx = n0.x + n1.x,
        mz = n0.z + n1.z;
      const L = Math.hypot(mx, mz) || 1;
      mx /= L;
      mz /= L;
      const sc = AW / Math.max(0.35, mx * n1.x + mz * n1.z);
      return {
        x: a.x + mx * sc,
        z: a.z + mz * sc
      };
    });
    foot.forEach((a, i) => {
      const j = (i + 1) % foot.length,
        b = foot[j],
        A2 = off[i],
        B2 = off[j],
        Y = 0.006;
      ap.push(a.x, Y, a.z, b.x, Y, b.z, B2.x, Y, B2.z, a.x, Y, a.z, B2.x, Y, B2.z, A2.x, Y, A2.z);
      au.push(0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0);
    });
    aoMesh(ap, au, aoMat());
    aoMesh(ep, eu, aoMat());
    const cl = [];
    foot.forEach(p => cl.push(p.x, 0, p.z, p.x, topAt(p.x, p.z), p.z));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(cl.concat(tl), 3));
    add(new THREE.LineSegments(lg, trimMat));
  };
  const allTris = [];
  const topY = (x, z) => {
    let y = null;
    for (let i = 0; i < allTris.length; i++) {
      const v = surfY([allTris[i]], x, z);
      if (v != null && (y == null || v > y)) y = v;
    }
    return y;
  };
  (st.roofs || []).forEach(roof => {
    let faces = [];
    curMS = roof.p3sGround ? matSet("metal") : matSet(p3sRoofMat(roof), roof.p3sCol);
    const wmat = curMS.house ? plasterMat : wallMat;
    if (roof.kind === "poly") {
      if (!Array.isArray(roof.pts) || roof.pts.length < 3) return;
      const ph = p3PhOf(roof);
      faces = [roof.pts.map((p, i) => ({
        x: (+roof.x || 0) + (+p.x || 0),
        y: bH + ph[i],
        z: (+roof.z || 0) + (+p.z || 0)
      }))];
    } else if (roof.kind === "dome") {
      const D = p3DomeGeo(roof),
        a = -(((+roof.az || 180) - 180) * P3_DEG),
        h0 = +roof.h || 3,
        segs = 24;
      const W = (x, y, z) => {
        const q = p3sRY(x, z, a);
        return new THREE.Vector3(q.x + (+roof.x || 0), y + h0, q.z + (+roof.z || 0));
      };
      const pos = [],
        uv = [],
        dTris = [];
      for (let i = 0; i < segs; i++) {
        const t1 = -D.th + 2 * D.th * i / segs,
          t2 = -D.th + 2 * D.th * (i + 1) / segs;
        const A = W(-D.len / 2, D.yAt(t1), D.zAt(t1)),
          B = W(D.len / 2, D.yAt(t1), D.zAt(t1));
        const C = W(D.len / 2, D.yAt(t2), D.zAt(t2)),
          E = W(-D.len / 2, D.yAt(t2), D.zAt(t2));
        [A, B, C, A, C, E].forEach(v => pos.push(v.x, v.y, v.z));
        const r = Math.max(1, +roof.span || 6) / 2;
        [[-D.len / 2, t1], [D.len / 2, t1], [D.len / 2, t2], [-D.len / 2, t1], [D.len / 2, t2], [-D.len / 2, t2]].forEach(([u, t]) => uv.push(u, t * r));
        fqPush({
          p: A,
          q: E,
          c: {
            x: +roof.x || 0,
            z: +roof.z || 0
          }
        }, {
          p: B,
          q: C,
          c: {
            x: +roof.x || 0,
            z: +roof.z || 0
          }
        });
        if (i === 0) fqPush({
          p: A,
          q: B,
          c: {
            x: +roof.x || 0,
            z: +roof.z || 0
          }
        });
        if (i === segs - 1) fqPush({
          p: E,
          q: C,
          c: {
            x: +roof.x || 0,
            z: +roof.z || 0
          }
        });
        allTris.push([A, B, C], [A, C, E]);
        dTris.push([A, B, C], [A, C, E]);
        eat(A.x, A.y, A.z);
        eat(C.x, C.y, C.z);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      const m = add(new THREE.Mesh(g, curMS.roof));
      m.castShadow = true;
      m.receiveShadow = true;
      wall(p3sFaces2D(roof)[0] ? p3sFaces2D(roof)[0].pts : [], dTris, h0, true, wmat);
    } else {
      const all = Object.assign({}, roof, {
        sideA: true,
        sideB: true,
        sideC: true,
        sideD: true
      });
      try {
        faces = p3RoofSurf(all).map(s => s.pts);
      } catch (e) {
        faces = [];
      }
    }
    let tris = [];
    faces.forEach(f => {
      tris = tris.concat(polyMesh(f, roof.az, roof.p3sGround ? gravelMat : curMS.roof) || []);
      f.forEach(p => eat(p.x, p.y, p.z));
    });
    if (faces.length) {
      const K = q => Math.round(q.x * 20) + "," + Math.round(q.y * 20) + "," + Math.round(q.z * 20);
      const cen = faces.map(f => {
        const c = {
          x: 0,
          y: 0,
          z: 0
        };
        f.forEach(q => {
          c.x += q.x / f.length;
          c.y += q.y / f.length;
          c.z += q.z / f.length;
        });
        return c;
      });
      const E = new Map();
      faces.forEach((f, fi) => f.forEach((a, i) => {
        const b = f[(i + 1) % f.length];
        if (Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) < 0.05) return;
        const ka = K(a),
          kb = K(b),
          k = ka < kb ? ka + "|" + kb : kb + "|" + ka;
        const e = E.get(k);
        if (e) e.f.push(fi);else E.set(k, {
          a,
          b,
          f: [fi]
        });
      }));
      const cap = [];
      E.forEach(e => {
        if (e.f.length === 1) {
          if (!roof.p3sGround && !(+roof.p3sParapet > 0)) fqPush({
            p: e.a,
            q: e.b,
            c: cen[e.f[0]]
          });
          return;
        }
        const my = (e.a.y + e.b.y) / 2;
        if (!e.f.every(fi => cen[fi].y < my - 0.02)) return;
        const dx = e.b.x - e.a.x,
          dy = e.b.y - e.a.y,
          dz = e.b.z - e.a.z,
          L = Math.hypot(dx, dy, dz);
        const ex = -dx / L * 0.1,
          ey = -dy / L * 0.1,
          ez = -dz / L * 0.1;
        e.f.slice(0, 2).forEach(fi => {
          const c = cen[fi],
            t = ((c.x - e.a.x) * dx + (c.y - e.a.y) * dy + (c.z - e.a.z) * dz) / (L * L);
          let wx = c.x - (e.a.x + dx * t),
            wy = c.y - (e.a.y + dy * t),
            wz = c.z - (e.a.z + dz * t);
          const wl = Math.hypot(wx, wy, wz) || 1;
          wx = wx / wl * 0.2;
          wy = wy / wl * 0.2;
          wz = wz / wl * 0.2;
          const P0 = {
              x: e.a.x + ex,
              y: e.a.y + ey + 0.07,
              z: e.a.z + ez
            },
            P1 = {
              x: e.b.x - ex,
              y: e.b.y - ey + 0.07,
              z: e.b.z - ez
            };
          const Q1 = {
              x: P1.x + wx,
              y: P1.y + wy - 0.03,
              z: P1.z + wz
            },
            Q0 = {
              x: P0.x + wx,
              y: P0.y + wy - 0.03,
              z: P0.z + wz
            };
          [P0, P1, Q1, P0, Q1, Q0].forEach(v => cap.push(v.x, v.y, v.z));
          const R1 = {
              x: Q1.x,
              y: Q1.y - 0.05,
              z: Q1.z
            },
            R0 = {
              x: Q0.x,
              y: Q0.y - 0.05,
              z: Q0.z
            };
          [Q0, Q1, R1, Q0, R1, R0].forEach(v => cap.push(v.x, v.y, v.z));
        });
      });
      meshOf(cap, curMS.cap);
    }
    allTris.push.apply(allTris, tris);
    if (faces.length) {
      const minY = Math.min.apply(null, faces.map(f => Math.min.apply(null, f.map(p => p.y))));
      const OL = p3sOutline(roof);
      if (roof.p3sOpen) {
        const IN = OL.length > 2 ? insetPoly(OL, 0.3) : OL,
          top = [];
        IN.forEach((a, i) => {
          const b = IN[(i + 1) % IN.length],
            L = Math.hypot(b.x - a.x, b.z - a.z),
            k = Math.max(1, Math.ceil(L / 6));
          for (let j = 0; j < k; j++) {
            const x = a.x + (b.x - a.x) * j / k,
              z = a.z + (b.z - a.z) * j / k,
              y = surfY(tris, x, z);
            top.push(new THREE.Vector3(x, (y == null ? minY : y) - 0.12, z));
          }
        });
        top.forEach((t, i) => {
          bar(new THREE.Vector3(t.x, 0, t.z), t, 0.15, 0.15);
          bar(t, top[(i + 1) % top.length], 0.1, 0.2);
        });
      } else if (!roof.p3sGround) wall(OL, tris, minY - 0.03, roof.kind !== "poly" && !roof.grp, wmat);
      if (+roof.p3sParapet > 0 && OL.length > 2) {
        const H = +roof.p3sParapet,
          IN = insetPoly(OL, 0.2),
          pa = [];
        const yAt = q => {
          const y = surfY(tris, q.x, q.z);
          return y == null ? minY : y;
        };
        OL.forEach((a, i) => {
          const b = OL[(i + 1) % OL.length],
            ai = IN[i],
            bi = IN[(i + 1) % IN.length];
          const ya = yAt(ai),
            yb = yAt(bi),
            A = (x, y, z) => pa.push(x, y, z);
          [[a, ya], [b, yb], [b, yb + H], [a, ya], [b, yb + H], [a, ya + H]].forEach(([q, y]) => A(q.x, y, q.z));
          [[ai, ya], [bi, yb], [bi, yb + H], [ai, ya], [bi, yb + H], [ai, ya + H]].forEach(([q, y]) => A(q.x, y, q.z));
          [[a, ya + H], [b, yb + H], [bi, yb + H], [a, ya + H], [bi, yb + H], [ai, ya + H]].forEach(([q, y]) => A(q.x, y, q.z));
        });
        meshOf(pa, parMat);
      }
    }
    let foot = [];
    try {
      foot = p3Foot(roof);
    } catch (e) {
      foot = [];
    }
    if (!foot.length) return;
    const pos = [],
      fr = [],
      ln = [],
      rl = [],
      ft = [];
    const yFix = roof.kind === "poly" ? bH - (+roof.h || 0) : 0;
    const Q = (arr, a, b, d, e) => [a, b, d, a, d, e].forEach(v => arr.push(v.x, v.y, v.z));
    const box = (arr, c, a, b, h) => {
      const V3 = (i, j, k) => new THREE.Vector3(c.x + a.x * i + b.x * j + h.x * k, c.y + a.y * i + b.y * j + h.y * k, c.z + a.z * i + b.z * j + h.z * k);
      Q(arr, V3(-1, -1, 1), V3(1, -1, 1), V3(1, 1, 1), V3(-1, 1, 1));
      Q(arr, V3(-1, 1, -1), V3(1, 1, -1), V3(1, -1, -1), V3(-1, -1, -1));
      Q(arr, V3(-1, -1, -1), V3(1, -1, -1), V3(1, -1, 1), V3(-1, -1, 1));
      Q(arr, V3(1, 1, -1), V3(-1, 1, -1), V3(-1, 1, 1), V3(1, 1, 1));
      Q(arr, V3(-1, 1, -1), V3(-1, -1, -1), V3(-1, -1, 1), V3(-1, 1, 1));
      Q(arr, V3(1, -1, -1), V3(1, 1, -1), V3(1, 1, 1), V3(1, -1, 1));
    };
    const sc = (v, k) => ({
      x: v.x * k,
      y: v.y * k,
      z: v.z * k
    });
    const hz = (v, k) => {
      const l = Math.hypot(v.x, v.z) || 1;
      return {
        x: v.x / l * k,
        y: 0,
        z: v.z / l * k
      };
    };
    const cellK = (x, z) => Math.round(x / 0.5) + "," + Math.round(z / 0.5),
      fGrid = new Map();
    foot.forEach(f => {
      const k = cellK(f.cx, f.cz);
      if (!fGrid.has(k)) fGrid.set(k, []);
      fGrid.get(k).push(f);
    });
    const hasNb = (x, z) => {
      const i0 = Math.round(x / 0.5),
        j0 = Math.round(z / 0.5);
      for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
        const L = fGrid.get(i + "," + j);
        if (L && L.some(g => Math.hypot(g.cx - x, g.cz - z) < 0.2)) return true;
      }
      return false;
    };
    foot.forEach(f => {
      const c = {
          x: f.cx,
          y: f.cy + yFix,
          z: f.cz
        },
        U = f.u,
        V = f.v,
        n = f.n;
      const o = 0.12;
      pans.push({
        x: c.x,
        y: c.y,
        z: c.z,
        nx: n.x,
        ny: n.y,
        nz: n.z
      });
      {
        const K = 1.15,
          e = 0.012,
          W = (su, sv) => [c.x + (su * U.x + sv * V.x) * K + n.x * e, c.y + (su * U.y + sv * V.y) * K + n.y * e, c.z + (su * U.z + sv * V.z) * K + n.z * e];
        [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(([su, sv, uu, vv]) => {
          apP.push(...W(su, sv));
          apU.push(uu, vv);
        });
      }
      let lift = 0;
      const P = (su, sv, dn) => {
        const k = o + (dn || 0);
        return new THREE.Vector3(c.x + su * U.x + sv * V.x + n.x * k, c.y + su * U.y + sv * V.y + n.y * k + lift, c.z + su * U.z + sv * V.z + n.z * k);
      };
      if (roof.kind === "poly" && tris.length) {
        [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(([su, sv]) => {
          const q = P(su, sv),
            y = surfY(tris, q.x, q.z);
          if (y != null && y + 0.05 > q.y) lift += y + 0.05 - q.y;
        });
      }
      const lu = Math.hypot(U.x, U.y, U.z) || 1,
        lv = Math.hypot(V.x, V.y, V.z) || 1,
        fu = 1 - 0.03 / lu,
        fv = 1 - 0.03 / lv,
        T = 0.035,
        up = 0.006;
      Q(pos, P(-fu, -fv), P(fu, -fv), P(fu, fv), P(-fu, fv));
      Q(fr, P(-1, -1, up), P(1, -1, up), P(fu, -fv, up), P(-fu, -fv, up));
      Q(fr, P(1, -1, up), P(1, 1, up), P(fu, fv, up), P(fu, -fv, up));
      Q(fr, P(1, 1, up), P(-1, 1, up), P(-fu, fv, up), P(fu, fv, up));
      Q(fr, P(-1, 1, up), P(-1, -1, up), P(-fu, -fv, up), P(-fu, fv, up));
      [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([u0, v0, u1, v1]) => Q(fr, P(u0, v0, up), P(u1, v1, up), P(u1, v1, -T), P(u0, v0, -T)));
      const nu = lu >= lv ? 12 : 6,
        nv = lu >= lv ? 6 : 12;
      for (let i = 1; i < nu; i++) {
        const t = -fu + 2 * fu * i / nu;
        [P(t, -fv, 0.002), P(t, fv, 0.002)].forEach(v => ln.push(v.x, v.y, v.z));
      }
      for (let i = 1; i < nv; i++) {
        const t = -fv + 2 * fv * i / nv;
        [P(-fu, t, 0.002), P(fu, t, 0.002)].forEach(v => ln.push(v.x, v.y, v.z));
      }
      {
        const port = lv >= lu,
          A = port ? U : V,
          B = port ? V : U,
          la = port ? lu : lv,
          lb = port ? lv : lu;
        const at = (sa, sb, dn) => port ? P(sa, sb, dn) : P(sb, sa, dn);
        const rT = -T,
          rB = -T - 0.035,
          wb = 0.02 / lb,
          gapA = 0.03 / la;
        const nbAt = sg => hasNb(f.cx + A.x * sg * (2 + gapA), f.cz + A.z * sg * (2 + gapA));
        const e0 = 1 + (nbAt(-1) ? 0.016 : 0.15) / la,
          e1 = 1 + (nbAt(1) ? 0.016 : 0.15) / la;
        [-0.5, 0.5].forEach(sb => {
          const c0 = at((e1 - e0) / 2, sb, (rT + rB) / 2);
          box(rl, c0, sc(A, (e0 + e1) / 2), sc(B, wb), sc(n, 0.0175));
          (la > 0.8 ? [-0.5, 0.5] : [0]).forEach(sa => {
            const q = at(sa, sb, rB),
              ys0 = tris.length ? surfY(tris, q.x, q.z) : null,
              ys = ys0 == null ? q.y - (o - T - 0.035) : ys0;
            const hgt = q.y - ys;
            if (hgt < 0.005) return;
            const ha = hz(A, 0.025),
              hb = hz(B, 1);
            if (hgt < 0.16) {
              const off = 0.024 + 0.0025;
              box(ft, {
                x: q.x + hb.x * off,
                y: (ys + q.y + 0.03) / 2,
                z: q.z + hb.z * off
              }, ha, sc(hb, 0.0025), {
                x: 0,
                y: (q.y + 0.03 - ys) / 2,
                z: 0
              });
              box(ft, {
                x: q.x + hb.x * (off + 0.04),
                y: ys + 0.003,
                z: q.z + hb.z * (off + 0.04)
              }, ha, sc(hb, 0.042), {
                x: 0,
                y: 0.003,
                z: 0
              });
            } else {
              box(ft, {
                x: q.x,
                y: (ys + q.y) / 2,
                z: q.z
              }, hz(A, 0.02), sc(hb, 0.02), {
                x: 0,
                y: hgt / 2,
                z: 0
              });
              box(ft, {
                x: q.x,
                y: ys + 0.004,
                z: q.z
              }, hz(A, 0.06), sc(hb, 0.06), {
                x: 0,
                y: 0.004,
                z: 0
              });
            }
          });
        });
      }
      const d = P(1, 1);
      eat(d.x, d.y, d.z);
    });
    if (rl.length) {
      const rg = new THREE.BufferGeometry();
      rg.setAttribute("position", new THREE.Float32BufferAttribute(rl, 3));
      rg.computeVertexNormals();
      const rm = add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({
        color: 0xbfc6ce,
        roughness: 0.38,
        metalness: 0.55
      })));
      rm.castShadow = true;
      rm.receiveShadow = true;
    }
    if (ft.length) {
      const fg2 = new THREE.BufferGeometry();
      fg2.setAttribute("position", new THREE.Float32BufferAttribute(ft, 3));
      fg2.computeVertexNormals();
      const fm2 = add(new THREE.Mesh(fg2, new THREE.MeshStandardMaterial({
        color: 0x9aa4ae,
        roughness: 0.45,
        metalness: 0.5
      })));
      fm2.castShadow = true;
      fm2.receiveShadow = true;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const pm = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      color: 0x0a1a48,
      roughness: 0.2,
      metalness: 0.1,
      envMapIntensity: 0.5,
      side: THREE.DoubleSide
    })));
    pm.castShadow = true;
    pm.receiveShadow = true;
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.Float32BufferAttribute(fr, 3));
    fg.computeVertexNormals();
    const fm = add(new THREE.Mesh(fg, new THREE.MeshStandardMaterial({
      color: 0xc9d0d8,
      roughness: 0.4,
      metalness: 0.6,
      side: THREE.DoubleSide
    })));
    fm.castShadow = true;
    fm.receiveShadow = true;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.Float32BufferAttribute(ln, 3));
    add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      color: 0x8aa0d6,
      transparent: true,
      opacity: 0.35
    })));
  });
  {
    const FA = new Map();
    fasciaQ.forEach(({
      p,
      q,
      c,
      m
    }) => {
      const M = m || matSet("metal");
      if (!FA.has(M)) FA.set(M, []);
      const fa = FA.get(M);
      const dx = q.x - p.x,
        dz = q.z - p.z,
        L = Math.hypot(dx, dz);
      let ox = 0,
        oz = 0;
      if (L > 0.01) {
        ox = dz / L;
        oz = -dx / L;
        const mx = (p.x + q.x) / 2 - c.x,
          mz = (p.z + q.z) / 2 - c.z;
        if (ox * mx + oz * mz < 0) {
          ox = -ox;
          oz = -oz;
        }
      } else return;
      const mx = (p.x + q.x) / 2,
        mz = (p.z + q.z) / 2,
        my = (p.y + q.y) / 2,
        y2 = topY(mx + ox * 0.15, mz + oz * 0.15);
      if (y2 != null && y2 > my - 0.4) return;
      const o = 0.03,
        H = M.H || 0.2,
        up = 0.04;
      const a = {
          x: p.x + ox * o,
          y: p.y + up,
          z: p.z + oz * o
        },
        b = {
          x: q.x + ox * o,
          y: q.y + up,
          z: q.z + oz * o
        };
      const a2 = {
          x: a.x,
          y: a.y - H,
          z: a.z
        },
        b2 = {
          x: b.x,
          y: b.y - H,
          z: b.z
        };
      const ai = {
          x: p.x - ox * 0.04,
          y: p.y + up,
          z: p.z - oz * 0.04
        },
        bi = {
          x: q.x - ox * 0.04,
          y: q.y + up,
          z: q.z - oz * 0.04
        };
      [a, b, b2, a, b2, a2, ai, bi, b, ai, b, a].forEach(v => fa.push(v.x, v.y, v.z));
    });
    FA.forEach((fa, M) => meshOf(fa, M.fas));
  }
  const metal = new THREE.MeshStandardMaterial({
    color: 0xd9dee4,
    metalness: 0.3,
    roughness: 0.38
  });
  const metalV = new THREE.MeshStandardMaterial({
    color: 0xd2d8df,
    metalness: 0.35,
    roughness: 0.32,
    flatShading: true
  });
  const SUP = 0.06,
    supLift = (x, z) => {
      const g = topY(x, z);
      return g == null ? 0 : g + SUP;
    };
  const supAt = P => {
    const out = [];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1],
        b = P[i],
        L = Math.hypot(b.x - a.x, b.z - a.z);
      if (L < 1e-3) continue;
      const tx = (b.x - a.x) / L,
        tz = (b.z - a.z) / L,
        m = L < 0.6 ? 1 : Math.ceil((L - 0.4) / 1.2) + 1;
      for (let k = 0; k < m; k++) {
        const sd = m === 1 ? L / 2 : 0.2 + (L - 0.4) * k / (m - 1);
        out.push({
          x: a.x + tx * sd,
          z: a.z + tz * sd,
          tx,
          tz
        });
      }
    }
    return out;
  };
  {
    const ORD = {
        walkway: 0,
        tray: 1,
        pipe: 2
      },
      sts = [];
    (st.obstacles || []).filter(o => ORD[p3sObsType(o)] != null).sort((a, b) => ORD[p3sObsType(a)] - ORD[p3sObsType(b)]).forEach(o => {
      const T = p3sObsType(o),
        hw = T === "pipe" ? (+o.d || 0.025) / 2 + 0.015 : Math.max(0.05, +o.d || (T === "walkway" ? 0.3 : 0.1)) / 2 + 0.005;
      supAt(p3sObsPath(o)).forEach(q => {
        if (topY(q.x, q.z) == null) return;
        const c = sts.find(c => {
          if (Math.abs(c.tx * q.tx + c.tz * q.tz) < 0.96 || Math.abs((q.x - c.x) * c.tx + (q.z - c.z) * c.tz) > 0.45) return false;
          const v = (q.x - c.x) * c.nx + (q.z - c.z) * c.nz;
          return v - hw < c.hi + 1 && v + hw > c.lo - 1;
        });
        if (c) {
          const v = (q.x - c.x) * c.nx + (q.z - c.z) * c.nz;
          c.lo = Math.min(c.lo, v - hw);
          c.hi = Math.max(c.hi, v + hw);
        } else sts.push({
          x: q.x,
          z: q.z,
          tx: q.tx,
          tz: q.tz,
          nx: -q.tz,
          nz: q.tx,
          lo: -hw,
          hi: hw
        });
      });
    });
    const rl = [],
      ft = [],
      QB = (arr, a, b, c, d) => [a, b, c, a, c, d].forEach(v => arr.push(v.x, v.y, v.z));
    const bx = (arr, c, a, b, h) => {
      const V = (i, j, k) => ({
        x: c.x + a.x * i + b.x * j + h.x * k,
        y: c.y + a.y * i + b.y * j + h.y * k,
        z: c.z + a.z * i + b.z * j + h.z * k
      });
      QB(arr, V(-1, -1, 1), V(1, -1, 1), V(1, 1, 1), V(-1, 1, 1));
      QB(arr, V(-1, 1, -1), V(1, 1, -1), V(1, -1, -1), V(-1, -1, -1));
      QB(arr, V(-1, -1, -1), V(1, -1, -1), V(1, -1, 1), V(-1, -1, 1));
      QB(arr, V(1, 1, -1), V(-1, 1, -1), V(-1, 1, 1), V(1, 1, 1));
      QB(arr, V(-1, 1, -1), V(-1, -1, -1), V(-1, -1, 1), V(-1, 1, 1));
      QB(arr, V(1, -1, -1), V(1, 1, -1), V(1, 1, 1), V(1, -1, 1));
    };
    sts.forEach(c => {
      const lo = c.lo - 0.05,
        hi = c.hi + 0.05,
        g0 = topY(c.x, c.z),
        gy = (x, z) => {
          const g = topY(x, z);
          return g == null ? g0 : g;
        };
      const n = Math.max(1, Math.ceil((hi - lo) / 0.5));
      for (let k = 0; k < n; k++) {
        const v0 = lo + (hi - lo) * k / n,
          v1 = lo + (hi - lo) * (k + 1) / n;
        const p0 = {
            x: c.x + c.nx * v0,
            z: c.z + c.nz * v0
          },
          p1 = {
            x: c.x + c.nx * v1,
            z: c.z + c.nz * v1
          };
        const y0 = gy(p0.x, p0.z) + SUP - 0.0175,
          y1 = gy(p1.x, p1.z) + SUP - 0.0175;
        bx(rl, {
          x: (p0.x + p1.x) / 2,
          y: (y0 + y1) / 2,
          z: (p0.z + p1.z) / 2
        }, {
          x: (p1.x - p0.x) / 2,
          y: (y1 - y0) / 2,
          z: (p1.z - p0.z) / 2
        }, {
          x: c.tx * 0.02,
          y: 0,
          z: c.tz * 0.02
        }, {
          x: 0,
          y: 0.0175,
          z: 0
        });
      }
      const m = Math.max(2, Math.ceil((hi - lo - 0.1) / 0.8) + 1),
        off = 0.0225;
      for (let k = 0; k < m; k++) {
        const v = lo + 0.05 + (hi - lo - 0.1) * k / (m - 1),
          x = c.x + c.nx * v,
          z = c.z + c.nz * v,
          g = gy(x, z),
          tp = g + SUP;
        const A = {
          x: c.nx * 0.025,
          y: 0,
          z: c.nz * 0.025
        };
        bx(ft, {
          x: x + c.tx * off,
          y: (g + tp) / 2,
          z: z + c.tz * off
        }, A, {
          x: c.tx * 0.0025,
          y: 0,
          z: c.tz * 0.0025
        }, {
          x: 0,
          y: (tp - g) / 2,
          z: 0
        });
        bx(ft, {
          x: x + c.tx * (off + 0.04),
          y: g + 0.003,
          z: z + c.tz * (off + 0.04)
        }, A, {
          x: c.tx * 0.042,
          y: 0,
          z: c.tz * 0.042
        }, {
          x: 0,
          y: 0.003,
          z: 0
        });
      }
    });
    meshOf(rl, new THREE.MeshStandardMaterial({
      color: 0xbfc6ce,
      roughness: 0.38,
      metalness: 0.55
    }));
    meshOf(ft, new THREE.MeshStandardMaterial({
      color: 0x9aa4ae,
      roughness: 0.45,
      metalness: 0.5
    }));
  }
  (st.obstacles || []).forEach(o => {
    const T = p3sObsType(o),
      onRoof = P3S_ON_ROOF[T] != null,
      ox = +o.x || 0,
      oz = +o.z || 0;
    const by = onRoof ? topY(ox, oz) || 0 : 0;
    if (T === "sky") {
      const P = p3sObsPath(o),
        W = Math.max(0.2, +o.d || 1),
        pos = [],
        ln = [];
      const gY = (x, z) => {
        const y = topY(x, z);
        return (y == null ? by : y) + 0.04;
      };
      const L = (a, b) => ln.push(a.x, a.y + 0.005, a.z, b.x, b.y + 0.005, b.z);
      for (let i = 1; i < P.length; i++) {
        const R = p3sSegRect(P[i - 1], P[i], W / 2, 0),
          Ls = Math.hypot(R[1].x - R[0].x, R[1].z - R[0].z),
          n = Math.max(1, Math.ceil(Ls / 0.5)),
          rows = [];
        for (let k = 0; k <= n; k++) {
          const f = k / n,
            l = new THREE.Vector3(R[0].x + (R[1].x - R[0].x) * f, 0, R[0].z + (R[1].z - R[0].z) * f),
            r = new THREE.Vector3(R[3].x + (R[2].x - R[3].x) * f, 0, R[3].z + (R[2].z - R[3].z) * f);
          l.y = gY(l.x, l.z);
          r.y = gY(r.x, r.z);
          rows.push([l, r]);
        }
        for (let k = 0; k < n; k++) {
          const [a1, b1] = rows[k],
            [a2, b2] = rows[k + 1];
          [a1, b1, b2, a1, b2, a2].forEach(q => pos.push(q.x, q.y, q.z));
        }
        const across = Math.max(2, Math.round(W / 0.2));
        for (let j = 0; j <= across; j++) {
          const f = j / across;
          for (let k = 0; k < n; k++) L(rows[k][0].clone().lerp(rows[k][1], f), rows[k + 1][0].clone().lerp(rows[k + 1][1], f));
        }
        L(rows[0][0], rows[0][1]);
        L(rows[n][0], rows[n][1]);
        eat(P[i].x, gY(P[i].x, P[i].z), P[i].z);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      sg.computeVertexNormals();
      const sm = add(new THREE.Mesh(sg, new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        emissive: 0x9cc9e6,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.38,
        roughness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide
      })));
      sm.receiveShadow = true;
      sm.renderOrder = 2;
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.Float32BufferAttribute(ln, 3));
      add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
        color: 0x7fa6c2,
        transparent: true,
        opacity: 0.7
      })));
      return;
    }
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const tube = (a, b, r, mat) => {
      const d = b.clone().sub(a),
        L = d.length();
      if (L < 1e-4) return null;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), mat || metal);
      m.position.copy(a.clone().add(b).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
      m.castShadow = true;
      m.receiveShadow = true;
      add(m);
      return m;
    };
    const ground = (x, z) => {
      const y = topY(x, z);
      return y == null ? 0 : y;
    };
    if (T === "rail" || T === "walkway") {
      const P = p3sObsPath(o);
      if (T === "rail") {
        const H = Math.max(0.6, +o.h || 1.1),
          posts = p3sRailPosts(P).map(q => ({
            x: q.x,
            z: q.z,
            y: ground(q.x, q.z)
          }));
        posts.forEach((q, k) => {
          const nb = posts[Math.min(posts.length - 1, k + 1)],
            pv = posts[Math.max(0, k - 1)],
            dx = nb.x - pv.x,
            dz = nb.z - pv.z,
            L = Math.hypot(dx, dz) || 1,
            vx = -dz / L,
            vz = dx / L,
            a = Math.atan2(dz, dx);
          const pl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.36), metal);
          pl.position.set(q.x - vx * 0.08, q.y + 0.01, q.z - vz * 0.08);
          pl.rotation.y = -a;
          pl.castShadow = true;
          pl.receiveShadow = true;
          add(pl);
          tube(V3(q.x, q.y, q.z), V3(q.x, q.y + H, q.z), 0.024);
          const bx = q.x - vx * 0.26,
            bz = q.z - vz * 0.26;
          tube(V3(q.x, q.y + H * 0.58, q.z), V3(bx, ground(bx, bz) + 0.03, bz), 0.016);
          eat(q.x, q.y + H, q.z);
        });
        for (let k = 1; k < posts.length; k++) {
          const A = posts[k - 1],
            B = posts[k];
          tube(V3(A.x, A.y + H, A.z), V3(B.x, B.y + H, B.z), 0.024);
          tube(V3(A.x, A.y + H * 0.5, A.z), V3(B.x, B.y + H * 0.5, B.z), 0.018);
        }
        return;
      }
      const wLift = (x, z) => topY(x, z) == null ? 0.02 : supLift(x, z);
      const W = Math.max(0.1, +o.d || 0.3),
        pos = [],
        sides = [],
        ln = [],
        wmat = new THREE.MeshStandardMaterial({
          color: 0xf5b800,
          roughness: 0.6,
          side: THREE.DoubleSide
        });
      const LN = (p, q) => ln.push(p.x, p.y + 0.006, p.z, q.x, q.y + 0.006, q.z);
      for (let i = 1; i < P.length; i++) {
        const R = p3sSegRect(P[i - 1], P[i], W / 2, W / 2),
          Ls = Math.hypot(R[1].x - R[0].x, R[1].z - R[0].z),
          n = Math.max(1, Math.ceil(Ls / 0.5)),
          rows = [];
        for (let k = 0; k <= n; k++) {
          const f = k / n,
            l = V3(R[0].x + (R[1].x - R[0].x) * f, 0, R[0].z + (R[1].z - R[0].z) * f),
            r = V3(R[3].x + (R[2].x - R[3].x) * f, 0, R[3].z + (R[2].z - R[3].z) * f);
          l.y = wLift(l.x, l.z) + 0.1;
          r.y = wLift(r.x, r.z) + 0.1;
          rows.push([l, r]);
        }
        for (let k = 0; k < n; k++) {
          const [a1, b1] = rows[k],
            [a2, b2] = rows[k + 1];
          [a1, b1, b2, a1, b2, a2].forEach(q => pos.push(q.x, q.y, q.z));
        }
        const D = q => V3(q.x, q.y - 0.1, q.z),
          side = (p1, p2) => [p1, p2, D(p2), p1, D(p2), D(p1)].forEach(q => sides.push(q.x, q.y, q.z));
        for (let k = 0; k < n; k++) {
          side(rows[k][0], rows[k + 1][0]);
          side(rows[k][1], rows[k + 1][1]);
        }
        side(rows[0][0], rows[0][1]);
        side(rows[n][0], rows[n][1]);
        const sub = Math.max(1, Math.round(Ls / 0.1)),
          across = Math.max(2, Math.round(W / 0.1));
        for (let j = 0; j <= across; j++) {
          const f = j / across;
          for (let k = 0; k < n; k++) LN(rows[k][0].clone().lerp(rows[k][1], f), rows[k + 1][0].clone().lerp(rows[k + 1][1], f));
        }
        for (let j = 0; j <= sub; j++) {
          const f = j / sub * n,
            k = Math.min(n - 1, Math.floor(f)),
            r = f - k;
          LN(rows[k][0].clone().lerp(rows[k + 1][0], r), rows[k][1].clone().lerp(rows[k + 1][1], r));
        }
        eat(P[i].x, ground(P[i].x, P[i].z), P[i].z);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      gg.computeVertexNormals();
      const wm = add(new THREE.Mesh(gg, wmat));
      wm.castShadow = true;
      wm.receiveShadow = true;
      meshOf(sides, new THREE.MeshStandardMaterial({
        color: 0xc99400,
        roughness: 0.7,
        side: THREE.DoubleSide
      }));
      const lg = new THREE.BufferGeometry();
      lg.setAttribute("position", new THREE.Float32BufferAttribute(ln, 3));
      add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
        color: 0xa87900
      })));
      return;
    }
    if (T === "pipe" || T === "tray") {
      const P = p3sObsPath(o),
        lift = supLift;
      const S = [];
      for (let i = 1; i < P.length; i++) {
        const A = P[i - 1],
          B = P[i],
          n = Math.max(1, Math.ceil(Math.hypot(B.x - A.x, B.z - A.z) / 0.5));
        for (let k = i === 1 ? 0 : 1; k <= n; k++) {
          const x = A.x + (B.x - A.x) * k / n,
            z = A.z + (B.z - A.z) * k / n;
          S.push(V3(x, lift(x, z), z));
        }
      }
      if (T === "pipe") {
        const r = Math.max(0.01, (+o.d || 0.025) / 2),
          up = r;
        const pm = new THREE.MeshStandardMaterial({
            color: 0x3fae74,
            roughness: 0.45,
            metalness: 0.02
          }),
          ym = new THREE.MeshStandardMaterial({
            color: 0xf2d32c,
            roughness: 0.5
          });
        const Y = (q, dy) => V3(q.x, q.y + up + (dy || 0), q.z);
        for (let k = 1; k < S.length; k++) {
          tube(Y(S[k - 1]), Y(S[k]), r, pm);
          tube(Y(S[k - 1], r * 0.92), Y(S[k], r * 0.92), r * 0.16, ym);
        }
        P.forEach((q, k) => {
          if (k === 0 || k === P.length - 1) return;
          const m = new THREE.Mesh(new THREE.SphereGeometry(r * 1.18, 12, 8), pm);
          m.position.copy(Y(V3(q.x, lift(q.x, q.z), q.z)));
          m.castShadow = true;
          add(m);
        });
        const cl = new THREE.MeshStandardMaterial({
          color: 0x9aa4ae,
          roughness: 0.45,
          metalness: 0.5
        });
        supAt(P).forEach(q => {
          if (topY(q.x, q.z) == null) return;
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, r * 2 + 0.008, r * 2 + 0.008), cl);
          b.position.set(q.x, lift(q.x, q.z) + r, q.z);
          b.rotation.y = -Math.atan2(q.tz, q.tx);
          b.castShadow = true;
          add(b);
        });
        const gm = new THREE.MeshStandardMaterial({
            color: 0xbfc4ca,
            roughness: 0.3,
            metalness: 0.6
          }),
          rm = new THREE.MeshStandardMaterial({
            color: 0xe11d23,
            roughness: 0.4
          });
        (o.taps || []).forEach(tp => {
          const w = {
              x: ox + (+tp.x || 0),
              z: oz + (+tp.z || 0)
            },
            nr = p3sNearOnPath(P, w);
          if (!nr) return;
          const base = V3(nr.x, lift(nr.x, nr.z) + up, nr.z),
            H = 0.15,
            top = base.clone().add(V3(0, H, 0));
          const nx = -nr.t.z,
            nz = nr.t.x,
            Dir = (s, y) => V3(top.x + nx * s, top.y + (y || 0), top.z + nz * s);
          tube(base, top, r * 0.9, pm);
          const tee = new THREE.Mesh(new THREE.SphereGeometry(r * 1.3, 12, 8), pm);
          tee.position.copy(base);
          add(tee);
          const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.022, 6), gm);
          nut.position.copy(Dir(-0.005));
          nut.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(nx, 0, nz));
          nut.castShadow = true;
          add(nut);
          tube(Dir(0.005), Dir(0.075), 0.016, gm);
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.016, 16), gm);
          ring.position.copy(Dir(0.05));
          ring.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(nx, 0, nz));
          add(ring);
          tube(Dir(0.07), Dir(0.1, -0.03), 0.012, gm);
          tube(Dir(0.1, -0.03), Dir(0.105, -0.07), 0.012, gm);
          const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.016, 14), gm);
          tip.position.copy(Dir(0.105, -0.075));
          add(tip);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.026, 16), rm);
          cap.position.copy(Dir(0.04, 0.03));
          cap.castShadow = true;
          add(cap);
          const lv = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.016), rm);
          lv.position.copy(Dir(-0.015, 0.045));
          lv.rotation.y = -Math.atan2(nz, nx);
          lv.castShadow = true;
          add(lv);
          eat(top.x, top.y + 0.06, top.z);
        });
        S.forEach(q => eat(q.x, q.y, q.z));
        return;
      }
      const W = Math.max(0.05, +o.d || 0.1),
        H = W >= 0.15 ? 0.1 : 0.05,
        hw = W / 2;
      const mit = sd => P.map((q, i) => {
        const dir = (a, b) => {
          const dx = b.x - a.x,
            dz = b.z - a.z,
            L = Math.hypot(dx, dz);
          return L < 1e-4 ? null : {
            x: dx / L,
            z: dz / L
          };
        };
        const d0 = i > 0 ? dir(P[i - 1], q) : null,
          d1 = i < P.length - 1 ? dir(q, P[i + 1]) : null;
        const n0 = d0 && {
            x: -d0.z,
            z: d0.x
          },
          n1 = d1 && {
            x: -d1.z,
            z: d1.x
          };
        if (!n0 || !n1) {
          const nn = n0 || n1 || {
            x: 0,
            z: 1
          };
          return {
            x: q.x + nn.x * sd,
            z: q.z + nn.z * sd
          };
        }
        let mx = n0.x + n1.x,
          mz = n0.z + n1.z;
        const ml = Math.hypot(mx, mz) || 1;
        mx /= ml;
        mz /= ml;
        const k = sd / Math.max(0.25, mx * n0.x + mz * n0.z);
        return {
          x: q.x + mx * k,
          z: q.z + mz * k
        };
      });
      const ML = mit(hw),
        MR = mit(-hw),
        CL = mit(hw + 0.004),
        CR = mit(-hw - 0.004),
        bot = [],
        buv = [],
        wal = [],
        cov = [];
      const Yp = (q, dy) => V3(q.x, lift(q.x, q.z) + (dy || 0), q.z),
        lp = (a, b, f) => ({
          x: a.x + (b.x - a.x) * f,
          z: a.z + (b.z - a.z) * f
        });
      const QA = (arr, a, b, c, d) => [a, b, c, a, c, d].forEach(v => arr.push(v.x, v.y, v.z));
      let s0 = 0;
      for (let i = 1; i < P.length; i++) {
        const L = Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
        if (L < 1e-3) continue;
        const n = Math.max(1, Math.ceil(L / 0.5)),
          vv = W / 0.08;
        for (let k = 0; k < n; k++) {
          const f0 = k / n,
            f1 = (k + 1) / n;
          const l0 = lp(ML[i - 1], ML[i], f0),
            l1 = lp(ML[i - 1], ML[i], f1),
            r0 = lp(MR[i - 1], MR[i], f0),
            r1 = lp(MR[i - 1], MR[i], f1);
          QA(bot, Yp(l0), Yp(l1), Yp(r1), Yp(r0));
          const u0 = (s0 + L * f0) / 0.4,
            u1 = (s0 + L * f1) / 0.4;
          [[u0, 0], [u1, 0], [u1, vv], [u0, 0], [u1, vv], [u0, vv]].forEach(([u, v]) => buv.push(u, v));
          QA(wal, Yp(l0), Yp(l1), Yp(l1, H), Yp(l0, H));
          QA(wal, Yp(r0), Yp(r1), Yp(r1, H), Yp(r0, H));
          const c0 = lp(CL[i - 1], CL[i], f0),
            c1 = lp(CL[i - 1], CL[i], f1),
            e0 = lp(CR[i - 1], CR[i], f0),
            e1 = lp(CR[i - 1], CR[i], f1);
          QA(cov, Yp(c0, H + 0.004), Yp(c1, H + 0.004), Yp(e1, H + 0.004), Yp(e0, H + 0.004));
        }
        s0 += L;
      }
      [0, P.length - 1].forEach(i => QA(wal, Yp(ML[i]), Yp(MR[i]), Yp(MR[i], H), Yp(ML[i], H)));
      const bg = new THREE.BufferGeometry();
      bg.setAttribute("position", new THREE.Float32BufferAttribute(bot, 3));
      bg.setAttribute("uv", new THREE.Float32BufferAttribute(buv, 2));
      bg.computeVertexNormals();
      const bm = add(new THREE.Mesh(bg, new THREE.MeshStandardMaterial({
        map: p3sTrayTex(THREE),
        roughness: 0.42,
        metalness: 0.45,
        side: THREE.DoubleSide
      })));
      bm.castShadow = true;
      bm.receiveShadow = true;
      meshOf(wal, new THREE.MeshStandardMaterial({
        color: 0xd4d9df,
        roughness: 0.4,
        metalness: 0.45,
        side: THREE.DoubleSide
      }));
      meshOf(cov, new THREE.MeshStandardMaterial({
        color: 0xe3e7eb,
        roughness: 0.35,
        metalness: 0.5,
        side: THREE.DoubleSide
      }));
      S.forEach(q => eat(q.x, q.y + H, q.z));
      return;
    }
    if (T === "ladder") {
      const fit = p3sLadderFit(st.roofs, ox, oz);
      let q, t, n, top;
      if (fit) {
        q = fit.q;
        t = fit.t;
        n = fit.n;
        const yy = topY(q.x - n.x * 0.15, q.z - n.z * 0.15);
        top = yy == null ? Math.max(1, +o.h || 4) : yy;
      } else {
        const a = (+o.rot || 0) * P3_DEG;
        t = {
          x: Math.cos(a),
          z: Math.sin(a)
        };
        n = {
          x: -t.z,
          z: t.x
        };
        q = {
          x: ox - n.x * 0.2,
          z: oz - n.z * 0.2
        };
        top = Math.max(1, +o.h || 4);
      }
      const off = 0.2,
        hw = 0.24,
        cr = 0.36,
        P = (s, u, y) => V3(q.x + n.x * s + t.x * u, y, q.z + n.z * s + t.z * u);
      [-hw, hw].forEach(u => {
        tube(P(off, u, 0), P(off, u, top + 1.1), 0.026);
        tube(P(off, u, top + 1.1), P(-0.45, u, top + 1.1), 0.026);
        tube(P(-0.45, u, top + 1.1), P(-0.45, u, top + 0.02), 0.026);
        for (let y = 1.2; y < top; y += 2) tube(P(off, u, y), P(0.02, u, y), 0.018);
      });
      for (let y = 0.3; y <= top + 0.01; y += 0.3) tube(P(off, -hw, y), P(off, hw, y), 0.014);
      const cc = off + cr - 0.05,
        y0 = Math.min(2.4, top * 0.6),
        hoops = [];
      for (let y = y0; y <= top + 1.05; y += 0.9) hoops.push(y);
      hoops.forEach(y => {
        const tor = new THREE.Mesh(new THREE.TorusGeometry(cr, 0.014, 6, 28), metal);
        tor.position.copy(P(cc, 0, y));
        tor.rotation.x = Math.PI / 2;
        tor.castShadow = true;
        add(tor);
      });
      if (hoops.length > 1) [-0.85, -0.42, 0, 0.42, 0.85].forEach(k => {
        const ang = k * Math.PI / 2,
          s0 = cc + Math.cos(ang) * cr,
          u0 = Math.sin(ang) * cr;
        tube(P(s0, u0, hoops[0]), P(s0, u0, hoops[hoops.length - 1]), 0.012);
      });
      eat(q.x, top + 1.1, q.z);
      return;
    }
    const g = add(new THREE.Group());
    g.position.set(ox, by, oz);
    g.rotation.y = -((+o.rot || 0) * P3_DEG);
    const h = Math.max(0.2, +o.h || 2);
    const put = (geo, mat, y, sy) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.y = y;
      if (sy) m.scale.y = sy;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };
    if (T === "turbine") {
      const R = Math.max(0.15, Math.min(+o.w || 0.6, +o.d || 0.6) / 2),
        neck = h * 0.32,
        ball = h - neck;
      put(new THREE.BoxGeometry(R * 2.3, 0.04, R * 2.3), metal, 0.02);
      put(new THREE.CylinderGeometry(R * 0.62, R * 0.7, neck, 22), metal, neck / 2);
      put(new THREE.SphereGeometry(R, 22, 12), metalV, neck + ball / 2, Math.max(0.5, ball / (2 * R)));
      put(new THREE.CylinderGeometry(R * 0.28, R * 0.28, 0.04, 16), metal, h + 0.01);
    } else if (T === "vent") {
      const r = Math.max(0.15, Math.min(+o.w || 0.6, +o.d || 0.6) / 2),
        pipeR = r * 0.48,
        capH = Math.max(0.12, h * 0.18),
        pipeH = h - capH;
      put(new THREE.CylinderGeometry(pipeR * 1.25, pipeR * 1.6, 0.12, 22), metal, 0.06);
      put(new THREE.CylinderGeometry(pipeR, pipeR, pipeH, 22), metal, pipeH / 2);
      put(new THREE.CylinderGeometry(pipeR * 1.08, pipeR * 1.08, 0.06, 22), metal, pipeH * 0.55);
      put(new THREE.CylinderGeometry(r * 0.96, r * 0.96, capH * 0.28, 26), metal, pipeH + capH * 0.14);
      put(new THREE.CylinderGeometry(r * 0.32, r * 0.96, capH * 0.72, 26), metal, pipeH + capH * 0.28 + capH * 0.36);
    } else if (o.kind === "tree") {
      let sd = 0;
      String(o.id || "t").split("").forEach(ch => {
        sd = sd * 31 + ch.charCodeAt(0) >>> 0;
      });
      const rnd = () => {
        sd = sd * 1664525 + 1013904223 >>> 0;
        return sd / 4294967296;
      };
      const R = Math.max(+o.w || 3, 0.8) / 2,
        H = Math.max(h, R * 1.4),
        trunkH = Math.max(H * 0.3, H - R * 1.7),
        tr0 = Math.max(0.08, R * 0.11);
      const bark = new THREE.MeshStandardMaterial({
        color: 0x6b4a2f,
        roughness: 0.95
      });
      const leafC = [0x2f6b34, 0x3b7f3c, 0x4a8f45, 0x2a5d30];
      put(new THREE.CylinderGeometry(tr0 * 0.7, tr0 * 1.25, trunkH, 9), bark, trunkH / 2);
      const cy = trunkH + R * 0.7;
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + rnd(),
          m = new THREE.Mesh(new THREE.CylinderGeometry(tr0 * 0.35, tr0 * 0.6, R * 0.9, 6), bark);
        m.position.set(Math.cos(a) * R * 0.25, trunkH + R * 0.15, Math.sin(a) * R * 0.25);
        m.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
        m.castShadow = true;
        g.add(m);
      }
      const blobs = 10;
      for (let k = 0; k < blobs; k++) {
        const top = k === blobs - 1,
          a = k / (blobs - 1) * Math.PI * 2 + rnd() * 0.6,
          rr = top ? 0 : R * (k < 5 ? 0.45 + rnd() * 0.1 : 0.25 + rnd() * 0.12);
        const br = R * (top ? 0.7 : 0.55 + rnd() * 0.15);
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(br, 1), new THREE.MeshStandardMaterial({
          color: leafC[k % leafC.length],
          roughness: 0.9,
          flatShading: true
        }));
        m.position.set(Math.cos(a) * rr, cy + (top ? R * 0.55 : k < 5 ? (rnd() - 0.5) * R * 0.3 : R * 0.35), Math.sin(a) * rr);
        m.scale.y = 0.85;
        m.rotation.set(rnd() * 3, rnd() * 3, 0);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
      }
    } else {
      const W = Math.max(+o.w || 1, 0.5),
        D = Math.max(+o.d || 1, 0.5);
      const wall = new THREE.MeshStandardMaterial({
        color: 0xe4ddd0,
        roughness: 0.9
      });
      const trim = new THREE.MeshStandardMaterial({
        color: 0xc9c0b0,
        roughness: 0.85
      });
      const glass = new THREE.MeshStandardMaterial({
        color: 0x5a7d99,
        roughness: 0.15,
        metalness: 0.4
      });
      put(new THREE.BoxGeometry(W, h, D), wall, h / 2);
      const fl = Math.max(1, Math.round(h / 3)),
        fh = h / fl;
      for (let i = 0; i < fl; i++) {
        const wy = i * fh + fh * 0.55;
        if (W > 1.6) [-1, 1].forEach(sg => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(W - 0.8, fh * 0.42, 0.06), glass);
          m.position.set(0, wy, sg * (D / 2 + 0.01));
          g.add(m);
        });
        if (D > 1.6) [-1, 1].forEach(sg => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, fh * 0.42, D - 0.8), glass);
          m.position.set(sg * (W / 2 + 0.01), wy, 0);
          g.add(m);
        });
        if (i > 0) put(new THREE.BoxGeometry(W + 0.12, 0.14, D + 0.12), trim, i * fh);
      }
      put(new THREE.BoxGeometry(W + 0.16, 0.18, D + 0.16), trim, h + 0.09);
      const pt = 0.15,
        ph = 0.8,
        py = h + 0.18 + ph / 2;
      [[0, D / 2 - pt / 2, W, pt], [0, -D / 2 + pt / 2, W, pt], [W / 2 - pt / 2, 0, pt, D], [-W / 2 + pt / 2, 0, pt, D]].forEach(([x, z, w, d]) => {
        const m = put(new THREE.BoxGeometry(w, ph, d), wall, py);
        m.position.x = x;
        m.position.z = z;
      });
      if (W > 4 && D > 4) {
        const m = put(new THREE.BoxGeometry(Math.min(3, W * 0.3), 2.6, Math.min(3, D * 0.3)), wall, h + 0.18 + 1.3);
        m.position.x = W * 0.22;
        m.position.z = -D * 0.18;
      }
    }
    eat(ox, by + h, oz);
  });
  aoMesh(apP, apU, panAO || (panAO = new THREE.MeshBasicMaterial({
    map: p3sPanAOTex(THREE),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  })));
  if (minX > maxX) {
    minX = -10;
    maxX = 10;
    minZ = -10;
    maxZ = 10;
  }
  return {
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    R: Math.max(8, Math.hypot(maxX - minX, maxZ - minZ) / 2),
    maxY,
    pans
  };
}
function P3SView3D({
  st,
  sun,
  api
}) {
  p3sLogoImg();
  const mountRef = React.useRef(null);
  const T = React.useRef({});
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    p3LoadThree().then(() => setReady(true)).catch(e => setErr(e.message));
  }, []);
  React.useEffect(() => {
    if (!ready || !mountRef.current) return;
    const THREE = window.THREE,
      el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce8f2);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 8000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.screenSpacePanning = true;
    const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.75);
    scene.add(hemi);
    const sunL = new THREE.DirectionalLight(0xffffff, 1.3);
    sunL.castShadow = true;
    sunL.shadow.bias = -0.0004;
    const glMax = renderer.capabilities.maxTextureSize || 4096,
      SHM = glMax >= 4096 ? 4096 : 2048;
    sunL.shadow.mapSize.set(SHM, SHM);
    scene.add(sunL);
    scene.add(sunL.target);
    const dyn = new THREE.Group();
    scene.add(dyn);
    const envTex = (() => {
      try {
        const es = new THREE.Scene(),
          g = new THREE.SphereGeometry(50, 32, 16),
          col = [],
          pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i) / 50,
            c = y > 0 ? new THREE.Color(0xeaf3fb).lerp(new THREE.Color(0x5d93cf), Math.pow(y, 0.6)) : new THREE.Color(0x8a8172).lerp(new THREE.Color(0x4a443c), Math.min(1, -y * 2));
          col.push(c.r, c.g, c.b);
        }
        g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
        es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({
          vertexColors: true,
          side: THREE.BackSide
        })));
        const sunS = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({
          color: 0xfff6dc
        }));
        sunS.position.set(20, 35, 20);
        es.add(sunS);
        const pm = new THREE.PMREMGenerator(renderer),
          rt = pm.fromScene(es, 0.02);
        pm.dispose();
        g.dispose();
        return rt.texture;
      } catch (e) {
        return null;
      }
    })();
    if (envTex) scene.environment = envTex;
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshBasicMaterial({
      color: 0xfff1b8,
      fog: false
    }));
    const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshBasicMaterial({
      color: 0xffd36b,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    }));
    const sunPath = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.7
    }));
    const sp0 = [];
    for (let i = 0; i < 420; i++) {
      const u = Math.random() * Math.PI * 2,
        v = Math.acos(Math.random() * 0.96);
      sp0.push(Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u));
    }
    const sg0 = new THREE.BufferGeometry();
    sg0.setAttribute("position", new THREE.Float32BufferAttribute(sp0, 3));
    const stars = new THREE.Points(sg0, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    [sunBall, sunGlow, sunPath, stars].forEach(o => scene.add(o));
    const texCache = {};
    Object.assign(T.current, {
      THREE,
      renderer,
      scene,
      camera,
      controls,
      sunL,
      hemi,
      dyn,
      texCache,
      sunBall,
      sunGlow,
      sunPath,
      stars,
      fitted: false
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
    let run = true,
      recNow = null,
      fly = null,
      shKey = "";
    const fitSh = () => {
      const t = T.current,
        b = t.bounds,
        d = t.sunDir;
      if (!b || !d) return;
      const tg = controls.target,
        cap = b.R * 1.15,
        N = sunL.shadow.mapSize.x;
      const cp = camera.position,
        Lm = Math.max(60, cp.distanceTo(tg) * 8),
        py = Math.max(0, tg.y);
      let x0 = cp.x,
        x1 = cp.x,
        z0 = cp.z,
        z1 = cp.z;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        const r = new THREE.Vector3(sx, sy, 0.5).unproject(camera).sub(cp).normalize();
        let L = r.y < -1e-4 ? (py - cp.y) / r.y : Lm;
        if (!(L > 0) || L > Lm) L = Lm;
        const x = cp.x + r.x * L,
          z = cp.z + r.z * L;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      });
      let S = Math.max(12, Math.hypot(x1 - x0, z1 - z0) / 2);
      S = Math.pow(1.25, Math.ceil(Math.log(S) / Math.log(1.25)));
      const full = S >= cap;
      if (full) S = cap;
      const tx = 2 * S / N,
        H = Math.max(3, b.maxY || 3);
      const cx = full ? b.cx : Math.round((x0 + x1) / 2 / tx) * tx,
        cz = full ? b.cz : Math.round((z0 + z1) / 2 / tx) * tx,
        cy = full ? 0 : py;
      const key = [S, cx, cz, cy.toFixed(1), N, d.x, d.y, d.z].join("|");
      if (key === shKey) return;
      shKey = key;
      const D = S * 2 + H + 20,
        sc = sunL.shadow.camera;
      sunL.position.set(cx + d.x * D, cy + d.y * D, cz + d.z * D);
      sunL.target.position.set(cx, cy, cz);
      sunL.target.updateMatrixWorld();
      sc.left = -S;
      sc.right = S;
      sc.top = S;
      sc.bottom = -S;
      sc.near = 0.5;
      sc.far = D + S * 2 + H;
      sc.updateProjectionMatrix();
      const ta = d.y / Math.max(0.05, Math.sqrt(1 - d.y * d.y));
      sunL.shadow.bias = -Math.min(0.1, Math.max(0.015, tx * (1.5 + 1.5 / Math.max(0.15, ta)))) / (sc.far - sc.near);
    };
    T.current.fitSh = fitSh;
    const loop = () => {
      if (!run) return;
      if (fly) {
        const k = Math.min(1, (performance.now() - fly.t0) / 700),
          e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        camera.position.lerpVectors(fly.p0, fly.p1, e);
        controls.target.lerpVectors(fly.q0, fly.q1, e);
        camera.fov = fly.f0 + (fly.f1 - fly.f0) * e;
        camera.updateProjectionMatrix();
        if (k >= 1) fly = null;
      }
      controls.update();
      fitSh();
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    };
    const view = kind => {
      const b = T.current.bounds;
      if (!b) return false;
      const V3 = (x, y, z) => new THREE.Vector3(x, y, z),
        H = Math.max(3, b.maxY || 3);
      let tg,
        pos,
        fov = 38;
      const orbit = (azDeg, elDeg, dist, t) => {
        const a = azDeg * P3_DEG,
          e = elDeg * P3_DEG;
        return V3(t.x + Math.sin(a) * Math.cos(e) * dist, t.y + Math.sin(e) * dist, t.z - Math.cos(a) * Math.cos(e) * dist);
      };
      if (kind === "close") {
        const P = b.pans || [];
        if (!P.length) return false;
        let mx = 0,
          mz = 0;
        P.forEach(q => {
          mx += q.x / P.length;
          mz += q.z / P.length;
        });
        let best = P[0],
          bs = -1e9;
        P.forEach(q => {
          const sc = q.z - mz + 0.6 * (q.x - mx);
          if (sc > bs) {
            bs = sc;
            best = q;
          }
        });
        let dx = best.x - mx,
          dz = best.z - mz,
          dl = Math.hypot(dx, dz);
        if (dl < 0.5) {
          dx = 0.5;
          dz = 1;
          dl = Math.hypot(dx, dz);
        }
        dx /= dl;
        dz /= dl;
        tg = V3(best.x - dx * 1.2, best.y, best.z - dz * 1.2);
        pos = V3(best.x + dx * 3.2 - dz * 1.6, best.y + 1.9, best.z + dz * 3.2 + dx * 1.6);
        fov = 50;
      } else if (kind === "top") {
        tg = V3(b.cx, 0, b.cz);
        pos = orbit(180, 84, b.R * 3.2, tg);
        fov = 38;
      } else if (kind === "front") {
        tg = V3(b.cx, H * 0.45, b.cz);
        pos = orbit(200, 9, b.R * 3, tg);
        fov = 40;
      } else {
        tg = V3(b.cx, H * 0.35, b.cz);
        pos = orbit(155, 36, b.R * 3.3, tg);
        fov = 36;
      }
      fly = {
        t0: performance.now(),
        p0: camera.position.clone(),
        p1: pos,
        q0: controls.target.clone(),
        q1: tg,
        f0: camera.fov,
        f1: fov
      };
      return true;
    };
    if (api) api.current = {
      gl: renderer,
      scene,
      cam: camera,
      ctl: controls,
      view,
      ready: () => !!T.current.bounds,
      hasPanels: () => !!(T.current.bounds && T.current.bounds.pans && T.current.bounds.pans.length),
      shot: opt => {
        const cv = renderer.domElement,
          w = cv.clientWidth || 1,
          h = cv.clientHeight || 1,
          pr = renderer.getPixelRatio();
        const gl = renderer.getContext(),
          maxS = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096, 8192);
        const SW = Math.min(3840, maxS),
          SH = Math.round(SW * 9 / 16),
          asp0 = camera.aspect;
        const hid = [sunBall, sunGlow, sunPath, stars].filter(o => o.visible);
        dyn.traverse(o => {
          if (o.userData && o.userData.helper && o.visible) hid.push(o);
        });
        hid.forEach(o => {
          o.visible = false;
        });
        const sm = sunL.shadow.mapSize.x,
          remap = () => {
            if (sunL.shadow.map) {
              sunL.shadow.map.dispose();
              sunL.shadow.map = null;
            }
          };
        let url;
        try {
          const big = Math.min(8192, glMax);
          sunL.shadow.mapSize.set(big, big);
          remap();
          fitSh();
          renderer.setPixelRatio(1);
          renderer.setSize(SW, SH, false);
          camera.aspect = SW / SH;
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
          if (opt && opt.info) {
            const c2 = document.createElement("canvas");
            c2.width = SW;
            c2.height = SH;
            const g2 = c2.getContext("2d");
            g2.drawImage(cv, 0, 0, SW, SH);
            p3sDrawInfo(g2, SW, SH, opt.info);
            url = c2.toDataURL("image/png");
          } else url = cv.toDataURL("image/png");
        } finally {
          hid.forEach(o => {
            o.visible = true;
          });
          sunL.shadow.mapSize.set(sm, sm);
          remap();
          fitSh();
          camera.aspect = asp0;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(pr);
          renderer.setSize(w, h, false);
          renderer.render(scene, camera);
        }
        return url;
      },
      record: () => {
        const cv = renderer.domElement;
        if (!cv.captureStream || !window.MediaRecorder) throw new Error("เบราว์เซอร์นี้อัดวิดีโอไม่ได้ — ใช้ Chrome หรือ Edge");
        const mt = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(t => MediaRecorder.isTypeSupported(t)) || "";
        const rec = new MediaRecorder(cv.captureStream(30), Object.assign({
          videoBitsPerSecond: 8e6
        }, mt ? {
          mimeType: mt
        } : {}));
        const chunks = [];
        rec.ondataavailable = e => {
          if (e.data && e.data.size) chunks.push(e.data);
        };
        rec.start(250);
        recNow = rec;
        return {
          stop: () => new Promise(res => {
            rec.onstop = () => {
              recNow = null;
              res({
                blob: new Blob(chunks, {
                  type: (mt || "video/webm").split(";")[0]
                }),
                ext: /mp4/.test(mt) ? "mp4" : "webm"
              });
            };
            if (rec.state !== "inactive") rec.stop();
          })
        };
      }
    };
    requestAnimationFrame(loop);
    return () => {
      run = false;
      if (api) api.current = null;
      if (recNow && recNow.state !== "inactive") {
        try {
          recNow.stop();
        } catch (e) {}
      }
      ro.disconnect();
      controls.dispose();
      [sunBall, sunGlow, sunPath, stars].forEach(o => {
        o.geometry.dispose();
        o.material.dispose();
      });
      dyn.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      if (envTex) envTex.dispose();
      Object.keys(texCache).forEach(k => texCache[k].dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [ready]);
  React.useEffect(() => {
    const t = T.current;
    if (!ready || !t.dyn) return;
    const id = setTimeout(() => {
      const THREE = t.THREE;
      while (t.dyn.children.length) {
        const c = t.dyn.children[0];
        t.dyn.remove(c);
        c.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
      }
      const tex = (url, onReady) => {
        if (t.texCache[url]) {
          const tx = t.texCache[url];
          if (onReady && tx.image) Promise.resolve().then(() => onReady(tx));
          return tx;
        }
        const tx = new THREE.TextureLoader().load(url, () => onReady && onReady(tx));
        tx.anisotropy = 4;
        t.texCache[url] = tx;
        return tx;
      };
      const b = p3sBuild3D(THREE, t.dyn, st, tex);
      t.bounds = b;
      if (!t.fitted) {
        t.fitted = true;
        t.controls.target.set(b.cx, 1.5, b.cz);
        t.camera.position.set(b.cx + b.R * 1.15, Math.max(10, b.R * 1.05), b.cz + b.R * 1.45);
        t.controls.update();
      }
      t.applySun && t.applySun();
    }, 80);
    return () => clearTimeout(id);
  }, [ready, st]);
  React.useEffect(() => {
    const t = T.current;
    if (!ready || !t.sunL) return;
    t.applySun = () => {
      const sp = p3SunPos(sun),
        a = sp.alt * P3_DEG,
        z = sp.az * P3_DEG;
      const b = t.bounds || {
        cx: 0,
        cz: 0,
        R: 20
      };
      const D = b.R * 3;
      t.sunL.position.set(b.cx + Math.sin(z) * Math.cos(a) * D, Math.max(0.05, Math.sin(a)) * D, b.cz - Math.cos(z) * Math.cos(a) * D);
      const THREE = t.THREE,
        SD = Math.max(400, b.R * 12);
      const at = (alt, az) => {
        const aa = alt * P3_DEG,
          zz = az * P3_DEG;
        return new THREE.Vector3(b.cx + Math.sin(zz) * Math.cos(aa) * SD, Math.sin(aa) * SD, b.cz - Math.cos(zz) * Math.cos(aa) * SD);
      };
      const k = p3sClamp((sp.alt + 6) / 12, 0, 1),
        night = new THREE.Color(0x0b1324),
        dusk = new THREE.Color(0xe7a47c),
        dayC = new THREE.Color(0xd6e6f3);
      t.scene.background.copy(k < 0.5 ? night.lerp(dusk, k / 0.5) : dusk.lerp(dayC, (k - 0.5) / 0.5));
      t.sunBall.position.copy(at(sp.alt, sp.az));
      t.sunBall.scale.setScalar(SD * 0.022);
      t.sunGlow.position.copy(t.sunBall.position);
      t.sunGlow.scale.setScalar(SD * 0.05);
      t.sunBall.material.color.set(0xff9a3c).lerp(new THREE.Color(0xfff1b8), p3sClamp(sp.alt / 15, 0, 1));
      t.sunBall.visible = t.sunGlow.visible = sp.alt > -2;
      const path = [];
      for (let h = 4; h <= 20.01; h += 0.25) {
        const q = p3SunPos(Object.assign({}, sun, {
          hour: h
        }));
        if (q.alt > -1) path.push(at(q.alt, q.az));
      }
      t.sunPath.geometry.dispose();
      t.sunPath.geometry = new THREE.BufferGeometry().setFromPoints(path);
      t.stars.position.set(b.cx, 0, b.cz);
      t.stars.scale.setScalar(SD * 1.5);
      t.stars.material.opacity = p3sClamp(1 - k * 2, 0, 1);
      t.stars.visible = k < 0.5;
      t.dyn.traverse(o => {
        if (o.userData && o.userData.tint && o.material) o.material.color.setScalar(o.userData.tint * (0.16 + 0.84 * k));
      });
      t.sunL.target.position.set(b.cx, 0, b.cz);
      t.sunDir = new THREE.Vector3(Math.sin(z) * Math.cos(a), Math.max(0.05, Math.sin(a)), -Math.cos(z) * Math.cos(a)).normalize();
      if (t.fitSh) t.fitSh();
      const day = sp.alt > 0;
      t.sunL.intensity = day ? 0.8 + 1.3 * Math.min(1, Math.sin(a) * 1.6) : 0;
      t.hemi.intensity = 0.08 + 0.38 * k;
    };
    t.applySun();
  }, [ready, sun && sun.month, sun && sun.day, sun && sun.hour, sun && sun.lat, sun && sun.lng]);
  return React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, React.createElement("div", {
    ref: mountRef,
    style: {
      position: "absolute",
      inset: 0
    }
  }), !ready && !err && React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07 3 \u0E21\u0E34\u0E15\u0E34\u2026"), err && React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--tint-red-tx)",
      fontSize: 13,
      padding: 30,
      textAlign: "center"
    }
  }, err, React.createElement("br", null), "\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E40\u0E23\u0E19\u0E40\u0E14\u0E2D\u0E23\u0E4C 3 \u0E21\u0E34\u0E15\u0E34"));
}
const p3sUseMedia = q => {
  const get = () => {
    try {
      return window.matchMedia(q).matches;
    } catch (e) {
      return false;
    }
  };
  const [m, setM] = React.useState(get);
  React.useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia(q);
    } catch (e) {
      return;
    }
    const on = () => setM(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", on);else mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", on);else mq.removeListener(on);
    };
  }, [q]);
  return m;
};
const P3S_TOOLS = [{
  k: "select",
  ic: "cursor",
  lb: "เลือก ย้าย",
  key: "V"
}, {
  k: "pan",
  ic: "hand",
  lb: "เลื่อนภาพ",
  key: "H"
}, {
  k: "area",
  ic: "fit",
  lb: "พื้นที่ติดตั้ง",
  key: "G"
}, {
  k: "axis",
  ic: "axis",
  lb: "ตั้งแนว",
  key: "A"
}, {
  k: "roof",
  ic: "polygon",
  lb: "วาดหลังคา",
  key: "R"
}, {
  k: "panel",
  ic: "panel",
  lb: "วางแผง",
  key: "P"
}, {
  k: "walk",
  ic: "walk",
  lb: "ทางเดิน",
  key: "W"
}, {
  k: "obs",
  ic: "tree",
  lb: "สิ่งบดบัง",
  key: "O"
}, {
  k: "meas",
  ic: "ruler",
  lb: "วัดระยะ",
  key: "M"
}, {
  k: "bg",
  ic: "image",
  lb: "ภาพพื้น",
  key: "B"
}];
const P3S_OBS_TIP = {
  turbine: "ลูกหมุนระบายอากาศบนหลังคา · แตะบนหลังคา = วาง · แผงเว้นรอบ 15 ซม.",
  vent: "ปล่องดูดควัน ท่อกลม + ฝาครอบ · แตะบนหลังคา = วาง · แผงเว้นรอบ 15 ซม.",
  sky: "แผ่นหลังคาโปร่งแสงแนบหลังคา · คลิกทีละจุดต่อเป็นเส้น · ตรงช่องแสงติดแผงไม่ได้",
  rail: "ราวกันตกเสาทุก ≤ 2 ม. · คลิกทีละจุดต่อเป็นเส้น (ดูดเข้าขอบหลังคา)",
  walkway: "ทางเดินตะแกรง FRP สีเหลือง · คลิกทีละจุดต่อเป็นเส้น · แผงเว้น 5 ซม.",
  ladder: "บันไดลิงมีกรง ขึ้นจากพื้นถึงหลังคา · แตะที่ขอบหลังคา ติดผนังด้านนอกเอง",
  bldg: "อาคารข้างเคียงที่ทอดเงาลงแผง · แตะ = ขนาดมาตรฐาน · ลาก = ขนาดจริง",
  tree: "ต้นไม้ที่ทอดเงาลงแผง · แตะ = ขนาดมาตรฐาน · ลาก = ทรงพุ่มจริง"
};
const _p3sPrevUrl = {},
  _p3sPrevP = {};
let _p3sPrevR = null;
function p3sObsPreview(T) {
  if (_p3sPrevP[T]) return _p3sPrevP[T];
  _p3sPrevP[T] = p3LoadThree().then(THREE => {
    const W = 244,
      H = 168;
    if (!_p3sPrevR) {
      _p3sPrevR = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
      });
      _p3sPrevR.setPixelRatio(2);
      _p3sPrevR.shadowMap.enabled = true;
      _p3sPrevR.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    _p3sPrevR.setSize(W, H);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3edf5);
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.8));
    const L = new THREE.DirectionalLight(0xffffff, 1.15);
    L.position.set(9, 16, 7);
    L.castShadow = true;
    L.shadow.mapSize.set(1024, 1024);
    L.shadow.bias = -0.0005;
    const sc = L.shadow.camera;
    sc.left = -14;
    sc.right = 14;
    sc.top = 14;
    sc.bottom = -14;
    sc.near = 0.5;
    sc.far = 60;
    scene.add(L);
    const D = P3S_OBS.find(x => x[0] === T) || P3S_OBS[0],
      grp = new THREE.Group();
    scene.add(grp);
    const roof = {
      id: "pv",
      kind: "poly",
      name: "",
      x: 0,
      z: 0,
      h: 2.4,
      noPanel: true,
      pts: [{
        x: -3,
        z: -2.2
      }, {
        x: 3,
        z: -2.2
      }, {
        x: 3,
        z: 2.2
      }, {
        x: -3,
        z: 2.2
      }]
    };
    const o = {
      id: "pvo",
      kind: T === "tree" ? "tree" : "box",
      p3sType: T,
      x: 0,
      z: 0,
      w: D[2],
      d: D[3],
      h: D[4],
      rot: 0
    };
    let tg = [0, 2.4 + D[4] / 2, 0],
      dist = 3.4;
    if (T === "vent") dist = 4.4;
    if (T === "rail") {
      o.pts = [{
        x: -2.7,
        z: 1.9
      }, {
        x: 2.7,
        z: 1.9
      }, {
        x: 2.7,
        z: -1.9
      }];
      tg = [0, 2.9, 0];
      dist = 8.6;
    }
    if (T === "walkway" || T === "sky") {
      o.pts = [{
        x: -2.6,
        z: 0
      }, {
        x: 2.6,
        z: 0
      }];
      tg = [0, 2.4, 0];
      dist = 6.4;
    }
    if (T === "pipe") {
      o.pts = [{
        x: -0.7,
        z: 0
      }, {
        x: 0.7,
        z: 0
      }];
      o.taps = [{
        x: 0.1,
        z: 0
      }];
      tg = [0.1, 2.5, 0];
      dist = 1.1;
    }
    if (T === "tray") {
      o.pts = [{
        x: -0.9,
        z: 0.3
      }, {
        x: 0.5,
        z: 0.3
      }, {
        x: 0.5,
        z: -0.9
      }];
      tg = [0, 2.45, 0];
      dist = 2;
    }
    if (T === "ladder") {
      o.x = 3.42;
      o.z = 0;
      o.rot = 90;
      tg = [2.6, 2.2, 0];
      dist = 8.4;
    }
    if (T === "bldg") {
      tg = [0, 3, 0];
      dist = 19;
    }
    if (T === "tree") {
      tg = [0, 2.6, 0];
      dist = 11;
    }
    p3sBuild3D(THREE, grp, {
      roofs: T === "bldg" || T === "tree" ? [] : [roof],
      obstacles: [o],
      buildH: 0,
      groundW: 40
    }, () => null);
    const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 400),
      dv = new THREE.Vector3(1, 0.72, 1.25).normalize().multiplyScalar(dist);
    cam.position.set(tg[0] + dv.x, tg[1] + dv.y, tg[2] + dv.z);
    cam.lookAt(tg[0], tg[1], tg[2]);
    _p3sPrevR.render(scene, cam);
    const url = _p3sPrevR.domElement.toDataURL("image/png");
    grp.traverse(x => {
      if (x.geometry) x.geometry.dispose();
      if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => m.dispose());
    });
    _p3sPrevUrl[T] = url;
    return url;
  });
  _p3sPrevP[T].catch(() => {
    delete _p3sPrevP[T];
  });
  return _p3sPrevP[T];
}
function p3sKindPreview(k) {
  const key = "kind:" + k;
  if (_p3sPrevP[key]) return _p3sPrevP[key];
  _p3sPrevP[key] = p3LoadThree().then(THREE => {
    const W = 240,
      H = 150;
    if (!_p3sPrevR) {
      _p3sPrevR = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
      });
      _p3sPrevR.setPixelRatio(2);
      _p3sPrevR.shadowMap.enabled = true;
      _p3sPrevR.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    _p3sPrevR.setSize(W, H);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3edf5);
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.8));
    const L = new THREE.DirectionalLight(0xffffff, 1.1);
    L.position.set(10, 18, 14);
    L.castShadow = true;
    L.shadow.mapSize.set(1024, 1024);
    L.shadow.bias = -0.0005;
    const sc = L.shadow.camera;
    sc.left = -16;
    sc.right = 16;
    sc.top = 16;
    sc.bottom = -16;
    sc.near = 0.5;
    sc.far = 70;
    scene.add(L);
    const rect = (w, d, x, z) => [{
      x: x - w / 2,
      z: z - d / 2
    }, {
      x: x + w / 2,
      z: z - d / 2
    }, {
      x: x + w / 2,
      z: z + d / 2
    }, {
      x: x - w / 2,
      z: z + d / 2
    }];
    let roofs;
    if (P3S_MULTI[k]) roofs = p3sMultiRoof(rect(12, k === "lshape" || k === "tshape" ? 11 : k === "manila" || k === "monitor" ? 8 : 10, 0, 0), k, k === "saw" ? 4 : 3, 1, 3);else if (k === "facet") {
      roofs = [p3sRoofFromRect(rect(12, 5, 0, -2), "gable", 1, 3), p3sRoofFromRect(rect(5, 9, 3.5, 2.5), "gable", 2, 3)];
    } else roofs = [p3sRoofFromRect(rect(12, 8, 0, 0), k, 1, 3)];
    roofs = roofs.filter(Boolean);
    if (k === "carport" || k === "ground") roofs.forEach(r => {
      r.noPanel = false;
    });
    const grp = new THREE.Group();
    scene.add(grp);
    p3sBuild3D(THREE, grp, {
      roofs,
      obstacles: [],
      buildH: 0,
      groundW: 50
    }, () => null);
    const tg = [0, 2.2, 0],
      dv = new THREE.Vector3(1.05, 0.85, 1.25).normalize().multiplyScalar(17.5);
    const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
    cam.position.set(tg[0] + dv.x, tg[1] + dv.y, tg[2] + dv.z);
    cam.lookAt(tg[0], tg[1], tg[2]);
    _p3sPrevR.render(scene, cam);
    const url = _p3sPrevR.domElement.toDataURL("image/png");
    grp.traverse(x => {
      if (x.geometry) x.geometry.dispose();
      if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    });
    _p3sPrevUrl[key] = url;
    return url;
  });
  _p3sPrevP[key].catch(() => {
    delete _p3sPrevP[key];
  });
  return _p3sPrevP[key];
}
function P3SKindPic({
  k
}) {
  const key = "kind:" + k,
    [url, setUrl] = React.useState(_p3sPrevUrl[key] || null);
  React.useEffect(() => {
    let live = true;
    if (!_p3sPrevUrl[key]) p3sKindPreview(k).then(u => {
      if (live) setUrl(u);
    }).catch(() => {});
    return () => {
      live = false;
    };
  }, [k]);
  return React.createElement("span", {
    className: "pic"
  }, url ? React.createElement("img", {
    src: url,
    alt: ""
  }) : React.createElement(P3SKindArt, {
    k: k
  }));
}
function P3SObsPrev({
  type,
  at
}) {
  const [url, setUrl] = React.useState(_p3sPrevUrl[type] || null);
  React.useEffect(() => {
    let live = true;
    setUrl(_p3sPrevUrl[type] || null);
    if (!_p3sPrevUrl[type]) p3sObsPreview(type).then(u => {
      if (live) setUrl(u);
    }).catch(() => {});
    return () => {
      live = false;
    };
  }, [type]);
  const D = P3S_OBS.find(x => x[0] === type) || P3S_OBS[0];
  const size = type === "rail" ? "สูง " + D[4] + " ม." : P3S_OBS_LINE[type] ? "กว้าง " + (D[3] < 1 ? Math.round(D[3] * 100) + " ซม." : D[3] + " ม.") : type === "ladder" ? "กรงกว้าง " + D[2] + " ม." : D[2] + " × " + D[3] + " ม. · สูง " + D[4] + " ม.";
  const vw = window.innerWidth || 1200,
    vh = window.innerHeight || 800;
  let left = at.left - 276,
    top = at.top + at.height / 2 - 128;
  if (left < 8) {
    left = p3sClamp(at.left, 8, vw - 272);
    top = at.bottom + 8;
  }
  top = p3sClamp(top, 8, vh - 268);
  return React.createElement("div", {
    className: "p3s-oprev",
    style: {
      left,
      top
    }
  }, React.createElement("span", {
    className: "t"
  }, D[1], React.createElement("small", null, size)), url ? React.createElement("img", {
    src: url,
    alt: ""
  }) : React.createElement("div", {
    className: "ph"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E21\u0E40\u0E14\u0E25\u2026"), React.createElement("span", {
    className: "d"
  }, P3S_OBS_TIP[type] || ""));
}
function Plan3DStudio({
  job,
  onClose,
  currentUser
}) {
  const isMobile = p3sUseMedia("(max-width: 860px)");
  const coarse = p3sUseMedia("(pointer: coarse)");
  const {
    saved,
    loading,
    save
  } = usePlan3d(job ? job.id : null);
  const [st, setStRaw] = React.useState(null);
  const stRef = React.useRef(null);
  stRef.current = st;
  const [dirty, setDirty] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const hist = React.useRef({
    u: [],
    r: [],
    key: null,
    at: 0
  });
  const [, setHistTick] = React.useState(0);
  const [tool, setToolRaw] = React.useState("select");
  const [view3d, setView3d] = React.useState(false);
  const [sysOpen, setSysOpen] = React.useState(false);
  const sysT = React.useRef(null);
  const [sel, setSel] = React.useState(null);
  const [selVert, setSelVert] = React.useState(null);
  const [selBlk, setSelBlk] = React.useState(null);
  const [blkMul, setBlkMul] = React.useState([]);
  React.useEffect(() => {
    if (selBlk == null) setBlkMul([]);
  }, [selBlk]);
  const selIdxOf = roof => {
    if (!roof || selBlk == null) return [];
    const bs = p3sBlkStore(roof);
    if (!bs[selBlk]) return [];
    if (blkMul.length > 1 && blkMul.indexOf(bs[selBlk].id) >= 0) {
      const o = [];
      bs.forEach((b, i) => {
        if (blkMul.indexOf(b.id) >= 0) o.push(i);
      });
      return o;
    }
    return [selBlk];
  };
  const [hover, setHover] = React.useState(null);
  const [draw, setDraw] = React.useState(null);
  const [cur, setCur] = React.useState(null);
  const [roofOpt, setRoofOptRaw] = React.useState(() => {
    let k = "gable";
    try {
      k = localStorage.getItem("p3s_kind") || "gable";
    } catch (e) {}
    return {
      shape: k === "flat" || k === "shed" ? "rect" : k === "facet" ? "poly" : "rect",
      kind: k
    };
  });
  const rectDraw = roofOpt.kind !== "facet";
  const setRoofOpt = o => {
    setRoofOptRaw(o);
    try {
      localStorage.setItem("p3s_kind", o.kind);
    } catch (e) {}
  };
  const [alignView, setAlignView] = React.useState(true);
  const [axisPts, setAxisPts] = React.useState(null);
  const [axisMsg, setAxisMsg] = React.useState(null);
  const [edgeOn, setEdgeOn] = React.useState(true);
  const edgeRef = React.useRef(null);
  const edgeBusy = React.useRef(false);
  const [, setEdgeTick] = React.useState(0);
  const [imgFx, setImgFx] = React.useState({
    b: 1,
    c: 1
  });
  const [walkW, setWalkW] = React.useState(0.6);
  const [walkPts, setWalkPts] = React.useState(null);
  const [selWalk, setSelWalk] = React.useState(null);
  const [eavePick, setEavePick] = React.useState(false);
  const [tapPick, setTapPick] = React.useState(null);
  const [mxy, setMxy] = React.useState(null);
  const v3api = React.useRef(null);
  const vidRef = React.useRef(null);
  const [vidOn, setVidOn] = React.useState(false);
  const [mediaMsg, setMediaMsg] = React.useState(null);
  const [shotInfo, setShotInfo] = React.useState(() => {
    try {
      return localStorage.getItem("p3s_shotInfo") !== "0";
    } catch (e) {
      return true;
    }
  });
  const [camK, setCamK] = React.useState(null);
  const [wide3d, setWide3d] = React.useState(false);
  const vidWideRef = React.useRef(false);
  const camTimer = React.useRef(null);
  React.useEffect(() => () => clearInterval(camTimer.current), []);
  const [measPts, setMeasPts] = React.useState(null);
  const [calib, setCalib] = React.useState(null);
  const [trace, setTrace] = React.useState(null);
  const [traceTol, setTraceTol] = React.useState(30);
  const [marq, setMarq] = React.useState(null);
  const [roofArm, setRoofArm] = React.useState(false);
  const roofLock = tool === "roof" && !roofArm && !draw && !!(st && (st.roofs || []).length);
  const [obsType, setObsType] = React.useState("turbine");
  const [obsHov, setObsHov] = React.useState(null);
  const [obsPts, setObsPts] = React.useState(null);
  const [obsMsg, setObsMsg] = React.useState(null);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [sheetMin, setSheetMin] = React.useState(false);
  const wiz = true;
  const wizKey = "p3s_wiz2_" + (job ? job.id : "");
  const [wizSeen, setWizSeenRaw] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(wizKey) || "{}") || {};
    } catch (e) {
      return {};
    }
  });
  const markSeen = i => setWizSeenRaw(o => {
    if (o[i]) return o;
    const n = Object.assign({}, o, {
      [i]: 1
    });
    try {
      localStorage.setItem(wizKey, JSON.stringify(n));
    } catch (e) {}
    return n;
  });
  const [wizStep, setWizStep] = React.useState(null);
  const [addBack, setAddBack] = React.useState(null);
  const [kindPick, setKindPick] = React.useState(false);
  const wizHomeRef = React.useRef(null);
  const panGateRef = React.useRef(false);
  const shapeRef = React.useRef({
    roofs: null,
    gap: 0
  });
  const wizAllowRef = React.useRef(null);
  const toolOk = k => {
    const a = wizAllowRef.current;
    return !a || a.includes(k);
  };
  const pickRef = React.useRef(null);
  const canPick = t => {
    const k = pickRef.current;
    return !k || !!k[t];
  };
  const canMove = t => {
    const k = pickRef.current;
    return !k || k[t] === 2;
  };
  const [zoneSel, setZoneSel] = React.useState("A");
  const zoneSides = r => {
    try {
      return (p3Panels(r).faces || []).map(f => f.side).filter(Boolean);
    } catch (e) {
      return [];
    }
  };
  const zoneOf = r => {
    const fs = zoneSides(r);
    if (fs.length < 2) return "all";
    return zoneSel === "all" ? "all" : fs.indexOf(zoneSel) >= 0 ? zoneSel : fs[0];
  };
  const [multi, setMulti] = React.useState([]);
  const keepMulti = React.useRef(false);
  const [photoAR, setPhotoAR] = React.useState(1);
  const [sunHour, setSunHour] = React.useState(null);
  const [view, setViewRaw] = React.useState({
    cx: 0,
    cz: 0,
    s: 14
  });
  const viewRef = React.useRef(view);
  viewRef.current = view;
  const [size, setSize] = React.useState({
    w: 900,
    h: 600
  });
  const sizeRef = React.useRef(size);
  sizeRef.current = size;
  const movT = React.useRef(0);
  const setView = v => {
    viewRef.current = v;
    setViewRaw(v);
    const el = stageRef.current;
    if (!el) return;
    el.classList.add("p3s-moving");
    clearTimeout(movT.current);
    movT.current = setTimeout(() => el.classList.remove("p3s-moving"), 160);
  };
  React.useEffect(() => {
    if (loading || stRef.current) return;
    const m = p3sSyncObs(p3sLoad(saved, job));
    stRef.current = m;
    setStRaw(m);
  }, [loading, saved]);
  const pushHist = (snap, key) => {
    const H = hist.current,
      now = Date.now();
    if (key && H.key === key && now - H.at < 1200) {
      H.at = now;
      return;
    }
    H.u.push(snap);
    if (H.u.length > 120) H.u.shift();
    H.r = [];
    H.key = key || null;
    H.at = now;
    setHistTick(n => n + 1);
  };
  const commit = (fn, key) => {
    const cur0 = stRef.current;
    if (!cur0) return;
    const next = p3sSyncObs(typeof fn === "function" ? fn(cur0) : Object.assign({}, cur0, fn));
    if (!next || next === cur0) return;
    pushHist(cur0, key);
    stRef.current = next;
    setStRaw(next);
    setDirty(true);
  };
  const live = next0 => {
    const next = p3sSyncObs(next0);
    stRef.current = next;
    setStRaw(next);
    setDirty(true);
  };
  const fixSel = s => {
    setSel(x => {
      if (!x) return x;
      const arr = x.t === "roof" ? s.roofs : x.t === "obs" ? s.obstacles : s.measures;
      return (arr || []).some(o => o.id === x.id) ? x : null;
    });
    setSelVert(null);
  };
  const undo = () => {
    const H = hist.current;
    if (!H.u.length) return;
    H.r.push(stRef.current);
    const prev = H.u.pop();
    H.key = null;
    stRef.current = prev;
    setStRaw(prev);
    setDirty(true);
    fixSel(prev);
    setHistTick(n => n + 1);
  };
  const redo = () => {
    const H = hist.current;
    if (!H.r.length) return;
    H.u.push(stRef.current);
    const nx = H.r.pop();
    H.key = null;
    stRef.current = nx;
    setStRaw(nx);
    setDirty(true);
    fixSel(nx);
    setHistTick(n => n + 1);
  };
  const P3S_NOSPREAD = {
    x: 1,
    z: 1,
    pts: 1,
    name: 1,
    id: 1,
    taps: 1
  };
  const spreadIds = (id, patch) => sel && sel.id === id && multi.length && (typeof patch === "function" || !Object.keys(patch).some(k => P3S_NOSPREAD[k])) ? [id].concat(multi.filter(m => m !== id)) : [id];
  const patchRoof = (id, patch, key) => {
    const ids = spreadIds(id, patch);
    commit(s => Object.assign({}, s, {
      roofs: s.roofs.map(r => ids.indexOf(r.id) >= 0 ? Object.assign({}, r, typeof patch === "function" ? patch(r) : patch) : r)
    }), key);
  };
  const patchObs = (id, patch, key) => {
    const ids = spreadIds(id, patch);
    commit(s => {
      const o0 = (s.obstacles || []).find(o => o.id === id),
        T0 = o0 ? p3sObsType(o0) : null;
      return Object.assign({}, s, {
        obstacles: (s.obstacles || []).map(o => o.id === id || ids.indexOf(o.id) >= 0 && p3sObsType(o) === T0 ? Object.assign({}, o, patch) : o)
      });
    }, key);
  };
  const patchMeas = (id, patch, key) => commit(s => Object.assign({}, s, {
    measures: (s.measures || []).map(m => m.id === id ? Object.assign({}, m, patch) : m)
  }), key);
  const patchBlk = (roof, i, patch, key) => patchRoof(roof.id, r => {
    const bs = p3sBlkStore(r);
    if (!bs[i]) return {};
    bs[i] = Object.assign({}, bs[i], patch);
    return {
      blocks: bs
    };
  }, key);
  const patchAllBlk = (roof, patch, key) => patchRoof(roof.id, r => ({
    blocks: p3sBlkStore(r).map(b => Object.assign({}, b, patch))
  }), key);
  const toggleCell = (roof, key, isSlot) => patchRoof(roof.id, r => {
    const bi = p3sBlkOfKey(key),
      bs = p3sBlkStore(r),
      b = bs[bi];
    if (!b) return {};
    const adds = Object.assign({}, b.adds || {}),
      skips = Object.assign({}, b.skips || {});
    if (b.patch && !isSlot && b.only && b.only[key]) {
      const only = Object.assign({}, b.only);
      delete only[key];
      delete skips[key];
      bs[bi] = Object.assign({}, b, {
        only,
        skips
      });
      return {
        blocks: p3sPatchGroups(bs)
      };
    }
    if (isSlot) {
      adds[key] = true;
      delete skips[key];
    } else if (adds[key]) delete adds[key];else if (skips[key]) delete skips[key];else skips[key] = true;
    bs[bi] = Object.assign({}, b, {
      adds,
      skips
    });
    return {
      blocks: bs
    };
  });
  const setCells = (roof, keys, off) => patchRoof(roof.id, r => {
    const bs = p3sBlkStore(r),
      cp = {};
    keys.forEach(k => {
      const i = p3sBlkOfKey(k),
        b = bs[i];
      if (!b) return;
      if (!cp[i]) {
        b.skips = Object.assign({}, b.skips || {});
        cp[i] = 1;
      }
      if (off) b.skips[k] = true;else delete b.skips[k];
    });
    return {
      blocks: bs
    };
  });
  const setTool = k => {
    setToolRaw(k);
    setDraw(null);
    setMeasPts(null);
    setCalib(null);
    setMarq(null);
    setAxisPts(null);
    setWalkPts(null);
    setEavePick(false);
    if (k !== "walk") setSelWalk(null);
    setTrace(t => t && k === "roof" ? t : null);
    if (k !== "panel") setSelBlk(null);
    if (k === "panel" && sel && sel.t !== "roof") setSel(null);
    if (view3d && k !== "select" && k !== "pan") setView3d(false);
  };
  const stageRef = React.useRef(null);
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const on = () => {
      const r = el.getBoundingClientRect();
      setSize({
        w: Math.max(50, r.width),
        h: Math.max(50, r.height)
      });
    };
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, [st == null]);
  const fittedRef = React.useRef(false);
  const fitView = s0 => {
    const S = s0 || stRef.current;
    if (!S) return;
    const b = p3sBounds(S, photoAR),
      {
        w,
        h
      } = sizeRef.current;
    const pad = isMobile ? 30 : 70;
    const s = p3sClamp(Math.min((w - pad) / Math.max(4, b.maxX - b.minX), (h - pad) / Math.max(4, b.maxZ - b.minZ)), 0.4, 300);
    setView({
      cx: (b.minX + b.maxX) / 2,
      cz: (b.minZ + b.maxZ) / 2,
      s
    });
  };
  React.useEffect(() => {
    if (!st || fittedRef.current || size.w < 60) return;
    fittedRef.current = true;
    fitView(st);
  }, [st, size.w]);
  React.useEffect(() => {
    if (!st || !st.photo) return;
    let off = false;
    p3sImg(st.photo).then(im => {
      if (!off) setPhotoAR((im.naturalHeight || 1) / (im.naturalWidth || 1));
    }).catch(() => {});
    return () => {
      off = true;
    };
  }, [st && st.photo]);
  const axisDeg = st && st.p3sAxis != null ? +st.p3sAxis : null;
  const axisRad = (axisDeg || 0) * P3_DEG;
  const rotRef = React.useRef(0);
  rotRef.current = alignView && axisDeg ? axisRad : 0;
  const toW = (p, v) => {
    const V = v || viewRef.current,
      S = sizeRef.current,
      k = p3sRot((p.x - S.w / 2) / V.s, (p.y - S.h / 2) / V.s, rotRef.current);
    return {
      x: k.x + V.cx,
      z: k.z + V.cz
    };
  };
  const toS = (x, z, v) => {
    const V = v || viewRef.current,
      S = sizeRef.current,
      k = p3sRot(x - V.cx, z - V.cz, -rotRef.current);
    return {
      x: k.x * V.s + S.w / 2,
      y: k.z * V.s + S.h / 2
    };
  };
  const centerFor = (w, p, s) => {
    const S = sizeRef.current,
      k = p3sRot((p.x - S.w / 2) / s, (p.y - S.h / 2) / s, rotRef.current);
    return {
      cx: w.x - k.x,
      cz: w.z - k.z
    };
  };
  const zoomAt = (p, f) => {
    const V = viewRef.current,
      s = p3sClamp(V.s * f, 0.4, 400),
      w = toW(p, V);
    setView(Object.assign({
      s
    }, centerFor(w, p, s)));
  };
  const scrVec = (dx, dz) => p3sRot(dx, dz, rotRef.current);
  const frameOf = w => p3sRot(w.x, w.z, -rotRef.current);
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = e => {
      if (view3d) return;
      if (e.target.closest && e.target.closest(".p3s-kpick")) return;
      for (let n = e.target; n && n !== el; n = n.parentElement) {
        if (n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return;
      }
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt({
        x: e.clientX - r.left,
        y: e.clientY - r.top
      }, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)));
    };
    el.addEventListener("wheel", onWheel, {
      passive: false
    });
    return () => el.removeEventListener("wheel", onWheel);
  });
  const roofs = st && st.roofs || [];
  React.useEffect(() => {
    if (keepMulti.current) keepMulti.current = false;else setMulti([]);
  }, [sel ? sel.t + ":" + sel.id : ""]);
  const picked = id => !!sel && (sel.id === id || multi.indexOf(id) >= 0);
  const selRoof = sel && sel.t === "roof" ? roofs.find(r => r.id === sel.id) : null;
  const selObs = sel && sel.t === "obs" ? (st && st.obstacles || []).find(o => o.id === sel.id) : null;
  const selMeas = sel && sel.t === "meas" ? (st && st.measures || []).find(m => m.id === sel.id) : null;
  const snapPts = exceptId => {
    const out = [];
    roofs.forEach(r => {
      if (r.id !== exceptId) p3sFaces2D(r).forEach(f => f.pts.forEach(p => out.push(p)));
    });
    return out;
  };
  const snapSegs = exceptId => {
    const out = [];
    roofs.forEach(r => {
      if (r.id !== exceptId) p3sFaces2D(r).forEach(f => f.pts.forEach((p, i) => out.push([p, f.pts[(i + 1) % f.pts.length]])));
    });
    return out;
  };
  const imgKey = st ? [st.baseMap && st.baseMap.url ? String(st.baseMap.url).length + ":" + st.baseMap.widthM + ":" + String(st.baseMap.url).slice(-24) : "", st.photo ? String(st.photo).length + ":" + st.photoW + ":" + st.photoX + ":" + st.photoZ + ":" + st.photoRot : ""].join("|") : "";
  const imgKeyRef = React.useRef("");
  imgKeyRef.current = imgKey;
  const needEdge = w => {
    const S = stRef.current;
    if (!S || !(S.baseMap && S.baseMap.url || S.photo)) return Promise.resolve(null);
    const F = edgeRef.current,
      key = imgKeyRef.current;
    if (F && F.key === key && Math.abs(w.x - F.cx) < F.Wm * 0.3 && Math.abs(w.z - F.cz) < F.Wm * 0.3) return Promise.resolve(F);
    if (edgeBusy.current) return edgeBusy.current;
    edgeBusy.current = p3sEdgeField(S, {
      x: w.x,
      z: w.z
    }, 120, 0.1).then(F2 => {
      edgeBusy.current = null;
      if (F2 && !F2.err) {
        F2.key = key;
        edgeRef.current = F2;
        setEdgeTick(n => n + 1);
      }
      return F2;
    }).catch(e => {
      edgeBusy.current = null;
      return {
        err: e.message
      };
    });
    return edgeBusy.current;
  };
  const SNAP_PX = coarse ? 16 : 11;
  const snapPoint = (w, o) => {
    const opt = o || {};
    if (opt.free) return {
      x: p3sR(w.x),
      z: p3sR(w.z)
    };
    const s = viewRef.current.s,
      lim = SNAP_PX / s;
    let best = null,
      bd = lim;
    (opt.pts || []).forEach(p => {
      const d = Math.hypot(p.x - w.x, p.z - w.z);
      if (d < bd) {
        bd = d;
        best = p;
      }
    });
    if (best) return {
      x: best.x,
      z: best.z,
      snap: true
    };
    const EF = opt.img && edgeOn ? edgeRef.current : null;
    const Rimg = Math.max(SNAP_PX * 1.5 / s, 0.25);
    if (opt.from) {
      const F = opt.from,
        dx = w.x - F.x,
        dz = w.z - F.z,
        L = Math.hypot(dx, dz);
      if (L > 0.05) {
        const a = Math.atan2(dz, dx);
        const refs = [axisRad].concat(opt.refs || []);
        let ba = null,
          bdiff = 4.5 * P3_DEG;
        refs.forEach(r0 => {
          for (let k = 0; k < 4; k++) {
            const r = r0 + k * Math.PI / 2;
            let df = Math.abs(((a - r) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
            if (df < bdiff) {
              bdiff = df;
              ba = r;
            }
          }
        });
        if (ba != null) {
          const pr = dx * Math.cos(ba) + dz * Math.sin(ba);
          const gp = {
              x: F.x + pr * Math.cos(ba),
              z: F.z + pr * Math.sin(ba)
            },
            guide = {
              from: F,
              ang: ba
            };
          const e = EF ? p3sEdgeSnap(EF, gp, Rimg, {
            x: Math.cos(ba),
            z: Math.sin(ba)
          }) : null;
          if (e) return {
            x: e.x,
            z: e.z,
            guide,
            edge: true
          };
          return {
            x: p3sR(gp.x),
            z: p3sR(gp.z),
            guide
          };
        }
      }
    }
    if (opt.segs) {
      let bs = null,
        bsd = lim;
      opt.segs.forEach(([a, b]) => {
        const dx = b.x - a.x,
          dz = b.z - a.z,
          L2 = dx * dx + dz * dz;
        if (!L2) return;
        const t = p3sClamp(((w.x - a.x) * dx + (w.z - a.z) * dz) / L2, 0, 1),
          q = {
            x: a.x + t * dx,
            z: a.z + t * dz
          };
        const d = Math.hypot(q.x - w.x, q.z - w.z);
        if (d < bsd) {
          bsd = d;
          bs = q;
        }
      });
      if (bs) return {
        x: p3sR(bs.x),
        z: p3sR(bs.z),
        snap: true,
        onEdge: true
      };
    }
    if (EF) {
      const e = p3sEdgeSnap(EF, w, Rimg, null);
      if (e) return {
        x: e.x,
        z: e.z,
        edge: true
      };
    }
    return {
      x: p3sR(w.x),
      z: p3sR(w.z)
    };
  };
  const EAVE = 3;
  const buildRoof = (wpts, kind, n) => {
    if (kind !== "facet") return p3sRoofFromRect(wpts, kind, n, EAVE);
    let nr;
    {
      const c = p3sCentroid(wpts);
      const rel = wpts.map(p => ({
        x: p3sR(p.x - c.x),
        z: p3sR(p.z - c.z)
      }));
      nr = Object.assign(p3NewRoof(n), {
        kind: "poly",
        x: p3sR(c.x),
        z: p3sR(c.z),
        h: 0.05,
        pts: rel,
        ph: rel.map(() => EAVE),
        margin: 0.3
      });
      {
        const segs = snapSegs(),
          tol = 0.15;
        const shared = (a, b) => segs.some(([c, d]) => p3sDistSeg(a, c, d) < tol && p3sDistSeg(b, c, d) < tol);
        let lo = 0,
          bv = -1;
        wpts.forEach((a, i) => {
          const b = wpts[(i + 1) % wpts.length],
            L = Math.hypot(b.x - a.x, b.z - a.z);
          const sc = (shared(a, b) ? 0 : 1000) + L - Math.abs(p3sEdgeBearing(rel, i) - 180) / 90;
          if (sc > bv) {
            bv = sc;
            lo = i;
          }
        });
        nr.p3sLow = lo;
        nr.ph = p3sPitchPh(rel, lo, EAVE, 20);
        nr.p3sFacet = true;
        const nb = (stRef.current.roofs || []).filter(r => r.p3sFacet && r.kind === "poly");
        if (nb.length) {
          const lp = nb[nb.length - 1],
            pc = +lp.p3sPitch > 0 ? +lp.p3sPitch : p3sPolyPitch(lp) || 20;
          nr.ph = p3sPitchPh(rel, lo, EAVE, pc);
          nr.p3sPitch = pc;
        }
      }
    }
    nr.noPanel = true;
    return nr;
  };
  const makeRoof = (wpts, kind) => {
    const S = stRef.current;
    if (!S || wpts.length < 3) return;
    if (p3Area(wpts) < 1) return;
    if (P3S_MULTI[kind]) {
      const list = p3sMultiRoof(wpts, kind, roofOpt.spans || 3, p3NextRoofNo(S.roofs), EAVE);
      if (!list.length) return;
      if (+S.panelW > 0) list.forEach(r => {
        r.panelW = S.panelW;
        r.panelL = S.panelL;
      });
      commit(s => Object.assign({}, s, {
        roofs: (s.roofs || []).concat(list)
      }));
      setSel({
        t: "roof",
        id: list[0].id
      });
      setSelVert(null);
      setSelBlk(null);
      setRoofArm(false);
      return list[0];
    }
    const nr = buildRoof(wpts, kind, p3NextRoofNo(S.roofs));
    if (!nr) return;
    if (+S.panelW > 0) {
      nr.panelW = S.panelW;
      nr.panelL = S.panelL;
    }
    commit(s => {
      let roofs = (s.roofs || []).concat([nr]);
      if (nr.p3sFacet) roofs = p3sWeldFacets(roofs, [nr.id]).roofs;
      return Object.assign({}, s, {
        roofs
      });
    });
    setSel({
      t: "roof",
      id: nr.id
    });
    setSelVert(null);
    setSelBlk(null);
    if (kind !== "facet") setRoofArm(false);
    if (kind === "shed") {
      setEavePick(true);
      setMxy(null);
    }
    return nr;
  };
  const rectFrom3 = (A, B, C) => {
    const ex = B.x - A.x,
      ez = B.z - A.z,
      L = Math.hypot(ex, ez) || 1;
    const nx = -ez / L,
      nz = ex / L,
      wd = (C.x - A.x) * nx + (C.z - A.z) * nz;
    return [A, B, {
      x: B.x + nx * wd,
      z: B.z + nz * wd
    }, {
      x: A.x + nx * wd,
      z: A.z + nz * wd
    }].map(p => ({
      x: p3sR(p.x),
      z: p3sR(p.z)
    }));
  };
  const finishPoly = () => {
    if (!draw || draw.pts.length < 3) return;
    makeRoof(draw.pts, roofOpt.kind);
    setDraw(null);
  };
  const finishObsLine = () => {
    const P = obsPts;
    setObsPts(null);
    if (!P || P.length < 2 || p3sPathLen(P) < 0.3) return;
    const T = P3S_OBS.find(x => x[0] === obsType) || P3S_OBS[0];
    const xs = P.map(q => q.x),
      zs = P.map(q => q.z),
      cx = p3sR((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2),
      cz = p3sR((Math.min.apply(null, zs) + Math.max.apply(null, zs)) / 2);
    const o = {
      id: p3Id("o"),
      kind: "box",
      p3sType: T[0],
      x: cx,
      z: cz,
      w: p3sR(p3sPathLen(P), 10),
      d: T[3],
      h: T[4],
      rot: 0,
      pts: P.map(q => ({
        x: p3sR(q.x - cx, 1000),
        z: p3sR(q.z - cz, 1000)
      }))
    };
    commit(s => Object.assign({}, s, {
      obstacles: (s.obstacles || []).concat([o])
    }));
    setSel({
      t: "obs",
      id: o.id
    });
  };
  const ladderAt = (x, z) => {
    const f = p3sLadderFit(stRef.current.roofs, x, z);
    if (!f) return null;
    return {
      x: p3sR(f.q.x + f.n.x * 0.42),
      z: p3sR(f.q.z + f.n.z * 0.42),
      rot: p3sR((Math.atan2(f.t.z, f.t.x) / P3_DEG % 360 + 360) % 360, 10)
    };
  };
  const finishMeas = () => {
    if (!measPts || measPts.length < 2) {
      setMeasPts(null);
      return;
    }
    const S = stRef.current,
      nm = {
        id: p3Id("m"),
        name: "ระยะ " + ((S.measures || []).length + 1),
        kind: "cable",
        rise: 0,
        pts: measPts.map(p => ({
          x: p3sR(p.x),
          z: p3sR(p.z)
        }))
      };
    commit(s => Object.assign({}, s, {
      measures: (s.measures || []).concat([nm])
    }));
    setSel({
      t: "meas",
      id: nm.id
    });
    setMeasPts(null);
  };
  const applyTyped = () => {
    if (!draw || !draw.typed) return false;
    const L = parseFloat(draw.typed);
    if (!(L > 0)) {
      setDraw(Object.assign({}, draw, {
        typed: ""
      }));
      return true;
    }
    const pts = draw.pts,
      last = pts[pts.length - 1],
      c = cur || last;
    if (rectDraw && pts.length === 2) {
      const C = rectFrom3(pts[0], pts[1], c);
      const ex = pts[1].x - pts[0].x,
        ez = pts[1].z - pts[0].z,
        E = Math.hypot(ex, ez) || 1;
      let nx = -ez / E,
        nz = ex / E;
      const sd = (c.x - pts[0].x) * nx + (c.z - pts[0].z) * nz;
      if (sd < 0) {
        nx = -nx;
        nz = -nz;
      }
      makeRoof(rectFrom3(pts[0], pts[1], {
        x: pts[0].x + nx * L,
        z: pts[0].z + nz * L
      }), roofOpt.kind);
      setDraw(null);
      return !!C;
    }
    let dx = c.x - last.x,
      dz = c.z - last.z,
      D = Math.hypot(dx, dz);
    if (D < 1e-6) {
      dx = 1;
      dz = 0;
      D = 1;
    }
    const np = {
      x: p3sR(last.x + dx / D * L),
      z: p3sR(last.z + dz / D * L)
    };
    setDraw({
      pts: pts.concat([np]),
      typed: ""
    });
    return true;
  };
  const runTrace = (seed, tol, mode, add) => {
    const md = mode || trace && trace.mode || "edge";
    const prev = add && trace && trace.pts ? trace.parts || [trace.pts] : null;
    setTrace(prev ? Object.assign({}, trace, {
      busy: true,
      seed,
      err: null,
      warn: null
    }) : {
      on: true,
      busy: true,
      seed,
      mode: md
    });
    const job = md === "color" ? p3sTrace(stRef.current, seed, tol) : needEdge(seed).then(F => {
      if (!F || F.err) return {
        err: F && F.err || "อ่านขอบภาพไม่ได้"
      };
      const S = stRef.current,
        ax = S.p3sAxis != null ? +S.p3sAxis : p3sDetectAxis(F, seed, 20);
      const r = p3sRayRect(F, seed, ax || 0);
      if (r.pts && S.p3sAxis == null && ax != null) r.ax = ax;
      return r;
    });
    job.then(r => setTrace(t => {
      if (!(t && t.on)) return t;
      if (!prev) return Object.assign({}, t, {
        busy: false,
        seed,
        pts: r.pts || null,
        parts: r.pts ? [r.pts] : null,
        rot: 0,
        err: r.err || null,
        warn: r.warn || null,
        area: r.area,
        ax: r.ax
      });
      if (!r.pts) return Object.assign({}, t, {
        busy: false,
        warn: "จุดที่แตะเพิ่มหาขอบไม่เจอ — ยังใช้รูปเดิม (" + (r.err || "ลองแตะใกล้กลางส่วนนั้นขึ้น") + ")"
      });
      const parts = prev.concat([r.pts]),
        ax = stRef.current.p3sAxis != null ? +stRef.current.p3sAxis : t.ax != null ? t.ax : r.ax || 0;
      const pts = traceShape(parts, ax, t.rot);
      return Object.assign({}, t, {
        busy: false,
        parts,
        pts,
        area: p3sR(p3Area(pts), 10),
        err: null,
        warn: null
      });
    }));
  };
  const traceShape = (parts, ax, rot) => parts.length > 1 ? p3sMergeRect(parts, (ax || 0) + (rot || 0)) : p3sRotPts(parts[0], rot || 0);
  const undoTracePart = () => {
    if (!trace || !trace.parts || trace.parts.length < 2) return;
    const parts = trace.parts.slice(0, -1),
      ax = stRef.current.p3sAxis != null ? +stRef.current.p3sAxis : trace.ax || 0;
    const pts = traceShape(parts, ax, trace.rot);
    setTrace(Object.assign({}, trace, {
      parts,
      pts,
      area: p3sR(p3Area(pts), 10),
      warn: null
    }));
  };
  const rotateTrace = d => {
    if (!trace || !trace.pts || trace.busy) return;
    let rot = d == null ? 0 : Math.round(((trace.rot || 0) + d) * 10) / 10;
    if (rot > 90) rot -= 180;
    if (rot <= -90) rot += 180;
    const ax = stRef.current.p3sAxis != null ? +stRef.current.p3sAxis : trace.ax || 0;
    const pts = traceShape(trace.parts || [trace.pts], ax, rot);
    setTrace(Object.assign({}, trace, {
      rot,
      pts,
      area: p3sR(p3Area(pts), 10)
    }));
  };
  const addRoof = () => {
    setView3d(false);
    setTool("roof");
    setSel(null);
    setSelVert(null);
    setEavePick(false);
    setDraw(null);
    setTrace(null);
    setKindPick(true);
  };
  const acceptTrace = () => {
    if (!trace || !trace.pts) return;
    if (trace.ax != null && stRef.current.p3sAxis == null) commit({
      p3sAxis: trace.ax
    });
    const nr = makeRoof(trace.pts, roofOpt.kind === "facet" ? "flat" : roofOpt.kind);
    setTrace({
      on: true,
      mode: trace.mode,
      done: (trace.done || 0) + (nr ? 1 : 0)
    });
  };
  const setAxis = (deg, msg) => {
    if (deg == null) {
      commit({
        p3sAxis: null
      });
      setAxisMsg(msg || null);
      return;
    }
    commit({
      p3sAxis: p3sNormAxis(deg)
    });
    setAxisMsg(msg || null);
  };
  const finishAxis = (a, b) => {
    setAxisPts(null);
    setCur(null);
    if (Math.hypot(b.x - a.x, b.z - a.z) < 0.4) return;
    setAxis(Math.atan2(b.z - a.z, b.x - a.x) / P3_DEG, "ตั้งแนวจากเส้นที่ลาก");
    if (!wizAllowRef.current) setToolRaw("roof");
  };
  const zoomArea = A => {
    if (!A || !(A.pts || []).length) return;
    const f = A.pts.map(frameOf),
      xs = f.map(q => q.x),
      zs = f.map(q => q.z),
      c = p3sCentroid(A.pts),
      {
        w,
        h
      } = sizeRef.current,
      pad = isMobile ? 30 : 80;
    const s = p3sClamp(Math.min((w - pad) / Math.max(4, Math.max(...xs) - Math.min(...xs)), (h - pad) / Math.max(4, Math.max(...zs) - Math.min(...zs))), 0.4, 300);
    setView({
      cx: c.x,
      cz: c.z,
      s
    });
  };
  const autoAxis = () => {
    const S = sizeRef.current,
      AR = stRef.current && stRef.current.p3sArea;
    if (AR && (AR.pts || []).length > 2) {
      const c = p3sCentroid(AR.pts),
        R = p3sClamp(Math.max(...AR.pts.map(q => Math.max(Math.abs(q.x - c.x), Math.abs(q.z - c.z)))), 6, 55);
      setAxisMsg("กำลังอ่านขอบในภาพ…");
      needEdge(c).then(F => {
        if (!F || F.err) {
          setAxisMsg(F && F.err || "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน");
          return;
        }
        const d = p3sDetectAxis(F, c, R);
        if (d == null) {
          setAxisMsg("ในกรอบพื้นที่ติดตั้งไม่มีขอบชัดพอ — ลากเส้นตามขอบหลังคาเองแทน");
          return;
        }
        setAxis(d, "พบแนวอาคาร " + d + "° จากขอบในกรอบพื้นที่ติดตั้ง — ไม่ตรงปรับองศาด้านล่างได้");
        setTimeout(() => zoomArea(AR), 0);
      });
      return;
    }
    const c = toW({
      x: S.w / 2,
      y: S.h / 2
    });
    setAxisMsg("กำลังอ่านขอบในภาพ…");
    needEdge(c).then(F => {
      if (!F || F.err) {
        setAxisMsg(F && F.err || "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน");
        return;
      }
      const d = p3sDetectAxis(F, c, Math.min(30, 220 / viewRef.current.s + 8));
      if (d == null) {
        setAxisMsg("ภาพบริเวณนี้ไม่มีขอบชัดพอ — ลากเส้นตามขอบหลังคาเองแทน");
        return;
      }
      setAxis(d, "พบแนวอาคาร " + d + "° จากขอบในภาพ (บริเวณกลางจอ)");
    });
  };
  const axisFromRoof = r => {
    const fp = r.kind === "poly" ? p3sFaces2D(r)[0].pts : p3sOutline(r);
    if (fp && fp.length > 2) setAxis(p3sLongEdgeAng(fp) / P3_DEG, "ตั้งแนวตามขอบยาวของ " + (r.name || "หลังคา"));
  };
  const hitWalk = w => {
    const s = viewRef.current.s;
    for (let i = roofs.length - 1; i >= 0; i--) {
      const r = roofs[i],
        ox = +r.x || 0,
        oz = +r.z || 0;
      for (const wk of r.walks || []) {
        const P = (wk.pts || []).map(q => ({
          x: ox + (+q.x || 0),
          z: oz + (+q.z || 0)
        }));
        for (let j = 1; j < P.length; j++) if (p3sDistSeg(w, P[j - 1], P[j]) < Math.max((+wk.w || 0.6) / 2, 8 / s)) return {
          roofId: r.id,
          id: wk.id
        };
      }
    }
    return null;
  };
  const finishWalk = () => {
    const P = walkPts;
    setWalkPts(null);
    setCur(null);
    if (!P || P.length < 2) return;
    const mid = {
      x: (P[0].x + P[P.length - 1].x) / 2,
      z: (P[0].z + P[P.length - 1].z) / 2
    };
    const S = stRef.current;
    let r = (S.roofs || []).slice().reverse().find(x => p3sRoofHit(x, mid)) || (S.roofs || []).slice().reverse().find(x => P.some(q => p3sRoofHit(x, q)));
    if (!r && selRoof) r = selRoof;
    if (!r) return;
    const wk = {
      id: p3Id("wk"),
      w: walkW,
      pts: P.map(q => ({
        x: p3sR(q.x - (+r.x || 0)),
        z: p3sR(q.z - (+r.z || 0))
      }))
    };
    patchRoof(r.id, rr => ({
      walks: (rr.walks || []).concat([wk])
    }));
    setSel({
      t: "roof",
      id: r.id
    });
    setSelWalk({
      roofId: r.id,
      id: wk.id
    });
  };
  const patchWalk = (roofId, id, patch, key) => patchRoof(roofId, r => ({
    walks: (r.walks || []).map(x => x.id === id ? Object.assign({}, x, patch) : x)
  }), key);
  const delWalk = (roofId, id) => {
    patchRoof(roofId, r => ({
      walks: (r.walks || []).filter(x => x.id !== id)
    }));
    setSelWalk(null);
  };
  const setEave = (roof, i, pitch) => {
    patchRoof(roof.id, r => {
      const ph = p3PhOf(r),
        base = ph.length ? Math.min.apply(null, ph) : EAVE;
      const pc = pitch != null ? pitch : p3sPolyPitch(r) > 0.4 ? p3sPolyPitch(r) : 20;
      return {
        ph: p3sPitchPh(r.pts, i, base, pc),
        p3sLow: i,
        p3sEaveFix: true
      };
    });
    if (roof.p3sFacet) weldLive([roof.id]);
  };
  const weldLive = (ids, opt) => {
    const S = stRef.current;
    if (!S) return;
    const res = p3sWeldFacets(S.roofs, ids, opt);
    if (res.n) live(Object.assign({}, S, {
      roofs: res.roofs
    }));
  };
  const weldNow = roof => commit(s => {
    const res = p3sWeldFacets(s.roofs, [roof.id], {
      mark: true
    });
    return res.n ? Object.assign({}, s, {
      roofs: res.roofs
    }) : s;
  });
  const convertRoof = (roof, kind) => {
    const fp = roof.kind === "poly" ? p3sFaces2D(roof)[0].pts : p3sOutline(roof);
    if (!fp || fp.length < 3) return;
    const nr = buildRoof(fp, kind, 1);
    if (!nr) return;
    const ph = roof.kind === "poly" ? p3PhOf(roof) : [];
    const eave = roof.kind === "poly" ? ph.length ? Math.min.apply(null, ph) : EAVE : +roof.h || EAVE;
    const keep = {
      id: roof.id,
      name: roof.name
    };
    const ox = +roof.x || 0,
      oz = +roof.z || 0;
    const walks = (roof.walks || []).map(w => Object.assign({}, w, {
      pts: (w.pts || []).map(q => ({
        x: p3sR(ox + (+q.x || 0) - nr.x),
        z: p3sR(oz + (+q.z || 0) - nr.z)
      }))
    }));
    patchRoof(roof.id, () => {
      const o = Object.assign({}, nr, keep, {
        walks,
        skips: {},
        panelW: roof.panelW,
        panelL: roof.panelL,
        margin: roof.margin
      });
      if (nr.kind === "poly") {
        const d = eave - EAVE;
        o.ph = nr.ph.map(x => p3sR(x + d));
      } else {
        o.h = eave;
        o.pts = null;
        o.ph = null;
      }
      return o;
    });
  };
  const spaceRef = React.useRef(false);
  const keyRef = React.useRef(null);
  keyRef.current = e => {
    const tg = e.target,
      typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable);
    if (typing) {
      if (e.key === "Escape") tg.blur();
      return;
    }
    if (!stRef.current) return;
    const k = e.key,
      mod = e.ctrlKey || e.metaKey;
    if (mod && (k === "z" || k === "Z")) {
      e.preventDefault();
      if (e.shiftKey) redo();else undo();
      return;
    }
    if (mod && (k === "y" || k === "Y")) {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && (k === "s" || k === "S")) {
      e.preventDefault();
      doSave();
      return;
    }
    if (mod && (k === "d" || k === "D")) {
      e.preventDefault();
      duplicate();
      return;
    }
    if (k === " ") {
      spaceRef.current = true;
      e.preventDefault();
      return;
    }
    if (draw && /^[0-9.]$/.test(k)) {
      setDraw(Object.assign({}, draw, {
        typed: (draw.typed || "") + k
      }));
      e.preventDefault();
      return;
    }
    if (k === "Enter") {
      if (draw) {
        if (!applyTyped()) finishPoly();
        e.preventDefault();
        return;
      }
      if (measPts) {
        finishMeas();
        return;
      }
      if (obsPts) {
        finishObsLine();
        return;
      }
      if (walkPts) {
        finishWalk();
        return;
      }
      if (trace && trace.pts) {
        acceptTrace();
        return;
      }
      return;
    }
    if (k === "Backspace") {
      if (draw) {
        e.preventDefault();
        if (draw.typed) setDraw(Object.assign({}, draw, {
          typed: draw.typed.slice(0, -1)
        }));else if (draw.pts.length > 1) setDraw(Object.assign({}, draw, {
          pts: draw.pts.slice(0, -1)
        }));else setDraw(null);
        return;
      }
      if (measPts) {
        e.preventDefault();
        setMeasPts(measPts.length > 1 ? measPts.slice(0, -1) : null);
        return;
      }
      if (obsPts) {
        e.preventDefault();
        setObsPts(obsPts.length > 1 ? obsPts.slice(0, -1) : null);
        return;
      }
      if (walkPts) {
        e.preventDefault();
        setWalkPts(walkPts.length > 1 ? walkPts.slice(0, -1) : null);
        return;
      }
    }
    if (k === "Escape") {
      if (draw) {
        setDraw(null);
        return;
      }
      if (measPts) {
        setMeasPts(null);
        return;
      }
      if (obsPts) {
        setObsPts(null);
        setCur(null);
        return;
      }
      if (walkPts) {
        setWalkPts(null);
        return;
      }
      if (axisPts) {
        setAxisPts(null);
        setCur(null);
        return;
      }
      if (eavePick) {
        setEavePick(false);
        return;
      }
      if (tapPick) {
        setTapPick(null);
        return;
      }
      if (selWalk) {
        setSelWalk(null);
        return;
      }
      if (calib) {
        setCalib(null);
        return;
      }
      if (trace && trace.pts) {
        setTrace({
          on: true
        });
        return;
      }
      if (trace) {
        setTrace(null);
        return;
      }
      if (selVert != null) {
        setSelVert(null);
        return;
      }
      if (selBlk != null) {
        setSelBlk(null);
        return;
      }
      if (sel) {
        setSel(null);
        return;
      }
      if (kindPick) {
        setKindPick(false);
        return;
      }
      if (tool === "roof" && wizHomeRef.current === "roof") return;
      if (toolOk("select")) setTool("select");
      return;
    }
    if (k === "Delete" || k === "Backspace") {
      e.preventDefault();
      delSelected();
      return;
    }
    if (k.indexOf("Arrow") === 0 && sel && (sel.t === "roof" || sel.t === "obs") && canMove(sel.t)) {
      e.preventDefault();
      const st0 = e.shiftKey ? 1 : 0.1;
      const v0 = scrVec(k === "ArrowLeft" ? -st0 : k === "ArrowRight" ? st0 : 0, k === "ArrowUp" ? -st0 : k === "ArrowDown" ? st0 : 0);
      const dx = p3sR(v0.x, 1000),
        dz = p3sR(v0.z, 1000);
      if (sel.t === "roof") {
        const g = selRoof && selRoof.grp;
        commit(s => Object.assign({}, s, {
          roofs: s.roofs.map(r => r.id === sel.id || multi.indexOf(r.id) >= 0 || g && r.grp === g ? Object.assign({}, r, {
            x: p3sR((+r.x || 0) + dx),
            z: p3sR((+r.z || 0) + dz)
          }) : r)
        }), "nudge");
      } else commit(s => Object.assign({}, s, {
        obstacles: (s.obstacles || []).map(o => o.id === sel.id || multi.indexOf(o.id) >= 0 ? Object.assign({}, o, {
          x: p3sR((+o.x || 0) + dx),
          z: p3sR((+o.z || 0) + dz)
        }) : o)
      }), "nudge");
      return;
    }
    if (mod || e.altKey) return;
    const t = P3S_TOOLS.find(x => x.key.toLowerCase() === k.toLowerCase());
    if (t) {
      if (toolOk(t.k)) setTool(t.k);
      return;
    }
    if (k === "f" || k === "F") {
      fitView();
      return;
    }
    if (k === "+" || k === "=") zoomAt({
      x: sizeRef.current.w / 2,
      y: sizeRef.current.h / 2
    }, 1.25);
    if (k === "-" || k === "_") zoomAt({
      x: sizeRef.current.w / 2,
      y: sizeRef.current.h / 2
    }, 0.8);
  };
  React.useEffect(() => {
    const dn = e => keyRef.current && keyRef.current(e);
    const up = e => {
      if (e.key === " ") spaceRef.current = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, []);
  const delSelected = () => {
    if (selWalk) {
      delWalk(selWalk.roofId, selWalk.id);
      return;
    }
    if (!sel || !canMove(sel.t)) return;
    if (sel.t === "roof" && selVert != null && selRoof && selRoof.kind === "poly" && (selRoof.pts || []).length > 3) {
      const i = selVert;
      patchRoof(selRoof.id, r => ({
        pts: r.pts.filter((_, j) => j !== i),
        ph: p3PhOf(r).filter((_, j) => j !== i)
      }));
      setSelVert(null);
      return;
    }
    const key = sel.t === "roof" ? "roofs" : sel.t === "obs" ? "obstacles" : "measures",
      ids = [sel.id].concat(multi);
    commit(s => {
      const o = {};
      o[key] = (s[key] || []).filter(x => ids.indexOf(x.id) < 0);
      return Object.assign({}, s, o);
    });
    setSel(null);
    setSelVert(null);
    setSelBlk(null);
  };
  const duplicate = () => {
    if (!sel || !canMove(sel.t)) return;
    if (multi.length && (sel.t === "roof" || sel.t === "obs")) {
      const ids = [sel.id].concat(multi),
        nids = [];
      commit(S => {
        if (sel.t === "roof") {
          let no = p3NextRoofNo(S.roofs || []);
          const add = [];
          (S.roofs || []).forEach(r => {
            if (ids.indexOf(r.id) < 0) return;
            const nr = Object.assign(JSON.parse(JSON.stringify(r)), {
              id: p3Id("r"),
              name: "หลังคา " + no++,
              x: p3sR((+r.x || 0) + 1.5),
              z: p3sR((+r.z || 0) + 1.5)
            });
            delete nr.grp;
            add.push(nr);
            nids.push(nr.id);
          });
          return Object.assign({}, S, {
            roofs: S.roofs.concat(add)
          });
        }
        const add = [];
        (S.obstacles || []).forEach(o => {
          if (ids.indexOf(o.id) < 0) return;
          const no = Object.assign(JSON.parse(JSON.stringify(o)), {
            id: p3Id("o"),
            x: p3sR((+o.x || 0) + 1.5),
            z: p3sR((+o.z || 0) + 1.5)
          });
          add.push(no);
          nids.push(no.id);
        });
        return Object.assign({}, S, {
          obstacles: (S.obstacles || []).concat(add)
        });
      });
      if (nids.length) {
        keepMulti.current = true;
        setSel({
          t: sel.t,
          id: nids[0]
        });
        setMulti(nids.slice(1));
      }
      return;
    }
    if (sel.t === "roof" && selRoof) {
      const nr = Object.assign(JSON.parse(JSON.stringify(selRoof)), {
        id: p3Id("r"),
        name: "หลังคา " + p3NextRoofNo(roofs),
        x: p3sR((+selRoof.x || 0) + 1.5),
        z: p3sR((+selRoof.z || 0) + 1.5)
      });
      delete nr.grp;
      commit(s => Object.assign({}, s, {
        roofs: s.roofs.concat([nr])
      }));
      setSel({
        t: "roof",
        id: nr.id
      });
    } else if (sel.t === "obs" && selObs) {
      const no = Object.assign({}, selObs, {
        id: p3Id("o"),
        x: p3sR((+selObs.x || 0) + 1.5),
        z: p3sR((+selObs.z || 0) + 1.5)
      });
      commit(s => Object.assign({}, s, {
        obstacles: (s.obstacles || []).concat([no])
      }));
      setSel({
        t: "obs",
        id: no.id
      });
    }
  };
  const doSave = () => {
    const S = stRef.current;
    if (!S) return;
    save(JSON.parse(JSON.stringify(S)));
    setDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };
  const tryClose = () => {
    if (!dirty) {
      onClose();
      return;
    }
    window.askConfirm({
      title: "ปิดโดยไม่บันทึก?",
      body: "มีการแก้ไขที่ยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายไป",
      ok: "ปิดโดยไม่บันทึก"
    }).then(ok => {
      if (ok) onClose();
    });
  };
  const HR = coarse ? 11 : 7;
  const HIT = coarse ? 22 : 12;
  const handles = [];
  const roofHandlesOn = st && !view3d && selRoof && canMove("roof") && !multi.length && (tool === "select" || tool === "roof" && !draw);
  if (roofHandlesOn) {
    if (selRoof.kind === "poly" && Array.isArray(selRoof.pts)) {
      const wp = p3sFaces2D(selRoof)[0] ? p3sFaces2D(selRoof)[0].pts : [];
      wp.forEach((p, i) => {
        const s = toS(p.x, p.z);
        handles.push({
          t: "vert",
          i,
          x: s.x,
          y: s.y
        });
      });
      wp.forEach((p, i) => {
        const q = wp[(i + 1) % wp.length],
          a = toS(p.x, p.z),
          b = toS(q.x, q.z);
        if (Math.hypot(b.x - a.x, b.y - a.y) > 46) handles.push({
          t: "mid",
          i,
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2
        });
      });
    }
    if (selRoof.kind === "gable" || selRoof.kind === "hip") {
      const rY = -(((+selRoof.az || 180) - 180) * P3_DEG),
        ex = p3sRY(1, 0, rY),
        ez = p3sRY(0, 1, rY);
      const hx = (selRoof.kind === "gable" ? +selRoof.ridge || 8 : +selRoof.w || 10) / 2,
        hz = (selRoof.kind === "gable" ? +selRoof.span || 8 : +selRoof.d || 7) / 2;
      [["x", 1], ["x", -1], ["z", 1], ["z", -1]].forEach(([ax, sg]) => {
        const e = ax === "x" ? ex : ez,
          h = ax === "x" ? hx : hz;
        const q = toS((+selRoof.x || 0) + e.x * h * sg, (+selRoof.z || 0) + e.z * h * sg);
        handles.push({
          t: "side",
          i: ax + sg,
          ax,
          sg,
          x: q.x,
          y: q.y
        });
      });
    }
    const ol = p3sOutline(selRoof).map(p => toS(p.x, p.z));
    if (ol.length) {
      const c = p3sRoofCenter(selRoof),
        cs = toS(c.x, c.z);
      const top = Math.min.apply(null, ol.map(p => p.y));
      handles.push({
        t: "rot",
        x: cs.x,
        y: top - (coarse ? 40 : 30),
        ax: cs.x,
        ay: top
      });
    }
  }
  if (!canMove("obs") || multi.length) {} else if (st && !view3d && (tool === "select" || tool === "obs") && !obsPts && selObs && P3S_OBS_LINE[selObs.p3sType] && Array.isArray(selObs.pts)) {
    p3sObsPath(selObs).forEach((q, i) => {
      const sq = toS(q.x, q.z);
      handles.push({
        t: "opt",
        i,
        x: sq.x,
        y: sq.y
      });
    });
  } else if (st && !view3d && tool === "select" && selObs && selObs.p3sType === "ladder") {} else if (st && !view3d && tool === "select" && selObs) {
    const o = selObs,
      c = toS(+o.x || 0, +o.z || 0);
    if (o.kind === "tree") {
      const e = toS((+o.x || 0) + (+o.w || 3) / 2, +o.z || 0);
      handles.push({
        t: "orad",
        x: e.x,
        y: e.y
      });
    } else {
      const k = p3sRot((+o.w || 1) / 2, (+o.d || 1) / 2, (+o.rot || 0) * P3_DEG),
        e = toS((+o.x || 0) + k.x, (+o.z || 0) + k.z);
      handles.push({
        t: "ocorner",
        x: e.x,
        y: e.y
      });
      const tp = p3sRot(0, -(+o.d || 1) / 2, (+o.rot || 0) * P3_DEG),
        ts = toS((+o.x || 0) + tp.x, (+o.z || 0) + tp.z);
      const dx = ts.x - c.x,
        dy = ts.y - c.y,
        L = Math.hypot(dx, dy) || 1;
      handles.push({
        t: "orot",
        x: ts.x + dx / L * 26,
        y: ts.y + dy / L * 26,
        ax: ts.x,
        ay: ts.y
      });
    }
  }
  if (st && !view3d && tool === "select" && selMeas) {
    (selMeas.pts || []).forEach((p, i) => {
      const s = toS(+p.x || 0, +p.z || 0);
      handles.push({
        t: "mpt",
        i,
        x: s.x,
        y: s.y
      });
    });
  }
  const photoBox = () => {
    const S = stRef.current;
    if (!S || !S.photo) return null;
    const pw = +S.photoW || 30,
      ph = pw * photoAR,
      r = (+S.photoRot || 0) * P3_DEG;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const k = p3sRot(a * pw / 2, b * ph / 2, r);
      return {
        x: (+S.photoX || 0) + k.x,
        z: (+S.photoZ || 0) + k.z
      };
    });
  };
  if (st && !view3d && tool === "bg" && st.photo && !calib) {
    const pb = photoBox();
    pb.forEach((p, i) => {
      const s = toS(p.x, p.z);
      handles.push({
        t: "pscale",
        i,
        x: s.x,
        y: s.y
      });
    });
    const a = toS((pb[0].x + pb[1].x) / 2, (pb[0].z + pb[1].z) / 2),
      c = toS(+st.photoX || 0, +st.photoZ || 0);
    const dx = a.x - c.x,
      dy = a.y - c.y,
      L = Math.hypot(dx, dy) || 1;
    handles.push({
      t: "prot",
      x: a.x + dx / L * 30,
      y: a.y + dy / L * 30,
      ax: a.x,
      ay: a.y
    });
  }
  const handlesRef = React.useRef([]);
  handlesRef.current = handles;
  const hitHandle = p => {
    let best = null,
      bd = HIT;
    handlesRef.current.forEach(h => {
      const d = Math.hypot(h.x - p.x, h.y - p.y) - (h.t === "mid" ? 3 : 0);
      if (d < bd) {
        bd = d;
        best = h;
      }
    });
    return best;
  };
  const hitBody = w => {
    const S = stRef.current;
    if (!S) return null;
    const s = viewRef.current.s;
    const obs = canPick("obs") ? S.obstacles || [] : [];
    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i],
        dx = w.x - (+o.x || 0),
        dz = w.z - (+o.z || 0);
      if (P3S_OBS_LINE[o.p3sType]) {
        const P = p3sObsPath(o);
        for (let j = 1; j < P.length; j++) if (p3sDistSeg(w, P[j - 1], P[j]) <= Math.max((+o.d || 0.3) / 2, 10 / s)) return {
          t: "obs",
          id: o.id
        };
        continue;
      }
      if (o.kind === "tree") {
        if (Math.hypot(dx, dz) <= Math.max(+o.w || 1, 0.6) / 2) return {
          t: "obs",
          id: o.id
        };
      } else {
        const l = p3sRot(dx, dz, -(+o.rot || 0) * P3_DEG);
        if (Math.abs(l.x) <= (+o.w || 1) / 2 && Math.abs(l.z) <= Math.max(+o.d || 1, 0.6) / 2) return {
          t: "obs",
          id: o.id
        };
      }
    }
    const ms = canPick("meas") ? S.measures || [] : [];
    for (let i = ms.length - 1; i >= 0; i--) {
      const pts = ms[i].pts || [];
      for (let j = 1; j < pts.length; j++) if (p3sDistSeg(w, pts[j - 1], pts[j]) * s < (coarse ? 14 : 8)) return {
        t: "meas",
        id: ms[i].id
      };
    }
    const rs = canPick("roof") ? S.roofs || [] : [];
    for (let i = rs.length - 1; i >= 0; i--) if (p3sRoofHit(rs[i], w)) return {
      t: "roof",
      id: rs[i].id
    };
    return null;
  };
  const panelAt = (roof, w, want) => {
    const qs = p3sQuads(roof, want);
    for (let i = qs.length - 1; i >= 0; i--) if (p3InPoly(w.x, w.z, qs[i].pts)) return qs[i];
    return null;
  };
  const ptrs = React.useRef(new Map());
  const gest = React.useRef(null);
  const lastTap = React.useRef({
    t: 0,
    x: 0,
    y: 0
  });
  const localXY = e => {
    const r = stageRef.current.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  };
  const THR = coarse ? 8 : 4;
  const ensurePushed = G => {
    if (!G.pushed) {
      pushHist(G.s0);
      G.pushed = true;
    }
  };
  const blkDragPaint = G => {
    const svg = stageRef.current;
    if (!svg || !G.mv) return;
    const now = new Set(),
      tf = "translate(" + G.dx + " " + G.dz + ")";
    G.mv.forEach(m => svg.querySelectorAll('[data-pk="' + G.roofId + ":" + m.k + '"]').forEach(el => {
      el.setAttribute("transform", tf);
      now.add(el);
    }));
    G.els.forEach(el => {
      if (!now.has(el)) el.removeAttribute("transform");
    });
    G.els = now;
    svg.querySelectorAll("[data-pkl]").forEach(el => {
      el.style.visibility = "hidden";
    });
  };
  const blkDragClear = G => {
    if (!G || G.type !== "moveBlk") return;
    if (G.raf) cancelAnimationFrame(G.raf);
    G.raf = 0;
    (G.els || []).forEach(el => el.removeAttribute("transform"));
    const svg = stageRef.current;
    if (svg) svg.querySelectorAll("[data-pkl]").forEach(el => {
      el.style.visibility = "";
    });
  };
  const blkDragDone = G => {
    blkDragClear(G);
    if (G.dx == null) return;
    ensurePushed(G);
    live(Object.assign({}, stRef.current, {
      roofs: stRef.current.roofs.map(r => {
        if (r.id !== G.roofId) return r;
        const bs = G.bsN.slice();
        G.mv.forEach(m => {
          if (!bs[m.k]) return;
          const d = p3sInvJ(m.J, G.dx, G.dz);
          bs[m.k] = Object.assign({}, bs[m.k], {
            du: p3sR(m.du0 + d.du),
            dv: p3sR(m.dv0 + d.dv)
          });
        });
        return Object.assign({}, r, {
          blocks: bs
        });
      })
    }));
  };
  const cancelGesture = () => {
    const G = gest.current;
    gest.current = null;
    setMarq(null);
    blkDragClear(G);
    if (G && G.pushed) {
      const H = hist.current;
      const prev = H.u.pop();
      if (prev) {
        stRef.current = prev;
        setStRaw(prev);
      }
      setHistTick(n => n + 1);
    }
  };
  const onDown = e => {
    if (!st || view3d) return;
    const p = localXY(e);
    try {
      stageRef.current.setPointerCapture(e.pointerId);
    } catch (er) {}
    ptrs.current.set(e.pointerId, p);
    if (ptrs.current.size === 2) {
      cancelGesture();
      const [a, b] = Array.from(ptrs.current.values());
      gest.current = {
        type: "pinch",
        a0: a,
        b0: b,
        v0: viewRef.current
      };
      return;
    }
    if (ptrs.current.size > 2) return;
    const btn = e.button;
    if (btn === 1 || btn === 2 || spaceRef.current || tool === "pan") {
      e.preventDefault();
      gest.current = {
        type: "pan",
        p0: p,
        v0: viewRef.current
      };
      return;
    }
    if (btn !== 0) return;
    const w = toW(p),
      S = stRef.current;
    const base = {
      p0: p,
      w0: w,
      s0: S,
      moved: false,
      shift: e.shiftKey
    };
    const now = Date.now(),
      dbl = now - lastTap.current.t < 360 && Math.hypot(p.x - lastTap.current.x, p.y - lastTap.current.y) < 14;
    lastTap.current = {
      t: now,
      x: p.x,
      y: p.y
    };
    if (tapPick) {
      const po = (S.obstacles || []).find(o => o.id === tapPick);
      if (po) {
        const ox = +po.x || 0,
          oz = +po.z || 0,
          taps = po.taps || [],
          hitR = Math.max(0.25, HIT / viewRef.current.s);
        const ki = taps.findIndex(t => Math.hypot(ox + (+t.x || 0) - w.x, oz + (+t.z || 0) - w.z) < hitR);
        if (ki >= 0) patchObs(po.id, {
          taps: taps.filter((t, i) => i !== ki)
        }, "tap");else {
          const nr = p3sNearOnPath(p3sObsPath(po), w);
          if (nr && nr.d < 1) patchObs(po.id, {
            taps: taps.concat([{
              x: p3sR(nr.x - ox, 1000),
              z: p3sR(nr.z - oz, 1000)
            }])
          }, "tap");
        }
      }
      return;
    }
    if (eavePick && selRoof && selRoof.kind === "poly") {
      const fp = p3sFaces2D(selRoof)[0].pts;
      let bi = -1,
        bd = HIT / viewRef.current.s;
      fp.forEach((a, i) => {
        const d = p3sDistSeg(w, a, fp[(i + 1) % fp.length]);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      if (bi >= 0) {
        setEave(selRoof, bi);
        setEavePick(false);
      }
      return;
    }
    const h = hitHandle(p);
    if (h) {
      if (h.t === "vert") {
        setSelVert(h.i);
        gest.current = Object.assign(base, {
          type: "vert",
          i: h.i,
          roofId: selRoof.id
        });
        return;
      }
      if (h.t === "mid") {
        gest.current = Object.assign(base, {
          type: "mid",
          i: h.i,
          roofId: selRoof.id
        });
        return;
      }
      if (h.t === "side") {
        gest.current = Object.assign(base, {
          type: "side",
          ax: h.ax,
          sg: h.sg,
          roofId: selRoof.id,
          r0: selRoof
        });
        return;
      }
      if (h.t === "rot") {
        const c = p3sRoofCenter(selRoof);
        gest.current = Object.assign(base, {
          type: "rotRoof",
          roofId: selRoof.id,
          c,
          r0: selRoof
        });
        return;
      }
      if (h.t === "ocorner" || h.t === "orad" || h.t === "orot") {
        gest.current = Object.assign(base, {
          type: h.t,
          id: selObs.id,
          o0: selObs
        });
        return;
      }
      if (h.t === "mpt") {
        gest.current = Object.assign(base, {
          type: "mpt",
          i: h.i,
          id: selMeas.id
        });
        return;
      }
      if (h.t === "opt") {
        gest.current = Object.assign(base, {
          type: "opt",
          i: h.i,
          id: selObs.id
        });
        return;
      }
      if (h.t === "pscale" || h.t === "prot") {
        gest.current = Object.assign(base, {
          type: h.t
        });
        return;
      }
    }
    if (tool === "axis") {
      const sp = snapPoint(w, {
        pts: snapPts(),
        free: e.shiftKey,
        img: true
      });
      if (axisPts && axisPts.length) {
        finishAxis(axisPts[0], sp);
        return;
      }
      setAxisPts([sp]);
      setCur(sp);
      gest.current = Object.assign(base, {
        type: "axisDrag",
        a: sp
      });
      return;
    }
    if (tool === "walk") {
      if (!walkPts) {
        const hw = hitWalk(w);
        if (hw) {
          setSelWalk(hw);
          setSel({
            t: "roof",
            id: hw.roofId
          });
          return;
        }
      }
      if (walkPts && dbl) {
        finishWalk();
        return;
      }
      const sp = snapPoint(w, {
        pts: [],
        free: e.shiftKey,
        from: walkPts && walkPts.length ? walkPts[walkPts.length - 1] : null
      });
      setWalkPts((walkPts || []).concat([sp]));
      setSelWalk(null);
      return;
    }
    if (tool === "roof" && !roofLock) {
      if (trace && trace.on) {
        if (!trace.busy) runTrace(w, traceTol, null, !!trace.pts);
        return;
      }
      const sp = snapPoint(w, {
        pts: snapPts().concat(draw && draw.pts.length > 2 ? [draw.pts[0]] : []),
        free: e.shiftKey,
        img: true,
        segs: snapSegs(),
        from: draw && draw.pts.length ? draw.pts[draw.pts.length - 1] : null,
        refs: draw && draw.pts.length > 1 ? [Math.atan2(draw.pts[1].z - draw.pts[0].z, draw.pts[1].x - draw.pts[0].x)] : []
      });
      if (rectDraw) {
        if (!draw) {
          gest.current = Object.assign(base, {
            type: "drawRect",
            a: sp
          });
          return;
        }
        if (draw.pts.length === 1) {
          setDraw({
            pts: [draw.pts[0], sp],
            typed: ""
          });
          return;
        }
        makeRoof(rectFrom3(draw.pts[0], draw.pts[1], cur || sp), roofOpt.kind);
        setDraw(null);
        return;
      }
      if (!draw) {
        setDraw({
          pts: [sp],
          typed: ""
        });
        return;
      }
      const f = draw.pts[0];
      if (draw.pts.length >= 3 && (Math.hypot(toS(f.x, f.z).x - p.x, toS(f.x, f.z).y - p.y) < HIT || dbl)) {
        finishPoly();
        return;
      }
      setDraw({
        pts: draw.pts.concat([sp]),
        typed: ""
      });
      return;
    }
    if (tool === "meas") {
      const sp = snapPoint(w, {
        pts: snapPts(),
        free: e.shiftKey,
        from: measPts && measPts.length ? measPts[measPts.length - 1] : null
      });
      if (measPts && dbl) {
        finishMeas();
        return;
      }
      setMeasPts((measPts || []).concat([sp]));
      return;
    }
    const obsHit = tool === "obs" && !obsPts ? hitBody(w) : null;
    if (tool === "obs" && P3S_OBS_LINE[obsType] && !(obsHit && obsHit.t === "obs")) {
      const sp = snapPoint(w, {
        pts: snapPts().concat(obsPts || []),
        free: e.shiftKey,
        segs: snapSegs(),
        from: obsPts && obsPts.length ? obsPts[obsPts.length - 1] : null
      });
      if (obsPts && obsPts.length >= 2) {
        const l = obsPts[obsPts.length - 1],
          ls = toS(l.x, l.z);
        if (dbl || Math.hypot(ls.x - p.x, ls.y - p.y) < HIT) {
          finishObsLine();
          return;
        }
      }
      setObsPts((obsPts || []).concat([{
        x: p3sR(sp.x),
        z: p3sR(sp.z)
      }]));
      setSel(null);
      setObsMsg(null);
      return;
    }
    if (tool === "obs") {
      const ho = hitBody(w);
      if (!(ho && ho.t === "obs")) {
        gest.current = Object.assign(base, {
          type: "obsRect"
        });
        return;
      }
    }
    if (tool === "area") {
      gest.current = Object.assign(base, {
        type: "areaRect"
      });
      return;
    }
    if (tool === "bg") {
      if (calib) {
        const pts = calib.pts.length >= 2 ? [w] : calib.pts.concat([w]);
        setCalib({
          pts,
          len: calib.len
        });
        return;
      }
      const pb = photoBox();
      if (pb && p3InPoly(w.x, w.z, pb)) {
        gest.current = Object.assign(base, {
          type: "movePhoto",
          x0: +S.photoX || 0,
          z0: +S.photoZ || 0
        });
        return;
      }
      gest.current = Object.assign(base, {
        type: "pan",
        v0: viewRef.current
      });
      return;
    }
    if (tool === "panel" && panGateRef.current) {
      gest.current = Object.assign(base, {
        type: "pan",
        v0: viewRef.current
      });
      return;
    }
    if (tool === "panel") {
      const hb = hitBody(w),
        roof = hb && hb.t === "roof" ? (S.roofs || []).find(r => r.id === hb.id) : null;
      const showSlots = roof && selRoof && roof.id === selRoof.id && selBlk != null;
      const q = roof ? panelAt(roof, w, null) || (showSlots ? panelAt(roof, w, {
        slots: true,
        blk: selBlk
      }) : null) : null;
      if (roof && (!sel || sel.id !== roof.id)) {
        setSel({
          t: "roof",
          id: roof.id
        });
        setSelVert(null);
      }
      if (q && !q.skip && !q.slot) {
        const bsR = p3sBlkStore(roof),
          id = (bsR[q.blk] || {}).id,
          same = selRoof && selRoof.id === roof.id;
        const ids = same ? selIdxOf(roof).map(i => bsR[i].id) : [];
        if (base.shift && same && selBlk != null) {
          const nx = ids.indexOf(id) >= 0 ? ids.filter(x => x !== id) : ids.concat([id]);
          const last = nx.length ? bsR.findIndex(b => b.id === nx[nx.length - 1]) : -1;
          setBlkMul(nx);
          setSelBlk(last >= 0 ? last : null);
          gest.current = Object.assign(base, {
            type: "noop"
          });
          return;
        }
        if (ids.indexOf(id) < 0) {
          setSelBlk(q.blk);
          setBlkMul([]);
        }
        gest.current = Object.assign(base, {
          type: "blkPress",
          roofId: roof.id,
          q,
          ids: ids.indexOf(id) >= 0 ? ids : [id]
        });
        return;
      }
      if (q) {
        gest.current = Object.assign(base, {
          type: "cellTap",
          roofId: roof.id,
          q
        });
        return;
      }
      if (roof) {
        gest.current = Object.assign(base, {
          type: "marquee",
          roofId: roof.id
        });
        return;
      }
      gest.current = Object.assign(base, {
        type: "pan",
        v0: viewRef.current,
        clear: true
      });
      return;
    }
    const hb = hitBody(w);
    if (hb) {
      if (e.shiftKey && sel && sel.t === hb.t && hb.t !== "meas" && canMove(hb.t)) {
        if (hb.id === sel.id) {
          if (multi.length) {
            keepMulti.current = true;
            setSel({
              t: sel.t,
              id: multi[0]
            });
            setMulti(multi.slice(1));
          } else setSel(null);
        } else setMulti(multi.indexOf(hb.id) >= 0 ? multi.filter(x => x !== hb.id) : multi.concat([hb.id]));
        setSelVert(null);
        return;
      }
      const inSet = picked(hb.id) && sel.t === hb.t;
      if (!inSet) {
        setSel(hb);
        setSelVert(null);
        setSelBlk(null);
      } else setSelVert(null);
      const group = inSet ? [sel.id].concat(multi) : [hb.id];
      if (!canMove(hb.t)) {
        gest.current = Object.assign(base, {
          type: "pan",
          v0: viewRef.current
        });
        return;
      }
      if (hb.t === "roof") {
        const gs = {};
        (S.roofs || []).forEach(r => {
          if (group.indexOf(r.id) >= 0 && r.grp) gs[r.grp] = 1;
        });
        const mem = (S.roofs || []).filter(r => group.indexOf(r.id) >= 0 || r.grp && gs[r.grp]);
        const ids = {};
        mem.forEach(r => {
          ids[r.id] = {
            x: +r.x || 0,
            z: +r.z || 0
          };
        });
        const others = [];
        (S.roofs || []).forEach(r => {
          if (!ids[r.id]) p3sFaces2D(r).forEach(fc => fc.pts.forEach(q => others.push(q)));
        });
        const mine = [];
        mem.forEach(r => p3sRoofPts(r).forEach(q => mine.push(q)));
        gest.current = Object.assign(base, {
          type: "moveRoof",
          roofId: hb.id,
          ids,
          others,
          mine
        });
        return;
      }
      if (hb.t === "obs") {
        const o0 = (S.obstacles || []).find(o => o.id === hb.id),
          many = group.length > 1 ? (S.obstacles || []).filter(o => group.indexOf(o.id) >= 0) : null;
        gest.current = Object.assign(base, {
          type: "moveObs",
          id: hb.id,
          o0,
          many
        });
        return;
      }
      if (hb.t === "meas") {
        const m0 = (S.measures || []).find(m => m.id === hb.id);
        gest.current = Object.assign(base, {
          type: "moveMeas",
          id: hb.id,
          m0
        });
        return;
      }
    }
    gest.current = Object.assign(base, {
      type: "pan",
      v0: viewRef.current,
      clear: true
    });
  };
  const onMove = e => {
    if (!st || view3d) return;
    const p = localXY(e);
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, p);
    if ((eavePick || tapPick || tool === "area" || tool === "panel" || tool === "obs") && !(gest.current && (gest.current.type === "moveBlk" || gest.current.type === "blkPress"))) setMxy(p);
    const G = gest.current;
    if (!G) {
      if (e.pointerType === "mouse" || draw || measPts || axisPts || walkPts || obsPts) {
        const w = toW(p);
        if (tool === "roof" && !roofLock && !(trace && trace.on)) {
          const fromP = draw && draw.pts.length ? draw.pts[draw.pts.length - 1] : null;
          if (edgeOn) needEdge(w);
          setCur(snapPoint(w, {
            pts: snapPts().concat(draw && draw.pts.length > 2 ? [draw.pts[0]] : []),
            free: e.shiftKey,
            from: fromP,
            img: true,
            segs: snapSegs(),
            refs: draw && draw.pts.length > 1 ? [Math.atan2(draw.pts[1].z - draw.pts[0].z, draw.pts[1].x - draw.pts[0].x)] : []
          }));
        } else if (tool === "axis" && axisPts && axisPts.length === 1) {
          if (edgeOn) needEdge(w);
          setCur(snapPoint(w, {
            pts: snapPts(),
            free: e.shiftKey,
            img: true
          }));
        } else if (tool === "walk") {
          setCur(snapPoint(w, {
            pts: [],
            free: e.shiftKey,
            from: walkPts && walkPts.length ? walkPts[walkPts.length - 1] : null
          }));
        } else if (tool === "meas") {
          setCur(snapPoint(w, {
            pts: snapPts(),
            free: e.shiftKey,
            from: measPts && measPts.length ? measPts[measPts.length - 1] : null
          }));
        } else if (tool === "obs" && P3S_OBS_LINE[obsType]) {
          setCur(snapPoint(w, {
            pts: snapPts().concat(obsPts || []),
            free: e.shiftKey,
            segs: snapSegs(),
            from: obsPts && obsPts.length ? obsPts[obsPts.length - 1] : null
          }));
        } else if (tool === "bg" && calib) setCur({
          x: w.x,
          z: w.z
        });
        if (e.pointerType === "mouse") {
          const h = hitHandle(p);
          let hv = h ? "h:" + h.t + (h.i != null ? h.i : "") : null;
          if (!hv && (tool === "select" || tool === "panel")) {
            const b = hitBody(w);
            hv = b ? b.t + ":" + b.id : null;
          }
          if (hv !== hover) setHover(hv);
        }
      }
      return;
    }
    if (G.type === "pinch") {
      const vals = Array.from(ptrs.current.values());
      if (vals.length < 2) return;
      const [a, b] = vals,
        d0 = Math.hypot(G.b0.x - G.a0.x, G.b0.y - G.a0.y) || 1,
        d1 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const m0 = {
          x: (G.a0.x + G.b0.x) / 2,
          y: (G.a0.y + G.b0.y) / 2
        },
        m1 = {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2
        };
      const w0 = toW(m0, G.v0),
        s = p3sClamp(G.v0.s * d1 / d0, 0.4, 400);
      setView(Object.assign({
        s
      }, centerFor(w0, m1, s)));
      return;
    }
    const dpx = Math.hypot(p.x - G.p0.x, p.y - G.p0.y);
    if (!G.moved && dpx < THR) return;
    G.moved = true;
    if (G.type === "pan") {
      const v0 = G.v0,
        k = scrVec((p.x - G.p0.x) / v0.s, (p.y - G.p0.y) / v0.s);
      setView({
        s: v0.s,
        cx: v0.cx - k.x,
        cz: v0.cz - k.z
      });
      return;
    }
    const w = toW(p),
      dx = w.x - G.w0.x,
      dz = w.z - G.w0.z,
      S0 = G.s0;
    const free = e.shiftKey;
    const setRoof = (id, fn) => live(Object.assign({}, stRef.current, {
      roofs: stRef.current.roofs.map(r => r.id === id ? Object.assign({}, r, fn(r)) : r)
    }));
    switch (G.type) {
      case "moveRoof":
        {
          ensurePushed(G);
          let ddx = dx,
            ddz = dz;
          if (!free) {
            const lim = SNAP_PX / viewRef.current.s;
            let bd = lim,
              fix = null;
            G.mine.forEach(m => G.others.forEach(o => {
              const d = Math.hypot(m.x + dx - o.x, m.z + dz - o.z);
              if (d < bd) {
                bd = d;
                fix = {
                  x: o.x - m.x,
                  z: o.z - m.z
                };
              }
            }));
            if (fix) {
              ddx = fix.x;
              ddz = fix.z;
            }
          }
          live(Object.assign({}, stRef.current, {
            roofs: stRef.current.roofs.map(r => {
              const o = G.ids[r.id];
              return o ? Object.assign({}, r, {
                x: p3sR(o.x + ddx),
                z: p3sR(o.z + ddz)
              }) : r;
            })
          }));
          return;
        }
      case "mid":
      case "vert":
        {
          ensurePushed(G);
          if (G.type === "mid" && !G.inserted) {
            const i = G.i;
            setRoof(G.roofId, r => {
              const pts = r.pts.slice(),
                ph = p3PhOf(r).slice(),
                a = pts[i],
                b = pts[(i + 1) % pts.length];
              pts.splice(i + 1, 0, {
                x: p3sR((a.x + b.x) / 2),
                z: p3sR((a.z + b.z) / 2)
              });
              ph.splice(i + 1, 0, p3sR((ph[i] + ph[(i + 1) % ph.length]) / 2));
              return {
                pts,
                ph
              };
            });
            G.inserted = true;
            G.i = i + 1;
            G.type = "vert";
            setSelVert(G.i);
          }
          const r = stRef.current.roofs.find(x => x.id === G.roofId);
          if (!r) return;
          const n = r.pts.length,
            prev = r.pts[(G.i - 1 + n) % n],
            next = r.pts[(G.i + 1) % n];
          const ox = +r.x || 0,
            oz = +r.z || 0;
          const refs = [Math.atan2(next.z - prev.z, next.x - prev.x)];
          let sp = snapPoint(w, {
            pts: snapPts(r.id),
            free,
            from: {
              x: ox + prev.x,
              z: oz + prev.z
            },
            refs
          });
          if (!sp.snap && !sp.guide && !free) sp = snapPoint(w, {
            pts: [],
            from: {
              x: ox + next.x,
              z: oz + next.z
            },
            refs
          });
          setCur(sp.guide || sp.snap ? sp : null);
          setRoof(G.roofId, rr => {
            const pts = rr.pts.slice();
            pts[G.i] = {
              x: p3sR(sp.x - ox),
              z: p3sR(sp.z - oz)
            };
            return {
              pts
            };
          });
          return;
        }
      case "rotRoof":
        {
          ensurePushed(G);
          const c = G.c,
            a0 = Math.atan2(G.w0.z - c.z, G.w0.x - c.x),
            a1 = Math.atan2(w.z - c.z, w.x - c.x);
          let dA = a1 - a0;
          const r0 = G.r0;
          if (!free) {
            const baseAng = r0.kind === "poly" ? p3sLongEdgeAng(p3sFaces2D(r0)[0].pts) : ((+r0.az || 180) - 180) * P3_DEG;
            const tA = baseAng + dA,
              q = axisRad + Math.round((tA - axisRad) / (Math.PI / 2)) * (Math.PI / 2);
            if (Math.abs(tA - q) < 2.5 * P3_DEG) dA = q - baseAng;else dA = Math.round(dA / P3_DEG) * P3_DEG;
          }
          const pos = p3sRot((+r0.x || 0) - c.x, (+r0.z || 0) - c.z, dA);
          const patch = {
            x: p3sR(c.x + pos.x),
            z: p3sR(c.z + pos.z)
          };
          if (r0.kind === "poly") {
            patch.pts = r0.pts.map(q2 => {
              const k = p3sRot(+q2.x || 0, +q2.z || 0, dA);
              return {
                x: p3sR(k.x),
                z: p3sR(k.z)
              };
            });
            const pl = p3PolyPlane(r0);
            if (pl && pl.tiltCos > 0.999) {
              const fn = p3sSurfFn(r0, null),
                J = fn ? p3sJac(fn, 0, 0) : null,
                sg = J && J.a * J.d - J.b * J.c < 0 ? -1 : 1;
              patch.blocks = p3sBlkStore(r0).map(b => Object.assign({}, b, {
                rot: p3sR((+b.rot || 0) + sg * dA / P3_DEG, 10)
              }));
            }
          } else patch.az = p3sR((((+r0.az || 180) + dA / P3_DEG) % 360 + 360) % 360, 10);
          if (Array.isArray(r0.walks) && r0.walks.length) patch.walks = r0.walks.map(wk => Object.assign({}, wk, {
            pts: (wk.pts || []).map(q2 => {
              const k = p3sRot(+q2.x || 0, +q2.z || 0, dA);
              return {
                x: p3sR(k.x),
                z: p3sR(k.z)
              };
            })
          }));
          setRoof(G.roofId, () => patch);
          return;
        }
      case "side":
        {
          ensurePushed(G);
          const r0 = G.r0,
            rY = -(((+r0.az || 180) - 180) * P3_DEG),
            e0 = G.ax === "x" ? p3sRY(1, 0, rY) : p3sRY(0, 1, rY);
          const isG = r0.kind === "gable",
            key = G.ax === "x" ? isG ? "ridge" : "w" : isG ? "span" : "d";
          const h = (+r0[key] || 8) / 2,
            ex = e0.x * G.sg,
            ez = e0.z * G.sg;
          const O = {
            x: (+r0.x || 0) - ex * h,
            z: (+r0.z || 0) - ez * h
          };
          let L = (w.x - O.x) * ex + (w.z - O.z) * ez;
          if (!free) {
            const EF = edgeOn ? edgeRef.current : null,
              q = {
                x: O.x + ex * L,
                z: O.z + ez * L
              };
            const sn = EF ? p3sEdgeSnap(EF, q, Math.max(SNAP_PX * 1.5 / viewRef.current.s, 0.25), {
              x: ex,
              z: ez
            }) : null;
            if (sn) L = (sn.x - O.x) * ex + (sn.z - O.z) * ez;
            if (edgeOn) needEdge(q);
          }
          L = Math.max(1, L);
          const patch = {
            x: p3sR(O.x + ex * L / 2),
            z: p3sR(O.z + ez * L / 2)
          };
          patch[key] = p3sR(L);
          setRoof(G.roofId, () => patch);
          return;
        }
      case "axisDrag":
        {
          setCur(snapPoint(w, {
            pts: snapPts(),
            free,
            img: true
          }));
          return;
        }
      case "moveObs":
        {
          ensurePushed(G);
          let mv = {
            x: p3sR((+G.o0.x || 0) + dx),
            z: p3sR((+G.o0.z || 0) + dz)
          };
          if (G.many) {
            const m0 = {};
            G.many.forEach(o => {
              m0[o.id] = o;
            });
            live(Object.assign({}, stRef.current, {
              obstacles: stRef.current.obstacles.map(o => {
                const a = m0[o.id];
                if (!a) return o;
                let q = {
                  x: p3sR((+a.x || 0) + dx),
                  z: p3sR((+a.z || 0) + dz)
                };
                if (a.p3sType === "ladder") {
                  const f = ladderAt(q.x, q.z);
                  if (!f) return o;
                  q = f;
                }
                return Object.assign({}, o, q);
              })
            }));
            return;
          }
          if (G.o0.p3sType === "ladder") {
            const f = ladderAt(mv.x, mv.z);
            if (!f) return;
            mv = f;
          }
          live(Object.assign({}, stRef.current, {
            obstacles: stRef.current.obstacles.map(o => o.id === G.id ? Object.assign({}, o, mv) : o)
          }));
          return;
        }
      case "ocorner":
      case "orad":
      case "orot":
        {
          ensurePushed(G);
          const o0 = G.o0,
            lx = w.x - (+o0.x || 0),
            lz = w.z - (+o0.z || 0);
          let patch;
          if (G.type === "orad") {
            const R = Math.max(0.3, Math.hypot(lx, lz));
            patch = {
              w: p3sR(R * 2, 10),
              d: p3sR(R * 2, 10)
            };
          } else if (G.type === "ocorner") {
            const l = p3sRot(lx, lz, -(+o0.rot || 0) * P3_DEG);
            patch = {
              w: p3sR(Math.max(0.3, Math.abs(l.x) * 2), 10),
              d: p3sR(Math.max(0.3, Math.abs(l.z) * 2), 10)
            };
          } else {
            let a = Math.atan2(lz, lx) / P3_DEG + 90;
            if (!free) a = Math.round(a / 5) * 5;
            patch = {
              rot: p3sR((a % 360 + 360) % 360, 10)
            };
          }
          live(Object.assign({}, stRef.current, {
            obstacles: stRef.current.obstacles.map(o => o.id === G.id ? Object.assign({}, o, patch) : o)
          }));
          return;
        }
      case "moveMeas":
        {
          ensurePushed(G);
          live(Object.assign({}, stRef.current, {
            measures: stRef.current.measures.map(m => m.id === G.id ? Object.assign({}, m, {
              pts: G.m0.pts.map(q => ({
                x: p3sR((+q.x || 0) + dx),
                z: p3sR((+q.z || 0) + dz)
              }))
            }) : m)
          }));
          return;
        }
      case "opt":
        {
          ensurePushed(G);
          const sp = snapPoint(w, {
            pts: snapPts(),
            free,
            segs: snapSegs()
          });
          live(Object.assign({}, stRef.current, {
            obstacles: stRef.current.obstacles.map(o => {
              if (o.id !== G.id) return o;
              const pts = o.pts.slice();
              pts[G.i] = {
                x: p3sR(sp.x - (+o.x || 0), 1000),
                z: p3sR(sp.z - (+o.z || 0), 1000)
              };
              return Object.assign({}, o, {
                pts,
                w: p3sR(p3sPathLen(pts), 10)
              });
            })
          }));
          return;
        }
      case "mpt":
        {
          ensurePushed(G);
          const sp = snapPoint(w, {
            pts: snapPts(),
            free
          });
          live(Object.assign({}, stRef.current, {
            measures: stRef.current.measures.map(m => {
              if (m.id !== G.id) return m;
              const pts = m.pts.slice();
              pts[G.i] = {
                x: sp.x,
                z: sp.z
              };
              return Object.assign({}, m, {
                pts
              });
            })
          }));
          return;
        }
      case "movePhoto":
        {
          ensurePushed(G);
          live(Object.assign({}, stRef.current, {
            photoX: p3sR(G.x0 + dx),
            photoZ: p3sR(G.z0 + dz)
          }));
          return;
        }
      case "pscale":
        {
          ensurePushed(G);
          const c = {
            x: +S0.photoX || 0,
            z: +S0.photoZ || 0
          };
          const f = Math.hypot(w.x - c.x, w.z - c.z) / (Math.hypot(G.w0.x - c.x, G.w0.z - c.z) || 1);
          live(Object.assign({}, stRef.current, {
            photoW: p3sR(p3sClamp((+S0.photoW || 30) * f, 2, 2000), 10)
          }));
          return;
        }
      case "prot":
        {
          ensurePushed(G);
          const c = {
            x: +S0.photoX || 0,
            z: +S0.photoZ || 0
          };
          const dA = (Math.atan2(w.z - c.z, w.x - c.x) - Math.atan2(G.w0.z - c.z, G.w0.x - c.x)) / P3_DEG;
          let r = (+S0.photoRot || 0) + dA;
          r = free ? p3sR(r, 10) : p3sR(r, 2);
          live(Object.assign({}, stRef.current, {
            photoRot: (r % 360 + 360) % 360
          }));
          return;
        }
      case "blkPress":
      case "moveBlk":
        {
          if (G.type === "blkPress") {
            const r0 = (S0.roofs || []).find(r => r.id === G.roofId);
            if (!r0) return;
            let pan;
            try {
              pan = p3Panels(r0);
            } catch (er) {
              return;
            }
            const rect = (pan.rects || []).find(x => x.blk === G.q.blk && (x.side || null) === (G.q.side || null)) || (pan.rects || []).find(x => x.blk === G.q.blk);
            const fn = p3sSurfFn(r0, G.q.side);
            if (!rect || !fn) {
              G.type = "noop";
              return;
            }
            const sides = (pan.faces || []).map(f => f.side).filter(Boolean);
            let bsN = p3sBlkStore(r0),
              j = G.q.blk,
              chg = false;
            if (sides.length > 1 && !(bsN[j] || {}).face && G.q.side) {
              bsN = p3sZoneSplit(r0, sides);
              chg = true;
            }
            if (bsN.some(b => b.patch)) {
              bsN = p3sPatchGroups(bsN);
              chg = true;
            }
            if (chg) {
              const hit = p3sQuads(Object.assign({}, r0, {
                blocks: bsN
              })).find(q => !q.skip && !q.slot && p3InPoly(G.w0.x, G.w0.z, q.pts));
              if (hit) j = hit.blk;
            }
            const b0 = bsN[j] || {};
            let ids = (G.ids || []).indexOf(b0.id) >= 0 ? G.ids : [b0.id];
            const r1 = Object.assign({}, r0, {
              blocks: bsN
            });
            let pan1;
            try {
              pan1 = p3Panels(r1);
            } catch (er) {
              pan1 = pan;
            }
            const mv = [];
            bsN.forEach((b, k) => {
              if (ids.indexOf(b.id) < 0 || mv.some(m => m.k === k)) return;
              const rc = (pan1.rects || []).find(x => x.blk === k),
                f1 = rc && p3sSurfFn(r1, rc.side);
              mv.push({
                k,
                J: f1 ? p3sJac(f1, rc.cu, rc.cv) : p3sJac(fn, rect.cu, rect.cv),
                du0: +b.du || 0,
                dv0: +b.dv || 0
              });
            });
            Object.assign(G, {
              type: "moveBlk",
              mv,
              bsN,
              j,
              els: new Set()
            });
            if (chg) {
              ensurePushed(G);
              setRoof(G.roofId, () => ({
                blocks: bsN
              }));
            }
            setSelBlk(j);
            setBlkMul(mv.length > 1 ? mv.map(m => bsN[m.k].id) : []);
            if (b0.face) setZoneSel(b0.face);
          }
          G.dx = dx;
          G.dz = dz;
          if (!G.raf) G.raf = requestAnimationFrame(() => {
            G.raf = 0;
            blkDragPaint(G);
          });
          return;
        }
      case "marquee":
      case "cellTap":
        {
          if (G.type === "cellTap") G.type = "marquee";
          setMarq({
            w0: G.w0,
            w1: toW(p)
          });
          return;
        }
      case "drawRect":
      case "obsRect":
      case "areaRect":
        {
          setMarq({
            w0: G.w0,
            w1: toW(p),
            world: true
          });
          return;
        }
      default:
    }
  };
  const onUp = e => {
    ptrs.current.delete(e.pointerId);
    try {
      stageRef.current.releasePointerCapture(e.pointerId);
    } catch (er) {}
    const G = gest.current;
    if (!G) return;
    if (G.type === "pinch") {
      if (ptrs.current.size < 2) gest.current = null;
      return;
    }
    gest.current = null;
    const p = localXY(e),
      w = toW(p),
      S = stRef.current;
    setCur(c => tool === "roof" || tool === "meas" || tool === "walk" || tool === "axis" || tool === "obs" && P3S_OBS_LINE[obsType] ? c : null);
    if (G.type === "pan") {
      if (!G.moved && G.clear) {
        setSel(null);
        setSelVert(null);
        setSelBlk(null);
      }
      return;
    }
    if (G.type === "moveBlk") {
      blkDragDone(G);
      return;
    }
    if (G.type === "blkPress" && !G.moved) {
      if ((G.ids || []).length > 1) {
        setSelBlk(G.q.blk);
        setBlkMul([]);
      }
      return;
    }
    if (G.type === "cellTap" && !G.moved) {
      const r = S.roofs.find(x => x.id === G.roofId);
      if (r) toggleCell(r, G.q.key, !!G.q.slot);
      return;
    }
    if (G.type === "marquee") {
      setMarq(null);
      if (!G.moved) {
        setSelBlk(null);
        return;
      }
      const r = S.roofs.find(x => x.id === G.roofId);
      if (!r) return;
      const P0 = toS(G.w0.x, G.w0.z),
        x0 = Math.min(P0.x, p.x),
        x1 = Math.max(P0.x, p.x),
        y0 = Math.min(P0.y, p.y),
        y1 = Math.max(P0.y, p.y);
      const inR = q => {
        const c = toS(q.cx, q.cz);
        return c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1;
      };
      let bs0 = p3sBlkStore(r);
      if (!r.noPanel && !bs0.some(b => b.patch)) {
        const qa = p3sQuads(r).filter(q => !q.slot),
          on = qa.filter(q => !q.skip);
        if (on.length && on.length < qa.length * 0.5) bs0 = bs0.map((b, i) => {
          const only = {};
          on.forEach(q => {
            if (q.blk === i) only[q.key] = true;
          });
          return Object.assign({}, b, {
            patch: true,
            only,
            skips: {},
            adds: {}
          });
        });
      }
      const fresh = r.noPanel || !p3sCount(r) && !bs0.some(b => b.patch);
      if (fresh || bs0.some(b => b.patch)) {
        const bs = fresh ? p3sSplitAll(r, p3sFillPatch(r, "portrait").blocks.map(b => Object.assign({}, b, {
          patch: true,
          only: {}
        }))) : p3sSplitAll(r, bs0);
        const nb = p3sMarqPatch(r, bs, inR);
        if (!nb) return;
        patchRoof(r.id, fresh ? {
          blocks: nb,
          skips: {},
          noPanel: null
        } : {
          blocks: nb
        });
        const cw = toW({
            x: (x0 + x1) / 2,
            y: (y0 + y1) / 2
          }),
          nq = p3sQuads(Object.assign({}, r, {
            noPanel: null,
            blocks: nb
          })).filter(q => !q.skip && !q.slot && inR(q));
        nq.sort((a, b) => Math.hypot(a.cx - cw.x, a.cz - cw.z) - Math.hypot(b.cx - cw.x, b.cz - cw.z));
        setSelBlk(nq.length ? nq[0].blk : null);
        return;
      }
      const inside = p3sQuads(r).filter(q => {
        const c = toS(q.cx, q.cz);
        return c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1;
      });
      if (!inside.length) return;
      const anyOn = inside.some(q => !q.skip);
      setCells(r, inside.map(q => q.key), anyOn);
      return;
    }
    if (G.type === "axisDrag") {
      if (G.moved) finishAxis(G.a, snapPoint(w, {
        pts: snapPts(),
        free: e.shiftKey,
        img: true
      }));
      return;
    }
    if (G.type === "areaRect") {
      setMarq(null);
      if (!G.moved) return;
      const P0 = toS(G.w0.x, G.w0.z),
        A4 = [toW(P0), toW({
          x: p.x,
          y: P0.y
        }), toW(p), toW({
          x: P0.x,
          y: p.y
        })].map(q => ({
          x: p3sR(q.x),
          z: p3sR(q.z)
        }));
      if (p3Area(A4) < 4) return;
      commit({
        p3sArea: {
          pts: A4
        }
      });
      zoomArea({
        pts: A4
      });
      return;
    }
    if (G.type === "drawRect") {
      setMarq(null);
      if (!G.moved) {
        setDraw({
          pts: [G.a],
          typed: ""
        });
        return;
      }
      const b = snapPoint(w, {
        pts: snapPts(),
        free: e.shiftKey,
        img: true,
        segs: snapSegs()
      });
      const A = G.a,
        fa = frameOf(A),
        fb = frameOf(b);
      const back = (x, z) => {
        const k = scrVec(x, z);
        return {
          x: p3sR(k.x),
          z: p3sR(k.z)
        };
      };
      makeRoof([{
        x: A.x,
        z: A.z
      }, back(fb.x, fa.z), {
        x: b.x,
        z: b.z
      }, back(fa.x, fb.z)], roofOpt.kind);
      return;
    }
    if (G.type === "obsRect") {
      setMarq(null);
      let o;
      const T = P3S_OBS.find(x => x[0] === obsType) || P3S_OBS[0],
        kd = T[0] === "tree" ? "tree" : "box",
        r0 = p3sR((rotRef.current / P3_DEG % 360 + 360) % 360, 10);
      if (!G.moved && T[0] !== "ladder") o = {
        id: p3Id("o"),
        kind: kd,
        p3sType: T[0],
        x: p3sR(w.x),
        z: p3sR(w.z),
        w: T[2],
        d: T[3],
        h: T[4],
        rot: r0
      };else if (P3S_OBS_LINE[T[0]]) {
        const a = G.w0,
          L = Math.hypot(w.x - a.x, w.z - a.z);
        o = {
          id: p3Id("o"),
          kind: kd,
          p3sType: T[0],
          x: p3sR((a.x + w.x) / 2),
          z: p3sR((a.z + w.z) / 2),
          w: p3sR(Math.max(0.5, L), 10),
          d: T[3],
          h: T[4],
          rot: p3sR((Math.atan2(w.z - a.z, w.x - a.x) / P3_DEG % 360 + 360) % 360, 10)
        };
      } else if (T[0] === "ladder") {
        const at = ladderAt(w.x, w.z);
        if (!at) {
          setObsMsg("บันไดลิงต้องติดที่ขอบหลังคา — แตะใกล้ขอบหลังคา (ไม่เกิน 3 ม.)");
          return;
        }
        o = Object.assign({
          id: p3Id("o"),
          kind: kd,
          p3sType: T[0],
          w: T[2],
          d: T[3],
          h: T[4]
        }, at);
      } else {
        const a = G.w0,
          fa = frameOf(a),
          fb = frameOf(w),
          ww = p3sR(Math.max(0.3, Math.abs(fb.x - fa.x)), 10),
          dd = p3sR(Math.max(0.3, Math.abs(fb.z - fa.z)), 10);
        o = {
          id: p3Id("o"),
          kind: kd,
          p3sType: T[0],
          x: p3sR((a.x + w.x) / 2),
          z: p3sR((a.z + w.z) / 2),
          w: kd === "tree" ? Math.max(ww, dd) : ww,
          d: kd === "tree" ? Math.max(ww, dd) : dd,
          h: T[4],
          rot: r0
        };
      }
      commit(s => Object.assign({}, s, {
        obstacles: (s.obstacles || []).concat([o])
      }));
      setSel({
        t: "obs",
        id: o.id
      });
      setObsMsg(null);
      if (!wizAllowRef.current) setToolRaw("select");
      return;
    }
    if (G.type === "vert" || G.type === "mid" || G.type === "side") {
      setCur(null);
      const r = (G.type === "vert" || G.type === "mid") && S.roofs.find(x => x.id === G.roofId);
      if (r && r.p3sFacet) weldLive([r.id]);
      return;
    }
  };
  const onCancel = e => {
    ptrs.current.delete(e.pointerId);
    if (gest.current && gest.current.type !== "pinch") cancelGesture();else gest.current = null;
    setMarq(null);
  };
  const total = st ? p3CountAll(st) : 0;
  const kwp = Math.round(total * (st && +st.wp || 650) / 10) / 100;
  const goal = job && +job.panels ? +job.panels : 0;
  const fileRef = React.useRef(null);
  React.useEffect(() => {
    if (sunHour == null) return;
    let raf,
      last = performance.now(),
      h = sunHour;
    const step = t => {
      const dt = (t - last) / 1000;
      last = t;
      h += dt * (14 / 15);
      if (h > 19.5 && vidRef.current) {
        const R = vidRef.current;
        vidRef.current = null;
        finishVideo(R);
        return;
      }
      if (h > 19.5) h = 5.5;
      setSunHour(h);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sunHour != null]);
  if (!st) {
    return React.createElement("div", {
      className: "p3s",
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "var(--bg)",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement("style", null, P3S_CSS), React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1A\u0E1A\u2026"));
  }
  const V = view,
    Sz = size;
  const rotDeg = rotRef.current / P3_DEG;
  const tf = "translate(" + Sz.w / 2 + " " + Sz.h / 2 + ") rotate(" + -rotDeg + ") scale(" + V.s + ") translate(" + -V.cx + " " + -V.cz + ")";
  const faceTone = (asp, on) => {
    if (!asp || asp.az == null) return on ? "rgba(22,163,74,.16)" : "rgba(226,232,240,.42)";
    const d = Math.abs((asp.az - 180 + 540) % 360 - 180);
    const c = d < 50 ? "250,204,21" : d < 125 ? "251,146,60" : "96,165,250";
    return "rgba(" + c + "," + (on ? 0.42 : 0.3) + ")";
  };
  const ptsStr = pts => pts.map(p => p.x + "," + p.z).join(" ");
  const sPts = pts => pts.map(p => {
    const s = toS(p.x, p.z);
    return s.x + "," + s.y;
  }).join(" ");
  const NS = {
    vectorEffect: "non-scaling-stroke"
  };
  const showGhost = tool === "panel";
  const imgFilter = imgFx.b !== 1 || imgFx.c !== 1 ? {
    filter: "brightness(" + imgFx.b + ") contrast(" + imgFx.c + ")"
  } : undefined;
  const fmtM = v => (v >= 100 ? Math.round(v) : p3sR(v, 100)) + " ม.";
  const roofEls = roofs.map(r => {
    const faces = p3sFaces2D(r),
      isSel = selRoof && selRoof.id === r.id || !!selRoof && multi.indexOf(r.id) >= 0,
      isHov = hover === "roof:" + r.id;
    return React.createElement("g", {
      key: r.id
    }, faces.map((f, i) => React.createElement("polygon", {
      key: i,
      points: ptsStr(f.pts),
      fill: faceTone(f.asp, isSel),
      stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#334155",
      strokeWidth: isSel ? 2.4 : isHov ? 2 : 1.3,
      style: NS,
      strokeLinejoin: "round"
    })), r.kind === "dome" && (() => {
      const D = p3DomeGeo(r),
        a = -(((+r.az || 180) - 180) * P3_DEG),
        ox = +r.x || 0,
        oz = +r.z || 0;
      const W = (x, z) => {
        const q = p3sRY(x, z, a);
        return {
          x: q.x + ox,
          z: q.z + oz
        };
      };
      return [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((f, i) => {
        const zz = D.zAt(f * D.th),
          A = W(-D.len / 2, zz),
          B = W(D.len / 2, zz);
        return React.createElement("line", {
          key: "dm" + i,
          x1: A.x,
          y1: A.z,
          x2: B.x,
          y2: B.z,
          stroke: f === 0 ? "#b45309" : "#64748b",
          strokeWidth: f === 0 ? 2 : 1,
          strokeDasharray: f === 0 ? null : "4 4",
          style: NS
        });
      });
    })(), r.kind === "poly" && faces[0] && faces[0].asp && faces[0].asp.az != null && (() => {
      const fp = faces[0].pts,
        ph = p3PhOf(r);
      let lo = r.p3sLow != null ? +r.p3sLow : 0;
      if (r.p3sLow == null) {
        let bv = 1e9;
        fp.forEach((_, i) => {
          const v = ph[i] + ph[(i + 1) % fp.length];
          if (v < bv) {
            bv = v;
            lo = i;
          }
        });
      }
      const a = fp[lo % fp.length],
        b = fp[(lo + 1) % fp.length];
      return a && b ? React.createElement("line", {
        x1: a.x,
        y1: a.z,
        x2: b.x,
        y2: b.z,
        stroke: "#ea580c",
        strokeWidth: isSel ? 4.5 : 3,
        strokeLinecap: "round",
        style: NS
      }) : null;
    })(), (r.walks || []).map(wk => {
      const P = (wk.pts || []).map(q => ({
        x: (+r.x || 0) + (+q.x || 0),
        z: (+r.z || 0) + (+q.z || 0)
      }));
      const on = selWalk && selWalk.id === wk.id;
      return React.createElement("g", {
        key: wk.id
      }, React.createElement("polyline", {
        points: ptsStr(P),
        fill: "none",
        stroke: on ? "rgba(234,88,12,.55)" : "rgba(250,204,21,.55)",
        strokeWidth: +wk.w || 0.6,
        strokeLinecap: "butt",
        strokeLinejoin: "round"
      }), React.createElement("polyline", {
        points: ptsStr(P),
        fill: "none",
        stroke: on ? "#c2410c" : "#a16207",
        strokeWidth: 1.4,
        strokeDasharray: "6 5",
        style: NS
      }));
    }));
  });
  const panelEls = roofs.map(r => {
    const isSel = selRoof && selRoof.id === r.id;
    const P = p3sQuadPaths(r),
      selSet = isSel && tool === "panel" ? selIdxOf(r) : [];
    const slots = isSel && tool === "panel" && selBlk != null ? p3sQuads(r, {
      slots: true,
      blk: selBlk
    }).filter(q => q.slot) : [];
    return React.createElement("g", {
      key: r.id
    }, showGhost && isSel && P.off && React.createElement("path", {
      d: P.off,
      fill: "rgba(255,255,255,.18)",
      stroke: "#64748b",
      strokeWidth: 1,
      strokeDasharray: "3 3",
      style: NS
    }), P.on.map((d, bi) => d && React.createElement("path", {
      key: bi,
      "data-pk": r.id + ":" + bi,
      d: d,
      fill: selSet.indexOf(bi) >= 0 ? "#0ea5e9" : "#17357a",
      stroke: selSet.indexOf(bi) >= 0 ? "#fff" : "#aabddd",
      strokeWidth: selSet.indexOf(bi) >= 0 ? 1.2 : 0.7,
      style: NS
    })), slots.map(q => React.createElement("polygon", {
      key: "s" + q.key,
      points: ptsStr(q.pts),
      fill: "rgba(22,163,74,.10)",
      stroke: "#16a34a",
      strokeWidth: 1,
      strokeDasharray: "2 3",
      style: NS
    })));
  });
  const groupInfo = r => {
    const hit = _p3sGrpCache.get(r);
    if (hit) return hit;
    const v = groupInfo0(r);
    _p3sGrpCache.set(r, v);
    return v;
  };
  const groupInfo0 = r => {
    let pan;
    try {
      pan = p3Panels(r);
    } catch (e) {
      return [];
    }
    const bl = pan.blocks || [];
    if (!bl.some(b => (b.gc > 0 || b.gr > 0) && b.gg > 0 || b.patch)) return [];
    const G = {},
      par = {},
      rc = {};
    const find = k => {
      while (par[k] !== k) {
        par[k] = par[par[k]];
        k = par[k];
      }
      return k;
    };
    const qs = p3sQuads(r).filter(q => !q.skip && !q.slot);
    qs.forEach(q => {
      const m = /(-?\d+)_(-?\d+)$/.exec(q.key);
      if (m) {
        rc[q.key] = [+m[1], +m[2], q.key.slice(0, m.index)];
        par[q.key] = q.key;
      }
    });
    qs.forEach(q => {
      const b = bl[q.blk] || {},
        a = rc[q.key];
      if (!b.patch || !a) return;
      [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => {
        const k = a[2] + (a[0] + dr) + "_" + (a[1] + dc);
        if (par[k] != null) par[find(k)] = find(q.key);
      });
    });
    qs.forEach(q => {
      const b = bl[q.blk] || {},
        a = rc[q.key];
      if (!a) return;
      const gk = q.blk + "|" + (q.side || "") + "|" + (b.gr > 0 && b.gg > 0 ? Math.floor(a[0] / b.gr) : 0) + "|" + (b.gc > 0 && b.gg > 0 ? Math.floor(a[1] / b.gc) : 0) + "|" + (b.patch ? find(q.key) : "");
      (G[gk] = G[gk] || []).push(q);
    });
    return Object.keys(G).map(k => {
      const pts = [];
      G[k].forEach(q => q.pts.forEach(pp => pts.push(pp)));
      return {
        k,
        n: G[k].length,
        hull: p3sHull(pts)
      };
    });
  };
  const groupEls = [],
    groupLbls = [];
  roofs.forEach(r => {
    if (!(tool === "panel" || tool === "walk" || selRoof && selRoof.id === r.id)) return;
    groupInfo(r).forEach((g, i) => {
      groupEls.push(React.createElement("polygon", {
        key: r.id + g.k,
        "data-pk": r.id + ":" + g.k.split("|")[0],
        points: ptsStr(g.hull),
        fill: "none",
        stroke: "#f59e0b",
        strokeWidth: 1.4,
        strokeDasharray: "4 3",
        style: NS
      }));
      if (V.s >= 9) {
        const c = p3sCentroid(g.hull),
          sc = toS(c.x, c.z);
        groupLbls.push(React.createElement("g", {
          key: "gl" + r.id + g.k,
          "data-pkl": "1",
          transform: "translate(" + sc.x + " " + sc.y + ")",
          style: {
            pointerEvents: "none"
          }
        }, React.createElement("text", {
          textAnchor: "middle",
          y: 4,
          fontSize: 10.5,
          fontWeight: 800,
          fill: "#78350f",
          stroke: "#fff",
          strokeWidth: 3,
          paintOrder: "stroke"
        }, "\u0E01\u0E25\u0E38\u0E48\u0E21 ", i + 1, " \xB7 ", g.n)));
      }
    });
  });
  if (tool === "panel") roofs.forEach(r => {
    if (r.noPanel) return;
    let pan;
    try {
      pan = p3Panels(r);
    } catch (e) {
      return;
    }
    const fsd = (pan.faces || []).map(f => f.side).filter(Boolean);
    if (fsd.length < 2) return;
    p3sFaces2D(r).forEach(f => {
      if (!f.side || fsd.indexOf(f.side) < 0) return;
      const zc = P3S_ZONE_C["ABCD".indexOf(f.side)] || "#f59e0b",
        on = selRoof && selRoof.id === r.id && zoneOf(r) === f.side;
      groupEls.push(React.createElement("polygon", {
        key: "z" + r.id + f.side,
        points: ptsStr(f.pts),
        fill: on ? zc + "24" : "none",
        stroke: zc,
        strokeWidth: on ? 2.6 : 1.6,
        strokeDasharray: on ? null : "7 4",
        strokeLinejoin: "round",
        style: NS
      }));
      const c = p3sCentroid(f.pts),
        sc = toS(c.x, c.z),
        txt = "โซน " + f.side + " · " + (pan["count" + f.side] || 0) + " แผง",
        lw = txt.length * 6.4 + 14;
      groupLbls.push(React.createElement("g", {
        key: "zl" + r.id + f.side,
        transform: "translate(" + sc.x + " " + sc.y + ")",
        style: {
          pointerEvents: "none"
        }
      }, React.createElement("rect", {
        x: -lw / 2,
        y: -10,
        width: lw,
        height: 20,
        rx: 10,
        fill: zc,
        opacity: on ? 1 : 0.85
      }), React.createElement("text", {
        textAnchor: "middle",
        y: 4.5,
        fontSize: 11,
        fontWeight: 800,
        fill: "#fff"
      }, txt)));
    });
  });
  let blkFrame = null;
  if (tool === "panel" && selRoof && selBlk != null) {
    try {
      const pan = p3Panels(selRoof),
        sset = selIdxOf(selRoof),
        qa = p3sQuads(selRoof);
      blkFrame = [];
      sset.forEach(k => {
        const sb = (pan.blocks || [])[k] || {};
        if (!sb.patch) return;
        const pts = [];
        qa.forEach(q => {
          if (q.blk === k && !q.skip && !q.slot) q.pts.forEach(pp => pts.push(pp));
        });
        if (pts.length) blkFrame.push(React.createElement("polygon", {
          key: "pf" + k,
          "data-pk": selRoof.id + ":" + k,
          points: ptsStr(p3sHull(pts)),
          fill: "none",
          stroke: "#f59e0b",
          strokeWidth: 2.4,
          strokeDasharray: "6 4",
          style: NS
        }));
      });
      if (!((pan.blocks || [])[selBlk] || {}).patch) blkFrame = blkFrame.concat((pan.rects || []).filter(x => x.blk === selBlk).map((rc, i) => {
        const fn = p3sSurfFn(selRoof, rc.side);
        if (!fn) return null;
        const cs = Math.cos(rc.rot * P3_DEG),
          sn = Math.sin(rc.rot * P3_DEG);
        const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
          const u = a * rc.w / 2 + 0.06 * a,
            v = b * rc.h / 2 + 0.06 * b;
          return fn(rc.cu + u * cs - v * sn, rc.cv + u * sn + v * cs);
        });
        return React.createElement("polygon", {
          key: i,
          "data-pk": selRoof.id + ":" + selBlk,
          points: ptsStr(pts),
          fill: "none",
          stroke: "#f59e0b",
          strokeWidth: 2,
          strokeDasharray: "6 4",
          style: NS
        });
      }));
    } catch (er) {
      blkFrame = null;
    }
  }
  const obsEl = (o, isSel, isHov) => {
    if (o.kind === "tree") return React.createElement("circle", {
      key: o.id,
      cx: +o.x || 0,
      cy: +o.z || 0,
      r: Math.max(+o.w || 1, 0.6) / 2,
      fill: "rgba(34,120,60,.42)",
      stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#166534",
      strokeWidth: isSel ? 2.4 : 1.4,
      style: NS
    });
    const T = p3sObsType(o),
      stk = isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#334155";
    if (T === "turbine" || T === "vent") return React.createElement("g", {
      key: o.id
    }, React.createElement("polygon", {
      points: ptsStr(p3sObsRect(o, P3S_ON_ROOF[T])),
      fill: "rgba(239,68,68,.08)",
      stroke: "#ef4444",
      strokeWidth: 1,
      strokeDasharray: "4 3",
      style: NS
    }), React.createElement("circle", {
      cx: +o.x || 0,
      cy: +o.z || 0,
      r: Math.min(+o.w || 0.6, +o.d || 0.6) / 2,
      fill: "rgba(203,213,225,.85)",
      stroke: stk,
      strokeWidth: isSel ? 2.4 : 1.4,
      style: NS
    }), React.createElement("circle", {
      cx: +o.x || 0,
      cy: +o.z || 0,
      r: Math.min(+o.w || 0.6, +o.d || 0.6) / (T === "vent" ? 4 : 6),
      fill: "#64748b",
      style: NS
    }));
    if (T === "pipe" || T === "tray") {
      const P = p3sObsPath(o),
        parts = [];
      if (T === "tray") {
        const hw = Math.max(0.05, (+o.d || 0.1) / 2);
        for (let i = 1; i < P.length; i++) parts.push(React.createElement("polygon", {
          key: "y" + i,
          points: ptsStr(p3sSegRect(P[i - 1], P[i], hw, hw)),
          fill: "rgba(148,163,184,.9)",
          stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#475569",
          strokeWidth: isSel ? 2.2 : 1,
          style: NS
        }));
        parts.push(React.createElement("polyline", {
          key: "c",
          points: ptsStr(P),
          fill: "none",
          stroke: "#334155",
          strokeWidth: 1,
          strokeDasharray: "3 3",
          style: NS
        }));
      } else {
        parts.push(React.createElement("polyline", {
          key: "w",
          points: ptsStr(P),
          fill: "none",
          stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#15803d",
          strokeWidth: isSel ? 6 : 4.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: NS
        }));
        parts.push(React.createElement("polyline", {
          key: "g",
          points: ptsStr(P),
          fill: "none",
          stroke: "#4ade80",
          strokeWidth: 2.4,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: NS
        }));
        parts.push(React.createElement("polyline", {
          key: "y",
          points: ptsStr(P),
          fill: "none",
          stroke: "#facc15",
          strokeWidth: 0.9,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: NS
        }));
        (o.taps || []).forEach((tp, k) => parts.push(React.createElement("circle", {
          key: "t" + k,
          cx: (+o.x || 0) + (+tp.x || 0),
          cy: (+o.z || 0) + (+tp.z || 0),
          r: 0.16,
          fill: "#ef4444",
          stroke: "#fff",
          strokeWidth: 1.6,
          style: NS
        })));
      }
      return React.createElement("g", {
        key: o.id
      }, parts);
    }
    if (T === "rail" || T === "walkway" || T === "sky") {
      const P = p3sObsPath(o),
        hw = Math.max(0.05, (+o.d || 0.3) / 2),
        parts = [];
      p3sObsKeep(o, P3S_ON_ROOF[T]).forEach((R, k) => parts.push(React.createElement("polygon", {
        key: "k" + k,
        points: ptsStr(R),
        fill: T === "rail" ? "rgba(239,68,68,.06)" : "none",
        stroke: "#ef4444",
        strokeWidth: 0.8,
        strokeDasharray: "4 3",
        style: NS
      })));
      if (T === "sky") {
        for (let i = 1; i < P.length; i++) {
          const A = P[i - 1],
            B = P[i],
            L = Math.hypot(B.x - A.x, B.z - A.z) || 1,
            ux = (B.x - A.x) / L,
            uz = (B.z - A.z) / L,
            nr = Math.max(2, Math.round(hw * 2 / 0.2));
          parts.push(React.createElement("polygon", {
            key: "s" + i,
            points: ptsStr(p3sSegRect(A, B, hw, 0)),
            fill: "rgba(186,230,253,.30)",
            stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#0284c7",
            strokeWidth: isSel ? 2.2 : 1.2,
            style: NS
          }));
          for (let k = 1; k < nr; k++) {
            const off = -hw + 2 * hw * k / nr;
            parts.push(React.createElement("line", {
              key: "r" + i + "-" + k,
              x1: A.x - uz * off,
              y1: A.z + ux * off,
              x2: B.x - uz * off,
              y2: B.z + ux * off,
              stroke: "rgba(2,132,199,.35)",
              strokeWidth: 0.6,
              style: NS
            }));
          }
        }
      } else if (T === "walkway") {
        for (let i = 1; i < P.length; i++) {
          const A = P[i - 1],
            B = P[i],
            L = Math.hypot(B.x - A.x, B.z - A.z) || 1,
            ux = (B.x - A.x) / L,
            uz = (B.z - A.z) / L,
            n = Math.max(1, Math.round(L / 0.3));
          parts.push(React.createElement("polygon", {
            key: "w" + i,
            points: ptsStr(p3sSegRect(A, B, hw, hw)),
            fill: "rgba(250,204,21,.85)",
            stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#ca8a04",
            strokeWidth: isSel ? 2.2 : 1,
            style: NS
          }));
          for (let k = 1; k < n; k++) {
            const t = L * k / n,
              cx = A.x + ux * t,
              cz = A.z + uz * t;
            parts.push(React.createElement("line", {
              key: "t" + i + "-" + k,
              x1: cx - uz * hw,
              y1: cz + ux * hw,
              x2: cx + uz * hw,
              y2: cz - ux * hw,
              stroke: "#a16207",
              strokeWidth: 0.7,
              style: NS
            }));
          }
        }
      } else {
        parts.push(React.createElement("polyline", {
          key: "ln",
          points: ptsStr(P),
          fill: "none",
          stroke: stk,
          strokeWidth: isSel ? 3.2 : 2.2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          style: NS
        }));
        p3sRailPosts(P).forEach((q, k) => parts.push(React.createElement("circle", {
          key: "p" + k,
          cx: q.x,
          cy: q.z,
          r: 0.09,
          fill: "#475569",
          style: NS
        })));
      }
      return React.createElement("g", {
        key: o.id
      }, parts);
    }
    if (T === "ladder") return React.createElement("g", {
      key: o.id
    }, React.createElement("polygon", {
      points: ptsStr(p3sObsRect(o, P3S_ON_ROOF[T])),
      fill: "rgba(239,68,68,.06)",
      stroke: "#ef4444",
      strokeWidth: 1,
      strokeDasharray: "4 3",
      style: NS
    }), React.createElement("polygon", {
      points: ptsStr(p3sObsRect(o, 0)),
      fill: "rgba(203,213,225,.75)",
      stroke: stk,
      strokeWidth: isSel ? 2.4 : 1.4,
      style: NS
    }), [-0.24, -0.08, 0.08, 0.24].map((u, k) => {
      const A = p3sRot(u, -0.4, (+o.rot || 0) * P3_DEG),
        B = p3sRot(u, 0.4, (+o.rot || 0) * P3_DEG);
      return React.createElement("line", {
        key: k,
        x1: (+o.x || 0) + A.x,
        y1: (+o.z || 0) + A.z,
        x2: (+o.x || 0) + B.x,
        y2: (+o.z || 0) + B.z,
        stroke: "#475569",
        strokeWidth: 0.8,
        style: NS
      });
    }));
    return React.createElement("rect", {
      key: o.id,
      x: (+o.x || 0) - (+o.w || 1) / 2,
      y: (+o.z || 0) - (+o.d || 1) / 2,
      width: +o.w || 1,
      height: +o.d || 1,
      transform: "rotate(" + (+o.rot || 0) + " " + (+o.x || 0) + " " + (+o.z || 0) + ")",
      fill: "rgba(100,116,139,.5)",
      stroke: isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#334155",
      strokeWidth: isSel ? 2.4 : 1.4,
      style: NS
    });
  };
  const obsEls = (st.obstacles || []).map(o => obsEl(o, selObs && selObs.id === o.id || !!selObs && multi.indexOf(o.id) >= 0, hover === "obs:" + o.id));
  let obsGhost = null,
    ladderFar = false;
  if (tool === "obs" && mxy && !view3d && !gest.current && !obsPts && !P3S_OBS_LINE[obsType] && !(hover && hover.indexOf("obs:") === 0)) {
    const T = P3S_OBS.find(x => x[0] === obsType) || P3S_OBS[0],
      gw = toW(mxy);
    let g = null;
    if (T[0] === "ladder") {
      const at = ladderAt(gw.x, gw.z);
      if (at) g = Object.assign({
        id: "__ghost",
        kind: "box",
        p3sType: "ladder",
        w: T[2],
        d: T[3],
        h: T[4]
      }, at);else ladderFar = true;
    } else g = {
      id: "__ghost",
      kind: T[0] === "tree" ? "tree" : "box",
      p3sType: T[0],
      x: gw.x,
      z: gw.z,
      w: T[2],
      d: T[3],
      h: T[4],
      rot: p3sR((rotRef.current / P3_DEG % 360 + 360) % 360, 10)
    };
    if (g) obsGhost = React.createElement("g", {
      opacity: 0.6,
      style: {
        pointerEvents: "none"
      }
    }, obsEl(g, false, true));
  }
  const measEls = (st.measures || []).map(m => {
    const K = p3MeasKind(m.kind),
      col = "#" + K.c.toString(16).padStart(6, "0"),
      isSel = selMeas && selMeas.id === m.id;
    return React.createElement("polyline", {
      key: m.id,
      points: ptsStr(m.pts || []),
      fill: "none",
      stroke: col,
      strokeWidth: isSel ? 4 : 2.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: NS
    });
  });
  const labels = groupLbls.slice();
  const lbl = (key, x, y, txt, tone) => labels.push(React.createElement("g", {
    key: key,
    transform: "translate(" + x + " " + y + ")",
    style: {
      pointerEvents: "none"
    }
  }, React.createElement("rect", {
    x: -(String(txt).length * 3.4 + 7),
    y: -10,
    width: String(txt).length * 6.8 + 14,
    height: 20,
    rx: 10,
    fill: tone === "pri" ? "#16a34a" : tone === "warn" ? "#f59e0b" : "rgba(15,23,42,.82)"
  }), React.createElement("text", {
    textAnchor: "middle",
    y: 4.5,
    fontSize: 11.5,
    fontWeight: 700,
    fill: "#fff"
  }, txt)));
  const edgeLabels = (pts, kp, closed) => {
    for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      const a = pts[i],
        b = pts[(i + 1) % pts.length],
        L = Math.hypot(b.x - a.x, b.z - a.z);
      const sa = toS(a.x, a.z),
        sb = toS(b.x, b.z);
      if (Math.hypot(sb.x - sa.x, sb.y - sa.y) < 54) continue;
      lbl(kp + i, (sa.x + sb.x) / 2, (sa.y + sb.y) / 2, fmtM(L));
    }
  };
  if (selRoof && !view3d && tool !== "panel") {
    const f = p3sFaces2D(selRoof);
    if (selRoof.kind === "poly" && f[0]) edgeLabels(f[0].pts, "re", true);else edgeLabels(p3sOutline(selRoof), "re", true);
  }
  if (!view3d && V.s >= 4) roofs.forEach(r => {
    const isSel = selRoof && selRoof.id === r.id;
    p3sFaces2D(r).forEach((f, i) => {
      if (!f.asp || f.asp.az == null) return;
      const c = p3sCentroid(f.pts),
        sc = toS(c.x, c.z);
      const L0 = Math.hypot(f.asp.dx, f.asp.dz) || 1,
        d = p3sRot(f.asp.dx / L0, f.asp.dz / L0, -rotRef.current);
      const A = 13,
        x2 = sc.x + d.x * A,
        y2 = sc.y + d.z * A,
        x1 = sc.x - d.x * A,
        y1 = sc.y - d.z * A;
      const nx = -d.z,
        ny = d.x;
      labels.push(React.createElement("g", {
        key: "ar" + r.id + i,
        style: {
          pointerEvents: "none"
        },
        opacity: isSel ? 1 : 0.75
      }, React.createElement("line", {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        stroke: "#fff",
        strokeWidth: 4,
        strokeLinecap: "round"
      }), React.createElement("path", {
        d: "M" + (x2 + nx * 5 - d.x * 6) + " " + (y2 + ny * 5 - d.z * 6) + "L" + x2 + " " + y2 + "L" + (x2 - nx * 5 - d.x * 6) + " " + (y2 - ny * 5 - d.z * 6),
        fill: "none",
        stroke: "#fff",
        strokeWidth: 4,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }), React.createElement("line", {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        stroke: "#9a3412",
        strokeWidth: 1.8,
        strokeLinecap: "round"
      }), React.createElement("path", {
        d: "M" + (x2 + nx * 5 - d.x * 6) + " " + (y2 + ny * 5 - d.z * 6) + "L" + x2 + " " + y2 + "L" + (x2 - nx * 5 - d.x * 6) + " " + (y2 - ny * 5 - d.z * 6),
        fill: "none",
        stroke: "#9a3412",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      })));
      if (isSel && tool !== "panel") lbl("fa" + i, sc.x, sc.y + 24, (f.side ? f.side + " · " : "") + "หัน" + p3sCompass(f.asp.az) + " " + Math.round(f.asp.pitch) + "°");
    });
  });
  (st.obstacles || []).forEach(o => {
    if (V.s < 5) return;
    const s = toS(+o.x || 0, +o.z || 0);
    labels.push(React.createElement("text", {
      key: "on" + o.id,
      x: s.x,
      y: s.y + 4,
      textAnchor: "middle",
      fontSize: 10.5,
      fontWeight: 800,
      fill: "#0f172a",
      stroke: "#fff",
      strokeWidth: 3,
      paintOrder: "stroke",
      style: {
        pointerEvents: "none"
      }
    }, p3sObsName(o)));
  });
  roofs.forEach(r => {
    if (V.s < 2) return;
    const c = p3sRoofCenter(r),
      s = toS(c.x, c.z),
      n = p3sCount(r),
      nm = r.name || "หลังคา",
      lw = nm.length * 7.2 + 18;
    labels.push(React.createElement("g", {
      key: "rn" + r.id,
      transform: "translate(" + s.x + " " + s.y + ")",
      style: {
        pointerEvents: "none"
      }
    }, React.createElement("rect", {
      x: -lw / 2,
      y: -17,
      width: lw,
      height: 21,
      rx: 10.5,
      fill: selRoof && selRoof.id === r.id ? "#0f766e" : "rgba(15,23,42,.78)"
    }), React.createElement("text", {
      textAnchor: "middle",
      y: -2,
      fontSize: 12,
      fontWeight: 800,
      fill: "#fff"
    }, nm), n > 0 && React.createElement("text", {
      textAnchor: "middle",
      y: 13,
      fontSize: 11,
      fontWeight: 700,
      fill: "#1e3a8a",
      stroke: "#fff",
      strokeWidth: 3,
      paintOrder: "stroke"
    }, n, " \u0E41\u0E1C\u0E07")));
  });
  (st.measures || []).forEach(m => {
    const pts = m.pts || [];
    if (pts.length < 2) return;
    const mid = pts[Math.floor((pts.length - 1) / 2)],
      nx = pts[Math.floor((pts.length - 1) / 2) + 1];
    const s = toS((mid.x + nx.x) / 2, (mid.z + nx.z) / 2);
    lbl("ml" + m.id, s.x, s.y - 14, (m.name ? m.name + " · " : "") + fmtM(p3MeasLen(m)), selMeas && selMeas.id === m.id ? "pri" : null);
  });
  const preview = [];
  if (tool === "roof" && draw && !view3d) {
    const pts = draw.pts,
      c = cur;
    if (rectDraw) {
      if (pts.length === 1 && c) {
        preview.push(React.createElement("polyline", {
          key: "r1",
          points: sPts([pts[0], c]),
          fill: "none",
          stroke: "#16a34a",
          strokeWidth: 2.4
        }));
        edgeLabels([pts[0], c], "pe", false);
      }
      if (pts.length === 2 && c) {
        const R4 = rectFrom3(pts[0], pts[1], c);
        preview.push(React.createElement("polygon", {
          key: "r2",
          points: sPts(R4),
          fill: "rgba(22,163,74,.14)",
          stroke: "#16a34a",
          strokeWidth: 2.4
        }));
        edgeLabels(R4, "pe", true);
      }
    } else {
      const all = c ? pts.concat([c]) : pts;
      preview.push(React.createElement("polyline", {
        key: "pl",
        points: sPts(all),
        fill: all.length > 2 ? "rgba(22,163,74,.12)" : "none",
        stroke: "#16a34a",
        strokeWidth: 2.4,
        strokeLinejoin: "round"
      }));
      edgeLabels(all, "pe", false);
    }
    pts.forEach((p, i) => {
      const s = toS(p.x, p.z);
      preview.push(React.createElement("circle", {
        key: "pp" + i,
        cx: s.x,
        cy: s.y,
        r: i === 0 && pts.length > 2 ? HR + 3 : HR - 1,
        fill: "#fff",
        stroke: "#16a34a",
        strokeWidth: 2.4
      }));
    });
    if (draw.typed && c) {
      const s = toS(c.x, c.z);
      lbl("typed", s.x + 34, s.y - 22, draw.typed + " ม. ↵", "warn");
    }
  }
  if (tool === "axis" && axisPts && !view3d) {
    const a = axisPts[0],
      b = cur || a,
      sa = toS(a.x, a.z),
      sb = toS(b.x, b.z);
    const dx = sb.x - sa.x,
      dy = sb.y - sa.y,
      L = Math.hypot(dx, dy) || 1,
      E = 5000;
    preview.push(React.createElement("line", {
      key: "axx",
      x1: sa.x - dx / L * E,
      y1: sa.y - dy / L * E,
      x2: sa.x + dx / L * E,
      y2: sa.y + dy / L * E,
      stroke: "#d946ef",
      strokeWidth: 1.2,
      strokeDasharray: "8 6"
    }));
    preview.push(React.createElement("line", {
      key: "axl",
      x1: sa.x,
      y1: sa.y,
      x2: sb.x,
      y2: sb.y,
      stroke: "#d946ef",
      strokeWidth: 3,
      strokeLinecap: "round"
    }));
    [sa, sb].forEach((q, i) => preview.push(React.createElement("circle", {
      key: "axp" + i,
      cx: q.x,
      cy: q.y,
      r: HR - 1,
      fill: "#fff",
      stroke: "#d946ef",
      strokeWidth: 2.4
    })));
    if (L > 30) lbl("axd", (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 18, p3sNormAxis(Math.atan2(b.z - a.z, b.x - a.x) / P3_DEG) + "°", "warn");
  }
  if (tool === "walk" && walkPts && !view3d) {
    const all = cur ? walkPts.concat([cur]) : walkPts;
    preview.push(React.createElement("polyline", {
      key: "wkw",
      points: sPts(all),
      fill: "none",
      stroke: "rgba(250,204,21,.6)",
      strokeWidth: Math.max(3, walkW * V.s),
      strokeLinejoin: "round"
    }));
    preview.push(React.createElement("polyline", {
      key: "wkl",
      points: sPts(all),
      fill: "none",
      stroke: "#a16207",
      strokeWidth: 1.6,
      strokeDasharray: "6 5"
    }));
    walkPts.forEach((q, i) => {
      const sq = toS(q.x, q.z);
      preview.push(React.createElement("circle", {
        key: "wkp" + i,
        cx: sq.x,
        cy: sq.y,
        r: HR - 2,
        fill: "#fff",
        stroke: "#a16207",
        strokeWidth: 2.2
      }));
    });
  }
  if (eavePick && selRoof && selRoof.kind === "poly" && !view3d) {
    const fp = p3sFaces2D(selRoof)[0].pts;
    const mw = mxy ? toW(mxy) : null;
    let near = -1,
      nd = 1e9;
    if (mw) fp.forEach((a, i) => {
      const d = p3sDistSeg(mw, a, fp[(i + 1) % fp.length]);
      if (d < nd) {
        nd = d;
        near = i;
      }
    });
    fp.forEach((a, i) => {
      const b = fp[(i + 1) % fp.length],
        sa = toS(a.x, a.z),
        sb = toS(b.x, b.z);
      preview.push(React.createElement("line", {
        key: "ep" + i,
        x1: sa.x,
        y1: sa.y,
        x2: sb.x,
        y2: sb.y,
        stroke: "#ea580c",
        strokeWidth: i === near ? 10 : 7,
        strokeOpacity: i === near ? 0.85 : 0.35,
        strokeLinecap: "round"
      }));
    });
  }
  if (obsPts && (tool !== "obs" || !P3S_OBS_LINE[obsType])) setObsPts(null);
  if (tool === "obs" && obsPts && !view3d) {
    const all = cur ? obsPts.concat([cur]) : obsPts,
      col = obsType === "walkway" ? "#ca8a04" : obsType === "pipe" ? "#15803d" : "#475569";
    preview.push(React.createElement("polyline", {
      key: "op",
      points: sPts(all),
      fill: "none",
      stroke: col,
      strokeWidth: obsType === "walkway" ? Math.max(4, 0.3 * V.s) : 3,
      strokeOpacity: 0.8,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }));
    obsPts.forEach((q, i) => {
      const sq = toS(q.x, q.z);
      preview.push(React.createElement("circle", {
        key: "opp" + i,
        cx: sq.x,
        cy: sq.y,
        r: HR - 2,
        fill: "#fff",
        stroke: col,
        strokeWidth: 2.4
      }));
    });
    if (cur) {
      const sq = toS(cur.x, cur.z);
      lbl("ot", sq.x + 40, sq.y - 20, "รวม " + fmtM(p3sPathLen(all)), "warn");
    }
  }
  if (tool === "meas" && measPts && !view3d) {
    const all = cur ? measPts.concat([cur]) : measPts;
    preview.push(React.createElement("polyline", {
      key: "mp",
      points: sPts(all),
      fill: "none",
      stroke: "#f97316",
      strokeWidth: 3,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }));
    measPts.forEach((p, i) => {
      const s = toS(p.x, p.z);
      preview.push(React.createElement("circle", {
        key: "mpp" + i,
        cx: s.x,
        cy: s.y,
        r: HR - 2,
        fill: "#fff",
        stroke: "#f97316",
        strokeWidth: 2.4
      }));
    });
    const tot = p3MeasLen({
      pts: all
    });
    if (cur) {
      const s = toS(cur.x, cur.z);
      lbl("mt", s.x + 40, s.y - 20, "รวม " + fmtM(tot), "warn");
    }
  }
  if ((tool === "roof" || tool === "meas" || tool === "walk" || tool === "axis" || tool === "obs" && P3S_OBS_LINE[obsType] || gest.current && (gest.current.type === "vert" || gest.current.type === "side")) && cur && !view3d) {
    const s = toS(cur.x, cur.z);
    if (cur.guide) {
      const F = toS(cur.guide.from.x, cur.guide.from.z),
        a = cur.guide.ang,
        Lp = 4000;
      preview.push(React.createElement("line", {
        key: "gd",
        x1: F.x - Math.cos(a) * Lp,
        y1: F.y - Math.sin(a) * Lp,
        x2: F.x + Math.cos(a) * Lp,
        y2: F.y + Math.sin(a) * Lp,
        stroke: "#d946ef",
        strokeWidth: 1.2,
        strokeDasharray: "5 5"
      }));
    }
    if (cur.snap) preview.push(React.createElement("circle", {
      key: "sn",
      cx: s.x,
      cy: s.y,
      r: HR + 5,
      fill: "none",
      stroke: "#d946ef",
      strokeWidth: 2.4
    }));
    if (cur.edge) preview.push(React.createElement("rect", {
      key: "se",
      x: s.x - HR - 3,
      y: s.y - HR - 3,
      width: 2 * HR + 6,
      height: 2 * HR + 6,
      rx: 3,
      fill: "none",
      stroke: "#06b6d4",
      strokeWidth: 2.4,
      transform: "rotate(45 " + s.x + " " + s.y + ")"
    }));
    if (tool !== "select") preview.push(React.createElement("g", {
      key: "cx",
      style: {
        pointerEvents: "none"
      }
    }, React.createElement("path", {
      d: "M" + (s.x - 9) + " " + s.y + "h18M" + s.x + " " + (s.y - 9) + "v18",
      stroke: "#0f172a",
      strokeWidth: 1.4
    })));
  }
  if (trace && trace.pts && !view3d) {
    preview.push(React.createElement("polygon", {
      key: "tr",
      points: sPts(trace.pts),
      fill: "rgba(245,158,11,.18)",
      stroke: "#f59e0b",
      strokeWidth: 2.6,
      strokeDasharray: "7 4"
    }));
    edgeLabels(trace.pts, "te", true);
    const R = roofOpt.kind === "gable" || roofOpt.kind === "hip" || roofOpt.kind === "dome" ? p3MinRect(trace.pts) : null;
    if (R) {
      const ang = R.w >= R.d ? R.ang : R.ang + Math.PI / 2,
        L = Math.max(R.w, R.d) / 2,
        S2 = Math.min(R.w, R.d) / 2;
      const ux = Math.cos(ang),
        uz = Math.sin(ang),
        vx = -uz,
        vz = ux;
      const P = (a, b) => toS(R.cx + ux * a + vx * b, R.cz + uz * a + vz * b);
      const rl = roofOpt.kind === "hip" ? Math.max(0, L - S2) : L,
        A = P(-rl, 0),
        B = P(rl, 0);
      preview.push(React.createElement("line", {
        key: "trr",
        x1: A.x,
        y1: A.y,
        x2: B.x,
        y2: B.y,
        stroke: "#b45309",
        strokeWidth: 2.6
      }));
      if (roofOpt.kind === "dome") [-0.87, -0.5, 0.5, 0.87].forEach((f, i) => {
        const C = P(-L, f * S2),
          D2 = P(L, f * S2);
        preview.push(React.createElement("line", {
          key: "trd" + i,
          x1: C.x,
          y1: C.y,
          x2: D2.x,
          y2: D2.y,
          stroke: "#b45309",
          strokeWidth: 1.3,
          strokeDasharray: "4 4"
        }));
      });
      if (roofOpt.kind === "hip") [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b], i) => {
        const E = a < 0 ? A : B,
          C = P(a * L, b * S2);
        preview.push(React.createElement("line", {
          key: "trh" + i,
          x1: E.x,
          y1: E.y,
          x2: C.x,
          y2: C.y,
          stroke: "#b45309",
          strokeWidth: 2
        }));
      });
    }
  }
  if (trace && trace.busy && trace.seed) {
    const s = toS(trace.seed.x, trace.seed.z);
    preview.push(React.createElement("circle", {
      key: "tb",
      cx: s.x,
      cy: s.y,
      r: 14,
      fill: "none",
      stroke: "#f59e0b",
      strokeWidth: 3,
      strokeDasharray: "10 6"
    }, React.createElement("animateTransform", {
      attributeName: "transform",
      type: "rotate",
      from: "0 " + s.x + " " + s.y,
      to: "360 " + s.x + " " + s.y,
      dur: "1s",
      repeatCount: "indefinite"
    })));
  }
  if (tool === "bg" && calib && !view3d) {
    const all = calib.pts.length === 1 && cur ? calib.pts.concat([cur]) : calib.pts;
    if (all.length) preview.push(React.createElement("polyline", {
      key: "cb",
      points: sPts(all),
      fill: "none",
      stroke: "#e11d48",
      strokeWidth: 2.6
    }));
    all.forEach((p, i) => {
      const s = toS(p.x, p.z);
      preview.push(React.createElement("circle", {
        key: "cbp" + i,
        cx: s.x,
        cy: s.y,
        r: HR - 1,
        fill: "#fff",
        stroke: "#e11d48",
        strokeWidth: 2.4
      }));
    });
  }
  if (st.p3sArea && (st.p3sArea.pts || []).length > 2) preview.unshift(React.createElement("polygon", {
    key: "area",
    points: sPts(st.p3sArea.pts),
    fill: tool === "area" ? "rgba(245,158,11,.08)" : "none",
    stroke: "#f59e0b",
    strokeWidth: tool === "area" ? 2.4 : 1.6,
    strokeDasharray: "8 5",
    style: {
      pointerEvents: "none"
    }
  }));
  if (marq) {
    const m0 = toS(marq.w0.x, marq.w0.z),
      m1 = toS(marq.w1.x, marq.w1.z),
      MQ = {
        x0: m0.x,
        y0: m0.y,
        x1: m1.x,
        y1: m1.y
      };
    if (marq.world && tool === "roof") {
      const R4 = [toW({
        x: MQ.x0,
        y: MQ.y0
      }), toW({
        x: MQ.x1,
        y: MQ.y0
      }), toW({
        x: MQ.x1,
        y: MQ.y1
      }), toW({
        x: MQ.x0,
        y: MQ.y1
      })];
      preview.push(React.createElement("polygon", {
        key: "mq",
        points: sPts(R4),
        fill: "rgba(22,163,74,.14)",
        stroke: "#16a34a",
        strokeWidth: 2.4
      }));
      edgeLabels(R4, "mqe", true);
    } else preview.push(React.createElement("rect", {
      key: "mq",
      x: Math.min(MQ.x0, MQ.x1),
      y: Math.min(MQ.y0, MQ.y1),
      width: Math.abs(MQ.x1 - MQ.x0),
      height: Math.abs(MQ.y1 - MQ.y0),
      fill: tool === "area" ? "rgba(245,158,11,.12)" : tool === "obs" ? "rgba(100,116,139,.25)" : "rgba(14,165,233,.12)",
      stroke: tool === "obs" ? "#334155" : "#0ea5e9",
      strokeWidth: 1.5,
      strokeDasharray: "5 4"
    }));
  }
  const handleEls = handles.map((h, i) => {
    const on = hover === "h:" + h.t + (h.i != null ? h.i : "");
    if (h.t === "rot" || h.t === "orot" || h.t === "prot") {
      return React.createElement("g", {
        key: "h" + i
      }, React.createElement("line", {
        x1: h.ax,
        y1: h.ay,
        x2: h.x,
        y2: h.y,
        stroke: "#f59e0b",
        strokeWidth: 1.6
      }), React.createElement("circle", {
        cx: h.x,
        cy: h.y,
        r: HR + (on ? 3 : 1),
        fill: "#f59e0b",
        stroke: "#fff",
        strokeWidth: 2.2
      }), React.createElement("path", {
        d: "M" + (h.x - 3.5) + " " + (h.y + 1) + "a3.6 3.6 0 1 1 1.4 2.6",
        fill: "none",
        stroke: "#fff",
        strokeWidth: 1.6,
        strokeLinecap: "round"
      }));
    }
    if (h.t === "side") return React.createElement("rect", {
      key: "h" + i,
      x: h.x - HR + 1,
      y: h.y - HR + 1,
      width: 2 * HR - 2,
      height: 2 * HR - 2,
      rx: 3,
      fill: on ? "#16a34a" : "#fff",
      stroke: "#16a34a",
      strokeWidth: 2.4
    });
    if (h.t === "mid") return React.createElement("circle", {
      key: "h" + i,
      cx: h.x,
      cy: h.y,
      r: on ? HR : HR - 2.5,
      fill: "rgba(255,255,255,.85)",
      stroke: "#16a34a",
      strokeWidth: 1.6,
      strokeDasharray: "2 2"
    });
    const isSelV = h.t === "vert" && selVert === h.i;
    return React.createElement("circle", {
      key: "h" + i,
      cx: h.x,
      cy: h.y,
      r: HR + (on || isSelV ? 2 : 0),
      fill: isSelV ? "#16a34a" : "#fff",
      stroke: h.t === "pscale" ? "#2563eb" : "#16a34a",
      strokeWidth: 2.4
    });
  });
  let cursor = "default";
  if (tool === "pan") cursor = gest.current && gest.current.type === "pan" ? "grabbing" : "grab";else if (tool === "roof" && !roofLock || tool === "meas" || tool === "obs" || tool === "area" || tool === "bg" && calib) cursor = "crosshair";
  if (hover && hover.indexOf("h:") === 0) cursor = /rot/.test(hover) ? "alias" : "move";else if (hover && tool === "select") cursor = "move";else if (hover && tool === "panel") cursor = "pointer";
  if (gest.current && gest.current.type === "pan" && gest.current.moved) cursor = "grabbing";
  const scaleBar = (() => {
    const nice = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
    const L = nice.find(n => n * V.s >= 70) || 500;
    return {
      L,
      px: L * V.s
    };
  })();
  const hint = (() => {
    if (view3d) return React.createElement("span", null, "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2B\u0E21\u0E38\u0E19\u0E14\u0E39\u0E23\u0E2D\u0E1A \xB7 \u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32\u0E25\u0E32\u0E01 = \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \xB7 \u0E25\u0E49\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C = \u0E0B\u0E39\u0E21 \xB7 \u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49\u0E14\u0E39\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E40\u0E07\u0E32 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E17\u0E35\u0E48 ", React.createElement("b", null, "\u0E1C\u0E31\u0E07 2D"));
    if (eavePick) return React.createElement("span", null, React.createElement("b", null, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E17\u0E32\u0E07\u0E25\u0E32\u0E14:"), " \u0E41\u0E15\u0E30\u0E02\u0E2D\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E33 (\u0E0A\u0E32\u0E22\u0E04\u0E32 \u2014 \u0E19\u0E49\u0E33\u0E44\u0E2B\u0E25\u0E25\u0E07\u0E17\u0E32\u0E07\u0E19\u0E35\u0E49) \xB7 ", React.createElement("kbd", null, "Esc"), " \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01");
    if (tool === "axis") {
      if (axisPts) return React.createElement("span", null, "\u0E25\u0E32\u0E01\u0E44\u0E1B\u0E15\u0E32\u0E21", React.createElement("b", null, "\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E35\u0E48\u0E22\u0E32\u0E27\u0E41\u0E25\u0E30\u0E15\u0E23\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14"), "\u0E43\u0E19\u0E20\u0E32\u0E1E \u0E41\u0E25\u0E49\u0E27\u0E04\u0E25\u0E34\u0E01\u0E1B\u0E25\u0E32\u0E22 \xB7 ", React.createElement("kbd", null, "Shift"), " = \u0E44\u0E21\u0E48\u0E14\u0E39\u0E14\u0E02\u0E2D\u0E1A");
      return React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32"), "\u0E43\u0E19\u0E20\u0E32\u0E1E \u2192 \u0E1C\u0E31\u0E07\u0E2B\u0E21\u0E38\u0E19\u0E43\u0E2B\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E23\u0E07\u0E08\u0E2D \u0E41\u0E19\u0E27\u0E14\u0E39\u0E14\u0E09\u0E32\u0E01\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21 \xB7 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 ", React.createElement("b", null, "\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"));
    }
    if (tool === "walk") {
      if (walkPts) return React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E08\u0E38\u0E14\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 ", React.createElement("kbd", null, "Enter"), "/\u0E14\u0E31\u0E1A\u0E40\u0E1A\u0E34\u0E25\u0E04\u0E25\u0E34\u0E01 = \u0E08\u0E1A \xB7 \u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E17\u0E31\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E40\u0E2D\u0E07");
      return React.createElement("span", null, React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E08\u0E38\u0E14"), "\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (\u0E01\u0E27\u0E49\u0E32\u0E07 ", walkW, " \u0E21.) \xB7 \u0E41\u0E15\u0E30\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E40\u0E14\u0E34\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49/\u0E25\u0E1A");
    }
    if (tool === "roof" && roofLock) return React.createElement("span", null, "\u0E41\u0E15\u0E30\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01/\u0E25\u0E32\u0E01\u0E22\u0E49\u0E32\u0E22 \xB7 \u0E08\u0E30\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E2B\u0E21\u0E48 \u0E01\u0E14 ", React.createElement("b", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E35\u0E01\u0E2B\u0E25\u0E31\u0E07"), " \u0E01\u0E48\u0E2D\u0E19");
    if (tool === "roof") {
      if (trace && trace.on) return trace.busy ? React.createElement("span", null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E32\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u2026") : trace.pts ? React.createElement("span", null, "\u0E44\u0E14\u0E49\u0E23\u0E39\u0E1B\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", trace.area, " \u0E15\u0E23.\u0E21. \u2014 ", React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D"), " \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \xB7 ", React.createElement("b", null, "Enter"), " \u0E43\u0E0A\u0E49\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49 \xB7 ", React.createElement("kbd", null, "Esc"), " \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01") : trace.err ? React.createElement("span", {
        style: {
          color: "#fde68a"
        }
      }, trace.err) : trace.mode === "color" ? React.createElement("span", null, React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E01\u0E25\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E"), " \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E25\u0E48\u0E2A\u0E35\u0E2B\u0E32\u0E02\u0E2D\u0E1A (\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2A\u0E35\u0E40\u0E23\u0E35\u0E22\u0E1A)") : React.createElement("span", null, React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E01\u0E25\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E34\u0E07\u0E2B\u0E32\u0E02\u0E2D\u0E1A 4 \u0E17\u0E34\u0E28\u0E15\u0E32\u0E21\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u2014 \u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E01\u0E31\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E38\u0E01\u0E2A\u0E35");
      if (roofOpt.kind === "facet") return !draw ? React.createElement("span", null, React.createElement("b", null, "\u0E27\u0E32\u0E14\u0E17\u0E35\u0E25\u0E30\u0E1C\u0E37\u0E19"), ": \u0E04\u0E25\u0E34\u0E01\u0E17\u0E35\u0E25\u0E30\u0E21\u0E38\u0E21\u0E02\u0E2D\u0E07\u0E1C\u0E37\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E1C\u0E37\u0E19 (\u0E2A\u0E32\u0E21\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21/\u0E04\u0E32\u0E07\u0E2B\u0E21\u0E39) \xB7 \u0E14\u0E39\u0E14\u0E15\u0E34\u0E14\u0E21\u0E38\u0E21\u0E41\u0E25\u0E30\u0E02\u0E2D\u0E1A\u0E1C\u0E37\u0E19\u0E02\u0E49\u0E32\u0E07 \u0E46 \u0E43\u0E2B\u0E49\u0E02\u0E2D\u0E1A\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E1E\u0E2D\u0E14\u0E35") : React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E21\u0E38\u0E21\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E04\u0E25\u0E34\u0E01\u0E08\u0E38\u0E14\u0E41\u0E23\u0E01/", React.createElement("kbd", null, "Enter"), " = \u0E1B\u0E34\u0E14\u0E1C\u0E37\u0E19 \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32\u0E43\u0E2B\u0E49 (\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E14\u0E49)");
      if (rectDraw) {
        if (!draw) return React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E17\u0E41\u0E22\u0E07"), " = \u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E15\u0E23\u0E07 \xB7 \u0E2B\u0E23\u0E37\u0E2D ", React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E21\u0E38\u0E21\u0E41\u0E23\u0E01"), " \u0E41\u0E25\u0E49\u0E27\u0E04\u0E25\u0E34\u0E01\u0E15\u0E32\u0E21\u0E41\u0E19\u0E27\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E (\u0E27\u0E32\u0E14\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E44\u0E14\u0E49)");
        if (draw.pts.length === 1) return React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E1B\u0E25\u0E32\u0E22\u0E02\u0E2D\u0E1A\u0E41\u0E23\u0E01 \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 = \u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27 (\u0E21.) \u0E41\u0E25\u0E49\u0E27 ", React.createElement("kbd", null, "Enter"));
        return React.createElement("span", null, "\u0E25\u0E32\u0E01\u0E2D\u0E2D\u0E01\u0E44\u0E1B\u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E25\u0E34\u0E01 \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 + ", React.createElement("kbd", null, "Enter"), " = \u0E01\u0E27\u0E49\u0E32\u0E07\u0E01\u0E35\u0E48\u0E40\u0E21\u0E15\u0E23");
      }
      if (!draw) return React.createElement("span", null, React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E17\u0E35\u0E25\u0E30\u0E21\u0E38\u0E21"), " \u0E15\u0E32\u0E21\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E \xB7 \u0E14\u0E39\u0E14\u0E15\u0E34\u0E14\u0E21\u0E38\u0E21/\u0E41\u0E19\u0E27\u0E09\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 (", React.createElement("kbd", null, "Shift"), " = \u0E27\u0E32\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30)");
      return React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E21\u0E38\u0E21\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 = \u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E02\u0E2D\u0E1A \xB7 ", React.createElement("kbd", null, "Enter"), "/\u0E04\u0E25\u0E34\u0E01\u0E08\u0E38\u0E14\u0E41\u0E23\u0E01 = \u0E1B\u0E34\u0E14\u0E23\u0E39\u0E1B \xB7 ", React.createElement("kbd", null, "\u232B"), " \u0E25\u0E1A\u0E21\u0E38\u0E21\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14");
    }
    if (tool === "panel") {
      if (!selRoof) return React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " = \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A \xB7 \u0E41\u0E15\u0E30\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 = \u0E40\u0E25\u0E37\u0E2D\u0E01");
      return React.createElement("span", null, React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07"), " = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21 \xB7 ", React.createElement("b", null, "Shift+\u0E41\u0E15\u0E30"), " = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E01\u0E25\u0E38\u0E48\u0E21 \xB7 ", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E41\u0E1C\u0E07"), " = \u0E22\u0E49\u0E32\u0E22 \xB7 ", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07"), " = \u0E27\u0E32\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 \xB7 ", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E04\u0E25\u0E38\u0E21\u0E41\u0E1C\u0E07"), " = \u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01", coarse ? " · สองนิ้ว = เลื่อน/ซูม" : " · คลิกขวาลาก = เลื่อนภาพ");
    }
    if (tool === "area") return React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A"), " \u0E04\u0E25\u0E38\u0E21\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 \u2014 \u0E43\u0E0A\u0E49\u0E0B\u0E39\u0E21\u0E41\u0E25\u0E30\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49");
    if (tool === "obs" && P3S_OBS_LINE[obsType]) return obsPts ? React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E08\u0E38\u0E14\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E15\u0E48\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E22\u0E32\u0E27 \xB7 ", React.createElement("kbd", null, "Enter"), "/\u0E14\u0E31\u0E1A\u0E40\u0E1A\u0E34\u0E25\u0E04\u0E25\u0E34\u0E01/\u0E41\u0E15\u0E30\u0E08\u0E38\u0E14\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E0B\u0E49\u0E33 = \u0E08\u0E1A \xB7 ", React.createElement("kbd", null, "\u232B"), " \u0E16\u0E2D\u0E22\u0E08\u0E38\u0E14") : React.createElement("span", null, "\u0E27\u0E32\u0E07", React.createElement("b", null, obsType === "rail" ? "ราวกันตก" : "ทางเดิน"), " \xB7 ", React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E17\u0E35\u0E25\u0E30\u0E08\u0E38\u0E14"), "\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2A\u0E49\u0E19 (\u0E14\u0E39\u0E14\u0E40\u0E02\u0E49\u0E32\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32)");
    if (tool === "obs" && obsType === "ladder") return React.createElement("span", null, "\u0E27\u0E32\u0E07", React.createElement("b", null, "\u0E1A\u0E31\u0E19\u0E44\u0E14\u0E25\u0E34\u0E07"), " \xB7 ", React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " \u2014 \u0E15\u0E34\u0E14\u0E0A\u0E34\u0E14\u0E1C\u0E19\u0E31\u0E07\u0E14\u0E49\u0E32\u0E19\u0E19\u0E2D\u0E01\u0E40\u0E2D\u0E07");
    if (tool === "obs") return React.createElement("span", null, "\u0E27\u0E32\u0E07", React.createElement("b", null, (P3S_OBS.find(x => x[0] === obsType) || P3S_OBS[0])[1]), " \xB7 ", React.createElement("b", null, "\u0E41\u0E15\u0E30"), " = \u0E02\u0E19\u0E32\u0E14\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 \xB7 ", React.createElement("b", null, "\u0E25\u0E32\u0E01"), " = \u0E15\u0E32\u0E21\u0E02\u0E19\u0E32\u0E14\u0E08\u0E23\u0E34\u0E07");
    if (tool === "meas") return measPts ? React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01\u0E08\u0E38\u0E14\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 ", React.createElement("kbd", null, "Enter"), "/\u0E14\u0E31\u0E1A\u0E40\u0E1A\u0E34\u0E25\u0E04\u0E25\u0E34\u0E01 = \u0E08\u0E1A\u0E40\u0E2A\u0E49\u0E19 \xB7 ", React.createElement("kbd", null, "\u232B"), " \u0E16\u0E2D\u0E22\u0E08\u0E38\u0E14") : React.createElement("span", null, React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E08\u0E38\u0E14"), " \u0E15\u0E32\u0E21\u0E41\u0E19\u0E27\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22/\u0E23\u0E32\u0E07 \u0E44\u0E14\u0E49\u0E23\u0E30\u0E22\u0E30\u0E08\u0E23\u0E34\u0E07\u0E44\u0E1B\u0E01\u0E23\u0E2D\u0E01 BOQ");
    if (tool === "bg") {
      if (calib) return calib.pts.length < 2 ? React.createElement("span", null, "\u0E04\u0E25\u0E34\u0E01 ", React.createElement("b", null, "2 \u0E08\u0E38\u0E14"), " \u0E1A\u0E19\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E23\u0E39\u0E49\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E08\u0E23\u0E34\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14\u0E21\u0E32)") : React.createElement("span", null, "\u0E01\u0E23\u0E2D\u0E01\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E08\u0E23\u0E34\u0E07\u0E43\u0E19\u0E41\u0E1C\u0E07\u0E14\u0E49\u0E32\u0E19\u0E02\u0E27\u0E32");
      return st.photo ? React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E23\u0E39\u0E1B"), " = \u0E22\u0E49\u0E32\u0E22 \xB7 \u0E08\u0E38\u0E14\u0E1F\u0E49\u0E32 = \u0E22\u0E48\u0E2D\u0E02\u0E22\u0E32\u0E22 \xB7 \u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21 = \u0E2B\u0E21\u0E38\u0E19 \u0E43\u0E2B\u0E49\u0E17\u0E31\u0E1A\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E1E\u0E2D\u0E14\u0E35") : React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E20\u0E32\u0E1E\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E14\u0E49\u0E32\u0E19\u0E02\u0E27\u0E32");
    }
    if (tool === "pan") return React.createElement("span", null, "\u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E1E \xB7 \u0E25\u0E49\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C = \u0E0B\u0E39\u0E21 \xB7 ", React.createElement("kbd", null, "F"), " = \u0E1E\u0E2D\u0E14\u0E35\u0E08\u0E2D");
    if (selRoof) return React.createElement("span", null, "\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 = \u0E22\u0E49\u0E32\u0E22 \xB7 \u0E08\u0E38\u0E14\u0E40\u0E02\u0E35\u0E22\u0E27 = \u0E25\u0E32\u0E01\u0E21\u0E38\u0E21 \xB7 \u0E08\u0E38\u0E14\u0E01\u0E25\u0E32\u0E07\u0E02\u0E2D\u0E1A = \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E38\u0E21 \xB7 \u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21 = \u0E2B\u0E21\u0E38\u0E19 \xB7 ", React.createElement("kbd", null, "Del"), " \u0E25\u0E1A \xB7 ", React.createElement("kbd", null, "Ctrl+Z"), " \u0E22\u0E49\u0E2D\u0E19");
    return React.createElement("span", null, "\u0E41\u0E15\u0E30\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01 \xB7 \u0E25\u0E32\u0E01\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07 = \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E1E \xB7 \u0E25\u0E49\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C = \u0E0B\u0E39\u0E21", coarse ? " · สองนิ้ว = ซูม" : "");
  })();
  const sun = Object.assign({}, st.sun, sunHour != null ? {
    hour: sunHour
  } : {});
  const roofCountOf = r => p3sCount(r);
  const setPanelModel = m => {
    const sys = Object.assign({}, st.sys || (typeof suBlankSys === "function" ? suBlankSys() : {}), {
      panelModel: m
    });
    const hit = (window.BOQ && window.BOQ.PANELS || []).find(x => x.model === m);
    const pW = hit && +hit.width > 0 ? +hit.width : 0,
      pL = hit && +hit.length > 0 ? +hit.length : 0;
    const patch = {
      sys,
      roofs: (st.roofs || []).map(r => Object.assign({}, r, {
        panelW: pW,
        panelL: pL
      })),
      panelW: pW,
      panelL: pL
    };
    if (hit && +hit.wp > 0) patch.wp = +hit.wp;
    commit(patch);
  };
  const onPickPhoto = async e => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    try {
      const url = await window.resizeImageFile(f, 1600, 0.82);
      const S = stRef.current,
        c = S.roofs && S.roofs.length ? p3sCentroid(roofs.map(r => p3sRoofCenter(r))) : {
          x: 0,
          z: 0
        };
      commit({
        photo: url,
        photoX: p3sR(c.x),
        photoZ: p3sR(c.z),
        photoRot: 0
      });
      setToolRaw("bg");
    } catch (err) {
      window.askConfirm({
        title: "โหลดรูปไม่สำเร็จ",
        body: err.message,
        ok: "ตกลง"
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  };
  const jobLatLng = p3ParseLatLng(job && job.map);
  const jobAddr = job ? [job.address, job.province].filter(Boolean).join(" ") : "";
  const onPickMap = res => {
    commit(s => Object.assign({}, s, {
      baseMap: {
        url: res.url,
        widthM: res.widthM,
        lat: res.lat,
        lng: res.lng,
        zoom: res.zoom
      },
      groundW: Math.max(20, Math.ceil(res.widthM)),
      sun: Object.assign({}, s.sun, {
        lat: res.lat,
        lng: res.lng
      })
    }));
    setMapOpen(false);
    setTimeout(() => {
      if (!(stRef.current.roofs || []).length) fitView();
    }, 0);
  };
  const card = (title, body, right) => React.createElement("div", {
    className: "p3s-card"
  }, title && React.createElement("div", {
    className: "p3s-h"
  }, React.createElement("span", {
    className: "t"
  }, title), right), body);
  const roofPanelBody = roof => {
    const n = roofCountOf(roof),
      isPoly = roof.kind === "poly",
      isDome = roof.kind === "dome";
    const kindTh = {
      poly: "ทรงอิสระ",
      rect: "เพิงแหงน",
      gable: "จั่ว",
      hip: "ปั้นหยา",
      dome: "ครึ่งวงกลม"
    }[roof.kind] || roof.kind;
    const pts = isPoly ? roof.pts || [] : [];
    const ph = isPoly ? p3PhOf(roof) : [];
    const eave = isPoly && ph.length ? Math.min.apply(null, ph) : +roof.h || 0;
    const pitchNow = isPoly ? p3sPolyPitch(roof) : +roof.pitch || 0;
    const lowIdx = isPoly ? roof.p3sLow != null ? +roof.p3sLow : (() => {
      let b = 0,
        bv = 1e9;
      pts.forEach((_, i) => {
        const v = ph[i] + ph[(i + 1) % pts.length];
        if (v < bv) {
          bv = v;
          b = i;
        }
      });
      return b;
    })() : 0;
    const area = isPoly && pts.length > 2 ? p3sR(p3Area(pts), 10) : null;
    const pan = (() => {
      try {
        return p3Panels(roof);
      } catch (e) {
        return null;
      }
    })();
    const blocksAll = pan ? pan.blocks || [] : [];
    const zSides = (pan && pan.faces || []).map(f => f.side).filter(Boolean),
      zNow = zoneOf(roof);
    const inZone = b => zNow === "all" || !b.face || b.face === zNow;
    const blocks = blocksAll.filter(inZone).length ? blocksAll.filter(inZone) : blocksAll;
    const zoneBs = r => zNow !== "all" && zSides.length > 1 ? p3sZoneSplit(r, zSides) : p3sBlkStore(r);
    const patchZone = (patch, key) => patchRoof(roof.id, r => ({
      blocks: zoneBs(r).map(b => inZone(b) ? Object.assign({}, b, patch) : b)
    }), key);
    const orient = blocks[0] ? blocks[0].orient : "portrait";
    const azTxt = az => p3sCompass(+az || 180);
    const setPolyPitch = (pitch, low, base) => {
      patchRoof(roof.id, r => {
        const lo = low == null ? lowIdx : low;
        const o = {
          ph: p3sPitchPh(r.pts, lo, base == null ? eave : base, pitch),
          p3sLow: lo,
          p3sPitch: pitch
        };
        if (low != null) o.p3sEaveFix = true;
        return o;
      }, "pitch");
      if (roof.p3sFacet) weldLive([roof.id], {
        pitch
      });
    };
    const weld = isPoly && (roof.p3sFacet || pitchNow > 0.4) ? (() => {
      try {
        return p3sWeldFacets(roofs, [roof.id]);
      } catch (e) {
        return null;
      }
    })() : null;
    const alignRotFor = (r, side) => {
      if (r.kind === "poly") {
        const P = r.pts || [],
          n = P.length;
        if (n > 2 && p3sPolyPitch(r) > 0.4) {
          const lo = r.p3sLow != null ? (+r.p3sLow % n + n) % n : lowIdx,
            a = P[lo],
            b = P[(lo + 1) % n];
          return p3sAlignRot(r, null, Math.atan2(b.z - a.z, b.x - a.x));
        }
        return p3sAlignRot(r, null, p3sLongEdgeAng(p3sFaces2D(r)[0].pts));
      }
      return p3sAlignRot(r, side, p3sLongEdgeAng(p3sOutline(r)));
    };
    const fillRoof = () => patchRoof(roof.id, r => {
      if (zNow !== "all" && !r.noPanel && zSides.length > 1) {
        const bs = p3sZoneSplit(r, zSides).filter(b => b.face !== zNow),
          b0 = blocks[0] || {};
        return {
          blocks: bs.concat([Object.assign(p3NewBlk(0), {
            orient,
            rot: +b0.rot || 0,
            face: zNow,
            gc: b0.gc || 0,
            gr: b0.gr || 0,
            gg: b0.gg || 0
          })])
        };
      }
      let rot = 0;
      if (r.kind === "poly") {
        const pl = p3PolyPlane(r);
        if (pl && (pl.tiltCos > 0.999 || p3sPolyPitch(r) > 0.4)) rot = alignRotFor(r);
      }
      return {
        blocks: p3sSplitAll(r, [Object.assign(p3NewBlk(0), {
          orient,
          rot
        })]),
        skips: {},
        noPanel: null
      };
    });
    const blkSide = i => {
      const rc = pan && (pan.rects || []).find(x => x.blk === i);
      return rc ? rc.side : null;
    };
    const rot0 = blocks[0] ? +blocks[0].rot || 0 : 0;
    const rotFit = blocks.length ? alignRotFor(roof, blkSide(0)) : 0;
    const rotSame = blocks.every(b => Math.abs((+b.rot || 0) - rot0) < 0.05);
    const rotOff = blocks.length && rotSame ? p3sR(rot0 - rotFit, 10) : 0;
    const rotAll = (v, key) => patchRoof(roof.id, r => {
      const b0 = zoneBs(r);
      return {
        blocks: p3sRotKeep(r, b0, b0.map(b => inZone(b) ? Object.assign({}, b, {
          rot: p3sR(v, 10)
        }) : b))
      };
    }, key);
    const alignAll = () => patchRoof(roof.id, r => {
      const b0 = zoneBs(r);
      return {
        blocks: p3sRotKeep(r, b0, b0.map((b, i) => inZone(b) ? Object.assign({}, b, {
          rot: alignRotFor(r, b.face || blkSide(i))
        }) : b))
      };
    });
    const sIdx = selIdxOf(roof);
    const rotSel = (f, key) => patchRoof(roof.id, r => {
      const b0 = p3sBlkStore(r),
        b1 = b0.slice();
      sIdx.forEach(i => {
        if (b1[i]) b1[i] = Object.assign({}, b1[i], {
          rot: p3sR(f(+b1[i].rot || 0, i), 10)
        });
      });
      return {
        blocks: p3sRotKeep(r, b0, b1)
      };
    }, key);
    const patchSel = (patch, key) => patchRoof(roof.id, r => {
      const bs = p3sBlkStore(r);
      sIdx.forEach(i => {
        if (bs[i]) bs[i] = Object.assign({}, bs[i], patch);
      });
      return {
        blocks: bs
      };
    }, key);
    const clearBlks = pick => patchRoof(roof.id, r => ({
      blocks: p3sPatchGroups(zoneBs(r).map((b, i) => pick(b, i) ? Object.assign({}, b, {
        patch: true,
        only: {},
        skips: {},
        adds: {}
      }) : b))
    }));
    const cntBy = {};
    (pan && pan.list || []).forEach(q => {
      if (!q.skip && !q.slot) cntBy[q.blk || 0] = (cntBy[q.blk || 0] || 0) + 1;
    });
    const allKeys = () => p3sQuads(roof).filter(q => !q.slot && (zNow === "all" || !q.side || q.side === zNow)).map(q => q.key);
    const blkSel = tool === "panel" && selBlk != null && blocksAll[selBlk] ? blocksAll[selBlk] : null;
    const rect = blkSel && pan ? (pan.rects || []).find(x => x.blk === selBlk) : null;
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "p3s-card"
    }, React.createElement("div", {
      className: "p3s-row",
      style: {
        justifyContent: "space-between"
      }
    }, React.createElement("span", {
      className: "p3s-ttl2"
    }, React.createElement(P3Icon, {
      name: "roof",
      size: 17
    }), roof.name || "หลังคา"), React.createElement("span", {
      className: "p3s-badge"
    }, kindTh)), roof.grp && React.createElement("span", {
      className: "p3s-note"
    }, "\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", roofs.filter(x => x.grp === roof.grp).length, " \u0E1C\u0E37\u0E19 \u2014 \u0E25\u0E32\u0E01\u0E1C\u0E37\u0E19\u0E44\u0E2B\u0E19\u0E01\u0E47\u0E22\u0E49\u0E32\u0E22\u0E44\u0E1B\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19"), !panOnly && React.createElement(React.Fragment, null, React.createElement(P3SText, {
      label: "\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
      value: roof.name,
      onChange: v => patchRoof(roof.id, {
        name: v
      }, "name")
    }), !isDome && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E17\u0E23\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32", React.createElement("i", null, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E14\u0E49 \u0E04\u0E07\u0E23\u0E2D\u0E22\u0E40\u0E17\u0E49\u0E32\u0E40\u0E14\u0E34\u0E21")), React.createElement(P3SSeg, {
      full: true,
      value: isPoly ? pitchNow > 0.4 ? "shed" : "flat" : roof.kind === "rect" ? "shed" : roof.kind,
      onChange: v => convertRoof(roof, v),
      options: [["flat", "ราบ"], ["shed", "เพิง"], ["gable", "จั่ว"], ["hip", "ปั้นหยา"]]
    })), (roof.kind === "gable" || roof.kind === "hip" || roof.kind === "rect" || isPoly && pitchNow > 0.4) && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19\u0E14\u0E48\u0E27\u0E19"), React.createElement("div", {
      className: "p3s-row",
      style: {
        gap: 5
      }
    }, [5, 10, 15, 20, 25, 30].map(d => React.createElement("button", {
      key: d,
      className: "p3s-btn" + (Math.round(pitchNow) === d ? " pri" : ""),
      style: {
        flex: 1,
        padding: 0,
        height: 32,
        fontSize: 12
      },
      onClick: () => isPoly ? setPolyPitch(d) : patchRoof(roof.id, {
        pitch: d
      })
    }, d, "\xB0")))), (roof.kind === "gable" || roof.kind === "hip") && React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => patchRoof(roof.id, r => r.kind === "gable" ? {
        ridge: r.span,
        span: r.ridge,
        az: p3sR(((+r.az || 180) + 90) % 360, 10)
      } : {
        w: r.d,
        d: r.w,
        az: p3sR(((+r.az || 180) + 90) % 360, 10)
      })
    }, React.createElement(P3SIcon, {
      name: "rotate",
      size: 15
    }), "\u0E2A\u0E25\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), isPoly && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "p3s-g2"
    }, React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
      unit: "\u0E21.",
      step: 0.1,
      min: 0,
      max: 60,
      digits: 2,
      value: eave,
      onChange: v => patchRoof(roof.id, r => {
        const d = v - eave;
        return {
          ph: p3PhOf(r).map(x => p3sR(x + d))
        };
      }, "eave")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19",
      unit: "\xB0",
      step: 1,
      min: 0,
      max: 45,
      digits: 1,
      value: pitchNow,
      onChange: v => setPolyPitch(v)
    })), pitchNow > 0.4 && React.createElement("label", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E25\u0E32\u0E14\u0E25\u0E07\u0E17\u0E32\u0E07 (\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32)"), React.createElement("span", {
      className: "p3s-well"
    }, React.createElement("select", {
      value: lowIdx,
      onChange: e => setPolyPitch(pitchNow || 10, +e.target.value)
    }, pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length];
      return React.createElement("option", {
        key: i,
        value: i
      }, "\u0E02\u0E2D\u0E1A ", i + 1, " \xB7 \u0E2B\u0E31\u0E19\u0E17\u0E34\u0E28", p3sCompass(p3sEdgeBearing(pts, i)), " \xB7 ", p3sR(Math.hypot(q.x - p.x, q.z - p.z), 10), " \u0E21.");
    })))), pitchNow <= 0.4 && React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => setPolyPitch(10, p3sSouthEdge(pts))
    }, "\u0E17\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E40\u0E1E\u0E34\u0E07 \u0E25\u0E32\u0E14\u0E25\u0E07\u0E17\u0E34\u0E28\u0E43\u0E15\u0E49 10\xB0"), weld && weld.n > 1 && (weld.gap > 0.03 ? React.createElement("button", {
      className: "p3s-btn wide pri",
      onClick: () => weldNow(roof)
    }, React.createElement(P3SIcon, {
      name: "magic",
      size: 15
    }), "\u0E08\u0E31\u0E14\u0E17\u0E23\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E07 ", weld.n, " \u0E1C\u0E37\u0E19 (\u0E22\u0E31\u0E07\u0E40\u0E1E\u0E35\u0E49\u0E22\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ", Math.round(weld.gap * 100), " \u0E0B\u0E21.)") : React.createElement("span", {
      className: "p3s-badge ok",
      style: {
        height: "auto",
        padding: "5px 10px",
        whiteSpace: "normal"
      }
    }, "\u0E15\u0E48\u0E2D\u0E2A\u0E19\u0E34\u0E17\u0E01\u0E31\u0E1A\u0E1C\u0E37\u0E19\u0E02\u0E49\u0E32\u0E07 \u0E46 \u0E41\u0E25\u0E49\u0E27 \xB7 \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E07 ", weld.n, " \u0E1C\u0E37\u0E19", roof.p3sFacet ? " · ลากมุม/เปลี่ยนความชัน เชื่อมให้เอง" : "")), pitchNow > 0.4 && React.createElement("button", {
      className: "p3s-btn wide" + (eavePick ? " pri" : ""),
      onClick: () => setEavePick(v => !v)
    }, React.createElement(P3SIcon, {
      name: "target",
      size: 15
    }), eavePick ? "แตะขอบชายคาบนผัง… (Esc ยกเลิก)" : "แตะเลือกขอบชายคาบนผัง"), React.createElement("div", {
      className: "p3s-stat"
    }, React.createElement("div", null, React.createElement("div", {
      className: "l"
    }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E1C\u0E31\u0E07"), React.createElement("div", {
      className: "v"
    }, area, React.createElement("small", {
      style: {
        fontSize: 10
      }
    }, " \u0E15\u0E23.\u0E21."))), React.createElement("div", null, React.createElement("div", {
      className: "l"
    }, "\u0E21\u0E38\u0E21"), React.createElement("div", {
      className: "v"
    }, pts.length)), React.createElement("div", null, React.createElement("div", {
      className: "l"
    }, "\u0E41\u0E1C\u0E07"), React.createElement("div", {
      className: "v"
    }, n))), selVert != null && pts.length > 3 && React.createElement("button", {
      className: "p3s-btn wide dngr",
      onClick: delSelected
    }, React.createElement(P3Icon, {
      name: "trash"
    }), "\u0E25\u0E1A\u0E21\u0E38\u0E21\u0E17\u0E35\u0E48 ", selVert + 1), React.createElement("span", {
      className: "p3s-note"
    }, "\u0E25\u0E32\u0E01\u0E08\u0E38\u0E14\u0E40\u0E02\u0E35\u0E22\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E21\u0E38\u0E21 \xB7 \u0E25\u0E32\u0E01\u0E08\u0E38\u0E14\u0E01\u0E25\u0E32\u0E07\u0E02\u0E2D\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E38\u0E21 \xB7 \u0E14\u0E39\u0E14\u0E15\u0E34\u0E14\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E02\u0E49\u0E32\u0E07 \u0E46 \u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07"))), roof.kind === "rect" && !panOnly && React.createElement("div", {
      className: "p3s-g2"
    }, React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
      unit: "\u0E21.",
      step: 0.1,
      min: 0.5,
      value: roof.w,
      onChange: v => patchRoof(roof.id, {
        w: v
      }, "w")
    }), React.createElement(P3SNum, {
      label: "\u0E22\u0E32\u0E27\u0E15\u0E32\u0E21\u0E25\u0E32\u0E14",
      unit: "\u0E21.",
      step: 0.1,
      min: 0.5,
      value: roof.d,
      onChange: v => patchRoof(roof.id, {
        d: v
      }, "d")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19",
      unit: "\xB0",
      step: 1,
      min: 0,
      max: 60,
      digits: 1,
      value: roof.pitch,
      onChange: v => patchRoof(roof.id, {
        pitch: v
      }, "pitch")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
      unit: "\u0E21.",
      step: 0.1,
      min: 0,
      value: roof.h,
      onChange: v => patchRoof(roof.id, {
        h: v
      }, "h")
    })), roof.kind === "gable" && React.createElement(React.Fragment, null, !panOnly && React.createElement("div", {
      className: "p3s-g2"
    }, React.createElement(P3SNum, {
      label: "\u0E22\u0E32\u0E27\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E19",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.ridge,
      onChange: v => patchRoof(roof.id, {
        ridge: v
      }, "ridge")
    }), React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E08\u0E31\u0E48\u0E27",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.span,
      onChange: v => patchRoof(roof.id, {
        span: v
      }, "span")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19",
      unit: "\xB0",
      step: 1,
      min: 0,
      max: 60,
      digits: 1,
      value: roof.pitch,
      onChange: v => patchRoof(roof.id, {
        pitch: v
      }, "pitch")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
      unit: "\u0E21.",
      step: 0.1,
      min: 0,
      value: roof.h,
      onChange: v => patchRoof(roof.id, {
        h: v
      }, "h")
    })), !noPanUI && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E14\u0E49\u0E32\u0E19"), React.createElement(P3SSeg, {
      full: true,
      value: (roof.sideA !== false ? "A" : "") + (roof.sideB !== false ? "B" : ""),
      onChange: v => patchRoof(roof.id, r => p3sSideFix(r, {
        sideA: v.indexOf("A") >= 0,
        sideB: v.indexOf("B") >= 0
      })),
      options: [["AB", "ทั้งสองด้าน"], ["A", "ด้าน A (" + azTxt(roof.az) + ")"], ["B", "ด้าน B (" + p3sCompass((+roof.az || 180) + 180) + ")"]]
    }))), roof.kind === "hip" && React.createElement(React.Fragment, null, !panOnly && React.createElement("div", {
      className: "p3s-g2"
    }, React.createElement(P3SNum, {
      label: "\u0E22\u0E32\u0E27",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.w,
      onChange: v => patchRoof(roof.id, {
        w: v
      }, "w")
    }), React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.d,
      onChange: v => patchRoof(roof.id, {
        d: v
      }, "d")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19",
      unit: "\xB0",
      step: 1,
      min: 0,
      max: 60,
      digits: 1,
      value: roof.pitch,
      onChange: v => patchRoof(roof.id, {
        pitch: v
      }, "pitch")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
      unit: "\u0E21.",
      step: 0.1,
      min: 0,
      value: roof.h,
      onChange: v => patchRoof(roof.id, {
        h: v
      }, "h")
    })), !noPanUI && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E14\u0E49\u0E32\u0E19 (\u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14/\u0E1B\u0E34\u0E14)"), React.createElement("div", {
      className: "p3s-row"
    }, [["A", 0], ["B", 180], ["C", 90], ["D", -90]].map(([sd, off]) => {
      const on = sd === "A" || sd === "B" ? roof["side" + sd] !== false : roof["side" + sd] === true;
      return React.createElement("button", {
        key: sd,
        className: "p3s-btn" + (on ? " pri" : ""),
        style: {
          flex: 1
        },
        onClick: () => {
          const o = {};
          o["side" + sd] = !on;
          patchRoof(roof.id, r => p3sSideFix(r, o));
        }
      }, sd, " \xB7 ", p3sCompass((+roof.az || 180) + off));
    })))), isDome && !panOnly && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "p3s-g2"
    }, React.createElement(P3SNum, {
      label: "\u0E22\u0E32\u0E27",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.ridge,
      onChange: v => patchRoof(roof.id, {
        ridge: v
      }, "ridge")
    }), React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
      unit: "\u0E21.",
      step: 0.1,
      min: 1,
      value: roof.span,
      onChange: v => patchRoof(roof.id, {
        span: v
      }, "span")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E42\u0E04\u0E49\u0E07",
      unit: "\u0E21.",
      step: 0.1,
      min: 0.2,
      value: roof.rise,
      onChange: v => patchRoof(roof.id, {
        rise: v
      }, "rise")
    }), React.createElement(P3SNum, {
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
      unit: "\u0E21.",
      step: 0.1,
      min: 0,
      value: roof.h,
      onChange: v => patchRoof(roof.id, {
        h: v
      }, "h")
    })), React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => patchRoof(roof.id, r => {
        const sp0 = +r.span || 10,
          sp1 = +r.ridge || 12,
          rs = +r.rise || sp0 / 2;
        return {
          ridge: sp0,
          span: sp1,
          rise: p3sR(Math.min(sp1 / 2, rs * sp1 / sp0)),
          az: p3sR(((+r.az || 180) + 90) % 360, 10)
        };
      })
    }, React.createElement(P3SIcon, {
      name: "rotate",
      size: 15
    }), "\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E42\u0E04\u0E49\u0E07 (\u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E01\u0E27\u0E49\u0E32\u0E07/\u0E22\u0E32\u0E27)"), React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E42\u0E04\u0E49\u0E07\u0E14\u0E48\u0E27\u0E19"), React.createElement("div", {
      className: "p3s-row",
      style: {
        gap: 5
      }
    }, [["ครึ่งวงกลม", 2], ["1/3", 3], ["1/4", 4], ["1/6", 6]].map(([lb, k]) => {
      const v = p3sR((+roof.span || 10) / k);
      return React.createElement("button", {
        key: k,
        className: "p3s-btn" + (Math.abs((+roof.rise || 0) - v) < 0.02 ? " pri" : ""),
        style: {
          flex: 1,
          padding: 0,
          height: 32,
          fontSize: 12
        },
        onClick: () => patchRoof(roof.id, {
          rise: v
        })
      }, lb);
    }))), React.createElement("span", {
      className: "p3s-note"
    }, "\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30\u0E1A\u0E19\u0E1C\u0E31\u0E07 = \u0E41\u0E19\u0E27\u0E42\u0E04\u0E49\u0E07 (\u0E0A\u0E34\u0E14\u0E01\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E1A) \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E49\u0E21 = \u0E2A\u0E31\u0E19\u0E42\u0E04\u0E49\u0E07")), !isPoly && !panOnly && React.createElement("span", {
      className: "p3s-note keep"
    }, "\u0E2B\u0E31\u0E19\u0E17\u0E34\u0E28", azTxt(roof.az), " (", p3sR(+roof.az || 180, 1), "\xB0) \xB7 \u0E25\u0E32\u0E01\u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21\u0E1A\u0E19\u0E1C\u0E31\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2B\u0E21\u0E38\u0E19"), !wiz && React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => axisFromRoof(roof)
    }, React.createElement(P3SIcon, {
      name: "axis",
      size: 15
    }), "\u0E43\u0E0A\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E19\u0E27\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07"), panOnly && React.createElement("span", {
      className: "p3s-note"
    }, "\u0E02\u0E31\u0E49\u0E19\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E41\u0E01\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E08\u0E30\u0E41\u0E01\u0E49\u0E02\u0E19\u0E32\u0E14/\u0E17\u0E23\u0E07/\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19 \u0E01\u0E14\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E02\u0E31\u0E49\u0E19 \"\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\""), !panOnly && React.createElement("div", {
      className: "p3s-row"
    }, React.createElement("button", {
      className: "p3s-btn",
      style: {
        flex: 1
      },
      onClick: duplicate
    }, React.createElement(P3SIcon, {
      name: "copy",
      size: 15
    }), "\u0E17\u0E33\u0E0B\u0E49\u0E33"), React.createElement("button", {
      className: "p3s-btn dngr",
      style: {
        flex: 1
      },
      onClick: () => {
        setSelVert(null);
        const id = roof.id;
        commit(s => Object.assign({}, s, {
          roofs: s.roofs.filter(x => x.id !== id)
        }));
        setSel(null);
      }
    }, React.createElement(P3Icon, {
      name: "trash"
    }), "\u0E25\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"))), !noPanUI && (() => {
      const multiZ = zSides.length > 1 && !roof.noPanel,
        zTxt = multiZ && zNow !== "all" ? "โซน " + zNow : "หลังคานี้";
      const B0 = blocks[0] || {},
        wOn = (B0.gc > 0 || B0.gr > 0) && B0.gg > 0;
      const preset = (gc, gr, gg) => patchZone({
        gc,
        gr,
        gg,
        adds: {}
      });
      const hasSkip = blocks.some(b => !b.patch && Object.keys(b.skips || {}).length);
      const nZ = multiZ && zNow !== "all" ? pan["count" + zNow] || 0 : n;
      return React.createElement("div", {
        className: "p3s-card"
      }, React.createElement("div", {
        className: "p3s-h"
      }, React.createElement("span", {
        className: "t"
      }, "\u0E41\u0E1C\u0E07\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E19\u0E35\u0E49"), roof.noPanel || !n ? React.createElement("span", {
        className: "p3s-badge warn"
      }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07") : React.createElement("span", {
        className: "p3s-badge ok"
      }, n, " \u0E41\u0E1C\u0E07 \xB7 ", p3sR(n * (+st.wp || 650) / 1000, 100), " kWp")), multiZ && React.createElement("div", {
        className: "p3s-fld"
      }, React.createElement("span", {
        className: "lb"
      }, "\u0E04\u0E48\u0E32\u0E43\u0E19\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A"), React.createElement(P3SSeg, {
        full: true,
        value: zNow,
        onChange: setZoneSel,
        options: [["all", "ทั้งหลังคา"]].concat(zSides.map(s => [s, "โซน " + s + " · " + (pan["count" + s] || 0)]))
      })), (roof.noPanel || !n) && React.createElement("span", {
        className: "p3s-note"
      }, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " = \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A \xB7 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E15\u0E47\u0E21\u0E17\u0E31\u0E49\u0E07\u0E1C\u0E37\u0E19"), React.createElement("button", {
        className: "p3s-btn pri big wide",
        onClick: fillRoof
      }, React.createElement(P3SIcon, {
        name: "magic",
        size: 17
      }), roof.noPanel ? "วางแผงเต็มหลังคา" : "วางแผงเต็ม" + zTxt), React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement("div", {
        className: "p3s-fld"
      }, React.createElement("span", {
        className: "lb"
      }, "\u0E41\u0E1C\u0E07\u0E27\u0E32\u0E07"), React.createElement(P3SSeg, {
        full: true,
        value: orient,
        onChange: v => patchZone({
          orient: v
        }),
        options: [["portrait", "ตั้ง"], ["landscape", "นอน"]]
      })), React.createElement(P3SNum, {
        label: "\u0E40\u0E27\u0E49\u0E19\u0E08\u0E32\u0E01\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
        unit: "\u0E21.",
        step: 0.05,
        min: 0,
        max: 5,
        value: +roof.margin || 0,
        onChange: v => patchRoof(roof.id, {
          margin: v
        }, "margin")
      })), React.createElement("div", {
        className: "p3s-fld",
        style: {
          gap: 8
        }
      }, React.createElement("span", {
        className: "lb"
      }, "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E41\u0E1C\u0E07", multiZ && zNow !== "all" ? " (โซน " + zNow + ")" : ""), React.createElement(P3SSeg, {
        full: true,
        value: wOn ? "on" : "off",
        onChange: v => v === "on" ? !wOn && preset(10, 2, 0.6) : preset(0, 0, 0),
        options: [["off", "ไม่มีทางเดิน"], ["on", "มีทางเดิน"]]
      }), wOn && React.createElement(React.Fragment, null, React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement(P3SNum, {
        label: "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E04\u0E31\u0E48\u0E19\u0E17\u0E38\u0E01 \u0E46",
        unit: "\u0E41\u0E1C\u0E07",
        step: 1,
        min: 0,
        max: 200,
        digits: 0,
        value: B0.gc || 0,
        onChange: v => patchZone({
          gc: Math.round(v),
          adds: {}
        }, "gc")
      }), React.createElement(P3SNum, {
        label: "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E02\u0E27\u0E32\u0E07\u0E17\u0E38\u0E01 \u0E46",
        unit: "\u0E41\u0E16\u0E27",
        step: 1,
        min: 0,
        max: 200,
        digits: 0,
        value: B0.gr || 0,
        onChange: v => patchZone({
          gr: Math.round(v),
          adds: {}
        }, "gr")
      }), React.createElement(P3SNum, {
        label: "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E01\u0E27\u0E49\u0E32\u0E07",
        unit: "\u0E21.",
        step: 0.1,
        min: 0,
        max: 5,
        value: B0.gg || 0,
        onChange: v => patchZone({
          gg: v,
          adds: {}
        }, "gg")
      })), React.createElement("span", {
        className: "p3s-note"
      }, "0 = \u0E44\u0E21\u0E48\u0E40\u0E27\u0E49\u0E19\u0E43\u0E19\u0E41\u0E19\u0E27\u0E19\u0E31\u0E49\u0E19")), !wiz && React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => {
          setTool("walk");
          setSel({
            t: "roof",
            id: roof.id
          });
        }
      }, React.createElement(P3SIcon, {
        name: "walk",
        size: 15
      }), "\u0E27\u0E32\u0E14\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E40\u0E2D\u0E07 (W)", (roof.walks || []).length ? " · มี " + roof.walks.length + " เส้น" : "")), hasSkip && React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => patchZone({
          skips: {}
        })
      }, "\u0E04\u0E37\u0E19\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E34\u0E14\u0E44\u0E27\u0E49\u0E17\u0E38\u0E01\u0E41\u0E1C\u0E48\u0E19", zTxt !== "หลังคานี้" ? " (" + zTxt + ")" : ""), !roof.noPanel && nZ > 0 && React.createElement("button", {
        className: "p3s-btn dngr wide",
        onClick: () => {
          if (zTxt === "หลังคานี้") patchRoof(roof.id, {
            noPanel: true
          });else clearBlks(b => inZone(b));
          setSelBlk(null);
        }
      }, React.createElement(P3Icon, {
        name: "trash"
      }), "\u0E25\u0E1A\u0E41\u0E1C\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E1A\u0E19", zTxt, " (", nZ, " \u0E41\u0E1C\u0E07)"), tool !== "panel" && React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => setTool("panel")
      }, React.createElement(P3SIcon, {
        name: "panel",
        size: 16
      }), "\u0E08\u0E31\u0E14\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E25\u0E30\u0E41\u0E1C\u0E48\u0E19 / \u0E22\u0E49\u0E32\u0E22\u0E01\u0E25\u0E38\u0E48\u0E21\u0E41\u0E1C\u0E07 (P)"));
    })(), tool === "panel" && !roof.noPanel && n > 0 && (() => {
      const nSel = sIdx.reduce((t, i) => t + (cntBy[i] || 0), 0),
        nG = sIdx.length;
      return React.createElement("div", {
        className: "p3s-card"
      }, React.createElement("div", {
        className: "p3s-h"
      }, React.createElement("span", {
        className: "t"
      }, !blkSel ? "กลุ่มแผง" : nG > 1 ? "เลือก " + nG + " กลุ่ม" : "กลุ่มแผงที่เลือก"), blkSel && React.createElement("span", {
        className: "p3s-badge warn"
      }, nSel, " \u0E41\u0E1C\u0E07", nG === 1 && blkSel.face && zSides.length > 1 ? " · โซน " + blkSel.face : "")), !blkSel && React.createElement("span", {
        className: "p3s-note"
      }, React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E1A\u0E19\u0E1C\u0E31\u0E07"), " = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21 (\u0E41\u0E1C\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E35\u0E1F\u0E49\u0E32) \u0E41\u0E25\u0E49\u0E27\u0E2B\u0E21\u0E38\u0E19/\u0E25\u0E1A\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48 \xB7 ", React.createElement("b", null, "Shift+\u0E41\u0E15\u0E30"), " = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E01\u0E25\u0E38\u0E48\u0E21 \u0E2B\u0E21\u0E38\u0E19/\u0E22\u0E49\u0E32\u0E22\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19"), blkSel && React.createElement(React.Fragment, null, React.createElement("span", {
        className: "p3s-note"
      }, nG > 1 ? "ค่าด้านล่างแก้ทุกกลุ่มที่เลือก (สีฟ้า) · ลากแผงกลุ่มใดก็ย้ายไปด้วยกัน · Shift+แตะ = ถอดออกจากที่เลือก" : "ค่าด้านล่างแก้เฉพาะกลุ่มนี้ (สีฟ้า) · Shift+แตะกลุ่มอื่น = เลือกเพิ่ม"), React.createElement(P3SRange, {
        label: nG > 1 ? "หมุน " + nG + " กลุ่มที่เลือก" : "หมุนกลุ่มนี้",
        right: p3sR(blkSel.rot, 10) + "°",
        min: -90,
        max: 90,
        step: 0.5,
        value: blkSel.rot,
        onChange: v => rotSel(() => v, "rot")
      }), React.createElement("div", {
        className: "p3s-row",
        style: {
          gap: 6,
          flexWrap: "nowrap",
          alignItems: "flex-end"
        }
      }, React.createElement("div", {
        style: {
          flex: "1 1 0",
          minWidth: 0
        }
      }, React.createElement(P3SNum, {
        unit: "\u0E2D\u0E07\u0E28\u0E32",
        step: 1,
        min: -90,
        max: 90,
        digits: 1,
        value: p3sR(blkSel.rot, 10),
        onChange: v => {
          const d = v - (+blkSel.rot || 0);
          rotSel(x => x + d, "rot");
        }
      })), React.createElement("button", {
        className: "p3s-btn",
        style: {
          flex: "0 0 auto",
          padding: "0 10px",
          height: 42,
          whiteSpace: "nowrap"
        },
        title: "\u0E2B\u0E21\u0E38\u0E19\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
        onClick: () => rotSel((v, i) => alignRotFor(roof, blkSide(i)))
      }, React.createElement(P3SIcon, {
        name: "align",
        size: 15
      }), "\u0E15\u0E23\u0E07\u0E02\u0E2D\u0E1A")), !blkSel.patch && React.createElement(React.Fragment, null, React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement(P3SNum, {
        label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E16\u0E27",
        auto: "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
        step: 1,
        min: 0,
        max: 200,
        digits: 0,
        value: blkSel.rows || (rect ? rect.rows : 0),
        onChange: v => patchBlk(roof, selBlk, {
          rows: Math.round(v)
        }, "rows")
      }), React.createElement(P3SNum, {
        label: "\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E41\u0E16\u0E27",
        auto: "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
        step: 1,
        min: 0,
        max: 400,
        digits: 0,
        value: blkSel.cols || (rect ? rect.cols : 0),
        onChange: v => patchBlk(roof, selBlk, {
          cols: Math.round(v)
        }, "cols")
      })), (blkSel.rows > 0 || blkSel.cols > 0) && React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => patchBlk(roof, selBlk, {
          rows: 0,
          cols: 0
        })
      }, "\u0E43\u0E2B\u0E49\u0E40\u0E15\u0E47\u0E21\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => patchBlk(roof, selBlk, {
          du: 0,
          dv: 0,
          rot: 0
        })
      }, React.createElement(P3Icon, {
        name: "reset"
      }), "\u0E04\u0E37\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E14\u0E34\u0E21"), React.createElement("label", {
        className: "p3s-row",
        style: {
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer"
        }
      }, React.createElement("input", {
        type: "checkbox",
        checked: !!blkSel.keep,
        onChange: e => patchBlk(roof, selBlk, {
          keep: e.target.checked
        })
      }), "\u0E08\u0E31\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E40\u0E15\u0E47\u0E21\u0E41\u0E16\u0E27 (\u0E44\u0E21\u0E48\u0E15\u0E31\u0E14\u0E15\u0E32\u0E21\u0E02\u0E2D\u0E1A)")), React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement(P3SNum, {
        label: "\u0E02\u0E32\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2D\u0E35\u0E22\u0E07",
        unit: "\xB0",
        step: 1,
        min: 0,
        max: 60,
        digits: 0,
        value: blkSel.tilt,
        onChange: v => patchSel({
          tilt: v
        }, "tilt")
      }), React.createElement(P3SNum, {
        label: "\u0E0A\u0E48\u0E2D\u0E07\u0E2B\u0E48\u0E32\u0E07\u0E41\u0E1C\u0E07",
        unit: "\u0E0B\u0E21.",
        step: 1,
        min: 0,
        max: 200,
        digits: 0,
        value: p3sR(blkSel.gap * 100, 1),
        onChange: v => patchSel({
          gap: v / 100
        }, "gap")
      })), React.createElement("button", {
        className: "p3s-btn wide dngr",
        onClick: () => {
          const js = sIdx;
          patchRoof(roof.id, r => ({
            blocks: p3sPatchGroups(p3sBlkStore(r).map((b, i) => js.indexOf(i) >= 0 ? Object.assign({}, b, {
              patch: true,
              only: {},
              skips: {},
              adds: {}
            }) : b))
          }));
          setSelBlk(null);
        }
      }, React.createElement(P3Icon, {
        name: "trash"
      }), nG > 1 ? "ลบ " + nG + " กลุ่มที่เลือก" : "ลบกลุ่มนี้", " (", nSel, " \u0E41\u0E1C\u0E07)"), React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => setSelBlk(null)
      }, "\u0E40\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E2D\u0E01")), !wiz && React.createElement("button", {
        className: "p3s-btn wide",
        onClick: () => {
          patchRoof(roof.id, r => ({
            blocks: p3sBlkStore(r).concat([Object.assign(p3NewBlk(0), {
              orient,
              rows: 2,
              cols: 4,
              face: zNow !== "all" && blocksAll.some(b => b.face) ? zNow : null
            })])
          }));
          setSelBlk(blocksAll.length);
        }
      }, React.createElement(P3Icon, {
        name: "plus"
      }), "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E38\u0E14\u0E41\u0E1C\u0E07\u0E2D\u0E35\u0E01\u0E0A\u0E38\u0E14"), wiz && React.createElement("span", {
        className: "p3s-note"
      }, "\u0E08\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E01\u0E25\u0E38\u0E48\u0E21 = \u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E23\u0E07\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07 (\u0E2B\u0E48\u0E32\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E14\u0E34\u0E21 = \u0E01\u0E25\u0E38\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48 \xB7 \u0E0A\u0E34\u0E14\u0E01\u0E31\u0E19 = \u0E15\u0E48\u0E2D\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E14\u0E34\u0E21)"));
    })());
  };
  const obsPanelBody = o => React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("div", {
    className: "p3s-row",
    style: {
      justifyContent: "space-between"
    }
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3Icon, {
    name: o.kind === "tree" ? "tree" : "box",
    size: 17
  }), p3sObsName(o))), P3S_OBS_LINE[p3sObsType(o)] || p3sObsType(o) === "ladder" ? (() => {
    const T = p3sObsType(o);
    return React.createElement("div", {
      className: "p3s-g2"
    }, T === "pipe" && React.createElement("label", {
      className: "p3s-fld",
      style: {
        gridColumn: "1 / -1"
      }
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E48\u0E2D PPR"), React.createElement("div", {
      className: "p3s-seg full"
    }, P3S_PIPE_D.map(([v, lb]) => React.createElement("button", {
      key: v,
      type: "button",
      "data-on": Math.abs((+o.d || 0.025) - v) < 0.001 ? "1" : "0",
      onClick: () => patchObs(o.id, {
        d: v
      }, "od")
    }, lb.split(" (")[0])))), T === "tray" && React.createElement("label", {
      className: "p3s-fld",
      style: {
        gridColumn: "1 / -1"
      }
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E32\u0E07"), React.createElement("div", {
      className: "p3s-seg full"
    }, P3S_TRAY_W.map(([v, lb]) => React.createElement("button", {
      key: v,
      type: "button",
      "data-on": Math.abs((+o.d || 0.1) - v) < 0.001 ? "1" : "0",
      onClick: () => patchObs(o.id, {
        d: v
      }, "od")
    }, lb)))), T === "tray" && React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E32\u0E07 (\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07)",
      unit: "\u0E0B\u0E21.",
      step: 5,
      min: 5,
      max: 100,
      digits: 0,
      value: Math.round((+o.d || 0.1) * 100),
      onChange: v => patchObs(o.id, {
        d: Math.max(0.05, Math.min(1, v / 100))
      }, "od")
    }), (T === "walkway" || T === "sky") && React.createElement(P3SNum, {
      label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
      unit: "\u0E21.",
      step: 0.05,
      min: 0.2,
      value: o.d,
      onChange: v => patchObs(o.id, {
        d: v
      }, "od")
    }), T !== "walkway" && T !== "sky" && T !== "pipe" && T !== "tray" && React.createElement(P3SNum, {
      label: T === "ladder" ? "สูง (ถ้าไม่ชิดหลังคา)" : "ราวสูง",
      unit: "\u0E21.",
      step: 0.1,
      min: 0.6,
      value: o.h,
      onChange: v => patchObs(o.id, {
        h: v
      }, "oh")
    }), T !== "ladder" && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E22\u0E32\u0E27\u0E23\u0E27\u0E21"), React.createElement("b", {
      style: {
        fontSize: 15,
        padding: "6px 2px"
      }
    }, p3sR(p3sPathLen(p3sObsPath(o)), 10), " \u0E21. ", React.createElement("small", {
      style: {
        fontWeight: 400
      }
    }, "\xB7 ", p3sObsPath(o).length - 1, " \u0E0A\u0E48\u0E27\u0E07"))), T === "pipe" && React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E01\u0E4A\u0E2D\u0E01\u0E19\u0E49\u0E33"), React.createElement("b", {
      style: {
        fontSize: 15,
        padding: "6px 2px"
      }
    }, (o.taps || []).length, " \u0E08\u0E38\u0E14")), T === "pipe" && React.createElement("div", {
      className: "p3s-row",
      style: {
        gridColumn: "1 / -1",
        gap: 6
      }
    }, React.createElement("button", {
      type: "button",
      className: "p3s-btn" + (tapPick === o.id ? " pri" : ""),
      style: {
        flex: 2
      },
      onClick: () => setTapPick(tapPick === o.id ? null : o.id)
    }, React.createElement(P3SIcon, {
      name: "target",
      size: 15
    }), tapPick === o.id ? "จิ้มบนท่อ… (เสร็จ = แตะอีกครั้ง)" : "จิ้มวางก๊อกบนท่อ"), React.createElement("button", {
      type: "button",
      className: "p3s-btn dngr",
      style: {
        flex: 1
      },
      disabled: !(o.taps || []).length,
      onClick: () => patchObs(o.id, {
        taps: []
      }, "tap")
    }, "\u0E25\u0E49\u0E32\u0E07\u0E01\u0E4A\u0E2D\u0E01")));
  })() : React.createElement("div", {
    className: "p3s-g2"
  }, React.createElement(P3SNum, {
    label: o.kind === "tree" ? "ทรงพุ่มกว้าง" : "กว้าง",
    unit: "\u0E21.",
    step: 0.1,
    min: 0.3,
    value: o.w,
    onChange: v => patchObs(o.id, o.kind === "tree" ? {
      w: v,
      d: v
    } : {
      w: v
    }, "ow")
  }), o.kind !== "tree" && React.createElement(P3SNum, {
    label: "\u0E25\u0E36\u0E01",
    unit: "\u0E21.",
    step: 0.1,
    min: 0.3,
    value: o.d,
    onChange: v => patchObs(o.id, {
      d: v
    }, "od")
  }), React.createElement(P3SNum, {
    label: "\u0E2A\u0E39\u0E07",
    unit: "\u0E21.",
    step: 0.1,
    min: 0.2,
    value: o.h,
    onChange: v => patchObs(o.id, {
      h: v
    }, "oh")
  }), o.kind !== "tree" && React.createElement(P3SNum, {
    label: "\u0E2B\u0E21\u0E38\u0E19",
    unit: "\xB0",
    step: 5,
    min: 0,
    max: 360,
    digits: 0,
    value: +o.rot || 0,
    onChange: v => patchObs(o.id, {
      rot: v
    }, "orot")
  })), React.createElement("span", {
    className: "p3s-note"
  }, p3sObsType(o) === "rail" ? "ราวกันตกตั้งบนหลังคา เสาทุกมุมและทุก 2 ม. — แนวราวและรอบ ๆ 10 ซม. ติดแผงไม่ได้ · ลากจุดกลมบนผังเพื่อแก้แนว" : p3sObsType(o) === "sky" ? "หลังคาช่องแสงโปร่งแสง กว้าง 1 ม. แนบหลังคา — ตรงช่องแสงติดแผงไม่ได้ แผงที่ทับถูกตัดออกเอง · ลากจุดกลมบนผังเพื่อแก้แนว" : p3sObsType(o) === "walkway" ? "ทางเดินตะแกรง (FRP) กว้าง 30 ซม. แนบหลังคา — ตรงทางเดินติดแผงไม่ได้ · ลากจุดกลมบนผังเพื่อแก้แนว" : p3sObsType(o) === "ladder" ? "บันไดลิงมีกรง ติดที่ขอบหลังคาเสมอ (ลากย้ายแล้วดูดเข้าขอบที่ใกล้สุด) — 3D ตั้งจากพื้นดินถึงหลังคาตรงนั้นเอง ราวจับยื่นเหนือขอบ 1.1 ม. · จุดขึ้นบนหลังคาเว้นไม่ติดแผง 40 ซม." : P3S_ON_ROOF[p3sObsType(o)] != null ? p3sObsType(o) === "sky" ? "แนบไปกับหลังคา — ตรงช่องแสงติดแผงไม่ได้ แผงที่ทับถูกตัดออกเอง" : "ตั้งบนหลังคา — ตรงนี้และรอบ ๆ 15 ซม. ติดแผงไม่ได้ (กรอบเส้นประแดง) · ความสูงใช้คำนวณเงาที่ตกบนแผงข้าง ๆ ดูได้ในมุมมอง 3D" : "ความสูงใช้คำนวณเงาที่ตกบนแผง — ดูผลได้ในมุมมอง 3D"), React.createElement("div", {
    className: "p3s-row"
  }, React.createElement("button", {
    className: "p3s-btn",
    style: {
      flex: 1
    },
    onClick: duplicate
  }, React.createElement(P3SIcon, {
    name: "copy",
    size: 15
  }), "\u0E17\u0E33\u0E0B\u0E49\u0E33"), React.createElement("button", {
    className: "p3s-btn dngr",
    style: {
      flex: 1
    },
    onClick: delSelected
  }, React.createElement(P3Icon, {
    name: "trash"
  }), "\u0E25\u0E1A")));
  const measPanelBody = m => React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3Icon, {
    name: "ruler",
    size: 17
  }), "\u0E40\u0E2A\u0E49\u0E19\u0E27\u0E31\u0E14\u0E23\u0E30\u0E22\u0E30"), React.createElement(P3SText, {
    label: "\u0E0A\u0E37\u0E48\u0E2D",
    value: m.name,
    onChange: v => patchMeas(m.id, {
      name: v
    }, "mn")
  }), React.createElement("label", {
    className: "p3s-fld"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A (\u0E14\u0E36\u0E07\u0E40\u0E02\u0E49\u0E32 BOQ \u0E15\u0E32\u0E21\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49)"), React.createElement("span", {
    className: "p3s-well"
  }, React.createElement("select", {
    value: m.kind || "other",
    onChange: e => patchMeas(m.id, {
      kind: e.target.value
    })
  }, P3_MEAS_KINDS.map(k => React.createElement("option", {
    key: k.k,
    value: k.k
  }, k.th))))), React.createElement(P3SNum, {
    label: "\u0E23\u0E30\u0E22\u0E30\u0E02\u0E36\u0E49\u0E19\u2013\u0E25\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 (\u0E1C\u0E19\u0E31\u0E07/\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32)",
    unit: "\u0E21.",
    step: 0.5,
    min: 0,
    value: +m.rise || 0,
    onChange: v => patchMeas(m.id, {
      rise: v
    }, "mr")
  }), React.createElement("div", {
    className: "p3s-stat"
  }, React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement("div", {
    className: "l"
  }, "\u0E23\u0E30\u0E22\u0E30\u0E23\u0E27\u0E21"), React.createElement("div", {
    className: "v"
  }, fmtM(p3MeasLen(m))))), React.createElement("button", {
    className: "p3s-btn dngr wide",
    onClick: delSelected
  }, React.createElement(P3Icon, {
    name: "trash"
  }), "\u0E25\u0E1A\u0E40\u0E2A\u0E49\u0E19\u0E19\u0E35\u0E49"));
  const bgPanel = React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3Icon, {
    name: "map",
    size: 17
  }), "\u0E20\u0E32\u0E1E\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E44\u0E14\u0E49\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E08\u0E23\u0E34\u0E07\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E17\u0E31\u0E19\u0E17\u0E35 \u2014 \u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E27\u0E31\u0E14\u0E23\u0E30\u0E22\u0E30\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"), React.createElement("div", {
    className: "p3s-row"
  }, React.createElement("button", {
    className: "p3s-btn pri",
    style: {
      flex: 1
    },
    onClick: () => setMapOpen(true)
  }, React.createElement(P3Icon, {
    name: "map"
  }), st.baseMap ? "เลือกพื้นที่ใหม่" : "เลือกจากแผนที่"), st.baseMap && React.createElement("button", {
    className: "p3s-btn dngr",
    onClick: () => commit({
      baseMap: null
    })
  }, React.createElement(P3Icon, {
    name: "trash"
  })))), React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3Icon, {
    name: "camera",
    size: 17
  }), "\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19 / \u0E20\u0E32\u0E1E\u0E21\u0E38\u0E21\u0E2A\u0E39\u0E07"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: onPickPhoto
  }), React.createElement("div", {
    className: "p3s-row"
  }, React.createElement("button", {
    className: "p3s-btn" + (st.photo ? "" : " pri"),
    style: {
      flex: 1
    },
    onClick: () => fileRef.current && fileRef.current.click()
  }, React.createElement(P3Icon, {
    name: "image"
  }), st.photo ? "เปลี่ยนรูป" : "อัปโหลดรูป"), st.photo && React.createElement("button", {
    className: "p3s-btn dngr",
    onClick: () => commit({
      photo: null,
      photoRot: 0,
      photoX: 0,
      photoZ: 0
    })
  }, React.createElement(P3Icon, {
    name: "trash"
  }))), st.photo && React.createElement(React.Fragment, null, React.createElement("button", {
    className: "p3s-btn wide" + (calib ? " pri" : ""),
    onClick: () => {
      setToolRaw("bg");
      setCalib(calib ? null : {
        pts: [],
        len: ""
      });
    }
  }, React.createElement(P3SIcon, {
    name: "ruler",
    size: 15
  }), calib ? "กำลังตั้งมาตราส่วน… (กดอีกครั้งเพื่อยกเลิก)" : "ตั้งมาตราส่วนจากระยะที่รู้จริง"), calib && calib.pts.length === 2 && (() => {
    const Lm = Math.hypot(calib.pts[1].x - calib.pts[0].x, calib.pts[1].z - calib.pts[0].z);
    const real = parseFloat(calib.len);
    return React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E23\u0E30\u0E22\u0E30\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E19\u0E35\u0E49 (\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49 ", p3sR(Lm), " \u0E21.)"), React.createElement("span", {
      className: "p3s-well"
    }, React.createElement("input", {
      type: "text",
      inputMode: "decimal",
      autoFocus: true,
      value: calib.len,
      onChange: e => setCalib(Object.assign({}, calib, {
        len: e.target.value
      })),
      placeholder: "\u0E40\u0E0A\u0E48\u0E19 12.5"
    }), React.createElement("span", {
      className: "u"
    }, "\u0E21.")), React.createElement("button", {
      className: "p3s-btn pri wide",
      disabled: !(real > 0) || !(Lm > 0.05),
      onClick: () => {
        const f = real / Lm,
          S = stRef.current,
          a = calib.pts[0];
        commit({
          photoW: p3sR((+S.photoW || 30) * f, 100),
          photoX: p3sR(a.x + ((+S.photoX || 0) - a.x) * f),
          photoZ: p3sR(a.z + ((+S.photoZ || 0) - a.z) * f)
        });
        setCalib(null);
      }
    }, "\u0E43\u0E0A\u0E49\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E19\u0E35\u0E49"));
  })(), React.createElement("div", {
    className: "p3s-g2"
  }, React.createElement(P3SNum, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E39\u0E1B\u0E08\u0E23\u0E34\u0E07",
    unit: "\u0E21.",
    step: 0.5,
    min: 2,
    value: +st.photoW || 30,
    onChange: v => commit({
      photoW: v
    }, "pw")
  }), React.createElement(P3SNum, {
    label: "\u0E2B\u0E21\u0E38\u0E19\u0E23\u0E39\u0E1B",
    unit: "\xB0",
    step: 0.5,
    min: -360,
    max: 360,
    digits: 1,
    value: +st.photoRot || 0,
    onChange: v => commit({
      photoRot: v
    }, "prot")
  })), React.createElement(P3SRange, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E17\u0E36\u0E1A\u0E23\u0E39\u0E1B",
    right: Math.round((+st.photoOpacity || 0.95) * 100) + "%",
    min: 0.15,
    max: 1,
    step: 0.05,
    value: +st.photoOpacity || 0.95,
    onChange: v => commit({
      photoOpacity: v
    }, "pop")
  }), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E21\u0E35\u0E17\u0E31\u0E49\u0E07\u0E20\u0E32\u0E1E\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21\u0E41\u0E25\u0E30\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19: \u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E17\u0E36\u0E1A\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19\u0E41\u0E25\u0E49\u0E27\u0E25\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E1A\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E1E\u0E2D\u0E14\u0E35 \u0E08\u0E30\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E04\u0E27\u0E32\u0E21\u0E04\u0E21\u0E02\u0E2D\u0E07\u0E42\u0E14\u0E23\u0E19\u0E41\u0E25\u0E30\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"))));
  const hasImgW = !!(st.baseMap || st.photo);
  const facetRoofs = roofs.filter(r => r.p3sFacet);
  if (shapeRef.current.roofs !== roofs) {
    let g = 0;
    if (facetRoofs.length > 1) {
      try {
        g = p3sWeldFacets(facetRoofs).gap || 0;
      } catch (e) {
        g = 0;
      }
    }
    shapeRef.current = {
      roofs,
      gap: g
    };
  }
  const shapeGap = shapeRef.current.gap;
  const emptyRoofs = roofs.filter(r => !roofCountOf(r));
  const anyWalk = roofs.some(r => (r.walks || []).length);
  const roofEaveOf = r => r.kind === "poly" ? Math.min.apply(null, p3PhOf(r)) : +r.h || 0;
  const roofPitchOf = r => r.kind === "dome" ? null : r.kind === "poly" ? p3sR(p3sPolyPitch(r), 10) : +r.pitch || 0;
  const setRoofEave = (r, v) => {
    if (r.kind !== "poly") {
      patchRoof(r.id, {
        h: v
      }, "h");
      return;
    }
    patchRoof(r.id, x => {
      const ph = p3PhOf(x),
        d = v - Math.min.apply(null, ph);
      return {
        ph: ph.map(h => p3sR(h + d))
      };
    }, "eave");
  };
  const setRoofPitch = (r, v) => {
    if (r.kind !== "poly") {
      patchRoof(r.id, {
        pitch: v
      }, "pitch");
      return;
    }
    patchRoof(r.id, x => {
      const P = x.pts || [],
        n = P.length,
        ph = p3PhOf(x),
        base = Math.min.apply(null, ph);
      const lo = x.p3sLow != null ? (+x.p3sLow % n + n) % n : p3sSouthEdge(P);
      return {
        ph: p3sPitchPh(P, lo, base, v),
        p3sLow: lo,
        p3sPitch: v
      };
    }, "pitch");
    if (r.p3sFacet) weldLive([r.id], {
      pitch: v
    });
  };
  const roofDims = r => {
    const k = r.kind;
    if (k === "gable") return {
      a: ["ยาวตามสัน", +r.ridge || 0, v => patchRoof(r.id, {
        ridge: v
      }, "ridge")],
      b: ["กว้างจั่ว", +r.span || 0, v => patchRoof(r.id, {
        span: v
      }, "span")]
    };
    if (k === "hip") {
      const ewIsW = q => {
        const t = (((+q.az || 180) + 90) % 180 + 180) % 180;
        return t >= 45 && t < 135;
      };
      const hipSet = (ew, v) => patchRoof(r.id, q => {
        const o = {
          w: +q.w || 10,
          d: +q.d || 7,
          az: +q.az || 180
        };
        o[ewIsW(q) === ew ? "w" : "d"] = v;
        if (o.d > o.w) {
          const t = o.w;
          o.w = o.d;
          o.d = t;
          o.az = p3sR((o.az + 90) % 360, 10);
        }
        return o;
      }, "hip" + ew);
      const wEW = ewIsW(r);
      return {
        a: ["ด้านออก–ตก", +(wEW ? r.w : r.d) || 0, v => hipSet(true, v)],
        b: ["ด้านเหนือ–ใต้", +(wEW ? r.d : r.w) || 0, v => hipSet(false, v)]
      };
    }
    if (k === "dome") return {
      a: ["ยาว", +r.ridge || 0, v => patchRoof(r.id, {
        ridge: v
      }, "ridge")],
      b: ["กว้าง", +r.span || 0, v => patchRoof(r.id, {
        span: v
      }, "span")]
    };
    if (k === "rect") return {
      a: ["กว้าง", +r.w || 0, v => patchRoof(r.id, {
        w: v
      }, "w")],
      b: ["ยาวตามลาด", +r.d || 0, v => patchRoof(r.id, {
        d: v
      }, "d")]
    };
    if (k !== "poly" || (r.pts || []).length !== 4) return null;
    const P = r.pts,
      e0 = Math.hypot(P[1].x - P[0].x, P[1].z - P[0].z),
      e1 = Math.hypot(P[2].x - P[1].x, P[2].z - P[1].z);
    if (e0 < 0.01 || e1 < 0.01) return null;
    const scale = (edge, v) => patchRoof(r.id, x => {
      const Q = x.pts,
        a = Q[edge],
        b = Q[edge + 1],
        L = Math.hypot(b.x - a.x, b.z - a.z);
      if (!(L > 0.01) || !(v > 0.3)) return {};
      const ux = (b.x - a.x) / L,
        uz = (b.z - a.z) / L,
        f = v / L;
      const cx = Q.reduce((t, q) => t + q.x, 0) / 4,
        cz = Q.reduce((t, q) => t + q.z, 0) / 4;
      const pts = Q.map(q => {
        const t = (q.x - cx) * ux + (q.z - cz) * uz;
        return {
          x: p3sR(q.x + t * (f - 1) * ux, 1000),
          z: p3sR(q.z + t * (f - 1) * uz, 1000)
        };
      });
      const o = {
          pts
        },
        pc = p3sPolyPitch(x);
      if (pc > 0.4) {
        const n = pts.length,
          ph = p3PhOf(x),
          lo = x.p3sLow != null ? (+x.p3sLow % n + n) % n : p3sSouthEdge(pts);
        o.ph = p3sPitchPh(pts, lo, Math.min.apply(null, ph), x.p3sPitch != null ? +x.p3sPitch : pc);
      }
      return o;
    }, "dim" + edge);
    const lng = e0 >= e1 ? 0 : 1;
    return {
      a: ["ยาว", p3sR(lng ? e1 : e0, 100), v => scale(lng, v)],
      b: ["กว้าง", p3sR(lng ? e0 : e1, 100), v => scale(1 - lng, v)]
    };
  };
  const ridgeTxt = (r, len) => {
    let o = [];
    try {
      o = p3sOutline(r) || [];
    } catch (e) {
      o = [];
    }
    if (o.length < 3) return "";
    let bi = 0,
      bd = 1e9;
    o.forEach((a, i) => {
      const b = o[(i + 1) % o.length],
        d = Math.abs(Math.hypot(b.x - a.x, b.z - a.z) - len);
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    const f = p3sEdgeBearing(o, bi);
    return p3sCompass(f + 90) + "–" + p3sCompass(f - 90);
  };
  const flipRidge = r => patchRoof(r.id, q => q.kind === "gable" ? {
    ridge: q.span,
    span: q.ridge,
    az: p3sR(((+q.az || 180) + 90) % 360, 10)
  } : {
    w: q.d,
    d: q.w,
    az: p3sR(((+q.az || 180) + 90) % 360, 10)
  });
  const pickRoof = r => {
    setSel({
      t: "roof",
      id: r.id
    });
    const P = p3sRoofPts(r);
    if (!P.length) {
      const c = p3sRoofCenter(r);
      setView(Object.assign({}, viewRef.current, {
        cx: c.x,
        cz: c.z
      }));
      return;
    }
    const Q = P.map(p => p3sRot(p.x, p.z, -rotRef.current)),
      xs = Q.map(q => q.x),
      zs = Q.map(q => q.z);
    const x0 = Math.min.apply(null, xs),
      x1 = Math.max.apply(null, xs),
      z0 = Math.min.apply(null, zs),
      z1 = Math.max.apply(null, zs);
    const c = p3sRot((x0 + x1) / 2, (z0 + z1) / 2, rotRef.current),
      {
        w,
        h
      } = sizeRef.current,
      pad = isMobile ? 50 : 140;
    const s = p3sClamp(Math.min((w - pad) / Math.max(2, x1 - x0), (h - pad) / Math.max(2, z1 - z0)), 0.4, 300);
    setView({
      cx: c.x,
      cz: c.z,
      s
    });
  };
  const panelOk = !!(st.sys || {}).panelModel || !!wizSeen.pmod;
  panGateRef.current = !panelOk;
  const WIZ = [{
    t: "ภาพมุมสูง",
    tools: ["bg"],
    done: hasImgW,
    d: React.createElement("span", null, "\u0E01\u0E14 ", React.createElement("b", null, "\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21"), " \u0E2B\u0E23\u0E37\u0E2D ", React.createElement("b", null, "\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19"), " \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E2D\u0E22\u0E39\u0E48\u0E01\u0E25\u0E32\u0E07\u0E08\u0E2D \xB7 \u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E49\u0E07\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E08\u0E32\u0E01\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E23\u0E39\u0E49\u0E08\u0E23\u0E34\u0E07\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E17\u0E38\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E19\u0E35\u0E49\u0E27\u0E31\u0E14\u0E15\u0E32\u0E21\u0E20\u0E32\u0E1E\u0E19\u0E35\u0E49"),
    act: React.createElement("div", {
      className: "p3s-row"
    }, React.createElement("button", {
      className: "p3s-btn",
      style: {
        flex: 1
      },
      onClick: () => setMapOpen(true)
    }, React.createElement(P3Icon, {
      name: "map"
    }), "\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21"), React.createElement("button", {
      className: "p3s-btn",
      style: {
        flex: 1
      },
      onClick: () => fileRef.current && fileRef.current.click()
    }, React.createElement(P3Icon, {
      name: "camera"
    }), "\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19")),
    go: () => setTool("bg")
  }, {
    t: "กำหนดพื้นที่ติดตั้ง",
    tools: ["area"],
    done: !!(st.p3sArea && (st.p3sArea.pts || []).length > 2),
    d: React.createElement("span", null, React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A"), " \u0E04\u0E25\u0E38\u0E21\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E0B\u0E39\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E2B\u0E49 \u0E41\u0E25\u0E30\u0E43\u0E0A\u0E49\u0E01\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \xB7 \u0E25\u0E32\u0E01\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E21\u0E2D"),
    act: st.p3sArea ? React.createElement("div", {
      className: "p3s-row"
    }, React.createElement("button", {
      className: "p3s-btn",
      style: {
        flex: 1
      },
      onClick: () => zoomArea(st.p3sArea)
    }, React.createElement(P3SIcon, {
      name: "fit",
      size: 15
    }), "\u0E0B\u0E39\u0E21\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E1A"), React.createElement("button", {
      className: "p3s-btn dngr",
      onClick: () => commit({
        p3sArea: null
      })
    }, React.createElement(P3Icon, {
      name: "trash"
    }))) : null,
    go: () => {
      setTool("area");
      if (st.p3sArea) zoomArea(st.p3sArea);
    }
  }, {
    t: "ตั้งแนวหลังคา",
    tools: ["axis"],
    done: axisDeg != null,
    d: React.createElement("span", null, "\u0E01\u0E14 ", React.createElement("b", null, "\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), " (\u0E2D\u0E48\u0E32\u0E19\u0E02\u0E2D\u0E1A\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07) \u0E41\u0E25\u0E49\u0E27\u0E14\u0E39\u0E27\u0E48\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E01\u0E23\u0E34\u0E14\u0E2A\u0E35\u0E21\u0E48\u0E27\u0E07\u0E02\u0E19\u0E32\u0E19\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E44\u0E2B\u0E21 \xB7 \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E1B\u0E23\u0E31\u0E1A\u0E17\u0E35\u0E25\u0E30\u0E2D\u0E07\u0E28\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E32\u0E01\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32\u0E40\u0E2D\u0E07"),
    act: React.createElement(React.Fragment, null, React.createElement("button", {
      className: "p3s-btn wide" + (axisDeg == null ? " pri" : ""),
      disabled: !hasImgW,
      onClick: autoAxis
    }, React.createElement(P3SIcon, {
      name: "magic",
      size: 15
    }), "\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), axisMsg && React.createElement("span", {
      className: "p3s-note keep"
    }, axisMsg), axisDeg != null && React.createElement("div", {
      className: "p3s-fld",
      style: {
        gap: 6
      }
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E41\u0E19\u0E27 ", p3sR(axisDeg, 10), "\xB0 \u2014 \u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E44\u0E2B\u0E21?"), React.createElement("div", {
      className: "p3s-row",
      style: {
        gap: 5
      }
    }, React.createElement("button", {
      className: "p3s-btn",
      style: {
        padding: "0 10px"
      },
      onClick: () => setAxis(axisDeg - 1)
    }, "\u22121\xB0"), React.createElement("button", {
      className: "p3s-btn",
      style: {
        padding: "0 10px"
      },
      onClick: () => setAxis(axisDeg + 1)
    }, "+1\xB0"), React.createElement("button", {
      className: "p3s-btn pri",
      style: {
        flex: 1
      },
      onClick: () => nextStep()
    }, React.createElement(P3Icon, {
      name: "check"
    }), "\u0E15\u0E23\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E44\u0E1B\u0E15\u0E48\u0E2D")))),
    go: () => setTool("axis")
  }, {
    t: "วาดหลังคา · ความสูงและความชัน",
    tools: ["roof"],
    done: roofs.length > 0 && shapeGap < 0.03,
    d: roofs.length ? React.createElement("span", null, "\u0E15\u0E31\u0E49\u0E07 ", React.createElement("b", null, "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23"), " (\u0E1E\u0E37\u0E49\u0E19\u0E16\u0E36\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32) \u0E41\u0E25\u0E30 ", React.createElement("b", null, "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19"), " \u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E2B\u0E25\u0E31\u0E07 \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A\u0E01\u0E14 ", React.createElement("b", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E35\u0E01\u0E2B\u0E25\u0E31\u0E07"), " \xB7 \u0E1C\u0E37\u0E19\u0E17\u0E35\u0E48\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19\u0E0A\u0E31\u0E19\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E07 \xB7 ", React.createElement("b", null, "Shift"), " + \u0E41\u0E15\u0E30 = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07") : React.createElement("span", null, React.createElement("b", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19"), " \xB7 ", React.createElement("b", null, "\u0E23\u0E32\u0E1A \u0E40\u0E1E\u0E34\u0E07 \u0E08\u0E31\u0E48\u0E27 \u0E1B\u0E31\u0E49\u0E19\u0E2B\u0E22\u0E32 \u0E04\u0E23\u0E36\u0E48\u0E07\u0E27\u0E07\u0E01\u0E25\u0E21"), " = \u0E25\u0E32\u0E01\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21 \u0E2B\u0E23\u0E37\u0E2D ", React.createElement("b", null, "\u0E2B\u0E32\u0E02\u0E2D\u0E1A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), " (\u0E41\u0E15\u0E30\u0E2B\u0E25\u0E32\u0E22\u0E08\u0E38\u0E14\u0E44\u0E14\u0E49 \u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \xB7 \u0E2A\u0E25\u0E31\u0E1A\u0E17\u0E23\u0E07\u0E44\u0E14\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E14\u0E40\u0E2D\u0E32\u0E41\u0E1A\u0E1A\u0E19\u0E35\u0E49) \xB7 ", React.createElement("b", null, "\u0E40\u0E1E\u0E34\u0E07"), " \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E15\u0E30\u0E02\u0E2D\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E33\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E17\u0E32\u0E07\u0E25\u0E32\u0E14 \xB7 ", React.createElement("b", null, "\u0E17\u0E35\u0E25\u0E30\u0E1C\u0E37\u0E19"), " = \u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E32\u0E22\u0E08\u0E38\u0E14"),
    extra: shapeGap >= 0.03 && facetRoofs.length > 1 && React.createElement("div", {
      className: "p3s-row"
    }, React.createElement("span", {
      className: "p3s-badge warn",
      style: {
        flex: 1
      }
    }, "\u0E17\u0E23\u0E07\u0E22\u0E31\u0E07\u0E40\u0E1E\u0E35\u0E49\u0E22\u0E19 ", Math.round(shapeGap * 100), " \u0E0B\u0E21."), React.createElement("button", {
      className: "p3s-btn pri",
      onClick: () => weldNow(facetRoofs[0])
    }, React.createElement(P3SIcon, {
      name: "magic",
      size: 15
    }), "\u0E08\u0E31\u0E14\u0E17\u0E23\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E07")),
    list: roofs.length > 0 && React.createElement("div", {
      className: "p3s-fld p3s-rlist",
      style: {
        gap: 10
      }
    }, roofs.map(r => {
      const pc = roofPitchOf(r),
        on = selRoof && selRoof.id === r.id;
      const kk = r.p3sKind && P3S_KIND_TH[r.p3sKind] ? r.p3sKind : r.kind === "poly" ? r.p3sFacet ? "facet" : pc > 0.4 ? "shed" : "flat" : r.kind;
      let ar = 0;
      try {
        ar = p3Area(p3sOutline(r));
      } catch (e) {
        ar = 0;
      }
      return React.createElement("div", {
        key: r.id,
        className: "p3s-fld",
        style: {
          gap: 8,
          padding: 12,
          borderRadius: 12,
          background: on ? "var(--tint-green-bg,#ecfdf5)" : "var(--surface2)"
        }
      }, React.createElement("div", {
        className: "p3s-row",
        style: {
          justifyContent: "space-between",
          gap: 6,
          flexWrap: "nowrap"
        }
      }, React.createElement("button", {
        className: "p3s-btn",
        style: {
          height: 26,
          padding: "0 10px",
          fontSize: 12,
          minWidth: 0
        },
        onClick: () => pickRoof(r)
      }, React.createElement(P3Icon, {
        name: "roof"
      }), r.name || "หลังคา", " \xB7 ", P3S_KIND_TH[kk] || kk), React.createElement("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: "nowrap",
          marginLeft: "auto"
        }
      }, p3sR(ar, 10).toLocaleString(), React.createElement("small", {
        style: {
          fontSize: 10,
          fontWeight: 400
        }
      }, " \u0E15\u0E23.\u0E21.")), React.createElement("button", {
        className: "p3s-btn dngr",
        title: "\u0E25\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E19\u0E35\u0E49",
        style: {
          height: 26,
          width: 26,
          padding: 0,
          flex: "0 0 26px"
        },
        onClick: () => {
          commit(x => Object.assign({}, x, {
            roofs: (x.roofs || []).filter(q => q.id !== r.id)
          }));
          if (on) {
            setSel(null);
            setSelVert(null);
            setSelBlk(null);
          }
        }
      }, React.createElement(P3Icon, {
        name: "trash"
      }))), (() => {
        const D = roofDims(r);
        return D && React.createElement("div", {
          className: "p3s-g2"
        }, React.createElement(P3SNum, {
          label: D.a[0],
          unit: "\u0E21.",
          step: 0.1,
          min: 0.5,
          value: D.a[1],
          onChange: D.a[2]
        }), React.createElement(P3SNum, {
          label: D.b[0],
          unit: "\u0E21.",
          step: 0.1,
          min: 0.5,
          value: D.b[1],
          onChange: D.b[2]
        }));
      })(), React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement(P3SNum, {
        label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23",
        unit: "\u0E21.",
        step: 0.1,
        min: 0,
        value: p3sR(roofEaveOf(r), 100),
        onChange: v => setRoofEave(r, v)
      }), pc != null ? React.createElement(P3SNum, {
        label: "\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19",
        unit: "\xB0",
        step: 1,
        min: 0,
        max: 60,
        digits: 1,
        value: pc,
        onChange: v => setRoofPitch(r, v)
      }) : React.createElement(P3SNum, {
        label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E42\u0E04\u0E49\u0E07",
        unit: "\u0E21.",
        step: 0.1,
        min: 0.2,
        value: r.rise,
        onChange: v => patchRoof(r.id, {
          rise: v
        }, "rise")
      })), !r.p3sGround && React.createElement("label", {
        className: "p3s-fld"
      }, React.createElement("span", {
        className: "lb"
      }, "\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("span", {
        className: "p3s-well"
      }, React.createElement("select", {
        value: p3sRoofMat(r),
        onChange: e => {
          const v = e.target.value;
          commit(s => Object.assign({}, s, {
            roofs: (s.roofs || []).map(q => q.id === r.id || r.grp && q.grp === r.grp ? Object.assign({}, q, {
              p3sMat: v
            }) : q)
          }));
        }
      }, P3S_MATS.map(([k, t]) => React.createElement("option", {
        key: k,
        value: k
      }, t))))), !r.p3sGround && React.createElement("div", {
        className: "p3s-fld"
      }, React.createElement("span", {
        className: "lb"
      }, "\u0E2A\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("span", {
        className: "p3s-cols"
      }, [[null, "ตามวัสดุ"]].concat(P3S_ROOF_COLS).map(([c, t]) => React.createElement("button", {
        key: c || "def",
        type: "button",
        title: t,
        "data-on": (r.p3sCol || null) === c ? "1" : undefined,
        className: "p3s-col" + (c ? "" : " def"),
        style: c ? {
          background: c
        } : null,
        onClick: () => commit(s => Object.assign({}, s, {
          roofs: (s.roofs || []).map(q => q.id === r.id || r.grp && q.grp === r.grp ? Object.assign({}, q, {
            p3sCol: c
          }) : q)
        }))
      })))), r.p3sParapet != null && React.createElement("div", {
        className: "p3s-g2"
      }, React.createElement(P3SNum, {
        label: "\u0E02\u0E2D\u0E1A\u0E01\u0E31\u0E19\u0E15\u0E01\u0E2A\u0E39\u0E07",
        unit: "\u0E21.",
        step: 0.1,
        min: 0,
        max: 3,
        value: +r.p3sParapet || 0,
        onChange: v => patchRoof(r.id, {
          p3sParapet: v
        }, "par")
      }), React.createElement(P3SNum, {
        label: "\u0E41\u0E1C\u0E07\u0E40\u0E27\u0E49\u0E19\u0E02\u0E2D\u0E1A",
        unit: "\u0E21.",
        step: 0.1,
        min: 0,
        max: 5,
        value: +r.margin || 0,
        onChange: v => patchRoof(r.id, {
          margin: v
        }, "mrg")
      })), (r.kind === "gable" || r.kind === "hip") && React.createElement("div", {
        className: "p3s-row",
        style: {
          gap: 6,
          flexWrap: "nowrap",
          minHeight: 28
        }
      }, React.createElement("span", {
        className: "p3s-note keep",
        style: {
          flex: 1
        }
      }, "\u0E2A\u0E31\u0E19\u0E41\u0E19\u0E27", ridgeTxt(r, r.kind === "gable" ? +r.ridge || 0 : Math.max(+r.w || 0, +r.d || 0)), r.kind === "hip" ? " · สันยาว " + p3sR(Math.max(0, (+r.w || 0) - (+r.d || 0)), 10) + " ม. (ด้านยาว − ด้านสั้น)" : ""), r.kind === "gable" && React.createElement("button", {
        className: "p3s-btn",
        style: {
          height: 28,
          fontSize: 12
        },
        onClick: () => flipRidge(r)
      }, React.createElement(P3SIcon, {
        name: "rotate",
        size: 14
      }), "\u0E2A\u0E25\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19")), kk === "shed" && (() => {
        const P = r.pts || [],
          n = P.length,
          lo = r.p3sLow != null ? (+r.p3sLow % n + n) % n : p3sSouthEdge(P);
        return React.createElement("div", {
          className: "p3s-row",
          style: {
            gap: 6,
            flexWrap: "nowrap"
          }
        }, React.createElement("span", {
          className: "p3s-well",
          style: {
            flex: 1,
            minWidth: 0
          }
        }, React.createElement("select", {
          value: lo,
          title: "\u0E25\u0E32\u0E14\u0E25\u0E07\u0E17\u0E32\u0E07 (\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32)",
          onChange: e => setEave(r, +e.target.value)
        }, P.map((q, k) => {
          const q2 = P[(k + 1) % n];
          return React.createElement("option", {
            key: k,
            value: k
          }, "\u0E25\u0E32\u0E14\u0E25\u0E07", p3sCompass(p3sEdgeBearing(P, k)), " \xB7 \u0E02\u0E2D\u0E1A ", p3sR(Math.hypot(q2.x - q.x, q2.z - q.z), 10), " \u0E21.");
        }))), React.createElement("button", {
          className: "p3s-btn" + (eavePick && on ? " pri" : ""),
          style: {
            height: 32,
            fontSize: 12
          },
          title: "\u0E41\u0E15\u0E30\u0E02\u0E2D\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E33\u0E1A\u0E19\u0E1C\u0E31\u0E07",
          onClick: () => {
            pickRoof(r);
            setEavePick(true);
          }
        }, React.createElement(P3SIcon, {
          name: "target",
          size: 14
        }), "\u0E41\u0E15\u0E30\u0E1A\u0E19\u0E1C\u0E31\u0E07"));
      })(), r.kind === "dome" && React.createElement("div", {
        className: "p3s-row",
        style: {
          gap: 5,
          flexWrap: "wrap"
        }
      }, [["ครึ่งวง", 2], ["1/3", 3], ["1/4", 4], ["1/6", 6]].map(([lb, k]) => {
        const v = p3sR((+r.span || 10) / k);
        return React.createElement("button", {
          key: k,
          className: "p3s-btn" + (Math.abs((+r.rise || 0) - v) < 0.02 ? " pri" : ""),
          style: {
            flex: 1,
            padding: 0,
            height: 28,
            fontSize: 11.5
          },
          onClick: () => patchRoof(r.id, {
            rise: v
          })
        }, lb);
      }), React.createElement("button", {
        className: "p3s-btn",
        style: {
          flex: "1 1 100%",
          height: 28,
          fontSize: 12
        },
        onClick: () => patchRoof(r.id, q => {
          const sp0 = +q.span || 10,
            sp1 = +q.ridge || 12,
            rs = +q.rise || sp0 / 2;
          return {
            ridge: sp0,
            span: sp1,
            rise: p3sR(Math.min(sp1 / 2, rs * sp1 / sp0)),
            az: p3sR(((+q.az || 180) + 90) % 360, 10)
          };
        })
      }, React.createElement(P3SIcon, {
        name: "rotate",
        size: 14
      }), "\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E42\u0E04\u0E49\u0E07 \xB7 \u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E41\u0E01\u0E19\u0E22\u0E32\u0E27\u0E41\u0E19\u0E27", ridgeTxt(r, +r.ridge || 0))));
    })),
    act: roofs.length > 0 ? React.createElement(React.Fragment, null, React.createElement("button", {
      className: "p3s-btn pri wide",
      onClick: addRoof
    }, React.createElement(P3Icon, {
      name: "plus"
    }), "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E35\u0E01\u0E2B\u0E25\u0E31\u0E07 (\u0E21\u0E35\u0E41\u0E25\u0E49\u0E27 ", roofs.length, ")"), view3d ? React.createElement("button", {
      className: "p3s-btn wide pri",
      onClick: () => {
        setView3d(false);
        setToolRaw(wizHomeRef.current || "select");
      }
    }, React.createElement(P3SIcon, {
      name: "polygon",
      size: 15
    }), "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E1C\u0E31\u0E07 2D") : React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => {
        setView3d(true);
        setToolRaw("select");
        setDraw(null);
        setTrace(null);
      }
    }, React.createElement(P3Icon, {
      name: "cube"
    }), "\u0E14\u0E39\u0E17\u0E23\u0E07\u0E43\u0E19 3D")) : React.createElement("button", {
      className: "p3s-btn pri wide",
      onClick: () => {
        if (tool !== "roof") setTool("roof");
        setKindPick(true);
      }
    }, React.createElement(P3SIcon, {
      name: "polygon",
      size: 15
    }), "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E23\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"),
    go: () => {
      setTool("roof");
      if (!roofs.length) setKindPick(true);
    }
  }, {
    t: "สิ่งบดบัง",
    k: "obs",
    tools: ["obs"],
    done: (st.obstacles || []).length > 0 || !!wizSeen.obs,
    opt: true,
    d: React.createElement("span", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E19\u0E34\u0E14 \u0E41\u0E25\u0E49\u0E27", React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E1A\u0E19\u0E1C\u0E31\u0E07"), " = \u0E02\u0E19\u0E32\u0E14\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A"), "\u0E15\u0E32\u0E21\u0E02\u0E19\u0E32\u0E14\u0E08\u0E23\u0E34\u0E07 (\u0E23\u0E32\u0E27\u0E01\u0E31\u0E19\u0E15\u0E01/\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19/\u0E0A\u0E48\u0E2D\u0E07\u0E41\u0E2A\u0E07 = ", React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01\u0E17\u0E35\u0E25\u0E30\u0E08\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2A\u0E49\u0E19"), " \xB7 \u0E1A\u0E31\u0E19\u0E44\u0E14\u0E25\u0E34\u0E07 = ", React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), ") \xB7 \u0E17\u0E33", React.createElement("b", null, "\u0E01\u0E48\u0E2D\u0E19\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07"), " \u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E17\u0E31\u0E1A\u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E07 \xB7 ", React.createElement("b", null, "Shift"), " + \u0E41\u0E15\u0E30 = \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E32\u0E22\u0E0A\u0E34\u0E49\u0E19 (\u0E17\u0E33\u0E0B\u0E49\u0E33/\u0E25\u0E1A/\u0E25\u0E32\u0E01\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19) \xB7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E47\u0E01\u0E14\u0E16\u0E31\u0E14\u0E44\u0E1B"),
    act: React.createElement("div", {
      className: "p3s-row",
      style: {
        flexWrap: "wrap",
        gap: 6
      }
    }, P3S_OBS.map(([k, lb]) => React.createElement("button", {
      key: k,
      className: "p3s-btn" + (obsType === k && tool === "obs" ? " pri" : ""),
      style: {
        flex: "1 1 30%",
        padding: "0 6px",
        fontSize: 12.5
      },
      onMouseEnter: e => {
        if (!coarse) setObsHov({
          k,
          r: e.currentTarget.getBoundingClientRect()
        });
      },
      onMouseLeave: () => setObsHov(null),
      onClick: () => {
        setObsType(k);
        setTool("obs");
        setSel(null);
        setObsPts(null);
        setObsMsg(null);
      }
    }, lb)), obsPts && React.createElement("div", {
      className: "p3s-row",
      style: {
        flex: "1 1 100%",
        gap: 6
      }
    }, React.createElement("button", {
      className: "p3s-btn pri",
      style: {
        flex: 2
      },
      disabled: obsPts.length < 2,
      onClick: finishObsLine
    }, React.createElement(P3Icon, {
      name: "check"
    }), "\u0E08\u0E1A\u0E40\u0E2A\u0E49\u0E19 (", obsPts.length, " \u0E08\u0E38\u0E14)"), React.createElement("button", {
      className: "p3s-btn",
      style: {
        flex: 1
      },
      onClick: () => setObsPts(obsPts.length > 1 ? obsPts.slice(0, -1) : null)
    }, "\u0E16\u0E2D\u0E22\u0E08\u0E38\u0E14"), React.createElement("button", {
      className: "p3s-btn dngr",
      style: {
        flex: 1
      },
      onClick: () => {
        setObsPts(null);
        setCur(null);
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), obsMsg && React.createElement("span", {
      className: "p3s-badge warn",
      style: {
        flex: "1 1 100%"
      }
    }, obsMsg)),
    go: () => setTool("obs")
  }, {
    t: "วางแผง ทีละหลังคา",
    tools: ["panel"],
    done: total > 0,
    d: !panelOk ? React.createElement("span", null, React.createElement("b", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07\u0E01\u0E48\u0E2D\u0E19"), " \u2014 \u0E02\u0E19\u0E32\u0E14\u0E41\u0E1C\u0E07\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E23\u0E38\u0E48\u0E19\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E27\u0E48\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E27\u0E32\u0E07\u0E44\u0E14\u0E49\u0E01\u0E35\u0E48\u0E41\u0E1C\u0E48\u0E19 \xB7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E40\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E43\u0E0A\u0E49\u0E02\u0E19\u0E32\u0E14\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19") : React.createElement("span", null, React.createElement("b", null, "\u0E01\u0E14\u0E04\u0E49\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " \u0E41\u0E1C\u0E07\u0E02\u0E36\u0E49\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E19\u0E01\u0E23\u0E2D\u0E1A \xB7 ", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E40\u0E1E\u0E34\u0E48\u0E21"), " = \u0E27\u0E32\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 (\u0E0A\u0E34\u0E14\u0E01\u0E31\u0E19\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E2B\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19\u0E41\u0E22\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21) \xB7 \u0E25\u0E32\u0E01\u0E04\u0E25\u0E38\u0E21\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 = \u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01 \xB7 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 ", React.createElement("b", null, "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E40\u0E15\u0E47\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), " \xB7 \u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07 = \u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30\u0E41\u0E1C\u0E48\u0E19"),
    extra: React.createElement(React.Fragment, null, React.createElement("div", {
      className: "p3s-fld",
      style: {
        gap: 6,
        padding: 10,
        borderRadius: 12,
        background: panelOk ? "var(--surface2)" : "var(--tint-green-bg,#ecfdf5)"
      }
    }, React.createElement("span", {
      className: "lb"
    }, React.createElement("b", null, "1. \u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07"), panelOk ? " · " + (+st.wp || 650) + " W" : " — เลือกก่อนวางแผง"), React.createElement(P3PanelPick, {
      model: (st.sys || {}).panelModel,
      onPick: m => {
        setPanelModel(m);
        if (m) markSeen("pmod");
      }
    }), !(st.sys || {}).panelModel && React.createElement(P3SNum, {
      label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 (\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07)",
      unit: "W/\u0E41\u0E1C\u0E07",
      step: 5,
      min: 100,
      max: 1000,
      digits: 0,
      value: +st.wp || 650,
      onChange: v => commit({
        wp: v
      }, "wp")
    }), !panelOk && React.createElement("button", {
      className: "p3s-btn wide",
      onClick: () => markSeen("pmod")
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 \xB7 \u0E43\u0E0A\u0E49 ", +st.wp || 650, " W \u0E02\u0E19\u0E32\u0E14\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19")), panelOk && roofs.length > 0 && React.createElement("div", {
      className: "p3s-fld",
      style: {
        gap: 5
      }
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u2014 \u0E41\u0E15\u0E30\u0E41\u0E25\u0E49\u0E27\u0E1C\u0E31\u0E07\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E19\u0E31\u0E49\u0E19", emptyRoofs.length ? " · ยังไม่มีแผง " + emptyRoofs.length + " หลัง (สีส้ม)" : ""), React.createElement("div", {
      className: "chips"
    }, roofs.slice(0, 40).map(r => {
      const on = selRoof && selRoof.id === r.id,
        empty = emptyRoofs.indexOf(r) >= 0;
      return React.createElement("button", {
        key: r.id,
        className: "p3s-btn" + (on ? " pri" : ""),
        style: !on && empty ? {
          color: "#b45309"
        } : null,
        onClick: () => {
          setTool("panel");
          pickRoof(r);
        }
      }, r.name || "หลังคา");
    })))),
    go: () => {
      setTool("panel");
      const r = emptyRoofs[0] || roofs[0];
      if (r && panelOk) pickRoof(r);else clearPick();
    }
  }, {
    t: "ตรวจ 3D และเงา แล้วบันทึก",
    k: "fin",
    tools: [],
    done: total > 0 && !!wizSeen.fin && !dirty,
    d: React.createElement("span", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32 \u0E14\u0E39\u0E40\u0E07\u0E32\u0E17\u0E35\u0E48\u0E15\u0E01\u0E1A\u0E19\u0E41\u0E1C\u0E07 (\u0E15\u0E23\u0E27\u0E08\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21\u0E40\u0E2A\u0E21\u0E2D) \xB7 \u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 ", React.createElement("b", null, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")),
    act: React.createElement(React.Fragment, null, React.createElement("div", {
      className: "p3s-sec"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E21\u0E38\u0E21\u0E01\u0E25\u0E49\u0E2D\u0E07", !view3d && React.createElement("em", null, "\u0E41\u0E15\u0E30\u0E41\u0E25\u0E49\u0E27\u0E40\u0E1B\u0E34\u0E14 3D \u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07")), React.createElement("div", {
      className: "p3s-cams"
    }, [["bird", "มุมนก"], ["front", "หน้าอาคาร"], ["top", "มุมบน"], ["close", "ใกล้แผง"]].map(([k, lb]) => React.createElement("button", {
      key: k,
      type: "button",
      "data-on": view3d && camK === k ? "1" : "0",
      disabled: vidOn || k === "close" && !total,
      title: k === "close" && !total ? "ยังไม่มีแผง" : lb,
      onClick: () => camGo(k)
    }, React.createElement(P3SCamGlyph, {
      k: k
    }), lb)))), React.createElement("div", {
      className: "p3s-sec"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E41\u0E2A\u0E07\u0E2A\u0E27\u0E22"), React.createElement("div", {
      className: "p3s-lights"
    }, [[9, "am", "แสงเช้า", "9:00 น. · แสงใส"], [16.5, "pm", "แสงเย็น", "16:30 น. · โทนอุ่น"]].map(([h, k, lb, sub]) => React.createElement("button", {
      key: k,
      type: "button",
      "data-k": k,
      "data-on": sunHour == null && Math.abs((+st.sun.hour || 0) - h) < 0.01 ? "1" : "0",
      disabled: vidOn,
      onClick: () => {
        setSunHour(null);
        commit(x => Object.assign({}, x, {
          sun: Object.assign({}, x.sun, {
            hour: h
          })
        }), "shour");
      }
    }, React.createElement(P3SCamGlyph, {
      k: k
    }), React.createElement("span", null, React.createElement("b", null, lb), React.createElement("small", null, sub)))))), React.createElement("div", {
      className: "p3s-sec"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E1E"), React.createElement("button", {
      type: "button",
      className: "p3s-btn pri p3s-cta",
      disabled: vidOn,
      onClick: shotGo
    }, React.createElement(P3SCamGlyph, {
      k: "cam"
    }), React.createElement("span", {
      className: "ct"
    }, React.createElement("b", null, "\u0E16\u0E48\u0E32\u0E22\u0E20\u0E32\u0E1E 4K"), React.createElement("small", null, "3840\xD72160 (16:9) \xB7 \u0E0B\u0E48\u0E2D\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E0A\u0E48\u0E27\u0E22\u0E27\u0E32\u0E14\u0E41\u0E25\u0E30\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E08\u0E33\u0E25\u0E2D\u0E07"))), React.createElement("label", {
      className: "p3s-row",
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, React.createElement("input", {
      type: "checkbox",
      checked: shotInfo,
      onChange: e => {
        const v = e.target.checked;
        setShotInfo(v);
        try {
          localStorage.setItem("p3s_shotInfo", v ? "1" : "0");
        } catch (er) {}
      }
    }), "\u0E43\u0E2A\u0E48\u0E42\u0E25\u0E42\u0E01\u0E49 \xB7 \u0E0A\u0E37\u0E48\u0E2D\u0E07\u0E32\u0E19 \xB7 \u0E02\u0E19\u0E32\u0E14\u0E23\u0E30\u0E1A\u0E1A \u0E1A\u0E19\u0E20\u0E32\u0E1E"), React.createElement("button", {
      type: "button",
      className: "p3s-btn wide p3s-vid" + (vidOn ? " on" : ""),
      style: vidOn ? {
        "--pc": Math.round(((sunHour || 5.5) - 5.5) / 14 * 100) + "%"
      } : null,
      onClick: vidOn ? stopVideo : () => with3D(A => {
        takeVideo();
        return true;
      })
    }, React.createElement(P3Icon, {
      name: vidOn ? "pause" : "play"
    }), vidOn ? "กำลังอัด " + Math.round(((sunHour || 5.5) - 5.5) / 14 * 100) + "% · แตะเพื่อหยุด" : "อัดวิดีโอเงาทั้งวัน · จอเต็ม"), mediaMsg && React.createElement("span", {
      className: "p3s-badge warn"
    }, mediaMsg)), React.createElement("div", {
      className: "p3s-savebar"
    }, React.createElement("span", {
      className: "st" + (dirty ? " dirty" : "")
    }, React.createElement("i", null), dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "บันทึกครบแล้ว"), React.createElement("button", {
      type: "button",
      className: "p3s-btn pri",
      disabled: !dirty,
      onClick: () => {
        markSeen("fin");
        doSave();
      }
    }, React.createElement(P3Icon, {
      name: "save"
    }), dirty ? "บันทึก" : "บันทึกแล้ว"))),
    go: () => {
      setView3d(true);
      setToolRaw("select");
      setDraw(null);
      setMeasPts(null);
      setTrace(null);
      setCalib(null);
      markSeen("fin");
    }
  }, {
    t: "ออกแบบระบบ · ผลผลิต",
    k: "sys",
    tools: [],
    done: !!(st.sys && (st.sys.invModel || st.sys.mode === "micro")),
    d: React.createElement("span", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E08\u0E31\u0E14\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E14\u0E39\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35\u0E41\u0E25\u0E30\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E41\u0E1C\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u2014 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49"),
    act: React.createElement(React.Fragment, null, (() => {
      const S = st.sys || {},
        inv = S.mode === "micro" ? "ไมโครอินเวอร์เตอร์" : S.invModel ? S.invModel + " × " + (S.invCount || 1) + (S.inv2Model && S.inv2Count ? " + " + S.inv2Model + " × " + S.inv2Count : "") : "ยังไม่ได้เลือก";
      return React.createElement("div", {
        className: "p3s-stat"
      }, React.createElement("div", null, React.createElement("div", {
        className: "l"
      }, "\u0E41\u0E1C\u0E07"), React.createElement("div", {
        className: "v"
      }, total, " \u0E41\u0E1C\u0E07 \xB7 ", p3sR(total * (+st.wp || 650) / 1000, 100), " kWp")), React.createElement("div", null, React.createElement("div", {
        className: "l"
      }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("div", {
        className: "v",
        style: {
          fontSize: 12.5
        }
      }, inv)));
    })(), React.createElement("button", {
      type: "button",
      className: "p3s-btn pri p3s-cta",
      disabled: !total,
      onClick: openSys
    }, React.createElement(P3Icon, {
      name: "grid",
      size: 16
    }), React.createElement("span", {
      className: "ct"
    }, React.createElement("b", null, "\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("small", null, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \xB7 \u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 \xB7 \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"))), !total && React.createElement("span", {
      className: "p3s-badge warn"
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E1C\u0E07 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E02\u0E31\u0E49\u0E19\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E01\u0E48\u0E2D\u0E19"), mediaMsg && React.createElement("span", {
      className: "p3s-badge warn"
    }, mediaMsg)),
    go: () => {
      setToolRaw("select");
      setDraw(null);
      setTrace(null);
      if (total) openSys();
    }
  }];
  let reach = 0;
  while (reach < WIZ.length - 1 && WIZ[reach].done) reach++;
  if (wizStep == null) {
    setWizStep(reach);
    if (reach === 3) {
      setToolRaw("roof");
      if (!roofs.length) setKindPick(true);
    }
  }
  const wi = wizStep != null ? Math.min(wizStep, reach) : reach,
    W0 = WIZ[wi];
  const canNext = W0.done || W0.opt;
  const clearPick = () => {
    setSel(null);
    setMulti([]);
    setSelVert(null);
    setSelBlk(null);
    setSelWalk(null);
  };
  const goStep = i => {
    if (i < 0 || i >= WIZ.length) return;
    if (i !== wi) clearPick();
    setWizStep(i);
    WIZ[i].go();
  };
  const nextStep = () => {
    if (!canNext) return;
    markSeen(W0.k || wi);
    clearPick();
    setWizStep(wi + 1);
    WIZ[wi + 1] && WIZ[wi + 1].go();
  };
  const finStep = wiz && W0.k === "fin";
  const wizCard = wiz && React.createElement("div", {
    className: "p3s-card p3s-wiz"
  }, React.createElement("div", {
    className: "p3s-h"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E1E\u0E32\u0E17\u0E33\u0E17\u0E35\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19 \xB7 \u0E02\u0E31\u0E49\u0E19 ", wi + 1, "/", WIZ.length)), React.createElement("div", {
    className: "dots"
  }, WIZ.map((w, i) => React.createElement("button", {
    key: i,
    className: "dot",
    "data-on": i === wi ? "1" : "0",
    "data-done": w.done ? "1" : "0",
    disabled: i > reach,
    title: i > reach ? w.t + " — ทำขั้นก่อนหน้าให้เสร็จก่อน" : w.t,
    onClick: () => {
      if (i <= reach) goStep(i);
    }
  }, w.done && i !== wi ? "✓" : i + 1))), React.createElement("span", {
    className: "wt"
  }, wi + 1, ". ", W0.t, W0.done ? " ✓" : ""), React.createElement("span", {
    className: "wd"
  }, W0.d), W0.extra || null, W0.list || null, W0.act || null);
  const wizNav = wiz && React.createElement("div", {
    className: "p3s-wiznav"
  }, React.createElement("div", {
    className: "p3s-row"
  }, React.createElement("button", {
    className: "p3s-btn",
    disabled: wi === 0,
    onClick: () => goStep(wi - 1)
  }, "\u2190 \u0E22\u0E49\u0E2D\u0E19"), wi < WIZ.length - 1 ? React.createElement("button", {
    className: "p3s-btn" + (canNext ? " pri" : ""),
    style: {
      flex: 1
    },
    disabled: !canNext,
    onClick: nextStep
  }, !W0.done && W0.opt ? "ไม่มี · " : "ถัดไป · ", WIZ[wi + 1].t, " \u2192") : React.createElement("span", {
    className: "p3s-note keep",
    style: {
      flex: 1,
      textAlign: "right"
    }
  }, WIZ.every(w => w.done || w.skip) ? "เสร็จครบทุกขั้น" : "ยังมีขั้นที่ไม่เสร็จ — ดูเลขที่ไม่มี ✓")), !canNext && wi < WIZ.length - 1 && React.createElement("span", {
    className: "p3s-note keep"
  }, "\u0E17\u0E33\u0E02\u0E31\u0E49\u0E19\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E44\u0E1B\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49 \xB7 \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E02\u0E31\u0E49\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E21\u0E2D"));
  const wizTools = wiz && !view3d ? W0.tools : null;
  wizHomeRef.current = wiz ? W0.tools[0] || null : null;
  const roofStep = wiz && wi === 3 && !view3d;
  const noPanUI = wiz && wi < 5;
  const panOnly = wiz && wi >= 5;
  wizAllowRef.current = wiz ? W0.tools.length ? ["pan"].concat(W0.tools, wi >= 3 ? ["select"] : []) : ["select", "pan"] : null;
  if (wiz && wi === 5 && !panelOk && sel && sel.t === "roof") setSel(null);
  pickRef.current = wiz ? {
    3: {
      roof: 2
    },
    4: {
      obs: 2
    },
    5: {
      roof: 1
    }
  }[wi] || {} : null;
  const hk = wizHomeRef.current,
    hT = P3S_TOOLS.find(t => t.k === hk);
  const ftList = (hT && hk !== "select" && hk !== "pan" ? [[hk, hT.ic, hT.lb]] : []).concat([["select", "cursor", "ย้าย (V)"], ["pan", "hand", "เลื่อนภาพ (H)"]]);
  const modeTxt = tool === "obs" ? "วาง" + p3sObsName({
    p3sType: obsType
  }) : tool === "panel" && panGateRef.current ? "วางแผง · เลือกรุ่นแผงก่อน" : {
    select: "เลือก / ย้าย",
    pan: "เลื่อนภาพ",
    area: "กำหนดพื้นที่ติดตั้ง",
    axis: "ตั้งแนวหลังคา",
    roof: "วาดหลังคา",
    panel: "วางแผง · ลากกรอบ",
    walk: "วาดทางเดิน",
    meas: "วัดระยะ",
    bg: "จัดภาพพื้น"
  }[tool] || tool;
  const guidePanel = React.createElement(React.Fragment, null, React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: onPickPhoto
  }), wiz ? null : React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("div", {
    className: "p3s-h"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19"), React.createElement("button", {
    className: "p3s-btn pri",
    style: {
      marginLeft: "auto",
      height: 26,
      padding: "0 10px",
      fontSize: 11.5
    },
    onClick: () => setWizStep(null)
  }, "\u0E1E\u0E32\u0E17\u0E33\u0E17\u0E35\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19")), [{
    done: !!(st.baseMap || st.photo),
    t: "ภาพมุมสูง",
    d: "ภาพดาวเทียมจากแผนที่ หรือรูปโดรน (ข้ามได้ถ้าวาดจากขนาดที่วัดมา)",
    act: React.createElement("div", {
      className: "p3s-row"
    }, React.createElement("button", {
      className: "p3s-btn",
      onClick: () => setMapOpen(true)
    }, React.createElement(P3Icon, {
      name: "map"
    }), "\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21"), React.createElement("button", {
      className: "p3s-btn",
      onClick: () => fileRef.current && fileRef.current.click()
    }, React.createElement(P3Icon, {
      name: "camera"
    }), "\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19"))
  }, {
    done: axisDeg != null,
    t: "ตั้งแนวหลังคา",
    d: "ให้ผังหมุนตามอาคารจริง — กดหาแนวอัตโนมัติ หรือลากเส้นทับขอบชายคา",
    act: React.createElement("button", {
      className: "p3s-btn",
      onClick: () => setTool("axis")
    }, React.createElement(P3SIcon, {
      name: "axis",
      size: 16
    }), "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E19\u0E27 (A)")
  }, {
    done: roofs.length > 0,
    t: "วาดหลังคา",
    d: "เลือกทรง ราบ/เพิง/จั่ว/ปั้นหยา หรือวาดทีละผืน แล้วลากทับ — หรือแตะกลางหลังคาให้ระบบหาขอบ",
    act: React.createElement("button", {
      className: "p3s-btn",
      onClick: () => setTool("roof")
    }, React.createElement(P3SIcon, {
      name: "polygon",
      size: 16
    }), "\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (R)")
  }, {
    done: total > 0,
    t: "วางแผง + ทางเดิน",
    d: "แผงเติมเต็มให้เอง จัดเป็นกลุ่มเว้นทางเดิน หรือวาดทางเดินเอง (W) แล้วแตะปิดแผงที่ไม่ต้องการ",
    act: React.createElement("button", {
      className: "p3s-btn",
      onClick: () => setTool("panel")
    }, React.createElement(P3SIcon, {
      name: "panel",
      size: 16
    }), "\u0E08\u0E31\u0E14\u0E41\u0E1C\u0E07 (P)")
  }, {
    done: false,
    t: "ตรวจ 3D และเงา",
    d: "หมุนดูรอบ ๆ และกวาดดูเงาทั้งวัน แล้วกดบันทึก",
    act: React.createElement("button", {
      className: "p3s-btn",
      onClick: () => {
        setView3d(true);
        setToolRaw("select");
      }
    }, React.createElement(P3Icon, {
      name: "cube"
    }), "\u0E14\u0E39 3D")
  }].map((s, i) => React.createElement("div", {
    key: i,
    className: "p3s-step",
    "data-done": s.done ? "1" : "0"
  }, React.createElement("span", {
    className: "no"
  }, s.done ? "✓" : i + 1), React.createElement("div", {
    className: "bd"
  }, React.createElement("span", {
    className: "tt"
  }, s.t), React.createElement("span", {
    className: "ds"
  }, s.d), s.act)))), noPanUI || wiz ? null : React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("div", {
    className: "p3s-h"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07"), React.createElement("span", {
    className: "p3s-badge"
  }, st.wp || 650, " W")), React.createElement(P3PanelPick, {
    model: (st.sys || {}).panelModel,
    onPick: setPanelModel
  }), React.createElement(P3SNum, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07",
    unit: "W/\u0E41\u0E1C\u0E07",
    step: 5,
    min: 100,
    max: 1000,
    digits: 0,
    value: +st.wp || 650,
    onChange: v => commit({
      wp: v
    }, "wp")
  })), roofs.length > 0 && !noPanUI && React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("div", {
    className: "p3s-h"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (", roofs.length, ")")), React.createElement("div", {
    className: "p3s-list"
  }, roofs.map(r => React.createElement("button", {
    key: r.id,
    className: "p3s-li",
    onClick: () => {
      setSel({
        t: "roof",
        id: r.id
      });
      const c = p3sRoofCenter(r);
      setView(Object.assign({}, viewRef.current, {
        cx: c.x,
        cz: c.z
      }));
    }
  }, React.createElement(P3Icon, {
    name: "roof"
  }), r.name || "หลังคา", React.createElement("small", null, roofCountOf(r), " \u0E41\u0E1C\u0E07"))))));
  const mediaName = ext => (job && (job.name || job.code || job.id) || "solar").replace(/[\\/:*?"<>|]+/g, " ").trim() + " · 3D " + new Date().toISOString().slice(0, 10) + "." + ext;
  const saveHref = (href, name) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  function with3D(fn) {
    clearInterval(camTimer.current);
    const fresh = !view3d || !v3api.current;
    if (!view3d) {
      setView3d(true);
      setToolRaw("select");
    }
    let n = 0;
    const tryIt = () => {
      const A = v3api.current;
      if (A && (!A.ready || A.ready()) && fn(A, fresh) !== false) {
        clearInterval(camTimer.current);
        return true;
      }
      if (++n > 50) {
        clearInterval(camTimer.current);
        setMediaMsg("เปิดมุมมอง 3D ไม่ทัน ลองกดอีกครั้ง");
      }
      return false;
    };
    if (!fresh && tryIt()) return;
    camTimer.current = setInterval(tryIt, 100);
  }
  function camGo(k) {
    setMediaMsg(null);
    setCamK(k);
    with3D(A => A.view(k));
  }
  function openSys() {
    setMediaMsg(null);
    with3D((A, fresh) => {
      setTimeout(() => setSysOpen(true), fresh ? 700 : 0);
      return true;
    });
  }
  function sysFlush() {
    if (sysT.current) {
      clearTimeout(sysT.current);
      sysT.current = null;
      save(JSON.parse(JSON.stringify(stRef.current)));
    }
  }
  function sysChange(sys) {
    const wp = scNum((scPanelSpec(sys) || {}).wp, 0);
    const next = Object.assign({}, stRef.current, wp ? {
      sys,
      wp
    } : {
      sys
    });
    stRef.current = next;
    setStRaw(next);
    if (sysT.current) clearTimeout(sysT.current);
    sysT.current = setTimeout(sysFlush, 900);
  }
  function sysSnap() {
    const A = v3api.current;
    if (!A || !A.gl) return null;
    try {
      A.gl.render(A.scene, A.cam);
      return A.gl.domElement.toDataURL("image/jpeg", 0.86);
    } catch (e) {
      return null;
    }
  }
  function shotGo() {
    with3D((A, fresh) => {
      if (fresh) setTimeout(takeShot, 700);else takeShot();
      return true;
    });
  }
  function takeShot() {
    const A = v3api.current;
    if (!A) {
      setMediaMsg("เปิดมุมมอง 3D ก่อน");
      return;
    }
    setMediaMsg(null);
    try {
      saveHref(A.shot(shotInfo ? {
        info: shotInfoData()
      } : null), mediaName("png"));
    } catch (e) {
      setMediaMsg("ถ่ายภาพไม่ได้: " + e.message);
    }
  }
  function shotInfoData() {
    const MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const pm = (st.sys || {}).panelModel,
      pmn = typeof pm === "string" ? pm : pm && (pm.model || pm.name) || "";
    const h = +sun.hour || 12,
      hh = Math.floor(h),
      mm = Math.round((h - hh) * 60);
    const nm = job && job.name || "",
      cd = job && job.code || "";
    return {
      title: nm || cd || "ระบบโซลาร์เซลล์",
      sub: [nm && cd ? cd : "", total ? "ระบบ " + kwp + " kWp" : "", total ? total + " แผง" : "", pmn].filter(Boolean).join(" · "),
      note: "จำลองแสงแดด " + (+sun.day || 15) + " " + MON[((+sun.month || 4) - 1 + 12) % 12] + " · " + hh + ":" + String(mm).padStart(2, "0") + " น."
    };
  }
  function takeVideo() {
    const A = v3api.current;
    if (!A) {
      setMediaMsg("เปิดมุมมอง 3D ก่อน");
      return;
    }
    setMediaMsg(null);
    if (!wide3d) {
      vidWideRef.current = true;
      setWide3d(true);
      setTimeout(startVideo, 350);
      return;
    }
    startVideo();
  }
  function startVideo() {
    const A = v3api.current;
    if (!A) {
      setMediaMsg("เปิดมุมมอง 3D ก่อน");
      return;
    }
    try {
      vidRef.current = A.record();
    } catch (e) {
      setMediaMsg(e.message || "อัดวิดีโอไม่ได้");
      return;
    }
    setVidOn(true);
    setSunHour(null);
    setTimeout(() => setSunHour(5.5), 30);
  }
  function finishVideo(R) {
    setVidOn(false);
    setSunHour(null);
    if (vidWideRef.current) {
      vidWideRef.current = false;
      setWide3d(false);
    }
    R.stop().then(({
      blob,
      ext
    }) => {
      const url = URL.createObjectURL(blob);
      saveHref(url, mediaName(ext));
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  }
  function stopVideo() {
    const R = vidRef.current;
    vidRef.current = null;
    if (R) finishVideo(R);
  }
  if (!view3d && camK) setCamK(null);
  if (tapPick && (!selObs || selObs.id !== tapPick || view3d)) setTapPick(null);
  if (!view3d && wide3d) setWide3d(false);
  const sunPanel = (() => {
    const MONF = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
      mon = st.sun.month || 4;
    const setMon = m => commit(x => Object.assign({}, x, {
      sun: Object.assign({}, x.sun, {
        month: m
      })
    }), "smon");
    const hm = h => {
      const hh = Math.floor(h),
        mm = Math.round((h - hh) * 60);
      return (mm === 60 ? hh + 1 : hh) + ":" + (mm === 60 || mm < 10 ? "0" : "") + (mm === 60 ? 0 : mm) + " น.";
    };
    const sp = p3SunPos(sun);
    let rise = null,
      set = null;
    for (let h = 4; h <= 20; h += 1 / 12) {
      if (p3SunPos(Object.assign({}, sun, {
        hour: h
      })).alt > 0) {
        if (rise == null) rise = h;
        set = h;
      }
    }
    return React.createElement("div", {
      className: "p3s-card"
    }, React.createElement("span", {
      className: "p3s-ttl2"
    }, React.createElement(P3Icon, {
      name: "sunShadow",
      size: 17
    }), "\u0E41\u0E14\u0E14\u0E41\u0E25\u0E30\u0E40\u0E07\u0E32"), React.createElement("div", {
      className: "p3s-fld"
    }, React.createElement("span", {
      className: "lb"
    }, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("div", {
      className: "p3s-monnav"
    }, React.createElement("button", {
      type: "button",
      className: "p3s-btn",
      onClick: () => setMon(mon === 1 ? 12 : mon - 1),
      "aria-label": "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19"
    }, "\u2039"), React.createElement("b", null, MONF[mon - 1]), React.createElement("button", {
      type: "button",
      className: "p3s-btn",
      onClick: () => setMon(mon === 12 ? 1 : mon + 1),
      "aria-label": "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B"
    }, "\u203A"))), React.createElement(P3SRange, {
      label: "\u0E40\u0E27\u0E25\u0E32",
      right: hm(sun.hour),
      min: 5,
      max: 20,
      step: 0.25,
      value: p3sClamp(sun.hour, 5, 20),
      onChange: v => {
        setSunHour(null);
        commit(x => Object.assign({}, x, {
          sun: Object.assign({}, x.sun, {
            hour: v
          })
        }), "shour");
      }
    }), React.createElement("div", {
      className: "p3s-row",
      style: {
        gap: 6,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      className: "p3s-badge" + (sp.alt > 0 ? " ok" : "")
    }, sp.alt > 0 ? "ดวงอาทิตย์สูง " + Math.round(sp.alt) + "° · ทาง" + p3sCompass(sp.az) : "กลางคืน · ดวงอาทิตย์ตกแล้ว"), rise != null && React.createElement("span", {
      className: "p3s-note keep"
    }, "\u0E02\u0E36\u0E49\u0E19 ", hm(rise), " \xB7 \u0E15\u0E01 ", hm(set))), React.createElement("button", {
      className: "p3s-btn wide" + (sunHour != null ? " pri" : ""),
      disabled: vidOn,
      onClick: () => setSunHour(sunHour != null ? null : 5.5)
    }, React.createElement(P3Icon, {
      name: sunHour != null ? "pause" : "play"
    }), sunHour != null ? "หยุด" : "กวาดดูเงาทั้งวัน (5:30–19:30)"), React.createElement("span", {
      className: "p3s-note"
    }, "\u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E35\u0E2A\u0E49\u0E21\u0E1A\u0E19\u0E1F\u0E49\u0E32 = \u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E17\u0E31\u0E49\u0E07\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 \xB7 \u0E40\u0E14\u0E37\u0E2D\u0E19\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21\u0E41\u0E14\u0E14\u0E2D\u0E49\u0E2D\u0E21\u0E43\u0E15\u0E49\u0E21\u0E32\u0E01\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E40\u0E07\u0E32\u0E15\u0E49\u0E19\u0E44\u0E21\u0E49/\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E22\u0E32\u0E27\u0E2A\u0E38\u0E14 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49\u0E40\u0E2A\u0E21\u0E2D"));
  })();
  const axisPanel = React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3SIcon, {
    name: "axis",
    size: 17
  }), "\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (\u0E40\u0E2A\u0E49\u0E19\u0E19\u0E33\u0E2A\u0E32\u0E22\u0E15\u0E32)"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07\u0E41\u0E17\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E27\u0E32\u0E07\u0E15\u0E23\u0E07\u0E17\u0E34\u0E28\u0E40\u0E2B\u0E19\u0E37\u0E2D\u2013\u0E43\u0E15\u0E49 \u0E15\u0E31\u0E49\u0E07\u0E41\u0E19\u0E27\u0E01\u0E48\u0E2D\u0E19\u0E27\u0E32\u0E14 \u0E41\u0E25\u0E49\u0E27", React.createElement("b", null, "\u0E1C\u0E31\u0E07\u0E08\u0E30\u0E2B\u0E21\u0E38\u0E19\u0E43\u0E2B\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E23\u0E07\u0E08\u0E2D"), " \u2014 \u0E25\u0E32\u0E01\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21 \u0E40\u0E2A\u0E49\u0E19\u0E09\u0E32\u0E01 \u0E01\u0E23\u0E34\u0E14 \u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E14\u0E39\u0E14\u0E41\u0E19\u0E27 \u0E08\u0E30\u0E15\u0E32\u0E21\u0E41\u0E19\u0E27\u0E19\u0E35\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E17\u0E34\u0E28\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07\u0E22\u0E31\u0E07\u0E04\u0E34\u0E14\u0E16\u0E39\u0E01\u0E40\u0E2A\u0E21\u0E2D"), React.createElement("div", {
    className: "p3s-stat"
  }, React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement("div", {
    className: "l"
  }, "\u0E41\u0E19\u0E27\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), React.createElement("div", {
    className: "v"
  }, axisDeg != null ? p3sR(axisDeg, 10) + "°" : "ยังไม่ตั้ง"))), axisMsg && React.createElement("span", {
    className: "p3s-note keep"
  }, React.createElement("b", null, axisMsg)), React.createElement("button", {
    className: "p3s-btn pri big wide",
    disabled: !(st.baseMap && st.baseMap.url || st.photo),
    onClick: autoAxis
  }, React.createElement(P3SIcon, {
    name: "magic",
    size: 17
  }), "\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E08\u0E32\u0E01\u0E20\u0E32\u0E1E\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), React.createElement("span", {
    className: "p3s-note"
  }, "\u2022 ", React.createElement("b", null, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), ": \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E22\u0E39\u0E48\u0E01\u0E25\u0E32\u0E07\u0E08\u0E2D\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E48\u0E32\u0E19\u0E17\u0E34\u0E28\u0E02\u0E2D\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E02\u0E2D\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E43\u0E19\u0E20\u0E32\u0E1E (\u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A\u0E2A\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32)", React.createElement("br", null), "\u2022 ", React.createElement("b", null, "\u0E25\u0E32\u0E01\u0E40\u0E2D\u0E07"), ": \u0E25\u0E32\u0E01\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E31\u0E1A\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32\u0E17\u0E35\u0E48\u0E22\u0E32\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E20\u0E32\u0E1E", React.createElement("br", null), "\u2022 ", React.createElement("b", null, "\u0E08\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), ": \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E35\u0E48\u0E27\u0E32\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E14 \"\u0E43\u0E0A\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E19\u0E27\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\""), axisDeg != null && React.createElement(React.Fragment, null, React.createElement(P3SNum, {
    label: "\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
    unit: "\xB0",
    step: 0.5,
    min: -45,
    max: 45,
    digits: 1,
    value: axisDeg,
    onChange: v => setAxis(v)
  }), React.createElement("div", {
    className: "p3s-row"
  }, React.createElement("button", {
    className: "p3s-btn" + (alignView ? " pri" : ""),
    style: {
      flex: 1
    },
    onClick: () => setAlignView(v => !v)
  }, alignView ? "ผังหมุนตามแนว" : "ทิศเหนือขึ้นบน"), React.createElement("button", {
    className: "p3s-btn dngr",
    onClick: () => setAxis(null)
  }, "\u0E25\u0E49\u0E32\u0E07\u0E41\u0E19\u0E27")), React.createElement("button", {
    className: "p3s-btn wide",
    onClick: () => setTool("roof")
  }, React.createElement(P3SIcon, {
    name: "polygon",
    size: 16
  }), "\u0E44\u0E1B\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (R)")));
  const walkSel = selWalk ? (() => {
    const r = roofs.find(x => x.id === selWalk.roofId);
    const wk = r && (r.walks || []).find(x => x.id === selWalk.id);
    return wk ? {
      r,
      wk
    } : null;
  })() : null;
  const walkPanel = React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3SIcon, {
    name: "walk",
    size: 17
  }), "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E08\u0E38\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19/\u0E17\u0E32\u0E07\u0E0B\u0E48\u0E2D\u0E21\u0E1A\u0E33\u0E23\u0E38\u0E07 \u0E14\u0E31\u0E1A\u0E40\u0E1A\u0E34\u0E25\u0E04\u0E25\u0E34\u0E01\u0E2B\u0E23\u0E37\u0E2D Enter \u0E08\u0E1A\u0E40\u0E2A\u0E49\u0E19 \xB7 \u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E17\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E08\u0E30\u0E16\u0E39\u0E01\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 (\u0E19\u0E31\u0E1A\u0E41\u0E1C\u0E07\u0E15\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07) \xB7 \u0E22\u0E49\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E21\u0E38\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E15\u0E32\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22"), !walkSel && React.createElement(P3SNum, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E43\u0E2B\u0E21\u0E48",
    unit: "\u0E21.",
    step: 0.1,
    min: 0.2,
    max: 5,
    value: walkW,
    onChange: setWalkW
  }), walkSel && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3s-badge warn"
  }, "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E1A\u0E19 ", walkSel.r.name || "หลังคา", " \xB7 \u0E22\u0E32\u0E27 ", fmtM(p3MeasLen({
    pts: walkSel.wk.pts || []
  }))), React.createElement(P3SNum, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
    unit: "\u0E21.",
    step: 0.1,
    min: 0.2,
    max: 5,
    value: +walkSel.wk.w || 0.6,
    onChange: v => patchWalk(walkSel.r.id, walkSel.wk.id, {
      w: v
    }, "ww")
  }), React.createElement("button", {
    className: "p3s-btn dngr wide",
    onClick: () => delWalk(walkSel.r.id, walkSel.wk.id)
  }, React.createElement(P3Icon, {
    name: "trash"
  }), "\u0E25\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E19\u0E35\u0E49")), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E2D\u0E22\u0E32\u0E01\u0E40\u0E27\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E17\u0E48\u0E32 \u0E46 \u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E1C\u0E37\u0E19 \u0E43\u0E0A\u0E49 ", React.createElement("b", null, "\u0E08\u0E31\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21 + \u0E40\u0E27\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19"), " \u0E43\u0E19\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E41\u0E1C\u0E07\u0E02\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E41\u0E17\u0E19"));
  let sideBody;
  const cardRoof = wiz && wi === 3 ? null : selRoof;
  if (finStep) sideBody = sunPanel;else if (wiz && W0.k === "sys") sideBody = null;else if (view3d) sideBody = React.createElement(React.Fragment, null, sunPanel, cardRoof ? roofPanelBody(cardRoof) : null);else if (tool === "bg") sideBody = bgPanel;else if (tool === "axis") sideBody = wiz ? null : axisPanel;else if (tool === "walk") sideBody = React.createElement(React.Fragment, null, walkPanel, cardRoof ? roofPanelBody(cardRoof) : null);else if (cardRoof) sideBody = roofPanelBody(cardRoof);else if (selObs) sideBody = obsPanelBody(selObs);else if (selMeas) sideBody = measPanelBody(selMeas);else if (tool === "roof") sideBody = React.createElement("div", {
    className: "p3s-card"
  }, React.createElement("span", {
    className: "p3s-ttl2"
  }, React.createElement(P3SIcon, {
    name: "polygon",
    size: 17
  }), "\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B\u0E23\u0E48\u0E32\u0E07\u0E41\u0E25\u0E30\u0E17\u0E23\u0E07\u0E17\u0E35\u0E48\u0E41\u0E16\u0E1A\u0E1A\u0E19\u0E1C\u0E31\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E27\u0E32\u0E14\u0E17\u0E31\u0E1A\u0E20\u0E32\u0E1E \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19 \u0E17\u0E34\u0E28 \u0E41\u0E01\u0E49\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E27\u0E32\u0E14\u0E40\u0E2A\u0E23\u0E47\u0E08"), React.createElement("span", {
    className: "p3s-note"
  }, "\u2022 ", React.createElement("b", null, "\u0E08\u0E31\u0E48\u0E27 / \u0E1B\u0E31\u0E49\u0E19\u0E2B\u0E22\u0E32"), " = \u0E25\u0E32\u0E01\u0E17\u0E41\u0E22\u0E07\u0E17\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (\u0E2A\u0E31\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E14\u0E49\u0E32\u0E19\u0E22\u0E32\u0E27 \u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07)", React.createElement("br", null), "\u2022 ", React.createElement("b", null, "\u0E17\u0E35\u0E25\u0E30\u0E1C\u0E37\u0E19"), " = \u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E0B\u0E31\u0E1A\u0E0B\u0E49\u0E2D\u0E19 (\u0E15\u0E31\u0E27 L \u0E15\u0E31\u0E27 T \u0E08\u0E31\u0E48\u0E27\u0E0B\u0E49\u0E2D\u0E19) \u0E04\u0E25\u0E34\u0E01\u0E21\u0E38\u0E21\u0E17\u0E35\u0E25\u0E30\u0E1C\u0E37\u0E19\u0E25\u0E32\u0E14 \u0E1C\u0E37\u0E19\u0E15\u0E34\u0E14\u0E01\u0E31\u0E19\u0E14\u0E39\u0E14\u0E02\u0E2D\u0E1A\u0E23\u0E48\u0E27\u0E21\u0E1E\u0E2D\u0E14\u0E35 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E0A\u0E32\u0E22\u0E04\u0E32\u0E43\u0E2B\u0E49", React.createElement("br", null), "\u2022 ", React.createElement("b", null, "\u0E04\u0E25\u0E34\u0E01 3 \u0E04\u0E23\u0E31\u0E49\u0E07"), " = \u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E02\u0E2D\u0E1A\u0E43\u0E19\u0E20\u0E32\u0E1E", React.createElement("br", null), "\u2022 ", React.createElement("b", null, "\u2728 \u0E2B\u0E32\u0E02\u0E2D\u0E1A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), " = \u0E41\u0E15\u0E30\u0E01\u0E25\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E34\u0E07\u0E2B\u0E32\u0E02\u0E2D\u0E1A 4 \u0E17\u0E34\u0E28 \u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A\u0E2A\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), axisDeg == null && !!(st.baseMap || st.photo) && React.createElement("button", {
    className: "p3s-btn wide",
    onClick: () => setTool("axis")
  }, React.createElement(P3SIcon, {
    name: "axis",
    size: 15
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u2014 \u0E15\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19 (A)"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E2A\u0E31\u0E0D\u0E25\u0E31\u0E01\u0E29\u0E13\u0E4C: ", React.createElement("b", {
    style: {
      color: "#06b6d4"
    }
  }, "\u25C7"), " \u0E40\u0E01\u0E32\u0E30\u0E02\u0E2D\u0E1A\u0E43\u0E19\u0E20\u0E32\u0E1E \xB7 ", React.createElement("b", {
    style: {
      color: "#d946ef"
    }
  }, "\u25CB"), " \u0E40\u0E01\u0E32\u0E30\u0E21\u0E38\u0E21/\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30 = \u0E41\u0E19\u0E27\u0E09\u0E32\u0E01 \xB7 \u0E01\u0E14 ", React.createElement("b", null, "Shift"), " = \u0E27\u0E32\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30"), !!(st.baseMap || st.photo) && React.createElement(P3SRange, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E20\u0E32\u0E1E",
    right: Math.round(imgFx.b * 100) + "%",
    min: 0.6,
    max: 2.4,
    step: 0.05,
    value: imgFx.b,
    onChange: v => setImgFx({
      b: v,
      c: v > 1.2 ? 1.3 : 1
    })
  }));else sideBody = guidePanel;
  if (wiz && wi === 3 && !view3d && !selObs && !selMeas) sideBody = null;
  if (wizCard) sideBody = React.createElement(React.Fragment, null, wizCard, sideBody);
  let ctxBar = null;
  if (!view3d && (tool === "roof" || roofStep) && (roofArm || draw || !(st.roofs || []).length)) {
    const polyOnly = roofOpt.kind === "facet";
    const hasImg = !!(st.baseMap && st.baseMap.url || st.photo);
    ctxBar = React.createElement("div", {
      className: "p3s-float p3s-ctx",
      onPointerDown: e => e.stopPropagation()
    }, tool !== "roof" && React.createElement("button", {
      className: "p3s-btn pri",
      onClick: () => setTool("roof")
    }, React.createElement(P3SIcon, {
      name: "polygon",
      size: 16
    }), "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement(P3SSeg, {
      value: roofOpt.kind,
      onChange: v => {
        if (tool !== "roof") setTool("roof");
        setRoofOpt(Object.assign({}, roofOpt, {
          kind: v,
          shape: v === "facet" ? "poly" : "rect"
        }));
        setDraw(null);
      },
      options: P3S_KINDS_BASE
    }), React.createElement("span", {
      className: "lbl"
    }, polyOnly ? "คลิกไล่มุมทีละจุด" : "ลากสี่เหลี่ยม"), React.createElement("button", {
      className: "p3s-btn" + (trace && trace.on ? " pri" : ""),
      disabled: !hasImg || polyOnly,
      title: hasImg ? "แตะกลางหลังคา ระบบยิงหาขอบให้" : "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน",
      onClick: () => {
        const on = tool === "roof" && trace && trace.on;
        if (tool !== "roof") setTool("roof");
        setDraw(null);
        setTrace(on ? null : {
          on: true,
          mode: "edge"
        });
      }
    }, React.createElement(P3SIcon, {
      name: "magic",
      size: 16
    }), "\u0E2B\u0E32\u0E02\u0E2D\u0E1A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), hasImg && React.createElement("button", {
      className: "p3s-btn ico" + (edgeOn ? " pri" : ""),
      title: edgeOn ? "ดูดขอบภาพ: เปิด" : "ดูดขอบภาพ: ปิด",
      onClick: () => setEdgeOn(v => !v)
    }, React.createElement(P3SIcon, {
      name: "edge",
      size: 16
    })), hasImg && React.createElement("button", {
      className: "p3s-btn ico" + (imgFx.b !== 1 ? " pri" : ""),
      title: "\u0E40\u0E23\u0E48\u0E07\u0E41\u0E2A\u0E07\u0E20\u0E32\u0E1E (\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2A\u0E35\u0E40\u0E02\u0E49\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E02\u0E2D\u0E1A\u0E0A\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19)",
      onClick: () => setImgFx(imgFx.b !== 1 ? {
        b: 1,
        c: 1
      } : {
        b: 1.7,
        c: 1.35
      })
    }, React.createElement(P3SIcon, {
      name: "sun",
      size: 16
    })));
  } else if (!view3d && tool === "axis") {
    ctxBar = React.createElement("div", {
      className: "p3s-float p3s-ctx",
      onPointerDown: e => e.stopPropagation()
    }, React.createElement("span", {
      className: "lbl"
    }, "\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", axisDeg != null ? axisDeg + "°" : "ยังไม่ตั้ง"), React.createElement("button", {
      className: "p3s-btn pri",
      disabled: !(st.baseMap && st.baseMap.url || st.photo),
      onClick: autoAxis
    }, React.createElement(P3SIcon, {
      name: "magic",
      size: 16
    }), "\u0E2B\u0E32\u0E41\u0E19\u0E27\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), axisDeg != null && React.createElement("button", {
      className: "p3s-btn",
      onClick: () => setAxis(null, "ล้างแนวแล้ว — กลับเป็นทิศเหนือขึ้นบน")
    }, "\u0E25\u0E49\u0E32\u0E07\u0E41\u0E19\u0E27"));
  }
  const addPop = !view3d && tool === "roof" && !kindPick && !eavePick && trace && trace.on && trace.done > 0 && !trace.pts && !trace.err && !trace.busy && React.createElement("div", {
    className: "p3s-pop",
    onPointerDown: e => e.stopPropagation(),
    style: {
      top: isMobile ? 104 : 64
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 ", trace.done, " \u0E2B\u0E25\u0E31\u0E07"), React.createElement("span", {
    className: "p3s-note"
  }, roofArm ? React.createElement("span", null, React.createElement("b", null, "\u0E41\u0E15\u0E30\u0E01\u0E25\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B"), "\u0E1A\u0E19\u0E20\u0E32\u0E1E \u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E32\u0E02\u0E2D\u0E1A\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35 (\u0E17\u0E23\u0E07", P3S_KIND_TH[roofOpt.kind] || "", ")") : React.createElement("span", null, React.createElement("b", null, "\u0E21\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2D\u0E35\u0E01?"), " \u0E01\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E30\u0E2B\u0E25\u0E31\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B\u0E1A\u0E19\u0E20\u0E32\u0E1E")), React.createElement("div", {
    className: "p3s-row"
  }, !roofArm && React.createElement("button", {
    className: "p3s-btn pri",
    style: {
      flex: 1
    },
    onClick: () => setRoofArm(true)
  }, React.createElement(P3Icon, {
    name: "plus"
  }), "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01\u0E2B\u0E25\u0E31\u0E07 (\u0E17\u0E23\u0E07", P3S_KIND_TH[roofOpt.kind] || "", ")"), React.createElement("button", {
    className: "p3s-btn",
    style: {
      flex: 1
    },
    onClick: addRoof
  }, "\u0E17\u0E23\u0E07\u0E2D\u0E37\u0E48\u0E19"), React.createElement("button", {
    className: "p3s-btn",
    style: {
      flex: "0 0 auto"
    },
    onClick: () => {
      setTrace(null);
      setRoofArm(false);
    }
  }, "\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27")));
  const tracePop = !view3d && tool === "roof" && !kindPick && trace && trace.on && (trace.pts || trace.err) && React.createElement("div", {
    className: "p3s-pop",
    onPointerDown: e => e.stopPropagation(),
    style: {
      top: isMobile ? 104 : 64
    }
  }, trace.pts ? React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800
    }
  }, "\u0E40\u0E08\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", trace.area, " \u0E15\u0E23.\u0E21.", trace.warn && React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--tint-amber-tx,#92400e)",
      marginTop: 4
    }
  }, trace.warn)) : React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--tint-amber-tx,#92400e)"
    }
  }, trace.err), trace.ax != null && React.createElement("span", {
    className: "p3s-note keep"
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E19\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", trace.ax, "\xB0 \u0E43\u0E2B\u0E49\u0E14\u0E49\u0E27\u0E22\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E14\u0E43\u0E0A\u0E49"), trace.pts && React.createElement("div", {
    className: "p3s-row",
    style: {
      gap: 6
    }
  }, React.createElement("span", {
    className: "p3s-note keep",
    style: {
      flex: 1
    }
  }, trace.busy ? "กำลังหาขอบจุดที่แตะเพิ่ม…" : React.createElement("span", null, React.createElement("b", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A\u0E2B\u0E25\u0E31\u0E07?"), " \u0E41\u0E15\u0E30\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1A\u0E19\u0E20\u0E32\u0E1E \u0E23\u0E30\u0E1A\u0E1A\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27", (trace.parts || []).length > 1 ? " · รวมแล้ว " + trace.parts.length + " จุด" : "")), (trace.parts || []).length > 1 && React.createElement("button", {
    className: "p3s-btn",
    style: {
      padding: "0 10px"
    },
    onClick: undoTracePart
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E08\u0E38\u0E14\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14")), trace.pts && React.createElement("div", {
    className: "p3s-fld",
    style: {
      gap: 5
    }
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E2B\u0E21\u0E38\u0E19\u0E01\u0E23\u0E2D\u0E1A ", (trace.rot || 0) > 0 ? "+" : "", trace.rot || 0, "\xB0 \u2014 \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E"), React.createElement("div", {
    className: "p3s-row",
    style: {
      gap: 4
    }
  }, [-5, -1].map(d => React.createElement("button", {
    key: d,
    className: "p3s-btn",
    style: {
      flex: 1,
      padding: "0 4px"
    },
    disabled: !!trace.busy,
    onClick: () => rotateTrace(d)
  }, "\u27F2 ", -d, "\xB0")), React.createElement("button", {
    className: "p3s-btn",
    style: {
      flex: 1,
      padding: "0 4px"
    },
    disabled: !!trace.busy || !trace.rot,
    onClick: () => rotateTrace(null)
  }, "0\xB0"), [1, 5].map(d => React.createElement("button", {
    key: d,
    className: "p3s-btn",
    style: {
      flex: 1,
      padding: "0 4px"
    },
    disabled: !!trace.busy,
    onClick: () => rotateTrace(d)
  }, "\u27F3 ", d, "\xB0")))), trace.pts && React.createElement("div", {
    className: "p3s-fld",
    style: {
      gap: 5
    }
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E17\u0E23\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u2014 \u0E2A\u0E25\u0E31\u0E1A\u0E14\u0E39\u0E44\u0E14\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E14\u0E43\u0E0A\u0E49"), React.createElement(P3SSeg, {
    full: true,
    value: roofOpt.kind === "facet" ? "flat" : roofOpt.kind,
    onChange: v => setRoofOpt(Object.assign({}, roofOpt, {
      kind: v,
      shape: "rect"
    })),
    options: P3S_KINDS_BASE.filter(o => o[0] !== "facet")
  }), roofOpt.kind === "shed" && React.createElement("span", {
    className: "p3s-note"
  }, "\u0E40\u0E1E\u0E34\u0E07: \u0E01\u0E14\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27", React.createElement("b", null, " \u0E41\u0E15\u0E30\u0E02\u0E2D\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E33"), " \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E17\u0E32\u0E07\u0E25\u0E32\u0E14"), roofOpt.kind === "dome" && React.createElement("span", {
    className: "p3s-note"
  }, "\u0E04\u0E23\u0E36\u0E48\u0E07\u0E27\u0E07\u0E01\u0E25\u0E21: \u0E41\u0E19\u0E27\u0E42\u0E04\u0E49\u0E07\u0E27\u0E32\u0E07\u0E15\u0E32\u0E21\u0E14\u0E49\u0E32\u0E19\u0E22\u0E32\u0E27 \u2014 \u0E01\u0E14\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 ", React.createElement("b", null, "\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E42\u0E04\u0E49\u0E07"), " \u0E43\u0E19\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E44\u0E14\u0E49")), React.createElement(P3SSeg, {
    full: true,
    value: trace.mode || "edge",
    onChange: v => {
      if (trace.seed) runTrace(trace.seed, traceTol, v);else setTrace({
        on: true,
        mode: v
      });
    },
    options: [["edge", "ยิงหาขอบ (ทุกสี)"], ["color", "ไล่สี (สีเรียบ)"]]
  }), trace.mode === "color" && React.createElement(P3SRange, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E2A\u0E35",
    right: traceTol < 22 ? "แม่น" : traceTol > 42 ? "กว้าง" : "กลาง",
    min: 10,
    max: 70,
    step: 1,
    value: traceTol,
    onChange: v => {
      setTraceTol(v);
      if (trace.seed) runTrace(trace.seed, v);
    }
  }), React.createElement("div", {
    className: "p3s-row"
  }, trace.pts && React.createElement("button", {
    className: "p3s-btn pri",
    style: {
      flex: 1
    },
    disabled: !!trace.busy,
    onClick: acceptTrace
  }, React.createElement(P3Icon, {
    name: "check"
  }), "\u0E40\u0E2D\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E41\u0E1A\u0E1A\u0E19\u0E35\u0E49 (Enter)"), React.createElement("button", {
    className: "p3s-btn",
    style: {
      flex: trace.pts ? "0 0 auto" : 1
    },
    onClick: () => setTrace({
      on: true,
      mode: trace.mode
    })
  }, "\u0E41\u0E15\u0E30\u0E43\u0E2B\u0E21\u0E48")), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E44\u0E14\u0E49\u0E23\u0E39\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E25\u0E32\u0E01\u0E08\u0E38\u0E14\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E1A/\u0E21\u0E38\u0E21\u0E1B\u0E23\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E21\u0E2D \u2014 \u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E25\u0E32\u0E01\u0E08\u0E30\u0E14\u0E39\u0E14\u0E40\u0E02\u0E49\u0E32\u0E02\u0E2D\u0E1A\u0E43\u0E19\u0E20\u0E32\u0E1E"));
  const emptyState = !view3d && !roofs.length && !st.baseMap && !st.photo && tool === "select" && React.createElement("div", {
    className: "p3s-empty"
  }, React.createElement("div", {
    className: "box",
    onPointerDown: e => e.stopPropagation()
  }, React.createElement("h3", null, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E08\u0E32\u0E01\u0E20\u0E32\u0E1E\u0E21\u0E38\u0E21\u0E2A\u0E39\u0E07\u0E02\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("p", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21 (\u0E44\u0E14\u0E49\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E08\u0E23\u0E34\u0E07\u0E17\u0E31\u0E19\u0E17\u0E35) \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E31\u0E1A\u0E20\u0E32\u0E1E \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E40\u0E15\u0E34\u0E21\u0E41\u0E1C\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07"), React.createElement("button", {
    className: "p3s-btn pri big",
    onClick: () => setMapOpen(true)
  }, React.createElement(P3Icon, {
    name: "map"
  }), "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21"), React.createElement("button", {
    className: "p3s-btn big",
    onClick: () => fileRef.current && fileRef.current.click()
  }, React.createElement(P3Icon, {
    name: "camera"
  }), "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19"), React.createElement("button", {
    className: "p3s-btn ghost",
    onClick: () => setTool("roof")
  }, "\u0E27\u0E32\u0E14\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E40\u0E1B\u0E25\u0E48\u0E32 (\u0E43\u0E0A\u0E49\u0E02\u0E19\u0E32\u0E14\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14\u0E21\u0E32)")));
  const H = hist.current;
  return React.createElement("div", {
    className: "p3s",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 120,
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement("style", null, P3_CSS + P3S_CSS), sysOpen && typeof SolarWorkspace === "function" && React.createElement(SolarWorkspace, {
    job: job,
    st: st,
    sys: st.sys || suBlankSys(),
    snap: sysSnap,
    onChange: sysChange,
    onClose: () => {
      sysFlush();
      setSysOpen(false);
    }
  }), mapOpen && React.createElement(P3MapPicker, {
    initial: st.baseMap ? {
      lat: st.baseMap.lat,
      lng: st.baseMap.lng
    } : jobLatLng,
    initialQuery: jobAddr,
    onPick: onPickMap,
    onClose: () => setMapOpen(false)
  }), React.createElement("div", {
    className: "p3s-head"
  }, React.createElement("button", {
    className: "p3s-btn ico ghost",
    onClick: tryClose,
    title: "\u0E1B\u0E34\u0E14"
  }, React.createElement(P3SIcon, {
    name: "back",
    size: 18
  })), React.createElement("div", {
    className: "p3s-ttl"
  }, React.createElement("div", {
    className: "k"
  }, "\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 & \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07", job && job.code ? " · " + job.code : ""), React.createElement("div", {
    className: "n"
  }, job ? job.name : "")), !isMobile && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginRight: 6
    }
  }, React.createElement("span", {
    className: "p3s-kpi"
  }, React.createElement("b", null, total), React.createElement("span", null, "\u0E41\u0E1C\u0E07")), React.createElement("span", {
    className: "p3s-kpi"
  }, React.createElement("b", null, kwp), React.createElement("span", null, "kWp")), goal > 0 && React.createElement("span", {
    className: "p3s-badge " + (total >= goal ? "ok" : "warn")
  }, total >= goal ? total > goal ? "เกินเป้า " + (total - goal) : "ครบเป้า" : "ขาด " + (goal - total) + " แผง")), React.createElement(P3SSeg, {
    value: view3d ? "3d" : "2d",
    onChange: v => {
      setView3d(v === "3d");
      if (v === "3d") {
        setToolRaw("select");
        setDraw(null);
        setMeasPts(null);
        setTrace(null);
        setCalib(null);
      } else if (wizHomeRef.current) setToolRaw(wizHomeRef.current);
    },
    options: [["2d", isMobile ? "2D" : "ผัง 2D"], ["3d", "3D"]]
  }), React.createElement("button", {
    className: "p3s-btn pri",
    onClick: doSave,
    disabled: !dirty,
    title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (Ctrl+S)"
  }, React.createElement(P3Icon, {
    name: justSaved && !dirty ? "check" : "save"
  }), isMobile ? "" : dirty ? "บันทึก" : justSaved ? "บันทึกแล้ว" : "บันทึกแล้ว")), React.createElement("div", {
    className: "p3s-body"
  }, React.createElement("div", {
    ref: stageRef,
    className: "p3s-stage",
    style: {
      cursor
    },
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onCancel,
    onPointerLeave: () => {
      if (tool === "area" || tool === "panel" || tool === "obs") setMxy(null);
      if (!gest.current) {
        setHover(null);
        if (tool !== "roof" && tool !== "meas") setCur(null);
      }
    },
    onContextMenu: e => e.preventDefault()
  }, view3d && React.createElement("div", {
    className: "p3s-v3top",
    onPointerDown: e => e.stopPropagation()
  }, vidOn && React.createElement("span", {
    className: "rec"
  }, React.createElement("i", null), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E31\u0E14 ", Math.round(((sunHour || 5.5) - 5.5) / 14 * 100), "%"), React.createElement("button", {
    type: "button",
    className: "b",
    title: wide3d ? "แสดงแผงด้านข้าง" : "ขยายจอ 3D เต็มความกว้าง",
    onClick: () => setWide3d(v => !v)
  }, React.createElement(P3SCamGlyph, {
    k: wide3d ? "shrink" : "expand"
  }), React.createElement("span", null, wide3d ? "แสดงแผง" : "ขยายเต็มจอ"))), view3d && (wide3d || vidOn) && React.createElement("div", {
    className: "p3s-v3bar",
    onPointerDown: e => e.stopPropagation()
  }, vidOn ? React.createElement("button", {
    type: "button",
    className: "stop",
    onClick: stopVideo
  }, React.createElement("i", null), "\u0E2B\u0E22\u0E38\u0E14\u0E2D\u0E31\u0E14 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D") : React.createElement(React.Fragment, null, [["bird", "มุมนก"], ["front", "หน้าอาคาร"], ["top", "มุมบน"], ["close", "ใกล้แผง"]].map(([k, lb]) => React.createElement("button", {
    key: k,
    type: "button",
    className: "cam",
    "data-on": camK === k ? "1" : "0",
    disabled: k === "close" && !total,
    title: lb,
    onClick: () => camGo(k)
  }, React.createElement(P3SCamGlyph, {
    k: k
  }), React.createElement("span", null, lb))), React.createElement("i", {
    className: "sep"
  }), React.createElement("button", {
    type: "button",
    className: "shot",
    onClick: shotGo
  }, React.createElement(P3SCamGlyph, {
    k: "cam"
  }), React.createElement("span", null, "\u0E16\u0E48\u0E32\u0E22\u0E20\u0E32\u0E1E 4K")), React.createElement("button", {
    type: "button",
    className: "vid",
    onClick: takeVideo,
    title: "\u0E2D\u0E31\u0E14\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D\u0E40\u0E07\u0E32\u0E17\u0E31\u0E49\u0E07\u0E27\u0E31\u0E19"
  }, React.createElement(P3Icon, {
    name: "play"
  }), React.createElement("span", null, "\u0E2D\u0E31\u0E14\u0E27\u0E34\u0E14\u0E35\u0E42\u0E2D")))), view3d ? React.createElement(P3SView3D, {
    st: st,
    sun: sun,
    api: v3api
  }) : React.createElement("svg", {
    width: Sz.w,
    height: Sz.h
  }, (() => {
    const step = [0.5, 1, 2, 5, 10, 20, 50, 100].find(m => m * V.s >= 14) || 100,
      P = step * V.s;
    const o = toS(0, 0),
      gRot = axisDeg != null && !rotRef.current ? axisDeg : 0;
    return React.createElement(React.Fragment, null, React.createElement("defs", null, React.createElement("pattern", {
      id: "p3sGrid",
      width: P,
      height: P,
      patternUnits: "userSpaceOnUse",
      x: o.x % P,
      y: o.y % P,
      patternTransform: gRot ? "rotate(" + gRot + " " + o.x + " " + o.y + ")" : undefined
    }, React.createElement("path", {
      d: "M " + P + " 0 L 0 0 0 " + P,
      fill: "none",
      stroke: axisDeg != null ? "rgba(217,70,239,.16)" : "rgba(51,65,85,.12)",
      strokeWidth: 1
    }))), React.createElement("rect", {
      width: Sz.w,
      height: Sz.h,
      fill: "url(#p3sGrid)"
    }));
  })(), React.createElement("g", {
    transform: tf
  }, st.baseMap && st.baseMap.url && (() => {
    const W = +st.baseMap.widthM || 30;
    return React.createElement("image", {
      href: st.baseMap.url,
      x: -W / 2,
      y: -W / 2,
      width: W,
      height: W,
      preserveAspectRatio: "none",
      style: imgFilter
    });
  })(), st.photo && (() => {
    const pw = +st.photoW || 30,
      ph = pw * photoAR;
    return React.createElement("g", {
      transform: "translate(" + (+st.photoX || 0) + " " + (+st.photoZ || 0) + ") rotate(" + (+st.photoRot || 0) + ")"
    }, React.createElement("image", {
      href: st.photo,
      x: -pw / 2,
      y: -ph / 2,
      width: pw,
      height: ph,
      preserveAspectRatio: "none",
      opacity: p3sClamp(+st.photoOpacity || 0.95, 0.15, 1),
      style: imgFilter
    }), tool === "bg" && React.createElement("rect", {
      x: -pw / 2,
      y: -ph / 2,
      width: pw,
      height: ph,
      fill: "none",
      stroke: "#2563eb",
      strokeWidth: 1.6,
      strokeDasharray: "6 4",
      style: NS
    }));
  })(), React.createElement("g", {
    opacity: tool === "bg" ? 0.45 : 1
  }, roofEls, panelEls, groupEls, blkFrame, obsEls, obsGhost, measEls)), labels, preview, handleEls), !view3d && React.createElement("div", {
    className: "p3s-mode",
    style: {
      top: 12 + Math.max(0, ftList.findIndex(x => x[0] === tool)) * 52 + 8
    }
  }, "\u0E42\u0E2B\u0E21\u0E14 ", React.createElement("b", null, modeTxt)), obsHov && wiz && wi === 4 && React.createElement(P3SObsPrev, {
    type: obsHov.k,
    at: obsHov.r
  }), React.createElement("div", {
    className: "p3s-ftool",
    onPointerDown: e => e.stopPropagation()
  }, !view3d && ftList.map(([k, ic, lb]) => React.createElement("button", {
    key: k,
    className: "b",
    "data-on": tool === k ? "1" : "0",
    disabled: !toolOk(k),
    title: toolOk(k) ? lb : lb + " — ขั้นนี้ใช้ไม่ได้",
    onClick: () => setTool(k)
  }, React.createElement(P3SIcon, {
    name: ic,
    size: 20
  }))), !view3d && React.createElement("i", {
    className: "sep"
  }), React.createElement("button", {
    className: "b g",
    onClick: undo,
    disabled: !H.u.length,
    title: "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A (Ctrl+Z)"
  }, React.createElement(P3SIcon, {
    name: "undo",
    size: 19
  })), React.createElement("button", {
    className: "b g",
    onClick: redo,
    disabled: !H.r.length,
    title: "\u0E17\u0E33\u0E0B\u0E49\u0E33 (Ctrl+Shift+Z)"
  }, React.createElement(P3SIcon, {
    name: "redo",
    size: 19
  }))), multi.length > 0 && sel && !view3d && React.createElement("div", {
    className: "p3s-float p3s-msel",
    onPointerDown: e => e.stopPropagation()
  }, React.createElement("span", {
    className: "lbl"
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01 ", multi.length + 1, " ", sel.t === "roof" ? "หลังคา" : "ชิ้น"), React.createElement("button", {
    className: "p3s-btn",
    onClick: duplicate
  }, React.createElement(P3SIcon, {
    name: "copy",
    size: 15
  }), "\u0E17\u0E33\u0E0B\u0E49\u0E33\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), React.createElement("button", {
    className: "p3s-btn dngr",
    onClick: delSelected
  }, React.createElement(P3Icon, {
    name: "trash"
  }), "\u0E25\u0E1A"), React.createElement("button", {
    className: "p3s-btn",
    onClick: () => setSel(null)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), tracePop || addPop ? null : ctxBar, tracePop, addPop, kindPick && !view3d && tool === "roof" && React.createElement("div", {
    className: "p3s-kpick",
    onPointerDown: e => e.stopPropagation(),
    onClick: () => setKindPick(false)
  }, React.createElement("div", {
    className: "in",
    onClick: e => e.stopPropagation()
  }, React.createElement("span", {
    className: "tt"
  }, (st.roofs || []).length ? "เลือกทรงของหลังคาหลังที่ " + ((st.roofs || []).length + 1) : "เลือกทรงหลังคาก่อนวาด"), React.createElement("div", {
    className: "gr"
  }, P3S_KINDS.map(([k, lb]) => React.createElement("button", {
    key: k,
    className: "k",
    "data-on": roofOpt.kind === k ? "1" : "0",
    onClick: () => {
      setRoofOpt(Object.assign({}, roofOpt, {
        kind: k,
        shape: k === "facet" ? "poly" : "rect",
        spans: roofOpt.spans || 3
      }));
      if (P3S_SPANS[k]) return;
      setDraw(null);
      setTrace(null);
      setKindPick(false);
      setRoofArm(true);
    }
  }, React.createElement(P3SKindPic, {
    k: k
  }), React.createElement("b", null, lb), React.createElement("small", null, P3S_KIND_D[k])))), P3S_SPANS[roofOpt.kind] && React.createElement("div", {
    className: "p3s-kspan"
  }, React.createElement("span", null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E48\u0E27\u0E07", roofOpt.kind === "saw" ? " (ฟัน)" : " (จั่ว)"), React.createElement("button", {
    type: "button",
    className: "p3s-btn",
    onClick: () => setRoofOpt(Object.assign({}, roofOpt, {
      spans: Math.max(2, (roofOpt.spans || 3) - 1)
    }))
  }, "\u2212"), React.createElement("b", null, roofOpt.spans || 3), React.createElement("button", {
    type: "button",
    className: "p3s-btn",
    onClick: () => setRoofOpt(Object.assign({}, roofOpt, {
      spans: Math.min(20, (roofOpt.spans || 3) + 1)
    }))
  }, "+"), React.createElement("button", {
    type: "button",
    className: "p3s-btn pri",
    style: {
      flex: 1
    },
    onClick: () => {
      setDraw(null);
      setTrace(null);
      setKindPick(false);
      setRoofArm(true);
    }
  }, React.createElement(P3Icon, {
    name: "check"
  }), "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E27\u0E32\u0E14 \xB7 \u0E25\u0E32\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23")), (st.roofs || []).length > 0 && React.createElement("button", {
    className: "p3s-btn pri wide",
    onClick: () => {
      setKindPick(false);
      setRoofArm(false);
      setDraw(null);
      setTrace(null);
    }
  }, React.createElement(P3Icon, {
    name: "check"
  }), "\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E44\u0E21\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (\u0E21\u0E35 ", (st.roofs || []).length, " \u0E2B\u0E25\u0E31\u0E07)"), React.createElement("span", {
    className: "p3s-note"
  }, "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2B\u0E25\u0E32\u0E22\u0E17\u0E23\u0E07\u0E43\u0E19\u0E07\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E23\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E27\u0E32\u0E14\u0E41\u0E15\u0E48\u0E25\u0E30\u0E2B\u0E25\u0E31\u0E07"))), ladderFar && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14,
      background: "#b45309"
    }
  }, "\u0E1A\u0E31\u0E19\u0E44\u0E14\u0E25\u0E34\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E34\u0E14\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u2014 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E43\u0E01\u0E25\u0E49\u0E02\u0E2D\u0E1A (\u2264 3 \u0E21.)"), tool === "obs" && obsGhost && !coarse && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14
    }
  }, "\u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07", p3sObsName({
    p3sType: obsType
  }), obsType !== "ladder" ? " · ลาก = ขนาดจริง" : ""), tapPick && mxy && !view3d && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14
    }
  }, "\u0E08\u0E34\u0E49\u0E21\u0E1A\u0E19\u0E17\u0E48\u0E2D = \u0E27\u0E32\u0E07\u0E01\u0E4A\u0E2D\u0E01 \xB7 \u0E08\u0E34\u0E49\u0E21\u0E01\u0E4A\u0E2D\u0E01\u0E40\u0E14\u0E34\u0E21 = \u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01"), eavePick && mxy && !view3d && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14
    }
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E17\u0E32\u0E07\u0E25\u0E32\u0E14 \u2014 \u0E41\u0E15\u0E30\u0E02\u0E2D\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E15\u0E48\u0E33"), tool === "panel" && mxy && !view3d && (marq || hover && hover.indexOf("roof:") === 0 && !p3sCount((st.roofs || []).find(r => "roof:" + r.id === hover) || {})) && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14
    }
  }, marq ? "ปล่อยแล้วแผงขึ้นในกรอบ" : "กดค้างแล้วลาก คลุมส่วนที่จะวางแผง"), tool === "area" && !eavePick && mxy && !view3d && React.createElement("div", {
    className: "p3s-mtip",
    style: {
      left: mxy.x + 16,
      top: mxy.y + 14
    }
  }, marq ? "ปล่อยเมื่อกรอบคลุมอาคารครบ" : "กดค้างแล้วลาก คลุมอาคารที่จะติดตั้ง"), emptyState, !view3d && React.createElement("button", {
    className: "p3s-north",
    onPointerDown: e => e.stopPropagation(),
    onClick: () => axisDeg != null && setAlignView(v => !v),
    title: axisDeg != null ? rotRef.current ? "ผังหมุนตามแนวหลังคา " + axisDeg + "° — แตะเพื่อให้ทิศเหนือขึ้นบน" : "แตะเพื่อหมุนผังตามแนวหลังคา" : "ทิศเหนือ",
    style: {
      border: 0,
      cursor: axisDeg != null ? "pointer" : "default",
      pointerEvents: "auto"
    }
  }, React.createElement("svg", {
    width: "22",
    height: "26",
    viewBox: "0 0 22 26",
    style: {
      transform: "rotate(" + -rotDeg + "deg)",
      transition: "transform .25s"
    }
  }, React.createElement("path", {
    d: "M11 1 17 15H5z",
    fill: "#e11d48"
  }), React.createElement("path", {
    d: "M11 25 17 15H5z",
    fill: "#94a3b8"
  }), React.createElement("text", {
    x: "11",
    y: "13",
    textAnchor: "middle",
    fontSize: "7",
    fontWeight: "800",
    fill: "#fff"
  }, "N")), axisDeg != null && React.createElement("span", {
    style: {
      position: "absolute",
      bottom: -17,
      fontSize: 10,
      fontWeight: 800,
      color: "#86198f",
      textShadow: "0 0 3px #fff,0 0 3px #fff",
      whiteSpace: "nowrap"
    }
  }, "\u0E41\u0E19\u0E27 ", axisDeg, "\xB0")), !view3d && React.createElement("div", {
    className: "p3s-scale"
  }, React.createElement("span", null, scaleBar.L, " \u0E21."), React.createElement("i", {
    style: {
      width: scaleBar.px
    }
  })), !view3d && React.createElement("div", {
    className: "p3s-float p3s-zoom",
    onPointerDown: e => e.stopPropagation()
  }, React.createElement("button", {
    className: "p3s-btn ico ghost",
    onClick: () => zoomAt({
      x: Sz.w / 2,
      y: Sz.h / 2
    }, 1.3),
    title: "\u0E0B\u0E39\u0E21\u0E40\u0E02\u0E49\u0E32 (+)"
  }, React.createElement(P3Icon, {
    name: "plus"
  })), React.createElement("button", {
    className: "p3s-btn ico ghost",
    onClick: () => zoomAt({
      x: Sz.w / 2,
      y: Sz.h / 2
    }, 1 / 1.3),
    title: "\u0E0B\u0E39\u0E21\u0E2D\u0E2D\u0E01 (\u2212)"
  }, React.createElement(P3SIcon, {
    name: "minus"
  })), React.createElement("button", {
    className: "p3s-btn ico ghost",
    onClick: () => fitView(),
    title: "\u0E1E\u0E2D\u0E14\u0E35\u0E08\u0E2D (F)"
  }, React.createElement(P3SIcon, {
    name: "fit"
  })))), React.createElement("div", {
    className: "p3s-side",
    "data-min": isMobile && sheetMin ? "1" : "0",
    "data-hide": view3d && wide3d ? "1" : "0"
  }, React.createElement("button", {
    className: "p3s-sheetbar",
    onClick: () => setSheetMin(v => !v)
  }, React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "left"
    }
  }, total, " \u0E41\u0E1C\u0E07 \xB7 ", kwp, " kWp"), React.createElement("span", {
    className: "gr"
  }), React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "right"
    }
  }, sheetMin ? "ขยาย ▲" : "ย่อ ▼")), sideBody, wizNav)));
}
function Plan3DEntry(props) {
  return React.createElement(Plan3DStudio, props);
}
Object.assign(window, {
  Plan3DEntry,
  Plan3DStudio,
  P3SView3D,
  p3sKindPreview,
  p3sTrace,
  p3sQuads,
  p3sFaces2D
});