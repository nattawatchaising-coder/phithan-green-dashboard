/* kbfit.js — คีย์บอร์ดมือถือบังช่องกรอก (ผู้ใช้แจ้ง ต.ค. 2026: "กดพิมพ์แล้วต้องไปกดช่องอื่นเอง")

   อาการ: กรอกช่องหนึ่งเสร็จ ช่องถัดไปอยู่ใต้คีย์บอร์ด เลื่อนหน้าขึ้นมาก็ไม่สุด
   ต้องปิดคีย์บอร์ดก่อนถึงจะกดช่องถัดไปได้

   ทำไมเป็น: .app-root สูง 100dvh และ body เป็น overflow:hidden — ตัวที่เลื่อนจริงคือ
   .app-content ข้างใน  พอคีย์บอร์ดเด้งขึ้นมา dvh ไม่หดตาม (มันนับแค่แถบที่อยู่/แถบล่าง
   ของเบราว์เซอร์ ไม่นับคีย์บอร์ด) กรอบที่เลื่อนได้จึงยังยาวลงไปจมอยู่ใต้คีย์บอร์ด
   ท่อนล่างของฟอร์มเลยเลื่อนขึ้นมาให้เห็นไม่ได้

   แก้: วัดส่วนที่หายไปจากจอด้วย visualViewport แล้วเก็บไว้ที่ตัวแปร --kb
   ให้ .app-root หดตาม (ดู index.html) กรอบที่เลื่อนได้จะเท่ากับที่ตาเห็นจริง
   แล้วเลื่อนช่องที่กำลังกรอกขึ้นมาให้เองถ้ามันตกขอบ

   เฉพาะ index.html — หน้า LIFF เลื่อนทั้งหน้าตามปกติอยู่แล้ว ไม่มีอาการนี้ */
(function () {
  var vv = window.visualViewport;
  if (!vv) return;                      // เบราว์เซอร์เก่า: ปล่อยไว้แบบเดิม ไม่ทำให้แย่ลง

  var root = document.documentElement;
  var kb = -1;
  var timer = 0;

  var FIELDS = 'input, textarea, select, [contenteditable="true"]';

  /* ส่วนของจอที่หายไป = คีย์บอร์ด + แถบ autofill ที่ iOS วางคร่อมไว้เหนือคีย์บอร์ด
     แถบที่อยู่/แถบล่างของ Safari ยุบ-ขยายเองได้หลายสิบพิกเซลตอนเลื่อนหน้า ซึ่งไม่ใช่คีย์บอร์ด
     จึงนับเฉพาะที่หายไปเยอะจริง ๆ · ตอนผู้ใช้ซูมสองนิ้ว vv.height ก็เล็กลงเหมือนกัน ต้องไม่นับ */
  function measure() {
    if (vv.scale > 1.01) return 0;
    var gap = Math.round(window.innerHeight - vv.height - vv.offsetTop);
    return gap > 120 ? gap : 0;
  }

  /* ช่องที่กำลังกรอกตกขอบบน/ล่างของพื้นที่ที่เห็น → เลื่อนมาไว้กลางจอ
     scrollIntoView เลื่อนกรอบที่เลื่อนได้ตัวใกล้สุดให้เอง ใช้ได้ทั้งในหน้าปกติและในลิ้นชัก */
  function fitFocused() {
    var el = document.activeElement;
    if (!el || !el.matches || !el.matches(FIELDS)) return;
    var r = el.getBoundingClientRect();
    if (r.bottom > vv.height - 8 || r.top < 0) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  function apply(delay) {
    var n = measure();
    if (n !== kb) { kb = n; root.style.setProperty('--kb', kb + 'px'); }
    clearTimeout(timer);
    timer = setTimeout(fitFocused, delay);   // รอให้เลย์เอาต์หดเสร็จก่อนค่อยเลื่อน
  }

  vv.addEventListener('resize', function () { apply(60); });
  vv.addEventListener('scroll', function () { apply(60); });
  /* ย้ายไปช่องอื่นตอนคีย์บอร์ดเปิดค้างอยู่ ขนาดจอไม่เปลี่ยน resize จึงไม่ยิง ต้องดักเอง
     หน่วงนานกว่าเพราะรอบแรกคีย์บอร์ดยังเลื่อนขึ้นอยู่ */
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.matches && e.target.matches(FIELDS)) apply(320);
  });

  apply(0);
})();
