/* ============================================================
   SolarFlow — Detail Drawer (flow timeline + full customer info)
   ============================================================ */

function FlowTimeline({ job }) {
  const SF = window.SF;
  return (
    <div style={{ position: "relative", paddingLeft: 4 }}>
      {job.timeline.map((step, i) => {
        const s = SF.STAGES[i];
        const isDone = step.status === "done";
        const isCurrent = step.status === "current";
        const isLast = i === job.timeline.length - 1;
        const dotColor = step.blocked ? "#EF4444" : (isDone || isCurrent) ? s.color : "var(--surface3)";
        return (
          <div key={step.key} style={{ display: "flex", gap: 14, position: "relative" }}>
            {/* connector + dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0,
                background: (isDone || isCurrent) && !step.blocked ? s.color : step.blocked ? "var(--tint-red-bg2)" : "var(--surface3)",
                border: isCurrent ? "2px solid " + (step.blocked ? "#EF4444" : s.color) : "2px solid transparent",
                color: "#fff", display: "grid", placeItems: "center",
                boxShadow: isCurrent ? "0 0 0 4px " + (step.blocked ? "#EF444422" : s.color + "22") : "none" }}>
                {isDone ? <Icon name="check" size={14} color="#fff" sw={2.5} />
                  : step.blocked ? <Icon name="alert" size={13} color="#EF4444" />
                  : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 99, background: "#fff" }} />
                  : <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--text-3)" }} />}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 26,
                background: isDone ? s.color : "var(--border)", marginTop: 2, marginBottom: 2 }} />}
            </div>
            {/* content */}
            <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, marginTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 600,
                  color: isDone || isCurrent ? "var(--text-1)" : "var(--text-3)" }}>{s.th}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{s.en}</span>
                {isCurrent && !step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: s.fg,
                  background: s.soft, padding: "2px 8px", borderRadius: 99 }}>ขั้นปัจจุบัน</span>}
                {step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tint-red-tx)",
                  background: "var(--tint-red-bg2)", padding: "2px 8px", borderRadius: 99 }}>⚠ ติดปัญหา</span>}
              </div>
              {(step.at || step.date) && (isDone || isCurrent) && (
                // เวลาจริงที่กดเลื่อนเข้า stage นี้ (วัน + เวลา)
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="check" size={12} color={s.color} sw={2.5} />
                  {step.at ? thDateTime(step.at) : thDate(step.date, true)}
                </div>
              )}
              {(() => {
                // โมเดลใหม่: โชว์วันกำหนดเฉพาะขั้นติดตั้ง (วันนัดติดตั้ง) — ขั้นอื่นเป็นสถานะอย่างเดียว
                if (s.key !== "install") return null;
                const st = SF.installDate ? SF.installDate(job) : "";
                const en = SF.installEnd ? SF.installEnd(job) : st;
                if (!st) return null;
                const late = (job.lateStages || []).find((ls) => ls.key === "install");
                return (
                  <div style={{ fontSize: 11.5, color: late ? "#EF4444" : "var(--text-3)", marginTop: 3, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <Icon name={late ? "alert" : "calendar"} size={11} color={late ? "#EF4444" : "var(--text-3)"} />
                    <span>นัดติดตั้ง {thDate(st, true)}{en && en !== st ? "–" + thDate(en, true) : ""}</span>
                    {late && <span style={{ fontWeight: 700, color: "#EF4444", background: "var(--tint-red-bg2)", padding: "1px 6px", borderRadius: 99 }}>เลยกำหนด {late.daysLate} วัน</span>}
                  </div>
                );
              })()}
              {step.blocked && job.problem && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)",
                  borderRadius: 10, fontSize: 12.5, color: "var(--tint-red-tx)", lineHeight: 1.5 }}>{job.problem}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "var(--text-3)", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{children}</span>
    </div>
  );
}

/* สรุปอุปกรณ์ที่เบิก/คืน ของงานนี้ + เบิกของเข้างาน (ช้อปปิ้ง) + คืน/ยกเลิกการเบิก */
function JobMaterialUsage({ job, stock, currentUser }) {
  const [retRow, setRetRow] = React.useState(null); // {item, net} ที่กำลังคืน
  const [shopOpen, setShopOpen] = React.useState(false);
  if (!stock || !job) return null;
  const moves = (stock.moves || []).filter((m) => m.jobId === job.id && (m.type === "out" || m.type === "return"));

  const byItem = {};
  moves.forEach((m) => {
    const g = byItem[m.itemId] || (byItem[m.itemId] = { itemId: m.itemId, out: 0, ret: 0 });
    if (m.type === "out") g.out += m.qty; else g.ret += m.qty;
  });
  const rows = Object.keys(byItem).map((id) => {
    const g = byItem[id];
    const it = (stock.items || []).find((x) => x.id === id);
    return { item: it, name: it ? it.name : id, unit: it ? it.unit : "", out: g.out, ret: g.ret, net: g.out - g.ret };
  }).sort((a, b) => (b.net - a.net) || (b.out - a.out));

  const byName = (currentUser && currentUser.name) || "-";
  const Cell = ({ children, color, head, left }) => (
    <span style={{ fontFamily: "var(--mono)", fontSize: head ? 10 : 13, fontWeight: 700,
      color: color || "var(--text-1)", textAlign: left ? "left" : "right", letterSpacing: head ? ".04em" : 0, textTransform: head ? "uppercase" : "none" }}>{children}</span>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="box" size={14} color="var(--text-2)" /> อุปกรณ์ที่เบิก / คืน
        {rows.length > 0 && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--text-3)", marginLeft: 2 }}>· {rows.length} รายการ</span>}
      </div>

      {/* ปุ่มเบิกของเข้างาน (ช้อปปิ้ง) */}
      <button onClick={() => setShopOpen(true)}
        style={{ width: "100%", marginBottom: rows.length ? 12 : 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px",
          background: "#7C5CFC14", border: "1px dashed #7C5CFC66", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", color: "#6645e0", fontWeight: 700, fontSize: 13.5 }}>
        <Icon name="box" size={16} color="#6645e0" /> เบิกของเข้างานนี้
      </button>

      {rows.length > 0 && (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 42px 42px 64px", gap: 8, padding: "9px 14px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
          <Cell head left color="var(--text-3)">อุปกรณ์</Cell>
          <Cell head color="#6645e0">เบิก</Cell>
          <Cell head color="#0784b8">คืน</Cell>
          <span />
        </div>
        {rows.map((r, i) => {
          const cancelled = r.out > 0 && r.net <= 0; // คืนครบ = ยกเลิกการเบิก
          return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 42px 42px 64px", gap: 8, padding: "10px 14px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", opacity: cancelled ? .6 : 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: cancelled ? "line-through" : "none" }}>{r.name}</span>
            <Cell color="#6645e0">{r.out}</Cell>
            <Cell color={r.ret ? "#0784b8" : "var(--text-3)"}>{r.ret || "–"}</Cell>
            {cancelled
              ? <span style={{ justifySelf: "end", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", background: "var(--surface2)", padding: "4px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>ยกเลิก</span>
              : <button onClick={() => r.item && setRetRow(r)} disabled={!r.item} title={"คืนของเข้าคลัง (สูงสุด " + r.net + ")"}
                  style={{ justifySelf: "end", display: "inline-flex", alignItems: "center", gap: 3, background: r.item ? "#0EA5E916" : "var(--surface2)",
                    border: "none", color: r.item ? "#0784b8" : "var(--text-3)", fontWeight: 700, fontSize: 11.5, padding: "5px 9px", borderRadius: 8,
                    cursor: r.item ? "pointer" : "default", fontFamily: "inherit", whiteSpace: "nowrap" }}>↩ คืน</button>}
          </div>
          );
        })}
      </div>
      )}

      {retRow && <MoveModal info={{ item: retRow.item, type: "return" }} byName={byName} lockedJob={job} maxQty={retRow.net}
        onSave={(qty, ref, note, jobId) => { stock.move(retRow.item.id, "return", qty, ref, note, byName, jobId); setRetRow(null); }}
        onClose={() => setRetRow(null)} />}
      {shopOpen && <StockShopModal stock={stock} job={job} byName={byName} onClose={() => setShopOpen(false)} />}
    </div>
  );
}

/* เบิกของเข้างาน — อ้างอิง BOQ ของงาน (เติมจำนวนให้อัตโนมัติ แก้ได้) + เบิกเพิ่มจากคลัง */
const _matNorm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

function StockShopModal({ stock, job, byName, onClose }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const allItems = stock.items || [];

  // ดัชนีสต็อกตามชื่อ (จับคู่กับ BOQ ด้วยชื่อวัสดุ) + ตามรหัส
  const stockByName = React.useMemo(() => {
    const m = {};
    allItems.forEach((it) => { m[_matNorm(it.name)] = it; if (it.sku) m["#" + _matNorm(it.sku)] = it; });
    return m;
  }, [allItems]);

  // แตก BOQ ของงานเป็นรายการแบน + จับคู่สต็อก
  const boqLines = React.useMemo(() => {
    if (!job || !job.boq || !window.BOQ) return [];
    const b = Object.assign(window.BOQ.blankBOQ(job), job.boq);
    let res; try { res = window.BOQ.calcBOQ(b); } catch (e) { return []; }
    const agg = {};
    (res.groups || []).forEach((g) => (g.items || []).forEach((it) => {
      const key = window.BOQ.matKey(it.name);
      const qty = Math.round(+it.qty || 0);
      if (!key || qty <= 0) return;
      const k = _matNorm(key);
      if (agg[k]) agg[k].qty += qty;
      else agg[k] = { name: key, qty, unit: it.unit, group: g.group, stockItem: stockByName[k] || null };
    }));
    return Object.values(agg);
  }, [job, stockByName]);

  const boqStockIds = React.useMemo(() => new Set(boqLines.filter((l) => l.stockItem).map((l) => l.stockItem.id)), [boqLines]);

  const [cart, setCart] = React.useState({});
  // เติมจำนวนจาก BOQ ให้อัตโนมัติครั้งแรก (จำกัดไม่เกินคงเหลือ) — แก้ +/- ได้
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (prefilled.current || boqLines.length === 0) return;
    prefilled.current = true;
    const init = {};
    boqLines.forEach((l) => { if (l.stockItem) { const q = Math.min(l.qty, l.stockItem.qty); if (q > 0) init[l.stockItem.id] = q; } });
    setCart(init);
  }, [boqLines]);

  const setQty = (id, v, max) => setCart((p) => { const n = Math.max(0, Math.min(Math.floor(+v || 0), max)); const c = Object.assign({}, p); if (n > 0) c[id] = n; else delete c[id]; return c; });

  // เบิกเพิ่มจากคลัง (ของที่ไม่ได้อยู่ใน BOQ)
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const extraItems = allItems.filter((it) => {
    if (boqStockIds.has(it.id)) return false;
    if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return false;   // เลือกหมวดหลัก = เห็นของในหมวดย่อยด้วย
    if (q && !_matNorm(it.name + " " + (it.sku || "")).includes(_matNorm(q))) return false;
    return true;
  });
  const extraCats = React.useMemo(() => {
    const present = new Set(allItems.filter((it) => !boqStockIds.has(it.id)).map((it) => SF.mainCatOf(it.cat)));
    return (SF.STOCK_CATS || []).filter((c) => present.has(c.key));
  }, [allItems, boqStockIds]);

  const cartIds = Object.keys(cart);
  const totalQty = cartIds.reduce((s, id) => s + cart[id], 0);
  const confirm = () => {
    if (!cartIds.length) return;
    cartIds.forEach((id) => stock.move(id, "out", cart[id], job.code, "", byName, job.id));
    onClose();
  };

  // แถวสเต็ปเปอร์เบิก
  const Stepper = ({ it, sub }) => {
    const inCart = cart[it.id] || 0;
    const max = it.qty;
    const out = max <= 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
          <div style={{ fontSize: 11, color: out ? "#EF4444" : "var(--text-3)", marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setQty(it.id, inCart - 1, max)} disabled={!inCart} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontSize: 17, fontWeight: 700, cursor: inCart ? "pointer" : "default", lineHeight: 1 }}>−</button>
          <input type="number" value={inCart || ""} placeholder="0" onChange={(e) => setQty(it.id, e.target.value, max)}
            style={{ width: 46, textAlign: "center", padding: "6px 4px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13 }} />
          <button onClick={() => setQty(it.id, inCart + 1, max)} disabled={out || inCart >= max} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: out || inCart >= max ? "var(--surface3)" : "var(--primary)", color: out || inCart >= max ? "var(--text-3)" : "#fff", fontSize: 17, fontWeight: 700, cursor: out || inCart >= max ? "default" : "pointer", lineHeight: 1 }}>+</button>
        </div>
      </div>
    );
  };

  const SectionHead = ({ children }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", padding: "12px 8px 6px", display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
  );

  const boqMissing = boqLines.filter((l) => !l.stockItem);

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 115, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(580px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>เบิกของเข้างาน · {job.code}</div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-1)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.name}</h2>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 8px" }}>
          {/* ── ตาม BOQ ── */}
          {boqLines.length > 0 && (
            <React.Fragment>
              <SectionHead><Icon name="list" size={13} color="var(--primary)" /> ตาม BOQ ของงาน <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--text-3)" }}>· เติมจำนวนให้แล้ว แก้ได้</span></SectionHead>
              {boqLines.filter((l) => l.stockItem).map((l) => {
                const it = l.stockItem;
                const short = l.qty > it.qty;
                return <Stepper key={"b" + it.id} it={it}
                  sub={<span>BOQ <b style={{ color: "var(--text-2)" }}>{l.qty}</b> {l.unit} · {it.qty <= 0 ? <span style={{ color: "#EF4444" }}>หมดสต็อก</span> : <span>คงเหลือ {it.qty.toLocaleString()} {it.unit}</span>}{it.sku ? " · " + it.sku : ""}{short && it.qty > 0 ? <span style={{ color: "#F59E0B" }}> · ไม่พอตาม BOQ</span> : ""}</span>} />;
              })}
              {boqMissing.length > 0 && (
                <div style={{ margin: "8px 8px 0", padding: "10px 12px", background: "var(--tint-amber-bg)", border: "1px dashed var(--tint-amber-bd)", borderRadius: 10, fontSize: 11.5, color: "var(--tint-amber-tx)", lineHeight: 1.55 }}>
                  <b>{boqMissing.length} รายการใน BOQ ยังไม่มีในคลัง</b> — เพิ่มวัสดุ + สร้างรหัสในหน้า “คลังสินค้า” เพื่อให้เบิกได้:
                  <div style={{ marginTop: 4, color: "#7a5208" }}>{boqMissing.slice(0, 6).map((l) => l.name).join(" · ")}{boqMissing.length > 6 ? " …" : ""}</div>
                </div>
              )}
            </React.Fragment>
          )}

          {/* ── เบิกเพิ่มจากคลัง ── */}
          <SectionHead><Icon name="box" size={13} color="var(--text-2)" /> เบิกเพิ่มจากคลัง</SectionHead>
          <div style={{ display: "flex", gap: 8, padding: "2px 8px 8px", flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-box" style={{ flex: 1, minWidth: 160 }}><Icon name="search" size={15} color="var(--text-3)" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาอุปกรณ์ / รหัส..." /></div>
          </div>
          <div style={{ display: "flex", gap: 6, padding: "0 8px 6px", flexWrap: "wrap" }}>
            <CatChip active={cat === "all"} onClick={() => setCat("all")} label="ทุกหมวด" color="var(--text-2)" />
            {extraCats.map((c) => <CatChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.th} color={c.color} />)}
          </div>
          {extraItems.map((it) => (
            <Stepper key={"x" + it.id} it={it} sub={<span>{it.qty <= 0 ? <span style={{ color: "#EF4444" }}>หมดสต็อก</span> : "คงเหลือ " + it.qty.toLocaleString() + " " + it.unit}{it.sku ? " · " + it.sku : ""}</span>} />
          ))}
          {extraItems.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ไม่พบอุปกรณ์อื่นในคลัง</div>}
        </div>

        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={confirm} disabled={!cartIds.length}
            style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: cartIds.length ? "var(--primary)" : "var(--surface3)", color: cartIds.length ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: cartIds.length ? "pointer" : "default" }}>
            เบิกเข้างาน{cartIds.length ? " (" + cartIds.length + " รายการ · " + totalQty + " ชิ้น)" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── บล็อกสรุปสำหรับฝ่ายขออนุญาต ──
   เขาไม่ได้เข้ามาแก้งาน เข้ามาเพื่อตอบ 2 คำถาม: "ใบนี้เดินไปถึงไหน" กับ "ติดอะไรอยู่"
   ทุกอย่างที่กดแล้วเปลี่ยนข้อมูลงานจึงถูกซ่อน เหลือแต่ของที่ต้องหยิบไปยื่น */
function PermitJobSummary({ job, onOpenReview }) {
  const p = job.permit || null;
  const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
  const FLOW = window.PERMIT_FLOW || [];
  const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
  const rejected = !!(p && p.status === "rejected");
  const color = pst ? pst.color : "#94A3B8";

  /* ยังขาดอะไร — นับเฉพาะช่องข้อมูล ส่วนรูปไปตรวจกันที่การ์ดบนบอร์ด */
  const missing = React.useMemo(() => {
    if (!p || !window.permitMissing) return [];
    try { return window.permitMissing(p, null).filter((m) => m.kind === "field"); } catch (e) { return []; }
  }, [p]);

  /* ติดอะไรอยู่ — เรียงจากเรื่องที่ต้องลงมือก่อน */
  const blockers = [];
  if (rejected) blockers.push({ tone: "bad", th: "ตีกลับให้ช่างแก้", detail: (p.rejectReason || "ไม่ได้ระบุเหตุผล") + (p.byAdmin ? " · โดย " + p.byAdmin : "") });
  if (!p || !p.status) blockers.push({ tone: "warn", th: "ช่างยังไม่ได้เริ่มเก็บข้อมูลขออนุญาต", detail: "ยังไม่มีชุดข้อมูลให้ยื่น" });
  else if (p.status === "draft") blockers.push({ tone: "warn", th: "ช่างยังเก็บข้อมูลไม่ครบ", detail: "ยังไม่ได้กดส่งให้ฝ่ายขออนุญาต" });
  if (missing.length) blockers.push({ tone: "warn", th: "ข้อมูลยังขาด " + missing.length + " ช่อง", detail: missing.slice(0, 6).map((m) => m.th).join(" · ") + (missing.length > 6 ? " …" : "") });
  if (!job.hasDesign) blockers.push({ tone: "warn", th: "ยังไม่มีไฟล์แบบแนบกับงาน", detail: "SLD อยู่ในไฟล์แบบ ถ้าไม่มีจะยื่นไม่ได้" });
  if (job.problem) blockers.push({ tone: "warn", th: "ปัญหาหน้างานที่ช่างบันทึกไว้", detail: String(job.problem) });

  const TONE = { bad: { bg: "var(--tint-red-bg)", bd: "var(--tint-red-bd)", tx: "var(--tint-red-tx)" },
                 warn: { bg: "var(--tint-amber-bg)", bd: "#F59E0B55", tx: "#B45309" } };

  const Line = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", boxShadow: "inset 0 -1px 0 var(--border)" }}>
      <span style={{ fontSize: 11.5, color: "var(--text-3)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", textAlign: "right", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );

  const s = job.survey || {};
  const filing = [
    ["การไฟฟ้า", (p && p.auth) || s.meterAuth],
    ["สาขา / เขต", (p && p.branch) || s.branch],
    ["เลขที่ผู้ใช้ไฟ (CA)", (p && p.ca) || s.ca],
    ["หมายเลขมิเตอร์", (p && p.meterNo) || s.meterNo],
    ["ขนาดมิเตอร์", (p && p.meterSize) || s.meterSize],
    ["เสาไฟต้นที่", (p && p.poleNo) || s.poleNo],
    ["ระบบไฟฟ้า", ((p && p.phase) || s.phase || job.phase || "1") + " เฟส"],
    ["เมนเบรกเกอร์", p && p.mainAT ? p.mainAT + " AT / " + (p.mainAF || "—") + " AF" : s.mainBreaker],
    ["กำลังติดตั้ง", (p && p.kwp ? p.kwp : job.kw) + " kWp" + (p && p.kwac ? " · " + p.kwac + " kW AC" : "")],
    ["แผง", (p && p.panelModel) || s.panelModel ? ((p && p.panelModel) || s.panelModel) + " × " + ((p && p.panelQty) || job.panels || "—") : ""],
    ["อินเวอร์เตอร์", p && (p.invs || []).length ? p.invs.map((iv) => iv.model || "—").join(" · ") : (s.invModel || "")],
  ];

  return (
    <React.Fragment>
      {/* ขั้นตอนถึงไหน */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "3px solid " + color,
        borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <Icon name="shield" size={16} color={color} />
          <span style={{ fontSize: 14, fontWeight: 800, color: color }}>{pst ? pst.th : "ยังไม่เริ่มเก็บข้อมูล"}</span>
          {p && p.auth && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>· {p.auth}{p.branch ? " " + p.branch : ""}</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {FLOW.map((st, i) => {
            const done = i < idx, now = i === idx;
            const c = rejected && now ? "#EF4444" : (done || now ? "var(--primary)" : "var(--border-strong)");
            return (
              <span key={st.key} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", height: 4, borderRadius: 99, background: c, opacity: done ? .55 : 1 }} />
                <span style={{ display: "block", marginTop: 5, fontSize: 9.5, lineHeight: 1.3,
                  fontWeight: now ? 800 : 600, color: now ? (rejected ? "#EF4444" : "var(--primary-dark)") : "var(--text-3)" }}>{st.th}</span>
              </span>
            );
          })}
        </div>
        {/* วันยื่น/นัดตรวจ/อนุมัติ แสดงเมื่อไปถึงขั้นนั้นจริงเท่านั้น — ค่าที่ค้างไว้จากตอนกรอกไม่ได้แปลว่ายื่นแล้ว */}
        {(() => {
          if (!p) return null;
          const filed = p.status === "filing" || p.status === "approved";
          const done = p.status === "approved";
          const bits = [];
          if (p.reqNo && filed) bits.push(<span key="r">คำร้อง <b style={{ fontFamily: "var(--mono)" }}>{p.reqNo}</b></span>);
          if (p.filedDate && filed) bits.push(<span key="f">ยื่น {thDate(p.filedDate, true)}</span>);
          if (p.inspectDate && filed) bits.push(<span key="i">นัดตรวจ {thDate(p.inspectDate, true)}</span>);
          if (p.approvedDate && done) bits.push(<span key="a" style={{ color: "var(--primary-dark)", fontWeight: 700 }}>อนุมัติ {thDate(p.approvedDate, true)}</span>);
          if (!bits.length) return null;
          return <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-2)", display: "flex", gap: 12, flexWrap: "wrap" }}>{bits}</div>;
        })()}
      </div>

      {onOpenReview && (
        <button onClick={onOpenReview}
          style={{ width: "100%", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "#14B8A61c", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="file" size={17} color="#14B8A6" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>เปิดชุดข้อมูลขออนุญาต</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>ดูข้อมูล/รูป/เอกสารทั้งชุด · เดินสถานะ · ตีกลับ · ออก PDF</span>
          </span>
          <Icon name="arrowRight" size={16} color="var(--text-3)" />
        </button>
      )}

      {/* ติดอะไรอยู่ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 9 }}>
          ติดอะไรอยู่
        </div>
        {blockers.length === 0 ? (
          <div style={{ padding: "11px 13px", borderRadius: 11, background: "var(--primary-soft)", border: "1px solid var(--primary)",
            fontSize: 12.5, fontWeight: 700, color: "var(--primary-dark)" }}>ไม่ติดอะไร · ข้อมูลและไฟล์แบบครบพร้อมยื่น</div>
        ) : blockers.map((b, i) => {
          const t = TONE[b.tone];
          return (
            <div key={i} style={{ marginBottom: 7, padding: "10px 12px", borderRadius: 11, background: t.bg, border: "1px solid " + t.bd }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: t.tx }}>{b.th}</div>
              <div style={{ fontSize: 12, color: t.tx, marginTop: 3, lineHeight: 1.55 }}>{b.detail}</div>
            </div>
          );
        })}
      </div>

      {/* ไฟล์แบบที่ต้องหยิบไปแนบ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 9 }}>
          ไฟล์แบบที่แนบกับงาน
        </div>
        {window.PermitJobFiles ? <window.PermitJobFiles jobId={job.id} /> : null}
      </div>

      {/* ข้อมูลสำหรับกรอกใบคำขอ */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>
          ข้อมูลสำหรับกรอกใบคำขอ
        </div>
        {filing.map(([label, value]) => <Line key={label} label={label} value={value} />)}
      </div>
    </React.Fragment>
  );
}

function DetailDrawer({ job, onClose, onAdvance, onSetMat, onEdit, currentUser, canManage, canDesign, stock, onSaveBOQ, onSurvey, onSurveyReport, onPermit, onDaily, priceMap, permitMode, onOpenReview, salesMode, quotes, onOpenQuote }) {
  const SF = window.SF;
  // ฝ่ายขออนุญาตกับเซลล์เปิดใบงานได้ แต่ไม่ใช่คนทำงานหน้างาน — ซ่อนเครื่องมือช่างทั้งชุด
  const roMode = permitMode || salesMode;
  const open = !!job;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job ? job.id : null); // รูป + คอมเมนต์ของงานนี้
  const [boqOpen, setBoqOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [plan3dOpen, setPlan3dOpen] = React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);   // ออกแบบระบบ/ผลผลิต — เข้าตรงไม่ผ่านจอ 3 มิติ
  React.useEffect(() => { setBoqOpen(false); setPlanOpen(false); setPlan3dOpen(false); setDesignOpen(false); }, [job ? job.id : null]);

  /* loading state — กดปุ่มแล้วแสดง "กำลังบันทึก..." ทันที
     reset เมื่อ Firebase confirm แล้ว (job.stage เปลี่ยน) */
  const [advancing, setAdvancing] = React.useState(false);
  React.useEffect(() => { setAdvancing(false); }, [job ? job.stage : null]);

  const handleAdvance = () => {
    if (advancing) return;
    setAdvancing(true);
    onAdvance(job.id);
    // safety reset: ถ้า Firebase ไม่ตอบใน 6s ให้ปลดล็อกปุ่ม
    setTimeout(() => setAdvancing(false), 6000);
  };
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.34)",
        backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity .3s", zIndex: 80 }} />
      <aside className="drawer-panel" style={{ position: "fixed", top: 0, right: 0, width: "min(540px, 94vw)",
        height: "100dvh", maxHeight: "100dvh",
        background: "var(--bg)", boxShadow: "-20px 0 60px rgba(8,20,14,.18)", zIndex: 90,
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .34s cubic-bezier(.3,.9,.3,1)",
        display: "flex", flexDirection: "column" }}>
        {job && (
          <React.Fragment>
            {/* header */}
            <div style={{ padding: isMobile ? "15px 16px" : "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--primary-dark)",
                      background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 6 }}>{job.code}</span>
                    <TypeBadge type={job.type} />
                    {job.delayed && <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "var(--tint-red-bg2)", padding: "2px 8px", borderRadius: 6 }}>⚠ ล่าช้า</span>}
                  </div>
                  <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1.25 }}>{job.name}</h2>
                </div>
                <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
                  <Icon name="x" size={18} />
                </button>
              </div>
              {/* progress */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                {permitMode ? (() => {
                  /* ความคืบหน้าที่ฝ่ายขออนุญาตสนใจคือใบขออนุญาต ไม่ใช่งานติดตั้งที่จบไปแล้ว */
                  const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
                  const n = (window.PERMIT_FLOW || []).length || 4;
                  const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
                  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / n) * 100);
                  const c = pst ? pst.color : "#94A3B8";
                  return (
                    <React.Fragment>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c, background: c + "16", border: "1px solid " + c + "33",
                        borderRadius: 99, padding: "4px 11px", whiteSpace: "nowrap" }}>{pst ? pst.th : "ยังไม่เริ่มเก็บข้อมูล"}</span>
                      <div style={{ flex: 1 }}><ProgressBar pct={pct} color={c} /></div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{pct}%</span>
                    </React.Fragment>
                  );
                })() : (
                  <React.Fragment>
                    <StageBadge stageKey={job.stage} />
                    <div style={{ flex: 1 }}><ProgressBar pct={job.progressPct} color={stageOf(job.stage).color} /></div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{job.progressPct}%</span>
                  </React.Fragment>
                )}
              </div>
            </div>

            {/* body */}
            <div style={{ overflowY: "auto", flex: 1, padding: isMobile ? "16px 15px" : "22px 24px" }}>
              {/* customer info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 18 : 24 }}>
                <InfoRow label="เบอร์โทร">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} color="var(--text-3)" />{job.phone}</span>
                </InfoRow>
                <InfoRow label="วันนัดติดตั้ง">{(() => {
                  // วันนัดติดตั้ง = วัน "เริ่ม" ของขั้นติดตั้ง (ไม่ใช่วันเสร็จ/กำหนดส่งงานรวม)
                  const v = job.stageDates && job.stageDates.install;
                  const d = v ? (typeof v === "object" ? (v.start || v.end) : v) : job.deadline;
                  return thDate(d, true);
                })()}</InfoRow>
                <div style={{ gridColumn: "1 / -1" }}>
                  <InfoRow label="ที่อยู่ / พิกัด">
                    {job.address}, {job.province}{"  "}
                    <a href={job.map} target="_blank" rel="noreferrer" style={{ color: "var(--primary-dark)", textDecoration: "none", fontWeight: 600, fontSize: 12, marginLeft: 4 }}>
                      <Icon name="pin" size={12} style={{ verticalAlign: -1 }} /> เปิดแผนที่
                    </a>
                  </InfoRow>
                </div>
                <InfoRow label="ช่างผู้รับผิดชอบ"><TechAvatar techId={job.tech} size={24} showName /></InfoRow>
                {/* ช่างกับวิศวกรต้องรู้ว่างานนี้ใครขายมา — เรื่องที่ตกลงกับลูกค้าไว้ต้องถามคนนั้น */}
                <InfoRow label="เซลล์เจ้าของงาน">
                  {job.salesName ? job.salesName : <span style={{ color: "var(--text-3)" }}>—</span>}
                </InfoRow>
                <InfoRow label="ประเภทงาน">{job.type === "home" ? "งานบ้าน" : "งานโครงการ"}</InfoRow>
                {!roMode && <InfoRow label="ทีมรับเหมา">{job.contractor ? job.contractor : <span style={{ color: "var(--text-3)" }}>—</span>}</InfoRow>}
                {!roMode && <InfoRow label="ค่าแรงติดตั้ง">{job.laborCost ? Number(job.laborCost).toLocaleString() + " บาท" : <span style={{ color: "var(--text-3)" }}>—</span>}</InfoRow>}
                {job.trello && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <InfoRow label="การ์ดงาน Trello">
                      <a href={job.trello} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#fff", background: "#0079BF", padding: "6px 12px", borderRadius: 9, textDecoration: "none", fontWeight: 700, fontSize: 12.5 }}>
                        <Icon name="trello" size={14} color="#fff" /> เปิดการ์ด Trello <Icon name="arrowRight" size={13} color="#fff" />
                      </a>
                    </InfoRow>
                  </div>
                )}
              </div>

              {permitMode && <PermitJobSummary job={job} onOpenReview={onOpenReview} />}
              {salesMode && window.SalesJobSummary && <window.SalesJobSummary job={job} quotes={quotes} onOpenQuote={onOpenQuote} />}

              {/* spec card */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: isMobile ? 15 : 18, marginBottom: isMobile ? 18 : 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sun" size={14} color="var(--primary)" /> สเปกระบบ
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: isMobile ? 14 : 16 }}>
                  <SpecItem label="แบรนด์" value={job.brand} />
                  <SpecItem label="ขนาดระบบ" value={job.kw + " kW"} mono />
                  <SpecItem label="จำนวนแผง" value={job.panels + " แผง"} mono />
                  <SpecItem label="ระบบไฟฟ้า" value={(job.phase || "1") + " เฟส"} />
                  <SpecItem label="แบตเตอรี่" value={job.battery ? job.batSize : "ไม่มี"} accent={job.battery} />
                  <SpecItem label="ระบบ / ออฟติไมเซอร์" value={job.connect} />
                  <SpecItem label="ระบบ Backup" value={job.backup ? "Backup ✓" : "ไม่มี"} accent={job.backup} />
                  {(job.brand || "").toUpperCase().includes("ATMOCE") && (
                    <SpecItem label="ตู้ Combiner" value={job.comboType === "assembled" ? "ตู้ประกอบ" : "ตู้สำเร็จ"} />
                  )}
                </div>
              </div>

              {/* รายงานประจำวันหน้างาน — บันทึกรายวัน + ออกเป็น PDF */}
              {onDaily && <DailyJobButton job={job} onOpen={onDaily} />}

              {/* สำรวจหน้างาน (Site Survey) */}
              {onSurvey && (() => {
                const ss = window.surveyStatus ? window.surveyStatus(job) : { state: "none", pct: 0, label: "ยังไม่สำรวจ", color: "var(--text-3)" };
                return (
                  <React.Fragment>
                  <button onClick={onSurvey}
                    style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                      background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 9, background: ss.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="list" size={17} color={ss.color} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>สำรวจหน้างาน (Site Survey)</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{ss.state === "none" ? "ยังไม่ได้สำรวจ · แตะเพื่อเริ่ม" : ss.label + " · " + ss.pct + "% · แตะเพื่อแก้ไข"}</span>
                    </span>
                    <Icon name="arrowRight" size={16} color="var(--text-3)" />
                  </button>
                  {/* ออกรายงานได้เมื่อเริ่มสำรวจแล้ว — ยังไม่มีข้อมูลก็ไม่มีอะไรให้พิมพ์ */}
                  {onSurveyReport && ss.state !== "none" && (
                    <button onClick={onSurveyReport}
                      style={{ width: "100%", marginBottom: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 14px",
                        background: "var(--primary-soft)", border: "1px solid var(--primary)", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                        fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
                      <Icon name="file" size={15} color="var(--primary-dark)" /> ดูรายงานผลสำรวจ · บันทึก PDF
                    </button>
                  )}
                  </React.Fragment>
                );
              })()}

              {/* เก็บข้อมูลขออนุญาตการไฟฟ้า — ช่างกรอกหน้างาน แล้วส่งต่อฝ่ายขออนุญาต
                  แถบความคืบหน้าคิดจากช่องบังคับ + รูปบังคับ ช่างจะได้รู้ว่าเหลืออีกเท่าไรโดยไม่ต้องเปิดเข้าไปดู */}
              {onPermit && (() => {
                const pm = job.permit || null;
                const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
                const FLOW = window.PERMIT_FLOW || [];
                const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
                const rejected = !!(pm && pm.status === "rejected");
                return (
                  <div style={{ marginBottom: 10, border: "1px solid " + (rejected ? "var(--tint-red-bd)" : "var(--border-strong)"),
                    borderLeft: "3px solid " + (pst ? pst.color : "var(--border-strong)"), borderRadius: 12, overflow: "hidden",
                    background: "var(--surface)" }}>
                    <button onClick={onPermit}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                        background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: "#14B8A61c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="shield" size={17} color="#14B8A6" /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>ขออนุญาตการไฟฟ้า</span>
                        <span style={{ display: "block", fontSize: 11.5, color: pst ? pst.color : "var(--text-3)", fontWeight: pst ? 700 : 400 }}>
                          {pst ? pst.th + (pm && pm.auth ? " · " + pm.auth : "") : "ยังไม่ได้เริ่มเก็บ · แตะเพื่อเริ่ม"}
                        </span>
                      </span>
                      <Icon name="arrowRight" size={16} color="var(--text-3)" />
                    </button>

                    {/* แถบขั้นตอน — งานติดตั้งจบแล้วยังไม่จบเรื่อง ใบขออนุญาตต้องเดินต่อจนการไฟฟ้าอนุมัติ */}
                    {idx >= 0 && (
                      <div style={{ display: "flex", gap: 6, padding: "0 14px 12px" }}>
                        {FLOW.map((st, i) => {
                          const done = i < idx, now = i === idx;
                          const c = rejected && now ? "#EF4444" : (done || now ? "var(--primary)" : "var(--border-strong)");
                          return (
                            <span key={st.key} style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "block", height: 4, borderRadius: 99, background: c, opacity: done ? .55 : 1 }} />
                              <span style={{ display: "block", marginTop: 5, fontSize: 9.5, lineHeight: 1.3,
                                fontWeight: now ? 800 : 600, color: now ? (rejected ? "#EF4444" : "var(--primary-dark)") : "var(--text-3)" }}>{st.th}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* ตีกลับ = ช่างต้องลงมือแก้ ต้องเห็นเหตุผลตรงนี้เลย ไม่ใช่ไปตามอ่านในแจ้งเตือน */}
                    {rejected && (
                      <div style={{ margin: "0 12px 12px", padding: "10px 12px", borderRadius: 10,
                        background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--tint-red-tx)" }}>↩ ฝ่ายขออนุญาตตีกลับ ต้องแก้ไขแล้วส่งใหม่</div>
                        <div style={{ fontSize: 12, color: "var(--tint-red-tx)", marginTop: 4, lineHeight: 1.55 }}>
                          {pm.rejectReason || "ไม่ได้ระบุเหตุผล — สอบถามฝ่ายขออนุญาต"}
                        </div>
                        {(pm.byAdmin || pm.statusAt) && (
                          <div style={{ fontSize: 10.5, color: "var(--tint-red-tx)", opacity: .8, marginTop: 4 }}>
                            {pm.byAdmin ? "โดย " + pm.byAdmin : ""}{pm.statusAt ? " · " + thDate(String(pm.statusAt).slice(0, 10), true) : ""}
                          </div>
                        )}
                        <button onClick={onPermit}
                          style={{ marginTop: 9, padding: "8px 14px", borderRadius: 9, border: "none", background: "#EF4444", color: "#fff",
                            fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>แก้ไขแล้วส่งใหม่</button>
                      </div>
                    )}

                    {/* อนุมัติแล้ว = ปิดงานได้จริง ให้เห็นเลขที่คำร้อง/วันอนุมัติโดยไม่ต้องเปิดเข้าไป */}
                    {pm && pm.status === "approved" && (
                      <div style={{ margin: "0 12px 12px", padding: "9px 12px", borderRadius: 10,
                        background: "var(--primary-soft)", border: "1px solid var(--primary)", fontSize: 11.5, color: "var(--primary-dark)", fontWeight: 700 }}>
                        ✔ การไฟฟ้าอนุมัติแล้ว{pm.approvedDate ? " · " + thDate(pm.approvedDate, true) : ""}{pm.reqNo ? " · คำร้อง " + pm.reqNo : ""}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ผังหน้างาน (Site Plan) — ซ่อนปุ่มไว้ก่อนตามที่สั่ง (โค้ดยังอยู่ครบ เปลี่ยน false กลับเป็น true เมื่อจะเอากลับมา) */}
              {false && window.SitePlanEditor && (
              <button onClick={() => setPlanOpen(true)}
                style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "#0EA5E91c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="map" size={17} color="#0784b8" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>ผังหน้างาน (วาด + วัดระยะ)</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>วาดเส้นสาย · วางจุดอุปกรณ์ · ประเมินของเบื้องต้น</span>
                </span>
                <Icon name="arrowRight" size={16} color="var(--text-3)" />
              </button>
              )}

              {/* วางแผง 3D — เฉพาะคนที่มีสิทธิ์ออกแบบ (วิศวกรไฟฟ้า/เขียนแบบ/หัวหน้า/แอดมิน) */}
              {window.Plan3DEditor && canDesign && !roMode && (
              <button onClick={() => setPlan3dOpen(true)}
                style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "#6366F11c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="panel" size={17} color="#4F46E5" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>วางแผง 3D (โมเดลหลังคา + เงาแดด)</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>ปั้นหลังคาตามรูปโดรน · วางแผง · จำลองเงาดวงอาทิตย์</span>
                </span>
                <Icon name="arrowRight" size={16} color="var(--text-3)" />
              </button>
              )}

              {/* ออกแบบระบบ + ผลผลิต — เข้าตรง ไม่ต้องเปิดจอ 3 มิติก่อน (ใช้ผังแผงที่บันทึกไว้แล้ว) */}
              {window.SolarDesignHost && !roMode && (
              <button onClick={() => setDesignOpen(true)}
                style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "#F59E0B1c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="bolt" size={17} color="#B45309" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>ออกแบบระบบ + ผลผลิต</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>ต่อสตริง · ตรวจ I-V · ผลผลิต 25 ปี · คืนทุน — เข้าตรง ไม่ต้องรอจอ 3 มิติ</span>
                </span>
                <Icon name="arrowRight" size={16} color="var(--text-3)" />
              </button>
              )}

              {/* ถอดวัสดุ BOQ */}
              {!roMode && <button onClick={() => setBoqOpen(true)}
                style={{ width: "100%", marginBottom: 22, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="box" size={17} color="var(--primary-dark)" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>ถอดวัสดุ BOQ</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{job.boq ? "มีรายการแล้ว · แตะเพื่อแก้ไข / ดาวน์โหลด" : "คำนวณปริมาณวัสดุของงานนี้"}</span>
                </span>
                <Icon name="arrowRight" size={16} color="var(--text-3)" />
              </button>}

              {/* material checklist */}
              {!roMode && <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="box" size={14} color="var(--text-2)" /> สถานะวัสดุ
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--text-3)", marginLeft: 2 }}>· แตะเพื่อแก้ไข</span>
                  </span>
                  {/* ความคืบหน้าเป็นแถบสั้น ๆ ข้างตัวเลข — เห็นภาพรวมก่อนไล่อ่านทีละรายการ */}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 54, height: 6, borderRadius: 99, background: "var(--surface3)", overflow: "hidden", display: "block" }}>
                      <span style={{ display: "block", height: "100%", width: job.matReadyPct + "%", borderRadius: 99,
                        background: job.matReady ? "var(--primary)" : "#F59E0B", transition: "width .4s cubic-bezier(.2,.8,.2,1)" }} />
                    </span>
                    <span style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, letterSpacing: "-.02em",
                      fontVariantNumeric: "tabular-nums", color: job.matReady ? "var(--primary-dark)" : "var(--text-2)" }}>{job.matReadyPct}%</span>
                  </span>
                </div>
                {/* เดิมเป็นกล่องมีขอบ 6 ใบเรียงกัน = เส้นขอบ 6 เส้นแย่งความสนใจกับตัวข้อมูล
                   เปลี่ยนเป็นแผงเดียวแบ่งด้วยเส้นผม เหมือนตารางย่อย อ่านไล่ลงมาได้ลื่นกว่า */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0,
                  border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
                  {SF.MATERIALS.filter((m) => {
                    if (m.key === "battery" && !job.battery) return false;
                    if (m.key === "backup" && !job.backup) return false;
                    return true;
                  }).map((m, i) => {
                    const MAT_CYCLE = ["none", "waiting", "ready", "na"];
                    const cycle = () => {
                      const cur = MAT_CYCLE.indexOf(job.mat[m.key]);
                      onSetMat(job.id, m.key, MAT_CYCLE[(cur + 1) % MAT_CYCLE.length]);
                    };
                    return (
                      <button key={m.key} onClick={cycle} title="คลิกเพื่อเปลี่ยนสถานะ"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                        padding: "10px 12px", background: "transparent", border: 0,
                        boxShadow: "inset 0 -1px 0 var(--border)" + (!isMobile && i % 2 === 0 ? ", inset -1px 0 0 var(--border)" : ""),
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background .13s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 12.5, color: "var(--text-1)", fontWeight: 600 }}>{m.th}</span>
                        <MatChip status={job.mat[m.key]} />
                      </button>
                    );
                  })}
                </div>
              </div>}

              {/* อุปกรณ์ที่เบิก/คืน สำหรับงานนี้ */}
              {!roMode && <JobMaterialUsage job={job} stock={stock} currentUser={currentUser} />}

              {/* flow timeline — ขั้นติดตั้ง ฝ่ายขออนุญาตไม่ได้ใช้ (ของเขาอยู่ในบล็อกสรุปด้านบน) */}
              {!roMode && <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="flow" size={14} color="var(--text-2)" /> Flow การทำงาน
                </div>
                <FlowTimeline job={job} />
              </div>}

              {/* เอกสารแนบ (PDF) — แบบ + BOQ ที่ถอด · โหมดขออนุญาตดูได้จากบล็อกสรุปแล้ว (อ่านอย่างเดียว) */}
              {!roMode && <JobFiles media={media} currentUser={currentUser} canManage={canManage} />}

              {/* รูปหน้างาน + พูดคุย/บันทึกงาน — คุยได้ (ต้องบอกช่างว่าติดอะไร) แต่รูปดูอย่างเดียว */}
              <JobPhotos media={media} currentUser={currentUser} canManage={canManage} readOnly={roMode} />
              <JobComments media={media} currentUser={currentUser} canManage={canManage} />

              {job.note && (
                <div style={{ padding: "12px 14px", background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 10, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-1)" }}>หมายเหตุ:</strong> {job.note}
                </div>
              )}
            </div>

            {/* footer action — เผื่อ safe-area ด้านล่าง กันแถบเบราว์เซอร์มือถือบังปุ่ม
               มือถือ: ปุ่ม ปิด/แก้ไข เป็นไอคอนล้วน ให้ปุ่มเลื่อนขั้นกว้างพอแสดงบรรทัดเดียว */}
            <div style={{ padding: isMobile ? "12px 16px" : "14px 24px", paddingBottom: "calc(" + (isMobile ? 12 : 14) + "px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
              <button onClick={onClose} title="ปิด" aria-label="ปิด"
                style={{ flex: "0 0 auto", padding: isMobile ? 0 : "11px 16px", width: isMobile ? 42 : "auto", height: isMobile ? 42 : "auto",
                  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
                  fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {isMobile ? <Icon name="x" size={18} color="var(--text-2)" /> : "ปิด"}
              </button>
              {!roMode && <button onClick={() => onEdit(job.id)} title="แก้ไขข้อมูล" aria-label="แก้ไขข้อมูล"
                style={{ flex: "0 0 auto", padding: isMobile ? 0 : "11px 16px", width: isMobile ? 42 : "auto", height: isMobile ? 42 : "auto",
                  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)",
                  fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Icon name="settings" size={isMobile ? 17 : 15} color="var(--text-2)" />{!isMobile && " แก้ไขข้อมูล"}
              </button>}
              {permitMode && (
                <span style={{ flex: 1, minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: 1.4 }}>
                  ดูอย่างเดียว · แก้สถานะได้ที่ชุดข้อมูลขออนุญาต
                </span>
              )}
              {salesMode && (
                <span style={{ flex: 1, minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "var(--text-3)", textAlign: "center", lineHeight: 1.4 }}>
                  ดูอย่างเดียว · ไว้ตอบลูกค้าว่างานถึงไหนแล้ว
                </span>
              )}
              {!roMode && job.stage !== "done" && (
                <button onClick={handleAdvance} disabled={advancing}
                  style={{ flex: 1, minWidth: 0, padding: isMobile ? "11px 14px" : "11px 16px", height: isMobile ? 42 : "auto", borderRadius: 11, border: "none",
                    background: advancing ? "var(--primary-dark)" : "var(--primary)",
                    color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: isMobile ? 13 : 13.5,
                    cursor: advancing ? "default" : "pointer", opacity: advancing ? 0.82 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                    transition: "background .15s, opacity .15s" }}>
                  {advancing
                    ? "กำลังบันทึก..."
                    : <React.Fragment>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          เลื่อนขั้น "{SF.STAGES[Math.min(job.stageIdx + 1, SF.STAGES.length - 1)].th}"
                        </span>
                        <Icon name="arrowRight" size={16} color="#fff" style={{ flexShrink: 0 }} />
                      </React.Fragment>
                  }
                </button>
              )}
            </div>
          </React.Fragment>
        )}
      </aside>
      {boqOpen && job && <BOQEditor job={job} onClose={() => setBoqOpen(false)} priceMap={priceMap} stock={stock}
        onSave={onSaveBOQ ? (boq) => { onSaveBOQ(job.id, boq); setBoqOpen(false); } : null} />}
      {planOpen && job && window.SitePlanEditor && <window.SitePlanEditor job={job} currentUser={currentUser} onClose={() => setPlanOpen(false)} />}
      {plan3dOpen && job && window.Plan3DEditor && <window.Plan3DEditor job={job} currentUser={currentUser} onClose={() => setPlan3dOpen(false)} />}
      {designOpen && job && window.SolarDesignHost && <window.SolarDesignHost job={job} onClose={() => setDesignOpen(false)} />}
    </React.Fragment>
  );
}

function SpecItem({ label, value, mono, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: mono ? "var(--mono)" : "inherit",
        color: accent ? "var(--primary-dark)" : "var(--text-1)" }}>{value}</span>
    </div>
  );
}

Object.assign(window, { DetailDrawer, FlowTimeline });
