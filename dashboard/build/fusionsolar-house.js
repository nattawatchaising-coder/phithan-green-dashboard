function fsHousePanelTex(THREE) {
  const cv = document.createElement("canvas"),
    W = 240,
    H = 400,
    cols = 6,
    rows = 10;
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d");
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#22324d");
  bg.addColorStop(1, "#111b2e");
  g.fillStyle = "#c9d1dc";
  g.fillRect(0, 0, W, H);
  const cw = W / cols,
    ch = H / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    g.fillStyle = bg;
    g.fillRect(c * cw + 1.2, r * ch + 1.2, cw - 2.4, ch - 2.4);
    g.fillStyle = "rgba(160,185,220,.14)";
    for (let b = 1; b <= 3; b++) g.fillRect(c * cw + b * cw / 4 - 0.5, r * ch + 2, 1, ch - 4);
  }
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  return t;
}
function fsHouseWoodTex(THREE) {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 64;
  const g = cv.getContext("2d");
  for (let i = 0; i < 16; i++) {
    const l = 52 + i * 37 % 9;
    g.fillStyle = "hsl(28,42%," + l + "%)";
    g.fillRect(i * 16, 0, 14, 64);
    g.fillStyle = "hsl(26,35%,30%)";
    g.fillRect(i * 16 + 14, 0, 2, 64);
  }
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function fsHouseBuild(THREE, scene) {
  const M = o => {
    ["color", "emissive"].forEach(k => {
      if (o[k] != null) o[k] = new THREE.Color(o[k]).convertSRGBToLinear();
    });
    return new THREE.MeshStandardMaterial(o);
  };
  const mat = {
    white: M({
      color: 0xf2f0ec,
      roughness: 0.9
    }),
    plinth: M({
      color: 0xe9e6e0,
      roughness: 0.95
    }),
    roof: M({
      color: 0x40454d,
      roughness: 0.7
    }),
    trim: M({
      color: 0x3a3f46,
      roughness: 0.55,
      metalness: 0.2
    }),
    glass: M({
      color: 0x24313f,
      roughness: 0.06,
      metalness: 0.55
    }),
    glow: M({
      color: 0x000000,
      emissive: 0xffc77a,
      emissiveIntensity: 0.25,
      roughness: 1
    }),
    alu: M({
      color: 0xc8ced6,
      roughness: 0.35,
      metalness: 0.75
    }),
    cell: M({
      map: fsHousePanelTex(THREE),
      roughness: 0.22,
      metalness: 0.35
    }),
    wood: M({
      map: fsHouseWoodTex(THREE),
      roughness: 0.8
    }),
    grass: M({
      color: 0xa9c995,
      roughness: 1
    }),
    pave: M({
      color: 0xdedad2,
      roughness: 0.9
    }),
    leaf: M({
      color: 0x86ad73,
      roughness: 0.95,
      flatShading: true
    }),
    trunk: M({
      color: 0x8a6d55,
      roughness: 1
    }),
    unit: M({
      color: 0xfafafa,
      roughness: 0.5
    })
  };
  const root = new THREE.Group();
  scene.add(root);
  const add = (geo, m, x, y, z, parent, cast) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = cast !== false;
    o.receiveShadow = true;
    (parent || root).add(o);
    return o;
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  add(new THREE.CylinderGeometry(12.5, 12.8, 0.5, 72), mat.plinth, 0, -0.25, 0, null, false);
  add(new THREE.CylinderGeometry(12.1, 12.1, 0.06, 72), mat.grass, 0, 0.03, 0, null, false);
  add(box(6.5, 0.08, 3.2), mat.pave, -0.6, 0.06, 5.2, null, false);
  add(box(1.6, 0.08, 4.6), mat.pave, -1.4, 0.06, 8.9, null, false);
  add(box(4.4, 0.08, 4.4), mat.pave, 6.5, 0.06, 5.4, null, false);
  const D = 6.6,
    Wd = 9,
    h0 = 5.6,
    h1 = 7.5;
  const prof = new THREE.Shape();
  prof.moveTo(D / 2, 0);
  prof.lineTo(D / 2, h0);
  prof.lineTo(-D / 2, h1);
  prof.lineTo(-D / 2, 0);
  prof.lineTo(D / 2, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, {
    depth: Wd,
    bevelEnabled: false
  }), mat.white);
  body.rotation.y = -Math.PI / 2;
  body.position.set(Wd / 2, 0, 0);
  body.castShadow = body.receiveShadow = true;
  root.add(body);
  const slope = Math.atan2(h1 - h0, D),
    L = Math.hypot(D, h1 - h0) + 0.9;
  const roofG = new THREE.Group();
  roofG.position.set(0, (h0 + h1) / 2 + 0.14, 0);
  roofG.rotation.x = slope;
  root.add(roofG);
  add(box(Wd + 0.8, 0.26, L), mat.roof, 0, 0, 0, roofG);
  add(box(Wd + 0.8, 0.1, 0.12), mat.trim, 0, -0.02, L / 2, roofG);
  const pw = 1.12,
    pl = 1.86,
    gap = 0.06,
    cols = 7,
    rows = 3;
  const frameG = box(pw, 0.06, pl),
    cellG = new THREE.PlaneGeometry(pw - 0.07, pl - 0.07);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * (pw + gap),
      z = (r - (rows - 1) / 2) * (pl + gap) + 0.1;
    add(frameG, mat.alu, x, 0.2, z, roofG);
    const cell = add(cellG, mat.cell, x, 0.235, z, roofG, false);
    cell.rotation.x = -Math.PI / 2;
  }
  const zf = D / 2;
  const pane = (x, y, w, h) => {
    add(box(w, h, 0.05), mat.glow, x, y, zf - 0.08, null, false);
    add(box(w, h, 0.04), mat.glass, x, y, zf + 0.02, null, false);
    add(box(w + 0.16, 0.1, 0.12), mat.trim, x, y + h / 2 + 0.05, zf + 0.04);
    add(box(w + 0.16, 0.1, 0.12), mat.trim, x, y - h / 2 - 0.05, zf + 0.04);
    add(box(0.08, h, 0.12), mat.trim, x - w / 2 - 0.04, y, zf + 0.04);
    add(box(0.08, h, 0.12), mat.trim, x + w / 2 + 0.04, y, zf + 0.04);
  };
  [-3.1, -1.5, 0.1].forEach(x => pane(x, 1.45, 1.5, 2.5));
  pane(2.7, 1.45, 1.1, 2.5);
  pane(-1.6, 4.25, 4.6, 1.1);
  pane(2.7, 4.25, 1.7, 1.1);
  add(box(Wd - 0.6, 0.14, 1.3), mat.white, -0.2, 3.05, zf + 0.62);
  const side = (z, y, w, h) => {
    add(box(0.05, h, w), mat.glow, -Wd / 2 + 0.08, y, z, null, false);
    add(box(0.04, h, w), mat.glass, -Wd / 2 - 0.02, y, z, null, false);
    add(box(0.12, h + 0.2, 0.08), mat.trim, -Wd / 2 - 0.04, y, z - w / 2 - 0.04);
    add(box(0.12, h + 0.2, 0.08), mat.trim, -Wd / 2 - 0.04, y, z + w / 2 + 0.04);
  };
  side(1.2, 1.5, 1.2, 2.2);
  side(1.2, 4.3, 1.2, 1.2);
  side(-1.6, 4.6, 1.2, 1.6);
  const wx = Wd / 2 + 2.3,
    ww = 4.6,
    wd = 5.6,
    wh = 3.2;
  const wood = mat.wood.clone();
  wood.map = mat.wood.map.clone();
  wood.map.needsUpdate = true;
  wood.map.repeat.set(2.4, 1);
  add(box(ww, wh, wd), wood, wx, wh / 2, -0.4);
  add(box(ww + 0.6, 0.24, wd + 0.7), mat.white, wx, wh + 0.12, -0.15);
  add(box(3.4, 2.4, 0.06), mat.trim, wx, 1.2, wd / 2 - 0.37);
  for (let i = 1; i < 6; i++) add(box(3.3, 0.02, 0.02), mat.alu, wx, i * 0.4, wd / 2 - 0.33, null, false);
  add(box(0.7, 0.9, 0.22), mat.unit, wx + ww / 2 + 0.11, 1.9, 0.9);
  add(box(0.7, 1.3, 0.3), mat.unit, wx + ww / 2 + 0.15, 0.75, -0.3);
  add(box(0.5, 0.08, 0.02), mat.trim, wx + ww / 2 + 0.31, 0.95, -0.3, null, false).rotation.y = Math.PI / 2;
  add(box(1.0, 2.3, 0.08), mat.wood, 2.7 + 1.3, 1.15, zf + 0.04);
  const tree = (x, z, s) => {
    add(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 1.6 * s, 8), mat.trunk, x, 0.8 * s, z);
    add(new THREE.IcosahedronGeometry(1.15 * s, 1), mat.leaf, x, 2.2 * s, z);
    add(new THREE.IcosahedronGeometry(0.8 * s, 1), mat.leaf, x + 0.5 * s, 2.9 * s, z - 0.2 * s);
  };
  tree(-8.2, 3.2, 1.25);
  tree(-7.2, -4.2, 1.6);
  tree(9.6, -4.6, 1.1);
  [[-5.4, 4.9], [-4.6, 5.3], [3.4, 4.6]].forEach(([x, z]) => add(new THREE.IcosahedronGeometry(0.42, 1), mat.leaf, x, 0.36, z));
  return {
    mat,
    root
  };
}
function fsHouseEnv(THREE, renderer) {
  const s = new THREE.Scene(),
    geo = new THREE.SphereGeometry(50, 32, 16),
    col = [];
  const lin = h => new THREE.Color(h).convertSRGBToLinear();
  const top = lin(0x9cc4ef),
    mid = lin(0xfff4e2),
    bot = lin(0xd9d3c6);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 50,
      c = y > 0 ? mid.clone().lerp(top, Math.pow(y, 0.6)) : mid.clone().lerp(bot, Math.min(1, -y * 3));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide
  })));
  const pm = new THREE.PMREMGenerator(renderer),
    rt = pm.fromScene(s, 0.02);
  pm.dispose();
  geo.dispose();
  return rt;
}
function FsHouse3D({
  style
}) {
  const host = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let dead = false,
      cleanup = null;
    if (!window.p3LoadThree) {
      setFailed(true);
      return;
    }
    window.p3LoadThree().then(THREE => {
      if (dead || !host.current) return;
      try {
        cleanup = fsHouseMount(THREE, host.current, () => !dead && setReady(true));
      } catch (e) {
        console.warn("FsHouse3D", e);
        setFailed(true);
      }
    }).catch(() => !dead && setFailed(true));
    return () => {
      dead = true;
      cleanup && cleanup();
    };
  }, []);
  return React.createElement("div", {
    ref: host,
    "aria-hidden": "true",
    style: Object.assign({
      position: "absolute",
      inset: 0,
      opacity: ready && !failed ? 1 : 0,
      transition: "opacity .8s ease",
      cursor: "grab",
      touchAction: "pan-y"
    }, style)
  });
}
function fsHouseMount(THREE, el, onFirst) {
  const calm = window.fsCalm ? window.fsCalm() : false;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;outline:none";
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const env = fsHouseEnv(THREE, renderer);
  scene.environment = env.texture;
  const {
    mat
  } = fsHouseBuild(THREE, scene);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8cfbf, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.1);
  sun.position.set(14, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -16,
    right: 16,
    top: 16,
    bottom: -16,
    near: 1,
    far: 70
  });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun);
  const theme = () => {
    const night = document.documentElement.getAttribute("data-theme") === "aurora";
    hemi.color.set(night ? 0x8fa3d6 : 0xffffff);
    hemi.intensity = night ? 0.45 : 0.6;
    sun.color.set(night ? 0xb9c6ff : 0xfff1dc);
    sun.intensity = night ? 0.7 : 2.6;
    Object.values(mat).forEach(m => {
      m.envMapIntensity = night ? 0.35 : 0.8;
    });
    mat.glow.emissiveIntensity = night ? 1.6 : 0.25;
    renderer.toneMappingExposure = night ? 1.1 : 1;
    want = true;
  };
  const target = new THREE.Vector3(1.2, 2.2, 0);
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 200);
  camera.position.set(17, 12.5, 25);
  const ctl = new THREE.OrbitControls(camera, renderer.domElement);
  ctl.target.copy(target);
  Object.assign(ctl, {
    enableZoom: false,
    enablePan: false,
    enableDamping: true,
    dampingFactor: 0.08,
    rotateSpeed: 0.5,
    minPolarAngle: 0.85,
    maxPolarAngle: 1.32
  });
  const sph0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
  ctl.minAzimuthAngle = sph0.theta - 1.1;
  ctl.maxAzimuthAngle = sph0.theta + 0.9;
  ctl.update();
  let want = true,
    busy = false,
    idleAt = 0,
    t0 = performance.now(),
    raf = 0,
    vis = true,
    first = true;
  ctl.addEventListener("start", () => {
    busy = true;
    el.style.cursor = "grabbing";
  });
  ctl.addEventListener("end", () => {
    busy = false;
    idleAt = performance.now();
    el.style.cursor = "grab";
  });
  ctl.addEventListener("change", () => {
    want = true;
  });
  const fit = () => {
    const w = el.clientWidth || 1,
      h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    s.radius = 46 * Math.max(1, 1.5 / camera.aspect);
    camera.position.setFromSpherical(s).add(target);
    camera.updateProjectionMatrix();
    want = true;
  };
  const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
  ro ? ro.observe(el) : window.addEventListener("resize", fit);
  const io = window.IntersectionObserver ? new IntersectionObserver(es => {
    vis = es[0].isIntersecting;
  }) : null;
  io && io.observe(el);
  const mo = new MutationObserver(theme);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });
  theme();
  fit();
  const sph = new THREE.Spherical();
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (!vis || document.hidden) return;
    if (!calm && !busy && now - idleAt > 2500) {
      sph.setFromVector3(camera.position.clone().sub(target));
      const goal = sph0.theta + 0.42 * Math.sin((now - t0) / 9000);
      sph.theta += (goal - sph.theta) * 0.02;
      camera.position.setFromSpherical(sph).add(target);
      want = true;
    }
    if (ctl.update()) want = true;
    if (!want) return;
    want = false;
    renderer.render(scene, camera);
    if (first) {
      first = false;
      onFirst();
    }
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    ro ? ro.disconnect() : window.removeEventListener("resize", fit);
    io && io.disconnect();
    mo.disconnect();
    ctl.dispose();
    scene.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach(m => {
        m.map && m.map.dispose();
        m.dispose();
      });
    });
    env.dispose();
    renderer.dispose();
    renderer.forceContextLoss && renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
Object.assign(window, {
  FsHouse3D
});
