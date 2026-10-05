/* ============================================================
   flash+solar — การลาในแอป LINE (แท็บ "เวลา" → หัวข้อ "การลา")

   ยอดวันลาคงเหลือ · ขอลา · ใบลาของฉัน (ยกเลิกได้) · รายการรออนุมัติของคนอนุมัติ
   ตรรกะ/สิทธิ์/ข้อความแจ้งเตือนทั้งหมดอยู่ที่ leave.jsx — ชุดเดียวกับหน้าเว็บ ห้ามเขียนเงื่อนไขเองที่นี่

   โหลดหลัง liff-ui · liff-approve (ใช้ LN_CARD · LN_FIELD · LnField · LnSheetHead · LnApCard · LnApDecide …)
   คำนำหน้า LnLv / lnLv
   ============================================================ */

/* การ์ดยอดวันลา — ประเภทที่ยอด 0 และไม่เคยใช้ไม่ต้องขึ้น (ลาคลอดของคนที่ไม่มีสิทธิ์) */
function LnLvBalance({ bal }) {
  const show = (bal || []).filter((b) => b.quota !== 0 || b.used || b.pending);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, padding: "0 14px 14px" }}>
      {show.map((b) => {
        const low = b.left != null && b.left <= 0;
        return (
          <div key={b.type.key} style={Object.assign({ padding: "11px 13px" }, LN_CARD)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: b.type.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.type.th}</span>
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: low ? "#EF4444" : "var(--text-1)" }}>
                {b.left == null ? "∞" : Math.round(b.left * 10) / 10}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>
                {b.quota == null ? "ไม่จำกัด" : "/ " + Math.round(b.quota * 10) / 10 + " วัน"}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>
              ใช้ {Math.round(b.used * 10) / 10}{b.pending ? " · รอ " + Math.round(b.pending * 10) / 10 : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ฟอร์มขอลา (เต็มจอ) ── ส่งเลยในขั้นเดียว ไม่มีร่างบนมือถือ */
function LnLvForm({ me, users, rows, quota, types, cfg, onSave, onClose }) {
  const [f, setF] = React.useState(() => window.lvBlank(me, users, rows, cfg));
  const [msg, setMsg] = React.useState("");
  const set = (k, v) => setF((p) => {
    const n = Object.assign({}, p, { [k]: v });
    if (k === "from" && (!n.to || n.to < v)) n.to = v;
    if (n.to !== n.from) n.part = "full";
    n.days = window.lvCountDays(n.from, n.to, n.part, cfg);
    return n;
  });
  const bal = window.lvBalance(rows, quota, f.userId, window.lvYearOf(f.from), types);
  const why = window.lvSendWhy(f, bal);
  const one = f.from === f.to;
  const approvers = window.lvApprovers(users, me);

  const send = () => {
    if (why) { setMsg(why); return; }
    const next = window.lvMove(f, "sent", me, "");
    if (!next) return;
    onSave(next);
    window.lvNotifyMove(f, next, me, types);
    onClose();
  };

  return (
    <div style={LN_SHEET}>
      <LnSheetHead title="ขอลา" no={f.no} onClose={onClose} />
      <div style={{ padding: "4px 16px 24px", display: "grid", gap: 14 }}>
        <LnField label="ประเภทการลา" req>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {bal.filter((b) => b.quota !== 0).map((b) => (
              <button key={b.type.key} onClick={() => set("type", b.type.key)} style={lnChip(f.type === b.type.key, b.type.color)}>
                {b.type.th}
                <span style={{ marginLeft: 5, fontFamily: "var(--mono)", fontSize: 11, opacity: .8 }}>
                  {b.left == null ? "∞" : Math.round(b.left * 10) / 10}
                </span>
              </button>
            ))}
          </div>
        </LnField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <LnField label="ตั้งแต่" req>
            <input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} style={LN_FIELD} />
          </LnField>
          <LnField label="ถึง" req>
            <input type="date" value={f.to} min={f.from} onChange={(e) => set("to", e.target.value)} style={LN_FIELD} />
          </LnField>
        </div>
        {one && (
          <LnField label="ช่วงเวลา">
            <div style={{ display: "flex", gap: 7 }}>
              {window.LV_PART.map((p) => (
                <button key={p.key} onClick={() => set("part", p.key)} style={lnChip((f.part || "full") === p.key)}>{p.th}</button>
              ))}
            </div>
          </LnField>
        )}
        <div style={Object.assign({ padding: "12px 14px", textAlign: "center" }, LN_CARD)}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็นวันลา </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: f.days ? "var(--primary-dark)" : "var(--text-3)" }}>
            {window.lvDaysTH(f.days)}
          </span>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>นับเฉพาะวันทำงาน</div>
        </div>
        <LnField label="เหตุผล" req>
          <textarea value={f.reason} rows={3} onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ไม่สบาย มีไข้ · ไปทำธุระที่อำเภอ"
            style={Object.assign({}, LN_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
        </LnField>
        <LnField label="ส่งให้ใครอนุมัติ">
          <select value={f.approverId || ""} style={LN_FIELD}
            onChange={(e) => {
              const u = approvers.find((x) => x.id === e.target.value);
              setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
            }}>
            <option value="">— ใครก็ได้ที่มีสิทธิ์อนุมัติ —</option>
            {approvers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </LnField>
        {f.type && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: -6 }}>
          {window.lvTypeOf(types, f.type).th} · {window.lvAdvTH(window.lvTypeOf(types, f.type))}</div>}
        {(msg || why) && f.type && (
          <div style={{ padding: "11px 13px", borderRadius: 14, background: "var(--tint-amber-bg)", color: "var(--tint-amber-tx)",
            fontSize: 12.5, lineHeight: 1.6 }}>{msg || why}</div>
        )}
        <button onClick={send} disabled={!!why}
          style={Object.assign({}, LN_BTN, { background: why ? "var(--surface3)" : "var(--primary)", color: why ? "var(--text-3)" : "#fff",
            cursor: why ? "default" : "pointer", marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" })}>
          ส่งขออนุมัติ
        </button>
      </div>
    </div>
  );
}

/* ── หัวข้อ "การลา" ของตัวเอง ── */
function LnLeavePanel({ me, users, role, cfg, startForm }) {
  const lv = window.useLeaves();
  const types = window.useLeaveTypes().types;
  const quota = window.useLeaveQuota().map;
  const can = window.lvCanLeave(role);
  const [form, setForm] = React.useState(!!startForm && can);
  const year = +String(window.drToday()).slice(0, 4);
  const uid = (me || {}).id || null;
  const mine = React.useMemo(() => (lv.rows || []).filter((r) => r && r.userId === uid), [lv.rows, uid]);
  const bal = window.lvBalance(lv.rows, quota, uid, year, types);

  const cancel = (r) => {
    if (!window.confirm("ยกเลิกใบลา " + r.no + "?")) return;
    const next = window.lvMove(r, "cancelled", me, "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(r, next, me, types);
  };

  if (!can) return <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>บัญชีนี้ยังไม่ได้เปิดสิทธิ์ขอลา</div>;
  return (
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", margin: "0 18px 9px" }}>
        <b style={{ fontSize: 13, color: "var(--text-1)" }}>ยอดวันลาคงเหลือ ปี {year + 543}</b>
      </div>
      <LnLvBalance bal={bal} />
      <div style={{ padding: "0 14px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 4px 9px" }}>
          <b style={{ fontSize: 13, color: "var(--text-1)" }}>ใบลาของฉัน</b>
          <button onClick={() => setForm(true)}
            style={{ marginLeft: "auto", padding: "8px 15px", borderRadius: 99, border: "none", background: "var(--primary)",
              color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>+ ขอลา</button>
        </div>
        {lv.loading
          ? <div style={{ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
          : mine.length === 0
            ? <div style={Object.assign({ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }, LN_CARD)}>ยังไม่มีใบลา</div>
            : mine.slice(0, 20).map((r) => {
                const st = window.tmOtStatusOf(r.status);
                const t = window.lvTypeOf(types, r.type);
                const canCancel = (r.status === "draft" || r.status === "sent");
                return (
                  <div key={r.id} style={Object.assign({ padding: "12px 14px", marginBottom: 10 }, LN_CARD)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{t.th}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{window.lvDaysTH(r.days)}</span>
                      <span style={{ marginLeft: "auto", padding: "2px 9px", borderRadius: 99, background: st.color + "1A",
                        color: st.color, fontSize: 11, fontWeight: 800 }}>{st.th}</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
                      {window.lvRangeTH(r)}{r.reason ? " · " + r.reason : ""}
                    </div>
                    {r.decidedNote && <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-2)" }}>“{r.decidedNote}” — {r.decidedByName}</div>}
                    {canCancel && (
                      <button onClick={() => cancel(r)}
                        style={{ marginTop: 8, padding: "6px 12px", borderRadius: 99, border: "none", boxShadow: "var(--soft)",
                          background: "var(--surface)", color: "#EF4444", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ยกเลิกใบนี้
                      </button>
                    )}
                  </div>
                );
              })}
      </div>
      {form && <LnLvForm me={me} users={users} rows={lv.rows} quota={quota} types={types} cfg={cfg}
        onSave={lv.save} onClose={() => setForm(false)} />}
    </React.Fragment>
  );
}

/* ── ใบลารออนุมัติ (ในหัวข้อ "รออนุมัติ" ของแท็บเวลา) ── */
function LnApprLeaveSheet({ me, role, rec, store, types, onClose }) {
  const [msg, setMsg] = React.useState("");
  const cur = (store.rows || []).find((r) => r.id === rec.id) || rec;
  const chk = window.lvApproveCheck(cur, me, role);
  const t = window.lvTypeOf(types, cur.type);
  const quota = window.useLeaveQuota().map;
  const b = window.lvBalance(store.rows, quota, cur.userId, window.lvYearOf(cur.from), types).find((x) => x.type.key === cur.type);

  const move = (to, note) => {
    const next = window.lvMove(cur, to, me, note || "");
    if (!next) return;
    store.save(next);
    window.lvNotifyMove(cur, next, me, types);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };

  return (
    <div style={LN_SHEET}>
      <LnApHead kind="leave" no={cur.no} title={(cur.userName || "") + " · " + t.th} sub={window.lvRangeTH(cur)} onClose={onClose} />
      <div style={{ padding: 16, display: "grid", gap: 13 }}>
        <LnApRows rows={[
          ["ประเภท", t.th],
          ["วันที่", window.lvRangeTH(cur)],
          ["จำนวน", window.lvDaysTH(cur.days)],
          ["เหตุผล", cur.reason],
          ["ยอดคงเหลือ", b ? (b.quota == null ? "ไม่จำกัด" : "เหลือ " + window.lvDaysTH(b.left) + " จาก " + window.lvDaysTH(b.quota) + " (รวมใบนี้แล้ว)") : ""],
          ["ส่งถึง", cur.approverName],
        ]} />
        {msg
          ? <div style={{ padding: "13px 15px", borderRadius: 16, background: "var(--primary-soft)", color: "var(--primary-dark)",
              fontSize: 13.5, fontWeight: 700, textAlign: "center" }}>{msg}</div>
          : cur.status !== "sent"
            ? <div style={{ padding: "13px 15px", borderRadius: 16, background: "var(--surface2)", color: "var(--text-3)",
                fontSize: 12.5, textAlign: "center" }}>ใบนี้ไม่ได้อยู่ระหว่างรออนุมัติแล้ว — อาจมีคนอื่นตัดสินไปก่อน</div>
            : !chk.ok
              ? <div style={{ padding: "13px 15px", borderRadius: 16, background: "var(--tint-amber-bg)", color: "var(--tint-amber-tx)",
                  fontSize: 12.5, textAlign: "center" }}>{chk.why}</div>
              : <LnApDecide okText="อนุมัติการลา" noText="ไม่อนุมัติ" busy={false}
                  onOk={() => move("approved", "")} onNo={(note) => move("rejected", note)} />}
        <button onClick={onClose}
          style={{ width: "100%", padding: "13px 14px", borderRadius: 16, border: "1px solid var(--border-strong)", background: "var(--surface)",
            color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
            marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>{msg ? "กลับไปรายการ" : "ปิด"}</button>
      </div>
    </div>
  );
}

function LnApLeaveList({ me, role, store, types }) {
  const [open, setOpen] = React.useState(null);
  const rows = React.useMemo(() => (store.rows || []).filter((r) =>
    r && r.status === "sent" && window.lvApproveCheck(r, me, role).ok), [store.rows, me, role]);
  if (store.loading || !rows.length) return null;
  return (
    <div style={LN_AP_WRAP}>
      <div style={{ margin: "0 4px 9px", fontSize: 11.5, color: "var(--text-3)" }}>ใบลารอคุณตัดสิน · {rows.length} ใบ</div>
      {rows.map((r) => {
        const t = window.lvTypeOf(types, r.type);
        return (
          <LnApCard key={r.id} kind="leave" title={(r.userName || "") + " · " + t.th}
            sub={window.lvRangeTH(r) + (r.reason ? " · " + r.reason : "")} right={window.lvDaysTH(r.days)}
            onClick={() => setOpen(r)} />
        );
      })}
      {open && <LnApprLeaveSheet me={me} role={role} rec={open} store={store} types={types} onClose={() => setOpen(null)} />}
    </div>
  );
}

Object.assign(window, { LnLeavePanel, LnLvForm, LnLvBalance, LnApLeaveList, LnApprLeaveSheet });
