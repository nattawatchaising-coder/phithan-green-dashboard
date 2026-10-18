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
  background: "var(--surface)", border: "1px solid var(--card-bd)",
  boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)",
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
/* หลุมแบบช่องกรอกของเว็บ (DESIGN.md) — ไม่มีเส้นขอบ เงาเข้าข้างใน */
const LN_FIELD = {
  width: "100%", padding: "13px 15px", borderRadius: "var(--r-tile)",
  border: "none", boxShadow: "var(--shadow-inset)",
  background: "var(--surface2)", color: "var(--text-1)",
  fontFamily: "inherit", fontSize: 16, outline: "none",
};
const LN_LABEL = { fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" };
const LN_BTN = {
  width: "100%", padding: "16px 18px", borderRadius: "var(--r-tile)", border: "none",
  fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer",
};

/* ชิปเลือกหนึ่งอย่าง — ทรงเม็ดยาเหมือนปุ่มกรอง ไม่ใช่กล่องมุมมนที่ดูเหมือนปุ่มกด */
const lnChip = (on, color) => ({
  padding: "9px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
  fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
  border: "none",
  background: on ? (color ? color + "16" : "var(--primary-soft)") : "var(--surface)",
  boxShadow: on ? "inset 0 0 0 1px " + (color || "var(--primary)") : "var(--shadow-sm)",
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
          border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)",
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
      borderRadius: "var(--r-tile)", background: "var(--surface3)" }}>
      {use.map((it) => {
        const on = value === it.key;
        return (
          <button key={it.key} onClick={() => onPick(it.key)}
            style={{ flex: 1, minWidth: 0, padding: "9px 4px", borderRadius: "var(--r-chip)", border: "none", cursor: "pointer",
              background: on ? "var(--surface)" : "transparent", boxShadow: on ? "var(--shadow-sm)" : "none",
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

/* ── ช่องเลือกแบบแผ่นเลื่อนขึ้นจากล่าง แทน <select> ──
   ผู้ใช้สั่ง ต.ค. 2026 "dropdown ไม่สวย" — ดรอปดาวน์ของระบบหน้าตาไม่ตรงแอป และรายการงานยาวอ่านยาก
   options: [{ value, label, sub?, group? }] · value "" = ตัวเลือกว่าง (placeholder)
   รายการเกิน 8 มีช่องค้นหา · มี group = ขึ้นหัวกลุ่ม (เรียงตามลำดับที่ส่งมา)
   required = ไม่มีแถว "ว่าง" ให้เลือกกลับ · disabled = กดไม่ได้ (ใบที่ล็อกแล้ว)
   ⚠ แอป LINE ใช้ตัวนี้ทุกช่องเลือก ห้ามกลับไปใช้ <select> (ผู้ใช้สั่ง ต.ค. 2026) */
function LnSelect({ value, onChange, options, placeholder, title, style, required, disabled }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const opts = options || [];
  const cur = opts.find((o) => o.value === (value || ""));
  React.useEffect(() => { if (!open) setQ(""); }, [open]);
  const qq = q.trim().toLowerCase();
  const shown = (required ? [] : [{ value: "", label: placeholder || "— ไม่ระบุ —" }]).concat(opts.filter((o) => o.value !== "")
    .filter((o) => !qq || (o.label + " " + (o.sub || "")).toLowerCase().includes(qq)));
  let lastGroup = null;
  return (
    <React.Fragment>
      <button type="button" disabled={disabled} onClick={() => { if (!disabled) setOpen(true); }}
        style={Object.assign({}, LN_FIELD, { display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: disabled ? "default" : "pointer",
          boxSizing: "border-box" }, style || {})}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: cur && cur.value ? "var(--text-1)" : "var(--text-3)" }}>
          {cur && cur.value ? cur.label : (placeholder || "— ไม่ระบุ —")}
          {cur && cur.value && cur.sub ? <span style={{ marginLeft: 6, fontSize: 12.5, color: "var(--text-3)" }}>{cur.sub}</span> : null}
        </span>
        {!disabled && <Icon name="chevronDown" size={18} color="var(--text-3)" />}
      </button>
      {open && ReactDOM.createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,43,51,.38)", display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxHeight: "78vh", display: "flex", flexDirection: "column", background: "var(--bg)",
              borderRadius: "22px 22px 0 0", boxShadow: "0 -10px 30px rgba(0,0,0,.18)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 10px" }}>
              <b style={{ flex: 1, fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{title || "เลือก"}</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="ปิด"
                style={{ width: 32, height: 32, borderRadius: 99, padding: 0, border: "none", cursor: "pointer",
                  boxShadow: "var(--shadow-sm)", background: "var(--surface)", display: "grid", placeItems: "center" }}>
                <Icon name="x" size={16} color="var(--text-2)" />
              </button>
            </div>
            {opts.length > 8 && (
              <div style={{ padding: "0 16px 10px", position: "relative" }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา"
                  style={Object.assign({}, LN_FIELD, { boxSizing: "border-box", paddingLeft: 40 })} />
                <span style={{ position: "absolute", left: 30, top: 15, pointerEvents: "none" }}>
                  <Icon name="search" size={17} color="var(--text-3)" />
                </span>
              </div>
            )}
            <div style={{ overflowY: "auto", padding: "0 16px 16px", display: "grid", gap: 6 }}>
              {shown.map((o) => {
                const on = (value || "") === o.value;
                const head = o.group && o.group !== lastGroup ? o.group : null;
                if (o.value) lastGroup = o.group || null;
                return (
                  <React.Fragment key={o.value || "__none"}>
                    {head && <div style={{ margin: "6px 2px 0", fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>{head}</div>}
                    <button type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px",
                        borderRadius: "var(--r-tile)", border: "none", cursor: "pointer", fontFamily: "inherit",
                        background: on ? "var(--primary-soft)" : "var(--surface)", boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700,
                          color: on ? "var(--primary-dark)" : o.value ? "var(--text-1)" : "var(--text-3)" }}>{o.label}</span>
                        {o.sub && <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>{o.sub}</span>}
                      </span>
                      {on && <Icon name="check" size={18} color="var(--primary-dark)" />}
                    </button>
                  </React.Fragment>
                );
              })}
              {shown.length <= (required ? 0 : 1) && qq && <div style={{ padding: 14, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>ไม่พบ "{q}"</div>}
            </div>
          </div>
        </div>, document.body)}
    </React.Fragment>
  );
}

/* ตัวเลือกงานสำหรับ LnSelect — ชื่องานเป็นตัวหลัก รหัสเป็นบรรทัดรอง · แบ่งกลุ่มตามประเภทงาน */
function lnJobOpts(jobs, grouped) {
  const T = (window.SF && window.SF.TYPES) || [];
  const order = (j) => { const i = T.findIndex((t) => t.key === j.type); return i < 0 ? 99 : i; };
  const list = (jobs || []).slice(0, 80);
  if (grouped) list.sort((a, b) => order(a) - order(b));
  return list.map((j) => {
    const t = T.find((x) => x.key === j.type);
    return { value: j.id, label: j.name || j.code, sub: j.code, group: grouped && t ? t.th : undefined };
  });
}

Object.assign(window, {
  LN_CARD, LN_LIST_PAD, lnCardBtn, LN_FIELD, LN_LABEL, LN_BTN, lnChip,
  LN_SHEET, LnField, LnSheetHead, LnSub, LnSelect, lnJobOpts,
});
