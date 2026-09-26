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
const PM_VER = 4;
const PM_RETIRED = ["engCleantech", "ecoEng", "pmHead", "regionalPm", "apEcotech", "s1Cap", "s1Az", "s2Cap", "s2Az", "s3Cap", "s3Az"];
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
    key: "pv",
    repeat: {
      countKey: "pvSets",
      prefix: "pv",
      max: 8,
      plainFirst: false,
      addTh: "เพิ่มชุดแผง",
      addEn: "Add PV module set",
      oneTh: "ชุดแผง",
      label: (n, count) => count > 1 || n > 1 ? {
        en: "PV Module " + n,
        th: "แผงโซลาร์ชุดที่ " + n
      } : {
        en: "PV Module",
        th: "แผงโซลาร์"
      }
    },
    fields: [{
      key: "Brand",
      en: "Module Brand",
      th: "ยี่ห้อแผง",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Model",
      en: "Module Model No.",
      th: "รุ่นแผง",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Wp",
      en: "Nameplate Capacity (DC Wp)",
      th: "กำลังต่อแผง",
      type: "num",
      unit: "Wp",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Qty",
      en: "Number of Solar Modules",
      th: "จำนวนแผง",
      type: "num",
      unit: "แผ่น",
      req: 1,
      since: 1,
      from: "job"
    }]
  }, {
    key: "inv",
    repeat: {
      countKey: "invSets",
      prefix: "inv",
      max: 8,
      plainFirst: true,
      addTh: "เพิ่มรุ่นอินเวอร์เตอร์",
      addEn: "Add inverter set",
      oneTh: "ชุดอินเวอร์เตอร์",
      label: (n, count) => count > 1 || n > 1 ? {
        en: "Solar Inverter " + n,
        th: "อินเวอร์เตอร์ชุดที่ " + n
      } : {
        en: "Solar Inverter",
        th: "อินเวอร์เตอร์"
      }
    },
    fields: [{
      key: "Brand",
      en: "Inverter Brand",
      th: "ยี่ห้ออินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Model",
      en: "Inverter Model No.",
      th: "รุ่นอินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Kw",
      en: "Nameplate Capacity (AC kW)",
      th: "กำลังต่อเครื่อง",
      type: "num",
      unit: "kW",
      req: 1,
      since: 1,
      from: "boq"
    }, {
      key: "Qty",
      en: "Number of Inverters",
      th: "จำนวนเครื่อง",
      type: "num",
      unit: "เครื่อง",
      req: 1,
      since: 1,
      from: "boq"
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
      en: "Cable Size",
      th: "ขนาดสายไฟ",
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
      key: "engProject",
      en: "Project Engineer",
      th: "วิศวกรโปรเจค",
      type: "text",
      req: 1,
      since: 1,
      from: "job"
    }, {
      key: "engTester",
      en: "Name of Tester",
      th: "ชื่อผู้ทดสอบ",
      type: "text",
      req: 1,
      since: 1,
      from: "user"
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
      key: "apCompany",
      en: "Contractor Approval",
      th: "อนุมัติโดยบริษัทผู้รับเหมา",
      dyn: "company",
      req: 1,
      since: 1
    }, {
      key: "apOwner",
      en: "Owner Approval",
      th: "อนุมัติโดยเจ้าของโครงการ",
      dyn: "project",
      req: 1,
      since: 1
    }]
  }]
}, {
  key: "reg",
  en: "Equipment Register",
  th: "ทะเบียนอุปกรณ์",
  icon: "box",
  since: 2,
  kind: "table",
  tables: [{
    key: "inv",
    code: "1",
    en: "Inverters",
    th: "อินเวอร์เตอร์",
    minRows: 1,
    hdr: [{
      key: "mfrModel",
      en: "Manufacturer and Model",
      th: "ยี่ห้อและรุ่น",
      type: "text",
      req: 1,
      since: 2
    }],
    cols: [{
      key: "sn",
      en: "Serial Number",
      th: "หมายเลขเครื่อง",
      type: "text",
      req: 1,
      since: 2,
      w: 2
    }, {
      key: "kw",
      en: "Rated Power",
      th: "กำลังไฟฟ้า",
      unit: "kW AC",
      type: "num",
      req: 1,
      since: 2
    }],
    seed: (job, sum) => {
      const n = Math.min(60, parseInt(sum.invQty, 10) || 0);
      const out = [];
      for (let i = 0; i < n; i++) out.push({
        kw: sum.invKw || ""
      });
      return out;
    }
  }, {
    key: "meter",
    code: "2",
    en: "Energy Meter",
    th: "มิเตอร์วัดพลังงาน",
    hdr: [{
      key: "mfrModel",
      en: "Manufacturer and Model",
      th: "ยี่ห้อและรุ่น",
      type: "text",
      since: 2
    }],
    cols: [{
      key: "sn",
      en: "Serial Number",
      th: "หมายเลขเครื่อง",
      type: "text",
      since: 2,
      w: 2
    }, {
      key: "mfgDate",
      en: "Manufacturing Date",
      th: "วันที่ผลิต",
      type: "text",
      since: 2
    }, {
      key: "ip",
      en: "IP Address",
      th: "หมายเลข IP",
      type: "text",
      since: 2
    }]
  }, {
    key: "sim",
    en: "SIM Cards",
    th: "ซิมการ์ด",
    cols: [{
      key: "phone",
      en: "Phone Number",
      th: "เบอร์โทร",
      type: "text",
      since: 2
    }, {
      key: "simNo",
      en: "SIM No.",
      th: "หมายเลขซิม",
      type: "text",
      since: 2,
      w: 2
    }, {
      key: "isp",
      en: "Service Provider",
      th: "ผู้ให้บริการ",
      type: "text",
      since: 2
    }, {
      key: "loc",
      en: "Location",
      th: "ตำแหน่งที่ติดตั้ง",
      type: "text",
      since: 2
    }]
  }, {
    key: "wx",
    en: "Weather Sensors",
    th: "เซนเซอร์วัดอากาศ",
    cols: [{
      key: "model",
      en: "Sensor Type / Model",
      th: "ชนิดและรุ่น",
      type: "text",
      since: 2,
      w: 2
    }, {
      key: "mfr",
      en: "Manufactured By",
      th: "ผู้ผลิต",
      type: "text",
      since: 2
    }, {
      key: "sn",
      en: "Serial Number",
      th: "หมายเลขเครื่อง",
      type: "text",
      since: 2
    }, {
      key: "mfgDate",
      en: "Date of Manufacturing",
      th: "วันที่ผลิต",
      type: "text",
      since: 2
    }, {
      key: "calDate",
      en: "Calibration Date",
      th: "วันที่สอบเทียบ",
      type: "text",
      since: 2
    }]
  }, {
    key: "instr",
    code: "3",
    en: "Test Instruments",
    th: "เครื่องมือที่ใช้ทดสอบ",
    cols: [{
      key: "test",
      en: "Standard Functional Test",
      th: "รายการทดสอบ",
      type: "text",
      since: 2,
      w: 3
    }, {
      key: "code",
      en: "Product Code / Serial",
      th: "รหัสหรือหมายเลขเครื่องมือ",
      type: "text",
      since: 2,
      w: 2
    }, {
      key: "mfr",
      en: "Manufacturer",
      th: "ยี่ห้อเครื่องมือ",
      type: "text",
      since: 2
    }],
    seed: () => [{
      test: "A1. Equipotential Test AC/DC"
    }, {
      test: "B1. DC Insulation Test (String Cables)"
    }, {
      test: "B3. DC Polarity & Voltage"
    }, {
      test: "B4. DC Current (String Cables)"
    }, {
      test: "C1. AC Circuitry Test (Inverter to AC DB)"
    }, {
      test: "C2. Ground Rod Test"
    }, {
      test: "D1. Thermal Photos — Inverter"
    }, {
      test: "D2. Thermal Photos — AC Box / Data Logger"
    }, {
      test: "D3. Thermal Photos — PV and Under PV"
    }, {
      test: "E1. Torque at Mid Clamp and End Clamp"
    }, {
      test: "E2. Torque at Cliplock and L-feet"
    }, {
      test: "W1. Water Cleaning Test"
    }]
  }]
}, {
  key: "a1",
  code: "A1",
  en: "A1. Equipotential Test",
  th: "A1 ทดสอบความต่อเนื่องของสายดิน",
  icon: "check",
  since: 2,
  kind: "table",
  tables: [{
    key: "main",
    en: "Designated Location of Measurement",
    th: "จุดที่วัด",
    minRows: 1,
    unitNote: "หน่วยเป็นโอห์ม (Ω)",
    hdr: [{
      key: "material",
      en: "Conductor Material",
      th: "ชนิดตัวนำ",
      type: "text",
      req: 1,
      since: 2
    }],
    cols: [{
      key: "loc",
      en: "Location",
      th: "จุดที่วัด",
      type: "text",
      req: 1,
      since: 2,
      w: 3
    }, {
      key: "ohm",
      en: "Measured",
      th: "ค่าที่วัดได้",
      unit: "Ω",
      type: "num",
      since: 2
    }, {
      key: "status",
      en: "Status",
      th: "ผลตรวจ",
      type: "select",
      opts: ["OK", "NG"],
      req: 1,
      since: 2
    }, {
      key: "note",
      en: "Comment",
      th: "หมายเหตุ",
      type: "text",
      since: 2,
      w: 2
    }],
    pass: r => String(r.status || "").toUpperCase() === "OK",
    resultCol: false,
    seed: () => [{
      loc: "Mounting Clamp PV"
    }, {
      loc: "Earth connection to PV mounting"
    }, {
      loc: "Check the condition of the DC box fuse"
    }, {
      loc: "Check the condition of connector MC4"
    }, {
      loc: "AC cable trunking to earth"
    }, {
      loc: "Check the condition of AC box"
    }, {
      loc: "Check the condition of ground box test"
    }, {
      loc: "Check the condition of ground rod"
    }]
  }]
}, {
  key: "b1",
  code: "B1",
  en: "B1. DC Insulation Test",
  th: "B1 ทดสอบฉนวนสาย DC",
  icon: "bolt",
  since: 3,
  kind: "table",
  tables: [{
    key: "main",
    en: "String Cables",
    th: "สายสตริง",
    minRows: 1,
    groupBy: "inv",
    groupTh: "อินเวอร์เตอร์ตัวที่",
    unitNote: "วัดเทียบกับดิน — ขั้วบวกลงดิน และขั้วลบลงดิน · หน่วยเป็นเมกะโอห์ม (MΩ)",
    hdr: [{
      key: "maxSysV",
      en: "Maximum System Voltage",
      th: "แรงดันระบบสูงสุด",
      unit: "VDC",
      type: "num",
      req: 1,
      since: 3,
      def: "1000"
    }, {
      key: "testV",
      en: "Applied Test Voltage",
      th: "แรงดันที่ใช้ทดสอบ",
      unit: "VDC",
      type: "num",
      req: 1,
      since: 3,
      def: "1000"
    }, {
      key: "limitM",
      en: "Acceptable Insulation Level",
      th: "เกณฑ์ผ่าน",
      unit: "MΩ",
      type: "num",
      req: 1,
      since: 3,
      def: "200"
    }],
    cols: [{
      key: "inv",
      en: "Inverter",
      th: "อินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "str",
      en: "String",
      th: "สตริง",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "insP",
      en: "Insulation (+) to Ground",
      th: "ฉนวนขั้วบวกลงดิน",
      unit: "MΩ",
      type: "num",
      req: 1,
      since: 3,
      w: 2
    }, {
      key: "insN",
      en: "Insulation (−) to Ground",
      th: "ฉนวนขั้วลบลงดิน",
      unit: "MΩ",
      type: "num",
      req: 1,
      since: 3,
      w: 2
    }],
    pass: (r, h) => {
      const num = x => parseFloat(String(x == null ? "" : x).replace(/[^\d.\-]/g, ""));
      const v = [num(r.insP), num(r.insN)].filter(x => isFinite(x));
      if (v.length < 2) return false;
      return Math.min.apply(null, v) >= (parseFloat((h || {}).limitM) || 0);
    },
    seed: (job, sum) => pmSeedStrings(job, sum)
  }]
}, {
  key: "b3",
  code: "B3",
  en: "B3. DC Polarity & Voltage",
  th: "B3 ทดสอบขั้วและแรงดัน DC",
  icon: "bolt",
  since: 3,
  kind: "table",
  tables: [{
    key: "main",
    en: "String Open-Circuit Voltage",
    th: "แรงดันเปิดวงจรของสตริง",
    minRows: 1,
    groupBy: "inv",
    groupTh: "อินเวอร์เตอร์ตัวที่",
    unitNote: "แรงดันทุกค่าเป็นโวลต์ (V)",
    hdr: [{
      key: "voc",
      en: "Module Open-Circuit Voltage",
      th: "แรงดันเปิดวงจรต่อแผง",
      unit: "V",
      type: "num",
      req: 1,
      since: 3,
      defTh: "จากสเปคแผงใน BOQ",
      def: (job, sum) => pmPanelSpec(job, sum).voc
    }, {
      key: "tempCoef",
      en: "Temperature Coefficient of Voc",
      th: "สัมประสิทธิ์อุณหภูมิของ Voc",
      unit: "%/°C",
      type: "num",
      since: 3,
      defTh: "จากสเปคแผงใน BOQ",
      def: (job, sum) => pmPanelSpec(job, sum).tcVoc
    }, {
      key: "modTemp",
      en: "Module Temperature",
      th: "อุณหภูมิแผงขณะวัด",
      unit: "°C",
      type: "num",
      since: 3
    }],
    cols: [{
      key: "inv",
      en: "Inverter",
      th: "อินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "str",
      en: "String",
      th: "สตริง",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "mods",
      en: "Modules",
      th: "จำนวนแผง",
      type: "num",
      req: 1,
      since: 3
    }, {
      key: "pol",
      en: "Polarity",
      th: "ขั้ว",
      type: "select",
      opts: ["OK", "NG"],
      req: 1,
      since: 3
    }, {
      key: "vCalc",
      en: "Calculated Voc",
      th: "แรงดันที่คำนวณได้",
      unit: "V",
      since: 3,
      w: 2,
      calc: (r, h) => {
        const v = parseFloat((h || {}).voc),
          n = parseFloat(r.mods);
        return isFinite(v) && isFinite(n) ? Math.round(v * n * 100) / 100 : "";
      }
    }, {
      key: "vMeas",
      en: "Measured Voc",
      th: "แรงดันที่วัดได้",
      unit: "V",
      type: "num",
      req: 1,
      since: 3,
      w: 2
    }, {
      key: "vDiff",
      en: "Variation",
      th: "ส่วนต่าง",
      unit: "%",
      since: 3,
      calc: (r, h) => {
        const v = parseFloat((h || {}).voc),
          n = parseFloat(r.mods),
          m = parseFloat(r.vMeas);
        const c = v * n;
        return isFinite(c) && c > 0 && isFinite(m) ? Math.round((c - m) / c * 1000) / 10 : "";
      }
    }],
    pass: r => String(r.pol || "").toUpperCase() === "OK",
    resultCol: false,
    seed: (job, sum) => pmSeedStrings(job, sum)
  }]
}, {
  key: "b4",
  code: "B4",
  en: "B4. DC Current",
  th: "B4 ทดสอบกระแส DC",
  icon: "bolt",
  since: 3,
  kind: "table",
  tables: [{
    key: "main",
    en: "String Cables",
    th: "สายสตริง",
    minRows: 1,
    groupBy: "inv",
    groupTh: "อินเวอร์เตอร์ตัวที่",
    unitNote: "กระแสทุกค่าเป็นแอมแปร์ (A) · กระแสที่วัดได้ขึ้นกับความเข้มแสงขณะวัด จึงต้องบันทึกความเข้มแสงและเวลาไว้ด้วย",
    hdr: [{
      key: "isc",
      en: "Module Short-Circuit Current",
      th: "กระแสลัดวงจรต่อแผง",
      unit: "A",
      type: "num",
      req: 1,
      since: 3,
      defTh: "จากสเปคแผงใน BOQ",
      def: (job, sum) => pmPanelSpec(job, sum).isc
    }],
    cols: [{
      key: "inv",
      en: "Inverter",
      th: "อินเวอร์เตอร์",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "str",
      en: "String",
      th: "สตริง",
      type: "text",
      req: 1,
      since: 3
    }, {
      key: "irr",
      en: "Irradiance",
      th: "ความเข้มแสง",
      unit: "W/m²",
      type: "num",
      since: 3
    }, {
      key: "iCalc",
      en: "Calculated Isc",
      th: "กระแสที่คำนวณได้",
      unit: "A",
      since: 3,
      w: 2,
      calc: (r, h) => {
        const i = parseFloat((h || {}).isc);
        if (!isFinite(i)) return "";
        const g = parseFloat(r.irr);
        return Math.round((isFinite(g) && g > 0 ? i * g / 1000 : i) * 100) / 100;
      }
    }, {
      key: "iMeas",
      en: "Measured Isc",
      th: "กระแสที่วัดได้",
      unit: "A",
      type: "num",
      req: 1,
      since: 3,
      w: 2
    }, {
      key: "at",
      en: "Time of Test",
      th: "เวลาที่วัด",
      type: "text",
      since: 3,
      w: 2
    }],
    seed: (job, sum) => pmSeedStrings(job, sum)
  }]
}, {
  key: "c1",
  code: "C1",
  en: "C1. AC Circuitry Test",
  th: "C1 ทดสอบวงจรไฟฟ้า AC",
  icon: "bolt",
  since: 2,
  kind: "table",
  tables: [{
    key: "main",
    en: "Inverter to AC DB",
    th: "จากอินเวอร์เตอร์ถึงตู้ AC",
    minRows: 1,
    unitNote: "แรงดันทุกค่าเป็นโวลต์ (V)",
    hdr: [{
      key: "lineV",
      en: "Line Voltage",
      th: "แรงดันระบบ",
      unit: "V",
      type: "num",
      req: 1,
      since: 2
    }, {
      key: "voltType",
      en: "Type of Voltage",
      th: "ระบบไฟ",
      type: "select",
      opts: ["1 phase", "3 phase"],
      req: 1,
      since: 2
    }, {
      key: "freq",
      en: "Nominal AC Frequency",
      th: "ความถี่",
      unit: "Hz",
      type: "num",
      req: 1,
      since: 2
    }, {
      key: "pf",
      en: "Power Factor",
      th: "ตัวประกอบกำลัง",
      type: "num",
      since: 2
    }],
    cols: [{
      key: "src",
      en: "Measured At",
      th: "จุดที่วัด",
      type: "text",
      req: 1,
      since: 2,
      w: 3
    }, {
      key: "rot",
      en: "Phase Rotation",
      th: "ลำดับเฟส",
      type: "select",
      opts: ["OK", "NG", "N/A"],
      since: 2
    }, {
      key: "l1l2",
      en: "L1-L2",
      th: "L1-L2",
      type: "num",
      req: 1,
      since: 2
    }, {
      key: "l2l3",
      en: "L2-L3",
      th: "L2-L3",
      type: "num",
      since: 2
    }, {
      key: "l1l3",
      en: "L1-L3",
      th: "L1-L3",
      type: "num",
      since: 2
    }, {
      key: "l1n",
      en: "L1-N",
      th: "L1-N",
      type: "num",
      since: 2
    }, {
      key: "l2n",
      en: "L2-N",
      th: "L2-N",
      type: "num",
      since: 2
    }, {
      key: "l3n",
      en: "L3-N",
      th: "L3-N",
      type: "num",
      since: 2
    }, {
      key: "npe",
      en: "N-PE",
      th: "N-PE",
      type: "num",
      since: 2
    }],
    seed: (job, sum) => {
      const n = Math.min(60, parseInt(sum.invQty, 10) || 0);
      const out = [];
      for (let i = 0; i < n; i++) out.push({
        src: "Inverter " + (i + 1) + " to AC DB " + (i + 1)
      });
      return out;
    }
  }]
}, {
  key: "c2",
  code: "C2",
  en: "C2. Ground Rod Test",
  th: "C2 ทดสอบความต้านทานหลักดิน",
  icon: "check",
  since: 2,
  kind: "table",
  tables: [{
    key: "main",
    en: "Designated Location of Measurement",
    th: "จุดที่วัด",
    minRows: 1,
    unitNote: "หน่วยเป็นโอห์ม (Ω)",
    hdr: [{
      key: "format",
      en: "Measurement Format",
      th: "รูปแบบการวัด",
      type: "select",
      opts: ["2 POLE", "3 POLE", "CLAMP"],
      req: 1,
      since: 2
    }, {
      key: "cable",
      en: "Cable Detail",
      th: "รายละเอียดสายดิน",
      type: "text",
      req: 1,
      since: 2
    }, {
      key: "rod",
      en: "Ground Rod Installation",
      th: "หลักดินที่ติดตั้ง",
      type: "text",
      req: 1,
      since: 2
    }],
    cols: [{
      key: "loc",
      en: "Location",
      th: "จุดที่วัด",
      type: "text",
      req: 1,
      since: 2,
      w: 3
    }, {
      key: "r1",
      en: "First",
      th: "ครั้งที่ 1",
      unit: "Ω",
      type: "num",
      req: 1,
      since: 2
    }, {
      key: "r2",
      en: "Second",
      th: "ครั้งที่ 2",
      unit: "Ω",
      type: "num",
      req: 1,
      since: 2
    }, {
      key: "r3",
      en: "Third",
      th: "ครั้งที่ 3",
      unit: "Ω",
      type: "num",
      req: 1,
      since: 2
    }],
    pass: r => {
      const v = [r.r1, r.r2, r.r3].map(x => parseFloat(x)).filter(x => isFinite(x));
      return v.length ? Math.max.apply(null, v) <= 5 : false;
    }
  }]
}, {
  key: "d1",
  code: "D1",
  en: "D1. Thermal Photos — Inverter",
  th: "D1 ภาพความร้อน · อินเวอร์เตอร์",
  icon: "camera",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Inverter and DC Box",
    th: "อินเวอร์เตอร์และตู้ DC",
    minRows: 1,
    pair: 1,
    unitNote: "ถ่ายช่วงที่ระบบจ่ายไฟเต็มที่ · แต่ละจุดต้องมีทั้งภาพความร้อนและภาพสีปกติของมุมเดียวกัน",
    hdr: [{
      key: "at",
      en: "Time of Photograph",
      th: "เวลาที่ถ่าย",
      type: "text",
      req: 1,
      since: 4,
      def: "12.00-14.00"
    }, {
      key: "irr",
      en: "Irradiance Level",
      th: "ความเข้มแสงขณะถ่าย",
      unit: "W/m²",
      type: "num",
      since: 4
    }],
    cols: [{
      key: "desig",
      en: "Designation",
      th: "จุดที่ถ่าย",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "tMax",
      en: "Highest Temperature Found",
      th: "อุณหภูมิสูงสุดที่พบ",
      unit: "°C",
      type: "num",
      since: 4,
      w: 2
    }, {
      key: "note",
      en: "Remark",
      th: "หมายเหตุ",
      type: "text",
      since: 4,
      w: 3
    }],
    photos: [{
      key: "thermal",
      en: "Thermal Photograph",
      th: "ภาพความร้อน"
    }, {
      key: "colour",
      en: "Full Colour Photograph",
      th: "ภาพสีปกติ"
    }],
    seed: (job, sum) => pmSeedPoints(pmInvCount(job, sum), "INVERTER # and DC BOX")
  }]
}, {
  key: "d2",
  code: "D2",
  en: "D2. Thermal Photos — AC Box / Datalogger",
  th: "D2 ภาพความร้อน · ตู้ AC และดาต้าล็อกเกอร์",
  icon: "camera",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "AC Box and Datalogger",
    th: "ตู้ AC และดาต้าล็อกเกอร์",
    minRows: 1,
    pair: 1,
    unitNote: "ถ่ายขณะระบบจ่ายไฟ · จุดที่ต้องดูคือขั้วต่อและเบรกเกอร์ในตู้",
    hdr: [{
      key: "at",
      en: "Time of Photograph",
      th: "เวลาที่ถ่าย",
      type: "text",
      req: 1,
      since: 4,
      def: "11.00-12.00"
    }, {
      key: "irr",
      en: "Irradiance Level",
      th: "ความเข้มแสงขณะถ่าย",
      unit: "W/m²",
      type: "num",
      since: 4
    }],
    cols: [{
      key: "desig",
      en: "Designation",
      th: "จุดที่ถ่าย",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "tMax",
      en: "Highest Temperature Found",
      th: "อุณหภูมิสูงสุดที่พบ",
      unit: "°C",
      type: "num",
      since: 4,
      w: 2
    }, {
      key: "note",
      en: "Remark",
      th: "หมายเหตุ",
      type: "text",
      since: 4,
      w: 3
    }],
    photos: [{
      key: "thermal",
      en: "Thermal Photograph",
      th: "ภาพความร้อน"
    }, {
      key: "colour",
      en: "Full Colour Photograph",
      th: "ภาพสีปกติ"
    }],
    seed: () => [{
      desig: "MDB Solar Cell"
    }]
  }]
}, {
  key: "d3",
  code: "D3",
  en: "D3. Thermal Photos — PV and Under PV",
  th: "D3 ภาพความร้อน · แผงและใต้แผง",
  icon: "camera",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "PV Modules and Junction Boxes",
    th: "แผงและกล่องต่อสายหลังแผง",
    pair: 1,
    unitNote: "ทำเมื่อต้องการยืนยันว่าไม่มีจุดร้อนบนแผงหรือใต้แผง · ไม่ใช่รายการบังคับของทุกงาน",
    hdr: [{
      key: "at",
      en: "Time of Photograph",
      th: "เวลาที่ถ่าย",
      type: "text",
      since: 4,
      def: "12.00-14.00"
    }, {
      key: "irr",
      en: "Irradiance Level",
      th: "ความเข้มแสงขณะถ่าย",
      unit: "W/m²",
      type: "num",
      since: 4
    }],
    cols: [{
      key: "desig",
      en: "Designation",
      th: "จุดที่ถ่าย",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "tMax",
      en: "Highest Temperature Found",
      th: "อุณหภูมิสูงสุดที่พบ",
      unit: "°C",
      type: "num",
      since: 4,
      w: 2
    }, {
      key: "note",
      en: "Remark",
      th: "หมายเหตุ",
      type: "text",
      since: 4,
      w: 3
    }],
    photos: [{
      key: "thermal",
      en: "Thermal Photograph",
      th: "ภาพความร้อน"
    }, {
      key: "colour",
      en: "Full Colour Photograph",
      th: "ภาพสีปกติ"
    }],
    seed: () => [{
      desig: "PV Check & Under"
    }]
  }]
}, {
  key: "e1",
  code: "E1",
  en: "E1. Torque — Mid and End Clamp",
  th: "E1 แรงขัน · ตัวจับกลางแผงและปลายแผง",
  icon: "wrench",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Torque Check",
    th: "ตรวจแรงขัน",
    minRows: 4,
    hdr: [{
      key: "modSpec",
      en: "PV Module Specification",
      th: "รุ่นแผงที่ติดตั้ง",
      type: "text",
      req: 1,
      since: 4,
      defTh: "จาก BOQ",
      def: (job, sum) => (sum || {}).pv1Model || ((job || {}).boq || {}).panelModel || ""
    }, {
      key: "tool",
      en: "Torque Wrench Used",
      th: "ประแจปอนด์ที่ใช้",
      type: "text",
      since: 4
    }],
    cols: [{
      key: "item",
      en: "Torque Description",
      th: "รายการที่ตรวจ",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "crit",
      en: "Criteria",
      th: "เกณฑ์",
      type: "text",
      req: 1,
      since: 4,
      w: 2
    }, {
      key: "val",
      en: "Measured",
      th: "ค่าที่วัดได้",
      type: "text",
      since: 4,
      w: 2
    }, {
      key: "res",
      en: "Result",
      th: "ผลตรวจ",
      type: "select",
      opts: ["Accepted", "Rejected"],
      req: 1,
      since: 4,
      w: 2
    }],
    pass: r => String(r.res || "").toLowerCase().indexOf("accept") === 0,
    resultCol: false,
    seed: () => [{
      item: "1. Torque at Mid Clamp",
      crit: "8-12 N-m"
    }, {
      item: "2. Torque at End Clamp",
      crit: "8-12 N-m"
    }, {
      item: "3. Mark at Mid Clamp",
      crit: "100% mark"
    }, {
      item: "4. Mark at End Clamp",
      crit: "100% mark"
    }]
  }]
}, {
  key: "e2",
  code: "E2",
  en: "E2. Torque — Cliplock and L-Feet",
  th: "E2 แรงขัน · คลิปล็อกและขาแอล",
  icon: "wrench",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Torque Check",
    th: "ตรวจแรงขัน",
    minRows: 6,
    hdr: [{
      key: "tool",
      en: "Torque Wrench Used",
      th: "ประแจปอนด์ที่ใช้",
      type: "text",
      since: 4
    }],
    cols: [{
      key: "item",
      en: "Torque Description",
      th: "รายการที่ตรวจ",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "crit",
      en: "Criteria",
      th: "เกณฑ์",
      type: "text",
      req: 1,
      since: 4,
      w: 2
    }, {
      key: "val",
      en: "Measured",
      th: "ค่าที่วัดได้",
      type: "text",
      since: 4,
      w: 2
    }, {
      key: "res",
      en: "Result",
      th: "ผลตรวจ",
      type: "select",
      opts: ["Accepted", "Rejected"],
      req: 1,
      since: 4,
      w: 2
    }],
    pass: r => String(r.res || "").toLowerCase().indexOf("accept") === 0,
    resultCol: false,
    seed: () => [{
      item: "1. Torque at Cliplock",
      crit: "14 N-m"
    }, {
      item: "2. Torque at L-Feet",
      crit: "14 N-m"
    }, {
      item: "3. Torque at Rail Splice",
      crit: "14 N-m"
    }, {
      item: "4. Torque mark at Cliplock",
      crit: "100% mark"
    }, {
      item: "5. Torque mark at L-Feet",
      crit: "100% mark"
    }, {
      item: "6. Torque mark at Rail Splice",
      crit: "100% mark"
    }]
  }]
}, {
  key: "w1",
  code: "W1",
  en: "W1. Water Cleaning Test",
  th: "W1 ทดสอบระบบล้างแผง",
  icon: "sun",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Water Pressure",
    th: "แรงดันน้ำ",
    unitNote: "แรงดันเป็นบาร์ (Bar) · ทำเฉพาะงานที่ติดตั้งระบบล้างแผง",
    hdr: [{
      key: "at",
      en: "Time of Test",
      th: "เวลาที่ทดสอบ",
      type: "text",
      since: 4
    }, {
      key: "pump",
      en: "Pump / Source",
      th: "ปั๊มหรือแหล่งน้ำ",
      type: "text",
      since: 4
    }],
    cols: [{
      key: "point",
      en: "Measured At",
      th: "จุดที่วัด",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "crit",
      en: "Criteria",
      th: "เกณฑ์",
      type: "text",
      req: 1,
      since: 4,
      w: 2
    }, {
      key: "bar",
      en: "Measured Pressure",
      th: "แรงดันที่วัดได้",
      unit: "Bar",
      type: "num",
      req: 1,
      since: 4,
      w: 2
    }],
    photos: [{
      key: "shot",
      en: "Photo of Test",
      th: "รูปขณะทดสอบ"
    }],
    pass: r => {
      const lim = parseFloat(String(r.crit == null ? "" : r.crit).replace(/[^\d.]/g, ""));
      const v = parseFloat(r.bar);
      return isFinite(v) && isFinite(lim) ? v >= lim : false;
    },
    seed: () => [{
      point: "ต้นทาง · ที่ปั๊ม",
      crit: ">4 Bar"
    }, {
      point: "ปลายทาง · หัวฉีดแถวไกลสุด",
      crit: ">4.5 Bar"
    }]
  }]
}, {
  key: "pac",
  code: "PQM",
  en: "Photo — AC Power Quality Meter",
  th: "รูปมิเตอร์คุณภาพไฟฟ้า AC",
  icon: "image",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Meter Screens",
    th: "หน้าจอมิเตอร์",
    minRows: 1,
    hdr: [{
      key: "at",
      en: "Time of Test",
      th: "เวลาที่ทดสอบ",
      type: "text",
      since: 4
    }, {
      key: "brand",
      en: "Manufacturer",
      th: "ยี่ห้อและรุ่นมิเตอร์",
      type: "text",
      req: 1,
      since: 4,
      def: "Schneider PQM"
    }],
    cols: [{
      key: "unit",
      en: "Meter / Location",
      th: "มิเตอร์ · จุดที่วัด",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }],
    photos: [{
      key: "vll",
      en: "Voltage L-L",
      th: "แรงดันระหว่างเฟส"
    }, {
      key: "vln",
      en: "Voltage L-N",
      th: "แรงดันเฟสกับนิวทรัล"
    }, {
      key: "amp",
      en: "Current",
      th: "กระแส"
    }, {
      key: "avg",
      en: "Hz / P.F. / Vavg / Iavg",
      th: "ความถี่ · เพาเวอร์แฟกเตอร์ · ค่าเฉลี่ย"
    }, {
      key: "pqs",
      en: "P / Q / S",
      th: "กำลังจริง · รีแอกทีฟ · ปรากฏ"
    }],
    seed: () => [{
      unit: "PQM A"
    }]
  }]
}, {
  key: "pgnd",
  code: "PG",
  en: "Photo — Ground Resistance Test",
  th: "รูปการทดสอบความต้านทานดิน",
  icon: "image",
  since: 4,
  kind: "table",
  tables: [{
    key: "main",
    en: "Ground Test",
    th: "การวัดความต้านทานหลักดิน",
    minRows: 1,
    unitNote: "รูปต้องเห็นทั้งหน้าปัดเครื่องวัดและจุดที่วัด · ตัวเลขที่อ่านได้บันทึกไว้ที่แผ่น C2",
    cols: [{
      key: "point",
      en: "Designation",
      th: "จุดที่วัด",
      type: "text",
      req: 1,
      since: 4,
      w: 4
    }, {
      key: "ohm",
      en: "Reading on Meter",
      th: "ค่าที่อ่านได้บนเครื่อง",
      unit: "Ω",
      type: "num",
      since: 4,
      w: 2
    }],
    photos: [{
      key: "shot",
      en: "Photo of Test",
      th: "รูปขณะทดสอบ"
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
    key: "signSite",
    en: "Signature of Site Engineer",
    th: "วิศวกรหน้างาน",
    req: 1,
    since: 1
  }, {
    key: "signProject",
    en: "Signature of Project Engineer",
    th: "วิศวกรโปรเจค",
    req: 1,
    since: 1
  }, {
    key: "owner",
    en: "Signature of Project Owner",
    th: "เจ้าของโครงการ",
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
function pmDocName(item, job) {
  if (!item || !item.dyn) return "";
  if (item.dyn === "company") return (window.BRANDING || {}).legal || "";
  if (item.dyn === "project") return job && (job.name || job.customer) || "";
  return "";
}
function pmDocLabel(item, job) {
  const nm = pmDocName(item, job);
  return {
    en: item.en + (nm ? " — " + nm : ""),
    th: item.th + (nm ? " · " + nm : "")
  };
}
const pmSetId = (rp, n) => rp.plainFirst && n === 1 ? rp.prefix : rp.prefix + n;
function pmSetCount(sum, g) {
  const rp = g.repeat;
  const s = sum || {};
  const has = n => (g.fields || []).some(f => {
    const v = s[pmSetId(rp, n) + f.key];
    return v !== null && v !== undefined && String(v).trim() !== "";
  });
  let n = parseInt(s[rp.countKey], 10);
  if (!isFinite(n) || n < 1) n = 1;
  if (n > rp.max) n = rp.max;
  for (let k = rp.max; k > n; k--) {
    if (has(k)) {
      n = k;
      break;
    }
  }
  return n;
}
function pmExpandGroup(g, n, count) {
  const rp = g.repeat;
  const id = pmSetId(rp, n);
  const lb = rp.label(n, count);
  return {
    key: g.key + n,
    en: lb.en,
    th: lb.th,
    repeatOf: g.key,
    setNo: n,
    setCount: count,
    repeat: rp,
    fields: (g.fields || []).map(f => Object.assign({}, f, {
      key: id + f.key
    }))
  };
}
function pmGroupsOf(sec, sum) {
  const gs = (sec || {}).groups || [];
  if (!gs.some(g => g.repeat)) return gs;
  const out = [];
  gs.forEach(g => {
    if (!g.repeat) {
      out.push(g);
      return;
    }
    const n = pmSetCount(sum, g);
    for (let i = 1; i <= n; i++) out.push(pmExpandGroup(g, i, n));
  });
  return out;
}
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
  put("engTester", (user || {}).name);
  put("engProject", j.eeName);
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
function pmPanelSpec(job, sum) {
  const j = job || {},
    s = sum || {},
    b = j.boq || {};
  const B = window.BOQ || null;
  const model = s.pv1Model || b.panelModel || j.panelModel || "";
  const p = B && B.findPanel && model ? B.findPanel(model) : null;
  const n = x => parseFloat(x) > 0 ? String(parseFloat(x)) : "";
  const f = x => isFinite(parseFloat(x)) && parseFloat(x) !== 0 ? String(parseFloat(x)) : "";
  return {
    voc: n(p && p.voc),
    isc: n(p && p.isc),
    wp: n(p && p.wp),
    tcVoc: f(p && p.tcVoc)
  };
}
function pmInvCount(job, sum) {
  const n = parseFloat((sum || {}).invQty) || parseFloat(((job || {}).boq || {}).invCount) || 0;
  return Math.max(1, Math.min(60, Math.round(n) || 1));
}
function pmSeedPoints(n, tpl) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push({
    desig: String(tpl).replace("#", String(i))
  });
  return out;
}
function pmSeedStrings(job, sum) {
  const j = job || {};
  const s = sum || {};
  const b = j.boq || {};
  const B = window.BOQ || null;
  const panels = Math.round(parseFloat(s.pv1Qty) || parseFloat(j.panels) || 0);
  const invCount = Math.max(1, Math.round(parseFloat(s.invQty) || parseFloat(b.invCount) || 1));
  if (!panels) return [];
  const panel = B && B.findPanel ? B.findPanel(s.pv1Model || b.panelModel || j.panelModel || "") : null;
  const inv = B && B.findInverter ? B.findInverter(s.invModel || b.inverterModel || "") : null;
  let series = Math.round(parseFloat(b.dcSeries) || 0);
  if (!series && B && B.stringConfig && panel) {
    const cfg = B.stringConfig(panel, inv || {});
    if (cfg && cfg.ready) series = cfg.series;
  }
  if (!series) return [];
  const plan = B && B.stringPlan ? B.stringPlan(panels, series, inv || {}, invCount) : null;
  if (!plan || !plan.strings) return [];
  const base = Math.floor(plan.strings / invCount);
  const extra = plan.strings - base * invCount;
  const out = [];
  let left = plan.strings;
  for (let i = 1; i <= invCount && left > 0; i++) {
    const cnt = Math.min(left, base + (i <= extra ? 1 : 0));
    for (let k = 1; k <= cnt; k++) {
      left -= 1;
      out.push({
        inv: String(i),
        str: String(k),
        mods: String(left === 0 && plan.rest > 0 ? plan.rest : series)
      });
    }
  }
  return out;
}
function pmIsPrefilled(rec, key) {
  const saved = (rec || {}).sum || {};
  return !(saved[key] !== null && saved[key] !== undefined && String(saved[key]) !== "");
}
const pmRowId = () => "R-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pmTableOf = (rec, secKey, tbKey) => (((rec || {}).tests || {})[secKey] || {})[tbKey] || {};
function pmRowsOf(rec, secKey, tbKey) {
  const rows = pmTableOf(rec, secKey, tbKey).rows;
  if (!rows || typeof rows !== "object") return [];
  return Object.keys(rows).map(id => Object.assign({}, rows[id], {
    id: id
  })).sort((a, b) => (+a.ord || 0) - (+b.ord || 0) || String(a.id).localeCompare(String(b.id)));
}
const pmNextOrd = rows => rows.length ? (+rows[rows.length - 1].ord || 0) + 10 : 10;
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
      pmGroupsOf(sec, sum).forEach(g => (g.fields || []).forEach(f => {
        if (!pmActive(f, ver)) return;
        tick(filled(sum[f.key]), f.key, f.en, f.th);
      }));
    } else if (sec.kind === "checklist") {
      const v = r.docs || {};
      sec.groups.forEach(g => (g.items || []).forEach(it => {
        if (!pmActive(it, ver)) return;
        const lb = pmDocLabel(it, job);
        tick(v[it.key] === "y" || v[it.key] === "n", it.key, lb.en, lb.th);
      }));
    } else if (sec.kind === "sign") {
      const v = r.sign || {};
      (sec.blocks || []).forEach(b => {
        if (!pmActive(b, ver)) return;
        tick(filled((v[b.key] || {}).name), b.key, b.en, b.th);
      });
    } else if (sec.kind === "table") {
      (sec.tables || []).forEach(tb => {
        const t = pmTableOf(r, sec.key, tb.key);
        const hdr = t.hdr || {};
        const rows = pmRowsOf(r, sec.key, tb.key);
        const nm = (x, i) => ({
          en: tb.en + " · " + x.en + (i === undefined ? "" : " #" + (i + 1)),
          th: tb.th + " · " + x.th + (i === undefined ? "" : " แถวที่ " + (i + 1))
        });
        (tb.hdr || []).forEach(h => {
          if (!pmActive(h, ver)) return;
          const lb = nm(h);
          tick(filled(hdr[h.key]), sec.key + "." + tb.key + "." + h.key, lb.en, lb.th);
        });
        rows.forEach((row, i) => {
          (tb.cols || []).forEach(c => {
            if (!pmActive(c, ver)) return;
            const lb = nm(c, i);
            tick(filled(row[c.key]), sec.key + "." + tb.key + "." + row.id + "." + c.key, lb.en, lb.th);
          });
          (tb.photos || []).forEach(sl => {
            const slot = pmSlotOf(sl);
            const nmRow = String(row[(tb.cols || [])[0] ? tb.cols[0].key : ""] || "").trim() || "แถวที่ " + (i + 1);
            tick(+flags[pmFlagKey(sec.key, row.id, slot.key)] > 0, sec.key + "." + tb.key + "." + row.id + "." + slot.key, tb.en + " — " + slot.en + " #" + (i + 1), tb.th + " · " + slot.th + " · " + nmRow);
          });
        });
        if (tb.minRows && rows.length < tb.minRows) {
          tick(false, sec.key + "." + tb.key + ".rows", "Rows in " + tb.en, "ยังไม่ได้เพิ่มแถวใน " + tb.th);
        }
      });
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
function pmNewerItems(rec, job, user) {
  const ver = pmVerOf(rec);
  if (ver >= PM_VER) return 0;
  const now = pmProgress(rec, job, user).total;
  const bumped = Object.assign({}, rec, {
    meta: Object.assign({}, (rec || {}).meta, {
      ver: PM_VER
    })
  });
  return Math.max(0, pmProgress(bumped, job, user).total - now);
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
function pmSlotLabel(secKey, slot) {
  const sec = PM_SEC_BY[secKey || ""];
  const tabs = sec && sec.kind === "table" ? sec.tables || [] : [];
  const tb = tabs.find(x => x.key === String(slot || ""));
  if (tb) {
    return {
      en: (tb.code ? tb.code + ". " : sec.code ? sec.code + ". " : "") + tb.en,
      th: sec.th + " · " + tb.th
    };
  }
  for (let i = 0; i < tabs.length; i++) {
    const sl = (tabs[i].photos || []).map(pmSlotOf).find(x => x.key === String(slot || ""));
    if (sl) {
      return {
        en: (tabs[i].code ? tabs[i].code + ". " : sec.code ? sec.code + ". " : "") + tabs[i].en + " — " + sl.en,
        th: sec.th + " · " + sl.th
      };
    }
  }
  return {
    en: "Photo Report",
    th: "รูปประกอบการส่งมอบ"
  };
}
const pmSlotOf = x => typeof x === "string" ? {
  key: x,
  en: x,
  th: x
} : x || {
  key: "",
  en: "",
  th: ""
};
const pmSlotName = (secKey, tbKey, slotKey) => {
  const sec = PM_SEC_BY[secKey || ""];
  const tb = sec && sec.kind === "table" ? (sec.tables || []).find(x => x.key === tbKey) : null;
  return (tb ? (tb.photos || []).map(pmSlotOf).find(x => x.key === slotKey) : null) || {
    key: slotKey,
    en: slotKey,
    th: slotKey
  };
};
const pmPhotosOf = (list, secKey, slot) => (list || []).filter(x => (x.sec || "gen") === secKey && String(x.slot || "") === String(slot || "") && !x.rowId);
const pmPhotosAt = (list, secKey, rowId, slot) => (list || []).filter(x => (x.sec || "gen") === secKey && String(x.rowId || "") === String(rowId || "") && String(x.slot || "") === String(slot || ""));
function pmPhotoOrder(list, rec) {
  const tRank = {};
  const sRank = {};
  let n = 0;
  PM_SECTIONS.forEach(sec => {
    if (sec.kind !== "table") return;
    (sec.tables || []).forEach(tb => {
      n += 1;
      tRank[sec.key + "." + tb.key] = n;
      sRank[sec.key + "." + tb.key] = 0;
      (tb.photos || []).forEach((sl, k) => {
        const key = sec.key + "." + pmSlotOf(sl).key;
        tRank[key] = n;
        sRank[key] = k + 1;
      });
    });
  });
  const rowOrd = {};
  if (rec) {
    PM_SECTIONS.forEach(sec => {
      if (sec.kind !== "table") return;
      (sec.tables || []).forEach(tb => {
        pmRowsOf(rec, sec.key, tb.key).forEach((row, i) => {
          rowOrd[sec.key + "." + row.id] = i + 1;
        });
      });
    });
  }
  const k = x => (x.sec || "gen") + "." + (x.slot || "");
  return (list || []).slice().sort((a, b) => (tRank[k(a)] || 9e9) - (tRank[k(b)] || 9e9) || (rowOrd[(a.sec || "gen") + "." + (a.rowId || "")] || 0) - (rowOrd[(b.sec || "gen") + "." + (b.rowId || "")] || 0) || (sRank[k(a)] || 0) - (sRank[k(b)] || 0) || String(a.at || "").localeCompare(String(b.at || "")));
}
const PM_FLAG_SEP = "~";
const pmFlagKey = (sec, rowId, slot) => [sec || "gen", rowId || "", slot || ""].filter(Boolean).join(PM_FLAG_SEP);
function pmPhotoFlags(idx) {
  const out = {};
  (idx || []).forEach(p => {
    const k = pmFlagKey(p.sec, p.rowId, p.slot);
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
  pmDocName,
  pmDocLabel,
  pmSetId,
  pmSetCount,
  pmGroupsOf,
  pmRowId,
  pmTableOf,
  pmRowsOf,
  pmNextOrd,
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
  pmSlotLabel,
  pmPhotosOf,
  pmPhotoOrder,
  pmFlagKey,
  pmSeedStrings,
  pmPanelSpec,
  pmInvCount,
  pmSeedPoints,
  pmPhotosAt,
  pmSlotName,
  pmSlotOf,
  usePmHandover,
  usePmPhotoIdx,
  usePmPhotos
});