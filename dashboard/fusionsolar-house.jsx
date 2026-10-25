/* ============================================================
   flash+solar — ภาพบ้านโซลาร์ของหน้า FusionSolar (docs/fusionsolar.md)
   ภาพเรนเดอร์ที่ผู้ใช้ gen มาเอง ตามแบบอ้างอิง Solis / Lumos / SolarSync / Sunsolar — ธีมสว่าง = สลับตามเวลาไทย (กลางวัน 06–16 · แดดเย็น 16–18 · เปิดไฟตอนค่ำ 18–06 พื้นสว่างทั้งหมด) · ธีมมืด = ภาพกลางคืน (พื้นเกือบดำ)
   - fsHouseCutout   ตัดพื้นของภาพเป็นโปร่งใสตอนโหลด: นอกเส้นรอบบ้าน (outline วาดมือตามภาพ) = พื้นทั้งหมด · ในเส้นไล่เข้าไปเฉพาะสีพื้นแท้
                     พื้นที่พื้นแปลงเป็นสีโปร่งตามความต่างจากสีพื้น (เงา = ดำโปร่ง · แสงไฟตกพื้นตอนกลางคืน = สว่างโปร่ง) · ตัวบ้านทึบเสมอ
   - FsHouseStage    กล่องวางภาพแบบ contain + pt("roof") = พิกัดพิกเซลของจุดบนภาพ ให้ของที่วางทับ
   - FsHouseFlow     หน้ารายละเอียดไซต์: บ้านกลาง + การ์ดโซลาร์/กริด/บ้านใช้ไฟ/แบต รอบ ๆ ต่อเส้นเข้าจุดบนบ้าน เส้นไหลแบบน้ำตามทิศพลังงาน
   ไม่มีการเขียนฐานข้อมูลในไฟล์นี้ · ลดการเคลื่อนไหว (fsCalm) = เส้นนิ่ง
   เปลี่ยนภาพ = ต้องแก้ outline (พิกเซลของภาพ) และ pt (สัดส่วน 0..1) ของภาพนั้นใหม่
   ============================================================ */

/* bg(dc, sat) = พิกเซลในเส้นรอบบ้านที่ยังนับเป็นพื้น — dc = ความต่างจากสีพื้นรายช่อง r,g,b และเฉลี่ย (ค่าบวก = สว่างกว่าพื้น) */
const FS_HOUSE = {
  day: {
    src: "dashboard/assets/fs-house.jpg?v=1", w: 1376, h: 768, fill: "rgb(232,232,231)",
    outline: [[136, 499], [186, 462], [168, 426], [192, 372], [232, 334], [275, 322], [330, 336], [372, 352], [376, 214], [362, 182], [768, 90], [938, 192],
      [985, 163], [1048, 170], [1096, 215], [1106, 300], [1104, 330], [1104, 420], [1150, 425], [1195, 440], [1282, 495], [1180, 530], [1070, 568], [1000, 596],
      [930, 604], [640, 686]],
    pt: { roof: [0.5, 0.27], grid: [0.3, 0.6], home: [0.56, 0.64], bat: [0.79, 0.56] },
    shadowOnly: true,   // พื้นสว่างไล่เฉดไม่เท่ากัน → เก็บเฉพาะส่วนที่มืดกว่าพื้น (เงา) ไม่งั้นเป็นด่างขาวจาง ๆ
    bg: (dc) => Math.max(dc[0], dc[1], dc[2]) - Math.min(dc[0], dc[1], dc[2]) <= 10 && dc[3] >= -48 && dc[3] <= 7,
  },
  /* แดดเย็น / เปิดไฟตอนค่ำ = มุมและขนาดเดียวกับภาพกลางวัน ใช้ outline/pt ชุดเดียวกัน */
  dusk: { src: "dashboard/assets/fs-house-dusk.jpg?v=1", fill: "rgb(241,237,226)" },
  eve: { src: "dashboard/assets/fs-house-eve.jpg?v=1", fill: "rgb(218,223,229)" },
  night: {
    src: "dashboard/assets/fs-house-night.jpg?v=1", w: 1024, h: 572, fill: "rgb(15,20,24)",
    outline: [[98, 374], [128, 330], [132, 290], [160, 256], [200, 243], [245, 258], [268, 290], [282, 300], [282, 140], [272, 132], [568, 70], [700, 150],
      [712, 128], [760, 122], [805, 150], [822, 200], [818, 245], [818, 330], [838, 318], [842, 270], [875, 228], [912, 222], [945, 258], [952, 312], [922, 332],
      [954, 370], [880, 392], [770, 425], [700, 442], [482, 508]],
    pt: { roof: [0.49, 0.26], grid: [0.3, 0.59], home: [0.56, 0.62], bat: [0.77, 0.55] },
    bg: (dc) => Math.max(Math.abs(dc[0]), Math.abs(dc[1]), Math.abs(dc[2])) <= 12,
  },
};

["dusk", "eve"].forEach((k) => { FS_HOUSE[k] = Object.assign({}, FS_HOUSE.day, FS_HOUSE[k]); });

const _fsHouseP = {};
function fsHouseCutout(kind) {
  const V = FS_HOUSE[kind];
  if (_fsHouseP[kind]) return _fsHouseP[kind];
  const pr = new Promise((res, rej) => {
    const im = new Image();
    im.onerror = () => rej(new Error("โหลดภาพบ้านไม่ได้"));
    im.onload = () => {
      try {
        const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H;
        const g = c.getContext("2d");
        g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, W, H), p = d.data;
        /* สีพื้นรายช่อง = ค่าเฉลี่ยมุมทั้งสี่ */
        const B = [0, 0, 0];
        [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].forEach(([x, y]) => { const i = (y * W + x) * 4; for (let k = 0; k < 3; k++) B[k] += p[i + k] / 4; });
        const N = W * H, seen = new Uint8Array(N), q = new Int32Array(N);
        const mc = document.createElement("canvas");
        mc.width = W; mc.height = H;
        const mg = mc.getContext("2d"), sx = W / V.w, sy = H / V.h;
        mg.beginPath();
        V.outline.forEach(([x, y], i) => (i ? mg.lineTo(x * sx, y * sy) : mg.moveTo(x * sx, y * sy)));
        mg.closePath(); mg.fillStyle = "#000"; mg.fill();
        const inside = mg.getImageData(0, 0, W, H).data;
        let qh = 0, qt = 0;
        for (let j = 0; j < N; j++) if (inside[j * 4 + 3] < 128) { seen[j] = 1; q[qt++] = j; }
        const dc = [0, 0, 0, 0];
        const isBg = (j) => {
          const i = j * 4;
          for (let k = 0; k < 3; k++) dc[k] = p[i + k] - B[k];
          dc[3] = (dc[0] + dc[1] + dc[2]) / 3;
          return V.bg(dc, Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2]));
        };
        const push = (j) => { if (!seen[j] && isBg(j)) { seen[j] = 1; q[qt++] = j; } };
        while (qh < qt) {
          const j = q[qh++], x = j % W;
          if (x > 0) push(j - 1);
          if (x < W - 1) push(j + 1);
          if (j >= W) push(j - W);
          if (j < N - W) push(j + W);
        }
        /* พื้นที่พื้น → สีโปร่ง (color-to-alpha เทียบสีพื้น) */
        for (let j = 0; j < N; j++) {
          if (!seen[j]) continue;
          const i = j * 4;
          let a = 0;
          for (let k = 0; k < 3; k++) { const v = p[i + k], b = B[k]; a = Math.max(a, v > b ? (V.shadowOnly ? 0 : (v - b) / (255 - b)) : (b - v) / b); }
          a = Math.max(0, (a - 0.02) / 0.98);   // ตัดสัญญาณรบกวนของ JPEG ที่พื้น
          for (let k = 0; k < 3; k++) p[i + k] = V.shadowOnly ? 0 : a > 0 ? Math.max(0, Math.min(255, B[k] + (p[i + k] - B[k]) / a)) : 0;
          p[i + 3] = Math.round(Math.min(1, a) * 255);
        }
        g.putImageData(d, 0, 0);
        c.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error("toBlob"))), "image/png");
      } catch (e) { rej(e); }
    };
    im.src = V.src;
  });
  _fsHouseP[kind] = pr;
  pr.catch(() => { delete _fsHouseP[kind]; });
  return pr;
}

/* ภาพไหนตอนนี้ — ธีมมืด = night · ธีมสว่างตามชั่วโมงเวลาไทย · ติดตามการสลับธีมสดและเช็กเวลาทุกนาที */
function fsHouseKind() {
  if (document.documentElement.getAttribute("data-theme") === "aurora") return "night";
  const h = (new Date().getUTCHours() + 7) % 24;
  return h >= 6 && h < 16 ? "day" : h >= 16 && h < 18 ? "dusk" : "eve";
}
function useFsHouseKind() {
  const [kind, setKind] = React.useState(fsHouseKind);
  React.useEffect(() => {
    const upd = () => setKind(fsHouseKind());
    const mo = new MutationObserver(upd);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const t = setInterval(upd, 60000);
    return () => { mo.disconnect(); clearInterval(t); };
  }, []);
  return kind;
}

/* ภาพบ้าน contain ในกล่อง · overlay(pt, box, img) วาดของทับ — pt("roof") = พิกัดพิกเซลของจุดนั้นบนภาพของธีมปัจจุบัน */
function FsHouseStage({ height, overlay, pad }) {
  const kind = useFsHouseKind(), V = FS_HOUSE[kind];
  const box = React.useRef(null);
  const [sz, setSz] = React.useState(null);
  const [src, setSrc] = React.useState({});
  React.useEffect(() => {
    const upd = () => box.current && setSz({ w: box.current.clientWidth, h: box.current.clientHeight });
    upd();
    const ro = window.ResizeObserver ? new ResizeObserver(upd) : null;
    ro && ro.observe(box.current);
    return () => ro && ro.disconnect();
  }, []);
  React.useEffect(() => {
    let dead = false;
    fsHouseCutout(kind).then((u) => !dead && setSrc((o) => Object.assign({}, o, { [kind]: u })))
      .catch(() => !dead && setSrc((o) => Object.assign({}, o, { [kind]: "raw" })));
    return () => { dead = true; };
  }, [kind]);
  const AR = V.w / V.h, P = pad || 0;
  let img = null, pt = null;
  if (sz) {
    const aw = Math.max(1, sz.w - P * 2), ah = Math.max(1, sz.h - P * 2);
    const w = Math.min(aw, ah * AR), h = w / AR;
    img = { x: (sz.w - w) / 2, y: (sz.h - h) / 2, w, h };
    pt = (name) => [img.x + V.pt[name][0] * img.w, img.y + V.pt[name][1] * img.h];
  }
  const s = src[kind], raw = s === "raw";
  return (
    <div ref={box} style={{ position: "relative", height, minWidth: 0 }}>
      {img && s && (
        <img key={kind} src={raw ? V.src : s} alt="" aria-hidden="true" draggable="false" className="fs-in"
          style={{ position: "absolute", left: img.x, top: img.y, width: img.w, height: img.h, pointerEvents: "none", userSelect: "none",
            mixBlendMode: raw ? (kind === "night" ? "screen" : "multiply") : "normal" }} />
      )}
      {img && overlay && overlay(pt, sz, img)}
    </div>
  );
}

/* ส่วนบนหน้าไซต์ทั้งหมด: ภาพเต็มกรอบ (ผู้ใช้ขอ "ภาพเต็มกรอบ") — กรอบทั้งกล่องเป็นสีพื้นของภาพ (fill) + ภาพเต็มความสูง ไม่ตัดพื้น
   ขอบซ้าย/ขวาของภาพจางเข้าสีพื้นให้เนียน · cx = ตำแหน่งกึ่งกลางบ้านตามแนวนอนของกล่อง (0..1) · ข้อความ/การ์ดวางทับโดย FsFleetHero */
function FsHouseBackdrop({ cx }) {
  const kind = useFsHouseKind(), V = FS_HOUSE[kind];
  const fade = "linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)";
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: V.fill, overflow: "hidden", pointerEvents: "none" }}>
      <img key={kind} src={V.src} alt="" draggable="false"
        style={{ position: "absolute", top: 0, height: "100%", width: "auto", left: (cx == null ? 50 : cx * 100) + "%", transform: "translateX(-50%)", maxWidth: "none",
          WebkitMaskImage: fade, maskImage: fade, userSelect: "none" }} />
    </div>
  );
}
function FsHouseArt() {
  return <div style={{ position: "absolute", inset: 0 }}><FsHouseStage height="100%" /></div>;
}

/* ── หน้ารายละเอียดไซต์ ── */
const FS_HW_TOWER = "M8 22 12 2l4 20M9.2 15h5.6M10.3 9.5h3.4M5 6.5h14M7 6.5v2M17 6.5v2";
function FsHwIcon({ name, size, color }) {
  if (name !== "tower") return <Icon name={name} size={size} color={color} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {FS_HW_TOWER.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}
function FsHwCard({ icon, color, on, title, value, sub, style }) {
  return (
    <div style={Object.assign({ minWidth: 0, padding: "10px 12px", borderRadius: 14, background: "color-mix(in srgb, var(--surface) 88%, transparent)",
      boxShadow: "var(--shadow-card)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", gap: 10, alignItems: "center" }, style)}>
      <span style={{ width: 34, height: 34, borderRadius: 17, display: "grid", placeItems: "center", flexShrink: 0,
        background: on ? "color-mix(in srgb, " + color + " 16%, var(--surface))" : "var(--surface2)" }}>
        <FsHwIcon name={icon} size={17} color={on ? color : "var(--text-3)"} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.15, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
    </div>
  );
}
/* ท่อพลังงาน = ท่อแก้วใส มีแสงสีตามประเภทไฟไหลอยู่ข้างใน (ผู้ใช้เลือกจาก 4 แบบ ตามภาพอ้างอิงท่อใสมีแสงข้างใน)
   ทางเดินท่อเกาะผนังตามมุมมองของภาพ · แสงเลื่อนรอบละ 64px (keyframes fsFlowFwd/Rev) · วงกระเพื่อมที่ปลายทาง · ไม่มีไฟ = ท่อใสเปล่า */
(function fsInjectHouseCss() {
  if (document.getElementById("fs-house-css")) return;
  const el = document.createElement("style");
  el.id = "fs-house-css";
  el.textContent = "@keyframes fsFlowFwd{to{stroke-dashoffset:-64}}@keyframes fsFlowRev{to{stroke-dashoffset:64}}"
    + "@keyframes fsRipple{0%{transform:scale(1);opacity:.7}100%{transform:scale(3.6);opacity:0}}"
    + ".fs-flow{animation:fsFlowFwd 2s linear infinite}.fs-flow.rev{animation-name:fsFlowRev}"
    + ".fs-ripple{transform-box:fill-box;transform-origin:center;animation:fsRipple 2.2s ease-out infinite}"
    + "@media (prefers-reduced-motion: reduce){.fs-flow,.fs-ripple{animation:none!important}.fs-ripple{opacity:0}}";
  document.head.appendChild(el);
})();
/* ทางเดินท่อ: จากจุดบนบ้าน b ลงตรงตามผนัง แล้ววิ่งขนานขอบผนัง/พื้นของภาพ (ชัน ~0.25 ยกขึ้นเมื่อออกห่างบ้าน ตามภาพบ้านมุมนี้)
   ไปจบที่ขอบการ์ด a · มุมเลี้ยวโค้งมน */
const FS_ISO = 0.25;
function fsConduitPath(a, b) {
  const f = (q) => q[0].toFixed(1) + "," + q[1].toFixed(1);
  const run = Math.abs(a[0] - b[0]), ym = a[1] + FS_ISO * run;   // ระดับที่ท่อลงมาถึงก่อนเลี้ยวออกตามผนัง
  const sy = Math.sign(ym - b[1]) || 1, sx = Math.sign(a[0] - b[0]) || 1;
  const r = Math.min(12, Math.abs(ym - b[1]) / 2, run / 2);
  const m = [b[0], ym], k = r / Math.hypot(1, FS_ISO);
  return "M" + f(a) + " L" + f([m[0] + sx * k, m[1] - FS_ISO * k]) + " Q" + f(m) + " " + f([m[0], m[1] - sy * r]) + " L" + f(b);
}
/* ท่อจากการ์ด (a) เข้าจุดบนบ้าน (b) · rev = ไหลจากบ้านออกไปหาการ์ด · ยิ่ง kW มากยิ่งไหลเร็ว (ช้าสุด 4.1 วิ เร็วสุด 1.9 วิ ต่อรอบ 64px) */
function FsHwWire({ a, b, color, on, rel, rev, calm }) {
  const dur = 1.2 * (3.4 - 1.8 * Math.sqrt(fsClamp(rel || 0.5, 0, 1)));
  const cls = "fs-flow" + (rev ? " rev" : ""), play = calm ? "paused" : "running";
  const cd = fsConduitPath(a, b), e = rev ? a : b;
  const C = (st, c) => <path d={cd} fill="none" className={c} style={Object.assign({ strokeLinecap: "round", strokeLinejoin: "round" }, st)} />;
  const flow = (st) => C(Object.assign({ animationDuration: dur.toFixed(2) + "s", animationPlayState: play }, st), cls);
  return (
    <g>
      {C({ stroke: "#000", strokeWidth: 15, opacity: 0.14, filter: "blur(2px)", transform: "translate(2px,3px)" })}
      {C({ stroke: "color-mix(in srgb, var(--text-1) 28%, transparent)", strokeWidth: 13 })}
      {C({ stroke: "color-mix(in srgb, var(--surface) 62%, transparent)", strokeWidth: 10.5 })}
      {on && C({ stroke: color, strokeWidth: 7, opacity: 0.8, filter: "blur(3px)" })}
      {on && flow({ stroke: "color-mix(in srgb, " + color + " 70%, #fff)", strokeWidth: 5, strokeDasharray: "40 24", filter: "blur(1.2px) drop-shadow(0 0 4px " + color + ")" })}
      {on && flow({ stroke: "#fff", strokeWidth: 1.6, strokeDasharray: "26 38", opacity: 0.8 })}
      {C({ stroke: "rgba(255,255,255,0.55)", strokeWidth: 1.3, transform: "translate(-2.5px,-2.5px)" })}
      {on && <circle cx={e[0]} cy={e[1]} r="6" className="fs-ripple" style={{ fill: "none", stroke: color, strokeWidth: 2, animationPlayState: play }} />}
      <circle cx={b[0]} cy={b[1]} r="7.5" style={{ fill: "rgba(255,255,255,0.85)", stroke: "color-mix(in srgb, var(--text-1) 25%, transparent)", strokeWidth: 1 }} />
      <circle cx={b[0]} cy={b[1]} r="3.5" style={{ fill: on ? color : "var(--border-strong)", filter: on ? "drop-shadow(0 0 4px " + color + ")" : "none" }} />
    </g>
  );
}
function FsHouseFlow({ em, site, compact, at }) {
  const calm = fsCalm();
  const cap = fsN(site.capacity_kw) || em.cap || null;
  const pv = em.pvKw, g = em.gridKw, bk = em.battKw, load = em.loadKw;
  const off = +site.health_state === 1 || site.fs_status === "not_found_in_fusionsolar";
  const kw = (v) => (v == null ? "–" : fsFmt(Math.abs(v), Math.abs(v) >= 100 ? 0 : 1) + " kW");
  const act = (v) => !off && v != null && Math.abs(v) > 0.02;
  const rel = (v) => (cap > 0 && v != null ? Math.abs(v) / cap : 0.5);
  const gColor = g > 0.02 ? "var(--fs-exp)" : g < -0.02 ? "var(--fs-imp)" : "var(--text-3)";
  const fromPv = load > 0.05 && pv != null ? fsClamp((pv - Math.max(0, g || 0) - Math.max(0, bk || 0)) / load, 0, 1) : null;
  /* out = จุดวิ่งจากบ้านออกไปหาการ์ด (โซลาร์ผลิตจากหลังคา · ใช้ไฟ · ขายเข้ากริด · ชาร์จแบต) · ซื้อกริด/แบตจ่าย = วิ่งเข้าบ้าน */
  const cards = [
    { k: "pv", pt: "roof", side: "L", icon: "panel", color: "var(--fs-sun)", on: act(pv), out: true, kw: pv, title: "โซลาร์ผลิต", value: kw(pv),
      sub: cap > 0 && pv != null ? Math.round(fsClamp(pv / cap, 0, 1) * 100) + "% ของ " + fsFmt(cap, 0) + " kWp" : em.hasInv ? null : "ไม่มีข้อมูลอินเวอร์เตอร์" },
    { k: "grid", pt: "grid", side: "L", icon: "tower", color: gColor, on: !!em.meter && act(g), out: g > 0, kw: g,
      title: g > 0.02 ? "ขายเข้ากริด" : g < -0.02 ? "ซื้อจากกริด" : "กริด", value: kw(g), sub: em.meter ? null : "ไม่มีมิเตอร์" },
    { k: "home", pt: "home", side: "R", icon: "home", color: "var(--fs-self)", on: act(load), out: true, kw: load, title: "บ้าน/อาคารใช้ไฟ", value: kw(load),
      sub: fromPv != null ? "จากโซลาร์ " + Math.round(fromPv * 100) + "%" : em.meter ? null : "ไม่มีมิเตอร์" },
  ];
  if (em.batt) cards.push({ k: "bat", pt: "bat", side: "R", icon: "battery", color: "var(--fs-bat)", on: act(bk), out: bk > 0, kw: bk,
    title: bk > 0.02 ? "แบตกำลังชาร์จ" : bk < -0.02 ? "แบตกำลังจ่าย" : "แบตเตอรี่", value: em.soc != null ? em.soc + "%" : "–", sub: act(bk) ? kw(bk) : null });
  const label = "การไหลของพลังงาน: " + cards.map((c) => c.title + " " + c.value).join(" · ");
  const foot = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
      {off && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "var(--surface2)", color: "var(--tint-red-tx)" }}>ไม่ได้รับข้อมูล</span>}
      {at}
    </div>
  );
  if (compact) return (
    <div role="img" aria-label={label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {foot}
      <FsHouseStage height={190} />
      <div className="kpi-grid" style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
        {cards.map((c) => <FsHwCard key={c.k} {...c} style={{ boxShadow: "var(--shadow-sm)", padding: "9px 10px" }} />)}
      </div>
    </div>
  );
  const CW = 166;   // การ์ดวางมุมทั้งสี่ของภาพ (ตรงนั้นเป็นพื้นว่าง ไม่บังตัวบ้าน)
  return (
    <div role="img" aria-label={label} style={{ position: "relative" }}>
      <FsHouseStage height={300} overlay={(pt, sz) => {
        const place = (list) => list.map((c, i) => Object.assign({}, c, {
          y: sz.h * (i ? 0.8 : 0.2), x: c.side === "L" ? 0 : sz.w - CW }));
        const all = place(cards.filter((c) => c.side === "L")).concat(place(cards.filter((c) => c.side === "R")));
        return (
          <React.Fragment>
            <svg width={sz.w} height={sz.h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
              {all.map((c) => (
                <FsHwWire key={c.k} a={[c.side === "L" ? c.x + CW - 8 : c.x + 8, c.y]} b={pt(c.pt)}
                  color={c.color} on={c.on} rel={rel(c.kw)} rev={c.out} calm={calm} />
              ))}
            </svg>
            {all.map((c) => <FsHwCard key={c.k} {...c} style={{ position: "absolute", left: c.x, top: c.y, width: CW, transform: "translateY(-50%)" }} />)}
          </React.Fragment>
        );
      }} />
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{foot}</div>
    </div>
  );
}

Object.assign(window, { FsHouseArt, FsHouseBackdrop, FsHouseFlow, FsHouseStage, fsHouseCutout });
