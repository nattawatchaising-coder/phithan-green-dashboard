/* ============================================================
   flash+solar — หน้าเดสก์ท็อปของ "การลา" (แท็บในหน้าเวลาทำงาน)

   ยอดวันลาของฉัน · ใบลาของฉัน · รอฉันอนุมัติ · ใบลาทั้งหมด
   ยอดวันลาทุกคน (กำหนดรายคน) · ประเภทการลา (ยอดตั้งต้น)
   ตรรกะทั้งหมดอยู่ที่ leave.jsx ไฟล์นี้เป็นหน้าจอล้วน

   คำนำหน้า lv / Lv / LV
   ============================================================ */

/* ช่องกรอกแบบหลุม (DESIGN.md) */
const LV_IN = { padding: "9px 11px", borderRadius: "var(--r-chip)", border: "none", background: "var(--surface2)",
  boxShadow: "var(--shadow-inset)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, outline: "none" };
const LV_IN_W = Object.assign({}, LV_IN, { width: "100%" });
const LV_LB = { fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" };
const LV_CARD = { background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)" };
const lvBtn = (main, color) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: "var(--r-chip)",
  border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800,
  background: main ? (color || "var(--primary)") : "var(--surface)", boxShadow: main ? "none" : "var(--shadow-sm)",
  color: main ? "#fff" : (color || "var(--text-1)"),
});

function LvTypeTag({ t }) {
  return <span style={{ padding: "2px 8px", borderRadius: "var(--r-pill)", background: t.color + "1A", color: t.color,
    fontSize: 10.5, fontWeight: 800, whiteSpace: "nowrap" }}>{t.th}</span>;
}

/* ── การ์ดยอดวันลา หนึ่งใบต่อประเภท ── */
function LvBalanceCards({ bal }) {
  const show = (bal || []).filter((b) => b.quota !== 0 || b.used || b.pending);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
      {show.map((b) => {
        const low = b.left != null && b.left <= 0;
        return (
          <div key={b.type.key} style={Object.assign({ padding: "12px 14px", borderLeft: "3px solid " + b.type.color }, LV_CARD)}>
            <div style={{ fontSize: 12, fontWeight: 800, color: b.type.color }}>{b.type.th}</div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800,
                color: low ? "#EF4444" : "var(--text-1)" }}>{b.left == null ? "∞" : Math.round(b.left * 10) / 10}</span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 700 }}>
                {b.quota == null ? "ไม่จำกัด" : "เหลือ / " + Math.round(b.quota * 10) / 10 + " วัน"}
              </span>
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-3)" }}>
              ใช้แล้ว {Math.round(b.used * 10) / 10}{b.pending ? " · รออนุมัติ " + Math.round(b.pending * 10) / 10 : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── ใบลา: เปิด/แก้/ตัดสิน ── */
function LvModal({ rec, cfg, types, users, rows, quota, role, currentUser, onSave, onMove, onDelete, onClose }) {
  const [f, setF] = React.useState(rec);
  const [note, setNote] = React.useState("");
  React.useEffect(() => { setF(rec); }, [rec && rec.id, rec && rec.status]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  if (!f) return null;

  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && f.status === "draft";
  const set = (k, v) => setF((p) => {
    const n = Object.assign({}, p, { [k]: v });
    if (k === "from" && (!n.to || n.to < v)) n.to = v;
    if (n.to !== n.from) n.part = "full";
    n.days = window.lvCountDays(n.from, n.to, n.part, cfg);
    return n;
  });
  const bal = window.lvBalance(rows, quota, f.userId, window.lvYearOf(f.from), types);
  const why = window.lvSendWhy(f, bal);
  const nexts = window.lvNext(f, role, currentUser).filter((s) => s.key !== "sent" || !why);
  const apprWhy = window.lvApproveCheck(f, currentUser, role).why;
  const one = f.from === (f.to || f.from);
  /* ประเภทที่เลือกได้ = มียอด (หรือไม่จำกัด) — ลาคลอดที่ยอด 0 ไม่ต้องขึ้นให้ทุกคน */
  const pickable = bal.filter((b) => b.quota !== 0 || b.type.key === f.type);
  const t = window.lvTypeOf(types, f.type);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", padding: 18 }} {...box}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px,100%)", maxHeight: "90vh", overflow: "auto", background: "var(--surface)",
        boxShadow: "var(--shadow-card)", borderRadius: 17, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{f.no}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>
              {editable ? "ขอลา" : window.tmNameOf(users, f.userId, f.userName)}
            </div>
          </div>
          <window.TmPill s={f.status} />
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color="var(--text-3)" />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
          <span style={LV_LB}>ประเภทการลา</span>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {(editable ? pickable : bal.filter((b) => b.type.key === f.type)).map((b) => {
              const on = f.type === b.type.key;
              return (
                <button key={b.type.key} disabled={!editable} onClick={() => set("type", b.type.key)}
                  style={{ padding: "7px 12px", borderRadius: "var(--r-pill)", border: "none", fontFamily: "inherit",
                    cursor: editable ? "pointer" : "default", fontSize: 12.5, fontWeight: 700,
                    background: on ? b.type.color + "1A" : "var(--surface)",
                    boxShadow: on ? "inset 0 0 0 1px " + b.type.color : "var(--shadow-sm)",
                    color: on ? b.type.color : "var(--text-2)" }}>
                  {b.type.th}
                  <span style={{ marginLeft: 6, fontFamily: "var(--mono)", fontSize: 11, opacity: .8 }}>
                    {b.left == null ? "∞" : "เหลือ " + Math.round(b.left * 10) / 10}
                  </span>
                </button>
              );
            })}
            {!f.type && !editable && <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>—</span>}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={LV_LB}>ตั้งแต่วันที่</span>
            <input type="date" value={f.from} disabled={!editable} onChange={(e) => set("from", e.target.value)} style={LV_IN_W} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={LV_LB}>ถึงวันที่</span>
            <input type="date" value={f.to || f.from} min={f.from} disabled={!editable} onChange={(e) => set("to", e.target.value)} style={LV_IN_W} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={LV_LB}>ช่วงเวลา</span>
            <select value={one ? f.part || "full" : "full"} disabled={!editable || !one} onChange={(e) => set("part", e.target.value)} style={LV_IN_W}>
              {window.LV_PART.map((p) => <option key={p.key} value={p.key}>{p.th}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)" }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็นวันลา </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: f.days ? "var(--primary-dark)" : "var(--text-3)" }}>
            {window.lvDaysTH(f.days)}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}> · นับเฉพาะวันทำงาน (ตัดวันหยุดตามตั้งค่าเวลาทำงาน)</span>
        </div>

        <label style={{ marginTop: 12, display: "grid", gap: 4 }}>
          <span style={LV_LB}>เหตุผล</span>
          <textarea value={f.reason || ""} disabled={!editable} rows={3} onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ไม่สบาย มีไข้ · ไปทำธุระที่อำเภอ" style={Object.assign({}, LV_IN_W, { resize: "vertical", lineHeight: 1.6 })} />
        </label>

        <label style={{ marginTop: 10, display: "grid", gap: 4 }}>
          <span style={LV_LB}>ส่งให้ใครอนุมัติ</span>
          {editable ? (
            <select value={f.approverId || ""} style={LV_IN_W}
              onChange={(e) => {
                const u = (users || []).find((x) => x.id === e.target.value);
                setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
              }}>
              <option value="">— ใครก็ได้ที่มีสิทธิ์อนุมัติ —</option>
              {window.lvApprovers(users, { id: f.userId }).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          ) : <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{f.approverName || "ใครก็ได้ที่มีสิทธิ์"}</span>}
        </label>

        {f.decidedAt && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: "var(--r-chip)", background: "var(--surface2)", fontSize: 12, color: "var(--text-2)" }}>
            {window.tmOtStatusOf(f.status).th} โดย {f.decidedByName || "-"} · {window.drShort(String(f.decidedAt).slice(0, 10))}
            {f.decidedNote ? <div style={{ marginTop: 3 }}>“{f.decidedNote}”</div> : null}
          </div>
        )}

        {editable && f.type && <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--text-3)" }}>{t.th} · {window.lvAdvTH(t)}</div>}
        {editable && why && <div style={{ marginTop: 10, fontSize: 12, color: "#F59E0B", fontWeight: 700 }}>{why}</div>}
        {f.status === "sent" && !mine && window.lvApproveCheck(f, currentUser, role).ok && (
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุถึงผู้ลา (ไม่บังคับ)"
            style={Object.assign({}, LV_IN_W, { marginTop: 12 })} />
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {editable && <button onClick={() => { onSave(f); onClose(); }} style={lvBtn(false)}>บันทึกร่าง</button>}
          {nexts.map((s) => {
            const soft = s.key === "cancelled" || (s.key === "draft" && f.status === "sent" && !mine);
            const label = s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ"
              : s.key === "cancelled" ? "ยกเลิกใบนี้" : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
            return (
              <button key={s.key} onClick={() => { onMove(f, s.key, note); onClose(); }}
                style={soft ? lvBtn(false, s.color) : lvBtn(true, s.color)}>{label}</button>
            );
          })}
          {f.status === "sent" && !mine && apprWhy && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{apprWhy}</span>}
          {mine && f.status === "draft" && onDelete && (
            <button onClick={() => { onDelete(f.id); onClose(); }}
              style={Object.assign(lvBtn(false, "var(--tint-red-tx2)"), { marginLeft: "auto" })}>ลบใบนี้</button>
          )}
        </div>
        {t && t.days == null && f.type && <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>{t.th} ไม่หักยอดวันลา</div>}
      </div>
    </div>
  );
}

function LvRow({ rec, users, types, onOpen }) {
  const t = window.lvTypeOf(types, rec.type);
  return (
    <button onClick={() => onOpen(rec)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none",
        borderBottom: "1px solid var(--divider)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{rec.no}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.tmNameOf(users, rec.userId, rec.userName)}</span>
        <LvTypeTag t={t} />
        <window.TmPill s={rec.status} size="sm" />
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{window.lvDaysTH(rec.days)}</span>
      </div>
      <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
        {window.lvRangeTH(rec)}{rec.reason ? " · " + rec.reason : ""}{rec.approverName ? " · ถึง " + rec.approverName : ""}
      </div>
    </button>
  );
}

/* ── ยอดวันลาทุกคน — กำหนดรายคน ──
   ช่องว่าง = ใช้ยอดตั้งต้นของประเภท (ตัวเลขจาง) · พิมพ์ตัวเลข = ยอดเฉพาะคนนี้ */
function LvQuotaTable({ users, types, rows, quota, year }) {
  const people = React.useMemo(() => (users || [])
    .filter((u) => u && u.id && u.active !== false && window.can(window.userRoles(u), "leave"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th")), [users]);
  const [q, setQ] = React.useState("");
  const list = people.filter((u) => !q.trim() || String(u.name || "").toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div className="search-box" style={{ width: 260 }}>
          <Icon name="search" size={15} color="var(--text-3)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ" />
        </div>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
          ปี {year + 543} · ช่องว่าง = ใช้ยอดตั้งต้น (ตัวจาง) · พิมพ์เลข = ยอดเฉพาะคนนี้ · บันทึกเมื่อออกจากช่อง
        </span>
      </div>
      <div style={Object.assign({ overflow: "auto" }, LV_CARD)}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ textAlign: "left", padding: "9px 13px", color: "var(--text-3)", fontWeight: 700 }}>พนักงาน</th>
              {types.map((t) => (
                <th key={t.key} style={{ padding: "9px 10px", color: t.color, fontWeight: 800, whiteSpace: "nowrap" }}>
                  {t.th}<div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>ตั้งต้น {t.days == null ? "ไม่จำกัด" : t.days}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const bal = window.lvBalance(rows, quota.map, u.id, year, types);
              const own = ((quota.map[u.id] || {})[year]) || {};
              return (
                <tr key={u.id} style={{ borderTop: "1px solid var(--divider)" }}>
                  <td style={{ padding: "8px 13px", fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap" }}>{u.name}</td>
                  {bal.map((b) => {
                    const v = own[b.type.key];
                    return (
                      <td key={b.type.key} style={{ padding: "6px 10px", textAlign: "center" }}>
                        <input key={u.id + b.type.key + String(v)} defaultValue={v === "inf" ? "" : v == null ? "" : v}
                          placeholder={b.type.days == null ? "∞" : String(b.type.days)} inputMode="decimal"
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            const cur = v == null ? "" : String(v);
                            if (raw === cur) return;
                            quota.set(u.id, year, b.type.key, raw === "" ? null : raw);
                          }}
                          style={Object.assign({}, LV_IN, { width: 64, textAlign: "center", fontFamily: "var(--mono)", padding: "6px 6px" })} />
                        <div style={{ marginTop: 3, fontSize: 10.5, color: b.left != null && b.left < 0 ? "#EF4444" : "var(--text-3)", whiteSpace: "nowrap" }}>
                          ใช้ {Math.round(b.used * 10) / 10}{b.pending ? " +รอ " + Math.round(b.pending * 10) / 10 : ""}
                          {b.left != null ? " · เหลือ " + Math.round(b.left * 10) / 10 : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>ไม่มีพนักงานที่มีสิทธิ์ลา</div>}
      </div>
    </div>
  );
}

/* ── ประเภทการลา + ยอดตั้งต้นต่อปี ── */
function LvTypesEditor({ types, onSave }) {
  const [list, setList] = React.useState(types);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => { setList(types); }, [types]);
  const upd = (i, k, v) => { setSaved(false); setList((p) => p.map((t, j) => (j === i ? Object.assign({}, t, { [k]: v }) : t))); };
  const COLS = ["#EF4444", "#F59E0B", "#0EA5E9", "#EC4899", "#10B981", "#8B5CF6", "#64748B"];
  return (
    <div style={Object.assign({ padding: 16, display: "grid", gap: 10, maxWidth: 860 }, LV_CARD)}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ประเภทการลา · ยอดตั้งต้นต่อปี</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
        ใช้กับทุกคนที่ไม่ได้กำหนดยอดเฉพาะตัวในแท็บ “ยอดวันลาทุกคน” · ช่องจำนวนวันเว้นว่าง = ไม่จำกัด (ไม่หักยอด) · 0 = ไม่มีสิทธิ์ลาประเภทนี้ (ตั้งเฉพาะคนได้)
        · ยื่นล่วงหน้า = ต้องส่งใบก่อนวันเริ่มลาอย่างน้อยกี่วัน (0 = วันเดียวกันได้) · ย้อนหลังได้ = ยื่นหลังวันที่ลาได้ (เช่น ลาป่วย)
      </div>
      {list.map((t, i) => (
        <div key={t.key} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={t.th} onChange={(e) => upd(i, "th", e.target.value)} style={Object.assign({}, LV_IN, { flex: "1 1 160px" })} />
          <input value={t.days == null ? "" : t.days} placeholder="ไม่จำกัด" inputMode="decimal"
            onChange={(e) => upd(i, "days", e.target.value === "" ? null : e.target.value)}
            style={Object.assign({}, LV_IN, { width: 90, textAlign: "center", fontFamily: "var(--mono)" })} />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>วัน/ปี · ยื่นล่วงหน้า</span>
          <input value={t.adv == null ? "" : t.adv} placeholder="0" inputMode="numeric"
            onChange={(e) => upd(i, "adv", e.target.value === "" ? 0 : e.target.value)}
            style={Object.assign({}, LV_IN, { width: 60, textAlign: "center", fontFamily: "var(--mono)" })} />
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>วัน</span>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-2)", cursor: "pointer" }}>
            <input type="checkbox" checked={!!t.back} onChange={(e) => upd(i, "back", e.target.checked)} /> ย้อนหลังได้
          </label>
          <div style={{ display: "flex", gap: 4 }}>
            {COLS.map((c) => (
              <button key={c} onClick={() => upd(i, "color", c)} title={c}
                style={{ width: 18, height: 18, borderRadius: 99, border: "none", cursor: "pointer", background: c,
                  boxShadow: t.color === c ? "0 0 0 2px var(--surface), 0 0 0 4px " + c : "none" }} />
            ))}
          </div>
          <button onClick={() => { setSaved(false); setList((p) => p.filter((_, j) => j !== i)); }} title="ลบประเภทนี้"
            style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="trash" size={15} color="var(--text-3)" />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => { setSaved(false); setList((p) => p.concat([{ key: "t" + Date.now().toString(36), th: "ประเภทใหม่", days: 0, color: "#10B981" }])); }}
          style={lvBtn(false)}><Icon name="plus" size={14} /> เพิ่มประเภท</button>
        <button onClick={() => { onSave(list); setSaved(true); }} style={lvBtn(true)}>บันทึก</button>
        {saved && <span style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 700 }}>บันทึกแล้ว</span>}
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>ลบประเภทแล้ว ใบลาเก่าของประเภทนั้นยังอยู่ แต่ไม่ขึ้นในยอด</span>
      </div>
    </div>
  );
}

/* ── แท็บ "การลา" ── */
function LeaveTab({ users, role, currentUser, cfg }) {
  const lv = window.useLeaves();
  const tp = window.useLeaveTypes();
  const quota = window.useLeaveQuota();
  const types = tp.types;
  const uid = (currentUser || {}).id || null;
  const [year, setYear] = React.useState(+String(window.drToday()).slice(0, 4));
  const [sub, setSub] = React.useState("mine");
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");

  const canAppr = window.lvCanApprove(role);
  const canAll = canAppr || window.can(role, "attendAll");
  const canQuota = window.lvCanQuota(role);
  const canTypes = window.can(role, "manageUsers");

  const visible = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role), [lv.rows, currentUser, role]);
  const myBal = React.useMemo(() => window.lvBalance(lv.rows, quota.map, uid, year, types), [lv.rows, quota.map, uid, year, types]);
  const waiting = React.useMemo(() => visible.filter((r) => r.status === "sent" && window.lvApproveCheck(r, currentUser, role).ok),
    [visible, currentUser, role]);

  const list = React.useMemo(() => {
    let out = sub === "mine" ? visible.filter((r) => r.userId === uid)
      : sub === "inbox" ? waiting
      : visible.filter((r) => window.lvYearOf(r.from) === year);
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter((r) => [r.no, r.userName, r.reason, window.lvTypeOf(types, r.type).th]
      .some((v) => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [sub, visible, waiting, uid, year, q, types]);

  const openNew = () => {
    const rec = window.lvBlank(currentUser, users, lv.rows, cfg);
    lv.save(rec); setOpen(rec.id); setSub("mine");
  };
  const move = (rec, to, note) => {
    const next = window.lvMove(Object.assign({}, rec, { days: window.lvCountDays(rec.from, rec.to, rec.part, cfg) }), to, currentUser, note || "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(rec, next, currentUser, types);
  };

  const SUBS = [["mine", "ใบลาของฉัน", 0]]
    .concat(canAppr ? [["inbox", "รอฉันอนุมัติ", waiting.length]] : [])
    .concat(canAll ? [["all", "ใบลาทั้งหมด", 0]] : [])
    .concat(canQuota ? [["quota", "ยอดวันลาทุกคน", 0]] : [])
    .concat(canTypes ? [["types", "ประเภทการลา", 0]] : []);
  const cur = (lv.rows || []).find((r) => r.id === open) || null;
  const can = window.lvCanLeave(role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ยอดวันลาของฉัน</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setYear(year - 1)} style={lvBtn(false)}>‹</button>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, minWidth: 56, textAlign: "center" }}>ปี {year + 543}</span>
          <button onClick={() => setYear(year + 1)} style={lvBtn(false)}>›</button>
        </div>
        <button onClick={openNew} disabled={!can} style={Object.assign(lvBtn(can), { marginLeft: "auto", opacity: can ? 1 : .5 })}>
          <Icon name="plus" size={14} color={can ? "#fff" : "var(--text-3)"} /> ขอลา
        </button>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ขอลาจากแอปในไลน์ได้เหมือนกัน (แท็บเวลา → การลา)</span>
      </div>

      <LvBalanceCards bal={myBal} />

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {SUBS.map(([k, th, n]) => (
          <button key={k} onClick={() => setSub(k)}
            style={{ padding: "7px 13px", borderRadius: "var(--r-pill)", border: "none", fontFamily: "inherit", cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, boxShadow: sub === k ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
              background: sub === k ? "var(--primary-soft)" : "var(--surface)", color: sub === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            {th}{n > 0 && <span style={{ marginLeft: 6, fontFamily: "var(--mono)", fontWeight: 800, color: "#F59E0B" }}>{n}</span>}
          </button>
        ))}
      </div>

      {sub === "quota" && canQuota && <LvQuotaTable users={users} types={types} rows={lv.rows} quota={quota} year={year} />}
      {sub === "types" && canTypes && <LvTypesEditor types={types} onSave={tp.save} />}

      {(sub === "mine" || sub === "inbox" || sub === "all") && (
        <React.Fragment>
          {sub !== "mine" && (
            <div className="search-box" style={{ width: "100%", maxWidth: 420 }}>
              <Icon name="search" size={15} color="var(--text-3)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา ชื่อ · ประเภท · เหตุผล" />
            </div>
          )}
          <div style={Object.assign({ overflow: "hidden" }, LV_CARD)}>
            {list.length === 0
              ? <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                  {sub === "inbox" ? "ไม่มีใบลารอคุณอนุมัติ" : "ยังไม่มีใบลา"}
                </div>
              : list.map((r) => <LvRow key={r.id} rec={r} users={users} types={types} onOpen={(x) => setOpen(x.id)} />)}
          </div>
        </React.Fragment>
      )}

      {cur && <LvModal rec={cur} cfg={cfg} types={types} users={users} rows={lv.rows} quota={quota.map} role={role}
        currentUser={currentUser} onSave={lv.save} onMove={move} onDelete={lv.remove} onClose={() => setOpen(null)} />}
    </div>
  );
}

Object.assign(window, { LeaveTab, LvModal, LvRow, LvBalanceCards, LvQuotaTable, LvTypesEditor, LvTypeTag });
