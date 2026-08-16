/* ============================================================
   PHITHAN GREEN — วางแผง 3D (Plan 3D)
   - ปั้นหลังคาสี่เหลี่ยม หรือ "วาดทรงอิสระ" ในมุมบน (คลิกมุมทีละจุดตามรูปโดรน) → แปลงเป็น 3D
   - วางแผงเป็นกริดอัตโนมัติ (ทรงอิสระ = เฉพาะในขอบเขต) แตะแผงเว้นตำแหน่ง แตะซ้ำใส่คืน
   - ลากหลังคา/สิ่งบดบังย้ายได้ · หลังคาทรงอิสระลากจุดสีเขียวปรับรูปทรงได้
   - จำลองเงาแดดจริงตามเดือน/เวลา/พิกัด (มุมเงย+ทิศดวงอาทิตย์)
   - บันทึกลง RTDB: plan3d/{jobId} · ส่งออกภาพ PNG
   Three.js โหลดแบบ lazy ครั้งแรกที่เปิด (ไม่ถ่วงโหลดหน้าหลัก)
   ============================================================ */

const P3_DEG = Math.PI / 180;
const P3_PANEL_SHORT = 1.134;  // ด้านสั้นแผงมาตรฐาน (ม.)
const P3_PANEL_LONG = 2.278;   // ด้านยาว (ม.)
const P3_PANEL_T = 0.04;       // ความหนาที่วาด
/* หลังคาทุกผืนใช้สีเดียวกัน — บ้านหลังเดียวกันคนละสีทำให้ภาพ 3D ดูเป็นคนละหลัง
   (งานเก่าที่บันทึก roof.color ไว้คนละสี จะถูกวาดทับด้วยสีนี้ทั้งหมด) */
const P3_ROOF_COLOR = "#94A3B8";
const P3_GRP_COLORS = ["#4F46E5", "#0891B2", "#DB2777", "#CA8A04", "#059669"];  // สีประจำกลุ่ม A,B,C…

/* ── โหลด Three.js + OrbitControls ครั้งเดียว ── */
let _p3ThreeP = null;
function p3LoadThree() {
  if (window.THREE && window.THREE.OrbitControls) return Promise.resolve(window.THREE);
  if (_p3ThreeP) return _p3ThreeP;
  const inject = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("โหลดไม่สำเร็จ: " + src));
    document.head.appendChild(s);
  });
  _p3ThreeP = inject("https://unpkg.com/three@0.147.0/build/three.min.js")
    .then(() => inject("https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js"))
    .then(() => window.THREE);
  _p3ThreeP.catch(() => { _p3ThreeP = null; });
  return _p3ThreeP;
}

/* ── แผนที่ดาวเทียม (Leaflet + Esri World Imagery) — ฟรี ไม่ต้องใช้ Google API key ── */
let _p3LeafletP = null;
function p3LoadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (_p3LeafletP) return _p3LeafletP;
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);
  _p3LeafletP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => res(window.L); s.onerror = () => rej(new Error("โหลดแผนที่ (Leaflet) ไม่สำเร็จ"));
    document.head.appendChild(s);
  });
  _p3LeafletP.catch(() => { _p3LeafletP = null; });
  return _p3LeafletP;
}
const P3_ESRI_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const P3_ESRI_ATTR = "Tiles © Esri, Maxar, Earthstar Geographics";

/* เมตรต่อพิกเซล (Web Mercator) ที่ละติจูด lat + ระดับซูม z */
function p3MetersPerPixel(lat, z) {
  return 156543.03392804097 * Math.cos((lat || 0) * Math.PI / 180) / Math.pow(2, z);
}
/* ดึงพิกัด lat,lng จากลิงก์ Google Maps (เฉพาะลิงก์เต็มที่มีตัวเลขในตัว) → [lat,lng] หรือ null */
function p3ParseLatLng(url) {
  if (!url || typeof url !== "string") return null;
  const pats = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /(-?\d{1,2}\.\d{4,}),\s*(-?\d{2,3}\.\d{4,})/];
  for (const p of pats) { const m = url.match(p); if (m) return [parseFloat(m[1]), parseFloat(m[2])]; }
  return null;
}
/* ค้นหาพิกัดจากที่อยู่ (Nominatim / OpenStreetMap — ฟรี ไม่ต้องใช้ key) → [lat,lng] หรือ null */
function p3Geocode(query) {
  const q = (query || "").trim();
  if (!q) return Promise.resolve(null);
  return fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q), { headers: { "Accept": "application/json" } })
    .then((r) => r.ok ? r.json() : [])
    .then((a) => (a && a[0]) ? [parseFloat(a[0].lat), parseFloat(a[0].lon)] : null)
    .catch(() => null);
}
/* lng,lat → พิกเซลโลกที่ระดับซูม z (256px/ไทล์) */
function p3LngLatToWorldPx(lat, lng, z) {
  const s = 256 * Math.pow(2, z);
  const x = (lng + 180) / 360 * s;
  const sinL = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinL) / (1 - sinL)) / (4 * Math.PI)) * s;
  return { x, y };
}
/* จับภาพดาวเทียมของ "พื้นที่ที่ผู้ใช้เห็น" (กว้าง realWidth จากซูม viewZoom × viewPx)
   ต่อไทล์ที่ระดับ native (Esri สูงสุด ~19) เพื่อไม่ให้ดึงไทล์ที่ไม่มี → { url, widthM, lat, lng, zoom } */
function p3CaptureTiles(lat, lng, viewZoom, viewPx) {
  const realWidthM = p3MetersPerPixel(lat, viewZoom) * (viewPx || 1024);
  const z = Math.max(1, Math.min(19, Math.round(viewZoom)));   // Esri World Imagery native ~19
  let size = Math.round(realWidthM / p3MetersPerPixel(lat, z));
  size = Math.max(256, Math.min(2048, size));
  const c = p3LngLatToWorldPx(lat, lng, z);
  const left = c.x - size / 2, top = c.y - size / 2;
  const tL = Math.floor(left / 256), tT = Math.floor(top / 256);
  const tR = Math.floor((left + size - 1) / 256), tB = Math.floor((top + size - 1) / 256);
  const cv = document.createElement("canvas"); cv.width = size; cv.height = size;
  const ctx = cv.getContext("2d");
  const n = Math.pow(2, z);
  const jobs = [];
  for (let tx = tL; tx <= tR; tx++) for (let ty = tT; ty <= tB; ty++) {
    const wx = ((tx % n) + n) % n, wy = ty;
    if (wy < 0 || wy >= n) continue;
    const url = P3_ESRI_URL.replace("{z}", z).replace("{x}", wx).replace("{y}", wy);
    const dx = tx * 256 - left, dy = ty * 256 - top;
    jobs.push(new Promise((res) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => { try { ctx.drawImage(img, dx, dy); } catch (e) {} res(); };
      img.onerror = () => res();
      img.src = url;
    }));
  }
  return Promise.all(jobs).then(() => {
    let url;
    try { url = cv.toDataURL("image/jpeg", 0.85); } catch (e) { throw new Error("แปลงภาพแผนที่ไม่สำเร็จ (CORS)"); }
    return { url, widthM: realWidthM, lat, lng, zoom: z };
  });
}

/* ── โมดัลเลือกพื้นที่จากแผนที่ดาวเทียม (เลื่อน/ซูม → จับภาพเป็นผังพื้น) ── */
function P3MapPicker({ initial, initialQuery, onPick, onClose }) {
  const boxRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [q, setQ] = React.useState(initialQuery || "");

  React.useEffect(() => {
    let map;
    p3LoadLeaflet().then((L) => {
      if (!boxRef.current) return;
      const has = initial && initial.length === 2 && isFinite(initial[0]);
      map = L.map(boxRef.current, { zoomControl: true }).setView(has ? initial : [13.7563, 100.5018], has ? 19 : 6);
      L.tileLayer(P3_ESRI_URL, { maxZoom: 21, maxNativeZoom: 19, attribution: P3_ESRI_ATTR }).addTo(map);
      mapRef.current = map; setReady(true);
      setTimeout(() => map.invalidateSize(), 120);
      if (!has && (initialQuery || "").trim()) p3Geocode(initialQuery).then((ll) => { if (ll && mapRef.current) mapRef.current.setView(ll, 19); });
    }).catch((e) => setErr(e.message));
    return () => { if (map) map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line

  const search = () => {
    const query = (q || "").trim(); if (!query) return;
    setBusy(true); setErr("");
    p3Geocode(query).then((ll) => {
      setBusy(false);
      if (ll && mapRef.current) mapRef.current.setView(ll, 19);
      else setErr("ไม่พบที่อยู่นี้ — ลองพิมพ์ละเอียดขึ้น หรือเลื่อนแผนที่หาเอง");
    });
  };
  const use = () => {
    const map = mapRef.current; if (!map) return;
    const c = map.getCenter(), z = map.getZoom();
    const vpx = (boxRef.current && boxRef.current.clientWidth) || 1024;
    setBusy(true); setErr("");
    p3CaptureTiles(c.lat, c.lng, z, vpx).then((res) => { setBusy(false); onPick(res); })
      .catch((e) => { setBusy(false); setErr(e.message); });
  };

  const ibtn = { padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer", color: "var(--text-1)" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,20,14,.55)", display: "flex", padding: 12 }}>
      <div style={{ flex: 1, minHeight: 0, background: "var(--surface)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ padding: 10, borderBottom: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--text-1)", whiteSpace: "nowrap" }}>🗺️ เลือกพื้นที่จากแผนที่</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="ค้นหาที่อยู่…"
            style={{ flex: 1, minWidth: 130, padding: "8px 10px", border: "1px solid var(--border-strong)", borderRadius: 9, fontFamily: "inherit", fontSize: 13, background: "var(--surface2)", color: "var(--text-1)", outline: "none" }} />
          <button onClick={search} disabled={busy} style={ibtn}>ค้นหา</button>
          <button onClick={onClose} style={Object.assign({}, ibtn, { color: "var(--tint-red-tx)" })}>ปิด</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <div ref={boxRef} style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 500, color: "#ff3b30", fontSize: 30, fontWeight: 700, textShadow: "0 0 4px #fff, 0 0 4px #fff" }}>⌖</div>
          {!ready && !err && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-2)", fontSize: 13, fontWeight: 600 }}>กำลังโหลดแผนที่…</div>}
          {err && <div style={{ position: "absolute", left: 10, bottom: 10, background: "var(--tint-red-tx)", color: "#fff", padding: "6px 10px", borderRadius: 8, fontSize: 12, zIndex: 600, maxWidth: "80%" }}>{err}</div>}
        </div>
        <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1, lineHeight: 1.4 }}>เลื่อน/ซูมให้เป้า <b style={{ color: "#ff3b30" }}>⌖</b> อยู่กลางบ้าน แล้วกด "ใช้พื้นที่นี้" · ทิศเหนือ = ด้านบนเสมอ · ซูมเยอะ = ละเอียด</span>
          <button onClick={use} disabled={busy || !ready}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: (busy || !ready) ? "var(--surface3)" : "var(--primary)", color: "#fff", fontWeight: 800, fontFamily: "inherit", fontSize: 14, cursor: (busy || !ready) ? "default" : "pointer", whiteSpace: "nowrap" }}>{busy ? "กำลังจับภาพ…" : "✓ ใช้พื้นที่นี้"}</button>
        </div>
      </div>
    </div>
  );
}

/* ══ ดูตัวอย่างแบบผังติดตั้งก่อนโหลด ══
   วาดด้วยโค้ดชุดเดียวกับที่เขียนไฟล์ DXF แค่คายออกมาเป็น SVG แทน (ดู pgSvg ใน dxf.jsx)
   สิ่งที่เห็นบนจอจึงเป็นแผ่นเดียวกับที่จะได้ ไม่ใช่ภาพจำลองคนละชุด
   ตัวอย่างพื้นหลังเป็นสีขาวเหมือนกระดาษ ส่วนใน AutoCAD จะเป็นพื้นดำตามค่าปริยายของโปรแกรม */
function P3SetPreview({ prep, onClose, onDownload, busy }) {
  const cur = ((prep && prep.sheets) || [])[0];
  const svg = React.useMemo(() => {
    if (!cur) return "";
    try { return cur.make(true); } catch (e) { return '<p style="padding:16px">วาดตัวอย่างไม่สำเร็จ: ' + e.message + "</p>"; }
  }, [cur]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(8,20,14,.6)", display: "flex", padding: 12 }}>
      <div style={{ flex: 1, minHeight: 0, background: "var(--surface)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
        <div style={{ padding: 10, borderBottom: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--text-1)", whiteSpace: "nowrap" }}>ตัวอย่างแบบผังติดตั้ง</span>
          <span style={{ flex: 1 }} />
          <button className="p3-b" onClick={onDownload} disabled={!!busy}>
            <P3Icon name="doc" size={14} />{busy ? "กำลังโหลด…" : "ดาวน์โหลด DXF"}</button>
          <button className="p3-b" onClick={onClose} disabled={!!busy}>ปิด</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#4a4a4a", padding: 14, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <div style={{ width: "100%", maxWidth: 1400, boxShadow: "0 6px 24px rgba(0,0,0,.5)" }}
            dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div style={{ padding: "7px 12px", borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-2)" }}>
          A3 แนวนอน 420 × 297 มม. · ตั้งค่าสั่งพิมพ์มาให้แล้ว เปิดใน AutoCAD กด Ctrl+P ได้เลย
          {prep && prep.files.length ? " · มีไฟล์ภาพแนบ " + prep.files.length + " ไฟล์ ต้องเก็บไว้โฟลเดอร์เดียวกับ .dxf" : ""}
        </div>
      </div>
    </div>
  );
}

/* ── โหลด/บันทึกโมเดลของงาน (RTDB หรือ localStorage) ── */
function usePlan3d(jobId) {
  const KEY = "sf_plan3d_" + jobId;
  const [saved, setSaved] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId) { setSaved(null); setLoading(false); return; }
    if (window.FBDB) {
      const ref = window.FBDB.ref("plan3d/" + jobId);
      const h = ref.on("value", (s) => { setSaved(s.val() || null); setLoading(false); });
      return () => ref.off("value", h);
    }
    try { const v = localStorage.getItem(KEY); setSaved(v ? JSON.parse(v) : null); } catch (e) { setSaved(null); }
    setLoading(false);
  }, [jobId]);
  const save = React.useCallback((data) => {
    if (!jobId) return;
    if (window.FBDB) window.FBDB.ref("plan3d/" + jobId).set(data);
    else { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} setSaved(data); }
  }, [jobId]);
  return { saved, loading, save };
}

let _p3Seq = 0;
const p3Id = (p) => (p || "x") + Date.now().toString(36) + (_p3Seq++);

/* เลขผืนถัดไป — ไล่จากเลขที่มีอยู่จริง กันชื่อซ้ำเมื่อลบผืนกลาง ๆ แล้วเพิ่มใหม่ */
function p3NextRoofNo(roofs) {
  let mx = 0;
  (roofs || []).forEach((r) => { const m = /(\d+)\s*$/.exec(r.name || ""); if (m) mx = Math.max(mx, +m[1]); });
  return Math.max(mx, (roofs || []).length) + 1;
}
function p3NewRoof(n) {
  return { id: p3Id("r"), kind: "rect", name: "หลังคา " + n, x: 0, z: 0, w: 8, d: 5, pitch: 15, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {} };
}
/* หลังคาจั่ว: สันหลังคากลาง ลาด 2 ด้าน (A หันทิศ az, B หันตรงข้าม) */
function p3NewGable(n) {
  return { id: p3Id("r"), kind: "gable", name: "หลังคา " + n, x: 0, z: 0, ridge: 8, span: 8, pitch: 20, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {}, sideA: true, sideB: true };
}
/* หลังคาปั้นหยา: 4 ผืนลาดชนสันกลาง (คางหมู A/B + สามเหลี่ยม C/D) — ผืนต่อกันสนิทอัตโนมัติ */
function p3NewHip(n) {
  return { id: p3Id("r"), kind: "hip", name: "หลังคา " + n, x: 0, z: 0, w: 10, d: 7, pitch: 30, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {},
    sideA: true, sideB: true, sideC: false, sideD: false };
}
/* หลังคาโดม: ผิวโค้งส่วนโค้งวงกลม (arch) ยืดยาวไปตามแนวสัน — ใช้กับโรงจอดรถ/โรงงาน/ทางเดินโดม */
function p3NewDome(n) {
  return { id: p3Id("r"), kind: "dome", name: "หลังคา " + n, x: 0, z: 0, ridge: 12, span: 10, rise: 2.5, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {}, maxTilt: 90 };
}
/* เรขาคณิตโดม — คอร์ด (span) + ความสูงโค้ง (rise) → รัศมี, มุมครึ่ง, ความยาวส่วนโค้ง
   จุดบนโค้งที่มุม t ∈ [-th, th]: z = rad·sin t, y = rad·cos t − (rad − rise)  (ชายคาอยู่ y=0, ยอดโดม y=rise) */
function p3DomeGeo(roof) {
  const span = Math.max(1, +roof.span || 10);
  const len = Math.max(1, +roof.ridge || 12);
  const rise = Math.min(span / 2, Math.max(0.15, roof.rise == null ? 2.5 : +roof.rise)); // เกินครึ่งวงกลมแล้วผิวจะย้อนกลับ → หยุดที่ครึ่งวงกลม
  const rad = (span * span / 4 + rise * rise) / (2 * rise);
  const th = Math.asin(Math.min(1, (span / 2) / rad));
  return { span, len, rise, rad, th, arc: 2 * th * rad,
    yAt: (t) => rad * Math.cos(t) - (rad - rise), zAt: (t) => rad * Math.sin(t) };
}
/* กรอบสี่เหลี่ยมที่เล็กที่สุดที่ครอบรูปหลายเหลี่ยม (rotating calipers อย่างง่าย — ลองหมุนตามทุกขอบ)
   → { ang: มุมของด้าน w, w, d, cx, cz } ใช้แปลงผืนที่วาดเองให้เป็นทรงที่ต้องกว้าง×ยาว×ทิศ (เช่น โดม) */
function p3MinRect(pts) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ang = Math.atan2((+b.z || 0) - (+a.z || 0), (+b.x || 0) - (+a.x || 0));
    const c = Math.cos(-ang), s = Math.sin(-ang);
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    pts.forEach((p) => {
      const u = (+p.x || 0) * c - (+p.z || 0) * s, v = (+p.x || 0) * s + (+p.z || 0) * c;
      if (u < minU) minU = u; if (u > maxU) maxU = u;
      if (v < minV) minV = v; if (v > maxV) maxV = v;
    });
    const w = maxU - minU, d = maxV - minV, area = w * d;
    if (!best || area < best.area) {
      const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
      best = { area, ang, w, d, cx: cu * c + cv * s, cz: -cu * s + cv * c };   // หมุนศูนย์กลางกลับพิกัดเดิม
    }
  }
  return best;
}
/* แปลงหลังคาที่วาดเอง (สี่เหลี่ยม/รูปอิสระ) → โดม โดยใช้กรอบสี่เหลี่ยมที่ครอบผืนนั้น
   ด้านยาว = แนวสันโดม, ด้านสั้น = คอร์ด · ย้ายจุดอ้างอิงมาที่กลางกรอบ (pts เดิมเก็บไว้ กดกลับเป็นทรงอิสระได้) */
function p3PolyToDomePatch(roof, buildH) {
  const pts = roof.pts || [];
  if (pts.length < 3) return null;
  const R = p3MinRect(pts);
  if (!R) return null;
  const long = Math.max(R.w, R.d), short = Math.max(1, Math.min(R.w, R.d));
  const ridgeAng = R.w >= R.d ? R.ang : R.ang + Math.PI / 2;    // สันโดมวางตามด้านที่ยาวกว่า
  const ph = p3PhOf(roof);
  const eave = Math.max(0.5, Math.round(((+buildH || 0) + Math.min.apply(null, ph)) * 100) / 100);
  return {
    kind: "dome", skips: {}, rows: 0, cols: 0,
    /* ผิวเปลี่ยนทรงไปเลย ช่องที่เว้น/เพิ่มไว้เดิมใช้ไม่ได้แล้ว → ล้างเซลล์แต่คงค่าตั้งของแต่ละชุดไว้ */
    blocks: p3Blocks(roof).map((b) => ({ id: b.id, orient: b.orient, rows: 0, cols: 0, gap: b.gap, du: 0, dv: 0, rot: 0, tilt: 0, skips: {}, adds: {} })),
    ridge: Math.round(long * 100) / 100,
    span: Math.round(short * 100) / 100,
    rise: Math.min(short / 2, Math.max(0.5, Math.round(short / 5 * 10) / 10)),
    az: ((Math.round(180 + ridgeAng / P3_DEG) % 360) + 360) % 360,
    h: eave, maxTilt: 90,
    x: (+roof.x || 0) + R.cx, z: (+roof.z || 0) + R.cz,
    pts: pts.map((p) => ({ x: (+p.x || 0) - R.cx, z: (+p.z || 0) - R.cz })),   // อิงศูนย์กลางใหม่ → กดกลับแล้วอยู่ที่เดิม
  };
}
/* ผืนทั้ง 4 ของปั้นหยา (พิกัดผิวลาดต่อผืน + การหมุน/ตำแหน่งของแต่ละผืน) */
function p3HipFaces(roof) {
  const pitchR = (+roof.pitch || 0) * P3_DEG;
  const cosP = Math.max(0.25, Math.cos(pitchR));
  const w = Math.max(1, +roof.w || 10), d = Math.max(1, +roof.d || 7);
  const half = d / 2, SL = half / cosP, r = Math.max(0.02, w - d);
  const rise = half * Math.tan(pitchR);
  const trap = [{ x: -w / 2, z: 0 }, { x: w / 2, z: 0 }, { x: r / 2, z: -SL }, { x: -r / 2, z: -SL }];
  const tri = [{ x: -half, z: 0 }, { x: half, z: 0 }, { x: 0, z: -SL }];
  return {
    cosP, w, d, half, SL, r, rise,
    faces: [
      { side: "A", wrapY: 0, tiltZ: half, poly: trap },
      { side: "B", wrapY: Math.PI, tiltZ: half, poly: trap },
      { side: "C", wrapY: -Math.PI / 2, tiltZ: w / 2, poly: tri },
      { side: "D", wrapY: Math.PI / 2, tiltZ: w / 2, poly: tri },
    ],
  };
}
function p3Blank(job) {
  return {
    groundW: 40, photo: null, photoW: 30, photoOpacity: 0.95, photoBright: 0.7, wp: 650, buildH: 0,
    photoRot: 0, photoX: 0, photoZ: 0,   // หมุนรูปโดรน (องศา ตามเข็ม) + เลื่อนตำแหน่งให้ทับแผนที่ (เมตร)
    baseMap: null,   // { url, widthM, lat, lng, zoom } — ผังพื้นจากแผนที่ดาวเทียม (สเกลจริง, เหนือ=บน)
    roofs: [], obstacles: [],
    sun: { month: 4, day: 15, hour: 12, lat: 13.75, lng: 100.5 },
    sys: null,   // สเปคอุปกรณ์ + การต่อสตริง/ไมโคร (ตั้งในเวิร์กสเปซ "ออกแบบระบบ") — ดู solarcalc.jsx
    measures: [],   // เส้นวัดระยะบนผัง — { id, name, kind, pts:[{x,z}], rise } · ดู P3_MEAS_KINDS
  };
}

/* ── หมวดของเส้นวัดระยะ ──
   ตั้งใจให้ตรงกับ "ช่องความยาว" ในระบบถอดวัสดุ BOQ ทีละช่อง ไม่ใช่ป้ายกำกับลอย ๆ
   วัดบนผังดาวเทียม (สเกลจริง) ครั้งเดียว แล้วดึงเข้า BOQ ได้เลย ไม่ต้องพิมพ์ตัวเลขซ้ำ */
const P3_MEAS_KINDS = [
  { k: "cable", th: "สายไฟ", c: 0xF97316 },
  { k: "conduit", th: "ท่อร้อยสาย", c: 0x0EA5E9 },
  { k: "tray", th: "รางเดินสาย", c: 0x8B5CF6 },
  { k: "ladder", th: "บันไดลิง", c: 0xD946EF },
  { k: "walkway", th: "ทางเดิน", c: 0x14B8A6 },
  { k: "guardrail", th: "ราวกันตก", c: 0xE11D48 },
  { k: "other", th: "อื่น ๆ", c: 0x64748B },
];
const p3MeasKind = (k) => P3_MEAS_KINDS.find((x) => x.k === k) || P3_MEAS_KINDS[P3_MEAS_KINDS.length - 1];
/* ระยะรวมของเส้นวัด = ผลรวมช่วงบนผัง (ราบ) + ระยะ "ขึ้น–ลง" ที่กรอกเพิ่ม
   ผังดาวเทียมมองจากบน จึงเห็นแต่ระยะราบ — ช่วงไต่ผนัง/ขึ้นหลังคา ต้องกรอกเองในช่อง rise */
function p3MeasLen(m) {
  const pts = (m && m.pts) || [];
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot((+pts[i].x || 0) - (+pts[i - 1].x || 0), (+pts[i].z || 0) - (+pts[i - 1].z || 0));
  return Math.round((s + Math.abs(+(m && m.rise) || 0)) * 100) / 100;
}

/* ══ ส่งออกแบบเป็นไฟล์ DXF (เปิดใน AutoCAD / DraftSight / LibreCAD) ══
   ออกได้ 2 แผ่น ใช้กรอบกระดาษ A3 + Title Box ชุดเดียวกัน (ดู dxf.jsx)
     1) ผังติดตั้ง — หลังคา/แผง/สิ่งบดบัง/เส้นวัดระยะ ปูทับภาพถ่ายโดรนแบบจาง ๆ
     2) SINGLE LINE DIAGRAM — ไดอะแกรมเส้นเดียวของระบบ สร้างจากสเปคที่ออกแบบไว้

   ผังเขียนที่ 1 หน่วย = 1 เมตร (วัดระยะจริงในโปรแกรม CAD ได้ทันที) กระดาษจึงถูกขยาย
   ตามมาตราส่วนที่จะพิมพ์แทน — พิมพ์ 1:100 บน A3 = กรอบกระดาษกินพื้นที่จริง 42 × 29.7 ม.

   แกน: X ของแบบ = X ของผัง · Y ของแบบ = −Z ของผัง → ทิศเหนืออยู่บน ตามธรรมเนียมเขียนแบบ
   ชื่อภาษาไทยเขียนเป็น \U+XXXX ตามที่ DXF กำหนด ไฟล์จึงเป็น ASCII ล้วนและไม่เพี้ยน
   .dwg เขียนเองไม่ได้ (ไบนารีปิด) ให้เปิดไฟล์นี้แล้ว Save As เอาใน AutoCAD */
const P3_DXF_LAYERS = [
  ["PG-BG", 8, 5], ["PG-ROOF", 7, 35], ["PG-PANEL", 5, 25], ["PG-OBSTACLE", 3, 20],
  ["PG-MEAS-CABLE", 30, 30], ["PG-MEAS-CONDUIT", 140, 30], ["PG-MEAS-TRAY", 200, 30],
  ["PG-MEAS-LADDER", 6, 30], ["PG-MEAS-WALKWAY", 4, 30], ["PG-MEAS-GUARDRAIL", 1, 30], ["PG-MEAS-OTHER", 8, 30],
  ["PG-DIM", 1, 18], ["PG-NORTH", 8, 25], ["PG-NOTE", 8, 18],
];
const p3MeasLayer = (k) => "PG-MEAS-" + String(k || "other").toUpperCase();
/* บันไดมาตราส่วนมาตรฐานงานเขียนแบบ — เลือกตัวที่เล็กที่สุดที่ผังยังลงกระดาษ A3 ได้ */
const P3_SCALES = [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1250, 1500, 2000];

/* ที่วางของรูปพื้นหลังในพิกัดแบบ (เมตร) — ต้องตรงกับที่ฉาก 3D วางไว้เป๊ะ ๆ
   ฉาก 3D หมุนรูปด้วย rotation.y = −มุม เมื่อพลิกเป็นแกนแบบ (Y = −Z) จึงได้มุมหมุนทวนเข็ม = −มุม */
function p3ImgPlace(kind, st, aspect) {
  if (kind === "map") {
    const W = Math.max(2, +(st.baseMap && st.baseMap.widthM) || 30);
    return { cx: 0, cy: 0, w: W, h: W, rot: 0 };
  }
  const w = Math.max(2, +st.photoW || 30);
  return { cx: +st.photoX || 0, cy: -(+st.photoZ || 0), w, h: w * (aspect || 0.75), rot: -(+st.photoRot || 0) };
}
/* มุมล่างซ้ายของรูปหลังหมุนรอบจุดกึ่งกลาง (DXF วางรูปจากมุมนี้) */
function p3ImgCorner(p) {
  const a = (p.rot || 0) * P3_DEG, ca = Math.cos(a), sa = Math.sin(a);
  const ux = -p.w / 2, uy = -p.h / 2;
  return { x: p.cx + ux * ca - uy * sa, y: p.cy + ux * sa + uy * ca };
}

/* ขอบเขตของทุกอย่างที่จะพิมพ์ลงผัง (พิกัดแบบ เมตร) */
function p3PlanBox(st, imgs) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  const put = (x, y) => { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; };
  const add = (x, z) => put(x, -z);
  (st.roofs || []).forEach((r) => {
    try { (p3RoofSurf(r) || []).forEach((f) => (f.pts || []).forEach((p) => add(p.x, p.z))); } catch (e) { /* หลังคาที่ยังตั้งไม่ครบ ข้ามไป */ }
  });
  try { (p3FootAll(st).panels || []).forEach((p) => (p.pts || []).forEach((q) => add(q[0], q[1]))); } catch (e) { /* ยังไม่มีแผง */ }
  (st.obstacles || []).forEach((o) => {
    const w = Math.max(0.5, +o.w || 1), h = Math.max(0.5, +o.d || 1);
    add((+o.x || 0) - w, (+o.z || 0) - h); add((+o.x || 0) + w, (+o.z || 0) + h);
  });
  (st.measures || []).forEach((m) => (m.pts || []).forEach((p) => add(+p.x || 0, +p.z || 0)));
  (imgs || []).forEach((p) => {
    const ang = (p.rot || 0) * P3_DEG, ca = Math.cos(ang), sa = Math.sin(ang);
    [[-p.w / 2, -p.h / 2], [p.w / 2, -p.h / 2], [p.w / 2, p.h / 2], [-p.w / 2, p.h / 2]]
      .forEach(([u, v]) => put(p.cx + u * ca - v * sa, p.cy + u * sa + v * ca));
  });
  if (!isFinite(a)) { a = -10; b = -10; c = 10; d = 10; }
  return { minX: a, minY: b, maxX: c, maxY: d };
}

/* องศา-ลิปดา-ฟิลิปดา · %%d คือรหัสของ "องศา" ในไฟล์ DXF */
function p3Dms(v, pos, neg) {
  const s = v < 0 ? neg : pos, x = Math.abs(+v || 0);
  const dg = Math.floor(x), mn = Math.floor((x - dg) * 60), sc = ((x - dg) * 60 - mn) * 60;
  return dg + "%%d" + String(mn).padStart(2, "0") + "'" + sc.toFixed(1) + '"' + s;
}
/* ข้อมูลที่จะกรอกลง Title Box — ดึงจากงานและจากสเปคที่ออกแบบไว้ ไม่ต้องพิมพ์ซ้ำ */
function p3SheetInfo(st, job, o) {
  o = o || {};
  const bm = st.baseMap || {};
  const lat = +bm.lat, lng = +bm.lng;
  const total = p3CountAll(st);
  const kwp = Math.round(total * (+st.wp || 650) / 10) / 100;
  const d = new Date();
  const dd = (n) => String(n).padStart(2, "0");
  return {
    address: [(job && job.address) || "", (job && job.province) || ""].filter(Boolean).join(" "),
    location: isFinite(lat) && isFinite(lng) ? p3Dms(lat, "N", "S") + "  " + p3Dms(lng, "E", "W") : "-",
    project: "SOLAR CELL ROOFTOP " + kwp.toFixed(2) + " kWp",
    owner: (job && job.name) || "-",
    status: "construct",
    projectNo: (job && job.code) || "-",
    drawingNo: "PG-" + ((job && job.code) || "0000") + "-" + (o.sheet || "PLAN"),
    scale: o.scale || "AS SHOW",
    date: dd(d.getDate()) + "/" + dd(d.getMonth() + 1) + "/" + d.getFullYear(),
    sheetNo: o.sheetNo || "1/1",
    rev: "0",
  };
}

/* ── ตาราง "ระยะสายหน้างาน โดยประมาณ" ──
   รวมความยาวเส้นวัดในผังตามหมวด/ตามชื่อที่ตั้งไว้ แล้วปัดขึ้นเป็นเมตรเต็ม
   เป็นระยะที่วัดจากผังจริง ไม่ใช่ตัวเลขที่เดาให้ — ถ้ายังไม่ได้วัดก็ไม่ต้องมีตาราง */
function p3CableRows(st) {
  const sum = {};
  (st.measures || []).forEach((m) => {
    const nm = (m.name || "").trim() || p3MeasKind(m.kind).th;
    sum[nm] = (sum[nm] || 0) + p3MeasLen(m);
  });
  return Object.keys(sum).map((n) => [n, Math.ceil(sum[n]), "m."]);
}

/* ── ตารางสรุปโครงการท้ายผัง — รูปแบบเดียวกับที่บริษัทใช้อยู่ ── */
function p3PlanSpec(st, job, M) {
  const kwp = Math.round(p3CountAll(st) * (+st.wp || 650) / 10) / 100;
  const I = p3SheetInfo(st, job, {});
  const perInv = Math.round(M.panel.count / Math.max(1, M.units.length) * 10) / 10;
  return [
    ["PROJECT", "SOLAR ROOFTOP " + kwp.toFixed(2) + " kWp."],
    ["LOCATION", I.location],
    ["INVERTER", M.inv.model + "   " + M.units.length + " Ea.", "PV MODULE / INVERTER", perInv + " MODULE"],
    ["PV MODULE", M.panel.model + "   " + M.panel.count + " Ea.", "BATTERY", M.batt ? M.batt.kwh + " kWh." : "-"],
    ["COMBINER", "COMBINER BOX   1 Ea.", "COMBINER / PV MODULE", M.panel.count + " MODULE"],
  ];
}

/* ตาราง AREA — แยกตามผืนหลังคา ผืนไหนไม่มีแผงก็ไม่ต้องขึ้น */
function p3AreaRows(st, M) {
  const wp = +st.wp || 650;
  const rows = [["AREA", "PV MODULE", "CAPACITY", "INVERTER", "STRING", "BACK UP", "REMARK"]];
  const roofs = (st.roofs || []).map((r, i) => {
    let n = 0;
    try { n = p3Panels(r).count; } catch (e) { n = 0; }
    return { name: (r.name || "").trim() || ("ROOFTOP " + (i + 1)), n: n };
  }).filter((r) => r.n > 0);
  const tot = roofs.reduce((s, r) => s + r.n, 0) || M.panel.count;
  const invOf = (n) => Math.round(M.units.length * n / Math.max(1, tot));
  roofs.forEach((r) => rows.push([r.name.toUpperCase(), r.n, (r.n * wp / 1000).toFixed(2) + " kWp.",
    invOf(r.n) || "-", M.mode === "string" ? "-" : "-", M.batt ? "YES" : "-", "-"]));
  rows.push(["TOTAL", tot, (tot * wp / 1000).toFixed(2) + " kWp.", M.units.length,
    "-", M.batt ? "YES" : "-", "-"]);
  return rows;
}

/* ── แผ่นที่ 1 · ผังติดตั้ง ──
   media.imgs = [{ kind:"map"|"photo", file, pxW, pxH }] ที่โหลดขนาดจริงมาแล้ว (ดู p3ExportDxf) */
function p3Dxf(st, job, media) {
  media = media || {};
  const imgs = (media.imgs || []).map((im) =>
    Object.assign({}, im, p3ImgPlace(im.kind, st, (+im.pxH || 3) / (+im.pxW || 4))));
  const B = p3PlanBox(st, imgs);

  /* ── แบ่งกรอบเขียนแบบเป็นสองคอลัมน์แบบแบบจริง ──
     ซ้าย = ตัวผัง · ขวา = หัวเรื่อง เข็มทิศ รูปตัดแผง ตารางระยะสาย ตารางสรุปโครงการ
     เลือกมาตราส่วนที่เล็กที่สุดที่ผังยังลงคอลัมน์ซ้ายได้ (เว้นขอบไว้หายใจ) */
  const IN = PG_SHEET.IN;
  const AW = IN.x1 - PG_SHEET.TB - IN.x0;                // ความกว้างกรอบเขียนแบบทั้งหมด
  const P3_COL = 128;                                    // คอลัมน์ขวา (หัวเรื่อง/มาตราส่วน/เข็มทิศ)
  const RH = 4.6;

  /* ผังกินความสูงเต็มกรอบ — ตารางสรุปโครงการ ตาราง AREA และรูปตัดแผงเอาออกแล้ว
     จะได้เห็นภาพถ่ายกับผังใหญ่ที่สุดเท่าที่กระดาษ A3 ให้ได้ */
  const A = { w: AW - P3_COL - 8, h: IN.y1 - IN.y0 };
  const needW = Math.max(0.5, B.maxX - B.minX), needH = Math.max(0.5, B.maxY - B.minY);
  const SC = P3_SCALES.find((s) => needW * 1000 <= A.w * 0.94 * s && needH * 1000 <= A.h * 0.94 * s)
    || P3_SCALES[P3_SCALES.length - 1];
  const k = SC / 1000;                     // 1 มม.บนกระดาษ = k เมตรจริง

  const doc = pgDoc({ units: "m", ltscale: k }, media.svg);
  P3_DXF_LAYERS.forEach((L) => doc.layer(L[0], L[1], "CONTINUOUS", L[2]));
  pgTableLayers(doc);

  /* วางกึ่งกลางผังในพื้นที่ที่เหลือ (ซ้ายของคอลัมน์ขวา) */
  const px = IN.x0 + A.w / 2, py = IN.y0 + A.h / 2;
  const ox = (B.minX + B.maxX) / 2 - px * k;
  const oy = (B.minY + B.maxY) / 2 - py * k;

  const sheet = pgSheet(doc, { k, ox, oy, info: p3SheetInfo(st, job, { sheet: "PLAN", scale: "1:" + SC, sheetNo: media.sheetNo || "1/1" }) });
  const pen = sheet.pen;
  const TH = 2.0 * k;                      // ตัวหนังสือสูง 2 มม. บนกระดาษเสมอ ไม่ว่าจะย่อขยายแค่ไหน

  /* ── ภาพถ่ายทางอากาศเป็นพื้นหลัง ──
     ตั้ง fade ไว้สูง ให้ภาพจางจนเส้นแบบเด่นกว่า และปิดกรอบรูปไว้ในไฟล์แล้ว
     ตัวไฟล์รูปไม่ได้ฝังใน .dxf (รูปแบบนี้ไม่รองรับ) — ต้องวางไฟล์รูปไว้โฟลเดอร์เดียวกัน */
  imgs.forEach((p) => {
    const c = p3ImgCorner(p);
    doc.image("PG-BG", { file: p.file, href: p.href, pxW: p.pxW, pxH: p.pxH, x: c.x, y: c.y, w: p.w, h: p.h, rot: p.rot, fade: p.fade == null ? 72 : p.fade });
  });

  /* ── หลังคา — วาดทีละผิว (ผืนลาด/คางหมู/สามเหลี่ยมของปั้นหยา) ที่ฉายลงผัง
     ได้เส้นสัน/เส้นตะเข้มาด้วยในตัว และตรงกับที่ระบบใช้วางแผงจริง ── */
  const poly = (lay, pts, closed) => doc.pline(lay, pts.map((p) => [p[0], -p[1]]), closed);
  (st.roofs || []).forEach((roof) => {
    let faces = [];
    try { faces = p3RoofSurf(roof) || []; } catch (e) { faces = []; }
    faces.forEach((f) => poly("PG-ROOF", (f.pts || []).map((p) => [p.x, p.z]), true));
    if (!faces.length && roof.kind === "poly" && Array.isArray(roof.pts)) {
      poly("PG-ROOF", roof.pts.map((p) => [(+p.x || 0) + (+roof.x || 0), (+p.z || 0) + (+roof.z || 0)]), true);
    }
  });

  // แผงทีละแผง — รอยเท้าสี่มุมจริง (หลังคาเอียง/ชุดแผงหมุนแล้วไม่ใช่สี่เหลี่ยมมุมฉากเสมอ)
  let foot = { panels: [] };
  try { foot = p3FootAll(st); } catch (e) { foot = { panels: [] }; }
  (foot.panels || []).forEach((p) => poly("PG-PANEL", p.pts, true));

  // สิ่งบดบัง — ต้นไม้เป็นวงกลม อย่างอื่นเป็นกรอบสี่เหลี่ยมหมุนตามที่ตั้งไว้
  (st.obstacles || []).forEach((o) => {
    const x = +o.x || 0, z = +o.z || 0, w = Math.max(0.1, +o.w || 1), d = Math.max(0.1, +o.d || 1);
    if (o.kind === "tree") { doc.circle("PG-OBSTACLE", x, -z, Math.max(w, d) / 2); return; }
    const a2 = (+o.rot || 0) * P3_DEG, ca = Math.cos(a2), sa = Math.sin(a2);
    poly("PG-OBSTACLE", [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]
      .map(([u, v]) => [x + u * ca - v * sa, z + u * sa + v * ca]), true);
  });

  /* เส้นวัดระยะ — แยก layer ตามหมวด (ปิดสายไฟดูเฉพาะรางได้)
     ตัวเลขระยะอยู่ layer PG-DIM · ชื่อที่พิมพ์เองอยู่ PG-NOTE */
  (st.measures || []).forEach((m) => {
    const pts = (m.pts || []).map((p) => [+p.x || 0, -(+p.z || 0)]);
    if (pts.length < 2) return;
    const lay = p3MeasLayer(m.kind);
    doc.pline(lay, pts, false);
    pts.forEach((p) => doc.circle(lay, p[0], p[1], TH * 0.3));
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (seg <= TH * 3) continue;
      doc.text("PG-DIM", (pts[i][0] + pts[i - 1][0]) / 2, (pts[i][1] + pts[i - 1][1]) / 2 + TH * 0.5,
        TH, seg.toFixed(2), { align: 1 });
    }
    const last = pts[pts.length - 1];
    doc.text("PG-DIM", last[0], last[1] - TH * 2.0, TH * 1.15, "TOTAL " + p3MeasLen(m).toFixed(2) + " m", { align: 1 });
    if ((m.name || "").trim()) doc.text("PG-NOTE", last[0], last[1] - TH * 3.5, TH, m.name.trim(), { align: 1 });
  });

  /* ── ป้ายกำกับแผงทีละแผง PV PANEL-1..n ──
     เรียงจากบนลงล่าง ซ้ายไปขวา (อ่านตามลำดับเดียวกับที่ช่างไล่ติดตั้ง)
     ถ้าแผงเยอะจนป้ายเล็กกว่าจะอ่านออก ก็ไม่ต้องใส่ ปล่อยให้ดูจากตารางสรุปแทน */
  const fp = (foot.panels || []).slice();
  const pw = fp.length ? Math.min.apply(null, fp.map((p) => {
    const xs = p.pts.map((q) => q[0]), zs = p.pts.map((q) => q[1]);
    return Math.min(Math.max.apply(null, xs) - Math.min.apply(null, xs),
      Math.max.apply(null, zs) - Math.min.apply(null, zs));
  })) : 0;
  /* ป้ายต้องกว้างไม่เกินตัวแผง ไม่งั้นชื่อจะเกยกันจนอ่านไม่ออกทั้งผัง
     วัดจากป้ายที่ยาวที่สุด (แผงใบสุดท้าย) เทียบกับความกว้างแผงบนกระดาษจริง */
  const lh = Math.min(TH * 0.9, pw * 0.34);
  const labW = ("PV PANEL-" + fp.length).length * (lh / k) * 0.62;   // มม.บนกระดาษ
  if (fp.length && lh / k >= 1.3 && pw / k >= labW) {
    fp.sort((a, b) => (a.cz - b.cz) || (a.cx - b.cx));
    fp.forEach((p, i) => doc.text("PG-NOTE", p.cx, -p.cz - lh / 2, lh, "PV PANEL-" + (i + 1), { align: 1, valign: 1 }));
  }

  /* ── สัญลักษณ์ประจำแผ่น (วางเป็นตำแหน่งบนกระดาษ ไม่เลื่อนตามผัง) ── */
  const AR = sheet.area;

  // มาตราส่วนเส้น — พิมพ์ย่อ/ขยายแล้วยังอ่านระยะจริงได้จากเส้นนี้
  const barM = SC / 1000 * 40, bx = AR.x0 + 4, by = AR.y0 + 4;
  pen.rect("PG-NORTH", bx, by, 40, 2.2);
  pen.solid("PG-NORTH", [bx, by], [bx + 10, by], [bx + 10, by + 2.2], [bx, by + 2.2]);
  pen.solid("PG-NORTH", [bx + 20, by], [bx + 30, by], [bx + 30, by + 2.2], [bx + 20, by + 2.2]);
  [0, 0.5, 1].forEach((f) => pen.text("PG-NORTH", bx + 40 * f, by + 3, 2.2, (barM * f).toFixed(0), { align: 1, valign: 1 }));
  pen.text("PG-NORTH", bx + 44, by + 0.4, 2.2, "METRES   SCALE 1:" + SC);

  /* ── คอลัมน์ขวา: หัวเรื่อง + มาตราส่วน + เข็มทิศ → ตารางระยะสาย ── */
  const RX1 = AR.x1 - 2, RX0 = RX1 - P3_COL, RW = P3_COL;

  pgSheetTitle(pen, RX0, AR.y1 - 12, "OVERALL LAYOUT", 7.4, RW - 30, 0);
  pen.text("PG-NOTE", RX0, AR.y1 - 19, 2.4, "SCALE");
  pen.text("PG-NOTE", RX1 - 28, AR.y1 - 18, 2.4, "A1=1:" + Math.round(SC / 1.414));
  pen.text("PG-NOTE", RX1 - 28, AR.y1 - 22.5, 2.4, "A3=1:" + SC);
  pgCompass(pen, RX1 - 12, AR.y1 - 40, 6.5);

  /* ตารางระยะสายหน้างาน — ขึ้นเฉพาะเมื่อวัดระยะไว้จริง ไม่มีก็ไม่ต้องมีตารางเปล่า */
  const cab = p3CableRows(st);
  if (cab.length) {
    pgGrid(pen, RX0, AR.y0 + 4 + (cab.length + 2) * RH, RW, [2.4, 1, 0.6],
      [["#", "ระยะสายหน้างาน โดยประมาณ"], ["ประเภท", "ระยะ", ""]].concat(cab),
      { rh: RH, th: 2.2, align: [0, 2, 0], headRow: 1 });
  }

  pen.text("PG-NOTE", AR.x0 + 4, AR.y0 + 9, 2.2,
    st.baseMap ? "SCALE TAKEN FROM SATELLITE IMAGERY" : "SCALE NOT TAKEN FROM MAP - VERIFY ON SITE");

  return doc.build();
}

/* ── ผังมองจากด้านบน: รอยเท้าของแผงแต่ละแผงในพิกัดโลก (เมตร) ──
   ใช้ทรานส์ฟอร์มชุดเดียวกับที่ renderer ใช้วางแผงจริง (กลุ่มหลังคา → เอียง → หมุนบล็อก → ขาตั้ง)
   คืน [{ key, uid, blk, side, pts:[[x,z]×4], cx, cz }] · pts = สี่มุมของแผงหลังฉายลงระนาบพื้น
   ทำไมต้องฉายเป็นสี่มุม: หลังคาเอียง/ชุดแผงหมุน/ขาตั้งเอียง ทำให้รอยเท้าไม่ใช่สี่เหลี่ยมมุมฉากเสมอ */
/* ── โซ่ทรานส์ฟอร์มของหลังคาผืนหนึ่ง (ใช้ร่วมกันระหว่างรอยเท้าแผงกับผิวหลังคา) ──
   chain(side, v, isDir) : จุด/ทิศ ในกรอบของด้านนั้น → กรอบหลังคา (ยังไม่หมุน/เลื่อนตัวหลังคา)
   world(v, isDir)       : กรอบหลังคา → พิกัดโลก (isDir = เป็นเวกเตอร์ทิศ ไม่ต้องบวกตำแหน่ง)
   ตรงกับที่ renderer หมุน/เลื่อนกลุ่มจริงเป๊ะ ๆ */
function p3Xf(roof, pan) {
  const pitchR = (+roof.pitch || 0) * P3_DEG;
  const rotY = -(((+roof.az || 180) - 180) * P3_DEG);            // เท่ากับ g.rotation.y ของ renderer
  const RX = (v, a) => ({ x: v.x, y: v.y * Math.cos(a) - v.z * Math.sin(a), z: v.y * Math.sin(a) + v.z * Math.cos(a) });
  const RY = (v, a) => ({ x: v.x * Math.cos(a) + v.z * Math.sin(a), y: v.y, z: -v.x * Math.sin(a) + v.z * Math.cos(a) });
  const half = (+roof.span || 8) / 2;
  const hip = roof.kind === "hip" ? ((pan && pan.hip) || p3HipFaces(roof)) : null;
  const hipF = {};
  if (hip) hip.faces.forEach((f) => { hipF[f.side] = f; });
  const chain = (side, v, isDir) => {
    let p = { x: v.x, y: v.y, z: v.z };
    if (roof.kind === "poly" || roof.kind === "dome") return p;   // อยู่ในกรอบหลังคาอยู่แล้ว
    if (roof.kind === "hip") {
      const f = hipF[side] || { wrapY: 0, tiltZ: 0 };
      p = RX(p, pitchR);
      if (!isDir) p.z += f.tiltZ;
      return RY(p, f.wrapY);
    }
    if (roof.kind === "gable") {
      p = RX(p, pitchR);
      if (!isDir) p.z += half;
      return side === "B" ? RY(p, Math.PI) : p;
    }
    return RX(p, pitchR);                                          // สี่เหลี่ยม
  };
  const world = (v, isDir) => {
    const w = RY(v, rotY);
    return isDir ? w : { x: w.x + (+roof.x || 0), y: w.y, z: w.z + (+roof.z || 0) };
  };
  return { chain, world, RX, RY, pitchR, rotY };
}

/* ── ผิวหลังคาในพิกัดโลก (ใช้เป็น "ตัวบังแสง" ตอนคำนวณเงา) ──
   คืน [{ roofId, side, pts:[{x,y,z}...] }] — ใช้ขอบผืนชุดเดียวกับที่ใช้วางแผง จึงตรงกับที่เห็นในจอ
   โดมคืนค่าว่าง (ผิวโค้ง ใช้ตัวแผงเองเป็นตัวบังแทน) */
function p3RoofSurf(roof) {
  const pan = p3Panels(roof);
  if (roof.kind === "dome" || !pan.faces || !pan.toMesh) return [];
  const X = p3Xf(roof, pan);
  return pan.faces.map((f) => ({
    roofId: roof.id, side: f.side || null,
    pts: (f.poly || []).map((q) => {
      const m = pan.toMesh({ u: q.x, v: q.z });
      const c = X.world(X.chain(f.side, { x: m.x, y: m.y || 0, z: m.z }, false), false);
      return { x: c.x, y: c.y + (+roof.h || 0), z: c.z };
    }),
  })).filter((s) => s.pts.length >= 3);
}

function p3Foot(roof) {
  const pan = p3Panels(roof);
  const blocks = pan.blocks || [];
  const X = p3Xf(roof, pan);
  const RX = X.RX, RY = X.RY, chain = X.chain, world = X.world;

  const out = [];
  (pan.list || []).forEach((p) => {
    if (p.skip || p.slot) return;
    const blk = blocks[p.blk] || { rot: 0, tilt: 0 };
    const ry = p3BlkRy(roof, blk), T = (+blk.tilt || 0) * P3_DEG;
    /* จุดกึ่งกลางแผงในกรอบของด้านนั้น ๆ */
    const c0 = roof.kind === "dome" || roof.kind === "poly"
      ? { x: p.x, y: p.y || 0, z: p.z }
      : { x: p.x, y: 0, z: p.z };
    /* แกนกว้าง/ลึกของตัวแผง (หมุนตามชุดแผง + ขาตั้งเอียง) */
    const cw = world(chain(p.side, c0, false), false);
    let U, V;
    if (roof.kind === "poly" && pan.plane) {
      /* ทรงอิสระ: แผงวางบน "ระนาบเอียง" ของผืน แกนของแผงจึงเป็น u/v ของระนาบ ไม่ใช่แกนโลก
         (renderer ใช้ basis (u, n, −v) แล้วหมุน YXZ ทับ — คิดตามนั้นเป๊ะ ๆ) */
      const P = pan.plane, cr = Math.cos(ry), sr = Math.sin(ry), cT = Math.cos(T), sT = Math.sin(T);
      const mix = (a, b, c) => ({ x: a * P.u.x + b * P.n.x - c * P.v.x, y: a * P.u.y + b * P.n.y - c * P.v.y, z: a * P.u.z + b * P.n.z - c * P.v.z });
      U = mix(cr * p.pw / 2, 0, -sr * p.pw / 2);
      V = mix(cT * sr * p.pd / 2, -sT * p.pd / 2, cT * cr * p.pd / 2);
    } else if (roof.kind === "dome") {
      /* โดม: แผงแนบส่วนโค้ง เอียงตามมุม rx ของแถวนั้น */
      U = world(chain(null, { x: p.pw / 2, y: 0, z: 0 }, true), true);
      V = world(chain(null, RX({ x: 0, y: 0, z: p.pd / 2 }, p.rx || 0), true), true);
    } else {
      U = world(chain(p.side, RY({ x: p.pw / 2, y: 0, z: 0 }, ry), true), true);
      V = world(chain(p.side, RY(RX({ x: 0, y: 0, z: p.pd / 2 }, T), ry), true), true);
    }
    const pts = [[cw.x - U.x - V.x, cw.z - U.z - V.z], [cw.x + U.x - V.x, cw.z + U.z - V.z],
                 [cw.x + U.x + V.x, cw.z + U.z + V.z], [cw.x - U.x + V.x, cw.z - U.z + V.z]];
    /* ── ข้อมูลสามมิติเต็ม ๆ ไว้ให้ตัวคำนวณเงาใช้ยิงลำแสง (ดู ivShade* ใน solariv.jsx) ──
       cy = ความสูงจริงของกลางแผงเหนือพื้น (บวกความสูงหลังคาเข้าไปแล้ว)
       u/v = ครึ่งด้านกว้าง/ครึ่งด้านลึกของแผงเป็นเวกเตอร์ 3 มิติ · n = เวกเตอร์ตั้งฉากหน้าแผง */
    const cy = cw.y + (+roof.h || 0);
    const n0 = { x: V.y * U.z - V.z * U.y, y: V.z * U.x - V.x * U.z, z: V.x * U.y - V.y * U.x };
    const nl = Math.hypot(n0.x, n0.y, n0.z) || 1;
    const n = { x: n0.x / nl, y: n0.y / nl, z: n0.z / nl };
    out.push({ key: p.key, uid: roof.id + "|" + p.key, roofId: roof.id, blk: p.blk, side: p.side || null,
      rx: p.rx || 0, cx: cw.x, cz: cw.z, pts,
      cy, u: U, v: V, n: n.y < 0 ? { x: -n.x, y: -n.y, z: -n.z } : n });
  });
  return out;
}

/* รอยเท้าของทุกผืน + ขอบเขตผัง (ใช้จัดกรอบภาพ 2D) */
function p3FootAll(st) {
  const panels = [];
  const outlines = [];
  (st.roofs || []).forEach((roof) => {
    p3Foot(roof).forEach((f) => panels.push(Object.assign({ roofName: roof.name }, f)));
    /* เส้นขอบผืนหลังคา — ใช้เส้นเดียวกับที่ระบบใช้วางแผง จึงตรงกับของจริงเสมอ */
    if (roof.kind === "poly" && Array.isArray(roof.pts)) {
      outlines.push({ roofId: roof.id, pts: roof.pts.map((p) => [(+p.x || 0) + (+roof.x || 0), (+p.z || 0) + (+roof.z || 0)]) });
    }
  });
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  const eat = (x, z) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; };
  panels.forEach((p) => p.pts.forEach((q) => eat(q[0], q[1])));
  outlines.forEach((o) => o.pts.forEach((q) => eat(q[0], q[1])));
  if (minX > maxX) { minX = -5; maxX = 5; minZ = -5; maxZ = 5; }
  return { panels, outlines, bounds: { minX, maxX, minZ, maxZ } };
}

/* ── ตำแหน่งดวงอาทิตย์ (ประมาณการ ใช้เพื่อจำลองเงา) → { alt, az } องศา ── */
function p3SunPos(sun) {
  const N = Math.min(365, Math.max(1, Math.round((sun.month - 1) * 30.4 + sun.day)));
  const decl = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365);
  const solarHour = sun.hour + ((+sun.lng || 100.5) - 105) / 15; // เทียบเวลาไทย (UTC+7 → 105°E)
  const H = 15 * (solarHour - 12);
  const lat = (+sun.lat || 13.75) * P3_DEG, d = decl * P3_DEG, h = H * P3_DEG;
  const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(d) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-9))));
  if (H > 0) az = 2 * Math.PI - az;
  return { alt: alt / P3_DEG, az: az / P3_DEG };
}

/* ── geometry helpers (หลังคาทรงอิสระ) ── */
function p3InPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, zi = pts[i].z, xj = pts[j].x, zj = pts[j].z;
    if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / ((zj - zi) || 1e-9) + xi)) inside = !inside;
  }
  return inside;
}
function p3Area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].z - pts[i].z);
  return Math.abs(a / 2);
}
/* พิกัดผิวหลังคาทรงอิสระ — พับรอบ "ขอบที่เลือก" (roof.hinge = index ขอบ เริ่ม pts[i]→pts[i+1])
   หมุนให้ขอบพับนอนแนวนอน → เลื่อนขอบพับไป z=0 → ยืดตามลาด (1/cosP)
   สองผืนที่แชร์ขอบพับเส้นเดียวกัน จะพับรอบแกนเดียวกัน = ขอบติดกันทุกองศา (แก้ปัญหาสันหลังคาไม่ต่อ) */
function p3SurfInfo(roof) {
  const pts = roof.pts || [];
  const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
  if (pts.length < 2) return { loc: [], surf: [], zoff: 0, cosP, rot: 0, hi: 0 };
  const n = pts.length;
  const hi = (((Math.round(+roof.hinge || 0)) % n) + n) % n;
  const A = pts[hi], B = pts[(hi + 1) % n];
  const rotate = (r) => pts.map((p) => ({
    x: (+p.x || 0) * Math.cos(r) + (+p.z || 0) * Math.sin(r),
    z: -(+p.x || 0) * Math.sin(r) + (+p.z || 0) * Math.cos(r),
  }));
  // หมุนให้ขอบพับ (A→B) นอนขนานแกน x
  let rot = -Math.atan2((+B.z || 0) - (+A.z || 0), (+B.x || 0) - (+A.x || 0));
  let loc = rotate(rot);
  let hz = loc[hi].z;
  // ให้รูปอยู่ฝั่ง -z ของขอบพับ (คงคอนเวนชัน "ยกปลาย -z ขึ้น") ถ้าศูนย์กลางอยู่ฝั่ง +z ให้หมุนกลับ 180°
  const cz = loc.reduce((s, p) => s + p.z, 0) / n;
  if (cz > hz) { rot += Math.PI; loc = rotate(rot); hz = loc[hi].z; }
  const zoff = hz;
  const surf = loc.map((p) => ({ x: p.x, z: (p.z - zoff) / cosP }));
  return { loc, surf, zoff, cosP, rot, hi };
}

/* ── โมเดลใหม่: หลังคาทรงอิสระ = มุมแต่ละจุดมี "ความสูง" (roof.ph[i]) ──
   มุมที่ทับกันข้ามผืน = ความสูงเดียวกัน (เชื่อมจุด) → ต่อกันเสมอ ทำได้ทุกทรง */
function p3PhOf(roof) {
  const pts = roof.pts || [];
  const base = roof.h == null ? 3 : +roof.h;
  const ph = Array.isArray(roof.ph) ? roof.ph.slice(0, pts.length) : [];
  for (let i = 0; i < pts.length; i++) if (ph[i] == null) ph[i] = base;
  return ph;
}
/* เวกเตอร์ตั้งฉากของรูปหลายเหลี่ยม 3D (วิธี Newell) — ทนต่อจุดที่ไม่เรียบเป๊ะ */
function p3Newell(vs) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i], b = vs[(i + 1) % vs.length];
    nx += (a.y - b.y) * (a.z + b.z);
    ny += (a.z - b.z) * (a.x + b.x);
    nz += (a.x - b.x) * (a.y + b.y);
  }
  const L = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / L, y: ny / L, z: nz / L };
}
/* ระนาบ best-fit ของผืน (จากมุม x,z + ความสูง) → ศูนย์กลาง c, แกน u (แนวนอนในระนาบ), v (แนวลาด), n (ตั้งฉาก) */
function p3PolyPlane(roof) {
  const pts = roof.pts || [];
  const nP = pts.length;
  if (nP < 3) return null;
  const ph = p3PhOf(roof);
  const vs = pts.map((p, i) => ({ x: +p.x || 0, y: ph[i], z: +p.z || 0 }));
  let n = p3Newell(vs);
  if (n.y < 0) n = { x: -n.x, y: -n.y, z: -n.z }; // ให้ตั้งฉากชี้ขึ้น
  const c = {
    x: vs.reduce((s, v) => s + v.x, 0) / nP,
    y: vs.reduce((s, v) => s + v.y, 0) / nP,
    z: vs.reduce((s, v) => s + v.z, 0) / nP,
  };
  // u = แนวนอนในระนาบ (ตั้งฉากกับแนวลาด) = up × n ; ถ้าเกือบราบ (n ตั้งตรง) ใช้แกน x
  let u = { x: n.z, y: 0, z: -n.x };
  const lu = Math.hypot(u.x, u.z);
  if (lu < 1e-6) u = { x: 1, y: 0, z: 0 }; else u = { x: u.x / lu, y: 0, z: u.z / lu };
  // v = n × u (แนวลาดในระนาบ)
  const v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };
  return { c, u, v, n, vs, tiltCos: Math.max(0.05, Math.abs(n.y)) };
}
/* ── บล็อกแผง ───────────────────────────────────────────────────────────────
   ผืนหนึ่งวางแผงได้หลายชุด (บล็อก) แต่ละชุดตั้งแยกกัน: แนวตั้ง/นอน · แถว-คอลัมน์ · เลื่อน · หมุน · ขาตั้งเอียง
   ผืนเก่าที่ยังไม่มี blocks จะถูกอ่านเป็นบล็อกเดียวจากค่าเดิม และบล็อกแรกไม่ใส่ prefix ในคีย์
   → skips ที่ผู้ใช้เคยเว้นไว้ในงานเก่ายังตรงตำแหน่งเดิมทุกผืน */
function p3NormBlk(b, i) {
  return {
    id: b.id || ("b" + i), i,
    pfx: i === 0 ? "" : "b" + i + "_",
    orient: b.orient === "landscape" ? "landscape" : "portrait",
    rows: Math.max(0, Math.round(+b.rows || 0)), cols: Math.max(0, Math.round(+b.cols || 0)),
    gap: b.gap == null ? 0.02 : Math.max(0, +b.gap),
    du: +b.du || 0, dv: +b.dv || 0,                       // เลื่อนบล็อก (ม.) ตามแกนผิวหลังคา
    rot: +b.rot || 0,                                     // หมุนบล็อก (°) เทียบผืน
    /* แบ่งเป็นกลุ่มย่อยแล้วเว้นทางเดิน — 0 = ไม่แบ่ง (ของเก่าทุกงานจึงวางเหมือนเดิมเป๊ะ) */
    gc: Math.max(0, Math.round(+b.gc || 0)),              // กี่คอลัมน์ต่อกลุ่ม
    gr: Math.max(0, Math.round(+b.gr || 0)),              // กี่แถวต่อกลุ่ม
    gg: Math.max(0, +b.gg || 0),                          // ทางเดินระหว่างกลุ่ม (ม.)
    keep: b.keep === true,                                // หมุนแล้วคงรูปสี่เหลี่ยม ไม่ตัดตามขอบหลังคา
    tilt: Math.max(0, Math.min(60, +b.tilt || 0)),        // ขาตั้งเอียง (°) ยกแผงจากผิวหลังคา
    skips: b.skips || {}, adds: b.adds || {},
  };
}
function p3Blocks(roof) {
  const bs = Array.isArray(roof.blocks) && roof.blocks.length
    ? roof.blocks
    : [{ id: "b0", orient: roof.orient, rows: roof.rows, cols: roof.cols, gap: roof.gap, skips: roof.skips, adds: roof.adds }];
  return bs.map(p3NormBlk);
}
function p3NewBlk(i) {
  return { id: p3Id("pb"), orient: "portrait", rows: 0, cols: 0, gap: 0.02, du: 0, dv: 0, rot: 0, tilt: 0, skips: {}, adds: {} };
}
/* ── มุมหมุนของ "ตัวแผงแต่ละแผ่น" (เรเดียน) ให้ตรงกับแนวแถวที่กริดหมุนไป ──
   กริดหมุนในพิกัดผิว (u,v) ด้วยมุม +rot เสมอ แต่ตัวแผงหมุนรอบแกนตั้งฉากผิวใน basis ของ renderer
   ทรงสี่เหลี่ยม/จั่ว/ปั้นหยา basis เป็น (x, y, z) ของโลก → ต้องใส่ −rot ถึงจะไปทางเดียวกับกริด
   ทรงอิสระ (poly) basis เป็น (u, n, −v) ซึ่งสลับมือ → เครื่องหมายต้องกลับเป็น +rot
   เดิมใช้ −rot ทั้งคู่ ทรงอิสระเลยหมุนสวนทางกริด ผิดไป 2 เท่าของมุมที่ตั้ง
   ผลคือแผงเรียงเฉียงแต่ตัวแผงหันคนละทาง ขอบชุดออกมาเป็นฟันเลื่อย */
/* กวาดเงาทั้งวัน (06:00–18:30) ที่ความเร็วปกติ ใช้เวลากี่วินาที */
const P3_SWEEP_SEC = 15;
const p3BlkRy = (roof, blk) => (roof && roof.kind === "poly" ? 1 : -1) * (+(blk && blk.rot) || 0) * P3_DEG;
const p3BlkPW = (b) => (b.orient === "portrait" ? P3_PANEL_SHORT : P3_PANEL_LONG);
const p3BlkPD = (b) => (b.orient === "portrait" ? P3_PANEL_LONG : P3_PANEL_SHORT);

/* วางบล็อกหนึ่งลงบนหน้าผิวหนึ่ง (พิกัด 2 มิติ u,v บนผิว)
   face = { poly:[{u,v}], anchor, keyPfx, side, test }
     anchor "topCenter" = กึ่งกลางแกน u · แถวแรกชิดขอบบนแล้วไล่ลง (สี่เหลี่ยม/จั่ว)
     anchor "topLeft"   = ชิดซ้ายกรอบ · ไล่ลงจากขอบบน (ปั้นหยา)
     anchor "minMin"    = ชิดมุม min ทั้งสองแกน · ไล่ขึ้น (ทรงอิสระบนระนาบ best-fit)
   บล็อกที่ยังไม่ถูกเลื่อน/หมุน จะให้ผลเท่าเดิมเป๊ะ (ไม่แตะการทดสอบขอบเดิม) */
function p3FillBlk(face, blk, m, want) {
  const pw = p3BlkPW(blk), pd = p3BlkPD(blk), gap = blk.gap;
  const poly = face.poly;                                  // [{x,z}] — คีย์ x/z เพื่อส่งเข้า p3InPoly ได้ตรง ๆ
  const us = poly.map((p) => p.x), vs = poly.map((p) => p.z);
  const minU = Math.min.apply(null, us), maxU = Math.max.apply(null, us);
  const minV = Math.min.apply(null, vs), maxV = Math.max.apply(null, vs);
  /* ── แบ่งกลุ่ม + ทางเดินระหว่างกลุ่ม ──
     off() = ระยะที่ต้องเลื่อนช่องที่ c/r นั้นออกไป เพราะข้ามทางเดินมาแล้วกี่เส้น
     span() = ความกว้าง/ลึกรวมของ n ช่อง (นับทางเดินด้วย) — ใช้หาว่าผืนนี้ใส่ได้สูงสุดเท่าไร
     ทั้งคู่คืนค่าเท่าเดิมเป๊ะเมื่อไม่ได้แบ่งกลุ่ม (gc/gr = 0) */
  const gc = blk.gc, gr = blk.gr, gg = blk.gg;
  const offU = (c) => (gc > 0 && gg > 0 ? Math.floor(c / gc) * gg : 0);
  const offV = (r) => (gr > 0 && gg > 0 ? Math.floor(r / gr) * gg : 0);
  const spanW = (n) => n * pw + (n - 1) * gap + (gc > 0 && gg > 0 ? (Math.ceil(n / gc) - 1) * gg : 0);
  const spanD = (n) => n * pd + (n - 1) * gap + (gr > 0 && gg > 0 ? (Math.ceil(n / gr) - 1) * gg : 0);
  const fitN = (avail, span) => { let n = 0; while (span(n + 1) <= avail + 1e-9) n++; return n; };
  const maxCols = fitN((maxU - minU) - 2 * m, spanW);
  const maxRows = fitN((maxV - minV) - 2 * m, spanD);
  const res = { list: [], slots: [], count: 0, maxRows, maxCols };
  const cols = blk.cols > 0 ? Math.min(blk.cols, maxCols) : maxCols;
  const rows = blk.rows > 0 ? Math.min(blk.rows, maxRows) : maxRows;
  if (maxCols < 1 || maxRows < 1) return res;

  // ตำแหน่งกึ่งกลางช่อง (r,c) ก่อนเลื่อน/หมุน — สูตรตาม anchor เดิมของแต่ละทรง
  const gridW = spanW(cols), gridD = spanD(rows);
  let cellU, cellV;
  if (face.anchor === "topCenter") {
    cellU = (c) => -gridW / 2 + c * (pw + gap) + offU(c) + pw / 2;
    cellV = (r) => maxV - m - gridD + r * (pd + gap) + offV(r) + pd / 2;
  } else if (face.anchor === "minMin") {
    cellU = (c) => minU + m + c * (pw + gap) + offU(c) + pw / 2;
    cellV = (r) => minV + m + r * (pd + gap) + offV(r) + pd / 2;
  } else {                                    // topLeft
    cellU = (c) => minU + m + c * (pw + gap) + offU(c) + pw / 2;
    cellV = (r) => maxV - m - r * (pd + gap) - offV(r) - pd / 2;
  }
  // จุดหมุน = กึ่งกลางกริดอัตโนมัติ (หมุนแล้วบล็อกยังอยู่ที่เดิม ไม่เหวี่ยงหนี)
  const Au = (cellU(0) + cellU(Math.max(0, cols - 1))) / 2, Av = (cellV(0) + cellV(Math.max(0, rows - 1))) / 2;
  const rotR = blk.rot * P3_DEG, cs = Math.cos(rotR), sn = Math.sin(rotR);
  const moved = !!(blk.rot || blk.du || blk.dv);
  const xf = (u, v) => {
    const a = u - Au, b = v - Av;
    return { u: Au + a * cs - b * sn + blk.du, v: Av + a * sn + b * cs + blk.dv };
  };
  const keepOn = !!blk.keep;
  const mi = Math.max(0, m - 0.02);          // หดจุดทดสอบเล็กน้อย กันตกบนเส้นขอบพอดี
  /* mode "auto" = ช่องในกริดปกติ (คงพฤติกรรมเดิมเป๊ะ) · "slot" = ช่องว่างให้แตะเพิ่ม ต้องตรวจขอบเสมอ
     · "add" = แผงที่ผู้ใช้เติมเอง เช็คแค่จุดกึ่งกลาง จะได้ยื่นพ้นขอบได้นิดหน่อยตามที่ตั้งใจ แต่ไม่ลอยกลางอากาศ */
  const fits = (u, v, mode) => {
    if (mode === "add") return p3InPoly(u, v, poly);
    if (mode === "keep") return true;                                    // ตรวจไปแล้วตอนหาสี่เหลี่ยม
    if (mode === "auto" && !moved && face.test === false) return true;   // เดิม: สี่เหลี่ยม/จั่ว กริดพอดีผืนอยู่แล้ว
    const pad = mode === "slot" ? 0.01 : (moved ? 0.01 : mi);
    const hw = pw / 2 + pad, hd = pd / 2 + pad;
    const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, -hd], [0, hd], [-hw, 0], [hw, 0]]
      .map(([a, b]) => (moved ? [u + a * cs - b * sn, v + a * sn + b * cs] : [u + a, v + b]));
    return pts.every((t) => p3InPoly(t[0], t[1], poly));
  };
  const push = (r, c, mode) => {
    const p0 = { u: cellU(c), v: cellV(r) }, p = xf(p0.u, p0.v);
    if (!fits(p.u, p.v, mode)) return false;
    const key = blk.pfx + face.keyPfx + r + "_" + c;
    const skip = !!blk.skips[key];
    res.list.push({ key, side: face.side, u: p.u, v: p.v, pw, pd, blk: blk.i, skip });
    if (!skip) res.count++;
    return true;
  };
  // กรอบของบล็อก (ใช้วาดจุดจับลาก/ย่อขยายในภาพ 3 มิติ)
  res.rect = { cu: Au + blk.du, cv: Av + blk.dv, w: gridW, h: gridD, rot: blk.rot, rows, cols,
    maxRows, maxCols, pw, pd, gap, anchor: face.anchor, m, bb: { minU, maxU, minV, maxV },
    gc, gr, gg };   // ส่งค่าแบ่งกลุ่มไปด้วย ตอนลากย่อ/ขยายจะได้คิดความกว้างรวมทางเดินถูก
  const used = {};
  /* ── โหมด "จัดเป็นสี่เหลี่ยม" ──
     ปกติเราไล่วางทีละช่องแล้วตัดช่องที่ล้นขอบหลังคาทิ้ง พอชุดแผงถูกหมุน มุมกริดจะยื่นพ้นขอบ
     ช่องริมเลยหายเป็นหย่อม ๆ ได้ขอบหยักเป็นขั้นบันได ซึ่งวางจริงหน้างานไม่ได้
     โหมดนี้เปลี่ยนวิธีคิด: ไล่ตรวจทั้งแลตทิซว่าช่องไหนวางได้บ้าง แล้วหา "สี่เหลี่ยมผืนใหญ่ที่สุด
     ที่ทุกช่องข้างในวางได้ครบ" — ได้แถวตรงเต็มกรอบเสมอ และไม่มีทางล้นออกนอกหลังคา
     ถ้าผู้ใช้กำหนดแถว/คอลัมน์ไว้ ก็ไม่ให้เกินที่สั่ง */
  const keepRect = () => {
    const dg = Math.hypot(maxU - minU, maxV - minV);
    let nr = Math.ceil(dg / (pd + gap)) + 2, nc = Math.ceil(dg / (pw + gap)) + 2;
    // ผืนใหญ่มาก ๆ อย่าไล่จนเครื่องค้าง — หดขอบเขตค้นหาลงจนจำนวนช่องอยู่ในงบ
    while ((rows + 2 * nr) * (cols + 2 * nc) > 20000 && (nr > 1 || nc > 1)) {
      nr = Math.max(1, Math.floor(nr * 0.75)); nc = Math.max(1, Math.floor(nc * 0.75));
    }
    const i0 = -nr, j0 = -nc, R = rows + 2 * nr, C = cols + 2 * nc;
    const okRow = [];
    for (let i = 0; i < R; i++) {
      const row = new Uint8Array(C);
      for (let j = 0; j < C; j++) {
        const p = xf(cellU(j0 + j), cellV(i0 + i));
        row[j] = fits(p.u, p.v, "slot") ? 1 : 0;
      }
      okRow.push(row);
    }
    // สี่เหลี่ยมใหญ่สุดในตาราง 0/1 — ไล่ทีละแถวแบบฮิสโตแกรม
    const capR = blk.rows > 0 ? blk.rows : R, capC = blk.cols > 0 ? blk.cols : C;
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
            /* ใหญ่ที่สุดก่อน · ถ้าได้จำนวนแผงเท่ากันหลายที่ เลือกอันที่ใกล้ตำแหน่งที่ผู้ใช้เลื่อนชุดไว้ที่สุด
               ไม่งั้นขยับสไลเดอร์เลื่อนชุดแล้วบล็อกจะกระโดดไปโผล่คนละมุมของหลังคา */
            const cu = (cellU(j0 + j - w) + cellU(j0 + j - 1)) / 2;
            const cv = (cellV(i0 + i - hh + 1) + cellV(i0 + i)) / 2;
            const d2 = (cu - Au) * (cu - Au) + (cv - Av) * (cv - Av);
            const area = hh * w;
            if (!best || area > best.area || (area === best.area && d2 < best.d2)) {
              best = { i: i - hh + 1, j: j - w, h: hh, w, area, d2 };
            }
          }
        }
        stk.push(j);
      }
    }
    if (!best) return null;
    return { r0: i0 + best.i, c0: j0 + best.j, rows: best.h, cols: best.w };
  };
  const kr = keepOn ? keepRect() : null;
  if (kr) {
    for (let r = kr.r0; r < kr.r0 + kr.rows; r++) for (let c = kr.c0; c < kr.c0 + kr.cols; c++) {
      if (push(r, c, "keep")) used[r + "_" + c] = 1;
    }
    /* กรอบลาก/ย่อขยายต้องตามสี่เหลี่ยมที่ได้จริง ไม่ใช่กริดตั้งต้น
       จุดกึ่งกลางต้องส่งผ่าน xf() ด้วย — สี่เหลี่ยมที่เลือกได้ไม่ได้อยู่ตรงจุดหมุนพอดี
       ถ้าบวก du/dv เฉย ๆ กรอบจะเพี้ยนไปจากตัวแผงตามระยะห่างจากจุดหมุน */
    const uA = cellU(kr.c0), uB = cellU(kr.c0 + kr.cols - 1);
    const vA = cellV(kr.r0), vB = cellV(kr.r0 + kr.rows - 1);
    const ctr = xf((uA + uB) / 2, (vA + vB) / 2);
    res.rect.cu = ctr.u; res.rect.cv = ctr.v;
    res.rect.w = Math.abs(uB - uA) + pw; res.rect.h = Math.abs(vB - vA) + pd;
    res.rect.rows = kr.rows; res.rect.cols = kr.cols;
  } else {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (push(r, c, "auto")) used[r + "_" + c] = 1;
    }
  }
  // แผงที่ผู้ใช้แตะเพิ่มเอง — อยู่นอกกรอบแถว/คอลัมน์ หรือขอบเลยผืนไปนิดก็วางได้
  Object.keys(blk.adds || {}).forEach((k) => {
    if (!blk.adds[k] || !k.startsWith(blk.pfx + face.keyPfx)) return;
    const mm = /(-?\d+)_(-?\d+)$/.exec(k);
    if (!mm || used[mm[1] + "_" + mm[2]]) return;
    used[mm[1] + "_" + mm[2]] = 1;
    push(+mm[1], +mm[2], "add");
  });
  if (!want || !want.slots) return res;
  // ── ช่องว่างให้แตะเพิ่ม: ไล่ทั้งแลตทิซที่คลุมกรอบผืน (รวมช่วงติดลบ) แล้วเอาเฉพาะช่องที่ยังว่างและอยู่ในผืน ──
  const diag = Math.hypot(maxU - minU, maxV - minV);
  const nc = Math.ceil(diag / (pw + gap)) + 2, nr = Math.ceil(diag / (pd + gap)) + 2;
  for (let r = -nr; r <= rows + nr; r++) for (let c = -nc; c <= cols + nc; c++) {
    if (used[r + "_" + c]) continue;
    const p = xf(cellU(c), cellV(r));
    if (!fits(p.u, p.v, "slot")) continue;
    res.slots.push({ key: blk.pfx + face.keyPfx + r + "_" + c, side: face.side, u: p.u, v: p.v, pw, pd, blk: blk.i, slot: true });
  }
  return res;
}

/* กึ่งกลางกริด (ตอนยังไม่เลื่อน) เมื่อใช้แถว/คอลัมน์ตามที่กำหนด — ใช้ตอนลากย่อ/ขยายในภาพ
   เพื่อคำนวณว่าต้องตั้ง du/dv เท่าไรมุมที่ไม่ได้ลากถึงจะอยู่กับที่ */
function p3BlkC0(rect, rows, cols) {
  const gg = rect.gg || 0;
  const gW = cols * rect.pw + (cols - 1) * rect.gap + (rect.gc > 0 && gg > 0 ? (Math.ceil(cols / rect.gc) - 1) * gg : 0);
  const gD = rows * rect.pd + (rows - 1) * rect.gap + (rect.gr > 0 && gg > 0 ? (Math.ceil(rows / rect.gr) - 1) * gg : 0);
  const b = rect.bb, m = rect.m;
  if (rect.anchor === "topCenter") return { u: 0, v: b.maxV - m - gD / 2, w: gW, h: gD };
  if (rect.anchor === "minMin") return { u: b.minU + m + gW / 2, v: b.minV + m + gD / 2, w: gW, h: gD };
  return { u: b.minU + m + gW / 2, v: b.maxV - m - gD / 2, w: gW, h: gD };
}
/* หน้าผิวของแต่ละทรง (พิกัด u,v บนผิว) — ตัวกลางให้ระบบบล็อกใช้ร่วมกันได้ทุกทรง */
function p3Faces(roof, pan) {
  if (roof.kind === "hip") {
    const H = pan.hip;
    return H.faces.filter((f) => roof["side" + f.side] !== false)
      .map((f) => ({ side: f.side, keyPfx: f.side + "_", anchor: "topLeft", poly: f.poly }));
  }
  if (roof.kind === "gable") {
    const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
    const half = (+roof.span || 8) / 2, sl = half / cosP, rg = (+roof.ridge || 8) / 2;
    pan.slopeLen = sl;
    const rect = [{ x: -rg, z: 0 }, { x: rg, z: 0 }, { x: rg, z: -sl }, { x: -rg, z: -sl }];
    return ["A", "B"].filter((s) => (s === "A" ? roof.sideA !== false : roof.sideB !== false))
      .map((s) => ({ side: s, keyPfx: s + "_", anchor: "topCenter", test: false, poly: rect }));
  }
  if (roof.kind === "poly" && pan.plane) {
    const { c, u, v } = pan.plane;
    const dot = (p, w) => (p.x - c.x) * w.x + (p.y - c.y) * w.y + (p.z - c.z) * w.z;
    return [{ side: null, keyPfx: "", anchor: "minMin",
      poly: pan.plane.vs.map((vv) => ({ x: dot(vv, u), z: dot(vv, v) })) }];
  }
  const w = Math.max(0.5, +roof.w || 8), d = Math.max(0.5, +roof.d || 5);
  return [{ side: null, keyPfx: "", anchor: "topCenter", test: false,
    poly: [{ x: -w / 2, z: 0 }, { x: w / 2, z: 0 }, { x: w / 2, z: -d }, { x: -w / 2, z: -d }] }];
}

/* ── จำผลลัพธ์ล่าสุดไว้ ──
   หน้าจอเรียกคำนวณผังแผงของผืนเดียวกันซ้ำหลายรอบต่อการวาดหนึ่งครั้ง
   (นับแผงรวมทั้งงาน + แผงของผืนที่เลือก + ตอนสร้างวัตถุในฉาก + ตอนถอดรอยเท้าแผง)
   ปกติครั้งละไม่ถึงมิลลิวินาที แต่โหมด "สี่เหลี่ยมตรง" ต้องไล่ทั้งแลตทิซ ตกครั้งละ ~8 ms
   ลากสไลเดอร์ทีเดียวจึงเสียเวลาไปกับการคำนวณซ้ำหลายสิบมิลลิวินาที = ภาพกระตุก */
const _p3PanCache = new Map();
function p3Panels(roof, want) {
  const key = JSON.stringify(want || 0) + "" + JSON.stringify(roof);
  const hit = _p3PanCache.get(key);
  if (hit) return hit;
  const res = p3PanelsCalc(roof, want);
  if (_p3PanCache.size > 32) _p3PanCache.clear();   // กันโตไม่จบ — ของเก่าไม่มีใครใช้แล้ว
  _p3PanCache.set(key, res);
  return res;
}
/* ── คำนวณตำแหน่งแผงบนหลังคาทุกทรง ──
   out.list[] = { key, side, x, z (หรือ x,y,z สำหรับ poly/dome), pw, pd, blk, ry, tiltR, skip, slot } */
function p3PanelsCalc(roof, want) {
  const m = +roof.margin || 0;
  const blocks = p3Blocks(roof);
  const out = { blocks, list: [], count: 0, maxRows: 0, maxCols: 0, surfInfo: null, perBlk: [],
    countA: 0, countB: 0, countC: 0, countD: 0,
    pw: p3BlkPW(blocks[0]), pd: p3BlkPD(blocks[0]), gap: blocks[0].gap };
  const wantB = want && want.slots ? (want.blk == null ? -1 : want.blk) : null;   // -1 = ทุกบล็อก

  if (roof.kind === "dome") {
    // ── โดม: ผิวโค้ง หมุน/ตั้งขาเอียงไม่ได้ (แผงต้องแนบโค้ง) แต่เลื่อน/ซ้อนหลายบล็อกได้ ──
    const D = p3DomeGeo(roof);
    out.dome = D;
    const maxT = (roof.maxTilt == null ? 90 : +roof.maxTilt) * P3_DEG;
    out.rowTilts = [];
    blocks.forEach((blk) => {
      const pw = p3BlkPW(blk), pd = p3BlkPD(blk), gap = blk.gap;
      const mc = Math.max(0, Math.floor(((D.len - 2 * m) + gap) / (pw + gap)));
      const mr = Math.max(0, Math.floor(((D.arc - 2 * m) + gap) / (pd + gap)));
      out.maxCols = Math.max(out.maxCols, mc); out.maxRows = Math.max(out.maxRows, mr);
      const cols = blk.cols > 0 ? Math.min(blk.cols, mc) : mc;
      const rows = blk.rows > 0 ? Math.min(blk.rows, mr) : mr;
      const gridW = cols * pw + (cols - 1) * gap, gridA = rows * pd + (rows - 1) * gap;
      const x0 = -gridW / 2 + blk.du, s0 = (D.arc - gridA) / 2 + blk.dv;
      let n = 0;
      for (let r = 0; r < rows; r++) {
        const t = -D.th + (s0 + r * (pd + gap) + pd / 2) / D.rad;
        if (Math.abs(t) > maxT + 1e-6 || t < -D.th || t > D.th) continue;
        if (blk.i === 0) out.rowTilts.push(Math.abs(Math.round(t / P3_DEG)));
        const yc = D.yAt(t), zc = D.zAt(t);
        for (let c = 0; c < cols; c++) {
          const key = blk.pfx + r + "_" + c, skip = !!blk.skips[key];
          out.list.push({ key, x: x0 + c * (pw + gap) + pw / 2, y: yc, z: zc, rx: t, pw, pd, blk: blk.i, skip });
          if (!skip) { out.count++; n++; }
        }
      }
      out.perBlk.push({ maxRows: mr, maxCols: mc, count: n });
    });
    return out;
  }

  if (roof.kind === "hip") out.hip = p3HipFaces(roof);
  if (roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3) out.plane = p3PolyPlane(roof);
  if (roof.kind === "poly" && !out.plane) return out;
  const faces = p3Faces(roof, out);
  out.faces = faces; out.rects = [];

  // แปลงพิกัดผิว (u,v) → ตำแหน่งที่ mesh ใช้จริง
  const toMesh = (roof.kind === "poly" && out.plane)
    ? (p) => { const { c, u, v } = out.plane;
        return { x: c.x + p.u * u.x + p.v * v.x, y: c.y + p.u * u.y + p.v * v.y, z: c.z + p.u * u.z + p.v * v.z }; }
    : (p) => ({ x: p.u, z: p.v });
  out.toMesh = toMesh;

  blocks.forEach((blk) => {
    const ry = p3BlkRy(roof, blk), tiltR = blk.tilt * P3_DEG;
    let mr = 0, mc = 0, n = 0;
    faces.forEach((face, fi) => {
      const slots = wantB != null && (wantB === -1 || wantB === blk.i);
      const r = p3FillBlk(face, blk, m, { slots });
      if (r.rect) out.rects.push(Object.assign({ blk: blk.i, side: face.side, faceIdx: fi }, r.rect));
      mr = Math.max(mr, r.maxRows); mc = Math.max(mc, r.maxCols);
      if (roof.kind === "gable") { out["count" + face.side] = (out["count" + face.side] || 0) + r.count; }
      if (roof.kind === "hip") { out["count" + face.side] = (out["count" + face.side] || 0) + r.count; }
      r.list.concat(r.slots).forEach((p) => {
        out.list.push(Object.assign({}, p, toMesh(p), { ry, tiltR }));
      });
      out.count += r.count; n += r.count;
    });
    out.maxRows = Math.max(out.maxRows, mr); out.maxCols = Math.max(out.maxCols, mc);
    out.perBlk.push({ maxRows: mr, maxCols: mc, count: n });
  });
  return out;
}
function p3CountAll(st) { return (st.roofs || []).reduce((s, r) => s + p3Panels(r).count, 0); }

/* รวมมุมของหลังคาทรงอิสระทุกผืน (ยกเว้น exceptId) เป็น "จุดดูดติด" โดยรวมจุดที่ทับกันให้เหลือจุดเดียว */
function p3SnapPoints(roofs, exceptId) {
  const seen = {}, out = [];
  (roofs || []).forEach((r) => {
    if (r.id === exceptId || r.kind !== "poly" || !Array.isArray(r.pts)) return;
    r.pts.forEach((p) => {
      const wx = (+r.x || 0) + (+p.x || 0), wz = (+r.z || 0) + (+p.z || 0);
      const k = Math.round(wx * 10) + "_" + Math.round(wz * 10);
      if (seen[k]) return;
      seen[k] = 1; out.push({ x: wx, z: wz });
    });
  });
  return out;
}

/* แปลงพิกัดพื้น (world x,z) → พิกัดบนผิวลาดของหลังคาผืนหนึ่ง (ผกผันของ p3SurfInfo) */
function p3WorldToSurf(roof, info, wx, wz) {
  const rot = (((+roof.az || 180) - 180) * P3_DEG);
  const px = wx - (+roof.x || 0), pz = wz - (+roof.z || 0);
  const lx = px * Math.cos(rot) + pz * Math.sin(rot);
  const lz = -px * Math.sin(rot) + pz * Math.cos(rot);
  return { x: lx, z: (lz - info.zoff) / info.cosP };
}

/* ── ช่องกรอก/สไลเดอร์ ──
   ต้องนิยามไว้ "นอก" Plan3DEditor เท่านั้น ถ้าประกาศข้างในจะกลายเป็นคอมโพเนนต์ชนิดใหม่ทุกครั้งที่ค่าเปลี่ยน
   React จะ remount ตัว <input> ใหม่ → กดลากสไลเดอร์ค้างไม่ได้ (หลุดทันทีที่ขยับก้าวแรก) */
const P3_INP = { width: "100%", boxSizing: "border-box", background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, padding: "7px 9px", borderRadius: 9, outline: "none" };

/* ── ชีตสไตล์ของโหมด 3D ──
   สิ่งที่ inline style ทำไม่ได้: :hover / :focus-visible / ::-webkit-slider-thumb / transition
   ซึ่งเป็นตัวที่ทำให้หน้าจอ "รู้สึกมีคนออกแบบ" — จึงยัดเป็น <style> ก้อนเดียว ขอบเขตอยู่ใต้ .p3 เท่านั้น */
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

/* ── ไอคอนเส้น 16px ── ใช้ currentColor ทั้งชุด ทั้งจอจะได้ดูเป็นระบบเดียวกัน (เลิกใช้อิโมจิ) */
function P3Icon({ name, size, w }) {
  const s = size || 15;
  const F = React.Fragment;
  const ic = {
    cube: <F><path d="M8 1.7 14.1 5.1v5.8L8 14.3 1.9 10.9V5.1z" /><path d="M1.9 5.1 8 8.5l6.1-3.4" /><path d="M8 8.5v5.8" /></F>,
    plan: <F><rect x="1.9" y="1.9" width="12.2" height="12.2" rx="1.5" /><path d="M6.4 1.9v12.2M6.4 8.9h7.7" /></F>,
    nodes: <F><path d="M8 3.2 13 12.4H3z" /><circle cx="8" cy="3.2" r="1.5" /><circle cx="13" cy="12.4" r="1.5" /><circle cx="3" cy="12.4" r="1.5" /></F>,
    lock: <F><rect x="3.4" y="7" width="9.2" height="6.6" rx="1.5" /><path d="M5.8 7V5.1a2.2 2.2 0 0 1 4.4 0V7" /></F>,
    unlock: <F><rect x="3.4" y="7" width="9.2" height="6.6" rx="1.5" /><path d="M5.8 7V5.1a2.2 2.2 0 0 1 4.2-.8" /></F>,
    sunShadow: <F><circle cx="8" cy="6.6" r="2.7" /><path d="M8 1.4v1.1M8 10.7v1M12.7 6.6h-1.1M4.4 6.6H3.3M11.3 3.3l-.8.8M5.5 9.1l-.8.8M11.3 9.9l-.8-.8M5.5 4.1l-.8-.8" /><path d="M3.6 14.2h8.8" strokeWidth="2.1" /></F>,
    sun: <F><circle cx="8" cy="8" r="3.1" /><path d="M8 1.5v1.4M8 13.1v1.4M14.5 8h-1.4M2.9 8H1.5M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1" /></F>,
    bulb: <F><path d="M5.4 9.6a4 4 0 1 1 5.2 0c-.5.5-.8 1-.9 1.7H6.3c-.1-.7-.4-1.2-.9-1.7Z" /><path d="M6.4 13.2h3.2M6.9 14.7h2.2" /></F>,
    image: <F><rect x="1.9" y="2.8" width="12.2" height="10.4" rx="1.6" /><circle cx="5.6" cy="6.3" r="1.1" /><path d="m2.4 11.6 3.1-3 2.4 2.3 2.4-2.5 3.4 3.4" /></F>,
    /* ── ชุดใหม่ ── */
    roof: <F><path d="M1.5 8.1 8 2.6l6.5 5.5" /><path d="M3.4 7.2v6.3h9.2V7.2" /></F>,
    grid: <F><rect x="1.9" y="2.7" width="12.2" height="10.6" rx="1.5" /><path d="M1.9 6.2h12.2M1.9 9.8h12.2M8 2.7v10.6" /></F>,
    map: <F><path d="M1.9 4.3 6 2.7l4 1.7 4.1-1.7v9L10 13.3l-4-1.7-4.1 1.7z" /><path d="M6 2.7v8.9M10 4.4v8.9" /></F>,
    tree: <F><path d="M8 2 4.1 7.6h2L3.2 12.2h9.6L9.9 7.6h2z" /><path d="M8 12.2v2.2" /></F>,
    pencil: <F><path d="M2.7 13.3h2.7l7.3-7.4a1.85 1.85 0 0 0-2.6-2.6L2.7 10.6z" /><path d="m9.6 4 2.5 2.5" /></F>,
    dome: <F><path d="M2.5 12.4a5.5 5.5 0 0 1 11 0z" /><path d="M1.4 12.4h13.2" /></F>,
    trash: <F><path d="M3.1 4.4h9.8" /><path d="M6.3 4.4V3.3a1 1 0 0 1 1-1h1.4a1 1 0 0 1 1 1v1.1" /><path d="m4.3 4.4.6 8.2a1.1 1.1 0 0 0 1.1 1h4a1.1 1.1 0 0 0 1.1-1l.6-8.2" /></F>,
    reset: <F><path d="M13.3 8a5.3 5.3 0 1 1-1.7-3.9" /><path d="M13.6 2.3v3h-3" /></F>,
    plus: <F><path d="M8 3.3v9.4M3.3 8h9.4" /></F>,
    check: <F><path d="m3.3 8.5 3.1 3.1 6.3-7.2" /></F>,
    camera: <F><rect x="1.8" y="4.5" width="12.4" height="8.7" rx="2" /><circle cx="8" cy="8.9" r="2.5" /><path d="M5.6 4.5 6.4 2.8h3.2l.8 1.7" /></F>,
    link: <F><path d="M6.6 9.4a2.7 2.7 0 0 0 4 .3l1.6-1.6a2.7 2.7 0 0 0-3.8-3.8l-.9.9" /><path d="M9.4 6.6a2.7 2.7 0 0 0-4-.3L3.8 7.9a2.7 2.7 0 0 0 3.8 3.8l.9-.9" /></F>,
    play: <F><path d="M5.4 3.3 12.3 8l-6.9 4.7z" /></F>,
    pause: <F><path d="M6 3.5v9M10 3.5v9" strokeWidth="2" /></F>,
    height: <F><path d="M8 2.4v11.2" /><path d="m5.3 5.1 2.7-2.7 2.7 2.7M5.3 10.9l2.7 2.7 2.7-2.7" /></F>,
    building: <F><path d="M2.6 13.4V6.3L8 2.4l5.4 3.9v7.1z" /><path d="M6.4 13.4V9.3h3.2v4.1" /></F>,
    arrow: <F><path d="M2.8 8h9.5" /><path d="m8.7 4.4 3.6 3.6-3.6 3.6" /></F>,
    layers: <F><path d="M8 2.2 14 5.4 8 8.6 2 5.4z" /><path d="m2 9 6 3.2L14 9" /></F>,
    box: <F><rect x="2.4" y="4.6" width="11.2" height="8.8" rx="1.4" /><path d="M2.4 8h11.2" /></F>,
    save: <F><path d="M3.4 2.6h7.2l3 3v7.8a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1z" /><path d="M5.3 2.6v4h5.4v-4M5.3 14.4v-4.2h5.4v4.2" /></F>,
    /* ── ชุดสำหรับหน้าออกแบบระบบไฟฟ้า ── */
    curve: <F><path d="M2.2 2.4v11.2h11.6" /><path d="M4.3 4.3h5.1c1.4 0 2 .8 2 2.3v6" /></F>,
    probe: <F><path d="m9.6 2.5 3.9 3.9-6.2 6.2-3.9-3.9z" /><path d="m5.7 6.4 3.9 3.9M2.4 13.6l1.6-1" /></F>,
    thermo: <F><path d="M9.9 9V3.7a1.9 1.9 0 1 0-3.8 0V9a3.2 3.2 0 1 0 3.8 0z" /><path d="M8 6.2v4.4" /></F>,
    coin: <F><ellipse cx="8" cy="4.4" rx="5.4" ry="2.3" /><path d="M2.6 4.4v7.2c0 1.3 2.4 2.3 5.4 2.3s5.4-1 5.4-2.3V4.4" /><path d="M2.6 8c0 1.3 2.4 2.3 5.4 2.3s5.4-1 5.4-2.3" /></F>,
    doc: <F><path d="M3.6 1.9h5.2l3.6 3.6v8.6H3.6z" /><path d="M8.8 1.9v3.6h3.6" /><path d="M5.9 9h4.2M5.9 11.3h3" /></F>,
    cloud: <F><path d="M4.6 12.2a3 3 0 0 1-.3-6 4.2 4.2 0 0 1 8 .9 2.6 2.6 0 0 1-.5 5.1z" /></F>,
    bolt: <F><path d="M8.9 1.8 3.6 9.1h3.7l-.2 5.1 5.3-7.3H8.7z" /></F>,
    ruler: <F><path d="M1.9 10.2 10.2 1.9l3.9 3.9-8.3 8.3z" /><path d="m4.2 7.9 1.6 1.6M6.2 5.9l1.6 1.6M8.2 3.9l1.6 1.6" /></F>,
    eye: <F><path d="M1.4 8S4 3.6 8 3.6 14.6 8 14.6 8 12 12.4 8 12.4 1.4 8 1.4 8Z" /><circle cx="8" cy="8" r="2.1" /></F>,
    eyeOff: <F><path d="M6.3 4a6.6 6.6 0 0 1 1.7-.2c4 0 6.6 4.2 6.6 4.2a12 12 0 0 1-2 2.5M4 5a12 12 0 0 0-2.6 3S4 12.2 8 12.2a6.3 6.3 0 0 0 2.3-.4" /><path d="m2.3 2.3 11.4 11.4" /></F>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={w || 1.6} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flex: "0 0 auto" }}>{ic[name] || null}</svg>
  );
}

function P3Num({ label, value, onChange, step, min, max, suffix }) {
  return (
    <label className="p3-f">
      <span className="lb">{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <input className="p3-inp" type="number" step={step || 1} min={min} max={max} value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)} />
        {suffix && <span className="p3-sfx">{suffix}</span>}
      </span>
    </label>
  );
}

/* สไลเดอร์: ส่งเปอร์เซ็นต์ของค่าเข้า CSS var --p เพื่อระบายสีแถบซ้ายมือให้เห็นระยะที่เลื่อนมา */
function P3NumRange({ label, value, onChange, min, max, step, suffix, span }) {
  const lo = +min || 0, hi = max == null ? 100 : +max;
  const pct = hi > lo ? Math.max(0, Math.min(100, ((+value || 0) - lo) / (hi - lo) * 100)) : 0;
  return (
    <label className="p3-f" style={{ gridColumn: span ? "1 / -1" : "auto" }}>
      <span className="lb">{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(+e.target.value)} style={{ "--p": pct }} />
        <input className="p3-inp" type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
          style={{ width: 56, flex: "0 0 auto", textAlign: "center", padding: "5px 4px", fontSize: 12 }} />
        {suffix && <span className="p3-sfx">{suffix}</span>}
      </span>
    </label>
  );
}

/* สไลเดอร์เดี่ยว (ไม่มีช่องตัวเลข) — ใช้กับเดือน/เวลา/ความทึบ */
function P3Slider({ label, value, onChange, min, max, step, right }) {
  const lo = +min || 0, hi = max == null ? 100 : +max;
  const pct = hi > lo ? Math.max(0, Math.min(100, ((+value || 0) - lo) / (hi - lo) * 100)) : 0;
  return (
    <label className="p3-f">
      <span className="lb" style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span>{label}</span>
        {right != null && <b style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "var(--text-1)" }}>{right}</b>}
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)} style={{ "--p": pct }} />
    </label>
  );
}

/* ============================================================
   Plan3DEditor — โหมดเต็มจอ
   ============================================================ */
function Plan3DEditor({ job, onClose, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { saved, loading, save } = usePlan3d(job ? job.id : null);

  const [ready, setReady] = React.useState(false);   // Three.js โหลดแล้ว
  const [loadErr, setLoadErr] = React.useState(null);
  const [st, setSt] = React.useState(() => p3Blank(job));
  const [selRoof, setSelRoof] = React.useState(null);   // roof id
  const [selObs, setSelObs] = React.useState(null);     // obstacle id
  const [selVert, setSelVert] = React.useState(null);   // { roofId, idx } — มุมที่เลือกไว้ปรับความสูง
  const [tab, setTab] = React.useState("roof");         // roof | panel | photo | obstacle | measure | sun
  const [dirty, setDirty] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);
  const [sweepSpd, setSweepSpd] = React.useState(1);      // ตัวคูณความเร็วตอนกวาดเงาทั้งวัน
  const [drawing, setDrawing] = React.useState(false);  // โหมดวาดหลังคาทรงอิสระ
  const [drawPts, setDrawPts] = React.useState([]);     // จุดที่วาด (world x,z)
  const [measuring, setMeasuring] = React.useState(false); // โหมดวัดระยะ (คลิกวางจุดเป็นเส้นหัก)
  const [measPts, setMeasPts] = React.useState([]);     // จุดของเส้นที่กำลังวัด (world x,z)
  const [selMeas, setSelMeas] = React.useState(null);   // id เส้นวัดที่เลือกอยู่
  const [showVerts, setShowVerts] = React.useState(true); // แสดงจุดเขียว (มุมแก้ทรง)
  const [locked, setLocked] = React.useState(false);      // ล็อกตัวบ้าน (หลังคา/มุม/สิ่งบดบัง) — แผงยังจัดได้ตามปกติ
  const [mapOpen, setMapOpen] = React.useState(false);    // เปิดโมดัลเลือกพื้นที่จากแผนที่
  const [sysOpen, setSysOpen] = React.useState(false);    // เวิร์กสเปซออกแบบระบบ (สตริง/ไมโคร + ผลผลิต 15 ปี)
  const [photoEdit, setPhotoEdit] = React.useState(false); // โหมดปรับรูปโดรนบนภาพ (ลาก/หมุน/ย่อขยาย)
  const [grpOpen, setGrpOpen] = React.useState(false);    // กางรายชื่อผืนไว้เลือกเข้า/ออกกลุ่ม (ปกติพับไว้กันรก)
  const [expGrp, setExpGrp] = React.useState(null);       // กลุ่มที่กางชิปเป็นรายผืนอยู่ (null = ยุบหมด)
  const [delAsk, setDelAsk] = React.useState(null);       // roof id ที่กดลบแล้วรอยืนยันในหน้า (ไม่ใช้ confirm ของเบราว์เซอร์)
  const [selBlk, setSelBlk] = React.useState(0);          // บล็อกแผงที่กำลังแก้อยู่ของผืนที่เลือก
  const [addMode, setAddMode] = React.useState(false);    // โหมดแตะเพิ่มแผงเอง (โชว์ช่องว่างให้กด)
  /* โหมดแสง: sun = แดดจริง+เงา · noshadow = แดดแต่ไม่มีเงา · flat = แสงแบนเท่ากันทั้งผัง (ดูผังแผงชัดสุด) */
  const [lightMode, setLightMode] = React.useState("sun");
  const [view2D, setView2D] = React.useState(false);      // ล็อกมุมมองบน (หมุนไม่ได้) — สลับด้วยปุ่ม 3D/2D
  const [showSun, setShowSun] = React.useState(true);     // โชว์ดวงอาทิตย์ + เส้นแนวโคจรทั้งวันในฉาก
  const shadowOn = lightMode === "sun";
  const loadedRef = React.useRef(false);
  const lockedRef = React.useRef(false); lockedRef.current = locked;
  const photoEditRef = React.useRef(false); photoEditRef.current = photoEdit;
  const tabRef = React.useRef("roof"); tabRef.current = tab;   // ตัวจับเหตุการณ์เมาส์ผูกครั้งเดียว จึงต้องอ่านแท็บผ่าน ref
  const measuringRef = React.useRef(false); measuringRef.current = measuring;

  const set = (patch) => { setSt((p) => Object.assign({}, p, patch)); setDirty(true); };
  const setSun = (patch) => { setSt((p) => Object.assign({}, p, { sun: Object.assign({}, p.sun, patch) })); setDirty(true); };
  const patchRoof = (id, patch) => { setSt((p) => Object.assign({}, p, { roofs: p.roofs.map((r) => r.id === id ? Object.assign({}, r, patch) : r) })); setDirty(true); };
  /* แก้หลายผืนพร้อมกันใน state เดียว (ใช้ตอนลากทั้งกลุ่ม) — ups = { roofId: patch } */
  const patchRoofs = (ups) => { setSt((p) => Object.assign({}, p, { roofs: p.roofs.map((r) => ups[r.id] ? Object.assign({}, r, ups[r.id]) : r) })); setDirty(true); };
  /* ── บล็อกแผง: ผืนเก่าที่ยังไม่มี blocks จะถูกแปลงเป็นรูปแบบใหม่ตอนแก้ครั้งแรก (ค่าเดิม/ที่เว้นไว้ไม่หาย) ── */
  const blkStore = (roof) => p3Blocks(roof).map((b) => ({
    id: b.id, orient: b.orient, rows: b.rows, cols: b.cols, gap: b.gap,
    du: b.du, dv: b.dv, rot: b.rot, tilt: b.tilt, skips: b.skips, adds: b.adds,
    gc: b.gc, gr: b.gr, gg: b.gg, keep: b.keep,
  }));
  /* ผิวเปลี่ยนทรง → ช่องที่เว้น/เพิ่มไว้ไม่ตรงแล้ว ล้างทิ้งแต่คงค่าตั้งของชุดไว้ */
  const clearCells = (roof) => blkStore(roof).map((b) => Object.assign({}, b, { skips: {}, adds: {} }));
  const patchBlk = (roof, i, patch) => {
    const bs = blkStore(roof); if (!bs[i]) return;
    bs[i] = Object.assign({}, bs[i], patch);
    patchRoof(roof.id, { blocks: bs });
  };
  /* ใส่ค่าเดียวกันให้ทุกชุดในผืนนี้ — ใช้ตอนอยากให้ทุกชุดหันไปทางเดียวกันเป๊ะ ๆ
     ตั้งทีละชุดแล้วเผลอต่างกันองศาเดียว มองจากมุมสูงก็เห็นว่าไม่ตรงแนวแล้ว */
  const patchAllBlk = (roof, patch) => {
    patchRoof(roof.id, { blocks: blkStore(roof).map((b) => Object.assign({}, b, patch)) });
  };
  /* แตะแผง = เว้น/ใส่คืน · แตะช่องว่าง (โหมดเพิ่มเอง) = เติมแผงตรงนั้น */
  const toggleCell = (roof, key, isSlot) => {
    const mm = /^b(\d+)_/.exec(key), bi = mm ? +mm[1] : 0;
    const bs = blkStore(roof); const b = bs[bi]; if (!b) return;
    const adds = Object.assign({}, b.adds || {}), skips = Object.assign({}, b.skips || {});
    if (isSlot) { adds[key] = true; delete skips[key]; }
    else if (adds[key]) delete adds[key];
    else if (skips[key]) delete skips[key];
    else skips[key] = true;
    bs[bi] = Object.assign({}, b, { adds, skips });
    patchRoof(roof.id, { blocks: bs });
  };
  const patchObs = (id, patch) => { setSt((p) => Object.assign({}, p, { obstacles: (p.obstacles || []).map((o) => o.id === id ? Object.assign({}, o, patch) : o) })); setDirty(true); };
  const patchMeas = (id, patch) => { setSt((p) => Object.assign({}, p, { measures: (p.measures || []).map((m) => m.id === id ? Object.assign({}, m, patch) : m) })); setDirty(true); };
  const delMeas = (id) => {
    setSt((p) => Object.assign({}, p, { measures: (p.measures || []).filter((m) => m.id !== id) }));
    setDirty(true);
    setSelMeas((s) => (s === id ? null : s));
  };
  /* ตั้งความสูงมุมหนึ่ง + เชื่อมทุกมุมที่ทับตำแหน่งเดียวกัน (ข้ามผืน) ให้สูงเท่ากัน → หลังคาต่อกันเสมอ */
  const setVertHeight = (roofId, idx, H) => {
    setSt((prev) => {
      const R = (prev.roofs || []).find((r) => r.id === roofId);
      if (!R || !Array.isArray(R.pts) || !R.pts[idx]) return prev;
      const wx = (+R.x || 0) + (+R.pts[idx].x || 0), wz = (+R.z || 0) + (+R.pts[idx].z || 0);
      const roofs = prev.roofs.map((r) => {
        if (r.kind !== "poly" || !Array.isArray(r.pts)) return r;
        const ph = p3PhOf(r).slice(); let changed = false;
        r.pts.forEach((p, j) => {
          if (Math.hypot((+r.x || 0) + (+p.x || 0) - wx, (+r.z || 0) + (+p.z || 0) - wz) < 0.3) { ph[j] = H; changed = true; }
        });
        return changed ? Object.assign({}, r, { ph }) : r;
      });
      return Object.assign({}, prev, { roofs });
    });
    setDirty(true);
  };

  /* โหลด Three.js + โหลดข้อมูลที่บันทึกไว้ */
  React.useEffect(() => { p3LoadThree().then(() => setReady(true)).catch((e) => setLoadErr(e.message)); }, []);
  React.useEffect(() => {
    if (loading || loadedRef.current) return;
    loadedRef.current = true;
    if (saved) {
      const base = p3Blank(job);
      const merged = Object.assign({}, base, saved, { sun: Object.assign({}, base.sun, saved.sun || {}) });
      merged.roofs = (saved.roofs || base.roofs).map((r) => Object.assign({}, p3NewRoof(1), r, { skips: r.skips || {}, pts: r.pts || null }));
      merged.obstacles = saved.obstacles || [];
      merged.measures = saved.measures || [];
      setSt(merged);
      if (merged.roofs[0]) setSelRoof(merged.roofs[0].id);
    } else if (st.roofs[0]) setSelRoof(st.roofs[0].id);
  }, [loading, saved]); // eslint-disable-line

  /* ── refs ของ scene ── */
  const mountRef = React.useRef(null);
  const tRef = React.useRef({});          // { renderer, scene, camera, controls, sunLight, ... }
  const stRef = React.useRef(st); stRef.current = st;
  const drawingRef = React.useRef(false); drawingRef.current = drawing;

  /* ── สร้าง scene ครั้งแรก ── */
  React.useEffect(() => {
    if (!ready || !mountRef.current) return;
    const THREE = window.THREE;
    const el = mountRef.current;
    /* logarithmicDepthBuffer: ไซต์ใหญ่มองได้ไกลเป็นกิโล แต่พื้น/ผังดาวเทียม/รูปโดรน วางซ้อนกันห่างแค่ 1 ซม.
       บัฟเฟอร์ความลึกแบบปกติจะแยกไม่ออกตอนซูมออก แล้วขึ้นเป็นลายทางสลับกันทั้งจอ */
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
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
    controls.enableDamping = true; controls.dampingFactor = 0.12;

    const amb = new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.75);
    scene.add(amb);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    const S = 45;
    sunLight.shadow.camera.left = -S; sunLight.shadow.camera.right = S;
    sunLight.shadow.camera.top = S; sunLight.shadow.camera.bottom = -S;
    sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 220;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight); scene.add(sunLight.target);

    const dyn = new THREE.Group();  // ส่วนที่ rebuild ตาม state
    scene.add(dyn);
    /* แนวโคจรทั้งวัน + ขีดชั่วโมง — เปลี่ยนตามวันที่/พิกัดเท่านั้น ไม่เปลี่ยนตามเวลา
       แยกกลุ่มกับตัวดวงอาทิตย์ เพื่อให้ตอนกวาดเวลาทั้งวันไม่ต้องสร้างป้ายชั่วโมงใหม่ทุกเฟรม */
    const sunGrp = new THREE.Group();
    scene.add(sunGrp);
    const sunBall = new THREE.Group();   // ตัวดวงอาทิตย์ + แสงฟุ้ง + เส้นบอกทิศ (ขยับตามเวลา)
    scene.add(sunBall);

    Object.assign(tRef.current, { THREE, renderer, scene, camera, controls, sunLight, amb, dyn, sunGrp, sunBall, el });

    const onResize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(el);

    let run = true;
    const loop = () => { if (!run) return; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);

    return () => { run = false; ro.disconnect(); controls.dispose(); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); };
  }, [ready]);

  /* ── rebuild วัตถุตาม state (พื้น/หลังคา/แผง/สิ่งบดบัง/เส้นวาด) ── */
  React.useEffect(() => {
    const t = tRef.current; if (!t.dyn) return;
    const THREE = t.THREE;
    /* เปิด/ปิดเงา — ต้องสั่งคอมไพล์ material ใหม่ด้วย ไม่งั้นเงาเก่าค้างบนผิวที่รับเงา
       (ของใน t.dyn สร้างใหม่อยู่แล้ว แต่พื้น/ฉากถาวรไม่ได้สร้างใหม่) */
    if (t.renderer && t.renderer.shadowMap.enabled !== shadowOn) {
      t.renderer.shadowMap.enabled = shadowOn;
      t.scene && t.scene.traverse((o) => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; });
      });
    }
    if (t.sunLight) t.sunLight.castShadow = shadowOn;
    // เคลียร์ของเดิม
    while (t.dyn.children.length) {
      const c = t.dyn.children[0];
      t.dyn.remove(c);
      /* รูปโดรน/ผังดาวเทียมเก็บไว้ใช้ซ้ำ (ดู p3Tex) ห้ามทิ้ง ไม่งั้นต้องถอดรหัสรูปใหม่ทุกครั้งที่วาดฉาก */
      c.traverse && c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map && !m.map.userData.p3keep) m.map.dispose(); m.dispose(); }); } });
    }
    /* ทิ้งรูปที่ไม่ได้ใช้แล้ว (ผู้ใช้เปลี่ยนรูปโดรน/ย้ายหมุดแผนที่) ที่เหลือใช้ตัวเดิมต่อ */
    t.texCache = t.texCache || {};
    const texKeep = [st.photo, st.baseMap && st.baseMap.url].filter(Boolean);
    Object.keys(t.texCache).forEach((u) => {
      if (texKeep.indexOf(u) < 0) { t.texCache[u].dispose(); delete t.texCache[u]; }
    });
    const p3Tex = (url, onReady) => {
      const has = t.texCache[url];
      /* รูปที่เคยโหลดแล้วต้องแจ้งกลับแบบ "รอบถัดไป" เสมอ ห้ามเรียกทันที
         เพราะฝั่งที่เรียกยังสร้าง mesh ไม่เสร็จ (โค้ดอยู่บรรทัดถัดไป) เรียกตรงนี้จะพังทั้งจอ */
      if (has) { if (onReady && has.image) Promise.resolve().then(() => onReady(has)); return has; }
      const tx = new THREE.TextureLoader().load(url, () => { if (onReady) onReady(tx); });
      tx.anisotropy = 4; tx.userData.p3keep = true;
      t.texCache[url] = tx;
      return tx;
    };
    t.pickRoofs = []; t.pickPanels = []; t.pickObs = []; t.pickVerts = [];
    t.pickPhoto = []; t.pickPhotoH = []; t.photoDeco = [];
    t.pickBlk = []; t.blkFrames = [];   // จุดจับลาก/ย่อขยายชุดแผงบนภาพ 3 มิติ
    t.selTilt = null; t.selInfo = null; t.selPolyRoof = null;

    const G = +st.groundW || 40;
    /* ระยะมองไกลของกล้องเคยตั้งตายตัวไว้ 500 ม. — ไซต์ใหญ่ที่พื้นกว้างเป็นร้อยเมตร
       พอซูมออกหน่อยเดียว ระนาบตัดไกลจะกินภาพหายทั้งจอ · ให้ขยับตามขนาดพื้นจริง
       แล้วล็อกระยะซูมออกไว้ไม่ให้เลยขอบเขตที่กล้องมองเห็น จะได้ไม่มีทางซูมจนภาพหายอีก */
    if (t.camera && t.controls) {
      const far = Math.max(500, G * 6);
      if (t.camera.far !== far) { t.camera.far = far; t.camera.updateProjectionMatrix(); }
      t.controls.minDistance = 1.5;
      t.controls.maxDistance = far * 0.42;   // ไกลสุด + ครึ่งความกว้างพื้น ยังอยู่ในระยะมองเห็น
    }
    // พื้น
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(G * 2.4, G * 2.4), new THREE.MeshLambertMaterial({ color: 0xb9c4a5 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
    t.dyn.add(ground);

    // ── ผังพื้นจากแผนที่ดาวเทียม (สเกลจริง · เหนือ=บน=−Z) วางเป็นฐานใต้รูปโดรน ──
    if (st.baseMap && st.baseMap.url) {
      const W = Math.max(2, +st.baseMap.widthM || 30);
      const bt = p3Tex(st.baseMap.url);
      const bmesh = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshBasicMaterial({ map: bt }));
      bmesh.rotation.x = -Math.PI / 2; bmesh.position.y = -0.01;
      t.dyn.add(bmesh);
    }

    // รูปโดรนวางบนพื้น (สเกลจาก photoW) — ใส่ใน group เพื่อ ย้าย/หมุน ได้ทั้งก้อน
    if (st.photo) {
      const pgrp = new THREE.Group();
      pgrp.position.set(+st.photoX || 0, 0, +st.photoZ || 0);
      // rotation.y ลบ = หมุนตามเข็มเมื่อมองจากด้านบน (เหนือ=−Z อยู่บนจอ)
      pgrp.rotation.y = -((+st.photoRot || 0) * Math.PI) / 180;
      t.dyn.add(pgrp);

      const layoutHandles = (pw, ph) => {
        if (!photoEdit) return;
        // ล้างจุดจับ+กรอบ+ก้านของรอบก่อนให้หมด (ตอนแรกยังไม่รู้สัดส่วนรูป จึงวาดซ้ำหลังเท็กซ์เจอร์โหลด)
        (t.photoDeco || []).forEach((h) => {
          h.parent && h.parent.remove(h);
          if (h.geometry) h.geometry.dispose();
          if (h.material) h.material.dispose();
        });
        t.photoDeco = []; t.pickPhotoH = [];
        const keep = (o) => { t.photoDeco.push(o); return o; };
        const hw = pw / 2, hh = ph / 2;
        const R = Math.max(0.35, pw / 45);
        // 4 มุม = ย่อ/ขยาย
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12),
            new THREE.MeshBasicMaterial({ color: 0x2563EB, transparent: true, opacity: 1, depthTest: false }));
          m.position.set(sx * hw, 0.06, sz * hh);
          m.renderOrder = 60; m.userData = { photoHandle: "scale" };
          pgrp.add(keep(m)); t.pickPhotoH.push(m);
        });
        // จุดหมุน = ยื่นออกเหนือขอบบนของรูป
        const armLen = hh + Math.max(1.2, pw / 12);
        const rot = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 1, depthTest: false }));
        rot.position.set(0, 0.06, -armLen);
        rot.renderOrder = 60; rot.userData = { photoHandle: "rot" };
        pgrp.add(keep(rot)); t.pickPhotoH.push(rot);
        // ก้านเชื่อมจุดหมุน
        const arm = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.06, -hh), new THREE.Vector3(0, 0.06, -armLen)]),
          new THREE.LineBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 1, depthTest: false }));
        arm.renderOrder = 59; pgrp.add(keep(arm));
        // กรอบรูป
        const fr = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-hw, 0.05, -hh), new THREE.Vector3(hw, 0.05, -hh),
            new THREE.Vector3(hw, 0.05, hh), new THREE.Vector3(-hw, 0.05, hh)]),
          new THREE.LineBasicMaterial({ color: 0x2563EB, transparent: true, opacity: 1, depthTest: false }));
        fr.renderOrder = 58; pgrp.add(keep(fr));
      };

      const tex = p3Tex(st.photo, (tx) => {
        const img = tx.image; if (!img) return;
        const pw = +st.photoW || 30, ph = pw * (img.height / img.width);
        photoMesh.geometry.dispose();
        photoMesh.geometry = new THREE.PlaneGeometry(pw, ph);
        layoutHandles(pw, ph);
        const t2 = tRef.current; if (t2.renderer) t2.renderer.render(t2.scene, t2.camera);
      });
      // ใช้ MeshBasic → รูปโดรนแสดงสีจริงตามต้นฉบับ ไม่โดนแสงอาทิตย์จำลอง/ambient ส่องซ้ำ
      // color เป็นเทา = ตัวคูณหรี่ความสว่าง (รูปโดรนถ่ายกลางแดดมักสว่างจ้า) ปรับได้ด้วยสไลเดอร์ "ความสว่างรูป"
      const bright = Math.max(0.25, Math.min(1, st.photoBright == null ? 0.7 : +st.photoBright));
      const photoMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: Math.max(0.15, Math.min(1, +st.photoOpacity || 0.95)), color: new THREE.Color(bright, bright, bright) });
      const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(+st.photoW || 30, +st.photoW || 30), photoMat);
      // รูปโดรนอยู่ติดพื้นเสมอ (y=0) เป็นผังพื้น — ยกความสูงอาคารแล้วหลังคาลอยขึ้น รูปคงอยู่ที่พื้น
      photoMesh.rotation.x = -Math.PI / 2;
      pgrp.add(photoMesh);
      if (photoEdit) t.pickPhoto = [photoMesh];
      layoutHandles(+st.photoW || 30, +st.photoW || 30);
    } else if (!st.baseMap) {
      const grid = new THREE.GridHelper(G, G, 0x8898a8, 0xaab8c6);
      grid.position.y = 0.01; t.dyn.add(grid);
    }

    // เข็มทิศ N (เหนือ = -Z)
    const mkText = (txt, color) => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const x = cv.getContext("2d"); x.fillStyle = color; x.font = "bold 44px system-ui"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 32, 34);
      const tx = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false }));
      sp.scale.set(2.2, 2.2, 1); return sp;
    };
    const north = mkText("N", "var(--tint-red-tx)"); north.position.set(0, 1.4, -G / 2 - 1.5); t.dyn.add(north);

    // ── หลังคาแต่ละผืน + แผง ──
    (st.roofs || []).forEach((roof) => {
      const isPoly = roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3;
      // โหมดเพิ่มแผงเอง: โชว์ "ช่องว่าง" จาง ๆ ทุกช่องที่ยังวางได้ (รวมนอกกรอบแถว/คอลัมน์) แตะแล้วเติมแผง
      const pan = p3Panels(roof, roof.id === selRoof && addMode ? { slots: true, blk: selBlk } : null);
      const selected = roof.id === selRoof;

      const g = new THREE.Group();
      g.position.set(+roof.x || 0, +roof.h || 3, +roof.z || 0);
      g.rotation.y = -(((+roof.az || 180) - 180) * P3_DEG);   // az=180 → ลาดหันทิศใต้ (+Z)
      const tilt = new THREE.Group();
      tilt.rotation.x = (+roof.pitch || 0) * P3_DEG;          // ยกปลาย -Z ขึ้น (ชายคาอยู่ z=0)
      // สีเดียวทุกผืนเสมอ — ไม่อ่าน roof.color ของงานเก่า เพื่อให้บ้านหลังเดียวดูเป็นหลังเดียว
      const roofMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(P3_ROOF_COLOR), transparent: true, opacity: 0.96, side: THREE.DoubleSide });
      let sideParent = null; // จั่ว/ปั้นหยา: แผงแยกด้าน

      if (roof.kind === "hip") {
        // ── ปั้นหยา: 4 ผืนชนสันกลาง (ต่อกันสนิท) + ผนังเดียวทั้งหลัง ──
        const H = pan.hip || p3HipFaces(roof);
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        sideParent = {};
        H.faces.forEach((f) => {
          const wrap = new THREE.Group(); wrap.rotation.y = f.wrapY;
          const tiltF = new THREE.Group(); tiltF.position.set(0, 0, f.tiltZ); tiltF.rotation.x = pitchR;
          const shp = new THREE.Shape();
          f.poly.forEach((p, i) => { if (i === 0) shp.moveTo(p.x, -p.z); else shp.lineTo(p.x, -p.z); });
          const slab = new THREE.Mesh(new THREE.ShapeGeometry(shp), roofMat);
          slab.rotation.x = -Math.PI / 2; slab.position.y = -0.02;
          slab.castShadow = true; slab.receiveShadow = true;
          slab.userData = { kind: "roof", id: roof.id };
          tiltF.add(slab); t.pickRoofs.push(slab);
          const lp = f.poly.concat([f.poly[0]]).map((p) => new THREE.Vector3(p.x, 0.02, p.z));
          tiltF.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp),
            new THREE.LineBasicMaterial({ color: selected ? 0x16a34a : 0x475569 })));
          wrap.add(tiltF); g.add(wrap);
          sideParent[f.side] = tiltF;
        });
        // สันหลังคากลาง
        const beam = new THREE.Mesh(new THREE.BoxGeometry(H.r + 0.15, 0.12, 0.18),
          new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
        beam.position.set(0, H.rise + 0.02, 0); beam.castShadow = true; g.add(beam);
        // ผนังเดียวใต้ทั้งหลัง — ให้ความรู้สึกเป็นบ้านหลังเดียว
        const wallH = new THREE.Mesh(new THREE.BoxGeometry(H.w * 0.97, +roof.h || 3, H.d * 0.97),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wallH.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallH.castShadow = true; wallH.receiveShadow = true;
        g.add(wallH);
      } else if (roof.kind === "dome") {
        // ── โดม: ผิวโค้งยืดไปตามแนวยาว (สานเป็นแถบสี่เหลี่ยม) + หน้าจั่วโค้ง 2 ข้าง + ผนังใต้ชายคา ──
        const D = pan.dome || p3DomeGeo(roof);
        const L = D.len, segs = 30;
        const tAt = (i) => -D.th + 2 * D.th * i / segs;
        const pos = [];
        for (let i = 0; i < segs; i++) {
          const y1 = D.yAt(tAt(i)), z1 = D.zAt(tAt(i)), y2 = D.yAt(tAt(i + 1)), z2 = D.zAt(tAt(i + 1));
          pos.push(-L / 2, y1, z1, L / 2, y1, z1, L / 2, y2, z2);
          pos.push(-L / 2, y1, z1, L / 2, y2, z2, -L / 2, y2, z2);
        }
        const dgeo = new THREE.BufferGeometry();
        dgeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        dgeo.computeVertexNormals();
        const shell = new THREE.Mesh(dgeo, roofMat);
        shell.castShadow = true; shell.receiveShadow = true;
        shell.userData = { kind: "roof", id: roof.id };
        g.add(shell); t.pickRoofs.push(shell);
        // เส้นขอบโค้ง 2 ข้าง (เขียว = ผืนที่เลือกอยู่)
        const domeEdge = new THREE.LineBasicMaterial({ color: selected ? 0x16a34a : 0x475569 });
        [-1, 1].forEach((sgn) => {
          const ps = [];
          for (let i = 0; i <= segs; i++) ps.push(new THREE.Vector3(sgn * L / 2, D.yAt(tAt(i)) + 0.02, D.zAt(tAt(i))));
          g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ps), domeEdge));
        });
        // หน้าจั่วโค้งปิดหัว-ท้าย (shape x = แกน z ของผัง เหมือนหน้าจั่วของหลังคาจั่ว)
        const aShape = new THREE.Shape();
        aShape.moveTo(-D.span / 2, 0);
        for (let i = 0; i <= segs; i++) aShape.lineTo(D.zAt(tAt(i)), D.yAt(tAt(i)));
        aShape.lineTo(D.span / 2, 0); aShape.closePath();
        const aMat = new THREE.MeshLambertMaterial({ color: 0xefe9dd, side: THREE.DoubleSide });
        [-1, 1].forEach((sgn) => {
          const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(aShape, { depth: 0.1, bevelEnabled: false }), aMat);
          cap.rotation.y = Math.PI / 2;
          cap.position.set(sgn * (L / 2) - 0.05, 0, 0);
          cap.castShadow = true; cap.receiveShadow = true;
          g.add(cap);
        });
        // ผนังใต้ชายคา
        const wallD = new THREE.Mesh(new THREE.BoxGeometry(L * 0.97, +roof.h || 3, D.span * 0.97),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wallD.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallD.castShadow = true; wallD.receiveShadow = true;
        g.add(wallD);
      } else if (roof.kind === "gable") {
        // ── หลังคาจั่ว: ลาด 2 ด้านชนสันหลังคากลาง + หน้าจั่วสามเหลี่ยม ──
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        const cosP = Math.max(0.25, Math.cos(pitchR));
        const half = (+roof.span || 8) / 2, slopeLen = half / cosP;
        const rise = half * Math.tan(pitchR);
        const ridgeLen = +roof.ridge || 8;
        // ด้าน A (หันทิศ az): ชายคาที่ local z=+half ลาดขึ้นไปหาสันที่ z=0
        tilt.position.set(0, 0, half);
        const slabA = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen, 0.09, slopeLen), roofMat);
        slabA.position.set(0, -0.045, -slopeLen / 2);
        slabA.castShadow = true; slabA.receiveShadow = true;
        slabA.userData = { kind: "roof", id: roof.id };
        tilt.add(slabA); t.pickRoofs.push(slabA);
        // ด้าน B (หันตรงข้าม): หมุน 180° รอบแกนตั้งแล้วใช้เรขาคณิตเดียวกัน
        const wrapB = new THREE.Group(); wrapB.rotation.y = Math.PI;
        const tiltB = new THREE.Group(); tiltB.position.set(0, 0, half); tiltB.rotation.x = pitchR;
        const slabB = slabA.clone(); slabB.userData = { kind: "roof", id: roof.id };
        tiltB.add(slabB); t.pickRoofs.push(slabB);
        wrapB.add(tiltB); g.add(wrapB);
        sideParent = { A: tilt, B: tiltB };
        // สันหลังคา (เส้นคานบนสุด)
        const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen + 0.15, 0.12, 0.18),
          new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
        ridgeBeam.position.set(0, rise + 0.02, 0); ridgeBeam.castShadow = true; g.add(ridgeBeam);
        // หน้าจั่วสามเหลี่ยม 2 ข้าง (ระนาบตั้งฉากกับสัน)
        const triShape = new THREE.Shape();
        triShape.moveTo(-half, 0); triShape.lineTo(half, 0); triShape.lineTo(0, rise); triShape.closePath();
        const triMat = new THREE.MeshLambertMaterial({ color: 0xefe9dd, side: THREE.DoubleSide });
        [-1, 1].forEach((sgn) => {
          const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape, { depth: 0.1, bevelEnabled: false }), triMat);
          tri.rotation.y = Math.PI / 2;                        // ระนาบสามเหลี่ยมขวางแกนสัน (shape x → แกน Z)
          tri.position.set(sgn * (ridgeLen / 2) - 0.05, 0, 0);
          tri.castShadow = true; tri.receiveShadow = true;
          g.add(tri);
        });
        // ผนังใต้ชายคา
        const wallG = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen * 0.94, +roof.h || 3, (+roof.span || 8) * 0.94),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wallG.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallG.castShadow = true; wallG.receiveShadow = true;
        g.add(wallG);
        if (selected) [slabA, slabB].forEach((sl) => {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ridgeLen + 0.1, 0.12, slopeLen + 0.1)),
            new THREE.LineBasicMaterial({ color: 0x16a34a }));
          eg.position.copy(sl.position); sl.parent.add(eg);
        });
      } else if (isPoly) {
        // ── โมเดลจุดร่วม: ผิวหลังคา = รูปหลายเหลี่ยมยกตาม "ความสูงของแต่ละมุม" (roof.ph) ──
        // ยกทั้ง g ขึ้นตาม "ความสูงอาคาร" (buildH) → หลังคา+แผงลอยขึ้นพร้อมกัน ผนังเติมช่องว่างลงถึงพื้น
        const bH = +st.buildH || 0;
        g.position.y = bH; g.rotation.y = 0;   // ความสูงทรงเก็บที่ตัวมุม + ยกฐานด้วยความสูงอาคาร
        const ph = p3PhOf(roof);
        const V3 = (a) => new THREE.Vector3(a.x, a.y, a.z);
        // ผิวหลังคา (สานสามเหลี่ยมแบบพัดจากมุม 0)
        const vs3 = roof.pts.map((p, i) => [(+p.x || 0), ph[i], (+p.z || 0)]);
        const pos = [];
        for (let i = 1; i < vs3.length - 1; i++) { pos.push.apply(pos, vs3[0]); pos.push.apply(pos, vs3[i]); pos.push.apply(pos, vs3[i + 1]); }
        const sgeo = new THREE.BufferGeometry();
        sgeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        sgeo.computeVertexNormals();
        const slab = new THREE.Mesh(sgeo, roofMat);
        slab.castShadow = true; slab.receiveShadow = true;
        slab.userData = { kind: "roof", id: roof.id };
        g.add(slab); t.pickRoofs.push(slab);
        // ขอบเส้นรอบผืน (ตามความสูงมุม)
        const linePts = roof.pts.map((p, i) => new THREE.Vector3(+p.x || 0, ph[i] + 0.02, +p.z || 0));
        linePts.push(linePts[0].clone());
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), new THREE.LineBasicMaterial({ color: selected ? 0x16a34a : 0x475569 })));
        // ผนังอาคาร: จากชายคา (มุมต่ำสุด) ลงถึงพื้นจริง — ต้องอยู่ "ใต้" หลังคา
        // ExtrudeGeometry+rotateX(-90°) จะพุ่งขึ้น +y → ตั้ง position.y = -bH ให้ผืนกินช่วง g-local [-bH, minPh] = โลก [0, bH+minPh] (พื้น→ชายคา)
        const minPh = Math.min.apply(null, ph);
        const wallH = minPh + bH;
        if (wallH > 0.25) {
          const wshp = new THREE.Shape();
          roof.pts.forEach((p, i) => { const x = +p.x || 0, z = +p.z || 0; if (i === 0) wshp.moveTo(x, -z); else wshp.lineTo(x, -z); });
          const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wshp, { depth: wallH, bevelEnabled: false }),
            new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.4 }));
          wall.rotation.x = -Math.PI / 2; wall.position.y = -bH; wall.castShadow = true; wall.receiveShadow = true; g.add(wall);
        }
        // ── จุดแก้มุม (เลือกได้ · จุดที่เลือก = ส้มใหญ่ ปรับความสูงได้) — ซ่อนได้ด้วยปุ่มจุดเขียว/ล็อก ──
        if (selected && showVerts && !locked) {
          t.selPolyRoof = roof; t.selTilt = null; t.selInfo = null;
          roof.pts.forEach((p, idx) => {
            const isSel = selVert && selVert.roofId === roof.id && selVert.idx === idx;
            const halo = new THREE.Mesh(new THREE.SphereGeometry(isSel ? 0.34 : 0.27, 14, 12),
              new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true }));
            halo.position.set(+p.x || 0, ph[idx] + 0.02, +p.z || 0); halo.renderOrder = 20;
            halo.userData = { kind: "vertex", roofId: roof.id, idx };
            const dot = new THREE.Mesh(new THREE.SphereGeometry(isSel ? 0.22 : 0.17, 14, 12),
              new THREE.MeshBasicMaterial({ color: isSel ? 0xf59e0b : 0x16a34a, depthTest: false, transparent: true }));
            dot.position.copy(halo.position); dot.renderOrder = 21; dot.userData = halo.userData;
            g.add(halo); g.add(dot); t.pickVerts.push(halo, dot);
          });
        }
      } else {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(roof.w, 0.09, roof.d), roofMat);
        slab.position.set(0, -0.045, -roof.d / 2);
        slab.castShadow = true; slab.receiveShadow = true;
        slab.userData = { kind: "roof", id: roof.id };
        tilt.add(slab); t.pickRoofs.push(slab);
        // ผนังใต้หลังคาแบบจาง
        const wall = new THREE.Mesh(new THREE.BoxGeometry(roof.w * 0.92, +roof.h || 3, roof.d * 0.8),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wall.position.set(+roof.x || 0, (+roof.h || 3) / 2 - 0.15, (+roof.z || 0));
        wall.rotation.y = g.rotation.y;
        const midLocal = new THREE.Vector3(0, 0, -roof.d / 2).applyEuler(new THREE.Euler(0, g.rotation.y, 0));
        wall.position.x += midLocal.x; wall.position.z += midLocal.z;
        wall.castShadow = true; wall.receiveShadow = true;
        t.dyn.add(wall);
        if (selected) {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(roof.w + 0.1, 0.12, roof.d + 0.1)),
            new THREE.LineBasicMaterial({ color: 0x16a34a }));
          eg.position.copy(slab.position); tilt.add(eg);
        }
      }
      g.add(tilt);

      /* แผงทุกแผ่นในผืนหนึ่งขนาดเท่ากันหมด — ใช้รูปทรงร่วมกันได้
         เดิมสร้าง BoxGeometry ใหม่ทีละแผ่น (แผง+กรอบ+ขาตั้ง) หลังคาใหญ่ ๆ ตกหลายร้อยชิ้นต่อการวาดหนึ่งครั้ง
         ทุกครั้งที่ขยับสไลเดอร์ก็สร้างใหม่ทั้งชุด นั่นคือต้นเหตุที่ลากแล้วกระตุก */
      const geoBox = {};
      const boxOf = (w, h, d) => {
        const k = w.toFixed(3) + "|" + h.toFixed(3) + "|" + d.toFixed(3);
        return geoBox[k] || (geoBox[k] = new THREE.BoxGeometry(w, h, d));
      };
      // แผง (แผงที่เว้นไว้ = โปร่งจาง แตะเพื่อใส่คืน)
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x10305e, roughness: 0.35, metalness: 0.55 });
      const ghostMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16 });
      const frameMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
      // poly: วางแผงในพิกัด g (local) พร้อมหมุนตามระนาบ best-fit ; ทรงอื่น: วางใน tilt แบบเดิม
      let pquat = null, pnoff = null;
      if (isPoly && pan.plane) {
        const V = (a) => new THREE.Vector3(a.x, a.y, a.z);
        // ต้องเป็นแกน right-handed (det +1) ไม่งั้น quaternion เพี้ยน แผงเอียงผิด → zAxis = u×n (= -v)
        const pv = pan.plane.v;
        pquat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(pan.plane.u), V(pan.plane.n), V({ x: -pv.x, y: -pv.y, z: -pv.z })));
        pnoff = V(pan.plane.n).multiplyScalar(0.06);
      }
      // โดม: แต่ละแผงเอียงตามความชันของโค้งจุดนั้น (rx) แล้วยกออกตามแนวตั้งฉากของผิว
      const isDomeR = roof.kind === "dome";
      const slotMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.22, depthTest: false });
      const legMat = new THREE.MeshLambertMaterial({ color: 0x9aa3ad });   // ใช้ร่วมกันทุกขา ไม่ต้องสร้างใหม่ทีละต้น
      // ช่องที่เว้นไว้ = โชว์เป็นแผงจาง ๆ เฉพาะตอนกำลังจัดแผงผืนนี้ (ไว้แตะใส่คืน)
      // นอกจากนั้นไม่วาดเลย — ภาพ 3D/รูป PNG/รายงาน จะได้ไม่มีช่องโหว่จาง ๆ ค้างอยู่
      const showGhost = selected && tab === "panel";
      pan.list.forEach((p) => {
        if (p.skip && !showGhost) return;
        const parent = (sideParent && sideParent[p.side]) || (isPoly || isDomeR ? g : tilt);
        const pw = p.pw || pan.pw, pd = p.pd || pan.pd;
        // ขาตั้งเอียง: หมุนแผงรอบแกนยาวของตัวเอง (X) ก่อน แล้วค่อยหมุนทั้งชุดรอบแกนตั้งฉากผิว (Y) → ลำดับ YXZ
        const tR = p.tiltR || 0, ryR = p.ry || 0;
        const lift = tR ? (pd / 2) * Math.sin(tR) : 0;    // ยกให้ขอบล่างของแผงแตะผิวหลังคาพอดี
        const mat = p.slot ? slotMat : p.skip ? ghostMat : panelMat;
        const pm = new THREE.Mesh(boxOf(pw - 0.02, P3_PANEL_T, pd - 0.02), mat);
        if (isDomeR) { pm.position.set(p.x, p.y + 0.06 * Math.cos(p.rx), p.z + 0.06 * Math.sin(p.rx)); pm.rotation.x = p.rx; }
        else if (isPoly && pquat) {
          pm.position.set(p.x + pnoff.x, p.y + pnoff.y, p.z + pnoff.z);
          pm.quaternion.copy(pquat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tR, ryR, 0, "YXZ")));
          if (lift) pm.position.addScaledVector(new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z), lift);
        } else { pm.position.set(p.x, 0.06 + lift, p.z); pm.rotation.set(tR, ryR, 0, "YXZ"); }
        if (p.slot) pm.renderOrder = 15;
        if (!p.skip && !p.slot) { pm.castShadow = true; pm.receiveShadow = true; }
        pm.userData = { kind: "panel", roofId: roof.id, key: p.key, slot: !!p.slot };
        parent.add(pm); t.pickPanels.push(pm);
        if (!p.skip && !p.slot) {
          const fr = new THREE.Mesh(boxOf(pw, 0.012, pd), frameMat);
          if (isDomeR) { fr.position.set(p.x, p.y + 0.028 * Math.cos(p.rx), p.z + 0.028 * Math.sin(p.rx)); fr.rotation.x = p.rx; }
          else if (isPoly && pquat) {
            fr.position.set(p.x + pnoff.x * 0.5, p.y + pnoff.y * 0.5, p.z + pnoff.z * 0.5);
            fr.quaternion.copy(pquat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tR, ryR, 0, "YXZ")));
            if (lift) fr.position.addScaledVector(new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z), lift);
          } else { fr.position.set(p.x, 0.028 + lift, p.z); fr.rotation.set(tR, ryR, 0, "YXZ"); }
          parent.add(fr);
          // ขาตั้ง: เสาสองต้นใต้ขอบสูงของแผง ให้เห็นว่ายกด้วยโครง ไม่ใช่แปะราบ
          if (tR > 0.02) {
            const legH = pd * Math.sin(tR);
            [-1, 1].forEach((sg) => {
              const leg = new THREE.Mesh(boxOf(0.05, legH, 0.05), legMat);
              const lx = sg * (pw / 2 - 0.15), lz = -pd / 2 + 0.05;
              const off = new THREE.Vector3(lx, legH / 2, lz).applyEuler(new THREE.Euler(0, ryR, 0));
              if (isPoly && pquat) {
                const w3 = off.clone().applyQuaternion(pquat);
                leg.position.set(p.x + w3.x, p.y + w3.y, p.z + w3.z);
                leg.quaternion.copy(pquat);
              } else leg.position.set(p.x + off.x, off.y, p.z + off.z);
              leg.rotation.y = ryR; leg.castShadow = true; parent.add(leg);
            });
          }
        }
      });
      // ── จุดจับชุดแผงบนภาพ: ลากตรงกลาง = ย้ายทั้งชุด · ลากมุม = ย่อ/ขยาย (เพิ่ม-ลดแถว/คอลัมน์) · จุดบน = หมุน ──
      // โดมเป็นผิวโค้ง กรอบสี่เหลี่ยมแบนวางทับไม่ได้ → ใช้สไลเดอร์แทน
      if (selected && tab === "panel" && !isDomeR && pan.rects && pan.rects.length) {
        const biSel = Math.min(selBlk, (pan.blocks || []).length - 1);
        const gizMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, depthTest: false, transparent: true });
        const lineMat = new THREE.LineBasicMaterial({ color: 0x2563eb, depthTest: false, transparent: true });
        pan.rects.filter((rc) => rc.blk === biSel && rc.w > 0 && rc.h > 0).forEach((rc) => {
          const parent = (sideParent && sideParent[rc.side]) || (isPoly ? g : tilt);
          // frame = วิธีแปลงพิกัดผิว (u,v) ↔ พิกัดใน parent (ใช้ตอนลากด้วย)
          const fr = isPoly && pan.plane
            ? { parent, o: new THREE.Vector3(pan.plane.c.x, pan.plane.c.y, pan.plane.c.z),
                un: new THREE.Vector3(pan.plane.u.x, pan.plane.u.y, pan.plane.u.z),
                vn: new THREE.Vector3(pan.plane.v.x, pan.plane.v.y, pan.plane.v.z),
                nn: new THREE.Vector3(pan.plane.n.x, pan.plane.n.y, pan.plane.n.z) }
            : { parent, o: new THREE.Vector3(0, 0, 0), un: new THREE.Vector3(1, 0, 0), vn: new THREE.Vector3(0, 0, 1), nn: new THREE.Vector3(0, 1, 0) };
          const frIdx = t.blkFrames.length; t.blkFrames.push(fr);
          const rr = rc.rot * P3_DEG, cr = Math.cos(rr), sr = Math.sin(rr);
          const at = (a, b, up) => {   // (a,b) ในกรอบบล็อก → ตำแหน่งใน parent
            const u = rc.cu + a * cr - b * sr, v = rc.cv + a * sr + b * cr;
            const p = pan.toMesh({ u, v });
            const lift = up || 0.2;
            return isPoly ? new THREE.Vector3(p.x + fr.nn.x * lift, p.y + fr.nn.y * lift, p.z + fr.nn.z * lift)
                          : new THREE.Vector3(p.x, lift, p.z);
          };
          const hw = rc.w / 2, hh = rc.h / 2;
          const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
          // จุดทั้งหมดอยู่ในพิกัดของ parent อยู่แล้ว → ใส่เส้นกรอบเข้า parent ตรง ๆ
          const loop = corners.map((c2) => at(c2[0], c2[1], 0.16)).concat([at(-hw, -hh, 0.16)]);
          const box = new THREE.Line(new THREE.BufferGeometry().setFromPoints(loop), lineMat);
          box.renderOrder = 29; parent.add(box);
          const mk = (pos, r, mode, corner) => {
            const h = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), gizMat);
            h.position.copy(pos); h.renderOrder = 30;
            h.userData = { kind: "blk", roofId: roof.id, blk: biSel, mode, corner, frIdx, rect: rc };
            parent.add(h); t.pickBlk.push(h);
          };
          corners.forEach((c2, i) => mk(at(c2[0], c2[1]), 0.26, "size", i));
          mk(at(0, 0), 0.34, "move");
          mk(at(0, hh + 0.9), 0.24, "rot");
        });
      }
      t.dyn.add(g);
    });

    // ── จุดดูดติด (snap) — ซ่อนพร้อมจุดเขียว/ตอนล็อก เพื่อดูโมเดลสะอาด ──
    (() => {
      if (!showVerts || locked) return;
      const sp = p3SnapPoints(st.roofs, t.selPolyRoof ? t.selPolyRoof.id : null);
      if (!sp.length) return;
      const geo = new THREE.SphereGeometry(0.22, 10, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0x64748b, depthTest: false, transparent: true, opacity: 0.9 });
      // จุด snap = เป้าหมายพิกัด x,z บนผังพื้น → วางที่ระดับพื้นเสมอ (ตรงกับรูปโดรน)
      sp.forEach((p) => {
        const d = new THREE.Mesh(geo, mat);
        d.position.set(p.x, 0.15, p.z);
        d.renderOrder = 18;
        t.dyn.add(d);
      });
    })();

    // ── สิ่งบดบัง ──
    (st.obstacles || []).forEach((o) => {
      const grp = new THREE.Group(); grp.position.set(+o.x || 0, 0, +o.z || 0);
      // rotation.y ลบ = หมุนตามเข็มเมื่อมองจากด้านบน (ใช้เกณฑ์เดียวกับการหมุนรูปโดรน)
      grp.rotation.y = -((+o.rot || 0) * P3_DEG);
      const selectedO = o.id === selObs;
      if (o.kind === "tree") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, o.h * 0.45, 8), new THREE.MeshLambertMaterial({ color: 0x7c5a3a }));
        trunk.position.y = o.h * 0.225; trunk.castShadow = true; grp.add(trunk);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(Math.max(o.w, 1) / 2, 12, 10), new THREE.MeshLambertMaterial({ color: 0x3f7d44 }));
        crown.position.y = o.h * 0.45 + Math.max(o.w, 1) / 2 * 0.8; crown.castShadow = true; crown.receiveShadow = true;
        crown.userData = { kind: "obstacle", id: o.id }; grp.add(crown); t.pickObs.push(crown);
      } else {
        const bx = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), new THREE.MeshLambertMaterial({ color: selectedO ? 0x8aa8c8 : 0x9aa8b5 }));
        bx.position.y = o.h / 2; bx.castShadow = true; bx.receiveShadow = true;
        bx.userData = { kind: "obstacle", id: o.id }; grp.add(bx); t.pickObs.push(bx);
      }
      if (selectedO) {
        const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(o.w + 0.1, o.h + 0.1, o.d + 0.1)), new THREE.LineBasicMaterial({ color: 0x16a34a }));
        eg.position.y = o.h / 2; grp.add(eg);
      }
      t.dyn.add(grp);
    });

    // ── เส้นตัวอย่างตอนวาดหลังคาทรงอิสระ ──
    if (drawing && drawPts.length) {
      // transparent:true → จุด/เส้นไปอยู่กลุ่มการวาดเดียวกับรูปโดรน (โปร่งแสง) แล้ว renderOrder สูงกว่าจึงวาดทับรูปได้จริง
      // ถ้าปล่อยเป็น opaque รูปโปร่งแสงจะถูกวาดทีหลังทับจุดจนซีด (เหมือนจุดอยู่ "ใต้รูป")
      // วาดบนผังพื้น (รูปโดรนอยู่ที่พื้นเสมอ)
      const mat = new THREE.LineBasicMaterial({ color: 0x16a34a, depthTest: false, transparent: true });
      const pts3 = drawPts.map((p) => new THREE.Vector3(p.x, 0.15, p.z));
      if (drawPts.length >= 3) pts3.push(pts3[0].clone());
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), mat);
      line.renderOrder = 20; t.dyn.add(line);
      const R = Math.max(0.13, (+st.photoW || 30) / 130);
      drawPts.forEach((p, i) => {
        const first = i === 0;
        const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.5, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true }));
        halo.position.set(p.x, 0.2, p.z); halo.renderOrder = 20; t.dyn.add(halo);
        const dot = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 12),
          new THREE.MeshBasicMaterial({ color: first ? 0x15803d : 0x16a34a, depthTest: false, transparent: true }));
        dot.position.set(p.x, 0.22, p.z); dot.renderOrder = 21; t.dyn.add(dot);
      });
    }

    // ── เส้นวัดระยะ + ป้ายตัวเลข ──
    // ป้ายเป็นสไปรต์ที่วาดลง canvas เอง (กว้างตามความยาวข้อความจริง ไม่ตัดคำ) และ depthTest:false
    // เพื่อให้เลขลอยอ่านได้เสมอ แม้เส้นจะพาดผ่านหลังคาหรือสิ่งบดบัง
    /* ขนาดป้าย/จุด อิงความกว้างผัง — ผังใหญ่ป้ายก็โตตาม แต่ตั้งไว้ให้เล็กพอที่หลาย ๆ เส้น
       วางใกล้กันแล้วยังไม่บังกันเอง (ตัวเลขบนภาพเป็นของอ่านประกอบ ไม่ใช่พระเอกของผัง) */
    const tagH = Math.max(0.55, (+st.groundW || 40) / 46);
    const mkTag = (txt, hex, small) => {
      const px = small ? 34 : 42, font = "bold " + px + "px system-ui";
      const mc = document.createElement("canvas").getContext("2d"); mc.font = font;
      const tw = Math.ceil(mc.measureText(txt).width);
      const cv2 = document.createElement("canvas");
      cv2.width = tw + 40; cv2.height = px + 34;
      const x = cv2.getContext("2d");
      x.font = font; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "rgba(255,255,255,.95)"; x.strokeStyle = hex; x.lineWidth = 5;
      const bw = cv2.width - 10, bh = cv2.height - 10;
      x.beginPath();
      if (x.roundRect) x.roundRect(5, 5, bw, bh, 15); else x.rect(5, 5, bw, bh);
      x.fill(); x.stroke();
      x.fillStyle = hex; x.fillText(txt, cv2.width / 2, cv2.height / 2 + 1);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv2), transparent: true, depthTest: false }));
      sp.renderOrder = 30;
      const H = tagH * (small ? 0.74 : 1);
      sp.scale.set(H * (cv2.width / cv2.height), H, 1);
      return sp;
    };
    const drawMeasPath = (pts, hex, color, bold, tag) => {
      if (!pts || pts.length < 2) return;
      const Y = 0.19;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, Y, p.z))),
        new THREE.LineBasicMaterial({ color: color, depthTest: false, transparent: true, opacity: bold ? 1 : 0.8 }));
      line.renderOrder = 22; t.dyn.add(line);
      const R = Math.max(0.055, (+st.groundW || 40) / 440) * (bold ? 1.45 : 1);
      const dotMat = new THREE.MeshBasicMaterial({ color: color, depthTest: false, transparent: true });
      pts.forEach((p, i) => {
        const d = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), dotMat);
        d.position.set(p.x, Y + 0.02, p.z); d.renderOrder = 23; t.dyn.add(d);
        if (i === 0) return;
        const q = pts[i - 1], seg = Math.hypot(p.x - q.x, p.z - q.z);
        // ช่วงเดียวไม่ต้องแยกป้าย เพราะป้ายรวมบอกเลขเดียวกันอยู่แล้ว
        if (pts.length > 2 && seg > 0.5) {
          const lb = mkTag(seg.toFixed(2), hex, true);
          lb.position.set((p.x + q.x) / 2, Y + tagH * 0.62, (p.z + q.z) / 2); t.dyn.add(lb);
        }
      });
      if (tag) {
        const lb = mkTag(tag, hex, false);
        const last = pts[pts.length - 1];
        lb.position.set(last.x, Y + tagH * 1.7, last.z); t.dyn.add(lb);
      }
    };
    /* ปิดเส้นไหนไว้ = ไม่วาดเลย (ทั้งเส้น จุด และป้าย) — ผังที่วัดไว้หลายเส้นจะได้เปิดดูทีละอันได้ */
    (st.measures || []).filter((m) => !m.off).forEach((m) => {
      const km = p3MeasKind(m.kind);
      const hex = "#" + km.c.toString(16).padStart(6, "0");
      const rise = Math.abs(+m.rise || 0);
      drawMeasPath(m.pts || [], hex, km.c, selMeas === m.id,
        (m.name || "ระยะ") + " · " + p3MeasLen(m).toFixed(2) + " ม." + (rise ? " (ราบ+ขึ้นลง " + rise + ")" : ""));
    });
    if (measuring && measPts.length) {
      const run = p3MeasLen({ pts: measPts });
      drawMeasPath(measPts, "#15803D", 0x16A34A, true, measPts.length >= 2 ? run.toFixed(2) + " ม." : null);
      if (measPts.length === 1) {
        const d = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.08, (+st.groundW || 40) / 320), 16, 12),
          new THREE.MeshBasicMaterial({ color: 0x16A34A, depthTest: false, transparent: true }));
        d.position.set(measPts[0].x, 0.22, measPts[0].z); d.renderOrder = 23; t.dyn.add(d);
      }
    }
    /* ผูกเฉพาะส่วนของ st ที่ฉากนี้ใช้จริง — ห้ามผูกทั้ง st
       เดิมผูกทั้งก้อน พอกดกวาดเงาทั้งวัน (ขยับ st.sun.hour ทุกเฟรม) ฉากทั้งฉากถูกรื้อสร้างใหม่ทุกเฟรม
       ทั้งที่หลังคา/แผง/สิ่งบดบัง ไม่ได้เปลี่ยนอะไรเลย — แดดมีเอฟเฟกต์ของตัวเองอยู่แล้ว
       eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [st.roofs, st.obstacles, st.groundW, st.buildH, st.photo, st.photoW, st.photoOpacity, st.photoBright,
    st.photoRot, st.photoX, st.photoZ, st.baseMap,
    st.measures, selMeas, measuring, measPts,
    selRoof, selObs, selVert, ready, drawing, drawPts, showVerts, locked, photoEdit, addMode, selBlk, tab, shadowOn]);

  /* แนวโคจรขึ้นกับวันที่และพิกัดเท่านั้น — เวลาในวันเปลี่ยนแล้วเส้นเดิมยังใช้ได้ */
  const sunPathKey = [st.sun.month, st.sun.day, st.sun.lat, st.sun.lng].join("|");

  /* ── อัปเดตทิศทางแดด/ความสว่าง (เบา ทำได้ทุกเฟรม) ── */
  React.useEffect(() => {
    const t = tRef.current; if (!t.sunLight) return;
    const sp = p3SunPos(st.sun);
    const altR = sp.alt * P3_DEG, azR = sp.az * P3_DEG;
    const R = 80;
    // เหนือ = -Z, ตะวันออก = +X
    t.sunLight.position.set(Math.sin(azR) * Math.cos(altR) * R, Math.max(0.02, Math.sin(altR)) * R, -Math.cos(azR) * Math.cos(altR) * R);
    t.sunLight.target.position.set(0, 0, 0);
    const day = sp.alt > 0;
    /* แสงแบน = ลดแดดเหลือแค่พอเห็นทรง แล้วดันแสงรอบทิศขึ้นแทน → ทุกผืนสว่างเท่ากัน
       ไม่มีด้านไหนจมมืดเพราะหันหนีดวงอาทิตย์ (ใช้ตอนตรวจผังแผง ไม่ใช่ตอนดูเงาจริง) */
    const flat = lightMode === "flat";
    t.sunLight.intensity = flat ? 0.3 : (day ? (0.55 + 0.85 * Math.min(1, Math.sin(altR) * 1.6)) : 0);
    t.amb.intensity = flat ? 1.55 : (day ? 0.75 : 0.28);
    if (t.scene) t.scene.background.set(flat ? 0xdce8f2 : (day ? (sp.alt < 12 ? 0xf3d9b8 : 0xdce8f2) : 0x1d2733));

  }, [st.sun, ready, lightMode]);

  /* ── เส้นแนวโคจรทั้งวัน + ขีดชั่วโมง ──
     เปลี่ยนตาม "วันที่กับพิกัด" เท่านั้น ไม่เปลี่ยนตามเวลาในวัน
     เดิมรวมอยู่กับตัวดวงอาทิตย์ ทำให้ตอนกวาดเวลาทั้งวันต้องสร้างเส้น 300 จุด
     กับป้ายชั่วโมง (วาดลง canvas แล้วอัปโหลดเป็นเท็กซ์เจอร์) ใหม่ทุกเฟรม — นั่นคือต้นเหตุที่กระตุก */
  React.useEffect(() => {
    const t = tRef.current; if (!t.sunGrp) return;
    const g = t.sunGrp;
    while (g.children.length) {
      const c = g.children[0]; g.remove(c);
      c.traverse && c.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
    }
    if (!showSun) return;
    const THREE = t.THREE; if (!THREE) return;
    const SR = Math.max(26, (+st.groundW || 40) * 0.95);   // รัศมี "โดมท้องฟ้า" สมมติที่วางดวงอาทิตย์
    const dirAt = (alt, az) => {
      const a = alt * P3_DEG, z = az * P3_DEG;
      return new THREE.Vector3(Math.sin(z) * Math.cos(a) * SR, Math.sin(a) * SR, -Math.cos(z) * Math.cos(a) * SR);
    };
    // เส้นทางเดินทั้งวัน — ช่วงเหนือขอบฟ้าเส้นทึบ ช่วงใต้ขอบฟ้าเส้นจาง (ให้เห็นเป็นวงรอบ)
    const up = [], down = [];
    for (let h = 0; h <= 24.0001; h += 0.08) {
      const s = p3SunPos(Object.assign({}, st.sun, { hour: h }));
      (s.alt >= 0 ? up : down).push(dirAt(s.alt, s.az));
    }
    if (down.length > 1) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(down),
      new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.3 })));
    if (up.length > 1) g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(up),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.95 })));
    // จุดขึ้น–ตก ที่ขอบฟ้า
    if (up.length > 1) {
      const endMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
      [up[0], up[up.length - 1]].forEach((p) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.016, 12, 10), endMat);
        m.position.copy(p); g.add(m);
      });
    }
    // ขีดบอกชั่วโมง + ป้ายเวลาบางจุด
    const mkLabel = (txt) => {
      const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64;
      const x = cv.getContext("2d");
      x.fillStyle = "#B45309"; x.font = "bold 42px system-ui"; x.textAlign = "center"; x.textBaseline = "middle";
      x.fillText(txt, 64, 34);
      // depthTest ปกติ — ป้ายที่อยู่หลังอาคารต้องถูกบัง ไม่งั้นลอยมาทับกลางฉากดูงง
      const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
      sp2.scale.set(SR * 0.105, SR * 0.052, 1); return sp2;
    };
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    for (let h = 5; h <= 19; h++) {
      const s = p3SunPos(Object.assign({}, st.sun, { hour: h }));
      if (s.alt < 0) continue;
      const p = dirAt(s.alt, s.az);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.009, 8, 6), tickMat);
      dot.position.copy(p); g.add(dot);
      if (h % 3 === 0) { const lb = mkLabel(h + ":00"); lb.position.copy(p).multiplyScalar(1.075); g.add(lb); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sunPathKey, st.groundW, ready, showSun]);

  /* ── ตัวดวงอาทิตย์ + แสงฟุ้ง + เส้นบอกทิศ — ขยับตามเวลา ──
     ของในกลุ่มนี้เบามาก (ทรงกลม 1 ลูก + สไปรต์ 1 ตัว + เส้น 1 เส้น) สร้างใหม่ทุกเฟรมได้สบาย
     เท็กซ์เจอร์แสงฟุ้งวาดครั้งเดียวแล้วใช้ซ้ำ — ของเดิมวาด canvas ใหม่ทุกครั้งที่เวลาเปลี่ยน */
  React.useEffect(() => {
    const t = tRef.current; if (!t.sunBall) return;
    const g = t.sunBall;
    while (g.children.length) {
      const c = g.children[0]; g.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material && c.material !== t.glowMat) c.material.dispose();
    }
    if (!showSun) return;
    const THREE = t.THREE; if (!THREE) return;
    const sp = p3SunPos(st.sun);
    if (sp.alt <= 0) return;                                // ตกดินแล้ว ไม่ต้องวาด
    const SR = Math.max(26, (+st.groundW || 40) * 0.95);
    const a = sp.alt * P3_DEG, z = sp.az * P3_DEG;
    const pos = new THREE.Vector3(Math.sin(z) * Math.cos(a) * SR, Math.sin(a) * SR, -Math.cos(z) * Math.cos(a) * SR);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(SR * 0.038, 20, 16),
      new THREE.MeshBasicMaterial({ color: sp.alt < 12 ? 0xff8c3a : 0xffd24a }));
    ball.position.copy(pos); g.add(ball);
    if (!t.glowMat) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 128;
      const cx = cv.getContext("2d");
      const grd = cx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,214,102,.85)"); grd.addColorStop(0.45, "rgba(255,190,80,.28)"); grd.addColorStop(1, "rgba(255,180,70,0)");
      cx.fillStyle = grd; cx.fillRect(0, 0, 128, 128);
      t.glowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false });
    }
    const glow = new THREE.Sprite(t.glowMat);
    glow.scale.set(SR * 0.26, SR * 0.26, 1); glow.position.copy(pos); g.add(glow);
    // เส้นบาง ๆ จากดวงอาทิตย์มาที่กลางผัง — ดูออกว่าแดดส่องมาจากทางไหน
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pos, new THREE.Vector3(0, 0, 0)]),
      new THREE.LineDashedMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45, dashSize: SR * 0.03, gapSize: SR * 0.025 })).computeLineDistances());
  }, [st.sun, st.groundW, ready, showSun]);

  /* ── animation กวาดทั้งวัน ──
     เดินตาม "เวลาจริงที่ผ่านไป" ไม่ใช่ตามจำนวนเฟรม — เดิมบวกทีละ 0.06 ชม./เฟรม
     จอ 60Hz กวาดทั้งวันจบใน ~3.5 วิ (เร็วจนดูไม่ทัน) ส่วนจอ 120Hz เร็วเป็นสองเท่าอีก
     ตอนนี้ 1x = ทั้งวันใน 15 วิ และเร็วเท่ากันทุกเครื่อง */
  const sweepH = React.useRef(null);
  React.useEffect(() => {
    if (!animating) { sweepH.current = null; return; }
    let run = true, last = performance.now();
    const rate = (18.5 - 6) / P3_SWEEP_SEC * sweepSpd;   // ชั่วโมงจำลอง ต่อ วินาทีจริง
    const startH = +st.sun.hour || 12;                   // เริ่มเดินต่อจากเวลาที่ค้างอยู่
    const step = (now) => {
      if (!run) return;
      const dt = Math.min(0.25, (now - last) / 1000);    // สลับแท็บไปนาน ๆ อย่ากระโดดทีเดียวหลายชั่วโมง
      last = now;
      /* สะสมเวลาไว้ในตัวแปรความละเอียดเต็ม แล้วค่อยปัดตอนเขียนลง state
         ถ้าอ่านค่าที่ปัดแล้วมาบวกต่อ จอที่รีเฟรชเร็ว (120–240Hz) จะได้ก้าวละไม่ถึง 0.005 ชม.
         ปัดแล้วได้ค่าเดิมทุกเฟรม เข็มเลยแทบไม่เดิน — ตอนตั้งความเร็ว "ช้า" เจอเต็ม ๆ */
      if (sweepH.current == null) sweepH.current = startH;
      sweepH.current += rate * dt;
      if (sweepH.current > 18.5) sweepH.current = 6;
      const hv = Math.round(sweepH.current * 100) / 100;
      setSt((p) => Object.assign({}, p, { sun: Object.assign({}, p.sun, { hour: hv }) }));
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    return () => { run = false; cancelAnimationFrame(raf); };
  }, [animating, sweepSpd]);

  /* ── โต้ตอบ: คลิกแผง = เว้น/ใส่คืน · ลากหลังคา/จุดทรง/สิ่งบดบัง = ย้าย · โหมดวาด = คลิกวางจุด ── */
  React.useEffect(() => {
    const t = tRef.current; if (!ready || !t.renderer) return;
    const THREE = t.THREE;
    const cv = t.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let down = null;

    const setRay = (ev) => {
      const rect = cv.getBoundingClientRect();
      ptr.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ptr, t.camera);
    };
    const pick = (ev) => {
      setRay(ev);
      const hitB = ray.intersectObjects(t.pickBlk || [], false)[0];   // จุดจับชุดแผงอยู่บนสุดเสมอ
      if (hitB) return { kind: "blk", obj: hitB.object };
      const hitV = ray.intersectObjects(t.pickVerts || [], false)[0];
      if (hitV) return { kind: "vertex", obj: hitV.object };
      const hitP = ray.intersectObjects(t.pickPanels || [], false)[0];
      if (hitP) return { kind: "panel", obj: hitP.object };
      const hitR = ray.intersectObjects(t.pickRoofs || [], false)[0];
      if (hitR) return { kind: "roof", obj: hitR.object };
      const hitO = ray.intersectObjects(t.pickObs || [], false)[0];
      if (hitO) return { kind: "obstacle", obj: hitO.object };
      return null;
    };
    // ฉายรังสีลงพื้น (y=0) ที่รูปโดรนวางอยู่ → วาด/ลากมุม/ลากผืน ตรงกับผังพื้นเสมอ
    const groundPoint = () => { const v = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, v) ? v : null; };
    // ดูดจุดเข้าหามุมหลังคาทรงอิสระผืนอื่น (รัศมี 0.7 ม.) — ให้ขอบผืนต่อกันสนิท
    const snapPt = (pt, skipRoofId, skipIdx) => {
      const stNow = stRef.current;
      let best = null, bd = 0.7;
      (stNow.roofs || []).forEach((r) => {
        if (r.kind !== "poly" || !Array.isArray(r.pts)) return;
        r.pts.forEach((p, i) => {
          if (r.id === skipRoofId && i === skipIdx) return;
          const wx = (+r.x || 0) + (+p.x || 0), wz = (+r.z || 0) + (+p.z || 0);
          const dd = Math.hypot(wx - pt.x, wz - pt.z);
          if (dd < bd) { bd = dd; best = { x: wx, z: wz }; }
        });
      });
      return best || { x: Math.round(pt.x * 20) / 20, z: Math.round(pt.z * 20) / 20 };
    };

    /* จุดที่เมาส์ชี้ บนระนาบผิวหลังคาของ frame นั้น → คืนพิกัดผิว (u,v) ที่ระบบบล็อกใช้ */
    /* M = เมทริกซ์โลกของ parent ที่ "จำไว้ตอนเริ่มลาก" — ระหว่างลาก ฉากถูกสร้างใหม่ทุกเฟรม
       ถ้าอ้าง object เดิมจะได้ค่าค้าง จึงคัดลอกเก็บไว้ตั้งแต่แรก (หลังคาไม่ขยับระหว่างลากชุดแผงอยู่แล้ว) */
    const blkPoint = (fr, M) => {
      if (!fr || !M) return null;
      const o = fr.o.clone().applyMatrix4(M);
      const n = fr.nn.clone().transformDirection(M).normalize();
      const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n, o);
      const hit = new THREE.Vector3();
      if (!ray.ray.intersectPlane(pl, hit)) return null;
      const loc = hit.applyMatrix4(new THREE.Matrix4().copy(M).invert()).sub(fr.o);
      return { u: loc.dot(fr.un), v: loc.dot(fr.vn) };
    };
    // ทิศจากจุดกึ่งกลางรูป วัดเป็นองศาตามเข็มจากทิศเหนือ (เหนือ = −Z)
    const bearing = (gp, cx, cz) => (Math.atan2(gp.x - cx, -(gp.z - cz)) * 180) / Math.PI;
    const norm180 = (d) => { let v = ((d + 180) % 360 + 360) % 360 - 180; return v; };

    const onDown = (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      /* ล็อกโมเดล = ล็อกเฉพาะ "ตัวบ้าน" (หลังคา/มุม/สิ่งบดบัง/รูปโดรน/วาดผืนใหม่)
         แต่ยัง "จัดแผงได้ตามปกติ" — แตะเว้นช่อง · ลาก/หมุน/ย่อขยายชุดแผง */
      if (lockedRef.current && (photoEditRef.current || drawingRef.current)) return;

      // ── โหมดปรับรูปโดรน: จับได้เฉพาะรูป/จุดจับ (พักแก้โมเดลกันลากผิด) ──
      if (photoEditRef.current) {
        setRay(ev);
        const stNow = stRef.current;
        const cx = +stNow.photoX || 0, cz = +stNow.photoZ || 0;
        const gp0 = groundPoint();
        const hitH = ray.intersectObjects(t.pickPhotoH || [], false)[0];
        if (hitH && gp0) {
          const mode = hitH.object.userData.photoHandle;
          down = { x: ev.clientX, y: ev.clientY, moved: false, photo: mode,
            startW: +stNow.photoW || 30,
            startDist: Math.hypot(gp0.x - cx, gp0.z - cz),
            startBear: bearing(gp0, cx, cz),
            startRot: +stNow.photoRot || 0 };
          t.controls.enabled = false;
          return;
        }
        const hitB = ray.intersectObjects(t.pickPhoto || [], false)[0];
        if (hitB && gp0) {
          down = { x: ev.clientX, y: ev.clientY, moved: false, photo: "move",
            startPos: { x: cx, z: cz }, grab: { x: gp0.x, z: gp0.z } };
          t.controls.enabled = false;
        }
        return;
      }

      // วาดผืน / วัดระยะ ใช้ท่าเดียวกัน: คลิก = วางจุด · ลาก = หมุน/เลื่อนมุมมองตามปกติ
      if (drawingRef.current || measuringRef.current) { down = { x: ev.clientX, y: ev.clientY, draw: true, moved: false }; return; }
      const hit = pick(ev);
      if (!hit) return;
      const stNow = stRef.current;
      const ud = hit.obj.userData;
      let rec = null, dragId = null;
      /* อยู่แท็บ "แผง" = ล็อกตัวบ้านไว้ กันเผลอลากหลังคา/มุม/สิ่งบดบังหลุดตอนกำลังจัดแผง
         (ยังแตะเลือกผืนได้ · จะย้ายบ้านจริง ๆ ให้กลับไปแท็บหลังคา) */
      const bodyLock = tabRef.current === "panel" || lockedRef.current;
      if (hit.kind === "vertex") {
        rec = (stNow.roofs || []).find((r) => r.id === ud.roofId);
        if (!rec) return;
        setRay(ev); const gp = bodyLock ? null : groundPoint();
        down = { x: ev.clientX, y: ev.clientY, hit, kind: "vertex", roofId: ud.roofId, idx: ud.idx, moved: false,
          startPt: { x: +rec.pts[ud.idx].x || 0, z: +rec.pts[ud.idx].z || 0 }, grab: gp ? { x: gp.x, z: gp.z } : null };
        if (!bodyLock) t.controls.enabled = false;
        return;
      }
      if (hit.kind === "blk") {
        const fr = (t.blkFrames || [])[ud.frIdx];
        if (!fr || !fr.parent) return;
        fr.parent.updateWorldMatrix(true, false);
        const M = fr.parent.matrixWorld.clone();
        const st0 = blkPoint(fr, M);
        const roofNow = (stNow.roofs || []).find((r) => r.id === ud.roofId);
        if (!st0 || !roofNow) return;
        const b0 = p3Blocks(roofNow)[ud.blk];
        down = { x: ev.clientX, y: ev.clientY, kind: "blk", mode: ud.mode, corner: ud.corner, hit, M,
          roofId: ud.roofId, blk: ud.blk, fr, rect: ud.rect, moved: false, grab: st0,
          b0: { du: b0.du, dv: b0.dv, rot: b0.rot },
          startAng: Math.atan2(st0.v - ud.rect.cv, st0.u - ud.rect.cu) };
        t.controls.enabled = false;
        return;
      }
      if (hit.kind === "panel" || hit.kind === "roof") dragId = ud.roofId || ud.id;
      else dragId = ud.id;
      rec = hit.kind === "obstacle" ? (stNow.obstacles || []).find((o) => o.id === dragId) : (stNow.roofs || []).find((r) => r.id === dragId);
      if (!rec) return;
      setRay(ev); const gp = bodyLock ? null : groundPoint();
      // อยู่ในกลุ่ม → ลากทีเดียวไปทั้งก้อน (จำตำแหน่งเริ่มของสมาชิกทุกผืน)
      const members = (hit.kind !== "obstacle" && rec.grp)
        ? (stNow.roofs || []).filter((r) => r.grp === rec.grp).map((r) => ({ id: r.id, x: +r.x || 0, z: +r.z || 0 }))
        : [{ id: rec.id, x: +rec.x || 0, z: +rec.z || 0 }];
      down = { x: ev.clientX, y: ev.clientY, hit, kind: hit.kind, dragId, moved: false, members,
        startPos: { x: +rec.x || 0, z: +rec.z || 0 }, grab: gp ? { x: gp.x, z: gp.z } : null };
      // ล็อกอยู่ = ไม่ปิด OrbitControls จะได้ลากหมุนมุมมองต่อได้เลย ไม่ใช่ลากแล้วค้าง
      if (!bodyLock) t.controls.enabled = false;
    };
    const onMove = (ev) => {
      if (!down) return;
      // ปุ่มเมาส์หลุดนอกหน้าต่างแล้วขยับกลับเข้ามา → เลิกลากค้าง (กันวัตถุขยับเองโดยไม่ได้กด)
      if (ev.buttons === 0) { down = null; if (t.controls && !drawingRef.current) t.controls.enabled = true; return; }
      if (Math.abs(ev.clientX - down.x) + Math.abs(ev.clientY - down.y) > 6) down.moved = true;

      // ── ลาก/หมุน/ย่อขยาย รูปโดรนบนภาพ ──
      if (down.photo) {
        if (!down.moved) return;
        setRay(ev);
        const gp = groundPoint(); if (!gp) return;
        const stNow = stRef.current;
        const cx = +stNow.photoX || 0, cz = +stNow.photoZ || 0;
        if (down.photo === "move") {
          set({ photoX: Math.round((down.startPos.x + gp.x - down.grab.x) * 20) / 20,
                photoZ: Math.round((down.startPos.z + gp.z - down.grab.z) * 20) / 20 });
        } else if (down.photo === "rot") {
          let deg = down.startRot + (bearing(gp, cx, cz) - down.startBear);
          if (ev.shiftKey) deg = Math.round(deg / 15) * 15;   // กด Shift = ล็อกทีละ 15°
          set({ photoRot: Math.round(norm180(deg) * 2) / 2 });
        } else if (down.photo === "scale") {
          const d = Math.hypot(gp.x - cx, gp.z - cz);
          if (down.startDist > 0.2) {
            const w = down.startW * (d / down.startDist);
            set({ photoW: Math.round(Math.max(2, Math.min(400, w)) * 10) / 10 });
          }
        }
        return;
      }

      // ── ลากชุดแผงบนภาพ: ย้าย / ย่อ-ขยาย / หมุน ──
      if (down.kind === "blk") {
        if (!down.moved) return;
        setRay(ev);
        const p = blkPoint(down.fr, down.M); if (!p) return;
        const stNow = stRef.current;
        const roofNow = (stNow.roofs || []).find((r) => r.id === down.roofId); if (!roofNow) return;
        const rc = down.rect, r2 = (v) => Math.round(v * 20) / 20;
        if (down.mode === "move") {
          patchBlk(roofNow, down.blk, { du: r2(down.b0.du + p.u - down.grab.u), dv: r2(down.b0.dv + p.v - down.grab.v) });
        } else if (down.mode === "rot") {
          let deg = down.b0.rot + (Math.atan2(p.v - rc.cv, p.u - rc.cu) - down.startAng) / P3_DEG;
          if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
          patchBlk(roofNow, down.blk, { rot: Math.max(-90, Math.min(90, Math.round(deg))) });
        } else if (down.mode === "size") {
          // มุมตรงข้ามอยู่กับที่: วัดระยะจากมุมนั้นในแกนของบล็อก แล้วปัดเป็นจำนวนแถว/คอลัมน์
          const rr = rc.rot * P3_DEG, cr = Math.cos(-rr), sr = Math.sin(-rr);
          const dx = p.u - rc.cu, dy = p.v - rc.cv;
          const a = dx * cr - dy * sr, b = dx * sr + dy * cr;
          const sx = down.corner === 1 || down.corner === 2 ? 1 : -1;      // มุมที่ลาก อยู่ฝั่งไหน
          const sy = down.corner === 2 || down.corner === 3 ? 1 : -1;
          const fixA = -sx * rc.w / 2, fixB = -sy * rc.h / 2;              // มุมตรงข้าม (คงที่)
          const cols = Math.max(1, Math.min(rc.maxCols, Math.round((Math.abs(a - fixA) + rc.gap) / (rc.pw + rc.gap))));
          const rows = Math.max(1, Math.min(rc.maxRows, Math.round((Math.abs(b - fixB) + rc.gap) / (rc.pd + rc.gap))));
          const c0 = p3BlkC0(rc, rows, cols);
          const nu = rc.cu + (fixA + sx * c0.w / 2) * Math.cos(rr) - (fixB + sy * c0.h / 2) * Math.sin(rr);
          const nv = rc.cv + (fixA + sx * c0.w / 2) * Math.sin(rr) + (fixB + sy * c0.h / 2) * Math.cos(rr);
          patchBlk(roofNow, down.blk, { rows, cols, du: r2(nu - c0.u), dv: r2(nv - c0.v), adds: {} });
        }
        return;
      }

      if (down.draw || !down.moved || !down.grab) return;
      setRay(ev);
      const gp = groundPoint(); if (!gp) return;
      if (down.kind === "vertex") {
        const stNow = stRef.current;
        const roof = (stNow.roofs || []).find((r) => r.id === down.roofId);
        if (roof) {
          // ตำแหน่ง world ใหม่ + ดูดเข้าหามุมผืนอื่น แล้วแปลงกลับเป็นพิกัดภายในผืน
          const wx = (+roof.x || 0) + down.startPt.x + gp.x - down.grab.x;
          const wz = (+roof.z || 0) + down.startPt.z + gp.z - down.grab.z;
          const sp = snapPt({ x: wx, z: wz }, down.roofId, down.idx);
          const nx = Math.round((sp.x - (+roof.x || 0)) * 20) / 20;
          const nz = Math.round((sp.z - (+roof.z || 0)) * 20) / 20;
          const pts = roof.pts.map((p, i) => i === down.idx ? { x: nx, z: nz } : p);
          patchRoof(down.roofId, { pts });
        }
        return;
      }
      const dx = gp.x - down.grab.x, dz = gp.z - down.grab.z;
      if (down.kind === "obstacle") {
        patchObs(down.dragId, { x: Math.round((down.startPos.x + dx) * 10) / 10, z: Math.round((down.startPos.z + dz) * 10) / 10 });
      } else {
        // ทุกผืนในกลุ่มขยับด้วยระยะเดียวกัน → รูปทรงรวมไม่เพี้ยน
        const ups = {};
        down.members.forEach((mb) => {
          ups[mb.id] = { x: Math.round((mb.x + dx) * 10) / 10, z: Math.round((mb.z + dz) * 10) / 10 };
        });
        patchRoofs(ups);
      }
    };
    const onUp = (ev) => {
      const t2 = tRef.current; if (t2.controls && !drawingRef.current) t2.controls.enabled = true;
      if (down && down.photo) { down = null; return; }
      if (down && down.draw) {
        // โหมดวาด: คลิก (ไม่ลาก) บนผืนภาพ = วางจุดมุมหลังคา
        if (!down.moved && ev.target === cv) {
          setRay(ev);
          const gp = groundPoint();
          if (gp) {
            const sp = snapPt(gp, null, null);
            if (measuringRef.current) setMeasPts((p) => p.concat([sp]));
            else setDrawPts((p) => p.concat([sp]));
          }
        }
        down = null; return;
      }
      if (down && !down.moved) {
        const ud = down.hit.obj.userData;
        if (down.kind === "panel") {
          const stNow = stRef.current;
          const roof = stNow.roofs.find((r) => r.id === ud.roofId);
          if (roof) toggleCell(roof, ud.key, !!ud.slot);
          setSelRoof(ud.roofId); setSelObs(null); setSelVert(null); setTab("panel");
        } else if (down.kind === "vertex") { setSelRoof(ud.roofId); setSelObs(null); setSelVert({ roofId: ud.roofId, idx: ud.idx }); setTab("roof"); }
        else if (down.kind === "roof") { setSelRoof(ud.id); setSelObs(null); setSelVert(null); setTab("roof"); }
        else if (down.kind === "obstacle") { setSelObs(ud.id); setSelRoof(null); setSelVert(null); setTab("obstacle"); }
      }
      down = null;
    };
    cv.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { cv.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [ready]); // eslint-disable-line

  /* ── มุมมอง ──
     2D = ล็อกกล้องมองจากบนตรง ๆ หมุนไม่ได้ (เลื่อน/ซูมได้) เอาไว้ทาบรูปโดรน/จัดผังแผงให้ตรงจริง
     3D = ปลดล็อกให้หมุนดูรอบด้านตามปกติ */
  const viewTop = () => {
    const t = tRef.current; if (!t.camera) return;
    t.camera.position.set(0, Math.max(30, st.groundW * 0.9), 0.01);
    t.controls.target.set(0, 0, 0);
    if (t.controls) {
      t.controls.enableRotate = false;
      // ปิดการหมุนแล้วลากซ้ายจะไม่เหลืออะไรทำ → ให้ลากซ้าย = เลื่อนผัง เหมือนใช้แผนที่
      const TH = t.THREE;
      if (TH) { t.controls.mouseButtons.LEFT = TH.MOUSE.PAN; t.controls.touches.ONE = TH.TOUCH.PAN; }
    }
    setView2D(true);
  };
  const view3d = () => {
    const t = tRef.current; if (!t.camera) return;
    t.camera.position.set(18, 16, 18);
    t.controls.target.set(0, 1, 0);
    if (t.controls) {
      t.controls.enableRotate = true;
      const TH = t.THREE;
      if (TH) { t.controls.mouseButtons.LEFT = TH.MOUSE.ROTATE; t.controls.touches.ONE = TH.TOUCH.ROTATE; }
    }
    setView2D(false);
  };

  /* ── วาดหลังคาทรงอิสระ ── */
  const startDraw = () => { setDrawing(true); setDrawPts([]); setSelObs(null); setTab("roof"); viewTop(); };
  const cancelDraw = () => { setDrawing(false); setDrawPts([]); };
  const finishDraw = () => {
    if (drawPts.length < 3) return;
    const cx = drawPts.reduce((s, p) => s + p.x, 0) / drawPts.length;
    const cz = drawPts.reduce((s, p) => s + p.z, 0) / drawPts.length;
    const nr = Object.assign(p3NewRoof(p3NextRoofNo(st.roofs)), {
      kind: "poly", x: Math.round(cx * 10) / 10, z: Math.round(cz * 10) / 10, h: 0.05,
      // เริ่มแบนราบระดับพื้น (ทุกมุมสูง 0.05) → คลิกต่อผืนถัดไปตรงเป๊ะ แล้วค่อยยกความสูงมุมสัน/หิปทีหลัง
      pts: drawPts.map((p) => ({ x: Math.round((p.x - cx) * 20) / 20, z: Math.round((p.z - cz) * 20) / 20 })),
      ph: drawPts.map(() => 0.05),
    });
    set({ roofs: (st.roofs || []).concat([nr]) });
    setSelRoof(nr.id); setSelVert(null); setDrawing(false); setDrawPts([]);
  };

  /* ── วัดระยะบนผัง ──
     ผังพื้นมาจากแผนที่ดาวเทียมที่รู้สเกลจริง (baseMap.widthM) ทุกอย่างในฉากจึงเป็นเมตรจริงอยู่แล้ว
     คลิกไล่จุดไปตามแนวที่จะเดินสาย/เดินราง แล้วได้ระยะที่เอาไปกรอก BOQ ได้ตรง ๆ ไม่ต้องออกไปวัดหน้างานซ้ำ */
  const startMeas = () => {
    setMeasuring(true); setMeasPts([]);
    setDrawing(false); setDrawPts([]); setPhotoEdit(false);
    setTab("measure"); viewTop();
  };
  const cancelMeas = () => { setMeasuring(false); setMeasPts([]); };
  const undoMeasPt = () => setMeasPts((p) => p.slice(0, -1));
  const finishMeas = () => {
    if (measPts.length < 2) return;
    const n = (st.measures || []).length + 1;
    const nm = {
      id: p3Id("m"), name: "ระยะ " + n, kind: "cable", rise: 0,
      pts: measPts.map((p) => ({ x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100 })),
    };
    set({ measures: (st.measures || []).concat([nm]) });
    setSelMeas(nm.id); setMeasuring(false); setMeasPts([]);
  };

  /* ── อัปโหลดรูปโดรน ── */
  const fileRef = React.useRef(null);
  const onPickPhoto = async (e) => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    try {
      const url = await window.resizeImageFile(f, 1600, 0.82);
      set({ photo: url });
    } catch (err) { alert("โหลดรูปไม่สำเร็จ: " + err.message); }
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── เลือกพื้นที่จากแผนที่ดาวเทียม → ตั้งเป็นผังพื้น + สเกลจริง + ตำแหน่งดวงอาทิตย์ ── */
  const jobLatLng = p3ParseLatLng(job && job.map);
  const jobAddr = job ? [job.address, job.province].filter(Boolean).join(" ") : "";
  const onPickMap = (res) => {
    set({ baseMap: { url: res.url, widthM: res.widthM, lat: res.lat, lng: res.lng, zoom: res.zoom }, groundW: Math.max(20, Math.ceil(res.widthM)) });
    setSun({ lat: res.lat, lng: res.lng });
    setMapOpen(false);
  };

  /* ── บันทึก / ส่งออก ── */
  const doSave = () => { save(JSON.parse(JSON.stringify(st))); setDirty(false); };
  const doPng = () => {
    const t = tRef.current; if (!t.renderer) return;
    try {
      const a = document.createElement("a");
      a.href = t.renderer.domElement.toDataURL("image/png");
      a.download = (job ? job.code : "plan3d") + "-3D.png";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert("ส่งออกภาพไม่สำเร็จ: " + e.message); }
  };
  /* ส่งออกเป็นไฟล์เขียนแบบ — เปิดต่อใน AutoCAD/DraftSight/LibreCAD ได้เลย
     ห้ามใส่ BOM เด็ดขาด: DXF ต้องขึ้นต้นด้วยกลุ่มโค้ด "0" พอดี ๆ มีอะไรนำหน้าแม้ตัวเดียว
     AutoCAD จะทิ้งทั้งไฟล์ทันทีโดยไม่บอกว่าเพราะอะไร */
  const [busyDxf, setBusyDxf] = React.useState("");
  /* กดแล้วเปิดตัวอย่างแผ่นผังให้ดูก่อน ค่อยตัดสินใจโหลด */
  const [setPrep, setSetPrep] = React.useState(null);
  const doSet = async () => {
    setBusyDxf("set");
    try { setSetPrep(await p3PrepSet(st, job, null)); }
    catch (e) { alert("เตรียมแบบผังไม่สำเร็จ: " + e.message); }
    setBusyDxf("");
  };
  const doSetDownload = async () => {
    setBusyDxf("setdl");
    try {
      const r = await p3ExportSet(st, job, null, setPrep);
      setSetPrep(null);
      if (r.files) alert("ดาวน์โหลดแบบผัง 1 แผ่น + ไฟล์ภาพ " + r.files + " ไฟล์" +
        "\n\nสำคัญ: เก็บไฟล์ .dxf กับไฟล์ภาพไว้ในโฟลเดอร์เดียวกัน\nไม่งั้นเปิดใน AutoCAD แล้วภาพจะไม่ขึ้น");
    } catch (e) { alert("ส่งออกแบบผังไม่สำเร็จ: " + e.message); }
    setBusyDxf("");
  };
  const tryClose = () => {
    if (!dirty) { onClose(); return; }
    askConfirm({ title: "ปิดโดยไม่บันทึก?", body: "มีการแก้ไขที่ยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายไป",
      ok: "ปิดโดยไม่บันทึก" }).then((ok) => { if (ok) onClose(); });
  };

  /* ── UI helpers ── (Num/NumRange อ้างถึงตัวนอกไฟล์ เพื่อไม่ให้ input ถูก remount ทุก render) */
  const inp = P3_INP;
  const Num = P3Num;
  const NumRange = P3NumRange;
  const Slider = P3Slider;
  /* แท็บ = segmented control ไอคอนบน–คำใต้ · ตัวที่เลือกเป็นแผ่นขาวยกขึ้นมาจากราง */
  const TabBtn = ({ k, label, icon }) => (
    <button onClick={() => setTab(k)} data-on={tab === k ? "1" : "0"} title={label}>
      <P3Icon name={icon} size={16} /><span>{label}</span>
    </button>
  );
  /* ปุ่มในแถบเครื่องมือลอยบนภาพ · on = กำลังใช้อยู่ (ทึบเข้มไว้ให้รู้สถานะปราดเดียว) */
  const IconBtn = ({ onClick, icon, label, on, title, tone }) => (
    <button className="p3-tool" onClick={onClick} title={title} data-on={on ? "1" : "0"} data-tone={tone || ""}>
      <P3Icon name={icon} />{label && <span>{label}</span>}
    </button>
  );
  /* ปุ่มในแผงข้าง — cls รับคลาสเสริม (pri/soft/dashed/dngr/w) */
  const SmallBtn = ({ onClick, children, color, bg, disabled, cls, icon, title }) => (
    <button className={"p3-b sm " + (cls || "")} onClick={onClick} disabled={disabled} title={title}
      style={color || bg ? { color: color, background: bg, borderColor: bg || undefined } : null}>
      {icon && <P3Icon name={icon} size={14} />}{children}
    </button>
  );

  const roof = (st.roofs || []).find((r) => r.id === selRoof) || null;
  const obs = (st.obstacles || []).find((o) => o.id === selObs) || null;

  /* ── กลุ่มหลังคา: ให้สี + ชื่อ A/B/C ต่อกลุ่ม แล้วเรียงชิปให้ผืนกลุ่มเดียวกันอยู่ติดกัน ── */
  const grpIdx = {}; let grpN = 0;
  (st.roofs || []).forEach((r) => { if (r.grp && grpIdx[r.grp] == null) grpIdx[r.grp] = grpN++; });
  const grpColor = (g) => P3_GRP_COLORS[(grpIdx[g] || 0) % P3_GRP_COLORS.length];
  const grpLabel = (g) => "กลุ่ม " + String.fromCharCode(65 + (grpIdx[g] || 0));
  const grpSize = (g) => (st.roofs || []).filter((r) => r.grp === g).length;
  /* ชิปเรียงตามลำดับเดิม แต่สมาชิกกลุ่มถูกดึงมาต่อท้ายผืนแรกของกลุ่ม → เห็นเป็นก้อนเดียว ไม่กระจัดกระจาย */
  const roofChips = (() => {
    const first = {};
    (st.roofs || []).forEach((r, i) => { if (r.grp && first[r.grp] == null) first[r.grp] = i; });
    const key = (r, i) => (r.grp && first[r.grp] != null ? first[r.grp] : i);
    return (st.roofs || []).map((r, i) => ({ r, i })).sort((a, b) => key(a.r, a.i) - key(b.r, b.i) || a.i - b.i).map((x) => x.r);
  })();
  /* เอาผืนที่เลือกออกจากกลุ่ม (ถ้าเหลือสมาชิกเดียวก็สลายกลุ่มไปเลย) */
  const leaveGrp = () => {
    if (!roof || !roof.grp) return;
    const gid = roof.grp, ups = {};
    ups[roof.id] = { grp: null };
    const left = (st.roofs || []).filter((x) => x.grp === gid && x.id !== roof.id);
    if (left.length < 2) left.forEach((x) => { ups[x.id] = { grp: null }; });
    patchRoofs(ups);
  };
  const isPolyRoof = roof && roof.kind === "poly" && Array.isArray(roof.pts);
  const isGable = roof && roof.kind === "gable";
  const isHip = roof && roof.kind === "hip";
  const isDome = roof && roof.kind === "dome";
  React.useEffect(() => { setSelBlk(0); }, [selRoof]);   // เปลี่ยนผืน = กลับไปชุดแรกเสมอ
  const domeInfo = isDome ? p3DomeGeo(roof) : null;
  const gableRise = isGable ? Math.round(((+roof.span || 8) / 2) * Math.tan((+roof.pitch || 0) * P3_DEG) * 100) / 100 : 0;
  const gridSel = roof ? p3Panels(roof) : null;
  const hipInfo = isHip && gridSel ? gridSel.hip : null;
  const total = p3CountAll(st);
  const kwp = Math.round(total * (+st.wp || 650) / 10) / 100;
  const sunNow = p3SunPos(st.sun);
  const fmtHour = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ":" + (mm < 10 ? "0" : "") + mm; };
  const polyAreaPlan = isPolyRoof ? Math.round(p3Area(roof.pts) * 10) / 10 : 0;
  const polyAreaSurf = isPolyRoof && gridSel && gridSel.plane ? Math.round(polyAreaPlan / gridSel.plane.tiltCos * 10) / 10 : 0;

  /* ── side panel content ── */
  const panelBody = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="p3-seg">
        <TabBtn k="roof" label="หลังคา" icon="roof" />
        <TabBtn k="panel" label="แผง" icon="grid" />
        <TabBtn k="photo" label="ผังพื้น" icon="map" />
        <TabBtn k="obstacle" label="สิ่งบดบัง" icon="tree" />
        <TabBtn k="measure" label="วัดระยะ" icon="ruler" />
        <TabBtn k="sun" label="แสงแดด" icon="sun" />
      </div>

      {tab === "photo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* ── ผังพื้นจากแผนที่ดาวเทียม (สเกลจริง + ทิศเหนืออัตโนมัติ) ── */}
          <div className="p3-card tint">
            <span className="p3-eb"><P3Icon name="map" size={13} />ผังพื้นจากแผนที่ดาวเทียม<span className="ln" />
              {st.baseMap && <span style={{ color: "var(--acd)", fontWeight: 800 }}>ตั้งแล้ว</span>}
            </span>
            <button className="p3-b pri w" onClick={() => setMapOpen(true)} style={{ padding: "10px" }}>
              {st.baseMap ? "เปลี่ยนพื้นที่ / เลือกใหม่" : "เลือกพื้นที่จากแผนที่"}
            </button>
            {st.baseMap ? (
              <React.Fragment>
                <div className="p3-stat">กว้างจริง <b>{Math.round(st.baseMap.widthM)} ม.</b><span style={{ opacity: .4 }}>·</span>
                  <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{(+st.baseMap.lat).toFixed(5)}, {(+st.baseMap.lng).toFixed(5)}</span></div>
                <SmallBtn cls="dngr" icon="trash" onClick={() => set({ baseMap: null })}>ลบผังแผนที่</SmallBtn>
              </React.Fragment>
            ) : (
              <div className="p3-note">ได้สเกลจริง (เมตร) + ทิศเหนืออัตโนมัติ · วาดหลังคาบนแผนที่ได้เลยแม้ไม่มีรูปโดรน{jobAddr ? " · จะเล็งไปที่อยู่ลูกค้าให้" : ""}</div>
            )}
          </div>
          <div className="p3-eb" style={{ marginTop: 2 }}><P3Icon name="image" size={13} />รูปโดรน<span className="ln" /><span style={{ fontWeight: 600 }}>เลเยอร์เสริม วางทับแผนที่</span></div>
          <button className="p3-b dashed w" onClick={() => fileRef.current && fileRef.current.click()} style={{ padding: "13px 10px" }}>
            <P3Icon name={st.photo ? "image" : "plus"} size={14} />{st.photo ? "เปลี่ยนรูปโดรน (มุมบน)" : "อัปโหลดรูปโดรน (มุมบน)"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
          {st.photo && (
            <React.Fragment>
              <img src={st.photo} alt="drone" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", display: "block" }} />
              <button className="p3-b w" onClick={() => { const n = !photoEdit; setPhotoEdit(n); if (n) { setLocked(false); setDrawing(false); viewTop(); } }}
                style={{ padding: "11px 10px", fontSize: 12.5, fontWeight: 700, background: photoEdit ? "#1D4ED8" : "#2563EB", borderColor: photoEdit ? "#1D4ED8" : "#2563EB", color: "#fff" }}>
                <P3Icon name={photoEdit ? "check" : "image"} size={14} />{photoEdit ? "กำลังปรับรูปบนภาพ (กดเพื่อจบ)" : "ปรับรูปบนภาพ (ลาก/หมุน/ย่อขยาย)"}
              </button>
              <div className="p3-card">
                <Num label="ความกว้างรูปเทียบของจริง (สเกล)" value={st.photoW} step={1} min={2} suffix="ม." onChange={(v) => set({ photoW: v })} />
                <Slider label="ความทึบรูป" right={Math.round((st.photoOpacity || 0.95) * 100) + "%"} min={0.15} max={1} step={0.05}
                  value={st.photoOpacity} onChange={(v) => set({ photoOpacity: v })} />
                <Slider label="ความสว่างรูป (ลดลงถ้ารูปสว่างจ้า)" right={Math.round((st.photoBright == null ? 0.7 : st.photoBright) * 100) + "%"} min={0.25} max={1} step={0.05}
                  value={st.photoBright == null ? 0.7 : st.photoBright} onChange={(v) => set({ photoBright: v })} />
              </div>
              <SmallBtn cls="dngr" icon="trash" onClick={() => set({ photo: null, photoRot: 0, photoX: 0, photoZ: 0 })}>ลบรูป</SmallBtn>
            </React.Fragment>
          )}
          <div className="p3-note">
            เคล็ดลับ: ใช้รูปโดรนถ่ายตรงจากด้านบน แล้วปรับ “สเกล” ให้ระยะบนรูปตรงกับของจริง จากนั้นไปแท็บ “หลังคา” → กด “วาดหลังคาทรงอิสระ” เพื่อคลิกลอกขอบหลังคาตามรูปได้เลย
          </div>
        </div>
      )}

      {tab === "roof" && drawing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* กำลังวาด = แผงข้างเหลือเรื่องเดียว ไม่มีอย่างอื่นมาแย่งความสนใจ */}
          <div className="p3-card tint">
            <span className="p3-eb"><P3Icon name="pencil" size={13} />กำลังวาดหลังคาทรงอิสระ<span className="ln" /></span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: "var(--acd)", letterSpacing: "-1px" }}>{drawPts.length}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>จุดที่วางแล้ว {drawPts.length < 3 ? "· ต้องอย่างน้อย 3 จุด" : ""}</span>
            </div>
            <div className="p3-note">คลิกบนภาพเพื่อวาง “มุมหลังคา” ทีละจุด ไล่ตามขอบหลังคาในรูป — ครบแล้วกดจบรูป ระบบจะแปลงเป็นหลังคา 3D แล้วค่อยตั้งองศาเอียง/ทิศ</div>
          </div>
          <button className="p3-b pri w" onClick={finishDraw} disabled={drawPts.length < 3} style={{ padding: "11px 8px", fontSize: 13 }}>
            <P3Icon name="check" size={15} />จบรูป ({drawPts.length} จุด)
          </button>
          <div style={{ display: "flex", gap: 7 }}>
            <SmallBtn cls="w" icon="reset" onClick={() => setDrawPts((p) => p.slice(0, -1))} disabled={!drawPts.length}>ถอยจุด</SmallBtn>
            <SmallBtn cls="dngr w" onClick={cancelDraw}>ยกเลิก</SmallBtn>
          </div>
        </div>
      )}

      {tab === "roof" && !drawing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* ยังไม่มีหลังคาสักผืน = ไม่ต้องโชว์แถวชิปเปล่า ๆ ให้เหลือแค่ปุ่มวาด */}
          <div style={{ display: (st.roofs || []).length ? "flex" : "none", gap: 6, flexWrap: "wrap" }}>
            {/* กลุ่มยุบเหลือชิปเดียว (กดกางเป็นรายผืน) — ผืนที่กำลังเลือกอยู่จะโผล่ข้าง ๆ เสมอแม้ยุบไว้ */}
            {(() => {
              const out = [], seen = {};
              const roofChip = (r) => (
                <button key={r.id} className="p3-chip" data-on={r.id === selRoof ? "1" : "0"}
                  onClick={() => { setSelRoof(r.id); setSelObs(null); }}
                  title={r.grp ? grpLabel(r.grp) + " · " + grpSize(r.grp) + " ผืน (ลากไปพร้อมกัน)" : ""}
                  style={r.id === selRoof || !r.grp ? null : { borderColor: grpColor(r.grp) + "55" }}>
                  {/* จุดสี = อยู่กลุ่มไหน (แทนไอคอนโซ่ทุกชิป ซึ่งอ่านยากเวลาผืนเยอะ) */}
                  {r.grp && <span className="dot" style={{ background: grpColor(r.grp) }} />}
                  <P3Icon name={r.kind === "dome" ? "dome" : r.kind === "gable" || r.kind === "hip" ? "roof" : "layers"} size={13} />
                  <span>{r.name}</span>
                </button>
              );
              const headChip = (g, open) => (
                <button key={"g" + g} className="p3-chip" onClick={() => setExpGrp(open ? null : g)}
                  title={open ? "ยุบกลุ่ม" : "กางเป็นรายผืน"}
                  style={{ borderColor: grpColor(g), background: grpColor(g) + "12", color: grpColor(g), fontWeight: 750 }}>
                  <span className="dot" style={{ background: grpColor(g) }} />
                  <span>{grpLabel(g)}{open ? "" : " · " + grpSize(g) + " ผืน"}</span>
                  <span style={{ display: "grid", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6.4 4 4 4-4" /></svg>
                  </span>
                </button>
              );
              roofChips.forEach((r) => {
                if (!r.grp) { out.push(roofChip(r)); return; }
                if (seen[r.grp]) return;
                seen[r.grp] = true;
                const g = r.grp, mems = roofChips.filter((x) => x.grp === g);
                if (expGrp === g) {
                  // กางแล้ว = กินเต็มบรรทัด ชื่อกลุ่มอยู่บรรทัดบนเดี่ยว ๆ รายผืนอยู่ใต้
                  out.push(
                    <div key={"gb" + g} style={{ flexBasis: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7,
                      border: "1px dashed " + grpColor(g) + "55", background: grpColor(g) + "0A", borderRadius: 12, padding: "8px 9px" }}>
                      {headChip(g, true)}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{mems.map(roofChip)}</div>
                    </div>
                  );
                } else {
                  out.push(headChip(g, false));
                  const sel = mems.find((x) => x.id === selRoof);
                  if (sel) out.push(roofChip(sel));
                }
              });
              return out;
            })()}
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button className="p3-b dashed" onClick={startDraw} title="คลิกไล่มุมหลังคาตามรูป แล้วกดจบรูป"
              style={{ flex: 1, padding: "11px 8px", borderColor: "#4F46E5", background: "#6366F10F", color: "#4F46E5", lineHeight: 1.35 }}>
              <P3Icon name="pencil" size={14} />วาดหลังคาทรงอิสระ
            </button>
            {/* โดมเป็นผิวโค้ง วาดด้วยมุมไม่ได้ → ต้องมีปุ่มสร้างของตัวเอง */}
            <button className="p3-b dashed" onClick={() => { const nr = p3NewDome(p3NextRoofNo(st.roofs)); set({ roofs: (st.roofs || []).concat([nr]) }); setSelRoof(nr.id); setSelObs(null); }}
              title="สร้างหลังคาโดม (ผิวโค้ง)"
              style={{ padding: "11px 13px", borderColor: "#0891B2", background: "#0891B20F", color: "#0E7490", whiteSpace: "nowrap" }}>
              <P3Icon name="dome" size={14} />โดม
            </button>
          </div>
          {roof && (
            <React.Fragment>
              <label className="p3-f">
                <span className="lb">ชื่อผืนหลังคา</span>
                <input className="p3-inp" value={roof.name} onChange={(e) => patchRoof(roof.id, { name: e.target.value })} style={{ fontWeight: 700 }} />
              </label>
              {/* ผืนทรงอิสระไม่มีช่องพวกนี้เลย — ไม่ต้องขึ้นการ์ดเปล่า */}
              {!isPolyRoof && <div className="p3-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {!isPolyRoof && !isGable && !isHip && !isDome && <Num label="กว้าง (แนวชายคา)" value={roof.w} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { w: v })} />}
                {!isPolyRoof && !isGable && !isHip && !isDome && <Num label="ยาวลาดหลังคา" value={roof.d} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { d: v })} />}
                {isDome && <Num label="ยาวโดม (แนวสัน)" value={roof.ridge} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { ridge: v })} />}
                {isDome && <Num label="กว้างโดม (คอร์ด)" value={roof.span} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { span: v })} />}
                {isGable && <Num label="ยาวสันหลังคา" value={roof.ridge} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { ridge: v })} />}
                {isGable && <Num label="กว้างรวม 2 ลาด" value={roof.span} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { span: v })} />}
                {isHip && <Num label="ยาวรวม (แนวสัน)" value={roof.w} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { w: v })} />}
                {isHip && <Num label="กว้างรวม" value={roof.d} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { d: v })} />}
                {!isPolyRoof && <Num label="ความสูงชายคา" value={roof.h} step={0.1} min={0.5} suffix="ม." onChange={(v) => patchRoof(roof.id, { h: v })} />}
                {isDome && <NumRange span label={"ความสูงโค้ง (จากชายคาถึงยอดโดม) · สูงสุด " + (Math.round((+roof.span || 10) / 2 * 10) / 10) + " ม."} value={roof.rise == null ? 2.5 : roof.rise} step={0.1} min={0.2} max={Math.max(0.5, Math.round((+roof.span || 10) / 2 * 10) / 10)} suffix="ม." onChange={(v) => patchRoof(roof.id, { rise: v })} />}
                {!isPolyRoof && !isDome && <NumRange span label={isGable || isHip ? "องศาความชัน" : "องศาเอียง"} value={roof.pitch} step={1} min={0} max={60} suffix="°" onChange={(v) => patchRoof(roof.id, { pitch: v })} />}
                {!isPolyRoof && <NumRange span label={isDome ? "ทิศที่แนวสันโดมวางขวาง (180 = ลาดหันใต้)" : isGable || isHip ? "ทิศด้าน A หันไป (180 = ใต้)" : "ทิศที่ลาดหันไป (180 = ใต้)"} value={roof.az} step={5} min={0} max={360} suffix="°" onChange={(v) => patchRoof(roof.id, { az: v })} />}
              </div>}
              {isHip && hipInfo && (
                <div className="p3-card amber">
                  <span className="p3-eb" style={{ color: "var(--tint-amber-tx)" }}><P3Icon name="roof" size={13} />หลังคาปั้นหยา<span className="ln" /></span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                    <span className="p3-stat">สันยาว <b>{Math.round(hipInfo.r * 100) / 100}</b> ม.</span>
                    <span className="p3-stat">สันสูงจากชายคา <b>{Math.round(hipInfo.rise * 100) / 100}</b> ม.</span>
                    <span className="p3-stat">ลาด <b>{Math.round(hipInfo.SL * 100) / 100}</b> ม.</span>
                  </div>
                  {(+roof.w || 0) < (+roof.d || 0) && <div style={{ color: "var(--tint-amber-tx)", fontWeight: 700, fontSize: 11 }}>“ยาวรวม” ควรเป็นด้านที่ยาวกว่า “กว้างรวม”</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[["sideA", "A คางหมู"], ["sideB", "B คางหมู"], ["sideC", "C สามเหลี่ยม"], ["sideD", "D สามเหลี่ยม"]].map(([k, lb]) => {
                      const on = roof[k] !== false;
                      return (
                        <button key={k} className="p3-chip" data-on={on ? "1" : "0"} onClick={() => patchRoof(roof.id, { [k]: !on })}
                          title={on ? "กดเพื่อไม่วางแผงด้านนี้" : "กดเพื่อวางแผงด้านนี้"}
                          style={{ borderRadius: 9, padding: "6px 8px", justifyContent: "space-between", background: on ? "var(--acs)" : "var(--surface)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <P3Icon name={on ? "check" : "plus"} size={12} w={2} />{lb}
                          </span>
                          <b style={{ fontWeight: 800 }}>{gridSel ? (gridSel["count" + k.slice(4)] || 0) : 0}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isDome && domeInfo && (
                <div className="p3-card cyan">
                  <span className="p3-eb" style={{ color: "#0E7490" }}><P3Icon name="dome" size={13} />หลังคาโดม<span className="ln" /></span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                    <span className="p3-stat">รัศมีโค้ง <b>{Math.round(domeInfo.rad * 100) / 100}</b> ม.</span>
                    <span className="p3-stat">ยาวส่วนโค้ง <b>{Math.round(domeInfo.arc * 100) / 100}</b> ม.</span>
                    <span className="p3-stat">ชันสุดที่ริม <b>{Math.round(domeInfo.th / P3_DEG)}</b>°</span>
                  </div>
                  {domeInfo.rise >= domeInfo.span / 2 - 1e-6 && <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700, fontSize: 11 }}>สูงสุดแล้ว (ครึ่งวงกลม) — จะสูงกว่านี้ต้องเพิ่มความกว้างโดม</span>}
                  {/* ริมโดมชันเกือบตั้ง แผงตรงนั้นแทบไม่ได้แดด — ตัดออกได้ด้วยสไลเดอร์นี้ */}
                  <NumRange span label="วางแผงเฉพาะช่วงที่ชันไม่เกิน (90° = เต็มโค้ง)" value={roof.maxTilt == null ? 90 : roof.maxTilt} step={5} min={5} max={90} suffix="°" onChange={(v) => patchRoof(roof.id, { maxTilt: v })} />
                  {gridSel && gridSel.rowTilts && gridSel.rowTilts.length > 0
                    ? <span className="p3-note">วางได้ <b style={{ color: "var(--text-1)" }}>{gridSel.rowTilts.length} แถว</b> · ความชันแต่ละแถว {gridSel.rowTilts.join("° / ")}°</span>
                    : <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700, fontSize: 11 }}>ไม่มีแถวไหนผ่านเงื่อนไขความชัน — เพิ่มองศาที่ยอมรับ หรือลดความสูงโค้ง</span>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {/* เดาแนวสันจาก "ด้านที่ยาวกว่า" ถ้าเดาผิดก็สลับได้ */}
                    <SmallBtn icon="reset" onClick={() => patchRoof(roof.id, { ridge: roof.span, span: roof.ridge, az: (((+roof.az || 180) + 90) % 360), skips: {}, blocks: clearCells(roof) })}>สลับแนวสัน 90°</SmallBtn>
                    {Array.isArray(roof.pts) && roof.pts.length >= 3 && (
                      <SmallBtn cls="dashed" onClick={() => patchRoof(roof.id, { kind: "poly", skips: {}, blocks: clearCells(roof) })}
                        title="กลับไปเป็นรูปที่วาดไว้เดิม (ขนาดโดมที่ปรับไว้จะหายไป)">กลับเป็นทรงอิสระ</SmallBtn>
                    )}
                  </div>
                </div>
              )}
              {isGable && (
                <div className="p3-card amber">
                  <span className="p3-eb" style={{ color: "var(--tint-amber-tx)" }}><P3Icon name="roof" size={13} />หลังคาจั่ว<span className="ln" /></span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
                    <span className="p3-stat">สันสูงจากชายคา <b>{gableRise}</b> ม.</span>
                    <span className="p3-stat">ลาดด้านละ <b>{gridSel && gridSel.slopeLen ? Math.round(gridSel.slopeLen * 100) / 100 : 0}</b> ม.</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["sideA", "ด้าน A", roof.az, gridSel ? gridSel.countA : 0], ["sideB", "ด้าน B", ((+roof.az || 180) + 180) % 360, gridSel ? gridSel.countB : 0]].map(([k, lb, az, n]) => {
                      const on = roof[k] !== false;
                      return (
                        <button key={k} className="p3-chip" data-on={on ? "1" : "0"} onClick={() => patchRoof(roof.id, { [k]: !on })}
                          title={on ? "กดเพื่อไม่วางแผงด้านนี้" : "กดเพื่อวางแผงด้านนี้"}
                          style={{ flex: 1, borderRadius: 10, padding: "7px 9px", flexDirection: "column", alignItems: "flex-start", gap: 2, background: on ? "var(--acs)" : "var(--surface)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5 }}>
                            <P3Icon name={on ? "check" : "plus"} size={12} w={2} />{lb} · ทิศ {az}°
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: 800 }}>{n} แผง</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isPolyRoof && (
                <React.Fragment>
                  {/* ── ความสูงของแต่ละมุม = ตัวกำหนดทรง (จั่ว/ปั้นหยา) · มุมที่ทับกันข้ามผืนยกพร้อมกัน = ต่อกันเสมอ ── */}
                  {(() => {
                    const rPh = p3PhOf(roof);
                    const selIdx = (selVert && selVert.roofId === roof.id) ? selVert.idx : -1;
                    return (
                      <div className="p3-card amber">
                        <span className="p3-eb" style={{ color: "var(--tint-amber-tx)" }}><P3Icon name="height" size={13} />ความสูงของมุม<span className="ln" /><span style={{ fontWeight: 600 }}>ยกสัน/หิปให้เป็นทรง</span></span>
                        {selIdx >= 0 ? (
                          <NumRange span label={"ความสูงมุมที่เลือก #" + (selIdx + 1)} value={Math.round((rPh[selIdx] || 0) * 100) / 100} min={0} max={12} step={0.1} suffix="ม." onChange={(v) => setVertHeight(roof.id, selIdx, v)} />
                        ) : (
                          <span className="p3-note">แตะ<b style={{ color: "var(--tint-green-tx)" }}>จุดเขียว</b>ที่มุมหลังคาในภาพ (จะกลายเป็น<b style={{ color: "#D97706" }}>จุดส้ม</b>) แล้วปรับความสูงตรงนี้</span>
                        )}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <SmallBtn icon="reset" onClick={() => patchRoof(roof.id, { ph: roof.pts.map(() => 0.05) })}>รีเซ็ตทุกมุมให้ราบ</SmallBtn>
                          {/* วาดกรอบบนรูปโดรนให้ตรงก่อน แล้วค่อยกดโค้งขึ้นเป็นโดม — ได้ขนาด/ทิศตรงของจริงโดยไม่ต้องกรอกเลข */}
                          <SmallBtn icon="dome" onClick={() => { const p = p3PolyToDomePatch(roof, st.buildH); if (p) patchRoof(roof.id, p); }}
                            title="ใช้กรอบสี่เหลี่ยมที่ครอบผืนนี้เป็นขนาด/ทิศของโดม (ด้านยาว = แนวสัน) — กดกลับเป็นทรงอิสระได้"
                            color="#0E7490" bg="#0891B214">ดัดให้เป็นโดม</SmallBtn>
                        </div>
                        <div style={{ borderTop: "1px dashed rgba(180,83,9,.28)", paddingTop: 9, marginTop: 1 }}>
                          <NumRange span label="ความสูงอาคาร (ยกหลังคาทุกผืนขึ้นจากพื้น + ผนัง)" value={Math.round((+st.buildH || 0) * 10) / 10} min={0} max={20} step={0.5} suffix="ม." onChange={(v) => set({ buildH: v })} />
                        </div>
                      </div>
                    );
                  })()}
                </React.Fragment>
              )}
              <button className="p3-b soft w" onClick={() => setTab("panel")} style={{ padding: "10px 12px", fontSize: 12.5, justifyContent: "flex-start" }}>
                <P3Icon name="grid" size={15} />วางแผงบนผืนนี้
                <b style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7 }}>
                  {gridSel ? gridSel.count : 0} แผง<P3Icon name="arrow" size={14} />
                </b>
              </button>
              {/* ── จัดกลุ่ม: แตะผืนอื่นเพื่อรวม/แยก · ลากทีเดียวไปทั้งก้อน ── */}
              {(st.roofs || []).length > 1 && (
                <div style={{ borderTop: "1px dashed var(--border-strong)", paddingTop: 10 }}>
                  {/* สรุปสั้น ๆ บรรทัดเดียว — รายชื่อผืนพับไว้ กดค่อยกาง */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {roof.grp ? (
                      <React.Fragment>
                        <span title="ลากผืนไหนก็ย้ายพร้อมกันทั้งกลุ่ม" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: grpColor(roof.grp) }}>
                          <span style={{ width: 8, height: 8, borderRadius: 99, background: grpColor(roof.grp) }} />
                          {grpLabel(roof.grp)} · {grpSize(roof.grp)} ผืน
                        </span>
                        <button className="p3-lnk" onClick={leaveGrp}>แยกผืนนี้ออก</button>
                      </React.Fragment>
                    ) : (
                      <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>ยังไม่ได้จัดกลุ่ม</span>
                    )}
                    <button className="p3-chip" data-on={grpOpen ? "1" : "0"} onClick={() => setGrpOpen(!grpOpen)}
                      style={{ marginLeft: "auto", padding: "4px 10px", fontSize: 11 }}>
                      <P3Icon name="link" size={12} />{roof.grp ? "แก้สมาชิก" : "จัดกลุ่ม"}
                      <span style={{ display: "grid", transform: grpOpen ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6.4 4 4 4-4" /></svg>
                      </span>
                    </button>
                  </div>
                  {grpOpen && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 7 }}>แตะชื่อผืนเพื่อรวม/แยก · ผืนในกลุ่มเดียวกันลากทีเดียวไปพร้อมกันทั้งก้อน</div>}
                  <div style={{ display: grpOpen ? "flex" : "none", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {(st.roofs || []).filter((r) => r.id !== roof.id).map((r) => {
                      const inGrp = !!roof.grp && r.grp === roof.grp;
                      return (
                        <button key={r.id} onClick={() => {
                          const gid = roof.grp || p3Id("g");
                          const ups = {};
                          if (inGrp) {
                            ups[r.id] = { grp: null };
                            // เหลือสมาชิกเดียว = ไม่เป็นกลุ่มแล้ว
                            const left = (st.roofs || []).filter((x) => x.grp === gid && x.id !== r.id);
                            if (left.length < 2) left.forEach((x) => { ups[x.id] = { grp: null }; });
                          } else {
                            ups[roof.id] = { grp: gid };
                            ups[r.id] = { grp: gid };
                          }
                          patchRoofs(ups);
                        }} className="p3-chip"
                          style={{ padding: "5px 10px", fontSize: 11.5,
                            borderColor: inGrp ? grpColor(roof.grp) : "var(--ln2)",
                            background: inGrp ? grpColor(roof.grp) + "16" : "var(--surface)", color: inGrp ? grpColor(roof.grp) : "var(--text-3)" }}>
                          {/* ผืนที่ติดกลุ่มอื่นอยู่แล้ว = โชว์จุดสีกลุ่มเดิม จะได้รู้ว่าดึงมาแล้วมันย้ายกลุ่ม */}
                          {r.grp && !inGrp && <span className="dot" style={{ width: 6, height: 6, background: grpColor(r.grp) }} />}
                          <P3Icon name={inGrp ? "check" : "plus"} size={12} w={2} /><span>{r.name}</span>
                        </button>
                      );
                    })}
                    {roof.grp && grpSize(roof.grp) > 1 && (
                      <button className="p3-chip" onClick={() => { const ups = {}; (st.roofs || []).filter((r) => r.grp === roof.grp).forEach((r) => { ups[r.id] = { grp: null }; }); patchRoofs(ups); }}
                        style={{ padding: "5px 10px", fontSize: 11.5, borderStyle: "dashed", background: "none", color: "var(--tint-red-tx)" }}>
                        แยกทั้งกลุ่ม
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* ยืนยันลบในหน้าเลย — ไม่ใช้ confirm() ของเบราว์เซอร์ เพราะ Chrome จะบล็อก dialog ที่เด้งซ้ำ ๆ
                  (ติ๊ก "ไม่ให้หน้านี้สร้างกล่องข้อความอีก") แล้ว confirm คืนค่า false ทันที = กดลบแล้วเงียบ ลบไม่ออก */}
              {(st.roofs || []).length > 1 && (
                delAsk === roof.id ? (
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", border: "1px solid rgba(185,28,28,.3)", background: "rgba(185,28,28,.05)", borderRadius: 11, padding: "9px 10px" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--tint-red-tx)", marginRight: "auto" }}>ลบ “{roof.name}” ?</span>
                    <SmallBtn cls="dngr solid" onClick={() => {
                      let rs = st.roofs.filter((r) => r.id !== roof.id);
                      /* ลบจนกลุ่มเหลือผืนเดียว = ไม่ใช่กลุ่มแล้ว สลายทิ้ง จะได้ไม่มีชิป "กลุ่ม A · 1 ผืน" ค้าง */
                      if (roof.grp && rs.filter((r) => r.grp === roof.grp).length < 2) rs = rs.map((r) => r.grp === roof.grp ? Object.assign({}, r, { grp: null }) : r);
                      set({ roofs: rs }); setSelRoof(rs[0] ? rs[0].id : null); setDelAsk(null);
                    }}>ลบเลย</SmallBtn>
                    <SmallBtn onClick={() => setDelAsk(null)}>ยกเลิก</SmallBtn>
                  </div>
                ) : (
                  <SmallBtn cls="dngr" icon="trash" onClick={() => setDelAsk(roof.id)}>ลบหลังคาผืนนี้</SmallBtn>
                )
              )}
              <div className="p3-note">ลากหลังคาในภาพเพื่อย้ายตำแหน่งให้ตรงกับรูปโดรน</div>
            </React.Fragment>
          )}
        </div>
      )}


      {tab === "panel" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!roof ? (
            /* ว่างเปล่า = บอกทางต่อ ไม่ใช่กล่องข้อความเฉย ๆ */
            <div className="p3-card" style={{ alignItems: "center", textAlign: "center", padding: "22px 16px", gap: 11 }}>
              <span style={{ width: 42, height: 42, borderRadius: 13, background: "var(--surface2)", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                <P3Icon name="grid" size={20} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>ยังไม่ได้เลือกหลังคา</span>
              <span className="p3-note" style={{ maxWidth: 230 }}>แตะหลังคาในภาพ หรือเลือกผืนจากแท็บหลังคา แล้วค่อยกลับมาวางแผง</span>
              <button className="p3-b soft" onClick={() => setTab("roof")}><P3Icon name="roof" size={14} />ไปแท็บหลังคา</button>
            </div>
          ) : (() => {
            const blks = p3Blocks(roof);
            const bi = Math.min(selBlk, blks.length - 1);
            const B = blks[bi];
            const per = (gridSel && gridSel.perBlk && gridSel.perBlk[bi]) || { maxRows: 0, maxCols: 0, count: 0 };
            const nSkip = Object.keys(B.skips || {}).length, nAdd = Object.keys(B.adds || {}).length;
            const pdB = p3BlkPD(B);
            /* จะได้กี่กลุ่มจริง ๆ — โชว์ไว้ข้างหัวข้อ จะได้รู้ทันทีว่าตั้งแล้วมีผลหรือยัง */
            const nCol = B.cols > 0 ? Math.min(B.cols, per.maxCols) : per.maxCols;
            const nRow = B.rows > 0 ? Math.min(B.rows, per.maxRows) : per.maxRows;
            const grpN = (B.gc > 0 ? Math.ceil(nCol / B.gc) : 1) * (B.gr > 0 ? Math.ceil(nRow / B.gr) : 1);
            return (
              <React.Fragment>
                {/* ผืนที่กำลังวาง — ตัวเลขใหญ่ขวามือ อ่านได้ทันทีว่าผืนนี้ได้กี่แผง */}
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>
                    <P3Icon name={roof.kind === "dome" ? "dome" : roof.kind === "gable" || roof.kind === "hip" ? "roof" : "layers"} size={14} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{roof.name}</span>
                  </span>
                  {/* ล็อกตัวบ้านตอนอยู่แท็บนี้ — บอกไว้ที่มุมล่างซ้ายของภาพแล้ว ไม่ต้องกินที่ในแผงอีก */}
                  <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "baseline", gap: 4, whiteSpace: "nowrap" }}>
                    <b style={{ fontSize: 17, fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "-.3px" }}>{gridSel ? gridSel.count : 0}</b>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>แผงในผืนนี้</span>
                  </span>
                </div>

                {/* ── ชุดแผง (บล็อก) — ผืนเดียววางได้หลายชุด ตั้งค่าแยกกัน ── */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {blks.map((b, i) => (
                    <button key={b.id} className="p3-chip" data-on={i === bi ? "1" : "0"} onClick={() => setSelBlk(i)}>
                      <P3Icon name="grid" size={12} />ชุด {i + 1}
                      {gridSel && gridSel.perBlk && gridSel.perBlk[i] ? <b style={{ fontWeight: 800 }}>{gridSel.perBlk[i].count}</b> : null}
                    </button>
                  ))}
                  <SmallBtn cls="dashed" icon="plus" onClick={() => { const bs = blkStore(roof); bs.push(p3NewBlk(bs.length)); patchRoof(roof.id, { blocks: bs }); setSelBlk(bs.length - 1); }}>เพิ่มชุด</SmallBtn>
                  {blks.length > 1 && (
                    <SmallBtn cls="dngr" icon="trash" onClick={() => { const bs = blkStore(roof); bs.splice(bi, 1); patchRoof(roof.id, { blocks: bs }); setSelBlk(Math.max(0, bi - 1)); }}>ลบชุดนี้</SmallBtn>
                  )}
                </div>

                {/* ── ค่าของชุดที่เลือก ── */}
                <div className="p3-card">
                  <span className="p3-eb">ชุด {bi + 1}<span className="ln" /></span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["portrait", "landscape"].map((o) => (
                      <button key={o} className="p3-chip" data-on={B.orient === o ? "1" : "0"}
                        onClick={() => patchBlk(roof, bi, { orient: o, skips: {}, adds: {} })}
                        style={{ flex: 1, justifyContent: "center", borderRadius: 9, padding: "7px 4px", fontSize: 12 }}>
                        {/* รูปแผงเล็ก ๆ ตั้ง/นอน — บอกได้เร็วกว่าคำ */}
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                          {o === "portrait" ? <rect x="5" y="2.2" width="6" height="11.6" rx="1" /> : <rect x="2.2" y="5" width="11.6" height="6" rx="1" />}
                        </svg>
                        {o === "portrait" ? "แนวตั้ง" : "แนวนอน"}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                    {/* จำกัดแถว/คอลัมน์ = กริดถูกจัดกึ่งกลางใหม่ ตำแหน่งที่เติมเองจะเพี้ยน → ล้างที่เติมเองด้วย */}
                    <Num label={"แถว (สูงสุด " + per.maxRows + ") 0=เต็ม"} value={B.rows} step={1} min={0} onChange={(v) => patchBlk(roof, bi, { rows: v, adds: {} })} />
                    <Num label={"คอลัมน์ (สูงสุด " + per.maxCols + ") 0=เต็ม"} value={B.cols} step={1} min={0} onChange={(v) => patchBlk(roof, bi, { cols: v, adds: {} })} />
                    <Num label="ระยะห่างแผง" value={B.gap} step={0.01} min={0} suffix="ม." onChange={(v) => patchBlk(roof, bi, { gap: v })} />
                    <Num label="ระยะขอบกันตก (ทั้งผืน)" value={roof.margin} step={0.05} min={0} suffix="ม." onChange={(v) => patchRoof(roof.id, { margin: v })} />
                  </div>
                  {/* เลื่อน/หมุนชุดแผงได้อิสระ ไม่ต้องอยู่กึ่งกลางผืนเสมอ */}
                  <NumRange span label={isDome ? "เลื่อนตามแนวสันโดม (+ ไปทางขวา)" : "เลื่อนซ้าย–ขวา (+ ขวา)"} value={Math.round(B.du * 100) / 100} step={0.1} min={-25} max={25} suffix="ม." onChange={(v) => patchBlk(roof, bi, { du: v })} />
                  <NumRange span label={isDome ? "เลื่อนไปตามส่วนโค้ง" : "เลื่อนขึ้น–ลงตามลาด (+ ขึ้นไปทางสัน)"} value={Math.round(B.dv * 100) / 100} step={0.1} min={-25} max={25} suffix="ม." onChange={(v) => patchBlk(roof, bi, { dv: v })} />
                  {!isDome && <NumRange span label="หมุนชุดแผง (เทียบผืนหลังคา)" value={B.rot} step={1} min={-90} max={90} suffix="°" onChange={(v) => patchBlk(roof, bi, { rot: v })} />}
                  {!isDome && (
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                      {/* หมุนทีละชุดแล้วองศาไม่เท่ากัน มองจากด้านบนจะเห็นว่าไม่เป็นแนวเดียวกัน */}
                      {blks.length > 1 && (
                        <button className="p3-lnk" onClick={() => patchAllBlk(roof, { rot: B.rot })}>ใช้มุมนี้กับทุกชุด</button>
                      )}
                      <button className="p3-lnk" onClick={() => patchBlk(roof, bi, { rot: 0 })}>ตั้งตรงกับผืน (0°)</button>
                    </div>
                  )}
                  {/* เลือกได้ทั้งสองแบบ — ของเดิม (ตัดตามขอบ) ยังอยู่ครบ ไม่ได้ถูกแทนที่ */}
                  {!isDome && (
                    <React.Fragment>
                      <span className="p3-eb" style={{ marginTop: 2 }}><P3Icon name="grid" size={12} />รูปทรงของชุดแผง<span className="ln" /></span>
                      <div style={{ display: "flex", gap: 7 }}>
                        {[{ k: false, th: "ตัดตามขอบหลังคา", d: "วางเต็มเท่าที่ผืนรับได้" },
                          { k: true, th: "สี่เหลี่ยมตรง", d: "ทุกแถวยาวเท่ากัน" }].map((o) => (
                          <button key={String(o.k)} className="p3-chip" data-on={!!B.keep === o.k ? "1" : "0"}
                            onClick={() => patchBlk(roof, bi, { keep: o.k })}
                            style={{ flex: 1, flexDirection: "column", alignItems: "flex-start", gap: 1, borderRadius: 9, padding: "7px 9px", fontSize: 12, textAlign: "left" }}>
                            <span style={{ fontWeight: 700 }}>{o.th}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.72 }}>{o.d}</span>
                          </button>
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                  {!isDome && B.rot !== 0 && !B.keep && (
                    <span className="p3-note">แบบตัดตามขอบ: หมุนแล้วมุมกริดยื่นพ้นขอบหลังคา ช่องที่ล้นจะถูกตัดออกทีละช่อง แต่ละแถวเลยยาวไม่เท่ากันเป็นขั้นบันได — ถ้าอยากได้แถวตรงเท่ากันหมด เลือก “สี่เหลี่ยมตรง”</span>
                  )}
                  {!isDome && B.keep && (
                    <span className="p3-note">แบบสี่เหลี่ยมตรง: ระบบเลือกสี่เหลี่ยมผืนใหญ่ที่สุดที่ยังอยู่ในหลังคาครบทุกแผง หมุนกี่องศาก็ได้แถวตรงเสมอ · ถ้าได้เท่ากันหลายที่จะเลือกอันที่ใกล้ตำแหน่งที่เลื่อนชุดไว้ที่สุด · ใส่แถว/คอลัมน์เองได้ถ้าอยากให้เล็กกว่านั้น</span>
                  )}

                  {/* ── แบ่งเป็นกลุ่ม + เว้นทางเดิน ── */}
                  <span className="p3-eb" style={{ marginTop: 2 }}><P3Icon name="grid" size={12} />แบ่งกลุ่ม &amp; ทางเดิน<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{grpN > 1 ? grpN + " กลุ่ม" : "ยังไม่แบ่ง"}</span></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                    <Num label="คอลัมน์/กลุ่ม 0=ไม่แบ่ง" value={B.gc} step={1} min={0} onChange={(v) => patchBlk(roof, bi, { gc: v, adds: {} })} />
                    <Num label="แถว/กลุ่ม 0=ไม่แบ่ง" value={B.gr} step={1} min={0} onChange={(v) => patchBlk(roof, bi, { gr: v, adds: {} })} />
                    <Num label="ทางเดินระหว่างกลุ่ม" value={B.gg} step={0.05} min={0} suffix="ม." onChange={(v) => patchBlk(roof, bi, { gg: v, adds: {} })} />
                  </div>
                  <span className="p3-note">แบ่งชุดเดียวออกเป็นกลุ่มย่อยพร้อมเว้นทางเดินให้เอง — ดีกว่าสร้างหลายชุดแล้วมาไล่จัดตำแหน่งเอง เพราะทุกกลุ่มอยู่ในแนวเดียวกันเสมอ หมุนทีเดียวหมุนตามกันทั้งชุด{B.gg <= 0 && (B.gc > 0 || B.gr > 0) ? " · ตอนนี้ทางเดินเป็น 0 ม. ต้องใส่ระยะด้วยถึงจะเห็นช่อง" : ""}</span>
                  {!isDome && <NumRange span label="ขาตั้งเอียง (ยกแผงจากผิวหลังคา)" value={B.tilt} step={1} min={0} max={45} suffix="°" onChange={(v) => patchBlk(roof, bi, { tilt: v })} />}
                  {isDome && <span className="p3-note">โดมเป็นผิวโค้ง — แผงต้องแนบโค้ง จึงหมุนชุดหรือใส่ขาตั้งเอียงไม่ได้</span>}
                  {!isDome && B.tilt > 0 && (() => {
                    // แถวหน้าบังแถวหลัง: ระยะแนะนำคิดที่ดวงอาทิตย์สูง 30° (เช้า–บ่ายฤดูหนาว) เผื่อไม่ให้เงาทับ
                    const need = Math.round((pdB * Math.cos(B.tilt * P3_DEG) + pdB * Math.sin(B.tilt * P3_DEG) / Math.tan(30 * P3_DEG)) * 100) / 100;
                    const now = Math.round((pdB + B.gap) * 100) / 100;
                    return (
                      <div style={{ fontSize: 11, lineHeight: 1.6, borderRadius: 10, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                        color: now + 1e-9 >= need ? "var(--text-3)" : "var(--tint-amber-tx)",
                        background: now + 1e-9 >= need ? "var(--surface2)" : "rgba(245,158,11,.12)",
                        border: "1px solid " + (now + 1e-9 >= need ? "transparent" : "rgba(180,83,9,.25)") }}>
                        <span>เอียง {B.tilt}° · ระยะแถวตอนนี้ <b>{now} ม.</b> · กันเงาแถวหน้าควร ≥ <b>{need} ม.</b></span>
                        {now + 1e-9 < need && (
                          <button className="p3-lnk" style={{ marginLeft: "auto", color: "var(--tint-amber-tx)", borderColor: "rgba(180,83,9,.4)" }}
                            onClick={() => patchBlk(roof, bi, { gap: Math.round((need - pdB) * 100) / 100 })}>ตั้งให้พอดี</button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* ── แตะเพิ่ม/เว้นแผงเอง ── */}
                <div className={"p3-card" + (addMode ? " tint" : "")} style={addMode ? { borderColor: "var(--ac)" } : null}>
                  <button className={"p3-b w " + (addMode ? "pri" : "")} onClick={() => setAddMode(!addMode)} style={{ padding: "9px 10px", fontSize: 12.5, fontWeight: 700 }}>
                    <P3Icon name={addMode ? "check" : "plus"} size={14} />
                    {addMode ? "กำลังเพิ่มแผงเอง — แตะช่องเขียวในภาพ" : "แตะเพิ่มแผงเอง"}
                  </button>
                  <span className="p3-note">
                    แตะแผงที่มีอยู่ = เว้นตำแหน่ง (แผงจาง แตะซ้ำใส่คืน) · เปิดโหมดนี้แล้วช่องที่ยังวางได้จะขึ้นเป็นกรอบเขียวจาง ๆ แตะเพื่อเติมแผงนอกกรอบแถว/คอลัมน์ได้
                  </span>
                  {(nSkip > 0 || nAdd > 0) && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {nSkip > 0 && <SmallBtn icon="reset" onClick={() => patchBlk(roof, bi, { skips: {} })}>ใส่คืนที่เว้นไว้ {nSkip} ช่อง</SmallBtn>}
                      {nAdd > 0 && <SmallBtn icon="reset" onClick={() => patchBlk(roof, bi, { adds: {} })}>เอาที่เพิ่มเองออก {nAdd} แผง</SmallBtn>}
                    </div>
                  )}
                </div>

                {/* สรุปปิดท้าย — เทียบชุดนี้กับทั้งผัง */}
                <div style={{ display: "flex", alignItems: "stretch", gap: 1, background: "var(--ln)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--ln)" }}>
                  {[["ชุดนี้", per.count + " แผง"], ["ทั้งผัง", total + " แผง"], ["กำลังรวม", kwp + " kWp"]].map(([k, v]) => (
                    <div key={k} style={{ flex: 1, background: "var(--surface)", padding: "9px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-3)" }}>{k}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            );
          })()}
        </div>
      )}
      {tab === "obstacle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 7 }}>
            <button className="p3-b dashed w" style={{ padding: "12px 8px", flexDirection: "column", gap: 5 }}
              onClick={() => { const o = { id: p3Id("o"), kind: "box", x: 6, z: 6, w: 2, d: 2, h: 3 }; set({ obstacles: (st.obstacles || []).concat([o]) }); setSelObs(o.id); setSelRoof(null); }}>
              <P3Icon name="box" size={18} />กล่อง / ตึก
            </button>
            <button className="p3-b dashed w" style={{ padding: "12px 8px", flexDirection: "column", gap: 5 }}
              onClick={() => { const o = { id: p3Id("o"), kind: "tree", x: -6, z: 6, w: 3, d: 3, h: 5 }; set({ obstacles: (st.obstacles || []).concat([o]) }); setSelObs(o.id); setSelRoof(null); }}>
              <P3Icon name="tree" size={18} />ต้นไม้
            </button>
          </div>
          {(st.obstacles || []).length === 0 && (
            <div className="p3-note" style={{ textAlign: "center", padding: "14px 10px", background: "var(--surface2)", borderRadius: 12 }}>
              เพิ่มตึกข้างเคียง / ถังน้ำ / ต้นไม้ เพื่อดูเงาบดบังแผง
            </div>
          )}
          {obs && (
            <React.Fragment>
              <div className="p3-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                <Num label="กว้าง" value={obs.w} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { w: v })} />
                <Num label="ลึก" value={obs.d} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { d: v })} />
                <Num label="สูง" value={obs.h} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { h: v })} />
              </div>
              {/* ต้นไม้เป็นทรงกลม หมุนแล้วไม่ต่างอะไร — โชว์เฉพาะทรงกล่อง (ตึก/ถังน้ำ/กันสาด) */}
              {obs.kind !== "tree" && (
                <div className="p3-card">
                  <NumRange span label="หมุน (มองจากด้านบน · + ตามเข็ม)" value={+obs.rot || 0} step={1} min={-180} max={180} suffix="°"
                    onChange={(v) => patchObs(obs.id, { rot: v })} />
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {[0, 45, 90, 135].map((a) => (
                      <button key={a} className="p3-lnk" onClick={() => patchObs(obs.id, { rot: a })}>{a}°</button>
                    ))}
                    <button className="p3-lnk" onClick={() => patchObs(obs.id, { rot: Math.round((((+obs.rot || 0) + 90 + 180) % 360 + 360) % 360 - 180) })}>หมุน +90°</button>
                  </div>
                  <span className="p3-note">ตึกข้างเคียงส่วนใหญ่ไม่ได้วางตรงแกนเหนือ–ใต้ หมุนให้ตรงกับรูปโดรนแล้วเงาที่คำนวณจะตรงกับของจริง</span>
                </div>
              )}
              <SmallBtn cls="dngr" icon="trash" onClick={() => { set({ obstacles: st.obstacles.filter((o) => o.id !== obs.id) }); setSelObs(null); }}>ลบชิ้นนี้</SmallBtn>
            </React.Fragment>
          )}
          <div className="p3-note">แตะเพื่อเลือก · ลากเพื่อย้ายตำแหน่ง</div>
        </div>
      )}

      {tab === "measure" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {!st.baseMap && (
            <div className="p3-card amber">
              <span className="p3-eb"><P3Icon name="map" size={13} />ยังไม่ได้ตั้งผังพื้นจากแผนที่<span className="ln" /></span>
              <span className="p3-note">
                ระยะที่วัดได้จะเป็นสเกลของผังที่ตั้งเอง ไม่ใช่ระยะจริงจากพื้นที่ — ไปแท็บ <b>ผังพื้น</b> เลือกพื้นที่จากแผนที่ดาวเทียมก่อน แล้ววัดจะได้เมตรจริง
              </span>
            </div>
          )}
          <button className={"p3-b w " + (measuring ? "dngr" : "pri")} style={{ padding: "11px 8px" }}
            onClick={() => { if (measuring) cancelMeas(); else startMeas(); }}>
            <P3Icon name={measuring ? "reset" : "ruler"} size={16} />{measuring ? "หยุดวัด" : "วัดระยะใหม่"}
          </button>
          {measuring && (
            <div className="p3-note" style={{ padding: "9px 11px", background: "var(--surface2)", borderRadius: 11 }}>
              คลิกบนผังไล่จุดไปตามแนวที่จะเดินจริง (หักมุมได้หลายจุด) แล้วกด <b>เก็บระยะ</b> บนแถบกลางภาพ
            </div>
          )}

          {(st.measures || []).length === 0 && !measuring && (
            <div className="p3-note" style={{ textAlign: "center", padding: "14px 10px", background: "var(--surface2)", borderRadius: 12 }}>
              วัดระยะเดินสาย · ระยะเดินราง · ความยาวบันไดลิง/ทางเดิน จากผังจริง<br />แล้วดึงเข้าช่องความยาวใน <b>ถอดวัสดุ BOQ</b> ได้เลย
            </div>
          )}

          {/* เปิด/ปิดทีเดียวทั้งชุด — วัดไว้หลายเส้นแล้วอยากเคลียร์ภาพชั่วคราว ไม่ต้องไล่กดทีละอัน */}
          {(st.measures || []).length > 1 && (
            <div style={{ display: "flex", gap: 7 }}>
              <SmallBtn cls="w" icon="eye" onClick={() => set({ measures: (st.measures || []).map((m) => Object.assign({}, m, { off: false })) })}>เปิดทุกเส้น</SmallBtn>
              <SmallBtn cls="w" icon="eyeOff" onClick={() => set({ measures: (st.measures || []).map((m) => Object.assign({}, m, { off: true })) })}>ปิดทุกเส้น</SmallBtn>
            </div>
          )}

          {(st.measures || []).map((m) => {
            const km = p3MeasKind(m.kind);
            const hex = "#" + km.c.toString(16).padStart(6, "0");
            const on = selMeas === m.id;
            const off = !!m.off;
            return (
              <div key={m.id} className="p3-card" style={Object.assign({},
                on && !off ? { borderColor: hex, boxShadow: "0 0 0 2px " + hex + "22" } : null,
                off ? { background: "var(--surface2)" } : null)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* จุดสีหมวด = ปุ่มเปิด/ปิดในตัว · ปิดอยู่ = จุดกลวง ดูปราดเดียวรู้ว่าเส้นนี้ไม่ได้โชว์ */}
                  <button title={off ? "เปิดแสดงเส้นนี้บนภาพ" : "ซ่อนเส้นนี้จากภาพ"} onClick={() => patchMeas(m.id, { off: !off })}
                    style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: "2px 0", color: off ? "var(--text-3)" : hex }}>
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: off ? "transparent" : hex, border: "1.6px solid " + (off ? "var(--text-3)" : hex), boxSizing: "border-box" }} />
                    <P3Icon name={off ? "eyeOff" : "eye"} size={14} />
                  </button>
                  <input className="p3-inp" style={{ fontWeight: 700, opacity: off ? 0.6 : 1 }} value={m.name || ""} placeholder="ชื่อระยะ"
                    onFocus={() => setSelMeas(m.id)} onChange={(e) => patchMeas(m.id, { name: e.target.value })} />
                  <button className="p3-b sm dngr" title="ลบเส้นวัดนี้" onClick={() => delMeas(m.id)} style={{ flex: "0 0 auto", padding: "6px 8px" }}>
                    <P3Icon name="trash" size={13} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {P3_MEAS_KINDS.map((k) => (
                    <button key={k.k} className="p3-chip" data-on={m.kind === k.k ? "1" : "0"}
                      style={m.kind === k.k ? { borderColor: "#" + k.c.toString(16).padStart(6, "0"), color: "#" + k.c.toString(16).padStart(6, "0"), background: "#" + k.c.toString(16).padStart(6, "0") + "14" } : null}
                      onClick={() => { patchMeas(m.id, { kind: k.k }); setSelMeas(m.id); }}>{k.th}</button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, alignItems: "end" }}>
                  <Num label="ขึ้น–ลง เพิ่ม (ไต่ผนัง/ขึ้นหลังคา)" value={+m.rise || 0} step={0.5} min={0} suffix="ม."
                    onChange={(v) => { patchMeas(m.id, { rise: v }); setSelMeas(m.id); }} />
                  <div className="p3-stat" style={{ justifyContent: "flex-end", paddingBottom: 8 }}>
                    รวม <b style={{ color: hex, fontSize: 16 }}>{p3MeasLen(m).toFixed(2)}</b> ม.
                  </div>
                </div>
                <span className="p3-note">
                  {(m.pts || []).length} จุด · ระยะราบ {p3MeasLen({ pts: m.pts }).toFixed(2)} ม.
                  {off ? " · ซ่อนอยู่"
                    : <React.Fragment>{" · "}<button className="p3-lnk" onClick={() => setSelMeas(on ? null : m.id)}>{on ? "เลิกเน้น" : "เน้นบนภาพ"}</button></React.Fragment>}
                </span>
              </div>
            );
          })}

          {(st.measures || []).length > 0 && (
            <div className="p3-card tint">
              <span className="p3-eb"><P3Icon name="ruler" size={13} />รวมตามหมวด<span className="ln" /></span>
              {P3_MEAS_KINDS.map((k) => {
                const list = (st.measures || []).filter((m) => (m.kind || "other") === k.k);
                if (!list.length) return null;
                const sum = list.reduce((s, m) => s + p3MeasLen(m), 0);
                return (
                  <div key={k.k} className="p3-stat" style={{ justifyContent: "space-between" }}>
                    <span>{k.th} <span style={{ color: "var(--text-3)" }}>({list.length})</span></span>
                    <b>{(Math.round(sum * 100) / 100).toFixed(2)} ม.</b>
                  </div>
                );
              })}
              <span className="p3-note">กด <b>บันทึก</b> แล้วเปิด “ถอดวัสดุ BOQ” จะมีปุ่มดึงระยะเหล่านี้เข้าช่องความยาวให้ · เส้นที่ปิดไว้แค่ไม่โชว์บนภาพ ยังนับรวมและดึงเข้า BOQ ได้ตามปกติ</span>
            </div>
          )}
        </div>
      )}

      {tab === "sun" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* ตำแหน่งดวงอาทิตย์ตอนนี้ — หน้าปัดเล็ก ๆ แทนบรรทัดตัวเลข */}
          <div className="p3-card" style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
            <span style={{ position: "relative", width: 54, height: 54, flex: "0 0 auto" }}>
              <svg width="54" height="54" viewBox="0 0 54 54" style={{ display: "block" }}>
                <circle cx="27" cy="27" r="23" fill="none" stroke="var(--ln)" strokeWidth="2" />
                <path d="M4 27a23 23 0 0 1 46 0" fill="none" stroke="rgba(245,158,11,.35)" strokeWidth="2" strokeDasharray="2 3.4" />
                <line x1="7" y1="27" x2="47" y2="27" stroke="var(--ln)" strokeWidth="1" />
                {/* วางลูกกลมตามมุมเงยจริง: 0° = ขอบฟ้า, 90° = กลางหัว */}
                <circle cx={27 + 20 * Math.sin((sunNow.az - 180) * P3_DEG) * Math.cos(Math.max(0, sunNow.alt) * P3_DEG)}
                  cy={27 - 20 * Math.sin(Math.max(0, sunNow.alt) * P3_DEG)}
                  r="5" fill={sunNow.alt > 0 ? "#F59E0B" : "#94A3B8"} />
              </svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span className="p3-eb">ดวงอาทิตย์ตอนนี้</span>
              <div style={{ display: "flex", gap: 14 }}>
                <span className="p3-stat">มุมเงย <b>{Math.round(sunNow.alt)}°</b></span>
                <span className="p3-stat">ทิศ <b>{Math.round(sunNow.az)}°</b></span>
              </div>
              {sunNow.alt <= 0 && <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>ยังไม่ขึ้น / ตกแล้ว</span>}
            </div>
          </div>
          <div className="p3-card">
            <Slider label="เดือน" right={["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][(st.sun.month || 1) - 1]}
              min={1} max={12} step={1} value={st.sun.month} onChange={(v) => setSun({ month: v })} />
            <Slider label="เวลา" right={fmtHour(+st.sun.hour || 12) + " น."}
              min={6} max={18.5} step={0.25} value={st.sun.hour} onChange={(v) => { setAnimating(false); setSun({ hour: v }); }} />
            <button className={"p3-b w " + (animating ? "" : "pri")} onClick={() => setAnimating((a) => !a)}
              style={animating ? { background: "var(--tint-amber-tx)", borderColor: "var(--tint-amber-tx)", color: "#fff", fontWeight: 700 } : null}>
              <P3Icon name={animating ? "pause" : "play"} size={14} />{animating ? "หยุดกวาดเงา" : "กวาดเงาทั้งวัน (06:00–18:30)"}
            </button>
            {/* ความเร็วกวาด — ปรับได้ระหว่างกวาดอยู่เลย ไม่ต้องหยุดก่อน */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", flex: "0 0 auto" }}>ความเร็ว</span>
              {[{ v: 0.5, th: "ช้า" }, { v: 1, th: "ปกติ" }, { v: 2, th: "เร็ว" }, { v: 4, th: "เร็วมาก" }].map((o) => (
                <button key={o.v} className="p3-chip" data-on={sweepSpd === o.v ? "1" : "0"}
                  onClick={() => setSweepSpd(o.v)}
                  style={{ flex: 1, justifyContent: "center", borderRadius: 8, padding: "5px 4px", fontSize: 11.5 }}>{o.th}</button>
              ))}
            </div>
            <span className="p3-note">ปกติ = กวาดตั้งแต่เช้าถึงเย็นใน {P3_SWEEP_SEC} วินาที</span>
          </div>
          {/* เส้นแนวโคจร = ทางเดินของดวงอาทิตย์ทั้งวันตามเดือน/พิกัดที่ตั้งไว้ */}
          <button className={"p3-b w " + (showSun ? "soft" : "")} onClick={() => setShowSun((v) => !v)}
            title="เส้นสีส้ม = ทางเดินดวงอาทิตย์ช่วงกลางวัน · เส้นจาง = ช่วงอยู่ใต้ขอบฟ้า · จุดส้มสองปลาย = เวลาขึ้น–ตก"
            style={{ justifyContent: "flex-start", padding: "10px 12px" }}>
            <P3Icon name="sun" size={15} />{showSun ? "ซ่อนดวงอาทิตย์ + แนวโคจร" : "แสดงดวงอาทิตย์ + แนวโคจร"}
          </button>
          <div className="p3-card">
            <span className="p3-eb">พิกัดและกำลังแผง<span className="ln" /></span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <Num label="ละติจูด" value={st.sun.lat} step={0.01} onChange={(v) => setSun({ lat: v })} />
              <Num label="ลองจิจูด" value={st.sun.lng} step={0.01} onChange={(v) => setSun({ lng: v })} />
            </div>
            <Num label="กำลังแผง (Wp/แผง)" value={st.wp} step={5} min={100} suffix="W" onChange={(v) => set({ wp: v })} />
          </div>
        </div>
      )}
    </div>
  );

  /* ── โครงหน้า ── */
  return (
    <div className="p3" style={{ position: "fixed", inset: 0, zIndex: 120, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{P3_CSS}</style>
      {mapOpen && <P3MapPicker initial={jobLatLng} initialQuery={jobAddr} onPick={onPickMap} onClose={() => setMapOpen(false)} />}
      {setPrep && <P3SetPreview prep={setPrep} busy={busyDxf === "setdl"}
        onClose={() => setSetPrep(null)} onDownload={doSetDownload} />}
      {/* เวิร์กสเปซออกแบบระบบ — ใช้ทิศ/มุมของแผงจากผังนี้ตรง ๆ (solarui.jsx) */}
      {sysOpen && typeof SolarWorkspace === "function" && (
        <SolarWorkspace job={job} st={st} sys={st.sys || scBlankSys()} onClose={() => setSysOpen(false)}
          /* ถ่ายภาพฉาก 3 มิติตามมุมกล้องที่ผู้ใช้ตั้งไว้ ไปแปะในรายงาน (renderer เปิด preserveDrawingBuffer ไว้แล้ว) */
          snap={() => {
            const t = tRef.current;
            if (!t.renderer || !t.scene || !t.camera) return null;
            try { t.renderer.render(t.scene, t.camera); return t.renderer.domElement.toDataURL("image/jpeg", 0.86); }
            catch (e) { return null; }
          }}
          onChange={(s) => {
            /* เลือกรุ่นแผงแล้วให้ kWp ในหัวจอ 3D ใช้กำลังแผงรุ่นนั้นเลย จะได้ไม่ขัดกันสองที่ */
            const wp = scNum((scPanelSpec(s) || {}).wp, 0);
            set(wp ? { sys: s, wp: wp } : { sys: s });
          }} />
      )}
      {/* header */}
      <div className="p3-head" style={{ padding: isMobile ? "9px 12px" : "11px 18px" }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--primary-dark)" }}>
          <P3Icon name="grid" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", color: "var(--text-3)", textTransform: "uppercase" }}>
            วางแผง 3D{job && job.code ? " · " + job.code : ""}
          </div>
          <div style={{ fontSize: isMobile ? 13 : 14.5, fontWeight: 700, letterSpacing: "-.1px", color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : ""}</div>
        </div>
        {/* ตัวเลขสรุป — ตัวใหญ่อ่านง่ายจากไกล + แถบความคืบหน้าเทียบเป้า */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, flexShrink: 0 }}>
          <span className="p3-kpi"><span className="n">{total}</span><span className="u">แผง</span></span>
          <span style={{ width: 1, height: 22, background: "var(--ln)" }} />
          <span className="p3-kpi"><span className="n">{kwp}</span><span className="u">kWp</span></span>
          {job && job.panels ? (() => {
            const goal = +job.panels;
            const done = total >= goal;
            const pct = Math.max(0, Math.min(100, total / Math.max(1, goal) * 100));
            return (
              /* บอกเป้าเป็นตัวเลขเสมอ + ขาด/เกินอีกกี่แผง ไม่ต้องเอาเมาส์ไปจิ้มถึงจะรู้ */
              <span style={{ display: isMobile ? "none" : "flex", flexDirection: "column", gap: 4, minWidth: 96 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>
                  <span>เป้า <b style={{ color: "var(--text-2)", fontWeight: 800 }}>{goal}</b> แผง</span>
                  <span style={{ color: done ? "var(--primary-dark)" : "var(--tint-amber-tx)", fontWeight: 800, whiteSpace: "nowrap" }}>
                    {done ? (total > goal ? "เกิน " + (total - goal) : "ครบ") : "ขาด " + (goal - total)}
                  </span>
                </span>
                <span style={{ height: 3, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: pct + "%", borderRadius: 99, background: done ? "var(--primary)" : "#F59E0B", transition: "width .35s ease" }} />
                </span>
              </span>
            );
          })() : null}
        </div>
        <button className="ghost" onClick={tryClose} title="ปิดโหมด 3D"><Icon name="x" size={16} /></button>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
        {/* 3D canvas */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", background: "#dce8f2" }}>
          <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
          {!ready && !loadErr && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-2)", fontSize: 13.5, fontWeight: 600 }}>กำลังโหลดโหมด 3D…</div>}
          {loadErr && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--tint-red-tx)", fontSize: 13, padding: 30, textAlign: "center" }}>{loadErr}<br />ต้องต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดตัวเรนเดอร์ 3D</div>}
          {/* แถบเครื่องมือกระจกฝ้าชิ้นเดียว — จัดกลุ่มด้วยเส้นคั่นบาง ๆ แทนปุ่มลอยกระจัดกระจาย */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: "calc(100% - 20px)" }}>
            <div className="p3-tools">
              {/* 3D / 2D เป็นคู่เดียวกัน — ตัวที่ใช้อยู่ทึบเข้ม ดูปราดเดียวรู้ว่าอยู่โหมดไหน */}
              {[["3D", "cube", !view2D, view3d, "หมุนดูรอบด้านได้"],
                ["2D", "plan", view2D, viewTop, "ล็อกมองจากด้านบนอย่างเดียว — หมุนไม่ได้ ลากเพื่อเลื่อนผัง"]].map(([lb, ic, on, fn, tip]) => (
                <button key={lb} className="p3-tool" onClick={fn} title={tip} data-on={on ? "1" : "0"}
                  style={{ letterSpacing: ".3px" }}><P3Icon name={ic} />{lb}</button>
              ))}
              <span className="p3-vr" />
              <IconBtn icon="nodes" label={isMobile ? "" : "จุด"} on={showVerts} onClick={() => setShowVerts((v) => !v)}
                title={showVerts ? "ซ่อนจุดมุมหลังคา" : "แสดงจุดมุมหลังคา (ใช้แก้ทรง)"} />
              <IconBtn icon={locked ? "lock" : "unlock"} label={isMobile ? "" : "ล็อก"} on={locked} tone="warn" onClick={() => setLocked((v) => !v)}
                title={locked ? "ล็อกตัวบ้านอยู่ — หลังคา/มุม/สิ่งบดบัง ขยับไม่ได้ · แผงยังจัดได้ตามปกติ" : "ล็อกตัวบ้านกันเผลอลาก (ยังจัดแผงได้)"} />
              <IconBtn icon="ruler" label={isMobile ? "" : "วัด"} on={measuring} tone="info"
                title={measuring ? "กำลังวัดระยะ — คลิกไล่จุดตามแนวที่จะเดินสาย/เดินราง" : "วัดระยะจริงบนผัง (ใช้กรอก BOQ ได้)"}
                onClick={() => { if (measuring) cancelMeas(); else startMeas(); }} />
              <span className="p3-vr" />
              <IconBtn icon={lightMode === "sun" ? "sunShadow" : lightMode === "noshadow" ? "sun" : "bulb"}
                label={isMobile ? "" : (lightMode === "sun" ? "แดด+เงา" : lightMode === "noshadow" ? "ไม่มีเงา" : "แสงแบน")}
                on={lightMode !== "sun"} title="กดวนโหมดแสง: แดดจริง+เงา → แดดไม่มีเงา → แสงแบนเท่ากันทั้งผัง"
                onClick={() => setLightMode((v) => (v === "sun" ? "noshadow" : v === "noshadow" ? "flat" : "sun"))} />
              {st.photo && (
                <IconBtn icon="image" label={isMobile ? "" : "รูป"} on={photoEdit} tone="info"
                  title={photoEdit ? "กำลังปรับรูปโดรน (ลาก/หมุน/ย่อขยายบนภาพ)" : "ปรับรูปโดรนบนภาพ"}
                  onClick={() => { const n = !photoEdit; setPhotoEdit(n); if (n) { setLocked(false); setDrawing(false); viewTop(); } }} />
              )}
            </div>
          </div>

          {/* แถบโหมดปรับรูปโดรน ลอยบน canvas */}
          {photoEdit && (
            <div style={{ position: "absolute", top: 54, left: 10, right: 10, background: "#1D4ED8", color: "#fff", borderRadius: 13, padding: "9px 10px 9px 13px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", boxShadow: "0 14px 32px -14px rgba(29,78,216,.75)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
                <P3Icon name="image" size={14} />ปรับรูปโดรน
              </span>
              <span style={{ fontSize: 11, opacity: 0.9, lineHeight: 1.45 }}>
                ลากกลางรูป = ย้าย · ลาก<b>จุดน้ำเงินมุม</b> = ย่อ/ขยาย · ลาก<b>จุดส้ม</b> = หมุน (กด Shift ล็อกทีละ 15°)
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, marginLeft: "auto", whiteSpace: "nowrap", background: "rgba(255,255,255,.15)", padding: "4px 9px", borderRadius: 99 }}>
                {(+st.photoW || 30).toFixed(1)} ม. · {Math.round(st.photoRot || 0)}°
              </span>
              {/* กันรูปหลุดออกนอกจอจนหาไม่เจอ — ดึงกลับกลางผังได้เสมอ */}
              <button onClick={() => set({ photoRot: 0, photoX: 0, photoZ: 0 })}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,.45)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap" }}>
                <P3Icon name="reset" size={13} />กลางผัง</button>
              <button onClick={() => setPhotoEdit(false)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 9, border: "none", background: "#fff", color: "#1D4ED8", fontWeight: 800, fontSize: 11.5 }}>
                <P3Icon name="check" size={13} />เสร็จ</button>
            </div>
          )}
          {/* แถบโหมดวาด ลอยบน canvas */}
          {drawing && (
            <div className="p3-tools" style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", gap: 6, padding: "5px 5px 5px 12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                <P3Icon name="pencil" size={14} />คลิกวางมุมหลังคา
                <b style={{ fontWeight: 800, color: "var(--acd)" }}>{drawPts.length} จุด</b>
              </span>
              <span className="p3-vr" />
              <button className="p3-b sm pri" onClick={finishDraw} disabled={drawPts.length < 3} style={{ whiteSpace: "nowrap" }}>
                <P3Icon name="check" size={13} />จบรูป</button>
              <button className="p3-b sm dngr" onClick={cancelDraw}>ยกเลิก</button>
            </div>
          )}
          {/* แถบโหมดวัดระยะ ลอยบน canvas */}
          {measuring && (
            <div className="p3-tools" style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", gap: 6, padding: "5px 5px 5px 12px", maxWidth: "calc(100% - 20px)", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap" }}>
                <P3Icon name="ruler" size={14} />คลิกไล่จุดตามแนวเดินสาย
                <b style={{ fontWeight: 800, color: "#2563EB" }}>
                  {measPts.length >= 2 ? p3MeasLen({ pts: measPts }).toFixed(2) + " ม." : measPts.length + " จุด"}
                </b>
              </span>
              <span className="p3-vr" />
              <button className="p3-b sm" onClick={undoMeasPt} disabled={!measPts.length}>ถอยจุด</button>
              <button className="p3-b sm pri" onClick={finishMeas} disabled={measPts.length < 2} style={{ whiteSpace: "nowrap" }}>
                <P3Icon name="check" size={13} />เก็บระยะ</button>
              <button className="p3-b sm dngr" onClick={cancelMeas}>ยกเลิก</button>
            </div>
          )}
          {/* แถบใบ้การใช้งาน — คู่ "ท่าทาง → ผลลัพธ์" คั่นด้วยจุด อ่านเป็นชุด ๆ ไม่ใช่ประโยคยาว */}
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", pointerEvents: "none" }}>
            <span className="p3-hint" style={{ flexWrap: "wrap", rowGap: 3 }}>
              {(measuring ? [["คลิก", "วางจุดวัด"], ["ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["ดูดเข้ามุมหลังคา", "ในระยะ 0.7 ม."]]
                : drawing ? [["คลิก", "วางจุด"],[view2D ? "ลาก" : "ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["ลากแล้วปล่อย", "ไม่วางจุด"]]
                : locked ? [["สถานะ", "ล็อกตัวบ้านไว้ — จัดแผงได้"], ["ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["แตะแผง", "เว้นช่อง"], ["ลากจุดน้ำเงิน", "ย้าย/ย่อขยายชุดแผง"]]
                : tab === "panel" ? [["สถานะ", "ล็อกตัวบ้านไว้"], ["ลาก", view2D ? "เลื่อนผัง" : "หมุนมุมมอง"], ["แตะแผง", "เว้นช่อง"], ["ลากจุดน้ำเงิน", "ย้าย/ย่อขยายชุดแผง"]]
                : view2D ? [["ลาก", "เลื่อนผัง"], ["ล้อ/บีบ", "ซูม"], ["แตะแผง", "เว้นช่อง"], ["ลากหลังคา", "ย้าย"]]
                : [["ลาก", "หมุน"], ["ล้อ/บีบ", "ซูม"], ["คลิกขวา/2 นิ้ว", "เลื่อน"], ["แตะแผง", "เว้นช่อง"], ["ลากหลังคา", "ย้าย"]]
              ).map(([k, v], i) => (
                <React.Fragment key={k + i}>
                  {i > 0 && <span style={{ opacity: 0.3 }}>·</span>}
                  <span><em>{k}</em> {v}</span>
                </React.Fragment>
              ))}
            </span>
          </div>
        </div>

        {/* side rail */}
        <div className="p3-rail" style={{ width: isMobile ? "100%" : 332, flexShrink: 0, maxHeight: isMobile ? "46%" : "none", overflowY: "auto",
          borderLeft: isMobile ? "none" : "1px solid var(--border)", borderTop: isMobile ? "1px solid var(--border)" : "none",
          background: "var(--surface)", padding: isMobile ? 12 : "14px 14px 22px" }}>
          {panelBody}
        </div>
      </div>

      {/* footer */}
      <div style={{ paddingTop: 9, paddingLeft: isMobile ? 12 : 18, paddingRight: isMobile ? 12 : 18, paddingBottom: "calc(9px + env(safe-area-inset-bottom,0px))", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button className="p3-b" onClick={doPng} title="บันทึกภาพหน้าจอ 3D เป็นไฟล์ PNG"><P3Icon name="camera" size={14} />ภาพ PNG</button>
        <button className="p3-b" onClick={doSet} disabled={!!busyDxf}
          title="ดูตัวอย่างแบบผังติดตั้งก่อนโหลด — A3 แนวนอน พร้อมกรอบ + Title Box และภาพถ่ายทางอากาศจาง ๆ เป็นพื้นหลัง (1 หน่วย = 1 เมตร)">
          <P3Icon name="doc" size={14} />{busyDxf === "set" ? "กำลังทำ…" : "ผัง DXF"}</button>
        <button className="p3-b" onClick={() => setSysOpen(true)} disabled={!total}
          title={total ? "เลือกแผง/อินเวอร์เตอร์ จัดสตริง และคำนวณผลผลิตจากมุมแผงจริง" : "วางแผงก่อนถึงจะคำนวณระบบได้"}>
          <P3Icon name="sun" size={14} />ออกแบบระบบ &amp; ผลผลิต
        </button>
        <span style={{ flex: 1 }} />
        {/* จุดส้มกะพริบ = ยังไม่บันทึก มองเห็นก่อนอ่านตัวหนังสือ */}
        {dirty && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--tint-amber-tx)", fontWeight: 700 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,.22)" }} />
            ยังไม่บันทึก
          </span>
        )}
        <button className={"p3-b pri" + (dirty ? "" : " ")} onClick={doSave} disabled={!dirty}
          style={{ padding: "10px 24px", borderRadius: 11, fontSize: 13, minWidth: 116 }}>
          <P3Icon name="save" size={15} />{dirty ? "บันทึก" : "บันทึกแล้ว"}
        </button>
      </div>
    </div>
  );
}

/* ══ แผ่นที่ 2 · SINGLE LINE DIAGRAM SOLAR CELL SYSTEM ══
   สร้างจากสเปคที่ออกแบบไว้ในโหมด 3D + ข้อมูลงาน แล้วให้ dxf.jsx เป็นคนวาด
   พิกัดเบรกเกอร์คิดจากกระแสใช้งานจริง × 1.25 ตามที่มาตรฐานการติดตั้งกำหนด
   แล้วปัดขึ้นหาพิกัดมาตรฐานที่มีขายจริง — ไม่ใช่ตัวเลขตายตัวที่ก๊อปมาจากแบบเดิม */
const P3_AT = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 225, 250, 400];
const P3_CT = [80, 100, 160, 250, 400];
const P3_CU = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95];
const p3At = (i) => P3_AT.find((a) => a >= i) || P3_AT[P3_AT.length - 1];
const p3Ct = (i) => P3_CT.find((a) => a >= i) || P3_CT[P3_CT.length - 1];
/* ขนาดสายทองแดงหุ้ม XLPE เดินในท่อในอากาศ (คร่าว ๆ ตามพิกัดกระแสที่รับได้) */
/* เลือกขนาดสายที่เล็กที่สุดที่พิกัดกระแส (ตาราง วสท. ในหน้า BOQ — เดินในท่อในอากาศ) ยังรับไหว
   ถ้า BOQ ยังไม่โหลด ใช้สูตรประมาณเป็นตัวสำรอง จะได้ไม่พังทั้งใบ */
const p3Cu = (i, cores) => {
  const nC = cores === 2 ? 2 : 4;
  const amp = window.BOQ && window.BOQ.ampacityOf;
  if (amp) {
    const s = P3_CU.find((sz) => {
      const a = amp("CV-FD " + nC + "C-" + sz + " Sq.mm.", { ncond: nC === 2 ? 2 : 3 });
      return a != null && a >= i;
    });
    if (s) return s;
  }
  return P3_CU.find((s) => s * 6.2 + 12 >= i) || P3_CU[P3_CU.length - 1];
};
/* ยี่ห้อไม่ได้แยกเป็นช่องในคลัง จึงอ่านจากคำแรกของชื่อรุ่น */
const p3Brand = (model, fb) => {
  const w = String(model || "").trim().split(/[\s\-_]/)[0];
  return w ? w.toUpperCase() : (fb || "-");
};

function p3SldModel(st, job) {
  const sys = st.sys || {};
  const B = window.BOQ || {};
  const nPanel = Math.max(1, p3CountAll(st));
  const wp = +st.wp || 650;
  const micro = sys.mode !== "string";
  const phase = +sys.phases || (job && String(job.phase) === "3" ? 3 : 1);
  const nPh = phase === 3 ? 3 : 1;
  const Vll = nPh === 3 ? 400 : 230, kPh = nPh === 3 ? Math.sqrt(3) : 1;

  /* ── รุ่นแผง ── */
  const pStock = (B.PANELS || []).find((p) => p.model === sys.panelModel)
    || (B.PANELS || []).find((p) => +p.wp === wp) || {};
  const panel = { model: pStock.model || sys.panelModel || (wp + "Wp"), wp, count: nPanel };
  panel.brand = p3Brand(panel.model, (job && job.brand) || "");

  /* ── รุ่นอินเวอร์เตอร์ + การแบ่งแผงต่อตัว ── */
  let inv, units = [], unitW;
  if (micro) {
    const mi = (B.MICRO || []).find((m) => m.ratio === sys.microRatio) || (B.MICRO || [])[1] || (B.MICRO || [])[0] || {};
    const per = Math.max(1, +mi.perInverter || 2);
    const n = Math.ceil(nPanel / per);
    unitW = +mi.acW || 1250;
    inv = { model: mi.model || "MICRO", count: n, w: unitW, v: +mi.acV || 230, spec: mi };
    for (let i = 0; i < n; i++) units.push({ panels: Math.min(per, nPanel - i * per), phase: (i % nPh) + 1 });
  } else {
    const iv = (B.INVERTERS || []).find((x) => x.model === sys.invModel) || {};
    const kw = +iv.kw || 5;
    const n = Math.max(1, +sys.invCount || Math.ceil(nPanel * wp / 1000 / kw));
    unitW = kw * 1000;
    inv = { model: iv.model || "INVERTER", count: n, w: unitW, v: Vll, spec: iv };
    for (let i = 0; i < n; i++) {
      units.push({ panels: Math.round(nPanel / n) + (i < nPanel % n ? 1 : 0), phase: nPh === 3 ? 1 : 1 });
    }
  }
  inv.brand = p3Brand(inv.model, (job && job.brand) || "");
  const unitA = unitW / ((micro ? (inv.v || 230) : Vll) * (micro ? 1 : kPh));

  /* ── แบ่งวงจรย่อยเข้าตู้รวม ── */
  const perBr = micro ? Math.max(1, Math.round(+((inv.spec || {}).perBranch) || 2)) : 1;
  const nBr = Math.min(6, Math.max(1, Math.ceil(units.length / perBr)));
  const branches = [];
  for (let i = 0; i < nBr; i++) {
    const cnt = Math.floor(units.length / nBr) + (i < units.length % nBr ? 1 : 0);
    const I = cnt * unitA;
    branches.push({
      name: "PV " + (i + 1),
      mcb: "MCB " + (nPh === 3 ? "4P," : "2P,") + p3At(I * 1.25) + "AT",
      units: cnt, amps: I,
    });
  }
  const battOn = !!(job && job.battery) || !!sys.batt;
  const battKwh = (sys.batt && +sys.batt.kwh) || parseFloat(String((job && job.batSize) || "").replace(/[^0-9.]/g, "")) || 0;
  if (battOn) branches.push({ name: "BAT.", mcb: "MCB " + (nPh === 3 ? "4P," : "2P,") + p3At(unitA * 2.5) + "AT", solar: false });

  const totA = units.length * unitA;
  const acKw = Math.round(units.length * unitW / 10) / 100;
  const dcKw = Math.round(nPanel * wp / 10) / 100;

  /* ── สายและเครื่องป้องกัน ── */
  const nCore = nPh === 3 ? 4 : 2;
  const brCu = p3Cu(unitA * perBr * 1.25, nCore);
  const mainCu = p3Cu(totA * 1.25, nCore);
  const P = nPh === 3 ? "4P," : "2P,";
  const M = {
    mode: micro ? "micro" : "string",
    phase: nPh,
    panel, inv, units,
    acCable: "CV-FD " + (nPh === 3 ? "4C-" : "2C-") + brCu + " Sq.mm. " + (nPh === 3 ? "L1,L2,L3,N" : "L,N"),
    branches,
    combinerModel: "",
    ctBranch: "CTx1 " + p3Ct(totA * 1.5) + "A/40mA",
    rccb: "RCCB " + Vll + "V " + P + p3At(Math.max(63, totA * 1.25)) + "AT",
    rccbType: "Type A 100mA",
    gateway: true,
    mainCable: ["CV-FD  " + (nPh === 3 ? "4Cx" : "2Cx") + mainCu + " sq.mm. (SOLAR-CELL)",
      "IEC01 THW(G)  " + Math.max(6, p3Cu(totA * 0.5, 2)) + " sq.mm. (GROUND)"],
    mccbNew: true,
    mccb: ["MCCB " + P + p3At(totA * 1.25) + "AT", "NEW"],
    rcbo: ["RCBO", P + p3At(totA * 1.25) + "AT"],
    ctMain: "CTx2 " + p3Ct(Math.max(250, totA * 3)) + "A/40mA",
    batt: battOn && battKwh ? { brand: p3Brand((sys.batt && sys.batt.model) || (job && job.brand), "ATMOCE"), model: (sys.batt && sys.batt.model) || (battKwh ? battKwh + " kWh" : "-"), kwh: battKwh } : null,
    summary: [
      (micro ? "MICRO INVERTER " : "INVERTER ") + units.length + " EA. x " + Math.round(unitW) + " W. = " + acKw.toFixed(2) + " kWp.",
      "PV MODULE " + nPanel + " PANEL. x " + wp + " Wp. = " + dcKw.toFixed(2) + " kWp.",
    ],
  };

  /* ── ตารางสเปค ── ใส่เฉพาะค่าที่มีจริงในคลัง ค่าที่ยังไม่กรอกไม่ต้องเดาให้ ── */
  const sp = inv.spec || {};
  const row = (k, v, u) => (v === 0 || v == null || v === "" ? null : [k, v, u]);
  M.invData = [
    ["BRAND", inv.brand], ["MODEL", inv.model], ["#", "INPUT PARAMETERS"],
    row("MAX. POWER OF COMPATIBLE PV", sp.wpMax || (micro ? Math.round(unitW * 1.3) : ""), "W"),
    row("MPPT VOLTAGE RANGE", sp.mpptVmin && sp.mpptVmax ? sp.mpptVmin + " TO " + sp.mpptVmax : "", "VDC"),
    row("MAX. DC VOLTAGE", sp.maxVdc, "VDC"),
    row("START-UP INPUT VOLTAGE", sp.vStart, "VDC"),
    row("NUMBER OF INPUT", sp.inputs || sp.perInverter, ""),
    row("NUMBER OF MPPT", sp.mppt, ""),
    row("MAX. INPUT CURRENT", sp.maxInA, "A"),
    row("MAX. INPUT Isc", sp.maxIscA, "A"),
    ["#", "OUTPUT PARAMETERS"],
    ["NOMINAL VOLTAGE", micro ? (inv.v || 230) : Vll, "VAC"],
    ["NOMINAL OUTPUT POWER", Math.round(unitW), "W"],
    ["NOMINAL OUTPUT CURRENT", unitA.toFixed(2), "A"],
    row("MAX. OUTPUT CURRENT", sp.outA, "A"),
    ["NUMBER OF UNIT", units.length, "EA"],
    row("MAX EFFICIENCY", sp.eff, "%"),
  ].filter(Boolean);

  M.battData = M.batt ? [
    ["BRAND", M.batt.brand], ["MODEL", M.batt.model],
    ["BATTERY ENERGY", M.batt.kwh, "kWh"],
    ["NOMINAL VOLTAGE", Vll, "VAC"],
    ["CHEMISTRY", (sys.batt && sys.batt.chem) || "LiFePO4"],
  ] : [];

  M.equip = [
    { brand: inv.brand, model: inv.model, desc: (micro ? "MICRO INVERTER " : "INVERTER ") + Math.round(unitW) + " W. " + nPh + " PHASE.", no: units.length },
    { brand: panel.brand, model: panel.model, desc: "PV MODULE " + wp + " Wp.", no: nPanel },
  ];
  if (M.batt) M.equip.push({ brand: M.batt.brand, model: M.batt.model, desc: "BATTERY " + M.batt.kwh + " kWh.", no: 1 });
  return p3SldApply(M, st.sldEdit);
}

/* ══ แก้ค่าบนแบบเอง ══
   ค่าที่ระบบคิดให้อาจไม่ตรงของจริงหน้างาน (เปลี่ยนรุ่นเบรกเกอร์ ใช้สายคนละเบอร์ ฯลฯ)
   จึงเก็บเฉพาะ "ค่าที่ถูกแก้" เป็น map path→ค่า ไว้ที่ st.sldEdit
   ช่องไหนไม่ได้แก้ก็ยังคิดให้อัตโนมัติเหมือนเดิม ลบค่าที่แก้ทิ้งเมื่อไรก็กลับไปใช้ค่าอัตโนมัติทันที
   คั่นชั้นด้วย ~ ไม่ใช่จุด เพราะคีย์ของ Firebase ห้ามมีจุด */
function p3SldApply(M, edit) {
  if (!edit) return M;
  Object.keys(edit).forEach((path) => {
    const v = edit[path];
    if (v == null || v === "") return;
    const seg = path.split("~");
    let o = M;
    for (let i = 0; i < seg.length - 1; i++) { o = o && o[seg[i]]; if (!o) return; }
    o[seg[seg.length - 1]] = v;
  });
  return M;
}

/* รายการช่องที่แก้ได้ — สร้างจากโมเดลที่คิดอัตโนมัติแล้ว จะได้โชว์ค่าเดิมให้เทียบ */
function p3SldFields(M) {
  const g = [];
  const br = { title: "วงจรย่อยในตู้รวม", items: [] };
  (M.branches || []).forEach((b, i) => {
    br.items.push({ path: "branches~" + i + "~name", label: "ชื่อวงจรที่ " + (i + 1), auto: b.name });
    br.items.push({ path: "branches~" + i + "~mcb", label: "เบรกเกอร์วงจรที่ " + (i + 1), auto: b.mcb });
  });
  g.push({ title: "อุปกรณ์หลัก", items: [
    { path: "inv~model", label: "รุ่นอินเวอร์เตอร์", auto: M.inv.model },
    { path: "inv~brand", label: "ยี่ห้ออินเวอร์เตอร์", auto: M.inv.brand },
    { path: "panel~model", label: "รุ่นแผง", auto: M.panel.model },
    { path: "panel~brand", label: "ยี่ห้อแผง", auto: M.panel.brand },
    { path: "combinerModel", label: "รุ่นตู้ AC COMBINER", auto: M.combinerModel, hint: "เว้นว่างได้" },
  ] });
  g.push(br);
  g.push({ title: "เมนตู้รวมโซลาร์", items: [
    { path: "acCable", label: "สาย AC จากอินเวอร์เตอร์", auto: M.acCable },
    { path: "ctBranch", label: "CT ในตู้รวม", auto: M.ctBranch },
    { path: "rccb", label: "RCCB", auto: M.rccb },
    { path: "rccbType", label: "RCCB บรรทัดที่ 2", auto: M.rccbType },
    { path: "mainCable~0", label: "สายเมนขึ้นตู้ MCCB", auto: M.mainCable[0] },
    { path: "mainCable~1", label: "สายกราวด์", auto: M.mainCable[1] },
  ] });
  g.push({ title: "ตู้ MCCB และมิเตอร์", items: [
    { path: "mccb~0", label: "MCCB", auto: M.mccb[0] },
    { path: "mccb~1", label: "MCCB บรรทัดที่ 2", auto: M.mccb[1] },
    { path: "rcbo~0", label: "RCBO ไปโหลด", auto: M.rcbo[0] },
    { path: "rcbo~1", label: "RCBO บรรทัดที่ 2", auto: M.rcbo[1] },
    { path: "ctMain", label: "CT MAIN GRID", auto: M.ctMain },
  ] });
  g.push({ title: "ข้อความสรุปใต้แถวแผง", items: [
    { path: "summary~0", label: "บรรทัดที่ 1", auto: M.summary[0] },
    { path: "summary~1", label: "บรรทัดที่ 2", auto: M.summary[1] },
  ] });
  return g;
}

function p3Sld(st, job, media) {
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media && media.svg);
  const sheet = pgSheet(doc, { k: 1, ox: 0, oy: 0, info: p3SheetInfo(st, job, { sheet: "SLD", scale: "AS SHOW", sheetNo: (media && media.sheetNo) || "1/1" }) });
  pgSldDraw(doc, sheet, p3SldModel(st, job));
  return doc.build();
}

/* ── แผ่นรูปถ่ายจุดติดตั้ง (INSTALLATION POINT) ──
   media.photos = [{ file, pxW, pxH, caption }] ที่โหลดขนาดจริงมาแล้ว (ดู p3ExportSet)
   วางเป็นตารางในกรอบ A3 พร้อมป้ายชื่อจุดใต้รูป — สูงสุด 12 รูปต่อแผ่น */
const P3_PHOTO_MAX = 12;
function p3PhotoSheet(st, job, media) {
  media = media || {};
  const items = (media.photos || []).slice(0, P3_PHOTO_MAX);
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media.svg);
  pgTableLayers(doc);
  const sheet = pgSheet(doc, { k: 1, ox: 0, oy: 0,
    info: p3SheetInfo(st, job, { sheet: "PHOTO", scale: "NONE", sheetNo: media.sheetNo || "1/1" }) });
  const pen = sheet.pen, A = sheet.area;
  pgSheetTitle(pen, A.x0 + 4, A.y1 - 10, "INSTALLATION POINT", 7.4, 150, 0);
  const n = items.length;
  if (!n) {
    pen.text(PG_TBL.txt, (A.x0 + A.x1) / 2, (A.y0 + A.y1) / 2, 4.5,
      "ยังไม่มีรูปถ่ายหน้างานในระบบ", { align: 1, valign: 1 });
    return doc.build();
  }
  const cols = n <= 2 ? 2 : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const gx = 6, gy = 9, pad = 4, capH = 6.4;
  /* กรอบรูปทำตามสัดส่วนรูปจริง (เฉลี่ย) จะได้ไม่มีขอบดำเหลือรอบรูป */
  const ar = items.reduce((s, p) => s + (+p.pxH || 3) / (+p.pxW || 4), 0) / n;
  const availW = A.x1 - A.x0 - pad * 2, availH = A.y1 - A.y0 - pad * 2 - 18;
  let W = (availW - (cols - 1) * gx) / cols;
  let H = W * ar + capH;
  const maxH = (availH - (rows - 1) * gy) / rows;
  if (H > maxH) { H = maxH; W = (H - capH) / ar; }
  const x0 = A.x0 + pad + (availW - (W * cols + gx * (cols - 1))) / 2;
  const y0 = A.y0 + pad + (availH - (H * rows + gy * (rows - 1))) / 2;
  items.forEach((p, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    pgPhotoFrame(doc, pen, x0 + c * (W + gx), y0 + (rows - 1 - r) * (H + gy), W, H, p);
  });
  return doc.build();
}

/* ── แผ่นวัสดุอุปกรณ์หน้างาน (EQUIPMENT MATERIAL ON SITE) ──
   ยี่ห้อ/รุ่นดึงจากคลังสินค้าผ่าน p3SldModel · ระยะดึงจากเส้นวัดบนผังจริง
   ช่องไหนไม่มีข้อมูลจริงใส่ "-" ไว้ให้กรอกหน้างาน ไม่เดาตัวเลขให้ */
function p3EquipRows(st, job, M) {
  const len = {};
  (st.measures || []).forEach((m) => {
    const k = m.kind || "other";
    len[k] = (len[k] || 0) + p3MeasLen(m);
  });
  const mOf = (k) => (len[k] ? Math.ceil(len[k]) + " m." : "-");
  const rows = [["LIST", "SPECIFICATION", "BRAND", "DESCRIPTION"]];
  const add = (a, b, c, d) => rows.push([a, b || "-", c || "-", d || "-"]);
  add("PV MODULE", M.panel.model + "   " + M.panel.wp + " Wp.", M.panel.brand, M.panel.count + " Ea.");
  add(M.mode === "micro" ? "MICRO INVERTER" : "INVERTER", M.inv.model, M.inv.brand, M.units.length + " Ea.");
  if (M.batt) add("BATTERY", M.batt.model + "   " + M.batt.kwh + " kWh.", M.batt.brand, "1 Ea.");
  add("MOUNTING", "RAIL ALUMINIUM + L-FOOT + END / MID CLAMP", "-", "1 SET");
  add("PV CABLE", "PV1-F 1x4 Sq.mm.  DC1500V (RED / BLACK)", "-", mOf("cable"));
  add("CABLE", M.acCable, "-", mOf("cable"));
  add("GROUND", M.mainCable[1] || "IEC01 THW(G)", "-", "-");
  add("MC 4", "PV CONNECTOR MALE / FEMALE  DC1000V 30A", "-", (M.units.length * 2) + " PAIR");
  add("CONDUIT", "EMT / IMC / FLEXIBLE CONDUIT", "-", mOf("conduit"));
  add("RACE WAY", "WIREWAY / CABLE TRAY / CABLE LADDER", "-", mOf("tray"));
  if (len.ladder) add("บันไดลิง", "CAT LADDER เหล็กชุบกัลวาไนซ์", "-", mOf("ladder"));
  if (len.walkway) add("ทางเดิน", "WALKWAY บนหลังคา", "-", mOf("walkway"));
  if (len.guardrail) add("ราวกันตก", "GUARD RAIL", "-", mOf("guardrail"));
  add("CIRCUIT BREAKER", (M.mccb || []).join("  "), "-", "1 Ea.");
  (M.branches || []).forEach((b) => add("CIRCUIT BREAKER", b.mcb, "-", b.name));
  add("SPD", "SURGE PROTECTION DEVICE  " + (M.phase === 3 ? "4P" : "2P") + "  Type 2", "-", "1 Ea.");
  add("CT", M.ctMain, "-", "1 SET");
  add("COMBINER BOX", "AC COMBINER SOLAR BOX  IP65", "-", "1 Ea.");
  return rows;
}
function p3EquipSheet(st, job, media) {
  media = media || {};
  const M = p3SldModel(st, job);
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media.svg);
  pgTableLayers(doc);
  const sheet = pgSheet(doc, { k: 1, ox: 0, oy: 0,
    info: p3SheetInfo(st, job, { sheet: "MAT", scale: "NONE", sheetNo: media.sheetNo || "1/1" }) });
  const pen = sheet.pen, A = sheet.area;
  pgSheetTitle(pen, A.x0 + 4, A.y1 - 10, "EQUIPMENT MATERIAL ON SITE", 7.4, 180, 0);
  const rows = p3EquipRows(st, job, M);
  const W = A.x1 - A.x0 - 8;
  /* ยืดความสูงแถวให้ตารางกินพื้นที่แผ่นพอดี แต่ไม่เกินสูงสุดที่ยังดูดี */
  const rh = Math.max(5.5, Math.min(9.5, (A.y1 - A.y0 - 96) / rows.length));
  const used = pgGrid(pen, A.x0 + 4, A.y1 - 18, W, [1.1, 3.4, 1.2, 1.2], rows,
    { rh, th: Math.min(2.8, rh * 0.4), align: [0, 0, 1, 1], headRow: 0 });

  /* รูปตัดแผงใต้ตาราง ให้เห็นว่าแผงที่ลงหน้างานหน้าตาแบบไหน */
  const ps = ((window.BOQ && window.BOQ.PANELS) || []).find((p) => p.model === (st.sys || {}).panelModel) || {};
  const dy = A.y1 - 18 - used - 74;
  if (dy > A.y0 + 4) {
    pgModuleDetail(pen, A.x0 + 16, dy, 52, {
      wMm: Math.round((+ps.width || 1.134) * 1000), hMm: Math.round((+ps.length || 2.382) * 1000),
      tMm: +ps.frame || 30,
      caption: "แผง " + M.panel.wp + " วัตต์  (" + M.panel.model + ")",
    });
  }
  return doc.build();
}

/* ── แผ่นไดอะแกรมต่อสาย DC ──
   ใช้ตอนหน้างานเวลาต่อแผงเข้าอินเวอร์เตอร์ — บอกลำดับขั้ว + / − และปลายสายที่ออก MC4 */
function p3DcSheet(st, job, media) {
  media = media || {};
  const M = p3SldModel(st, job);
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media.svg);
  pgTableLayers(doc);
  const sheet = pgSheet(doc, { k: 1, ox: 0, oy: 0,
    info: p3SheetInfo(st, job, { sheet: "DC", scale: "NONE", sheetNo: media.sheetNo || "1/1" }) });
  const pen = sheet.pen, A = sheet.area;
  pgSheetTitle(pen, A.x0 + 4, A.y1 - 10, "DC CONNECTION DIAGRAM", 7.4, 150, 0);

  /* จัดกลุ่มชุดที่ต่อเหมือนกันเข้าด้วยกัน จะได้ไม่ต้องวาดซ้ำ 45 รูป */
  const grp = {};
  M.units.forEach((u) => { grp[u.panels] = (grp[u.panels] || 0) + 1; });
  const kinds = Object.keys(grp).map((k) => ({ per: +k, n: grp[k] })).sort((a, b) => b.per - a.per);

  /* ขวา = ตารางข้อมูลสาย DC · ซ้าย = รูปการต่อสายจริง */
  const RW = 118, RX = A.x1 - 4 - RW;
  const LW = RX - A.x0 - 10;
  const show = kinds.slice(0, 3);
  const colW = LW / show.length;
  const bw = Math.min(colW - 14, 150);
  /* จัดรูปให้อยู่กลางช่องที่เหลือ — ล่างกันไว้ให้หมายเหตุ บนกันไว้ให้หัวเรื่อง */
  const yLo = A.y0 + 40, yHi = A.y1 - 16, IVH = 13, IVGAP = 24;
  const maxPh = (yHi - yLo) - IVGAP - 22;
  const blockH = IVGAP + Math.max.apply(null, show.map((g) => pgDcSize(bw, g.per, maxPh).h));
  const baseY = yLo + IVGAP + Math.max(0, (yHi - yLo - blockH) / 2);
  show.forEach((g, ci) => {
    const cx = A.x0 + 6 + ci * colW + (colW - bw) / 2;
    const s = pgDcString(pen, cx, baseY, bw, { n: g.per, maxH: maxPh });
    pen.text(PG_TBL.txt, cx, s.top + 4, 3.0,
      (M.mode === "micro" ? "MICRO INV." : "INVERTER") + " x " + g.n + " ชุด · ชุดละ " + g.per + " แผง");
    /* กล่องอินเวอร์เตอร์ที่ปลายสตริง — ลากจากหัว MC4 จริงลงมาเข้ากล่อง */
    const iy = baseY - IVGAP, ih = IVH;
    pen.rect(PG_TBL.line, cx + bw * 0.15, iy, bw * 0.7, ih);
    pen.text(PG_TBL.txt, cx + bw * 0.5, iy + (ih - 2.4) / 2, 2.4, M.inv.model, { align: 1, valign: 1 });
    pen.line("PG-DETAIL", s.lx, s.my, s.lx, iy + ih);
    pen.line("PG-DETAIL", s.rx, s.my, s.rx, iy + ih);
  });
  if (kinds.length > show.length) {
    pen.text(PG_TBL.txt, A.x0 + 6, baseY - 34, 2.6,
      "ชุดที่เหลือต่อแบบเดียวกัน — ดูจำนวนแผงต่อชุดในตาราง SINGLE LINE DIAGRAM");
  }

  /* ── ตารางสรุปการต่อสายฝั่ง DC ── */
  const sp = M.inv.spec || {};
  const dcRows = [["#", "DC STRING"], ["ชุดที่", "จำนวนแผง", "ชนิดสาย"]];
  kinds.forEach((g, i) => dcRows.push([
    (M.mode === "micro" ? "MICRO " : "INV ") + (i + 1) + (g.n > 1 ? " x" + g.n : ""),
    g.per + " แผง", "PV1-F 1x4",
  ]));
  dcRows.push(["รวม", M.panel.count + " แผง", "-"]);
  let ry = A.y1 - 20;
  ry -= pgGrid(pen, RX, ry, RW, [1.1, 1, 1.2], dcRows, { rh: 5.4, th: 2.3, headRow: 1 }) + 8;

  const spec = [["PV MODULE", M.panel.model],
    ["กำลังไฟต่อแผง", M.panel.wp + " Wp."],
    ["จำนวนแผงทั้งหมด", M.panel.count + " แผง"]];
  if (sp.mpptVmin && sp.mpptVmax) spec.push(["MPPT VOLTAGE", sp.mpptVmin + " - " + sp.mpptVmax + " Vdc"]);
  if (sp.maxVdc) spec.push(["MAX. DC VOLTAGE", sp.maxVdc + " Vdc"]);
  if (sp.maxIscA) spec.push(["MAX. INPUT Isc", sp.maxIscA + " A"]);
  spec.push(["สาย DC", "PV1-F 1x4 Sq.mm. DC1500V"]);
  spec.push(["หัวต่อ", "MC4  DC1000V 30A"]);
  ry -= pgSpecBlock(pen, RX, ry, RW, "DC SPECIFICATION", spec, { rh: 5.4, th: 2.2, split: 1 });

  const note = [
    "1. ต่อแผงอนุกรมตามลำดับ ขั้ว + ของแผงหน้าเข้าขั้ว - ของแผงถัดไป",
    "2. ปลายสตริงทั้งสองข้างเข้าหัว MC4 ก่อนต่อเข้าอินเวอร์เตอร์ ห้ามต่อสลับขั้ว",
    "3. วัดแรงดัน Voc ของสตริงก่อนเสียบเข้าอินเวอร์เตอร์ทุกครั้ง",
    "4. สาย DC ใช้ PV1-F 1x4 Sq.mm. เดินในท่อ/รางที่กันแดดได้",
    "5. ยึดสายกับรางด้วยเคเบิลไทกันยูวี ห้ามให้สายห้อยสัมผัสหลังคา",
  ];
  pen.text(PG_TBL.txt, A.x0 + 6, A.y0 + 6 + note.length * 5, 3.0, "NOTE");
  note.forEach((s, i) => pen.text(PG_TBL.txt, A.x0 + 6, A.y0 + 6 + (note.length - 1 - i) * 5, 2.5, s));
  return doc.build();
}

/* ── ตัวช่วยส่งออก ── */
function p3ImgSize(url) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
    im.onerror = () => res(null);
    im.src = url;
  });
}
function p3SaveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
/* ส่งออกผังพร้อมไฟล์ภาพพื้นหลัง — DXF อ้างชื่อไฟล์รูปแบบสัมพัทธ์
   จึงต้องเก็บ .dxf กับ .png/.jpg ไว้โฟลเดอร์เดียวกัน ไม่งั้นเปิดมาแล้วพื้นหลังจะหาย */
async function p3ExportPlan(st, job) {
  const base = (job && (job.code || job.name)) || "plan3d";
  const want = [];
  if (st.baseMap && st.baseMap.url) want.push({ kind: "map", url: st.baseMap.url, fade: 78 });
  if (st.photo) want.push({ kind: "photo", url: st.photo, fade: 62 });
  const imgs = [], files = [];
  for (let i = 0; i < want.length; i++) {
    const w = want[i];
    const sz = await p3ImgSize(w.url);
    if (!sz) continue;
    const m = /^data:image\/([a-z0-9+]+)/i.exec(w.url);
    const ext = m ? (m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase()) : "png";
    const file = base + "-" + (w.kind === "map" ? "MAP" : "AERIAL") + "." + ext;
    imgs.push({ kind: w.kind, file, pxW: sz.w, pxH: sz.h, fade: w.fade });
    files.push({ name: file, url: w.url });
  }
  p3SaveBlob(new Blob([p3Dxf(st, job, { imgs })], { type: "application/dxf" }), base + "-PLAN.dxf");
  for (let i = 0; i < files.length; i++) {
    const b = await (await fetch(files[i].url)).blob();
    await new Promise((r) => setTimeout(r, 350));   // เบราว์เซอร์บล็อกถ้ายิงดาวน์โหลดรัวเกินไป
    p3SaveBlob(b, files[i].name);
  }
  return files.length;
}

/* ── ส่งออกทั้งชุดแบบในคราวเดียว ──
   แผ่นที่ 1 ผัง · 2 SLD · 3 รูปถ่ายจุดติดตั้ง · 4 ต่อสาย DC · 5 วัสดุหน้างาน
   photos = [{ dataUrl | url, caption }] จาก jobPhotos ในระบบ (หน้าจอเป็นคนส่งมาให้)
   ไฟล์รูปดาวน์โหลดตามมาด้วย ต้องเก็บไว้โฟลเดอร์เดียวกับ .dxf ไม่งั้นรูปจะหาย */
const p3ImgExt = (url) => {
  const m = /^data:image\/([a-z0-9+]+)/i.exec(url || "");
  if (!m) return "jpg";
  const e = m[1].toLowerCase();
  return e === "jpeg" ? "jpg" : e;
};
/* เตรียมรูปทั้งหมดของชุดแบบ (โหลดขนาดจริงของแต่ละรูป) — ทำครั้งเดียว
   ใช้ได้ทั้งตอนดูตัวอย่างบนจอและตอนโหลดไฟล์จริง จะได้ไม่ต้องโหลดซ้ำ */
async function p3PrepSet(st, job, photos) {
  const base = (job && (job.code || job.name)) || "plan3d";
  const files = [];                          // ไฟล์รูปที่ต้องดาวน์โหลดตามไปด้วย

  const want = [];
  if (st.baseMap && st.baseMap.url) want.push({ kind: "map", url: st.baseMap.url, fade: 78, tag: "MAP" });
  if (st.photo) want.push({ kind: "photo", url: st.photo, fade: 62, tag: "AERIAL" });
  const imgs = [];
  for (let i = 0; i < want.length; i++) {
    const w = want[i], sz = await p3ImgSize(w.url);
    if (!sz) continue;
    const file = base + "-" + w.tag + "." + p3ImgExt(w.url);
    imgs.push({ kind: w.kind, file, href: w.url, pxW: sz.w, pxH: sz.h, fade: w.fade });
    files.push({ name: file, url: w.url });
  }

  const ph = [], src = (photos || []).slice(0, P3_PHOTO_MAX);
  for (let i = 0; i < src.length; i++) {
    const u = src[i].dataUrl || src[i].url;
    if (!u) continue;
    const sz = await p3ImgSize(u);
    if (!sz) continue;
    const file = base + "-PHOTO-" + (i + 1) + "." + p3ImgExt(u);
    ph.push({ file, href: u, pxW: sz.w, pxH: sz.h,
      caption: String(src[i].caption || "").trim() || ("จุดติดตั้งที่ " + (i + 1)) });
    files.push({ name: file, url: u });
  }

  /* ออกเฉพาะแผ่นผังติดตั้ง — แผ่น SLD · รูปถ่าย · ต่อสาย DC · วัสดุหน้างาน
     โค้ดยังอยู่ครบ (p3Sld · p3PhotoSheet · p3DcSheet · p3EquipSheet) แค่ไม่ได้ใส่ในชุดที่ออก
     make(svg) คืนไฟล์ DXF หรือ SVG (ตัวอย่างบนจอ) จากโค้ดวาดชุดเดียวกัน */
  const sheets = [{
    key: "PLAN", label: "ผังติดตั้ง", no: "1/1",
    file: base + "-PLAN.dxf",
    make: (svg) => p3Dxf(st, job, { imgs, sheetNo: "1/1", svg: !!svg }),
  }];
  return { base, sheets, files, st, job };
}

/* ส่งออกทั้งชุด — prep = ผลจาก p3PrepSet (ส่งมาได้ถ้าเตรียมไว้แล้วตอนดูตัวอย่าง) */
async function p3ExportSet(st, job, photos, prep) {
  const P = prep || await p3PrepSet(st, job, photos);
  for (let i = 0; i < P.sheets.length; i++) {
    p3SaveBlob(new Blob([P.sheets[i].make(false, st)], { type: "application/dxf" }), P.sheets[i].file);
    await new Promise((r) => setTimeout(r, 350));   // เบราว์เซอร์บล็อกถ้ายิงดาวน์โหลดรัวเกินไป
  }
  for (let i = 0; i < P.files.length; i++) {
    const b = await (await fetch(P.files[i].url)).blob();
    await new Promise((r) => setTimeout(r, 350));
    p3SaveBlob(b, P.files[i].name);
  }
  return { sheets: P.sheets.length, files: P.files.length };
}

Object.assign(window, { Plan3DEditor, usePlan3d, P3_MEAS_KINDS, p3MeasKind, p3MeasLen,
  p3Dxf, p3Sld, p3PhotoSheet, p3EquipSheet, p3DcSheet, p3SldModel, p3SldFields, p3SldApply, p3SheetInfo,
  p3ExportPlan, p3PrepSet, p3ExportSet, p3SaveBlob });
