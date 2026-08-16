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

/* ---------- บัญชีเริ่มต้น + สิทธิ์ ----------
   คนหนึ่งคนถือได้หลายตำแหน่ง (roles เป็น "รายการ") เช่น หัวหน้า + วิศวกรไฟฟ้า
   สิทธิ์ที่ได้ = รวมทุกตำแหน่งเข้าด้วยกัน (ตำแหน่งไหนให้ผ่าน ก็ผ่าน)
   ฟิลด์ role เดิม (ตำแหน่งเดียว) ยังเขียนคู่กันไว้ เผื่อโค้ด/ข้อมูลเก่าที่ยังอ่านช่องนั้นอยู่ */
const ADMIN_SEED = { id: "u-admin", name: "แอดมิน", username: "admin", pin: "1234", role: "admin", roles: ["admin"], techId: null, active: true };

const ROLE_INFO = {
  admin:  { th: "แอดมิน",            short: "แอดมิน",   icon: "shield", color: "#22A35B", desc: "ควบคุมทั้งระบบ · จัดการผู้ใช้ · ลบงาน" },
  lead:   { th: "หัวหน้า",            short: "หัวหน้า",   icon: "users",  color: "#3B82F6", desc: "ดูทุกงาน · สั่งงาน · เห็นราคา" },
  ee:     { th: "วิศวกรไฟฟ้า",        short: "วิศวกรไฟฟ้า", icon: "bolt", color: "#8B5CF6", desc: "ออกแบบระบบ · สำรวจหน้างาน · เอกสารขออนุญาต" },
  draft:  { th: "วิศวกรเขียนแบบ",     short: "เขียนแบบ",  icon: "ruler",  color: "#0EA5E9", desc: "เขียนแบบ / ออกไฟล์ DXF" },
  tech:   { th: "ช่างติดตั้ง",         short: "ช่าง",      icon: "wrench", color: "#F59E0B", desc: "เห็นเฉพาะงานที่ได้รับมอบหมาย" },
  permit: { th: "แอดมิน ขออนุญาต",    short: "ขออนุญาต",  icon: "file",   color: "#14B8A6", desc: "งานเอกสารยื่นขออนุญาตการไฟฟ้า" },
  sales:  { th: "เซลล์",              short: "เซลล์",     icon: "trend",  color: "#EC4899", desc: "ลูกค้าสำรวจ · เปิดงานใหม่ · เห็นราคา" },
};
const ROLE_KEYS = Object.keys(ROLE_INFO);

/* ตำแหน่งเดิมที่เลิกใช้แล้ว → ตำแหน่งใหม่ที่ใกล้เคียงที่สุด (บัญชีเก่าจะได้ไม่หลุดสิทธิ์) */
const ROLE_ALIAS = { manager: "lead", survey: "ee", office: "admin" };

/* ตำแหน่งทั้งหมดของผู้ใช้คนหนึ่ง — คืนเป็นรายการเสมอ ไม่ว่าข้อมูลจะเก็บแบบเก่าหรือใหม่ */
function userRoles(u) {
  if (!u) return [];
  const raw = Array.isArray(u.roles) && u.roles.length ? u.roles : (u.role ? [u.role] : []);
  const out = [];
  raw.forEach((r) => { const k = ROLE_ALIAS[r] || r; if (ROLE_INFO[k] && out.indexOf(k) === -1) out.push(k); });
  return out.length ? out : ["tech"];
}

/* ตารางสิทธิ์
   viewAll ดูงานทั้งหมด · doSurvey ทำแบบสำรวจหน้างาน · dispatch จัดตารางสำรวจ
   design ออกแบบ/ออกไฟล์แบบ · permit เอกสารขออนุญาต · price เห็นราคา-ต้นทุน · leads หน้าลูกค้าสำรวจ */
const DEFAULT_PERMS = {
  admin:  { viewAll: 1, addJob: 1, editJob: 1, delJob: 1, stock: 1, manageUsers: 1, dispatch: 1, doSurvey: 1, design: 1, permit: 1, price: 1, leads: 1 },
  lead:   { viewAll: 1, addJob: 1, editJob: 1, delJob: 1, stock: 1,                 dispatch: 1, doSurvey: 1, design: 1, permit: 1, price: 1, leads: 1 },
  ee:     { viewAll: 1,            editJob: 1,            stock: 1,                 dispatch: 1, doSurvey: 1, design: 1, permit: 1 },
  draft:  { viewAll: 1,            editJob: 1,            stock: 1,                                           design: 1 },
  tech:   {                        editJob: 1,            stock: 1,                              doSurvey: 1 },
  permit: { viewAll: 1,            editJob: 1,                                                                            permit: 1 },
  sales:  { viewAll: 1, addJob: 1,                                                  dispatch: 1, doSurvey: 1,                       price: 1, leads: 1 },
};

/* รายการสิทธิ์ที่ติ๊กได้ในหน้าตั้งค่า — เรียงตามลำดับที่คนอ่านเข้าใจง่าย ไม่ใช่ตามตัวอักษร */
const PERM_LIST = [
  { key: "viewAll",     th: "เข้าหน้าฐานข้อมูลงาน / รายงาน", desc: "ปิดแล้วจะเห็นแค่บอร์ดงานกับตารางของตัวเอง" },
  { key: "addJob",      th: "เปิดงานใหม่",                 desc: "กดปุ่มเพิ่มงานได้" },
  { key: "editJob",     th: "แก้ไขงาน / เดินขั้นตอน",        desc: "แก้ข้อมูลงานและเปลี่ยนขั้นตอนได้" },
  { key: "delJob",      th: "ลบงาน",                       desc: "ลบลงถังขยะและกู้คืน" },
  { key: "price",       th: "เห็นราคาและต้นทุน",             desc: "ราคาขาย ต้นทุนของ ค่าแรง และ BOQ" },
  { key: "leads",       th: "หน้าลูกค้าสำรวจ",              desc: "รายชื่อลูกค้าที่ยังไม่เปิดเป็นงาน" },
  { key: "dispatch",    th: "จัดตารางสำรวจ",               desc: "นัดวันสำรวจและมอบหมายผู้สำรวจ" },
  { key: "doSurvey",    th: "ทำแบบสำรวจหน้างาน",            desc: "กรอกแบบสำรวจและถ่ายรูปหน้างาน" },
  { key: "design",      th: "เขียนแบบ · 3D · ออกไฟล์ DXF",  desc: "เครื่องมือออกแบบและออกไฟล์แบบ" },
  { key: "permit",      th: "งานขออนุญาตการไฟฟ้า",          desc: "คิวงานขออนุญาต ตรวจงาน เดินสถานะ" },
  { key: "stock",       th: "คลังสินค้า",                   desc: "ดูและตัดสต๊อก" },
  { key: "manageUsers", th: "จัดการผู้ใช้และสิทธิ์",          desc: "เพิ่ม/ลบบัญชี และแก้ตารางสิทธิ์นี้" },
];

/* ── ขอบเขตงานที่แต่ละตำแหน่งเห็น ──
   แยกจาก "สิทธิ์" เพราะสิทธิ์คุมว่าทำอะไรได้ ส่วนขอบเขตคุมว่าเห็นงานไหนบ้าง
   คนถือหลายตำแหน่ง = รวมขอบเขตของทุกตำแหน่งเข้าด้วยกัน (กว้างสุดชนะ) */
const SCOPE_MODES = [
  { key: "all",      th: "ทุกงานในระบบ",            desc: "เห็นงานทั้งหมดเหมือนที่เป็นอยู่" },
  { key: "assigned", th: "เฉพาะงานที่รับผิดชอบ",     desc: "งานที่ถูกมอบหมายให้บัญชีนี้ (ต้องผูกกับพนักงานในระบบ)" },
  { key: "created",  th: "เฉพาะงานที่ตัวเองเปิด",    desc: "งานที่บัญชีนี้เป็นคนกดเพิ่ม · งานเก่าที่ไม่ได้บันทึกผู้เปิดไว้จะไม่เข้าเงื่อนไข" },
  { key: "stages",   th: "เฉพาะงานในขั้นที่เลือก",   desc: "เช่น ฝ่ายขออนุญาตเห็นเฉพาะงานที่ติดตั้งเสร็จแล้ว" },
];
const DEFAULT_SCOPE = {
  admin:  { mode: "all",      stages: [] },
  lead:   { mode: "all",      stages: [] },
  ee:     { mode: "all",      stages: [] },
  draft:  { mode: "all",      stages: [] },
  tech:   { mode: "assigned", stages: [] },
  permit: { mode: "all",      stages: [] },
  sales:  { mode: "all",      stages: [] },
};

/* ตารางที่ใช้งานจริง — เริ่มจากค่าตั้งต้น แล้วถูกทับด้วยค่าที่แอดมินตั้งไว้ใน Firebase
   ทำเป็นตัวแปรที่แก้ค่าได้ เพื่อให้ can() ทั่วทั้งแอป (30+ จุด) ไม่ต้องรับพารามิเตอร์เพิ่ม */
let PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS));
let ROLE_SCOPE = JSON.parse(JSON.stringify(DEFAULT_SCOPE));

function applyRoleConfig(cfg) {
  PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS));
  ROLE_SCOPE = JSON.parse(JSON.stringify(DEFAULT_SCOPE));
  if (!cfg) return;
  ROLE_KEYS.forEach((r) => {
    const c = cfg[r];
    if (!c) return;
    if (c.perms) {
      const p = {};
      PERM_LIST.forEach((x) => { if (c.perms[x.key]) p[x.key] = 1; });
      PERMS[r] = p;
    }
    if (c.scope && c.scope.mode) {
      ROLE_SCOPE[r] = { mode: c.scope.mode, stages: Array.isArray(c.scope.stages) ? c.scope.stages : [] };
    }
  });
  /* กันล็อกตัวเองออกจากระบบ — แอดมินต้องจัดการผู้ใช้ได้เสมอ */
  PERMS.admin = Object.assign({}, PERMS.admin, { manageUsers: 1 });
}
function roleConfigNow() {
  const out = {};
  ROLE_KEYS.forEach((r) => { out[r] = { perms: Object.assign({}, PERMS[r]), scope: Object.assign({}, ROLE_SCOPE[r]) }; });
  return out;
}

/* ── ขอบเขตงานของ "คนหนึ่งคน" (รวมทุกตำแหน่งที่ถือ) ── */
function jobScopeOf(roles) {
  const arr = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  const out = { all: false, assigned: false, created: false, stages: [] };
  arr.forEach((r) => {
    const k = ROLE_ALIAS[r] || r;
    const sc = ROLE_SCOPE[k] || DEFAULT_SCOPE[k] || { mode: "all" };
    if (sc.mode === "all") out.all = true;
    else if (sc.mode === "assigned") out.assigned = true;
    else if (sc.mode === "created") out.created = true;
    else if (sc.mode === "stages") (sc.stages || []).forEach((s) => { if (out.stages.indexOf(s) === -1) out.stages.push(s); });
  });
  return out;
}
/* งานหนึ่งใบ คนนี้เห็นไหม — เงื่อนไขไหนผ่านสักข้อก็เห็น */
function jobInScope(job, scope, user) {
  if (!scope || scope.all) return true;
  if (!job) return false;
  if (scope.assigned && user && user.techId && job.tech === user.techId) return true;
  if (scope.created && user && job.createdBy && job.createdBy === user.id) return true;
  if (scope.stages.length && scope.stages.indexOf(job.stage) !== -1) return true;
  return false;
}

/* ── ตารางสิทธิ์ที่แอดมินแก้ได้ (เก็บที่ rolePerms ใน Firebase) ── */
function useRoleConfig() {
  const [cfg, setCfg] = React.useState(null);
  const [rev, setRev] = React.useState(0);          // ตัวนับไว้บังคับให้ทั้งแอปรีเรนเดอร์เมื่อสิทธิ์เปลี่ยน
  React.useEffect(() => {
    if (!_AFB()) { applyRoleConfig(null); return; }
    const ref = _aref("rolePerms");
    const h = ref.on("value", (s) => {
      const v = s.val();
      applyRoleConfig(v && typeof v === "object" ? v : null);
      setCfg(v || null); setRev((n) => n + 1);
    });
    return () => ref.off("value", h);
  }, []);
  const saveRole = React.useCallback((roleKey, patch) => {
    const cur = roleConfigNow()[roleKey] || { perms: {}, scope: { mode: "all", stages: [] } };
    const next = Object.assign({}, cur, patch);
    if (_AFB()) _aref("rolePerms/" + roleKey).set(next);
    else { applyRoleConfig(Object.assign(roleConfigNow(), { [roleKey]: next })); setRev((n) => n + 1); }
  }, []);
  const resetAll = React.useCallback(() => {
    if (_AFB()) _aref("rolePerms").remove();
    else { applyRoleConfig(null); setRev((n) => n + 1); }
  }, []);
  return { cfg, rev, saveRole, resetAll, custom: !!cfg };
}

/* รับได้ทั้งตำแหน่งเดียว ("admin") และหลายตำแหน่ง (["lead","ee"]) — ตำแหน่งไหนให้ผ่าน ก็ถือว่าผ่าน */
function can(roles, action) {
  const arr = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  return arr.some((r) => { const k = ROLE_ALIAS[r] || r; return !!(PERMS[k] && PERMS[k][action]); });
}
function hasRole(roles, key) {
  const arr = Array.isArray(roles) ? roles : (roles ? [roles] : []);
  return arr.some((r) => (ROLE_ALIAS[r] || r) === key);
}

function blankUser() {
  return { id: "u-" + Date.now().toString(36), name: "", username: "", pin: "", role: "tech", roles: ["tech"], techId: null, active: true };
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
function RoleBadge({ role, short }) {
  const r = ROLE_INFO[ROLE_ALIAS[role] || role] || ROLE_INFO.tech;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
      color: r.color, background: r.color + "16", padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
      <Icon name={r.icon} size={11} color={r.color} /> {short ? r.short : r.th}
    </span>
  );
}
/* ป้ายตำแหน่งหลายอันเรียงกัน — คนหนึ่งคนถือได้หลายตำแหน่ง */
function RoleBadges({ roles, short }) {
  const arr = userRoles({ roles });
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {arr.map((r) => <RoleBadge key={r} role={r} short={short} />)}
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
    /* พื้นโปร่ง ไม่ทาสีทับ — body ทาสีพื้นอยู่แล้ว และโหมดออโรราจะได้เห็นม่านแสงด้านหลังด้วย */
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "transparent", gap: 22,
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
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 16 }}>เข้าสู่ระบบ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <AField label="ชื่อผู้ใช้ (ID)" required>
              <input autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username}
                onChange={(e) => { setUsername(e.target.value); setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && pwRef.current) pwRef.current.focus(); }}
                style={A_INPUT} />
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
                    background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)", borderRadius: 11 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "#EF4444", color: "#fff" }}><Icon name="alert" size={15} color="#fff" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.jobName}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--tint-red-tx)", marginTop: 2, lineHeight: 1.4 }}>ขั้น "{a.stage.th}" เลยกำหนด {a.stage.daysLate} วัน</span>
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
   UserManager — จัดการผู้ใช้ (ออกแบบให้รองรับ 20–30 คน)
   ค้นหา + กรองตามตำแหน่ง + ตำแหน่งหลายอันต่อคน
   ================================================================ */
/* ── หน้าตั้งค่าสิทธิ์รายตำแหน่ง ──
   ติ๊กแล้วมีผลทันทีทุกเครื่องที่เปิดอยู่ เพราะ can() ทั้งแอปอ่านจากตารางเดียวกัน */
function RolePermsEditor({ roleCfg }) {
  const [open, setOpen] = React.useState(ROLE_KEYS[0]);
  const [askReset, setAskReset] = React.useState(false);
  const STAGES = (window.SF && window.SF.STAGES) || [];

  const togglePerm = (r, key) => {
    const perms = Object.assign({}, PERMS[r]);
    if (perms[key]) delete perms[key]; else perms[key] = 1;
    roleCfg.saveRole(r, { perms });
  };
  const setScope = (r, mode) => roleCfg.saveRole(r, { scope: { mode, stages: (ROLE_SCOPE[r] || {}).stages || [] } });
  const toggleStage = (r, key) => {
    const cur = ((ROLE_SCOPE[r] || {}).stages || []).slice();
    const i = cur.indexOf(key);
    if (i === -1) cur.push(key); else cur.splice(i, 1);
    roleCfg.saveRole(r, { scope: { mode: "stages", stages: cur } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ padding: "10px 13px", borderRadius: 11, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)",
        fontSize: 11.5, color: "var(--tint-amber-tx)", lineHeight: 1.55 }}>
        แก้แล้วมีผลทันทีกับทุกคนที่ถือตำแหน่งนั้น · คนหนึ่งคนถือได้หลายตำแหน่ง ระบบจะรวมสิทธิ์ให้แบบ “กว้างสุดชนะ”
        <span style={{ display: "block", marginTop: 2 }}>สิทธิ์ “จัดการผู้ใช้และสิทธิ์” ของแอดมินปิดไม่ได้ กันล็อกตัวเองออกจากระบบ</span>
      </div>

      {ROLE_KEYS.map((r) => {
        const info = ROLE_INFO[r];
        const on = open === r;
        const sc = ROLE_SCOPE[r] || { mode: "all", stages: [] };
        const nPerm = Object.keys(PERMS[r] || {}).length;
        const scLabel = (SCOPE_MODES.find((m) => m.key === sc.mode) || SCOPE_MODES[0]).th;
        return (
          <div key={r} style={{ borderRadius: 13, border: "1px solid " + (on ? "var(--primary)" : "var(--border)"), background: "var(--surface)", overflow: "hidden" }}>
            <button onClick={() => setOpen(on ? null : r)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: "none",
                background: on ? "var(--primary-soft)" : "var(--surface)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: info.color + "22" }}>
                <Icon name={info.icon} size={15} color={info.color} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{info.th}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{scLabel} · {nPerm} สิทธิ์</span>
              </span>
              <Icon name="chevronDown" size={15} color="var(--text-3)" style={{ flexShrink: 0, transform: on ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
            </button>

            {on && (
              <div style={{ padding: "4px 13px 14px", display: "flex", flexDirection: "column", gap: 13, borderTop: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".04em", color: "var(--text-3)", margin: "12px 0 7px" }}>เห็นงานแบบไหน</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {SCOPE_MODES.map((m) => {
                      const sel = sc.mode === m.key;
                      return (
                        <button key={m.key} onClick={() => setScope(r, m.key)}
                          style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 11px", borderRadius: 10, cursor: "pointer",
                            fontFamily: "inherit", textAlign: "left", width: "100%",
                            border: "1px solid " + (sel ? "var(--primary)" : "var(--border)"),
                            background: sel ? "var(--primary-soft)" : "var(--surface2)" }}>
                          <span style={{ width: 16, height: 16, borderRadius: 99, flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center",
                            border: "2px solid " + (sel ? "var(--primary)" : "var(--border-strong)") }}>
                            {sel && <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--primary)" }} />}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: sel ? "var(--primary-dark)" : "var(--text-1)" }}>{m.th}</span>
                            <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.45 }}>{m.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {sc.mode === "stages" && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                      {STAGES.map((s) => {
                        const sel = (sc.stages || []).indexOf(s.key) !== -1;
                        return (
                          <button key={s.key} onClick={() => toggleStage(r, s.key)}
                            style={{ padding: "6px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                              border: "1px solid " + (sel ? "transparent" : "var(--border)"),
                              background: sel ? s.color : "var(--surface2)", color: sel ? "#fff" : "var(--text-2)" }}>{s.th}</button>
                        );
                      })}
                      {(sc.stages || []).length === 0 && (
                        <span style={{ fontSize: 11.5, color: "var(--tint-red-tx)", fontWeight: 600, alignSelf: "center" }}>ยังไม่ได้เลือกขั้นไหนเลย — ตอนนี้จะไม่เห็นงานสักใบ</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".04em", color: "var(--text-3)", marginBottom: 7 }}>ทำอะไรได้บ้าง</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {PERM_LIST.map((p) => {
                      const sel = !!(PERMS[r] || {})[p.key];
                      const locked = r === "admin" && p.key === "manageUsers";
                      return (
                        <button key={p.key} onClick={() => !locked && togglePerm(r, p.key)} disabled={locked}
                          style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 11px", borderRadius: 10,
                            cursor: locked ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", width: "100%",
                            border: "1px solid " + (sel ? "var(--primary)" : "var(--border)"),
                            background: sel ? "var(--primary-soft)" : "var(--surface2)", opacity: locked ? .65 : 1 }}>
                          <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center",
                            background: sel ? "var(--primary)" : "var(--surface)", border: "1px solid " + (sel ? "var(--primary)" : "var(--border-strong)") }}>
                            {sel && <Icon name="check" size={11} color="#fff" sw={3} />}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: sel ? "var(--primary-dark)" : "var(--text-2)" }}>
                              {p.th}{locked && <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}> · ล็อกไว้</span>}
                            </span>
                            <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1, lineHeight: 1.45 }}>{p.desc}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 2 }}>
        {askReset ? (
          <React.Fragment>
            <span style={{ fontSize: 12.5, color: "var(--tint-red-tx)", fontWeight: 700 }}>คืนค่าสิทธิ์ทุกตำแหน่งเป็นค่าตั้งต้น?</span>
            <button onClick={() => { roleCfg.resetAll(); setAskReset(false); }}
              style={{ padding: "8px 15px", borderRadius: 9, border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>คืนค่า</button>
            <button onClick={() => setAskReset(false)}
              style={{ padding: "8px 15px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>ยกเลิก</button>
          </React.Fragment>
        ) : (
          <button onClick={() => setAskReset(true)}
            style={{ padding: "8px 15px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>
            คืนค่าตั้งต้นทั้งหมด
          </button>
        )}
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{roleCfg.custom ? "ใช้ค่าที่ตั้งเอง" : "ใช้ค่าตั้งต้นของระบบ"}</span>
      </div>
    </div>
  );
}

function UserManager({ authStore, onClose, roleCfg }) {
  const bdClose = window.useBackdropClose(onClose);
  const users = authStore.users;
  const [tab, setTab] = React.useState("users");         // users | perms
  const [editing, setEditing] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");     // "all" | role key | "off" (บัญชีที่ระงับ)
  const [delAsk, setDelAsk] = React.useState(null);      // id ที่กำลังถามยืนยันลบ
  const isMobile = window.matchMedia("(max-width: 860px)").matches;

  /* จำนวนคนต่อตำแหน่ง — คนที่ถือหลายตำแหน่งจะถูกนับในทุกตำแหน่งที่ถือ */
  const counts = React.useMemo(() => {
    const c = { all: users.length, off: 0 };
    users.forEach((u) => {
      if (u.active === false) c.off++;
      userRoles(u).forEach((r) => { c[r] = (c[r] || 0) + 1; });
    });
    return c;
  }, [users]);

  const shown = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    return users
      .filter((u) => {
        if (filter === "off") { if (u.active !== false) return false; }
        else if (filter !== "all" && !hasRole(userRoles(u), filter)) return false;
        if (!kw) return true;
        return ((u.name || "") + " " + (u.username || "")).toLowerCase().includes(kw);
      })
      /* เรียงตามลำดับความสำคัญของตำแหน่งสูงสุดที่ถือ แล้วค่อยเรียงตามชื่อ — หาคนเจอง่ายกว่าเรียงตามเวลาสร้าง */
      .sort((a, b) => {
        const ra = ROLE_KEYS.indexOf(userRoles(a)[0]), rb = ROLE_KEYS.indexOf(userRoles(b)[0]);
        if (ra !== rb) return ra - rb;
        return (a.name || "").localeCompare(b.name || "", "th");
      });
  }, [users, q, filter]);

  const chip = (key, label, n) => (
    <button key={key} onClick={() => setFilter(key)}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, cursor: "pointer",
        fontFamily: "inherit", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        border: "1px solid " + (filter === key ? "transparent" : "var(--border)"),
        background: filter === key ? "var(--primary)" : "var(--surface)",
        color: filter === key ? "#fff" : "var(--text-2)" }}>
      {label}
      <span style={{ fontSize: 10.5, fontWeight: 700, opacity: .75 }}>{n || 0}</span>
    </button>
  );

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)",
      zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20,
        width: isMobile ? "100%" : "min(720px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

        <div style={{ padding: "18px 22px 0", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="users" size={19} color="var(--primary-dark)" /></span>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{tab === "perms" ? "สิทธิ์ตามตำแหน่ง" : "จัดการผู้ใช้งาน"}</h2>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {tab === "perms" ? "ตั้งเองได้ว่าแต่ละตำแหน่งเห็นงานไหน ทำอะไรได้" : users.length + " บัญชี · หนึ่งคนถือได้หลายตำแหน่ง"}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={17} /></button>
          </div>

          <div style={{ display: "flex", gap: 4, marginTop: 13, padding: 3, borderRadius: 11, background: "var(--surface2)" }}>
            {[["users", "บัญชีผู้ใช้"], ["perms", "สิทธิ์ตำแหน่ง"]].map(([k, th]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  background: tab === k ? "var(--surface)" : "transparent", color: tab === k ? "var(--primary-dark)" : "var(--text-3)",
                  boxShadow: tab === k ? "0 1px 3px rgba(8,20,14,.12)" : "none" }}>{th}</button>
            ))}
          </div>

          {tab === "users" ? (
            <React.Fragment>
              <div style={{ position: "relative", marginTop: 12 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center" }}><Icon name="search" size={15} color="var(--text-3)" /></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ หรือ ชื่อผู้ใช้…"
                  style={Object.assign({}, A_INPUT, { paddingLeft: 36, fontSize: 13.5 })} />
              </div>

              <div className="cat-chip-row" style={{ display: "flex", gap: 6, marginTop: 11, paddingBottom: 13, overflowX: "auto" }}>
                {chip("all", "ทั้งหมด", counts.all)}
                {ROLE_KEYS.map((r) => chip(r, ROLE_INFO[r].short, counts[r]))}
                {counts.off > 0 && chip("off", "ระงับอยู่", counts.off)}
              </div>
            </React.Fragment>
          ) : <div style={{ height: 14 }} />}
        </div>

        {tab === "perms" ? (
          <div style={{ overflowY: "auto", padding: 16, borderTop: "1px solid var(--border)" }}>
            <RolePermsEditor roleCfg={roleCfg || { saveRole: () => {}, resetAll: () => {}, custom: false }} />
          </div>
        ) : (
        <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)" }}>
          {shown.length === 0 && (
            <div style={{ padding: "34px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>ไม่พบบัญชีที่ตรงกับที่ค้นหา</div>
          )}
          {shown.map((u) => {
            const rs = userRoles(u);
            const head = ROLE_INFO[rs[0]] || ROLE_INFO.tech;
            const asking = delAsk === u.id;
            return (
              <div key={u.id} style={{ padding: "11px 13px", background: "var(--surface)", borderRadius: 12,
                border: "1px solid " + (asking ? "var(--tint-red-bd)" : "var(--border)"),
                opacity: u.active === false && !asking ? 0.55 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
                    background: head.color, color: "#fff", fontWeight: 700, fontSize: 14 }}>{(u.name || "?").slice(0, 1)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                      {u.name || "(ยังไม่ระบุชื่อ)"}
                      {u.username && <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, fontFamily: "var(--mono)" }}> · @{u.username}</span>}
                      {u.active === false && <span style={{ fontSize: 10.5, color: "#EF4444", fontWeight: 600 }}> · ระงับ</span>}
                    </div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <RoleBadges roles={rs} short />
                      {u.techId && (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                          → {(window.SF.TECH_BY_ID[u.techId] || {}).name || u.techId}
                        </span>
                      )}
                    </div>
                  </div>
                  {!asking && (
                    <React.Fragment>
                      <button onClick={() => setEditing(Object.assign({}, u))} title="แก้ไข" style={{ background: "#3B82F614", border: "none", color: "#3B82F6", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="settings" size={15} /></button>
                      <button onClick={() => {
                          if (hasRole(rs, "admin") && users.filter((x) => hasRole(userRoles(x), "admin")).length <= 1) { setEditing(null); setDelAsk("__lastadmin"); return; }
                          setDelAsk(u.id);
                        }} title="ลบ" style={{ background: "#EF444414", border: "none", color: "#EF4444", width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="x" size={15} /></button>
                    </React.Fragment>
                  )}
                </div>
                {/* ยืนยันลบในแถวเลย ไม่ใช้ confirm() ของเบราว์เซอร์ (บางเครื่องจะถูกปิดไว้ กดแล้วเงียบ) */}
                {asking && (
                  <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px dashed var(--border)", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <span style={{ flex: 1, minWidth: 150, fontSize: 12.5, fontWeight: 600, color: "var(--tint-red-tx)" }}>ลบบัญชีนี้ถาวร? คนนี้จะเข้าระบบไม่ได้อีก</span>
                    <button onClick={() => { authStore.removeUser(u.id); setDelAsk(null); }}
                      style={{ padding: "8px 15px", borderRadius: 9, border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>ลบเลย</button>
                    <button onClick={() => setDelAsk(null)}
                      style={{ padding: "8px 15px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>ยกเลิก</button>
                  </div>
                )}
              </div>
            );
          })}
          {delAsk === "__lastadmin" && (
            <div style={{ padding: "11px 13px", borderRadius: 12, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)",
              fontSize: 12.5, fontWeight: 600, color: "var(--tint-amber-tx)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1 }}>ลบไม่ได้ — ต้องเหลือแอดมินอย่างน้อย 1 คน</span>
              <button onClick={() => setDelAsk(null)} style={{ background: "none", border: "none", color: "inherit", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>ปิด</button>
            </div>
          )}
        </div>
        )}

        {tab === "users" && (
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>แสดง {shown.length} จาก {users.length}</span>
          <button onClick={() => setEditing(authStore.blankUser())} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}><Icon name="plus" size={16} color="#fff" sw={2.4} /> เพิ่มผู้ใช้</button>
        </div>
        )}
      </div>

      {editing && <UserEditModal initial={editing} existing={users}
        onSave={(rec) => { authStore.upsertUser(rec); setEditing(null); }} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ---------- ตัวเลือกตำแหน่ง (ติ๊กได้หลายอัน) ---------- */
function RolePicker({ value, onChange }) {
  const sel = value || [];
  const toggle = (k) => onChange(sel.indexOf(k) === -1 ? sel.concat([k]) : sel.filter((x) => x !== k));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {ROLE_KEYS.map((k) => {
        const r = ROLE_INFO[k], on = sel.indexOf(k) !== -1;
        return (
          <button type="button" key={k} onClick={() => toggle(k)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 11, cursor: "pointer",
              textAlign: "left", fontFamily: "inherit", width: "100%",
              border: "1px solid " + (on ? r.color : "var(--border)"),
              background: on ? r.color + "14" : "var(--surface)" }}>
            <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center",
              background: on ? r.color : "transparent", border: "1.5px solid " + (on ? r.color : "var(--border-strong)") }}>
              {on && <Icon name="check" size={12} color="#fff" sw={3} />}
            </span>
            <Icon name={r.icon} size={15} color={on ? r.color : "var(--text-3)"} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: on ? r.color : "var(--text-1)" }}>{r.th}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4 }}>{r.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function UserEditModal({ initial, existing, onSave, onClose }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [f, setF] = React.useState(() => Object.assign({}, initial, { roles: userRoles(initial) }));
  const [err, setErr] = React.useState("");
  const set = (k, v) => { setF((p) => Object.assign({}, p, { [k]: v })); setErr(""); };
  const isNew = !existing.some((u) => u.id === initial.id);
  /* ตำแหน่งที่ต้องผูกกับพนักงานในระบบ เพราะมีการมอบหมายงาน/นัดสำรวจส่งถึงตัวคน */
  const needTech = f.roles.some((r) => r === "tech" || r === "ee" || r === "sales");

  const save = () => {
    const uname = String(f.username || "").trim();
    if (!f.name.trim()) { setErr("กรุณากรอกชื่อ-สกุล"); return; }
    if (!uname) { setErr("กรุณากรอกชื่อผู้ใช้ (ID เข้าระบบ)"); return; }
    if (existing.some((u) => u.id !== f.id && (u.username || "").toLowerCase() === uname.toLowerCase())) { setErr("ชื่อผู้ใช้ \"" + uname + "\" ถูกใช้แล้ว กรุณาตั้งใหม่"); return; }
    if (!String(f.pin).trim()) { setErr("กรุณากรอกรหัสผ่าน"); return; }
    if (!f.roles.length) { setErr("เลือกตำแหน่งอย่างน้อย 1 ตำแหน่ง"); return; }
    if (needTech && !f.techId) { setErr("ตำแหน่งที่เลือกต้องผูกกับพนักงานในระบบ เพื่อรับงาน/นัดสำรวจ"); return; }
    /* เรียงตำแหน่งตามลำดับมาตรฐาน แล้วเก็บ role (ตำแหน่งเดียว) ไว้ด้วยเพื่อความเข้ากันได้กับข้อมูลเดิม */
    const roles = ROLE_KEYS.filter((k) => f.roles.indexOf(k) !== -1);
    onSave(Object.assign({}, f, { name: f.name.trim(), username: uname, pin: String(f.pin).trim(), roles: roles, role: roles[0] }));
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", zIndex: 120, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(460px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขผู้ใช้"}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <AField label="ชื่อ-สกุล (แสดงในระบบ)" required><input autoFocus style={A_INPUT} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น สมชาย ตั้งใจ" /></AField>
          <AField label="ชื่อผู้ใช้ (ID เข้าระบบ)" required><input style={A_INPUT} value={f.username || ""} autoCapitalize="none" autoCorrect="off" spellCheck={false} onChange={(e) => set("username", e.target.value.replace(/\s/g, ""))} placeholder="เช่น somchai" /></AField>
          <AField label="รหัสผ่าน" required><input style={A_INPUT} value={f.pin} onChange={(e) => set("pin", e.target.value)} placeholder="ตั้งรหัสผ่าน" /></AField>
          <AField label={"ตำแหน่ง — ติ๊กได้หลายอัน (เลือกไว้ " + f.roles.length + ")"} required>
            <RolePicker value={f.roles} onChange={(v) => set("roles", v)} />
          </AField>
          {needTech && (
            <AField label="ผูกกับพนักงานในระบบ (เพื่อรับงาน / นัดสำรวจ)" required>
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
          {err && <div style={{ fontSize: 12.5, fontWeight: 600, color: "#EF4444" }}>⚠ {err}</div>}
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={save}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { useAuthStore, useNotifStore, LoginScreen, NotifPanel, UserManager,
  can, hasRole, userRoles, ROLE_INFO, ROLE_KEYS, ROLE_ALIAS, RoleBadge, RoleBadges,
  useRoleConfig, jobScopeOf, jobInScope, PERM_LIST, SCOPE_MODES, DEFAULT_PERMS, applyRoleConfig, roleConfigNow });
