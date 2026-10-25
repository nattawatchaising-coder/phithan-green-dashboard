/* ============================================================
   flash+solar — ภาพบ้านโซลาร์ของหน้า FusionSolar (docs/fusionsolar.md)
   ภาพเรนเดอร์ที่ผู้ใช้ gen มาเอง (assets/fs-house.jpg พื้นเทาอ่อน) ตามแบบอ้างอิง Solis / Lumos / SolarSync / Sunsolar
   - fsHouseCutout   ตัดพื้นเทาของภาพเป็นโปร่งใสตอนโหลด (นอกเส้นรอบบ้าน FS_HOUSE_OUTLINE = พื้น · เงาเหลือเป็นเงาดำโปร่ง · ตัวบ้านทึบ) → วางได้ทั้งธีมสว่าง/มืด
   - FsHouseStage    กล่องวางภาพแบบ contain + ส่งตำแหน่งจุดบนภาพ (สัดส่วน 0..1) เป็นพิกเซลให้ของที่วางทับ
   - FsHouseFlow     หน้ารายละเอียดไซต์: บ้านกลาง + การ์ดโซลาร์/กริด/บ้านใช้ไฟ/แบต รอบ ๆ ต่อเส้นเข้าจุดบนบ้าน เส้นไหลแบบน้ำตามทิศพลังงาน
   ไม่มีการเขียนฐานข้อมูลในไฟล์นี้ · ลดการเคลื่อนไหว (fsCalm) = เส้นนิ่ง
   ============================================================ */

const FS_HOUSE_IMG = "dashboard/assets/fs-house.jpg?v=1";
/* จุดบนภาพ (สัดส่วนของกว้าง/สูงภาพ) ที่เส้นพลังงานวิ่งเข้า */
const FS_HOUSE_PT = { roof: [0.5, 0.27], grid: [0.3, 0.6], home: [0.56, 0.64], bat: [0.79, 0.56] };

/* เส้นรอบบ้าน+สนาม+ต้นไม้ในภาพ (พิกเซลของภาพ 1376×768) — เปลี่ยนภาพต้องวาดเส้นนี้ใหม่ */
const FS_HOUSE_OUTLINE = [[136, 499], [186, 462], [168, 426], [192, 372], [232, 334], [275, 322], [330, 336], [372, 352], [376, 214], [362, 182], [768, 90], [938, 192],
  [985, 163], [1048, 170], [1096, 215], [1106, 300], [1104, 330], [1104, 420], [1150, 425], [1195, 440], [1282, 495], [1180, 530], [1070, 568], [1000, 596],
  [930, 604], [640, 686]];
let _fsHouseP = null;
function fsHouseCutout() {
  if (_fsHouseP) return _fsHouseP;
  _fsHouseP = new Promise((res, rej) => {
    const im = new Image();
    im.onerror = () => rej(new Error("โหลดภาพบ้านไม่ได้"));
    im.onload = () => {
      try {
        const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H;
        const g = c.getContext("2d");
        g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, W, H), p = d.data;
        /* สีพื้น = ค่าเฉลี่ยมุมทั้งสี่ */
        let B = 0;
        [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].forEach(([x, y]) => { const i = (y * W + x) * 4; B += (p[i] + p[i + 1] + p[i + 2]) / 12; });
        /* นอกเส้นรอบบ้าน+สนาม (FS_HOUSE_OUTLINE วาดมือตามภาพนี้) = พื้นทั้งหมด · ในเส้น: ไล่จากขอบเส้นเข้าไปเฉพาะพิกเซลสีพื้นแท้ (เทา ไม่มีสี)
           ตัดด้วยสีอย่างเดียวไม่พอ — เงาอมสีและผนังด้านร่มไล่สีจางเข้าพื้นเหมือนกัน แยกกันไม่ออก
           ในพื้นที่พื้น: สีดำโปร่งตามความเข้ม (B - v) / B → บนพื้นสว่างได้ภาพเดิม (เงาครบ) · บนพื้นมืดเงาจางไปเอง */
        const N = W * H, seen = new Uint8Array(N), q = new Int32Array(N);
        const mc = document.createElement("canvas");
        mc.width = W; mc.height = H;
        const mg = mc.getContext("2d"), sx = W / 1376, sy = H / 768;
        mg.beginPath();
        FS_HOUSE_OUTLINE.forEach(([x, y], i) => (i ? mg.lineTo(x * sx, y * sy) : mg.moveTo(x * sx, y * sy)));
        mg.closePath(); mg.fillStyle = "#000"; mg.fill();
        const inside = mg.getImageData(0, 0, W, H).data;
        let qh = 0, qt = 0;
        for (let j = 0; j < N; j++) if (inside[j * 4 + 3] < 128) { seen[j] = 1; q[qt++] = j; }
        const isBg = (j) => {
          const i = j * 4, r = p[i], gg = p[i + 1], bb = p[i + 2], v = (r + gg + bb) / 3;
          return Math.max(r, gg, bb) - Math.min(r, gg, bb) <= 10 && v >= B - 48 && v <= B + 7;
        };
        const push = (j) => { if (!seen[j] && isBg(j)) { seen[j] = 1; q[qt++] = j; } };
        while (qh < qt) {
          const j = q[qh++], x = j % W;
          if (x > 0) push(j - 1);
          if (x < W - 1) push(j + 1);
          if (j >= W) push(j - W);
          if (j < N - W) push(j + W);
        }
        /* ขยายพื้นที่พื้นเข้าไปอีก 2 พิกเซลที่ขอบภาพบ้าน (พิกเซลเทา/ขาวไม่มีสีที่ติดพื้น) — กันขอบขาวรอบบ้านบนพื้นมืด */
        for (let pass = 0; pass < 2; pass++) {
          const add = [];
          for (let j = W; j < N - W; j++) {
            if (seen[j] || !(seen[j - 1] || seen[j + 1] || seen[j - W] || seen[j + W])) continue;
            const i = j * 4, r = p[i], gg = p[i + 1], bb = p[i + 2];
            if (Math.max(r, gg, bb) - Math.min(r, gg, bb) <= 16 && (r + gg + bb) / 3 >= B - 60) add.push(j);
          }
          add.forEach((j) => { seen[j] = 1; });
        }
        for (let j = 0; j < N; j++) {
          if (!seen[j]) continue;
          const i = j * 4, v = (p[i] + p[i + 1] + p[i + 2]) / 3;
          const al = Math.max(0, (B - v) / B - 0.015);   // ตัดสัญญาณรบกวนของ JPEG ที่พื้น
          p[i] = p[i + 1] = p[i + 2] = 0;
          p[i + 3] = Math.round(Math.min(1, al) * 255);
        }
        g.putImageData(d, 0, 0);
        c.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error("toBlob"))), "image/png");
      } catch (e) { rej(e); }
    };
    im.src = FS_HOUSE_IMG;
  });
  _fsHouseP.catch(() => { _fsHouseP = null; });
  return _fsHouseP;
}

/* ภาพบ้าน contain ในกล่อง · overlay(pt, box) วาดของทับ — pt([fx, fy]) = พิกัดพิกเซลในกล่อง */
function FsHouseStage({ height, overlay, pad }) {
  const box = React.useRef(null);
  const [sz, setSz] = React.useState(null);
  const [src, setSrc] = React.useState(null);
  const [raw, setRaw] = React.useState(false);
  React.useEffect(() => {
    let dead = false;
    fsHouseCutout().then((u) => !dead && setSrc(u)).catch(() => !dead && setRaw(true));
    const upd = () => box.current && setSz({ w: box.current.clientWidth, h: box.current.clientHeight });
    upd();
    const ro = window.ResizeObserver ? new ResizeObserver(upd) : null;
    ro && ro.observe(box.current);
    return () => { dead = true; ro && ro.disconnect(); };
  }, []);
  const AR = 1376 / 768, P = pad || 0;
  let img = null, pt = null;
  if (sz) {
    const aw = Math.max(1, sz.w - P * 2), ah = Math.max(1, sz.h - P * 2);
    const w = Math.min(aw, ah * AR), h = w / AR;
    img = { x: (sz.w - w) / 2, y: (sz.h - h) / 2, w, h };
    pt = (f) => [img.x + f[0] * img.w, img.y + f[1] * img.h];
  }
  const shown = src || (raw ? FS_HOUSE_IMG : null);
  return (
    <div ref={box} style={{ position: "relative", height, minWidth: 0 }}>
      {img && shown && (
        <img src={shown} alt="" aria-hidden="true" draggable="false" className="fs-in"
          style={{ position: "absolute", left: img.x, top: img.y, width: img.w, height: img.h, pointerEvents: "none", userSelect: "none",
            mixBlendMode: src ? "normal" : "multiply" }} />
      )}
      {img && overlay && overlay(pt, sz, img)}
    </div>
  );
}

/* ส่วนบนหน้าไซต์ทั้งหมด: ภาพบ้านเฉย ๆ (การ์ดลอยวางโดย FsFleetHero) */
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
/* เส้นพลังงานแบบน้ำไหล: รางจาง + ขีดยาวสีเลื่อนช้า ๆ ตามทิศ (ผู้ใช้ว่าจุดวิ่งเร็วเกิน ขอเป็นเส้นไหลเข้า) */
(function fsInjectHouseCss() {
  if (document.getElementById("fs-house-css")) return;
  const el = document.createElement("style");
  el.id = "fs-house-css";
  el.textContent = "@keyframes fsFlowFwd{to{stroke-dashoffset:-40}}@keyframes fsFlowRev{to{stroke-dashoffset:40}}"
    + ".fs-flow{stroke-dasharray:16 24;animation:fsFlowFwd 2s linear infinite}.fs-flow.rev{animation-name:fsFlowRev}"
    + "@media (prefers-reduced-motion: reduce){.fs-flow{animation:none!important}}";
  document.head.appendChild(el);
})();
/* เส้นโค้งจากการ์ด (a) เข้าจุดบนบ้าน (b) · rev = ไหลจากบ้านออกไปหาการ์ด · ยิ่ง kW มากยิ่งไหลเร็ว (ช้าสุด 2.6 วิ เร็วสุด 1.2 วิ ต่อช่วง 40px) */
function FsHwWire({ a, b, color, on, rel, rev, calm }) {
  const mx = (a[0] + b[0]) / 2;
  const d = "M" + a[0].toFixed(1) + "," + a[1].toFixed(1) + " C" + mx.toFixed(1) + "," + a[1].toFixed(1) + " " + mx.toFixed(1) + "," + b[1].toFixed(1) + " " + b[0].toFixed(1) + "," + b[1].toFixed(1);
  const dur = 2.6 - 1.4 * Math.sqrt(fsClamp(rel || 0.5, 0, 1));
  return (
    <g>
      <path d={d} fill="none" style={{ stroke: on ? color : "var(--border-strong)", strokeWidth: on ? 5 : 2, strokeLinecap: "round", opacity: on ? 0.16 : 0.7,
        strokeDasharray: on ? "none" : "3 5" }} />
      {on && <path d={d} fill="none" className={"fs-flow" + (rev ? " rev" : "")} style={{ stroke: color, strokeWidth: 2.6, strokeLinecap: "round",
        animationDuration: dur.toFixed(2) + "s", animationPlayState: calm ? "paused" : "running", filter: "drop-shadow(0 0 2px " + color + ")" }} />}
      <circle cx={b[0]} cy={b[1]} r="4" style={{ fill: "var(--surface)", stroke: on ? color : "var(--border-strong)", strokeWidth: 2 }} />
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
                <FsHwWire key={c.k} a={[c.side === "L" ? c.x + CW - 8 : c.x + 8, c.y]} b={pt(FS_HOUSE_PT[c.pt])}
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

Object.assign(window, { FsHouseArt, FsHouseFlow, FsHouseStage, fsHouseCutout });
