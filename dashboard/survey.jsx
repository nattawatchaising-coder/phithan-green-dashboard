/* ============================================================
   PHITHAN GREEN — Site Survey Module (สำรวจหน้างาน)
   ฟอร์มเก็บข้อมูลวิศวกรรมหน้างาน (mobile-first) — 4 ขั้นตอน
   เก็บข้อมูลไว้กับงาน: job.survey (ผ่าน store.patch)
   รูปถ่าย checklist: เก็บ base64 ใน RTDB surveyPhotos/{jobId}/{slot}
   ============================================================ */

// ── ตัวเลือก ──
const SURVEY_ROOF_TYPES = (window.BOQ && window.BOQ.ROOF_OPTIONS && window.BOQ.ROOF_OPTIONS.length)
  ? window.BOQ.ROOF_OPTIONS
  : ["เมทัลชีท", "กระเบื้องลอนคู่", "CPAC", "พื้นคอนกรีต (Slab)", "Shingle Roof", "อื่นๆ"];
const SURVEY_ROOF_COND = [
  { value: "good", label: "ดี (แข็งแรง)" },
  { value: "fair", label: "พอใช้" },
  { value: "poor", label: "ทรุดโทรม / ต้องเสริม" },
];
const SURVEY_SHADING_TAGS = ["ต้นไม้", "อาคารข้างเคียง", "เสาไฟ / สายไฟ", "ถังเก็บน้ำ", "ปล่องระบายอากาศ", "อื่นๆ"];
const SURVEY_INV_LOC = [
  { value: "indoor", label: "ในอาคาร (Indoor)" },
  { value: "outdoor", label: "นอกอาคาร (Outdoor)" },
];
const SURVEY_MDB_SPACE = [
  { value: "free", label: "มีช่องว่างเพียงพอ" },
  { value: "tight", label: "มีช่องว่างจำกัด" },
  { value: "full", label: "เต็ม / ต้องเพิ่มตู้" },
];
// รายการรูปบังคับ (mandatory photo checklist) — ครบทุกช่อง = ผ่าน
const SURVEY_PHOTO_SLOTS = [
  { key: "meter",    label: "มิเตอร์ไฟฟ้า",            hint: "ให้เห็นเลขมิเตอร์และขนาดชัดเจน" },
  { key: "mdb",      label: "ภายในตู้ MDB (เปิดฝา)",   hint: "เห็นเมนเบรกเกอร์และช่องว่าง" },
  { key: "roof",     label: "ภาพรวมหลังคา",            hint: "มุมกว้างเห็นพื้นที่ติดตั้ง" },
  { key: "truss",    label: "โครงสร้าง / จันทันหลังคา", hint: "ดูความแข็งแรงของโครงสร้าง" },
  { key: "inverter", label: "จุดติดตั้งอินเวอร์เตอร์",  hint: "ตำแหน่งที่จะติดตั้งจริง" },
];

// ── สถานะการสำรวจของงาน (ใช้ในลิสต์/ป้าย) ──
function surveyStatus(job) {
  const s = job && job.survey;
  if (s && s.skip) return { state: "skip", pct: 100, label: "ไม่ต้องสำรวจ", color: "#16A34A" };
  if (!s || !s.startedAt) return { state: "none", pct: 0, label: "ยังไม่สำรวจ", color: "#94A3B8" };
  const fields = [
    !!(s.gps && s.gps.lat), !!s.meterSize, !!s.phase,                      // ขั้น 1
    !!s.roofType, !!(s.roofPitch !== "" && s.roofPitch != null),           // ขั้น 2
    !!s.mdbBrand, !!s.mainBreaker, !!s.inverterLoc,                        // ขั้น 3
  ];
  const photos = s.photos || {};
  const checks = fields.concat(SURVEY_PHOTO_SLOTS.map((p) => !!photos[p.key]));
  const done = checks.filter(Boolean).length;
  const pct = Math.round((done / checks.length) * 100);
  if (pct >= 100) return { state: "done", pct: 100, label: "สำรวจครบ", color: "#16A34A" };
  return { state: "partial", pct, label: "สำรวจบางส่วน", color: "#F59E0B" };
}

// ── ค่าเริ่มต้นของแบบสำรวจ (ดึงค่าที่งานมีอยู่แล้วมาตั้งต้น) ──
function blankSurvey(job) {
  return {
    startedAt: "", updatedAt: "", completedAt: "", byName: "",
    gps: null,                                  // { lat, lng, at }
    meterSize: "",
    phase: String((job && job.phase) || "1") === "3" ? "3" : "1",
    roofType: (job && job.roof) || "",
    roofAge: "", roofCondition: "", roofPitch: "", azimuth: "",
    shadingTags: [], shadingNote: "",
    mdbBrand: "", mainBreaker: "", mdbSpace: "",
    inverterLoc: "", cableRun: "",
    photos: {},                                 // { slot: true } — แฟลกไว้แสดงสถานะโดยไม่ต้องโหลดรูป
  };
}

// ── โหลด/บันทึกรูป checklist (base64 ใน RTDB, 1 รูป/ช่อง) ──
function useSurveyPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) { setPhotos({}); return; }
    const ref = window.FBDB.ref("surveyPhotos/" + jobId);
    const h = ref.on("value", (s) => { const v = s.val(); setPhotos(v && typeof v === "object" ? v : {}); });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).set({
      slot, dataUrl, by: (user && user.id) || null, byName: (user && user.name) || "-", at: new Date().toISOString(),
    });
  }, [jobId]);
  const removePhoto = React.useCallback((slot) => {
    if (jobId && window.FBDB) window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return { photos, setPhoto, removePhoto };
}

// ── หัวข้อย่อยในฟอร์ม ──
function SurveyBlock({ title, sub, children }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", letterSpacing: ".01em" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// ── ช่องรูป checklist 1 ช่อง ──
function SurveyPhotoSlot({ slot, photo, busy, onPick, onRemove }) {
  const inputRef = React.useRef(null);
  const has = !!photo;
  return (
    <div style={{ border: "1px solid " + (has ? "var(--primary)" : "var(--border-strong)"), borderRadius: 12, padding: 11, display: "flex", gap: 12, alignItems: "center",
      background: has ? "var(--primary-soft)" : "var(--surface2)" }}>
      <span style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
        background: has ? "var(--primary)" : "var(--surface3)", color: "#fff" }}>
        {has ? <Icon name="check" size={15} color="#fff" sw={2.6} /> : <Icon name="image" size={14} color="var(--text-3)" />}
      </span>
      {has ? (
        <img src={photo.dataUrl} alt={slot.label} onClick={() => onPick(inputRef)} style={{ width: 52, height: 52, borderRadius: 9, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: "1px solid var(--border)" }} />
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{slot.label}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{slot.hint}</span>
      </span>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onPick(null, f); e.target.value = ""; }} />
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 9, border: "none",
            background: has ? "var(--surface3)" : "var(--primary)", color: has ? "var(--text-2)" : "#fff",
            fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer", whiteSpace: "nowrap" }}>
          <Icon name="image" size={13} color={has ? "var(--text-2)" : "#fff"} />{busy ? "..." : has ? "ถ่ายใหม่" : "ถ่าย/อัปโหลด"}
        </button>
        {has && <button type="button" onClick={() => onRemove(slot.key)} title="ลบรูป"
          style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "#EF444414", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>}
      </div>
    </div>
  );
}

// ── ตัวช่วยกรอบ step (เลขขั้น + ชื่อ) ──
const SURVEY_STEPS = [
  { n: 1, icon: "pin",   th: "เช็คอิน & มิเตอร์" },
  { n: 2, icon: "box",   th: "โครงสร้างหลังคา" },
  { n: 3, icon: "bolt",  th: "ไฟฟ้า & ตำแหน่ง" },
  { n: 4, icon: "image", th: "รูปถ่ายบังคับ" },
];

function SurveyWizard({ job, onClose, onSave, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const media = useSurveyPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankSurvey(job), (job && job.survey) || {}));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const toggleTag = (t) => setF((p) => {
    const cur = p.shadingTags || [];
    return Object.assign({}, p, { shadingTags: cur.includes(t) ? cur.filter((x) => x !== t) : cur.concat([t]) });
  });

  // จับพิกัด GPS ปัจจุบัน
  const captureGps = () => {
    if (!navigator.geolocation) { setGpsErr("อุปกรณ์ไม่รองรับ GPS"); return; }
    setGpsBusy(true); setGpsErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("gps", { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), acc: Math.round(pos.coords.accuracy || 0), at: new Date().toISOString() });
        setGpsBusy(false);
      },
      (err) => { setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง"); setGpsBusy(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // เลือก/ถ่ายรูป checklist
  const pickPhoto = async (slotKey, fileRefOrNull, file) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1100, 0.72);
      media.setPhoto(slotKey, dataUrl, currentUser);
    } catch (err) { alert("เพิ่มรูปไม่สำเร็จ: " + err.message); }
    setBusySlot(null);
  };

  const st = surveyStatus(Object.assign({}, job, { survey: Object.assign({}, f, { photos: photoFlags() }) }));
  function photoFlags() { const m = {}; SURVEY_PHOTO_SLOTS.forEach((p) => { if (media.photos[p.key]) m[p.key] = true; }); return m; }

  const save = () => {
    const now = new Date().toISOString();
    const photos = photoFlags();
    const complete = surveyStatus(Object.assign({}, job, { survey: Object.assign({}, f, { startedAt: f.startedAt || now, photos }) })).state === "done";
    const out = Object.assign({}, f, {
      photos,
      startedAt: f.startedAt || now,
      updatedAt: now,
      completedAt: complete ? (f.completedAt || now) : "",
      byName: (currentUser && currentUser.name) || f.byName || "",
    });
    if (onSave) onSave(out);
  };

  const labelStyle = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const fld = (label, child, req) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={labelStyle}>{label}{req && <span style={{ color: "#EF4444" }}> *</span>}</label>
      {child}
    </div>
  );
  const numStyle = Object.assign({}, inputStyle, { textAlign: "left" });

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 115, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "96dvh" : "94vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>สำรวจหน้างาน · {job ? job.code : ""}</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job ? job.name : ""}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: st.color }}>{st.pct}%</span>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
            </div>
          </div>
          {/* step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 13 }}>
            {SURVEY_STEPS.map((s) => {
              const active = s.n === step, done = s.n < step;
              return (
                <button key={s.n} onClick={() => setStep(s.n)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                  <span style={{ width: "100%", height: 4, borderRadius: 99, background: active || done ? "var(--primary)" : "var(--surface3)" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isMobile ? 0 : 11, fontWeight: active ? 800 : 600, color: active ? "var(--primary-dark)" : "var(--text-3)" }}>
                    <Icon name={s.icon} size={13} color={active ? "var(--primary-dark)" : "var(--text-3)"} />{!isMobile && s.th}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* body */}
        <div style={{ overflowY: "auto", flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 13, background: "var(--surface2)" }}>
          {step === 1 && (
            <React.Fragment>
              <SurveyBlock title="📍 เช็คอิน — พิกัด GPS" sub="กดปุ่มเพื่อบันทึกตำแหน่งปัจจุบันของหน้างาน">
                <button type="button" onClick={captureGps} disabled={gpsBusy}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 11, border: "none",
                    background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: gpsBusy ? "default" : "pointer" }}>
                  <Icon name="pin" size={16} color="#fff" />{gpsBusy ? "กำลังจับพิกัด..." : f.gps ? "จับพิกัดใหม่" : "จับพิกัด GPS ปัจจุบัน"}
                </button>
                {gpsErr && <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>⚠ {gpsErr}</div>}
                {f.gps && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-1)" }}>
                      {f.gps.lat}, {f.gps.lng}{f.gps.acc ? <span style={{ color: "var(--text-3)" }}> · ±{f.gps.acc}m</span> : null}
                    </span>
                    <a href={"https://www.google.com/maps?q=" + f.gps.lat + "," + f.gps.lng} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary-dark)", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                      <Icon name="map" size={13} color="var(--primary-dark)" /> ดูแผนที่
                    </a>
                  </div>
                )}
              </SurveyBlock>
              <SurveyBlock title="⚡ มิเตอร์ไฟฟ้าเดิม">
                {fld("ขนาดมิเตอร์ไฟฟ้า", <input value={f.meterSize} onChange={(e) => set("meterSize", e.target.value)} placeholder="เช่น 15(45)A" style={inputStyle} />, true)}
                {fld("ระบบไฟฟ้า (เฟส)", <Segmented value={f.phase} onChange={(v) => set("phase", v)} options={[{ value: "1", label: "1 เฟส" }, { value: "3", label: "3 เฟส" }]} />, true)}
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <SurveyBlock title="🏠 ชนิด & สภาพหลังคา">
                {fld("ประเภทหลังคา", <Dropdown value={f.roofType} onChange={(v) => set("roofType", v)} addable onAdd={() => {}} placeholder="— เลือกประเภท —" options={SURVEY_ROOF_TYPES.map((r) => ({ value: r, label: r }))} />, true)}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                  {fld("อายุหลังคา (ปี)", <input type="number" value={f.roofAge} onChange={(e) => set("roofAge", e.target.value)} placeholder="ปี" style={numStyle} />)}
                  {fld("สภาพหลังคา", <Dropdown value={f.roofCondition} onChange={(v) => set("roofCondition", v)} placeholder="— เลือก —" options={SURVEY_ROOF_COND} />)}
                </div>
              </SurveyBlock>
              <SurveyBlock title="📐 มุมหลังคา" sub="ความลาดเอียง และทิศหันของหลังคา (Azimuth)">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                  {fld("ความลาดเอียง (องศา)", <input type="number" value={f.roofPitch} onChange={(e) => set("roofPitch", e.target.value)} placeholder="0–90°" style={numStyle} />, true)}
                  {fld("ทิศหัน / Azimuth (องศา)", <input type="number" value={f.azimuth} onChange={(e) => set("azimuth", e.target.value)} placeholder="0=N 90=E 180=S" style={numStyle} />)}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>0° = ทิศเหนือ · 90° = ทิศตะวันออก · 180° = ทิศใต้ · 270° = ทิศตะวันตก</div>
              </SurveyBlock>
              <SurveyBlock title="🌳 สิ่งกีดขวาง / เงาบัง" sub="เลือกสิ่งที่อาจบดบังแสงแดด">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SURVEY_SHADING_TAGS.map((t) => {
                    const on = (f.shadingTags || []).includes(t);
                    return (
                      <button key={t} type="button" onClick={() => toggleTag(t)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
                          border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"), background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
                        {on && <Icon name="check" size={12} color="var(--primary-dark)" sw={2.6} />}{t}
                      </button>
                    );
                  })}
                </div>
                <textarea value={f.shadingNote} onChange={(e) => set("shadingNote", e.target.value)} placeholder="รายละเอียดเพิ่มเติม เช่น ต้นไม้สูง 5 ม. ทางทิศตะวันตก บังช่วงบ่าย"
                  rows={2} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 3 && (
            <React.Fragment>
              <SurveyBlock title="🔌 ตู้เมนไฟฟ้า (MDB)">
                {fld("ยี่ห้อ / รุ่นตู้ MDB", <input value={f.mdbBrand} onChange={(e) => set("mdbBrand", e.target.value)} placeholder="เช่น Schneider, ABB, Haco" style={inputStyle} />, true)}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                  {fld("ขนาดเมนเบรกเกอร์", <input value={f.mainBreaker} onChange={(e) => set("mainBreaker", e.target.value)} placeholder="เช่น 100A, 3P" style={inputStyle} />, true)}
                  {fld("ช่องว่างในตู้", <Dropdown value={f.mdbSpace} onChange={(v) => set("mdbSpace", v)} placeholder="— เลือก —" options={SURVEY_MDB_SPACE} />)}
                </div>
              </SurveyBlock>
              <SurveyBlock title="🔋 ตำแหน่งติดตั้งอินเวอร์เตอร์">
                {fld("ตำแหน่งที่เสนอติดตั้ง", <Segmented value={f.inverterLoc} onChange={(v) => set("inverterLoc", v)} options={SURVEY_INV_LOC} />, true)}
                {fld("ระยะเดินสายโดยประมาณ (เมตร)", <input type="number" value={f.cableRun} onChange={(e) => set("cableRun", e.target.value)} placeholder="ระยะจากแผง → อินเวอร์เตอร์ → MDB" style={numStyle} />)}
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 4 && (
            <SurveyBlock title="📷 รูปถ่ายบังคับ (Checklist)" sub={"ถ่ายให้ครบทั้ง " + SURVEY_PHOTO_SLOTS.length + " รูป เพื่อให้การสำรวจสมบูรณ์"}>
              {!window.FBDB && <div style={{ fontSize: 12, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "9px 11px" }}>⚠ ต้องเชื่อมต่อ Firebase จึงจะอัปโหลดรูปได้</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {SURVEY_PHOTO_SLOTS.map((slot) => (
                  <SurveyPhotoSlot key={slot.key} slot={slot} photo={media.photos[slot.key]} busy={busySlot === slot.key}
                    onPick={(ref, file) => { if (file) pickPhoto(slot.key, null, file); }}
                    onRemove={(k) => { if (confirm("ลบรูปนี้?")) media.removePhoto(k); }} />
                ))}
              </div>
            </SurveyBlock>
          )}
        </div>

        {/* footer */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          {step > 1
            ? <button onClick={() => setStep((s) => s - 1)} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="chevronRight" size={15} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} /> ย้อนกลับ</button>
            : <button onClick={onClose} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>}
          {step < 4
            ? <button onClick={() => setStep((s) => s + 1)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>ถัดไป <Icon name="chevronRight" size={16} color="#fff" /></button>
            : <button onClick={save} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="check" size={16} color="#fff" sw={2.4} /> บันทึกการสำรวจ</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SurveyWizard, surveyStatus, blankSurvey, useSurveyPhotos, SURVEY_PHOTO_SLOTS, SURVEY_STEPS });
