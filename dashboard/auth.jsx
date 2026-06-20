/* ============================================================
   SolarFlow / PHITHAN GREEN — Auth, Users, Notifications
   - useAuthStore : ผู้ใช้ + เซสชัน + login/logout (รหัส PIN, เก็บใน Firebase)
   - useNotifStore: แจ้งเตือนมอบหมายงาน
   - LoginScreen / UserManager / NotifPanel (UI)

   หมายเหตุความปลอดภัย: เป็น client-side gate — PIN เก็บแบบ plain ใน RTDB
   กันผู้ใช้ทั่วไป ไม่ใช่ security ระดับฐานข้อมูล (ถ้าต้องการจริงให้ย้ายไป
   Firebase Auth + Security Rules)
   ============================================================ */

/* ---------- Firebase helpers (เหมือน store.jsx แต่ scope ของ auth) ---------- */
const _AFB    = () => !!window.FBDB;
const _aref   = (p) => window.FBDB.ref(p);
const _asnap  = (snap) => { const v = snap.val(); if (!v || typeof v !== "object") return null; return Object.values(v); };
const _aobj   = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));

const SF_SESSION_KEY = "solarflow_session_v1";
const SF_USERS_KEY   = "solarflow_users_v1";
const SF_NOTIF_KEY   = "solarflow_notifs_v1";

function _alsGet(key, seed) {
  try { const s = localStorage.getItem(key); if (s) { const a = JSON.parse(s); if (Array.isArray(a)) return a; } } catch (e) {}
  return seed ? seed.slice() : [];
}
function _alsSet(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {} }

/* ---------- บัญชีเริ่มต้น + สิทธิ์ ---------- */
const ADMIN_SEED = { id: "u-admin", name: "แอดมิน", username: "admin", pin: "1234", role: "admin", techId: null, active: true };

const ROLE_INFO = {
  admin:   { th: "แอดมิน / ออฟฟิศ", icon: "users",  color: "#22A35B" },
  manager: { th: "ผู้จัดการ",        icon: "user",   color: "#3B82F6" },
  tech:    { th: "ช่างติดตั้ง",      icon: "wrench", color: "#F59E0B" },
  survey:  { th: "วิศวกรสำรวจ",      icon: "list",   color: "#0EA5E9" },
};

// dispatch = เข้าถึงปฏิทินจ่ายงานสำรวจ · doSurvey = เปิดฟอร์มสำรวจหน้างานได้
const PERMS = {
  admin:   { viewAll: true,  addJob: true,  editJob: true, delJob: true,  stock: true, manageUsers: true,  dispatch: true,  doSurvey: true  },
  manager: { viewAll: true,  addJob: true,  editJob: true, delJob: true,  stock: true, manageUsers: false, dispatch: true,  doSurvey: false },
  tech:    { viewAll: false, addJob: false, editJob: true, delJob: false, stock: true, manageUsers: false, dispatch: false, doSurvey: true  },
  survey:  { viewAll: false, addJob: false, editJob: false, delJob: false, stock: false, manageUsers: false, dispatch: false, doSurvey: true  },
};
function can(role, action) { return !!(PERMS[role] && PERMS[role][action]); }

function blankUser() {
  return { id: "u-" + Date.now().toString(36), name: "", username: "", pin: "", role: "tech", techId: null, active: true };
}

/* ================================================================
   useAuthStore
   ================================================================ */
function useAuthStore() {
  const [users, setUsers]       = React.useState(_AFB() ? null : () => _alsGet(SF_USERS_KEY, [ADMIN_SEED]));
  const [sessionId, setSession] = React.useState(() => { try { return localStorage.getItem(SF_SESSION_KEY) || null; } catch (e) { return null; } });
  const [loading, setLoading]   = React.useState(_AFB());

  /* Firebase realtime + seed admin */
  React.useEffect(() => {
    if (!_AFB()) return;
    const ref = _aref("users");
    const h = ref.on("value", (snap) => {
      let arr = _asnap(snap);
      if (!arr || arr.length === 0) { arr = [ADMIN_SEED]; ref.set(_aobj(arr)); }
      setUsers(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  /* localStorage sync (offline) */
  React.useEffect(() => { if (!_AFB() && users) _alsSet(SF_USERS_KEY, users); }, [users]);

  const list    = users || [];
  const current = list.find((u) => u.id === sessionId && u.active !== false) || null;

  const login = React.useCallback((userId, pin) => {
    const u = (users || []).find((x) => x.id === userId);
    if (!u) return { ok: false, error: "ไม่พบผู้ใช้" };
    if (u.active === false) return { ok: false, error: "บัญชีถูกระงับการใช้งาน" };
    if (String(u.pin) !== String(pin)) return { ok: false, error: "รหัสผ่านไม่ถูกต้อง" };
    try { localStorage.setItem(SF_SESSION_KEY, u.id); } catch (e) {}
    setSession(u.id);
    return { ok: true };
  }, [users]);

  // เข้าระบบด้วย ชื่อผู้ใช้ (ID) + รหัสผ่าน — fallback: จับคู่ด้วย "ชื่อ" สำหรับบัญชีเก่าที่ยังไม่ตั้ง ID
  const loginCred = React.useCallback((username, password) => {
    const uname = String(username || "").trim().toLowerCase();
    if (!uname) return { ok: false, error: "กรุณากรอกชื่อผู้ใช้" };
    const u = (users || []).find((x) => (x.username || "").toLowerCase() === uname)
           || (users || []).find((x) => !x.username && (x.name || "").trim().toLowerCase() === uname)
           || (uname === "admin" ? (users || []).find((x) => !x.username && x.role === "admin") : null);  // บัญชีแอดมินเก่าที่ยังไม่ตั้ง ID
    if (!u) return { ok: false, error: "ไม่พบบัญชีนี้" };
    if (u.active === false) return { ok: false, error: "บัญชีถูกระงับการใช้งาน" };
    if (String(u.pin) !== String(password)) return { ok: false, error: "รหัสผ่านไม่ถูกต้อง" };
    try { localStorage.setItem(SF_SESSION_KEY, u.id); } catch (e) {}
    setSession(u.id);
    return { ok: true };
  }, [users]);

  const logout = React.useCallback(() => {
    try { localStorage.removeItem(SF_SESSION_KEY); } catch (e) {}
    setSession(null);
  }, []);

  const upsertUser = React.useCallback((rec) => {
    if (_AFB()) { _aref("users/" + rec.id).set(rec); }
    else setUsers((prev) => {
      const i = (prev || []).findIndex((u) => u.id === rec.id);
      if (i === -1) return [...(prev || []), Object.assign({}, rec)];
      const copy = prev.slice(); copy[i] = Object.assign({}, prev[i], rec); return copy;
    });
  }, []);

  const removeUser = React.useCallback((id) => {
    if (_AFB()) { _aref("users/" + id).remove(); }
    else setUsers((prev) => (prev || []).filter((u) => u.id !== id));
  }, []);

  return { users: list, current, loading, login, loginCred, logout, upsertUser, removeUser, blankUser: () => blankUser() };
}

/* ================================================================
   useNotifStore
   ================================================================ */
function useNotifStore() {
  const [notifs, setNotifs] = React.useState(_AFB() ? null : () => _alsGet(SF_NOTIF_KEY, []));

  React.useEffect(() => {
    if (!_AFB()) return;
    const ref = _aref("notifications");
    const h = ref.on("value", (snap) => {
      let arr = _asnap(snap) || [];
      arr.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
      setNotifs(arr);
    }, () => setNotifs([]));
    return () => ref.off("value", h);
  }, []);

  React.useEffect(() => { if (!_AFB() && notifs) _alsSet(SF_NOTIF_KEY, notifs); }, [notifs]);

  const addNotif = React.useCallback((n) => {
    const id  = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const rec = Object.assign({ id, read: false, at: new Date().toISOString() }, n);
    if (_AFB()) { _aref("notifications/" + id).set(rec); }
    else setNotifs((prev) => [rec, ...(prev || [])]);
  }, []);

  const markRead = React.useCallback((id) => {
    if (_AFB()) { _aref("notifications/" + id + "/read").set(true); }
    else setNotifs((prev) => (prev || []).map((n) => n.id === id ? Object.assign({}, n, { read: true }) : n));
  }, []);

  const markAllRead = React.useCallback((toTechId) => {
    const target = (notifs || []).filter((n) => n.toTechId === toTechId && !n.read);
    if (_AFB()) { target.forEach((n) => _aref("notifications/" + n.id + "/read").set(true)); }
    else setNotifs((prev) => (prev || []).map((n) => n.toTechId === toTechId ? Object.assign({}, n, { read: true }) : n));
  }, [notifs]);

  return { notifs: notifs || [], addNotif, markRead, markAllRead };
}

/* ================================================================
   UI helpers (self-contained — ไม่พึ่ง form.jsx)
   ================================================================ */
const A_INPUT = {
  background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)",
  fontFamily: "inherit", fontSize: 14, padding: "10px 12px", borderRadius: 10, outline: "none", width: "100%",
};
function AField({ label, required, children, full }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
function RoleBadge({ role }) {
  const r = ROLE_INFO[role] || ROLE_INFO.tech;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      color: r.color, background: r.color + "16", padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <Icon name={r.icon} size={11} color={r.color} /> {r.th}
    </span>
  );
}

/* ================================================================
   LoginScreen — เลือกผู้ใช้ + กรอก PIN
   ================================================================ */
function LoginScreen({ authStore }) {
  const [username, setUsername] = React.useState("");
  const [pw, setPw]   = React.useState("");
  const [show, setShow] = React.useState(false);
  const [err, setErr] = React.useState("");
  const pwRef = React.useRef(null);

  const submit = () => {
    const res = authStore.loginCred(username, pw);
    if (!res.ok) { setErr(res.error); setPw(""); }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", gap: 22,
      padding: "calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <img src="dashboard/assets/phithan-mark.png" alt="PHITHAN GREEN"
          style={{ height: 56, borderRadius: 14, padding: 8, background: "#fff", boxShadow: "0 4px 18px rgba(34,163,91,.18)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "-.01em" }}>PHITHAN GREEN</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>ระบบติดตามงานติดตั้งโซล่าเซลล์</div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18,
        boxShadow: "var(--shadow-sm)", width: "min(420px, 100%)", overflow: "hidden" }}>
        <div style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 16 }}>กรอกชื่อผู้ใช้และรหัสผ่านที่แอดมินกำหนดให้</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <AField label="ชื่อผู้ใช้ (ID)" required>
              <input autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username}
                onChange={(e) => { setUsername(e.target.value); setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && pwRef.current) pwRef.current.focus(); }}
                style={A_INPUT} placeholder="เช่น admin" />
            </AField>
            <AField label="รหัสผ่าน" required>
              <div style={{ position: "relative" }}>
                <input ref={pwRef} type={show ? "text" : "password"} value={pw}
                  onChange={(e) => { setPw(e.target.value); setErr(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                  style={Object.assign({}, A_INPUT, { paddingRight: 44 })} placeholder="••••••" />
                <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
                  style={{ position: "absolute", top: 0, right: 0, height: "100%", width: 42, display: "grid", placeItems: "center",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
                  <Icon name={show ? "eyeOff" : "eye"} size={17} color="var(--text-3)" />
                </button>
              </div>
            </AField>
          </div>
          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: "#EF4444", fontWeight: 600, textAlign: "center" }}>⚠ {err}</div>}
          <button onClick={submit}
            style={{ marginTop: 18, width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
              background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14.5, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            เข้าสู่ระบบ <Icon name="arrowRight" size={17} color="#fff" />
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>ครั้งแรกเข้าด้วย ID <b>admin</b> · รหัสผ่าน <b>1234</b> แล้วเปลี่ยนภายหลัง</div>
    </div>
  );
}

/* ================================================================
   NotifPanel — กล่องแจ้งเตือน (dropdown จากกระดิ่ง)
   ================================================================ */
function NotifPanel({ items, lateAlerts, onClose, onOpenJob, onMarkAll }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const alerts = lateAlerts || [];
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 95 }} />
      <div style={isMobile
        ? { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 96, background: "var(--bg)",
            borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: "0 -10px 40px rgba(8,20,14,.22)",
            maxHeight: "70dvh", display: "flex", flexDirection: "column", animation: "sheetUp .26s cubic-bezier(.3,.9,.3,1)" }
        : { position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 96, width: 340, background: "var(--bg)",
            border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 18px 50px rgba(8,20,14,.22)",
            maxHeight: 440, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="bell" size={15} color="var(--primary)" /> การแจ้งเตือน
          </span>
          {items.some((n) => !n.read) && (
            <button onClick={onMarkAll} style={{ background: "none", border: "none", color: "var(--primary-dark)", fontWeight: 600,
              fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>อ่านทั้งหมด</button>
          )}
        </div>
        <div style={{ overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8,
          paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom, 0px))" : 10 }}>
          {items.length === 0 && alerts.length === 0 && <div style={{ padding: "28px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>ยังไม่มีการแจ้งเตือน</div>}
          {/* งานล่าช้าตามขั้น (Flow) — คำนวณสด */}
          {alerts.length > 0 && (
            <React.Fragment>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#EF4444", padding: "2px 4px" }}>⚠ งานล่าช้ากว่ากำหนด ({alerts.length})</div>
              {alerts.map((a, i) => (
                <button key={a.jobId + a.stage.key + i} onClick={() => onOpenJob({ jobId: a.jobId })}
                  style={{ display: "flex", gap: 10, padding: "11px 12px", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 11 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "#EF4444", color: "#fff" }}><Icon name="alert" size={15} color="#fff" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.jobName}</span>
                    <span style={{ display: "block", fontSize: 12, color: "#B91C1C", marginTop: 2, lineHeight: 1.4 }}>ขั้น "{a.stage.th}" เลยกำหนด {a.stage.daysLate} วัน</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>กำหนดเสร็จ {thDate ? thDate(a.stage.end, true) : a.stage.end}</span>
                  </span>
                </button>
              ))}
              {items.length > 0 && <div style={{ height: 1, background: "var(--border)", margin: "4px 2px" }} />}
            </React.Fragment>
          )}
          {items.map((n) => (
            <button key={n.id} onClick={() => onOpenJob(n)}
              style={{ display: "flex", gap: 10, padding: "11px 12px", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                background: n.read ? "var(--surface)" : "var(--primary-soft)", border: "1px solid " + (n.read ? "var(--border)" : "var(--primary)"), borderRadius: 11 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
                background: "var(--primary)", color: "#fff" }}><Icon name="wrench" size={15} color="#fff" /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{n.title}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-2)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</span>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>{thDateTime ? thDateTime(n.at) : ""}</span>
              </span>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--primary)", flexShrink: 0, marginTop: 4 }} />}
            </button>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ================================================================
   UserManager — แอดมินจัดการผู้ใช้ (เพิ่ม/แก้ไข/ลบ + role + PIN + techId)
   ================================================================ */
function UserManager({ authStore, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const users = authStore.users;
  const [editing, setEditing] = React.useState(null);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)",
      zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20,
        width: isMobile ? "100%" : "min(560px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="users" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>จัดการผู้ใช้งาน</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{users.length} บัญชี · กำหนด ID / รหัสผ่าน / สิทธิ์</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={17} /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 9 }}>
          {users.map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, opacity: u.active === false ? 0.55 : 1 }}>
              <span style={{ width: 38, height: 38, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
                background: (ROLE_INFO[u.role] || ROLE_INFO.tech).color, color: "#fff", fontWeight: 700, fontSize: 14 }}>{(u.name || "?").slice(0, 1)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{u.name || "(ยังไม่ระบุชื่อ)"}{u.username && <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, fontFamily: "var(--mono)" }}> · @{u.username}</span>}{u.active === false && <span style={{ fontSize: 10.5, color: "#EF4444", fontWeight: 600 }}> · ระงับ</span>}</div>
                <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span style={{ flexShrink: 0 }}><RoleBadge role={u.role} /></span>
                  {u.role === "tech" && u.techId && (
                    <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                      → {(window.SF.TECH_BY_ID[u.techId] || {}).name || u.techId}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(Object.assign({}, u))} title="แก้ไข" style={{ background: "#3B82F614", border: "none", color: "#3B82F6", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={15} /></button>
              <button onClick={() => { if (u.role === "admin" && users.filter((x) => x.role === "admin").length <= 1) { alert("ต้องมีแอดมินอย่างน้อย 1 คน"); return; } if (confirm("ลบผู้ใช้ \"" + u.name + "\" ?")) authStore.removeUser(u.id); }} title="ลบ" style={{ background: "#EF444414", border: "none", color: "#EF4444", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={() => setEditing(authStore.blankUser())} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}><Icon name="plus" size={16} color="#fff" sw={2.4} /> เพิ่มผู้ใช้</button>
        </div>
      </div>

      {editing && <UserEditModal initial={editing} existing={users}
        onSave={(rec) => { authStore.upsertUser(rec); setEditing(null); }} onClose={() => setEditing(null)} />}
    </div>
  );
}

function UserEditModal({ initial, existing, onSave, onClose }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const isNew = !existing.some((u) => u.id === initial.id);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", zIndex: 120, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(440px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขผู้ใช้"}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <AField label="ชื่อ-สกุล (แสดงในระบบ)" required><input autoFocus style={A_INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น สมชาย ตั้งใจ" /></AField>
          <AField label="ชื่อผู้ใช้ (ID เข้าระบบ)" required><input style={A_INPUT} value={f.username || ""} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => set("username", e.target.value.replace(/\s/g, ""))} placeholder="เช่น somchai" /></AField>
          <AField label="รหัสผ่าน" required><input style={A_INPUT} value={f.pin} onChange={(e) => set("pin", e.target.value)} placeholder="ตั้งรหัสผ่าน" /></AField>
          <AField label="สิทธิ์การใช้งาน (Role)">
            <select style={A_INPUT} value={f.role} onChange={(e) => set("role", e.target.value)}>
              <option value="admin">แอดมิน / ออฟฟิศ — ควบคุมทั้งหมด</option>
              <option value="manager">ผู้จัดการ — ดูทั้งหมด + แก้ไขงาน</option>
              <option value="tech">ช่างติดตั้ง — เห็นเฉพาะงานตัวเอง</option>
              <option value="survey">วิศวกรสำรวจ — เห็นเฉพาะนัดสำรวจของตัวเอง</option>
            </select>
          </AField>
          {(f.role === "tech" || f.role === "survey") && (
            <AField label={f.role === "survey" ? "ผูกกับวิศวกร/พนักงานในระบบ (เพื่อรับนัดสำรวจ)" : "ผูกกับช่างในระบบ (เพื่อกรองงาน)"}>
              <select style={A_INPUT} value={f.techId || ""} onChange={(e) => set("techId", e.target.value || null)}>
                <option value="">— เลือกพนักงาน —</option>
                {SF.TECHS.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
              </select>
            </AField>
          )}
          <AField label="สถานะบัญชี">
            <button type="button" onClick={() => set("active", f.active === false ? true : false)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ width: 38, height: 22, borderRadius: 99, background: f.active === false ? "var(--surface3)" : "var(--primary)", position: "relative", flexShrink: 0 }}>
                <span style={{ position: "absolute", top: 3, left: f.active === false ? 3 : 19, width: 16, height: 16, borderRadius: 99, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: f.active === false ? "var(--text-3)" : "var(--primary-dark)" }}>{f.active === false ? "ระงับการใช้งาน" : "ใช้งานได้"}</span>
            </button>
          </AField>
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => {
              const uname = String(f.username || "").trim();
              if (!f.name.trim()) { alert("กรุณากรอกชื่อ-สกุล"); return; }
              if (!uname) { alert("กรุณากรอกชื่อผู้ใช้ (ID เข้าระบบ)"); return; }
              if (existing.some((u) => u.id !== f.id && (u.username || "").toLowerCase() === uname.toLowerCase())) { alert("ชื่อผู้ใช้ \"" + uname + "\" ถูกใช้แล้ว กรุณาตั้งใหม่"); return; }
              if (!String(f.pin).trim()) { alert("กรุณากรอกรหัสผ่าน"); return; }
              if (f.role === "tech" && !f.techId) { alert("กรุณาเลือกช่างที่ผูกกับบัญชีนี้"); return; }
              if (f.role === "survey" && !f.techId) { alert("กรุณาเลือกวิศวกรที่ผูกกับบัญชีนี้"); return; }
              onSave(Object.assign({}, f, { name: f.name.trim(), username: uname, pin: String(f.pin).trim() }));
            }}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useAuthStore, useNotifStore, LoginScreen, NotifPanel, UserManager, can, ROLE_INFO });
