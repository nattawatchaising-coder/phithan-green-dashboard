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
                background: (isDone || isCurrent) && !step.blocked ? s.color : step.blocked ? "#FDE2E2" : "var(--surface3)",
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
                {isCurrent && !step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color,
                  background: s.soft, padding: "2px 8px", borderRadius: 99 }}>ขั้นปัจจุบัน</span>}
                {step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444",
                  background: "#FDE2E2", padding: "2px 8px", borderRadius: 99 }}>⚠ ติดปัญหา</span>}
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
                    {late && <span style={{ fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99 }}>เลยกำหนด {late.daysLate} วัน</span>}
                  </div>
                );
              })()}
              {step.blocked && job.problem && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 10, fontSize: 12.5, color: "#B91C1C", lineHeight: 1.5 }}>{job.problem}</div>
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
    if (cat !== "all" && it.cat !== cat) return false;
    if (q && !_matNorm(it.name + " " + (it.sku || "")).includes(_matNorm(q))) return false;
    return true;
  });
  const extraCats = React.useMemo(() => {
    const present = new Set(allItems.filter((it) => !boqStockIds.has(it.id)).map((it) => it.cat));
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
                <div style={{ margin: "8px 8px 0", padding: "10px 12px", background: "#FEF9F0", border: "1px dashed #F4C77B", borderRadius: 10, fontSize: 11.5, color: "#92600B", lineHeight: 1.55 }}>
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

function DetailDrawer({ job, onClose, onAdvance, onSetMat, onEdit, currentUser, canManage, stock, onSaveBOQ, onSurvey, priceMap }) {
  const SF = window.SF;
  const open = !!job;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job ? job.id : null); // รูป + คอมเมนต์ของงานนี้
  const [boqOpen, setBoqOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [plan3dOpen, setPlan3dOpen] = React.useState(false);
  React.useEffect(() => { setBoqOpen(false); setPlanOpen(false); setPlan3dOpen(false); }, [job ? job.id : null]);

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
      <aside style={{ position: "fixed", top: 0, right: 0, width: "min(540px, 94vw)",
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
                    {job.delayed && <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "2px 8px", borderRadius: 6 }}>⚠ ล่าช้า</span>}
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
                <StageBadge stageKey={job.stage} />
                <div style={{ flex: 1 }}><ProgressBar pct={job.progressPct} color={stageOf(job.stage).color} /></div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{job.progressPct}%</span>
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
                <InfoRow label="ประเภทงาน">{job.type === "home" ? "งานบ้าน" : "งานโครงการ"}</InfoRow>
                <InfoRow label="ทีมรับเหมา">{job.contractor ? job.contractor : <span style={{ color: "var(--text-3)" }}>—</span>}</InfoRow>
                <InfoRow label="ค่าแรงติดตั้ง">{job.laborCost ? Number(job.laborCost).toLocaleString() + " บาท" : <span style={{ color: "var(--text-3)" }}>—</span>}</InfoRow>
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

              {/* สำรวจหน้างาน (Site Survey) */}
              {onSurvey && (() => {
                const ss = window.surveyStatus ? window.surveyStatus(job) : { state: "none", pct: 0, label: "ยังไม่สำรวจ", color: "var(--text-3)" };
                return (
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
                );
              })()}

              {/* ผังหน้างาน (Site Plan) */}
              {window.SitePlanEditor && (
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

              {/* วางแผง 3D */}
              {window.Plan3DEditor && (
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

              {/* ถอดวัสดุ BOQ */}
              <button onClick={() => setBoqOpen(true)}
                style={{ width: "100%", marginBottom: 22, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="box" size={17} color="var(--primary-dark)" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>ถอดวัสดุ BOQ</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{job.boq ? "มีรายการแล้ว · แตะเพื่อแก้ไข / ดาวน์โหลด" : "คำนวณปริมาณวัสดุของงานนี้"}</span>
                </span>
                <Icon name="arrowRight" size={16} color="var(--text-3)" />
              </button>

              {/* material checklist */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="box" size={14} color="var(--text-2)" /> สถานะวัสดุ
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--text-3)", marginLeft: 2 }}>· แตะเพื่อแก้ไข</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: job.matReady ? "var(--primary-dark)" : "var(--text-2)" }}>
                    พร้อม {job.matReadyPct}%
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                  {SF.MATERIALS.filter((m) => {
                    if (m.key === "battery" && !job.battery) return false;
                    if (m.key === "backup" && !job.backup) return false;
                    return true;
                  }).map((m) => {
                    const MAT_CYCLE = ["none", "waiting", "ready", "na"];
                    const cycle = () => {
                      const cur = MAT_CYCLE.indexOf(job.mat[m.key]);
                      onSetMat(job.id, m.key, MAT_CYCLE[(cur + 1) % MAT_CYCLE.length]);
                    };
                    return (
                      <button key={m.key} onClick={cycle} title="คลิกเพื่อเปลี่ยนสถานะ"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                        padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "border-color .15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
                        <span style={{ fontSize: 12.5, color: "var(--text-1)", fontWeight: 500 }}>{m.th}</span>
                        <MatChip status={job.mat[m.key]} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* อุปกรณ์ที่เบิก/คืน สำหรับงานนี้ */}
              <JobMaterialUsage job={job} stock={stock} currentUser={currentUser} />

              {/* flow timeline */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="flow" size={14} color="var(--text-2)" /> Flow การทำงาน
                </div>
                <FlowTimeline job={job} />
              </div>

              {/* เอกสารแนบ (PDF) — แบบ + BOQ ที่ถอด */}
              <JobFiles media={media} currentUser={currentUser} canManage={canManage} />

              {/* รูปหน้างาน + พูดคุย/บันทึกงาน */}
              <JobPhotos media={media} currentUser={currentUser} canManage={canManage} />
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
              <button onClick={() => onEdit(job.id)} title="แก้ไขข้อมูล" aria-label="แก้ไขข้อมูล"
                style={{ flex: "0 0 auto", padding: isMobile ? 0 : "11px 16px", width: isMobile ? 42 : "auto", height: isMobile ? 42 : "auto",
                  borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)",
                  fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <Icon name="settings" size={isMobile ? 17 : 15} color="var(--text-2)" />{!isMobile && " แก้ไขข้อมูล"}
              </button>
              {job.stage !== "done" && (
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
