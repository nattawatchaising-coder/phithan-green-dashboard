/* ============================================================
   SolarFlow — Add / Edit job modal (the database entry form)
   ============================================================ */

function Field({ label, required, children, span }) {
  // บนมือถือ: span ที่เป็นตัวเลขในกริด 1 คอลัมน์จะสร้าง implicit column เกิน → บังคับเต็มแถวแทน
  const mob = window.matchMedia("(max-width: 860px)").matches;
  const gc = span === true ? "1 / -1"
    : (typeof span === "number" ? (mob ? "1 / -1" : "span " + span) : "auto");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: gc }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)",
  fontFamily: "inherit", fontSize: 13.5, padding: "9px 11px", borderRadius: 10, outline: "none", width: "100%",
};

/* responsive helper — matchMedia-based (re-renders on breakpoint change) */
function useFormMobile(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}

function JobForm({ initial, isNew, onSave, onClose, onManageTechs, onManageBrands }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => JSON.parse(JSON.stringify(initial)));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const setMat = (k, v) => setF((p) => Object.assign({}, p, { mat: Object.assign({}, p.mat, { [k]: v }) }));
  // stageDates[key] = { start, end } — รองรับค่าเก่าที่เป็น string (= วันเสร็จ)
  const setStageField = (k, which, v) => setF((p) => {
    const prev = p.stageDates && p.stageDates[k];
    const cur = (prev && typeof prev === "object") ? prev : { start: "", end: (typeof prev === "string" ? prev : "") };
    return Object.assign({}, p, { stageDates: Object.assign({}, p.stageDates, { [k]: Object.assign({}, cur, { [which]: v }) }) });
  });
  const stageVal = (k) => { const v = f.stageDates && f.stageDates[k]; if (!v) return { start: "", end: "" }; if (typeof v === "object") return { start: v.start || "", end: v.end || "" }; return { start: "", end: v }; };
  // กรอกวันเสร็จขั้นนี้ → เติมวันเริ่มของขั้นถัดไปให้ต่อกันอัตโนมัติ (ถ้ายังว่าง)
  const setStageEnd = (k, idx, v) => setF((p) => {
    const stages = SF.STAGES;
    const prev = p.stageDates && p.stageDates[k];
    const cur = (prev && typeof prev === "object") ? prev : { start: "", end: (typeof prev === "string" ? prev : "") };
    const sd = Object.assign({}, p.stageDates, { [k]: Object.assign({}, cur, { end: v }) });
    const nx = stages[idx + 1];
    if (nx && v) {
      const nv = sd[nx.key];
      const ncur = (nv && typeof nv === "object") ? nv : { start: "", end: (typeof nv === "string" ? nv : "") };
      if (!ncur.start) sd[nx.key] = Object.assign({}, ncur, { start: v });
    }
    return Object.assign({}, p, { stageDates: sd });
  });
  const brandInfo = (SF.BRAND_BY_NAME || {})[f.brand];
  const noBattery = brandInfo ? !brandInfo.battery : false;
  const isMobile = useFormMobile();

  React.useEffect(() => {
    if (noBattery && f.battery) { set("battery", false); set("batSize", "ไม่มี"); }
  }, [f.brand]); // eslint-disable-line

  const save = () => {
    if (!f.name.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
    const rec = Object.assign({}, f);
    if (!rec.battery) { rec.batSize = "ไม่มี"; rec.mat = Object.assign({}, rec.mat, { battery: "na" }); }
    if (!rec.backup) rec.mat = Object.assign({}, rec.mat, { backup: rec.mat.backup === "na" ? "na" : (rec.battery ? rec.mat.backup : "na") });
    if (!rec.birdnet) rec.mat = Object.assign({}, rec.mat, { birdnet: "na" });
    onSave(rec);
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)",
      zIndex: 100, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20,
        width: isMobile ? "100%" : "min(820px, 100%)", maxHeight: isMobile ? "94dvh" : "92dvh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}>
              <Icon name={isNew ? "plus" : "settings"} size={19} color="var(--primary-dark)" />
            </span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มงานติดตั้งใหม่" : "แก้ไขข้อมูลงาน"}</h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)" }}>{f.code}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={17} />
          </button>
        </div>

        {/* body */}
        <div style={{ overflowY: "auto", padding: isMobile ? 14 : 24, display: "flex", flexDirection: "column", gap: isMobile ? 14 : 18 }}>
          {/* customer */}
          <Section title="ข้อมูลลูกค้า" icon="user">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 12 : 14 }}>
              <Field label="ชื่อลูกค้า" required><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="คุณ..." /></Field>
              <Field label="เบอร์โทร"><input style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08x-xxx-xxxx" /></Field>
              <Field label="ประเภทงาน">
                <Dropdown value={f.type} onChange={(v) => set("type", v)} options={SF.TYPES.map((t) => ({ value: t.key, label: t.th }))} />
              </Field>
              <Field label="ที่อยู่" span={2}><input style={inputStyle} value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="จังหวัด"><input style={inputStyle} value={f.province} onChange={(e) => set("province", e.target.value)} /></Field>
              <Field label="ลิงก์ Google Maps" span><input style={inputStyle} value={f.map} onChange={(e) => set("map", e.target.value)} placeholder="https://maps.app.goo.gl/..." /></Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="ช่างผู้รับผิดชอบ">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {SF.TECHS.map((t) => {
                      const sel = f.tech === t.id;
                      return (
                        <button type="button" key={t.id} onClick={() => set("tech", t.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px 7px 7px", borderRadius: 99,
                            border: "1.5px solid " + (sel ? t.color : "var(--border-strong)"), background: sel ? t.color + "14" : "var(--surface2)",
                            cursor: "pointer", fontFamily: "inherit", transition: "all .14s" }}>
                          <span style={{ width: 26, height: 26, borderRadius: 99, background: t.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{t.nick.slice(0, 2)}</span>
                          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, textAlign: "left" }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: sel ? "var(--text-1)" : "var(--text-2)", whiteSpace: "nowrap" }}>{t.name}</span>
                            <span style={{ fontSize: 10, color: "var(--text-3)", whiteSpace: "nowrap" }}>{t.role}</span>
                          </span>
                          {sel && <Icon name="check" size={14} color={t.color} sw={2.6} style={{ marginLeft: 2 }} />}
                        </button>
                      );
                    })}
                    <button type="button" onClick={onManageTechs}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 99,
                        border: "1.5px dashed var(--border-strong)", background: "transparent", cursor: "pointer", fontFamily: "inherit",
                        color: "var(--text-2)", fontSize: 12.5, fontWeight: 600 }}>
                      <Icon name="settings" size={15} color="var(--text-2)" /> จัดการช่าง
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          </Section>

          {/* system spec */}
          <Section title="สเปกระบบ" icon="sun">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: isMobile ? 12 : 14 }}>
              <Field label="แบรนด์ / รุ่นที่ติดตั้ง" span={isMobile ? 2 : undefined}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Dropdown value={f.brand} onChange={(v) => set("brand", v)} options={SF.BRANDS.map((b) => ({ value: b, label: b }))} style={{ flex: 1, minWidth: 0 }} />
                  <button type="button" onClick={onManageBrands} title="จัดการแบรนด์ / รุ่น"
                    style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: "1px solid var(--border-strong)",
                      background: "var(--surface2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
                    <Icon name="settings" size={16} color="var(--text-2)" />
                  </button>
                </div>
              </Field>
              <Field label="ขนาดระบบ (kW)"><input type="number" step="0.1" style={inputStyle} value={f.kw} onChange={(e) => set("kw", parseFloat(e.target.value) || 0)} /></Field>
              <Field label="จำนวนแผง"><input type="number" style={inputStyle} value={f.panels} onChange={(e) => set("panels", parseInt(e.target.value) || 0)} /></Field>
              <Field label="ระบบไฟฟ้า">
                <Dropdown value={f.phase || "1"} onChange={(v) => set("phase", v)} options={[{ value: "1", label: "1 เฟส" }, { value: "3", label: "3 เฟส" }]} />
              </Field>
              <Field label="ตาข่ายกันนก">
                <ToggleField on={f.birdnet} onChange={(v) => set("birdnet", v)} labelOn="ติดตั้ง" labelOff="ไม่ติด" />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: isMobile ? 12 : 14, marginTop: isMobile ? 12 : 14, opacity: noBattery ? 0.45 : 1, pointerEvents: noBattery ? "none" : "auto" }}>
              <Field label="ระบบแบตเตอรี่">
                <ToggleField on={f.battery} onChange={(v) => set("battery", v)} labelOn="มีแบต" labelOff="ไม่มี" />
              </Field>
              <Field label="ขนาดแบต">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" min="0" step="0.5" style={Object.assign({}, inputStyle, { flex: 1, minWidth: 0 })}
                    value={f.battery ? (parseFloat(f.batSize) || "") : ""}
                    onChange={(e) => set("batSize", e.target.value ? (parseFloat(e.target.value) || 0) + " kWh" : "ไม่มี")}
                    disabled={!f.battery} placeholder="เช่น 10" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>kWh</span>
                </div>
              </Field>
              <Field label="ระบบ / ออฟติไมเซอร์">
                <Dropdown value={f.connect} onChange={(v) => set("connect", v)} options={["-","ต่อ 1:1","ต่อ 1:2"].map((s) => ({ value: s, label: s }))} />
              </Field>
              <Field label="ระบบ Backup">
                <ToggleField on={f.backup} onChange={(v) => set("backup", v)} labelOn="มี" labelOff="ไม่มี" />
              </Field>
            </div>
            {noBattery && <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>* แบรนด์ {f.brand} ไม่รองรับระบบแบตเตอรี่/Backup — ปรับได้ที่ “จัดการแบรนด์”</div>}
          </Section>

          {/* materials */}
          <Section title="สถานะวัสดุ" icon="box">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
              {SF.MATERIALS.map((m) => (
                <Field key={m.key} label={m.th}>
                  <Dropdown value={f.mat[m.key]} onChange={(v) => setMat(m.key, v)} options={Object.entries(SF.MAT_STATUS).map(([k, v]) => ({ value: k, label: v.icon + " " + v.th }))} />
                </Field>
              ))}
            </div>
          </Section>

          {/* workflow */}
          <Section title="สถานะงาน & ปัญหา" icon="flow">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 14 }}>
              <Field label="ขั้นตอนปัจจุบัน" span>
                <Dropdown value={f.stage} onChange={(v) => set("stage", v)} options={SF.STAGES.map((s, i) => ({ value: s.key, label: (i + 1) + ". " + s.th }))} />
              </Field>
              <Field label="ปัญหา / สิ่งที่ติด (ถ้ามี)" span>
                <input style={inputStyle} value={f.problem || ""} onChange={(e) => set("problem", e.target.value || null)} placeholder="เช่น รออินเวอร์เตอร์ของขาดสต็อก..." />
              </Field>
              <Field label="หมายเหตุ" span>
                <textarea style={Object.assign({}, inputStyle, { resize: "vertical", minHeight: 56 })} value={f.note} onChange={(e) => set("note", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* per-stage schedule → timeline ที่ล็อกตามลำดับ + วันต่อเนื่อง */}
          <Section title="กำหนดการแต่ละขั้น (Flow)" icon="calendar">
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.5 }}>
              ทำเรียงทีละขั้น — กรอก<b style={{ color: "var(--text-2)" }}>วันเสร็จ</b>ของขั้นก่อนหน้าให้ครบ ขั้นถัดไปจึงปลดล็อก · วันเริ่มของขั้นถัดไปจะต่อจากวันเสร็จของขั้นก่อนให้อัตโนมัติ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {SF.STAGES.map((s, i) => {
                const sv = stageVal(s.key);
                const prevEnd = i === 0 ? "" : stageVal(SF.STAGES[i - 1].key).end;
                const locked = i > 0 && !prevEnd;
                const done = !!(sv.start && sv.end);
                const isLast = i === SF.STAGES.length - 1;
                const cap = { fontSize: 9.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 3, display: "block" };
                const dis = (extra) => Object.assign({}, inputStyle, extra ? { opacity: .5, cursor: "not-allowed", background: "var(--surface)" } : {});
                return (
                  <div key={s.key} style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                    {/* rail */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 26 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700,
                        background: done ? s.color : "var(--surface2)", border: "2px solid " + (locked ? "var(--border-strong)" : s.color), color: done ? "#fff" : (locked ? "var(--text-3)" : s.color) }}>
                        {done ? <Icon name="check" size={13} color="#fff" sw={3} /> : (locked ? <Icon name="lock" size={12} color="var(--text-3)" /> : (i + 1))}
                      </span>
                      {!isLast && <span style={{ flex: 1, width: 2, minHeight: 14, background: done ? s.color : "var(--border)", margin: "3px 0" }} />}
                    </div>
                    {/* content */}
                    <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18, opacity: locked ? .55 : 1, transition: "opacity .2s" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 7, minHeight: 26 }}>
                        {s.th} <span style={{ fontWeight: 400, color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>{s.en}</span>
                        {locked && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 600, color: "var(--text-3)" }}>กรอกขั้นก่อนให้เสร็จก่อน</span>}
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div><span style={cap}>เริ่ม</span>
                          <input type="date" disabled={locked} min={prevEnd || undefined} max={sv.end || undefined}
                            style={dis(locked)} value={sv.start}
                            onChange={(e) => setStageField(s.key, "start", e.target.value)} />
                        </div>
                        <div><span style={cap}>เสร็จ</span>
                          <input type="date" disabled={locked || !sv.start} min={sv.start || prevEnd || undefined}
                            style={dis(locked || !sv.start)} value={sv.end}
                            onChange={(e) => setStageEnd(s.key, i, e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* footer */}
        <div style={{ padding: isMobile ? "14px 16px" : "16px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 20px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={save} style={{ flex: isMobile ? 1 : "none", padding: "11px 24px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="check" size={16} color="#fff" sw={2.5} /> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: mob ? 14 : 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
        <Icon name={icon} size={14} color="var(--primary)" /> {title}
      </div>
      {children}
    </div>
  );
}

function ToggleField({ on, onChange, labelOn, labelOff }) {
  return (
    <button onClick={() => onChange(!on)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 10,
      border: "1px solid var(--border-strong)", background: "var(--surface2)", cursor: "pointer", fontFamily: "inherit", height: 38 }}>
      <span style={{ width: 38, height: 22, borderRadius: 99, background: on ? "var(--primary)" : "var(--surface3)", position: "relative", transition: "background .2s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? "var(--primary-dark)" : "var(--text-3)" }}>{on ? labelOn : labelOff}</span>
    </button>
  );
}

Object.assign(window, { JobForm, TechManager, BrandManager });

/* ============================================================
   TechManager — add / edit / delete the technician team
   ============================================================ */
function TechManager({ store, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const techs = store.techs;
  const [editing, setEditing] = React.useState(null); // tech record being edited, or null

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 20, width: "min(560px,100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="users" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>จัดการทีมช่าง</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{techs.length} คน · เพิ่ม / แก้ไข / ลบ ได้</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={17} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
          {techs.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 99, background: t.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{t.nick.slice(0, 2) || "?"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{t.name || "(ยังไม่ระบุชื่อ)"}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.role}</div>
              </div>
              <button onClick={() => setEditing(Object.assign({}, t))} title="แก้ไข" style={{ background: "#3B82F614", border: "none", color: "#3B82F6", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={15} /></button>
              <button onClick={() => { if (techs.length <= 1) { alert("ต้องมีช่างอย่างน้อย 1 คน"); return; } if (confirm("ลบช่าง \"" + t.name + "\" ?")) store.remove(t.id); }} title="ลบ" style={{ background: "#EF444414", border: "none", color: "#EF4444", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setEditing(store.blankTech())} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}><Icon name="plus" size={16} color="#fff" sw={2.4} /> เพิ่มช่าง</button>
        </div>
      </div>

      {editing && <TechEditModal initial={editing} colors={store.colors} onSave={(rec) => { store.upsert(rec); setEditing(null); }} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TechEditModal({ initial, colors, onSave, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const isNew = !initial.name;
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", zIndex: 120, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 18, width: "min(420px,100%)", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มช่างใหม่" : "แก้ไขข้อมูลช่าง"}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ width: 56, height: 56, borderRadius: 99, background: f.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 19 }}>{(f.nick || f.name).slice(0, 2) || "?"}</span>
          </div>
          <Field label="ชื่อ-นามสกุล" required><input autoFocus style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น สมชาย ตั้งใจ" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="ชื่อเล่น (ย่อ)"><input style={inputStyle} value={f.nick} onChange={(e) => set("nick", e.target.value)} placeholder="ชาย" /></Field>
            <Field label="ตำแหน่ง">
              <Dropdown value={f.role} onChange={(v) => set("role", v)} options={["หัวหน้าทีม A", "หัวหน้าทีม B", "ช่างไฟ", "ช่างติดตั้ง", "ผู้ช่วยช่าง"].map((r) => ({ value: r, label: r }))} />
            </Field>
          </div>
          <Field label="สีประจำตัว">
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {colors.map((c) => (
                <button type="button" key={c} onClick={() => set("color", c)} style={{ width: 30, height: 30, borderRadius: 99, background: c, border: f.color === c ? "3px solid var(--text-1)" : "3px solid transparent", cursor: "pointer", boxShadow: "0 0 0 1px var(--border)" }} />
              ))}
            </div>
          </Field>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => { if (!f.name.trim()) { alert("กรุณากรอกชื่อช่าง"); return; } const rec = Object.assign({}, f); if (!rec.nick.trim()) rec.nick = rec.name.trim().slice(0, 2); onSave(rec); }}
            style={{ padding: "10px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BrandManager — add / edit / delete inverter brands & models
   ============================================================ */
function BrandManager({ store, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const brands = store.brands;
  const [editing, setEditing] = React.useState(null); // { rec, origName } or null

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 20, width: "min(560px,100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="sun" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>จัดการแบรนด์ / รุ่นอินเวอร์เตอร์</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{brands.length} รายการ · เพิ่ม / แก้ไข / ลบ ได้</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={17} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
          {brands.map((b) => (
            <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--primary-dark)", flexShrink: 0 }}><Icon name="sun" size={17} color="var(--primary-dark)" /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                <div style={{ fontSize: 11.5, color: b.battery ? "var(--primary-dark)" : "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.battery ? "รองรับแบต/Backup" : "ไม่รองรับแบต/Backup"}</div>
              </div>
              <button onClick={() => setEditing({ rec: Object.assign({}, b), origName: b.name })} title="แก้ไข" style={{ flexShrink: 0, background: "#3B82F614", border: "none", color: "#3B82F6", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={15} /></button>
              <button onClick={() => { if (brands.length <= 1) { alert("ต้องมีแบรนด์อย่างน้อย 1 รายการ"); return; } if (confirm("ลบแบรนด์ \"" + b.name + "\" ?\n(งานที่ใช้แบรนด์นี้อยู่จะยังคงค่าเดิมไว้)")) store.remove(b.name); }} title="ลบ" style={{ flexShrink: 0, background: "#EF444414", border: "none", color: "#EF4444", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setEditing({ rec: { name: "", battery: true }, origName: null })} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}><Icon name="plus" size={16} color="#fff" sw={2.4} /> เพิ่มแบรนด์ / รุ่น</button>
        </div>
      </div>

      {editing && <BrandEditModal initial={editing.rec} origName={editing.origName} existing={brands}
        onSave={(rec) => { store.upsert(rec, editing.origName); setEditing(null); }} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BrandEditModal({ initial, origName, existing, onSave, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const isNew = origName == null;
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", zIndex: 120, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 18, width: "min(420px,100%)", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มแบรนด์ / รุ่นใหม่" : "แก้ไขแบรนด์ / รุ่น"}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="ชื่อแบรนด์ / รุ่น" required><input autoFocus style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น Deye, Growatt, SUN2000..." /></Field>
          <Field label="รองรับระบบแบตเตอรี่ / Backup">
            <ToggleField on={f.battery} onChange={(v) => set("battery", v)} labelOn="รองรับ" labelOff="ไม่รองรับ" />
          </Field>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => {
              const name = f.name.trim();
              if (!name) { alert("กรุณากรอกชื่อแบรนด์/รุ่น"); return; }
              if (existing.some((b) => b.name === name && name !== origName)) { alert("มีแบรนด์ชื่อนี้อยู่แล้ว"); return; }
              onSave(Object.assign({}, f, { name }));
            }}
            style={{ padding: "10px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}
