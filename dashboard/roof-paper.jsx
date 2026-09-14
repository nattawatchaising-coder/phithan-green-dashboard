/* ══════════════════════════════════════════════════
   ส่งมอบหลังคา — เอกสารที่ออกจากระบบ (A4 พิมพ์/บันทึก PDF)

   หนึ่งชุดมีสองส่วนตามแบบฟอร์มจริง แล้วพิมพ์ออกมาเป็นไฟล์เดียว
   ── หน้าแรก  Inspection Report of Roof Handover (ใบขอตรวจรับมอบ + ผลการตรวจ + ช่องเซ็น)
   ── หน้าถัดไป Photo Report (ใบรายงานรูปถ่ายสภาพหลังคา ณ วันรับมอบ)

   ใบนี้ต้องมีลายเซ็นจริงของสามฝ่าย (ผู้รับเหมา · ผู้จัดการโครงการ · ลูกค้า)
   จึงพิมพ์ช่องเซ็นเปล่าไว้เสมอ ต่อให้พิมพ์ชื่อผู้ลงนามมาจากในระบบแล้วก็ตาม

   หัวข้อในใบเป็นอังกฤษ/ไทยคู่กันตามต้นฉบับ จึงไม่มีปุ่มเลือกภาษาเหมือนเอกสารใบอื่น
   ลอกโครงหน้ากระดาษ/ปุ่มพิมพ์มาจาก EcVoucherPaper (ec-paper.jsx)

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย rp / Rp / Roof
   ══════════════════════════════════════════════════ */

const RP_INK = "#15211A";
const RP_LINE = "#C9D5CE";
const RP_SOFT = "#5A6B62";

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
      <div style={{ fontSize: 9.5, color: RP_SOFT, marginBottom: 30 }}>({th})</div>
      <div style={{ borderTop: "1px solid " + RP_LINE, paddingTop: 5, fontSize: 10, color: RP_INK, minHeight: 15 }}>{name || " "}</div>
      <div style={{ fontSize: 9.5, color: RP_SOFT }}>{role}</div>
      <div style={{ fontSize: 9.5, color: RP_SOFT, marginTop: 7 }}>………. / ………. / ……….</div>
    </div>
  );
}

function RoofHandoverPaper({ job, rec, photos, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const B = window.BRANDING || {};
  const j = job || {};
  const r = rec || {};
  const list = photos || [];
  const res = (window.RF_RESULT_BY || {})[r.result] || null;

  const doPrint = () => {
    const old = document.title;
    document.title = "Roof Handover " + (j.code || "") + " " + (j.name || "");
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
          {window.BrandMark ? <window.BrandMark size={26} variant="light" /> : null}
          {window.BrandWord ? <window.BrandWord size={18} color={B.ink || RP_INK} /> : null}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: RP_INK, letterSpacing: "-.2px" }}>{title}</div>
        <div style={{ fontSize: 10, color: RP_SOFT, marginTop: 2 }}>
          {B.legal || ""}{j.code ? " · " + j.code : ""}
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
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ใบส่งมอบหลังคา · {j.code || "-"}</div>
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
        {headBar("Inspection Report of Roof Handover", "00")}

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

        {/* ผลการตรวจสอบ — ช่องติ๊กสี่ช่องตามต้นฉบับ ช่องที่เลือกไว้ในระบบจะถูกกาให้ */}
        <div style={{ border: "1px solid " + RP_LINE, borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            The result of inspection <span style={{ fontSize: 10, color: RP_SOFT, fontWeight: 500 }}>(ผลการตรวจสอบ)</span>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            {(window.RF_RESULTS || []).map((o) => {
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
            {headBar("Photo Report · Roof Handover Report", "00")}
            <div style={{ fontSize: 11, marginBottom: 10 }}>
              PROJECT : <b>{r.project || j.name || "—"}</b>
              {j.address ? <span style={{ color: RP_SOFT }}> · {j.address}</span> : null}
              {pages.length > 1 ? <span style={{ color: RP_SOFT }}> · หน้ารูปที่ {pi + 1}/{pages.length}</span> : null}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {page.map((p, i) => (
                <div key={p.id} style={{ border: "1px solid " + RP_LINE, borderRadius: 4, overflow: "hidden", breakInside: "avoid", pageBreakInside: "avoid" }}>
                  <img src={p.dataUrl} alt={p.cap || "รูปหลังคา"} style={{ width: "100%", height: 186, objectFit: "cover", display: "block", background: "#EEF3F3" }} />
                  <div style={{ padding: "6px 9px", fontSize: 10, color: RP_INK, borderTop: "1px solid " + RP_LINE, minHeight: 26 }}>
                    <b style={{ color: RP_SOFT }}>{pi * 6 + i + 1}.</b> {p.cap || " "}
                  </div>
                </div>
              ))}
            </div>

            {/* ช่องเซ็นท้ายใบรูป — มีเฉพาะหน้าสุดท้าย ไม่งั้นจะซ้ำทุกหน้าโดยไม่จำเป็น */}
            {pi === pages.length - 1 && (
              <div style={{ display: "flex", gap: 14, marginTop: 20, breakInside: "avoid", pageBreakInside: "avoid" }}>
                <RpSign en="Inspected by" th="ตรวจสอบโดย" role="EPC" name={r.inspectedBy} />
                <RpSign en="Approved by" th="อนุมัติโดย" role={B.legal || "Contractor"} name={r.approvedBy} />
                <RpSign en="Approved by Client" th="อนุมัติโดยลูกค้า" role="Client" name={r.clientBy} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { RoofHandoverPaper, RpRow, RpSign, RpFill });
