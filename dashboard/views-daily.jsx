/* ============================================================
   PHITHAN GREEN — รายงานประจำวัน: ฟอร์มกรอก · กระดาษ PDF · หน้ารวมของหัวหน้า

   PDF ใช้วิธีเดียวกับรายงานสำรวจ (survey-report.jsx) คือสั่งพิมพ์ของเบราว์เซอร์
   แล้วเลือก "บันทึกเป็น PDF" — ได้ภาษาไทยคมชัด เลือกข้อความได้ ไม่ต้องฝังฟอนต์หลายเมกฯ

   ตั้งชื่อ top-level ขึ้นต้นด้วย Dr/dv กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

/* ── ชิ้นส่วนฟอร์ม ── */
function DrLabel({ children, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)", letterSpacing: ".02em" }}>{children}</span>
      {hint && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</span>}
    </div>
  );
}

const DR_INPUT = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

function DrText({ value, onChange, rows, placeholder, disabled }) {
  return (
    <textarea value={value || ""} disabled={disabled} placeholder={placeholder} rows={rows || 3}
      onChange={(e) => onChange(e.target.value)}
      style={Object.assign({}, DR_INPUT, { resize: "vertical", lineHeight: 1.6, opacity: disabled ? 0.65 : 1 })} />
  );
}

function DrSection({ n, title, hint, children, tone }) {
  return (
    <div style={{ marginBottom: 16, border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0,
          background: (tone || "var(--primary)") + "1e", color: tone || "var(--primary-dark)",
          fontSize: 11.5, fontWeight: 800, fontFamily: "var(--mono)" }}>{n}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{title}</span>
        {hint && <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto", textAlign: "right" }}>{hint}</span>}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

/* ปุ่มเลือกแบบชิป — ใช้กับสภาพอากาศ / ระดับความเสี่ยง / ใบอนุญาต */
function DrChips({ options, value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((o) => {
        const on = value === o.key;
        const c = o.color || "var(--primary)";
        return (
          <button key={o.key} type="button" disabled={disabled}
            onClick={() => onChange(on ? "" : o.key)}
            style={{ padding: "7px 13px", borderRadius: 99, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, opacity: disabled && !on ? 0.5 : 1,
              border: "1px solid " + (on ? c : "var(--border-strong)"),
              background: on ? c + "1e" : "var(--surface)", color: on ? c : "var(--text-2)" }}>
            {o.th}{o.range && <span style={{ fontFamily: "var(--mono)", fontSize: 11, opacity: 0.75 }}> {o.range}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ตารางรายการที่เพิ่ม/ลบแถวเองได้ — วัสดุ · เครื่องจักร · กำลังคน · ใบรับรอง
   cols = [{k, th, w, type}] · type "num" = ช่องตัวเลข */
function DrRows({ cols, rows, onChange, disabled, addLabel }) {
  const list = rows || [];
  const setCell = (i, k, v) => {
    const copy = list.map((r, x) => (x === i ? Object.assign({}, r, { [k]: v }) : r));
    onChange(copy);
  };
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr>
              <th style={{ width: 30, textAlign: "left", padding: "4px 6px", fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>#</th>
              {cols.map((c) => (
                <th key={c.k} style={{ width: c.w, textAlign: "left", padding: "4px 6px", fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{c.th}</th>
              ))}
              {!disabled && <th style={{ width: 30 }} />}
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "3px 6px", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>{i + 1}</td>
                {cols.map((c) => (
                  <td key={c.k} style={{ padding: "3px 3px" }}>
                    <input value={r[c.k] || ""} disabled={disabled}
                      inputMode={c.type === "num" ? "decimal" : undefined}
                      onChange={(e) => setCell(i, c.k, e.target.value)}
                      style={Object.assign({}, DR_INPUT, { padding: "7px 9px", fontSize: 12.5,
                        fontFamily: c.type === "num" ? "var(--mono)" : "inherit", opacity: disabled ? 0.65 : 1 })} />
                  </td>
                ))}
                {!disabled && (
                  <td style={{ padding: "3px 3px", textAlign: "center" }}>
                    <button type="button" onClick={() => onChange(list.filter((_, x) => x !== i))} title="ลบแถวนี้"
                      style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={cols.length + 2} style={{ padding: "14px 6px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีรายการ</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {!disabled && (
        <button type="button" onClick={() => onChange(list.concat([{}]))}
          style={{ marginTop: 9, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
            border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="plus" size={14} /> {addLabel || "เพิ่มแถว"}
        </button>
      )}
    </div>
  );
}

/* ── ตารางขั้นงาน ──
   งานบ้าน: ระบบเติมให้เอง แก้ได้แค่ % (วันจริงมาจากประวัติการเลื่อนขั้น ไม่ให้พิมพ์ทับ)
   งานโครงการ: กรอก/เพิ่ม/ลบหัวข้อได้เอง เพราะแผนงานแต่ละโครงการไม่เหมือนกัน */
function DrStepTable({ steps, onChange, disabled, editable, onReset, plan, dates, weight }) {
  const list = steps || [];
  const set = (i, k, v) => onChange(list.map((r, x) => (x === i ? Object.assign({}, r, { [k]: v }) : r)));
  const cell = { padding: "5px 6px", borderBottom: "1px solid var(--border)", fontSize: 12 };
  /* แก้ไม่ได้ก็ไม่ต้องขึ้นเป็นช่องกรอก — งานบ้านมีวันแผนแค่ขั้นติดตั้ง
     ถ้าโชว์ช่องว่างที่กดไม่ได้ทั้งตาราง จะดูเหมือนฟอร์มเสียมากกว่าเป็นข้อมูล */
  const dateBox = (i, k, r) => (editable && !disabled ? (
    <input type="date" value={r[k] || ""} onChange={(e) => set(i, k, e.target.value)}
      style={Object.assign({}, DR_INPUT, { padding: "6px 7px", fontSize: 11.5, fontFamily: "var(--mono)", minWidth: 118 })} />
  ) : (
    <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-2)" }}>{r[k] ? window.drShort(r[k]) : "—"}</span>
  ));
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: plan ? 640 : 400, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ขั้น", "รายละเอียดงาน"].concat(plan ? ["แผน เริ่ม", "แผน จบ"] : [])
                .concat(dates ? ["จริง เริ่ม", "จริง จบ"] : [])
                .concat(weight ? ["น้ำหนักงาน %"] : []).concat(["ทำไปแล้ว %"]).map((h, i, a) => (
                <th key={i} style={{ textAlign: i === a.length - 1 ? "right" : "left", padding: "5px 6px", fontSize: 11,
                  color: "var(--text-3)", fontWeight: 700, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
              {editable && !disabled && <th style={{ width: 30, borderBottom: "1px solid var(--border-strong)" }} />}
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={i} style={{ background: r.head ? "var(--surface)" : "transparent" }}>
                <td style={Object.assign({}, cell, { fontFamily: "var(--mono)", fontWeight: r.head ? 800 : 500,
                  color: r.head ? "var(--primary-dark)" : "var(--text-3)", whiteSpace: "nowrap" })}>{r.no}</td>
                <td style={Object.assign({}, cell, { minWidth: 190 })}>
                  {editable && !disabled ? (
                    <input value={r.th || ""} onChange={(e) => set(i, "th", e.target.value)}
                      style={Object.assign({}, DR_INPUT, { padding: "6px 8px", fontSize: 12.5, fontWeight: r.head ? 700 : 400 })} />
                  ) : (
                    <span style={{ fontWeight: r.head ? 700 : 400, color: "var(--text-1)" }}>{r.th}</span>
                  )}
                </td>
                {plan && <td style={cell}>{dateBox(i, "planStart", r)}</td>}
                {plan && <td style={cell}>{dateBox(i, "planEnd", r)}</td>}
                {dates && <td style={cell}>{dateBox(i, "actStart", r)}</td>}
                {dates && <td style={cell}>{dateBox(i, "actEnd", r)}</td>}
                {/* น้ำหนักงาน — หัวข้อไหนสำคัญกว่ากันในภาพรวมของงานนี้ ใช้ถ่วงเป็น % รวม */}
                {weight && (
                  <td style={Object.assign({}, cell, { textAlign: "right" })}>
                    <input value={r.w === 0 || r.w ? String(r.w) : ""} disabled={disabled || !editable} inputMode="numeric"
                      onChange={(e) => set(i, "w", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      style={Object.assign({}, DR_INPUT, { padding: "6px 7px", fontSize: 12, fontFamily: "var(--mono)",
                        textAlign: "right", width: 56, opacity: disabled ? 0.65 : 1 })} />
                  </td>
                )}
                <td style={Object.assign({}, cell, { textAlign: "right" })}>
                  <input value={r.pct === 0 || r.pct ? String(r.pct) : ""} disabled={disabled} inputMode="numeric"
                    onChange={(e) => set(i, "pct", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                    style={Object.assign({}, DR_INPUT, { padding: "6px 7px", fontSize: 12, fontFamily: "var(--mono)",
                      textAlign: "right", width: 56, opacity: disabled ? 0.65 : 1 })} />
                </td>
                {editable && !disabled && (
                  <td style={Object.assign({}, cell, { textAlign: "center" })}>
                    <button type="button" onClick={() => onChange(list.filter((_, x) => x !== i))} title="ลบขั้นนี้"
                      style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {weight && (() => {
        /* บอกให้เห็นว่าน้ำหนักรวมครบ 100 หรือยัง — ไม่ครบก็ยังคิด % ได้ (หารด้วยยอดที่กรอกจริง)
           แต่ต้องรู้ตัว ไม่งั้นงานเสร็จหมดแล้วตัวเลขรวมไม่ถึง 100 จะงงกันเปล่า ๆ */
        const sum = window.drWeightSum(list);
        const ok = sum === 100;
        return (
          <div style={{ marginTop: 7, fontSize: 11.5, fontWeight: 700, color: ok ? "var(--text-3)" : "#B45309" }}>
            น้ำหนักงานรวม {sum}%{ok ? "" : " · ยังไม่ครบ 100% — ระบบจะเทียบสัดส่วนให้จากยอดนี้"}
          </div>
        );
      })()}
      {editable && !disabled && (
        <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onChange(list.concat([{ no: String(list.length + 1), th: "", head: true, pct: 0, w: 0 }]))}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
              border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="plus" size={14} /> เพิ่มหัวข้อใหญ่
          </button>
          <button type="button" onClick={() => onChange((onReset || window.drWhaSteps)())}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
              border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-3)" }}>
            <Icon name="undo" size={14} /> คืนชุดมาตรฐาน
          </button>
        </div>
      )}
    </div>
  );
}

/* ── รูปหน้างานของรายงานวันนี้ ── */
function DrPhotos({ jobId, date, currentUser, disabled }) {
  const { photos, add, setCap, remove } = window.useDailyPhotos(jobId, date);
  const [busy, setBusy] = React.useState(0);
  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const f of files) {
      try { add(await window.resizeImageFile(f, 1200, 0.72), currentUser); } catch (err) { /* ข้ามไฟล์ที่อ่านไม่ได้ */ }
      setBusy((n) => n - 1);
    }
  };
  return (
    <div>
      {!disabled && (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
          border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
          fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: photos.length ? 12 : 0 }}>
          <Icon name="camera" size={15} /> {busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)"}
          <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
        </label>
      )}
      {!photos.length && disabled && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ไม่มีรูปในรายงานวันนี้</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 11 }}>
        {photos.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ position: "relative", background: "#0d1512" }}>
              <img src={p.dataUrl} alt={p.cap || "รูปหน้างาน"} style={{ width: "100%", height: 112, objectFit: "cover", display: "block" }} />
              {!disabled && (
                <button type="button" onClick={() => remove(p.id)} title="ลบรูปนี้"
                  style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 8, border: "none",
                    background: "rgba(8,20,14,.62)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="trash" size={13} color="#fff" />
                </button>
              )}
            </div>
            <input value={p.cap || ""} disabled={disabled} placeholder="คำบรรยายรูป"
              onChange={(e) => setCap(p.id, e.target.value)}
              style={{ width: "100%", border: "none", borderTop: "1px solid var(--border)", padding: "8px 10px",
                background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ฟอร์มกรอกรายงานประจำวัน
   ══════════════════════════════════════════════════ */
function DailyReportModal({ job, role, currentUser, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = window.useDailyReports(job ? job.id : null);
  const [date, setDate] = React.useState(window.drToday);
  const [form, setForm] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
  const timer = React.useRef(null);
  const saved = store.byDate[date] || null;

  /* โหลดใบของวันที่เลือก · วันที่ยังไม่เคยเขียนให้ตั้งใบเปล่าที่ก๊อปขั้นงานจากใบก่อนหน้ามา */
  React.useEffect(() => {
    if (!job) return;
    /* ใบที่มีอยู่แล้ววางทับใบเปล่า — ใบเก่าจากรายงานรุ่นแรกไม่มี mode/steps
       ถ้าเอาใบเก่ามาตรง ๆ ตารางขั้นงานจะหายและโหมดกลายเป็นว่าง */
    const blank = window.drBlank(job, date, currentUser, window.drPrevOf(store.byDate, date));
    const rec = saved ? Object.assign(blank, saved) : blank;
    if (rec.mode !== "project" && window.drIsBoardSteps(rec.steps)) rec.steps = window.drHomeSteps();
    if (rec.mode !== "project") rec.pct = window.drRollup(rec.steps);
    setForm(rec);
  }, [job ? job.id : null, date, saved ? saved.updatedAt : null]);

  const locked = !window.drCanEdit(role, form);
  const canApprove = window.drCanApprove(role);
  const prev = window.drPrevOf(store.byDate, date);
  const isProject = form && form.mode === "project";

  /* เซฟอัตโนมัติ — ช่างหน้างานเน็ตหลุดบ่อย ไม่ควรต้องกดบันทึก
     หน่วงไว้ 600ms ไม่งั้นพิมพ์ทีละตัวอักษรก็เขียนฐานข้อมูลทีละครั้ง */
  const edit = (fields) => {
    if (locked) return;
    setForm((f) => {
      const next = Object.assign({}, f, fields);
      /* งานบ้าน — % รวมคิดจากน้ำหนักงานเสมอ แก้ตารางแล้วตัวเลขรวมต้องขยับตาม ไม่ค้างค่าเก่า */
      if (next.mode !== "project") next.pct = window.drRollup(next.steps);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => store.save(date, next), 600);
      return next;
    });
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const flush = () => { clearTimeout(timer.current); if (form && !locked) store.save(date, form); };

  const send = () => {
    flush();
    store.save(date, Object.assign({}, form, { status: "sent", sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || null, byName: (currentUser || {}).name || "" }));
  };
  const approve = () => {
    store.save(date, Object.assign({}, form, { status: "approved", approvedAt: new Date().toISOString(),
      appId: (currentUser || {}).id || null, appName: (currentUser || {}).name || "" }));
  };
  const reopen = () => store.patch(date, { status: "draft", approvedAt: null, appId: null, appName: null });

  if (!job || !form) return null;
  const st = window.drStatusOf(form.status);

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(8,20,14,.55)", overflow: "auto",
        padding: isMobile ? 0 : "24px 16px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", background: "var(--bg)", borderRadius: isMobile ? 0 : 16,
          minHeight: isMobile ? "100dvh" : 0, overflow: "hidden", boxShadow: "0 24px 70px rgba(8,20,14,.32)" }}>

          {/* หัวฟอร์ม */}
          <div style={{ position: "sticky", top: 0, zIndex: 3, background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: isMobile ? "13px 14px" : "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: isMobile ? 15.5 : 17.5, fontWeight: 800, color: "var(--text-1)" }}>รายงานประจำวันหน้างาน</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.color + "1c",
                    border: "1px solid " + st.color + "40", borderRadius: 99, padding: "2px 10px" }}>{st.th}</span>
                  {isProject && <span style={{ fontSize: 11, fontWeight: 700, color: "#7C5CFC", background: "#7C5CFC1c", borderRadius: 99, padding: "2px 9px" }}>งานโครงการ · แบบครบ</span>}
                  {!isProject && <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "#F59E0B1c", borderRadius: 99, padding: "2px 9px" }}>งานบ้าน · แบบย่อ</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {job.code} · {job.name}
                </div>
              </div>
              <button onClick={() => { flush(); onClose(); }}
                style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* เลือกวัน — วันไหนมีรายงานแล้วขึ้นจุดสี กดข้ามไปดู/แก้ได้ */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
              <button onClick={() => setDate(window.drAddDays(date, -1))} title="วันก่อนหน้า"
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
                <Icon name="chevronRight" size={15} style={{ transform: "rotate(180deg)" }} />
              </button>
              <input type="date" value={date} max={window.drToday()} onChange={(e) => setDate(e.target.value || window.drToday())}
                style={Object.assign({}, DR_INPUT, { width: "auto", padding: "7px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
              <button onClick={() => setDate(window.drAddDays(date, 1))} disabled={date >= window.drToday()} title="วันถัดไป"
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: date >= window.drToday() ? "default" : "pointer", opacity: date >= window.drToday() ? 0.4 : 1,
                  display: "grid", placeItems: "center", color: "var(--text-2)" }}>
                <Icon name="chevronRight" size={15} />
              </button>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{window.drDateTH(date, true)}</span>
              {!!store.dates.length && (
                <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>เขียนไว้แล้ว {store.dates.length} วัน</span>
              )}
            </div>
            {store.dates.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 9, overflowX: "auto", paddingBottom: 2 }}>
                {store.dates.slice(0, 14).map((d) => {
                  const s = window.drStatusOf((store.byDate[d] || {}).status);
                  const on = d === date;
                  return (
                    <button key={d} onClick={() => setDate(d)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 99, flexShrink: 0,
                        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"), background: on ? "var(--primary-soft)" : "var(--surface)",
                        cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                        color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color }} />
                      {window.drShort(d)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* เนื้อฟอร์ม */}
          <div style={{ padding: isMobile ? "14px 13px 90px" : "18px 20px 100px" }}>
            {locked && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
                border: "1px solid #10B98140", background: "#10B98114", borderRadius: 12 }}>
                <Icon name="lock" size={15} color="#10B981" />
                <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>
                  อนุมัติแล้วโดย <b>{form.appName || "-"}</b> · แก้ไขไม่ได้{canApprove ? " — หัวหน้ากดปลดล็อกได้ที่ปุ่มด้านล่าง" : ""}
                </span>
              </div>
            )}

            <DrSection n="1" title="งานที่ทำวันนี้" hint="เขียนสั้น ๆ ว่าเดินงานอะไรไปบ้าง">
              <DrText value={form.work} disabled={locked} rows={3}
                placeholder="เช่น ติดตั้งรางสายไฟฝั่งทิศใต้ครบ 40 เมตร · ยกแผงขึ้นหลังคา 16 แผง"
                onChange={(v) => edit({ work: v })} />
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 12, flexWrap: "wrap" }}>
                <DrLabel>ความคืบหน้ารวมของงาน</DrLabel>
                {/* งานบ้านไม่ให้พิมพ์ตัวเลขรวมเอง — คิดจากน้ำหนักของแต่ละเนื้องานในตารางข้างล่าง
                    ช่างจะได้ไม่ต้องเดาว่ารวมแล้วกี่ % และตัวเลขจะตรงกับงานที่ทำจริง */}
                {isProject ? (
                  <input value={String(form.pct == null ? "" : form.pct)} disabled={locked} inputMode="numeric"
                    onChange={(e) => edit({ pct: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })}
                    style={Object.assign({}, DR_INPUT, { width: 78, padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right", marginBottom: 6 })} />
                ) : (
                  <span style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, color: "var(--primary-dark)",
                    lineHeight: 1, marginBottom: 6 }}>{+form.pct || 0}</span>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>%</span>
                {!isProject && <span style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 6 }}>คิดจากน้ำหนักงานในตารางข้างล่าง</span>}
                {prev && prev.pct != null && (
                  <span style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>
                    เมื่อวาน {prev.pct}% → <b style={{ color: (+form.pct || 0) >= (+prev.pct || 0) ? "#10B981" : "#EF4444" }}>
                      {(+form.pct || 0) - (+prev.pct || 0) >= 0 ? "+" : ""}{(+form.pct || 0) - (+prev.pct || 0)}%</b>
                  </span>
                )}
              </div>
              <div style={{ marginTop: 6 }}>
                <DrLabel hint={isProject ? "เพิ่ม/แก้/ลบหัวข้อได้ตามแผนงานของโครงการนี้" : "น้ำหนักงาน = หัวข้อนี้คิดเป็นกี่ % ของงานทั้งหลัง"}>{isProject ? "ตารางขั้นงาน" : "เนื้องานติดตั้ง"}</DrLabel>
                {/* งานบ้านไม่มีวันแผน/วันจริงรายหัวข้อ — มีแค่ช่วงวันติดตั้งช่วงเดียวของทั้งงาน
                    เหลือ เนื้องาน · น้ำหนักงาน · ทำไปแล้ว กี่ % กรอกบนมือถือหน้างานได้จริง */}
                <DrStepTable steps={form.steps} disabled={locked} editable
                  plan={isProject} dates={isProject} weight={!isProject}
                  onReset={isProject ? window.drWhaSteps : window.drHomeSteps}
                  onChange={(v) => edit({ steps: v })} />
              </div>
            </DrSection>

            <DrSection n="2" title="ทีมช่าง & สภาพอากาศ" tone="#3B82F6">
              <DrLabel hint="ใครไปบ้าง กี่คน">ทีมที่เข้าหน้างาน</DrLabel>
              <DrText value={form.team} disabled={locked} rows={2}
                placeholder={"เช่น ทีม A — " + ((job.tech && job.tech.name) || "หัวหน้าทีม") + " + ช่าง 3 คน"}
                onChange={(v) => edit({ team: v })} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 13 }}>
                <div>
                  <DrLabel hint="08:30 – 12:00">อากาศช่วงเช้า</DrLabel>
                  <DrChips options={window.DR_WEATHER} value={form.weatherAm} disabled={locked} onChange={(v) => edit({ weatherAm: v })} />
                </div>
                <div>
                  <DrLabel hint="13:00 – 17:00">อากาศช่วงบ่าย</DrLabel>
                  <DrChips options={window.DR_WEATHER} value={form.weatherPm} disabled={locked} onChange={(v) => edit({ weatherPm: v })} />
                </div>
              </div>
            </DrSection>

            <DrSection n="3" title="รูปหน้างาน" tone="#F59E0B" hint="ใส่ได้ไม่จำกัด · ย่อรูปให้อัตโนมัติ">
              <DrPhotos jobId={job.id} date={date} currentUser={currentUser} disabled={locked} />
            </DrSection>

            <DrSection n="4" title="ปัญหา & งานพรุ่งนี้" tone="#EF4444">
              <DrLabel hint="ติดอะไร รอใคร">ปัญหา / อุปสรรควันนี้</DrLabel>
              <DrText value={form.problem} disabled={locked} rows={2}
                placeholder="เช่น ฝนตกช่วงบ่าย หยุดงานบนหลังคา · รอลูกค้ายืนยันจุดวางอินเวอร์เตอร์"
                onChange={(v) => edit({ problem: v })} />
              <div style={{ marginTop: 13 }}>
                <DrLabel>สิ่งที่ต้องทำต่อ</DrLabel>
                <DrText value={form.nextDay} disabled={locked} rows={2}
                  placeholder="เช่น เดินสาย DC ต่อจากจุดที่ค้าง · นัดช่างไฟเข้าต่อ MDB"
                  onChange={(v) => edit({ nextDay: v })} />
              </div>
            </DrSection>

            {isProject && (
              <React.Fragment>
                <DrSection n="5" title="วัสดุเข้าหน้างาน" tone="#0EA5E9">
                  <DrRows disabled={locked} addLabel="เพิ่มวัสดุ" rows={form.materials} onChange={(v) => edit({ materials: v })}
                    cols={[{ k: "name", th: "รายการวัสดุ" }, { k: "qty", th: "จำนวน", w: 80, type: "num" },
                      { k: "unit", th: "หน่วย", w: 80 }, { k: "loc", th: "จุดจัดเก็บ", w: 130 }, { k: "note", th: "หมายเหตุ", w: 130 }]} />
                </DrSection>
                <DrSection n="6" title="เครื่องจักร / เครื่องมือ" tone="#0EA5E9">
                  <DrRows disabled={locked} addLabel="เพิ่มเครื่องจักร" rows={form.machines} onChange={(v) => edit({ machines: v })}
                    cols={[{ k: "name", th: "รายการ" }, { k: "qty", th: "จำนวน", w: 80, type: "num" },
                      { k: "unit", th: "หน่วย", w: 80 }, { k: "job", th: "ใช้กับงาน", w: 150 }, { k: "note", th: "หมายเหตุ", w: 120 }]} />
                </DrSection>
                <DrSection n="7" title="กำลังคน" tone="#7C5CFC"
                  hint={"รวม " + (form.manpower || []).reduce((s, r) => s + (+r.qty || 0), 0) + " คน"}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 11 }}>
                    {window.DR_MANPOWER.map((m) => (
                      <button key={m.key} type="button" disabled={locked}
                        onClick={() => edit({ manpower: (form.manpower || []).concat([{ role: m.th, qty: "1" }]) })}
                        style={{ padding: "6px 11px", borderRadius: 99, border: "1px dashed var(--border-strong)", background: "var(--surface)",
                          cursor: locked ? "default" : "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                          color: "var(--text-2)", opacity: locked ? 0.5 : 1 }}>+ {m.th}</button>
                    ))}
                  </div>
                  <DrRows disabled={locked} addLabel="เพิ่มแถวเปล่า" rows={form.manpower} onChange={(v) => edit({ manpower: v })}
                    cols={[{ k: "role", th: "ตำแหน่ง" }, { k: "qty", th: "จำนวน", w: 80, type: "num" },
                      { k: "name", th: "ชื่อผู้ปฏิบัติงาน", w: 180 }, { k: "note", th: "หมายเหตุ", w: 120 }]} />
                </DrSection>
                <DrSection n="8" title="ความปลอดภัย & สิ่งแวดล้อม" tone="#10B981">
                  <DrLabel hint="JSA — ประเมินความเสี่ยงของงานวันนี้">ระดับความเสี่ยง</DrLabel>
                  <DrChips options={window.DR_JSA} value={form.jsa} disabled={locked} onChange={(v) => edit({ jsa: v })} />
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 14 }}>
                    <div>
                      <DrLabel>ใบอนุญาตทำงานเย็น</DrLabel>
                      <DrChips disabled={locked} value={form.permitCold} onChange={(v) => edit({ permitCold: v })}
                        options={[{ key: "yes", th: "มี", color: "#10B981" }, { key: "no", th: "ไม่มี", color: "#94A3B8" }]} />
                    </div>
                    <div>
                      <DrLabel>ใบอนุญาตทำงานร้อน</DrLabel>
                      <DrChips disabled={locked} value={form.permitHot} onChange={(v) => edit({ permitHot: v })}
                        options={[{ key: "yes", th: "มี", color: "#10B981" }, { key: "no", th: "ไม่มี", color: "#94A3B8" }]} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <DrLabel hint="ติ๊กข้อที่ทำแล้ว">ความสะอาด / จัดเก็บพื้นที่</DrLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {window.DR_CLEAN.map((c) => {
                        const on = !!(form.clean || {})[c.key];
                        return (
                          <button key={c.key} type="button" disabled={locked}
                            onClick={() => edit({ clean: Object.assign({}, form.clean, { [c.key]: !on }) })}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 99,
                              border: "1px solid " + (on ? "#10B981" : "var(--border-strong)"), background: on ? "#10B9811c" : "var(--surface)",
                              cursor: locked ? "default" : "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                              color: on ? "#10B981" : "var(--text-2)" }}>
                            {on && <Icon name="check" size={13} color="#10B981" />}{c.th}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <DrLabel hint="ใบรับรอง/ใบอนุญาตที่เกี่ยวข้อง">เอกสารรับรอง</DrLabel>
                    <DrRows disabled={locked} addLabel="เพิ่มเอกสาร" rows={form.certs} onChange={(v) => edit({ certs: v })}
                      cols={[{ k: "name", th: "รายละเอียดเอกสาร" }, { k: "by", th: "ผู้รับผิดชอบ", w: 150 }]} />
                  </div>
                </DrSection>
              </React.Fragment>
            )}
          </div>

          {/* แถบปุ่มล่าง */}
          <div style={{ position: "sticky", bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--border)",
            padding: isMobile ? "11px 13px" : "13px 20px", display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1, minWidth: 100 }}>
              {locked ? "เอกสารถูกล็อกแล้ว" : "บันทึกอัตโนมัติ ไม่ต้องกดเซฟ"}
            </span>
            <button onClick={() => { flush(); setPaper(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10,
                border: "1px solid var(--primary)", background: "var(--primary-soft)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
              <Icon name="file" size={15} color="var(--primary-dark)" /> ดูรายงาน · บันทึก PDF
            </button>
            {!locked && form.status !== "sent" && (
              <button onClick={send}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none",
                  background: "var(--primary)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                <Icon name="check" size={15} color="#fff" /> ส่งให้หัวหน้า
              </button>
            )}
            {canApprove && form.status === "sent" && (
              <button onClick={approve}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none",
                  background: "#10B981", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                <Icon name="check" size={15} color="#fff" /> อนุมัติ
              </button>
            )}
            {canApprove && form.status === "approved" && (
              <button onClick={reopen}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                <Icon name="undo" size={15} /> ปลดล็อกให้แก้
              </button>
            )}
          </div>
        </div>
      </div>

      {paper && <DailyPaper job={job} rec={form} date={date} allDates={store.dates} onClose={() => setPaper(false)} />}
    </React.Fragment>
  );
}

/* ══════════════════════════════════════════════════
   กระดาษรายงาน (พิมพ์ / บันทึก PDF)
   ══════════════════════════════════════════════════ */
function DrPRow({ k, v }) {
  return (
    <React.Fragment>
      <div style={{ padding: "6px 10px", borderRight: "1px solid #DCE4DF", borderBottom: "1px solid #DCE4DF",
        fontSize: 10.5, fontWeight: 700, color: "#2C6B48", background: "#F3F7F4" }}>{k}</div>
      <div style={{ padding: "6px 10px", borderBottom: "1px solid #DCE4DF", fontSize: 11, color: "#15211A" }}>{v || "-"}</div>
    </React.Fragment>
  );
}
function DrPBlock({ title, children, avoid }) {
  return (
    <div style={{ marginTop: 16, breakInside: avoid ? "avoid" : "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #DCE4DF", paddingBottom: 5, marginBottom: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: "#22A35B" }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: "#15211A" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
const drPara = (t) => (
  <div style={{ fontSize: 11.5, lineHeight: 1.65, color: "#15211A", whiteSpace: "pre-wrap" }}>{t || "—"}</div>
);

function DailyPaper({ job, rec, date, allDates, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { photos } = window.useDailyPhotos(job.id, date);
  const st = window.drStatusOf(rec.status);
  const docNo = window.drDocNo(job, date, allDates);
  const isProject = rec.mode === "project";
  const wAm = window.drWeatherOf(rec.weatherAm);
  const wPm = window.drWeatherOf(rec.weatherPm);
  const jsa = (window.DR_JSA || []).find((j) => j.key === rec.jsa);
  const pct = +rec.pct || 0;

  /* งานบ้าน — ในใบพิมพ์เอาเฉพาะเนื้องานที่ลงมือไปแล้วจริง
     หัวข้อที่ยังไม่แตะเป็นเส้นประทั้งแถว ใส่ไปก็ไม่ได้บอกอะไร
     (งานโครงการยังพิมพ์ครบทุกหัวข้อ เพราะตารางนั้นคือตัวรายงานเอง)
     ถ้ายังไม่ได้กรอกสักแถว พิมพ์ทั้งชุดไปก่อน จะได้ไม่หายไปทั้งหัวข้อ */
  const steps = React.useMemo(() => {
    const all = rec.steps || [];
    if (isProject) return all;
    const used = all.filter((r) => r.actStart || r.actEnd || r.planStart || r.planEnd || +r.pct > 0);
    return used.length ? used : all;
  }, [rec.steps, isProject]);

  const doPrint = () => {
    const old = document.title;
    document.title = "รายงานประจำวัน " + (job.code || "") + " " + date;
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const th = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "5px 7px", fontSize: 10.5, color: "#15211A", borderBottom: "1px solid #ECF1EE", verticalAlign: "top" };

  const rowsTable = (title, cols, rows) => (
    !rows || !rows.length ? null : (
      <DrPBlock title={title}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={Object.assign({}, th, { width: 26 })}>#</th>{cols.map((c) => <th key={c.k} style={th}>{c.th}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td style={Object.assign({}, td, { fontFamily: "var(--mono)", color: "#7A8A81" })}>{i + 1}</td>
                {cols.map((c) => <td key={c.k} style={td}>{r[c.k] || "-"}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </DrPBlock>
    )
  );

  return (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 160, background: "rgba(8,20,14,.55)", overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>
      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>รายงานประจำวัน · {window.drDateTH(date)}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{photos.length} รูป · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”</div>
        </div>
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        {/* หัวกระดาษ — พิมพ์ครั้งเดียว ไม่ซ้ำทุกหน้าเหมือนฟอร์ม Excel เดิม */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #22A35B", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>รายงานประจำวันหน้างาน</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>PROJECT INSTALLATION — DAILY REPORT</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2C6B48", marginTop: 5 }}>PHITHAN GREEN</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#15211A" }}>{docNo}</div>
            <div>{window.drDateTH(date, true)}</div>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 9px", borderRadius: 99,
              background: st.color + "22", color: st.color, fontWeight: 700, fontSize: 10.5 }}>{st.th}</div>
          </div>
        </div>

        {/* ข้อมูลงาน */}
        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <DrPRow k="ชื่องาน" v={job.name} />
          <DrPRow k="รหัสงาน" v={job.code} />
          <DrPRow k="ประเภท" v={isProject ? "งานโครงการ" : "งานบ้าน"} />
          <DrPRow k="ขนาดติดตั้ง" v={(job.kw ? job.kw + " kW" : "") + (job.panels ? " · " + job.panels + " แผง" : "")} />
          <DrPRow k="สถานที่" v={[job.address, job.province].filter(Boolean).join(" · ")} />
          <DrPRow k="ทีมช่าง" v={rec.team || ((job.tech && job.tech.name) || "-")} />
        </div>

        {/* ความคืบหน้า — ตัวเลขที่ฟอร์มเดิมไม่ได้เทียบให้ */}
        <div style={{ marginTop: 14, border: "1px solid #DCE4DF", borderRadius: 9, padding: "12px 14px", breakInside: "avoid" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4A5A51" }}>ความคืบหน้ารวม</span>
            <div style={{ flex: 1, minWidth: 160, height: 9, borderRadius: 99, background: "#E8EEEA", overflow: "hidden" }}>
              <div style={{ width: Math.max(0, Math.min(100, pct)) + "%", height: "100%", background: "#22A35B" }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: "#15211A" }}>{pct}%</span>
            {rec.prevPct != null && <span style={{ fontSize: 11, color: "#4A5A51" }}>จากเมื่อวาน {rec.prevPct}%</span>}
          </div>
          {(wAm || wPm) && (
            <div style={{ marginTop: 9, fontSize: 11, color: "#4A5A51" }}>
              สภาพอากาศ · เช้า <b style={{ color: "#15211A" }}>{wAm ? wAm.th : "-"}</b> · บ่าย <b style={{ color: "#15211A" }}>{wPm ? wPm.th : "-"}</b>
            </div>
          )}
        </div>

        {/* ตารางขั้นงาน */}
        {!!steps.length && (
          <DrPBlock title={isProject ? "ความคืบหน้าตามขั้นงาน" : "เนื้องานติดตั้งที่เดินไปแล้ว"}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, th, { width: 38 })}>ขั้น</th>
                  <th style={th}>รายละเอียดงาน</th>
                  {isProject && <th style={th}>แผน เริ่ม</th>}
                  {isProject && <th style={th}>แผน จบ</th>}
                  {isProject && <th style={th}>จริง เริ่ม</th>}
                  {isProject && <th style={th}>จริง จบ</th>}
                  {!isProject && <th style={Object.assign({}, th, { textAlign: "right", width: 78 })}>น้ำหนักงาน</th>}
                  <th style={Object.assign({}, th, { textAlign: "right", width: 66 })}>ทำไปแล้ว</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((r, i) => (
                  <tr key={i} style={{ background: r.head ? "#F3F7F4" : "transparent" }}>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: r.head ? 800 : 400, color: r.head ? "#2C6B48" : "#7A8A81" })}>{r.no}</td>
                    <td style={Object.assign({}, td, { fontWeight: r.head ? 700 : 400 })}>{r.th}</td>
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.planStart ? window.drShort(r.planStart) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.planEnd ? window.drShort(r.planEnd) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.actStart ? window.drShort(r.actStart) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.actEnd ? window.drShort(r.actEnd) : "—"}</td>}
                    {!isProject && <td style={Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)", color: "#7A8A81" })}>{r.w ? r.w + "%" : "—"}</td>}
                    <td style={Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700 })}>{r.pct ? r.pct + "%" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DrPBlock>
        )}

        <DrPBlock title="งานที่ทำวันนี้" avoid>{drPara(rec.work)}</DrPBlock>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <DrPBlock title="ปัญหา / อุปสรรค" avoid>{drPara(rec.problem)}</DrPBlock>
          <DrPBlock title="สิ่งที่ต้องทำต่อ" avoid>{drPara(rec.nextDay)}</DrPBlock>
        </div>

        {isProject && (
          <React.Fragment>
            {rowsTable("วัสดุเข้าหน้างาน", [{ k: "name", th: "รายการวัสดุ" }, { k: "qty", th: "จำนวน" }, { k: "unit", th: "หน่วย" }, { k: "loc", th: "จุดจัดเก็บ" }, { k: "note", th: "หมายเหตุ" }], rec.materials)}
            {rowsTable("เครื่องจักร / เครื่องมือ", [{ k: "name", th: "รายการ" }, { k: "qty", th: "จำนวน" }, { k: "unit", th: "หน่วย" }, { k: "job", th: "ใช้กับงาน" }, { k: "note", th: "หมายเหตุ" }], rec.machines)}
            {rowsTable("กำลังคน", [{ k: "role", th: "ตำแหน่ง" }, { k: "qty", th: "จำนวน" }, { k: "name", th: "ชื่อผู้ปฏิบัติงาน" }, { k: "note", th: "หมายเหตุ" }], rec.manpower)}
            {(jsa || rec.permitCold || rec.permitHot || Object.keys(rec.clean || {}).length || (rec.certs || []).length) && (
              <DrPBlock title="ความปลอดภัย & สิ่งแวดล้อม" avoid>
                <div style={{ fontSize: 11, color: "#15211A", lineHeight: 1.9 }}>
                  <div>ระดับความเสี่ยง (JSA): <b>{jsa ? jsa.th + " (" + jsa.range + ")" : "—"}</b></div>
                  <div>ใบอนุญาตทำงานเย็น: <b>{rec.permitCold === "yes" ? "มี" : rec.permitCold === "no" ? "ไม่มี" : "—"}</b>
                    {"  ·  "}ใบอนุญาตทำงานร้อน: <b>{rec.permitHot === "yes" ? "มี" : rec.permitHot === "no" ? "ไม่มี" : "—"}</b></div>
                  <div>จัดเก็บพื้นที่: <b>{(window.DR_CLEAN || []).filter((c) => (rec.clean || {})[c.key]).map((c) => c.th).join(" · ") || "—"}</b></div>
                </div>
                {!!(rec.certs || []).length && (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                    <thead><tr><th style={th}>เอกสารรับรอง</th><th style={th}>ผู้รับผิดชอบ</th></tr></thead>
                    <tbody>{rec.certs.map((c, i) => <tr key={i}><td style={td}>{c.name || "-"}</td><td style={td}>{c.by || "-"}</td></tr>)}</tbody>
                  </table>
                )}
              </DrPBlock>
            )}
          </React.Fragment>
        )}

        {/* รูปหน้างาน — สองคอลัมน์ ไม่บีบรูปให้เบี้ยว */}
        {!!photos.length && (
          <DrPBlock title={"รูปหน้างาน (" + photos.length + " รูป)"}>
            {/* alignItems:start — ไม่งั้นรูปนอนถูกยืดสูงเท่ารูปตั้งในแถวเดียวกัน เหลือช่องว่างใต้รูป */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
              {photos.map((p, i) => (
                <div key={p.id} className="dr-shot" style={{ breakInside: "avoid", border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
                  <img src={p.dataUrl} alt={p.cap || ""} style={{ width: "100%", display: "block", background: "#F3F7F4" }} />
                  <div style={{ padding: "5px 8px", fontSize: 10.5, color: "#4A5A51", borderTop: "1px solid #ECF1EE" }}>
                    <b style={{ color: "#2C6B48" }}>รูปที่ {i + 1}</b>{p.cap ? " · " + p.cap : ""}
                  </div>
                </div>
              ))}
            </div>
          </DrPBlock>
        )}

        {/* ช่องเซ็น — ชุดเดียวท้ายเล่ม (ฟอร์มเดิมมี 5 ชุดซ้ำทุกหน้า) */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, breakInside: "avoid" }}>
          {[{ t: "ผู้บันทึก (ช่างหน้างาน)", n: rec.byName, d: rec.sentAt || rec.updatedAt || rec.createdAt },
            { t: "ผู้อนุมัติ (หัวหน้างาน)", n: rec.appName, d: rec.approvedAt }].map((s, i) => (
            <div key={i} style={{ border: "1px solid #DCE4DF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{s.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6 }} />
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>ชื่อ: <b>{s.n || "-"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>วันที่: {s.d ? window.drDateTH(String(s.d).slice(0, 10)) : "-"}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          เอกสารนี้ออกจากระบบติดตามงานติดตั้ง PHITHAN GREEN · {docNo} · พิมพ์เมื่อ {window.drDateTH(window.drToday())}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   หน้ารวมของหัวหน้า — วันนี้ใครส่งแล้ว ใครยังไม่ส่ง
   ══════════════════════════════════════════════════ */
function DailyView({ jobs, role, currentUser, onOpen }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { all, loading } = window.useDailyAll();
  const [date, setDate] = React.useState(window.drToday);

  /* เขียนรายงานเฉพาะงานที่กำลังติดตั้งอยู่ — ขั้นออกแบบ/ถอดของ/รอคิว ยังไม่มีใครขึ้นหน้างาน
     แต่ถ้าวันนั้นเคยเขียนไว้ ต้องยังเห็นอยู่ ไม่งั้นรายงานเก่าหายไปเฉย ๆ */
  const rows = React.useMemo(() => {
    const out = (jobs || []).map((j) => ({ job: j, rec: ((all || {})[j.id] || {})[date] || null }))
      .filter((r) => r.job.stage === "install" || r.rec);
    const rank = { sent: 0, draft: 1, approved: 2 };
    out.sort((a, b) => {
      const ka = a.rec ? rank[a.rec.status] != null ? rank[a.rec.status] : 1 : 3;
      const kb = b.rec ? rank[b.rec.status] != null ? rank[b.rec.status] : 1 : 3;
      if (ka !== kb) return ka - kb;
      return String(a.job.code || "").localeCompare(String(b.job.code || ""));
    });
    return out;
  }, [jobs, all, date]);

  const n = React.useMemo(() => {
    const o = { sent: 0, approved: 0, draft: 0, none: 0 };
    rows.forEach((r) => { o[r.rec ? (r.rec.status || "draft") : "none"] += 1; });
    return o;
  }, [rows]);

  const stat = (label, value, color) => (
    <div style={{ flex: 1, minWidth: 92, padding: "11px 13px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: color, lineHeight: 1.2 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <button onClick={() => setDate(window.drAddDays(date, -1))}
          style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
            cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
          <Icon name="chevronRight" size={15} style={{ transform: "rotate(180deg)" }} />
        </button>
        <input type="date" value={date} max={window.drToday()} onChange={(e) => setDate(e.target.value || window.drToday())}
          style={Object.assign({}, DR_INPUT, { width: "auto", padding: "7px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
        <button onClick={() => setDate(window.drAddDays(date, 1))} disabled={date >= window.drToday()}
          style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
            cursor: date >= window.drToday() ? "default" : "pointer", opacity: date >= window.drToday() ? 0.4 : 1,
            display: "grid", placeItems: "center", color: "var(--text-2)" }}>
          <Icon name="chevronRight" size={15} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>{window.drDateTH(date, true)}</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stat("รออนุมัติ", n.sent, "#F59E0B")}
        {stat("อนุมัติแล้ว", n.approved, "#10B981")}
        {stat("ยังเป็นร่าง", n.draft, "#94A3B8")}
        {stat("ยังไม่เขียน", n.none, "#EF4444")}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
        {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}
        {!loading && !rows.length && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>ไม่มีงานที่ต้องเขียนรายงานวันนี้</div>}
        {rows.map((r) => {
          const s = r.rec ? window.drStatusOf(r.rec.status) : { th: "ยังไม่เขียน", color: "#EF4444" };
          return (
            <button key={r.job.id} onClick={() => onOpen(r.job)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: isMobile ? "11px 12px" : "13px 16px",
                background: "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.job.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>
                  {r.job.code} · {r.job.type === "project" ? "งานโครงการ" : "งานบ้าน"}
                  {r.rec && r.rec.work ? " · " + String(r.rec.work).slice(0, 46) : ""}
                </span>
              </span>
              {r.rec && r.rec.pct != null && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{+r.rec.pct || 0}%</span>
              )}
              <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.color + "1a",
                borderRadius: 99, padding: "3px 10px", flexShrink: 0, whiteSpace: "nowrap" }}>{s.th}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ปุ่มในใบงาน — บอกตั้งแต่ยังไม่กดว่าวันนี้เขียนรายงานแล้วหรือยัง
   แยกเป็นคอมโพเนนต์เพราะต้องใช้ hook อ่านรายงานของงานนั้น (เรียก hook ในเงื่อนไขไม่ได้) */
function DailyJobButton({ job, onOpen }) {
  const store = window.useDailyReports(job ? job.id : null);
  const today = window.drToday();
  const s = window.drDayState(store.byDate, today);
  const n = store.dates.length;
  return (
    <button onClick={onOpen}
      style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: "3px solid " + s.color,
        borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: s.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="pen" size={17} color={s.color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>รายงานประจำวันหน้างาน</span>
        <span style={{ display: "block", fontSize: 11.5, color: s.color, fontWeight: 700 }}>
          วันนี้ · {s.th}{n ? <span style={{ color: "var(--text-3)", fontWeight: 400 }}> · เขียนไว้แล้ว {n} วัน</span> : null}
        </span>
      </span>
      <Icon name="arrowRight" size={16} color="var(--text-3)" />
    </button>
  );
}

Object.assign(window, { DailyReportModal, DailyPaper, DailyView, DailyJobButton });
