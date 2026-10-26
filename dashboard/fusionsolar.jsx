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
  17: "Grid meter", 47: "Power meter", 39: "Battery", 41: "ESS", 46: "Optimizer", 10: "EMI (environmental monitor)",
  23070: "EMMA (energy manager)", 23071: "SmartGuard (backup box)", 23076: "External meter",
};
const fsDevTypeTH = (t) => FS_DEV_TYPES[t] || ("ไม่ทราบประเภท (devTypeId " + t + ")");
/* ค่าที่แสดงของแต่ละกลุ่ม (สเปกข้อ 5) · กลุ่มอื่นแสดง last_kpi_json ทั้งหมดเป็นตาราง key/value */
const FS_DEV_GROUPS = [
  { key: "inv", th: "อินเวอร์เตอร์", types: [1, 38], fields: [
    ["total_cap", "ผลิตสะสม", "kWh"], ["day_cap", "ผลิตวันนี้", "kWh"], ["active_power", "กำลังไฟขณะนี้", "kW"]] },
  { key: "meter", th: "มิเตอร์", types: [17, 47], fields: [
    ["active_cap", "ขายไฟสะสม", "kWh"], ["reverse_active_cap", "ซื้อไฟสะสม", "kWh"], ["active_power", "กำลังไฟขณะนี้", "W"],
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
/* ผลิตต่อ kWp วันนี้ — ตัวเทียบไซต์ต่างขนาดกัน (ไซต์ไม่พบใน FusionSolar ไม่นับ ค่าค้าง) */
const fsYield = (s) => (s.fs_status !== "not_found_in_fusionsolar" && fsN(s.day_kwh) != null && fsN(s.capacity_kw) > 0 ? s.day_kwh / s.capacity_kw : null);
/* รายการไซต์ที่ต้องดูแล — เรียงเรื่องหนัก (bad) ก่อน */
function FsAttention({ items, onOpen }) {
  const [all, setAll] = React.useState(false);
  if (!items.length) return null;
  const shown = all ? items : items.slice(0, 5);
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-tile)", padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
        <Icon name="alert" size={15} color="var(--tint-amber-tx)" />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>ต้องดูแล</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{items.length} ไซต์</span>
      </div>
      {shown.map(({ s, list }) => (
        <button key={s.id} type="button" onClick={() => onOpen(s.id)} className="fs-att"
          style={{ display: "flex", width: "100%", gap: 10, alignItems: "flex-start", textAlign: "left", border: "none", background: "transparent",
            padding: "7px 6px", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, marginTop: 6, flexShrink: 0, background: list.some((x) => x.tone === "bad") ? "var(--tint-red-tx)" : "var(--tint-amber-tx)" }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{s.name || s.id}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-2)" }}>{list[0].text}{list.length > 1 ? " · และอีก " + (list.length - 1) + " เรื่อง" : ""}</span>
          </span>
          <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>ดู →</span>
        </button>
      ))}
      {items.length > 5 && (
        <button type="button" onClick={() => setAll(!all)} style={{ border: "none", background: "transparent", padding: "4px 6px", cursor: "pointer",
          fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--primary)" }}>{all ? "ย่อ" : "ดูทั้งหมด " + items.length + " ไซต์"}</button>
      )}
    </div>
  );
}
const FS_HEALTH_RANK = { off: 0, warn: 1, lost: 2, wait: 3, ok: 4, none: 5 };
const fsSortVal = (s, k, live) => ({
  now: live && live[s.id] != null ? live[s.id] : -1,
  name: (s.name || "").toLowerCase(), code: s.fusionsolar_station_code || "", kw: +s.capacity_kw || 0,
  day: +s.day_kwh || 0, yield: fsYield(s) || 0, month: +s.month_kwh || 0, total: +s.total_kwh || 0,
  health: FS_HEALTH_RANK[fsHealthKey(s)], address: (s.address || "").toLowerCase(),
  at: Date.parse(s.kpi_updated_at || s.last_synced_at || "") || 0,
}[k]);

/* ── ภาพรวมทุกไซต์: ตามแบบอ้างอิงที่ผู้ใช้ส่งมา (Solis / Lumos / SolarSync / Sunsolar) — พื้นสว่าง บ้านโซลาร์ 3D ตรงกลาง (FsHouse3D)
   การ์ดตัวเลขลอยรอบบ้าน 4 ใบ · สีส้ม (--fs-sun) = เรื่องพลังงาน · จอมือถือ: บ้านอยู่บน การ์ดเรียง 2 คอลัมน์ข้างล่าง
   กดป้ายสถานะ = กรองรายการไซต์ข้างล่าง ── */
const FS_HG = { ok: "var(--tint-ok-tx)", warn: "var(--tint-amber-tx)", off: "var(--text-3)", lost: "var(--tint-red-tx)", wait: "var(--border-strong)", none: "var(--surface3)" };
function FsFloatCard({ icon, label, value, unit, sub, frac, style, flat }) {
  return (
    <div style={Object.assign({ minWidth: 0, padding: "12px 14px", borderRadius: 16, display: "flex", flexDirection: "column", gap: 6,
      background: flat ? "var(--surface)" : "color-mix(in srgb, var(--surface) 84%, transparent)", boxShadow: flat ? "var(--shadow-sm)" : "var(--shadow-card)",
      backdropFilter: flat ? "none" : "blur(10px)", WebkitBackdropFilter: flat ? "none" : "blur(10px)" }, style)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 14, display: "grid", placeItems: "center", flexShrink: 0,
          background: "color-mix(in srgb, var(--fs-sun) 16%, var(--surface))" }}><Icon name={icon} size={15} color="var(--fs-sun)" /></span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: flat ? 22 : 26, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {value}{value !== "–" && <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>}
      </div>
      {frac != null && (
        <div style={{ height: 5, borderRadius: 3, background: "var(--surface3)", overflow: "hidden" }}>
          <div className="fs-tr" style={{ width: fsClamp(frac, 0, 1) * 100 + "%", height: "100%", borderRadius: 3, background: "var(--fs-sun)" }} />
        </div>
      )}
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}
function FsFleetHero({ roll, nowKw, liveN, lastAt, isMobile, hCount, health, onHealth }) {
  const co2 = (roll.total * FS_GRID_EF) / 1000;
  const big = (v) => (Math.abs(v) >= 10000 ? v / 1000 : v);
  const E = (v) => fsEnergy(v)[1];
  const dom = Math.max(1, +fsBkk(Date.now()).day.slice(8));
  const avgDay = dom > 1 ? (roll.month - roll.day) / (dom - 1) : null;   // เฉลี่ยต่อวันของวันที่ผ่านมาแล้วในเดือนนี้
  const dayFrac = avgDay > 0 ? roll.day / avgDay : null;
  const nowFrac = roll.kwOn > 0 && nowKw != null ? nowKw / roll.kwOn : null;
  const hs = ["ok", "warn", "off", "lost", "none"].filter((k) => hCount[k] > 0);
  const cards = [
    { k: "now", icon: "bolt", label: "กำลังผลิตตอนนี้", value: nowKw == null ? "–" : <FsCountUp value={big(nowKw)} digits={nowKw >= 10000 ? 2 : 0} />,
      unit: nowKw >= 10000 ? "MW" : "kW", frac: nowFrac, sub: nowFrac == null ? liveN + " ไซต์ออนไลน์" : Math.round(nowFrac * 100) + "% ของกำลังติดตั้ง · " + liveN + " ไซต์" },
    { k: "day", icon: "sun", label: "ผลิตวันนี้", value: <FsCountUp value={big(roll.day)} digits={1} />, unit: E(roll.day), frac: dayFrac,
      sub: dayFrac == null ? null : Math.round(dayFrac * 100) + "% ของเฉลี่ยต่อวันเดือนนี้" },
    { k: "mon", icon: "calendar", label: "ผลิตเดือนนี้", value: <FsCountUp value={big(roll.month)} digits={1} />, unit: E(roll.month),
      sub: "เฉลี่ย " + fsEnergy(roll.month / dom).join(" ") + "/วัน" },
    { k: "tot", icon: "trend", label: "ผลิตสะสม", value: <FsCountUp value={big(roll.total)} digits={1} />, unit: E(roll.total), sub: "ลด CO₂ " + fsFmt(co2, 0) + " ตัน" },
  ];
  const titleBlock = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
      <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, padding: "5px 11px",
        borderRadius: 999, background: "color-mix(in srgb, var(--fs-sun) 14%, var(--surface))", color: "var(--text-2)" }}>
        <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--fs-sun)" }} />{lastAt ? "อัปเดต " + fsAgo(new Date(lastAt).toISOString()) : "ยังไม่มีข้อมูลผลิต"}
      </span>
      <div style={{ fontFamily: "var(--display)", fontSize: isMobile ? 28 : 38, fontWeight: 700, lineHeight: 1.12, color: "var(--text-1)" }}>
        พลังงานสะอาด<br />จาก <span style={{ color: "var(--fs-sun)" }}>{roll.n}</span> ไซต์
      </div>
      <div style={{ fontSize: 13, color: "var(--text-2)", maxWidth: 300 }}>ติดตั้งรวม {fsFmt(roll.kw, 0)} kWp · ดึงข้อมูลจาก FusionSolar ทุกชั่วโมง</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {hs.map((k) => (
          <button key={k} type="button" onClick={() => onHealth(health === k ? "all" : k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
              padding: "5px 11px", borderRadius: 999, color: health === k ? "var(--primary-dark)" : "var(--text-2)", background: health === k ? "var(--primary-soft)" : "var(--surface)",
              boxShadow: "var(--shadow-sm)" }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: FS_HG[k] }} />{FS_HEALTH[k].th} {hCount[k]}
          </button>
        ))}
      </div>
    </div>
  );
  const backdrop = (cx) => (window.FsHouseBackdrop ? <window.FsHouseBackdrop cx={cx} /> : null);
  const bg = "radial-gradient(ellipse 48% 62% at " + (isMobile ? "50% 42%" : "66% 40%") + ", color-mix(in srgb, var(--fs-sun) 16%, transparent), transparent 72%),"
    + " linear-gradient(180deg, color-mix(in srgb, var(--primary) 7%, var(--surface)) 0%, var(--surface) 78%)";
  const wrap = { position: "relative", overflow: "hidden", borderRadius: "var(--r-card)", background: bg, boxShadow: "var(--shadow-card)", isolation: "isolate" };
  const vfade = "linear-gradient(180deg, transparent 0, #000 16%, #000 84%, transparent 100%)";   // มือถือ: ขอบบน/ล่างของภาพจางเข้าพื้นกรอบ
  if (isMobile) return (
    <div className="fs-hero" style={wrap}>
      <div style={{ padding: "16px 14px 0" }}>{titleBlock}</div>
      <div style={{ position: "relative", height: 230, WebkitMaskImage: vfade, maskImage: vfade }}>{backdrop(0.5)}</div>
      <div className="kpi-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", padding: "0 14px 14px" }}>
        {cards.map((c) => <FsFloatCard key={c.k} {...c} flat />)}
      </div>
    </div>
  );
  /* ภาพบ้านเต็มกรอบเป็นพื้นหลัง (ผู้ใช้ขอ) · หัวข้อ | ช่องว่างให้เห็นบ้าน | การ์ด 4 ใบเรียงคอลัมน์ขวา — การ์ดไม่ทับตัวบ้าน (ผู้ใช้ทักว่าการ์ดลอยบังบ้าน) */
  return (
    <div className="fs-hero" style={wrap}>
      {backdrop(0.52)}
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(230px, .8fr) minmax(0, 1.7fr) 220px", gap: 14, padding: "20px 22px", alignItems: "center" }}>
        {titleBlock}
        <div style={{ height: 360 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cards.map((c) => <FsFloatCard key={c.k} {...c} style={{ padding: "10px 14px" }} />)}
        </div>
      </div>
    </div>
  );
}

/* ── ผลิตดีที่สุด (ต่อ kWp — เทียบไซต์ต่างขนาดกันได้) ── */
function FsRanking({ sites, live, onOpen }) {
  const [m, setM] = React.useState("day");
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  const val = (s) => (m === "day" ? fsYield(s) : m === "month" ? fsMonthYield(s)
    : live[s.id] != null && +s.capacity_kw > 0 ? (live[s.id] / s.capacity_kw) * 100 : null);
  const list = sites.filter((s) => +s.health_state === 3).map((s) => ({ s, v: val(s) })).filter((x) => x.v != null && x.v > 0)
    .sort((a, b) => b.v - a.v).slice(0, 8);
  const max = list.length ? list[0].v : 1;
  const unit = m === "now" ? "%" : m === "day" ? "kWh/kWp" : "kWh/kWp/วัน";
  return (
    <FsCard title="ผลิตดีที่สุด" sub={"ต่อ kWp · " + unit}
      right={window.Segmented ? <window.Segmented flat value={m} onChange={setM} options={[{ value: "now", label: "ตอนนี้" }, { value: "day", label: "วันนี้" }, { value: "month", label: "เดือนนี้" }]} /> : null}>
      {!list.length ? <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "8px 0" }}>ยังไม่มีข้อมูล</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {list.map((x, i) => (
            <button key={x.s.id} type="button" onClick={() => onOpen(x.s.id)} className="fs-att"
              style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1.1fr) minmax(40px,1fr) 52px", gap: 8, alignItems: "center", border: "none", background: "transparent",
                padding: "4px 4px", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ width: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 800,
                background: i < 3 ? "var(--primary-soft)" : "var(--surface2)", color: i < 3 ? "var(--primary-dark)" : "var(--text-3)" }}>{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.s.name || x.s.id}</span>
              <span style={{ height: 8, borderRadius: 4, background: "var(--surface3)", overflow: "hidden" }}>
                <span className="fs-tr" style={{ display: "block", height: "100%", borderRadius: 4, background: "var(--primary)", width: (on ? (x.v / max) * 100 : 0) + "%" }} />
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-1)", textAlign: "right" }}>{fsFmt(x.v, m === "now" ? 0 : 2)}{m === "now" ? "%" : ""}</span>
            </button>
          ))}
        </div>
      )}
    </FsCard>
  );
}

/* ── แผนที่ไซต์ (Leaflet + OpenStreetMap แบบเดียวกับปฏิทินงาน) ──
   วงใหญ่ = กำลังติดตั้งมาก · สีตามสถานะ · วงกระเพื่อม = กำลังผลิตอยู่ · กด = เปิดไซต์ */
/* พิกัดหลอกของไซต์ที่ไม่ได้ปักหมุด (0,0 · 1,1 · -1,-1) ไม่นับ — ซิงก์ล้างให้แล้ว กันค่าเก่าค้าง */
const fsGeoOk = (s) => fsN(s.lat) != null && fsN(s.lng) != null && !(Math.abs(s.lat) <= 1 && Math.abs(s.lng) <= 1);
const FS_PIN_COLOR = { ok: "var(--tint-ok-tx)", warn: "var(--tint-amber-tx)", off: "var(--text-3)", lost: "var(--tint-red-tx)", wait: "var(--border-strong)", none: "var(--border-strong)" };
const fsEsc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function FsSitesMap({ sites, live, onOpen, isMobile }) {
  const box = React.useRef(null), mapRef = React.useRef(null), layer = React.useRef(null), fitted = React.useRef(false);
  const openRef = React.useRef(onOpen); openRef.current = onOpen;
  const pts = React.useMemo(() => sites.filter((s) => fsGeoOk(s)), [sites]);
  React.useEffect(() => {
    if (!window.L || !box.current || mapRef.current) return;
    const map = window.L.map(box.current, { scrollWheelZoom: false, zoomControl: true }).setView([13.7, 100.6], 6);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
    layer.current = window.L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; layer.current = null; fitted.current = false; };
  }, []);
  React.useEffect(() => {
    const L = window.L, map = mapRef.current;
    if (!L || !map || !layer.current) return;
    layer.current.clearLayers();
    pts.forEach((s) => {
      const kwp = +s.capacity_kw || 0, sz = Math.round(Math.max(11, Math.min(30, 9 + Math.sqrt(kwp) * 0.75)));
      const lv = live[s.id], hk = fsHealthKey(s);
      const html = '<span class="fs-pin' + (lv > 0.05 && hk === "ok" ? " live" : "") + '" style="width:' + sz + "px;height:" + sz + "px;background:" + FS_PIN_COLOR[hk] + '"></span>';
      const icon = L.divIcon({ className: "", html, iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] });
      L.marker([+s.lat, +s.lng], { icon, keyboard: false })
        .bindTooltip("<b>" + fsEsc(s.name || s.id) + "</b><br>" + fsFmt(kwp, 0) + " kWp · " + FS_HEALTH[hk].th
          + (lv != null ? "<br>ตอนนี้ " + fsFmt(lv, 1) + " kW" : "") + (fsN(s.day_kwh) != null ? " · วันนี้ " + fsFmt(s.day_kwh, 0) + " kWh" : ""), { direction: "top", offset: [0, -sz / 2] })
        .on("click", () => openRef.current(s.id))
        .addTo(layer.current);
    });
    if (pts.length && !fitted.current) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(pts.map((s) => [+s.lat, +s.lng])), { padding: [26, 26], maxZoom: 12 });
    }
  }, [pts, live]);
  if (!window.L) return null;
  return (
    <FsCard title="แผนที่ไซต์" sub={pts.length + " จาก " + sites.length + " ไซต์มีพิกัด"}>
      <div ref={box} style={{ height: isMobile ? 280 : 380, borderRadius: "var(--r-tile)", overflow: "hidden", isolation: "isolate", background: "var(--surface2)" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 9, fontSize: 11.5, color: "var(--text-2)" }}>
        {["ok", "warn", "off", "lost"].map((k) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 5, background: FS_PIN_COLOR[k] }} />{FS_HEALTH[k].th}</span>
        ))}
        <span style={{ color: "var(--text-3)" }}>วงใหญ่ = กำลังติดตั้งมาก · วงกระเพื่อม = กำลังผลิตอยู่ · กดที่วง = เปิดไซต์</span>
      </div>
    </FsCard>
  );
}

/* ── การ์ดไซต์: ชื่อ · ผลิตวันนี้ตัวใหญ่ตัวเดียว · แถบเทียบเพื่อน — ที่เหลือดูในหน้ารายละเอียด ── */
function FsSiteCard({ s, lv, issues, maxYield, medMonth, onOpen }) {
  const cap = fsN(s.capacity_kw), y = fsYield(s), hk = fsHealthKey(s);
  const low = medMonth && fsMonthYield(s) != null && fsMonthYield(s) < medMonth * 0.6;
  const bad = issues && issues.some((x) => x.tone === "bad");
  const day = fsN(s.day_kwh);
  return (
    <button type="button" onClick={() => onOpen(s.id)} className="fs-card-hov"
      style={{ textAlign: "left", border: "none", background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)",
        padding: "14px 16px", fontFamily: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span title={FS_HEALTH[hk].th} style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: FS_PIN_COLOR[hk] }} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name || "(ไม่มีชื่อ)"}</div>
        <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{cap ? fsFmt(cap, cap >= 100 ? 0 : 1) + " kWp" : ""}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: day == null ? "var(--text-3)" : "var(--text-1)", lineHeight: 1.15 }}>{day == null ? "–" : fsFmt(day, day >= 100 ? 0 : 1)}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>kWh วันนี้</span>
        {lv != null && lv > 0.05 && <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>ตอนนี้ {fsFmt(lv, lv >= 100 ? 0 : 1)} kW</span>}
      </div>
      {issues ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, color: bad ? "var(--tint-red-tx)" : "var(--tint-amber-tx)", fontWeight: 600, minWidth: 0 }}>
          <Icon name="alert" size={13} color="currentColor" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{issues[0].text}{issues.length > 1 ? " · +" + (issues.length - 1) : ""}</span>
        </div>
      ) : y != null ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}><FsMeter value={y} max={maxYield} h={4} tone={low ? "var(--tint-amber-tx)" : "var(--primary)"} /></div>
          <span style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{fsFmt(y, 2)} ต่อ kWp</span>
        </div>
      ) : <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{FS_HEALTH[hk].th}</div>}
    </button>
  );
}

/* ── ตารางไซต์ (มุมมองหลักบนจอคอม) — ไม่มีเส้น แถวสลับสีอ่อน · ตัวเลขชิดขวาทศนิยมเท่ากันทั้งคอลัมน์ · ที่อยู่ดูใน tooltip/หน้ารายละเอียด ── */
const FS_COLS = [
  { key: "name", th: "ไซต์" },
  { key: "health", th: "สถานะ" },
  { key: "kw", th: "ขนาด", unit: "kWp", num: true },
  { key: "now", th: "ตอนนี้", unit: "kW", num: true },
  { key: "day", th: "วันนี้", unit: "kWh", num: true },
  { key: "yield", th: "ต่อ kWp วันนี้", unit: "kWh/kWp", num: true },
  { key: "month", th: "เดือนนี้", unit: "kWh", num: true },
  { key: "total", th: "สะสม", unit: "MWh", num: true },
  { key: "at", th: "อัปเดต" },
];
function FsSitesTable({ rows, live, issueMap, maxYield, medMonth, sort, onSort, onOpen }) {
  const th = (c) => ({ padding: "12px 14px 10px", textAlign: c.num ? "right" : "left",
    fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", color: sort.k === c.key ? "var(--primary-dark)" : "var(--text-3)",
    boxShadow: "inset 0 -1px 0 var(--divider)" });
  const N = (v, d) => (v == null ? <span style={{ color: "var(--text-3)" }}>–</span> : fsFmt(v, d));
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
        <thead>
          <tr>
            {FS_COLS.map((c) => (
              <th key={c.key} onClick={() => onSort(c.key)} style={th(c)}>
                {c.th}{c.unit && <span style={{ fontWeight: 500, color: "var(--text-3)", marginLeft: 4 }}>{c.unit}</span>}
                <span style={{ display: "inline-block", width: 10, marginLeft: 2 }}>{sort.k === c.key ? (sort.dir > 0 ? "↑" : "↓") : ""}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const hk = fsHealthKey(s), dim = hk === "off" || hk === "lost" || hk === "none";
            const y = fsYield(s), lv = live[s.id], iss = issueMap[s.id];
            const low = medMonth && fsMonthYield(s) != null && fsMonthYield(s) < medMonth * 0.6;
            const td = { padding: "11px 14px", verticalAlign: "middle", background: i % 2 ? "var(--fs-zebra)" : "transparent" };
            const nm = Object.assign({}, td, { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: dim ? "var(--text-3)" : "var(--text-1)" });
            return (
              <tr key={s.id} onClick={() => onOpen(s.id)} className="fs-row" style={{ cursor: "pointer" }}>
                <td style={Object.assign({}, td, { maxWidth: 300 })} title={s.address || ""}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name || "(ไม่มีชื่อ)"}</span>
                    {iss && <span title={iss.map((x) => x.text).join("\n")} style={{ display: "flex", flexShrink: 0 }}><Icon name="alert" size={13} color={iss.some((x) => x.tone === "bad") ? "var(--tint-red-tx)" : "var(--tint-amber-tx)"} /></span>}
                    {Object.keys(s.jobIds || {}).length > 0 && <span title={"ผูกงาน " + Object.keys(s.jobIds).length + " งาน"} style={{ display: "flex", flexShrink: 0 }}><Icon name="link" size={12} color="var(--text-3)" /></span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 1 }}>
                    {s.fusionsolar_station_code || "ไม่มี station code"}{s.source === "manual" ? " · เพิ่มเอง" : ""}
                  </div>
                </td>
                <td style={Object.assign({}, td, { whiteSpace: "nowrap" })}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: FS_PIN_COLOR[hk] }} />{FS_HEALTH[hk].th}
                  </span>
                </td>
                <td style={nm}>{N(fsN(s.capacity_kw), 1)}</td>
                <td style={nm}>{lv != null && lv > 0.05 ? <span style={{ fontWeight: 700 }}>{fsFmt(lv, lv >= 100 ? 0 : 1)}</span> : N(lv == null ? null : 0, 0)}</td>
                <td style={Object.assign({}, nm, { fontWeight: 700 })}>{N(fsN(s.day_kwh), 1)}</td>
                <td style={nm}>
                  {y == null ? N(null) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                      <div style={{ width: 56 }}><FsMeter value={y} max={maxYield} h={6} tone={low ? "var(--tint-amber-tx)" : "var(--primary)"} /></div>
                      <span style={{ minWidth: 34 }}>{fsFmt(y, 2)}</span>
                    </div>
                  )}
                </td>
                <td style={nm}>{N(fsN(s.month_kwh), 0)}</td>
                <td style={nm}>{N(fsN(s.total_kwh) == null ? null : s.total_kwh / 1000, 1)}</td>
                <td style={Object.assign({}, td, { color: "var(--text-3)", whiteSpace: "nowrap", fontSize: 12 })} title={fsWhen(s.kpi_updated_at || s.last_synced_at)}>
                  {fsAgo(s.kpi_updated_at || s.last_synced_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <div style={{ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ไม่พบไซต์ที่ตรงกับตัวกรอง</div>}
    </div>
  );
}

/* ── ส่งออก Excel: ทุกไซต์ (สรุป · รายไซต์ · รายวัน) หรือไซต์เดียว (รายวัน · รายเดือน · อุปกรณ์) ── */
function FsExportDialog({ sites, site, devs, onClose }) {
  const now = fsBkk(Date.now()).mon;
  const months = React.useMemo(() => {
    const [y, m] = now.split("-").map(Number), out = [];
    for (let i = 0; i < 12; i++) out.push(new Date(Date.UTC(y, m - 1 - i, 1)).toISOString().slice(0, 7));
    return out;
  }, [now]);
  const [mon, setMon] = React.useState(months[0]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const go = async () => {
    setBusy(true); setMsg(null);
    try {
      if (site) { await window.fsExportSiteXlsx(site, devs, mon); setMsg({ ok: true, text: "ดาวน์โหลดไฟล์แล้ว" }); }
      else { const r = await window.fsExportMonthXlsx(sites, mon); setMsg({ ok: true, text: "ดาวน์โหลดแล้ว · " + r.sites + " ไซต์ · " + fsEnergy(r.kwh).join(" ") }); }
    } catch (e) { setMsg({ ok: false, text: e.message || String(e) }); }
    setBusy(false);
  };
  const sheets = site
    ? [["calendar", "รายวัน", "ผลิตแต่ละวันของเดือน · kWh/kWp · ชั่วโมงเริ่ม/หยุด"], ["chart", "รายเดือน", "ย้อนหลังสูงสุด 24 เดือน · CO₂"], ["box", "อุปกรณ์", "รุ่น · SN · ผลิตสะสม"]]
    : [["chart", "สรุป", "ผลิตรวม · เฉลี่ยต่อ kWp · CO₂ · อันดับสูงสุด/ต่ำสุด"], ["list", "รายไซต์", "ทุกไซต์ · kWh/kWp/วัน · % ของค่ากลาง · สถานะ"], ["calendar", "รายวัน", "ตารางไซต์ × วัน พร้อมยอดรวม"]];
  return (
    <FsModal width={520} onClose={onClose} title={site ? "ส่งออก Excel — " + (site.name || site.id) : "สรุปรายเดือนเป็น Excel"}
      sub="ไฟล์ .xlsx เปิดได้ใน Excel / Google Sheets"
      foot={<React.Fragment>
        <button className="btn" onClick={onClose}>ปิด</button>
        <button className="btn btn-pri" disabled={busy} onClick={go} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="download" size={14} color="#fff" />{busy ? "กำลังสร้างไฟล์…" : "ดาวน์โหลด " + fsMonTH(mon)}
        </button>
      </React.Fragment>}>
      <div>
        <div style={FS_LBL}>เลือกเดือน</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {months.map((k) => (
            <button key={k} type="button" onClick={() => setMon(k)}
              style={{ padding: "8px 4px", border: "none", borderRadius: "var(--r-chip)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: mon === k ? "var(--primary-soft)" : "var(--surface2)", color: mon === k ? "var(--primary-dark)" : "var(--text-2)",
                boxShadow: mon === k ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)" }}>
              {fsMonTH(k)}{k === now ? <span style={{ display: "block", fontSize: 9.5, fontWeight: 600, opacity: 0.75 }}>ยังไม่จบเดือน</span> : null}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={FS_LBL}>ในไฟล์มี</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sheets.map(([ic, th, desc]) => (
            <div key={th} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 12px", background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)" }}>
              <span style={{ width: 30, height: 30, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={ic} size={15} color="var(--primary-dark)" />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>แผ่น "{th}"</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>ตัวเลขรายวันมาจากประวัติที่ระบบเก็บเอง (เริ่มนับตั้งแต่ซิงก์ข้อมูลผลิตครั้งแรก) · เดือนที่ยังไม่มีประวัติจะว่าง</div>
      </div>
      {msg && <div style={{ padding: "10px 12px", borderRadius: "var(--r-tile)", fontSize: 12.5, fontWeight: 700,
        background: msg.ok ? "var(--tint-ok-bg)" : "var(--tint-red-bg)", color: msg.ok ? "var(--tint-ok-tx)" : "var(--tint-red-tx)" }}>{msg.text}</div>}
    </FsModal>
  );
}

const fsLoadPref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
const fsSavePref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ไม่มีที่เก็บ — ไม่เป็นไร */ } };

function FsSitesView({ jobs, role, currentUser, onOpenJob, onOpenOm }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const isMid = window.matchMedia("(max-width: 1100px)").matches;
  const { sites, all, loading } = useFsSites();
  const [q, setQ] = React.useState("");
  const [health, setHealth] = React.useState("all");
  const [src, setSrc] = React.useState("all");
  const [sort, setSort] = React.useState({ k: "name", dir: 1 });
  const [open, setOpen] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [view, setViewRaw] = React.useState(() => fsLoadPref("fsSitesView", "table"));
  const setView = (v) => { setViewRaw(v); fsSavePref("fsSitesView", v); };
  const canWrite = window.can ? window.can(role, "om") : true;
  const { val: devVal } = useFsNode("fsDevices");

  /* เรื่องที่ควรดูของทุกไซต์ (ตัวตรวจชุดเดียวกับหน้ารายละเอียด) + ค่ากลางผลิตต่อ kWp ไว้หาไซต์ที่ผลิตต่ำกว่าเพื่อน */
  const yields = React.useMemo(() => sites.filter((s) => +s.health_state === 3).map(fsMonthYield).filter((v) => v != null), [sites]);
  const medMonth = yields.length >= 3 ? fsMedian(yields) : null;
  const byDev = React.useMemo(() => {
    const by = {};
    Object.keys(devVal || {}).forEach((k) => { const d = Object.assign({ id: k }, devVal[k]); if (d.site_id) (by[d.site_id] = by[d.site_id] || []).push(d); });
    return by;
  }, [devVal]);
  const issueMap = React.useMemo(() => {
    const m = {};
    sites.forEach((s) => { const l = fsSiteIssues(s, byDev[s.id] || [], { medMonth }); if (l.length) m[s.id] = l; });
    return m;
  }, [sites, byDev, medMonth]);
  /* กำลังผลิตตอนนี้ของแต่ละไซต์ = รวม active_power ของอินเวอร์เตอร์ · ไซต์ที่ข้อมูลค้างเกิน 3 ชม./ออฟไลน์ ไม่นับ */
  const live = React.useMemo(() => {
    const m = {};
    sites.forEach((s) => {
      const at = Date.parse(s.kpi_updated_at || "");
      if (!at || Date.now() - at > 3 * 3600e3 || +s.health_state === 1 || s.fs_status === "not_found_in_fusionsolar") return;
      (byDev[s.id] || []).forEach((d) => {
        const t = +d.dev_type_id; if (t !== 1 && t !== 38) return;
        const p = fsN(fsKpi(d).active_power); if (p != null) m[s.id] = (m[s.id] || 0) + p;
      });
    });
    return m;
  }, [sites, byDev]);
  const nowKw = Object.keys(live).length ? Object.keys(live).reduce((a, k) => a + live[k], 0) : null;
  const attention = React.useMemo(() => sites.filter((s) => issueMap[s.id]).map((s) => ({ s, list: issueMap[s.id] }))
    .sort((a, b) => (b.list.some((x) => x.tone === "bad") - a.list.some((x) => x.tone === "bad")) || b.list.length - a.list.length), [sites, issueMap]);
  const maxYield = Math.max.apply(null, sites.map(fsYield).filter((v) => v != null).concat([0.001]));

  const roll = React.useMemo(() => {
    const r = { n: 0, kw: 0, day: 0, month: 0, total: 0, kwOn: 0, off: 0, warn: 0, lost: 0 };
    sites.forEach((s) => {
      r.n++; r.kw += +s.capacity_kw || 0; r.total += +s.total_kwh || 0;
      if (s.fs_status !== "not_found_in_fusionsolar") { r.day += +s.day_kwh || 0; r.month += +s.month_kwh || 0; if (fsN(s.day_kwh) != null) r.kwOn += +s.capacity_kw || 0; }
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
      const x = fsSortVal(a, sort.k, live), y = fsSortVal(b, sort.k, live);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir || String(a.name).localeCompare(String(b.name), "th");
    });
    return out;
  }, [sites, q, health, src, sort, live]);

  const pickSort = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: FS_COLS.find((c) => c.key === k).num ? -1 : 1 }));
  const cur = all.find((s) => s.id === open) || null;
  const lastAt = sites.reduce((m, s) => Math.max(m, Date.parse(s.kpi_updated_at || "") || 0), 0);
  const hasGeo = sites.some((s) => fsGeoOk(s));
  const mapView = view === "map" && hasGeo;
  const cardView = !mapView && (isMobile || view !== "table");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      {sites.length > 0 && <FsFleetHero roll={roll} nowKw={nowKw} liveN={Object.keys(live).length} lastAt={lastAt} isMobile={isMobile}
        hCount={hCount} health={health} onHealth={setHealth} />}

      {sites.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile || isMid ? "1fr" : "minmax(0,1.3fr) minmax(0,1fr)", gap: 12, alignItems: "start" }}>
          {attention.length ? <FsAttention items={attention} onOpen={setOpen} /> : (
            <FsCard title="ต้องดูแล"><div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700 }}>
              <Icon name="check" size={16} color="currentColor" />ทุกไซต์ปกติ ไม่มีเรื่องต้องดู</div></FsCard>
          )}
          <FsRanking sites={sites} live={live} onOpen={setOpen} />
        </div>
      )}

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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {window.Segmented && <window.Segmented flat value={view} onChange={setView} options={[{ value: "card", label: "การ์ด" }].concat(isMobile ? [] : [{ value: "table", label: "ตาราง" }], hasGeo ? [{ value: "map", label: "แผนที่" }] : [])} />}
          {sites.length > 0 && (
            <button className="btn" onClick={() => setExporting(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="download" size={14} /><span>{isMobile ? "Excel" : "สรุปรายเดือน Excel"}</span>
            </button>
          )}
          {canWrite && (
            <button className="btn-add" onClick={() => setAdding(true)}>
              <Icon name="plus" size={15} color="#fff" /><span>เพิ่มไซต์เอง</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>กำลังโหลด…</div>
      ) : !sites.length ? (
        <div style={{ padding: "34px 20px", textAlign: "center", background: "var(--surface)", boxShadow: "var(--shadow-sm)",
          borderRadius: "var(--r-card)", color: "var(--text-2)", fontSize: 13 }}>
          ยังไม่มีไซต์ — แอดมินกด "ซิงก์ตอนนี้" ในเมนูตั้งค่า → ซิงก์ FusionSolar หรือเพิ่มไซต์เอง
        </div>
      ) : mapView ? (
        <FsSitesMap sites={rows} live={live} onOpen={setOpen} isMobile={isMobile} />
      ) : cardView ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(258px, 1fr))", gap: 10 }}>
            {rows.map((s) => <FsSiteCard key={s.id} s={s} lv={live[s.id]} issues={issueMap[s.id]} maxYield={maxYield} medMonth={medMonth} onOpen={setOpen} />)}
          </div>
          {!rows.length && <div style={{ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ไม่พบไซต์ที่ตรงกับตัวกรอง</div>}
        </div>
      ) : (
        <FsSitesTable rows={rows} live={live} issueMap={issueMap} maxYield={maxYield} medMonth={medMonth} sort={sort} onSort={pickSort} onOpen={setOpen} />
      )}

      {cur && <FsSiteModal site={cur} sites={all} medMonth={medMonth} jobs={jobs} canWrite={canWrite} currentUser={currentUser}
        onClose={() => setOpen(null)} onGo={(id) => setOpen(id)}
        onOpenJob={onOpenJob ? (id) => { setOpen(null); onOpenJob(id); } : null}
        onOpenOm={onOpenOm ? (id) => { setOpen(null); onOpenOm(id); } : null} />}
      {adding && <FsManualForm jobs={jobs} sites={all} currentUser={currentUser}
        onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); setOpen(id); }} />}
      {exporting && <FsExportDialog sites={sites} onClose={() => setExporting(false)} />}
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
   ลำดับ: เรื่องที่ควรดู → ตัวเลขหลัก → กราฟประวัติ → การไหลของพลังงาน → อุปกรณ์ → ข้อมูลไซต์/งาน/หมายเหตุ
   ตัวแปลค่าดิบ/กราฟอยู่ fusionsolar-viz.jsx
   ================================================================ */
const FS_DEV_RANK = { 1: 0, 38: 0, 47: 1, 17: 1, 39: 2, 41: 2 };
const fsDevRank = (t) => (FS_DEV_RANK[+t] != null ? FS_DEV_RANK[+t] : 3);

function FsIssues({ list }) {
  if (!list.length) return null;
  const bad = list.some((x) => x.tone === "bad");
  return (
    <div style={{ padding: "11px 14px", borderRadius: "var(--r-tile)", background: bad ? "var(--tint-red-bg)" : "var(--tint-amber-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: bad ? "var(--tint-red-tx)" : "var(--tint-amber-tx)", marginBottom: 5 }}>
        <Icon name="alert" size={15} color="currentColor" />ควรดู {list.length} เรื่อง
      </div>
      {list.map((x, i) => (
        <div key={i} style={{ display: "flex", gap: 7, fontSize: 12.5, color: "var(--text-1)", padding: "2px 0" }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0, background: x.tone === "bad" ? "var(--tint-red-tx)" : "var(--tint-amber-tx)" }} />
          <span>{x.text}</span>
        </div>
      ))}
    </div>
  );
}

/* กราฟประวัติ — ประวัติเริ่มนับจากวันที่ซิงก์ข้อมูลผลิตรอบแรก (Huawei ไม่ให้ย้อนหลังในรอบรายชั่วโมง) */
function FsHistoryCard({ site, isMobile }) {
  const [tab, setTab] = React.useState("day");
  const { val: dayVal } = useFsNode("fsKpiDay/" + site.id, 32);
  const { val: monVal } = useFsNode("fsKpiMonth/" + site.id, 13);
  const cap = fsN(site.capacity_kw);
  const now = fsBkk(Date.now());
  const perKwp = (v) => (cap > 0 && v != null ? fsFmt(v / cap, 2) + " kWh/kWp" : null);

  const today = React.useMemo(() => {
    const rec = (dayVal || {})[now.day] || {};
    const h = rec.h || {}, p = rec.p || {};
    const hours = Object.keys(h).map(Number).sort((a, b) => a - b);
    if (!hours.length) return { bars: [], pre: null };
    /* ข้อมูลย้อนหลังรายชั่วโมงมีตั้งแต่ตีหนึ่ง (ค่า 0 ตอนกลางคืน) — เริ่มแกนที่ชั่วโมงแรกที่ผลิตได้ ไม่เกิน 6 โมง */
    const lit = hours.filter((x) => fsN(h[String(x).padStart(2, "0")]) > 0);
    const from = Math.min(6, lit.length ? lit[0] : hours[0]), to = Math.max(18, hours[hours.length - 1]);
    const out = []; let prevH = null, prevV = 0, pre = null;
    for (let x = from; x <= to; x++) {
      const key = String(x).padStart(2, "0");
      const v = fsN(h[key]);
      let val = null, rng = key + ":00";
      /* ค่าแรกของวันที่มาหลัง 7 โมง = ยอดสะสมตั้งแต่เช้า (ยังไม่ได้เก็บรายชั่วโมง เช่นวันที่เริ่มซิงก์) — ไม่ลงเป็นแท่งชั่วโมงเดียว ไม่งั้นแท่งสูงผิด */
      if (v != null && prevH == null && x > 7 && v > 0) { pre = { h: key, v }; prevH = x; prevV = v; }
      else if (v != null) { val = Math.max(0, v - prevV); rng = String(prevH == null ? 0 : prevH).padStart(2, "0") + ":00–" + key + ":00"; prevH = x; prevV = v; }
      const pw = p[key] ? Object.keys(p[key]).reduce((s, k) => s + (+p[key][k] || 0), 0) : null;
      out.push({ k: key, label: key, value: val, partial: x === now.h,
        tip: ["ช่วง " + rng, v != null ? "รวมทั้งวันถึงตอนนั้น " + fsFmt(v, 1) + " kWh" : null, pw != null ? "กำลังตอนซิงก์ " + fsFmt(pw, 2) + " kW" : null].filter(Boolean) });
    }
    return { bars: out, pre };
  }, [dayVal, now.day, now.h]);

  const days = React.useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = fsBkk(Date.now() - i * 864e5).day;
      const rec = (dayVal || {})[d];
      let v = rec && fsN(rec.kwh);
      if (i === 0 && fsN(site.day_kwh) != null && (site.kpi_updated_at || "").length && fsBkk(Date.parse(site.kpi_updated_at)).day === d) v = +site.day_kwh;
      out.push({ k: d, label: String(+d.slice(8)), value: v == null ? null : v, partial: i === 0, tip: [fsDayTH(d), perKwp(v)].filter(Boolean) });
    }
    return out;
  }, [dayVal, site.day_kwh, site.kpi_updated_at]);
  const dayDone = days.filter((b) => !b.partial && b.value != null);
  const dayAvg = dayDone.length >= 3 ? dayDone.reduce((s, b) => s + b.value, 0) / dayDone.length : null;

  const mons = React.useMemo(() => {
    const out = [];
    const [y, m] = now.mon.split("-").map(Number);
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(Date.UTC(y, m - 1 - i, 1));
      const key = dt.toISOString().slice(0, 7);
      let v = fsN((monVal || {})[key]);
      if (i === 0 && fsN(site.month_kwh) != null) v = +site.month_kwh;
      out.push({ k: key, label: FS_MON_TH[+key.slice(5) - 1].replace(".", "").slice(0, 3), value: v, partial: i === 0, tip: [fsMonTH(key), perKwp(v)].filter(Boolean) });
    }
    return out;
  }, [monVal, site.month_kwh, now.mon]);
  const monDone = mons.filter((b) => !b.partial && b.value != null);
  const monAvg = monDone.length >= 2 ? monDone.reduce((s, b) => s + b.value, 0) / monDone.length : null;

  const firstDay = Object.keys(dayVal || {}).sort()[0];
  const sub = tab === "day" ? "พลังงานที่ผลิตแต่ละชั่วโมงของวันนี้ (" + fsDayTH(now.day) + ")"
    : tab === "30" ? "ผลิตต่อวัน 30 วันล่าสุด" : "ผลิตต่อเดือน 12 เดือนล่าสุด";
  const seg = window.Segmented ? (
    <window.Segmented flat value={tab} onChange={setTab} options={[{ value: "day", label: "วันนี้" }, { value: "30", label: "30 วัน" }, { value: "12", label: "12 เดือน" }]} />
  ) : null;
  /* ตัวเลขหัวกราฟตามช่วงที่เลือก — ตัวแรกตัวใหญ่ (แบบอ้างอิง Lumos/Solis) */
  const best = (list) => list.reduce((a, b) => (b.value != null && !b.partial && (!a || b.value > a.value) ? b : a), null);
  const sum = (list) => { const v = list.filter((b) => b.value != null); return v.length ? v.reduce((s, b) => s + b.value, 0) : null; };
  const dayNow = days[days.length - 1].value;
  const stats = tab === "day" ? (() => {
    const b = best(today.bars);
    return [{ icon: "sun", l: "ผลิตวันนี้", v: dayNow, u: "kWh", s: perKwp(dayNow) },
      { icon: "bolt", l: "ชั่วโมงที่ผลิตมากสุด", v: b && b.value, u: "kWh", s: b ? b.tip[0] : null },
      { icon: "trend", l: "เทียบเฉลี่ยรายวัน", v: dayAvg && dayNow != null ? Math.round((dayNow / dayAvg) * 100) : null, u: "%", s: dayAvg ? "เฉลี่ย " + fsFmt(dayAvg, 1) + " kWh · วันนี้ยังไม่จบ" : "ต้องมีประวัติอย่างน้อย 3 วัน" }];
  })() : tab === "30" ? (() => {
    const b = best(days);
    return [{ icon: "calendar", l: "รวม 30 วัน", v: sum(days), u: "kWh", s: perKwp(sum(days)) },
      { icon: "chart", l: "เฉลี่ยต่อวัน", v: dayAvg, u: "kWh", s: dayAvg ? "นับเฉพาะวันที่ครบวัน" : "ต้องมีประวัติอย่างน้อย 3 วัน" },
      { icon: "sparkle", l: "วันที่ผลิตมากสุด", v: b && b.value, u: "kWh", s: b ? b.tip[0] : null }];
  })() : (() => {
    const b = best(mons);
    return [{ icon: "calendar", l: "รวม 12 เดือน", v: sum(mons), u: "kWh", s: perKwp(sum(mons)) },
      { icon: "chart", l: "เฉลี่ยต่อเดือน", v: monAvg, u: "kWh", s: monAvg ? "นับเฉพาะเดือนที่ครบเดือน" : "ต้องมีประวัติอย่างน้อย 2 เดือน" },
      { icon: "sparkle", l: "เดือนที่ผลิตมากสุด", v: b && b.value, u: "kWh", s: b ? b.tip[0] : null }];
  })();
  const big = (v) => (v != null && v >= 10000 ? [v / 1000, "MWh"] : [v, null]);
  const C = window.FsTrendChart;
  const dot = (bg, op) => <span style={{ width: 10, height: 10, borderRadius: 5, background: bg, opacity: op || 1 }} />;
  return (
    <FsCard title="ประวัติการผลิต" sub={isMobile ? null : sub} right={seg}>
      {isMobile && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: -4, marginBottom: 8 }}>{sub}</div>}
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1.25fr 1fr 1fr", gap: isMobile ? 10 : 0, margin: "4px 0 14px" }}>
        {stats.map((x, i) => {
          const [v, u] = big(x.v);
          return (
            <div key={x.l} style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0, gridColumn: isMobile && !i ? "1 / -1" : "auto",
              padding: isMobile || !i ? 0 : "0 0 0 16px", boxShadow: !isMobile && i ? "inset 1px 0 0 var(--divider)" : "none" }}>
              <span style={{ width: i ? 30 : 38, height: i ? 30 : 38, borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0,
                background: i ? "var(--surface2)" : "color-mix(in srgb, var(--fs-sun) 16%, var(--surface))", boxShadow: i ? "var(--shadow-inset)" : "none" }}>
                <Icon name={x.icon} size={i ? 15 : 19} color={i ? "var(--text-2)" : "var(--fs-sun)"} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)" }}>{x.l}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: i ? 19 : 28, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.15, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {v == null ? "–" : <FsCountUp value={v} digits={x.u === "%" ? 0 : u ? 2 : 1} />}
                  {v != null && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{u || x.u}</span>}
                </div>
                {x.s && <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.s}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {C && tab === "day" && <C mode="area" bars={today.bars.some((b) => b.value != null) ? today.bars : []} unit="kWh" height={isMobile ? 190 : 220}
        empty={today.pre ? "รายชั่วโมงจะเริ่มแสดงตั้งแต่ชั่วโมงถัดไป" : "ยังไม่มีข้อมูลรายชั่วโมงของวันนี้ — เก็บทุกครั้งที่ซิงก์ข้อมูลผลิต (ทุกชั่วโมง)"} />}
      {tab === "day" && today.pre && (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
          ก่อน {today.pre.h}:00 ผลิตไปแล้ว {fsFmt(today.pre.v, 1)} kWh — ช่วงนั้นยังไม่ได้เก็บรายชั่วโมง (เริ่มเก็บตอนซิงก์รอบแรกของวัน)
        </div>
      )}
      {C && tab === "30" && <C mode="bars" bars={days} unit="kWh" avg={dayAvg} avgLabel="เฉลี่ย" height={isMobile ? 190 : 220}
        empty="ยังไม่มีประวัติรายวัน — เริ่มเก็บตั้งแต่ซิงก์ข้อมูลผลิตรอบแรก" />}
      {C && tab === "12" && <C mode="bars" bars={mons} unit="kWh" avg={monAvg} avgLabel="เฉลี่ย" height={isMobile ? 190 : 220}
        empty="ยังไม่มีประวัติรายเดือน" />}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
        {tab === "day" ? (
          <React.Fragment>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 3, borderRadius: 2, background: "var(--fs-sun)" }} />ผลิตต่อชั่วโมง</span>
            {today.bars.some((b) => b.partial && b.value != null) && <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{dot("var(--fs-sun)")}ตอนนี้ (ชั่วโมงยังไม่จบ)</span>}
          </React.Fragment>
        ) : (
          <React.Fragment>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{dot("var(--fs-sun)")}ผลิตได้</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "repeating-linear-gradient(45deg, var(--fs-sun) 0 2px, color-mix(in srgb, var(--fs-sun) 30%, var(--surface)) 2px 4px)" }} />
              {tab === "30" ? "วันนี้" : "เดือนนี้"} (ยังไม่จบ)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 0, borderTop: "1.5px dashed var(--text-2)" }} />เฉลี่ย</span>
          </React.Fragment>
        )}
        {firstDay && <span style={{ marginLeft: "auto" }}>เก็บประวัติตั้งแต่ {fsDayTH(firstDay)}</span>}
      </div>
    </FsCard>
  );
}

/* ไฟที่ผลิตไปไหน · ไฟที่ใช้มาจากไหน — จากตัวเลขสะสมของมิเตอร์เทียบอินเวอร์เตอร์ (ภาพการไหลตอนนี้อยู่ใน FsHouseFlow)
   ซ้าย = แถบผลิต/ใช้ชิดซ้ายสเกลเดียวกัน (FsEnergyBalance) + ตัวเลข 3 ส่วน · ขวา = หน้าปัด 2 ตัว + ผลที่ได้ */
function FsEnergyCard({ em, isMobile }) {
  if (em.selfTotal == null || !window.FsEnergyBalance) return null;
  const pv = em.pvTotal, use = em.importTotal != null ? em.selfTotal + em.importTotal : null;
  const E = (v) => fsEnergy(v);
  /* ตัวเลข 3 ส่วนใช้หน่วยเดียวกัน (ไม่ให้ MWh ปน kWh) */
  const mwh = Math.max(em.selfTotal || 0, em.exportTotal || 0, em.importTotal || 0) >= 10000;
  const EP = (v) => (fsN(v) == null ? ["–", "kWh"] : mwh ? [fsFmt(v / 1000, 1), "MWh"] : [fsFmt(v, 1), "kWh"]);
  const co2 = (pv * FS_GRID_EF) / 1000;
  const parts = [
    { k: "self", c: "var(--fs-self)", l: "ใช้เองในอาคาร", v: em.selfTotal, s: Math.round(em.selfRate * 100) + "% ของที่ผลิต" + (use ? " · " + Math.round((em.selfTotal / use) * 100) + "% ของที่ใช้" : "") },
    { k: "exp", c: "var(--fs-exp)", l: "ขายเข้ากริด", v: em.exportTotal, s: pv > 0 ? Math.round(((em.exportTotal || 0) / pv) * 100) + "% ของที่ผลิต" : null },
  ].concat(use != null ? [{ k: "imp", c: "var(--fs-imp)", l: "ซื้อจากกริด", v: em.importTotal, s: Math.round((em.importTotal / use) * 100) + "% ของที่ใช้" }] : []);
  const tile = (icon, color, label, value, unit, sub) => (
    <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", borderRadius: "var(--r-tile)", padding: "10px 12px", minWidth: 0 }}>
      <span style={{ width: 30, height: 30, borderRadius: 15, display: "grid", placeItems: "center", flexShrink: 0, background: "color-mix(in srgb, " + color + " 16%, var(--surface))" }}>
        <Icon name={icon} size={15} color={color} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {value}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>
        </div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
      </div>
    </div>
  );
  return (
    <FsCard title="พลังงานไปไหน · มาจากไหน" sub="นับสะสมตั้งแต่ติดตั้ง">
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.6fr) minmax(260px, 1fr)", gap: isMobile ? 18 : 0 }}>
        <div style={{ minWidth: 0, paddingRight: isMobile ? 0 : 22 }}>
          <window.FsEnergyBalance self={em.selfTotal} exp={em.exportTotal} imp={em.importTotal} compact={isMobile} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(" + parts.length + ", minmax(0, 1fr))", gap: isMobile ? 8 : 12, marginTop: 14 }}>
            {parts.map((p) => (
              <div key={p.k} style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: p.c, flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.l}</span>
                </div>
                <div style={{ fontFamily: "var(--display)", fontSize: isMobile ? 17 : 21, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {EP(p.v)[0]}<span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{EP(p.v)[1]}</span>
                </div>
                {p.s && <div style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.35 }}>{p.s}</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 12, paddingLeft: isMobile ? 0 : 22, boxShadow: isMobile ? "none" : "inset 1px 0 0 var(--divider)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FsGauge frac={em.selfRate} value={Math.round(em.selfRate * 100)} unit="%" size={128} color="var(--fs-self)" label="ใช้เองได้" sub="self-consumption" />
            <FsGauge frac={em.sufficiency} value={em.sufficiency != null ? Math.round(em.sufficiency * 100) : "–"} unit="%" size={128} color="var(--fs-sun)" label="พึ่งตัวเองได้" sub="self-sufficiency" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {tile("home", "var(--fs-self)", "ซื้อไฟลดลง", E(em.selfTotal)[0], E(em.selfTotal)[1], "ไฟโซลาร์ที่ใช้เอง")}
            {tile("sparkle", "var(--tint-ok-tx)", "ลด CO₂ สะสม", fsFmt(co2, 1), "ตัน", "≈ ต้นไม้ " + fsFmt((co2 * 1000) / FS_TREE_KG, 0) + " ต้น/ปี")}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12 }}>
        ถูกต้องเมื่อติดตั้งมิเตอร์พร้อมระบบ (ถ้าเพิ่มมิเตอร์ทีหลัง สัดส่วนใช้เองจะออกมาสูงกว่าจริง)
      </div>
    </FsCard>
  );
}

function FsDeviceCard({ d, em, isMobile }) {
  const k = fsKpi(d), t = +d.dev_type_id;
  const inv = t === 1 || t === 38;
  const st = inv ? fsInvState(fsN(k.inverter_state)) : null;
  let chip = null;
  if (d.fs_status === "not_found_in_fusionsolar") chip = <FsPill k="lost" />;
  else if (st) chip = <FsChip tone={st[1]}>{st[0]}</FsChip>;
  else if (t === 39 && k.battery_status != null) chip = <FsChip tone={+k.battery_status === 3 ? "bad" : +k.battery_status === 2 ? "ok" : "idle"}>{fsKpiValue("battery_status", k.battery_status)}</FsChip>;
  else if (k.run_state != null) chip = <FsChip tone={+k.run_state === 1 ? "ok" : "bad"}>{fsKpiValue("run_state", k.run_state)}</FsChip>;
  return (
    <FsDevBox d={d} chip={chip}>
      {inv ? <FsInverterBody d={d} k={k} isMobile={isMobile} />
        : t === 47 || t === 17 ? <FsMeterBody d={d} k={k} em={em} isMobile={isMobile} />
        : t === 39 ? <FsBatteryBody k={k} em={em} isMobile={isMobile} />
        : window.FsKvGroups ? <window.FsKvGroups k={k} /> : <FsKv k={k} />}
    </FsDevBox>
  );
}

function FsSiteModal({ site, sites, medMonth, jobs, canWrite, currentUser, onClose, onGo, onOpenJob, onOpenOm }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { val: devVal } = useFsNode("fsDevices");
  const { val: omVal } = useFsNode("omSites");
  const { val: dayVal } = useFsNode("fsKpiDay/" + site.id, 31);
  const hk = fsHealthKey(site);
  const code = site.fusionsolar_station_code || "";
  const devs = React.useMemo(() => Object.keys(devVal || {}).map((k) => Object.assign({ id: k }, devVal[k]))
    .filter((d) => d.site_id === site.id || (code && d.station_code === code))
    .sort((a, b) => fsDevRank(a.dev_type_id) - fsDevRank(b.dev_type_id) || String(a.dev_name).localeCompare(String(b.dev_name))), [devVal, site.id, code]);
  const jobById = React.useMemo(() => { const m = {}; (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; }); return m; }, [jobs]);
  const linked = Object.keys(site.jobIds || {});
  const stageTH = (k) => (((window.SF && window.SF.STAGES) || []).find((s) => s.key === k) || {}).th || k || "";
  const em = React.useMemo(() => fsEnergyModel(site, devs), [site, devs]);
  /* ประเภทที่มีเกิน 8 ตัวและไม่ใช่อินเวอร์เตอร์/มิเตอร์/แบต รวมเป็นการ์ดเดียว (ออปติไมเซอร์ไม่ซิงก์มาแล้ว — SKIP_TYPES) */
  const devGroups = React.useMemo(() => {
    const byT = {};
    devs.forEach((d) => { (byT[d.dev_type_id] = byT[d.dev_type_id] || []).push(d); });
    const single = [], bulk = [];
    Object.keys(byT).forEach((t) => {
      const main = fsDevRank(t) < 3;
      if (!main && byT[t].length > 8) bulk.push({ type: +t, list: byT[t] });
      else single.push.apply(single, byT[t]);
    });
    single.sort((a, b) => fsDevRank(a.dev_type_id) - fsDevRank(b.dev_type_id) || String(a.dev_name).localeCompare(String(b.dev_name)));
    return { single, bulk };
  }, [devs]);
  const issues = React.useMemo(() => fsSiteIssues(site, devs, { medMonth }), [site, devs, medMonth]);

  /* ค่าเฉลี่ยวันที่ครบวันใน 30 วัน — ใช้เทียบ "วันนี้" ในตัวเลขหลัก */
  const today = fsBkk(Date.now()).day;
  const avg30 = React.useMemo(() => {
    const v = Object.keys(dayVal || {}).filter((d) => d !== today).map((d) => fsN(dayVal[d].kwh)).filter((x) => x != null);
    return v.length >= 3 ? v.reduce((s, x) => s + x, 0) / v.length : null;
  }, [dayVal, today]);
  const cap = fsN(site.capacity_kw);
  const dayK = fsN(site.day_kwh), monK = fsN(site.month_kwh), totK = fsN(site.total_kwh);
  const domDays = +fsBkk(Date.now()).day.slice(8);
  const staleH = site.kpi_updated_at ? (Date.now() - Date.parse(site.kpi_updated_at)) / 3600e3 : null;

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
  const tot = fsEnergy(totK);
  const [tab, setTab] = React.useState(code ? "over" : "info");
  const [exporting, setExporting] = React.useState(false);
  const co2 = totK != null ? (totK * FS_GRID_EF) / 1000 : null;

  return (
    <FsModal width={1000} onClose={onClose} title={site.name || "(ไม่มีชื่อ)"}
      sub={(code ? code : "ไม่มี station code") + " · " + fsNum(site.capacity_kw, 2) + " kWp" + (site.address ? " · " + site.address : "")}
      right={<div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><FsSrcChip s={site} /><FsPill k={hk} />
        {code && <button type="button" className="btn btn-sm" onClick={() => setExporting(true)} title="ส่งออก Excel ของไซต์นี้"
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="download" size={13} />Excel</button>}</div>}>

      {!code && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: "var(--r-tile)", background: "var(--surface2)" }}>
          <Icon name="alert" size={15} color="var(--text-3)" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ไม่มีข้อมูล FusionSolar</span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>ไซต์นี้ยังไม่ได้ผูก station code</span>
        </div>
      )}
      <FsIssues list={issues} />
      {site.fs_status === "not_found_in_fusionsolar" && (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: -6 }}>ข้อมูลเดิมยังอยู่ครบ (ไม่ลบ) · ค่าการผลิตด้านล่างเป็นค่าล่าสุดก่อนหาย</div>
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

      {/* ตอนนี้ (แผนภาพการไหล) + ตัวเลขผลิต 3 ตัว ในแผ่นเดียว */}
      {code && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 230px", background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)" }}>
          <div style={{ padding: isMobile ? "14px 12px 12px" : "18px 22px 14px", minWidth: 0 }}>
            {window.FsHouseFlow ? <window.FsHouseFlow em={em} site={site} compact={isMobile}
              at={site.kpi_updated_at ? "ข้อมูล ณ " + new Date(site.kpi_updated_at).toLocaleTimeString("th-TH", { timeStyle: "short", timeZone: "Asia/Bangkok" }) + " · " + fsAgo(site.kpi_updated_at) : "ยังไม่มีข้อมูลผลิต"} />
              : <FsEnergyFlow em={em} />}
            {staleH > 3 && <div style={{ fontSize: 11.5, color: "var(--tint-amber-tx)", fontWeight: 700, marginTop: 7 }}>ข้อมูลค้างเกิน 3 ชม. — แสดงค่าล่าสุดที่ได้รับ</div>}
          </div>
          <div className={isMobile ? "kpi-grid" : ""} style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "1fr", alignContent: "center",
            gap: isMobile ? 8 : 0, padding: isMobile ? "0 12px 14px" : "10px 22px", boxShadow: isMobile ? "none" : "inset 1px 0 0 var(--divider)" }}>
            {[
              ["ผลิตวันนี้", dayK == null ? "–" : <FsCountUp value={dayK} digits={dayK >= 1000 ? 0 : 1} />, "kWh",
                avg30 && dayK != null ? Math.round((dayK / avg30) * 100) + "% ของเฉลี่ย 30 วัน" : cap > 0 && dayK != null ? fsFmt(dayK / cap, 2) + " kWh/kWp" : null],
              ["ผลิตเดือนนี้", monK == null ? "–" : <FsCountUp value={monK} digits={0} />, "kWh", monK != null ? "เฉลี่ย " + fsFmt(monK / domDays, 1) + " kWh/วัน" : null],
              ["ผลิตสะสม", totK == null ? "–" : <FsCountUp value={totK >= 10000 ? totK / 1000 : totK} digits={1} />, tot[1], co2 != null ? "ลด CO₂ " + fsFmt(co2, 1) + " ตัน" : null],
            ].map(([l, v, u, sub], i) => (
              <div key={l} style={{ padding: isMobile ? 0 : "12px 0", boxShadow: !isMobile && i ? "inset 0 1px 0 var(--divider)" : "none", minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)" }}>{l}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: isMobile ? 18 : 24, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {v}{v !== "–" && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{u}</span>}
                </div>
                {sub && <div style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {window.Segmented && (
        <div style={{ display: "flex", overflowX: "auto" }}>
          <window.Segmented value={tab} onChange={setTab} options={[
            { value: "over", label: "ภาพรวม" },
            { value: "dev", label: "อุปกรณ์" + (devs.length ? " " + devs.length.toLocaleString("th-TH") : "") },
            { value: "info", label: "ข้อมูลและงาน" + (linked.length ? " (" + linked.length + ")" : "") }]} />
        </div>
      )}

      {tab === "over" && code && <FsHistoryCard site={site} isMobile={isMobile} />}
      {tab === "over" && <FsEnergyCard em={em} isMobile={isMobile} />}
      {tab === "over" && !code && <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "6px 2px" }}>ผูก station code ก่อนจึงจะมีข้อมูลการผลิต</div>}

      {/* อุปกรณ์ เรียง อินเวอร์เตอร์ → มิเตอร์ → แบต → อื่น ๆ */}
      {tab === "dev" && (
        <FsCard title="อุปกรณ์" sub={devs.length ? devs.length.toLocaleString("th-TH") + " ชิ้น" : (code ? "ยังไม่มีข้อมูลอุปกรณ์ — รอซิงก์รอบถัดไป" : "")}>
          {!devs.length ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>–</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {devGroups.single.map((d) => <FsDeviceCard key={d.id} d={d} em={em} isMobile={isMobile} />)}
              {devGroups.bulk.map((g) => <FsDevGroup key={g.type} type={g.type} list={g.list} />)}
            </div>
          )}
        </FsCard>
      )}

      {tab === "info" && (
        <FsCard title="ข้อมูลไซต์">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 9 }}>
            <FsSpec label="Station code" value={code || "–"} mono />
            <FsSpec label="แหล่งที่มา" value={site.source === "manual" ? "เพิ่มเองในเว็บ" : "FusionSolar"} />
            <FsSpec label="เชื่อมกริดเมื่อ" value={site.grid_date && Date.parse(site.grid_date) ? new Date(site.grid_date).toLocaleDateString("th-TH", { dateStyle: "medium" }) : "–"} />
            <FsSpec label="ซิงก์รายชื่อล่าสุด" value={fsWhen(site.last_synced_at)} />
          </div>
          {(site.address || fsGeoOk(site)) && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              {site.address && <div style={{ flex: "1 1 260px", fontSize: 12.5, color: "var(--text-2)" }}>{site.address}</div>}
              {fsGeoOk(site) && (
                <a className="btn btn-sm" href={"https://www.google.com/maps?q=" + site.lat + "," + site.lng} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Icon name="pin" size={13} />เปิดแผนที่</a>
              )}
            </div>
          )}
          {site.manual_saved && (site.manual_name || site.manual_address) && (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 8 }}>
              ค่าที่กรอกเองก่อนผูก FusionSolar: {[site.manual_name, site.manual_address, site.manual_capacity_kw ? site.manual_capacity_kw + " kWp" : ""].filter(Boolean).join(" · ")}
            </div>
          )}
        </FsCard>
      )}

      {/* งานในเว็บของไซต์นี้ — อ่านจากใบงานตามเดิม ไม่แก้ใบงาน */}
      {tab === "info" && (
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
      )}

      {tab === "info" && (
        <FsCard title="หมายเหตุ">
          <textarea value={note} disabled={!canWrite} onChange={(e) => setNote(e.target.value)} rows={2}
            onBlur={() => { if ((site.note || "") !== note) fsPatchSite(site.id, { note: note || null }); }}
            placeholder="บันทึกของทีมเกี่ยวกับไซต์นี้ (ซิงก์ไม่เขียนทับ)"
            style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--r-tile)", fontFamily: "inherit", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
        </FsCard>
      )}
      {exporting && <FsExportDialog site={site} devs={devs} onClose={() => setExporting(false)} />}
    </FsModal>
  );
}

/* อุปกรณ์จำนวนมากชนิดเดียวกัน — สรุปจำนวน/รุ่น กดดูรายชื่อ */
function FsDevGroup({ type, list }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const models = {};
  list.forEach((d) => { const m = d.model || "ไม่ทราบรุ่น"; models[m] = (models[m] || 0) + 1; });
  const lost = list.filter((d) => d.fs_status === "not_found_in_fusionsolar").length;
  const kw = q.trim().toLowerCase();
  const rows = list.filter((d) => !kw || [d.dev_name, d.esn_code, d.model].some((v) => String(v || "").toLowerCase().includes(kw)))
    .sort((a, b) => String(a.dev_name).localeCompare(String(b.dev_name), "th", { numeric: true }));
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{fsDevTypeTH(type)}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{list.length} ตัว</span>
        {lost > 0 && <FsChip tone="bad">ไม่พบใน FusionSolar {lost}</FsChip>}
        <button type="button" onClick={() => setOpen(!open)} style={{ marginLeft: "auto", border: "none", background: "transparent", padding: 0, cursor: "pointer",
          fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--primary)" }}>{open ? "ซ่อนรายชื่อ" : "ดูรายชื่อ"}</button>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
        {Object.keys(models).map((m) => m + " × " + models[m]).join(" · ")}
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          {list.length > 20 && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / SN"
            style={{ width: "100%", maxWidth: 280, padding: "8px 12px", borderRadius: "var(--r-tile)", fontSize: 12.5, fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box" }} />}
          <div style={{ maxHeight: 320, overflowY: "auto", borderRadius: "var(--r-tile)", background: "var(--surface2)" }}>
            {rows.slice(0, 300).map((d, i) => (
              <div key={d.id} style={{ display: "flex", gap: 10, padding: "5px 11px", fontSize: 11.5, borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <span style={{ flex: 1, minWidth: 0, color: "var(--text-1)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.dev_name || d.id}</span>
                <span style={{ fontFamily: "var(--mono)", color: "var(--text-3)", fontSize: 10.5 }}>{d.esn_code || ""}</span>
              </div>
            ))}
            {rows.length > 300 && <div style={{ padding: "6px 11px", fontSize: 11, color: "var(--text-3)" }}>แสดง 300 จาก {rows.length} — พิมพ์ค้นหาเพื่อกรอง</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function FsDevBox({ d, chip, children }) {
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: "12px 14px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{d.dev_name || d.id}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{fsDevTypeTH(d.dev_type_id)}</span>
        {chip}
        <span style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--text-3)" }} title={fsWhen(d.last_kpi_at)}>
          {d.last_kpi_at ? "ค่าเมื่อ " + fsAgo(d.last_kpi_at) : "ยังไม่มีค่า"}
        </span>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-3)", fontFamily: "var(--mono)", marginBottom: 11 }}>
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
const FS_JOB_TH = { all: "ทั้งหมด", sites: "ไซต์+อุปกรณ์", kpi: "ข้อมูลผลิต", hist: "ย้อนหลัง (กราฟ)" };
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
          + (job === "hist" ? "ดึงข้อมูลผลิตย้อนหลัง (รายเดือน 2 ปี · รายวัน 2 เดือน · รายชั่วโมงเมื่อวาน+วันนี้) เขียนเฉพาะ fsKpiDay / fsKpiMonth / fsSyncLogs · ไม่ครบในรอบเดียว = กดซ้ำจนงานค้างเป็น 0"
            : "เขียนเฉพาะ fsSites / fsDevices / fsSyncLogs ไม่แตะข้อมูลงาน") + " · ใช้เวลาราว 10–45 วินาที",
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
          <FsSpec label="ข้อมูลย้อนหลัง (กราฟ)" value={state.hist_done_at ? "ครบ · " + fsWhen(state.hist_done_at)
            : state.hist_cursor ? "ค้างคิวที่ " + state.hist_cursor + " — กดซ้ำ" : "ยังไม่ได้ดึง"} />
          <FsSpec label="สถานะ" value={blocked ? "พัก 407 ถึง " + new Date(state.blocked_until).toLocaleTimeString("th-TH", { timeStyle: "short" })
            : (state.lock ? "กำลังซิงก์…" : "พร้อม")} />
        </div>
        {isAdmin ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <FsChips value={job} onChange={setJob} options={[["all", FS_JOB_TH.all], ["sites", FS_JOB_TH.sites], ["kpi", FS_JOB_TH.kpi], ["hist", FS_JOB_TH.hist]]} />
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
                    {l.job === "hist" && <FsSpec label="ย้อนหลัง เดือน / วัน / ชั่วโมง" value={(l.hist_months || 0) + " / " + (l.hist_days || 0) + " / " + (l.hist_hours || 0)} />}
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
  (l.hist_months || l.hist_days || l.hist_hours) ? "ย้อนหลัง " + (l.hist_months || 0) + "/" + (l.hist_days || 0) + "/" + (l.hist_hours || 0) : "",
  l.pending ? "ค้าง " + l.pending : "",
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
        {L.job === "hist" && <FsSpec label="ย้อนหลัง เดือน / วัน / ชั่วโมง" value={(L.hist_months || 0) + " / " + (L.hist_days || 0) + " / " + (L.hist_hours || 0)} />}
        {L.job === "hist" && <FsSpec label="คิวที่ยังไม่ได้ทำ" value={L.pending || 0} />}
      </div>
      {p.hist && p.hist.length > 0 && (
        <div>
          <div style={FS_LBL}>ตัวอย่างข้อมูลย้อนหลัง</div>
          <div style={{ fontSize: 11.5, fontFamily: "var(--mono)", color: "var(--text-2)", display: "flex", flexDirection: "column", gap: 3 }}>
            {p.hist.slice(0, 12).map((k, i) => <div key={i} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {k.code + " " + k.name + " · " + ({ mon: "เดือน", day: "วัน", hour: "ชั่วโมง" }[k.kind] || k.kind) + " " + k.at + " · " + fsNum(k.kwh) + " kWh"}
            </div>)}
          </div>
        </div>
      )}
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

Object.assign(window, { fsKpi,
  FS_DEV_TYPES, fsDevTypeTH, fsHealthKey, useFsSites, fsMergeSites,
  FsSitesView, FsSiteModal, FsLogView,
});
