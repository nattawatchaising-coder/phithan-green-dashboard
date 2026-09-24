/* ══════════════════════════════════════════════════
   เบิกเงินหน้างาน — เอกสารที่ออกจากระบบ
   ── ใบสำคัญจ่าย A4 (พิมพ์/บันทึก PDF) ลอกโครงจาก DailyPaper (views-daily.jsx:947)
   ── ออกไฟล์ Excel รายการใบเบิก ลอกสไตล์จาก exportShortageXlsx (views-overview.jsx:251)

   ทำไมต้องมีใบสำคัญจ่าย: การโอนเงินคืนพนักงานคือเงินออกจากบริษัทจริง
   บัญชีต้องมีเอกสารตัวจริงที่มีลายเซ็นผู้รับเงินเก็บไว้ประกอบสมุดรายวันจ่าย
   หน้าจอในระบบใช้แทนไม่ได้ ใบนี้จึงพิมพ์ให้เซ็นแล้วเก็บเข้าแฟ้ม

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย ec / Ec / EC_ (สคริปต์ทุกไฟล์ใช้ขอบเขตร่วมกัน)
   ══════════════════════════════════════════════════ */

/* ── จำนวนเงินเป็นตัวอักษร ──
   ใบสำคัญจ่ายต้องมีตัวอักษรกำกับตัวเลขเสมอ เพราะตัวเลขถูกเติมหน้าได้ แต่ตัวอักษรเติมไม่ได้
   คิดเป็นสตางค์ด้วย ไม่ปัดทิ้ง — ยอดที่พิมพ์ต้องตรงกับยอดที่โอนจริงบาทต่อบาท */
const EC_TH_DIGIT = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const EC_TH_POS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function ecNumTH(digits) {
  const s = String(digits || "").replace(/^0+/, "");
  if (!s) return "";
  /* เกินหลักแสนตัดเป็นก้อนละ 6 หลักแล้วต่อด้วย "ล้าน" ตามหลักการอ่านเลขไทย */
  if (s.length > 6) return ecNumTH(s.slice(0, s.length - 6)) + "ล้าน" + ecNumTH(s.slice(-6));
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    const pos = s.length - i - 1;
    if (!d) continue;
    if (pos === 0) out += (d === 1 && s.length > 1) ? "เอ็ด" : EC_TH_DIGIT[d];
    else if (pos === 1) out += d === 1 ? "สิบ" : d === 2 ? "ยี่สิบ" : EC_TH_DIGIT[d] + "สิบ";
    else out += EC_TH_DIGIT[d] + EC_TH_POS[pos];
  }
  return out;
}

function ecBahtText(n) {
  const raw = +n || 0;
  const v = window.ecRound(Math.abs(raw));
  const baht = Math.floor(v);
  const satang = Math.round((v - baht) * 100);
  let out = baht ? ecNumTH(String(baht)) + "บาท" : (satang ? "" : "ศูนย์บาท");
  out += satang ? ecNumTH(String(satang)) + "สตางค์" : (baht || !satang ? "ถ้วน" : "");
  return (raw < 0 ? "ลบ" : "") + out;
}

/* ── พจนานุกรมใบสำคัญจ่าย (ไทย → [อังกฤษ, จีน]) ──
   ใบนี้เป็นคอมโพเนนต์ React จึงแปลทีละข้อความด้วย window.pgT (ดู i18n.jsx)
   จำนวนเงินเป็นตัวอักษรยังเป็นภาษาไทยเสมอ เพราะเป็นถ้อยคำตามแบบเอกสารการเงินไทย
   ป้ายกำกับบรรทัดนั้นจึงบอกไว้ว่าเป็นภาษาไทย · ชื่อคน ชื่องาน และหมายเหตุเป็นข้อมูล ไม่แปล */
const EC_PAPER_I18N = {
  "ใบสำคัญจ่าย": ["Payment Voucher", "付款凭证"],
  "จ่ายคืนแล้ว": ["Reimbursed", "已报销"],
  "จ่ายให้": ["Pay to", "收款人"],
  "วันที่จ่าย": ["Payment date", "付款日期"],
  "จำนวนใบเบิก": ["Claims in batch", "报销单数"],
  "เลขสลิป / อ้างอิง": ["Slip / reference no.", "凭证 / 参考编号"],
  "ผู้ทำรายการ": ["Prepared by", "经办人"],
  "บันทึกเมื่อ": ["Recorded", "记录时间"],
  "จำนวนเงินที่จ่าย": ["Amount paid", "付款金额"],
  "ตัวอักษร": ["In words (Thai)", "金额大写（泰文）"],
  "เลขที่ใบ": ["Claim no.", "单号"],
  "วันที่ใช้จ่าย": ["Spent on", "支出日期"],
  "หมวด": ["Category", "类别"],
  "งาน / ไซต์": ["Job / site", "项目 / 站点"],
  "ผู้อนุมัติ": ["Approved by", "批准人"],
  "จำนวนเงิน": ["Amount", "金额"],
  "ใบเบิกที่ปิดในรอบนี้": ["Claims settled in this batch", "本批次已结报销单"],
  "รวมทั้งสิ้น": ["Grand total", "合计"],
  "หมายเหตุ": ["Note", "备注"],
  "ผู้รับเงิน": ["Received by", "收款人签字"],
  "ผู้จ่ายเงิน": ["Paid by", "付款人签字"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "เอกสารนี้ออกจากระบบติดตามงานติดตั้ง": ["Issued by the installation tracking system of", "本文件由安装管理系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  "บาท": ["THB", "泰铢"],
  "ใบ": ["claims", "张"],
  "ใบเบิกเงินหน้างาน": ["Expense Claim", "现场费用报销单"],
  "ผู้ขอเบิก": ["Claimed by", "申请人"],
  "สถานะ": ["Status", "状态"],
  "ที่มาของเงิน": ["Funded by", "资金来源"],
  "ยอดที่ขอเบิก": ["Amount claimed", "申请金额"],
  "รายการที่จ่าย": ["Items", "支出明细"],
  "รายการ": ["Item", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "ราคา/หน่วย": ["Unit price", "单价"],
  "รวม": ["Amount", "小计"],
  "บิล / ใบเสร็จ": ["Receipts", "票据"],
  "ยังไม่ได้แนบบิล": ["No receipt attached", "未附票据"],
  "ไฟล์ PDF แนบไว้ในระบบ": ["PDF attached in the system", "系统内附有 PDF 文件"],
  "ผู้จ่ายคืน": ["Reimbursed by", "付款人"],
  "แนบบิลไว้": ["Receipts attached", "已附票据"],
  "ใบ · อยู่แผ่นถัดไป": ["on the following sheets", "张，见后页"],
  "แผ่น": ["sheet", "页"],
  /* สถานะใบ + ที่มาของเงิน จาก expense.jsx */
  "ร่าง": ["Draft", "草稿"],
  "รออนุมัติ": ["Pending approval", "待审批"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "ไม่อนุมัติ": ["Rejected", "未批准"],
  "ออกเงินตัวเองไปก่อน": ["Paid by employee", "员工垫付"],
  "เงินสดกองกลาง": ["Petty cash", "备用金"],
  "บัตร / บัญชีบริษัท": ["Company card / account", "公司卡 / 账户"],
  /* หมวดค่าใช้จ่ายจาก expense.jsx */
  "ซื้อของหน้างาน": ["Site purchase", "现场采购"],
  "ค่าขนส่งของ": ["Freight", "货运费"],
  "ค่าน้ำมัน / เดินทาง": ["Fuel / travel", "油费与差旅"],
  "ค่าอาหาร / ที่พัก": ["Meals / lodging", "餐费与住宿"],
  "ค่าแรงจ้างช่วง": ["Subcontract labour", "外包人工"],
  "อื่น ๆ": ["Other", "其他"],
};

/* ── ลายเซ็นประจำตัวของผู้ใช้ ──
   เก็บที่ userSigns/{id} (daily.jsx:403) แยกจาก users/ เพราะรายชื่อผู้ใช้โหลดทั้งก้อนตอนล็อกอิน
   อ่านครั้งเดียวตอนเปิดใบ ไม่ต้อง subscribe — ใบสำคัญจ่ายคือภาพนิ่งของรอบที่ปิดไปแล้ว */
function useEcPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}

function useEcSigns(ids) {
  const key = (ids || []).filter(Boolean).join(",");
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    const list = key ? key.split(",") : [];
    if (!list.length || !_ECFB()) { setMap({}); return; }
    let alive = true;
    Promise.all(list.map((id) => _ecRef("userSigns/" + id).once("value")
      .then((s) => [id, (s.val() || {}).img || ""]).catch(() => [id, ""])))
      .then((pairs) => {
        if (!alive) return;
        const o = {};
        pairs.forEach((p) => { if (p[1]) o[p[0]] = p[1]; });
        setMap(o);
      });
    return () => { alive = false; };
  }, [key]);
  return map;
}

/* ══════════════════════════════════════════════════
   ใบสำคัญจ่าย A4 — หนึ่งรอบจ่าย = หนึ่งใบ
   ══════════════════════════════════════════════════ */
function EcVoucherPaper({ batch, claims, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  /* ภาษาของใบ — สลับสดจากแถบด้านบน ซึ่งไม่ติดไปในหน้าพิมพ์อยู่แล้ว
     วันที่ไทยเป็น พ.ศ. อังกฤษ/จีนเป็น ค.ศ. จึงแยกฟังก์ชันไว้ ห้ามแปลผ่าน T() */
  const [lang, setLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));
  const pickLang = (id) => { setLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = React.useMemo(() => (window.pgT ? window.pgT(EC_PAPER_I18N, lang) : (k) => k), [lang]);
  const DT = (iso) => (!iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang));
  const DTs = (iso) => (!iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang));
  const b = batch || {};
  const list = claims || [];
  /* ยอดบนใบยึดยอดที่บันทึกไว้ในรอบเสมอ ไม่คิดใหม่จากใบที่หาเจอ
     ถ้าใบใดถูกลบทีหลัง ยอดบนกระดาษที่เซ็นไปแล้วต้องไม่เปลี่ยนตาม */
  const total = window.ecRound(b.total);
  const found = window.ecRound(list.reduce((a, c) => a + window.ecRound(c.amount), 0));
  const missing = list.length !== (b.count || 0);

  /* คนอนุมัติของรอบนี้ — ปกติใบทั้งก้อนผ่านคนเดียว แต่ถ้าหลายคนต้องขึ้นให้ครบ
     ไม่งั้นกระดาษจะอ้างว่าคนเดียวอนุมัติทั้งรอบ · วันที่ยึดครั้งล่าสุดที่กดอนุมัติ */
  const apprs = [];
  list.forEach((c) => {
    if (!c || !c.decidedByName) return;
    const k = c.decidedById || c.decidedByName;
    const hit = apprs.filter((a) => a.k === k)[0];
    if (hit) { if ((c.decidedAt || "") > hit.at) hit.at = c.decidedAt || ""; return; }
    apprs.push({ k: k, id: c.decidedById || "", name: c.decidedByName, at: c.decidedAt || "" });
  });
  /* เซ็นให้อัตโนมัติได้เฉพาะตอนคนอนุมัติคนเดียว — หลายคนต้องเซ็นสดทุกคน */
  const signs = useEcSigns([b.byId].concat(apprs.length === 1 ? [apprs[0].id] : []));
  useEcPrintBody();

  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบสำคัญจ่าย") + " " + (b.no || "") + " " + (b.toName || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const th = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "5px 7px", fontSize: 10.5, color: "#15211A", borderBottom: "1px solid #ECF1EE", verticalAlign: "top" };
  const num = Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)" });

  return ReactDOM.createPortal((
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
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ใบสำคัญจ่าย · {b.no || "-"}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {b.toName || "-"} · {window.ecBaht(total)} บาท · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”
          </div>
        </div>
        {typeof window.LangPick === "function" && (
          <window.LangPick value={lang} onChange={pickLang} />
        )}
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* ฟอนต์ไทยของแอปไม่มีตัวอักษรจีน — เลือกจีนแล้วต้องระบุชุดฟอนต์ที่มีจีนให้ชัด */}
      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        {/* หัวกระดาษ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #1B9B75", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>{T("ใบสำคัญจ่าย")}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>PAYMENT VOUCHER — FIELD EXPENSE REIMBURSEMENT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandMark size={22} variant="light" />
              <window.BrandWord size={16} color="#0F2B33" />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#15211A" }}>{b.no || "-"}</div>
            <div>{DT(b.date)}</div>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 9px", borderRadius: 99,
              background: "#10B98122", color: "#10B981", fontWeight: 700, fontSize: 10.5 }}>{T("จ่ายคืนแล้ว")}</div>
          </div>
        </div>

        {/* ผู้รับเงิน + ข้อมูลการจ่าย */}
        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <EcVPRow k={T("จ่ายให้")} v={b.toName || "-"} />
          <EcVPRow k={T("วันที่จ่าย")} v={DTs(b.date)} />
          <EcVPRow k={T("จำนวนใบเบิก")} v={(b.count || 0) + " " + T("ใบ")} />
          <EcVPRow k={T("เลขสลิป / อ้างอิง")} v={b.ref || "—"} />
          <EcVPRow k={T("ผู้ทำรายการ")} v={b.byName || "-"} />
          <EcVPRow k={T("บันทึกเมื่อ")} v={b.at ? DTs(window.drLocalDay(b.at)) : "—"} />
        </div>

        {/* ยอดเงิน — ตัวเลขคู่ตัวอักษร */}
        <div style={{ marginTop: 14, border: "1px solid #1B9B75", borderRadius: 9, overflow: "hidden", breakInside: "avoid" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "11px 14px", background: "#F3F9F6" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4A5A51" }}>{T("จำนวนเงินที่จ่าย")}</span>
            <span style={{ flex: 1, minWidth: 120 }} />
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", color: "#0A4D68" }}>{window.ecBaht(total)}</span>
            <span style={{ fontSize: 12, color: "#4A5A51" }}>{T("บาท")}</span>
          </div>
          <div style={{ padding: "8px 14px", fontSize: 12, color: "#15211A", borderTop: "1px solid #DCE4DF" }}>
            {T("ตัวอักษร")} <b>({ecBahtText(total)})</b>
          </div>
        </div>

        {/* รายการใบเบิกในรอบนี้ */}
        <EcPBlock title={T("ใบเบิกที่ปิดในรอบนี้") + " (" + list.length + " " + T("ใบ") + ")"}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={Object.assign({}, th, { width: 26 })}>#</th>
                <th style={th}>{T("เลขที่ใบ")}</th>
                <th style={th}>{T("วันที่ใช้จ่าย")}</th>
                <th style={th}>{T("หมวด")}</th>
                <th style={th}>{T("งาน / ไซต์")}</th>
                <th style={th}>{T("ผู้อนุมัติ")}</th>
                <th style={Object.assign({}, th, { textAlign: "right", width: 88 })}>{T("จำนวนเงิน")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c.id}>
                  <td style={Object.assign({}, td, { fontFamily: "var(--mono)", color: "#7A8A81" })}>{i + 1}</td>
                  <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{c.no || "-"}</td>
                  <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontSize: 10 })}>{c.date ? (window.pgShort ? window.pgShort(c.date, lang) : window.drShort(c.date)) : "—"}</td>
                  <td style={td}>{T(window.ecKindOf(c.kind).th)}</td>
                  <td style={td}>{[c.siteCode, c.siteName].filter(Boolean).join(" · ") || "—"}</td>
                  <td style={td}>{c.decidedByName || c.approverName || "—"}</td>
                  <td style={num}>{window.ecBaht(c.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={Object.assign({}, td, { borderBottom: "none" })} colSpan={6}>
                  <b style={{ fontSize: 11.5 }}>{T("รวมทั้งสิ้น")}</b>
                </td>
                <td style={Object.assign({}, num, { borderBottom: "none", fontSize: 13, fontWeight: 800 })}>{window.ecBaht(total)}</td>
              </tr>
            </tbody>
          </table>
          {/* ใบที่อยู่ในรอบแต่หาไม่เจอแล้ว (ถูกลบทีหลัง) ต้องบอกไว้บนกระดาษ ไม่ใช่เงียบ ๆ
             เพราะยอดรวมข้างบนจะไม่เท่ากับผลบวกของแถวที่พิมพ์ออกมา */}
          {missing && (
            <div style={{ marginTop: 8, fontSize: 10.5, color: "#B45309" }}>
              หมายเหตุ: รอบนี้บันทึกไว้ {b.count || 0} ใบ แต่แสดงได้ {list.length} ใบ (ผลบวกที่แสดง {window.ecBaht(found)} บาท)
              — ใบที่เหลือถูกลบออกจากฐานข้อมูลภายหลัง ยอดที่จ่ายจริงยึดตามยอดรวมด้านบน
            </div>
          )}
        </EcPBlock>

        {b.note ? (
          <EcPBlock title={T("หมายเหตุ")} avoid>
            <div style={{ fontSize: 11.5, lineHeight: 1.65, color: "#15211A", whiteSpace: "pre-wrap" }}>{b.note}</div>
          </EcPBlock>
        ) : null}

        {/* ช่องเซ็น
            ผู้รับเงิน — เว้นเส้นให้เซ็นด้วยปากกาเสมอ ใบนี้คือหลักฐานว่าเงินถึงมือคนรับจริง
              ระบบเซ็นแทนไม่ได้ เพราะตอนพิมพ์ใบ เงินยังไม่ถึงมือเขา
            ผู้จ่ายเงิน / ผู้อนุมัติ — ระบบรู้อยู่แล้วว่าใครกดและกดวันไหน จึงเติมชื่อ วันที่
              และลายเซ็นที่เจ้าตัวบันทึกไว้ในโปรไฟล์ให้เลย ไม่ต้องไล่เก็บลายเซ็นย้อนหลัง
              ใครยังไม่ได้บันทึกลายเซ็นก็เหลือเส้นว่างให้เซ็นเองตามเดิม */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, breakInside: "avoid" }}>
          {[{ t: T("ผู้รับเงิน"), n: b.toName },
            { t: T("ผู้จ่ายเงิน"), n: b.byName, img: signs[b.byId], at: b.at || b.date },
            { t: T("ผู้อนุมัติ"), n: apprs.map((a) => a.name).join(" · "),
              img: apprs.length === 1 ? signs[apprs[0].id] : "",
              at: apprs.length === 1 ? apprs[0].at : "" }].map((s, i) => (
            <div key={i} style={{ border: "1px solid #DCE4DF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{s.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6, display: "grid", placeItems: "center", overflow: "hidden" }}>
                {s.img ? <img src={s.img} alt="" style={{ maxWidth: "100%", maxHeight: 40, objectFit: "contain" }} /> : null}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>{T("ชื่อ:")} <b>{s.n || "…………………………"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>{T("วันที่:")} {s.at ? DTs(s.at) : "…………………………"}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          {T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง")} flash+solar · {b.no || "-"} · {T("พิมพ์เมื่อ")} {DTs(window.drToday())}
        </div>
      </div>
    </div>
  ), document.body);
}

/* ══════════════════════════════════════════════════
   ใบเบิกเงินหน้างาน A4 — หนึ่งใบเบิก = หนึ่งแผ่น
   ── ใบสำคัญจ่าย (EcVoucherPaper) คือหลักฐานของ "รอบจ่าย" ทั้งก้อน
      แต่บัญชีต้องเก็บตัวใบเบิกคู่กับบิลเป็นรายใบด้วย และคนอนุมัติที่อยากได้กระดาษ
      ก็ต้องการใบเดียวจบ ไม่ใช่รอให้ปิดรอบจ่ายก่อน
   ── บิลที่แนบไว้พิมพ์ติดไปในแผ่นเดียวกัน ใบเบิกที่ไม่มีบิลแนบคือใบที่บัญชีตีกลับ
   ══════════════════════════════════════════════════ */
function EcClaimPaper({ claim, job, user, onPrinted, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [lang, setLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));
  const pickLang = (id) => { setLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = React.useMemo(() => (window.pgT ? window.pgT(EC_PAPER_I18N, lang) : (k) => k), [lang]);
  const DTs = (iso) => (!iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang));
  const day = (iso) => (iso ? (window.drLocalDay ? window.drLocalDay(iso) : String(iso).slice(0, 10)) : "");

  const c = claim || {};
  const kind = window.ecKindOf(c.kind);
  const pay = window.ecPayOf(c.payMethod);
  const st = window.ecStatusOf(c.status);
  const items = (c.items || []).filter((r) => r && (r.name || r.amount || r.price));
  const total = window.ecSum(c.items);
  /* บิลอ่านจากโหนดแยก (ecReceipts) เหมือนที่หน้าจอใช้ — PDF พิมพ์ทับไม่ได้ บอกไว้เป็นข้อความแทน */
  const rc = window.useEcReceipts(c.id);
  const shots = (rc && rc.shots) || [];
  const imgs = shots.filter((s) => window.ecReceiptKind(s) === "img");
  const pdfs = shots.filter((s) => window.ecReceiptKind(s) === "pdf");
  const signs = useEcSigns([c.byId, c.decidedById, c.paidById]);
  useEcPrintBody();

  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบเบิกเงินหน้างาน") + " " + (c.no || "") + " " + (c.byName || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  /* ── พิมพ์แล้วหรือยัง ──
     เบราว์เซอร์ไม่บอกว่าคนกดพิมพ์จริงหรือกดยกเลิกในกล่องพิมพ์ ระบบจึงเดาแทนไม่ได้
     ต้องให้คนที่พิมพ์เป็นคนกดยืนยันเอง — บัญชีจะได้รู้ว่าใบไหนมีตัวจริงรออยู่ในแฟ้มแล้ว */
  const markPrinted = () => {
    if (!onPrinted) return;
    onPrinted({
      printedAt: new Date().toISOString(),
      printedById: (user || {}).id || null,
      printedByName: (user || {}).name || "",
    });
  };

  const th = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "5px 7px", fontSize: 10.5, color: "#15211A", borderBottom: "1px solid #ECF1EE", verticalAlign: "top" };
  const num = Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)" });

  /* ช่องเซ็น — คนที่ระบบรู้ว่ากดเมื่อไหร่ เติมชื่อ วันที่ และลายเซ็นที่บันทึกไว้ให้เลย
     (กฎเดียวกับใบสำคัญจ่าย) ขั้นที่ยังไม่ถึงก็เหลือช่องว่างไว้ตามเดิม */
  const boxes = [
    { t: T("ผู้ขอเบิก"), n: c.byName, img: signs[c.byId], at: day(c.sentAt) || c.date },
    { t: T("ผู้อนุมัติ"), n: c.decidedByName, img: signs[c.decidedById], at: day(c.decidedAt) },
    { t: T("ผู้จ่ายคืน"), n: c.paidByName, img: signs[c.paidById], at: day(c.paidAt) },
  ];

  return ReactDOM.createPortal((
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
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ใบเบิกเงินหน้างาน · {c.no || "-"}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {c.byName || "-"} · {window.ecBaht(total)} บาท · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”
          </div>
        </div>
        {typeof window.LangPick === "function" && (
          <window.LangPick value={lang} onChange={pickLang} />
        )}
        {/* พิมพ์แล้วหรือยัง — กดเองหลังพิมพ์จริง ไม่ใช่ตอนกดเปิดกล่องพิมพ์ */}
        {c.printedAt ? (
          <span title={(c.printedByName ? "โดย " + c.printedByName + " · " : "") + window.drDateTH(day(c.printedAt))}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, flexShrink: 0,
              background: "var(--tint-ok-bg)", color: "var(--tint-ok-tx)", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
            <Icon name="check" size={14} color="var(--tint-ok-tx)" /> พิมพ์แล้ว
          </span>
        ) : onPrinted ? (
          <button onClick={markPrinted}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 14px", borderRadius: 11, flexShrink: 0,
              border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="check" size={15} color="var(--text-2)" /> บันทึกว่าพิมพ์แล้ว
          </button>
        ) : null}
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #1B9B75", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>{T("ใบเบิกเงินหน้างาน")}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>EXPENSE CLAIM — FIELD REIMBURSEMENT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandMark size={22} variant="light" />
              <window.BrandWord size={16} color="#0F2B33" />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#15211A" }}>{c.no || "-"}</div>
            <div>{DTs(c.date)}</div>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 9px", borderRadius: 99,
              background: st.color + "22", color: st.color, fontWeight: 700, fontSize: 10.5 }}>{T(st.th)}</div>
          </div>
        </div>

        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <EcVPRow k={T("ผู้ขอเบิก")} v={c.byName || "-"} />
          <EcVPRow k={T("วันที่ใช้จ่าย")} v={DTs(c.date)} />
          <EcVPRow k={T("หมวด")} v={T(kind.th)} />
          <EcVPRow k={T("ที่มาของเงิน")} v={T(pay.th)} />
          <EcVPRow k={T("งาน / ไซต์")}
            v={c.jobId ? [c.siteCode, c.siteName].filter(Boolean).join(" · ") : "—"} />
          <EcVPRow k={T("ผู้อนุมัติ")} v={c.decidedByName || (c.approverName || "—")} />
        </div>

        <div style={{ marginTop: 14, border: "1px solid #1B9B75", borderRadius: 9, overflow: "hidden", breakInside: "avoid" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "11px 14px", background: "#F3F9F6" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4A5A51" }}>{T("ยอดที่ขอเบิก")}</span>
            <span style={{ flex: 1, minWidth: 120 }} />
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", color: "#0A4D68" }}>{window.ecBaht(total)}</span>
            <span style={{ fontSize: 12, color: "#4A5A51" }}>{T("บาท")}</span>
          </div>
          <div style={{ padding: "8px 14px", fontSize: 12, color: "#15211A", borderTop: "1px solid #DCE4DF" }}>
            {T("ตัวอักษร")} <b>({ecBahtText(total)})</b>
          </div>
        </div>

        <EcPBlock title={T("รายการที่จ่าย")}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={Object.assign({}, th, { width: 26 })}>#</th>
                <th style={th}>{T("รายการ")}</th>
                <th style={Object.assign({}, th, { textAlign: "right", width: 58 })}>{T("จำนวน")}</th>
                <th style={Object.assign({}, th, { width: 58 })}>{T("หน่วย")}</th>
                <th style={Object.assign({}, th, { textAlign: "right", width: 80 })}>{T("ราคา/หน่วย")}</th>
                <th style={Object.assign({}, th, { textAlign: "right", width: 88 })}>{T("รวม")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <td style={Object.assign({}, td, { fontFamily: "var(--mono)", color: "#7A8A81" })}>{i + 1}</td>
                  <td style={td}>{r.name || "—"}</td>
                  <td style={num}>{r.qty || ""}</td>
                  <td style={td}>{r.unit || ""}</td>
                  <td style={num}>{r.price === "" || r.price == null ? "" : window.ecBaht(r.price)}</td>
                  <td style={num}>{window.ecBaht(window.ecSum([r]))}</td>
                </tr>
              ))}
              <tr>
                <td style={Object.assign({}, td, { borderBottom: "none" })} colSpan={5}>
                  <b style={{ fontSize: 11.5 }}>{T("รวมทั้งสิ้น")}</b>
                </td>
                <td style={Object.assign({}, num, { borderBottom: "none", fontSize: 13, fontWeight: 800 })}>{window.ecBaht(total)}</td>
              </tr>
            </tbody>
          </table>
        </EcPBlock>

        {c.note ? (
          <EcPBlock title={T("หมายเหตุ")} avoid>
            <div style={{ fontSize: 11.5, lineHeight: 1.65, color: "#15211A", whiteSpace: "pre-wrap" }}>{c.note}</div>
          </EcPBlock>
        ) : null}

        {/* บิล — ตัวใบบอกแค่ว่าแนบมากี่ใบ รูปจริงไปอยู่แผ่นของตัวเองข้างล่าง
            ย่อรูปลงมาแปะในหน้าเดียวกับตาราง ตัวเลขในบิลจะอ่านไม่ออก ซึ่งทำให้บิลไม่มีประโยชน์ */}
        <EcPBlock title={T("บิล / ใบเสร็จ")} avoid>
          {imgs.length === 0 && pdfs.length === 0 ? (
            <div style={{ fontSize: 11, color: "#B45309" }}>— {T("ยังไม่ได้แนบบิล")} —</div>
          ) : (
            <div style={{ fontSize: 11, color: "#5A6B62", lineHeight: 1.7 }}>
              {imgs.length > 0 && (
                <div>{T("แนบบิลไว้")} <b>{imgs.length}</b> {T("ใบ · อยู่แผ่นถัดไป")}</div>
              )}
              {pdfs.length > 0 && (
                <div>
                  {pdfs.length} {T("ไฟล์ PDF แนบไว้ในระบบ")}{pdfs.map((p) => p.name).filter(Boolean).length
                    ? " · " + pdfs.map((p) => p.name).filter(Boolean).join(" · ") : ""}
                </div>
              )}
            </div>
          )}
        </EcPBlock>

        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, breakInside: "avoid" }}>
          {boxes.map((s, i) => (
            <div key={i} style={{ border: "1px solid #DCE4DF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{s.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6, display: "grid", placeItems: "center", overflow: "hidden" }}>
                {s.img ? <img src={s.img} alt="" style={{ maxWidth: "100%", maxHeight: 40, objectFit: "contain" }} /> : null}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>{T("ชื่อ:")} <b>{s.n || "…………………………"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>{T("วันที่:")} {s.at ? DTs(s.at) : "…………………………"}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          {T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง")} flash+solar · {c.no || "-"} · {T("พิมพ์เมื่อ")} {DTs(window.drToday())}
        </div>

        {/* ── บิลแผ่นละใบ เต็มหน้ากระดาษ ──
            ใบเสร็จคือหลักฐานของยอดเงิน ถ้าอ่านตัวเลขไม่ออกก็ไม่ต่างจากไม่ได้แนบ
            ec-sheet ขึ้นหน้าใหม่ตอนพิมพ์ (index.html) และคั่นด้วยเส้นประตอนดูบนจอ */}
        {imgs.map((s, i) => (
          <div key={s.id} className="ec-sheet"
            style={{ marginTop: 20, paddingTop: 18, borderTop: "1px dashed #C9D5CE" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12,
              borderBottom: "1px solid #DCE4DF", paddingBottom: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{T("บิล / ใบเสร็จ")}</span>
              <span style={{ fontSize: 10.5, color: "#5A6B62", fontFamily: "var(--mono)" }}>
                {c.no || "-"} · {T("แผ่น")} {i + 1}/{imgs.length}
              </span>
            </div>
            <img src={s.dataUrl} alt="" style={{ width: "100%", maxHeight: "232mm", objectFit: "contain", display: "block" }} />
          </div>
        ))}
      </div>
    </div>
  ), document.body);
}

/* แถวข้อมูลหัวกระดาษ — DrPRow ของรายงานประจำวันไม่ได้ export ออกมา จึงทำคู่เล็ก ๆ ไว้ใช้เอง */
function EcVPRow({ k, v }) {
  return (
    <React.Fragment>
      <div style={{ padding: "6px 10px", fontSize: 10.5, fontWeight: 700, color: "#5A6B62",
        background: "#F7FAF8", borderBottom: "1px solid #ECF1EE", whiteSpace: "nowrap" }}>{k}</div>
      <div style={{ padding: "6px 10px", fontSize: 11.5, color: "#15211A", borderBottom: "1px solid #ECF1EE" }}>{v || "—"}</div>
    </React.Fragment>
  );
}

function EcPBlock({ title, children, avoid }) {
  return (
    <div style={{ marginTop: 16, breakInside: avoid ? "avoid" : "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #DCE4DF", paddingBottom: 5, marginBottom: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: 99, background: "#1B9B75" }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: "#15211A" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ออกไฟล์ Excel — รายการใบเบิกตามที่เห็นบนหน้าจอ
   จัดกลุ่มตามผู้เบิก เพราะคำถามที่ถามบ่อยที่สุดคือ "ติดเงินคนนี้อยู่เท่าไหร่"
   สไตล์ตารางลอกจาก exportShortageXlsx ให้ไฟล์ที่ออกจากระบบหน้าตาเป็นชุดเดียวกัน
   ══════════════════════════════════════════════════ */
function ecExportXlsx(claims, opts) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  const rows = (claims || []).slice();
  if (!rows.length) { alert("ไม่มีใบเบิกให้ออกไฟล์"); return; }
  const o = opts || {};
  const X = window.XLSX;
  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", group: "D6EBDF", alt: "F4FAF6",
    white: "FFFFFF", border: "CBD8D0", text: "16241D", sub: "5A6B62", owedTx: "B42318", owedBg: "FDECEA",
    sumBg: "D6EBDF" };
  const FONT = "Tahoma";
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const cols = ["ลำดับ", "เลขที่ใบ", "วันที่ใช้จ่าย", "หมวด", "ที่มาของเงิน", "รหัสงาน", "ชื่องาน / ไซต์",
    "หมายเหตุ", "สถานะ", "ผู้อนุมัติ", "วันที่จ่ายคืน", "รอบจ่าย / สลิป", "จำนวนเงิน"];
  const lastC = cols.length - 1;
  const AMT = lastC;
  const colW = [{ wch: 7 }, { wch: 16 }, { wch: 11 }, { wch: 16 }, { wch: 18 }, { wch: 11 }, { wch: 26 },
    { wch: 28 }, { wch: 12 }, { wch: 16 }, { wch: 11 }, { wch: 18 }, { wch: 13 }];
  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const fullMerge = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });
  const pad = (first, rest) => { const a = [first]; for (let i = 1; i <= lastC; i++) a.push(i === 1 ? rest : ""); return a; };

  pushRow(["รายการใบเบิกเงินหน้างาน"], "title", 30); fullMerge(R - 1);
  pushRow(["flash+solar · ระบบติดตามงานติดตั้งโซลาร์เซลล์"], "subtitle", 20); fullMerge(R - 1);
  pushRow([], "spacer", 6);
  [["ขอบเขตข้อมูล", o.scope || "ทั้งหมด"],
   ["จำนวนใบ", rows.length + " ใบ"],
   ["ผู้ออกเอกสาร", o.byName || "-"],
   ["วันที่ออกเอกสาร", window.drDateTH(window.drToday())]].forEach((row) => {
    pushRow(pad(row[0], row[1]), "info", 19);
    merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
  });
  pushRow([], "spacer", 8);
  pushRow(cols, "head", 24);

  /* จัดกลุ่มตามผู้เบิก · ในกลุ่มเรียงวันที่ใหม่ก่อน */
  const byPerson = {};
  rows.forEach((c) => {
    const k = (c.byName || "ไม่ระบุชื่อ") + "|" + (c.byId || "");
    (byPerson[k] || (byPerson[k] = [])).push(c);
  });
  const keys = Object.keys(byPerson).sort((a, b) => a.localeCompare(b, "th"));
  let n = 0, grand = 0, grandOwed = 0;
  keys.forEach((k) => {
    n += 1;
    const items = byPerson[k].slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const name = k.split("|")[0];
    const sub = window.ecRound(items.reduce((a, c) => a + window.ecRound(c.amount), 0));
    /* ค้างจ่าย = อนุมัติแล้วแต่ยังไม่จ่าย และเป็นเงินที่คนออกไปเอง (ดูนิยามที่ EC_PAY ใน expense.jsx) */
    const owed = window.ecRound(items.filter((c) => c.status === "approved" && window.ecPayOf(c.payMethod).owed)
      .reduce((a, c) => a + window.ecRound(c.amount), 0));
    grand += sub; grandOwed += owed;

    const grow = ["ลำดับที่ " + n, ""];
    for (let i = 2; i <= lastC; i++) grow.push(i === 2 ? name + "   (" + items.length + " ใบ)" : "");
    pushRow(grow, "group", 20);
    merges.push({ s: { r: R - 1, c: 2 }, e: { r: R - 1, c: lastC } });

    items.forEach((c, i) => {
      pushRow([
        n + "." + (i + 1),
        c.no || "",
        c.date ? window.drDateTH(c.date) : "",
        window.ecKindOf(c.kind).th,
        window.ecPayOf(c.payMethod).th,
        c.siteCode || "",
        c.siteName || "",
        c.note || "",
        window.ecStatusOf(c.status).th,
        c.decidedByName || c.approverName || "",
        c.paidAt ? window.drDateTH(window.drLocalDay(c.paidAt)) : "",
        [c.batchNo, c.paidRef].filter(Boolean).join(" · "),
        window.ecRound(c.amount),
      ], i % 2 === 0 ? "item" : "itemAlt");
    });

    const srow = [];
    for (let i = 0; i <= lastC; i++) {
      srow.push(i === 0 ? "รวม " + name : i === AMT ? sub
        : i === 1 ? (owed ? "ค้างจ่ายคนนี้ " + window.ecBaht(owed) + " บาท" : "") : "");
    }
    pushRow(srow, "sum", 20);
    merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: AMT - 1 } });
  });

  const trow = [];
  for (let i = 0; i <= lastC; i++) {
    trow.push(i === 0 ? "รวมทั้งสิ้น" : i === AMT ? window.ecRound(grand)
      : i === 1 ? ("ค้างจ่ายพนักงานรวม " + window.ecBaht(grandOwed) + " บาท") : "");
  }
  pushRow(trow, "total", 24);
  merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: AMT - 1 } });
  pushRow([], "spacer", 8);
  pushRow(["ยอดในไฟล์นี้เป็นเงินสดที่จ่ายหน้างานเท่านั้น ไม่รวมวัสดุที่เบิกจากคลังและค่าแรงผู้รับเหมา"], "foot", 18);
  fullMerge(R - 1);

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges; ws["!cols"] = colW; ws["!rows"] = rowsH;
  const money = '#,##0.00';
  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "info") { if (c === 0) { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; s.alignment = { horizontal: "right", vertical: "center" }; } else { s.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "center" }; } s.border = { bottom: thin }; }
    else if (t === "head") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: c === 6 || c === 7 ? "left" : "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (t === "group") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.group } }; s.alignment = { horizontal: c < 2 ? "center" : "left", vertical: "center" }; s.border = boxAll; }
    else if (t === "sum" || t === "total") {
      s.font = { name: FONT, sz: t === "total" ? 12 : 11, bold: true, color: { rgb: t === "total" ? C.white : C.brandDk } };
      s.fill = { patternType: "solid", fgColor: { rgb: t === "total" ? C.brandDk : C.sumBg } };
      s.border = boxAll;
      if (c === AMT) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = money; }
      else if (c === 1) s.alignment = { horizontal: "left", vertical: "center" };
      else s.alignment = { horizontal: c === 0 ? "left" : "center", vertical: "center" };
    }
    else if (t === "foot") { s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; s.alignment = { horizontal: "left", vertical: "center" }; }
    else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      if (c === AMT) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = money; s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.text } }; }
      else if (c === 6 || c === 7) s.alignment = { horizontal: "left", vertical: "center", wrapText: true };
      else if (c === 1) { s.alignment = { horizontal: "center", vertical: "center" }; s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
      else s.alignment = { horizontal: "center", vertical: "center" };
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const s = styleCell(r, c);
      if (!s) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = s;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "ใบเบิกเงิน");
  X.writeFile(wb, "ใบเบิกเงินหน้างาน_" + window.drToday() + ".xlsx");
}

Object.assign(window, { ecNumTH, ecBahtText, EcVoucherPaper, EcClaimPaper, ecExportXlsx });
