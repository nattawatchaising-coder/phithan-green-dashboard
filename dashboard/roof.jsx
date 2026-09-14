/* ══════════════════════════════════════════════════
   ส่งมอบหลังคา (Roof Handover) — ฟอร์มขอตรวจรับมอบพื้นที่หลังคา

   ก่อนขึ้นไปติดตั้งบนหลังคาของโรงงาน/เจ้าของอาคาร ต้องขอตรวจรับมอบพื้นที่ก่อน
   เพื่อบันทึกว่า "ตอนรับมอบหลังคาอยู่ในสภาพไหน" — ถ้าหลังติดตั้งเสร็จมีรอยรั่วหรือรอยบุบ
   จะได้พิสูจน์ได้ว่ามีมาก่อนหรือเกิดจากงานเรา ไม่ต้องเถียงกันด้วยความจำ

   แบบฟอร์มลอกจากของจริงที่ลูกค้าใช้ (Inspection Report of Roof Handover)
   หัวข้อเป็นสองภาษาอังกฤษ/ไทยในใบเดียวกันอยู่แล้ว จึงไม่มีตัวเลือกภาษาเหมือนเอกสารใบอื่น

   รูปถ่ายเก็บแยกชุดของตัวเอง (roofPhotos/) ไม่ใช้รูปจากแบบสำรวจ
   เพราะเป็นคนละเวลาคนละวัตถุประสงค์ — สำรวจคือดูว่าติดตั้งได้ไหม ใบนี้คือสภาพ ณ วันรับมอบ

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย rf / Rf / Roof (สคริปต์ทุกไฟล์ใช้ขอบเขตร่วมกัน)
   ══════════════════════════════════════════════════ */

const _RFFB = () => window.FBDB || null;
const _rfRef = (p) => window.FBDB.ref(p);

/* ผลการตรวจสอบ — ตรงตามช่องติ๊กสี่ช่องในแบบฟอร์มจริง */
const RF_RESULTS = [
  { key: "approved", en: "Approved", th: "อนุมัติ", color: "#16A34A" },
  { key: "rectified", en: "Rectified", th: "แก้ไข", color: "#F59E0B" },
  { key: "rejected", en: "Rejected", th: "ไม่ผ่าน", color: "#EF4444" },
  { key: "others", en: "Others", th: "อื่น ๆ", color: "#64748B" },
];
const RF_RESULT_BY = {};
RF_RESULTS.forEach((r) => { RF_RESULT_BY[r.key] = r; });

/* ใบเปล่าของงานหนึ่งงาน — เติมค่าที่รู้อยู่แล้วจากใบงานให้ ช่างจะได้ไม่ต้องพิมพ์ซ้ำ */
function rfBlank(job) {
  const j = job || {};
  const B = window.BRANDING || {};
  return {
    to: "", project: j.name || "", contractor: B.legal || "",
    reqDate: new Date().toISOString().slice(0, 10),
    reqItems: "ตรวจรับมอบพื้นที่หลังคาก่อนเริ่มงานติดตั้ง (Roof handover before installation)",
    inspAt: "", refIr: "", others: "", reqBy: "",
    result: "", resultOther: "", note: "",
    issueBy: "", inspectedBy: "", approvedBy: "", clientBy: "",
  };
}

/* ── ใบส่งมอบหลังคาของงานนี้ ──
   หนึ่งงาน = หนึ่งใบ (เก็บที่ roofHandover/<jobId>) ไม่ได้ทำเป็นรายการหลายใบ
   เพราะการรับมอบหลังคาเกิดครั้งเดียวต่องาน ถ้าตรวจไม่ผ่านก็แก้ใบเดิมแล้วตรวจซ้ำ */
function useRoofHandover(jobId) {
  const [rec, setRec] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!jobId || !_RFFB()) { setRec(null); setLoading(false); return; }
    const ref = _rfRef("roofHandover/" + jobId);
    const h = ref.on("value", (s) => { setRec(s.val() || null); setLoading(false); });
    return () => ref.off("value", h);
  }, [jobId]);

  const save = React.useCallback((patch, user) => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofHandover/" + jobId).update(Object.assign({}, patch, {
      updatedAt: new Date().toISOString(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || "",
    }));
  }, [jobId]);

  return { rec: rec, loading: loading, save: save };
}

/* รูปถ่ายของใบนี้ — โครงเดียวกับรูปใบรายงานเข้าบริการ (useOmVisitPhotos) ทุกประการ */
function useRoofPhotos(jobId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !_RFFB()) { setPhotos([]); return; }
    const ref = _rfRef("roofPhotos/" + jobId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId]);

  const add = React.useCallback((dataUrl, user) => {
    if (!jobId || !_RFFB()) return;
    const id = "RFP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _rfRef("roofPhotos/" + jobId + "/" + id).set({
      id: id, dataUrl: dataUrl, cap: "", at: new Date().toISOString(),
      by: (user || {}).id || null, byName: (user || {}).name || "",
    });
  }, [jobId]);
  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofPhotos/" + jobId + "/" + id).update({ cap: cap || "" });
  }, [jobId]);
  const remove = React.useCallback((id) => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofPhotos/" + jobId + "/" + id).remove();
  }, [jobId]);

  return { photos: photos, add: add, setCap: setCap, remove: remove };
}

/* สรุปสั้น ๆ ไว้โชว์ในใบงาน — ยังไม่เริ่ม / กรอกแล้วแต่ยังไม่สรุปผล / ผลการตรวจ */
function rfSummary(rec, photoCount) {
  if (!rec) return { state: "none", label: "ยังไม่ได้ทำใบส่งมอบหลังคา", color: "var(--text-3)" };
  const r = RF_RESULT_BY[rec.result];
  if (!r) return { state: "draft", label: "กรอกไว้แล้ว · ยังไม่สรุปผลการตรวจ" + (photoCount ? " · " + photoCount + " รูป" : ""), color: "#F59E0B" };
  return { state: rec.result, label: "ผลตรวจ: " + r.th + (photoCount ? " · " + photoCount + " รูป" : ""), color: r.color };
}

/* ══════════════════════════════════════════════════
   ฟอร์มกรอกใบส่งมอบหลังคา
   ══════════════════════════════════════════════════ */

/* หนึ่งช่องกรอก: หัวข้ออังกฤษ + ไทยในวงเล็บ ตามหน้าตาแบบฟอร์มจริง

   ต้องประกาศไว้นอกคอมโพเนนต์แม่เท่านั้น — ถ้าไปประกาศข้างในฟอร์ม
   ทุกครั้งที่พิมพ์ตัวอักษรมันจะกลายเป็นคอมโพเนนต์ "ชนิดใหม่" ในสายตา React
   React จึงถอดของเก่าทิ้งแล้วสร้างใหม่ ทำให้เคอร์เซอร์หลุดออกจากช่องทุกตัวอักษร */
function RfField({ label, thai, wide, lbl, sub, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: wide ? "1 / -1" : "auto", minWidth: 0 }}>
      <label style={lbl}>{label} <span style={sub}>({thai})</span></label>
      {children}
    </div>
  );
}

function RoofHandoverModal({ job, currentUser, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = useRoofHandover(job ? job.id : null);
  const photos = useRoofPhotos(job ? job.id : null);
  const [f, setF] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  /* โหลดของเดิมมาใส่ฟอร์มครั้งเดียวตอนอ่านเสร็จ — ถ้าคนอื่นแก้ระหว่างที่เรากรอกอยู่
     จะไม่ดึงมาทับสิ่งที่กำลังพิมพ์ค้างไว้ */
  React.useEffect(() => {
    if (store.loading || f) return;
    setF(Object.assign(rfBlank(job), store.rec || {}));
  }, [store.loading, store.rec, f, job]);

  if (!job) return null;

  const set = (k, v) => { setF((p) => Object.assign({}, p, { [k]: v })); setSaved(false); };
  const doSave = () => {
    store.save(f, currentUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const sub = { fontSize: 10.5, color: "var(--text-3)", fontWeight: 500, textTransform: "none", letterSpacing: 0 };
  /* inputStyle เป็น const ระดับบนสุดของ form.jsx — สคริปต์ทุกไฟล์ใช้ขอบเขตร่วมกัน จึงเรียกตรงได้ */
  const inp = Object.assign({}, inputStyle, { padding: "9px 11px", fontSize: 13 });

  if (!f) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", zIndex: 130, display: "grid", placeItems: "center", color: "#fff", fontSize: 13 }}>
        กำลังโหลด…
      </div>
    );
  }

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 130,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(860px,100%)",
          maxHeight: isMobile ? "94dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#0EA5E91c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="list" size={17} color="#0284C7" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>ส่งมอบหลังคา (Roof Handover)</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.code} · {job.name}
              </div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <RfField lbl={lbl} sub={sub} label="To" thai="เรียน">
                <input value={f.to} onChange={(e) => set("to", e.target.value)} placeholder="ชื่อผู้รับ / เจ้าของอาคาร" style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Project Name" thai="ชื่อโครงการ">
                <input value={f.project} onChange={(e) => set("project", e.target.value)} style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Contractor" thai="ผู้รับเหมา">
                <input value={f.contractor} onChange={(e) => set("contractor", e.target.value)} style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Request Date" thai="วันที่ขอ">
                <input type="date" value={f.reqDate} onChange={(e) => set("reqDate", e.target.value)} style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Request to inspect" thai="หัวข้อการตรวจสอบ" wide>
                <textarea value={f.reqItems} onChange={(e) => set("reqItems", e.target.value)} rows={2}
                  style={Object.assign({}, inp, { resize: "vertical", lineHeight: 1.5 })} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Inspection Date and Time" thai="วันและเวลาที่ตรวจสอบ">
                <input type="datetime-local" value={f.inspAt} onChange={(e) => set("inspAt", e.target.value)} style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Ref IR No." thai="อ้างอิงจาก IR เลขที่">
                <input value={f.refIr} onChange={(e) => set("refIr", e.target.value)} placeholder="ถ้ามี" style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Request by" thai="ขอโดย">
                <input value={f.reqBy} onChange={(e) => set("reqBy", e.target.value)} placeholder="ชื่อผู้ขอตรวจ" style={inp} />
              </RfField>
              <RfField lbl={lbl} sub={sub} label="Others" thai="อื่น ๆ">
                <input value={f.others} onChange={(e) => set("others", e.target.value)} style={inp} />
              </RfField>
            </div>

            {/* ผลการตรวจสอบ — ติ๊กช่องเดียว เหมือนในแบบฟอร์มกระดาษ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={lbl}>The result of inspection <span style={sub}>(ผลการตรวจสอบ)</span></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {RF_RESULTS.map((r) => {
                  const on = f.result === r.key;
                  return (
                    <button key={r.key} type="button" onClick={() => set("result", on ? "" : r.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, cursor: "pointer",
                        fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                        border: "1px solid " + (on ? r.color : "var(--border-strong)"),
                        background: on ? r.color + "16" : "var(--surface)", color: on ? r.color : "var(--text-2)" }}>
                      <span style={{ width: 13, height: 13, borderRadius: 4, flexShrink: 0, border: "1.5px solid " + (on ? r.color : "var(--border-strong)"),
                        background: on ? r.color : "transparent" }} />
                      {r.en} ({r.th})
                    </button>
                  );
                })}
              </div>
              {f.result === "others" && (
                <input value={f.resultOther} onChange={(e) => set("resultOther", e.target.value)} placeholder="ระบุผลการตรวจ" style={inp} />
              )}
            </div>

            <RfField lbl={lbl} sub={sub} label="Note" thai="หมายเหตุ" wide>
              <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={3}
                placeholder='เช่น "หลังคาโซน B มีรอยรั่วเดิม 2 จุด ถ่ายรูปไว้แล้ว"'
                style={Object.assign({}, inp, { resize: "vertical", lineHeight: 1.5 })} />
            </RfField>

            {/* ชื่อผู้ลงนาม — พิมพ์ลงบนใบให้ ส่วนลายเซ็นเซ็นบนกระดาษตามแบบฟอร์มเดิม */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={lbl}>ผู้ลงนามท้ายใบ <span style={sub}>(เว้นว่างได้ — พิมพ์ออกมาเป็นช่องให้เซ็นสด)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <RfField lbl={lbl} sub={sub} label="Issue By" thai="ผู้ออกใบ · EPC">
                  <input value={f.issueBy} onChange={(e) => set("issueBy", e.target.value)} style={inp} />
                </RfField>
                <RfField lbl={lbl} sub={sub} label="Inspected By" thai="ผู้ตรวจสอบ · EPC">
                  <input value={f.inspectedBy} onChange={(e) => set("inspectedBy", e.target.value)} style={inp} />
                </RfField>
                <RfField lbl={lbl} sub={sub} label="Approved By" thai="ผู้อนุมัติ · Project Manager">
                  <input value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} style={inp} />
                </RfField>
                <RfField lbl={lbl} sub={sub} label="Approved by Client" thai="อนุมัติโดยลูกค้า">
                  <input value={f.clientBy} onChange={(e) => set("clientBy", e.target.value)} style={inp} />
                </RfField>
              </div>
            </div>

            {/* รูปถ่ายสภาพหลังคา ณ วันรับมอบ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <label style={lbl}>รูปสภาพหลังคา ณ วันรับมอบ <span style={sub}>(ใบรายงานรูปถ่ายใช้รูปชุดนี้)</span></label>
              <RoofPhotoPicker store={photos} currentUser={currentUser} />
            </div>

            {store.rec && store.rec.updatedAt && (
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                แก้ไขล่าสุด {window.drDateTH ? window.drDateTH(store.rec.updatedAt, true) : store.rec.updatedAt}
                {store.rec.updatedByName ? " · โดย " + store.rec.updatedByName : ""}
              </div>
            )}
          </div>

          <div style={{ padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
            borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
            <button onClick={() => setPaper(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 16px", borderRadius: 11,
              border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)",
              fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>
              <Icon name="file" size={16} color="var(--primary-dark)" /> ดูเอกสาร · บันทึก PDF
            </button>
            <button onClick={doSave} style={{ flex: 1, minWidth: 150, padding: 12, borderRadius: 11, border: "none",
              background: saved ? "var(--tint-green-tx)" : "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
              {saved ? "บันทึกแล้ว" : "บันทึก"}
            </button>
          </div>
        </div>
      </div>

      {paper && window.RoofHandoverPaper && (
        <window.RoofHandoverPaper job={job} rec={f} photos={photos.photos} onClose={() => setPaper(false)} />
      )}
    </React.Fragment>
  );
}

/* ช่องใส่รูป — โครงเดียวกับ OmVisitPhotos แต่ไม่มีการแยก ก่อน/หลัง เพราะใบนี้ถ่ายรอบเดียว */
function RoofPhotoPicker({ store, currentUser }) {
  const [busy, setBusy] = React.useState(0);
  const list = store.photos;

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const file of files) {
      try { store.add(await window.resizeImageFile(file, 1400, 0.74), currentUser); } catch (err) { /* ข้ามไฟล์ที่อ่านไม่ได้ */ }
      setBusy((n) => n - 1);
    }
  };

  return (
    <div>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
        border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
        fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: list.length ? 11 : 0 }}>
        <Icon name="camera" size={15} /> {busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)"}
        <input type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))", gap: 10 }}>
        {list.map((p) => (
          <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden", background: "var(--surface)" }}>
            <div style={{ position: "relative", background: "#0d1512" }}>
              <img src={p.dataUrl} alt={p.cap || "รูปหลังคา"} style={{ width: "100%", height: 108, objectFit: "cover", display: "block" }} />
              <button type="button" onClick={() => store.remove(p.id)} title="ลบรูปนี้"
                style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 8, border: "none",
                  background: "rgba(0,0,0,.55)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Icon name="trash" size={13} color="#fff" />
              </button>
            </div>
            {window.DrPhotoCap && <window.DrPhotoCap value={p.cap} onSave={(v) => store.setCap(p.id, v)} />}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  RF_RESULTS, RF_RESULT_BY, rfBlank, rfSummary,
  useRoofHandover, useRoofPhotos, RoofHandoverModal, RoofPhotoPicker,
});
