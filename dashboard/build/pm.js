const PM_ROOT = (() => {
  try {
    if (/(^|[?&])test=1(&|$)/.test(window.location.search || "")) return "_sandbox/";
    return localStorage.getItem("pm_test_root") || "";
  } catch (e) {
    return "";
  }
})();
const _PMFB = () => !!window.FBDB;
const _pmRef = p => window.FBDB.ref(PM_ROOT + p);
const _pmRoot = () => window.FBDB.ref(PM_ROOT || "/");
const pmToday = () => new Date().toISOString().slice(0, 10);
const pmNow = () => new Date().toISOString();
const PM_VER = 1;
const PM_RETIRED = [];
const pmVerOf = rec => rec && rec.meta && +rec.meta.ver || PM_VER;
const pmActive = (it, ver) => !!it.req && (it.since || 1) <= ver;
const PM_SECTIONS = [{
  key: "sum",
  en: "Summary",
  th: "ข้อมูลโครงการและระบบ",
  icon: "file",
  since: 1,
  kind: "fields",
  groups: [{
    key: "site",
    en: "Project & Site",
    th: "โครงการและที่ตั้ง",
    fields: [{
      key: "projName",
      en: "Name of Project",
      th: "ชื่อโครงการ",
      type: "text",
      req: 1,
      since: 1,
      from: "job"
    }, {
      key: "inspDate",
      en: "Date of Inspection",
      th: "วันที่ตรวจสอบ",
      type: "date",
      req: 1,
      since: 1
    }, {
      key: "siteAddr",
      en: "Site Address",
      th: "ที่อยู่ไซต์งาน",
      type: "area",
      req: 1,
      since: 1,
      from: "job"
    }, {
      key: "country",
      en: "Country",
      th: "ประเทศ",
      type: "text",
      req: 1,
      since: 1
    }, {
      key: "gpsLat",
      en: "GPS Latitude",
      th: "ละติจูด",
      type: "text",
      req: 1,
      since: 1,
      from: "survey",
      ph: "18.5450"
    }, {
      key: "gpsLng",
      en: "GPS Longitude",
      th: "ลองจิจูด",
      type: "text",
      req: 1,
      since: 1,
      from: "survey",
      ph: "99.0169"
    }, {
      key: "altM",
      en: "Site Altitude",
      th: "ความสูงจากระดับน้ำทะเล",
      type: "num",
      unit: "m",
      since: 1
    }]
  }, {
    key: "sys",
    en: "System",
    th: "ข้อมูลระบบ",
    fields: [{
      key: "sysType",
      en: "Type of the System",
      th: "ประเภทระบบ",
      type: "select",
      req: 1,
      since: 1,
      opts: ["Grid-Connected", "Off-Grid", "Hybrid"]
    }, {
      key: "dcKwp",
      en: "System DC Capacity",
      th: "กำลังติดตั้งด้าน DC",
      type: "num",
      unit: "kWp",
      req: 1,
      since: 1,
      from: "job"
    }, {
      key: "acKw",
      en: "System AC Capacity",
      th: "กำลังจ่ายด้าน AC",
      type: "num",
      unit: "kW AC",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "outV",
      en: "System Output Voltage Level",
      th: "ระดับแรงดันด้านออก",
      type: "num",
      unit: "V",
      req: 1,
      since: 1,
      from: "job"
    }, {
      key: "tiltDeg",
      en: "Tilt Angle",
      th: "มุมเอียงแผง",
      type: "num",
      unit: "°",
      since: 1
    }, {
      key: "instType",
      en: "Type of Installation",
      th: "รูปแบบการติดตั้ง",
      type: "select",
      since: 1,
      opts: ["Rooftop", "Ground Mount", "Carport"]
    }, {
      key: "orientation",
      en: "Orientation",
      th: "ลักษณะการวาง",
      type: "text",
      since: 1
    }, {
      key: "instFrom",
      en: "Period of Installation (From)",
      th: "เริ่มติดตั้ง",
      type: "date",
      since: 1,
      from: "job"
    }, {
      key: "instTo",
      en: "Period of Installation (To)",
      th: "ติดตั้งเสร็จ",
      type: "date",
      since: 1,
      from: "job"
    }]
  }, {
    key: "pv1",
    en: "PV Module 1",
    th: "แผงโซลาร์ชุดที่ 1",
    fields: [{
      key: "pv1Brand",
      en: "Module Brand",
      th: "ยี่ห้อแผง",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "pv1Model",
      en: "Module Model No.",
      th: "รุ่นแผง",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "pv1Wp",
      en: "Nameplate Capacity (DC Wp)",
      th: "กำลังต่อแผง",
      type: "num",
      unit: "Wp",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "pv1Qty",
      en: "Number of Solar Modules",
      th: "จำนวนแผง",
      type: "num",
      unit: "แผ่น",
      req: 1,
      since: 1,
      from: "job"
    }]
  }, {
    key: "pv2",
    en: "PV Module 2",
    th: "แผงโซลาร์ชุดที่ 2",
    optional: true,
    fields: [{
      key: "pv2Brand",
      en: "Module Brand",
      th: "ยี่ห้อแผง",
      type: "text",
      since: 1
    }, {
      key: "pv2Model",
      en: "Module Model No.",
      th: "รุ่นแผง",
      type: "text",
      since: 1
    }, {
      key: "pv2Wp",
      en: "Nameplate Capacity (DC Wp)",
      th: "กำลังต่อแผง",
      type: "num",
      unit: "Wp",
      since: 1
    }, {
      key: "pv2Qty",
      en: "Number of Solar Modules",
      th: "จำนวนแผง",
      type: "num",
      unit: "แผ่น",
      since: 1
    }]
  }, {
    key: "inv",
    en: "Solar Inverter",
    th: "อินเวอร์เตอร์",
    fields: [{
      key: "invBrand",
      en: "Inverter Brand",
      th: "ยี่ห้ออินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "invModel",
      en: "Inverter Model No.",
      th: "รุ่นอินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "invKw",
      en: "Nameplate Capacity (AC kW)",
      th: "กำลังต่อเครื่อง",
      type: "num",
      unit: "kW",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "invQty",
      en: "Number of Inverters",
      th: "จำนวนเครื่อง",
      type: "num",
      unit: "เครื่อง",
      req: 1,
      since: 1,
      from: "boq"
    }]
  }, {
    key: "spec",
    en: "Specific Systems",
    th: "ระบบย่อย",
    optional: true,
    fields: [{
      key: "s1Cap",
      en: "Capacity 1",
      th: "กำลังชุดที่ 1",
      type: "num",
      since: 1
    }, {
      key: "s1Az",
      en: "Azimuth / Tilt 1",
      th: "ทิศ/มุมเอียงชุดที่ 1",
      type: "text",
      since: 1
    }, {
      key: "s2Cap",
      en: "Capacity 2",
      th: "กำลังชุดที่ 2",
      type: "num",
      since: 1
    }, {
      key: "s2Az",
      en: "Azimuth / Tilt 2",
      th: "ทิศ/มุมเอียงชุดที่ 2",
      type: "text",
      since: 1
    }, {
      key: "s3Cap",
      en: "Capacity 3",
      th: "กำลังชุดที่ 3",
      type: "num",
      since: 1
    }, {
      key: "s3Az",
      en: "Azimuth / Tilt 3",
      th: "ทิศ/มุมเอียงชุดที่ 3",
      type: "text",
      since: 1
    }]
  }, {
    key: "prot",
    en: "Protection & Wiring",
    th: "อุปกรณ์ป้องกันและสายไฟ",
    fields: [{
      key: "fuseType",
      en: "String Overcurrent Device — Type",
      th: "ชนิดอุปกรณ์ป้องกันกระแสเกินสตริง",
      type: "text",
      req: 1,
      since: 1
    }, {
      key: "fuseA",
      en: "Rating",
      th: "พิกัดกระแส",
      type: "num",
      unit: "A",
      req: 1,
      since: 1
    }, {
      key: "fuseVdc",
      en: "DC Rating",
      th: "พิกัดแรงดัน DC",
      type: "num",
      unit: "V",
      req: 1,
      since: 1
    }, {
      key: "fuseKa",
      en: "Breaking Capacity",
      th: "พิกัดตัดกระแสลัดวงจร",
      type: "num",
      unit: "kA",
      since: 1
    }, {
      key: "wireBrand",
      en: "String Wiring (DC) — Brand",
      th: "ยี่ห้อสาย DC",
      type: "text",
      req: 1,
      since: 1
    }, {
      key: "wirePhaseMm",
      en: "Phase",
      th: "ขนาดสายเฟส",
      type: "num",
      unit: "sq mm",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "wireEarthMm",
      en: "Earth",
      th: "ขนาดสายดิน",
      type: "num",
      unit: "sq mm",
      req: 1,
      since: 1
    }, {
      key: "isoBrand",
      en: "Array Isolator — Brand",
      th: "ยี่ห้อสวิตช์ตัดตอนฝั่งแผง",
      type: "text",
      since: 1
    }, {
      key: "isoA",
      en: "Rating (A)",
      th: "พิกัดกระแส",
      type: "num",
      unit: "A",
      since: 1
    }, {
      key: "isoV",
      en: "Rating (V)",
      th: "พิกัดแรงดัน",
      type: "text",
      since: 1
    }]
  }, {
    key: "eng",
    en: "Engineers Undertaking Commissioning",
    th: "วิศวกรผู้ทดสอบระบบ",
    fields: [{
      key: "engCleantech",
      en: "Name of Cleantech Engineer",
      th: "ชื่อวิศวกรผู้ทดสอบ",
      type: "text",
      req: 1,
      since: 1,
      from: "user"
    }, {
      key: "engTester",
      en: "Name of Tester / EPC Representative",
      th: "ชื่อผู้ทดสอบ / ตัวแทน EPC",
      type: "text",
      req: 1,
      since: 1,
      from: "job"
    }]
  }]
}, {
  key: "docs",
  en: "Documents Checklist",
  th: "รายการเอกสารส่งมอบ",
  icon: "list",
  since: 1,
  kind: "checklist",
  groups: [{
    key: "dwgDc",
    en: "Drawings — DC System",
    th: "แบบ — ระบบ DC",
    items: [{
      key: "sldString",
      en: "PV System Single Line Diagram and PV String Layout",
      th: "ไดอะแกรมเส้นเดียวและผังสตริง",
      req: 1,
      since: 1
    }, {
      key: "dcTray",
      en: "DC Cable and Cable Tray Route",
      th: "เส้นทางเดินสายและรางสาย DC",
      req: 1,
      since: 1
    }, {
      key: "dcComb",
      en: "DC Combiner Box",
      th: "ตู้รวมสาย DC",
      req: 1,
      since: 1
    }]
  }, {
    key: "dwgMount",
    en: "Drawings — Mounting",
    th: "แบบ — โครงสร้างรองรับ",
    items: [{
      key: "modLayout",
      en: "PV Module Layout",
      th: "ผังการวางแผง",
      req: 1,
      since: 1
    }, {
      key: "mntLayout",
      en: "Mounting Layout",
      th: "ผังโครงสร้างรองรับ",
      req: 1,
      since: 1
    }, {
      key: "walkway",
      en: "Walkway Layout",
      th: "ผังทางเดินบนหลังคา",
      req: 1,
      since: 1
    }, {
      key: "lifeline",
      en: "Lifeline Layout",
      th: "ผังเส้นชีวิต (Lifeline)",
      req: 1,
      since: 1
    }, {
      key: "ladder",
      en: "Ladder Layout",
      th: "ผังบันไดขึ้นหลังคา",
      req: 1,
      since: 1
    }, {
      key: "invHouse",
      en: "Inverter Housing and Racking Layout",
      th: "ผังห้องและแร็คอินเวอร์เตอร์",
      req: 1,
      since: 1
    }]
  }, {
    key: "dwgAc",
    en: "Drawings — AC System",
    th: "แบบ — ระบบ AC",
    items: [{
      key: "acRoute",
      en: "AC Cable Route and Raceway",
      th: "เส้นทางเดินสายและรางสาย AC",
      req: 1,
      since: 1
    }, {
      key: "acRaceway",
      en: "Detail of AC Cable Raceway from Inverter Housing to MDB",
      th: "รายละเอียดรางสาย AC จากห้องอินเวอร์เตอร์ถึงตู้ MDB",
      req: 1,
      since: 1
    }, {
      key: "mdbRoom",
      en: "Main Distribution Board (MDB) Room Layout Detail",
      th: "ผังห้องตู้จ่ายไฟหลัก (MDB)",
      req: 1,
      since: 1
    }, {
      key: "invLight",
      en: "Installation of Lighting and Receptacle for Inverter Housing",
      th: "งานไฟแสงสว่างและเต้ารับในห้องอินเวอร์เตอร์",
      req: 1,
      since: 1
    }]
  }, {
    key: "dwgGnd",
    en: "Drawings — Ground System",
    th: "แบบ — ระบบสายดิน",
    items: [{
      key: "gndLayout",
      en: "Grounding System Layout",
      th: "ผังระบบสายดิน",
      req: 1,
      since: 1
    }]
  }, {
    key: "dwgZx",
    en: "Drawings — Zero Export and Communication System",
    th: "แบบ — ระบบกันไฟย้อนและระบบสื่อสาร",
    items: [{
      key: "commConfig",
      en: "Communication System Configuration",
      th: "ผังการตั้งค่าระบบสื่อสาร",
      req: 1,
      since: 1
    }, {
      key: "commRoute",
      en: "Communication Cable Route and Raceway on Rooftop",
      th: "เส้นทางสายสื่อสารและรางสายบนหลังคา",
      req: 1,
      since: 1
    }, {
      key: "pqmPanel",
      en: "PQM / Relay Communication Panel Layout",
      th: "ผังตู้ PQM และรีเลย์สื่อสาร",
      req: 1,
      since: 1
    }, {
      key: "weatherStn",
      en: "Weather Station and Instrument Layout",
      th: "ผังสถานีวัดอากาศและอุปกรณ์วัด",
      req: 1,
      since: 1
    }]
  }, {
    key: "dwgWtr",
    en: "Drawings — Water System",
    th: "แบบ — ระบบน้ำล้างแผง",
    items: [{
      key: "waterLayout",
      en: "Water Cleaning System Layout",
      th: "ผังระบบล้างแผง",
      req: 1,
      since: 1
    }, {
      key: "pumpFound",
      en: "Section of Water Pump and Tank Foundation",
      th: "รูปตัดฐานปั๊มน้ำและถังเก็บน้ำ",
      req: 1,
      since: 1
    }]
  }, {
    key: "testStd",
    en: "Test Reports — Standard Tests",
    th: "รายงานผลทดสอบ — มาตรฐาน",
    items: [{
      key: "tEquip",
      en: "Equipotential Test",
      th: "ทดสอบความต่างศักย์เท่ากัน",
      req: 1,
      since: 1,
      test: "a1"
    }, {
      key: "tDcIns",
      en: "DC Insulation Test (String Cables)",
      th: "ทดสอบความเป็นฉนวนสาย DC",
      req: 1,
      since: 1,
      test: "b1"
    }, {
      key: "tDcPol",
      en: "DC Polarity & Voltage (String Cables)",
      th: "ทดสอบขั้วและแรงดัน DC",
      req: 1,
      since: 1,
      test: "b3"
    }, {
      key: "tDcAmp",
      en: "DC Current (String Cables)",
      th: "ทดสอบกระแส DC",
      req: 1,
      since: 1,
      test: "b4"
    }, {
      key: "tAc",
      en: "AC Circuitry Test (ACDB to MCCB)",
      th: "ทดสอบวงจร AC",
      req: 1,
      since: 1,
      test: "c1"
    }, {
      key: "tTherm",
      en: "Thermal Photos — Inverter",
      th: "ภาพถ่ายความร้อนอินเวอร์เตอร์",
      req: 1,
      since: 1,
      test: "d1"
    }, {
      key: "tWater",
      en: "Water Cleaning System Test",
      th: "ทดสอบระบบล้างแผง",
      req: 1,
      since: 1,
      test: "w1"
    }]
  }, {
    key: "testSpec",
    en: "Test Reports — Specialist Tests",
    th: "รายงานผลทดสอบ — เฉพาะทาง",
    items: [{
      key: "relayTrip",
      en: "Relay Trip Test",
      th: "ทดสอบการทริปของรีเลย์",
      req: 1,
      since: 1
    }, {
      key: "relayConfig",
      en: "Relay Setting Configuration",
      th: "การตั้งค่ารีเลย์",
      req: 1,
      since: 1
    }]
  }, {
    key: "warranty",
    en: "Warranty Documents",
    th: "เอกสารรับประกัน",
    items: [{
      key: "wModule",
      en: "Module Warranty",
      th: "ใบรับประกันแผง",
      req: 1,
      since: 1
    }, {
      key: "wInverter",
      en: "Inverter Warranty",
      th: "ใบรับประกันอินเวอร์เตอร์",
      req: 1,
      since: 1
    }, {
      key: "wPv",
      en: "PV Warranty",
      th: "ใบรับประกันงานระบบ PV",
      req: 1,
      since: 1
    }, {
      key: "wSystem",
      en: "Solar Cell System Warranty",
      th: "ใบรับประกันระบบโซลาร์เซลล์",
      req: 1,
      since: 1
    }]
  }, {
    key: "approval",
    en: "Approvals",
    th: "การอนุมัติ",
    items: [{
      key: "apEcotech",
      en: "Ecotechpart Engineer",
      th: "วิศวกรฝ่ายผู้รับเหมา",
      req: 1,
      since: 1
    }, {
      key: "apOwner",
      en: "Owner Project",
      th: "เจ้าของโครงการ",
      req: 1,
      since: 1
    }]
  }]
}, {
  key: "sign",
  en: "Signatures",
  th: "ลงนามส่งมอบ",
  icon: "check",
  since: 1,
  kind: "sign",
  blocks: [{
    key: "ecoEng",
    en: "Signature of Ecotechpart Engineer",
    th: "วิศวกรฝ่ายผู้รับเหมา",
    req: 1,
    since: 1
  }, {
    key: "pmHead",
    en: "Signature of PM Head",
    th: "หัวหน้าผู้จัดการโครงการ",
    req: 1,
    since: 1
  }, {
    key: "owner",
    en: "Signature of Owner Project",
    th: "เจ้าของโครงการ",
    req: 1,
    since: 1
  }, {
    key: "regionalPm",
    en: "Signature of Regional PM Head",
    th: "ผู้จัดการโครงการประจำภูมิภาค",
    req: 1,
    since: 1
  }]
}];
const PM_SEC_BY = {};
PM_SECTIONS.forEach(s => {
  PM_SEC_BY[s.key] = s;
});
const PM_FROM_LABEL = {
  job: "จากใบงาน",
  boq: "จาก BOQ",
  survey: "จากแบบสำรวจ",
  user: "จากผู้ใช้งาน"
};
function pmBlank(user) {
  return {
    meta: {
      ver: PM_VER,
      status: "draft",
      createdAt: pmNow(),
      createdBy: (user || {}).id || null,
      createdByName: (user || {}).name || ""
    },
    sum: {},
    docs: {},
    sign: {},
    flags: {}
  };
}
function pmDms(v, isLat) {
  const n = parseFloat(v);
  if (!isFinite(n)) return "";
  const hemi = isLat ? n < 0 ? "S" : "N" : n < 0 ? "W" : "E";
  const a = Math.abs(n);
  const d = Math.floor(a);
  const mFull = (a - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return d + "° " + m + "' " + s + '" ' + hemi;
}
function pmPrefill(job, user) {
  const j = job || {};
  const out = {};
  const put = (k, v) => {
    if (v !== null && v !== undefined && String(v) !== "") out[k] = String(v);
  };
  put("projName", j.name);
  put("inspDate", pmToday());
  put("country", "Thailand");
  put("orientation", "Fixed Plane");
  put("sysType", "Grid-Connected");
  put("instType", "Rooftop");
  put("fuseType", "FUSE");
  put("siteAddr", [j.address, j.province].filter(Boolean).join(" "));
  const sg = (j.survey || {}).gps;
  if (sg && sg.lat) {
    put("gpsLat", sg.lat);
    put("gpsLng", sg.lng);
  }
  const sd = (j.stageDates || {}).install || {};
  put("instFrom", sd.start);
  put("instTo", sd.end);
  put("dcKwp", j.kw);
  put("pv1Qty", j.panels);
  put("outV", String(j.phase) === "3" ? 400 : 230);
  put("engTester", j.eeName);
  put("engCleantech", (user || {}).name);
  const boq = j.boq || {};
  const B = window.BOQ || null;
  const panelModel = boq.panelModel || j.panelModel || "";
  if (panelModel) {
    put("pv1Model", panelModel);
    const p = B && B.findPanel ? B.findPanel(panelModel) : null;
    if (p) {
      put("pv1Brand", p.group);
      put("pv1Wp", p.wp);
    }
  }
  const invModel = boq.inverterModel || (j.survey || {}).invModel || (((j.permit || {}).invs || [])[0] || {}).model || "";
  if (invModel) {
    put("invModel", invModel);
    const iv = B && B.findInverter ? B.findInverter(invModel) : null;
    if (iv) {
      put("invKw", iv.kw);
      if (iv.group) put("invBrand", iv.group);
    }
    const qty = +boq.invCount || 0;
    if (qty) put("invQty", qty);
    if (iv && qty) put("acKw", Math.round(iv.kw * qty * 100) / 100);
  }
  return out;
}
function pmMerged(rec, job, user) {
  const saved = (rec || {}).sum || {};
  const pre = pmPrefill(job, user);
  const out = Object.assign({}, pre);
  Object.keys(saved).forEach(k => {
    if (saved[k] !== null && saved[k] !== undefined && String(saved[k]) !== "") out[k] = saved[k];
  });
  return out;
}
function pmIsPrefilled(rec, key) {
  const saved = (rec || {}).sum || {};
  return !(saved[key] !== null && saved[key] !== undefined && String(saved[key]) !== "");
}
function pmProgress(rec, job, user) {
  const r = rec || {};
  const ver = pmVerOf(r);
  const flags = r.flags || {};
  const sum = rec ? pmMerged(r, job, user) : {};
  const missing = [];
  const bySection = {};
  let done = 0,
    total = 0;
  const filled = v => String(v === null || v === undefined ? "" : v).trim() !== "";
  PM_SECTIONS.forEach(sec => {
    if ((sec.since || 1) > ver) return;
    let sd = 0,
      st = 0;
    const tick = (ok, key, en, th) => {
      st += 1;
      if (ok) sd += 1;else missing.push({
        section: sec.key,
        secTh: sec.th,
        secEn: sec.en,
        key: key,
        en: en,
        th: th
      });
    };
    if (sec.kind === "fields") {
      sec.groups.forEach(g => (g.fields || []).forEach(f => {
        if (!pmActive(f, ver)) return;
        tick(filled(sum[f.key]), f.key, f.en, f.th);
      }));
    } else if (sec.kind === "checklist") {
      const v = r.docs || {};
      sec.groups.forEach(g => (g.items || []).forEach(it => {
        if (!pmActive(it, ver)) return;
        tick(v[it.key] === "y" || v[it.key] === "n", it.key, it.en, it.th);
      }));
    } else if (sec.kind === "sign") {
      const v = r.sign || {};
      (sec.blocks || []).forEach(b => {
        if (!pmActive(b, ver)) return;
        tick(filled((v[b.key] || {}).name), b.key, b.en, b.th);
      });
    } else if (sec.kind === "table") {
      const t = (r.tests || {})[sec.key] || {};
      const hdr = t.hdr || {};
      const rows = t.rows && typeof t.rows === "object" ? Object.values(t.rows) : [];
      (sec.hdr || []).forEach(h => {
        if (!pmActive(h, ver)) return;
        tick(filled(hdr[h.key]), h.key, h.en, h.th);
      });
      rows.forEach((row, i) => {
        (sec.cols || []).forEach(c => {
          if (!pmActive(c, ver)) return;
          tick(filled(row[c.key]), sec.key + "." + i + "." + c.key, c.en + " #" + (i + 1), c.th + " แถวที่ " + (i + 1));
        });
        if (sec.photos && sec.photos.req) (sec.photos.perRow || []).forEach(slot => {
          tick(+flags[sec.key + "." + (row.id || i) + "." + slot] > 0, sec.key + "." + i + "." + slot, "Photo " + slot + " #" + (i + 1), "รูป " + slot + " แถวที่ " + (i + 1));
        });
      });
      if (sec.minRows && rows.length < sec.minRows) {
        tick(false, sec.key + ".rows", "Rows in " + sec.en, "ยังไม่ได้เพิ่มแถวใน " + sec.th);
      }
    }
    bySection[sec.key] = {
      done: sd,
      total: st,
      pct: st ? Math.round(sd / st * 100) : 100,
      state: !st ? "na" : sd === st ? "done" : sd ? "partial" : "empty"
    };
    done += sd;
    total += st;
  });
  return {
    ver: ver,
    pct: total ? Math.round(done / total * 100) : 0,
    done: done,
    total: total,
    missing: missing,
    bySection: bySection
  };
}
function pmNewerItems(rec) {
  const ver = pmVerOf(rec);
  if (ver >= PM_VER) return 0;
  let n = 0;
  PM_SECTIONS.forEach(sec => {
    const walk = arr => (arr || []).forEach(it => {
      if (it.req && (it.since || 1) > ver) n += 1;
    });
    if (sec.kind === "fields") (sec.groups || []).forEach(g => walk(g.fields));else if (sec.kind === "checklist") (sec.groups || []).forEach(g => walk(g.items));else if (sec.kind === "sign") walk(sec.blocks);else if (sec.kind === "table") {
      walk(sec.hdr);
      walk(sec.cols);
    }
  });
  return n;
}
function pmSummaryOf(rec, job, user) {
  const p = pmProgress(rec, job, user);
  const m = (rec || {}).meta || {};
  return {
    ver: p.ver,
    pct: p.pct,
    done: p.done,
    total: p.total,
    status: m.status || "draft",
    signedAt: m.signedAt || null,
    updatedAt: pmNow()
  };
}
function pmCardStatus(job) {
  const h = (job || {}).pmHandover;
  if (!h || !h.total) return {
    label: "ยังไม่เริ่ม · แตะเพื่อเปิดสมุดส่งมอบ",
    color: "#94A3B8",
    bold: false
  };
  if (h.status === "signed") {
    const d = h.signedAt ? String(h.signedAt).slice(0, 10) : "";
    return {
      label: "ส่งมอบแล้ว" + (d && window.drDateTH ? " · " + window.drDateTH(d) : ""),
      color: "var(--tint-green-tx)",
      bold: true
    };
  }
  if (+h.pct >= 100) return {
    label: "ข้อมูลครบ 100% · รอลงนามส่งมอบ",
    color: "#0EA5E9",
    bold: true
  };
  return {
    label: "กรอกแล้ว " + (+h.pct || 0) + "% · ยังขาดอีก " + Math.max(0, (+h.total || 0) - (+h.done || 0)) + " รายการ",
    color: "#F59E0B",
    bold: true
  };
}
function usePmHandover(jobId) {
  const [rec, setRec] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId || !_PMFB()) {
      setRec(null);
      setLoading(false);
      return;
    }
    const ref = _pmRef("handover/" + jobId);
    const h = ref.on("value", s => {
      setRec(s.val() || null);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [jobId]);
  const open = React.useCallback(user => {
    if (!jobId || !_PMFB()) return null;
    const blank = pmBlank(user);
    _pmRef("handover/" + jobId + "/meta").update(blank.meta);
    return blank;
  }, [jobId]);
  const patch = React.useCallback((path, obj, user) => {
    if (!jobId || !_PMFB()) return;
    _pmRef("handover/" + jobId + "/" + path).update(obj || {});
    _pmRef("handover/" + jobId + "/meta").update({
      updatedAt: pmNow(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || ""
    });
  }, [jobId]);
  const setStatus = React.useCallback((status, user) => {
    if (!jobId || !_PMFB()) return;
    const m = {
      status: status,
      updatedAt: pmNow(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || ""
    };
    if (status === "signed") m.signedAt = pmNow();
    _pmRef("handover/" + jobId + "/meta").update(m);
  }, [jobId]);
  const bumpVer = React.useCallback(() => {
    if (!jobId || !_PMFB()) return;
    _pmRef("handover/" + jobId + "/meta").update({
      ver: PM_VER
    });
  }, [jobId]);
  return {
    rec: rec,
    loading: loading,
    open: open,
    patch: patch,
    setStatus: setStatus,
    bumpVer: bumpVer
  };
}
function usePmPhotoIdx(jobId) {
  const [idx, setIdx] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !_PMFB()) {
      setIdx([]);
      return;
    }
    const ref = _pmRef("handoverPhotoIdx/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setIdx(arr);
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const add = React.useCallback((dataUrl, meta, user) => {
    if (!jobId || !_PMFB()) return null;
    const id = "PMP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const m = meta || {};
    const base = {
      id: id,
      sec: m.sec || "gen",
      slot: m.slot || "",
      rowId: m.rowId || "",
      cap: m.cap || "",
      at: pmNow(),
      byName: (user || {}).name || ""
    };
    const up = {};
    up["handoverPhotos/" + jobId + "/" + id] = Object.assign({}, base, {
      dataUrl: dataUrl,
      by: (user || {}).id || null
    });
    up["handoverPhotoIdx/" + jobId + "/" + id] = base;
    _pmRoot().update(up);
    return id;
  }, [jobId]);
  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !_PMFB() || !id) return;
    const up = {};
    up["handoverPhotos/" + jobId + "/" + id + "/cap"] = cap || "";
    up["handoverPhotoIdx/" + jobId + "/" + id + "/cap"] = cap || "";
    _pmRoot().update(up);
  }, [jobId]);
  const remove = React.useCallback(id => {
    if (!jobId || !_PMFB() || !id) return;
    const up = {};
    up["handoverPhotos/" + jobId + "/" + id] = null;
    up["handoverPhotoIdx/" + jobId + "/" + id] = null;
    _pmRoot().update(up);
  }, [jobId]);
  return {
    idx: idx,
    add: add,
    setCap: setCap,
    remove: remove
  };
}
function usePmPhotos(jobId, enabled) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !enabled || !_PMFB()) {
      setPhotos([]);
      return;
    }
    const ref = _pmRef("handoverPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId, enabled]);
  return photos;
}
function pmPhotoFlags(idx) {
  const out = {};
  (idx || []).forEach(p => {
    const k = [p.sec || "gen", p.rowId || "", p.slot || ""].filter(Boolean).join(".");
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}
Object.assign(window, {
  PM_ROOT,
  PM_VER,
  PM_RETIRED,
  PM_SECTIONS,
  PM_SEC_BY,
  PM_FROM_LABEL,
  pmToday,
  pmNow,
  pmVerOf,
  pmActive,
  pmBlank,
  pmDms,
  pmPrefill,
  pmMerged,
  pmIsPrefilled,
  pmProgress,
  pmNewerItems,
  pmSummaryOf,
  pmCardStatus,
  pmPhotoFlags,
  usePmHandover,
  usePmPhotoIdx,
  usePmPhotos
});