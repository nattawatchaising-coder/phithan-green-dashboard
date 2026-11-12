/* ============================================================
   พาร์ทเนอร์/นักลงทุน (ผู้ใช้ภายนอก) — docs/mikrotik.md หัวข้อ "พาร์ทเนอร์"
   ผู้ใช้สั่ง 2026-11-11: "ทำ User สำหรับคนภายนอก เห็นแค่ส่วนนี้ (MikroTik Monitoring) · ล็อกไว้ว่าเห็นไซต์ไหน · ออกบิลเองได้
   · ลงทะเบียนชื่อบริษัทตัวเอง แนบโลโก้ · เก็บว่าใครออกบิล · ลงทะเบียนไซต์"
   ออกแบบใหม่ 2026-11-12 (ผู้ใช้ "ออกแบบให้สวยกว่านี้ ทั้งหน้าที่เข้าผ่านพาร์ทเนอร์ ที่คิดเงิน")

   - PartnerApp     หน้าทั้งแอปของพาร์ทเนอร์ (app.jsx เลือก render แทน App เมื่อ uid ขึ้นต้น p- และ claim ext)
   - MtPartnerAdmin แอดมินสร้างบัญชี · ตั้งรหัส · มอบไซต์ · แก้ข้อมูลบริษัทให้ (ในหน้า MikroTik Monitoring)
   ทุกการบันทึกผ่าน /api/mikrotik/site (mtCall ใน mikrotik.jsx) — หน้าเว็บไม่เขียนฐานเอง
   กันข้อมูลบริษัทด้วยกฎฐานข้อมูล (claim ext) ไม่ใช่ด้วยการซ่อนเมนู — ดู docs/security.md
   ใช้ชิ้นส่วนจาก mikrotik-mon.jsx: MtBubble MtHead mtPanel mtCustOf useMtRef · ภาษา mtT / useMtLang / MtLangPick (ไทย · English · 中文 — ผู้ใช้ 2026-11-12)
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
    if (!file || !/^image\//.test(file.type)) return reject(new Error(mtT("เลือกไฟล์รูปภาพ (PNG / JPG)", "Choose an image file (PNG / JPG)", "请选择图片文件（PNG / JPG）")));
    const rd = new FileReader();
    rd.onerror = () => reject(new Error(mtT("อ่านไฟล์ไม่ได้", "Can't read the file", "无法读取文件")));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(mtT("เปิดรูปไม่ได้", "Can't open the image", "无法打开图片")));
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        let url = file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
        if (url.length > 280000) url = c.toDataURL("image/jpeg", 0.7);
        if (url.length > 280000) return reject(new Error(mtT("รูปใหญ่เกินไป ลองรูปที่เล็กลง", "Image too large — try a smaller one", "图片过大，请换一张较小的")));
        resolve(url);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}

const mtFld = () => Object.assign({}, mtField, { background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });
const mtPCard = () => window.mtPanel({ display: "flex", flexDirection: "column", gap: 14 });

/* ---------- ข้อมูลบริษัท (ผู้ออกบิล) + โลโก้ · มีตัวอย่างหัวบิลให้ดูก่อนบันทึก ---------- */
function MtCompanyForm({ pid, company, self, onDone }) {
  const c = company || {};
  const init = { name: c.name || "", tax: c.tax || "", branch: c.branch || "", addr: c.addr || "", phone: c.phone || "", email: c.email || "", logo: c.logo || "" };
  const [f, setF] = React.useState(init);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const dirty = Object.keys(init).some((k) => init[k] !== f[k]);
  const set = (k, v) => { setMsg(""); setF(Object.assign({}, f, { [k]: v })); };
  const take = async (file) => { setErr(""); try { set("logo", await mtLogoFromFile(file)); } catch (x) { setErr(String(x.message || x)); } };
  const pick = (e) => { const file = e.target.files && e.target.files[0]; e.target.value = ""; take(file); };
  const save = async () => {
    setBusy(true); setErr(""); setMsg("");
    try { await mtCall(Object.assign({ action: "company", company: f }, self ? {} : { pid })); setMsg(mtT("บันทึกแล้ว", "Saved", "已保存")); if (onDone) onDone(); } catch (x) { setErr(String(x.message || x)); }
    setBusy(false);
  };
  const fld = mtFld();
  const row = (k, label, ph, span, mono) => (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      <div style={mtLbl}>{label}</div>
      <input value={f[k]} placeholder={ph || ""} onChange={(e) => set(k, k === "tax" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value)}
        style={Object.assign({}, fld, mono ? { fontFamily: "var(--mono)" } : {})} />
    </div>
  );
  const P = (k) => "var(--paper-" + k + ")";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "start" }}>
      <div style={mtPCard()}>
        <window.MtHead icon="building" color="var(--primary)" title={mtT("ข้อมูลบริษัท", "Company details", "公司信息")} sub={mtT("ขึ้นเป็นผู้ออกบิลบนใบแจ้งค่าไฟทุกไซต์ของบัญชีนี้", "Shown as the issuer on every bill for this account's sites", "作为开具方显示在本账户所有站点的电费单上")} />
        <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files && e.dataTransfer.files[0]); }}
          style={{ display: "flex", gap: 14, alignItems: "center", padding: 12, borderRadius: "var(--r-tile)", cursor: "pointer",
            background: drag ? "var(--primary-soft)" : "var(--surface2)", boxShadow: drag ? "inset 0 0 0 1.5px var(--primary)" : "var(--shadow-inset)" }}>
          <div style={{ width: 132, height: 76, borderRadius: 12, background: "var(--paper-bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "var(--shadow-sm)" }}>
            {f.logo ? <img src={f.logo} alt="" style={{ maxWidth: "90%", maxHeight: "86%", objectFit: "contain" }} /> : <Icon name="image" size={26} color="var(--paper-mute)" />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{f.logo ? mtT("เปลี่ยนโลโก้", "Change logo", "更换标志") : mtT("เพิ่มโลโก้บริษัท", "Add company logo", "添加公司标志")}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>{mtT("คลิกหรือลากรูปมาวาง · PNG พื้นใสสวยที่สุด · ระบบย่อรูปให้เอง", "Click or drop an image · a transparent PNG looks best · resized automatically", "点击或拖入图片 · 透明背景 PNG 效果最佳 · 系统自动缩放")}</div>
            {f.logo && <button type="button" className="btn btn-sm btn-dngr" onClick={(e) => { e.preventDefault(); set("logo", ""); }} style={{ marginTop: 6 }}>{mtT("เอาโลโก้ออก", "Remove logo", "移除标志")}</button>}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} style={{ display: "none" }} />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {row("name", mtT("ชื่อบริษัท", "Company name", "公司名称"), mtT("เช่น บริษัท พลังแดด จำกัด", "e.g. Palangdad Co., Ltd.", "例如：Palangdad 有限公司"), true)}
          {row("tax", mtT("เลขประจำตัวผู้เสียภาษี", "Tax ID", "纳税人识别号"), mtT("13 หลัก", "13 digits", "13 位"), false, true)}
          {row("branch", mtT("สาขา", "Branch", "分支机构"), mtT("สำนักงานใหญ่", "Head office", "总部"))}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={mtLbl}>{mtT("ที่อยู่", "Address", "地址")}</div>
            <textarea rows={3} value={f.addr} onChange={(e) => set("addr", e.target.value)} style={Object.assign({}, fld, { resize: "vertical" })} />
          </div>
          {row("phone", mtT("โทร", "Phone", "电话"))}
          {row("email", mtT("อีเมล", "Email", "电子邮箱"))}
        </div>
        {err && <div style={mtErrBox}>{err}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
          {msg && !dirty && <span style={{ fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700, display: "inline-flex", gap: 5, alignItems: "center" }}><Icon name="check" size={14} sw={2.6} />{msg}</span>}
          <button className="btn btn-pri" disabled={busy || !dirty} onClick={save}>{busy ? mtT("กำลังบันทึก…", "Saving…", "保存中…") : mtT("บันทึกข้อมูลบริษัท", "Save company details", "保存公司信息")}</button>
        </div>
      </div>
      {/* ตัวอย่างหัวบิล — ตรงกับกระดาษบิลจริง (MtBillPaper) */}
      <div style={mtPCard()}>
        <window.MtHead icon="eye" title={mtT("ตัวอย่างหัวบิล", "Bill header preview", "账单抬头预览")} sub={mtT("หน้าตาบนใบแจ้งค่าไฟที่ลูกค้าได้รับ", "How it looks on the bill your customer receives", "客户收到的电费单上的样子")} />
        <div style={{ background: P("bg"), color: P("ink"), borderRadius: 12, boxShadow: "var(--shadow-sm)", padding: 10 }}>
          <div style={{ border: "1px solid " + P("line2"), borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: 5, background: "linear-gradient(90deg, " + P("brand") + ", " + P("brand-dk") + ")" }} />
          <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "1 1 200px", minWidth: 0 }}>
              {f.logo && <img src={f.logo} alt="" style={{ maxHeight: 52, maxWidth: 110, objectFit: "contain" }} />}
              <div style={{ fontSize: 11, color: P("ink2"), lineHeight: 1.5, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: P("ink") }}>{f.name || <span style={{ color: P("mute") }}>{mtT("ชื่อบริษัท", "Company name", "公司名称")}</span>}</div>
                {f.addr && <div style={{ whiteSpace: "pre-line" }}>{f.addr}</div>}
                {(f.tax || f.phone || f.email) && <div>{[f.tax ? mtT("เลขประจำตัวผู้เสียภาษี ", "Tax ID ", "纳税人识别号 ") + f.tax + (f.branch ? " (" + f.branch + ")" : "") : "", f.phone ? mtT("โทร ", "Tel. ", "电话 ") + f.phone : "", f.email].filter(Boolean).join(" · ")}</div>}
              </div>
            </div>
            <div style={{ textAlign: "right", marginLeft: "auto" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: P("brand-dk") }}>{mtT("ใบแจ้งค่าไฟฟ้า", "Electricity Bill", "电费通知单")}</div>
              <div style={{ fontSize: 10.5, color: P("ink3") }}>{mtT("ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์", "Solar power generation system", "太阳能发电系统")}</div>
            </div>
          </div>
          <div style={{ height: 1, background: P("line3"), margin: "12px 0 10px" }} />
          {[70, 92, 55].map((w, i) => <div key={i} style={{ height: 7, width: w + "%", borderRadius: 4, background: P("line3"), marginBottom: 7 }} />)}
          </div></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- พาร์ทเนอร์เปลี่ยนรหัสตัวเอง ---------- */
function MtPinForm() {
  const [old, setOld] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const save = async () => {
    setErr(""); setMsg("");
    if (pin !== pin2) return setErr(mtT("รหัสใหม่สองช่องไม่ตรงกัน", "The two new passwords don't match", "两次输入的新密码不一致"));
    setBusy(true);
    try { await mtCall({ action: "partner-pin", old, pin }); setMsg(mtT("เปลี่ยนรหัสแล้ว — ใช้รหัสใหม่ในการเข้าครั้งถัดไป", "Password changed — use the new one next time you sign in", "密码已更改 — 下次登录请使用新密码")); setOld(""); setPin(""); setPin2(""); } catch (x) { setErr(String(x.message || x)); }
    setBusy(false);
  };
  const fld = mtFld();
  const strong = pin.length >= 10 ? 3 : pin.length >= 8 ? 2 : pin.length >= 6 ? 1 : 0;
  const t = show ? "text" : "password";
  return (
    <div style={Object.assign(mtPCard(), { maxWidth: 460, width: "100%", margin: "0 auto" })}>
      <window.MtHead icon="lock" color="var(--primary)" title={mtT("เปลี่ยนรหัสผ่าน", "Change password", "更改密码")} sub={mtT("รหัสใหม่อย่างน้อย 6 ตัว", "New password: at least 6 characters", "新密码至少 6 位")} />
      <div><div style={mtLbl}>{mtT("รหัสเดิม", "Current password", "当前密码")}</div><input type={t} value={old} autoComplete="current-password" onChange={(e) => setOld(e.target.value)} style={fld} /></div>
      <div>
        <div style={mtLbl}>{mtT("รหัสใหม่", "New password", "新密码")}</div>
        <input type={t} value={pin} autoComplete="new-password" onChange={(e) => setPin(e.target.value)} style={fld} />
        <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
          {[1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: strong >= i ? (strong === 1 ? "var(--tint-amber-tx)" : "var(--tint-ok-tx)") : "var(--surface3)" }} />)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{pin ? mtT(["สั้นเกินไป", "ใช้ได้", "ดี", "ดีมาก"], ["Too short", "OK", "Good", "Very good"], ["太短", "可用", "良好", "很好"])[strong]
          : mtT("ยาวกว่า 8 ตัว และผสมตัวเลข/ตัวอักษรจะปลอดภัยกว่า", "Longer than 8 characters with letters and numbers is safer", "超过 8 位并混合字母和数字更安全")}</div>
      </div>
      <div><div style={mtLbl}>{mtT("ยืนยันรหัสใหม่", "Confirm new password", "确认新密码")}</div><input type={t} value={pin2} autoComplete="new-password" onChange={(e) => setPin2(e.target.value)} style={fld} />
        {pin2 && pin !== pin2 && <div style={{ fontSize: 11, color: "var(--tint-red-tx)", marginTop: 4 }}>{mtT("ยังไม่ตรงกับรหัสใหม่", "Doesn't match the new password", "与新密码不一致")}</div>}</div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--text-2)", cursor: "pointer" }}><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />{mtT("แสดงรหัส", "Show password", "显示密码")}</label>
      {err && <div style={mtErrBox}>{err}</div>}
      {msg && <div style={{ fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700 }}>{msg}</div>}
      <button className="btn btn-pri" disabled={busy || !old || pin.length < 6 || pin !== pin2} onClick={save}>{busy ? mtT("กำลังบันทึก…", "Saving…", "保存中…") : mtT("เปลี่ยนรหัส", "Change password", "更改密码")}</button>
    </div>
  );
}

/* ---------- แอดมิน: บัญชีพาร์ทเนอร์ + มอบไซต์ ---------- */
function MtPartnerEdit({ p, sites, partners, onClose }) {
  const isNew = !p;
  const [f, setF] = React.useState({ name: (p && p.name) || "", username: (p && p.username) || "", pin: "", active: !p || p.active !== false,
    sites: Object.keys((p && p.sites) || {}).map(Number) });
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
  const ownerName = (pid) => (partners[pid] && ((partners[pid].company && partners[pid].company.name) || partners[pid].name)) || pid;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={mtPCard()}>
        <window.MtHead icon="user" color="var(--primary)" title={isNew ? mtT("เพิ่มบัญชีพาร์ทเนอร์", "Add partner account", "添加合作方账户") : mtT("บัญชี ", "Account ", "账户 ") + p.name}
          sub={mtT("ล็อกอินที่หน้าเว็บนี้ด้วยชื่อล็อกอิน + รหัส · เห็นเฉพาะไซต์ที่ติ๊กด้านล่าง", "Signs in on this website with username + password · sees only the sites ticked below", "使用登录名和密码登录本网站 · 仅可查看下方勾选的站点")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          <div><div style={mtLbl}>{mtT("ชื่อผู้ใช้งาน (คน/ทีม)", "Display name (person / team)", "使用者名称（个人/团队）")}</div><input value={f.name} onChange={(e) => set("name", e.target.value)} style={fld} placeholder={mtT("เช่น คุณสมชาย (นักลงทุน)", "e.g. Mr. Somchai (investor)", "例如：Somchai 先生（投资方）")} /></div>
          <div><div style={mtLbl}>{mtT("ชื่อล็อกอิน", "Username", "登录名")}</div><input value={f.username} onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))} style={Object.assign({}, fld, { fontFamily: "var(--mono)" })} placeholder="a-z 0-9 . _ -" /></div>
          <div><div style={mtLbl}>{isNew ? mtT("รหัสผ่าน (อย่างน้อย 6 ตัว)", "Password (at least 6 characters)", "密码（至少 6 位）") : mtT("ตั้งรหัสใหม่ (เว้นว่าง = ใช้รหัสเดิม)", "New password (blank = keep current)", "设置新密码（留空 = 保持原密码）")}</div><input value={f.pin} onChange={(e) => set("pin", e.target.value)} style={Object.assign({}, fld, { fontFamily: "var(--mono)" })} autoComplete="new-password" /></div>
        </div>
        <label style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 13, cursor: "pointer", padding: "10px 12px", borderRadius: "var(--r-tile)", background: f.active ? "var(--tint-ok-bg)" : "var(--tint-red-bg)" }}>
          <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
          <span style={{ fontWeight: 700, color: f.active ? "var(--tint-ok-tx)" : "var(--tint-red-tx)" }}>{f.active ? mtT("เปิดใช้งาน", "Active", "已启用") : mtT("ปิดบัญชี", "Disabled", "已停用")}</span>
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>{f.active ? mtT("เข้าระบบได้", "Can sign in", "可以登录") : mtT("เข้าระบบไม่ได้ (ข้อมูลและบิลยังอยู่)", "Can't sign in (data and bills are kept)", "无法登录（数据和账单仍保留）")}</span>
        </label>
      </div>
      <div style={mtPCard()}>
        <window.MtHead icon="building" title={mtT("ไซต์ที่บัญชีนี้เห็นและออกบิลได้", "Sites this account can see and bill", "此账户可查看并开具账单的站点")}
          sub={mtT(f.sites.length + " ไซต์ · ไซต์ละหนึ่งเจ้าของ — ติ๊กไซต์ที่มีเจ้าของแล้ว = ย้ายมาบัญชีนี้", f.sites.length + " sites · one owner per site — ticking a site that already has an owner moves it here", f.sites.length + " 个站点 · 每个站点只有一个所有者 — 勾选已有所有者的站点 = 转移到此账户")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {sites.map((s) => {
            const on = f.sites.includes(s.n);
            const other = s.owner && (!p || s.owner !== p.id);
            return (
              <button key={s.n} type="button" onClick={() => toggle(s.n)}
                style={{ textAlign: "left", border: "none", fontFamily: "inherit", cursor: "pointer", padding: "11px 13px", borderRadius: "var(--r-tile)", display: "flex", gap: 10, alignItems: "flex-start",
                  background: on ? "var(--primary-soft)" : "var(--surface)", boxShadow: on ? "inset 0 0 0 1.5px var(--primary)" : "var(--shadow-sm)", color: "inherit" }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", marginTop: 1,
                  background: on ? "var(--primary)" : "var(--surface2)", boxShadow: on ? "none" : "var(--shadow-inset)" }}>{on && <Icon name="check" size={13} color="#fff" sw={3} />}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window.mtCustOf(s).cust || s.name}</span>
                  <span style={{ display: "block", fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-3)" }}>{mtIdent(s)}</span>
                  {other && <span style={{ display: "block", fontSize: 11, color: "var(--tint-amber-tx)", marginTop: 2 }}>{mtT("เจ้าของตอนนี้: ", "Current owner: ", "当前所有者：")}{ownerName(s.owner)}</span>}
                </span>
              </button>
            );
          })}
          {!sites.length && <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{mtT("ยังไม่มีไซต์", "No sites yet", "暂无站点")}</div>}
        </div>
      </div>
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={window.mtPanel({ padding: "12px 16px", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", position: "sticky", bottom: 10, zIndex: 2 })}>
        <button className="btn" onClick={onClose} disabled={busy}>{mtT("ยกเลิก", "Cancel", "取消")}</button>
        <button className="btn btn-pri" onClick={save} disabled={busy || !f.name || !f.username || (isNew && f.pin.length < 6)}>{busy ? mtT("กำลังบันทึก…", "Saving…", "保存中…") : isNew ? mtT("สร้างบัญชี", "Create account", "创建账户") : mtT("บันทึก", "Save", "保存")}</button>
      </div>
      {!isNew && <MtCompanyForm key={p.id + (p.updated_at || "")} pid={p.id} company={p.company} />}
    </div>
  );
}

function MtPartnerAdmin({ sites, onBack }) {
  const all = useMtRef("mtPartners");
  const [edit, setEdit] = React.useState(null);   // null | "new" | pid
  const partners = all || {};
  const list = Object.values(partners).filter((p) => p && p.id).sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  const siteBy = {};
  (sites || []).forEach((s) => { siteBy[s.n] = s; });
  const back = <button className="btn btn-sm" onClick={edit ? () => setEdit(null) : onBack} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="chevronLeft" size={14} />{edit ? mtT("รายชื่อพาร์ทเนอร์", "Partner list", "合作方列表") : mtT("ทุกไซต์", "All sites", "所有站点")}</button>;
  if (edit) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>{back}</div>
      <MtPartnerEdit key={edit} p={edit === "new" ? null : partners[edit]} sites={sites} partners={partners} onClose={() => setEdit(null)} />
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={window.mtPanel({ display: "flex", flexDirection: "column", gap: 12 })}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {back}
          <span style={{ marginLeft: "auto" }}><MtLangPick /></span>
          <button className="btn btn-pri" onClick={() => setEdit("new")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="plus" size={14} />{mtT("เพิ่มบัญชี", "Add account", "添加账户")}</button>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <window.MtBubble icon="users" color="var(--primary)" size={46} />
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700 }}>{mtT("บัญชีพาร์ทเนอร์ / นักลงทุน", "Partner / investor accounts", "合作方 / 投资方账户")}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{mtT("ผู้ใช้ภายนอกล็อกอินที่หน้าเว็บนี้แล้วเห็นแค่ไซต์ที่มอบให้ · ลงทะเบียนไซต์ ตั้งราคา และออกบิลเองได้ (เลขมิเตอร์แก้ไม่ได้)", "External users sign in here and see only the sites assigned to them · they can register sites, set rates and issue bills (meter readings can't be edited)", "外部用户在此登录后只能看到分配的站点 · 可登记站点、设置单价并自行开具账单（电表读数不可修改）")}</div>
          </div>
        </div>
      </div>
      {all === undefined ? <div style={mtPCard()}><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{mtT("กำลังโหลด…", "Loading…", "加载中…")}</div></div>
        : !list.length ? (
          <div style={window.mtPanel({ padding: "34px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 })}>
            <window.MtBubble icon="user" color="var(--primary)" size={50} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>{mtT("ยังไม่มีบัญชีพาร์ทเนอร์", "No partner accounts yet", "暂无合作方账户")}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{mtT('กด "เพิ่มบัญชี" เพื่อสร้างบัญชีแรกและมอบไซต์ให้', 'Press "Add account" to create the first account and assign sites', "点击“添加账户”创建第一个账户并分配站点")}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {list.map((p) => {
              const ns = Object.keys(p.sites || {}).map(Number).sort((a, b) => a - b);
              const off = p.active === false;
              return (
                <button key={p.id} type="button" className="mt-lift" onClick={() => setEdit(p.id)}
                  style={{ textAlign: "left", border: "none", fontFamily: "inherit", color: "inherit", cursor: "pointer", background: "var(--surface)", boxShadow: "var(--shadow-card)",
                    borderRadius: "var(--r-card)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, opacity: off ? 0.7 : 1 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 64, height: 44, borderRadius: 10, background: "var(--paper-bg)", boxShadow: "var(--shadow-sm)", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
                      {p.company && p.company.logo ? <img src={p.company.logo} alt="" style={{ maxWidth: "88%", maxHeight: "80%", objectFit: "contain" }} /> : <Icon name="building" size={20} color="var(--paper-mute)" />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(p.company && p.company.name) || p.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name} · <span style={{ fontFamily: "var(--mono)" }}>{p.username}</span></div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                      background: off ? "var(--tint-red-bg)" : "var(--tint-ok-bg)", color: off ? "var(--tint-red-tx)" : "var(--tint-ok-tx)" }}>{off ? mtT("ปิดบัญชี", "Disabled", "已停用") : mtT("ใช้งาน", "Active", "使用中")}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {ns.length ? ns.map((n) => (
                      <span key={n} style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: "var(--r-chip)", background: "var(--surface2)", color: "var(--text-2)" }}>
                        {siteBy[n] ? window.mtCustOf(siteBy[n]).cust || siteBy[n].name : "SITE" + mtPad(n)}
                      </span>
                    )) : <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{mtT("ยังไม่ได้มอบไซต์", "No sites assigned", "未分配站点")}</span>}
                  </div>
                  {!(p.company && p.company.name) && <div style={{ fontSize: 11.5, color: "var(--tint-amber-tx)" }}>{mtT("ยังไม่กรอกข้อมูลบริษัท (หัวบิลจะว่าง)", "Company details missing (bill header will be blank)", "尚未填写公司信息（账单抬头将为空）")}</div>}
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ---------- แอปของพาร์ทเนอร์ (แทนทั้งหน้า) ---------- */
function PartnerApp() {
  const uid = window.FBAUTH && window.FBAUTH.currentUser ? window.FBAUTH.currentUser.uid : "";
  const me = useMtRef(uid ? "mtPartners/" + uid : "");
  const [view, setView] = React.useState("sites");
  useMtLang();   // สลับภาษา = วาดใหม่ทั้งแอป
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const logout = async () => {
    const ok = window.askConfirm ? await window.askConfirm({ title: mtT("ออกจากระบบ?", "Sign out?", "退出登录？"), body: mtT("ต้องใส่ชื่อล็อกอินและรหัสอีกครั้งเมื่อกลับมา", "You'll need your username and password to come back", "返回时需要重新输入登录名和密码"), ok: mtT("ออกจากระบบ", "Sign out", "退出登录"), icon: "power" }) : true;
    if (!ok) return;
    try { localStorage.removeItem("solarflow_session_v1"); } catch (e) {}
    (window.FBAUTH ? window.FBAUTH.signOut() : Promise.resolve()).then(() => location.reload(), () => location.reload());
  };
  /* body ของแอปเป็น overflow:hidden (แอปพนักงานเลื่อนในกล่องตัวเอง) → หน้านี้ต้องเป็นกล่องเลื่อนเอง ไม่งั้นลูกกลิ้งเลื่อนไม่ได้ (ผู้ใช้ 2026-11-12) */
  const wrap = { height: "calc(100dvh - var(--kb, 0px))", overflowY: "auto", WebkitOverflowScrolling: "touch", color: "var(--text-1)",
    background: "radial-gradient(1200px 520px at 85% -10%, color-mix(in srgb, var(--fs-sun, #E8930C) 10%, transparent), transparent 70%),"
      + " radial-gradient(900px 480px at -10% 0%, color-mix(in srgb, var(--primary) 9%, transparent), transparent 70%), var(--bg)" };
  const inner = { maxWidth: 1240, margin: "0 auto", padding: isMobile ? "12px 12px 28px" : "18px 22px 36px", display: "flex", flexDirection: "column", gap: 16, boxSizing: "border-box" };
  if (me === undefined) return <div style={wrap}><div style={inner}><div style={{ color: "var(--text-3)", fontSize: 13, padding: 24 }}>{mtT("กำลังโหลด…", "Loading…", "加载中…")}</div></div></div>;
  if (!me || me.active === false) return (
    <div style={wrap}><div style={Object.assign({}, inner, { maxWidth: 460, paddingTop: 80 })}>
      <div style={window.mtPanel({ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", padding: "32px 24px" })}>
        <window.MtBubble icon="lock" color="var(--tint-red-tx)" size={50} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>{mtT("บัญชีนี้ถูกปิดหรือไม่พบข้อมูล", "This account is disabled or not found", "此账户已停用或不存在")}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{mtT("ติดต่อผู้ดูแลระบบเพื่อเปิดบัญชี", "Contact the administrator to enable it", "请联系管理员启用账户")}</div>
        <button className="btn" onClick={logout}>{mtT("ออกจากระบบ", "Sign out", "退出登录")}</button>
      </div>
    </div></div>
  );
  const c = me.company || {};
  const opts = [{ value: "sites", label: mtT("ไซต์ของฉัน", "My sites", "我的站点"), icon: "sun" }, { value: "company", label: mtT("บริษัท", "Company", "公司"), icon: "building" },
    { value: "pin", label: mtT("รหัสผ่าน", "Password", "密码"), icon: "lock" }];
  const nsite = Object.keys(me.sites || {}).length;
  return (
    <div style={wrap}>
      <div style={inner}>
        <div style={window.mtPanel({ padding: isMobile ? "12px 14px" : "12px 18px", display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, flexWrap: "wrap" })}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: isMobile ? "1 1 0" : "1 1 240px" }}>
            <div style={{ width: 58, height: 42, borderRadius: 10, background: "var(--paper-bg)", boxShadow: "var(--shadow-sm)", display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
              {c.logo ? <img src={c.logo} alt="" style={{ maxWidth: "88%", maxHeight: "80%", objectFit: "contain" }} /> : <Icon name="sun" size={22} color="var(--fs-sun, #E8930C)" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || me.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name} · {mtT(nsite + " ไซต์ · ระบบติดตามโซลาร์และบิลค่าไฟ", nsite + (nsite === 1 ? " site" : " sites") + " · solar monitoring & billing", nsite + " 个站点 · 太阳能监控与电费")}</div>
            </div>
          </div>
          {window.Segmented && <div style={{ overflowX: "auto", maxWidth: "100%", order: isMobile ? 3 : 0, flex: isMobile ? "1 1 0" : "0 1 auto", minWidth: 0 }}><window.Segmented value={view} onChange={setView} options={opts} /></div>}
          <MtLangPick compact={isMobile} />
          {isMobile && <div style={{ order: 2, flexBasis: "100%", height: 0 }} />}
          <button className="btn btn-sm" onClick={logout} title={mtT("ออกจากระบบ", "Sign out", "退出登录")} style={{ display: "inline-flex", alignItems: "center", gap: 6, order: isMobile ? 4 : 0 }}><Icon name="power" size={13} />{isMobile ? "" : mtT("ออกจากระบบ", "Sign out", "退出登录")}</button>
        </div>
        {view === "sites" && !c.name && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "11px 14px", borderRadius: "var(--r-tile)", background: "var(--tint-amber-bg)" }}>
            <Icon name="alert" size={16} color="var(--tint-amber-tx)" />
            <span style={{ flex: "1 1 240px", fontSize: 12.5, fontWeight: 600, color: "var(--tint-amber-tx)" }}>{mtT("ยังไม่ได้กรอกข้อมูลบริษัท — หัวบิลค่าไฟจะยังไม่มีชื่อผู้ออกบิล", "Company details not filled in — bills won't show an issuer name yet", "尚未填写公司信息 — 电费单暂不显示开具方名称")}</span>
            <button className="btn btn-sm btn-soft" onClick={() => setView("company")}>{mtT("กรอกข้อมูลบริษัท", "Fill in company details", "填写公司信息")}</button>
          </div>
        )}
        {view === "company" ? <MtCompanyForm key={"c" + (me.updated_at || "")} pid={me.id} company={c} self />
          : view === "pin" ? <MtPinForm />
          : <MtMonView partner={me} />}
        <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", paddingTop: 4 }}>
          {mtT("ข้อมูลมิเตอร์อ่านอัตโนมัติทุก 1 นาที · ให้บริการระบบโดย ", "Meter data is read automatically every minute · service by ", "电表数据每分钟自动读取 · 系统服务商 ")}<span style={{ fontFamily: "var(--brand-font, var(--display))", fontWeight: 700 }}>flash+solar</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useMtPartnerData, MtPartnerAdmin, MtCompanyForm, PartnerApp });
