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
/* localhost (tools/devserver.js) ไม่มี /api/mikrotik — ต้องเปิดบนเว็บจริง */
const MT_NO_API = "หน้านี้ใช้ได้บนเว็บจริง (flashsolar.vercel.app) เท่านั้น — เครื่องทดสอบ localhost ไม่มี API ไซต์ MikroTik";
const mtWhen = (iso) => (iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "—");

async function mtCall(payload) {
  const u = window.FBAUTH && window.FBAUTH.currentUser;
  if (!u) throw new Error("ยังไม่ได้ล็อกอินผ่านเซิร์ฟเวอร์ — ออกจากระบบแล้วเข้าใหม่");
  const tok = await u.getIdToken();
  const r = await fetch("/api/mikrotik/site", { method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + tok }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 404 && !j.error) throw new Error(MT_NO_API);
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
    fetch("/api/mikrotik/site").then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => alive && setCfg(j)).catch(() => alive && setCfg({ configured: false, noApi: true, missing: [] }));
    return () => { alive = false; };
  }, []);
  return cfg;
}

function MtSpec({ label, value, mono }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "8px 11px", minWidth: 0 }}>
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

const mtPeerCmd = (peer) => "sudo mt-peer add <<'EOF'\n" + peer.replace(/\n+$/, "") + "\nEOF\n";
const mtStep = { fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" };

/* คำสั่งบรรทัดเดียว (api/mikrotik/rsc.mjs) — โทเคนในคำสั่งใช้ได้ครั้งเดียว 15 นาที ไม่มีไฟล์กุญแจค้างในคอม */
function MtFetchSteps({ out }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15e3); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.ceil((out.exp - now) / 60e3));
  const until = new Date(out.exp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 600, padding: "9px 12px", borderRadius: "var(--r-tile)",
        color: left ? "var(--tint-amber-tx)" : "var(--tint-red-tx)", background: left ? "var(--tint-amber-bg)" : "var(--tint-red-bg)" }}>
        {left ? "คำสั่งใช้ได้ครั้งเดียว ภายในเวลา " + until + " น. (อีก " + left + " นาที) — ห้ามส่งในแชต" : "คำสั่งหมดอายุแล้ว — กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" ใหม่"}
      </div>
      <div style={mtStep}>1) เพิ่ม peer บนเซิร์ฟเวอร์ (ทำก่อนหรือหลังข้อ 2 ก็ได้)</div>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>PowerShell พิมพ์ <code>ssh root@{out.server_host || "<IP ของ VPS>"}</code> → ใส่รหัส root → รอจนขึ้น <code>root@wg-server:~#</code> → วางกล่องนี้ (คลิกขวา) → ต้องขึ้น "เพิ่มไซต์ … แล้ว"</div>
      <MtScriptBox title="คำสั่งบน VPS" sub="" text={mtPeerCmd(out.peer)} />
      <div style={mtStep}>2) ตั้งค่า hEX — ether1 ต่อเน็ต · WinBox ต่อทาง MAC → New Terminal → วางบรรทัดนี้ กด Enter</div>
      <MtScriptBox title="คำสั่งบน hEX" sub="ดึงสคริปต์ → รัน → ลบไฟล์ทิ้งเอง · สร้างกุญแจรอบแรกขึ้น progress 1–2 นาที อย่ากด Q" text={out.command} />
      <details style={{ fontSize: 12, color: "var(--text-2)" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>ถ้าขึ้น error เรื่อง certificate / SSL</summary>
        <div style={{ margin: "8px 0", lineHeight: 1.6 }}>RouterOS บางเครื่องไม่มีใบรับรองกลางสำหรับตรวจ https — ใช้บรรทัดนี้แทน (คำสั่งเดิมยังไม่ถูกใช้ไป) · ใช้ที่ออฟฟิศเท่านั้น เพราะไม่ตรวจว่าคุยกับเว็บตัวจริง</div>
        <MtScriptBox title="ไม่ตรวจใบรับรอง" sub="" text={out.command_nocheck} />
      </details>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>3) เสร็จแล้วบรรทัดท้ายต้องขึ้น <b>OK - cert fingerprint</b> · เช็กบน VPS: <code>mt-peer list</code></div>
    </div>
  );
}

/* วิธีทำทีละขั้น — ผู้ใช้ขอ 2026-11-11 "ทำวิธีสอนทำด้วยนะ ไม่งั้นลืม" · อัปเดตเมื่อขั้นตอนเปลี่ยน (docs/mikrotik.md) */
const MT_HOWTO = [
  ["ลงทะเบียนไซต์ (เว็บ)", ["กด \"เพิ่มไซต์\" → เลข N ระบบเสนอเลขว่างให้ · ชื่อภาษาอังกฤษ (ใช้ตั้งชื่อเราเตอร์) · หมายเหตุใส่ไทยได้", "กด \"สร้างไซต์ + คีย์\""]],
  ["ขอคำสั่ง (เว็บ)", ["ที่การ์ดไซต์กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" → ได้ 2 กล่อง: คำสั่งบน VPS และคำสั่งบน hEX", "คำสั่งใช้ได้ครั้งเดียวใน 15 นาที — หมดอายุก็กดใหม่ได้เรื่อย ๆ"]],
  ["เพิ่ม peer บน VPS", ["เปิด PowerShell พิมพ์ ssh root@<IP VPS> (IP ขึ้นในขั้นตอนตอนกดคำสั่ง) → ใส่รหัส root (พิมพ์แล้วไม่เห็นตัวอักษร = ปกติ)", "รอจนบรรทัดขึ้นต้น root@wg-server:~# (ถ้ายังเป็น PS C:\… = ยังอยู่บนคอม)", "คลิกขวาวางกล่อง \"คำสั่งบน VPS\" → ต้องขึ้น \"เพิ่มไซต์ N แล้ว\""]],
  ["ตั้งค่า hEX (ที่ออฟฟิศ)", ["ether1 เสียบเน็ตออฟฟิศ · โน้ตบุ๊กเสียบ ether2–5", "WinBox → แท็บ Neighbors → คลิกช่อง MAC Address (ไม่ใช่ IP) → login", "เมนู New Terminal → คลิกขวาวางกล่อง \"คำสั่งบน hEX\" → Enter", "ขึ้น progress หมุน 1–2 นาที (สร้างกุญแจ) อย่ากด Q · จบต้องขึ้น \"OK - cert fingerprint: …\"", "error เรื่อง certificate/SSL → ใช้บรรทัดสำรองในหัวข้อ \"ถ้าขึ้น error…\""]],
  ["เช็กว่า VPN ติด (บน VPS)", ["mt-peer list → ต้องขึ้น \"ต่อล่าสุด … วินาทีที่แล้ว\"", "ping -c 3 10.10.N.1 → ต้องตอบกลับ"]],
  ["ตั้ง IP อุปกรณ์ในไซต์", ["SmartLogger = 10.10.N.10 · มิเตอร์/Waveshare (Modbus TCP 502) = 10.10.N.20", "mask 255.255.255.0 · gateway 10.10.N.1 ทุกตัว (ไม่ตั้ง gateway = VPN มองไม่เห็น)"]],
  ["ส่งหน้างาน", ["ช่างเสียบ ether1 เข้าเน็ตโรงงาน + อุปกรณ์ที่ ether2–5 แค่นั้น ไม่ต้องตั้งอะไร — VPN ต่อเอง", "เช็กจาก VPS ด้วย mt-peer list อีกครั้งหลังติดตั้ง"]],
];
const MT_TROUBLE = [
  ["ssh ขึ้น Connection timed out", "VPS เพิ่งเปิด/รีบูต รอ 5 นาที · หรือเน็ตบล็อกพอร์ต 22 ลอง hotspot มือถือ"],
  ["mt-peer: not recognized", "พิมพ์บนคอม (PS C:\…) ต้อง ssh เข้า VPS ก่อน"],
  ["hEX: link expired or already used", "คำสั่งหมดอายุ/ใช้ไปแล้ว → กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" ใหม่"],
  ["mt-peer list: ยังไม่เคยต่อ", "hEX ยังไม่ได้รันคำสั่ง / ether1 ไม่มีเน็ต / peer บน VPS ไม่ตรงคีย์ (สร้างคีย์ใหม่แล้วต้องวางคำสั่ง VPS ใหม่ด้วย)"],
  ["เปลี่ยนกุญแจ (รหัสหลุด)", "กด \"สร้างคีย์ใหม่\" → ทำขั้น 2–5 ใหม่ทั้งหมด"],
];
function MtHowTo() {
  return (
    <details style={{ fontSize: 12.5, color: "var(--text-2)" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--primary-dark)" }}>วิธีตั้งค่าไซต์ใหม่ทีละขั้น (กดเพื่อดู)</summary>
      <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.6 }}>
        {MT_HOWTO.map(([t, items]) => (
          <li key={t}><b style={{ color: "var(--text-1)" }}>{t}</b>
            <ul style={{ margin: "2px 0 0", paddingLeft: 18 }}>{items.map((x) => <li key={x}>{x}</li>)}</ul>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: 12, fontWeight: 700, color: "var(--text-1)" }}>ปัญหาที่เคยเจอ</div>
      <ul style={{ margin: "4px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
        {MT_TROUBLE.map(([q, a]) => <li key={q}><b>{q}</b> — {a}</li>)}
      </ul>
    </details>
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
      if (kind === "script" || kind === "fetch-token") setOut(Object.assign({ kind }, r)); else setOut(null);
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
          {/* ทางหลัก (ผู้ใช้ตั้ง hEX เองที่ออฟฟิศ 2026-11-11): คำสั่งบรรทัดเดียว hEX ดึงสคริปต์เอง · ดาวน์โหลด .rsc เป็นทางสำรอง (hEX ไม่มีเน็ต) */}
          <button className="btn btn-pri" disabled={!!busy} onClick={() => (out && out.kind === "fetch-token" ? setOut(null) : act("fetch-token"))}>
            {busy === "fetch-token" ? "กำลังสร้าง…" : out && out.kind === "fetch-token" ? "ซ่อนคำสั่ง" : "คำสั่งตั้งค่า (บรรทัดเดียว)"}
          </button>
          <button className="btn" disabled={!!busy} onClick={() => (out && out.kind === "script" ? setOut(null) : act("script"))}>
            {busy === "script" ? "กำลังสร้าง…" : out && out.kind === "script" ? "ซ่อนสคริปต์" : "ดาวน์โหลด .rsc"}
          </button>
          <button className="btn" disabled={!!busy} onClick={() => onEdit(s)}>แก้ชื่อ/หมายเหตุ</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-dngr" disabled={!!busy} onClick={() => act("rotate")}>{busy === "rotate" ? "กำลังสร้าง…" : "สร้างคีย์ใหม่"}</button>
          <button className="btn btn-dngr" disabled={!!busy} onClick={() => act("remove")}>{busy === "remove" ? "กำลังลบ…" : "ลบไซต์"}</button>
        </div>
      )}
      {err && <div style={mtErrBox}>{err}</div>}
      {out && out.kind === "fetch-token" && <MtFetchSteps out={out} />}
      {out && out.kind === "script" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
          <div style={{ fontSize: 12, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>
            สคริปต์มีกุญแจลับของไซต์ — ห้ามส่งในแชตกลุ่ม · รันเสร็จลบไฟล์ออกจากเราเตอร์และเครื่องตัวเอง
          </div>
          <MtScriptBox title="สคริปต์ RouterOS" sub="รันที่ hEX ด้วย /import (ต่อ WinBox ทาง MAC)" text={out.rsc} filename={out.filename} />
          {/* วางทั้งก้อนใน SSH ทีเดียวจบ (heredoc) — ผู้ใช้เคยกด Ctrl+D ก่อนวาง peer แล้วงง 2026-11-11 */}
          <MtScriptBox title="คำสั่งเพิ่ม peer บนเซิร์ฟเวอร์" sub="SSH เข้า VPS แล้ววางทั้งก้อน (คลิกขวา) กด Enter" text={"sudo mt-peer add <<'EOF'\n" + out.peer.replace(/\n+$/, "") + "\nEOF\n"} />
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
        {cfg && cfg.noApi && <div style={mtErrBox}>{MT_NO_API}</div>}
        {cfg && !cfg.configured && !cfg.noApi && (
          <div style={{ fontSize: 12, color: "var(--tint-amber-tx)", background: "var(--tint-amber-bg)", padding: "9px 12px", borderRadius: "var(--r-tile)", fontWeight: 600 }}>
            ยังไม่ได้ตั้ง env ใน Vercel: {(cfg.missing || []).join(", ")} — สร้างไซต์/สคริปต์ไม่ได้จนกว่าจะตั้ง (docs/mikrotik.md)
          </div>
        )}
        {!isAdmin && <div style={{ fontSize: 12, color: "var(--text-3)" }}>สร้างไซต์และสคริปต์ได้เฉพาะบัญชีแอดมิน</div>}
        {isAdmin && <MtHowTo />}
      </div>

      {form && <MtSiteForm site={form === "new" ? null : form} used={used} onCancel={() => setForm(null)} onDone={() => setForm(null)} />}

      {loading ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
        : !list.length ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>ยังไม่มีไซต์</div>
        : list.map((s) => <MtSiteCard key={s.n} s={s} isAdmin={isAdmin} onEdit={(x) => setForm(x)} />)}
    </div>
  );
}

window.MtSitesView = MtSitesView;
