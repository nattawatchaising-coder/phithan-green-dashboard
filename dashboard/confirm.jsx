/* ============================================================
   askConfirm — กล่องยืนยันในหน้า แทน confirm() ของเบราว์เซอร์
   ------------------------------------------------------------
   ทำไมต้องเลิกใช้ confirm() :
   · ผู้ใช้กด "ไม่ให้เว็บนี้แสดงกล่องข้อความอีก" ครั้งเดียว confirm() จะคืน false เงียบ ๆ
     ตลอดไป → ปุ่มลบทุกปุ่มในแอปกลายเป็นกดแล้วไม่มีอะไรเกิดขึ้น หาสาเหตุไม่เจอ
   · บนมือถือ/PWA กล่องของเบราว์เซอร์หน้าตาไม่เข้ากับแอป และบางที่ถูกบล็อกไปเลย
   · confirm() หยุด JS ทั้งเส้น ทำให้ Firebase ที่กำลังซิงก์ค้าง

   วิธีใช้ :  askConfirm("ลบรูปนี้?").then((ok) => { if (ok) ลบ(); });
   หรือแบบเต็ม :
     askConfirm({ title: "ลบหมวดนี้?", body: "ของในหมวดจะไปอยู่ 'อื่นๆ'",
                  ok: "ลบหมวด", danger: true, icon: "trash" })

   ต้องมี <ConfirmHost /> อยู่ในหน้า 1 ตัว (mount ไว้ใน App) ถ้าไม่มี จะถอยไปใช้
   confirm() ของเบราว์เซอร์ให้อัตโนมัติ เพื่อไม่ให้ปุ่มตายถ้ามีคนลืม mount
   ============================================================ */

let _openAsk = null;      /* ตัวรับคำขอจาก ConfirmHost ที่ mount อยู่ */

function askConfirm(opts) {
  const o = typeof opts === "string" ? { title: opts } : (opts || {});
  if (!_openAsk) return Promise.resolve(window.confirm(o.title || o.body || "ยืนยัน?"));
  return new Promise((resolve) => _openAsk(Object.assign({}, o, { resolve })));
}

function ConfirmHost() {
  const [req, setReq] = React.useState(null);

  React.useEffect(() => {
    _openAsk = (r) => setReq(r);
    return () => { _openAsk = null; };
  }, []);

  const done = React.useCallback((ok) => {
    setReq((cur) => { if (cur && cur.resolve) cur.resolve(ok); return null; });
  }, []);

  /* Esc = ยกเลิก · Enter = ตกลง (ปุ่มตกลงโฟกัสอยู่แล้ว แต่เผื่อโฟกัสหลุด) */
  React.useEffect(() => {
    if (!req) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); done(false); }
      else if (e.key === "Enter") { e.preventDefault(); done(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [req, done]);

  if (!req) return null;
  const danger = req.danger !== false;                 /* ส่วนใหญ่คือปุ่มลบ ให้แดงเป็นค่าตั้งต้น */
  const accent = danger ? "#EF4444" : "var(--primary)";
  const icon = req.icon || (danger ? "trash" : "alert");

  return (
    <div onClick={() => done(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
        zIndex: 9000, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
          width: "min(420px, 100%)", padding: 20, boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center",
            background: danger ? "var(--tint-red-bg)" : "var(--primary-soft)" }}>
            <Icon name={icon} size={18} color={accent} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.45, wordBreak: "break-word" }}>
              {req.title || "ยืนยันการทำรายการ?"}
            </div>
            {req.body && (
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {req.body}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={() => done(false)}
            style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {req.cancel || "ยกเลิก"}
          </button>
          <button autoFocus onClick={() => done(true)}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: accent, color: "#fff",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {req.ok || (danger ? "ลบ" : "ตกลง")}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { askConfirm, ConfirmHost });
