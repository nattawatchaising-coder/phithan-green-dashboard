/* ============================================================
   flash+solar — ไซต์จาก Huawei FusionSolar (docs/fusionsolar.md)

   หน้าเว็บอ่านจากฐานข้อมูลอย่างเดียว ไม่เรียก Huawei — งานซิงก์อยู่ฝั่งเซิร์ฟเวอร์ (api/_lib/fusionsolar.mjs)
     fsSites/{siteId}    ไซต์ · ซิงก์เขียนเฉพาะฟิลด์ของ FusionSolar · ผู้ใช้เขียน jobIds note และไซต์ที่เพิ่มเอง
     fsDevices/{devId}   อุปกรณ์ (ซิงก์เขียนคนเดียว)
     fsSyncLogs/{id}     ผลแต่ละรอบ (ซิงก์เขียนคนเดียว)
     fsState             ล็อก/เวลาพัก 407/อนุมัติรอบแรก (ซิงก์เขียนคนเดียว)

   ── ผูกกับงานในเว็บ ──
   ไซต์ไม่ใช่ใบงาน: ไซต์หนึ่งมีได้หลายงาน (ติดตั้ง · ขยายระบบ) และไซต์จาก FusionSolar อาจไม่มีงานของเราเลย
   จึงเก็บแยกที่ fsSites แล้วผูกด้วย jobIds {รหัสงาน: true} — งานใน jobs/ ไม่ถูกแก้สักฟิลด์
   ทะเบียน O&M (omSites) ใช้ job.id เป็น key อยู่แล้ว ผูกงานได้ = เห็นทะเบียนบริการของงานนั้นด้วย

   ชื่อ top-level ขึ้นต้น Fs/fs/FS_ (ทุกไฟล์อยู่ scope เดียวกัน)
   ============================================================ */

/* ── ประเภทอุปกรณ์ (ชุดเดียวกับ DEV_TYPES ใน api/_lib/fusionsolar.mjs) ── */
const FS_DEV_TYPES = {
  1: "String inverter", 38: "Residential inverter", 2: "SmartLogger", 63: "SmartLogger", 62: "Smart Dongle",
  17: "Grid meter", 47: "Power meter", 39: "Battery", 41: "ESS", 46: "Optimizer",
};
const fsDevTypeTH = (t) => FS_DEV_TYPES[t] || ("ไม่ทราบประเภท (devTypeId " + t + ")");
/* ค่าที่แสดงของแต่ละกลุ่ม (สเปกข้อ 5) · กลุ่มอื่นแสดง last_kpi_json ทั้งหมดเป็นตาราง key/value */
const FS_DEV_GROUPS = [
  { key: "inv", th: "อินเวอร์เตอร์", types: [1, 38], fields: [
    ["total_cap", "ผลิตสะสม", "kWh"], ["day_cap", "ผลิตวันนี้", "kWh"], ["active_power", "กำลังไฟขณะนี้", "kW"]] },
  { key: "meter", th: "มิเตอร์", types: [17, 47], fields: [
    ["active_cap", "ซื้อไฟสะสม", "kWh"], ["reverse_active_cap", "ขายไฟสะสม", "kWh"], ["active_power", "กำลังไฟขณะนี้", "kW"],
    ["meter_u", "แรงดัน", "V"], ["meter_i", "กระแส", "A"]] },
];
const fsDevGroupOf = (t) => FS_DEV_GROUPS.find((g) => g.types.indexOf(+t) !== -1) || null;

/* สถานะไซต์ — real_health_state 1 ออฟไลน์ · 2 มีปัญหา · 3 ปกติ */
const FS_HEALTH = {
  ok:   { th: "ปกติ",                tx: "var(--tint-ok-tx)",    bg: "var(--tint-ok-bg)" },
  warn: { th: "มีปัญหา",             tx: "var(--tint-amber-tx)", bg: "var(--tint-amber-bg)" },
  off:  { th: "ออฟไลน์",             tx: "var(--text-2)",        bg: "var(--surface3)" },
  lost: { th: "ไม่พบใน FusionSolar", tx: "var(--tint-red-tx)",   bg: "var(--tint-red-bg)" },
  wait: { th: "รอข้อมูล",            tx: "var(--text-3)",        bg: "var(--surface2)" },
  none: { th: "ไม่มีข้อมูล FusionSolar", tx: "var(--text-3)",    bg: "var(--surface2)" },
};
function fsHealthKey(s) {
  if (!s || !s.fusionsolar_station_code) return "none";
  if (s.fs_status === "not_found_in_fusionsolar") return "lost";
  return { 3: "ok", 2: "warn", 1: "off" }[s.health_state] || "wait";
}

const fsNum = (v, d) => (v == null || v === "" || isNaN(+v)) ? "–"
  : (+v).toLocaleString("th-TH", { maximumFractionDigits: d == null ? 1 : d });
function fsAgo(iso) {
  const t = Date.parse(iso || "");
  if (!t) return "–";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return m + " นาทีที่แล้ว";
  if (m < 60 * 24) return Math.round(m / 60) + " ชม.ที่แล้ว";
  return new Date(t).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}
const fsWhen = (iso) => { const t = Date.parse(iso || ""); return t ? new Date(t).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "–"; };
const fsKpi = (d) => { try { return JSON.parse((d || {}).last_kpi_json || "{}") || {}; } catch (e) { return {}; } };
const fsCode = (v) => String(v || "").trim();

/* ── ตัวเก็บ ── */
function useFsNode(path, limit) {
  const [val, setVal] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!window.FBDB) { setLoading(false); return; }
    let ref = window.FBDB.ref(path);
    if (limit) ref = ref.limitToLast(limit);
    const h = ref.on("value", (s) => { setVal(s.val()); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [path, limit]);
  return { val, loading };
}
function useFsSites() {
  const { val, loading } = useFsNode("fsSites");
  const all = React.useMemo(() => Object.keys(val || {}).map((k) => Object.assign({}, val[k], { id: k })), [val]);
  /* ไซต์ที่ถูกรวมเข้าไซต์อื่นแล้ว ไม่ลบ แค่ซ่อน (merged_into) */
  const sites = React.useMemo(() => all.filter((s) => !s.merged_into), [all]);
  return { all, sites, loading };
}
/* เขียนทีละฟิลด์เสมอ — ห้าม set() ทั้งไซต์ ไม่งั้นฟิลด์ที่ซิงก์เขียนไว้หาย */
const fsPatchSite = (id, fields) => window.FBDB && window.FBDB.ref("fsSites/" + id).update(fields);

/* รวมสองไซต์: ย้ายงานที่ผูกจาก drop ไป keep · drop ไม่ถูกลบ ตั้ง merged_into ซ่อนจากรายการ */
function fsMergeSites(keep, drop, user) {
  const up = {};
  Object.keys(drop.jobIds || {}).forEach((j) => { up[keep.id + "/jobIds/" + j] = true; });
  if (drop.note) up[keep.id + "/note"] = [keep.note, drop.note].filter(Boolean).join("\n");
  Object.assign(up, {
    [drop.id + "/merged_into"]: keep.id, [drop.id + "/merged_at"]: new Date().toISOString(),
    [drop.id + "/merged_by"]: (user || {}).name || null,
  });
  return window.FBDB.ref("fsSites").update(up);
}

/* ── ชิ้นเล็ก ── */
function FsPill({ k, label }) {
  const h = FS_HEALTH[k] || FS_HEALTH.wait;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontSize: 11, fontWeight: 700,
      padding: "4px 11px", borderRadius: "var(--r-pill)", color: h.tx, background: h.bg }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: "currentColor" }} />{label || h.th}
    </span>
  );
}
function FsSrcChip({ s }) {
  const fs = s.source !== "manual";
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: "var(--r-chip)", whiteSpace: "nowrap",
      color: fs ? "var(--primary-dark)" : "var(--text-2)", background: fs ? "var(--primary-soft)" : "var(--surface2)" }}>
      {fs ? "FusionSolar" : "เพิ่มเอง"}
    </span>
  );
}
function FsStat({ label, value, unit, hint, tone, on, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ flex: "1 1 150px", textAlign: "left", padding: "14px 16px", border: "none", fontFamily: "inherit",
        borderRadius: "var(--r-tile)", background: "var(--surface)", cursor: onClick ? "pointer" : "default",
        boxShadow: on ? "inset 0 0 0 1px var(--primary), var(--shadow-sm)" : "var(--shadow-card)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: tone || "var(--text-1)", lineHeight: 1.25,
        fontVariantNumeric: "tabular-nums" }}>
        {value}{unit && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginLeft: 5 }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{hint}</div>}
    </button>
  );
}
function FsChips({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(([v, th, n]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          style={{ padding: "6px 12px", border: "none", borderRadius: "var(--r-chip)", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
            cursor: "pointer", background: value === v ? "var(--primary-soft)" : "var(--surface2)",
            color: value === v ? "var(--primary-dark)" : "var(--text-2)",
            boxShadow: value === v ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)" }}>
          {th}{n != null && <span style={{ fontFamily: "var(--mono)", fontSize: 11, marginLeft: 5, opacity: .7 }}>{n}</span>}
        </button>
      ))}
    </div>
  );
}
const FS_LBL = { fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 };
function FsSpec({ label, value, unit, mono }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "9px 12px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: mono ? "var(--mono)" : "inherit",
        fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}{unit && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}
function FsCard({ title, sub, right, children }) {
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: "14px 15px" }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 11 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>}
          <div style={{ marginLeft: "auto" }}>{right}</div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ================================================================
   หน้า "ไซต์ทั้งหมด"
   ================================================================ */
const FS_COLS = [
  { key: "name", th: "ชื่อไซต์" },
  { key: "code", th: "Station code" },
  { key: "kw", th: "kWp", num: true },
  { key: "day", th: "วันนี้ kWh", num: true },
  { key: "month", th: "เดือนนี้ kWh", num: true },
  { key: "total", th: "สะสม kWh", num: true },
  { key: "health", th: "สถานะ" },
  { key: "address", th: "ที่อยู่" },
  { key: "at", th: "อัปเดตล่าสุด" },
];
const FS_HEALTH_RANK = { off: 0, warn: 1, lost: 2, wait: 3, ok: 4, none: 5 };
const fsSortVal = (s, k) => ({
  name: (s.name || "").toLowerCase(), code: s.fusionsolar_station_code || "", kw: +s.capacity_kw || 0,
  day: +s.day_kwh || 0, month: +s.month_kwh || 0, total: +s.total_kwh || 0,
  health: FS_HEALTH_RANK[fsHealthKey(s)], address: (s.address || "").toLowerCase(),
  at: Date.parse(s.kpi_updated_at || s.last_synced_at || "") || 0,
}[k]);

function FsSitesView({ jobs, role, currentUser, onOpenJob, onOpenOm }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { sites, all, loading } = useFsSites();
  const [q, setQ] = React.useState("");
  const [health, setHealth] = React.useState("all");
  const [src, setSrc] = React.useState("all");
  const [sort, setSort] = React.useState({ k: "name", dir: 1 });
  const [open, setOpen] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const canWrite = window.can ? window.can(role, "om") : true;

  const roll = React.useMemo(() => {
    const r = { n: 0, kw: 0, day: 0, month: 0, off: 0, warn: 0, lost: 0 };
    sites.forEach((s) => {
      r.n++; r.kw += +s.capacity_kw || 0;
      if (s.fs_status !== "not_found_in_fusionsolar") { r.day += +s.day_kwh || 0; r.month += +s.month_kwh || 0; }
      const k = fsHealthKey(s); if (r[k] != null) r[k]++;
    });
    return r;
  }, [sites]);
  const hCount = React.useMemo(() => {
    const c = { all: sites.length };
    sites.forEach((s) => { const k = fsHealthKey(s); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [sites]);

  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = sites.filter((s) => {
      if (health !== "all" && fsHealthKey(s) !== health) return false;
      if (src !== "all" && (s.source === "manual" ? "manual" : "fusionsolar") !== src) return false;
      if (!kw) return true;
      return [s.name, s.fusionsolar_station_code, s.address, s.note].concat(Object.keys(s.jobIds || {}))
        .some((v) => String(v || "").toLowerCase().includes(kw));
    });
    out.sort((a, b) => {
      const x = fsSortVal(a, sort.k), y = fsSortVal(b, sort.k);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir || String(a.name).localeCompare(String(b.name), "th");
    });
    return out;
  }, [sites, q, health, src, sort]);

  const pickSort = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: FS_COLS.find((c) => c.key === k).num ? -1 : 1 }));
  const cur = all.find((s) => s.id === open) || null;
  const lastAt = sites.reduce((m, s) => Math.max(m, Date.parse(s.kpi_updated_at || "") || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <FsStat label="จำนวนไซต์" value={fsNum(roll.n, 0)} hint={lastAt ? "ข้อมูลผลิตล่าสุด " + fsAgo(new Date(lastAt).toISOString()) : "ยังไม่มีข้อมูลผลิต"} />
        <FsStat label="กำลังติดตั้งรวม" value={fsNum(roll.kw, 1)} unit="kWp" />
        <FsStat label="ผลิตวันนี้" value={fsNum(roll.day, 1)} unit="kWh" />
        <FsStat label="ผลิตเดือนนี้" value={fsNum(roll.month, 0)} unit="kWh" />
        <FsStat label="ออฟไลน์ / มีปัญหา" value={roll.off + " / " + roll.warn}
          tone={roll.off + roll.warn ? "var(--tint-amber-tx)" : null}
          hint={roll.lost ? "ไม่พบใน FusionSolar " + roll.lost + " ไซต์" : "กดเพื่อกรอง"}
          on={health === "off" || health === "warn"} onClick={() => setHealth(health === "warn" ? "off" : health === "off" ? "all" : "warn")} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
            <Icon name="search" size={15} color="var(--text-3)" />
          </span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา"
            style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "var(--r-pill)", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <FsChips value={health} onChange={setHealth} options={[["all", "ทุกสถานะ", hCount.all], ["ok", "ปกติ", hCount.ok || 0],
          ["warn", "มีปัญหา", hCount.warn || 0], ["off", "ออฟไลน์", hCount.off || 0], ["lost", "ไม่พบใน FusionSolar", hCount.lost || 0],
          ["none", "ไม่มีข้อมูล", hCount.none || 0]].filter((o) => o[0] === "all" || o[2] > 0 || o[0] === health)} />
        <FsChips value={src} onChange={setSrc} options={[["all", "ทุกแหล่ง"], ["fusionsolar", "FusionSolar"], ["manual", "เพิ่มเอง"]]} />
        {canWrite && (
          <button className="btn-add" style={{ marginLeft: "auto" }} onClick={() => setAdding(true)}>
            <Icon name="plus" size={15} color="#fff" /><span>เพิ่มไซต์เอง</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>กำลังโหลด…</div>
      ) : !sites.length ? (
        <div style={{ padding: "34px 20px", textAlign: "center", background: "var(--surface)", boxShadow: "var(--shadow-sm)",
          borderRadius: "var(--r-card)", color: "var(--text-2)", fontSize: 13 }}>
          ยังไม่มีไซต์ — แอดมินกด "ซิงก์ตอนนี้" ในเมนูตั้งค่า → ซิงก์ FusionSolar หรือเพิ่มไซต์เอง
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((s) => (
            <button key={s.id} type="button" onClick={() => setOpen(s.id)}
              style={{ textAlign: "left", border: "none", background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)",
                padding: "12px 14px", fontFamily: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{s.name || "(ไม่มีชื่อ)"}</div>
                <FsPill k={fsHealthKey(s)} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{s.fusionsolar_station_code || "ไม่มี station code"} · {fsNum(s.capacity_kw)} kWp</div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                <span>วันนี้ <b>{fsNum(s.day_kwh)}</b></span><span>เดือนนี้ <b>{fsNum(s.month_kwh, 0)}</b></span><span>สะสม <b>{fsNum(s.total_kwh, 0)}</b> kWh</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr>
                {FS_COLS.map((c) => (
                  <th key={c.key} onClick={() => pickSort(c.key)}
                    style={{ padding: "11px 12px", textAlign: c.num ? "right" : "left", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                      color: sort.k === c.key ? "var(--primary-dark)" : "var(--text-3)", cursor: "pointer", userSelect: "none",
                      borderBottom: "1px solid var(--divider)" }}>
                    {c.th}{sort.k === c.key ? (sort.dir > 0 ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const lost = s.fs_status === "not_found_in_fusionsolar";
                const td = { padding: "10px 12px", borderBottom: "1px solid var(--divider)", verticalAlign: "middle" };
                const nm = Object.assign({}, td, { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: lost ? "var(--text-3)" : "var(--text-1)" });
                return (
                  <tr key={s.id} onClick={() => setOpen(s.id)} className="fs-row" style={{ cursor: "pointer" }}>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{s.name || "(ไม่มีชื่อ)"}</span>
                        {s.source === "manual" && <FsSrcChip s={s} />}
                        {Object.keys(s.jobIds || {}).length > 0 && (
                          <span title={"ผูกงาน " + Object.keys(s.jobIds).join(", ")} style={{ display: "flex" }}><Icon name="link" size={13} color="var(--text-3)" /></span>
                        )}
                      </div>
                    </td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-2)", whiteSpace: "nowrap" })}>
                      {s.fusionsolar_station_code || <span style={{ color: "var(--text-3)" }}>–</span>}
                    </td>
                    <td style={nm}>{fsNum(s.capacity_kw, 2)}</td>
                    <td style={nm}>{fsNum(s.day_kwh)}</td>
                    <td style={nm}>{fsNum(s.month_kwh, 0)}</td>
                    <td style={nm}>{fsNum(s.total_kwh, 0)}</td>
                    <td style={td}><FsPill k={fsHealthKey(s)} /></td>
                    <td style={Object.assign({}, td, { color: "var(--text-2)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}
                      title={s.address || ""}>{s.address || "–"}</td>
                    <td style={Object.assign({}, td, { color: "var(--text-3)", whiteSpace: "nowrap", fontSize: 11.5 })}
                      title={fsWhen(s.kpi_updated_at || s.last_synced_at)}>{fsAgo(s.kpi_updated_at || s.last_synced_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <div style={{ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ไม่พบไซต์ที่ตรงกับตัวกรอง</div>}
        </div>
      )}

      {cur && <FsSiteModal site={cur} sites={all} jobs={jobs} canWrite={canWrite} currentUser={currentUser}
        onClose={() => setOpen(null)} onGo={(id) => setOpen(id)}
        onOpenJob={onOpenJob ? (id) => { setOpen(null); onOpenJob(id); } : null}
        onOpenOm={onOpenOm ? (id) => { setOpen(null); onOpenOm(id); } : null} />}
      {adding && <FsManualForm jobs={jobs} sites={all} currentUser={currentUser}
        onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); setOpen(id); }} />}
    </div>
  );
}

/* ── หน้าต่างแบบเดียวกันทั้งไฟล์ ── */
function FsModal({ title, sub, right, onClose, children, foot, width }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bd = window.useBackdropClose ? window.useBackdropClose(onClose) : { onClick: onClose };
  return (
    <div {...bd} style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(8,20,26,.45)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div style={{ width: "100%", maxWidth: width || 820, maxHeight: isMobile ? "94vh" : "90vh", display: "flex", flexDirection: "column",
        background: "var(--bg)", boxShadow: "var(--shadow-modal)", borderRadius: isMobile ? "var(--r-card) var(--r-card) 0 0" : "var(--r-card)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: isMobile ? "14px 14px" : "16px 20px", background: "var(--surface)",
          boxShadow: "0 6px 16px -12px rgba(0,0,0,.35)", position: "relative", zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)" }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
          <button className="x-close" onClick={onClose} title="ปิด"
            style={{ width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0, background: "var(--primary-soft)", color: "var(--primary-dark)" }}>
            <Icon name="x" size={15} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 14 : 18, display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
        {foot && <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
          background: "var(--surface)", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>{foot}</div>}
      </div>
    </div>
  );
}

/* ================================================================
   รายละเอียดไซต์
   ================================================================ */
function FsSiteModal({ site, sites, jobs, canWrite, currentUser, onClose, onGo, onOpenJob, onOpenOm }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { val: devVal } = useFsNode("fsDevices");
  const { val: omVal } = useFsNode("omSites");
  const hk = fsHealthKey(site);
  const code = site.fusionsolar_station_code || "";
  const devs = React.useMemo(() => Object.keys(devVal || {}).map((k) => Object.assign({ id: k }, devVal[k]))
    .filter((d) => d.site_id === site.id || (code && d.station_code === code)), [devVal, site.id, code]);
  const jobById = React.useMemo(() => { const m = {}; (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; }); return m; }, [jobs]);
  const linked = Object.keys(site.jobIds || {});
  const stageTH = (k) => (((window.SF && window.SF.STAGES) || []).find((s) => s.key === k) || {}).th || k || "";

  const groups = React.useMemo(() => {
    const out = FS_DEV_GROUPS.map((g) => ({ g, list: [] }));
    const other = [];
    devs.forEach((d) => { const g = fsDevGroupOf(d.dev_type_id); g ? out.find((x) => x.g === g).list.push(d) : other.push(d); });
    return { known: out.filter((x) => x.list.length), other };
  }, [devs]);

  /* ── ผูก station code ให้ไซต์ที่เพิ่มเอง ── */
  const [codeIn, setCodeIn] = React.useState(code);
  React.useEffect(() => { setCodeIn(site.fusionsolar_station_code || ""); }, [site.id, site.fusionsolar_station_code]);
  const dup = React.useMemo(() => {
    const c = fsCode(codeIn);
    return c ? (sites || []).find((s) => s.id !== site.id && !s.merged_into && s.fusionsolar_station_code === c) || null : null;
  }, [codeIn, sites, site.id]);
  const saveCode = () => {
    const c = fsCode(codeIn);
    if (dup || c === code) return;
    fsPatchSite(site.id, { fusionsolar_station_code: c || null, fs_status: null });
  };
  const merge = async () => {
    if (!dup) return;
    const ok = await window.askConfirm({
      title: "รวมสองไซต์นี้?",
      body: "รหัส " + dup.fusionsolar_station_code + " ถูกซิงก์เข้ามาเป็นไซต์ \"" + (dup.name || dup.id) + "\" แล้ว · งานที่ผูกกับ \""
        + (site.name || site.id) + "\" (" + (linked.length ? linked.join(", ") : "ไม่มีงาน") + ") จะย้ายไปอยู่ที่ไซต์จาก FusionSolar "
        + "ไซต์ที่เพิ่มเองจะถูกซ่อน (ไม่ลบ)",
      ok: "รวมไซต์", danger: false, icon: "link",
    });
    if (!ok) return;
    await fsMergeSites(dup, site, currentUser);
    onGo(dup.id);
  };

  /* ── ผูกงาน ── */
  const jobOpts = React.useMemo(() => (jobs || []).filter((j) => j && j.id && !(site.jobIds || {})[j.id])
    .map((j) => ({ value: j.id, label: (j.code || j.id) + " · " + (j.name || ""), desc: [j.address, j.kw ? j.kw + " kWp" : ""].filter(Boolean).join(" · ") })), [jobs, site.jobIds]);
  const link = (id) => id && fsPatchSite(site.id, { ["jobIds/" + id]: true });
  const unlink = async (id) => {
    const ok = await window.askConfirm({ title: "เลิกผูกงาน " + id + "?", body: "ใบงานไม่ถูกแก้ แค่ไม่แสดงในไซต์นี้", ok: "เลิกผูก" });
    if (ok) fsPatchSite(site.id, { ["jobIds/" + id]: null });
  };
  const [note, setNote] = React.useState(site.note || "");
  React.useEffect(() => { setNote(site.note || ""); }, [site.id, site.note]);

  return (
    <FsModal onClose={onClose} title={site.name || "(ไม่มีชื่อ)"}
      sub={(code ? code : "ไม่มี station code") + " · " + fsNum(site.capacity_kw, 2) + " kWp" + (site.address ? " · " + site.address : "")}
      right={<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><FsSrcChip s={site} /><FsPill k={hk} /></div>}>

      {!code && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: "var(--r-tile)", background: "var(--surface2)" }}>
          <Icon name="alert" size={15} color="var(--text-3)" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ไม่มีข้อมูล FusionSolar</span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>ไซต์นี้ยังไม่ได้ผูก station code</span>
        </div>
      )}
      {site.fs_status === "not_found_in_fusionsolar" && (
        <div style={{ padding: "11px 13px", borderRadius: "var(--r-tile)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontSize: 12.5, fontWeight: 600 }}>
          ไม่พบสถานีนี้ใน FusionSolar ในการซิงก์ล่าสุด — ข้อมูลเดิมยังอยู่ครบ (ไม่ลบ) · ค่าการผลิตด้านล่างเป็นค่าล่าสุดก่อนหาย
        </div>
      )}

      {/* ผูก station code — ไซต์ที่เพิ่มเองเท่านั้น (ไซต์จาก FusionSolar รหัสมาจากต้นทาง) */}
      {site.source === "manual" && canWrite && (
        <FsCard title="ผูกกับ FusionSolar" sub="กรอก station code เช่น NE=57489892 · รอบซิงก์ถัดไปจะดึงข้อมูลให้">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="NE=…"
              style={{ flex: "1 1 200px", padding: "10px 12px", borderRadius: "var(--r-tile)", fontFamily: "var(--mono)", fontSize: 13 }} />
            <button className="btn btn-pri" disabled={!!dup || fsCode(codeIn) === code} onClick={saveCode}>บันทึกรหัส</button>
          </div>
          {dup && (
            <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: "var(--r-tile)", background: "var(--tint-amber-bg)",
              display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 240px", fontSize: 12.5, color: "var(--tint-amber-tx)", fontWeight: 600 }}>
                รหัสนี้ซ้ำกับไซต์ "{dup.name || dup.id}" ({dup.source === "manual" ? "เพิ่มเอง" : "ซิงก์จาก FusionSolar"}) — รวมเป็นไซต์เดียวได้
              </span>
              <button className="btn btn-soft btn-sm" onClick={merge}>รวมสองไซต์</button>
            </div>
          )}
        </FsCard>
      )}

      <FsCard title="การผลิต" sub={site.kpi_updated_at ? "อัปเดต " + fsWhen(site.kpi_updated_at) : "ยังไม่มีข้อมูลผลิต"}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 9 }}>
          <FsSpec label="ผลิตวันนี้" value={fsNum(site.day_kwh)} unit="kWh" />
          <FsSpec label="ผลิตเดือนนี้" value={fsNum(site.month_kwh)} unit="kWh" />
          <FsSpec label="ผลิตสะสม" value={fsNum(site.total_kwh, 0)} unit="kWh" />
          <FsSpec label="กำลังติดตั้ง" value={fsNum(site.capacity_kw, 2)} unit="kWp" />
        </div>
      </FsCard>

      <FsCard title="ข้อมูลไซต์">
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 9 }}>
          <FsSpec label="Station code" value={code || "–"} mono />
          <FsSpec label="แหล่งที่มา" value={site.source === "manual" ? "เพิ่มเองในเว็บ" : "FusionSolar"} />
          <FsSpec label="ซิงก์รายชื่อล่าสุด" value={fsWhen(site.last_synced_at)} />
        </div>
        {site.address && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 10 }}>{site.address}</div>}
        {site.manual_saved && (site.manual_name || site.manual_address) && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 8 }}>
            ค่าที่กรอกเองก่อนผูก FusionSolar: {[site.manual_name, site.manual_address, site.manual_capacity_kw ? site.manual_capacity_kw + " kWp" : ""].filter(Boolean).join(" · ")}
          </div>
        )}
      </FsCard>

      {/* อุปกรณ์แยกตามประเภท */}
      <FsCard title="อุปกรณ์" sub={devs.length ? devs.length + " ชิ้น" : (code ? "ยังไม่มีข้อมูลอุปกรณ์ — รอซิงก์รอบถัดไป" : "")}>
        {!devs.length ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>–</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.known.map(({ g, list }) => (
              <div key={g.key}>
                <div style={FS_LBL}>{g.th}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {list.map((d) => { const k = fsKpi(d); return (
                    <FsDevBox key={d.id} d={d}>
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(" + Math.min(g.fields.length, 5) + ", 1fr)", gap: 8 }}>
                        {g.fields.map(([f, th, u]) => <FsSpec key={f} label={th} value={fsNum(k[f], 2)} unit={u} />)}
                      </div>
                    </FsDevBox>
                  ); })}
                </div>
              </div>
            ))}
            {groups.other.length > 0 && (
              <div>
                <div style={FS_LBL}>อุปกรณ์อื่น</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {groups.other.map((d) => { const k = fsKpi(d), keys = Object.keys(k); return (
                    <FsDevBox key={d.id} d={d}>
                      {!keys.length ? <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีค่าจากอุปกรณ์</div> : (
                        <div style={{ borderRadius: "var(--r-tile)", background: "var(--surface2)", overflow: "hidden" }}>
                          {keys.map((kk, i) => (
                            <div key={kk} style={{ display: "flex", gap: 10, padding: "6px 11px", fontSize: 12, borderTop: i ? "1px solid var(--divider)" : "none" }}>
                              <span style={{ flex: 1, fontFamily: "var(--mono)", color: "var(--text-2)", fontSize: 11.5 }}>{kk}</span>
                              <span style={{ fontFamily: "var(--mono)", color: "var(--text-1)", fontWeight: 700, textAlign: "right" }}>
                                {k[kk] == null ? "–" : typeof k[kk] === "object" ? JSON.stringify(k[kk]) : String(k[kk])}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </FsDevBox>
                  ); })}
                </div>
              </div>
            )}
          </div>
        )}
      </FsCard>

      {/* งานในเว็บของไซต์นี้ — อ่านจากใบงานตามเดิม ไม่แก้ใบงาน */}
      <FsCard title="งานในเว็บ" sub={linked.length ? linked.length + " งาน" : "ยังไม่ได้ผูกงาน"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {linked.map((id) => {
            const j = jobById[id];
            const om = (omVal || {})[id];
            return (
              <div key={id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: "var(--r-tile)",
                background: "var(--surface)", boxShadow: "var(--shadow-sm)", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)" }}>{(j && j.code) || id}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{j ? j.name || "(ไม่มีชื่องาน)" : "ไม่พบใบงาน (ถูกลบ/ไม่มีสิทธิ์ดู)"}</div>
                  {j && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    {[stageTH(j.stage), j.kw ? j.kw + " kWp" : "", j.address].filter(Boolean).join(" · ")}
                  </div>}
                </div>
                {j && onOpenJob && <button className="btn btn-sm" onClick={() => onOpenJob(id)}>เปิดใบงาน</button>}
                {om && onOpenOm && <button className="btn btn-sm" onClick={() => onOpenOm(id)}>ทะเบียน O&M</button>}
                {canWrite && <button className="btn btn-sm btn-dngr" onClick={() => unlink(id)}>เลิกผูก</button>}
              </div>
            );
          })}
          {canWrite && window.Dropdown && (
            <div style={{ maxWidth: 420 }}>
              <window.Dropdown value="" onChange={link} options={jobOpts} placeholder="+ ผูกงานกับไซต์นี้" wrap />
            </div>
          )}
        </div>
      </FsCard>

      <FsCard title="หมายเหตุ">
        <textarea value={note} disabled={!canWrite} onChange={(e) => setNote(e.target.value)} rows={2}
          onBlur={() => { if ((site.note || "") !== note) fsPatchSite(site.id, { note: note || null }); }}
          placeholder="บันทึกของทีมเกี่ยวกับไซต์นี้ (ซิงก์ไม่เขียนทับ)"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--r-tile)", fontFamily: "inherit", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
      </FsCard>
    </FsModal>
  );
}

function FsDevBox({ d, children }) {
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: "11px 13px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 9 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{d.dev_name || d.id}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{fsDevTypeTH(d.dev_type_id)}</span>
        {d.fs_status === "not_found_in_fusionsolar" && <FsPill k="lost" />}
        <span style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--text-3)" }} title={fsWhen(d.last_kpi_at)}>
          {d.last_kpi_at ? "ค่าเมื่อ " + fsAgo(d.last_kpi_at) : "ยังไม่มีค่า"}
        </span>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--mono)", marginBottom: 9 }}>
        {[d.model, d.esn_code && "SN " + d.esn_code, d.software_version, "id " + (d.fusionsolar_dev_id || d.id)].filter(Boolean).join(" · ")}
      </div>
      {children}
    </div>
  );
}

/* ── เพิ่มไซต์เอง (source = manual) ── */
function FsManualForm({ jobs, sites, currentUser, onClose, onCreated }) {
  const [f, setF] = React.useState({ name: "", address: "", kw: "", code: "", jobId: "" });
  const set = (k, v) => setF((o) => Object.assign({}, o, { [k]: v }));
  const pickJob = (id) => {
    const j = (jobs || []).find((x) => x.id === id) || {};
    setF((o) => Object.assign({}, o, { jobId: id, name: o.name || j.name || "", address: o.address || j.address || "",
      kw: o.kw || (j.kw != null ? String(j.kw) : "") }));
  };
  const dup = fsCode(f.code) ? (sites || []).find((s) => !s.merged_into && s.fusionsolar_station_code === fsCode(f.code)) : null;
  const ok = f.name.trim() && !dup;
  const save = () => {
    if (!ok) return;
    const id = "FSM-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const now = new Date().toISOString();
    window.FBDB.ref("fsSites/" + id).update({
      id, name: f.name.trim(), address: f.address.trim(), capacity_kw: f.kw === "" || isNaN(+f.kw) ? null : +f.kw,
      fusionsolar_station_code: fsCode(f.code) || null, source: "manual", created_at: now,
      created_by: (currentUser || {}).name || null, jobIds: f.jobId ? { [f.jobId]: true } : null,
    }).then(() => onCreated(id));
  };
  const jobOpts = (jobs || []).filter((j) => j && j.id).map((j) => ({ value: j.id, label: (j.code || j.id) + " · " + (j.name || ""), desc: j.address || "" }));
  const inp = { width: "100%", padding: "10px 12px", borderRadius: "var(--r-tile)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box" };
  return (
    <FsModal width={560} onClose={onClose} title="เพิ่มไซต์เอง" sub="ไซต์ที่ยังไม่อยู่ใน FusionSolar · ผูก station code ทีหลังได้"
      foot={<React.Fragment>
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-pri" disabled={!ok} onClick={save}>สร้างไซต์</button>
      </React.Fragment>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {window.Dropdown && <div><div style={FS_LBL}>ผูกกับงาน (ไม่บังคับ — เลือกแล้วเติมชื่อ/ที่อยู่ให้)</div>
          <window.Dropdown value={f.jobId} onChange={pickJob} options={jobOpts} placeholder="เลือกงาน" wrap /></div>}
        <div><div style={FS_LBL}>ชื่อไซต์ *</div><input style={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div><div style={FS_LBL}>ที่อยู่</div><input style={inp} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div style={FS_LBL}>กำลังติดตั้ง (kWp)</div><input style={inp} inputMode="decimal" value={f.kw} onChange={(e) => set("kw", e.target.value)} /></div>
          <div><div style={FS_LBL}>Station code</div><input style={Object.assign({}, inp, { fontFamily: "var(--mono)" })} placeholder="NE=…" value={f.code} onChange={(e) => set("code", e.target.value)} /></div>
        </div>
        {dup && <div style={{ fontSize: 12, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>
          รหัสนี้มีอยู่แล้วที่ไซต์ "{dup.name || dup.id}" — เปิดไซต์นั้นแล้วผูกงานแทนการสร้างใหม่
        </div>}
      </div>
    </FsModal>
  );
}

/* ================================================================
   หน้า log การซิงก์ (แอดมิน)
   ================================================================ */
const FS_JOB_TH = { all: "ทั้งหมด", sites: "ไซต์+อุปกรณ์", kpi: "ข้อมูลผลิต" };
const FS_TRIG_TH = { cron: "อัตโนมัติ (Vercel)", gh: "อัตโนมัติรายชั่วโมง", manual: "แอดมินกด", tool: "สคริปต์ในเครื่อง" };

async function fsCallSync(job, dryRun) {
  const u = window.FBAUTH && window.FBAUTH.currentUser;
  if (!u) throw new Error("ยังไม่ได้ล็อกอินผ่านเซิร์ฟเวอร์ — ออกจากระบบแล้วเข้าใหม่");
  const tok = await u.getIdToken();
  const r = await fetch("/api/fusionsolar/sync", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + tok },
    body: JSON.stringify({ job, dryRun }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
  return j;
}

function FsLogView({ role, currentUser }) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const { val: logVal, loading } = useFsNode("fsSyncLogs", 60);
  const { val: st } = useFsNode("fsState");
  const logs = React.useMemo(() => Object.keys(logVal || {}).map((k) => Object.assign({ id: k }, logVal[k])).reverse(), [logVal]);
  const [job, setJob] = React.useState("all");
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");
  const [dry, setDry] = React.useState(null);
  const [openLog, setOpenLog] = React.useState(null);
  const state = st || {};
  const approved = !!state.approved_at;
  const blocked = state.blocked_until && Date.parse(state.blocked_until) > Date.now();

  const run = async (dryRun) => {
    if (!dryRun) {
      const ok = await window.askConfirm({
        title: approved ? "ซิงก์ตอนนี้ (" + FS_JOB_TH[job] + ")?" : "บันทึกจริงครั้งแรก?",
        body: (approved ? "" : "หลังรอบนี้ระบบจะซิงก์อัตโนมัติ (วันละครั้ง + ข้อมูลผลิตทุกชั่วโมง) · ")
          + "เขียนเฉพาะ fsSites / fsDevices / fsSyncLogs ไม่แตะข้อมูลงาน · ใช้เวลาราว 10–45 วินาที",
        ok: "ซิงก์", danger: false, icon: "history",
      });
      if (!ok) return;
    }
    setBusy(dryRun ? "dry" : "real"); setErr("");
    try {
      const r = await fsCallSync(job, dryRun);
      if (dryRun) setDry(r); else setDry(null);
      if (r.log && !r.log.ok) setErr("รอบนี้มีข้อผิดพลาด — ดูรายละเอียดในผล" + (dryRun ? "ทดลอง" : " log ด้านล่าง"));
    } catch (e) { setErr(String(e.message || e)); }
    setBusy("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>ซิงก์ Huawei FusionSolar</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>ไซต์+อุปกรณ์วันละครั้ง · ข้อมูลผลิตทุกชั่วโมง · เว้น 3 วินาทีต่อคำขอ</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 9 }}>
          <FsSpec label="ซิงก์อัตโนมัติ" value={approved ? "เปิดแล้ว" : "รอบันทึกจริงครั้งแรก"} />
          <FsSpec label="ไซต์+อุปกรณ์ล่าสุด" value={fsWhen(state.last_sites_at)} />
          <FsSpec label="ข้อมูลผลิตล่าสุด" value={fsWhen(state.last_kpi_at)} />
          <FsSpec label="สถานะ" value={blocked ? "พัก 407 ถึง " + new Date(state.blocked_until).toLocaleTimeString("th-TH", { timeStyle: "short" })
            : (state.lock ? "กำลังซิงก์…" : "พร้อม")} />
        </div>
        {isAdmin ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <FsChips value={job} onChange={setJob} options={[["all", FS_JOB_TH.all], ["sites", FS_JOB_TH.sites], ["kpi", FS_JOB_TH.kpi]]} />
            <div style={{ flex: 1 }} />
            <button className="btn btn-soft" disabled={!!busy} onClick={() => run(true)}>
              {busy === "dry" ? "กำลังทดลอง…" : "ทดลอง (dry run)"}
            </button>
            <button className="btn btn-pri" disabled={!!busy || (!approved && !dry)} onClick={() => run(false)}
              title={!approved && !dry ? "รอบแรกต้องทดลอง (dry run) ก่อน" : ""}>
              <Icon name="check" size={14} color="#fff" /> {busy === "real" ? "กำลังซิงก์…" : approved ? "ซิงก์ตอนนี้" : "บันทึกจริงครั้งแรก"}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>ปุ่มซิงก์ใช้ได้เฉพาะบัญชีแอดมิน</div>
        )}
        {busy && <div style={{ fontSize: 12, color: "var(--text-3)" }}>Huawei จำกัดความถี่ — รอสักครู่ ห้ามปิดหน้า</div>}
        {err && <div style={{ fontSize: 12.5, color: "var(--tint-red-tx)", background: "var(--tint-red-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>{err}</div>}
      </div>

      {dry && <FsDryResult r={dry} onClose={() => setDry(null)} />}

      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 700 }}>ผลแต่ละรอบ <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>60 รอบล่าสุด</span></div>
        {loading ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
          : !logs.length ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>ยังไม่มีรอบซิงก์ที่บันทึก</div>
          : logs.map((l) => (
            <div key={l.id} style={{ borderTop: "1px solid var(--divider)" }}>
              <button type="button" onClick={() => setOpenLog(openLog === l.id ? null : l.id)}
                style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit",
                  padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <FsPill k={l.skipped ? "wait" : l.ok ? "ok" : "lost"} label={l.skipped ? "ข้าม" : l.ok ? "สำเร็จ" : "มีข้อผิดพลาด"} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", minWidth: 140 }}>{fsWhen(l.started_at)}</span>
                <span style={{ fontSize: 12, color: "var(--text-2)" }}>{FS_JOB_TH[l.job] || l.job} · {FS_TRIG_TH[l.trigger] || l.trigger}{l.by ? " · " + l.by : ""}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                  {fsLogSummary(l)}
                </span>
              </button>
              {openLog === l.id && (
                <div style={{ padding: "0 16px 13px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                    <FsSpec label="สถานีจาก FusionSolar" value={l.stations || 0} />
                    <FsSpec label="ไซต์ สร้าง / อัปเดต / ไม่พบ" value={(l.created || 0) + " / " + (l.updated || 0) + " / " + (l.not_found || 0)} />
                    <FsSpec label="อุปกรณ์ สร้าง / อัปเดต / ไม่พบ" value={(l.dev_created || 0) + " / " + (l.dev_updated || 0) + " / " + (l.dev_not_found || 0)} />
                    <FsSpec label="ข้อมูลผลิต ไซต์ / อุปกรณ์" value={(l.kpi_sites || 0) + " / " + (l.kpi_devices || 0)} />
                    <FsSpec label="คำขอ · เวลา" value={(l.requests || 0) + " · " + Math.round((l.ms || 0) / 1000) + " วิ"} />
                    <FsSpec label="งานค้างไปรอบหน้า" value={l.pending || 0} />
                  </div>
                  {l.note && <div style={{ fontSize: 12, color: "var(--text-2)" }}>{l.note}</div>}
                  <FsErrList errors={l.errors} />
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
const fsLogSummary = (l) => [
  (l.created || l.updated || l.not_found) ? "ไซต์ +" + (l.created || 0) + " ~" + (l.updated || 0) + " ?" + (l.not_found || 0) : "",
  (l.kpi_sites || l.kpi_devices) ? "kpi " + (l.kpi_sites || 0) + "/" + (l.kpi_devices || 0) : "",
  (l.errors || []).length ? "ผิดพลาด " + l.errors.length : "",
].filter(Boolean).join(" · ") || (l.note || "");

function FsErrList({ errors }) {
  const list = Array.isArray(errors) ? errors : Object.values(errors || {});
  if (!list.length) return null;
  return (
    <div style={{ borderRadius: "var(--r-tile)", background: "var(--tint-red-bg)", padding: "8px 11px", display: "flex", flexDirection: "column", gap: 4 }}>
      {list.map((e, i) => (
        <div key={i} style={{ fontSize: 11.5, color: "var(--tint-red-tx)", fontFamily: "var(--mono)" }}>
          {e.api || "–"}{e.failCode != null ? " · failCode " + e.failCode : ""} · {e.message}
        </div>
      ))}
    </div>
  );
}

function FsDryResult({ r, onClose }) {
  const L = r.log || {}, p = r.preview || {};
  const list = (t, a) => (a && a.length ? (
    <div>
      <div style={FS_LBL}>{t} ({a.length})</div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
        {a.slice(0, 40).map((x) => (x.code || "") + " " + (x.name || "")).join(" · ")}{a.length > 40 ? " · …" : ""}
      </div>
    </div>) : null);
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>ผลทดลอง (dry run) — ยังไม่ได้บันทึกอะไร</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{FS_JOB_TH[L.job]} · {L.requests} คำขอ · {Math.round((L.ms || 0) / 1000)} วิ</div>
        <button className="btn btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>ซ่อน</button>
      </div>
      {r.skipped && <div style={{ fontSize: 12.5, color: "var(--tint-amber-tx)" }}>{L.note}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        <FsSpec label="สถานีจาก FusionSolar" value={L.stations || 0} />
        <FsSpec label="ไซต์ที่จะสร้าง" value={L.created || 0} />
        <FsSpec label="ไซต์ที่จะอัปเดต" value={L.updated || 0} />
        <FsSpec label="ไม่พบใน FusionSolar" value={L.not_found || 0} />
        <FsSpec label="อุปกรณ์ สร้าง / อัปเดต" value={(L.dev_created || 0) + " / " + (L.dev_updated || 0)} />
        <FsSpec label="ข้อมูลผลิต ไซต์ / อุปกรณ์" value={(L.kpi_sites || 0) + " / " + (L.kpi_devices || 0)} />
      </div>
      {list("จะสร้าง", p.create)}{list("ค่าจะเปลี่ยน", p.changed)}{list("จะตั้งเป็นไม่พบใน FusionSolar", p.not_found)}
      {p.kpi && p.kpi.length > 0 && (
        <div>
          <div style={FS_LBL}>ตัวอย่างข้อมูลผลิต</div>
          <div style={{ fontSize: 11.5, fontFamily: "var(--mono)", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3 }}>
            {p.kpi.slice(0, 10).map((k, i) => <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {k.code ? k.code + " " + k.name + " · วันนี้ " + fsNum(k.day_kwh) + " · เดือนนี้ " + fsNum(k.month_kwh) + " · สะสม " + fsNum(k.total_kwh, 0) + " kWh · " + (FS_HEALTH[{ 3: "ok", 2: "warn", 1: "off" }[k.health_state]] || FS_HEALTH.wait).th
                : k.dev_name + " (" + fsDevTypeTH(k.dev_type_id) + ") " + JSON.stringify(k.dataItemMap)}
            </div>)}
          </div>
        </div>
      )}
      {L.note && <div style={{ fontSize: 12, color: "var(--text-2)" }}>{L.note}</div>}
      <FsErrList errors={L.errors} />
    </div>
  );
}

Object.assign(window, {
  FS_DEV_TYPES, fsDevTypeTH, fsHealthKey, useFsSites, fsMergeSites,
  FsSitesView, FsSiteModal, FsLogView,
});
