/* ============================================================
   flash+solar — วางแผง 3D (Plan 3D)
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
/* หลังคาทุกผืนใช้สีเดียวกัน — บ้านหลังเดียวกันคนละสีทำให้ภาพ 3D ดูเป็นคนละหลัง
   (งานเก่าที่บันทึก roof.color ไว้คนละสี จะถูกวาดทับด้วยสีนี้ทั้งหมด) */
const P3_ROOF_COLOR = "#94A3B8";

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

/* สรุปแบบ 3D ที่บันทึกไว้ ให้ที่อื่นหยิบไปใช้ได้ — จำนวนแผงบนผังคือตัวเลขที่จริงที่สุดที่เรามี
   คืน null ถ้ายังไม่ได้วางแผงสักแผง (จะได้ไม่ต้องขึ้นปุ่มดึงให้เกะกะ) */
function p3PlanSummary(saved) {
  if (!saved || !Array.isArray(saved.roofs) || !saved.roofs.length) return null;
  const panels = p3CountAll(saved);
  if (!panels) return null;
  const wp = +saved.wp || 650;
  const sys = saved.sys || {};
  return {
    panels: panels, wp: wp,
    kwp: Math.round(panels * wp / 10) / 100,
    panelModel: String(sys.panelModel || "").trim(),
    invModel: String(sys.invModel || "").trim(),
    /* งานสองขนาด — ผู้เรียกที่สนใจแค่รุ่นหลักก็อ่าน invModel เหมือนเดิมได้ ของเดิมไม่กระทบ */
    inv2Model: String(sys.inv2Model || "").trim(),
    inv2Count: Math.max(0, Math.round(+sys.inv2Count || 0)),
  };
}

/* การจัดวางแผงเป็น "แผง/ราง × จำนวนแนวราง" สำหรับ BOQ (ถอดราง/แคล้ม/L-FEET)
   รางวิ่งตั้งฉากกับด้านยาวของแผงเสมอ (แคล้มจับด้านยาว) ความยาวรางต่อแผงจึงเท่าด้านสั้นทั้งสองแบบ
   · แผงแนวตั้ง → รางวิ่งตามแถว (ซ้าย–ขวา) นับแผงที่เรียงกันในแถวเดียว
   · แผงแนวนอน → รางวิ่งตามคอลัมน์ (ขึ้นตามลาด) นับแผงที่เรียงกันในคอลัมน์เดียว
   ตัดแนวรางเมื่อ: ข้ามฝั่งหลังคา (จั่ว/ปั้นหยาแต่ละผืน) · ข้ามชุดแผง · ข้ามทางเดินของชุดที่แบ่งกลุ่มย่อย
   · มีแผงที่แตะเว้นไว้ตรงกลาง — หน้างานคือรางคนละเส้นทั้งหมด
   คืน { rows:[{panels,count,orient}] เรียงแนวยาวก่อน, total } หรือ null ถ้ายังไม่มีแผง */
function p3RailRows(saved) {
  if (!saved || !Array.isArray(saved.roofs) || !saved.roofs.length) return null;
  const runs = {};   // "แนวแผง|แผงต่อแนวราง" → จำนวนแนวราง
  let total = 0;
  saved.roofs.forEach((roof, ri) => {
    let res = null;
    try { res = p3Panels(roof); } catch (e) { res = null; }
    if (!res) return;
    const lines = {};
    (res.list || []).forEach((p) => {
      if (!p || p.skip || p.slot) return;
      const mm = /^(.*?)(-?\d+)_(-?\d+)$/.exec(String(p.key || ""));
      if (!mm) return;
      const B = (res.blocks || [])[p.blk || 0] || {};
      const land = B.orient === "landscape";
      const r = +mm[2], c = +mm[3];
      const along = land ? r : c, across = land ? c : r;
      const lk = ri + "|" + (p.blk || 0) + "|" + (p.side || "") + "|" + mm[1] + "|" + across;
      (lines[lk] = lines[lk] || { land, B, pos: [] }).pos.push(along);
    });
    Object.keys(lines).forEach((lk) => {
      const L = lines[lk], B = L.B;
      const ps = L.pos.sort((a, b) => a - b);
      // ทางเดินตามทิศราง: แนวตั้งตัดทุก gc คอลัมน์ · แนวนอนตัดทุก gr แถว (เฉพาะตอนเว้นทางเดินจริง)
      const g = +B.gg > 0 ? +(L.land ? B.gr : B.gc) || 0 : 0;
      const grp = (x) => (g > 0 ? Math.floor(x / g) : 0);
      const ori = L.land ? "landscape" : "portrait";
      let len = 1;
      for (let i = 1; i <= ps.length; i++) {
        if (i < ps.length && ps[i] === ps[i - 1]) continue;   // ช่องซ้ำ (ไม่ควรเกิด) ไม่นับสองรอบ
        if (i < ps.length && ps[i] === ps[i - 1] + 1 && grp(ps[i]) === grp(ps[i - 1])) { len++; continue; }
        const k = ori + "|" + len;
        runs[k] = (runs[k] || 0) + 1; total += len; len = 1;
      }
    });
  });
  if (!total) return null;
  const rows = Object.keys(runs).map((k) => ({ panels: +k.split("|")[1], count: runs[k], orient: k.split("|")[0] }))
    .sort((a, b) => (a.orient === b.orient ? b.panels - a.panels : a.orient === "portrait" ? -1 : 1));
  return { rows: rows, total: total };
}

/* ย้ายแบบ 3D ตามไปกับงาน — ลูกค้าที่แปลงเป็นงานติดตั้งจะได้เลข id ใหม่
   ถ้าไม่ย้าย แบบที่ปั้นไว้ตอนยังเป็นงานขายจะหายไปเงียบ ๆ เหมือนไม่เคยทำ */
function movePlan3d(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return Promise.resolve();
  if (!window.FBDB) {
    try {
      const v = localStorage.getItem("sf_plan3d_" + fromId);
      if (v) { localStorage.setItem("sf_plan3d_" + toId, v); localStorage.removeItem("sf_plan3d_" + fromId); }
    } catch (e) {}
    return Promise.resolve();
  }
  return window.FBDB.ref("plan3d/" + fromId).once("value").then((s) => {
    const v = s.val();
    if (!v) return null;
    return window.FBDB.ref("plan3d/" + toId).set(v).then(() => window.FBDB.ref("plan3d/" + fromId).remove());
  }).catch(() => null);
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
    orient: "portrait", rows: 0, cols: 0, gap: 0.03, margin: 0.3, skips: {} };
}
/* หลังคาจั่ว: สันหลังคากลาง ลาด 2 ด้าน (A หันทิศ az, B หันตรงข้าม) */
function p3NewGable(n) {
  return { id: p3Id("r"), kind: "gable", name: "หลังคา " + n, x: 0, z: 0, ridge: 8, span: 8, pitch: 20, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.03, margin: 0.3, skips: {}, sideA: true, sideB: true };
}
/* หลังคาปั้นหยา: 4 ผืนลาดชนสันกลาง (คางหมู A/B + สามเหลี่ยม C/D) — ผืนต่อกันสนิทอัตโนมัติ */
function p3NewHip(n) {
  return { id: p3Id("r"), kind: "hip", name: "หลังคา " + n, x: 0, z: 0, w: 10, d: 7, pitch: 30, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.03, margin: 0.3, skips: {},
    sideA: true, sideB: true, sideC: false, sideD: false };
}
/* หลังคาโดม: ผิวโค้งส่วนโค้งวงกลม (arch) ยืดยาวไปตามแนวสัน — ใช้กับโรงจอดรถ/โรงงาน/ทางเดินโดม */
function p3NewDome(n) {
  return { id: p3Id("r"), kind: "dome", name: "หลังคา " + n, x: 0, z: 0, ridge: 12, span: 10, rise: 2.5, az: 180, h: 3.2,
    color: P3_ROOF_COLOR,
    orient: "portrait", rows: 0, cols: 0, gap: 0.03, margin: 0.3, skips: {}, maxTilt: 90 };
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
    } else {
      /* หลังคาทรงอื่น (ราบ/เพิง/จั่ว/ปั้นหยา) — เดิมไม่วาดขอบเลย ผังรายงานเห็นแต่แผงลอย ๆ
         ไม่มีหลังคาใต้แผง · ใช้ผิวผืนชุดเดียวกับตัวคำนวณเงา (มองจากบน = ทิ้งแกน y) ผืนละรูป
         (โดมไม่มีผิวผืน ไม่วาดขอบ — แผงโค้งเห็นรูปหลังคาอยู่แล้ว) */
      let surfs = [];
      try { surfs = typeof p3RoofSurf === "function" ? p3RoofSurf(roof) : []; } catch (e) { surfs = []; }
      surfs.forEach((sf) => outlines.push({ roofId: roof.id, pts: sf.pts.map((q) => [q.x, q.z]) }));
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
    gap: b.gap == null ? 0.03 : Math.max(0, +b.gap),
    /* ขนาดแผงจริงของรุ่นที่เลือก (ม.) — ผืนที่ยังไม่ได้เลือกรุ่นจะเป็น 0 แล้วถอยไปใช้ขนาดมาตรฐาน
       ผังเก่าทุกใบจึงวางเหมือนเดิมเป๊ะ จนกว่าจะเลือกรุ่นแผง */
    panelW: +b.panelW > 0 ? +b.panelW : 0,
    panelL: +b.panelL > 0 ? +b.panelL : 0,
    du: +b.du || 0, dv: +b.dv || 0,                       // เลื่อนบล็อก (ม.) ตามแกนผิวหลังคา
    rot: +b.rot || 0,                                     // หมุนบล็อก (°) เทียบผืน
    /* แบ่งเป็นกลุ่มย่อยแล้วเว้นทางเดิน — 0 = ไม่แบ่ง (ของเก่าทุกงานจึงวางเหมือนเดิมเป๊ะ) */
    gc: Math.max(0, Math.round(+b.gc || 0)),              // กี่คอลัมน์ต่อกลุ่ม
    gr: Math.max(0, Math.round(+b.gr || 0)),              // กี่แถวต่อกลุ่ม
    gg: Math.max(0, +b.gg || 0),                          // ทางเดินระหว่างกลุ่ม (ม.)
    keep: b.keep === true,                                // หมุนแล้วคงรูปสี่เหลี่ยม ไม่ตัดตามขอบหลังคา
    tilt: Math.max(0, Math.min(60, +b.tilt || 0)),        // ขาตั้งเอียง (°) ยกแผงจากผิวหลังคา
    skips: b.skips || {}, adds: b.adds || {},
    /* โซน = ด้านของหลังคา (A/B/C/D) — มีค่า = ชุดนี้วางเฉพาะด้านนั้น · ว่าง = ทุกด้าน (ของเก่าทุกงาน) */
    face: typeof b.face === "string" && b.face ? b.face : null,
    /* ชุดแบบ "เฉพาะที่วาง" (ตัวแก้แบบใหม่ ลากกรอบวางแผง) — patch = true แล้วมีแผงเฉพาะช่องใน only {key:true}
       ช่องนอกนั้นไม่สร้างเลย (ไม่ใช่ปิดไว้) ผังจึงไม่ต้องวาดช่องเป็นพัน · ไม่มี patch = เต็มผืนแบบเดิม */
    patch: b.patch === true,
    only: b.patch === true && b.only && typeof b.only === "object" ? b.only : {},
  };
}
function p3Blocks(roof) {
  const bs = Array.isArray(roof.blocks) && roof.blocks.length
    ? roof.blocks
    : [{ id: "b0", orient: roof.orient, rows: roof.rows, cols: roof.cols, gap: roof.gap, skips: roof.skips, adds: roof.adds }];
  /* ขนาดแผงเป็นของทั้งผืน (มาจากรุ่นที่เลือก) บล็อกในผืนเดียวกันใช้แผงรุ่นเดียวกันเสมอ */
  return bs.map((b, i) => p3NormBlk(Object.assign({}, b, { panelW: roof.panelW, panelL: roof.panelL }), i));
}
function p3NewBlk(i) {
  return { id: p3Id("pb"), orient: "portrait", rows: 0, cols: 0, gap: 0.03, du: 0, dv: 0, rot: 0, tilt: 0, skips: {}, adds: {} };
}
/* ── มุมหมุนของ "ตัวแผงแต่ละแผ่น" (เรเดียน) ให้ตรงกับแนวแถวที่กริดหมุนไป ──
   กริดหมุนในพิกัดผิว (u,v) ด้วยมุม +rot เสมอ แต่ตัวแผงหมุนรอบแกนตั้งฉากผิวใน basis ของ renderer
   ทรงสี่เหลี่ยม/จั่ว/ปั้นหยา basis เป็น (x, y, z) ของโลก → ต้องใส่ −rot ถึงจะไปทางเดียวกับกริด
   ทรงอิสระ (poly) basis เป็น (u, n, −v) ซึ่งสลับมือ → เครื่องหมายต้องกลับเป็น +rot
   เดิมใช้ −rot ทั้งคู่ ทรงอิสระเลยหมุนสวนทางกริด ผิดไป 2 เท่าของมุมที่ตั้ง
   ผลคือแผงเรียงเฉียงแต่ตัวแผงหันคนละทาง ขอบชุดออกมาเป็นฟันเลื่อย */
const p3BlkRy = (roof, blk) => (roof && roof.kind === "poly" ? 1 : -1) * (+(blk && blk.rot) || 0) * P3_DEG;
/* ด้านสั้น/ด้านยาวของแผง — ใช้ขนาดจริงของรุ่นที่เลือก ถ้ายังไม่ได้เลือกค่อยใช้ขนาดมาตรฐาน */
const p3PanShort = (b) => (b && +b.panelW > 0 ? +b.panelW : P3_PANEL_SHORT);
const p3PanLong = (b) => (b && +b.panelL > 0 ? +b.panelL : P3_PANEL_LONG);
const p3BlkPW = (b) => (b.orient === "portrait" ? p3PanShort(b) : p3PanLong(b));
const p3BlkPD = (b) => (b.orient === "portrait" ? p3PanLong(b) : p3PanShort(b));

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
  /* ชุดเฉพาะที่วาง (patch): ทางเดินแบ่งกลุ่มนับจากแถว/คอลัมน์แรกของชุดเอง ไม่ใช่จากขอบหลังคา
     (ไม่งั้นกลุ่ม 13 แถวที่วางกลางหลังคาโดนทางเดินผ่ากลาง) — ชุดเต็มผืนเหมือนเดิม */
  let pr0 = 0, pc0 = 0;
  if (blk.patch && blk.only) {
    const pre = blk.pfx + face.keyPfx; let mr = Infinity, mc = Infinity;
    Object.keys(blk.only).forEach((k) => { if (k.indexOf(pre) !== 0) return; const mm = /^(-?\d+)_(-?\d+)$/.exec(k.slice(pre.length)); if (mm) { mr = Math.min(mr, +mm[1]); mc = Math.min(mc, +mm[2]); } });
    if (mr < Infinity) { pr0 = mr; pc0 = mc; }
  }
  const vSg = face.anchor === "topLeft" ? -1 : 1;
  const dU = (c) => (gc > 0 && gg > 0 ? Math.floor((c - pc0) / gc) * gg - offU(c) : 0);
  const dV = (r) => (gr > 0 && gg > 0 ? (Math.floor((r - pr0) / gr) * gg - offV(r)) * vSg : 0);
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
    const key = blk.pfx + face.keyPfx + r + "_" + c;
    if (blk.patch && !blk.only[key]) return false;
    const p0 = { u: cellU(c) + dU(c), v: cellV(r) + dV(r) }, p = xf(p0.u, p0.v);
    if (!fits(p.u, p.v, mode)) return false;
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
  if (!want || !want.slots || blk.patch) return res;   // ชุดเฉพาะที่วาง: เติมด้วยการลากกรอบ ไม่มีช่องให้แตะ
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
  let res = p3WalkCut(roof, p3PanelsCalc(roof, want));
  // noPanel = วาดหลังคาแล้วแต่ยังไม่วางแผง (ตัวแก้แบบใหม่ — ผู้ใช้กด "วางแผงเต็มหลังคา" เอง)
  if (roof.noPanel) res = Object.assign({}, res, { list: [], count: 0, countA: 0, countB: 0, countC: 0, countD: 0,
    perBlk: (res.perBlk || []).map((b) => Object.assign({}, b, { count: 0 })) });
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
          if (blk.patch && !blk.only[key]) continue;
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
      if (blk.face && face.side && blk.face !== face.side) return;
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
/* ── ทางเดินที่วาดบนหลังคา (roof.walks) ──
   roof.walks = [{ id, w: กว้าง (ม.), pts:[{x,z}] พิกัดผังเทียบจุดตั้ง (roof.x, roof.z) }]
   แผง/ช่องว่างที่รอยเท้าบนผังแตะแถบทางเดิน ถูกเอาออกจากผังเลย (ไม่ใช่ "ปิดไว้") — นับแผง/BOQ ตรงเสมอ
   ผืนที่ไม่มี walks ได้ผลเท่าเดิมทุกตัวอักษร */
function p3SegDist(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
  const t = L2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}
function p3SegCross(a, b, c, d) {
  const cr = (o, p, q) => (p.x - o.x) * (q.z - o.z) - (p.z - o.z) * (q.x - o.x);
  const d1 = cr(c, d, a), d2 = cr(c, d, b), d3 = cr(a, b, c), d4 = cr(a, b, d);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
/* ระยะจากเส้น a→b ถึงสี่เหลี่ยมนูน q (0 = ทับ/ตัดกัน) */
function p3SegQuadDist(a, b, q) {
  if (p3InPoly(a.x, a.z, q) || p3InPoly(b.x, b.z, q)) return 0;
  let d = 1e9;
  for (let i = 0; i < q.length; i++) {
    const c = q[i], e = q[(i + 1) % q.length];
    if (p3SegCross(a, b, c, e)) return 0;
    d = Math.min(d, p3SegDist(c, a, b), p3SegDist(a, c, e), p3SegDist(b, c, e));
  }
  return d;
}
function p3WalkCut(roof, out) {
  const walks = Array.isArray(roof.walks) ? roof.walks.filter((w) => w && Array.isArray(w.pts) && w.pts.length >= 2 && +w.w > 0) : [];
  // roof.obs = รอยของสิ่งบดบังบนหลังคา (ลูกหมุน/ปล่องควัน/ช่องแสง) สัมพัทธ์กับ roof.x/z — ตัวแก้แบบใหม่เขียนให้เอง (p3sSyncObs)
  const ox = +roof.x || 0, oz = +roof.z || 0, segs = [];
  const keepOut = (Array.isArray(roof.obs) ? roof.obs : []).filter((k) => k && Array.isArray(k.pts) && k.pts.length >= 3)
    .map((k) => k.pts.map((p) => ({ x: ox + (+p.x || 0), z: oz + (+p.z || 0) })));
  if ((!walks.length && !keepOut.length) || !out || !out.list || !out.list.length) return out;
  walks.forEach((w) => {
    for (let i = 1; i < w.pts.length; i++) {
      segs.push({ a: { x: ox + (+w.pts[i - 1].x || 0), z: oz + (+w.pts[i - 1].z || 0) }, b: { x: ox + (+w.pts[i].x || 0), z: oz + (+w.pts[i].z || 0) }, hw: +w.w / 2 });
    }
  });
  const blocks = out.blocks || [];
  const X = p3Xf(roof, out);
  const keep = [];
  out.list.forEach((p) => {
    const blk = blocks[p.blk] || { rot: 0, tilt: 0 };
    const ry = p3BlkRy(roof, blk), T = (+blk.tilt || 0) * P3_DEG;
    const c0 = roof.kind === "dome" || roof.kind === "poly" ? { x: p.x, y: p.y || 0, z: p.z } : { x: p.x, y: 0, z: p.z };
    const cw = X.world(X.chain(p.side, c0, false), false);
    let U, V;
    if (roof.kind === "poly" && out.plane) {
      const P = out.plane, cr = Math.cos(ry), sr = Math.sin(ry), cT = Math.cos(T), sT = Math.sin(T);
      const mix = (a, b, c) => ({ x: a * P.u.x + b * P.n.x - c * P.v.x, z: a * P.u.z + b * P.n.z - c * P.v.z });
      U = mix(cr * p.pw / 2, 0, -sr * p.pw / 2);
      V = mix(cT * sr * p.pd / 2, -sT * p.pd / 2, cT * cr * p.pd / 2);
    } else if (roof.kind === "dome") {
      U = X.world(X.chain(null, { x: p.pw / 2, y: 0, z: 0 }, true), true);
      V = X.world(X.chain(null, X.RX({ x: 0, y: 0, z: p.pd / 2 }, p.rx || 0), true), true);
    } else {
      U = X.world(X.chain(p.side, X.RY({ x: p.pw / 2, y: 0, z: 0 }, ry), true), true);
      V = X.world(X.chain(p.side, X.RY(X.RX({ x: 0, y: 0, z: p.pd / 2 }, T), ry), true), true);
    }
    const q = [{ x: cw.x - U.x - V.x, z: cw.z - U.z - V.z }, { x: cw.x + U.x - V.x, z: cw.z + U.z - V.z },
               { x: cw.x + U.x + V.x, z: cw.z + U.z + V.z }, { x: cw.x - U.x + V.x, z: cw.z - U.z + V.z }];
    const hitObs = keepOut.some((K) => p3InPoly(cw.x, cw.z, K) || K.some((a, i) => p3SegQuadDist(a, K[(i + 1) % K.length], q) < 1e-6));
    if (!hitObs && !segs.some((s) => p3SegQuadDist(s.a, s.b, q) < s.hw)) { keep.push(p); return; }
    if (!p.skip && !p.slot) {
      out.count--;
      if (out.perBlk && out.perBlk[p.blk || 0]) out.perBlk[p.blk || 0].count--;
      if (p.side && out["count" + p.side] != null) out["count" + p.side]--;
      out.walkCut = (out.walkCut || 0) + 1;
    }
  });
  out.list = keep;
  return out;
}
function p3CountAll(st) { return (st.roofs || []).reduce((s, r) => s + p3Panels(r).count, 0); }

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

/* ── เลือกรุ่นแผงจากคลังสินค้า ──
   พิมพ์วัตต์เองแล้วมันไม่ผูกกับของจริง เลข kWp ในผังกับที่สั่งของจะคนละตัวได้ง่าย ๆ
   เลือกจากคลังแล้วกำลังแผงมาเอง และผูกรุ่นไว้กับผังเลย หน้าออกแบบระบบ/BOQ จะได้ใช้รุ่นเดียวกัน */
function P3PanelPick({ model, onPick }) {
  const list = (window.BOQ && window.BOQ.PANELS) || [];
  /* จัดตามหมวดย่อยที่ตั้งไว้ในคลัง (AIKO / JINKO / LONGI …) รุ่นที่ยังไม่จัดหมวดไปกองท้ายสุด */
  const groups = [];
  list.forEach((x) => {
    const g = String(x.group || "").trim();
    let e = groups.find((y) => y.g === g);
    if (!e) groups.push(e = { g: g, list: [] });
    e.list.push(x);
  });
  groups.sort((a, b) => (a.g ? 0 : 1) - (b.g ? 0 : 1));
  const opt = (x) => <option key={x.model} value={x.model}>{x.model} ({x.wp}W)</option>;
  return (
    <label className="p3-f">
      <span className="lb">รุ่นแผง (จากคลังสินค้า)</span>
      <select className="p3-inp" value={model || ""} onChange={(e) => onPick(e.target.value)}>
        <option value="">— กรอกกำลังแผงเอง —</option>
        {groups.length === 1 && !groups[0].g
          ? list.map(opt)
          : groups.map((x) => (
            <optgroup key={x.g || "_etc"} label={x.g || "ยังไม่จัดหมวดย่อย"}>{x.list.map(opt)}</optgroup>
          ))}
      </select>
    </label>
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
  const phase = +sys.phases || (job ? window.SF.phaseOf(job) : 1);
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
    /* รุ่นที่สองของงานเดียวกัน — ว่าง = รุ่นเดียวทั้งงาน (ท่าเดียวกับ BOQ กับหน้าวางแผง)
       ต้องรู้จักที่นี่ด้วย ไม่งั้นแผนภาพไฟฟ้าจะวาดตัวที่สองหายไปทั้งที่ของจริงมี */
    const iv2 = sys.inv2Model && sys.inv2Model !== sys.invModel
      ? (B.INVERTERS || []).find((x) => x.model === sys.inv2Model) : null;
    const n2 = iv2 ? Math.max(0, Math.round(+sys.inv2Count || 0)) : 0;
    const kw2 = iv2 ? (+iv2.kw || kw) : 0;
    unitW = kw * 1000;
    inv = { model: iv.model || "INVERTER", count: n + n2, w: unitW, v: Vll, spec: iv,
      model2: iv2 ? iv2.model : "", count2: n2, w2: kw2 * 1000, spec2: iv2 || null };
    /* กระจายแผงตามกำลังของแต่ละตัว ไม่ใช่หารเท่ากัน — ตัวใหญ่ต้องรับแผงมากกว่าตัวเล็ก */
    const kwEach = [];
    for (let i = 0; i < n; i++) kwEach.push(kw);
    for (let i = 0; i < n2; i++) kwEach.push(kw2);
    const kwSum = kwEach.reduce((a, b) => a + b, 0) || 1;
    let leftP = nPanel;
    kwEach.forEach((k, i) => {
      const share = i === kwEach.length - 1 ? leftP : Math.round(nPanel * k / kwSum);
      leftP -= share;
      units.push({ panels: Math.max(0, share), phase: 1, w: k * 1000, from: i < n ? 1 : 2 });
    });
  }
  inv.brand = p3Brand(inv.model, (job && job.brand) || "");
  const unitA = unitW / ((micro ? (inv.v || 230) : Vll) * (micro ? 1 : kPh));
  /* กระแสของ "ตัวนั้น ๆ" — งานสองรุ่นกำลังต่อตัวไม่เท่ากัน จะใช้ค่าเดียวคูณทั้งระบบไม่ได้ */
  const aOfUnit = (u) => (+u.w > 0 ? +u.w : unitW) / ((micro ? (inv.v || 230) : Vll) * (micro ? 1 : kPh));

  /* ── แบ่งวงจรย่อยเข้าตู้รวม ── */
  const perBr = micro ? Math.max(1, Math.round(+((inv.spec || {}).perBranch) || 2)) : 1;
  const nBr = Math.min(6, Math.max(1, Math.ceil(units.length / perBr)));
  const branches = [];
  let taken = 0;
  for (let i = 0; i < nBr; i++) {
    const cnt = Math.floor(units.length / nBr) + (i < units.length % nBr ? 1 : 0);
    const mine = units.slice(taken, taken + cnt); taken += cnt;
    const I = micro ? cnt * unitA : mine.reduce((a, u) => a + aOfUnit(u), 0);
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

Object.assign(window, { usePlan3d, movePlan3d, p3PlanSummary, p3RailRows, P3_MEAS_KINDS, p3MeasKind, p3MeasLen,
  p3Dxf, p3Sld, p3PhotoSheet, p3EquipSheet, p3DcSheet, p3SldModel, p3SldFields, p3SldApply, p3SheetInfo,
  p3ExportPlan, p3PrepSet, p3ExportSet, p3SaveBlob });
