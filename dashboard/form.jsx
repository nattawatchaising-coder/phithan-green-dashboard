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

function JobForm({ initial, isNew, onSave, onClose, onManageTechs, onManageBrands, jobs }) {
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
  // วันนัดติดตั้ง — ช่วงวันที่ใช้จัดตาราง (เก็บใน stageDates.install = {start,end}) รองรับหลายวัน
  const installDate = (SF.installDate ? SF.installDate(f) : "");      // วันเริ่ม
  const installEnd = (SF.installEnd ? SF.installEnd(f) : installDate); // วันเสร็จ (>= วันเริ่ม)
  const setInstall = (start, end) => setF((p) => Object.assign({}, p, { stageDates: Object.assign({}, p.stageDates, { install: { start: start, end: end } }) }));
  const setInstallStart = (v) => setInstall(v, (installEnd && installEnd >= v) ? installEnd : v);   // เลื่อนวันเสร็จตามถ้าจำเป็น
  const setInstallEnd = (v) => setInstall(installDate || v, (v && installDate && v < installDate) ? installDate : v);
  // ขั้นตอนการทำงาน = ตัวบอกสถานะ — กดเลือกขั้นปัจจุบัน
  const setCurStage = (k) => set("stage", k);
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

  // ── โหลดงานของช่างที่เลือก: กันลงงานซ้อนวันเดียวกันเกินไป ──
  const _addDayYmd = (k, n) => { const d = new Date(k + "T00:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const techNick = (SF.TECH_BY_ID && SF.TECH_BY_ID[f.tech]) ? (SF.TECH_BY_ID[f.tech].nick || SF.TECH_BY_ID[f.tech].name) : "";
  // วัน(YMD) → งานอื่นของช่างคนนี้ที่นัดติดตั้งวันนั้น (วันเดียวต่องาน — ไม่นับช่วงรายขั้นแบบเก่า)
  const otherTasksByDay = React.useMemo(() => {
    const map = {};
    if (!f.tech) return map;
    (jobs || []).forEach((j) => {
      if (j.id === f.id || j.tech !== f.tech || j.stage === "done") return;  // ไม่นับงานนี้เอง/งานเสร็จแล้ว + เฉพาะช่างคนเดียวกัน
      const s = SF.installDate ? SF.installDate(j) : "";
      if (!s) return;
      const e = SF.installEnd ? SF.installEnd(j) : s;
      let day = s, g = 0;
      while (g < 120) { (map[day] = map[day] || []).push(j); if (day === e) break; day = _addDayYmd(day, 1); g++; }  // กระจายทุกวันในช่วงติดตั้ง
    });
    return map;
  }, [jobs, f.tech, f.id]);
  // งานอื่นของช่าง (ไม่ซ้ำ) ที่คาบเกี่ยวช่วง [start..end] ของขั้นนี้
  const loadInSpan = (start, end) => {
    if (!f.tech || !start) return [];
    let s = start.slice(0, 10), e = (end || start).slice(0, 10); if (e < s) e = s;
    const seen = {}; const out = []; let day = s, g = 0;
    while (g < 120) { (otherTasksByDay[day] || []).forEach((j) => { if (!seen[j.id]) { seen[j.id] = 1; out.push(j); } }); if (day === e) break; day = _addDayYmd(day, 1); g++; }
    return out;
  };
  // จำนวนงานอื่น (ไม่ซ้ำ) ต่อวัน — ใช้ระบายมินิปฏิทินโหลดงานช่าง
  const otherCountByDay = React.useMemo(() => {
    const m = {};
    Object.keys(otherTasksByDay).forEach((day) => { const seen = {}; let n = 0; otherTasksByDay[day].forEach((j) => { if (!seen[j.id]) { seen[j.id] = 1; n++; } }); m[day] = n; });
    return m;
  }, [otherTasksByDay]);
  // ช่วงวันนัดติดตั้งของงานนี้ — ไฮไลต์ครบทุกวันในมินิปฏิทิน
  const thisJobDays = React.useMemo(() => {
    const set = {};
    if (!installDate) return set;
    let day = installDate, g = 0; const e = installEnd || installDate;
    while (g < 120) { set[day] = 1; if (day === e) break; day = _addDayYmd(day, 1); g++; }
    return set;
  }, [installDate, installEnd]);
  // เดือนที่โชว์ในมินิปฏิทิน (ตั้งต้น = เดือนของวันนัดติดตั้ง หรือวันนี้)
  const [flowMonth, setFlowMonth] = React.useState(() => {
    const base = new Date((installDate || window.SF.TODAY || "2026-06-15") + "T00:00:00");
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const FLOW_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

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
              <Field label="ลิงก์ Trello (การ์ดงาน)" span><input style={inputStyle} value={f.trello || ""} onChange={(e) => set("trello", e.target.value.trim())} placeholder="https://trello.com/c/..." /></Field>
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

          {/* สถานะงาน (กดเลือกขั้นปัจจุบัน) + วันนัดติดตั้ง (วันเดียวที่ใช้จัดตาราง) */}
          <Section title="สถานะงาน & วันนัดติดตั้ง" icon="calendar">
            {/* ── ขั้นตอนการทำงาน = ตัวบอกสถานะ — กดเลือกว่าตอนนี้ทำถึงขั้นไหน ── */}
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>
              แตะที่ขั้นเพื่อบอกว่า<b style={{ color: "var(--text-2)" }}>ตอนนี้งานอยู่ขั้นไหน</b> — ขั้นก่อนหน้าจะถือว่าเสร็จแล้ว
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 4 }}>
              {(() => {
                const curIdx = SF.STAGE_INDEX[f.stage] != null ? SF.STAGE_INDEX[f.stage] : 0;
                return SF.STAGES.map((s, i) => {
                  const isLast = i === SF.STAGES.length - 1;
                  const passed = i < curIdx;            // ผ่านแล้ว
                  const current = i === curIdx;          // กำลังทำ
                  const filled = passed || current;
                  return (
                    <button key={s.key} type="button" onClick={() => setCurStage(s.key)}
                      style={{ display: "flex", gap: 12, alignItems: "stretch", background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                      {/* rail */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 28 }}>
                        <span style={{ width: 28, height: 28, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 800,
                          background: filled ? s.color : "var(--surface2)", border: "2px solid " + (filled ? s.color : "var(--border-strong)"),
                          color: filled ? "#fff" : "var(--text-3)", boxShadow: current ? "0 0 0 4px " + (s.soft || "var(--primary-soft)") : "none", transition: "all .15s" }}>
                          {passed ? <Icon name="check" size={14} color="#fff" sw={3} /> : (i + 1)}
                        </span>
                        {!isLast && <span style={{ flex: 1, width: 2, minHeight: 18, background: passed ? s.color : "var(--border)", margin: "3px 0" }} />}
                      </div>
                      {/* content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 2 : 16, paddingTop: 3, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: current ? 800 : 600, color: current ? "var(--text-1)" : (passed ? "var(--text-2)" : "var(--text-3)") }}>
                          {s.th} <span style={{ fontWeight: 400, color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>{s.en}</span>
                          {current && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: s.color, background: (s.soft || "var(--primary-soft)"), padding: "2px 9px", borderRadius: 99, flexShrink: 0 }}>ตอนนี้</span>}
                          {passed && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>เสร็จแล้ว</span>}
                        </span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {/* ── วันนัดติดตั้ง — ระบุเป็นช่วงได้ (งานติดตั้งหลายวัน) ใช้จัดตารางงาน/ปฏิทิน ── */}
            <div style={{ borderTop: "1px dashed var(--border)", marginTop: 6, paddingTop: 16 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10, lineHeight: 1.5 }}>
                งานที่ติดตั้งหลายวัน ใส่<b style={{ color: "var(--text-2)" }}>วันเริ่ม–วันเสร็จ</b>ได้ · ถ้าวันเดียวใส่แค่วันเริ่ม
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="เริ่มติดตั้ง">
                  <input type="date" style={inputStyle} value={installDate} max={installEnd || undefined} onChange={(e) => setInstallStart(e.target.value)} />
                </Field>
                <Field label="เสร็จติดตั้ง">
                  <input type="date" style={Object.assign({}, inputStyle, installDate ? null : { opacity: .5, cursor: "not-allowed" })} disabled={!installDate} min={installDate || undefined} value={installEnd} onChange={(e) => setInstallEnd(e.target.value)} />
                </Field>
              </div>
              {installDate && f.tech && (() => {
                const days = Object.keys(thisJobDays);
                const clash = days.reduce((n, d) => n + (otherCountByDay[d] || 0), 0);
                if (!clash) return null;
                return (
                  <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: "#B45309", background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="alert" size={13} color="#B45309" /> ช่าง{techNick} มีงานอื่นในช่วงนี้ {clash} งาน — เช็กว่าซ้อนกันไหม
                  </div>
                );
              })()}
            </div>

            {/* มินิปฏิทินโหลดงานช่าง — แตะวันว่างเพื่อเลือกวันนัดติดตั้ง */}
            {f.tech && (() => {
              const fm = flowMonth;
              const fFirst = new Date(fm.y, fm.m, 1).getDay();
              const fDays = new Date(fm.y, fm.m + 1, 0).getDate();
              const fCells = [];
              for (let i = 0; i < fFirst; i++) fCells.push(null);
              for (let d = 1; d <= fDays; d++) fCells.push(d);
              const fKey = (d) => fm.y + "-" + String(fm.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
              const fShift = (delta) => setFlowMonth((s) => { const n = new Date(s.y, s.m + delta, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
              const navB = { width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" };
              return (
                <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--surface2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <Icon name="calendar" size={13} color="var(--primary)" /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ปฏิทินงานช่าง{techNick ? " " + techNick : ""} · {FLOW_MONTHS[fm.m]} {fm.y + 543}</span>
                    </span>
                    <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button type="button" onClick={() => fShift(-1)} style={navB}><Icon name="chevronRight" size={14} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} /></button>
                      <button type="button" onClick={() => fShift(1)} style={navB}><Icon name="chevronRight" size={14} color="var(--text-2)" /></button>
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                    {window.TH_DAYS.map((d, i) => (
                      <div key={d} style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)" }}>{d}</div>
                    ))}
                    {fCells.map((d, i) => {
                      if (d === null) return <div key={i} />;
                      const k = fKey(d);
                      const cnt = otherCountByDay[k] || 0;
                      const mine = !!thisJobDays[k];
                      const isToday = k === window.SF.TODAY;
                      let bg = "var(--surface)", col = "var(--text-2)", bd = "1px solid var(--border)";
                      if (mine) { bg = "var(--primary-soft)"; col = "var(--primary-dark)"; bd = "1px solid var(--primary)"; }
                      else if (cnt >= 2) { bg = "#FEE2E2"; col = "#B91C1C"; bd = "1px solid #FCA5A5"; }
                      else if (cnt === 1) { bg = "#FEF3C7"; col = "#B45309"; bd = "1px solid #FCD34D"; }
                      return (
                        <button type="button" key={i} onClick={() => setInstallStart(k)}
                          title={(mine ? "วันนัดติดตั้งงานนี้" : cnt ? "ช่างมี " + cnt + " งาน" : "ว่าง") + " · " + d + " " + FLOW_MONTHS[fm.m] + " — แตะเพื่อเลือกวันเริ่มติดตั้ง"}
                          style={{ minHeight: 30, borderRadius: 7, border: isToday && !mine ? "1.5px solid var(--primary)" : bd, background: bg, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                          <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: col }}>{d}</span>
                          {!mine && cnt > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: col, lineHeight: 1 }}>{cnt} งาน</span>}
                          {mine && <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--primary)" }} />}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 9, flexWrap: "wrap", fontSize: 10, color: "var(--text-3)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid var(--border)", background: "var(--surface)" }} /> ว่าง</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#FEF3C7", border: "1px solid #FCD34D" }} /> มี 1 งาน</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#FEE2E2", border: "1px solid #FCA5A5" }} /> 2+ งาน</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary-soft)", border: "1px solid var(--primary)" }} /> วันติดตั้งงานนี้</span>
                  </div>
                </div>
              );
            })()}
          </Section>
        </div>

        {/* footer */}
        <div style={{ padding: isMobile ? "14px 16px calc(14px + env(safe-area-inset-bottom, 0px))" : "16px 24px calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 20px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={save} style={{ flex: isMobile ? 1 : "none", padding: "11px 24px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Icon name="check" size={16} color="#fff" sw={2.5} /> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, right, children }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: mob ? 14 : 18 }}>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name={icon} size={14} color="var(--primary)" /> {title}
        </span>
        {right}
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
