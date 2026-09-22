const _DRFB = () => !!window.FBDB;
const DR_ROOT = (() => {
  try {
    if (/(^|[?&])test=1(&|$)/.test(window.location.search || "")) return "_sandbox/";
    return localStorage.getItem("dr_test_root") || "";
  } catch (e) {
    return "";
  }
})();
const _drRef = p => window.FBDB.ref(DR_ROOT + p);
const drPad2 = n => (n < 10 ? "0" : "") + n;
const drISO = d => d.getFullYear() + "-" + drPad2(d.getMonth() + 1) + "-" + drPad2(d.getDate());
const drToday = () => drISO(new Date());
const drAddDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return drISO(d);
};
const DR_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const DR_DAY_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
function drDateTH(iso, withDay) {
  if (!iso) return "-";
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  const body = d.getDate() + " " + DR_MON_TH[d.getMonth()] + " " + (d.getFullYear() + 543);
  return withDay ? DR_DAY_TH[d.getDay()] + " " + body : body;
}
function drStamp() {
  const d = new Date();
  return {
    at: d.toISOString(),
    day: drISO(d),
    time: drPad2(d.getHours()) + ":" + drPad2(d.getMinutes())
  };
}
const drLocalDay = ts => {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? String(ts).slice(0, 10) : drISO(d);
};
const drSignDay = g => g ? g.day || drLocalDay(g.at) : "";
const drSignTime = g => {
  if (!g) return "";
  if (g.time) return g.time;
  const d = g.at ? new Date(g.at) : null;
  return d && !isNaN(d.getTime()) ? drPad2(d.getHours()) + ":" + drPad2(d.getMinutes()) : "";
};
const drShort = iso => {
  if (!iso) return "-";
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  return isNaN(d.getTime()) ? "-" : d.getDate() + " " + DR_MON_TH[d.getMonth()];
};
const DR_WEATHER = [{
  key: "clear",
  th: "แดดจัด",
  color: "#F59E0B"
}, {
  key: "cloudy",
  th: "เมฆมาก",
  color: "#94A3B8"
}, {
  key: "rain",
  th: "ฝนตก",
  color: "#3B82F6"
}, {
  key: "storm",
  th: "ฝนฟ้าคะนอง",
  color: "#7C5CFC"
}];
const drWeatherOf = k => DR_WEATHER.find(w => w.key === k) || null;
const DR_STATUS = [{
  key: "draft",
  th: "ร่าง",
  color: "#94A3B8"
}, {
  key: "sent",
  th: "รออนุมัติ",
  color: "#F59E0B"
}, {
  key: "approved",
  th: "อนุมัติแล้ว",
  color: "#10B981"
}];
const drStatusOf = k => DR_STATUS.find(s => s.key === k) || DR_STATUS[0];
const DR_MANPOWER = [{
  key: "pm",
  th: "ผู้จัดการโครงการ"
}, {
  key: "pe",
  th: "วิศวกรโครงการ"
}, {
  key: "se",
  th: "วิศวกรหน้างาน"
}, {
  key: "safety",
  th: "จป. / ความปลอดภัย"
}, {
  key: "qc",
  th: "ควบคุมคุณภาพ (QC)"
}, {
  key: "fore",
  th: "โฟร์แมน"
}, {
  key: "tech",
  th: "ช่างเทคนิค"
}, {
  key: "labour",
  th: "กรรมกร"
}, {
  key: "store",
  th: "สโตร์"
}, {
  key: "other",
  th: "อื่น ๆ"
}];
const DR_JSA = [{
  key: "low",
  th: "ต่ำ",
  range: "1–5",
  color: "#10B981"
}, {
  key: "medium",
  th: "ปานกลาง",
  range: "6–9",
  color: "#F59E0B"
}, {
  key: "high",
  th: "สูง",
  range: "10–16",
  color: "#F97316"
}, {
  key: "extreme",
  th: "สูงมาก",
  range: "17–25",
  color: "#EF4444"
}];
const DR_CLEAN = [{
  key: "zone",
  th: "เก็บพื้นที่ทำงาน"
}, {
  key: "trash",
  th: "เก็บขยะ"
}, {
  key: "equip",
  th: "ทำความสะอาดเครื่องมือ"
}, {
  key: "mat",
  th: "จัดเก็บวัสดุ"
}, {
  key: "all",
  th: "เก็บงานทั้งหมด"
}];
const DR_WHA_TREE = [["เตรียมความปลอดภัย & เข้าพื้นที่", ["งานความปลอดภัย — เตรียมพื้นที่ทำงาน", "ตั้งสโตร์วัสดุ & สำนักงานชั่วคราว", "ตั้งนั่งร้านสำหรับขนย้าย", "จัดพื้นที่ปลอดภัย & รายการอุปกรณ์", "ประสานไฟฟ้า/น้ำหน้างาน"]], ["เคลียร์พื้นที่", ["ปรับระดับพื้นดิน", "ทางเดินเท้า & ระบบสุขาภิบาล", "ระบบรางสายไฟ", "จัดพื้นที่สีเขียว"]], ["ห้องอินเวอร์เตอร์", ["ก่อสร้างห้อง", "แร็คซัพพอร์ต", "ติดตั้งอินเวอร์เตอร์"]], ["ติดตั้ง PV — งานโครงสร้าง", ["สำรวจหน้างาน", "ติดตั้งโครงสร้างรองรับ", "ติดตั้งแผงโซล่าเซลล์"]], ["เดินสาย — ฝั่ง DC", ["ระบบท่อร้อยสายใต้ดิน", "เดินสาย PV ตามไดอะแกรม", "สายกราวด์ฝั่ง DC"]], ["เดินสาย — ฝั่ง AC", ["ติดตั้งรางสายไฟ & wireway", "ประกอบตู้ AC-PD", "ตู้ MDB / ปรับบัสบาร์", "ต่อสาย 3 เฟส RST", "สายกราวด์ AC & ตอกแท่งกราวด์"]], ["ดับไฟเพื่อเชื่อมต่อ & ระบบป้องกัน", ["ติดตั้งหม้อแปลง", "ติดตั้งรีเลย์ป้องกัน & CT PT"]], ["ระบบสาธารณูปโภค", ["CCTV", "ติดตั้งระบบน้ำ", "สถานีตรวจอากาศ (Temp cell)"]], ["ระบบมอนิเตอร์", ["เดินสายสื่อสาร", "เชื่อมต่อระบบสื่อสาร"]], ["ส่งมอบงาน", ["Punch List เดินตรวจครั้งสุดท้าย", "สำรวจหลังก่อสร้าง", "เคลียร์ Punch List"]]];
function drWhaSteps() {
  const out = [];
  DR_WHA_TREE.forEach((grp, i) => {
    out.push({
      no: String(i + 1),
      th: grp[0],
      head: true,
      planStart: "",
      planEnd: "",
      actStart: "",
      actEnd: "",
      pct: 0
    });
    grp[1].forEach((sub, k) => {
      out.push({
        no: i + 1 + "." + (k + 1),
        th: sub,
        head: false,
        planStart: "",
        planEnd: "",
        actStart: "",
        actEnd: "",
        pct: 0
      });
    });
  });
  return out;
}
const DR_HOME_WORK = [{
  th: "เตรียมพื้นที่ & ความปลอดภัย",
  w: 5
}, {
  th: "ติดตั้งโครงสร้าง / รางแผง",
  w: 20
}, {
  th: "ยกแผงขึ้นหลังคา & ยึดแผง",
  w: 20
}, {
  th: "เดินสาย DC & ท่อร้อยสาย",
  w: 15
}, {
  th: "ติดตั้งอินเวอร์เตอร์",
  w: 10
}, {
  th: "เดินสาย AC & ตู้ควบคุม",
  w: 15
}, {
  th: "ระบบกราวด์ & กันฟ้าผ่า",
  w: 5
}, {
  th: "ทดสอบระบบ & เก็บงานส่งมอบ",
  w: 10
}];
function drHomeSteps() {
  return DR_HOME_WORK.map((x, i) => ({
    no: String(i + 1),
    th: x.th,
    head: true,
    w: x.w,
    planStart: "",
    planEnd: "",
    actStart: "",
    actEnd: "",
    pct: 0
  }));
}
function drRollup(steps) {
  const list = (steps || []).filter(r => r && !(r.head === false));
  if (!list.length) return 0;
  const w = r => r.w == null || r.w === "" ? null : +r.w || 0;
  const hasW = list.some(r => w(r) != null);
  let sum = 0,
    tot = 0;
  list.forEach(r => {
    const ww = hasW ? w(r) || 0 : 1;
    tot += ww;
    sum += ww * Math.max(0, Math.min(100, +r.pct || 0));
  });
  return tot > 0 ? Math.round(sum / tot) : 0;
}
const drWeightSum = steps => (steps || []).reduce((a, r) => a + (+r.w || 0), 0);
function drIsBoardSteps(steps) {
  const list = steps || [];
  const stages = (window.SF || {}).STAGES || [];
  if (!list.length || list.length !== stages.length) return false;
  if (list.some(r => +r.pct > 0)) return false;
  return list.every((r, i) => r.th === stages[i].th);
}
const drModeOf = job => (job || {}).type === "project" ? "project" : "home";
function drStepsFresh(steps) {
  return (steps || []).every(r => !r || !(+r.pct > 0) && !r.planStart && !r.planEnd && !r.actStart && !r.actEnd && !r.note);
}
function drDocNo(job, date, allDates) {
  const code = String((job || {}).code || "JOB").replace(/^SF-/, "");
  const n = (allDates || []).filter(d => d <= date).length || 1;
  return "FS-DR-" + code + "-" + drPad2(n);
}
const drCanApprove = (role, job, user, rec) => {
  if (window.hasRole(role, "admin")) return true;
  const uid = (user || {}).id || "";
  if (!uid || !job || !job.eeId || job.eeId !== uid) return false;
  if (rec && rec.byId && rec.byId === uid && !job.eeIsTech) return false;
  return true;
};
const drNoEe = job => !(job || {}).eeId;
const drEeIsTech = job => !!(job || {}).eeIsTech;
const drCanEdit = (role, rec) => {
  if (!window.can(role, "editJob")) return false;
  return !(rec && rec.status === "approved");
};
const drCanDelete = role => window.hasRole(role, "admin");
function drDeleteDay(jobId, date) {
  if (!jobId || !date || !_DRFB()) return;
  _drRef("dailyReports/" + jobId + "/" + date).remove();
  _drRef("dailyPhotos/" + jobId + "/" + date).remove();
  _drRef("dailySigns/" + jobId + "/" + date).remove();
}
function drBlank(job, date, user, prev) {
  const mode = drModeOf(job);
  return {
    date,
    jobId: (job || {}).id || "",
    mode,
    work: "",
    pct: typeof (job || {}).progressPct === "number" ? job.progressPct : 0,
    steps: prev && prev.steps && prev.steps.length ? prev.steps : mode === "project" ? drWhaSteps() : drHomeSteps(job),
    team: "",
    weatherAm: "",
    weatherPm: "",
    problem: "",
    nextDay: "",
    materials: [],
    machines: [],
    manpower: [],
    certs: [],
    jsa: "",
    permitCold: "",
    permitHot: "",
    clean: {},
    status: "draft",
    byId: (user || {}).id || null,
    byName: (user || {}).name || "",
    createdAt: new Date().toISOString()
  };
}
function drNorm(rec) {
  if (!rec || typeof rec !== "object" || rec.status) return rec;
  return Object.assign({}, rec, {
    work: rec.work || rec.done || "",
    problem: rec.problem || rec.issues || "",
    nextDay: rec.nextDay || rec.plan || "",
    team: rec.team || rec.crew || "",
    pct: rec.pct == null ? "" : rec.pct,
    status: "draft",
    legacy: true
  });
}
function drNormTree(byDate) {
  const out = {};
  Object.keys(byDate || {}).forEach(d => {
    out[d] = drNorm(byDate[d]);
  });
  return out;
}
function useDailyReports(jobId) {
  const [byDate, setByDate] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!jobId || !_DRFB()) {
      setByDate({});
      return;
    }
    setLoading(true);
    const ref = _drRef("dailyReports/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setByDate(v && typeof v === "object" ? drNormTree(v) : {});
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [jobId]);
  const dates = React.useMemo(() => Object.keys(byDate).sort().reverse(), [byDate]);
  const save = React.useCallback((date, rec) => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).set(Object.assign({}, rec, {
      jobId,
      date,
      updatedAt: new Date().toISOString()
    }));
  }, [jobId]);
  const patch = React.useCallback((date, fields) => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).update(Object.assign({}, fields, {
      updatedAt: new Date().toISOString()
    }));
  }, [jobId]);
  const remove = React.useCallback(date => drDeleteDay(jobId, date), [jobId]);
  return {
    byDate,
    dates,
    loading,
    save,
    patch,
    remove
  };
}
function useDailyPhotos(jobId, date) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !date || !_DRFB()) {
      setPhotos([]);
      return;
    }
    const ref = _drRef("dailyPhotos/" + jobId + "/" + date);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId, date]);
  const add = React.useCallback((dataUrl, user) => {
    if (!jobId || !date || !_DRFB()) return;
    const id = "DP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).set({
      id,
      dataUrl,
      cap: "",
      at: new Date().toISOString(),
      by: (user || {}).id || null,
      byName: (user || {}).name || ""
    });
  }, [jobId, date]);
  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !date || !_DRFB()) return;
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).update({
      cap: cap || ""
    });
  }, [jobId, date]);
  const remove = React.useCallback(id => {
    if (!jobId || !date || !_DRFB()) return;
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).remove();
  }, [jobId, date]);
  return {
    photos,
    add,
    setCap,
    remove
  };
}
function useDailySigns(jobId, date) {
  const [signs, setSigns] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !date || !_DRFB()) {
      setSigns({});
      return;
    }
    const ref = _drRef("dailySigns/" + jobId + "/" + date);
    const h = ref.on("value", s => {
      const v = s.val();
      setSigns(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId, date]);
  const sign = React.useCallback((slot, img, user) => {
    if (!jobId || !date || !_DRFB() || !img) return;
    _drRef("dailySigns/" + jobId + "/" + date + "/" + slot).set(Object.assign({
      img,
      by: (user || {}).id || null,
      name: (user || {}).name || ""
    }, drStamp()));
  }, [jobId, date]);
  const clear = React.useCallback(slot => {
    if (!jobId || !date || !_DRFB()) return;
    _drRef("dailySigns/" + jobId + "/" + date + "/" + slot).remove();
  }, [jobId, date]);
  return {
    signs,
    sign,
    clear
  };
}
function useDrMySign(userId) {
  const [sign, setSign] = React.useState(null);
  const [loading, setLoading] = React.useState(!!userId);
  React.useEffect(() => {
    if (!userId || !_DRFB()) {
      setSign(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = _drRef("userSigns/" + userId);
    const h = ref.on("value", s => {
      setSign(s.val() || null);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [userId]);
  const save = React.useCallback(img => {
    if (!userId || !_DRFB() || !img) return;
    _drRef("userSigns/" + userId).set(Object.assign({
      img
    }, drStamp()));
  }, [userId]);
  const clear = React.useCallback(() => {
    if (!userId || !_DRFB()) return;
    _drRef("userSigns/" + userId).remove();
  }, [userId]);
  return {
    sign,
    loading,
    save,
    clear
  };
}
function useDailyAll() {
  const [all, setAll] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_DRFB()) {
      setLoading(false);
      return;
    }
    const ref = _drRef("dailyReports");
    const h = ref.on("value", s => {
      const v = s.val();
      const out = {};
      Object.keys(v && typeof v === "object" ? v : {}).forEach(jid => {
        out[jid] = drNormTree(v[jid]);
      });
      setAll(out);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  return {
    all,
    loading
  };
}
function drPrevOf(byDate, date) {
  const before = Object.keys(byDate || {}).filter(d => d < date).sort();
  return before.length ? byDate[before[before.length - 1]] : null;
}
function drDayState(byDate, date) {
  const rec = (byDate || {})[date];
  if (!rec) return {
    key: "none",
    th: "ยังไม่เขียน",
    color: "#94A3B8"
  };
  return Object.assign({
    key: rec.status || "draft"
  }, drStatusOf(rec.status));
}
function drTrimSign(cv) {
  const g = cv.getContext("2d");
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width,
    y0 = cv.height,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (d[(y * cv.width + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const pad = 10;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(cv.width - 1, x1 + pad);
  y1 = Math.min(cv.height - 1, y1 + pad);
  const w = x1 - x0 + 1,
    h = y1 - y0 + 1;
  const k = Math.min(1, 560 / w);
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(w * k));
  out.height = Math.max(1, Math.round(h * k));
  out.getContext("2d").drawImage(cv, x0, y0, w, h, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}
function DrSignPad({
  title,
  hint,
  saved,
  onSave,
  onClose,
  remember,
  onRemember
}) {
  const cv = React.useRef(null);
  const wrap = React.useRef(null);
  const dpr = React.useRef(1);
  const down = React.useRef(false);
  const last = React.useRef(null);
  const [inked, setInked] = React.useState(false);
  React.useEffect(() => {
    const c = cv.current,
      w = Math.max(240, wrap.current.clientWidth),
      h = 190;
    dpr.current = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(w * dpr.current);
    c.height = Math.round(h * dpr.current);
    c.style.width = w + "px";
    c.style.height = h + "px";
    const g = c.getContext("2d");
    g.scale(dpr.current, dpr.current);
    g.lineWidth = 2.4;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#15211A";
  }, []);
  const at = e => {
    const r = cv.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const start = e => {
    e.preventDefault();
    down.current = true;
    last.current = at(e);
    setInked(true);
    if (cv.current.setPointerCapture) try {
      cv.current.setPointerCapture(e.pointerId);
    } catch (err) {}
  };
  const move = e => {
    if (!down.current) return;
    e.preventDefault();
    const p = at(e),
      g = cv.current.getContext("2d");
    g.beginPath();
    g.moveTo(last.current[0], last.current[1]);
    g.lineTo(p[0], p[1]);
    g.stroke();
    last.current = p;
  };
  const end = () => {
    down.current = false;
    last.current = null;
  };
  const wipe = () => {
    const c = cv.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setInked(false);
  };
  const done = () => {
    const img = drTrimSign(cv.current);
    if (!img) return;
    onSave(img, true);
  };
  const btn = (bg, color, border) => ({
    padding: "11px 16px",
    borderRadius: 11,
    border: border || "none",
    background: bg,
    color: color,
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer"
  });
  return ReactDOM.createPortal(React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 220,
      background: "rgba(8,20,14,.62)",
      display: "grid",
      placeItems: "center",
      padding: 14
    }
  }, React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 560,
      background: "var(--bg)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 24px 70px rgba(8,20,14,.4)"
    }
  }, React.createElement("div", {
    style: {
      padding: "14px 16px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, hint || "เซ็นด้วยนิ้วหรือเมาส์ในกรอบด้านล่าง")), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    ref: wrap,
    style: {
      padding: "16px 16px 6px"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      border: "1px dashed var(--border-strong)",
      borderRadius: 12,
      background: "#fff",
      overflow: "hidden"
    }
  }, React.createElement("canvas", {
    ref: cv,
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
    style: {
      display: "block",
      touchAction: "none",
      cursor: "crosshair"
    }
  }), !inked && React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "grid",
      placeItems: "center",
      pointerEvents: "none"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#B4C2BA"
    }
  }, "\u0E40\u0E0B\u0E47\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      position: "absolute",
      left: 22,
      right: 22,
      bottom: 34,
      borderBottom: "1px solid #E3EAE5",
      pointerEvents: "none"
    }
  }))), saved && saved.img && React.createElement("div", {
    style: {
      margin: "4px 16px 0",
      padding: "9px 11px",
      borderRadius: 11,
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("img", {
    src: saved.img,
    alt: "",
    style: {
      height: 32,
      maxWidth: 120,
      objectFit: "contain"
    }
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49"), React.createElement("button", {
    onClick: () => onSave(saved.img, false),
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, "\u0E43\u0E0A\u0E49\u0E2D\u0E31\u0E19\u0E19\u0E35\u0E49")), onRemember && React.createElement("button", {
    type: "button",
    onClick: () => onRemember(!remember),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      margin: "10px 16px 0",
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 0,
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 19,
      height: 19,
      borderRadius: 6,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: remember ? "var(--primary)" : "transparent",
      border: "1.5px solid " + (remember ? "var(--primary)" : "var(--border-strong)")
    }
  }, remember && React.createElement(Icon, {
    name: "check",
    size: 12,
    color: "#fff",
    sw: 3
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E08\u0E33\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49 \u0E43\u0E0A\u0E49\u0E04\u0E23\u0E31\u0E49\u0E07\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22")), React.createElement("div", {
    style: {
      padding: "10px 16px 16px",
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: wipe,
    style: Object.assign(btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)"), {
      flexShrink: 0
    })
  }, "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E43\u0E2B\u0E21\u0E48"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    onClick: onClose,
    style: btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)")
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: done,
    disabled: !inked,
    style: Object.assign(btn("var(--primary)", "#fff"), {
      opacity: inked ? 1 : 0.45,
      cursor: inked ? "pointer" : "default"
    })
  }, "\u0E43\u0E0A\u0E49\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E19\u0E35\u0E49")))), document.body);
}
Object.assign(window, {
  useDailyReports,
  useDailyPhotos,
  useDailySigns,
  useDrMySign,
  useDailyAll,
  drNorm,
  drToday,
  drISO,
  drAddDays,
  drDateTH,
  drShort,
  drPad2,
  drStamp,
  drSignDay,
  drSignTime,
  drLocalDay,
  DR_WEATHER,
  drWeatherOf,
  DR_STATUS,
  drStatusOf,
  DR_MANPOWER,
  DR_JSA,
  DR_CLEAN,
  drWhaSteps,
  drHomeSteps,
  drIsBoardSteps,
  drStepsFresh,
  drRollup,
  drWeightSum,
  drModeOf,
  drDocNo,
  drBlank,
  drCanApprove,
  drNoEe,
  drEeIsTech,
  drCanEdit,
  drCanDelete,
  drDeleteDay,
  drPrevOf,
  drDayState,
  DrSignPad,
  drTrimSign,
  DR_ROOT
});