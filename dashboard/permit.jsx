/* ============================================================
   PHITHAN GREEN — เก็บข้อมูลขออนุญาตการไฟฟ้า (ช่างติดตั้งกรอกหน้างาน)

   ช่างเก็บ "ของที่ต้องอยู่หน้างานถึงจะเก็บได้" เท่านั้น — เลขมิเตอร์ เลขเสา
   ขนาดเบรกเกอร์ ซีเรียลอุปกรณ์ และรูปถ่าย · ส่วนเอกสาร (สำเนาบัตร, SLD ลงนามวิศวกร,
   หนังสือรับรองโครงสร้าง, กกพ., อ.1) เป็นงานออฟฟิศ ไม่เอามาถามช่าง

   กรอกครบ → กด "ส่งต่อแอดมินขออนุญาต" → งานเข้าคิวของฝ่ายขออนุญาต พร้อมแจ้งเตือน
   ข้อมูลเก็บที่ jobs/{id}/permit · รูปเก็บที่ permitPhotos/{jobId}/{slot}
   ============================================================ */

const PERMIT_TYPES = [
  { key: "self",   th: "ใช้เอง ไม่ขายไฟ",      sub: "Zero Export — มีอุปกรณ์กันไฟไหลย้อน" },
  { key: "public", th: "โซลาร์ภาคประชาชน",     sub: "ขายไฟส่วนเกินคืนการไฟฟ้า" },
  { key: "biz",    th: "โรงงาน / อาคารธุรกิจ", sub: "ระบบใหญ่ · มีหม้อแปลงของตัวเอง" },
];
const PERMIT_AUTHS = [
  { value: "PEA", label: "กฟภ. (PEA)" },
  { value: "MEA", label: "กฟน. (MEA)" },
];
const PERMIT_PHASES = [{ value: "1", label: "1 เฟส" }, { value: "3", label: "3 เฟส" }];
const PERMIT_YESNO  = [{ value: "yes", label: "มี" }, { value: "no", label: "ไม่มี" }];

/* ── ช่องรูปถ่าย ──
   req  = ต้องมี ถึงจะกดส่งต่อได้
   when = แสดง/บังคับเฉพาะบางเงื่อนไข (คืน true/false จากค่าที่กรอก)
   รูปที่โดนการไฟฟ้าตีกลับบ่อยสุดคือเนมเพลทอินเวอร์เตอร์กับสติกเกอร์หลังแผง
   เพราะอ่านซีเรียลไม่ออก — สองตัวนี้เลยบังคับ และเขียนคำเตือนไว้ในคำใบ้ */
const PERMIT_PHOTO_SLOTS = [
  { key: "meter",      group: "จุดรับไฟ",       label: "มิเตอร์ไฟฟ้า",              hint: "ต้องอ่านหมายเลขมิเตอร์และขนาด เช่น 15(45) ออก", req: true },
  { key: "house",      group: "จุดรับไฟ",       label: "หน้าบ้าน / อาคาร",           hint: "ให้เห็นบ้านเลขที่ชัดเจน", req: true },
  { key: "pole",       group: "จุดรับไฟ",       label: "เสาไฟ / หม้อแปลงต้นที่รับไฟ", hint: "ให้เห็นหมายเลขเสาบนป้าย", req: true },
  { key: "mdbClosed",  group: "ตู้ไฟ",          label: "ตู้ MDB ปิดฝา",              hint: "มุมกว้างให้เห็นตำแหน่งที่ติดตั้ง", req: true },
  { key: "mdbOpen",    group: "ตู้ไฟ",          label: "ตู้ MDB เปิดฝา",             hint: "ให้เห็นเมนเบรกเกอร์และขนาดที่พิมพ์ไว้", req: true },
  { key: "acBreaker",  group: "ตู้ไฟ",          label: "เบรกเกอร์ AC ของโซลาร์",     hint: "ตัวที่เพิ่มเข้าไปใหม่ ให้เห็นขนาด", req: true },
  { key: "acWiring",   group: "ตู้ไฟ",          label: "จุดเข้าสาย AC ในตู้",         hint: "ให้เห็นการเข้าสายและการขันแน่น" },
  { key: "ct",         group: "ตู้ไฟ",          label: "CT คล้องสายเมน",             hint: "จุดที่คล้อง CT ของระบบกันไฟไหลย้อน", when: (f) => f.zeroExport === "yes", req: true },
  { key: "inverter",   group: "อินเวอร์เตอร์",   label: "อินเวอร์เตอร์ติดตั้งเสร็จ",   hint: "มุมกว้างเห็นตำแหน่งที่ยึดผนัง", req: true },
  { key: "invPlate",   group: "อินเวอร์เตอร์",   label: "เนมเพลทอินเวอร์เตอร์",       hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออกทุกตัว — ตีกลับบ่อยที่สุด", req: true },
  { key: "dcIso",      group: "อินเวอร์เตอร์",   label: "DC Isolator / ตู้ DC",       hint: "ถ้ามีติดตั้ง" },
  { key: "arrayWide",  group: "แผงโซลาร์",      label: "แผงบนหลังคา มุมรวม",         hint: "ให้เห็นทั้งอาร์เรย์ในรูปเดียว", req: true },
  { key: "arrayClose", group: "แผงโซลาร์",      label: "แผงมุมใกล้",                 hint: "ให้เห็นรางและตัวยึดจับแผง" },
  { key: "panelPlate", group: "แผงโซลาร์",      label: "สติกเกอร์หลังแผง",           hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออก — ตีกลับบ่อย", req: true },
  { key: "ground",     group: "ความปลอดภัย",    label: "หลักดิน + จุดต่อสายดิน",      hint: "ให้เห็นหลักดินและสายที่ต่อเข้าจริง", req: true },
  { key: "warnSign",   group: "ความปลอดภัย",    label: "ป้ายเตือนที่ติดหน้าตู้",      hint: "ป้าย “มีระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์”", req: true },
];
const PERMIT_SLOT_BY = Object.fromEntries(PERMIT_PHOTO_SLOTS.map((s) => [s.key, s]));
const PERMIT_PHOTO_GROUPS = PERMIT_PHOTO_SLOTS.reduce((a, s) => (a.indexOf(s.group) === -1 ? a.concat([s.group]) : a), []);

const PERMIT_STEPS = [
  { n: 1, icon: "file",  th: "ประเภท & จุดรับไฟ" },
  { n: 2, icon: "bolt",  th: "ระบบไฟเดิม" },
  { n: 3, icon: "panel", th: "ระบบใหม่ & อุปกรณ์" },
  { n: 4, icon: "image", th: "รูปถ่าย" },
  { n: 5, icon: "check", th: "ตรวจสอบ & ส่งต่อ" },
];

/* สถานะของชุดข้อมูลขออนุญาต — ไหลทางเดียวจากช่างไปหาฝ่ายขออนุญาต */
const PERMIT_STATUS = {
  draft:    { th: "ช่างกำลังเก็บข้อมูล", color: "#94A3B8" },
  sent:     { th: "รอฝ่ายขออนุญาตรับ",   color: "#F59E0B" },
  filing:   { th: "กำลังยื่นการไฟฟ้า",   color: "#3B82F6" },
  approved: { th: "การไฟฟ้าอนุมัติแล้ว", color: "#10B981" },
  rejected: { th: "ตีกลับ ต้องแก้ไข",    color: "#EF4444" },
};

function blankPermit(job) {
  return {
    status: "draft",
    permitType: "", auth: "", ca: "", meterNo: "", meterSize: "", branch: "", poleNo: "",
    phase: String((job && job.phase) || "1") === "3" ? "3" : "1",
    mainAT: "", mainAF: "", mainCable: "", mdbBrand: "", rccb: "",
    kwp: (job && job.kw) ? String(job.kw) : "", kwac: "", acBreaker: "",
    dcIsolator: "", zeroExport: "", eldModel: "",
    invs: [{ model: (job && job.brand) || "", sn: "" }],
    panelModel: "", panelWatt: "", panelQty: "", panelSns: ["", ""],
    trafoKva: "", trafoVolt: "",
    gps: null, doneDate: "", byName: "", note: "",
  };
}

/* ── ช่องที่ต้องกรอกให้ครบก่อนส่งต่อ ──
   แยกออกมาเป็นตารางเพราะทั้งแถบความคืบหน้า หน้าตรวจสอบ และปุ่มส่ง ใช้ชุดเดียวกัน */
function permitRequiredFields(f) {
  const req = [
    { key: "permitType", th: "ประเภทการขออนุญาต", step: 1 },
    { key: "auth",       th: "การไฟฟ้าที่ยื่น",    step: 1 },
    { key: "ca",         th: "หมายเลขผู้ใช้ไฟฟ้า (CA)", step: 1 },
    { key: "meterNo",    th: "หมายเลขมิเตอร์",     step: 1 },
    { key: "meterSize",  th: "ขนาดมิเตอร์",        step: 1 },
    { key: "poleNo",     th: "หมายเลขเสาไฟ",       step: 1 },
    { key: "mainAT",     th: "ขนาดเมนเบรกเกอร์ (AT)", step: 2 },
    { key: "mainCable",  th: "ขนาดสายเมน",         step: 2 },
    { key: "kwp",        th: "ขนาดติดตั้ง kWp",     step: 3 },
    { key: "acBreaker",  th: "เบรกเกอร์ AC ของโซลาร์", step: 3 },
    { key: "zeroExport", th: "มีระบบกันไฟไหลย้อนไหม", step: 3 },
    { key: "panelModel", th: "รุ่นแผง",            step: 3 },
    { key: "panelQty",   th: "จำนวนแผง",           step: 3 },
    { key: "doneDate",   th: "วันที่ติดตั้งเสร็จ",   step: 3 },
  ];
  if (f.permitType === "biz") req.push({ key: "trafoKva", th: "ขนาดหม้อแปลง (kVA)", step: 2 });
  return req;
}

/* รายการที่ยังขาด — ใช้ทั้งคิดเปอร์เซ็นต์และแสดงเป็นเช็กลิสต์ให้ช่างไล่เก็บ */
function permitMissing(f, photos) {
  const out = [];
  permitRequiredFields(f).forEach((r) => {
    if (!String(f[r.key] || "").trim()) out.push({ kind: "field", th: r.th, step: r.step });
  });
  /* อินเวอร์เตอร์ต้องมีรุ่นและซีเรียลครบทุกตัว — ซีเรียลคือสิ่งที่การไฟฟ้าใช้ผูกกับอุปกรณ์ที่อนุมัติ */
  (f.invs || []).forEach((iv, i) => {
    if (!String(iv.model || "").trim()) out.push({ kind: "field", th: "รุ่นอินเวอร์เตอร์ตัวที่ " + (i + 1), step: 3 });
    if (!String(iv.sn || "").trim())    out.push({ kind: "field", th: "Serial อินเวอร์เตอร์ตัวที่ " + (i + 1), step: 3 });
  });
  if (!(f.panelSns || []).some((s) => String(s || "").trim())) out.push({ kind: "field", th: "Serial แผง (อย่างน้อย 1 แผ่น)", step: 3 });
  PERMIT_PHOTO_SLOTS.forEach((s) => {
    if (s.when && !s.when(f)) return;
    if (!s.req) return;
    const p = photos && photos[s.key];
    if (!p || !p.dataUrl) out.push({ kind: "photo", th: "รูป: " + s.label, step: 4 });
  });
  return out;
}
function permitTotalItems(f) {
  let n = permitRequiredFields(f).length + 1;                    // +1 = ซีเรียลแผง
  n += (f.invs || []).length * 2;                                // รุ่น + ซีเรียล ต่ออินเวอร์เตอร์ 1 ตัว
  PERMIT_PHOTO_SLOTS.forEach((s) => { if (s.req && (!s.when || s.when(f))) n++; });
  return n;
}
function permitProgress(f, photos) {
  if (!f) return { pct: 0, missing: [], done: 0, total: 1 };
  const total = permitTotalItems(f);
  const missing = permitMissing(f, photos);
  const done = Math.max(0, total - missing.length);
  return { pct: Math.round((done / total) * 100), missing, done, total };
}
/* สถานะย่อสำหรับแสดงบนการ์ด/ตาราง โดยไม่ต้องโหลดรูปมาทั้งชุด */
function permitStatusOf(job) {
  const p = job && job.permit;
  if (!p || !p.status) return null;
  return Object.assign({ key: p.status }, PERMIT_STATUS[p.status] || PERMIT_STATUS.draft);
}

/* ── รูปถ่ายขออนุญาต (base64 ใน RTDB เหมือนรูปสำรวจ) ── */
function usePermitPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) { setPhotos({}); return; }
    const ref = window.FBDB.ref("permitPhotos/" + jobId);
    const h = ref.on("value", (s) => { const v = s.val(); setPhotos(v && typeof v === "object" ? v : {}); });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user, extra) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).update(Object.assign({
      slot, dataUrl, by: (user && user.id) || null, byName: (user && user.name) || "-", at: new Date().toISOString(),
    }, extra || {}));
  }, [jobId]);
  const removePhoto = React.useCallback((slot) => {
    if (jobId && window.FBDB) window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return { photos, setPhoto, removePhoto };
}

/* ================================================================
   UI ย่อย
   ================================================================ */
const P_INPUT = {
  background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)",
  fontFamily: "inherit", fontSize: 14, padding: "10px 12px", borderRadius: 10, outline: "none", width: "100%",
};
function PField({ label, hint, required, children, full }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1 / -1" : "auto", minWidth: 0 }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", color: "var(--text-3)" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.4 }}>{hint}</span>}
    </div>
  );
}
function PGrid({ children, cols }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(" + (cols || 2) + ", 1fr)", gap: 13 }}>{children}</div>;
}

/* การ์ดเลือกประเภทการขออนุญาต — 3 แบบนี้ใช้เอกสารคนละชุด จึงต้องเลือกก่อนอย่างอื่น */
function PermitTypePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {PERMIT_TYPES.map((t) => {
        const on = value === t.key;
        return (
          <button type="button" key={t.key} onClick={() => onChange(t.key)}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12, cursor: "pointer",
              textAlign: "left", fontFamily: "inherit", width: "100%",
              border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
              background: on ? "var(--primary-soft)" : "var(--surface)" }}>
            <span style={{ width: 18, height: 18, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
              border: "2px solid " + (on ? "var(--primary)" : "var(--border-strong)") }}>
              {on && <span style={{ width: 9, height: 9, borderRadius: 99, background: "var(--primary)" }} />}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: on ? "var(--primary-dark)" : "var(--text-1)" }}>{t.th}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{t.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* การ์ดรูป 1 ช่อง — เรียบกว่าของแบบสำรวจ เพราะที่นี่ไม่ต้องเขียนทับรูป */
function PermitShotCard({ slot, shot, busy, onPick, onRemove }) {
  const inputRef = React.useRef(null);
  const has = !!(shot && shot.dataUrl);
  const warn = slot.hint.indexOf("⚠") === 0;
  return (
    <div style={{ border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"), borderRadius: 13, padding: 11,
      borderLeft: "3px solid " + (has ? "var(--primary)" : (slot.req ? "var(--tint-red-bd)" : "var(--surface3)")),
      background: has ? "var(--surface)" : "var(--surface2)", display: "flex", gap: 11, alignItems: "center" }}>
      {has ? (
        <a href={shot.dataUrl} target="_blank" rel="noreferrer" style={{ flexShrink: 0, lineHeight: 0 }}>
          <img src={shot.dataUrl} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }} />
        </a>
      ) : (
        <span style={{ width: 54, height: 54, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center",
          background: "var(--surface3)", border: "1px dashed var(--border-strong)" }}>
          <Icon name="image" size={17} color="var(--text-3)" />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
          {slot.label}{slot.req && <span style={{ color: "#EF4444" }}> *</span>}
        </span>
        <span style={{ display: "block", fontSize: 11, marginTop: 1, lineHeight: 1.4, color: warn ? "var(--tint-red-tx)" : "var(--text-3)", fontWeight: warn ? 600 : 400 }}>{slot.hint}</span>
      </span>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={(e) => { const fl = e.target.files && e.target.files[0]; if (fl) onPick(fl); e.target.value = ""; }} />
      <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 9, border: "none",
            background: has ? "var(--surface3)" : "var(--primary)", color: has ? "var(--text-2)" : "#fff",
            fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: busy ? "wait" : "pointer" }}>
          <Icon name="camera" size={13} color={has ? "var(--text-2)" : "#fff"} /> {busy ? "…" : (has ? "ถ่ายใหม่" : "ถ่าย")}
        </button>
        {has && (
          <button type="button" onClick={onRemove} title="ลบรูป"
            style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Icon name="trash" size={14} />
          </button>
        )}
      </span>
    </div>
  );
}

/* ================================================================
   PermitWizard — หน้าเก็บข้อมูลของช่าง
   ================================================================ */
function PermitWizard({ job, onClose, onSave, onSubmit, currentUser, stock, readOnly }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const media = usePermitPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankPermit(job), (job && job.permit) || {}));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));

  const prog = permitProgress(f, media.photos);
  const locked = !!readOnly;

  /* รุ่นอุปกรณ์เลือกจากคลังสินค้า — ช่างไม่ต้องพิมพ์ชื่อรุ่นยาว ๆ บนมือถือ และสะกดตรงกันทุกงาน */
  const stockItems = (stock && stock.items) || [];
  const modelOptions = (mainCat, cur) => {
    const SF = window.SF, out = [];
    stockItems.forEach((s) => {
      if (!s.name || !SF || SF.mainCatOf(s.cat) !== mainCat) return;
      out.push({ value: s.name, label: s.name, sub: [s.brand, s.model].filter(Boolean).join(" · ") });
    });
    out.sort((a, b) => a.label.localeCompare(b.label, "th"));
    const v = (cur || "").trim();
    if (v && !out.some((o) => o.value === v)) out.push({ value: v, label: v, sub: "พิมพ์เอง" });
    return out;
  };

  const captureGps = () => {
    if (!navigator.geolocation) { setGpsErr("อุปกรณ์ไม่รองรับ GPS"); return; }
    setGpsBusy(true); setGpsErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { set("gps", { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), acc: Math.round(pos.coords.accuracy || 0), at: new Date().toISOString() }); setGpsBusy(false); },
      (err) => { setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง"); setGpsBusy(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const pickPhoto = async (slotKey, file) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      /* 1600px คมกว่ารูปสำรวจนิดหนึ่ง เพราะรูปพวกนี้ต้องอ่านซีเรียล/เลขมิเตอร์บนตัวอุปกรณ์ให้ออก */
      const dataUrl = await resizeImageFile(file, 1600, 0.8);
      media.setPhoto(slotKey, dataUrl, currentUser);
    } catch (err) { alert("เพิ่มรูปไม่สำเร็จ: " + err.message); }
    setBusySlot(null);
  };

  const setInv = (i, k, v) => setF((p) => {
    const arr = (p.invs || []).slice(); arr[i] = Object.assign({}, arr[i], { [k]: v });
    return Object.assign({}, p, { invs: arr });
  });
  const addInv = () => setF((p) => Object.assign({}, p, { invs: (p.invs || []).concat([{ model: "", sn: "" }]) }));
  const delInv = (i) => setF((p) => Object.assign({}, p, { invs: (p.invs || []).filter((_, x) => x !== i) }));
  const setSn = (i, v) => setF((p) => {
    const arr = (p.panelSns || []).slice(); arr[i] = v;
    return Object.assign({}, p, { panelSns: arr });
  });

  const save = (extra) => {
    const rec = Object.assign({}, f, { updatedAt: new Date().toISOString(), byName: f.byName || (currentUser && currentUser.name) || "" }, extra || {});
    onSave(rec);
    return rec;
  };
  const doSubmit = () => {
    const rec = save({ status: "sent", submittedAt: new Date().toISOString(), submittedBy: (currentUser && currentUser.name) || "" });
    onSubmit && onSubmit(rec);
    onClose();
  };

  const shownSlots = PERMIT_PHOTO_SLOTS.filter((s) => !s.when || s.when(f));
  const photoDone = shownSlots.filter((s) => media.photos[s.key] && media.photos[s.key].dataUrl).length;

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20,
        width: isMobile ? "100%" : "min(760px,100%)", height: isMobile ? "96dvh" : "min(880px, 92vh)",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>

        {/* หัว + แถบความคืบหน้า */}
        <div style={{ padding: "15px 20px 0", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 11, background: "#14B8A61c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="file" size={18} color="#14B8A6" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ข้อมูลขออนุญาตการไฟฟ้า</h2>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{job ? (job.code + " · " + (job.name || "")) : ""}</span>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
              <div style={{ width: prog.pct + "%", height: "100%", borderRadius: 99, transition: "width .3s",
                background: prog.pct === 100 ? "var(--primary)" : "#F59E0B" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--mono)", color: prog.pct === 100 ? "var(--primary-dark)" : "var(--text-2)", flexShrink: 0 }}>{prog.pct}%</span>
          </div>

          <div className="cat-chip-row" style={{ display: "flex", gap: 5, marginTop: 11, paddingBottom: 11, overflowX: "auto" }}>
            {PERMIT_STEPS.map((s) => {
              const on = step === s.n;
              return (
                <button key={s.n} onClick={() => setStep(s.n)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 99, cursor: "pointer",
                    fontFamily: "inherit", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                    border: "1px solid " + (on ? "transparent" : "var(--border)"),
                    background: on ? "var(--primary)" : "var(--surface)", color: on ? "#fff" : "var(--text-2)" }}>
                  <Icon name={s.icon} size={13} color={on ? "#fff" : "var(--text-3)"} /> {s.th}
                </button>
              );
            })}
          </div>
        </div>

        {/* เนื้อหาแต่ละขั้น */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 13,
          pointerEvents: locked ? "none" : "auto", opacity: locked ? .75 : 1 }}>

          {step === 1 && (
            <React.Fragment>
              <SurveyBlock title="📄 ยื่นแบบไหน" sub="แต่ละแบบใช้เอกสารคนละชุด เลือกให้ตรงก่อน แล้วช่องที่เหลือจะปรับตาม">
                <PermitTypePicker value={f.permitType} onChange={(v) => set("permitType", v)} />
              </SurveyBlock>
              <SurveyBlock title="⚡ จุดรับไฟ" sub="ลอกจากบิลค่าไฟและตัวมิเตอร์ ต้องตรงเป๊ะ ผิดตัวเดียวการไฟฟ้าตีกลับ">
                <PGrid>
                  <PField label="การไฟฟ้าที่ยื่น" required>
                    <Segmented value={f.auth} onChange={(v) => set("auth", v)} options={PERMIT_AUTHS} />
                  </PField>
                  <PField label="เฟส">
                    <Segmented value={f.phase} onChange={(v) => set("phase", v)} options={PERMIT_PHASES} />
                  </PField>
                  <PField label="หมายเลขผู้ใช้ไฟฟ้า (CA)" required hint="อยู่บนบิลค่าไฟ มุมบน">
                    <input inputMode="numeric" style={P_INPUT} value={f.ca} onChange={(e) => set("ca", e.target.value)} placeholder="เช่น 020012345678" />
                  </PField>
                  <PField label="หมายเลขมิเตอร์" required hint="ตัวเลขบนหน้าปัดมิเตอร์">
                    <input style={P_INPUT} value={f.meterNo} onChange={(e) => set("meterNo", e.target.value)} placeholder="เช่น 12345678" />
                  </PField>
                  <PField label="ขนาดมิเตอร์" required hint="เช่น 15(45), 30(100)">
                    <input style={P_INPUT} value={f.meterSize} onChange={(e) => set("meterSize", e.target.value)} placeholder="15(45)" />
                  </PField>
                  <PField label="หมายเลขเสาไฟต้นที่รับไฟ" required hint="อ่านจากป้ายที่ติดบนเสา">
                    <input style={P_INPUT} value={f.poleNo} onChange={(e) => set("poleNo", e.target.value)} placeholder="เช่น 5FA-01-234" />
                  </PField>
                  <PField label="การไฟฟ้าสาขา / เขตที่สังกัด" full hint="ดูจากบิลค่าไฟ ใช้ระบุว่าต้องยื่นที่สำนักงานไหน">
                    <input style={P_INPUT} value={f.branch} onChange={(e) => set("branch", e.target.value)} placeholder="เช่น กฟภ. สาขาบางละมุง" />
                  </PField>
                </PGrid>
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <SurveyBlock title="🔌 ระบบไฟเดิมของลูกค้า" sub="ตัวเลขพวกนี้ต้องตรงกับที่วิศวกรเขียนใน Single Line Diagram">
                <PGrid>
                  <PField label="เมนเบรกเกอร์ AT (แอมป์)" required hint="ตัวเลขที่พิมพ์บนเบรกเกอร์">
                    <input inputMode="numeric" style={P_INPUT} value={f.mainAT} onChange={(e) => set("mainAT", e.target.value)} placeholder="เช่น 50" />
                  </PField>
                  <PField label="เมนเบรกเกอร์ AF (แอมป์)">
                    <input inputMode="numeric" style={P_INPUT} value={f.mainAF} onChange={(e) => set("mainAF", e.target.value)} placeholder="เช่น 100" />
                  </PField>
                  <PField label="ขนาดสายเมน" required hint="เช่น 2x25 sq.mm THW">
                    <input style={P_INPUT} value={f.mainCable} onChange={(e) => set("mainCable", e.target.value)} placeholder="2x25 sq.mm" />
                  </PField>
                  <PField label="ยี่ห้อตู้ MDB">
                    <input style={P_INPUT} value={f.mdbBrand} onChange={(e) => set("mdbBrand", e.target.value)} placeholder="เช่น Schneider" />
                  </PField>
                </PGrid>
                <SurveyToggle label="เมนเป็นชนิดกันดูด (RCD / RCCB)" hint="มีผลกับการต่อระบบโซลาร์" value={f.rccb} onChange={(v) => set("rccb", v)} options={PERMIT_YESNO} />
              </SurveyBlock>
              {f.permitType === "biz" && (
                <SurveyBlock title="🏭 หม้อแปลงของลูกค้า" sub="เฉพาะโรงงาน/อาคารธุรกิจที่มีหม้อแปลงเป็นของตัวเอง">
                  <PGrid>
                    <PField label="ขนาดหม้อแปลง (kVA)" required>
                      <input inputMode="numeric" style={P_INPUT} value={f.trafoKva} onChange={(e) => set("trafoKva", e.target.value)} placeholder="เช่น 250" />
                    </PField>
                    <PField label="ระดับแรงดัน" hint="เช่น 22 kV / 400 V">
                      <input style={P_INPUT} value={f.trafoVolt} onChange={(e) => set("trafoVolt", e.target.value)} placeholder="22 kV" />
                    </PField>
                  </PGrid>
                </SurveyBlock>
              )}
            </React.Fragment>
          )}

          {step === 3 && (
            <React.Fragment>
              <SurveyBlock title="☀️ ระบบที่ติดตั้ง">
                <PGrid>
                  <PField label="ขนาดติดตั้ง kWp (ฝั่ง DC)" required>
                    <input inputMode="decimal" style={P_INPUT} value={f.kwp} onChange={(e) => set("kwp", e.target.value)} placeholder="เช่น 10.4" />
                  </PField>
                  <PField label="กำลังผลิต kW (ฝั่ง AC)" hint="ตามพิกัดอินเวอร์เตอร์">
                    <input inputMode="decimal" style={P_INPUT} value={f.kwac} onChange={(e) => set("kwac", e.target.value)} placeholder="เช่น 10" />
                  </PField>
                  <PField label="เบรกเกอร์ AC ของโซลาร์" required hint="ตัวที่เพิ่มเข้าตู้ MDB">
                    <input style={P_INPUT} value={f.acBreaker} onChange={(e) => set("acBreaker", e.target.value)} placeholder="เช่น 32A 2P" />
                  </PField>
                  <PField label="วันที่ติดตั้งเสร็จ" required>
                    <input type="date" style={P_INPUT} value={f.doneDate} onChange={(e) => set("doneDate", e.target.value)} />
                  </PField>
                </PGrid>
                <SurveyToggle label="มี DC Isolator" value={f.dcIsolator} onChange={(v) => set("dcIsolator", v)} options={PERMIT_YESNO} />
                <SurveyToggle label="มีระบบกันไฟไหลย้อน (Zero Export / ELD)" hint="ถ้ามี ต้องถ่ายรูปจุดคล้อง CT ด้วย" value={f.zeroExport} onChange={(v) => set("zeroExport", v)} options={PERMIT_YESNO} />
                {f.zeroExport === "yes" && (
                  <PField label="รุ่นอุปกรณ์กันไฟไหลย้อน (ELD / Smart Meter)" hint="การไฟฟ้าขอสเปกตัวนี้ด้วย">
                    <input style={P_INPUT} value={f.eldModel} onChange={(e) => set("eldModel", e.target.value)} placeholder="เช่น Huawei Smart Power Sensor DTSU666-H" />
                  </PField>
                )}
              </SurveyBlock>

              <SurveyBlock title="🔧 อินเวอร์เตอร์" sub="กรอกทีละตัว พร้อม Serial ที่อยู่บนเนมเพลท — การไฟฟ้าใช้ผูกกับรุ่นที่อนุมัติ">
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {(f.invs || []).map((iv, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <PField label={"ตัวที่ " + (i + 1) + " — รุ่น"} required>
                          <Dropdown value={iv.model} onChange={(v) => setInv(i, "model", v)} options={modelOptions("inverter", iv.model)} placeholder="เลือกรุ่นจากคลัง" />
                        </PField>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <PField label="Serial" required>
                          <input style={P_INPUT} value={iv.sn} onChange={(e) => setInv(i, "sn", e.target.value)} placeholder="เลขบนเนมเพลท" />
                        </PField>
                      </div>
                      {(f.invs || []).length > 1 && (
                        <button type="button" onClick={() => delInv(i)} title="ลบตัวนี้"
                          style={{ width: 38, height: 38, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="trash" size={14} /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addInv}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                      border: "1px dashed var(--border-strong)", background: "var(--surface2)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>
                    <Icon name="plus" size={14} sw={2.4} /> เพิ่มอินเวอร์เตอร์อีกตัว
                  </button>
                </div>
              </SurveyBlock>

              <SurveyBlock title="🔆 แผงโซลาร์" sub="Serial เก็บเป็นตัวอย่าง 1–2 แผ่นพอ ไม่ต้องไล่ทุกแผ่น">
                <PGrid>
                  <PField label="รุ่นแผง" required full>
                    <Dropdown value={f.panelModel} onChange={(v) => set("panelModel", v)} options={modelOptions("panel", f.panelModel)} placeholder="เลือกรุ่นจากคลัง" />
                  </PField>
                  <PField label="กำลังต่อแผง (W)">
                    <input inputMode="numeric" style={P_INPUT} value={f.panelWatt} onChange={(e) => set("panelWatt", e.target.value)} placeholder="เช่น 620" />
                  </PField>
                  <PField label="จำนวนแผง" required>
                    <input inputMode="numeric" style={P_INPUT} value={f.panelQty} onChange={(e) => set("panelQty", e.target.value)} placeholder="เช่น 16" />
                  </PField>
                  <PField label="Serial แผงตัวอย่างที่ 1" required full>
                    <input style={P_INPUT} value={(f.panelSns || [])[0] || ""} onChange={(e) => setSn(0, e.target.value)} placeholder="อ่านจากสติกเกอร์หลังแผง" />
                  </PField>
                  <PField label="Serial แผงตัวอย่างที่ 2" full>
                    <input style={P_INPUT} value={(f.panelSns || [])[1] || ""} onChange={(e) => setSn(1, e.target.value)} placeholder="ไม่บังคับ" />
                  </PField>
                </PGrid>
              </SurveyBlock>

              <SurveyBlock title="📍 ปิดงาน">
                <PField label="พิกัดหน้างาน (GPS)" hint="การไฟฟ้าขอพิกัดจุดติดตั้งประกอบคำขอ">
                  <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={captureGps} disabled={gpsBusy}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: "none",
                        background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: gpsBusy ? "wait" : "pointer" }}>
                      <Icon name="pin" size={14} color="#fff" /> {gpsBusy ? "กำลังจับพิกัด…" : (f.gps ? "จับพิกัดใหม่" : "จับพิกัดตรงนี้")}
                    </button>
                    {f.gps && <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--text-2)" }}>{f.gps.lat}, {f.gps.lng} <span style={{ color: "var(--text-3)" }}>±{f.gps.acc}m</span></span>}
                    {gpsErr && <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{gpsErr}</span>}
                  </div>
                </PField>
                <PField label="หมายเหตุถึงฝ่ายขออนุญาต" hint="เช่น มิเตอร์เป็นชื่อคนอื่น / ลูกค้าขอเลื่อนวันตรวจ">
                  <textarea rows={3} style={Object.assign({}, P_INPUT, { resize: "vertical" })} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="ไม่มีก็เว้นว่างได้" />
                </PField>
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 4 && (
            <React.Fragment>
              <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)",
                fontSize: 12, color: "var(--tint-amber-tx)", fontWeight: 600, lineHeight: 1.5 }}>
                ถ่ายกลางแดดจ้าแล้วเนมเพลทมักสะท้อนจนอ่านไม่ออก — ใช้มือบังเงาแล้วถ่ายใกล้ ๆ จะผ่านตั้งแต่รอบแรก
                <span style={{ display: "block", marginTop: 3, fontWeight: 700 }}>ถ่ายแล้ว {photoDone}/{shownSlots.length} ช่อง</span>
              </div>
              {PERMIT_PHOTO_GROUPS.map((g) => {
                const list = shownSlots.filter((s) => s.group === g);
                if (!list.length) return null;
                return (
                  <SurveyBlock key={g} title={g}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {list.map((s) => (
                        <PermitShotCard key={s.key} slot={s} shot={media.photos[s.key]} busy={busySlot === s.key}
                          onPick={(file) => pickPhoto(s.key, file)} onRemove={() => media.removePhoto(s.key)} />
                      ))}
                    </div>
                  </SurveyBlock>
                );
              })}
            </React.Fragment>
          )}

          {step === 5 && (
            <React.Fragment>
              <SurveyBlock title={prog.missing.length ? "⚠️ ยังขาดอีก " + prog.missing.length + " อย่าง" : "✅ เก็บครบแล้ว"}
                sub={prog.missing.length ? "แตะรายการเพื่อกระโดดไปหน้าที่ต้องแก้" : "กดส่งต่อได้เลย ฝ่ายขออนุญาตจะได้รับแจ้งเตือนทันที"}>
                {prog.missing.length === 0 ? (
                  <div style={{ padding: "18px 0", textAlign: "center", color: "var(--primary-dark)", fontSize: 13.5, fontWeight: 700 }}>
                    ข้อมูลและรูปถ่ายครบทุกช่องที่การไฟฟ้าต้องใช้
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {prog.missing.map((m, i) => (
                      <button key={i} onClick={() => setStep(m.step)}
                        style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, cursor: "pointer",
                          textAlign: "left", fontFamily: "inherit", width: "100%",
                          border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)" }}>
                        <Icon name={m.kind === "photo" ? "camera" : "pen"} size={14} color="var(--tint-red-tx)" />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "var(--tint-red-tx)" }}>{m.th}</span>
                        <Icon name="chevronRight" size={14} color="var(--tint-red-tx)" />
                      </button>
                    ))}
                  </div>
                )}
              </SurveyBlock>

              <SurveyBlock title="📤 ส่งต่อฝ่ายขออนุญาต" sub="ส่งแล้วยังกลับมาแก้ได้ ถ้าฝ่ายขออนุญาตยังไม่กดรับงาน">
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
                  ชุดข้อมูลนี้ครอบคลุมเฉพาะของที่ต้องเก็บหน้างาน · ส่วนสำเนาบัตรประชาชน, Single Line Diagram
                  ลงนามวิศวกร, หนังสือรับรองโครงสร้าง และหนังสือ กกพ. เป็นงานที่ออฟฟิศจัดเตรียมต่อ
                </div>
                <button type="button" onClick={doSubmit} disabled={prog.missing.length > 0}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none", marginTop: 4,
                    background: prog.missing.length ? "var(--surface3)" : "var(--primary)",
                    color: prog.missing.length ? "var(--text-3)" : "#fff",
                    fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: prog.missing.length ? "not-allowed" : "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon name="arrowRight" size={17} color={prog.missing.length ? "var(--text-3)" : "#fff"} />
                  {prog.missing.length ? "กรอกให้ครบก่อนถึงจะส่งได้" : "ส่งต่อแอดมินขออนุญาต"}
                </button>
              </SurveyBlock>
            </React.Fragment>
          )}
        </div>

        {/* ท้าย: ย้อน/ถัดไป + บันทึกร่าง */}
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom, 0px))" : 12,
          borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
            style={{ padding: "11px 15px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: step === 1 ? "var(--text-3)" : "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13, cursor: step === 1 ? "default" : "pointer" }}>ย้อน</button>
          <button onClick={() => { save(); onClose(); }}
            style={{ flex: 1, padding: "11px 15px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>บันทึกร่าง</button>
          <button onClick={() => setStep((s) => Math.min(5, s + 1))} disabled={step === 5}
            style={{ padding: "11px 20px", borderRadius: 11, border: "none",
              background: step === 5 ? "var(--surface3)" : "var(--primary)", color: step === 5 ? "var(--text-3)" : "#fff",
              fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: step === 5 ? "default" : "pointer" }}>ถัดไป</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  PermitWizard, blankPermit, usePermitPhotos, permitProgress, permitMissing, permitStatusOf,
  PERMIT_PHOTO_SLOTS, PERMIT_SLOT_BY, PERMIT_STEPS, PERMIT_STATUS, PERMIT_TYPES,
});
