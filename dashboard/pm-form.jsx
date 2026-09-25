/* ══════════════════════════════════════════════════
   สมุดตรวจรับและส่งมอบระบบ — หน้าจอกรอก

   กรอกทีละนิดระหว่างทำงานได้ เป็นเหตุผลทั้งหมดที่ทำฟีเจอร์นี้ ⇒ ไม่มีปุ่ม "บันทึก" ก้อนใหญ่
   ทุกช่องบันทึกตอนออกจากช่อง ทุกการติ๊กบันทึกทันที ปิดหน้าไปกลางทางแล้วกลับมาต่อได้

   ⚠ ช่องกรอก (PmField) กับแถวเช็คลิสต์ (PmDocRow) ประกาศที่ระดับโมดูล ไม่ใช่ในตัว modal
     ถ้าประกาศข้างใน React จะถือเป็นคอมโพเนนต์ตัวใหม่ทุกครั้งที่เรนเดอร์ แล้วสร้าง input ใหม่
     ⇒ เคอร์เซอร์เด้งออกจากช่องทุกตัวอักษรที่พิมพ์ (กับดักเดียวกับที่ inspect.jsx เขียนเตือนไว้)

   ⚠ ใช้ window.askConfirm ไม่ใช่ confirm() ของเบราว์เซอร์ (ดูเหตุผลใน confirm.jsx)

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย Pm / pm / PM_
   ══════════════════════════════════════════════════ */

const PM_STATE_COLOR = { na: "#94A3B8", empty: "#94A3B8", partial: "#F59E0B", done: "var(--tint-green-tx)" };

const pmInputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

/* ── หนึ่งช่องกรอกของแผ่น Summary ──
   หัวข้ออังกฤษ/ไทยคู่กันตามต้นฉบับ · บันทึกตอนออกจากช่อง ไม่ใช่ทุกตัวอักษร
   ป้าย "จาก BOQ" ฯลฯ แปลว่าค่านี้ระบบเดาให้ ยังไม่มีใครยืนยัน — ความหมายคือ "ช่วยตรวจที" */
function PmField({ field, value, prefilled, onCommit }) {
  const [v, setV] = React.useState(value == null ? "" : String(value));
  const ref = React.useRef(value);
  /* ค่าจากข้างนอกเปลี่ยน (คนอื่นแก้พร้อมกัน หรือ BOQ อัปเดต) — รับมาเฉพาะตอนไม่ได้พิมพ์ค้างอยู่ */
  React.useEffect(() => {
    if (String(ref.current == null ? "" : ref.current) !== String(value == null ? "" : value)) {
      ref.current = value; setV(value == null ? "" : String(value));
    }
  }, [value]);

  const commit = () => { ref.current = v; onCommit(field.key, v); };
  const label = (
    <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>
      {field.en}
      <span style={{ fontWeight: 400, color: "var(--text-3)" }}> ({field.th})</span>
      {field.unit ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · {field.unit}</span> : null}
      {field.req ? <span style={{ color: "#DC2626" }}> *</span> : null}
      {prefilled && String(v).trim() !== "" ? (
        <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 99, background: "var(--primary-soft)",
          color: "var(--primary-dark)", fontSize: 10, fontWeight: 700 }}>
          {window.PM_FROM_LABEL[field.from] || "เติมให้"}
        </span>
      ) : null}
    </label>
  );

  return (
    <div style={{ marginBottom: 11 }}>
      {label}
      {field.type === "area" ? (
        <textarea value={v} rows={2} onChange={(e) => setV(e.target.value)} onBlur={commit}
          style={Object.assign({}, pmInputStyle, { resize: "vertical" })} />
      ) : field.type === "select" ? (
        <select value={v} onChange={(e) => { setV(e.target.value); ref.current = e.target.value; onCommit(field.key, e.target.value); }}
          style={pmInputStyle}>
          <option value="">— ยังไม่เลือก —</option>
          {(field.opts || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={v} type={field.type === "date" ? "date" : field.type === "num" ? "number" : "text"}
          placeholder={field.ph || ""} inputMode={field.type === "num" ? "decimal" : undefined}
          onChange={(e) => setV(e.target.value)} onBlur={commit} style={pmInputStyle} />
      )}
    </div>
  );
}

/* ── หนึ่งบรรทัดของรายการเอกสาร ──
   สามสถานะ: ยังไม่ตอบ / มี (√) / ไม่เกี่ยวข้อง (–)
   "ไม่เกี่ยวข้อง" ไม่ใช่ทางลัด — ต้นฉบับกา "-" ให้เอกสารที่ไซต์นั้นไม่มีจริง เช่นไซต์ที่ไม่มีระบบล้างแผง
   ทั้งสองอย่างนับว่า "ตอบแล้ว" เท่ากัน */
function PmDocRow({ item, value, onSet }) {
  const btn = (val, text, color) => {
    const on = value === val;
    return (
      <button onClick={() => onSet(item.key, on ? null : val)}
        style={{ width: 38, height: 32, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 800,
          border: "1px solid " + (on ? color : "var(--border-strong)"),
          background: on ? color : "var(--surface)", color: on ? "#fff" : "var(--text-3)" }}>
        {text}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>{item.en}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{item.th}</span>
      </span>
      {btn("y", "√", "#16A34A")}
      {btn("n", "–", "#64748B")}
    </div>
  );
}

/* ── หนึ่งช่องลงนาม ── */
function PmSignRow({ block, value, onCommit }) {
  const v = value || {};
  const [name, setName] = React.useState(v.name || "");
  const [date, setDate] = React.useState(v.date || "");
  React.useEffect(() => { setName((value || {}).name || ""); setDate((value || {}).date || ""); }, [value]);
  return (
    <div style={{ marginBottom: 13, padding: 11, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
        {block.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({block.th})</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} placeholder="ชื่อผู้ลงนาม" onChange={(e) => setName(e.target.value)}
          onBlur={() => onCommit(block.key, { name: name, date: date })}
          style={Object.assign({}, pmInputStyle, { flex: 2, minWidth: 160 })} />
        <input value={date} type="date" onChange={(e) => { setDate(e.target.value); onCommit(block.key, { name: name, date: e.target.value }); }}
          style={Object.assign({}, pmInputStyle, { flex: 1, minWidth: 140 })} />
      </div>
      {/* ชื่อที่พิมพ์ไม่แทนลายเซ็นจริง กระดาษยังเว้นช่องเซ็นเสมอ */}
      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 5 }}>ใบที่พิมพ์ออกมายังเว้นช่องเซ็นด้วยปากกาไว้เสมอ</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   หน้าหลัก
   ══════════════════════════════════════════════════ */
function PmHandoverModal({ job, currentUser, onClose, onSummary }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const jobId = job ? job.id : null;
  const store = window.usePmHandover(jobId);
  const ph = window.usePmPhotoIdx(jobId);
  const [tab, setTab] = React.useState("sum");
  const [paper, setPaper] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  const rec = store.rec;
  const started = !!(rec && rec.meta);
  const sum = React.useMemo(() => window.pmMerged(rec, job, currentUser), [rec, job, currentUser]);
  const prog = React.useMemo(() => (started ? window.pmProgress(rec, job, currentUser)
    : { pct: 0, done: 0, total: 0, missing: [], bySection: {} }), [rec, job, currentUser, started]);
  const newer = started ? window.pmNewerItems(rec) : 0;

  /* เงาบนใบงาน — เขียนตามหลังทุกครั้งที่ความครบเปลี่ยน ให้การ์ดกับหน้ารายการอ่านสถานะได้
     ⚠ ข้ามตอนอยู่ในกล่องทราย เพราะ store.patch เขียน jobs/<id> ของจริงเสมอ (ไม่รู้จัก PM_ROOT) */
  const lastShadow = React.useRef("");
  React.useEffect(() => {
    if (!started || !onSummary || window.PM_ROOT) return;
    const s = window.pmSummaryOf(rec, job, currentUser);
    const sig = [s.pct, s.done, s.total, s.status, s.ver].join("|");
    if (sig === lastShadow.current) return;
    lastShadow.current = sig;
    onSummary(s);
  }, [rec, job, currentUser, started, onSummary]);

  if (!job) return null;

  const setField = (key, val) => store.patch("sum", { [key]: val == null ? "" : String(val) }, currentUser);
  const setDoc = (key, val) => store.patch("docs", { [key]: val }, currentUser);
  const setSign = (key, val) => store.patch("sign", { [key]: val }, currentUser);

  const addPhotos = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i].type || arr[i].type.indexOf("image/") !== 0) continue;
        /* โปรไฟล์มือถือ — รูปละ ~200KB สมุดเต็มเล่มมีได้ร้อยกว่ารูป ถ้าใหญ่กว่านี้ช่างจ่ายค่าเน็ตเอง */
        const dataUrl = await window.resizeImageFile(arr[i], 1100, 0.70);
        ph.add(dataUrl, { sec: "gen" }, currentUser);
      }
    } finally { setBusy(false); }
  };

  /* จำนวนรูปต่อสลอต เก็บไว้ให้ตัวเช็คความครบอ่าน (เฟสถัดไปที่รูปเป็นรายการบังคับจะได้ใช้ได้ทันที) */
  React.useEffect(() => {
    if (!started) return;
    const flags = window.pmPhotoFlags(ph.idx);
    const cur = (rec && rec.flags) || {};
    if (JSON.stringify(flags) === JSON.stringify(cur)) return;
    store.patch("flags", flags, currentUser);
  }, [ph.idx, started]);

  const signOff = async () => {
    if (prog.missing.length) {
      const ok = await window.askConfirm({
        title: "ปิดเล่มทั้งที่ยังไม่ครบ?", icon: "alert", ok: "ปิดเล่มเลย",
        body: "ยังขาดอีก " + prog.missing.length + " รายการ · ปิดเล่มได้ แต่ใบที่พิมพ์ออกมาจะมีหน้าบอกว่าขาดอะไรบ้างติดไปด้วย",
      });
      if (!ok) return;
    }
    store.setStatus("signed", currentUser);
  };

  const secs = window.PM_SECTIONS;
  const cur = window.PM_SEC_BY[tab];

  const tabBtn = (sec) => {
    const st = prog.bySection[sec.key] || { pct: 0, state: "empty", done: 0, total: 0 };
    const on = tab === sec.key;
    return (
      <button key={sec.key} onClick={() => setTab(sec.key)}
        style={{ flexShrink: 0, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
          border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
          background: on ? "var(--primary-soft)" : "var(--surface)", textAlign: "left" }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: on ? "var(--primary-dark)" : "var(--text-1)" }}>
          {sec.th}
        </span>
        <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: PM_STATE_COLOR[st.state] || "var(--text-3)" }}>
          {st.total ? st.done + "/" + st.total + " · " + st.pct + "%" : "ไม่มีรายการบังคับ"}
        </span>
      </button>
    );
  };

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 132,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(760px,100%)",
          maxHeight: isMobile ? "94dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          {/* หัวหน้าต่าง */}
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#16A34A1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="check" size={17} color="#16A34A" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>สมุดตรวจรับและส่งมอบระบบ</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.code} · {job.name}
              </div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>

          {!started ? (
            /* ── ยังไม่เปิดเล่ม ── */
            <div style={{ padding: 26, textAlign: "center" }}>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
                ยังไม่ได้เปิดสมุดส่งมอบของงานนี้<br />
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  เปิดแล้วกรอกเพิ่มทีละอย่างได้ระหว่างทำงาน · ข้อมูลที่ระบบรู้อยู่แล้วจะถูกเติมให้ก่อน
                </span>
              </div>
              <button onClick={() => store.open(currentUser)} disabled={!window.FBDB}
                style={{ padding: "11px 20px", borderRadius: 11, border: "1px solid var(--primary)", background: "var(--primary)",
                  color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: window.FBDB ? "pointer" : "not-allowed",
                  opacity: window.FBDB ? 1 : .5 }}>
                เปิดสมุดส่งมอบ
              </button>
              {!window.FBDB ? (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>ต้องต่อฐานข้อมูลก่อนจึงจะเปิดเล่มได้</div>
              ) : null}
            </div>
          ) : (
            <React.Fragment>
              {/* แถบความครบ */}
              <div style={{ padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>
                    กรอกแล้ว {prog.pct}%
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>({prog.done}/{prog.total} รายการ)</span>
                  <span style={{ flex: 1 }} />
                  {(rec.meta || {}).status === "signed" ? (
                    <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--tint-ok-bg)",
                      border: "1px solid var(--tint-ok-bd)", color: "var(--tint-ok-tx)", fontSize: 10.5, fontWeight: 800 }}>
                      ส่งมอบแล้ว
                    </span>
                  ) : null}
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ width: prog.pct + "%", height: "100%", borderRadius: 99,
                    background: prog.pct >= 100 ? "var(--tint-green-tx)" : "#F59E0B", transition: "width .2s" }} />
                </div>
              </div>

              {/* แบนเนอร์รายการใหม่ — สมัครใจเสมอ ไม่อัปเดตเองเพราะจะทำให้เล่มที่เคยครบกลายเป็นไม่ครบ */}
              {newer ? (
                <div style={{ padding: "9px 16px", background: "var(--tint-amber-bg)", borderBottom: "1px solid var(--tint-amber-bd)",
                  display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--tint-amber-tx)" }}>
                    แบบฟอร์มมีรายการบังคับใหม่เพิ่มมา {newer} รายการ — เล่มนี้ยังใช้แบบเดิมอยู่
                  </span>
                  <button onClick={store.bumpVer}
                    style={{ flexShrink: 0, padding: "6px 11px", borderRadius: 8, border: "1px solid var(--tint-amber-bd)",
                      background: "var(--surface)", color: "var(--tint-amber-tx)", fontFamily: "inherit", fontSize: 11.5,
                      fontWeight: 700, cursor: "pointer" }}>
                    อัปเดตแบบฟอร์ม
                  </button>
                </div>
              ) : null}

              {/* แถบเลือกหมวด */}
              <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto", borderBottom: "1px solid var(--border)" }}>
                {secs.map(tabBtn)}
                <button onClick={() => setTab("photo")}
                  style={{ flexShrink: 0, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    border: "1px solid " + (tab === "photo" ? "var(--primary)" : "var(--border-strong)"),
                    background: tab === "photo" ? "var(--primary-soft)" : "var(--surface)", textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700,
                    color: tab === "photo" ? "var(--primary-dark)" : "var(--text-1)" }}>รูปประกอบ</span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>
                    {ph.idx.length} รูป
                  </span>
                </button>
              </div>

              {/* เนื้อหา */}
              <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
                {cur && cur.kind === "fields" && (cur.groups || []).map((g) => (
                  <div key={g.key} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", marginBottom: 9,
                      paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                      {g.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({g.th})</span>
                      {g.optional ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · ไม่บังคับ</span> : null}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: 14 }}>
                      {(g.fields || []).map((f) => (
                        <PmField key={f.key} field={f} value={sum[f.key]}
                          prefilled={window.pmIsPrefilled(rec, f.key) && !!f.from} onCommit={setField} />
                      ))}
                    </div>
                  </div>
                ))}

                {cur && cur.kind === "checklist" && (cur.groups || []).map((g) => (
                  <div key={g.key} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", marginBottom: 4,
                      paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                      {g.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({g.th})</span>
                    </div>
                    {(g.items || []).map((it) => (
                      <PmDocRow key={it.key} item={it} value={(rec.docs || {})[it.key]} onSet={setDoc} />
                    ))}
                  </div>
                ))}

                {cur && cur.kind === "sign" && (
                  <React.Fragment>
                    {(cur.blocks || []).map((b) => (
                      <PmSignRow key={b.key} block={b} value={(rec.sign || {})[b.key]} onCommit={setSign} />
                    ))}
                    {(rec.meta || {}).status !== "signed" ? (
                      <button onClick={signOff}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 11, border: "1px solid var(--primary)",
                          background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                        ปิดเล่ม · บันทึกว่าส่งมอบแล้ว
                      </button>
                    ) : (
                      <button onClick={() => store.setStatus("draft", currentUser)}
                        style={{ width: "100%", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
                          background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        เปิดเล่มกลับมาแก้ไข
                      </button>
                    )}
                  </React.Fragment>
                )}

                {tab === "photo" && (
                  <React.Fragment>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                      onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                    <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                      style={{ width: "100%", marginBottom: 14, padding: "11px 16px", borderRadius: 11,
                        border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
                        fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
                      {busy ? "กำลังย่อรูป…" : "＋ เพิ่มรูปประกอบการส่งมอบ"}
                    </button>
                    {!ph.idx.length ? (
                      <div style={{ padding: 28, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>
                        ยังไม่มีรูป · รูปที่เพิ่มจะไปอยู่ท้ายไฟล์ PDF หน้าละ 6 รูป
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                        {ph.idx.map((x, i) => (
                          <div key={x.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 9, background: "var(--surface)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-2)" }}>#{i + 1}</span>
                              <span style={{ flex: 1, fontSize: 10.5, color: "var(--text-3)" }}>{x.byName || ""}</span>
                              <button onClick={async () => {
                                const ok = await window.askConfirm({ title: "ลบรูปนี้?", icon: "trash", ok: "ลบรูป" });
                                if (ok) ph.remove(x.id);
                              }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                            <input defaultValue={x.cap || ""} placeholder="คำบรรยายรูป (พิมพ์ใต้รูปในใบ)"
                              onBlur={(e) => ph.setCap(x.id, e.target.value)}
                              style={Object.assign({}, pmInputStyle, { fontSize: 12.5, padding: "7px 9px" })} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                      รูปถูกย่อก่อนเก็บเพื่อไม่ให้เปลืองเน็ตของช่างหน้างาน · ไฟล์ Excel ฝังรูปไม่ได้
                      แผ่น Photos ในนั้นเป็นสารบัญที่อ้างเลขรูปชุดเดียวกับใน PDF
                    </div>
                  </React.Fragment>
                )}
              </div>

              {/* รายการที่ยังขาด + ปุ่มออกรายงาน */}
              <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "11px 16px" }}>
                {prog.missing.length ? (
                  <details style={{ marginBottom: 10 }}>
                    <summary style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                      ⚠️ ยังขาดอีก {prog.missing.length} รายการ · แตะเพื่อดู
                    </summary>
                    <div style={{ maxHeight: 170, overflowY: "auto", marginTop: 8 }}>
                      {prog.missing.map((m, i) => (
                        <button key={m.key + i} onClick={() => setTab(m.section)}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 8px", marginBottom: 3,
                            borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer",
                            fontFamily: "inherit", fontSize: 11.5, color: "var(--text-2)" }}>
                          <b style={{ color: "var(--text-3)", fontWeight: 700 }}>{m.secTh}</b> · {m.th}
                        </button>
                      ))}
                    </div>
                  </details>
                ) : (
                  <div style={{ marginBottom: 10, fontSize: 12.5, fontWeight: 700, color: "var(--tint-green-tx)" }}>
                    ✓ กรอกครบทุกรายการแล้ว
                  </div>
                )}
                <button onClick={() => setPaper(true)}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--primary)",
                    background: "var(--primary-soft)", color: "var(--primary-dark)", fontFamily: "inherit",
                    fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  ดูรายงาน · บันทึก PDF / ออกไฟล์ Excel
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {paper && <PmPaperHost job={job} rec={rec} sum={sum} prog={prog} onClose={() => setPaper(false)} />}
    </React.Fragment>
  );
}

/* กระดาษต้องการรูปตัวจริงพร้อม dataUrl ซึ่งหนัก จึงเพิ่งไปโหลดตอนเปิดกระดาษ ไม่ใช่ตอนเปิดฟอร์ม
   (แยกเป็นคอมโพเนนต์เพราะ hook เรียกแบบมีเงื่อนไขไม่ได้) */
function PmPaperHost({ job, rec, sum, prog, onClose }) {
  const photos = window.usePmPhotos(job ? job.id : null, true);
  if (!window.PmHandoverPaper) return null;
  return <window.PmHandoverPaper job={job} rec={rec} sum={sum} prog={prog} photos={photos} onClose={onClose} />;
}

Object.assign(window, { PmField, PmDocRow, PmSignRow, PmHandoverModal, PmPaperHost });
