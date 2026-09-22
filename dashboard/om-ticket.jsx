/* ============================================================
   flash+solar — ใบแจ้งซ่อม / เคลมประกัน

   ลูกค้าโทรเข้ามาแจ้งปัญหา → เปิดใบ → ตรวจว่าอยู่ในประกันไหม → นัดวัน → เข้าไปทำ → ปิดงาน
   ปุ่มเดินสถานะสร้างจากตาราง OM_TICKET_STATUS ใน om.jsx โดยตรง
   ปุ่มที่ขึ้นบนจอจึงเป็นทางที่เดินได้จริงเสมอ ไม่มีทางกดข้ามขั้นได้

   ตั้งชื่อ top-level ขึ้นต้นด้วย Om/om (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

/* ── รูปก่อน/หลังซ่อม ──
   แยกสองแท็บเพราะรูปตอนแจ้งกับรูปหลังซ่อมคนละเรื่องกัน
   ใบที่ปิดแล้วต้องมีรูปหลังซ่อม ไม่งั้นเถียงกับลูกค้าทีหลังไม่ได้ */
function OmPhotos({ ticketId, slot, currentUser, disabled }) {
  const store = window.useOmTicketPhotos(ticketId);
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

/* ── ใบแจ้งซ่อมคือตัวรายงาน ──
   เดิมเรื่องซ่อมหนึ่งเรื่องต้องมีเอกสารสองใบ: ใบแจ้งซ่อม แล้วออก "ใบรายงานเข้าบริการ" อีกใบ
   ทั้งที่เนื้อรายงานทั้งหมด (อาการ งานที่ทำ ค่าใช้จ่าย รูปก่อน/หลัง) กรอกอยู่ในใบแจ้งซ่อมแล้ว
   ใบที่สองจึงเป็นแค่ที่แปะลายเซ็น แลกกับเลขเอกสารสองชุดที่ต้องไล่ให้ตรงกัน
   ตอนนี้เหลือใบเดียว — อะไหล่กับลายเซ็นอยู่บนใบแจ้งซ่อม (omTickets / omTicketSigns)
   แล้วพิมพ์ A4 ออกจากใบเดิมได้เลย */
function OmTicketReport({ ticket, site, role, currentUser, locked, onPatch }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const t = ticket;
  const sigs = window.useOmTicketSigns(t ? t.id : null);
  const mine = window.useOmMySign((currentUser || {}).id);
  /* รูปก่อน/หลังของใบนี้ — หน้ากระดาษต้องได้รูปชุดเดียวกับที่เห็นในหมวด 4 */
  const shots = window.useOmTicketPhotos(t ? t.id : null);
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  const [paper, setPaper] = React.useState(false);
  if (!t) return null;

  const set = (fields) => { if (!locked) onPatch(t.id, fields); };
  const doSign = (slot, img) => {
    sigs.sign(slot, img, currentUser, slot === "cust" ? (site || {}).name || "" : (currentUser || {}).name || "");
  };
  const ready = !!(sigs.signs.tech && sigs.signs.tech.img) && !!(sigs.signs.cust && sigs.signs.cust.img);

  return (
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12,
        padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)" }}>
        <Icon name="file" size={14} color="#1B9B75" />
        <span style={{ flex: 1, minWidth: 140, fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
          เลขเอกสารคือเลขใบนี้ <b style={{ color: "var(--text-1)" }}>{t.no}</b>
          <span style={{ display: "block" }}>
            {ready ? "เซ็นครบแล้ว พร้อมส่งให้ลูกค้า" : "ยังไม่ได้เซ็นครบทั้งสองฝ่าย — พิมพ์ออกมาได้ แต่ยังไม่ใช่เอกสารรับงาน"}
          </span>
        </span>
        <button type="button" onClick={() => setPaper(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none",
            background: "#1B9B75", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
          <Icon name="file" size={14} color="#fff" /> ออก Report (A4)
        </button>
      </div>

      <window.DrLabel hint="ไม่ได้ใช้อะไรก็เว้นว่างไว้">อะไหล่ / วัสดุที่ใช้</window.DrLabel>
      <window.DrRows disabled={locked} rows={t.parts} addLabel="เพิ่มอะไหล่"
        cols={[{ k: "name", th: "รายการ" }, { k: "qty", th: "จำนวน", w: 76, type: "num" },
          { k: "unit", th: "หน่วย", w: 76 }, { k: "note", th: "หมายเหตุ" }]}
        onChange={(rows) => set({ parts: rows })} />

      <div style={{ marginTop: 15 }}>
        <window.DrLabel hint="ลูกค้าเซ็นรับงานที่หน้างานได้เลย">ลายเซ็น</window.DrLabel>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 7 }}>
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
            setPad(null);
          }} />
      )}
      {paper && (
        <window.OmVisitPaper visit={window.omTicketPaperDoc(t, site)} site={site}
          signs={sigs.signs} photos={shots.photos} onFrame={locked ? null : shots.setFrame}
          onClose={() => setPaper(false)} />
      )}
    </React.Fragment>
  );
}

/* ── การ์ดใบแจ้งซ่อมในบอร์ด ── */
function OmTicketCard({ t, onOpen }) {
  const st = window.omTicketStatusOf(t.status);
  const sev = window.OM_SEVERITY_BY[t.severity] || window.OM_SEVERITY_BY.normal;
  const over = window.omTicketOverdue(t);
  const cov = window.omCoverTH(t.cover);
  return (
    <button onClick={() => onOpen(t)}
      style={{ width: "100%", textAlign: "left", fontFamily: "inherit", cursor: "pointer", marginBottom: 9,
        border: "1px solid var(--border)", borderLeft: "3px solid " + sev.color, borderRadius: 12,
        background: "var(--surface)", padding: "11px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>{t.no}</span>
        {over && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: "#EF4444" }}>
            <Icon name="alert" size={11} color="#EF4444" /> เกินกำหนด {over.over} วัน
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: sev.color }}>{sev.th}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.35 }}>
        {t.title || (window.OM_TICKET_CAT_BY[t.category] || {}).th || "(ยังไม่ได้ใส่หัวเรื่อง)"}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
        {t.siteName || t.siteCode} · {t.siteCode}
        {t.reportedAt ? " · แจ้ง " + window.drShort(t.reportedAt.slice(0, 10)) : ""}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <window.OmPill th={st.th} color={st.color} />
        <window.OmPill th={cov.th} color={cov.color} />
        {t.apptDate && <window.OmPill th={"นัด " + window.drShort(t.apptDate)} color="#0EA5E9" />}
      </div>
    </button>
  );
}

/* ── ข้อมูลงานติดตั้งเดิม (ดึงจากฐานข้อมูลงาน) ──
   ช่างที่รับเรื่องซ่อมต้องรู้ก่อนออกจากออฟฟิศว่า โทรหาใคร ไปที่ไหน ของที่ติดไว้เป็นรุ่นอะไร
   ไม่ใช่ต้องกลับไปเปิดใบงานอีกหน้าหนึ่ง — ดึงมาโชว์ตรงนี้เลย อ่านอย่างเดียว แก้ที่ใบงานต้นทาง
   ไซต์นอกระบบไม่มีใบงาน จึงใช้ข้อมูลเท่าที่ทะเบียนไซต์มี */
function OmJobFacts({ job, site }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [fileBusy, setFileBusy] = React.useState(false);
  const [fileErr, setFileErr] = React.useState(false);
  const s = site || {};
  const j = job || null;
  const phone = (j && j.phone) || s.phone || "";
  const addr = [(j && j.address) || s.address || "", (j && j.province) || s.province || ""].filter(Boolean).join(", ");
  const map = j && j.map;
  const kw = (j && j.kw) || s.kw || null;
  const specs = j ? [
    ["แบรนด์", j.brand || "—"], ["ขนาดระบบ", (j.kw || "—") + " kW"], ["จำนวนแผง", (j.panels || "—") + " แผง"],
    ["ระบบไฟฟ้า", (j.phase || "1") + " เฟส"], ["แบตเตอรี่", j.battery ? (j.batSize || "มี") : "ไม่มี"],
    ["ระบบ / ออฟติไมเซอร์", j.connect || "—"], ["ระบบ Backup", j.backup ? "มี" : "ไม่มี"],
  ] : [["ขนาดระบบ", kw ? kw + " kW" : "—"], ["จำนวนแผง", s.panels ? s.panels + " แผง" : "—"], ["แบรนด์", s.brand || "—"]];

  const cell = (label, value) => (
    <div key={label}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>{value}</div>
    </div>
  );

  return (
    <React.Fragment>
    <div style={{ border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 13,
      padding: isMobile ? 13 : 15, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
        <Icon name="sun" size={14} color="var(--primary)" />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-3)" }}>ข้อมูลงานติดตั้งเดิม</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 6 }}>{s.code || (j && j.code) || ""}</span>
        {j && <window.OmPill th={j.type === "home" ? "งานบ้าน" : "งานโครงการ"} color="#0EA5E9" />}
        {!j && <window.OmPill th="ไซต์นอกระบบ · ไม่มีใบงาน" color="#94A3B8" />}
        {s.comDate && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ติดตั้งเสร็จ {window.drDateTH(s.comDate)}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {phone && (
          <a href={"tel:" + phone} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--border-strong)", background: "var(--bg)", textDecoration: "none",
            fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--mono)" }}>
            <Icon name="phone" size={13} color="var(--text-3)" /> {phone}
          </a>
        )}
        {map && (
          <a href={map} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--border-strong)", background: "var(--bg)", textDecoration: "none", fontSize: 12.5, fontWeight: 700, color: "var(--primary-dark)" }}>
            <Icon name="pin" size={13} color="var(--primary-dark)" /> เปิดแผนที่
          </a>
        )}
        {/* แบบที่ฝ่ายออกแบบแนบไว้กับงาน (PDF) — SLD กับผังแผงอยู่ในใบนี้ ช่างซ่อมต้องใช้ตัวจริง ไม่ใช่จอ 3 มิติ
            อ่านครั้งเดียวตอนกด ไม่ subscribe ค้างไว้ เพราะไฟล์เป็น base64 ก้อนใหญ่ */}
        {j && j.hasDesign && (
          <button disabled={fileBusy}
            onClick={() => {
              setFileBusy(true);
              (window.openJobFileOnce ? window.openJobFileOnce(j.id, "design") : Promise.resolve(false))
                .then((ok) => { setFileBusy(false); if (!ok) setFileErr(true); });
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
              border: "1px solid var(--border-strong)", background: "var(--bg)", cursor: fileBusy ? "wait" : "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "#2563EB", opacity: fileBusy ? .55 : 1 }}>
            <Icon name="file" size={13} color="#2563EB" /> {fileBusy ? "กำลังเปิดแบบ…" : "เปิดแบบ (PDF)"}
          </button>
        )}
        {j && !j.hasDesign && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
            border: "1px dashed var(--border-strong)", background: "var(--surface2)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>
            <Icon name="file" size={13} color="var(--text-3)" /> ยังไม่มีไฟล์แบบแนบกับงานนี้
          </span>
        )}
      </div>
      {fileErr && (
        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)",
          border: "1px solid var(--tint-amber-bd)", borderRadius: 9, padding: "7px 10px", marginBottom: 12 }}>
          เปิดไฟล์แบบไม่สำเร็จ — ลองเปิดจากใบงานต้นทาง หรือเช็กว่าเบราว์เซอร์บล็อกป๊อปอัปอยู่หรือเปล่า
        </div>
      )}

      {addr && (
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>
          <Icon name="pin" size={12} color="var(--text-3)" style={{ verticalAlign: -1 }} /> {addr}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        {specs.map(([k, v]) => cell(k, v))}
        {j && cell("ช่างที่ติดตั้ง", (window.SF.TECH_BY_ID[j.tech] || {}).name || "—")}
        {j && cell("เซลล์เจ้าของงาน", j.salesName || "—")}
      </div>
    </div>
    </React.Fragment>
  );
}

/* ── แผงใบแจ้งซ่อม ── */
function OmTicketModal({ ticket, site, job, users, role, currentUser, visits, onOpenVisit,
  onClose, onPatch, onMove, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const canWrite = window.omCanWrite(role, null);
  const canDelete = window.omCanDelete(role);
  const [tab, setTab] = React.useState("before");
  const [delAsk, setDelAsk] = React.useState(false);
  const [moveNote, setMoveNote] = React.useState("");
  if (!ticket) return null;

  const t = ticket;
  const st = window.omTicketStatusOf(t.status);
  const over = window.omTicketOverdue(t);
  /* ใบที่ปิดแล้วล็อก — เป็นเอกสารที่ลูกค้ารับทราบแล้ว หัวหน้าเปิดกลับมาแก้ได้ที่ปุ่มเดินสถานะ */
  const locked = !canWrite || window.omTicketKey(t.status) === "closed";
  const set = (fields) => { if (!locked) onPatch(t.id, fields); };
  const nexts = window.omTicketNext(t, role);
  /* ย้อนขั้นกับตีตกเรื่องแยกออกมา ไม่ปนกับปุ่มเดินหน้า — ดูออกทันทีว่าทางไหนคือทางที่งานควรไป */
  const backs = window.omTicketBack(t, role);

  /* ระบบเดาให้ว่าเคสนี้ควรอยู่ในประกันหรือคิดเงิน จากหมวดปัญหา + ทะเบียนประกันของไซต์
     เดาให้เฉย ๆ คนตัดสินใจยังกดเปลี่ยนเองได้เสมอ */
  const guess = site ? window.omCoverOf(site, t.category) : null;

  /* ใบรายงานชุดเดิมของเรื่องนี้ (ถ้ามี) — เรียงตามวันเข้าหน้างาน วันเดียวกันใช้เวลาที่สร้างตัดสิน */
  const vSorted = (visits || []).slice().sort((a, b) =>
    String(a.date || "") < String(b.date || "") ? -1 : String(a.date || "") > String(b.date || "") ? 1
      : String(a.createdAt || "") < String(b.createdAt || "") ? -1 : 1);

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 760, maxHeight: isMobile ? "94vh" : "88vh", overflowY: "auto",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: isMobile ? "18px 18px 0 0" : 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>

        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg)", borderBottom: "1px solid var(--border)",
          padding: isMobile ? "14px 13px" : "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: st.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="wrench" size={18} color={st.color} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
                {t.title || "(ยังไม่ได้ใส่หัวเรื่อง)"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                {t.no} · {t.siteCode}{t.siteName ? " · " + t.siteName : ""}
              </div>
            </div>
            <window.OmPill th={st.th} color={st.color} />
            <button onClick={onClose} title="ปิด"
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>

          {/* ปุ่มเดินสถานะ — รายการมาจากตารางสถานะ ไม่มีทางกดข้ามขั้น */}
          {canWrite && (!!nexts.length || !!backs.length) && (
            <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap", alignItems: "center" }}>
              {nexts.map((n) => (
                <button key={n.key} onClick={() => { onMove(t, n.key, moveNote); setMoveNote(""); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none",
                    background: n.color, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                  <Icon name="arrowRight" size={14} color="#fff" /> {n.th}
                </button>
              ))}
              {backs.map((n) => {
                const drop = n.key === "rejected";
                const label = drop ? "ไม่รับเรื่อง" : "ย้อนกลับไป" + n.th;
                return (
                  <button key={n.key} title={drop ? "ตีตกเรื่องนี้ ไม่เข้าซ่อม" : "กดผิดขั้น — ถอยกลับไปขั้นก่อนหน้า"}
                    onClick={() => { onMove(t, n.key, moveNote); setMoveNote(""); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 9,
                      border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                      fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>
                    <Icon name={drop ? "x" : "undo"} size={12} color="var(--text-3)" /> {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: isMobile ? "14px 13px 24px" : "18px 20px 26px" }}>
          {over && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid #EF444440", background: "#EF44440e", borderRadius: 12 }}>
              <Icon name="alert" size={15} color="#EF4444" />
              <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>
                แจ้งมาแล้ว <b>{over.age} วัน</b> · ระดับ{(window.OM_SEVERITY_BY[t.severity] || {}).th} ควรปิดภายใน {over.limit} วัน
              </span>
            </div>
          )}
          {window.omTicketKey(t.status) === "closed" && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid #10B98140", background: "#10B98114", borderRadius: 12 }}>
              <Icon name="lock" size={15} color="#10B981" />
              <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>
                ปิดงานแล้วโดย <b>{t.closedByName || "-"}</b>
                {t.closedAt ? " · " + window.drDateTH(t.closedAt.slice(0, 10)) : ""} · แก้ไขไม่ได้
                {window.omCanApprove(role) ? " — หัวหน้ากดเปิดกลับมาทำต่อได้ที่ปุ่มด้านบน" : ""}
              </span>
            </div>
          )}

          <OmJobFacts job={job} site={site} />

          <window.DrSection n="1" title="ลูกค้าแจ้งว่าอะไร" tone="#7C5CFC">
            <window.DrLabel hint="สรุปสั้น ๆ ให้อ่านแล้วรู้เรื่องทันที">หัวเรื่อง</window.DrLabel>
            <input value={t.title || ""} disabled={locked} onChange={(e) => set({ title: e.target.value })}
              placeholder="เช่น อินเวอร์เตอร์ขึ้นไฟแดง ไฟไม่เข้าบ้าน"
              style={window.OM_INPUT} />
            <div style={{ marginTop: 13 }}>
              <window.DrLabel>รายละเอียด</window.DrLabel>
              <window.DrText value={t.detail} disabled={locked} rows={3}
                placeholder="ลูกค้าเล่าว่าอะไร เกิดตั้งแต่เมื่อไหร่ เคยเป็นมาก่อนไหม"
                onChange={(v) => set({ detail: v })} />
            </div>
            <div style={{ marginTop: 13 }}>
              <window.DrLabel>หมวดปัญหา</window.DrLabel>
              <window.DrChips options={window.OM_TICKET_CAT} value={t.category} disabled={locked}
                onChange={(v) => set({ category: v || "other" })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <window.DrLabel hint="ใช้คิดกำหนดปิดเคส">ความรุนแรง</window.DrLabel>
                <window.DrChips options={window.OM_SEVERITY} value={t.severity} disabled={locked}
                  onChange={(v) => set({ severity: v || "normal" })} />
              </div>
              <div>
                <window.DrLabel>แจ้งเข้ามาทางไหน</window.DrLabel>
                <window.DrChips options={window.OM_TICKET_SOURCE} value={t.source} disabled={locked}
                  onChange={(v) => set({ source: v || "phone" })} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <window.DrLabel hint="วันที่ลูกค้าแจ้งจริง ใช้นับกำหนดปิดเคส">วันที่แจ้ง</window.DrLabel>
              <input type="date" value={(t.reportedAt || "").slice(0, 10)} disabled={locked}
                onChange={(e) => { if (e.target.value) set({ reportedAt: e.target.value + "T00:00:00.000Z" }); }}
                style={Object.assign({}, window.OM_INPUT, { width: "auto", padding: "8px 11px", fontFamily: "var(--mono)", fontSize: 13 })} />
            </div>
          </window.DrSection>

          <window.DrSection n="2" title="อยู่ในประกันหรือคิดเงิน" tone="#1B9B75"
            hint={site ? "" : "ไม่พบทะเบียนไซต์ ตรวจประกันอัตโนมัติไม่ได้"}>
            {guess && guess.note && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", marginBottom: 12,
                border: "1px solid var(--border)", background: "var(--surface)", borderRadius: 11 }}>
                <Icon name="shield" size={15} color={window.omCoverTH(guess.cover).color} />
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-1)" }}>
                  ระบบตรวจให้: <b style={{ color: window.omCoverTH(guess.cover).color }}>{window.omCoverTH(guess.cover).th}</b>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{guess.note}</span>
                </span>
                {!locked && t.cover !== guess.cover && (
                  <button onClick={() => set({ cover: guess.cover, coverWid: guess.wid, coverNote: guess.note })}
                    style={{ padding: "6px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>ใช้ค่านี้</button>
                )}
              </div>
            )}
            <window.DrChips disabled={locked} value={t.cover} onChange={(v) => set({ cover: v || "unknown" })}
              options={["warranty", "charge", "goodwill", "unknown"].map((k) => ({ key: k, th: window.omCoverTH(k).th, color: window.omCoverTH(k).color }))} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 12, marginTop: 13 }}>
              <div>
                <window.DrLabel>เหตุผล / หมายเหตุ</window.DrLabel>
                <input value={t.coverNote || ""} disabled={locked} onChange={(e) => set({ coverNote: e.target.value })}
                  placeholder="เช่น อินเวอร์เตอร์อยู่ในประกันถึง 2573 · ค่าเดินทางคิดแยก"
                  style={Object.assign({}, window.OM_INPUT, { padding: "8px 11px", fontSize: 13 })} />
              </div>
              <div>
                <window.DrLabel hint="บาท">ค่าบริการที่เสนอ</window.DrLabel>
                <input value={t.quoteAmt == null ? "" : String(t.quoteAmt)} disabled={locked} inputMode="decimal"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); set({ quoteAmt: v === "" ? null : +v }); }}
                  style={Object.assign({}, window.OM_INPUT, { padding: "8px 11px", fontFamily: "var(--mono)", textAlign: "right" })} />
              </div>
            </div>
          </window.DrSection>

          <window.DrSection n="3" title="นัดวันเข้าหน้างาน" tone="#F59E0B">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
              <div>
                <window.DrLabel>วันนัด</window.DrLabel>
                <input type="date" value={t.apptDate || ""} disabled={locked} onChange={(e) => set({ apptDate: e.target.value })}
                  style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
              </div>
              <div>
                <window.DrLabel>ตั้งแต่</window.DrLabel>
                <window.PgTime value={t.apptFrom || ""} disabled={locked} onChange={(x) => set({ apptFrom: x })}
                  style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
              </div>
              <div>
                <window.DrLabel>ถึง</window.DrLabel>
                <window.PgTime value={t.apptTo || ""} disabled={locked} onChange={(x) => set({ apptTo: x })}
                  style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
              </div>
            </div>
            {t.apptDate && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>{window.drDateTH(t.apptDate, true)}</div>
            )}
            {/* มอบหมายผู้รับผิดชอบ — เลือกได้จากผู้ใช้ทุกคนในระบบ ไม่ใช่เฉพาะช่าง
                (งานซ่อมบางเรื่องคนที่ต้องตามคือแอดมินหรือวิศวกร) · เปลี่ยนตัวคนแล้วเด้งแจ้งเตือนทันที
                ไม่งั้นคนที่ถูกมอบหมายจะไม่รู้เรื่องจนกว่าจะบังเอิญเปิดบอร์ดมาดู */}
            <div style={{ marginTop: 12 }}>
              <window.DrLabel>ผู้รับผิดชอบ</window.DrLabel>
              <select value={t.assigneeId || ""} disabled={locked}
                onChange={(e) => {
                  const id = e.target.value;
                  const u = (users || []).find((x) => x.id === id) || null;
                  set({ assigneeId: id || null, assigneeName: u ? u.name : "", techId: u ? (u.techId || null) : null });
                  if (u && window.omNotify) {
                    window.omNotify({ toUserId: u.id, toTechId: u.techId || null, omSiteId: t.siteId,
                      title: "มอบหมายงานบริการ · " + (t.title || t.no),
                      body: (t.siteName || t.siteCode || "") + (t.apptDate ? " · นัด " + window.drShort(t.apptDate) : " · ยังไม่ได้นัดวัน") });
                  }
                }}
                style={Object.assign({}, window.OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })}>
                <option value="">— ยังไม่ได้มอบหมาย —</option>
                {(users || []).filter((u) => u.active !== false).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{u.techId ? "" : " (ไม่ใช่ช่าง)"}</option>
                ))}
              </select>
              {/* ใบเก่าที่เคยเลือกไว้ตอนยังเลือกได้แค่ช่าง — บอกให้รู้ว่าใครถืออยู่ จะได้เลือกใหม่ได้ถูก */}
              {!t.assigneeId && t.techId && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5 }}>
                  เดิมมอบหมายให้ช่าง {(window.SF.TECH_BY_ID[t.techId] || {}).name || t.techId}
                </div>
              )}
            </div>
          </window.DrSection>

          <window.DrSection n="4" title="รูปประกอบ" tone="#0EA5E9" hint="ก่อนซ่อม = สภาพตอนลูกค้าแจ้ง">
            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              {[["before", "ก่อนซ่อม"], ["after", "หลังซ่อม"]].map(([k, th]) => (
                <button key={k} type="button" onClick={() => setTab(k)}
                  style={{ padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    fontSize: 12.5, fontWeight: 700,
                    border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
                    background: tab === k ? "var(--primary-soft)" : "var(--surface)",
                    color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>{th}</button>
              ))}
            </div>
            <OmPhotos ticketId={t.id} slot={tab} currentUser={currentUser} disabled={locked} />
          </window.DrSection>

          <window.DrSection n="5" title="ผลการซ่อม" tone="#10B981">
            <window.DrLabel hint="ทำอะไรไปบ้าง เปลี่ยนอะไร">สรุปงานที่ทำ</window.DrLabel>
            <window.DrText value={t.result} disabled={locked} rows={3}
              placeholder="เช่น เปลี่ยนฟิวส์ DC ฝั่งสตริง 2 · ขันจุดต่อใหม่ทั้งแถว · ทดสอบแล้วไฟเข้าปกติ"
              onChange={(v) => set({ result: v })} />
            <div style={{ marginTop: 13 }}>
              <window.DrLabel hint="บันทึกตอนกดปิดงาน">หมายเหตุปิดงาน</window.DrLabel>
              <input value={t.closeNote || ""} disabled={locked} onChange={(e) => set({ closeNote: e.target.value })}
                placeholder="เช่น ลูกค้ารับทราบและพอใจ · แนะนำให้ล้างแผงรอบหน้าเร็วขึ้น"
                style={Object.assign({}, window.OM_INPUT, { padding: "8px 11px", fontSize: 13 })} />
            </div>
          </window.DrSection>

          {/* รายงานเข้าบริการ — ใบแจ้งซ่อมใบนี้คือตัวเอกสารเอง ไม่ต้องออกใบที่สองอีกต่อไป
              ของที่ต้องกรอกเพิ่มจากด้านบนมีแค่อะไหล่ที่ใช้กับลายเซ็นรับงาน แล้วกดพิมพ์ A4 ได้เลย */}
          <window.DrSection n="6" title="รายงานเข้าบริการ" tone="#1B9B75" hint="ใบแจ้งซ่อมใบนี้คือตัวรายงาน">
            <OmTicketReport ticket={t} site={site} role={role} currentUser={currentUser}
              locked={locked} onPatch={onPatch} />
            {/* ใบรายงานชุดเดิมที่เคยออกไว้ก่อนรวมเป็นใบเดียว — ยังเปิดดูได้ ไม่ปล่อยให้เอกสารเก่าหายไป */}
            {!!vSorted.length && (
              <div style={{ marginTop: 15 }}>
                <window.DrLabel hint="ออกไว้ก่อนรวมเป็นใบเดียว">ใบรายงานชุดเดิมของเรื่องนี้</window.DrLabel>
                {vSorted.map((v) => (
                  <button key={v.id} type="button" onClick={() => onOpenVisit && onOpenVisit(v.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", marginTop: 7,
                      border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <Icon name="file" size={14} color="var(--text-3)" />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                      {v.no}
                      <span style={{ display: "block", fontSize: 11, fontWeight: 400, color: "var(--text-3)" }}>
                        เข้าหน้างาน {window.drShort(v.date)}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={14} color="var(--text-3)" />
                  </button>
                ))}
              </div>
            )}
          </window.DrSection>

          {/* ประวัติการเดินสถานะ — ใช้ตอบลูกค้าว่าเรื่องค้างอยู่ตรงไหนและใครทำอะไรเมื่อไหร่ */}
          <window.DrSection n="7" title="ประวัติเรื่องนี้" tone="#94A3B8" hint={(t.hist || []).length + " รายการ"}>
            {(t.hist || []).slice().reverse().map((h, i) => {
              const to = window.omTicketStatusOf(h.to);
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "7px 0",
                  borderBottom: i < (t.hist || []).length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: to.color, marginTop: 5, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                      {to.th}{h.note ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · {h.note}</span> : null}
                    </span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                      {String(h.at || "").slice(0, 10) ? window.drShort(h.at.slice(0, 10)) + " " + String(h.at).slice(11, 16) : ""}
                      {h.byName ? " · " + h.byName : ""}
                    </span>
                  </span>
                </div>
              );
            })}
          </window.DrSection>

          {canDelete && (
            delAsk ? (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", flexWrap: "wrap",
                border: "1px solid #EF444440", background: "#EF44440e", borderRadius: 12 }}>
                <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                  ลบใบ {t.no} ทั้งใบ? รูปและประวัติหายถาวร เรียกคืนไม่ได้
                </span>
                <button onClick={() => setDelAsk(false)}
                  style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ยกเลิก</button>
                <button onClick={() => { onRemove(t.id); onClose(); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none",
                    background: "#EF4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                  <Icon name="trash" size={14} color="#fff" /> ลบเลย
                </button>
              </div>
            ) : (
              <button onClick={() => setDelAsk(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                <Icon name="trash" size={14} color="#EF4444" /> ลบใบแจ้งซ่อมนี้ (เฉพาะแอดมิน)
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ── บอร์ดใบแจ้งซ่อม ──
   จอใหญ่เป็นคอลัมน์ตามสถานะ จอเล็กเป็นรายการจัดกลุ่ม (คอลัมน์แนวนอนบนมือถือใช้ไม่ได้จริง)
   ปิดงานกับไม่รับเรื่องยุบรวมเป็นกลุ่มเดียว ไม่งั้นบอร์ดจะยาวขึ้นเรื่อย ๆ ตามเวลา */
/* บอร์ดเหลือ 3 ช่อง: แจ้งเข้ามาใหม่ → รับเรื่อง → นัดวันเข้าแก้ไข
   (ปิดงานแล้วไปอยู่ในรายการ "ปิดไปแล้ว" ด้านล่าง ไม่ต้องมีช่องของตัวเอง) */
const OM_BOARD_COLS = ["new", "accepted", "scheduled"];

function OmTicketBoard({ sites, jobById, users, ticketStore, visitStore, role, currentUser, onOpenVisit }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { tickets, loading, save, patch, remove } = ticketStore;
  const [openId, setOpenId] = React.useState(null);
  const [showDone, setShowDone] = React.useState(false);
  const [newFor, setNewFor] = React.useState("");     /* ไซต์ที่เลือกในกล่องเปิดเรื่องใหม่ */
  const canWrite = window.omCanWrite(role, null);

  const siteById = React.useMemo(() => {
    const m = {};
    (sites || []).forEach((s) => { if (s && s.id) m[s.id] = s; });
    return m;
  }, [sites]);

  const cur = tickets.find((x) => x.id === openId) || null;
  const roll = React.useMemo(() => window.omTicketRollup(tickets), [tickets]);
  const closed = tickets.filter((t) => !window.omTicketOpen(t));

  const openNew = () => {
    const s = siteById[newFor];
    if (!canWrite || !s) return;
    const rec = window.omBlankTicket(s, tickets, currentUser);
    save(rec);
    /* push: false — ใบเพิ่งเปิด ยังไม่รู้ว่าเป็นงานของใคร จึงไม่เด้ง LINE หาใคร
       ยังขึ้นในกระดิ่งของทุกคนที่มีสิทธิ์ om เหมือนเดิม และอยู่บนบอร์ดนี้ให้เห็นอยู่แล้ว
       คนที่ถูกมอบหมายจะได้ LINE ตอนเลือกผู้รับผิดชอบ (ใบ "มอบหมายงานบริการ" ด้านบน) */
    window.omNotify({ toPerm: "om", omSiteId: s.id, push: false, title: "ใบแจ้งซ่อมใหม่ · " + rec.no,
      body: (s.name || s.code || "") + " — เปิดเรื่องโดย " + ((currentUser || {}).name || "") });
    setOpenId(rec.id);
  };
  const move = (t, to, note) => {
    const rec = window.omTicketMove(t, to, currentUser, note);
    if (rec) save(rec);
  };

  const col = (key) => {
    const st = window.omTicketStatusOf(key);
    const list = tickets.filter((t) => window.omTicketKey(t.status) === key);
    return (
      <div key={key} style={{ minWidth: isMobile ? 0 : 240, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: st.color }} />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{st.th}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>{list.length}</span>
        </div>
        {list.map((t) => <OmTicketCard key={t.id} t={t} onOpen={(x) => setOpenId(x.id)} />)}
        {!list.length && (
          <div style={{ border: "1px dashed var(--border)", borderRadius: 11, padding: "14px 8px",
            textAlign: "center", fontSize: 11.5, color: "var(--text-3)" }}>ไม่มี</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <window.OmStatRow id="om-ticket" title="สรุปใบแจ้งซ่อม">
        <window.OmStat label="เรื่องที่ยังไม่ปิด" value={roll.open} color="var(--text-1)"
          hint={roll.newly ? "แจ้งใหม่ยังไม่ได้ดู " + roll.newly : ""} />
        <window.OmStat label="เกินกำหนดปิดเคส" value={roll.overdue} color="#EF4444" />
        <window.OmStat label="ระบบดับทั้งหมด" value={roll.down} color="#EF4444" />
        <window.OmStat label="ปิดไปแล้ว" value={roll.closed} color="#10B981" />
      </window.OmStatRow>

      {/* เปิดเรื่องใหม่ต้องเลือกไซต์ก่อนเสมอ — ใบแจ้งซ่อมที่ไม่ผูกไซต์ตรวจประกันไม่ได้ */}
      {canWrite && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
          border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>เปิดเรื่องใหม่ให้ไซต์</span>
          <window.SearchPick value={newFor} onChange={setNewFor} minWidth={180}
            items={(sites || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"))}
            emptyLabel="— ยังไม่เลือกไซต์ —"
            placeholder="พิมพ์ชื่อลูกค้าหรือรหัสไซต์เพื่อค้นหา" />
          <button onClick={openNew} disabled={!newFor}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none",
              background: newFor ? "var(--primary)" : "var(--surface3)", color: newFor ? "#fff" : "var(--text-3)",
              cursor: newFor ? "pointer" : "default", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="plus" size={14} color={newFor ? "#fff" : "var(--text-3)"} /> เปิดใบแจ้งซ่อม
          </button>
        </div>
      )}

      {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, alignItems: "flex-start",
        overflowX: isMobile ? "visible" : "auto", paddingBottom: 4 }}>
        {OM_BOARD_COLS.map(col)}
      </div>

      {!!closed.length && (
        <div>
          <button onClick={() => setShowDone((v) => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="chevronDown" size={14} style={{ transform: showDone ? "none" : "rotate(-90deg)" }} />
            เรื่องที่จบแล้ว {closed.length} ใบ
          </button>
          {showDone && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10, marginTop: 11 }}>
              {closed.map((t) => <OmTicketCard key={t.id} t={t} onOpen={(x) => setOpenId(x.id)} />)}
            </div>
          )}
        </div>
      )}

      {cur && (
        <OmTicketModal ticket={cur} site={siteById[cur.siteId] || null} job={(jobById || {})[cur.siteId] || null}
          users={users} role={role} currentUser={currentUser}
          visits={((visitStore || {}).visits || []).filter((v) => v.ticketId === cur.id)}
          onOpenVisit={onOpenVisit}
          onClose={() => setOpenId(null)} onPatch={patch} onMove={move} onRemove={remove} />
      )}
    </div>
  );
}

Object.assign(window, { OmPhotos, OmJobFacts, OmTicketCard, OmTicketReport, OmTicketModal, OmTicketBoard, OM_BOARD_COLS });
