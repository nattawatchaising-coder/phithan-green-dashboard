/* ============================================================
   flash+solar — LINE / LIFF (คำนำหน้า ln / LN_)

   ไฟล์นี้ทำสองเรื่องที่ไม่เกี่ยวกัน แต่ต้องอยู่ด้วยกันเพราะเป็นสะพานเดียวกัน:

   1. lnPush()  — ใช้ทั้งบนเว็บปกติ: ยิงบอกเซิร์ฟเวอร์ว่ามีแจ้งเตือนใบใหม่
                  ให้ส่งต่อเข้า LINE (ยิงแล้วไม่รอผล ถ้าพลาดก็แค่ไม่มี LINE เด้ง
                  แจ้งเตือนในเว็บยังอยู่ครบ)
   2. useLnSession() / LnGate — ใช้เฉพาะหน้า LIFF: แปลงบัญชี LINE เป็นผู้ใช้ในระบบ

   ── เซสชันทำงานยังไง ──
   พอรู้ว่าบัญชี LINE นี้คือพนักงานคนไหน เราเขียน id ลง localStorage ช่องเดิมที่เว็บใช้
   (solarflow_session_v1) แล้ว useAuthStore ตัวเดิมก็ทำงานต่อได้ทั้งดุ้น — สิทธิ์
   ขอบเขตงาน ผู้อนุมัติ เหมือนเดสก์ท็อปเป๊ะ ไม่ต้องเขียนระบบสิทธิ์ชุดที่สอง
   ============================================================ */

/* LIFF ID ไม่ใช่ของลับ (อยู่ใน URL liff.line.me/<id> โดยธรรมชาติ) ตั้งไว้ใน liff.html */
const LN_SESSION_KEY = "solarflow_session_v1";

/* โหมดทดสอบ — ?test=1 ติดไปกับหน้าได้ ต่างจาก localStorage ที่ตั้งใน WebView ของ LINE ไม่ได้
   ใช้คู่กับ LIFF app ตัวที่สองที่ชี้ไป /liff.html?test=1 */
const LN_TEST = (() => {
  try { return new URLSearchParams(location.search).get("test") === "1"; } catch (e) { return false; }
})();

/* ── บอกเซิร์ฟเวอร์ให้ส่งแจ้งเตือนใบนี้เข้า LINE ──
   ส่งไปแค่ id · เนื้อความเซิร์ฟเวอร์อ่านจากฐานข้อมูลเอง (ดูเหตุผลใน api/line/push.mjs)
   keepalive เพื่อให้คำขอไปถึงแม้ผู้ใช้ปิดแท็บทันทีหลังกด */
function lnPush(notifId) {
  if (!notifId) return;
  try {
    fetch("/api/line/push", {
      method: "POST", keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notifId: notifId }),
    }).catch(() => {});
  } catch (e) {}
}

/* ================================================================
   useLnSession — ใช้ในหน้า LIFF เท่านั้น
   สถานะ: loading → bind (ยังไม่ผูก) | ready (ผูกแล้ว) | error
   ================================================================ */
function useLnSession() {
  const [state, setState] = React.useState({ phase: "loading", userId: null, error: "", idToken: null, profile: null });

  React.useEffect(() => {
    let dead = false;
    (async () => {
      const liffId = window.LN_LIFF_ID || "";
      if (!window.liff)  return !dead && setState({ phase: "error", error: "โหลด LINE SDK ไม่สำเร็จ ลองเปิดใหม่อีกครั้ง" });
      if (!liffId)       return !dead && setState({ phase: "error", error: "ยังไม่ได้ตั้ง LIFF ID ในหน้านี้" });
      try {
        await window.liff.init({ liffId: liffId });
      } catch (e) {
        return !dead && setState({ phase: "error", error: "เริ่มต้น LIFF ไม่สำเร็จ: " + (e && e.message || e) });
      }
      if (!window.liff.isLoggedIn()) { window.liff.login(); return; }   // เด้งไปหน้า login ของ LINE แล้วกลับมาใหม่

      const idToken = window.liff.getIDToken();
      /* getIDToken คืนค่าว่าง = LIFF app ไม่ได้ขอ scope "openid" — แก้ที่คอนโซล ไม่ใช่ที่โค้ด
         เขียนบอกตรง ๆ เพราะเป็นจุดที่ติดกันมากที่สุดตอนตั้งค่าครั้งแรก */
      if (!idToken) return !dead && setState({ phase: "error", error: "ไม่ได้รับ ID token — ต้องเปิด scope “openid” ให้ LIFF app ในคอนโซล LINE Developers" });

      let profile = null;
      try { profile = await window.liff.getProfile(); } catch (e) {}

      try {
        const r = await fetch("/api/line/session", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken: idToken }),
        });
        const j = await r.json().catch(() => null);
        if (dead) return;
        if (!r.ok || !j) {
          /* "invalid token" ดิบ ๆ อ่านเหมือนระบบพัง ทั้งที่สาเหตุปกติมีแค่สองอย่าง:
             เปิดหน้านี้นอกแอป LINE (ไม่มี token จริง) หรือค้างหน้าไว้จน token หมดอายุ
             ทั้งคู่แก้ได้ด้วยตัวเอง จึงต้องบอกวิธีแก้ ไม่ใช่โยนชื่อ error ใส่หน้าช่าง */
          const inLine = (function () { try { return window.liff.isInClient(); } catch (e) { return false; } })();
          const why = r.status === 401
            ? (inLine ? "เซสชันหมดอายุ — ปิดหน้านี้แล้วกดเมนูด้านล่างในแชตใหม่อีกครั้ง"
                      : "หน้านี้เปิดได้จากแอป LINE เท่านั้น — กดเมนูด้านล่างในแชต flash+solar")
            : ((j && j.error) || "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
          return setState({ phase: "error", error: why, idToken, profile });
        }
        if (j.bound) {
          try { localStorage.setItem(LN_SESSION_KEY, j.userId); } catch (e) {}
          return setState({ phase: "ready", userId: j.userId, idToken, profile, error: "" });
        }
        setState({ phase: "bind", userId: null, idToken, profile, error: "" });
      } catch (e) {
        if (!dead) setState({ phase: "error", error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ", idToken, profile });
      }
    })();
    return () => { dead = true; };
  }, []);

  /* ผูกบัญชีด้วยชื่อผู้ใช้ + รหัสผ่านเดิมของเว็บ — ทำครั้งเดียวต่อเครื่อง */
  const bind = React.useCallback(async (username, pin) => {
    try {
      const r = await fetch("/api/line/bind", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: state.idToken, username, pin }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.userId) return { ok: false, error: (j && j.error) || "เชื่อมบัญชีไม่สำเร็จ" };
      try { localStorage.setItem(LN_SESSION_KEY, j.userId); } catch (e) {}
      setState((s) => Object.assign({}, s, { phase: "ready", userId: j.userId, error: "" }));
      return { ok: true };
    } catch (e) { return { ok: false, error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ" }; }
  }, [state.idToken]);

  return { phase: state.phase, userId: state.userId, error: state.error, profile: state.profile, bind };
}

/* ================================================================
   หน้าจอระหว่างยังไม่พร้อม
   ================================================================ */
function LnSplash({ text, sub, tone }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 28, background: "var(--bg)" }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ marginBottom: 16 }}>{window.BrandMark ? <window.BrandMark size={44} /> : null}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: tone === "bad" ? "#EF4444" : "var(--text-1)", lineHeight: 1.5 }}>{text}</div>
        {sub && <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── หน้าเชื่อมบัญชี ──
   ใช้ชื่อผู้ใช้/รหัสผ่านชุดเดียวกับเว็บ ไม่สร้างรหัสชุดที่สองให้ต้องจำเพิ่ม */
function LnBindScreen({ profile, onBind }) {
  const [u, setU] = React.useState("");
  const [p, setP] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async () => {
    if (busy) return;
    if (!u.trim() || !p) return setErr("กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
    setBusy(true); setErr("");
    const r = await onBind(u.trim(), p);
    setBusy(false);
    if (!r.ok) setErr(r.error || "เชื่อมบัญชีไม่สำเร็จ");
  };

  const inp = {
    width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
    background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "34px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {window.BrandLockup ? <window.BrandLockup size={30} /> : <div style={{ fontWeight: 800, fontSize: 22 }}>flash+solar</div>}
          <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            เชื่อมบัญชี LINE {profile && profile.displayName ? "“" + profile.displayName + "” " : ""}เข้ากับบัญชีพนักงาน
            <br /><span style={{ color: "var(--text-3)", fontSize: 12.5 }}>ทำครั้งเดียว ใช้รหัสเดียวกับที่เข้าเว็บ</span>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>ชื่อผู้ใช้</label>
          {/* autoCapitalize/autoCorrect ปิดไว้ — คีย์บอร์ดมือถือชอบขึ้นตัวใหญ่ให้เอง แล้วล็อกอินไม่ผ่านโดยไม่รู้ตัว */}
          <input value={u} onChange={(e) => { setU(e.target.value); setErr(""); }}
            autoCapitalize="none" autoCorrect="off" autoComplete="username" spellCheck={false}
            style={Object.assign({ marginTop: 6, marginBottom: 14 }, inp)} placeholder="เช่น somchai" />

          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>รหัสผ่าน</label>
          <input value={p} type="password" inputMode="numeric" autoComplete="current-password"
            onChange={(e) => { setP(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            style={Object.assign({ marginTop: 6 }, inp)} placeholder="••••••" />

          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: "#EF4444", fontWeight: 600 }}>⚠ {err}</div>}

          <button onClick={submit} disabled={busy}
            style={{ marginTop: 16, width: "100%", padding: "14px 16px", borderRadius: 12, border: "none",
              background: busy ? "var(--text-3)" : "var(--primary)", color: "#fff", fontWeight: 700,
              fontFamily: "inherit", fontSize: 15, cursor: busy ? "default" : "pointer" }}>
            {busy ? "กำลังเชื่อม…" : "เชื่อมบัญชี"}
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>
          ลืมรหัสผ่าน หรือยังไม่มีบัญชี — ติดต่อแอดมินของบริษัท
        </div>
      </div>
    </div>
  );
}

/* ── สวิตช์เปิด/ปิด "ทางเข้าด้วยรหัสเว็บ" ──
   ทางเข้านั้นมีไว้ให้ทีมพัฒนาเปิดหน้าช่างบนคอมตอนแก้โค้ด ไม่ใช่ทางเข้าประจำวันของใคร
   วันปกติจึงควรปิดไว้ แล้วเปิดเฉพาะตอนจะใช้จริง — น้อยวันที่เปิด = น้อยวันที่ต้องเดา

   ⚠ พูดกันตรง ๆ ว่านี่คือ "ล็อกกันเผลอ" ไม่ใช่กำแพงความปลอดภัย
     กฎ RTDB ของโปรเจกต์นี้ยังเปิดอยู่ ค่าสวิตช์จึงเป็นค่าที่ฝั่งเบราว์เซอร์อ่านมาเชื่อ
     สิ่งที่กันคนแปลกหน้าจริง ๆ ยังเป็นรหัสผ่านเหมือนเดิม สวิตช์นี้แค่เอาฟอร์มออกจาก URL สาธารณะ
     (ถ้าจะให้เป็นกำแพงจริงต้องรัดกฎฐานข้อมูล ซึ่งเป็นงานคนละก้อนและกระทบทั้งเว็บ)

   ยังไม่เคยตั้งค่า = ปิด — ค่าปริยายที่ปลอดภัยกว่าคือค่าที่ไม่เปิดอะไรทิ้งไว้โดยไม่มีใครสั่ง
   และการปิดอยู่ไม่เคยทำให้ใครเข้าไม่ได้ ช่างเข้าจากเมนูในแชตได้ตามปกติ
   แอดมินเข้าเว็บเดสก์ท็อปได้ตามปกติ */
const LN_WEB_NODE = "config/lnWebLogin";

/* ตัวเลือกเวลาปิดเอง — เปิดแล้วลืมปิดคือสิ่งที่จะเกิดจริงถ้าไม่มีตัวนี้ */
const LN_WEB_HOURS = [
  { key: "1",  th: "1 ชั่วโมง", h: 1 },
  { key: "8",  th: "8 ชั่วโมง", h: 8 },
  { key: "24", th: "1 วัน",     h: 24 },
  { key: "0",  th: "ไม่ปิดเอง", h: 0 },
];

/* ฟังก์ชันล้วน ใช้ร่วมกันทั้งหน้า LIFF และหน้าแอดมิน จะได้ไม่มีกฎสองชุด */
function lnWebOpen(cfg) {
  if (!cfg || !cfg.on) return false;
  if (!cfg.until) return true;
  const t = Date.parse(cfg.until);
  return !t || Date.now() < t;
}

function useLnWebGate() {
  /* undefined = ยังไม่รู้ · null = ไม่มีค่า(ปิด) — ต้องแยกกัน ไม่งั้นจอจะกะพริบเป็น "ปิดอยู่"
     หนึ่งเฟรมก่อนข้อมูลมาถึง แล้วคนที่เปิดไว้จะคิดว่าพัง */
  const [cfg, setCfg] = React.useState(undefined);
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!window.firebase || !window.firebase.apps || !window.firebase.apps.length) { setCfg(null); return; }
    const ref = window.firebase.database().ref(LN_WEB_NODE);
    const h = ref.on("value", (snap) => setCfg(snap.val() || null), () => setCfg(null));
    return () => ref.off("value", h);
  }, []);

  /* เดินนาฬิกาทุกนาที เพื่อให้ "หมดเวลาแล้ว" เกิดขึ้นเองโดยไม่ต้องรีเฟรช
     (ค่าใน cfg ไม่เปลี่ยน ฐานข้อมูลจึงไม่ยิงอะไรกลับมาให้ re-render) */
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const save = React.useCallback((next) => {
    if (window.firebase && window.firebase.apps && window.firebase.apps.length)
      window.firebase.database().ref(LN_WEB_NODE).set(next);
  }, []);

  return { cfg: cfg || null, loading: cfg === undefined, open: lnWebOpen(cfg), now: now, save: save };
}

/* ── จอตอนทางเข้านี้ถูกปิดไว้ ──
   ต้องบอกให้ครบว่า "ปิดเพราะตั้งใจปิด" · "ใครเปิดได้" · "ช่างยังใช้งานได้ตามปกติ"
   ไม่ใช่จอ error ที่ทำให้คนคิดว่าระบบล่มแล้วโทรตามกันทั้งบริษัท */
function LnWebShut() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "34px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto", textAlign: "center" }}>
        {window.BrandLockup ? <window.BrandLockup size={30} /> : <div style={{ fontWeight: 800, fontSize: 22 }}>flash+solar</div>}

        <div style={{ marginTop: 20, padding: "22px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>ทางเข้านี้ปิดอยู่</div>
          <div style={{ marginTop: 9, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.75 }}>
            หน้าช่างเปิดได้จากแอป LINE — กดเมนูด้านล่างในแชต flash+solar
            <br />ทางเข้าด้วยรหัสผ่านบนเบราว์เซอร์มีไว้ตอนทีมพัฒนาแก้ระบบเท่านั้น จึงปิดไว้เป็นปกติ
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
          ต้องใช้จริง? แอดมินเปิดให้ได้ที่หน้าเว็บ → “แจ้งเตือน LINE” → ทางเข้าหน้าช่างจากเบราว์เซอร์
        </div>
      </div>
    </div>
  );
}

/* ── เข้าหน้าช่างจากเบราว์เซอร์ธรรมดา ──
   มีไว้ให้ดูและทดสอบหน้าจอมือถือบนคอม โดยไม่ต้องถือโทรศัพท์เปิดแอป LINE

   ⚠ นี่ไม่ใช่ "บายพาส" และตั้งใจไม่ทำให้เป็น — มันขอชื่อผู้ใช้กับรหัสผ่านชุดเดียว
      กับที่เข้าเว็บเดสก์ท็อป ผ่าน sfMatchCred ตัวเดียวกัน กฎเดียวกัน (รวมบัญชีถูกระงับ)
      ถ้าปล่อยผ่านโดยไม่ถามรหัส ใครก็ตามที่เดา URL ได้จะเปิดหน้าช่างของบริษัทได้ทันที
      ซึ่งหลวมกว่าหน้าเว็บปกติที่ยังต้องใส่รหัส — repo นี้เป็นสาธารณะ URL ไม่ใช่ความลับ

   ทางนี้ไม่ผูกบัญชี LINE ให้ และไม่แตะ lineLinks — การผูกต้องมี ID token จริงเท่านั้น
   จึงใช้แทนการผูกครั้งแรกของช่างไม่ได้ ตั้งใจ */
function LnWebLogin({ reason, onDone }) {
  const gate = useLnWebGate();
  /* รอค่าก่อน ไม่เดา — เดาผิดทางไหนก็แย่ทั้งคู่
     (เดาว่าเปิด = ฟอร์มโผล่แวบหนึ่งทั้งที่สั่งปิด · เดาว่าปิด = คนที่เปิดไว้เห็นจอปิดแล้วสับสน) */
  if (gate.loading) return <LnSplash text="กำลังเข้าสู่ระบบ…" />;
  if (!gate.open) return <LnWebShut />;
  return <LnWebForm reason={reason} onDone={onDone} />;
}

function LnWebForm({ reason, onDone }) {
  const [users, setUsers] = React.useState(null);
  const [u, setU] = React.useState("");
  const [p, setP] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!window.firebase || !window.firebase.apps || !window.firebase.apps.length) { setUsers([]); return; }
    const ref = window.firebase.database().ref("users");
    const h = ref.on("value", (snap) => {
      const v = snap.val() || {};
      setUsers(Object.keys(v).map((k) => Object.assign({ id: k }, v[k])));
    }, () => setUsers([]));
    return () => ref.off("value", h);
  }, []);

  const submit = () => {
    if (!users) return;
    const m = window.sfMatchCred(users, u, p);
    if (!m.ok) return setErr(m.error);
    try { localStorage.setItem(LN_SESSION_KEY, m.user.id); } catch (e) {}
    onDone(m.user.id);
  };

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid var(--border-strong)",
    background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none" };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", padding: "34px 22px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          {window.BrandLockup ? <window.BrandLockup size={30} /> : <div style={{ fontWeight: 800, fontSize: 22 }}>flash+solar</div>}
          <div style={{ marginTop: 12, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            เปิดหน้าช่างจากเบราว์เซอร์
            <br /><span style={{ color: "var(--text-3)", fontSize: 12.5 }}>{reason}</span>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>ชื่อผู้ใช้</label>
          <input value={u} onChange={(e) => { setU(e.target.value); setErr(""); }}
            autoCapitalize="none" autoCorrect="off" autoComplete="username" spellCheck={false}
            style={Object.assign({ marginTop: 6, marginBottom: 14 }, inp)} placeholder="เช่น somchai" />

          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>รหัสผ่าน</label>
          <input value={p} type="password" inputMode="numeric" autoComplete="current-password"
            onChange={(e) => { setP(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            style={Object.assign({ marginTop: 6 }, inp)} placeholder="••••••" />

          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: "#EF4444", fontWeight: 600 }}>⚠ {err}</div>}

          <button onClick={submit} disabled={!users}
            style={{ marginTop: 16, width: "100%", padding: "14px 16px", borderRadius: 12, border: "none",
              background: users ? "var(--primary)" : "var(--text-3)", color: "#fff", fontWeight: 700,
              fontFamily: "inherit", fontSize: 15, cursor: users ? "pointer" : "default" }}>
            {users ? "เข้าหน้าช่าง" : "กำลังโหลดรายชื่อ…"}
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.6 }}>
          ทางนี้ไม่ผูกบัญชี LINE ให้ · ช่างที่ยังไม่เคยผูก ต้องเปิดจากเมนูในแชตครั้งแรกเสมอ
        </div>
      </div>
    </div>
  );
}

/* ── ประตูหน้า LIFF ── ผ่านแล้วค่อย render แอปจริง
   ต้องรอให้ localStorage ถูกตั้งก่อน children ถึงจะ mount ได้
   เพราะ useAuthStore อ่านค่าเซสชันตอน mount ครั้งแรกครั้งเดียว */
function LnGate({ children }) {
  const s = useLnSession();
  /* ผ่านด้วยรหัสเว็บแล้ว — เก็บไว้ใน state ไม่ใช่รอ useLnSession รอบใหม่
     เพราะทางนั้นต้องมี ID token ของ LINE ซึ่งเบราว์เซอร์ธรรมดาไม่มีวันมี */
  const [webId, setWebId] = React.useState(null);
  if (webId) return children;
  if (s.phase === "loading") return <LnSplash text="กำลังเข้าสู่ระบบ…" />;
  if (s.phase === "error") {
    /* LIFF ใช้ไม่ได้ = เปิดนอกแอป LINE เกือบทุกครั้ง ให้ทางเข้าด้วยรหัสเว็บแทน
       ไม่ใช่จอตายที่บอกว่า "เปิดจากแอป LINE เท่านั้น" แล้วจบ */
    return <LnWebLogin reason={s.error} onDone={setWebId} />;
  }
  if (s.phase === "bind")    return <LnBindScreen profile={s.profile} onBind={s.bind} />;
  return children;
}

Object.assign(window, { LN_TEST, LN_SESSION_KEY, LN_WEB_NODE, LN_WEB_HOURS, lnPush, lnWebOpen, useLnSession,
  useLnWebGate, LnGate, LnSplash, LnBindScreen, LnWebLogin, LnWebForm, LnWebShut });
