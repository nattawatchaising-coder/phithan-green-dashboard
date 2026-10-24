/* pg-motion.js — เปิด/ปิดใบลูกค้าฝ่ายขาย (LeadDrawer) แบบ "การ์ดขยายเป็นใบ แล้วหดกลับเป็นการ์ด"
   (ผู้ใช้: เวลาเปิดงานยังดูธรรมดาไป + ส่งวิดีโอต้นแบบ การ์ดเล็กขยายในที่ เนื้อใหม่จางขึ้นแบบเบลอ ปิดแล้วหดกลับ ต.ค. 2026)
   - จดการ์ด .bd-card ที่เพิ่งกด (capture) → ลิ้นชักที่เพิ่งเปิดเรียก pgZoomFromCard(แผ่นใบ)
     ใช้ตัวใบจริงตั้งแต่เฟรมแรก: ย่อทั้งใบให้กว้างเท่าการ์ด วางทับการ์ด ตัดส่วนเกินด้วย clip-path แล้วขยาย/เลื่อนเข้าที่พร้อมกัน
     (รอบแรกเป็นสำเนาการ์ดยืดเปล่า ๆ แล้วจางเป็นใบ — ผู้ใช้: "smooth แล้วแต่การแสดงมันแปลกๆ" กลางทางเป็นแผ่นว่าง)
   - ปิดด้วยปุ่ม × / Esc / คลิกพื้นหลัง เรียก pgZoomToCard(แผ่นใบ) ก่อน onClose: สำเนาใบ (ตัวจริงถูกถอดทันที) หดกลับเข้าการ์ดเดิมท่าเดียวกันแบบย้อน
   - ใบงานติดตั้ง (DetailDrawer ลิ้นชักขวา) ไม่ใช้ — ผู้ใช้บอกเลื่อนเข้าจากด้านข้างดีกว่า
   - ไม่ได้เปิดจากการ์ด (ปฏิทิน/ค้นหา) หรือการ์ดหายไปแล้ว = คืน false ใช้ท่าเข้า/ออกปกติของลิ้นชักนั้น */
(function () {
  var from = null, last = null;
  document.addEventListener("click", function (e) {
    var c = e.target && e.target.closest && e.target.closest(".bd-card");
    if (c) from = { r: c.getBoundingClientRect(), t: Date.now(), el: c };
  }, true);
  function still() { return !document.body.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function fresh() { return !!(from && Date.now() - from.t < 900 && !still()); }
  window.pgCardOrigin = fresh;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }   // ไม่เร่งต้นจัดเกิน ตาเห็นการย่อ/ขยาย
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ท่าเบลอชัด (ผู้ใช้เลือกจาก 4 แบบ: โค้ง/สปริง/เปิดประตู/เบลอชัด — "4 เบลอชัด" ต.ค. 2026)
     คีย์เฟรมถี่ ๆ คำนวณเอง (easing linear) — p=0 กรอบเท่าการ์ด · p=1 ใบเต็มที่เดิม
     กรอบเท่าการ์ด: ย่อทั้งใบ (scale เท่ากันสองแกน กว้างเท่าการ์ด — ผู้ใช้: "ย่อขนาดหน้าต่างตามด้วยไม่ได้หรอ")
     มุมซ้ายบนของตัวใบ (ใต้แถบแท็บ .ld-tabs) ทับมุมการ์ด ตัดส่วนที่ยาวเกินการ์ดด้วย clip (พิกัดก่อนย่อ จึงหารด้วย k)
     เดินเส้นตรง เริ่มจางเบลอ แล้วคมชัดขึ้นระหว่างขยาย */
  var BLUR = 10, OPEN_DUR = 560, CLOSE_DUR = 500;
  function flight(el, r, c, pOf, n) {
    var tabs = el.querySelector(".ld-tabs"), th = tabs ? tabs.offsetHeight : 0;
    var k = c.width / r.width, B0 = Math.max(0, r.height - th - c.height / k);
    var x0 = c.left - r.left, y0 = c.top - r.top - th * k;
    var fr = [];
    for (var i = 0; i <= n; i++) {
      var p = pOf(i / n), q = 1 - p;
      fr.push({ offset: i / n, transformOrigin: "0 0",
        transform: "translate(" + (x0 * q).toFixed(1) + "px," + (y0 * q).toFixed(1) + "px) scale(" + (k + (1 - k) * p).toFixed(4) + ")",
        clipPath: "inset(" + (th * q).toFixed(1) + "px 0px " + (B0 * q).toFixed(1) + "px 0px round " + (15 / k * q).toFixed(1) + "px)",
        filter: "blur(" + (BLUR * q).toFixed(1) + "px)", opacity: Math.min(1, .15 + p * 1.4).toFixed(2) });
    }
    return fr;
  }

  var hid = null, watch = 0;
  function unhide() { clearInterval(watch); watch = 0; if (hid) hid.style.visibility = ""; hid = null; }

  window.pgZoomFromCard = function (el) {
    var ok = fresh(), o = from;
    from = null;
    if (!el || !ok) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    unhide();
    last = o.el;
    el.style.animation = "none";   // แทนท่าเข้าเดิม (.pg-sheet-in)
    /* ซ่อนการ์ดไว้ตลอดที่ใบเปิด — ใบมาจากการ์ดนั้น ที่เดิมว่างไว้ ปิดแล้วใบหดกลับไปเติมที่ (ผู้ใช้: "เปิดมาแล้วให้หายไปก่อน ปิดค่อยกลับไปที่เดิม")
       ปิดทางอื่นที่ไม่เรียก pgZoomToCard (ย้ายลงถัง ฯลฯ) = เฝ้าดูใบถูกถอดจากหน้า แล้วคืนการ์ด */
    o.el.style.visibility = "hidden";
    hid = o.el;
    watch = setInterval(function () { if (!el.isConnected) unhide(); }, 250);
    el.animate(flight(el, r, o.r, easeOut, 36), { duration: OPEN_DUR });
    return true;
  };

  window.pgZoomToCard = function (el) {
    var card = last;
    last = null;
    if (!el || !card || !card.isConnected || still()) { unhide(); return false; }
    var c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c.width || !r.width || c.bottom < 0 || c.top > innerHeight) { unhide(); return false; }
    clearInterval(watch); watch = 0; hid = null;   // การ์ดยังซ่อนอยู่ ท่าปิดเผยเองตอนใบถึงที่
    var bd = document.createElement("div");   // พื้นหลังมืดจางออกตาม (ตัวจริงหายพร้อมลิ้นชัก)
    Object.assign(bd.style, { position: "fixed", inset: "0", background: "rgba(8,20,14,.45)", zIndex: "2147482999", pointerEvents: "none" });
    var g = el.cloneNode(true);
    Object.assign(g.style, { position: "fixed", margin: "0", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px",
      zIndex: "2147483000", pointerEvents: "none", animation: "none" });
    document.body.appendChild(bd);
    document.body.appendChild(g);
    card.style.visibility = "hidden";
    bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_DUR, easing: "ease-out", fill: "forwards" });
    var a = g.animate(flight(g, r, c, function (t) { return 1 - easeInOut(t); }, 30), { duration: CLOSE_DUR, fill: "forwards" });
    a.onfinish = function () {   // ถึงการ์ดแล้ว ค่อยจางเผยการ์ดจริง
      card.style.visibility = "";
      g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = function () { g.remove(); bd.remove(); };
    };
    a.oncancel = function () { card.style.visibility = ""; g.remove(); bd.remove(); };
    return true;
  };
})();
