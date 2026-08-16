function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PERMIT_TYPES = [{
  key: "self",
  th: "ใช้เอง ไม่ขายไฟ",
  sub: "Zero Export — มีอุปกรณ์กันไฟไหลย้อน"
}, {
  key: "public",
  th: "โซลาร์ภาคประชาชน",
  sub: "ขายไฟส่วนเกินคืนการไฟฟ้า"
}, {
  key: "biz",
  th: "โรงงาน / อาคารธุรกิจ",
  sub: "ระบบใหญ่ · มีหม้อแปลงของตัวเอง"
}];
const PERMIT_AUTHS = [{
  value: "PEA",
  label: "กฟภ. (PEA)"
}, {
  value: "MEA",
  label: "กฟน. (MEA)"
}];
const PERMIT_PHASES = [{
  value: "1",
  label: "1 เฟส"
}, {
  value: "3",
  label: "3 เฟส"
}];
const PERMIT_YESNO = [{
  value: "yes",
  label: "มี"
}, {
  value: "no",
  label: "ไม่มี"
}];
const PERMIT_PHOTO_SLOTS = [{
  key: "meter",
  group: "จุดรับไฟ",
  label: "มิเตอร์ไฟฟ้า",
  hint: "ต้องอ่านหมายเลขมิเตอร์และขนาด เช่น 15(45) ออก",
  req: true
}, {
  key: "house",
  group: "จุดรับไฟ",
  label: "หน้าบ้าน / อาคาร",
  hint: "ให้เห็นบ้านเลขที่ชัดเจน",
  req: true
}, {
  key: "pole",
  group: "จุดรับไฟ",
  label: "เสาไฟ / หม้อแปลงต้นที่รับไฟ",
  hint: "ให้เห็นหมายเลขเสาบนป้าย",
  req: true
}, {
  key: "mdbClosed",
  group: "ตู้ไฟ",
  label: "ตู้ MDB ปิดฝา",
  hint: "มุมกว้างให้เห็นตำแหน่งที่ติดตั้ง",
  req: true
}, {
  key: "mdbOpen",
  group: "ตู้ไฟ",
  label: "ตู้ MDB เปิดฝา",
  hint: "ให้เห็นเมนเบรกเกอร์และขนาดที่พิมพ์ไว้",
  req: true
}, {
  key: "acBreaker",
  group: "ตู้ไฟ",
  label: "เบรกเกอร์ AC ของโซลาร์",
  hint: "ตัวที่เพิ่มเข้าไปใหม่ ให้เห็นขนาด",
  req: true
}, {
  key: "acWiring",
  group: "ตู้ไฟ",
  label: "จุดเข้าสาย AC ในตู้",
  hint: "ให้เห็นการเข้าสายและการขันแน่น"
}, {
  key: "ct",
  group: "ตู้ไฟ",
  label: "CT คล้องสายเมน",
  hint: "จุดที่คล้อง CT ของระบบกันไฟไหลย้อน",
  when: f => f.zeroExport === "yes",
  req: true
}, {
  key: "inverter",
  group: "อินเวอร์เตอร์",
  label: "อินเวอร์เตอร์ติดตั้งเสร็จ",
  hint: "มุมกว้างเห็นตำแหน่งที่ยึดผนัง",
  req: true
}, {
  key: "invPlate",
  group: "อินเวอร์เตอร์",
  label: "เนมเพลทอินเวอร์เตอร์",
  hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออกทุกตัว — ตีกลับบ่อยที่สุด",
  req: true
}, {
  key: "dcIso",
  group: "อินเวอร์เตอร์",
  label: "DC Isolator / ตู้ DC",
  hint: "ถ้ามีติดตั้ง"
}, {
  key: "arrayWide",
  group: "แผงโซลาร์",
  label: "แผงบนหลังคา มุมรวม",
  hint: "ให้เห็นทั้งอาร์เรย์ในรูปเดียว",
  req: true
}, {
  key: "arrayClose",
  group: "แผงโซลาร์",
  label: "แผงมุมใกล้",
  hint: "ให้เห็นรางและตัวยึดจับแผง"
}, {
  key: "panelPlate",
  group: "แผงโซลาร์",
  label: "สติกเกอร์หลังแผง",
  hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออก — ตีกลับบ่อย",
  req: true
}, {
  key: "ground",
  group: "ความปลอดภัย",
  label: "หลักดิน + จุดต่อสายดิน",
  hint: "ให้เห็นหลักดินและสายที่ต่อเข้าจริง",
  req: true
}, {
  key: "warnSign",
  group: "ความปลอดภัย",
  label: "ป้ายเตือนที่ติดหน้าตู้",
  hint: "ป้าย “มีระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์”",
  req: true
}];
const PERMIT_SLOT_BY = Object.fromEntries(PERMIT_PHOTO_SLOTS.map(s => [s.key, s]));
const PERMIT_PHOTO_GROUPS = PERMIT_PHOTO_SLOTS.reduce((a, s) => a.indexOf(s.group) === -1 ? a.concat([s.group]) : a, []);
const AS = {
  l: "var(--text-2)",
  hi: "var(--primary)",
  fill: "var(--surface3)",
  paper: "var(--surface)"
};
const PERMIT_SAMPLE_ART = {
  meter: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "30",
    y: "10",
    width: "60",
    height: "70",
    rx: "7",
    fill: AS.fill
  }), React.createElement("rect", {
    x: "38",
    y: "20",
    width: "44",
    height: "17",
    rx: "3",
    fill: AS.paper,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M44 28.5h32",
    stroke: AS.hi,
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: "60",
    cy: "55",
    r: "11"
  }), React.createElement("path", {
    d: "M60 55l6-5",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M36 72h20",
    strokeWidth: "2.5",
    stroke: AS.hi,
    strokeLinecap: "round"
  })),
  house: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M18 44L60 16l42 28",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: "M28 42v34h64V42",
    strokeLinejoin: "round",
    fill: AS.fill
  }), React.createElement("rect", {
    x: "52",
    y: "56",
    width: "18",
    height: "20",
    fill: AS.paper
  }), React.createElement("rect", {
    x: "34",
    y: "50",
    width: "12",
    height: "10",
    fill: AS.paper
  }), React.createElement("rect", {
    x: "74",
    y: "46",
    width: "16",
    height: "9",
    rx: "2",
    fill: AS.paper,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M77 50.5h10",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  })),
  pole: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M58 12v66M36 22h44M42 32h36",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: "42",
    cy: "19",
    r: "3"
  }), React.createElement("circle", {
    cx: "74",
    cy: "19",
    r: "3"
  }), React.createElement("rect", {
    x: "64",
    y: "42",
    width: "20",
    height: "12",
    rx: "2",
    fill: AS.paper,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M68 48h12",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M30 78h60",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  })),
  mdbClosed: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M14 78h92",
    strokeLinecap: "round"
  }), React.createElement("rect", {
    x: "34",
    y: "14",
    width: "52",
    height: "58",
    rx: "4",
    fill: AS.fill,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M76 40v10",
    strokeLinecap: "round",
    strokeWidth: "3"
  }), React.createElement("path", {
    d: "M34 14v58",
    strokeDasharray: "4 4"
  }), React.createElement("path", {
    d: "M22 30v42M98 30v42",
    strokeWidth: "1.5",
    strokeDasharray: "3 5"
  })),
  mdbOpen: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "30",
    y: "12",
    width: "58",
    height: "64",
    rx: "4",
    fill: AS.fill
  }), React.createElement("path", {
    d: "M30 12L10 22v44l20 10",
    strokeLinejoin: "round"
  }), React.createElement("rect", {
    x: "40",
    y: "22",
    width: "38",
    height: "16",
    rx: "2",
    fill: AS.paper,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M46 30h10M62 26v8",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M40 48h38M40 58h38M40 68h38",
    strokeLinecap: "round"
  })),
  acBreaker: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "24",
    y: "18",
    width: "72",
    height: "54",
    rx: "4",
    fill: AS.fill
  }), React.createElement("rect", {
    x: "34",
    y: "26",
    width: "24",
    height: "38",
    rx: "3",
    fill: AS.paper,
    stroke: AS.hi
  }), React.createElement("rect", {
    x: "40",
    y: "32",
    width: "12",
    height: "12",
    rx: "2",
    fill: AS.hi,
    stroke: "none"
  }), React.createElement("path", {
    d: "M38 54h16",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), React.createElement("rect", {
    x: "66",
    y: "26",
    width: "20",
    height: "38",
    rx: "3"
  })),
  acWiring: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "20",
    y: "20",
    width: "80",
    height: "50",
    rx: "4",
    fill: AS.fill
  }), React.createElement("rect", {
    x: "30",
    y: "34",
    width: "60",
    height: "16",
    rx: "2",
    fill: AS.paper
  }), React.createElement("path", {
    d: "M40 34v16M56 34v16M72 34v16"
  }), React.createElement("path", {
    d: "M40 34C40 22 30 20 26 14M56 34c0-12 8-16 12-22M72 34c0-12 10-14 16-20",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round"
  })),
  ct: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M10 45h100",
    strokeWidth: "7",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: "60",
    cy: "45",
    r: "20",
    stroke: AS.hi,
    strokeWidth: "4"
  }), React.createElement("path", {
    d: "M60 25v-12",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M74 59l14 14",
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinecap: "round"
  })),
  inverter: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M12 8v76",
    strokeDasharray: "5 5",
    strokeWidth: "1.5"
  }), React.createElement("rect", {
    x: "34",
    y: "16",
    width: "52",
    height: "46",
    rx: "6",
    fill: AS.fill,
    stroke: AS.hi
  }), React.createElement("rect", {
    x: "44",
    y: "26",
    width: "32",
    height: "12",
    rx: "2",
    fill: AS.paper
  }), React.createElement("path", {
    d: "M46 48h10M64 48h10",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M46 62v14M74 62v14",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M12 20h22M12 40h22",
    strokeWidth: "1.5"
  })),
  invPlate: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "16",
    y: "16",
    width: "88",
    height: "58",
    rx: "5",
    fill: AS.paper,
    stroke: AS.hi,
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M26 30h44M26 40h58M26 50h34",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round"
  }), React.createElement("g", {
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M26 60v8M31 60v8M35 60v8M40 60v8M44 60v8M49 60v8M53 60v8M58 60v8"
  }))),
  dcIso: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "34",
    y: "16",
    width: "52",
    height: "58",
    rx: "6",
    fill: AS.fill
  }), React.createElement("circle", {
    cx: "60",
    cy: "42",
    r: "13",
    fill: AS.paper,
    stroke: AS.hi,
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M60 42l8-8",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M50 64h20",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M46 16V8M74 16V8",
    strokeLinecap: "round"
  })),
  arrayWide: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M8 74h104",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M16 74L34 34h58l16 40",
    strokeLinejoin: "round",
    fill: AS.fill
  }), React.createElement("g", {
    stroke: AS.hi,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M34 42h60M31 54h68M28 66h74"
  }), React.createElement("path", {
    d: "M46 42v24M64 42v24M82 42v24"
  }))),
  arrayClose: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "14",
    y: "18",
    width: "42",
    height: "54",
    rx: "3",
    fill: AS.fill,
    stroke: AS.hi
  }), React.createElement("rect", {
    x: "64",
    y: "18",
    width: "42",
    height: "54",
    rx: "3",
    fill: AS.fill,
    stroke: AS.hi
  }), React.createElement("path", {
    d: "M14 36h42M14 54h42M64 36h42M64 54h42M35 18v54M85 18v54",
    strokeWidth: "1.5"
  }), React.createElement("rect", {
    x: "54",
    y: "38",
    width: "12",
    height: "14",
    rx: "2",
    fill: AS.paper,
    stroke: AS.l,
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M8 78h104",
    strokeWidth: "4",
    strokeLinecap: "round"
  })),
  panelPlate: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "10",
    y: "10",
    width: "100",
    height: "70",
    rx: "4",
    fill: AS.fill,
    strokeDasharray: "5 4"
  }), React.createElement("rect", {
    x: "26",
    y: "26",
    width: "68",
    height: "38",
    rx: "3",
    fill: AS.paper,
    stroke: AS.hi,
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M34 36h40",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round"
  }), React.createElement("g", {
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M34 46v12M38 46v12M43 46v12M47 46v12M52 46v12M56 46v12M61 46v12M65 46v12"
  })), React.createElement("path", {
    d: "M72 52h14",
    strokeLinecap: "round"
  })),
  ground: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M8 46h104",
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M14 54l8-8M30 54l8-8M46 54l8-8M78 54l8-8M94 54l8-8",
    strokeWidth: "1.5"
  }), React.createElement("path", {
    d: "M60 46v28",
    stroke: AS.l,
    strokeWidth: "5",
    strokeLinecap: "round"
  }), React.createElement("rect", {
    x: "50",
    y: "32",
    width: "20",
    height: "12",
    rx: "3",
    fill: AS.paper,
    stroke: AS.hi,
    strokeWidth: "2.5"
  }), React.createElement("path", {
    d: "M60 32V16h24",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })),
  warnSign: () => React.createElement("g", {
    fill: "none",
    stroke: AS.l,
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "18",
    y: "14",
    width: "84",
    height: "58",
    rx: "5",
    fill: AS.fill
  }), React.createElement("path", {
    d: "M40 26h44M40 58h44",
    strokeWidth: "1.5"
  }), React.createElement("path", {
    d: "M60 30l16 26H44z",
    fill: AS.paper,
    stroke: AS.hi,
    strokeWidth: "2.5",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: "M60 38v8M60 50v.5",
    stroke: AS.hi,
    strokeWidth: "3",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M18 72h84",
    strokeDasharray: "4 4",
    strokeWidth: "1.5"
  }))
};
const PERMIT_SAMPLE_TIPS = {
  meter: ["ยืนห่างประมาณ 1 เมตร ให้เห็นทั้งตัวมิเตอร์", "หมายเลขมิเตอร์และขนาด เช่น 15(45) ต้องอ่านออก", "อย่าถ่ายย้อนแสงจนหน้าปัดสะท้อน"],
  house: ["ให้เห็นบ้านเลขที่ในรูปเดียวกับตัวบ้าน", "ถ่ายจากหน้าบ้าน เห็นรั้ว/ทางเข้า"],
  pole: ["ถ่ายให้เห็นป้ายหมายเลขเสาชัด ๆ", "ถ้าเป็นหม้อแปลง ให้ติดตัวหม้อแปลงมาด้วย"],
  mdbClosed: ["มุมกว้าง เห็นว่าตู้ติดตั้งอยู่ตรงไหนของอาคาร"],
  mdbOpen: ["เปิดฝาให้เห็นเมนเบรกเกอร์เต็มตัว", "ขนาดที่พิมพ์บนเบรกเกอร์ต้องอ่านออก"],
  acBreaker: ["เจาะเฉพาะเบรกเกอร์ AC ที่เพิ่มใหม่", "ต้องเห็นตัวเลขขนาด เช่น 32A"],
  acWiring: ["ให้เห็นปลายสายเข้าเทอร์มินอลและการขันแน่น", "สายต้องเข้าเป็นระเบียบ ไม่มีเปลือกฉีก"],
  ct: ["ให้เห็นว่า CT คล้องอยู่บนสายเมนเส้นไหน", "ติดทิศทางลูกศรบน CT มาด้วยถ้ามี"],
  inverter: ["มุมกว้าง เห็นตัวเครื่องยึดกับผนังและท่อร้อยสาย", "ถ่ายให้เห็นระยะห่างจากผนัง/หลังคา"],
  invPlate: ["ถ่ายใกล้จนอ่านรุ่นและ Serial ออกทุกตัวอักษร", "มีหลายเครื่องให้ถ่ายทีละเครื่อง", "ใช้มือบังแดดถ้าสติกเกอร์สะท้อน"],
  dcIso: ["ให้เห็นสวิตช์และตำแหน่งที่ติดตั้ง", "ไม่มีติดตั้งก็ข้ามได้"],
  arrayWide: ["ยืนถอยห่างให้เห็นแผงทั้งชุดในรูปเดียว", "เห็นแนวหลังคาและทิศที่วางแผง"],
  arrayClose: ["ให้เห็นรางอะลูมิเนียมและคลิปจับแผง", "เห็นช่องว่างระหว่างแผงกับหลังคา"],
  panelPlate: ["พลิกดูสติกเกอร์หลังแผง ถ่ายใกล้", "รุ่นและ Serial ต้องอ่านออกทุกตัว", "เก็บอย่างน้อย 1–2 แผ่นเป็นตัวอย่าง"],
  ground: ["เห็นหลักดินตอกลงดินและแคลมป์จุดต่อ", "เห็นสายดินวิ่งออกจากแคลมป์ไปตู้"],
  warnSign: ["ถ่ายป้ายที่ติดจริงบนหน้าตู้ ไม่ใช่ป้ายที่ยังไม่ได้ติด", "ตัวหนังสือบนป้ายต้องอ่านออก"]
};
function PermitSampleArt({
  slotKey,
  size,
  radius
}) {
  const draw = PERMIT_SAMPLE_ART[slotKey];
  return React.createElement("svg", {
    viewBox: "0 0 120 90",
    width: size,
    height: Math.round(size * 90 / 120),
    style: {
      display: "block",
      borderRadius: radius == null ? 10 : radius,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, draw ? draw() : React.createElement("text", {
    x: "60",
    y: "50",
    textAnchor: "middle",
    fontSize: "12",
    fill: "var(--text-3)"
  }, "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07"));
}
function PermitSampleModal({
  slot,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const tips = PERMIT_SAMPLE_TIPS[slot.key] || [];
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 2400,
      background: "rgba(8,15,12,.55)",
      display: "grid",
      placeItems: "center",
      padding: 16
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "min(420px, 100%)",
      background: "var(--surface)",
      borderRadius: 18,
      border: "1px solid var(--border)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 15px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 16,
    color: "var(--primary)"
  }), React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u2014 ", slot.label), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 28,
      height: 28,
      borderRadius: 8,
      border: "none",
      background: "var(--surface3)",
      color: "var(--text-2)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14
  }))), React.createElement("div", {
    style: {
      padding: 15,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(PermitSampleArt, {
    slotKey: slot.key,
    size: 320,
    radius: 14
  })), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center",
      marginTop: -4
    }
  }, "\u0E20\u0E32\u0E1E\u0E08\u0E33\u0E25\u0E2D\u0E07 \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27\u0E04\u0E37\u0E2D\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E2D\u0E01\u0E43\u0E19\u0E23\u0E39\u0E1B\u0E08\u0E23\u0E34\u0E07"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, tips.map((t, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, React.createElement("span", {
    style: {
      color: "var(--primary)",
      fontWeight: 800
    }
  }, "\u2022"), React.createElement("span", null, t)))))));
}
const PERMIT_STEPS = [{
  n: 1,
  icon: "file",
  th: "ประเภท & จุดรับไฟ"
}, {
  n: 2,
  icon: "bolt",
  th: "ระบบไฟเดิม"
}, {
  n: 3,
  icon: "panel",
  th: "ระบบใหม่ & อุปกรณ์"
}, {
  n: 4,
  icon: "image",
  th: "รูปถ่าย"
}, {
  n: 5,
  icon: "check",
  th: "ตรวจสอบ & ส่งต่อ"
}];
const PERMIT_STATUS = {
  draft: {
    th: "ช่างกำลังเก็บข้อมูล",
    color: "#94A3B8"
  },
  sent: {
    th: "รอฝ่ายขออนุญาตรับ",
    color: "#F59E0B"
  },
  filing: {
    th: "กำลังยื่นการไฟฟ้า",
    color: "#3B82F6"
  },
  approved: {
    th: "การไฟฟ้าอนุมัติแล้ว",
    color: "#10B981"
  },
  rejected: {
    th: "ตีกลับ ต้องแก้ไข",
    color: "#EF4444"
  }
};
function permitFromSurvey(job) {
  const s = job && job.survey || null;
  const out = {};
  if (!s) return out;
  const put = (k, v) => {
    const t = String(v == null ? "" : v).trim();
    if (t) out[k] = t;
  };
  put("auth", s.meterAuth);
  put("ca", s.ca);
  put("meterNo", s.meterNo);
  put("meterSize", s.meterSize);
  put("poleNo", s.poleNo);
  put("branch", s.branch);
  if (PERMIT_TYPES.some(t => t.key === s.permitType)) out.permitType = s.permitType;
  const at = String(s.mainBreaker || "").match(/\d+/);
  if (at) out.mainAT = at[0];
  put("mainCable", s.mainCable);
  put("mdbBrand", s.mdbBrand);
  put("rccb", s.mdbRccb);
  put("kwp", s.sizeKw);
  put("panelModel", s.panelModel);
  put("invModel", s.invModel);
  if (s.phase) out.phase = String(s.phase) === "3" ? "3" : "1";
  if (s.gps && s.gps.lat) out.gps = s.gps;
  return out;
}
const PERMIT_SURVEY_LABELS = {
  auth: "การไฟฟ้า",
  ca: "เลข CA",
  meterNo: "เลขมิเตอร์",
  meterSize: "ขนาดมิเตอร์",
  poleNo: "เลขเสาไฟ",
  permitType: "แบบที่ยื่น",
  branch: "การไฟฟ้าสาขา",
  phase: "เฟส",
  mainAT: "เมนเบรกเกอร์",
  mainCable: "สายเมน",
  mdbBrand: "ยี่ห้อตู้ MDB",
  rccb: "เมนกันดูด",
  kwp: "ขนาดติดตั้ง",
  panelModel: "รุ่นแผง",
  invModel: "รุ่นอินเวอร์เตอร์",
  gps: "พิกัด GPS"
};
function blankPermit(job) {
  const seed = permitFromSurvey(job);
  const base = {
    status: "draft",
    permitType: "",
    auth: "",
    ca: "",
    meterNo: "",
    meterSize: "",
    branch: "",
    poleNo: "",
    phase: String(job && job.phase || "1") === "3" ? "3" : "1",
    mainAT: "",
    mainAF: "",
    mainCable: "",
    mdbBrand: "",
    rccb: "",
    kwp: job && job.kw ? String(job.kw) : "",
    kwac: "",
    acBreaker: "",
    dcIsolator: "",
    zeroExport: "",
    eldModel: "",
    invs: [{
      model: job && job.brand || "",
      sn: ""
    }],
    panelModel: "",
    panelWatt: "",
    panelQty: "",
    panelSns: ["", ""],
    trafoKva: "",
    trafoVolt: "",
    gps: null,
    doneDate: "",
    byName: "",
    note: ""
  };
  Object.keys(seed).forEach(k => {
    if (k !== "invModel") base[k] = seed[k];
  });
  if (seed.invModel) base.invs = [{
    model: seed.invModel,
    sn: ""
  }];
  return base;
}
function permitInitial(job) {
  const base = blankPermit(job);
  const cur = job && job.permit || {};
  Object.keys(cur).forEach(k => {
    const v = cur[k];
    if (v == null || v === "") return;
    if (Array.isArray(v) && !v.some(x => x && typeof x === "object" ? x.model || x.sn : String(x || "").trim())) return;
    base[k] = v;
  });
  return base;
}
function permitRequiredFields(f) {
  const req = [{
    key: "permitType",
    th: "ประเภทการขออนุญาต",
    step: 1
  }, {
    key: "auth",
    th: "การไฟฟ้าที่ยื่น",
    step: 1
  }, {
    key: "ca",
    th: "หมายเลขผู้ใช้ไฟฟ้า (CA)",
    step: 1
  }, {
    key: "meterNo",
    th: "หมายเลขมิเตอร์",
    step: 1
  }, {
    key: "meterSize",
    th: "ขนาดมิเตอร์",
    step: 1
  }, {
    key: "poleNo",
    th: "หมายเลขเสาไฟ",
    step: 1
  }, {
    key: "mainAT",
    th: "ขนาดเมนเบรกเกอร์ (AT)",
    step: 2
  }, {
    key: "mainCable",
    th: "ขนาดสายเมน",
    step: 2
  }, {
    key: "kwp",
    th: "ขนาดติดตั้ง kWp",
    step: 3
  }, {
    key: "acBreaker",
    th: "เบรกเกอร์ AC ของโซลาร์",
    step: 3
  }, {
    key: "zeroExport",
    th: "มีระบบกันไฟไหลย้อนไหม",
    step: 3
  }, {
    key: "panelModel",
    th: "รุ่นแผง",
    step: 3
  }, {
    key: "panelQty",
    th: "จำนวนแผง",
    step: 3
  }, {
    key: "doneDate",
    th: "วันที่ติดตั้งเสร็จ",
    step: 3
  }];
  if (f.permitType === "biz") req.push({
    key: "trafoKva",
    th: "ขนาดหม้อแปลง (kVA)",
    step: 2
  });
  return req;
}
function permitMissing(f, photos) {
  const out = [];
  permitRequiredFields(f).forEach(r => {
    if (!String(f[r.key] || "").trim()) out.push({
      kind: "field",
      th: r.th,
      step: r.step
    });
  });
  (f.invs || []).forEach((iv, i) => {
    if (!String(iv.model || "").trim()) out.push({
      kind: "field",
      th: "รุ่นอินเวอร์เตอร์ตัวที่ " + (i + 1),
      step: 3
    });
    if (!String(iv.sn || "").trim()) out.push({
      kind: "field",
      th: "Serial อินเวอร์เตอร์ตัวที่ " + (i + 1),
      step: 3
    });
  });
  if (!(f.panelSns || []).some(s => String(s || "").trim())) out.push({
    kind: "field",
    th: "Serial แผง (อย่างน้อย 1 แผ่น)",
    step: 3
  });
  PERMIT_PHOTO_SLOTS.forEach(s => {
    if (s.when && !s.when(f)) return;
    if (!s.req) return;
    const p = photos && photos[s.key];
    if (!p || !p.dataUrl) out.push({
      kind: "photo",
      th: "รูป: " + s.label,
      step: 4
    });
  });
  return out;
}
function permitTotalItems(f) {
  let n = permitRequiredFields(f).length + 1;
  n += (f.invs || []).length * 2;
  PERMIT_PHOTO_SLOTS.forEach(s => {
    if (s.req && (!s.when || s.when(f))) n++;
  });
  return n;
}
function permitProgress(f, photos) {
  if (!f) return {
    pct: 0,
    missing: [],
    done: 0,
    total: 1
  };
  const total = permitTotalItems(f);
  const missing = permitMissing(f, photos);
  const done = Math.max(0, total - missing.length);
  return {
    pct: Math.round(done / total * 100),
    missing,
    done,
    total
  };
}
function permitStatusOf(job) {
  const p = job && job.permit;
  if (!p || !p.status) return null;
  return Object.assign({
    key: p.status
  }, PERMIT_STATUS[p.status] || PERMIT_STATUS.draft);
}
const PERMIT_DOC_SLOTS = [{
  key: "idCard",
  label: "สำเนาบัตร ปชช. + ทะเบียนบ้าน",
  hint: "ของเจ้าของมิเตอร์ · รับรองสำเนาถูกต้อง",
  req: true
}, {
  key: "bill",
  label: "สำเนาใบแจ้งค่าไฟล่าสุด",
  hint: "ใช้ยืนยันเลข CA และชื่อผู้ใช้ไฟ",
  req: true
}, {
  key: "poa",
  label: "หนังสือมอบอำนาจ + บัตรผู้รับมอบ",
  hint: "กรณีบริษัทยื่นแทนลูกค้า",
  req: true
}, {
  key: "sld",
  label: "Single Line Diagram ลงนาม",
  hint: "วิศวกรไฟฟ้าเซ็น + แนบสำเนาใบ กว.",
  req: true
}, {
  key: "roofCert",
  label: "หนังสือรับรองโครงสร้างหลังคา",
  hint: "วิศวกรโยธาเซ็นรับรองความมั่นคงแข็งแรง",
  req: true
}, {
  key: "catalog",
  label: "แคตตาล็อกแผง / อินเวอร์เตอร์",
  hint: "อินเวอร์เตอร์ต้องอยู่ในรายชื่อที่การไฟฟ้ารับรอง",
  req: true
}, {
  key: "local",
  label: "ใบแจ้งท้องถิ่น / อ.1",
  hint: "ต้องมี อ.1 เมื่อพื้นที่แผงเกิน 160 ตร.ม."
}, {
  key: "erc",
  label: "หนังสือรับแจ้งยกเว้น กกพ.",
  hint: "ใบรับแจ้งประกอบกิจการพลังงานที่ได้รับยกเว้น"
}, {
  key: "other",
  label: "เอกสารอื่น ๆ",
  hint: "อะไรที่การไฟฟ้าสาขาขอเพิ่มเป็นกรณี"
}];
function usePermitDocs(jobId) {
  const [docs, setDocs] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setDocs({});
      return;
    }
    const ref = window.FBDB.ref("permitDocs/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setDocs(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const setDoc = React.useCallback((key, rec) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("permitDocs/" + jobId + "/" + key).update(Object.assign({
      key,
      at: new Date().toISOString()
    }, rec));
  }, [jobId]);
  const removeDoc = React.useCallback(key => {
    if (jobId && window.FBDB) window.FBDB.ref("permitDocs/" + jobId + "/" + key).remove();
  }, [jobId]);
  return {
    docs,
    setDoc,
    removeDoc
  };
}
const PERMIT_DOC_MAX = 1.6 * 1024 * 1024;
async function readPermitDoc(file) {
  if (/^image\//.test(file.type)) {
    const dataUrl = await resizeImageFile(file, 1700, 0.78);
    return {
      dataUrl,
      name: file.name,
      kind: "image"
    };
  }
  if (file.size > PERMIT_DOC_MAX) throw new Error("ไฟล์ใหญ่เกิน 1.6 MB — ลองบีบอัดหรือสแกนใหม่ที่ความละเอียดต่ำลง");
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("อ่านไฟล์ไม่สำเร็จ"));
    r.readAsDataURL(file);
  });
  return {
    dataUrl,
    name: file.name,
    kind: /pdf/i.test(file.type) ? "pdf" : "file"
  };
}
function usePermitPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setPhotos({});
      return;
    }
    const ref = window.FBDB.ref("permitPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setPhotos(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user, extra) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).update(Object.assign({
      slot,
      dataUrl,
      by: user && user.id || null,
      byName: user && user.name || "-",
      at: new Date().toISOString()
    }, extra || {}));
  }, [jobId]);
  const removePhoto = React.useCallback(slot => {
    if (jobId && window.FBDB) window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return {
    photos,
    setPhoto,
    removePhoto
  };
}
const P_INPUT = {
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
function FromSurveyTag() {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      marginLeft: 6,
      padding: "1px 6px",
      borderRadius: 99,
      background: "var(--tint-teal-bg, var(--primary-soft))",
      color: "#0F766E",
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: 0,
      verticalAlign: "middle"
    }
  }, "\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08");
}
function PField({
  label,
  hint,
  required,
  children,
  full,
  from
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      gridColumn: full ? "1 / -1" : "auto",
      minWidth: 0
    }
  }, React.createElement("label", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".04em",
      color: "var(--text-3)"
    }
  }, label, required && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *"), from && React.createElement(FromSurveyTag, null)), children, hint && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.4
    }
  }, hint));
}
function PGrid({
  children,
  cols
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(" + (cols || 2) + ", 1fr)",
      gap: 13
    }
  }, children);
}
function PermitTypePicker({
  value,
  onChange
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, PERMIT_TYPES.map(t => {
    const on = value === t.key;
    return React.createElement("button", {
      type: "button",
      key: t.key,
      onClick: () => onChange(t.key),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 13px",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
        background: on ? "var(--primary-soft)" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: 99,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        border: "2px solid " + (on ? "var(--primary)" : "var(--border-strong)")
      }
    }, on && React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 99,
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
        fontSize: 13.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, t.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 1
      }
    }, t.sub)));
  }));
}
function PermitShotCard({
  slot,
  shot,
  busy,
  onPick,
  onRemove
}) {
  const inputRef = React.useRef(null);
  const [sample, setSample] = React.useState(false);
  const has = !!(shot && shot.dataUrl);
  const warn = slot.hint.indexOf("⚠") === 0;
  return React.createElement(React.Fragment, null, sample && React.createElement(PermitSampleModal, {
    slot: slot,
    onClose: () => setSample(false)
  }), React.createElement("div", {
    style: {
      border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"),
      borderRadius: 13,
      padding: 11,
      borderLeft: "3px solid " + (has ? "var(--primary)" : slot.req ? "var(--tint-red-bd)" : "var(--surface3)"),
      background: has ? "var(--surface)" : "var(--surface2)",
      display: "flex",
      gap: 11,
      alignItems: "center"
    }
  }, has ? React.createElement("a", {
    href: shot.dataUrl,
    target: "_blank",
    rel: "noreferrer",
    style: {
      flexShrink: 0,
      lineHeight: 0
    }
  }, React.createElement("img", {
    src: shot.dataUrl,
    alt: "",
    style: {
      width: 54,
      height: 54,
      borderRadius: 10,
      objectFit: "cover",
      border: "1px solid var(--border)"
    }
  })) : React.createElement("button", {
    type: "button",
    onClick: () => setSample(true),
    title: "\u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E15\u0E47\u0E21",
    style: {
      padding: 0,
      border: "none",
      background: "none",
      cursor: "pointer",
      flexShrink: 0,
      lineHeight: 0
    }
  }, React.createElement(PermitSampleArt, {
    slotKey: slot.key,
    size: 62
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
  }, slot.label, slot.req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      marginTop: 1,
      lineHeight: 1.4,
      color: warn ? "var(--tint-red-tx)" : "var(--text-3)",
      fontWeight: warn ? 600 : 400
    }
  }, slot.hint), React.createElement("button", {
    type: "button",
    onClick: () => setSample(true),
    style: {
      marginTop: 4,
      padding: 0,
      border: "none",
      background: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 12,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07")), React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: e => {
      const fl = e.target.files && e.target.files[0];
      if (fl) onPick(fl);
      e.target.value = "";
    }
  }), React.createElement("span", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => inputRef.current && inputRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "7px 11px",
      borderRadius: 9,
      border: "none",
      background: has ? "var(--surface3)" : "var(--primary)",
      color: has ? "var(--text-2)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12,
      cursor: busy ? "wait" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 13,
    color: has ? "var(--text-2)" : "#fff"
  }), " ", busy ? "…" : has ? "ถ่ายใหม่" : "ถ่าย"), has && React.createElement("button", {
    type: "button",
    onClick: onRemove,
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14
  })))));
}
function PermitWizard({
  job,
  onClose,
  onSave,
  onSubmit,
  currentUser,
  stock,
  readOnly
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const media = usePermitPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => permitInitial(job));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const seed = React.useMemo(() => permitFromSurvey(job), [job && job.id]);
  const seedNames = Object.keys(seed).map(k => PERMIT_SURVEY_LABELS[k]).filter(Boolean);
  const fromSurvey = k => {
    if (seed[k] == null) return false;
    if (k === "gps") return !!(f.gps && seed.gps && f.gps.lat === seed.gps.lat);
    return String(f[k] || "").trim() !== "" && String(f[k]) === String(seed[k]);
  };
  const invFromSurvey = i => i === 0 && !!seed.invModel && String((f.invs[0] || {}).model || "") === String(seed.invModel);
  const prog = permitProgress(f, media.photos);
  const locked = !!readOnly;
  const stockItems = stock && stock.items || [];
  const modelOptions = (mainCat, cur) => {
    const SF = window.SF,
      out = [];
    stockItems.forEach(s => {
      if (!s.name || !SF || SF.mainCatOf(s.cat) !== mainCat) return;
      out.push({
        value: s.name,
        label: s.name,
        sub: [s.brand, s.model].filter(Boolean).join(" · ")
      });
    });
    out.sort((a, b) => a.label.localeCompare(b.label, "th"));
    const v = (cur || "").trim();
    if (v && !out.some(o => o.value === v)) out.push({
      value: v,
      label: v,
      sub: "พิมพ์เอง"
    });
    return out;
  };
  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsErr("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setGpsBusy(true);
    setGpsErr("");
    navigator.geolocation.getCurrentPosition(pos => {
      set("gps", {
        lat: +pos.coords.latitude.toFixed(6),
        lng: +pos.coords.longitude.toFixed(6),
        acc: Math.round(pos.coords.accuracy || 0),
        at: new Date().toISOString()
      });
      setGpsBusy(false);
    }, err => {
      setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setGpsBusy(false);
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  };
  const pickPhoto = async (slotKey, file) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1600, 0.8);
      media.setPhoto(slotKey, dataUrl, currentUser);
    } catch (err) {
      alert("เพิ่มรูปไม่สำเร็จ: " + err.message);
    }
    setBusySlot(null);
  };
  const setInv = (i, k, v) => setF(p => {
    const arr = (p.invs || []).slice();
    arr[i] = Object.assign({}, arr[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      invs: arr
    });
  });
  const addInv = () => setF(p => Object.assign({}, p, {
    invs: (p.invs || []).concat([{
      model: "",
      sn: ""
    }])
  }));
  const delInv = i => setF(p => Object.assign({}, p, {
    invs: (p.invs || []).filter((_, x) => x !== i)
  }));
  const setSn = (i, v) => setF(p => {
    const arr = (p.panelSns || []).slice();
    arr[i] = v;
    return Object.assign({}, p, {
      panelSns: arr
    });
  });
  const save = extra => {
    const rec = Object.assign({}, f, {
      updatedAt: new Date().toISOString(),
      byName: f.byName || currentUser && currentUser.name || ""
    }, extra || {});
    onSave(rec);
    return rec;
  };
  const doSubmit = () => {
    const rec = save({
      status: "sent",
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser && currentUser.name || "",
      submittedTechId: currentUser && currentUser.techId || null
    });
    onSubmit && onSubmit(rec);
    onClose();
  };
  const shownSlots = PERMIT_PHOTO_SLOTS.filter(s => !s.when || s.when(f));
  const photoDone = shownSlots.filter(s => media.photos[s.key] && media.photos[s.key].dataUrl).length;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 118,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 20,
      width: isMobile ? "100%" : "min(760px,100%)",
      height: isMobile ? "96dvh" : "min(880px, 92vh)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "15px 20px 0",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 11,
      background: "#14B8A61c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 18,
    color: "#14B8A6"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, job ? job.code + " · " + (job.name || "") : "")), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      height: 7,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: prog.pct + "%",
      height: "100%",
      borderRadius: 99,
      transition: "width .3s",
      background: prog.pct === 100 ? "var(--primary)" : "#F59E0B"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: prog.pct === 100 ? "var(--primary-dark)" : "var(--text-2)",
      flexShrink: 0
    }
  }, prog.pct, "%")), React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 5,
      marginTop: 11,
      paddingBottom: 11,
      overflowX: "auto"
    }
  }, PERMIT_STEPS.map(s => {
    const on = step === s.n;
    return React.createElement("button", {
      key: s.n,
      onClick: () => setStep(s.n),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 11px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid " + (on ? "transparent" : "var(--border)"),
        background: on ? "var(--primary)" : "var(--surface)",
        color: on ? "#fff" : "var(--text-2)"
      }
    }, React.createElement(Icon, {
      name: s.icon,
      size: 13,
      color: on ? "#fff" : "var(--text-3)"
    }), " ", s.th);
  }))), React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13,
      pointerEvents: locked ? "none" : "auto",
      opacity: locked ? .75 : 1
    }
  }, step === 1 && React.createElement(React.Fragment, null, seedNames.length > 0 && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--primary-soft)",
      border: "1px solid var(--primary)",
      fontSize: 12,
      color: "var(--primary-dark)",
      lineHeight: 1.55
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 800
    }
  }, "\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E21\u0E32\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 ", seedNames.length, " \u0E0A\u0E48\u0E2D\u0E07"), React.createElement("span", {
    style: {
      display: "block",
      marginTop: 2
    }
  }, seedNames.join(" · ")), React.createElement("span", {
    style: {
      display: "block",
      marginTop: 3,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E1B\u0E49\u0E32\u0E22 \u201C\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08\u201D \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E27\u0E08\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07 \u0E41\u0E01\u0E49\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22")), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCC4 \u0E22\u0E37\u0E48\u0E19\u0E41\u0E1A\u0E1A\u0E44\u0E2B\u0E19",
    sub: "\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E1A\u0E1A\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E04\u0E19\u0E25\u0E30\u0E0A\u0E38\u0E14 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E32\u0E21"
  }, fromSurvey("permitType") && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: -4
    }
  }, "\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49\u0E15\u0E2D\u0E19\u0E2A\u0E33\u0E23\u0E27\u0E08", React.createElement(FromSurveyTag, null), " \u2014 \u0E16\u0E49\u0E32\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E44\u0E1B \u0E41\u0E01\u0E49\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49"), React.createElement(PermitTypePicker, {
    value: f.permitType,
    onChange: v => set("permitType", v)
  })), React.createElement(SurveyBlock, {
    title: "\u26A1 \u0E08\u0E38\u0E14\u0E23\u0E31\u0E1A\u0E44\u0E1F",
    sub: "\u0E25\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E41\u0E25\u0E30\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E40\u0E1B\u0E4A\u0E30 \u0E1C\u0E34\u0E14\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E17\u0E35\u0E48\u0E22\u0E37\u0E48\u0E19",
    required: true,
    from: fromSurvey("auth")
  }, React.createElement(Segmented, {
    value: f.auth,
    onChange: v => set("auth", v),
    options: PERMIT_AUTHS
  })), React.createElement(PField, {
    label: "\u0E40\u0E1F\u0E2A",
    from: fromSurvey("phase")
  }, React.createElement(Segmented, {
    value: f.phase,
    onChange: v => set("phase", v),
    options: PERMIT_PHASES
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E1F\u0E49\u0E32 (CA)",
    required: true,
    from: fromSurvey("ca"),
    hint: "\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F \u0E21\u0E38\u0E21\u0E1A\u0E19"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.ca,
    onChange: e => set("ca", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 020012345678"
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    required: true,
    from: fromSurvey("meterNo"),
    hint: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E1B\u0E31\u0E14\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.meterNo,
    onChange: e => set("meterNo", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 12345678"
  })), React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    required: true,
    from: fromSurvey("meterSize"),
    hint: "\u0E40\u0E0A\u0E48\u0E19 15(45), 30(100)"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.meterSize,
    onChange: e => set("meterSize", e.target.value),
    placeholder: "15(45)"
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E40\u0E2A\u0E32\u0E44\u0E1F\u0E15\u0E49\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E44\u0E1F",
    required: true,
    from: fromSurvey("poleNo"),
    hint: "\u0E2D\u0E48\u0E32\u0E19\u0E08\u0E32\u0E01\u0E1B\u0E49\u0E32\u0E22\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E1A\u0E19\u0E40\u0E2A\u0E32"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.poleNo,
    onChange: e => set("poleNo", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 5FA-01-234"
  })), React.createElement(PField, {
    label: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E2A\u0E32\u0E02\u0E32 / \u0E40\u0E02\u0E15\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    full: true,
    from: fromSurvey("branch"),
    hint: "\u0E14\u0E39\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F \u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E22\u0E37\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E44\u0E2B\u0E19"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.branch,
    onChange: e => set("branch", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E1F\u0E20. \u0E2A\u0E32\u0E02\u0E32\u0E1A\u0E32\u0E07\u0E25\u0E30\u0E21\u0E38\u0E07"
  }))))), step === 2 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0C \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    sub: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E40\u0E02\u0E35\u0E22\u0E19\u0E43\u0E19 Single Line Diagram"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AT (\u0E41\u0E2D\u0E21\u0E1B\u0E4C)",
    required: true,
    from: fromSurvey("mainAT"),
    hint: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.mainAT,
    onChange: e => set("mainAT", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 50"
  })), React.createElement(PField, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AF (\u0E41\u0E2D\u0E21\u0E1B\u0E4C)"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.mainAF,
    onChange: e => set("mainAF", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 100"
  })), React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19",
    required: true,
    from: fromSurvey("mainCable"),
    hint: "\u0E40\u0E0A\u0E48\u0E19 2x25 sq.mm THW"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.mainCable,
    onChange: e => set("mainCable", e.target.value),
    placeholder: "2x25 sq.mm"
  })), React.createElement(PField, {
    label: "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D\u0E15\u0E39\u0E49 MDB",
    from: fromSurvey("mdbBrand")
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.mdbBrand,
    onChange: e => set("mdbBrand", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Schneider"
  }))), React.createElement(SurveyToggle, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E19\u0E34\u0E14\u0E01\u0E31\u0E19\u0E14\u0E39\u0E14 (RCD / RCCB)",
    hint: "\u0E21\u0E35\u0E1C\u0E25\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    value: f.rccb,
    onChange: v => set("rccb", v),
    options: PERMIT_YESNO
  })), f.permitType === "biz" && React.createElement(SurveyBlock, {
    title: "\uD83C\uDFED \u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    sub: "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19/\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07 (kVA)",
    required: true
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.trafoKva,
    onChange: e => set("trafoKva", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 250"
  })), React.createElement(PField, {
    label: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19",
    hint: "\u0E40\u0E0A\u0E48\u0E19 22 kV / 400 V"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.trafoVolt,
    onChange: e => set("trafoVolt", e.target.value),
    placeholder: "22 kV"
  }))))), step === 3 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\u2600\uFE0F \u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 kWp (\u0E1D\u0E31\u0E48\u0E07 DC)",
    required: true,
    from: fromSurvey("kwp")
  }, React.createElement("input", {
    inputMode: "decimal",
    style: P_INPUT,
    value: f.kwp,
    onChange: e => set("kwp", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10.4"
  })), React.createElement(PField, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E25\u0E34\u0E15 kW (\u0E1D\u0E31\u0E48\u0E07 AC)",
    hint: "\u0E15\u0E32\u0E21\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    inputMode: "decimal",
    style: P_INPUT,
    value: f.kwac,
    onChange: e => set("kwac", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10"
  })), React.createElement(PField, {
    label: "\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AC \u0E02\u0E2D\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    required: true,
    hint: "\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49 MDB"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.acBreaker,
    onChange: e => set("acBreaker", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 32A 2P"
  })), React.createElement(PField, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08",
    required: true
  }, React.createElement("input", {
    type: "date",
    style: P_INPUT,
    value: f.doneDate,
    onChange: e => set("doneDate", e.target.value)
  }))), React.createElement(SurveyToggle, {
    label: "\u0E21\u0E35 DC Isolator",
    value: f.dcIsolator,
    onChange: v => set("dcIsolator", v),
    options: PERMIT_YESNO
  }), React.createElement(SurveyToggle, {
    label: "\u0E21\u0E35\u0E23\u0E30\u0E1A\u0E1A\u0E01\u0E31\u0E19\u0E44\u0E1F\u0E44\u0E2B\u0E25\u0E22\u0E49\u0E2D\u0E19 (Zero Export / ELD)",
    hint: "\u0E16\u0E49\u0E32\u0E21\u0E35 \u0E15\u0E49\u0E2D\u0E07\u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E08\u0E38\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07 CT \u0E14\u0E49\u0E27\u0E22",
    value: f.zeroExport,
    onChange: v => set("zeroExport", v),
    options: PERMIT_YESNO
  }), f.zeroExport === "yes" && React.createElement(PField, {
    label: "\u0E23\u0E38\u0E48\u0E19\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E01\u0E31\u0E19\u0E44\u0E1F\u0E44\u0E2B\u0E25\u0E22\u0E49\u0E2D\u0E19 (ELD / Smart Meter)",
    hint: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E02\u0E2D\u0E2A\u0E40\u0E1B\u0E01\u0E15\u0E31\u0E27\u0E19\u0E35\u0E49\u0E14\u0E49\u0E27\u0E22"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.eldModel,
    onChange: e => set("eldModel", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Huawei Smart Power Sensor DTSU666-H"
  }))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD27 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    sub: "\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30\u0E15\u0E31\u0E27 \u0E1E\u0E23\u0E49\u0E2D\u0E21 Serial \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17 \u2014 \u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, (f.invs || []).map((iv, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(PField, {
    label: "ตัวที่ " + (i + 1) + " — รุ่น",
    required: true,
    from: invFromSurvey(i)
  }, React.createElement(Dropdown, {
    value: iv.model,
    onChange: v => setInv(i, "model", v),
    options: modelOptions("inverter", iv.model),
    placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(PField, {
    label: "Serial",
    required: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: iv.sn,
    onChange: e => setInv(i, "sn", e.target.value),
    placeholder: "\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17"
  }))), (f.invs || []).length > 1 && React.createElement("button", {
    type: "button",
    onClick: () => delInv(i),
    title: "\u0E25\u0E1A\u0E15\u0E31\u0E27\u0E19\u0E35\u0E49",
    style: {
      width: 38,
      height: 38,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14
  })))), React.createElement("button", {
    type: "button",
    onClick: addInv,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    sw: 2.4
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E35\u0E01\u0E15\u0E31\u0E27"))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD06 \u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    sub: "Serial \u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 1\u20132 \u0E41\u0E1C\u0E48\u0E19\u0E1E\u0E2D \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E25\u0E48\u0E17\u0E38\u0E01\u0E41\u0E1C\u0E48\u0E19"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07",
    required: true,
    full: true,
    from: fromSurvey("panelModel")
  }, React.createElement(Dropdown, {
    value: f.panelModel,
    onChange: v => set("panelModel", v),
    options: modelOptions("panel", f.panelModel),
    placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"
  })), React.createElement(PField, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E07 (W)"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.panelWatt,
    onChange: e => set("panelWatt", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 620"
  })), React.createElement(PField, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07",
    required: true
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.panelQty,
    onChange: e => set("panelQty", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 16"
  })), React.createElement(PField, {
    label: "Serial \u0E41\u0E1C\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48 1",
    required: true,
    full: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: (f.panelSns || [])[0] || "",
    onChange: e => setSn(0, e.target.value),
    placeholder: "\u0E2D\u0E48\u0E32\u0E19\u0E08\u0E32\u0E01\u0E2A\u0E15\u0E34\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07"
  })), React.createElement(PField, {
    label: "Serial \u0E41\u0E1C\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48 2",
    full: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: (f.panelSns || [])[1] || "",
    onChange: e => setSn(1, e.target.value),
    placeholder: "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A"
  })))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCCD \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"
  }, React.createElement(PField, {
    label: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 (GPS)",
    from: fromSurvey("gps"),
    hint: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E02\u0E2D\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E38\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E04\u0E33\u0E02\u0E2D"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    type: "button",
    onClick: captureGps,
    disabled: gpsBusy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: gpsBusy ? "wait" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 14,
    color: "#fff"
  }), " ", gpsBusy ? "กำลังจับพิกัด…" : f.gps ? "จับพิกัดใหม่" : "จับพิกัดตรงนี้"), f.gps && React.createElement("span", {
    style: {
      fontSize: 12,
      fontFamily: "var(--mono)",
      color: "var(--text-2)"
    }
  }, f.gps.lat, ", ", f.gps.lng, " ", React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\xB1", f.gps.acc, "m")), gpsErr && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 600
    }
  }, gpsErr))), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E16\u0E36\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",
    hint: "\u0E40\u0E0A\u0E48\u0E19 \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E27\u0E31\u0E19\u0E15\u0E23\u0E27\u0E08"
  }, React.createElement("textarea", {
    rows: 3,
    style: Object.assign({}, P_INPUT, {
      resize: "vertical"
    }),
    value: f.note,
    onChange: e => set("note", e.target.value),
    placeholder: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E47\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49"
  })))), step === 4 && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      fontSize: 12,
      color: "var(--tint-amber-tx)",
      fontWeight: 600,
      lineHeight: 1.5
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E01\u0E25\u0E32\u0E07\u0E41\u0E14\u0E14\u0E08\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17\u0E21\u0E31\u0E01\u0E2A\u0E30\u0E17\u0E49\u0E2D\u0E19\u0E08\u0E19\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 \u2014 \u0E43\u0E0A\u0E49\u0E21\u0E37\u0E2D\u0E1A\u0E31\u0E07\u0E40\u0E07\u0E32\u0E41\u0E25\u0E49\u0E27\u0E16\u0E48\u0E32\u0E22\u0E43\u0E01\u0E25\u0E49 \u0E46 \u0E08\u0E30\u0E1C\u0E48\u0E32\u0E19\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E23\u0E2D\u0E1A\u0E41\u0E23\u0E01", React.createElement("span", {
    style: {
      display: "block",
      marginTop: 3,
      fontWeight: 700
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27 ", photoDone, "/", shownSlots.length, " \u0E0A\u0E48\u0E2D\u0E07")), PERMIT_PHOTO_GROUPS.map(g => {
    const list = shownSlots.filter(s => s.group === g);
    if (!list.length) return null;
    return React.createElement(SurveyBlock, {
      key: g,
      title: g
    }, React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 9
      }
    }, list.map(s => React.createElement(PermitShotCard, {
      key: s.key,
      slot: s,
      shot: media.photos[s.key],
      busy: busySlot === s.key,
      onPick: file => pickPhoto(s.key, file),
      onRemove: () => media.removePhoto(s.key)
    }))));
  })), step === 5 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: prog.missing.length ? "⚠️ ยังขาดอีก " + prog.missing.length + " อย่าง" : "✅ เก็บครบแล้ว",
    sub: prog.missing.length ? "แตะรายการเพื่อกระโดดไปหน้าที่ต้องแก้" : "กดส่งต่อได้เลย ฝ่ายขออนุญาตจะได้รับแจ้งเตือนทันที"
  }, prog.missing.length === 0 ? React.createElement("div", {
    style: {
      padding: "18px 0",
      textAlign: "center",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E30\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, prog.missing.map((m, i) => React.createElement("button", {
    key: i,
    onClick: () => setStep(m.step),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderRadius: 10,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit",
      width: "100%",
      border: "1px solid var(--tint-red-bd)",
      background: "var(--tint-red-bg)"
    }
  }, React.createElement(Icon, {
    name: m.kind === "photo" ? "camera" : "pen",
    size: 14,
    color: "var(--tint-red-tx)"
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--tint-red-tx)"
    }
  }, m.th), React.createElement(Icon, {
    name: "chevronRight",
    size: 14,
    color: "var(--tint-red-tx)"
  }))))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCE4 \u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",
    sub: "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27\u0E22\u0E31\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E14\u0E49 \u0E16\u0E49\u0E32\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E01\u0E14\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19"
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.6
    }
  }, "\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E35\u0E49\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E25\u0E38\u0E21\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E01\u0E47\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19, Single Line Diagram \u0E25\u0E07\u0E19\u0E32\u0E21\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23, \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 \u0E41\u0E25\u0E30\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D \u0E01\u0E01\u0E1E. \u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E31\u0E14\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E15\u0E48\u0E2D"), React.createElement("button", {
    type: "button",
    onClick: doSubmit,
    disabled: prog.missing.length > 0,
    style: {
      width: "100%",
      padding: "13px 16px",
      borderRadius: 12,
      border: "none",
      marginTop: 4,
      background: prog.missing.length ? "var(--surface3)" : "var(--primary)",
      color: prog.missing.length ? "var(--text-3)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: prog.missing.length ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 17,
    color: prog.missing.length ? "var(--text-3)" : "#fff"
  }), prog.missing.length ? "กรอกให้ครบก่อนถึงจะส่งได้" : "ส่งต่อแอดมินขออนุญาต")))), React.createElement("div", {
    style: {
      padding: "12px 18px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom, 0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: () => setStep(s => Math.max(1, s - 1)),
    disabled: step === 1,
    style: {
      padding: "11px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: step === 1 ? "var(--text-3)" : "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: step === 1 ? "default" : "pointer"
    }
  }, "\u0E22\u0E49\u0E2D\u0E19"), React.createElement("button", {
    onClick: () => {
      save();
      onClose();
    },
    style: {
      flex: 1,
      padding: "11px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), React.createElement("button", {
    onClick: () => setStep(s => Math.min(5, s + 1)),
    disabled: step === 5,
    style: {
      padding: "11px 20px",
      borderRadius: 11,
      border: "none",
      background: step === 5 ? "var(--surface3)" : "var(--primary)",
      color: step === 5 ? "var(--text-3)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: step === 5 ? "default" : "pointer"
    }
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B"))));
}
Object.assign(window, {
  PermitWizard,
  blankPermit,
  usePermitPhotos,
  permitProgress,
  permitMissing,
  permitStatusOf,
  permitInitial,
  permitFromSurvey,
  PermitSampleArt,
  PermitSampleModal,
  PERMIT_SAMPLE_TIPS,
  usePermitDocs,
  readPermitDoc,
  PERMIT_DOC_SLOTS,
  PERMIT_PHOTO_SLOTS,
  PERMIT_SLOT_BY,
  PERMIT_STEPS,
  PERMIT_STATUS,
  PERMIT_TYPES
});