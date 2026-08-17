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
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      style={{ width: 262, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 18,
        background: isOver ? col.soft : "var(--surface2)", border: "1px solid " + (isOver ? col.color : "var(--border)"),
        opacity: dimmed ? 0.5 : 1, transition: "background .15s, border-color .15s, opacity .15s" }}>
      {/* หัวคอลัมน์ค้างบนสุดเวลาเลื่อน ต้องมีพื้นทึบ ไม่งั้นการ์ดที่เลื่อนลอดใต้หัวจะทะลุขึ้นมาซ้อนตัวหนังสือ */}
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 1,
        background: isOver ? col.soft : "var(--surface2)", borderRadius: "17px 17px 0 0", transition: "background .15s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: col.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-2)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.th}</span>
          </span>
          <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.02em",
            color: count ? "var(--text-1)" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
        </div>
        {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{sub}</div>}
      </div>
      <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto", flex: 1, minHeight: 80 }}>
        {children}
        {count === 0 && (
          <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)",
            border: "1.5px dashed var(--border-strong)", borderRadius: 10 }}>{isOver ? "วางที่นี่" : "ว่าง"}</div>
        )}
      </div>
    </div>
  );
}

/* ── แถบหัวช่วง + โหมดพับ ──
   พับแล้วเหลือแท่งแคบแนวตั้ง ยังบอกชื่อช่วงกับจำนวนใบอยู่ จะได้รู้ว่าพับอะไรไว้ */
function FlGroup({ g, count, collapsed, onToggle, children }) {
  if (collapsed) {
    return (
      <button onClick={onToggle} title={"กางช่วง " + g.th}
        style={{ width: 52, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          padding: "14px 0", borderRadius: 18, border: "1px solid var(--border)", background: "var(--surface2)",
          cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ transform: "rotate(-90deg)" }} />
        <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--text-1)",
          fontVariantNumeric: "tabular-nums" }}>{count}</span>
        <span style={{ writingMode: "vertical-rl", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em",
          color: "var(--text-2)", whiteSpace: "nowrap" }}>{g.th}</span>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: g.color, marginTop: "auto" }} />
      </button>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, minHeight: 0 }}>
      {/* กดที่แถบหัวช่วงตรงไหนก็พับได้ ไม่ต้องเล็งปุ่มเล็ก ๆ ด้านขวา */}
      <div onClick={onToggle} title={"พับช่วง " + g.th}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 2px", cursor: "pointer" }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: g.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", color: "var(--text-2)" }}>{g.th}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{count}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.hint}</span>
        {/* ปุ่มอยู่ในแถบที่กดได้ทั้งแถบ ต้องหยุดไม่ให้คลิกลอยขึ้นไปสั่งพับซ้ำ ไม่งั้นพับแล้วกางทันทีเหมือนกดไม่ติด */}
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label={"พับช่วง " + g.th}
          style={{ marginLeft: "auto", width: 26, height: 26, borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>{children}</div>
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
  out.push({ key: "site", th: "หน้างาน", color: "var(--primary)", kind: "job",
    hint: doc ? "งานที่กำลังเดินอยู่" : "งานในฐานข้อมูล",
    cols: doc ? window.SF.STAGES.filter((s) => s.key !== "done") : window.SF.STAGES });
  if (doc) out.push({ key: "doc", th: "เอกสาร", color: "#0EA5E9", kind: "permit",
    hint: "ติดตั้งเสร็จแล้ว รอเดินเรื่องการไฟฟ้า", cols: PERMIT_COLS });
  return out;
}

/* ยอดมูลค่าที่คาดของคอลัมน์ขาย — บอร์ดขายเดิมโชว์ไว้ใต้ชื่อคอลัมน์ ยกมาให้เหมือนกัน */
const flSumValue = (leadsArr) => {
  const sum = leadsArr.reduce((s, l) => s + (+l.expValue || 0), 0);
  return sum > 0 ? "มูลค่ารวม ฿" + fmtBaht(sum) : null;
};

function FlowBoardView({ jobs, leads, quotes, search, role, currentUser,
  onOpenJob, onOpenLead, onMoveStage, onPatchLead, onPatchPermit, onOpenReview }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const groups = React.useMemo(() => flGroups(role), [role]);
  const hasDoc = groups.some((g) => g.key === "doc");
  const canMoveJob = window.can(role, "editJob");

  const [collapsed, setCollapsed] = React.useState(flReadCollapsed);
  const toggle = (k) => setCollapsed((c) => {
    const next = Object.assign({}, c, { [k]: !c[k] });
    try { localStorage.setItem(FL_GRP_KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  });

  /* drag = { id, kind } — จำชนิดไว้ด้วย เพราะบอร์ดนี้มีทั้งลูกค้าและงานอยู่บนผืนเดียวกัน
     ลากข้ามชนิดไม่ได้ (ลูกค้ากับงานคนละตาราง เดินขั้นแทนกันไม่ได้) */
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const clearDrag = () => { setDrag(null); setOver(null); };

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
    const site = {}, doc = {};
    (SF.STAGES || []).forEach((s) => { site[s.key] = []; });
    PERMIT_COLS.forEach((c) => { doc[c.key] = []; });
    (jobs || []).forEach((j) => {
      if (hasDoc && j.stage === "done") {
        const pk = permitColOf(j);
        (doc[pk] || doc.todo).push(j);   // สถานะที่ไม่รู้จักไปกองที่ "ยังไม่เริ่ม" ดีกว่าหายไปจากบอร์ด
        return;
      }
      if (site[j.stage]) site[j.stage].push(j);
      else site[(SF.STAGES[0] || {}).key].push(j);   // ขั้นที่ไม่รู้จัก ต้องไม่หายไปจากบอร์ด
    });
    Object.keys(site).forEach((k) => site[k].sort(byInstallDate));
    Object.keys(doc).forEach((k) => doc[k].sort((a, b) =>
      String((b.permit || {}).submittedAt || (b.permit || {}).updatedAt || b.code || "")
        .localeCompare(String((a.permit || {}).submittedAt || (a.permit || {}).updatedAt || a.code || ""))));
    return { site, doc };
  }, [jobs, hasDoc]);

  const leadCols = React.useMemo(() => {
    const m = {};
    SALES_STAGES.forEach((s) => { m[s.key] = []; });
    leadPool.forEach((l) => { const k = salesStageKey(l); (m[k] || (m[k] = [])).push(l); });
    Object.keys(m).forEach((k) => m[k].sort((a, b) => {
      /* คนที่เลยวันติดตามอยู่บนสุด — บอร์ดนี้มีไว้บอกว่าวันนี้ต้องโทรหาใคร */
      const la = sOverdue(a.nextFollow) ? 0 : 1, lb = sOverdue(b.nextFollow) ? 0 : 1;
      if (la !== lb) return la - lb;
      return String(a.nextFollow || "9999-99-99").localeCompare(String(b.nextFollow || "9999-99-99"));
    }));
    return m;
  }, [leadPool]);

  const cardsOf = (g, key) => (g.kind === "lead" ? leadCols[key]
    : g.kind === "permit" ? jobCols.doc[key]
    : jobCols.site[key]) || [];

  /* วางลงคอลัมน์นี้ได้ไหม — ลากข้ามช่วงไม่ได้เสมอ */
  const canDrop = (g, key) => {
    if (!drag || drag.group !== g.key) return false;
    if (g.kind === "lead") return salesStageKey(drag.rec) !== key;
    if (g.kind === "job") return canMoveJob && drag.rec.stage !== key;
    const from = permitColOf(drag.rec);
    return from !== key && (PERMIT_MOVES[from] || []).indexOf(key) !== -1;
  };

  const doDrop = (g, key) => {
    const d = drag;
    clearDrag();
    if (!d || d.group !== g.key) return;
    const rec = d.rec;
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
    if (g.kind === "job") {
      if (!canMoveJob || rec.stage === key) return;
      onMoveStage(rec.id, key);
      return;
    }
    const p = rec.permit || {};
    const from = permitColOf(rec);
    if (from === key || (PERMIT_MOVES[from] || []).indexOf(key) === -1) return;
    if (key === "rejected") { if (onOpenReview) onOpenReview(rec.id); return; }   // ตีกลับต้องมีเหตุผลก่อน
    const back = PERMIT_BACK[from] === key;
    const extra = { byAdmin: (currentUser && currentUser.name) || "", adminId: (currentUser && currentUser.id) || null,
      statusAt: new Date().toISOString() };
    if (back) Object.assign(extra, PERMIT_BACK_CLEAR[key] || {});
    else {
      if (key === "filing") { extra.rejectReason = null; if (!p.filedDate) extra.filedDate = new Date().toISOString().slice(0, 10); }
      if (key === "approved") { if (!p.approvedDate) extra.approvedDate = new Date().toISOString().slice(0, 10); }
    }
    onPatchPermit(rec.id, Object.assign({ status: key }, extra));
  };

  const startDrag = (e, rec, g) => { setDrag({ id: rec.id, rec: rec, group: g.key }); e.dataTransfer.effectAllowed = "move"; };

  const renderCard = (g, rec) => {
    const dragging = !!drag && drag.id === rec.id && drag.group === g.key;
    if (g.kind === "lead")
      return <SalesCard key={g.key + rec.id} lead={rec} quotes={quotes} onOpen={onOpenLead}
        dragging={dragging} onDragStart={(e, l) => startDrag(e, l, g)} />;
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
      <div style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>
        ลากการ์ดข้ามคอลัมน์ได้เฉพาะภายในช่วงเดียวกัน · กดหัวช่วงเพื่อพับเก็บช่วงที่ไม่เกี่ยวกับงานของคุณ
      </div>
      <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 12, minHeight: 0, flex: 1, alignItems: "stretch" }}>
        {groups.map((g) => (
          <FlGroup key={g.key} g={g} count={groupCount(g)} collapsed={!!collapsed[g.key]} onToggle={() => toggle(g.key)}>
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
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%" }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: g.color, flexShrink: 0 }} />
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
                <div key={c.key} style={{ borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button onClick={() => setOpenCol((o) => Object.assign({}, o, { [k]: !isOpen }))}
                    style={{ width: "100%", padding: "11px 13px", display: "flex", alignItems: "center", gap: 9,
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      borderBottom: isOpen ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{c.th}</span>
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: c.fg || "var(--text-2)",
                        background: c.soft || "var(--surface)", minWidth: 24, height: 24, borderRadius: 99,
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
