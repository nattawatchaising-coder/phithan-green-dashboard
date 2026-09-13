/* ============================================================
   flash+solar — รายงานประจำวัน: ฟอร์มกรอก · กระดาษ PDF · หน้ารวมของหัวหน้า

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
function DrStepTable({ steps, onChange, disabled, editable, onReset, plan, dates, weight, rename }) {
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
                {/* งานบ้านใช้ชุดเนื้องานมาตรฐานชุดเดียวกันทุกหลัง ไม่ต้องมีช่องพิมพ์ชื่อหัวข้อ
                    หน้างานจะได้กรอกแค่น้ำหนักกับ % ไม่ต้องเลี่ยงกดโดนช่องชื่อ */}
                <td style={Object.assign({}, cell, { minWidth: 190 })}>
                  {rename && editable && !disabled ? (
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
          {rename && <button type="button" onClick={() => onChange(list.concat([{ no: String(list.length + 1), th: "", head: true, pct: 0, w: 0 }]))}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
              border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="plus" size={14} /> เพิ่มหัวข้อใหญ่
          </button>}
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

/* ช่องคำบรรยายใต้รูป — เก็บค่าที่พิมพ์ไว้ในเครื่องก่อน แล้วค่อยเขียนฐานข้อมูลตอนหยุดพิมพ์
   ถ้าเขียนทุกตัวอักษร ช่างที่เน็ตช้าหน้างานจะพิมพ์แล้วตัวหนังสือกระตุก */
function DrPhotoCap({ value, disabled, onSave }) {
  const [v, setV] = React.useState(value || "");
  const timer = React.useRef(null);
  const typing = React.useRef(false);
  React.useEffect(() => { if (!typing.current) setV(value || ""); }, [value]);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const edit = (nv) => {
    setV(nv); typing.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { typing.current = false; onSave(nv); }, 500);
  };
  const flush = () => { clearTimeout(timer.current); typing.current = false; onSave(v); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--border)",
      padding: "6px 8px", background: "var(--surface2)" }}>
      <Icon name="pen" size={12} color={v ? "var(--primary-dark)" : "var(--text-3)"} />
      <input value={v} disabled={disabled} placeholder="พิมพ์คำบรรยายรูปนี้…"
        onChange={(e) => edit(e.target.value)} onBlur={flush}
        style={{ width: "100%", border: "none", padding: "3px 0", background: "transparent", color: "var(--text-1)",
          fontFamily: "inherit", fontSize: 12, boxSizing: "border-box", outline: "none" }} />
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
            <DrPhotoCap value={p.cap} disabled={disabled} onSave={(v) => setCap(p.id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ลายเซ็นอิเล็กทรอนิกส์ — เซ็นด้วยนิ้วบนมือถือ / เมาส์บนคอม
   ══════════════════════════════════════════════════ */

/* ตัดขอบขาวรอบลายเซ็นออกก่อนเก็บ — คนเซ็นมุมไหนของกรอบก็ได้
   ถ้าเก็บทั้งกรอบ เวลาเอาไปวางในใบพิมพ์ลายเซ็นจะลอยไปอยู่มุมกระดาษ
   ย่อกว้างสุด 560px พอสำหรับพิมพ์ และไม่ทำให้ฐานข้อมูลบวม */
/* drTrimSign กับ DrSignPad ย้ายไปอยู่ daily.jsx แล้ว
   เหตุผล: หน้า LIFF โหลด daily.js แต่ไม่ได้โหลด views-daily.js (ไฟล์เดสก์ท็อปทั้งก้อน)
   แผ่นเซ็นจึงต้องอยู่ในโมดูลที่ทั้งสองหน้าจอโหลดร่วมกัน — ไม่ใช่ก๊อปไปไว้อีกชุด
   ยังเรียกผ่าน window.DrSignPad เหมือนเดิมทุกที่ */

/* ช่องลายเซ็นในฟอร์ม — เซ็นแล้วเห็นภาพจริง ยังไม่เซ็นเห็นปุ่ม */
function DrSignSlot({ title, sub, sig, canSign, onSign, onClear, saved, onUseSaved }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: "12px 13px" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)" }}>{title}</div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>
      <div style={{ height: 76, marginTop: 9, borderRadius: 9, background: "var(--surface2)", border: "1px solid var(--border)",
        display: "grid", placeItems: "center", overflow: "hidden" }}>
        {sig && sig.img
          ? <img src={sig.img} alt="ลายเซ็น" style={{ maxWidth: "94%", maxHeight: 66, objectFit: "contain" }} />
          : <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่ได้เซ็น</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
        {sig && sig.img && (
          <span style={{ fontSize: 11, color: "var(--text-3)", flex: 1, minWidth: 90 }}>
            {sig.name || "-"} · {window.drDateTH(window.drSignDay(sig))}
          </span>
        )}
        {/* บันทึกลายเซ็นไว้ในตั้งค่าแล้ว กดปุ่มเดียวจบ */}
        {canSign && !(sig && sig.img) && saved && saved.img && (
          <button onClick={onUseSaved}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9, border: "none",
              background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="check" size={13} color="#fff" sw={2.6} /> ใช้ลายเซ็นที่บันทึกไว้
          </button>
        )}
        {canSign && (
          <button onClick={onSign}
            style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--primary)", background: "var(--primary-soft)",
              color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {sig && sig.img ? "เซ็นใหม่" : "เซ็นสด"}
          </button>
        )}
        {canSign && sig && sig.img && (
          <button onClick={onClear}
            style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-3)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ลบ
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ฟอร์มกรอกรายงานประจำวัน
   ══════════════════════════════════════════════════ */
function DailyReportModal({ job, role, currentUser, onClose, onNotify, openDate }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = window.useDailyReports(job ? job.id : null);
  /* เปิดจากตารางภาพรวมจะระบุวันมาด้วย — ไม่งั้นกดช่องเมื่อวานแล้วเด้งไปวันนี้ */
  const [date, setDate] = React.useState(() => openDate || window.drToday());
  const [form, setForm] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
  const sigs = window.useDailySigns(job ? job.id : null, date);
  const mine = window.useDrMySign((currentUser || {}).id);
  /* pad = { slot, title, then } — เปิดแผ่นเซ็น แล้วทำงานต่อ (ส่ง/อนุมัติ) ให้อัตโนมัติหลังเซ็นเสร็จ */
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  /* ถามยืนยันก่อนลบในแถบปุ่มเลย — ใบทั้งวันหายถาวร กดพลาดแล้วเรียกคืนไม่ได้ */
  const [delAsk, setDelAsk] = React.useState(false);
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

  React.useEffect(() => setDelAsk(false), [date]);

  const locked = !window.drCanEdit(role, form);
  const canApprove = window.drCanApprove(role, job, currentUser, form);
  const noEe = window.drNoEe(job);
  /* บอกเหตุผลเมื่อกดอนุมัติไม่ได้ — ปุ่มที่หายไปเฉย ๆ ทำให้คนเดาว่าระบบเสีย */
  const whyNoApprove = React.useMemo(() => {
    if (canApprove || !form || form.status !== "sent") return "";
    if (noEe) return "งานนี้ยังไม่ระบุวิศวกรผู้รับผิดชอบ — ไปใส่ชื่อในใบงานก่อน จึงจะมีคนอนุมัติได้";
    const uid = (currentUser || {}).id || "";
    if (uid && job.eeId === uid && form.byId === uid)
      return "ใบนี้คุณเป็นคนส่งเอง — ถ้าคุณลงหน้างานงานนี้เองด้วย ให้เปิด “ลงหน้างานเองด้วย” ในใบงาน จึงจะเซ็นอนุมัติใบตัวเองได้";
    return "รอ" + (job.eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "ตรวจและเซ็นอนุมัติ";
  }, [canApprove, form && form.status, form && form.byId, noEe, job && job.eeId, job && job.eeName, currentUser && currentUser.id]);
  const canDelete = window.drCanDelete(role);
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

  const doSend = () => {
    flush();
    store.save(date, Object.assign({}, form, { status: "sent", sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || null, byName: (currentUser || {}).name || "" }));
    /* ส่งแล้วต้องมีคนรู้ — เดิมใบไปกองรอจนกว่าคนอนุมัติจะบังเอิญเปิดมาเจอ
       ยิงตรงไปหาวิศวกรของงานนี้ ไม่ใช่กระจายให้ทุกคนที่มีสิทธิ์ เพราะคนรับผิดชอบมีคนเดียว
       วิศวกรที่ส่งใบของตัวเอง (ลงหน้างานเองด้วย) ไม่ต้องแจ้งเตือนตัวเอง */
    const eeId = (job || {}).eeId || "";
    if (onNotify && eeId && eeId !== ((currentUser || {}).id || "")) {
      onNotify({
        toUserId: eeId, type: "daily", event: "sent", jobId: job.id, jobName: job.name,
        title: "รายงานประจำวันรออนุมัติ",
        body: [job.code, window.drDateTH(date), "โดย " + ((currentUser || {}).name || "ช่าง")].filter(Boolean).join(" · "),
      });
    }
  };
  const doApprove = () => {
    store.save(date, Object.assign({}, form, { status: "approved", approvedAt: new Date().toISOString(),
      appId: (currentUser || {}).id || null, appName: (currentUser || {}).name || "" }));
  };
  /* ยังไม่ได้เซ็นให้จัดการให้ก่อน แล้วค่อยส่ง/อนุมัติต่อ — ใบที่ไม่มีลายเซ็นเอาไปใช้เป็นเอกสารไม่ได้
     ใครบันทึกลายเซ็นไว้ในตั้งค่าแล้ว ระบบเซ็นให้เลย ไม่ต้องมานั่งเซ็นซ้ำทุกวัน */
  const needSign = (slot, title, hint, then) => {
    if (sigs.signs[slot] && sigs.signs[slot].img) return then();
    if (mine.sign && mine.sign.img) { sigs.sign(slot, mine.sign.img, currentUser); return then(); }
    setPad({ slot: slot, title: title, hint: hint, then: then });
  };
  const send = () => needSign("by", "ลายเซ็นผู้บันทึก",
    "เซ็นแล้วระบบจะส่งใบนี้ให้" + ((job || {}).eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "อนุมัติทันที", doSend);
  const approve = () => needSign("app", "ลายเซ็นผู้อนุมัติ", "เซ็นแล้วระบบจะอนุมัติและล็อกใบนี้ทันที", doApprove);
  /* ปลดล็อกให้แก้ = ถอนการอนุมัติ ลายเซ็นหัวหน้าต้องหลุดไปด้วย ไม่งั้นใบที่แก้แล้วยังมีลายเซ็นเดิมค้างอยู่ */
  /* ลบใบทิ้ง = ทั้งใบ รูป และลายเซ็นของวันนั้น
     ต้องดับตัวเซฟอัตโนมัติที่ค้างอยู่ก่อน ไม่งั้นมันเขียนใบที่เพิ่งลบกลับมาใหม่ */
  const doDelete = () => {
    clearTimeout(timer.current);
    store.remove(date);
    setDelAsk(false);
  };
  const reopen = () => {
    sigs.clear("app");
    store.patch(date, { status: "draft", approvedAt: null, appId: null, appName: null });
  };

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
                <DrLabel hint={isProject ? "เพิ่ม/แก้/ลบหัวข้อได้ตามแผนงานของโครงการนี้" : "น้ำหนักงาน = หัวข้อนี้คิดเป็นกี่ % ของงานทั้งหลัง · หัวข้อไหนไม่มีในบ้านหลังนี้กดถังขยะทิ้งได้"}>{isProject ? "ตารางขั้นงาน" : "เนื้องานติดตั้ง"}</DrLabel>
                {/* งานบ้านไม่มีวันแผน/วันจริงรายหัวข้อ — มีแค่ช่วงวันติดตั้งช่วงเดียวของทั้งงาน
                    เหลือ เนื้องาน · น้ำหนักงาน · ทำไปแล้ว กี่ % กรอกบนมือถือหน้างานได้จริง */}
                <DrStepTable steps={form.steps} disabled={locked} editable
                  plan={isProject} dates={isProject} weight={!isProject} rename={isProject}
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

            <DrSection n="3" title="รูปหน้างาน" tone="#F59E0B" hint="ใส่ได้ไม่จำกัด · พิมพ์คำบรรยายใต้รูปได้ทุกใบ">
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
            {/* ลายเซ็น — เซ็นในระบบได้เลย ไม่ต้องปรินต์ออกมาเซ็นแล้วสแกนกลับ */}
            <DrSection n={isProject ? "9" : "5"} title="ลายเซ็น" tone="#7C5CFC" hint="เซ็นด้วยนิ้วบนมือถือ หรือเมาส์บนคอม">
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <DrSignSlot title="ผู้บันทึก (ช่างหน้างาน)" sub={form.byName || (currentUser || {}).name || "-"}
                  sig={sigs.signs.by} canSign={!locked} saved={mine.sign}
                  onUseSaved={() => sigs.sign("by", mine.sign.img, currentUser)}
                  onSign={() => setPad({ slot: "by", title: "ลายเซ็นผู้บันทึก" })}
                  onClear={() => sigs.clear("by")} />
                <DrSignSlot title="ผู้อนุมัติ (หัวหน้างาน)" sub={form.appName || (canApprove ? (currentUser || {}).name || "-" : "รอหัวหน้าเซ็น")}
                  sig={sigs.signs.app} canSign={canApprove && form.status !== "approved"} saved={mine.sign}
                  onUseSaved={() => sigs.sign("app", mine.sign.img, currentUser)}
                  onSign={() => setPad({ slot: "app", title: "ลายเซ็นผู้อนุมัติ" })}
                  onClear={() => sigs.clear("app")} />
              </div>
            </DrSection>
          </div>

          {/* แถบปุ่มล่าง */}
          <div style={{ position: "sticky", bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--border)",
            padding: isMobile ? "11px 13px" : "13px 20px", display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, color: delAsk ? "#EF4444" : "var(--text-3)", fontWeight: delAsk ? 700 : 400, flex: 1, minWidth: 100 }}>
              {delAsk ? "ลบใบของวันนี้ทั้งใบ (รูปและลายเซ็นด้วย) เรียกคืนไม่ได้" : locked ? "เอกสารถูกล็อกแล้ว" : "บันทึกอัตโนมัติ ไม่ต้องกดเซฟ"}
            </span>
            {canDelete && saved && (delAsk ? (
              <React.Fragment>
                <button onClick={() => setDelAsk(false)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10,
                    border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>ยกเลิก</button>
                <button onClick={doDelete}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none",
                    background: "#EF4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                  <Icon name="trash" size={15} color="#fff" /> ลบเลย
                </button>
              </React.Fragment>
            ) : (
              <button onClick={() => setDelAsk(true)} title="ลบใบรายงานของวันนี้ (เฉพาะแอดมิน)"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 13px", borderRadius: 10,
                  border: "1px solid #EF444455", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#EF4444" }}>
                <Icon name="trash" size={15} color="#EF4444" /> ลบใบนี้
              </button>
            ))}
            <button onClick={() => { flush(); setPaper(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10,
                border: "1px solid var(--primary)", background: "var(--primary-soft)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
              <Icon name="file" size={15} color="var(--primary-dark)" /> ดูรายงาน · บันทึก PDF
            </button>
            {!locked && form.status !== "sent" && (
              <button onClick={send} title={noEe ? "งานนี้ยังไม่ระบุวิศวกรผู้รับผิดชอบ" : ("ส่งให้ " + (job.eeName || "วิศวกร"))}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none",
                  background: "var(--primary)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>
                <Icon name="check" size={15} color="#fff" /> ส่งให้วิศวกร
              </button>
            )}
            {!canApprove && whyNoApprove && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, maxWidth: 380, fontSize: 11.5,
                color: "var(--text-3)", lineHeight: 1.4 }}>
                <Icon name="alert" size={14} color={noEe ? "#F59E0B" : "var(--text-3)"} style={{ flexShrink: 0 }} />
                {whyNoApprove}
              </span>
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

      {pad && (
        <window.DrSignPad title={pad.title} hint={pad.hint} onClose={() => setPad(null)}
          saved={mine.sign} remember={remember} onRemember={setRemember}
          onSave={(img, drawn) => {
            sigs.sign(pad.slot, img, currentUser);
            /* ติ๊ก "จำลายเซ็นนี้ไว้" = เก็บเข้าตั้งค่าส่วนตัวด้วย ครั้งหน้ากดส่งได้เลย */
            if (drawn && remember) mine.save(img);
            const then = pad.then;
            setPad(null);
            if (then) then();
          }} />
      )}
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
        fontSize: 10.5, fontWeight: 700, color: "#0A4D68", background: "#F3F7F4" }}>{k}</div>
      <div style={{ padding: "6px 10px", borderBottom: "1px solid #DCE4DF", fontSize: 11, color: "#15211A" }}>{v || "-"}</div>
    </React.Fragment>
  );
}
function DrPBlock({ title, children, avoid }) {
  return (
    <div style={{ marginTop: 16, breakInside: avoid ? "avoid" : "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #DCE4DF", paddingBottom: 5, marginBottom: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: "#1B9B75" }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: "#15211A" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
const drPara = (t) => (
  <div style={{ fontSize: 11.5, lineHeight: 1.65, color: "#15211A", whiteSpace: "pre-wrap" }}>{t || "—"}</div>
);

/* ── พจนานุกรมใบรายงานประจำวัน (ไทย → [อังกฤษ, จีน]) ──
   ใบนี้เป็นคอมโพเนนต์ React จึงแปลทีละข้อความด้วย window.pgT (ดู i18n.jsx)
   เนื้อหาที่ช่างพิมพ์เอง — งานที่ทำ ปัญหา สิ่งที่ต้องทำต่อ ชื่อวัสดุ ชื่อคน —
   ไม่อยู่ในตารางนี้ ออกตามที่พิมพ์ไว้เสมอ ไม่ว่าเลือกภาษาอะไร
   ชื่อขั้นงาน (r.th) ก็เช่นกัน เพราะมาจากแม่แบบที่ทีมแก้เองได้ */
const DR_PAPER_I18N = {
  "รายงานประจำวันหน้างาน": ["Site Daily Report", "现场日报"],
  "ชื่องาน": ["Job", "项目名称"],
  "รหัสงาน": ["Job code", "项目编号"],
  "ประเภท": ["Type", "类型"],
  "งานโครงการ": ["Commercial project", "工程项目"],
  "งานบ้าน": ["Residential", "住宅项目"],
  "ขนาดติดตั้ง": ["System size", "装机容量"],
  "สถานที่": ["Location", "地址"],
  "ทีมช่าง": ["Crew", "施工班组"],
  "ความคืบหน้ารวม": ["Overall progress", "总体进度"],
  "จากเมื่อวาน": ["from yesterday", "昨日为"],
  "สภาพอากาศ · เช้า": ["Weather · morning", "天气 · 上午"],
  "บ่าย": ["afternoon", "下午"],
  "ความคืบหน้าตามขั้นงาน": ["Progress by work stage", "各工序进度"],
  "เนื้องานติดตั้งที่เดินไปแล้ว": ["Installation work carried out", "已完成的安装工作"],
  "ขั้น": ["No.", "序号"],
  "รายละเอียดงาน": ["Work item", "工作内容"],
  "แผน เริ่ม": ["Plan start", "计划开始"],
  "แผน จบ": ["Plan finish", "计划完成"],
  "จริง เริ่ม": ["Actual start", "实际开始"],
  "จริง จบ": ["Actual finish", "实际完成"],
  "น้ำหนักงาน": ["Weight", "权重"],
  "ทำไปแล้ว": ["Done", "完成率"],
  "งานที่ทำวันนี้": ["Work done today", "今日工作"],
  "ปัญหา / อุปสรรค": ["Issues and obstacles", "问题与障碍"],
  "สิ่งที่ต้องทำต่อ": ["Next steps", "后续工作"],
  "วัสดุเข้าหน้างาน": ["Materials received on site", "进场材料"],
  "รายการวัสดุ": ["Material", "材料名称"],
  "เครื่องจักร / เครื่องมือ": ["Plant and tools", "机械与工具"],
  "รายการ": ["Item", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "จุดจัดเก็บ": ["Stored at", "存放位置"],
  "ใช้กับงาน": ["Used for", "用途"],
  "หมายเหตุ": ["Note", "备注"],
  "กำลังคน": ["Manpower", "人力"],
  "ตำแหน่ง": ["Role", "岗位"],
  "ชื่อผู้ปฏิบัติงาน": ["Name", "人员姓名"],
  "ความปลอดภัย & สิ่งแวดล้อม": ["Safety and environment", "安全与环境"],
  "ระดับความเสี่ยง (JSA):": ["Risk level (JSA):", "风险等级（JSA）："],
  "ใบอนุญาตทำงานเย็น:": ["Cold work permit:", "冷作业许可："],
  "ใบอนุญาตทำงานร้อน:": ["Hot work permit:", "动火作业许可："],
  "จัดเก็บพื้นที่:": ["Housekeeping:", "场地清理："],
  "เอกสารรับรอง": ["Certificate", "证明文件"],
  "ผู้รับผิดชอบ": ["Responsible", "负责人"],
  "มี": ["Yes", "有"],
  "ไม่มี": ["No", "无"],
  "รูปหน้างาน": ["Site photos", "现场照片"],
  "รูปที่": ["Photo", "照片"],
  "รูป": ["photos", "张"],
  "แผง": ["modules", "块组件"],
  "ผู้บันทึก (ช่างหน้างาน)": ["Recorded by (site technician)", "记录人（现场技师）"],
  "ผู้อนุมัติ (หัวหน้างาน)": ["Approved by (supervisor)", "批准人（工地主管）"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ": ["Signed electronically in the system", "已在系统内电子签名"],
  "เอกสารนี้ออกจากระบบติดตามงานติดตั้ง": ["Issued by the installation tracking system of", "本文件由安装管理系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  /* ค่าที่มาจาก daily.jsx — สถานะใบ สภาพอากาศ ระดับความเสี่ยง และหัวข้อจัดเก็บพื้นที่ */
  "ร่าง": ["Draft", "草稿"],
  "รออนุมัติ": ["Pending approval", "待批准"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "แดดจัด": ["Sunny", "晴"],
  "เมฆมาก": ["Cloudy", "多云"],
  "ฝนตก": ["Rain", "雨"],
  "ฝนฟ้าคะนอง": ["Thunderstorm", "雷雨"],
  "ต่ำ": ["Low", "低"],
  "ปานกลาง": ["Medium", "中"],
  "สูง": ["High", "高"],
  "สูงมาก": ["Extreme", "极高"],
  "เก็บพื้นที่ทำงาน": ["Work area cleared", "清理作业区"],
  "เก็บขยะ": ["Waste removed", "清运垃圾"],
  "ทำความสะอาดเครื่องมือ": ["Tools cleaned", "工具清洁"],
  "จัดเก็บวัสดุ": ["Materials stored", "材料归位"],
  "เก็บงานทั้งหมด": ["Full site clean-up", "全面清场"],
};

function DailyPaper({ job, rec, date, allDates, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  /* ภาษาของใบ — สลับสดจากแถบด้านบน ซึ่งไม่ติดไปในหน้าพิมพ์อยู่แล้ว
     วันที่ไทยเป็น พ.ศ. อังกฤษ/จีนเป็น ค.ศ. จึงแยกฟังก์ชันไว้ ห้ามแปลผ่าน T() */
  const [lang, setLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));
  const pickLang = (id) => { setLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = React.useMemo(() => (window.pgT ? window.pgT(DR_PAPER_I18N, lang) : (k) => k), [lang]);
  const DT = (iso) => (!iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang));
  const DTs = (iso) => (!iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang));
  const { photos } = window.useDailyPhotos(job.id, date);
  const { signs } = window.useDailySigns(job.id, date);
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
    document.title = T("รายงานประจำวันหน้างาน") + " " + (job.code || "") + " " + date;
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const th = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "5px 7px", fontSize: 10.5, color: "#15211A", borderBottom: "1px solid #ECF1EE", verticalAlign: "top" };

  const rowsTable = (title, cols, rows) => (
    !rows || !rows.length ? null : (
      <DrPBlock title={T(title)}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={Object.assign({}, th, { width: 26 })}>#</th>{cols.map((c) => <th key={c.k} style={th}>{T(c.th)}</th>)}</tr></thead>
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
        {typeof window.LangPick === "function" && (
          <window.LangPick value={lang} onChange={pickLang} />
        )}
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* ฟอนต์ไทยของแอปไม่มีตัวอักษรจีน — เลือกจีนแล้วต้องระบุชุดฟอนต์ที่มีจีนให้ชัด */}
      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        {/* หัวกระดาษ — พิมพ์ครั้งเดียว ไม่ซ้ำทุกหน้าเหมือนฟอร์ม Excel เดิม */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #1B9B75", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>{T("รายงานประจำวันหน้างาน")}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>PROJECT INSTALLATION — DAILY REPORT</div>
            {/* ตราสัญลักษณ์บริษัท — หกเหลี่ยม + ชื่อในโลโก้ ให้ใบที่พิมพ์ออกมาเป็นเอกสารของบริษัทจริง */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandMark size={22} variant="light" />
              <window.BrandWord size={16} color="#0F2B33" />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#15211A" }}>{docNo}</div>
            <div>{DT(date)}</div>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 9px", borderRadius: 99,
              background: st.color + "22", color: st.color, fontWeight: 700, fontSize: 10.5 }}>{T(st.th)}</div>
          </div>
        </div>

        {/* ข้อมูลงาน */}
        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <DrPRow k={T("ชื่องาน")} v={job.name} />
          <DrPRow k={T("รหัสงาน")} v={job.code} />
          <DrPRow k={T("ประเภท")} v={T(isProject ? "งานโครงการ" : "งานบ้าน")} />
          <DrPRow k={T("ขนาดติดตั้ง")} v={(job.kw ? job.kw + " kW" : "") + (job.panels ? " · " + job.panels + " " + T("แผง") : "")} />
          <DrPRow k={T("สถานที่")} v={[job.address, job.province].filter(Boolean).join(" · ")} />
          <DrPRow k={T("ทีมช่าง")} v={rec.team || ((job.tech && job.tech.name) || "-")} />
        </div>

        {/* ความคืบหน้า — ตัวเลขที่ฟอร์มเดิมไม่ได้เทียบให้ */}
        <div style={{ marginTop: 14, border: "1px solid #DCE4DF", borderRadius: 9, padding: "12px 14px", breakInside: "avoid" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4A5A51" }}>{T("ความคืบหน้ารวม")}</span>
            <div style={{ flex: 1, minWidth: 160, height: 9, borderRadius: 99, background: "#E8EEEA", overflow: "hidden" }}>
              <div style={{ width: Math.max(0, Math.min(100, pct)) + "%", height: "100%", background: "#1B9B75" }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, fontFamily: "var(--mono)", color: "#15211A" }}>{pct}%</span>
            {rec.prevPct != null && <span style={{ fontSize: 11, color: "#4A5A51" }}>{T("จากเมื่อวาน")} {rec.prevPct}%</span>}
          </div>
          {(wAm || wPm) && (
            <div style={{ marginTop: 9, fontSize: 11, color: "#4A5A51" }}>
              {T("สภาพอากาศ · เช้า")} <b style={{ color: "#15211A" }}>{wAm ? T(wAm.th) : "-"}</b> · {T("บ่าย")} <b style={{ color: "#15211A" }}>{wPm ? T(wPm.th) : "-"}</b>
            </div>
          )}
        </div>

        {/* ตารางขั้นงาน */}
        {!!steps.length && (
          <DrPBlock title={T(isProject ? "ความคืบหน้าตามขั้นงาน" : "เนื้องานติดตั้งที่เดินไปแล้ว")}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, th, { width: 38 })}>{T("ขั้น")}</th>
                  <th style={th}>{T("รายละเอียดงาน")}</th>
                  {isProject && <th style={th}>{T("แผน เริ่ม")}</th>}
                  {isProject && <th style={th}>{T("แผน จบ")}</th>}
                  {isProject && <th style={th}>{T("จริง เริ่ม")}</th>}
                  {isProject && <th style={th}>{T("จริง จบ")}</th>}
                  {!isProject && <th style={Object.assign({}, th, { textAlign: "right", width: 78 })}>{T("น้ำหนักงาน")}</th>}
                  <th style={Object.assign({}, th, { textAlign: "right", width: 66 })}>{T("ทำไปแล้ว")}</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((r, i) => (
                  <tr key={i} style={{ background: r.head ? "#F3F7F4" : "transparent" }}>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: r.head ? 800 : 400, color: r.head ? "#0A4D68" : "#7A8A81" })}>{r.no}</td>
                    <td style={Object.assign({}, td, { fontWeight: r.head ? 700 : 400 })}>{r.th}</td>
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.planStart ? (window.pgShort ? window.pgShort(r.planStart, lang) : window.drShort(r.planStart)) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.planEnd ? (window.pgShort ? window.pgShort(r.planEnd, lang) : window.drShort(r.planEnd)) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.actStart ? (window.pgShort ? window.pgShort(r.actStart, lang) : window.drShort(r.actStart)) : "—"}</td>}
                    {isProject && <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{r.actEnd ? (window.pgShort ? window.pgShort(r.actEnd, lang) : window.drShort(r.actEnd)) : "—"}</td>}
                    {!isProject && <td style={Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)", color: "#7A8A81" })}>{r.w ? r.w + "%" : "—"}</td>}
                    <td style={Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700 })}>{r.pct ? r.pct + "%" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DrPBlock>
        )}

        <DrPBlock title={T("งานที่ทำวันนี้")} avoid>{drPara(rec.work)}</DrPBlock>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <DrPBlock title={T("ปัญหา / อุปสรรค")} avoid>{drPara(rec.problem)}</DrPBlock>
          <DrPBlock title={T("สิ่งที่ต้องทำต่อ")} avoid>{drPara(rec.nextDay)}</DrPBlock>
        </div>

        {isProject && (
          <React.Fragment>
            {rowsTable("วัสดุเข้าหน้างาน", [{ k: "name", th: "รายการวัสดุ" }, { k: "qty", th: "จำนวน" }, { k: "unit", th: "หน่วย" }, { k: "loc", th: "จุดจัดเก็บ" }, { k: "note", th: "หมายเหตุ" }], rec.materials)}
            {rowsTable("เครื่องจักร / เครื่องมือ", [{ k: "name", th: "รายการ" }, { k: "qty", th: "จำนวน" }, { k: "unit", th: "หน่วย" }, { k: "job", th: "ใช้กับงาน" }, { k: "note", th: "หมายเหตุ" }], rec.machines)}
            {rowsTable("กำลังคน", [{ k: "role", th: "ตำแหน่ง" }, { k: "qty", th: "จำนวน" }, { k: "name", th: "ชื่อผู้ปฏิบัติงาน" }, { k: "note", th: "หมายเหตุ" }], rec.manpower)}
            {(jsa || rec.permitCold || rec.permitHot || Object.keys(rec.clean || {}).length || (rec.certs || []).length) && (
              <DrPBlock title={T("ความปลอดภัย & สิ่งแวดล้อม")} avoid>
                <div style={{ fontSize: 11, color: "#15211A", lineHeight: 1.9 }}>
                  <div>{T("ระดับความเสี่ยง (JSA):")} <b>{jsa ? T(jsa.th) + " (" + jsa.range + ")" : "—"}</b></div>
                  <div>{T("ใบอนุญาตทำงานเย็น:")} <b>{rec.permitCold === "yes" ? T("มี") : rec.permitCold === "no" ? T("ไม่มี") : "—"}</b>
                    {"  ·  "}{T("ใบอนุญาตทำงานร้อน:")} <b>{rec.permitHot === "yes" ? T("มี") : rec.permitHot === "no" ? T("ไม่มี") : "—"}</b></div>
                  <div>{T("จัดเก็บพื้นที่:")} <b>{(window.DR_CLEAN || []).filter((c) => (rec.clean || {})[c.key]).map((c) => T(c.th)).join(" · ") || "—"}</b></div>
                </div>
                {!!(rec.certs || []).length && (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                    <thead><tr><th style={th}>{T("เอกสารรับรอง")}</th><th style={th}>{T("ผู้รับผิดชอบ")}</th></tr></thead>
                    <tbody>{rec.certs.map((c, i) => <tr key={i}><td style={td}>{c.name || "-"}</td><td style={td}>{c.by || "-"}</td></tr>)}</tbody>
                  </table>
                )}
              </DrPBlock>
            )}
          </React.Fragment>
        )}

        {/* รูปหน้างาน — สองคอลัมน์ ไม่บีบรูปให้เบี้ยว */}
        {!!photos.length && (
          <DrPBlock title={T("รูปหน้างาน") + " (" + photos.length + " " + T("รูป") + ")"}>
            {/* alignItems:start — ไม่งั้นรูปนอนถูกยืดสูงเท่ารูปตั้งในแถวเดียวกัน เหลือช่องว่างใต้รูป */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
              {photos.map((p, i) => (
                <div key={p.id} className="dr-shot" style={{ breakInside: "avoid", border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
                  <img src={p.dataUrl} alt={p.cap || ""} style={{ width: "100%", display: "block", background: "#F3F7F4" }} />
                  <div style={{ padding: "5px 8px", fontSize: 10.5, color: "#4A5A51", borderTop: "1px solid #ECF1EE" }}>
                    <b style={{ color: "#0A4D68" }}>{T("รูปที่")} {i + 1}</b>{p.cap ? " · " + p.cap : ""}
                  </div>
                </div>
              ))}
            </div>
          </DrPBlock>
        )}

        {/* ช่องเซ็น — ชุดเดียวท้ายเล่ม (ฟอร์มเดิมมี 5 ชุดซ้ำทุกหน้า)
            เซ็นในระบบไว้แล้วให้พิมพ์ลายเซ็นจริงลงบนเส้น · ยังไม่เซ็นก็เว้นเส้นว่างไว้เซ็นด้วยปากกา */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, breakInside: "avoid" }}>
          {[{ t: T("ผู้บันทึก (ช่างหน้างาน)"), n: rec.byName, d: rec.sentAt || rec.updatedAt || rec.createdAt, g: signs.by },
            { t: T("ผู้อนุมัติ (หัวหน้างาน)"), n: rec.appName, d: rec.approvedAt, g: signs.app }].map((s, i) => (
            <div key={i} style={{ border: "1px solid #DCE4DF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{s.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6, display: "flex",
                alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
                {s.g && s.g.img && <img src={s.g.img} alt="" style={{ maxWidth: "88%", maxHeight: 40, objectFit: "contain" }} />}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>{T("ชื่อ:")} <b>{(s.g && s.g.name) || s.n || "-"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>
                {T("วันที่:")} {DTs(s.g ? window.drSignDay(s.g) : window.drLocalDay(s.d))}
              </div>
              {s.g && s.g.img && (
                <div style={{ fontSize: 8.5, color: "#8A9A91", marginTop: 3 }}>
                  {T("ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ")} {window.drSignTime(s.g) ? window.drSignTime(s.g) + (lang === "th" ? " น." : "") : ""}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          {T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง")} flash+solar · {docNo} · {T("พิมพ์เมื่อ")} {DTs(window.drToday())}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   หน้ารวมของหัวหน้า — วันนี้ใครส่งแล้ว ใครยังไม่ส่ง
   ══════════════════════════════════════════════════ */
/* ── ตารางภาพรวมหลายวัน ──
   หน้ารายวันตอบได้แค่ "วันนี้ใครยังไม่เขียน" ส่วนคำถามจริงคือ "งานไหนขาดรายงานไปกี่วันแล้ว"
   กับ "มีใบไหนค้างรออนุมัติตั้งแต่เมื่อไหร่" ซึ่งเดิมต้องกดย้อนทีละวันเอง

   อ่านจาก useDailyAll ที่หน้ารายวันโหลดอยู่แล้ว — ไม่มีการอ่านฐานข้อมูลเพิ่ม
   (โหนด dailyReports เป็นของเบา รูปกับลายเซ็นแยกไปอยู่คนละโหนดตั้งแต่แรก) */
const DR_GRID_CELL = { approved: "#10B981", sent: "#F59E0B", draft: "#94A3B8" };

function DrGrid({ jobs, all, days, onOpen, onPickJob, sentOnly }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.drToday();
  const cols = React.useMemo(() => {
    const out = [];
    for (let i = days - 1; i >= 0; i--) out.push(window.drAddDays(today, -i));
    return out;
  }, [days, today]);

  const scroller = React.useRef(null);
  /* เลื่อนไปสุดขวาตั้งแต่เปิด — วันล่าสุดอยู่ขวาสุดตามลำดับเวลา แต่คือช่องที่คนอยากเห็นก่อน */
  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days, jobs.length]);

  const rows = React.useMemo(() => {
    const out = (jobs || []).map((j) => {
      const byDate = (all || {})[j.id] || {};
      const cells = cols.map((d) => ({ d, rec: byDate[d] || null }));
      const written = cells.filter((c) => c.rec).length;
      const sent = cells.filter((c) => c.rec && c.rec.status === "sent").length;
      /* ใบล่าสุดใช้บอก %คืบหน้า — ไล่จากขวาไปซ้ายเพราะขวาคือวันล่าสุด */
      let last = null;
      for (let i = cells.length - 1; i >= 0; i--) if (cells[i].rec) { last = cells[i]; break; }
      return { job: j, cells, written, sent, last };
    }).filter((r) => r.job.stage === "install" || r.written);
    const use = sentOnly ? out.filter((r) => r.sent) : out;
    /* ใบค้างรออนุมัติมากสุดขึ้นก่อน แล้วค่อยงานที่ขาดรายงานมากสุด — เรียงตามสิ่งที่ต้องไปตาม */
    use.sort((a, b) => (b.sent - a.sent) || (a.written - b.written) ||
      String(a.job.code || "").localeCompare(String(b.job.code || "")));
    return use;
  }, [jobs, all, cols, sentOnly]);

  const cw = isMobile ? 17 : 21;
  const nameW = isMobile ? 132 : 200;

  if (!rows.length) return (
    <div style={{ padding: 22, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>
      {sentOnly ? "ไม่มีใบที่รออนุมัติในช่วงนี้" : "ไม่มีงานที่ต้องเขียนรายงานในช่วงนี้"}
    </div>
  );

  return (
    <div ref={scroller} style={{ overflowX: "auto" }}>
      <div style={{ minWidth: nameW + cols.length * cw + 108, width: "max-content" }}>
        {/* หัวคอลัมน์ — ขึ้นเลขวันที่เฉพาะวันจันทร์กับวันที่ 1 ไม่งั้นตัวเลขชนกันจนอ่านไม่ออก */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0, padding: "0 12px 6px",
          borderBottom: "1px solid var(--border)" }}>
          {/* ชื่องานต้องค้างอยู่กับที่ตอนเลื่อนดูวันย้อนหลัง ไม่งั้นเลื่อนไปแล้วไม่รู้ว่าแถวไหนของใคร */}
          <div style={{ width: nameW, flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: "var(--text-3)",
            position: "sticky", left: 0, background: "var(--surface2)", zIndex: 2 }}>งาน</div>
          {cols.map((d) => {
            const dt = new Date(d + "T00:00:00");
            const mark = dt.getDay() === 1 || dt.getDate() === 1;
            return (
              <div key={d} style={{ width: cw, flexShrink: 0, textAlign: "center", fontFamily: "var(--mono)",
                fontSize: 9, color: d === today ? "var(--primary-dark)" : "var(--text-3)",
                fontWeight: d === today ? 800 : 600 }}>
                {d === today ? "วันนี้" : mark ? dt.getDate() : ""}
              </div>
            );
          })}
          <div style={{ width: 108, flexShrink: 0, textAlign: "right", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>เขียนแล้ว · ล่าสุด</div>
        </div>

        {rows.map((r) => (
          <div key={r.job.id} style={{ display: "flex", alignItems: "center", padding: "5px 12px",
            borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => onPickJob(r.job)} title="ดูรายงานทุกวันของงานนี้"
              style={{ width: nameW, flexShrink: 0, textAlign: "left", border: "none",
                cursor: "pointer", fontFamily: "inherit", padding: "2px 6px 2px 0", minWidth: 0,
                position: "sticky", left: 0, background: "var(--surface2)", zIndex: 2 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-1)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.job.name}</span>
              <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                {r.job.code}{r.job.eeName ? " · " + r.job.eeName : " · ยังไม่ระบุวิศวกร"}
              </span>
            </button>
            {r.cells.map((c) => {
              const st = c.rec ? (c.rec.status || "draft") : null;
              const col = st ? (DR_GRID_CELL[st] || DR_GRID_CELL.draft) : "";
              return (
                <button key={c.d} onClick={() => onOpen(r.job, c.d)}
                  title={window.drDateTH(c.d) + " · " + (c.rec ? window.drStatusOf(st).th +
                    (c.rec.pct != null ? " · " + (+c.rec.pct || 0) + "%" : "") : "ยังไม่เขียน")}
                  style={{ width: cw, flexShrink: 0, height: 24, border: "none", background: "none",
                    cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
                  <span style={{ width: cw - 5, height: cw - 5, borderRadius: 5,
                    background: col || "transparent",
                    border: col ? "none" : "1px dashed var(--border-strong)",
                    opacity: col ? 1 : 0.55 }} />
                </button>
              );
            })}
            <div style={{ width: 108, flexShrink: 0, textAlign: "right", lineHeight: 1.3 }}>
              <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700,
                color: r.written ? "var(--text-2)" : "#EF4444" }}>
                {r.written}/{days} วัน
              </span>
              <span style={{ display: "block", fontSize: 10, color: "var(--text-3)" }}>
                {r.sent ? <span style={{ color: "#F59E0B", fontWeight: 700 }}>รออนุมัติ {r.sent}</span>
                  : r.last && r.last.rec.pct != null ? "คืบหน้า " + (+r.last.rec.pct || 0) + "%" : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── สรุปรายงานของงานเดียว จบทุกวันในหน้าเดียว ──
   เวลาลูกค้าถามว่า "งานบ้านผมคืบหน้าถึงไหน" ต้องเปิดทีละวันไล่อ่าน หน้านี้ตอบได้ในจอเดียว */
function DrJobSummary({ job, all, onOpen, onBack }) {
  const byDate = (all || {})[job.id] || {};
  const dates = Object.keys(byDate).sort().reverse();
  const n = { sent: 0, approved: 0, draft: 0 };
  dates.forEach((d) => { const k = byDate[d].status || "draft"; n[k] = (n[k] || 0) + 1; });

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onBack} title="กลับไปตารางภาพรวม"
          style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
            cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
          <Icon name="chevronRight" size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>
            {job.code} · เขียนแล้ว {dates.length} วัน
            {n.sent ? " · รออนุมัติ " + n.sent : ""}
            {" · วิศวกร " + (job.eeName || "ยังไม่ระบุ")}
          </span>
        </span>
      </div>
      {!dates.length && (
        <div style={{ padding: 22, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>งานนี้ยังไม่เคยเขียนรายงาน</div>
      )}
      {dates.map((d) => {
        const rec = byDate[d];
        const st = window.drStatusOf(rec.status || "draft");
        return (
          <button key={d} onClick={() => onOpen(job, d)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px",
              border: "none", borderBottom: "1px solid var(--border)", background: "none",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: st.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-2)", flexShrink: 0, width: 92 }}>
              {window.drShort(d)}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--text-2)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {rec.work ? String(rec.work) : <span style={{ color: "var(--text-3)" }}>ไม่ได้กรอกงานที่ทำ</span>}
            </span>
            {rec.pct != null && (
              <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{+rec.pct || 0}%</span>
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.color + "1a",
              borderRadius: 99, padding: "3px 9px", flexShrink: 0, whiteSpace: "nowrap" }}>{st.th}</span>
          </button>
        );
      })}
    </div>
  );
}

function DailyView({ jobs, role, currentUser, onOpen }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { all, loading } = window.useDailyAll();
  const [date, setDate] = React.useState(window.drToday);
  /* โหมดดู — รายวันคือของเดิม · ภาพรวมตอบคำถามที่เดิมต้องกดย้อนวันเอง
     jobPick = เจาะดูงานเดียวจบทุกวัน (ออกมาจากภาพรวม กดชื่องาน) */
  const [mode, setMode] = React.useState("day");
  const [days, setDays] = React.useState(14);
  const [sentOnly, setSentOnly] = React.useState(false);
  const [jobPick, setJobPick] = React.useState(null);
  React.useEffect(() => { if (mode !== "grid") setJobPick(null); }, [mode]);
  /* งานที่เลือกไว้อาจถูกกรองหายไปจากรายการ — ยึดก้อนสดเสมอ ไม่งั้นชื่อค้างเป็นของเก่า */
  const pickedJob = React.useMemo(
    () => (jobPick ? (jobs || []).find((j) => j.id === jobPick.id) || jobPick : null),
    [jobs, jobPick]);
  const canDelete = window.drCanDelete(role);
  const [delAsk, setDelAsk] = React.useState(null);   /* id ของงานที่กำลังถามยืนยันลบ */
  React.useEffect(() => setDelAsk(null), [date]);

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
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        {[["day", "รายวัน", "calendar"], ["grid", "ตารางภาพรวม", "table"]].map(([k, th, ic]) => (
          <button key={k} onClick={() => setMode(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 99,
              border: "1px solid " + (mode === k ? "var(--primary)" : "var(--border-strong)"),
              background: mode === k ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
              color: mode === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            <Icon name={ic} size={15} color={mode === k ? "var(--primary-dark)" : "var(--text-2)"} />
            {th}
          </button>
        ))}
      </div>

      {mode === "grid" ? (
        <React.Fragment>
          {!pickedJob && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {[14, 30].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  style={{ padding: "6px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12, fontWeight: 700,
                    border: "1px solid " + (days === d ? "var(--primary)" : "var(--border-strong)"),
                    background: days === d ? "var(--primary-soft)" : "var(--surface)",
                    color: days === d ? "var(--primary-dark)" : "var(--text-2)" }}>{d} วันล่าสุด</button>
              ))}
              {/* ตัวกรองนี้คือคิวงานของวิศวกร — ใบที่ค้างรอเซ็นทุกงานทุกวันมากองรวมกัน */}
              <button onClick={() => setSentOnly((v) => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 99,
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                  border: "1px solid " + (sentOnly ? "#F59E0B" : "var(--border-strong)"),
                  background: sentOnly ? "#F59E0B16" : "var(--surface)",
                  color: sentOnly ? "#B45309" : "var(--text-2)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: "#F59E0B" }} />
                เฉพาะที่รออนุมัติ
              </button>
              <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
                {[["อนุมัติแล้ว", "#10B981"], ["รออนุมัติ", "#F59E0B"], ["ยังเป็นร่าง", "#94A3B8"]].map(([th, c]) => (
                  <span key={th} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: c }} />{th}
                  </span>
                ))}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, border: "1px dashed var(--border-strong)" }} />ยังไม่เขียน
                </span>
              </span>
            </div>
          )}
          <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)",
            overflow: "hidden", padding: pickedJob ? 0 : "12px 0 4px" }}>
            {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}
            {!loading && (pickedJob
              ? <DrJobSummary job={pickedJob} all={all} onOpen={onOpen} onBack={() => setJobPick(null)} />
              : <DrGrid jobs={jobs} all={all} days={days} sentOnly={sentOnly}
                  onOpen={onOpen} onPickJob={setJobPick} />)}
          </div>
        </React.Fragment>
      ) : (
      <React.Fragment>
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
          /* แถวที่กำลังถามยืนยันลบ — ทับทั้งแถวไปเลย จะได้ไม่มีทางกดพลาดโดนปุ่มอื่น */
          if (canDelete && delAsk === r.job.id) return (
            <div key={r.job.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: isMobile ? "11px 12px" : "13px 16px",
              borderBottom: "1px solid var(--border)", background: "#EF44440e", flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                ลบรายงาน {r.job.code} ของวันนี้ทั้งใบ? รูปและลายเซ็นหายไปด้วย เรียกคืนไม่ได้
              </span>
              <button onClick={() => setDelAsk(null)}
                style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ยกเลิก</button>
              <button onClick={() => { window.drDeleteDay(r.job.id, date); setDelAsk(null); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none",
                  background: "#EF4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                <Icon name="trash" size={14} color="#fff" /> ลบเลย
              </button>
            </div>
          );
          return (
            <div key={r.job.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => onOpen(r.job)}
              style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 11, padding: isMobile ? "11px 12px" : "13px 16px",
                background: "none", border: "none", cursor: "pointer",
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
            {canDelete && r.rec && (
              <button onClick={() => setDelAsk(r.job.id)} title="ลบใบรายงานของวันนี้ (เฉพาะแอดมิน)"
                style={{ width: 34, height: 34, marginRight: isMobile ? 8 : 12, borderRadius: 9, flexShrink: 0,
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Icon name="trash" size={15} color="#EF4444" />
              </button>
            )}
            </div>
          );
        })}
      </div>
      </React.Fragment>
      )}
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

/* ชิ้นส่วนฟอร์มปล่อยออกไปให้โมดูลอื่นใช้ด้วย (งานบริการหลังการขายใช้ชุดเดียวกัน)
   หน้าตาฟอร์มทั้งระบบจะได้เหมือนกัน แก้ที่นี่ที่เดียวเปลี่ยนพร้อมกันทุกที่ */
Object.assign(window, { DailyReportModal, DailyPaper, DailyView, DailyJobButton,
  DrLabel, DrText, DrSection, DrChips, DrRows, DrPhotoCap, DrSignSlot, DR_INPUT });
