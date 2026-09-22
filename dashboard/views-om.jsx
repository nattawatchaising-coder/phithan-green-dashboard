/* ============================================================
   flash+solar — งานบริการหลังการขาย: หน้ารายการไซต์ · แผงไซต์ · ฟอร์มไซต์นอกระบบ

   ตรรกะทั้งหมดอยู่ใน om.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มยืมของรายงานประจำวัน (window.DrLabel / DrText / DrSection ฯลฯ)
   เพราะสองโมดูลนี้ต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   ตั้งชื่อ top-level ขึ้นต้นด้วย Om/om กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const OM_INPUT = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

/* ประเภทงาน — งานบ้านกับงานโครงการดูแลกันคนละแบบ (รอบเข้าตรวจ · คนที่ต้องติดต่อ · เอกสาร)
   ไซต์ที่มาจากใบงานตั้งต้นตาม job.type · ไซต์นอกระบบตั้งเอง · ใบงานเก่าที่ไม่มีค่าถือเป็นงานบ้าน */
const OM_SITE_TYPE = [
  { key: "home",    th: "งานบ้าน",    color: "#1B9B75" },
  { key: "project", th: "งานโครงการ", color: "#7C5CFC" },
];
const OM_SITE_TYPE_BY = {}; OM_SITE_TYPE.forEach((x) => { OM_SITE_TYPE_BY[x.key] = x; });
const omSiteType = (site, job) => ((site || {}).type || (job || {}).type) === "project" ? "project" : "home";
const omSiteTypeTH = (site, job) => OM_SITE_TYPE_BY[omSiteType(site, job)];

/* ป้ายสถานะกลม ๆ ใช้ทั้งในรายการและในแผงไซต์ */
function OmPill({ th, color, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      fontSize: 11.5, fontWeight: 700, color: color, background: color + "1a", borderRadius: 99, padding: "3px 10px" }}>
      {th}{sub && <span style={{ fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </span>
  );
}

function OmStat({ label, value, color, hint, on, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ flex: 1, minWidth: 108, textAlign: "left", padding: "11px 13px", borderRadius: 12, fontFamily: "inherit",
        background: on ? (color || "var(--primary)") + "14" : "var(--surface2)",
        border: "1px solid " + (on ? (color || "var(--primary)") : "var(--border)"),
        cursor: onClick ? "pointer" : "default" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: color, lineHeight: 1.2 }}>{value}</div>
      {hint && <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{hint}</div>}
    </button>
  );
}

/* ── แถบไทล์สถิติที่พับเก็บได้ ──
   ไทล์แปดช่องกินพื้นที่เกือบครึ่งจอ ทั้งที่ส่วนใหญ่เป็นเลข 0 ที่ไม่ต้องทำอะไร
   คนที่รู้อยู่แล้วว่าจะมาดูรายการข้างล่าง ควรพับเก็บทิ้งไว้ได้ถาวร
   พับแล้วยังเหลือบรรทัดเดียวที่โชว์เฉพาะช่องที่ "ไม่เป็นศูนย์" และยังกดกรองได้เหมือนเดิม
   จำค่าแยกตาม id — แถบบนกับแถบในแท็บพับคนละอันได้ */
function OmStatRow({ id, title, children }) {
  const key = "om-fold-" + id;
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem(key) !== "0"; } catch (e) { return true; }
  });
  const toggle = () => setOpen((o) => {
    const n = !o;
    try { localStorage.setItem(key, n ? "1" : "0"); } catch (e) { /* โหมดส่วนตัวเขียนไม่ได้ */ }
    return n;
  });

  const kids = React.Children.toArray(children).filter(Boolean);
  /* ตอนพับ เอาเฉพาะช่องที่มีค่า — ศูนย์แปลว่าไม่มีอะไรต้องทำ ไม่ต้องเปลืองที่บอก */
  const hot = kids.filter((c) => c && c.props && +c.props.value > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: open ? 9 : 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={toggle} title={open ? "พับเก็บแถบสรุป" : "กางแถบสรุป"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px 3px 5px", borderRadius: 99,
            border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
            fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="chevronDown" size={14} color="var(--text-3)"
            style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .18s" }} />
          {title || "สรุป"}
        </button>
        {!open && (hot.length ? hot.map((c, i) => {
          const p = c.props;
          return (
            <button key={i} type="button" onClick={p.onClick} disabled={!p.onClick}
              title={p.hint || p.label}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 99,
                border: "1px solid " + (p.on ? (p.color || "var(--primary)") : "var(--border)"),
                background: p.on ? (p.color || "var(--primary)") + "16" : "var(--surface2)",
                cursor: p.onClick ? "pointer" : "default", fontFamily: "inherit", fontSize: 11.5,
                fontWeight: 700, color: "var(--text-2)" }}>
              {p.label}
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 800, color: p.color }}>{p.value}</span>
            </button>
          );
        }) : (
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ไม่มีรายการค้าง</span>
        ))}
      </div>
      {open && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{children}</div>}
    </div>
  );
}

/* แถบเวลาประกันที่เหลือ — เห็นด้วยตาว่าเหลือมากน้อยแค่ไหน ไม่ต้องอ่านตัวเลข */
function OmWarrantyBar({ w }) {
  const st = window.omWarrantyState(w);
  const total = ((+w.years || 0) * 12 + (+w.months || 0)) * 30.4;
  const left = st.key === "expired" ? 0 : Math.max(0, Math.min(1, total ? st.days / total : 0));
  return (
    <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: (left * 100).toFixed(1) + "%", background: st.color, borderRadius: 99 }} />
    </div>
  );
}

/* ── ทะเบียนประกันของไซต์หนึ่ง ──
   แก้ตรงนี้ที่เดียว ไม่มีปุ่มบันทึกแยก — เขียนลงฐานข้อมูลทันทีแบบเดียวกับที่อื่นในระบบ */
function OmWarrantyTable({ site, disabled, onChange }) {
  const list = window.omWarrantyList(site);
  const setW = (id, fields) => {
    const w = Object.assign({}, site.warranties || {});
    w[id] = Object.assign({}, w[id], fields);
    onChange(w);
  };
  const add = () => {
    const id = window.omNewId("OW");
    const w = Object.assign({}, site.warranties || {});
    w[id] = { id, kind: "other", label: "", years: 1, months: 0, start: site.comDate || window.drToday(), note: "" };
    onChange(w);
  };
  const del = (id) => {
    const w = Object.assign({}, site.warranties || {});
    delete w[id];
    onChange(w);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!list.length && (
        <div style={{ padding: "14px 6px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีรายการประกัน</div>
      )}
      {list.map((w) => {
        const st = window.omWarrantyState(w);
        const kind = window.OM_WARRANTY_KIND_BY[w.kind] || window.OM_WARRANTY_KIND_BY.other;
        return (
          <div key={w.id} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: "11px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: kind.color, flexShrink: 0 }} />
              <input value={w.label || ""} disabled={disabled} placeholder="ชื่อรายการประกัน"
                onChange={(e) => setW(w.id, { label: e.target.value })}
                style={Object.assign({}, OM_INPUT, { flex: 1, minWidth: 130, width: "auto", padding: "7px 10px", fontSize: 13, fontWeight: 700 })} />
              <OmPill th={st.th} color={st.color} />
              {!disabled && (
                <button type="button" onClick={() => del(w.id)} title="ลบรายการประกันนี้"
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)",
                    cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                  <Icon name="trash" size={13} />
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))", gap: 8, marginBottom: 9 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>ประเภท</span>
                <select value={w.kind || "other"} disabled={disabled} onChange={(e) => setW(w.id, { kind: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5 })}>
                  {window.OM_WARRANTY_KIND.map((k) => <option key={k.key} value={k.key}>{k.th}</option>)}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>เริ่มคุ้มครอง</span>
                <input type="date" value={w.start || ""} disabled={disabled} onChange={(e) => setW(w.id, { start: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>กี่ปี</span>
                <input value={String(w.years == null ? "" : w.years)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => setW(w.id, { years: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>เพิ่มอีกกี่เดือน</span>
                <input value={String(w.months == null ? "" : w.months)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => setW(w.id, { months: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </label>
            </div>
            <OmWarrantyBar w={w} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                คุ้มครองถึง <b style={{ color: "var(--text-2)", fontFamily: "var(--mono)" }}>{st.end ? window.drDateTH(st.end) : "—"}</b>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color }}>{window.omWarrantyLeftTH(w)}</span>
            </div>
          </div>
        );
      })}
      {!disabled && (
        <button type="button" onClick={add}
          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
            border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="plus" size={14} /> เพิ่มรายการประกัน
        </button>
      )}
    </div>
  );
}

/* ── รอบล้างแผงของไซต์หนึ่ง ──
   ใบนัดเกิดตอนกดจองคิวเท่านั้น "วันครบรอบ" ที่ยังไม่จองเป็นค่าคำนวณสด ไม่ได้เก็บไว้
   ปิดงานแล้วรอบถัดไปจะเลื่อนเองเป็น วันที่ล้างจริง + รอบ (ไม่ใช่วันครบรอบเดิม)
   จะได้ไม่สะสมความคลาดเคลื่อนเวลาลูกค้าเลื่อนนัด */
function OmCleanVisits({ site, visits, store, disabled, siteVisits, onOpenVisit, onNewVisit }) {
  /* ใบรายงานที่ออกให้นัดล้างใบไหนแล้วบ้าง — นัดหนึ่งครั้งมีใบรายงานได้ใบเดียว */
  const svByClean = React.useMemo(() => {
    const m = {};
    (siteVisits || []).forEach((v) => { if (v.cleanId) m[v.cleanId] = v; });
    return m;
  }, [siteVisits]);
  const list = React.useMemo(() => (visits || []).slice()
    .sort((a, b) => String(b.date || b.due || "").localeCompare(String(a.date || a.due || ""))), [visits]);
  const cs = window.omCleanState(site, visits);
  const freeLeft = window.omFreeLeft(site, visits);
  const backlog = window.omCleanBacklog(site, visits);
  const open = window.omOpenVisit(visits);

  const book = () => {
    if (disabled) return;
    store.save(window.omBlankCleanVisit(site, cs.due || window.drToday(), visits, window.DR_ME && window.DR_ME.user));
  };
  const setV = (v, fields) => { if (!disabled) store.patch(site.id, v.id, fields); };
  /* ปิดงาน = บันทึกวันที่ล้างจริง แล้วหักโควตาฟรีถ้าครั้งนี้เป็นครั้งฟรี */
  const done = (v) => setV(v, { status: "done", date: v.date || window.drToday(),
    doneAt: new Date().toISOString(), doneBy: ((window.DR_ME || {}).user || {}).id || null });

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", flexWrap: "wrap",
        border: "1px solid " + cs.color + "40", background: cs.color + "12", borderRadius: 11, marginBottom: 12 }}>
        <Icon name="panel" size={16} color={cs.color} />
        <span style={{ flex: 1, minWidth: 150, fontSize: 12.5, color: "var(--text-1)" }}>
          <b style={{ color: cs.color }}>{cs.th}</b>
          {cs.due ? " · " + window.drDateTH(cs.due) : ""}
          {backlog > 1 ? " · ตกรอบไปแล้ว " + backlog + " ครั้ง" : ""}
          <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>
            ล้างฟรีเหลือ {freeLeft} ครั้ง จาก {omFreeTotal(site)} ครั้ง
            {window.omLastClean(visits) ? " · ล้างล่าสุด " + window.drShort(window.omLastClean(visits)) : " · ยังไม่เคยล้าง"}
          </span>
        </span>
        {!disabled && !open && (
          <button onClick={book}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none",
              background: cs.color, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="calendar" size={14} color="#fff" /> จองคิวล้าง
          </button>
        )}
      </div>

      {list.map((v) => {
        const s = window.omCleanStatusOf(v.status);
        const lock = disabled || v.status === "done";
        return (
          <div key={v.id} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)",
            padding: "10px 12px", marginBottom: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: lock ? 0 : 9, flexWrap: "wrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                {v.date ? window.drDateTH(v.date) : "—"}
                {v.timeFrom ? <span style={{ fontFamily: "var(--mono)", fontWeight: 500, color: "var(--text-3)" }}> {v.timeFrom}–{v.timeTo}</span> : null}
              </span>
              <OmPill th={s.th} color={s.color} />
              <OmPill th={v.free ? "ล้างฟรีตามสัญญา" : "คิดค่าบริการ"} color={v.free ? "#10B981" : "#F59E0B"} />
              {!disabled && (
                <button onClick={() => store.remove(site.id, v.id)} title="ลบใบนัดนี้"
                  style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--surface2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                  <Icon name="trash" size={13} />
                </button>
              )}
            </div>
            {!lock && (
              <React.Fragment>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))", gap: 8 }}>
                  <input type="date" value={v.date || ""} onChange={(e) => setV(v, { date: e.target.value })}
                    style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
                  <input type="time" value={v.timeFrom || ""} onChange={(e) => setV(v, { timeFrom: e.target.value })}
                    style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
                  <input type="time" value={v.timeTo || ""} onChange={(e) => setV(v, { timeTo: e.target.value })}
                    style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
                  <input value={v.charge == null ? "" : String(v.charge)} inputMode="decimal" placeholder="ค่าบริการ"
                    onChange={(e) => { const t = e.target.value.replace(/[^0-9.]/g, ""); setV(v, { charge: t === "" ? null : +t, free: t === "" ? v.free : false }); }}
                    style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <input value={v.note || ""} placeholder="หมายเหตุ เช่น ลูกค้าขอเลื่อน · ต้องใช้กระเช้า"
                  onChange={(e) => setV(v, { note: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, marginTop: 8 })} />
                <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                  <button onClick={() => done(v)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, border: "none",
                      background: "#10B981", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                    <Icon name="check" size={14} color="#fff" /> ล้างเสร็จแล้ว
                  </button>
                  <button onClick={() => setV(v, { free: !v.free })}
                    style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
                    {v.free ? "เปลี่ยนเป็นคิดเงิน" : "เปลี่ยนเป็นล้างฟรี"}
                  </button>
                  <button onClick={() => setV(v, { status: "skipped" })}
                    style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ข้ามรอบนี้</button>
                </div>
              </React.Fragment>
            )}
            {v.status === "done" && v.note && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5 }}>{v.note}</div>
            )}
            {/* ล้างเสร็จแล้วออกใบรายงานให้ลูกค้าเซ็นรับงานได้ทันที */}
            {v.status === "done" && (onOpenVisit || onNewVisit) && (
              svByClean[v.id] ? (
                <button onClick={() => onOpenVisit && onOpenVisit(svByClean[v.id].id)}
                  style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
                    border: "1px solid var(--border-strong)", background: "var(--surface2)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                  <Icon name="file" size={13} /> เปิดใบรายงาน {svByClean[v.id].no}
                </button>
              ) : (!disabled && onNewVisit && (
                <button onClick={() => onNewVisit({ kind: "clean", cleanId: v.id, date: v.date,
                  cover: v.free ? "warranty" : "charge" })}
                  style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
                    border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                  <Icon name="file" size={13} /> ออกใบรายงานเข้าบริการ
                </button>
              ))
            )}
          </div>
        );
      })}
      {!list.length && (
        <div style={{ padding: "12px 6px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีประวัติล้างแผง</div>
      )}
    </div>
  );
}
const omFreeTotal = (site) => ((site || {}).clean || {}).freeCount || 0;

/* ── แผงไซต์ ──
   เฟสนี้มีข้อมูลไซต์ · วันรับมอบ · ทะเบียนประกัน · ตั้งค่ารอบล้างแผง
   ส่วนนัดล้างจริง ใบแจ้งซ่อม และใบรายงานเข้าบริการ จะมาในเฟสถัดไป */
function OmSiteModal({ site, job, role, visits, cleanStore, tickets, siteVisits,
  onOpenTicket, onNewTicket, onOpenVisit, onNewVisit, onClose, onPatch, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const disabled = !window.omCanWrite(role, null);
  const canDelete = window.omCanDelete(role);
  const [delAsk, setDelAsk] = React.useState(false);
  if (!site) return null;
  const st = window.omSiteWarrantyState(site);
  const clean = site.clean || window.omBlankClean(site.comDate);
  const set = (fields) => { if (!disabled) onPatch(site.id, fields); };
  const setClean = (fields) => set({ clean: Object.assign({}, clean, fields) });

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 760, maxHeight: isMobile ? "94vh" : "88vh", overflowY: "auto",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: isMobile ? "18px 18px 0 0" : 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>

        {/* หัวแผง */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg)", borderBottom: "1px solid var(--border)",
          padding: isMobile ? "14px 13px" : "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: st.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="shield" size={18} color={st.color} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>{site.name || "(ยังไม่ได้ตั้งชื่อไซต์)"}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                {site.code} · {omSiteTypeTH(site, job).th} · {window.omIsExternal(site.id) ? "ไซต์นอกระบบ" : "งานติดตั้งของเรา"}
                {typeof site.kw === "number" && site.kw > 0 ? " · " + site.kw + " kW" : ""}
              </div>
            </div>
            <OmPill th={st.th} color={st.color} />
            <button onClick={onClose} title="ปิด"
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        <div style={{ padding: isMobile ? "14px 13px 24px" : "18px 20px 26px" }}>
          {disabled && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: 12 }}>
              <Icon name="lock" size={15} color="var(--text-3)" />
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>ดูได้อย่างเดียว — ไม่มีสิทธิ์แก้งานบริการหลังการขาย</span>
            </div>
          )}

          {/* งานที่ผูกอยู่ถูกลบจากฐานข้อมูลแล้ว — ตั้งใจให้ไซต์ค้างอยู่ เพราะภาระประกันยังอยู่ */}
          {site.source === "job" && !job && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid #F59E0B40", background: "#F59E0B14", borderRadius: 12 }}>
              <Icon name="alert" size={15} color="#F59E0B" />
              <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>ใบงานต้นทางถูกลบจากฐานข้อมูลแล้ว · ทะเบียนบริการยังอยู่ต่อเพราะประกันยังไม่หมด</span>
            </div>
          )}

          <window.DrSection n="1" title="ข้อมูลไซต์" hint={site.tech ? "" : "ยังไม่ได้ระบุช่างผู้ดูแล"}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <window.DrLabel>ชื่อไซต์ / ลูกค้า</window.DrLabel>
                <input value={site.name || ""} disabled={disabled} onChange={(e) => set({ name: e.target.value })}
                  style={Object.assign({}, OM_INPUT, String(site.name || "").trim() ? null : { borderColor: "#F59E0B" })} />
                {/* ลบชื่อจนว่างคือทางที่สองที่พาไปสภาพเดียวกับไซต์เปล่า — ไม่บล็อกการพิมพ์
                    (แผงนี้บันทึกทุกตัวอักษร บล็อกแล้วจะลบเพื่อพิมพ์ใหม่ไม่ได้) แต่ต้องเห็นว่าผิดปกติ */}
                {!String(site.name || "").trim() && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginTop: 5 }}>
                    ยังไม่มีชื่อ — ไซต์นี้จะขึ้นเป็นรหัสเปล่าในรายการและในแจ้งเตือน LINE
                  </div>
                )}
              </div>
              <div>
                <window.DrLabel>เบอร์ติดต่อ</window.DrLabel>
                <input value={site.phone || ""} disabled={disabled} onChange={(e) => set({ phone: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { fontFamily: "var(--mono)" })} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <window.DrLabel>ที่ตั้ง</window.DrLabel>
              <window.DrText value={site.address} disabled={disabled} rows={2} onChange={(v) => set({ address: v })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
              <div>
                <window.DrLabel>จังหวัด</window.DrLabel>
                <input value={site.province || ""} disabled={disabled} onChange={(e) => set({ province: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })} />
              </div>
              <div>
                <window.DrLabel>ขนาด (kW)</window.DrLabel>
                <input value={String(site.kw == null ? "" : site.kw)} disabled={disabled} inputMode="decimal"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); set({ kw: v === "" ? null : +v }); }}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </div>
              <div>
                <window.DrLabel>จำนวนแผง</window.DrLabel>
                <input value={String(site.panels == null ? "" : site.panels)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); set({ panels: v === "" ? null : +v }); }}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </div>
              <div>
                <window.DrLabel>ยี่ห้อ</window.DrLabel>
                <input value={site.brand || ""} disabled={disabled} onChange={(e) => set({ brand: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })} />
              </div>
            </div>
            {/* งานบ้านกับงานโครงการดูแลกันคนละแบบ — แยกไว้ตั้งแต่ทะเบียน หน้าภาพรวมจะได้กรองได้ */}
            <div style={{ marginTop: 12 }}>
              <window.DrLabel hint={job ? "ตั้งต้นตามใบงาน แก้ได้ถ้าจำแนกใหม่" : ""}>ประเภทงาน</window.DrLabel>
              <window.DrChips options={OM_SITE_TYPE} value={omSiteType(site, job)} disabled={disabled}
                onChange={(v) => set({ type: v || "home" })} />
            </div>
          </window.DrSection>

          <window.DrSection n="2" title="วันติดตั้งเสร็จ" tone="#0EA5E9"
            hint={"ประกันทุกรายการเริ่มนับจากวันนี้ · " + (window.OM_COMSRC_TH[site.comSrc] || "")}>
            {/* วันนี้คือจุดตั้งต้นของทั้งประกันและรอบล้างแผง เดาผิดแล้วผิดยาว จึงต้องให้คนยืนยัน
                แก้วันนี้แล้ววันเริ่มประกันทุกแถวที่ยังไม่ถูกแก้มือจะเลื่อนตามไปเอง */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input type="date" value={site.comDate || ""} disabled={disabled}
                onChange={(e) => { if (e.target.value) set(window.omSetComDate(site, e.target.value, "confirmed")); }}
                style={Object.assign({}, OM_INPUT, { width: "auto", padding: "8px 11px", fontFamily: "var(--mono)", fontSize: 13 })} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{site.comDate ? window.drDateTH(site.comDate, true) : "—"}</span>
            </div>
            {window.omComUnsure(site) && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11, padding: "10px 12px",
                border: "1px solid #F59E0B40", background: "#F59E0B14", borderRadius: 11 }}>
                <Icon name="alert" size={15} color="#F59E0B" />
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-1)" }}>
                  วันรับมอบเป็นค่าประมาณ ({window.OM_COMSRC_TH[site.comSrc] || "ไม่ทราบที่มา"}) กรุณายืนยัน
                </span>
                {!disabled && (
                  <button onClick={() => set(window.omSetComDate(site, site.comDate, "confirmed"))}
                    style={{ padding: "6px 12px", borderRadius: 9, border: "none", background: "#F59E0B", color: "#fff",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>ยืนยันวันนี้ถูกแล้ว</button>
                )}
              </div>
            )}
          </window.DrSection>

          <window.DrSection n="3" title="ทะเบียนประกัน" tone="#1B9B75"
            hint={"เตือนล่วงหน้า " + window.OM_WARN_DAYS + " วันก่อนหมด"}>
            <OmWarrantyTable site={site} disabled={disabled} onChange={(w) => set({ warranties: w })} />
          </window.DrSection>

          <window.DrSection n="4" title="รอบล้างแผง" tone="#0EA5E9"
            hint={(() => { const cs = window.omCleanState(site, visits); return cs.due ? cs.th + " · " + window.drShort(cs.due) : cs.th; })()}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <button type="button" disabled={disabled} onClick={() => setClean({ on: !clean.on })}
                style={{ padding: "7px 13px", borderRadius: 99, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 700,
                  border: "1px solid " + (clean.on ? "#0EA5E9" : "var(--border-strong)"),
                  background: clean.on ? "#0EA5E91e" : "var(--surface)", color: clean.on ? "#0EA5E9" : "var(--text-2)" }}>
                {clean.on ? "อยู่ในรอบล้างแผง" : "ไม่อยู่ในรอบล้างแผง"}
              </button>
            </div>
            {clean.on && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <div>
                  <window.DrLabel>ล้างทุกกี่เดือน</window.DrLabel>
                  <input value={String(clean.everyMon == null ? "" : clean.everyMon)} disabled={disabled} inputMode="numeric"
                    onChange={(e) => setClean({ everyMon: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <div>
                  <window.DrLabel hint="ตามสัญญา">ล้างฟรีกี่ครั้ง</window.DrLabel>
                  <input value={String(clean.freeCount == null ? "" : clean.freeCount)} disabled={disabled} inputMode="numeric"
                    onChange={(e) => setClean({ freeCount: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <div>
                  <window.DrLabel hint="ครั้งแรก">ครบรอบวันที่</window.DrLabel>
                  <input type="date" value={clean.firstDue || ""} disabled={disabled}
                    onChange={(e) => setClean({ firstDue: e.target.value })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
                </div>
              </div>
            )}
            {clean.on && (
              <OmCleanVisits site={site} visits={visits} store={cleanStore} disabled={disabled} role={role}
                siteVisits={siteVisits} onOpenVisit={onOpenVisit} onNewVisit={onNewVisit} />
            )}
          </window.DrSection>

          {/* ใบแจ้งซ่อมของไซต์นี้ — เห็นประวัติปัญหาคู่กับทะเบียนประกันในหน้าเดียว
              กดแล้วปิดแผงไซต์ไปเปิดแผงใบแจ้งซ่อม ไม่ซ้อนแผงสองชั้น */}
          <window.DrSection n="5" title="ใบแจ้งซ่อม" tone="#7C5CFC"
            hint={(tickets || []).length ? (tickets || []).filter((t) => window.omTicketOpen(t)).length + " ใบที่ยังไม่ปิด" : ""}>
            {!(tickets || []).length && (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: onNewTicket ? 11 : 0 }}>ยังไม่เคยมีเรื่องแจ้งซ่อม</div>
            )}
            {(tickets || []).map((t) => {
              const ts = window.omTicketStatusOf(t.status);
              const ov = window.omTicketOverdue(t);
              return (
                <button key={t.id} type="button" onClick={() => onOpenTicket && onOpenTicket(t.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", marginBottom: 7,
                    border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{t.no}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "var(--text-1)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.title || (window.OM_TICKET_CAT_BY[t.category] || {}).th || "(ยังไม่ได้ใส่หัวเรื่อง)"}
                  </span>
                  {ov && <OmPill th={"เกิน " + ov.over + " วัน"} color="#EF4444" />}
                  <OmPill th={ts.th} color={ts.color} />
                  <Icon name="chevronRight" size={14} color="var(--text-3)" />
                </button>
              );
            })}
            {!disabled && onNewTicket && (
              <button type="button" onClick={onNewTicket}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                  border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
                <Icon name="wrench" size={14} /> แจ้งซ่อมให้ไซต์นี้
              </button>
            )}
          </window.DrSection>

          {/* ประวัติเข้าบริการ — ทุกครั้งที่เราออกไปที่ไซต์นี้ ทั้งซ่อม ล้าง และตรวจเช็ก */}
          <window.DrSection n="6" title="ประวัติเข้าบริการ" tone="#1B9B75"
            hint={(siteVisits || []).length ? "เข้าไปแล้ว " + (siteVisits || []).length + " ครั้ง" : ""}>
            {!(siteVisits || []).length && (
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: onNewVisit && !disabled ? 11 : 0 }}>ยังไม่เคยออกใบรายงานเข้าบริการ</div>
            )}
            {(siteVisits || []).map((v) => {
              const vs = window.omVisitStatusOf(v.status);
              const vk = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
              return (
                <button key={v.id} type="button" onClick={() => onOpenVisit && onOpenVisit(v.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", marginBottom: 7,
                    border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <Icon name={vk.icon} size={14} color={vk.color} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                    {vk.th} · {window.drShort(v.date)}
                    <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 400, color: "var(--text-3)" }}>{v.no}</span>
                  </span>
                  <OmPill th={vs.th} color={vs.color} />
                  <Icon name="chevronRight" size={14} color="var(--text-3)" />
                </button>
              );
            })}
            {!disabled && onNewVisit && (
              <button type="button" onClick={() => onNewVisit({ kind: "inspect" })}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                  border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
                <Icon name="file" size={14} /> ออกใบรายงานเข้าบริการใหม่
              </button>
            )}
          </window.DrSection>

          <window.DrSection n="7" title="หมายเหตุ" tone="#94A3B8">
            <window.DrText value={site.note} disabled={disabled} rows={2}
              placeholder="เช่น หลังคาสูง ต้องใช้กระเช้า · ลูกค้าสะดวกเฉพาะวันเสาร์"
              onChange={(v) => set({ note: v })} />
          </window.DrSection>

          {canDelete && (
            delAsk ? (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", flexWrap: "wrap",
                border: "1px solid #EF444440", background: "#EF44440e", borderRadius: 12 }}>
                <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                  ลบทะเบียนบริการของ {site.code}? ประวัติประกันและรอบล้างแผงหายถาวร (ใบงานไม่ถูกแตะ)
                </span>
                <button onClick={() => setDelAsk(false)}
                  style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ยกเลิก</button>
                <button onClick={() => { onRemove(site.id); onClose(); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none",
                    background: "#EF4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                  <Icon name="trash" size={14} color="#fff" /> ลบเลย
                </button>
              </div>
            ) : (
              <button onClick={() => setDelAsk(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                <Icon name="trash" size={14} color="#EF4444" /> ลบทะเบียนบริการนี้ (เฉพาะแอดมิน)
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ปฏิทินล้างแผง ──
   จุดบนปฏิทินมาจาก omCleanAgenda: ใบนัดจริง + วันครบรอบของไซต์ที่ยังไม่มีใครจอง
   วันครบรอบเป็นค่าคำนวณสด กดแล้วถึงจะเกิดใบนัดจริง */
const OM_TH_MONTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function OmCleanView({ sites, cleanStore, role, onOpenSite }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.drToday();
  /* เปิดมาต้องอยู่ที่เดือนปัจจุบันเสมอ — อ่านจากวันที่จริงของเครื่อง */
  const now = React.useMemo(() => new Date(today + "T00:00:00"), [today]);
  const [ym, setYm] = React.useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const [sel, setSel] = React.useState(today);
  const canWrite = window.omCanWrite(role, null);

  const agenda = React.useMemo(() => window.omCleanAgenda(sites, cleanStore.bySite, today),
    [sites, cleanStore.bySite, today]);
  const byDate = React.useMemo(() => {
    const m = {};
    agenda.forEach((a) => { (m[a.date] = m[a.date] || []).push(a); });
    return m;
  }, [agenda]);

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => ym.y + "-" + pad(ym.m + 1) + "-" + pad(d);
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const shift = (n) => setYm((s) => { const d = new Date(s.y, s.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const monthCount = agenda.filter((a) => a.date.slice(0, 7) === ym.y + "-" + pad(ym.m + 1)).length;
  const selList = byDate[sel] || [];

  /* สีของจุด — จองแล้วฟ้า · ล้างแล้วเขียว · ครบรอบแล้วยังไม่จองส้ม/แดงถ้าเลยมานาน */
  const toneOf = (a) => {
    if (!a.virtual) return window.omCleanStatusOf(a.status).color;
    const d = window.omDiffDays(today, a.date);
    return d < -7 ? "#EF4444" : d <= 0 ? "#F59E0B" : "#94A3B8";
  };

  const bookOn = (a) => {
    if (!canWrite) return;
    const vs = (cleanStore.bySite || {})[a.site.id] || [];
    const rec = window.omBlankCleanVisit(a.site, a.date, vs, window.DR_ME && window.DR_ME.user);
    cleanStore.save(rec);
  };

  const dayPanel = (
    <div className="pnl" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{window.drDateTH(sel, true)}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selList.length} รายการ</div>
      </div>
      {!selList.length && (
        <div style={{ padding: "26px 8px", textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>วันนี้ไม่มีคิวล้างแผง</div>
      )}
      {selList.map((a, i) => {
        const c = toneOf(a);
        return (
          <div key={a.site.id + "-" + i} style={{ border: "1px solid var(--border)", borderLeft: "3px solid " + c,
            borderRadius: 11, background: "var(--surface)", padding: "10px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{a.site.name || a.site.code}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 7 }}>
              {a.site.code}{a.site.province ? " · " + a.site.province : ""}
              {a.visit && a.visit.timeFrom ? " · " + a.visit.timeFrom + "–" + a.visit.timeTo : ""}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <OmPill th={a.virtual ? "ถึงรอบ ยังไม่จองคิว" : window.omCleanStatusOf(a.status).th} color={c} />
              {a.visit && <OmPill th={a.visit.free ? "ล้างฟรี" : "คิดค่าบริการ"} color={a.visit.free ? "#10B981" : "#F59E0B"} />}
              {a.virtual && canWrite && (
                <button onClick={() => bookOn(a)}
                  style={{ padding: "6px 12px", borderRadius: 9, border: "none", background: c, color: "#fff",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>จองคิววันนี้</button>
              )}
              <button onClick={() => onOpenSite(a.site.id)}
                style={{ padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>เปิดไซต์</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column",
      gridTemplateColumns: isMobile ? undefined : "1fr 360px", gap: 16, alignItems: "start" }}>
      <div className="pnl">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{OM_TH_MONTH[ym.m]} {ym.y + 543}</h2>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>· {monthCount} คิว</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={() => shift(-1)} title="เดือนก่อน"
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
              <Icon name="chevronRight" size={15} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button onClick={() => shift(1)} title="เดือนถัดไป"
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
              <Icon name="chevronRight" size={15} />
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, minWidth: 420 }}>
            {window.TH_DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, paddingBottom: 4,
                color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)" }}>{d}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const k = keyOf(d);
              const list = byDate[k] || [];
              const isToday = k === today;
              const isSel = k === sel;
              return (
                <button key={i} onClick={() => setSel(k)}
                  style={{ minHeight: isMobile ? 62 : 92, borderRadius: 11, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
                    border: isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
                    background: isSel || isToday ? "var(--primary-soft)" : "var(--surface2)", padding: 7,
                    display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
                  <span style={{ fontSize: 12, fontWeight: isToday || isSel ? 800 : 600,
                    color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)" }}>{d}</span>
                  {list.slice(0, 3).map((a, k2) => {
                    const c = toneOf(a);
                    return (
                      <span key={k2} title={(a.site.name || a.site.code) + (a.virtual ? " · ถึงรอบ ยังไม่จองคิว" : "")}
                        style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 6, padding: "1px 4px",
                          background: c + "1f", overflow: "hidden" }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: c, flexShrink: 0,
                          border: a.virtual ? "1px solid " + c : "none", opacity: a.virtual ? 0.55 : 1 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-2)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {String(a.site.name || a.site.code).replace("บ้าน", "").replace("คุณ", "")}
                        </span>
                      </span>
                    );
                  })}
                  {list.length > 3 && <span style={{ fontSize: 9, color: "var(--text-3)" }}>+{list.length - 3}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
          {[["#F59E0B", "ถึงรอบ ยังไม่จองคิว"], ["#EF4444", "เลยกำหนดเกิน 7 วัน"], ["#0EA5E9", "จองคิวแล้ว"], ["#10B981", "ล้างแล้ว"]].map(([c, th]) => (
            <span key={th} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: c }} />{th}
            </span>
          ))}
        </div>
      </div>
      {dayPanel}
    </div>
  );
}

/* ── ออกเป็นไฟล์ Excel ──
   ทะเบียนบริการทั้งชุดในแผ่นเดียว: ประกัน · รอบล้าง · โควตาฟรี · เคสที่ยังไม่ปิด
   สไตล์ตารางลอกจากใบสั่งซื้อ (views-overview.jsx) ให้เอกสารทั้งระบบหน้าตาเดียวกัน
   วันที่ในไฟล์เป็น พ.ศ. ทั้งหมด เพราะเป็นด่านแสดงผล ไม่ใช่ตัวเลขที่เอาไปคำนวณต่อ */
function omExportXlsx(sites, bySite, tickets, today, kind) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  const X = window.XLSX;
  const t = today || window.drToday();
  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", alt: "F4FAF6",
    white: "FFFFFF", border: "CBD8D0", text: "16241D", sub: "5A6B62", warn: "B45309", warnBg: "FDEBD0",
    bad: "B91C1C", badBg: "FBE3E3" };
  const FONT = "Tahoma";
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const cols = ["ลำดับ", "รหัสไซต์", "ชื่อไซต์", "ประเภทงาน", "จังหวัด", "ขนาด (kW)", "วันติดตั้งเสร็จ",
    "สถานะประกัน", "ประกันหมดวันที่", "รอบล้างถัดไป", "สถานะรอบล้าง", "ล้างฟรีคงเหลือ", "ใบแจ้งซ่อมค้าง", "เบอร์ติดต่อ"];
  const lastC = cols.length - 1;
  const colW = [{ wch: 7 }, { wch: 12 }, { wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 16 }, { wch: 15 }, { wch: 14 }, { wch: 16 }, { wch: 13 }, { wch: 13 }, { wch: 14 }];
  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const wKey = {}, cKey = {};          /* สถานะประกัน/รอบล้างของแต่ละแถว เอาไว้ระบายสีตอนท้าย */
  const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const fullMerge = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

  const openBy = {};
  (tickets || []).forEach((x) => { if (window.omTicketOpen(x)) openBy[x.siteId] = (openBy[x.siteId] || 0) + 1; });
  const roll = window.omRollup(sites, bySite, t);

  const kindTH = (OM_SITE_TYPE_BY[kind] || {}).th || "";
  pushRow(["ทะเบียนงานบริการหลังการขาย (O&M)" + (kindTH ? " — เฉพาะ" + kindTH : "")], "title", 30); fullMerge(R - 1);
  pushRow(["flash+solar · ประกัน · รอบล้างแผง · ใบแจ้งซ่อม"], "subtitle", 20); fullMerge(R - 1);
  pushRow([], "spacer", 6);
  [["วันที่ออกเอกสาร", window.drDateTH(t, true)],
   ["ไซต์ในสัญญาบริการ", roll.total + " ไซต์" + (roll.kwSites ? " · " + roll.kw.toFixed(1) + " kW (เฉพาะไซต์ที่มีข้อมูลขนาดระบบ)" : "")],
   ["ใกล้หมดประกัน / หมดแล้ว", roll.warnSoon + " / " + roll.warnExpired + " ไซต์"],
   ["ถึงรอบล้าง / เลยกำหนด", roll.cleanDue + " / " + roll.cleanOverdue + " ไซต์"],
  ].forEach((row) => {
    const cells = [row[0]]; for (let i = 1; i <= lastC; i++) cells.push(i === 1 ? row[1] : "");
    pushRow(cells, "info", 19); merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
  });
  pushRow([], "spacer", 8);
  pushRow(cols, "head", 24);

  /* เรียงเหมือนในหน้าจอ: หมดประกัน → ใกล้หมด → เหลือน้อยก่อน จะได้อ่านไฟล์แล้วเห็นงานด่วนก่อน */
  const rank = { expired: 0, soon: 1, active: 2, none: 3 };
  const list = (sites || []).map((s) => {
    const vs = (bySite || {})[s.id] || [];
    return { s, st: window.omSiteWarrantyState(s, t), cs: window.omCleanState(s, vs, t), vs };
  }).sort((a, b) => (rank[a.st.key] - rank[b.st.key]) || (a.st.days - b.st.days));

  list.forEach((r, i) => {
    const s = r.s;
    pushRow([i + 1, s.code || "", s.name || "", omSiteTypeTH(s).th, s.province || "",
      (typeof s.kw === "number" && s.kw > 0) ? s.kw : "",
      /* ในไฟล์ต้องมีปีเสมอ — ไฟล์ถูกเปิดข้ามปีและวางคู่กับไฟล์เก่า "8 ส.ค." เฉย ๆ อ่านแล้วเดาผิดได้ */
      s.comDate ? window.drDateTH(s.comDate) : "",
      r.st.th || "", r.st.end ? window.drDateTH(r.st.end) : "",
      r.cs.due ? window.drDateTH(r.cs.due) : "", r.cs.th || "",
      (s.clean || {}).on ? window.omFreeLeft(s, r.vs) : "",
      openBy[s.id] || "", s.phone || ""],
      i % 2 === 0 ? "item" : "itemAlt");
    wKey[R - 1] = r.st.key; cKey[R - 1] = r.cs.key;
  });

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges; ws["!cols"] = colW; ws["!rows"] = rowsH;
  const styleCell = (r, c) => {
    const ty = meta[r]; if (ty === "spacer") return null;
    const s = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (ty === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (ty === "subtitle") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (ty === "info") { if (c === 0) { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; s.alignment = { horizontal: "right", vertical: "center" }; } else { s.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "center" }; } s.border = { bottom: thin }; }
    else if (ty === "head") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (ty === "item" || ty === "itemAlt") {
      if (ty === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      s.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "center" };
      if (c === 1 || c === 13) s.font = { name: FONT, sz: 10, color: { rgb: C.sub } };
      if (c === 5) s.numFmt = "#,##0.##";
      /* ระบายสีเฉพาะช่องสถานะ — เปิดไฟล์มาแล้วต้องเห็นงานที่ต้องรีบก่อนโดยไม่ต้องอ่านทุกบรรทัด */
      const wk = wKey[r], ck = cKey[r];
      if (c === 7 && (wk === "expired" || wk === "soon")) { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: wk === "expired" ? C.bad : C.warn } }; s.fill = { patternType: "solid", fgColor: { rgb: wk === "expired" ? C.badBg : C.warnBg } }; }
      if (c === 10 && (ck === "overdue" || ck === "due")) { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: ck === "overdue" ? C.bad : C.warn } }; s.fill = { patternType: "solid", fgColor: { rgb: ck === "overdue" ? C.badBg : C.warnBg } }; }
      if (c === 12 && aoa[r][12]) { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.warn } }; s.fill = { patternType: "solid", fgColor: { rgb: C.warnBg } }; }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const s = styleCell(r, c);
      if (!s) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = s;
    }
  }
  ws["!autofilter"] = { ref: X.utils.encode_range({ s: { r: R - list.length - 1, c: 0 }, e: { r: R - 1, c: lastC } }) };
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "ทะเบียนบริการ");
  X.writeFile(wb, "ทะเบียนงานบริการ" + (kindTH ? "_" + kindTH : "") + "_" + t.replace(/-/g, "") + ".xlsx");
}

/* ── ปุ่มในลิ้นชักใบงาน ──
   สรุปสั้น ๆ ว่าไซต์นี้ค้างอะไรอยู่ กดแล้วกระโดดไปหน้างานบริการพร้อมเปิดแผงไซต์ให้เลย */
function OmJobButton({ job, site, visits, tickets, onOpen }) {
  const open = (tickets || []).filter((t) => window.omTicketOpen(t)).length;
  const st = site ? window.omSiteWarrantyState(site) : null;
  const cs = site ? window.omCleanState(site, visits || []) : null;
  /* สีขอบซ้าย = เรื่องที่หนักที่สุดของไซต์นี้ */
  const color = !site ? "#94A3B8"
    : open ? "#EF4444"
    : (cs && (cs.key === "overdue" || cs.key === "due")) ? cs.color
    : (st && st.key !== "active") ? st.color : "#10B981";
  const sub = !site ? "ยังไม่ขึ้นทะเบียนบริการ — กดเพื่อขึ้นทะเบียน"
    : [st && st.key !== "none" ? st.th + " · " + window.omDaysTH(st) : "ยังไม่ได้ตั้งประกัน",
       cs && cs.key !== "off" ? cs.th : "",
       open ? "ใบแจ้งซ่อมค้าง " + open + " ใบ" : ""].filter(Boolean).join(" · ");
  return (
    <button onClick={onOpen}
      style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: "3px solid " + color,
        borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="wrench" size={17} color={color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>งานบริการหลังการขาย</span>
        <span style={{ display: "block", fontSize: 11.5, color: color, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
      </span>
      <Icon name="arrowRight" size={16} color="var(--text-3)" />
    </button>
  );
}

/* ── หน้าหลัก ── */
function OmView({ jobs, users, role, currentUser, focus }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { sites, loading, upsert, patch, remove } = window.useOmSites();
  const cleanStore = window.useOmCleanVisits();
  const ticketStore = window.useOmTickets();
  const visitStore = window.useOmVisits();
  /* เปิดหน้ามาเจอใบแจ้งซ่อมก่อน — เป็นงานที่มีคนรออยู่จริง ส่วนทะเบียนไซต์เป็นข้อมูลอ้างอิง */
  const [tab, setTab] = React.useState("ticket");      /* ticket | visit | sites | clean */
  const [openTicket, setOpenTicket] = React.useState(null);  /* ใบที่เปิดจากแผงไซต์ (บอร์ดมีสถานะของตัวเอง) */
  const [openVisit, setOpenVisit] = React.useState(null);    /* ใบรายงานที่เปิดจากใบแจ้งซ่อม/นัดล้าง */
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("");      /* "" | "soon" | "expired" | "unsure" | "cleanDue" */
  const [open, setOpen] = React.useState(null);        /* siteId ที่เปิดแผงอยู่ */
  const [enrolling, setEnrolling] = React.useState(false);
  const canWrite = window.omCanWrite(role, null);

  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; });
    return m;
  }, [jobs]);

  /* แยกงานบ้าน / งานโครงการ — กรองทั้งหน้า (ไทล์ · บอร์ด · ใบรายงาน · ทะเบียน · ปฏิทิน)
     จำค่าไว้ เพราะคนที่ดูแลงานโครงการอย่างเดียวไม่ควรต้องมากดใหม่ทุกครั้งที่เปิดหน้า */
  const [kind, setKind] = React.useState(() => {
    try { return localStorage.getItem("om_kind") || "all"; } catch (e) { return "all"; }
  });
  const pickKind = (k) => { setKind(k); try { localStorage.setItem("om_kind", k); } catch (e) { /* โหมดส่วนตัวเขียนไม่ได้ ไม่เป็นไร */ } };
  const typeOf = React.useCallback((s) => omSiteType(s, jobById[(s || {}).id]), [jobById]);
  const inKind = React.useCallback((s) => kind === "all" || typeOf(s) === kind, [kind, typeOf]);

  const sitesK = React.useMemo(() => (sites || []).filter(inKind), [sites, inKind]);
  const kindCount = React.useMemo(() => {
    const c = { all: (sites || []).length, home: 0, project: 0 };
    (sites || []).forEach((s) => { c[typeOf(s)]++; });
    return c;
  }, [sites, typeOf]);
  /* ใบแจ้งซ่อม/ใบรายงานเกาะกับไซต์ จึงกรองตามประเภทของไซต์ที่มันอ้างถึง
     ใบที่ไซต์ถูกลบไปแล้วให้ติดมาด้วยเสมอ ไม่งั้นมันหายไปเฉย ๆ โดยไม่มีใครเห็น */
  const siteKindBy = React.useMemo(() => {
    const m = {}; (sites || []).forEach((s) => { m[s.id] = typeOf(s); }); return m;
  }, [sites, typeOf]);
  const inKindRec = React.useCallback(
    (r) => kind === "all" || !siteKindBy[(r || {}).siteId] || siteKindBy[r.siteId] === kind, [kind, siteKindBy]);
  const ticketsK = React.useMemo(() => (ticketStore.tickets || []).filter(inKindRec), [ticketStore.tickets, inKindRec]);
  const visitsK = React.useMemo(() => (visitStore.visits || []).filter(inKindRec), [visitStore.visits, inKindRec]);
  const ticketStoreK = React.useMemo(() => Object.assign({}, ticketStore, { tickets: ticketsK }), [ticketStore, ticketsK]);
  const visitStoreK = React.useMemo(() => Object.assign({}, visitStore, { visits: visitsK }), [visitStore, visitsK]);

  const pending = React.useMemo(
    () => window.omEnrollable(jobs, sites).filter((j) => kind === "all" || (j.type === "project" ? "project" : "home") === kind),
    [jobs, sites, kind]);
  const roll = React.useMemo(() => window.omRollup(sitesK, cleanStore.bySite), [sitesK, cleanStore.bySite]);
  const tRoll = React.useMemo(() => window.omTicketRollup(ticketsK), [ticketsK]);
  const vRoll = React.useMemo(() => window.omVisitRollup(visitsK), [visitsK]);
  const ticketsOf = React.useCallback(
    (id) => (ticketStore.tickets || []).filter((t) => t.siteId === id), [ticketStore.tickets]);

  /* ออกใบรายงานเข้าบริการใหม่ — เปิดได้จากใบแจ้งซ่อมหรือจากนัดล้างที่ทำเสร็จแล้ว
     เลขใบนับเฉพาะใบของไซต์นั้น จึงต้องส่ง siteVisits เข้าไปด้วย */
  const newVisit = React.useCallback((site, opts) => {
    if (!site || !window.omCanWrite(role, null)) return;
    const rec = window.omBlankVisit(site,
      Object.assign({ siteVisits: (visitStore.bySite || {})[site.id] || [] }, opts || {}), currentUser);
    visitStore.save(rec);
    /* stay = ออกใบจากหน้าใบแจ้งซ่อมแล้วกรอกต่อที่หน้าเดิม ไม่เด้งไปฟอร์มอีกหน้า
       (ที่นั่นกรอกซ้ำเรื่องเดียวกัน ซึ่งเป็นเหตุผลที่ยกอะไหล่กับลายเซ็นมาไว้ในใบแจ้งซ่อม) */
    if ((opts || {}).stay) return;
    setOpen(null); setOpenTicket(null); setOpenVisit(rec.id);
  }, [role, currentUser, visitStore.bySite, visitStore.save]);
  const showVisit = React.useCallback((id) => { setOpen(null); setOpenTicket(null); setOpenVisit(id); }, []);

  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = (sitesK || []).map((s) => ({ site: s, st: window.omSiteWarrantyState(s),
      cs: window.omCleanState(s, (cleanStore.bySite || {})[s.id] || []) }))
      .filter((r) => {
        if (filter === "unsure" && !window.omComUnsure(r.site)) return false;
        if ((filter === "soon" || filter === "expired") && r.st.key !== filter) return false;
        if (filter === "cleanDue") {
          const k = window.omCleanState(r.site, (cleanStore.bySite || {})[r.site.id] || []).key;
          if (k !== "due" && k !== "overdue") return false;
        }
        if (!kw) return true;
        return [r.site.name, r.site.code, r.site.province, r.site.address, r.site.phone]
          .some((v) => String(v || "").toLowerCase().includes(kw));
      });
    /* เรียงให้เรื่องที่ต้องรีบอยู่บนสุด: หมดประกัน → ใกล้หมด → เหลือน้อยก่อน */
    const rank = { expired: 0, soon: 1, active: 2, none: 3 };
    out.sort((a, b) => (rank[a.st.key] - rank[b.st.key]) || (a.st.days - b.st.days));
    return out;
  }, [sitesK, q, filter, cleanStore.bySite]);

  const enrollAll = () => {
    if (!canWrite || !pending.length) return;
    setEnrolling(true);
    pending.forEach((j) => upsert(window.omSiteFromJob(j, currentUser)));
    setEnrolling(false);
  };
  /* ── ถามชื่อก่อน แล้วค่อยสร้าง ──
     เดิมเขียนเรคคอร์ดเปล่าลงฐานข้อมูลทันทีแล้วค่อยเปิดฟอร์มให้กรอก
     ใครกดแล้วเปลี่ยนใจปิดไป จะเหลือไซต์ที่มีแต่รหัสไม่มีชื่อค้างอยู่ถาวร
     และไม่มีอะไรบอกว่ามันคือของใคร — แจ้งเตือนเข้า LINE ก็เลยบอกไม่ได้ว่างานของใคร
     ชื่อคือสิ่งเดียวที่ระบบเดาแทนไม่ได้ ที่เหลือกรอกทีหลังได้หมด */
  const addExternal = async () => {
    if (!canWrite) return;
    const name = await window.askText({
      title: "เปิดทะเบียนไซต์ใหม่", icon: "plus", ok: "สร้างไซต์",
      body: "ตั้งชื่อไว้ก่อนเพื่อให้หาเจอในรายการและในแจ้งเตือน · รายละเอียดที่เหลือกรอกทีหลังได้",
      label: "ชื่อไซต์ / ลูกค้า", placeholder: "เช่น คุณศิริการย์ · บจก. เวิลด์ลิงก์", required: true, maxLength: 120,
    });
    if (!name) return;
    const rec = Object.assign(window.omBlankSite(sites, currentUser), { name: name });
    upsert(rec);
    setOpen(rec.id);
  };
  /* เปิดมาจากกระดิ่งหรือจากปุ่มในลิ้นชักใบงาน — เด้งไปที่เรื่องนั้นให้เลย ไม่ต้องไล่หาเอง
     งานที่ยังไม่ขึ้นทะเบียน (ไม่มีไซต์) จะค้างที่แถบขึ้นทะเบียนซึ่งบอกอยู่แล้วว่าต้องกดอะไร */
  const focusDone = React.useRef(null);
  React.useEffect(() => {
    if (!focus || focusDone.current === focus) return;   /* ทำครั้งเดียวต่อการกดหนึ่งครั้ง ไม่งั้นปิดแผงแล้วเด้งกลับมาอีก */
    if (focus.ticketId) { focusDone.current = focus; setTab("ticket"); setOpenTicket(focus.ticketId); return; }
    if (focus.siteId && (sites || []).some((s) => s.id === focus.siteId)) {
      focusDone.current = focus; setTab("sites"); setOpen(focus.siteId);
    }
  }, [focus, sites]);

  const tog = (k) => setFilter(filter === k ? "" : k);
  const cur = (sites || []).find((s) => s.id === open) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      {/* แยกงานบ้าน / งานโครงการ — กรองทั้งหน้า ตัวเลขบนไทล์เปลี่ยนตามที่เลือกด้วย */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        {[["all", "ทั้งหมด", "var(--primary-dark)"], ["home", "งานบ้าน", OM_SITE_TYPE_BY.home.color],
          ["project", "งานโครงการ", OM_SITE_TYPE_BY.project.color]].map(([k, th, c]) => (
          <button key={k} onClick={() => pickKind(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 99,
              border: "1px solid " + (kind === k ? c : "var(--border-strong)"),
              background: kind === k ? c + "16" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, color: kind === k ? c : "var(--text-2)" }}>
            {th}
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 800,
              color: kind === k ? c : "var(--text-3)" }}>{kindCount[k]}</span>
          </button>
        ))}
      </div>

      <OmStatRow id="om-head" title="สรุปภาพรวม">
        <OmStat label="ไซต์ในสัญญาบริการ" value={roll.total} color="var(--text-1)"
          hint={roll.kwSites ? roll.kw.toFixed(1) + " kW (เฉพาะไซต์ที่มีข้อมูลขนาดระบบ)" : ""} />
        <OmStat label="ใกล้หมดประกัน" value={roll.warnSoon} color="#F59E0B"
          hint={"เหลือไม่เกิน " + window.OM_WARN_DAYS + " วัน"} on={filter === "soon"} onClick={() => tog("soon")} />
        <OmStat label="หมดประกันแล้ว" value={roll.warnExpired} color="#EF4444" on={filter === "expired"} onClick={() => tog("expired")} />
        <OmStat label="วันติดตั้งเสร็จยังไม่ยืนยัน" value={roll.unsure} color="#7C5CFC" on={filter === "unsure"} onClick={() => tog("unsure")} />
        <OmStat label="ถึงรอบล้างแผง" value={roll.cleanDue + roll.cleanOverdue} color={roll.cleanOverdue ? "#EF4444" : "#F59E0B"}
          hint={roll.cleanOverdue ? "เลยกำหนด " + roll.cleanOverdue + " ไซต์" : "จองคิวแล้ว " + roll.cleanBooked + " ไซต์"}
          on={filter === "cleanDue"} onClick={() => { setTab("sites"); tog("cleanDue"); }} />
        <OmStat label="ใบแจ้งซ่อมที่ยังไม่ปิด" value={tRoll.open} color={tRoll.overdue ? "#EF4444" : "var(--text-1)"}
          hint={tRoll.overdue ? "เกินกำหนดปิดเคส " + tRoll.overdue + " ใบ" : (tRoll.newly ? "แจ้งใหม่ยังไม่ได้ดู " + tRoll.newly : "")}
          on={tab === "ticket"} onClick={() => setTab("ticket")} />
        <OmStat label="ใบรายงานรอตรวจ" value={vRoll.sent} color={vRoll.sent ? "#F59E0B" : "var(--text-1)"}
          hint={"ออกใบแล้วทั้งหมด " + vRoll.total + " ใบ" + (vRoll.draft ? " · ร่างค้าง " + vRoll.draft : "")}
          on={tab === "visit"} onClick={() => setTab("visit")} />
        <OmStat label="โควตาล้างฟรีคงเหลือ" value={roll.freeLeft} color="#0EA5E9"
          hint={"รวมทุกไซต์ที่อยู่ในรอบล้าง" + (roll.active !== roll.total ? " · ไซต์ที่ยังใช้งาน " + roll.active + "/" + roll.total : "")} />
      </OmStatRow>

      {/* สลับมุมมอง — รายการไซต์คือทะเบียน · ปฏิทินคือคิวงานที่ต้องออกไปทำ */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {[["ticket", "ใบแจ้งซ่อม", "wrench"], ["visit", "ใบรายงานเข้าบริการ", "file"],
          ["sites", "ทะเบียนไซต์", "list"], ["clean", "ปฏิทินล้างแผง", "calendar"]].map(([k, th, ic]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99,
              border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
              background: tab === k ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            <Icon name={ic} size={14} color={tab === k ? "var(--primary-dark)" : "var(--text-3)"} /> {th}
          </button>
        ))}
      </div>

      {tab === "clean" && (
        <OmCleanView sites={sitesK} cleanStore={cleanStore} role={role} onOpenSite={(id) => setOpen(id)} />
      )}

      {tab === "ticket" && (
        <window.OmTicketBoard sites={sitesK} jobById={jobById} users={users} ticketStore={ticketStoreK} visitStore={visitStore}
          role={role} currentUser={currentUser} onNewVisit={newVisit} onOpenVisit={showVisit} />
      )}

      {tab === "visit" && (
        <window.OmVisitList sites={sitesK} visitStore={visitStoreK} role={role} currentUser={currentUser} />
      )}

      {/* แถบขึ้นทะเบียน — คำนวณสดจากงานที่ปิดแล้ว ไม่ได้ผูกกับการเดินขั้นงาน
          ให้คนกดยืนยันเอง เพราะวันติดตั้งเสร็จ (= วันเริ่มประกัน) เดาเองไม่ได้เสมอ */}
      {tab === "sites" && !!pending.length && (
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", flexWrap: "wrap",
          border: "1px solid #1B9B7540", background: "#1B9B7512", borderRadius: 14 }}>
          <Icon name="wrench" size={17} color="#1B9B75" />
          <span style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: "var(--text-1)" }}>
            มีงานที่ติดตั้งเสร็จแล้วแต่ยังไม่ขึ้นทะเบียนบริการ <b>{pending.length}</b> งาน
            <span style={{ display: "block", color: "var(--text-3)", fontSize: 11.5 }}>
              {pending.slice(0, 4).map((j) => j.code).join(" · ")}{pending.length > 4 ? " · อีก " + (pending.length - 4) : ""}
            </span>
          </span>
          {canWrite && (
            <button onClick={enrollAll} disabled={enrolling}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none",
                background: "#1B9B75", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
              <Icon name="plus" size={14} color="#fff" /> ขึ้นทะเบียนทั้งหมด
            </button>
          )}
        </div>
      )}

      {tab === "sites" && (
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center" }}>
            <Icon name="search" size={15} color="var(--text-3)" />
          </span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อไซต์ · รหัส · จังหวัด · เบอร์โทร"
            style={Object.assign({}, OM_INPUT, { padding: "9px 12px 9px 34px", fontSize: 13 })} />
        </div>
        {canWrite && (
          <button onClick={addExternal}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
              border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="plus" size={14} /> เพิ่มไซต์นอกระบบ
          </button>
        )}
        {/* ออกเป็น Excel — เอาทะเบียนทั้งชุดไปวางแผนงานนอกระบบหรือส่งให้ลูกค้าดู */}
        <button onClick={() => omExportXlsx(sitesK, cleanStore.bySite, ticketsK, null, kind)} disabled={!sitesK.length}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
            border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: sitesK.length ? "pointer" : "not-allowed",
            opacity: sitesK.length ? 1 : .5, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="download" size={14} /> ออก Excel
        </button>
      </div>
      )}

      {tab === "sites" && (
      <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
        {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}
        {!loading && !rows.length && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>
            {sites.length
              ? (sitesK.length ? "ไม่มีไซต์ที่ตรงกับที่ค้นหา" : "ไม่มีไซต์ในหมวด" + (OM_SITE_TYPE_BY[kind] || {}).th)
              : "ยังไม่มีไซต์ในสัญญาบริการ — ขึ้นทะเบียนจากงานที่ติดตั้งเสร็จ หรือเพิ่มไซต์นอกระบบ"}
          </div>
        )}
        {rows.map((r) => {
          const s = r.site;
          const unsure = window.omComUnsure(s);
          return (
            <button key={s.id} onClick={() => setOpen(s.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: isMobile ? "11px 12px" : "13px 16px",
                borderBottom: "1px solid var(--border)", background: "none", border: "none", borderTop: "none",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: r.st.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name || "(ยังไม่ได้ตั้งชื่อไซต์)"}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>
                  {s.code} · <span style={{ color: omSiteTypeTH(s, jobById[s.id]).color, fontWeight: 700 }}>{omSiteTypeTH(s, jobById[s.id]).th}</span>
                  {s.province ? " · " + s.province : ""}
                  {typeof s.kw === "number" && s.kw > 0 ? " · " + s.kw + " kW" : ""}
                  {s.comDate ? " · ติดตั้งเสร็จ " + window.drShort(s.comDate) : ""}
                </span>
              </span>
              {r.cs && (r.cs.key === "due" || r.cs.key === "overdue" || r.cs.key === "booked") && (
                <OmPill th={r.cs.th} color={r.cs.color} sub={r.cs.due ? "· " + window.drShort(r.cs.due) : ""} />
              )}
              {unsure && <OmPill th="ยังไม่ยืนยันวันติดตั้งเสร็จ" color="#7C5CFC" />}
              <OmPill th={r.st.th} color={r.st.color}
                sub={r.st.key === "none" ? "" : "· " + window.omDaysTH(r.st)} />
              <Icon name="chevronRight" size={15} color="var(--text-3)" />
            </button>
          );
        })}
      </div>
      )}

      {cur && (
        <OmSiteModal site={cur} job={jobById[cur.id] || null} role={role}
          visits={(cleanStore.bySite || {})[cur.id] || []} cleanStore={cleanStore}
          tickets={ticketsOf(cur.id)} siteVisits={(visitStore.bySite || {})[cur.id] || []}
          onNewVisit={(opts) => newVisit(cur, opts)} onOpenVisit={showVisit}
          onOpenTicket={(id) => { setOpen(null); setOpenTicket(id); }}
          onNewTicket={() => {
            const rec = window.omBlankTicket(cur, ticketStore.tickets, currentUser);
            ticketStore.save(rec);
            /* push: false — เหตุผลเดียวกับปุ่มเปิดใบบนบอร์ด (om-ticket.jsx) */
            window.omNotify({ toPerm: "om", omSiteId: cur.id, push: false, title: "ใบแจ้งซ่อมใหม่ · " + rec.no,
              body: (cur.name || cur.code || "") + " — เปิดเรื่องโดย " + ((currentUser || {}).name || "") });
            setOpen(null); setOpenTicket(rec.id);
          }}
          onClose={() => setOpen(null)} onPatch={patch} onRemove={remove} />
      )}

      {/* ใบที่เปิดจากแผงไซต์ — บอร์ดมีแผงของตัวเองแยกต่างหาก */}
      {openTicket && (() => {
        const t = (ticketStore.tickets || []).find((x) => x.id === openTicket);
        if (!t) return null;
        const s = (sites || []).find((x) => x.id === t.siteId) || null;
        return (
          <window.OmTicketModal ticket={t} site={s} job={jobById[t.siteId] || null} users={users}
            role={role} currentUser={currentUser} onClose={() => setOpenTicket(null)}
            onPatch={ticketStore.patch} onRemove={ticketStore.remove}
            visits={(visitStore.visits || []).filter((x) => x.ticketId === t.id)}
            onNewVisit={(opts) => newVisit(s, opts)} onOpenVisit={showVisit} onPatchVisit={visitStore.patch}
            onMove={(x, to, note) => { const r = window.omTicketMove(x, to, currentUser, note); if (r) ticketStore.save(r); }} />
        );
      })()}

      {/* ใบรายงานที่เปิดจากที่อื่น — แท็บใบรายงานมีแผงของตัวเอง */}
      {openVisit && (() => {
        const v = (visitStore.visits || []).find((x) => x.id === openVisit);
        if (!v) return null;
        return (
          <window.OmVisitModal visit={v} site={(sites || []).find((s) => s.id === v.siteId) || null}
            role={role} currentUser={currentUser} onClose={() => setOpenVisit(null)}
            onPatch={visitStore.patch} onRemove={visitStore.remove} />
        );
      })()}
    </div>
  );
}

Object.assign(window, { OM_INPUT, OmPill, OmStat, OmStatRow, OmWarrantyBar, OmWarrantyTable,
  OmCleanVisits, OmCleanView, OmSiteModal, OmView, OmJobButton, omExportXlsx,
  OM_SITE_TYPE, OM_SITE_TYPE_BY, omSiteType, omSiteTypeTH });
