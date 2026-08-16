/* ============================================================
   PHITHAN GREEN — หน้าคิวงานขออนุญาต (ฝ่ายแอดมินขออนุญาต)

   ช่างกดส่งจาก PermitWizard → งานโผล่ที่นี่ · ฝ่ายขออนุญาตเปิดดูข้อมูล+รูปทั้งชุด
   สั่งออกเป็น PDF ชุดเดียวไปแนบยื่นการไฟฟ้า แล้วเดินสถานะจนอนุมัติ
   ============================================================ */

/* คอลัมน์บนบอร์ดขออนุญาต = เส้นทางเดินของงานหนึ่งใบ ตั้งแต่ติดตั้งเสร็จจนการไฟฟ้าอนุมัติ
   คอลัมน์แรกไม่ใช่สถานะในข้อมูล แต่คือ "งานที่ติดตั้งเสร็จแล้วยังไม่มีใครแตะ" ซึ่งเป็นของที่ตกหล่นบ่อยที่สุด */
const PERMIT_COLS = [
  { key: "todo",     th: "ยังไม่เริ่มเก็บข้อมูล", color: "#94A3B8", soft: "var(--surface2)" },
  { key: "sent",     th: "รอฝ่ายขออนุญาตรับ",   color: "#F59E0B", soft: "var(--tint-amber-bg)" },
  { key: "rejected", th: "ตีกลับให้ช่างแก้",     color: "#EF4444", soft: "var(--tint-red-bg)" },
  { key: "filing",   th: "กำลังยื่นการไฟฟ้า",    color: "#3B82F6", soft: "#3B82F614" },
  { key: "approved", th: "การไฟฟ้าอนุมัติแล้ว",  color: "#10B981", soft: "var(--primary-soft)" },
];
const PERMIT_TABS = PERMIT_COLS.filter((c) => c.key !== "todo").map((c) => ({ key: c.key, th: c.th }));

/* ลากได้เฉพาะช่วงที่ฝ่ายขออนุญาตเป็นเจ้าของเรื่องเอง
   ตีกลับไม่ให้ลากปิดจบ เพราะต้องพิมพ์เหตุผลก่อน — ลากไปแล้วจะเปิดการ์ดให้พิมพ์แทน */
const PERMIT_MOVES = { sent: ["filing", "rejected"], filing: ["approved", "rejected"], rejected: ["filing"] };
const today10 = () => new Date().toISOString().slice(0, 10);

function permitColOf(j) {
  const st = j.permit && j.permit.status;
  return st ? st : "todo";
}

/* การ์ดบนบอร์ด — ข้อมูลที่ฝ่ายขออนุญาตต้องใช้ตัดสินใจ ไม่ใช่สเปคงานติดตั้ง */
function PermitCard({ job, onOpen, onDragStart, dragging, draggable }) {
  const p = job.permit || {};
  const st = PERMIT_STATUS[p.status] || null;
  const pt = (PERMIT_TYPES.find((x) => x.key === p.permitType) || {}).th || "";
  const days = p.submittedAt ? Math.floor((Date.now() - new Date(p.submittedAt).getTime()) / 86400000) : 0;
  const late = p.status === "sent" && days >= 3;   /* ค้างเกิน 3 วัน = ควรรีบรับ */
  return (
    <div draggable={!!draggable} onDragStart={(e) => draggable && onDragStart(e, job)} onClick={() => onOpen(job)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 13px",
        cursor: draggable ? "grab" : "pointer", boxShadow: "var(--shadow-sm)", opacity: dragging ? .4 : 1,
        borderLeft: "3px solid " + (st ? st.color : "var(--border-strong)"),
        transition: "box-shadow .16s, transform .16s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(8,20,14,.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{job.code}</span>
        {late && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "var(--tint-red-bg2)", padding: "1px 7px", borderRadius: 99 }}>ค้าง {days} วัน</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, marginBottom: 3 }}>{job.name}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {job.province || "—"}
        {p.auth ? " · " + p.auth : ""}{p.branch ? " " + p.branch : ""}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", fontSize: 10.5, color: "var(--text-2)" }}>
        {pt && <span style={{ background: "var(--surface2)", padding: "3px 8px", borderRadius: 7 }}>{pt}</span>}
        <span style={{ background: "var(--surface2)", padding: "3px 8px", borderRadius: 7, fontFamily: "var(--mono)" }}>{p.kwp || job.kw || "—"} kWp</span>
        {p.reqNo && <span style={{ background: "var(--surface2)", padding: "3px 8px", borderRadius: 7, fontFamily: "var(--mono)" }}>คำร้อง {p.reqNo}</span>}
      </div>
      {p.status === "rejected" && p.rejectReason && (
        <div style={{ marginTop: 9, fontSize: 11, lineHeight: 1.45, color: "var(--tint-red-tx)", background: "var(--tint-red-bg)", borderRadius: 8, padding: "6px 8px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>↩ {p.rejectReason}</div>
      )}
      <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)", fontSize: 10.5, color: "var(--text-3)" }}>
        {!p.status ? "ติดตั้งเสร็จแล้ว · ยังไม่มีชุดข้อมูลขออนุญาต"
          : p.status === "approved" ? "อนุมัติ " + (p.approvedDate ? thDate(p.approvedDate, true) : "—")
          : p.status === "filing"   ? "ยื่นเมื่อ " + (p.filedDate ? thDate(p.filedDate, true) : "—")
          : p.submittedAt ? "ช่างส่ง " + thDate(String(p.submittedAt).slice(0, 10), true) + (p.submittedBy ? " · " + p.submittedBy : "")
          : "ยังไม่ได้ส่ง"}
      </div>
    </div>
  );
}

function PermitQueueView({ jobs, search, stock, onOpenJob, onPatchPermit, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [mode, setMode] = React.useState(() => { try { return localStorage.getItem("sf_permit_view") || "board"; } catch (e) { return "board"; } });
  const [tab, setTab] = React.useState("sent");
  const [open, setOpen] = React.useState(null);   // job ที่กำลังเปิดดู
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const setModeSave = (m) => { setMode(m); try { localStorage.setItem("sf_permit_view", m); } catch (e) {} };

  /* ช่องค้นหาบนหัวหน้าใช้กับบอร์ดนี้ด้วย — ชื่อลูกค้า รหัสงาน จังหวัด หรือเลขคำร้อง */
  const pool = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => ((j.name || "") + " " + (j.code || "") + " " + (j.province || "") + " " +
      ((j.permit || {}).reqNo || "") + " " + ((j.permit || {}).ca || "")).toLowerCase().includes(q));
  }, [jobs, search]);

  /* งานที่มีชุดข้อมูลขออนุญาตแล้วเท่านั้น — งานที่ช่างยังไม่แตะจะไม่มารกคิว */
  const withPermit = React.useMemo(
    () => pool.filter((j) => j.permit && j.permit.status),
    [pool]
  );
  /* งานติดตั้งที่เสร็จแล้วแต่ยังไม่มีใครเริ่มเก็บข้อมูลขออนุญาต — เตือนไว้ไม่ให้ตกหล่น */
  const notStarted = React.useMemo(
    () => pool.filter((j) => j.stage === "done" && !(j.permit && j.permit.status)),
    [pool]
  );
  const counts = React.useMemo(() => {
    const c = { todo: notStarted.length };
    withPermit.forEach((j) => { const k = j.permit.status; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [withPermit, notStarted]);

  const byCol = React.useCallback((key) => {
    const arr = key === "todo" ? notStarted.slice() : withPermit.filter((j) => j.permit.status === key);
    return arr.sort((a, b) => String((b.permit || {}).submittedAt || (b.permit || {}).updatedAt || b.code || "")
      .localeCompare(String((a.permit || {}).submittedAt || (a.permit || {}).updatedAt || a.code || "")));
  }, [withPermit, notStarted]);

  const shown = React.useMemo(() => byCol(tab), [byCol, tab]);
  const openJob = open ? jobs.find((j) => j.id === open) || null : null;

  /* ลากการ์ดข้ามคอลัมน์ = เดินสถานะ · ประทับวันให้อัตโนมัติเหมือนกดปุ่มในการ์ด */
  const canDrop = (from, to) => from !== to && (PERMIT_MOVES[from] || []).indexOf(to) !== -1;
  const onDrop = (to) => {
    const j = drag && jobs.find((x) => x.id === drag);
    setDrag(null); setOver(null);
    if (!j) return;
    const p = j.permit || {};
    if (!canDrop(p.status, to)) return;
    if (to === "rejected") { setOpen(j.id); return; }   // ตีกลับต้องมีเหตุผล — เปิดการ์ดให้พิมพ์
    const extra = { byAdmin: (currentUser && currentUser.name) || "", adminId: (currentUser && currentUser.id) || null,
      statusAt: new Date().toISOString() };
    if (to === "filing")   { extra.rejectReason = null; if (!p.filedDate) extra.filedDate = today10(); }
    if (to === "approved") { if (!p.approvedDate) extra.approvedDate = today10(); }
    onPatchPermit(j.id, Object.assign({ status: to }, extra));
  };
  const cardOpen = (j) => { if (j.permit && j.permit.status) setOpen(j.id); else onOpenJob && onOpenJob(j.id); };

  const modeSwitch = (
    <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 10, background: "var(--surface2)", flexShrink: 0 }}>
      {[["board", "บอร์ด", "kanban"], ["list", "รายการ", "list"]].map((x) => (
        <button key={x[0]} onClick={() => setModeSave(x[0])}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: 700, background: mode === x[0] ? "var(--surface)" : "transparent",
            color: mode === x[0] ? "var(--primary-dark)" : "var(--text-3)", boxShadow: mode === x[0] ? "0 1px 3px rgba(8,20,14,.12)" : "none" }}>
          <Icon name={x[2]} size={13} color={mode === x[0] ? "var(--primary-dark)" : "var(--text-3)"} />{x[1]}
        </button>
      ))}
    </div>
  );

  const review = openJob ? <PermitReview job={openJob} currentUser={currentUser} stock={stock} onClose={() => setOpen(null)}
    onOpenJob={() => { setOpen(null); onOpenJob && onOpenJob(openJob.id); }}
    onPatch={(fields) => onPatchPermit(openJob.id, fields)} /> : null;

  /* ── โหมดบอร์ด ── */
  if (mode === "board") {
    if (isMobile) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>{modeSwitch}</div>
          <PermitBoardMobile cols={PERMIT_COLS} byCol={byCol} counts={counts} onOpen={cardOpen} />
          {review}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", flex: 1, minWidth: 0 }}>
            ลากการ์ดข้ามคอลัมน์เพื่อเดินสถานะ · ลากไป “ตีกลับ” จะเปิดการ์ดให้พิมพ์เหตุผลก่อน
          </span>
          {modeSwitch}
        </div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, minHeight: 0, flex: 1 }}>
          {PERMIT_COLS.map((c) => {
            const col = byCol(c.key);
            const dragging = drag ? (jobs.find((x) => x.id === drag) || null) : null;
            const ok = dragging ? canDrop((dragging.permit || {}).status, c.key) : false;
            const isOver = over === c.key && ok;
            return (
              <div key={c.key}
                onDragOver={(e) => { if (!ok) return; e.preventDefault(); setOver(c.key); }}
                onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
                onDrop={() => onDrop(c.key)}
                style={{ width: 268, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 18,
                  background: isOver ? c.soft : "var(--surface2)", border: "1px solid " + (isOver ? c.color : "var(--border)"),
                  opacity: drag && !ok ? .55 : 1, transition: "background .15s, border-color .15s, opacity .15s" }}>
                <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 1,
                  background: isOver ? c.soft : "var(--surface2)", borderRadius: "17px 17px 0 0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-2)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.th}</span>
                  </span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.02em",
                    color: col.length ? "var(--text-1)" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{col.length}</span>
                </div>
                <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto", flex: 1, minHeight: 80 }}>
                  {col.map((j) => (
                    <PermitCard key={j.id} job={j} onOpen={cardOpen} dragging={drag === j.id}
                      draggable={!!PERMIT_MOVES[permitColOf(j)]}
                      onDragStart={(e, job) => { setDrag(job.id); e.dataTransfer.effectAllowed = "move"; }} />
                  ))}
                  {col.length === 0 && (
                    <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)", border: "1.5px dashed var(--border-strong)", borderRadius: 10 }}>
                      {isOver ? "วางที่นี่" : "ว่าง"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {review}
      </div>
    );
  }

  /* ── โหมดรายการ (ของเดิม) ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="cat-chip-row" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, flex: 1, minWidth: 0 }}>
          {PERMIT_TABS.map((t) => {
            const on = tab === t.key, st = PERMIT_STATUS[t.key];
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 99, cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                  border: "1px solid " + (on ? "transparent" : "var(--border)"),
                  background: on ? st.color : "var(--surface)", color: on ? "#fff" : "var(--text-2)" }}>
                {t.th}
                <span style={{ fontSize: 11, fontFamily: "var(--mono)", fontWeight: 800, opacity: .8 }}>{counts[t.key] || 0}</span>
              </button>
            );
          })}
        </div>
        {modeSwitch}
      </div>

      {tab === "sent" && notStarted.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: 13, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tint-amber-tx)" }}>
            มีงานติดตั้งเสร็จแล้ว {notStarted.length} งาน ที่ช่างยังไม่ได้เริ่มเก็บข้อมูลขออนุญาต
          </div>
          <div style={{ fontSize: 11.5, color: "var(--tint-amber-tx)", marginTop: 4, lineHeight: 1.5 }}>
            {notStarted.slice(0, 6).map((j) => j.code).join(" · ")}{notStarted.length > 6 ? " และอีก " + (notStarted.length - 6) + " งาน" : ""}
          </div>
        </div>
      )}

      {shown.length === 0 && (
        <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 13.5,
          background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 16 }}>
          ยังไม่มีงานในหมวดนี้
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(330px, 1fr))", gap: 12 }}>
        {shown.map((j) => <PermitCard key={j.id} job={j} onOpen={cardOpen} draggable={false} dragging={false} onDragStart={() => {}} />)}
      </div>

      {review}
    </div>
  );
}

/* บอร์ดบนมือถือ — พับเป็นแถวตามคอลัมน์ ลากไม่ได้ (ใช้ปุ่มในการ์ดแทน) */
function PermitBoardMobile({ cols, byCol, counts, onOpen }) {
  const [openCol, setOpenCol] = React.useState("sent");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {cols.map((c) => {
        const col = byCol(c.key);
        const isOpen = openCol === c.key;
        return (
          <div key={c.key} style={{ borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <button onClick={() => setOpenCol(isOpen ? null : c.key)}
              style={{ width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                borderBottom: isOpen ? "1px solid var(--border)" : "none" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{c.th}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: c.color, background: c.color + "1a",
                  minWidth: 24, height: 24, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 7px" }}>{counts[c.key] || 0}</span>
                <Icon name="chevronDown" size={17} color="var(--text-3)" style={{ transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .18s" }} />
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.map((j) => <PermitCard key={j.id} job={j} onOpen={onOpen} draggable={false} dragging={false} onDragStart={() => {}} />)}
                {col.length === 0 && <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ไม่มีงานในหมวดนี้</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── แคตตาล็อกแผง / อินเวอร์เตอร์ ──
   ไม่ต้องอัปซ้ำทุกงาน เพราะเป็นเอกสารของ "รุ่น" ไม่ใช่ของ "งาน"
   ดึง DATA SHEET ที่แนบไว้กับของในคลังมาตามรุ่นที่บันทึกในชุดขออนุญาต */
function usePermitCatalog(stock, permit) {
  const items = (stock && stock.items) || [];
  const models = [];
  const push = (x) => { const t = String(x || "").trim(); if (t && models.indexOf(t) === -1) models.push(t); };
  push((permit || {}).panelModel);
  ((permit || {}).invs || []).forEach((iv) => push(iv && iv.model));
  const key = models.join("|").toLowerCase();

  const found = React.useMemo(() => {
    const norm = (x) => String(x || "").trim().toLowerCase();
    const want = models.map(norm).filter(Boolean);
    if (!want.length) return [];
    return items.filter((it) => it.doc && want.some((w) =>
      norm(it.name) === w || norm(it.model) === w || (it.aka || []).some((a) => norm(a) === w)));
  }, [items, key]);

  const [sheets, setSheets] = React.useState([]);
  const ids = found.map((x) => x.id).join("|");
  React.useEffect(() => {
    let dead = false;
    if (!found.length || !stock || !stock.loadDoc) { setSheets([]); return; }
    Promise.all(found.map((it) => Promise.resolve(stock.loadDoc(it.id)).then((d) => (d && d.data
      ? { id: it.id, label: it.name, name: d.name || it.name, dataUrl: d.data, kind: /^data:image/i.test(d.data) ? "image" : "pdf" }
      : null)).catch(() => null)))
      .then((list) => { if (!dead) setSheets(list.filter(Boolean)); });
    return () => { dead = true; };
  }, [ids]);

  /* รุ่นที่บันทึกไว้แต่หา DATA SHEET ในคลังไม่เจอ — ต้องบอก ไม่งั้นจะนึกว่าครบแล้ว */
  const missing = models.filter((m) => {
    const norm = (x) => String(x || "").trim().toLowerCase();
    return !found.some((it) => norm(it.name) === norm(m) || norm(it.model) === norm(m) || (it.aka || []).some((a) => norm(a) === norm(m)));
  });
  return { sheets, missing, models };
}

/* แถวแคตตาล็อก — มาจากคลัง ไม่ใช่ช่องอัปโหลด */
function PermitCatalogRow({ slot, sheets, missing, models }) {
  const has = sheets.length > 0;
  const openSheet = (sh) => {
    try {
      const url = window.dataUrlToBlobUrl ? window.dataUrlToBlobUrl(sh.dataUrl) : sh.dataUrl;
      window.open(url, "_blank", "noopener");
    } catch (e) { window.open(sh.dataUrl, "_blank", "noopener"); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "9px 11px", borderRadius: 11,
      border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"),
      borderLeft: "3px solid " + (has ? "var(--primary)" : "var(--tint-red-bd)"),
      background: has ? "var(--surface)" : "var(--surface2)" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
          background: has ? "var(--primary-soft)" : "var(--surface3)" }}>
          <Icon name={has ? "check" : "box"} size={15} color={has ? "var(--primary-dark)" : "var(--text-3)"} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
            {slot.label}<span style={{ color: "#EF4444" }}> *</span>
          </span>
          <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4 }}>
            {has ? "ดึงจาก DATA SHEET ในคลังให้อัตโนมัติ" : (models.length ? "ยังไม่ได้แนบ DATA SHEET ของรุ่นนี้ไว้ในคลัง" : "ยังไม่ได้ระบุรุ่นแผง/อินเวอร์เตอร์ในชุดข้อมูล")}
          </span>
        </span>
      </div>
      {sheets.map((sh) => (
        <div key={sh.id} style={{ display: "flex", gap: 9, alignItems: "center", padding: "7px 9px", borderRadius: 9, background: "var(--surface2)" }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: sh.kind === "image" ? "var(--primary-dark)" : "#EF4444",
            background: sh.kind === "image" ? "var(--primary-soft)" : "#EF444414", padding: "3px 7px", borderRadius: 6, flexShrink: 0 }}>
            {sh.kind === "image" ? "IMG" : "PDF"}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sh.label}</span>
          <button onClick={() => openSheet(sh)}
            style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>เปิดดู</button>
        </div>
      ))}
      {missing.length > 0 && (
        <div style={{ fontSize: 10.5, lineHeight: 1.5, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)",
          border: "1px solid var(--tint-amber-bd)", borderRadius: 8, padding: "6px 9px" }}>
          ไม่พบ DATA SHEET ในคลังของ: {missing.join(" · ")} — ไปแนบไว้ที่รายการนั้นในหน้าคลังสินค้า แล้วทุกงานที่ใช้รุ่นนี้จะได้ไปด้วยกันหมด
        </div>
      )}
    </div>
  );
}

/* ช่องบันทึกการยื่น — พิมพ์แล้วเซฟตอนออกจากช่อง จะได้ไม่เขียน Firebase ทุกตัวอักษร
   อยู่นอกคอมโพเนนต์แม่ เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่แม่รีเรนเดอร์แล้วเคอร์เซอร์หลุด */
function PermitFilingField({ label, value, onSave, type, placeholder }) {
  const [v, setV] = React.useState(value || "");
  React.useEffect(() => { setV(value || ""); }, [value]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", color: "var(--text-3)" }}>{label}</label>
      <input type={type || "text"} value={v} placeholder={placeholder || ""}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if ((value || "") !== v) onSave(v); }}
        style={Object.assign({}, P_INPUT, { fontSize: 13 })} />
    </div>
  );
}

/* ไฟล์ที่ฝ่ายออกแบบแนบไว้กับตัวงาน (แบบ / BOQ) — ฝ่ายขออนุญาตดูได้อย่างเดียว ไม่ต้องขอทางแชท */
function PermitJobFiles({ jobId }) {
  const media = window.useJobMedia ? window.useJobMedia(jobId) : { files: [] };
  const KIND = { design: { th: "แบบ", color: "#2563EB" }, boq: { th: "BOQ", color: "#0D9488" }, other: { th: "ไฟล์อื่น", color: "#64748B" } };
  const files = (media.files || []).filter((f) => f.kind === "design" || f.kind === "boq");
  const open = (f) => {
    try {
      const url = window.dataUrlToBlobUrl ? window.dataUrlToBlobUrl(f.dataUrl) : f.dataUrl;
      window.open(url, "_blank", "noopener");
    } catch (e) { window.open(f.dataUrl, "_blank", "noopener"); }
  };
  if (!files.length) {
    return <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีไฟล์แบบหรือ BOQ แนบไว้กับงานนี้</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {files.map((f) => {
        const k = KIND[f.kind] || KIND.other;
        return (
          <div key={f.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 11px", borderRadius: 11,
            background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid " + k.color }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: k.color, background: k.color + "14", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}>{k.th}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name || "ไฟล์"}</span>
              <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>
                {(f.byName ? "โดย " + f.byName : "")}{f.at ? " · " + thDate(String(f.at).slice(0, 10), true) : ""}
              </span>
            </span>
            <button onClick={() => open(f)}
              style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                color: "var(--text-2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>เปิดดู</button>
          </div>
        );
      })}
    </div>
  );
}

/* แถวเอกสาร 1 รายการ — แนบไฟล์ / เปิดดู / ลบ */
function PermitDocRow({ slot, doc, busy, onPick, onRemove }) {
  const inputRef = React.useRef(null);
  const has = !!(doc && doc.dataUrl);
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 11px", borderRadius: 11,
      border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"),
      borderLeft: "3px solid " + (has ? "var(--primary)" : (slot.req ? "var(--tint-red-bd)" : "var(--surface3)")),
      background: has ? "var(--surface)" : "var(--surface2)" }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
        background: has ? "var(--primary-soft)" : "var(--surface3)" }}>
        <Icon name={has ? "check" : "file"} size={15} color={has ? "var(--primary-dark)" : "var(--text-3)"} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
          {slot.label}{slot.req && <span style={{ color: "#EF4444" }}> *</span>}
        </span>
        <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {has ? (doc.name || "แนบแล้ว") + (doc.byName ? " · " + doc.byName : "") : slot.hint}
        </span>
      </span>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: "none" }}
        onChange={(e) => { const fl = e.target.files && e.target.files[0]; if (fl) onPick(fl); e.target.value = ""; }} />
      <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {has && (
          <a href={doc.dataUrl} target="_blank" rel="noreferrer" download={doc.name || undefined}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-2)", fontSize: 11.5, fontWeight: 700, textDecoration: "none" }}>เปิด</a>
        )}
        <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
          style={{ padding: "6px 11px", borderRadius: 8, border: "none", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
            background: has ? "var(--surface3)" : "var(--primary)", color: has ? "var(--text-2)" : "#fff", cursor: busy ? "wait" : "pointer" }}>
          {busy ? "…" : (has ? "เปลี่ยน" : "แนบไฟล์")}
        </button>
        {has && (
          <button type="button" onClick={onRemove} title="ลบไฟล์"
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Icon name="trash" size={13} />
          </button>
        )}
      </span>
    </div>
  );
}

/* ================================================================
   PermitReview — ฝ่ายขออนุญาตเปิดดูชุดข้อมูลที่ช่างส่งมา
   ================================================================ */
function PermitReview({ job, currentUser, stock, onClose, onPatch, onOpenJob }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const media = usePermitPhotos(job.id);
  const files = usePermitDocs(job.id);
  const [repHtml, setRepHtml] = React.useState(null);
  const [rejecting, setRejecting] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busyDoc, setBusyDoc] = React.useState(null);
  const [docErr, setDocErr] = React.useState("");
  const p = job.permit || {};
  const st = PERMIT_STATUS[p.status] || PERMIT_STATUS.draft;
  const prog = permitProgress(p, media.photos);

  /* adminId = คนที่รับงานใบนี้ไว้ · ใช้คัดว่างานไหนเป็น "งานของฉัน" ในฐานข้อมูลงาน */
  const stamp = (status, extra) => onPatch(Object.assign({
    status, byAdmin: (currentUser && currentUser.name) || "", adminId: (currentUser && currentUser.id) || null,
    statusAt: new Date().toISOString(),
  }, extra || {}));

  const row = (label, value) => (
    <div style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px dashed var(--border)" }}>
      <span style={{ width: 150, flexShrink: 0, fontSize: 11.5, color: "var(--text-3)" }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: value ? "var(--text-1)" : "var(--text-3)", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );

  const shots = PERMIT_PHOTO_SLOTS.filter((s) => media.photos[s.key] && media.photos[s.key].dataUrl);
  const cat = usePermitCatalog(stock, p);
  /* แคตตาล็อกนับว่าครบเมื่อดึงจากคลังได้ ไม่ต้องรออัปไฟล์ */
  const docHas = (d) => (d.key === "catalog" ? cat.sheets.length > 0 : !!(files.docs[d.key] && files.docs[d.key].dataUrl));
  const docMissing = PERMIT_DOC_SLOTS.filter((d) => d.req && !docHas(d));

  const pickDoc = async (key, file) => {
    if (!file) return;
    setBusyDoc(key); setDocErr("");
    try {
      const rec = await readPermitDoc(file);
      files.setDoc(key, Object.assign(rec, { byName: (currentUser && currentUser.name) || "" }));
    } catch (err) { setDocErr(err.message); }
    setBusyDoc(null);
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20,
        width: isMobile ? "100%" : "min(820px,100%)", height: isMobile ? "96dvh" : "min(900px, 92vh)",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, background: st.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="file" size={18} color={st.color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</h2>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{job.code} · <span style={{ color: st.color, fontWeight: 700 }}>{st.th}</span></span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
          {prog.missing.length > 0 && (
            <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)",
              fontSize: 12.5, fontWeight: 600, color: "var(--tint-red-tx)", lineHeight: 1.55 }}>
              ชุดนี้ยังไม่ครบ ({prog.pct}%) — ขาด: {prog.missing.map((m) => m.th).join(", ")}
            </div>
          )}
          {p.note && (
            <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)", fontSize: 12.5, color: "var(--tint-amber-tx)", lineHeight: 1.55 }}>
              <b>หมายเหตุจากช่าง:</b> {p.note}
            </div>
          )}

          <SurveyBlock title="⚡ จุดรับไฟ">
            <div>
              {row("ประเภทการยื่น", (PERMIT_TYPES.find((x) => x.key === p.permitType) || {}).th)}
              {row("การไฟฟ้า", p.auth ? p.auth + (p.branch ? " · " + p.branch : "") : "")}
              {row("หมายเลขผู้ใช้ไฟ (CA)", p.ca)}
              {row("หมายเลขมิเตอร์", p.meterNo)}
              {row("ขนาดมิเตอร์ / เฟส", [p.meterSize, p.phase ? p.phase + " เฟส" : ""].filter(Boolean).join(" · "))}
              {row("หมายเลขเสาไฟ", p.poleNo)}
            </div>
          </SurveyBlock>

          <SurveyBlock title="🔌 ระบบไฟเดิม">
            <div>
              {row("เมนเบรกเกอร์", [p.mainAT ? p.mainAT + "AT" : "", p.mainAF ? p.mainAF + "AF" : ""].filter(Boolean).join(" / "))}
              {row("สายเมน", p.mainCable)}
              {row("ตู้ MDB", p.mdbBrand)}
              {row("เมนกันดูด (RCD)", p.rccb === "yes" ? "มี" : p.rccb === "no" ? "ไม่มี" : "")}
              {p.permitType === "biz" && row("หม้อแปลง", [p.trafoKva ? p.trafoKva + " kVA" : "", p.trafoVolt].filter(Boolean).join(" · "))}
            </div>
          </SurveyBlock>

          <SurveyBlock title="☀️ ระบบที่ติดตั้ง">
            <div>
              {row("ขนาดติดตั้ง", [p.kwp ? p.kwp + " kWp" : "", p.kwac ? p.kwac + " kW AC" : ""].filter(Boolean).join(" · "))}
              {row("เบรกเกอร์ AC", p.acBreaker)}
              {row("DC Isolator", p.dcIsolator === "yes" ? "มี" : p.dcIsolator === "no" ? "ไม่มี" : "")}
              {row("กันไฟไหลย้อน", p.zeroExport === "yes" ? ("มี" + (p.eldModel ? " · " + p.eldModel : "")) : p.zeroExport === "no" ? "ไม่มี" : "")}
              {row("แผง", [p.panelModel, p.panelWatt ? p.panelWatt + " W" : "", p.panelQty ? "× " + p.panelQty + " แผ่น" : ""].filter(Boolean).join(" · "))}
              {row("Serial แผง (ตัวอย่าง)", (p.panelSns || []).filter(Boolean).join(", "))}
              {(p.invs || []).map((iv, i) => (
                <React.Fragment key={i}>{row("อินเวอร์เตอร์ " + (i + 1), [iv.model, iv.sn ? "S/N " + iv.sn : ""].filter(Boolean).join(" · "))}</React.Fragment>
              ))}
              {row("พิกัด GPS", p.gps ? p.gps.lat + ", " + p.gps.lng : "")}
              {row("ติดตั้งเสร็จ", p.doneDate ? thDate(p.doneDate, true) : "")}
              {row("ช่างผู้เก็บข้อมูล", p.submittedBy || p.byName)}
            </div>
          </SurveyBlock>

          <SurveyBlock title={"📷 รูปถ่าย " + shots.length + " รูป"} sub="แตะรูปเพื่อเปิดขนาดเต็ม">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 9 }}>
              {shots.map((s) => (
                <a key={s.key} href={media.photos[s.key].dataUrl} target="_blank" rel="noreferrer"
                  style={{ display: "block", textDecoration: "none" }}>
                  <img src={media.photos[s.key].dataUrl} alt={s.label}
                    style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.35 }}>{s.label}</span>
                </a>
              ))}
              {shots.length === 0 && <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีรูป</span>}
            </div>
          </SurveyBlock>

          <SurveyBlock title="📐 ไฟล์แบบที่แนบกับงาน" sub="แบบและ BOQ ที่ฝ่ายออกแบบอัปไว้กับงานใบนี้ — เปิดดู/บันทึกไปแนบยื่นได้เลย">
            <PermitJobFiles jobId={job.id} />
          </SurveyBlock>

          <SurveyBlock title={"🗂 เอกสารจากออฟฟิศ " + (PERMIT_DOC_SLOTS.length - docMissing.length) + "/" + PERMIT_DOC_SLOTS.length}
            sub="ช่างเก็บให้ไม่ได้ ต้องขอจากลูกค้า/วิศวกร — แนบไว้ที่นี่ทีเดียว จะได้ไม่ต้องไล่หาในแชท">
            {docMissing.length > 0 && (
              <div style={{ padding: "9px 12px", borderRadius: 10, background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)",
                fontSize: 12, fontWeight: 600, color: "var(--tint-red-tx)", lineHeight: 1.5 }}>
                ยังขาดเอกสารบังคับ {docMissing.length} รายการ: {docMissing.map((d) => d.label).join(", ")}
              </div>
            )}
            {docErr && <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>⚠ {docErr}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERMIT_DOC_SLOTS.map((d) => (d.key === "catalog"
                ? <PermitCatalogRow key={d.key} slot={d} sheets={cat.sheets} missing={cat.missing} models={cat.models} />
                : <PermitDocRow key={d.key} slot={d} doc={files.docs[d.key]} busy={busyDoc === d.key}
                    onPick={(file) => pickDoc(d.key, file)} onRemove={() => files.removeDoc(d.key)} />
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
              รับไฟล์รูปหรือ PDF · รูปจะถูกย่อให้อัตโนมัติ · PDF ไม่เกิน 1.6 MB ต่อไฟล์
            </div>
          </SurveyBlock>

          <SurveyBlock title="📮 บันทึกการยื่นการไฟฟ้า" sub="เลขที่คำขอกับวันที่ ใช้ตอนลูกค้าโทรถามความคืบหน้า">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
              <PermitFilingField label="เลขที่คำขอของการไฟฟ้า" value={p.reqNo} placeholder="เลขที่ที่ได้รับตอนยื่น"
                onSave={(v) => onPatch({ reqNo: v })} />
              <PermitFilingField label="ยื่นวันที่" type="date" value={p.filedDate} onSave={(v) => onPatch({ filedDate: v })} />
              <PermitFilingField label="วันที่การไฟฟ้าอนุมัติ" type="date" value={p.approvedDate} onSave={(v) => onPatch({ approvedDate: v })} />
              <PermitFilingField label="นัดตรวจ / นัดเปลี่ยนมิเตอร์" type="date" value={p.inspectDate} onSave={(v) => onPatch({ inspectDate: v })} />
              <div style={{ gridColumn: "1 / -1" }}>
                <PermitFilingField label="บันทึกภายในฝ่ายขออนุญาต" value={p.adminNote}
                  placeholder="เช่น การไฟฟ้าขอ SLD ฉบับแก้ไข ส่งเพิ่มแล้ว 12 ส.ค." onSave={(v) => onPatch({ adminNote: v })} />
              </div>
            </div>
            {(p.statusAt || p.byAdmin) && (
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                อัปเดตสถานะล่าสุด {p.statusAt ? thDate(String(p.statusAt).slice(0, 10), true) : "—"}{p.byAdmin ? " โดย " + p.byAdmin : ""}
              </div>
            )}
          </SurveyBlock>

          {p.rejectReason && (
            <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)", fontSize: 12.5, color: "var(--tint-red-tx)", lineHeight: 1.55 }}>
              <b>เหตุผลที่ตีกลับ:</b> {p.rejectReason}
            </div>
          )}
        </div>

        {/* ปุ่มเดินสถานะ */}
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom, 0px))" : 12,
          borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          {rejecting ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ตีกลับเพราะอะไร — ช่างจะเห็นข้อความนี้"
                style={Object.assign({}, P_INPUT, { flex: 1, minWidth: 180, fontSize: 13 })} />
              <button onClick={() => { stamp("rejected", { rejectReason: reason.trim() || "ต้องแก้ไขข้อมูล" }); setRejecting(false); }}
                style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ตีกลับ</button>
              <button onClick={() => setRejecting(false)}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setRepHtml(permitReportHTML(job, media.photos, files.docs, cat.sheets))}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 15px", borderRadius: 10,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
                <Icon name="file" size={15} /> ออกเป็น PDF
              </button>
              <button onClick={onOpenJob}
                style={{ padding: "10px 15px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>เปิดงาน</button>
              <span style={{ flex: 1 }} />
              {p.status !== "approved" && (
                <button onClick={() => setRejecting(true)}
                  style={{ padding: "10px 15px", borderRadius: 10, border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ตีกลับให้ช่างแก้</button>
              )}
              {(p.status === "sent" || p.status === "rejected") && (
                <button onClick={() => stamp("filing", Object.assign({ rejectReason: null }, p.filedDate ? {} : { filedDate: new Date().toISOString().slice(0, 10) }))}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#3B82F6", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>รับงาน · เริ่มยื่น</button>
              )}
              {p.status === "filing" && (
                <button onClick={() => stamp("approved", p.approvedDate ? {} : { approvedDate: new Date().toISOString().slice(0, 10) })}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>การไฟฟ้าอนุมัติแล้ว</button>
              )}
            </div>
          )}
        </div>
      </div>

      {repHtml && typeof SuReportView === "function" && (
        <SuReportView html={repHtml} onClose={() => setRepHtml(null)} title={"ชุดข้อมูลขออนุญาต " + job.code} />
      )}
    </div>
  );
}

/* ================================================================
   permitReportHTML — เอกสาร A4 สำหรับแนบยื่นการไฟฟ้า
   หน้าแรกเป็นตารางข้อมูล หน้าถัดไปเป็นแผ่นรูปถ่ายพร้อมคำบรรยาย
   ================================================================ */
function permitReportHTML(job, photos, docs, sheets) {
  const p = (job && job.permit) || {};
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const v = (x) => (x == null || x === "" ? "—" : esc(x));
  const typeTh = (PERMIT_TYPES.find((x) => x.key === p.permitType) || {}).th || "—";
  const yn = (x) => (x === "yes" ? "มี" : x === "no" ? "ไม่มี" : "—");
  const shots = PERMIT_PHOTO_SLOTS.filter((s) => photos[s.key] && photos[s.key].dataUrl);
  const dc = docs || {};
  /* เอกสารที่แนบมาเป็นรูป พิมพ์ต่อท้ายได้เลยหน้าละใบ · ไฟล์ PDF พิมพ์รวมไม่ได้ ต้องแนบแยก */
  const docImgs = PERMIT_DOC_SLOTS.filter((d) => dc[d.key] && dc[d.key].dataUrl && dc[d.key].kind === "image");
  const docPdfs = PERMIT_DOC_SLOTS.filter((d) => dc[d.key] && dc[d.key].dataUrl && dc[d.key].kind !== "image");
  /* DATA SHEET ของแผง/อินเวอร์เตอร์ มาจากคลัง ไม่ได้อยู่ในชุดเอกสารของงาน */
  const sh = sheets || [];
  const shImgs = sh.filter((x) => x.kind === "image");
  const shPdfs = sh.filter((x) => x.kind !== "image");

  const tr = (a, b) => '<tr><th>' + esc(a) + '</th><td>' + b + '</td></tr>';
  const invRows = (p.invs || []).map((iv, i) =>
    tr("อินเวอร์เตอร์ตัวที่ " + (i + 1), v(iv.model) + ' &nbsp;·&nbsp; <b>S/N ' + v(iv.sn) + "</b>")).join("");

  /* รูปวางแผ่นละ 4 ใบ — ขนาดนี้ยังอ่านซีเรียลบนเนมเพลทออกตอนพิมพ์ลงกระดาษ */
  const pages = [];
  for (let i = 0; i < shots.length; i += 4) pages.push(shots.slice(i, i + 4));
  const photoPages = pages.map((grp, pi) => (
    '<section class="pg"><h2>ภาพถ่ายการติดตั้ง (' + (pi + 1) + "/" + pages.length + ")</h2>" +
    '<div class="grid">' + grp.map((s, k) => (
      '<figure><img src="' + photos[s.key].dataUrl + '" alt="" />' +
      "<figcaption><b>" + (pi * 4 + k + 1) + ". " + esc(s.label) + "</b><span>" + esc(s.group) + "</span></figcaption></figure>"
    )).join("") + "</div></section>"
  )).join("");

  const sheetPages = shImgs.map((x) => (
    '<section class="pg"><h2>แคตตาล็อก / DATA SHEET — ' + esc(x.label) + "</h2>" +
    '<img class="doc" src="' + x.dataUrl + '" alt="" />' +
    '<div class="foot"><span>' + esc(x.name || "") + "</span><span>จากคลังสินค้า</span></div></section>"
  )).join("") + (shPdfs.length
    ? '<section class="pg"><h2>แคตตาล็อก / DATA SHEET (ไฟล์ PDF)</h2><div class="todo">' +
      "อยู่ในคลังสินค้า พิมพ์แยกจากหน้ารายการของรุ่นนั้น:<br />" +
      shPdfs.map((x) => "· " + esc(x.label) + (x.name ? " (" + esc(x.name) + ")" : "")).join("<br />") +
      "</div></section>"
    : "");

  const docPages = docImgs.map((d) => (
    '<section class="pg"><h2>เอกสารแนบ — ' + esc(d.label) + "</h2>" +
    '<img class="doc" src="' + dc[d.key].dataUrl + '" alt="" />' +
    (dc[d.key].name ? '<div class="foot"><span>' + esc(dc[d.key].name) + "</span></div>" : "") +
    "</section>"
  )).join("") + (docPdfs.length
    ? '<section class="pg"><h2>เอกสารแนบที่เป็นไฟล์ PDF</h2><div class="todo">' +
      "พิมพ์รวมในชุดนี้ไม่ได้ ต้องพิมพ์แยกจากระบบ:<br />" +
      docPdfs.map((d) => "· " + esc(d.label) + (dc[d.key].name ? " (" + esc(dc[d.key].name) + ")" : "")).join("<br />") +
      "</div></section>"
    : "");

  return '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8" />' +
    "<title>ชุดข้อมูลขออนุญาต " + esc(job.code) + "</title>" +
    '<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />' +
    "<style>" +
    "@page{size:A4;margin:14mm 13mm}" +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    "body{font-family:'IBM Plex Sans Thai',sans-serif;color:#15211A;font-size:11.5px;line-height:1.5;background:#fff}" +
    ".pg{page-break-after:always;break-after:page}.pg:last-child{page-break-after:auto;break-after:auto}" +
    ".hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #22A35B;padding-bottom:9px;margin-bottom:14px}" +
    ".hd .t{flex:1}.hd h1{font-size:16px;font-weight:700;color:#14663A}.hd .s{font-size:11px;color:#55645B;margin-top:2px}" +
    ".hd .code{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#14663A}" +
    "h2{font-size:12.5px;font-weight:700;color:#14663A;margin:14px 0 7px;padding-bottom:4px;border-bottom:1px solid #CFDAD3}" +
    ".pg>h2:first-child{margin-top:0}" +
    "table{width:100%;border-collapse:collapse;margin-bottom:2px}" +
    "th,td{border:1px solid #E3EAE5;padding:5px 8px;text-align:left;vertical-align:top}" +
    "th{background:#F5F9F6;font-weight:600;color:#55645B;width:34%;font-size:11px}" +
    "td{font-weight:600}" +
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}" +
    "figure{border:1px solid #E3EAE5;border-radius:5px;overflow:hidden;break-inside:avoid;page-break-inside:avoid}" +
    "figure img{display:block;width:100%;height:56mm;object-fit:cover}" +
    "figcaption{padding:5px 7px;background:#F5F9F6;font-size:10px;border-top:1px solid #E3EAE5}" +
    "figcaption b{display:block;color:#15211A}figcaption span{color:#93A399;font-size:9px}" +
    ".note{margin-top:10px;padding:8px 10px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:5px;font-size:10.5px;color:#B45309}" +
    ".todo{margin-top:10px;padding:9px 11px;background:#F5F9F6;border:1px solid #E3EAE5;border-radius:5px;font-size:10.5px;color:#55645B;line-height:1.75}" +
    "img.doc{display:block;width:100%;max-height:245mm;object-fit:contain;border:1px solid #E3EAE5;border-radius:4px}" +
    ".todo .ok{color:#14663A;font-weight:600;margin-right:9px;white-space:nowrap}" +
    ".todo .no{color:#B45309;margin-right:9px;white-space:nowrap}" +
    ".foot{margin-top:14px;padding-top:7px;border-top:1px solid #E3EAE5;font-size:9.5px;color:#93A399;display:flex;justify-content:space-between}" +
    "</style></head><body>" +

    '<section class="pg">' +
    '<div class="hd"><div class="t"><h1>ชุดข้อมูลขออนุญาตเชื่อมต่อระบบโครงข่ายไฟฟ้า</h1>' +
    '<div class="s">PHITHAN GREEN · เก็บข้อมูลหน้างานโดยช่างติดตั้ง</div></div>' +
    '<div class="code">' + esc(job.code) + "</div></div>" +

    "<h2>ผู้ขอใช้ไฟ / สถานที่ติดตั้ง</h2><table>" +
    tr("ชื่อผู้ใช้ไฟ", v(job.name)) +
    tr("ที่อยู่ / จังหวัด", v([job.address, job.province].filter(Boolean).join(" · "))) +
    tr("โทรศัพท์", v(job.phone)) +
    tr("พิกัด GPS", p.gps ? esc(p.gps.lat + ", " + p.gps.lng) : "—") +
    "</table>" +

    "<h2>ประเภทคำขอ & จุดรับไฟ</h2><table>" +
    tr("ประเภทการขออนุญาต", esc(typeTh)) +
    tr("การไฟฟ้าที่ยื่น", v([p.auth, p.branch].filter(Boolean).join(" · "))) +
    tr("หมายเลขผู้ใช้ไฟฟ้า (CA)", v(p.ca)) +
    tr("หมายเลขมิเตอร์", v(p.meterNo)) +
    tr("ขนาดมิเตอร์ / ระบบไฟ", v([p.meterSize, p.phase ? p.phase + " เฟส" : ""].filter(Boolean).join(" · "))) +
    tr("หมายเลขเสาไฟต้นที่รับไฟ", v(p.poleNo)) +
    "</table>" +

    "<h2>ระบบไฟฟ้าเดิม</h2><table>" +
    tr("เมนเบรกเกอร์", v([p.mainAT ? p.mainAT + " AT" : "", p.mainAF ? p.mainAF + " AF" : ""].filter(Boolean).join(" / "))) +
    tr("ขนาดสายเมน", v(p.mainCable)) +
    tr("ตู้ MDB", v(p.mdbBrand)) +
    tr("เมนชนิดกันดูด (RCD/RCCB)", yn(p.rccb)) +
    (p.permitType === "biz" ? tr("หม้อแปลง", v([p.trafoKva ? p.trafoKva + " kVA" : "", p.trafoVolt].filter(Boolean).join(" · "))) : "") +
    "</table>" +

    "<h2>ระบบผลิตไฟฟ้าที่ติดตั้ง</h2><table>" +
    tr("ขนาดติดตั้ง", v([p.kwp ? p.kwp + " kWp (DC)" : "", p.kwac ? p.kwac + " kW (AC)" : ""].filter(Boolean).join(" · "))) +
    tr("แผงโซลาร์", v([p.panelModel, p.panelWatt ? p.panelWatt + " W" : "", p.panelQty ? "จำนวน " + p.panelQty + " แผ่น" : ""].filter(Boolean).join(" · "))) +
    tr("Serial แผง (ตัวอย่าง)", v((p.panelSns || []).filter(Boolean).join(", "))) +
    invRows +
    tr("เบรกเกอร์ AC ของระบบ", v(p.acBreaker)) +
    tr("DC Isolator", yn(p.dcIsolator)) +
    tr("ระบบกันไฟไหลย้อน", p.zeroExport === "yes" ? ("มี" + (p.eldModel ? " · " + esc(p.eldModel) : "")) : yn(p.zeroExport)) +
    tr("วันที่ติดตั้งแล้วเสร็จ", p.doneDate ? esc(window.thDate ? window.thDate(p.doneDate, true) : p.doneDate) : "—") +
    tr("ช่างผู้เก็บข้อมูล", v(p.submittedBy || p.byName)) +
    "</table>" +

    "<h2>บันทึกการยื่น</h2><table>" +
    tr("เลขที่คำขอของการไฟฟ้า", v(p.reqNo)) +
    tr("ยื่นเมื่อ", p.filedDate ? esc(window.thDate ? window.thDate(p.filedDate, true) : p.filedDate) : "—") +
    tr("นัดตรวจ / เปลี่ยนมิเตอร์", p.inspectDate ? esc(window.thDate ? window.thDate(p.inspectDate, true) : p.inspectDate) : "—") +
    tr("การไฟฟ้าอนุมัติเมื่อ", p.approvedDate ? esc(window.thDate ? window.thDate(p.approvedDate, true) : p.approvedDate) : "—") +
    "</table>" +

    (p.note ? '<div class="note"><b>หมายเหตุจากหน้างาน:</b> ' + esc(p.note) + "</div>" : "") +
    (p.adminNote ? '<div class="note"><b>บันทึกฝ่ายขออนุญาต:</b> ' + esc(p.adminNote) + "</div>" : "") +

    '<div class="todo"><b>เอกสารประกอบคำขอ (ฝ่ายขออนุญาตรวบรวม):</b><br />' +
    PERMIT_DOC_SLOTS.map((d) => {
      const on = d.key === "catalog" ? sh.length > 0 : !!(dc[d.key] && dc[d.key].dataUrl);
      return '<span class="' + (on ? "ok" : "no") + '">' + (on ? "✔" : "✗") + " " + esc(d.label) + "</span>";
    }).join(" ") + "</div>" +

    '<div class="foot"><span>PHITHAN GREEN · ' + esc(job.code) + "</span><span>พิมพ์เมื่อ " +
    esc(new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })) + "</span></div>" +
    "</section>" + photoPages + docPages + sheetPages + "</body></html>";
}

Object.assign(window, { PermitQueueView, PermitReview, permitReportHTML, PermitCard, PERMIT_COLS });
