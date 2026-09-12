/* ============================================================
   flash+solar — ใบเบิกเงินหน้างาน: หน้ารายการ · แผงใบเบิก · ยอดรายคน · ยอดรายไซต์

   ตรรกะทั้งหมดอยู่ใน expense.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มยืมของรายงานประจำวัน (window.DrLabel / DrText / DrSection / DrChips / DrRows)
   เพราะทุกโมดูลในระบบต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   ตั้งชื่อ top-level ขึ้นต้นด้วย Ec/ec กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const EC_INPUT = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

function EcPill({ th, color, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      fontSize: 11.5, fontWeight: 700, color: color, background: color + "1a", borderRadius: 99, padding: "3px 10px" }}>
      {th}{sub && <span style={{ fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </span>
  );
}

function EcStat({ label, value, unit, color, hint, on, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ flex: 1, minWidth: 130, textAlign: "left", padding: "11px 13px", borderRadius: 12, fontFamily: "inherit",
        background: on ? (color || "var(--primary)") + "14" : "var(--surface2)",
        border: "1px solid " + (on ? (color || "var(--primary)") : "var(--border)"),
        cursor: onClick ? "pointer" : "default" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 800, color: color, lineHeight: 1.25 }}>
        {value}{unit && <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 3, opacity: .75 }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{hint}</div>}
    </button>
  );
}

/* ── แผงใบเบิกหนึ่งใบ ── */
function EcClaimModal({ claim, job, users, role, currentUser, onClose, onPatch, onMove, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [note, setNote] = React.useState("");
  const [delAsk, setDelAsk] = React.useState(false);
  if (!claim) return null;

  const c = claim;
  const st = window.ecStatusOf(c.status);
  const pay = window.ecPayOf(c.payMethod);
  const kind = window.ecKindOf(c.kind);
  const mine = currentUser && c.byId === currentUser.id;
  /* ใบที่ส่งไปแล้วเจ้าของแก้ไม่ได้ — ไม่งั้นแก้ตัวเลขหลังคนอนุมัติอ่านไปแล้ว
     ใบที่จ่ายแล้วล็อกถาวร เป็นหลักฐานการจ่ายเงิน */
  const locked = c.status !== "draft" || !mine;
  const set = (fields) => { if (!locked) onPatch(c.id, fields); };
  const nexts = window.ecNext(c, role, currentUser);
  const chk = window.ecApproveCheck(c, currentUser, role);
  const canDel = window.ecCanDelete(role) || (mine && c.status === "draft");
  const total = window.ecSum(c.items);
  /* Firebase ทิ้งอ็อบเจกต์ว่างเสมอ — DrRows เพิ่มแถวใหม่เป็น {} เปล่า ๆ
     ใบนี้เขียนตรงลงฐานข้อมูลทุกครั้งที่แก้ (ไม่ได้พักไว้ในฟอร์มแบบรายงานประจำวัน)
     ถ้าไม่เติมช่องว่างให้ครบก่อน แถวที่เพิ่งกดเพิ่มจะหายไปทันทีโดยไม่มีข้อความอะไรบอก */
  const ecRowsClean = (rows) => (rows || []).map((r) => ({
    name: (r && r.name) || "", qty: (r && r.qty) || "", unit: (r && r.unit) || "",
    price: (r && r.price) || "", amount: (r && r.amount) || "",
  }));

  const del = () => {
    if (delAsk) return;
    setDelAsk(true);
    window.askConfirm({
      title: "ลบใบเบิก " + (c.no || "") + " ?",
      body: c.status === "paid" || c.status === "approved"
        ? "ใบนี้ผ่านการอนุมัติแล้ว การลบทิ้งจะทำให้ยอดของ " + (c.byName || "") + " หายไปด้วย"
        : "ลบแล้วกู้คืนไม่ได้",
      danger: true,
    }).then((ok) => { setDelAsk(false); if (ok) { onRemove(c.id); onClose(); } });
  };

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 18, width: "min(760px, 100%)",
          maxHeight: isMobile ? "94dvh" : "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* หัว */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "13px 14px" : "15px 18px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0,
            background: kind.color + "1a" }}>
            <Icon name="wallet" size={17} color={kind.color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>{kind.th}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
              {c.no} · {c.byName || "-"} · {window.drDateTH(c.date)}
            </div>
          </div>
          <EcPill th={st.th} color={st.color} />
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="x" size={15} color="var(--text-2)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 13 : 18 }}>

          {/* ยอดรวม — ตัวเลขที่ทุกคนมาดูก่อนอย่างอื่น */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16,
            padding: "13px 16px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--border)",
            borderLeft: "3px solid " + pay.color }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>ยอดรวมที่ขอเบิก</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 27, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2 }}>
                {window.ecBaht(total)} <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)" }}>บาท</span>
              </div>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <EcPill th={pay.th} color={pay.color} />
              <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>{pay.hint}</div>
            </div>
          </div>

          {/* งานที่ผูกอยู่ */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16,
            fontSize: 12.5, color: "var(--text-2)" }}>
            <Icon name="sun" size={13} color="var(--text-3)" />
            {c.jobId
              ? <span><b style={{ fontFamily: "var(--mono)" }}>{c.siteCode}</b> {c.siteName}
                  {!job && <span style={{ color: "var(--tint-amber-tx)" }}> · งานถูกลบจากฐานข้อมูลแล้ว</span>}</span>
              : <span style={{ color: "var(--text-3)" }}>ไม่ได้ผูกกับงานไหน (ค่าใช้จ่ายทั่วไป)</span>}
          </div>

          {/* 1 · รายละเอียด */}
          <window.DrSection n="1" title="ค่าอะไร จ่ายเมื่อไหร่" tone={kind.color}>
            <window.DrLabel hint="เลือกให้ตรงหมวด จะได้สรุปต้นทุนรายไซต์ได้">หมวดค่าใช้จ่าย</window.DrLabel>
            <window.DrChips options={window.EC_KIND} value={c.kind} disabled={locked}
              onChange={(v) => set({ kind: v || "other" })} />

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <window.DrLabel hint="วันที่จ่ายเงินจริง ไม่ใช่วันที่กรอกใบ">วันที่จ่าย</window.DrLabel>
                <input type="date" value={c.date || ""} disabled={locked}
                  onChange={(e) => set({ date: e.target.value })} style={EC_INPUT} />
              </div>
              <div>
                <window.DrLabel>เงินที่ใช้จ่ายไปเป็นของใคร</window.DrLabel>
                <window.DrChips options={window.EC_PAY} value={c.payMethod} disabled={locked}
                  onChange={(v) => set({ payMethod: v || "own" })} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <window.DrLabel hint="ไม่บังคับ">หมายเหตุ</window.DrLabel>
              <window.DrText value={c.note} disabled={locked} rows={2}
                placeholder="เช่น ซื้อที่ร้านใกล้ไซต์เพราะของในคลังหมด"
                onChange={(v) => set({ note: v })} />
            </div>
          </window.DrSection>

          {/* 2 · รายการ */}
          <window.DrSection n="2" title="รายการที่จ่าย" tone={kind.color}
            hint={"รวม " + window.ecBaht(total) + " บาท"}>
            <window.DrRows disabled={locked} rows={c.items || []} addLabel="เพิ่มรายการ"
              cols={[
                { k: "name", th: "รายการ", w: "40%" },
                { k: "qty", th: "จำนวน", w: "14%", type: "num" },
                { k: "unit", th: "หน่วย", w: "14%" },
                { k: "price", th: "ราคา/หน่วย", w: "16%", type: "num" },
                { k: "amount", th: "รวม (บาท)", w: "16%", type: "num" },
              ]}
              onChange={(rows) => set({ items: ecRowsClean(rows) })} />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 9, lineHeight: 1.55 }}>
              เว้นช่อง “รวม” ไว้ ระบบจะคิดจาก จำนวน × ราคา/หน่วย ให้เอง ·
              ยอดรวมของใบคิดจากรายการเสมอ พิมพ์ทับไม่ได้ เพื่อให้ตรงกับบิลที่แนบ
            </div>
          </window.DrSection>

          {/* 3 · การอนุมัติ */}
          <window.DrSection n="3" title="การอนุมัติ" tone={st.color}
            hint={c.status === "sent" ? (c.approverName ? "รอ " + c.approverName : "รอหัวหน้าอนุมัติ")
              : (c.decidedByName ? "โดย " + c.decidedByName : "")}>
            {c.status === "sent" && !chk.ok && chk.why && (
              <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)",
                border: "1px solid var(--tint-amber-bd)", borderRadius: 9, padding: "8px 11px", marginBottom: 12 }}>
                {chk.why}
              </div>
            )}
            {c.decidedAt && (
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.6 }}>
                {st.key === "rejected" ? "ไม่อนุมัติ" : "อนุมัติ"}โดย <b>{c.decidedByName || "-"}</b> · {window.drDateTH(String(c.decidedAt).slice(0, 10))}
                {c.decidedNote && <div style={{ color: "var(--text-3)" }}>“{c.decidedNote}”</div>}
              </div>
            )}
            {c.paidAt && (
              <div style={{ fontSize: 12, color: "var(--tint-ok-tx)", marginBottom: 12 }}>
                จ่ายคืนแล้วโดย <b>{c.paidByName || "-"}</b> · {window.drDateTH(String(c.paidAt).slice(0, 10))}
              </div>
            )}

            {nexts.length > 0 && (
              <React.Fragment>
                <window.DrLabel hint="ไม่บังคับ · จะถูกบันทึกไว้ในประวัติ">หมายเหตุประกอบการตัดสิน</window.DrLabel>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={Object.assign({}, EC_INPUT, { marginBottom: 11 })}
                  placeholder="เช่น บิลไม่ชัด ขอถ่ายใหม่" />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {nexts.map((s) => (
                    <button key={s.key} onClick={() => { onMove(c, s.key, note); setNote(""); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
                        border: "1px solid " + s.color, background: s.color + "16", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: s.color }}>
                      <Icon name="arrowRight" size={14} color={s.color} /> {s.th}
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
            {!nexts.length && (
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {c.status === "paid" ? "ใบนี้จบแล้ว — ล็อกไว้เป็นหลักฐานการจ่ายเงิน" : "ไม่มีขั้นตอนที่คุณกดได้กับใบนี้"}
              </div>
            )}
          </window.DrSection>

          {/* ประวัติ */}
          {(c.hist || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8 }}>ประวัติ</div>
              {(c.hist || []).slice().reverse().map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 12, color: "var(--text-2)",
                  padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)", flexShrink: 0 }}>
                    {window.drDateTH(String(h.at).slice(0, 10))}
                  </span>
                  <span style={{ flex: 1 }}>
                    {window.ecStatusOf(h.from).th} → <b style={{ color: window.ecStatusOf(h.to).color }}>{window.ecStatusOf(h.to).th}</b>
                    {h.byName ? " · " + h.byName : ""}{h.note ? " · “" + h.note + "”" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canDel && (
            <button onClick={del}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--tint-red-tx)" }}>
              <Icon name="trash" size={13} color="var(--tint-red-tx)" /> ลบใบนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── แถวใบเบิกในรายการ ── */
function EcClaimRow({ claim, onOpen }) {
  const st = window.ecStatusOf(claim.status);
  const kind = window.ecKindOf(claim.kind);
  const pay = window.ecPayOf(claim.payMethod);
  return (
    <button onClick={() => onOpen(claim.id)}
      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
        borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: "3px solid " + st.color, cursor: "pointer", fontFamily: "inherit", marginBottom: 7 }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0,
        background: kind.color + "1a" }}>
        <Icon name="wallet" size={15} color={kind.color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {kind.th}{claim.note ? " · " + claim.note : ""}
        </span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--mono)" }}>
          {claim.no} · {claim.byName || "-"} · {window.drShort(claim.date)}
          {claim.siteCode ? " · " + claim.siteCode : ""}
        </span>
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>
          {window.ecBaht(claim.amount)}
        </span>
        <span style={{ display: "block", marginTop: 3 }}>
          <EcPill th={st.th} color={st.color} />
          {pay.owed && claim.status !== "paid" && <span style={{ fontSize: 10.5, color: pay.color, marginLeft: 5 }}>ออกเงินเอง</span>}
        </span>
      </span>
    </button>
  );
}

/* ── ตารางยอดรายคน ──
   "ค้างจ่าย" คือตัวเลขเดียวในตารางนี้ที่เอาไปจ่ายเงินจริงได้ ที่เหลือเป็นข้อมูลประกอบ */
function EcPersonTable({ claims, users }) {
  const roll = window.ecRollupByPerson(claims);
  const rows = Object.keys(roll).map((k) => roll[k])
    .sort((a, b) => b.owed - a.owed || b.waiting - a.waiting || b.count - a.count);
  const sum = rows.reduce((s, r) => s + r.owed, 0);
  if (!rows.length) {
    return <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>ยังไม่มีใบเบิกในระบบ</div>;
  }
  const th = { textAlign: "right", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap" };
  const td = { textAlign: "right", padding: "10px", fontFamily: "var(--mono)", fontSize: 12.5, whiteSpace: "nowrap" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={Object.assign({}, th, { textAlign: "left" })}>ชื่อ</th>
              <th style={th}>ร่าง</th>
              <th style={th}>รออนุมัติ</th>
              <th style={th}>ค้างจ่าย</th>
              <th style={th}>จ่ายแล้ว</th>
              <th style={th}>ใบ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const u = (users || []).find((x) => x.id === r.id);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                    {r.name}
                    {u && !u.active && <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 500 }}> · ปิดบัญชีแล้ว</span>}
                  </td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.draft ? window.ecBaht(r.draft) : "—"}</td>
                  <td style={Object.assign({}, td, { color: r.waiting ? "#F59E0B" : "var(--text-3)" })}>{r.waiting ? window.ecBaht(r.waiting) : "—"}</td>
                  <td style={Object.assign({}, td, { fontWeight: 800, color: r.owed ? "#EF4444" : "var(--text-3)" })}>{r.owed ? window.ecBaht(r.owed) : "—"}</td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.paid ? window.ecBaht(r.paid) : "—"}</td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.count}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--surface2)" }}>
              <td style={{ padding: "11px 10px", fontSize: 12.5, fontWeight: 800, color: "var(--text-2)" }}>รวมเงินที่บริษัทติดพนักงานอยู่</td>
              <td colSpan={5} style={Object.assign({}, td, { fontSize: 15, fontWeight: 800, color: sum ? "#EF4444" : "var(--text-3)" })}>
                {window.ecBaht(sum)} บาท
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ padding: "9px 12px", fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, borderTop: "1px solid var(--border)" }}>
        “ค้างจ่าย” นับเฉพาะใบที่อนุมัติแล้วและพนักงานออกเงินตัวเองไปก่อน —
        ใบที่จ่ายด้วยเงินสดกองกลางหรือบัญชีบริษัทไม่ใช่หนี้ที่ต้องคืนใคร จึงไม่ถูกนับ
      </div>
    </div>
  );
}

/* ── ยอดรายไซต์ = ต้นทุนจริงหน้างาน ── */
function EcJobTable({ claims }) {
  const roll = window.ecRollupByJob(claims);
  const rows = Object.keys(roll).map((k) => roll[k]).sort((a, b) => b.total - a.total);
  if (!rows.length) {
    return <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
      ยังไม่มีใบเบิกที่ผ่านการอนุมัติ — ต้นทุนรายไซต์จะนับเฉพาะใบที่อนุมัติแล้ว
    </div>;
  }
  return (
    <div>
      {rows.map((r) => (
        <div key={r.jobId} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "11px 13px",
          borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 7 }}>
          <span style={{ flex: 1, minWidth: 180 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{r.name || "-"}</span>
            <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {r.code} · {r.count} ใบ
            </span>
          </span>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(r.byKind).map((k) => (
              <EcPill key={k} th={window.ecKindOf(k).th} color={window.ecKindOf(k).color} sub={window.ecBahtShort(r.byKind[k])} />
            ))}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "var(--text-1)", minWidth: 100, textAlign: "right" }}>
            {window.ecBaht(r.total)}
          </span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, marginTop: 9 }}>
        ตัวเลขนี้คือเงินสดที่จ่ายหน้างานเท่านั้น ไม่รวมค่าของที่เบิกจากคลังและค่าแรงผู้รับเหมา —
        ของในคลังบริษัทซื้อไปก่อนแล้ว คนละก้อนเงินกัน เอาไปเทียบกับ BOQ ตรง ๆ ไม่ได้
      </div>
    </div>
  );
}

/* ── หน้าหลัก ── */
function ExpenseView({ jobs, users, role, currentUser }) {
  const store = window.useEcClaims();
  const [tab, setTab] = React.useState("mine");
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [newJob, setNewJob] = React.useState("");

  const canApprove = window.ecCanApprove(role);
  const uid = currentUser ? currentUser.id : null;

  /* กรองที่ชั้นข้อมูลก่อนเสมอ — คนที่ไม่มีสิทธิ์อนุมัติต้องไม่ได้ข้อมูลใบของคนอื่นติดมือไปด้วย
     ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ */
  const all = React.useMemo(() => window.ecVisible(store.claims, currentUser, role), [store.claims, currentUser, role]);
  const jobById = React.useMemo(() => {
    const m = {}; (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; }); return m;
  }, [jobs]);

  const roll = React.useMemo(() => window.ecRollup(all, currentUser, role), [all, currentUser, role]);

  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let out = all;
    if (tab === "mine") out = out.filter((c) => c.byId === uid);
    else if (tab === "inbox") out = out.filter((c) => c.status === "sent" && window.ecApproveCheck(c, currentUser, role).ok);
    if (kw) out = out.filter((c) => [c.no, c.byName, c.siteCode, c.siteName, c.note, window.ecKindOf(c.kind).th]
      .some((v) => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [all, tab, q, uid, currentUser, role]);

  const openNew = () => {
    const job = newJob ? jobById[newJob] : null;
    const rec = window.ecBlank(job, currentUser, store.claims, users);
    store.save(rec);
    setOpen(rec.id);
    setTab("mine");
  };

  /* เดินสถานะ = เขียนเรคคอร์ดใหม่ + ยิงแจ้งเตือนไปหาคนที่ต้องทำต่อ */
  const move = (c, to, note) => {
    const rec = window.ecMove(c, to, currentUser, note);
    if (!rec) return;
    store.save(rec);
    const money = window.ecBaht(rec.amount) + " บาท";
    const where = rec.siteCode ? " · " + rec.siteCode : "";
    if (to === "sent") {
      window.ecNotify(rec.approverId
        ? { toUserId: rec.approverId, title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
            body: (rec.byName || "") + " · " + money + where }
        : { toPerm: "expenseApprove", title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
            body: (rec.byName || "") + " · " + money + where });
    } else if (to === "approved" || to === "rejected" || to === "paid") {
      window.ecNotify({ toUserId: rec.byId,
        title: (to === "approved" ? "อนุมัติใบเบิกแล้ว · " : to === "rejected" ? "ไม่อนุมัติใบเบิก · " : "จ่ายเงินคืนแล้ว · ") + rec.no,
        body: money + where + (note ? " · " + note : "") });
    }
  };

  const cur = (store.claims || []).find((c) => c.id === open) || null;
  const doneJobs = React.useMemo(() => (jobs || []).slice()
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);

  const TABS = [["mine", "ใบของฉัน", "pen", roll.mineOpen]]
    .concat(canApprove ? [["inbox", "รออนุมัติ", "check", roll.waitingMine]] : [])
    .concat(canApprove ? [["person", "ยอดรายคน", "users", 0], ["job", "ต้นทุนรายไซต์", "sun", 0]] : [])
    .concat([["all", canApprove ? "ทั้งหมด" : "ใบที่เกี่ยวกับฉัน", "list", 0]]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <EcStat label="ใบของฉันที่ยังไม่จบ" value={roll.mineOpen} unit="ใบ" color="var(--text-1)"
          hint={roll.mineOwed ? "รอรับคืน " + window.ecBahtShort(roll.mineOwed) + " บาท" : "ไม่มียอดค้างรับ"}
          on={tab === "mine"} onClick={() => setTab("mine")} />
        {canApprove && (
          <EcStat label="รอฉันอนุมัติ" value={roll.waitingMine} unit="ใบ" color={roll.waitingMine ? "#F59E0B" : "var(--text-1)"}
            hint={"รออนุมัติทั้งระบบ " + roll.sent + " ใบ · " + window.ecBahtShort(roll.sentAmt) + " บาท"}
            on={tab === "inbox"} onClick={() => setTab("inbox")} />
        )}
        {canApprove && (
          <EcStat label="ค้างจ่ายพนักงาน" value={window.ecBahtShort(roll.owedAmt)} unit="บาท" color={roll.owedAmt ? "#EF4444" : "var(--text-1)"}
            hint={"อนุมัติแล้วรอจ่าย " + roll.approved + " ใบ"}
            on={tab === "person"} onClick={() => setTab("person")} />
        )}
        <EcStat label="จ่ายคืนแล้ว" value={roll.paid} unit="ใบ" color="#10B981"
          hint={roll.rejected ? "ไม่อนุมัติ " + roll.rejected + " ใบ" : ""} />
      </div>

      {/* เปิดใบใหม่ */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        padding: "11px 13px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>เปิดใบเบิกใหม่</span>
        <select value={newJob} onChange={(e) => setNewJob(e.target.value)}
          style={Object.assign({}, EC_INPUT, { width: "auto", flex: 1, minWidth: 200, padding: "8px 10px", fontSize: 12.5 })}>
          <option value="">— ไม่ผูกกับงาน (ค่าใช้จ่ายทั่วไป) —</option>
          {doneJobs.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
        </select>
        <button onClick={openNew}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10,
            border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>
          <Icon name="plus" size={14} color="#fff" /> เปิดใบเบิก
        </button>
      </div>

      {/* แท็บ */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {TABS.map(([k, th, ic, n]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99,
              border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
              background: tab === k ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            <Icon name={ic} size={14} color={tab === k ? "var(--primary-dark)" : "var(--text-3)"} /> {th}
            {n > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 800,
              color: tab === k ? "var(--primary-dark)" : "var(--text-3)" }}>{n}</span>}
          </button>
        ))}
      </div>

      {tab === "person" && <EcPersonTable claims={all} users={users} />}
      {tab === "job" && <EcJobTable claims={all} />}

      {tab !== "person" && tab !== "job" && (
        <React.Fragment>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา เลขที่ใบ · ชื่อคน · รหัสงาน · หมายเหตุ"
            style={EC_INPUT} />
          <div>
            {list.map((c) => <EcClaimRow key={c.id} claim={c} onOpen={setOpen} />)}
            {!list.length && (
              <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
                {q ? "ไม่พบใบเบิกที่ตรงกับคำค้น"
                  : tab === "inbox" ? "ไม่มีใบที่รอคุณอนุมัติ"
                  : tab === "mine" ? "ยังไม่มีใบเบิกของคุณ — กด “เปิดใบเบิก” ด้านบน"
                  : "ยังไม่มีใบเบิกในระบบ"}
              </div>
            )}
          </div>
        </React.Fragment>
      )}

      {cur && (
        <EcClaimModal claim={cur} job={jobById[cur.jobId] || null} users={users} role={role} currentUser={currentUser}
          onClose={() => setOpen(null)} onPatch={store.patch} onMove={move} onRemove={store.remove} />
      )}
    </div>
  );
}

Object.assign(window, { EC_INPUT, EcPill, EcStat, EcClaimModal, EcClaimRow, EcPersonTable, EcJobTable, ExpenseView });
