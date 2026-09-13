/* ============================================================
   flash+solar — รายงานไซต์ประจำวันจากแอป LINE (เฟส 4) · คำนำหน้า ln / Ln

   ⚠ ไม่มีตรรกะรายงานของตัวเองเลย — ใช้ drBlank · drRollup · drPrevOf ·
      useDailyReports · useDailyPhotos · useDailySigns · useDrMySign · DrSignPad
      จาก daily.jsx ตรง ๆ  ใบที่ส่งจากที่นี่จึงเป็นใบเดียวกับที่กรอกบนเดสก์ท็อป
      อนุมัติและพิมพ์ผ่าน DailyPaper ได้เหมือนกันทุกประการ

   ── ข้อจำกัดรูปที่ตั้งใจให้เห็นชัด ──
   รูปเก็บเป็น base64 ใน RTDB · ใครที่ฟังโหนดนั้นจะดูดมาทั้งหมด
   จำกัดไว้ LN_DR_MAX รูปต่อใบแบบตายตัว ไม่ใช่คำแนะนำ — ปุ่มหายไปเลยเมื่อครบ
   ถ้าปล่อยให้ถ่ายไม่จำกัด ใบเดียวจะโตเป็นหลายเมกะไบต์ แล้วทุกคนที่เปิดใบนั้น
   ต้องโหลดทั้งก้อนผ่าน 4G ที่ช่างจ่ายค่าเน็ตเอง
   ============================================================ */

const LN_DR_MAX = 8;

const LN_DR_FIELD = { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)",
  background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none" };
const LN_DR_LABEL = { fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" };

/* ── ฟอร์มรายงานของวันหนึ่ง ── */
function LnDailyForm({ me, role, job, date, store, notify }) {
  const photos = window.useDailyPhotos(job.id, date);
  const sigs = window.useDailySigns(job.id, date);
  const mine = window.useDrMySign((me || {}).id || null);

  const prev = React.useMemo(() => window.drPrevOf(store.byDate, date), [store.byDate, date]);
  const saved = store.byDate[date] || null;

  const [form, setForm] = React.useState(null);
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [zoom, setZoom] = React.useState(null);

  /* ตั้งฟอร์มใหม่ทุกครั้งที่เปลี่ยนงานหรือวัน — ของที่ค้างอยู่ในฟอร์มของวันก่อนหน้า
     ต้องไม่ไหลไปทับใบของอีกวัน */
  React.useEffect(() => {
    setForm(saved ? Object.assign(window.drBlank(job, date, me, prev), saved) : window.drBlank(job, date, me, prev));
    setMsg("");
  }, [job.id, date, !!saved]);

  if (!form) return null;

  const locked = form.status === "approved" || form.status === "sent";
  const set = (fields) => setForm((p) => {
    const n = Object.assign({}, p, fields);
    /* งานบ้านคิด % รวมจากเนื้องานถ่วงน้ำหนัก ไม่ให้พิมพ์ทับ — กฎเดียวกับเดสก์ท็อป */
    if (n.mode !== "project") n.pct = window.drRollup(n.steps);
    return n;
  });
  const setStep = (i, pct) => set({ steps: (form.steps || []).map((r, x) =>
    (x === i ? Object.assign({}, r, { pct: Math.max(0, Math.min(100, +pct || 0)) }) : r)) });

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(0, LN_DR_MAX - photos.photos.length));
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    for (const f of files) {
      try { photos.add(await window.resizeImageFile(f, 1100, 0.70), me); } catch (err) { /* รูปเดียวพังไม่ลากรูปอื่นไปด้วย */ }
    }
    setBusy(false);
  };

  const saveDraft = () => { store.save(date, form); setMsg("บันทึกร่างแล้ว"); };

  const doSend = () => {
    const rec = Object.assign({}, form, { status: "sent", sentAt: new Date().toISOString(),
      byId: (me || {}).id || null, byName: (me || {}).name || "" });
    store.save(date, rec);
    setForm(rec);
    /* ยิงตรงไปหาวิศวกรของงานนี้ ไม่กระจายให้ทุกคนที่มีสิทธิ์ เพราะคนรับผิดชอบมีคนเดียว
       วิศวกรที่ส่งใบของตัวเองไม่ต้องเตือนตัวเอง (ข้อความชุดเดียวกับหน้าเดสก์ท็อป) */
    const eeId = job.eeId || "";
    if (notify && eeId && eeId !== ((me || {}).id || "")) {
      notify({ toUserId: eeId, type: "daily", event: "sent", jobId: job.id, jobName: job.name,
        title: "รายงานประจำวันรออนุมัติ",
        body: [job.code, window.drDateTH(date), "โดย " + ((me || {}).name || "ช่าง")].filter(Boolean).join(" · ") });
    }
    setMsg("ส่งให้วิศวกรอนุมัติแล้ว");
  };

  /* ใบที่ไม่มีลายเซ็นเอาไปใช้เป็นเอกสารไม่ได้ — เซ็นก่อนส่งเสมอ
     ใครบันทึกลายเซ็นไว้แล้ว ระบบเซ็นให้เลย ไม่ต้องเซ็นซ้ำทุกวัน */
  const send = () => {
    if (sigs.signs.by && sigs.signs.by.img) return doSend();
    if (mine.sign && mine.sign.img) { sigs.sign("by", mine.sign.img, me); return doSend(); }
    setPad(true);
  };

  const onSign = (img, drawn) => {
    sigs.sign("by", img, me);
    if (drawn && remember) mine.save(img);
    setPad(null);
    doSend();
  };

  const full = photos.photos.length >= LN_DR_MAX;

  return (
    <div style={{ display: "grid", gap: 14, paddingTop: 14 }}>
      {locked && (
        <div style={{ padding: "11px 13px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, textAlign: "center",
          background: window.drStatusOf(form.status).color + "1A", color: window.drStatusOf(form.status).color }}>
          {window.drStatusOf(form.status).th} — แก้ไขจากมือถือไม่ได้แล้ว
        </div>
      )}

      {window.drNoEe(job) && !locked && (
        <div style={{ padding: "11px 13px", borderRadius: 12, fontSize: 12, lineHeight: 1.6,
          background: "var(--tint-amber-bg)", color: "var(--tint-amber-tx)" }}>
          งานนี้ยังไม่ได้ระบุวิศวกรผู้รับผิดชอบ — ส่งใบไปแล้วจะไม่มีใครได้รับแจ้งเตือนให้มาอนุมัติ
        </div>
      )}

      <div style={{ display: "grid", gap: 6 }}>
        <span style={LN_DR_LABEL}>อากาศวันนี้</span>
        <div style={{ display: "flex", gap: 10 }}>
          {[["weatherAm", "ช่วงเช้า"], ["weatherPm", "ช่วงบ่าย"]].map(([k, th]) => (
            <div key={k} style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{th}</div>
              <select value={form[k] || ""} disabled={locked} onChange={(e) => set({ [k]: e.target.value })}
                style={Object.assign({}, LN_DR_FIELD, { fontSize: 14 })}>
                <option value="">—</option>
                {window.DR_WEATHER.map((w) => <option key={w.key} value={w.key}>{w.th}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={LN_DR_LABEL}>วันนี้ทำอะไรไปบ้าง</span>
        <textarea rows={4} value={form.work || ""} disabled={locked} onChange={(e) => set({ work: e.target.value })}
          placeholder="เช่น ยกแผงขึ้นหลังคาแถวที่ 1-3 เสร็จ · เดินสาย DC ฝั่งตะวันออก"
          style={Object.assign({}, LN_DR_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
      </label>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={LN_DR_LABEL}>ความคืบหน้าเนื้องาน</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 19, fontWeight: 800, color: "var(--primary-dark)" }}>
            {form.mode === "project" ? window.drRollup(form.steps) : form.pct}%
          </span>
          {prev && <span style={{ fontSize: 11, color: "var(--text-3)" }}>เมื่อวาน {(+prev.pct || 0)}%</span>}
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
          {(form.steps || []).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px",
              borderBottom: "1px solid var(--border)", background: r.head && form.mode === "project" && !r.no.includes(".")
                ? "var(--surface2)" : "var(--surface)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", minWidth: 26 }}>{r.no}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--text-1)" }}>{r.th}</span>
              <input value={r.pct || ""} disabled={locked} inputMode="numeric" placeholder="0"
                onChange={(e) => setStep(i, e.target.value)}
                style={{ width: 58, padding: "7px 8px", borderRadius: 9, border: "1px solid var(--border-strong)",
                  background: "var(--surface2)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 13,
                  textAlign: "right", outline: "none" }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>%</span>
            </div>
          ))}
        </div>
      </div>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={LN_DR_LABEL}>ปัญหา / อุปสรรค</span>
        <textarea rows={2} value={form.problem || ""} disabled={locked} onChange={(e) => set({ problem: e.target.value })}
          placeholder="ไม่มีก็เว้นว่างไว้"
          style={Object.assign({}, LN_DR_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
      </label>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={LN_DR_LABEL}>แผนงานพรุ่งนี้</span>
        <textarea rows={2} value={form.nextDay || ""} disabled={locked} onChange={(e) => set({ nextDay: e.target.value })}
          style={Object.assign({}, LN_DR_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
      </label>

      <label style={{ display: "grid", gap: 5 }}>
        <span style={LN_DR_LABEL}>ทีมงานวันนี้</span>
        <input value={form.team || ""} disabled={locked} onChange={(e) => set({ team: e.target.value })}
          placeholder="เช่น ช่าง 3 คน · ผู้ช่วย 2 คน" style={LN_DR_FIELD} />
      </label>

      {/* ── รูปหน้างาน ── */}
      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={LN_DR_LABEL}>รูปหน้างาน</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: full ? "var(--tint-amber-tx)" : "var(--text-3)" }}>
            {photos.photos.length}/{LN_DR_MAX} รูป
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {photos.photos.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <img src={p.dataUrl} alt="" onClick={() => setZoom(p.dataUrl)}
                style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
              {!locked && (
                <button onClick={() => photos.remove(p.id)}
                  style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 99, border: "none",
                    background: "#EF4444", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    lineHeight: "24px", padding: 0 }}>×</button>
              )}
            </div>
          ))}
          {!locked && !full && (
            <label style={{ width: 84, height: 84, borderRadius: 10, border: "1px dashed var(--border-strong)",
              display: "grid", placeItems: "center", cursor: "pointer" }}>
              <Icon name="camera" size={22} color="var(--text-3)" />
              <input type="file" accept="image/*" capture="environment" multiple onChange={onPick} style={{ display: "none" }} />
            </label>
          )}
        </div>
        {full && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
          ครบ {LN_DR_MAX} รูปแล้ว — ลบรูปที่ไม่จำเป็นออกก่อนถึงจะถ่ายเพิ่มได้
          <br />จำกัดไว้เพื่อให้ใบนี้เปิดได้เร็วบนมือถือของทุกคนที่ต้องมาอ่าน
        </div>}
      </div>

      {msg && (
        <div style={{ padding: "11px 13px", borderRadius: 12, fontSize: 13, fontWeight: 700, textAlign: "center",
          background: "var(--primary-soft)", color: "var(--primary-dark)" }}>{msg}</div>
      )}

      {!locked && (
        <div style={{ display: "grid", gap: 9 }}>
          <button onClick={send} disabled={busy || !(form.work || "").trim()}
            style={{ width: "100%", padding: "16px 18px", borderRadius: 15, border: "none", fontFamily: "inherit",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              background: !busy && (form.work || "").trim() ? "var(--primary)" : "var(--surface3)",
              color: !busy && (form.work || "").trim() ? "#fff" : "var(--text-3)" }}>
            {busy ? "กำลังบันทึก…" : "เซ็นแล้วส่งให้อนุมัติ"}
          </button>
          <button onClick={saveDraft} disabled={busy}
            style={{ width: "100%", padding: "13px 18px", borderRadius: 13, border: "1px solid var(--border-strong)",
              background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 14,
              fontWeight: 700, cursor: "pointer" }}>
            เก็บเป็นร่างไว้ก่อน
          </button>
          {!(form.work || "").trim() && (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center" }}>
              ต้องกรอกช่อง “วันนี้ทำอะไรไปบ้าง” ก่อน — ใบที่ว่างเปล่าไม่มีประโยชน์กับใคร
            </div>
          )}
        </div>
      )}

      {locked && sigs.signs.by && sigs.signs.by.img && (
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12,
          border: "1px solid var(--border)", background: "var(--surface)" }}>
          <img src={sigs.signs.by.img} alt="" style={{ height: 34, maxWidth: 130, objectFit: "contain" }} />
          <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
            ผู้บันทึก {sigs.signs.by.name || ""}
            {/* ผ่าน drDateTH เสมอ — ค่าที่เก็บเป็น ค.ศ. คนอ่านใบต้องเห็น พ.ศ. เหมือนใบกระดาษ */}
            <br />{window.drDateTH(window.drSignDay(sigs.signs.by))} {window.drSignTime(sigs.signs.by)}
          </div>
        </div>
      )}

      {pad && (
        <window.DrSignPad title="ลายเซ็นผู้บันทึก"
          hint={"เซ็นแล้วระบบจะส่งใบนี้ให้" + (job.eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "อนุมัติทันที"}
          saved={mine.sign} onSave={onSign} onClose={() => setPad(null)}
          remember={remember} onRemember={setRemember} />
      )}

      {zoom && (
        <div onClick={() => setZoom(null)}
          style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,.92)", display: "grid",
            placeItems: "center", padding: 14, cursor: "zoom-out" }}>
          <img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

/* ── แท็บ "รายงาน" ──
   เลือกงานก่อนเสมอ — รายงานประจำวันผูกกับงาน ไม่ใช่ผูกกับคน
   (dailyReports/{jobId}/{date} คือคีย์จริงในฐานข้อมูล) */
function LnDailyTab({ me, role, jobs, notify }) {
  const [jobId, setJobId] = React.useState(() => ((jobs || [])[0] || {}).id || "");
  const [date, setDate] = React.useState(window.drToday());
  const store = window.useDailyReports(jobId || null);

  const job = (jobs || []).find((j) => j.id === jobId) || null;
  const day = window.drDayState(store.byDate, date);

  if (!window.can(role, "editJob")) {
    return <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
      บัญชีนี้ยังไม่ได้เปิดสิทธิ์เขียนรายงานประจำวัน
    </div>;
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "grid", gap: 9 }}>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={LN_DR_LABEL}>งาน</span>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={LN_DR_FIELD}>
            <option value="">— เลือกงาน —</option>
            {(jobs || []).slice(0, 80).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={LN_DR_LABEL}>วันที่</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || window.drToday())} style={LN_DR_FIELD} />
        </label>
      </div>

      {job && (
        <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>
            {window.drDocNo(job, date, store.dates)}
          </span>
          <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 800,
            background: day.color + "1A", color: day.color }}>{day.th}</span>
        </div>
      )}

      {!job
        ? <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
            เลือกงานก่อน แล้วฟอร์มรายงานของวันนั้นจะขึ้นมา
          </div>
        : <LnDailyForm me={me} role={role} job={job} date={date} store={store} notify={notify} />}

      <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
        การอนุมัติและการพิมพ์ใบ A4 ทำที่หน้าเว็บบนคอมพิวเตอร์
        <br />ใบที่ส่งจากที่นี่เป็นใบเดียวกับในระบบ ไม่ต้องกรอกซ้ำ
      </div>
    </div>
  );
}

Object.assign(window, { LnDailyTab, LnDailyForm, LN_DR_MAX });
