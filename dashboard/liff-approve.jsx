/* ============================================================
   flash+solar — แท็บ "อนุมัติ" ในแอป LINE · คำนำหน้า ln / Ln

   กล่องขาเข้าของคนอนุมัติ: รายงานประจำวัน · ใบเบิกเงิน · ใบขอ OT
   รวมสามเรื่องไว้ที่เดียวเพราะคนอนุมัติคือคนเดียวกัน และคำถามในหัวเขาคือ
   "มีอะไรรอฉันอยู่บ้าง" ไม่ใช่ "รายงานมีกี่ใบ เบิกเงินมีกี่ใบ"

   ⚠ ไม่มีตรรกะสิทธิ์หรือตรรกะสถานะชุดใหม่ในไฟล์นี้เลย —
     drCanApprove (daily.jsx) · ecApproveCheck/ecMove (expense.jsx) ·
     tmOtApproveCheck/tmOtMove (attend.jsx) คือชุดเดียวกับที่หน้าเดสก์ท็อปใช้
     ถ้าเขียนเงื่อนไขเองที่นี่ วันหนึ่งมือถือจะอนุมัติได้ในสิ่งที่เว็บห้าม แล้วไม่มีใครรู้

   ⚠ ทั้งสามโหนด (dailyReports · ecClaims · tmOt) ถูก subscribe พร้อมกันตอนเปิดแท็บนี้
     จึงตั้งใจไม่ให้แท็บนี้ขึ้นกับคนที่อนุมัติอะไรไม่ได้เลย — ช่างส่วนใหญ่ไม่ต้องแบกค่าเน็ตก้อนนี้
   ============================================================ */

const LN_AP_KIND = [
  { key: "daily", th: "รายงาน",  icon: "pen",    color: "#0EA5E9" },
  { key: "ec",    th: "เบิกเงิน", icon: "wallet", color: "#8B5CF6" },
  { key: "ot",    th: "โอที",     icon: "clock",  color: "#6366F1" },
];
const LN_AP_KIND_BY = {};
LN_AP_KIND.forEach((k) => { LN_AP_KIND_BY[k.key] = k; });

/* แท็บ "อนุมัติ" ควรขึ้นให้ใครบ้าง
   ⚠ รายงานประจำวันตัดที่ระดับตำแหน่งไม่ได้ เพราะสิทธิ์ผูกกับ job.eeId เป็นใบ ๆ ไป
     (ดู drCanApprove) — ถ้าเป็นวิศวกรของงานไหนอยู่ ก็ต้องเห็นแท็บนี้ */
function lnCanApproveAny(role, jobs, me) {
  if (window.ecCanApprove(role) || window.tmCanOtApprove(role)) return true;
  if (window.hasRole(role, "admin")) return true;
  const uid = (me || {}).id || "";
  return !!uid && (jobs || []).some((j) => j && j.eeId === uid);
}

const LN_AP_SHEET = {
  position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflowY: "auto", overflowX: "hidden",
};
const LN_AP_NOTE = {
  width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)",
  background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16,
  outline: "none", resize: "vertical", lineHeight: 1.6,
};

/* แถวข้อมูลในแผ่นรายละเอียด — ใช้ทรงเดียวกับแผ่นใบแจ้งซ่อม คนอ่านจะได้ไม่ต้องเรียนรู้ใหม่ */
function LnApRows({ rows }) {
  const use = (rows || []).filter((r) => r[1] != null && r[1] !== "");
  if (!use.length) return null;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
      {use.map((r, i) => (
        <div key={r[0]} style={{ display: "flex", gap: 10, padding: "10px 13px",
          borderTop: i ? "1px solid var(--border)" : "none", background: i % 2 ? "var(--surface2)" : "var(--surface)" }}>
          <div style={{ flex: "0 0 104px", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{r[0]}</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-1)", lineHeight: 1.6, wordBreak: "break-word" }}>{r[1]}</div>
        </div>
      ))}
    </div>
  );
}

/* หัวแผ่นรายละเอียด + ปุ่มปิด — เต็มจอ ไม่ใช่ลิ้นชักครึ่งจอ
   เพราะคนอนุมัติต้องอ่านเนื้องานและดูรูปก่อนตัดสิน ไม่ใช่กดผ่าน ๆ */
function LnApHead({ kind, no, title, sub, onClose }) {
  const k = LN_AP_KIND_BY[kind] || LN_AP_KIND[0];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "13px 16px", paddingTop: "calc(13px + env(safe-area-inset-top, 0px))", display: "flex", gap: 11, alignItems: "flex-start" }}>
      <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 99, display: "grid", placeItems: "center", background: k.color + "1F" }}>
        <Icon name={k.icon} size={16} color={k.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {no && <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{no}</div>}
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{title}</div>
        {sub && <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>{sub}</div>}
      </div>
      <button onClick={onClose}
        style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 99, border: "1px solid var(--border-strong)",
          background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 16, cursor: "pointer",
          lineHeight: "30px", padding: 0 }}>×</button>
    </div>
  );
}

/* ── ปุ่มตัดสิน ──
   "ตีกลับ/ไม่อนุมัติ" บังคับให้เขียนเหตุผลก่อนเสมอ ส่วน "อนุมัติ" ไม่ต้อง
   เพราะการปฏิเสธคือสิ่งที่คนถูกปฏิเสธต้องเอาไปทำอะไรต่อ ถ้าไม่บอกเหตุผล
   เขาจะส่งใบเดิมกลับมาใหม่แบบเดิม แล้วเสียเวลาทั้งสองฝ่ายอีกรอบ */
function LnApDecide({ okText, noText, hint, onOk, onNo, busy }) {
  const [noting, setNoting] = React.useState(false);
  const [note, setNote] = React.useState("");

  if (noting) {
    return (
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>ต้องแก้อะไร / ทำไมถึงไม่อนุมัติ</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
          placeholder="เช่น ยอดไม่ตรงบิล · ขอรูปหน้างานเพิ่ม · เวลาที่ขอไม่ตรงกับใบลงเวลา" style={LN_AP_NOTE} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setNoting(false); setNote(""); }}
            style={{ flex: 1, padding: "13px 14px", borderRadius: 11, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            ย้อนกลับ
          </button>
          <button onClick={() => onNo(note.trim())} disabled={!note.trim() || busy}
            style={{ flex: 2, padding: "13px 14px", borderRadius: 11, border: "none",
              background: note.trim() ? "#EF4444" : "var(--border-strong)", color: "#fff",
              fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: note.trim() ? "pointer" : "default" }}>
            {noText}
          </button>
        </div>
        {!note.trim() && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
          ต้องเขียนเหตุผลก่อน — คนที่ได้ใบคืนต้องรู้ว่าต้องแก้อะไร ไม่งั้นจะส่งกลับมาแบบเดิม
        </div>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setNoting(true)} disabled={busy}
          style={{ flex: 1, padding: "14px 14px", borderRadius: 12, border: "1px solid #EF4444",
            background: "var(--surface)", color: "#EF4444", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          {noText}
        </button>
        <button onClick={onOk} disabled={busy}
          style={{ flex: 2, padding: "14px 14px", borderRadius: 12, border: "none", background: "#10B981",
            color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
          {busy ? "กำลังบันทึก…" : okText}
        </button>
      </div>
      {hint && <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>{hint}</div>}
    </div>
  );
}

/* ══════════════ รายงานประจำวัน ══════════════ */

/* ⚠ อนุมัติรายงาน = เซ็นชื่อลงเอกสาร ไม่ใช่แค่เปลี่ยนสถานะ
   ใช้ช่องลายเซ็น "app" ช่องเดียวกับหน้าเดสก์ท็อป ใบที่อนุมัติจากมือถือจึงพิมพ์ A4 ออกมาครบเหมือนกัน
   ใครบันทึกลายเซ็นประจำตัวไว้แล้ว ระบบเซ็นให้เลย ไม่ต้องวาดใหม่ทุกใบ */
function LnApprDrSheet({ me, role, job, date, rec, notify, onClose }) {
  const store  = window.useDailyReports(job.id);
  const photos = window.useDailyPhotos(job.id, date);
  const sigs   = window.useDailySigns(job.id, date);
  const mine   = window.useDrMySign((me || {}).id || null);
  const [busy, setBusy] = React.useState(false);
  const [pad, setPad]   = React.useState(false);
  /* จำลายเซ็นไว้ให้โดยปริยาย — คนอนุมัติเซ็นวันละหลายใบ วาดใหม่ทุกใบคือเหตุผลที่คนเลิกใช้ */
  const [remember, setRemember] = React.useState(true);
  const [zoom, setZoom] = React.useState(null);
  const [msg, setMsg]   = React.useState("");

  /* อ่านใบสดจากฐาน ถ้ามี — ใบในรายการอาจถูกคนอื่นตัดสินไปแล้วระหว่างที่เปิดค้างไว้ */
  const cur = (store.byDate || {})[date] || rec;
  const done = cur.status !== "sent";

  const doApprove = (img) => {
    setBusy(true);
    if (img) sigs.sign("app", img, me);
    store.patch(date, { status: "approved", approvedAt: new Date().toISOString(),
      appId: (me || {}).id || null, appName: (me || {}).name || "" });
    setBusy(false);
    setMsg("อนุมัติแล้ว");
  };

  const approve = () => {
    if (sigs.signs.app && sigs.signs.app.img) return doApprove(null);
    if (mine.sign && mine.sign.img) return doApprove(mine.sign.img);
    setPad(true);
  };

  /* ตีกลับ = กลับไปเป็นร่างให้ช่างแก้แล้วส่งใหม่ ไม่ใช่สถานะ "ไม่อนุมัติ"
     รายงานประจำวันไม่มีสถานะปฏิเสธถาวรโดยตั้งใจ — งานวันนั้นเกิดขึ้นจริงไปแล้ว
     สิ่งที่ผิดคือใบ ไม่ใช่วัน เหตุผลเก็บไว้ที่ใบและยิงแจ้งเตือนหาคนเขียน */
  const back = (note) => {
    setBusy(true);
    store.patch(date, { status: "draft", approvedAt: null, appId: null, appName: null,
      backNote: note, backAt: new Date().toISOString(),
      backById: (me || {}).id || null, backByName: (me || {}).name || "" });
    if (notify && cur.byId && cur.byId !== ((me || {}).id || "")) {
      notify({ toUserId: cur.byId, type: "daily", event: "back", jobId: job.id, jobName: job.name,
        title: "รายงานประจำวันถูกตีกลับ ต้องแก้ไข",
        body: [job.code, window.drDateTH(date), note].filter(Boolean).join(" · ") });
    }
    setBusy(false);
    setMsg("ตีกลับให้แก้แล้ว");
  };

  const st = window.drStatusOf(cur.status);

  return (
    <div style={LN_AP_SHEET}>
      <LnApHead kind="daily" no={window.drDocNo(job, date, store.dates)}
        title={job.code + " · " + (job.name || "")} sub={window.drDateTH(date, true)} onClose={onClose} />

      <div style={{ padding: 16, display: "grid", gap: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: st.color + "1A", color: st.color,
            fontSize: 11, fontWeight: 800 }}>{st.th}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>ผู้บันทึก {cur.byName || "—"}</span>
        </div>

        {/* ชื่อช่องตรงกับฟอร์มที่ช่างกรอก (work · problem · nextDay · team ใน drBlank)
            ไม่ตั้งชื่อใหม่ ไม่งั้นคนอนุมัติกับคนเขียนจะพูดถึงคนละช่องกัน */}
        <LnApRows rows={[
          ["วันนี้ทำอะไร", cur.work],
          ["ความคืบหน้า", (cur.pct != null && cur.pct !== "" ? cur.pct + "%" : "")],
          ["ปัญหา/อุปสรรค", cur.problem],
          ["พรุ่งนี้จะทำ", cur.nextDay],
          ["ทีมหน้างาน", cur.team],
        ]} />

        {/* รูปหน้างานคือหลักฐานเดียวที่คนอนุมัติมี — ต้องเห็นก่อนเซ็น ไม่ใช่เซ็นแล้วค่อยดูที่ออฟฟิศ */}
        {photos.photos.length > 0 && (
          <div style={{ display: "grid", gap: 9 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>รูปหน้างาน {photos.photos.length} รูป</span>
            {photos.photos.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <img src={p.dataUrl} alt="" onClick={() => setZoom(p.dataUrl)}
                  style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.6,
                  color: p.cap ? "var(--text-1)" : "var(--text-3)" }}>
                  {p.cap || "ไม่ได้เขียนคำอธิบายไว้"}
                </div>
              </div>
            ))}
          </div>
        )}

        {sigs.signs.by && sigs.signs.by.img && (
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12,
            border: "1px solid var(--border)", background: "var(--surface)" }}>
            <img src={sigs.signs.by.img} alt="" style={{ height: 34, maxWidth: 130, objectFit: "contain" }} />
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
              ผู้บันทึก {sigs.signs.by.name || ""}
              <br />{window.drDateTH(window.drSignDay(sigs.signs.by))} {window.drSignTime(sigs.signs.by)}
            </div>
          </div>
        )}

        {msg
          ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--primary-soft)",
              color: "var(--primary-dark)", fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>{msg}</div>
          : done
            ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--surface2)",
                color: "var(--text-3)", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
                ใบนี้ไม่ได้อยู่ระหว่างรออนุมัติแล้ว — อาจมีคนอื่นตัดสินไปก่อน
              </div>
            : <LnApDecide okText="เซ็นอนุมัติใบนี้" noText="ตีกลับให้แก้" busy={busy}
                hint={mine.sign && mine.sign.img ? "ระบบจะเซ็นด้วยลายเซ็นที่คุณบันทึกไว้" : "กดแล้วจะให้เซ็นก่อนหนึ่งครั้ง"}
                onOk={approve} onNo={back} />}

        <button onClick={onClose}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
            fontWeight: 700, cursor: "pointer", marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
          {msg ? "กลับไปรายการ" : "ปิด"}
        </button>
      </div>

      {pad && window.DrSignPad && (
        <window.DrSignPad title="ลายเซ็นผู้อนุมัติ" hint="เซ็นแล้วระบบจะอนุมัติและล็อกใบนี้ทันที"
          saved={mine.sign} onClose={() => setPad(false)}
          remember={remember} onRemember={setRemember}
          onSave={(img) => { if (remember) mine.save(img); setPad(false); doApprove(img); }} />
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

/* ══════════════ ใบเบิกเงิน ══════════════ */

/* บิลที่เป็นไฟล์ PDF — แปลงเป็น Blob URL แล้วให้กดเปิดเอง
   ไม่เรียก window.open ให้ เพราะ WebView ของแอป LINE บล็อกการเปิดหน้าต่างด้วยสคริปต์บ่อย
   แต่ปล่อยให้กดลิงก์ผ่าน (เหตุผลเดียวกับ LnJobFiles ในไฟล์ liff-app) */
function LnApPdf({ shot }) {
  const url = React.useMemo(() => {
    try { return window.dataUrlToBlobUrl(shot.dataUrl); } catch (e) { return shot.dataUrl; }
  }, [shot.dataUrl]);
  return (
    <a href={url} target="_blank" rel="noopener"
      style={{ width: 96, height: 96, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)",
        display: "grid", placeItems: "center", gap: 4, textDecoration: "none", color: "var(--text-2)",
        fontSize: 10.5, fontWeight: 700, textAlign: "center", padding: 6 }}>
      <Icon name="file" size={20} color="var(--text-3)" />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
        {shot.name || "บิล PDF"}
      </span>
    </a>
  );
}

function LnApprEcSheet({ me, role, claim, store, onClose }) {
  const rec = window.useEcReceipts(claim.id);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);
  const [msg, setMsg]   = React.useState("");

  const cur = (store.claims || []).find((c) => c.id === claim.id) || claim;
  const done = cur.status !== "sent";
  const chk = window.ecApproveCheck(cur, me, role);

  const move = (to, note) => {
    setBusy(true);
    const next = window.ecMove(cur, to, me, note || "");
    store.save(next);
    if (cur.byId && cur.byId !== ((me || {}).id || "")) {
      window.ecNotify({ toUserId: cur.byId, title: (to === "approved" ? "ใบเบิกได้รับอนุมัติ · " : "ใบเบิกไม่อนุมัติ · ") + (cur.no || ""),
        body: [window.ecBaht(cur.amount) + " บาท", note || ""].filter(Boolean).join(" · ") });
    }
    setBusy(false);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };

  const st = window.ecStatusOf(cur.status);

  return (
    <div style={LN_AP_SHEET}>
      <LnApHead kind="ec" no={cur.no} title={window.ecKindOf(cur.kind).th + " · " + window.ecBaht(cur.amount) + " บาท"}
        sub={(cur.byName || "") + " · " + window.drDateTH(cur.date)} onClose={onClose} />

      <div style={{ padding: 16, display: "grid", gap: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: st.color + "1A", color: st.color,
            fontSize: 11, fontWeight: 800 }}>{st.th}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{window.ecPayOf(cur.payMethod).th}</span>
        </div>

        <LnApRows rows={[
          ["งาน/ไซต์", [cur.siteCode, cur.siteName].filter(Boolean).join(" · ")],
          ["เหตุผล", cur.note],
          ["ส่งถึง", cur.approverName],
        ]} />

        {/* รายการย่อยในใบ — ยอดรวมอย่างเดียวไม่พอสำหรับตัดสิน ต้องเห็นว่าไปกับอะไรบ้าง */}
        {(cur.items || []).length > 0 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {(cur.items || []).map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 13px",
                borderTop: i ? "1px solid var(--border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-1)", wordBreak: "break-word" }}>
                  {it.name || "—"}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                  {window.ecBaht(it.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ⚠ บิลคือสิ่งที่ทำให้การอนุมัติจากมือถือต่างจากการกดผ่าน ๆ — ต้องอยู่ในจอเดียวกับปุ่ม */}
        <div style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>
            บิลแนบ {rec.shots.length} ใบ
          </span>
          {rec.shots.length === 0
            ? <div style={{ padding: "11px 13px", borderRadius: 11, background: "var(--tint-amber-bg)",
                color: "var(--tint-amber-tx)", fontSize: 12, lineHeight: 1.6 }}>
                ไม่มีบิลแนบมาด้วย — อนุมัติได้ แต่จะไม่มีเอกสารยืนยันยอดนี้ตอนปิดบัญชี
              </div>
            : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* บิลแนบเป็น PDF ได้ด้วย (ecReceiptKind) — ยัดใส่ <img> จะได้กรอบว่าง
                    ที่อ่านเหมือนบิลหาย ทั้งที่ไฟล์อยู่ครบ จึงทำเป็นลิงก์ให้กดเปิดแทน */}
                {rec.shots.map((sh, i) => (window.ecReceiptKind(sh) === "pdf"
                  ? <LnApPdf key={i} shot={sh} />
                  : <img key={i} src={sh.dataUrl} alt="" onClick={() => setZoom(sh.dataUrl)}
                      style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
                ))}
              </div>}
        </div>

        {msg
          ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--primary-soft)",
              color: "var(--primary-dark)", fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>{msg}</div>
          : done
            ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--surface2)",
                color: "var(--text-3)", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
                ใบนี้ไม่ได้อยู่ระหว่างรออนุมัติแล้ว — อาจมีคนอื่นตัดสินไปก่อน
              </div>
            : !chk.ok
              ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--tint-amber-bg)",
                  color: "var(--tint-amber-tx)", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>{chk.why}</div>
              : <LnApDecide okText="อนุมัติใบนี้" noText="ไม่อนุมัติ" busy={busy}
                  onOk={() => move("approved", "")} onNo={(note) => move("rejected", note)} />}

        <button onClick={onClose}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
            fontWeight: 700, cursor: "pointer", marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
          {msg ? "กลับไปรายการ" : "ปิด"}
        </button>
      </div>

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

/* ══════════════ ใบขอ OT ══════════════ */

function LnApprOtSheet({ me, role, rec, store, onClose }) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const cur = (store.rows || []).find((r) => r.id === rec.id) || rec;
  const done = cur.status !== "sent";
  const chk = window.tmOtApproveCheck(cur, me, role);

  const move = (to, note) => {
    setBusy(true);
    const next = window.tmOtMove(cur, to, me, note || "");
    store.save(next);
    if (cur.userId && cur.userId !== ((me || {}).id || "")) {
      window.tmNotify({ toUserId: cur.userId,
        title: (to === "approved" ? "ใบขอ OT ได้รับอนุมัติ · " : to === "rejected" ? "ใบขอ OT ไม่อนุมัติ · " : "ใบขอ OT ถูกตีกลับ · ") + (cur.no || ""),
        body: [window.drDateTH(cur.date), window.tmDur(cur.mins), note || ""].filter(Boolean).join(" · ") });
    }
    setBusy(false);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };

  const st = window.tmOtStatusOf(cur.status);
  const kind = window.tmOtKindOf(cur.kind) || {};

  return (
    <div style={LN_AP_SHEET}>
      <LnApHead kind="ot" no={cur.no} title={(cur.userName || "") + " · " + window.tmDur(cur.mins)}
        sub={window.drDateTH(cur.date, true)} onClose={onClose} />

      <div style={{ padding: 16, display: "grid", gap: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: st.color + "1A", color: st.color,
            fontSize: 11, fontWeight: 800 }}>{st.th}</span>
          {kind.th && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{kind.th}</span>}
        </div>

        <LnApRows rows={[
          ["ช่วงเวลา", (cur.from || "") + " – " + (cur.to || "")],
          ["รวม", window.tmDur(cur.mins)],
          ["งาน", [cur.jobCode, cur.jobName].filter(Boolean).join(" · ")],
          ["เหตุผล", cur.reason],
          ["ส่งถึง", cur.approverName],
        ]} />

        {/* ⚠ ตัวเลขในใบนี้คือสิ่งที่คนขอพิมพ์เอง ไม่ใช่เวลาที่ระบบจับได้
            เทียบกับใบลงเวลาของวันนั้นก่อนอนุมัติ — เขียนกำกับไว้ ไม่ใช่ให้เดาเอง */}
        <div style={{ padding: "11px 13px", borderRadius: 11, background: "var(--surface2)",
          color: "var(--text-3)", fontSize: 11.5, lineHeight: 1.7 }}>
          เวลาในใบนี้เป็นสิ่งที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้
          <br />ถ้าไม่แน่ใจ เทียบกับแผ่นลงเวลาของวันนั้นบนเว็บก่อนอนุมัติ
        </div>

        {msg
          ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--primary-soft)",
              color: "var(--primary-dark)", fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>{msg}</div>
          : done
            ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--surface2)",
                color: "var(--text-3)", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>
                ใบนี้ไม่ได้อยู่ระหว่างรออนุมัติแล้ว — อาจมีคนอื่นตัดสินไปก่อน
              </div>
            : !chk.ok
              ? <div style={{ padding: "13px 15px", borderRadius: 12, background: "var(--tint-amber-bg)",
                  color: "var(--tint-amber-tx)", fontSize: 12.5, textAlign: "center", lineHeight: 1.6 }}>{chk.why}</div>
              : <LnApDecide okText="อนุมัติใบนี้" noText="ไม่อนุมัติ" busy={busy}
                  onOk={() => move("approved", "")} onNo={(note) => move("rejected", note)} />}

        <button onClick={onClose}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
            fontWeight: 700, cursor: "pointer", marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
          {msg ? "กลับไปรายการ" : "ปิด"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════ แท็บอนุมัติ ══════════════ */

function LnApproveTab({ me, role, jobs, notify }) {
  const drAll = window.useDailyAll();
  const ecStore = window.useEcClaims();
  const otStore = window.useOtClaims();
  const [kind, setKind] = React.useState("daily");
  const [open, setOpen] = React.useState(null);

  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; });
    return m;
  }, [jobs]);

  /* ใบรายงานที่รอ "คนนี้" อนุมัติ — เดินทีละใบเพราะสิทธิ์ผูกกับวิศวกรของงานนั้น ๆ
     งานที่ไม่อยู่ในขอบเขตที่เห็นได้ ไม่ต้องนับ เพราะกดเข้าไปก็เปิดใบไม่ได้อยู่ดี */
  const drList = React.useMemo(() => {
    const out = [];
    Object.keys(drAll.all || {}).forEach((jid) => {
      const job = jobById[jid];
      if (!job) return;
      const byDate = drAll.all[jid] || {};
      Object.keys(byDate).forEach((d) => {
        const r = byDate[d];
        if (!r || r.status !== "sent") return;
        if (!window.drCanApprove(role, job, me, r)) return;
        out.push({ job: job, date: d, rec: r });
      });
    });
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [drAll.all, jobById, role, me]);

  const ecList = React.useMemo(() => (ecStore.claims || []).filter((c) =>
    c && c.status === "sent" && window.ecApproveCheck(c, me, role).ok), [ecStore.claims, me, role]);

  const otList = React.useMemo(() => (otStore.rows || []).filter((r) =>
    r && r.status === "sent" && window.tmOtApproveCheck(r, me, role).ok), [otStore.rows, me, role]);

  const n = { daily: drList.length, ec: ecList.length, ot: otList.length };
  const chips = LN_AP_KIND.map((k) => ({ key: k.key, th: k.th + (n[k.key] ? " " + n[k.key] : "") }));
  const loading = drAll.loading || ecStore.loading || otStore.loading;

  /* เปิดมาให้ตรงกับหมวดที่มีของรออยู่จริง — หมวดว่างเปล่าเป็นหน้าแรกทุกครั้ง
     ทำให้คนเข้าใจว่า "ไม่มีอะไรรอ" ทั้งที่อีกสองหมวดมีใบค้าง
     ทำครั้งเดียวตอนโหลดเสร็จ ไม่งั้นมันจะดีดหมวดหนีตอนเพิ่งอนุมัติใบสุดท้ายไป */
  const jumped = React.useRef(false);
  React.useEffect(() => {
    if (jumped.current || loading) return;
    jumped.current = true;
    const first = LN_AP_KIND.filter((k) => n[k.key] > 0)[0];
    if (first) setKind(first.key);
  }, [loading, n.daily, n.ec, n.ot]);

  const row = (key, title, sub, right, onClick) => {
    const k = LN_AP_KIND_BY[kind];
    return (
      <div key={key} onClick={onClick}
        style={{ display: "flex", gap: 11, alignItems: "center", padding: "13px 16px", cursor: "pointer",
          background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 99, display: "grid",
          placeItems: "center", background: k.color + "1F" }}>
          <Icon name={k.icon} size={16} color={k.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{title}</div>
          <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>{sub}</div>
        </div>
        {right && <div style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{right}</div>}
      </div>
    );
  };

  return (
    <React.Fragment>
      <div style={{ padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <window.LnPick items={chips} value={kind} onPick={setKind} />
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)" }}>
          เฉพาะใบที่รอคุณตัดสิน · รวม {n.daily + n.ec + n.ot} ใบ
        </div>
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>กำลังโหลด…</div>
        : kind === "daily"
          ? (drList.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5, lineHeight: 1.7 }}>
                  ไม่มีรายงานรออนุมัติ
                  <br /><span style={{ fontSize: 12 }}>ใบจะมาที่นี่เมื่อช่างกดส่งในงานที่คุณเป็นวิศวกรผู้รับผิดชอบ</span>
                </div>
              : drList.map((x) => row(x.job.id + "/" + x.date,
                  x.job.code + " · " + (x.job.name || ""),
                  window.drDateTH(x.date) + " · โดย " + (x.rec.byName || "—"),
                  x.rec.pct != null ? x.rec.pct + "%" : "",
                  () => setOpen({ kind: "daily", job: x.job, date: x.date, rec: x.rec }))))
          : kind === "ec"
            ? (ecList.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ไม่มีใบเบิกรออนุมัติ</div>
                : ecList.map((c) => row(c.id,
                    window.ecKindOf(c.kind).th + " · " + (c.byName || ""),
                    window.drShort(c.date) + (c.siteCode ? " · " + c.siteCode : "")
                      + (c.receiptCount ? " · บิล " + c.receiptCount + " ใบ" : " · ไม่มีบิล"),
                    window.ecBaht(c.amount),
                    () => setOpen({ kind: "ec", claim: c }))))
            : (otList.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ไม่มีใบขอ OT รออนุมัติ</div>
                : otList.map((r) => row(r.id,
                    (r.userName || "") + " · " + window.tmDur(r.mins),
                    window.drShort(r.date) + " · " + (r.from || "") + "–" + (r.to || "") + (r.reason ? " · " + r.reason : ""),
                    "",
                    () => setOpen({ kind: "ot", rec: r }))))}

      {open && open.kind === "daily" && (
        <LnApprDrSheet me={me} role={role} job={open.job} date={open.date} rec={open.rec}
          notify={notify} onClose={() => setOpen(null)} />
      )}
      {open && open.kind === "ec" && (
        <LnApprEcSheet me={me} role={role} claim={open.claim} store={ecStore} onClose={() => setOpen(null)} />
      )}
      {open && open.kind === "ot" && (
        <LnApprOtSheet me={me} role={role} rec={open.rec} store={otStore} onClose={() => setOpen(null)} />
      )}
    </React.Fragment>
  );
}

Object.assign(window, {
  LN_AP_KIND, LN_AP_KIND_BY, lnCanApproveAny,
  LnApproveTab, LnApprDrSheet, LnApprEcSheet, LnApprOtSheet, LnApDecide, LnApRows, LnApHead, LnApPdf,
});
