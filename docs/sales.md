# ฝ่ายขาย — ลูกค้าสำรวจ (`surveyLeads`)

ตัวเก็บ: `useSurveyLeadStore` (`dashboard/survey-sched.jsx`) · ใบลูกค้า `LeadDrawer`/`LeadDetail` (`views-survey.jsx`) · บอร์ดงานขาย `SalesBoardView` (`sales.jsx`) · ช่วงฝ่ายขายบนบอร์ดงานติดตั้ง `FlowBoardView` (`views-flow.jsx`)

## ถังขยะลูกค้า (ผู้ใช้สั่ง ต.ค. 2026: "ไม่ลบ แต่ย้ายไปถังขยะ")
- ปุ่ม "ลงถังขยะ" ในใบลูกค้า = `leadStore.remove(id, ชื่อคนกด)` ติดธง `deleted/deletedAt/deletedBy` — **ไม่ลบจากฐาน** แบบสำรวจ/รูป/ใบเสนอราคายังอยู่
- `leadStore.leads` กรองรายที่ `deleted` ออกแล้ว ทุกหน้าจอจึงไม่เห็น · id ในถังขยะอยู่ใน `leadStore.hidden` → ใบเสนอราคา/นัดของรายนั้นหายตามจนกว่าจะกู้คืน
- เปิดถังขยะได้สองที่: ปุ่ม "ถังขยะ" ที่หัวช่วงฝ่ายขายของบอร์ดงานติดตั้ง และหัวบอร์ดหน้างานขาย → `TrashModal` ตัวเดียวกับถังขยะงาน (`app.jsx`, title/noun ต่างกัน)
- กู้คืน = ทุกคนที่มีสิทธิ์ `leads` · ลบถาวร (`leadStore.purge` ลบ `surveyLeads/<id>` + `surveyPhotos/<id>`) = แอดมิน + ใส่รหัสผ่านซ้ำ
- ที่อ่าน `surveyLeads` ตรงจาก FBDB (ไม่ผ่านตัวเก็บ) จะยังเห็นรายในถังขยะ — ของใหม่ให้อ่านผ่านตัวเก็บ
