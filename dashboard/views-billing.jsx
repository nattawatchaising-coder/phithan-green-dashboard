/* ============================================================
   flash+solar — งวดงาน · วางบิล: การ์ดในใบงาน · แผงตั้งงวด · หน้ารวมของบัญชี

   ตรรกะทั้งหมดอยู่ใน billing.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มและป้ายยืมของใบเบิกเงิน (window.EC_INPUT / EcPill / EcStat / EcBigShot)
   เพราะทุกโมดูลในระบบต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   กฎการออกแบบของไฟล์นี้: ไม่มีคอมโพเนนต์ไหนแตะ Firebase หรือ store เอง
   การเขียนข้อมูลงวดรับมาเป็น prop (onSaveBills) เสมอ — สิทธิ์จึงกั้นได้ที่จุดต่อสาย
   และตรรกะทั้งชุดทดสอบได้โดยไม่ต้องเขียนฐานข้อมูลจริง (มีแต่รูปที่เขียนผ่าน useBillPhotos)

   ตั้งชื่อ top-level ขึ้นต้นด้วย Bl/bl กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const BL_ACCENT = "#6366F1";
const BL_INPUT = () => window.EC_INPUT || { width: "100%", padding: "10px 12px" };

const blMoney = (n) => (window.sBaht ? window.sBaht(n) : String(n));
const blDay = (v) => (v ? (window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10)) : "—");

function BlPill({ row, sub }) {
  const st = window.blStatusOf((row || {}).status);
  return <window.EcPill th={st.th} color={st.color} sub={sub} />;
}

/* ── แถบงวด ──
   หนึ่งช่องต่อหนึ่งงวด ไม่ใช่ต่อหนึ่งสถานะ — จำนวนงวดไม่เท่ากันทุกสัญญา
   แถบขั้นตอนตายตัวแบบงานขออนุญาตจึงใช้ไม่ได้ · อ่านทั้งโปรเจคจบในบรรทัดเดียว */
function BlRail({ rows, curId, onPick }) {
  const list = (rows || []).filter(window.blLive);
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {list.map((r) => {
        const st = window.blStatusOf(r.status);
        const on = r.id === curId;
        return (
          <div key={r.id} onClick={onPick ? () => onPick(r) : undefined}
            style={{ flex: 1, minWidth: 0, cursor: onPick ? "pointer" : "default" }}>
            <div style={{ height: 4, borderRadius: 99, background: st.color, opacity: r.status === "pending" ? 0.35 : 1 }} />
            <div style={{ fontSize: 9.5, marginTop: 3, color: on ? st.color : "var(--text-3)", fontWeight: on ? 800 : 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>งวด {r.n}</div>
          </div>
        );
      })}
    </div>
  );
}

/* กล่องเตือนในการ์ด — โทนเดียวกับกล่อง "ไม่ผ่าน" ของงานขออนุญาต */
function BlNote({ tone, children }) {
  const c = tone === "ok"
    ? { bg: "var(--tint-ok-bg)", bd: "var(--tint-ok-bd)", tx: "var(--tint-ok-tx)" }
    : tone === "red"
      ? { bg: "var(--tint-red-bg)", bd: "var(--tint-red-bd)", tx: "var(--tint-red-tx)" }
      : { bg: "var(--tint-amber-bg)", bd: "var(--tint-amber-bd)", tx: "var(--tint-amber-tx)" };
  return (
    <div style={{ margin: "0 12px 10px", padding: "8px 11px", borderRadius: 10, background: c.bg,
      border: "1px solid " + c.bd, color: c.tx, fontSize: 11.5, lineHeight: 1.55 }}>{children}</div>
  );
}

/* ปุ่มเดินสถานะ — สร้างจาก blNext เท่านั้น ขั้นที่ผิดกติกาจึงไม่โผล่ตั้งแต่แรก */
function BlMoveBtns({ row, bills, role, currentUser, job, onMove, size }) {
  const nexts = window.blNext(row, role, currentUser, bills);
  const block = window.blReadyToBill(row, bills);
  const showWhy = row && row.status === "ready" && !block.ok && window.blCanUse(role);
  if (!nexts.length && !showWhy) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {nexts.map((s) => {
        const fwd = window.blFlowIdx(s.key) > window.blFlowIdx(row.status);
        return (
          <button key={s.key} onClick={() => onMove(row, s.key)}
            style={{ padding: size === "sm" ? "6px 10px" : "8px 12px", borderRadius: 9, fontFamily: "inherit",
              fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 700, cursor: "pointer",
              border: fwd ? "none" : "1px solid var(--border-strong)",
              background: fwd ? s.color : "var(--surface)", color: fwd ? "#fff" : "var(--text-2)" }}>
            {s.key === "void" ? "ยกเลิกงวด" : s.key === "billed" ? "ออกเอกสาร · วางบิล"
              : s.key === "accepted" ? "ลูกค้ารับมอบแล้ว" : s.key === "paid" ? "รับเงินแล้ว"
                : window.blFlowIdx(s.key) < window.blFlowIdx(row.status) ? "ถอยกลับ · " + s.short : s.th}
          </button>
        );
      })}
      {showWhy && <span style={{ fontSize: 11, color: "var(--tint-amber-tx)" }}>· {block.why}</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   การ์ดในใบงาน
   ══════════════════════════════════════════════════ */
function BlJobCard({ job, quotes, leads, role, currentUser, readOnly, onOpen, onSaveBills }) {
  const j = job || {};
  const [print, setPrint] = React.useState(null);
  const S = window.blSummary(j);
  const bills = j.bills || null;
  const quote = window.blPickQuote(quotes, j, leads);
  const drift = window.blDrift(j, quote);
  const cur = S.cur;
  const rows = window.blRows(j);
  const ro = readOnly || !onSaveBills;

  const move = (row, to) => {
    if (!onSaveBills) return;
    let opt = {};
    if (to === "void") {
      const why = window.prompt("ยกเลิกงวดที่ " + row.n + " เพราะอะไร (บันทึกไว้ในประวัติ)");
      if (why == null) return;
      opt.note = why;
    }
    if (to === "paid") {
      const ref = window.prompt("เลขอ้างอิงการโอน / เลขสลิป (ไม่มีก็เว้นว่าง)", row.payRef || "");
      if (ref == null) return;
      opt.ref = ref;
    }
    const next = window.blMove(row, to, currentUser, opt, j);
    onSaveBills(Object.assign({}, bills, { rows: rows.map((r) => (r.id === row.id ? next : r)) }));
  };

  const st = cur ? window.blStatusOf(cur.status) : null;
  const sub = !S.has
    ? (quote ? "ยังไม่ได้ตั้งงวด · ดึงจาก " + (quote.no || "ใบเสนอราคา") : "ยังไม่ได้ตั้งงวด · งานนี้ไม่มีใบเสนอราคา ต้องกรอกเอง")
    : "งวด " + (S.doneCount + (cur && cur.status === "paid" ? 0 : 1)) + "/" + S.count
      + " · รับแล้ว " + blMoney(S.collected) + " · ค้างรับ " + blMoney(S.outstanding) + " บาท";

  return (
    <div style={{ marginBottom: 22, border: "1px solid " + (S.overdue.length ? "var(--tint-amber-bd)" : "var(--border-strong)"),
      borderLeft: "3px solid " + (st ? st.color : (!S.has && quote ? "var(--primary)" : "var(--border-strong)")),
      borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>

      <button onClick={onOpen} disabled={!onOpen}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          background: "none", border: "none", cursor: onOpen ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: BL_ACCENT + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="file" size={17} color={BL_ACCENT} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>เอกสารงวดงาน · วางบิล</span>
          <span style={{ display: "block", fontSize: 11.5, color: st ? st.color : (!S.has && quote ? "var(--primary-dark)" : "var(--text-3)"),
            fontWeight: S.has ? 700 : 400 }}>{sub}</span>
        </span>
        {onOpen && <Icon name="arrowRight" size={16} color="var(--text-3)" />}
      </button>

      {S.has && (
        <div style={{ padding: "0 14px 12px" }}>
          <BlRail rows={rows} curId={cur ? cur.id : null} />
        </div>
      )}

      {/* งวดที่กำลังเดินอยู่ — บรรทัดเดียวที่บัญชีต้องอ่าน แล้วต่อด้วยปุ่มที่กดได้จริง */}
      {S.has && cur && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", background: "var(--surface2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: ro ? 0 : 9 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>งวดที่ {cur.n}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-2)", fontFamily: "var(--mono)" }}>{blMoney(cur.amount)} บาท</span>
            <BlPill row={cur} />
            {cur.docNo ? <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{cur.docNo}</span> : null}
          </div>
          {!ro && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <BlMoveBtns row={cur} bills={bills} role={role} currentUser={currentUser} job={j} onMove={move} size="sm" />
              {window.blFlowIdx(cur.status) >= window.blFlowIdx("billed") && (
                <button onClick={() => setPrint(cur)}
                  style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  พิมพ์เอกสาร
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!!S.overdue.length && (
        <BlNote>⏰ เลยกำหนดวางบิล {S.overdue.map((r) => "งวด " + r.n + " (" + blDay(r.due) + ")").join(" · ")} — ยังไม่ได้ออกเอกสาร</BlNote>
      )}
      {S.mismatch && (
        <BlNote>ผลรวมรายงวด {blMoney(S.total)} ไม่เท่ากับยอดตามใบเสนอราคา {blMoney(S.grand)} บาท — ตรวจตัวเลขอีกครั้ง</BlNote>
      )}
      {drift && (
        <BlNote>ใบเสนอราคา {quote && quote.no ? quote.no : ""} ถูกแก้หลังตั้งงวด — เปิดแผงตั้งงวดแล้วกด “ถอดงวดใหม่จากใบล่าสุด”</BlNote>
      )}
      {S.allPaid && <BlNote tone="ok">✔ เก็บเงินครบทุกงวดแล้ว รวม {blMoney(S.collected)} บาท</BlNote>}

      {print && <BlPrintHost job={j} row={print} onClose={() => setPrint(null)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   เลือกรูปประกอบ — รูปที่มีอยู่แล้วในงาน + อัปโหลดเพิ่ม
   คัดลอก dataUrl มาเก็บที่งวดเสมอ ไม่อ้างอิงรูปต้นทาง (ดูหมายเหตุใน billing.jsx)
   ══════════════════════════════════════════════════ */
function BlPhotoPick({ job, row, api, currentUser, onClose }) {
  const j = job || {};
  const [tab, setTab] = React.useState("daily");
  const [busy, setBusy] = React.useState(0);
  const [err, setErr] = React.useState("");
  const daily = window.useDailyReports ? window.useDailyReports(j.id) : { dates: [] };
  const dates = daily.dates || [];
  const [day, setDay] = React.useState("");
  React.useEffect(() => { if (!day && dates.length) setDay(dates[dates.length - 1]); }, [dates.length]);
  const dayPhotos = window.useDailyPhotos(j.id, tab === "daily" ? day : null);
  const media = window.useJobMedia(tab === "job" ? j.id : null);
  const picked = api.photos || [];
  const has = (srcRef) => picked.some((p) => p.srcRef && p.srcRef === srcRef);

  const take = (p, src, srcRef) => {
    if (has(srcRef)) return;
    api.add(p.dataUrl, { cap: p.cap || "", user: currentUser, src: src, srcRef: srcRef });
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    for (const f of files) {
      if (!/^image\//.test(f.type || "")) { setErr("เลือกได้เฉพาะไฟล์รูป"); continue; }
      setBusy((n) => n + 1);
      try {
        /* ย่อที่ 1400px คุณภาพ 0.78 — สูงกว่ารูปหน้างานเพราะรูปพวกนี้ถูกพิมพ์ที่ราว 76 มม. บน A4
           ลูกค้าต้องมองออกว่าติดตั้งอะไรไปแล้ว ไม่ใช่เห็นเป็นก้อนเบลอ */
        const url = await window.resizeImageFile(f, 1400, 0.78);
        api.add(url, { user: currentUser, src: "upload", srcRef: "" });
      } catch (x) { setErr("ย่อรูปไม่สำเร็จ ลองรูปอื่น"); }
      setBusy((n) => n - 1);
    }
  };

  const grid = (list, src, refOf) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))", gap: 8 }}>
      {list.map((p) => {
        const sr = refOf(p);
        const on = has(sr);
        return (
          <button key={p.id} onClick={() => take(p, src, sr)} disabled={on}
            style={{ padding: 0, border: "2px solid " + (on ? "var(--primary)" : "var(--border)"), borderRadius: 10,
              overflow: "hidden", background: "var(--surface2)", cursor: on ? "default" : "pointer", position: "relative" }}>
            <img src={p.dataUrl} alt="" style={{ display: "block", width: "100%", height: 78, objectFit: "cover", opacity: on ? 0.45 : 1 }} />
            {on && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800, color: "var(--primary-dark)" }}>เลือกแล้ว</span>}
          </button>
        );
      })}
      {!list.length && <div style={{ fontSize: 12, color: "var(--text-3)", padding: "10px 2px" }}>ไม่มีรูปในกลุ่มนี้</div>}
    </div>
  );

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      style={{ padding: "7px 12px", borderRadius: 9, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (tab === id ? BL_ACCENT : "var(--border-strong)"),
        background: tab === id ? BL_ACCENT + "18" : "var(--surface)", color: tab === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(8,20,14,.5)", overflow: "auto", padding: "18px 12px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>รูปประกอบงวดที่ {(row || {}).n}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>เลือกแล้ว {picked.length} รูป · แผ่นละ 4 รูปเวลาพิมพ์</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        <div style={{ padding: 15 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {tabBtn("daily", "รูปรายงานประจำวัน")}
            {tabBtn("job", "รูปหน้างาน")}
            {tabBtn("up", "อัปโหลดใหม่")}
          </div>

          {tab === "daily" && (
            <div>
              <select value={day} onChange={(e) => setDay(e.target.value)}
                style={Object.assign({}, BL_INPUT(), { marginBottom: 10, maxWidth: 260 })}>
                {!dates.length && <option value="">ยังไม่มีรายงานประจำวัน</option>}
                {dates.slice().reverse().map((d) => <option key={d} value={d}>{blDay(d)}</option>)}
              </select>
              {grid(dayPhotos.photos || [], "daily", (p) => day + "/" + p.id)}
            </div>
          )}
          {tab === "job" && grid(media.photos || [], "job", (p) => "job/" + p.id)}
          {tab === "up" && (
            <div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 11,
                border: "1px dashed var(--border-strong)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                <Icon name="camera" size={16} color="var(--text-2)" />
                {busy ? "กำลังย่อรูป…" : "เลือกไฟล์รูป"}
                <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} />
              </label>
              {err && <div style={{ fontSize: 11.5, color: "var(--tint-red-tx)", marginTop: 8 }}>{err}</div>}
            </div>
          )}

          {/* รูปที่เลือกไว้แล้ว — คำบรรยายของแต่ละรูปพิมพ์ใต้รูปบนกระดาษ */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)", marginBottom: 8 }}>รูปในงวดนี้ ({picked.length})</div>
            {picked.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <img src={p.dataUrl} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                <input value={p.cap || ""} onChange={(e) => api.setCap(p.id, e.target.value)} placeholder="คำบรรยายรูป (ไม่ใส่ก็ได้)"
                  style={Object.assign({}, BL_INPUT(), { fontSize: 12.5, padding: "8px 10px" })} />
                <button onClick={() => api.remove(p.id)} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 9,
                  border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", cursor: "pointer" }}>
                  <Icon name="trash" size={14} color="var(--tint-red-tx)" />
                </button>
              </div>
            ))}
            {!picked.length && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้เลือกรูป</div>}
          </div>
        </div>

        <div style={{ padding: "12px 15px", borderTop: "1px solid var(--border)", textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--primary)",
            color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>เสร็จแล้ว</button>
        </div>
      </div>
    </div>
  );
}

/* รายละเอียดของงวดหนึ่ง — รายการงานที่จะพิมพ์บนใบ คำบรรยายหน้ารูป และรูป */
function BlRowDetail({ job, row, onPatch, currentUser, readOnly }) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  const [pick, setPick] = React.useState(false);
  const items = row.items || [];

  const setItem = (i, v) => onPatch({ items: items.map((s, k) => (k === i ? v : s)) });
  const addItem = () => onPatch({ items: items.concat([""]) });
  const delItem = (i) => onPatch({ items: items.filter((s, k) => k !== i) });

  /* จำนวนรูปสะท้อนกลับไปที่ตัวงวด ให้หน้ารวมบอกได้ว่างวดไหนยังไม่มีรูปโดยไม่ต้องโหลดรูป */
  React.useEffect(() => {
    const ids = api.photos.map((p) => p.id);
    if (readOnly) return;
    if (ids.join(",") !== (row.photoIds || []).join(",")) onPatch({ photoIds: ids });
  }, [api.photos.length]);

  return (
    <div style={{ padding: "12px 14px", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>เรื่อง (ว่างไว้ = ใช้ข้อความมาตรฐาน)</div>
          <input value={row.subject || ""} disabled={readOnly} onChange={(e) => onPatch({ subject: e.target.value })}
            placeholder={window.blSubjectOf(Object.assign({}, row, { subject: "" }))} style={BL_INPUT()} />
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>
            รายการงานที่ส่งมอบในงวดนี้ — พิมพ์เป็นข้อ 1, 2, 3 บนใบ
          </div>
          {items.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <span style={{ width: 20, flexShrink: 0, textAlign: "right", fontSize: 12.5, fontWeight: 700,
                color: "var(--text-3)", paddingTop: 10 }}>{i + 1}.</span>
              <input value={s} disabled={readOnly} onChange={(e) => setItem(i, e.target.value)}
                placeholder="เช่น งานติดตั้งแผงโซลาร์เซลล์ 550W จำนวน 120 แผง แล้วเสร็จ 100%" style={BL_INPUT()} />
              {!readOnly && (
                <button onClick={() => delItem(i)} style={{ width: 38, flexShrink: 0, borderRadius: 9,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-3)", cursor: "pointer" }}>
                  <Icon name="trash" size={14} color="var(--text-3)" />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button onClick={addItem} style={{ padding: "7px 12px", borderRadius: 9, border: "1px dashed var(--border-strong)",
              background: "none", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              + เพิ่มรายการ
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 190 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>คำบรรยายบนหน้ารูป</div>
            <input value={row.cap || ""} disabled={readOnly} onChange={(e) => onPatch({ cap: e.target.value })}
              placeholder="เช่น ดำเนินการติดตั้งอินเวอร์เตอร์ 100%" style={BL_INPUT()} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ณ วันที่</div>
            <input type="date" value={row.capDate || ""} disabled={readOnly} onChange={(e) => onPatch({ capDate: e.target.value })} style={BL_INPUT()} />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>รูปประกอบ ({api.photos.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {api.photos.slice(0, 8).map((p) => (
              <img key={p.id} src={p.dataUrl} alt="" style={{ width: 54, height: 42, objectFit: "cover", borderRadius: 7, border: "1px solid var(--border)" }} />
            ))}
            {api.photos.length > 8 && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>+{api.photos.length - 8}</span>}
            {!readOnly && (
              <button onClick={() => setPick(true)} style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--border-strong)",
                background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                เลือกรูป
              </button>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>บันทึกภายใน (ไม่พิมพ์บนเอกสาร)</div>
          <input value={row.note || ""} disabled={readOnly} onChange={(e) => onPatch({ note: e.target.value })} style={BL_INPUT()} />
        </div>

        {/* ประวัติการเดินสถานะ — ใครกดอะไรเมื่อไร ตรวจย้อนได้ */}
        {!!(row.hist || []).length && (
          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
            {row.hist.slice().reverse().map((h, i) => (
              <div key={i}>
                {window.thDateTime ? window.thDateTime(h.at) : h.at} · {window.blStatusOf(h.to).th}
                {h.byName ? " · " + h.byName : ""}{h.note ? " · " + h.note : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {pick && <BlPhotoPick job={job} row={row} api={api} currentUser={currentUser} onClose={() => setPick(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   แผงตั้งงวดงาน — แก้ตัวเลขและเนื้อหาของงวด (การเดินสถานะอยู่ที่การ์ด/หน้ารวม)
   ══════════════════════════════════════════════════ */
function BlSetupModal({ job, quotes, leads, role, currentUser, readOnly, focusRowId, onClose, onSaveBills }) {
  const j = job || {};
  const ro = readOnly || !onSaveBills;
  const list = window.quotesOfJob(quotes, j, leads);
  const pick = window.blPickQuote(quotes, j, leads);

  const [bills, setBills] = React.useState(() => j.bills || window.blSeed(null, j, currentUser));
  const [qid, setQid] = React.useState(() => (j.bills && j.bills.quoteId) || (pick ? pick.id : ""));
  const [open, setOpen] = React.useState(focusRowId || null);
  const [msg, setMsg] = React.useState("");
  const [dirty, setDirty] = React.useState(false);

  const quote = list.find((q) => q.id === qid) || null;
  const rows = bills.rows || [];
  const sum = window.blR2(rows.filter(window.blLive).reduce((a, r) => a + (+r.amount || 0), 0));
  const drift = quote && bills.sig && bills.sig !== window.blSig(quote);

  const put = (fields) => { setBills((b) => Object.assign({}, b, fields)); setDirty(true); };
  const putRow = (id, fields) => {
    setBills((b) => Object.assign({}, b, { rows: (b.rows || []).map((r) => (r.id === id ? Object.assign({}, r, fields) : r)) }));
    setDirty(true);
  };

  /* % กับจำนวนเงินต้องเดินตามกันเสมอ ไม่งั้นใบที่พิมพ์ออกไปจะขัดกับเงื่อนไขที่เขียนอยู่บรรทัดเดียวกัน */
  const setPct = (row, v) => {
    const pct = v === "" ? null : +v;
    const amt = pct != null && bills.grand ? window.blR2(bills.grand * pct / 100) : row.amount;
    putRow(row.id, { pct: pct, amount: amt });
  };

  const seed = () => {
    if (!quote) { setMsg("เลือกใบเสนอราคาก่อน"); return; }
    const next = window.blReseed(bills, quote, j, currentUser);
    setBills(next); setDirty(true);
    setMsg(next.locked
      ? "ถอดงวดใหม่แล้ว — ข้ามงวดที่ออกเอกสารไปแล้ว " + next.locked + " งวด (ตัวเลขบนใบที่ส่งไปต้องไม่เปลี่ยน)"
      : "ถอดได้ " + (next.rows || []).length + " งวดจากเงื่อนไขการชำระเงิน"
        + (next.pctTotal !== 100 ? " · เงื่อนไขในใบรวมได้ " + next.pctTotal + "% ไม่ครบ 100%" : ""));
  };

  const addRow = () => {
    const n = rows.length ? Math.max.apply(null, rows.map((r) => +r.n || 0)) + 1 : 1;
    setBills((b) => Object.assign({}, b, {
      rows: (b.rows || []).concat([window.blBlankRow({ n: n, line: "งวดที่ " + n + " · " })]),
    }));
    setDirty(true);
  };
  const delRow = (row) => {
    if (window.blRowLocked(row)) return;
    setBills((b) => Object.assign({}, b, { rows: (b.rows || []).filter((r) => r.id !== row.id) }));
    setDirty(true);
  };

  const save = () => {
    if (!onSaveBills) return;
    onSaveBills(Object.assign({}, bills, {
      from: quote ? bills.from : "manual",
      quoteId: quote ? quote.id : "", quoteNo: quote ? quote.no || "" : "",
      grand: window.blR2(bills.grand), vatRate: +bills.vatRate || 0, kwp: +bills.kwp || 0,
    }));
    setDirty(false);
    setMsg("บันทึกแล้ว");
  };

  const modeBtn = (id, label) => (
    <button onClick={() => { put({ from: id }); if (id === "manual") setQid(""); else if (pick) setQid(pick.id); }} disabled={ro}
      style={{ padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: ro ? "default" : "pointer",
        border: "1px solid " + (bills.from === id ? BL_ACCENT : "var(--border-strong)"),
        background: bills.from === id ? BL_ACCENT + "18" : "var(--surface)", color: bills.from === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  const cell = { padding: "7px 8px", fontSize: 12.5, color: "var(--text-1)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };
  const head = { padding: "7px 8px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "left",
    borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 180, background: "rgba(8,20,14,.5)", overflow: "auto", padding: "18px 12px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: BL_ACCENT + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="file" size={17} color={BL_ACCENT} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>ตั้งงวดงาน · {j.code || ""}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {j.name || ""}{ro ? " · ดูได้อย่างเดียว" : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {/* ── แหล่งที่มาของงวด ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {modeBtn("quote", "จากใบเสนอราคา")}
            {modeBtn("manual", "กรอกเอง")}
          </div>

          {bills.from !== "manual" ? (
            <div style={{ marginBottom: 14 }}>
              {list.length ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: 2, minWidth: 240 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ใบเสนอราคาที่ใช้ถอดงวด</div>
                    <select value={qid} disabled={ro} onChange={(e) => setQid(e.target.value)} style={BL_INPUT()}>
                      {list.map((q) => {
                        const T = window.quoteTotals(q);
                        const s = (window.QUOTE_STATUS_BY || {})[q.status];
                        return (
                          <option key={q.id} value={q.id}>
                            {(q.no || q.id) + " · " + (window.thDate ? window.thDate(q.date, true) : "") + " · " + ((s && s.th) || q.status) + " · " + blMoney(T.grand)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {quote && quote.status === "accepted" && (
                    <span style={{ padding: "6px 11px", borderRadius: 99, background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)",
                      color: "var(--tint-ok-tx)", fontSize: 11.5, fontWeight: 700 }}>ลูกค้าตกลงแล้ว</span>
                  )}
                  {!ro && (
                    <button onClick={seed} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: BL_ACCENT,
                      color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      ดึงงวดจากเงื่อนไขการชำระเงิน
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: "11px 13px", borderRadius: 11, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)",
                  color: "var(--tint-amber-tx)", fontSize: 12.5, lineHeight: 1.6 }}>
                  งานนี้ไม่มีใบเสนอราคาในระบบ — สลับไป “กรอกเอง” แล้วตั้งยอดกับเงื่อนไขของแต่ละงวดเอง
                </div>
              )}
              {quote && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
                  ยอดตามใบ {blMoney(window.quoteTotals(quote).grand)} บาท (รวม VAT {window.quoteTotals(quote).vatRate}%)
                  {(() => {
                    const sp = window.quoteTermSplit(quote.terms, window.quoteTotals(quote).grand);
                    return sp.pctTotal !== 100
                      ? <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}> · เงื่อนไขในใบรวมได้ {sp.pctTotal}% ไม่ครบ 100%</span>
                      : null;
                  })()}
                </div>
              )}
              {drift && (
                <div style={{ marginTop: 8, padding: "10px 13px", borderRadius: 11, background: "var(--tint-amber-bg)",
                  border: "1px solid var(--tint-amber-bd)", color: "var(--tint-amber-tx)", fontSize: 12.5, lineHeight: 1.6 }}>
                  ใบเสนอราคาถูกแก้หลังตั้งงวด — กด “ดึงงวดจากเงื่อนไขการชำระเงิน” เพื่อถอดใหม่
                  (งวดที่ออกเอกสารไปแล้วจะไม่ถูกเขียนทับ)
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ยอดรวมทั้งสัญญา (รวม VAT)</div>
                <input type="number" value={bills.grand || ""} disabled={ro} onChange={(e) => put({ grand: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ width: 96 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>VAT %</div>
                <input type="number" value={bills.vatRate} disabled={ro} onChange={(e) => put({ vatRate: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ width: 110 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ขนาด kWp</div>
                <input type="number" value={bills.kwp || ""} disabled={ro} onChange={(e) => put({ kwp: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>อ้างถึงสัญญา / ใบสั่งซื้อเลขที่</div>
                <input value={bills.ref || ""} disabled={ro} onChange={(e) => put({ ref: e.target.value })} style={BL_INPUT()} />
              </div>
            </div>
          )}

          {msg && (
            <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 10, background: "var(--tint-ok-bg)",
              border: "1px solid var(--tint-ok-bd)", color: "var(--tint-ok-tx)", fontSize: 12.5 }}>{msg}</div>
          )}

          {/* ── ตารางงวด ── */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, head, { width: 52 })}>งวด</th>
                    <th style={head}>เงื่อนไข</th>
                    <th style={Object.assign({}, head, { width: 74 })}>%</th>
                    <th style={Object.assign({}, head, { width: 128 })}>จำนวนเงิน</th>
                    <th style={Object.assign({}, head, { width: 142 })}>กำหนดวางบิล</th>
                    <th style={Object.assign({}, head, { width: 150 })}>สถานะ</th>
                    <th style={Object.assign({}, head, { width: 86 })}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const lock = window.blRowLocked(r);
                    const dis = ro || lock;
                    return (
                      <React.Fragment key={r.id}>
                        <tr style={{ background: r.status === "void" ? "var(--surface2)" : "transparent" }}>
                          <td style={Object.assign({}, cell, { fontWeight: 800 })}>
                            <input type="number" value={r.n} disabled={dis} onChange={(e) => putRow(r.id, { n: +e.target.value || 1 })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <input value={r.line || ""} disabled={dis} onChange={(e) => putRow(r.id, { line: e.target.value })}
                              placeholder="งวดที่ 1 · มัดจำ 30% เมื่อตกลงทำสัญญา"
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 8px", fontSize: 12.5,
                                textDecoration: r.status === "void" ? "line-through" : "none" })} />
                            {lock && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>ออกเอกสารแล้ว — แก้ตัวเลขไม่ได้</div>}
                          </td>
                          <td style={cell}>
                            <input type="number" value={r.pct == null ? "" : r.pct} disabled={dis} placeholder="—"
                              onChange={(e) => setPct(r, e.target.value)}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <input type="number" value={r.amount || 0} disabled={dis} onChange={(e) => putRow(r.id, { amount: +e.target.value || 0, pct: null })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
                          </td>
                          <td style={cell}>
                            <input type="date" value={r.due || ""} disabled={ro} onChange={(e) => putRow(r.id, { due: e.target.value })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <BlPill row={r} />
                            {r.docNo ? <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, fontFamily: "var(--mono)" }}>{r.docNo}</div> : null}
                            {r.status === "void" && r.voidWhy ? <div style={{ fontSize: 10.5, color: "var(--tint-red-tx)", marginTop: 2 }}>{r.voidWhy}</div> : null}
                          </td>
                          <td style={Object.assign({}, cell, { whiteSpace: "nowrap" })}>
                            <button onClick={() => setOpen(open === r.id ? null : r.id)}
                              style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
                                color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                              {open === r.id ? "ย่อ" : "แก้ใบ"}
                            </button>
                            {!ro && !lock && (
                              <button onClick={() => delRow(r)} title="ลบงวดนี้"
                                style={{ marginLeft: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-strong)",
                                  background: "var(--surface)", color: "var(--text-3)", cursor: "pointer" }}>
                                <Icon name="trash" size={13} color="var(--text-3)" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {open === r.id && (
                          <tr><td colSpan={7} style={{ padding: 0 }}>
                            <BlRowDetail job={j} row={r} currentUser={currentUser} readOnly={ro}
                              onPatch={(f) => putRow(r.id, f)} />
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!rows.length && (
                    <tr><td colSpan={7} style={Object.assign({}, cell, { color: "var(--text-3)", textAlign: "center", padding: 22 })}>
                      ยังไม่มีงวด — {bills.from === "manual" ? "กด “เพิ่มงวด”" : "กด “ดึงงวดจากเงื่อนไขการชำระเงิน”"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px",
              borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
              {!ro && (
                <button onClick={addRow} style={{ padding: "7px 12px", borderRadius: 9, border: "1px dashed var(--border-strong)",
                  background: "none", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  + เพิ่มงวด
                </button>
              )}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                ผลรวมรายงวด <b style={{ fontFamily: "var(--mono)", color: "var(--text-1)" }}>{blMoney(sum)}</b>
                {bills.grand ? <span> / ยอดตามใบ <b style={{ fontFamily: "var(--mono)" }}>{blMoney(bills.grand)}</b></span> : null}
                {bills.grand && Math.abs(sum - window.blR2(bills.grand)) > 0.01 ? (
                  <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}> · ต่างกัน {blMoney(window.blR2(bills.grand) - sum)} บาท</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            ปิด
          </button>
          {!ro && (
            <button onClick={save} disabled={!dirty}
              style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: dirty ? "var(--primary)" : "var(--surface3)",
                color: dirty ? "#fff" : "var(--text-3)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: dirty ? "pointer" : "default" }}>
              บันทึก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* เปิดกระดาษของงวดหนึ่ง — ตัวกลางที่ดึงรูปของงวดนั้นมาให้ BlDeliveryPaper */
function BlPrintHost({ job, row, onClose }) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  if (!job || !row) return null;
  return <window.BlDeliveryPaper job={job} bill={job.bills || {}} row={row} photos={api.photos} onClose={onClose} />;
}

/* ══════════════════════════════════════════════════
   หน้ารวมงวดงาน — มุมของบัญชี: วันนี้ต้องวางบิลใบไหน ค้างรับเท่าไร
   ══════════════════════════════════════════════════ */
function BillingView({ jobs, quotes, leads, role, currentUser, onOpenJob, onSaveBills, onSetup }) {
  const today = window.drToday ? window.drToday() : "";
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [onlyNew, setOnlyNew] = React.useState(false);
  const [print, setPrint] = React.useState(null);
  const ro = !onSaveBills;

  const withBills = (jobs || []).filter((j) => window.blHas(j));
  /* คิดสดทุกรอบ ไม่ memo — สรุปของงานหนึ่งงานคือการบวกไม่กี่สิบตัวเลข
     แต่ตัวเลขต้องตรงกับที่เพิ่งกดเปลี่ยนสถานะไปทันที ไม่งั้นบัญชีจะไม่เชื่อหน้าจอ */
  const sums = {};
  withBills.forEach((j) => { sums[j.id] = window.blSummary(j, today); });

  /* ไทล์สรุป — ตัวเลขทั้งบริษัท ไม่ใช่ของงานเดียว บัญชีเปิดหน้านี้มาเพื่ออ่านสี่ตัวนี้ก่อน */
  const tiles = (() => {
    let readyN = 0, readyB = 0, waitB = 0, monthPaid = 0, overdueN = 0;
    const ym = String(today).slice(0, 7);
    withBills.forEach((j) => {
      window.blRows(j).filter(window.blLive).forEach((r) => {
        if (r.status === "ready") { readyN++; readyB += +r.amount || 0; }
        if (window.blFlowIdx(r.status) >= window.blFlowIdx("billed") && r.status !== "paid") {
          waitB += (+r.amount || 0) - (+r.paidAmt || 0);
        }
        if (r.paidAt && String(r.paidAt).slice(0, 7) === ym) monthPaid += +r.paidAmt || 0;
        if (window.blOverdue(r, today)) overdueN++;
      });
    });
    return { readyN, readyB: window.blR2(readyB), waitB: window.blR2(waitB), monthPaid: window.blR2(monthPaid), overdueN };
  })();

  const kw = q.trim().toLowerCase();
  const rowHit = (j, r) => {
    if (filter === "overdue" && !window.blOverdue(r, today)) return false;
    if (filter !== "all" && filter !== "overdue" && r.status !== filter) return false;
    if (!kw) return true;
    return [j.code, j.name, r.docNo, r.line].filter(Boolean).join(" ").toLowerCase().indexOf(kw) >= 0;
  };

  const groups = withBills.map((j) => ({ job: j, rows: window.blRows(j).filter((r) => rowHit(j, r)), S: sums[j.id] }))
    .filter((g) => g.rows.length)
    .sort((a, b) => String(a.job.code || "").localeCompare(String(b.job.code || "")));

  /* งานที่ติดตั้งแล้วแต่ยังไม่ตั้งงวด — นี่คือรายการที่บัญชีต้องลงมือจริง และเป็นเหตุผลที่หน้านี้มีอยู่ */
  const pendingSetup = (jobs || []).filter((j) => !window.blHas(j) && (j.stage === "install" || j.stage === "done"))
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));

  const move = (job, row, to) => {
    if (!onSaveBills) return;
    let opt = {};
    if (to === "void") {
      const why = window.prompt("ยกเลิกงวดที่ " + row.n + " เพราะอะไร (บันทึกไว้ในประวัติ)");
      if (why == null) return;
      opt.note = why;
    }
    if (to === "paid") {
      const ref = window.prompt("เลขอ้างอิงการโอน / เลขสลิป (ไม่มีก็เว้นว่าง)", row.payRef || "");
      if (ref == null) return;
      opt.ref = ref;
    }
    const next = window.blMove(row, to, currentUser, opt, job);
    onSaveBills(job.id, Object.assign({}, job.bills, {
      rows: window.blRows(job).map((r) => (r.id === row.id ? next : r)),
    }));
  };

  const chip = (id, label) => (
    <button key={id} onClick={() => setFilter(id)}
      style={{ padding: "6px 12px", borderRadius: 99, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (filter === id ? BL_ACCENT : "var(--border-strong)"),
        background: filter === id ? BL_ACCENT + "18" : "var(--surface)", color: filter === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  const head = { padding: "7px 9px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "left",
    borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
  const cell = { padding: "8px 9px", fontSize: 12.5, color: "var(--text-1)", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
        <window.EcStat label="ถึงงวด · รอวางบิล" value={tiles.readyN} unit="งวด" color="#F59E0B"
          hint={blMoney(tiles.readyB) + " บาท"} on={filter === "ready"} onClick={() => setFilter(filter === "ready" ? "all" : "ready")} />
        <window.EcStat label="วางบิลแล้ว · รอรับเงิน" value={blMoney(tiles.waitB)} unit="บาท" color="#3B82F6"
          on={filter === "billed"} onClick={() => setFilter(filter === "billed" ? "all" : "billed")} />
        <window.EcStat label="รับเงินแล้วเดือนนี้" value={blMoney(tiles.monthPaid)} unit="บาท" color="#10B981" />
        <window.EcStat label="เลยกำหนดวางบิล" value={tiles.overdueN} unit="งวด" color="#EF4444"
          on={filter === "overdue"} onClick={() => setFilter(filter === "overdue" ? "all" : "overdue")} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา รหัสงาน · ลูกค้า · เลขที่เอกสาร · เงื่อนไข"
          style={Object.assign({}, BL_INPUT(), { maxWidth: 320 })} />
        {chip("all", "ทั้งหมด")}
        {chip("ready", "รอวางบิล")}
        {chip("billed", "วางบิลแล้ว")}
        {chip("accepted", "รับมอบแล้ว")}
        {chip("paid", "รับเงินแล้ว")}
        {chip("overdue", "เลยกำหนด")}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          เฉพาะงานที่ยังไม่ตั้งงวด
        </label>
      </div>

      {!onlyNew && groups.map((g) => {
        const j = g.job, S = g.S;
        return (
          <div key={j.id} style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 12, background: "var(--surface)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "11px 13px", background: "var(--surface2)",
              borderBottom: "1px solid var(--border)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
                  {j.code} · {j.name}{+j.kw ? <span style={{ fontWeight: 600, color: "var(--text-3)" }}> · {j.kw} kW</span> : null}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  ยอดรวมสัญญา {blMoney(S.grand || S.total)} บาท · รับแล้ว {blMoney(S.collected)} · ค้างรับ {blMoney(S.outstanding)}
                  {S.voided ? " · ยกเลิก " + S.voided + " งวด" : ""}
                </div>
              </div>
              <div style={{ width: 170, flexShrink: 0 }}><BlRail rows={window.blRows(j)} curId={S.cur ? S.cur.id : null} /></div>
              {onOpenJob && (
                <button onClick={() => onOpenJob(j.id)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  เปิดใบงาน
                </button>
              )}
              {onSetup && !ro && (
                <button onClick={() => onSetup(j)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: BL_ACCENT,
                  color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  ตั้งงวด / แก้ใบ
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, head, { width: 46 })}>งวด</th>
                    <th style={head}>เงื่อนไข</th>
                    <th style={Object.assign({}, head, { width: 110, textAlign: "right" })}>จำนวนเงิน</th>
                    <th style={Object.assign({}, head, { width: 96 })}>กำหนด</th>
                    <th style={Object.assign({}, head, { width: 126 })}>เลขที่เอกสาร</th>
                    <th style={Object.assign({}, head, { width: 96 })}>วางบิล</th>
                    <th style={Object.assign({}, head, { width: 122, textAlign: "right" })}>รับเงิน</th>
                    <th style={Object.assign({}, head, { width: 132 })}>สถานะ</th>
                    <th style={head}></th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} style={{ background: window.blOverdue(r, today) ? "var(--tint-amber-bg)" : "transparent" }}>
                      <td style={Object.assign({}, cell, { fontWeight: 800 })}>{r.n}</td>
                      <td style={Object.assign({}, cell, { textDecoration: r.status === "void" ? "line-through" : "none" })}>
                        {r.line || "—"}
                        {r.status === "void" && r.voidWhy ? <div style={{ fontSize: 10.5, color: "var(--tint-red-tx)" }}>{r.voidWhy}</div> : null}
                      </td>
                      <td style={Object.assign({}, cell, { textAlign: "right", fontFamily: "var(--mono)" })}>{blMoney(r.amount)}</td>
                      <td style={cell}>{r.due ? blDay(r.due) : "—"}</td>
                      <td style={Object.assign({}, cell, { fontFamily: "var(--mono)", fontSize: 11.5 })}>{r.docNo || "—"}</td>
                      <td style={cell}>{r.billedAt ? blDay(r.billedAt) : "—"}</td>
                      <td style={Object.assign({}, cell, { textAlign: "right", fontFamily: "var(--mono)", fontSize: 11.5 })}>
                        {+r.paidAmt ? blMoney(r.paidAmt) + (window.blR2(r.paidAmt) < window.blR2(r.amount) ? " / " + blMoney(r.amount) : "") : "—"}
                      </td>
                      <td style={cell}><BlPill row={r} /></td>
                      <td style={Object.assign({}, cell, { whiteSpace: "nowrap" })}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {!ro && <BlMoveBtns row={r} bills={j.bills} role={role} currentUser={currentUser} job={j} onMove={(row, to) => move(j, row, to)} size="sm" />}
                          {window.blFlowIdx(r.status) >= window.blFlowIdx("billed") && (
                            <button onClick={() => setPrint({ job: j, row: r })}
                              style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                                color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                              พิมพ์
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {!onlyNew && !groups.length && (
        <div style={{ padding: 26, textAlign: "center", fontSize: 13, color: "var(--text-3)", border: "1px dashed var(--border-strong)", borderRadius: 13 }}>
          ไม่มีงวดงานที่ตรงกับตัวกรอง
        </div>
      )}

      {!!pendingSetup.length && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-2)", marginBottom: 8 }}>
            งานที่ติดตั้งแล้วแต่ยังไม่ตั้งงวด ({pendingSetup.length})
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {pendingSetup.map((j) => {
              const qt = window.blPickQuote(quotes, j, leads);
              return (
                <div key={j.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                  padding: "10px 13px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{j.code} · {j.name}</div>
                    <div style={{ fontSize: 11.5, color: qt ? "var(--primary-dark)" : "var(--text-3)" }}>
                      {qt ? "มีใบเสนอราคา " + (qt.no || "") + " · ดึงงวดได้เลย" : "ไม่มีใบเสนอราคา — ต้องกรอกงวดเอง"}
                    </div>
                  </div>
                  {onSetup && !ro && (
                    <button onClick={() => onSetup(j)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: BL_ACCENT,
                      color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ตั้งงวด</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {print && <BlPrintHost job={print.job} row={print.row} onClose={() => setPrint(null)} />}
    </div>
  );
}

Object.assign(window, {
  BL_ACCENT, BlPill, BlRail, BlNote, BlMoveBtns,
  BlJobCard, BlPhotoPick, BlRowDetail, BlSetupModal, BlPrintHost, BillingView,
});
