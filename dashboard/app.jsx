/* ============================================================
   SolarFlow / flash+solar — main app shell
   ============================================================ */

/* เมนูซ้าย — คุมด้วย "สิทธิ์" ไม่ใช่ชื่อตำแหน่ง เพราะคนหนึ่งคนถือได้หลายตำแหน่ง
   perm ว่าง = ทุกคนที่ล็อกอินเห็น · own = เห็นเมื่อบัญชีผูกกับพนักงานในระบบ (มีงานเป็นของตัวเอง) */
const NAV = [
  /* ลำดับ = ทางเดินของงานจริง งานขาย → นัดสำรวจ/ตารางงาน → ติดตั้ง → วางบิลเก็บเงิน → หลังการขาย
     ยกเว้นสองแถวแรก ที่เรียงตาม "เปิดบ่อยแค่ไหน" ไม่ใช่ตามลำดับงาน — กองงานที่กำลังทำอยู่
     ต้องอยู่บนสุด ไม่งั้นคนกดทุกวันต้องกวาดตาผ่านหน้าที่เปิดเดือนละครั้งทุกครั้ง */
  { sect: "work", key: "overview",   th: "ภาพรวม",         en: "Overview",      icon: "grid" },
  /* งานติดตั้ง — บอร์ดกับตารางคืองานใบเดียวกัน ต่างกันแค่ทรงที่วาง จึงเป็นเมนูเดียวแล้วสลับมุมในหน้า
     (กฎเดียวกับที่ยุบบอร์ดขายเข้ากับรายการลูกค้าข้างล่าง) */
  { sect: "work", key: "board",      th: "งานติดตั้ง",       en: "Jobs",          icon: "kanban",   tab: "บอร์ด" },
  { sect: "work", key: "table",      th: "ฐานข้อมูลงาน",     en: "Database",      icon: "table",    perm: "viewAll", group: "board", tab: "ตาราง" },
  // "สถานะสำรวจ" (SurveyView) ถอดออกจากเมนูแล้ว — การสำรวจย้ายไปอยู่กับ "ลูกค้าสำรวจ" ทั้งหมด
  // งานในฐานงานมาจากลูกค้าที่แปลงแล้ว (พกแบบสำรวจติดมาด้วย) · โค้ดหน้ายังอยู่ใน views-survey.jsx ถ้าอยากได้คืน
  /* ตารางงาน — สามหน้านี้เป็นปฏิทินทั้งหมด ต่างกันที่ตัวกรอง (ทุกนัด / เฉพาะนัดสำรวจ / เฉพาะของฉัน)
     เคยกินเมนูสามแถวแล้วใช้ไอคอนซ้ำกันสองแถว ซึ่งเป็นสัญญาณว่ามันเป็นเรื่องเดียวกันมาแต่แรก */
  { sect: "work", key: "calendar",   th: "ตารางงาน",         en: "Schedule",      icon: "calendar", tab: "ปฏิทิน" },
  { sect: "work", key: "dispatch",   th: "จัดตารางสำรวจ",    en: "Dispatch",      icon: "pin",      perm: "dispatch", group: "calendar", tab: "นัดสำรวจ" },
  { sect: "work", key: "myschedule", th: "ตารางงานของฉัน",   en: "My Schedule",   icon: "list",     own: true, group: "calendar", tab: "ของฉัน" },
  /* บอร์ดขายกับรายการลูกค้าคือข้อมูลชุดเดียวกันคนละมุม จึงเป็นเมนูเดียว แล้วสลับมุมในหน้า
     ยอดขายคือ "ตัวเลขสรุปของกองเดียวกันนี้" จึงยุบเข้ามาเป็นแท็บ ไม่ใช่เมนูแยก
     เดิมงานขายถูกซ่อน (NAV_IN_BOARD) แต่ยอดขายยังกินแถวอยู่ เมนูจึงมีหน้าสรุปของเรื่อง
     ที่ไม่มีอยู่ในเมนู กดจากยอดขายแล้วไปต่อที่รายชื่อลูกค้าไม่ได้ ต้องวนกลับเข้าทางบอร์ด */
  { sect: "work", key: "leads",      th: "งานขาย",           en: "Sales",         icon: "trend",    perm: "leads",   tab: "ลูกค้า" },
  { sect: "work", key: "saleskpi",   th: "ยอดขาย",           en: "Sales KPI",     icon: "chart",    perm: "price",   group: "leads", tab: "ยอดขาย" },
  /* เอกสารงวดงาน — ถอดงวดจากใบเสนอราคา ออกใบแจ้งส่งมอบงาน แล้วตามเงินจนจบโปรเจค */
  { sect: "work", key: "billing",    th: "เอกสารงวดงาน",    en: "Billing",      icon: "file",     perm: "billing" },
  { sect: "work", key: "permit",     th: "ขออนุญาตการไฟฟ้า", en: "Permit",        icon: "shield",   perm: "permit" },
  /* งานบริการหลังการขาย — ทะเบียนประกัน · รอบล้างแผง · ใบแจ้งซ่อม · ใบรายงานเข้าบริการ */
  { sect: "work", key: "om",         th: "งานบริการหลังการขาย", en: "O&M",         icon: "wrench",   perm: "om" },
  /* ใบเบิกเงินหน้างาน — ซื้อของหน้างาน · ค่าขนส่ง · ค่าใช้จ่ายอื่น และยอดค้างจ่ายรายคน
     sep = ขีดเส้นคั่นเหนือแถวนี้ แยก "ของและเงินหน้างาน" (เบิกเงิน · คลังสินค้า) ออกจากเรื่องโปรเจกต์
     สองแถวนี้เป็นที่อยู่ของเลขค้างเกือบทั้งหมดในแถบเมนู แยกกองไว้จะได้กวาดตาหาเจอโดยไม่ต้องอ่านชื่อ
     ไม่ใส่หัวข้อกำกับกลุ่ม เพราะหัวข้อกินความสูงพอ ๆ กับหนึ่งแถว ซึ่งคือสิ่งที่เพิ่งยุบไป */
  { sect: "yard", key: "expense",    th: "เบิกเงินหน้างาน",  en: "Expenses",     icon: "wallet",   perm: "expense" },
  { sect: "yard", key: "stock",      th: "คลังสินค้า",       en: "Inventory",     icon: "box",      perm: "stock" },
  /* รายงานประจำวันหน้างาน — ช่างเขียน วิศวกรผู้รับผิดชอบอนุมัติ จึงผูกกับสิทธิ์แก้ใบงาน
     foot = ดันไปล่างสุดของแถบเมนู แยกเส้นคั่นออกจากเมนูงาน เพราะเป็นเอกสารที่เข้าทุกวัน
     ไม่ใช่หน้าดูข้อมูล — วางติดกับตัวเองจะได้กดถึงเร็วโดยไม่ปนกับหัวข้อด้านบน */
  { sect: "day", key: "daily",      th: "รายงานประจำวัน",   en: "Daily Report",  icon: "clipboard", perm: "editJob", foot: true },
  /* เวลาทำงาน — ลงเวลาเข้า-ออก และใบขอ OT · ปั๊มเวลาทำจากแอปในไลน์ หน้านี้คือฝั่งออฟฟิศ
     foot เหมือนรายงานประจำวัน เพราะเป็นเอกสารที่เข้าทุกวัน ไม่ใช่หน้าดูข้อมูล */
  { sect: "day", key: "attend",     th: "เวลาทำงาน",       en: "Attendance",    icon: "clock",    perm: "attend", foot: true },
  /* หน้าแอดมินล้วน — โควตาข้อความของ LINE กับสวิตช์เลือกว่าเรื่องไหนส่งเข้าแชต
     inSettings = ไม่ขึ้นในเมนูหลัก ไปอยู่ในเมนู "ตั้งค่า" ท้ายแถบแทน
     ยังอยู่ใน navForRole ตามปกติ เพราะ allowed ใช้ลิสต์นี้ตัดสินว่าหน้าไหนเข้าได้ —
     ถอดออกจาก NAV ตรง ๆ แล้วคนที่ค้างอยู่หน้านี้จะถูกเด้งออกตอนรีเฟรช */
  { key: "line",       th: "แจ้งเตือน LINE",  en: "LINE",          icon: "message",  perm: "manageUsers", inSettings: true },
  /* คู่มือการใช้งาน — เนื้อหาล้วน ไม่แตะฐานข้อมูล เปิดค้างบนจอตอนสอนได้
     inSettings — คนที่เปิดคู่มือคือคนที่เพิ่งมาหรือติดอยู่เรื่องเดียว ไม่ใช่หน้าที่เข้าทุกวัน
     จึงไม่ควรกินแถวในแถบเมนูเท่ากับเมนูงานที่กดทุกวัน */
  { key: "guide",      th: "คู่มือการใช้งาน",  en: "Guide",         icon: "book",     inSettings: true },
  /* "รายงานสรุป" ถอดออกจากเมนูแล้ว — โค้ดหน้ายังอยู่ที่ views-report.jsx ถ้าอยากได้คืนให้เติมแถวนี้กลับ
     { key: "report", th: "รายงานสรุป", en: "Report", icon: "file", perm: "viewAll" } */
];
/* คนที่ถือตำแหน่ง "ฝ่ายขออนุญาต" อย่างเดียว — บอร์ดขั้นงานติดตั้งไม่มีความหมายกับเขา
   (งานกองอยู่ขั้น "เสร็จสิ้น" หมด) บอร์ดงานของเขาจึงเป็นบอร์ดขออนุญาตแทน */
/* ── เลขท้ายเมนู ──
   สีบอกว่าเลขนั้นหมายถึงอะไร ไม่ได้ใส่ให้สวย: แดง = มีเรื่องค้างหรือเลยกำหนด ต้องลงมือ ·
   เหลือง = ใกล้ถึงเกณฑ์ · ฟ้า = แค่บอกจำนวนของวันนี้ ไม่ใช่ปัญหา
   ถ้าไม่แยกโทน เลขที่ขึ้นทุกวัน (นัดวันนี้) จะทำให้คนเลิกมองเลขที่สำคัญจริง ๆ ไปด้วย */
/* หน้าที่ไม่ได้ไล่รายการงาน — ตัวกรองประเภทงาน/ช่าง/ขั้นงาน และบรรทัด "แสดง n จาก n งาน"
   ไม่มีความหมายบนหน้าเหล่านี้ กดกรองไปก็ไม่มีอะไรบนจอเปลี่ยน ได้แต่กินที่หัว
   ใส่คำอธิบายหน้าแทน เพราะหัวหน้าที่ว่างเปล่าอ่านเหมือนหน้าโหลดค้าง */
/* ค่าว่าง = หน้านี้ไม่มีบรรทัดรอง (ต่างจาก undefined ที่แปลว่าไม่ใช่หน้าเนื้อหาล้วน)
   หน้าที่ตัวกรองขึ้นไปอยู่แถวชื่อหน้าแล้ว บรรทัดรองจะดันตัวกรองให้ห่างจากชื่อหน้าไปอีกหนึ่งแถว */
const PLAIN_SUB = {
  om: "",
  attend: "ลงเวลาเข้า-ออกรายวัน · ใบขอ OT · ตั้งค่าเวลาทำงาน",
  expense: "ใบเบิกเงินหน้างาน · คิวอนุมัติ · ยอดค้างจ่ายรายคน",
  billing: "งวดงานทุกงาน · วางบิล · รับมอบ · รับเงิน",
  daily: "ใบรายงานหน้างานรายวัน · รูปหน้างาน · ลายเซ็น",
  line: "โควตาข้อความ · เลือกเรื่องที่ส่งเข้าแชต · บัญชีที่ผูกไว้",
  guide: "ขั้นตอนการใช้งานทีละข้อ แยกตามหน้าที่ · พิมพ์เป็นใบแจกได้",
};
const NAV_BADGE_TONE = { stock: "warn", calendar: "info" };
/* ความด่วนของโทนเลขท้ายเมนู — เลขรวมบนแถวแม่ต้องใช้โทนของเรื่องที่ด่วนที่สุดที่ยังค้างอยู่
   ไม่งั้นนัดสำรวจที่เลยวันแล้ว (แดง) จะถูกกลืนเป็นฟ้าตามนัดของวันนี้ซึ่งไม่ใช่ปัญหา */
const NAV_TONE_RANK = { "": 0, warn: 1, info: 2 };
const NAV_BADGE_TIP = {
  overview: "งานที่ล่าช้ากว่ากำหนด",
  stock:    "ของที่เหลือถึงหรือต่ำกว่าจุดสั่งซื้อ",
  om:       "เรื่องที่ต้องลงมือในงานบริการหลังการขาย",
  dispatch: "นัดสำรวจที่เลยวันแล้วแต่ยังไม่ปิดสถานะ",
  calendar: "นัดสำรวจของวันนี้",
  expense:  "ใบเบิกเงินที่รอคุณจัดการ",
};
const isPermitOnly = (roles) => (roles || []).length > 0 && roles.every((r) => (ROLE_ALIAS[r] || r) === "permit");
/* บอร์ดรวมอยู่คนละไฟล์ แต่ต้องรู้เรื่องนี้ด้วยว่าจะโชว์ช่วงไหนให้ใคร */
window.isPermitOnly = isPermitOnly;
/* เซลล์อย่างเดียว — ใช้ตัดสินว่าใบงานเปิดแบบอ่านอย่างเดียว (ไม่มีเครื่องมือช่าง) */
const isSalesOnly = (roles) => (roles || []).length > 0 && roles.every((r) => (ROLE_ALIAS[r] || r) === "sales");

/* ── "ขั้นตอน" ของฝ่ายขออนุญาต ──
   ช่างเดินงานตามขั้นติดตั้ง (ออกแบบ→ถอดของ→ติดตั้ง→เสร็จสิ้น) แต่ฝ่ายขออนุญาตไม่ได้ทำงานตามแกนนั้น
   งานที่ "เสร็จสิ้น" ในสายตาช่าง คืองานที่เพิ่งเริ่มต้นในสายตาเขา — ชิปกรองและคอลัมน์ขั้นตอน
   ของบัญชีขออนุญาตจึงต้องเป็นขั้นของใบขออนุญาตแทน ไม่งั้นทุกงานจะกองอยู่ช่องเดียว */
const PERMIT_TODO = { key: "todo", th: "ยังไม่เริ่มเก็บข้อมูล", color: "#94A3B8", soft: "var(--surface2)" };
const permitStageKey = (j) => (j && j.permit && j.permit.status) || "todo";
const permitStageOf = (key) => (window.PERMIT_COLS || []).find((c) => c.key === key) || PERMIT_TODO;
/* ยุบมารวมที่บอร์ดงาน — บอร์ดมีเลนฝ่ายขายและเลนเอกสารอยู่ในผืนเดียวกับหน้างานแล้ว
   เมนู "งานขาย" กับ "ขออนุญาตการไฟฟ้า" จึงเป็นทางที่สองไปหางานใบเดิม เอาออกจากแถบเมนูให้เหลือทางเดียว
   ใช้กับทุกตำแหน่งเหมือนกันหมด ไม่แยกว่าใครเป็นหัวหน้า เพราะเลนบนบอร์ดผูกกับสิทธิ์ชุดเดียวกับเมนูพอดี
   (flGroups ใน views-flow.jsx: เลนฝ่ายขาย = สิทธิ์ leads · เลนเอกสาร = สิทธิ์ permit)
   ⇒ คนที่เคยเห็นเมนู ย่อมเห็นเลนนั้นบนบอร์ดเสมอ ไม่มีใครเสียทางเข้าถึงงาน

   ซ่อนจากแถบเมนู ไม่ใช่ตัดสิทธิ์ — หน้ายังต้องเข้าได้อยู่ เพราะกดการ์ดลูกค้าในบอร์ดจะพาไปหน้ารายการลูกค้า
   ถ้าตัดออกจากรายการที่อนุญาต ตัวเช็คสิทธิ์จะเด้งกลับทันทีตอนกดการ์ด */
/* หน้าที่ไม่กินแถวในเมนู เพราะไปอยู่เป็นมุมหนึ่งในหน้าบอร์ดแล้ว
   งานขายถอดออกจากรายการนี้แล้ว — มันมีหน้าสรุป (ยอดขาย) ห้อยอยู่ การซ่อนตัวแม่
   ทำให้เหลือแต่หน้าสรุปของเรื่องที่ไม่มีในเมนู ซึ่งเดินต่อไปไหนไม่ได้ */
/* ── หัวข้อกำกับกลุ่มในแถบเมนู ──
   เมนูสิบกว่าแถวเรียงติดกันอ่านเป็นกองเดียว เส้นคั่นเปล่า ๆ บอกได้แค่ว่า "คนละพวก"
   แต่ไม่ได้บอกว่า "พวกไหน" จึงเปลี่ยนเป็นคำกำกับ
   ⚠ หัวข้อเกิดจาก "แถวแรกของกลุ่มที่เห็นจริง" ไม่ใช่ตำแหน่งตายตัว
     คนที่ไม่มีสิทธิ์เบิกเงิน หัวข้อจะย้ายไปเกาะคลังสินค้าเอง ไม่ค้างเป็นหัวข้อลอย */
const NAV_SECT = {
  work: "งานโปรเจกต์",
  yard: "ของและเงินหน้างาน",
  day:  "บันทึกประจำวัน",
};

const NAV_IN_BOARD = ["permit"];

/* หน้าไหนมีช่องค้นหาบนหัว — ค่าคือข้อความในช่อง ดูคอมเมนต์ที่ searchPh ใน Header
   ทุกหน้าเขียนแค่ "ค้นหา" — รายชื่อสิ่งที่ค้นได้ยาวกว่าช่องจนต้องตัดด้วยจุดไขปลาอยู่ดี
   คนที่อ่านไม่จบจึงไม่ได้อะไรเพิ่มจากคำว่า "ค้นหา" อยู่ดี */
const HDR_SEARCH = {
  board: "ค้นหา",
  table: "ค้นหา",
  billing: "ค้นหา",
};
const navForRole = (roles, techId) => NAV
  .filter((n) => (n.own ? !!techId : (!n.perm || can(roles, n.perm))))
  .map((n, i, list) => {
    /* ยุบเป็นแท็บได้เฉพาะตอน "ตัวแม่อยู่ในเมนูของคนคนนี้ด้วย" — คนที่มีสิทธิ์เห็นยอดขาย (price)
       แต่ไม่มีสิทธิ์เห็นงานขาย (leads) จะไม่เหลือทางเข้าเลยถ้ายุบไปดื้อ ๆ กรณีนั้นให้ยืนเป็นแถวของตัวเอง
       เป็นกฎกลาง ไม่ใช่ข้อยกเว้นของคู่นี้ — คู่ไหนที่สิทธิ์ไม่ได้มาด้วยกันเสมอก็ได้ผลเดียวกัน */
    const orphan = n.group && !list.some((x) => x.key === n.group);
    return (n.group && !orphan) || NAV_IN_BOARD.indexOf(n.key) !== -1 ? Object.assign({}, n, { hidden: true }) : n;
  });

/* ── เมนูที่ยุบเข้าด้วยกัน ──
   หน้าที่มี group ไม่กินแถวในเมนูซ้ายแล้ว แต่ยังอยู่ใน navForRole ครบ เพราะ allowed ใช้ลิสต์นี้
   ตัดสินว่าหน้าไหนเข้าได้ — ถอดออกจริงคือกดเข้าไม่ได้ ไม่ใช่แค่ไม่เห็นเมนู
   ⚠ ยุบเมนูได้ แต่ห้ามให้ของหาย: ทุกหน้าที่เคยมีแถวของตัวเอง ต้องยังกดถึงได้ในคลิกเดียว
     จากแท็บบนหัวจอ และเลขค้างของมันต้องไปโผล่บนแถวแม่ ไม่ใช่หายไปพร้อมแถว */
const navTop = (key) => { const n = NAV.find((x) => x.key === key); return (n && n.group) || key; };
/* แท็บของเมนูแม่ตัวหนึ่ง — เรียงตามลำดับใน NAV (แม่มาก่อนเสมอ)
   รับ items ที่ผ่าน navForRole มาแล้ว หน้าที่ไม่มีสิทธิ์จึงไม่ขึ้นเป็นแท็บที่กดไม่ได้ */
const navTabsOf = (items, top) => (items || []).filter((n) => n.key === top || n.group === top)
  .map((n) => ({ key: n.key, th: n.tab || n.th, icon: n.icon }));
/* บอร์ดงานเปิดให้ทุกตำแหน่ง — ไม่มีการตัดเมนูนี้ทิ้งตามตำแหน่งอีกแล้ว
   สิ่งที่แต่ละตำแหน่งเห็นบนบอร์ด ตัดสินจากค่าที่ตั้งไว้ล้วน ๆ
     · เลนไหนโผล่  → flGroups(role) ใน views-flow.jsx (ฝ่ายขายดู leads · เอกสารดู permit)
     · งานใบไหนโผล่ → jobInScope ตาม "ขอบเขตงานตามตำแหน่ง" ของตำแหน่งนั้น
     · แก้อะไรได้    → พร็อพ onNewLead/onNewPermitJob/onPatchJob ที่ส่ง null เมื่อไม่มีสิทธิ์
   อย่าเอาการซ่อนตามชื่อตำแหน่งกลับมาใส่ที่นี่ — รายการนี้คุมสิทธิ์เข้าหน้าด้วย (ดู allowed ข้างล่าง)
   ตัดออกจากที่นี่ = กดเข้าหน้าไม่ได้ ไม่ใช่แค่ไม่เห็นเมนู ถ้าจะซ่อนแต่เมนูให้ใช้ธง hidden */

/* งานนี้เป็นของช่างที่กรองอยู่ไหม — "__none" คือกรองเอาเฉพาะงานที่ยังไม่ได้มอบหมายให้ใคร
   งานที่ผูกไว้กับช่างที่ถูกลบไปแล้ว (ไม่มีใน known) ให้นับเป็น "ยังไม่มอบหมาย" จะได้ไม่หายไปจากเมนู */
const techKey = (j, known) => (j.tech && (!known || known.has(j.tech)) ? j.tech : "__none");
const matchTech = (j, f, known) => techKey(j, known) === f;
/* วันเริ่มติดตั้งของงาน — ตัวกรอง "ยังไม่นัดวันติดตั้ง" ใช้ค่านี้ตัดสิน (ไม่ใช้ deadline) */
const instDate = (j) => (window.SF.installDate ? window.SF.installDate(j) : "");

const ACCENTS = {
  /* สีหลักของแบรนด์ flash+solar — หยิบจากหกเหลี่ยมในโลโก้โดยตรง
     (คีย์ phithan ยังอยู่เพื่อให้ค่าที่ผู้ใช้เคยเลือกไว้ก่อนรีแบรนด์ไม่พัง — ชี้มาที่ชุดใหม่) */
  flash:   { primary: "#1B9B75", dark: "#0A4D68", soft: "#E3F4EE", bright: "#22B36A" },
  phithan: { primary: "#1B9B75", dark: "#0A4D68", soft: "#E3F4EE", bright: "#22B36A" },
  emerald: { primary: "#10B981", dark: "#047857", soft: "#D6F5E6", bright: "#34D399" },
  amber:   { primary: "#F59E0B", dark: "#B45309", soft: "#FEF1D8", bright: "#FBBF24" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "accent": "flash",
  "density": "comfy",
  "sidebar": "full",
  "cardStyle": "soft"
}/*EDITMODE-END*/;

/* โหมดกราไฟต์: primary เป็นเขียวแบรนด์ที่สว่างพอสำหรับพื้นเทาเข้ม และยังรองรับตัวอักษรขาวบนปุ่ม
   ส่วน dark ใช้เป็นสีตัวอักษรบนพื้นมืด จึงต้องสว่างกว่า primary (กลับด้านกับโหมดปกติ)
   ต้องตั้งผ่าน JS เพราะตัวแปรพวกนี้ถูกเขียนเป็น inline style บน <html> (ชนะกฎใน CSS) */
const AURORA = { primary: "#1B9B75", dark: "#3FD3A6", soft: "rgba(27,155,117,.20)", bright: "#22B36A" };

function applyTheme(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.mode);
  root.setAttribute("data-density", t.density);
  root.setAttribute("data-cardstyle", t.cardStyle);
  const aurora = t.mode === "aurora";
  const a = aurora ? AURORA : (ACCENTS[t.accent] || ACCENTS.flash);
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-dark", aurora ? a.dark : (t.mode === "dark" ? a.bright : a.dark));
  root.style.setProperty("--primary-soft", aurora ? a.soft : (t.mode === "dark" ? "rgba(34,179,106,.16)" : a.soft));
  root.style.setProperty("--primary-bright", a.bright);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", aurora ? "#131315" : "#1B9B75");
}

/* ── responsive helper — uses matchMedia so it works even when resize events
   are suppressed (e.g. in preview/test environments) ── */
function useIsMobile(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}

function LoadingScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "transparent", gap: 18 }}>
      <window.BrandLockup size={92} stack />
      <div style={{ display: "flex", gap: 7 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)",
            animation: "pgBounce 1.1s " + (i * 0.2) + "s infinite ease-in-out alternate" }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>กำลังโหลดข้อมูล...</div>
      <style>{`@keyframes pgBounce { from { transform: translateY(0); opacity: .4; } to { transform: translateY(-10px); opacity: 1; } }`}</style>
    </div>
  );
}

function App() {
  const store = useJobStore();
  const stock = useStockStore();
  const techStore = useTechStore();
  const brandStore = useBrandStore();
  const auth = useAuthStore();
  const notif = useNotifStore();
  const priceStore = usePriceStore();
  const ampStore = useAmpacityStore();
  const condStore = useConduitDefaults();   // ค่าตั้งต้นอุปกรณ์ท่อร้อยสายของบริษัท
  const omStore = useOmTiers();             // ตารางราคาล้างแผง / งาน O&M ตามขนาดระบบ
  const apptStore = useSurveyApptStore();
  const leadStore = useSurveyLeadStore();   // ลูกค้าที่ขอให้ไปสำรวจ — แยกจากฐานข้อมูลงาน
  const quoteStore = useQuoteStore();       // ใบเสนอราคา — แขวนได้ทั้งกับลูกค้าสำรวจและกับงาน
  const fileFlags = useJobFileFlags();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("overview");
  /* หน้า "งานขาย" เหลือมุมเดียวคือบอร์ด — มุม "รายการ" (LeadsView) ถอดออกจากแอปแล้ว
     ทั้งสองมุมเปิดใบลูกค้าใบเดียวกัน (LeadDrawer) ที่มีปุ่มครบเท่ากัน รายการจึงเป็นแค่ทรงที่วางต่างกัน
     โค้ดหน้ายังอยู่ที่ views-lead.jsx ถ้าอยากได้คืน — ท่าเดียวกับ SurveyView ที่ถอดไปก่อนหน้านี้
     สเตต leadFocus ที่คู่กับมุมนั้นถูกเอาออกด้วย มันไม่เคยถูกตั้งค่าจากที่ไหนอยู่แล้ว */
  /* ลูกค้าที่กดมาจากการ์ดขายบนบอร์ดงาน — เปิดเป็นแผงทับบอร์ด ไม่ต้องเด้งออกไปหน้าอื่น */
  const [boardLead, setBoardLead] = React.useState(null);
  /* วางแผง 3D ของลูกค้าที่ยังไม่เป็นงาน — เปิดทับแผงลูกค้า ปิดแล้วกลับมาที่ใบเดิม */
  const [plan3dLead, setPlan3dLead] = React.useState(null);
  /* ใบลูกค้าใหม่ที่กำลังกรอก — อยู่ระดับแอป เปิดทับหน้าที่กดมา ไม่เด้งไปหน้าอื่น
     เดิมพาไปหน้างานขายก่อนเสมอ แต่คนกดปุ่มนี้จากบอร์ดกำลังดูบอร์ดอยู่ กดเพิ่มชื่อเสร็จก็ต้องกดกลับมาเอง
     ฟอร์มเป็น LeadModal ตัวเดียวกับที่หน้างานขายใช้ จึงไม่มีร่างที่สองให้ต้องตามแก้ */
  const [leadNew, setLeadNew] = React.useState(null);
  /* ประกาศไว้ตรงนี้ ไม่ใช่ท้ายไฟล์ — salesBoard ข้างล่างอ่านค่านี้ตอนสร้าง element
     const ที่ประกาศทีหลังยังอยู่ใน temporal dead zone ตอนนั้น = ReferenceError ตอนเปิดหน้างานขาย */
  const newLead = React.useCallback(() => {
    setLeadNew(leadStore.blank());
  }, [leadStore]);
  /* ชุดข้อมูลขออนุญาตที่เปิดอยู่ — อยู่ระดับแอป จะได้เปิดได้ทั้งจากบอร์ดและจากในใบงาน */
  const [permitReview, setPermitReview] = React.useState(null);
  /* ใบเสนอราคาที่เปิดอยู่ — เหตุผลเดียวกัน เปิดได้ทั้งจากหน้าลูกค้าสำรวจและจากในใบงาน */
  const [quoteOpen, setQuoteOpen] = React.useState(null);   // { quote, jobId }
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState(null);
  const [quickFilter, setQuickFilter] = React.useState(null);
  const [techFilter, setTechFilter] = React.useState(null);   // id ช่างผู้รับผิดชอบ · "__none" = ยังไม่มอบหมาย
  const [delayedOnly, setDelayedOnly] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(null); // {job, isNew}
  const [surveyJob, setSurveyJob] = React.useState(null); // งานที่กำลังเปิด wizard สำรวจหน้างาน
  const [surveyAppt, setSurveyAppt] = React.useState(null); // นัดหมายที่เปิด wizard มา (ถ้ามี) — ใช้ลิงก์ + ปิดสถานะ
  const [reportJob, setReportJob] = React.useState(null);   // งาน/ลูกค้าที่กำลังเปิดรายงานผลสำรวจ
  const [techMgr, setTechMgr] = React.useState(false);
  const [brandMgr, setBrandMgr] = React.useState(false);
  const [userMgr, setUserMgr] = React.useState(false);
  const [mySign, setMySign] = React.useState(false); // โปรไฟล์ของฉัน (รูป · ติดต่อ · ลายเซ็น)
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [briefingOpen, setBriefingOpen] = React.useState(false); // สรุปงานวันนี้ (เปิดครั้งแรกของวัน)
  const [mapOpen, setMapOpen] = React.useState(false); // แผนที่งาน (popup จากปุ่มใน header)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  // โหมดออโรรา — สกินพิเศษ สลับเองได้ · จำค่าใน localStorage (ใช้ได้บนเว็บจริง ไม่พึ่ง edit-mode)
  const [aurora, setAurora] = React.useState(() => {
    const s = localStorage.getItem("pg-aurora");
    return s == null ? (TWEAK_DEFAULTS.mode === "aurora") : s === "1";
  });
  /* ตอนสลับธีม ใส่คลาส theme-anim ไว้ชั่วครู่ เพื่อให้ "สี" ของทั้งหน้าไล่เปลี่ยนแทนที่จะกระพริบทีเดียว
     ใส่ถาวรไม่ได้ เพราะ transition บนทุกอิลิเมนต์จะไปหน่วงอนิเมชันอื่น ๆ ของหน้าทั้งหมด
     ระยะเวลาต้องยาวกว่าค่า transition ใน index.html เล็กน้อย ไม่งั้นจะถูกตัดกลางคัน */
  const toggleAurora = React.useCallback(() => setAurora((d) => {
    const n = !d; localStorage.setItem("pg-aurora", n ? "1" : "0");
    const el = document.documentElement;
    el.classList.add("theme-anim");
    clearTimeout(window.__thmT);
    window.__thmT = setTimeout(() => el.classList.remove("theme-anim"), 460);
    return n;
  }), []);

  // ย่อ/ขยายแถบเมนูด้านข้าง (เดสก์ท็อป) — จำค่าใน localStorage
  const [collapsed, setCollapsed] = React.useState(() => {
    const s = localStorage.getItem("pg-sidebar");
    return s == null ? (TWEAK_DEFAULTS.sidebar === "icons") : s === "1";
  });
  const toggleCollapsed = React.useCallback(() => setCollapsed((c) => { const n = !c; localStorage.setItem("pg-sidebar", n ? "1" : "0"); return n; }), []);
  const isMobile = useIsMobile(); // force App re-render when mobile↔desktop breakpoint changes

  /* สิทธิ์/ตัวตนของผู้ใช้ที่ล็อกอินอยู่ — role เป็น "รายการตำแหน่ง" เพราะคนหนึ่งคนถือได้หลายตำแหน่ง
     can(role, ...) รับได้ทั้งรายการและตำแหน่งเดียว จึงเรียกเหมือนเดิมได้ทุกที่ */
  const role   = React.useMemo(() => (auth.current ? userRoles(auth.current) : []), [auth.current]);
  /* บัญชีขออนุญาตกรอง/เรียงด้วยขั้นของใบขออนุญาต ที่เหลือใช้ขั้นติดตั้งตามเดิม */
  const stageKeyOf = React.useCallback((j) => (isPermitOnly(role) ? permitStageKey(j) : j.stage), [role]);
  const techId = auth.current ? auth.current.techId : null;
  /* ขอบเขตงานที่เห็น — ตั้งได้เองในหน้า "สิทธิ์ตำแหน่ง" (ทุกงาน / งานที่รับผิดชอบ / งานที่ตัวเองเปิด / เฉพาะบางขั้น)
     roleCfg.rev ต้องอยู่ใน deps ด้วย เพราะ PERMS/ROLE_SCOPE เป็นตารางกลางที่ถูกเขียนทับเมื่อมีคนแก้สิทธิ์ */
  const roleCfg = useRoleConfig();
  const scope   = React.useMemo(() => jobScopeOf(role), [role, roleCfg.rev]);
  const inScope = React.useCallback((j) => !auth.current || jobInScope(j, scope, auth.current), [scope, auth.current]);
  const ownOnly = !!auth.current && !scope.all;

  // Auto-close sidebar when resizing to desktop
  React.useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  // เมื่อล็อกอิน/เปลี่ยนสิทธิ์ — ถ้าหน้าปัจจุบันไม่อยู่ในสิทธิ์ ให้ไปหน้าเริ่มต้นตาม role
  React.useEffect(() => {
    if (!auth.current) return;
    const allowed = navForRole(role, techId).map((n) => n.key);
    if (!allowed.includes(view)) setView(allowed[0] || "overview");
  }, [auth.current, role, techId]);

  React.useEffect(() => { applyTheme(Object.assign({}, t, { mode: aurora ? "aurora" : "light" })); }, [t, aurora]);

  const jobs = React.useMemo(() => store.jobs.map((j) => {
    const f = fileFlags[j.id] || {};
    return { ...j, hasDesign: !!f.design, hasBoq: !!f.boq };
  }), [store.jobs, fileFlags]);
  /* รายชื่อ id ช่างที่ยังมีอยู่จริง — ใช้เช็คว่างานผูกกับช่างที่ถูกลบไปแล้วหรือเปล่า */
  const techIds = React.useMemo(() => new Set((techStore.techs || []).map((x) => x.id)), [techStore.techs]);
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (!jobMatchQ(j, q)) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      if (stageFilter && stageKeyOf(j) !== stageFilter) return false;
      if (delayedOnly && !j.delayed) return false;
      if (quickFilter === "active" && j.stage === "done") return false;
      if (quickFilter === "delayed" && !j.delayed) return false;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return false;
      if (quickFilter === "battery" && !j.battery) return false;
      if (quickFilter === "problem" && !(j.problem && j.stage !== "done")) return false;
      if (quickFilter === "noinstall" && !(j.stage !== "done" && !instDate(j))) return false;
      if (techFilter && !matchTech(j, techFilter, techIds)) return false;
      if (!inScope(j)) return false; // ขอบเขตงานตามตำแหน่ง
      return true;
    });
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techFilter, techIds, inScope, stageKeyOf]);

  /* งานทั้งหมดที่คนนี้มีสิทธิ์เห็น — ผ่านขอบเขตตามตำแหน่ง แต่ไม่ผ่านตัวกรองบนหัวจอ
     ตัวเลขที่บอกว่า "ทั้งหมดในระบบ" ต้องไม่ขยับเวลามีคนพิมพ์ค้นหาหรือกรองขั้นงานค้างไว้ */
  const scopedJobs = React.useMemo(() => jobs.filter(inScope), [jobs, inScope]);

  /* นับงานต่อช่าง สำหรับเมนูกรอง "ช่างผู้รับผิดชอบ" — ใช้ฟิลเตอร์อื่นทั้งหมดยกเว้น techFilter เอง
     จะได้เห็นว่าภายใต้เงื่อนไขที่กรองอยู่ ช่างแต่ละคนมีงานกี่งาน */
  const techCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {}; let all = 0;
    jobs.forEach((j) => {
      if (!jobMatchQ(j, q)) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (stageFilter && stageKeyOf(j) !== stageFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (quickFilter === "problem" && !(j.problem && j.stage !== "done")) return;
      if (quickFilter === "noinstall" && !(j.stage !== "done" && !instDate(j))) return;
      if (!inScope(j)) return;
      const k = techKey(j, techIds);
      c[k] = (c[k] || 0) + 1; all++;
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techIds, inScope, stageKeyOf]);

  // นับงานต่อขั้น (Flow) สำหรับชิปกรอง — ใช้ฟิลเตอร์อื่นทั้งหมดยกเว้น stageFilter เอง
  const stageCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {}; let all = 0;
    jobs.forEach((j) => {
      if (!jobMatchQ(j, q)) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (quickFilter === "problem" && !(j.problem && j.stage !== "done")) return;
      if (quickFilter === "noinstall" && !(j.stage !== "done" && !instDate(j))) return;
      if (techFilter && !matchTech(j, techFilter, techIds)) return;
      if (!inScope(j)) return;
      { const k = stageKeyOf(j); c[k] = (c[k] || 0) + 1; all++; }
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, delayedOnly, quickFilter, techFilter, techIds, inScope, stageKeyOf]);

  // แจ้งเตือนงานล่าช้าตามขั้น (Flow) — คำนวณสด: tech เห็นเฉพาะงานตัวเอง, admin/manager เห็นทุกงาน
  const lateAlerts = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const out = [];
    mine.forEach((j) => (j.lateStages || []).forEach((ls) => out.push({ jobId: j.id, jobName: j.name, stage: ls })));
    return out.sort((a, b) => b.stage.daysLate - a.stage.daysLate);
  }, [jobs, inScope]);

  // งานติดตั้งวันนี้ (ตารางงาน) — today อยู่ในช่วงวันนัดติดตั้ง [startDate..deadline]
  // ใช้ "ช่วงวันนัดติดตั้ง" เป็นตารางงานเดียว (ไม่ใช้ stageDates รายขั้นอื่นซึ่งเป็นแค่สถานะ)
  const todayTasks = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const today = window.SF.TODAY;
    const inst = window.SF.STAGES.find((s) => s.key === "install");
    const out = [];
    mine.forEach((j) => {
      if (j.stage === "done") return;
      const s0 = j.startDate, e0 = j.deadline || j.startDate;
      if (!s0 || today < s0 || today > e0) return;
      let kind;
      if (s0 === e0) kind = "both";
      else if (today === s0) kind = "start";
      else if (today === e0) kind = "end";
      else kind = "progress";
      out.push({ job: j, stage: inst, kind });
    });
    return out;
  }, [jobs, inScope]);

  // ตารางงานของฉัน (วันนี้ + กำลังจะถึง) — นัดสำรวจ + งานติดตั้งของคนที่ล็อกอิน → โชว์บนหน้าภาพรวม
  // ยุบงานโปรเจคเดียวกันให้เหลือแถวเดียว (เก็บช่วงวัน start–end) · เอาแค่ 3 แถวแรก
  // ตอนนี้ยังไม่มีใครใช้ — หน้าแรกเป็น LeadOverview หน้าเดียวซึ่งใช้ OvCalendar แทน
  // เก็บไว้เพราะถ้าจะเอาแถบ "ตารางงานของฉัน" กลับขึ้นหน้าแรก ต่อเข้าไปได้เลยไม่ต้องเขียนใหม่
  const myScheduleItems = React.useMemo(() => {
    const all = window.buildMySchedItems ? window.buildMySchedItems(apptStore.appts, jobs, techId) : [];
    const today = window.SF.TODAY;
    const byJob = {}; const out = [];
    all.forEach((it) => {
      if (it.type === "job") {
        const id = it.job.id, c = ((it.stages || [])[0] || {}).color;
        if (!byJob[id]) { byJob[id] = { type: "job", key: "j-" + id, job: it.job, start: it.day, end: it.dayEnd || it.day, ts: it.ts, color: c }; out.push(byJob[id]); }
      } else {
        out.push({ type: "survey", key: it.key, a: it.a, start: it.day, end: it.day, ts: it.ts });
      }
    });
    return out
      .filter((it) => it.end && it.end >= today)              // ยังไม่จบ (วันนี้เป็นต้นไป)
      .sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.ts - b.ts)
      .slice(0, 3);                                            // เอาแค่ 3 แถว
  }, [apptStore.appts, jobs, techId]);

  const loading = store.loading || stock.loading || auth.loading;

  // เปิดสรุปงานวันนี้ครั้งแรกของวัน (ถ้ามีงานเลยกำหนด หรือมีกำหนดวันนี้)
  React.useEffect(() => {
    if (loading || !auth.current) return;
    const today = window.SF.TODAY;
    if (localStorage.getItem("sf_briefing_seen") === today) return;
    if (lateAlerts.length === 0 && todayTasks.length === 0) return;
    setBriefingOpen(true);
  }, [loading, auth.current, lateAlerts.length, todayTasks.length]);

  // ราคารวมสำหรับ BOQ — คลังสินค้าเป็นต้นทางเดียว (ชนะ); boqPrices เป็น fallback ของเก่า
  /* ของชิ้นเดียวกันอาจมีหลายยี่ห้อ/หลายรุ่น ราคาไม่เท่ากัน — เก็บทุกตัวไว้ใน variants
     ตัวที่อยู่ระดับบน (code/price/unit) คือตัวที่ใช้เป็นค่าตั้งต้น (ตัวแรกในคลัง)
     ใบถอดของเลือกเองได้ว่าจะใช้ตัวไหน เก็บไว้ที่ b.pick */
  const effPriceMap = React.useMemo(() => {
    const mk = window.BOQ ? window.BOQ.matKey : (x) => x;
    const m = {};
    Object.keys(priceStore.priceMap).forEach((n) => { m[mk(n)] = priceStore.priceMap[n]; }); // legacy ก่อน
    const put = (k, v, alias) => {
      const cur = m[k];
      if (cur && cur.variants) { if (!cur.variants.some((x) => x.id === v.id)) cur.variants.push(v); }
      // ชื่อจริงชนะเสมอ — ชื่อเก่า (alias) เข้าได้เฉพาะช่องที่ยังว่าง จะได้ไม่ไปทับของที่มีชื่อนั้นอยู่จริง
      else if (!alias || !cur) m[k] = Object.assign({}, v, { variants: [v] });
    };
    const mats = (stock.items || []).filter((s) => s.name);
    mats.forEach((s) => {                                                                   // คลังทับ
      const v = { id: s.id, sku: s.sku || "", code: s.sku || "", price: +s.price || 0, unit: s.unit || "",
        brand: s.brand || "", model: s.model || "", label: window.SF.matVariantLabel(s) };
      put(mk(s.name), v, false);
    });
    /* ชื่อเก่า/ชื่อพ้อง (aka) — เปลี่ยนชื่อของในคลังแล้ว ใบถอดของที่ทำไว้ยังหาราคาเจอ
       ทำรอบสองแยก เพื่อให้ชื่อจริงของทุกตัวถูกจองก่อน */
    mats.forEach((s) => {
      if (!(s.aka || []).length) return;
      const v = { id: s.id, sku: s.sku || "", code: s.sku || "", price: +s.price || 0, unit: s.unit || "",
        brand: s.brand || "", model: s.model || "", label: window.SF.matVariantLabel(s) };
      s.aka.forEach((n) => { if (n) put(mk(n), v, true); });
    });
    return m;
  }, [stock.items, priceStore.priceMap]);

  // ลงทะเบียนสเปคแผง + อินเวอร์เตอร์จากคลังสินค้า → ให้ตัวคำนวณ BOQ ใช้
  React.useEffect(() => {
    if (!window.BOQ) return;
    /* ของที่อยู่ในหมวดย่อย (เช่น แผง › AIKO) เก็บคีย์หมวดย่อยไว้ในช่อง cat
       จึงต้องแปลงกลับเป็นหมวดหลักก่อนกรอง ไม่งั้นแผงในหมวดย่อยจะหายไปจากดรอปดาวน์ทั้งหมด */
    const inCat = (s, k) => window.SF.mainCatOf(s.cat) === k;
    /* ชื่อหมวดย่อยที่ของชิ้นนั้นอยู่ (เช่น แผง › AIKO) — เอาไปจัดกลุ่มในดรอปดาวน์เลือกรุ่น
       ของที่อยู่หมวดหลักเฉย ๆ คืนค่าว่าง แล้วดรอปดาวน์จะเอาไปกองรวมกันท้ายสุด */
    const subTh = (s) => { const c = window.SF.STOCK_CAT_BY[s.cat]; return c && c.parent ? c.th : ""; };
    if (window.BOQ.setPanels) window.BOQ.setPanels((stock.items || []).filter((s) => inCat(s, "panel") && s.name)
      .map((s) => ({ model: s.name, group: subTh(s), wp: s.wp, frame: s.frame, width: s.width, length: s.length,
        voc: s.voc, isc: s.isc, vmp: s.vmp, imp: s.imp,
        tcVoc: s.tcVoc, tcIsc: s.tcIsc, tcPmax: s.tcPmax, noct: s.noct,
        deg1: s.deg1, degY: s.degY, cells: s.cells, fuseA: s.fuseA, halfCut: s.halfCut })));
    if (window.BOQ.setInverters) window.BOQ.setInverters((stock.items || []).filter((s) => inCat(s, "inverter") && s.name)
      .map((s) => ({ model: s.name, group: (s.brand || "").trim() || subTh(s), type: s.invType, kw: s.invKw, phase: s.invPhase, inputs: s.invInputs, maxPv: s.invMaxPv, outA: s.invOutA, mpptVmin: s.mpptVmin, mpptVmax: s.mpptVmax, maxVdc: s.maxVdc, maxInA: s.maxInA, maxIscA: s.maxIscA, maxMpptA: s.maxMpptA,
        strPerMppt: s.invStrPerMppt, eff: s.invEff, effEuro: s.invEffEuro,
        vStart: s.vStart, vRated: s.vRated, maxAcKw: s.invMaxAcKw,
        dimW: s.invDimW, dimH: s.invDimH, dimD: s.invDimD, mount: s.invMount })));
    /* ตัวคุมแผง (Smart Module Controller) — สเปคมาจากคลังเหมือนแผงและอินเวอร์เตอร์ */
    if (window.BOQ.setOptimizers) window.BOQ.setOptimizers((stock.items || []).filter((s) => window.SF.isOptimizerCat(s.cat) && s.name)
      .map((s) => ({ model: s.name, group: (s.brand || "").trim() || subTh(s), w: s.optW, vInMax: s.optVinMax, mpptMin: s.optMpptMin, mpptMax: s.optMpptMax,
        iscMax: s.optIscMax, vOutMax: s.optVoutMax, iOutMax: s.optIoutMax, eff: s.optEff, vOff: s.optVoff, perPanel: s.optPerPanel,
        minPerStr: s.optMinPerStr, maxPerStr: s.optMaxPerStr, pairs: s.optPairs })));
    /* ต้องผูกกับ stock.cats ด้วย — ถ้ารายชื่อหมวดย่อยมาถึงทีหลังรายการของ mainCatOf() จะยังแปลงคีย์ไม่ออก */
  }, [stock.items, stock.cats]);

  // ลงทะเบียนค่าพิกัดกระแสสายไฟที่แก้จากเล่ม วสท. (ทับค่าเริ่มต้น) → ให้ตัวคำนวณ BOQ ใช้
  React.useEffect(() => {
    if (window.BOQ && window.BOQ.setAmpacity) window.BOQ.setAmpacity(ampStore.overrides || {});
  }, [ampStore.overrides]);

  /* ค่าตั้งต้นอุปกรณ์ท่อร้อยสาย → ใบ BOQ ใหม่ทุกใบเริ่มจากค่านี้
     ใบที่ถอดไว้แล้วไม่ขยับตาม เพราะ BOQ.mergeBOQ ให้ของที่บันทึกไว้ชนะเสมอ */
  React.useEffect(() => {
    if (window.BOQ && window.BOQ.setConduitDefaults) window.BOQ.setConduitDefaults(condStore.val);
  }, [condStore.val]);
  /* ตารางราคา O&M → ช่องที่เว้นว่างในการ์ด O&M ของทุกใบคิดจากตารางนี้ */
  React.useEffect(() => {
    if (window.BOQ && window.BOQ.setOmTiers) window.BOQ.setOmTiers(omStore.val);
  }, [omStore.val]);

  const closeSidebar = () => setSidebarOpen(false);
  const openJob = (j) => setSelected(j.id);
  const openSurvey = (j, appt) => { setSurveyJob(j); setSurveyAppt(appt || null); };

  /* ลูกค้าสำรวจ → งานติดตั้งจริง (กดตอนลูกค้าตกลงเท่านั้น — ฐานข้อมูลงานจึงมีแต่งานที่เกิดจริง)
     ย้ายทั้งแบบสำรวจและรูป checklist ไปกับงานใหม่ แล้วผูกนัดสำรวจเดิมเข้ากับงาน */
  const convertLead = (lead) => {
    if (!can(role, "addJob")) { alert("คุณไม่มีสิทธิ์สร้างงาน"); return; }
    const rec = Object.assign(store.blank(), {
      name: lead.name || "", phone: lead.phone || "", address: lead.address || "",
      /* ฝั่งลูกค้าเรียก biz (โรงงาน/ธุรกิจ) ฝั่งงานเรียก project — เก็บเป็นคำของฝั่งงานตั้งแต่ตอนแปลง
         ไม่งั้นใบงานจะมีประเภทที่ตารางงานไม่รู้จัก แล้วตัวกรอง/ป้ายประเภทอ่านไม่ออก */
      type: lead.type === "biz" ? "project" : (lead.type || "home"), note: lead.note || "",
    });
    if (auth.current) { rec.createdBy = auth.current.id; rec.createdByName = auth.current.name || ""; }
    if (lead.province) rec.province = lead.province;
    if (lead.phase) rec.phase = lead.phase;
    if (lead.roof) rec.roof = lead.roof;
    if (lead.survey) rec.survey = lead.survey;
    /* ของที่เซลล์กรอกไว้ต้องเดินทางไปกับงานด้วย ไม่งั้นวิศวกรต้องถามซ้ำทั้งหมด
       ขนาดที่คาดเป็นตัวตั้งต้นของงาน (แก้ทีหลังได้) · เจ้าของลูกค้าติดไปเป็นเซลล์ประจำงาน */
    if (+lead.expKwp > 0) rec.kw = +lead.expKwp;
    if (lead.ownerId) { rec.salesId = lead.ownerId; rec.salesName = lead.ownerName || ""; }
    /* BOQ ที่ถอดไว้ตอนเสนอราคาเป็นของงานเดียวกัน ติดไปกับงานเลย ไม่ต้องถอดใหม่ */
    if (lead.boq) rec.boq = lead.boq;
    store.upsert(rec);
    if (window.moveSurveyPhotos) window.moveSurveyPhotos(lead.id, rec.id);
    /* ไฟล์แบบที่แนบไว้ตอนยังเป็นลูกค้า ต้องตามไปอยู่ใต้เลขงาน ไม่งั้นเปิดใบงานแล้วไฟล์หายทั้งชุด */
    if (window.moveJobFiles) window.moveJobFiles(lead.id, rec.id);
    /* แบบ 3D ที่ปั้นไว้ตอนยังเป็นงานขายต้องตามไปกับงานด้วย ไม่งั้นต้องปั้นใหม่ทั้งหมด */
    if (window.movePlan3d) window.movePlan3d(lead.id, rec.id);
    leadStore.patch(lead.id, Object.assign({ jobId: rec.id }, window.salesStagePatch ? window.salesStagePatch("won") : { status: "won" }));
    /* ใบเสนอราคาที่ลูกค้าตกลงแล้วต้องตามมาที่งาน ไม่งั้นเปิดใบงานแล้วไม่รู้ว่าขายไปเท่าไร */
    (quoteStore.quotes || []).forEach((q) => {
      if (q.leadId === lead.id) quoteStore.patch(q.id, { jobId: rec.id, refCode: rec.code });
    });
    (apptStore.appts || []).forEach((a) => {
      if (a.leadId === lead.id) apptStore.upsert(Object.assign({}, a, { projectId: rec.id, jobCode: rec.code }));
    });
    setView(listView()); setSelected(rec.id);
  };

  /* ใบลูกค้าที่งานนี้เกิดมาจาก — ผูกกันด้วย lead.jobId ตั้งแต่ตอนกดแปลง */
  const leadOfJob = (job) => (leadStore.leads || []).find((l) => l.jobId === (job || {}).id) || null;

  /* ย้อนงานกลับไปเป็นงานขาย — ทางกลับของ convertLead
     ใช้ตอนกดแปลงเร็วไปหรือลูกค้ายังไม่ตกลงจริง งานจะได้ไม่ไปนั่งในฐานข้อมูลงาน
     ของที่ย้ายตามงานไปตอนแปลง (รูปสำรวจ · ไฟล์แบบ · แบบ 3D · ใบเสนอราคา · นัด)
     ต้องย้ายกลับให้ครบ ไม่งั้นใบลูกค้าจะกลับมาเป็นใบเปล่า
     ตัวงานลงถังขยะ ไม่ได้ลบถาวร กดผิดยังกู้คืนได้ */
  const revertJobToLead = (job) => {
    if (!can(role, "delJob")) { alert("คุณไม่มีสิทธิ์ย้ายงานออกจากฐานข้อมูลงาน"); return; }
    const lead = leadOfJob(job);
    if (!lead) { alert("งานนี้ไม่ได้มาจากงานขาย จึงย้อนกลับไม่ได้"); return; }
    setRevertAsk({ job: job, lead: lead });
  };
  const doRevertJob = (job, lead) => {
    if (window.moveSurveyPhotos) window.moveSurveyPhotos(job.id, lead.id);
    if (window.moveJobFiles) window.moveJobFiles(job.id, lead.id);
    if (window.movePlan3d) window.movePlan3d(job.id, lead.id);
    /* กลับไปยืนที่ขั้น "ต่อรอง / รอตัดสินใจ" ไม่ใช่ "ลูกค้าใหม่"
       เพราะงานเดินมาถึงขั้นแปลงเป็นงานแล้ว ถอยไปสุดทางจะเหมือนเพิ่งรู้จักกัน */
    const back = Object.assign({ jobId: "" }, window.salesStagePatch ? window.salesStagePatch("nego") : { status: "open" });
    /* ของที่กรอกเพิ่มหลังแปลงเป็นงานต้องติดกลับไปกับใบลูกค้าด้วย ไม่งั้นหายไปกับงานที่ลงถังขยะ */
    if (job.survey) back.survey = job.survey;
    if (job.boq) back.boq = job.boq;
    if (job.kw && !(+lead.expKwp > 0)) back.expKwp = job.kw;
    (quoteStore.quotes || []).forEach((q) => {
      if (q.jobId === job.id) quoteStore.patch(q.id, { jobId: "", refCode: "" });
    });
    (apptStore.appts || []).forEach((a) => {
      if (a.projectId === job.id) apptStore.upsert(Object.assign({}, a, { projectId: "", jobCode: "", leadId: a.leadId || lead.id }));
    });
    leadStore.patch(lead.id, back);
    store.remove(job.id, auth.current ? auth.current.name : "");
    setSelected((s) => s === job.id ? null : s);
    setRevertAsk(null);
  };

  /* เปิดใบเสนอราคา — ไม่มีใบเดิมก็สร้างใบใหม่จากข้อมูลลูกค้า/งานที่มีอยู่ให้เลย
     เซลล์จะได้ไม่ต้องพิมพ์ชื่อ-ที่อยู่ซ้ำ ซึ่งเป็นจุดที่พิมพ์ผิดบ่อยที่สุดบนเอกสารที่ส่งออกไปข้างนอก */
  /* target = ที่มาของสเปก (ผลสำรวจ + สเปกในใบงาน) ส่งต่อให้ QuoteEditor ใช้ปุ่ม "ดึงรุ่นอุปกรณ์" ได้
     ใบเก่าที่ทำไว้ก่อนสำรวจจะได้อัปเดตรุ่นแผง/อินเวอร์เตอร์ตามของจริงทีหลัง */
  const leadQuoteTarget = (lead) => ({
    kind: "lead", id: lead.id, code: lead.code, name: lead.name, phone: lead.phone,
    address: lead.address, province: lead.province, kwp: +lead.expKwp || 0,
    ownerId: lead.ownerId, ownerName: lead.ownerName,
    survey: lead.survey || null, phase: lead.phase, roof: lead.roof,
  });
  const jobQuoteTarget = (job) => ({
    kind: "job", id: job.id, code: job.code, name: job.name, phone: job.phone,
    address: job.address, province: job.province, kwp: +job.kw || 0,
    ownerId: job.salesId, ownerName: job.salesName,
    survey: job.survey || null, panels: +job.panels || 0, phase: job.phase, roof: job.roof,
    battery: job.battery, batSize: job.batSize, backup: job.backup,
  });
  /* ใบใหม่ตั้งต้นจากใบล่าสุดของรายนั้น — เสนอรอบสองมักแก้จากรอบแรกไม่กี่จุด
     ถ้าเปิดใบเปล่าทุกครั้ง ต้องพิมพ์รายการกับเงื่อนไขใหม่ทั้งใบ แล้วมักไม่ตรงกับรอบก่อน */
  const newQuote = (t, prev) => (prev && window.quoteFrom
    ? window.quoteFrom(prev, t, auth.current, quoteStore.quotes)
    : quoteStore.blank(t, auth.current));
  const openQuoteForLead = (lead, existing) => {
    const t = leadQuoteTarget(lead);
    if (existing) { setQuoteOpen({ quote: existing, jobId: lead.jobId || "", target: t }); return; }
    const prev = (window.quotesOfLead ? window.quotesOfLead(quoteStore.quotes, lead) : [])[0] || null;
    setQuoteOpen({ jobId: lead.jobId || "", target: t, quote: newQuote(t, prev) });
  };
  const openQuoteForJob = (job, existing) => {
    const t = jobQuoteTarget(job);
    if (existing) { setQuoteOpen({ quote: existing, jobId: job.id, target: t }); return; }
    const prev = (window.quotesOfJob ? window.quotesOfJob(quoteStore.quotes, job, leadStore.leads) : [])[0] || null;
    setQuoteOpen({ jobId: job.id, target: t, quote: newQuote(t, prev) });
  };
  const selectedJob = jobs.find((j) => j.id === selected) || null;

  /* คนที่ถือตำแหน่ง "ฝ่ายขออนุญาต" อย่างเดียว — บอร์ดขั้นงานติดตั้งไม่มีความหมายกับเขา
     (งานทุกใบจะกองอยู่ขั้น "เสร็จสิ้น" หมด) จึงให้เมนูบอร์ดงานแสดงบอร์ดขออนุญาตแทน */
  const permitOnly = isPermitOnly(role);
  /* หัวหน้าขออนุญาต: บอกจำนวนที่ต้องลงมือ ไม่ใช่จำนวนงานติดตั้งทั้งระบบซึ่งไม่เกี่ยวกับเขา */
  const permitHead = React.useMemo(() => {
    let sent = 0, filing = 0, todo = 0;
    jobs.forEach((j) => {
      const st = j.permit && j.permit.status;
      if (st === "sent") sent++;
      else if (st === "filing") filing++;
      else if (!st && j.stage === "done") todo++;
    });
    return "รอรับงาน " + sent + " · กำลังยื่น " + filing + " · ยังไม่เริ่มเก็บข้อมูล " + todo;
  }, [jobs]);
  const permitPage = view === "permit";

  const patchPermit = (id, fields) => {
    const j = store.raw.find((r) => r.id === id) || {};
    const cur = j.permit || {};
    store.patch(id, { permit: Object.assign({}, cur, fields) });
    /* ตีกลับแล้วต้องเด้งกลับหาช่างคนที่ส่งมา ไม่งั้นงานค้างจนกว่าเขาจะบังเอิญเปิดดูเอง */
    /* งานเก่าที่ไม่ได้บันทึกคนส่ง ให้เด้งหาช่างที่รับผิดชอบงานแทน ไม่งั้นไม่มีใครรู้ว่าถูกตีกลับ */
    const backTo = cur.submittedTechId || j.tech || null;
    if (fields.status === "rejected" && backTo) {
      notif.addNotif({
        toTechId: backTo, type: "permit", event: "reject", jobId: id, jobName: j.name,
        title: "ข้อมูลขออนุญาตถูกตีกลับ ต้องแก้ไข",
        body: (j.code || "") + " · " + (fields.rejectReason || "ต้องแก้ไขข้อมูล"),
      });
    }
  };

  const permitView = (
    <PermitQueueView jobs={jobs} search={search} stock={stock} currentUser={auth.current}
      /* กดการ์ด = เปิดใบงานทับบอร์ดไว้เลย ไม่ต้องสลับหน้า จะได้ปิดแล้วกลับมาที่เดิม */
      onOpenJob={(id) => setSelected(id)}
      onOpenReview={(id) => setPermitReview(id)}
      onPatchPermit={patchPermit} />
  );

  const salesOnly = isSalesOnly(role);
  const salesBoard = (
    <SalesBoardView leads={leadStore.leads} quotes={quoteStore.quotes} search={search} currentUser={auth.current}
      /* กดการ์ด = เปิดใบเต็มทับบอร์ด ใบเดียวกับที่เด้งจากบอร์ดงานและหน้ารายการ */
      onOpenLead={(l) => { if (l) setBoardLead(l.id); }}
      onNewLead={can(role, "leads") ? newLead : null}
      onPatchLead={(id, fields) => leadStore.patch(id, fields)} />
  );
  const salesHead = React.useMemo(() => {
    const L = leadStore.leads || [];
    let live = 0, late = 0;
    L.forEach((l) => {
      const k = window.salesStageKey ? window.salesStageKey(l) : (l.status || "open");
      if (k === "won" || k === "lost") return;
      live++;
      if (window.sOverdue && window.sOverdue(l.nextFollow)) late++;
    });
    return "ยังไล่อยู่ " + live + " ราย · เลยวันติดตาม " + late + " ราย";
  }, [leadStore.leads]);
  /* SalesOverview ไม่ได้ใช้เป็นหน้าแรกของเซลล์แล้ว — หน้าแรกเป็นหน้าเดียวกันหมดทุกตำแหน่ง
     ตัวคอมโพเนนต์ยังอยู่ที่ views-sales ถ้าจะเอากลับมาเป็นมุมหนึ่งของหน้า "งานขาย" ก็ทำได้ */

  /* หน้าแรกเป็นหน้าเดียวกันหมดทุกตำแหน่งตามที่สั่ง — LeadOverview
     เมื่อก่อนแยกสามทาง (เซลล์ = SalesOverview · หัวหน้า/แอดมิน = LeadOverview · ที่เหลือ = OverviewView)
     ตัวแปร leadRole กับ salesOverview ที่เคยคุมทางแยกถูกเอาออกแล้ว คืนได้ด้วยการกลับไปดู git
     ข้อมูลยังถูกคัดตามสิทธิ์อยู่ — jobs ที่ส่งเข้าไปคือ filtered/scopedJobs ของคนนั้น
     และปุ่มกระโดด (onGoPermit/onGoSales/onGoOm) ยังเป็น null เมื่อไม่มีสิทธิ์ */

  const onSave = (rec) => {
    const prev = store.raw.find((r) => r.id === rec.id);
    /* ประทับคนเปิดงานไว้ตอนบันทึกครั้งแรก — ขอบเขต "เฉพาะงานที่ตัวเองเปิด" ใช้ค่านี้ */
    if (!prev && !rec.createdBy && auth.current) { rec.createdBy = auth.current.id; rec.createdByName = auth.current.name || ""; }
    store.upsert(rec);
    // แจ้งเตือนช่างเมื่อถูกมอบหมายงาน (ช่างเปลี่ยน หรือเป็นงานใหม่ที่ระบุช่าง)
    if (rec.tech && (!prev || prev.tech !== rec.tech)) {
      notif.addNotif({
        toTechId: rec.tech, type: "assign", event: "assign", jobId: rec.id, jobName: rec.name,
        title: "ได้รับมอบหมายงานใหม่",
        /* ชื่องานขึ้นเป็นหัวใบแจ้งเตือนอยู่แล้ว บรรทัดนี้จึงบอกรายละเอียดที่เหลือ */
        body: [rec.code, rec.province, rec.kw ? rec.kw + " kW" : ""].filter(Boolean).join(" · "),
      });
    }
    setForm(null);
  };
  /* ลบงาน = ย้ายเข้าถังขยะก่อน กู้คืนได้ · ถามยืนยันในหน้าเอง ไม่ใช้ confirm() ของเบราว์เซอร์
     (ถ้าผู้ใช้เคยติ๊ก "ไม่ให้หน้านี้สร้างกล่องข้อความอีก" confirm จะคืน false ทันที = กดลบแล้วเงียบ) */
  const [permitJob, setPermitJob] = React.useState(null);   // งานที่กำลังเปิดแบบเก็บข้อมูลขออนุญาต
  const [blJob, setBlJob] = React.useState(null);           // งานที่กำลังเปิดแผงตั้งงวดงาน
  const [blRow, setBlRow] = React.useState(null);           // งวดที่ให้แผงกางไว้ตอนเปิด (มาจากหน้ารวม)
  const [dailyJob, setDailyJob] = React.useState(null);     // งานที่กำลังเปิดรายงานประจำวัน
  const [pmJob, setPmJob] = React.useState(null);           // งานที่กำลังเปิดสมุดตรวจรับและส่งมอบ
  const [omFocus, setOmFocus] = React.useState(null);       // ไซต์บริการที่ให้หน้า O&M เปิดขึ้นมาให้เลย
  /* ข้อมูลบริการหลังการขายสำหรับกระดิ่ง + ปุ่มในลิ้นชัก — โหนดเบา ๆ สามอัน เปิดค้างไว้ได้
     คนที่ไม่มีสิทธิ์ om จะไม่ฟังอะไรเลย (ส่ง false เข้าไป) */
  const omLive = window.useOmAlerts(can(role, "om"));
  /* ใบเบิกเงินสำหรับปุ่มในลิ้นชักใบงาน — โหนดเดียว เบา (รูปบิลแยกอยู่คนละโหนด)
     คนที่ไม่มีสิทธิ์ expense ไม่ฟังอะไรเลย */
  const [ecFocus, setEcFocus] = React.useState(null);        // งานที่ให้หน้าเบิกเงินเจาะให้เลย
  const ecLive = window.useEcLive ? window.useEcLive(can(role, "expense")) : { claims: [], byJob: {} };
  /* ── เลขท้ายเมนูซ้าย ──
     นับเฉพาะ "เรื่องที่ต้องลงมือ" ไม่ใช่ยอดรวมของหน้า — เลขที่เท่ากับจำนวนแถวในหน้า
     ไม่ได้บอกอะไรเลยและจะถูกมองข้ามภายในอาทิตย์เดียว
     ใช้เฉพาะสิ่งที่ App ฟังอยู่แล้ว (งาน · คลัง · O&M · นัดสำรวจ · ใบเบิก)
     ไม่เปิดโหนดใหม่เพื่อเลขนี้ — ขออนุญาตการไฟฟ้ากับรายงานประจำวันจึงยังไม่มีเลข
     เพราะต้องฟังทั้งต้นไม้เพิ่มอีกสองอันโดยที่หน้านั้นอาจไม่ถูกเปิดเลยทั้งวัน */
  const navBadges = React.useMemo(() => {
    const today = window.drToday ? window.drToday() : "";
    /* นัดเก็บเป็นเวลาเต็ม ต้องเทียบเฉพาะวันตามเขตเวลาเครื่อง ไม่ใช่ slice ท้าย ISO */
    const ymd = (v) => { const d = new Date(v); return isNaN(d.getTime()) || !window.drISO ? "" : window.drISO(d); };
    /* นัดที่ยัง "เปิด" อยู่ — สำรวจเสร็จ/ยกเลิก/เลื่อนแล้ว ถือว่าจบแล้วไม่ต้องเตือน */
    const live = (apptStore.appts || []).filter((a) => a && a.start
      && a.status !== "done" && a.status !== "canceled" && a.status !== "rescheduled");
    const claims = ecLive.claims || [];
    const meId = (auth.current || {}).id || null;
    /* ใบเบิกนับตามสิ่งที่ "คนนี้" ต้องทำต่อ ไม่ใช่ยอดใบทั้งระบบ
       คนอนุมัติเห็นใบที่รออนุมัติ · คนจ่ายเงินเห็นใบที่อนุมัติแล้วรอจ่าย
       คนทั่วไปเห็นใบของตัวเองที่ถูกตีกลับ ซึ่งต้องแก้แล้วส่งใหม่ */
    let ec = 0;
    if (window.ecCanApprove && window.ecCanApprove(role)) ec += claims.filter((c) => c.status === "sent").length;
    if (window.ecCanPay && window.ecCanPay(role)) ec += claims.filter((c) => c.status === "approved").length;
    /* ใบของตัวเองที่ยังไม่ได้ส่ง กับใบที่ถูกตีกลับ นับให้เจ้าของใบทุกคน
       สองสถานะนี้ไม่ซ้อนกับสองบรรทัดบน จึงบวกตรง ๆ ได้ไม่ต้องกลัวนับซ้ำ */
    ec += claims.filter((c) => meId && c.byId === meId && (c.status === "draft" || c.status === "rejected")).length;
    /* งานบริการ: นับ "ใบแจ้งซ่อมที่ยังไม่ปิด" กับ "ไซต์ที่ถึงรอบล้างแล้ว" ตรง ๆ
       ไม่ใช่ omSiteAlerts เพราะอันนั้นเก็บเฉพาะเรื่องที่เลยกำหนดหรือใกล้หมดประกัน
       ซึ่งทำให้ใบแจ้งซ่อมที่เพิ่งเปิดวันนี้ไม่ขึ้นเลข แม้เป็นงานที่ต้องลงมือที่สุด */
    const omTick = (omLive.tickets || []).filter((x) => !window.omTicketOpen || window.omTicketOpen(x)).length;
    const omClean = window.omCleanState
      ? (omLive.sites || []).filter((st) => st && st.active !== false
          && ["due", "overdue"].indexOf(window.omCleanState(st, (omLive.bySite || {})[st.id] || [], today).key) !== -1).length
      : 0;
    return {
      om: omTick + omClean,
      dispatch: live.filter((a) => { const d = ymd(a.start); return d && today && d < today; }).length,
      calendar: live.filter((a) => ymd(a.start) === today).length,
      expense: ec,
    };
  }, [omLive.tickets, omLive.sites, omLive.bySite, apptStore.appts, ecLive.claims, auth.current, role]);

  /* ── เปิดใบงานขออนุญาตโดยตรง ──
     งานเก่า/งานที่รับช่วงต่อติดตั้งเสร็จไปแล้ว ไม่เคยเดินผ่านบอร์ดขายและบอร์ดหน้างาน
     แต่ยังต้องเดินเรื่องการไฟฟ้า — ถ้าเปิดงานแบบปกติจะไปโผล่ขั้น "ออกแบบ"
     แล้วต้องลากผ่านทุกคอลัมน์กว่าจะถึงช่วงเอกสาร จึงเปิดที่ขั้นสุดท้ายให้เลย
     (ขั้นก่อนหน้าประทับว่าเสร็จแต่ไม่ใส่วันที่ปลอม — ไม่มีใครรู้ว่าทำวันไหนจริง) */
  const newPermitJob = React.useCallback(() => {
    if (!can(role, "addJob")) { alert("คุณไม่มีสิทธิ์สร้างงาน"); return; }
    const stages = window.SF.STAGES;
    const last = stages.length - 1;
    const rec = Object.assign(store.blank(), {
      stage: stages[last].key,
      hist: stages.map((sg, i) => ({
        key: sg.key, status: i < last ? "done" : "current",
        date: i === last ? window.SF.TODAY : null,
        at: i === last ? new Date().toISOString() : null,
        recorded: i === last, blocked: false,
      })),
    });
    setForm({ job: rec, isNew: true });
  }, [role, store]);

  const openExpense = React.useCallback((jobId) => {
    setSelected(null);
    setEcFocus({ jobId: jobId || null, at: Date.now() });
    setView("expense");
  }, []);
  const openOm = React.useCallback((a) => {
    setNotifOpen(false); setSelected(null);
    setOmFocus({ siteId: (a || {}).siteId || null, ticketId: (a || {}).ticketId || null, at: Date.now() });
    setView("om");
  }, []);
  /* ปุ่ม "รายงานวันนี้" อยู่บนการ์ดในบอร์ด ซึ่งลึกเกินกว่าจะส่ง props ลงไปถึง
     ฝากผู้ใช้ปัจจุบันไว้ให้การ์ดหยิบใช้ ฟอร์มจะได้รู้ว่าใครเขียนและอนุมัติได้ไหม */
  window.DR_ME = { role, user: auth.current };
  const [delAsk, setDelAsk] = React.useState(null);   // งานที่กำลังถามว่าจะย้ายเข้าถังขยะไหม
  const [revertAsk, setRevertAsk] = React.useState(null);   // { job, lead } ที่กำลังถามว่าจะย้อนกลับเป็นงานขายไหม
  const [trashOpen, setTrashOpen] = React.useState(false);
  const onDelete = (j) => {
    if (!can(role, "delJob")) { alert("คุณไม่มีสิทธิ์ลบงาน"); return; }
    setDelAsk(j);
  };
  // หน้ารายการงานที่ใช้เจาะดู — table เฉพาะ admin, role อื่นใช้บอร์ดงานแทน
  const navItems = React.useMemo(() => navForRole(role, techId), [role, techId]);
  const listView = () => (navItems.some((n) => n.key === "table") ? "table"
    : navItems.some((n) => n.key === "board") ? "board" : view);
  const goStage = (key) => { setStageFilter(key); setQuickFilter(null); setView(listView()); };
  const goKpi = (key) => { setQuickFilter(key); setStageFilter(null); setTypeFilter("all"); setDelayedOnly(false); setView(listView()); };

  const navTo = (v) => {
    /* สลับแท็บในเมนูเดียวกัน = ยังดูงานกองเดิมอยู่คนละมุม ตัวกรองจึงต้องติดไปด้วย
       ถ้าล้างทุกครั้ง คนที่กรอง "เฉพาะงานล่าช้า" ไว้แล้วสลับไปมุมตาราง จะได้งานทั้งบริษัทกลับมาเต็มจอ
       ข้ามไปคนละเมนูค่อยล้าง เพราะตัวกรองของหน้าเดิมไม่มีความหมายบนหน้าใหม่ */
    if (navTop(v) !== navTop(view)) { setStageFilter(null); setQuickFilter(null); }
    setView(v);
    closeSidebar();
  };


  if (loading) return <LoadingScreen />;
  if (!auth.current) return <LoginScreen authStore={auth} />;

  // แจ้งเตือนของช่างคนนี้ (admin/manager ไม่มี techId → ไม่มีกระดิ่งส่วนตัว)
  /* แจ้งเตือนของฉัน = ที่จ่าหน้าถึงตัวเรา + ที่จ่าหน้าถึง "คนที่มีสิทธิ์นี้" (เช่น งานขออนุญาตส่งถึงทุกคนในฝ่าย) */
  /* จ่าหน้าถึง "ผู้ใช้คนนี้" ด้วย — งานบริการมอบหมายให้ใครก็ได้ในระบบ ไม่ใช่เฉพาะคนที่ผูกกับช่าง */
  const myUid = auth.current ? auth.current.id : null;
  const myNotifs = notif.notifs.filter((n) => (techId && n.toTechId === techId) || (myUid && n.toUserId === myUid) || (n.toPerm && can(role, n.toPerm)));
  const unread   = myNotifs.filter((n) => !n.read).length;
  const bellCount = unread + lateAlerts.length + omLive.alerts.length;
  const openFromNotif = (n) => {
    /* กดใบที่ยุบรวมหลายครั้งไว้ ต้องอ่านครบทุกใบในกอง ไม่งั้นจุดค้างอยู่ทั้งที่กดแล้ว */
    (n.ids && n.ids.length ? n.ids : [n.id]).forEach((id) => { if (id) notif.markRead(id); });
    setNotifOpen(false);
    if (n.jobId) { setView(listView()); setSelected(n.jobId); }
  };

  /* ชุดเครื่องมือบนหัวจอ — หน้าที่ใช้ SchedHeader ดึงไปใช้เองจากที่นี่
     ส่งผ่านบริบท ไม่ใช่พร็อพ — หน้าเหล่านั้นอยู่คนละไฟล์ การร้อยพร็อพสิบกว่าตัวผ่านห้าชั้นคือการแก้ห้าที่ทุกครั้งที่เพิ่มหน้า
     ไม่ห่อ useMemo — ค่าที่มันอ้างถึงเกิดหลัง early return ด้านบน ถ้าเป็น hook ตรงนี้ลำดับ hook จะเพี้ยนตอนหน้ายังโหลด
     ค่าใหม่ทุกเรนเดอร์ไม่เป็นไร — คนอ่านมันเป็นลูกของ App อยู่แล้ว เรนเดอร์ใหม่ตามกันอยู่ดี */
  const hdrTools = {
    showBell: true, unread: bellCount, notifItems: myNotifs, lateAlerts: lateAlerts,
    omAlerts: omLive.alerts, onOpenOm: can(role, "om") ? openOm : null,
    notifOpen: notifOpen, onBell: () => setNotifOpen((v) => !v), onCloseNotif: () => setNotifOpen(false),
    onOpenNotif: openFromNotif, onMarkAll: () => myNotifs.forEach((n) => { if (!n.read) notif.markRead(n.id); }),
    me: auth.current, aurora: aurora, onToggleAurora: toggleAurora, onMySign: () => setMySign(true),
  };

  return (
    <window.HdrCtx.Provider value={hdrTools}>
    <div className="app-root">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <Sidebar view={view} onNav={navTo} role={role} techId={techId} jobs={jobs} stock={stock} t={t} badges={navBadges}
        open={sidebarOpen} onClose={closeSidebar}
        collapsed={collapsed} onToggleCollapsed={toggleCollapsed}
        currentUser={auth.current} onLogout={auth.logout}
        canManageUsers={can(role, "manageUsers")} onManageUsers={() => { setUserMgr(true); closeSidebar(); }}
        onManageTechs={() => { setTechMgr(true); closeSidebar(); }}
        onMySign={() => { setMySign(true); closeSidebar(); }} />
      <main className="app-main">
        {view === "stock" ? (
          <StockView stock={stock} onMenuOpen={() => setSidebarOpen(true)} currentUser={auth.current} jobs={jobs}
            priceStore={priceStore} ampStore={ampStore} condStore={condStore} omStore={omStore} canManagePrices={can(role, "price")} />
        ) : view === "dispatch" ? (
          <DispatchView appts={apptStore.appts} jobs={jobs} techs={techStore.techs} store={apptStore} leadStore={leadStore}
            onMenuOpen={() => setSidebarOpen(true)} onOpenJob={openJob} />
        ) : view === "leads" ? (
          <React.Fragment>
            {/* หัวจอไม่มีปุ่มสลับมุมแล้ว — ปุ่มเพิ่มลูกค้าอยู่บนแถวหัวของบอร์ดเอง ใกล้ของที่มันเพิ่มเข้าไป */}
            <window.SchedHeader title="งานขาย" sub={salesHead} onMenuOpen={() => setSidebarOpen(true)} />
            <div className="app-content" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>{salesBoard}</div>
          </React.Fragment>
        ) : view === "saleskpi" ? (
          <SalesKpiView leads={leadStore.leads} quotes={quoteStore.quotes} appts={apptStore.appts} techs={techStore.techs} currentUser={auth.current}
            onMenuOpen={() => setSidebarOpen(true)} onNewLead={can(role, "leads") ? newLead : null} />
        ) : view === "myschedule" ? (
          <MyScheduleView appts={apptStore.appts} jobs={jobs} leads={leadStore.leads} me={auth.current}
            onMenuOpen={() => setSidebarOpen(true)}
            onStatus={(id, s) => apptStore.setStatus(id, s)}
            onOpenSurvey={(j, appt) => openSurvey(j, appt)}
            onOpen={openJob}
            onAdvance={(j) => store.advance(j.id)} />
        ) : (
        <React.Fragment>
        <Header view={view} navList={navItems} plain={permitPage || PLAIN_SUB[view] !== undefined}
          subtitle={permitPage ? permitHead : (PLAIN_SUB[view] !== undefined ? PLAIN_SUB[view] : null)} ownOnly={ownOnly} count={filtered.length} total={jobs.length}
          search={search} setSearch={setSearch}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          delayedOnly={delayedOnly} setDelayedOnly={setDelayedOnly}
          stageFilter={stageFilter} setStageFilter={setStageFilter} stageCounts={stageCounts} stageMode={permitOnly ? "permit" : "job"}
          quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          techFilter={techFilter} setTechFilter={setTechFilter} techCounts={techCounts} techs={techStore.techs}
          onMap={() => setMapOpen(true)}
          showBell={true} unread={bellCount} notifItems={myNotifs} lateAlerts={lateAlerts}
          omAlerts={omLive.alerts} onOpenOm={can(role, "om") ? openOm : null}
          notifOpen={notifOpen} onBell={() => setNotifOpen((v) => !v)} onCloseNotif={() => setNotifOpen(false)}
          onOpenNotif={openFromNotif} onMarkAll={() => myNotifs.forEach((n) => { if (!n.read) notif.markRead(n.id); })}
          me={auth.current} aurora={aurora} onToggleAurora={toggleAurora}
          onMySign={() => setMySign(true)}
          onMenuOpen={() => setSidebarOpen(true)} />

        <div className="app-content" style={view === "board" ? { display: "flex", flexDirection: "column", minHeight: 0 } : {}}>
          {/* หน้าแรกหน้าเดียวสำหรับทุกตำแหน่ง — เลย์เอาต์เหมือนกันหมด ต่างกันแค่ข้อมูลที่แต่ละคนมีสิทธิ์เห็น */}
          {view === "overview" && (
            <LeadOverview jobs={filtered} allJobs={scopedJobs} leads={leadStore.leads} quotes={quoteStore.quotes} stock={stock} techs={techStore.techs}
              showValue={can(role, "price")}
              me={auth.current} onOpen={openJob} onStage={goStage} onKpi={goKpi}
              onTech={(id) => { setTechFilter(id); setStageFilter(null); setQuickFilter(null); setView(listView()); }}
              onGoPermit={can(role, "permit") ? () => setView("permit") : null}
              onGoSales={can(role, "leads") ? () => setView(can(role, "price") ? "saleskpi" : "leads") : null}
              onGoOm={can(role, "om") ? () => openOm(null) : null}
              omCount={can(role, "om") ? navBadges.om : null} />
          )}
          {/* บอร์ดรวมทั้งวงจร — ขาย → หน้างาน → เอกสาร อยู่ผืนเดียว (ช่วงไหนไม่มีสิทธิ์ก็ไม่ขึ้น)
              ฝ่ายขออนุญาตอย่างเดียวยังได้บอร์ดขออนุญาตเต็มรูปแบบเหมือนเดิม เพราะเขาต้องใช้มุมรายการด้วย */}
          {view === "board" && (
            <FlowBoardView jobs={filtered} leads={leadStore.leads} quotes={quoteStore.quotes} search={search}
              onNewJob={can(role, "addJob") ? () => setForm({ job: store.blank(), isNew: true }) : null}
              role={role} currentUser={auth.current}
              onOpenJob={openJob}
              /* กดการ์ดขาย = เปิดใบลูกค้าทับบอร์ดเลย จะได้ไม่เสียตำแหน่งที่ไล่ดูอยู่ */
              onOpenLead={(l) => setBoardLead(l.id)}
              onNewLead={can(role, "leads") ? newLead : null}
              onNewPermitJob={can(role, "addJob") ? newPermitJob : null}
              onMoveStage={(id, s) => store.setStage(id, s)}
              onPatchJob={can(role, "editJob") ? (id, f) => store.patch(id, f) : null}
              onPatchLead={(id, f) => leadStore.patch(id, f)}
              onPatchPermit={patchPermit}
              onOpenReview={(id) => setPermitReview(id)} />
          )}
          {view === "table" && <TableView jobs={filtered} onOpen={openJob}
            onEdit={(j) => setForm({ job: store.raw.find((r) => r.id === j.id), isNew: false })}
            onDelete={onDelete} onSetMat={store.setMat} onSetStage={(id, s) => store.setStage(id, s)}
            permitMode={permitOnly}
            onRevert={can(role, "delJob") ? revertJobToLead : null} canRevert={(j) => !!leadOfJob(j)}
            onAdd={can(role, "addJob") ? () => setForm({ job: store.blank(), isNew: true }) : null}
            trashCount={can(role, "delJob") ? store.trash.length : 0} onOpenTrash={can(role, "delJob") ? () => setTrashOpen(true) : null} />}
          {view === "permit" && permitView}
          {view === "daily" && <DailyView jobs={filtered} role={role} currentUser={auth.current}
            onOpen={(j, d) => setDailyJob(d ? Object.assign({}, j, { _openDate: d }) : j)} />}
          {/* ทะเบียนบริการเป็นภาระผูกพันของบริษัท ไม่ใช่คิวงานของใครคนหนึ่ง จึงดูจากงานทั้งหมดที่ผู้ใช้เห็น */}
          {view === "om" && <window.OmView jobs={jobs} users={auth.users} role={role} currentUser={auth.current} focus={omFocus} />}
          {view === "expense" && <window.ExpenseView jobs={jobs} users={auth.users} role={role} currentUser={auth.current} focus={ecFocus} />}
          {/* งวดงานเป็นเรื่องของสัญญาทั้งฉบับ ไม่ใช่คิวงานของใครคนหนึ่ง จึงดูจากงานทั้งหมดที่ผู้ใช้เห็น
              onSaveBills เป็น null เมื่อไม่มีสิทธิ์ — กั้นที่จุดต่อสาย หน้าจอจึงเขียนอะไรไม่ได้เลยแม้กดถึงปุ่ม */}
          {view === "billing" && <window.BillingView jobs={jobs} quotes={quoteStore.quotes} leads={leadStore.leads}
            q={search} setQ={setSearch}
            role={role} currentUser={auth.current} onOpenJob={(id) => setSelected(id)}
            onSetup={can(role, "billing") ? (j) => { setBlRow(null); setBlJob(j); } : null}
            onSaveBills={can(role, "billing") ? (id, bills) => store.patch(id, { bills }) : null}
            onSkip={can(role, "billing") && hasRole(role, "admin") ? (id, off) => store.patch(id, { noBill: off ? true : null }) : null} />}
          {view === "attend" && <window.AttendView jobs={jobs} users={auth.users} role={role} currentUser={auth.current} />}
          {view === "line" && <window.LineAdminView users={auth.users} currentUser={auth.current} />}
          {view === "guide" && <window.GuideView role={role} currentUser={auth.current} onNav={navTo} />}
          {view === "report" && <ReportView jobs={filtered} onOpen={openJob} />}
          {view === "survey" && <SurveyView jobs={filtered} role={role} onOpen={openSurvey}
            onToggleSkip={(can(role, "doSurvey") || can(role, "dispatch") || can(role, "editJob")) ? (j) => {
              const cur = j.survey || {};
              store.patch(j.id, { survey: Object.assign({}, cur, { skip: !cur.skip, skippedAt: !cur.skip ? new Date().toISOString() : null }) });
            } : null} />}
          {view === "calendar" && <CalendarView jobs={filtered} onOpen={openJob}
            onAdvance={can(role, "editJob") ? (j) => store.advance(j.id) : null} />}
        </div>
        </React.Fragment>
        )}
      </main>

      {/* ใบลูกค้าที่เปิดจากการ์ดขายบนบอร์ดงาน — ปุ่มครบเหมือนหน้ารายชื่อลูกค้า
          ปุ่มที่พาไปหน้าอื่น (แบบสำรวจ · รายงาน · ใบเสนอราคา · แปลงเป็นงาน) ให้ปิดแผงก่อน ไม่งั้นมันค้างทับอยู่ */}
      {/* ถอด BOQ / ออกแบบระบบ ตั้งแต่ยังเป็นลูกค้าได้ — BOQ เก็บลงตารางลูกค้าก่อน
          แล้วค่อยติดไปกับงานตอนกดแปลง · __lead คือธงจาก leadAsJob ว่ายังไม่ใช่งานจริง */}
      {boardLead && <LeadDrawer lead={(leadStore.leads || []).find((x) => x.id === boardLead) || null}
        leadStore={leadStore} appts={apptStore.appts} jobs={jobs} quotes={quoteStore.quotes}
        users={auth.users} currentUser={auth.current}
        stock={stock} priceMap={can(role, "price") ? effPriceMap : null}
        canManage={can(role, "delJob")} canDesign={can(role, "design")}
        onSaveBoq={(t, boq) => { if (t && t.__lead) leadStore.patch(t.id, { boq }); else store.patch(t.id, { boq }); }}
        onClose={() => setBoardLead(null)}
        onOpenSurvey={(can(role, "doSurvey") || can(role, "dispatch")) ? (pseudo) => { setBoardLead(null); openSurvey(pseudo); } : null}
        onReport={(pseudo) => { setBoardLead(null); setReportJob(pseudo); }}
        onOpenQuote={can(role, "price") ? (l, q) => { setBoardLead(null); openQuoteForLead(l, q); } : null}
        /* วางแผง 3D เปิดทับแผงลูกค้า — ปิดจอ 3D แล้วกลับมาที่ใบเดิม ไม่ต้องหาการ์ดใหม่ */
        onPlan3d={can(role, "design") && window.Plan3DEntry ? (pseudo, ver) => setPlan3dLead({ job: pseudo, ver: ver || "1" }) : null}
        onConvert={(l) => { setBoardLead(null); convertLead(l); }} canConvert={can(role, "addJob")} />}

      {plan3dLead && window.Plan3DEntry && <window.Plan3DEntry job={plan3dLead.job} ver={plan3dLead.ver} currentUser={auth.current} onClose={() => setPlan3dLead(null)} />}

      <DetailDrawer job={selectedJob} onClose={() => setSelected(null)} onAdvance={(id) => store.advance(id)} onSetMat={store.setMat}
        currentUser={auth.current} canManage={can(role, "delJob")} canDesign={can(role, "design")} stock={stock}
        onSaveBOQ={(id, boq) => store.patch(id, { boq })}
        onSurvey={(can(role, "doSurvey") || can(role, "dispatch")) ? () => openSurvey(selectedJob) : null}
        onSurveyReport={() => setReportJob(selectedJob)}
        onPermit={can(role, "editJob") && !permitOnly ? () => setPermitJob(selectedJob) : null}
        onBilling={selectedJob && !permitOnly ? () => { setBlRow(null); setBlJob(selectedJob); } : null}
        onSaveBills={can(role, "billing") && selectedJob ? (bills) => store.patch(selectedJob.id, { bills }) : null}
        billRO={!can(role, "billing")}
        billRole={role}
        /* รายงานประจำวันเปิดได้เฉพาะงานที่กำลังติดตั้ง — ขั้นก่อนหน้ายังไม่มีใครขึ้นหน้างาน */
        onDaily={can(role, "editJob") && !permitOnly && selectedJob && selectedJob.stage === "install"
          ? () => setDailyJob(selectedJob) : null}
        /* สมุดตรวจรับและส่งมอบ — เปิดได้ทุกขั้น เพราะข้อมูลทยอยกรอกระหว่างทำงาน ไม่ใช่กรอกทีเดียวตอนจบ
           ด่านสิทธิ์อยู่ตรงนี้ ไม่ใช่ในดรอว์เออร์ · ส่ง null ไม่ใช่ false เพราะ DrToolGroup นับลูกที่ไม่เป็น falsy */
        onHandover={can(role, "handover") && !permitOnly && selectedJob ? () => setPmJob(selectedJob) : null}
        /* งานบริการหลังการขาย — เปิดได้เมื่อติดตั้งเสร็จแล้ว หรือไซต์นี้ขึ้นทะเบียนบริการไว้แล้ว */
        omSite={selectedJob ? (omLive.sites || []).find((s) => s.id === selectedJob.id) || null : null}
        omVisits={selectedJob ? (omLive.bySite || {})[selectedJob.id] || [] : []}
        omTickets={selectedJob ? (omLive.tickets || []).filter((t) => t.siteId === selectedJob.id) : []}
        onOm={can(role, "om") && !permitOnly && selectedJob ? () => openOm({ siteId: selectedJob.id }) : null}
        /* เบิกเงินหน้างาน — เปิดได้ทุกขั้น เพราะค่าขนส่ง/ค่าเดินทางเกิดตั้งแต่ก่อนเริ่มติดตั้ง */
        ecSum={selectedJob ? (ecLive.byJob || {})[selectedJob.id] || null : null}
        onExpense={can(role, "expense") && !permitOnly && selectedJob ? () => openExpense(selectedJob.id) : null}
        permitMode={permitOnly}
        onOpenReview={permitOnly && selectedJob ? () => setPermitReview(selectedJob.id) : null}
        salesMode={salesOnly} quotes={quoteStore.quotes} leads={leadStore.leads}
        onOpenQuote={can(role, "price") && selectedJob ? (q) => openQuoteForJob(selectedJob, q) : null}
        priceMap={can(role, "price") ? effPriceMap : null}
        onEdit={(id) => { setSelected(null); setForm({ job: store.raw.find((r) => r.id === id), isNew: false }); }} />
      {/* ใบเสนอราคา — เปิดทับได้ทั้งจากหน้าลูกค้าสำรวจและจากในใบงาน */}
      {quoteOpen && (
        <QuoteEditor quote={quoteOpen.quote} currentUser={auth.current} target={quoteOpen.target} stock={stock}
          job={quoteOpen.jobId ? jobs.find((x) => x.id === quoteOpen.jobId) : null}
          onClose={() => setQuoteOpen(null)}
          onSave={(q) => {
            quoteStore.upsert(q);
            /* ส่งใบเสนอราคาแล้วให้ลูกค้าเลื่อนขั้นเองอัตโนมัติ — เซลล์ไม่ต้องมาลากการ์ดซ้ำ
               ลูกค้าตกลง = ปิดการขาย (ยังต้องกด "แปลงเป็นงาน" เองอยู่ดี งานถึงจะเข้าฐาน) */
            const l = q.leadId ? (leadStore.leads || []).find((x) => x.id === q.leadId) : null;
            if (l && window.salesStagePatch) {
              const cur = window.salesStageKey(l);
              const to = q.status === "accepted" ? "won"
                : q.status === "rejected" ? "lost"
                : (q.status === "sent" && (cur === "new" || cur === "contact" || cur === "survey")) ? "quoted" : null;
              if (to && to !== cur) leadStore.patch(l.id, window.salesStagePatch(to));
            }
            setQuoteOpen(null);
          }}
          onDelete={() => { quoteStore.remove(quoteOpen.quote.id); setQuoteOpen(null); }} />
      )}
      {/* ชุดข้อมูลขออนุญาต — เปิดทับได้ทั้งจากบอร์ดและจากในใบงาน */}
      {permitReview && (() => {
        const rj = jobs.find((x) => x.id === permitReview);
        if (!rj) return null;
        return <PermitReview job={rj} currentUser={auth.current} stock={stock}
          onClose={() => setPermitReview(null)}
          onOpenJob={() => { setPermitReview(null); setSelected(rj.id); }}
          onPatch={(fields) => patchPermit(rj.id, fields)} />;
      })()}
      {permitJob && <PermitWizard job={permitJob} currentUser={auth.current} stock={stock}
        onClose={() => setPermitJob(null)}
        onSave={(permit) => store.patch(permitJob.id, { permit })}
        onSubmit={(permit) => notif.addNotif({
          toPerm: "permit", type: "permit", event: "permit", jobId: permitJob.id, jobName: permitJob.name,
          title: "ข้อมูลขออนุญาตพร้อมยื่นแล้ว",
          body: [permitJob.code, permit.auth, permit.kwp ? permit.kwp + " kWp" : ""].filter(Boolean).join(" · "),
        })} />}
      {/* แผงตั้งงวดงาน — อ่านงานสดจาก jobs เสมอ ไม่ยึดก้อนที่กดตอนแรก
          ไม่งั้นบันทึกงวดไปแล้วแผงยังโชว์ตัวเลขชุดเก่า */}
      {blJob && <window.BlSetupModal job={jobs.find((x) => x.id === blJob.id) || blJob}
        quotes={quoteStore.quotes} leads={leadStore.leads} role={role} currentUser={auth.current}
        focusRowId={blRow} readOnly={!can(role, "billing")}
        onClose={() => { setBlJob(null); setBlRow(null); }}
        onSaveBills={can(role, "billing") ? (bills) => store.patch(blJob.id, { bills }) : null} />}
      {surveyJob && <SurveyWizard job={surveyJob} currentUser={auth.current} stock={stock}
        onClose={() => { setSurveyJob(null); setSurveyAppt(null); }}
        onSave={(survey, thenReport) => {
          const s = surveyAppt ? Object.assign({}, survey, { appointmentId: surveyAppt.id }) : survey;
          // งานสำรวจของ "ลูกค้าสำรวจ" เก็บไว้ที่ตัวลูกค้า ไม่แตะฐานข้อมูลงาน
          if (surveyJob.__lead) leadStore.patch(surveyJob.id, { survey: s });
          else store.patch(surveyJob.id, { survey: s });
          if (surveyAppt) apptStore.setStatus(surveyAppt.id, "done"); // เสร็จแบบสำรวจ → ปิดนัด
          // เปิดรายงานด้วยข้อมูลที่เพิ่งบันทึก (store ยังไม่เด้งกลับมาตอนนี้)
          if (thenReport) setReportJob(Object.assign({}, surveyJob, { survey: s }));
          setSurveyJob(null); setSurveyAppt(null);
        }} />}
      {reportJob && <SurveyReportHost job={reportJob} stock={stock} onClose={() => setReportJob(null)} />}
      {/* รายงานประจำวัน — เปิดทับได้ทั้งจากในใบงานและจากหน้ารวมของหัวหน้า
          อ่านงานสดจาก jobs เสมอ ไม่ยึดก้อนที่กดตอนแรก ไม่งั้นเลื่อนขั้นแล้วตารางในฟอร์มยังเป็นของเก่า */}
      {dailyJob && (
        <DailyReportModal job={jobs.find((x) => x.id === dailyJob.id) || dailyJob} role={role}
          currentUser={auth.current} onNotify={notif.addNotif} openDate={dailyJob._openDate || ""}
          onClose={() => setDailyJob(null)} />
      )}
      {/* สมุดตรวจรับและส่งมอบ — อ่านงานสดจาก jobs เสมอ เพราะ BOQ อาจเปลี่ยนระหว่างเล่มเปิดอยู่
          แล้วค่าที่เติมให้ล่วงหน้าต้องตามไปด้วย */}
      {pmJob && window.PmHandoverModal && (
        <window.PmHandoverModal job={jobs.find((x) => x.id === pmJob.id) || pmJob}
          currentUser={auth.current} onClose={() => setPmJob(null)}
          onSummary={(sum) => store.patch(pmJob.id, { pmHandover: sum })} />
      )}
      {form && <JobForm initial={form.job} isNew={form.isNew} jobs={jobs} users={auth.users} onSave={onSave} onClose={() => setForm(null)} onManageTechs={() => setTechMgr(true)} onManageBrands={() => setBrandMgr(true)} />}
      {/* ฟอร์มลูกค้าใหม่ — เปิดทับหน้าที่เปิดค้างอยู่ จะได้ไม่เสียที่ทางที่คนกดอยู่ */}
      {leadNew && <window.LeadModal initial={leadNew} isNew users={auth.users}
        onClose={() => setLeadNew(null)}
        onSave={(rec) => { leadStore.upsert(rec); setLeadNew(null); }} />}
      {techMgr && <TechManager store={techStore} onClose={() => setTechMgr(false)} />}
      {brandMgr && <BrandManager store={brandStore} onClose={() => setBrandMgr(false)} />}
      {userMgr && can(role, "manageUsers") && <UserManager authStore={auth} roleCfg={roleCfg} onClose={() => setUserMgr(false)} />}
      {mySign && <MyProfileModal user={auth.current} onSave={auth.upsertUser} onClose={() => setMySign(false)} />}
      {briefingOpen && <DailyBriefing lateAlerts={lateAlerts} todayTasks={todayTasks}
        onOpen={(jobId) => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); setView(listView()); setSelected(jobId); }}
        onClose={() => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); }} />}
      {revertAsk && <RevertJobAsk job={revertAsk.job} lead={revertAsk.lead} onClose={() => setRevertAsk(null)}
        onConfirm={() => doRevertJob(revertAsk.job, revertAsk.lead)} />}
      {delAsk && <DeleteJobAsk job={delAsk} onClose={() => setDelAsk(null)}
        onConfirm={() => { store.remove(delAsk.id, auth.current ? auth.current.name : ""); setSelected((s) => s === delAsk.id ? null : s); setDelAsk(null); }} />}
      {trashOpen && <TrashModal trash={store.trash} me={auth.current} onClose={() => setTrashOpen(false)}
        onRestore={(id) => store.restore(id)} onPurge={(id) => store.purge(id)} />}
      {mapOpen && <MapModal jobs={filtered} onOpen={(j) => { setMapOpen(false); openJob(j); }} onClose={() => setMapOpen(false)} />}

      <TweaksPanel>
        <TweakSection label="ธีม / Theme" />
        <TweakRadio label="โหมด" value={t.mode} options={["light", "aurora"]} onChange={(v) => setTweak("mode", v)} />
        <TweakSelect label="โทนสีหลัก" value={t.accent}
          options={[{ value: "flash", label: "flash+solar" }, { value: "emerald", label: "Emerald" }, { value: "amber", label: "Command Amber" }]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="เลย์เอาต์ / Layout" />
        <TweakRadio label="ความหนาแน่น" value={t.density} options={["comfy", "compact"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="แถบเมนู" value={t.sidebar} options={["full", "icons"]} onChange={(v) => setTweak("sidebar", v)} />
        <TweakRadio label="สไตล์การ์ด" value={t.cardStyle} options={["soft", "flat"]} onChange={(v) => setTweak("cardStyle", v)} />
      </TweaksPanel>

      {/* กล่องยืนยันกลางของแอป — ทุกที่ที่เรียก askConfirm() มาโผล่ที่ตัวนี้ */}
      <ConfirmHost />
    </div>
    </window.HdrCtx.Provider>
  );
}

function Sidebar({ view, onNav, role, techId, jobs, stock, t, badges, open, onClose, collapsed, onToggleCollapsed, currentUser, onLogout, canManageUsers, onManageUsers, onManageTechs, onMySign }) {
  // Read media query synchronously every render — avoids stale state when
  // the preview or device loads at one size then displays at another.
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  // โหมดไอคอน = ผู้ใช้ย่อแถบเอง (เฉพาะเดสก์ท็อป — มือถือใช้ drawer เต็มเสมอ)
  const icons = !isMobile && collapsed;
  /* รูปโปรไฟล์ของคนที่ล็อกอินอยู่ — โหลดเฉพาะของตัวเอง ไม่ลากรูปของทุกคนมาด้วย */
  const myAvatar = window.useUserAvatar((currentUser || {}).id).avatar;
  const delayed = jobs.filter((j) => j.delayed).length;
  const lowStock = stock.items.filter((it) => it.qty <= it.min).length;
  /* เลขท้ายเมนู — สองตัวนี้คิดจากของที่ Sidebar ถืออยู่แล้ว ที่เหลือส่งมาจาก App */
  const badgeOf = (key) => {
    if (key === "overview") return delayed;
    if (key === "stock") return lowStock;
    /* แถวแม่รวมเลขของหน้าที่ยุบเข้าไปเป็นแท็บด้วย — ยุบแถวได้ แต่เรื่องที่ค้างอยู่ห้ามหายไปกับแถว */
    const b = badges || {};
    return NAV.reduce((s, n) => s + ((n.key === key || n.group === key) ? (b[n.key] || 0) : 0), 0);
  };
  /* โทนกับคำอธิบายของเลขรวม — เอาของเรื่องที่ด่วนที่สุดในกลุ่มที่ยังมีเลขค้างอยู่
     (แดง > เหลือง > ฟ้า) · กลุ่มที่ไม่มีลูกก็ได้ค่าของตัวเองตามเดิม */
  const badgeInfo = (key) => {
    const b = badges || {};
    let best = null;
    NAV.forEach((n) => {
      if ((n.key !== key && n.group !== key) || !(b[n.key] || 0)) return;
      const t = NAV_BADGE_TONE[n.key] || "";
      if (best === null || NAV_TONE_RANK[t] < NAV_TONE_RANK[best.t]) best = { t: t, k: n.key };
    });
    return best
      ? { tone: best.t ? " " + best.t : "", tip: NAV_BADGE_TIP[best.k] || "" }
      : { tone: NAV_BADGE_TONE[key] ? " " + NAV_BADGE_TONE[key] : "", tip: NAV_BADGE_TIP[key] || "" };
  };
  // On mobile: slide in/out via transform; on desktop: no inline style → always visible in flex flow
  const sidebarStyle = isMobile
    ? { transform: open ? "translateX(0)" : "translateX(-100%)",
        boxShadow: open ? "6px 0 36px rgba(0,0,0,.22)" : "none" }
    : { position: "relative" };
  return (
    <aside className="sidebar" data-mode={icons ? "icons" : "full"}
      style={sidebarStyle}>
      {/* ปุ่มย่อ/ขยาย — ลอยที่ขอบขวาของแถบ (เฉพาะเดสก์ท็อป) */}
      {!isMobile && (
        <button onClick={onToggleCollapsed} title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"} aria-label="ย่อ/ขยายแถบเมนู"
          style={{ position: "absolute", top: "50%", right: -13, transform: "translateY(-50%)", width: 26, height: 26, borderRadius: "var(--r-pill)",
            border: "2px solid var(--bg)", background: "var(--primary)", color: "#fff",
            cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(20,40,28,.18)", zIndex: 5, padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-dark)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary)"; }}>
          <Icon name="chevronRight" size={15} color="#fff" style={{ transform: collapsed ? "none" : "rotate(180deg)", transition: "transform .18s" }} />
        </button>
      )}
      <div className="sidebar-brand">
        <window.BrandMark size={38} style={{ flexShrink: 0 }} />
        {!icons && (
          <div className="brand-name">flash<span className="plus">+</span>solar</div>
        )}
        <button className="sidebar-close-btn x-close" onClick={onClose} title="ปิดเมนู" aria-label="ปิดเมนู">
          <Icon name="x" size={15} color="var(--text-2)" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {(() => {
          const all = navForRole(role, techId);
          const items = all.filter((n) => !n.hidden && !n.inSettings);
          /* เมนูที่ปักไว้ล่างสุด — ดันด้วย margin-top:auto ที่ "ตัวแรก" ของกลุ่มเท่านั้น
             ใส่ทุกตัวจะแยกกันกระจายทั้งคอลัมน์ ไม่ได้เกาะกลุ่มอยู่ด้วยกัน */
          const first = items.findIndex((n) => n.foot);
          return items.map((n, i) => {
          /* ขึ้นหัวข้อเมื่อแถวนี้เปลี่ยนกลุ่มจากแถวก่อน — ดูจากแถวที่เหลือหลังกรองสิทธิ์แล้ว
             ไม่ใช่ตำแหน่งใน NAV ตายตัว — คนที่ไม่มีสิทธิ์เบิกเงินจะได้หัวข้อเกาะคลังสินค้าแทน ไม่ใช่หัวข้อลอย */
          const newSect = !!n.sect && (i === 0 || items[i - 1].sect !== n.sect);
          /* กลุ่มท้ายถูกดันลงล่างด้วย margin-top:auto — ถ้ากลุ่มนั้นมีหัวข้อ หัวข้อเป็นตัวดัน
             ไม่งั้นหัวข้อจะค้างอยู่กลางแถบ แล้วแถวของมันหลุดไปอยู่ล่างสุดตัวเดียว */
          const footHere = i === first;
          /* หน้าที่ยุบเข้ามาอยู่ใต้แถวนี้ ต้องทำให้แถวแม่ติดไฟด้วย ไม่งั้นเปิดมุมตารางอยู่
             แต่เมนูซ้ายไม่มีแถวไหนติดไฟเลย — คนอ่านจะไม่รู้ว่าตัวเองอยู่ตรงไหนของแอป */
          const active = navTop(view) === n.key;
          /* เมนูย่อยกางเฉพาะแถวที่เปิดอยู่ — ไม่ใช่หีบเพลงที่ต้องกดพับ/กางเอง
             เมนูอื่นจึงไม่ยาวขึ้นเลย และหน้าที่ยุบไปก็ยังกดถึงได้ในคลิกเดียวจากตรงนี้
             navTabsOf ใส่ตัวแม่ไว้เป็นรายการแรกเสมอ ไม่งั้นเข้ามุมตารางแล้วกลับบอร์ดไม่ได้ */
          const subs = active ? navTabsOf(all, n.key) : [];
          return (
            <React.Fragment key={n.key}>
            {newSect && (
              <div className={"nav-sect" + (footHere ? " nav-sect-foot" : "")} aria-hidden="true"><span>{NAV_SECT[n.sect]}</span></div>
            )}
            <button onClick={() => onNav(n.key)} className={"nav-item" + (active ? " active" : "") + (footHere && !newSect ? " nav-foot" : "")}
              title={n.th}>
              <Icon name={n.icon} size={19} color={active ? "var(--primary-dark)" : "var(--text-2)"} />
              {!icons && <span>{n.th}</span>}
              {(() => {
                const cnt = badgeOf(n.key);
                if (!cnt) return null;
                const bi = badgeInfo(n.key);
                const tone = bi.tone;
                const tip = bi.tip;
                /* ย่อแถบเมนูแล้วไม่มีที่ให้ตัวเลข เหลือเป็นจุดมุมไอคอน
                   ให้ยังรู้ว่าเมนูนั้นมีเรื่องค้าง ไม่ใช่หายไปเฉย ๆ */
                return icons
                  ? <span className={"nav-dot" + tone} title={tip + " " + cnt} />
                  : <span className={"nav-badge" + tone} title={tip}>{cnt}</span>;
              })()}
            </button>
            {subs.length > 1 && (
              <div className="nav-subs">
                {subs.map((s) => (
                  <button key={s.key} onClick={() => onNav(s.key)} title={s.th}
                    className={"nav-sub" + (view === s.key ? " active" : "")} aria-current={view === s.key ? "page" : undefined}>
                    <Icon name={s.icon} size={15} color={view === s.key ? "var(--primary-dark)" : "var(--text-3)"} />
                    {!icons && <span>{s.th}</span>}
                  </button>
                ))}
              </div>
            )}
            </React.Fragment>
          );
          });
        })()}
      </nav>

      <div className="sidebar-foot">
        {/* ชื่อผู้ใช้กับทางเข้า "โปรไฟล์ของฉัน" ย้ายไปเป็นชิปท้ายหัวจอแล้ว (คลาส .hdr-user ใน Header)
            เดิมอยู่ตรงนี้ที่เดียว ซึ่งมองไม่เห็นเลยตอนแถบเมนูพับเป็นไอคอนหรือตอนใช้บนมือถือ
            ถ้าจะเอากลับมา ต้องเอาของบนหัวจอออกก่อน ไม่ใช่มีสองที่ */}
        {/* ── ตั้งค่าและบัญชี ──
            เดิมเป็นห้าปุ่มเรียงกันท้ายแถบ (ผู้ใช้งาน · ทีมช่าง · แจ้งเตือน LINE · โหมดกราไฟต์ · ออกจากระบบ)
            ซึ่งกินพื้นที่เท่ากับเมนูงานจริงทั้งที่เป็นของที่กดเดือนละครั้ง — ยุบเป็นปุ่มเดียวที่กางขึ้น */}
        <SidebarSettings icons={icons} view={view} onNav={onNav}
          settingsNav={navForRole(role, techId).filter((n) => n.inSettings && !n.hidden)}
          canManageUsers={canManageUsers} onManageUsers={onManageUsers} onManageTechs={onManageTechs}
          onLogout={onLogout} />
      </div>
    </aside>
  );
}

/* ── เมนู "ตั้งค่าและบัญชี" ท้ายแถบเมนู ──
   รวมของที่กดนาน ๆ ครั้งไว้ที่เดียว: หน้าตั้งค่าของแอดมิน · สกินจอ · ออกจากระบบ
   กางขึ้นเพราะปุ่มอยู่ล่างสุดของจอ กางลงจะตกขอบ */
/* สวิตช์สว่าง/มืดไม่อยู่ในเมนูนี้แล้ว — มันอยู่ที่ปุ่มพระจันทร์บนหัวจอที่เดียว
   ของที่กดสลับไปมาวันละหลายหน ไม่ควรต้องกางเมนูสองชั้นก่อนถึง และสองที่ทำเรื่องเดียวกันคนละที่คือสองสวิตช์ */
function SidebarSettings({ icons, view, onNav, settingsNav, canManageUsers, onManageUsers, onManageTechs, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);

  /* ปุ่มต้องขึ้น active ตอนอยู่ในหน้าที่ย้ายเข้ามาอยู่ในเมนูนี้
     ไม่งั้นเปิดหน้าแจ้งเตือน LINE อยู่แล้วทั้งแถบเมนูไม่มีอะไรไฮไลต์ อ่านเหมือนหลงทาง */
  const inHere = (settingsNav || []).some((n) => n.key === view);

  const row = (key, icon, label, onClick, opt) => {
    const o = opt || {};
    return (
      <button key={key} onClick={() => { setOpen(false); onClick(); }}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
          padding: "9px 11px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
          fontSize: 13, fontWeight: o.active ? 700 : 600,
          background: o.active ? "var(--primary-soft)" : "none",
          color: o.danger ? "#EF4444" : o.active ? "var(--primary-dark)" : "var(--text-2)" }}
        onMouseEnter={(e) => { if (!o.active) e.currentTarget.style.background = "var(--surface2)"; }}
        onMouseLeave={(e) => { if (!o.active) e.currentTarget.style.background = "none"; }}>
        <Icon name={icon} size={17} color={o.danger ? "#EF4444" : o.active ? "var(--primary-dark)" : "var(--text-2)"}
          style={o.flip ? { transform: "scaleX(-1)" } : null} />
        <span>{label}</span>
        {o.dot && <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "var(--r-pill)", flexShrink: 0,
          background: "var(--primary-bright)" }} />}
      </button>
    );
  };
  const sep = (k) => <div key={k} style={{ height: 1, background: "var(--border)", margin: "5px 4px" }} />;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <button onClick={() => setOpen((v) => !v)} className={"nav-item" + (inHere ? " active" : "")}
        title="ตั้งค่าและบัญชี" aria-expanded={open} style={{ width: "100%" }}>
        <Icon name="settings" size={19} color={inHere ? "var(--primary-dark)" : "var(--text-2)"} />
        {!icons && <span>ตั้งค่า</span>}
        {!icons && <Icon name="chevronDown" size={14} color="var(--text-3)"
          style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />}
      </button>

      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, minWidth: 232, zIndex: 60,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-tile)", padding: 6,
          boxShadow: "0 12px 36px rgba(20,40,28,.20)" }}>
          {canManageUsers && onManageUsers && row("users", "users", "จัดการผู้ใช้งาน", onManageUsers)}
          {canManageUsers && onManageTechs && row("techs", "wrench", "ทีมช่าง", onManageTechs)}
          {(settingsNav || []).map((n) => row(n.key, n.icon, n.th, () => onNav(n.key), { active: view === n.key }))}
          {sep("s1")}
          {row("logout", "history", "ออกจากระบบ", onLogout, { danger: true, flip: true })}
        </div>
      )}
    </div>
  );
}

/* ── ตัวกรอง "ช่างผู้รับผิดชอบ" ──
   ปุ่มเม็ดยาแบบเดียวกับตัวกรองขั้นงาน กดแล้วกางรายชื่อช่างพร้อมจำนวนงานของแต่ละคน
   ตัวเลขคิดจากฟิลเตอร์อื่นที่เปิดอยู่ทั้งหมด จะได้รู้ว่า "ในสิ่งที่ดูอยู่ตอนนี้" ใครมีกี่งาน */
function TechFilter({ value, onChange, techs, counts, nameOf }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  React.useEffect(() => {
    if (!open) return;
    const inside = (t) => (wrapRef.current && wrapRef.current.contains(t)) || (menuRef.current && menuRef.current.contains(t));
    const off = (e) => { if (!inside(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    /* เมนูเป็น position:fixed มันจึงไม่เลื่อนตามปุ่ม — ปิดทิ้งเมื่อหน้าเลื่อนหรือจอเปลี่ยนขนาด
       ดีกว่าปล่อยให้เมนูค้างลอยอยู่คนละที่กับปุ่มที่มันห้อยมา */
    const shut = () => setOpen(false);
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", shut, true);
    window.addEventListener("resize", shut);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", shut, true); window.removeEventListener("resize", shut); };
  }, [open]);
  const toggle = () => setOpen((v) => {
    const n = !v;
    if (n && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    return n;
  });

  const cur = value ? (techs || []).find((t) => t.id === value) : null;
  const on = !!value;
  const none = (counts && counts.__none) || 0;
  const pick = (v) => { onChange(v); setOpen(false); };

  /* className อยู่แยกจาก style เพราะ CSS ทำ :hover ให้ไม่ได้ถ้าไม่มีคลาสจับ (ดู .tf-row ใน index.html) */
  const row = (active) => ({
    display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", borderRadius: 10,
    border: "none", background: active ? "var(--primary-soft)" : "transparent", cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: active ? 700 : 500,
    color: active ? "var(--primary-dark)" : "var(--text-1)", textAlign: "left",
  });
  const tally = (n) => ({ marginLeft: "auto", fontFamily: "var(--display)", fontSize: 11.5, fontWeight: 800,
    fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", color: "var(--text-3)", opacity: n ? 1 : .5 });
  const bead = (bg, txt) => (
    <span style={{ width: 22, height: 22, borderRadius: "var(--r-pill)", background: bg, color: "#fff", flexShrink: 0,
      display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 700 }}>{txt}</span>
  );

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button ref={btnRef} onClick={toggle} title="กรองตามช่างผู้รับผิดชอบ" className="hdr-pill" data-on={on ? "1" : "0"}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "5px 10px" : "6px 13px", borderRadius: "var(--r-pill)",
          border: "none",
          background: on ? ((cur ? cur.color : "#1B9B75") + "24") : "transparent",
          color: on ? (cur ? cur.color : "var(--primary-dark)") : "var(--text-2)",
          fontSize: isMobile ? 11.5 : 12.5, fontWeight: on ? 700 : 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {/* currentColor — ตอนชี้ CSS เปลี่ยนสีตัวหนังสือของปุ่มเป็นเขียว ไอคอนต้องเปลี่ยนตามไปด้วย
            ถ้าฝังเป็น var(--text-2) ไว้ ไอคอนจะค้างเป็นเทาอยู่ตัวเดียวกลางปุ่มสีเขียว */}
        <Icon name="wrench" size={14} color={on ? (cur ? cur.color : "var(--primary-dark)") : "currentColor"} />
        ช่าง{on ? ": " + nameOf(value) : ""}
        <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {/* ── เมนูต้องเป็น portal + position:fixed เท่านั้น ──
          แถบตัวกรองบนหัวจอ (.header-filters.in-top) ตั้ง overflow-x:auto ไว้ให้เลื่อนแนวนอนได้ตอนจอแคบ
          ซึ่ง CSS บังคับให้แกนตั้งกลายเป็น auto ตามไปด้วยโดยอัตโนมัติ (overflow-y:visible อยู่ร่วมกับ auto ไม่ได้)
          เมนูแบบ position:absolute จึงถูกกล่องสูง 35px ตัวนั้นเฉือนหายไปทั้งใบ — กดปุ่มแล้วเหมือนไม่มีอะไรเกิดขึ้น
          ทั้งที่สเตตเปลี่ยนจริง กดซ้ำก็แค่ปิดกลับ · ถ้าจะย้ายกลับไปเป็น absolute ต้องถอด overflow ตรงนั้นก่อน */}
      {open && rect && ReactDOM.createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: rect.bottom + 6,
          left: Math.max(12, Math.min(rect.left, window.innerWidth - 244 - 12)),
          zIndex: 200, width: 244, maxHeight: 340, overflowY: "auto",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-tile)", padding: 6,
          boxShadow: "var(--shadow-pop)" }}>
          <button className="tf-row" style={row(!value)} onClick={() => pick(null)}>
            {bead("var(--surface3)", "")}<span>ช่างทุกคน</span>
            <span style={tally(1)}>{(counts && counts.__all) || 0}</span>
          </button>
          {(techs || []).map((t) => {
            const n = (counts && counts[t.id]) || 0;
            const active = value === t.id;
            return (
              <button key={t.id} className="tf-row" style={Object.assign(row(active), n ? {} : { opacity: .55 })} onClick={() => pick(active ? null : t.id)}>
                {bead(t.color, (t.nick || t.name || "?").slice(0, 2))}
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name || t.nick}</span>
                <span style={tally(n)}>{n}</span>
              </button>
            );
          })}
          {none > 0 && (
            <button className="tf-row" style={Object.assign(row(value === "__none"), { borderTop: "1px solid var(--divider)", borderRadius: 0, marginTop: 4, paddingTop: 10 })}
              onClick={() => pick(value === "__none" ? null : "__none")}>
              {bead("var(--surface3)", "?")}<span style={{ color: "var(--text-2)" }}>ยังไม่มอบหมาย</span>
              <span style={tally(none)}>{none}</span>
            </button>
          )}
        </div>, document.body)}
    </span>
  );
}

/* เครื่องมือมุมขวาของหัวจอ — กระดิ่ง · สวิตช์สว่าง/มืด · ชิปผู้ใช้
   แยกออกมาเพราะหน้าที่ใช้ SchedHeader (ยอดขาย · จัดตารางสำรวจ · งานขาย) ก็ต้องมีชุดนี้เหมือนกัน
   มันไปถึงที่นั่นผ่าน HdrCtx ไม่ใช่การส่งพร็อพลงไปทีละชั้น — หน้าใหม่ที่ใช้ SchedHeader จะได้ไปด้วยเอง */
function HeaderTools({ hidden, showBell, unread, notifItems, lateAlerts, omAlerts, onOpenOm, notifOpen, onBell,
  onCloseNotif, onOpenNotif, onMarkAll, aurora, onToggleAurora, me, onMySign }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const myAvatar = window.useUserAvatar((me || {}).id).avatar;
  if (hidden) return null;
  return (
    <React.Fragment>
      {showBell && (
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={onBell} className="hdr-icon-btn" aria-label="การแจ้งเตือน" style={{ position: "relative" }}>
            <Icon name="bell" size={20} color="var(--text-2)" />
            {unread > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: "var(--r-pill)",
                background: "#EF4444", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid var(--bg)" }}>{unread}</span>
            )}
          </button>
          {notifOpen && <NotifPanel items={notifItems} lateAlerts={lateAlerts} omAlerts={omAlerts} onOpenOm={onOpenOm}
            onClose={onCloseNotif} onOpenJob={onOpenNotif} onMarkAll={onMarkAll} />}
        </div>
      )}
      {/* สวิตช์สว่าง/มืด — สลับชุดตัวแปรสีทั้งระบบ (:root ↔ [data-theme="aurora"] ใน tokens.css) */}
      {onToggleAurora && (
        <button onClick={onToggleAurora} className="hdr-icon-btn thm" data-on={aurora ? "1" : "0"}
          title={aurora ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"} aria-label="สลับโหมดสว่าง/มืด">
          {/* ไอคอนสองใบซ้อนกัน สลับกันหมุนเข้า/ออก — สลับ name ของ Icon ใบเดียวจะเปลี่ยนทันทีไม่มีจังหวะ */}
          <span className="thm-ic thm-sun"><Icon name="sun" size={20} color="#F59E0B" /></span>
          <span className="thm-ic thm-moon"><Icon name="moon" size={20} color="#6B7BD8" /></span>
        </button>
      )}
      {/* ชิปผู้ใช้ — ป้ายบอกว่ากำลังใช้สิทธิ์ของใคร ตัวจัดการบัญชี/ออกจากระบบ ยังอยู่ที่แถบเมนูที่เดียว */}
      {!isMobile && me && (
        <button className="hdr-user" onClick={onMySign} disabled={!onMySign} title="โปรไฟล์ของฉัน">
          <span className="hdr-user-av">
            {myAvatar ? <img src={myAvatar} alt="" /> : (me.name || "?").slice(0, 1)}
          </span>
          <span className="hdr-user-tx">
            <b>{me.name}</b>
            <i>{userRoles(me).map((r) => (ROLE_INFO[r] || ROLE_INFO.tech).short).join(" · ")}</i>
          </span>
        </button>
      )}
    </React.Fragment>
  );
}
window.HeaderTools = HeaderTools;

function Header({ view, navList, plain, subtitle, ownOnly, count, total, search, setSearch, typeFilter, setTypeFilter, delayedOnly, setDelayedOnly, stageFilter, setStageFilter, stageCounts, stageMode, quickFilter, setQuickFilter, techFilter, setTechFilter, techCounts, techs, onAdd, canAdd, onMap, showBell, unread, notifItems, lateAlerts, omAlerts, onOpenOm, notifOpen, onBell, onCloseNotif, onOpenNotif, onMarkAll, onMenuOpen, me, aurora, onToggleAurora, onMySign }) {
  /* ชื่อหน้าเอาของ "เมนูแม่" ไม่ใช่ของแท็บ — ชื่อบนหัวจอกับแถวที่ติดไฟในเมนูซ้ายต้องเป็นคำเดียวกัน
     ส่วนว่าอยู่มุมไหนของเมนูนั้น อ่านจากแท็บที่เลือกอยู่ข้าง ๆ ชื่อ */
  const nav = navList.find((n) => n.key === navTop(view)) || NAV.find((n) => n.key === navTop(view))
    || navList.find((n) => n.key === view) || NAV.find((n) => n.key === view);
  const QUICK_LABELS = { active: "กำลังดำเนินการ", delayed: "ล่าช้า", ready: "อุปกรณ์พร้อมติดตั้ง", battery: "มีแบตเตอรี่",
    problem: "ติดปัญหาหน้างาน", noinstall: "ยังไม่นัดวันติดตั้ง" };
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  // มือถือ: ซ่อนแถบกรองขั้นงาน (ปุ่ม + ชิป) ทุกหน้า เพื่อประหยัดพื้นที่หัว
  /* หน้าขออนุญาตไม่ใช้ตัวกรองขั้นงานติดตั้ง — งานที่เข้ามาถึงหน้านี้คืองานที่ติดตั้งเสร็จหมดแล้ว */
  /* บัญชีขออนุญาตกรองด้วยขั้นของใบขออนุญาต — ป้าย/สี/รายชื่อขั้น ต้องสลับตามโหมดทั้งชุด */
  const pMode = stageMode === "permit";
  const stInfo = (k) => (pMode ? permitStageOf(k) : stageOf(k));
  /* ปุ่มแผนที่ — ขึ้นเฉพาะสองหน้าที่ทำงานกับงานทั้งบริษัทเป็นรายใบ
     ส่วนปุ่ม "เพิ่มงาน" ย้ายลงไปอยู่ในหน้าที่ใช้มันแล้ว: หัวช่วง "หน้างาน" ของบอร์ด และแถบสถานะของฐานข้อมูลงาน
     อยู่ติดกับกองงานที่มันจะไปโผล่ ไม่ใช่ลอยอยู่บนหัวรวมของทุกหน้า */
  const jobTools = view === "board" || view === "table";
  /* ช่องค้นหาบนหัว — มีเฉพาะหน้าที่มีอะไรให้ค้นจริง และข้อความบอกให้ตรงว่าหน้านั้นค้นอะไรได้
     หน้าไหนมีคีย์ในตารางนี้ ต้องรับ search/setSearch จาก AppShell ไปใช้เป็นตัวกรองของหน้าตัวเอง
     (ห้ามมีช่องค้นหาของหน้าซ้อนอยู่ในหน้าอีกช่อง — สองช่องกรองของเดียวกันคือที่มาของการพิมพ์ผิดช่อง) */
  const searchPh = HDR_SEARCH[view];
  // มือถือ: ช่องค้นหายุบเป็นปุ่มสีเขียว กดแล้วค่อยขยายเป็นช่องพิมพ์ (ประหยัดพื้นที่หัว)
  const [searchOpen, setSearchOpen] = React.useState(false);
  /* จอกลาง ๆ ก็ยุบด้วย — หน้าที่มีตัวกรองอยู่บนแถวเดียวกัน ที่ว่างไม่พอให้ทั้งสองอย่างเต็มตัว
     ปล่อยไว้ช่องค้นหาจะเบียดจนตัวกรองโดนบังครึ่งตัว ยุบเป็นปุ่มก่อนแล้วกดกางเอาดีกว่า
     (หน้าที่ไม่มีตัวกรอง เช่น เอกสารงวดงาน ยังได้ช่องเต็มเหมือนเดิม) */
  /* ต้องเป็นฮุกที่ subscribe matchMedia จริง ไม่ใช่อ่าน .matches ตอนเรนเดอร์
     อ่านเฉย ๆ จะค้างค่าเดิมตอนผู้ใช้ย่อ/ขยายหน้าต่าง (ไม่มีอะไรสั่งให้เรนเดอร์ใหม่)
     แล้วช่องค้นหาจะไม่ยุบ กลายเป็นเบียดตัวกรองจนโดนตัดครึ่งตัวอย่างที่เคยเป็น */
  const narrow = useIsMobile(1280);
  const compactSearch = isMobile || (!plain && narrow);
  const searchRef = React.useRef(null);
  React.useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);
  /* กรองตามช่างผู้รับผิดชอบ — ช่างที่ล็อกอินเองเห็นแต่งานตัวเองอยู่แล้ว จึงไม่ต้องมีตัวกรองนี้ */
  const showTechFilter = !ownOnly && setTechFilter;
  const techName = (id) => {
    if (id === "__none") return "ยังไม่มอบหมาย";
    const t = (techs || []).find((x) => x.id === id);
    return t ? (t.nick || t.name) : "—";
  };
  /* แถบตัวกรอง — จอใหญ่ขึ้นไปอยู่แถวเดียวกับชื่อหน้า ที่ว่างข้างชื่อหน้ามีเหลืออยู่แล้วทุกหน้า
     และตัวกรองเป็นของคู่กับหัวข้อ ไม่ใช่เนื้อหาอีกแถวที่ดันเนื้อหาจริงให้ต่ำลงไปอีกหนึ่งแถว
     มือถือยังเป็นแถวของตัวเองเหมือนเดิม เพราะแถวบนมีชื่อหน้ากับปุ่มเครื่องมืออัดกันอยู่แล้ว
     (ตกลงมาเป็นแถวของตัวเองอัตโนมัติเมื่อจอแคบจนไม่พอ — .header-top เป็น flex-wrap อยู่แล้ว) */
  const filterBar = !plain && (!isMobile || showTechFilter) ? (
    <div className={"header-filters" + (isMobile ? "" : " in-top")}>
      {!isMobile && <Segmented flat value={typeFilter} onChange={setTypeFilter}
        options={[{ value: "all", label: "ทั้งหมด" }, { value: "home", label: "งานบ้าน" }, { value: "project", label: "โครงการ" }]} />}
      {!isMobile && (
      <button className={"delay-toggle" + (delayedOnly ? " on" : "")} onClick={() => setDelayedOnly((v) => !v)}>
        <Icon name="alert" size={15} color={delayedOnly ? "#fff" : "#EF4444"} />
        เฉพาะงานล่าช้า
      </button>
      )}
      {showTechFilter && <TechFilter value={techFilter} onChange={setTechFilter} techs={techs} counts={techCounts} nameOf={techName} />}
      {/* ปุ่มย่อ/ขยาย "ขั้นงาน" เอาออกแล้ว — ชิปขั้นงานกางอยู่ตลอด
          ปุ่มนั้นทำได้อย่างเดียวคือซ่อนของที่อยู่ถัดลงไปหนึ่งแถว ไม่ได้กรองอะไรเอง
          และมันกินที่บนแถวบนจนแถวปุ่มเครื่องมือตกบรรทัด ซึ่งแพงกว่าประโยชน์ของมันมาก */}
    </div>
  ) : null;
  /* ระยะห่างใต้หัวจอเคยมาจาก padding ของแถวตัวกรอง — ตอนนี้แถวนั้นขึ้นไปอยู่แถวบนแล้ว
     ต้องจ่ายเองที่ตัว header ยกเว้นตอนแถบชิปขั้นงานกางอยู่ ซึ่งมีระยะห่างของมันเองอยู่แล้ว */
  return (
    <header className="app-header" style={{ paddingBottom: isMobile ? 12 : 18 }}>
      <div className="header-top">
        <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
          <Icon name="menu" size={18} color="var(--text-2)" />
        </button>
        {/* .header-top ตั้ง align-items:flex-start ไว้สำหรับก้อนชื่อหน้า+บรรทัดรองที่สูงกว่าของข้าง ๆ
            หน้าที่ไม่มีบรรทัดรอง ชื่อหน้าสูง 26px แต่ชิปผู้ใช้สูง 40px — ชื่อหน้าเลยไปเกาะขอบบนคนเดียว ดูลอย */}
        {/* พื้นขั้นต่ำของก้อนชื่อหน้า — .header-filters.in-top ตั้ง flex-shrink ไว้ต่ำมาก (.15)
            ชื่อหน้าจึงรับการหดไว้เกือบทั้งหมด ปล่อยไว้จะหดจนหายไปทั้งคำตอนจอแคบ
            ตั้งพื้นไว้แล้วเหลืออย่างน้อยสองสามคำแรก ที่เหลือให้แถบตัวกรองเลื่อนแนวนอนเอา ซึ่งมันทำได้อยู่แล้ว */}
        <div style={{ flex: isMobile ? 1 : "0 1 auto", minWidth: isMobile ? 0 : 108, alignSelf: subtitle === "" ? "center" : undefined }}>
          {/* หัวจอมีแต่ชื่อหน้า — มุมที่กำลังดู (บอร์ด/ตาราง · ปฏิทิน/นัดสำรวจ) อยู่เป็นเมนูย่อย
              ในแถบเมนูซ้าย ไม่ใช่บนหัวจอ · แถวบนนี้มีตัวกรอง ช่องค้นหา และปุ่มเครื่องมืออัดอยู่แล้ว
              เติมอะไรเข้าไปอีกคือเบียดกันเอง (เคยลองวางไว้ข้างชื่อหน้าแล้วรก) */}
          <h1 className="page-title">{nav.th}</h1>
          {/* subtitle === "" คือ "หน้านี้ไม่เอาบรรทัดรอง" — ไม่ใช่ null เพราะ null แปลว่า "ใช้บรรทัดมาตรฐาน แสดง N จาก M งาน"
              ไม่เรนเดอร์ <p> เปล่าทิ้งไว้ — มันกินความสูง 21px กับ margin อีก 4px ซึ่งคือสิ่งที่เราอยากเอาออกพอดี */}
          {subtitle !== "" && (
          <p className="page-sub">
            {subtitle || <React.Fragment>แสดง <strong>{count}</strong> จาก {total} งาน{ownOnly && " · เฉพาะงานของคุณ"}</React.Fragment>}
            {stageFilter && <span> · กรอง: {stInfo(stageFilter).th} <button onClick={() => setStageFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
            {quickFilter && <span> · กรอง: {QUICK_LABELS[quickFilter]} <button onClick={() => setQuickFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
            {techFilter && <span> · ช่าง: {techName(techFilter)} <button onClick={() => setTechFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
          </p>
          )}
        </div>
        {/* หน้าที่ไม่มีแถบตัวกรองของหัวจอเอง (om · expense · …) วางช่องเสียบไว้แทน
            ตัวกรองของหน้าเหล่านั้นจะมาเสียบเองตอนเรนเดอร์ — ดิฟเปล่าไม่กินที่ */}
        {!isMobile && (filterBar || <HdrSlot />)}
        <div className="header-actions">
          {searchPh && (compactSearch && !searchOpen ? (
            <button onClick={() => setSearchOpen(true)} title="ค้นหา" aria-label="ค้นหา"
              style={{ width: 40, height: 40, borderRadius: "var(--r-chip)", border: "none", background: "var(--primary)", color: "#fff",
                cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="search" size={18} color="#fff" />
            </button>
          ) : (
            <div className="search-box" style={isMobile ? { maxWidth: "none", flex: 1 } : undefined}>
              <Icon name="search" size={16} color="var(--text-3)" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPh}
                onBlur={() => { if (compactSearch && !search.trim()) setSearchOpen(false); }} />
              {compactSearch && (
                <button className="x-close" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(""); setSearchOpen(false); }} title="ปิดค้นหา" aria-label="ปิดค้นหา"
                  style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, border: "none", background: "var(--surface3)", color: "var(--text-3)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="x" size={14} color="var(--text-3)" />
                </button>
              )}
            </div>
          ))}
          {jobTools && onMap && !(isMobile && searchOpen) && (
            <button onClick={onMap} className="hdr-icon-btn" title="แผนที่งาน" aria-label="แผนที่งาน">
              <Icon name="map" size={20} color="var(--text-2)" />
            </button>
          )}
          <HeaderTools hidden={isMobile && searchOpen} showBell={showBell} unread={unread} notifItems={notifItems}
            lateAlerts={lateAlerts} omAlerts={omAlerts} onOpenOm={onOpenOm} notifOpen={notifOpen} onBell={onBell}
            onCloseNotif={onCloseNotif} onOpenNotif={onOpenNotif} onMarkAll={onMarkAll}
            aurora={aurora} onToggleAurora={onToggleAurora} me={me} onMySign={onMySign} />
        </div>
      </div>
      {/* มือถือ: แถบตัวกรองยังเป็นแถวของตัวเองใต้หัว และเหลือไว้แค่ตัวกรองช่าง (ตัวอื่นซ่อนเพื่อประหยัดพื้นที่) */}
      {isMobile && filterBar}
      {/* แถบชิปกรองขั้นงานเอาออกแล้วตามที่สั่ง — มันกินความสูงของหัวจอไปอีกหนึ่งแถวทุกหน้า
          การกรองตามขั้นยังทำได้จากแผงไปป์ไลน์ในหน้าภาพรวม และล้างได้ที่บรรทัดใต้ชื่อหน้า
          ("กรอง: ... ล้าง ✕") ซึ่งเป็นที่เดียวที่บอกว่ากำลังกรองอะไรอยู่ */}
    </header>
  );
}

/* สรุปงานวันนี้ — เด้งครั้งแรกของวัน */
function DailyBriefing({ lateAlerts, todayTasks, onOpen, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.SF.TODAY;
  const Row = ({ jobId, color, danger, title, sub }) => (
    <button onClick={() => onOpen(jobId)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", width: "100%", textAlign: "left",
      background: danger ? "var(--tint-red-bg)" : "var(--surface)", border: "none", boxShadow: danger ? "inset 0 0 0 1px var(--tint-red-bd)" : "var(--shadow-sm)", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: color, color: "#fff" }}><Icon name={danger ? "alert" : "wrench"} size={16} color="#fff" /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: danger ? "var(--tint-red-tx)" : "var(--text-2)", marginTop: 1 }}>{sub}</span>
      </span>
      <Icon name="chevronRight" size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
    </button>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)", zIndex: 120, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(480px,100%)", maxHeight: isMobile ? "90dvh" : "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="bell" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>สรุปงานวันนี้</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{thDate(today, true)}</span>
            </div>
          </div>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {lateAlerts.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--tint-red-tx2)", padding: "2px 2px" }}>⚠ เลยกำหนด ({lateAlerts.length})</div>}
          {lateAlerts.map((a, i) => (
            <Row key={"l" + i} jobId={a.jobId} color="#EF4444" danger title={a.jobName} sub={'ขั้น "' + a.stage.th + '" เลยกำหนด ' + a.stage.daysLate + " วัน"} />
          ))}
          {todayTasks.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--primary-dark)", padding: "6px 2px 2px" }}>📍 กำหนดวันนี้ ({todayTasks.length})</div>}
          {todayTasks.map((e, i) => (
            <Row key={"t" + i} jobId={e.job.id} color={e.stage.color} title={e.job.name} sub={({ start: "เริ่ม", progress: "กำลังดำเนินการ", end: "ส่งมอบ/เสร็จ", both: "เริ่ม–เสร็จ" }[e.kind]) + " · " + e.stage.th} />
          ))}
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--divider)", background: "var(--surface)" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: "var(--r-chip)", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>รับทราบ</button>
        </div>
      </div>
    </div>
  );
}

/* แผนที่งาน — popup เต็มจอ เปิดจากปุ่มใน header */
/* ============================================================
   DeleteJobAsk — ถามก่อนย้ายงานเข้าถังขยะ
   ------------------------------------------------------------
   ไม่ใช้ confirm() ของเบราว์เซอร์ เพราะถ้าถูกบล็อกกล่องข้อความไว้ มันจะคืน false เงียบ ๆ
   ปุ่มยืนยันต้องกดสองจังหวะ (ค้างไว้ที่ปุ่มแดง) ไม่ได้ — จึงวางปุ่มยกเลิกไว้ก่อน กันมือลั่น
   ============================================================ */
/* ย้อนกลับเป็นงานขาย — บอกให้ชัดว่าอะไรตามกลับไปบ้าง และงานไปอยู่ที่ไหน
   คนกดจะได้ไม่ต้องเดาว่ารูปสำรวจกับใบเสนอราคาหายไปหรือเปล่า */
function RevertJobAsk({ job, lead, onConfirm, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 125, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-tile)", width: "min(440px, 100%)", padding: 20, boxShadow: "var(--shadow-modal)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="undo" size={18} color="var(--primary-dark)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)" }}>ย้อนงานนี้กลับไปเป็นงานขาย?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.6 }}>
              <b>{job.code}</b> · {job.name || "(ไม่มีชื่อ)"}<br />
              กลับไปอยู่ที่ใบลูกค้า <b>{lead.code || lead.id}</b> ขั้น “ต่อรอง / รอตัดสินใจ”
            </div>
            <ul style={{ margin: "10px 0 0", paddingLeft: 17, fontSize: 12, color: "var(--text-2)", lineHeight: 1.75 }}>
              <li>แบบสำรวจ · รูปสำรวจ · ไฟล์แบบ · แบบ 3D · BOQ ตามกลับไปกับใบลูกค้า</li>
              <li>ใบเสนอราคาและนัดหมายถูกปลดออกจากเลขงานนี้</li>
              <li>ตัวงานย้ายเข้าถังขยะ กู้คืนได้ที่หน้าฐานข้อมูลงาน</li>
            </ul>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ padding: "10px 16px", borderRadius: "var(--r-chip)", border: "none",
            background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ย้อนกลับเป็นงานขาย</button>
        </div>
      </div>
    </div>
  );
}

function DeleteJobAsk({ job, onConfirm, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 125, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-tile)", width: "min(420px, 100%)", padding: 20, boxShadow: "var(--shadow-modal)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", background: "var(--tint-red-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="trash" size={18} color="#EF4444" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)" }}>ย้ายงานนี้เข้าถังขยะ?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.55 }}>
              <b>{job.code}</b> · {job.name || "(ไม่มีชื่อ)"}<br />
              งานจะหายจากทุกหน้าจอ แต่ยังกู้คืนได้ที่ “ถังขยะ” ในหน้าฐานข้อมูลงาน
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ padding: "10px 16px", borderRadius: "var(--r-chip)", border: "none",
            background: "#EF4444", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ย้ายเข้าถังขยะ</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TrashModal — ถังขยะงานติดตั้ง: กู้คืน หรือลบถาวร
   ------------------------------------------------------------
   ลบถาวรต้องเป็นแอดมิน + ใส่รหัสผ่านของบัญชีที่ล็อกอินอยู่ซ้ำอีกครั้ง
   (กันเผลอกด และกันคนที่มาใช้เครื่องต่อจากคนอื่นลบทิ้ง)
   ============================================================ */
function TrashModal({ trash, me, onRestore, onPurge, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isAdmin = !!me && hasRole(userRoles(me), "admin");
  const [ask, setAsk] = React.useState(null);   // id ที่กำลังจะลบถาวร
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState("");

  const doPurge = (id) => {
    if (!isAdmin) { setErr("เฉพาะแอดมินเท่านั้นที่ลบถาวรได้"); return; }
    if (String(me.pin) !== String(pw)) { setErr("รหัสผ่านไม่ถูกต้อง"); return; }
    onPurge(id); setAsk(null); setPw(""); setErr("");
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 125, display: "grid", placeItems: isMobile ? "stretch" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : 18,
        width: isMobile ? "100%" : "min(640px, 100%)", maxHeight: isMobile ? "100%" : "84vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: "var(--r-chip)", background: "var(--tint-red-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="trash" size={17} color="#EF4444" /></span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ถังขยะ</h2>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{trash.length} งาน · กู้คืนได้ตลอด · ลบถาวรต้องใส่รหัสผ่าน</span>
            </div>
          </div>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          {trash.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ถังขยะว่าง — ยังไม่มีงานที่ถูกลบ</div>
          )}
          {trash.map((j) => (
            <div key={j.id} style={{ background: "var(--surface)", border: "none", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-chip)", padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{j.name || "(ไม่มีชื่อ)"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {j.code}{j.province ? " · " + j.province : ""}{j.kw ? " · " + j.kw + " kW" : ""}
                    {j.deletedAt ? " · ลบเมื่อ " + thDate(String(j.deletedAt).slice(0, 10), true) : ""}
                    {j.deletedBy ? " โดย " + j.deletedBy : ""}
                  </div>
                </div>
                <button onClick={() => onRestore(j.id)} style={{ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--primary)",
                  background: "var(--primary-soft)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>กู้คืน</button>
                {isAdmin && ask !== j.id && (
                  <button onClick={() => { setAsk(j.id); setPw(""); setErr(""); }} style={{ padding: "8px 13px", borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)",
                    background: "var(--surface)", color: "var(--tint-red-tx2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบถาวร</button>
                )}
              </div>
              {ask === j.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: 11.5, color: "var(--tint-red-tx)", fontWeight: 700, marginBottom: 7 }}>
                    ลบถาวรแล้วกู้คืนไม่ได้ — ใส่รหัสผ่านของ {me && me.name ? me.name : "บัญชีนี้"} เพื่อยืนยัน
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <input type="password" value={pw} autoFocus autoComplete="off"
                      onChange={(e) => { setPw(e.target.value); setErr(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") doPurge(j.id); }}
                      placeholder="รหัสผ่าน"
                      style={{ flex: 1, minWidth: 130, background: "var(--surface2)", border: "none", color: "var(--text-1)",
                        fontFamily: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 9, outline: "none" }} />
                    <button onClick={() => doPurge(j.id)} style={{ padding: "8px 14px", borderRadius: 9, border: "none",
                      background: "#EF4444", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบถาวร</button>
                    <button onClick={() => { setAsk(null); setPw(""); setErr(""); }} style={{ padding: "8px 13px", borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)",
                      background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
                  </div>
                  {err && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: "var(--tint-red-tx2)" }}>{err}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        {!isAdmin && trash.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--divider)", background: "var(--surface)", fontSize: 11.5, color: "var(--text-3)" }}>
            ลบถาวรได้เฉพาะแอดมิน — งานในถังขยะจะอยู่ตรงนี้จนกว่าแอดมินจะจัดการ
          </div>
        )}
      </div>
    </div>
  );
}

function MapModal({ jobs, onOpen, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 95, display: "grid", placeItems: isMobile ? "stretch" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : 20,
        width: isMobile ? "100%" : "min(1120px, 100%)", height: isMobile ? "100%" : "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="map" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>แผนที่งานติดตั้ง</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{jobs.length} งาน · คลิกหมุดเพื่อดูรายละเอียด</span>
            </div>
          </div>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: isMobile ? "auto" : "hidden", padding: isMobile ? 14 : 18, display: "flex", flexDirection: "column" }}>
          <MapView jobs={jobs} onOpen={onOpen} />
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
