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
  var EASE = "cubic-bezier(.33,1,.68,1)";   // ไม่เร่งต้นจัดเกิน — (.32,.72,0,1) 7% แรกขยายไป 70% แล้ว ตาไม่ทันเห็นย่อ/ขยาย

  /* กรอบเริ่ม: ย่อทั้งใบ (scale เท่ากันสองแกน กว้างเท่าการ์ด — ผู้ใช้: "ย่อขนาดหน้าต่างตามด้วยไม่ได้หรอ")
     มุมซ้ายบนของตัวใบ (ใต้แถบแท็บ .ld-tabs) ทับมุมการ์ด แล้วตัดส่วนที่ยาวเกินการ์ดออก — clip คิดในพิกัดก่อนย่อ จึงหารด้วย k */
  function shut(el, r, c) {
    var tabs = el.querySelector(".ld-tabs"), th = tabs ? tabs.offsetHeight : 0;
    var k = c.width / r.width;
    return {
      transformOrigin: "0 0",
      transform: "translate(" + (c.left - r.left) + "px," + (c.top - r.top - th * k) + "px) scale(" + k + ")",
      clipPath: "inset(" + th + "px 0px " + Math.max(0, r.height - th - c.height / k) + "px 0px round " + (15 / k) + "px)"
    };
  }
  var OPEN = { transformOrigin: "0 0", transform: "translate(0px,0px) scale(1)", clipPath: "inset(0px 0px 0px 0px round 0px)" };

  window.pgZoomFromCard = function (el) {
    var ok = fresh(), o = from;
    from = null;
    if (!el || !ok) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    last = o.el;
    el.style.animation = "none";   // แทนท่าเข้าเดิม (.pg-sheet-in)
    o.el.style.visibility = "hidden";   // ใบทับที่การ์ดพอดี ซ่อนการ์ดกันซ้อนสองชั้น
    var a = el.animate([shut(el, r, o.r), OPEN], { duration: 560, easing: EASE });
    a.onfinish = a.oncancel = function () { o.el.style.visibility = ""; };
    return true;
  };

  window.pgZoomToCard = function (el) {
    var card = last;
    last = null;
    if (!el || !card || !card.isConnected || still()) return false;
    var c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c.width || !r.width || c.bottom < 0 || c.top > innerHeight) return false;
    var DUR = 440;
    var bd = document.createElement("div");   // พื้นหลังมืดจางออกตาม (ตัวจริงหายพร้อมลิ้นชัก)
    Object.assign(bd.style, { position: "fixed", inset: "0", background: "rgba(8,20,14,.45)", zIndex: "2147482999", pointerEvents: "none" });
    var g = el.cloneNode(true);
    Object.assign(g.style, { position: "fixed", margin: "0", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px",
      zIndex: "2147483000", pointerEvents: "none", animation: "none" });
    document.body.appendChild(bd);
    document.body.appendChild(g);
    card.style.visibility = "hidden";
    bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR, easing: "ease-out", fill: "forwards" });
    var to = shut(g, r, c);
    var a = g.animate([Object.assign({ easing: "cubic-bezier(.65,0,.35,1)" }, OPEN), Object.assign({ opacity: 1, offset: .85 }, to), Object.assign({ opacity: 0 }, to)], { duration: DUR + 80, fill: "forwards" });
    setTimeout(function () { card.style.visibility = ""; }, DUR * .85);
    a.onfinish = a.oncancel = function () { card.style.visibility = ""; g.remove(); bd.remove(); };
    return true;
  };
})();
