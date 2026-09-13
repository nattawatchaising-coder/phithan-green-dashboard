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

/* ── ประตูหน้า LIFF ── ผ่านแล้วค่อย render แอปจริง
   ต้องรอให้ localStorage ถูกตั้งก่อน children ถึงจะ mount ได้
   เพราะ useAuthStore อ่านค่าเซสชันตอน mount ครั้งแรกครั้งเดียว */
function LnGate({ children }) {
  const s = useLnSession();
  if (s.phase === "loading") return <LnSplash text="กำลังเข้าสู่ระบบ…" />;
  if (s.phase === "error")   return <LnSplash tone="bad" text="เปิดระบบไม่สำเร็จ" sub={s.error} />;
  if (s.phase === "bind")    return <LnBindScreen profile={s.profile} onBind={s.bind} />;
  return children;
}

Object.assign(window, { LN_TEST, LN_SESSION_KEY, lnPush, useLnSession, LnGate, LnSplash, LnBindScreen });
