/* ============================================================
   SolarFlow — Installation Workload Dashboard
   Mock data, modeled on the user's real "Solar Command Center"
   (Google-Sheets "Job Tracker"). Attached to window.SF
   ============================================================ */
(function () {
  // ---- ขั้นตอนการทำงาน (ออกแบบ → ถอดของ → นัดคิวติดตั้ง → ดำเนินการติดตั้ง → เสร็จสิ้น) ----
  const STAGES = [
    { key: "design",   th: "ออกแบบ",            en: "Design",       color: "#7C5CFC", soft: "#EEE9FF" },
    { key: "takeoff",  th: "ถอดของ",            en: "BOM Takeoff",  color: "#3B82F6", soft: "#E5EFFF" },
    { key: "queue",    th: "นัดคิวติดตั้ง",      en: "Schedule",     color: "#F59E0B", soft: "#FEF1D8" },
    { key: "install",  th: "ดำเนินการติดตั้ง",   en: "Installing",   color: "#84CC16", soft: "#ECF8D4" },
    { key: "done",     th: "เสร็จสิ้น",          en: "Completed",    color: "#10B981", soft: "#D6F5E6" },
  ];
  const STAGE_INDEX = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));
  // ขั้นเก่าที่เลิกใช้ → จับคู่ขั้นใหม่ (สั่งของ/รอของ เดิม รวมเป็น "นัดคิวติดตั้ง")
  const STAGE_REMAP = { order: "queue", waiting: "queue", countin: "takeoff", countout: "takeoff" };

  // ---- Material checklist components (from the real table) ----
  const MATERIALS = [
    { key: "panel",     th: "แผงโซล่า",    en: "Panels" },
    { key: "inverter",  th: "อินเวอร์เตอร์", en: "Inverter" },
    { key: "structure", th: "โครงสร้างยึดแผง", en: "Solar Mounting" },
    { key: "wiring",    th: "สายไฟ",       en: "Wiring" },
    { key: "battery",   th: "แบตเตอรี่",    en: "Battery" },
    { key: "backup",    th: "ระบบ Backup", en: "Backup (EPS)" },
    { key: "birdnet",   th: "ตาข่ายกันนก", en: "Bird Net" },
  ];
  // material status: ready ✅ / waiting ⏳ / none ❌ / na ➖
  const MAT_STATUS = {
    ready:   { th: "ครบ",     icon: "✅", color: "#10B981", soft: "#D6F5E6" },
    waiting: { th: "รอของ",   icon: "⏳", color: "#F59E0B", soft: "#FEF1D8" },
    none:    { th: "ยังไม่สั่ง", icon: "❌", color: "#EF4444", soft: "#FDE2E2" },
    na:      { th: "ไม่ใช้",   icon: "➖", color: "#94A3B8", soft: "#EEF1F5" },
  };

  // ---- Technicians (install crews) ----
  const TECHS = [
    { id: "t1", name: "สมชาย ตั้งใจ",   nick: "ชาย",   color: "#10B981", role: "หัวหน้าทีม A" },
    { id: "t2", name: "ธนากร พลังงาน",  nick: "กร",    color: "#3B82F6", role: "หัวหน้าทีม B" },
    { id: "t3", name: "วีระ แสงทอง",    nick: "วี",    color: "#F59E0B", role: "ช่างไฟ" },
    { id: "t4", name: "ปกรณ์ ศรีสุข",   nick: "กฤษ",   color: "#7C5CFC", role: "ช่างติดตั้ง" },
    { id: "t5", name: "อนันต์ ไพศาล",   nick: "นันต์", color: "#EF4444", role: "ช่างติดตั้ง" },
  ];
  const TECH_BY_ID = Object.fromEntries(TECHS.map((t) => [t.id, t]));

  const BRANDS = ["ATMOCE", "Huawei"];
  const TYPES = [
    { key: "home",    th: "งานบ้าน",     color: "#F59E0B" },
    { key: "project", th: "งานโครงการ",  color: "#7C5CFC" },
  ];

  const ymd = (d) => [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
  // parse "YYYY-MM-DD" เป็นวันที่ local (เลี่ยง UTC offset)
  const parseDateLocal = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

  // helper to build the 8-stage timeline history
  // storedHist = วัน+เวลาจริงที่ user เคยกดเลื่อน stage (มี recorded:true / at:timestamp)
  function hist(currentKey, problemHere, storedHist) {
    const ci = STAGE_INDEX[currentKey];
    // ถ้ามี stored hist (จากการเลื่อน stage จริง) — ใช้วัน+เวลาจริง
    if (storedHist && storedHist.length >= STAGES.length) {
      return STAGES.map((s, i) => {
        const stored = storedHist[i] || {};
        let status = "pending";
        if (i < ci) status = "done";
        else if (i === ci) status = "current";
        return {
          key: s.key, status,
          blocked: problemHere && i === ci,
          date: stored.date || null,        // ใช้วันที่ที่บันทึกจริงเท่านั้น (ไม่เดาเป็นวันนี้)
          at: stored.at || null,            // เวลาจริงเต็ม (ถ้ามี)
          recorded: !!stored.recorded,      // true = บันทึกจริง, false = ยังไม่บันทึก
        };
      });
    }
    // ข้อมูลตัวอย่าง: สร้างวัน+เวลาย้อนหลังจากวันนี้ ให้ดูเป็นเวลาที่บันทึกจริง
    const base = new Date(TODAY);
    base.setDate(base.getDate() - (ci * 3));
    return STAGES.map((s, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i * 3);
      d.setHours(9 + (i % 7), (i * 13) % 60, 0, 0); // เวลาทำงานสมจริง
      let status = "pending";
      if (i < ci) status = "done";
      else if (i === ci) status = "current";
      const recorded = i <= ci;
      return { key: s.key, status, blocked: problemHere && i === ci, date: recorded ? ymd(d) : null, at: recorded ? d.toISOString() : null };
    });
  }

  function mats(obj) {
    // fill missing with 'none'
    const out = {};
    MATERIALS.forEach((m) => { out[m.key] = obj[m.key] || "none"; });
    return out;
  }

  // ---- Jobs / Customers ----  (gps normalized 0..1 for stylized map)
  const RAW = [
    {
      code: "SF-2401", name: "คุณวิชัย เจริญพร", phone: "086-111-2233", type: "home",
      address: "บ้านเดี่ยว ม.บุราสิริ ลาดพร้าว 71", province: "กรุงเทพฯ", gps: [0.55, 0.46],
      map: "https://maps.app.goo.gl/x1", brand: "ATMOCE", kw: 10.2, panels: 18,
      battery: true, batSize: "14 kWh", connect: "ต่อ 1:2", backup: true, birdnet: true,
      stage: "install", deadline: "2026-06-08", tech: "t1", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "ready", battery: "ready", backup: "ready", birdnet: "ready" },
      note: "ติดตั้งบนหลังคา metal sheet ทิศใต้ ระบบ Backup ครอบทั้งบ้าน",
    },
    {
      code: "SF-2402", name: "คุณสุดารัตน์ มีสุข", phone: "089-222-3344", type: "home",
      address: "ทาวน์โฮม โครงการเดอะคอนเนค รังสิต", province: "ปทุมธานี", gps: [0.58, 0.34],
      map: "https://maps.app.goo.gl/x2", brand: "Huawei", kw: 5.0, panels: 9,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: true,
      stage: "waiting", deadline: "2026-06-12", tech: "t2",
      problem: "รออินเวอร์เตอร์ Huawei SUN2000 5KTL ของขาดสต็อก คาดเข้า 10 มิ.ย.",
      mat: { panel: "ready", inverter: "waiting", structure: "ready", wiring: "waiting", battery: "na", backup: "na", birdnet: "none" },
      note: "",
    },
    {
      code: "SF-2403", name: "บจก. กรีนเทค โซลูชั่น", phone: "02-555-7788", type: "project",
      address: "โรงงาน นิคมฯ บางปู ซ.12", province: "สมุทรปราการ", gps: [0.6, 0.6],
      map: "https://maps.app.goo.gl/x3", brand: "Huawei", kw: 125.0, panels: 220,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "order", deadline: "2026-06-20", tech: "t1", problem: null,
      mat: { panel: "waiting", inverter: "none", structure: "waiting", wiring: "none", battery: "na", backup: "na", birdnet: "na" },
      note: "งานโครงการใหญ่ ต้องขออนุญาต กฟภ. ก่อนติดตั้ง",
    },
    {
      code: "SF-2404", name: "คุณอนุชา ทองดี", phone: "081-333-4455", type: "home",
      address: "บ้านเดี่ยว 2 ชั้น ต.สันทราย", province: "เชียงใหม่", gps: [0.32, 0.12],
      map: "https://maps.app.goo.gl/x4", brand: "ATMOCE", kw: 8.0, panels: 14,
      battery: true, batSize: "21 kWh", connect: "ต่อ 1:1", backup: true, birdnet: false,
      stage: "design", deadline: "2026-06-25", tech: "t3", problem: null,
      mat: { panel: "none", inverter: "none", structure: "none", wiring: "none", battery: "none", backup: "none", birdnet: "na" },
      note: "ลูกค้าขอแบบ 3D ก่อนเซ็นสัญญา",
    },
    {
      code: "SF-2405", name: "คุณมานพ ศรีวิไล", phone: "088-444-5566", type: "home",
      address: "บ้านสวน ต.บางพระ", province: "ชลบุรี", gps: [0.64, 0.52],
      map: "https://maps.app.goo.gl/x5", brand: "ATMOCE", kw: 6.4, panels: 12,
      battery: true, batSize: "28 kWh", connect: "ต่อ 1:2", backup: true, birdnet: true,
      stage: "install", deadline: "2026-06-10", tech: "t4", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "waiting", battery: "ready", backup: "ready", birdnet: "waiting" },
      note: "พื้นที่ไฟตก ใช้แบตเตอรี่สำรองขนาดใหญ่",
    },
    {
      code: "SF-2406", name: "คุณพิมพ์ใจ รุ่งเรือง", phone: "090-555-6677", type: "home",
      address: "บ้านเดี่ยว ไอดีโอ สุขุมวิท 93", province: "กรุงเทพฯ", gps: [0.56, 0.47],
      map: "https://maps.app.goo.gl/x6", brand: "Huawei", kw: 3.0, panels: 6,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "done", deadline: "2026-05-30", tech: "t2", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "ready", battery: "na", backup: "na", birdnet: "na" },
      note: "ส่งมอบงานเรียบร้อย รับประกัน 25 ปี",
    },
    {
      code: "SF-2407", name: "คุณเอกพงษ์ บุญมาก", phone: "091-666-7788", type: "project",
      address: "โกดังสินค้า ถ.เพชรเกษม กม.34", province: "นครปฐม", gps: [0.48, 0.5],
      map: "https://maps.app.goo.gl/x7", brand: "Huawei", kw: 50.0, panels: 88,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "takeoff", deadline: "2026-06-28", tech: "t1", problem: null,
      mat: { panel: "none", inverter: "none", structure: "none", wiring: "none", battery: "na", backup: "na", birdnet: "na" },
      note: "",
    },
    {
      code: "SF-2408", name: "คุณนภา จันทร์เพ็ญ", phone: "092-777-8899", type: "home",
      address: "บ้านเดี่ยว ม.ภัสสร บางบัวทอง", province: "นนทบุรี", gps: [0.52, 0.4],
      map: "https://maps.app.goo.gl/x8", brand: "ATMOCE", kw: 5.5, panels: 10,
      battery: true, batSize: "7 kWh", connect: "ต่อ 1:1", backup: false, birdnet: true,
      stage: "install", deadline: "2026-06-07", tech: "t3",
      problem: "หลังคาบางส่วนผุ ต้องเสริมโครงก่อนติดตั้ง — รอลูกค้าตัดสินใจ",
      mat: { panel: "ready", inverter: "ready", structure: "waiting", wiring: "ready", battery: "ready", backup: "na", birdnet: "ready" },
      note: "",
    },
    {
      code: "SF-2409", name: "คุณสมหญิง รักดี", phone: "093-888-9900", type: "home",
      address: "บ้านเดี่ยว ต.หนองปรือ", province: "ชลบุรี", gps: [0.65, 0.53],
      map: "https://maps.app.goo.gl/x9", brand: "Huawei", kw: 5.0, panels: 9,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "install", deadline: "2026-06-09", tech: "t4", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "ready", battery: "na", backup: "na", birdnet: "na" },
      note: "วัสดุครบ พร้อมส่งทีมพรุ่งนี้",
    },
    {
      code: "SF-2410", name: "คุณธีรพล มั่นคง", phone: "094-999-0011", type: "project",
      address: "อาคารพาณิชย์ 4 ชั้น ถ.นิมมาน", province: "เชียงใหม่", gps: [0.31, 0.13],
      map: "https://maps.app.goo.gl/x10", brand: "ATMOCE", kw: 15.0, panels: 26,
      battery: true, batSize: "35 kWh", connect: "ต่อ 1:2", backup: true, birdnet: false,
      stage: "waiting", deadline: "2026-06-15", tech: "t5",
      problem: "รอแบตเตอรี่ ATMOCE 35kWh ส่งจากคลังเชียงใหม่",
      mat: { panel: "ready", inverter: "ready", structure: "waiting", wiring: "ready", battery: "waiting", backup: "ready", birdnet: "na" },
      note: "",
    },
    {
      code: "SF-2411", name: "คุณกัญญา แสนสุข", phone: "095-000-1122", type: "home",
      address: "บ้านเดี่ยว ม.การ์เด้นโฮม", province: "ขอนแก่น", gps: [0.5, 0.28],
      map: "https://maps.app.goo.gl/x11", brand: "ATMOCE", kw: 5.0, panels: 9,
      battery: true, batSize: "7 kWh", connect: "ต่อ 1:1", backup: false, birdnet: true,
      stage: "order", deadline: "2026-06-22", tech: "t3", problem: null,
      mat: { panel: "waiting", inverter: "none", structure: "none", wiring: "none", battery: "none", backup: "na", birdnet: "none" },
      note: "",
    },
    {
      code: "SF-2412", name: "คุณวรเทพ ใจกล้า", phone: "096-111-2244", type: "project",
      address: "รีสอร์ท ต.อ่าวนาง", province: "กระบี่", gps: [0.34, 0.86],
      map: "https://maps.app.goo.gl/x12", brand: "ATMOCE", kw: 30.0, panels: 52,
      battery: true, batSize: "35 kWh", connect: "ต่อ 1:2", backup: true, birdnet: false,
      stage: "design", deadline: "2026-07-02", tech: "t1", problem: null,
      mat: { panel: "none", inverter: "none", structure: "none", wiring: "none", battery: "none", backup: "none", birdnet: "na" },
      note: "งานชายทะเล ต้องใช้วัสดุกันการกัดกร่อนสูง",
    },
    {
      code: "SF-2413", name: "คุณรัตนา พูนผล", phone: "097-222-3355", type: "home",
      address: "บ้านเดี่ยว ต.บางแก้ว", province: "สมุทรปราการ", gps: [0.59, 0.58],
      map: "https://maps.app.goo.gl/x13", brand: "Huawei", kw: 5.0, panels: 9,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "done", deadline: "2026-05-26", tech: "t2", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "ready", battery: "na", backup: "na", birdnet: "na" },
      note: "",
    },
    {
      code: "SF-2414", name: "คุณชัยวัฒน์ เกียรติยศ", phone: "098-333-4466", type: "home",
      address: "บ้านหรู ม.เพรสทีจ บางนา", province: "กรุงเทพฯ", gps: [0.58, 0.5],
      map: "https://maps.app.goo.gl/x14", brand: "ATMOCE", kw: 12.0, panels: 20,
      battery: true, batSize: "28 kWh", connect: "ต่อ 1:2", backup: true, birdnet: true,
      stage: "install", deadline: "2026-06-08", tech: "t5", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "ready", battery: "ready", backup: "ready", birdnet: "ready" },
      note: "ติดตั้งระบบ Backup ครอบทั้งบ้าน",
    },
    {
      code: "SF-2415", name: "คุณสุพรรณี ดวงดี", phone: "099-444-5577", type: "home",
      address: "ทาวน์โฮม ต.คลองหนึ่ง", province: "ปทุมธานี", gps: [0.57, 0.35],
      map: "https://maps.app.goo.gl/x15", brand: "Huawei", kw: 3.0, panels: 6,
      battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
      stage: "install", deadline: "2026-06-11", tech: "t4", problem: null,
      mat: { panel: "ready", inverter: "ready", structure: "ready", wiring: "waiting", battery: "na", backup: "na", birdnet: "na" },
      note: "",
    },
    {
      code: "SF-2416", name: "บจก. ฟาร์มสุข เกษตร", phone: "044-555-6688", type: "project",
      address: "ฟาร์มเลี้ยงไก่ ต.ปากช่อง", province: "นครราชสีมา", gps: [0.52, 0.32],
      map: "https://maps.app.goo.gl/x16", brand: "ATMOCE", kw: 40.0, panels: 70,
      battery: true, batSize: "35 kWh", connect: "ต่อ 1:2", backup: true, birdnet: false,
      stage: "takeoff", deadline: "2026-06-05", tech: "t3",
      problem: "เกินกำหนดถอดของ — รอ BOM อนุมัติจากวิศวกร",
      mat: { panel: "none", inverter: "none", structure: "none", wiring: "none", battery: "none", backup: "none", birdnet: "na" },
      note: "สูบน้ำ + ระบบให้อาหารอัตโนมัติ",
    },
  ];

  // ---- derive computed fields from a raw record (re-run after every edit) ----
  const TODAY = new Date(); // ใช้วันที่จริงของระบบ (local timezone)
  function deriveJob(j) {
    // remap ขั้นเก่าที่เลิกใช้ → ขั้นใหม่ (สั่งของ/รอของ → นัดคิวติดตั้ง ฯลฯ)
    if (STAGE_REMAP[j.stage]) j = Object.assign({}, j, { stage: STAGE_REMAP[j.stage] });
    if (STAGE_INDEX[j.stage] == null) j = Object.assign({}, j, { stage: "queue" });
    const matObj = mats(j.mat || {});
    const matVals = MATERIALS.map((m) => matObj[m.key]).filter((v) => v !== "na");
    const matReadyCount = matVals.filter((v) => v === "ready").length;
    const matReady = matVals.length > 0 && matReadyCount === matVals.length;
    // กำหนดการของงาน = ช่วงวันนัดติดตั้ง (โมเดลใหม่: ใช้วันนัดติดตั้งวัน/ช่วงเดียวเป็นแหล่งเดียว)
    // ไม่ derive จาก stageDates รายขั้นเดิม / j.deadline เก่าอีก เพื่อกันข้อมูลค้าง
    const sdates = j.stageDates || {};
    const iv = sdates.install;
    let instS = "", instE = "";
    if (iv) {
      if (typeof iv === "object") { instS = (iv.start || iv.end || "").slice(0, 10); instE = (iv.end || iv.start || "").slice(0, 10); }
      else { instS = String(iv).slice(0, 10); instE = instS; }
      if (!instE || instE < instS) instE = instS;
    }
    const effStart = instS || null;     // วันเริ่มติดตั้ง (null = ยังไม่นัด)
    const effDeadline = instE || null;  // วันเสร็จติดตั้ง
    // งานล่าช้า = ยังไม่เสร็จ และเลยวันเสร็จติดตั้งไปแล้ว (เทียบระดับวัน — ครบกำหนดวันนี้ยังไม่ล่าช้า)
    const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
    const dl = effDeadline ? parseDateLocal(effDeadline) : null;
    const delayed = j.stage !== "done" && dl && dl.getTime() < todayMidnight.getTime();
    const stageIdx = STAGE_INDEX[j.stage] != null ? STAGE_INDEX[j.stage] : 0;
    // เลยกำหนด → ชี้ที่ขั้นติดตั้ง (โมเดลใหม่ผูกความล่าช้ากับวันนัดติดตั้ง)
    const lateStages = [];
    if (delayed) {
      const inst = STAGES.find((s) => s.key === "install") || {};
      lateStages.push({ key: "install", th: inst.th, en: inst.en, color: inst.color, end: instE,
        daysLate: Math.round((todayMidnight.getTime() - dl.getTime()) / 86400000) });
    }
    return Object.assign({}, j, {
      id: j.id || j.code,
      mat: matObj,
      startDate: effStart,
      deadline: effDeadline,
      timeline: hist(j.stage, !!j.problem, j.hist),
      matReady, matReadyPct: Math.round((matReadyCount / Math.max(matVals.length, 1)) * 100),
      delayed: !!delayed, stageIdx,
      lateStages, lateStageCount: lateStages.length,
      progressPct: Math.round(((stageIdx + (j.stage === "done" ? 1 : 0)) / STAGES.length) * 100),
    });
  }

  const SEED = RAW.map((j) => Object.assign({ id: j.code }, j));
  const JOBS = SEED.map(deriveJob);

  // วันนัดติดตั้ง = ช่วงวันที่ใช้จัดตารางงาน (อ่านจาก stageDates.install = {start,end})
  function installDate(j) {                         // วันเริ่มติดตั้ง
    const v = j && j.stageDates && j.stageDates.install;
    if (!v) return "";
    if (typeof v === "object") return (v.start || v.end || "").slice(0, 10);
    return String(v).slice(0, 10);
  }
  function installEnd(j) {                          // วันเสร็จติดตั้ง (>= วันเริ่ม, ค่าเริ่มต้น = วันเริ่ม)
    const v = j && j.stageDates && j.stageDates.install;
    if (!v) return "";
    const s = installDate(j);
    let e = (typeof v === "object" ? (v.end || v.start || "") : String(v)).slice(0, 10);
    if (!e || e < s) e = s;
    return e;
  }

  window.SF = {
    STAGES, STAGE_INDEX, MATERIALS, MAT_STATUS, TECHS, TECH_BY_ID, BRANDS, TYPES,
    SEED, JOBS, deriveJob, installDate, installEnd,
    // ใช้ local date string เพื่อหลีกเลี่ยง UTC offset (ไทย UTC+7 ทำให้ toISOString() ได้วันเมื่อวาน)
    TODAY: [TODAY.getFullYear(), String(TODAY.getMonth()+1).padStart(2,"0"), String(TODAY.getDate()).padStart(2,"0")].join("-"),
    PROVINCE_LATLNG: {
      "กรุงเทพฯ":     [13.7563, 100.5018],
      "ปทุมธานี":     [14.0208, 100.5250],
      "นนทบุรี":      [13.8591, 100.5217],
      "สมุทรปราการ":  [13.5991, 100.5998],
      "นครปฐม":       [13.8199, 100.0621],
      "ชลบุรี":       [13.3611, 100.9847],
      "เชียงใหม่":    [18.7883,  98.9853],
      "ขอนแก่น":      [16.4419, 102.8360],
      "นครราชสีมา":   [14.9799, 102.0978],
      "กระบี่":       [ 8.0863,  98.9063],
    },
  };
})();
