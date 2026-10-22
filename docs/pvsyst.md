# ไฟล์ 3D สำหรับ PVsyst (`dashboard/pvsyst.jsx`)

> ผู้ใช้ขอ ต.ค. 2026: เอาแบบ 3D ไปรัน PVsyst (เงาบังใกล้) ไม่ต้องวาดใหม่

- ปุ่ม **"ไฟล์ PVsyst"** ข้างปุ่ม "ชุดแบบ DXF" หน้าออกแบบระบบ (`solarui.jsx` `downloadPvc`) → `pvcExport(st, job)` ดาวน์โหลด 2 ไฟล์
  - `<รหัสงาน>-PVsyst.pvc2` = **PVCollada 2.0** (PVsyst **8.1.5 ขึ้นไป**) — แผงเป็นโต๊ะ PV (`pv:instance_table` → `pv:rack` fixed_tilt 1×1 + มุมเอียง/ทิศ/landscape-portrait + `pv:module` รุ่น/วัตต์/ขนาด มม.)
  - `<รหัสงาน>-PVsyst.dae` = COLLADA 1.4.1 ธรรมดา (สำรอง เวอร์ชันเก่า) — ทุกอย่างเป็นวัตถุบังเงา แผงรวมก้อน `PV_MODULES`
  - เปิดใน PVsyst: Near Shadings → Construction/Perspective → File → Import → Import a 3D scene
- **PVCollada 1.4.1 (.pvc สำหรับ PVsyst 7)** ยังไม่ทำ — แกน/หน่วยของตัวอย่างใน spec อ่านไม่ออกชัด (เดาผิด = แผงเอียงผิด)
- รูปทรงมาจาก `p3sBuild3D` ตัวเดียวกับภาพ 3D (สร้างแบบไม่แสดงผล ไม่มีภาพพื้น/ภาพถ่าย): ชิ้นที่ `castShadow` = สิ่งบังเงา (หลังคา ผนัง ครอบสัน ต้นไม้ ตึก ท่อ ราง ทางเดิน ฯลฯ) · ชิ้นเล็ก < 6 ซม. ตัดทิ้ง · **ชิ้นส่วนแผงติด `userData.pv = 1`** (กระจก กรอบ Rail L-feet) ไม่นับเป็นสิ่งบังเงา · ผิวแผงจริงมาจาก `pvq` ที่ p3sBuild3D คืนมา ({c, U, V, n} รวมระยะยกแผง 12 ซม.)
- แกน: 3D x = ตะวันออก · −z = เหนือ · y = ขึ้น → ENU (x ตะวันออก · y เหนือ · z ขึ้น) หน่วยเมตร · azimuth ตามเข็มจากทิศเหนือ (180 = หันใต้) · แผงแบน (< 0.5°) = 180
- จุดกำเนิด = จุด 0,0 ของแบบ 3D · lat/lng จาก `st.baseMap` (ถ้ามี) ใส่ `geographic_location` ให้ PVsyst เช็กระยะห่างจากที่ตั้งโครงการ
- ข้อกำหนด: github.com/pvlib/pvcollada (ตัวอย่าง `Examples/PVCollada_2.0/01 - ...pvc2` · schema `schema/PVCollada_2.0/pvcollada_schema_2.0.xsd` ลำดับแท็กใน rack/module ต้องตามนี้)
- **ยังไม่ได้ทดสอบเปิดใน PVsyst จริง** — ผู้ใช้ลองแล้วแจ้งผลกลับมาปรับ · ที่อาจต้องปรับ: รวมแผงติดกันเป็นโต๊ะใหญ่ (rows × cols) แทน 1 แผงต่อโต๊ะ · ใส่ circuit/สตริง
