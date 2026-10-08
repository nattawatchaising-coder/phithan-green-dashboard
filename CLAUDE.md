# phithan-green-dashboard (flash+solar)

เว็บจัดการงานติดตั้งโซลาร์ — React แบบไม่มี bundler (`dashboard/*.jsx` → babel → `dashboard/build/*.js`) ข้อมูลอยู่ Firebase Realtime DB
deploy อัตโนมัติด้วย Vercel จาก `master` บน GitHub · ตอบผู้ใช้เป็นภาษาไทย

## ทำงานสองเครื่อง
- เครื่อง 1: `D:\Claude code\phithan-green-dashboard` · เครื่อง 2: `D:\Woking space\Claude code\phithan-green-dashboard`
- ความจำของ Claude ไม่ข้ามเครื่อง — **ข้อตกลงที่ต้องจำข้ามเครื่องให้เขียนลงไฟล์นี้** แล้ว commit
- เริ่มงานทุกครั้ง `git pull --ff-only` · เครื่องที่เพิ่ง clone ต้อง `npm ci` และ `git config core.hooksPath .githooks` ครั้งเดียว
- terminal เป็น Windows PowerShell 5.1 — ไม่รู้จัก `&&` (ใช้ `;` หรือ `if ($?) { }`) · ไม่มี Python ใช้ node แทน

## กฎที่ห้ามพลาด
- **เซิร์ฟเวอร์ทดสอบในเครื่อง (`tools/devserver.js`, localhost:8765) ต่อ Firebase ตัวจริง** — กดปุ่มบันทึกบน localhost = แก้ข้อมูลจริง (เคยทำ % คืบหน้าใบงาน SF-2448 หาย)
  - ทดสอบด้วยการกันการเขียน: ครอบ `window.FBDB.ref` ให้ set/update/remove/push/transaction แค่จดลง array แล้ว mount คอมโพเนนต์ด้วยงานปลอม (`id: '__fake'`) ใน div แยก เสร็จแล้ว unmount และคืน `FBDB.ref` ตัวเดิม
  - อ่านข้อมูลจริงได้ · เขียน/แก้คลังหรืองานจริงต้องได้คำอนุญาตจากผู้ใช้ก่อน · ห้ามลบข้อมูลถาวร ให้ผู้ใช้ลบเองในหน้าเว็บ
- **ห้าม deploy ด้วย `vercel` CLI** — push ขึ้น master อย่างเดียว (เคยมีงานค้างเครื่องเดียว 25 คอมมิตเพราะ deploy ตรง)
- **commit เองได้เลยไม่ต้องถาม** เมื่องานเสร็จและตรวจแล้ว — hook `.githooks/post-commit` push ให้เอง (ปิดชั่วคราวด้วยไฟล์ `.git/no-autopush`) · ข้อความ commit ภาษาไทย บอกเหตุผล

## build และเวอร์ชัน
- แก้ `.jsx` แล้ว `npm run build` (เว็บโหลดจาก `dashboard/build/` ไม่ใช่ .jsx) — มี hook `.claude/hooks/build-on-jsx.js` ช่วย build ให้ แต่ต้องเช็กเสมอ
- ทุกครั้งที่ไฟล์ .js เปลี่ยน บัมป์ `?v=` ใน `index.html`: `node tools/bump.js boq` (ชื่อไฟล์ไม่มี .js — บัมป์ทั้ง `build/boq.js` และ `dashboard/boq.js`)
- ไฟล์เป็น CRLF — แก้หลายจุดด้วยสคริปต์ node ที่แปลง CRLF→LF ก่อนแทนที่แล้วแปลงกลับ

## สไตล์ UI
**ทำ/แก้หน้าตา UI อ่าน `DESIGN.md` ก่อน** (token · ชิ้นส่วนมาตรฐาน · ข้อห้าม · จุดที่ของเก่ายังไม่ตรง) — สรุปสั้น: ยึดหน้าใบเสนอราคา (`dashboard/sales.jsx` QuoteEditor): ไม่มีเส้นขอบ · แผ่น `var(--surface)` + `var(--shadow-sm)` · ช่องกรอก/ดรอปดาวน์เป็นหลุม `--surface2` + `--shadow-inset` · การ์ด `--shadow-card` บนพื้น `--bg` — ไม่ใช่ neumorphism เต็มตัว

## เอกสารแยกตามเรื่อง — **อ่านไฟล์ของเรื่องนั้นก่อนแก้โค้ด** (ข้อตกลง/สิ่งที่ผู้ใช้สั่งไว้อยู่ในนั้น)
| แก้ไฟล์/เรื่อง | อ่าน |
|---|---|
| `plan3d2.jsx` ตัวออกแบบหลังคา/วางแผง · ขั้นพาทำ · สิ่งบดบัง · วางแผง | `docs/plan3d.md` |
| ภาพ 3D · เงา · ถ่ายภาพ/วิดีโอ · วัสดุ/สีหลังคา (`P3SView3D` `p3sBuild3D`) | `docs/plan3d-3d.md` |
| ออกแบบระบบ · สตริง · MPPT · ชุดแบบ DXF/SLD (`solarui` `solarcalc` `solariv` `dxf.jsx` `p3SldModel`) | `docs/solar-design.md` |
| ถอด BOQ · ตู้ไฟ · หน้าตั้งค่าคำนวณ BOQ · O&M · ค่าขออนุญาต (`boq.jsx` `boq.js` `views-stock.jsx`) | `docs/boq.md` |
| หลายเวอร์ชันแบบ 3D/BOQ (`versions.jsx`) | `docs/versions.md` |
| ห้องอุปกรณ์ 3D (`eroom.jsx`) | `docs/eroom.md` |
| งาน/ลูกค้าเฉพาะแอดมิน (`adminOnly`) | `docs/admin-only.md` |
| รูปแพ็คเกจขาย (`pkgposter.jsx`) | `docs/pkgposter.md` |
| ลงเวลา · OT · การลา · เมนู LINE (`attend` `leave` `liff-*`) | `docs/attend-leave.md` |

ข้อตกลงใหม่ของเรื่องไหนให้เขียนลงไฟล์ของเรื่องนั้น (ไม่ใช่ที่นี่) · เรื่องใหม่ที่ยังไม่มีไฟล์ = สร้าง `docs/<เรื่อง>.md` แล้วเพิ่มแถวในตารางนี้

## ข้อสำคัญข้ามเรื่อง
- ตัวออกแบบ 3D **ต้องเก็บฟิลด์ที่ตัวเองไม่รู้จักไว้ครบ** (โหลดแบบ merge แก้ทีละฟิลด์) — ข้อมูลแบบเก่า/`sys` ไม่งั้นหาย
- ยืนยันใช้ `askConfirm` ของแอป ห้าม `window.confirm`
- ตัวเลขเงื่อนไขในสูตร BOQ ห้ามฝังตรง ๆ — อ่าน `RULES.<key>` และเพิ่มแถวใน `RULE_DEFS` · ชื่อรายการอัตโนมัติต้องตรงชื่อในคลังทุกตัวอักษร (ราคาดึงด้วยชื่อ)
