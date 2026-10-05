/* ============================================================
   flash+solar — หน้าจอในแอป LINE (LIFF) · คำนำหน้า ln / Ln

   เฟส 1: ค้นหา/ดูข้อมูลงาน · แจ้งเตือนของฉัน (อ่านอย่างเดียว)
   เฟส 2: ลงเวลาเข้า-ออกพร้อมพิกัด · ขอ OT  ← หน้าจอชุดแรกที่เขียนข้อมูลลงฐานจริง
   (เบิกเงิน · รายงานประจำวัน อยู่เฟสถัดไป)

   ⚠ ปุ่มลงเวลา **ห้ามปฏิเสธ** ไม่ว่าจะจับพิกัดได้หรือไม่ — ดูเหตุผลที่หัวไฟล์ attend.jsx

   หน้าจอชุดนี้ไม่ได้เขียนตรรกะสิทธิ์ใหม่เลย — ใช้ jobScopeOf/jobInScope/can
   ชุดเดียวกับเว็บเดสก์ท็อป ฉะนั้น "ช่างเห็นงานอะไรบ้าง" ตอบเหมือนกันทั้งสองที่เสมอ
   ============================================================ */

/* ── สามแท็บ ──
   "เวลา" อยู่ตรงกลางพอดี เพราะเป็นปุ่มที่ถูกกดบ่อยที่สุดในวันหนึ่ง ๆ
   และตรงกลางคือที่ที่นิ้วโป้งพักอยู่เวลาถือมือถือมือเดียว

   ของที่หายไปจากแถบนี้ไม่ได้ถูกลบ — ย้ายไปอยู่ในเรื่องของมันเอง
   · งานซ่อม + รายงานประจำวัน → หัวข้อย่อยในแท็บ "งาน"
     ทั้งสามเรื่องผูกกับหน้างานเหมือนกัน ต่างกันแค่กำลังดู สั่ง หรือรายงาน
   · อนุมัติ → กระจายกลับไปอยู่ท้ายเรื่องที่มันอนุมัติ
     ใบขอ OT รออนุมัติอยู่ในแท็บเวลา · ใบเบิกอยู่ในแท็บเบิก · รายงานอยู่ในหัวข้อรายงาน
     กล่องขาเข้าที่รวมสามเรื่องอ่านง่ายเฉพาะกับคนที่อนุมัติครบทั้งสามเรื่อง ซึ่งมีไม่กี่คน
     คนที่อนุมัติเรื่องเดียวต้องเดินผ่านอีกสองเรื่องที่ไม่ใช่ของตัวเองทุกครั้ง
     และที่สำคัญกว่านั้น: คนอนุมัติใบ OT กับคนที่กำลังดูปฏิทินลงเวลาเป็นคนเดียวกัน
     ข้อมูลที่ต้องใช้ตัดสินอยู่คนละแท็บกับปุ่มตัดสิน คือสิ่งที่ทำให้ต้องสลับไปมา
   · ฉัน → รูปวงกลมมุมขวาบนของแถบหัว ที่ที่แอปอื่นวางมันไว้อยู่แล้ว

   เจ็ดแท็บบนจอ 360px ได้ช่องละ 51px ซึ่งแคบกว่าปลายนิ้วโป้ง — สามแท็บได้ช่องละ 120px */
const LN_TAB = [
  { key: "jobs", th: "งาน",  icon: "wrench" },
  { key: "time", th: "เวลา", icon: "clock" },
  { key: "ec",   th: "เบิก", icon: "wallet" },
];

/* หัวข้อย่อยในแท็บ "งาน" */
const LN_JOB_SUB = [
  { key: "list",  th: "งานติดตั้ง" },
  { key: "fix",   th: "งานซ่อม" },
  { key: "daily", th: "รายงาน" },
];

/* ทรงการ์ด (LN_CARD · LN_LIST_PAD · lnCardBtn) · ช่องกรอก (LN_FIELD · LN_LABEL · LN_BTN)
   แถบหัวข้อย่อย (LnSub) และแผ่นเต็มจอ (LN_SHEET · LnSheetHead) อยู่ใน liff-ui.jsx
   ซึ่งโหลดก่อนไฟล์นี้ — สคริปต์ชุดนี้ใช้ขอบเขตร่วมกัน จึงเรียกใช้ได้ตรง ๆ */

/* ── แจ้งเตือนแต่ละเรื่องมีสีและไอคอนของตัวเอง ──
   รายการแจ้งเตือนที่เป็นตัวหนังสือสีเดียวกันทั้งหน้า ต้องอ่านทุกบรรทัดถึงจะรู้ว่าเรื่องอะไร
   ทั้งที่ 90% ของการเปิดดูคือกวาดตาหาว่า "มีอะไรที่ต้องรีบไหม"
   สี+ไอคอนใช้ชุดเดียวกับแท็บที่เรื่องนั้นอยู่ เห็นไอคอนประแจ = เรื่องงานติดตั้ง
   จะได้ไม่ต้องจำรหัสสีชุดใหม่ และกดต่อได้ถูกที่

   ⚠ คีย์ต้องตรงกับ n.type ที่ฝั่งคนสร้างแจ้งเตือนเขียนลงไป (addNotif · omNotify · ecNotify · tmNotify)
     type ที่ไม่รู้จักตกมาที่ค่าปริยาย ไม่ใช่หายไปจากรายการ */
const LN_NOTIF_KIND = {
  assign:  { th: "งานติดตั้ง",  icon: "wrench", color: "#1B9B75" },
  om:      { th: "งานซ่อม",    icon: "alert",  color: "#F59E0B" },
  ot:      { th: "โอที",       icon: "clock",  color: "#6366F1" },
  leave:   { th: "การลา",      icon: "calendar", color: "#0EA5E9" },
  daily:   { th: "รายงาน",     icon: "pen",    color: "#0EA5E9" },
  expense: { th: "เบิกเงิน",    icon: "wallet", color: "#8B5CF6" },
  permit:  { th: "ขออนุญาต",   icon: "file",   color: "#64748B" },
};
const LN_NOTIF_ANY = { th: "แจ้งเตือน", icon: "bell", color: "#94A3B8" };
const lnNotifKind = (n) => LN_NOTIF_KIND[(n || {}).type] || LN_NOTIF_ANY;

/* ปุ่มบนเมนูล่างของ LINE ส่ง ?tab= ติดมากับ URL ของหน้า LIFF
   (LIFF ต่อ query ที่ผู้ใช้กดเข้ากับ endpoint ให้เอง)
   ช่างกด "ลงเวลา" แล้วต้องเจอหน้าลงเวลา ไม่ใช่มาเจอหน้างานแล้วต้องหาแท็บเอง
   ค่าที่ไม่รู้จัก = กลับไปหน้าแรก ไม่ใช่หน้าขาว */
const LN_START = (() => {
  let t = "";
  try { t = new URLSearchParams(window.location.search).get("tab") || ""; } catch (e) { t = ""; }
  const at = (tab, sub, extra) => Object.assign({ tab: tab, sub: sub || "", ot: false, me: false }, extra || {});
  if (t === "ot")    return at("time", "", { ot: true });
  /* ปุ่ม "ขอลา" บนเมนูล่างของไลน์ → หัวข้อการลา · ลิงก์ในแจ้งเตือนใบลาก็มาทางนี้ */
  if (t === "leave") return at("time", "leave");
  /* คีย์เก่าจากตอนที่ยังมีเจ็ดแท็บ — ปุ่มในเมนูล่างของไลน์ที่ตั้งไว้แล้วต้องไม่พัง
     พาไปที่หัวข้อย่อยที่เรื่องนั้นย้ายไปอยู่ ไม่ใช่ตกลงหน้าแรกเฉย ๆ */
  if (t === "fix")   return at("jobs", "fix");
  if (t === "daily") return at("jobs", "daily");
  /* ?tab=appr ไม่มีปลายทางเดียวอีกแล้ว เพราะกล่องขาเข้าถูกแยกเป็นสามที่
     พาไปที่ใบขอ OT ซึ่งเป็นเรื่องที่มีใบเข้ามาถี่ที่สุด และเป็นแท็บกลางที่เดินต่อง่ายที่สุด
     ปุ่มในเมนูไลน์ควรถูกแก้ให้ชี้ ?tab=time แทนเมื่อสะดวก */
  if (t === "appr")  return at("time", "appr");
  if (t === "me")    return at("jobs", "", { me: true });
  if (t === "bell")  return at("bell");
  return at(LN_TAB.some((x) => x.key === t) ? t : "jobs");
})();

/* ── แถบหัว: เหลือแค่ตราบริษัท ──
   แท็บย้ายลงไปอยู่ขอบล่างจอแล้ว (LnTabs) — มือถือจอยาว นิ้วโป้งเอื้อมถึงขอบล่าง ไม่ถึงขอบบน
   และแถบบนที่เตี้ยลงคืนพื้นที่ให้เนื้องานอีกหนึ่งแถว */
function LnHead({ me, onMe }) {
  const nm = String((me || {}).name || "").trim();
  return (
    /* ไม่มีพื้นขาวและไม่มีเส้นคั่น — แถบหัวกลืนไปกับพื้นหน้า ปล่อยให้การ์ดข้างล่างเป็นของที่ลอยอยู่ชิ้นเดียว
       ยัง sticky อยู่ เพราะตราบริษัทคือที่ที่สายตากลับมาหาเวลาหลงว่าอยู่หน้าไหน */
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg)",
      paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* ตราบริษัท 26px ไม่ใช่ 19 — ที่ 19 ตัวอักษร "flash+solar" ตกลงไปเหลือ 9px
          ซึ่งเล็กกว่าตัวหนังสือที่เล็กที่สุดในหน้านี้ อ่านเป็นรอยเปื้อนมากกว่าอ่านเป็นชื่อ
          (BrandLockup คิดขนาดตัวอักษรจาก size × 0.49 และบรรทัดรองจากตัวอักษรอีกที) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 12px" }}>
        {window.BrandLockup ? <window.BrandLockup size={26} /> : <b>flash+solar</b>}
        {/* "ฉัน" ไม่ใช่ที่ที่คนเข้าไปทำงาน เข้าไปหยิบนามบัตรตอนยืนคุยกับลูกค้าเท่านั้น
            ของแบบนั้นไม่ควรกินช่องหนึ่งในแถบล่างเท่ากับ "ลงเวลา" ที่กดทุกวันวันละสองครั้ง */}
        {me && (
          <button onClick={onMe} aria-label="ข้อมูลของฉัน"
            style={{ marginLeft: "auto", flexShrink: 0, width: 38, height: 38, borderRadius: 99, padding: 0,
              border: "1px solid var(--border)", boxShadow: "var(--soft)", background: "var(--surface)",
              color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 15, fontWeight: 800,
              cursor: "pointer", display: "grid", placeItems: "center" }}>
            {nm ? nm.slice(0, 1) : <Icon name="user" size={17} color="var(--text-3)" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── แผ่น "ฉัน" ──
   เต็มจอและปิดด้วยปุ่มกากบาท ไม่ใช่แท็บ — เข้ามาหยิบของชิ้นเดียวแล้วออก ไม่ได้มาอยู่ */
function LnMeSheet({ me, onClose }) {
  if (!me) return null;
  return (
    <div style={LN_SHEET}>
      <LnSheetHead title="ข้อมูลของฉัน" onClose={onClose} />
      <div style={{ padding: "0 18px 28px", display: "grid", gap: 14 }}>
        {/* นามบัตรวางติดหน้าเลย ไม่ต้องกดเข้าไปอีกชั้น — หน้านี้มีของอยู่อย่างเดียว
            และของชิ้นนั้นคือสิ่งที่ต้องหยิบมาโชว์ให้ลูกค้าเดี๋ยวนั้นตอนยืนอยู่หน้างาน */}
        {window.VcCardBody
          ? <window.VcCardBody user={me} />
          : (
            <div style={Object.assign({ padding: 18, textAlign: "center" }, LN_CARD)}>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)" }}>{me.name}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>ชื่อผู้ใช้ {me.username || "—"}</div>
            </div>
          )}

        {window.LN_TEST && (
          <div style={{ padding: 12, borderRadius: 16, background: "var(--tint-amber-bg)",
            border: "1px solid var(--tint-amber-bd)", color: "var(--tint-amber-tx)", fontSize: 12.5,
            fontWeight: 700, textAlign: "center" }}>
            โหมดทดสอบ — ข้อมูลที่บันทึกจะไม่เข้าระบบจริง
          </div>
        )}
      </div>
    </div>
  );
}

/* ── แถบแท็บล่างจอ ──
   fixed ไม่ใช่ sticky เพราะต้องติดขอบล่างตลอด ไม่ว่าเนื้อหาจะสั้นหรือยาว
   zIndex 20 ต่ำกว่าแผ่นซ้อนทุกใบ (60) — เปิดใบงานหรือชีตแล้วแถบนี้ต้องหลบไป ไม่ใช่ลอยทับ
   ตัวหน้าเผื่อ paddingBottom ให้เท่ากับความสูงแถบบวกระยะที่ลอยพ้นขอบ ไม่งั้นแถวสุดท้ายจะโดนบัง
   ลอยพ้นขอบจอ 10px ทั้งสามด้าน — แถบที่แปะติดขอบทำให้หน้าจบแบบทื่อ ๆ
   แบบลอยทำให้เห็นว่าเนื้อหายังเลื่อนต่อได้ข้างใต้ และเข้ากับการ์ดที่ลอยอยู่แล้วทั้งหน้า */
const LN_TABBAR_H = 64, LN_TABBAR_GAP = 10;
function LnTabs({ tab, setTab, tabs }) {
  const list = tabs && tabs.length ? tabs : LN_TAB;
  return (
    <div style={{ position: "fixed", zIndex: 20, background: "var(--surface)",
      left: LN_TABBAR_GAP, right: LN_TABBAR_GAP,
      bottom: "calc(" + LN_TABBAR_GAP + "px + env(safe-area-inset-bottom, 0px))",
      borderRadius: 26, border: "1px solid var(--border)", boxShadow: "var(--soft-lg)", overflow: "hidden" }}>
      <div style={{ display: "flex", padding: 5, gap: 3 }}>
        {list.map((t) => {
          const on = tab === t.key;
          return (
            /* เหลือสามช่อง ตัวหนังสือกับไอคอนจึงโตขึ้นได้ — ตอนเจ็ดแท็บต้องบีบเหลือ 10.5px
               ซึ่งเล็กกว่าที่คนใส่ถุงมือยืนกลางแดดจะอ่านออกจากหางตา
               แผ่นสีอ่อนรองอยู่แทนขีดใต้ — ขีดบาง ๆ บนแถบที่มุมมนใหญ่จะดูเป็นเศษเส้น */
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, position: "relative", padding: "9px 0 10px", border: "none", cursor: "pointer",
                borderRadius: 20, background: on ? "var(--primary-soft)" : "transparent",
                fontFamily: "inherit", fontSize: 11.5, fontWeight: 800, color: on ? "var(--primary-dark)" : "var(--text-3)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Icon name={t.icon} size={21} color={on ? "var(--primary-dark)" : "var(--text-3)"} />
              {t.th}
            </button>
          );
        })}
      </div>
    </div>
  );
}



/* ── ปุ่มแจ้งเตือนลอย ──
   ย้ายออกจากแถบแท็บมาเป็นปุ่มกลมลอย ลากย้ายได้แบบปุ่มช่วยเหลือของไอโฟน
   ปล่อยแล้วดีดไปติดขอบซ้ายหรือขวาที่ใกล้กว่า และจำตำแหน่งไว้ใน localStorage
   ที่ต้องลากได้ เพราะปุ่มลอยที่ขยับไม่ได้จะไปบังของบางอย่างในบางหน้าเสมอ แล้วผู้ใช้ทำอะไรไม่ได้เลย
   zIndex 30 สูงกว่าแถบแท็บ (20) แต่ต่ำกว่าแผ่นซ้อน (60) — เปิดใบงานหรือชีตแล้วปุ่มต้องหลบ */
const LN_FAB = 52, LN_FAB_PAD = 12, LN_FAB_KEY = "ln_bell_pos";
const lnFabClamp = (q) => ({
  x: Math.max(LN_FAB_PAD, Math.min(q.x, window.innerWidth - LN_FAB - LN_FAB_PAD)),
  y: Math.max(LN_FAB_PAD, Math.min(q.y, window.innerHeight - LN_FAB - LN_FAB_PAD)),
});
function lnFabLoad() {
  /* บีบเข้ากรอบทุกครั้งที่อ่าน — ตำแหน่งที่จำไว้มาจากจอเดิม หมุนจอหรือเปลี่ยนเครื่องแล้วอาจอยู่นอกจอ */
  try {
    const v = JSON.parse(localStorage.getItem(LN_FAB_KEY) || "null");
    if (v && isFinite(v.x) && isFinite(v.y)) return lnFabClamp(v);
  } catch (e) {}
  return { x: window.innerWidth - LN_FAB - LN_FAB_PAD, y: 82 };
}

function LnBellFab({ unread, on, onClick }) {
  const [pos, setPos] = React.useState(lnFabLoad);
  const drag = React.useRef(null);
  const [moving, setMoving] = React.useState(false);

  React.useEffect(() => {
    const fit = () => setPos((q) => lnFabClamp(q));
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => { window.removeEventListener("resize", fit); window.removeEventListener("orientationchange", fit); };
  }, []);

  /* ── ลากด้วย listener บน window ไม่ใช่ setPointerCapture ──
     setPointerCapture โยน NotFoundError ได้ถ้าตัวชี้หลุดไปก่อน (นิ้วที่สองแตะ · ระบบยึดสัมผัสไปทำท่าอื่น)
     ซึ่งเจอตอนทดสอบจริง ถ้าปล่อยให้โยนตรงนั้น drag.current จะไม่ถูกตั้ง แล้วปุ่มจะลากไม่ได้ทั้งตัว
     ผูกที่ window แทน ได้ pointermove/pointerup ครบแม้นิ้วจะเลื่อนออกนอกปุ่มไปแล้ว */
  const down = (e) => {
    e.preventDefault();
    const c = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, sx: e.clientX, sy: e.clientY, far: 0, id: e.pointerId };
    drag.current = c;
    setMoving(true);

    const move = (ev) => {
      if (ev.pointerId !== c.id) return;
      c.far = Math.max(c.far, Math.abs(ev.clientX - c.sx) + Math.abs(ev.clientY - c.sy));
      setPos(lnFabClamp({ x: ev.clientX - c.dx, y: ev.clientY - c.dy }));
    };
    const up = (ev) => {
      if (ev.pointerId !== c.id) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      drag.current = null;
      setMoving(false);
      /* ขยับไม่ถึง 8px ถือว่าตั้งใจกด ไม่ใช่ตั้งใจลาก — นิ้วคนไม่เคยนิ่งสนิท */
      if (c.far < 8) { onClick(); return; }
      setPos((q) => {
        const left = q.x + LN_FAB / 2 < window.innerWidth / 2;
        const snap = lnFabClamp({ x: left ? LN_FAB_PAD : window.innerWidth - LN_FAB - LN_FAB_PAD, y: q.y });
        try { localStorage.setItem(LN_FAB_KEY, JSON.stringify(snap)); } catch (er) {}
        return snap;
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <button onPointerDown={down}
      title={"แจ้งเตือน" + (unread ? " " + unread + " เรื่อง" : "")} aria-label="แจ้งเตือน"
      style={{ position: "fixed", left: pos.x, top: pos.y, width: LN_FAB, height: LN_FAB, zIndex: 30,
        padding: 0, borderRadius: 99, cursor: moving ? "grabbing" : "grab",
        /* touchAction none — ไม่งั้นนิ้วที่ลากปุ่มจะไปเลื่อนหน้าแทน */
        touchAction: "none", WebkitTapHighlightColor: "transparent",
        /* ตอนเปิดอยู่ใช้เขียวเข้ม (--primary-dark) ไม่ใช่เขียวสด (--primary)
           เพราะเขียวสดเป็นสีของ "ปุ่มกดแล้วมีอะไรเกิดขึ้น" ทั้งแอป
           ปุ่มนี้แค่สลับหน้า ทาสีเดียวกันแล้วมันแย่งสายตาไปจากปุ่มจริง ๆ และดูจัดจ้านเกิน */
        border: "none",
        background: on ? "var(--primary-dark)" : "var(--surface)",
        boxShadow: moving ? "0 12px 28px rgba(8,20,14,.3)" : "0 6px 20px rgba(8,20,14,.2)",
        display: "grid", placeItems: "center",
        transition: moving ? "none" : "left .18s ease, top .18s ease, box-shadow .15s ease" }}>
      <Icon name="bell" size={22} color={on ? "#fff" : "var(--text-2)"} />
      {unread > 0 && (
        <span style={{ position: "absolute", top: -2, right: -2, minWidth: 19, height: 19, padding: "0 5px",
          borderRadius: 99, background: "#D93025", color: "#fff", fontSize: 11, fontWeight: 800,
          border: "2px solid var(--surface)", display: "inline-grid", placeItems: "center" }}>{unread}</span>
      )}
    </button>
  );
}

/* ── แถวงานหนึ่งใบ ── */
function LnJobRow({ job, onOpen }) {
  const st = (window.SF.STAGES || []).find((s) => s.key === job.stage) || {};
  return (
    /* การ์ดลอยเว้นระยะกัน ไม่ใช่แถวขาวติดกันคั่นด้วยเส้นผม
       ใบงานเป็น "ของหนึ่งชิ้น" ที่กดเข้าไปได้ ไม่ใช่บรรทัดหนึ่งในตาราง — ทรงต้องบอกแบบนั้น */
    <button onClick={() => onOpen(job)} style={lnCardBtn()}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{job.code}</span>
        <span style={{ padding: "2px 8px", borderRadius: 99, background: st.soft || "var(--surface3)", color: st.fg || "var(--text-2)",
          fontSize: 10.5, fontWeight: 800 }}>{st.th || job.stage}</span>
        {job.delayed && <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--tint-red-bg)", color: "var(--tint-red-tx)",
          fontSize: 10.5, fontWeight: 800 }}>ล่าช้า</span>}
      </div>
      <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>{job.name || "—"}</div>
      <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>
        {[job.province, job.kw ? job.kw + " kW" : "", job.brand].filter(Boolean).join(" · ")}
      </div>
    </button>
  );
}

/* ── แผ่นรายละเอียดงาน ──
   เบอร์โทรกับแผนที่เป็นลิงก์จริง เพราะสองอย่างนี้คือเหตุผลที่ช่างเปิดดูงานบนมือถือ */
/* ── ไฟล์แนบของงาน (แบบ · BOQ) ──
   ไฟล์ถูกแนบไว้จากเว็บอยู่แล้ว (jobFiles/{jobId} เก็บ base64) ที่ขาดคือทางเปิดบนมือถือ
   ช่างที่ยืนอยู่หน้างานต้องเปิดแบบดูได้ ไม่ใช่โทรกลับมาให้ออฟฟิศส่งไลน์ให้

   ⚠ ไม่ subscribe jobFiles ตรง ๆ เพราะโหนดนั้นมี base64 ของทุกไฟล์อยู่ข้างใน
     เปิดใบงานทีก็จะดูดมาทั้งก้อนบน 4G — อ่าน jobFileFlags (บูลีนสองตัว) ก่อน
     แล้วค่อยโหลดไฟล์จริงตอนกด */
function LnJobFiles({ jobId }) {
  const flags = window.useJobFileFlag(jobId);
  const [busy, setBusy] = React.useState("");
  const [got, setGot] = React.useState(null);      /* {kind,url,name,size} ที่โหลดมาแล้ว */
  const [err, setErr] = React.useState("");

  React.useEffect(() => { setGot(null); setErr(""); setBusy(""); }, [jobId]);

  const kinds = [{ key: "design", th: "แบบติดตั้ง" }, { key: "boq", th: "ใบ BOQ" }];
  const have = kinds.filter((k) => flags && flags[k.key]);

  const grab = async (kind, th) => {
    setBusy(kind); setErr(""); setGot(null);
    const f = await window.loadJobFileOnce(jobId, kind);
    setBusy("");
    if (!f) return setErr("เปิด" + th + "ไม่สำเร็จ — ไฟล์อาจถูกลบไปแล้ว");
    setGot(Object.assign({ kind: kind, th: th }, f));
    /* ลองเปิดให้เลย ถ้าแอปบล็อกก็ยังมีปุ่มให้กดเองอยู่ข้างล่าง ไม่ใช่ทางตัน */
    try { window.open(f.url, "_blank", "noopener"); } catch (e) { /* ปล่อยให้กดเอง */ }
  };

  if (flags === null) return null;                 /* ยังอ่านไม่เสร็จ — อย่าเพิ่งโชว์ว่าไม่มีไฟล์ */

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--divider)" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-3)", marginBottom: 8 }}>ไฟล์แนบ</div>

      {have.length === 0
        ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
            งานนี้ยังไม่มีแบบหรือ BOQ แนบไว้ — แนบได้จากใบงานบนเว็บ
          </div>
        : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {have.map((k) => (
              <button key={k.key} onClick={() => grab(k.key, k.th)} disabled={!!busy}
                style={{ flex: 1, minWidth: 140, padding: "12px 14px", borderRadius: 14,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                {busy === k.key ? "กำลังโหลด…" : "เปิด" + k.th + " (PDF)"}
              </button>
            ))}
          </div>}

      {err && <div style={{ marginTop: 9, fontSize: 12.5, color: "#EF4444", fontWeight: 700 }}>{err}</div>}

      {got && (
        <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: 16, background: "var(--surface2)",
          border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", wordBreak: "break-all" }}>{got.name}</div>
          <div style={{ marginTop: 2, fontSize: 11.5, color: "var(--text-3)" }}>
            {got.size ? (got.size / 1048576).toFixed(1) + " MB" : ""} · โหลดเสร็จแล้ว
          </div>
          {/* ลิงก์ที่ผู้ใช้กดเอง ไม่ใช่ window.open จากสคริปต์ —
              WebView ของแอป LINE บล็อกการเปิดหน้าต่างด้วยสคริปต์บ่อย แต่ปล่อยให้กดลิงก์ผ่าน */}
          <a href={got.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", marginTop: 9, padding: "12px 0", borderRadius: 14, background: "var(--primary)",
              color: "#fff", fontWeight: 800, fontSize: 13.5, textAlign: "center", textDecoration: "none" }}>
            เปิด{got.th}
          </a>
          <div style={{ marginTop: 7, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            ถ้าไฟล์ไม่ขึ้น ให้กด ⋯ มุมขวาบนของไลน์ แล้วเลือก “เปิดในเบราว์เซอร์”
          </div>
        </div>
      )}
    </div>
  );
}

function LnJobSheet({ job, techs, onClose }) {
  if (!job) return null;
  const tech = (techs || []).find((t) => t.id === job.tech);
  const rows = [
    ["ลูกค้า", job.name],
    ["ที่อยู่", job.address],
    ["จังหวัด", job.province],
    ["ประเภท", ((window.SF.TYPES || []).find((x) => x.key === job.type) || {}).th || job.type],
    ["ขนาดระบบ", job.kw ? job.kw + " kW" + (job.panels ? " · " + job.panels + " แผง" : "") : ""],
    ["ยี่ห้อ", job.brand],
    ["ช่างผู้รับผิดชอบ", tech ? tech.name : ""],
    ["วิศวกรผู้รับผิดชอบ", job.eeName],
    /* ชื่อฟิลด์มาจาก SF.deriveJob — startDate/deadline คือช่วงวันนัดติดตั้ง ไม่ใช่กำหนดส่งมอบ
       ใช้ drDateTH ไม่ใช่ drShort เพราะ drShort ตัดปีออก — บนมือถือคนดูเพื่อจะไปจริง ต้องเห็นปีด้วย */
    ["วันติดตั้ง", job.startDate
      ? (job.deadline && job.deadline !== job.startDate
          ? window.drShort(job.startDate) + " – " + window.drDateTH(job.deadline)
          : window.drDateTH(job.startDate))
      : ""],
  ].filter((r) => r[1]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,43,51,.42)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "88dvh", overflowY: "auto", background: "var(--surface)",
          borderRadius: "26px 26px 0 0", padding: "16px 18px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{job.code}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 12 }}>{job.name || "—"}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {job.phone && (
            <a href={"tel:" + String(job.phone).replace(/[^0-9+]/g, "")}
              style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 14, background: "var(--primary)", color: "#fff",
                fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>โทรหาลูกค้า</a>
          )}
          {job.map && (
            <a href={job.map} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 14, border: "1px solid var(--border-strong)",
                background: "var(--surface)", color: "var(--text-1)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>เปิดแผนที่</a>
          )}
        </div>

        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--divider)" }}>
            <div style={{ width: 116, flexShrink: 0, fontSize: 12, color: "var(--text-3)" }}>{k}</div>
            <div style={{ flex: 1, fontSize: 13.5, color: "var(--text-1)", fontWeight: 600, wordBreak: "break-word" }}>{v}</div>
          </div>
        ))}

        <LnJobFiles jobId={job.id} />

        <button onClick={onClose}
          style={{ marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 16, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>ปิด</button>
      </div>
    </div>
  );
}

/* ================================================================
   ลงเวลา + ขอ OT (เฟส 2) — หน้าจอชุดแรกที่เขียนข้อมูลลงฐานจริงจากมือถือ
   ================================================================ */

/* ── ปุ่มลงเวลา ──
   ปุ่มเดียวที่เปลี่ยนความหมายตามสถานะของวันนี้ ไม่ใช่สองปุ่มวางข้างกัน
   ช่างกดตอนรีบและมือเปื้อน — สองปุ่มคือเวลาที่ผิดแล้วเจ้าตัวแก้เองไม่ได้ */
function LnClock({ me, cfg, jobs, ot, onAskOt }) {
  /* 95 วัน ไม่ใช่ 14 — ปฏิทินเปิดย้อนไปได้สองเดือน ถ้าดึงมาแค่ 14 วัน เดือนก่อนจะว่างทั้งเดือน
     ทั้งที่มีใบอยู่จริง ซึ่งอ่านแล้วเข้าใจผิดว่า "ไม่ได้ลงเวลา" ไม่ใช่ "ยังไม่ได้โหลดมา" */
  const at = window.useAttend(me ? me.id : null, 95);
  const writer = window.useAttendWriter(me, cfg);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [jobId, setJobId] = React.useState("");
  /* ตั้งต้นที่ "ออฟฟิศ" เพราะวันปกติเริ่มที่ออฟฟิศก่อนแล้วค่อยออกไซต์
     ค่าตั้งต้นที่ตรงกับสิ่งที่เกิดบ่อยที่สุด = คนส่วนใหญ่กดปุ่มเดียวจบ
     (ถ้าวันนี้ลงเวลาไปแล้ว useEffect ข้างล่างจะทับด้วยค่าที่บันทึกไว้จริง) */
  const [place, setPlace] = React.useState("office");
  /* งานบ้านกับงานโครงการปนกันอยู่ในช่องเดียว ช่างหนึ่งคนมักทำอย่างเดียวทั้งสัปดาห์
     กรองก่อนแล้วรายการสั้นลงจนหาด้วยตาได้ — บนมือถือกลางแดดที่ไซต์ รายการยาวเลื่อนหายากกว่าที่คิด */
  const [jobType, setJobType] = React.useState("all");

  /* นาฬิกาเดินเอง — ตัวเลข "ทำงานแล้วกี่ชั่วโมง" ต้องขยับโดยไม่ต้องปิดเปิดแอป
     ยี่สิบวินาทีพอ ตัวเลขแสดงเป็นนาทีอยู่แล้ว ถี่กว่านี้คือกินแบตเปล่า */
  const [nowHM, setNowHM] = React.useState(window.tmNowHM);
  React.useEffect(() => {
    const t = setInterval(() => setNowHM(window.tmNowHM()), 20000);
    return () => clearInterval(t);
  }, []);

  const today = at.today;
  const open = window.tmOpen(today);
  const worked = window.tmWorkedMins(today, cfg, open ? nowHM : null);
  const win = window.tmDayWindow(today, cfg);
  /* OT คิดจาก "เวลาที่กดจริง" เท่านั้น — ไม่ส่ง nowHM เข้าไปโดยตั้งใจ
     กะที่ยังไม่กดออกจึงยังไม่มีตัวเลข OT เพราะตัวเลขที่เดินตามเวลาจริงบอกอะไรไม่ได้
     ลืมกดออกค้างไว้แล้วกลับบ้าน เลขก็จะวิ่งขึ้นเรื่อย ๆ จนกลายเป็นตัวเลขที่ไม่มีความหมาย */
  const earned = window.tmOtEarned(today, cfg);
  const left = Math.max(0, window.tmWhNorm(cfg).workMins - worked);
  /* ปิดวันแล้ว = กดเข้าไปแล้วและกดออกไปแล้ว เหลืออย่างเดียวที่ทำได้คือแก้เวลาออก
     ไม่โชว์ปุ่มเข้างานค้างไว้ให้กด เพราะกดแล้วได้แต่ข้อความปฏิเสธ ซึ่งอ่านเหมือนระบบพัง */
  const closed = !open && !!(today && today.in && today.in.hm);
  const shifts = (today && Array.isArray(today.extra) ? today.extra : [])
    .filter((x) => x && x.in && x.in.hm);
  const jobPick = React.useMemo(
    () => (jobs || []).filter((j) => jobType === "all" || j.type === jobType).slice(0, 80),
    [jobs, jobType]);

  React.useEffect(() => {
    if (today && today.jobId) setJobId(today.jobId);
    if (today && today.place) setPlace(today.place);
  }, [today && today.jobId, today && today.place]);

  const go = async (redo) => {
    if (busy) return;
    setBusy(true); setMsg(null);
    const j = place === "office" ? null : (jobs || []).find((x) => x.id === jobId);
    const which = redo ? "out" : open ? "out" : "in";
    const res = await writer.punch(which, {
      src: "liff", place: place, jobId: j ? j.id : null, jobCode: j ? j.code : "", redo: !!redo,
    });
    setBusy(false);
    if (!res.ok) { setMsg({ bad: true, text: res.why }); return; }
    const p = res.punch || {};
    const head = redo ? "แก้เวลาออกงานเป็น " : open ? "ลงเวลาออกงาน " : "ลงเวลาเข้างาน ";
    setMsg({ bad: false, text: head + p.hm
      + (p.redoOf ? " (จากเดิม " + p.redoOf + ")" : "")
      + (p.err ? " · ไม่ได้พิกัด บันทึกไว้แล้วว่าไม่มี" : " · บันทึกพิกัดแล้ว") });
  };

  return (
    <div style={{ padding: 18 }}>
      <div style={{ padding: "18px 16px", borderRadius: 22, background: "var(--surface)",
        border: "1px solid var(--border)", boxShadow: "var(--soft)", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>{window.drDateTH(window.drToday())}</div>
        <div style={{ marginTop: 9, display: "flex", justifyContent: "center", gap: 26 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>เข้างาน</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800,
              color: today && today.in ? "var(--text-1)" : "var(--text-3)" }}>
              {(today && today.in && today.in.hm) || "--:--"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>ออกงาน</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800,
              color: today && today.out ? "var(--text-1)" : "var(--text-3)" }}>
              {(today && today.out && today.out.hm) || "--:--"}
            </div>
          </div>
        </div>
        {/* ── ทำงานแล้วกี่ชั่วโมง ──
            คำถามที่ช่างเปิดแอปมาถามบ่อยที่สุดคือ "เลิกได้กี่โมง" ไม่ใช่ "เข้ามากี่โมง"
            เวลาเลิกไม่ตายตัว เพราะนับ 8 ชม. + พัก 1 ชม. จากเวลาที่กดเข้าจริง */}
        {today && today.in && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--divider)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.1 }}>
              {window.tmDur(worked)}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>
              {open ? "ทำงานแล้ว · กำลังนับอยู่" : "ทำงานทั้งวัน"}
            </div>
            <div style={{ marginTop: 7, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>
              {open && left > 0
                ? <React.Fragment>ครบ {window.tmDur(window.tmWhNorm(cfg).workMins)} เวลา <b>{win.end}</b> · เหลืออีก {window.tmDur(left)}</React.Fragment>
                : <React.Fragment>ครบเวลางานปกติแล้วตั้งแต่ <b>{win.end}</b></React.Fragment>}
            </div>
            {/* OT ขึ้นตอนกดออกงาน ไม่ใช่ตอนนาฬิกาเดินเลยเวลาเลิก — ต้องบอกไว้
                ไม่งั้นช่างจะรอดูการ์ด OT ที่ไม่มีวันขึ้น แล้วคิดว่าระบบไม่นับ OT ให้ */}
            {open && left === 0 && (
              <div style={{ marginTop: 5, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                เลยเวลางานปกติมาแล้ว · กดออกงานก่อน แล้วค่อยขอ OT ตามเวลาที่กดจริง
              </div>
            )}
            {/* ใบเก่าที่มีกะซ้อน — การ์ดนี้เคยโชว์แค่คู่แรก ชั่วโมงรวมจึงไม่ตรงกับตัวเลขข้างบน
                โดยไม่มีอะไรบอก ระบบไม่เปิดกะใหม่แล้ว แต่ของเดิมต้องมองเห็นได้ */}
            {shifts.length > 0 && (
              <div style={{ marginTop: 7, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
                มีช่วงเวลาซ้อนในใบนี้อีก {shifts.length} ช่วง ·{" "}
                <span style={{ fontFamily: "var(--mono)" }}>
                  {shifts.map((x) => x.in.hm + "–" + ((x.out && x.out.hm) || "?")).join(", ")}
                </span>
                {" "}— รวมอยู่ในชั่วโมงข้างบนแล้ว ถ้าไม่ถูกต้องแจ้งออฟฟิศ
              </div>
            )}
            {win.late && (
              <div style={{ marginTop: 5, fontSize: 11.5, color: "#F59E0B", fontWeight: 700 }}>
                เข้างานหลัง {window.tmWhNorm(cfg).startLate} · สาย {window.tmDur(win.lateMins)} — เวลาเลิกเลื่อนตามจริง
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ทำเกินเวลาแล้ว ──
          ระบบไม่เปิดใบให้เอง ตั้งใจ — ทำเกินนิดหน่อยแล้วไม่ขอเป็นเรื่องปกติ
          ถ้าเปิดใบให้อัตโนมัติ คนอนุมัติจะเจอใบสามสิบใบทุกเช้าและเลิกอ่านทั้งกอง */}
      {earned.mins > 0 && (
        <div style={{ marginTop: 12, padding: "13px 15px", borderRadius: 18,
          background: "var(--tint-amber-bg)", border: "1px solid #F59E0B44" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--tint-amber-tx)" }}>ทำเกินเวลางานแล้ว</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 19, fontWeight: 800, color: "var(--tint-amber-tx)" }}>
              {window.tmDur(earned.mins)}
            </span>
          </div>
          <div style={{ marginTop: 3, fontFamily: "var(--mono)", fontSize: 12, color: "var(--tint-amber-tx)", opacity: .85 }}>
            {earned.from} – {earned.to}
          </div>
          {onAskOt && (
            /* ส่งช่วงเวลางานของวันนี้ไปด้วย — ฟอร์มต้องใช้ตัดส่วนที่ทับเวลางานปกติ
               และมีแต่ที่นี่ที่ถือใบลงเวลาอยู่ในมือ */
            <button onClick={() => onAskOt(Object.assign({}, earned, { win: win }))}
              style={{ marginTop: 10, width: "100%", padding: "12px 14px", borderRadius: 16, border: "none",
                background: "#F59E0B", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              ขอ OT ช่วงนี้
            </button>
          )}
          <div style={{ marginTop: 7, fontSize: 11, color: "var(--tint-amber-tx)", opacity: .8, lineHeight: 1.6 }}>
            จะขอหรือไม่ขอก็ได้ ระบบไม่เปิดใบให้เอง — ขอได้เฉพาะช่วงที่ทำเกินจริงตามเวลาที่ลงไว้
          </div>
        </div>
      )}

      {/* ── ลงเวลาที่ไหน ──
          ไม่ใช่ทุกคนอยู่หน้างาน คนที่เข้าออฟฟิศทั้งวันก็ต้องลงเวลา
          เลือกออฟฟิศแล้วไม่ต้องถามว่าไปงานไหน — ถามไปก็ไม่มีคำตอบที่ถูก */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>ลงเวลาที่ไหน</div>
        <div style={{ display: "flex", gap: 9 }}>
          {window.TM_PLACE.map((p) => (
            <button key={p.key} onClick={() => setPlace(p.key)}
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 10px", borderRadius: 18, cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: 800,
                border: "none", boxShadow: place === p.key ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
                background: place === p.key ? "var(--primary-soft)" : "var(--surface)",
                color: place === p.key ? "var(--primary-dark)" : "var(--text-2)" }}>
              <Icon name={p.icon} size={16} color={place === p.key ? "var(--primary-dark)" : "var(--text-3)"} />
              {p.th}
            </button>
          ))}
        </div>
      </div>

      {place !== "office" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>วันนี้ไปงานไหน (ไม่บังคับ)</div>
          {/* ชิปประเภทงาน — ตัดรายการใน select ให้สั้นลงก่อนหา
              ไม่ได้กรองใบลงเวลา — เลือกงานไหนก็บันทึกงานนั้น ชิปนี้แค่ช่วยหา */}
          <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
            {[{ key: "all", th: "ทั้งหมด" }].concat(window.SF.TYPES).map((t) => (
              <button key={t.key} onClick={() => {
                setJobType(t.key);
                /* งานที่เลือกค้างไว้หลุดจากรายการแล้วต้องล้าง ไม่งั้นจะค้างอยู่แบบมองไม่เห็น */
                const cur = (jobs || []).find((x) => x.id === jobId);
                if (cur && t.key !== "all" && cur.type !== t.key) setJobId("");
              }}
                style={{ flex: 1, padding: "8px 6px", borderRadius: 13, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 800,
                  border: "none", boxShadow: jobType === t.key ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
                  background: jobType === t.key ? "var(--primary-soft)" : "var(--surface)",
                  color: jobType === t.key ? "var(--primary-dark)" : "var(--text-2)" }}>
                {t.th}
              </button>
            ))}
          </div>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={LN_FIELD}>
            <option value="">— ไม่ระบุ —</option>
            {jobPick.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
          {jobPick.length === 0 && (
            <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)" }}>ไม่มีงานประเภทนี้ในมือ — ลงเวลาโดยไม่ระบุงานก็ได้</div>
          )}
        </div>
      )}

      {!closed && (
        <button onClick={() => go(false)} disabled={busy}
          style={Object.assign({}, LN_BTN, { marginTop: 14,
            background: busy ? "var(--surface3)" : open ? "#EF4444" : "var(--primary)",
            color: busy ? "var(--text-3)" : "#fff" })}>
          {busy ? "กำลังบันทึก…" : open ? "ลงเวลาออกงาน" : "ลงเวลาเข้างาน"}
        </button>
      )}

      {/* ── กดออกงานทับ ──
          กดออกเร็วไปเพราะนึกว่าจะกลับแล้วไม่ได้กลับ เป็นเรื่องที่เกิดทุกวัน
          กดเข้าใหม่จะกลายเป็นกะที่สอง ซึ่งไม่ใช่สิ่งที่เกิดขึ้นจริง — ต้องเขียนทับเวลาเดิม */}
      {closed && (
        <React.Fragment>
          <button onClick={() => go(true)} disabled={busy}
            style={Object.assign({}, LN_BTN, { marginTop: 14,
              background: busy ? "var(--surface3)" : "var(--surface)",
              color: busy ? "var(--text-3)" : "var(--text-1)",
              border: "1px solid var(--border-strong)" })}>
            {busy ? "กำลังบันทึก…" : "กดออกงานใหม่ · ทับเวลาเดิม"}
          </button>
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
            วันนี้ลงเวลาครบแล้ว · กดออกเร็วไปกดทับได้เลย ไม่เปิดรอบใหม่
            <br />เวลาเข้างานแก้ไม่ได้ ต้องแจ้งออฟฟิศ
          </div>
        </React.Fragment>
      )}

      {msg && (
        <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: 16, fontSize: 13, fontWeight: 700, textAlign: "center",
          background: msg.bad ? "var(--tint-amber-bg)" : "var(--primary-soft)",
          color: msg.bad ? "var(--tint-amber-tx)" : "var(--primary-dark)" }}>{msg.text}</div>
      )}

      {/* ข้อความนี้ไม่ใช่คำโฆษณา — ช่างต้องรู้ล่วงหน้าว่าระบบเก็บพิกัด
          และต้องไม่เข้าใจผิดว่าระบบตรวจว่าอยู่หน้างานจริงหรือไม่ (ยังไม่มีพิกัดไซต์ที่เชื่อถือได้) */}
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
        ระบบขอพิกัดตอนกด — ถ้าไม่ได้ ก็ลงเวลาให้ตามปกติแล้วบันทึกไว้ว่าไม่มีพิกัด
        {/* บรรทัดเรื่อง "งานที่เลือก" ขึ้นเฉพาะตอนอยู่โหมดหน้างาน
            โหมดออฟฟิศไม่มีช่องเลือกงานให้กรอก คำเตือนเรื่องงานจึงเป็นตัวหนังสือที่ไม่มีที่อ้างถึง */}
        {place === "site" && <React.Fragment><br />งานที่เลือกเป็นข้อมูลที่คุณแจ้งเอง ระบบไม่ได้ตรวจระยะทาง</React.Fragment>}
      </div>

      <LnClockCal rows={at.rows} cfg={cfg} ot={ot} onAskOt={onAskOt} />
    </div>
  );
}

/* ── ปฏิทินลงเวลาย้อนหลัง ──
   แทนรายการสิบบรรทัดเดิม — รายการตอบได้แค่ "สิบวันหลังสุดลงอะไรไว้"
   แต่คำถามจริงของช่างคือ "เดือนนี้วันไหนที่ยังไม่ได้ลง" ซึ่งต้องเห็นทั้งเดือนพร้อมกันถึงจะตอบได้
   ── กติกาจุด ──
   เขียว  = ลงเข้า-ออกครบ
   เหลือง = ลงเข้าแล้วลืมลงออก
   แดง    = วันทำงานที่ผ่านมาแล้วแต่ไม่มีใบเลย (วันหยุดไม่ขึ้นแดง ใช้ tmIsWorkday ตัดสิน
            ซึ่งดูทั้งวันทำงานประจำสัปดาห์และวันหยุดที่บริษัทประกาศ — วันข้างหน้าก็ไม่ขึ้น)
   น้ำเงิน = วันนั้นมีใบขอ OT ที่ยังไม่ถูกยกเลิก/ปัดตก
   วันที่มีใบ OT ขึ้นน้ำเงินจุดเดียว ไม่ขึ้นจุดลงเวลาซ้อน — สองจุดในช่องแคบ ๆ อ่านเป็นจุดเบลอ มากกว่าสองเรื่อง
   สถานะลงเวลาของวันนั้นไม่หาย — แตะวันที่แล้วบรรทัดล่างบอกครบทั้งเวลาเข้าออกและชั่วโมง OT
   เขียนด้วยสไตล์ในบรรทัด ไม่ใช้คลาส .ov-cal ของหน้าเว็บ เพราะ liff.html ไม่ได้โหลด CSS ก้อนนั้น */
const LN_MON_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const lnCalDateTH = (iso) => {
  const a = String(iso || "").split("-");
  if (a.length !== 3) return iso || "";
  return +a[2] + " " + LN_MON_TH[+a[1] - 1] + " " + (+a[0] + 543);
};

/* คืนรายการสีจุดของวันหนึ่ง — วันที่มีใบ OT เอาจุดน้ำเงินจุดเดียวพอ
   จุดสองสีในช่องกว้างสี่สิบพิกเซลอ่านเป็น "จุดเบลอ ๆ" มากกว่าอ่านเป็นสองเรื่อง
   สถานะลงเวลาของวันนั้นไม่ได้หายไปไหน — แตะวันที่แล้วบรรทัดล่างบอกครบทั้งเวลาเข้าออกและชั่วโมง OT */
function lnCalDots(k, rec, otg, today, cfg) {
  if (otg && otg.rows.length) return ["#2563EB"];
  if (rec && rec.in && rec.in.hm) return [rec.out && rec.out.hm ? "var(--primary)" : "#D97706"];
  if (k <= today && window.tmIsWorkday(k, cfg)) return ["#DC2626"];
  return [];
}

function LnClockCal({ rows, cfg, ot, onAskOt }) {
  const today = window.drToday();
  const [ym, setYm] = React.useState(today.slice(0, 7));
  const [pick, setPick] = React.useState(today);
  const byDay = React.useMemo(() => {
    const m = {};
    (rows || []).forEach((r) => { if (r && r.date) m[r.date] = r; });
    return m;
  }, [rows]);
  /* ใบที่ถูกยกเลิกหรือปัดตกไม่นับ — จุดน้ำเงินต้องแปลว่า "วันนี้มีเรื่อง OT ค้างอยู่หรือได้แล้ว"
     ไม่ใช่ "เคยกดขอแล้วเรื่องจบไปนานแล้ว" ซึ่งอ่านบนปฏิทินไม่ออกว่าต่างกัน */
  const otDay = React.useMemo(() => {
    const m = {};
    (ot || []).forEach((r) => {
      if (!r || !r.date) return;
      if (r.status === "cancelled" || r.status === "rejected") return;
      const g = m[r.date] || (m[r.date] = { mins: 0, rows: [] });
      g.mins += +r.mins || 0;
      g.rows.push(r);
    });
    return m;
  }, [ot]);

  const y = +ym.slice(0, 4), mo = +ym.slice(5, 7);
  const days = new Date(y, mo, 0).getDate();
  const lead = new Date(y, mo - 1, 1).getDay();
  const shift = (n) => {
    const d = new Date(y, mo - 1 + n, 1);
    setYm(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };
  const key = (d) => ym + "-" + String(d).padStart(2, "0");
  const rec = byDay[pick];

  const otg = otDay[pick];
  const navBtn = {
    width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 12, cursor: "pointer",
    border: "1px solid var(--border)", background: "var(--surface)", padding: 0,
  };

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>ย้อนหลัง</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7 }}>
          <button onClick={() => shift(-1)} aria-label="เดือนก่อนหน้า" style={navBtn}>
            <Icon name="chevronLeft" size={15} color="var(--text-2)" />
          </button>
          <b style={{ fontSize: 12.5, color: "var(--text-1)", minWidth: 96, textAlign: "center" }}>{LN_MON_TH[mo - 1]} {y + 543}</b>
          <button onClick={() => shift(1)} aria-label="เดือนถัดไป" style={navBtn}>
            <Icon name="chevronRight" size={15} color="var(--text-2)" />
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", boxShadow: "var(--soft)", borderRadius: 18, overflow: "hidden", background: "var(--surface)", padding: "12px 10px 10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <span key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--text-3)", padding: "2px 0 6px" }}>{d}</span>
          ))}
          {Array.from({ length: lead }).map((_, i) => <span key={"p" + i} />)}
          {Array.from({ length: days }).map((_, i) => {
            const d = i + 1, k = key(d), r = byDay[k];
            const on = k === pick, isToday = k === today;
            return (
              <button key={k} onClick={() => setPick(k)}
                style={{ position: "relative", padding: "7px 0 13px", borderRadius: 12, cursor: "pointer",
                  border: "none", boxShadow: isToday && !on ? "inset 0 0 0 1px var(--primary)" : "none",
                  background: on ? "var(--primary)" : "transparent",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: on || isToday ? 800 : 600,
                  color: on ? "#fff" : r ? "var(--text-1)" : "var(--text-3)" }}>
                {d}
                <span style={{ position: "absolute", left: 0, right: 0, bottom: 5, display: "flex",
                  justifyContent: "center", gap: 3, pointerEvents: "none" }}>
                  {lnCalDots(k, r, otDay[k], today, cfg).map((c, n) => (
                    <i key={n} style={{ width: 5, height: 5, borderRadius: 99, background: on ? "#fff" : c }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 24 }}>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{lnCalDateTH(pick)}</span>
            {rec ? (
              <React.Fragment>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                  {(rec.in && rec.in.hm) || "—"} → {(rec.out && rec.out.hm) || "—"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>
                  {window.tmDur(window.tmWorkedMins(rec, cfg))}
                </span>
              </React.Fragment>
            ) : (
              <span style={{ marginLeft: "auto", fontSize: 11.5,
                color: pick <= today && window.tmIsWorkday(pick, cfg) ? "#DC2626" : "var(--text-3)" }}>
                {pick > today ? "ยังไม่ถึงวัน" : window.tmIsWorkday(pick, cfg) ? "ไม่ได้ลงเวลา" : "วันหยุด"}
              </span>
            )}
          </div>

          {/* ขอ OT ไปกี่ชั่วโมง — รวมทุกใบของวันนั้น และบอกสถานะเมื่อมีใบเดียว
              หลายใบไม่บอกสถานะ เพราะสองใบคนละสถานะจะสรุปเป็นคำเดียวไม่ได้โดยไม่โกหก */}
          {otg && (
            <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 7 }}>
              <i style={{ width: 6, height: 6, borderRadius: 99, background: "#2563EB" }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#2563EB" }}>
                ขอ OT {window.tmDur(otg.mins)}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                {otg.rows.length > 1
                  ? otg.rows.length + " ใบ"
                  : window.tmOtStatusOf(otg.rows[0].status).th}
              </span>
            </div>
          )}

          {/* กดขอ OT ของวันที่เลือกได้จากตรงนี้เลย — ปกติต้องเลื่อนลงไปกดปุ่ม "+ ขอ OT"
              แล้วเปลี่ยนวันในฟอร์มอีกที ซึ่งเป็นจังหวะที่คนกรอกวันผิดบ่อยที่สุด */}
          {onAskOt && (
            <button onClick={() => onAskOt({ date: pick })}
              style={{ marginTop: 9, width: "100%", padding: "10px 0", borderRadius: 14, cursor: "pointer",
                border: "1px solid var(--border)", background: "var(--surface2)",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>
              + ขอ OT วันที่ {lnCalDateTH(pick)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ใบขอ OT บนมือถือ ──
   ฟอร์มสั้นที่สุดที่ยังมีความหมาย: วัน · ตั้งแต่-ถึง · เหตุผล
   ประเภท (ปกติ/วันหยุด/กลางคืน) เดาให้จากวันและเวลา ไม่ถาม —
   ช่างไม่ควรต้องจำว่าระเบียบบริษัทนับ "กลางคืน" เริ่มกี่โมง */
function LnOtForm({ me, users, cfg, jobs, otStore, limit, onClose }) {
  /* limit = ช่วงที่ทำเกินจริงจากใบลงเวลาวันนี้ (tmOtEarned) — ส่งมาเมื่อกดจากการ์ดลงเวลา
     มาทางนี้แล้ววันที่ล็อกและเวลาถูกตรึงอยู่ในช่วงที่อยู่ที่ทำงานจริง
     เปิดฟอร์มเปล่าจากปุ่ม "+ ขอ OT" ยังกรอกอิสระได้เหมือนเดิม */
  const locked = !!(limit && limit.has && limit.mins > 0);
  const [f, setF] = React.useState(() => {
    const b = window.tmOtBlank(me, users, otStore.rows, null, cfg);
    /* กดมาจากปฏิทินจะส่งมาแค่ { date } — ตั้งวันให้ตามที่เลือก แต่ไม่ล็อกช่วงเวลา
       เพราะยังไม่รู้ว่าวันนั้นทำเกินจริงช่วงไหน (มีแต่วันที่กดจากใบลงเวลาวันนี้ถึงจะรู้) */
    if (!locked) return limit && limit.date
      ? Object.assign(b, { date: limit.date, kind: window.tmOtKindGuess(limit.date, b.from, cfg),
          rate: window.tmOtRate(window.tmOtKindGuess(limit.date, b.from, cfg), cfg) })
      : b;
    return Object.assign(b, { date: limit.date || b.date, from: limit.from, to: limit.to,
      kind: window.tmOtKindGuess(limit.date || b.date, limit.from, cfg) });
  });
  const [sending, setSending] = React.useState(false);

  const set = (k, v) => setF((p) => {
    const n = Object.assign({}, p, { [k]: v });
    if (k === "date" || k === "from") n.kind = window.tmOtKindGuess(n.date, n.from, cfg);
    return n;
  });

  /* ตัดช่วงที่ทับเวลางานปกติออกโดยอิงเวลาเข้างานจริงของวันนี้ ไม่ใช่เวลามาตรฐาน
     เข้า 09:30 ก็ต้องเลิก 18:30 — ใช้เวลามาตรฐานจะนับ 17:30-18:30 เป็น OT ทั้งที่ยังไม่ครบ 8 ชม. */
  const win = locked && f.date === limit.date ? limit.win : null;
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg, win);
  const inLimit = window.tmOtInLimit(f.date, f.from, f.to, limit);
  const approvers = React.useMemo(() => window.tmOtApprovers(users, me), [users, me]);
  const ready = mins > 0 && inLimit && !!f.reason.trim();

  const send = () => {
    if (!ready || sending) return;
    setSending(true);
    const j = (jobs || []).find((x) => x.id === f.jobId);
    const rec = window.tmOtMove(Object.assign({}, f, { mins, jobCode: j ? j.code : "" }), "sent", me, "");
    otStore.save(rec);
    const when = window.drShort(rec.date) + " " + rec.from + "-" + rec.to;
    /* เตือนคนอนุมัติ — ถ้าโปรไฟล์ไม่ได้ตั้งผู้อนุมัติไว้ ส่งเข้ากองกลางแทน
       (กฎเดียวกับหน้าเดสก์ท็อป ใบต้องไม่ค้างเงียบรอคนที่ไม่มีอยู่จริง) */
    if (rec.approverId) {
      window.tmNotify({ toUserId: rec.approverId, title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins) });
    } else {
      window.tmNotify({ toPerm: "otApprove", title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins) });
    }
    onClose();
  };

  return (
    <div style={LN_SHEET}>
      <LnSheetHead title="ขอทำงานล่วงเวลา" no={f.no} onClose={onClose} />

      <div style={{ padding: "2px 16px 22px", display: "grid", gap: 14 }}>
        <LnField label="วันที่">
          <input type="date" value={f.date} disabled={locked} onChange={(e) => set("date", e.target.value)}
            style={Object.assign({}, LN_FIELD, locked ? { background: "var(--surface3)", color: "var(--text-2)", boxShadow: "none" } : null)} />
        </LnField>

        {/* ── ช่วงเวลา ──
            เดิมเป็นสองคอลัมน์ คอลัมน์ละหัวข้อ ("ตั้งแต่" / "ถึง") ซึ่งบนไอโฟนคำว่า "ถึง"
            ไปยืนชิดขอบขวาของช่องแรกจนดูเหมือนช่องซ้อนกัน — ช่อง input[type=time] ของ iOS
            มีความกว้างขั้นต่ำในตัวที่กว้างกว่าที่เราสั่ง มันจึงล้นรางของตัวเองไปทับรางถัดไป
            (บนคอมไม่เห็นอาการ เพราะ Chrome ยอมหดช่องตามที่สั่ง)

            ย้าย "ถึง" มาอยู่ใน "ราง auto" ระหว่างสองช่อง แทนที่จะเป็นหัวข้อของช่องที่สอง
            คำนี้จึงมีที่ยืนของตัวเองเสมอ ต่อให้ช่องโตเกินที่สั่งก็ไม่มีอะไรมาทับ
            และยังอ่านเป็นประโยคเดียว "17:00 ถึง 20:00" ซึ่งตรงกับที่คนพูดจริง */}
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={LN_LABEL}>ช่วงเวลาที่ทำ</span>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", gap: 9, alignItems: "center" }}>
            <window.PgTime value={f.from} min={locked ? limit.lo : undefined} max={locked ? limit.hi : undefined}
              ariaLabel="ตั้งแต่" onChange={(t) => set("from", t)} style={LN_FIELD} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <window.PgTime value={f.to} min={locked ? limit.lo : undefined} max={locked ? limit.hi : undefined}
              ariaLabel="ถึง" onChange={(t) => set("to", t)} style={LN_FIELD} />
          </div>
        </div>

        {/* min/max ของ input[type=time] เป็นแค่คำแนะนำ เบราว์เซอร์ไม่ได้กันทุกตัว
            ตัวที่กันจริงคือ tmOtInLimit ที่ปิดปุ่มส่ง — บรรทัดนี้บอกว่าทำไมถึงกด */}
        {locked && (
          <div style={{ padding: "11px 14px", borderRadius: 16, fontSize: 11.5, lineHeight: 1.7,
            border: "none",
            background: inLimit ? "var(--surface)" : "var(--tint-amber-bg)",
            boxShadow: inLimit ? "var(--soft)" : "none",
            color: inLimit ? "var(--text-3)" : "var(--tint-amber-tx)" }}>
            {inLimit
              ? "ขอได้เฉพาะช่วงที่อยู่ที่ทำงานจริงวันนี้ — ลงเวลา " + limit.lo + " ถึง " + limit.hi
              : "ช่วงนี้อยู่นอกเวลาที่ลงไว้ (" + limit.lo + " – " + limit.hi + ") ขอไม่ได้"}
          </div>
        )}

        {/* ยอด OT ที่นับได้ — เป็นผลลัพธ์ ไม่ใช่ช่องกรอก จึงเป็นการ์ดเต็มใบ ไม่มีป้ายกำกับแบบช่องอื่น */}
        <div style={Object.assign({ padding: "13px 15px" }, LN_CARD)}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็น OT</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800,
              color: mins ? "var(--primary-dark)" : "var(--text-3)" }}>{window.tmDur(mins)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {window.tmOtKindOf(f.kind).th}
            {window.tmIsWorkday(f.date, cfg) ? " · ตัดช่วงที่ทับเวลางานปกติออกแล้ว" : " · นอกวันทำงาน นับทั้งช่วง"}
          </div>
        </div>

        <LnField label="งานที่เกี่ยวข้อง (ไม่บังคับ)">
          <select value={f.jobId || ""} onChange={(e) => set("jobId", e.target.value || null)} style={LN_FIELD}>
            <option value="">— ไม่ระบุ —</option>
            {(jobs || []).slice(0, 80).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
        </LnField>

        {/* ── ส่งให้ใครอนุมัติ ──
            เดิมใบไปตามสายอนุมัติในโปรไฟล์ ซึ่งหลายคนยังไม่ได้ตั้ง ใบจึงเข้ากองกลาง
            แล้วก็ค้างเพราะไม่มีใครรู้สึกว่าเป็นหน้าที่ตัวเอง — ถามตรงนี้ให้จบ */}
        <LnField label="ส่งให้ใครอนุมัติ">
          <select value={f.approverId || ""}
            onChange={(e) => {
              const u = approvers.find((x) => x.id === e.target.value);
              setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
            }} style={LN_FIELD}>
            <option value="">— ใครก็ได้ที่มีสิทธิ์ —</option>
            {approvers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </LnField>

        <LnField label="เหตุผล" req>
          <textarea rows={3} value={f.reason} onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ต้องปิดงานให้ทันก่อนการไฟฟ้าเข้าตรวจพรุ่งนี้เช้า"
            style={Object.assign({}, LN_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
        </LnField>

        <button onClick={send} disabled={!ready || sending}
          style={Object.assign({}, LN_BTN, {
            marginTop: 2,
            background: ready && !sending ? "var(--primary)" : "var(--surface3)",
            boxShadow: ready && !sending ? "0 8px 20px rgba(27,155,117,.28)" : "none",
            color: ready && !sending ? "#fff" : "var(--text-3)" })}>
          {sending ? "กำลังส่ง…" : "ส่งขออนุมัติ"}
        </button>

        {mins <= 0 && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.7 }}>
            ช่วงเวลานี้ยังไม่นับเป็น OT — ต้องอยู่นอกเวลางานปกติ และนานพอตามที่บริษัทตั้งไว้
            {win ? " (วันนี้เวลางานปกติจบ " + win.end + " เพราะเข้างาน " + limit.lo + ")" : ""}
          </div>
        )}
        {mins > 0 && !f.reason.trim() && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.7 }}>
            ต้องกรอกเหตุผล — คนอนุมัติตัดสินจากบรรทัดนี้บรรทัดเดียว
          </div>
        )}
      </div>
    </div>
  );
}

/* ── แท็บ "เวลา" = ลงเวลา + ใบ OT ของฉัน ── */
function LnTimeTab({ me, users, role, jobs, startOt, startSub }) {
  const wh = window.useWorkHours();
  const otStore = window.useOtClaims();
  /* เปิดฟอร์มทันทีเมื่อมาจากปุ่ม "ขอ OT" บนเมนูล่าง — แต่ยังต้องผ่านสิทธิ์
     ลิงก์ไม่ใช่ใบอนุญาต ใครก็พิมพ์ ?tab=ot เองได้ */
  const [form, setForm] = React.useState(!!startOt && window.tmCanOt(role));
  /* ช่วงที่ทำเกินจริงของวันนี้ — มีค่าเมื่อเปิดฟอร์มจากปุ่มบนการ์ดลงเวลา
     ต้องล้างทุกครั้งที่ปิดฟอร์ม ไม่งั้นกด "+ ขอ OT" ครั้งถัดไปจะยังโดนล็อกอยู่ */
  const [limit, setLimit] = React.useState(null);
  const closeForm = () => { setForm(false); setLimit(null); };

  /* ── กล่องขาเข้าของคนอนุมัติใบ OT อยู่ในแท็บนี้ ไม่ใช่แท็บแยก ──
     ⚠ ไม่มีการ subscribe เพิ่มเลย — otStore ข้างบนคือโหนดเดียวกับที่รายการรออนุมัติใช้
       นี่คือเหตุผลหลักที่ย้ายมาอยู่ตรงนี้: ของอยู่ในมืออยู่แล้ว แค่ก่อนหน้านี้ไปเปิดซ้ำอีกแท็บ
     และคนอนุมัติมักอยากดูปฏิทินลงเวลาของวันนั้นก่อนตัดสิน ซึ่งอยู่หน้าเดียวกันแล้วตอนนี้ */
  const canApprOt = !!window.tmCanOtApprove && window.tmCanOtApprove(role);
  /* ใบลาใช้หัวข้อ "รออนุมัติ" เดียวกับใบ OT — คนอนุมัติเป็นคนกลุ่มเดียวกัน (หัวหน้า · HR) */
  const canApprLv = !!window.lvCanApprove && window.lvCanApprove(role);
  const canAppr = canApprOt || canApprLv;
  const lvStore = window.useLeaves();
  const lvTypes = window.useLeaveTypes().types;
  const canLeave = !!window.lvCanLeave && window.lvCanLeave(role);
  const [sub, setSub] = React.useState(startSub === "appr" && canAppr ? "appr" : startSub === "leave" ? "leave" : "mine");
  const apprN = React.useMemo(() => (!canApprOt ? 0 : (otStore.rows || []).filter((r) =>
    r && r.status === "sent" && window.tmOtApproveCheck(r, me, role).ok).length)
    + (!canApprLv ? 0 : (lvStore.rows || []).filter((r) =>
    r && r.status === "sent" && window.lvApproveCheck(r, me, role).ok).length),
    [canApprOt, canApprLv, otStore.rows, lvStore.rows, me, role]);

  const cancelOt = (r) => {
    const next = window.tmOtMove(r, "cancelled", me, "");
    if (!next) return;
    otStore.save(next);
    /* ใบที่ส่งไปแล้ว — คนอนุมัติต้องรู้ว่าไม่ต้องรออีก ใบที่ยังเป็นร่างไม่มีใครรอ ไม่ต้องเตือน */
    if (r.status === "sent" && r.approverId) {
      window.tmNotify({ toUserId: r.approverId, title: "ยกเลิกใบขอ OT · " + r.no,
        body: r.userName + " · " + window.drShort(r.date) + " " + r.from + "-" + r.to + " · ไม่ต้องพิจารณาแล้ว" });
    }
  };

  /* กรองที่ชั้นข้อมูล ไม่ใช่แค่ซ่อนบนหน้าจอ — ใบ OT ของคนอื่นไม่ใช่เรื่องของคนนี้ */
  const myOt = React.useMemo(
    () => (otStore.rows || []).filter((r) => r && r.userId === (me || {}).id),
    [otStore.rows, me]);

  return (
    <React.Fragment>
      <LnSub items={[{ key: "mine", th: "ลงเวลา" }, canLeave && window.LnLeavePanel ? { key: "leave", th: "การลา" } : null,
        canAppr ? { key: "appr", th: "รออนุมัติ", n: apprN } : null]}
        value={sub} onPick={setSub} />

      {sub === "appr" && canAppr
        ? (
          <React.Fragment>
            {canApprLv && window.LnApLeaveList && <window.LnApLeaveList me={me} role={role} store={lvStore} types={lvTypes} />}
            {canApprOt && (window.LnApOtList
              ? <window.LnApOtList me={me} role={role} store={otStore} />
              : <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>กำลังโหลด…</div>)}
            {!canApprOt && apprN === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ไม่มีใบลารออนุมัติ</div>}
          </React.Fragment>)
        : sub === "leave" && window.LnLeavePanel
        ? <window.LnLeavePanel me={me} users={users} role={role} cfg={wh.cfg} />
        : (
        <React.Fragment>
          {window.tmCanAttend(role)
            ? <LnClock me={me} cfg={wh.cfg} jobs={jobs} ot={myOt}
                onAskOt={window.tmCanOt(role) ? ((lim) => { setLimit(lim); setForm(true); }) : null} />
            : <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
                บัญชีนี้ยังไม่ได้เปิดสิทธิ์ลงเวลา
              </div>}

          {window.tmCanOt(role) && (
            <div style={{ padding: "0 14px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 4px 9px" }}>
                <b style={{ fontSize: 13, color: "var(--text-1)" }}>ใบขอ OT ของฉัน</b>
                <button onClick={() => { setLimit(null); setForm(true); }}
                  style={{ marginLeft: "auto", padding: "8px 15px", borderRadius: 99, border: "none",
                    background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 12.5,
                    fontWeight: 800, cursor: "pointer" }}>+ ขอ OT</button>
              </div>

              {myOt.length === 0
                ? <div style={Object.assign({ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }, LN_CARD)}>
                    ยังไม่มีใบขอ OT
                  </div>
                : myOt.slice(0, 15).map((r) => {
                    const st = window.tmOtStatusOf(r.status);
                    return (
                      <div key={r.id} style={Object.assign({ padding: "12px 14px", marginBottom: 10 }, LN_CARD)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                            {window.drShort(r.date)} · {r.from}-{r.to}
                          </span>
                          <span style={{ padding: "2px 8px", borderRadius: 99, background: st.color + "1A",
                            color: st.color, fontSize: 10.5, fontWeight: 800 }}>{st.th}</span>
                          <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 800,
                            color: "var(--text-1)" }}>{window.tmDur(r.mins)}</span>
                        </div>
                        {r.approverName && <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>ส่งถึง {r.approverName}</div>}
                        {r.reason && <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>{r.reason}</div>}
                        {r.decidedNote && <div style={{ marginTop: 3, fontSize: 11.5, color: st.color }}>“{r.decidedNote}”</div>}
                        {/* ยกเลิกได้เองตราบใดที่ยังไม่มีใครตัดสิน — ใบที่อนุมัติแล้วแตะไม่ได้
                            ยกเลิกไม่ใช่การลบ ใบยังอยู่ให้ตรวจย้อนหลังว่าเคยขอแล้วถอน */}
                        {window.tmOtOpen(r) && (
                          <button onClick={() => cancelOt(r)}
                            style={{ marginTop: 8, padding: "7px 13px", borderRadius: 12,
                              border: "1px solid var(--border-strong)", background: "var(--surface)",
                              color: "#EF4444", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            ยกเลิกใบนี้
                          </button>
                        )}
                      </div>
                    );
                  })}
            </div>
          )}
        </React.Fragment>
      )}

      {form && <LnOtForm me={me} users={users} cfg={wh.cfg} jobs={jobs} otStore={otStore}
        limit={limit} onClose={closeForm} />}
    </React.Fragment>
  );
}

/* ชื่อ LnChips ถูกใช้ไปแล้วใน liff-ec.js ซึ่งโหลดก่อนไฟล์นี้ — สคริปต์ชุดนี้ใช้ขอบเขตร่วมกัน
   ตั้งชื่อซ้ำ = ตัวหลังทับตัวหน้าเงียบ ๆ แล้วฟอร์มใบเบิกจะเพี้ยนโดยไม่มี error */
/* ── ปุ่มกรองทรงเม็ดยา ── ใช้ซ้ำทั้งแท็บงานและแท็บซ่อม */
function LnPick({ items, value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {items.map((it) => {
        const on = value === it.key;
        return (
          <button key={it.key} onClick={() => onPick(it.key)}
            style={{ padding: "7px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
              border: "none", boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
              background: on ? "var(--primary-soft)" : "var(--surface2)",
              color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
            {it.th}{it.n != null ? " " + it.n : ""}
          </button>
        );
      })}
    </div>
  );
}

/* ── ฟอร์มเปิดใบแจ้งซ่อมจากหน้างาน ──
   แยกเป็นคอมโพเนนต์ลูกโดยตั้งใจ เพื่อให้ useOmSites ทำงานเฉพาะตอนเปิดฟอร์ม
   ไม่ใช่ทุกครั้งที่เข้าแท็บซ่อม — คนส่วนใหญ่เข้ามาดูใบของตัวเอง ไม่ได้เปิดใบใหม่

   กรอกแค่สิ่งที่คนยืนอยู่หน้างานรู้จริง: ไซต์ไหน · อาการอะไร · ด่วนแค่ไหน
   เรื่องประกัน/ค่าบริการและใบเสนอราคาปล่อยเป็น "ยังไม่ได้ตัดสิน" ไว้ให้ออฟฟิศ
   เพราะคนหน้างานตอบไม่ได้ และเดาผิดแล้วจะกลายเป็นคำสัญญากับลูกค้า */
function LnFixNew({ me, tickets, onSave, onClose }) {
  const siteStore = window.useOmSites();
  const [f, setF] = React.useState({ siteId: "", title: "", detail: "", category: "other", severity: "normal" });
  const set = (patch) => setF((o) => Object.assign({}, o, patch));
  /* งานบ้านกับงานโครงการอยู่คนละโลก ทั้งคนที่ต้องคุยด้วยและของที่ต้องเตรียม
     ทะเบียนไซต์ยาวเป็นยี่สิบกว่ารายการในช่องเดียว เลื่อนหาบนมือถือกลางแดดคือทางที่กดผิดไซต์ */
  const [siteType, setSiteType] = React.useState("all");

  const sites = React.useMemo(() => (siteStore.sites || [])
    .filter((x) => siteType === "all" || (x.type || "home") === siteType)
    .slice().sort((a, b) =>
    String(a.name || a.code || "").localeCompare(String(b.name || b.code || ""), "th")), [siteStore.sites, siteType]);
  const site = sites.filter((x) => x.id === f.siteId)[0] || null;
  const ready = !!site && !!f.title.trim();

  const submit = () => {
    if (!ready) return;
    const rec = window.omBlankTicket(site, tickets || [], me);
    rec.title = f.title.trim();
    rec.detail = f.detail.trim();
    rec.category = f.category;
    rec.severity = f.severity;
    /* เปิดจากไลน์ = คนของเราเป็นคนเจอเอง ไม่ใช่ลูกค้าโทรเข้าออฟฟิศ */
    rec.source = "onsite";
    /* คนเปิดใบรับไปก่อนจนกว่าออฟฟิศจะเปลี่ยนตัว — ถ้าปล่อยผู้รับผิดชอบว่างไว้
       ใบจะไม่ขึ้นในรายการของใครเลยบนมือถือ (รายการกรองด้วยผู้รับผิดชอบ/ช่างประจำไซต์) */
    rec.assigneeId = (me || {}).id || null;
    rec.assigneeName = (me || {}).name || "";
    if (!rec.techId) rec.techId = (me || {}).techId || "";
    onSave(rec);
  };

  const field = { width: "100%", padding: "12px 13px", borderRadius: 16, border: "1px solid var(--border-strong)",
    background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none" };
  const label = { fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,43,51,.42)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "88dvh", overflowY: "auto", overflowX: "hidden", background: "var(--surface)",
          borderRadius: "26px 26px 0 0", padding: "16px 18px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 12 }}>เปิดใบแจ้งซ่อม</div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <span style={label}>ไซต์ที่เกิดเรื่อง</span>
            <LnPick items={[{ key: "all", th: "ทั้งหมด" }].concat(
                (window.SF.TYPES || []).map((t) => ({ key: t.key, th: t.th })))}
              value={siteType} onPick={(k) => { setSiteType(k); set({ siteId: "" }); }} />
            <select value={f.siteId} onChange={(e) => set({ siteId: e.target.value })} style={field}>
              <option value="">— เลือกไซต์ —</option>
              {sites.map((x) => <option key={x.id} value={x.id}>{(x.code || x.id) + " · " + (x.name || "")}</option>)}
            </select>
          </div>

          <label style={{ display: "grid", gap: 5 }}>
            <span style={label}>อาการที่เจอ</span>
            <input value={f.title} onChange={(e) => set({ title: e.target.value })}
              placeholder="เช่น อินเวอร์เตอร์ขึ้นรหัสผิดพลาด ไฟไม่เข้า" style={field} />
          </label>

          <label style={{ display: "grid", gap: 5 }}>
            <span style={label}>รายละเอียดเพิ่มเติม</span>
            <textarea value={f.detail} onChange={(e) => set({ detail: e.target.value })} rows={3}
              placeholder="ตอนไหน · เกิดถี่แค่ไหน · ลองทำอะไรไปแล้วบ้าง"
              style={Object.assign({}, field, { resize: "vertical", lineHeight: 1.6 })} />
          </label>

          <div style={{ display: "grid", gap: 6 }}>
            <span style={label}>ประเภท</span>
            <LnPick items={(window.OM_TICKET_CAT || []).map((c) => ({ key: c.key, th: c.th }))}
              value={f.category} onPick={(k) => set({ category: k })} />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <span style={label}>ความเร่งด่วน</span>
            <LnPick items={(window.OM_SEVERITY || []).map((x) => ({ key: x.key, th: x.th }))}
              value={f.severity} onPick={(k) => set({ severity: k })} />
            {/* ความเร่งด่วนไม่ใช่แค่ป้ายสี มันตั้งนาฬิกานับวันของใบนี้ ต้องบอกให้รู้ตอนเลือก */}
            <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
              ตั้งกำหนดปิดเคสให้เอง — {(window.OM_SEVERITY || []).map((x) =>
                x.th + " " + (window.OM_SLA_DAYS || {})[x.key] + " วัน").join(" · ")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "13px 14px", borderRadius: 14, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
              fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit} disabled={!ready}
            style={{ flex: 2, padding: "13px 14px", borderRadius: 14, border: "none",
              background: ready ? "var(--primary)" : "var(--border-strong)", color: "#fff",
              fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: ready ? "pointer" : "default" }}>
            เปิดใบนี้
          </button>
        </div>
        {!ready && (
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>
            {siteStore.loading ? "กำลังโหลดรายชื่อไซต์…"
              : sites.length === 0 ? (siteType === "all"
                  ? "ยังไม่มีไซต์ในทะเบียนบริการ — ต้องขึ้นทะเบียนไซต์ที่หน้า O&M บนเว็บก่อน"
                  : "ไม่มีไซต์ประเภทนี้ในทะเบียน — กด “ทั้งหมด” เพื่อดูทุกไซต์")
              : !site ? "เลือกไซต์ก่อน" : "เขียนอาการที่เจอก่อน"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── แท็บงานซ่อม ──
   อ่านใบแจ้งซ่อมจาก omTickets ชุดเดียวกับหน้า O&M บนเดสก์ท็อป และเดินสถานะ
   ด้วย omTicketNext/omTicketMove ตัวเดียวกัน — ไม่มีตรรกะสถานะชุดที่สองในไฟล์นี้ */
function LnFixTab({ me, role }) {
  const store = window.useOmTickets ? window.useOmTickets() : { tickets: [], loading: false, save: null };
  const [filter, setFilter] = React.useState("open");
  const [open, setOpen] = React.useState(null);
  const [newing, setNewing] = React.useState(false);
  const today = window.drToday();

  const canAll = window.can(role, "om");
  const uid = (me || {}).id || null;
  const tid = (me || {}).techId || null;

  /* ใบที่ "เป็นของคนนี้" — ผู้รับผิดชอบที่เลือกไว้ หรือช่างที่ผูกกับไซต์
     คนที่มีสิทธิ์ O&M เห็นได้ทั้งหมด แต่ตั้งต้นที่ใบของตัวเองเสมอ */
  const visible = React.useMemo(() => {
    const all = store.tickets || [];
    if (filter === "all" && canAll) return all;
    return all.filter((t) => t && ((uid && t.assigneeId === uid) || (tid && t.techId === tid)));
  }, [store.tickets, filter, canAll, uid, tid]);

  const list = React.useMemo(() => {
    if (filter === "done") return visible.filter((t) => !window.omTicketOpen(t));
    if (filter === "open") return visible.filter((t) => window.omTicketOpen(t));
    return visible;
  }, [visible, filter]);

  const mineOpen = (store.tickets || []).filter((t) =>
    window.omTicketOpen(t) && ((uid && t.assigneeId === uid) || (tid && t.techId === tid))).length;

  const chips = [{ key: "open", th: "ที่ต้องทำ", n: mineOpen }, { key: "done", th: "ปิดแล้ว" }];
  if (canAll) chips.push({ key: "all", th: "ทั้งบริษัท" });

  /* ปิดงาน = ต้องเขียนว่าแก้อะไรไป ไม่ใช่กดปิดเฉย ๆ
     ใบที่ปิดโดยไม่มีผลการแก้ไข ตอนลูกค้าโทรมาถามซ้ำอีกสามเดือนจะไม่มีใครตอบได้
     สถานะอื่นไม่บังคับ เพราะยังไม่จบเรื่อง เขียนตอนปิดทีเดียวพอ */
  const move = (t, to, note) => {
    const next = window.omTicketMove(t, to, me, note || "");
    if (!next || !store.save) return;
    if (to === "closed") next.result = note || "";
    store.save(next);
    setOpen(next);
  };

  /* เปิดใบเสร็จแล้วเด้งเข้าใบนั้นเลย เพื่อให้เห็นกับตาว่าใบถูกสร้างจริงและอยู่สถานะไหน
     และสลับไปกรอง "ที่ต้องทำ" ไม่งั้นใบใหม่จะไม่โผล่ถ้าค้างอยู่ที่ "ปิดแล้ว" */
  const create = (rec) => {
    if (!store.save) return;
    store.save(rec);
    setNewing(false);
    setFilter("open");
    setOpen(rec);
  };

  if (store.loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>กำลังโหลด…</div>;

  return (
    <React.Fragment>
      <div style={{ padding: "0 18px 12px" }}>
        <LnPick items={chips} value={filter} onPick={setFilter} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "var(--text-3)" }}>
            {filter === "all" ? "ใบแจ้งซ่อมทั้งบริษัท" : "เฉพาะใบที่คุณรับผิดชอบ"} · {list.length} ใบ
          </div>
          {/* เจอของเสียตอนอยู่หน้างานต้องเปิดใบได้ทันที ไม่ใช่จำไว้แล้วมาเปิดตอนกลับออฟฟิศ
              ซึ่งแปลว่าหลายเรื่องหายไประหว่างทาง */}
          <button onClick={() => setNewing(true)}
            style={{ padding: "8px 14px", borderRadius: 99, border: "none", background: "var(--primary)",
              color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
              whiteSpace: "nowrap" }}>+ เปิดใบแจ้งซ่อม</button>
        </div>
      </div>

      {list.length === 0
        ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5, lineHeight: 1.7 }}>
            {filter === "done" ? "ยังไม่มีใบที่ปิดแล้ว" : "ไม่มีใบแจ้งซ่อมที่ค้างอยู่"}
            <br /><span style={{ fontSize: 12 }}>กด “เปิดใบแจ้งซ่อม” ได้เลยเมื่อเจอของเสียหน้างาน · ใบที่ออฟฟิศเปิดให้จะมาโผล่ที่นี่เมื่อระบุผู้รับผิดชอบเป็นคุณ</span>
          </div>
        : <div style={LN_LIST_PAD}>{list.map((t) => {
            const st = window.omTicketStatusOf(t.status);
            const sev = window.OM_SEVERITY_BY[t.severity] || {};
            const late = window.omTicketOverdue(t, today);
            return (
              <div key={t.id} onClick={() => setOpen(t)} style={lnCardBtn()}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{t.no || t.id}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 99, background: st.color + "1A", color: st.color,
                    fontSize: 10.5, fontWeight: 800 }}>{st.th}</span>
                  {late && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#EF4444" }}>เลย {late.over} วัน</span>}
                </div>
                <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>{t.title || "ไม่ได้ระบุอาการ"}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
                  {t.siteName || t.siteCode || "—"}
                  {sev.th ? " · " + sev.th : ""}
                  {t.apptDate ? " · นัด " + window.drShort(t.apptDate) : ""}
                </div>
              </div>
            );
          })}</div>}

      {open && <LnFixSheet t={open} role={role} onMove={move} onClose={() => setOpen(null)} />}
      {newing && <LnFixNew me={me} tickets={store.tickets} onSave={create} onClose={() => setNewing(false)} />}
    </React.Fragment>
  );
}

/* ── แผ่นรายละเอียดใบแจ้งซ่อม ── */
function LnFixSheet({ t, role, onMove, onClose }) {
  const [closing, setClosing] = React.useState(false);
  const [note, setNote] = React.useState("");
  /* ปิดงานสำเร็จแล้วต้องพับฟอร์มเอง — ปุ่ม "ปิดงานนี้" ที่ยังค้างอยู่อ่านเหมือนว่ายังไม่สำเร็จ */
  React.useEffect(() => { setClosing(false); setNote(""); }, [t.id, t.status]);
  const st = window.omTicketStatusOf(t.status);
  const sev = window.OM_SEVERITY_BY[t.severity] || {};
  const cat = window.OM_TICKET_CAT_BY[t.category] || {};
  const nexts = window.omTicketNext(t, role);
  const rows = [
    ["ไซต์", t.siteName || t.siteCode],
    ["อาการ", t.detail],
    ["ประเภท", cat.th],
    ["ความเร่งด่วน", sev.th],
    ["ความคุ้มครอง", window.omCoverTH(t.cover).th],
    ["ผู้รับผิดชอบ", t.assigneeName],
    ["วันนัด", t.apptDate ? window.drDateTH(t.apptDate) + (t.apptFrom ? " " + t.apptFrom + "-" + t.apptTo : "") : ""],
    ["แจ้งเมื่อ", t.reportedAt ? window.drDateTH(String(t.reportedAt).slice(0, 10)) : ""],
    ["ผลการแก้ไข", t.result],
  ].filter((r) => r[1]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,43,51,.42)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "88dvh", overflowY: "auto", overflowX: "hidden", background: "var(--surface)",
          borderRadius: "26px 26px 0 0", padding: "16px 18px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{t.no || t.id}</span>
          <span style={{ padding: "2px 9px", borderRadius: 99, background: st.color + "1A", color: st.color, fontSize: 11, fontWeight: 800 }}>{st.th}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", margin: "4px 0 12px" }}>{t.title || "ไม่ได้ระบุอาการ"}</div>

        <div style={{ border: "1px solid var(--border)", boxShadow: "var(--soft)", borderRadius: 18, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={r[0]} style={{ display: "flex", gap: 10, padding: "10px 13px",
              borderTop: i ? "1px solid var(--border)" : "none", background: i % 2 ? "var(--surface2)" : "var(--surface)" }}>
              <div style={{ flex: "0 0 104px", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{r[0]}</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-1)", lineHeight: 1.6, wordBreak: "break-word" }}>{r[1]}</div>
            </div>
          ))}
        </div>

        {/* ปุ่มสร้างจากตารางสถานะ ปุ่มที่ขึ้นจึงเป็นทางที่เดินได้จริงเสมอ
            ปิดงานจากหน้างานได้เลย ไม่ต้องรอกลับออฟฟิศ — แต่หมายเหตุ/รูปยังทำที่เว็บ */}
        {closing ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>แก้ไขอะไรไปบ้าง</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="เช่น เปลี่ยนเบรกเกอร์ DC ตัวที่ไหม้ · รีเซ็ตอินเวอร์เตอร์แล้วจ่ายไฟปกติ"
              style={{ width: "100%", padding: "12px 13px", borderRadius: 16, border: "1px solid var(--border-strong)",
                background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16,
                outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setClosing(false)}
                style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
                  fontWeight: 700, cursor: "pointer" }}>ย้อนกลับ</button>
              <button onClick={() => onMove(t, "closed", note.trim())} disabled={!note.trim()}
                style={{ flex: 2, padding: "12px 14px", borderRadius: 14, border: "none",
                  background: note.trim() ? "var(--primary)" : "var(--border-strong)", color: "#fff",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: note.trim() ? "pointer" : "default" }}>
                ปิดงานนี้
              </button>
            </div>
            {!note.trim() && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
              ต้องเขียนผลการแก้ไขก่อนถึงจะปิดได้ — ใบที่ปิดแล้วคือเอกสารที่ลูกค้ารับทราบ
            </div>}
          </div>
        ) : nexts.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {nexts.map((n) => (
              <button key={n.key} onClick={() => (n.key === "closed" ? setClosing(true) : onMove(t, n.key))}
                style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 14, border: "none",
                  background: n.key === "closed" ? "var(--primary)" : n.color, color: "#fff",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                {n.th}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose}
          style={{ marginTop: 10, width: "100%", padding: "12px 14px", borderRadius: 14,
            border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
            fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>ปิด</button>
      </div>
    </div>
  );
}

/* ================================================================
   LnApp — ตัวแอปทั้งหมดของหน้า LIFF
   ================================================================ */
function LnApp() {
  const auth  = window.useAuthStore();
  const store = window.useJobStore();
  const techStore = window.useTechStore();
  const notif = window.useNotifStore();
  const roleCfg = window.useRoleConfig();

  const [tab, setTab]   = React.useState(LN_START.tab);
  /* หัวข้อย่อยในแท็บงาน — งานติดตั้ง · งานซ่อม · รายงาน */
  const [jobSub, setJobSub] = React.useState(
    LN_JOB_SUB.some((x) => x.key === LN_START.sub) ? LN_START.sub : "list");
  const [meOpen, setMeOpen] = React.useState(!!LN_START.me);
  const [q, setQ]       = React.useState("");
  const [open, setOpen] = React.useState(null);
  const [jobType, setJobType] = React.useState("all");
  /* คนที่เห็นทั้งบริษัท (แอดมิน/หัวหน้า/ขาย) ตั้งต้นที่ "ของฉัน"
     เพราะเปิดในไลน์คือกำลังจะไปทำงาน ไม่ใช่กำลังนั่งตรวจงานคนอื่น
     คนที่สิทธิ์แคบอยู่แล้วไม่เห็นปุ่มนี้ — มันจะเป็นปุ่มที่กดแล้วไม่มีอะไรเปลี่ยน */
  const [onlyMine, setOnlyMine] = React.useState(true);

  const me    = auth.current;
  const role  = React.useMemo(() => (me ? window.userRoles(me) : []), [me]);
  const scope = React.useMemo(() => window.jobScopeOf(role), [role, roleCfg.rev]);

  /* งานที่คนนี้เห็นได้ — เงื่อนไขเดียวกับเว็บ ไม่ทำชุดที่สอง */
  const mine = React.useMemo(() => {
    if (!me) return [];
    return (store.jobs || []).filter((j) => window.jobInScope(j, scope, me));
  }, [store.jobs, scope, me]);

  /* ค้นหา — ใช้ jobMatchQ (store.jsx) ตัวเดียวกับเว็บเดสก์ท็อป
     จะได้ไม่เป็นคนละพฤติกรรมเวลาเพิ่มช่องที่ค้นได้ */
  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = mine;
    if (scope.all && onlyMine) base = base.filter((j) => window.jobIsMine(j, me));
    if (jobType !== "all") base = base.filter((j) => j.type === jobType);
    const hit = base.filter((j) => window.jobMatchQ(j, s));
    /* ยังไม่เสร็จขึ้นก่อน แล้วเรียงตามวันติดตั้งที่ใกล้ที่สุด — งานที่ต้องไปพรุ่งนี้ต้องอยู่บนสุด */
    return hit.slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0, bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return String(a.startDate || "9999").localeCompare(String(b.startDate || "9999"));
    });
  }, [mine, q, jobType, onlyMine, scope.all, me]);

  /* งานที่เอาไว้ "ลงมือทำกับมัน" — ลงเวลา · เขียนรายงาน · เบิกเงิน
     ต่างจากรายการในแท็บงานที่ไว้ค้นหาข้อมูล ตรงที่
     · ตัดงานที่ติดตั้งเสร็จแล้วออก — ไม่มีใครไปลงเวลาหรือเขียนรายงานให้งานที่ปิดไปแล้ว
       และงานเก่าที่ค้างอยู่ในลิสต์คือโอกาสกดผิดใบ ซึ่งรู้ตัวอีกทีตอนสิ้นเดือน
     · ยึดของตัวเองเสมอ ไม่ขึ้นกับปุ่ม "ทั้งบริษัท" ที่ใช้ตอนไล่ดูงานแทนคนอื่น */
  const work = React.useMemo(() => {
    if (!me) return [];
    return mine.filter((j) => j.stage !== "done" && window.jobIsMine(j, me));
  }, [mine, me]);

  /* งานสำหรับเขียนรายงานประจำวัน — แคบกว่า work อีกชั้น
     รายงานประจำวันคือบันทึกว่า "วันนี้ที่ไซต์ทำอะไรไป" ซึ่งมีความหมายเฉพาะตอน
     งานอยู่ในขั้น "ดำเนินการติดตั้ง" จริง ๆ งานที่ยังออกแบบ/ถอดของ/รอคิว
     ยังไม่มีใครไปยืนที่ไซต์ ใบที่เขียนให้งานพวกนั้นคือใบที่กดผิดงาน
     (ลงเวลากับเบิกเงินยังใช้ work เหมือนเดิม เพราะไปสำรวจหรือซื้อของก่อนเริ่มติดตั้งได้) */
  const siteWork = React.useMemo(() => work.filter((j) => j.stage === "install"), [work]);

  /* แจ้งเตือนของฉัน — เงื่อนไขเดียวกับ myNotifs ใน app.jsx เป๊ะ */
  const myNotifs = React.useMemo(() => {
    if (!me) return [];
    const tid = me.techId;
    return (notif.notifs || []).filter((n) =>
      (tid && n.toTechId === tid) || (n.toUserId === me.id) || (n.toPerm && window.can(role, n.toPerm)));
  }, [notif.notifs, me, role]);
  const unread = myNotifs.filter((n) => !n.read).length;

  if (auth.loading || store.loading) return <window.LnSplash text="กำลังโหลดข้อมูล…" />;
  if (!me) return <window.LnSplash tone="bad" text="บัญชีนี้ถูกระงับหรือถูกลบไปแล้ว" sub="ติดต่อแอดมินของบริษัท" />;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)",
      paddingBottom: "calc(" + (LN_TABBAR_H + LN_TABBAR_GAP * 2) + "px + env(safe-area-inset-bottom, 0px))" }}>
      <LnHead me={me} onMe={() => setMeOpen(true)} />

      {tab === "jobs" && (
        <React.Fragment>
          <LnSub items={LN_JOB_SUB} value={jobSub} onPick={setJobSub} />

          {jobSub === "list" && (
            <React.Fragment>
              {/* ไม่มีพื้นขาวและเส้นคั่นแล้ว — แถบค้นหาเป็นส่วนหนึ่งของพื้นหน้า ช่องกรอกเป็นของชิ้นเดียวที่ลอย */}
              <div style={{ padding: "0 18px 12px" }}>
                <input value={q} onChange={(e) => setQ(e.target.value)}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  placeholder="ค้นหา"
                  style={{ width: "100%", padding: "13px 15px", borderRadius: 18, border: "1px solid var(--border)",
                    boxShadow: "var(--soft)",
                    background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 15, outline: "none" }} />
                {/* แยกงานติดตั้งตามประเภท — งานบ้านกับงานโครงการทำกันคนละแบบ
                    ของที่ต้องเตรียมและคนที่ต้องคุยด้วยคนละชุด ปนกันแล้วไล่หายาก */}
                <div style={{ marginTop: 9 }}>
                  <LnPick items={[{ key: "all", th: "ทั้งหมด" }].concat(
                      (window.SF.TYPES || []).map((t) => ({ key: t.key, th: t.th })))}
                    value={jobType} onPick={setJobType} />
                </div>

                {scope.all && (
                  <div style={{ marginTop: 7 }}>
                    <LnPick items={[{ key: "mine", th: "ของฉัน" }, { key: "all", th: "ทั้งบริษัท" }]}
                      value={onlyMine ? "mine" : "all"} onPick={(k) => setOnlyMine(k === "mine")} />
                  </div>
                )}

                <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)" }}>
                  {(!scope.all || onlyMine) ? "เฉพาะงานที่คุณรับผิดชอบ" : "ทุกงานในระบบ"} · {list.length} งาน
                </div>
              </div>
              {list.length === 0
                ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5, lineHeight: 1.7 }}>
                    {q ? "ไม่พบงานที่ตรงกับคำค้น"
                      : jobType !== "all" ? "ไม่มีงานประเภทนี้ที่คุณรับผิดชอบ"
                      : "ยังไม่มีงานที่คุณรับผิดชอบ"}
                    {/* หน้าว่างเพราะยังไม่มีใครถูกระบุเป็นผู้รับผิดชอบ อ่านเหมือนระบบพัง
                        ต้องบอกให้ชัดว่าต้องไปแก้ที่ใบงาน ไม่ใช่ที่หน้านี้ */}
                    {!q && jobType === "all" && !scope.all && (
                      <div style={{ marginTop: 6, fontSize: 12 }}>
                        งานจะขึ้นที่นี่เมื่อออฟฟิศระบุคุณเป็นช่างหรือวิศวกรผู้รับผิดชอบในใบงาน
                      </div>
                    )}
                  </div>
                : <div style={LN_LIST_PAD}>{list.map((j) => <LnJobRow key={j.id} job={j} onOpen={setOpen} />)}</div>}
            </React.Fragment>
          )}

          {jobSub === "fix" && <LnFixTab me={me} role={role} />}

          {jobSub === "daily" && (
            <window.LnDailyTab me={me} role={role} jobs={siteWork} allJobs={mine} notify={notif.addNotif} />
          )}
        </React.Fragment>
      )}

      {tab === "time" && (
        <LnTimeTab me={me} users={auth.users} role={role} jobs={work}
          startOt={LN_START.ot} startSub={LN_START.sub} />
      )}

      {tab === "ec" && <window.LnEcTab me={me} users={auth.users} role={role} jobs={work} />}

      {tab === "bell" && (
        myNotifs.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ยังไม่มีแจ้งเตือน</div>
          : <React.Fragment>
            {/* ── อ่านทั้งหมด ──
                ⚠ ไม่เรียก notif.markAllRead(me.id) เพราะตัวนั้นจับเฉพาะใบที่จ่าหน้าถึงคนนี้ตรง ๆ
                  (toTechId / toUserId) แต่รายการนี้รวมใบที่ส่งถึง "ทุกคนที่มีสิทธิ์" (toPerm) ด้วย
                  กดแล้วจะยังเหลือค้างอยู่ทั้งที่บอกว่าอ่านหมดแล้ว — วนตามรายการที่เห็นจริงแทน
                ปุ่มหายไปเลยเมื่อไม่มีอะไรค้าง ดีกว่าโชว์ปุ่มจาง ๆ ที่กดแล้วไม่มีอะไรเกิดขึ้น */}
            {unread > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 11px" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>
                  ยังไม่ได้อ่าน {unread} เรื่อง
                </span>
                <button onClick={() => myNotifs.forEach((n) => { if (!n.read) notif.markRead(n.id); })}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap",
                    border: "1px solid var(--border)", boxShadow: "var(--soft)",
                    background: "var(--surface)", color: "var(--primary-dark)" }}>
                  <Icon name="check" size={14} color="var(--primary-dark)" />
                  อ่านทั้งหมด
                </button>
              </div>
            )}
            <div style={LN_LIST_PAD}>{myNotifs.map((n) => {
              const k = lnNotifKind(n);
              return (
                <div key={n.id} onClick={() => {
                    if (!n.read) notif.markRead(n.id);
                    /* เรื่องซ่อมพาไปหัวข้อซ่อม เรื่องงานพาไปใบงาน — แจ้งเตือนที่กดแล้วไม่ไปไหน
                       คือแจ้งเตือนที่อ่านแล้วต้องไปหาเองอยู่ดี */
                    if (n.type === "om") { setTab("jobs"); setJobSub("fix"); return; }
                    if (n.type === "ot" || n.type === "leave") { setTab("time"); return; }
                    if (n.type === "expense") { setTab("ec"); return; }
                    const j = (store.jobs || []).find((x) => x.id === n.jobId);
                    if (j) { setOpen(j); setTab("jobs"); setJobSub("list"); }
                  }}
                  style={Object.assign({ display: "flex", gap: 11, padding: "13px 14px", marginBottom: 10,
                    cursor: "pointer" }, LN_CARD, {
                    /* ยังไม่อ่าน = พื้นอ่อน ๆ สีของเรื่องนั้น อ่านแล้วเหลือแค่ไอคอนสี
                       เส้นขีดข้างซ้ายถูกตัดออก — บนการ์ดที่มุมมนใหญ่มันกลายเป็นเศษเส้นที่มุม */
                    background: n.read ? "var(--surface)" : k.color + "12",
                    border: "none", boxShadow: n.read ? "var(--shadow-sm)" : "inset 0 0 0 1px " + k.color + "33" })}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 99, display: "grid",
                    placeItems: "center", background: k.color + "1F" }}>
                    <Icon name={k.icon} size={16} color={k.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{n.title || "แจ้งเตือน"}</div>
                    {n.body && <div style={{ marginTop: 3, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{n.body}</div>}
                    <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ padding: "2px 8px", borderRadius: 99, background: k.color + "1A",
                        color: k.color, fontSize: 10.5, fontWeight: 800 }}>{k.th}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {n.at ? window.drShort(String(n.at).slice(0, 10)) + " " + String(n.at).slice(11, 16) : ""}
                      </span>
                      {!n.read && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 99, background: k.color }} />}
                    </div>
                  </div>
                </div>
              );
            })}</div>
          </React.Fragment>
      )}

      <LnJobSheet job={open} techs={techStore.techs} onClose={() => setOpen(null)} />
      {meOpen && <LnMeSheet me={me} onClose={() => setMeOpen(false)} />}

      <LnBellFab unread={unread} on={tab === "bell"}
        onClick={() => setTab(tab === "bell" ? "jobs" : "bell")} />
      {/* แถบล่างไม่ไฮไลต์อะไรเลยตอนเปิดหน้าแจ้งเตือน — ถูกแล้ว หน้านั้นไม่ใช่แท็บ
          กดปุ่มกระดิ่งซ้ำหรือกดแท็บไหนก็ได้เพื่อออก */}
      <LnTabs tab={tab} setTab={setTab} tabs={LN_TAB} />
    </div>
  );
}

Object.assign(window, { LN_NOTIF_KIND, LN_JOB_SUB, LN_CARD, LN_LIST_PAD, lnCardBtn, lnNotifKind, LnApp, LnJobRow, LnJobSheet, LnJobFiles, LnHead, LnTabs, LnSub, LnMeSheet, LnBellFab, LnClock, LnClockCal, LnOtForm, LnTimeTab, LnFixTab, LnFixSheet, LnFixNew, LnPick });
