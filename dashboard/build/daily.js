const _DRFB = () => !!window.FBDB;
const _drRef = p => window.FBDB.ref(p);
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
function drHomeSteps(job) {
  const SF = window.SF || {};
  const stages = SF.STAGES || [];
  const hist = job && job.hist || [];
  const at = k => {
    const h = hist.find(x => x && x.key === k);
    if (!h) return "";
    const v = h.date || h.at;
    return v ? String(v).slice(0, 10) : "";
  };
  const idx = stages.findIndex(s => s.key === (job || {}).stage);
  return stages.map((s, i) => {
    const inst = s.key === "install";
    const next = stages[i + 1];
    return {
      no: String(i + 1),
      th: s.th,
      head: true,
      color: s.color,
      key: s.key,
      planStart: inst && SF.installDate ? SF.installDate(job) || "" : "",
      planEnd: inst && SF.installEnd ? SF.installEnd(job) || "" : "",
      actStart: at(s.key),
      actEnd: idx >= 0 && i < idx && next ? at(next.key) : "",
      state: idx < 0 ? "wait" : i < idx ? "done" : i === idx ? "now" : "wait",
      pct: 0
    };
  });
}
const drModeOf = job => (job || {}).type === "project" ? "project" : "home";
function drDocNo(job, date, allDates) {
  const code = String((job || {}).code || "JOB").replace(/^SF-/, "");
  const n = (allDates || []).filter(d => d <= date).length || 1;
  return "PG-DR-" + code + "-" + drPad2(n);
}
const drCanApprove = role => window.hasRole(role, "lead") || window.hasRole(role, "admin");
const drCanEdit = (role, rec) => {
  if (!window.can(role, "editJob")) return false;
  return !(rec && rec.status === "approved");
};
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
  const remove = React.useCallback(date => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).remove();
    _drRef("dailyPhotos/" + jobId + "/" + date).remove();
  }, [jobId]);
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
Object.assign(window, {
  useDailyReports,
  useDailyPhotos,
  useDailyAll,
  drNorm,
  drToday,
  drISO,
  drAddDays,
  drDateTH,
  drShort,
  drPad2,
  DR_WEATHER,
  drWeatherOf,
  DR_STATUS,
  drStatusOf,
  DR_MANPOWER,
  DR_JSA,
  DR_CLEAN,
  drWhaSteps,
  drHomeSteps,
  drModeOf,
  drDocNo,
  drBlank,
  drCanApprove,
  drCanEdit,
  drPrevOf,
  drDayState
});