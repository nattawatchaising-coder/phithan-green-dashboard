/* ══════════════════════════════════════════════════
   ใบสรุปการทำงานล่วงเวลา (OT) รายบุคคล — A4 พิมพ์/บันทึก PDF

   ทำไมต้องมีกระดาษ ทั้งที่ระบบอนุมัติ OT ในตัวเองได้อยู่แล้ว
   การกดอนุมัติในระบบคือการยืนยันของหัวหน้าคนเดียว แต่ OT คือเงินที่จ่ายออกจริง
   ฝ่ายบุคคลกับบัญชีต้องมีเอกสารที่มีลายเซ็นจริงเก็บเข้าแฟ้มประกอบการจ่าย
   หน้าจอในระบบใช้แทนไม่ได้ — ใบนี้จึงพิมพ์ให้หัวหน้าเซ็นแล้วเก็บไว้

   ใบนี้เป็น "รายคน ต่อ หนึ่งรอบตัดยอด" ไม่ใช่รวมทั้งบริษัทในแผ่นเดียว
   เพราะคนที่เซ็นคือหัวหน้าของคนนั้น และคนที่ถูกถามทีหลังคือเจ้าตัว

   โครงกระดาษลอกจาก EcVoucherPaper (ec-paper.jsx) ให้เอกสารที่ออกจากระบบเป็นชุดเดียวกัน
   คอลัมน์ตรงกับแผ่น OT ใน Excel (tmOtSheetFor) เป๊ะ ๆ เพื่อให้สองทางกระทบยอดกันได้

   ชื่อระดับบนสุดทุกตัวขึ้นต้นด้วย tm / Tm / TM_ (สคริปต์ทุกไฟล์ใช้ขอบเขตร่วมกัน)
   ══════════════════════════════════════════════════ */

/* ชั่วโมงบนกระดาษ — ทศนิยมสองตำแหน่ง เพราะฝ่ายบุคคลเอาไปคูณอัตราต่อชั่วโมงต่อ
   "2 ชม. 30 น." อ่านง่ายกว่าบนจอ แต่คูณต่อไม่ได้ จึงพิมพ์ทั้งสองแบบ */
const tmHrDec = (mins) => (Math.round(((+mins || 0) / 60) * 100) / 100).toFixed(2);

/* จัดกลุ่มใบ OT ตามคน — คืนรายการเรียงตามชื่อไทย
   ใช้ทะเบียนผู้ใช้เป็นแหล่งชื่อก่อนเสมอ (ดูเหตุผลที่ tmNameOf ใน attend.jsx) */
function tmOtByPerson(rows, users, cfg) {
  const map = {};
  (rows || []).forEach((r) => {
    if (!r) return;
    const k = r.userId || ("name:" + (r.userName || "ไม่ระบุชื่อ"));
    if (!map[k]) map[k] = { id: r.userId || null, name: window.tmNameOf(users, r.userId, r.userName) || "ไม่ระบุชื่อ", rows: [],
      mins: 0, minsApproved: 0, minsWaiting: 0, payApproved: 0, payWaiting: 0 };
    const g = map[k];
    g.rows.push(r);
    const m = +r.mins || 0;
    const pay = window.tmOtPayMins(r, cfg);
    g.mins += m;
    if (r.status === "approved") { g.minsApproved += m; g.payApproved += pay; }
    else if (r.status === "draft" || r.status === "sent") { g.minsWaiting += m; g.payWaiting += pay; }
  });
  const out = Object.keys(map).map((k) => map[k]);
  out.forEach((g) => g.rows.sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))
    || String(a.from || "").localeCompare(String(b.from || ""))));
  out.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  return out;
}

/* ── ใบสรุป OT รายคน ── */
function TmOtPaper({ person, period, rows, jobs, users, cfg, byName, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const list = React.useMemo(() => (rows || []).slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))
      || String(a.from || "").localeCompare(String(b.from || ""))), [rows]);

  /* รหัสงานบนใบ OT เก็บไว้เป็นข้อความ — เปิดทะเบียนงานหาชื่อเต็มมาเติมให้
     หัวหน้าที่เซ็นต้องอ่านออกว่างานไหน ไม่ใช่เห็นแค่รหัส */
  const jobName = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach((j) => { if (j && j.code) m[String(j.code)] = j.name || ""; if (j && j.id) m["#" + j.id] = j.name || ""; });
    return (rec) => m[String(rec.jobCode || "")] || m["#" + rec.jobId] || "";
  }, [jobs]);

  const sum = React.useMemo(() => {
    let approved = 0, waiting = 0, rejected = 0, payApproved = 0, payWaiting = 0;
    list.forEach((o) => {
      const m = +o.mins || 0;
      const pay = window.tmOtPayMins(o, cfg);
      if (o.status === "approved") { approved += m; payApproved += pay; }
      else if (o.status === "rejected" || o.status === "cancelled") rejected += m;
      else { waiting += m; payWaiting += pay; }
    });
    return { approved: approved, waiting: waiting, rejected: rejected, payApproved: payApproved, payWaiting: payWaiting };
  }, [list, cfg]);

  const doPrint = () => {
    const old = document.title;
    document.title = "ใบสรุป OT " + (person && person.name ? person.name : "") + " " + window.tmPeriodTH(period);
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const th = { textAlign: "center", padding: "6px 7px", fontSize: 10, fontWeight: 700, color: "#FFFFFF",
    background: "#1B9B75", border: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "6px 7px", fontSize: 10.5, color: "#15211A", border: "1px solid #DCE4DF",
    textAlign: "center", verticalAlign: "middle" };
  const tdL = Object.assign({}, td, { textAlign: "left" });

  return (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 160, background: "rgba(8,20,14,.55)",
      overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>

      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ใบสรุป OT · {(person || {}).name || "-"}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {window.tmPeriodTH(period)} · {list.length} ใบ · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”
          </div>
        </div>
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        {/* หัวกระดาษ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #1B9B75", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>ใบสรุปการทำงานล่วงเวลา</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>OVERTIME SUMMARY — FOR SUPERVISOR APPROVAL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandMark size={22} variant="light" />
              <window.BrandWord size={16} color="#0F2B33" />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#15211A" }}>{(person || {}).name || "-"}</div>
            <div>รอบ {window.tmPeriodTH(period)}</div>
            <div style={{ fontFamily: "var(--mono)" }}>{list.length} ใบ</div>
          </div>
        </div>

        {/* ข้อมูลหัวใบ */}
        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <TmPRow k="ชื่อ-สกุล" v={(person || {}).name || "-"} />
          <TmPRow k="รอบตัดยอด" v={window.tmPeriodTH(period)} />
          <TmPRow k="รวมชั่วโมงที่อนุมัติแล้ว" v={window.tmDur(sum.approved) + "  (" + tmHrDec(sum.approved) + " ชม.)"} />
          <TmPRow k="รวมชั่วโมงคิดค่าแรง" v={tmHrDec(sum.payApproved) + " ชม.  (คูณอัตราแต่ละประเภทแล้ว)"} />
          <TmPRow k="ยังรออนุมัติในระบบ" v={sum.waiting ? window.tmDur(sum.waiting) + "  (" + tmHrDec(sum.waiting) + " ชม.)" : "—"} />
          <TmPRow k="ผู้ออกเอกสาร" v={byName || "-"} />
          <TmPRow k="วันที่ออกเอกสาร" v={window.drDateTH(window.drToday(), true)} />
        </div>

        {/* รายการ OT */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #DCE4DF", paddingBottom: 5, marginBottom: 8 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: "#1B9B75" }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#15211A" }}>รายการทำงานล่วงเวลาในรอบนี้</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={Object.assign({}, th, { width: 26 })}>#</th>
                <th style={Object.assign({}, th, { width: 92 })}>วันที่</th>
                <th style={Object.assign({}, th, { width: 52 })}>ตั้งแต่</th>
                <th style={Object.assign({}, th, { width: 52 })}>ถึง</th>
                <th style={Object.assign({}, th, { width: 54 })}>รวม (ชม.)</th>
                <th style={Object.assign({}, th, { width: 86 })}>ประเภท</th>
                <th style={Object.assign({}, th, { width: 44 })}>อัตรา</th>
                <th style={Object.assign({}, th, { width: 58 })}>ชม.คิดค่าแรง</th>
                <th style={Object.assign({}, th, { textAlign: "left" })}>งานที่ทำ OT</th>
                <th style={Object.assign({}, th, { textAlign: "left" })}>ปฏิบัติหน้าที่</th>
                <th style={Object.assign({}, th, { width: 72 })}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={11} style={Object.assign({}, td, { padding: 20, color: "#7A8A81" })}>ไม่มีใบ OT ในรอบนี้</td></tr>
              )}
              {list.map((o, i) => {
                const nm = jobName(o);
                const rt = window.tmOtRate(o, cfg);
                return (
                  <tr key={o.id} style={i % 2 ? { background: "#F7FAF8" } : undefined}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{window.drDateTH(o.date)}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{o.from || "—"}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{o.to || "—"}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 700 })}>{tmHrDec(o.mins)}</td>
                    <td style={td}>{window.tmOtKindOf(o.kind).th}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>×{Math.round(rt * 100) / 100}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 700 })}>{tmHrDec((+o.mins || 0) * rt)}</td>
                    <td style={tdL}>
                      {o.jobCode ? <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{o.jobCode}</span> : <span style={{ color: "#7A8A81" }}>ไม่ระบุงาน</span>}
                      {nm && <span style={{ display: "block", color: "#4A5A51" }}>{nm}</span>}
                    </td>
                    <td style={tdL}>{o.reason || <span style={{ color: "#B04A3A" }}>— ไม่ได้กรอก —</span>}</td>
                    <td style={Object.assign({}, td, { fontWeight: 700,
                      color: o.status === "approved" ? "#10B981" : o.status === "rejected" || o.status === "cancelled" ? "#94A3B8" : "#D97706" })}>
                      {window.tmOtStatusOf(o.status).th}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={Object.assign({}, td, { textAlign: "right", fontWeight: 800, background: "#0A4D68", color: "#fff" })}>รวมที่อนุมัติแล้วในระบบ</td>
                <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 800, background: "#0A4D68", color: "#fff" })}>{tmHrDec(sum.approved)}</td>
                <td colSpan={2} style={Object.assign({}, td, { textAlign: "right", background: "#0A4D68", color: "#fff" })}>รวมชั่วโมงคิดค่าแรง</td>
                <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 800, background: "#0A4D68", color: "#fff" })}>{tmHrDec(sum.payApproved)}</td>
                <td colSpan={3} style={Object.assign({}, td, { textAlign: "left", background: "#0A4D68", color: "#fff" })}>ชั่วโมง (ชั่วโมงจริง {window.tmDur(sum.approved)})</td>
              </tr>
              {/* ยอดที่ยังรออนุมัติต้องแยกบรรทัด ไม่ใช่บวกรวมกับยอดที่อนุมัติแล้ว
                  ไม่งั้นกระดาษใบนี้จะกลายเป็นยอดจ่ายที่ยังไม่มีใครอนุมัติ */}
              <tr>
                <td colSpan={4} style={Object.assign({}, td, { textAlign: "right", fontWeight: 700,
                  background: sum.waiting ? "#FEF3C7" : "#F7FAF8", color: sum.waiting ? "#92400E" : "#7A8A81" })}>ยังรออนุมัติในระบบ</td>
                <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 700,
                  background: sum.waiting ? "#FEF3C7" : "#F7FAF8", color: sum.waiting ? "#92400E" : "#7A8A81" })}>{tmHrDec(sum.waiting)}</td>
                <td colSpan={2} style={Object.assign({}, td, { textAlign: "right",
                  background: sum.waiting ? "#FEF3C7" : "#F7FAF8", color: sum.waiting ? "#92400E" : "#7A8A81" })}>คิดค่าแรงได้</td>
                <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 700,
                  background: sum.waiting ? "#FEF3C7" : "#F7FAF8", color: sum.waiting ? "#92400E" : "#7A8A81" })}>{tmHrDec(sum.payWaiting)}</td>
                <td colSpan={3} style={Object.assign({}, td, { textAlign: "left",
                  background: sum.waiting ? "#FEF3C7" : "#F7FAF8", color: sum.waiting ? "#92400E" : "#7A8A81" })}>
                  ชั่วโมง {sum.waiting ? "— ต้องกดอนุมัติในระบบก่อนจึงจะนับเป็นยอดจ่าย" : ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ช่องเซ็น — สามช่อง เพราะเส้นทางจริงคือ เจ้าตัว → หัวหน้า → ฝ่ายบุคคล */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, breakInside: "avoid" }}>
          {[{ t: "ผู้ขอทำงานล่วงเวลา", n: (person || {}).name || "" },
            { t: "หัวหน้างานผู้อนุมัติ", n: "" },
            { t: "ฝ่ายบุคคล / ผู้ตรวจสอบ", n: "" }].map((s) => (
            <div key={s.t}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{s.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6 }} />
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>ชื่อ: <b>{s.n || "…………………………"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>วันที่: …………………………</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: "9px 12px", background: "#F7FAF8", border: "1px solid #DCE4DF", borderRadius: 7,
          fontSize: 9.5, color: "#5A6B62", lineHeight: 1.8 }}>
          เวลาในใบนี้เป็นเวลาที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้ — ถ้าไม่แน่ใจให้เทียบกับแผ่น “เวลาทำงาน” ของวันนั้น
          <br />การเซ็นบนกระดาษไม่ได้เปลี่ยนสถานะในระบบ ใบที่ยังรออนุมัติต้องกดอนุมัติในระบบด้วย
          <br />“ชม.คิดค่าแรง” = ชั่วโมงจริง × อัตราของประเภทนั้น ตามที่บริษัทตั้งไว้ในระบบ ณ วันที่เปิดใบ
          (แต่ละใบตรึงอัตราของตัวเองไว้ การแก้อัตราทีหลังไม่ย้อนมาเปลี่ยนใบนี้)
          <br />ใบนี้สรุปถึงชั่วโมงคิดค่าแรงเท่านั้น ยังไม่ใช่จำนวนเงิน เพราะอัตราค่าจ้างรายคนไม่ได้อยู่ในระบบนี้
          — ฝ่ายบุคคลต้องคูณอัตราค่าจ้างของพนักงานคนนี้อีกที
        </div>

        <div style={{ marginTop: 12, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          เอกสารนี้ออกจากระบบติดตามงานติดตั้ง flash+solar · พิมพ์เมื่อ {window.drDateTH(window.drToday())}
        </div>
      </div>
    </div>
  );
}

/* แถวข้อมูลหัวกระดาษ — คู่กับ EcVPRow ของใบสำคัญจ่าย แต่แยกตัวไว้เพราะไฟล์นั้นไม่ได้ export ออกมา */
function TmPRow({ k, v }) {
  return (
    <React.Fragment>
      <div style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#5A6B62",
        background: "#F7FAF8", borderBottom: "1px solid #ECF1EE", whiteSpace: "nowrap" }}>{k}</div>
      <div style={{ padding: "6px 10px", fontSize: 11.5, color: "#15211A", borderBottom: "1px solid #ECF1EE" }}>{v || "—"}</div>
    </React.Fragment>
  );
}

Object.assign(window, { TmOtPaper, TmPRow, tmOtByPerson, tmHrDec });
