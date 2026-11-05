/* ============================================================
   flash+solar — ใบแจ้งหนี้ / ใบกำกับภาษี (ทำเอง ไม่ผูกงวดงาน)

   ผู้ใช้ 2026-11-05 ส่งตัวอย่าง IVT-20261100002.pdf "อยากมีฟังค์ชั่นออกใบแจ้งหนี้ หน้าตาแบบนี้"
   ตอบคำถาม: ทำใช้เอง ออกได้ทั้งในนามบริษัทและบุคคลธรรมดา · หัว "ใบแจ้งหนี้/ใบกำกับภาษี"
   · บัญชีธนาคารกรอกในหน้าตั้งค่า · หัก ณ ที่จ่ายเลือกได้ต่อใบ

   ข้อมูล (RTDB)
     invoiceCfg            { issuers: [ผู้ออกเอกสาร] }  — ผู้ออกแต่ละราย: บริษัท/บุคคล · ที่อยู่ · เลขผู้เสียภาษี · บัญชีธนาคาร · คำนำหน้าเลขที่
     invoices/<id>         ใบละก้อน · เก็บสำเนาผู้ออก (from) ตอนบันทึก — แก้หน้าตั้งค่าทีหลัง ใบที่ออกไปแล้วไม่เปลี่ยนตาม
     invoiceSeq/<pre><ปปปปดด>  ตัวนับเลขที่รายเดือน · จองด้วย transaction (สองเครื่องออกพร้อมกันได้เลขไม่ซ้ำ)
   เลขที่ = คำนำหน้า-ปปปปดด + ลำดับ 5 หลัก เช่น IVT-20261100002 (แบบตัวอย่างผู้ใช้) · ออกเลขตอนกด "ออกใบ" ครั้งแรก ร่างยังไม่มีเลข
   ไม่จด VAT (บุคคลธรรมดาทั่วไป) = หัวกระดาษเป็น "ใบแจ้งหนี้" อย่างเดียว ไม่คิด VAT — ออกใบกำกับภาษีได้เฉพาะผู้จด VAT
   ราคาในรายการเป็นราคาก่อนภาษี (คอลัมน์ "มูลค่าก่อนภาษี" ตามตัวอย่าง) · หัก ณ ที่จ่ายคิดจากมูลค่าก่อนภาษี

   ชื่อระดับบนสุดขึ้นต้นด้วย iv/Iv กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const IV_ROOT = () => (window.DR_ROOT || "");
const _ivRef = (p) => window.FBDB.ref(IV_ROOT() + p);
const ivR2 = (v) => Math.round((+v || 0) * 100) / 100;
const ivMoney = (n) => (+n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ivToday = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ivDay = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? m[3] + "/" + m[2] + "/" + m[1] : ""; };
const IV_WHT = [0, 1, 2, 3, 5];
const IV_UNITS = ["งาน", "ระบบ", "ชุด", "ตัว", "แผง", "เครื่อง", "วัน", "เดือน", "ครั้ง", "เมตร"];
const IV_STATUS = { draft: { th: "ร่าง", color: "#94A3B8" }, issued: { th: "ออกแล้ว", color: "#3B82F6" }, paid: { th: "รับเงินแล้ว", color: "#10B981" }, void: { th: "ยกเลิก", color: "#EF4444" } };

/* ผู้ออกเอกสารตั้งต้น = บริษัทจาก BRANDING (ยังไม่เคยตั้งค่า) */
function ivCompanyIssuer() {
  const B = window.BRANDING || {};
  return { key: "company", kind: "company", name: B.legalTH || "", addr: B.addrTH || "", taxId: B.taxId || "", branch: "สำนักงานใหญ่",
    tel: B.tel || "", email: B.email || "", web: B.site || "", vat: true, prefix: "IVT", signer: "", logo: true, banks: [] };
}
const ivBlankIssuer = () => ({ key: "P" + Date.now().toString(36), kind: "person", name: "", addr: "", taxId: "", branch: "",
  tel: "", email: "", web: "", vat: false, prefix: "INV", signer: "", logo: false, banks: [] });
function ivIssuers(cfg) {
  const L = cfg && Array.isArray(cfg.issuers) ? cfg.issuers.filter(Boolean) : [];
  return L.length ? L.map((x) => Object.assign({ banks: [] }, x, { banks: Array.isArray(x.banks) ? x.banks.filter(Boolean) : [] })) : [ivCompanyIssuer()];
}

const ivBlankItem = () => ({ id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: "", d: "", qty: 1, unit: "งาน", price: 0 });
function ivBlank(issuer, user) {
  const today = ivToday();
  return { id: "IV" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), no: "", status: "draft",
    issuer: issuer.key, from: null, date: today, due: today, ref: "",
    cust: { name: "", addr: "", taxId: "", branch: "", contact: "", tel: "", email: "" },
    items: [ivBlankItem()], vat: !!issuer.vat, vatRate: (window.BOQ && window.BOQ.VAT_RATE) || 7, wht: 0, bank: 0, note: "",
    jobId: "", createdAt: new Date().toISOString(), by: (user || {}).name || "" };
}
const ivItems = (inv) => (Array.isArray((inv || {}).items) ? inv.items.filter(Boolean) : []);
function ivTotals(inv) {
  const sub = ivR2(ivItems(inv).reduce((t, it) => t + (+it.qty || 0) * (+it.price || 0), 0));
  const rate = inv && inv.vat ? +inv.vatRate || 7 : 0;
  const vat = ivR2(sub * rate / 100), total = ivR2(sub + vat), wht = ivR2(sub * (+(inv || {}).wht || 0) / 100);
  return { sub, rate, vat, total, wht, pay: ivR2(total - wht) };
}
const ivTitle = (inv) => (inv && inv.vat ? "ใบแจ้งหนี้/ใบกำกับภาษี" : "ใบแจ้งหนี้");
/* ผู้ออกของใบ: ใบที่ออกแล้วใช้สำเนาที่เก็บไว้ · ร่างใช้ค่าปัจจุบันจากหน้าตั้งค่า */
const ivFrom = (inv, issuers) => (inv && inv.from) || (issuers || []).find((x) => x.key === (inv || {}).issuer) || (issuers || [])[0] || ivCompanyIssuer();

/* จองเลขที่ — ตัวนับรายเดือนต่อคำนำหน้า */
function ivAllocNo(prefix, date) {
  const pre = String(prefix || "INV").trim().toUpperCase() || "INV";
  const ym = String(date || ivToday()).slice(0, 7).replace("-", "");
  return _ivRef("invoiceSeq/" + pre + ym).transaction((c) => (+c || 0) + 1).then((r) => {
    if (!r.committed) throw new Error("จองเลขที่ไม่สำเร็จ");
    return pre + "-" + ym + String(r.snapshot.val()).padStart(5, "0");
  });
}

function useInvoiceStore() {
  const [list, setList] = React.useState(null);
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    if (!window.FBDB) { setList([]); setCfg({}); return; }
    const a = _ivRef("invoices"), b = _ivRef("invoiceCfg");
    const ha = a.on("value", (s) => setList(Object.values(s.val() || {}).filter(Boolean)), () => setList([]));
    const hb = b.on("value", (s) => setCfg(s.val() || {}), () => setCfg({}));
    return () => { a.off("value", ha); b.off("value", hb); };
  }, []);
  const issuers = React.useMemo(() => ivIssuers(cfg), [cfg]);
  /* บันทึก · issue = ออกใบ (จองเลขที่ถ้ายังไม่มี + เก็บสำเนาผู้ออก) */
  const save = React.useCallback((inv, issue) => {
    const iss = issuers.find((x) => x.key === inv.issuer) || issuers[0];
    const rec = Object.assign({}, inv, { updatedAt: new Date().toISOString() });
    if (issue || rec.status !== "draft") rec.from = JSON.parse(JSON.stringify(iss));
    const go = issue && !rec.no ? ivAllocNo(iss.prefix, rec.date).then((no) => Object.assign(rec, { no, status: "issued" }))
      : Promise.resolve(issue && rec.status === "draft" ? Object.assign(rec, { status: "issued" }) : rec);
    return go.then((r) => _ivRef("invoices/" + r.id).set(r).then(() => r));
  }, [issuers]);
  const patch = React.useCallback((id, p) => _ivRef("invoices/" + id).update(p), []);
  const removeDraft = React.useCallback((id) => _ivRef("invoices/" + id).remove(), []);
  const saveCfg = React.useCallback((c) => _ivRef("invoiceCfg").set(c), []);
  return { list, cfg, issuers, save, patch, removeDraft, saveCfg, loading: list === null || cfg === null };
}

/* ── ชิ้นส่วนฟอร์ม ── */
const ivIn = () => Object.assign({}, window.EC_INPUT || { width: "100%", padding: "10px 12px" }, { boxShadow: "var(--shadow-inset)" });
function IvFld({ label, children, w }) {
  return (
    <label style={{ display: "block", minWidth: 0, flex: w ? "0 0 " + w : 1 }}>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, margin: "0 0 4px 2px" }}>{label}</div>
      {children}
    </label>
  );
}
function IvRow({ children }) { return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>{children}</div>; }
function IvCard({ title, right, children }) {
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: "14px 16px", marginBottom: 12 }}>
      {(title || right) && <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <div style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{title}</div>{right}</div>}
      {children}
    </div>
  );
}
const ivBtn = (primary) => ({ padding: "9px 14px", borderRadius: "var(--r-tile)", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
  cursor: "pointer", background: primary ? "var(--primary)" : "var(--surface2)", color: primary ? "#fff" : "var(--text-2)",
  boxShadow: primary ? "var(--shadow-btn)" : "var(--shadow-sm)" });

/* ── ตัวแก้ใบ ── */
function InvoiceEditor({ inv0, store, jobs, onClose, onPrint }) {
  const [f, setF] = React.useState(() => JSON.parse(JSON.stringify(inv0)));
  const [busy, setBusy] = React.useState(false);
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const setC = (k, v) => setF((p) => Object.assign({}, p, { cust: Object.assign({}, p.cust, { [k]: v }) }));
  const setIt = (i, k, v) => setF((p) => { const L = ivItems(p).slice(); L[i] = Object.assign({}, L[i], { [k]: v }); return Object.assign({}, p, { items: L }); });
  const iss = ivFrom(f.status === "draft" ? Object.assign({}, f, { from: null }) : f, store.issuers);
  const T = ivTotals(f);
  const locked = f.status === "void";
  const pickJob = (id) => {
    const j = (jobs || []).find((x) => x.id === id);
    if (!j) return;
    setF((p) => Object.assign({}, p, { jobId: id, ref: p.ref || j.code || "",
      cust: Object.assign({}, p.cust, { name: j.name || p.cust.name, addr: [j.address, j.province].filter(Boolean).join(" ") || p.cust.addr, tel: j.phone || p.cust.tel }) }));
  };
  const doSave = (issue) => {
    if (issue && !String(f.cust.name || "").trim()) { window.askConfirm && window.askConfirm({ title: "ยังไม่ได้กรอกชื่อลูกค้า", okText: "ตกลง" }); return; }
    setBusy(true);
    store.save(f, issue).then((r) => { setBusy(false); setF(r); if (issue) onPrint(r); })
      .catch((e) => { setBusy(false); window.askConfirm && window.askConfirm({ title: "บันทึกไม่สำเร็จ", body: String(e && e.message || e), okText: "ตกลง" }); });
  };
  const IN = ivIn();
  return ReactDOM.createPortal((
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,20,14,.45)", overflow: "auto", padding: "24px 12px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", background: "var(--bg)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-modal)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{ivTitle(f)}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{f.no || "ร่าง — ยังไม่มีเลขที่ (ออกเลขตอนกดออกใบ)"}</div>
          </div>
          <button style={ivBtn()} onClick={onClose}>ปิด</button>
          {!locked && <button style={ivBtn()} disabled={busy} onClick={() => doSave(false)}>บันทึก{f.status === "draft" ? "ร่าง" : ""}</button>}
          {f.no && <button style={ivBtn()} onClick={() => onPrint(f)}>พิมพ์ / PDF</button>}
          {!locked && f.status === "draft" && <button style={ivBtn(true)} disabled={busy} onClick={() => doSave(true)}>{busy ? "กำลังออกเลข…" : "ออกใบ + พิมพ์"}</button>}
        </div>

        <IvCard title="ผู้ออกเอกสาร">
          <IvRow>
            <IvFld label="ออกในนาม">
              <select style={IN} value={f.issuer} disabled={f.status !== "draft"}
                onChange={(e) => { const x = store.issuers.find((y) => y.key === e.target.value); setF((p) => Object.assign({}, p, { issuer: e.target.value, vat: !!(x && x.vat), bank: 0 })); }}>
                {store.issuers.map((x) => <option key={x.key} value={x.key}>{x.name || "(ยังไม่ตั้งชื่อ)"} · {x.kind === "person" ? "บุคคลธรรมดา" : "นิติบุคคล"}</option>)}
              </select>
            </IvFld>
            <IvFld label="วันที่ออก" w="150px"><input type="date" style={IN} value={f.date} onChange={(e) => set("date", e.target.value)} /></IvFld>
            <IvFld label="วันที่ครบกำหนด" w="150px"><input type="date" style={IN} value={f.due} onChange={(e) => set("due", e.target.value)} /></IvFld>
            <IvFld label="อ้างอิง" w="170px"><input style={IN} value={f.ref} onChange={(e) => set("ref", e.target.value)} placeholder="เช่น เลขใบเสนอราคา" /></IvFld>
          </IvRow>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{iss.addr}{iss.taxId ? " · เลขผู้เสียภาษี " + iss.taxId : ""}{iss.vat ? "" : " · ไม่จด VAT (ออกเป็นใบแจ้งหนี้อย่างเดียว)"}</div>
        </IvCard>

        <IvCard title="ลูกค้า" right={
          <select style={Object.assign({}, IN, { width: 230, padding: "7px 10px", fontSize: 12.5 })} value="" onChange={(e) => pickJob(e.target.value)}>
            <option value="">ดึงชื่อ/ที่อยู่จากงาน…</option>
            {(jobs || []).filter((j) => j && j.name).slice(0, 400).map((j) => <option key={j.id} value={j.id}>{[j.code, j.name].filter(Boolean).join(" · ")}</option>)}
          </select>}>
          <IvRow>
            <IvFld label="ชื่อลูกค้า / บริษัท"><input style={IN} value={f.cust.name} onChange={(e) => setC("name", e.target.value)} /></IvFld>
            <IvFld label="เลขประจำตัวผู้เสียภาษี" w="190px"><input style={IN} value={f.cust.taxId} onChange={(e) => setC("taxId", e.target.value)} /></IvFld>
            <IvFld label="สาขา" w="150px"><input style={IN} value={f.cust.branch} onChange={(e) => setC("branch", e.target.value)} placeholder="สำนักงานใหญ่" /></IvFld>
          </IvRow>
          <IvRow><IvFld label="ที่อยู่"><textarea rows={2} style={Object.assign({}, IN, { resize: "vertical" })} value={f.cust.addr} onChange={(e) => setC("addr", e.target.value)} /></IvFld></IvRow>
          <IvRow>
            <IvFld label="ผู้ติดต่อ"><input style={IN} value={f.cust.contact} onChange={(e) => setC("contact", e.target.value)} /></IvFld>
            <IvFld label="โทร"><input style={IN} value={f.cust.tel} onChange={(e) => setC("tel", e.target.value)} /></IvFld>
            <IvFld label="อีเมล"><input style={IN} value={f.cust.email} onChange={(e) => setC("email", e.target.value)} /></IvFld>
          </IvRow>
        </IvCard>

        <IvCard title="รายการ (ราคาก่อนภาษี)" right={<button style={ivBtn()} onClick={() => set("items", ivItems(f).concat([ivBlankItem()]))}>+ เพิ่มรายการ</button>}>
          {ivItems(f).map((it, i) => (
            <div key={it.id || i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderTop: i ? "1px solid var(--divider)" : "none", flexWrap: "wrap" }}>
              <div style={{ width: 22, paddingTop: 10, fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{i + 1}.</div>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <input style={Object.assign({}, IN, { fontWeight: 600 })} value={it.t} placeholder="ชื่อรายการ" onChange={(e) => setIt(i, "t", e.target.value)} />
                <textarea rows={1} style={Object.assign({}, IN, { marginTop: 6, fontSize: 12.5, resize: "vertical" })} value={it.d} placeholder="รายละเอียด (ไม่บังคับ)" onChange={(e) => setIt(i, "d", e.target.value)} />
              </div>
              <input type="number" style={Object.assign({}, IN, { width: 80, textAlign: "right" })} value={it.qty} onChange={(e) => setIt(i, "qty", e.target.value === "" ? "" : +e.target.value)} />
              <input list="iv-units" style={Object.assign({}, IN, { width: 84 })} value={it.unit} onChange={(e) => setIt(i, "unit", e.target.value)} />
              <input type="number" style={Object.assign({}, IN, { width: 120, textAlign: "right" })} value={it.price} onChange={(e) => setIt(i, "price", e.target.value === "" ? "" : +e.target.value)} />
              <div style={{ width: 110, paddingTop: 10, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "var(--text-1)" }}>{ivMoney((+it.qty || 0) * (+it.price || 0))}</div>
              <button title="ลบรายการ" style={Object.assign(ivBtn(), { padding: "8px 10px", color: "var(--tint-red-tx)" })}
                onClick={() => set("items", ivItems(f).filter((_, k) => k !== i))}>×</button>
            </div>
          ))}
          <datalist id="iv-units">{IV_UNITS.map((u) => <option key={u} value={u} />)}</datalist>
        </IvCard>

        <IvCard title="ภาษี · การชำระเงิน">
          <IvRow>
            <IvFld label="ภาษีมูลค่าเพิ่ม" w="190px">
              <select style={IN} value={f.vat ? "1" : "0"} disabled={!iss.vat} onChange={(e) => set("vat", e.target.value === "1")}>
                <option value="1">คิด VAT {f.vatRate}%</option><option value="0">ไม่คิด VAT</option>
              </select>
            </IvFld>
            <IvFld label="หัก ณ ที่จ่าย" w="150px">
              <select style={IN} value={+f.wht || 0} onChange={(e) => set("wht", +e.target.value)}>
                {IV_WHT.map((w) => <option key={w} value={w}>{w ? w + "%" : "ไม่หัก"}</option>)}
              </select>
            </IvFld>
            <IvFld label="บัญชีรับเงิน">
              <select style={IN} value={+f.bank || 0} onChange={(e) => set("bank", +e.target.value)}>
                {(iss.banks || []).length ? iss.banks.map((b, k) => <option key={k} value={k}>{[b.bank, b.no, b.name].filter(Boolean).join(" · ")}</option>)
                  : <option value={0}>ยังไม่ได้ตั้งบัญชี — ไปที่ ตั้งค่าผู้ออกเอกสาร</option>}
              </select>
            </IvFld>
          </IvRow>
          <IvRow><IvFld label="หมายเหตุ"><textarea rows={2} style={Object.assign({}, IN, { resize: "vertical" })} value={f.note} onChange={(e) => set("note", e.target.value)} /></IvFld></IvRow>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, flexWrap: "wrap", fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
            <span>ก่อนภาษี <b>{ivMoney(T.sub)}</b></span>
            {f.vat && <span>VAT <b>{ivMoney(T.vat)}</b></span>}
            <span>รวม <b style={{ color: "var(--primary-dark)" }}>{ivMoney(T.total)}</b></span>
            {T.wht > 0 && <span>หัก ณ ที่จ่าย <b>{ivMoney(T.wht)}</b> · ชำระ <b>{ivMoney(T.pay)}</b></span>}
          </div>
        </IvCard>
      </div>
    </div>
  ), document.body);
}

/* ── หน้าตั้งค่าผู้ออกเอกสาร ── */
function InvoiceSettings({ store, onClose }) {
  const [L, setL] = React.useState(() => JSON.parse(JSON.stringify(store.issuers)));
  const [busy, setBusy] = React.useState(false);
  const setI = (i, k, v) => setL((p) => { const c = p.slice(); c[i] = Object.assign({}, c[i], { [k]: v }); return c; });
  const setB = (i, k, bi, v) => setL((p) => { const c = p.slice(); const b = (c[i].banks || []).slice(); b[bi] = Object.assign({}, b[bi], { [k]: v }); c[i] = Object.assign({}, c[i], { banks: b }); return c; });
  const IN = ivIn();
  const save = () => { setBusy(true); store.saveCfg({ issuers: L }).then(() => { setBusy(false); onClose(); }).catch(() => setBusy(false)); };
  return ReactDOM.createPortal((
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,20,14,.45)", overflow: "auto", padding: "24px 12px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", background: "var(--bg)", borderRadius: "var(--r-card)", boxShadow: "var(--shadow-modal)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>ตั้งค่าผู้ออกเอกสาร</div>
          <button style={ivBtn()} onClick={() => setL((p) => p.concat([ivBlankIssuer()]))}>+ เพิ่มผู้ออก (บุคคลธรรมดา)</button>
          <button style={ivBtn()} onClick={onClose}>ปิด</button>
          <button style={ivBtn(true)} disabled={busy} onClick={save}>บันทึก</button>
        </div>
        {L.map((x, i) => (
          <IvCard key={x.key} title={(x.name || "ผู้ออกใหม่") + " · " + (x.kind === "person" ? "บุคคลธรรมดา" : "นิติบุคคล")}
            right={L.length > 1 && <button style={Object.assign(ivBtn(), { color: "var(--tint-red-tx)" })}
              onClick={() => window.askConfirm({ title: "ลบผู้ออก " + (x.name || "") + "?", body: "ใบที่ออกไปแล้วไม่เปลี่ยน (เก็บข้อมูลผู้ออกไว้ในใบ)", okText: "ลบ", danger: true })
                .then((ok) => ok && setL((p) => p.filter((_, k) => k !== i)))}>ลบ</button>}>
            <IvRow>
              <IvFld label="ประเภท" w="150px">
                <select style={IN} value={x.kind} onChange={(e) => setI(i, "kind", e.target.value)}>
                  <option value="company">นิติบุคคล</option><option value="person">บุคคลธรรมดา</option>
                </select>
              </IvFld>
              <IvFld label="ชื่อ (ตามที่ขึ้นบนใบ)"><input style={IN} value={x.name} onChange={(e) => setI(i, "name", e.target.value)} /></IvFld>
            </IvRow>
            <IvRow><IvFld label="ที่อยู่"><textarea rows={2} style={Object.assign({}, IN, { resize: "vertical" })} value={x.addr} onChange={(e) => setI(i, "addr", e.target.value)} /></IvFld></IvRow>
            <IvRow>
              <IvFld label="เลขประจำตัวผู้เสียภาษี / บัตรประชาชน"><input style={IN} value={x.taxId} onChange={(e) => setI(i, "taxId", e.target.value)} /></IvFld>
              <IvFld label="สาขา" w="150px"><input style={IN} value={x.branch} onChange={(e) => setI(i, "branch", e.target.value)} /></IvFld>
              <IvFld label="จดทะเบียน VAT" w="150px">
                <select style={IN} value={x.vat ? "1" : "0"} onChange={(e) => setI(i, "vat", e.target.value === "1")}><option value="1">จด (ออกใบกำกับภาษีได้)</option><option value="0">ไม่จด</option></select>
              </IvFld>
            </IvRow>
            <IvRow>
              <IvFld label="โทร"><input style={IN} value={x.tel} onChange={(e) => setI(i, "tel", e.target.value)} /></IvFld>
              <IvFld label="อีเมล"><input style={IN} value={x.email} onChange={(e) => setI(i, "email", e.target.value)} /></IvFld>
              <IvFld label="เว็บไซต์"><input style={IN} value={x.web} onChange={(e) => setI(i, "web", e.target.value)} /></IvFld>
            </IvRow>
            <IvRow>
              <IvFld label="คำนำหน้าเลขที่" w="130px"><input style={Object.assign({}, IN, { fontFamily: "var(--mono)" })} value={x.prefix} onChange={(e) => setI(i, "prefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} /></IvFld>
              <IvFld label="ชื่อผู้ออกเอกสาร (ช่องเซ็น)"><input style={IN} value={x.signer} onChange={(e) => setI(i, "signer", e.target.value)} /></IvFld>
              <IvFld label="โลโก้บริษัทบนใบ" w="150px">
                <select style={IN} value={x.logo ? "1" : "0"} onChange={(e) => setI(i, "logo", e.target.value === "1")}><option value="1">แสดง</option><option value="0">ไม่แสดง</option></select>
              </IvFld>
            </IvRow>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", margin: "4px 0 6px" }}>บัญชีรับเงิน</div>
            {(x.banks || []).map((b, bi) => (
              <IvRow key={bi}>
                <IvFld label="ธนาคาร"><input style={IN} value={b.bank || ""} onChange={(e) => setB(i, "bank", bi, e.target.value)} placeholder="เช่น ธนาคารกสิกรไทย" /></IvFld>
                <IvFld label="เลขบัญชี"><input style={Object.assign({}, IN, { fontFamily: "var(--mono)" })} value={b.no || ""} onChange={(e) => setB(i, "no", bi, e.target.value)} /></IvFld>
                <IvFld label="ชื่อบัญชี"><input style={IN} value={b.name || ""} onChange={(e) => setB(i, "name", bi, e.target.value)} /></IvFld>
                <button style={Object.assign(ivBtn(), { alignSelf: "flex-end", color: "var(--tint-red-tx)" })}
                  onClick={() => setI(i, "banks", (x.banks || []).filter((_, k) => k !== bi))}>×</button>
              </IvRow>
            ))}
            <button style={ivBtn()} onClick={() => setI(i, "banks", (x.banks || []).concat([{ bank: "", no: "", name: x.name || "" }]))}>+ เพิ่มบัญชี</button>
          </IvCard>
        ))}
      </div>
    </div>
  ), document.body);
}

/* ── กระดาษ A4 (ตามตัวอย่างผู้ใช้: โลโก้ซ้าย หัวขวา · ผู้ขายซ้าย กล่องเลขที่ขวา · ลูกค้า · ตาราง · สรุป · ชำระเงิน · หมายเหตุ · ลงชื่อ) ── */
const IV_INK = "#1F2A33", IV_SOFT = "#5B6770", IV_LINE = "#DCE6EA";
function ivPaperColors() {
  const B = window.BRANDING || {};
  return { deep: B.deep || "#0A4D68", tint: "#E6F2F6" };
}
function IvPage({ inv, issuers, copy }) {
  const C = ivPaperColors(), x = ivFrom(inv, issuers), c = inv.cust || {}, T = ivTotals(inv);
  const bank = (x.banks || [])[+inv.bank || 0];
  const lab = { color: IV_INK, fontWeight: 700, whiteSpace: "nowrap", paddingRight: 8, verticalAlign: "top" };
  const party = (rows) => (
    <table style={{ borderCollapse: "collapse", fontSize: 10.5, lineHeight: 1.55 }}><tbody>
      {rows.filter((r) => r[1]).map((r) => <tr key={r[0]}><td style={lab}>{r[0]} :</td><td style={{ color: IV_INK }}>{r[1]}</td></tr>)}
    </tbody></table>
  );
  const contact = (rows) => (
    <div style={{ fontSize: 10.5, lineHeight: 1.7, color: IV_INK }}>{rows.filter((r) => r[1]).map((r) => <div key={r[0]}><span style={{ color: IV_SOFT, display: "inline-block", width: 42 }}>{r[0]}</span>{r[1]}</div>)}</div>
  );
  const taxTxt = (id, br) => (id ? id + (br ? " (" + br + ")" : "") : "");
  const sec = (icon, title, body) => (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: "1px solid " + IV_LINE, breakInside: "avoid" }}>
      <div style={{ width: 92, fontSize: 11, fontWeight: 800, color: IV_INK }}>{icon} {title}</div><div style={{ flex: 1, fontSize: 11, color: IV_INK, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
  return (
    <div className="iv-page" style={{ color: IV_INK, fontSize: 11 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>{x.logo && window.BrandDoc ? <window.BrandDoc height={46} name={false} /> : <div style={{ fontSize: 15, fontWeight: 800, color: C.deep }}>{x.name}</div>}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: IV_SOFT }}>({copy ? "สำเนา" : "ต้นฉบับ"})</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.deep, lineHeight: 1.25 }}>{ivTitle(inv)}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>{party([["ผู้ขาย", x.name], ["ที่อยู่", x.addr], ["เลขที่ภาษี", taxTxt(x.taxId, x.kind === "company" ? x.branch || "สำนักงานใหญ่" : "")]])}</div>
          {contact([["โทร", x.tel], ["อีเมล", x.email], ["เว็บ", x.web]])}
        </div>
        <div style={{ width: 230, background: C.tint, borderRadius: 4, padding: "8px 12px" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 10.5, lineHeight: 1.7, width: "100%" }}><tbody>
            {[["เลขที่เอกสาร", inv.no || "(ร่าง)"], ["วันที่ออก", ivDay(inv.date)], ["วันที่ครบกำหนด", ivDay(inv.due)], ["อ้างอิง", inv.ref]].filter((r) => r[1]).map((r) =>
              <tr key={r[0]}><td style={lab}>{r[0]} :</td><td style={{ textAlign: "left" }}>{r[1]}</td></tr>)}
          </tbody></table>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingTop: 10, borderTop: "1px solid " + IV_LINE }}>
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>{party([["ลูกค้า", c.name], ["ที่อยู่", c.addr], ["เลขที่ภาษี", taxTxt(c.taxId, c.branch)]])}</div>
        </div>
        <div style={{ width: 230 }}>
          {(c.contact || c.tel || c.email) && <div style={{ fontSize: 10.5, fontWeight: 800, marginBottom: 2 }}>ติดต่อกลับที่</div>}
          {contact([["ชื่อ", c.contact], ["โทร", c.tel], ["อีเมล", c.email]])}
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
        <thead><tr style={{ background: C.tint }}>
          {[["คำอธิบาย", "left"], ["จำนวน", "right", 60], ["หน่วย", "center", 52], ["ราคา", "right", 82], ["มูลค่าก่อนภาษี", "right", 96]].map((h) =>
            <th key={h[0]} style={{ textAlign: h[1], padding: "7px 8px", fontWeight: 800, width: h[2] }}>{h[0]}</th>)}
        </tr></thead>
        <tbody>
          {ivItems(inv).map((it, i) => (
            <tr key={it.id || i} style={{ borderBottom: "1px solid " + IV_LINE, breakInside: "avoid" }}>
              <td style={{ padding: "8px 8px", verticalAlign: "top" }}>
                <div style={{ fontWeight: 700 }}>{i + 1}. {it.t}</div>
                {it.d ? <div style={{ color: IV_SOFT, whiteSpace: "pre-wrap", marginTop: 1, paddingLeft: 12 }}>{it.d}</div> : null}
              </td>
              <td style={{ padding: "8px", textAlign: "right", verticalAlign: "top" }}>{ivMoney(it.qty)}</td>
              <td style={{ padding: "8px", textAlign: "center", verticalAlign: "top" }}>{it.unit}</td>
              <td style={{ padding: "8px", textAlign: "right", verticalAlign: "top" }}>{ivMoney(it.price)}</td>
              <td style={{ padding: "8px", textAlign: "right", verticalAlign: "top" }}>{ivMoney((+it.qty || 0) * (+it.price || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 16, padding: "14px 0", breakInside: "avoid" }}>
        <div style={{ flex: 1, display: "flex", gap: 10 }}>
          <div style={{ width: 92, fontSize: 11, fontWeight: 800 }}>สรุป</div>
          <table style={{ borderCollapse: "collapse", fontSize: 10.5, lineHeight: 1.75 }}><tbody>
            {(inv.vat ? [["มูลค่าที่คำนวณภาษี " + T.rate + "%", T.sub], ["ภาษีมูลค่าเพิ่ม " + T.rate + "%", T.vat]] : [["มูลค่ารวม", T.sub]]).map((r) =>
              <tr key={r[0]}><td style={{ paddingRight: 24 }}>{r[0]}</td><td style={{ textAlign: "right", paddingRight: 6 }}>{ivMoney(r[1])}</td><td>บาท</td></tr>)}
            <tr><td style={{ paddingRight: 24, fontWeight: 700 }}>จำนวนเงินทั้งสิ้น</td><td colSpan={2} style={{ color: IV_SOFT }}>{window.ecBahtText ? window.ecBahtText(T.total) : ""}</td></tr>
          </tbody></table>
        </div>
        <div style={{ width: 230 }}>
          <div style={{ background: C.tint, borderRadius: 4, padding: "10px 12px", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ flex: 1, fontSize: 10.5 }}>จำนวนเงินทั้งสิ้น</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.deep }}>{ivMoney(T.total)}</span><span style={{ fontSize: 10.5 }}>บาท</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5, lineHeight: 1.8, marginTop: 6 }}><tbody>
            <tr><td>จำนวนเงินที่ถูกหัก ณ ที่จ่าย{inv.wht ? " " + inv.wht + "%" : ""}</td><td style={{ textAlign: "right" }}>{ivMoney(T.wht)} บาท</td></tr>
            <tr><td style={{ fontWeight: 700 }}>จำนวนเงินที่จะชำระ</td><td style={{ textAlign: "right", fontWeight: 700 }}>{ivMoney(T.pay)} บาท</td></tr>
          </tbody></table>
        </div>
      </div>

      {bank && sec("", "ชำระเงิน", <div><div style={{ fontWeight: 700 }}>{bank.bank}</div><div>เลขที่บัญชี <b style={{ fontFamily: "var(--mono)" }}>{bank.no}</b></div><div style={{ color: IV_SOFT }}>{bank.name}</div></div>)}
      {inv.note && sec("", "หมายเหตุ", <div style={{ whiteSpace: "pre-wrap" }}>{inv.note}</div>)}

      <div style={{ display: "flex", gap: 24, paddingTop: 14, borderTop: "1px solid " + IV_LINE, breakInside: "avoid" }}>
        <div style={{ width: 92, fontSize: 11, fontWeight: 800 }}>รับรอง</div>
        {[["ผู้ออกเอกสาร (ผู้ขาย)", x.signer || x.name, inv.date], ["ผู้รับเอกสาร (ลูกค้า)", c.name, ""]].map((s) => (
          <div key={s[0]} style={{ flex: 1, textAlign: "center", fontSize: 10.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 46 }}>{s[0]}</div>
            <div style={{ borderTop: "1px dotted " + IV_SOFT, margin: "0 18px", paddingTop: 4 }}>{s[1]}</div>
            <div style={{ color: IV_SOFT, marginTop: 2 }}>{s[2] ? ivDay(s[2]) : "วันที่ ........................"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicePaper({ inv, issuers, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [part, setPart] = React.useState("orig");
  if (window.useBlPrintBody) window.useBlPrintBody();
  const doPrint = () => {
    const old = document.title;
    document.title = (inv.no || "ใบแจ้งหนี้") + " " + ((inv.cust || {}).name || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };
  const paper = { maxWidth: 820, margin: "0 auto", background: "var(--paper-bg)", padding: isMobile ? "20px 16px" : "34px 38px",
    borderRadius: isMobile ? 0 : 12, boxShadow: "var(--shadow-modal)" };
  const tab = (id, label) => (
    <button key={id} onClick={() => setPart(id)} style={Object.assign(ivBtn(part === id), { padding: "7px 12px", fontSize: 12 })}>{label}</button>
  );
  const pages = part === "both" ? [false, true] : [part === "copy"];
  return ReactDOM.createPortal((
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(8,20,14,.55)", overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>
      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
        padding: "11px 14px", background: "var(--surface)", marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12,
        maxWidth: 820, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button style={ivBtn()} onClick={onClose}>ปิด</button>
        <div style={{ flex: 1, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 13 }}>{inv.no || "ร่าง"}</div>
        {tab("orig", "ต้นฉบับ")}{tab("copy", "สำเนา")}{tab("both", "ต้นฉบับ + สำเนา")}
        <button style={ivBtn(true)} onClick={doPrint}>พิมพ์ / บันทึก PDF</button>
      </div>
      {pages.map((cp, i) => (
        <div key={i} className={"sv-rep-paper" + (i ? " bl-sheet" : "")} style={Object.assign({}, paper, { marginTop: i ? 16 : 0 })}>
          <IvPage inv={inv} issuers={issuers} copy={cp} />
        </div>
      ))}
      {!isMobile && <div style={{ height: 24 }} />}
    </div>
  ), document.body);
}

/* ── หน้ารายการใบแจ้งหนี้ ── */
function InvoiceView({ jobs, role, currentUser, q }) {
  const store = useInvoiceStore();
  const [edit, setEdit] = React.useState(null);
  const [print, setPrint] = React.useState(null);
  const [setup, setSetup] = React.useState(false);
  const canUse = window.can ? window.can(role, "billing") : true;
  const qq = String(q || "").trim().toLowerCase();
  const rows = (store.list || []).filter((x) => !qq || [x.no, (x.cust || {}).name, x.ref].join(" ").toLowerCase().indexOf(qq) >= 0)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.no || "").localeCompare(String(a.no || "")));
  const newInv = () => setEdit(ivBlank(store.issuers[0], currentUser));
  const setStatus = (x, st) => window.askConfirm({ title: (st === "void" ? "ยกเลิกใบ " : "บันทึกรับเงินใบ ") + (x.no || "") + "?", okText: "ยืนยัน", danger: st === "void" })
    .then((ok) => ok && store.patch(x.id, { status: st }));
  const delDraft = (x) => window.askConfirm({ title: "ลบร่างนี้?", body: (x.cust || {}).name || "", okText: "ลบ", danger: true })
    .then((ok) => ok && store.removeDraft(x.id));
  if (store.loading) return <div style={{ padding: 30, color: "var(--text-3)" }}>กำลังโหลด…</div>;
  return (
    <div style={{ padding: "4px 0 30px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 13, color: "var(--text-3)" }}>ใบแจ้งหนี้ {rows.length} ใบ · ออกในนามบริษัทหรือบุคคลธรรมดา</div>
        {canUse && <button style={ivBtn()} onClick={() => setSetup(true)}>ตั้งค่าผู้ออกเอกสาร</button>}
        {canUse && <button className="btn-add" onClick={newInv}>+ ออกใบแจ้งหนี้</button>}
      </div>
      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "6px 4px" }}>
        {!rows.length && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>ยังไม่มีใบแจ้งหนี้</div>}
        {rows.map((x, i) => {
          const T = ivTotals(x), st = IV_STATUS[x.status] || IV_STATUS.draft, fr = ivFrom(x, store.issuers);
          return (
            <div key={x.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 14px", borderTop: i ? "1px solid var(--divider)" : "none", flexWrap: "wrap" }}>
              <div style={{ width: 150, fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", cursor: "pointer" }} onClick={() => canUse && setEdit(x)}>{x.no || "ร่าง"}</div>
              <div style={{ flex: "1 1 200px", minWidth: 0, cursor: "pointer" }} onClick={() => canUse && setEdit(x)}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(x.cust || {}).name || "(ยังไม่มีชื่อลูกค้า)"}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{ivDay(x.date)} · {fr.name}{x.ref ? " · " + x.ref : ""}</div>
              </div>
              <div style={{ width: 120, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "var(--text-1)" }}>{ivMoney(T.total)}</div>
              {window.EcPill ? <window.EcPill th={st.th} color={st.color} /> : st.th}
              <div style={{ display: "flex", gap: 6 }}>
                {x.no && <button style={Object.assign(ivBtn(), { padding: "6px 10px", fontSize: 12 })} onClick={() => setPrint(x)}>พิมพ์</button>}
                {canUse && x.status === "issued" && <button style={Object.assign(ivBtn(), { padding: "6px 10px", fontSize: 12 })} onClick={() => setStatus(x, "paid")}>รับเงินแล้ว</button>}
                {canUse && (x.status === "issued" || x.status === "paid") && <button style={Object.assign(ivBtn(), { padding: "6px 10px", fontSize: 12, color: "var(--tint-red-tx)" })} onClick={() => setStatus(x, "void")}>ยกเลิก</button>}
                {canUse && x.status === "draft" && <button style={Object.assign(ivBtn(), { padding: "6px 10px", fontSize: 12, color: "var(--tint-red-tx)" })} onClick={() => delDraft(x)}>ลบร่าง</button>}
              </div>
            </div>
          );
        })}
      </div>
      {edit && <InvoiceEditor inv0={edit} store={store} jobs={jobs} onClose={() => setEdit(null)} onPrint={(r) => setPrint(r)} />}
      {print && <InvoicePaper inv={print} issuers={store.issuers} onClose={() => setPrint(null)} />}
      {setup && <InvoiceSettings store={store} onClose={() => setSetup(false)} />}
    </div>
  );
}

Object.assign(window, { InvoiceView, InvoicePaper, useInvoiceStore, ivTotals, ivAllocNo });
