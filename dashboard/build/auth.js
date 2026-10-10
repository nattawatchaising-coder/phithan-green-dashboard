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
    color: "#1B9B75",
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
  },
  hr: {
    th: "ฝ่ายบุคคล (HR)",
    short: "HR",
    icon: "user",
    color: "#6366F1",
    desc: "เวลาทำงานทั้งบริษัท · อนุมัติ OT"
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
const DEFAULT_PERMS = {
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
    leads: 1,
    om: 1,
    handover: 1,
    billing: 1,
    expense: 1,
    expenseApprove: 1,
    expensePay: 1,
    expenseCover: 1,
    attend: 1,
    attendAll: 1,
    ot: 1,
    otApprove: 1,
    leave: 1,
    leaveApprove: 1
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
    leads: 1,
    om: 1,
    handover: 1,
    billing: 1,
    expense: 1,
    expenseApprove: 1,
    expenseCover: 1,
    attend: 1,
    attendAll: 1,
    ot: 1,
    otApprove: 1,
    leave: 1,
    leaveApprove: 1
  },
  ee: {
    viewAll: 1,
    editJob: 1,
    stock: 1,
    dispatch: 1,
    doSurvey: 1,
    design: 1,
    permit: 1,
    om: 1,
    handover: 1,
    expense: 1,
    attend: 1,
    ot: 1,
    leave: 1
  },
  draft: {
    viewAll: 1,
    editJob: 1,
    stock: 1,
    design: 1,
    attend: 1,
    ot: 1,
    leave: 1
  },
  tech: {
    editJob: 1,
    stock: 1,
    doSurvey: 1,
    om: 1,
    handover: 1,
    expense: 1,
    attend: 1,
    ot: 1,
    leave: 1
  },
  permit: {
    viewAll: 1,
    editJob: 1,
    permit: 1,
    attend: 1,
    ot: 1,
    leave: 1
  },
  sales: {
    viewAll: 1,
    addJob: 1,
    dispatch: 1,
    doSurvey: 1,
    price: 1,
    leads: 1,
    attend: 1,
    ot: 1,
    leave: 1
  },
  hr: {
    attend: 1,
    attendAll: 1,
    ot: 1,
    otApprove: 1,
    leave: 1,
    leaveApprove: 1
  }
};
const PERM_LIST = [{
  key: "viewAll",
  th: "เข้าหน้าฐานข้อมูลงาน / รายงาน",
  desc: "ปิดแล้วจะเห็นแค่บอร์ดงานกับตารางของตัวเอง"
}, {
  key: "addJob",
  th: "เปิดงานใหม่",
  desc: "กดปุ่มเพิ่มงานได้"
}, {
  key: "editJob",
  th: "แก้ไขงาน / เดินขั้นตอน",
  desc: "แก้ข้อมูลงานและเปลี่ยนขั้นตอนได้"
}, {
  key: "delJob",
  th: "ลบงาน",
  desc: "ลบลงถังขยะและกู้คืน"
}, {
  key: "price",
  th: "เห็นราคาและต้นทุน",
  desc: "ราคาขาย ต้นทุนของ ค่าแรง และ BOQ"
}, {
  key: "leads",
  th: "หน้าลูกค้าสำรวจ",
  desc: "รายชื่อลูกค้าที่ยังไม่เปิดเป็นงาน"
}, {
  key: "dispatch",
  th: "จัดตารางสำรวจ",
  desc: "นัดวันสำรวจและมอบหมายผู้สำรวจ"
}, {
  key: "doSurvey",
  th: "ทำแบบสำรวจหน้างาน",
  desc: "กรอกแบบสำรวจและถ่ายรูปหน้างาน"
}, {
  key: "design",
  th: "เขียนแบบ · 3D · ออกไฟล์ DXF",
  desc: "เครื่องมือออกแบบและออกไฟล์แบบ"
}, {
  key: "permit",
  th: "งานขออนุญาตการไฟฟ้า",
  desc: "คิวงานขออนุญาต ตรวจงาน เดินสถานะ"
}, {
  key: "handover",
  th: "เอกสารส่งมอบงาน (Commissioning & Handover)",
  desc: "สมุดตรวจรับและส่งมอบระบบ — ข้อมูลโครงการ · รายการเอกสาร · ผลทดสอบ · ออกรายงาน PDF/Excel"
}, {
  key: "om",
  th: "งานบริการหลังการขาย",
  desc: "ทะเบียนประกัน · ตารางล้างแผง · ใบแจ้งซ่อม · ใบรายงานเข้าบริการ"
}, {
  key: "billing",
  th: "เอกสารงวดงาน · วางบิล",
  desc: "ตั้งงวดจากใบเสนอราคา · ออกใบแจ้งส่งมอบงาน · บันทึกวางบิล-รับมอบ-รับเงิน"
}, {
  key: "expense",
  th: "ส่งใบเบิกเงินหน้างาน",
  desc: "เบิกค่าซื้อของหน้างาน ค่าขนส่ง ค่าน้ำมัน — เห็นเฉพาะใบของตัวเอง"
}, {
  key: "expenseApprove",
  th: "อนุมัติใบเบิกเงิน",
  desc: "เห็นใบเบิกของทุกคน อนุมัติ/ไม่อนุมัติ และดูยอดรายคน · อนุมัติใบของตัวเองไม่ได้เสมอ"
}, {
  key: "expensePay",
  th: "บันทึกจ่ายเงินคืน",
  desc: "กดว่าจ่ายเงินคืนพนักงานแล้ว — แยกจากคนอนุมัติตั้งใจ เป็นการคุมเงินสดขั้นพื้นฐาน"
}, {
  key: "expenseCover",
  th: "พิมพ์ใบปะหน้าจ่ายเงิน",
  desc: "เห็นยอดค้างจ่ายรายคนและพิมพ์ใบปะหน้าไปตรวจเอกสารก่อนโอน — กดจ่ายไม่ได้ · คนที่จ่ายได้อยู่แล้วพิมพ์ได้เองโดยไม่ต้องติ๊ก"
}, {
  key: "attend",
  th: "ลงเวลาเข้า-ออกงาน",
  desc: "ปั๊มเวลาเข้า-ออกจากมือถือ พร้อมบันทึกพิกัด — เห็นเฉพาะเวลาของตัวเอง"
}, {
  key: "attendAll",
  th: "ดูเวลาทำงานของทุกคน",
  desc: "แผ่นเวลารายวันทั้งบริษัท · เวลาทำงานของคนอื่นเป็นข้อมูลส่วนบุคคล เปิดเท่าที่จำเป็น"
}, {
  key: "ot",
  th: "ขอ OT นอกเวลางาน",
  desc: "เปิดใบขอทำงานล่วงเวลา — เห็นเฉพาะใบของตัวเอง"
}, {
  key: "otApprove",
  th: "อนุมัติใบ OT",
  desc: "เห็นใบ OT ของทุกคนและตัดสิน · อนุมัติใบของตัวเองไม่ได้เสมอ"
}, {
  key: "leave",
  th: "ขอลา",
  desc: "ยื่นใบลาและดูยอดวันลาคงเหลือของตัวเอง (เว็บและแอปในไลน์)"
}, {
  key: "leaveApprove",
  th: "อนุมัติใบลา",
  desc: "เห็นใบลาของทุกคนและตัดสิน · อนุมัติใบของตัวเองไม่ได้ · คู่กับ \"ดูเวลาทำงานของทุกคน\" = กำหนดยอดวันลารายคนได้"
}, {
  key: "stock",
  th: "คลังสินค้า",
  desc: "ดูและตัดสต๊อก"
}, {
  key: "manageUsers",
  th: "จัดการผู้ใช้และสิทธิ์",
  desc: "เพิ่ม/ลบบัญชี และแก้ตารางสิทธิ์นี้"
}];
const SCOPE_MODES = [{
  key: "all",
  th: "ทุกงานในระบบ",
  desc: "เห็นงานทั้งหมดเหมือนที่เป็นอยู่"
}, {
  key: "assigned",
  th: "เฉพาะงานที่รับผิดชอบ",
  desc: "งานที่ถูกมอบหมายให้บัญชีนี้ (ต้องผูกกับพนักงานในระบบ)"
}, {
  key: "created",
  th: "เฉพาะงานที่ตัวเองเปิด",
  desc: "งานที่บัญชีนี้เป็นคนกดเพิ่ม · งานเก่าที่ไม่ได้บันทึกผู้เปิดไว้จะไม่เข้าเงื่อนไข"
}, {
  key: "stages",
  th: "เฉพาะงานในขั้นที่เลือก",
  desc: "เช่น ฝ่ายขออนุญาตเห็นเฉพาะงานที่ติดตั้งเสร็จแล้ว"
}, {
  key: "permitMine",
  th: "เฉพาะงานขออนุญาตที่รับเข้ามา",
  desc: "งานที่บัญชีนี้กดรับหรือเดินสถานะขออนุญาตไว้ · บอร์ดขออนุญาตยังเห็นคิวงานใหม่ครบเหมือนเดิม"
}];
const DEFAULT_SCOPE = {
  admin: {
    mode: "all",
    stages: []
  },
  lead: {
    mode: "all",
    stages: []
  },
  ee: {
    mode: "assigned",
    stages: []
  },
  draft: {
    mode: "all",
    stages: []
  },
  tech: {
    mode: "assigned",
    stages: []
  },
  permit: {
    mode: "permitMine",
    stages: []
  },
  sales: {
    mode: "all",
    stages: []
  },
  hr: {
    mode: "assigned",
    stages: []
  }
};
let PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS));
let ROLE_SCOPE = JSON.parse(JSON.stringify(DEFAULT_SCOPE));
const PERM_KEYS_V1 = ["viewAll", "addJob", "editJob", "delJob", "price", "leads", "dispatch", "doSurvey", "design", "permit", "stock", "manageUsers"];
function applyRoleConfig(cfg) {
  PERMS = JSON.parse(JSON.stringify(DEFAULT_PERMS));
  ROLE_SCOPE = JSON.parse(JSON.stringify(DEFAULT_SCOPE));
  if (!cfg) return;
  ROLE_KEYS.forEach(r => {
    const c = cfg[r];
    if (!c) return;
    if (c.perms) {
      const known = Array.isArray(c.known) ? c.known : PERM_KEYS_V1;
      const p = {};
      PERM_LIST.forEach(x => {
        if (known.indexOf(x.key) < 0) {
          if ((DEFAULT_PERMS[r] || {})[x.key]) p[x.key] = 1;
        } else if (c.perms[x.key]) p[x.key] = 1;
      });
      PERMS[r] = p;
    }
    if (c.scope && c.scope.mode) {
      ROLE_SCOPE[r] = {
        mode: c.scope.mode,
        stages: Array.isArray(c.scope.stages) ? c.scope.stages : []
      };
    }
  });
  PERMS.admin = Object.assign({}, PERMS.admin, {
    manageUsers: 1
  });
}
function roleConfigNow() {
  const out = {};
  ROLE_KEYS.forEach(r => {
    out[r] = {
      perms: Object.assign({}, PERMS[r]),
      scope: Object.assign({}, ROLE_SCOPE[r])
    };
  });
  return out;
}
function jobScopeOf(roles) {
  const arr = Array.isArray(roles) ? roles : roles ? [roles] : [];
  const out = {
    all: false,
    assigned: false,
    created: false,
    permitMine: false,
    stages: []
  };
  arr.forEach(r => {
    const k = ROLE_ALIAS[r] || r;
    const sc = ROLE_SCOPE[k] || DEFAULT_SCOPE[k] || {
      mode: "all"
    };
    if (sc.mode === "all") out.all = true;else if (sc.mode === "assigned") out.assigned = true;else if (sc.mode === "created") out.created = true;else if (sc.mode === "permitMine") out.permitMine = true;else if (sc.mode === "stages") (sc.stages || []).forEach(s => {
      if (out.stages.indexOf(s) === -1) out.stages.push(s);
    });
  });
  return out;
}
function jobIsMine(job, user) {
  return jobInScope(job, {
    assigned: true,
    created: true,
    permitMine: true,
    stages: []
  }, user);
}
function jobInScope(job, scope, user) {
  if (!scope || scope.all) return true;
  if (!job) return false;
  if (scope.assigned && user && user.techId && job.tech === user.techId) return true;
  if (scope.assigned && user && job.eeId && job.eeId === user.id) return true;
  if (scope.created && user && job.createdBy && job.createdBy === user.id) return true;
  if (scope.permitMine && user && job.permit && (job.permit.adminId === user.id || !job.permit.adminId && job.permit.byAdmin && job.permit.byAdmin === user.name)) return true;
  if (scope.stages.length && scope.stages.indexOf(job.stage) !== -1) return true;
  return false;
}
function useRoleConfig() {
  const [cfg, setCfg] = React.useState(null);
  const [rev, setRev] = React.useState(0);
  React.useEffect(() => {
    if (!_AFB()) {
      applyRoleConfig(null);
      return;
    }
    const ref = _aref("rolePerms");
    const h = ref.on("value", s => {
      const v = s.val();
      applyRoleConfig(v && typeof v === "object" ? v : null);
      setCfg(v || null);
      setRev(n => n + 1);
    });
    return () => ref.off("value", h);
  }, []);
  const saveRole = React.useCallback((roleKey, patch) => {
    const cur = roleConfigNow()[roleKey] || {
      perms: {},
      scope: {
        mode: "all",
        stages: []
      }
    };
    const next = Object.assign({}, cur, patch, {
      known: PERM_LIST.map(x => x.key)
    });
    if (_AFB()) _aref("rolePerms/" + roleKey).set(next);else {
      applyRoleConfig(Object.assign(roleConfigNow(), {
        [roleKey]: next
      }));
      setRev(n => n + 1);
    }
  }, []);
  const resetAll = React.useCallback(() => {
    if (_AFB()) _aref("rolePerms").remove();else {
      applyRoleConfig(null);
      setRev(n => n + 1);
    }
  }, []);
  return {
    cfg,
    rev,
    saveRole,
    resetAll,
    custom: !!cfg
  };
}
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
    active: true,
    approverId: null,
    approveLimit: 0
  };
}
function sfMatchCred(users, username, password) {
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
  return {
    ok: true,
    user: u
  };
}
const SF_LEGACY_KEY = "solarflow_auth_legacy";
const _legacyGet = () => {
  try {
    return localStorage.getItem(SF_LEGACY_KEY) === "1";
  } catch (e) {
    return false;
  }
};
const _legacySet = on => {
  try {
    on ? localStorage.setItem(SF_LEGACY_KEY, "1") : localStorage.removeItem(SF_LEGACY_KEY);
  } catch (e) {}
};
async function sfSignInToken(token, userId) {
  if (!window.FBAUTH || !token) return false;
  try {
    const cur = window.FBAUTH.currentUser;
    if (!(cur && userId && cur.uid === userId)) await window.FBAUTH.signInWithCustomToken(token);
    _legacySet(false);
    return true;
  } catch (e) {
    console.warn("[auth] signInWithCustomToken:", e && e.code, e && e.message);
    return false;
  }
}
async function sfServerLogin(username, pin) {
  let r = null,
    j = null;
  try {
    r = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        username: String(username || ""),
        pin: String(pin == null ? "" : pin)
      })
    });
    j = await r.json().catch(() => null);
  } catch (e) {
    return {
      fallback: true
    };
  }
  if (r.status === 404 || j && j.fallback) return {
    fallback: true
  };
  if (!r.ok || !j || !j.token) return {
    ok: false,
    error: j && j.error || "เข้าสู่ระบบไม่สำเร็จ"
  };
  if (!(await sfSignInToken(j.token, j.userId))) return {
    ok: false,
    error: "เชื่อมต่อระบบยืนยันตัวตนไม่สำเร็จ ลองใหม่อีกครั้ง"
  };
  return {
    ok: true,
    userId: j.userId
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
  const [fbUid, setFbUid] = React.useState(() => window.FBAUTH && window.FBAUTH.currentUser ? window.FBAUTH.currentUser.uid : null);
  const [legacy, setLegacy] = React.useState(_legacyGet);
  React.useEffect(() => {
    if (!window.FBAUTH) return;
    return window.FBAUTH.onAuthStateChanged(u => setFbUid(u ? u.uid : null));
  }, []);
  React.useEffect(() => {
    if (!legacy || fbUid || !window.FBAUTH) return;
    fetch("/api/auth/login").then(r => r.ok ? r.json() : null).then(j => {
      if (j && j.configured) {
        _legacySet(false);
        setLegacy(false);
      }
    }).catch(() => {});
  }, [legacy, fbUid]);
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
  const authOk = !window.FBAUTH || (fbUid ? fbUid === sessionId : legacy);
  const current = authOk && list.find(u => u.id === sessionId && u.active !== false) || null;
  const viewerKey = current ? current.id + "|" + userRoles(current).join(",") : "";
  React.useEffect(() => {
    if (window.pgSetViewer) window.pgSetViewer(current);
  }, [viewerKey]);
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
  const loginCred = React.useCallback(async (username, password) => {
    const s = await sfServerLogin(username, password);
    if (s.ok) {
      try {
        localStorage.setItem(SF_SESSION_KEY, s.userId);
      } catch (e) {}
      location.reload();
      return {
        ok: true
      };
    }
    if (!s.fallback) return s;
    const m = sfMatchCred(users, username, password);
    if (!m.ok) return m;
    try {
      localStorage.setItem(SF_SESSION_KEY, m.user.id);
    } catch (e) {}
    _legacySet(true);
    setLegacy(true);
    setSession(m.user.id);
    return {
      ok: true
    };
  }, [users]);
  const logout = React.useCallback(() => {
    try {
      localStorage.removeItem(SF_SESSION_KEY);
    } catch (e) {}
    _legacySet(false);
    setLegacy(false);
    if (window.FBAUTH) window.FBAUTH.signOut().catch(() => {});
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
  const completeSetup = React.useCallback(patch => {
    if (!current) return Promise.reject(new Error("no user"));
    if (_AFB()) return _aref("users/" + current.id).update(patch);
    setUsers(prev => (prev || []).map(u => u.id === current.id ? Object.assign({}, u, patch, {
      mustChangePin: undefined
    }) : u));
    return Promise.resolve();
  }, [current && current.id]);
  return {
    users: list,
    current,
    loading,
    login,
    loginCred,
    logout,
    upsertUser,
    removeUser,
    completeSetup,
    blankUser: () => blankUser()
  };
}
function useUserAvatar(userId) {
  const [avatar, setAvatar] = React.useState(null);
  React.useEffect(() => {
    if (!userId || !_AFB()) {
      setAvatar(null);
      return;
    }
    const ref = _aref("userAvatars/" + userId);
    const h = ref.on("value", s => {
      const v = s.val();
      setAvatar(v && v.img ? v.img : null);
    });
    return () => ref.off("value", h);
  }, [userId]);
  const save = React.useCallback(img => {
    if (!userId || !_AFB() || !img) return;
    _aref("userAvatars/" + userId).set({
      img,
      at: new Date().toISOString()
    });
  }, [userId]);
  const clear = React.useCallback(() => {
    if (!userId || !_AFB()) return;
    _aref("userAvatars/" + userId).remove();
  }, [userId]);
  return {
    avatar,
    save,
    clear
  };
}
function signFromFile(file) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onerror = reject;
    rd.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, 1400 / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(img.width * k));
        cv.height = Math.max(1, Math.round(img.height * k));
        const g = cv.getContext("2d");
        g.drawImage(img, 0, 0, cv.width, cv.height);
        const id = g.getImageData(0, 0, cv.width, cv.height),
          d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3] / 255;
          if (!a) continue;
          const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
          const op = l >= 0.78 ? 0 : l <= 0.45 ? 1 : (0.78 - l) / 0.33;
          d[i + 3] = Math.round(255 * a * op);
        }
        g.putImageData(id, 0, 0);
        const out = window.drTrimSign(cv);
        out ? resolve(out) : reject(new Error("empty"));
      };
      img.src = e.target.result;
    };
    rd.readAsDataURL(file);
  });
}
function MyProfileModal({
  user,
  onSave,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const av = useUserAvatar((user || {}).id);
  const sig = window.useDrMySign((user || {}).id);
  const [f, setF] = React.useState(() => Object.assign({}, user));
  const [pad, setPad] = React.useState(false);
  const [card, setCard] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const file = React.useRef(null);
  const sigFile = React.useRef(null);
  const [sigBusy, setSigBusy] = React.useState(false);
  const [sigErr, setSigErr] = React.useState("");
  const pickSign = async e => {
    const fl = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fl) return;
    setSigBusy(true);
    setSigErr("");
    try {
      sig.save(await signFromFile(fl));
    } catch (err) {
      setSigErr("อ่านรูปไม่ได้ หรือรูปไม่มีเส้นลายเซ็น — ลองรูปที่เซ็นด้วยปากกาเข้มบนกระดาษขาว");
    }
    setSigBusy(false);
  };
  const set = (k, v) => {
    setF(p => Object.assign({}, p, {
      [k]: v
    }));
    setSaved(false);
  };
  const rs = userRoles(user);
  const head = ROLE_INFO[rs[0]] || ROLE_INFO.tech;
  const pick = async e => {
    const fl = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fl) return;
    setBusy(true);
    try {
      av.save(await window.resizeImageFile(fl, 320, 0.78));
    } catch (err) {}
    setBusy(false);
  };
  const save = () => {
    onSave(Object.assign({}, f, {
      name: String(f.name || "").trim() || user.name,
      phone: String(f.phone || "").trim(),
      email: String(f.email || "").trim(),
      line: String(f.line || "").trim()
    }));
    setSaved(true);
  };
  return React.createElement(React.Fragment, null, React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
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
      width: isMobile ? "100%" : "min(480px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "var(--shadow-modal)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--divider)",
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
  }, "\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "none",
      boxShadow: "var(--shadow-sm)",
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
      gap: 15,
      overflowY: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 15
    }
  }, React.createElement("span", {
    style: {
      width: 74,
      height: 74,
      borderRadius: "var(--r-pill)",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      background: head.color,
      color: "#fff",
      fontWeight: 700,
      fontSize: 27
    }
  }, av.avatar ? React.createElement("img", {
    src: av.avatar,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : (user.name || "?").slice(0, 1)), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => file.current && file.current.click(),
    disabled: busy,
    style: {
      padding: "9px 14px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, busy ? "กำลังย่อรูป…" : av.avatar ? "เปลี่ยนรูป" : "ใส่รูป"), av.avatar && React.createElement("button", {
    onClick: () => av.clear(),
    style: {
      padding: "9px 13px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A\u0E23\u0E39\u0E1B")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 7
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E08\u0E32\u0E01\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E48\u0E2D\u0E23\u0E39\u0E1B\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), React.createElement("input", {
    ref: file,
    type: "file",
    accept: "image/*",
    onChange: pick,
    style: {
      display: "none"
    }
  }))), React.createElement(AField, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25 (\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A)"
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.name || "",
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E15\u0E31\u0E49\u0E07\u0E43\u0E08"
  })), React.createElement(AField, {
    label: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23"
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.phone || "",
    inputMode: "tel",
    onChange: e => set("phone", e.target.value),
    placeholder: "08x-xxx-xxxx"
  })), React.createElement(AField, {
    label: "\u0E2D\u0E35\u0E40\u0E21\u0E25"
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.email || "",
    inputMode: "email",
    autoCapitalize: "none",
    spellCheck: false,
    onChange: e => set("email", e.target.value),
    placeholder: "name@example.com"
  })), React.createElement(AField, {
    label: "\u0E44\u0E25\u0E19\u0E4C\u0E44\u0E2D\u0E14\u0E35"
  }, React.createElement("input", {
    style: A_INPUT,
    value: f.line || "",
    autoCapitalize: "none",
    spellCheck: false,
    onChange: e => set("line", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 @somchai"
  })), React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: user.lineUserId ? "var(--tint-ok-bg)" : "var(--surface2)",
      border: "none",
      boxShadow: user.lineUserId ? "inset 0 0 0 1px var(--tint-ok-bd)" : "var(--shadow-sm)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 160,
      fontSize: 12.5,
      fontWeight: 600,
      color: user.lineUserId ? "var(--tint-ok-tx)" : "var(--text-3)"
    }
  }, user.lineUserId ? "เชื่อมกับแอป LINE แล้ว — แจ้งเตือนจะเด้งเข้าไลน์" : "ยังไม่ได้เชื่อมกับแอป LINE"), user.lineUserId && React.createElement("button", {
    onClick: async () => {
      if (!(await window.askConfirm({
        title: "ปลดการเชื่อม LINE",
        body: "แจ้งเตือนจะไม่เด้งเข้าไลน์อีก และต้องกรอกชื่อผู้ใช้กับรหัสผ่านใหม่เมื่อเปิดแอปในไลน์ครั้งต่อไป",
        ok: "ปลดการเชื่อม",
        danger: true,
        icon: "link"
      }))) return;
      if (_AFB()) {
        _aref("lineLinks/" + user.lineUserId).remove();
        _aref("users/" + user.id + "/lineUserId").remove();
      }
    },
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E25\u0E14\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21")), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(RoleBadges, {
    roles: rs,
    short: true
  }), user.username && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, "@", user.username)), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 6
    }
  }, "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E01\u0E31\u0E1A\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E2B\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22\u0E07\u0E32\u0E19")), window.VcCardModal && React.createElement("button", {
    onClick: () => setCard(true),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "12px 14px",
      borderRadius: "var(--r-chip)",
      textAlign: "left",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--r-chip)",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--primary-soft)"
    }
  }, React.createElement(Icon, {
    name: "user",
    size: 16,
    color: "var(--primary-dark)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E19\u0E32\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E2D\u0E34\u0E40\u0E25\u0E47\u0E01\u0E17\u0E23\u0E2D\u0E19\u0E34\u0E01\u0E2A\u0E4C"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E17\u0E32\u0E07\u0E44\u0E25\u0E19\u0E4C \xB7 \u0E2A\u0E41\u0E01\u0E19\u0E41\u0E25\u0E49\u0E27\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22")), React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    color: "var(--text-3)"
  })), React.createElement("div", {
    style: {
      padding: "13px 14px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface)",
      border: "none",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E43\u0E0A\u0E49\u0E40\u0E0B\u0E47\u0E19\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19 \xB7 \u0E40\u0E0B\u0E47\u0E19\u0E1A\u0E19\u0E08\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E19\u0E1A\u0E23\u0E39\u0E1B\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E01\u0E47\u0E44\u0E14\u0E49")), React.createElement("div", {
    style: {
      height: 92,
      marginTop: 10,
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden"
    }
  }, sig.sign && sig.sign.img ? React.createElement("img", {
    src: sig.sign.img,
    alt: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19",
    style: {
      maxWidth: "88%",
      maxHeight: 80,
      objectFit: "contain"
    }
  }) : React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      flexWrap: "wrap"
    }
  }, sig.sign && sig.sign.img && React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 100,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D ", window.drDateTH(window.drSignDay(sig.sign))), React.createElement("button", {
    onClick: () => setPad(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "pen",
    size: 14,
    color: "#fff"
  }), " ", sig.sign && sig.sign.img ? "เซ็นใหม่" : "เซ็นชื่อ"), React.createElement("button", {
    onClick: () => sigFile.current && sigFile.current.click(),
    disabled: sigBusy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "var(--primary-dark)"
  }), " ", sigBusy ? "กำลังเตรียมรูป…" : "แนบไฟล์ลายเซ็น"), React.createElement("input", {
    ref: sigFile,
    type: "file",
    accept: "image/*",
    onChange: pickSign,
    style: {
      display: "none"
    }
  }), sig.sign && sig.sign.img && React.createElement("button", {
    onClick: () => sig.clear(),
    style: {
      padding: "9px 13px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A")), sigErr ? React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--danger, #DC2626)",
      marginTop: 8
    }
  }, sigErr) : React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 8
    }
  }, "\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22/\u0E2A\u0E41\u0E01\u0E19\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E1A\u0E19\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29\u0E02\u0E32\u0E27 \u0E23\u0E30\u0E1A\u0E1A\u0E25\u0E1A\u0E1E\u0E37\u0E49\u0E19\u0E02\u0E32\u0E27\u0E41\u0E25\u0E30\u0E15\u0E31\u0E14\u0E02\u0E2D\u0E1A\u0E43\u0E2B\u0E49"))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--divider)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 11,
      color: saved ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, saved ? "บันทึกแล้ว" : "รูปและลายเซ็นบันทึกทันทีที่เลือก"), React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "11px 18px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"), React.createElement("button", {
    onClick: save,
    style: {
      padding: "11px 22px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")))), card && window.VcCardModal && React.createElement(window.VcCardModal, {
    user: Object.assign({}, user, f),
    onClose: () => setCard(false)
  }), pad && window.DrSignPad && React.createElement(window.DrSignPad, {
    title: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
    hint: "\u0E40\u0E0B\u0E47\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E40\u0E0B\u0E47\u0E19\u0E43\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E08\u0E33\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49",
    onClose: () => setPad(false),
    onSave: img => {
      sig.save(img);
      setPad(false);
    }
  }));
}
function useNotifStore() {
  const [notifs, setNotifs] = React.useState(_AFB() ? null : () => _alsGet(SF_NOTIF_KEY, []));
  React.useEffect(() => {
    if (!_AFB()) return;
    const ref = _aref("notifications").limitToLast(200);
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
      if (window.lnPush) window.lnPush(id);
    } else setNotifs(prev => [rec, ...(prev || [])]);
  }, []);
  const markRead = React.useCallback(id => {
    if (_AFB()) {
      _aref("notifications/" + id + "/read").set(true);
    } else setNotifs(prev => (prev || []).map(n => n.id === id ? Object.assign({}, n, {
      read: true
    }) : n));
  }, []);
  const markAllRead = React.useCallback(who => {
    const hit = n => n && (n.toTechId === who || n.toUserId === who);
    if (_AFB()) {
      (notifs || []).filter(n => hit(n) && !n.read).forEach(n => _aref("notifications/" + n.id + "/read").set(true));
    } else setNotifs(prev => (prev || []).map(n => hit(n) ? Object.assign({}, n, {
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
  borderRadius: "var(--r-chip)",
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
      color: "var(--text-3)"
    }
  }, label, required && React.createElement("span", {
    style: {
      color: "var(--tint-red-tx2)"
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
      borderRadius: "var(--r-pill)",
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
const SF_FIRST_PIN = "1234";
function sfNeedsSetup(u) {
  return !!u && (u.mustChangePin === true || String(u.pin) === SF_FIRST_PIN);
}
function sfPinProblem(pin, oldPin) {
  const p = String(pin || "");
  if (!/^\d{6,}$/.test(p)) return "รหัสผ่านต้องเป็นตัวเลข 6 หลักขึ้นไป";
  if (/^(\d)\1+$/.test(p)) return "รหัสผ่านเป็นเลขเดียวกันทั้งหมด เดาง่ายเกินไป";
  const step = +p[1] - +p[0];
  if ((step === 1 || step === -1) && p.split("").every((c, i) => i === 0 || +c - +p[i - 1] === step)) return "รหัสผ่านเป็นเลขเรียงกัน เดาง่ายเกินไป";
  if (oldPin != null && p === String(oldPin)) return "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม";
  return "";
}
function LgScene({
  children
}) {
  return React.createElement("div", {
    className: "lg-scene"
  }, React.createElement("style", null, LG_CSS), React.createElement(LgSky, null), React.createElement("div", {
    className: "lg-wrap"
  }, children));
}
const LG_PHOTOS = ["dashboard/assets/login-farm.jpg", "dashboard/assets/login-village.jpg"];
function LgSky() {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx(i => (i + 1) % LG_PHOTOS.length), 9000);
    return () => clearInterval(t);
  }, []);
  return React.createElement("div", {
    className: "lg-sky",
    "aria-hidden": "true"
  }, LG_PHOTOS.map((src, i) => React.createElement("div", {
    key: src,
    className: "lg-photo" + (i === idx ? " on" : ""),
    style: {
      backgroundImage: "url(" + src + ")"
    }
  })), React.createElement("div", {
    className: "lg-tint"
  }), React.createElement("div", {
    className: "lg-grain"
  }));
}
function LgPill({
  icon,
  glyph,
  label,
  children,
  extra
}) {
  return React.createElement("label", {
    className: "lg-pill" + (label ? " lg-pill-lb" : "")
  }, React.createElement("span", {
    className: "lg-ic"
  }, glyph ? React.createElement("b", null, glyph) : React.createElement(Icon, {
    name: icon,
    size: 15,
    color: "var(--lg-tx)"
  })), label ? React.createElement("span", {
    className: "lg-pill-col"
  }, React.createElement("span", {
    className: "lg-pill-lab"
  }, label), children) : children, extra);
}
function LgGlassButton({
  onClick,
  busy,
  label,
  busyLabel,
  wide
}) {
  const [bursts, setBursts] = React.useState([]);
  const fire = () => {
    if (busy) return;
    const id = Date.now() + Math.random();
    const parts = Array.from({
      length: 16
    }).map((_, i) => {
      const a = i / 16 * Math.PI * 2 + Math.random() * 0.4,
        r = 26 + Math.random() * 34;
      return {
        dx: Math.cos(a) * r,
        dy: Math.sin(a) * r,
        s: 3 + Math.random() * 4,
        t: 0.5 + Math.random() * 0.35
      };
    });
    setBursts(b => b.concat({
      id,
      parts
    }));
    setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 900);
    onClick && onClick();
  };
  return React.createElement("button", {
    type: "button",
    className: "lg-gbtn" + (wide ? " lg-gbtn-wide" : "") + (busy ? " is-busy" : ""),
    onClick: fire,
    disabled: busy
  }, React.createElement("span", {
    className: "lg-gbtn-tx"
  }, busy ? busyLabel : label), React.createElement("span", {
    className: "lg-orb"
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "#fff"
  }), bursts.map(b => React.createElement("span", {
    key: b.id,
    className: "lg-burst"
  }, b.parts.map((p, i) => React.createElement("i", {
    key: i,
    style: {
      "--dx": p.dx + "px",
      "--dy": p.dy + "px",
      width: p.s,
      height: p.s,
      animationDuration: p.t + "s"
    }
  }))))));
}
function FirstLoginScreen({
  user,
  onSave,
  onLogout
}) {
  const [f, setF] = React.useState(() => ({
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || "",
    line: user.line || "",
    pin: "",
    pin2: ""
  }));
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const set = (k, v) => {
    setF(o => Object.assign({}, o, {
      [k]: v
    }));
    setErr("");
  };
  const submit = async () => {
    if (busy) return;
    const name = f.name.trim(),
      phone = f.phone.trim(),
      email = f.email.trim(),
      line = f.line.trim();
    if (!name) return setErr("กรุณากรอกชื่อ-สกุล");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 10) return setErr("เบอร์โทรไม่ถูกต้อง (9–10 หลัก)");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("อีเมลไม่ถูกต้อง");
    if (!line) return setErr("กรุณากรอก LINE ID");
    const bad = sfPinProblem(f.pin, user.pin);
    if (bad) return setErr(bad);
    if (f.pin !== f.pin2) return setErr("ยืนยันรหัสผ่านไม่ตรงกัน");
    setBusy(true);
    try {
      await onSave({
        name,
        phone,
        email,
        line,
        pin: f.pin,
        mustChangePin: null,
        setupAt: new Date().toISOString()
      });
    } catch (e) {
      setBusy(false);
      setErr("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  };
  return React.createElement(LgScene, null, React.createElement("div", {
    className: "lg-glass lg-setup"
  }, React.createElement("div", {
    className: "lg-top"
  }, React.createElement(window.BrandWord, {
    size: 17,
    color: "var(--lg-tx)"
  }), React.createElement("span", {
    className: "lg-mini"
  }, "\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01")), React.createElement("div", null, React.createElement("div", {
    className: "lg-h"
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E31\u0E0D\u0E0A\u0E35"), React.createElement("div", {
    className: "lg-sub"
  }, "\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A \u0E41\u0E25\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E32\u0E01\u0E23\u0E2B\u0E31\u0E2A\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A \u0E01\u0E48\u0E2D\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")), React.createElement("div", {
    className: "lg-sec"
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49"), React.createElement("div", {
    className: "lg-two"
  }, React.createElement("div", {
    className: "lg-span2"
  }, React.createElement(LgPill, {
    icon: "user",
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25 *"
  }, React.createElement("input", {
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E15\u0E31\u0E49\u0E07\u0E43\u0E08",
    autoComplete: "name"
  }))), React.createElement(LgPill, {
    icon: "phone",
    label: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 *"
  }, React.createElement("input", {
    value: f.phone,
    inputMode: "tel",
    autoComplete: "tel",
    onChange: e => set("phone", e.target.value),
    placeholder: "08x-xxx-xxxx"
  })), React.createElement(LgPill, {
    glyph: "@",
    label: "\u0E2D\u0E35\u0E40\u0E21\u0E25 *"
  }, React.createElement("input", {
    value: f.email,
    inputMode: "email",
    autoCapitalize: "none",
    spellCheck: false,
    autoComplete: "email",
    onChange: e => set("email", e.target.value),
    placeholder: "name@example.com"
  })), React.createElement("div", {
    className: "lg-span2"
  }, React.createElement(LgPill, {
    icon: "message",
    label: "LINE ID *"
  }, React.createElement("input", {
    value: f.line,
    autoCapitalize: "none",
    spellCheck: false,
    onChange: e => set("line", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 somchai"
  })))), React.createElement("div", {
    className: "lg-sec"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"), React.createElement("div", {
    className: "lg-two"
  }, React.createElement(LgPill, {
    icon: "lock",
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 *"
  }, React.createElement("input", {
    value: f.pin,
    type: "password",
    inputMode: "numeric",
    autoComplete: "new-password",
    onChange: e => set("pin", e.target.value.replace(/\D/g, "")),
    placeholder: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 6 \u0E2B\u0E25\u0E31\u0E01\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B"
  })), React.createElement(LgPill, {
    icon: "lock",
    label: "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19 *"
  }, React.createElement("input", {
    value: f.pin2,
    type: "password",
    inputMode: "numeric",
    autoComplete: "new-password",
    onChange: e => set("pin2", e.target.value.replace(/\D/g, "")),
    onKeyDown: e => {
      if (e.key === "Enter") submit();
    },
    placeholder: "\u0E01\u0E23\u0E2D\u0E01\u0E0B\u0E49\u0E33\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07"
  }))), React.createElement("div", {
    className: "lg-note"
  }, "\u0E2B\u0E49\u0E32\u0E21\u0E40\u0E25\u0E02\u0E40\u0E23\u0E35\u0E22\u0E07 (123456) \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E02\u0E0B\u0E49\u0E33 (111111) \xB7 \u0E43\u0E0A\u0E49\u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E04\u0E23\u0E31\u0E49\u0E07\u0E15\u0E48\u0E2D\u0E44\u0E1B"), err && React.createElement("div", {
    className: "lg-err"
  }, "\u26A0 ", err), React.createElement("div", {
    className: "lg-foot"
  }, onLogout ? React.createElement("button", {
    type: "button",
    className: "lg-link",
    onClick: onLogout,
    disabled: busy
  }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A") : React.createElement("span", null), React.createElement(LgGlassButton, {
    onClick: submit,
    busy: busy,
    label: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E30\u0E40\u0E23\u0E34\u0E48\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
    busyLabel: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u2026"
  }))));
}
function LoginScreen({
  authStore
}) {
  const [username, setUsername] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [err, setErr] = React.useState("");
  const pwRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = await authStore.loginCred(username, pw);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      setPw("");
    }
  };
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const wday = now.toLocaleDateString("th-TH", {
    weekday: "long"
  }).replace(/^วัน/, "");
  const dmon = now.getDate() + " " + now.toLocaleDateString("th-TH", {
    month: "short"
  });
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const h = now.getHours();
  const sunNote = h >= 5 && h < 10 ? "แดดเช้าเริ่มเข้าแผง" : h < 15 && h >= 10 ? "ช่วงแดดแรงสุดของวัน" : h < 18 && h >= 15 ? "แดดบ่ายเริ่มอ่อนลง" : "แผงพัก พรุ่งนี้แดดมาใหม่";
  return React.createElement(LgScene, null, React.createElement("div", {
    className: "lg-grid"
  }, React.createElement("div", {
    className: "lg-glass lg-login"
  }, React.createElement("div", {
    className: "lg-top"
  }, React.createElement(window.BrandWord, {
    size: 17,
    color: "var(--lg-tx)"
  }), React.createElement("span", {
    className: "lg-mini"
  }, window.BRANDING.taglineTH)), React.createElement("div", {
    className: "lg-h"
  }, "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A"), React.createElement(LgPill, {
    icon: "user"
  }, React.createElement("input", {
    autoFocus: true,
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
    value: username,
    autoComplete: "username",
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 (ID)",
    "aria-label": "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49",
    onChange: e => {
      setUsername(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter" && pwRef.current) pwRef.current.focus();
    }
  })), React.createElement(LgPill, {
    icon: "lock",
    extra: React.createElement("button", {
      type: "button",
      className: "lg-chip",
      onClick: () => setShow(s => !s),
      tabIndex: -1
    }, React.createElement(Icon, {
      name: show ? "eyeOff" : "eye",
      size: 14,
      color: "var(--lg-tx2)"
    }), show ? "ซ่อน" : "แสดง")
  }, React.createElement("input", {
    ref: pwRef,
    type: show ? "text" : "password",
    value: pw,
    autoComplete: "current-password",
    placeholder: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    "aria-label": "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    onChange: e => {
      setPw(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter") submit();
    }
  })), err && React.createElement("div", {
    className: "lg-err"
  }, "\u26A0 ", err), React.createElement("div", {
    className: "lg-foot"
  }, React.createElement("div", {
    className: "lg-note"
  }, "\u0E43\u0E0A\u0E49\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E23\u0E2B\u0E31\u0E2A\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19", React.createElement("br", null), "\u0E25\u0E37\u0E21\u0E23\u0E2B\u0E31\u0E2A \u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E31\u0E49\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E2B\u0E21\u0E48"), React.createElement(LgGlassButton, {
    onClick: submit,
    busy: busy,
    label: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A",
    busyLabel: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u2026"
  }))), React.createElement("div", {
    className: "lg-dark"
  }, React.createElement("div", {
    className: "lg-dark-h"
  }, "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E2A\u0E30\u0E2D\u0E32\u0E14", React.createElement("br", null), React.createElement("span", null, "\u0E08\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32")), React.createElement("div", {
    className: "lg-dark-row"
  }, React.createElement("span", null, window.BRANDING.tagline), React.createElement(window.BrandMark, {
    size: 34
  }))), React.createElement("div", {
    className: "lg-glass lg-day"
  }, React.createElement("div", {
    className: "lg-day-orb"
  }), React.createElement("div", {
    className: "lg-strip"
  }, React.createElement("div", {
    className: "lg-wd"
  }, wday), React.createElement("div", {
    className: "lg-dm"
  }, dmon), React.createElement("div", {
    className: "lg-time"
  }, hhmm, " \u0E19.", React.createElement("br", null), sunNote), React.createElement("div", {
    className: "lg-strip-b"
  }, React.createElement(Icon, {
    name: "sun",
    size: 22,
    color: "var(--lg-tx)"
  }), React.createElement("span", null, "flash+solar"))), React.createElement("div", {
    className: "lg-day-side"
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21", React.createElement("br", null), "\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C"))));
}
const LG_GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const LG_CSS = `
.lg-scene{--lg-sky0:#B9C9D2;--lg-sky1:#EBD9C0;
  --lg-glass-a:rgba(255,255,255,.42);--lg-glass-b:rgba(255,255,255,.16);--lg-edge:rgba(255,255,255,.85);--lg-edge-lo:rgba(255,255,255,.12);
  --lg-pill:rgba(255,255,255,.42);--lg-pill-bd:rgba(255,255,255,.7);--lg-strip:rgba(255,255,255,.34);
  --lg-tx:#1B2220;--lg-tx2:#4F5653;--lg-tx3:#7D827F;--lg-glow:rgba(255,170,80,.55);
  --lg-smoke:rgba(18,22,24,.72);--lg-orb1:#FFF6DA;--lg-orb2:#FFC46B;--lg-orb3:#FF8A2A;--lg-orb4:#B9420C;
  --lg-tint:linear-gradient(180deg,rgba(255,236,210,.18) 0%,rgba(255,236,210,0) 45%,rgba(20,32,20,.18) 100%);
  position:relative;min-height:100dvh;overflow:hidden;color:var(--lg-tx);
  background:linear-gradient(180deg,var(--lg-sky0),var(--lg-sky1))}
[data-theme="aurora"] .lg-scene{--lg-sky0:#0D111B;--lg-sky1:#2A2230;
  --lg-glass-a:rgba(30,34,46,.55);--lg-glass-b:rgba(20,22,32,.30);--lg-edge:rgba(255,255,255,.28);--lg-edge-lo:rgba(255,255,255,.04);
  --lg-pill:rgba(255,255,255,.07);--lg-pill-bd:rgba(255,255,255,.14);--lg-strip:rgba(255,255,255,.05);
  --lg-tx:#F1F3F2;--lg-tx2:#B8BDBA;--lg-tx3:#878D8A;--lg-glow:rgba(255,150,80,.5);--lg-smoke:rgba(6,8,12,.7);
  --lg-tint:linear-gradient(180deg,rgba(10,14,30,.72) 0%,rgba(40,24,40,.55) 55%,rgba(8,10,16,.78) 100%)}
.lg-sky{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.lg-photo{position:absolute;inset:-3%;background-size:cover;background-position:center 40%;opacity:0;
  transition:opacity 2.2s ease;animation:lgKen 26s ease-in-out infinite alternate}
.lg-photo.on{opacity:1}
.lg-photo:nth-child(2){animation-delay:-13s;background-position:center 55%}
@keyframes lgKen{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.1) translate(-1.5%,-1%)}}
.lg-tint{position:absolute;inset:0;background:var(--lg-tint)}
[data-theme="aurora"] .lg-photo{filter:saturate(.75)}
.lg-grain{position:absolute;inset:0;opacity:.08;mix-blend-mode:overlay;background-image:${LG_GRAIN}}

.lg-wrap{position:relative;z-index:1;min-height:100dvh;display:grid;place-items:center;
  padding:calc(20px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px))}
.lg-grid{width:min(880px,100%);display:grid;grid-template-columns:1fr 1fr;gap:16px;grid-template-areas:"login day" "dark day"}

/* กระจก: พื้นไล่ใส · เบลอฉากข้างหลัง · ขอบสะท้อนแสงไล่สี (::before) · แสงเงาเงาวาวมุมซ้ายบน (::after) */
.lg-glass{position:relative;isolation:isolate;border-radius:26px;
  background:linear-gradient(140deg,var(--lg-glass-a),var(--lg-glass-b));
  -webkit-backdrop-filter:blur(26px) saturate(1.7) brightness(1.04);backdrop-filter:blur(26px) saturate(1.7) brightness(1.04);
  box-shadow:0 30px 80px rgba(50,35,20,.20),0 2px 6px rgba(50,35,20,.06),inset 0 1px 0 var(--lg-edge)}
[data-theme="aurora"] .lg-glass{box-shadow:0 30px 80px rgba(0,0,0,.5),inset 0 1px 0 var(--lg-edge)}
.lg-glass::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:-1;
  background:linear-gradient(135deg,var(--lg-edge),var(--lg-edge-lo) 38%,var(--lg-edge-lo) 62%,var(--lg-edge));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.lg-glass::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:-1;
  background:radial-gradient(120% 70% at 0% 0%,rgba(255,255,255,.32),transparent 55%)}
[data-theme="aurora"] .lg-glass::after{background:radial-gradient(120% 70% at 0% 0%,rgba(255,255,255,.07),transparent 55%)}

.lg-login{grid-area:login;padding:22px 22px 20px;display:flex;flex-direction:column;gap:12px}
.lg-setup{width:min(560px,100%);padding:24px 24px 22px;display:flex;flex-direction:column;gap:12px}
.lg-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.lg-mini{font-size:11.5px;color:var(--lg-tx2);font-weight:600}
.lg-h{font-family:var(--brand-font),var(--sans);font-size:30px;font-weight:500;letter-spacing:-.01em;margin:14px 0 6px}
.lg-setup .lg-h{margin:10px 0 4px}
.lg-sub{font-size:13px;line-height:1.6;color:var(--lg-tx2)}
.lg-sec{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--lg-tx3);margin-top:6px}
.lg-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lg-span2{grid-column:1 / -1}

.lg-pill{display:flex;align-items:center;gap:10px;background:var(--lg-pill);border-radius:999px;padding:5px 6px 5px 5px;
  min-height:46px;box-shadow:inset 0 0 0 1px var(--lg-pill-bd),inset 0 1px 2px rgba(0,0,0,.04);transition:box-shadow .15s,background .15s;cursor:text}
.lg-pill:focus-within{background:var(--lg-glass-a);box-shadow:inset 0 0 0 1.5px var(--primary)}
.lg-pill-lb{min-height:52px}
.lg-ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--lg-pill);
  box-shadow:inset 0 0 0 1px var(--lg-pill-bd),0 1px 2px rgba(0,0,0,.06)}
.lg-ic b{font-family:var(--brand-font);font-size:15px;font-weight:600;color:var(--lg-tx)}
.lg-pill-col{flex:1;min-width:0;display:flex;flex-direction:column}
.lg-pill-lab{font-size:10px;font-weight:700;color:var(--lg-tx3);padding:0 4px;line-height:1.2}
.lg-scene .lg-pill input{flex:1;width:100%;background:transparent;box-shadow:none;border:none;outline:none;padding:8px 4px;
  font-size:15px;color:var(--lg-tx);font-family:inherit}
.lg-scene .lg-pill-col input{padding:2px 4px 3px}
.lg-scene .lg-pill input::placeholder{color:var(--lg-tx3)}
.lg-chip{display:inline-flex;align-items:center;gap:5px;border:none;cursor:pointer;font-family:inherit;flex:none;
  font-size:11.5px;font-weight:700;color:var(--lg-tx2);background:var(--lg-glass-a);border-radius:999px;padding:8px 12px;
  box-shadow:inset 0 0 0 1px var(--lg-pill-bd)}
.lg-err{font-size:12.5px;font-weight:600;color:var(--tint-red-tx2);background:var(--tint-red-bg);border-radius:12px;padding:8px 12px}
.lg-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}
.lg-note{font-size:10.5px;line-height:1.55;color:var(--lg-tx2)}
.lg-link{background:none;border:none;cursor:pointer;font-family:inherit;font-size:12.5px;color:var(--lg-tx2);padding:6px 2px}

/* ปุ่มกระจก + วงกลมเขียวสีหลักของธีม (เรียบ ไม่มีเงา/แสงเรือง — ผู้ใช้เลือกแล้ว) */
.lg-gbtn{position:relative;display:inline-flex;align-items:center;gap:12px;flex:none;cursor:pointer;font-family:inherit;
  border:none;border-radius:999px;padding:5px 5px 5px 20px;min-height:48px;color:var(--lg-tx);
  background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,.2));
  -webkit-backdrop-filter:blur(14px) saturate(1.6);backdrop-filter:blur(14px) saturate(1.6);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.95),inset 0 -10px 18px rgba(255,255,255,.18),inset 0 0 0 1px rgba(255,255,255,.6),
    0 12px 30px rgba(60,40,20,.20),0 0 0 0 var(--lg-glow);
  transition:transform .18s cubic-bezier(.3,.9,.3,1),box-shadow .25s}
[data-theme="aurora"] .lg-gbtn{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.05));
  box-shadow:inset 0 1px 1px rgba(255,255,255,.35),inset 0 0 0 1px rgba(255,255,255,.16),0 12px 30px rgba(0,0,0,.45)}
.lg-gbtn:hover:not(:disabled){transform:translateY(-1px);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.95),inset 0 -10px 18px rgba(255,255,255,.18),inset 0 0 0 1px rgba(255,255,255,.6),
    0 14px 34px rgba(60,40,20,.22)}
.lg-gbtn:active:not(:disabled){transform:scale(.97)}
.lg-gbtn:disabled{cursor:default}
.lg-gbtn-tx{font-size:13.5px;font-weight:700;letter-spacing:.01em;white-space:nowrap}
.lg-orb{position:relative;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:none;
  background:var(--primary);transition:background .15s}
.lg-gbtn:hover:not(:disabled) .lg-orb{background:var(--primary-dark)}
.lg-gbtn.is-busy .lg-orb{animation:lgPulse 1s ease-in-out infinite}
@keyframes lgPulse{50%{opacity:.5}}
.lg-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:2}
.lg-burst i{position:absolute;left:0;top:0;border-radius:50%;background:var(--primary);animation:lgBurst .7s cubic-bezier(.15,.7,.3,1) forwards}
@keyframes lgBurst{from{transform:translate(-50%,-50%) scale(1);opacity:1}
  to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.2);opacity:0}}

.lg-dark{grid-area:dark;position:relative;color:#fff;border-radius:26px;padding:22px;min-height:150px;
  display:flex;flex-direction:column;justify-content:space-between;gap:18px;
  background:linear-gradient(140deg,var(--lg-smoke),rgba(18,22,24,.5));
  -webkit-backdrop-filter:blur(20px) saturate(1.3);backdrop-filter:blur(20px) saturate(1.3);
  box-shadow:0 30px 70px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.18),inset 0 0 0 1px rgba(255,255,255,.06)}
.lg-dark-h{font-size:26px;font-weight:500;line-height:1.25}
.lg-dark-h span{color:rgba(255,255,255,.55);font-size:18px}
.lg-dark-row{display:flex;justify-content:space-between;align-items:flex-end;font-family:var(--brand-font);
  letter-spacing:.28em;font-size:11px;color:rgba(255,255,255,.72)}

.lg-day{grid-area:day;overflow:hidden;min-height:440px}
.lg-day-orb{position:absolute;width:62%;aspect-ratio:1;border-radius:50%;right:-14%;top:30%;z-index:-1;
  background:radial-gradient(circle at 35% 35%,var(--lg-orb1),var(--lg-orb2) 30%,var(--lg-orb3) 62%,var(--lg-orb4));
  box-shadow:0 0 80px 20px var(--lg-glow)}
.lg-strip{position:absolute;left:12px;top:12px;bottom:12px;width:56%;border-radius:20px;padding:22px 20px;
  background:var(--lg-strip);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);
  box-shadow:inset 0 0 0 1px var(--lg-pill-bd),inset 0 1px 0 var(--lg-edge);display:flex;flex-direction:column}
.lg-wd{font-size:44px;font-weight:500;line-height:1.05;letter-spacing:-.01em}
.lg-dm{font-size:40px;font-weight:400;line-height:1.1;color:var(--lg-tx3)}
.lg-time{margin-top:auto;font-size:12.5px;line-height:1.6;color:var(--lg-tx2);font-variant-numeric:tabular-nums}
.lg-strip-b{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:6px;
  font-family:var(--brand-font);font-size:12px;color:var(--lg-tx2)}
.lg-day-side{position:absolute;right:20px;top:22px;text-align:right;font-size:12px;line-height:1.55;color:var(--lg-tx2);font-weight:600}

@media (prefers-reduced-motion:reduce){.lg-photo,.lg-gbtn.is-busy .lg-orb{animation:none}}
@media (max-width:720px){
  .lg-grid{grid-template-columns:1fr;grid-template-areas:"login" "dark";max-width:440px}
  .lg-day{display:none}
  .lg-two{grid-template-columns:1fr}
  .lg-dark{min-height:0}
  .lg-dark-h{font-size:21px}
  .lg-dark-h span{font-size:15px}
}
`;
const NOTIF_KINDS = {
  reject: {
    icon: "alert",
    color: "#EF4444",
    th: "ถูกตีกลับ"
  },
  permit: {
    icon: "file",
    color: "#14B8A6",
    th: "ขออนุญาต"
  },
  assign: {
    icon: "wrench",
    color: "#F59E0B",
    th: "มอบหมายงาน"
  },
  om: {
    icon: "wrench",
    color: "#7C5CFC",
    th: "งานบริการหลังการขาย"
  },
  daily: {
    icon: "pen",
    color: "#F59E0B",
    th: "รายงานประจำวัน"
  },
  expense: {
    icon: "wallet",
    color: "#0EA5E9",
    th: "ใบเบิกเงิน"
  },
  leave: {
    icon: "calendar",
    color: "#0EA5E9",
    th: "การลา"
  },
  info: {
    icon: "bell",
    color: "#1B9B75",
    th: "แจ้งเตือน"
  }
};
function notifKindKey(n) {
  if (n && n.event && NOTIF_KINDS[n.event]) return n.event;
  if (n && n.type === "daily") return "daily";
  if (n && n.type === "om") return "om";
  if (n && n.type === "expense") return "expense";
  if (n && n.type === "assign") return "assign";
  if (n && n.type === "permit") return /ตีกลับ|แก้ไข/.test(n.title || "") ? "reject" : "permit";
  return "info";
}
function NotifPanel({
  items,
  lateAlerts,
  omAlerts,
  onOpenOm,
  onClose,
  onOpenJob,
  onMarkAll
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const alerts = lateAlerts || [];
  const oms = onOpenOm ? omAlerts || [] : [];
  const groups = React.useMemo(() => {
    const out = [];
    const at = {};
    (items || []).forEach(n => {
      const k = (n.omSiteId || n.jobId || n.id) + "|" + notifKindKey(n);
      if (at[k] != null) {
        const g = out[at[k]];
        g.count++;
        g.ids.push(n.id);
        if (!n.read) g.unread = true;
        return;
      }
      at[k] = out.length;
      out.push({
        n,
        kind: NOTIF_KINDS[notifKindKey(n)],
        count: 1,
        ids: [n.id],
        unread: !n.read
      });
    });
    return out;
  }, [items]);
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
      borderBottom: "1px solid var(--divider)",
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
  }, items.length === 0 && alerts.length === 0 && oms.length === 0 && React.createElement("div", {
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
      color: "var(--tint-red-tx2)",
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
      borderRadius: "var(--r-chip)"
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
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2A\u0E23\u0E47\u0E08 ", thDate ? thDate(a.stage.end, true) : a.stage.end)))), (items.length > 0 || oms.length > 0) && React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border)",
      margin: "4px 2px"
    }
  })), oms.length > 0 && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#7C5CFC",
      padding: "2px 4px"
    }
  }, "\uD83D\uDD27 \u0E07\u0E32\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E07\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22\u0E04\u0E49\u0E32\u0E07\u0E2D\u0E22\u0E39\u0E48 (", oms.length, ")"), oms.map(a => React.createElement("button", {
    key: a.key,
    onClick: () => onOpenOm(a),
    style: {
      display: "flex",
      gap: 10,
      padding: "11px 12px",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "inherit",
      background: a.color + "12",
      border: "none",
      borderRadius: "var(--r-chip)"
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: a.color,
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: a.icon,
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
  }, a.title), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: a.color,
      fontWeight: 600,
      marginTop: 2,
      lineHeight: 1.4
    }
  }, a.body), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, a.foot)))), items.length > 0 && React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border)",
      margin: "4px 2px"
    }
  })), groups.map(g => {
    const n = g.n,
      k = g.kind;
    const head = n.jobName || n.title;
    const sub = n.jobName ? n.title : "";
    return React.createElement("button", {
      key: n.id,
      onClick: () => onOpenJob(Object.assign({}, n, {
        ids: g.ids
      })),
      style: {
        display: "flex",
        gap: 10,
        padding: "11px 12px",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        background: g.unread ? k.color + "12" : "var(--surface)",
        border: "none",
        boxShadow: g.unread ? "inset 0 0 0 1px " + k.color + "55" : "var(--shadow-sm)",
        borderRadius: "var(--r-chip)"
      }
    }, React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: k.color,
        color: "#fff"
      }
    }, React.createElement(Icon, {
      name: k.icon,
      size: 15,
      color: "#fff"
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, head), g.count > 1 && React.createElement("span", {
      style: {
        flexShrink: 0,
        fontSize: 10.5,
        fontWeight: 800,
        color: k.color,
        background: k.color + "1A",
        borderRadius: "var(--r-pill)",
        padding: "1px 7px",
        fontVariantNumeric: "tabular-nums"
      }
    }, g.count, " \u0E04\u0E23\u0E31\u0E49\u0E07")), sub && React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: k.color,
        marginTop: 2
      }
    }, sub), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
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
    }, g.count > 1 ? "ล่าสุด " : "", thDateTime ? thDateTime(n.at) : "")), g.unread && React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: "var(--r-pill)",
        background: k.color,
        flexShrink: 0,
        marginTop: 4
      }
    }));
  }))));
}
function RolePermsEditor({
  roleCfg
}) {
  const [open, setOpen] = React.useState(ROLE_KEYS[0]);
  const [askReset, setAskReset] = React.useState(false);
  const STAGES = window.SF && window.SF.STAGES || [];
  const togglePerm = (r, key) => {
    const perms = Object.assign({}, PERMS[r]);
    if (perms[key]) delete perms[key];else perms[key] = 1;
    roleCfg.saveRole(r, {
      perms
    });
  };
  const setScope = (r, mode) => roleCfg.saveRole(r, {
    scope: {
      mode,
      stages: (ROLE_SCOPE[r] || {}).stages || []
    }
  });
  const toggleStage = (r, key) => {
    const cur = ((ROLE_SCOPE[r] || {}).stages || []).slice();
    const i = cur.indexOf(key);
    if (i === -1) cur.push(key);else cur.splice(i, 1);
    roleCfg.saveRole(r, {
      scope: {
        mode: "stages",
        stages: cur
      }
    });
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, React.createElement("div", {
    style: {
      padding: "10px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      lineHeight: 1.55
    }
  }, "\u0E41\u0E01\u0E49\u0E41\u0E25\u0E49\u0E27\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E31\u0E19\u0E17\u0E35\u0E01\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E04\u0E19\u0E17\u0E35\u0E48\u0E16\u0E37\u0E2D\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E19\u0E31\u0E49\u0E19 \xB7 \u0E04\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E04\u0E19\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E2B\u0E25\u0E32\u0E22\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E23\u0E27\u0E21\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E43\u0E2B\u0E49\u0E41\u0E1A\u0E1A \u201C\u0E01\u0E27\u0E49\u0E32\u0E07\u0E2A\u0E38\u0E14\u0E0A\u0E19\u0E30\u201D", React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2
    }
  }, "\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u201C\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u201D \u0E02\u0E2D\u0E07\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E1B\u0E34\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E01\u0E31\u0E19\u0E25\u0E47\u0E2D\u0E01\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A")), ROLE_KEYS.map(r => {
    const info = ROLE_INFO[r];
    const on = open === r;
    const sc = ROLE_SCOPE[r] || {
      mode: "all",
      stages: []
    };
    const nPerm = Object.keys(PERMS[r] || {}).length;
    const scLabel = (SCOPE_MODES.find(m => m.key === sc.mode) || SCOPE_MODES[0]).th;
    return React.createElement("div", {
      key: r,
      style: {
        borderRadius: "var(--r-tile)",
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
        background: "var(--surface)",
        overflow: "hidden"
      }
    }, React.createElement("button", {
      onClick: () => setOpen(on ? null : r),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 13px",
        border: "none",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 9,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: info.color + "22"
      }
    }, React.createElement(Icon, {
      name: info.icon,
      size: 15,
      color: info.color
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, info.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 1
      }
    }, scLabel, " \xB7 ", nPerm, " \u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C")), React.createElement(Icon, {
      name: "chevronDown",
      size: 15,
      color: "var(--text-3)",
      style: {
        flexShrink: 0,
        transform: on ? "rotate(180deg)" : "none",
        transition: "transform .18s"
      }
    })), on && React.createElement("div", {
      style: {
        padding: "4px 13px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 13,
        borderTop: "1px solid var(--divider)"
      }
    }, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: ".04em",
        color: "var(--text-3)",
        margin: "12px 0 7px"
      }
    }, "\u0E40\u0E2B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E41\u0E1A\u0E1A\u0E44\u0E2B\u0E19"), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, SCOPE_MODES.map(m => {
      const sel = sc.mode === m.key;
      return React.createElement("button", {
        key: m.key,
        onClick: () => setScope(r, m.key),
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "9px 11px",
          borderRadius: "var(--r-chip)",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          width: "100%",
          border: "none",
          boxShadow: sel ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
          background: sel ? "var(--primary-soft)" : "var(--surface2)"
        }
      }, React.createElement("span", {
        style: {
          width: 16,
          height: 16,
          borderRadius: "var(--r-pill)",
          flexShrink: 0,
          marginTop: 1,
          display: "grid",
          placeItems: "center",
          border: "none",
          boxShadow: sel ? "inset 0 0 0 2px var(--primary)" : "var(--shadow-inset)"
        }
      }, sel && React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: "var(--r-pill)",
          background: "var(--primary)"
        }
      })), React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, React.createElement("span", {
        style: {
          display: "block",
          fontSize: 12.5,
          fontWeight: 700,
          color: sel ? "var(--primary-dark)" : "var(--text-1)"
        }
      }, m.th), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 10.5,
          color: "var(--text-3)",
          marginTop: 1,
          lineHeight: 1.45
        }
      }, m.desc)));
    })), sc.mode === "stages" && React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        marginTop: 9
      }
    }, STAGES.map(s => {
      const sel = (sc.stages || []).indexOf(s.key) !== -1;
      return React.createElement("button", {
        key: s.key,
        onClick: () => toggleStage(r, s.key),
        style: {
          padding: "6px 12px",
          borderRadius: "var(--r-pill)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 700,
          border: "none",
          boxShadow: sel ? "none" : "var(--shadow-sm)",
          background: sel ? s.color : "var(--surface2)",
          color: sel ? "#fff" : "var(--text-2)"
        }
      }, s.th);
    }), (sc.stages || []).length === 0 && React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--tint-red-tx)",
        fontWeight: 600,
        alignSelf: "center"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E31\u0E49\u0E19\u0E44\u0E2B\u0E19\u0E40\u0E25\u0E22 \u2014 \u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E2A\u0E31\u0E01\u0E43\u0E1A"))), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: ".04em",
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, "\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E14\u0E49\u0E1A\u0E49\u0E32\u0E07"), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5
      }
    }, PERM_LIST.map(p => {
      const sel = !!(PERMS[r] || {})[p.key];
      const locked = r === "admin" && p.key === "manageUsers";
      return React.createElement("button", {
        key: p.key,
        onClick: () => !locked && togglePerm(r, p.key),
        disabled: locked,
        style: {
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          padding: "8px 11px",
          borderRadius: "var(--r-chip)",
          cursor: locked ? "default" : "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          width: "100%",
          border: "none",
          boxShadow: sel ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
          background: sel ? "var(--primary-soft)" : "var(--surface2)",
          opacity: locked ? .65 : 1
        }
      }, React.createElement("span", {
        style: {
          width: 17,
          height: 17,
          borderRadius: 5,
          flexShrink: 0,
          marginTop: 1,
          display: "grid",
          placeItems: "center",
          background: sel ? "var(--primary)" : "var(--surface)",
          border: "none",
          boxShadow: sel ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-inset)"
        }
      }, sel && React.createElement(Icon, {
        name: "check",
        size: 11,
        color: "#fff",
        sw: 3
      })), React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, React.createElement("span", {
        style: {
          display: "block",
          fontSize: 12.5,
          fontWeight: 700,
          color: sel ? "var(--primary-dark)" : "var(--text-2)"
        }
      }, p.th, locked && React.createElement("span", {
        style: {
          fontSize: 10,
          color: "var(--text-3)",
          fontWeight: 600
        }
      }, " \xB7 \u0E25\u0E47\u0E2D\u0E01\u0E44\u0E27\u0E49")), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 10.5,
          color: "var(--text-3)",
          marginTop: 1,
          lineHeight: 1.45
        }
      }, p.desc)));
    })))));
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 2
    }
  }, askReset ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-red-tx)",
      fontWeight: 700
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E17\u0E38\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19?"), React.createElement("button", {
    onClick: () => {
      roleCfg.resetAll();
      setAskReset(false);
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
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32"), React.createElement("button", {
    onClick: () => setAskReset(false),
    style: {
      padding: "8px 15px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement("button", {
    onClick: () => setAskReset(true),
    style: {
      padding: "8px 15px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: "pointer"
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, roleCfg.custom ? "ใช้ค่าที่ตั้งเอง" : "ใช้ค่าตั้งต้นของระบบ")));
}
function UserManager({
  authStore,
  onClose,
  roleCfg
}) {
  const bdClose = window.useBackdropClose(onClose);
  const users = authStore.users;
  const [tab, setTab] = React.useState("users");
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
      borderRadius: "var(--r-pill)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
      border: "none",
      boxShadow: filter === key ? "none" : "var(--shadow-sm)",
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
      boxShadow: "var(--shadow-modal)"
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
      borderRadius: "var(--r-chip)",
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
  }, tab === "perms" ? "สิทธิ์ตามตำแหน่ง" : "จัดการผู้ใช้งาน"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, tab === "perms" ? "ตั้งเองได้ว่าแต่ละตำแหน่งเห็นงานไหน ทำอะไรได้" : users.length + " บัญชี · หนึ่งคนถือได้หลายตำแหน่ง"))), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
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
      display: "flex",
      gap: 4,
      marginTop: 13,
      padding: 3,
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)"
    }
  }, [["users", "บัญชีผู้ใช้"], ["perms", "สิทธิ์ตำแหน่ง"]].map(([k, th]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      flex: 1,
      padding: "8px 10px",
      borderRadius: 9,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      background: tab === k ? "var(--surface)" : "transparent",
      color: tab === k ? "var(--primary-dark)" : "var(--text-3)",
      boxShadow: tab === k ? "0 1px 3px rgba(8,20,14,.12)" : "none"
    }
  }, th))), tab === "users" ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "search-box",
    style: {
      width: "100%",
      marginTop: 12
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32"
  })), React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 6,
      marginTop: 11,
      paddingBottom: 13,
      overflowX: "auto"
    }
  }, chip("all", "ทั้งหมด", counts.all), ROLE_KEYS.map(r => chip(r, ROLE_INFO[r].short, counts[r])), counts.off > 0 && chip("off", "ระงับอยู่", counts.off))) : React.createElement("div", {
    style: {
      height: 14
    }
  })), tab === "perms" ? React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 16,
      borderTop: "1px solid var(--divider)"
    }
  }, React.createElement(RolePermsEditor, {
    roleCfg: roleCfg || {
      saveRole: () => {},
      resetAll: () => {},
      custom: false
    }
  })) : React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      borderTop: "1px solid var(--divider)"
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
        borderRadius: "var(--r-chip)",
        border: "none",
        boxShadow: asking ? "inset 0 0 0 1px var(--tint-red-bd)" : "var(--shadow-sm)",
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
        borderRadius: "var(--r-pill)",
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
        color: "var(--tint-red-tx2)",
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
    }), u.techId && (() => {
      const tn = String((window.SF.TECH_BY_ID[u.techId] || {}).name || "").trim();
      const bad = !tn || tn !== String(u.name || "").trim();
      return React.createElement("span", {
        title: bad ? "งานที่มอบหมายให้พนักงานคนนี้จะเข้าบัญชีนี้ — ถ้าผูกผิดคน งานจะไม่แสดง" : "",
        style: {
          fontSize: 11,
          color: bad ? "#F59E0B" : "var(--text-3)",
          fontWeight: bad ? 700 : 400
        }
      }, "\u2192 ", tn || u.techId + " (ไม่พบพนักงาน)");
    })())), !asking && React.createElement(React.Fragment, null, React.createElement("button", {
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
        background: "var(--tint-red-bg)",
        border: "none",
        color: "var(--tint-red-tx2)",
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
        border: "none",
        boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-chip)",
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
  }, "\u0E1B\u0E34\u0E14"))), tab === "users" && React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-chip)",
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
    meId: authStore.current ? authStore.current.id : null,
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
        borderRadius: "var(--r-chip)",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px " + r.color : "var(--shadow-sm)",
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
        border: "none",
        boxShadow: on ? "inset 0 0 0 1.5px " + r.color : "var(--shadow-inset)"
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
  meId,
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
    const dup = f.techId && existing.filter(u => u.id !== f.id && u.techId === f.techId)[0];
    if (dup) {
      setErr("พนักงานคนนี้ผูกกับบัญชี \"" + (dup.name || dup.username) + "\" อยู่แล้ว เลือกคนให้ตรงกับบัญชีนี้ก่อน");
      return;
    }
    const roles = ROLE_KEYS.filter(k => f.roles.indexOf(k) !== -1);
    const pin = String(f.pin).trim();
    const pinSet = isNew || pin !== String(initial.pin == null ? "" : initial.pin);
    const must = pinSet && f.id !== meId ? true : f.mustChangePin || null;
    onSave(Object.assign({}, f, {
      name: f.name.trim(),
      username: uname,
      pin: pin,
      roles: roles,
      role: roles[0],
      mustChangePin: must
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
      boxShadow: "var(--shadow-modal)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--divider)",
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
    className: "x-close",
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "none",
      boxShadow: "var(--shadow-sm)",
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
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 \u2014"), SF.TECHS.map(t => {
    const own = existing.filter(u => u.id !== f.id && u.techId === t.id)[0];
    return React.createElement("option", {
      key: t.id,
      value: t.id,
      disabled: !!own
    }, String(t.name || "").trim(), " (", t.role, ")", own ? " — เป็นบัญชี " + (own.name || own.username) + " แล้ว" : "");
  }))), can(f.roles, "expense") && React.createElement(AField, {
    label: "\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19 \u2014 \u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, React.createElement("select", {
    style: A_INPUT,
    value: f.approverId || "",
    onChange: e => set("approverId", e.target.value || null)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07 (\u0E43\u0E04\u0E23\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E01\u0E47\u0E23\u0E31\u0E1A\u0E44\u0E14\u0E49) \u2014"), existing.filter(u => u.active !== false && can(userRoles(u), "expenseApprove")).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name, u.id === f.id ? " (ตัวเอง)" : ""))), f.approverId === f.id && !f.selfApprove && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "#F59E0B",
      marginTop: 5
    }
  }, "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2D\u0E07 \u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E17\u0E19 \u2014 \u0E16\u0E49\u0E32\u0E2D\u0E22\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E27\u0E34\u0E15\u0E0A\u0E4C\u0E02\u0E49\u0E32\u0E07\u0E25\u0E48\u0E32\u0E07")), can(f.roles, "expenseApprove") && React.createElement(AField, {
    label: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07"
  }, React.createElement("button", {
    type: "button",
    onClick: () => set("selfApprove", !f.selfApprove),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderRadius: "var(--r-chip)",
      border: "none",
      boxShadow: f.selfApprove ? "inset 0 0 0 1px #F59E0B" : "var(--shadow-sm)",
      background: "var(--surface2)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 22,
      borderRadius: "var(--r-pill)",
      background: f.selfApprove ? "#F59E0B" : "var(--surface3)",
      position: "relative",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: f.selfApprove ? 19 : 3,
      width: 16,
      height: 16,
      borderRadius: "var(--r-pill)",
      background: "#fff",
      transition: "left .2s",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: f.selfApprove ? "#B45309" : "var(--text-3)"
    }
  }, f.selfApprove ? "อนุมัติใบของตัวเองได้" : "ต้องให้คนอื่นอนุมัติ (แนะนำ)")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 5,
      lineHeight: 1.55
    }
  }, "\u0E1B\u0E01\u0E15\u0E34\u0E04\u0E19\u0E40\u0E1A\u0E34\u0E01\u0E01\u0E31\u0E1A\u0E04\u0E19\u0E15\u0E23\u0E27\u0E08\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E19\u0E25\u0E30\u0E04\u0E19 \xB7 \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E17\u0E35\u0E48\u0E04\u0E38\u0E21\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E04\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E08\u0E23\u0E34\u0E07 \u0E46 \u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E22\u0E31\u0E07\u0E04\u0E38\u0E21\u0E2D\u0E22\u0E39\u0E48 \u0E41\u0E25\u0E30\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E22\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E27\u0E48\u0E32\u0E43\u0E04\u0E23\u0E01\u0E14\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")), can(f.roles, "expensePay") && React.createElement(AField, {
    label: "\u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49\u0E40\u0E2D\u0E07 (\u0E1A\u0E32\u0E17 \xB7 0 = \u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14)"
  }, React.createElement("input", {
    style: Object.assign({}, A_INPUT, {
      fontFamily: "var(--mono)"
    }),
    inputMode: "decimal",
    value: f.payLimit || "",
    onChange: e => set("payLimit", e.target.value.replace(/[^\d.]/g, "")),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 20000 \u2014 \u0E23\u0E2D\u0E1A\u0E08\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E40\u0E01\u0E34\u0E19\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E01\u0E14"
  })), can(f.roles, "expenseApprove") && React.createElement(AField, {
    label: "\u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49\u0E40\u0E2D\u0E07 (\u0E1A\u0E32\u0E17 \xB7 0 = \u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14)"
  }, React.createElement("input", {
    style: Object.assign({}, A_INPUT, {
      fontFamily: "var(--mono)"
    }),
    inputMode: "decimal",
    value: f.approveLimit || "",
    onChange: e => set("approveLimit", e.target.value.replace(/[^\d.]/g, "")),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 5000"
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 5,
      lineHeight: 1.5
    }
  }, "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E2D\u0E14\u0E40\u0E01\u0E34\u0E19\u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E01\u0E14\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E17\u0E19")), React.createElement(AField, {
    label: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E1A\u0E31\u0E0D\u0E0A\u0E35"
  }, React.createElement("button", {
    type: "button",
    onClick: () => set("active", f.active === false ? true : false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 22,
      borderRadius: "var(--r-pill)",
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
      borderRadius: "var(--r-pill)",
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
      color: "var(--tint-red-tx2)"
    }
  }, "\u26A0 ", err)), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-chip)",
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
      borderRadius: "var(--r-chip)",
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
  sfMatchCred,
  SF_SESSION_KEY,
  jobIsMine
});
Object.assign(window, {
  useAuthStore,
  useNotifStore,
  LoginScreen,
  NotifPanel,
  UserManager,
  sfServerLogin,
  sfSignInToken,
  SF_LEGACY_KEY,
  FirstLoginScreen,
  sfNeedsSetup,
  sfPinProblem,
  useUserAvatar,
  MyProfileModal,
  can,
  hasRole,
  userRoles,
  ROLE_INFO,
  ROLE_KEYS,
  ROLE_ALIAS,
  RoleBadge,
  RoleBadges,
  useRoleConfig,
  jobScopeOf,
  jobInScope,
  PERM_LIST,
  SCOPE_MODES,
  DEFAULT_PERMS,
  applyRoleConfig,
  roleConfigNow
});