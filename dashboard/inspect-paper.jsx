/* ══════════════════════════════════════════════════
   ใบตรวจสอบงาน — เอกสารที่ออกจากระบบ (A4 พิมพ์/บันทึก PDF)

   หนึ่งชุดมีสองส่วนตามแบบฟอร์มจริง แล้วพิมพ์ออกมาเป็นไฟล์เดียว
   ── หน้าแรก  Inspection Report (ใบขอตรวจ + ผลการตรวจ + ช่องเซ็น) — ชื่อเรื่องมาจากประเภทที่เลือกในใบ
   ── หน้าถัดไป Photo Report (ใบรายงานรูปถ่ายประกอบการตรวจ)

   ใบนี้ต้องมีลายเซ็นจริงของสามฝ่าย (ผู้รับเหมา · ผู้จัดการโครงการ · ลูกค้า)
   จึงพิมพ์ช่องเซ็นเปล่าไว้เสมอ ต่อให้พิมพ์ชื่อผู้ลงนามมาจากในระบบแล้วก็ตาม

   หัวข้อในใบเป็นอังกฤษ/ไทยคู่กันตามต้นฉบับ จึงไม่มีปุ่มเลือกภาษาเหมือนเอกสารใบอื่น
   ลอกโครงหน้ากระดาษ/ปุ่มพิมพ์มาจาก EcVoucherPaper (ec-paper.jsx)

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย rp / Rp
   ══════════════════════════════════════════════════ */

const RP_INK = "#15211A";
const RP_LINE = "#C9D5CE";
const RP_SOFT = "#5A6B62";

/* ช่องตารางรายการตรวจ — เส้นบาง ตัวเล็ก ให้ลงกระดาษ A4 ได้หลายข้อโดยยังอ่านออก */
const rpTh = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: RP_SOFT,
  borderBottom: "1px solid " + RP_LINE, borderTop: "1px solid " + RP_LINE, whiteSpace: "nowrap" };
const rpTd = { padding: "5px 7px", fontSize: 10.5, color: RP_INK, borderBottom: "1px solid #ECF1EE",
  verticalAlign: "top", wordBreak: "break-word" };

/* วันที่บนเอกสาร — ใบนี้เป็นเอกสารที่ส่งให้ลูกค้าและผู้จัดการโครงการซึ่งอ่านไทย
   จึงใช้รูปแบบไทยเหมือนเอกสารใบอื่นของระบบ */
const rpDate = (v) => (!v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10));
const rpDateTime = (v) => (!v ? "" : window.drDateTH ? window.drDateTH(String(v).replace("T", " "), true) : String(v).replace("T", " "));

/* เส้นประสำหรับช่องที่เว้นไว้ให้เขียนมือ — ถ้ามีข้อมูลในระบบก็พิมพ์ทับลงไปบนเส้น */
function RpFill({ value, minWidth }) {
  return (
    <span style={{ display: "inline-block", minWidth: minWidth || 120, borderBottom: "1px dotted " + RP_LINE,
      padding: "0 4px 1px", fontSize: 11, color: RP_INK, whiteSpace: "pre-wrap" }}>
      {value || " "}
    </span>
  );
}

/* หนึ่งบรรทัดของใบ: หัวข้ออังกฤษ + ไทยในวงเล็บ แล้วตามด้วยช่องเติม */
function RpRow({ en, th, value, minWidth }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
      <span style={{ flexShrink: 0, minWidth: 178 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: RP_INK }}>{en}</span>
        {th ? <span style={{ fontSize: 10, color: RP_SOFT }}> ({th})</span> : null}
      </span>
      <span style={{ fontSize: 11, color: RP_SOFT, flexShrink: 0 }}>:</span>
      <span style={{ flex: 1, minWidth: 0 }}><RpFill value={value} minWidth={minWidth} /></span>
    </div>
  );
}

/* ช่องลงนามท้ายใบ — สี่ช่องเรียงกันตามต้นฉบับ */
function RpSign({ en, th, role, name }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: RP_INK }}>{en}</div>
      <div style={{ fontSize: 9.5, color: RP_SOFT, marginBottom: 52 }}>({th})</div>
      <div style={{ borderTop: "1px solid " + RP_LINE, paddingTop: 5, fontSize: 10, color: RP_INK, minHeight: 15 }}>{name || " "}</div>
      {/* วงเล็บสำหรับเขียนชื่อตัวบรรจง — เว้นให้สูงพอเขียนด้วยปากกาจริง ไม่ใช่พอให้เห็นแค่วงเล็บ */}
      <div style={{ fontSize: 11, color: RP_SOFT, marginTop: 5, lineHeight: 1.9 }}>(...........................)</div>
      <div style={{ fontSize: 9.5, color: RP_SOFT, marginTop: 10 }}>………. / ………. / ……….</div>
    </div>
  );
}

function InspectionPaper({ job, rec, photos, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const B = window.BRANDING || {};
  const j = job || {};
  const r = rec || {};
  const list = photos || [];
  const res = (window.IR_RESULT_BY || {})[r.result] || null;
  const items = Array.isArray(r.items) ? r.items : [];
  const tally = window.irItemTally ? window.irItemTally(items) : { pass: 0, fail: 0, na: 0, blank: 0, total: items.length };

  const doPrint = () => {
    const old = document.title;
    document.title = (r.no || "IR") + " " + (r.kind || "Inspection Report") + " " + (j.code || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  /* หนึ่งหน้ารูป = 6 รูป (2 คอลัมน์ x 3 แถว) — ขนาดที่ยังเห็นรอยบุบ/รอยรั่วชัดบนกระดาษ A4 */
  const pages = [];
  for (let i = 0; i < list.length; i += 6) pages.push(list.slice(i, i + 6));

  /* หัวกระดาษ — ตราบริษัทมาก่อนชื่อเอกสาร เพราะใบนี้ส่งออกไปถึงมือลูกค้าและผู้จัดการโครงการ
     ต้องดูออกตั้งแต่แวบแรกว่าใครเป็นคนออกใบ · โครงเดียวกับหัวใบสำคัญจ่าย (ec-paper.jsx) */
  const headBar = (title, rev) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap",
      borderBottom: "2px solid " + RP_INK, paddingBottom: 9, marginBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          {window.BrandDoc ? <window.BrandDoc height={46} /> : null}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: RP_INK, letterSpacing: "-.2px" }}>{title}</div>
        {/* ประเภทการตรวจคือหัวเรื่องจริงของใบ — คนอ่านต้องรู้ตั้งแต่บรรทัดแรกว่าตรวจเรื่องอะไร */}
        {r.kind ? <div style={{ fontSize: 12, fontWeight: 700, color: RP_INK, marginTop: 1 }}>{r.kind}</div> : null}
        <div style={{ fontSize: 10, color: RP_SOFT, marginTop: 2 }}>
          {/* ชื่อบริษัทอยู่ข้างตราด้านบนแล้ว บรรทัดนี้เหลือแค่เลขงานกับเลขใบ */}
          {[j.code, r.no].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", fontSize: 9.5, color: RP_SOFT, lineHeight: 1.6 }}>
        {B.tel ? <div>โทร {B.tel}</div> : null}
        {B.email ? <div>{B.email}</div> : null}
        <div style={{ marginTop: 3 }}>Rev. <b style={{ color: RP_INK }}>{rev}</b></div>
        <div>Approved By: <b style={{ color: RP_INK }}>{r.approvedBy || "—"}</b></div>
      </div>
    </div>
  );

  return (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 170, background: "rgba(8,20,14,.55)",
      overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>

      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{r.no || "ใบตรวจ"} · {r.kind || "Inspection Report"}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {list.length ? list.length + " รูป · " + pages.length + " หน้ารูป" : "ยังไม่มีรูป — ใบรายงานรูปถ่ายจะไม่ถูกพิมพ์"} · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”
          </div>
        </div>
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: RP_INK,
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        {/* ══ หน้าแรก — ใบขอตรวจรับมอบ ══ */}
        {headBar("Inspection Report", "00")}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px", marginBottom: 10 }}>
          <RpRow en="To" th="เรียน" value={r.to} />
          <RpRow en="Project Name" th="ชื่อโครงการ" value={r.project || j.name} />
          <RpRow en="Contractor" th="ผู้รับเหมา" value={r.contractor} />
          <RpRow en="Request Date" th="วันที่ขอ" value={rpDate(r.reqDate)} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
            Request to inspect <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(หัวข้อการตรวจสอบ)</span>
          </div>
          <div style={{ border: "1px solid " + RP_LINE, borderRadius: 4, padding: "9px 11px", fontSize: 11, minHeight: 52, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {r.reqItems || " "}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 26px", marginBottom: 10 }}>
          <RpRow en="Inspection Date and Time" th="วันและเวลาที่ตรวจสอบ" value={rpDateTime(r.inspAt)} />
          <RpRow en="Ref IR No." th="อ้างอิงจาก IR เลขที่" value={r.refIr} />
          <RpRow en="Others" th="อื่น ๆ" value={r.others} />
          <RpRow en="Request by" th="ขอโดย" value={r.reqBy} />
        </div>

        {/* ตารางรายการตรวจ — บอกว่าตรวจอะไรไปบ้างและข้อไหนไม่ผ่าน
            ผลรวมข้างล่างบอกได้แค่ผ่าน/ไม่ผ่านทั้งใบ แต่บอกไม่ได้ว่าติดตรงไหน */}
        {items.length > 0 && (
          <div style={{ marginBottom: 12, breakInside: "avoid", pageBreakInside: "avoid" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                Checklist <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(รายการตรวจ)</span>
              </span>
              <span style={{ fontSize: 10, color: RP_SOFT }}>
                ผ่าน {tally.pass} · ไม่ผ่าน {tally.fail}
                {tally.na ? " · ไม่เกี่ยวข้อง " + tally.na : ""}
                {tally.blank ? " · ยังไม่ระบุ " + tally.blank : ""}
                {" จากทั้งหมด " + tally.total + " ข้อ"}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, rpTh, { width: 30 })}>#</th>
                  <th style={rpTh}>รายการตรวจ (Item)</th>
                  <th style={Object.assign({}, rpTh, { width: 96, textAlign: "center" })}>ผล (Result)</th>
                  <th style={Object.assign({}, rpTh, { width: "31%" })}>หมายเหตุ (Remark)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const m = (window.IR_ITEM_BY || {})[it.result] || null;
                  return (
                    <tr key={it.id || i}>
                      <td style={Object.assign({}, rpTd, { textAlign: "center", color: RP_SOFT })}>{i + 1}</td>
                      <td style={rpTd}>{it.name || " "}</td>
                      <td style={Object.assign({}, rpTd, { textAlign: "center", fontWeight: 700, color: m ? m.color : RP_SOFT })}>
                        {m ? m.mark + " " + m.th : "—"}
                      </td>
                      <td style={Object.assign({}, rpTd, { color: RP_SOFT })}>{it.note || " "}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ผลการตรวจสอบ — ช่องติ๊กสี่ช่องตามต้นฉบับ ช่องที่เลือกไว้ในระบบจะถูกกาให้ */}
        <div style={{ border: "1px solid " + RP_LINE, borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            The result of inspection <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(ผลการตรวจสอบ)</span>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {(window.IR_RESULTS || []).map((o) => {
              const on = r.result === o.key;
              return (
                <span key={o.key} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                  <span style={{ width: 12, height: 12, border: "1px solid " + RP_INK, display: "inline-grid", placeItems: "center",
                    fontSize: 10, fontWeight: 800, lineHeight: 1 }}>{on ? "✓" : " "}</span>
                  {o.en} ({o.th})
                </span>
              );
            })}
          </div>
          {res && res.key === "others" && r.resultOther
            ? <div style={{ fontSize: 11, marginTop: 8 }}>ระบุ: {r.resultOther}</div> : null}
        </div>

        {/* สรุปผลเป็นข้อความ — ส่วนที่คนอ่านใบอ่านจริงก่อนอย่างอื่น จึงวางไว้ใต้ผลการตรวจทันที
            ไม่มีข้อความก็ไม่ต้องพิมพ์กล่องเปล่าให้เปลืองที่ */}
        {r.summary ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
              Summary <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(สรุปผลการตรวจ)</span>
            </div>
            <div style={{ border: "1px solid " + RP_LINE, borderRadius: 4, padding: "9px 11px", fontSize: 11,
              whiteSpace: "pre-wrap", lineHeight: 1.7, background: "#F7FAF9" }}>
              {r.summary}
            </div>
          </div>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
            Note <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(หมายเหตุ)</span>
          </div>
          <div style={{ border: "1px solid " + RP_LINE, borderRadius: 4, padding: "9px 11px", fontSize: 11, minHeight: 60, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {r.note || " "}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <RpSign en="Issue By" th="ผู้ออกใบ" role="EPC" name={r.issueBy} />
          <RpSign en="Inspected By" th="ตรวจสอบโดย" role="EPC" name={r.inspectedBy} />
          <RpSign en="Approved By" th="อนุมัติโดย" role="Project Manager" name={r.approvedBy} />
          <RpSign en="Approved by Client" th="อนุมัติโดยลูกค้า" role="Customer" name={r.clientBy} />
        </div>

        {/* ══ หน้าถัดไป — ใบรายงานรูปถ่าย ══ */}
        {pages.map((page, pi) => (
          <div key={pi} style={{ breakBefore: "page", pageBreakBefore: "always", paddingTop: 26 }}>
            {headBar("Photo Report", "00")}
            <div style={{ fontSize: 11, marginBottom: 10 }}>
              PROJECT : <b>{r.project || j.name || "—"}</b>
              {j.address ? <span style={{ color: RP_SOFT }}> · {j.address}</span> : null}
              {pages.length > 1 ? <span style={{ color: RP_SOFT }}> · หน้ารูปที่ {pi + 1}/{pages.length}</span> : null}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {page.map((p, i) => (
                <div key={p.id} style={{ border: "1px solid " + RP_LINE, borderRadius: 4, overflow: "hidden", breakInside: "avoid", pageBreakInside: "avoid" }}>
                  <img src={p.dataUrl} alt={p.cap || "รูปประกอบการตรวจ"} style={{ width: "100%", height: 186, objectFit: "cover", display: "block", background: "#EEF3F3" }} />
                  <div style={{ padding: "6px 9px", fontSize: 10, color: RP_INK, borderTop: "1px solid " + RP_LINE, minHeight: 26 }}>
                    <b style={{ color: RP_SOFT }}>{pi * 6 + i + 1}.</b> {p.cap || " "}
                  </div>
                </div>
              ))}
            </div>

            {/* ไม่มีช่องเซ็นท้ายหน้ารูป — เซ็นครั้งเดียวที่หน้าแรกซึ่งเป็นหน้าที่บันทึกผลก็พอ
                เซ็นซ้ำอีกชุดไม่ได้เพิ่มน้ำหนักอะไร มีแต่ทำให้ต้องไล่เซ็นหลายที่ */}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { InspectionPaper, RpRow, RpSign, RpFill });
