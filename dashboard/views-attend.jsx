/* ============================================================
   flash+solar — หน้าเดสก์ท็อปของ "เวลาทำงาน" (ลงเวลา + OT)

   สามแท็บ: แผ่นเวลารายวัน · ใบ OT · ตั้งค่าเวลาทำงาน
   ตรรกะทั้งหมดอยู่ที่ attend.jsx ไฟล์นี้เป็นหน้าจอล้วน

   ── สิ่งที่หน้านี้ต้องพูดให้ชัด ไม่ใช่ซ่อน ──
   1. งานที่ช่างระบุบนใบลงเวลาเป็น "คำบอก" ไม่ใช่สิ่งที่ระบบตรวจสอบ
   2. ใบที่ไม่มีพิกัดต้องเห็นเป็นธง ไม่ใช่ช่องว่างที่ดูเหมือนไม่มีอะไรผิด
   คนอ่านแผ่นเวลาต้องรู้ว่าตัวเลขตรงหน้าเชื่อได้แค่ไหน ไม่งั้นจะเอาไปตัดสินคนผิด ๆ

   คำนำหน้า tm / Tm / TM
   ============================================================ */

const TM_IN = { padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, outline: "none" };

function TmPill({ s, size }) {
  const st = window.tmOtStatusOf(s);
  return <span style={{ padding: size === "sm" ? "2px 8px" : "3px 10px", borderRadius: 99, background: st.color + "1A",
    color: st.color, fontSize: size === "sm" ? 10.5 : 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>{st.th}</span>;
}

function TmStat({ label, value, unit, color, hint, on, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      style={{ flex: "1 1 180px", minWidth: 165, textAlign: "left", padding: "12px 14px", borderRadius: 13,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"), background: on ? "var(--primary-soft)" : "var(--surface)",
        cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ marginTop: 3, display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: color || "var(--text-1)" }}>{value}</span>
        {unit && <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 700 }}>{unit}</span>}
      </div>
      {hint && <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{hint}</div>}
    </button>
  );
}

/* ── แผ่นเวลารายวัน ── */
function TmDaySheet({ date, setDate, cfg, users }) {
  const day = window.useAttendDay(date);
  const holiday = window.tmIsHoliday(date, cfg);
  const workday = window.tmIsWorkday(date, cfg);

  /* คนที่ "ควรจะมา" แต่ไม่มีใบเลย — สำคัญกว่าคนที่มาแล้ว เพราะช่องว่างมองไม่เห็นด้วยตา */
  const missing = React.useMemo(() => {
    if (!workday) return [];
    const have = {}; (day.rows || []).forEach((r) => { have[r.userId] = 1; });
    return (users || []).filter((u) => u && u.active !== false && window.can(window.userRoles(u), "attend") && !have[u.id]);
  }, [day.rows, users, workday]);

  const totalMins = (day.rows || []).reduce((a, r) => a + (+r.mins || 0), 0);
  const noGps = (day.rows || []).filter((r) => !r.gps).length;
  const stillIn = (day.rows || []).filter((r) => r.in && !r.out).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setDate(window.drAddDays(date, -1))} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>‹ ก่อนหน้า</button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value || window.drToday())} style={TM_IN} />
        <button onClick={() => setDate(window.drAddDays(date, 1))} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>ถัดไป ›</button>
        <button onClick={() => setDate(window.drToday())} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>วันนี้</button>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.drDateTH(date, true)}</div>
        {holiday ? <span style={{ padding: "3px 10px", borderRadius: 99, background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontSize: 11.5, fontWeight: 800 }}>
          วันหยุด · {window.tmWhNorm(cfg).holidays[date]}</span>
          : !workday ? <span style={{ padding: "3px 10px", borderRadius: 99, background: "var(--surface3)", color: "var(--text-2)", fontSize: 11.5, fontWeight: 800 }}>นอกวันทำงาน</span> : null}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TmStat label="ลงเวลาแล้ว" value={(day.rows || []).length} unit="คน" />
        <TmStat label="ยังไม่ได้ลงเวลา" value={missing.length} unit="คน" color={missing.length ? "#F59E0B" : "var(--text-1)"}
          hint={workday ? "" : "วันนี้ไม่ใช่วันทำงานมาตรฐาน"} />
        <TmStat label="ยังไม่ออกงาน" value={stillIn} unit="คน" color={stillIn ? "#EF4444" : "var(--text-1)"}
          hint={stillIn ? "อาจลืมกดออก — ทักถามก่อนหักเวลา" : ""} />
        <TmStat label="ชั่วโมงรวม" value={Math.round(totalMins / 60)} unit="ชม." hint={noGps ? noGps + " ใบไม่มีพิกัด" : "ทุกใบมีพิกัด"} />
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["ชื่อ", "เข้า", "ออก", "ชั่วโมง", "งานที่แจ้ง", "พิกัด"].map((h, i) => (
                <th key={h} style={{ textAlign: i >= 1 && i <= 3 ? "center" : "left", padding: "10px 13px", fontSize: 11.5,
                  fontWeight: 800, color: "var(--text-3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {day.loading && <tr><td colSpan={6} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>กำลังโหลด…</td></tr>}
            {!day.loading && (day.rows || []).length === 0 && (
              <tr><td colSpan={6} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>ยังไม่มีใครลงเวลาในวันนี้</td></tr>
            )}
            {(day.rows || []).map((r) => (
              <tr key={r.userId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "9px 13px", fontWeight: 700, color: "var(--text-1)" }}>{r.name || r.userId}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{r.in || "—"}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700,
                  color: r.in && !r.out ? "#EF4444" : "var(--text-1)" }}>{r.out || (r.in ? "ยังไม่ออก" : "—")}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", color: "var(--text-2)" }}>{window.tmDur(r.mins)}</td>
                <td style={{ padding: "9px 13px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)" }}>{r.jobCode || "—"}</td>
                <td style={{ padding: "9px 13px" }}>
                  {r.gps ? <span style={{ fontSize: 11.5, color: "#10B981", fontWeight: 700 }}>มีพิกัด</span>
                    : <span style={{ fontSize: 11.5, color: "#F59E0B", fontWeight: 700 }}>ไม่มีพิกัด</span>}
                </td>
              </tr>
            ))}
            {missing.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                <td style={{ padding: "9px 13px", fontWeight: 700, color: "var(--text-3)" }}>{u.name}</td>
                <td colSpan={5} style={{ padding: "9px 13px", fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้ลงเวลา</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        ช่อง “งานที่แจ้ง” คือสิ่งที่ผู้ลงเวลาเลือกเอง ระบบไม่ได้ตรวจว่าอยู่ที่ไซต์นั้นจริงหรือไม่ —
        ยังไม่มีพิกัดไซต์ที่เชื่อถือได้ในระบบ จึงเทียบระยะไม่ได้
        <br />“ไม่มีพิกัด” เกิดได้ทั้งจากปิดสิทธิ์ตำแหน่ง สัญญาณไม่ถึง หรืออยู่ในอาคาร — ระบบไม่เคยบล็อกการลงเวลาด้วยเหตุนี้
      </div>
    </div>
  );
}

/* ── ใบ OT หนึ่งใบ ── */
function TmOtModal({ rec, cfg, jobs, role, currentUser, onSave, onMove, onDelete, onClose }) {
  const [f, setF] = React.useState(rec);
  React.useEffect(() => { setF(rec); }, [rec && rec.id]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  if (!f) return null;

  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && (f.status === "draft");
  const set = (k, v) => setF((p) => {
    const next = Object.assign({}, p, { [k]: v });
    next.mins = window.tmOtMinutes(next.date, next.from, next.to, cfg);
    return next;
  });
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg);
  const span = window.tmSpanMins(f.from, f.to);
  const nexts = window.tmOtNext(f, role, currentUser);
  const why = window.tmOtApproveCheck(f, currentUser, role).why;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", padding: 18 }} {...box}>
      <div style={{ width: "min(620px,100%)", maxHeight: "90vh", overflow: "auto", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 17, padding: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{f.no}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{f.userName}</div>
          </div>
          <TmPill s={f.status} />
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color="var(--text-3)" />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>วันที่</span>
            <input type="date" value={f.date} disabled={!editable} onChange={(e) => set("date", e.target.value)} style={TM_IN} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตั้งแต่</span>
            <input type="time" value={f.from} disabled={!editable} onChange={(e) => set("from", e.target.value)} style={TM_IN} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <input type="time" value={f.to} disabled={!editable} onChange={(e) => set("to", e.target.value)} style={TM_IN} />
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ประเภท</span>
            <select value={f.kind} disabled={!editable} onChange={(e) => set("kind", e.target.value)} style={TM_IN}>
              {window.TM_OT_KIND.map((k) => <option key={k.key} value={k.key}>{k.th}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็น OT</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800,
              color: mins ? "var(--primary-dark)" : "var(--text-3)" }}>{window.tmDur(mins)}</span>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>จากช่วงที่กรอกทั้งหมด {window.tmDur(span)}</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {window.tmIsWorkday(f.date, cfg)
              ? "วันทำงานปกติ — ตัดช่วงที่ทับเวลางาน " + window.tmWhNorm(cfg).start + "-" + window.tmWhNorm(cfg).end + " ออกแล้ว"
              : "นอกวันทำงาน — นับทั้งช่วง"}
            {window.tmWhNorm(cfg).roundMins > 0 ? " · ปัดลงทีละ " + window.tmWhNorm(cfg).roundMins + " นาที" : ""}
            {window.tmWhNorm(cfg).minOtMins > 0 ? " · ไม่ถึง " + window.tmWhNorm(cfg).minOtMins + " นาทีไม่นับ" : ""}
          </div>
        </div>

        <label style={{ marginTop: 12, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>งานที่เกี่ยวข้อง</span>
          <select value={f.jobId || ""} disabled={!editable}
            onChange={(e) => {
              const j = (jobs || []).find((x) => x.id === e.target.value);
              setF((p) => Object.assign({}, p, { jobId: j ? j.id : null, jobCode: j ? j.code : "" }));
            }} style={TM_IN}>
            <option value="">— ไม่ระบุงาน —</option>
            {(jobs || []).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
        </label>

        <label style={{ marginTop: 10, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เหตุผลที่ต้องทำนอกเวลา</span>
          <textarea value={f.reason || ""} disabled={!editable} rows={3}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ต้องปิดงานให้ทันก่อนการไฟฟ้าเข้าตรวจพรุ่งนี้เช้า"
            style={Object.assign({}, TM_IN, { resize: "vertical", lineHeight: 1.6 })} />
        </label>

        {f.approverName && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>ส่งถึง {f.approverName}</div>
        )}
        {f.decidedAt && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 11, background: "var(--surface2)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
            {window.tmOtStatusOf(f.status).th} โดย {f.decidedByName || "-"} · {window.drShort(String(f.decidedAt).slice(0, 10))}
            {f.decidedNote ? <div style={{ marginTop: 3 }}>“{f.decidedNote}”</div> : null}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {editable && (
            <button onClick={() => { onSave(Object.assign({}, f, { mins })); onClose(); }}
              style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>บันทึกร่าง</button>
          )}
          {nexts.map((s) => (
            <button key={s.key} onClick={() => { onMove(Object.assign({}, f, { mins }), s.key); onClose(); }}
              style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: s.color, color: "#fff",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>
              {s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ" : "เอากลับมาแก้"}
            </button>
          ))}
          {f.status === "sent" && !mine && why && (
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{why}</span>
          )}
          {mine && f.status === "draft" && onDelete && (
            <button onClick={() => { onDelete(f.id); onClose(); }}
              style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: 10, border: "1px solid var(--border-strong)",
                background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>ลบใบนี้</button>
          )}
        </div>
      </div>
    </div>
  );
}

function TmOtRow({ rec, onOpen }) {
  const k = window.tmOtKindOf(rec.kind);
  return (
    <button onClick={() => onOpen(rec)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none",
        borderBottom: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{rec.no}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{rec.userName}</span>
        <span style={{ padding: "2px 8px", borderRadius: 99, background: k.color + "1A", color: k.color, fontSize: 10.5, fontWeight: 800 }}>{k.th}</span>
        <TmPill s={rec.status} size="sm" />
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{window.tmDur(rec.mins)}</span>
      </div>
      <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
        {window.drDateTH(rec.date)} · {rec.from}-{rec.to}{rec.jobCode ? " · " + rec.jobCode : ""}
        {rec.reason ? " · " + rec.reason : ""}
      </div>
    </button>
  );
}

/* ── ตั้งค่าเวลาทำงาน ── */
function TmWorkHours({ cfg, onSave }) {
  const [f, setF] = React.useState(window.tmWhNorm(cfg));
  React.useEffect(() => { setF(window.tmWhNorm(cfg)); }, [cfg]);
  const [hDate, setHDate] = React.useState("");
  const [hName, setHName] = React.useState("");
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เข้างาน</span>
          <input type="time" value={f.start} onChange={(e) => set("start", e.target.value)} style={TM_IN} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เลิกงาน</span>
          <input type="time" value={f.end} onChange={(e) => set("end", e.target.value)} style={TM_IN} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>พักกลางวัน (นาที)</span>
          <input type="number" min={0} value={f.lunchMins} onChange={(e) => set("lunchMins", +e.target.value)} style={TM_IN} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>OT ขั้นต่ำที่นับ (นาที)</span>
          <input type="number" min={0} value={f.minOtMins} onChange={(e) => set("minOtMins", +e.target.value)} style={TM_IN} />
        </label>
        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ปัดเศษ OT ทีละ (นาที)</span>
          <input type="number" min={0} value={f.roundMins} onChange={(e) => set("roundMins", +e.target.value)} style={TM_IN} />
        </label>
      </div>

      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>วันทำงานประจำสัปดาห์</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAYS.map((d, i) => {
            const on = f.days.indexOf(i) >= 0;
            return (
              <button key={i} onClick={() => set("days", on ? f.days.filter((x) => x !== i) : f.days.concat([i]).sort())}
                style={{ width: 46, padding: "8px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800,
                  border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                  background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-3)" }}>{d}</button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>วันหยุดที่บริษัทประกาศ</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
          <input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} style={TM_IN} />
          <input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="ชื่อวันหยุด" style={Object.assign({}, TM_IN, { flex: 1, minWidth: 160 })} />
          <button disabled={!hDate}
            onClick={() => { set("holidays", Object.assign({}, f.holidays, { [hDate]: hName || "วันหยุด" })); setHDate(""); setHName(""); }}
            style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: hDate ? "var(--primary)" : "var(--surface3)",
              color: hDate ? "#fff" : "var(--text-3)", cursor: hDate ? "pointer" : "default", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>เพิ่ม</button>
        </div>
        {Object.keys(f.holidays || {}).sort().map((d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)" }}>{window.drDateTH(d)}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>{f.holidays[d]}</span>
            <button onClick={() => { const h = Object.assign({}, f.holidays); delete h[d]; set("holidays", h); }}
              style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "#EF4444", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>ลบ</button>
          </div>
        ))}
        {Object.keys(f.holidays || {}).length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้ประกาศวันหยุดพิเศษ</div>}
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        ค่าพวกนี้ใช้คำนวณว่า “ช่วงเวลาที่ขอมานับเป็น OT กี่นาที” เท่านั้น
        ระบบไม่คิดค่าตอบแทนให้ เพราะอัตราค่าแรงรายคนไม่ได้อยู่ในระบบนี้ — การเดาแทนฝ่ายบุคคลอันตรายกว่าไม่บอกเลย
        <br />การแก้ค่าที่นี่ไม่ย้อนไปเปลี่ยนใบเก่า ใบที่อนุมัติไปแล้วเก็บจำนวนนาทีไว้ในตัวใบของมันเอง
      </div>

      <div>
        <button onClick={() => onSave(f)}
          style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff",
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>บันทึกเวลาทำงาน</button>
      </div>
    </div>
  );
}

/* ── หน้าหลัก ── */
function AttendView({ jobs, users, role, currentUser }) {
  const wh = window.useWorkHours();
  const ot = window.useOtClaims();
  const [tab, setTab] = React.useState("day");
  const [date, setDate] = React.useState(window.drToday());
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");

  const canAll = window.tmCanAttendAll(role);
  const canApprove = window.tmCanOtApprove(role);
  const uid = (currentUser || {}).id || null;

  const visible = React.useMemo(() => window.tmOtVisible(ot.rows, currentUser, role), [ot.rows, currentUser, role]);
  const roll = React.useMemo(() => window.tmOtRollup(visible, currentUser, role), [visible, currentUser, role]);
  const me = window.useAttend(uid, 30);

  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let out = visible;
    if (tab === "mine") out = out.filter((r) => r.userId === uid);
    else if (tab === "inbox") out = out.filter((r) => r.status === "sent" && window.tmOtApproveCheck(r, currentUser, role).ok);
    if (kw) out = out.filter((r) => [r.no, r.userName, r.jobCode, r.reason, window.tmOtKindOf(r.kind).th]
      .some((v) => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [visible, tab, q, uid, currentUser, role]);

  const openNew = () => {
    const rec = window.tmOtBlank(currentUser, users, ot.rows, null, wh.cfg);
    ot.save(rec); setOpen(rec.id); setTab("mine");
  };

  const move = (rec, to) => {
    const next = window.tmOtMove(rec, to, currentUser, "");
    if (!next) return;
    ot.save(next);
    const when = window.drDateTH(next.date) + " " + next.from + "-" + next.to;
    if (to === "sent" && next.approverId) {
      window.tmNotify({ toUserId: next.approverId, title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins) });
    } else if (to === "sent") {
      /* ไม่ได้ตั้งผู้อนุมัติไว้ในโปรไฟล์ — ส่งเข้ากองกลาง ใครมีสิทธิ์ก็หยิบได้
         ดีกว่าใบค้างเงียบรอคนที่ไม่มีอยู่จริง */
      window.tmNotify({ toPerm: "otApprove", title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins) });
    } else if (to === "approved" || to === "rejected") {
      window.tmNotify({ toUserId: next.userId, title: (to === "approved" ? "อนุมัติ OT แล้ว · " : "ไม่อนุมัติ OT · ") + next.no,
        body: when + " · " + window.tmDur(next.mins) + " · โดย " + ((currentUser || {}).name || "") });
    }
  };

  const TABS = [["day", "แผ่นเวลารายวัน", "calendar", 0]]
    .concat([["mine", "ใบ OT ของฉัน", "pen", roll.mineOpen]])
    .concat(canApprove ? [["inbox", "รอฉันอนุมัติ", "check", roll.waitingMine]] : [])
    .concat(canApprove || canAll ? [["all", "ใบ OT ทั้งหมด", "list", 0]] : [])
    .concat(window.can(role, "manageUsers") ? [["cfg", "ตั้งค่าเวลาทำงาน", "settings", 0]] : []);

  const cur = (ot.rows || []).find((r) => r.id === open) || null;
  const jobSorted = React.useMemo(() => (jobs || []).slice()
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TmStat label="วันนี้คุณลงเวลา" value={me.today && me.today.in && me.today.in.hm ? me.today.in.hm : "—"}
          hint={me.today && me.today.out && me.today.out.hm ? "ออกงาน " + me.today.out.hm
            : me.today && me.today.in ? "ยังไม่ได้ลงเวลาออก" : "ลงเวลาได้จากแอปในไลน์"} />
        <TmStat label="ใบ OT ของฉันที่ยังไม่จบ" value={roll.mineOpen} unit="ใบ"
          on={tab === "mine"} onClick={() => setTab("mine")} />
        {canApprove && <TmStat label="รอฉันอนุมัติ" value={roll.waitingMine} unit="ใบ"
          color={roll.waitingMine ? "#F59E0B" : "var(--text-1)"} hint={"รออนุมัติทั้งระบบ " + roll.sent + " ใบ"}
          on={tab === "inbox"} onClick={() => setTab("inbox")} />}
        <TmStat label="OT ที่อนุมัติแล้ว" value={Math.round(roll.minsApproved / 60)} unit="ชม."
          hint={roll.rejected ? "ไม่อนุมัติ " + roll.rejected + " ใบ" : ""} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        padding: "11px 13px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ขอทำงานล่วงเวลา</span>
        <button onClick={openNew} disabled={!window.tmCanOt(role)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, border: "none",
            background: window.tmCanOt(role) ? "var(--primary)" : "var(--surface3)", color: window.tmCanOt(role) ? "#fff" : "var(--text-3)",
            cursor: window.tmCanOt(role) ? "pointer" : "default", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>
          <Icon name="plus" size={14} color={window.tmCanOt(role) ? "#fff" : "var(--text-3)"} /> เปิดใบ OT
        </button>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ช่างเปิดใบจากแอปในไลน์ได้เหมือนกัน</span>
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {TABS.map(([k, th, ic, n]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99,
              border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
              background: tab === k ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            <Icon name={ic} size={14} color={tab === k ? "var(--primary-dark)" : "var(--text-3)"} /> {th}
            {n > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 800 }}>{n}</span>}
          </button>
        ))}
      </div>

      {tab === "day" && (canAll
        ? <TmDaySheet date={date} setDate={setDate} cfg={wh.cfg} users={users} />
        : <TmMyDays rows={me.rows} cfg={wh.cfg} />)}

      {tab === "cfg" && <TmWorkHours cfg={wh.cfg} onSave={wh.save} />}

      {(tab === "mine" || tab === "inbox" || tab === "all") && (
        <React.Fragment>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา เลขที่ใบ · ชื่อ · รหัสงาน · เหตุผล"
            style={Object.assign({}, TM_IN, { width: "100%", maxWidth: 420 })} />
          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {list.length === 0
              ? <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                  {tab === "inbox" ? "ไม่มีใบรอคุณอนุมัติ" : "ยังไม่มีใบ OT"}
                </div>
              : list.map((r) => <TmOtRow key={r.id} rec={r} onOpen={(x) => setOpen(x.id)} />)}
          </div>
        </React.Fragment>
      )}

      {cur && <TmOtModal rec={cur} cfg={wh.cfg} jobs={jobSorted} role={role} currentUser={currentUser}
        onSave={ot.save} onMove={move} onDelete={ot.remove} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* เวลาของตัวเอง — สำหรับคนที่ไม่มีสิทธิ์ดูของทุกคน
   ตั้งใจให้มี ไม่ใช่ซ่อนแท็บทิ้ง เพราะทุกคนต้องตรวจเวลาตัวเองย้อนหลังได้ */
function TmMyDays({ rows, cfg }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
      {(rows || []).length === 0
        ? <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>ยังไม่มีประวัติการลงเวลา — ลงเวลาได้จากแอปในไลน์</div>
        : (rows || []).map((r) => (
          <div key={r.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", minWidth: 130 }}>{window.drDateTH(r.date, true)}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700 }}>
              {(r.in && r.in.hm) || "—"} → {(r.out && r.out.hm) || (r.in ? "ยังไม่ออก" : "—")}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{window.tmDur(window.tmWorkedMins(r, cfg))}</span>
            {r.jobCode && <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>{r.jobCode}</span>}
            {!(r.in && r.in.lat) && <span style={{ marginLeft: "auto", fontSize: 11, color: "#F59E0B", fontWeight: 700 }}>ไม่มีพิกัด</span>}
          </div>
        ))}
    </div>
  );
}

Object.assign(window, { AttendView, TmDaySheet, TmMyDays, TmOtModal, TmOtRow, TmWorkHours, TmStat, TmPill, TM_IN });
