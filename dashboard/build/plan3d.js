const P3_DEG = Math.PI / 180;
const P3_PANEL_SHORT = 1.134;
const P3_PANEL_LONG = 2.278;
const P3_PANEL_T = 0.04;
const P3_ROOF_COLOR = "#94A3B8";
const P3_GRP_COLORS = ["#4F46E5", "#0891B2", "#DB2777", "#CA8A04", "#059669"];
let _p3ThreeP = null;
function p3LoadThree() {
  if (window.THREE && window.THREE.OrbitControls) return Promise.resolve(window.THREE);
  if (_p3ThreeP) return _p3ThreeP;
  const inject = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("โหลดไม่สำเร็จ: " + src));
    document.head.appendChild(s);
  });
  _p3ThreeP = inject("https://unpkg.com/three@0.147.0/build/three.min.js").then(() => inject("https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js")).then(() => window.THREE);
  _p3ThreeP.catch(() => {
    _p3ThreeP = null;
  });
  return _p3ThreeP;
}
let _p3LeafletP = null;
function p3LoadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (_p3LeafletP) return _p3LeafletP;
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);
  _p3LeafletP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => res(window.L);
    s.onerror = () => rej(new Error("โหลดแผนที่ (Leaflet) ไม่สำเร็จ"));
    document.head.appendChild(s);
  });
  _p3LeafletP.catch(() => {
    _p3LeafletP = null;
  });
  return _p3LeafletP;
}
const P3_ESRI_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const P3_ESRI_ATTR = "Tiles © Esri, Maxar, Earthstar Geographics";
function p3MetersPerPixel(lat, z) {
  return 156543.03392804097 * Math.cos((lat || 0) * Math.PI / 180) / Math.pow(2, z);
}
function p3ParseLatLng(url) {
  if (!url || typeof url !== "string") return null;
  const pats = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /(-?\d{1,2}\.\d{4,}),\s*(-?\d{2,3}\.\d{4,})/];
  for (const p of pats) {
    const m = url.match(p);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  }
  return null;
}
function p3Geocode(query) {
  const q = (query || "").trim();
  if (!q) return Promise.resolve(null);
  return fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q), {
    headers: {
      "Accept": "application/json"
    }
  }).then(r => r.ok ? r.json() : []).then(a => a && a[0] ? [parseFloat(a[0].lat), parseFloat(a[0].lon)] : null).catch(() => null);
}
function p3LngLatToWorldPx(lat, lng, z) {
  const s = 256 * Math.pow(2, z);
  const x = (lng + 180) / 360 * s;
  const sinL = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinL) / (1 - sinL)) / (4 * Math.PI)) * s;
  return {
    x,
    y
  };
}
function p3CaptureTiles(lat, lng, viewZoom, viewPx) {
  const realWidthM = p3MetersPerPixel(lat, viewZoom) * (viewPx || 1024);
  const z = Math.max(1, Math.min(19, Math.round(viewZoom)));
  let size = Math.round(realWidthM / p3MetersPerPixel(lat, z));
  size = Math.max(256, Math.min(2048, size));
  const c = p3LngLatToWorldPx(lat, lng, z);
  const left = c.x - size / 2,
    top = c.y - size / 2;
  const tL = Math.floor(left / 256),
    tT = Math.floor(top / 256);
  const tR = Math.floor((left + size - 1) / 256),
    tB = Math.floor((top + size - 1) / 256);
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");
  const n = Math.pow(2, z);
  const jobs = [];
  for (let tx = tL; tx <= tR; tx++) for (let ty = tT; ty <= tB; ty++) {
    const wx = (tx % n + n) % n,
      wy = ty;
    if (wy < 0 || wy >= n) continue;
    const url = P3_ESRI_URL.replace("{z}", z).replace("{x}", wx).replace("{y}", wy);
    const dx = tx * 256 - left,
      dy = ty * 256 - top;
    jobs.push(new Promise(res => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          ctx.drawImage(img, dx, dy);
        } catch (e) {}
        res();
      };
      img.onerror = () => res();
      img.src = url;
    }));
  }
  return Promise.all(jobs).then(() => {
    let url;
    try {
      url = cv.toDataURL("image/jpeg", 0.85);
    } catch (e) {
      throw new Error("แปลงภาพแผนที่ไม่สำเร็จ (CORS)");
    }
    return {
      url,
      widthM: realWidthM,
      lat,
      lng,
      zoom: z
    };
  });
}
function P3MapPicker({
  initial,
  initialQuery,
  onPick,
  onClose
}) {
  const boxRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [q, setQ] = React.useState(initialQuery || "");
  React.useEffect(() => {
    let map;
    p3LoadLeaflet().then(L => {
      if (!boxRef.current) return;
      const has = initial && initial.length === 2 && isFinite(initial[0]);
      map = L.map(boxRef.current, {
        zoomControl: true
      }).setView(has ? initial : [13.7563, 100.5018], has ? 19 : 6);
      L.tileLayer(P3_ESRI_URL, {
        maxZoom: 21,
        maxNativeZoom: 19,
        attribution: P3_ESRI_ATTR
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 120);
      if (!has && (initialQuery || "").trim()) p3Geocode(initialQuery).then(ll => {
        if (ll && mapRef.current) mapRef.current.setView(ll, 19);
      });
    }).catch(e => setErr(e.message));
    return () => {
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);
  const search = () => {
    const query = (q || "").trim();
    if (!query) return;
    setBusy(true);
    setErr("");
    p3Geocode(query).then(ll => {
      setBusy(false);
      if (ll && mapRef.current) mapRef.current.setView(ll, 19);else setErr("ไม่พบที่อยู่นี้ — ลองพิมพ์ละเอียดขึ้น หรือเลื่อนแผนที่หาเอง");
    });
  };
  const use = () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter(),
      z = map.getZoom();
    const vpx = boxRef.current && boxRef.current.clientWidth || 1024;
    setBusy(true);
    setErr("");
    p3CaptureTiles(c.lat, c.lng, z, vpx).then(res => {
      setBusy(false);
      onPick(res);
    }).catch(e => {
      setBusy(false);
      setErr(e.message);
    });
  };
  const ibtn = {
    padding: "8px 12px",
    borderRadius: 9,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    fontWeight: 700,
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
    color: "var(--text-1)"
  };
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(8,20,14,.55)",
      display: "flex",
      padding: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      background: "var(--surface)",
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 60px rgba(0,0,0,.4)"
    }
  }, React.createElement("div", {
    style: {
      padding: 10,
      borderBottom: "1px solid var(--border)",
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 800,
      fontSize: 13.5,
      color: "var(--text-1)",
      whiteSpace: "nowrap"
    }
  }, "\uD83D\uDDFA\uFE0F \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    onKeyDown: e => e.key === "Enter" && search(),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u2026",
    style: {
      flex: 1,
      minWidth: 130,
      padding: "8px 10px",
      border: "1px solid var(--border-strong)",
      borderRadius: 9,
      fontFamily: "inherit",
      fontSize: 13,
      background: "var(--surface2)",
      color: "var(--text-1)",
      outline: "none"
    }
  }), React.createElement("button", {
    onClick: search,
    disabled: busy,
    style: ibtn
  }, "\u0E04\u0E49\u0E19\u0E2B\u0E32"), React.createElement("button", {
    onClick: onClose,
    style: Object.assign({}, ibtn, {
      color: "var(--tint-red-tx)"
    })
  }, "\u0E1B\u0E34\u0E14")), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      position: "relative"
    }
  }, React.createElement("div", {
    ref: boxRef,
    style: {
      position: "absolute",
      inset: 0
    }
  }), React.createElement("div", {
    style: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      pointerEvents: "none",
      zIndex: 500,
      color: "#ff3b30",
      fontSize: 30,
      fontWeight: 700,
      textShadow: "0 0 4px #fff, 0 0 4px #fff"
    }
  }, "\u2316"), !ready && !err && React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u2026"), err && React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      bottom: 10,
      background: "var(--tint-red-tx)",
      color: "#fff",
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: 12,
      zIndex: 600,
      maxWidth: "80%"
    }
  }, err)), React.createElement("div", {
    style: {
      padding: 10,
      borderTop: "1px solid var(--border)",
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      flex: 1,
      lineHeight: 1.4
    }
  }, "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19/\u0E0B\u0E39\u0E21\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E49\u0E32 ", React.createElement("b", {
    style: {
      color: "#ff3b30"
    }
  }, "\u2316"), " \u0E2D\u0E22\u0E39\u0E48\u0E01\u0E25\u0E32\u0E07\u0E1A\u0E49\u0E32\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 \"\u0E43\u0E0A\u0E49\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E49\" \xB7 \u0E17\u0E34\u0E28\u0E40\u0E2B\u0E19\u0E37\u0E2D = \u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E40\u0E2A\u0E21\u0E2D \xB7 \u0E0B\u0E39\u0E21\u0E40\u0E22\u0E2D\u0E30 = \u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), React.createElement("button", {
    onClick: use,
    disabled: busy || !ready,
    style: {
      padding: "10px 20px",
      borderRadius: 10,
      border: "none",
      background: busy || !ready ? "var(--surface3)" : "var(--primary)",
      color: "#fff",
      fontWeight: 800,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: busy || !ready ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, busy ? "กำลังจับภาพ…" : "✓ ใช้พื้นที่นี้"))));
}
function usePlan3d(jobId) {
  const KEY = "sf_plan3d_" + jobId;
  const [saved, setSaved] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId) {
      setSaved(null);
      setLoading(false);
      return;
    }
    if (window.FBDB) {
      const ref = window.FBDB.ref("plan3d/" + jobId);
      const h = ref.on("value", s => {
        setSaved(s.val() || null);
        setLoading(false);
      });
      return () => ref.off("value", h);
    }
    try {
      const v = localStorage.getItem(KEY);
      setSaved(v ? JSON.parse(v) : null);
    } catch (e) {
      setSaved(null);
    }
    setLoading(false);
  }, [jobId]);
  const save = React.useCallback(data => {
    if (!jobId) return;
    if (window.FBDB) window.FBDB.ref("plan3d/" + jobId).set(data);else {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {}
      setSaved(data);
    }
  }, [jobId]);
  return {
    saved,
    loading,
    save
  };
}
let _p3Seq = 0;
const p3Id = p => (p || "x") + Date.now().toString(36) + _p3Seq++;
function p3NextRoofNo(roofs) {
  let mx = 0;
  (roofs || []).forEach(r => {
    const m = /(\d+)\s*$/.exec(r.name || "");
    if (m) mx = Math.max(mx, +m[1]);
  });
  return Math.max(mx, (roofs || []).length) + 1;
}
function p3NewRoof(n) {
  return {
    id: p3Id("r"),
    kind: "rect",
    name: "หลังคา " + n,
    x: 0,
    z: 0,
    w: 8,
    d: 5,
    pitch: 15,
    az: 180,
    h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait",
    rows: 0,
    cols: 0,
    gap: 0.02,
    margin: 0.3,
    skips: {}
  };
}
function p3NewGable(n) {
  return {
    id: p3Id("r"),
    kind: "gable",
    name: "หลังคา " + n,
    x: 0,
    z: 0,
    ridge: 8,
    span: 8,
    pitch: 20,
    az: 180,
    h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait",
    rows: 0,
    cols: 0,
    gap: 0.02,
    margin: 0.3,
    skips: {},
    sideA: true,
    sideB: true
  };
}
function p3NewHip(n) {
  return {
    id: p3Id("r"),
    kind: "hip",
    name: "หลังคา " + n,
    x: 0,
    z: 0,
    w: 10,
    d: 7,
    pitch: 30,
    az: 180,
    h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait",
    rows: 0,
    cols: 0,
    gap: 0.02,
    margin: 0.3,
    skips: {},
    sideA: true,
    sideB: true,
    sideC: false,
    sideD: false
  };
}
function p3NewDome(n) {
  return {
    id: p3Id("r"),
    kind: "dome",
    name: "หลังคา " + n,
    x: 0,
    z: 0,
    ridge: 12,
    span: 10,
    rise: 2.5,
    az: 180,
    h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait",
    rows: 0,
    cols: 0,
    gap: 0.02,
    margin: 0.3,
    skips: {},
    maxTilt: 90
  };
}
function p3DomeGeo(roof) {
  const span = Math.max(1, +roof.span || 10);
  const len = Math.max(1, +roof.ridge || 12);
  const rise = Math.min(span / 2, Math.max(0.15, roof.rise == null ? 2.5 : +roof.rise));
  const rad = (span * span / 4 + rise * rise) / (2 * rise);
  const th = Math.asin(Math.min(1, span / 2 / rad));
  return {
    span,
    len,
    rise,
    rad,
    th,
    arc: 2 * th * rad,
    yAt: t => rad * Math.cos(t) - (rad - rise),
    zAt: t => rad * Math.sin(t)
  };
}
function p3MinRect(pts) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    const ang = Math.atan2((+b.z || 0) - (+a.z || 0), (+b.x || 0) - (+a.x || 0));
    const c = Math.cos(-ang),
      s = Math.sin(-ang);
    let minU = Infinity,
      maxU = -Infinity,
      minV = Infinity,
      maxV = -Infinity;
    pts.forEach(p => {
      const u = (+p.x || 0) * c - (+p.z || 0) * s,
        v = (+p.x || 0) * s + (+p.z || 0) * c;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    });
    const w = maxU - minU,
      d = maxV - minV,
      area = w * d;
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2,
        cv = (minV + maxV) / 2;
      best = {
        area,
        ang,
        w,
        d,
        cx: cu * c + cv * s,
        cz: -cu * s + cv * c
      };
    }
  }
  return best;
}
function p3PolyToDomePatch(roof, buildH) {
  const pts = roof.pts || [];
  if (pts.length < 3) return null;
  const R = p3MinRect(pts);
  if (!R) return null;
  const long = Math.max(R.w, R.d),
    short = Math.max(1, Math.min(R.w, R.d));
  const ridgeAng = R.w >= R.d ? R.ang : R.ang + Math.PI / 2;
  const ph = p3PhOf(roof);
  const eave = Math.max(0.5, Math.round(((+buildH || 0) + Math.min.apply(null, ph)) * 100) / 100);
  return {
    kind: "dome",
    skips: {},
    rows: 0,
    cols: 0,
    blocks: p3Blocks(roof).map(b => ({
      id: b.id,
      orient: b.orient,
      rows: 0,
      cols: 0,
      gap: b.gap,
      du: 0,
      dv: 0,
      rot: 0,
      tilt: 0,
      skips: {},
      adds: {}
    })),
    ridge: Math.round(long * 100) / 100,
    span: Math.round(short * 100) / 100,
    rise: Math.min(short / 2, Math.max(0.5, Math.round(short / 5 * 10) / 10)),
    az: (Math.round(180 + ridgeAng / P3_DEG) % 360 + 360) % 360,
    h: eave,
    maxTilt: 90,
    x: (+roof.x || 0) + R.cx,
    z: (+roof.z || 0) + R.cz,
    pts: pts.map(p => ({
      x: (+p.x || 0) - R.cx,
      z: (+p.z || 0) - R.cz
    }))
  };
}
function p3HipFaces(roof) {
  const pitchR = (+roof.pitch || 0) * P3_DEG;
  const cosP = Math.max(0.25, Math.cos(pitchR));
  const w = Math.max(1, +roof.w || 10),
    d = Math.max(1, +roof.d || 7);
  const half = d / 2,
    SL = half / cosP,
    r = Math.max(0.02, w - d);
  const rise = half * Math.tan(pitchR);
  const trap = [{
    x: -w / 2,
    z: 0
  }, {
    x: w / 2,
    z: 0
  }, {
    x: r / 2,
    z: -SL
  }, {
    x: -r / 2,
    z: -SL
  }];
  const tri = [{
    x: -half,
    z: 0
  }, {
    x: half,
    z: 0
  }, {
    x: 0,
    z: -SL
  }];
  return {
    cosP,
    w,
    d,
    half,
    SL,
    r,
    rise,
    faces: [{
      side: "A",
      wrapY: 0,
      tiltZ: half,
      poly: trap
    }, {
      side: "B",
      wrapY: Math.PI,
      tiltZ: half,
      poly: trap
    }, {
      side: "C",
      wrapY: -Math.PI / 2,
      tiltZ: w / 2,
      poly: tri
    }, {
      side: "D",
      wrapY: Math.PI / 2,
      tiltZ: w / 2,
      poly: tri
    }]
  };
}
function p3Blank(job) {
  return {
    groundW: 40,
    photo: null,
    photoW: 30,
    photoOpacity: 0.95,
    photoBright: 0.7,
    wp: 650,
    buildH: 0,
    photoRot: 0,
    photoX: 0,
    photoZ: 0,
    baseMap: null,
    roofs: [],
    obstacles: [],
    sun: {
      month: 4,
      day: 15,
      hour: 12,
      lat: 13.75,
      lng: 100.5
    },
    sys: null
  };
}
function p3Xf(roof, pan) {
  const pitchR = (+roof.pitch || 0) * P3_DEG;
  const rotY = -(((+roof.az || 180) - 180) * P3_DEG);
  const RX = (v, a) => ({
    x: v.x,
    y: v.y * Math.cos(a) - v.z * Math.sin(a),
    z: v.y * Math.sin(a) + v.z * Math.cos(a)
  });
  const RY = (v, a) => ({
    x: v.x * Math.cos(a) + v.z * Math.sin(a),
    y: v.y,
    z: -v.x * Math.sin(a) + v.z * Math.cos(a)
  });
  const half = (+roof.span || 8) / 2;
  const hip = roof.kind === "hip" ? pan && pan.hip || p3HipFaces(roof) : null;
  const hipF = {};
  if (hip) hip.faces.forEach(f => {
    hipF[f.side] = f;
  });
  const chain = (side, v, isDir) => {
    let p = {
      x: v.x,
      y: v.y,
      z: v.z
    };
    if (roof.kind === "poly" || roof.kind === "dome") return p;
    if (roof.kind === "hip") {
      const f = hipF[side] || {
        wrapY: 0,
        tiltZ: 0
      };
      p = RX(p, pitchR);
      if (!isDir) p.z += f.tiltZ;
      return RY(p, f.wrapY);
    }
    if (roof.kind === "gable") {
      p = RX(p, pitchR);
      if (!isDir) p.z += half;
      return side === "B" ? RY(p, Math.PI) : p;
    }
    return RX(p, pitchR);
  };
  const world = (v, isDir) => {
    const w = RY(v, rotY);
    return isDir ? w : {
      x: w.x + (+roof.x || 0),
      y: w.y,
      z: w.z + (+roof.z || 0)
    };
  };
  return {
    chain,
    world,
    RX,
    RY,
    pitchR,
    rotY
  };
}
function p3RoofSurf(roof) {
  const pan = p3Panels(roof);
  if (roof.kind === "dome" || !pan.faces || !pan.toMesh) return [];
  const X = p3Xf(roof, pan);
  return pan.faces.map(f => ({
    roofId: roof.id,
    side: f.side || null,
    pts: (f.poly || []).map(q => {
      const m = pan.toMesh({
        u: q.x,
        v: q.z
      });
      const c = X.world(X.chain(f.side, {
        x: m.x,
        y: m.y || 0,
        z: m.z
      }, false), false);
      return {
        x: c.x,
        y: c.y + (+roof.h || 0),
        z: c.z
      };
    })
  })).filter(s => s.pts.length >= 3);
}
function p3Foot(roof) {
  const pan = p3Panels(roof);
  const blocks = pan.blocks || [];
  const X = p3Xf(roof, pan);
  const RX = X.RX,
    RY = X.RY,
    chain = X.chain,
    world = X.world;
  const out = [];
  (pan.list || []).forEach(p => {
    if (p.skip || p.slot) return;
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
    const pts = [[cw.x - U.x - V.x, cw.z - U.z - V.z], [cw.x + U.x - V.x, cw.z + U.z - V.z], [cw.x + U.x + V.x, cw.z + U.z + V.z], [cw.x - U.x + V.x, cw.z - U.z + V.z]];
    const cy = cw.y + (+roof.h || 0);
    const n0 = {
      x: V.y * U.z - V.z * U.y,
      y: V.z * U.x - V.x * U.z,
      z: V.x * U.y - V.y * U.x
    };
    const nl = Math.hypot(n0.x, n0.y, n0.z) || 1;
    const n = {
      x: n0.x / nl,
      y: n0.y / nl,
      z: n0.z / nl
    };
    out.push({
      key: p.key,
      uid: roof.id + "|" + p.key,
      roofId: roof.id,
      blk: p.blk,
      side: p.side || null,
      rx: p.rx || 0,
      cx: cw.x,
      cz: cw.z,
      pts,
      cy,
      u: U,
      v: V,
      n: n.y < 0 ? {
        x: -n.x,
        y: -n.y,
        z: -n.z
      } : n
    });
  });
  return out;
}
function p3FootAll(st) {
  const panels = [];
  const outlines = [];
  (st.roofs || []).forEach(roof => {
    p3Foot(roof).forEach(f => panels.push(Object.assign({
      roofName: roof.name
    }, f)));
    if (roof.kind === "poly" && Array.isArray(roof.pts)) {
      outlines.push({
        roofId: roof.id,
        pts: roof.pts.map(p => [(+p.x || 0) + (+roof.x || 0), (+p.z || 0) + (+roof.z || 0)])
      });
    }
  });
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
  panels.forEach(p => p.pts.forEach(q => eat(q[0], q[1])));
  outlines.forEach(o => o.pts.forEach(q => eat(q[0], q[1])));
  if (minX > maxX) {
    minX = -5;
    maxX = 5;
    minZ = -5;
    maxZ = 5;
  }
  return {
    panels,
    outlines,
    bounds: {
      minX,
      maxX,
      minZ,
      maxZ
    }
  };
}
function p3SunPos(sun) {
  const N = Math.min(365, Math.max(1, Math.round((sun.month - 1) * 30.4 + sun.day)));
  const decl = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365);
  const solarHour = sun.hour + ((+sun.lng || 100.5) - 105) / 15;
  const H = 15 * (solarHour - 12);
  const lat = (+sun.lat || 13.75) * P3_DEG,
    d = decl * P3_DEG,
    h = H * P3_DEG;
  const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(d) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-9))));
  if (H > 0) az = 2 * Math.PI - az;
  return {
    alt: alt / P3_DEG,
    az: az / P3_DEG
  };
}
function p3InPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x,
      zi = pts[i].z,
      xj = pts[j].x,
      zj = pts[j].z;
    if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}
function p3Area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].z - pts[i].z);
  return Math.abs(a / 2);
}
function p3SurfInfo(roof) {
  const pts = roof.pts || [];
  const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
  if (pts.length < 2) return {
    loc: [],
    surf: [],
    zoff: 0,
    cosP,
    rot: 0,
    hi: 0
  };
  const n = pts.length;
  const hi = (Math.round(+roof.hinge || 0) % n + n) % n;
  const A = pts[hi],
    B = pts[(hi + 1) % n];
  const rotate = r => pts.map(p => ({
    x: (+p.x || 0) * Math.cos(r) + (+p.z || 0) * Math.sin(r),
    z: -(+p.x || 0) * Math.sin(r) + (+p.z || 0) * Math.cos(r)
  }));
  let rot = -Math.atan2((+B.z || 0) - (+A.z || 0), (+B.x || 0) - (+A.x || 0));
  let loc = rotate(rot);
  let hz = loc[hi].z;
  const cz = loc.reduce((s, p) => s + p.z, 0) / n;
  if (cz > hz) {
    rot += Math.PI;
    loc = rotate(rot);
    hz = loc[hi].z;
  }
  const zoff = hz;
  const surf = loc.map(p => ({
    x: p.x,
    z: (p.z - zoff) / cosP
  }));
  return {
    loc,
    surf,
    zoff,
    cosP,
    rot,
    hi
  };
}
function p3PhOf(roof) {
  const pts = roof.pts || [];
  const base = roof.h == null ? 3 : +roof.h;
  const ph = Array.isArray(roof.ph) ? roof.ph.slice(0, pts.length) : [];
  for (let i = 0; i < pts.length; i++) if (ph[i] == null) ph[i] = base;
  return ph;
}
function p3Newell(vs) {
  let nx = 0,
    ny = 0,
    nz = 0;
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i],
      b = vs[(i + 1) % vs.length];
    nx += (a.y - b.y) * (a.z + b.z);
    ny += (a.z - b.z) * (a.x + b.x);
    nz += (a.x - b.x) * (a.y + b.y);
  }
  const L = Math.hypot(nx, ny, nz) || 1;
  return {
    x: nx / L,
    y: ny / L,
    z: nz / L
  };
}
function p3PolyPlane(roof) {
  const pts = roof.pts || [];
  const nP = pts.length;
  if (nP < 3) return null;
  const ph = p3PhOf(roof);
  const vs = pts.map((p, i) => ({
    x: +p.x || 0,
    y: ph[i],
    z: +p.z || 0
  }));
  let n = p3Newell(vs);
  if (n.y < 0) n = {
    x: -n.x,
    y: -n.y,
    z: -n.z
  };
  const c = {
    x: vs.reduce((s, v) => s + v.x, 0) / nP,
    y: vs.reduce((s, v) => s + v.y, 0) / nP,
    z: vs.reduce((s, v) => s + v.z, 0) / nP
  };
  let u = {
    x: n.z,
    y: 0,
    z: -n.x
  };
  const lu = Math.hypot(u.x, u.z);
  if (lu < 1e-6) u = {
    x: 1,
    y: 0,
    z: 0
  };else u = {
    x: u.x / lu,
    y: 0,
    z: u.z / lu
  };
  const v = {
    x: n.y * u.z - n.z * u.y,
    y: n.z * u.x - n.x * u.z,
    z: n.x * u.y - n.y * u.x
  };
  return {
    c,
    u,
    v,
    n,
    vs,
    tiltCos: Math.max(0.05, Math.abs(n.y))
  };
}
function p3NormBlk(b, i) {
  return {
    id: b.id || "b" + i,
    i,
    pfx: i === 0 ? "" : "b" + i + "_",
    orient: b.orient === "landscape" ? "landscape" : "portrait",
    rows: Math.max(0, Math.round(+b.rows || 0)),
    cols: Math.max(0, Math.round(+b.cols || 0)),
    gap: b.gap == null ? 0.02 : Math.max(0, +b.gap),
    du: +b.du || 0,
    dv: +b.dv || 0,
    rot: +b.rot || 0,
    gc: Math.max(0, Math.round(+b.gc || 0)),
    gr: Math.max(0, Math.round(+b.gr || 0)),
    gg: Math.max(0, +b.gg || 0),
    keep: b.keep === true,
    tilt: Math.max(0, Math.min(60, +b.tilt || 0)),
    skips: b.skips || {},
    adds: b.adds || {}
  };
}
function p3Blocks(roof) {
  const bs = Array.isArray(roof.blocks) && roof.blocks.length ? roof.blocks : [{
    id: "b0",
    orient: roof.orient,
    rows: roof.rows,
    cols: roof.cols,
    gap: roof.gap,
    skips: roof.skips,
    adds: roof.adds
  }];
  return bs.map(p3NormBlk);
}
function p3NewBlk(i) {
  return {
    id: p3Id("pb"),
    orient: "portrait",
    rows: 0,
    cols: 0,
    gap: 0.02,
    du: 0,
    dv: 0,
    rot: 0,
    tilt: 0,
    skips: {},
    adds: {}
  };
}
const p3BlkRy = (roof, blk) => (roof && roof.kind === "poly" ? 1 : -1) * (+(blk && blk.rot) || 0) * P3_DEG;
const p3BlkPW = b => b.orient === "portrait" ? P3_PANEL_SHORT : P3_PANEL_LONG;
const p3BlkPD = b => b.orient === "portrait" ? P3_PANEL_LONG : P3_PANEL_SHORT;
function p3FillBlk(face, blk, m, want) {
  const pw = p3BlkPW(blk),
    pd = p3BlkPD(blk),
    gap = blk.gap;
  const poly = face.poly;
  const us = poly.map(p => p.x),
    vs = poly.map(p => p.z);
  const minU = Math.min.apply(null, us),
    maxU = Math.max.apply(null, us);
  const minV = Math.min.apply(null, vs),
    maxV = Math.max.apply(null, vs);
  const gc = blk.gc,
    gr = blk.gr,
    gg = blk.gg;
  const offU = c => gc > 0 && gg > 0 ? Math.floor(c / gc) * gg : 0;
  const offV = r => gr > 0 && gg > 0 ? Math.floor(r / gr) * gg : 0;
  const spanW = n => n * pw + (n - 1) * gap + (gc > 0 && gg > 0 ? (Math.ceil(n / gc) - 1) * gg : 0);
  const spanD = n => n * pd + (n - 1) * gap + (gr > 0 && gg > 0 ? (Math.ceil(n / gr) - 1) * gg : 0);
  const fitN = (avail, span) => {
    let n = 0;
    while (span(n + 1) <= avail + 1e-9) n++;
    return n;
  };
  const maxCols = fitN(maxU - minU - 2 * m, spanW);
  const maxRows = fitN(maxV - minV - 2 * m, spanD);
  const res = {
    list: [],
    slots: [],
    count: 0,
    maxRows,
    maxCols
  };
  const cols = blk.cols > 0 ? Math.min(blk.cols, maxCols) : maxCols;
  const rows = blk.rows > 0 ? Math.min(blk.rows, maxRows) : maxRows;
  if (maxCols < 1 || maxRows < 1) return res;
  const gridW = spanW(cols),
    gridD = spanD(rows);
  let cellU, cellV;
  if (face.anchor === "topCenter") {
    cellU = c => -gridW / 2 + c * (pw + gap) + offU(c) + pw / 2;
    cellV = r => maxV - m - gridD + r * (pd + gap) + offV(r) + pd / 2;
  } else if (face.anchor === "minMin") {
    cellU = c => minU + m + c * (pw + gap) + offU(c) + pw / 2;
    cellV = r => minV + m + r * (pd + gap) + offV(r) + pd / 2;
  } else {
    cellU = c => minU + m + c * (pw + gap) + offU(c) + pw / 2;
    cellV = r => maxV - m - r * (pd + gap) - offV(r) - pd / 2;
  }
  const Au = (cellU(0) + cellU(Math.max(0, cols - 1))) / 2,
    Av = (cellV(0) + cellV(Math.max(0, rows - 1))) / 2;
  const rotR = blk.rot * P3_DEG,
    cs = Math.cos(rotR),
    sn = Math.sin(rotR);
  const moved = !!(blk.rot || blk.du || blk.dv);
  const xf = (u, v) => {
    const a = u - Au,
      b = v - Av;
    return {
      u: Au + a * cs - b * sn + blk.du,
      v: Av + a * sn + b * cs + blk.dv
    };
  };
  const keepOn = !!blk.keep;
  const mi = Math.max(0, m - 0.02);
  const fits = (u, v, mode) => {
    if (mode === "add") return p3InPoly(u, v, poly);
    if (mode === "keep") return true;
    if (mode === "auto" && !moved && face.test === false) return true;
    const pad = mode === "slot" ? 0.01 : moved ? 0.01 : mi;
    const hw = pw / 2 + pad,
      hd = pd / 2 + pad;
    const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, -hd], [0, hd], [-hw, 0], [hw, 0]].map(([a, b]) => moved ? [u + a * cs - b * sn, v + a * sn + b * cs] : [u + a, v + b]);
    return pts.every(t => p3InPoly(t[0], t[1], poly));
  };
  const push = (r, c, mode) => {
    const p0 = {
        u: cellU(c),
        v: cellV(r)
      },
      p = xf(p0.u, p0.v);
    if (!fits(p.u, p.v, mode)) return false;
    const key = blk.pfx + face.keyPfx + r + "_" + c;
    const skip = !!blk.skips[key];
    res.list.push({
      key,
      side: face.side,
      u: p.u,
      v: p.v,
      pw,
      pd,
      blk: blk.i,
      skip
    });
    if (!skip) res.count++;
    return true;
  };
  res.rect = {
    cu: Au + blk.du,
    cv: Av + blk.dv,
    w: gridW,
    h: gridD,
    rot: blk.rot,
    rows,
    cols,
    maxRows,
    maxCols,
    pw,
    pd,
    gap,
    anchor: face.anchor,
    m,
    bb: {
      minU,
      maxU,
      minV,
      maxV
    },
    gc,
    gr,
    gg
  };
  const used = {};
  const keepRect = () => {
    const dg = Math.hypot(maxU - minU, maxV - minV);
    let nr = Math.ceil(dg / (pd + gap)) + 2,
      nc = Math.ceil(dg / (pw + gap)) + 2;
    while ((rows + 2 * nr) * (cols + 2 * nc) > 20000 && (nr > 1 || nc > 1)) {
      nr = Math.max(1, Math.floor(nr * 0.75));
      nc = Math.max(1, Math.floor(nc * 0.75));
    }
    const i0 = -nr,
      j0 = -nc,
      R = rows + 2 * nr,
      C = cols + 2 * nc;
    const okRow = [];
    for (let i = 0; i < R; i++) {
      const row = new Uint8Array(C);
      for (let j = 0; j < C; j++) {
        const p = xf(cellU(j0 + j), cellV(i0 + i));
        row[j] = fits(p.u, p.v, "slot") ? 1 : 0;
      }
      okRow.push(row);
    }
    const capR = blk.rows > 0 ? blk.rows : R,
      capC = blk.cols > 0 ? blk.cols : C;
    let best = null;
    const hgt = new Int32Array(C);
    for (let i = 0; i < R; i++) {
      for (let j = 0; j < C; j++) hgt[j] = okRow[i][j] ? Math.min(hgt[j] + 1, capR) : 0;
      const stk = [];
      for (let j = 0; j <= C; j++) {
        const h = j < C ? hgt[j] : 0;
        while (stk.length && hgt[stk[stk.length - 1]] > h) {
          const hh = hgt[stk.pop()];
          const left = stk.length ? stk[stk.length - 1] + 1 : 0;
          const w = Math.min(j - left, capC);
          if (hh > 0 && w > 0) {
            const cu = (cellU(j0 + j - w) + cellU(j0 + j - 1)) / 2;
            const cv = (cellV(i0 + i - hh + 1) + cellV(i0 + i)) / 2;
            const d2 = (cu - Au) * (cu - Au) + (cv - Av) * (cv - Av);
            const area = hh * w;
            if (!best || area > best.area || area === best.area && d2 < best.d2) {
              best = {
                i: i - hh + 1,
                j: j - w,
                h: hh,
                w,
                area,
                d2
              };
            }
          }
        }
        stk.push(j);
      }
    }
    if (!best) return null;
    return {
      r0: i0 + best.i,
      c0: j0 + best.j,
      rows: best.h,
      cols: best.w
    };
  };
  const kr = keepOn ? keepRect() : null;
  if (kr) {
    for (let r = kr.r0; r < kr.r0 + kr.rows; r++) for (let c = kr.c0; c < kr.c0 + kr.cols; c++) {
      if (push(r, c, "keep")) used[r + "_" + c] = 1;
    }
    const uA = cellU(kr.c0),
      uB = cellU(kr.c0 + kr.cols - 1);
    const vA = cellV(kr.r0),
      vB = cellV(kr.r0 + kr.rows - 1);
    const ctr = xf((uA + uB) / 2, (vA + vB) / 2);
    res.rect.cu = ctr.u;
    res.rect.cv = ctr.v;
    res.rect.w = Math.abs(uB - uA) + pw;
    res.rect.h = Math.abs(vB - vA) + pd;
    res.rect.rows = kr.rows;
    res.rect.cols = kr.cols;
  } else {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (push(r, c, "auto")) used[r + "_" + c] = 1;
    }
  }
  Object.keys(blk.adds || {}).forEach(k => {
    if (!blk.adds[k] || !k.startsWith(blk.pfx + face.keyPfx)) return;
    const mm = /(-?\d+)_(-?\d+)$/.exec(k);
    if (!mm || used[mm[1] + "_" + mm[2]]) return;
    used[mm[1] + "_" + mm[2]] = 1;
    push(+mm[1], +mm[2], "add");
  });
  if (!want || !want.slots) return res;
  const diag = Math.hypot(maxU - minU, maxV - minV);
  const nc = Math.ceil(diag / (pw + gap)) + 2,
    nr = Math.ceil(diag / (pd + gap)) + 2;
  for (let r = -nr; r <= rows + nr; r++) for (let c = -nc; c <= cols + nc; c++) {
    if (used[r + "_" + c]) continue;
    const p = xf(cellU(c), cellV(r));
    if (!fits(p.u, p.v, "slot")) continue;
    res.slots.push({
      key: blk.pfx + face.keyPfx + r + "_" + c,
      side: face.side,
      u: p.u,
      v: p.v,
      pw,
      pd,
      blk: blk.i,
      slot: true
    });
  }
  return res;
}
function p3BlkC0(rect, rows, cols) {
  const gg = rect.gg || 0;
  const gW = cols * rect.pw + (cols - 1) * rect.gap + (rect.gc > 0 && gg > 0 ? (Math.ceil(cols / rect.gc) - 1) * gg : 0);
  const gD = rows * rect.pd + (rows - 1) * rect.gap + (rect.gr > 0 && gg > 0 ? (Math.ceil(rows / rect.gr) - 1) * gg : 0);
  const b = rect.bb,
    m = rect.m;
  if (rect.anchor === "topCenter") return {
    u: 0,
    v: b.maxV - m - gD / 2,
    w: gW,
    h: gD
  };
  if (rect.anchor === "minMin") return {
    u: b.minU + m + gW / 2,
    v: b.minV + m + gD / 2,
    w: gW,
    h: gD
  };
  return {
    u: b.minU + m + gW / 2,
    v: b.maxV - m - gD / 2,
    w: gW,
    h: gD
  };
}
function p3Faces(roof, pan) {
  if (roof.kind === "hip") {
    const H = pan.hip;
    return H.faces.filter(f => roof["side" + f.side] !== false).map(f => ({
      side: f.side,
      keyPfx: f.side + "_",
      anchor: "topLeft",
      poly: f.poly
    }));
  }
  if (roof.kind === "gable") {
    const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
    const half = (+roof.span || 8) / 2,
      sl = half / cosP,
      rg = (+roof.ridge || 8) / 2;
    pan.slopeLen = sl;
    const rect = [{
      x: -rg,
      z: 0
    }, {
      x: rg,
      z: 0
    }, {
      x: rg,
      z: -sl
    }, {
      x: -rg,
      z: -sl
    }];
    return ["A", "B"].filter(s => s === "A" ? roof.sideA !== false : roof.sideB !== false).map(s => ({
      side: s,
      keyPfx: s + "_",
      anchor: "topCenter",
      test: false,
      poly: rect
    }));
  }
  if (roof.kind === "poly" && pan.plane) {
    const {
      c,
      u,
      v
    } = pan.plane;
    const dot = (p, w) => (p.x - c.x) * w.x + (p.y - c.y) * w.y + (p.z - c.z) * w.z;
    return [{
      side: null,
      keyPfx: "",
      anchor: "minMin",
      poly: pan.plane.vs.map(vv => ({
        x: dot(vv, u),
        z: dot(vv, v)
      }))
    }];
  }
  const w = Math.max(0.5, +roof.w || 8),
    d = Math.max(0.5, +roof.d || 5);
  return [{
    side: null,
    keyPfx: "",
    anchor: "topCenter",
    test: false,
    poly: [{
      x: -w / 2,
      z: 0
    }, {
      x: w / 2,
      z: 0
    }, {
      x: w / 2,
      z: -d
    }, {
      x: -w / 2,
      z: -d
    }]
  }];
}
const _p3PanCache = new Map();
function p3Panels(roof, want) {
  const key = JSON.stringify(want || 0) + "" + JSON.stringify(roof);
  const hit = _p3PanCache.get(key);
  if (hit) return hit;
  const res = p3PanelsCalc(roof, want);
  if (_p3PanCache.size > 32) _p3PanCache.clear();
  _p3PanCache.set(key, res);
  return res;
}
function p3PanelsCalc(roof, want) {
  const m = +roof.margin || 0;
  const blocks = p3Blocks(roof);
  const out = {
    blocks,
    list: [],
    count: 0,
    maxRows: 0,
    maxCols: 0,
    surfInfo: null,
    perBlk: [],
    countA: 0,
    countB: 0,
    countC: 0,
    countD: 0,
    pw: p3BlkPW(blocks[0]),
    pd: p3BlkPD(blocks[0]),
    gap: blocks[0].gap
  };
  const wantB = want && want.slots ? want.blk == null ? -1 : want.blk : null;
  if (roof.kind === "dome") {
    const D = p3DomeGeo(roof);
    out.dome = D;
    const maxT = (roof.maxTilt == null ? 90 : +roof.maxTilt) * P3_DEG;
    out.rowTilts = [];
    blocks.forEach(blk => {
      const pw = p3BlkPW(blk),
        pd = p3BlkPD(blk),
        gap = blk.gap;
      const mc = Math.max(0, Math.floor((D.len - 2 * m + gap) / (pw + gap)));
      const mr = Math.max(0, Math.floor((D.arc - 2 * m + gap) / (pd + gap)));
      out.maxCols = Math.max(out.maxCols, mc);
      out.maxRows = Math.max(out.maxRows, mr);
      const cols = blk.cols > 0 ? Math.min(blk.cols, mc) : mc;
      const rows = blk.rows > 0 ? Math.min(blk.rows, mr) : mr;
      const gridW = cols * pw + (cols - 1) * gap,
        gridA = rows * pd + (rows - 1) * gap;
      const x0 = -gridW / 2 + blk.du,
        s0 = (D.arc - gridA) / 2 + blk.dv;
      let n = 0;
      for (let r = 0; r < rows; r++) {
        const t = -D.th + (s0 + r * (pd + gap) + pd / 2) / D.rad;
        if (Math.abs(t) > maxT + 1e-6 || t < -D.th || t > D.th) continue;
        if (blk.i === 0) out.rowTilts.push(Math.abs(Math.round(t / P3_DEG)));
        const yc = D.yAt(t),
          zc = D.zAt(t);
        for (let c = 0; c < cols; c++) {
          const key = blk.pfx + r + "_" + c,
            skip = !!blk.skips[key];
          out.list.push({
            key,
            x: x0 + c * (pw + gap) + pw / 2,
            y: yc,
            z: zc,
            rx: t,
            pw,
            pd,
            blk: blk.i,
            skip
          });
          if (!skip) {
            out.count++;
            n++;
          }
        }
      }
      out.perBlk.push({
        maxRows: mr,
        maxCols: mc,
        count: n
      });
    });
    return out;
  }
  if (roof.kind === "hip") out.hip = p3HipFaces(roof);
  if (roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3) out.plane = p3PolyPlane(roof);
  if (roof.kind === "poly" && !out.plane) return out;
  const faces = p3Faces(roof, out);
  out.faces = faces;
  out.rects = [];
  const toMesh = roof.kind === "poly" && out.plane ? p => {
    const {
      c,
      u,
      v
    } = out.plane;
    return {
      x: c.x + p.u * u.x + p.v * v.x,
      y: c.y + p.u * u.y + p.v * v.y,
      z: c.z + p.u * u.z + p.v * v.z
    };
  } : p => ({
    x: p.u,
    z: p.v
  });
  out.toMesh = toMesh;
  blocks.forEach(blk => {
    const ry = p3BlkRy(roof, blk),
      tiltR = blk.tilt * P3_DEG;
    let mr = 0,
      mc = 0,
      n = 0;
    faces.forEach((face, fi) => {
      const slots = wantB != null && (wantB === -1 || wantB === blk.i);
      const r = p3FillBlk(face, blk, m, {
        slots
      });
      if (r.rect) out.rects.push(Object.assign({
        blk: blk.i,
        side: face.side,
        faceIdx: fi
      }, r.rect));
      mr = Math.max(mr, r.maxRows);
      mc = Math.max(mc, r.maxCols);
      if (roof.kind === "gable") {
        out["count" + face.side] = (out["count" + face.side] || 0) + r.count;
      }
      if (roof.kind === "hip") {
        out["count" + face.side] = (out["count" + face.side] || 0) + r.count;
      }
      r.list.concat(r.slots).forEach(p => {
        out.list.push(Object.assign({}, p, toMesh(p), {
          ry,
          tiltR
        }));
      });
      out.count += r.count;
      n += r.count;
    });
    out.maxRows = Math.max(out.maxRows, mr);
    out.maxCols = Math.max(out.maxCols, mc);
    out.perBlk.push({
      maxRows: mr,
      maxCols: mc,
      count: n
    });
  });
  return out;
}
function p3CountAll(st) {
  return (st.roofs || []).reduce((s, r) => s + p3Panels(r).count, 0);
}
function p3SnapPoints(roofs, exceptId) {
  const seen = {},
    out = [];
  (roofs || []).forEach(r => {
    if (r.id === exceptId || r.kind !== "poly" || !Array.isArray(r.pts)) return;
    r.pts.forEach(p => {
      const wx = (+r.x || 0) + (+p.x || 0),
        wz = (+r.z || 0) + (+p.z || 0);
      const k = Math.round(wx * 10) + "_" + Math.round(wz * 10);
      if (seen[k]) return;
      seen[k] = 1;
      out.push({
        x: wx,
        z: wz
      });
    });
  });
  return out;
}
function p3WorldToSurf(roof, info, wx, wz) {
  const rot = ((+roof.az || 180) - 180) * P3_DEG;
  const px = wx - (+roof.x || 0),
    pz = wz - (+roof.z || 0);
  const lx = px * Math.cos(rot) + pz * Math.sin(rot);
  const lz = -px * Math.sin(rot) + pz * Math.cos(rot);
  return {
    x: lx,
    z: (lz - info.zoff) / info.cosP
  };
}
const P3_INP = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--surface2)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13,
  padding: "7px 9px",
  borderRadius: 9,
  outline: "none"
};
const P3_CSS = `
.p3{--ink:#0D1714;--ink2:#18261F;--ln:rgba(13,23,20,.10);--ln2:rgba(13,23,20,.17);
  --ac:var(--primary,var(--tint-green-tx));--acs:rgba(22,163,74,.11);--acd:var(--primary-dark,#15803D);
  --trk:rgba(13,23,20,.11);--warn:var(--tint-amber-tx);--dngr:var(--tint-red-tx);
  --sh:0 1px 2px rgba(13,23,20,.05),0 10px 28px -16px rgba(13,23,20,.28);
  font-variant-numeric:tabular-nums;}
.p3 *{box-sizing:border-box}
.p3 button{font-family:inherit;transition:background .15s ease,border-color .15s ease,color .15s ease,box-shadow .15s ease,opacity .15s ease}
.p3 button:not(:disabled){cursor:pointer}
.p3 button:focus-visible,.p3 input:focus-visible{outline:2px solid var(--ac);outline-offset:2px}

/* ---- ปุ่ม ---- */
.p3-b{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:8px 13px;border-radius:10px;
  border:1px solid var(--ln2);background:var(--surface);color:var(--text-1);font-size:12px;font-weight:650;letter-spacing:.1px}
.p3-b:hover:not(:disabled){background:var(--surface2);border-color:var(--ln2)}
.p3-b:active:not(:disabled){background:var(--surface3)}
.p3-b:disabled{opacity:.42}
.p3-b.w{width:100%}
.p3-b.pri{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:700;box-shadow:0 1px 2px rgba(13,23,20,.10)}
.p3-b.pri:hover:not(:disabled){background:var(--acd);border-color:var(--acd)}
.p3-b.pri:disabled{background:var(--surface3);border-color:transparent;color:var(--text-3);box-shadow:none;opacity:1}
.p3-b.soft{background:var(--acs);border-color:transparent;color:var(--acd);font-weight:700}
.p3-b.soft:hover:not(:disabled){background:rgba(22,163,74,.17)}
.p3-b.dashed{border-style:dashed;border-color:var(--ln2);background:transparent;color:var(--text-2)}
.p3-b.dashed:hover:not(:disabled){border-color:var(--ac);color:var(--acd);background:var(--acs)}
.p3-b.dngr{color:var(--dngr);border-color:rgba(185,28,28,.28);background:transparent}
.p3-b.dngr:hover:not(:disabled){background:rgba(185,28,28,.08)}
.p3-b.dngr.solid{background:var(--dngr);border-color:var(--dngr);color:#fff}
.p3-b.sm{padding:6px 10px;font-size:11.5px;border-radius:9px}
.p3-lnk{border:none;background:none;padding:0;color:var(--text-3);font-size:11px;font-weight:650;font-family:inherit;
  cursor:pointer;border-bottom:1px solid var(--ln2);line-height:1.35;transition:color .15s ease,border-color .15s ease}
.p3-lnk:hover{color:var(--acd);border-color:var(--ac)}

/* ---- แท็บแบบ segmented (มีตัวชี้เป็นแผ่นขาวยกขึ้นมา) ---- */
.p3-seg{display:flex;gap:2px;padding:3px;border-radius:13px;background:var(--surface2);border:1px solid var(--ln)}
.p3-seg button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 6px;
  border:none;border-radius:10px;background:transparent;color:var(--text-3);font-size:10px;font-weight:700;letter-spacing:.1px}
.p3-seg button:hover{color:var(--text-1)}
.p3-seg button[data-on="1"]{background:var(--surface);color:var(--ink);
  box-shadow:0 1px 2px rgba(13,23,20,.10),0 0 0 1px rgba(13,23,20,.04)}
.p3-seg button[data-on="1"] svg{color:var(--ac)}

/* ---- การ์ด / หัวข้อย่อย ---- */
.p3-card{border:1px solid var(--ln);border-radius:14px;background:var(--surface);padding:11px 12px;
  display:flex;flex-direction:column;gap:9px}
.p3-card.tint{background:linear-gradient(180deg,var(--acs),transparent 62%)}
.p3-card.amber{border-color:rgba(180,83,9,.22);background:linear-gradient(180deg,rgba(245,158,11,.10),transparent 62%)}
.p3-card.cyan{border-color:rgba(8,145,178,.22);background:linear-gradient(180deg,rgba(8,145,178,.09),transparent 62%)}
.p3-eb{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.02em;color:var(--text-3)}
.p3-eb .ln{flex:1;height:1px;background:var(--ln)}
.p3-note{font-size:11px;line-height:1.65;color:var(--text-3)}
.p3-stat{display:flex;align-items:baseline;gap:5px;font-size:11.5px;color:var(--text-2)}
.p3-stat b{font-size:13px;font-weight:800;color:var(--text-1)}

/* ---- ชิป ---- */
.p3-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:99px;border:1px solid var(--ln2);
  background:var(--surface);color:var(--text-2);font-size:11.5px;font-weight:650;line-height:1.5}
.p3-chip:hover{border-color:var(--text-3);color:var(--text-1)}
.p3-chip[data-on="1"]{border-color:var(--ac);background:var(--acs);color:var(--acd);font-weight:750}
.p3-chip .dot{width:7px;height:7px;border-radius:99px;flex:0 0 auto}

/* ---- ช่องกรอก ---- */
.p3-f{display:flex;flex-direction:column;gap:5px;min-width:0}
.p3-f>span.lb{font-size:10.5px;font-weight:700;color:var(--text-3);line-height:1.4}
.p3-inp{width:100%;min-width:0;background:var(--surface2);border:1px solid var(--ln2);color:var(--text-1);
  font-family:inherit;font-size:13px;font-weight:600;padding:7px 9px;border-radius:9px;outline:none;
  transition:border-color .15s ease,box-shadow .15s ease,background .15s ease;font-variant-numeric:tabular-nums}
.p3-inp:hover{border-color:var(--text-3)}
.p3-inp:focus{background:var(--surface);border-color:var(--ac);box-shadow:0 0 0 3px var(--acs);outline:none}
.p3 input[type=number]::-webkit-outer-spin-button,.p3 input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.p3 input[type=number]{-moz-appearance:textfield}
.p3-sfx{font-size:10.5px;font-weight:700;color:var(--text-3);flex:0 0 auto}

/* ---- สไลเดอร์ (แถบเติมสีตามค่า --p) ---- */
.p3 input[type=range]{-webkit-appearance:none;appearance:none;width:100%;min-width:0;height:20px;background:transparent;margin:0}
.p3 input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;
  background:linear-gradient(90deg,var(--ac) calc(var(--p,0) * 1%),var(--trk) calc(var(--p,0) * 1%))}
.p3 input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5px;border-radius:99px;
  background:#fff;border:1.5px solid var(--ac);box-shadow:0 1px 3px rgba(13,23,20,.28);transition:box-shadow .15s ease}
.p3 input[type=range]:hover::-webkit-slider-thumb{box-shadow:0 0 0 4px var(--acs),0 1px 3px rgba(13,23,20,.28)}
.p3 input[type=range]:active::-webkit-slider-thumb{box-shadow:0 0 0 6px var(--acs),0 1px 3px rgba(13,23,20,.28)}
.p3 input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:var(--trk)}
.p3 input[type=range]::-moz-range-progress{height:5px;border-radius:99px;background:var(--ac)}
.p3 input[type=range]::-moz-range-thumb{width:13px;height:13px;border-radius:99px;background:#fff;border:1.5px solid var(--ac)}

/* ---- แถบเครื่องมือลอยบนภาพ (กระจกฝ้า) ---- */
.p3-tools{display:inline-flex;align-items:center;gap:2px;padding:4px;border-radius:14px;
  background:rgba(255,255,255,.74);-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);
  border:1px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(13,23,20,.10),0 16px 34px -18px rgba(13,23,20,.55)}
.p3-tool{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;border:none;border-radius:10px;
  background:transparent;color:#34453E;font-size:11.5px;font-weight:700;white-space:nowrap}
.p3-tool:hover{background:rgba(13,23,20,.07);color:var(--ink)}
.p3-tool[data-on="1"]{background:var(--ink);color:#fff}
.p3-tool[data-on="1"][data-tone="warn"]{background:var(--warn)}
.p3-tool[data-on="1"][data-tone="info"]{background:#2563EB}
.p3-vr{width:1px;align-self:stretch;margin:5px 3px;background:rgba(13,23,20,.13)}
.p3-hint{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:600;color:#2C3D36;
  background:rgba(255,255,255,.78);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  padding:5px 11px;border-radius:99px;box-shadow:0 1px 2px rgba(13,23,20,.08)}
.p3-hint em{font-style:normal;font-weight:800;color:var(--ink)}

/* ---- หัวเรื่อง (พื้นขาว) ---- */
.p3-head{background:var(--surface);color:var(--text-1);border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:12px;flex-shrink:0}
.p3-head .ghost{width:34px;height:34px;border-radius:10px;border:1px solid var(--ln2);background:var(--surface);
  color:var(--text-2);display:grid;place-items:center;flex-shrink:0}
.p3-head .ghost:hover{background:var(--surface2);color:var(--text-1)}
.p3-kpi{display:flex;align-items:baseline;gap:4px;line-height:1}
.p3-kpi .n{font-size:19px;font-weight:800;letter-spacing:-.4px;color:var(--text-1)}
.p3-kpi .u{font-size:10px;font-weight:700;color:var(--text-3)}

/* ---- แถบเลื่อนของ rail ---- */
.p3-rail::-webkit-scrollbar{width:9px}
.p3-rail::-webkit-scrollbar-thumb{background:rgba(13,23,20,.16);border-radius:99px;border:3px solid var(--surface)}
.p3-rail::-webkit-scrollbar-thumb:hover{background:rgba(13,23,20,.28)}
.p3-rail::-webkit-scrollbar-track{background:transparent}
`;
function P3Icon({
  name,
  size,
  w
}) {
  const s = size || 15;
  const F = React.Fragment;
  const ic = {
    cube: React.createElement(F, null, React.createElement("path", {
      d: "M8 1.7 14.1 5.1v5.8L8 14.3 1.9 10.9V5.1z"
    }), React.createElement("path", {
      d: "M1.9 5.1 8 8.5l6.1-3.4"
    }), React.createElement("path", {
      d: "M8 8.5v5.8"
    })),
    plan: React.createElement(F, null, React.createElement("rect", {
      x: "1.9",
      y: "1.9",
      width: "12.2",
      height: "12.2",
      rx: "1.5"
    }), React.createElement("path", {
      d: "M6.4 1.9v12.2M6.4 8.9h7.7"
    })),
    nodes: React.createElement(F, null, React.createElement("path", {
      d: "M8 3.2 13 12.4H3z"
    }), React.createElement("circle", {
      cx: "8",
      cy: "3.2",
      r: "1.5"
    }), React.createElement("circle", {
      cx: "13",
      cy: "12.4",
      r: "1.5"
    }), React.createElement("circle", {
      cx: "3",
      cy: "12.4",
      r: "1.5"
    })),
    lock: React.createElement(F, null, React.createElement("rect", {
      x: "3.4",
      y: "7",
      width: "9.2",
      height: "6.6",
      rx: "1.5"
    }), React.createElement("path", {
      d: "M5.8 7V5.1a2.2 2.2 0 0 1 4.4 0V7"
    })),
    unlock: React.createElement(F, null, React.createElement("rect", {
      x: "3.4",
      y: "7",
      width: "9.2",
      height: "6.6",
      rx: "1.5"
    }), React.createElement("path", {
      d: "M5.8 7V5.1a2.2 2.2 0 0 1 4.2-.8"
    })),
    sunShadow: React.createElement(F, null, React.createElement("circle", {
      cx: "8",
      cy: "6.6",
      r: "2.7"
    }), React.createElement("path", {
      d: "M8 1.4v1.1M8 10.7v1M12.7 6.6h-1.1M4.4 6.6H3.3M11.3 3.3l-.8.8M5.5 9.1l-.8.8M11.3 9.9l-.8-.8M5.5 4.1l-.8-.8"
    }), React.createElement("path", {
      d: "M3.6 14.2h8.8",
      strokeWidth: "2.1"
    })),
    sun: React.createElement(F, null, React.createElement("circle", {
      cx: "8",
      cy: "8",
      r: "3.1"
    }), React.createElement("path", {
      d: "M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1"
    })),
    bulb: React.createElement(F, null, React.createElement("path", {
      d: "M5.4 9.6a4 4 0 1 1 5.2 0c-.5.5-.8 1-.9 1.7H6.3c-.1-.7-.4-1.2-.9-1.7Z"
    }), React.createElement("path", {
      d: "M6.4 13.2h3.2M6.9 14.7h2.2"
    })),
    image: React.createElement(F, null, React.createElement("rect", {
      x: "1.9",
      y: "2.8",
      width: "12.2",
      height: "10.4",
      rx: "1.6"
    }), React.createElement("circle", {
      cx: "5.6",
      cy: "6.3",
      r: "1.1"
    }), React.createElement("path", {
      d: "m2.4 11.6 3.1-3 2.4 2.3 2.4-2.5 3.4 3.4"
    })),
    roof: React.createElement(F, null, React.createElement("path", {
      d: "M1.5 8.1 8 2.6l6.5 5.5"
    }), React.createElement("path", {
      d: "M3.4 7.2v6.3h9.2V7.2"
    })),
    grid: React.createElement(F, null, React.createElement("rect", {
      x: "1.9",
      y: "2.7",
      width: "12.2",
      height: "10.6",
      rx: "1.5"
    }), React.createElement("path", {
      d: "M1.9 6.2h12.2M1.9 9.8h12.2M8 2.7v10.6"
    })),
    map: React.createElement(F, null, React.createElement("path", {
      d: "M1.9 4.3 6 2.7l4 1.7 4.1-1.7v9L10 13.3l-4-1.7-4.1 1.7z"
    }), React.createElement("path", {
      d: "M6 2.7v8.9M10 4.4v8.9"
    })),
    tree: React.createElement(F, null, React.createElement("path", {
      d: "M8 2 4.1 7.6h2L3.2 12.2h9.6L9.9 7.6h2z"
    }), React.createElement("path", {
      d: "M8 12.2v2.2"
    })),
    pencil: React.createElement(F, null, React.createElement("path", {
      d: "M2.7 13.3h2.7l7.3-7.4a1.85 1.85 0 0 0-2.6-2.6L2.7 10.6z"
    }), React.createElement("path", {
      d: "m9.6 4 2.5 2.5"
    })),
    dome: React.createElement(F, null, React.createElement("path", {
      d: "M2.5 12.4a5.5 5.5 0 0 1 11 0z"
    }), React.createElement("path", {
      d: "M1.4 12.4h13.2"
    })),
    trash: React.createElement(F, null, React.createElement("path", {
      d: "M3.1 4.4h9.8"
    }), React.createElement("path", {
      d: "M6.3 4.4V3.3a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1.1"
    }), React.createElement("path", {
      d: "m4.3 4.4.6 8.2a1.1 1.1 0 0 0 1.1 1h4a1.1 1.1 0 0 0 1.1-1l.6-8.2"
    })),
    reset: React.createElement(F, null, React.createElement("path", {
      d: "M13.3 8a5.3 5.3 0 1 1-1.7-3.9"
    }), React.createElement("path", {
      d: "M13.6 2.3v3h-3"
    })),
    plus: React.createElement(F, null, React.createElement("path", {
      d: "M8 3.3v9.4M3.3 8h9.4"
    })),
    check: React.createElement(F, null, React.createElement("path", {
      d: "m3.3 8.5 3.1 3.1 6.3-7.2"
    })),
    camera: React.createElement(F, null, React.createElement("rect", {
      x: "1.8",
      y: "4.5",
      width: "12.4",
      height: "8.7",
      rx: "2"
    }), React.createElement("circle", {
      cx: "8",
      cy: "8.9",
      r: "2.5"
    }), React.createElement("path", {
      d: "M5.6 4.5 6.4 2.8h3.2l.8 1.7"
    })),
    link: React.createElement(F, null, React.createElement("path", {
      d: "M6.6 9.4a2.7 2.7 0 0 0 4 .3l1.6-1.6a2.7 2.7 0 0 0-3.8-3.8l-.9.9"
    }), React.createElement("path", {
      d: "M9.4 6.6a2.7 2.7 0 0 0-4-.3L3.8 7.9a2.7 2.7 0 0 0 3.8 3.8l.9-.9"
    })),
    play: React.createElement(F, null, React.createElement("path", {
      d: "M5.4 3.3 12.3 8l-6.9 4.7z"
    })),
    pause: React.createElement(F, null, React.createElement("path", {
      d: "M6 3.5v9M10 3.5v9",
      strokeWidth: "2"
    })),
    height: React.createElement(F, null, React.createElement("path", {
      d: "M8 2.4v11.2"
    }), React.createElement("path", {
      d: "m5.3 5.1 2.7-2.7 2.7 2.7M5.3 10.9l2.7 2.7 2.7-2.7"
    })),
    building: React.createElement(F, null, React.createElement("path", {
      d: "M2.6 13.4V6.3L8 2.4l5.4 3.9v7.1z"
    }), React.createElement("path", {
      d: "M6.4 13.4V9.3h3.2v4.1"
    })),
    arrow: React.createElement(F, null, React.createElement("path", {
      d: "M2.8 8h9.5"
    }), React.createElement("path", {
      d: "m8.7 4.4 3.6 3.6-3.6 3.6"
    })),
    layers: React.createElement(F, null, React.createElement("path", {
      d: "M8 2.2 14 5.4 8 8.6 2 5.4z"
    }), React.createElement("path", {
      d: "m2 9 6 3.2L14 9"
    })),
    box: React.createElement(F, null, React.createElement("rect", {
      x: "2.4",
      y: "4.6",
      width: "11.2",
      height: "8.8",
      rx: "1.4"
    }), React.createElement("path", {
      d: "M2.4 8h11.2"
    })),
    save: React.createElement(F, null, React.createElement("path", {
      d: "M3.4 2.6h7.2l3 3v7.8a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1z"
    }), React.createElement("path", {
      d: "M5.3 2.6v4h5.4v-4M5.3 14.4v-4.2h5.4v4.2"
    })),
    curve: React.createElement(F, null, React.createElement("path", {
      d: "M2.2 2.4v11.2h11.6"
    }), React.createElement("path", {
      d: "M4.3 4.3h5.1c1.4 0 2 .8 2 2.3v6"
    })),
    probe: React.createElement(F, null, React.createElement("path", {
      d: "m9.6 2.5 3.9 3.9-6.2 6.2-3.9-3.9z"
    }), React.createElement("path", {
      d: "m5.7 6.4 3.9 3.9M2.4 13.6l1.6-1"
    })),
    thermo: React.createElement(F, null, React.createElement("path", {
      d: "M9.9 9V3.7a1.9 1.9 0 1 0-3.8 0V9a3.2 3.2 0 1 0 3.8 0z"
    }), React.createElement("path", {
      d: "M8 6.2v4.4"
    })),
    coin: React.createElement(F, null, React.createElement("ellipse", {
      cx: "8",
      cy: "4.4",
      rx: "5.4",
      ry: "2.3"
    }), React.createElement("path", {
      d: "M2.6 4.4v7.2c0 1.3 2.4 2.3 5.4 2.3s5.4-1 5.4-2.3V4.4"
    }), React.createElement("path", {
      d: "M2.6 8c0 1.3 2.4 2.3 5.4 2.3s5.4-1 5.4-2.3"
    })),
    doc: React.createElement(F, null, React.createElement("path", {
      d: "M3.6 1.9h5.2l3.6 3.6v8.6H3.6z"
    }), React.createElement("path", {
      d: "M8.8 1.9v3.6h3.6"
    }), React.createElement("path", {
      d: "M5.9 9h4.2M5.9 11.3h3"
    })),
    cloud: React.createElement(F, null, React.createElement("path", {
      d: "M4.6 12.2a3 3 0 0 1-.3-6 4.2 4.2 0 0 1 8 .9 2.6 2.6 0 0 1-.5 5.1z"
    }))
  };
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: w || 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "block",
      flex: "0 0 auto"
    }
  }, ic[name] || null);
}
function P3Num({
  label,
  value,
  onChange,
  step,
  min,
  max,
  suffix
}) {
  return React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, label), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: step || 1,
    min: min,
    max: max,
    value: value,
    onChange: e => onChange(e.target.value === "" ? 0 : +e.target.value)
  }), suffix && React.createElement("span", {
    className: "p3-sfx"
  }, suffix)));
}
function P3NumRange({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  span
}) {
  const lo = +min || 0,
    hi = max == null ? 100 : +max;
  const pct = hi > lo ? Math.max(0, Math.min(100, ((+value || 0) - lo) / (hi - lo) * 100)) : 0;
  return React.createElement("label", {
    className: "p3-f",
    style: {
      gridColumn: span ? "1 / -1" : "auto"
    }
  }, React.createElement("span", {
    className: "lb"
  }, label), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(+e.target.value),
    style: {
      "--p": pct
    }
  }), React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(e.target.value === "" ? 0 : +e.target.value),
    style: {
      width: 56,
      flex: "0 0 auto",
      textAlign: "center",
      padding: "5px 4px",
      fontSize: 12
    }
  }), suffix && React.createElement("span", {
    className: "p3-sfx"
  }, suffix)));
}
function P3Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  right
}) {
  const lo = +min || 0,
    hi = max == null ? 100 : +max;
  const pct = hi > lo ? Math.max(0, Math.min(100, ((+value || 0) - lo) / (hi - lo) * 100)) : 0;
  return React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, React.createElement("span", null, label), right != null && React.createElement("b", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, right)), React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(+e.target.value),
    style: {
      "--p": pct
    }
  }));
}
function Plan3DEditor({
  job,
  onClose,
  currentUser
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    saved,
    loading,
    save
  } = usePlan3d(job ? job.id : null);
  const [ready, setReady] = React.useState(false);
  const [loadErr, setLoadErr] = React.useState(null);
  const [st, setSt] = React.useState(() => p3Blank(job));
  const [selRoof, setSelRoof] = React.useState(null);
  const [selObs, setSelObs] = React.useState(null);
  const [selVert, setSelVert] = React.useState(null);
  const [tab, setTab] = React.useState("roof");
  const [dirty, setDirty] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);
  const [drawing, setDrawing] = React.useState(false);
  const [drawPts, setDrawPts] = React.useState([]);
  const [showVerts, setShowVerts] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [sysOpen, setSysOpen] = React.useState(false);
  const [photoEdit, setPhotoEdit] = React.useState(false);
  const [grpOpen, setGrpOpen] = React.useState(false);
  const [expGrp, setExpGrp] = React.useState(null);
  const [delAsk, setDelAsk] = React.useState(null);
  const [selBlk, setSelBlk] = React.useState(0);
  const [addMode, setAddMode] = React.useState(false);
  const [lightMode, setLightMode] = React.useState("sun");
  const [view2D, setView2D] = React.useState(false);
  const [showSun, setShowSun] = React.useState(true);
  const shadowOn = lightMode === "sun";
  const loadedRef = React.useRef(false);
  const lockedRef = React.useRef(false);
  lockedRef.current = locked;
  const photoEditRef = React.useRef(false);
  photoEditRef.current = photoEdit;
  const tabRef = React.useRef("roof");
  tabRef.current = tab;
  const set = patch => {
    setSt(p => Object.assign({}, p, patch));
    setDirty(true);
  };
  const setSun = patch => {
    setSt(p => Object.assign({}, p, {
      sun: Object.assign({}, p.sun, patch)
    }));
    setDirty(true);
  };
  const patchRoof = (id, patch) => {
    setSt(p => Object.assign({}, p, {
      roofs: p.roofs.map(r => r.id === id ? Object.assign({}, r, patch) : r)
    }));
    setDirty(true);
  };
  const patchRoofs = ups => {
    setSt(p => Object.assign({}, p, {
      roofs: p.roofs.map(r => ups[r.id] ? Object.assign({}, r, ups[r.id]) : r)
    }));
    setDirty(true);
  };
  const blkStore = roof => p3Blocks(roof).map(b => ({
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
    keep: b.keep
  }));
  const clearCells = roof => blkStore(roof).map(b => Object.assign({}, b, {
    skips: {},
    adds: {}
  }));
  const patchBlk = (roof, i, patch) => {
    const bs = blkStore(roof);
    if (!bs[i]) return;
    bs[i] = Object.assign({}, bs[i], patch);
    patchRoof(roof.id, {
      blocks: bs
    });
  };
  const patchAllBlk = (roof, patch) => {
    patchRoof(roof.id, {
      blocks: blkStore(roof).map(b => Object.assign({}, b, patch))
    });
  };
  const toggleCell = (roof, key, isSlot) => {
    const mm = /^b(\d+)_/.exec(key),
      bi = mm ? +mm[1] : 0;
    const bs = blkStore(roof);
    const b = bs[bi];
    if (!b) return;
    const adds = Object.assign({}, b.adds || {}),
      skips = Object.assign({}, b.skips || {});
    if (isSlot) {
      adds[key] = true;
      delete skips[key];
    } else if (adds[key]) delete adds[key];else if (skips[key]) delete skips[key];else skips[key] = true;
    bs[bi] = Object.assign({}, b, {
      adds,
      skips
    });
    patchRoof(roof.id, {
      blocks: bs
    });
  };
  const patchObs = (id, patch) => {
    setSt(p => Object.assign({}, p, {
      obstacles: (p.obstacles || []).map(o => o.id === id ? Object.assign({}, o, patch) : o)
    }));
    setDirty(true);
  };
  const setVertHeight = (roofId, idx, H) => {
    setSt(prev => {
      const R = (prev.roofs || []).find(r => r.id === roofId);
      if (!R || !Array.isArray(R.pts) || !R.pts[idx]) return prev;
      const wx = (+R.x || 0) + (+R.pts[idx].x || 0),
        wz = (+R.z || 0) + (+R.pts[idx].z || 0);
      const roofs = prev.roofs.map(r => {
        if (r.kind !== "poly" || !Array.isArray(r.pts)) return r;
        const ph = p3PhOf(r).slice();
        let changed = false;
        r.pts.forEach((p, j) => {
          if (Math.hypot((+r.x || 0) + (+p.x || 0) - wx, (+r.z || 0) + (+p.z || 0) - wz) < 0.3) {
            ph[j] = H;
            changed = true;
          }
        });
        return changed ? Object.assign({}, r, {
          ph
        }) : r;
      });
      return Object.assign({}, prev, {
        roofs
      });
    });
    setDirty(true);
  };
  React.useEffect(() => {
    p3LoadThree().then(() => setReady(true)).catch(e => setLoadErr(e.message));
  }, []);
  React.useEffect(() => {
    if (loading || loadedRef.current) return;
    loadedRef.current = true;
    if (saved) {
      const base = p3Blank(job);
      const merged = Object.assign({}, base, saved, {
        sun: Object.assign({}, base.sun, saved.sun || {})
      });
      merged.roofs = (saved.roofs || base.roofs).map(r => Object.assign({}, p3NewRoof(1), r, {
        skips: r.skips || {},
        pts: r.pts || null
      }));
      merged.obstacles = saved.obstacles || [];
      setSt(merged);
      if (merged.roofs[0]) setSelRoof(merged.roofs[0].id);
    } else if (st.roofs[0]) setSelRoof(st.roofs[0].id);
  }, [loading, saved]);
  const mountRef = React.useRef(null);
  const tRef = React.useRef({});
  const stRef = React.useRef(st);
  stRef.current = st;
  const drawingRef = React.useRef(false);
  drawingRef.current = drawing;
  React.useEffect(() => {
    if (!ready || !mountRef.current) return;
    const THREE = window.THREE;
    const el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce8f2);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    camera.position.set(18, 16, 18);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    const amb = new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.75);
    scene.add(amb);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    const S = 45;
    sunLight.shadow.camera.left = -S;
    sunLight.shadow.camera.right = S;
    sunLight.shadow.camera.top = S;
    sunLight.shadow.camera.bottom = -S;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 220;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    scene.add(sunLight.target);
    const dyn = new THREE.Group();
    scene.add(dyn);
    const sunGrp = new THREE.Group();
    scene.add(sunGrp);
    Object.assign(tRef.current, {
      THREE,
      renderer,
      scene,
      camera,
      controls,
      sunLight,
      amb,
      dyn,
      sunGrp,
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
    let run = true;
    const loop = () => {
      if (!run) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => {
      run = false;
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [ready]);
  React.useEffect(() => {
    const t = tRef.current;
    if (!t.dyn) return;
    const THREE = t.THREE;
    if (t.renderer && t.renderer.shadowMap.enabled !== shadowOn) {
      t.renderer.shadowMap.enabled = shadowOn;
      t.scene && t.scene.traverse(o => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          m.needsUpdate = true;
        });
      });
    }
    if (t.sunLight) t.sunLight.castShadow = shadowOn;
    while (t.dyn.children.length) {
      const c = t.dyn.children[0];
      t.dyn.remove(c);
      c.traverse && c.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
            if (m.map && !m.map.userData.p3keep) m.map.dispose();
            m.dispose();
          });
        }
      });
    }
    t.texCache = t.texCache || {};
    const texKeep = [st.photo, st.baseMap && st.baseMap.url].filter(Boolean);
    Object.keys(t.texCache).forEach(u => {
      if (texKeep.indexOf(u) < 0) {
        t.texCache[u].dispose();
        delete t.texCache[u];
      }
    });
    const p3Tex = (url, onReady) => {
      const has = t.texCache[url];
      if (has) {
        if (onReady && has.image) Promise.resolve().then(() => onReady(has));
        return has;
      }
      const tx = new THREE.TextureLoader().load(url, () => {
        if (onReady) onReady(tx);
      });
      tx.anisotropy = 4;
      tx.userData.p3keep = true;
      t.texCache[url] = tx;
      return tx;
    };
    t.pickRoofs = [];
    t.pickPanels = [];
    t.pickObs = [];
    t.pickVerts = [];
    t.pickPhoto = [];
    t.pickPhotoH = [];
    t.photoDeco = [];
    t.pickBlk = [];
    t.blkFrames = [];
    t.selTilt = null;
    t.selInfo = null;
    t.selPolyRoof = null;
    const G = +st.groundW || 40;
    if (t.camera && t.controls) {
      const far = Math.max(500, G * 6);
      if (t.camera.far !== far) {
        t.camera.far = far;
        t.camera.updateProjectionMatrix();
      }
      t.controls.minDistance = 1.5;
      t.controls.maxDistance = far * 0.42;
    }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(G * 2.4, G * 2.4), new THREE.MeshLambertMaterial({
      color: 0xb9c4a5
    }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    t.dyn.add(ground);
    if (st.baseMap && st.baseMap.url) {
      const W = Math.max(2, +st.baseMap.widthM || 30);
      const bt = p3Tex(st.baseMap.url);
      const bmesh = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshBasicMaterial({
        map: bt
      }));
      bmesh.rotation.x = -Math.PI / 2;
      bmesh.position.y = -0.01;
      t.dyn.add(bmesh);
    }
    if (st.photo) {
      const pgrp = new THREE.Group();
      pgrp.position.set(+st.photoX || 0, 0, +st.photoZ || 0);
      pgrp.rotation.y = -((+st.photoRot || 0) * Math.PI) / 180;
      t.dyn.add(pgrp);
      const layoutHandles = (pw, ph) => {
        if (!photoEdit) return;
        (t.photoDeco || []).forEach(h => {
          h.parent && h.parent.remove(h);
          if (h.geometry) h.geometry.dispose();
          if (h.material) h.material.dispose();
        });
        t.photoDeco = [];
        t.pickPhotoH = [];
        const keep = o => {
          t.photoDeco.push(o);
          return o;
        };
        const hw = pw / 2,
          hh = ph / 2;
        const R = Math.max(0.35, pw / 45);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12), new THREE.MeshBasicMaterial({
            color: 0x2563EB,
            transparent: true,
            opacity: 1,
            depthTest: false
          }));
          m.position.set(sx * hw, 0.06, sz * hh);
          m.renderOrder = 60;
          m.userData = {
            photoHandle: "scale"
          };
          pgrp.add(keep(m));
          t.pickPhotoH.push(m);
        });
        const armLen = hh + Math.max(1.2, pw / 12);
        const rot = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 16, 12), new THREE.MeshBasicMaterial({
          color: 0xF59E0B,
          transparent: true,
          opacity: 1,
          depthTest: false
        }));
        rot.position.set(0, 0.06, -armLen);
        rot.renderOrder = 60;
        rot.userData = {
          photoHandle: "rot"
        };
        pgrp.add(keep(rot));
        t.pickPhotoH.push(rot);
        const arm = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.06, -hh), new THREE.Vector3(0, 0.06, -armLen)]), new THREE.LineBasicMaterial({
          color: 0xF59E0B,
          transparent: true,
          opacity: 1,
          depthTest: false
        }));
        arm.renderOrder = 59;
        pgrp.add(keep(arm));
        const fr = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-hw, 0.05, -hh), new THREE.Vector3(hw, 0.05, -hh), new THREE.Vector3(hw, 0.05, hh), new THREE.Vector3(-hw, 0.05, hh)]), new THREE.LineBasicMaterial({
          color: 0x2563EB,
          transparent: true,
          opacity: 1,
          depthTest: false
        }));
        fr.renderOrder = 58;
        pgrp.add(keep(fr));
      };
      const tex = p3Tex(st.photo, tx => {
        const img = tx.image;
        if (!img) return;
        const pw = +st.photoW || 30,
          ph = pw * (img.height / img.width);
        photoMesh.geometry.dispose();
        photoMesh.geometry = new THREE.PlaneGeometry(pw, ph);
        layoutHandles(pw, ph);
        const t2 = tRef.current;
        if (t2.renderer) t2.renderer.render(t2.scene, t2.camera);
      });
      const bright = Math.max(0.25, Math.min(1, st.photoBright == null ? 0.7 : +st.photoBright));
      const photoMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: Math.max(0.15, Math.min(1, +st.photoOpacity || 0.95)),
        color: new THREE.Color(bright, bright, bright)
      });
      const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(+st.photoW || 30, +st.photoW || 30), photoMat);
      photoMesh.rotation.x = -Math.PI / 2;
      pgrp.add(photoMesh);
      if (photoEdit) t.pickPhoto = [photoMesh];
      layoutHandles(+st.photoW || 30, +st.photoW || 30);
    } else if (!st.baseMap) {
      const grid = new THREE.GridHelper(G, G, 0x8898a8, 0xaab8c6);
      grid.position.y = 0.01;
      t.dyn.add(grid);
    }
    const mkText = (txt, color) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 64;
      const x = cv.getContext("2d");
      x.fillStyle = color;
      x.font = "bold 44px system-ui";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(txt, 32, 34);
      const tx = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tx,
        depthTest: false
      }));
      sp.scale.set(2.2, 2.2, 1);
      return sp;
    };
    const north = mkText("N", "var(--tint-red-tx)");
    north.position.set(0, 1.4, -G / 2 - 1.5);
    t.dyn.add(north);
    (st.roofs || []).forEach(roof => {
      const isPoly = roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3;
      const pan = p3Panels(roof, roof.id === selRoof && addMode ? {
        slots: true,
        blk: selBlk
      } : null);
      const selected = roof.id === selRoof;
      const g = new THREE.Group();
      g.position.set(+roof.x || 0, +roof.h || 3, +roof.z || 0);
      g.rotation.y = -(((+roof.az || 180) - 180) * P3_DEG);
      const tilt = new THREE.Group();
      tilt.rotation.x = (+roof.pitch || 0) * P3_DEG;
      const roofMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(P3_ROOF_COLOR),
        transparent: true,
        opacity: 0.96,
        side: THREE.DoubleSide
      });
      let sideParent = null;
      if (roof.kind === "hip") {
        const H = pan.hip || p3HipFaces(roof);
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        sideParent = {};
        H.faces.forEach(f => {
          const wrap = new THREE.Group();
          wrap.rotation.y = f.wrapY;
          const tiltF = new THREE.Group();
          tiltF.position.set(0, 0, f.tiltZ);
          tiltF.rotation.x = pitchR;
          const shp = new THREE.Shape();
          f.poly.forEach((p, i) => {
            if (i === 0) shp.moveTo(p.x, -p.z);else shp.lineTo(p.x, -p.z);
          });
          const slab = new THREE.Mesh(new THREE.ShapeGeometry(shp), roofMat);
          slab.rotation.x = -Math.PI / 2;
          slab.position.y = -0.02;
          slab.castShadow = true;
          slab.receiveShadow = true;
          slab.userData = {
            kind: "roof",
            id: roof.id
          };
          tiltF.add(slab);
          t.pickRoofs.push(slab);
          const lp = f.poly.concat([f.poly[0]]).map(p => new THREE.Vector3(p.x, 0.02, p.z));
          tiltF.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({
            color: selected ? 0x16a34a : 0x475569
          })));
          wrap.add(tiltF);
          g.add(wrap);
          sideParent[f.side] = tiltF;
        });
        const beam = new THREE.Mesh(new THREE.BoxGeometry(H.r + 0.15, 0.12, 0.18), new THREE.MeshLambertMaterial({
          color: 0x6b7280
        }));
        beam.position.set(0, H.rise + 0.02, 0);
        beam.castShadow = true;
        g.add(beam);
        const wallH = new THREE.Mesh(new THREE.BoxGeometry(H.w * 0.97, +roof.h || 3, H.d * 0.97), new THREE.MeshLambertMaterial({
          color: 0xe7e2d8,
          transparent: true,
          opacity: 0.5
        }));
        wallH.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallH.castShadow = true;
        wallH.receiveShadow = true;
        g.add(wallH);
      } else if (roof.kind === "dome") {
        const D = pan.dome || p3DomeGeo(roof);
        const L = D.len,
          segs = 30;
        const tAt = i => -D.th + 2 * D.th * i / segs;
        const pos = [];
        for (let i = 0; i < segs; i++) {
          const y1 = D.yAt(tAt(i)),
            z1 = D.zAt(tAt(i)),
            y2 = D.yAt(tAt(i + 1)),
            z2 = D.zAt(tAt(i + 1));
          pos.push(-L / 2, y1, z1, L / 2, y1, z1, L / 2, y2, z2);
          pos.push(-L / 2, y1, z1, L / 2, y2, z2, -L / 2, y2, z2);
        }
        const dgeo = new THREE.BufferGeometry();
        dgeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        dgeo.computeVertexNormals();
        const shell = new THREE.Mesh(dgeo, roofMat);
        shell.castShadow = true;
        shell.receiveShadow = true;
        shell.userData = {
          kind: "roof",
          id: roof.id
        };
        g.add(shell);
        t.pickRoofs.push(shell);
        const domeEdge = new THREE.LineBasicMaterial({
          color: selected ? 0x16a34a : 0x475569
        });
        [-1, 1].forEach(sgn => {
          const ps = [];
          for (let i = 0; i <= segs; i++) ps.push(new THREE.Vector3(sgn * L / 2, D.yAt(tAt(i)) + 0.02, D.zAt(tAt(i))));
          g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ps), domeEdge));
        });
        const aShape = new THREE.Shape();
        aShape.moveTo(-D.span / 2, 0);
        for (let i = 0; i <= segs; i++) aShape.lineTo(D.zAt(tAt(i)), D.yAt(tAt(i)));
        aShape.lineTo(D.span / 2, 0);
        aShape.closePath();
        const aMat = new THREE.MeshLambertMaterial({
          color: 0xefe9dd,
          side: THREE.DoubleSide
        });
        [-1, 1].forEach(sgn => {
          const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(aShape, {
            depth: 0.1,
            bevelEnabled: false
          }), aMat);
          cap.rotation.y = Math.PI / 2;
          cap.position.set(sgn * (L / 2) - 0.05, 0, 0);
          cap.castShadow = true;
          cap.receiveShadow = true;
          g.add(cap);
        });
        const wallD = new THREE.Mesh(new THREE.BoxGeometry(L * 0.97, +roof.h || 3, D.span * 0.97), new THREE.MeshLambertMaterial({
          color: 0xe7e2d8,
          transparent: true,
          opacity: 0.5
        }));
        wallD.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallD.castShadow = true;
        wallD.receiveShadow = true;
        g.add(wallD);
      } else if (roof.kind === "gable") {
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        const cosP = Math.max(0.25, Math.cos(pitchR));
        const half = (+roof.span || 8) / 2,
          slopeLen = half / cosP;
        const rise = half * Math.tan(pitchR);
        const ridgeLen = +roof.ridge || 8;
        tilt.position.set(0, 0, half);
        const slabA = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen, 0.09, slopeLen), roofMat);
        slabA.position.set(0, -0.045, -slopeLen / 2);
        slabA.castShadow = true;
        slabA.receiveShadow = true;
        slabA.userData = {
          kind: "roof",
          id: roof.id
        };
        tilt.add(slabA);
        t.pickRoofs.push(slabA);
        const wrapB = new THREE.Group();
        wrapB.rotation.y = Math.PI;
        const tiltB = new THREE.Group();
        tiltB.position.set(0, 0, half);
        tiltB.rotation.x = pitchR;
        const slabB = slabA.clone();
        slabB.userData = {
          kind: "roof",
          id: roof.id
        };
        tiltB.add(slabB);
        t.pickRoofs.push(slabB);
        wrapB.add(tiltB);
        g.add(wrapB);
        sideParent = {
          A: tilt,
          B: tiltB
        };
        const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen + 0.15, 0.12, 0.18), new THREE.MeshLambertMaterial({
          color: 0x6b7280
        }));
        ridgeBeam.position.set(0, rise + 0.02, 0);
        ridgeBeam.castShadow = true;
        g.add(ridgeBeam);
        const triShape = new THREE.Shape();
        triShape.moveTo(-half, 0);
        triShape.lineTo(half, 0);
        triShape.lineTo(0, rise);
        triShape.closePath();
        const triMat = new THREE.MeshLambertMaterial({
          color: 0xefe9dd,
          side: THREE.DoubleSide
        });
        [-1, 1].forEach(sgn => {
          const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape, {
            depth: 0.1,
            bevelEnabled: false
          }), triMat);
          tri.rotation.y = Math.PI / 2;
          tri.position.set(sgn * (ridgeLen / 2) - 0.05, 0, 0);
          tri.castShadow = true;
          tri.receiveShadow = true;
          g.add(tri);
        });
        const wallG = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen * 0.94, +roof.h || 3, (+roof.span || 8) * 0.94), new THREE.MeshLambertMaterial({
          color: 0xe7e2d8,
          transparent: true,
          opacity: 0.5
        }));
        wallG.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallG.castShadow = true;
        wallG.receiveShadow = true;
        g.add(wallG);
        if (selected) [slabA, slabB].forEach(sl => {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ridgeLen + 0.1, 0.12, slopeLen + 0.1)), new THREE.LineBasicMaterial({
            color: 0x16a34a
          }));
          eg.position.copy(sl.position);
          sl.parent.add(eg);
        });
      } else if (isPoly) {
        const bH = +st.buildH || 0;
        g.position.y = bH;
        g.rotation.y = 0;
        const ph = p3PhOf(roof);
        const V3 = a => new THREE.Vector3(a.x, a.y, a.z);
        const vs3 = roof.pts.map((p, i) => [+p.x || 0, ph[i], +p.z || 0]);
        const pos = [];
        for (let i = 1; i < vs3.length - 1; i++) {
          pos.push.apply(pos, vs3[0]);
          pos.push.apply(pos, vs3[i]);
          pos.push.apply(pos, vs3[i + 1]);
        }
        const sgeo = new THREE.BufferGeometry();
        sgeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        sgeo.computeVertexNormals();
        const slab = new THREE.Mesh(sgeo, roofMat);
        slab.castShadow = true;
        slab.receiveShadow = true;
        slab.userData = {
          kind: "roof",
          id: roof.id
        };
        g.add(slab);
        t.pickRoofs.push(slab);
        const linePts = roof.pts.map((p, i) => new THREE.Vector3(+p.x || 0, ph[i] + 0.02, +p.z || 0));
        linePts.push(linePts[0].clone());
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), new THREE.LineBasicMaterial({
          color: selected ? 0x16a34a : 0x475569
        })));
        const minPh = Math.min.apply(null, ph);
        const wallH = minPh + bH;
        if (wallH > 0.25) {
          const wshp = new THREE.Shape();
          roof.pts.forEach((p, i) => {
            const x = +p.x || 0,
              z = +p.z || 0;
            if (i === 0) wshp.moveTo(x, -z);else wshp.lineTo(x, -z);
          });
          const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wshp, {
            depth: wallH,
            bevelEnabled: false
          }), new THREE.MeshLambertMaterial({
            color: 0xe7e2d8,
            transparent: true,
            opacity: 0.4
          }));
          wall.rotation.x = -Math.PI / 2;
          wall.position.y = -bH;
          wall.castShadow = true;
          wall.receiveShadow = true;
          g.add(wall);
        }
        if (selected && showVerts && !locked) {
          t.selPolyRoof = roof;
          t.selTilt = null;
          t.selInfo = null;
          roof.pts.forEach((p, idx) => {
            const isSel = selVert && selVert.roofId === roof.id && selVert.idx === idx;
            const halo = new THREE.Mesh(new THREE.SphereGeometry(isSel ? 0.34 : 0.27, 14, 12), new THREE.MeshBasicMaterial({
              color: 0xffffff,
              depthTest: false,
              transparent: true
            }));
            halo.position.set(+p.x || 0, ph[idx] + 0.02, +p.z || 0);
            halo.renderOrder = 20;
            halo.userData = {
              kind: "vertex",
              roofId: roof.id,
              idx
            };
            const dot = new THREE.Mesh(new THREE.SphereGeometry(isSel ? 0.22 : 0.17, 14, 12), new THREE.MeshBasicMaterial({
              color: isSel ? 0xf59e0b : 0x16a34a,
              depthTest: false,
              transparent: true
            }));
            dot.position.copy(halo.position);
            dot.renderOrder = 21;
            dot.userData = halo.userData;
            g.add(halo);
            g.add(dot);
            t.pickVerts.push(halo, dot);
          });
        }
      } else {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(roof.w, 0.09, roof.d), roofMat);
        slab.position.set(0, -0.045, -roof.d / 2);
        slab.castShadow = true;
        slab.receiveShadow = true;
        slab.userData = {
          kind: "roof",
          id: roof.id
        };
        tilt.add(slab);
        t.pickRoofs.push(slab);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(roof.w * 0.92, +roof.h || 3, roof.d * 0.8), new THREE.MeshLambertMaterial({
          color: 0xe7e2d8,
          transparent: true,
          opacity: 0.5
        }));
        wall.position.set(+roof.x || 0, (+roof.h || 3) / 2 - 0.15, +roof.z || 0);
        wall.rotation.y = g.rotation.y;
        const midLocal = new THREE.Vector3(0, 0, -roof.d / 2).applyEuler(new THREE.Euler(0, g.rotation.y, 0));
        wall.position.x += midLocal.x;
        wall.position.z += midLocal.z;
        wall.castShadow = true;
        wall.receiveShadow = true;
        t.dyn.add(wall);
        if (selected) {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(roof.w + 0.1, 0.12, roof.d + 0.1)), new THREE.LineBasicMaterial({
            color: 0x16a34a
          }));
          eg.position.copy(slab.position);
          tilt.add(eg);
        }
      }
      g.add(tilt);
      const geoBox = {};
      const boxOf = (w, h, d) => {
        const k = w.toFixed(3) + "|" + h.toFixed(3) + "|" + d.toFixed(3);
        return geoBox[k] || (geoBox[k] = new THREE.BoxGeometry(w, h, d));
      };
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x10305e,
        roughness: 0.35,
        metalness: 0.55
      });
      const ghostMat = new THREE.MeshLambertMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.16
      });
      const frameMat = new THREE.MeshLambertMaterial({
        color: 0xcbd5e1
      });
      let pquat = null,
        pnoff = null;
      if (isPoly && pan.plane) {
        const V = a => new THREE.Vector3(a.x, a.y, a.z);
        const pv = pan.plane.v;
        pquat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(pan.plane.u), V(pan.plane.n), V({
          x: -pv.x,
          y: -pv.y,
          z: -pv.z
        })));
        pnoff = V(pan.plane.n).multiplyScalar(0.06);
      }
      const isDomeR = roof.kind === "dome";
      const slotMat = new THREE.MeshBasicMaterial({
        color: 0x16a34a,
        transparent: true,
        opacity: 0.22,
        depthTest: false
      });
      const legMat = new THREE.MeshLambertMaterial({
        color: 0x9aa3ad
      });
      const showGhost = selected && tab === "panel";
      pan.list.forEach(p => {
        if (p.skip && !showGhost) return;
        const parent = sideParent && sideParent[p.side] || (isPoly || isDomeR ? g : tilt);
        const pw = p.pw || pan.pw,
          pd = p.pd || pan.pd;
        const tR = p.tiltR || 0,
          ryR = p.ry || 0;
        const lift = tR ? pd / 2 * Math.sin(tR) : 0;
        const mat = p.slot ? slotMat : p.skip ? ghostMat : panelMat;
        const pm = new THREE.Mesh(boxOf(pw - 0.02, P3_PANEL_T, pd - 0.02), mat);
        if (isDomeR) {
          pm.position.set(p.x, p.y + 0.06 * Math.cos(p.rx), p.z + 0.06 * Math.sin(p.rx));
          pm.rotation.x = p.rx;
        } else if (isPoly && pquat) {
          pm.position.set(p.x + pnoff.x, p.y + pnoff.y, p.z + pnoff.z);
          pm.quaternion.copy(pquat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tR, ryR, 0, "YXZ")));
          if (lift) pm.position.addScaledVector(new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z), lift);
        } else {
          pm.position.set(p.x, 0.06 + lift, p.z);
          pm.rotation.set(tR, ryR, 0, "YXZ");
        }
        if (p.slot) pm.renderOrder = 15;
        if (!p.skip && !p.slot) {
          pm.castShadow = true;
          pm.receiveShadow = true;
        }
        pm.userData = {
          kind: "panel",
          roofId: roof.id,
          key: p.key,
          slot: !!p.slot
        };
        parent.add(pm);
        t.pickPanels.push(pm);
        if (!p.skip && !p.slot) {
          const fr = new THREE.Mesh(boxOf(pw, 0.012, pd), frameMat);
          if (isDomeR) {
            fr.position.set(p.x, p.y + 0.028 * Math.cos(p.rx), p.z + 0.028 * Math.sin(p.rx));
            fr.rotation.x = p.rx;
          } else if (isPoly && pquat) {
            fr.position.set(p.x + pnoff.x * 0.5, p.y + pnoff.y * 0.5, p.z + pnoff.z * 0.5);
            fr.quaternion.copy(pquat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tR, ryR, 0, "YXZ")));
            if (lift) fr.position.addScaledVector(new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z), lift);
          } else {
            fr.position.set(p.x, 0.028 + lift, p.z);
            fr.rotation.set(tR, ryR, 0, "YXZ");
          }
          parent.add(fr);
          if (tR > 0.02) {
            const legH = pd * Math.sin(tR);
            [-1, 1].forEach(sg => {
              const leg = new THREE.Mesh(boxOf(0.05, legH, 0.05), legMat);
              const lx = sg * (pw / 2 - 0.15),
                lz = -pd / 2 + 0.05;
              const off = new THREE.Vector3(lx, legH / 2, lz).applyEuler(new THREE.Euler(0, ryR, 0));
              if (isPoly && pquat) {
                const w3 = off.clone().applyQuaternion(pquat);
                leg.position.set(p.x + w3.x, p.y + w3.y, p.z + w3.z);
                leg.quaternion.copy(pquat);
              } else leg.position.set(p.x + off.x, off.y, p.z + off.z);
              leg.rotation.y = ryR;
              leg.castShadow = true;
              parent.add(leg);
            });
          }
        }
      });
      if (selected && tab === "panel" && !isDomeR && pan.rects && pan.rects.length) {
        const biSel = Math.min(selBlk, (pan.blocks || []).length - 1);
        const gizMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          depthTest: false,
          transparent: true
        });
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x2563eb,
          depthTest: false,
          transparent: true
        });
        pan.rects.filter(rc => rc.blk === biSel && rc.w > 0 && rc.h > 0).forEach(rc => {
          const parent = sideParent && sideParent[rc.side] || (isPoly ? g : tilt);
          const fr = isPoly && pan.plane ? {
            parent,
            o: new THREE.Vector3(pan.plane.c.x, pan.plane.c.y, pan.plane.c.z),
            un: new THREE.Vector3(pan.plane.u.x, pan.plane.u.y, pan.plane.u.z),
            vn: new THREE.Vector3(pan.plane.v.x, pan.plane.v.y, pan.plane.v.z),
            nn: new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z)
          } : {
            parent,
            o: new THREE.Vector3(0, 0, 0),
            un: new THREE.Vector3(1, 0, 0),
            vn: new THREE.Vector3(0, 0, 1),
            nn: new THREE.Vector3(0, 1, 0)
          };
          const frIdx = t.blkFrames.length;
          t.blkFrames.push(fr);
          const rr = rc.rot * P3_DEG,
            cr = Math.cos(rr),
            sr = Math.sin(rr);
          const at = (a, b, up) => {
            const u = rc.cu + a * cr - b * sr,
              v = rc.cv + a * sr + b * cr;
            const p = pan.toMesh({
              u,
              v
            });
            const lift = up || 0.2;
            return isPoly ? new THREE.Vector3(p.x + fr.nn.x * lift, p.y + fr.nn.y * lift, p.z + fr.nn.z * lift) : new THREE.Vector3(p.x, lift, p.z);
          };
          const hw = rc.w / 2,
            hh = rc.h / 2;
          const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
          const loop = corners.map(c2 => at(c2[0], c2[1], 0.16)).concat([at(-hw, -hh, 0.16)]);
          const box = new THREE.Line(new THREE.BufferGeometry().setFromPoints(loop), lineMat);
          box.renderOrder = 29;
          parent.add(box);
          const mk = (pos, r, mode, corner) => {
            const h = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), gizMat);
            h.position.copy(pos);
            h.renderOrder = 30;
            h.userData = {
              kind: "blk",
              roofId: roof.id,
              blk: biSel,
              mode,
              corner,
              frIdx,
              rect: rc
            };
            parent.add(h);
            t.pickBlk.push(h);
          };
          corners.forEach((c2, i) => mk(at(c2[0], c2[1]), 0.26, "size", i));
          mk(at(0, 0), 0.34, "move");
          mk(at(0, hh + 0.9), 0.24, "rot");
        });
      }
      t.dyn.add(g);
    });
    (() => {
      if (!showVerts || locked) return;
      const sp = p3SnapPoints(st.roofs, t.selPolyRoof ? t.selPolyRoof.id : null);
      if (!sp.length) return;
      const geo = new THREE.SphereGeometry(0.22, 10, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        depthTest: false,
        transparent: true,
        opacity: 0.9
      });
      sp.forEach(p => {
        const d = new THREE.Mesh(geo, mat);
        d.position.set(p.x, 0.15, p.z);
        d.renderOrder = 18;
        t.dyn.add(d);
      });
    })();
    (st.obstacles || []).forEach(o => {
      const grp = new THREE.Group();
      grp.position.set(+o.x || 0, 0, +o.z || 0);
      grp.rotation.y = -((+o.rot || 0) * P3_DEG);
      const selectedO = o.id === selObs;
      if (o.kind === "tree") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, o.h * 0.45, 8), new THREE.MeshLambertMaterial({
          color: 0x7c5a3a
        }));
        trunk.position.y = o.h * 0.225;
        trunk.castShadow = true;
        grp.add(trunk);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(Math.max(o.w, 1) / 2, 12, 10), new THREE.MeshLambertMaterial({
          color: 0x3f7d44
        }));
        crown.position.y = o.h * 0.45 + Math.max(o.w, 1) / 2 * 0.8;
        crown.castShadow = true;
        crown.receiveShadow = true;
        crown.userData = {
          kind: "obstacle",
          id: o.id
        };
        grp.add(crown);
        t.pickObs.push(crown);
      } else {
        const bx = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), new THREE.MeshLambertMaterial({
          color: selectedO ? 0x8aa8c8 : 0x9aa8b5
        }));
        bx.position.y = o.h / 2;
        bx.castShadow = true;
        bx.receiveShadow = true;
        bx.userData = {
          kind: "obstacle",
          id: o.id
        };
        grp.add(bx);
        t.pickObs.push(bx);
      }
      if (selectedO) {
        const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(o.w + 0.1, o.h + 0.1, o.d + 0.1)), new THREE.LineBasicMaterial({
          color: 0x16a34a
        }));
        eg.position.y = o.h / 2;
        grp.add(eg);
      }
      t.dyn.add(grp);
    });
    if (drawing && drawPts.length) {
      const mat = new THREE.LineBasicMaterial({
        color: 0x16a34a,
        depthTest: false,
        transparent: true
      });
      const pts3 = drawPts.map(p => new THREE.Vector3(p.x, 0.15, p.z));
      if (drawPts.length >= 3) pts3.push(pts3[0].clone());
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), mat);
      line.renderOrder = 20;
      t.dyn.add(line);
      const R = Math.max(0.13, (+st.photoW || 30) / 130);
      drawPts.forEach((p, i) => {
        const first = i === 0;
        const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.5, 16, 12), new THREE.MeshBasicMaterial({
          color: 0xffffff,
          depthTest: false,
          transparent: true
        }));
        halo.position.set(p.x, 0.2, p.z);
        halo.renderOrder = 20;
        t.dyn.add(halo);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12), new THREE.MeshBasicMaterial({
          color: first ? 0x15803d : 0x16a34a,
          depthTest: false,
          transparent: true
        }));
        dot.position.set(p.x, 0.22, p.z);
        dot.renderOrder = 21;
        t.dyn.add(dot);
      });
    }
  }, [st, selRoof, selObs, selVert, ready, drawing, drawPts, showVerts, locked, photoEdit, addMode, selBlk, tab, shadowOn]);
  React.useEffect(() => {
    const t = tRef.current;
    if (!t.sunLight) return;
    const sp = p3SunPos(st.sun);
    const altR = sp.alt * P3_DEG,
      azR = sp.az * P3_DEG;
    const R = 80;
    t.sunLight.position.set(Math.sin(azR) * Math.cos(altR) * R, Math.max(0.02, Math.sin(altR)) * R, -Math.cos(azR) * Math.cos(altR) * R);
    t.sunLight.target.position.set(0, 0, 0);
    const day = sp.alt > 0;
    const flat = lightMode === "flat";
    t.sunLight.intensity = flat ? 0.3 : day ? 0.55 + 0.85 * Math.min(1, Math.sin(altR) * 1.6) : 0;
    t.amb.intensity = flat ? 1.55 : day ? 0.75 : 0.28;
    if (t.scene) t.scene.background.set(flat ? 0xdce8f2 : day ? sp.alt < 12 ? 0xf3d9b8 : 0xdce8f2 : 0x1d2733);
    const g = t.sunGrp;
    if (!g) return;
    while (g.children.length) {
      const c = g.children[0];
      g.remove(c);
      c.traverse && c.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      });
    }
    if (!showSun) return;
    const THREE = t.THREE;
    if (!THREE) return;
    const SR = Math.max(26, (+st.groundW || 40) * 0.95);
    const dirAt = (alt, az) => {
      const a = alt * P3_DEG,
        z = az * P3_DEG;
      return new THREE.Vector3(Math.sin(z) * Math.cos(a) * SR, Math.sin(a) * SR, -Math.cos(z) * Math.cos(a) * SR);
    };
    const up = [],
      down = [];
    for (let h = 0; h <= 24.0001; h += 0.08) {
      const s = p3SunPos(Object.assign({}, st.sun, {
        hour: h
      }));
      (s.alt >= 0 ? up : down).push(dirAt(s.alt, s.az));
    }
    if (down.length > 1) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(down), new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.3
    })));
    if (up.length > 1) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(up), new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.95
    })));
    if (up.length > 1) {
      const endMat = new THREE.MeshBasicMaterial({
        color: 0xea580c
      });
      [up[0], up[up.length - 1]].forEach(p => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.016, 12, 10), endMat);
        m.position.copy(p);
        g.add(m);
      });
    }
    const mkLabel = txt => {
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 64;
      const x = cv.getContext("2d");
      x.fillStyle = "var(--tint-amber-tx)";
      x.font = "bold 42px system-ui";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(txt, 64, 34);
      const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true
      }));
      sp2.scale.set(SR * 0.105, SR * 0.052, 1);
      return sp2;
    };
    const tickMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b
    });
    for (let h = 5; h <= 19; h++) {
      const s = p3SunPos(Object.assign({}, st.sun, {
        hour: h
      }));
      if (s.alt < 0) continue;
      const p = dirAt(s.alt, s.az);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.009, 8, 6), tickMat);
      dot.position.copy(p);
      g.add(dot);
      if (h % 3 === 0) {
        const lb = mkLabel(h + ":00");
        lb.position.copy(p).multiplyScalar(1.075);
        g.add(lb);
      }
    }
    if (day) {
      const pos = dirAt(sp.alt, sp.az);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.038, 20, 16), new THREE.MeshBasicMaterial({
        color: sp.alt < 12 ? 0xff8c3a : 0xffd24a
      }));
      ball.position.copy(pos);
      g.add(ball);
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const cx = cv.getContext("2d");
      const grd = cx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,214,102,.85)");
      grd.addColorStop(0.45, "rgba(255,190,80,.28)");
      grd.addColorStop(1, "rgba(255,180,70,0)");
      cx.fillStyle = grd;
      cx.fillRect(0, 0, 128, 128);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthWrite: false
      }));
      glow.scale.set(SR * 0.26, SR * 0.26, 1);
      glow.position.copy(pos);
      g.add(glow);
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pos, new THREE.Vector3(0, 0, 0)]), new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.45,
        dashSize: SR * 0.03,
        gapSize: SR * 0.025
      })).computeLineDistances());
    }
  }, [st.sun, st.groundW, ready, lightMode, showSun]);
  React.useEffect(() => {
    if (!animating) return;
    let run = true;
    const step = () => {
      if (!run) return;
      setSt(p => {
        let h = (+p.sun.hour || 12) + 0.06;
        if (h > 18.5) h = 6;
        return Object.assign({}, p, {
          sun: Object.assign({}, p.sun, {
            hour: Math.round(h * 100) / 100
          })
        });
      });
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    return () => {
      run = false;
      cancelAnimationFrame(raf);
    };
  }, [animating]);
  React.useEffect(() => {
    const t = tRef.current;
    if (!ready || !t.renderer) return;
    const THREE = t.THREE;
    const cv = t.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let down = null;
    const setRay = ev => {
      const rect = cv.getBoundingClientRect();
      ptr.x = (ev.clientX - rect.left) / rect.width * 2 - 1;
      ptr.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ptr, t.camera);
    };
    const pick = ev => {
      setRay(ev);
      const hitB = ray.intersectObjects(t.pickBlk || [], false)[0];
      if (hitB) return {
        kind: "blk",
        obj: hitB.object
      };
      const hitV = ray.intersectObjects(t.pickVerts || [], false)[0];
      if (hitV) return {
        kind: "vertex",
        obj: hitV.object
      };
      const hitP = ray.intersectObjects(t.pickPanels || [], false)[0];
      if (hitP) return {
        kind: "panel",
        obj: hitP.object
      };
      const hitR = ray.intersectObjects(t.pickRoofs || [], false)[0];
      if (hitR) return {
        kind: "roof",
        obj: hitR.object
      };
      const hitO = ray.intersectObjects(t.pickObs || [], false)[0];
      if (hitO) return {
        kind: "obstacle",
        obj: hitO.object
      };
      return null;
    };
    const groundPoint = () => {
      const v = new THREE.Vector3();
      return ray.ray.intersectPlane(groundPlane, v) ? v : null;
    };
    const snapPt = (pt, skipRoofId, skipIdx) => {
      const stNow = stRef.current;
      let best = null,
        bd = 0.7;
      (stNow.roofs || []).forEach(r => {
        if (r.kind !== "poly" || !Array.isArray(r.pts)) return;
        r.pts.forEach((p, i) => {
          if (r.id === skipRoofId && i === skipIdx) return;
          const wx = (+r.x || 0) + (+p.x || 0),
            wz = (+r.z || 0) + (+p.z || 0);
          const dd = Math.hypot(wx - pt.x, wz - pt.z);
          if (dd < bd) {
            bd = dd;
            best = {
              x: wx,
              z: wz
            };
          }
        });
      });
      return best || {
        x: Math.round(pt.x * 20) / 20,
        z: Math.round(pt.z * 20) / 20
      };
    };
    const blkPoint = (fr, M) => {
      if (!fr || !M) return null;
      const o = fr.o.clone().applyMatrix4(M);
      const n = fr.nn.clone().transformDirection(M).normalize();
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, o);
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectPlane(pl, hit)) return null;
      const loc = hit.applyMatrix4(new THREE.Matrix4().copy(M).invert()).sub(fr.o);
      return {
        u: loc.dot(fr.un),
        v: loc.dot(fr.vn)
      };
    };
    const bearing = (gp, cx, cz) => Math.atan2(gp.x - cx, -(gp.z - cz)) * 180 / Math.PI;
    const norm180 = d => {
      let v = ((d + 180) % 360 + 360) % 360 - 180;
      return v;
    };
    const onDown = ev => {
      if (ev.button !== undefined && ev.button !== 0) return;
      if (lockedRef.current && (photoEditRef.current || drawingRef.current)) return;
      if (photoEditRef.current) {
        setRay(ev);
        const stNow = stRef.current;
        const cx = +stNow.photoX || 0,
          cz = +stNow.photoZ || 0;
        const gp0 = groundPoint();
        const hitH = ray.intersectObjects(t.pickPhotoH || [], false)[0];
        if (hitH && gp0) {
          const mode = hitH.object.userData.photoHandle;
          down = {
            x: ev.clientX,
            y: ev.clientY,
            moved: false,
            photo: mode,
            startW: +stNow.photoW || 30,
            startDist: Math.hypot(gp0.x - cx, gp0.z - cz),
            startBear: bearing(gp0, cx, cz),
            startRot: +stNow.photoRot || 0
          };
          t.controls.enabled = false;
          return;
        }
        const hitB = ray.intersectObjects(t.pickPhoto || [], false)[0];
        if (hitB && gp0) {
          down = {
            x: ev.clientX,
            y: ev.clientY,
            moved: false,
            photo: "move",
            startPos: {
              x: cx,
              z: cz
            },
            grab: {
              x: gp0.x,
              z: gp0.z
            }
          };
          t.controls.enabled = false;
        }
        return;
      }
      if (drawingRef.current) {
        down = {
          x: ev.clientX,
          y: ev.clientY,
          draw: true,
          moved: false
        };
        return;
      }
      const hit = pick(ev);
      if (!hit) return;
      const stNow = stRef.current;
      const ud = hit.obj.userData;
      let rec = null,
        dragId = null;
      const bodyLock = tabRef.current === "panel" || lockedRef.current;
      if (hit.kind === "vertex") {
        rec = (stNow.roofs || []).find(r => r.id === ud.roofId);
        if (!rec) return;
        setRay(ev);
        const gp = bodyLock ? null : groundPoint();
        down = {
          x: ev.clientX,
          y: ev.clientY,
          hit,
          kind: "vertex",
          roofId: ud.roofId,
          idx: ud.idx,
          moved: false,
          startPt: {
            x: +rec.pts[ud.idx].x || 0,
            z: +rec.pts[ud.idx].z || 0
          },
          grab: gp ? {
            x: gp.x,
            z: gp.z
          } : null
        };
        if (!bodyLock) t.controls.enabled = false;
        return;
      }
      if (hit.kind === "blk") {
        const fr = (t.blkFrames || [])[ud.frIdx];
        if (!fr || !fr.parent) return;
        fr.parent.updateWorldMatrix(true, false);
        const M = fr.parent.matrixWorld.clone();
        const st0 = blkPoint(fr, M);
        const roofNow = (stNow.roofs || []).find(r => r.id === ud.roofId);
        if (!st0 || !roofNow) return;
        const b0 = p3Blocks(roofNow)[ud.blk];
        down = {
          x: ev.clientX,
          y: ev.clientY,
          kind: "blk",
          mode: ud.mode,
          corner: ud.corner,
          hit,
          M,
          roofId: ud.roofId,
          blk: ud.blk,
          fr,
          rect: ud.rect,
          moved: false,
          grab: st0,
          b0: {
            du: b0.du,
            dv: b0.dv,
            rot: b0.rot
          },
          startAng: Math.atan2(st0.v - ud.rect.cv, st0.u - ud.rect.cu)
        };
        t.controls.enabled = false;
        return;
      }
      if (hit.kind === "panel" || hit.kind === "roof") dragId = ud.roofId || ud.id;else dragId = ud.id;
      rec = hit.kind === "obstacle" ? (stNow.obstacles || []).find(o => o.id === dragId) : (stNow.roofs || []).find(r => r.id === dragId);
      if (!rec) return;
      setRay(ev);
      const gp = bodyLock ? null : groundPoint();
      const members = hit.kind !== "obstacle" && rec.grp ? (stNow.roofs || []).filter(r => r.grp === rec.grp).map(r => ({
        id: r.id,
        x: +r.x || 0,
        z: +r.z || 0
      })) : [{
        id: rec.id,
        x: +rec.x || 0,
        z: +rec.z || 0
      }];
      down = {
        x: ev.clientX,
        y: ev.clientY,
        hit,
        kind: hit.kind,
        dragId,
        moved: false,
        members,
        startPos: {
          x: +rec.x || 0,
          z: +rec.z || 0
        },
        grab: gp ? {
          x: gp.x,
          z: gp.z
        } : null
      };
      if (!bodyLock) t.controls.enabled = false;
    };
    const onMove = ev => {
      if (!down) return;
      if (ev.buttons === 0) {
        down = null;
        if (t.controls && !drawingRef.current) t.controls.enabled = true;
        return;
      }
      if (Math.abs(ev.clientX - down.x) + Math.abs(ev.clientY - down.y) > 6) down.moved = true;
      if (down.photo) {
        if (!down.moved) return;
        setRay(ev);
        const gp = groundPoint();
        if (!gp) return;
        const stNow = stRef.current;
        const cx = +stNow.photoX || 0,
          cz = +stNow.photoZ || 0;
        if (down.photo === "move") {
          set({
            photoX: Math.round((down.startPos.x + gp.x - down.grab.x) * 20) / 20,
            photoZ: Math.round((down.startPos.z + gp.z - down.grab.z) * 20) / 20
          });
        } else if (down.photo === "rot") {
          let deg = down.startRot + (bearing(gp, cx, cz) - down.startBear);
          if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
          set({
            photoRot: Math.round(norm180(deg) * 2) / 2
          });
        } else if (down.photo === "scale") {
          const d = Math.hypot(gp.x - cx, gp.z - cz);
          if (down.startDist > 0.2) {
            const w = down.startW * (d / down.startDist);
            set({
              photoW: Math.round(Math.max(2, Math.min(400, w)) * 10) / 10
            });
          }
        }
        return;
      }
      if (down.kind === "blk") {
        if (!down.moved) return;
        setRay(ev);
        const p = blkPoint(down.fr, down.M);
        if (!p) return;
        const stNow = stRef.current;
        const roofNow = (stNow.roofs || []).find(r => r.id === down.roofId);
        if (!roofNow) return;
        const rc = down.rect,
          r2 = v => Math.round(v * 20) / 20;
        if (down.mode === "move") {
          patchBlk(roofNow, down.blk, {
            du: r2(down.b0.du + p.u - down.grab.u),
            dv: r2(down.b0.dv + p.v - down.grab.v)
          });
        } else if (down.mode === "rot") {
          let deg = down.b0.rot + (Math.atan2(p.v - rc.cv, p.u - rc.cu) - down.startAng) / P3_DEG;
          if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
          patchBlk(roofNow, down.blk, {
            rot: Math.max(-90, Math.min(90, Math.round(deg)))
          });
        } else if (down.mode === "size") {
          const rr = rc.rot * P3_DEG,
            cr = Math.cos(-rr),
            sr = Math.sin(-rr);
          const dx = p.u - rc.cu,
            dy = p.v - rc.cv;
          const a = dx * cr - dy * sr,
            b = dx * sr + dy * cr;
          const sx = down.corner === 1 || down.corner === 2 ? 1 : -1;
          const sy = down.corner === 2 || down.corner === 3 ? 1 : -1;
          const fixA = -sx * rc.w / 2,
            fixB = -sy * rc.h / 2;
          const cols = Math.max(1, Math.min(rc.maxCols, Math.round((Math.abs(a - fixA) + rc.gap) / (rc.pw + rc.gap))));
          const rows = Math.max(1, Math.min(rc.maxRows, Math.round((Math.abs(b - fixB) + rc.gap) / (rc.pd + rc.gap))));
          const c0 = p3BlkC0(rc, rows, cols);
          const nu = rc.cu + (fixA + sx * c0.w / 2) * Math.cos(rr) - (fixB + sy * c0.h / 2) * Math.sin(rr);
          const nv = rc.cv + (fixA + sx * c0.w / 2) * Math.sin(rr) + (fixB + sy * c0.h / 2) * Math.cos(rr);
          patchBlk(roofNow, down.blk, {
            rows,
            cols,
            du: r2(nu - c0.u),
            dv: r2(nv - c0.v),
            adds: {}
          });
        }
        return;
      }
      if (down.draw || !down.moved || !down.grab) return;
      setRay(ev);
      const gp = groundPoint();
      if (!gp) return;
      if (down.kind === "vertex") {
        const stNow = stRef.current;
        const roof = (stNow.roofs || []).find(r => r.id === down.roofId);
        if (roof) {
          const wx = (+roof.x || 0) + down.startPt.x + gp.x - down.grab.x;
          const wz = (+roof.z || 0) + down.startPt.z + gp.z - down.grab.z;
          const sp = snapPt({
            x: wx,
            z: wz
          }, down.roofId, down.idx);
          const nx = Math.round((sp.x - (+roof.x || 0)) * 20) / 20;
          const nz = Math.round((sp.z - (+roof.z || 0)) * 20) / 20;
          const pts = roof.pts.map((p, i) => i === down.idx ? {
            x: nx,
            z: nz
          } : p);
          patchRoof(down.roofId, {
            pts
          });
        }
        return;
      }
      const dx = gp.x - down.grab.x,
        dz = gp.z - down.grab.z;
      if (down.kind === "obstacle") {
        patchObs(down.dragId, {
          x: Math.round((down.startPos.x + dx) * 10) / 10,
          z: Math.round((down.startPos.z + dz) * 10) / 10
        });
      } else {
        const ups = {};
        down.members.forEach(mb => {
          ups[mb.id] = {
            x: Math.round((mb.x + dx) * 10) / 10,
            z: Math.round((mb.z + dz) * 10) / 10
          };
        });
        patchRoofs(ups);
      }
    };
    const onUp = ev => {
      const t2 = tRef.current;
      if (t2.controls && !drawingRef.current) t2.controls.enabled = true;
      if (down && down.photo) {
        down = null;
        return;
      }
      if (down && down.draw) {
        if (!down.moved && ev.target === cv) {
          setRay(ev);
          const gp = groundPoint();
          if (gp) {
            const sp = snapPt(gp, null, null);
            setDrawPts(p => p.concat([sp]));
          }
        }
        down = null;
        return;
      }
      if (down && !down.moved) {
        const ud = down.hit.obj.userData;
        if (down.kind === "panel") {
          const stNow = stRef.current;
          const roof = stNow.roofs.find(r => r.id === ud.roofId);
          if (roof) toggleCell(roof, ud.key, !!ud.slot);
          setSelRoof(ud.roofId);
          setSelObs(null);
          setSelVert(null);
          setTab("panel");
        } else if (down.kind === "vertex") {
          setSelRoof(ud.roofId);
          setSelObs(null);
          setSelVert({
            roofId: ud.roofId,
            idx: ud.idx
          });
          setTab("roof");
        } else if (down.kind === "roof") {
          setSelRoof(ud.id);
          setSelObs(null);
          setSelVert(null);
          setTab("roof");
        } else if (down.kind === "obstacle") {
          setSelObs(ud.id);
          setSelRoof(null);
          setSelVert(null);
          setTab("obstacle");
        }
      }
      down = null;
    };
    cv.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      cv.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [ready]);
  const viewTop = () => {
    const t = tRef.current;
    if (!t.camera) return;
    t.camera.position.set(0, Math.max(30, st.groundW * 0.9), 0.01);
    t.controls.target.set(0, 0, 0);
    if (t.controls) {
      t.controls.enableRotate = false;
      const TH = t.THREE;
      if (TH) {
        t.controls.mouseButtons.LEFT = TH.MOUSE.PAN;
        t.controls.touches.ONE = TH.TOUCH.PAN;
      }
    }
    setView2D(true);
  };
  const view3d = () => {
    const t = tRef.current;
    if (!t.camera) return;
    t.camera.position.set(18, 16, 18);
    t.controls.target.set(0, 1, 0);
    if (t.controls) {
      t.controls.enableRotate = true;
      const TH = t.THREE;
      if (TH) {
        t.controls.mouseButtons.LEFT = TH.MOUSE.ROTATE;
        t.controls.touches.ONE = TH.TOUCH.ROTATE;
      }
    }
    setView2D(false);
  };
  const startDraw = () => {
    setDrawing(true);
    setDrawPts([]);
    setSelObs(null);
    setTab("roof");
    viewTop();
  };
  const cancelDraw = () => {
    setDrawing(false);
    setDrawPts([]);
  };
  const finishDraw = () => {
    if (drawPts.length < 3) return;
    const cx = drawPts.reduce((s, p) => s + p.x, 0) / drawPts.length;
    const cz = drawPts.reduce((s, p) => s + p.z, 0) / drawPts.length;
    const nr = Object.assign(p3NewRoof(p3NextRoofNo(st.roofs)), {
      kind: "poly",
      x: Math.round(cx * 10) / 10,
      z: Math.round(cz * 10) / 10,
      h: 0.05,
      pts: drawPts.map(p => ({
        x: Math.round((p.x - cx) * 20) / 20,
        z: Math.round((p.z - cz) * 20) / 20
      })),
      ph: drawPts.map(() => 0.05)
    });
    set({
      roofs: (st.roofs || []).concat([nr])
    });
    setSelRoof(nr.id);
    setSelVert(null);
    setDrawing(false);
    setDrawPts([]);
  };
  const fileRef = React.useRef(null);
  const onPickPhoto = async e => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    try {
      const url = await window.resizeImageFile(f, 1600, 0.82);
      set({
        photo: url
      });
    } catch (err) {
      alert("โหลดรูปไม่สำเร็จ: " + err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  };
  const jobLatLng = p3ParseLatLng(job && job.map);
  const jobAddr = job ? [job.address, job.province].filter(Boolean).join(" ") : "";
  const onPickMap = res => {
    set({
      baseMap: {
        url: res.url,
        widthM: res.widthM,
        lat: res.lat,
        lng: res.lng,
        zoom: res.zoom
      },
      groundW: Math.max(20, Math.ceil(res.widthM))
    });
    setSun({
      lat: res.lat,
      lng: res.lng
    });
    setMapOpen(false);
  };
  const doSave = () => {
    save(JSON.parse(JSON.stringify(st)));
    setDirty(false);
  };
  const doPng = () => {
    const t = tRef.current;
    if (!t.renderer) return;
    try {
      const a = document.createElement("a");
      a.href = t.renderer.domElement.toDataURL("image/png");
      a.download = (job ? job.code : "plan3d") + "-3D.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("ส่งออกภาพไม่สำเร็จ: " + e.message);
    }
  };
  const tryClose = () => {
    if (dirty) {
      const t0 = Date.now();
      if (!confirm("มีการแก้ไขที่ยังไม่บันทึก — ปิดโดยไม่บันทึกใช่ไหม?") && Date.now() - t0 > 80) return;
    }
    onClose();
  };
  const inp = P3_INP;
  const Num = P3Num;
  const NumRange = P3NumRange;
  const Slider = P3Slider;
  const TabBtn = ({
    k,
    label,
    icon
  }) => React.createElement("button", {
    onClick: () => setTab(k),
    "data-on": tab === k ? "1" : "0",
    title: label
  }, React.createElement(P3Icon, {
    name: icon,
    size: 16
  }), React.createElement("span", null, label));
  const IconBtn = ({
    onClick,
    icon,
    label,
    on,
    title,
    tone
  }) => React.createElement("button", {
    className: "p3-tool",
    onClick: onClick,
    title: title,
    "data-on": on ? "1" : "0",
    "data-tone": tone || ""
  }, React.createElement(P3Icon, {
    name: icon
  }), label && React.createElement("span", null, label));
  const SmallBtn = ({
    onClick,
    children,
    color,
    bg,
    disabled,
    cls,
    icon,
    title
  }) => React.createElement("button", {
    className: "p3-b sm " + (cls || ""),
    onClick: onClick,
    disabled: disabled,
    title: title,
    style: color || bg ? {
      color: color,
      background: bg,
      borderColor: bg || undefined
    } : null
  }, icon && React.createElement(P3Icon, {
    name: icon,
    size: 14
  }), children);
  const roof = (st.roofs || []).find(r => r.id === selRoof) || null;
  const obs = (st.obstacles || []).find(o => o.id === selObs) || null;
  const grpIdx = {};
  let grpN = 0;
  (st.roofs || []).forEach(r => {
    if (r.grp && grpIdx[r.grp] == null) grpIdx[r.grp] = grpN++;
  });
  const grpColor = g => P3_GRP_COLORS[(grpIdx[g] || 0) % P3_GRP_COLORS.length];
  const grpLabel = g => "กลุ่ม " + String.fromCharCode(65 + (grpIdx[g] || 0));
  const grpSize = g => (st.roofs || []).filter(r => r.grp === g).length;
  const roofChips = (() => {
    const first = {};
    (st.roofs || []).forEach((r, i) => {
      if (r.grp && first[r.grp] == null) first[r.grp] = i;
    });
    const key = (r, i) => r.grp && first[r.grp] != null ? first[r.grp] : i;
    return (st.roofs || []).map((r, i) => ({
      r,
      i
    })).sort((a, b) => key(a.r, a.i) - key(b.r, b.i) || a.i - b.i).map(x => x.r);
  })();
  const leaveGrp = () => {
    if (!roof || !roof.grp) return;
    const gid = roof.grp,
      ups = {};
    ups[roof.id] = {
      grp: null
    };
    const left = (st.roofs || []).filter(x => x.grp === gid && x.id !== roof.id);
    if (left.length < 2) left.forEach(x => {
      ups[x.id] = {
        grp: null
      };
    });
    patchRoofs(ups);
  };
  const isPolyRoof = roof && roof.kind === "poly" && Array.isArray(roof.pts);
  const isGable = roof && roof.kind === "gable";
  const isHip = roof && roof.kind === "hip";
  const isDome = roof && roof.kind === "dome";
  React.useEffect(() => {
    setSelBlk(0);
  }, [selRoof]);
  const domeInfo = isDome ? p3DomeGeo(roof) : null;
  const gableRise = isGable ? Math.round((+roof.span || 8) / 2 * Math.tan((+roof.pitch || 0) * P3_DEG) * 100) / 100 : 0;
  const gridSel = roof ? p3Panels(roof) : null;
  const hipInfo = isHip && gridSel ? gridSel.hip : null;
  const total = p3CountAll(st);
  const kwp = Math.round(total * (+st.wp || 650) / 10) / 100;
  const sunNow = p3SunPos(st.sun);
  const fmtHour = h => {
    const hh = Math.floor(h),
      mm = Math.round((h - hh) * 60);
    return hh + ":" + (mm < 10 ? "0" : "") + mm;
  };
  const polyAreaPlan = isPolyRoof ? Math.round(p3Area(roof.pts) * 10) / 10 : 0;
  const polyAreaSurf = isPolyRoof && gridSel && gridSel.plane ? Math.round(polyAreaPlan / gridSel.plane.tiltCos * 10) / 10 : 0;
  const panelBody = React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    className: "p3-seg"
  }, React.createElement(TabBtn, {
    k: "roof",
    label: "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    icon: "roof"
  }), React.createElement(TabBtn, {
    k: "panel",
    label: "\u0E41\u0E1C\u0E07",
    icon: "grid"
  }), React.createElement(TabBtn, {
    k: "photo",
    label: "\u0E1C\u0E31\u0E07\u0E1E\u0E37\u0E49\u0E19",
    icon: "map"
  }), React.createElement(TabBtn, {
    k: "obstacle",
    label: "\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07",
    icon: "tree"
  }), React.createElement(TabBtn, {
    k: "sun",
    label: "\u0E41\u0E2A\u0E07\u0E41\u0E14\u0E14",
    icon: "sun"
  })), tab === "photo" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    className: "p3-card tint"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "map",
    size: 13
  }), "\u0E1C\u0E31\u0E07\u0E1E\u0E37\u0E49\u0E19\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E14\u0E32\u0E27\u0E40\u0E17\u0E35\u0E22\u0E21", React.createElement("span", {
    className: "ln"
  }), st.baseMap && React.createElement("span", {
    style: {
      color: "var(--acd)",
      fontWeight: 800
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E25\u0E49\u0E27")), React.createElement("button", {
    className: "p3-b pri w",
    onClick: () => setMapOpen(true),
    style: {
      padding: "10px"
    }
  }, st.baseMap ? "เปลี่ยนพื้นที่ / เลือกใหม่" : "เลือกพื้นที่จากแผนที่"), st.baseMap ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p3-stat"
  }, "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E08\u0E23\u0E34\u0E07 ", React.createElement("b", null, Math.round(st.baseMap.widthM), " \u0E21."), React.createElement("span", {
    style: {
      opacity: .4
    }
  }, "\xB7"), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, (+st.baseMap.lat).toFixed(5), ", ", (+st.baseMap.lng).toFixed(5))), React.createElement(SmallBtn, {
    cls: "dngr",
    icon: "trash",
    onClick: () => set({
      baseMap: null
    })
  }, "\u0E25\u0E1A\u0E1C\u0E31\u0E07\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48")) : React.createElement("div", {
    className: "p3-note"
  }, "\u0E44\u0E14\u0E49\u0E2A\u0E40\u0E01\u0E25\u0E08\u0E23\u0E34\u0E07 (\u0E40\u0E21\u0E15\u0E23) + \u0E17\u0E34\u0E28\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \xB7 \u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E1A\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22\u0E41\u0E21\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19", jobAddr ? " · จะเล็งไปที่อยู่ลูกค้าให้" : "")), React.createElement("div", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, React.createElement(P3Icon, {
    name: "image",
    size: 13
  }), "\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E40\u0E25\u0E40\u0E22\u0E2D\u0E23\u0E4C\u0E40\u0E2A\u0E23\u0E34\u0E21 \u0E27\u0E32\u0E07\u0E17\u0E31\u0E1A\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48")), React.createElement("button", {
    className: "p3-b dashed w",
    onClick: () => fileRef.current && fileRef.current.click(),
    style: {
      padding: "13px 10px"
    }
  }, React.createElement(P3Icon, {
    name: st.photo ? "image" : "plus",
    size: 14
  }), st.photo ? "เปลี่ยนรูปโดรน (มุมบน)" : "อัปโหลดรูปโดรน (มุมบน)"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    onChange: onPickPhoto,
    style: {
      display: "none"
    }
  }), st.photo && React.createElement(React.Fragment, null, React.createElement("img", {
    src: st.photo,
    alt: "drone",
    style: {
      width: "100%",
      borderRadius: 12,
      border: "1px solid var(--border)",
      display: "block"
    }
  }), React.createElement("button", {
    className: "p3-b w",
    onClick: () => {
      const n = !photoEdit;
      setPhotoEdit(n);
      if (n) {
        setLocked(false);
        setDrawing(false);
        viewTop();
      }
    },
    style: {
      padding: "11px 10px",
      fontSize: 12.5,
      fontWeight: 700,
      background: photoEdit ? "#1D4ED8" : "#2563EB",
      borderColor: photoEdit ? "#1D4ED8" : "#2563EB",
      color: "#fff"
    }
  }, React.createElement(P3Icon, {
    name: photoEdit ? "check" : "image",
    size: 14
  }), photoEdit ? "กำลังปรับรูปบนภาพ (กดเพื่อจบ)" : "ปรับรูปบนภาพ (ลาก/หมุน/ย่อขยาย)"), React.createElement("div", {
    className: "p3-card"
  }, React.createElement(Num, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E39\u0E1B\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07 (\u0E2A\u0E40\u0E01\u0E25)",
    value: st.photoW,
    step: 1,
    min: 2,
    suffix: "\u0E21.",
    onChange: v => set({
      photoW: v
    })
  }), React.createElement(Slider, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E17\u0E36\u0E1A\u0E23\u0E39\u0E1B",
    right: Math.round((st.photoOpacity || 0.95) * 100) + "%",
    min: 0.15,
    max: 1,
    step: 0.05,
    value: st.photoOpacity,
    onChange: v => set({
      photoOpacity: v
    })
  }), React.createElement(Slider, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E23\u0E39\u0E1B (\u0E25\u0E14\u0E25\u0E07\u0E16\u0E49\u0E32\u0E23\u0E39\u0E1B\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E08\u0E49\u0E32)",
    right: Math.round((st.photoBright == null ? 0.7 : st.photoBright) * 100) + "%",
    min: 0.25,
    max: 1,
    step: 0.05,
    value: st.photoBright == null ? 0.7 : st.photoBright,
    onChange: v => set({
      photoBright: v
    })
  })), React.createElement(SmallBtn, {
    cls: "dngr",
    icon: "trash",
    onClick: () => set({
      photo: null,
      photoRot: 0,
      photoX: 0,
      photoZ: 0
    })
  }, "\u0E25\u0E1A\u0E23\u0E39\u0E1B")), React.createElement("div", {
    className: "p3-note"
  }, "\u0E40\u0E04\u0E25\u0E47\u0E14\u0E25\u0E31\u0E1A: \u0E43\u0E0A\u0E49\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19\u0E16\u0E48\u0E32\u0E22\u0E15\u0E23\u0E07\u0E08\u0E32\u0E01\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E1B\u0E23\u0E31\u0E1A \u201C\u0E2A\u0E40\u0E01\u0E25\u201D \u0E43\u0E2B\u0E49\u0E23\u0E30\u0E22\u0E30\u0E1A\u0E19\u0E23\u0E39\u0E1B\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07 \u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E44\u0E1B\u0E41\u0E17\u0E47\u0E1A \u201C\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u201D \u2192 \u0E01\u0E14 \u201C\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E23\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E25\u0E2D\u0E01\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E32\u0E21\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22")), tab === "roof" && drawing && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    className: "p3-card tint"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "pencil",
    size: 13
  }), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E23\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 7
    }
  }, React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 800,
      lineHeight: 1,
      color: "var(--acd)",
      letterSpacing: "-1px"
    }
  }, drawPts.length), React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E27\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 ", drawPts.length < 3 ? "· ต้องอย่างน้อย 3 จุด" : "")), React.createElement("div", {
    className: "p3-note"
  }, "\u0E04\u0E25\u0E34\u0E01\u0E1A\u0E19\u0E20\u0E32\u0E1E\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07 \u201C\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u201D \u0E17\u0E35\u0E25\u0E30\u0E08\u0E38\u0E14 \u0E44\u0E25\u0E48\u0E15\u0E32\u0E21\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E23\u0E39\u0E1B \u2014 \u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E08\u0E1A\u0E23\u0E39\u0E1B \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 3D \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E07\u0E28\u0E32\u0E40\u0E2D\u0E35\u0E22\u0E07/\u0E17\u0E34\u0E28")), React.createElement("button", {
    className: "p3-b pri w",
    onClick: finishDraw,
    disabled: drawPts.length < 3,
    style: {
      padding: "11px 8px",
      fontSize: 13
    }
  }, React.createElement(P3Icon, {
    name: "check",
    size: 15
  }), "\u0E08\u0E1A\u0E23\u0E39\u0E1B (", drawPts.length, " \u0E08\u0E38\u0E14)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, React.createElement(SmallBtn, {
    cls: "w",
    icon: "reset",
    onClick: () => setDrawPts(p => p.slice(0, -1)),
    disabled: !drawPts.length
  }, "\u0E16\u0E2D\u0E22\u0E08\u0E38\u0E14"), React.createElement(SmallBtn, {
    cls: "dngr w",
    onClick: cancelDraw
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"))), tab === "roof" && !drawing && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: (st.roofs || []).length ? "flex" : "none",
      gap: 6,
      flexWrap: "wrap"
    }
  }, (() => {
    const out = [],
      seen = {};
    const roofChip = r => React.createElement("button", {
      key: r.id,
      className: "p3-chip",
      "data-on": r.id === selRoof ? "1" : "0",
      onClick: () => {
        setSelRoof(r.id);
        setSelObs(null);
      },
      title: r.grp ? grpLabel(r.grp) + " · " + grpSize(r.grp) + " ผืน (ลากไปพร้อมกัน)" : "",
      style: r.id === selRoof || !r.grp ? null : {
        borderColor: grpColor(r.grp) + "55"
      }
    }, r.grp && React.createElement("span", {
      className: "dot",
      style: {
        background: grpColor(r.grp)
      }
    }), React.createElement(P3Icon, {
      name: r.kind === "dome" ? "dome" : r.kind === "gable" || r.kind === "hip" ? "roof" : "layers",
      size: 13
    }), React.createElement("span", null, r.name));
    const headChip = (g, open) => React.createElement("button", {
      key: "g" + g,
      className: "p3-chip",
      onClick: () => setExpGrp(open ? null : g),
      title: open ? "ยุบกลุ่ม" : "กางเป็นรายผืน",
      style: {
        borderColor: grpColor(g),
        background: grpColor(g) + "12",
        color: grpColor(g),
        fontWeight: 750
      }
    }, React.createElement("span", {
      className: "dot",
      style: {
        background: grpColor(g)
      }
    }), React.createElement("span", null, grpLabel(g), open ? "" : " · " + grpSize(g) + " ผืน"), React.createElement("span", {
      style: {
        display: "grid",
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform .18s ease"
      }
    }, React.createElement("svg", {
      width: "11",
      height: "11",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, React.createElement("path", {
      d: "m4 6.4 4 4 4-4"
    }))));
    roofChips.forEach(r => {
      if (!r.grp) {
        out.push(roofChip(r));
        return;
      }
      if (seen[r.grp]) return;
      seen[r.grp] = true;
      const g = r.grp,
        mems = roofChips.filter(x => x.grp === g);
      if (expGrp === g) {
        out.push(React.createElement("div", {
          key: "gb" + g,
          style: {
            flexBasis: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 7,
            border: "1px dashed " + grpColor(g) + "55",
            background: grpColor(g) + "0A",
            borderRadius: 12,
            padding: "8px 9px"
          }
        }, headChip(g, true), React.createElement("div", {
          style: {
            display: "flex",
            gap: 6,
            flexWrap: "wrap"
          }
        }, mems.map(roofChip))));
      } else {
        out.push(headChip(g, false));
        const sel = mems.find(x => x.id === selRoof);
        if (sel) out.push(roofChip(sel));
      }
    });
    return out;
  })()), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, React.createElement("button", {
    className: "p3-b dashed",
    onClick: startDraw,
    title: "\u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E32\u0E21\u0E23\u0E39\u0E1B \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E08\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      flex: 1,
      padding: "11px 8px",
      borderColor: "#4F46E5",
      background: "#6366F10F",
      color: "#4F46E5",
      lineHeight: 1.35
    }
  }, React.createElement(P3Icon, {
    name: "pencil",
    size: 14
  }), "\u0E27\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E23\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30"), React.createElement("button", {
    className: "p3-b dashed",
    onClick: () => {
      const nr = p3NewDome(p3NextRoofNo(st.roofs));
      set({
        roofs: (st.roofs || []).concat([nr])
      });
      setSelRoof(nr.id);
      setSelObs(null);
    },
    title: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E42\u0E14\u0E21 (\u0E1C\u0E34\u0E27\u0E42\u0E04\u0E49\u0E07)",
    style: {
      padding: "11px 13px",
      borderColor: "#0891B2",
      background: "#0891B20F",
      color: "#0E7490",
      whiteSpace: "nowrap"
    }
  }, React.createElement(P3Icon, {
    name: "dome",
    size: 14
  }), "\u0E42\u0E14\u0E21")), roof && React.createElement(React.Fragment, null, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E37\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("input", {
    className: "p3-inp",
    value: roof.name,
    onChange: e => patchRoof(roof.id, {
      name: e.target.value
    }),
    style: {
      fontWeight: 700
    }
  })), !isPolyRoof && React.createElement("div", {
    className: "p3-card",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, !isPolyRoof && !isGable && !isHip && !isDome && React.createElement(Num, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07 (\u0E41\u0E19\u0E27\u0E0A\u0E32\u0E22\u0E04\u0E32)",
    value: roof.w,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      w: v
    })
  }), !isPolyRoof && !isGable && !isHip && !isDome && React.createElement(Num, {
    label: "\u0E22\u0E32\u0E27\u0E25\u0E32\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    value: roof.d,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      d: v
    })
  }), isDome && React.createElement(Num, {
    label: "\u0E22\u0E32\u0E27\u0E42\u0E14\u0E21 (\u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19)",
    value: roof.ridge,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      ridge: v
    })
  }), isDome && React.createElement(Num, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E42\u0E14\u0E21 (\u0E04\u0E2D\u0E23\u0E4C\u0E14)",
    value: roof.span,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      span: v
    })
  }), isGable && React.createElement(Num, {
    label: "\u0E22\u0E32\u0E27\u0E2A\u0E31\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    value: roof.ridge,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      ridge: v
    })
  }), isGable && React.createElement(Num, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21 2 \u0E25\u0E32\u0E14",
    value: roof.span,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      span: v
    })
  }), isHip && React.createElement(Num, {
    label: "\u0E22\u0E32\u0E27\u0E23\u0E27\u0E21 (\u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19)",
    value: roof.w,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      w: v
    })
  }), isHip && React.createElement(Num, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21",
    value: roof.d,
    step: 0.1,
    min: 1,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      d: v
    })
  }), !isPolyRoof && React.createElement(Num, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E0A\u0E32\u0E22\u0E04\u0E32",
    value: roof.h,
    step: 0.1,
    min: 0.5,
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      h: v
    })
  }), isDome && React.createElement(NumRange, {
    span: true,
    label: "ความสูงโค้ง (จากชายคาถึงยอดโดม) · สูงสุด " + Math.round((+roof.span || 10) / 2 * 10) / 10 + " ม.",
    value: roof.rise == null ? 2.5 : roof.rise,
    step: 0.1,
    min: 0.2,
    max: Math.max(0.5, Math.round((+roof.span || 10) / 2 * 10) / 10),
    suffix: "\u0E21.",
    onChange: v => patchRoof(roof.id, {
      rise: v
    })
  }), !isPolyRoof && !isDome && React.createElement(NumRange, {
    span: true,
    label: isGable || isHip ? "องศาความชัน" : "องศาเอียง",
    value: roof.pitch,
    step: 1,
    min: 0,
    max: 60,
    suffix: "\xB0",
    onChange: v => patchRoof(roof.id, {
      pitch: v
    })
  }), !isPolyRoof && React.createElement(NumRange, {
    span: true,
    label: isDome ? "ทิศที่แนวสันโดมวางขวาง (180 = ลาดหันใต้)" : isGable || isHip ? "ทิศด้าน A หันไป (180 = ใต้)" : "ทิศที่ลาดหันไป (180 = ใต้)",
    value: roof.az,
    step: 5,
    min: 0,
    max: 360,
    suffix: "\xB0",
    onChange: v => patchRoof(roof.id, {
      az: v
    })
  })), isHip && hipInfo && React.createElement("div", {
    className: "p3-card amber"
  }, React.createElement("span", {
    className: "p3-eb",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, React.createElement(P3Icon, {
    name: "roof",
    size: 13
  }), "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E1B\u0E31\u0E49\u0E19\u0E2B\u0E22\u0E32", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px 14px"
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E31\u0E19\u0E22\u0E32\u0E27 ", React.createElement("b", null, Math.round(hipInfo.r * 100) / 100), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E08\u0E32\u0E01\u0E0A\u0E32\u0E22\u0E04\u0E32 ", React.createElement("b", null, Math.round(hipInfo.rise * 100) / 100), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E25\u0E32\u0E14 ", React.createElement("b", null, Math.round(hipInfo.SL * 100) / 100), " \u0E21.")), (+roof.w || 0) < (+roof.d || 0) && React.createElement("div", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700,
      fontSize: 11
    }
  }, "\u201C\u0E22\u0E32\u0E27\u0E23\u0E27\u0E21\u201D \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E14\u0E49\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E32\u0E27\u0E01\u0E27\u0E48\u0E32 \u201C\u0E01\u0E27\u0E49\u0E32\u0E07\u0E23\u0E27\u0E21\u201D"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6
    }
  }, [["sideA", "A คางหมู"], ["sideB", "B คางหมู"], ["sideC", "C สามเหลี่ยม"], ["sideD", "D สามเหลี่ยม"]].map(([k, lb]) => {
    const on = roof[k] !== false;
    return React.createElement("button", {
      key: k,
      className: "p3-chip",
      "data-on": on ? "1" : "0",
      onClick: () => patchRoof(roof.id, {
        [k]: !on
      }),
      title: on ? "กดเพื่อไม่วางแผงด้านนี้" : "กดเพื่อวางแผงด้านนี้",
      style: {
        borderRadius: 9,
        padding: "6px 8px",
        justifyContent: "space-between",
        background: on ? "var(--acs)" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5
      }
    }, React.createElement(P3Icon, {
      name: on ? "check" : "plus",
      size: 12,
      w: 2
    }), lb), React.createElement("b", {
      style: {
        fontWeight: 800
      }
    }, gridSel ? gridSel["count" + k.slice(4)] || 0 : 0));
  }))), isDome && domeInfo && React.createElement("div", {
    className: "p3-card cyan"
  }, React.createElement("span", {
    className: "p3-eb",
    style: {
      color: "#0E7490"
    }
  }, React.createElement(P3Icon, {
    name: "dome",
    size: 13
  }), "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E42\u0E14\u0E21", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px 14px"
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E23\u0E31\u0E28\u0E21\u0E35\u0E42\u0E04\u0E49\u0E07 ", React.createElement("b", null, Math.round(domeInfo.rad * 100) / 100), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E22\u0E32\u0E27\u0E2A\u0E48\u0E27\u0E19\u0E42\u0E04\u0E49\u0E07 ", React.createElement("b", null, Math.round(domeInfo.arc * 100) / 100), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E0A\u0E31\u0E19\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E23\u0E34\u0E21 ", React.createElement("b", null, Math.round(domeInfo.th / P3_DEG)), "\xB0")), domeInfo.rise >= domeInfo.span / 2 - 1e-6 && React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700,
      fontSize: 11
    }
  }, "\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27 (\u0E04\u0E23\u0E36\u0E48\u0E07\u0E27\u0E07\u0E01\u0E25\u0E21) \u2014 \u0E08\u0E30\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E42\u0E14\u0E21"), React.createElement(NumRange, {
    span: true,
    label: "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E0A\u0E31\u0E19\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 (90\xB0 = \u0E40\u0E15\u0E47\u0E21\u0E42\u0E04\u0E49\u0E07)",
    value: roof.maxTilt == null ? 90 : roof.maxTilt,
    step: 5,
    min: 5,
    max: 90,
    suffix: "\xB0",
    onChange: v => patchRoof(roof.id, {
      maxTilt: v
    })
  }), gridSel && gridSel.rowTilts && gridSel.rowTilts.length > 0 ? React.createElement("span", {
    className: "p3-note"
  }, "\u0E27\u0E32\u0E07\u0E44\u0E14\u0E49 ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, gridSel.rowTilts.length, " \u0E41\u0E16\u0E27"), " \xB7 \u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27 ", gridSel.rowTilts.join("° / "), "\xB0") : React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700,
      fontSize: 11
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E16\u0E27\u0E44\u0E2B\u0E19\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E04\u0E27\u0E32\u0E21\u0E0A\u0E31\u0E19 \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E07\u0E28\u0E32\u0E17\u0E35\u0E48\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E14\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E42\u0E04\u0E49\u0E07"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement(SmallBtn, {
    icon: "reset",
    onClick: () => patchRoof(roof.id, {
      ridge: roof.span,
      span: roof.ridge,
      az: ((+roof.az || 180) + 90) % 360,
      skips: {},
      blocks: clearCells(roof)
    })
  }, "\u0E2A\u0E25\u0E31\u0E1A\u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19 90\xB0"), Array.isArray(roof.pts) && roof.pts.length >= 3 && React.createElement(SmallBtn, {
    cls: "dashed",
    onClick: () => patchRoof(roof.id, {
      kind: "poly",
      skips: {},
      blocks: clearCells(roof)
    }),
    title: "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48\u0E27\u0E32\u0E14\u0E44\u0E27\u0E49\u0E40\u0E14\u0E34\u0E21 (\u0E02\u0E19\u0E32\u0E14\u0E42\u0E14\u0E21\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E44\u0E27\u0E49\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B)"
  }, "\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E23\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30"))), isGable && React.createElement("div", {
    className: "p3-card amber"
  }, React.createElement("span", {
    className: "p3-eb",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, React.createElement(P3Icon, {
    name: "roof",
    size: 13
  }), "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E08\u0E31\u0E48\u0E27", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "4px 14px"
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E08\u0E32\u0E01\u0E0A\u0E32\u0E22\u0E04\u0E32 ", React.createElement("b", null, gableRise), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E25\u0E32\u0E14\u0E14\u0E49\u0E32\u0E19\u0E25\u0E30 ", React.createElement("b", null, gridSel && gridSel.slopeLen ? Math.round(gridSel.slopeLen * 100) / 100 : 0), " \u0E21.")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, [["sideA", "ด้าน A", roof.az, gridSel ? gridSel.countA : 0], ["sideB", "ด้าน B", ((+roof.az || 180) + 180) % 360, gridSel ? gridSel.countB : 0]].map(([k, lb, az, n]) => {
    const on = roof[k] !== false;
    return React.createElement("button", {
      key: k,
      className: "p3-chip",
      "data-on": on ? "1" : "0",
      onClick: () => patchRoof(roof.id, {
        [k]: !on
      }),
      title: on ? "กดเพื่อไม่วางแผงด้านนี้" : "กดเพื่อวางแผงด้านนี้",
      style: {
        flex: 1,
        borderRadius: 10,
        padding: "7px 9px",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        background: on ? "var(--acs)" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11.5
      }
    }, React.createElement(P3Icon, {
      name: on ? "check" : "plus",
      size: 12,
      w: 2
    }), lb, " \xB7 \u0E17\u0E34\u0E28 ", az, "\xB0"), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800
      }
    }, n, " \u0E41\u0E1C\u0E07"));
  }))), isPolyRoof && React.createElement(React.Fragment, null, (() => {
    const rPh = p3PhOf(roof);
    const selIdx = selVert && selVert.roofId === roof.id ? selVert.idx : -1;
    return React.createElement("div", {
      className: "p3-card amber"
    }, React.createElement("span", {
      className: "p3-eb",
      style: {
        color: "var(--tint-amber-tx)"
      }
    }, React.createElement(P3Icon, {
      name: "height",
      size: 13
    }), "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E02\u0E2D\u0E07\u0E21\u0E38\u0E21", React.createElement("span", {
      className: "ln"
    }), React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, "\u0E22\u0E01\u0E2A\u0E31\u0E19/\u0E2B\u0E34\u0E1B\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E23\u0E07")), selIdx >= 0 ? React.createElement(NumRange, {
      span: true,
      label: "ความสูงมุมที่เลือก #" + (selIdx + 1),
      value: Math.round((rPh[selIdx] || 0) * 100) / 100,
      min: 0,
      max: 12,
      step: 0.1,
      suffix: "\u0E21.",
      onChange: v => setVertHeight(roof.id, selIdx, v)
    }) : React.createElement("span", {
      className: "p3-note"
    }, "\u0E41\u0E15\u0E30", React.createElement("b", {
      style: {
        color: "var(--tint-green-tx)"
      }
    }, "\u0E08\u0E38\u0E14\u0E40\u0E02\u0E35\u0E22\u0E27"), "\u0E17\u0E35\u0E48\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E (\u0E08\u0E30\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19", React.createElement("b", {
      style: {
        color: "#D97706"
      }
    }, "\u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21"), ") \u0E41\u0E25\u0E49\u0E27\u0E1B\u0E23\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49"), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap"
      }
    }, React.createElement(SmallBtn, {
      icon: "reset",
      onClick: () => patchRoof(roof.id, {
        ph: roof.pts.map(() => 0.05)
      })
    }, "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E17\u0E38\u0E01\u0E21\u0E38\u0E21\u0E43\u0E2B\u0E49\u0E23\u0E32\u0E1A"), React.createElement(SmallBtn, {
      icon: "dome",
      onClick: () => {
        const p = p3PolyToDomePatch(roof, st.buildH);
        if (p) patchRoof(roof.id, p);
      },
      title: "\u0E43\u0E0A\u0E49\u0E01\u0E23\u0E2D\u0E1A\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E17\u0E35\u0E48\u0E04\u0E23\u0E2D\u0E1A\u0E1C\u0E37\u0E19\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E19\u0E32\u0E14/\u0E17\u0E34\u0E28\u0E02\u0E2D\u0E07\u0E42\u0E14\u0E21 (\u0E14\u0E49\u0E32\u0E19\u0E22\u0E32\u0E27 = \u0E41\u0E19\u0E27\u0E2A\u0E31\u0E19) \u2014 \u0E01\u0E14\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E23\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E44\u0E14\u0E49",
      color: "#0E7490",
      bg: "#0891B214"
    }, "\u0E14\u0E31\u0E14\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E42\u0E14\u0E21")), React.createElement("div", {
      style: {
        borderTop: "1px dashed rgba(180,83,9,.28)",
        paddingTop: 9,
        marginTop: 1
      }
    }, React.createElement(NumRange, {
      span: true,
      label: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23 (\u0E22\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E38\u0E01\u0E1C\u0E37\u0E19\u0E02\u0E36\u0E49\u0E19\u0E08\u0E32\u0E01\u0E1E\u0E37\u0E49\u0E19 + \u0E1C\u0E19\u0E31\u0E07)",
      value: Math.round((+st.buildH || 0) * 10) / 10,
      min: 0,
      max: 20,
      step: 0.5,
      suffix: "\u0E21.",
      onChange: v => set({
        buildH: v
      })
    })));
  })()), React.createElement("button", {
    className: "p3-b soft w",
    onClick: () => setTab("panel"),
    style: {
      padding: "10px 12px",
      fontSize: 12.5,
      justifyContent: "flex-start"
    }
  }, React.createElement(P3Icon, {
    name: "grid",
    size: 15
  }), "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E1A\u0E19\u0E1C\u0E37\u0E19\u0E19\u0E35\u0E49", React.createElement("b", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, gridSel ? gridSel.count : 0, " \u0E41\u0E1C\u0E07", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  }))), (st.roofs || []).length > 1 && React.createElement("div", {
    style: {
      borderTop: "1px dashed var(--border-strong)",
      paddingTop: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, roof.grp ? React.createElement(React.Fragment, null, React.createElement("span", {
    title: "\u0E25\u0E32\u0E01\u0E1C\u0E37\u0E19\u0E44\u0E2B\u0E19\u0E01\u0E47\u0E22\u0E49\u0E32\u0E22\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: grpColor(roof.grp)
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: grpColor(roof.grp)
    }
  }), grpLabel(roof.grp), " \xB7 ", grpSize(roof.grp), " \u0E1C\u0E37\u0E19"), React.createElement("button", {
    className: "p3-lnk",
    onClick: leaveGrp
  }, "\u0E41\u0E22\u0E01\u0E1C\u0E37\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01")) : React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21"), React.createElement("button", {
    className: "p3-chip",
    "data-on": grpOpen ? "1" : "0",
    onClick: () => setGrpOpen(!grpOpen),
    style: {
      marginLeft: "auto",
      padding: "4px 10px",
      fontSize: 11
    }
  }, React.createElement(P3Icon, {
    name: "link",
    size: 12
  }), roof.grp ? "แก้สมาชิก" : "จัดกลุ่ม", React.createElement("span", {
    style: {
      display: "grid",
      transform: grpOpen ? "rotate(180deg)" : "none",
      transition: "transform .18s ease"
    }
  }, React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "m4 6.4 4 4 4-4"
  }))))), grpOpen && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 7
    }
  }, "\u0E41\u0E15\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E37\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E27\u0E21/\u0E41\u0E22\u0E01 \xB7 \u0E1C\u0E37\u0E19\u0E43\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E25\u0E32\u0E01\u0E17\u0E35\u0E40\u0E14\u0E35\u0E22\u0E27\u0E44\u0E1B\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E01\u0E49\u0E2D\u0E19"), React.createElement("div", {
    style: {
      display: grpOpen ? "flex" : "none",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 6
    }
  }, (st.roofs || []).filter(r => r.id !== roof.id).map(r => {
    const inGrp = !!roof.grp && r.grp === roof.grp;
    return React.createElement("button", {
      key: r.id,
      onClick: () => {
        const gid = roof.grp || p3Id("g");
        const ups = {};
        if (inGrp) {
          ups[r.id] = {
            grp: null
          };
          const left = (st.roofs || []).filter(x => x.grp === gid && x.id !== r.id);
          if (left.length < 2) left.forEach(x => {
            ups[x.id] = {
              grp: null
            };
          });
        } else {
          ups[roof.id] = {
            grp: gid
          };
          ups[r.id] = {
            grp: gid
          };
        }
        patchRoofs(ups);
      },
      className: "p3-chip",
      style: {
        padding: "5px 10px",
        fontSize: 11.5,
        borderColor: inGrp ? grpColor(roof.grp) : "var(--ln2)",
        background: inGrp ? grpColor(roof.grp) + "16" : "var(--surface)",
        color: inGrp ? grpColor(roof.grp) : "var(--text-3)"
      }
    }, r.grp && !inGrp && React.createElement("span", {
      className: "dot",
      style: {
        width: 6,
        height: 6,
        background: grpColor(r.grp)
      }
    }), React.createElement(P3Icon, {
      name: inGrp ? "check" : "plus",
      size: 12,
      w: 2
    }), React.createElement("span", null, r.name));
  }), roof.grp && grpSize(roof.grp) > 1 && React.createElement("button", {
    className: "p3-chip",
    onClick: () => {
      const ups = {};
      (st.roofs || []).filter(r => r.grp === roof.grp).forEach(r => {
        ups[r.id] = {
          grp: null
        };
      });
      patchRoofs(ups);
    },
    style: {
      padding: "5px 10px",
      fontSize: 11.5,
      borderStyle: "dashed",
      background: "none",
      color: "var(--tint-red-tx)"
    }
  }, "\u0E41\u0E22\u0E01\u0E17\u0E31\u0E49\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21"))), (st.roofs || []).length > 1 && (delAsk === roof.id ? React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      alignItems: "center",
      flexWrap: "wrap",
      border: "1px solid rgba(185,28,28,.3)",
      background: "rgba(185,28,28,.05)",
      borderRadius: 11,
      padding: "9px 10px"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--tint-red-tx)",
      marginRight: "auto"
    }
  }, "\u0E25\u0E1A \u201C", roof.name, "\u201D ?"), React.createElement(SmallBtn, {
    cls: "dngr solid",
    onClick: () => {
      let rs = st.roofs.filter(r => r.id !== roof.id);
      if (roof.grp && rs.filter(r => r.grp === roof.grp).length < 2) rs = rs.map(r => r.grp === roof.grp ? Object.assign({}, r, {
        grp: null
      }) : r);
      set({
        roofs: rs
      });
      setSelRoof(rs[0] ? rs[0].id : null);
      setDelAsk(null);
    }
  }, "\u0E25\u0E1A\u0E40\u0E25\u0E22"), React.createElement(SmallBtn, {
    onClick: () => setDelAsk(null)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement(SmallBtn, {
    cls: "dngr",
    icon: "trash",
    onClick: () => setDelAsk(roof.id)
  }, "\u0E25\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E1C\u0E37\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    className: "p3-note"
  }, "\u0E25\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E49\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19"))), tab === "panel" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, !roof ? React.createElement("div", {
    className: "p3-card",
    style: {
      alignItems: "center",
      textAlign: "center",
      padding: "22px 16px",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 13,
      background: "var(--surface2)",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)"
    }
  }, React.createElement(P3Icon, {
    name: "grid",
    size: 20
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"), React.createElement("span", {
    className: "p3-note",
    style: {
      maxWidth: 230
    }
  }, "\u0E41\u0E15\u0E30\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E43\u0E19\u0E20\u0E32\u0E1E \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E37\u0E19\u0E08\u0E32\u0E01\u0E41\u0E17\u0E47\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07"), React.createElement("button", {
    className: "p3-b soft",
    onClick: () => setTab("roof")
  }, React.createElement(P3Icon, {
    name: "roof",
    size: 14
  }), "\u0E44\u0E1B\u0E41\u0E17\u0E47\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32")) : (() => {
    const blks = p3Blocks(roof);
    const bi = Math.min(selBlk, blks.length - 1);
    const B = blks[bi];
    const per = gridSel && gridSel.perBlk && gridSel.perBlk[bi] || {
      maxRows: 0,
      maxCols: 0,
      count: 0
    };
    const nSkip = Object.keys(B.skips || {}).length,
      nAdd = Object.keys(B.adds || {}).length;
    const pdB = p3BlkPD(B);
    const nCol = B.cols > 0 ? Math.min(B.cols, per.maxCols) : per.maxCols;
    const nRow = B.rows > 0 ? Math.min(B.rows, per.maxRows) : per.maxRows;
    const grpN = (B.gc > 0 ? Math.ceil(nCol / B.gc) : 1) * (B.gr > 0 ? Math.ceil(nRow / B.gr) : 1);
    return React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, React.createElement(P3Icon, {
      name: roof.kind === "dome" ? "dome" : roof.kind === "gable" || roof.kind === "hip" ? "roof" : "layers",
      size: 14
    }), React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, roof.name)), React.createElement("span", {
      style: {
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "baseline",
        gap: 4,
        whiteSpace: "nowrap"
      }
    }, React.createElement("b", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        color: "var(--primary-dark)",
        letterSpacing: "-.3px"
      }
    }, gridSel ? gridSel.count : 0), React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, "\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E37\u0E19\u0E19\u0E35\u0E49"))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, blks.map((b, i) => React.createElement("button", {
      key: b.id,
      className: "p3-chip",
      "data-on": i === bi ? "1" : "0",
      onClick: () => setSelBlk(i)
    }, React.createElement(P3Icon, {
      name: "grid",
      size: 12
    }), "\u0E0A\u0E38\u0E14 ", i + 1, gridSel && gridSel.perBlk && gridSel.perBlk[i] ? React.createElement("b", {
      style: {
        fontWeight: 800
      }
    }, gridSel.perBlk[i].count) : null)), React.createElement(SmallBtn, {
      cls: "dashed",
      icon: "plus",
      onClick: () => {
        const bs = blkStore(roof);
        bs.push(p3NewBlk(bs.length));
        patchRoof(roof.id, {
          blocks: bs
        });
        setSelBlk(bs.length - 1);
      }
    }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E38\u0E14"), blks.length > 1 && React.createElement(SmallBtn, {
      cls: "dngr",
      icon: "trash",
      onClick: () => {
        const bs = blkStore(roof);
        bs.splice(bi, 1);
        patchRoof(roof.id, {
          blocks: bs
        });
        setSelBlk(Math.max(0, bi - 1));
      }
    }, "\u0E25\u0E1A\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49")), React.createElement("div", {
      className: "p3-card"
    }, React.createElement("span", {
      className: "p3-eb"
    }, "\u0E0A\u0E38\u0E14 ", bi + 1, React.createElement("span", {
      className: "ln"
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, ["portrait", "landscape"].map(o => React.createElement("button", {
      key: o,
      className: "p3-chip",
      "data-on": B.orient === o ? "1" : "0",
      onClick: () => patchBlk(roof, bi, {
        orient: o,
        skips: {},
        adds: {}
      }),
      style: {
        flex: 1,
        justifyContent: "center",
        borderRadius: 9,
        padding: "7px 4px",
        fontSize: 12
      }
    }, React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6"
    }, o === "portrait" ? React.createElement("rect", {
      x: "5",
      y: "2.2",
      width: "6",
      height: "11.6",
      rx: "1"
    }) : React.createElement("rect", {
      x: "2.2",
      y: "5",
      width: "11.6",
      height: "6",
      rx: "1"
    })), o === "portrait" ? "แนวตั้ง" : "แนวนอน"))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 9
      }
    }, React.createElement(Num, {
      label: "แถว (สูงสุด " + per.maxRows + ") 0=เต็ม",
      value: B.rows,
      step: 1,
      min: 0,
      onChange: v => patchBlk(roof, bi, {
        rows: v,
        adds: {}
      })
    }), React.createElement(Num, {
      label: "คอลัมน์ (สูงสุด " + per.maxCols + ") 0=เต็ม",
      value: B.cols,
      step: 1,
      min: 0,
      onChange: v => patchBlk(roof, bi, {
        cols: v,
        adds: {}
      })
    }), React.createElement(Num, {
      label: "\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07\u0E41\u0E1C\u0E07",
      value: B.gap,
      step: 0.01,
      min: 0,
      suffix: "\u0E21.",
      onChange: v => patchBlk(roof, bi, {
        gap: v
      })
    }), React.createElement(Num, {
      label: "\u0E23\u0E30\u0E22\u0E30\u0E02\u0E2D\u0E1A\u0E01\u0E31\u0E19\u0E15\u0E01 (\u0E17\u0E31\u0E49\u0E07\u0E1C\u0E37\u0E19)",
      value: roof.margin,
      step: 0.05,
      min: 0,
      suffix: "\u0E21.",
      onChange: v => patchRoof(roof.id, {
        margin: v
      })
    })), React.createElement(NumRange, {
      span: true,
      label: isDome ? "เลื่อนตามแนวสันโดม (+ ไปทางขวา)" : "เลื่อนซ้าย–ขวา (+ ขวา)",
      value: Math.round(B.du * 100) / 100,
      step: 0.1,
      min: -25,
      max: 25,
      suffix: "\u0E21.",
      onChange: v => patchBlk(roof, bi, {
        du: v
      })
    }), React.createElement(NumRange, {
      span: true,
      label: isDome ? "เลื่อนไปตามส่วนโค้ง" : "เลื่อนขึ้น–ลงตามลาด (+ ขึ้นไปทางสัน)",
      value: Math.round(B.dv * 100) / 100,
      step: 0.1,
      min: -25,
      max: 25,
      suffix: "\u0E21.",
      onChange: v => patchBlk(roof, bi, {
        dv: v
      })
    }), !isDome && React.createElement(NumRange, {
      span: true,
      label: "\u0E2B\u0E21\u0E38\u0E19\u0E0A\u0E38\u0E14\u0E41\u0E1C\u0E07 (\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E1C\u0E37\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32)",
      value: B.rot,
      step: 1,
      min: -90,
      max: 90,
      suffix: "\xB0",
      onChange: v => patchBlk(roof, bi, {
        rot: v
      })
    }), !isDome && React.createElement("div", {
      style: {
        display: "flex",
        gap: 7,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, blks.length > 1 && React.createElement("button", {
      className: "p3-lnk",
      onClick: () => patchAllBlk(roof, {
        rot: B.rot
      })
    }, "\u0E43\u0E0A\u0E49\u0E21\u0E38\u0E21\u0E19\u0E35\u0E49\u0E01\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E0A\u0E38\u0E14"), React.createElement("button", {
      className: "p3-lnk",
      onClick: () => patchBlk(roof, bi, {
        rot: 0
      })
    }, "\u0E15\u0E31\u0E49\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E1C\u0E37\u0E19 (0\xB0)")), !isDome && React.createElement(React.Fragment, null, React.createElement("span", {
      className: "p3-eb",
      style: {
        marginTop: 2
      }
    }, React.createElement(P3Icon, {
      name: "grid",
      size: 12
    }), "\u0E23\u0E39\u0E1B\u0E17\u0E23\u0E07\u0E02\u0E2D\u0E07\u0E0A\u0E38\u0E14\u0E41\u0E1C\u0E07", React.createElement("span", {
      className: "ln"
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 7
      }
    }, [{
      k: false,
      th: "ตัดตามขอบหลังคา",
      d: "วางเต็มเท่าที่ผืนรับได้"
    }, {
      k: true,
      th: "สี่เหลี่ยมตรง",
      d: "ทุกแถวยาวเท่ากัน"
    }].map(o => React.createElement("button", {
      key: String(o.k),
      className: "p3-chip",
      "data-on": !!B.keep === o.k ? "1" : "0",
      onClick: () => patchBlk(roof, bi, {
        keep: o.k
      }),
      style: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1,
        borderRadius: 9,
        padding: "7px 9px",
        fontSize: 12,
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, o.th), React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 600,
        opacity: 0.72
      }
    }, o.d))))), !isDome && B.rot !== 0 && !B.keep && React.createElement("span", {
      className: "p3-note"
    }, "\u0E41\u0E1A\u0E1A\u0E15\u0E31\u0E14\u0E15\u0E32\u0E21\u0E02\u0E2D\u0E1A: \u0E2B\u0E21\u0E38\u0E19\u0E41\u0E25\u0E49\u0E27\u0E21\u0E38\u0E21\u0E01\u0E23\u0E34\u0E14\u0E22\u0E37\u0E48\u0E19\u0E1E\u0E49\u0E19\u0E02\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E25\u0E49\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E2D\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30\u0E0A\u0E48\u0E2D\u0E07 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27\u0E40\u0E25\u0E22\u0E22\u0E32\u0E27\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E31\u0E49\u0E19\u0E1A\u0E31\u0E19\u0E44\u0E14 \u2014 \u0E16\u0E49\u0E32\u0E2D\u0E22\u0E32\u0E01\u0E44\u0E14\u0E49\u0E41\u0E16\u0E27\u0E15\u0E23\u0E07\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E2B\u0E21\u0E14 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E15\u0E23\u0E07\u201D"), !isDome && B.keep && React.createElement("span", {
      className: "p3-note"
    }, "\u0E41\u0E1A\u0E1A\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E15\u0E23\u0E07: \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E35\u0E48\u0E22\u0E21\u0E1C\u0E37\u0E19\u0E43\u0E2B\u0E0D\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E41\u0E1C\u0E07 \u0E2B\u0E21\u0E38\u0E19\u0E01\u0E35\u0E48\u0E2D\u0E07\u0E28\u0E32\u0E01\u0E47\u0E44\u0E14\u0E49\u0E41\u0E16\u0E27\u0E15\u0E23\u0E07\u0E40\u0E2A\u0E21\u0E2D \xB7 \u0E16\u0E49\u0E32\u0E44\u0E14\u0E49\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E2B\u0E25\u0E32\u0E22\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E0A\u0E38\u0E14\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \xB7 \u0E43\u0E2A\u0E48\u0E41\u0E16\u0E27/\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E16\u0E49\u0E32\u0E2D\u0E22\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E25\u0E47\u0E01\u0E01\u0E27\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"), React.createElement("span", {
      className: "p3-eb",
      style: {
        marginTop: 2
      }
    }, React.createElement(P3Icon, {
      name: "grid",
      size: 12
    }), "\u0E41\u0E1A\u0E48\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21 & \u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19", React.createElement("span", {
      className: "ln"
    }), React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, grpN > 1 ? grpN + " กลุ่ม" : "ยังไม่แบ่ง")), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 9
      }
    }, React.createElement(Num, {
      label: "\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C/\u0E01\u0E25\u0E38\u0E48\u0E21 0=\u0E44\u0E21\u0E48\u0E41\u0E1A\u0E48\u0E07",
      value: B.gc,
      step: 1,
      min: 0,
      onChange: v => patchBlk(roof, bi, {
        gc: v,
        adds: {}
      })
    }), React.createElement(Num, {
      label: "\u0E41\u0E16\u0E27/\u0E01\u0E25\u0E38\u0E48\u0E21 0=\u0E44\u0E21\u0E48\u0E41\u0E1A\u0E48\u0E07",
      value: B.gr,
      step: 1,
      min: 0,
      onChange: v => patchBlk(roof, bi, {
        gr: v,
        adds: {}
      })
    }), React.createElement(Num, {
      label: "\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21",
      value: B.gg,
      step: 0.05,
      min: 0,
      suffix: "\u0E21.",
      onChange: v => patchBlk(roof, bi, {
        gg: v,
        adds: {}
      })
    })), React.createElement("span", {
      className: "p3-note"
    }, "\u0E41\u0E1A\u0E48\u0E07\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E2D\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E22\u0E48\u0E2D\u0E22\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E27\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \u2014 \u0E14\u0E35\u0E01\u0E27\u0E48\u0E32\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2B\u0E25\u0E32\u0E22\u0E0A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27\u0E21\u0E32\u0E44\u0E25\u0E48\u0E08\u0E31\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E2D\u0E07 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E17\u0E38\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E41\u0E19\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E40\u0E2A\u0E21\u0E2D \u0E2B\u0E21\u0E38\u0E19\u0E17\u0E35\u0E40\u0E14\u0E35\u0E22\u0E27\u0E2B\u0E21\u0E38\u0E19\u0E15\u0E32\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14", B.gg <= 0 && (B.gc > 0 || B.gr > 0) ? " · ตอนนี้ทางเดินเป็น 0 ม. ต้องใส่ระยะด้วยถึงจะเห็นช่อง" : ""), !isDome && React.createElement(NumRange, {
      span: true,
      label: "\u0E02\u0E32\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2D\u0E35\u0E22\u0E07 (\u0E22\u0E01\u0E41\u0E1C\u0E07\u0E08\u0E32\u0E01\u0E1C\u0E34\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32)",
      value: B.tilt,
      step: 1,
      min: 0,
      max: 45,
      suffix: "\xB0",
      onChange: v => patchBlk(roof, bi, {
        tilt: v
      })
    }), isDome && React.createElement("span", {
      className: "p3-note"
    }, "\u0E42\u0E14\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E34\u0E27\u0E42\u0E04\u0E49\u0E07 \u2014 \u0E41\u0E1C\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E19\u0E1A\u0E42\u0E04\u0E49\u0E07 \u0E08\u0E36\u0E07\u0E2B\u0E21\u0E38\u0E19\u0E0A\u0E38\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E2A\u0E48\u0E02\u0E32\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"), !isDome && B.tilt > 0 && (() => {
      const need = Math.round((pdB * Math.cos(B.tilt * P3_DEG) + pdB * Math.sin(B.tilt * P3_DEG) / Math.tan(30 * P3_DEG)) * 100) / 100;
      const now = Math.round((pdB + B.gap) * 100) / 100;
      return React.createElement("div", {
        style: {
          fontSize: 11,
          lineHeight: 1.6,
          borderRadius: 10,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          color: now + 1e-9 >= need ? "var(--text-3)" : "var(--tint-amber-tx)",
          background: now + 1e-9 >= need ? "var(--surface2)" : "rgba(245,158,11,.12)",
          border: "1px solid " + (now + 1e-9 >= need ? "transparent" : "rgba(180,83,9,.25)")
        }
      }, React.createElement("span", null, "\u0E40\u0E2D\u0E35\u0E22\u0E07 ", B.tilt, "\xB0 \xB7 \u0E23\u0E30\u0E22\u0E30\u0E41\u0E16\u0E27\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", null, now, " \u0E21."), " \xB7 \u0E01\u0E31\u0E19\u0E40\u0E07\u0E32\u0E41\u0E16\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E27\u0E23 \u2265 ", React.createElement("b", null, need, " \u0E21.")), now + 1e-9 < need && React.createElement("button", {
        className: "p3-lnk",
        style: {
          marginLeft: "auto",
          color: "var(--tint-amber-tx)",
          borderColor: "rgba(180,83,9,.4)"
        },
        onClick: () => patchBlk(roof, bi, {
          gap: Math.round((need - pdB) * 100) / 100
        })
      }, "\u0E15\u0E31\u0E49\u0E07\u0E43\u0E2B\u0E49\u0E1E\u0E2D\u0E14\u0E35"));
    })()), React.createElement("div", {
      className: "p3-card" + (addMode ? " tint" : ""),
      style: addMode ? {
        borderColor: "var(--ac)"
      } : null
    }, React.createElement("button", {
      className: "p3-b w " + (addMode ? "pri" : ""),
      onClick: () => setAddMode(!addMode),
      style: {
        padding: "9px 10px",
        fontSize: 12.5,
        fontWeight: 700
      }
    }, React.createElement(P3Icon, {
      name: addMode ? "check" : "plus",
      size: 14
    }), addMode ? "กำลังเพิ่มแผงเอง — แตะช่องเขียวในภาพ" : "แตะเพิ่มแผงเอง"), React.createElement("span", {
      className: "p3-note"
    }, "\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48 = \u0E40\u0E27\u0E49\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 (\u0E41\u0E1C\u0E07\u0E08\u0E32\u0E07 \u0E41\u0E15\u0E30\u0E0B\u0E49\u0E33\u0E43\u0E2A\u0E48\u0E04\u0E37\u0E19) \xB7 \u0E40\u0E1B\u0E34\u0E14\u0E42\u0E2B\u0E21\u0E14\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E27\u0E32\u0E07\u0E44\u0E14\u0E49\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E23\u0E2D\u0E1A\u0E40\u0E02\u0E35\u0E22\u0E27\u0E08\u0E32\u0E07 \u0E46 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E15\u0E34\u0E21\u0E41\u0E1C\u0E07\u0E19\u0E2D\u0E01\u0E01\u0E23\u0E2D\u0E1A\u0E41\u0E16\u0E27/\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E44\u0E14\u0E49"), (nSkip > 0 || nAdd > 0) && React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap"
      }
    }, nSkip > 0 && React.createElement(SmallBtn, {
      icon: "reset",
      onClick: () => patchBlk(roof, bi, {
        skips: {}
      })
    }, "\u0E43\u0E2A\u0E48\u0E04\u0E37\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E49\u0E19\u0E44\u0E27\u0E49 ", nSkip, " \u0E0A\u0E48\u0E2D\u0E07"), nAdd > 0 && React.createElement(SmallBtn, {
      icon: "reset",
      onClick: () => patchBlk(roof, bi, {
        adds: {}
      })
    }, "\u0E40\u0E2D\u0E32\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E2D\u0E07\u0E2D\u0E2D\u0E01 ", nAdd, " \u0E41\u0E1C\u0E07"))), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "stretch",
        gap: 1,
        background: "var(--ln)",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--ln)"
      }
    }, [["ชุดนี้", per.count + " แผง"], ["ทั้งผัง", total + " แผง"], ["กำลังรวม", kwp + " kWp"]].map(([k, v]) => React.createElement("div", {
      key: k,
      style: {
        flex: 1,
        background: "var(--surface)",
        padding: "9px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 2
      }
    }, React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, k), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, v)))));
  })()), tab === "obstacle" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, React.createElement("button", {
    className: "p3-b dashed w",
    style: {
      padding: "12px 8px",
      flexDirection: "column",
      gap: 5
    },
    onClick: () => {
      const o = {
        id: p3Id("o"),
        kind: "box",
        x: 6,
        z: 6,
        w: 2,
        d: 2,
        h: 3
      };
      set({
        obstacles: (st.obstacles || []).concat([o])
      });
      setSelObs(o.id);
      setSelRoof(null);
    }
  }, React.createElement(P3Icon, {
    name: "box",
    size: 18
  }), "\u0E01\u0E25\u0E48\u0E2D\u0E07 / \u0E15\u0E36\u0E01"), React.createElement("button", {
    className: "p3-b dashed w",
    style: {
      padding: "12px 8px",
      flexDirection: "column",
      gap: 5
    },
    onClick: () => {
      const o = {
        id: p3Id("o"),
        kind: "tree",
        x: -6,
        z: 6,
        w: 3,
        d: 3,
        h: 5
      };
      set({
        obstacles: (st.obstacles || []).concat([o])
      });
      setSelObs(o.id);
      setSelRoof(null);
    }
  }, React.createElement(P3Icon, {
    name: "tree",
    size: 18
  }), "\u0E15\u0E49\u0E19\u0E44\u0E21\u0E49")), (st.obstacles || []).length === 0 && React.createElement("div", {
    className: "p3-note",
    style: {
      textAlign: "center",
      padding: "14px 10px",
      background: "var(--surface2)",
      borderRadius: 12
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E15\u0E36\u0E01\u0E02\u0E49\u0E32\u0E07\u0E40\u0E04\u0E35\u0E22\u0E07 / \u0E16\u0E31\u0E07\u0E19\u0E49\u0E33 / \u0E15\u0E49\u0E19\u0E44\u0E21\u0E49 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E40\u0E07\u0E32\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E41\u0E1C\u0E07"), obs && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p3-card",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 9
    }
  }, React.createElement(Num, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07",
    value: obs.w,
    step: 0.5,
    min: 0.5,
    suffix: "\u0E21.",
    onChange: v => patchObs(obs.id, {
      w: v
    })
  }), React.createElement(Num, {
    label: "\u0E25\u0E36\u0E01",
    value: obs.d,
    step: 0.5,
    min: 0.5,
    suffix: "\u0E21.",
    onChange: v => patchObs(obs.id, {
      d: v
    })
  }), React.createElement(Num, {
    label: "\u0E2A\u0E39\u0E07",
    value: obs.h,
    step: 0.5,
    min: 0.5,
    suffix: "\u0E21.",
    onChange: v => patchObs(obs.id, {
      h: v
    })
  })), obs.kind !== "tree" && React.createElement("div", {
    className: "p3-card"
  }, React.createElement(NumRange, {
    span: true,
    label: "\u0E2B\u0E21\u0E38\u0E19 (\u0E21\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 \xB7 + \u0E15\u0E32\u0E21\u0E40\u0E02\u0E47\u0E21)",
    value: +obs.rot || 0,
    step: 1,
    min: -180,
    max: 180,
    suffix: "\xB0",
    onChange: v => patchObs(obs.id, {
      rot: v
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, [0, 45, 90, 135].map(a => React.createElement("button", {
    key: a,
    className: "p3-lnk",
    onClick: () => patchObs(obs.id, {
      rot: a
    })
  }, a, "\xB0")), React.createElement("button", {
    className: "p3-lnk",
    onClick: () => patchObs(obs.id, {
      rot: Math.round((((+obs.rot || 0) + 90 + 180) % 360 + 360) % 360 - 180)
    })
  }, "\u0E2B\u0E21\u0E38\u0E19 +90\xB0")), React.createElement("span", {
    className: "p3-note"
  }, "\u0E15\u0E36\u0E01\u0E02\u0E49\u0E32\u0E07\u0E40\u0E04\u0E35\u0E22\u0E07\u0E2A\u0E48\u0E27\u0E19\u0E43\u0E2B\u0E0D\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E27\u0E32\u0E07\u0E15\u0E23\u0E07\u0E41\u0E01\u0E19\u0E40\u0E2B\u0E19\u0E37\u0E2D\u2013\u0E43\u0E15\u0E49 \u0E2B\u0E21\u0E38\u0E19\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19\u0E41\u0E25\u0E49\u0E27\u0E40\u0E07\u0E32\u0E17\u0E35\u0E48\u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E30\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07")), React.createElement(SmallBtn, {
    cls: "dngr",
    icon: "trash",
    onClick: () => {
      set({
        obstacles: st.obstacles.filter(o => o.id !== obs.id)
      });
      setSelObs(null);
    }
  }, "\u0E25\u0E1A\u0E0A\u0E34\u0E49\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    className: "p3-note"
  }, "\u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01 \xB7 \u0E25\u0E32\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E49\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07")), tab === "sun" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    className: "p3-card",
    style: {
      flexDirection: "row",
      alignItems: "center",
      gap: 13
    }
  }, React.createElement("span", {
    style: {
      position: "relative",
      width: 54,
      height: 54,
      flex: "0 0 auto"
    }
  }, React.createElement("svg", {
    width: "54",
    height: "54",
    viewBox: "0 0 54 54",
    style: {
      display: "block"
    }
  }, React.createElement("circle", {
    cx: "27",
    cy: "27",
    r: "23",
    fill: "none",
    stroke: "var(--ln)",
    strokeWidth: "2"
  }), React.createElement("path", {
    d: "M4 27a23 23 0 0 1 46 0",
    fill: "none",
    stroke: "rgba(245,158,11,.35)",
    strokeWidth: "2",
    strokeDasharray: "2 3.4"
  }), React.createElement("line", {
    x1: "7",
    y1: "27",
    x2: "47",
    y2: "27",
    stroke: "var(--ln)",
    strokeWidth: "1"
  }), React.createElement("circle", {
    cx: 27 + 20 * Math.sin((sunNow.az - 180) * P3_DEG) * Math.cos(Math.max(0, sunNow.alt) * P3_DEG),
    cy: 27 - 20 * Math.sin(Math.max(0, sunNow.alt) * P3_DEG),
    r: "5",
    fill: sunNow.alt > 0 ? "#F59E0B" : "#94A3B8"
  }))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      minWidth: 0
    }
  }, React.createElement("span", {
    className: "p3-eb"
  }, "\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E21\u0E38\u0E21\u0E40\u0E07\u0E22 ", React.createElement("b", null, Math.round(sunNow.alt), "\xB0")), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E17\u0E34\u0E28 ", React.createElement("b", null, Math.round(sunNow.az), "\xB0"))), sunNow.alt <= 0 && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19 / \u0E15\u0E01\u0E41\u0E25\u0E49\u0E27"))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement(Slider, {
    label: "\u0E40\u0E14\u0E37\u0E2D\u0E19",
    right: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][(st.sun.month || 1) - 1],
    min: 1,
    max: 12,
    step: 1,
    value: st.sun.month,
    onChange: v => setSun({
      month: v
    })
  }), React.createElement(Slider, {
    label: "\u0E40\u0E27\u0E25\u0E32",
    right: fmtHour(+st.sun.hour || 12) + " น.",
    min: 6,
    max: 18.5,
    step: 0.25,
    value: st.sun.hour,
    onChange: v => {
      setAnimating(false);
      setSun({
        hour: v
      });
    }
  }), React.createElement("button", {
    className: "p3-b w " + (animating ? "" : "pri"),
    onClick: () => setAnimating(a => !a),
    style: animating ? {
      background: "var(--tint-amber-tx)",
      borderColor: "var(--tint-amber-tx)",
      color: "#fff",
      fontWeight: 700
    } : null
  }, React.createElement(P3Icon, {
    name: animating ? "pause" : "play",
    size: 14
  }), animating ? "หยุดกวาดเงา" : "กวาดเงาทั้งวัน (06:00–18:30)")), React.createElement("button", {
    className: "p3-b w " + (showSun ? "soft" : ""),
    onClick: () => setShowSun(v => !v),
    title: "\u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E35\u0E2A\u0E49\u0E21 = \u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E0A\u0E48\u0E27\u0E07\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E08\u0E32\u0E07 = \u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E15\u0E49\u0E02\u0E2D\u0E1A\u0E1F\u0E49\u0E32 \xB7 \u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21\u0E2A\u0E2D\u0E07\u0E1B\u0E25\u0E32\u0E22 = \u0E40\u0E27\u0E25\u0E32\u0E02\u0E36\u0E49\u0E19\u2013\u0E15\u0E01",
    style: {
      justifyContent: "flex-start",
      padding: "10px 12px"
    }
  }, React.createElement(P3Icon, {
    name: "sun",
    size: 15
  }), showSun ? "ซ่อนดวงอาทิตย์ + แนวโคจร" : "แสดงดวงอาทิตย์ + แนวโคจร"), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E41\u0E25\u0E30\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 9
    }
  }, React.createElement(Num, {
    label: "\u0E25\u0E30\u0E15\u0E34\u0E08\u0E39\u0E14",
    value: st.sun.lat,
    step: 0.01,
    onChange: v => setSun({
      lat: v
    })
  }), React.createElement(Num, {
    label: "\u0E25\u0E2D\u0E07\u0E08\u0E34\u0E08\u0E39\u0E14",
    value: st.sun.lng,
    step: 0.01,
    onChange: v => setSun({
      lng: v
    })
  })), React.createElement(Num, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 (Wp/\u0E41\u0E1C\u0E07)",
    value: st.wp,
    step: 5,
    min: 100,
    suffix: "W",
    onChange: v => set({
      wp: v
    })
  }))));
  return React.createElement("div", {
    className: "p3",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 120,
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement("style", null, P3_CSS), mapOpen && React.createElement(P3MapPicker, {
    initial: jobLatLng,
    initialQuery: jobAddr,
    onPick: onPickMap,
    onClose: () => setMapOpen(false)
  }), sysOpen && typeof SolarWorkspace === "function" && React.createElement(SolarWorkspace, {
    job: job,
    st: st,
    sys: st.sys || scBlankSys(),
    onClose: () => setSysOpen(false),
    snap: () => {
      const t = tRef.current;
      if (!t.renderer || !t.scene || !t.camera) return null;
      try {
        t.renderer.render(t.scene, t.camera);
        return t.renderer.domElement.toDataURL("image/jpeg", 0.86);
      } catch (e) {
        return null;
      }
    },
    onChange: s => {
      const wp = scNum((scPanelSpec(s) || {}).wp, 0);
      set(wp ? {
        sys: s,
        wp: wp
      } : {
        sys: s
      });
    }
  }), React.createElement("div", {
    className: "p3-head",
    style: {
      padding: isMobile ? "9px 12px" : "11px 18px"
    }
  }, React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "var(--primary-dark)"
    }
  }, React.createElement(P3Icon, {
    name: "grid",
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".14em",
      color: "var(--text-3)",
      textTransform: "uppercase"
    }
  }, "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 3D", job && job.code ? " · " + job.code : ""), React.createElement("div", {
    style: {
      fontSize: isMobile ? 13 : 14.5,
      fontWeight: 700,
      letterSpacing: "-.1px",
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, job ? job.name : "")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 10 : 14,
      flexShrink: 0
    }
  }, React.createElement("span", {
    className: "p3-kpi"
  }, React.createElement("span", {
    className: "n"
  }, total), React.createElement("span", {
    className: "u"
  }, "\u0E41\u0E1C\u0E07")), React.createElement("span", {
    style: {
      width: 1,
      height: 22,
      background: "var(--ln)"
    }
  }), React.createElement("span", {
    className: "p3-kpi"
  }, React.createElement("span", {
    className: "n"
  }, kwp), React.createElement("span", {
    className: "u"
  }, "kWp")), job && job.panels ? (() => {
    const goal = +job.panels;
    const done = total >= goal;
    const pct = Math.max(0, Math.min(100, total / Math.max(1, goal) * 100));
    return React.createElement("span", {
      style: {
        display: isMobile ? "none" : "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 96
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, React.createElement("span", null, "\u0E40\u0E1B\u0E49\u0E32 ", React.createElement("b", {
      style: {
        color: "var(--text-2)",
        fontWeight: 800
      }
    }, goal), " \u0E41\u0E1C\u0E07"), React.createElement("span", {
      style: {
        color: done ? "var(--primary-dark)" : "var(--tint-amber-tx)",
        fontWeight: 800,
        whiteSpace: "nowrap"
      }
    }, done ? total > goal ? "เกิน " + (total - goal) : "ครบ" : "ขาด " + (goal - total))), React.createElement("span", {
      style: {
        height: 3,
        borderRadius: 99,
        background: "var(--surface3)",
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: pct + "%",
        borderRadius: 99,
        background: done ? "var(--primary)" : "#F59E0B",
        transition: "width .35s ease"
      }
    })));
  })() : null), React.createElement("button", {
    className: "ghost",
    onClick: tryClose,
    title: "\u0E1B\u0E34\u0E14\u0E42\u0E2B\u0E21\u0E14 3D"
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: isMobile ? "column" : "row"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      position: "relative",
      background: "#dce8f2"
    }
  }, React.createElement("div", {
    ref: mountRef,
    style: {
      position: "absolute",
      inset: 0
    }
  }), !ready && !loadErr && React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E42\u0E2B\u0E21\u0E14 3D\u2026"), loadErr && React.createElement("div", {
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
  }, loadErr, React.createElement("br", null), "\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E40\u0E23\u0E19\u0E40\u0E14\u0E2D\u0E23\u0E4C 3D"), React.createElement("div", {
    style: {
      position: "absolute",
      top: 10,
      left: 10,
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      maxWidth: "calc(100% - 20px)"
    }
  }, React.createElement("div", {
    className: "p3-tools"
  }, [["3D", "cube", !view2D, view3d, "หมุนดูรอบด้านได้"], ["2D", "plan", view2D, viewTop, "ล็อกมองจากด้านบนอย่างเดียว — หมุนไม่ได้ ลากเพื่อเลื่อนผัง"]].map(([lb, ic, on, fn, tip]) => React.createElement("button", {
    key: lb,
    className: "p3-tool",
    onClick: fn,
    title: tip,
    "data-on": on ? "1" : "0",
    style: {
      letterSpacing: ".3px"
    }
  }, React.createElement(P3Icon, {
    name: ic
  }), lb)), React.createElement("span", {
    className: "p3-vr"
  }), React.createElement(IconBtn, {
    icon: "nodes",
    label: isMobile ? "" : "จุด",
    on: showVerts,
    onClick: () => setShowVerts(v => !v),
    title: showVerts ? "ซ่อนจุดมุมหลังคา" : "แสดงจุดมุมหลังคา (ใช้แก้ทรง)"
  }), React.createElement(IconBtn, {
    icon: locked ? "lock" : "unlock",
    label: isMobile ? "" : "ล็อก",
    on: locked,
    tone: "warn",
    onClick: () => setLocked(v => !v),
    title: locked ? "ล็อกตัวบ้านอยู่ — หลังคา/มุม/สิ่งบดบัง ขยับไม่ได้ · แผงยังจัดได้ตามปกติ" : "ล็อกตัวบ้านกันเผลอลาก (ยังจัดแผงได้)"
  }), React.createElement("span", {
    className: "p3-vr"
  }), React.createElement(IconBtn, {
    icon: lightMode === "sun" ? "sunShadow" : lightMode === "noshadow" ? "sun" : "bulb",
    label: isMobile ? "" : lightMode === "sun" ? "แดด+เงา" : lightMode === "noshadow" ? "ไม่มีเงา" : "แสงแบน",
    on: lightMode !== "sun",
    title: "\u0E01\u0E14\u0E27\u0E19\u0E42\u0E2B\u0E21\u0E14\u0E41\u0E2A\u0E07: \u0E41\u0E14\u0E14\u0E08\u0E23\u0E34\u0E07+\u0E40\u0E07\u0E32 \u2192 \u0E41\u0E14\u0E14\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E07\u0E32 \u2192 \u0E41\u0E2A\u0E07\u0E41\u0E1A\u0E19\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E1C\u0E31\u0E07",
    onClick: () => setLightMode(v => v === "sun" ? "noshadow" : v === "noshadow" ? "flat" : "sun")
  }), st.photo && React.createElement(IconBtn, {
    icon: "image",
    label: isMobile ? "" : "รูป",
    on: photoEdit,
    tone: "info",
    title: photoEdit ? "กำลังปรับรูปโดรน (ลาก/หมุน/ย่อขยายบนภาพ)" : "ปรับรูปโดรนบนภาพ",
    onClick: () => {
      const n = !photoEdit;
      setPhotoEdit(n);
      if (n) {
        setLocked(false);
        setDrawing(false);
        viewTop();
      }
    }
  }))), photoEdit && React.createElement("div", {
    style: {
      position: "absolute",
      top: 54,
      left: 10,
      right: 10,
      background: "#1D4ED8",
      color: "#fff",
      borderRadius: 13,
      padding: "9px 10px 9px 13px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      boxShadow: "0 14px 32px -14px rgba(29,78,216,.75)"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, React.createElement(P3Icon, {
    name: "image",
    size: 14
  }), "\u0E1B\u0E23\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19"), React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: 0.9,
      lineHeight: 1.45
    }
  }, "\u0E25\u0E32\u0E01\u0E01\u0E25\u0E32\u0E07\u0E23\u0E39\u0E1B = \u0E22\u0E49\u0E32\u0E22 \xB7 \u0E25\u0E32\u0E01", React.createElement("b", null, "\u0E08\u0E38\u0E14\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19\u0E21\u0E38\u0E21"), " = \u0E22\u0E48\u0E2D/\u0E02\u0E22\u0E32\u0E22 \xB7 \u0E25\u0E32\u0E01", React.createElement("b", null, "\u0E08\u0E38\u0E14\u0E2A\u0E49\u0E21"), " = \u0E2B\u0E21\u0E38\u0E19 (\u0E01\u0E14 Shift \u0E25\u0E47\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30 15\xB0)"), React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      marginLeft: "auto",
      whiteSpace: "nowrap",
      background: "rgba(255,255,255,.15)",
      padding: "4px 9px",
      borderRadius: 99
    }
  }, (+st.photoW || 30).toFixed(1), " \u0E21. \xB7 ", Math.round(st.photoRot || 0), "\xB0"), React.createElement("button", {
    onClick: () => set({
      photoRot: 0,
      photoX: 0,
      photoZ: 0
    }),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid rgba(255,255,255,.45)",
      background: "transparent",
      color: "#fff",
      fontWeight: 700,
      fontSize: 11.5,
      whiteSpace: "nowrap"
    }
  }, React.createElement(P3Icon, {
    name: "reset",
    size: 13
  }), "\u0E01\u0E25\u0E32\u0E07\u0E1C\u0E31\u0E07"), React.createElement("button", {
    onClick: () => setPhotoEdit(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "6px 13px",
      borderRadius: 9,
      border: "none",
      background: "#fff",
      color: "#1D4ED8",
      fontWeight: 800,
      fontSize: 11.5
    }
  }, React.createElement(P3Icon, {
    name: "check",
    size: 13
  }), "\u0E40\u0E2A\u0E23\u0E47\u0E08")), drawing && React.createElement("div", {
    className: "p3-tools",
    style: {
      position: "absolute",
      top: 10,
      left: "50%",
      transform: "translateX(-50%)",
      gap: 6,
      padding: "5px 5px 5px 12px"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      fontWeight: 700,
      color: "var(--ink)",
      whiteSpace: "nowrap"
    }
  }, React.createElement(P3Icon, {
    name: "pencil",
    size: 14
  }), "\u0E04\u0E25\u0E34\u0E01\u0E27\u0E32\u0E07\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32", React.createElement("b", {
    style: {
      fontWeight: 800,
      color: "var(--acd)"
    }
  }, drawPts.length, " \u0E08\u0E38\u0E14")), React.createElement("span", {
    className: "p3-vr"
  }), React.createElement("button", {
    className: "p3-b sm pri",
    onClick: finishDraw,
    disabled: drawPts.length < 3,
    style: {
      whiteSpace: "nowrap"
    }
  }, React.createElement(P3Icon, {
    name: "check",
    size: 13
  }), "\u0E08\u0E1A\u0E23\u0E39\u0E1B"), React.createElement("button", {
    className: "p3-b sm dngr",
    onClick: cancelDraw
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 10,
      left: 10,
      right: 10,
      display: "flex",
      pointerEvents: "none"
    }
  }, React.createElement("span", {
    className: "p3-hint",
    style: {
      flexWrap: "wrap",
      rowGap: 3
    }
  }, (drawing ? [["คลิก", "วางจุด"], [view2D ? "ลาก" : "ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["ลากแล้วปล่อย", "ไม่วางจุด"]] : locked ? [["สถานะ", "ล็อกตัวบ้านไว้ — จัดแผงได้"], ["ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["แตะแผง", "เว้นช่อง"], ["ลากจุดน้ำเงิน", "ย้าย/ย่อขยายชุดแผง"]] : tab === "panel" ? [["สถานะ", "ล็อกตัวบ้านไว้"], ["ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["แตะแผง", "เว้นช่อง"], ["ลากจุดน้ำเงิน", "ย้าย/ย่อขยายชุดแผง"]] : view2D ? [["ลาก", "เลื่อนผัง"], ["ล้อ/บีบ", "ซูม"], ["แตะแผง", "เว้นช่อง"], ["ลากหลังคา", "ย้าย"]] : [["ลาก", "หมุน"], ["ล้อ/บีบ", "ซูม"], ["คลิกขวา/2 นิ้ว", "เลื่อน"], ["แตะแผง", "เว้นช่อง"], ["ลากหลังคา", "ย้าย"]]).map(([k, v], i) => React.createElement(React.Fragment, {
    key: k + i
  }, i > 0 && React.createElement("span", {
    style: {
      opacity: 0.3
    }
  }, "\xB7"), React.createElement("span", null, React.createElement("em", null, k), " ", v)))))), React.createElement("div", {
    className: "p3-rail",
    style: {
      width: isMobile ? "100%" : 332,
      flexShrink: 0,
      maxHeight: isMobile ? "46%" : "none",
      overflowY: "auto",
      borderLeft: isMobile ? "none" : "1px solid var(--border)",
      borderTop: isMobile ? "1px solid var(--border)" : "none",
      background: "var(--surface)",
      padding: isMobile ? 12 : "14px 14px 22px"
    }
  }, panelBody)), React.createElement("div", {
    style: {
      paddingTop: 9,
      paddingLeft: isMobile ? 12 : 18,
      paddingRight: isMobile ? 12 : 18,
      paddingBottom: "calc(9px + env(safe-area-inset-bottom,0px))",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: doPng,
    title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E1E\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D 3D \u0E40\u0E1B\u0E47\u0E19\u0E44\u0E1F\u0E25\u0E4C PNG"
  }, React.createElement(P3Icon, {
    name: "camera",
    size: 14
  }), "\u0E20\u0E32\u0E1E PNG"), React.createElement("button", {
    className: "p3-b",
    onClick: () => setSysOpen(true),
    disabled: !total,
    title: total ? "เลือกแผง/อินเวอร์เตอร์ จัดสตริง และคำนวณผลผลิตจากมุมแผงจริง" : "วางแผงก่อนถึงจะคำนวณระบบได้"
  }, React.createElement(P3Icon, {
    name: "sun",
    size: 14
  }), "\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A & \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), dirty && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: "#F59E0B",
      boxShadow: "0 0 0 3px rgba(245,158,11,.22)"
    }
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), React.createElement("button", {
    className: "p3-b pri" + (dirty ? "" : " "),
    onClick: doSave,
    disabled: !dirty,
    style: {
      padding: "10px 24px",
      borderRadius: 11,
      fontSize: 13,
      minWidth: 116
    }
  }, React.createElement(P3Icon, {
    name: "save",
    size: 15
  }), dirty ? "บันทึก" : "บันทึกแล้ว")));
}
Object.assign(window, {
  Plan3DEditor,
  usePlan3d
});