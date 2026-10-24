/* ============================================================
   SolarFlow — บอร์ดรวมทั้งวงจร (FlowBoardView)

   เดิมงานหนึ่งใบต้องตามจากสามบอร์ดคนละหน้า (บอร์ดขาย · บอร์ดงาน · บอร์ดขออนุญาต)
   ที่หน้าตาเหมือนกันเป๊ะแต่ไม่คุยกัน — ไม่มีที่ไหนเห็นเส้นทางของลูกค้ารายเดียวต่อกันเป็นเส้นเดียว
   บอร์ดนี้เอามาต่อกันเป็น 3 ช่วง: ฝ่ายขาย → หน้างาน → เอกสาร

   ไม่มีการ์ดใหม่สักใบ — ใช้ KanbanCard / SalesCard / PermitCard ของเดิมทั้งหมด
   ที่เขียนใหม่คือ "เปลือกคอลัมน์" ซึ่งเดิมถูกคัดลอกไว้สามที่ รอบนี้ยุบเหลือตัวเดียว

   ตั้งชื่อ top-level ขึ้นต้นด้วย Fl/fl เพราะทุกไฟล์โหลดเป็นสคริปต์ธรรมดา
   (ชื่อระดับบนสุดอยู่ scope เดียวกันหมด ชนเมื่อไหร่ = ทั้งเว็บพัง)
   ============================================================ */

const FL_GRP_KEY = "pg-boardgroups";

const flReadCollapsed = () => {
  try { const v = JSON.parse(localStorage.getItem(FL_GRP_KEY) || "{}"); return v && typeof v === "object" ? v : {}; }
  catch (e) { return {}; }
};

/* ── เปลือกคอลัมน์ — ใช้ร่วมกันทั้งสามช่วง ──
   col = { key, th, color, soft } · dimmed = กำลังลากการ์ดที่วางที่นี่ไม่ได้ (หรี่ลงให้เห็นชัดว่าห้าม) */
function FlCol({ col, count, isOver, dimmed, sub, onDragOver, onDragLeave, onDrop, children }) {
  return (
    /* หน้าตาของรางอยู่ในคลาส .bd-col ใน index.html — ที่นี่เหลือแค่ค่าที่เปลี่ยนตามสถานะ
       (กำลังลากของมาวาง / ถูกหรี่) เท่านั้น */
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className="bd-col"
      style={{ width: 262, flexShrink: 0, display: "flex", flexDirection: "column",
        background: isOver ? col.soft : null, borderColor: isOver ? col.color : null,
        opacity: dimmed ? 0.5 : 1 }}>
      {/* หัวรางรับพื้นมาจากราง (background:inherit) จึงเปลี่ยนสีตามตอนลากของมาวางเองโดยไม่ต้องคำนวณซ้ำ */}
      <div className="hd">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: col.color, flexShrink: 0 }} />
            {/* ไม่ถ่างตัวอักษร — ชื่อขั้นเป็นภาษาไทย การถ่างจะดันสระกับวรรณยุกต์หลุดตำแหน่ง */}
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.th}</span>
          </span>
          <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.02em",
            color: count ? "var(--text-1)" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
        </div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{sub}</div>}
      </div>
      <div className="bd">
        {children}
        {count === 0 && <div className="empty">{isOver ? "วางที่นี่" : "ว่าง"}</div>}
      </div>
    </div>
  );
}

/* ── แถบหัวช่วง + โหมดพับ ──
   พับแล้วเหลือแท่งแคบแนวตั้ง ยังบอกชื่อช่วงกับจำนวนใบอยู่ จะได้รู้ว่าพับอะไรไว้ */
function FlGroup({ g, count, collapsed, onToggle, onAdd, addLabel, extra, children }) {
  if (collapsed) {
    return (
      <button onClick={onToggle} title={"กางช่วง " + g.th}
        style={{ width: 52, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          padding: "14px 0", borderRadius: "var(--r-card)", border: "none", background: "var(--surface2)",
          cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ transform: "rotate(-90deg)" }} />
        <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)",
          fontVariantNumeric: "tabular-nums" }}>{count}</span>
        <span style={{ writingMode: "vertical-rl", fontSize: 12, fontWeight: 700,
          color: "var(--text-2)", whiteSpace: "nowrap" }}>{g.th}</span>
        <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: g.color, marginTop: "auto" }} />
      </button>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, minHeight: 0 }}>
      {/* กดที่แถบหัวช่วงตรงไหนก็พับได้ ไม่ต้องเล็งปุ่มเล็ก ๆ ด้านขวา */}
      <div onClick={onToggle} title={"พับช่วง " + g.th}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 2px", cursor: "pointer" }}>
        {/* ปุ่มพับอยู่หัวแถว ไม่ใช่ปลายขวา — แถบหัวช่วงกว้างเท่าทุกคอลัมน์รวมกัน (พันกว่าพิกเซล)
            ปุ่มที่ปลายขวาจึงอยู่นอกจอเสมอจนกว่าจะเลื่อนบอร์ดไปจนสุด
            และตอนช่วงถูกพับอยู่ ปุ่มก็อยู่หัวคอลัมน์เหมือนกัน ตำแหน่งจะได้ไม่กระโดดไปมา
            ปุ่มอยู่ในแถบที่กดได้ทั้งแถบ ต้องหยุดคลิกไม่ให้ลอยขึ้นไปสั่งพับซ้ำ ไม่งั้นพับแล้วกางทันทีเหมือนกดไม่ติด */}
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={"พับช่วง " + g.th}
          style={{ width: 27, height: 27, borderRadius: "var(--r-pill)", border: "none",
            background: "var(--surface)", boxShadow: "var(--shadow-sm)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />
        </button>
        <span style={{ width: 8, height: 8, borderRadius: "var(--r-pill)", background: g.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-2)" }}>{g.th}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{count}</span>
        {/* ปุ่มเพิ่มของช่วงนั้น — ช่วงขายคือจุดเดียวที่สร้างลูกค้าใหม่ได้จากบอร์ด
            หัวหน้า/แอดมินไม่มีเมนู "งานขาย" ในแถบซ้าย (บอร์ดนี้แทนไปแล้ว) ถ้าไม่มีปุ่มตรงนี้
            ก็ไม่เหลือทางเปิดฟอร์มลูกค้าใหม่เลยเมื่อยังไม่มีการ์ดให้กด
            วางชิดชื่อช่วง ไม่ใช่ปลายขวา เพราะแถบหัวช่วงกว้างเท่าทุกคอลัมน์รวมกัน
            ปุ่มที่ปลายขวาจะเลื่อนพ้นจอไปตั้งแต่ยังไม่ทันเห็น */}
        {onAdd && (
          <button onClick={(e) => { e.stopPropagation(); onAdd(); }} title={((addLabel || "ลูกค้าใหม่").indexOf("เพิ่ม") === 0 ? addLabel : "เพิ่ม" + (addLabel || "ลูกค้าใหม่")) + " ในช่วง " + g.th}
            /* ต่อ "55"/"14" ท้ายรหัสสีได้เฉพาะสีที่เป็นเลขฐานสิบหก — ช่วงหน้างานใช้ var(--primary)
               ซึ่งต่อท้ายแล้วกลายเป็นค่าที่เบราว์เซอร์ทิ้งทั้งบรรทัด ปุ่มจึงโล่งไม่มีกรอบทั้งที่โค้ดสั่งไว้
               color-mix ผสมความจางให้เท่ากันทั้งสองแบบ ปุ่มทุกช่วงจึงหน้าตาชุดเดียวกัน */
            style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 24, padding: "0 10px",
              borderRadius: "var(--r-chip)", border: "1px solid color-mix(in srgb, " + g.color + " 33%, transparent)",
              background: "color-mix(in srgb, " + g.color + " 8%, transparent)", color: g.color,
              cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>
            <Icon name="plus" size={13} color={g.color} sw={2.6} /> {addLabel || "ลูกค้าใหม่"}
          </button>
        )}
        {extra}
        <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.hint}</span>
      </div>
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/* ── แคปซูลหัวช่วงฝ่ายขาย (FlSalesDock) ──
   ต้นแบบจากวิดีโอที่ผู้ใช้ส่ง: แถบแคปซูล กดแท็บแล้วตัวแคปซูลเองยืดออกเป็นแผง (ไม่ใช่หน้าต่างใหม่เด้งขึ้น)
   ปุ่มอื่นหดเหลือไอคอน เนื้อหาค่อย ๆ ชัดขึ้น ปิดแล้วหดกลับเป็นแคปซูลเท่าเดิม
   - กล่องจริงลอย (absolute) ทับคอลัมน์ ส่วนตัวกันที่ (placeholder) กว้างเท่าแคปซูลตอนปิดเสมอ → หัวช่วงไม่ขยับ
   - ลูกค้าใหม่/รูปสรุปแพ็คเกจเป็นปุ่มทำงานทันที (เปิดฟอร์ม/ป๊อปเดิม) · ถังขยะเป็นแท็บเดียวที่มีแผง
   - ลากการ์ดลูกค้ามาวางที่ปุ่มถังขยะยังได้เหมือนเดิม (trashDnD · trashSt มาจาก FlowBoardView)
   - ลบถาวรไม่ทำในแผง — ปุ่ม "เปิดทั้งหมด" ไป TrashModal ที่กั้นแอดมิน + รหัสผ่าน */
function FlSalesDock({ color, onNewLead, onPoster, trash, onRestore, onOpenAll, trashSt, trashDnD }) {
  /* open = ผู้ใช้สั่งเปิดอยู่ · mounted = แผงยังวาดอยู่ (ค้างไว้ระหว่างหดตอนปิด เนื้อหาจะได้ไม่หายก่อนแผงหด)
     ยืด/หดด้วย clip-path บนกล่องขนาดเต็ม ไม่เปลี่ยน width/height จริง — เบราว์เซอร์ไม่ต้องจัดหน้าใหม่ทุกเฟรม จึงลื่น
     (เดิมเปลี่ยนขนาดจริง + เบลอกระจก ผู้ใช้บอกไม่ smooth ต.ค. 2026) */
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const capRef = React.useRef(null), boxRef = React.useRef(null), animRef = React.useRef(null);
  const capW = React.useRef(0);
  const [phW, setPhW] = React.useState(0);   // ความกว้างที่กันไว้บนหัวช่วง = แคปซูลตอนปิด
  const n = trash ? trash.length : 0;
  const CAP_H = 30, PANEL_W = 340;
  // วัดแคปซูลเฉพาะตอนไม่มีแผง (ตอนมีแผง ปุ่มหดเหลือไอคอน) — ResizeObserver จับตอนปุ่มคลายตัวเสร็จด้วย
  const mountedRef = React.useRef(mounted);
  mountedRef.current = mounted;
  React.useLayoutEffect(() => {
    const cap = capRef.current;
    const measure = () => { if (cap && !mountedRef.current) { capW.current = cap.offsetWidth; setPhW(cap.offsetWidth); } };
    measure();
    if (!window.ResizeObserver || !cap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(cap);
    return () => ro.disconnect();
  }, []);
  const shut = (el) => "inset(0px " + Math.max(0, el.offsetWidth - capW.current) + "px " + Math.max(0, el.offsetHeight - CAP_H) + "px 0px round 15px)";
  const OPEN_CLIP = "inset(0px 0px 0px 0px round 18px)";
  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el || !mounted || !el.animate) { if (!open && mounted) setMounted(false); return; }
    const running = animRef.current && animRef.current.playState === "running";
    const from = running ? getComputedStyle(el).clipPath : (open ? shut(el) : OPEN_CLIP);
    if (animRef.current) animRef.current.cancel();
    const to = open ? OPEN_CLIP : shut(el);
    const an = el.animate([{ clipPath: from }, { clipPath: to }], open
      ? { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" }      // เปิด: พุ่งออกเร็วแล้วค่อย ๆ เข้าที่ แบบสปริงไม่เด้ง
      : { duration: 380, easing: "cubic-bezier(.4,0,.2,1)" });
    el.style.clipPath = to;
    animRef.current = an;
    if (!open) an.onfinish = () => { el.style.clipPath = ""; setMounted(false); };
  }, [open, mounted]);
  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", esc); };
  }, [open]);
  const toggle = () => { if (open) setOpen(false); else { setMounted(true); setOpen(true); } };

  /* แถบไฮไลต์ตามเมาส์ (วิดีโอต้นแบบที่ 2 ของผู้ใช้) — เม็ดเขียวอ่อนมีเงา วิ่งแบบหยดน้ำไปอยู่ใต้ปุ่มที่ชี้
     หยดน้ำ = ขอบด้านที่วิ่งไปยืดออกก่อน ขอบหลังไหลตาม (left/right คนละจังหวะ ตาม data-dir) + ถึงแล้วแบนเด้งนิด ๆ
     ออกจากแคปซูล = กลับไปค้างที่ปุ่มถังขยะถ้าแผงเปิดอยู่ ไม่งั้นจางหาย
     โผล่ครั้งแรก (จากที่ซ่อนอยู่) วางตรงปุ่มเลย ไม่ไถมาจากซ้ายสุด (snap) */
  const [hov, setHov] = React.useState(null);   // key ปุ่มที่ชี้อยู่
  const [hi, setHi] = React.useState(null);     // { x, w, r, dir, snap }
  const hiRef = React.useRef(null);
  const segRefs = React.useRef({});
  const target = hov || (open ? "trash" : null);
  const place = React.useCallback(() => {
    const el = target && segRefs.current[target];
    setHi((p) => {
      if (!el) return p ? Object.assign({}, p, { hidden: true }) : null;
      const snap = !p || p.hidden;
      const x = el.offsetLeft, w = el.offsetWidth, r = el.offsetParent ? el.offsetParent.clientWidth - x - w : 0;
      if (p && !snap && p.x === x && p.w === w && p.r === r) return p;
      return { x: x, w: w, r: r, dir: p && x < p.x ? "l" : "r", snap: snap, hidden: false };
    });
  }, [target]);
  React.useLayoutEffect(place, [place]);
  const hx = hi && !hi.snap && !hi.hidden ? hi.x : null;
  React.useEffect(() => {   // ถึงที่แล้วหยดแบนลงแล้วเด้งคืน
    const el = hiRef.current;
    if (hx == null || !el || !el.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    el.animate([{ transform: "scale(1,1)" }, { transform: "scale(1.04,.8)", offset: .4 }, { transform: "scale(.98,1.06)", offset: .72 }, { transform: "scale(1,1)" }],
      { duration: 620, easing: "ease-out" });
  }, [hx]);
  // ปุ่มหด/คลายตอนแผงเปิดปิด → ตำแหน่งปุ่มเลื่อน ให้เม็ดตามไปด้วย
  React.useEffect(() => {
    const cap = capRef.current;
    if (!cap || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => place());
    ro.observe(cap);
    return () => ro.disconnect();
  }, [place]);
  const stop = (e) => e.stopPropagation();   // หัวช่วงกดแล้วพับ — กดในแคปซูลต้องไม่พับ
  const seg = (key, icon, label, onClick, extra) => (
    <button ref={(el) => { segRefs.current[key] = el; }} className="fl-seg" data-on={key === "trash" && open ? "1" : null}
      data-hi={target === key ? "1" : null} onMouseEnter={() => setHov(key)}
      onClick={(e) => { stop(e); onClick(); }} {...(extra || {})}>
      <Icon name={icon} size={13} color="currentColor" sw={2.4} />
      <span className="fl-lbl">{label}</span>
    </button>
  );
  return (
    <div onClick={stop} className="fl-dock-ph" data-m={mounted ? "1" : null} style={{ position: "relative", flexShrink: 0, height: CAP_H, width: phW || "auto" }}>
      <div ref={boxRef} className="fl-dock" data-open={open ? "1" : null}
        style={{ "--dock-c": color, width: mounted ? PANEL_W : "auto" }}>
        <div ref={capRef} className="fl-cap" onMouseLeave={() => setHov(null)}>
          <span ref={hiRef} className="fl-hi" data-snap={hi && hi.snap ? "1" : null} data-dir={hi ? hi.dir : null}
            style={hi ? { left: hi.x, right: hi.r, opacity: hi.hidden ? 0 : 1 } : { opacity: 0 }} />
          {onNewLead && seg("new", "plus", "ลูกค้าใหม่", () => { setOpen(false); onNewLead(); }, { style: { color: color } })}
          {onPoster && seg("poster", "image", "รูปสรุปแพ็คเกจ", () => { setOpen(false); onPoster(); })}
          {trash && seg("trash", "trash", <React.Fragment>{trashSt === "over" ? "ปล่อยเพื่อทิ้ง" : "ถังขยะ"}{n ? <span className="fl-n">{n}</span> : null}</React.Fragment>,
            toggle,
            Object.assign({ "data-st": trashSt, "data-trash": "1", title: trashSt ? "ปล่อยเพื่อย้ายลงถังขยะ" : "ถังขยะ — ลากการ์ดลูกค้ามาวางเพื่อทิ้ง · กดเพื่อดู/กู้คืน" }, trashDnD))}
        </div>
        {mounted && (
          <div className="fl-body">
            <div style={{ padding: "4px 6px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 6px 8px" }}>
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{n ? n + " ราย · กู้คืนได้ตลอด" : ""}</span>
                {onOpenAll && n > 0 && <button onClick={() => { setOpen(false); onOpenAll(); }}
                  style={{ border: "none", background: "none", color: "var(--text-3)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  เปิดทั้งหมด / ลบถาวร</button>}
              </div>
              {n === 0 && <div style={{ padding: "18px 0 14px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ถังขยะว่าง — ลากการ์ดลูกค้ามาวางที่ปุ่มถังขยะเพื่อทิ้ง</div>}
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {(trash || []).map((l) => (
                  <div key={l.id} className="fl-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name || "(ไม่มีชื่อ)"}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {l.code}{l.deletedAt ? " · ลบ " + thDate(String(l.deletedAt).slice(0, 10), true) : ""}{l.deletedBy ? " โดย " + l.deletedBy : ""}
                      </div>
                    </div>
                    {onRestore && <button onClick={() => onRestore(l.id)} className="fl-restore">กู้คืน</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ช่วงที่ผู้ใช้คนนี้เห็น — ช่างไม่ต้องเห็นฝ่ายขาย ฝ่ายขายไม่ต้องเห็นคิวเอกสาร

   ถ้าเห็นช่วงเอกสาร คอลัมน์ "เสร็จสิ้น" จะถูกถอดออกจากช่วงหน้างาน แล้วงานที่ติดตั้งเสร็จ
   ไปต่อในช่วงเอกสารจนจบที่ "การไฟฟ้าอนุมัติแล้ว" — การ์ดหนึ่งใบมีบ้านเดียวเสมอ ไม่โผล่ซ้ำสองที่
   ถ้าไม่เห็นช่วงเอกสาร (ช่าง/วิศวกร) "เสร็จสิ้น" ต้องอยู่ครบ ไม่งั้นงานหายไปจากบอร์ดเขาเฉย ๆ */
function flGroups(role) {
  const out = [];
  const doc = window.can(role, "permit");
  if (window.can(role, "leads")) out.push({ key: "sales", th: "ฝ่ายขาย", color: "#8B5CF6", kind: "lead",
    hint: "ลูกค้าที่ยังไม่เป็นงาน", cols: SALES_STAGES });
  /* ฝ่ายขออนุญาตอย่างเดียวไม่ต้องเห็นช่วงหน้างาน — งานจะถึงมือเขาก็ต่อเมื่อติดตั้งเสร็จแล้ว
     คอลัมน์ออกแบบ/ถอดของ/นัดคิว/ดำเนินการติดตั้ง จึงว่างตลอดและกินความกว้างบอร์ดไปเปล่า ๆ
     (งานที่ยังไม่เสร็จยังอยู่ในฐานข้อมูลงานเหมือนเดิม แค่ไม่ขึ้นบนบอร์ดของเขา) */
  if (!(window.isPermitOnly && window.isPermitOnly(role))) {
    out.push({ key: "site", th: "หน้างาน", color: "var(--primary)", kind: "job",
      hint: doc ? "งานที่กำลังเดินอยู่" : "งานในฐานข้อมูล",
      cols: doc ? window.SF.STAGES.filter((s) => s.key !== "done") : window.SF.STAGES });
  }
  if (doc) out.push({ key: "doc", th: "เอกสาร", color: "#0EA5E9", kind: "permit",
    hint: "ติดตั้งเสร็จแล้ว รอเดินเรื่องการไฟฟ้า", cols: PERMIT_COLS });
  return out;
}

/* ยอดมูลค่าที่คาดของคอลัมน์ขาย — บอร์ดขายเดิมโชว์ไว้ใต้ชื่อคอลัมน์ ยกมาให้เหมือนกัน */
const flSumValue = (leadsArr) => {
  const sum = leadsArr.reduce((s, l) => s + (+l.expValue || 0), 0);
  return sum > 0 ? "มูลค่ารวม ฿" + fmtBaht(sum) : null;
};

function FlowBoardView({ jobs, leads, quotes, stock, search, role, currentUser,
  onOpenJob, onOpenLead, onNewLead, onNewPermitJob, onNewJob, onMoveStage, onPatchJob, onPatchLead, onPatchPermit, onOpenReview, leadTrash, onOpenLeadTrash, onTrashLead, onRestoreLead }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const groups = React.useMemo(() => flGroups(role), [role]);
  const hasDoc = groups.some((g) => g.key === "doc");
  const hasSales = groups.some((g) => g.key === "sales");
  const canMoveJob = window.can(role, "editJob");

  const [collapsed, setCollapsed] = React.useState(flReadCollapsed);
  const [pkSum, setPkSum] = React.useState(false);   // ป๊อปรูปสรุปแพ็คเกจ (pkgposter.jsx)
  const pkAdmin = window.usePgAdmin();   // รูปแพ็คเกจใช้ได้เฉพาะแอดมิน (ผู้ใช้สั่ง ต.ค. 2026)
  const toggle = (k) => setCollapsed((c) => {
    const next = Object.assign({}, c, { [k]: !c[k] });
    try { localStorage.setItem(FL_GRP_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });

  /* drag = { id, kind } — จำชนิดไว้ด้วย เพราะบอร์ดนี้มีทั้งลูกค้าและงานอยู่บนผืนเดียวกัน
     ลากข้ามชนิดไม่ได้ (ลูกค้ากับงานคนละตาราง เดินขั้นแทนกันไม่ได้) */
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const clearDrag = () => { setDrag(null); setOver(null); setOverTrash(false); };

  /* ── ลากการ์ดลูกค้าไปทิ้งที่ปุ่มถังขยะบนหัวช่วงขาย (ผู้ใช้สั่ง ต.ค. 2026) ──
     ระหว่างลาก ปุ่มขึ้นขอบประแดงรอรับ · ชี้อยู่ = แดงเต็ม ขยาย ใบเดิมในคอลัมน์ย่อตัวลง
     ปล่อย = สำเนาการ์ดบินโค้งเข้าปุ่มถัง (ย่อ+หมุนนิด ๆ) ช่องในคอลัมน์ยุบตามนุ่ม ๆ ถังเด้งรับ แล้วค่อยย้ายลงถังขยะจริง + แถบ "เลิกทำ" 6 วินาที
     (บินเป็นสำเนาบน body เพราะคอลัมน์ตัดขอบ overflow — ใบจริงบินออกนอกคอลัมน์ไม่ได้)
     ไม่ถามยืนยัน — ไม่ได้ลบจริง กู้คืนได้ทั้งจากแถบเลิกทำและในถังขยะ · ใบงานรออนุมัติ (kind job) ทิ้งตรงนี้ไม่ได้ */
  const [overTrash, setOverTrash] = React.useState(false);
  const [trashFx, setTrashFx] = React.useState(false);
  const [undo, setUndo] = React.useState(null);
  const canTrash = !!(onTrashLead && drag && drag.kind === "lead");
  React.useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);
  const dropTrash = () => {
    const d = drag;
    clearDrag();
    if (!d || d.kind !== "lead" || !onTrashLead) return;
    const done = () => {
      onTrashLead(d.id);
      setTrashFx(true); setTimeout(() => setTrashFx(false), 480);
      setUndo({ id: d.id, name: d.rec.name || d.rec.code || "ลูกค้า" });
    };
    const el = document.querySelector('.bd-card[data-lid="' + String(d.id).replace(/"/g, "") + '"]');
    const tb = document.querySelector('.fl-seg[data-trash]');
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !tb || !el.animate || still) { done(); return; }
    const r = el.getBoundingClientRect(), t = tb.getBoundingClientRect();
    const fly = el.cloneNode(true);
    fly.removeAttribute("data-drag");
    Object.assign(fly.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px",
      margin: "0", zIndex: "300", pointerEvents: "none", transition: "none", boxShadow: "var(--hov-sh-lg)" });
    document.body.appendChild(fly);
    el.style.visibility = "hidden";
    const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
    // เส้นทางโค้ง: ยกขึ้นเหนือเส้นตรงเล็กน้อยกลางทาง แล้วดิ่งเข้าปากถัง
    const anim = fly.animate([
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - 46) + "px) scale(.5) rotate(-6deg)", opacity: 1, offset: 0.5 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(.06) rotate(-12deg)", opacity: 0.35 },
    ], { duration: 640, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" });
    const gap = parseFloat(getComputedStyle(el.parentNode).rowGap) || 0;
    const cs = getComputedStyle(el);
    el.style.overflow = "hidden";
    el.animate([
      { height: r.height + "px", paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom, marginBottom: "0px" },
      { height: "0px", paddingTop: "0px", paddingBottom: "0px", marginBottom: -gap + "px" },
    ], { duration: 420, delay: 160, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
    anim.onfinish = () => { fly.remove(); done(); };
  };


  /* ค้นหาบนหัวหน้ากรอง jobs มาแล้ว (prop filtered) แต่ลูกค้ายังไม่ถูกกรอง ต้องกรองเอง */
  const leadPool = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const arr = leads || [];
    if (!q) return arr;
    return arr.filter((l) => ((l.name || "") + " " + (l.code || "") + " " + (l.province || "") + " " + (l.phone || ""))
      .toLowerCase().includes(q));
  }, [leads, search]);

  /* ── แบ่งงานลงคอลัมน์ · การ์ดหนึ่งใบลงได้ที่เดียวเท่านั้น ──
     งานที่ติดตั้งเสร็จแล้วไปอยู่ช่วงเอกสาร (ตามสถานะใบขออนุญาต) ถ้าผู้ใช้เห็นช่วงนั้น
     ถ้าไม่เห็น งาน done กลับไปอยู่คอลัมน์ "เสร็จสิ้น" ของช่วงหน้างานตามเดิม */
  const jobCols = React.useMemo(() => {
    const site = {}, doc = {}, pend = [];
    (SF.STAGES || []).forEach((s) => { site[s.key] = []; });
    PERMIT_COLS.forEach((c) => { doc[c.key] = []; });
    (jobs || []).forEach((j) => {
      /* ── งานที่ออกแบบให้ดูก่อน ลูกค้ายังไม่ตัดสินใจ ──
         เป็นใบงานเต็มใบ (มีแบบ · BOQ · ผังแผง) แต่ยังไม่ใช่งานที่ขายได้
         ถ้าปล่อยไว้ในช่วงหน้างานจะอ่านว่า "ลูกค้าตกลงติดตั้งกับเราแล้ว" ซึ่งยังไม่จริง
         จึงไปยืนที่ "ต่อรอง / รอตัดสินใจ" ของช่วงขายแทน โดยยังเป็นการ์ดงานเหมือนเดิมทุกอย่าง
         ติดตั้งเสร็จแล้ว (done) ไม่ต้องสนธงนี้ — เถียงกันไปแล้วว่าตกลง */
      if (hasSales && j.pendingApproval && j.stage !== "done") { pend.push(j); return; }
      if (hasDoc && j.stage === "done") {
        const pk = permitColOf(j);
        (doc[pk] || doc.todo).push(j);   // สถานะที่ไม่รู้จักไปกองที่ "ยังไม่เริ่ม" ดีกว่าหายไปจากบอร์ด
        return;
      }
      if (site[j.stage]) site[j.stage].push(j);
      else site[(SF.STAGES[0] || {}).key].push(j);   // ขั้นที่ไม่รู้จัก ต้องไม่หายไปจากบอร์ด
    });
    pend.sort(byInstallDate);
    Object.keys(site).forEach((k) => site[k].sort(byInstallDate));
    Object.keys(doc).forEach((k) => doc[k].sort((a, b) =>
      String((b.permit || {}).submittedAt || (b.permit || {}).updatedAt || b.code || "")
        .localeCompare(String((a.permit || {}).submittedAt || (a.permit || {}).updatedAt || a.code || ""))));
    return { site, doc, pend };
  }, [jobs, hasDoc, hasSales]);

  /* ── ลูกค้ารายเดียวกันต้องมีการ์ดใบเดียวในช่วงขาย ──
     ลูกค้าที่แปลงเป็นใบงานแล้วผูกกันด้วย lead.jobId · พอใบงานนั้นถูกติดธง "รออนุมัติ"
     มันจะมายืนในช่วงขายด้วย ถ้าไม่ซ่อนการ์ดลูกค้า รายเดียวกันจะโผล่สองใบ
     (ใบลูกค้าค้างที่ "เสนอราคาแล้ว" ใบงานอยู่ "ต่อรอง") แล้วเซลล์ต้องไล่ดันทั้งสองใบ
     ใบงานมีข้อมูลมากกว่า (แบบ · BOQ · ผังแผง) จึงให้ใบงานแทนที่ใบลูกค้าไปเลย */
  const leadByJob = React.useMemo(() => {
    const m = {};
    (leads || []).forEach((l) => { if (l.jobId) m[l.jobId] = l; });
    return m;
  }, [leads]);
  const pendIds = React.useMemo(() => {
    const m = {};
    jobCols.pend.forEach((j) => { m[j.id] = 1; });
    return m;
  }, [jobCols.pend]);

  const leadCols = React.useMemo(() => {
    const m = {};
    SALES_STAGES.forEach((s) => { m[s.key] = []; });
    leadPool.forEach((l) => {
      if (l.jobId && pendIds[l.jobId]) return;   // ใบงานของรายนี้ยืนแทนอยู่แล้ว
      const k = salesStageKey(l); (m[k] || (m[k] = [])).push(l);
    });
    Object.keys(m).forEach((k) => m[k].sort((a, b) => {
      /* คนที่เลยวันติดตามอยู่บนสุด — บอร์ดนี้มีไว้บอกว่าวันนี้ต้องโทรหาใคร */
      const la = sOverdue(a.nextFollow) ? 0 : 1, lb = sOverdue(b.nextFollow) ? 0 : 1;
      if (la !== lb) return la - lb;
      return String(a.nextFollow || "9999-99-99").localeCompare(String(b.nextFollow || "9999-99-99"));
    }));
    return m;
  }, [leadPool, pendIds]);

  /* คอลัมน์ "ต่อรอง" มีทั้งลูกค้าที่ยังไม่เป็นงาน และใบงานที่รอลูกค้าอนุมัติ ปนกันได้
     ทั้งคู่คือ "ยังไม่รู้ว่าจะได้ทำไหม" เหมือนกัน เซลล์จึงควรเห็นอยู่กองเดียว */
  const cardsOf = (g, key) => (g.kind === "lead"
    ? (key === "nego" ? (leadCols[key] || []).concat(jobCols.pend) : leadCols[key])
    : g.kind === "permit" ? jobCols.doc[key]
    : jobCols.site[key]) || [];

  /* วางลงคอลัมน์นี้ได้ไหม — ลากข้ามช่วงไม่ได้ ยกเว้นใบงานที่รอลูกค้าอนุมัติ
     ใบนั้นข้ามไปมาระหว่าง "ต่อรอง" กับช่วงหน้างานได้ เพราะเป็นใบเดียวกัน ต่างแค่ลูกค้าตกลงหรือยัง */
  const canDrop = (g, key) => {
    if (!drag) return false;
    if (drag.kind === "job") {
      if (!canMoveJob) return false;
      if (g.kind === "lead") return key === "nego" && !drag.rec.pendingApproval;
      if (g.kind === "job") return drag.rec.pendingApproval || drag.rec.stage !== key;
      return false;
    }
    if (drag.group !== g.key) return false;
    if (g.kind === "lead") return salesStageKey(drag.rec) !== key;
    const from = permitColOf(drag.rec);
    return from !== key && (PERMIT_MOVES[from] || []).indexOf(key) !== -1;
  };

  const doDrop = (g, key) => {
    const d = drag;
    clearDrag();
    if (!d) return;
    const rec = d.rec;
    /* ใบงานรออนุมัติ — ลากเข้า "ต่อรอง" = ติดธง · ลากกลับช่วงหน้างาน = ปลดธงแล้วเดินขั้นตามคอลัมน์
       ปลดธงเสมอแม้ขั้นไม่เปลี่ยน ไม่งั้นลากกลับที่เดิมแล้วการ์ดเด้งไปช่วงขายอีก */
    if (d.kind === "job" && canMoveJob) {
      /* ขั้นการขายของลูกค้าต้องตรงกับความจริงด้วย ไม่ใช่แค่ธงบนใบงาน
         ตอนแปลงลูกค้าเป็นงาน ใบลูกค้าถูกประทับว่า "ปิดการขาย" ไปแล้ว
         ถ้าที่จริงยังรอลูกค้าตัดสินใจ ต้องถอยใบลูกค้ากลับมาที่ "ต่อรอง" ด้วย
         ไม่งั้นยอดปิดการขายจะนับงานที่ยังไม่ได้ขาย */
      const lead = leadByJob[rec.id] || null;
      const syncLead = (k) => {
        if (lead && onPatchLead && salesStageKey(lead) !== k) onPatchLead(lead.id, salesStagePatch(k));
      };
      if (g.kind === "lead") {
        if (key !== "nego" || !onPatchJob) return;
        onPatchJob(rec.id, { pendingApproval: true });
        syncLead("nego");
        return;
      }
      if (g.kind !== "job") return;
      if (rec.pendingApproval) {
        if (onPatchJob) onPatchJob(rec.id, { pendingApproval: false });
        syncLead("won");   // ลากกลับเข้าช่วงหน้างาน = ลูกค้าอนุมัติแล้ว
      }
      if (rec.stage !== key) onMoveStage(rec.id, key);
      return;
    }
    if (d.group !== g.key) return;
    if (g.kind === "lead") {
      if (salesStageKey(rec) === key) return;
      if (key === "won") {
        window.askConfirm({
          title: "ปิดการขาย “" + (rec.name || "รายนี้") + "” ?",
          body: "ปิดแล้วให้กด “แปลงเป็นงานติดตั้ง” ที่หน้าลูกค้าสำรวจ เพื่อย้ายเข้าฐานข้อมูลงานพร้อมแบบสำรวจและรูป",
          ok: "ปิดการขาย", danger: false, icon: "check",
        }).then((ok) => { if (ok) onPatchLead(rec.id, salesStagePatch(key)); });
        return;
      }
      onPatchLead(rec.id, salesStagePatch(key));
      return;
    }
    const p = rec.permit || {};
    const from = permitColOf(rec);
    if (from === key || (PERMIT_MOVES[from] || []).indexOf(key) === -1) return;
    if (key === "rejected") { if (onOpenReview) onOpenReview(rec.id); return; }   // ตีกลับต้องมีเหตุผลก่อน
    onPatchPermit(rec.id, permitMovePatch(from, key, p, currentUser));
  };

  /* kind ติดมากับการ์ด ไม่ใช่กับช่วง — ใบงานรออนุมัติไปนั่งอยู่ในช่วงขาย แต่ยังเป็นงาน ไม่ใช่ลูกค้า */
  const kindOf = (g, rec) => (g.kind === "lead" && rec.pendingApproval ? "job" : g.kind);
  const startDrag = (e, rec, g) => {
    const kind = kindOf(g, rec);
    setDrag({ id: rec.id, rec: rec, group: g.key, kind: kind });
    e.dataTransfer.effectAllowed = "move";
    /* การ์ดลูกค้า: ภาพติดเมาส์เป็นการ์ดย่อส่วน (รหัส+ชื่อ) แทนภาพเต็มใบ — เล็งถังขยะ/คอลัมน์ได้ง่าย ไม่บังของ */
    if (kind === "lead" && e.dataTransfer.setDragImage) {
      const gh = document.createElement("div");
      gh.className = "fl-ghost";
      const sm = document.createElement("small"); sm.textContent = rec.code || "";
      gh.appendChild(sm); gh.appendChild(document.createTextNode(rec.name || "(ไม่มีชื่อ)"));
      document.body.appendChild(gh);
      e.dataTransfer.setDragImage(gh, 18, 14);
      setTimeout(() => gh.remove(), 0);
    }
  };

  const renderCard = (g, rec) => {
    const dragging = !!drag && drag.id === rec.id && drag.group === g.key;
    if (g.kind === "lead" && !rec.pendingApproval) {
      const card = <SalesCard key={g.key + rec.id} lead={rec} quotes={quotes} onOpen={onOpenLead}
        dragging={dragging && overTrash ? "trash" : dragging} onDragStart={(e, l) => startDrag(e, l, g)} />;
      return card;
    }
    if (g.kind === "permit")
      return <PermitCard key={g.key + rec.id} job={rec} onOpen={onOpenJob} dragging={dragging}
        draggable={!!PERMIT_MOVES[permitColOf(rec)]} onDragStart={(e, j) => startDrag(e, j, g)} />;
    return <KanbanCard key={g.key + rec.id} job={rec} onOpen={onOpenJob} dragging={dragging}
      onDragStart={(e, j) => { if (canMoveJob) startDrag(e, j, g); }} />;
  };

  const groupCount = (g) => g.cols.reduce((s, c) => s + cardsOf(g, c.key).length, 0);

  if (isMobile) return (
    <FlowMobile groups={groups} cardsOf={cardsOf} renderCard={renderCard}
      collapsed={collapsed} onToggle={toggle} groupCount={groupCount} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, flex: 1 }}>
      {/* บรรทัดคำแนะนำการใช้งาน (ลากการ์ด · พับหัวช่วง) เอาออกตามที่สั่ง — กินความสูงทุกครั้งที่เปิดบอร์ด
          ทั้งที่อ่านแค่ครั้งเดียวก็พอ ตัวความสามารถยังอยู่ครบ ไม่ได้ปิดอะไร */}
      {/* ปล่อยการ์ดนอกคอลัมน์ = เลิกลาก — ไม่มีอันนี้ คอลัมน์ที่วางไม่ได้จะค้างหรี่ทั้งบอร์ด
          จนกว่าจะเริ่มลากใหม่แล้ววางให้สำเร็จสักครั้ง */}
      <div onDragEnd={clearDrag}
        style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 12, minHeight: 0, flex: 1, alignItems: "stretch" }}>
        {/* ปุ่มเพิ่มของแต่ละช่วง — ช่วงขายเปิดใบลูกค้าใหม่
            ช่วงเอกสารเปิดใบงานที่ติดตั้งเสร็จไปแล้ว (งานเก่า/รับช่วงต่อ) ที่ไม่เคยเดินผ่านบอร์ดหน้างาน
            แต่ยังต้องเดินเรื่องการไฟฟ้า */}
        {groups.map((g) => (
          <FlGroup key={g.key} g={g} count={groupCount(g)} collapsed={!!collapsed[g.key]} onToggle={() => toggle(g.key)}
            /* ช่วงหน้างาน = ปุ่มเปิดใบงานใหม่ ซึ่งเดิมอยู่บนหัวจอทุกหน้า ย้ายมาอยู่ตรงกองงานที่มันจะไปโผล่ */
            /* ช่วงขายไม่ใช้ปุ่มเพิ่มของ FlGroup — ลูกค้าใหม่ไปอยู่ในแคปซูล FlSalesDock แทน */
            onAdd={g.kind === "lead" ? null : g.kind === "permit" ? (onNewPermitJob || null)
              : g.kind === "job" ? (onNewJob || null) : null}
            addLabel={g.kind === "permit" ? "งานขออนุญาต" : g.kind === "job" ? "เพิ่มงาน" : "ลูกค้าใหม่"}
            /* ช่วงขาย: แคปซูลเดียว ลูกค้าใหม่ · รูปสรุปแพ็คเกจ · ถังขยะ (กดถังขยะแล้วยืดเป็นแผง — ผู้ใช้ส่งวิดีโอต้นแบบ ต.ค. 2026) */
            extra={g.kind === "lead" ? (
              <FlSalesDock color={g.color} onNewLead={onNewLead}
                onPoster={pkAdmin && window.PkPosterModal ? () => setPkSum(true) : null}
                trash={onOpenLeadTrash ? (leadTrash || []) : null} onRestore={onRestoreLead} onOpenAll={onOpenLeadTrash}
                trashSt={trashFx ? "gulp" : canTrash ? (overTrash ? "over" : "ready") : null}
                trashDnD={{
                  onDragOver: (e) => { if (!canTrash) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (!overTrash) setOverTrash(true); },
                  onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverTrash(false); },
                  onDrop: (e) => { e.preventDefault(); e.stopPropagation(); dropTrash(); },
                }} />
            ) : null}>
            {g.cols.map((c) => {
              const cards = cardsOf(g, c.key);
              const ok = canDrop(g, c.key);
              return (
                <FlCol key={c.key} col={c} count={cards.length} isOver={over === g.key + ":" + c.key && ok}
                  dimmed={!!drag && !ok}
                  sub={g.kind === "lead" ? flSumValue(cards) : null}
                  onDragOver={(e) => { if (!ok) return; e.preventDefault(); setOver(g.key + ":" + c.key); }}
                  onDragLeave={() => setOver((o) => (o === g.key + ":" + c.key ? null : o))}
                  onDrop={() => doDrop(g, c.key)}>
                  {cards.map((rec) => renderCard(g, rec))}
                </FlCol>
              );
            })}
          </FlGroup>
        ))}
      </div>
      {undo && (
        <div className="fl-undo" role="status">
          <Icon name="trash" size={14} color="#fff" />
          <span>ย้าย “{undo.name}” ลงถังขยะแล้ว</span>
          {onRestoreLead && <button onClick={() => { onRestoreLead(undo.id); setUndo(null); }}
            style={{ border: "none", borderRadius: "var(--r-pill)", padding: "5px 12px", background: "rgba(255,255,255,.16)", color: "#fff",
              fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>เลิกทำ</button>}
        </div>
      )}
      {pkSum && pkAdmin && window.PkPosterModal && <window.PkPosterModal leads={leads} stock={stock} quotes={quotes} onClose={() => setPkSum(false)} />}
    </div>
  );
}

/* ── มือถือ — หีบเพลงสองชั้น: ช่วงเป็นชั้นนอก คอลัมน์เป็นชั้นใน ──
   จอแคบลากไม่ได้อยู่แล้ว ตัดเรื่องลากทิ้งทั้งหมด เหลือแตะเพื่อเปิดใบ */
function FlowMobile({ groups, cardsOf, renderCard, collapsed, onToggle, groupCount }) {
  const [openCol, setOpenCol] = React.useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map((g) => {
        const shut = !!collapsed[g.key];
        return (
          <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <button onClick={() => onToggle(g.key)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: "var(--r-tile)",
                boxShadow: "var(--shadow-sm)", background: "var(--surface2)", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%" }}>
              <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill)", background: g.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{g.th}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{groupCount(g)}</span>
              <Icon name="chevronDown" size={17} color="var(--text-3)"
                style={{ marginLeft: "auto", transform: shut ? "rotate(-90deg)" : "none", transition: "transform .18s" }} />
            </button>
            {!shut && g.cols.map((c) => {
              const cards = cardsOf(g, c.key);
              const k = g.key + ":" + c.key;
              const isOpen = !!openCol[k];
              return (
                <div key={c.key} style={{ borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                  <button onClick={() => setOpenCol((o) => Object.assign({}, o, { [k]: !isOpen }))}
                    style={{ width: "100%", padding: "11px 13px", display: "flex", alignItems: "center", gap: 9,
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      borderBottom: isOpen ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "var(--r-pill)", background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{c.th}</span>
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: c.fg || "var(--text-2)",
                        background: c.soft || "var(--surface)", minWidth: 24, height: 24, borderRadius: "var(--r-pill)",
                        display: "grid", placeItems: "center", padding: "0 7px" }}>{cards.length}</span>
                      <Icon name="chevronDown" size={16} color="var(--text-3)"
                        style={{ transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .18s" }} />
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                      {cards.map((rec) => renderCard(g, rec))}
                      {cards.length === 0 && <div style={{ padding: "14px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ว่าง</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { FlowBoardView, FlCol, FlGroup, flGroups });
