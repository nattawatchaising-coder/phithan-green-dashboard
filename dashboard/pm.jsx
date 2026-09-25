/* ══════════════════════════════════════════════════
   สมุดตรวจรับและส่งมอบระบบ (Commissioning & Handover) — ตรรกะและข้อมูล

   ก่อนส่งงานให้ทีมบริการหลังการขายและส่งมอบให้ลูกค้า ต้องกรอกสมุดตรวจรับตามแบบ PM2
   (19 แผ่น) เดิมกรอกในไฟล์ Excel ที่เวียนกันทางแชต ไม่มีใครรู้ว่าขาดอะไรจนกว่าจะเปิดไล่ดูทีละแผ่น
   และข้อมูลที่ระบบรู้อยู่แล้ว (รุ่นแผง · รุ่นอินเวอร์เตอร์ · ที่อยู่ · พิกัด) ต้องพิมพ์ใหม่ทุกครั้ง

   หนึ่งใบงาน = หนึ่งเล่ม ไม่ใช่รายการหลายใบเหมือนใบตรวจสอบงาน (inspect.jsx)
   เพราะส่งมอบมีครั้งเดียว ถ้าทำเป็นรายการจะเกิดคำถามว่า "สามเล่มนี้เล่มไหนของจริง"
   ซึ่งคือสิ่งที่สมุดนี้มีไว้กันพอดี

   ⚠ เก็บในโหนดของตัวเอง ไม่แปะบนใบงาน — store.jsx ทำ ref("jobs").on("value")
     ทุกเครื่องจึงโหลดงานทั้งตารางมาไว้ในหน่วยความจำ แบบสำรวจกับใบขออนุญาตแปะได้เพราะมี ~40 ฟิลด์
     แต่แผ่นทดสอบ B1 แผ่นเดียวมี ~137 แถว × 4 ช่อง แปะบนใบงาน = ทุกเครื่องจ่ายค่าเน็ตให้ทุกครั้งที่เปิดแอป
     บนใบงานเก็บแค่ "เงา" ไม่กี่ตัวเลขไว้ให้การ์ดกับหน้ารายการอ่านสถานะ (ดู pmSummaryOf)

   ⚠ ห้าม set() ทั้งเรคคอร์ด ใช้ update() ที่ใบเสมอ — ตอนคอมมิชชันนิ่งมีคนกรอกคนละแผ่นพร้อมกันจริง
     set() ทั้งก้อนจะลบงานอีกคนเงียบ ๆ และวินัยนี้ทำให้ทุกการเขียนห่างเพดาน ~10MB ต่อครั้งของ RTDB หลายเท่า

   ⚠ สมุดนี้มีที่อยู่ลูกค้า พิกัดจริง และซีเรียลอุปกรณ์ — อย่าเอาไฟล์ PM2 ของจริงไปทำข้อมูลทดสอบ
     (repo เป็นสาธารณะ และฐานข้อมูลอ่านได้ทั้งโลก)

   เกร็ด: ชื่อแผ่นในไฟล์ต้นฉบับคือ "Documents checklist " มีช่องว่างท้าย
   ถ้าวันหนึ่งมีคนเขียนตัวนำเข้า wb.Sheets["Documents checklist"] จะได้ undefined

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย pm / Pm / PM_
   (ห้ามตั้งชื่อ pm เปล่า ๆ — drawer.jsx มี const pm = job.permit ระดับฟังก์ชันอยู่แล้ว)
   ══════════════════════════════════════════════════ */

/* ── โหมดทดสอบ ──
   ตั้ง localStorage.pm_test_root = "_sandbox/" แล้วรีโหลด ข้อมูลของโมดูลนี้จะไปอยู่ใต้ _sandbox/
   รับ ?test=1 ด้วยเพราะ localStorage ตั้งใน WebView ของ LINE ไม่สะดวก (กฎเดียวกับ EC_ROOT)
   ⚠ "เงา" บนใบงานไปผ่าน store.patch ซึ่งไม่รู้จัก root — ตอนอยู่ในกล่องทรายจึงไม่เขียนเงา */
const PM_ROOT = (() => {
  try {
    if (/(^|[?&])test=1(&|$)/.test(window.location.search || "")) return "_sandbox/";
    return localStorage.getItem("pm_test_root") || "";
  } catch (e) { return ""; }
})();
const _PMFB = () => !!window.FBDB;
const _pmRef = (p) => window.FBDB.ref(PM_ROOT + p);
const _pmRoot = () => window.FBDB.ref(PM_ROOT || "/");

const pmToday = () => new Date().toISOString().slice(0, 10);
const pmNow = () => new Date().toISOString();

/* ══════════════════════════════════════════════════
   เวอร์ชันของสัญญา "อะไรบ้างที่ถือว่าบังคับ"

   แบบสำรวจ (survey.jsx) แก้ปัญหานี้ด้วยการแช่ชุดฟิลด์ไว้ถาวร ใช้ได้แต่ชุดโตไม่ได้อีกเลย
   ที่นี่ใช้เวอร์ชันแทน: ทุกรายการบังคับมี since: N แล้วเทียบกับ ver ของเรคคอร์ด
   ⇒ เล่มที่เปิดตอน ver 1 ถูกตัดสินด้วยสัญญา ver 1 ตลอดชีพ ไม่มีวันตกจาก 100% เหลือ 87%
     เพราะมีคนเพิ่มฟิลด์ไตรมาสหน้า

   ⚠ กฎ: เพิ่มรายการที่มี req:1 ใหม่ ต้องบัมพ์ PM_VER และใส่ since: PM_VER ของรายการนั้นเสมอ
     ลืมบัมพ์ = รายการใหม่ไม่เคยถูกบังคับกับใครเลย
   ══════════════════════════════════════════════════ */
const PM_VER = 1;

/* คีย์ที่เลิกใช้แล้ว แต่ของเก่ายังมีค่าเก็บอยู่ — ยังต้องอ่านออกเพื่อพิมพ์ลงใบ
   (แบบเดียวกับ SURVEY_RETIRED_SLOTS ใน survey.jsx) */
/* คีย์ที่เลิกใช้ — ตัวนับไม่เห็นแล้ว แต่ค่าเก่ายังนอนอยู่ใน RTDB ของเล่มที่เปิดก่อนหน้านี้
   ไม่ลบทิ้งอัตโนมัติ เพราะการลบข้อมูลที่คนกรอกไว้แล้วต้องเป็นการตัดสินใจของคน ไม่ใช่ของโค้ดที่เผลอรัน
   engCleantech/pmHead/ecoEng/regionalPm/apEcotech = ชื่อตำแหน่งกับชื่อบริษัทที่ติดมากับไฟล์ PM2 ต้นฉบับ */
const PM_RETIRED = ["engCleantech", "ecoEng", "pmHead", "regionalPm", "apEcotech",
  "s1Cap", "s1Az", "s2Cap", "s2Az", "s3Cap", "s3Az"];  /* ระบบย่อย — ไม่ได้ใช้กับงานที่ทำจริง */

const pmVerOf = (rec) => (rec && rec.meta && +rec.meta.ver) || PM_VER;
const pmActive = (it, ver) => !!it.req && (it.since || 1) <= ver;

/* ══════════════════════════════════════════════════
   ทะเบียนหมวด/ฟิลด์ — โครงสร้างประกาศตัวเดียวขับทั้ง ฟอร์ม · เช็คลิสต์ · กระดาษ A4 · ไฟล์ Excel

   ตัวเอนจินรู้จักแค่ kind ("fields" · "checklist" · "sign" · "table") ไม่เคยรู้จักชื่อแผ่นรายตัว
   ⇒ แผ่นทดสอบของเฟสถัดไป (A1 · B1/B3/B4 · C1/C2 · D1-D3 · E1/E2 · W1) เสียบเข้ามาเป็น "ข้อมูล"
     ไม่ต้องแก้ทั้งเอนจิน ฟอร์ม กระดาษ และไฟล์ Excel

   from: "…" คือที่มาของค่าที่เติมให้ล่วงหน้า (ดู pmPrefill) — ป้ายบนช่องกรอกอ่านจากตรงนี้
   ══════════════════════════════════════════════════ */
const PM_SECTIONS = [

  /* ── แผ่น Summary ของต้นฉบับ ── */
  {
    key: "sum", en: "Summary", th: "ข้อมูลโครงการและระบบ", icon: "file", since: 1, kind: "fields",
    groups: [
      {
        key: "site", en: "Project & Site", th: "โครงการและที่ตั้ง", fields: [
          { key: "projName", en: "Name of Project", th: "ชื่อโครงการ", type: "text", req: 1, since: 1, from: "job" },
          { key: "inspDate", en: "Date of Inspection", th: "วันที่ตรวจสอบ", type: "date", req: 1, since: 1 },
          { key: "siteAddr", en: "Site Address", th: "ที่อยู่ไซต์งาน", type: "area", req: 1, since: 1, from: "job" },
          { key: "country", en: "Country", th: "ประเทศ", type: "text", req: 1, since: 1 },
          { key: "gpsLat", en: "GPS Latitude", th: "ละติจูด", type: "text", req: 1, since: 1, from: "survey", ph: "18.5450" },
          { key: "gpsLng", en: "GPS Longitude", th: "ลองจิจูด", type: "text", req: 1, since: 1, from: "survey", ph: "99.0169" },
          { key: "altM", en: "Site Altitude", th: "ความสูงจากระดับน้ำทะเล", type: "num", unit: "m", since: 1 },
        ],
      },
      {
        key: "sys", en: "System", th: "ข้อมูลระบบ", fields: [
          { key: "sysType", en: "Type of the System", th: "ประเภทระบบ", type: "select", req: 1, since: 1,
            opts: ["Grid-Connected", "Off-Grid", "Hybrid"] },
          { key: "dcKwp", en: "System DC Capacity", th: "กำลังติดตั้งด้าน DC", type: "num", unit: "kWp", req: 1, since: 1, from: "job" },
          { key: "acKw", en: "System AC Capacity", th: "กำลังจ่ายด้าน AC", type: "num", unit: "kW AC", req: 1, since: 1, from: "boq" },
          { key: "outV", en: "System Output Voltage Level", th: "ระดับแรงดันด้านออก", type: "num", unit: "V", req: 1, since: 1, from: "job" },
          { key: "tiltDeg", en: "Tilt Angle", th: "มุมเอียงแผง", type: "num", unit: "°", since: 1 },
          { key: "instType", en: "Type of Installation", th: "รูปแบบการติดตั้ง", type: "select", since: 1,
            opts: ["Rooftop", "Ground Mount", "Carport"] },
          { key: "orientation", en: "Orientation", th: "ลักษณะการวาง", type: "text", since: 1 },
          { key: "instFrom", en: "Period of Installation (From)", th: "เริ่มติดตั้ง", type: "date", since: 1, from: "job" },
          { key: "instTo", en: "Period of Installation (To)", th: "ติดตั้งเสร็จ", type: "date", since: 1, from: "job" },
        ],
      },
      /* ── กลุ่มที่กดเพิ่มชุดได้ (repeat) ──
         ต้นฉบับเจาะไว้ตายตัวว่าแผงสองชุด อินเวอร์เตอร์ชุดเดียว แต่งานจริงมีทั้งไซต์ที่ใช้แผงรุ่นเดียว
         และไซต์ที่ผสมสามรุ่น/อินเวอร์เตอร์หลายรุ่น ⇒ ให้คนกรอกกดเพิ่มเอาตอนกรอก
         จำนวนชุดเก็บเป็นตัวเลขใน sum[countKey] · คีย์ของช่องคือ prefix+เลขชุด+ชื่อช่อง

         ⚠ ชุดแรกของอินเวอร์เตอร์ใช้คีย์เปล่า (invBrand ไม่ใช่ inv1Brand) เพราะเล่มที่กรอกไปแล้ว
           เก็บไว้ด้วยคีย์นั้น — เปลี่ยนคีย์คือทำให้ข้อมูลที่คนกรอกไว้หายไปเงียบ ๆ (plainFirst) */
      {
        key: "pv", repeat: {
          countKey: "pvSets", prefix: "pv", max: 8, plainFirst: false,
          addTh: "เพิ่มชุดแผง", addEn: "Add PV module set", oneTh: "ชุดแผง",
          label: (n, count) => (count > 1 || n > 1
            ? { en: "PV Module " + n, th: "แผงโซลาร์ชุดที่ " + n }
            : { en: "PV Module", th: "แผงโซลาร์" }),
        },
        fields: [
          { key: "Brand", en: "Module Brand", th: "ยี่ห้อแผง", type: "text", req: 1, since: 1, from: "boq" },
          { key: "Model", en: "Module Model No.", th: "รุ่นแผง", type: "text", req: 1, since: 1, from: "boq" },
          { key: "Wp", en: "Nameplate Capacity (DC Wp)", th: "กำลังต่อแผง", type: "num", unit: "Wp", req: 1, since: 1, from: "boq" },
          { key: "Qty", en: "Number of Solar Modules", th: "จำนวนแผง", type: "num", unit: "แผ่น", req: 1, since: 1, from: "job" },
        ],
      },
      {
        key: "inv", repeat: {
          countKey: "invSets", prefix: "inv", max: 8, plainFirst: true,
          addTh: "เพิ่มรุ่นอินเวอร์เตอร์", addEn: "Add inverter set", oneTh: "ชุดอินเวอร์เตอร์",
          label: (n, count) => (count > 1 || n > 1
            ? { en: "Solar Inverter " + n, th: "อินเวอร์เตอร์ชุดที่ " + n }
            : { en: "Solar Inverter", th: "อินเวอร์เตอร์" }),
        },
        fields: [
          { key: "Brand", en: "Inverter Brand", th: "ยี่ห้ออินเวอร์เตอร์", type: "text", req: 1, since: 1, from: "boq" },
          { key: "Model", en: "Inverter Model No.", th: "รุ่นอินเวอร์เตอร์", type: "text", req: 1, since: 1, from: "boq" },
          { key: "Kw", en: "Nameplate Capacity (AC kW)", th: "กำลังต่อเครื่อง", type: "num", unit: "kW", req: 1, since: 1, from: "boq" },
          { key: "Qty", en: "Number of Inverters", th: "จำนวนเครื่อง", type: "num", unit: "เครื่อง", req: 1, since: 1, from: "boq" },
        ],
      },
      {
        key: "prot", en: "Protection & Wiring", th: "อุปกรณ์ป้องกันและสายไฟ", fields: [
          { key: "fuseType", en: "String Overcurrent Device — Type", th: "ชนิดอุปกรณ์ป้องกันกระแสเกินสตริง", type: "text", req: 1, since: 1 },
          { key: "fuseA", en: "Rating", th: "พิกัดกระแส", type: "num", unit: "A", req: 1, since: 1 },
          { key: "fuseVdc", en: "DC Rating", th: "พิกัดแรงดัน DC", type: "num", unit: "V", req: 1, since: 1 },
          { key: "fuseKa", en: "Breaking Capacity", th: "พิกัดตัดกระแสลัดวงจร", type: "num", unit: "kA", since: 1 },
          { key: "wireBrand", en: "String Wiring (DC) — Brand", th: "ยี่ห้อสาย DC", type: "text", req: 1, since: 1 },
          /* คีย์ยังเป็น wirePhaseMm ตามเดิม — ต้นฉบับเรียกช่องนี้ว่า "Phase (sq mm)"
             แต่ที่หน้างานเรียกกันว่าขนาดสาย เปลี่ยนแค่ป้าย ไม่เปลี่ยนคีย์ ข้อมูลที่กรอกไว้จะได้ไม่หาย */
          { key: "wirePhaseMm", en: "Cable Size", th: "ขนาดสายไฟ", type: "num", unit: "sq mm", req: 1, since: 1, from: "boq" },
          { key: "wireEarthMm", en: "Earth", th: "ขนาดสายดิน", type: "num", unit: "sq mm", req: 1, since: 1 },
          { key: "isoBrand", en: "Array Isolator — Brand", th: "ยี่ห้อสวิตช์ตัดตอนฝั่งแผง", type: "text", since: 1 },
          { key: "isoA", en: "Rating (A)", th: "พิกัดกระแส", type: "num", unit: "A", since: 1 },
          { key: "isoV", en: "Rating (V)", th: "พิกัดแรงดัน", type: "text", since: 1 },
        ],
      },
      {
        key: "eng", en: "Engineers Undertaking Commissioning", th: "วิศวกรผู้ทดสอบระบบ", fields: [
          { key: "engProject", en: "Project Engineer", th: "วิศวกรโปรเจค", type: "text", req: 1, since: 1, from: "job" },
          { key: "engTester", en: "Name of Tester", th: "ชื่อผู้ทดสอบ", type: "text", req: 1, since: 1, from: "user" },
        ],
      },
    ],
  },

  /* ── แผ่น Documents checklist ของต้นฉบับ ──
     ทุกบรรทัดกาเป็น √ หรือ - ตามแบบฟอร์มจริง */
  {
    key: "docs", en: "Documents Checklist", th: "รายการเอกสารส่งมอบ", icon: "list", since: 1, kind: "checklist",
    groups: [
      {
        key: "dwgDc", en: "Drawings — DC System", th: "แบบ — ระบบ DC", items: [
          { key: "sldString", en: "PV System Single Line Diagram and PV String Layout", th: "ไดอะแกรมเส้นเดียวและผังสตริง", req: 1, since: 1 },
          { key: "dcTray", en: "DC Cable and Cable Tray Route", th: "เส้นทางเดินสายและรางสาย DC", req: 1, since: 1 },
          { key: "dcComb", en: "DC Combiner Box", th: "ตู้รวมสาย DC", req: 1, since: 1 },
        ],
      },
      {
        key: "dwgMount", en: "Drawings — Mounting", th: "แบบ — โครงสร้างรองรับ", items: [
          { key: "modLayout", en: "PV Module Layout", th: "ผังการวางแผง", req: 1, since: 1 },
          { key: "mntLayout", en: "Mounting Layout", th: "ผังโครงสร้างรองรับ", req: 1, since: 1 },
          { key: "walkway", en: "Walkway Layout", th: "ผังทางเดินบนหลังคา", req: 1, since: 1 },
          { key: "lifeline", en: "Lifeline Layout", th: "ผังเส้นชีวิต (Lifeline)", req: 1, since: 1 },
          { key: "ladder", en: "Ladder Layout", th: "ผังบันไดขึ้นหลังคา", req: 1, since: 1 },
          { key: "invHouse", en: "Inverter Housing and Racking Layout", th: "ผังห้องและแร็คอินเวอร์เตอร์", req: 1, since: 1 },
        ],
      },
      {
        key: "dwgAc", en: "Drawings — AC System", th: "แบบ — ระบบ AC", items: [
          { key: "acRoute", en: "AC Cable Route and Raceway", th: "เส้นทางเดินสายและรางสาย AC", req: 1, since: 1 },
          { key: "acRaceway", en: "Detail of AC Cable Raceway from Inverter Housing to MDB", th: "รายละเอียดรางสาย AC จากห้องอินเวอร์เตอร์ถึงตู้ MDB", req: 1, since: 1 },
          { key: "mdbRoom", en: "Main Distribution Board (MDB) Room Layout Detail", th: "ผังห้องตู้จ่ายไฟหลัก (MDB)", req: 1, since: 1 },
          { key: "invLight", en: "Installation of Lighting and Receptacle for Inverter Housing", th: "งานไฟแสงสว่างและเต้ารับในห้องอินเวอร์เตอร์", req: 1, since: 1 },
        ],
      },
      {
        key: "dwgGnd", en: "Drawings — Ground System", th: "แบบ — ระบบสายดิน", items: [
          { key: "gndLayout", en: "Grounding System Layout", th: "ผังระบบสายดิน", req: 1, since: 1 },
        ],
      },
      {
        key: "dwgZx", en: "Drawings — Zero Export and Communication System", th: "แบบ — ระบบกันไฟย้อนและระบบสื่อสาร", items: [
          { key: "commConfig", en: "Communication System Configuration", th: "ผังการตั้งค่าระบบสื่อสาร", req: 1, since: 1 },
          { key: "commRoute", en: "Communication Cable Route and Raceway on Rooftop", th: "เส้นทางสายสื่อสารและรางสายบนหลังคา", req: 1, since: 1 },
          { key: "pqmPanel", en: "PQM / Relay Communication Panel Layout", th: "ผังตู้ PQM และรีเลย์สื่อสาร", req: 1, since: 1 },
          { key: "weatherStn", en: "Weather Station and Instrument Layout", th: "ผังสถานีวัดอากาศและอุปกรณ์วัด", req: 1, since: 1 },
        ],
      },
      {
        key: "dwgWtr", en: "Drawings — Water System", th: "แบบ — ระบบน้ำล้างแผง", items: [
          { key: "waterLayout", en: "Water Cleaning System Layout", th: "ผังระบบล้างแผง", req: 1, since: 1 },
          { key: "pumpFound", en: "Section of Water Pump and Tank Foundation", th: "รูปตัดฐานปั๊มน้ำและถังเก็บน้ำ", req: 1, since: 1 },
        ],
      },
      {
        key: "testStd", en: "Test Reports — Standard Tests", th: "รายงานผลทดสอบ — มาตรฐาน", items: [
          { key: "tEquip", en: "Equipotential Test", th: "ทดสอบความต่างศักย์เท่ากัน", req: 1, since: 1, test: "a1" },
          { key: "tDcIns", en: "DC Insulation Test (String Cables)", th: "ทดสอบความเป็นฉนวนสาย DC", req: 1, since: 1, test: "b1" },
          { key: "tDcPol", en: "DC Polarity & Voltage (String Cables)", th: "ทดสอบขั้วและแรงดัน DC", req: 1, since: 1, test: "b3" },
          { key: "tDcAmp", en: "DC Current (String Cables)", th: "ทดสอบกระแส DC", req: 1, since: 1, test: "b4" },
          { key: "tAc", en: "AC Circuitry Test (ACDB to MCCB)", th: "ทดสอบวงจร AC", req: 1, since: 1, test: "c1" },
          { key: "tTherm", en: "Thermal Photos — Inverter", th: "ภาพถ่ายความร้อนอินเวอร์เตอร์", req: 1, since: 1, test: "d1" },
          { key: "tWater", en: "Water Cleaning System Test", th: "ทดสอบระบบล้างแผง", req: 1, since: 1, test: "w1" },
        ],
      },
      {
        key: "testSpec", en: "Test Reports — Specialist Tests", th: "รายงานผลทดสอบ — เฉพาะทาง", items: [
          { key: "relayTrip", en: "Relay Trip Test", th: "ทดสอบการทริปของรีเลย์", req: 1, since: 1 },
          { key: "relayConfig", en: "Relay Setting Configuration", th: "การตั้งค่ารีเลย์", req: 1, since: 1 },
        ],
      },
      {
        key: "warranty", en: "Warranty Documents", th: "เอกสารรับประกัน", items: [
          { key: "wModule", en: "Module Warranty", th: "ใบรับประกันแผง", req: 1, since: 1 },
          { key: "wInverter", en: "Inverter Warranty", th: "ใบรับประกันอินเวอร์เตอร์", req: 1, since: 1 },
          { key: "wPv", en: "PV Warranty", th: "ใบรับประกันงานระบบ PV", req: 1, since: 1 },
          { key: "wSystem", en: "Solar Cell System Warranty", th: "ใบรับประกันระบบโซลาร์เซลล์", req: 1, since: 1 },
        ],
      },
      {
        key: "approval", en: "Approvals", th: "การอนุมัติ", items: [
          { key: "apCompany", en: "Contractor Approval", th: "อนุมัติโดยบริษัทผู้รับเหมา", dyn: "company", req: 1, since: 1 },
          { key: "apOwner", en: "Owner Approval", th: "อนุมัติโดยเจ้าของโครงการ", dyn: "project", req: 1, since: 1 },
        ],
      },
    ],
  },

  /* ── ช่องลงนามสามช่องตามสายอนุมัติจริง — หน้างาน → โปรเจค → เจ้าของโครงการ
     ต้นฉบับมีช่อง Regional PM Head ด้วย แต่เป็นตำแหน่งของบริษัทที่ทำไฟล์นั้น ไม่มีในสายงานเรา ── */
  {
    key: "sign", en: "Signatures", th: "ลงนามส่งมอบ", icon: "check", since: 1, kind: "sign",
    blocks: [
      { key: "signSite", en: "Signature of Site Engineer", th: "วิศวกรหน้างาน", req: 1, since: 1 },
      { key: "signProject", en: "Signature of Project Engineer", th: "วิศวกรโปรเจค", req: 1, since: 1 },
      { key: "owner", en: "Signature of Project Owner", th: "เจ้าของโครงการ", req: 1, since: 1 },
    ],
  },
];

/* หาหมวดจากคีย์ — ใช้บ่อยทั้งในฟอร์ม กระดาษ และไฟล์ Excel */
const PM_SEC_BY = {};
PM_SECTIONS.forEach((s) => { PM_SEC_BY[s.key] = s; });

/* ป้ายบอกที่มาของค่าที่เติมให้ล่วงหน้า — ความหมายคือ "ช่วยตรวจที" ไม่ใช่ "อันนี้เสร็จแล้ว" */
const PM_FROM_LABEL = { job: "จากใบงาน", boq: "จาก BOQ", survey: "จากแบบสำรวจ", user: "จากผู้ใช้งาน" };

/* ชื่อจริงที่ต่อท้ายป้ายของแถวเช็คลิสต์บางแถว (item.dyn)
   แถวอนุมัติต้องบอกว่า "ใครอนุมัติ" ให้ชัด — บริษัทเรา กับ ชื่อโครงการของงานนี้
   ไม่ใช่ชื่อบริษัทที่ติดมากับไฟล์ต้นฉบับ · คืนสตริงว่างเมื่อยังไม่รู้ชื่อ ป้ายจะได้ไม่ห้อยขีดเปล่า ๆ */
function pmDocName(item, job) {
  if (!item || !item.dyn) return "";
  if (item.dyn === "company") return ((window.BRANDING || {}).legal) || "";
  if (item.dyn === "project") return (job && (job.name || job.customer)) || "";
  return "";
}

/* ป้ายเต็มของแถวเช็คลิสต์ — ใช้ร่วมกันทั้งฟอร์ม กระดาษ และไฟล์ Excel จะได้ไม่เขียนคนละอย่าง */
function pmDocLabel(item, job) {
  const nm = pmDocName(item, job);
  return { en: item.en + (nm ? " — " + nm : ""), th: item.th + (nm ? " · " + nm : "") };
}

/* ══════════════════════════════════════════════════
   กลุ่มที่กดเพิ่มชุดได้ — คลี่ออกเป็นกลุ่มธรรมดาก่อนส่งให้ตัวนับ ฟอร์ม กระดาษ และไฟล์ Excel
   ทั้งสี่ที่จึงยังเห็นแค่ "กลุ่มที่มี fields" เหมือนเดิม ไม่มีใครต้องรู้จักคำว่า repeat
   ══════════════════════════════════════════════════ */

/* คำนำหน้าคีย์ของชุดที่ n — ชุดแรกของ inv ใช้คีย์เปล่าเพื่อไม่ทิ้งข้อมูลเดิม */
const pmSetId = (rp, n) => (rp.plainFirst && n === 1 ? rp.prefix : rp.prefix + n);

/* จำนวนชุดที่จะแสดง — เอาตามที่คนกดไว้ แต่ห้ามต่ำกว่าชุดที่มีข้อมูลกรอกไว้แล้ว
   (เล่มที่กรอกแผงชุดที่สองไว้ตั้งแต่ก่อนมีปุ่มเพิ่ม ต้องไม่ถูกซ่อนหายไปจากใบที่พิมพ์) */
function pmSetCount(sum, g) {
  const rp = g.repeat;
  const s = sum || {};
  const has = (n) => (g.fields || []).some((f) => {
    const v = s[pmSetId(rp, n) + f.key];
    return v !== null && v !== undefined && String(v).trim() !== "";
  });
  let n = parseInt(s[rp.countKey], 10);
  if (!isFinite(n) || n < 1) n = 1;
  if (n > rp.max) n = rp.max;
  for (let k = rp.max; k > n; k--) { if (has(k)) { n = k; break; } }
  return n;
}

function pmExpandGroup(g, n, count) {
  const rp = g.repeat;
  const id = pmSetId(rp, n);
  const lb = rp.label(n, count);
  return {
    key: g.key + n, en: lb.en, th: lb.th, repeatOf: g.key, setNo: n, setCount: count, repeat: rp,
    fields: (g.fields || []).map((f) => Object.assign({}, f, { key: id + f.key })),
  };
}

/* กลุ่มทั้งหมดของหมวดหนึ่ง หลังคลี่กลุ่มที่กดเพิ่มได้ออกแล้ว */
function pmGroupsOf(sec, sum) {
  const gs = (sec || {}).groups || [];
  if (!gs.some((g) => g.repeat)) return gs;
  const out = [];
  gs.forEach((g) => {
    if (!g.repeat) { out.push(g); return; }
    const n = pmSetCount(sum, g);
    for (let i = 1; i <= n; i++) out.push(pmExpandGroup(g, i, n));
  });
  return out;
}

/* ══════════════════════════════════════════════════
   เล่มเปล่า + การเติมค่าที่ระบบรู้อยู่แล้ว
   ══════════════════════════════════════════════════ */
function pmBlank(user) {
  return {
    meta: {
      ver: PM_VER, status: "draft",
      createdAt: pmNow(), createdBy: (user || {}).id || null, createdByName: (user || {}).name || "",
    },
    sum: {}, docs: {}, sign: {}, flags: {},
  };
}

/* แปลงพิกัดทศนิยมเป็นองศา-ลิปดา-ฟิลิปดา ตามที่แบบฟอร์มต้นฉบับใช้
   เก็บเป็นทศนิยมเสมอ แปลงตอนพิมพ์ลงกระดาษเท่านั้น */
function pmDms(v, isLat) {
  const n = parseFloat(v);
  if (!isFinite(n)) return "";
  const hemi = isLat ? (n < 0 ? "S" : "N") : (n < 0 ? "W" : "E");
  const a = Math.abs(n);
  const d = Math.floor(a);
  const mFull = (a - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  return d + "° " + m + "' " + s + '" ' + hemi;
}

/* ค่าที่ระบบรู้อยู่แล้ว — ช่างจะได้ไม่ต้องพิมพ์ซ้ำและพิมพ์ผิด

   ⚠ ห้ามใช้ job.gps — store.jsx เติมด้วย Math.random() ไว้ปักหมุดบนแผนที่เท่านั้น
     เอาไปใส่ใบรับรองการตรวจรับคือปั้นพิกัดขึ้นมา · ใช้พิกัดจากแบบสำรวจที่จับจาก GPS จริงเท่านั้น

   กฎการเติม (ลอก permitInitial ใน permit.jsx): ค่าที่บันทึกไว้เป็นค่าว่าง ห้ามทับค่าที่เติมให้
   ⇒ เล่มที่เปิดก่อนมี BOQ จะได้รับข้อมูล BOQ ตอนเปิดใหม่ */
function pmPrefill(job, user) {
  const j = job || {};
  const out = {};
  const put = (k, v) => { if (v !== null && v !== undefined && String(v) !== "") out[k] = String(v); };

  put("projName", j.name);
  put("inspDate", pmToday());
  put("country", "Thailand");
  put("orientation", "Fixed Plane");
  put("sysType", "Grid-Connected");
  put("instType", "Rooftop");
  put("fuseType", "FUSE");
  put("siteAddr", [j.address, j.province].filter(Boolean).join(" "));

  /* พิกัดจริงมีที่เดียว คือตอนช่างไปสำรวจหน้างานแล้วกดจับพิกัด */
  const sg = (j.survey || {}).gps;
  if (sg && sg.lat) { put("gpsLat", sg.lat); put("gpsLng", sg.lng); }

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
    if (p) { put("pv1Brand", p.group); put("pv1Wp", p.wp); }
  }

  const invModel = boq.inverterModel || (j.survey || {}).invModel
    || ((((j.permit || {}).invs || [])[0] || {}).model) || "";
  if (invModel) {
    put("invModel", invModel);
    const iv = B && B.findInverter ? B.findInverter(invModel) : null;
    if (iv) { put("invKw", iv.kw); if (iv.group) put("invBrand", iv.group); }
    const qty = +boq.invCount || 0;
    if (qty) put("invQty", qty);
    if (iv && qty) put("acKw", Math.round(iv.kw * qty * 100) / 100);
  }

  return out;
}

/* รวมค่าที่บันทึกไว้กับค่าที่เติมให้ — ค่าว่างที่บันทึกไว้ไม่ทับค่าที่เติมให้ */
function pmMerged(rec, job, user) {
  const saved = (rec || {}).sum || {};
  const pre = pmPrefill(job, user);
  const out = Object.assign({}, pre);
  Object.keys(saved).forEach((k) => {
    if (saved[k] !== null && saved[k] !== undefined && String(saved[k]) !== "") out[k] = saved[k];
  });
  return out;
}

/* ช่องนี้ยังเป็นค่าที่เติมให้อยู่ไหม (ยังไม่มีใครยืนยัน) — ใช้ติดป้ายบนฟอร์ม */
function pmIsPrefilled(rec, key) {
  const saved = (rec || {}).sum || {};
  return !(saved[key] !== null && saved[key] !== undefined && String(saved[key]) !== "");
}

/* ══════════════════════════════════════════════════
   ตัวเช็คความครบ

   ⚠ "ครบ" ของรายการเอกสาร = ตอบแล้ว (√ หรือ -) ไม่ใช่ ตอบว่ามี
     ต้นฉบับกา "-" ให้เอกสารที่ไม่เกี่ยวกับงานนั้น (เช่น ไซต์ที่ไม่มีระบบล้างแผง)
     ถ้านับเฉพาะ √ งานพวกนั้นจะไม่มีวันครบ 100% ตลอดกาล แล้วฟีเจอร์จะเสียความน่าเชื่อถือภายในสัปดาห์เดียว

   ⚠ ผลทดสอบที่ "ไม่ผ่าน" ถือว่ากรอกครบ ไม่ใช่ขาด — pass() ของแผ่นทดสอบใช้ระบายสี OK/NG
     บนกระดาษกับไฟล์ Excel เท่านั้น ตัวนับความครบไม่เห็นมัน
   ══════════════════════════════════════════════════ */
function pmProgress(rec, job, user) {
  const r = rec || {};
  const ver = pmVerOf(r);
  const flags = r.flags || {};
  const sum = rec ? pmMerged(r, job, user) : {};
  const missing = [];
  const bySection = {};
  let done = 0, total = 0;

  const filled = (v) => String(v === null || v === undefined ? "" : v).trim() !== "";

  PM_SECTIONS.forEach((sec) => {
    if ((sec.since || 1) > ver) return;
    let sd = 0, st = 0;
    const tick = (ok, key, en, th) => {
      st += 1;
      if (ok) sd += 1;
      else missing.push({ section: sec.key, secTh: sec.th, secEn: sec.en, key: key, en: en, th: th });
    };

    if (sec.kind === "fields") {
      pmGroupsOf(sec, sum).forEach((g) => (g.fields || []).forEach((f) => {
        if (!pmActive(f, ver)) return;
        tick(filled(sum[f.key]), f.key, f.en, f.th);
      }));
    } else if (sec.kind === "checklist") {
      const v = r.docs || {};
      sec.groups.forEach((g) => (g.items || []).forEach((it) => {
        if (!pmActive(it, ver)) return;
        const lb = pmDocLabel(it, job);
        tick(v[it.key] === "y" || v[it.key] === "n", it.key, lb.en, lb.th);
      }));
    } else if (sec.kind === "sign") {
      const v = r.sign || {};
      (sec.blocks || []).forEach((b) => {
        if (!pmActive(b, ver)) return;
        tick(filled((v[b.key] || {}).name), b.key, b.en, b.th);
      });
    } else if (sec.kind === "table") {
      const t = ((r.tests || {})[sec.key]) || {};
      const hdr = t.hdr || {};
      const rows = t.rows && typeof t.rows === "object" ? Object.values(t.rows) : [];
      (sec.hdr || []).forEach((h) => {
        if (!pmActive(h, ver)) return;
        tick(filled(hdr[h.key]), h.key, h.en, h.th);
      });
      rows.forEach((row, i) => {
        (sec.cols || []).forEach((c) => {
          if (!pmActive(c, ver)) return;
          tick(filled(row[c.key]), sec.key + "." + i + "." + c.key, c.en + " #" + (i + 1), c.th + " แถวที่ " + (i + 1));
        });
        if (sec.photos && sec.photos.req) (sec.photos.perRow || []).forEach((slot) => {
          tick(+flags[sec.key + "." + (row.id || i) + "." + slot] > 0,
            sec.key + "." + i + "." + slot, "Photo " + slot + " #" + (i + 1), "รูป " + slot + " แถวที่ " + (i + 1));
        });
      });
      if (sec.minRows && rows.length < sec.minRows) {
        tick(false, sec.key + ".rows", "Rows in " + sec.en, "ยังไม่ได้เพิ่มแถวใน " + sec.th);
      }
    }

    bySection[sec.key] = {
      done: sd, total: st, pct: st ? Math.round((sd / st) * 100) : 100,
      state: !st ? "na" : sd === st ? "done" : sd ? "partial" : "empty",
    };
    done += sd; total += st;
  });

  return { ver: ver, pct: total ? Math.round((done / total) * 100) : 0, done: done, total: total,
    missing: missing, bySection: bySection };
}

/* มีรายการบังคับใหม่ที่เล่มนี้ยังไม่รับมาไหม — ฟอร์มเอาไปขึ้นแบนเนอร์ให้กดอัปเดตเอง (ไม่อัตโนมัติ) */
function pmNewerItems(rec) {
  const ver = pmVerOf(rec);
  if (ver >= PM_VER) return 0;
  let n = 0;
  PM_SECTIONS.forEach((sec) => {
    const walk = (arr) => (arr || []).forEach((it) => { if (it.req && (it.since || 1) > ver) n += 1; });
    if (sec.kind === "fields") (sec.groups || []).forEach((g) => walk(g.fields));  /* กลุ่มที่กดเพิ่มได้นับเฉพาะชุดเดียว — since ของทุกชุดเท่ากัน */
    else if (sec.kind === "checklist") (sec.groups || []).forEach((g) => walk(g.items));
    else if (sec.kind === "sign") walk(sec.blocks);
    else if (sec.kind === "table") { walk(sec.hdr); walk(sec.cols); }
  });
  return n;
}

/* เงาที่ไปแปะบนใบงาน — ไม่กี่ตัวเลข ให้การ์ดกับหน้ารายการอ่านสถานะโดยไม่ต้องแตะข้อมูลจริง
   (กลไกเดียวกับ survey.photos ที่คำนวณใหม่ตอนเซฟ)
   ⚠ ถ้าวันหนึ่งของในนี้โตเกินสิบตัวเลข แปลว่ากำลังไหลไปหาความผิดที่ตั้งใจเลี่ยงตั้งแต่ต้น */
function pmSummaryOf(rec, job, user) {
  const p = pmProgress(rec, job, user);
  const m = (rec || {}).meta || {};
  return {
    ver: p.ver, pct: p.pct, done: p.done, total: p.total,
    status: m.status || "draft", signedAt: m.signedAt || null, updatedAt: pmNow(),
  };
}

/* บรรทัดสถานะบนการ์ดในใบงาน — อ่านจากเงาบนใบงานอย่างเดียว ไม่ต้อง subscribe */
function pmCardStatus(job) {
  const h = (job || {}).pmHandover;
  if (!h || !h.total) return { label: "ยังไม่เริ่ม · แตะเพื่อเปิดสมุดส่งมอบ", color: "#94A3B8", bold: false };
  if (h.status === "signed") {
    const d = h.signedAt ? String(h.signedAt).slice(0, 10) : "";
    return { label: "ส่งมอบแล้ว" + (d && window.drDateTH ? " · " + window.drDateTH(d) : ""), color: "var(--tint-green-tx)", bold: true };
  }
  if (+h.pct >= 100) return { label: "ข้อมูลครบ 100% · รอลงนามส่งมอบ", color: "#0EA5E9", bold: true };
  return { label: "กรอกแล้ว " + (+h.pct || 0) + "% · ยังขาดอีก " + Math.max(0, (+h.total || 0) - (+h.done || 0)) + " รายการ",
    color: "#F59E0B", bold: true };
}

/* ══════════════════════════════════════════════════
   ที่เก็บข้อมูล
   ══════════════════════════════════════════════════ */

/* เล่มของงานหนึ่งงาน — เขียนทีละใบเสมอ ไม่เคย set() ทั้งก้อน (ดูเหตุผลหัวไฟล์) */
function usePmHandover(jobId) {
  const [rec, setRec] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!jobId || !_PMFB()) { setRec(null); setLoading(false); return; }
    const ref = _pmRef("handover/" + jobId);
    const h = ref.on("value", (s) => { setRec(s.val() || null); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [jobId]);

  /* เปิดเล่ม — ประทับเวอร์ชันของสัญญาไว้ตั้งแต่วันแรก เพื่อไม่ให้ความครบถอยหลังในอนาคต */
  const open = React.useCallback((user) => {
    if (!jobId || !_PMFB()) return null;
    const blank = pmBlank(user);
    _pmRef("handover/" + jobId + "/meta").update(blank.meta);
    return blank;
  }, [jobId]);

  /* แก้ค่าในหมวดหนึ่ง — update() ที่ใบ ไม่ทับงานของคนที่กรอกแผ่นอื่นอยู่พร้อมกัน */
  const patch = React.useCallback((path, obj, user) => {
    if (!jobId || !_PMFB()) return;
    _pmRef("handover/" + jobId + "/" + path).update(obj || {});
    _pmRef("handover/" + jobId + "/meta").update({
      updatedAt: pmNow(), updatedBy: (user || {}).id || null, updatedByName: (user || {}).name || "",
    });
  }, [jobId]);

  const setStatus = React.useCallback((status, user) => {
    if (!jobId || !_PMFB()) return;
    const m = { status: status, updatedAt: pmNow(), updatedBy: (user || {}).id || null, updatedByName: (user || {}).name || "" };
    if (status === "signed") m.signedAt = pmNow();
    _pmRef("handover/" + jobId + "/meta").update(m);
  }, [jobId]);

  const bumpVer = React.useCallback(() => {
    if (!jobId || !_PMFB()) return;
    _pmRef("handover/" + jobId + "/meta").update({ ver: PM_VER });
  }, [jobId]);

  return { rec: rec, loading: loading, open: open, patch: patch, setStatus: setStatus, bumpVer: bumpVer };
}

/* สารบัญรูป — ไม่มี dataUrl จึงเบาพอให้ฟอร์มฟังไว้ตลอด
   ⚠ นี่ไม่ใช่ของแถม 112 รูปของสมุดหนึ่งเล่ม ≈ 20MB ถ้าฟังโหนดรูปจริงจากฟอร์ม
     คือดูดยี่สิบเมกะไบต์ผ่าน 4G ของช่างทุกครั้งที่เปิดหน้า */
function usePmPhotoIdx(jobId) {
  const [idx, setIdx] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !_PMFB()) { setIdx([]); return; }
    const ref = _pmRef("handoverPhotoIdx/" + jobId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setIdx(arr);
    });
    return () => ref.off("value", h);
  }, [jobId]);

  /* เขียนสองโหนดในคำสั่งเดียว จะได้ไม่มีทางหลุดจากกัน */
  const add = React.useCallback((dataUrl, meta, user) => {
    if (!jobId || !_PMFB()) return null;
    const id = "PMP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const m = meta || {};
    const base = { id: id, sec: m.sec || "gen", slot: m.slot || "", rowId: m.rowId || "",
      cap: m.cap || "", at: pmNow(), byName: (user || {}).name || "" };
    const up = {};
    up["handoverPhotos/" + jobId + "/" + id] = Object.assign({}, base, { dataUrl: dataUrl, by: (user || {}).id || null });
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

  const remove = React.useCallback((id) => {
    if (!jobId || !_PMFB() || !id) return;
    const up = {};
    up["handoverPhotos/" + jobId + "/" + id] = null;
    up["handoverPhotoIdx/" + jobId + "/" + id] = null;
    _pmRoot().update(up);
  }, [jobId]);

  return { idx: idx, add: add, setCap: setCap, remove: remove };
}

/* รูปจริงพร้อม dataUrl — ใช้เฉพาะตอนกระดาษเปิดอยู่ ซึ่งต้องใช้ไบต์จริงจริง ๆ
   อย่าเรียกจากอะไรที่ค้าง mount ไว้ */
function usePmPhotos(jobId, enabled) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !enabled || !_PMFB()) { setPhotos([]); return; }
    const ref = _pmRef("handoverPhotos/" + jobId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId, enabled]);
  return photos;
}

/* นับรูปต่อสลอต ไว้เก็บลง flags — ตัวเช็คความครบอ่านจากตรงนี้ ไม่ใช่จากโหนดรูป */
function pmPhotoFlags(idx) {
  const out = {};
  (idx || []).forEach((p) => {
    const k = [p.sec || "gen", p.rowId || "", p.slot || ""].filter(Boolean).join(".");
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

Object.assign(window, {
  PM_ROOT, PM_VER, PM_RETIRED, PM_SECTIONS, PM_SEC_BY, PM_FROM_LABEL,
  pmDocName, pmDocLabel, pmSetId, pmSetCount, pmGroupsOf,
  pmToday, pmNow, pmVerOf, pmActive, pmBlank, pmDms, pmPrefill, pmMerged, pmIsPrefilled,
  pmProgress, pmNewerItems, pmSummaryOf, pmCardStatus, pmPhotoFlags,
  usePmHandover, usePmPhotoIdx, usePmPhotos,
});
