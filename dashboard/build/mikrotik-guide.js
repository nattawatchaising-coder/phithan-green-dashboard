const MTG_SECTIONS = [{
  title: "ก่อนเริ่ม — ของที่ต้องมี",
  steps: ["โน้ตบุ๊ก Windows + สาย LAN 2 เส้น", "hEX (MikroTik hEX refresh E50UG) + อะแดปเตอร์ไฟที่มากับกล่อง", "โปรแกรม WinBox: เข้า mikrotik.com/download → หัวข้อ WinBox → ดาวน์โหลดตัว Windows → เปิดได้เลย ไม่ต้องติดตั้ง", "รหัส root ของ VPS (ถามแอดมิน — ห้ามส่งในแชตกลุ่ม) และบัญชีแอดมินของเว็บนี้", "รู้จักพอร์ต hEX: ช่อง LAN 5 ช่อง เรียง ether1 → ether5 (ether1 อยู่ริมสุด มีตัวหนังสือ PoE in / Internet) · ether1 = ขาเน็ต · ether2–5 = อุปกรณ์ในไซต์", {
    warn: "คำสั่งทุกกล่องในคู่มือนี้กดปุ่ม \"คัดลอก\" แล้ววาง ไม่ต้องพิมพ์เอง · วางในหน้าต่างดำ (PowerShell / Terminal) = คลิกขวา 1 ครั้ง"
  }]
}, {
  title: "1) ลงทะเบียนไซต์ในเว็บ",
  steps: ["หน้านี้ → ปุ่ม \"+ เพิ่มไซต์\" (มุมขวาบน)", "เลขไซต์ N: ระบบเสนอเลขว่างถัดไปให้ ใช้ตามนั้นได้เลย · ห้ามซ้ำกับไซต์อื่น", "ชื่อไซต์: ภาษาอังกฤษ/ตัวเลข/ขีด เท่านั้น เช่น ThaiSteel (ใช้ตั้งชื่อเราเตอร์ = SITE{NN}-ชื่อ) · ชื่อไทย/ผู้ติดต่อใส่ในหมายเหตุ", "กด \"สร้างไซต์ + คีย์\" → การ์ดไซต์ใหม่ขึ้นด้านล่าง"]
}, {
  title: "2) เพิ่มไซต์เข้าเซิร์ฟเวอร์ VPN (VPS)",
  steps: ["กดปุ่ม Windows บนคีย์บอร์ด พิมพ์ PowerShell แล้วกด Enter → ได้หน้าต่างดำ", {
    t: "วางคำสั่งนี้แล้วกด Enter:",
    code: "ssh root@{HOST}"
  }, "ครั้งแรกจะถาม \"Are you sure you want to continue connecting\" → พิมพ์ yes แล้ว Enter", "ใส่รหัส root แล้ว Enter — ตอนพิมพ์จะไม่เห็นตัวอักษรเลย เป็นเรื่องปกติ (วางด้วยคลิกขวาได้)", "สำเร็จเมื่อบรรทัดล่างสุดขึ้นต้นด้วย root@wg-server:~#  (ถ้ายังเป็น PS C:\\… = ยังอยู่บนคอม)", "กลับมาที่เว็บ การ์ดไซต์ {NN} → กดปุ่มเขียว \"คำสั่งตั้งค่า (บรรทัดเดียว)\" → ได้ 2 กล่อง", "กล่อง \"คำสั่งบน VPS\" → กดคัดลอก → คลิกขวาในหน้าต่าง PowerShell → กด Enter", "ต้องขึ้นข้อความ \"เพิ่มไซต์ {N} แล้ว\" → เปิดหน้าต่างนี้ทิ้งไว้ ใช้อีกในข้อ 4"]
}, {
  title: "3) ตั้งค่า hEX (ทำที่ออฟฟิศ)",
  steps: ["เสียบสายจากเน็ตออฟฟิศ (เราเตอร์/สวิตช์) เข้า ether1 · เสียบสายโน้ตบุ๊กเข้า ether2 · เสียบไฟ hEX รอ 1 นาที", "เปิด WinBox → แท็บ Neighbors → รอรายการขึ้น → คลิกที่ช่อง MAC Address (ตัวเลขแบบ 38:32:7A:…) ห้ามคลิกช่อง IP", "Login: admin · Password: hEX ใหม่ดูสติกเกอร์ใต้เครื่อง (บางล็อตว่าง) → Connect", "ถ้าถามให้ตั้งรหัสใหม่ → ตั้งแล้วจดไว้ · ถ้าถาม \"Do you want to see the software license?\" → พิมพ์ n", "เมนูซ้าย \"New Terminal\" → ได้หน้าต่างดำของ hEX", {
    warn: "ข้อนี้ทำครั้งเดียวต่อเครื่อง: เปิดสิทธิ์ดาวน์โหลด (RouterOS 7.17+ ปิดไว้)"
  }, {
    t: "วางคำสั่งนี้ใน Terminal ของ hEX แล้ว Enter:",
    code: "/system device-mode update fetch=yes"
  }, "ภายใน 5 นาที กดปุ่ม Reset ที่ตัว hEX สั้น ๆ แล้วปล่อยทันที (ห้ามกดค้าง — ค้างนาน = ล้างค่าเครื่อง) หรือถอดปลั๊กไฟแล้วเสียบใหม่", "WinBox จะหลุด รอ 1 นาที แล้วต่อใหม่ทาง MAC เหมือนเดิม → New Terminal", "กลับเว็บ ถ้ากดคำสั่งไว้เกิน 15 นาทีแล้ว กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" ใหม่", "กล่อง \"คำสั่งบน hEX\" → กดคัดลอก → คลิกขวาใน Terminal ของ hEX → Enter", "รอ: ตัวหนังสือวิ่งยาว และจะมี progress หมุนค้าง 1–2 นาที 2 รอบ (สร้างกุญแจ) — อย่ากด Q หรือปิดหน้าต่าง", "สำเร็จเมื่อบรรทัดท้ายขึ้น  {ID} OK - cert fingerprint: …  และชื่อเครื่องใน WinBox เปลี่ยนเป็น {ID}", "ถ้าหยุดกลางทางพร้อม error → ถ่ายรูปหน้าจอส่งแอดมิน · รันคำสั่งซ้ำได้ไม่เสียหาย"]
}, {
  title: "4) เช็กว่า VPN ติด (ในหน้าต่าง VPS จากข้อ 2)",
  steps: [{
    t: "ดูรายชื่อไซต์ที่ต่ออยู่:",
    code: "mt-peer list"
  }, "ต้องขึ้น  ไซต์ {NN} … : ต่อล่าสุด … วินาทีที่แล้ว  (ถ้าขึ้น \"ยังไม่เคยต่อ\" รอ 1 นาทีแล้วลองใหม่)", {
    t: "ลอง ping เราเตอร์ผ่าน VPN:",
    code: "ping -c 3 10.10.{N}.1"
  }, "ต้องขึ้น 3 บรรทัด \"64 bytes from 10.10.{N}.1\" และ 0% packet loss"]
}, {
  title: "4b) ยืนยันใบรับรองของไซต์ (ทุกไซต์ ครั้งเดียว — ต้องติดตั้ง agent ข้อ 10 ก่อน)",
  steps: ["ทำไม: เว็บจะให้ agent ส่งรหัสเข้าเราเตอร์ก็ต่อเมื่อแอดมินยืนยันว่าเป็น hEX ตัวจริง (กันเครื่องปลอม)", "รอ 1–2 นาทีหลัง VPN ติด → การ์ดไซต์ {NN} ขึ้นป้ายเหลือง \"รอยืนยันใบรับรอง\" พร้อมตัวเลขยาว 64 ตัว", "เทียบกับบรรทัดท้ายตอนตั้งค่า hEX ข้อ 3:  {ID} OK - cert fingerprint: …  (ต้องตรงทุกตัว ดูอย่างน้อย 8 ตัวแรกกับ 8 ตัวท้าย)", {
    t: "ถ้าไม่ได้จดไว้ ดูใหม่ใน Terminal ของ hEX:",
    code: "/certificate print detail where name=pg-https"
  }, "ตรงกัน → กดปุ่ม \"ตรงกับที่จดไว้ — ยืนยัน\" → ภายใน 1 นาทีป้ายเปลี่ยนเป็นเขียว \"ออนไลน์\" และขึ้นข้อมูลเราเตอร์", {
    warn: "ไม่ตรง = อย่ากดยืนยัน ถ่ายรูปส่งแอดมิน"
  }]
}, {
  title: "5) ตั้ง IP มิเตอร์ LEOS IPM310 = 10.10.{N}.20",
  steps: ["ตั้ง IP โน้ตบุ๊กชั่วคราว: Settings → Network & internet → Ethernet → IP assignment → Edit → Manual → เปิด IPv4 → IP address 192.168.0.50 · Subnet mask 255.255.255.0 → Save", "ถอดสายโน้ตบุ๊กจาก hEX มาเสียบช่อง LAN ของมิเตอร์ตรง ๆ", "เปิดเบราว์เซอร์ พิมพ์  http://192.168.0.244  (ค่าโรงงานของมิเตอร์) → ล็อกอิน user: admin (รหัสดูคู่มือมิเตอร์)", "แท็บ Network Configuration → IP address 10.10.{N}.20 · Subnet mask 255.255.255.0 · Default gateway 10.10.{N}.1 · DHCP = No", {
    warn: "ช่อง IP address ต้องเป็น .20 · เลข .1 ใส่แค่ช่อง Default gateway (เคยใส่ .1 ในช่อง IP แล้วชนกับ hEX)"
  }, "แท็บ System configuration → กด SAVE & REBOOT (ไม่กด = ไม่บันทึก) · หรือตั้งที่หน้าเครื่อง เมนู Code 7000", "ตั้ง IP โน้ตบุ๊กกลับ: IP assignment → Edit → Automatic (DHCP) → Save", "เสียบสายมิเตอร์เข้า ether3–5 ของ hEX · โน้ตบุ๊กกลับไปเสียบ ether2"]
}, {
  title: "6) ตั้ง IP SmartLogger (Huawei) = 10.10.{N}.10",
  steps: [{
    warn: "ขั้นนี้ยังไม่ได้ลองกับเครื่องจริง — ค่าตั้งต้นและชื่อเมนูอาจต่างตามรุ่น/เฟิร์มแวร์ ถ้าไม่ตรงดูป้ายใต้เครื่องหรือคู่มือ SmartLogger"
  }, "โน้ตบุ๊กตั้ง IP 192.168.0.50 แบบข้อ 5 → เสียบสายเข้าช่อง WAN/LAN ของ SmartLogger ตรง ๆ", "เบราว์เซอร์  https://192.168.0.10  (ค่าตั้งต้นที่พบบ่อย) → ถ้าขึ้นเตือนความปลอดภัย กด Advanced → Continue", "ล็อกอินด้วยบัญชีของ SmartLogger", "เมนู Settings → Comm. Param. → Wired Network → IP 10.10.{N}.10 · Subnet mask 255.255.255.0 · Gateway 10.10.{N}.1 · DNS 10.10.{N}.1 → Submit", "ตั้ง IP โน้ตบุ๊กกลับ Automatic → เสียบ SmartLogger เข้า ether3–5 ของ hEX", "SmartLogger ยังส่งข้อมูลขึ้น FusionSolar ได้ตามเดิม เพราะออกเน็ตผ่าน hEX"]
}, {
  title: "6b) ถ้าใช้ Waveshare + มิเตอร์ PM2200 แทน LEOS",
  steps: [{
    warn: "ยังไม่ได้ลองกับเครื่องจริง — ค่าตั้งต้นที่พบบ่อยของ Waveshare RS485 TO ETH (B) คือ 192.168.1.200"
  }, "โน้ตบุ๊กตั้ง IP 192.168.1.50 / 255.255.255.0 → เสียบเข้า Waveshare → เบราว์เซอร์  http://192.168.1.200", "ตั้ง IP 10.10.{N}.20 · mask 255.255.255.0 · gateway 10.10.{N}.1 · โหมด Modbus TCP to RTU · พอร์ต 502", "Baud rate / Parity / Stop bit ต้องตรงกับที่ตั้งในมิเตอร์ PM2200 (ดูเมนู Comm ที่หน้ามิเตอร์) → Save แล้วรีบูต", "เสียบ Waveshare เข้า ether3–5 ของ hEX"]
}, {
  title: "7) ทดสอบอ่านมิเตอร์จาก VPS",
  steps: [{
    t: "ครั้งแรกครั้งเดียว ติดตั้งโปรแกรมอ่าน Modbus:",
    code: "apt install -y mbpoll"
  }, {
    t: "มิเตอร์ตอบไหม:",
    code: "ping -c 3 10.10.{N}.20"
  }, {
    t: "อ่านกระแส 3 เฟส (เทียบกับหน้าจอมิเตอร์):",
    code: "mbpoll -m tcp -a 1 -t 3:float -r 213 -c 3 -1 10.10.{N}.20"
  }, {
    t: "อ่าน kWh Net และ Import:",
    code: "mbpoll -m tcp -a 1 -t 3:float -r 270 -c 2 -1 10.10.{N}.20"
  }, "ค่าที่ได้ต้องใกล้กับหน้าจอมิเตอร์ · ได้ 0 ทั้งหมด = มิเตอร์วัดได้ 0 จริง (ยังไม่ได้ต่อสายวัด) หรือ register ผิด", {
    t: "SmartLogger ตอบไหม:",
    code: "ping -c 3 10.10.{N}.10"
  }]
}, {
  title: "8) ก่อนส่งหน้างาน — เช็กให้ครบ",
  steps: ["mt-peer list ขึ้น \"ต่อล่าสุด\" ของไซต์ {NN}", "หน้านี้ \"สถานะไซต์\" ไซต์ {NN} เป็นสีเขียว \"ออนไลน์\" (ยืนยันใบรับรองแล้ว ข้อ 4b)", "ping 10.10.{N}.1 · .10 · .20 ผ่านทุกตัว (ตัวไหนยังไม่มีอุปกรณ์ข้ามได้)", "ติดป้าย SITE{NN} ที่ตัว hEX และเขียนว่า ether1 = เน็ตโรงงาน", "ไม่มีไฟล์ .rsc ค้างในโน้ตบุ๊ก (ถ้าเคยใช้ปุ่มดาวน์โหลด) — ไฟล์มีกุญแจลับ"]
}, {
  title: "9) ที่หน้างาน (สำหรับช่างติดตั้ง)",
  steps: ["ether1 → สาย LAN จากเน็ตโรงงาน (ช่องที่แจก IP อัตโนมัติ)", "SmartLogger และมิเตอร์ → ether2–5 ช่องไหนก็ได้", "เสียบไฟ hEX รอ 2 นาที → แจ้งแอดมินให้ดูหน้า \"สถานะไซต์\" (ต้องเป็นสีเขียว)", "ไม่ต้องตั้งค่าอะไรที่ hEX · ห้ามกดปุ่ม Reset ค้าง (ล้างค่าทั้งหมด ต้องเอากลับมาตั้งใหม่)", "ถ้า VPN ไม่ขึ้น: เช็กว่า ether1 มีไฟกระพริบ และโรงงานไม่ได้บล็อกเน็ตขาออก (UDP 51820)"]
}, {
  title: "10) ติดตั้ง agent สถานะไซต์บน VPS (ครั้งเดียว — แอดมิน)",
  steps: ["agent = โปรแกรมเล็ก ๆ บน VPS คอยเช็กทุกไซต์ทุก 1 นาที แล้วส่งสถานะมาที่หน้านี้ + ทำคำสั่งดู log / รีบูต (แก้ค่าเราเตอร์ไม่ได้)", "ssh เข้า VPS แบบข้อ 2", {
    t: "วางคำสั่งติดตั้ง:",
    code: "curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-agent/install.sh | sudo bash"
  }, "ท้ายสุดจะพิมพ์ 2 บรรทัด  MT_AGENT_KEY = …  และ  MT_CMD_SECRET = …  (ค่าลับ ห้ามส่งในแชต)", "เว็บ vercel.com → โปรเจกต์นี้ → Settings → Environment Variables → เพิ่มทีละตัว: Key = MT_AGENT_KEY · Value = ค่าหลังเครื่องหมาย = (Environment: Production) → Save · ทำซ้ำกับ MT_CMD_SECRET", "แท็บ Deployments → รายการบนสุด → ปุ่ม … → Redeploy (env ใหม่มีผลหลัง Redeploy)", {
    t: "รอ 2 นาทีแล้วดูว่า agent คุยกับเว็บได้ (ต้องไม่มีคำว่า ผิดพลาด):",
    code: "journalctl -u mt-agent -n 20 --no-pager"
  }, {
    t: "ทดสอบเช็กทุกไซต์ครั้งเดียว (พิมพ์ผลบนจอ):",
    code: "sudo mt-agent-once"
  }, "หน้านี้กล่อง \"สถานะไซต์\" ต้องขึ้น \"agent บน VPS ติดต่อล่าสุด … วิที่แล้ว\" → ทำข้อ 4b ให้ทุกไซต์", "agent อัปเดตตัวเองทุกวันตี 3 ครึ่ง (ดึงจาก GitHub) ไม่ต้องทำอะไร · อยากได้ทันที: sudo mt-agent-update · ดูผล: journalctl -u mt-agent-update -n 5"]
}, {
  title: "11) เข้าหน้าเว็บมิเตอร์ / SmartLogger จากคอม (ต่อ VPN ด้วยแอป WireGuard — ตั้งครั้งเดียวต่อคอม)",
  steps: ["ทำแล้วได้อะไร: เปิดสวิตช์ในแอป WireGuard ทีเดียว แล้วเข้าอุปกรณ์ของทุกไซต์ได้จากเบราว์เซอร์ ไม่ต้องเปิด PowerShell อีก", {
    warn: "คอมที่เพิ่มจะเข้าหน้าเว็บมิเตอร์/SmartLogger ได้ทุกไซต์ — เพิ่มเฉพาะคอมที่ไว้ใจได้ (สูงสุด 8 เครื่อง) · คอมหาย/เลิกใช้ ให้ลบทันทีด้วย sudo mt-admin del <เลข>"
  }, "คอม: เข้า wireguard.com/install → Download Windows Installer → ติดตั้ง (กด Next จนจบ)", "ssh เข้า VPS แบบข้อ 2", {
    t: "ครั้งแรกครั้งเดียวของ VPS — ติดตั้งคำสั่ง mt-admin:",
    code: "curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-server/admin.sh | sudo bash"
  }, {
    t: "เพิ่มคอมเครื่องนี้ (ตั้งชื่ออังกฤษ เช่น office-pc):",
    code: "sudo mt-admin add office-pc"
  }, "จอจะพิมพ์คอนฟิก — ลากคลุมตั้งแต่บรรทัด [Interface] ถึงบรรทัด PersistentKeepalive = 25 แล้วกด Enter (= คัดลอก) · มีกุญแจลับ แสดงครั้งเดียว ห้ามส่งในแชต", "เปิดแอป WireGuard → ลูกศรข้างปุ่ม Add Tunnel → Add empty tunnel… → ลบข้อความในกล่องใหญ่ทิ้งทั้งหมด → วาง (Ctrl+V) → ช่อง Name ใส่ flashsolar → Save", "กด Activate → Status ต้องเป็น Active (สีเขียว) · พิมพ์ exit ในหน้าต่าง VPS ปิดได้เลย", "ทดสอบ: เปิดเบราว์เซอร์  http://10.10.{N}.20  = หน้าเว็บมิเตอร์ ·  https://10.10.{N}.10  = SmartLogger (ขึ้นเตือนใบรับรองกด Advanced → Continue)", "ครั้งต่อไป: เปิดแอป WireGuard → Activate → เข้าหน้า MikroTik Monitoring → กดไซต์ → ปุ่ม \"หน้าเว็บมิเตอร์\" / \"SmartLogger\" · เลิกใช้กด Deactivate", "เข้าได้แค่หน้าเว็บ (พอร์ต 80/443) ของ .10 และ .20 — ไม่เปิด Modbus และไม่เปิดเข้าเราเตอร์ · เน็ตปกติของคอมไม่วิ่งผ่าน VPN", {
    t: "ดูคอมที่เพิ่มไว้ (บน VPS):",
    code: "sudo mt-admin list"
  }]
}];
const MTG_TROUBLE = [["ssh: Connection timed out", "VPS เพิ่งเปิด/รีบูต รอ 5 นาที · หรือเน็ตที่ใช้บล็อกพอร์ต 22 ลอง hotspot มือถือ"], ["mt-peer: not recognized", "พิมพ์บนคอม (PS C:\\…) ต้อง ssh เข้า VPS ก่อน (ข้อ 2)"], ["mt-peer add ขึ้น \"ไม่ใช่ peer จากหน้าเว็บ\"", "คัดลอกไม่ครบ ใช้ปุ่มคัดลอกของกล่อง \"คำสั่งบน VPS\" (มี EOF ปิดท้าย)"], ["hEX: not allowed by device-mode", "ยังไม่ได้เปิด fetch — ทำส่วน \"ครั้งเดียวต่อเครื่อง\" ในข้อ 3 แล้วขอคำสั่งใหม่ · หรือใช้ปุ่ม \"ดาวน์โหลด .rsc\" แทน"], ["hEX: link expired or already used", "คำสั่งหมดอายุ (15 นาที) หรือใช้ไปแล้ว → กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" ใหม่"], ["hEX: error เรื่อง certificate / SSL", "ใช้บรรทัดสำรองใต้หัวข้อ \"ถ้าขึ้น error เรื่อง certificate\" (ใช้ที่ออฟฟิศเท่านั้น)"], ["mt-peer list: ยังไม่เคยต่อ", "hEX ยังไม่ได้รันคำสั่ง / ether1 ไม่มีเน็ต / สร้างคีย์ใหม่แล้วแต่ยังไม่ได้วางคำสั่ง VPS ใหม่"], ["ping .20 ขึ้น Destination Host Unreachable", "VPN ปกติ แต่ hEX หาอุปกรณ์ไม่เจอ: ยังไม่ได้เปลี่ยน IP อุปกรณ์ / ไม่ได้กด SAVE & REBOOT / สายไม่ได้เสียบ ether2–5 · ดูใน hEX: /ip arp print"], ["IP ชนกับ hEX (/ip arp print มี 10.10.N.1 เป็น MAC ของอุปกรณ์อื่น)", "อุปกรณ์ถูกตั้ง IP เป็น .1 — แก้ช่อง IP ของอุปกรณ์เป็นเลขของมันเอง (.10 / .20)"], ["สถานะไซต์: \"ยังไม่ได้ติดตั้ง agent\" / \"agent เงียบไป\"", "ทำข้อ 10 · ติดตั้งแล้วดู journalctl -u mt-agent -n 20 — ขึ้น 401 = MT_AGENT_KEY ใน Vercel ไม่ตรง/ยังไม่ Redeploy · 503 = ยังไม่ได้ใส่ env"], ["สถานะไซต์: VPN หลุด", "hEX ดับ / เน็ตโรงงานล่ม / ether1 หลุด · ถ้าทุกไซต์หลุดพร้อมกัน = VPS มีปัญหา"], ["สถานะไซต์: ใบรับรองไม่ตรง", "hEX ถูกรีเซ็ตหรือเปลี่ยนเครื่อง → ถ้าใช่ ตั้งค่าใหม่แล้วกด \"ใช้ใบใหม่นี้\" · ถ้าไม่ได้ทำอะไร อย่ากด แจ้งแอดมิน"], ["สถานะไซต์: อ่านเราเตอร์ไม่ได้ — รหัส pg-web ไม่ตรง", "กด \"สร้างคีย์ใหม่\" แล้วยังไม่ได้รันคำสั่งตั้งค่าที่ hEX → ทำข้อ 2–3 ใหม่"], ["รหัส/กุญแจหลุด", "กด \"สร้างคีย์ใหม่\" ที่การ์ดไซต์ → ทำข้อ 2–4 ใหม่ทั้งหมด"]];
function mtgFill(str, ctx) {
  return String(str).replace(/\{N\}/g, ctx.n).replace(/\{NN\}/g, ctx.nn).replace(/\{ID\}/g, ctx.id).replace(/\{HOST\}/g, ctx.host);
}
function MtgCode({
  text
}) {
  const [msg, setMsg] = React.useState("");
  const copy = () => {
    const done = () => {
      setMsg("คัดลอกแล้ว");
      setTimeout(() => setMsg(""), 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => setMsg("คัดลอกไม่ได้"));
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      margin: "5px 0 2px",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-tile)",
      padding: "7px 8px 7px 12px"
    }
  }, React.createElement("code", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-1)",
      overflowX: "auto",
      whiteSpace: "nowrap"
    }
  }, text), React.createElement("button", {
    className: "btn btn-sm",
    onClick: copy
  }, msg || "คัดลอก"));
}
function MtGuide({
  sites,
  serverHost
}) {
  const [pick, setPick] = React.useState("");
  const site = (sites || []).find(s => String(s.n) === pick) || (sites || [])[0];
  const ctx = site ? {
    n: site.n,
    nn: String(site.n).padStart(2, "0"),
    id: "SITE" + String(site.n).padStart(2, "0") + "-" + site.name,
    host: serverHost || "<IP ของ VPS>"
  } : {
    n: "N",
    nn: "NN",
    id: "SITENN-ชื่อ",
    host: serverHost || "<IP ของ VPS>"
  };
  return React.createElement("details", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--primary-dark)",
      fontSize: 13
    }
  }, "\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E0B\u0E15\u0E4C\u0E43\u0E2B\u0E21\u0E48 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E19\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E17\u0E33 (\u0E01\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      margin: "10px 0 4px"
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E44\u0E0B\u0E15\u0E4C:"), (sites || []).length ? React.createElement("select", {
    value: site ? String(site.n) : "",
    onChange: e => setPick(e.target.value),
    style: {
      padding: "6px 10px",
      borderRadius: "var(--r-chip)",
      border: "none",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    }
  }, sites.map(s => React.createElement("option", {
    key: s.n,
    value: String(s.n)
  }, "SITE" + String(s.n).padStart(2, "0") + "-" + s.name))) : React.createElement("span", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C \u2014 \u0E40\u0E25\u0E02 N/\u0E0A\u0E37\u0E48\u0E2D\u0E08\u0E30\u0E40\u0E15\u0E34\u0E21\u0E43\u0E2B\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E02\u0E49\u0E2D 1"), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E02 IP \u0E41\u0E25\u0E30\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E43\u0E19\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01")), MTG_SECTIONS.map((sec, i) => React.createElement("details", {
    key: sec.title,
    open: i === 0,
    style: {
      marginTop: 10,
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: "10px 14px"
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--text-1)",
      fontSize: 13
    }
  }, mtgFill(sec.title, ctx)), React.createElement("ol", {
    style: {
      margin: "8px 0 2px",
      paddingLeft: 20,
      lineHeight: 1.65,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, sec.steps.map((st, j) => typeof st === "string" ? React.createElement("li", {
    key: j
  }, mtgFill(st, ctx)) : st.warn ? React.createElement("div", {
    key: j,
    style: {
      listStyle: "none",
      marginLeft: -20,
      fontWeight: 600,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "7px 11px",
      borderRadius: "var(--r-tile)"
    }
  }, mtgFill(st.warn, ctx)) : React.createElement("li", {
    key: j
  }, mtgFill(st.t, ctx), React.createElement(MtgCode, {
    text: mtgFill(st.code, ctx)
  })))))), React.createElement("details", {
    style: {
      marginTop: 10,
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: "10px 14px"
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--text-1)",
      fontSize: 13
    }
  }, "\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E17\u0E35\u0E48\u0E40\u0E04\u0E22\u0E40\u0E08\u0E2D \u0E41\u0E25\u0E30\u0E27\u0E34\u0E18\u0E35\u0E41\u0E01\u0E49"), React.createElement("ul", {
    style: {
      margin: "8px 0 2px",
      paddingLeft: 18,
      lineHeight: 1.65
    }
  }, MTG_TROUBLE.map(([q, a]) => React.createElement("li", {
    key: q
  }, React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, mtgFill(q, ctx)), " \u2014 ", mtgFill(a, ctx))))));
}
window.MtGuide = MtGuide;