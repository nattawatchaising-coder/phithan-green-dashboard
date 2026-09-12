/* ============================================================
   flash+solar — ใบเบิกเงินหน้างาน: หน้ารายการ · แผงใบเบิก · ยอดรายคน · ยอดรายไซต์

   ตรรกะทั้งหมดอยู่ใน expense.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มยืมของรายงานประจำวัน (window.DrLabel / DrText / DrSection / DrChips / DrRows)
   เพราะทุกโมดูลในระบบต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   ตั้งชื่อ top-level ขึ้นต้นด้วย Ec/ec กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const EC_INPUT = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

function EcPill({ th, color, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      fontSize: 11.5, fontWeight: 700, color: color, background: color + "1a", borderRadius: 99, padding: "3px 10px" }}>
      {th}{sub && <span style={{ fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </span>
  );
}

function EcStat({ label, value, unit, color, hint, on, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ flex: 1, minWidth: 130, textAlign: "left", padding: "11px 13px", borderRadius: 12, fontFamily: "inherit",
        background: on ? (color || "var(--primary)") + "14" : "var(--surface2)",
        border: "1px solid " + (on ? (color || "var(--primary)") : "var(--border)"),
        cursor: onClick ? "pointer" : "default" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 800, color: color, lineHeight: 1.25 }}>
        {value}{unit && <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 3, opacity: .75 }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{hint}</div>}
    </button>
  );
}

/* ── รูปบิล/ใบเสร็จ ── (ลอกโครงจาก DrPhotos views-daily.jsx:269)
   ย่อที่ 1400px คุณภาพ 0.78 สูงกว่ารูปหน้างาน เพราะต้องอ่านตัวเลขในบิลออก
   คนอนุมัติต้องเปิดดูได้เสมอ ล็อกเฉพาะการเพิ่ม/ลบ */
function EcReceipts({ claimId, currentUser, disabled, count, big, onBig }) {
  const { shots, add, remove, sync } = window.useEcReceipts(claimId);
  const [busy, setBusy] = React.useState(0);

  /* จำนวนรูปสะท้อนกลับไปที่ตัวใบ ให้รายการบอกได้ว่าใบไหนไม่มีบิลแนบโดยไม่ต้องโหลดรูป */
  React.useEffect(() => { sync(count); }, [shots.length, count]);

  const [err, setErr] = React.useState("");

  /* รูปถ่าย — ย่อก่อนเก็บเสมอ รูปจากมือถือใบเดียวใหญ่กว่าโควตาที่ควรเก็บทั้งใบ */
  const onPickImg = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setErr("");
    setBusy(files.length);
    for (const f of files) {
      try { add(await window.resizeImageFile(f, 1400, 0.78), currentUser, { kind: "img", name: f.name, size: f.size }); }
      catch (e2) { setErr("อ่านรูปไม่สำเร็จ: " + f.name); }
      setBusy((n) => n - 1);
    }
  };

  /* ไฟล์ PDF — ใบเสร็จอิเล็กทรอนิกส์ที่ร้านส่งมาทางอีเมล/ไลน์ แนบทั้งไฟล์ไม่ต้องถ่ายจอ
     PDF ย่อไม่ได้เหมือนรูป จึงต้องกันขนาดไว้ตั้งแต่ตอนเลือก — ไฟล์ใหญ่ทำให้ใบนี้เปิดช้าไปตลอด */
  const onPickPdf = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setErr("");
    setBusy(files.length);
    for (const f of files) {
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if (!isPdf) setErr("รองรับเฉพาะไฟล์ PDF: " + f.name);
      else if (f.size > window.EC_PDF_MAX_MB * 1024 * 1024)
        setErr("ไฟล์ใหญ่เกิน " + window.EC_PDF_MAX_MB + " MB — " + f.name + " (" + window.ecFileSize(f.size) + ") ลองบีบอัดหรือถ่ายเป็นรูปแทน");
      else {
        try { add(await window.readFileAsDataURL(f), currentUser, { kind: "pdf", name: f.name, size: f.size }); }
        catch (e2) { setErr("อ่านไฟล์ไม่สำเร็จ: " + f.name); }
      }
      setBusy((n) => n - 1);
    }
  };

  const pickBtn = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
    border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
    fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" };

  return (
    <div>
      {!disabled && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: shots.length ? 12 : 0 }}>
          <label style={pickBtn}>
            <Icon name="camera" size={15} /> {busy ? "กำลังใส่บิล " + busy + " ใบ..." : "ถ่าย/เลือกรูปบิล"}
            <input type="file" accept="image/*" multiple onChange={onPickImg} style={{ display: "none" }} />
          </label>
          <label style={pickBtn}>
            <Icon name="file" size={15} /> แนบไฟล์ PDF
            <input type="file" accept="application/pdf,.pdf" multiple onChange={onPickPdf} style={{ display: "none" }} />
          </label>
        </div>
      )}
      {err && (
        <div style={{ fontSize: 12, color: "#EF4444", margin: "6px 0" }}>{err}</div>
      )}
      {!shots.length && (
        <div style={{ fontSize: 12, color: disabled ? "var(--text-3)" : "#F59E0B", marginTop: disabled ? 0 : 4 }}>
          {disabled ? "ใบนี้ไม่มีบิลแนบ" : "ยังไม่มีบิลแนบ — ใบที่ไม่มีบิลคนอนุมัติจะตรวจยอดไม่ได้"}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 11 }}>
        {shots.map((r) => (
          <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden",
            background: "var(--surface)", position: "relative" }}>
            {window.ecReceiptKind(r) === "pdf" ? (
              <button type="button" onClick={() => onBig && onBig(r)} title="เปิดดูไฟล์"
                style={{ width: "100%", height: 130, border: "none", background: "var(--surface2)", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7,
                  padding: "8px 10px", fontFamily: "inherit" }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center",
                  background: "#EF44441a" }}>
                  <Icon name="file" size={18} color="#EF4444" />
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-1)", textAlign: "center",
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  wordBreak: "break-all", lineHeight: 1.35 }}>{r.name || "ใบเสร็จ.pdf"}</span>
                <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>PDF{r.size ? " · " + window.ecFileSize(r.size) : ""}</span>
              </button>
            ) : (
              <img src={r.dataUrl} alt="รูปบิล" onClick={() => onBig && onBig(r)}
                style={{ width: "100%", height: 130, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
            )}
            {!disabled && (
              <button type="button" onClick={() => remove(r.id)} title="ลบบิลนี้"
                style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 8, border: "none",
                  background: "rgba(8,20,14,.62)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Icon name="trash" size={13} color="#fff" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ดูบิลเต็มจอ — บิลถ่ายจากมือถือมักตัวเล็ก ดูจากรูปย่อแล้วอ่านตัวเลขไม่ออก
   ไฟล์ PDF เปิดในจอนี้เลย ไม่เด้งแท็บใหม่ — ตัวบล็อกป๊อปอัปของเบราว์เซอร์กินแท็บใหม่ไปเงียบ ๆ
   คนกดจะนึกว่าปุ่มเสีย ปุ่ม "เปิดแท็บใหม่" ยังมีไว้ให้สำหรับคนที่อยากดูเต็มจอจริง ๆ */
function EcBigShot({ shot, onClose }) {
  const isPdf = shot && window.ecReceiptKind(shot) === "pdf";
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (!isPdf || !shot) { setUrl(""); return; }
    let u = "";
    try { u = window.dataUrlToBlobUrl(shot.dataUrl); } catch (e) { u = ""; }
    setUrl(u);
    /* คืนหน่วยความจำเมื่อปิดจอ — blob URL ค้างอยู่จนกว่าจะรีโหลดหน้า ถ้าไม่เพิกถอนเอง */
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [isPdf, shot && shot.id]);

  if (!shot) return null;

  if (!isPdf) {
    return (
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(8,20,26,.86)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 18, cursor: "zoom-out" }}>
        <img src={shot.dataUrl} alt="รูปบิล" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(8,20,26,.86)",
      display: "flex", flexDirection: "column", padding: 18, gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <Icon name="file" size={16} color="#fff" />
        <span style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>
          {shot.name || "ใบเสร็จ.pdf"}{shot.size ? " · " + window.ecFileSize(shot.size) : ""}
        </span>
        <a href={url || shot.dataUrl} target="_blank" rel="noopener noreferrer"
          style={{ padding: "7px 13px", borderRadius: 9, background: "rgba(255,255,255,.16)", color: "#fff",
            fontSize: 12, fontWeight: 700, textDecoration: "none" }}>เปิดแท็บใหม่</a>
        <a href={shot.dataUrl} download={shot.name || "ใบเสร็จ.pdf"}
          style={{ padding: "7px 13px", borderRadius: 9, background: "rgba(255,255,255,.16)", color: "#fff",
            fontSize: 12, fontWeight: 700, textDecoration: "none" }}>ดาวน์โหลด</a>
        <button onClick={onClose} title="ปิด"
          style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "rgba(255,255,255,.16)",
            color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
          <Icon name="x" size={16} color="#fff" />
        </button>
      </div>
      {url ? (
        <iframe src={url} title="บิล" style={{ flex: 1, width: "100%", border: "none", borderRadius: 10, background: "#fff" }} />
      ) : (
        <div style={{ flex: 1, display: "grid", placeItems: "center", color: "#fff", fontSize: 13 }}>
          เปิดไฟล์ไม่สำเร็จ — ลองกดดาวน์โหลดแล้วเปิดด้วยโปรแกรมอ่าน PDF
        </div>
      )}
    </div>
  );
}

/* ── แผงใบเบิกหนึ่งใบ ── */
function EcClaimModal({ claim, job, users, role, currentUser, onClose, onPatch, onMove, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [note, setNote] = React.useState("");
  const [delAsk, setDelAsk] = React.useState(false);
  const [payRef, setPayRef] = React.useState("");   /* เลขสลิป/เลขอ้างอิงการโอน ตอนกดจ่ายคืน */
  const [bigShot, setBigShot] = React.useState(null);
  if (!claim) return null;

  const c = claim;
  const st = window.ecStatusOf(c.status);
  const pay = window.ecPayOf(c.payMethod);
  const kind = window.ecKindOf(c.kind);
  const mine = currentUser && c.byId === currentUser.id;
  /* ใบที่ส่งไปแล้วเจ้าของแก้ไม่ได้ — ไม่งั้นแก้ตัวเลขหลังคนอนุมัติอ่านไปแล้ว
     ใบที่จ่ายแล้วล็อกถาวร เป็นหลักฐานการจ่ายเงิน */
  const locked = c.status !== "draft" || !mine;
  const set = (fields) => { if (!locked) onPatch(c.id, fields); };
  const nexts = window.ecNext(c, role, currentUser);
  const chk = window.ecApproveCheck(c, currentUser, role);
  const canDel = window.ecCanDelete(role) || (mine && c.status === "draft");
  const total = window.ecSum(c.items);
  /* Firebase ทิ้งอ็อบเจกต์ว่างเสมอ — DrRows เพิ่มแถวใหม่เป็น {} เปล่า ๆ
     ใบนี้เขียนตรงลงฐานข้อมูลทุกครั้งที่แก้ (ไม่ได้พักไว้ในฟอร์มแบบรายงานประจำวัน)
     ถ้าไม่เติมช่องว่างให้ครบก่อน แถวที่เพิ่งกดเพิ่มจะหายไปทันทีโดยไม่มีข้อความอะไรบอก */
  const ecRowsClean = (rows) => (rows || []).map((r) => ({
    name: (r && r.name) || "", qty: (r && r.qty) || "", unit: (r && r.unit) || "",
    price: (r && r.price) || "", amount: (r && r.amount) || "",
  }));

  const del = () => {
    if (delAsk) return;
    setDelAsk(true);
    window.askConfirm({
      title: "ลบใบเบิก " + (c.no || "") + " ?",
      body: c.status === "paid" || c.status === "approved"
        ? "ใบนี้ผ่านการอนุมัติแล้ว การลบทิ้งจะทำให้ยอดของ " + (c.byName || "") + " หายไปด้วย"
        : "ลบแล้วกู้คืนไม่ได้",
      danger: true,
    }).then((ok) => { setDelAsk(false); if (ok) { onRemove(c.id); onClose(); } });
  };

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 18, width: "min(760px, 100%)",
          maxHeight: isMobile ? "94dvh" : "92dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* หัว */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: isMobile ? "13px 14px" : "15px 18px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0,
            background: kind.color + "1a" }}>
            <Icon name="wallet" size={17} color={kind.color} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>{kind.th}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
              {c.no} · {c.byName || "-"} · {window.drDateTH(c.date)}
            </div>
          </div>
          <EcPill th={st.th} color={st.color} />
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="x" size={15} color="var(--text-2)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 13 : 18 }}>

          {/* ยอดรวม — ตัวเลขที่ทุกคนมาดูก่อนอย่างอื่น */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16,
            padding: "13px 16px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--border)",
            borderLeft: "3px solid " + pay.color }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>ยอดรวมที่ขอเบิก</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 27, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.2 }}>
                {window.ecBaht(total)} <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)" }}>บาท</span>
              </div>
            </div>
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <EcPill th={pay.th} color={pay.color} />
              <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>{pay.hint}</div>
            </div>
          </div>

          {/* งานที่ผูกอยู่ */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16,
            fontSize: 12.5, color: "var(--text-2)" }}>
            <Icon name="sun" size={13} color="var(--text-3)" />
            {c.jobId
              ? <span><b style={{ fontFamily: "var(--mono)" }}>{c.siteCode}</b> {c.siteName}
                  {!job && <span style={{ color: "var(--tint-amber-tx)" }}> · งานถูกลบจากฐานข้อมูลแล้ว</span>}</span>
              : <span style={{ color: "var(--text-3)" }}>ไม่ได้ผูกกับงานไหน (ค่าใช้จ่ายทั่วไป)</span>}
          </div>

          {/* 1 · รายละเอียด */}
          <window.DrSection n="1" title="ค่าอะไร จ่ายเมื่อไหร่" tone={kind.color}>
            <window.DrLabel hint="เลือกให้ตรงหมวด จะได้สรุปต้นทุนรายไซต์ได้">หมวดค่าใช้จ่าย</window.DrLabel>
            <window.DrChips options={window.EC_KIND} value={c.kind} disabled={locked}
              onChange={(v) => set({ kind: v || "other" })} />

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <window.DrLabel hint="วันที่จ่ายเงินจริง ไม่ใช่วันที่กรอกใบ">วันที่จ่าย</window.DrLabel>
                <input type="date" value={c.date || ""} disabled={locked}
                  onChange={(e) => set({ date: e.target.value })} style={EC_INPUT} />
              </div>
              <div>
                <window.DrLabel>เงินที่ใช้จ่ายไปเป็นของใคร</window.DrLabel>
                <window.DrChips options={window.EC_PAY} value={c.payMethod} disabled={locked}
                  onChange={(v) => set({ payMethod: v || "own" })} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <window.DrLabel hint="ไม่บังคับ">หมายเหตุ</window.DrLabel>
              <window.DrText value={c.note} disabled={locked} rows={2}
                placeholder="เช่น ซื้อที่ร้านใกล้ไซต์เพราะของในคลังหมด"
                onChange={(v) => set({ note: v })} />
            </div>
          </window.DrSection>

          {/* 2 · รายการ */}
          <window.DrSection n="2" title="รายการที่จ่าย" tone={kind.color}
            hint={"รวม " + window.ecBaht(total) + " บาท"}>
            <window.DrRows disabled={locked} rows={c.items || []} addLabel="เพิ่มรายการ"
              cols={[
                { k: "name", th: "รายการ", w: "40%" },
                { k: "qty", th: "จำนวน", w: "14%", type: "num" },
                { k: "unit", th: "หน่วย", w: "14%" },
                { k: "price", th: "ราคา/หน่วย", w: "16%", type: "num" },
                { k: "amount", th: "รวม (บาท)", w: "16%", type: "num" },
              ]}
              onChange={(rows) => set({ items: ecRowsClean(rows) })} />
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 9, lineHeight: 1.55 }}>
              เว้นช่อง “รวม” ไว้ ระบบจะคิดจาก จำนวน × ราคา/หน่วย ให้เอง ·
              ยอดรวมของใบคิดจากรายการเสมอ พิมพ์ทับไม่ได้ เพื่อให้ตรงกับบิลที่แนบ
            </div>
          </window.DrSection>

          {/* 3 · รูปบิล */}
          <window.DrSection n="3" title="บิล / ใบเสร็จ" tone={kind.color}
            hint={c.receiptCount ? c.receiptCount + " ใบ" : "ยังไม่มี"}>
            <EcReceipts claimId={c.id} currentUser={currentUser} disabled={locked}
              count={c.receiptCount} onBig={setBigShot} />
          </window.DrSection>

          {/* 4 · การอนุมัติ */}
          <window.DrSection n="4" title="การอนุมัติ" tone={st.color}
            hint={c.status === "sent" ? (c.approverName ? "รอ " + c.approverName : "รอหัวหน้าอนุมัติ")
              : (c.decidedByName ? "โดย " + c.decidedByName : "")}>
            {c.status === "sent" && !chk.ok && chk.why && (
              <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)",
                border: "1px solid var(--tint-amber-bd)", borderRadius: 9, padding: "8px 11px", marginBottom: 12 }}>
                {chk.why}
              </div>
            )}
            {c.decidedAt && (
              <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.6 }}>
                {st.key === "rejected" ? "ไม่อนุมัติ" : "อนุมัติ"}โดย <b>{c.decidedByName || "-"}</b> · {window.drDateTH(String(c.decidedAt).slice(0, 10))}
                {c.decidedNote && <div style={{ color: "var(--text-3)" }}>“{c.decidedNote}”</div>}
              </div>
            )}
            {c.paidAt && (
              <div style={{ fontSize: 12, color: "var(--tint-ok-tx)", marginBottom: 12 }}>
                จ่ายคืนแล้วโดย <b>{c.paidByName || "-"}</b> · {window.drDateTH(String(c.paidAt).slice(0, 10))}
                {c.paidRef && <span style={{ fontFamily: "var(--mono)" }}> · อ้างอิง {c.paidRef}</span>}
                {c.batchId && c.batchNo && <span> · รอบ {c.batchNo}</span>}
              </div>
            )}

            {nexts.length > 0 && (
              <React.Fragment>
                <window.DrLabel hint="ไม่บังคับ · จะถูกบันทึกไว้ในประวัติ">หมายเหตุประกอบการตัดสิน</window.DrLabel>
                <input value={note} onChange={(e) => setNote(e.target.value)} style={Object.assign({}, EC_INPUT, { marginBottom: 11 })}
                  placeholder="เช่น บิลไม่ชัด ขอถ่ายใหม่" />
                {/* เลขสลิปขึ้นเฉพาะตอนที่กดจ่ายได้ — เก็บไว้เทียบกับสเตทเมนต์ธนาคารทีหลัง */}
                {nexts.some((x) => x.key === "paid") && (
                  <React.Fragment>
                    <window.DrLabel hint="ไม่บังคับ · แนะนำให้ใส่ไว้เทียบกับสเตทเมนต์ธนาคาร">เลขสลิป / เลขอ้างอิงการโอน</window.DrLabel>
                    <input value={payRef} onChange={(e) => setPayRef(e.target.value)}
                      style={Object.assign({}, EC_INPUT, { marginBottom: 11, fontFamily: "var(--mono)" })}
                      placeholder="เช่น 20260912-104233 หรือเลขท้ายสลิป" />
                  </React.Fragment>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {nexts.map((s) => (
                    <button key={s.key} onClick={() => { onMove(c, s.key, { text: note, ref: payRef }); setNote(""); setPayRef(""); }}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10,
                        border: "1px solid " + s.color, background: s.color + "16", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: s.color }}>
                      <Icon name="arrowRight" size={14} color={s.color} /> {s.th}
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
            {!nexts.length && (
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                {c.status === "paid" ? "ใบนี้จบแล้ว — ล็อกไว้เป็นหลักฐานการจ่ายเงิน" : "ไม่มีขั้นตอนที่คุณกดได้กับใบนี้"}
              </div>
            )}
          </window.DrSection>

          {/* ประวัติ */}
          {(c.hist || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
                color: "var(--text-3)", marginBottom: 8 }}>ประวัติ</div>
              {(c.hist || []).slice().reverse().map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", fontSize: 12, color: "var(--text-2)",
                  padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)", flexShrink: 0 }}>
                    {window.drDateTH(String(h.at).slice(0, 10))}
                  </span>
                  <span style={{ flex: 1 }}>
                    {window.ecStatusOf(h.from).th} → <b style={{ color: window.ecStatusOf(h.to).color }}>{window.ecStatusOf(h.to).th}</b>
                    {h.byName ? " · " + h.byName : ""}{h.note ? " · “" + h.note + "”" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canDel && (
            <button onClick={del}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
                border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--tint-red-tx)" }}>
              <Icon name="trash" size={13} color="var(--tint-red-tx)" /> ลบใบนี้
            </button>
          )}
        </div>
      </div>
      <EcBigShot shot={bigShot} onClose={() => setBigShot(null)} />
    </div>
  );
}

/* ── แถวใบเบิกในรายการ ── */
function EcClaimRow({ claim, onOpen, gone }) {
  const st = window.ecStatusOf(claim.status);
  const kind = window.ecKindOf(claim.kind);
  const pay = window.ecPayOf(claim.payMethod);
  return (
    <button onClick={() => onOpen(claim.id)}
      style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 13px",
        borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: "3px solid " + st.color, cursor: "pointer", fontFamily: "inherit", marginBottom: 7 }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0,
        background: kind.color + "1a" }}>
        <Icon name="wallet" size={15} color={kind.color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {kind.th}{claim.note ? " · " + claim.note : ""}
        </span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 2, fontFamily: "var(--mono)" }}>
          {claim.no} · {claim.byName || "-"} · {window.drShort(claim.date)}
          {claim.siteCode ? " · " + claim.siteCode : ""}
          {/* บอกได้ว่าใบไหนไม่มีบิลแนบโดยไม่ต้องโหลดรูป — receiptCount เป็นกระจกเงาเบา ๆ ที่ตัวใบ */}
          {claim.status !== "draft" && !claim.receiptCount && (
            <span style={{ color: "#F59E0B", fontFamily: "inherit" }}> · ไม่มีบิลแนบ</span>
          )}
          {claim.receiptCount > 0 && <span> · บิล {claim.receiptCount} ใบ</span>}
          {/* ใบเบิกเป็นเอกสารการเงิน ต้องอ่านได้ต่อแม้ใบงานถูกลบ — ชื่อไซต์ถ่ายสำเนาไว้ตอนเปิดใบแล้ว */}
          {gone && <span style={{ color: "#F59E0B", fontFamily: "inherit" }}> · งานถูกลบจากฐานข้อมูล</span>}
        </span>
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>
          {window.ecBaht(claim.amount)}
        </span>
        <span style={{ display: "block", marginTop: 3 }}>
          <EcPill th={st.th} color={st.color} />
          {pay.owed && claim.status !== "paid" && <span style={{ fontSize: 10.5, color: pay.color, marginLeft: 5 }}>ออกเงินเอง</span>}
        </span>
      </span>
    </button>
  );
}

/* ── ตารางยอดรายคน ──
   "ค้างจ่าย" คือตัวเลขเดียวในตารางนี้ที่เอาไปจ่ายเงินจริงได้ ที่เหลือเป็นข้อมูลประกอบ */
function EcPersonTable({ claims, users, onPick, onPay, canPay }) {
  const roll = window.ecRollupByPerson(claims);
  const rows = Object.keys(roll).map((k) => roll[k])
    .sort((a, b) => b.owed - a.owed || b.waiting - a.waiting || b.count - a.count);
  const sum = rows.reduce((s, r) => s + r.owed, 0);
  if (!rows.length) {
    return <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>ยังไม่มีใบเบิกในระบบ</div>;
  }
  const th = { textAlign: "right", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap" };
  const td = { textAlign: "right", padding: "10px", fontFamily: "var(--mono)", fontSize: 12.5, whiteSpace: "nowrap" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={Object.assign({}, th, { textAlign: "left" })}>ชื่อ</th>
              <th style={th}>ร่าง</th>
              <th style={th}>รออนุมัติ</th>
              <th style={th}>ค้างจ่าย</th>
              <th style={th}>จ่ายแล้ว</th>
              <th style={th}>ใบ</th>
              {canPay && <th style={th} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const u = (users || []).find((x) => x.id === r.id);
              return (
                <tr key={r.id} onClick={() => onPick && onPick(r)}
                  style={{ borderBottom: "1px solid var(--border)", cursor: onPick ? "pointer" : "default" }}>
                  <td style={{ padding: "10px", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                    {r.name}
                    {u && !u.active && <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 500 }}> · ปิดบัญชีแล้ว</span>}
                  </td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.draft ? window.ecBaht(r.draft) : "—"}</td>
                  <td style={Object.assign({}, td, { color: r.waiting ? "#F59E0B" : "var(--text-3)" })}>{r.waiting ? window.ecBaht(r.waiting) : "—"}</td>
                  <td style={Object.assign({}, td, { fontWeight: 800, color: r.owed ? "#EF4444" : "var(--text-3)" })}>{r.owed ? window.ecBaht(r.owed) : "—"}</td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.paid ? window.ecBaht(r.paid) : "—"}</td>
                  <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.count}</td>
                  {canPay && (
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      {r.owed > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); onPay && onPay(r); }}
                          style={{ whiteSpace: "nowrap", padding: "7px 13px", borderRadius: 9, border: "none",
                            background: "var(--primary)", color: "#fff", cursor: "pointer",
                            fontFamily: "inherit", fontSize: 12, fontWeight: 800 }}>จ่ายคืน</button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--surface2)" }}>
              <td style={{ padding: "11px 10px", fontSize: 12.5, fontWeight: 800, color: "var(--text-2)" }}>รวมเงินที่บริษัทติดพนักงานอยู่</td>
              <td colSpan={canPay ? 6 : 5} style={Object.assign({}, td, { fontSize: 15, fontWeight: 800, color: sum ? "#EF4444" : "var(--text-3)" })}>
                {window.ecBaht(sum)} บาท
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ padding: "9px 12px", fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, borderTop: "1px solid var(--border)" }}>
        “ค้างจ่าย” นับเฉพาะใบที่อนุมัติแล้วและพนักงานออกเงินตัวเองไปก่อน —
        ใบที่จ่ายด้วยเงินสดกองกลางหรือบัญชีบริษัทไม่ใช่หนี้ที่ต้องคืนใคร จึงไม่ถูกนับ
        {onPick ? " · กดที่ชื่อเพื่อดูใบของคนนั้น" : ""}
      </div>
    </div>
  );
}

/* ── ปิดรอบจ่ายเงินคืนพนักงานหนึ่งคน ──
   จ่ายทีละใบคือการทรมานคนจ่ายและเป็นที่มาของการจ่ายซ้ำ/จ่ายตก
   หน้าต่างนี้แสดงทุกใบที่จะถูกปิดพร้อมกัน ให้เห็นก่อนกดว่ากำลังโอนเท่าไหร่ให้ใคร แลกกับใบอะไรบ้าง */
function EcPayModal({ person, claims, batches, currentUser, onClose, onConfirm }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [ref, setRef] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const list = claims || [];
  const total = window.ecRound(list.reduce((a, c) => a + window.ecRound(c.amount), 0));
  const no = window.ecBatchNo(batches, window.drToday());

  const go = () => {
    if (busy || !list.length) return;
    setBusy(true);
    const batch = window.ecBlankBatch(person, list, currentUser, batches);
    batch.ref = ref; batch.note = note;
    Promise.resolve(onConfirm(batch, list)).then((ok) => {
      setBusy(false);
      if (ok) onClose();
    });
  };

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg)", borderRadius: isMobile ? "16px 16px 0 0" : 18, width: "min(560px, 100%)",
          maxHeight: isMobile ? "94dvh" : "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 18px",
          borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "#10B9811a" }}>
            <Icon name="wallet" size={17} color="#10B981" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>จ่ายคืน {(person || {}).name || "-"}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>รอบ {no} · {list.length} ใบ</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Icon name="x" size={15} color="var(--text-2)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          <div style={{ textAlign: "center", padding: "14px 0 16px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 800, color: "#10B981", lineHeight: 1.1 }}>
              {window.ecBaht(total)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>บาท · ยอดที่จะโอนคืนในรอบนี้</div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 15 }}>
            {list.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                    {window.ecKindOf(c.kind).th}
                  </span>
                  <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>
                    {c.no} · {window.drShort(c.date)}{c.siteCode ? " · " + c.siteCode : ""}
                    {!c.receiptCount && <span style={{ color: "#F59E0B", fontFamily: "inherit" }}> · ไม่มีบิลแนบ</span>}
                  </span>
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>
                  {window.ecBaht(c.amount)}
                </span>
              </div>
            ))}
          </div>

          <window.DrLabel hint="ไม่บังคับ · แนะนำให้ใส่ไว้เทียบกับสเตทเมนต์ธนาคาร">เลขสลิป / เลขอ้างอิงการโอน</window.DrLabel>
          <input value={ref} onChange={(e) => setRef(e.target.value)}
            style={Object.assign({}, EC_INPUT, { marginBottom: 12, fontFamily: "var(--mono)" })}
            placeholder="เช่น 20260912-104233" />
          <window.DrLabel hint="ไม่บังคับ">หมายเหตุ</window.DrLabel>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            style={EC_INPUT} placeholder="เช่น โอนพร้อมเงินเดือนงวดนี้" />

          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6, marginTop: 12 }}>
            กดแล้วทุกใบข้างบนจะถูกปิดเป็น “จ่ายคืนแล้ว” พร้อมกันในคำสั่งเดียว และล็อกถาวรเป็นหลักฐานการจ่าย ·
            เงินต้องโอนจริงก่อนกด ระบบไม่ได้โอนเงินให้
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, padding: "13px 18px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <button onClick={onClose}
            style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border-strong)",
              background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
            ยกเลิก
          </button>
          <button onClick={go} disabled={busy || !list.length}
            style={{ flex: 1, padding: "10px 18px", borderRadius: 10, border: "none", background: "#10B981", color: "#fff",
              cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1,
              fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>
            {busy ? "กำลังบันทึก..." : "ยืนยันว่าโอนเงินแล้ว " + window.ecBaht(total) + " บาท"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ประวัติรอบจ่าย ── */
function EcBatchList({ batches, onPrint }) {
  const rows = (batches || []).slice(0, 20);
  if (!rows.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
        color: "var(--text-3)", marginBottom: 8 }}>รอบจ่ายล่าสุด</div>
      {rows.map((b) => (
        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "9px 12px",
          borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "#10B981" }}>{b.no}</span>
          <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, color: "var(--text-1)", fontWeight: 700 }}>{b.toName || "-"}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {window.drShort(b.date)} · {b.count} ใบ
            {b.ref ? " · อ้างอิง " + b.ref : ""}
            {b.byName ? " · โดย " + b.byName : ""}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
            {window.ecBaht(b.total)}
          </span>
          {onPrint && (
            <button onClick={() => onPrint(b)} title="ใบสำคัญจ่าย A4"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 9,
                border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
              <Icon name="file" size={13} color="var(--text-3)" /> ใบสำคัญจ่าย
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── ยอดรายไซต์ = ต้นทุนจริงหน้างาน ──
   ค่าแรงผู้รับเหมามาจาก job.laborCost (ที่ตั้งไว้ในใบงาน) ส่วนเงินสดหน้างานมาจากใบเบิก
   สองก้อนนี้คนละที่มา จึงแยกคอลัมน์ให้เห็น ไม่ยุบเป็นตัวเลขเดียวที่ไม่มีใครตรวจย้อนได้ */
function EcJobTable({ claims, jobs, onPick }) {
  const roll = window.ecRollupByJob(claims);
  const jobById = React.useMemo(() => {
    const m = {}; (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; }); return m;
  }, [jobs]);
  const rows = Object.keys(roll).map((k) => {
    const r = roll[k];
    const j = jobById[r.jobId] || null;
    const labor = j && j.laborCost ? Number(j.laborCost) || 0 : 0;
    return Object.assign({}, r, { job: j, labor: labor, grand: window.ecRound(r.total + labor) });
  }).sort((a, b) => b.grand - a.grand);

  if (!rows.length) {
    return <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
      ยังไม่มีใบเบิกที่ผูกกับงาน — ต้นทุนรายไซต์นับจากใบที่เลือกงานไว้เท่านั้น
    </div>;
  }
  const sumCash = rows.reduce((a, r) => a + r.total, 0);
  const sumLabor = rows.reduce((a, r) => a + r.labor, 0);

  return (
    <div>
      {rows.map((r) => (
        <div key={r.jobId} onClick={() => onPick && onPick(r)}
          style={{ padding: "11px 13px", borderRadius: 12, background: "var(--surface)",
            border: "1px solid var(--border)", marginBottom: 7, cursor: onPick ? "pointer" : "default" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 180 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{r.name || "-"}</span>
              <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                {r.code} · {r.count} ใบ
                {r.waitCount > 0 && <span style={{ color: "#F59E0B" }}> · รออนุมัติอีก {r.waitCount} ใบ {window.ecBahtShort(r.waiting)} บาท</span>}
                {!r.job && <span style={{ color: "#F59E0B", fontFamily: "inherit" }}> · งานถูกลบจากฐานข้อมูล</span>}
              </span>
            </span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.keys(r.byKind).map((k) => (
                <EcPill key={k} th={window.ecKindOf(k).th} color={window.ecKindOf(k).color} sub={window.ecBahtShort(r.byKind[k])} />
              ))}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end",
            marginTop: 9, paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
            <EcMini label="เงินสดหน้างาน" value={window.ecBaht(r.total)} color="var(--text-1)" />
            <EcMini label="ค่าแรงผู้รับเหมา" value={r.labor ? window.ecBaht(r.labor) : "ยังไม่ตั้ง"} color="var(--text-3)" />
            <EcMini label="รวม" value={window.ecBaht(r.grand)} color="var(--text-1)" big />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-end", padding: "11px 13px",
        borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <EcMini label="เงินสดหน้างานรวม" value={window.ecBaht(sumCash)} color="var(--text-1)" />
        <EcMini label="ค่าแรงผู้รับเหมารวม" value={window.ecBaht(sumLabor)} color="var(--text-3)" />
        <EcMini label="รวมทั้งหมด" value={window.ecBaht(window.ecRound(sumCash + sumLabor))} color="var(--text-1)" big />
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55, marginTop: 9 }}>
        “เงินสดหน้างาน” นับเฉพาะใบที่อนุมัติแล้ว ใบที่ยังรออนุมัติแสดงแยกไว้ ยังไม่ถือเป็นต้นทุน ·
        ตัวเลขนี้ไม่รวมค่าของที่เบิกจากคลัง เพราะของนั้นบริษัทซื้อไปก่อนแล้ว คนละก้อนเงินกัน
        เอาไปเทียบกับ BOQ ตรง ๆ ไม่ได้
      </div>
    </div>
  );
}

function EcMini({ label, value, color, big }) {
  return (
    <span style={{ textAlign: "right" }}>
      <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700 }}>{label}</span>
      <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: big ? 15 : 13,
        fontWeight: big ? 800 : 700, color: color, marginTop: 1 }}>{value}</span>
    </span>
  );
}

/* ── ปุ่มในลิ้นชักใบงาน ── (ลอกโครงจาก OmJobButton views-om.jsx:848)
   บอกยอดเงินสดที่ลงไปกับงานนี้แล้ว และเตือนถ้ามีใบค้างรออนุมัติอยู่ */
function EcJobButton({ job, sum, onOpen }) {
  const s = sum || { total: 0, count: 0, waiting: 0, waitCount: 0, owed: 0 };
  const color = s.waitCount ? "#F59E0B" : s.total ? "#0EA5E9" : "#94A3B8";
  const sub = !s.count && !s.waitCount ? "ยังไม่มีใบเบิกของงานนี้ — กดเพื่อเปิดใบ"
    : [s.count ? window.ecBaht(s.total) + " บาท · " + s.count + " ใบ" : "",
       s.waitCount ? "รออนุมัติ " + s.waitCount + " ใบ" : "",
       s.owed ? "ค้างจ่ายพนักงาน " + window.ecBahtShort(s.owed) : ""].filter(Boolean).join(" · ");
  return (
    <button onClick={onOpen}
      style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "var(--surface)", border: "1px solid var(--border-strong)", borderLeft: "3px solid " + color,
        borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name="wallet" size={17} color={color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>เบิกเงินหน้างาน</span>
        <span style={{ display: "block", fontSize: 11.5, color: color, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
      </span>
      <Icon name="arrowRight" size={16} color="var(--text-3)" />
    </button>
  );
}

/* ── หน้าหลัก ── */
function ExpenseView({ jobs, users, role, currentUser, focus }) {
  const store = window.useEcClaims();
  const [tab, setTab] = React.useState("mine");
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [newJob, setNewJob] = React.useState("");
  const [jobFilter, setJobFilter] = React.useState("");   /* เจาะดูเฉพาะงานเดียว มาจากปุ่มในลิ้นชักหรือตารางรายไซต์ */
  const [payFor, setPayFor] = React.useState(null);      /* คนที่กำลังจะปิดรอบจ่ายให้ */
  const [voucher, setVoucher] = React.useState(null);    /* รอบจ่ายที่กำลังเปิดใบสำคัญจ่าย */
  const batchStore = window.useEcBatches();

  const canApprove = window.ecCanApprove(role);
  const canPay = window.ecCanPay(role);
  const uid = currentUser ? currentUser.id : null;

  /* เปิดมาจากปุ่มในลิ้นชักใบงาน — เจาะให้เห็นเฉพาะงานนั้น และเตรียมงานไว้ให้ปุ่มเปิดใบใหม่ด้วย
     ผูกกับ focus.at เพื่อให้กดปุ่มเดิมซ้ำแล้วเด้งกลับมาที่งานนั้นอีก ไม่ใช่ครั้งแรกครั้งเดียว */
  React.useEffect(() => {
    if (!focus || !focus.jobId) return;
    setJobFilter(focus.jobId);
    setNewJob(focus.jobId);
    setTab(canApprove ? "all" : "mine");
    setQ("");
  }, [focus && focus.at]);

  /* กรองที่ชั้นข้อมูลก่อนเสมอ — คนที่ไม่มีสิทธิ์อนุมัติต้องไม่ได้ข้อมูลใบของคนอื่นติดมือไปด้วย
     ไม่ใช่แค่ซ่อนปุ่มบนหน้าจอ */
  const all = React.useMemo(() => window.ecVisible(store.claims, currentUser, role), [store.claims, currentUser, role]);
  const jobById = React.useMemo(() => {
    const m = {}; (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; }); return m;
  }, [jobs]);

  const roll = React.useMemo(() => window.ecRollup(all, currentUser, role), [all, currentUser, role]);

  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let out = all;
    if (jobFilter) out = out.filter((c) => (c.jobId || "") === jobFilter);
    if (tab === "mine") out = out.filter((c) => c.byId === uid);
    else if (tab === "inbox") out = out.filter((c) => c.status === "sent" && window.ecApproveCheck(c, currentUser, role).ok);
    if (kw) out = out.filter((c) => [c.no, c.byName, c.siteCode, c.siteName, c.note, window.ecKindOf(c.kind).th]
      .some((v) => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [all, tab, q, uid, currentUser, role, jobFilter]);

  const openNew = () => {
    const job = newJob ? jobById[newJob] : null;
    const rec = window.ecBlank(job, currentUser, store.claims, users);
    store.save(rec);
    setOpen(rec.id);
    setTab("mine");
  };

  /* เดินสถานะ = เขียนเรคคอร์ดใหม่ + ยิงแจ้งเตือนไปหาคนที่ต้องทำต่อ */
  const move = (c, to, note) => {
    const rec = window.ecMove(c, to, currentUser, note);
    if (!rec) return;
    store.save(rec);
    const money = window.ecBaht(rec.amount) + " บาท";
    const where = rec.siteCode ? " · " + rec.siteCode : "";
    if (to === "sent") {
      window.ecNotify(rec.approverId
        ? { toUserId: rec.approverId, title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
            body: (rec.byName || "") + " · " + money + where }
        : { toPerm: "expenseApprove", title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
            body: (rec.byName || "") + " · " + money + where });
    } else if (to === "approved" || to === "rejected" || to === "paid") {
      window.ecNotify({ toUserId: rec.byId,
        title: (to === "approved" ? "อนุมัติใบเบิกแล้ว · " : to === "rejected" ? "ไม่อนุมัติใบเบิก · " : "จ่ายเงินคืนแล้ว · ") + rec.no,
        body: money + where + (note ? " · " + note : "") });
    }
  };

  /* ปิดรอบ = เขียนรอบ + ปิดทุกใบในคำสั่งเดียว แล้วค่อยยิงแจ้งเตือนหาเจ้าของเงิน
     แจ้งเตือนยิงหลังเขียนสำเร็จเท่านั้น ไม่งั้นคนจะได้ข้อความว่าโอนแล้วทั้งที่เขียนไม่ผ่าน */
  const payBatch = (batch, list) => Promise.resolve(batchStore.payBatch(batch, list, currentUser)).then((ok) => {
    if (ok) {
      window.ecNotify({ toUserId: batch.toId,
        title: "จ่ายเงินคืนแล้ว · รอบ " + batch.no,
        body: window.ecBaht(batch.total) + " บาท · " + batch.count + " ใบ" + (batch.ref ? " · อ้างอิง " + batch.ref : "") });
      /* เปิดใบสำคัญจ่ายให้ทันทีหลังปิดรอบ — บัญชีต้องได้กระดาษที่มีลายเซ็นผู้รับเงินเก็บเข้าแฟ้ม
         ถ้าไม่เด้งให้ตรงนี้ คนจ่ายจะลืมพิมพ์ แล้วต้องไล่ย้อนหาทีหลัง */
      setVoucher(batch);
    }
    return ok;
  });

  /* ใบในรอบหาจากรายการที่ถืออยู่แล้ว ไม่ต้องอ่านฐานข้อมูลซ้ำ
     ใบที่ถูกลบไปแล้วจะหาไม่เจอ — ใบสำคัญจ่ายขึ้นหมายเหตุกำกับไว้เอง */
  const voucherClaims = React.useMemo(() => {
    if (!voucher) return [];
    const ids = voucher.claimIds || [];
    return ids.map((id) => (store.claims || []).find((c) => c.id === id)).filter(Boolean);
  }, [voucher, store.claims]);

  const payList = React.useMemo(() => (payFor ? window.ecPayable(all, payFor.id) : []), [all, payFor]);

  const cur = (store.claims || []).find((c) => c.id === open) || null;
  const doneJobs = React.useMemo(() => (jobs || []).slice()
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);

  /* ออก Excel ตามสิ่งที่เห็นอยู่จริง ไม่ใช่ทั้งฐานข้อมูล — คนกดคาดหวังว่าไฟล์จะตรงกับหน้าจอ
     แท็บสรุป (รายคน/รายไซต์) ไม่มีรายการใบอยู่บนจอ จึงออกทุกใบที่คนนี้มีสิทธิ์เห็น */
  const doXlsx = () => {
    const wide = tab === "person" || tab === "job";
    const scope = [wide ? "ทุกใบที่มีสิทธิ์เห็น" : (TABS.find((t) => t[0] === tab) || [])[1] || "",
      jobFilter && !wide ? "เฉพาะงาน " + ((jobById[jobFilter] || {}).code || jobFilter) : "",
      q.trim() && !wide ? "คำค้น “" + q.trim() + "”" : ""].filter(Boolean).join(" · ");
    window.ecExportXlsx(wide ? all : list, { scope: scope, byName: (currentUser || {}).name || "" });
  };

  const TABS = [["mine", "ใบของฉัน", "pen", roll.mineOpen]]
    .concat(canApprove ? [["inbox", "รออนุมัติ", "check", roll.waitingMine]] : [])
    .concat(canApprove ? [["person", "ยอดรายคน", "users", 0], ["job", "ต้นทุนรายไซต์", "sun", 0]] : [])
    .concat([["all", canApprove ? "ทั้งหมด" : "ใบที่เกี่ยวกับฉัน", "list", 0]]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <EcStat label="ใบของฉันที่ยังไม่จบ" value={roll.mineOpen} unit="ใบ" color="var(--text-1)"
          hint={roll.mineOwed ? "รอรับคืน " + window.ecBahtShort(roll.mineOwed) + " บาท" : "ไม่มียอดค้างรับ"}
          on={tab === "mine"} onClick={() => setTab("mine")} />
        {canApprove && (
          <EcStat label="รอฉันอนุมัติ" value={roll.waitingMine} unit="ใบ" color={roll.waitingMine ? "#F59E0B" : "var(--text-1)"}
            hint={"รออนุมัติทั้งระบบ " + roll.sent + " ใบ · " + window.ecBahtShort(roll.sentAmt) + " บาท"}
            on={tab === "inbox"} onClick={() => setTab("inbox")} />
        )}
        {canApprove && (
          <EcStat label="ค้างจ่ายพนักงาน" value={window.ecBahtShort(roll.owedAmt)} unit="บาท" color={roll.owedAmt ? "#EF4444" : "var(--text-1)"}
            hint={"อนุมัติแล้วรอจ่าย " + roll.approved + " ใบ"}
            on={tab === "person"} onClick={() => setTab("person")} />
        )}
        <EcStat label="จ่ายคืนแล้ว" value={roll.paid} unit="ใบ" color="#10B981"
          hint={roll.rejected ? "ไม่อนุมัติ " + roll.rejected + " ใบ" : ""} />
      </div>

      {/* เปิดใบใหม่ */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
        padding: "11px 13px", borderRadius: 12, background: "var(--surface2)", border: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>เปิดใบเบิกใหม่</span>
        <select value={newJob} onChange={(e) => setNewJob(e.target.value)}
          style={Object.assign({}, EC_INPUT, { width: "auto", flex: 1, minWidth: 200, padding: "8px 10px", fontSize: 12.5 })}>
          <option value="">— ไม่ผูกกับงาน (ค่าใช้จ่ายทั่วไป) —</option>
          {doneJobs.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
        </select>
        <button onClick={openNew}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10,
            border: "none", background: "var(--primary)", color: "#fff", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>
          <Icon name="plus" size={14} color="#fff" /> เปิดใบเบิก
        </button>
      </div>

      {/* แท็บ */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {TABS.map(([k, th, ic, n]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99,
              border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
              background: tab === k ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, color: tab === k ? "var(--primary-dark)" : "var(--text-2)" }}>
            <Icon name={ic} size={14} color={tab === k ? "var(--primary-dark)" : "var(--text-3)"} /> {th}
            {n > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 800,
              color: tab === k ? "var(--primary-dark)" : "var(--text-3)" }}>{n}</span>}
          </button>
        ))}
        <button onClick={doXlsx} title="ออกไฟล์ Excel ตามรายการที่เห็นอยู่"
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 99, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="file" size={14} color="var(--text-3)" /> ออก Excel
        </button>
      </div>

      {tab === "person" && (
        <div>
          <EcPersonTable claims={all} users={users} canPay={canPay}
            onPick={(r) => { setJobFilter(""); setQ(r.name || ""); setTab("all"); }}
            onPay={(r) => setPayFor(r)} />
          <EcBatchList batches={batchStore.batches} onPrint={setVoucher} />
        </div>
      )}
      {tab === "job" && <EcJobTable claims={all} jobs={jobs}
        onPick={(r) => { setQ(""); setJobFilter(r.jobId); setNewJob(r.jobId); setTab("all"); }} />}

      {tab !== "person" && tab !== "job" && (
        <React.Fragment>
          {jobFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 12px",
              borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <Icon name="sun" size={13} color="#0EA5E9" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                เฉพาะงาน {(jobById[jobFilter] || {}).code || jobFilter}
                {jobById[jobFilter] ? " · " + jobById[jobFilter].name : " · งานถูกลบจากฐานข้อมูล"}
              </span>
              <button onClick={() => setJobFilter("")}
                style={{ marginLeft: "auto", padding: "5px 11px", borderRadius: 8, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5,
                  fontWeight: 700, color: "var(--text-2)" }}>ดูทั้งหมด</button>
            </div>
          )}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา เลขที่ใบ · ชื่อคน · รหัสงาน · หมายเหตุ"
            style={EC_INPUT} />
          <div>
            {list.map((c) => <EcClaimRow key={c.id} claim={c} onOpen={setOpen} gone={!!c.jobId && !jobById[c.jobId]} />)}
            {!list.length && (
              <div style={{ padding: 28, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
                {jobFilter ? "งานนี้ยังไม่มีใบเบิก — กด “เปิดใบเบิก” ด้านบนได้เลย"
                  : q ? "ไม่พบใบเบิกที่ตรงกับคำค้น"
                  : tab === "inbox" ? "ไม่มีใบที่รอคุณอนุมัติ"
                  : tab === "mine" ? "ยังไม่มีใบเบิกของคุณ — กด “เปิดใบเบิก” ด้านบน"
                  : "ยังไม่มีใบเบิกในระบบ"}
              </div>
            )}
          </div>
        </React.Fragment>
      )}

      {voucher && (
        <window.EcVoucherPaper batch={voucher} claims={voucherClaims} onClose={() => setVoucher(null)} />
      )}

      {payFor && (
        <EcPayModal person={payFor} claims={payList} batches={batchStore.batches} currentUser={currentUser}
          onClose={() => setPayFor(null)} onConfirm={payBatch} />
      )}

      {cur && (
        <EcClaimModal claim={cur} job={jobById[cur.jobId] || null} users={users} role={role} currentUser={currentUser}
          onClose={() => setOpen(null)} onPatch={store.patch} onMove={move} onRemove={store.remove} />
      )}
    </div>
  );
}

Object.assign(window, { EC_INPUT, EcPill, EcStat, EcMini, EcClaimModal, EcClaimRow,
  EcReceipts, EcBigShot, EcPayModal, EcBatchList,
  EcPersonTable, EcJobTable, EcJobButton, ExpenseView });
