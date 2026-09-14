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
/* สำหรับช่องที่อยู่ในตารางหลายคอลัมน์ — ต้องกว้างเต็มรางของตัวเอง ไม่ใช่กว้างตามความกว้างในตัวของ input
   (TM_IN เปล่า ๆ ยังใช้กับปุ่มและช่องในแถว flex ที่ควรกว้างตามเนื้อ จึงแยกเป็นคนละตัว) */
const TM_IN_W = Object.assign({}, TM_IN, { width: "100%" });
const TM_LB = { display: "grid", gap: 4, minWidth: 0 };

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
function TmDaySheet({ date, setDate, cfg, users, currentUser }) {
  const day = window.useAttendDay(date);
  const admin = window.useAttendAdmin(currentUser);
  /* ข้อความผลลัพธ์ของการลบ — ลบแล้วแถวหายไปเฉย ๆ อ่านเหมือนกดพลาดแล้วจอเพี้ยน
     ต้องมีบรรทัดบอกว่าลบของใครไปแล้ว ไม่ใช่ให้เดาจากตารางที่สั้นลงหนึ่งแถว */
  const [msg, setMsg] = React.useState("");

  /* ชื่อจากทะเบียนผู้ใช้ ไม่ใช่ชื่อที่ถ่ายสำเนาไว้ในใบตอนปั๊มเวลา — ดู tmNameOf */
  const nameOf = (r) => window.tmNameOf(users, r.userId, r.name);

  const del = async (r) => {
    const ok = await window.askConfirm({
      title: "ลบใบลงเวลาของ " + nameOf(r) + "?",
      body: window.drDateTH(date, true) + " · " + (r.in || "—") + " – " + (r.out || "—") +
        " · " + window.tmDur(r.mins) + "\nลบแล้วคนคนนี้กดลงเวลาของวันนี้ใหม่ได้ตั้งแต่ต้น",
      ok: "ลบใบนี้", danger: true, icon: "trash",
    });
    if (!ok) return;
    const res = await admin.removeDay(r.userId, date);
    setMsg(res.ok ? "ลบใบลงเวลาของ " + nameOf(r) + " แล้ว" : "ลบไม่สำเร็จ — " + res.why);
  };
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
              {["ชื่อ", "เข้า", "ออก", "ชั่วโมง", "งานที่แจ้ง", "พิกัด", ""].map((h, i) => (
                <th key={i} style={{ textAlign: i >= 1 && i <= 3 ? "center" : "left", padding: "10px 13px", fontSize: 11.5,
                  fontWeight: 800, color: "var(--text-3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {day.loading && <tr><td colSpan={7} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>กำลังโหลด…</td></tr>}
            {!day.loading && (day.rows || []).length === 0 && (
              <tr><td colSpan={7} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>ยังไม่มีใครลงเวลาในวันนี้</td></tr>
            )}
            {(day.rows || []).map((r) => (
              <tr key={r.userId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "9px 13px", fontWeight: 700, color: "var(--text-1)" }}>{nameOf(r)}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{r.in || "—"}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700,
                  color: r.in && !r.out ? "#EF4444" : "var(--text-1)" }}>{r.out || (r.in ? "ยังไม่ออก" : "—")}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", color: "var(--text-2)" }}>{window.tmDur(r.mins)}</td>
                <td style={{ padding: "9px 13px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)" }}>
                  {/* คนที่กด "ออฟฟิศ" ไม่มีรหัสงานให้แสดง และช่องว่างเปล่า ๆ อ่านเหมือนลืมกรอก */}
                  {r.place === "office" ? <span style={{ fontFamily: "inherit", fontSize: 11.5, color: "var(--text-3)" }}>ออฟฟิศ</span>
                    : (r.jobCode || "—")}
                </td>
                <td style={{ padding: "9px 13px" }}>
                  {r.gps ? <span style={{ fontSize: 11.5, color: "#10B981", fontWeight: 700 }}>มีพิกัด</span>
                    : <span style={{ fontSize: 11.5, color: "#F59E0B", fontWeight: 700 }}>ไม่มีพิกัด</span>}
                </td>
                <td style={{ padding: "9px 13px", textAlign: "right" }}>
                  {/* ลบทั้งใบ ไม่ใช่แก้เวลาทีละช่อง — เวลาที่พิมพ์เองไม่ใช่หลักฐาน
                      ให้เจ้าตัวกดใหม่จะได้พิกัดกับเวลาจริงติดมาด้วยเหมือนเดิม */}
                  <button onClick={() => del(r)} title="ลบใบลงเวลาของคนนี้"
                    style={{ padding: "5px 11px", borderRadius: 8, border: "1px solid var(--border-strong)",
                      background: "var(--surface)", color: "#EF4444", cursor: "pointer", fontFamily: "inherit",
                      fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>ลบ</button>
                </td>
              </tr>
            ))}
            {missing.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                <td style={{ padding: "9px 13px", fontWeight: 700, color: "var(--text-3)" }}>{u.name}</td>
                <td colSpan={6} style={{ padding: "9px 13px", fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้ลงเวลา</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>{msg}</div>}

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        ปุ่ม “ลบ” ลบใบลงเวลาของวันนั้นทั้งใบ แล้วให้เจ้าตัวกดเข้า-ออกใหม่ —
        ระบบเก็บสำเนาใบที่ลบไว้พร้อมชื่อคนลบ เผื่อมีข้อโต้เถียงเรื่องชั่วโมงตอนสิ้นเดือน
        <br />ช่อง “งานที่แจ้ง” คือสิ่งที่ผู้ลงเวลาเลือกเอง ระบบไม่ได้ตรวจว่าอยู่ที่ไซต์นั้นจริงหรือไม่ —
        ยังไม่มีพิกัดไซต์ที่เชื่อถือได้ในระบบ จึงเทียบระยะไม่ได้
        <br />“ไม่มีพิกัด” เกิดได้ทั้งจากปิดสิทธิ์ตำแหน่ง สัญญาณไม่ถึง หรืออยู่ในอาคาร — ระบบไม่เคยบล็อกการลงเวลาด้วยเหตุนี้
      </div>
    </div>
  );
}

/* ── สรุปรายเดือน ── ตารางที่ออฟฟิศเอาไปคิดค่าแรง
   ตัวเลขทุกช่องมาจากใบที่ช่างปั๊มเอง ไม่ได้เดาให้ — ช่องว่างคือไม่มีใบ ไม่ใช่ศูนย์ชั่วโมง */
function TmMonth({ cfg, users, ot }) {
  const [ym, setYm] = React.useState(window.tmYmNow);
  const { byDate, loading } = window.useAttendMonth(ym);
  const [pick, setPick] = React.useState(null);

  const days = React.useMemo(() => window.tmMonthDays(ym), [ym]);
  const rows = React.useMemo(
    () => window.tmMonthRollup(byDate, users, cfg, (ot || {}).rows, ym),
    [byDate, users, cfg, ot, ym]);

  const tot = React.useMemo(() => rows.reduce((a, r) => ({
    days: a.days + r.days, mins: a.mins + r.mins, noOut: a.noOut + r.noOut,
    noGps: a.noGps + r.noGps, otMins: a.otMins + r.otMins,
  }), { days: 0, mins: 0, noOut: 0, noGps: 0, otMins: 0 }), [rows]);

  const worked = rows.filter((r) => r.days > 0).length;
  const hrs = (m) => (!m ? "—" : (Math.round((m / 60) * 10) / 10).toLocaleString("en-US"));

  const th = (t, align) => (
    <th key={t} style={{ textAlign: align || "left", padding: "10px 13px", fontSize: 11.5, fontWeight: 800,
      color: "var(--text-3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{t}</th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setYm(window.tmYmShift(ym, -1))} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>‹ เดือนก่อน</button>
        <input type="month" value={ym} onChange={(e) => setYm(e.target.value || window.tmYmNow())} style={TM_IN} />
        <button onClick={() => setYm(window.tmYmShift(ym, 1))} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>เดือนถัดไป ›</button>
        <button onClick={() => setYm(window.tmYmNow())} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>เดือนนี้</button>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.tmYmTH(ym)}</div>
        <button onClick={() => tmExportMonthXlsx(rows, days, ym, (ot || {}).rows, users)}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10,
            border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer", fontFamily: "inherit",
            fontSize: 12.5, fontWeight: 800 }}>
          <Icon name="file" size={14} color="#fff" /> ออกไฟล์ Excel
        </button>
      </div>

      {/* บอกไว้ตรงนี้เลยว่าในไฟล์มีอะไร ไม่ใช่ให้เปิดไฟล์แล้วค่อยเซอร์ไพรส์ว่ามีกี่แผ่น */}
      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7, marginTop: -4 }}>
        ไฟล์ที่ออกมีแผ่นสรุปเวลาทำงานหนึ่งแผ่น + <b>แผ่น OT แยกรายคน</b> คนละแผ่น
        (วัน · ช่วงเวลา · หน้าที่ที่ปฏิบัติ · ช่องเซ็นอนุมัติของหัวหน้า) เฉพาะคนที่มีใบ OT ในเดือนนั้น
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TmStat label="มีใบลงเวลา" value={worked} unit={"/ " + rows.length + " คน"} />
        <TmStat label="วัน-คนที่ลงเวลา" value={tot.days} unit="วัน" />
        <TmStat label="ชั่วโมงรวมทั้งเดือน" value={hrs(tot.mins)} unit="ชม." />
        <TmStat label="OT ที่อนุมัติแล้ว" value={hrs(tot.otMins)} unit="ชม." />
        <TmStat label="ลืมกดออกงาน" value={tot.noOut} unit="ใบ" color={tot.noOut ? "#EF4444" : "var(--text-1)"}
          hint={tot.noOut ? "ใบพวกนี้ชั่วโมงเป็นศูนย์ ต้องทักถามก่อนคิดค่าแรง" : ""} />
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {th("ชื่อ")}{th("วันที่ลงเวลา", "center")}{th("ชั่วโมงรวม", "center")}
              {th("OT อนุมัติแล้ว", "center")}{th("ลืมกดออก", "center")}{th("ไม่มีพิกัด", "center")}{th("")}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>กำลังโหลด…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>ยังไม่มีใครลงเวลาในเดือนนี้</td></tr>
            )}
            {!loading && rows.map((r) => (
              <React.Fragment key={r.userId}>
                <tr style={{ borderBottom: "1px solid var(--border)", background: r.days ? "transparent" : "var(--surface2)" }}>
                  <td style={{ padding: "9px 13px", fontWeight: 700, color: r.days ? "var(--text-1)" : "var(--text-3)" }}>{r.name}</td>
                  <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{r.days || "—"}</td>
                  <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{hrs(r.mins)}</td>
                  <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", color: "var(--text-2)" }}>{hrs(r.otMins)}</td>
                  <td style={{ padding: "9px 13px", textAlign: "center", fontWeight: 700, color: r.noOut ? "#EF4444" : "var(--text-3)" }}>{r.noOut || "—"}</td>
                  <td style={{ padding: "9px 13px", textAlign: "center", fontWeight: 700, color: r.noGps ? "#F59E0B" : "var(--text-3)" }}>{r.noGps || "—"}</td>
                  <td style={{ padding: "9px 13px", textAlign: "right" }}>
                    {r.days > 0 && (
                      <button onClick={() => setPick(pick === r.userId ? null : r.userId)}
                        style={{ padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                        {pick === r.userId ? "ซ่อนรายวัน" : "ดูรายวัน"}
                      </button>
                    )}
                  </td>
                </tr>
                {pick === r.userId && (
                  <tr>
                    <td colSpan={7} style={{ padding: "10px 13px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {days.map((d) => {
                          const x = r.byDay[d];
                          const open = x && x.in && !x.out;
                          return (
                            <div key={d} title={d}
                              style={{ minWidth: 92, padding: "7px 9px", borderRadius: 9, background: "var(--surface)",
                                border: "1px solid " + (open ? "var(--tint-red-bd)" : x ? "var(--border)" : "transparent"),
                                opacity: x ? 1 : 0.45 }}>
                              <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 700 }}>{+d.slice(8)}</div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700,
                                color: open ? "#EF4444" : "var(--text-1)" }}>
                                {x ? (x.in || "—") + " – " + (x.out || "?") : "—"}
                              </div>
                              <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{x ? window.tmDur(x.mins) : ""}</div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        ชั่วโมงคิดจากเวลาเข้า-ออกที่ปั๊มไว้ หักพักกลางวันเฉพาะใบที่ทำงานเกินหกชั่วโมง ตามที่ตั้งไว้ในหน้า “ตั้งค่าเวลาทำงาน”
        <br />ใบที่ “ลืมกดออก” ชั่วโมงจะเป็นศูนย์ เพราะระบบไม่เดาเวลาเลิกงานให้ — ต้องถามเจ้าตัวแล้วแก้ที่ต้นทาง
        <br />OT นับเฉพาะใบที่อนุมัติแล้วและอยู่ในเดือนนี้ · ตัวเลขทั้งหมดยังไม่ใช่ยอดจ่าย ต้องผ่านการตรวจของผู้มีอำนาจก่อน
      </div>
    </div>
  );
}

/* ออกไฟล์ Excel — ตารางคน × วัน แบบใบลงเวลากระดาษ ที่ฝ่ายบัญชีอ่านออกโดยไม่ต้องอธิบาย
   + แผ่น OT แยกรายคน คนละแผ่น สำหรับพิมพ์ให้หัวหน้าเซ็น (ดู tmOtSheetFor ข้างล่าง) */
function tmExportMonthXlsx(rows, days, ym, otRows, users) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  if (!rows || !rows.length) { alert("เดือนนี้ยังไม่มีข้อมูลให้ออกไฟล์"); return; }
  const X = window.XLSX;
  const FONT = "Tahoma";
  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", white: "FFFFFF",
    border: "CBD8D0", text: "16241D", sub: "5A6B62", alt: "F4FAF6", warn: "FDECEA", warnTx: "B42318" };
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const H = (m) => (!m ? "" : Math.round((m / 60) * 100) / 100);

  const cols = ["ชื่อ"].concat(days.map((d) => +d.slice(8)))
    .concat(["วันที่ลงเวลา", "ชั่วโมงรวม", "OT อนุมัติแล้ว", "ลืมกดออก", "ไม่มีพิกัด"]);
  const lastC = cols.length - 1;
  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const push = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const full = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

  push(["สรุปเวลาทำงานรายเดือน · " + window.tmYmTH(ym)], "title", 30); full(R - 1);
  push(["flash+solar · ตัวเลขจากใบลงเวลาที่พนักงานปั๊มเอง ยังไม่ใช่ยอดจ่าย"], "subtitle", 20); full(R - 1);
  push([], "spacer", 6);
  push(cols, "head", 26);

  let alt = false;
  rows.forEach((r) => {
    const line = [r.name].concat(days.map((d) => (r.byDay[d] ? H(r.byDay[d].mins) : "")))
      .concat([r.days || "", H(r.mins), H(r.otMins), r.noOut || "", r.noGps || ""]);
    push(line, alt ? "itemAlt" : "item", 19);
    alt = !alt;
  });

  const sum = (k) => rows.reduce((a, r) => a + (+r[k] || 0), 0);
  push(["รวมทั้งสิ้น"].concat(days.map(() => ""))
    .concat([sum("days"), H(sum("mins")), H(sum("otMins")), sum("noOut") || "", sum("noGps") || ""]), "total", 24);
  merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: days.length } });
  push([], "spacer", 8);
  push(["ช่องว่าง = ไม่มีใบลงเวลาในวันนั้น · ใบที่ลืมกดออกงานชั่วโมงเป็นศูนย์ ระบบไม่เดาเวลาเลิกงานให้"], "foot", 18);
  full(R - 1);

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 22 }].concat(days.map(() => ({ wch: 5.2 })))
    .concat([{ wch: 12 }, { wch: 11 }, { wch: 13 }, { wch: 10 }, { wch: 10 }]);
  ws["!rows"] = rowsH;
  /* ตรึงชื่อคนกับหัวตารางไว้ ตารางกว้างสามสิบกว่าคอลัมน์ เลื่อนไปกลางเดือนแล้วจะไม่รู้ว่าแถวไหนของใคร */
  ws["!freeze"] = { xSplit: 1, ySplit: 4 };
  ws["!autofilter"] = null;

  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s = { font: { name: FONT, sz: 10.5, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "head") { s.font = { name: FONT, sz: 10, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: c === 0 ? "left" : "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (t === "total") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } }; s.alignment = { horizontal: c === 0 ? "left" : "center", vertical: "center" }; s.border = boxAll; if (c > days.length + 1) s.numFmt = "#,##0.00"; }   /* ข้ามช่องจำนวนวัน — วันต้องเป็นจำนวนเต็ม ไม่ใช่ 24.00 วัน */
    else if (t === "foot") { s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
    else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      if (c === 0) { s.alignment = { horizontal: "left", vertical: "center" }; s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.text } }; }
      else { s.alignment = { horizontal: "center", vertical: "center" }; if (c !== lastC - 1 && c !== lastC && c !== days.length + 1) s.numFmt = "0.00"; }
      if (c === lastC - 1 && aoa[r][c]) { s.fill = { patternType: "solid", fgColor: { rgb: C.warn } }; s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.warnTx } }; }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const st = styleCell(r, c);
      if (!st) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = st;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "เวลาทำงาน");

  /* ── แผ่น OT แยกรายคน ──
     รวมทุกคนไว้แผ่นเดียวแล้วให้หัวหน้าเซ็นท้ายแผ่น = เซ็นทีเดียวครอบคนที่ไม่ได้อ่าน
     แยกคนละแผ่นแล้วพิมพ์ออกมาจะได้คนละใบ เซ็นได้ทีละคน และแจกให้เจ้าตัวเก็บได้
     เอาเฉพาะใบที่ส่งแล้ว (รออนุมัติ/อนุมัติแล้ว) — ใบร่างยังไม่ใช่คำขอ ใบที่ถูกปัดตกไม่ต้องเซ็น */
  const otMine = {};
  (otRows || []).forEach((o) => {
    if (!o || !o.userId) return;
    if (window.tmYm(o.date) !== ym) return;
    if (o.status !== "sent" && o.status !== "approved") return;
    (otMine[o.userId] || (otMine[o.userId] = [])).push(o);
  });

  /* เรียงคนตามลำดับเดียวกับแผ่นสรุป เพื่อให้แท็บล่างของ Excel ไล่ตามตารางข้างบน */
  const used = {};
  rows.forEach((r) => {
    const list = otMine[r.userId];
    if (!list || !list.length) return;
    list.sort((a, b) => String(a.date + a.from).localeCompare(String(b.date + b.from)));
    X.utils.book_append_sheet(wb, tmOtSheetFor(X, r.name, list, ym, FONT, C),
      tmSheetName("OT " + r.name, used));
  });

  X.writeFile(wb, "สรุปเวลาทำงาน_" + ym + ".xlsx");
}

/* ชื่อแผ่นของ Excel: ห้ามเกิน 31 ตัว ห้ามมี : \\ / ? * [ ] และห้ามซ้ำกัน
   ถ้าซ้ำหรือยาวเกิน Excel จะไม่เปิดไฟล์เลย ไม่ใช่แค่เพี้ยน */
function tmSheetName(raw, used) {
  let n = String(raw || "OT").replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "OT";
  if (used[n]) { let i = 2; while (used[n.slice(0, 28) + " " + i]) i += 1; n = n.slice(0, 28) + " " + i; }
  used[n] = 1;
  return n;
}

/* ── ใบ OT ของคนหนึ่งคน หนึ่งเดือน ──
   ต้องตอบคำถามของคนเซ็นให้ครบในแผ่นเดียว: ขอวันไหน · กี่โมงถึงกี่โมง · ไปทำอะไร · รวมกี่ชั่วโมง
   "ปฏิบัติหน้าที่" คือเหตุผลที่เจ้าตัวกรอกไว้ตอนขอ ไม่ใช่ช่องที่ออฟฟิศมาเติมทีหลัง */
function tmOtSheetFor(X, name, list, ym, FONT, C) {
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const H = (m) => (!m ? 0 : Math.round((m / 60) * 100) / 100);
  const cols = ["ลำดับ", "วันที่", "ตั้งแต่", "ถึง", "รวม (ชม.)", "ประเภท", "งาน", "ปฏิบัติหน้าที่", "สถานะในระบบ", "ผู้อนุมัติในระบบ"];
  const lastC = cols.length - 1;

  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const push = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const full = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

  push(["ใบขออนุมัติทำงานล่วงเวลา (OT)"], "title", 30); full(R - 1);
  push([name + " · " + window.tmYmTH(ym)], "subtitle", 22); full(R - 1);
  push([], "spacer", 6);
  push(cols, "head", 26);

  let approved = 0, waiting = 0, alt = false;
  list.forEach((o, i) => {
    const mins = +o.mins || 0;
    if (o.status === "approved") approved += mins; else waiting += mins;
    push([i + 1, window.drDateTH(o.date), o.from || "", o.to || "", H(mins),
      window.tmOtKindOf(o.kind).th, o.jobCode || "—", o.reason || "",
      window.tmOtStatusOf(o.status).th, o.approverName || "—"], alt ? "itemAlt" : "item", 19);
    alt = !alt;
  });

  push(["รวมที่อนุมัติแล้วในระบบ", "", "", "", H(approved), "ชั่วโมง", "", "", "", ""], "total", 24);
  merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
  /* ยอดที่ยังรออนุมัติต้องแยกบรรทัด ไม่ใช่บวกรวมกับยอดที่อนุมัติแล้ว
     ไม่งั้นแผ่นนี้จะกลายเป็นยอดจ่ายที่ยังไม่มีใครอนุมัติ */
  push(["ยังรออนุมัติในระบบ", "", "", "", H(waiting), "ชั่วโมง", "", "", "", ""], waiting ? "warnRow" : "muted", 22);
  merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });

  push([], "spacer", 14);
  push(["ลงชื่อผู้ขอ ..............................................", "", "", "",
        "ลงชื่อหัวหน้างานผู้อนุมัติ ..............................................", "", "", "", "", ""], "sign", 34);
  merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
  merges.push({ s: { r: R - 1, c: 4 }, e: { r: R - 1, c: lastC } });
  push(["(" + name + ")", "", "", "", "(..............................................)  วันที่ ........./........./.........", "", "", "", "", ""], "signSub", 22);
  merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
  merges.push({ s: { r: R - 1, c: 4 }, e: { r: R - 1, c: lastC } });

  push([], "spacer", 8);
  push(["เวลาในใบนี้เป็นเวลาที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้ — ถ้าไม่แน่ใจให้เทียบกับแผ่น “เวลาทำงาน” ของวันนั้น"], "foot", 16); full(R - 1);
  push(["การเซ็นบนกระดาษไม่ได้เปลี่ยนสถานะในระบบ ใบที่ยังรออนุมัติต้องกดอนุมัติในระบบด้วย"], "foot", 16); full(R - 1);

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 6 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 17 }, { wch: 12 }, { wch: 42 }, { wch: 13 }, { wch: 18 }];
  ws["!rows"] = rowsH;

  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s = { font: { name: FONT, sz: 10.5, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s.font = { name: FONT, sz: 12, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "head") { s.font = { name: FONT, sz: 10, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (t === "total") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } }; s.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; s.border = boxAll; if (c === 4) s.numFmt = "0.00"; }
    else if (t === "warnRow") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.warnTx } }; s.fill = { patternType: "solid", fgColor: { rgb: C.warn } }; s.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; s.border = boxAll; if (c === 4) s.numFmt = "0.00"; }
    else if (t === "muted") { s.font = { name: FONT, sz: 10.5, color: { rgb: C.sub } }; s.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; s.border = boxAll; if (c === 4) s.numFmt = "0.00"; }
    else if (t === "sign") { s.font = { name: FONT, sz: 11, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "bottom" }; }
    else if (t === "signSub") { s.font = { name: FONT, sz: 10, color: { rgb: C.sub } }; s.alignment = { horizontal: "left", vertical: "top" }; }
    else if (t === "foot") { s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
    else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      /* คอลัมน์ "ปฏิบัติหน้าที่" ต้องตัดบรรทัดในช่อง ไม่ใช่ล้นทับช่องข้าง ๆ ตอนพิมพ์ */
      if (c === 7) s.alignment = { horizontal: "left", vertical: "center", wrapText: true };
      else if (c === 1 || c === 5) s.alignment = { horizontal: "left", vertical: "center" };
      else { s.alignment = { horizontal: "center", vertical: "center" }; if (c === 4) s.numFmt = "0.00"; }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const st = styleCell(r, c);
      if (!st) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = st;
    }
  }
  return ws;
}

/* ── ใบ OT หนึ่งใบ ── */
function TmOtModal({ rec, cfg, jobs, users, role, currentUser, onSave, onMove, onDelete, onClose }) {
  const [f, setF] = React.useState(rec);
  React.useEffect(() => { setF(rec); }, [rec && rec.id]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  if (!f) return null;

  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && (f.status === "draft");
  const set = (k, v) => setF((p) => {
    const next = Object.assign({}, p, { [k]: v });
    next.mins = window.tmOtMinutes(next.date, next.from, next.to, cfg);
    /* เปลี่ยนประเภทแล้วตัวคูณต้องตามไปด้วย — ใบที่ยังเป็นร่างยังไม่มีใครเซ็น จึงยึดอัตราปัจจุบัน
       (ใบที่ส่งไปแล้วแก้ไม่ได้อยู่แล้ว อัตราที่ถ่ายไว้ตอนนั้นจึงถูกตรึงไปเอง) */
    if (k === "kind") next.rate = window.tmOtRate(v, cfg);
    return next;
  });
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg);
  const rate = window.tmOtRate(f, cfg);
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
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{window.tmNameOf(users, f.userId, f.userName)}</div>
          </div>
          <TmPill s={f.status} />
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color="var(--text-3)" />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>วันที่</span>
            <input type="date" value={f.date} disabled={!editable} onChange={(e) => set("date", e.target.value)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตั้งแต่</span>
            <input type="time" value={f.from} disabled={!editable} onChange={(e) => set("from", e.target.value)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <input type="time" value={f.to} disabled={!editable} onChange={(e) => set("to", e.target.value)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ประเภท</span>
            <select value={f.kind} disabled={!editable} onChange={(e) => set("kind", e.target.value)} style={TM_IN_W}>
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
          {/* ชั่วโมงคิดค่าแรง = นาทีจริง × ตัวคูณของประเภทนั้น — ตัวเลขที่ฝ่ายบุคคลเอาไปใช้ต่อ */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>คิดค่าแรง</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
              {window.tmRateTH(rate)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>
              = {(Math.round((mins * rate / 60) * 100) / 100).toFixed(2)} ชม.คิดค่าแรง
            </span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {window.tmIsWorkday(f.date, cfg)
              /* หน้านี้ไม่ได้ถือใบลงเวลาของเจ้าของใบไว้ จึงใช้ช่วงอนุมานจากเวลาเข้างานเร็วสุด
                 ตัวเลขที่ช่างเห็นตอนกดขอในไลน์คิดจากเวลาที่เขากดเข้าจริง อาจต่างกันได้เมื่อเข้าสาย */
              ? "วันทำงานปกติ — ตัดช่วงที่ทับเวลางาน " + window.tmWhNorm(cfg).start + "-" + window.tmWhNorm(cfg).end
                + " ออกแล้ว (ช่วงนี้เลื่อนตามเวลาที่เข้างานจริง)"
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

        {/* ── คนอนุมัติ ──
            ต้องเลือกก่อนส่ง ไม่ใช่ปล่อยเข้ากองกลาง — ใบที่ไม่มีชื่อใครกำกับ
            ทุกคนคิดว่าเป็นหน้าที่คนอื่น แล้วก็ค้างจนเจ้าของใบลืมไปเอง */}
        <label style={{ marginTop: 10, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ส่งให้ใครอนุมัติ</span>
          {editable ? (
            <select value={f.approverId || ""}
              onChange={(e) => {
                const u = (users || []).find((x) => x.id === e.target.value);
                setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
              }} style={TM_IN}>
              <option value="">— ยังไม่เลือก (เข้ากองกลาง) —</option>
              {window.tmOtApprovers(users, { id: f.userId }).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: 12.5, color: f.approverName ? "var(--text-1)" : "#F59E0B", fontWeight: 700 }}>
              {f.approverName || "ไม่ได้ระบุคนอนุมัติ — ใบนี้อยู่ในกองกลาง"}
            </span>
          )}
        </label>
        {editable && !f.approverId && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#F59E0B", lineHeight: 1.6 }}>
            ส่งได้โดยไม่เลือก แต่ใบจะเข้ากองกลางให้ใครก็ได้ที่มีสิทธิ์หยิบ — ระบุชื่อไว้ใบจะไม่ค้าง
          </div>
        )}
        {f.cancelledAt && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 11, background: "var(--surface2)",
            fontSize: 12, color: "var(--text-2)" }}>
            ยกเลิกโดยเจ้าของใบ · {window.drShort(String(f.cancelledAt).slice(0, 10))}
          </div>
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
          {nexts.map((s) => {
            /* "ตีกลับ" กับ "เอากลับมาแก้" เป็นการเดินสถานะเดียวกัน (→ draft) แต่คนละเรื่องกัน
               สำหรับคนอ่าน — คำบนปุ่มจึงต้องเปลี่ยนตามว่าใครกด ไม่ใช่ตามชื่อสถานะ */
            const soft = s.key === "cancelled" || (s.key === "draft" && f.status === "sent" && !mine);
            const label = s.key === "sent" ? "ส่งขออนุมัติ"
              : s.key === "approved" ? "อนุมัติ"
              : s.key === "rejected" ? "ไม่อนุมัติ"
              : s.key === "cancelled" ? "ยกเลิกใบนี้"
              : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
            return (
              <button key={s.key} onClick={() => { onMove(Object.assign({}, f, { mins }), s.key); onClose(); }}
                style={{ padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 800,
                  border: soft ? "1px solid var(--border-strong)" : "none",
                  background: soft ? "var(--surface)" : s.color, color: soft ? s.color : "#fff" }}>
                {label}
              </button>
            );
          })}
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

function TmOtRow({ rec, users, onOpen }) {
  const k = window.tmOtKindOf(rec.kind);
  return (
    <button onClick={() => onOpen(rec)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none",
        borderBottom: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{rec.no}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.tmNameOf(users, rec.userId, rec.userName)}</span>
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
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เข้างานได้ตั้งแต่</span>
          <input type="time" value={f.startEarly} onChange={(e) => set("startEarly", e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เข้างานช้าสุด</span>
          <input type="time" value={f.startLate} onChange={(e) => set("startLate", e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ทำงานวันละ (นาที)</span>
          <input type="number" min={0} step={30} value={f.workMins} onChange={(e) => set("workMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>พักกลางวัน (นาที)</span>
          <input type="number" min={0} value={f.lunchMins} onChange={(e) => set("lunchMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>OT ขั้นต่ำที่นับ (นาที)</span>
          <input type="number" min={0} value={f.minOtMins} onChange={(e) => set("minOtMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ปัดเศษ OT ทีละ (นาที)</span>
          <input type="number" min={0} value={f.roundMins} onChange={(e) => set("roundMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตัดยอด OT ทุกวันที่</span>
          <input type="number" min={0} max={28} value={f.cutoffDay} onChange={(e) => set("cutoffDay", +e.target.value)} style={TM_IN_W} />
        </label>
      </div>

      {/* วันตัดยอดเป็นค่าที่กรอกแล้วนึกภาพไม่ออกที่สุดในหน้านี้ — โชว์รอบปัจจุบันจริงให้ดูเลย */}
      <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--surface2)",
        border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>
        รอบตัดยอดตอนนี้ <b>{window.tmPeriodTH(window.tmPeriodOf(window.drToday(), f))}</b>
        <br /><span style={{ color: "var(--text-3)" }}>
          {window.tmWhNorm(f).cutoffDay
            ? "ใบ OT ของวันที่ " + window.tmWhNorm(f).cutoffDay + " นับเข้ารอบนี้ · วันที่ " +
              (window.tmWhNorm(f).cutoffDay + 1) + " เป็นต้นไปนับเข้ารอบถัดไป"
            : "ใส่ 0 = ใช้เดือนปฏิทิน (วันที่ 1 ถึงสิ้นเดือน) · ถ้าฝ่ายบุคคลปิดยอดวันที่ 25 ให้ใส่ 25"}
          <br />ตั้งได้ไม่เกินวันที่ 28 เพราะเดือนกุมภาพันธ์ไม่มีวันที่ 29-31 ทุกปี รอบจะหายไปเงียบ ๆ
        </span>
      </div>

      {/* ตัวอย่างจริงสองเคส — ค่าตั้งชุดนี้อ่านจากช่องเปล่า ๆ แล้วนึกภาพไม่ออกว่าแปลว่าอะไร */}
      <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--surface2)",
        border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>
        เข้า {f.startEarly} → เลิก <b>{window.tmWhNorm(f).end}</b>
        <span style={{ color: "var(--text-3)" }}> (ทำงาน {window.tmDur(f.workMins)} + พัก {window.tmDur(f.lunchMins)})</span>
        <br />เข้า {f.startLate} → เลิก <b>{window.tmDayWindow({ in: { hm: f.startLate } }, f).end}</b>
        <br /><span style={{ color: "var(--text-3)" }}>
          กดเข้าก่อน {f.startEarly} ไม่ทำให้เลิกเร็วขึ้น · เข้าหลัง {f.startLate} ถือว่าสายและเวลาเลิกเลื่อนตามจริง
          เพราะหน้าที่คือทำให้ครบ {window.tmDur(f.workMins)} ไม่ใช่อยู่ถึงเวลาที่กำหนด
        </span>
      </div>

      {/* ── ตัวคูณค่าแรง OT ──
          แยกเป็นบล็อกของตัวเอง ไม่ปนกับช่องเวลา เพราะคนละเรื่องกัน:
          ช่องข้างบนตอบว่า "นับเป็น OT กี่นาที" ส่วนตรงนี้ตอบว่า "นาทีนั้นคิดค่าแรงกี่เท่า" */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>อัตราค่าแรง OT (ตัวคูณ)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {window.TM_OT_KIND.map((k) => (
            <label key={k.key} style={TM_LB}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: k.color }}>{k.th}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input type="number" min={0} max={10} step={0.5}
                  value={(f.otRates || {})[k.key] != null ? (f.otRates || {})[k.key] : ""}
                  onChange={(e) => set("otRates", Object.assign({}, f.otRates, { [k.key]: e.target.value === "" ? "" : +e.target.value }))}
                  style={Object.assign({}, TM_IN, { width: 88 })} />
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>เท่า</span>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>{k.hint}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 9, padding: "11px 13px", borderRadius: 12, background: "var(--surface2)",
          border: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.8 }}>
          ค่าตั้งต้นเป็นอัตราตามกฎหมายแรงงานไทย (พ.ร.บ.คุ้มครองแรงงาน ม.61-63) —
          ล่วงเวลาวันทำงาน 1.5 เท่า · ทำงานวันหยุด 2 เท่า · ล่วงเวลาในวันหยุด 3 เท่า
          <br /><span style={{ color: "var(--text-3)" }}>
            “ทำงานวันหยุด” ตั้ง 2 เท่าไว้สำหรับลูกจ้างรายวัน — ถ้าเป็นลูกจ้างรายเดือนที่ได้ค่าจ้างวันหยุดอยู่แล้ว
            กฎหมายให้จ่ายเพิ่มอีก 1 เท่า ให้ตั้งเป็น 1 · “งานกลางคืน” กฎหมายไม่ได้กำหนดอัตราไว้ต่างหาก แต่ละที่ตกลงกันเอง
            <br />บริษัทจ่ายสูงกว่ากฎหมายได้ แต่ต่ำกว่าไม่ได้ — ระบบไม่ได้กันไว้ให้ ตั้งเท่าไหร่ก็ได้ตามที่ตกลงกันจริง
            <br /><b>ระบบคิดให้แค่ “ชั่วโมงคิดค่าแรง” (นาทีจริง × ตัวคูณ) ไม่ได้คิดเป็นเงิน</b>
            เพราะอัตราค่าจ้างรายคนไม่ได้อยู่ในระบบนี้ — ฝ่ายบุคคลเอาตัวเลขนี้ไปคูณอัตราของแต่ละคนต่อ
            <br />แก้อัตราที่นี่ไม่ย้อนไปเปลี่ยนใบเก่า ใบแต่ละใบถ่ายตัวคูณ ณ วันที่เปิดใบติดตัวไว้แล้ว
          </span>
        </div>
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
        วันตัดยอดใช้แบ่งรอบในแท็บ “สรุป OT รายคน” และบนใบ OT ที่พิมพ์ออกไป ไม่ได้เปลี่ยนตัวใบที่เปิดไปแล้ว
        <br />ค่าพวกนี้ใช้คำนวณว่า “ช่วงเวลาที่ขอมานับเป็น OT กี่นาที” เท่านั้น
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

/* ── สรุป OT รายคน ตามรอบตัดยอด ──
   แท็บนี้มีไว้ทำอย่างเดียว: หยิบใบ OT ของคนหนึ่งในรอบหนึ่ง แล้วพิมพ์ให้หัวหน้าเซ็น
   แยกจาก "สรุปรายเดือน" เพราะรอบจ่ายเงินไม่จำเป็นต้องตรงกับเดือนปฏิทิน
   (ตั้งวันตัดยอดได้ในหน้า "ตั้งค่าเวลาทำงาน") */
function TmOtPeriod({ cfg, users, jobs, rows, byName }) {
  const cut = window.tmWhNorm(cfg).cutoffDay;
  const [period, setPeriod] = React.useState(() => window.tmPeriodOf(window.drToday(), cfg));
  /* แอดมินเปลี่ยนวันตัดยอดแล้วรอบที่ค้างอยู่บนจอจะเป็นรอบของกติกาเก่า — ตั้งใหม่ให้เลย */
  React.useEffect(() => { setPeriod(window.tmPeriodOf(window.drToday(), cfg)); }, [cut]);
  const [onlyApproved, setOnlyApproved] = React.useState(false);
  const [paper, setPaper] = React.useState(null);

  const inRange = React.useMemo(() => (rows || []).filter((r) => window.tmInPeriod(r && r.date, period)), [rows, period]);
  const people = React.useMemo(() => {
    const src = onlyApproved ? inRange.filter((r) => r.status === "approved") : inRange;
    return window.tmOtByPerson(src, users, cfg);
  }, [inRange, users, onlyApproved, cfg]);

  const tot = React.useMemo(() => people.reduce((a, g) => ({
    slips: a.slips + g.rows.length, approved: a.approved + g.minsApproved, waiting: a.waiting + g.minsWaiting,
    pay: a.pay + g.payApproved,
  }), { slips: 0, approved: 0, waiting: 0, pay: 0 }), [people]);

  const nav = (n) => setPeriod((p) => window.tmPeriodShift(p, n, cfg));
  const hrs = (m) => (!m ? "—" : (Math.round((m / 60) * 100) / 100).toFixed(2));
  const th = (t, align) => (
    <th key={t} style={{ textAlign: align || "left", padding: "10px 13px", fontSize: 11.5, fontWeight: 800,
      color: "var(--text-3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{t}</th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => nav(-1)} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>‹ รอบก่อน</button>
        <button onClick={() => setPeriod(window.tmPeriodOf(window.drToday(), cfg))}
          style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>รอบปัจจุบัน</button>
        <button onClick={() => nav(1)} style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700 })}>รอบถัดไป ›</button>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.tmPeriodTH(period)}</div>
        <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5,
          fontWeight: 700, color: "var(--text-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyApproved} onChange={(e) => setOnlyApproved(e.target.checked)} style={{ width: 15, height: 15 }} />
          พิมพ์เฉพาะใบที่อนุมัติแล้ว
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <TmStat label="คนที่มี OT ในรอบนี้" value={people.length} unit="คน" />
        <TmStat label="ใบ OT ในรอบนี้" value={tot.slips} unit="ใบ" />
        <TmStat label="อนุมัติแล้ว" value={hrs(tot.approved)} unit="ชม." hint="ชั่วโมงจริงที่ทำ" />
        <TmStat label="ชั่วโมงคิดค่าแรง" value={hrs(tot.pay)} unit="ชม." color="var(--primary-dark)"
          hint="คูณตัวคูณของแต่ละประเภทแล้ว (เฉพาะใบที่อนุมัติ)" />
        <TmStat label="ยังรออนุมัติ" value={hrs(tot.waiting)} unit="ชม."
          color={tot.waiting ? "#F59E0B" : "var(--text-1)"}
          hint={tot.waiting ? "ต้องกดอนุมัติในระบบก่อน ไม่ใช่แค่เซ็นบนกระดาษ" : ""} />
      </div>

      <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 13, background: "var(--surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {th("ชื่อ")}{th("ใบ OT", "center")}{th("อนุมัติแล้ว (ชม.)", "center")}{th("ชม.คิดค่าแรง", "center")}{th("รออนุมัติ (ชม.)", "center")}{th("")}
            </tr>
          </thead>
          <tbody>
            {people.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 26, textAlign: "center", color: "var(--text-3)" }}>
                ไม่มีใบ OT ในรอบนี้{onlyApproved ? " (ที่อนุมัติแล้ว)" : ""}
              </td></tr>
            )}
            {people.map((g) => (
              <tr key={g.id || g.name} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "9px 13px", fontWeight: 700, color: "var(--text-1)" }}>{g.name}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{g.rows.length}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>{hrs(g.minsApproved)}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)", fontWeight: 800,
                  color: g.payApproved ? "var(--primary-dark)" : "var(--text-3)" }}>{hrs(g.payApproved)}</td>
                <td style={{ padding: "9px 13px", textAlign: "center", fontFamily: "var(--mono)",
                  color: g.minsWaiting ? "#F59E0B" : "var(--text-3)", fontWeight: g.minsWaiting ? 700 : 400 }}>{hrs(g.minsWaiting)}</td>
                <td style={{ padding: "9px 13px", textAlign: "right" }}>
                  <button onClick={() => setPaper(g)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9,
                      border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 12, fontWeight: 800 }}>
                    <Icon name="file" size={13} color="#fff" /> พิมพ์ / PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        “ชม.คิดค่าแรง” = ชั่วโมงจริง × ตัวคูณของประเภท OT นั้น (ตั้งได้ในหน้า “ตั้งค่าเวลาทำงาน”)
        นับเฉพาะใบที่อนุมัติแล้ว · ยังไม่ใช่จำนวนเงิน ฝ่ายบุคคลต้องคูณอัตราค่าจ้างของแต่ละคนอีกที
        <br />ใบที่พิมพ์เป็นของคนละหนึ่งใบต่อหนึ่งรอบ มีวัน · ช่วงเวลา · งานที่ไปทำ · หน้าที่ที่ปฏิบัติ · และช่องเซ็นสามช่อง
        (ผู้ขอ · หัวหน้างานผู้อนุมัติ · ฝ่ายบุคคล)
        <br />รอบแบ่งตามวันตัดยอดที่ตั้งไว้ในหน้า “ตั้งค่าเวลาทำงาน”
        {cut ? " — ตอนนี้ตัดทุกวันที่ " + cut : " — ตอนนี้ใช้เดือนปฏิทิน (ยังไม่ได้ตั้งวันตัดยอด)"}
        <br />ใบที่ยังไม่อนุมัติก็พิมพ์ติดไปด้วยและขึ้นสถานะกำกับ เพื่อให้หัวหน้าเห็นครบว่าลูกน้องขออะไรมาบ้าง
        — แต่ยอดรวมที่อนุมัติแล้วกับยอดที่ยังรอ แยกคนละบรรทัดบนกระดาษเสมอ
      </div>

      {paper && window.TmOtPaper && (
        <window.TmOtPaper person={paper} period={period} rows={paper.rows} jobs={jobs} users={users}
          cfg={cfg} byName={byName} onClose={() => setPaper(null)} />
      )}
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
    } else if (to === "draft" && rec.status === "sent" && next.userId !== uid) {
      /* คนอนุมัติตีกลับ — เจ้าของใบต้องรู้ ไม่งั้นใบจะกลับไปเป็นร่างเงียบ ๆ แล้วไม่มีใครส่งอีก */
      window.tmNotify({ toUserId: next.userId, title: "ตีกลับใบ OT · " + next.no,
        body: when + " · แก้แล้วส่งใหม่ได้ · โดย " + ((currentUser || {}).name || "") });
    } else if (to === "cancelled" && rec.status === "sent" && next.approverId) {
      /* ยกเลิกใบที่ส่งไปแล้ว — คนอนุมัติต้องรู้ว่าไม่ต้องรออีก */
      window.tmNotify({ toUserId: next.approverId, title: "ยกเลิกใบขอ OT · " + next.no,
        body: next.userName + " · " + when + " · ไม่ต้องพิจารณาแล้ว" });
    }
  };

  const TABS = [["day", "แผ่นเวลารายวัน", "calendar", 0]]
    .concat(canAll ? [["month", "สรุปรายเดือน", "table", 0]] : [])
    .concat([["mine", "ใบ OT ของฉัน", "pen", roll.mineOpen]])
    .concat(canApprove ? [["inbox", "รอฉันอนุมัติ", "check", roll.waitingMine]] : [])
    .concat(canApprove || canAll ? [["all", "ใบ OT ทั้งหมด", "list", 0]] : [])
    .concat([["otsum", "สรุป OT รายคน", "file", 0]])
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
        ? <TmDaySheet date={date} setDate={setDate} cfg={wh.cfg} users={users} currentUser={currentUser} />
        : <TmMyDays rows={me.rows} cfg={wh.cfg} />)}

      {tab === "month" && canAll && <TmMonth cfg={wh.cfg} users={users} ot={ot} />}

      {tab === "otsum" && <TmOtPeriod cfg={wh.cfg} users={users} jobs={jobSorted} rows={visible}
        byName={(currentUser || {}).name || ""} />}

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
              : list.map((r) => <TmOtRow key={r.id} rec={r} users={users} onOpen={(x) => setOpen(x.id)} />)}
          </div>
        </React.Fragment>
      )}

      {cur && <TmOtModal rec={cur} cfg={wh.cfg} jobs={jobSorted} users={users} role={role} currentUser={currentUser}
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

Object.assign(window, { TM_IN, TM_IN_W, TM_LB, AttendView, TmDaySheet, TmMonth, TmMyDays, TmOtModal, TmOtRow, TmWorkHours,
  TmOtPeriod,
  tmExportMonthXlsx, tmOtSheetFor, tmSheetName,
  TmStat, TmPill, TM_IN, tmExportMonthXlsx });
