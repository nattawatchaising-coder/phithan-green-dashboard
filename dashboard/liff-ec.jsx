/* ============================================================
   flash+solar — เบิกเงินจากแอป LINE (เฟส 3) · คำนำหน้า ln / Ln

   ⚠ ไฟล์นี้ **ไม่มีตรรกะเบิกเงินของตัวเองเลยสักบรรทัด**
      ใช้ ecBlank · ecSum · ecMove · ecNext · ecDocNo · useEcClaims · useEcReceipts
      จาก expense.jsx ตรง ๆ ที่นี่มีแค่ "หน้าตาแบบมือถือ"

      ถ้าวันหนึ่งต้องก๊อปกฎจาก expense.jsx มาแก้ที่นี่ แปลว่าสมมติฐานของเฟสนี้ล้ม
      ให้ไปแก้ที่ expense.jsx ที่เดียวแล้วให้ทั้งสองหน้าจอใช้ร่วมกันเหมือนเดิม
      เหตุผล: ใบเบิกเป็นเอกสารการเงิน — กฎสองชุดที่ค่อย ๆ เพี้ยนจากกันคือตัวเลขที่เชื่อไม่ได้

   รูปบิลถ่ายด้วยโปรไฟล์มือถือ 1100/0.70 (เดสก์ท็อปใช้ 1400/0.78)
   รูปละ ~120-200 KB · เก็บเป็น base64 ใน RTDB · ช่างจ่ายค่าเน็ต 4G เอง
   ============================================================ */

const LN_EC_FIELD = { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)",
  background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none" };

/* ── ชิปเลือกหนึ่งอย่าง ── ปุ่มใหญ่กดง่ายกว่า select ตอนมือเปื้อนอยู่หน้างาน */
function LnChips({ list, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {list.map((k) => {
        const on = value === k.key;
        return (
          <button key={k.key} onClick={() => onChange(k.key)}
            style={{ padding: "9px 13px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 700, border: "1px solid " + (on ? k.color : "var(--border-strong)"),
              background: on ? k.color + "1A" : "var(--surface2)", color: on ? k.color : "var(--text-2)" }}>
            {k.th}
          </button>
        );
      })}
    </div>
  );
}

/* ── ฟอร์มใบเบิกบนมือถือ ──
   ตัดจากฟอร์มเดสก์ท็อปเหลือเท่าที่ช่างกรอกได้จริงขณะยืนอยู่หน้าร้าน
   ช่อง จำนวน/หน่วย/ราคาต่อหน่วย ไม่มีในนี้ — ecSum ใช้ช่อง amount ตรง ๆ อยู่แล้ว
   และบิลจริงที่แนบมาคือหลักฐาน ไม่ใช่ตารางที่พิมพ์ซ้ำจากบิล */
function LnEcForm({ me, users, role, jobs, store, claim, onClose }) {
  const [c, setC] = React.useState(claim);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);
  const rec = useEcReceiptsSafe(c.id);

  const locked = c.status !== "draft";
  const total = window.ecSum(c.items);
  const set = (fields) => setC((p) => Object.assign({}, p, fields));

  const rows = c.items && c.items.length ? c.items : [{ name: "", amount: "" }];
  const setRow = (i, k, v) => set({ items: rows.map((r, x) => (x === i ? Object.assign({}, r, { [k]: v }) : r)) });
  const addRow = () => set({ items: rows.concat([{ name: "", amount: "" }]) });
  const delRow = (i) => set({ items: rows.filter((_, x) => x !== i) });

  /* บันทึกก่อนแนบบิลเสมอ — รูปเก็บที่ ecReceipts/{id} ซึ่งเป็นคนละโหนดกับตัวใบ
     ถ้ายังไม่ได้บันทึกใบแล้วผู้ใช้ปิดหน้าไป รูปจะค้างอยู่โดยไม่มีใบไหนอ้างถึง */
  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    store.save(c);
    for (const f of files) {
      try {
        rec.add(await window.resizeImageFile(f, 1100, 0.70), me, { kind: "img", name: f.name, size: f.size });
      } catch (err) { /* รูปเดียวพังไม่ควรทำให้รูปที่เหลือหายไปด้วย */ }
    }
    setBusy(false);
  };

  const saveDraft = () => { store.save(c); onClose(); };

  const send = () => {
    if (busy) return;
    setBusy(true);
    const next = window.ecMove(Object.assign({}, c, { amount: total }), "sent", me, "");
    store.save(next);
    /* ข้อความเดียวกับที่หน้าเดสก์ท็อปส่ง — คนอนุมัติจะได้เห็นรูปแบบเดียวเสมอ
       ไม่ได้ตั้งผู้อนุมัติไว้ = เข้ากองกลาง ไม่ปล่อยใบค้างรอคนที่ไม่มีอยู่จริง */
    const money = window.ecBaht(next.amount) + " บาท";
    const where = next.siteCode ? " · " + next.siteCode : "";
    window.ecNotify(next.approverId
      ? { toUserId: next.approverId, title: "ใบเบิกเงินรออนุมัติ · " + next.no,
          body: (next.byName || "") + " · " + money + where }
      : { toPerm: "expenseApprove", title: "ใบเบิกเงินรออนุมัติ · " + next.no,
          body: (next.byName || "") + " · " + money + where });
    onClose();
  };

  const noBill = rec.shots.length === 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflowY: "auto", overflowX: "hidden" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        paddingTop: "calc(13px + env(safe-area-inset-top, 0px))" }}>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}>
          <Icon name="x" size={20} color="var(--text-2)" />
        </button>
        <b style={{ fontSize: 15.5, color: "var(--text-1)" }}>{locked ? "ใบเบิกเงิน" : "เบิกเงิน"}</b>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>{c.no}</span>
      </div>

      <div style={{ padding: 18, display: "grid", gap: 14 }}>
        {locked && (
          <div style={{ padding: "11px 13px", borderRadius: 12, fontSize: 12.5, fontWeight: 700, textAlign: "center",
            background: window.ecStatusOf(c.status).color + "1A", color: window.ecStatusOf(c.status).color }}>
            {window.ecStatusOf(c.status).th} — แก้ไขจากมือถือไม่ได้แล้ว
          </div>
        )}

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>จ่ายค่าอะไร</span>
          {locked ? <b style={{ fontSize: 14, color: window.ecKindOf(c.kind).color }}>{window.ecKindOf(c.kind).th}</b>
            : <LnChips list={window.EC_KIND} value={c.kind} onChange={(v) => set({ kind: v })} />}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ใครออกเงินไปก่อน</span>
          {locked ? <b style={{ fontSize: 14, color: window.ecPayOf(c.payMethod).color }}>{window.ecPayOf(c.payMethod).th}</b>
            : <LnChips list={window.EC_PAY} value={c.payMethod}
                onChange={(v) => set({ payMethod: v, owedToId: null, owedToName: "" })} />}
          {c.payMethod === "mate" && (locked
            ? <b style={{ fontSize: 13.5, color: "var(--text-1)" }}>{c.owedToName || "ยังไม่ได้ระบุคน"}</b>
            : <select value={c.owedToId || ""}
                onChange={(e) => {
                  const u = (users || []).filter((x) => x.id === e.target.value)[0];
                  set({ owedToId: u ? u.id : null, owedToName: u ? (u.name || u.username || "") : "" });
                }}
                style={LN_EC_FIELD}>
                <option value="">— เลือกคนที่ออกเงินให้ —</option>
                {(users || []).filter((u) => u.active !== false && u.id !== c.byId)
                  .map((u) => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
              </select>)}
          {!locked && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {c.payMethod === "mate" && !c.owedToId
              ? "ยังไม่ได้เลือกคน — ถ้าปล่อยไว้ เงินคืนจะเข้าชื่อคนเปิดใบ"
              : window.ecPayOf(c.payMethod).hint}
          </div>}
        </div>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>วันที่จ่ายเงิน</span>
          <input type="date" value={c.date} disabled={locked} onChange={(e) => set({ date: e.target.value })} style={LN_EC_FIELD} />
        </label>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>งานที่เกี่ยวข้อง (ไม่บังคับ)</span>
          <select value={c.jobId || ""} disabled={locked} style={LN_EC_FIELD}
            onChange={(e) => {
              const j = (jobs || []).find((x) => x.id === e.target.value);
              /* ถ่ายสำเนารหัส/ชื่อไซต์ไว้ในใบ เพราะเป็นเอกสารการเงิน ต้องอ่านรู้เรื่องแม้ใบงานถูกลบ */
              set({ jobId: j ? j.id : null, siteCode: j ? j.code : "", siteName: j ? j.name : "" });
            }}>
            <option value="">— ไม่ระบุ —</option>
            {(jobs || []).slice(0, 80).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
        </label>

        <div style={{ display: "grid", gap: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>รายการที่จ่าย</span>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 7 }}>
              <input value={r.name || ""} disabled={locked} placeholder="เช่น สายไฟ 2.5 sq.mm."
                onChange={(e) => setRow(i, "name", e.target.value)}
                style={Object.assign({}, LN_EC_FIELD, { flex: 1 })} />
              <input value={r.amount || ""} disabled={locked} inputMode="decimal" placeholder="0.00"
                onChange={(e) => setRow(i, "amount", e.target.value)}
                style={Object.assign({}, LN_EC_FIELD, { width: 104, fontFamily: "var(--mono)", textAlign: "right" })} />
              {!locked && rows.length > 1 && (
                <button onClick={() => delRow(i)} style={{ border: "none", background: "none", cursor: "pointer", padding: "0 2px" }}>
                  <Icon name="trash" size={17} color="var(--text-3)" />
                </button>
              )}
            </div>
          ))}
          {!locked && (
            <button onClick={addRow}
              style={{ padding: "10px 13px", borderRadius: 11, border: "1px dashed var(--border-strong)", background: "none",
                color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + เพิ่มรายการ
            </button>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingTop: 3 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>รวม</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>{window.ecBaht(total)}</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>บาท</span>
          </div>
        </div>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>หมายเหตุ</span>
          <textarea rows={2} value={c.note || ""} disabled={locked}
            placeholder="เช่น ซื้อที่ร้านใกล้ไซต์เพราะของในคลังหมด"
            onChange={(e) => set({ note: e.target.value })}
            style={Object.assign({}, LN_EC_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
        </label>

        {/* ── บิล ── capture="environment" เปิดกล้องหลังให้เลย ไม่ต้องผ่านหน้าเลือกไฟล์ */}
        <div style={{ display: "grid", gap: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>บิล / ใบเสร็จ</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {rec.shots.map((s) => (
              <div key={s.id} style={{ position: "relative" }}>
                {/* เปิดดูในหน้าเดียวกัน ไม่ใช่ window.open — WebView ของ LINE บล็อกแท็บใหม่ที่เป็น data: URL
                    ถ้าใช้ window.open ปุ่มจะกดแล้วเงียบ โดยไม่มี error ให้เห็น */}
                <img src={s.dataUrl} alt="" onClick={() => setZoom(s.dataUrl)}
                  style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
                {!locked && (
                  <button onClick={() => rec.remove(s.id)}
                    style={{ position: "absolute", top: -6, right: -6, width: 24, height: 24, borderRadius: 99, border: "none",
                      background: "#EF4444", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", lineHeight: "24px", padding: 0 }}>×</button>
                )}
              </div>
            ))}
            {!locked && (
              <label style={{ width: 84, height: 84, borderRadius: 10, border: "1px dashed var(--border-strong)",
                display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text-3)" }}>
                <Icon name="camera" size={22} color="var(--text-3)" />
                <input type="file" accept="image/*" capture="environment" multiple onChange={onPick} style={{ display: "none" }} />
              </label>
            )}
          </div>
          {noBill && <div style={{ fontSize: 11.5, color: "var(--tint-amber-tx)", lineHeight: 1.6 }}>
            ยังไม่มีบิลแนบ — ส่งได้ แต่คนอนุมัติมักตีกลับมาขอบิล ถ่ายตอนนี้เร็วกว่ามาตามทีหลัง
          </div>}
        </div>

        {!locked && (
          <div style={{ display: "grid", gap: 9, paddingTop: 3 }}>
            <button onClick={send} disabled={busy || total <= 0}
              style={{ width: "100%", padding: "16px 18px", borderRadius: 15, border: "none", fontFamily: "inherit",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                background: !busy && total > 0 ? "var(--primary)" : "var(--surface3)",
                color: !busy && total > 0 ? "#fff" : "var(--text-3)" }}>
              {busy ? "กำลังบันทึก…" : "ส่งขออนุมัติ"}
            </button>
            <button onClick={saveDraft} disabled={busy}
              style={{ width: "100%", padding: "13px 18px", borderRadius: 13, border: "1px solid var(--border-strong)",
                background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 14,
                fontWeight: 700, cursor: "pointer" }}>
              เก็บเป็นร่างไว้ก่อน
            </button>
            {total <= 0 && <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center" }}>
              ต้องมีรายการที่มียอดเงินอย่างน้อยหนึ่งรายการ
            </div>}
          </div>
        )}

        {locked && (c.hist || []).length > 0 && (
          <div style={{ display: "grid", gap: 5, paddingTop: 3 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ประวัติใบนี้</span>
            {(c.hist || []).slice().reverse().slice(0, 6).map((h, i) => (
              <div key={i} style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                {window.drShort(String(h.at || "").slice(0, 10))} · {window.ecStatusOf(h.to).th}
                {h.byName ? " โดย " + h.byName : ""}{h.note ? " — " + h.note : ""}
              </div>
            ))}
          </div>
        )}
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

/* useEcReceipts เรียกได้เฉพาะตอนมี id — ตัวห่อนี้ทำให้เรียกเป็น hook ระดับบนสุดได้เสมอ
   (กฎของ React: จำนวน hook ที่เรียกต้องเท่ากันทุกครั้งที่ render) */
function useEcReceiptsSafe(id) { return window.useEcReceipts(id || null); }

/* ── แท็บ "เบิกเงิน" ── */
function LnEcTab({ me, users, role, jobs }) {
  const store = window.useEcClaims();
  const [open, setOpen] = React.useState(null);

  /* เห็นเฉพาะใบของตัวเองในแท็บนี้เสมอ แม้คนนั้นจะมีสิทธิ์อนุมัติ
     ใบที่รอให้ตัวเองตัดสินอยู่คนละแท็บ ("อนุมัติ") โดยตั้งใจ —
     "ใบของฉัน" กับ "ใบที่รอฉัน" เป็นคนละคำถาม ปนกันแล้วจะกดอนุมัติใบตัวเองพลาด
     (ecApproveCheck กันไว้อยู่แล้ว แต่รายการที่อ่านผิดก็ยังทำให้เสียเวลาอยู่ดี) */
  const mine = React.useMemo(
    () => (store.claims || []).filter((c) => c && c.byId === (me || {}).id),
    [store.claims, me]);

  const owed = (store.claims || []).reduce((s, c) =>
    s + (c && c.status === "approved" && window.ecPayOf(c.payMethod).owed
      && window.ecOwedTo(c).id === (me || {}).id ? window.ecRound(c.amount) : 0), 0);

  if (!window.ecCanUse(role)) {
    return <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
      บัญชีนี้ยังไม่ได้เปิดสิทธิ์เบิกเงิน
    </div>;
  }

  return (
    <div style={{ padding: 18 }}>
      {owed > 0 && (
        <div style={{ padding: "13px 15px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)",
          display: "flex", alignItems: "baseline", gap: 8, marginBottom: 13 }}>
          <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>บริษัทติดเงินคุณอยู่</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: "#EF4444" }}>
            {window.ecBaht(owed)}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>บาท</span>
        </div>
      )}

      <button onClick={() => setOpen(window.ecBlank(null, me, store.claims, users))}
        style={{ width: "100%", padding: "15px 18px", borderRadius: 14, border: "none", background: "var(--primary)",
          color: "#fff", fontFamily: "inherit", fontSize: 15.5, fontWeight: 800, cursor: "pointer" }}>
        + เปิดใบเบิกใหม่
      </button>

      <div style={{ marginTop: 16, fontSize: 12.5, fontWeight: 800, color: "var(--text-1)", marginBottom: 7 }}>ใบเบิกของฉัน</div>
      <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
        {mine.length === 0
          ? <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ยังไม่มีใบเบิก</div>
          : mine.slice(0, 25).map((c) => {
              const st = window.ecStatusOf(c.status);
              return (
                <button key={c.id} onClick={() => setOpen(c)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 13px", border: "none",
                    borderBottom: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{window.ecKindOf(c.kind).th}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 99, background: st.color + "1A", color: st.color,
                      fontSize: 10.5, fontWeight: 800 }}>{st.th}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
                      {window.ecBaht(c.amount)}
                    </span>
                  </div>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>
                    {window.drShort(c.date)}{c.siteCode ? " · " + c.siteCode : ""}
                    {c.receiptCount ? " · บิล " + c.receiptCount + " ใบ" : " · ไม่มีบิลแนบ"}
                  </div>
                </button>
              );
            })}
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
        คนอนุมัติกดอนุมัติได้จากแท็บ “อนุมัติ” · การจ่ายเงินคืนทำที่หน้าเว็บ
        <br />ใบที่ส่งจากที่นี่เป็นใบเดียวกับในระบบ ไม่ต้องกรอกซ้ำ
      </div>

      {open && <LnEcForm me={me} users={users} role={role} jobs={jobs} store={store}
        claim={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

Object.assign(window, { LnEcTab, LnEcForm, LnChips });
