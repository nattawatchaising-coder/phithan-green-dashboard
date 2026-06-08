/* ============================================================
   SolarFlow — Calendar (appointments) + Map (job locations)
   ============================================================ */

function CalendarView({ jobs, onOpen }) {
  const [ym, setYm] = React.useState({ y: 2026, m: 5 }); // June 2026 (0-indexed)
  const first = new Date(ym.y, ym.m, 1);
  const startDow = first.getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const jobsOn = (d) => {
    const key = ym.y + "-" + String(ym.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    return jobs.filter((j) => j.deadline === key);
  };
  const todayKey = window.SF.TODAY;
  const shift = (delta) => setYm((s) => { const n = new Date(s.y, s.m + delta, 1); return { y: n.getFullYear(), m: n.getMonth() }; });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
            {["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][ym.m]} {ym.y + 543}
          </h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>· {jobs.filter((j) => j.deadline.startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length} นัด</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavBtn dir="prev" onClick={() => shift(-1)} />
          <NavBtn dir="next" onClick={() => shift(1)} />
        </div>
      </div>
      <FlowLegend />
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "0 -4px", padding: "0 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, minWidth: 490 }}>
        {window.TH_DAYS.map((d, i) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)", paddingBottom: 4 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const list = jobsOn(d);
          const key = ym.y + "-" + String(ym.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
          const isToday = key === todayKey;
          return (
            <div key={i} style={{ minHeight: 104, borderRadius: 12, border: "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
              background: isToday ? "var(--primary-soft)" : "var(--surface2)", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-dark)" : "var(--text-2)" }}>{d}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                {list.slice(0, 2).map((j) => {
                  const s = stageOf(j.stage);
                  const c = j.delayed ? "#EF4444" : s.color;
                  return (
                    <button key={j.id} onClick={() => onOpen(j)} title={j.name + " · " + s.th}
                      style={{ display: "flex", gap: 6, background: s.soft, border: "none", borderRadius: 7,
                        padding: "4px 6px", cursor: "pointer", fontFamily: "inherit", width: "100%", overflow: "hidden", textAlign: "left" }}>
                      <span style={{ width: 3, alignSelf: "stretch", borderRadius: 99, background: c, flexShrink: 0 }} />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name.replace("คุณ", "")}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                          <span style={{ width: 5, height: 5, borderRadius: 99, background: c, flexShrink: 0 }} />
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: j.delayed ? "#EF4444" : s.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.delayed ? "⚠ " + s.th : s.th}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
                {list.length > 2 && <span style={{ fontSize: 10, color: "var(--text-3)", paddingLeft: 4 }}>+{list.length - 2} งาน</span>}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

function FlowLegend() {
  const SF = window.SF;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "10px 14px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, letterSpacing: ".03em" }}>
        <Icon name="flow" size={14} color="var(--primary)" /> Flow การทำงาน:
      </span>
      {SF.STAGES.map((s, i) => (
        <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />{i + 1}. {s.th}
        </span>
      ))}
    </div>
  );
}

function NavBtn({ dir, onClick }) {
  return (    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)",
      cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
      <Icon name="chevronRight" size={17} style={{ transform: dir === "prev" ? "rotate(180deg)" : "none" }} />
    </button>
  );
}

function MapView({ jobs, onOpen }) {
  const mapDiv = React.useRef(null);
  const mapObj = React.useRef(null);
  const layer = React.useRef(null);
  const LATLNG = window.SF.PROVINCE_LATLNG;

  const byProvince = React.useMemo(() => {
    const m = {};
    jobs.forEach((j) => { (m[j.province] = m[j.province] || []).push(j); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [jobs]);

  const latlngOf = React.useCallback((j) => {
    const base = LATLNG[j.province] || [13.7, 100.6];
    const seed = parseInt((j.code || "").replace(/\D/g, ""), 10) || 0;
    const dlat = (((seed % 7) - 3) * 0.018);
    const dlng = ((((seed * 3) % 7) - 3) * 0.018);
    return [base[0] + dlat, base[1] + dlng];
  }, [LATLNG]);

  const [openProv, setOpenProv] = React.useState(null);
  const flyToProv = React.useCallback((prov) => {
    const ll = LATLNG[prov];
    if (ll && mapObj.current) mapObj.current.flyTo(ll, 10, { duration: 0.7 });
  }, [LATLNG]);
  const focusJob = React.useCallback((j) => {
    if (mapObj.current) mapObj.current.flyTo(latlngOf(j), 12, { duration: 0.7 });
    onOpen(j);
  }, [latlngOf, onOpen]);

  // init the map once
  React.useEffect(() => {
    if (!window.L || mapObj.current || !mapDiv.current) return;
    const map = window.L.map(mapDiv.current, { scrollWheelZoom: true, zoomControl: true }).setView([14.2, 100.6], 6);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layer.current = window.L.layerGroup().addTo(map);
    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 250);
    return () => { map.remove(); mapObj.current = null; layer.current = null; };
  }, []);

  // (re)draw markers when jobs change
  React.useEffect(() => {
    const map = mapObj.current;
    if (!map || !layer.current) return;
    layer.current.clearLayers();
    const pts = [];
    jobs.forEach((j) => {
      const ll = latlngOf(j);
      pts.push(ll);
      const color = j.problem ? "#EF4444" : stageOf(j.stage).color;
      const marker = window.L.circleMarker(ll, { radius: 9, color: "#fff", weight: 2.5, fillColor: color, fillOpacity: 1 });
      marker.bindTooltip(j.name + " · " + j.kw + "kW · " + stageOf(j.stage).th, { direction: "top", offset: [0, -6] });
      marker.on("click", () => onOpen(j));
      marker.addTo(layer.current);
    });
    if (pts.length) { try { map.fitBounds(pts, { padding: [50, 50], maxZoom: 11 }); } catch (e) {} }
    setTimeout(() => map.invalidateSize(), 120);
  }, [jobs, latlngOf, onOpen]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, flex: 1, minHeight: 0 }}>
      {/* real map */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
        <PanelTitle icon="map" iconColor="var(--primary)" title="แผนที่ตำแหน่งงานติดตั้ง" sub="แผนที่จริง · เลื่อน/ซูมได้ · คลิกหมุดเพื่อดูงาน" />
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "12px 0 4px" }}>
          {window.SF.STAGES.map((s) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color, border: "1.5px solid #fff", boxShadow: "0 0 0 1px " + s.color }} />{s.th}
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#EF4444" }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#EF4444" }} /> ติดปัญหา
          </span>
        </div>
        <div ref={mapDiv} style={{ flex: 1, minHeight: 460, borderRadius: 14, overflow: "hidden", marginTop: 10, border: "1px solid var(--border)", zIndex: 0 }} />
      </div>
      {/* province list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <PanelTitle icon="pin" title="งานแยกตามจังหวัด" sub={"แตะจังหวัดเพื่อโฟกัสบนแผนที่ · " + byProvince.length + " จังหวัด"} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1, minHeight: 0 }}>
          {byProvince.map(([prov, list]) => {
            const open = openProv === prov;
            const problems = list.filter((j) => j.problem || j.delayed).length;
            return (
              <div key={prov} style={{ border: "1px solid " + (open ? "var(--primary)" : "var(--border)"), borderRadius: 12, overflow: "hidden", transition: "border-color .15s", flexShrink: 0 }}>
                <button onClick={() => { setOpenProv(open ? null : prov); flyToProv(prov); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, padding: "11px 13px",
                    background: open ? "var(--primary-soft)" : "var(--surface2)", border: "none", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                    <Icon name="chevronRight" size={15} color="var(--text-3)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: open ? "var(--primary-dark)" : "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{prov}</span>
                    {problems > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>{problems}⚠</span>}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--text-2)", flexShrink: 0, whiteSpace: "nowrap" }}>{list.length} งาน</span>
                </button>
                {open && (
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 3, borderTop: "1px solid var(--border)" }}>
                    {list.map((j) => (
                      <button key={j.id} onClick={() => focusJob(j)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 8px",
                        background: "none", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: j.problem ? "#EF4444" : stageOf(j.stage).color, flexShrink: 0 }} />
                        <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                          <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{stageOf(j.stage).th}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", flexShrink: 0 }}>{j.kw}kW</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarView, MapView });
