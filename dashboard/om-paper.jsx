/* ============================================================
   flash+solar — ใบรายงานเข้าบริการ (กรอกหน้างาน + กระดาษ A4)

   ใบเดียวใช้ได้ทั้งงานซ่อม งานล้างแผง งานเข้าตรวจ — ลูกค้าเซ็นรับงานแบบเดียวกันหมด
   PDF ใช้วิธีเดียวกับรายงานประจำวัน คือสั่งพิมพ์ของเบราว์เซอร์แล้วเลือก "บันทึกเป็น PDF"
   ได้ภาษาไทยคมชัด เลือกข้อความได้ ไม่ต้องฝังฟอนต์หลายเมกฯ

   ตั้งชื่อ top-level ขึ้นต้นด้วย Om/om (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

/* ── รูปก่อน/หลังของใบรายงาน ──
   แยกคอมโพเนนต์จาก OmPhotos ของใบแจ้งซ่อม เพราะผูกกับคนละโหนด (omVisitPhotos)
   รูปหลังซ่อมคือหลักฐานว่างานเสร็จจริง ใบที่อนุมัติแล้วจึงห้ามแก้รูป */
function OmVisitPhotos({ visitId, slot, currentUser, disabled }) {
  const store = window.useOmVisitPhotos(visitId);
  const [busy, setBusy] = React.useState(0);
  const list = store.photos.filter((p) => (p.slot || "before") === slot);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const f of files) {
      try { store.add(await window.resizeImageFile(f, 1200, 0.72), slot, currentUser); } catch (err) { /* ข้ามไฟล์ที่อ่านไม่ได้ */ }
      setBusy((n) => n - 1);
    }
  };

  return (
    <div>
      {!disabled && (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
          border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
          fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: list.length ? 11 : 0 }}>
          <Icon name="camera" size={15} /> {busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)"}
          <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
        </label>
      )}
      {!list.length && disabled && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ไม่มีรูป</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))", gap: 10 }}>
        {list.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ position: "relative", background: "#0d1512" }}>
              <img src={p.dataUrl} alt={p.cap || "รูปหน้างาน"} style={{ width: "100%", height: 108, objectFit: "cover", display: "block" }} />
              {!disabled && (
                <button type="button" onClick={() => store.remove(p.id)} title="ลบรูปนี้"
                  style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 8, border: "none",
                    background: "rgba(0,0,0,.55)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="trash" size={13} color="#fff" />
                </button>
              )}
            </div>
            <window.DrPhotoCap value={p.cap} disabled={disabled} onSave={(v) => store.setCap(p.id, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ฟอร์มกรอกใบรายงานเข้าบริการ
   ══════════════════════════════════════════════════ */
function OmVisitModal({ visit, site, siteVisits, role, currentUser, onClose, onPatch, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const sigs = window.useOmVisitSigns(visit ? visit.id : null);
  const mine = window.useOmMySign((currentUser || {}).id);
  const [tab, setTab] = React.useState("before");
  const [paper, setPaper] = React.useState(false);
  const [delAsk, setDelAsk] = React.useState(false);
  /* pad = { slot, title, hint, name, then } — เปิดแผ่นเซ็น แล้วทำงานต่อให้อัตโนมัติหลังเซ็นเสร็จ */
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  if (!visit) return null;

  const v = visit;
  const st = window.omVisitStatusOf(v.status);
  const kind = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
  const canApprove = window.omCanApprove(role);
  /* อนุมัติแล้วล็อกทั้งใบ — เอกสารที่ลูกค้าเซ็นไปแล้วถูกแก้ย้อนหลังไม่ได้
     หัวหน้าที่อยากแก้ต้องกด "ปลดล็อกให้แก้" ซึ่งทิ้งร่องรอยว่าใบถูกเปิดกลับ */
  const locked = !window.omCanWrite(role, v);
  const set = (fields) => { if (!locked) onPatch(v.id, fields); };

  const doSign = (slot, img) => {
    sigs.sign(slot, img, currentUser, slot === "cust" ? (site || {}).name || "" : (currentUser || {}).name || "");
  };
  const send = () => {
    /* ยังไม่เซ็นก็เปิดแผ่นเซ็นให้ก่อน แล้วค่อยส่งต่อเอง — ใบที่ไม่มีลายเซ็นช่างไม่ใช่เอกสาร */
    if (!(sigs.signs.tech && sigs.signs.tech.img)) {
      setPad({ slot: "tech", title: "ลายเซ็นช่างผู้ให้บริการ", then: markSent });
      return;
    }
    markSent();
  };
  const markSent = () => {
    onPatch(v.id, { status: "sent", sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || v.byId || null, byName: (currentUser || {}).name || v.byName || "" });
    /* ส่งให้หัวหน้าตรวจ — ถ้าไม่เตือน ใบจะค้างอยู่ในสถานะ "รอตรวจ" ไปเรื่อย ๆ */
    window.omNotify({ toPerm: "om", omSiteId: v.siteId, title: "ใบรายงานเข้าบริการรอตรวจ · " + (v.no || ""),
      body: ((site || {}).name || v.siteName || "") + " — ส่งโดย " + ((currentUser || {}).name || "") });
  };
  const approve = () => onPatch(v.id, { status: "approved", approvedAt: new Date().toISOString(),
    appId: (currentUser || {}).id || null, appName: (currentUser || {}).name || "" });
  const unlock = () => onPatch(v.id, { status: "sent", approvedAt: null, appId: null, appName: "" });

  const btn = (bg, color, border) => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
    border: border || "none", background: bg, color: color, cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
  });

  return (
    <React.Fragment>
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
        <div onClick={(e) => e.stopPropagation()}
          style={{ width: "100%", maxWidth: 780, maxHeight: isMobile ? "94vh" : "88vh", overflowY: "auto",
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: isMobile ? "18px 18px 0 0" : 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>

          <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg)", borderBottom: "1px solid var(--border)",
            padding: isMobile ? "14px 13px" : "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: kind.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={kind.icon} size={18} color={kind.color} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>ใบรายงานเข้าบริการ · {kind.th}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                  {v.no} · {v.siteCode}{v.siteName ? " · " + v.siteName : ""}
                </div>
              </div>
              <window.OmPill th={st.th} color={st.color} />
              <button onClick={onClose} title="ปิด"
                style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
                <Icon name="x" size={15} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
              <button onClick={() => setPaper(true)} style={btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)")}>
                <Icon name="file" size={14} /> ดูใบ A4 / บันทึก PDF
              </button>
              {!locked && v.status === "draft" && (
                <button onClick={send} style={btn("var(--primary)", "#fff")}>
                  <Icon name="check" size={14} color="#fff" sw={2.6} /> ส่งให้หัวหน้าตรวจ
                </button>
              )}
              {canApprove && v.status === "sent" && (
                <button onClick={approve} style={btn("#10B981", "#fff")}>
                  <Icon name="shield" size={14} color="#fff" /> อนุมัติใบนี้
                </button>
              )}
              {canApprove && v.status === "approved" && (
                <button onClick={unlock} style={btn("var(--surface)", "#F59E0B", "1px solid #F59E0B")}>
                  <Icon name="lock" size={14} color="#F59E0B" /> ปลดล็อกให้แก้
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: isMobile ? "14px 13px 24px" : "18px 20px 26px" }}>
            {v.status === "approved" && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
                border: "1px solid #10B98140", background: "#10B98114", borderRadius: 12 }}>
                <Icon name="lock" size={15} color="#10B981" />
                <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>
                  อนุมัติแล้วโดย <b>{v.appName || "-"}</b>
                  {v.approvedAt ? " · " + window.drDateTH(window.drLocalDay(v.approvedAt)) : ""} · แก้ไขไม่ได้
                </span>
              </div>
            )}

            <window.DrSection n="1" title="การเข้าบริการครั้งนี้" tone="#7C5CFC">
              <window.DrLabel>ประเภทงาน</window.DrLabel>
              <window.DrChips options={window.OM_VISIT_KIND} value={v.kind} disabled={locked}
                onChange={(x) => set({ kind: x || "repair" })} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 13 }}>
                <div>
                  <window.DrLabel>วันที่เข้า</window.DrLabel>
                  <input type="date" value={v.date || ""} disabled={locked} onChange={(e) => set({ date: e.target.value })}
                    style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
                </div>
                <div>
                  <window.DrLabel>เวลาเข้า</window.DrLabel>
                  <input type="time" value={v.timeIn || ""} disabled={locked} onChange={(e) => set({ timeIn: e.target.value })}
                    style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
                </div>
                <div>
                  <window.DrLabel>เวลาออก</window.DrLabel>
                  <input type="time" value={v.timeOut || ""} disabled={locked} onChange={(e) => set({ timeOut: e.target.value })}
                    style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
                </div>
                <div>
                  <window.DrLabel>ทีมช่าง</window.DrLabel>
                  <input value={v.team || ""} disabled={locked} onChange={(e) => set({ team: e.target.value })}
                    placeholder="ชื่อช่างที่เข้า" style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })} />
                </div>
              </div>
            </window.DrSection>

            <window.DrSection n="2" title="ตรวจพบ / งานที่ทำ" tone="#F59E0B">
              <window.DrLabel hint="สภาพที่เจอตอนไปถึง">ตรวจพบอะไร</window.DrLabel>
              <window.DrText value={v.found} disabled={locked} rows={2}
                placeholder="เช่น อินเวอร์เตอร์แจ้ง error 2031 · ฟิวส์ DC สตริง 2 ขาด" onChange={(x) => set({ found: x })} />
              <div style={{ marginTop: 13 }}>
                <window.DrLabel>ทำอะไรไปบ้าง</window.DrLabel>
                <window.DrText value={v.work} disabled={locked} rows={3}
                  placeholder="เช่น เปลี่ยนฟิวส์ DC · ขันจุดต่อใหม่ทั้งแถว · ล้างแผงทั้ง 18 แผง" onChange={(x) => set({ work: x })} />
              </div>
              <div style={{ marginTop: 13 }}>
                <window.DrLabel hint="สรุปให้ลูกค้าอ่านแล้วเข้าใจ">ผลหลังทำงานเสร็จ</window.DrLabel>
                <window.DrText value={v.result} disabled={locked} rows={2}
                  placeholder="เช่น ทดสอบแล้วระบบจ่ายไฟปกติ กำลังผลิตกลับมา 5.2 kW" onChange={(x) => set({ result: x })} />
              </div>
            </window.DrSection>

            <window.DrSection n="3" title="อะไหล่ / วัสดุที่ใช้" tone="#0EA5E9" hint="ไม่ได้ใช้อะไรก็เว้นว่างไว้">
              <window.DrRows disabled={locked} rows={v.parts} addLabel="เพิ่มอะไหล่"
                cols={[{ k: "name", th: "รายการ" }, { k: "qty", th: "จำนวน", w: 76, type: "num" },
                  { k: "unit", th: "หน่วย", w: 76 }, { k: "note", th: "หมายเหตุ" }]}
                onChange={(rows) => set({ parts: rows })} />
            </window.DrSection>

            <window.DrSection n="4" title="ค่าบริการ" tone="#1B9B75">
              <window.DrChips disabled={locked} value={v.cover} onChange={(x) => set({ cover: x || "unknown" })}
                options={["warranty", "charge", "goodwill", "unknown"].map((k) => ({ key: k, th: window.omCoverTH(k).th, color: window.omCoverTH(k).color }))} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 13 }}>
                <div>
                  <window.DrLabel hint="บาท — อยู่ในประกันให้เว้นว่าง">ยอดที่เรียกเก็บ</window.DrLabel>
                  <input value={v.charge == null ? "" : String(v.charge)} disabled={locked} inputMode="decimal"
                    onChange={(e) => { const x = e.target.value.replace(/[^0-9.]/g, ""); set({ charge: x === "" ? null : +x }); }}
                    style={Object.assign({}, window.OM_INPUT, { padding: "8px 11px", fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <div>
                  <window.DrLabel hint="เช่น วันครบรอบล้างแผงครั้งต่อไป">นัดครั้งถัดไป</window.DrLabel>
                  <input type="date" value={v.nextDue || ""} disabled={locked} onChange={(e) => set({ nextDue: e.target.value })}
                    style={Object.assign({}, window.OM_INPUT, { padding: "8px 11px", fontFamily: "var(--mono)", fontSize: 13 })} />
                </div>
              </div>
              <div style={{ marginTop: 13 }}>
                <window.DrLabel hint="สิ่งที่อยากบอกลูกค้าให้ดูแลต่อ">คำแนะนำ</window.DrLabel>
                <window.DrText value={v.advice} disabled={locked} rows={2}
                  placeholder="เช่น ช่วงหน้าแล้งฝุ่นเยอะ แนะนำล้างทุก 4 เดือน" onChange={(x) => set({ advice: x })} />
              </div>
            </window.DrSection>

            <window.DrSection n="5" title="รูปก่อน / หลัง" tone="#0EA5E9" hint="รูปหลังคือหลักฐานว่างานเสร็จจริง">
              <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
                {[["before", "ก่อนทำงาน"], ["after", "หลังทำงาน"]].map(([k, th]) => (
                  <button key={k} type="button" onClick={() => setTab(k)}
                    style={{ padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                      fontSize: 12.5, fontWeight: 700,
                      border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
                      background: tab === k ? "var(--primary-soft)" : "var(--surface)",
                      color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>{th}</button>
                ))}
              </div>
              <OmVisitPhotos visitId={v.id} slot={tab} currentUser={currentUser} disabled={locked} />
            </window.DrSection>

            <window.DrSection n="6" title="ลายเซ็น" tone="#10B981" hint="ลูกค้าเซ็นรับงานที่หน้างานได้เลย">
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <window.DrSignSlot title="ช่างผู้ให้บริการ" sub="ผู้เข้าปฏิบัติงาน"
                  sig={sigs.signs.tech} canSign={!locked} saved={mine.sign}
                  onSign={() => setPad({ slot: "tech", title: "ลายเซ็นช่างผู้ให้บริการ" })}
                  onUseSaved={() => doSign("tech", mine.sign.img)}
                  onClear={() => sigs.clear("tech")} />
                {/* ลูกค้าไม่มีลายเซ็นประจำตัวในระบบ ต้องเซ็นสดทุกครั้ง */}
                <window.DrSignSlot title="ลูกค้าผู้รับบริการ" sub="เซ็นรับงานที่หน้างาน"
                  sig={sigs.signs.cust} canSign={!locked}
                  onSign={() => setPad({ slot: "cust", title: "ลายเซ็นลูกค้าผู้รับบริการ",
                    hint: "ให้ลูกค้าเซ็นในกรอบด้านล่างได้เลย" })}
                  onClear={() => sigs.clear("cust")} />
              </div>
            </window.DrSection>

            {window.omCanDelete(role) && (
              delAsk ? (
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", flexWrap: "wrap",
                  border: "1px solid #EF444440", background: "#EF44440e", borderRadius: 12 }}>
                  <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                    ลบใบ {v.no} ทั้งใบ? รูปและลายเซ็นหายถาวร เรียกคืนไม่ได้
                  </span>
                  <button onClick={() => setDelAsk(false)} style={btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)")}>ยกเลิก</button>
                  <button onClick={() => { onRemove(v.id); onClose(); }} style={btn("#EF4444", "#fff")}>
                    <Icon name="trash" size={14} color="#fff" /> ลบเลย
                  </button>
                </div>
              ) : (
                <button onClick={() => setDelAsk(true)} style={btn("var(--surface)", "#EF4444", "1px solid var(--border)")}>
                  <Icon name="trash" size={14} color="#EF4444" /> ลบใบรายงานนี้ (เฉพาะแอดมิน)
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {pad && (
        <window.DrSignPad title={pad.title} hint={pad.hint} onClose={() => setPad(null)}
          saved={pad.slot === "tech" ? mine.sign : null}
          remember={pad.slot === "tech" ? remember : undefined}
          onRemember={pad.slot === "tech" ? setRemember : undefined}
          onSave={(img, drawn) => {
            doSign(pad.slot, img);
            /* เซ็นสดของช่าง + ติ๊กจำไว้ = เก็บเข้าลายเซ็นประจำตัว ครั้งหน้ากดปุ่มเดียวจบ */
            if (pad.slot === "tech" && drawn && remember) mine.save(img);
            const then = pad.then;
            setPad(null);
            if (then) then();
          }} />
      )}

      {paper && (
        <OmVisitPaper visit={v} site={site} signs={sigs.signs} onClose={() => setPaper(false)} />
      )}
    </React.Fragment>
  );
}

/* ── พจนานุกรมใบรายงานเข้าบริการ (ไทย → [อังกฤษ, จีน]) ──
   ใบนี้เป็นคอมโพเนนต์ React ไม่ใช่สตริง HTML จึงแปลทีละข้อความด้วย window.pgT
   ไม่ใช่ pgDocHTML แบบรายงานออกแบบ · ข้อความที่ช่างพิมพ์เอง (ตรวจพบ/งานที่ทำ/ผล
   /ชื่ออะไหล่/คำแนะนำ) ไม่อยู่ในตารางนี้ ออกตามที่พิมพ์ไว้เสมอ */
const OM_PAPER_I18N = {
  "ใบรายงานเข้าบริการ": ["Service Visit Report", "服务工单"],
  "ชื่อไซต์": ["Site", "站点名称"],
  "รหัสไซต์": ["Site code", "站点编号"],
  "ประเภทงาน": ["Visit type", "工单类型"],
  "ขนาดระบบ": ["System size", "系统容量"],
  "สถานที่": ["Location", "地址"],
  "ผู้ติดต่อ": ["Contact", "联系人"],
  "เวลาเข้า–ออก": ["Time in – out", "进出场时间"],
  "ทีมช่าง": ["Technicians", "施工人员"],
  "สถานะค่าบริการ": ["Charge status", "费用性质"],
  "ยอดเรียกเก็บ": ["Amount billed", "应收金额"],
  "ตรวจพบ": ["Findings", "检查发现"],
  "งานที่ทำ": ["Work performed", "处理内容"],
  "ผลหลังทำงานเสร็จ": ["Result after service", "处理结果"],
  "อะไหล่ / วัสดุที่ใช้": ["Parts and materials used", "所用配件与材料"],
  "รายการ": ["Description", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "หมายเหตุ": ["Note", "备注"],
  "คำแนะนำ / นัดครั้งถัดไป": ["Recommendations / next visit", "建议与下次服务"],
  "นัดครั้งถัดไป:": ["Next visit:", "下次服务："],
  "รูปก่อนทำงาน": ["Before service", "施工前照片"],
  "รูปหลังทำงาน": ["After service", "施工后照片"],
  "ช่างผู้ให้บริการ": ["Service technician", "服务技师"],
  "ลูกค้าผู้รับบริการ": ["Customer", "客户签收"],
  "อนุมัติโดย": ["Approved by", "批准人"],
  "ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ": ["Signed electronically in the system", "已在系统内电子签名"],
  "เอกสารนี้ออกจากระบบงานบริการหลังการขาย": ["Issued by the O&M system of", "本文件由售后运维系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "รูปที่": ["Photo", "照片"],
  "บาท": ["THB", "泰铢"],
  "แผง": ["modules", "块组件"],
  "รูป": ["photos", "张"],
  /* ค่าที่มาจาก om.jsx — สถานะใบ ประเภทงาน และสถานะค่าบริการ */
  "ร่าง": ["Draft", "草稿"],
  "รอตรวจ": ["Pending review", "待审核"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "เข้าซ่อม": ["Repair", "维修"],
  "ล้างแผง": ["Panel cleaning", "组件清洗"],
  "เข้าตรวจเช็กระบบ": ["System inspection", "系统巡检"],
  "อยู่ในประกัน": ["Under warranty", "保修范围内"],
  "คิดค่าบริการ": ["Chargeable", "收费"],
  "บริการให้ฟรี": ["Goodwill (free)", "免费服务"],
  "ยังไม่ได้ตัดสิน": ["Not determined", "未确定"],
};

/* ══════════════════════════════════════════════════
   กระดาษ A4 — สั่งพิมพ์ของเบราว์เซอร์แล้วเลือก "บันทึกเป็น PDF"
   ══════════════════════════════════════════════════ */
function OmPRow({ k, v }) {
  return (
    <React.Fragment>
      <div style={{ padding: "6px 10px", borderRight: "1px solid #DCE4DF", borderBottom: "1px solid #DCE4DF",
        fontSize: 10.5, fontWeight: 700, color: "#0A4D68", background: "#F3F7F4" }}>{k}</div>
      <div style={{ padding: "6px 10px", borderBottom: "1px solid #DCE4DF", fontSize: 11, color: "#15211A" }}>{v || "-"}</div>
    </React.Fragment>
  );
}
function OmPBlock({ title, children, avoid }) {
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
const omPara = (t) => (
  <div style={{ fontSize: 11.5, lineHeight: 1.65, color: "#15211A", whiteSpace: "pre-wrap" }}>{t || "—"}</div>
);

/* photos = ส่งรูปเข้ามาเองได้ — ใบแจ้งซ่อมเก็บรูปที่ omTicketPhotos คนละที่กับใบรายงาน
   ไม่ส่งมาก็ใช้รูปของใบรายงานตามเดิม */
function OmVisitPaper({ visit, site, signs, photos, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  /* ภาษาของใบ — สลับได้สดจากแถบด้านบน (แถบนี้ไม่ติดไปในหน้าพิมพ์อยู่แล้ว)
     T() คืนภาษาไทยเดิมทุกคำที่ไม่มีในตาราง และคืนของเดิมทั้งหมดเมื่อเลือกไทย
     วันที่: ไทยเป็น พ.ศ. อังกฤษ/จีนเป็น ค.ศ. จึงต้องแยกฟังก์ชันกัน ห้ามแปลด้วย T() */
  const [lang, setLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));
  const pickLang = (id) => { setLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = React.useMemo(() => (window.pgT ? window.pgT(OM_PAPER_I18N, lang) : (k) => k), [lang]);
  const DT = (iso) => (!iso ? "-" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang));
  const DTs = (iso) => (!iso ? "-" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang));
  const own = window.useOmVisitPhotos(visit.id);
  const photoList = photos || own.photos;
  const v = visit;
  const st = window.omVisitStatusOf(v.status);
  const kind = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
  const cov = window.omCoverTH(v.cover);
  const parts = (v.parts || []).filter((p) => p && (p.name || p.qty));
  const before = photoList.filter((p) => (p.slot || "before") === "before");
  const after = photoList.filter((p) => p.slot === "after");
  const g = signs || {};

  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบรายงานเข้าบริการ") + " " + (v.no || "") + " " + (v.date || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const th = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE", whiteSpace: "nowrap" };
  const td = { padding: "5px 7px", fontSize: 10.5, color: "#15211A", borderBottom: "1px solid #ECF1EE", verticalAlign: "top" };

  /* รูปวางสองคอลัมน์ แยกหัวข้อก่อน/หลัง — ลูกค้าเทียบได้ในหน้าเดียว */
  const shots = (title, list) => (
    !list.length ? null : (
      <OmPBlock title={T(title) + " (" + list.length + " " + T("รูป") + ")"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          {list.map((p, i) => (
            <div key={p.id} className="om-shot" style={{ breakInside: "avoid", border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
              <img src={p.dataUrl} alt={p.cap || ""} style={{ width: "100%", display: "block", background: "#F3F7F4" }} />
              <div style={{ padding: "5px 8px", fontSize: 10.5, color: "#4A5A51", borderTop: "1px solid #ECF1EE" }}>
                <b style={{ color: "#0A4D68" }}>{T("รูปที่")} {i + 1}</b>{p.cap ? " · " + p.cap : ""}
              </div>
            </div>
          ))}
        </div>
      </OmPBlock>
    )
  );

  return (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 160, background: "rgba(8,20,14,.55)", overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>
      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ใบรายงานเข้าบริการ · {window.drDateTH(v.date)}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{photos.length} รูป · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”</div>
        </div>
        {typeof window.LangPick === "function" && (
          <window.LangPick value={lang} onChange={pickLang} />
        )}
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11,
          border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* ฟอนต์ไทยของแอปไม่มีตัวอักษรจีน — เลือกจีนแล้วต้องระบุชุดฟอนต์ที่มีจีนให้ชัด ไม่งั้นเสี่ยงได้สี่เหลี่ยม */}
      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
        padding: isMobile ? "20px 16px" : "30px 34px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap",
          borderBottom: "2px solid #1B9B75", paddingBottom: 11 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.01em" }}>{T("ใบรายงานเข้าบริการ")}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: "#7A8A81", marginTop: 3 }}>SOLAR O&amp;M — SERVICE VISIT REPORT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandMark size={22} variant="light" />
              <window.BrandWord size={16} color="#0F2B33" />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#4A5A51", lineHeight: 1.75 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "#15211A" }}>{v.no}</div>
            <div>{DT(v.date)}</div>
            <div style={{ display: "inline-block", marginTop: 3, padding: "2px 9px", borderRadius: 99,
              background: st.color + "22", color: st.color, fontWeight: 700, fontSize: 10.5 }}>{T(st.th)}</div>
          </div>
        </div>

        <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "auto 1fr auto 1fr",
          border: "1px solid #DCE4DF", borderRadius: 7, overflow: "hidden" }}>
          <OmPRow k={T("ชื่อไซต์")} v={v.siteName || (site || {}).name} />
          <OmPRow k={T("รหัสไซต์")} v={v.siteCode} />
          <OmPRow k={T("ประเภทงาน")} v={T(kind.th)} />
          <OmPRow k={T("ขนาดระบบ")} v={(site || {}).kw ? site.kw + " kW" + (site.panels ? " · " + site.panels + " " + T("แผง") : "") : "-"} />
          <OmPRow k={T("สถานที่")} v={[(site || {}).address, (site || {}).province].filter(Boolean).join(" · ")} />
          <OmPRow k={T("ผู้ติดต่อ")} v={[(site || {}).phone].filter(Boolean).join(" · ")} />
          <OmPRow k={T("เวลาเข้า–ออก")} v={(v.timeIn || "-") + " – " + (v.timeOut || "-")} />
          <OmPRow k={T("ทีมช่าง")} v={v.team || v.byName} />
        </div>

        {/* ในประกันหรือคิดเงิน — คำถามแรกที่ลูกค้าถามเสมอ ต้องอยู่บนสุดของใบ */}
        <div style={{ marginTop: 14, border: "1px solid #DCE4DF", borderRadius: 9, padding: "12px 14px", breakInside: "avoid",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#4A5A51" }}>{T("สถานะค่าบริการ")}</span>
          <span style={{ padding: "3px 11px", borderRadius: 99, fontSize: 11.5, fontWeight: 800,
            background: cov.color + "22", color: cov.color }}>{T(cov.th)}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11.5, color: "#4A5A51" }}>{T("ยอดเรียกเก็บ")}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 800, color: "#15211A" }}>
            {v.charge == null ? "—" : Number(v.charge).toLocaleString("th-TH") + " " + T("บาท")}
          </span>
        </div>

        <OmPBlock title={T("ตรวจพบ")} avoid>{omPara(v.found)}</OmPBlock>
        <OmPBlock title={T("งานที่ทำ")} avoid>{omPara(v.work)}</OmPBlock>
        <OmPBlock title={T("ผลหลังทำงานเสร็จ")} avoid>{omPara(v.result)}</OmPBlock>

        {!!parts.length && (
          <OmPBlock title={T("อะไหล่ / วัสดุที่ใช้")}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={Object.assign({}, th, { width: 26 })}>#</th>
                <th style={th}>{T("รายการ")}</th><th style={th}>{T("จำนวน")}</th><th style={th}>{T("หน่วย")}</th><th style={th}>{T("หมายเหตุ")}</th>
              </tr></thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr key={i}>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", color: "#7A8A81" })}>{i + 1}</td>
                    <td style={td}>{p.name || "-"}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{p.qty || "-"}</td>
                    <td style={td}>{p.unit || "-"}</td>
                    <td style={td}>{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OmPBlock>
        )}

        {(v.advice || v.nextDue) && (
          <OmPBlock title={T("คำแนะนำ / นัดครั้งถัดไป")} avoid>
            {omPara(v.advice)}
            {v.nextDue && (
              <div style={{ marginTop: 6, fontSize: 11.5, color: "#15211A" }}>
                {T("นัดครั้งถัดไป:")} <b>{DT(v.nextDue)}</b>
              </div>
            )}
          </OmPBlock>
        )}

        {shots("รูปก่อนทำงาน", before)}
        {shots("รูปหลังทำงาน", after)}

        {/* ช่องเซ็น — ช่างกับลูกค้า เซ็นในระบบแล้วพิมพ์ลายเซ็นจริงลงบนเส้น
            ยังไม่เซ็นก็เว้นเส้นว่างไว้เซ็นด้วยปากกาที่หน้างาน */}
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, breakInside: "avoid" }}>
          {[{ t: T("ช่างผู้ให้บริการ"), n: v.byName, d: v.sentAt || v.updatedAt || v.createdAt, s: g.tech },
            { t: T("ลูกค้าผู้รับบริการ"), n: v.siteName, d: v.date, s: g.cust }].map((x, i) => (
            <div key={i} style={{ border: "1px solid #DCE4DF", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A6B62" }}>{x.t}</div>
              <div style={{ height: 42, borderBottom: "1px solid #C9D5CE", marginTop: 6, display: "flex",
                alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
                {x.s && x.s.img && <img src={x.s.img} alt="" style={{ maxWidth: "88%", maxHeight: 40, objectFit: "contain" }} />}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: "#15211A" }}>{T("ชื่อ:")} <b>{(x.s && x.s.name) || x.n || "-"}</b></div>
              <div style={{ fontSize: 11, color: "#4A5A51" }}>
                {T("วันที่:")} {DTs(x.s ? window.drSignDay(x.s) : window.drLocalDay(x.d))}
              </div>
              {x.s && x.s.img && (
                <div style={{ fontSize: 8.5, color: "#8A9A91", marginTop: 3 }}>
                  {T("ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ")} {window.drSignTime(x.s) ? window.drSignTime(x.s) + (lang === "th" ? " น." : "") : ""}
                </div>
              )}
            </div>
          ))}
        </div>

        {v.status === "approved" && (
          <div style={{ marginTop: 10, fontSize: 10, color: "#4A5A51", textAlign: "right" }}>
            {T("อนุมัติโดย")} <b style={{ color: "#15211A" }}>{v.appName || "-"}</b>
            {v.approvedAt ? " · " + DTs(window.drLocalDay(v.approvedAt)) : ""}
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 9.5, color: "#8A9A91", textAlign: "center" }}>
          {T("เอกสารนี้ออกจากระบบงานบริการหลังการขาย")} flash+solar · {v.no} · {T("พิมพ์เมื่อ")} {DTs(window.drToday())}
        </div>
      </div>
    </div>
  );
}

/* ── รายการใบรายงานทั้งหมด (แท็บในหน้าหลัก) ── */
function OmVisitList({ sites, visitStore, role, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { visits, loading, patch, remove } = visitStore;
  const [openId, setOpenId] = React.useState(null);
  const [filter, setFilter] = React.useState("");   /* "" | draft | sent | approved */
  const [q, setQ] = React.useState("");

  const siteById = React.useMemo(() => {
    const m = {};
    (sites || []).forEach((s) => { if (s && s.id) m[s.id] = s; });
    return m;
  }, [sites]);
  const roll = React.useMemo(() => window.omVisitRollup(visits), [visits]);

  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (visits || []).filter((v) => {
      if (filter && (v.status || "draft") !== filter) return false;
      if (!kw) return true;
      return [v.no, v.siteName, v.siteCode, v.work, v.found].some((x) => String(x || "").toLowerCase().includes(kw));
    });
  }, [visits, filter, q]);

  const cur = visits.find((x) => x.id === openId) || null;
  const tog = (k) => setFilter(filter === k ? "" : k);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <window.OmStat label="ใบรายงานทั้งหมด" value={roll.total} color="var(--text-1)" />
        <window.OmStat label="ยังเป็นร่าง" value={roll.draft} color="#94A3B8" on={filter === "draft"} onClick={() => tog("draft")} />
        <window.OmStat label="รอหัวหน้าตรวจ" value={roll.sent} color="#F59E0B" on={filter === "sent"} onClick={() => tog("sent")} />
        <window.OmStat label="อนุมัติแล้ว" value={roll.approved} color="#10B981" on={filter === "approved"} onClick={() => tog("approved")} />
      </div>

      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center" }}>
          <Icon name="search" size={15} color="var(--text-3)" />
        </span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขใบ · ชื่อไซต์ · เนื้องาน"
          style={Object.assign({}, window.OM_INPUT, { padding: "9px 12px 9px 34px", fontSize: 13 })} />
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
        {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}
        {!loading && !rows.length && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>
            {visits.length ? "ไม่มีใบที่ตรงกับที่ค้นหา" : "ยังไม่มีใบรายงาน — เปิดจากใบแจ้งซ่อม หรือจากนัดล้างแผงที่ทำเสร็จแล้ว"}
          </div>
        )}
        {rows.map((v) => {
          const st = window.omVisitStatusOf(v.status);
          const k = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
          return (
            <button key={v.id} onClick={() => setOpenId(v.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: isMobile ? "11px 12px" : "13px 16px",
                borderBottom: "1px solid var(--border)", background: "none", border: "none", borderTop: "none",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <Icon name={k.icon} size={16} color={k.color} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.siteName || v.siteCode} · {k.th}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                  {v.no} · {window.drShort(v.date)}
                </span>
              </span>
              {v.charge != null && <window.OmPill th={Number(v.charge).toLocaleString("th-TH") + " บาท"} color="#F59E0B" />}
              <window.OmPill th={st.th} color={st.color} />
              <Icon name="chevronRight" size={15} color="var(--text-3)" />
            </button>
          );
        })}
      </div>

      {cur && (
        <OmVisitModal visit={cur} site={siteById[cur.siteId] || null} role={role} currentUser={currentUser}
          onClose={() => setOpenId(null)} onPatch={patch} onRemove={remove} />
      )}
    </div>
  );
}

Object.assign(window, { OmVisitPhotos, OmVisitModal, OmVisitPaper, OmVisitList, OmPBlock, OmPRow });
