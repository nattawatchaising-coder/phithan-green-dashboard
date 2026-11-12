/* ============================================================
   พาร์ทเนอร์/นักลงทุน (ผู้ใช้ภายนอก) — docs/mikrotik.md หัวข้อ "พาร์ทเนอร์"
   ผู้ใช้สั่ง 2026-11-11: "ทำ User สำหรับคนภายนอก เห็นแค่ส่วนนี้ (MikroTik Monitoring) · ล็อกไว้ว่าเห็นไซต์ไหน · ออกบิลเองได้
   · ลงทะเบียนชื่อบริษัทตัวเอง แนบโลโก้ · เก็บว่าใครออกบิล · ลงทะเบียนไซต์"

   - PartnerApp     หน้าทั้งแอปของพาร์ทเนอร์ (app.jsx เลือก render แทน App เมื่อ uid ขึ้นต้น p- และ claim ext)
   - MtPartnerAdmin แอดมินสร้างบัญชี · ตั้งรหัส · มอบไซต์ · แก้ข้อมูลบริษัทให้ (ในหน้า MikroTik Monitoring)
   ทุกการบันทึกผ่าน /api/mikrotik/site (mtCall ใน mikrotik.jsx) — หน้าเว็บไม่เขียนฐานเอง
   กันข้อมูลบริษัทด้วยกฎฐานข้อมูล (claim ext) ไม่ใช่ด้วยการซ่อนเมนู — ดู docs/security.md
   ============================================================ */

/* ไซต์ของพาร์ทเนอร์: อ่านทีละไซต์ (กฎไม่ให้พาร์ทเนอร์อ่าน mtSites / mtStatus ทั้งโหนด) */
function useMtPartnerData(p) {
  const ids = Object.keys((p && p.sites) || {}).map(Number).filter((n) => n > 0).sort((a, b) => a - b).join(",");
  const [sites, setSites] = React.useState({});
  const [status, setStatus] = React.useState({});
  React.useEffect(() => {
    setSites({}); setStatus({});
    if (!ids || !window.FBDB) return;
    const offs = [];
    ids.split(",").forEach((n) => {
      const r1 = window.FBDB.ref("mtSites/" + n), r2 = window.FBDB.ref("mtStatus/" + n);
      const h1 = r1.on("value", (s) => setSites((o) => Object.assign({}, o, { [n]: s.val() })), () => setSites((o) => Object.assign({}, o, { [n]: null })));
      const h2 = r2.on("value", (s) => setStatus((o) => Object.assign({}, o, { [n]: s.val() })), () => {});
      offs.push(() => { r1.off("value", h1); r2.off("value", h2); });
    });
    return () => offs.forEach((f) => f());
  }, [ids]);
  const want = ids ? ids.split(",") : [];
  const list = want.filter((n) => sites[n]).map((n) => Object.assign({}, sites[n], { n: Number(n) }));
  return { list, loading: want.some((n) => !(n in sites)), status };
}

/* รูปโลโก้ → data URL ย่อไม่เกิน 480px (PNG คงพื้นใส · อื่น ๆ เป็น JPEG) — ขนาดต้องไม่เกินที่ API รับ (~200 KB) */
function mtLogoFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error("เลือกไฟล์รูปภาพ (PNG / JPG)"));
    const rd = new FileReader();
    rd.onerror = () => reject(new Error("อ่านไฟล์ไม่ได้"));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("เปิดรูปไม่ได้"));
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        let url = file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
        if (url.length > 280000) url = c.toDataURL("image/jpeg", 0.7);
        if (url.length > 280000) return reject(new Error("รูปใหญ่เกินไป ลองรูปที่เล็กลง"));
        resolve(url);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}

const mtFld = () => Object.assign({}, mtField, { background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });

/* ---------- ข้อมูลบริษัท (ผู้ออกบิล) + โลโก้ ---------- */
function MtCompanyForm({ pid, company, self, onDone }) {
  const c = company || {};
  const [f, setF] = React.useState({ name: c.name || "", tax: c.tax || "", branch: c.branch || "", addr: c.addr || "", phone: c.phone || "", email: c.email || "", logo: c.logo || "" });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const set = (k, v) => setF(Object.assign({}, f, { [k]: v }));
  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    setErr("");
    try { set("logo", await mtLogoFromFile(file)); } catch (x) { setErr(String(x.message || x)); }
  };
  const save = async () => {
    setBusy(true); setErr(""); setMsg("");
    try { await mtCall(Object.assign({ action: "company", company: f }, self ? {} : { pid })); setMsg("บันทึกแล้ว"); if (onDone) onDone(); } catch (x) { setErr(String(x.message || x)); }
    setBusy(false);
  };
  const fld = mtFld();
  const row = (k, label, ph, span) => (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      <div style={mtLbl}>{label}</div>
      <input value={f[k]} placeholder={ph || ""} onChange={(e) => set(k, k === "tax" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value)} style={fld} />
    </div>
  );
  return (
    <div style={mtCard}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>ข้อมูลบริษัท</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>ขึ้นเป็นผู้ออกบิลบนใบแจ้งค่าไฟทุกไซต์ของบัญชีนี้</div>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 150, height: 80, borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {f.logo ? <img src={f.logo} alt="" style={{ maxWidth: "92%", maxHeight: "88%", objectFit: "contain" }} /> : <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่มีโลโก้</span>}
        </div>
        <label className="btn btn-sm btn-soft" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="image" size={14} />เลือกรูปโลโก้
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} style={{ display: "none" }} />
        </label>
        {f.logo && <button className="btn btn-sm" onClick={() => set("logo", "")}>เอาโลโก้ออก</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        {row("name", "ชื่อบริษัท", "เช่น บริษัท พลังแดด จำกัด", true)}
        {row("tax", "เลขประจำตัวผู้เสียภาษี", "13 หลัก")}
        {row("branch", "สาขา", "สำนักงานใหญ่")}
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={mtLbl}>ที่อยู่</div>
          <textarea rows={2} value={f.addr} onChange={(e) => set("addr", e.target.value)} style={Object.assign({}, fld, { resize: "vertical" })} />
        </div>
        {row("phone", "โทร")}
        {row("email", "อีเมล")}
      </div>
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        {msg && <span style={{ fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700 }}>{msg}</span>}
        <button className="btn btn-pri" disabled={busy} onClick={save}>{busy ? "กำลังบันทึก…" : "บันทึกข้อมูลบริษัท"}</button>
      </div>
    </div>
  );
}

/* ---------- พาร์ทเนอร์เปลี่ยนรหัสตัวเอง ---------- */
function MtPinForm() {
  const [old, setOld] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const save = async () => {
    setErr(""); setMsg("");
    if (pin !== pin2) return setErr("รหัสใหม่สองช่องไม่ตรงกัน");
    setBusy(true);
    try { await mtCall({ action: "partner-pin", old, pin }); setMsg("เปลี่ยนรหัสแล้ว"); setOld(""); setPin(""); setPin2(""); } catch (x) { setErr(String(x.message || x)); }
    setBusy(false);
  };
  const fld = mtFld();
  return (
    <div style={Object.assign({}, mtCard, { maxWidth: 420 })}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>เปลี่ยนรหัสผ่าน</div>
      <div><div style={mtLbl}>รหัสเดิม</div><input type="password" value={old} onChange={(e) => setOld(e.target.value)} style={fld} /></div>
      <div><div style={mtLbl}>รหัสใหม่ (อย่างน้อย 6 ตัว)</div><input type="password" value={pin} onChange={(e) => setPin(e.target.value)} style={fld} /></div>
      <div><div style={mtLbl}>ยืนยันรหัสใหม่</div><input type="password" value={pin2} onChange={(e) => setPin2(e.target.value)} style={fld} /></div>
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        {msg && <span style={{ fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700 }}>{msg}</span>}
        <button className="btn btn-pri" disabled={busy || !old || pin.length < 6} onClick={save}>{busy ? "กำลังบันทึก…" : "เปลี่ยนรหัส"}</button>
      </div>
    </div>
  );
}

/* ---------- แอดมิน: บัญชีพาร์ทเนอร์ + มอบไซต์ ---------- */
function MtPartnerEdit({ p, sites, partners, onClose }) {
  const isNew = !p;
  const [f, setF] = React.useState({ name: (p && p.name) || "", username: (p && p.username) || "", pin: "", active: !p || p.active !== false,
    sites: Object.keys((p && p.sites) || {}).map(Number) });
  const [co, setCo] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k, v) => setF(Object.assign({}, f, { [k]: v }));
  const toggle = (n) => set("sites", f.sites.includes(n) ? f.sites.filter((x) => x !== n) : f.sites.concat(n));
  const save = async () => {
    setBusy(true); setErr("");
    try { await mtCall({ action: "partner-save", id: p ? p.id : undefined, name: f.name, username: f.username, pin: f.pin || undefined, active: f.active, sites: f.sites }); onClose(); }
    catch (x) { setErr(String(x.message || x)); }
    setBusy(false);
  };
  const fld = mtFld();
  const ownerName = (pid) => (partners[pid] && (partners[pid].company && partners[pid].company.name || partners[pid].name)) || pid;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={mtCard}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{isNew ? "เพิ่มบัญชีพาร์ทเนอร์" : "แก้บัญชี " + p.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <div><div style={mtLbl}>ชื่อผู้ใช้งาน (คน/ทีม)</div><input value={f.name} onChange={(e) => set("name", e.target.value)} style={fld} placeholder="เช่น คุณสมชาย (นักลงทุน)" /></div>
          <div><div style={mtLbl}>ชื่อล็อกอิน</div><input value={f.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} style={Object.assign({}, fld, { fontFamily: "var(--mono)" })} placeholder="a-z 0-9 . _ -" /></div>
          <div><div style={mtLbl}>{isNew ? "รหัสผ่าน (อย่างน้อย 6 ตัว)" : "ตั้งรหัสใหม่ (เว้นว่าง = ใช้รหัสเดิม)"}</div><input value={f.pin} onChange={(e) => set("pin", e.target.value)} style={Object.assign({}, fld, { fontFamily: "var(--mono)" })} autoComplete="new-password" /></div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> เปิดใช้งานบัญชี (ปิด = เข้าระบบไม่ได้ ข้อมูลยังอยู่)</label>
        <div>
          <div style={mtLbl}>ไซต์ที่บัญชีนี้เห็น/ออกบิลได้ (ไซต์ละหนึ่งเจ้าของ — ติ๊กไซต์ที่มีเจ้าของอยู่แล้ว = ย้ายมาบัญชีนี้)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sites.map((s) => (
              <label key={s.n} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "4px 0" }}>
                <input type="checkbox" checked={f.sites.includes(s.n)} onChange={() => toggle(s.n)} />
                <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{mtIdent(s)}</span>
                <span style={{ color: "var(--text-2)" }}>{mtCustOf(s).cust}</span>
                {s.owner && (!p || s.owner !== p.id) && <span style={{ fontSize: 11.5, color: "var(--tint-amber-tx)" }}>เจ้าของตอนนี้: {ownerName(s.owner)}</span>}
              </label>
            ))}
            {!sites.length && <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีไซต์</div>}
          </div>
        </div>
        {err && <div style={mtErrBox}>{err}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {!isNew && <button className="btn btn-soft" onClick={() => setCo(!co)}>{co ? "ซ่อนข้อมูลบริษัท" : "ข้อมูลบริษัท / โลโก้"}</button>}
          <button className="btn" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button className="btn btn-pri" onClick={save} disabled={busy || !f.name || !f.username || (isNew && f.pin.length < 6)}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
        </div>
      </div>
      {co && !isNew && <MtCompanyForm pid={p.id} company={p.company} />}
    </div>
  );
}

function MtPartnerAdmin({ sites, onBack }) {
  const all = useMtRef("mtPartners");
  const [edit, setEdit] = React.useState(null);   // null | "new" | pid
  const partners = all || {};
  const list = Object.values(partners).filter((p) => p && p.id).sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  const back = <button className="btn" onClick={edit ? () => setEdit(null) : onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="chevronLeft" size={14} />{edit ? "รายชื่อพาร์ทเนอร์" : "ทุกไซต์"}</button>;
  if (edit) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>{back}</div>
      <MtPartnerEdit key={edit} p={edit === "new" ? null : partners[edit]} sites={sites} partners={partners} onClose={() => setEdit(null)} />
    </div>
  );
  const th = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "6px 8px", whiteSpace: "nowrap" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {back}
        <div style={{ fontWeight: 700 }}>บัญชีพาร์ทเนอร์ / นักลงทุน</div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-pri" onClick={() => setEdit("new")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={14} />เพิ่มบัญชี</button>
      </div>
      <div style={Object.assign({}, mtCard, { fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 })}>
        พาร์ทเนอร์ล็อกอินที่หน้าเว็บนี้ด้วยชื่อล็อกอิน + รหัส แล้วเห็นแค่หน้า Monitoring ของไซต์ที่มอบให้ · ลงทะเบียนไซต์ ตั้งราคา และออกบิลเองได้ (เลขมิเตอร์แก้ไม่ได้)
        <br />ระบบจะไม่ให้พาร์ทเนอร์เข้าจนกว่าจะวางกฎฐานข้อมูลชุดพาร์ทเนอร์ใน Firebase แล้ว (docs/security.md)
      </div>
      <div style={mtCard}>
        {all === undefined ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด…</div>
          : !list.length ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีบัญชีพาร์ทเนอร์</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>ชื่อ</th><th style={th}>ชื่อล็อกอิน</th><th style={th}>บริษัท</th><th style={th}>ไซต์</th><th style={th}>สถานะ</th></tr></thead>
                <tbody>{list.map((p, i) => {
                  const td = { padding: "9px 8px", fontSize: 12.5, background: i % 2 ? "var(--fs-zebra)" : "transparent" };
                  const ns = Object.keys(p.sites || {}).map(Number);
                  return (
                    <tr key={p.id} className="fs-row" onClick={() => setEdit(p.id)} style={{ cursor: "pointer" }}>
                      <td style={Object.assign({}, td, { fontWeight: 700 })}>{p.name}</td>
                      <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{p.username}</td>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          {p.company && p.company.logo && <img src={p.company.logo} alt="" style={{ height: 22, maxWidth: 60, objectFit: "contain" }} />}
                          {(p.company && p.company.name) || <span style={{ color: "var(--text-3)" }}>ยังไม่กรอก</span>}
                        </span>
                      </td>
                      <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{ns.length ? ns.map((n) => "SITE" + mtPad(n)).join(", ") : "—"}</td>
                      <td style={Object.assign({}, td, { color: p.active === false ? "var(--tint-red-tx)" : "var(--tint-ok-tx)", fontWeight: 700 })}>{p.active === false ? "ปิด" : "ใช้งาน"}</td>
                    </tr>
                  ); })}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

/* ---------- แอปของพาร์ทเนอร์ (แทนทั้งหน้า) ---------- */
function PartnerApp() {
  const uid = window.FBAUTH && window.FBAUTH.currentUser ? window.FBAUTH.currentUser.uid : "";
  const me = useMtRef(uid ? "mtPartners/" + uid : "");
  const [view, setView] = React.useState("sites");
  const logout = () => {
    try { localStorage.removeItem("solarflow_session_v1"); } catch (e) {}
    (window.FBAUTH ? window.FBAUTH.signOut() : Promise.resolve()).then(() => location.reload(), () => location.reload());
  };
  /* body ของแอปเป็น overflow:hidden (แอปพนักงานเลื่อนในกล่องตัวเอง) → หน้านี้ต้องเป็นกล่องเลื่อนเอง ไม่งั้นลูกกลิ้งเลื่อนไม่ได้ (ผู้ใช้ 2026-11-12) */
  const wrap = { height: "calc(100dvh - var(--kb, 0px))", overflowY: "auto", WebkitOverflowScrolling: "touch", background: "var(--bg)", color: "var(--text-1)" };
  const inner = { maxWidth: 1200, margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14, boxSizing: "border-box" };
  if (me === undefined) return <div style={wrap}><div style={inner}><div style={{ color: "var(--text-3)", fontSize: 13 }}>กำลังโหลด…</div></div></div>;
  if (!me || me.active === false) return (
    <div style={wrap}><div style={inner}>
      <div style={mtCard}>
        <div style={{ fontWeight: 700 }}>บัญชีนี้ถูกปิดหรือไม่พบข้อมูล</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>ติดต่อผู้ดูแลระบบ</div>
        <div><button className="btn" onClick={logout}>ออกจากระบบ</button></div>
      </div>
    </div></div>
  );
  const c = me.company || {};
  const opts = [{ value: "sites", label: "ไซต์ของฉัน" }, { value: "company", label: "บริษัทของฉัน" }, { value: "pin", label: "รหัสผ่าน" }];
  return (
    <div style={wrap}>
      <div style={inner}>
        <div style={Object.assign({}, mtCard, { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "12px 18px" })}>
          {c.logo ? <img src={c.logo} alt="" style={{ height: 40, maxWidth: 120, objectFit: "contain" }} /> : <Icon name="sun" size={26} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name || me.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{me.name} · ระบบติดตามโซลาร์และบิลค่าไฟ</div>
          </div>
          <div style={{ flex: 1 }} />
          {window.Segmented ? <window.Segmented value={view} onChange={setView} options={opts} />
            : opts.map((o) => <button key={o.value} className={view === o.value ? "btn btn-pri" : "btn"} onClick={() => setView(o.value)}>{o.label}</button>)}
          <button className="btn" onClick={logout}>ออกจากระบบ</button>
        </div>
        {view === "company" ? <MtCompanyForm key={"c" + (me.updated_at || "")} pid={me.id} company={c} self />
          : view === "pin" ? <MtPinForm />
          : <MtMonView partner={me} />}
      </div>
    </div>
  );
}

Object.assign(window, { useMtPartnerData, MtPartnerAdmin, MtCompanyForm, PartnerApp });
