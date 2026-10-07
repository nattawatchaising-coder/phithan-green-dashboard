/* ═══════════════════════════════════════════════════════════════════════
   หลายเวอร์ชัน — แบบ 3D และ BOQ ของงาน/ลูกค้าเดียวกัน (คำนำหน้า dv / Dv)

   แบบ 3D
   · plan3d/{jobId}        = ต้นแบบ (เวอร์ชัน "1") — ที่เดิมทุกตัวอักษร ของเก่าเปิดได้เหมือนเดิม
   · plan3d/{jobId}~{n}    = เวอร์ชัน n (2, 3, …) — สร้างโดยคัดลอกจากต้นแบบ (หรือเวอร์ชันอื่น)
   · plan3dVers/{jobId}/{n} = { name, at, by, byName, from, sum:{panels,kwp,at} } — ดัชนี + สรุปจากการบันทึกล่าสุด
     ("1" มีได้แค่ชื่อ/สรุป ไม่ต้องมีก็ได้)

   BOQ
   · boqVers/{jobId}/{n} = { name, at, by, byName, boq } — ทุกเวอร์ชันหลังกดสร้างเวอร์ชันที่สอง
     (ตอนนั้นใบเดิมใน job.boq ถูกคัดลอกลงเป็นเวอร์ชัน "1")
   · job.boq (หรือ lead.boq) = สำเนาของ "เวอร์ชันที่ใช้งาน" — ใบเสนอราคา/วางบิล/สรุปงาน อ่านตรงนี้เหมือนเดิม
     job.boq.ver = เลขเวอร์ชันที่ใช้งาน (ไม่มี = "1")
   · boq.plan3d = เวอร์ชันแบบ 3D ที่ BOQ ใบนั้นผูกอยู่ (ไม่มี = ต้นแบบ) — BOQ อ่านแผง/ราง/ทางเดิน จากแบบนี้

   ย้ายตามงาน: movePlan3d (plan3d.jsx) ย้ายทุกเวอร์ชัน + ดัชนี + boqVers ไปพร้อมกัน
   ═══════════════════════════════════════════════════════════════════════ */

const DV_P3_FIRST = "ต้นแบบ";
const dvP3Key = (jobId, ver) => (!jobId ? null : ver && String(ver) !== "1" ? jobId + "~" + ver : jobId);
/* แยกกลับ "LD-xx~3" → { jobId: "LD-xx", ver: "3" } */
const dvP3Split = (key) => { const m = /^(.*)~(\d+)$/.exec(String(key || "")); return m ? { jobId: m[1], ver: m[2] } : { jobId: key, ver: "1" }; };
const dvUser = (u) => ({ by: (u && (u.id || u.uid)) || "", byName: (u && (u.name || u.displayName)) || "" });
const dvNextId = (ids) => String(Math.max(1, ...ids.map((x) => +x || 0)) + 1);
const dvWhen = (t) => {
  if (!t) return "";
  const d = new Date(t);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
};

/* ── ฟังติดโหนดเดียว (RTDB) — ไม่มี FBDB = ว่าง ── */
function dvUseNode(path) {
  const [v, setV] = React.useState(undefined);
  React.useEffect(() => {
    if (!path || !window.FBDB) { setV(null); return; }
    const ref = window.FBDB.ref(path);
    const h = ref.on("value", (s) => setV(s.val() || null));
    return () => ref.off("value", h);
  }, [path]);
  return v;
}

/* รายการเวอร์ชันแบบ 3D เรียงตามเลข — ต้นแบบอยู่บนสุดเสมอ */
function useP3Vers(jobId) {
  const idx = dvUseNode(jobId ? "plan3dVers/" + jobId : null);
  return React.useMemo(() => {
    const m = idx || {};
    const first = Object.assign({ name: DV_P3_FIRST }, m["1"] || {}, { id: "1" });
    const rest = Object.keys(m).filter((k) => k !== "1" && m[k]).sort((a, b) => +a - +b)
      .map((k) => Object.assign({ name: "เวอร์ชัน " + k }, m[k], { id: k }));
    return { list: [first].concat(rest), loading: idx === undefined };
  }, [idx]);
}
const dvP3Name = (list, ver) => { const v = (list || []).find((x) => x.id === String(ver || "1")); return v ? v.name : ver && ver !== "1" ? "เวอร์ชัน " + ver : DV_P3_FIRST; };

/* สรุปแผงลงดัชนีทุกครั้งที่บันทึกแบบ (เรียกจาก usePlan3d.save) — รายการเวอร์ชันจะได้บอกจำนวนแผงโดยไม่ต้องโหลดทั้งแบบ */
function dvP3Saved(key, data) {
  if (!window.FBDB || !key) return;
  const k = dvP3Split(key);
  const s = window.p3PlanSummary ? window.p3PlanSummary(data) : null;
  window.FBDB.ref("plan3dVers/" + k.jobId + "/" + k.ver + "/sum").set({ panels: s ? s.panels : 0, kwp: s ? s.kwp : 0, at: Date.now() });
}

/* สร้างเวอร์ชันใหม่ = คัดลอกแบบทั้งก้อนจากเวอร์ชันต้นทาง (ค่าเริ่ม = ต้นแบบ) */
function dvP3Create(jobId, fromVer, list, user, name) {
  const id = dvNextId((list || []).map((x) => x.id));
  const db = window.FBDB;
  return db.ref("plan3d/" + dvP3Key(jobId, fromVer)).once("value").then((s) => {
    const v = s.val();
    const meta = Object.assign({ name: (name || "").trim() || "เวอร์ชัน " + id, from: String(fromVer || "1"), at: Date.now() }, dvUser(user));
    const src = (list || []).find((x) => x.id === String(fromVer || "1"));
    if (src && src.sum) meta.sum = src.sum;
    return Promise.all([v ? db.ref("plan3d/" + dvP3Key(jobId, id)).set(v) : null, db.ref("plan3dVers/" + jobId + "/" + id).set(meta)]);
  }).then(() => id);
}
const dvP3Rename = (jobId, ver, name) => window.FBDB.ref("plan3dVers/" + jobId + "/" + ver + "/name").set((name || "").trim() || null);
/* ลบได้เฉพาะเวอร์ชันที่ไม่ใช่ต้นแบบ — ผู้เรียกกันไว้แล้วว่าไม่มี BOQ ผูกอยู่ */
const dvP3Delete = (jobId, ver) => (String(ver) === "1" ? Promise.resolve() :
  Promise.all([window.FBDB.ref("plan3d/" + dvP3Key(jobId, ver)).remove(), window.FBDB.ref("plan3dVers/" + jobId + "/" + ver).remove()]));

/* รายการเวอร์ชัน BOQ — ยังไม่เคยสร้างเวอร์ชันที่สอง = มีแค่ใบใน job.boq เป็นเวอร์ชัน "1" (ยังไม่ได้เขียน boqVers) */
function useBoqVers(jobId, activeBoq) {
  const node = dvUseNode(jobId ? "boqVers/" + jobId : null);
  return React.useMemo(() => {
    const act = String((activeBoq && activeBoq.ver) || "1");
    const m = node || {};
    let list = Object.keys(m).filter((k) => m[k]).sort((a, b) => +a - +b)
      .map((k) => Object.assign({ name: "เวอร์ชัน " + k }, m[k], { id: k }));
    const real = list.length > 0;
    if (!real) list = activeBoq ? [{ id: "1", name: "เวอร์ชัน 1", boq: activeBoq }] : [];
    /* ใบที่ใช้งานอ่านจาก job.boq เสมอ — เป็นตัวจริงล่าสุด (บันทึกจากที่อื่นก็ตามมา) */
    list = list.map((x) => (x.id === act && activeBoq ? Object.assign({}, x, { boq: activeBoq }) : x));
    return { list, active: act, real, loading: node === undefined };
  }, [node, activeBoq]);
}

/* บันทึกใบของเวอร์ชันหนึ่ง — ใบที่ใช้งานอยู่ต้องเขียน job.boq ด้วย (ผ่าน patchActive ของผู้เรียก) */
function dvBoqSave(jobId, ver, boq, vers, patchActive) {
  const v = String(ver || "1");
  const out = Object.assign({}, boq, { ver: v });
  const jobs = [];
  if (vers && vers.real && window.FBDB) jobs.push(window.FBDB.ref("boqVers/" + jobId + "/" + v).update({ boq: out, at: Date.now() }));
  if (!vers || v === vers.active) patchActive(out);
  return Promise.all(jobs);
}
/* สร้าง BOQ เวอร์ชันใหม่ — ครั้งแรกคัดลอกใบเดิมลงเป็นเวอร์ชัน "1" ก่อน (ใบเดิมไม่หาย และยังเป็นตัวใช้งาน) */
function dvBoqCreate(jobId, vers, opt, user) {
  const db = window.FBDB;
  const ps = [];
  const list = vers.list || [];
  if (!vers.real && list.length) {
    const first = list[0];
    ps.push(db.ref("boqVers/" + jobId + "/1").set(Object.assign({ name: first.name, at: Date.now(), boq: Object.assign({}, first.boq, { ver: "1" }) }, dvUser(user))));
  }
  const id = dvNextId(list.map((x) => x.id));
  const src = opt.from ? list.find((x) => x.id === opt.from) : null;
  const boq = Object.assign({}, src ? src.boq : {}, { ver: id, plan3d: String(opt.plan3d || "1") });
  delete boq.savedAt;
  ps.push(db.ref("boqVers/" + jobId + "/" + id).set(Object.assign({ name: (opt.name || "").trim() || "เวอร์ชัน " + id, at: Date.now(), from: opt.from || "", boq }, dvUser(user))));
  return Promise.all(ps).then(() => ({ id, boq }));
}
const dvBoqRename = (jobId, ver, name) => window.FBDB.ref("boqVers/" + jobId + "/" + ver + "/name").set((name || "").trim() || "เวอร์ชัน " + ver);
const dvBoqDelete = (jobId, ver) => window.FBDB.ref("boqVers/" + jobId + "/" + ver).remove();
/* ลบ BOQ ใบไหนก็ได้ (ไม่ต้องเลือกใบที่ใช้งานก่อน) — ลบใบที่ใช้งานอยู่ = ใบใหม่สุดที่เหลือขึ้นมาแทน · ใบสุดท้ายลบไม่ได้ */
function dvBoqRemove(jobId, vers, id, patchActive) {
  const rest = (vers.list || []).filter((x) => x.id !== id);
  if (!rest.length) return Promise.resolve();
  return dvBoqDelete(jobId, id).then(() => {
    if (id !== vers.active || !patchActive) return;
    const nx = rest.slice().sort((a, b) => +b.id - +a.id)[0];
    patchActive(Object.assign({}, nx.boq, { ver: nx.id }));
  });
}

/* ── หน้าตาโมดัล — ชุดเดียวกับโมดัลอื่นในระบบ (แผ่น --surface · เงา · ช่องกรอกหลุม inset) ── */
const DV_CSS = `
.dv-bd{position:fixed;inset:0;background:rgba(8,20,14,.45);backdrop-filter:blur(3px);z-index:125;display:grid;place-items:center;padding:20px}
.dv-card{background:var(--bg);border-radius:18px;width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.dv-hd{padding:16px 20px;background:var(--surface);box-shadow:var(--shadow-sm);flex-shrink:0;display:flex;align-items:center;gap:10px}
.dv-hd .k{font-size:10.5px;font-weight:800;color:var(--text-3)}
.dv-hd .t{font-size:14.5px;font-weight:700;color:var(--text-1);margin-top:2px}
.dv-list{padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:9px}
.dv-row{background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:11px 13px;display:flex;align-items:center;gap:11px}
.dv-row[data-on="1"]{box-shadow:var(--shadow-sm),inset 3px 0 0 var(--primary)}
.dv-row .no{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0;background:var(--surface2);color:var(--text-2)}
.dv-row[data-on="1"] .no{background:var(--primary-soft);color:var(--primary-dark)}
.dv-row .nm{font-size:13.5px;font-weight:700;color:var(--text-1);display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.dv-row .mt{font-size:11.5px;color:var(--text-3);margin-top:2px;line-height:1.45}
.dv-tag{font-size:10px;font-weight:800;padding:2px 7px;border-radius:var(--r-pill);background:var(--primary-soft);color:var(--primary-dark)}
.dv-tag.ind{background:color-mix(in srgb,#4F46E5 12%,transparent);color:#4F46E5}
.dv-ic{width:30px;height:30px;border-radius:9px;border:none;background:transparent;color:var(--text-3);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.dv-ic:hover{background:var(--surface2);color:var(--text-1)}
.dv-ic:disabled{opacity:.35;cursor:default;background:transparent}
.dv-new{margin:0 14px 14px;background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:12px 13px;display:flex;flex-direction:column;gap:9px}
.dv-new .lb{font-size:10.5px;font-weight:800;color:var(--text-3)}
.dv-f{display:grid;grid-template-columns:110px 1fr;align-items:center;gap:9px}
.dv-f > span{font-size:12px;font-weight:700;color:var(--text-2)}
.dv-in{width:100%;box-sizing:border-box;background:var(--surface2);box-shadow:var(--shadow-inset);border:none;border-radius:var(--r-chip);padding:9px 11px;font-family:inherit;font-size:13px;color:var(--text-1)}
.dv-ft{padding:12px 16px;background:var(--surface);box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:10px;flex-shrink:0}
.dv-err{font-size:11.5px;font-weight:700;color:var(--tint-red-tx)}
@media (max-width:860px){.dv-bd{place-items:end center;padding:0}.dv-card{border-radius:20px 20px 0 0;width:100%;max-height:92dvh}.dv-f{grid-template-columns:1fr}}
`;

function DvShell({ k, t, onClose, children, foot }) {
  const bd = window.useBackdropClose ? window.useBackdropClose(onClose) : { onClick: onClose };
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="dv-bd" {...bd}>
      <style>{DV_CSS}</style>
      <div className="dv-card" onClick={(e) => e.stopPropagation()}>
        <div className="dv-hd">
          <div style={{ flex: 1, minWidth: 0 }}><div className="k">{k}</div><div className="t">{t}</div></div>
          <button className="dv-ic" onClick={onClose} title="ปิด"><Icon name="x" size={16} /></button>
        </div>
        {children}
        {foot && <div className="dv-ft">{foot}</div>}
      </div>
    </div>
  );
}

/* ชื่อแก้ในแถว — แตะดินสอแล้วพิมพ์ Enter/ออกจากช่อง = บันทึก · Esc = ยกเลิก */
function DvName({ value, onSave, ro }) {
  const [ed, setEd] = React.useState(null);
  if (ed == null) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {value}
      {!ro && <button className="dv-ic" style={{ width: 24, height: 24 }} title="เปลี่ยนชื่อ" onClick={(e) => { e.stopPropagation(); setEd(value || ""); }}><Icon name="pen" size={12} /></button>}
    </span>
  );
  const done = (ok) => { if (ok && ed.trim() && ed.trim() !== value) onSave(ed.trim()); setEd(null); };
  return <input className="dv-in" autoFocus value={ed} style={{ padding: "5px 9px", maxWidth: 220 }} onClick={(e) => e.stopPropagation()}
    onChange={(e) => setEd(e.target.value)} onBlur={() => done(true)}
    onKeyDown={(e) => { if (e.key === "Enter") done(true); else if (e.key === "Escape") { e.stopPropagation(); done(false); } }} />;
}

/* ── เลือก/สร้างเวอร์ชันแบบ 3D ──
   boqLinks = { "<ver แบบ 3D>": ["ชื่อ BOQ", …] } — บอกว่า BOQ ไหนใช้แบบนี้อยู่ (ลบไม่ได้ถ้ามี) */
function P3VerModal({ job, currentUser, boqLinks, onOpen, onClose, ro, mode }) {
  const only = mode === "new";
  const jobId = job && job.id;
  const { list, loading } = useP3Vers(jobId);
  const [from, setFrom] = React.useState("1");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const create = () => {
    setBusy(true); setErr("");
    dvP3Create(jobId, from, list, currentUser, name)
      .then((id) => { setBusy(false); onOpen(id); })
      .catch((e) => { setBusy(false); setErr("สร้างไม่สำเร็จ — " + (e && e.message ? e.message : "ลองใหม่อีกครั้ง")); });
  };
  const del = (v) => {
    /* askConfirm แทน confirm() — คนที่เคยกดปิดกล่องของเบราว์เซอร์ confirm() คืน false เงียบ ๆ ปุ่มลบจึงกดไม่ติด */
    window.askConfirm({ title: "ลบแบบ 3D \"" + v.name + "\"?", body: "กู้คืนไม่ได้ — เวอร์ชันอื่นไม่ถูกแตะ", ok: "ลบแบบนี้", danger: true, icon: "trash" })
      .then((ok) => { if (ok) dvP3Delete(jobId, v.id).catch(() => setErr("ลบไม่สำเร็จ")); });
  };
  return (
    <DvShell k={"วางแผง 3D" + (job && job.code ? " · " + job.code : "")} t={only ? "ทำแบบ 3D ใหม่" : "จัดการเวอร์ชันแบบ"} onClose={onClose}>
      {!only && <div className="dv-list">
        {list.map((v) => {
          const links = (boqLinks || {})[v.id] || [];
          const s = v.sum;
          return (
            <div key={v.id} className="dv-row" data-on={v.id === "1" ? "1" : "0"} style={{ cursor: "pointer" }} onClick={() => onOpen(v.id)}>
              <span className="no">{v.id === "1" ? "V1" : "V" + v.id}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">
                  <DvName value={v.name} ro={ro} onSave={(n) => dvP3Rename(jobId, v.id, n)} />
                  {v.id === "1" && <span className="dv-tag">ต้นแบบ</span>}
                  {links.map((n) => <span key={n} className="dv-tag ind">BOQ · {n}</span>)}
                </div>
                <div className="mt">
                  {s ? (s.panels ? s.panels.toLocaleString() + " แผง · " + s.kwp + " kWp" : "ยังไม่มีแผง") : v.id === "1" ? "แบบเดิมของงานนี้" : ""}
                  {s && s.at ? " · บันทึก " + dvWhen(s.at) : ""}
                  {v.id !== "1" && v.from ? " · คัดลอกจาก " + dvP3Name(list, v.from) : ""}
                </div>
              </div>
              {!ro && v.id !== "1" && (
                <button className="dv-ic" title={links.length ? "มี BOQ ใช้แบบนี้อยู่ — ย้าย BOQ ไปแบบอื่นก่อนจึงลบได้" : "ลบเวอร์ชันนี้"} disabled={links.length > 0}
                  onClick={(e) => { e.stopPropagation(); del(v); }}><Icon name="trash" size={14} /></button>
              )}
              <Icon name="arrowRight" size={16} color="var(--text-3)" />
            </div>
          );
        })}
      </div>}
      {!ro && !loading && (
        <div className="dv-new" style={only ? { marginTop: 14 } : null}>
          {!only && <div className="lb">สร้างเวอร์ชันใหม่</div>}
          <label className="dv-f"><span>คัดลอกจาก</span>
            <Dropdown value={from} onChange={(v) => setFrom(v)} options={list.map((v) => ({ value: v.id, label: (v.id === "1" ? "V1 · " : "V" + v.id + " · ") + v.name }))} />
          </label>
          <label className="dv-f"><span>ชื่อ</span>
            <input className="dv-in" value={name} placeholder={"เวอร์ชัน " + dvNextId(list.map((x) => x.id))} onChange={(e) => setName(e.target.value)} />
          </label>
          {err && <div className="dv-err">{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-pri" disabled={busy} onClick={create}><Icon name="plus" size={14} color="#fff" /> {busy ? "กำลังคัดลอก…" : "สร้างแล้วเปิด"}</button>
          </div>
        </div>
      )}
    </DvShell>
  );
}

/* ── เลือก/สร้างเวอร์ชัน BOQ ──
   patchActive(boq) = เขียน job.boq/lead.boq ของผู้เรียก (ใบที่ใช้งาน — ใบเสนอราคาดึงจากใบนี้) */
function BoqVerModal({ job, activeBoq, currentUser, patchActive, onOpen, onClose, ro, mode }) {
  const only = mode === "new";
  const jobId = job && job.id;
  const vers = useBoqVers(jobId, activeBoq);
  const p3 = useP3Vers(jobId);
  const [from, setFrom] = React.useState("");
  const [plan, setPlan] = React.useState(null);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const fromDef = from || vers.active;
  /* แบบ 3D ค่าเริ่ม = แบบใหม่สุดที่ยังไม่มี BOQ ใบไหนผูก (ทำแบบ 2 แล้วมาถอด BOQ 2 ได้คู่กันเลย) · ผูกครบแล้ว = ตามใบที่คัดลอก */
  const linked = vers.list.map((x) => String((x.boq || {}).plan3d || "1"));
  const free = p3.list.filter((v) => linked.indexOf(v.id) < 0);
  const planDef = plan != null ? plan : free.length ? free[free.length - 1].id : String(((vers.list.find((x) => x.id === fromDef) || {}).boq || {}).plan3d || "1");
  const create = () => {
    setBusy(true); setErr("");
    dvBoqCreate(jobId, vers, { from: fromDef === "blank" ? "" : fromDef, plan3d: planDef, name }, currentUser)
      .then((r) => { setBusy(false); onOpen(r.id, r.boq, Object.assign({}, vers, { real: true })); })
      .catch((e) => { setBusy(false); setErr("สร้างไม่สำเร็จ — " + (e && e.message ? e.message : "ลองใหม่อีกครั้ง")); });
  };
  const del = (v) => {
    /* askConfirm แทน confirm() — คนที่เคยกดปิดกล่องของเบราว์เซอร์ confirm() คืน false เงียบ ๆ ปุ่มลบจึงกดไม่ติด */
    window.askConfirm({ title: "ลบ BOQ \"" + v.name + "\"?", body: "กู้คืนไม่ได้ — เวอร์ชันอื่นไม่ถูกแตะ", ok: "ลบ BOQ", danger: true, icon: "trash" })
      .then((ok) => { if (ok) dvBoqRemove(jobId, vers, v.id, patchActive).catch(() => setErr("ลบไม่สำเร็จ")); });
  };
  const sell = (b) => (b && b.pricing && +b.pricing.sell > 0 ? "ราคาขาย ฿" + Math.round(+b.pricing.sell).toLocaleString() : "");
  return (
    <DvShell k={"ถอดวัสดุ BOQ" + (job && job.code ? " · " + job.code : "")} t={only ? "ทำ BOQ ใบใหม่" : "จัดการเวอร์ชัน BOQ"} onClose={onClose}>
      {!only && <div className="dv-list">
        {vers.list.length === 0 && <div style={{ padding: 14, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มี BOQ — สร้างใบแรกด้านล่าง</div>}
        {vers.list.map((v) => {
          const on = v.id === vers.active;
          const b = v.boq || {};
          return (
            <div key={v.id} className="dv-row" style={{ cursor: "pointer" }} onClick={() => onOpen(v.id, b, vers)}>
              <span className="no">V{v.id}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">
                  {vers.real ? <DvName value={v.name} ro={ro} onSave={(n) => dvBoqRename(jobId, v.id, n)} /> : v.name}
                </div>
                <div className="mt">
                  แบบ 3D: <b style={{ color: "#4F46E5" }}>{dvP3Name(p3.list, b.plan3d)}</b>
                  {+b.panels > 0 ? " · " + b.panels + " แผง" : ""}
                  {sell(b) ? " · " + sell(b) : ""}
                  {v.at ? " · " + dvWhen(v.at) : ""}
                </div>
              </div>
              {!ro && vers.real && vers.list.length > 1 && (
                <button className="dv-ic" title="ลบเวอร์ชันนี้" onClick={(e) => { e.stopPropagation(); del(v); }}><Icon name="trash" size={14} /></button>
              )}
              <Icon name="arrowRight" size={16} color="var(--text-3)" />
            </div>
          );
        })}
      </div>}
      {!ro && !vers.loading && (
        <div className="dv-new" style={only ? { marginTop: 14 } : null}>
          {!only && <div className="lb">{vers.list.length ? "สร้าง BOQ เวอร์ชันใหม่" : "สร้าง BOQ"}</div>}
          {vers.list.length > 0 && (
            <label className="dv-f"><span>เริ่มจาก</span>
              <Dropdown value={fromDef} onChange={(v) => { setFrom(v); setPlan(null); }}
                options={vers.list.map((v) => ({ value: v.id, label: "คัดลอก V" + v.id + " · " + v.name })).concat([{ value: "blank", label: "ใบเปล่า (ถอดใหม่หมด)" }])} />
            </label>
          )}
          <label className="dv-f"><span>ใช้แบบ 3D</span>
            <Dropdown value={planDef} onChange={(v) => setPlan(v)} options={p3.list.map((v) => ({ value: v.id, label: "V" + v.id + " · " + v.name + (v.sum && v.sum.panels ? " (" + v.sum.panels + " แผง)" : "") }))} />
          </label>
          <label className="dv-f"><span>ชื่อ</span>
            <input className="dv-in" value={name} placeholder={"เวอร์ชัน " + dvNextId(vers.list.map((x) => x.id))} onChange={(e) => setName(e.target.value)} />
          </label>
          {err && <div className="dv-err">{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-pri" disabled={busy} onClick={create}><Icon name="plus" size={14} color="#fff" /> {busy ? "กำลังสร้าง…" : "สร้างแล้วเปิด"}</button>
          </div>
        </div>
      )}
    </DvShell>
  );
}

/* ชุดเปิดเวอร์ชันสำหรับหน้าใบงาน/ใบลูกค้า — ทั้งสองที่ใช้ร่วมกัน
   คืน { boqSub, p3Sub, openBoq(), openP3(), ui } — ui คือโมดัล+ตัวแก้ ที่ต้องวางไว้ในหน้า */
function useDesignVersions({ job, activeBoq, currentUser, patchActive, BoqEditor, editorProps, P3Entry, onP3Open, ro }) {
  const jobId = job && job.id;
  const p3 = useP3Vers(jobId);
  const vers = useBoqVers(jobId, activeBoq);
  const [pick, setPick] = React.useState(null);        // "boq" | "p3" | "boq-new" | "p3-new" | null
  const [ed, setEd] = React.useState(null);            // { ver, boq, vers } BOQ ที่เปิดแก้อยู่
  const [p3Ver, setP3Ver] = React.useState(null);      // เวอร์ชันแบบ 3D ที่เปิดอยู่
  React.useEffect(() => { setPick(null); setEd(null); setP3Ver(null); }, [jobId]);
  /* BOQ ไหนผูกแบบไหน — ไว้ติดป้ายในรายการแบบ และกันลบแบบที่ยังมีคนใช้ */
  const boqLinks = React.useMemo(() => {
    const o = {};
    vers.list.forEach((v) => { const k = String((v.boq || {}).plan3d || "1"); (o[k] = o[k] || []).push(v.name); });
    return o;
  }, [vers.list]);
  /* มีเวอร์ชันเดียว = เปิดตรงเหมือนเดิม ไม่ต้องผ่านหน้ารายการ (ปุ่ม "เวอร์ชัน" ข้างแถวยังเข้ารายการได้) */
  const openBoq = (force) => {
    if (!force && vers.list.length <= 1) setEd({ ver: (vers.list[0] || {}).id || "1", boq: activeBoq, vers });
    else setPick("boq");
  };
  const openP3 = (force) => {
    if (!force && p3.list.length <= 1) { if (onP3Open) onP3Open("1"); else setP3Ver("1"); }
    else setPick("p3");
  };
  const actName = (vers.list.find((x) => x.id === vers.active) || {}).name;
  const boqSub = vers.list.length > 1 ? vers.list.length + " เวอร์ชัน · ใช้งาน: " + actName + " · แบบ 3D " + dvP3Name(p3.list, (activeBoq || {}).plan3d) : null;
  const p3Sub = p3.list.length > 1 ? p3.list.length + " เวอร์ชัน · " + p3.list.map((v) => v.name).join(" · ") : null;
  const edJob = ed ? Object.assign({}, job, { boq: ed.boq || null }) : null;
  /* ใบที่เพิ่งสร้างยังไม่อยู่ใน ed.vers (ถ่ายไว้ก่อนสร้าง) — ใช้รายการสดเมื่อมีใบนั้นแล้ว */
  const edVers = ed ? (vers.list.some((x) => x.id === ed.ver) ? vers : ed.vers) : null;
  const ui = (
    <React.Fragment>
      {(pick === "p3" || pick === "p3-new") && <P3VerModal mode={pick === "p3-new" ? "new" : null} job={job} currentUser={currentUser} boqLinks={boqLinks} ro={ro} onClose={() => setPick(null)}
        onOpen={(v) => { setPick(null); if (onP3Open) onP3Open(v); else setP3Ver(v); }} />}
      {(pick === "boq" || pick === "boq-new") && <BoqVerModal mode={pick === "boq-new" ? "new" : null} job={job} activeBoq={activeBoq} currentUser={currentUser} patchActive={patchActive} ro={ro} onClose={() => setPick(null)}
        onOpen={(v, b, vs) => { setPick(null); setEd({ ver: v, boq: b, vers: vs }); }} />}
      {ed && BoqEditor && (
        <BoqEditor {...editorProps} job={edJob} ver={ed.ver} verName={ed.quickNew ? "ใบใหม่ (BOQ ด่วน)" : (edVers.list.find((x) => x.id === ed.ver) || {}).name || "เวอร์ชัน " + ed.ver}
          p3Vers={p3.list} onClose={() => setEd(null)}
          quick={!!ed.quick} quickNew={!!ed.quickNew} fresh={!!ed.quickNew || !vers.list.length}
          onSave={ro || !patchActive ? null : (b) => {
            /* BOQ ด่วนบนงานที่มีใบอยู่แล้ว = สร้างเวอร์ชันใหม่ตอนกดบันทึก (ปิดป๊อปทิ้ง = ไม่มีอะไรถูกเขียน)
               และเป็นใบที่ใช้งานเลย (ผู้ใช้ไม่ต้องเลือกว่าใบเสนอราคาดึงใบไหน) */
            if (ed.quickNew) {
              dvBoqCreate(jobId, ed.vers, { from: "", plan3d: (b && b.plan3d) || "1", name: "BOQ ด่วน" }, currentUser)
                .then((r) => dvBoqSave(jobId, r.id, b, { real: true, active: r.id }, patchActive))
                .catch(() => window.alert("บันทึก BOQ ด่วนไม่สำเร็จ ลองใหม่อีกครั้ง"));
            } else dvBoqSave(jobId, ed.ver, b, edVers, patchActive);
            setEd(null);
          }} />
      )}
      {p3Ver && P3Entry && <P3Entry job={job} ver={p3Ver} verName={dvP3Name(p3.list, p3Ver)} currentUser={currentUser} onClose={() => setP3Ver(null)} />}
    </React.Fragment>
  );
  /* สำหรับการ์ดรายการ (DvVerCard) — เปิดเวอร์ชันตรง ๆ / ทำใหม่ / จัดการ */
  const openP3Ver = (v) => { if (onP3Open) onP3Open(v); else setP3Ver(v); };
  const openBoqVer = (id) => { const v = vers.list.find((x) => x.id === id); setEd({ ver: id, boq: v ? v.boq : null, vers }); };
  const newP3 = () => setPick("p3-new");
  const removeBoq = (id) => dvBoqRemove(jobId, vers, id, patchActive);
  /* ยังไม่มี BOQ เลย = เปิดใบแรกตรง ๆ (ยังไม่ต้องมีเวอร์ชัน) */
  const newBoq = () => { if (!vers.list.length) setEd({ ver: "1", boq: null, vers }); else setPick("boq-new"); };
  /* BOQ ด่วน — ป๊อปเดียวไว้ตีราคาเสนอ · แบบ 3D = แบบใหม่สุดที่ยังไม่มี BOQ ผูก (ไม่มีก็ต้นแบบ) */
  const quickBoq = !job || job.type !== "home" ? null : () => {   // งานบ้านเท่านั้น · งานโครงการถอดแบบละเอียดตามเดิม
    const linked = vers.list.map((x) => String((x.boq || {}).plan3d || "1"));
    const free = p3.list.filter((v) => linked.indexOf(v.id) < 0);
    const plan = free.length ? free[free.length - 1].id : "1";
    const seed = plan !== "1" && window.BOQ ? Object.assign(window.BOQ.blankBOQ(job), { plan3d: plan }) : null;   // ใบเต็มจาก blankBOQ — mergeBOQ เห็นใบที่มีแค่ plan3d เป็นใบเก่า (conduitRule = null)
    if (!vers.list.length) setEd({ ver: "1", boq: seed, vers, quick: true });
    else setEd({ ver: "new", boq: seed, vers, quick: true, quickNew: true });
  };
  return { boqSub, p3Sub, openBoq, openP3, ui, nBoq: vers.list.length, nP3: p3.list.length,
    jobId, p3List: p3.list, boqVers: vers, boqLinks, openP3Ver, openBoqVer, newP3, newBoq, quickBoq, removeBoq,
    manageP3: () => setPick("p3"), manageBoq: () => setPick("boq") };
}

Object.assign(window, { dvP3Key, dvP3Split, dvP3Saved, dvP3Name, useP3Vers, useBoqVers, dvBoqSave, P3VerModal, BoqVerModal, useDesignVersions });

/* ปุ่มเล็ก "เวอร์ชัน" วางทับมุมขวาของแถวเครื่องมือ (.act-row) — เป็นปุ่มพี่น้อง ไม่ซ้อนในปุ่มแถว
   n ≤ 1 = "+ เวอร์ชัน" (สร้างเวอร์ชันที่สองได้จากตรงนี้) · มากกว่านั้น = จำนวนเวอร์ชัน */
function DvRowWrap({ n, onVers, children }) {
  return (
    <div style={{ position: "relative" }}>
      {onVers && React.isValidElement(children) ? React.cloneElement(children, { style: Object.assign({}, children.props.style, { paddingRight: 150 }) }) : children}
      {onVers && (
        <button type="button" className="btn btn-sm" onClick={onVers} title="เวอร์ชันทั้งหมด · สร้างเวอร์ชันใหม่"
          style={{ position: "absolute", right: 42, top: "50%", transform: "translateY(calc(-50% - 4.5px))", padding: "5px 10px", fontSize: 11.5 }}>
          <Icon name="history" size={13} /> {n > 1 ? n + " เวอร์ชัน" : "+ เวอร์ชัน"}
        </button>
      )}
    </div>
  );
}
Object.assign(window, { DvRowWrap });

/* ── การ์ดรายการเวอร์ชัน — หน้าตาแบบรายการใบเสนอราคา (SalesQuoteList) ──
   หัวการ์ด + ปุ่ม "ทำใหม่" · แถวละเวอร์ชัน แตะ = เปิดเวอร์ชันนั้นตรง ๆ · ตัวบน (ต้นแบบ / ใบที่ใช้งาน) พื้นเข้ม
   kind "p3" = แบบ 3D · "boq" = BOQ · dvs = ผลของ useDesignVersions */
const DVC_CSS = `
.dvc{background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:14px 16px;margin-bottom:10px}
.dvc-hd{display:flex;align-items:center;gap:9px}
.dvc-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.dvc-t{display:block;font-size:13.5px;font-weight:700;color:var(--text-1)}
.dvc-s{display:block;font-size:11px;color:var(--text-3);margin-top:1px}
.dvc-btn{display:inline-flex;align-items:center;gap:4px;background:var(--surface2);box-shadow:var(--shadow-sm);border:none;border-radius:var(--r-chip);padding:5px 10px;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:700;color:var(--primary-dark);white-space:nowrap}
.dvc-btn.ghost{background:transparent;box-shadow:none;color:var(--text-3)}
.dvc-btn.ghost:hover{color:var(--text-1);background:var(--surface2)}
.dvc-list{margin-top:9px;display:flex;flex-direction:column;gap:6px}
.dvc-row{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);box-shadow:var(--shadow-sm);border:none;border-radius:var(--r-tile);cursor:pointer;font-family:inherit;text-align:left}
.dvc-row[data-on="1"]{background:var(--surface2)}
.dvc-row:hover{box-shadow:var(--shadow-card)}
.dvc-row:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.dvc-del{width:28px;height:28px;border-radius:8px;border:none;background:transparent;color:var(--text-3);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.dvc-del:hover{background:var(--tint-red-bg,#FDECEC);color:var(--tint-red-tx,#C0392B)}
.dvc-del:disabled{opacity:.3;cursor:default;background:transparent;color:var(--text-3)}
.dvc-no{font-size:10.5px;font-weight:800;color:var(--text-2);background:var(--surface2);padding:2px 7px;border-radius:var(--r-pill);font-family:var(--mono)}
.dvc-row[data-on="1"] .dvc-no{background:var(--primary-soft);color:var(--primary-dark)}
.dvc-nm{font-size:12.5px;font-weight:700;color:var(--text-1)}
.dvc-tag{font-size:10px;font-weight:800;color:var(--primary-dark);background:var(--primary-soft);padding:1px 7px;border-radius:var(--r-pill)}
.dvc-mt{display:block;font-size:11px;color:var(--text-3);margin-top:1px}
.dvc-v{font-size:13px;font-weight:800;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.dvc-pill{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:var(--r-pill);white-space:nowrap}
.dvc-empty{font-size:12.5px;color:var(--text-3);margin-top:8px}
@media (max-width:560px){.dvc-pill{display:none}}
`;
function DvVerCard({ kind, dvs, title, sub, icon, color, canNew }) {
  const isP3 = kind === "p3";
  const p3List = dvs.p3List || [];
  const vers = dvs.boqVers || { list: [] };
  const list = isP3 ? p3List : vers.list;
  const nfmt = (n) => (+n || 0).toLocaleString();
  const many = list.length > 1;
  const rows = list.map((v) => {
    if (isP3) {
      const s = v.sum, links = (dvs.boqLinks || {})[v.id] || [];
      return { id: v.id, on: v.id === "1", name: v.name, tag: v.id === "1" ? "ต้นแบบ" : null,
        meta: [v.id === "1" ? "แบบแรกของงานนี้" : v.from ? "คัดลอกจาก " + dvP3Name(p3List, v.from) : "",
          s && s.at ? "บันทึก " + dvWhen(s.at) : v.at ? "สร้าง " + dvWhen(v.at) : "", v.byName || ""].filter(Boolean).join(" · "),
        val: s && s.panels ? nfmt(s.panels) + " แผง · " + s.kwp + " kWp" : s ? "ยังไม่มีแผง" : "",
        pill: links.length ? { th: "BOQ · " + links.join(", "), c: "#4F46E5" } : null,
        /* ลบได้ทุกแบบยกเว้นต้นแบบ · มี BOQ ผูกอยู่ = ปุ่มจาง (ย้าย BOQ ไปแบบอื่นก่อน) */
        del: v.id === "1" ? null : links.length ? { off: "มี BOQ ใช้แบบนี้อยู่ (" + links.join(", ") + ") — เปลี่ยนแบบ 3D ใน BOQ นั้นก่อนจึงลบได้" } : {} };
    }
    const b = v.boq || {}, on = v.id === vers.active;
    const sell = b.pricing && +b.pricing.sell > 0 ? +b.pricing.sell : 0;
    return { id: v.id, on, name: v.name, tag: null,
      meta: ["แบบ 3D: " + dvP3Name(p3List, b.plan3d), +b.panels > 0 ? nfmt(b.panels) + " แผง" : "", v.at ? dvWhen(v.at) : "", v.byName || ""].filter(Boolean).join(" · "),
      val: sell ? "฿" + nfmt(Math.round(sell)) : "",
      pill: null,
      /* ลบได้ทุกใบเมื่อมี > 1 ใบ (ใบที่ใช้งานโดนลบ = ใบใหม่สุดที่เหลือแทน · removeBoq) */
      del: !vers.real || !many ? null : {} };
  });
  /* ตัวบนสุด = ต้นแบบ / ใบที่ใช้งาน · ที่เหลือใหม่สุดก่อน (แบบเดียวกับรายการใบเสนอราคา) */
  const ordered = isP3 ? rows.filter((r) => r.on).concat(rows.filter((r) => !r.on).sort((a, b) => +b.id - +a.id)) : rows.slice().sort((a, b) => +b.id - +a.id);
  const open = (id) => (isP3 ? dvs.openP3Ver(id) : dvs.openBoqVer(id));
  const jobId = dvs.jobId;
  const remove = (r) => {
    /* askConfirm แทน confirm() — คนที่เคยกดปิดกล่องของเบราว์เซอร์ confirm() คืน false เงียบ ๆ ปุ่มลบจึงกดไม่ติด */
    window.askConfirm({ title: "ลบ " + (isP3 ? "แบบ 3D" : "BOQ") + " V" + r.id + " · " + r.name + "?", body: "กู้คืนไม่ได้ — เวอร์ชันอื่นไม่ถูกแตะ", ok: "ลบ", danger: true, icon: "trash" })
      .then((ok) => { if (ok) (isP3 ? dvP3Delete(jobId, r.id) : dvs.removeBoq(r.id)).catch(() => window.alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง")); });
  };
  return (
    <div className="dvc">
      <style>{DVC_CSS}</style>
      <div className="dvc-hd">
        <span className="dvc-ic" style={{ background: "color-mix(in srgb," + color + " 13%,transparent)" }}><Icon name={icon} size={16} color={color} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="dvc-t">{title}</span>
          {sub && <span className="dvc-s">{sub}</span>}
        </span>
        {canNew && many && <button className="dvc-btn ghost" onClick={isP3 ? dvs.manageP3 : dvs.manageBoq} title="เปลี่ยนชื่อ · ลบ">จัดการ</button>}
        {canNew && !isP3 && dvs.quickBoq && (
          <button className="dvc-btn" onClick={dvs.quickBoq} title="ป๊อปเดียว: ขนาด · แผง · อินเวอร์เตอร์ · หลังคา · ค่าแรง ฿/W · กำไร % → ได้ราคาขายทันที">
            <Icon name="bolt" size={13} color="var(--primary-dark)" /> BOQ ด่วน
          </button>
        )}
        {canNew && (
          <button className="dvc-btn" onClick={isP3 ? dvs.newP3 : dvs.newBoq}>
            <Icon name="plus" size={13} color="var(--primary-dark)" /> {isP3 ? "ทำแบบใหม่" : list.length ? "ทำใบใหม่" : "ถอด BOQ"}
          </button>
        )}
      </div>
      {!ordered.length ? (
        <div className="dvc-empty">ยังไม่มี BOQ ของงานนี้</div>
      ) : (
        <div className="dvc-list">
          {ordered.map((r) => (
            <div key={r.id} className="dvc-row" role="button" tabIndex={0} data-on={r.on && many && isP3 ? "1" : "0"} onClick={() => open(r.id)}
              onKeyDown={(e) => { if (e.key === "Enter") open(r.id); }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span className="dvc-no">V{r.id}</span>
                  <span className="dvc-nm">{r.name}</span>
                  {many && r.tag && <span className="dvc-tag">{r.tag}</span>}
                </span>
                {r.meta && <span className="dvc-mt">{r.meta}</span>}
              </span>
              {r.val && <span className="dvc-v">{r.val}</span>}
              {many && r.pill && <span className="dvc-pill" style={{ color: r.pill.c, background: "color-mix(in srgb," + r.pill.c + " 11%,transparent)" }}>{r.pill.th}</span>}
              {canNew && r.del && (
                <button className="dvc-del" disabled={!!r.del.off} title={r.del.off || "ลบเวอร์ชันนี้"}
                  onClick={(e) => { e.stopPropagation(); remove(r); }}><Icon name="trash" size={14} /></button>
              )}
              <Icon name="arrowRight" size={15} color="var(--text-3)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
Object.assign(window, { DvVerCard });
