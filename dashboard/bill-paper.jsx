/* ══════════════════════════════════════════════════
   ชุดเอกสารงวดงาน — A4 พิมพ์ / บันทึก PDF

   หนึ่งชุดมีสองส่วนตามที่บริษัททำส่งลูกค้าอยู่จริง แล้วพิมพ์ออกเป็นไฟล์เดียว
   ── แผ่นแรก   หนังสือแจ้งส่งมอบงานและวางบิลงวดที่ N (หัวจดหมาย · รายการงาน · ช่องเซ็นสองฝ่าย)
   ── แผ่นถัดไป รูปภาพประกอบการวางบิลงวดที่ N และส่งมอบงาน (แผ่นละ 4 รูป + ช่องเซ็นสามฝ่าย)

   ใบนี้เป็นเอกสารส่งมอบงาน ไม่ใช่ใบกำกับภาษี — เขียนกำกับไว้บนกระดาษ
   เพราะฝ่ายบัญชีของลูกค้าเอาไปตั้งหนี้แล้วเรียกใบกำกับตามหลัง ถ้าไม่บอกจะสับสนกันทุกงวด

   ลอกโครงหน้ากระดาษ/ปุ่มพิมพ์มาจาก EcVoucherPaper (ec-paper.jsx) และ InspectionPaper
   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย bp / Bp / Bl
   ══════════════════════════════════════════════════ */

const BP_INK = "#15211A";
const BP_LINE = "#C9D5CE";
const BP_SOFT = "#5A6B62";
const BP_ACCENT = "#6366F1";

/* กระดาษต้องแขวนตัวเองไว้กับ body ตอนพิมพ์ ไม่งั้นโดนกฎซ่อนเมนูซ่อนไปด้วยแล้วได้ PDF หน้าขาว
   (useEcPrintBody ใน ec-paper.jsx ไม่ได้ export ขึ้น window — คัดมาไว้ในไฟล์เอง) */
function useBlPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}

const bpDate = (v) => (!v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10));

/* หัวจดหมาย — ตราบริษัทกับข้อมูลนิติบุคคลอยู่แถวเดียวกัน แบบเดียวกับใบเสนอราคา
   ใบนี้ออกไปถึงฝ่ายบัญชีของลูกค้าที่ไม่เคยเจอเรา ต้องอ่านออกตั้งแต่แวบแรกว่าใครส่งมา */
function BpHead({ compact }) {
  const B = window.BRANDING || {};
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
      borderBottom: "2px solid " + BP_INK, paddingBottom: compact ? 7 : 10, marginBottom: compact ? 10 : 16 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
        {window.BrandDoc ? <window.BrandDoc height={compact ? 36 : 46} name={false} /> : null}
        <div style={{ minWidth: 0, lineHeight: 1.55 }}>
          <div style={{ fontSize: compact ? 12 : 13, fontWeight: 800, color: BP_INK }}>{B.legal}</div>
          {B.legalTH ? <div style={{ fontSize: compact ? 9.5 : 10.5, color: BP_SOFT }}>{B.legalTH}</div> : null}
          {!compact && B.addrTH ? <div style={{ fontSize: 9.5, color: BP_SOFT }}>{B.addrTH}</div> : null}
          {!compact && B.taxId ? <div style={{ fontSize: 9.5, color: BP_SOFT }}>เลขประจำตัวผู้เสียภาษี {B.taxId}</div> : null}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", fontSize: 9.5, color: BP_SOFT, lineHeight: 1.7 }}>
        {B.tel ? <div>โทร {B.tel}</div> : null}
        {B.email ? <div>{B.email}</div> : null}
      </div>
    </div>
  );
}

/* ช่องลงนาม — ที่ว่างเหนือเส้นคือที่เซ็นจริง ต้องสูงพอให้ลายเซ็นคนไม่ชนตัวหนังสือด้านบน
   และวงเล็บใต้เส้นต้องสูงพอเขียนชื่อตัวบรรจงด้วยปากกาจริง (กฎเดียวกับ RpSign) */
/* จำนวนบนใบ — ไม่มีก็คืนค่าว่าง คอลัมน์จำนวนจะได้หายไปทั้งแถว ไม่ใช่โชว์ 0 */
function bpQty(it) {
  const q = (it || {}).qty;
  const n = q === "" || q == null ? null : +q;
  return n != null && isFinite(n) && n > 0 ? (Math.round(n * 100) / 100).toLocaleString("en-US") : "";
}

function BpSign({ role, who, pad, date }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: 10.5, color: BP_SOFT, marginBottom: pad == null ? 46 : pad }}>ลงชื่อ</div>
      <div style={{ borderTop: "1px solid " + BP_LINE, paddingTop: 5, fontSize: 10.5, fontWeight: 700, color: BP_INK, minHeight: 15 }}>{role}</div>
      <div style={{ fontSize: 11, color: BP_SOFT, marginTop: 4, lineHeight: 1.9 }}>(.........................................)</div>
      {who ? <div style={{ fontSize: 9.5, color: BP_SOFT, marginTop: 3, wordBreak: "break-word" }}>{who}</div> : null}
      {date !== false ? <div style={{ fontSize: 9.5, color: BP_SOFT, marginTop: 8 }}>………. / ………. / ……….</div> : null}
    </div>
  );
}

/* ── ชุดเอกสารของหนึ่งงวด ──
   part: "all" | "letter" | "photos" — บัญชีบางทีต้องส่งซ้ำแค่หน้ารูป ไม่ต้องพิมพ์จดหมายใหม่ */
function BlDeliveryPaper({ job, bill, row, photos, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [part, setPart] = React.useState("all");
  useBlPrintBody();

  const B = window.BRANDING || {};
  const j = job || {};
  const b = bill || {};
  const r = row || {};
  const list = (photos || []).filter((p) => p && p.dataUrl);
  const st = window.blStatusOf(r.status);
  const amount = window.blR2(r.amount);
  const rate = +b.vatRate || 0;
  const base = rate > 0 ? window.blR2(amount / (1 + rate / 100)) : amount;
  const vat = window.blR2(amount - base);
  const kwp = +b.kwp || +j.kw || 0;
  const site = [j.address, j.province].filter(Boolean).join(" ");
  /* สถานที่ติดตั้ง = ชื่อผู้ว่าจ้าง + ที่อยู่หน้างาน — ใบนี้ถูกเอาไปแนบกับเอกสารของลูกค้าเอง
     ที่อยู่เปล่า ๆ ไม่พอให้คนอ่านรู้ว่าเป็นไซต์ของใคร */
  const place = [j.name, site].filter(Boolean).join(" ");
  const docNo = r.docNo || window.blDocNo(j, r);
  /* ข้อบนใบ = ชื่อรายการที่ต่อจำนวนกับหน่วยเข้าไปแล้ว ("ส่งแผงโซลาร์เซลล์ จำนวน 120 แผง") */
  const items = window.blItemsUsed(r);

  const doPrint = () => {
    const old = document.title;
    document.title = docNo + " วางบิลงวดที่ " + (r.n || 1) + " " + (j.code || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  /* หนึ่งแผ่น = 4 รูป (2x2) — น้อยกว่าใบตรวจงานที่ใส่ 6 เพราะแผ่นนี้มีบรรทัดคำบรรยาย
     กับช่องเซ็นกินที่ไปอีกราวหนึ่งในสี่ของหน้า
     รายการคนละข้อไม่ปนแผ่นกัน — ลูกค้าเปิดหน้าไหนก็รู้ว่ากำลังดูงานอะไรอยู่ แม้ใบจะถูกแยกถ่ายสำเนา */
  const groups = window.blPhotoGroups(r, list);
  const pages = [];
  groups.forEach((g) => {
    const n = Math.ceil(g.photos.length / 4);
    for (let i = 0; i < g.photos.length; i += 4) {
      pages.push({ head: g.head, date: g.date, shots: g.photos.slice(i, i + 4), sub: i / 4 + 1, subN: n });
    }
  });

  const paper = { maxWidth: 900, margin: "0 auto", background: "#fff", color: BP_INK,
    padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" };

  const tab = (id, label) => (
    <button key={id} onClick={() => setPart(id)}
      style={{ padding: "7px 12px", borderRadius: 9, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (part === id ? BP_ACCENT : "var(--border-strong)"),
        background: part === id ? BP_ACCENT + "18" : "var(--surface)", color: part === id ? BP_ACCENT : "var(--text-2)" }}>
      {label}
    </button>
  );

  return ReactDOM.createPortal((
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 175, background: "rgba(8,20,14,.55)",
      overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>

      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{docNo} · วางบิลงวดที่ {r.n || 1}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {j.code || "-"} · {window.sBaht(amount)} บาท · {st.th}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {tab("all", "ทั้งชุด")}
          {tab("letter", "เฉพาะใบแจ้งส่งมอบ")}
          {tab("photos", "เฉพาะรูป")}
        </div>
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* ── แผ่นแรก · หนังสือแจ้งส่งมอบงานและวางบิล ── */}
      {part !== "photos" && (
        <div className="sv-rep-paper" style={paper}>
          <div className="bl-page">
            <BpHead />

            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, color: BP_SOFT, lineHeight: 1.8, marginBottom: 4 }}>
              <div style={{ textAlign: "right" }}>
                <div>เลขที่ <b style={{ color: BP_INK, fontFamily: "var(--mono)" }}>{docNo}</b></div>
                <div>วันที่ <b style={{ color: BP_INK }}>{bpDate(r.docDate) || "…………………………"}</b></div>
              </div>
            </div>

            <div style={{ textAlign: "center", margin: "6px 0 18px" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: BP_INK, letterSpacing: "-.2px" }}>
                หนังสือแจ้งส่งมอบงานและวางบิล งวดที่ {r.n || 1}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>
                WORK DELIVERY &amp; PAYMENT NOTICE
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: BP_INK, lineHeight: 2, marginBottom: 14 }}>
              <div><b style={{ display: "inline-block", minWidth: 58 }}>เรื่อง</b> {window.blSubjectOf(r)}</div>
              <div><b style={{ display: "inline-block", minWidth: 58 }}>เรียน</b> {j.name || "…………………………"}</div>
              <div><b style={{ display: "inline-block", minWidth: 58 }}>อ้างถึง</b> {b.ref || (b.quoteNo ? "ใบเสนอราคาเลขที่ " + b.quoteNo : "…………………………")}</div>
            </div>

            <div style={{ fontSize: 11.5, color: BP_INK, lineHeight: 2, textIndent: 38, marginBottom: 10 }}>
              ตามที่ {B.legalTH || B.legal} ได้รับความไว้วางใจจาก {j.name || "…………………………"}{" "}
              ให้ดำเนินการติดตั้งระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์
              {kwp > 0 ? " ขนาดกำลังการผลิต " + kwp + " กิโลวัตต์" : ""}{place ? " ณ " + place : ""}{" "}
              ทาง{B.legalTH || B.legal} ได้ดำเนินงานในงวดที่ {r.n || 1} แล้วเสร็จเรียบร้อย ประกอบด้วยรายการดังต่อไปนี้
            </div>

            {/* จำนวนกับหน่วยยืนเป็นคอลัมน์ของตัวเอง — สายตาไล่ลงมาทีเดียวก็รวมของได้
                ถ้าปล่อยให้ต่อท้ายชื่อรายการ เลขจะเยื้องกันทุกบรรทัดตามความยาวชื่องาน */}
            <div style={{ margin: "0 0 14px 38px" }}>
              {items.length ? items.map((it, i) => (
                <div key={it.id || i} style={{ display: "flex", gap: 8, fontSize: 11.5, color: BP_INK, lineHeight: 1.8, marginBottom: 3 }}>
                  <span style={{ flexShrink: 0, fontWeight: 700, minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{it.text}</span>
                  {bpQty(it) ? (
                    <React.Fragment>
                      <span style={{ flexShrink: 0, width: 40, color: BP_SOFT }}>จำนวน</span>
                      <span style={{ flexShrink: 0, width: 58, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700 }}>{bpQty(it)}</span>
                      <span style={{ flexShrink: 0, width: 52 }}>{it.unit || ""}</span>
                    </React.Fragment>
                  ) : null}
                </div>
              )) : (
                <div style={{ fontSize: 11, color: "#B04A3A" }}>— ยังไม่ได้ระบุรายการงานของงวดนี้ —</div>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: BP_INK, lineHeight: 2, textIndent: 38, marginBottom: 14 }}>
              จึงเรียนมาเพื่อโปรดพิจารณาตรวจรับงาน และดำเนินการชำระเงินค่างวดงานที่ {r.n || 1}{" "}
              เป็นจำนวนเงิน {window.sBaht(amount)} บาท ({window.ecBahtText ? window.ecBahtText(amount) : ""})
              ตามเงื่อนไขการชำระเงินที่ได้ตกลงกันไว้ ผู้รับจ้างส่งมอบงานจ้างและผู้ว่าจ้าง
              ได้ตรวจรับมอบงานโครงการดังกล่าวได้ถูกต้องตามสัญญาเสร็จเรียบร้อยแล้ว
            </div>

            {/* ยอดเงิน หมายเหตุ และช่องเซ็น เดินทางไปติดขอบล่างด้วยกันทั้งก้อน (.bl-foot = margin-top:auto)
                งวดที่มีรายการไม่กี่ข้อจะได้ไม่มีกล่องยอดลอยอยู่กลางหน้าแล้วลายเซ็นอยู่อีกที่ */}
            <div className="bl-foot" style={{ breakInside: "avoid" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
              <div style={{ minWidth: 262, border: "1px solid " + BP_LINE, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 12px", background: "#F7FAF9" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: BP_INK }}>ยอดงวดนี้{rate > 0 ? " (รวมภาษีมูลค่าเพิ่ม " + rate + "%)" : ""}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: BP_INK, fontFamily: "var(--mono)" }}>{window.sBaht(amount)}</span>
                </div>
                {rate > 0 && (
                  <div style={{ padding: "6px 12px", fontSize: 9.5, color: BP_SOFT, lineHeight: 1.75, borderTop: "1px solid #ECF1EE" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>มูลค่างาน</span><span style={{ fontFamily: "var(--mono)" }}>{window.sBaht(base)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>ภาษีมูลค่าเพิ่ม {rate}%</span><span style={{ fontFamily: "var(--mono)" }}>{window.sBaht(vat)}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: 9, color: BP_SOFT, marginBottom: 20 }}>
              * เอกสารนี้ใช้ประกอบการส่งมอบงานและวางบิล ไม่ใช่ใบกำกับภาษี
            </div>

            <div style={{ display: "flex", gap: 30, paddingTop: 18 }}>
              <BpSign role="ผู้ส่งมอบงาน" who={B.legalTH || B.legal} />
              <BpSign role="ผู้รับมอบงาน" who={j.name || ""} />
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ── แผ่นรูปประกอบ ── */}
      {part !== "letter" && pages.map((pg, pi) => (
        <div key={pi} className={"sv-rep-paper" + (part === "photos" && pi === 0 ? "" : " bl-sheet")}
          style={Object.assign({}, paper, { marginTop: isMobile ? 12 : 16 })}>
          <div className="bl-page">
            <BpHead compact />

            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: BP_INK }}>
                รูปภาพประกอบการวางบิลงวดที่ {r.n || 1} และส่งมอบงาน
              </div>
              <div style={{ fontSize: 10, color: BP_SOFT, marginTop: 2 }}>
                {[j.code, j.name].filter(Boolean).join(" · ")}{pages.length > 1 ? " · แผ่นที่ " + (pi + 1) + "/" + pages.length : ""}
              </div>
            </div>

            {(pg.head || pg.date) && (
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: BP_INK,
                borderTop: "1px solid " + BP_LINE, borderBottom: "1px solid " + BP_LINE, padding: "7px 0", marginBottom: 12 }}>
                {pg.head}{pg.date ? " ณ วันที่ " + bpDate(pg.date) : ""}
                {pg.subN > 1 ? <span style={{ fontWeight: 600, color: BP_SOFT }}> ({pg.sub}/{pg.subN})</span> : null}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {pg.shots.map((p) => (
                <div key={p.id} className="bl-shot" style={{ breakInside: "avoid" }}>
                  <div style={{ border: "1px solid " + BP_LINE, borderRadius: 8, overflow: "hidden", background: "#F3F6F5" }}>
                    <img src={p.dataUrl} alt={p.cap || ""} style={{ display: "block", width: "100%" }} />
                  </div>
                  {p.cap ? <div style={{ fontSize: 10, color: BP_SOFT, marginTop: 4, lineHeight: 1.5 }}>{p.cap}</div> : null}
                </div>
              ))}
            </div>

            {/* ช่องเซ็นบนหน้ารูปเหลือสองฝั่งที่เซ็นจริง — ช่อง "สำเนา" ไม่มีใครเซ็น กินที่เปล่า ๆ */}
            <div className="bl-foot" style={{ display: "flex", gap: 40, paddingTop: 14, breakInside: "avoid", justifyContent: "center" }}>
              <BpSign role="เจ้าของโครงการ" who={j.name || ""} pad={38} date={false} />
              <BpSign role="ผู้รับจ้าง" who={B.legalTH || B.legal} pad={38} date={false} />
            </div>
          </div>
        </div>
      ))}

      {part !== "letter" && !pages.length && (
        <div className="sv-rep-noprint" style={{ maxWidth: 900, margin: "14px auto 0", padding: "14px 16px", borderRadius: 12,
          background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)", fontSize: 12.5, color: "var(--tint-amber-tx)" }}>
          งวดนี้ยังไม่ได้แนบรูปประกอบ — เปิด “ตั้งงวดงาน” แล้วเลือกรูปจากรายงานประจำวันหรืออัปโหลดเพิ่ม
        </div>
      )}

      {!isMobile && <div style={{ height: 24 }} />}
    </div>
  ), document.body);
}

Object.assign(window, { BlDeliveryPaper, useBlPrintBody, BpHead, BpSign });
