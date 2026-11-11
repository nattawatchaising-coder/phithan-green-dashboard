/* ============================================================
   ไซต์ MikroTik (เฟส 1) — ลงทะเบียนไซต์ · สร้างสคริปต์ RouterOS (.rsc) + peer ฝั่งเซิร์ฟเวอร์ WireGuard
   อ่าน docs/mikrotik.md ก่อนแก้

   หน้าเว็บอ่าน mtSites/ อย่างเดียว — สร้าง/แก้/ลบ/ขอสคริปต์ผ่าน /api/mikrotik/site เท่านั้น
   (เซิร์ฟเวอร์ตรวจแอดมินซ้ำ · กุญแจลับอยู่ mtSecrets/ ที่เข้ารหัสไว้ เบราว์เซอร์ไม่อ่าน)
   สคริปต์ที่ได้มาอยู่ในหน่วยความจำของหน้านี้เท่านั้น ไม่เก็บลงฐานข้อมูล/localStorage
   ============================================================ */

const MT_N_MAX = 244;
const MT_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,23}$/;
const mtPad = (n) => String(n).padStart(2, "0");
const mtIdent = (s) => "SITE" + mtPad(s.n) + "-" + s.name;
const mtWhen = (iso) => (iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "—");

async function mtCall(payload) {
  const u = window.FBAUTH && window.FBAUTH.currentUser;
  if (!u) throw new Error("ยังไม่ได้ล็อกอินผ่านเซิร์ฟเวอร์ — ออกจากระบบแล้วเข้าใหม่");
  const tok = await u.getIdToken();
  const r = await fetch("/api/mikrotik/site", { method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + tok }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
  return j;
}

function useMtSites() {
  const [val, setVal] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!window.FBDB) { setLoading(false); return; }
    const ref = window.FBDB.ref("mtSites");
    const h = ref.on("value", (s) => { setVal(s.val()); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const list = React.useMemo(() => {
    const v = val || {};
    return Object.keys(v).map((k) => Object.assign({}, v[k], { n: Number(k) })).filter((s) => s.n > 0).sort((a, b) => a.n - b.n);
  }, [val]);
  return { list, loading };
}

function useMtConfig() {
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/mikrotik/site").then((r) => r.json()).then((j) => alive && setCfg(j)).catch(() => alive && setCfg({ configured: false, missing: ["(เรียก /api/mikrotik/site ไม่ได้)"] }));
    return () => { alive = false; };
  }, []);
  return cfg;
}

function MtSpec({ label, value, mono }) {
  return (
    <div className="bq-spec" style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "8px 11px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", fontFamily: mono ? "var(--mono)" : "inherit",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={String(value)}>{value}</div>
    </div>
  );
}

const mtLbl = { fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 };
const mtErrBox = { fontSize: 12.5, color: "var(--tint-red-tx)", background: "var(--tint-red-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 };
const mtField = { width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 13.5, borderRadius: "var(--r-tile)", border: "none", fontFamily: "inherit" };

/* ฟอร์มเพิ่ม/แก้ไซต์ — site = null คือเพิ่มใหม่ */
function MtSiteForm({ site, used, onDone, onCancel }) {
  const isNew = !site;
  const nextFree = React.useMemo(() => { for (let i = 1; i <= MT_N_MAX; i++) if (!used.has(i)) return i; return ""; }, [used]);
  const [n, setN] = React.useState(isNew ? String(nextFree) : String(site.n));
  const [name, setName] = React.useState(isNew ? "" : site.name);
  const [note, setNote] = React.useState(isNew ? "" : site.note || "");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const nNum = Number(n);
  const nErr = !/^\d+$/.test(n) || nNum < 1 || nNum > MT_N_MAX ? "1–" + MT_N_MAX
    : isNew && used.has(nNum) ? "เลขนี้ถูกใช้แล้ว" : "";
  const nameErr = name && !MT_NAME_RE.test(name) ? "ใช้ได้แค่ A-Z a-z 0-9 และ - (ไม่เกิน 24 ตัว)" : "";
  const ok = !nErr && name && !nameErr && !busy;
  const save = async () => {
    setBusy(true); setErr("");
    try { await mtCall({ action: isNew ? "create" : "edit", n: nNum, name, note }); onDone(nNum); }
    catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{isNew ? "เพิ่มไซต์ใหม่" : "แก้ไซต์ " + mtPad(site.n)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
        <div>
          <div style={mtLbl}>เลขไซต์ N</div>
          <input type="number" min="1" max={MT_N_MAX} value={n} disabled={!isNew} onChange={(e) => setN(e.target.value)}
            style={Object.assign({}, mtField, { textAlign: "right", fontFamily: "var(--mono)" })} />
          {nErr && <div style={{ fontSize: 11, color: "var(--tint-red-tx)", marginTop: 4 }}>{nErr}</div>}
        </div>
        <div>
          <div style={mtLbl}>ชื่อไซต์ (ภาษาอังกฤษ — ใช้ตั้งชื่อเราเตอร์)</div>
          <input value={name} placeholder="เช่น ThaiSteel" onChange={(e) => setName(e.target.value.trim())} style={mtField} />
          {nameErr && <div style={{ fontSize: 11, color: "var(--tint-red-tx)", marginTop: 4 }}>{nameErr}</div>}
        </div>
      </div>
      <div>
        <div style={mtLbl}>หมายเหตุ</div>
        <textarea rows={2} value={note} maxLength={500} placeholder="ที่ตั้ง · ผู้ติดต่อโรงงาน · ข้อควรรู้" onChange={(e) => setNote(e.target.value)} style={Object.assign({}, mtField, { resize: "vertical" })} />
      </div>
      {!nErr && name && !nameErr && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
          <MtSpec label="ชื่อเราเตอร์" value={"SITE" + mtPad(nNum) + "-" + name} mono />
          <MtSpec label="LAN" value={"10.10." + nNum + ".0/24"} mono />
          <MtSpec label="IP ใน WireGuard" value={"10.99.0." + (10 + nNum)} mono />
        </div>
      )}
      {!isNew && name !== site.name && <div style={{ fontSize: 12, color: "var(--tint-amber-tx)" }}>เปลี่ยนชื่อแล้วต้องสร้างสคริปต์ใหม่ไปรันที่เราเตอร์ ชื่อเครื่องจึงจะเปลี่ยน</div>}
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onCancel} disabled={busy}>ยกเลิก</button>
        <button className="btn btn-pri" onClick={save} disabled={!ok}>{busy ? "กำลังบันทึก…" : isNew ? "สร้างไซต์ + คีย์" : "บันทึก"}</button>
      </div>
    </div>
  );
}

function mtCopy(text, setMsg) {
  const done = () => { setMsg("คัดลอกแล้ว"); setTimeout(() => setMsg(""), 1800); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => setMsg("คัดลอกไม่ได้ — เลือกข้อความเอง"));
  else setMsg("เบราว์เซอร์นี้คัดลอกอัตโนมัติไม่ได้ — เลือกข้อความเอง");
}
function mtDownload(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function MtScriptBox({ title, sub, text, filename }) {
  const [msg, setMsg] = React.useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>
        <div style={{ flex: 1 }} />
        {msg && <span style={{ fontSize: 11.5, color: "var(--primary-dark)", fontWeight: 700 }}>{msg}</span>}
        <button className="btn btn-sm" onClick={() => mtCopy(text, setMsg)}>คัดลอก</button>
        {filename && <button className="btn btn-sm btn-soft" onClick={() => mtDownload(text, filename)}>ดาวน์โหลด {filename}</button>}
      </div>
      <textarea readOnly value={text} rows={Math.min(14, text.split("\n").length + 1)} spellCheck={false}
        style={Object.assign({}, mtField, { fontFamily: "var(--mono)", fontSize: 11.5, lineHeight: 1.5, whiteSpace: "pre", overflow: "auto", resize: "vertical" })} />
    </div>
  );
}

function MtSiteCard({ s, isAdmin, onEdit }) {
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");
  const [out, setOut] = React.useState(null);
  const act = async (kind) => {
    if (kind === "rotate") {
      const ok = await window.askConfirm({ title: "สร้างคีย์ใหม่ให้ " + mtIdent(s) + "?",
        body: "คีย์ WireGuard และรหัส user เว็บชุดเดิมใช้ไม่ได้ทันทีที่รันสคริปต์ใหม่ · ต้องรันสคริปต์ใหม่ที่เราเตอร์ และแก้ PublicKey ของ peer บนเซิร์ฟเวอร์ ไม่งั้นไซต์หลุด VPN",
        ok: "สร้างคีย์ใหม่", danger: true, icon: "alert" });
      if (!ok) return;
    }
    if (kind === "remove") {
      const ok = await window.askConfirm({ title: "ลบไซต์ " + mtIdent(s) + "?",
        body: "ลบทะเบียนไซต์และกุญแจที่เก็บไว้ถาวร กู้คืนไม่ได้ · ไม่แตะเราเตอร์จริง (ต้องลบ peer บนเซิร์ฟเวอร์เอง) · เลข " + s.n + " จะว่างให้ไซต์อื่นใช้",
        ok: "ลบถาวร", danger: true, icon: "trash" });
      if (!ok) return;
    }
    setBusy(kind); setErr("");
    try {
      const r = await mtCall({ action: kind, n: s.n });
      if (kind === "script") setOut(r); else setOut(null);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy("");
  };
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: "var(--r-pill)", background: "var(--primary-soft)", color: "var(--primary-dark)" }}>{mtPad(s.n)}</span>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)" }}>{mtIdent(s)}</div>
        {s.note && <div style={{ fontSize: 12, color: "var(--text-2)", flexBasis: "100%" }}>{s.note}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <MtSpec label="LAN" value={s.lan || "10.10." + s.n + ".0/24"} mono />
        <MtSpec label="hEX · SmartLogger · Waveshare" value={".1 · .10 · .20"} mono />
        <MtSpec label="IP ใน WireGuard" value={s.wg_ip || "10.99.0." + (10 + s.n)} mono />
        <MtSpec label="public key" value={s.wg_pub || "—"} mono />
        <MtSpec label="คีย์ชุดนี้สร้างเมื่อ" value={mtWhen(s.keys_at)} />
        <MtSpec label="ขอสคริปต์ล่าสุด" value={s.script_at ? mtWhen(s.script_at) + (s.script_by ? " · " + s.script_by : "") : "ยังไม่เคย"} />
      </div>
      {isAdmin && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-soft" disabled={!!busy} onClick={() => (out ? setOut(null) : act("script"))}>
            {busy === "script" ? "กำลังสร้าง…" : out ? "ซ่อนสคริปต์" : "สร้างสคริปต์ .rsc"}
          </button>
          <button className="btn" disabled={!!busy} onClick={() => onEdit(s)}>แก้ชื่อ/หมายเหตุ</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-dngr" disabled={!!busy} onClick={() => act("rotate")}>{busy === "rotate" ? "กำลังสร้าง…" : "สร้างคีย์ใหม่"}</button>
          <button className="btn btn-dngr" disabled={!!busy} onClick={() => act("remove")}>{busy === "remove" ? "กำลังลบ…" : "ลบไซต์"}</button>
        </div>
      )}
      {err && <div style={mtErrBox}>{err}</div>}
      {out && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
          <div style={{ fontSize: 12, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>
            สคริปต์มีกุญแจลับของไซต์ — ห้ามส่งในแชตกลุ่ม · รันเสร็จลบไฟล์ออกจากเราเตอร์และเครื่องตัวเอง
          </div>
          <MtScriptBox title="สคริปต์ RouterOS" sub="รันที่ hEX ด้วย /import (ต่อ WinBox ทาง MAC)" text={out.rsc} filename={out.filename} />
          <MtScriptBox title="peer ฝั่งเซิร์ฟเวอร์" sub="ต่อท้าย /etc/wireguard/wg0.conf แล้ว wg syncconf (docs/mikrotik.md)" text={out.peer} />
        </div>
      )}
    </div>
  );
}

function MtSitesView({ role }) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const { list, loading } = useMtSites();
  const cfg = useMtConfig();
  const [form, setForm] = React.useState(null); // null | "new" | site
  const used = React.useMemo(() => new Set(list.map((s) => s.n)), [list]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>ไซต์ MikroTik</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>hEX ต่อ WireGuard เข้าเซิร์ฟเวอร์ · ไซต์ N ใช้ LAN 10.10.N.0/24 และ 10.99.0.(10+N)</div>
          <div style={{ flex: 1 }} />
          {isAdmin && !form && <button className="btn-add" onClick={() => setForm("new")}><Icon name="plus" size={14} /> เพิ่มไซต์</button>}
        </div>
        {cfg && !cfg.configured && (
          <div style={{ fontSize: 12, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>
            ยังไม่ได้ตั้ง env ใน Vercel: {(cfg.missing || []).join(", ")} — สร้างไซต์/สคริปต์ไม่ได้จนกว่าจะตั้ง (docs/mikrotik.md)
          </div>
        )}
        {!isAdmin && <div style={{ fontSize: 12, color: "var(--text-3)" }}>สร้างไซต์และสคริปต์ได้เฉพาะบัญชีแอดมิน</div>}
      </div>

      {form && <MtSiteForm site={form === "new" ? null : form} used={used} onCancel={() => setForm(null)} onDone={() => setForm(null)} />}

      {loading ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
        : !list.length ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>ยังไม่มีไซต์</div>
        : list.map((s) => <MtSiteCard key={s.n} s={s} isAdmin={isAdmin} onEdit={(x) => setForm(x)} />)}
    </div>
  );
}

window.MtSitesView = MtSitesView;
