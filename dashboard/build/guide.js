const GD_TRACKS = [{
  key: "start",
  th: "เริ่มต้นใช้งาน",
  sub: "ทุกคนต้องผ่านสายนี้ก่อน",
  icon: "power",
  color: "#0EA5E9",
  who: "พนักงานทุกตำแหน่ง · ใช้เวลาสอนประมาณ 15 นาที",
  lessons: [{
    t: "เข้าสู่ระบบครั้งแรก",
    when: "วันแรกที่ได้รับบัญชี",
    where: "หน้าเว็บบนคอมพิวเตอร์",
    steps: ["เปิดเว็บของบริษัทจากลิงก์ที่แอดมินส่งให้ (บันทึกเป็นบุ๊กมาร์กไว้เลย)", "กรอก “ชื่อผู้ใช้ (ID)” และ “รหัสผ่าน” ที่แอดมินตั้งให้ แล้วกด “เข้าสู่ระบบ”", "เข้าได้แล้วให้ดูมุมล่างซ้าย — ต้องขึ้นชื่อกับตำแหน่งของตัวเอง ถ้าไม่ใช่ชื่อเรา แจ้งแอดมินทันที"],
    rules: ["ชื่อผู้ใช้กับตำแหน่งแก้เองไม่ได้ ต้องให้แอดมินเปลี่ยน เพราะผูกกับสิทธิ์และการมอบหมายงาน", "ห้ามใช้บัญชีของคนอื่น — ทุกอย่างที่กดจะไปอยู่ในชื่อคนนั้น ทั้งเวลาเข้างานและใบเบิกเงิน"],
    fix: [["กรอกแล้วขึ้น “รหัสผ่านไม่ถูกต้อง”", "ลองพิมพ์ใหม่โดยไม่ก๊อปวาง ถ้ายังไม่ได้ให้แอดมินตั้งรหัสใหม่ — ไม่มีปุ่มลืมรหัสผ่านในระบบ"]]
  }, {
    t: "รู้จักหน้าจอและเมนู",
    when: "ก่อนเริ่มงานจริง",
    where: "แถบเมนูด้านซ้าย",
    steps: ["เมนูซ้ายคือหน้าทั้งหมดที่บัญชีเรามีสิทธิ์เข้า — เห็นไม่เท่ากันทุกคนเป็นเรื่องปกติ ขึ้นกับตำแหน่ง", "เลขท้ายเมนูคือของที่ค้างอยู่: แดง = มีเรื่องเลยกำหนดต้องลงมือ · เหลือง = ใกล้ถึงเกณฑ์ · ฟ้า = แค่บอกจำนวนของวันนี้", "ช่องค้นหาด้านบนใช้ได้ทุกหน้า พิมพ์รหัสงาน ชื่อลูกค้า หรือชื่อไซต์ก็เจอ", "กระดิ่งมุมขวาบน = เรื่องที่จ่าหน้าถึงเราโดยเฉพาะ กดแล้วพาไปหน้าที่เกี่ยวข้องเลย", "ปุ่ม “ตั้งค่า” ล่างสุดของเมนู = โหมดกราไฟต์ (จอมืด) และออกจากระบบ"],
    rules: ["ข้อมูลทุกอย่างบนเว็บคือของจริง ไม่มีโหมดทดลอง — กดปุ่มไหนคือบันทึกจริงทันที"]
  }, {
    t: "ตั้งโปรไฟล์และลายเซ็นของตัวเอง",
    when: "ทำครั้งเดียว แต่ต้องทำก่อนออกเอกสารอะไรก็ตาม",
    where: "กดชื่อตัวเองที่มุมล่างซ้าย",
    steps: ["กดชื่อตัวเองมุมล่างซ้าย → หน้า “โปรไฟล์ของฉัน”", "ใส่รูป เบอร์โทร อีเมล ให้ครบ — คนอื่นใช้ข้อมูลนี้ติดต่อเรื่องงาน", "กดช่อง “ลายเซ็นของฉัน” แล้วเซ็นด้วยนิ้วหรือเมาส์ ให้เหมือนที่เซ็นในเอกสารจริง"],
    rules: ["ลายเซ็นที่บันทึกไว้ ระบบจะเอาไปใส่ในใบต่าง ๆ ให้เอง (รายงานประจำวัน ใบเบิกเงิน ใบสำคัญจ่าย) — ไม่เซ็นเก็บไว้ ใบที่พิมพ์ออกมาจะมีช่องว่างเปล่า", "รูปและลายเซ็นบันทึกทันทีที่เลือก ปุ่มบันทึกด้านล่างมีไว้เซฟเฉพาะช่องข้อความ"]
  }, {
    t: "ใช้งานจากมือถือผ่านแอปในไลน์",
    when: "เวลาอยู่หน้างาน",
    where: "แชตไลน์ของบริษัท → เมนูด้านล่าง",
    steps: ["เปิดแชตไลน์ของบริษัท กดเมนูด้านล่างเพื่อเปิดแอป", "ครั้งแรกกรอกชื่อผู้ใช้กับรหัสผ่านเหมือนบนเว็บ ครั้งต่อไปจำให้เอง ไม่ต้องกรอกซ้ำ", "แถบล่างของแอปคือแท็บงาน: งาน · ซ่อม · เวลา · รายงาน · เบิก · เตือน · ฉัน (แท็บ “อนุมัติ” ขึ้นเฉพาะคนที่มีสิทธิ์อนุมัติ)"],
    rules: ["มือถือกับเว็บคือข้อมูลชุดเดียวกัน กดจากที่ไหนก็เห็นเหมือนกันทันที ไม่ต้องกรอกสองรอบ"]
  }]
}, {
  key: "tech",
  th: "ช่างหน้างาน",
  sub: "ทำจากมือถือในแอปไลน์",
  icon: "wrench",
  color: "#84CC16",
  who: "ช่างติดตั้ง · หัวหน้าชุด · ผู้ช่วย — ใช้เวลาสอนประมาณ 30 นาที",
  lessons: [{
    t: "ลงเวลาเข้า-ออกงาน",
    when: "ทุกวันที่มาทำงาน ทั้งหน้างานและออฟฟิศ",
    where: "แอปในไลน์ → แท็บ “เวลา”",
    steps: ["ถึงที่ทำงานแล้วเปิดแท็บ “เวลา” กด “ลงเวลาเข้างาน” — ระบบเก็บเวลากับพิกัดให้เอง", "เลิกงานกด “ลงเวลาออกงาน” ที่ปุ่มเดิม", "กดออกงานเร็วเกินไปหรือลืมกด ใช้ปุ่ม “กดออกงานใหม่ · ทับเวลาเดิม” แก้ได้"],
    rules: ["ถ้ามือถือไม่ยอมให้พิกัด ปุ่มยังกดได้เหมือนเดิม — ไม่มีพิกัดยังดีกว่าไม่มีเวลาเข้างาน", "เวลา “เข้างาน” แก้เองไม่ได้ ต้องแจ้งออฟฟิศ · แก้ได้เฉพาะเวลาออกงาน", "เข้างานสายระบบเลื่อนเวลาเลิกงานตามจริงให้เอง ไม่ต้องคิดเอง"],
    fix: [["ปุ่มลงเวลาไม่ขึ้นเลย", "แปลว่าบัญชีนี้ยังไม่ได้เปิดสิทธิ์ลงเวลา แจ้งแอดมินติ๊กสิทธิ์ “ลงเวลาเข้า-ออกงาน” ให้"]]
  }, {
    t: "ขอทำงานล่วงเวลา (OT)",
    when: "วันที่ทำเกินเวลางานปกติ หรือทำวันหยุด",
    where: "แอปในไลน์ → แท็บ “เวลา” → ปุ่ม “+ ขอ OT”",
    steps: ["กด “ลงเวลาออกงาน” ให้เรียบร้อยก่อน แล้วค่อยขอ OT ตามเวลาที่กดจริง", "กด “+ ขอ OT” เลือกประเภท: ล่วงเวลาวันทำงาน · ทำงานวันหยุด · ล่วงเวลาในวันหยุด · งานกลางคืน", "เลือกงานที่ทำ ใส่ช่วงเวลาและเหตุผลที่ต้องอยู่ต่อ แล้วกดส่ง", "ใบจะขึ้นสถานะ “รออนุมัติ” รอหัวหน้าตัดสินเป็น “อนุมัติแล้ว” หรือ “ไม่อนุมัติ”"],
    rules: ["ระบบตัดช่วงที่ทับเวลางานปกติออกให้เอง — ใส่เวลาตามที่ทำจริง ไม่ต้องหักเอง", "อนุมัติใบ OT ของตัวเองไม่ได้ ต้องให้คนอื่นอนุมัติ"]
  }, {
    t: "ส่งรายงานประจำวัน",
    when: "ทุกวันที่ขึ้นหน้างานติดตั้ง — ส่งวันต่อวัน",
    where: "แอปในไลน์ → แท็บ “รายงาน”",
    steps: ["เลือกวันที่และงานที่ไปทำ", "กรอกงานที่ทำวันนี้ให้เห็นภาพ เช่น “ยกแผงขึ้นหลังคาแถวที่ 1-3 เสร็จ · เดินสาย DC ฝั่งตะวันออก”", "ใส่ % คืบหน้าของแต่ละหมวดงานตามที่ทำได้จริง", "กรอกกำลังคนที่มาวันนี้ สภาพอากาศ และปัญหา/อุปสรรค (ไม่มีก็เว้นว่างไว้)", "แนบรูปหน้างาน พร้อมพิมพ์คำอธิบายใต้รูปทุกรูป", "ยังไม่เสร็จให้กด “บันทึกร่าง” เก็บไว้ · เสร็จแล้วกด “ส่งให้วิศวกรอนุมัติ”"],
    rules: ["% คืบหน้าที่กรอกคือตัวเลขที่ออฟฟิศใช้ดูว่างานเดินถึงไหน กรอกเกินจริงแล้ววางแผนของผิดทั้งสาย", "ใบที่วิศวกรอนุมัติแล้วแก้ไม่ได้ ต้องแจ้งวิศวกรให้ตีกลับก่อน"]
  }, {
    t: "ส่งใบเบิกเงินหน้างาน",
    when: "ทุกครั้งที่จ่ายเงินไปกับงาน — ซื้อของ ค่าขนส่ง ค่าน้ำมัน ค่าอาหาร",
    where: "แอปในไลน์ → แท็บ “เบิก”",
    steps: ["กดเปิดใบใหม่ เลือกงาน/ไซต์ที่เงินก้อนนี้ใช้ไป", "เลือกประเภท: ซื้อของหน้างาน · ค่าขนส่งของ · ค่าน้ำมัน / เดินทาง · ค่าอาหาร / ที่พัก · ค่าแรงจ้างช่วง · อื่น ๆ", "ใส่รายการกับจำนวนเงินให้ตรงบิล เช่น “สายไฟ 2.5 sq.mm.”", "เลือกที่มาของเงิน: “ออกเงินตัวเองไปก่อน” · “คนอื่นออกเงินให้” (เลือกชื่อคนที่ควักจริง) · “เงินสดกองกลาง” · “บัตร / บัญชีบริษัท”", "ถ่ายรูปบิลแนบให้ครบทุกใบ แล้วกด “ส่งขออนุมัติ”", "เอาบิลตัวจริงส่งออฟฟิศ แล้วกดปุ่ม “ส่งตัวจริง” ที่แถวของใบนั้น"],
    rules: ["เลือก “คนอื่นออกเงินให้” เมื่อหัวหน้าชุดควักแทน — เงินคืนจะเข้าชื่อคนที่ควักจริง ไม่ใช่ชื่อคนกรอกใบ", "“เงินสดกองกลาง” กับ “บัตรบริษัท” คือเงินบริษัทที่จ่ายไปแล้ว ไม่มีเงินคืนเข้ากระเป๋าใคร", "ไม่มีรูปบิล บัญชีตีกลับแน่นอน — ถ่ายตอนรับบิลเลย อย่ารอตอนกลับถึงบ้าน"],
    fix: [["ใบขึ้น “ไม่อนุมัติ”", "เปิดใบอ่านเหตุผลที่ผู้อนุมัติเขียนไว้ แก้แล้วส่งใหม่จากใบเดิมได้ ไม่ต้องเปิดใบใหม่"]]
  }, {
    t: "ดูงานของตัวเอง งานซ่อม และแจ้งเตือน",
    when: "ทุกเช้าก่อนออกหน้างาน",
    where: "แอปในไลน์ → แท็บ “งาน” / “ซ่อม” / “เตือน”",
    steps: ["แท็บ “งาน” = งานติดตั้งที่มอบหมายให้เรา กดเข้าไปดูรายละเอียด แบบติดตั้ง และใบ BOQ ได้", "แท็บ “ซ่อม” = เรื่องที่ลูกค้าแจ้งเข้ามา แต่ละเรื่องมีกำหนดเวลาของตัวเอง ดูที่ชิป “ที่ต้องทำ” ก่อน", "แท็บ “เตือน” = เรื่องที่จ่าหน้าถึงเรา กดแล้วพาไปที่ใบนั้นเลย", "แท็บ “ฉัน” = โปรไฟล์และลายเซ็นของเรา"],
    rules: ["ไม่เห็นงานที่ควรเห็น = งานนั้นยังไม่ได้มอบหมายชื่อเราไว้ แจ้งออฟฟิศให้ใส่ชื่อช่างในใบงาน"]
  }]
}, {
  key: "office",
  th: "ออฟฟิศ / ธุรการ",
  sub: "เปิดงาน เดินขั้นตอน คุมคิว",
  icon: "box",
  color: "#7C5CFC",
  who: "ธุรการ · ผู้ประสานงาน · คนคุมคิวสำรวจและคิวติดตั้ง — ใช้เวลาสอนประมาณ 45 นาที",
  lessons: [{
    t: "รับลูกค้าใหม่เข้าระบบ",
    when: "ลูกค้าโทรเข้าหรือทักมาในเพจ",
    where: "เมนู “งานขาย”",
    steps: ["กดปุ่มเพิ่มลูกค้าใหม่ กรอกชื่อ เบอร์ ที่อยู่ และความต้องการเบื้องต้น", "การ์ดลูกค้าจะไปอยู่คอลัมน์ “ลูกค้าใหม่”", "คุยแล้วลากการ์ดไปขั้นถัดไป: ติดต่อแล้ว → นัดสำรวจ → เสนอราคาแล้ว → ต่อรอง / รอตัดสินใจ → ปิดการขาย หรือ ไม่ติดตั้ง"],
    rules: ["ส่งใบเสนอราคาในระบบแล้ว การ์ดเลื่อนขั้นให้เอง ไม่ต้องลากซ้ำ · ลูกค้าตกลงแล้วระบบเลื่อนไป “ปิดการขาย” ให้ แต่ยังต้องกดแปลงเป็นงานเอง"],
    go: {
      view: "leads",
      th: "เปิดหน้างานขาย"
    }
  }, {
    t: "จัดตารางสำรวจ",
    when: "ลูกค้าตกลงให้เข้าไปดูหน้างาน",
    where: "เมนู “จัดตารางสำรวจ”",
    steps: ["เลือกลูกค้าที่ต้องไปสำรวจ ใส่วันนัดและเวลา", "เลือกผู้สำรวจ — คนที่ถูกเลือกจะเห็นนัดนี้ในแอปมือถือและในปฏิทิน", "ถึงวันนัด ผู้สำรวจกรอกแบบสำรวจกับถ่ายรูปหน้างานจากมือถือ", "สำรวจเสร็จแล้วออก “รายงานสำรวจ” ส่งลูกค้าได้จากใบลูกค้ารายนั้น"],
    rules: ["นัดที่เลยวันแล้วแต่ยังไม่ปิดสถานะ จะขึ้นเลขแดงท้ายเมนู — เคลียร์ทุกวัน ไม่ปล่อยค้าง"],
    go: {
      view: "dispatch",
      th: "เปิดหน้าจัดตารางสำรวจ"
    }
  }, {
    t: "แปลงลูกค้าเป็นงานติดตั้ง",
    when: "ลูกค้าเซ็นรับงานแล้ว",
    where: "ใบลูกค้า → ปุ่มแปลงเป็นงาน",
    steps: ["เปิดใบลูกค้าที่ปิดการขายแล้ว กดปุ่มแปลงเป็นงาน", "งานจะเข้า “ฐานข้อมูลงาน” พร้อมแบบสำรวจและ BOQ ที่ทำไว้ตั้งแต่ตอนเป็นลูกค้า", "เปิดใบงานใส่ข้อมูลที่เหลือ: วันเริ่มติดตั้ง กำหนดส่งมอบ ช่างผู้รับผิดชอบ และวิศวกรผู้รับผิดชอบ"],
    rules: ["ช่อง “วิศวกรผู้รับผิดชอบ” ต้องกรอก — ไม่กรอกแล้ววิศวกรจะเปิดระบบมาเจอหน้าว่าง เพราะเขาเห็นเฉพาะงานที่ตัวเองคุม", "ไม่ใส่ชื่อช่าง ช่างก็ไม่เห็นงานนี้ในมือถือ"]
  }, {
    t: "เดินขั้นตอนงานติดตั้ง",
    when: "ทุกวันที่งานขยับ",
    where: "เมนู “บอร์ดงาน” หรือ “ฐานข้อมูลงาน”",
    steps: ["ขั้นงานเดินตามลำดับ: ออกแบบ → ถอดของ → นัดคิวติดตั้ง → ดำเนินการติดตั้ง → เสร็จสิ้น", "ลากการ์ดบนบอร์ดเพื่อเปลี่ยนขั้น หรือเปิดใบงานแล้วกดเดินขั้นตอน", "ในใบงานมีเช็กลิสต์ของ (แผง อินเวอร์เตอร์ โครงสร้าง สายไฟ ตู้ Combiner แบตเตอรี่ ระบบ Backup) — ติ๊กตามของที่เข้าจริง", "งานที่เข้าขั้น “ดำเนินการติดตั้ง” แล้ว ช่างจะส่งรายงานประจำวันเข้ามาได้"],
    rules: ["อย่าเดินขั้นล่วงหน้าเพราะดูแล้วสวย — ภาพรวมกับเลขเตือนทั้งระบบคิดจากขั้นงานนี้ทั้งหมด"],
    go: {
      view: "board",
      th: "เปิดบอร์ดงาน"
    }
  }, {
    t: "ปฏิทินนัดและตารางงานของฉัน",
    when: "ตอนวางคิวรายสัปดาห์",
    where: "เมนู “ปฏิทินนัด” และ “ตารางงานของฉัน”",
    steps: ["ปฏิทินนัดรวมนัดสำรวจกับวันติดตั้งไว้ในหน้าเดียว กดวันว่างเพื่อเพิ่มงานลงวันนั้นได้เลย", "ตารางงานของฉันคือคิวของบัญชีตัวเอง ใช้เช็กว่าวันนี้ต้องไปไหน"],
    go: {
      view: "calendar",
      th: "เปิดปฏิทินนัด"
    }
  }, {
    t: "คลังสินค้าและงานบริการหลังการขาย",
    when: "ตอนเบิกของออกหน้างาน และตอนลูกค้าแจ้งปัญหา",
    where: "เมนู “คลังสินค้า” และ “งานบริการหลังการขาย”",
    steps: ["คลังสินค้า: ดูของคงเหลือและตัดสต๊อกเมื่อเบิกออกงาน — เลขเหลืองท้ายเมนูคือของที่ถึงจุดสั่งซื้อแล้ว", "งานบริการหลังการขาย: ทะเบียนไซต์ในสัญญา ประกัน รอบล้างแผง ใบแจ้งซ่อม และใบรายงานเข้าบริการ", "ลูกค้าแจ้งเสีย ให้เปิดใบแจ้งซ่อมจากไซต์นั้น ระบุอาการและความรุนแรง แล้วมอบหมายช่าง"],
    go: {
      view: "om",
      th: "เปิดหน้างานบริการหลังการขาย"
    }
  }, {
    t: "พิมพ์เอกสารออกกระดาษหรือ PDF",
    when: "เวลาต้องส่งลูกค้าหรือเก็บเข้าแฟ้ม",
    where: "ปุ่มพิมพ์ในแต่ละใบ",
    steps: ["เอกสารที่พิมพ์ได้: ใบเสนอราคา · รายงานสำรวจ · รายงานประจำวัน · ใบแจ้งซ่อม · ใบรายงานเข้าบริการ · ใบเบิกเงิน · ใบปะหน้าจ่ายเงิน · ใบสำคัญจ่าย", "กดปุ่มพิมพ์ในใบนั้น แล้วเลือกเครื่องพิมพ์ หรือเลือก “บันทึกเป็น PDF” ถ้าจะส่งไฟล์"],
    rules: ["เอกสารจะดึงลายเซ็นของคนที่กดแต่ละขั้นมาใส่ให้เอง คนที่ยังไม่ได้เซ็นเก็บไว้ในโปรไฟล์ จะได้ช่องว่างเปล่า"]
  }]
}, {
  key: "money",
  th: "บัญชี / คนอนุมัติเงิน",
  sub: "อนุมัติ · จ่ายคืน · ออกใบสำคัญจ่าย",
  icon: "wallet",
  color: "#EF4444",
  who: "บัญชี · การเงิน · หัวหน้าที่อนุมัติเงินและ OT — ใช้เวลาสอนประมาณ 45 นาที",
  lessons: [{
    t: "รู้จักหน้าเบิกเงินหน้างาน",
    when: "เปิดทุกวันเป็นหน้าแรกของงานบัญชี",
    where: "เมนู “เบิกเงินหน้างาน”",
    steps: ["สามไทล์ด้านบนคือของที่ต้องลงมือ: ใบของฉันที่ยังไม่จบ · รอฉันอนุมัติ · ค้างจ่ายพนักงาน — กดไทล์แล้วมันพาไปแท็บที่ตรงกัน", "แท็บด้านล่าง: ใบของฉัน · รออนุมัติ · อนุมัติแล้ว · ยอดรายคน · ต้นทุนรายไซต์ · ทั้งหมด", "สถานะของใบเดินทางเดียว: ร่าง → รออนุมัติ → อนุมัติแล้ว → จ่ายคืนแล้ว (หรือ ไม่อนุมัติ แล้วกลับไปเป็นร่าง)"],
    go: {
      view: "expense",
      th: "เปิดหน้าเบิกเงินหน้างาน"
    }
  }, {
    t: "อนุมัติหรือไม่อนุมัติใบเบิก",
    when: "ทุกวัน เคลียร์ให้หมดวันต่อวัน",
    where: "แท็บ “รออนุมัติ”",
    steps: ["เปิดใบจากแท็บ “รออนุมัติ”", "เทียบรูปบิลกับจำนวนเงินและงานที่ระบุ ดูว่าเป็นค่าใช้จ่ายของงานนั้นจริง", "ถูกต้องกด “อนุมัติ” · ไม่ถูกต้องกด “ไม่อนุมัติ” แล้วพิมพ์เหตุผลให้ชัดว่าต้องแก้อะไร", "ใบที่ไม่อนุมัติจะกลับไปเป็นร่างที่ฝั่งคนเบิก เขาแก้แล้วส่งกลับมาในใบเดิม"],
    rules: ["อนุมัติใบของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ (แอดมินเปิดข้อยกเว้นให้เฉพาะบัญชีที่คุมเงินอยู่คนเดียวจริง ๆ ได้)", "แต่ละบัญชีมีวงเงินอนุมัติต่อใบ เกินวงเงินระบบจะไม่ให้กด ต้องส่งต่อให้คนที่วงเงินถึง"]
  }, {
    t: "รับเอกสารตัวจริงจากช่าง",
    when: "ตอนช่างเอาบิลตัวจริงมาส่ง",
    where: "แถวของใบในรายการ",
    steps: ["ช่างกด “ส่งตัวจริง” จากฝั่งเขาแล้ว แถวนั้นจะขึ้นปุ่ม “กดรับตัวจริง” ให้เรา", "นับบิลในมือให้ครบตามใบ แล้วกด “กดรับตัวจริง” — แถวจะเปลี่ยนเป็นป้าย “รับตัวจริงแล้ว” พร้อมชื่อและวันที่", "กดผิดใบ เปิดใบนั้นแล้วกดกากบาทที่ป้ายเพื่อยกเลิกได้ (เฉพาะคนที่กดไว้เอง)"],
    rules: ["ป้ายนี้คือหลักฐานว่ากระดาษถึงมือบัญชีแล้ว — อย่ากดล่วงหน้าตอนที่บิลยังอยู่กับช่าง"]
  }, {
    t: "ตรวจยอดและพิมพ์ใบปะหน้าก่อนโอน",
    when: "ก่อนโอนเงินคืนพนักงานทุกครั้ง",
    where: "แท็บ “ยอดรายคน”",
    steps: ["เปิดแท็บ “ยอดรายคน” — แต่ละแถวคือคนหนึ่งคนกับยอดที่บริษัทติดเขาอยู่", "กดปุ่ม “ใบปะหน้า” ของแถวนั้นเพื่อพิมพ์ใบปะหน้าจ่ายเงิน", "เอาใบปะหน้าไปกางเทียบกับบิลตัวจริงทีละใบ ครบแล้วค่อยไปขั้นโอนเงิน"],
    rules: ["ยอดในแถวเดินตาม “เจ้าของเงิน” ไม่ใช่คนกรอกใบ — ใบที่หัวหน้าชุดควักแทน ยอดจะไปอยู่แถวของหัวหน้าชุด", "ใบปะหน้าคือเอกสารตรวจก่อนโอน ยังไม่ใช่หลักฐานการจ่าย บนใบเขียนกำกับไว้ว่า “รอโอน”"]
  }, {
    t: "บันทึกจ่ายคืนและออกใบสำคัญจ่าย",
    when: "หลังโอนเงินจริงแล้วเท่านั้น",
    where: "แท็บ “ยอดรายคน” → ปุ่ม “จ่ายคืน”",
    steps: ["โอนเงินให้เรียบร้อยก่อน", "กดปุ่ม “จ่ายคืน” ที่แถวของคนนั้น ตรวจรายการใบที่จะปิด", "ใส่เลขอ้างอิงการโอนกับวันที่จ่าย แล้วยืนยัน — ใบทุกใบในรอบจะเปลี่ยนเป็น “จ่ายคืนแล้ว” และระบบออกเลขรอบจ่ายให้ (PAY-xxxx-xx)", "ไปที่ “รอบจ่ายล่าสุด” กดปุ่ม “ใบสำคัญจ่าย” เพื่อพิมพ์เก็บเข้าแฟ้ม"],
    rules: ["สิทธิ์ “อนุมัติใบเบิก” กับ “บันทึกจ่ายเงินคืน” แยกกันตั้งใจ เป็นการคุมเงินสดขั้นพื้นฐาน — ไม่ควรอยู่ที่คนเดียว", "ปุ่มขึ้นว่า “เกินวงเงิน” = ยอดรวมเกินวงเงินจ่ายของบัญชีเรา ต้องให้คนที่วงเงินถึงกด", "ผู้รับเงินต้องเซ็นรับในใบสำคัญจ่ายเอง ระบบไม่เซ็นแทนให้"]
  }, {
    t: "แก้เมื่อบันทึกจ่ายผิด",
    when: "เฉพาะกรณีบันทึกผิด ไม่ใช่กรณีลูกค้าขอคืนเงิน",
    where: "“รอบจ่ายล่าสุด” → ปุ่มถังขยะ (เฉพาะแอดมิน)",
    steps: ["หาแถวรอบจ่ายที่บันทึกผิด กดปุ่มถังขยะท้ายแถว", "อ่านกล่องยืนยันให้ครบ — มันบอกจำนวนใบ ยอดรวม และชื่อคนที่จะถูกย้อน", "ยืนยันแล้วรอบจ่ายจะหายไป ใบทุกใบกลับไปเป็น “อนุมัติแล้ว · รอจ่ายคืน” พร้อมบันทึกประวัติว่าใครยกเลิก"],
    rules: ["เงินที่โอนออกไปแล้วระบบเรียกคืนให้ไม่ได้ ปุ่มนี้แก้แต่ “บันทึก” เท่านั้น", "ผลการอนุมัติเดิมไม่ถูกแตะ — ยังเป็นชื่อคนอนุมัติคนเดิม ไม่ใช่ชื่อคนที่มากดยกเลิก"]
  }, {
    t: "อนุมัติ OT และดูเวลาทำงาน",
    when: "ทุกสัปดาห์ก่อนปิดงวดเงินเดือน",
    where: "เมนู “เวลาทำงาน”",
    steps: ["หน้า “เวลาทำงาน” มีแผ่นเวลารายวันของทั้งบริษัท ใบขอ OT และตั้งค่าเวลาทำงาน", "เปิดใบขอ OT ที่ “รออนุมัติ” เทียบกับเวลาเข้า-ออกงานจริงของวันนั้น แล้วกดอนุมัติหรือไม่อนุมัติ", "ใบที่อนุมัติแล้วพิมพ์เก็บเป็นหลักฐานประกอบการจ่ายค่าล่วงเวลาได้"],
    rules: ["อนุมัติใบ OT ของตัวเองไม่ได้เสมอ · เวลาทำงานของคนอื่นเป็นข้อมูลส่วนบุคคล ดูเท่าที่จำเป็นกับงาน"],
    go: {
      view: "attend",
      th: "เปิดหน้าเวลาทำงาน"
    }
  }, {
    t: "ส่งออกเป็นไฟล์ Excel",
    when: "ตอนปิดเดือนหรือส่งข้อมูลให้ผู้ตรวจสอบ",
    where: "หน้าเบิกเงินหน้างาน → ปุ่มส่งออก",
    steps: ["ตั้งตัวกรองและคำค้นให้ได้ชุดใบที่อยากได้ก่อน", "กดปุ่มส่งออก — ไฟล์จะระบุขอบเขตที่กรองไว้และชื่อคนที่ส่งออกกำกับมาด้วย"],
    rules: ["ไฟล์ที่ส่งออกมีข้อมูลการเงินของพนักงาน อย่าส่งต่อออกนอกบริษัท"]
  }]
}];
const gdTrackOf = k => GD_TRACKS.find(t => t.key === k) || GD_TRACKS[0];
function gdTrackFor(role) {
  if (window.can(role, "expenseApprove") || window.can(role, "expensePay")) return "money";
  if (window.can(role, "editJob") || window.can(role, "dispatch") || window.can(role, "leads")) return "office";
  if (window.can(role, "expense") || window.can(role, "attend")) return "tech";
  return "start";
}
function GdLesson({
  n,
  lesson,
  color,
  onGo
}) {
  const [open, setOpen] = React.useState(true);
  const L = lesson;
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      overflow: "hidden"
    }
  }, React.createElement("button", {
    onClick: () => setOpen(v => !v),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      width: "100%",
      textAlign: "left",
      padding: "13px 15px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 27,
      height: 27,
      borderRadius: 9,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: color + "1A",
      color: color,
      fontSize: 13,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, n), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, L.t), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, L.where, L.when ? " · " + L.when : "")), React.createElement(Icon, {
    name: "chevronDown",
    size: 15,
    color: "var(--text-3)",
    style: {
      flexShrink: 0,
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .15s"
    }
  })), open && React.createElement("div", {
    style: {
      padding: "0 15px 15px 53px"
    }
  }, React.createElement("ol", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, L.steps.map((s, i) => React.createElement("li", {
    key: i,
    style: {
      display: "flex",
      gap: 9,
      fontSize: 13.5,
      lineHeight: 1.6,
      color: "var(--text-1)"
    }
  }, React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 19,
      height: 19,
      marginTop: 2,
      borderRadius: 99,
      display: "grid",
      placeItems: "center",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontSize: 10.5,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, i + 1), React.createElement("span", null, s)))), (L.rules || []).length > 0 && React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "10px 12px",
      borderRadius: 11,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd, var(--border))"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 6
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 13,
    color: "var(--tint-amber-tx)"
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E01\u0E0E\u0E17\u0E35\u0E48\u0E2B\u0E49\u0E32\u0E21\u0E02\u0E49\u0E32\u0E21")), L.rules.map((r, i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "var(--text-1)",
      display: "flex",
      gap: 7
    }
  }, React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u2022"), React.createElement("span", null, r)))), (L.fix || []).length > 0 && React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, L.fix.map(([q, a], i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 12.5,
      lineHeight: 1.6,
      color: "var(--text-2)"
    }
  }, React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, "\u0E16\u0E49\u0E32", q, " \u2014 "), a))), L.go && onGo && React.createElement("button", {
    onClick: () => onGo(L.go.view),
    style: {
      marginTop: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, L.go.th, " ", React.createElement(Icon, {
    name: "arrowRight",
    size: 14,
    color: "var(--text-3)"
  }))));
}
function GdHandout({
  track,
  onClose
}) {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const doPrint = () => {
    const old = document.title;
    document.title = "คู่มือการใช้งาน · " + track.th;
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 9,
      alignItems: "center",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
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
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E01 \xB7 ", track.th), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C \u0E2B\u0E23\u0E37\u0E2D \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E41\u0E08\u0E01")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, "\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \xB7 ", track.th), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#7A8A81",
      marginTop: 4
    }
  }, track.who)), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(window.BrandDoc, {
    height: 30
  }))), track.lessons.map((L, i) => React.createElement("div", {
    key: i,
    className: i > 0 && i % 3 === 0 ? "ec-sheet" : "",
    style: {
      marginTop: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800
    }
  }, i + 1, ". ", L.t), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#5A6B62",
      marginTop: 2
    }
  }, L.where, L.when ? " · ใช้ตอน: " + L.when : ""), React.createElement("ol", {
    style: {
      margin: "8px 0 0",
      paddingLeft: 20,
      fontSize: 11.5,
      lineHeight: 1.75
    }
  }, L.steps.map((s, k) => React.createElement("li", {
    key: k
  }, s))), (L.rules || []).length > 0 && React.createElement("div", {
    style: {
      marginTop: 7,
      padding: "7px 10px",
      border: "1px solid #C9D5CE",
      borderRadius: 6
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 800,
      color: "#5A6B62",
      marginBottom: 3
    }
  }, "\u0E01\u0E0E\u0E17\u0E35\u0E48\u0E2B\u0E49\u0E32\u0E21\u0E02\u0E49\u0E32\u0E21"), L.rules.map((r, k) => React.createElement("div", {
    key: k,
    style: {
      fontSize: 11,
      lineHeight: 1.65
    }
  }, "\u2014 ", r))), (L.fix || []).length > 0 && L.fix.map(([q, a], k) => React.createElement("div", {
    key: k,
    style: {
      fontSize: 11,
      lineHeight: 1.65,
      marginTop: 5
    }
  }, React.createElement("b", null, "\u0E16\u0E49\u0E32", q, ":"), " ", a)), React.createElement("div", {
    style: {
      marginTop: 8,
      borderTop: "1px dashed #C9D5CE",
      paddingTop: 4,
      fontSize: 9.5,
      color: "#9AA8A1"
    }
  }, "\u0E08\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21: ______________________________________________________________________"))), React.createElement("div", {
    style: {
      marginTop: 20,
      borderTop: "1px solid #C9D5CE",
      paddingTop: 8,
      fontSize: 9.5,
      color: "#7A8A81"
    }
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E21\u0E37\u0E48\u0E2D ", window.drDateTH ? window.drDateTH(new Date().toISOString().slice(0, 10)) : new Date().toLocaleDateString("th-TH"), " · ", "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E2B\u0E21\u0E14\u0E17\u0E14\u0E25\u0E2D\u0E07 \u2014 \u0E0B\u0E49\u0E2D\u0E21\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E2A\u0E2D\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E43\u0E2B\u0E49\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"))), document.body);
}
function GuideView({
  role,
  currentUser,
  onNav
}) {
  const [tab, setTab] = React.useState(() => gdTrackFor(role));
  const [sheet, setSheet] = React.useState(null);
  const track = gdTrackOf(tab);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minHeight: 0
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "14px 16px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 8
    }
  }, React.createElement(Icon, {
    name: "sparkle",
    size: 16,
    color: "var(--primary-dark)"
  }), React.createElement("b", {
    style: {
      fontSize: 14.5,
      color: "var(--text-1)"
    }
  }, "\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E19\u0E35\u0E49\u0E2A\u0E2D\u0E19")), React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.75,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E32\u0E22\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E19\u0E17\u0E35\u0E48\u0E21\u0E32\u0E40\u0E23\u0E35\u0E22\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E44\u0E25\u0E48\u0E17\u0E35\u0E25\u0E30\u0E1A\u0E17 \u2014 \u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E40\u0E23\u0E35\u0E22\u0E19", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, "\u0E16\u0E37\u0E2D\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E19\u0E31\u0E48\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E40\u0E2D\u0E07"), " \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E15\u0E32\u0E21\u0E17\u0E35\u0E25\u0E30\u0E02\u0E49\u0E2D \u0E14\u0E39\u0E41\u0E25\u0E49\u0E27\u0E08\u0E33\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E17\u0E48\u0E32\u0E01\u0E14\u0E40\u0E2D\u0E07 \xB7 \u0E1B\u0E38\u0E48\u0E21 \u201C\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E41\u0E08\u0E01\u201D \u0E17\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29\u0E43\u0E2B\u0E49\u0E16\u0E37\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E17\u0E27\u0E19\u0E44\u0E14\u0E49 \xB7 \u0E25\u0E34\u0E07\u0E01\u0E4C\u0E17\u0E49\u0E32\u0E22\u0E1A\u0E17\u0E1A\u0E32\u0E07\u0E1A\u0E17\u0E1E\u0E32\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E49\u0E25\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E17\u0E31\u0E19\u0E17\u0E35"), React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 11,
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd, var(--border))",
      fontSize: 12.5,
      lineHeight: 1.7,
      color: "var(--text-1)"
    }
  }, React.createElement("b", {
    style: {
      color: "var(--tint-red-tx)"
    }
  }, "\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2A\u0E2D\u0E19:"), " \u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E2B\u0E21\u0E14\u0E17\u0E14\u0E25\u0E2D\u0E07 \u0E17\u0E38\u0E01\u0E1B\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48\u0E01\u0E14\u0E04\u0E37\u0E2D\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E16\u0E49\u0E32\u0E08\u0E30\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E40\u0E23\u0E35\u0E22\u0E19\u0E25\u0E2D\u0E07\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32 \xB7 \u0E2A\u0E48\u0E07\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01 \xB7 \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \xB7 \u0E40\u0E14\u0E34\u0E19\u0E02\u0E31\u0E49\u0E19\u0E07\u0E32\u0E19) \u0E43\u0E2B\u0E49\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21", React.createElement("b", null, "\u0E07\u0E32\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E0B\u0E49\u0E2D\u0E21"), "\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19 \u0E2D\u0E22\u0E48\u0E32\u0E43\u0E2B\u0E49\u0E0B\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E22\u0E39\u0E48")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap"
    }
  }, GD_TRACKS.map(t => {
    const on = t.key === tab;
    return React.createElement("button", {
      key: t.key,
      onClick: () => setTab(t.key),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 14px",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        background: on ? t.color + "14" : "var(--surface)",
        border: "1px solid " + (on ? t.color : "var(--border)")
      }
    }, React.createElement(Icon, {
      name: t.icon,
      size: 17,
      color: on ? t.color : "var(--text-3)"
    }), React.createElement("span", null, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 800,
        color: on ? t.color : "var(--text-1)"
      }
    }, t.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, t.sub)));
  })), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 220
    }
  }, React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, track.th), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, track.who, " \xB7 ", track.lessons.length, " \u0E1A\u0E17")), React.createElement("button", {
    onClick: () => setSheet(track),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 15,
    color: "var(--text-3)"
  }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E41\u0E08\u0E01")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, track.lessons.map((L, i) => React.createElement(GdLesson, {
    key: track.key + i,
    n: i + 1,
    lesson: L,
    color: track.color,
    onGo: onNav
  }))), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      lineHeight: 1.7,
      paddingBottom: 6
    }
  }, "\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E1A\u0E2D\u0E01 = \u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E31\u0E49\u0E19\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E02\u0E49\u0E2D\u0E19\u0E31\u0E49\u0E19 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E1E\u0E31\u0E07 \u2014 \u0E41\u0E08\u0E49\u0E07\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E34\u0E4A\u0E01\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E43\u0E2B\u0E49", currentUser ? " · บัญชีที่เปิดอยู่ตอนนี้: " + (currentUser.name || "-") : ""), sheet && React.createElement(GdHandout, {
    track: sheet,
    onClose: () => setSheet(null)
  }));
}
Object.assign(window, {
  GD_TRACKS,
  gdTrackOf,
  gdTrackFor,
  GuideView
});