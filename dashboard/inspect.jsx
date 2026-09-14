/* ══════════════════════════════════════════════════
   ใบตรวจสอบงาน (Inspection Report) — เก็บเป็นรายการในใบงาน

   งานหนึ่งงานถูกตรวจหลายรอบ: รับมอบหลังคาก่อนเริ่ม · โครงสร้างรองรับ · ติดตั้งแผง ·
   งานระบบไฟฟ้า · ก่อนส่งมอบงาน ทุกครั้งต้องมีใบขอตรวจ ผลการตรวจ และรูปประกอบ
   ใบพวกนี้คือหลักฐานว่างานผ่านเป็นขั้น ๆ ถ้าเกิดปัญหาทีหลังจะย้อนดูได้ว่าตอนนั้นสภาพเป็นยังไง

   จึงเก็บเป็น "รายการใบตรวจของงานนั้น" ไม่ใช่ใบเดียวต่องาน — ประเภทการตรวจเลือก/พิมพ์เองข้างในใบ
   แบบฟอร์มลอกจากของจริงที่ลูกค้าใช้ (Inspection Report of Roof Handover)

   รูปถ่ายเก็บแยกชุดของแต่ละใบ ไม่ใช้รูปจากแบบสำรวจ เพราะคนละเวลาคนละวัตถุประสงค์
   ── ใบใหม่เก็บที่  inspectionPhotos/<jobId>/<irId>
   ── ใบส่งมอบหลังคาที่ทำไว้ก่อนมีระบบนี้ ยังอ่านรูปจากที่เดิม (roofPhotos/<jobId>)
      เพราะย้ายรูปหลายสิบใบข้ามที่เก็บมีแต่เสี่ยงหาย ไม่ได้อะไรกลับมา

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย ir / Ir / IR_ / Inspection
   ══════════════════════════════════════════════════ */

const _IRFB = () => window.FBDB || null;
const _irRef = (p) => window.FBDB.ref(p);

/* ประเภทการตรวจที่เจอบ่อย — กดเลือกได้เลย ไม่ต้องพิมพ์ แต่พิมพ์เองก็ได้ถ้าไม่ตรงอันไหน */
const IR_KINDS = [
  "ส่งมอบหลังคา (Roof Handover)",
  "โครงสร้างรองรับแผง (Mounting Structure)",
  "ติดตั้งแผง (PV Module Installation)",
  "งานระบบไฟฟ้า (Electrical Works)",
  "ก่อนส่งมอบงาน (Final Inspection)",
];

/* ผลของ "รายการตรวจ" ทีละข้อ — คนละชั้นกับผลรวมของทั้งใบ
   ใบที่มีแต่ผลรวมบอกได้แค่ผ่าน/ไม่ผ่าน แต่บอกไม่ได้ว่าไม่ผ่านเพราะข้อไหน
   พอมีรายการทีละข้อ ตอนตรวจซ้ำจะรู้ทันทีว่าต้องกลับไปดูอะไรบ้าง */
const IR_ITEM_RESULTS = [
  { key: "pass", en: "Pass", th: "ผ่าน", mark: "✓", color: "#16A34A" },
  { key: "fail", en: "Fail", th: "ไม่ผ่าน", mark: "✗", color: "#EF4444" },
  { key: "na", en: "N/A", th: "ไม่เกี่ยวข้อง", mark: "–", color: "#64748B" },
];
const IR_ITEM_BY = {};
IR_ITEM_RESULTS.forEach((r) => { IR_ITEM_BY[r.key] = r; });

/* หัวข้อที่ต้องตรวจของแต่ละประเภท — กดใส่ทีเดียวได้ทั้งชุด ไม่ต้องพิมพ์เองทุกครั้ง
   ตั้งให้ครบตามที่ตรวจจริงหน้างาน แล้วลบข้อที่ไม่เกี่ยวออกทีหลังได้ */
const IR_ITEM_PRESETS = {
  "ส่งมอบหลังคา (Roof Handover)": [
    "สภาพแผ่นหลังคา (รอยบุบ/รอยขีดข่วน)",
    "รอยรั่ว / คราบน้ำที่มีอยู่เดิม",
    "สภาพโครงสร้างรองรับหลังคา",
    "ทางขึ้น-ลงหลังคาและจุดยึดเชือกนิรภัย",
    "สิ่งกีดขวางบนหลังคา (ท่อ/พัดลม/สกายไลท์)",
    "ความสะอาดพื้นที่ก่อนรับมอบ",
  ],
  "โครงสร้างรองรับแผง (Mounting Structure)": [
    "ระยะและแนวรางตามแบบ",
    "จุดยึดและการซีลกันรั่ว",
    "แรงขันน็อตตามสเปก",
    "การต่อลงดินของโครงสร้าง",
  ],
  "ติดตั้งแผง (PV Module Installation)": [
    "จำนวนแผงและตำแหน่งตามผัง",
    "ระยะห่างและแนวแผงเรียบร้อย",
    "คลิปยึดแผงครบและแน่น",
    "สภาพแผง (ไม่มีรอยร้าว/รอยกระแทก)",
    "การเก็บสายใต้แผง",
  ],
  "งานระบบไฟฟ้า (Electrical Works)": [
    "การเดินสาย DC และการรัดสาย",
    "ขั้วต่อ MC4 แน่นและถูกขั้ว",
    "ตู้ DC/AC และอุปกรณ์ป้องกัน",
    "การต่อลงดินและระบบกันฟ้าผ่า",
    "ป้ายเตือนและป้ายระบุวงจร",
  ],
  "ก่อนส่งมอบงาน (Final Inspection)": [
    "ทดสอบการทำงานของระบบ",
    "ค่าที่วัดได้ตรงกับที่ออกแบบ",
    "ความสะอาดและเก็บงานหน้างาน",
    "เอกสารส่งมอบครบถ้วน",
  ],
};
const IR_ITEM_FALLBACK = ["ความถูกต้องตามแบบ", "คุณภาพงานติดตั้ง", "ความปลอดภัยหน้างาน", "ความสะอาดเรียบร้อย"];

const irPresetItems = (kind) => (IR_ITEM_PRESETS[kind] || IR_ITEM_FALLBACK);
const irNewItem = (name) => ({
  id: "it-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  name: name || "", result: "", note: "",
});

/* นับผลรายข้อ ไว้โชว์สรุปสั้น ๆ ทั้งในฟอร์มและบนกระดาษ */
function irItemTally(items) {
  const t = { pass: 0, fail: 0, na: 0, blank: 0, total: (items || []).length };
  (items || []).forEach((x) => { t[x.result || "blank"] = (t[x.result || "blank"] || 0) + 1; });
  return t;
}

/* ผลการตรวจสอบ — ตรงตามช่องติ๊กสี่ช่องในแบบฟอร์มจริง */
const IR_RESULTS = [
  { key: "approved", en: "Approved", th: "อนุมัติ", color: "#16A34A" },
  { key: "rectified", en: "Rectified", th: "แก้ไข", color: "#F59E0B" },
  { key: "rejected", en: "Rejected", th: "ไม่ผ่าน", color: "#EF4444" },
  { key: "others", en: "Others", th: "อื่น ๆ", color: "#64748B" },
];
const IR_RESULT_BY = {};
IR_RESULTS.forEach((r) => { IR_RESULT_BY[r.key] = r; });

/* เลขใบถัดไปของงานนี้ — ไล่จากเลขที่มีอยู่จริง กันเลขซ้ำเมื่อลบใบกลาง ๆ แล้วสร้างใหม่ */
function irNextNo(list) {
  let mx = 0;
  (list || []).forEach((x) => { const m = /(\d+)\s*$/.exec(x.no || ""); if (m) mx = Math.max(mx, +m[1]); });
  const n = Math.max(mx, (list || []).length) + 1;
  return "IR-" + (n < 10 ? "0" + n : String(n));
}

/* ใบเปล่า — เติมค่าที่รู้อยู่แล้วจากใบงานให้ ช่างจะได้ไม่ต้องพิมพ์ซ้ำ */
function irBlank(job, no, kind) {
  const j = job || {};
  const B = window.BRANDING || {};
  return {
    no: no || "IR-01", kind: kind || IR_KINDS[0],
    to: "", project: j.name || "", contractor: B.legal || "",
    reqDate: new Date().toISOString().slice(0, 10),
    reqItems: "", inspAt: "", refIr: "", others: "", reqBy: "",
    items: [],
    result: "", resultOther: "", note: "",
    issueBy: "", inspectedBy: "", approvedBy: "", clientBy: "",
  };
}

/* ที่เก็บรูปของใบนี้ — ใบเก่าที่ย้ายมาจากระบบส่งมอบหลังคาจะพกที่อยู่เดิมติดตัวมาใน photoPath */
const irPhotoPath = (jobId, rec) => (rec && rec.photoPath) || ("inspectionPhotos/" + jobId + "/" + ((rec && rec.id) || "x"));

/* ── ใบตรวจทั้งหมดของงานหนึ่งงาน ──
   อ่านสองที่: รายการใบตรวจของระบบใหม่ กับใบส่งมอบหลังคาใบเดียวของระบบเดิม
   ใบเดิมจะโผล่มาเป็นใบแรกของรายการเสมอ จนกว่าจะถูกบันทึกทับเข้าระบบใหม่ */
function useJobInspections(jobId) {
  const [rows, setRows] = React.useState([]);
  const [legacy, setLegacy] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!jobId || !_IRFB()) { setRows([]); setLegacy(null); setLoading(false); return; }
    const a = _irRef("inspections/" + jobId);
    const ha = a.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((x, y) => String(x.no || "").localeCompare(String(y.no || "")));
      setRows(arr); setLoading(false);
    });
    const b = _irRef("roofHandover/" + jobId);
    const hb = b.on("value", (s) => setLegacy(s.val() || null));
    return () => { a.off("value", ha); b.off("value", hb); };
  }, [jobId]);

  const list = React.useMemo(() => {
    const out = rows.slice();
    /* ใบเดิมยังไม่ถูกบันทึกทับ (ยังไม่มี id "roof" ในระบบใหม่) จึงต้องเอามาต่อให้เห็น */
    if (legacy && !rows.some((x) => x.id === "roof")) {
      out.unshift(Object.assign({}, legacy, {
        id: "roof", no: legacy.no || "IR-01", kind: legacy.kind || IR_KINDS[0],
        photoPath: "roofPhotos/" + jobId,
      }));
    }
    return out;
  }, [rows, legacy, jobId]);

  const save = React.useCallback((id, patch, user) => {
    if (!jobId || !_IRFB() || !id) return;
    _irRef("inspections/" + jobId + "/" + id).update(Object.assign({ id: id }, patch, {
      updatedAt: new Date().toISOString(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || "",
    }));
  }, [jobId]);

  const create = React.useCallback((job, kind, user) => {
    if (!jobId || !_IRFB()) return null;
    const id = "IR-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const rec = Object.assign(irBlank(job, irNextNo(list), kind), {
      id: id, createdAt: new Date().toISOString(),
      createdBy: (user || {}).id || null, createdByName: (user || {}).name || "",
    });
    _irRef("inspections/" + jobId + "/" + id).set(rec);
    return rec;
  }, [jobId, list]);

  const remove = React.useCallback((id) => {
    if (!jobId || !_IRFB() || !id) return;
    _irRef("inspections/" + jobId + "/" + id).remove();
    /* ใบเดิมต้องลบต้นทางด้วย ไม่งั้นมันจะเด้งกลับมาในรายการอีก */
    if (id === "roof") _irRef("roofHandover/" + jobId).remove();
  }, [jobId]);

  return { list: list, loading: loading, save: save, create: create, remove: remove };
}

/* รูปของใบตรวจหนึ่งใบ — รับที่อยู่มาตรง ๆ เพราะใบเก่ากับใบใหม่เก็บคนละที่ */
function useIrPhotos(path) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!path || !_IRFB()) { setPhotos([]); return; }
    const ref = _irRef(path);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [path]);

  const add = React.useCallback((dataUrl, user) => {
    if (!path || !_IRFB()) return;
    const id = "IRP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _irRef(path + "/" + id).set({
      id: id, dataUrl: dataUrl, cap: "", at: new Date().toISOString(),
      by: (user || {}).id || null, byName: (user || {}).name || "",
    });
  }, [path]);
  const setCap = React.useCallback((id, cap) => {
    if (!path || !_IRFB()) return;
    _irRef(path + "/" + id).update({ cap: cap || "" });
  }, [path]);
  const remove = React.useCallback((id) => {
    if (!path || !_IRFB()) return;
    _irRef(path + "/" + id).remove();
  }, [path]);

  return { photos: photos, add: add, setCap: setCap, remove: remove };
}

/* สรุปไว้โชว์บนปุ่มในใบงาน — บอกจำนวนใบกับผลของใบล่าสุด โดยไม่ต้องกดเข้าไปดู */
function irJobSummary(list) {
  const arr = list || [];
  if (!arr.length) return { label: "ยังไม่มีใบตรวจ · แตะเพื่อสร้าง", color: "var(--text-3)", bold: false };
  const last = arr[arr.length - 1];
  const r = IR_RESULT_BY[last.result];
  const head = arr.length + " ใบ · ล่าสุด " + (last.no || "");
  if (!r) return { label: head + " · ยังไม่สรุปผล", color: "#F59E0B", bold: true };
  return { label: head + " · " + r.th, color: r.color, bold: true };
}

/* ══════════════════════════════════════════════════
   รายการใบตรวจของงาน
   ══════════════════════════════════════════════════ */
function InspectionListModal({ job, currentUser, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = useJobInspections(job ? job.id : null);
  const [openId, setOpenId] = React.useState(null);
  const [picking, setPicking] = React.useState(false);
  const [ask, setAsk] = React.useState(null);

  if (!job) return null;
  const editing = openId ? store.list.find((x) => x.id === openId) : null;

  const startNew = (kind) => {
    const rec = store.create(job, kind, currentUser);
    setPicking(false);
    if (rec) setOpenId(rec.id);
  };

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 128,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)",
          maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#0EA5E91c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="list" size={17} color="#0284C7" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>ใบตรวจสอบงาน (Inspection Report)</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.code} · {job.name}
              </div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {store.loading && <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด…</div>}

            {!store.loading && !store.list.length && (
              <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13,
                background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 14 }}>
                ยังไม่มีใบตรวจของงานนี้<br />กด “สร้างใบตรวจใหม่” แล้วเลือกว่าตรวจเรื่องอะไร
              </div>
            )}

            {store.list.map((x) => {
              const r = IR_RESULT_BY[x.result];
              return (
                <div key={x.id} style={{ border: "1px solid var(--border)", borderLeft: "3px solid " + (r ? r.color : "var(--border-strong)"),
                  borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
                  <button onClick={() => setOpenId(x.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 13px",
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                        <span style={{ fontFamily: "var(--mono)", color: "var(--text-3)", fontSize: 11.5, marginRight: 7 }}>{x.no}</span>
                        {x.kind}
                      </span>
                      <span style={{ display: "block", fontSize: 11.5, color: r ? r.color : "var(--text-3)", fontWeight: r ? 700 : 400, marginTop: 2 }}>
                        {r ? "ผลตรวจ: " + r.th : "ยังไม่สรุปผลการตรวจ"}
                        {x.reqDate ? " · ขอตรวจ " + (window.drDateTH ? window.drDateTH(x.reqDate) : x.reqDate) : ""}
                      </span>
                    </span>
                    <Icon name="arrowRight" size={16} color="var(--text-3)" />
                  </button>
                  {ask === x.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "10px 13px", borderTop: "1px solid var(--border)" }}>
                      <span style={{ flex: 1, minWidth: 150, fontSize: 12, fontWeight: 700, color: "#EF4444", lineHeight: 1.5 }}>
                        ลบใบ {x.no} ? รูปที่แนบไว้จะยังอยู่ แต่ใบนี้จะหายไป
                      </span>
                      <button onClick={() => { store.remove(x.id); setAsk(null); }} style={{ padding: "7px 13px", borderRadius: 9, border: "none",
                        background: "#EF4444", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>ลบเลย</button>
                      <button onClick={() => setAsk(null)} style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)",
                        background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
                    </div>
                  ) : (
                    <div style={{ padding: "0 13px 10px" }}>
                      <button onClick={() => setAsk(x.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border-strong)",
                        background: "var(--surface)", color: "#EF4444", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>ลบใบนี้</button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* เลือกประเภทก่อนสร้าง — ตั้งชื่อใบให้ตรงเรื่องตั้งแต่แรก ดีกว่าสร้างเปล่าแล้วลืมแก้ */}
            {picking && (
              <div style={{ border: "1px solid var(--border-strong)", borderRadius: 12, padding: 12, background: "var(--surface)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 9 }}>ตรวจเรื่องอะไร</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {IR_KINDS.map((k) => (
                    <button key={k} onClick={() => startNew(k)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10,
                      border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text-1)",
                      fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{k}</button>
                  ))}
                  <button onClick={() => startNew("")} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
                    fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>อื่น ๆ — พิมพ์เองในใบ</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
            borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
            <button onClick={() => setPicking((v) => !v)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: 12, borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>
              <Icon name="plus" size={16} color="#fff" sw={2.4} /> {picking ? "ปิดรายการประเภท" : "สร้างใบตรวจใหม่"}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <InspectionFormModal job={job} rec={editing} currentUser={currentUser}
          onSave={(patch) => store.save(editing.id, patch, currentUser)}
          onClose={() => setOpenId(null)} />
      )}
    </React.Fragment>
  );
}

/* ══════════════════════════════════════════════════
   ฟอร์มกรอกใบตรวจหนึ่งใบ
   ══════════════════════════════════════════════════ */

/* หนึ่งช่องกรอก: หัวข้ออังกฤษ + ไทยในวงเล็บ ตามหน้าตาแบบฟอร์มจริง

   ต้องประกาศไว้นอกคอมโพเนนต์แม่เท่านั้น — ถ้าไปประกาศข้างในฟอร์ม
   ทุกครั้งที่พิมพ์ตัวอักษรมันจะกลายเป็นคอมโพเนนต์ "ชนิดใหม่" ในสายตา React
   React จึงถอดของเก่าทิ้งแล้วสร้างใหม่ ทำให้เคอร์เซอร์หลุดออกจากช่องทุกตัวอักษร */
function IrField({ label, thai, wide, lbl, sub, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: wide ? "1 / -1" : "auto", minWidth: 0 }}>
      <label style={lbl}>{label} <span style={sub}>({thai})</span></label>
      {children}
    </div>
  );
}

/* หนึ่งแถวของตารางรายการตรวจ — อยู่นอกฟอร์มด้วยเหตุผลเดียวกับ IrField (เคอร์เซอร์หลุด) */
function IrItemRow({ item, no, inp, onChange, onRemove, isMobile }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row",
      padding: "9px 10px", borderTop: "1px solid var(--border)" }}>
      <span style={{ flexShrink: 0, fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)", minWidth: 20 }}>{no}.</span>
      <input value={item.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="หัวข้อที่ตรวจ"
        style={Object.assign({}, inp, { flex: 2, minWidth: 0 })} />
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {IR_ITEM_RESULTS.map((r) => {
          const on = item.result === r.key;
          return (
            <button key={r.key} type="button" onClick={() => onChange({ result: on ? "" : r.key })}
              title={r.th}
              style={{ padding: "8px 11px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                border: "1px solid " + (on ? r.color : "var(--border-strong)"),
                background: on ? r.color + "16" : "var(--surface)", color: on ? r.color : "var(--text-3)", whiteSpace: "nowrap" }}>
              {r.mark} {r.th}
            </button>
          );
        })}
      </div>
      <input value={item.note} onChange={(e) => onChange({ note: e.target.value })} placeholder="หมายเหตุ"
        style={Object.assign({}, inp, { flex: 1.4, minWidth: 0 })} />
      <button type="button" onClick={onRemove} title="ลบข้อนี้"
        style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}>
        <Icon name="trash" size={13} color="#EF4444" />
      </button>
    </div>
  );
}

function InspectionFormModal({ job, rec, currentUser, onSave, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const path = irPhotoPath(job ? job.id : "", rec);
  const photos = useIrPhotos(path);
  const [f, setF] = React.useState(() => {
    const base = Object.assign(irBlank(job), rec || {}, { photoPath: path });
    /* firebase ไม่เก็บ array ว่าง — ใบที่ยังไม่มีรายการตรวจจะกลับมาเป็น undefined */
    base.items = Array.isArray(base.items) ? base.items : [];
    return base;
  });
  const [paper, setPaper] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const tally = irItemTally(f.items);

  const set = (k, v) => { setF((p) => Object.assign({}, p, { [k]: v })); setSaved(false); };
  const fillPreset = () => set("items", irPresetItems(f.kind).map((n) => irNewItem(n)));
  const doSave = () => {
    onSave(f);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const sub = { fontSize: 10.5, color: "var(--text-3)", fontWeight: 500, textTransform: "none", letterSpacing: 0 };
  /* inputStyle เป็น const ระดับบนสุดของ form.jsx — สคริปต์ทุกไฟล์ใช้ขอบเขตร่วมกัน จึงเรียกตรงได้ */
  const inp = Object.assign({}, inputStyle, { padding: "9px 11px", fontSize: 13 });

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 132,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(860px,100%)",
          maxHeight: isMobile ? "94dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>
                <span style={{ fontFamily: "var(--mono)", color: "var(--text-3)", fontSize: 12, marginRight: 7 }}>{f.no}</span>
                Inspection Report
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.code} · {job.name}
              </div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ประเภทการตรวจ — กดเลือกจากที่เจอบ่อย หรือพิมพ์เอง */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <label style={lbl}>ประเภทการตรวจ <span style={sub}>(Inspection type)</span></label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {IR_KINDS.map((k) => {
                  const on = f.kind === k;
                  return (
                    <button key={k} type="button" onClick={() => set("kind", k)}
                      style={{ padding: "7px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                        background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>{k}</button>
                  );
                })}
              </div>
              <input value={f.kind} onChange={(e) => set("kind", e.target.value)} placeholder="หรือพิมพ์ประเภทเอง" style={inp} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <IrField label="Report No." thai="เลขที่ใบ" lbl={lbl} sub={sub}>
                <input value={f.no} onChange={(e) => set("no", e.target.value)} style={inp} />
              </IrField>
              <IrField label="To" thai="เรียน" lbl={lbl} sub={sub}>
                <input value={f.to} onChange={(e) => set("to", e.target.value)} placeholder="ชื่อผู้รับ / เจ้าของอาคาร" style={inp} />
              </IrField>
              <IrField label="Project Name" thai="ชื่อโครงการ" lbl={lbl} sub={sub}>
                <input value={f.project} onChange={(e) => set("project", e.target.value)} style={inp} />
              </IrField>
              <IrField label="Contractor" thai="ผู้รับเหมา" lbl={lbl} sub={sub}>
                <input value={f.contractor} onChange={(e) => set("contractor", e.target.value)} style={inp} />
              </IrField>
              <IrField label="Request Date" thai="วันที่ขอ" lbl={lbl} sub={sub}>
                <input type="date" value={f.reqDate} onChange={(e) => set("reqDate", e.target.value)} style={inp} />
              </IrField>
              <IrField label="Inspection Date and Time" thai="วันและเวลาที่ตรวจสอบ" lbl={lbl} sub={sub}>
                <input type="datetime-local" value={f.inspAt} onChange={(e) => set("inspAt", e.target.value)} style={inp} />
              </IrField>
              <IrField label="Request to inspect" thai="หัวข้อการตรวจสอบ" wide lbl={lbl} sub={sub}>
                <textarea value={f.reqItems} onChange={(e) => set("reqItems", e.target.value)} rows={2}
                  placeholder="เขียนให้ชัดว่าขอให้ตรวจอะไรบ้าง"
                  style={Object.assign({}, inp, { resize: "vertical", lineHeight: 1.5 })} />
              </IrField>
              <IrField label="Ref IR No." thai="อ้างอิงจาก IR เลขที่" lbl={lbl} sub={sub}>
                <input value={f.refIr} onChange={(e) => set("refIr", e.target.value)} placeholder="ถ้าเป็นการตรวจซ้ำ ใส่เลขใบเดิม" style={inp} />
              </IrField>
              <IrField label="Request by" thai="ขอโดย" lbl={lbl} sub={sub}>
                <input value={f.reqBy} onChange={(e) => set("reqBy", e.target.value)} style={inp} />
              </IrField>
              <IrField label="Others" thai="อื่น ๆ" wide lbl={lbl} sub={sub}>
                <input value={f.others} onChange={(e) => set("others", e.target.value)} style={inp} />
              </IrField>
            </div>

            {/* ตารางรายการตรวจทีละข้อ — ตัวที่บอกว่า "ไม่ผ่านเพราะข้อไหน" ผลรวมข้างล่างบอกไม่ได้ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <label style={lbl}>รายการตรวจ <span style={sub}>(Checklist)</span></label>
                {tally.total > 0 && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
                    <span style={{ color: "#16A34A" }}>ผ่าน {tally.pass}</span>
                    {tally.fail ? <span style={{ color: "#EF4444" }}> · ไม่ผ่าน {tally.fail}</span> : null}
                    {tally.blank ? <span style={{ color: "var(--text-3)" }}> · ยังไม่ได้ติ๊ก {tally.blank}</span> : null}
                  </span>
                )}
                <span style={{ flex: 1 }} />
                {!f.items.length && (
                  <button type="button" onClick={fillPreset}
                    style={{ padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                      color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                    ใส่รายการมาตรฐานของประเภทนี้
                  </button>
                )}
                <button type="button" onClick={() => set("items", f.items.concat([irNewItem("")]))}
                  style={{ padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  + เพิ่มข้อ
                </button>
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)", overflow: "hidden" }}>
                {!f.items.length ? (
                  <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
                    ยังไม่มีรายการตรวจ — กด “ใส่รายการมาตรฐานของประเภทนี้” แล้วแก้ทีหลังได้
                  </div>
                ) : f.items.map((it, i) => (
                  <IrItemRow key={it.id || i} item={it} no={i + 1} inp={inp} isMobile={isMobile}
                    onChange={(patch) => set("items", f.items.map((x, j) => (j === i ? Object.assign({}, x, patch) : x)))}
                    onRemove={() => set("items", f.items.filter((x, j) => j !== i))} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={lbl}>The result of inspection <span style={sub}>(ผลการตรวจสอบ)</span></label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {IR_RESULTS.map((r) => {
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

            <IrField label="Note" thai="หมายเหตุ" wide lbl={lbl} sub={sub}>
              <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={3}
                placeholder='เช่น "โซน B มีรอยรั่วเดิม 2 จุด ถ่ายรูปไว้แล้ว"'
                style={Object.assign({}, inp, { resize: "vertical", lineHeight: 1.5 })} />
            </IrField>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={lbl}>ผู้ลงนามท้ายใบ <span style={sub}>(เว้นว่างได้ — พิมพ์ออกมาเป็นช่องให้เซ็นสด)</span></label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <IrField label="Issue By" thai="ผู้ออกใบ · EPC" lbl={lbl} sub={sub}>
                  <input value={f.issueBy} onChange={(e) => set("issueBy", e.target.value)} style={inp} />
                </IrField>
                <IrField label="Inspected By" thai="ผู้ตรวจสอบ · EPC" lbl={lbl} sub={sub}>
                  <input value={f.inspectedBy} onChange={(e) => set("inspectedBy", e.target.value)} style={inp} />
                </IrField>
                <IrField label="Approved By" thai="ผู้อนุมัติ · Project Manager" lbl={lbl} sub={sub}>
                  <input value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} style={inp} />
                </IrField>
                <IrField label="Approved by Client" thai="อนุมัติโดยลูกค้า" lbl={lbl} sub={sub}>
                  <input value={f.clientBy} onChange={(e) => set("clientBy", e.target.value)} style={inp} />
                </IrField>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <label style={lbl}>รูปประกอบการตรวจ <span style={sub}>(ใบรายงานรูปถ่ายใช้รูปชุดนี้)</span></label>
              <IrPhotoPicker store={photos} currentUser={currentUser} />
            </div>

            {rec && rec.updatedAt && (
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                แก้ไขล่าสุด {window.drDateTH ? window.drDateTH(rec.updatedAt, true) : rec.updatedAt}
                {rec.updatedByName ? " · โดย " + rec.updatedByName : ""}
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

      {paper && window.InspectionPaper && (
        <window.InspectionPaper job={job} rec={f} photos={photos.photos} onClose={() => setPaper(false)} />
      )}
    </React.Fragment>
  );
}

/* ช่องใส่รูป — โครงเดียวกับ OmVisitPhotos แต่ไม่มีการแยก ก่อน/หลัง เพราะใบนี้ถ่ายรอบเดียว */
function IrPhotoPicker({ store, currentUser }) {
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
              <img src={p.dataUrl} alt={p.cap || "รูปการตรวจ"} style={{ width: "100%", height: 108, objectFit: "cover", display: "block" }} />
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
  IR_KINDS, IR_RESULTS, IR_RESULT_BY, IR_ITEM_RESULTS, IR_ITEM_BY, IR_ITEM_PRESETS,
  irBlank, irNextNo, irPhotoPath, irJobSummary, irPresetItems, irNewItem, irItemTally,
  useJobInspections, useIrPhotos, InspectionListModal, InspectionFormModal, IrPhotoPicker,
});
