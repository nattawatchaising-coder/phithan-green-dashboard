function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const _AFB = () => !!window.FBDB;
const _aref = p => window.FBDB.ref(p);
const _asnap = snap => {
  const v = snap.val();
  if (!v || typeof v !== "object") return null;
  return Object.values(v);
};
const _aobj = arr => Object.fromEntries(arr.map(x => [x.id, x]));
const SF_SESSION_KEY = "solarflow_session_v1";
const SF_USERS_KEY = "solarflow_users_v1";
const SF_NOTIF_KEY = "solarflow_notifs_v1";
function _alsGet(key, seed) {
  try {
    const s = localStorage.getItem(key);
    if (s) {
      const a = JSON.parse(s);
      if (Array.isArray(a)) return a;
    }
  } catch (e) {}
  return seed ? seed.slice() : [];
}
function _alsSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}
const ADMIN_SEED = {
  id: "u-admin",
  name: "แอดมิน",
  username: "admin",
  pin: "1234",
  role: "admin",
  roles: ["admin"],
  techId: null,
  active: true
};
const ROLE_INFO = {
  admin: {
    th: "แอดมิน",
    short: "แอดมิน",
    icon: "shield",
    color: "#22A35B",
    desc: "ควบคุมทั้งระบบ · จัดการผู้ใช้ · ลบงาน"
  },
  lead: {
    th: "หัวหน้า",
    short: "หัวหน้า",
    icon: "users",
    color: "#3B82F6",
    desc: "ดูทุกงาน · สั่งงาน · เห็นราคา"
  },
  ee: {
    th: "วิศวกรไฟฟ้า",
    short: "วิศวกรไฟฟ้า",
    icon: "bolt",
    color: "#8B5CF6",
    desc: "ออกแบบระบบ · สำรวจหน้างาน · เอกสารขออนุญาต"
  },
  draft: {
    th: "วิศวกรเขียนแบบ",
    short: "เขียนแบบ",
    icon: "ruler",
    color: "#0EA5E9",
    desc: "เขียนแบบ / ออกไฟล์ DXF"
  },
  tech: {
    th: "ช่างติดตั้ง",
    short: "ช่าง",
    icon: "wrench",
    color: "#F59E0B",
    desc: "เห็นเฉพาะงานที่ได้รับมอบหมาย"
  },
  permit: {
    th: "แอดมิน ขออนุญาต",
    short: "ขออนุญาต",
    icon: "file",
    color: "#14B8A6",
    desc: "งานเอกสารยื่นขออนุญาตการไฟฟ้า"
  },
  sales: {
    th: "เซลล์",
    short: "เซลล์",
    icon: "trend",
    color: "#EC4899",
    desc: "ลูกค้าสำรวจ · เปิดงานใหม่ · เห็นราคา"
  }
};
const ROLE_KEYS = Object.keys(ROLE_INFO);
const ROLE_ALIAS = {
  manager: "lead",
  survey: "ee",
  office: "admin"
};
function userRoles(u) {
  if (!u) return [];
  const raw = Array.isArray(u.roles) && u.roles.length ? u.roles : u.role ? [u.role] : [];
  const out = [];
  raw.forEach(r => {
    const k = ROLE_ALIAS[r] || r;
    if (ROLE_INFO[k] && out.indexOf(k) === -1) out.push(k);
  });
  return out.length ? out : ["tech"];
}
const PERMS = {
  admin: {
    viewAll: 1,
    addJob: 1,
    editJob: 1,
    delJob: 1,
    stock: 1,
    manageUsers: 1,
    dispatch: 1,
    doSurvey: 1,
    design: 1,
    permit: 1,
    price: 1,
    leads: 1
  },
  lead: {
    viewAll: 1,
    addJob: 1,
    editJob: 1,
    delJob: 1,
    stock: 1,
    dispatch: 1,
    doSurvey: 1,
    design: 1,
    permit: 1,
    price: 1,
    leads: 1
  },
  ee: {
    viewAll: 1,
    editJob: 1,
    stock: 1,
    dispatch: 1,
    doSurvey: 1,
    design: 1,
    permit: 1
  },
  draft: {
    viewAll: 1,
    editJob: 1,
    stock: 1,
    design: 1
  },
  tech: {
    editJob: 1,
    stock: 1,
    doSurvey: 1
  },
  permit: {
    viewAll: 1,
    editJob: 1,
    permit: 1
  },
  sales: {
    viewAll: 1,
    addJob: 1,
    dispatch: 1,
    doSurvey: 1,
    price: 1,
    leads: 1
  }
};
function can(roles, action) {
  const arr = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return arr.some(r => {
    const k = ROLE_ALIAS[r] || r;
    return !!(PERMS[k] && PERMS[k][action]);
  });
}
function hasRole(roles, key) {
  const arr = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return arr.some(r => (ROLE_ALIAS[r] || r) === key);
}
function blankUser() {
  return {
    id: "u-" + Date.now().toString(36),
    name: "",
    username: "",
    pin: "",
    role: "tech",
    roles: ["tech"],
    techId: null,
    active: true
  };
}
function useAuthStore() {
  const [users, setUsers] = React.useState(_AFB() ? null : () => _alsGet(SF_USERS_KEY, [ADMIN_SEED]));
  const [sessionId, setSession] = React.useState(() => {
    try {
      return localStorage.getItem(SF_SESSION_KEY) || null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = React.useState(_AFB());
  React.useEffect(() => {
    if (!_AFB()) return;
    const ref = _aref("users");
    const h = ref.on("value", snap => {
      let arr = _asnap(snap);
      if (!arr || arr.length === 0) {
        arr = [ADMIN_SEED];
        ref.set(_aobj(arr));
      }
      setUsers(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  React.useEffect(() => {
    if (!_AFB() && users) _alsSet(SF_USERS_KEY, users);
  }, [users]);
  const list = users || [];
  const current = list.find(u => u.id === sessionId && u.active !== false) || null;
  const login = React.useCallback((userId, pin) => {
    const u = (users || []).find(x => x.id === userId);
    if (!u) return {
      ok: false,
      error: "ไม่พบผู้ใช้"
    };
    if (u.active === false) return {
      ok: false,
      error: "บัญชีถูกระงับการใช้งาน"
    };
    if (String(u.pin) !== String(pin)) return {
      ok: false,
      error: "รหัสผ่านไม่ถูกต้อง"
    };
    try {
      localStorage.setItem(SF_SESSION_KEY, u.id);
    } catch (e) {}
    setSession(u.id);
    return {
      ok: true
    };
  }, [users]);
  const loginCred = React.useCallback((username, password) => {
    const uname = String(username || "").trim().toLowerCase();
    if (!uname) return {
      ok: false,
      error: "กรุณากรอกชื่อผู้ใช้"
    };
    const u = (users || []).find(x => (x.username || "").toLowerCase() === uname) || (users || []).find(x => !x.username && (x.name || "").trim().toLowerCase() === uname) || (uname === "admin" ? (users || []).find(x => !x.username && x.role === "admin") : null);
    if (!u) return {
      ok: false,
      error: "ไม่พบบัญชีนี้"
    };
    if (u.active === false) return {
      ok: false,
      error: "บัญชีถูกระงับการใช้งาน"
    };
    if (String(u.pin) !== String(password)) return {
      ok: false,
      error: "รหัสผ่านไม่ถูกต้อง"
    };
    try {
      localStorage.setItem(SF_SESSION_KEY, u.id);
    } catch (e) {}
    setSession(u.id);
    return {
      ok: true
    };
  }, [users]);
  const logout = React.useCallback(() => {
    try {
      localStorage.removeItem(SF_SESSION_KEY);
    } catch (e) {}
    setSession(null);
  }, []);
  const upsertUser = React.useCallback(rec => {
    if (_AFB()) {
      _aref("users/" + rec.id).set(rec);
    } else setUsers(prev => {
      const i = (prev || []).findIndex(u => u.id === rec.id);
      if (i === -1) return [...(prev || []), Object.assign({}, rec)];
      const copy = prev.slice();
      copy[i] = Object.assign({}, prev[i], rec);
      return copy;
    });
  }, []);
  const removeUser = React.useCallback(id => {
    if (_AFB()) {
      _aref("users/" + id).remove();
    } else setUsers(prev => (prev || []).filter(u => u.id !== id));
  }, []);
  return {
    users: list,
    current,
    loading,
    login,
    loginCred,
    logout,
    upsertUser,
    removeUser,
    blankUser: () => blankUser()
  };
}
function useNotifStore() {
  const [notifs, setNotifs] = React.useState(_AFB() ? null : () => _alsGet(SF_NOTIF_KEY, []));
  React.useEffect(() => {
    if (!_AFB()) return;
    const ref = _aref("notifications");
    const h = ref.on("value", snap => {
      let arr = _asnap(snap) || [];
      arr.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
      setNotifs(arr);
    }, () => setNotifs([]));
    return () => ref.off("value", h);
  }, []);
  React.useEffect(() => {
    if (!_AFB() && notifs) _alsSet(SF_NOTIF_KEY, notifs);
  }, [notifs]);
  const addNotif = React.useCallback(n => {
    const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const rec = Object.assign({
      id,
      read: false,
      at: new Date().toISOString()
    }, n);
    if (_AFB()) {
      _aref("notifications/" + id).set(rec);
    } else setNotifs(prev => [rec, ...(prev || [])]);
  }, []);
  const markRead = React.useCallback(id => {
    if (_AFB()) {
      _aref("notifications/" + id + "/read").set(true);
    } else setNotifs(prev => (prev || []).map(n => n.id === id ? Object.assign({}, n, {
      read: true
    }) : n));
  }, []);
  const markAllRead = React.useCallback(toTechId => {
    const target = (notifs || []).filter(n => n.toTechId === toTechId && !n.read);
    if (_AFB()) {
      target.forEach(n => _aref("notifications/" + n.id + "/read").set(true));
    } else setNotifs(prev => (prev || []).map(n => n.toTechId === toTechId ? Object.assign({}, n, {
      read: true
    }) : n));
  }, [notifs]);
  return {
    notifs: notifs || [],
    addNotif,
    markRead,
    markAllRead
  };
}
const A_INPUT = {
  background: "var(--surface2)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 10,
  outline: "none",
  width: "100%"
};
function AField({
  label,
  required,
  children,
  full
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      gridColumn: full ? "1 / -1" : "auto"
    }
  }, React.createElement("label", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, label, required && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), children);
}
function RoleBadge({
  role,
  short
}) {
  const r = ROLE_INFO[ROLE_ALIAS[role] || role] || ROLE_INFO.tech;
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 700,
      color: r.color,
      background: r.color + "16",
      padding: "2px 9px",
      borderRadius: 99,
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: r.icon,
    size: 11,
    color: r.color
  }), " ", short ? r.short : r.th);
}
function RoleBadges({
  roles,
  short
}) {
  const arr = userRoles({
    roles
  });
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      flexWrap: "wrap",
      gap: 4,
      alignItems: "center"
    }
  }, arr.map(r => React.createElement(RoleBadge, {
    key: r,
    role: r,
    short: short
  })));
}
function LoginScreen({
  authStore
}) {
  const [username, setUsername] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [err, setErr] = React.useState("");
  const pwRef = React.useRef(null);
  const submit = () => {
    const res = authStore.loginCred(username, pw);
    if (!res.ok) {
      setErr(res.error);
      setPw("");
    }
  };
  return React.createElement("div", {
    style: {
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      gap: 22,
      padding: "calc(20px + env(safe-area-inset-top, 0px)) 20px calc(20px + env(safe-area-inset-bottom, 0px))"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("img", {
    src: "dashboard/assets/phithan-mark.png",
    alt: "PHITHAN GREEN",
    style: {
      height: 56,
      borderRadius: 14,
      padding: 8,
      background: "#fff",
      boxShadow: "0 4px 18px rgba(34,163,91,.18)"
    }
  }), React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 22,
      fontWeight: 800,
      color: "var(--primary-dark)",
      letterSpacing: "-.01em"
    }
  }, "PHITHAN GREEN"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E42\u0E0B\u0E25\u0E48\u0E32\u0E40\u0E0B\u0E25\u0E25\u0E4C"))), React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      boxShadow: "var(--shadow-sm)",
      width: "min(420px, 100%)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: 22
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-1)",
      marginBottom: 16
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 13
    }
  }, React.createElement(AField, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 (ID)",
    required: true
  }, React.createElement("input", {
    autoFocus: true,
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
    value: username,
    onChange: e => {
      setUsername(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter" && pwRef.current) pwRef.current.focus();
    },
    style: A_INPUT
  })), React.createElement(AField, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    required: true
  }, React.createElement("div", {
    style: {
      position: "relative"
    }
  }, React.createElement("input", {
    ref: pwRef,
    type: show ? "text" : "password",
    value: pw,
    onChange: e => {
      setPw(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter") submit();
    },
    style: Object.assign({}, A_INPUT, {
      paddingRight: 44
    }),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022"
  }), React.createElement("button", {
    type: "button",
    onClick: () => setShow(s => !s),
    tabIndex: -1,
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",
      width: 42,
      display: "grid",
      placeItems: "center",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: show ? "eyeOff" : "eye",
    size: 17,
    color: "var(--text-3)"
  }))))), err && React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 12.5,
      color: "#EF4444",
      fontWeight: 600,
      textAlign: "center"
    }
  }, "\u26A0 ", err), React.createElement("button", {
    onClick: submit,
    style: {
      marginTop: 18,
      width: "100%",
      padding: "13px 16px",
      borderRadius: 12,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A ", React.createElement(Icon, {
    name: "arrowRight",
    size: 17,
    color: "#fff"
  })))));
}
function NotifPanel({
  items,
  lateAlerts,
  onClose,
  onOpenJob,
  onMarkAll
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const alerts = lateAlerts || [];
  return React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 95
    }
  }), React.createElement("div", {
    style: isMobile ? {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 96,
      background: "var(--bg)",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      boxShadow: "0 -10px 40px rgba(8,20,14,.22)",
      maxHeight: "70dvh",
      display: "flex",
      flexDirection: "column",
      animation: "sheetUp .26s cubic-bezier(.3,.9,.3,1)"
    } : {
      position: "absolute",
      top: "calc(100% + 8px)",
      right: 0,
      zIndex: 96,
      width: 340,
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      boxShadow: "0 18px 50px rgba(8,20,14,.22)",
      maxHeight: 440,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-1)",
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "bell",
    size: 15,
    color: "var(--primary)"
  }), " \u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"), items.some(n => !n.read) && React.createElement("button", {
    onClick: onMarkAll,
    style: {
      background: "none",
      border: "none",
      color: "var(--primary-dark)",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 10,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom, 0px))" : 10
    }
  }, items.length === 0 && alerts.length === 0 && React.createElement("div", {
    style: {
      padding: "28px 0",
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"), alerts.length > 0 && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "#EF4444",
      padding: "2px 4px"
    }
  }, "\u26A0 \u0E07\u0E32\u0E19\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14 (", alerts.length, ")"), alerts.map((a, i) => React.createElement("button", {
    key: a.jobId + a.stage.key + i,
    onClick: () => onOpenJob({
      jobId: a.jobId
    }),
    style: {
      display: "flex",
      gap: 10,
      padding: "11px 12px",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "inherit",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd)",
      borderRadius: 11
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "#EF4444",
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#fff"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, a.jobName), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: "var(--tint-red-tx)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, "\u0E02\u0E31\u0E49\u0E19 \"", a.stage.th, "\" \u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14 ", a.stage.daysLate, " \u0E27\u0E31\u0E19"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2A\u0E23\u0E47\u0E08 ", thDate ? thDate(a.stage.end, true) : a.stage.end)))), items.length > 0 && React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border)",
      margin: "4px 2px"
    }
  })), items.map(n => React.createElement("button", {
    key: n.id,
    onClick: () => onOpenJob(n),
    style: {
      display: "flex",
      gap: 10,
      padding: "11px 12px",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "inherit",
      background: n.read ? "var(--surface)" : "var(--primary-soft)",
      border: "1px solid " + (n.read ? "var(--border)" : "var(--primary)"),
      borderRadius: 11
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--primary)",
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: "wrench",
    size: 15,
    color: "#fff"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, n.title), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: "var(--text-2)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, n.body), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, thDateTime ? thDateTime(n.at) : "")), !n.read && React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: "var(--primary)",
      flexShrink: 0,
      marginTop: 4
    }
  }))))));
}
function UserManager({
  authStore,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const users = authStore.users;
  const [editing, setEditing] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [delAsk, setDelAsk] = React.useState(null);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const counts = React.useMemo(() => {
    const c = {
      all: users.length,
      off: 0
    };
    users.forEach(u => {
      if (u.active === false) c.off++;
      userRoles(u).forEach(r => {
        c[r] = (c[r] || 0) + 1;
      });
    });
    return c;
  }, [users]);
  const shown = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    return users.filter(u => {
      if (filter === "off") {
        if (u.active !== false) return false;
      } else if (filter !== "all" && !hasRole(userRoles(u), filter)) return false;
      if (!kw) return true;
      return ((u.name || "") + " " + (u.username || "")).toLowerCase().includes(kw);
    }).sort((a, b) => {
      const ra = ROLE_KEYS.indexOf(userRoles(a)[0]),
        rb = ROLE_KEYS.indexOf(userRoles(b)[0]);
      if (ra !== rb) return ra - rb;
      return (a.name || "").localeCompare(b.name || "", "th");
    });
  }, [users, q, filter]);
  const chip = (key, label, n) => React.createElement("button", {
    key: key,
    onClick: () => setFilter(key),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
      border: "1px solid " + (filter === key ? "transparent" : "var(--border)"),
      background: filter === key ? "var(--primary)" : "var(--surface)",
      color: filter === key ? "#fff" : "var(--text-2)"
    }
  }, label, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      opacity: .75
    }
  }, n || 0));
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 110,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 20,
      width: isMobile ? "100%" : "min(720px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px 0",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "users",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, users.length, " \u0E1A\u0E31\u0E0D\u0E0A\u0E35 \xB7 \u0E2B\u0E19\u0E36\u0E48\u0E07\u0E04\u0E19\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E2B\u0E25\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07"))), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 17
  }))), React.createElement("div", {
    style: {
      position: "relative",
      marginTop: 14
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  })), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D \u0E2B\u0E23\u0E37\u0E2D \u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u2026",
    style: Object.assign({}, A_INPUT, {
      paddingLeft: 36,
      fontSize: 13.5
    })
  })), React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 6,
      marginTop: 11,
      paddingBottom: 13,
      overflowX: "auto"
    }
  }, chip("all", "ทั้งหมด", counts.all), ROLE_KEYS.map(r => chip(r, ROLE_INFO[r].short, counts[r])), counts.off > 0 && chip("off", "ระงับอยู่", counts.off))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      borderTop: "1px solid var(--border)"
    }
  }, shown.length === 0 && React.createElement("div", {
    style: {
      padding: "34px 0",
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32"), shown.map(u => {
    const rs = userRoles(u);
    const head = ROLE_INFO[rs[0]] || ROLE_INFO.tech;
    const asking = delAsk === u.id;
    return React.createElement("div", {
      key: u.id,
      style: {
        padding: "11px 13px",
        background: "var(--surface)",
        borderRadius: 12,
        border: "1px solid " + (asking ? "var(--tint-red-bd)" : "var(--border)"),
        opacity: u.active === false && !asking ? 0.55 : 1
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, React.createElement("span", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 99,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: head.color,
        color: "#fff",
        fontWeight: 700,
        fontSize: 14
      }
    }, (u.name || "?").slice(0, 1)), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, u.name || "(ยังไม่ระบุชื่อ)", u.username && React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        fontWeight: 600,
        fontFamily: "var(--mono)"
      }
    }, " \xB7 @", u.username), u.active === false && React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "#EF4444",
        fontWeight: 600
      }
    }, " \xB7 \u0E23\u0E30\u0E07\u0E31\u0E1A")), React.createElement("div", {
      style: {
        marginTop: 4,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap"
      }
    }, React.createElement(RoleBadges, {
      roles: rs,
      short: true
    }), u.techId && React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, "\u2192 ", (window.SF.TECH_BY_ID[u.techId] || {}).name || u.techId))), !asking && React.createElement(React.Fragment, null, React.createElement("button", {
      onClick: () => setEditing(Object.assign({}, u)),
      title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
      style: {
        background: "#3B82F614",
        border: "none",
        color: "#3B82F6",
        width: 32,
        height: 32,
        borderRadius: 8,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "settings",
      size: 15
    })), React.createElement("button", {
      onClick: () => {
        if (hasRole(rs, "admin") && users.filter(x => hasRole(userRoles(x), "admin")).length <= 1) {
          setEditing(null);
          setDelAsk("__lastadmin");
          return;
        }
        setDelAsk(u.id);
      },
      title: "\u0E25\u0E1A",
      style: {
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        width: 32,
        height: 32,
        borderRadius: 8,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 15
    })))), asking && React.createElement("div", {
      style: {
        marginTop: 11,
        paddingTop: 11,
        borderTop: "1px dashed var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 9,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 150,
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--tint-red-tx)"
      }
    }, "\u0E25\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E16\u0E32\u0E27\u0E23? \u0E04\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01"), React.createElement("button", {
      onClick: () => {
        authStore.removeUser(u.id);
        setDelAsk(null);
      },
      style: {
        padding: "8px 15px",
        borderRadius: 9,
        border: "none",
        background: "#EF4444",
        color: "#fff",
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize: 12.5,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E40\u0E25\u0E22"), React.createElement("button", {
      onClick: () => setDelAsk(null),
      style: {
        padding: "8px 15px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontWeight: 600,
        fontFamily: "inherit",
        fontSize: 12.5,
        cursor: "pointer"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")));
  }), delAsk === "__lastadmin" && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--tint-amber-tx)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      flex: 1
    }
  }, "\u0E25\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 1 \u0E04\u0E19"), React.createElement("button", {
    onClick: () => setDelAsk(null),
    style: {
      background: "none",
      border: "none",
      color: "inherit",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E2A\u0E14\u0E07 ", shown.length, " \u0E08\u0E32\u0E01 ", users.length), React.createElement("button", {
    onClick: () => setEditing(authStore.blankUser()),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 18px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49"))), editing && React.createElement(UserEditModal, {
    initial: editing,
    existing: users,
    onSave: rec => {
      authStore.upsertUser(rec);
      setEditing(null);
    },
    onClose: () => setEditing(null)
  }));
}
function RolePicker({
  value,
  onChange
}) {
  const sel = value || [];
  const toggle = k => onChange(sel.indexOf(k) === -1 ? sel.concat([k]) : sel.filter(x => x !== k));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, ROLE_KEYS.map(k => {
    const r = ROLE_INFO[k],
      on = sel.indexOf(k) !== -1;
    return React.createElement("button", {
      type: "button",
      key: k,
      onClick: () => toggle(k),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 11,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
        border: "1px solid " + (on ? r.color : "var(--border)"),
        background: on ? r.color + "14" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: 6,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: on ? r.color : "transparent",
        border: "1.5px solid " + (on ? r.color : "var(--border-strong)")
      }
    }, on && React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "#fff",
      sw: 3
    })), React.createElement(Icon, {
      name: r.icon,
      size: 15,
      color: on ? r.color : "var(--text-3)"
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 700,
        color: on ? r.color : "var(--text-1)"
      }
    }, r.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 1,
        lineHeight: 1.4
      }
    }, r.desc)));
  }));
}
function UserEditModal({
  initial,
  existing,
  onSave,
  onClose
}) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [f, setF] = React.useState(() => Object.assign({}, initial, {
    roles: userRoles(initial)
  }));
  const [err, setErr] = React.useState("");
  const set = (k, v) => {
    setF(p => Object.assign({}, p, {
      [k]: v
    }));
    setErr("");
  };
  const isNew = !existing.some(u => u.id === initial.id);
  const needTech = f.roles.some(r => r === "tech" || r === "ee" || r === "sales");
  const save = () => {
    const uname = String(f.username || "").trim();
    if (!f.name.trim()) {
      setErr("กรุณากรอกชื่อ-สกุล");
      return;
    }
    if (!uname) {
      setErr("กรุณากรอกชื่อผู้ใช้ (ID เข้าระบบ)");
      return;
    }
    if (existing.some(u => u.id !== f.id && (u.username || "").toLowerCase() === uname.toLowerCase())) {
      setErr("ชื่อผู้ใช้ \"" + uname + "\" ถูกใช้แล้ว กรุณาตั้งใหม่");
      return;
    }
    if (!String(f.pin).trim()) {
      setErr("กรุณากรอกรหัสผ่าน");
      return;
    }
    if (!f.roles.length) {
      setErr("เลือกตำแหน่งอย่างน้อย 1 ตำแหน่ง");
      return;
    }
    if (needTech && !f.techId) {
      setErr("ตำแหน่งที่เลือกต้องผูกกับพนักงานในระบบ เพื่อรับงาน/นัดสำรวจ");
      return;
    }
    const roles = ROLE_KEYS.filter(k => f.roles.indexOf(k) !== -1);
    onSave(Object.assign({}, f, {
      name: f.name.trim(),
      username: uname,
      pin: String(f.pin).trim(),
      roles: roles,
      role: roles[0]
    }));
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      zIndex: 120,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(460px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "เพิ่มผู้ใช้ใหม่" : "แก้ไขผู้ใช้"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), React.createElement("div", {
    style: {
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, React.createElement(AField, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25 (\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A)",
    required: true
  }, React.createElement("input", {
    autoFocus: true,
    style: A_INPUT,
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E15\u0E31\u0E49\u0E07\u0E43\u0E08"
  })), React.createElement(AField, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 (ID \u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A)",
    required: true
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.username || "",
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
    onChange: e => set("username", e.target.value.replace(/\s/g, "")),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 somchai"
  })), React.createElement(AField, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    required: true
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.pin,
    onChange: e => set("pin", e.target.value),
    placeholder: "\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"
  })), React.createElement(AField, {
    label: "ตำแหน่ง — ติ๊กได้หลายอัน (เลือกไว้ " + f.roles.length + ")",
    required: true
  }, React.createElement(RolePicker, {
    value: f.roles,
    onChange: v => set("roles", v)
  })), needTech && React.createElement(AField, {
    label: "\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A (\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19 / \u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08)",
    required: true
  }, React.createElement("select", {
    style: A_INPUT,
    value: f.techId || "",
    onChange: e => set("techId", e.target.value || null)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 \u2014"), SF.TECHS.map(t => React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name, " (", t.role, ")")))), React.createElement(AField, {
    label: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E1A\u0E31\u0E0D\u0E0A\u0E35"
  }, React.createElement("button", {
    type: "button",
    onClick: () => set("active", f.active === false ? true : false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 22,
      borderRadius: 99,
      background: f.active === false ? "var(--surface3)" : "var(--primary)",
      position: "relative",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: f.active === false ? 3 : 19,
      width: 16,
      height: 16,
      borderRadius: 99,
      background: "#fff",
      transition: "left .2s",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: f.active === false ? "var(--text-3)" : "var(--primary-dark)"
    }
  }, f.active === false ? "ระงับการใช้งาน" : "ใช้งานได้"))), err && React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "#EF4444"
    }
  }, "\u26A0 ", err)), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: isMobile ? "0 0 auto" : "none",
      padding: "11px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: save,
    style: {
      flex: isMobile ? 1 : "none",
      padding: "11px 22px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
Object.assign(window, {
  useAuthStore,
  useNotifStore,
  LoginScreen,
  NotifPanel,
  UserManager,
  can,
  hasRole,
  userRoles,
  ROLE_INFO,
  ROLE_KEYS,
  ROLE_ALIAS,
  RoleBadge,
  RoleBadges
});