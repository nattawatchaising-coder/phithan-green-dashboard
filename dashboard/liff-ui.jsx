/* ============================================================
   flash+solar — ชิ้นส่วนหน้าตาที่ทุกหน้าในแอป LINE ใช้ร่วมกัน · คำนำหน้า ln / Ln / LN_

   ไฟล์นี้มีอยู่เพราะเหตุผลเดียว: ก่อนหน้านี้ liff-app · liff-ec · liff-daily
   ต่างคนต่างประกาศทรงช่องกรอกของตัวเอง (LN_FIELD · LN_EC_FIELD · LN_DR_FIELD)
   ซึ่งตอนเขียนมันเหมือนกันเป๊ะ แต่พอเปลี่ยนโทนทีก็แก้ไม่ครบทุกที
   ผลคือหน้าลงเวลาสวยแล้ว แต่หน้าขอ OT / เบิกเงิน / รายงาน ยังเป็นของเก่าอยู่
   ⚠ ทรงกลางของแอปไลน์อยู่ที่นี่ที่เดียว — อย่าประกาศทรงเดิมซ้ำในไฟล์อื่นอีก

   ⚠ โหลดเป็นไฟล์แรกของชุด LIFF (ก่อน liff-ec) เพราะสคริปต์ชุดนี้ใช้ขอบเขตร่วมกัน
     ของที่ประกาศที่นี่จึงมองเห็นได้จากทุกไฟล์ที่โหลดทีหลังโดยไม่ต้องผ่าน window
   ============================================================ */

/* ── การ์ด ──
   ของทุกชิ้นเป็นการ์ดลอยบนพื้นนวล ไม่ใช่แถวในตารางที่คั่นด้วยเส้น */
const LN_CARD = {
  background: "var(--surface)", border: "1px solid var(--border)",
  boxShadow: "var(--soft)", borderRadius: 20,
};
const LN_LIST_PAD = { padding: "0 14px 6px" };
const lnCardBtn = (extra) => Object.assign({}, LN_CARD, {
  display: "block", width: "100%", textAlign: "left", padding: "13px 15px",
  marginBottom: 10, cursor: "pointer", fontFamily: "inherit",
}, extra || {});

/* ── ช่องกรอก ──
   พื้นขาว + เงานุ่ม ไม่ใช่พื้นเทา (--surface2) บนพื้นนวล (--bg)
   สองสีนั้นต่างกันไม่ถึงสามเปอร์เซ็นต์ ช่องกรอกเลยจมหายไปกับพื้น
   ซึ่งคือเหตุผลที่ฟอร์มดู "ทึบ ๆ" ทั้งที่การ์ดหน้าอื่นลอยแล้ว

   ⚠ fontSize 16 ห้ามลด — Safari บน iOS ซูมทั้งหน้าอัตโนมัติเมื่อโฟกัสช่องที่เล็กกว่า 16px
     แล้วผู้ใช้ต้องถ่างนิ้วย่อกลับเองทุกครั้ง */
const LN_FIELD = {
  width: "100%", padding: "13px 15px", borderRadius: 16,
  border: "1px solid var(--border)", boxShadow: "var(--soft)",
  background: "var(--surface)", color: "var(--text-1)",
  fontFamily: "inherit", fontSize: 16, outline: "none",
};
const LN_LABEL = { fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" };
const LN_BTN = {
  width: "100%", padding: "16px 18px", borderRadius: 20, border: "none",
  fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer",
};

/* ชิปเลือกหนึ่งอย่าง — ทรงเม็ดยาเหมือนปุ่มกรอง ไม่ใช่กล่องมุมมนที่ดูเหมือนปุ่มกด */
const lnChip = (on, color) => ({
  padding: "9px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
  border: "none",
  background: on ? (color ? color + "16" : "var(--primary-soft)") : "var(--surface)",
  boxShadow: on ? "inset 0 0 0 1px " + (color || "var(--primary)") : "var(--soft)",
  color: on ? (color || "var(--primary-dark)") : "var(--text-2)",
});

/* ── ป้ายกำกับ + ช่องกรอก ──
   เขียนซ้ำอยู่เกือบสามสิบที่ในสามไฟล์ ทั้งที่เป็นทรงเดียวกันหมด */
function LnField({ label, req, hint, children }) {
  return (
    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
      <span style={LN_LABEL}>{label}{req && <span style={{ color: "#EF4444" }}> *</span>}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>{hint}</span>}
    </label>
  );
}

/* ── แผ่นเต็มจอ (ฟอร์ม / รายละเอียด) ──
   zIndex 60 สูงกว่าแถบแท็บ (20) และปุ่มกระดิ่งลอย (30) — เปิดฟอร์มแล้วสองอันนั้นต้องหลบ */
const LN_SHEET = {
  position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)",
  overflowY: "auto", overflowX: "hidden",
};

/* หัวแผ่น — กลืนไปกับพื้นเหมือนแถบหัวของหน้าหลัก ไม่ใช่แถบขาวมีเส้นคั่น
   ปุ่มปิดเป็นวงกลมขาวลอย ทรงเดียวกับรูปโปรไฟล์มุมขวาบน จะได้อ่านว่าเป็นปุ่มจริง ๆ */
function LnSheetHead({ title, no, onClose, right }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 11,
      padding: "14px 16px 12px", background: "var(--bg)",
      paddingTop: "calc(14px + env(safe-area-inset-top, 0px))" }}>
      <button className="x-close" onClick={onClose} aria-label="ปิด"
        style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 99, padding: 0, cursor: "pointer",
          border: "1px solid var(--border)", boxShadow: "var(--soft)", background: "var(--surface)",
          display: "grid", placeItems: "center" }}>
        <Icon name="x" size={18} color="var(--text-2)" />
      </button>
      <b style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{title}</b>
      {right}
      {no && <span style={{ marginLeft: right ? 0 : "auto", fontFamily: "var(--mono)", fontSize: 11.5,
        color: "var(--text-3)" }}>{no}</span>}
    </div>
  );
}

/* ── แถบหัวข้อย่อยในแท็บ ──
   ทรงคนละแบบกับ LnPick โดยตั้งใจ: LnPick คือ "กรองรายการที่เห็นอยู่"
   ส่วนอันนี้คือ "เปลี่ยนว่ากำลังดูเรื่องอะไร" ซึ่งเป็นการเดินทาง ไม่ใช่การกรอง
   ทรงเดียวกันสองความหมายคือเหตุผลที่คนกดผิดแล้วงงว่าของหายไปไหน */
function LnSub({ items, value, onPick }) {
  const use = (items || []).filter(Boolean);
  if (use.length < 2) return null;
  return (
    <div style={{ display: "flex", gap: 4, padding: 4, margin: "0 14px 12px",
      borderRadius: 18, background: "var(--surface3)" }}>
      {use.map((it) => {
        const on = value === it.key;
        return (
          <button key={it.key} onClick={() => onPick(it.key)}
            style={{ flex: 1, minWidth: 0, padding: "9px 4px", borderRadius: 14, border: "none", cursor: "pointer",
              background: on ? "var(--surface)" : "transparent", boxShadow: on ? "var(--soft)" : "none",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap",
              color: on ? "var(--primary-dark)" : "var(--text-3)" }}>
            {it.th}
            {it.n ? <span style={{ marginLeft: 5, padding: "1px 6px", borderRadius: 99,
              background: on ? "var(--primary-soft)" : "var(--surface)", fontSize: 11 }}>{it.n}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  LN_CARD, LN_LIST_PAD, lnCardBtn, LN_FIELD, LN_LABEL, LN_BTN, lnChip,
  LN_SHEET, LnField, LnSheetHead, LnSub,
});
