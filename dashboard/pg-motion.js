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
  function spring(t) { return t >= 1 ? 1 : 1 - Math.exp(-8 * t) * Math.cos(8 * t); }   // เลยเป้า ~4% แล้วนิ่ง

  /* ท่าให้ผู้ใช้เลือก (ผู้ใช้: "ออกแบบมา 4 รูปแบบ แล้วให้ฉันเลือก" ต.ค. 2026) — ชั่วคราว เลือกแล้วเหลือแบบเดียว ลบปุ่มเลือก
     1 โค้ง: ลอยเป็นวงโค้งย้อยลงแล้ววกเข้ากลาง (ผู้ใช้วาดเส้นโค้งให้ดู)
     2 สปริง: พุ่งตรง ขยายเลยนิดแล้วเด้งเข้าที่ (แบบเปิดแอปบนมือถือ)
     3 เปิดประตู: ขยายพร้อมหมุนรอบขอบซ้ายแบบเปิดแฟ้ม/ประตู (3D)
     4 เบลอชัด: พุ่งตรง เริ่มจางเบลอแล้วคมชัดขึ้นระหว่างขยาย (นุ่มสุด) */
  var STYLES = {
    1: { name: "โค้ง", open: easeOut, dur: 620, arc: true },
    2: { name: "สปริง", open: spring, dur: 700 },
    3: { name: "เปิดประตู", open: easeOut, dur: 640, turn: -75 },
    4: { name: "เบลอชัด", open: easeOut, dur: 560, blur: 10 }
  };
  function style() {
    var n = 1;
    try { n = +localStorage.getItem("pgMotion") || 1; } catch (e) {}
    return STYLES[n] || STYLES[1];
  }

  /* ท่าทั้งเส้นเป็นคีย์เฟรมถี่ ๆ คำนวณเอง (easing linear) — p=0 กรอบเท่าการ์ด · p=1 ใบเต็มที่เดิม (p เกิน 1 ได้ = เด้งเลย)
     กรอบเท่าการ์ด: ย่อทั้งใบ (scale เท่ากันสองแกน กว้างเท่าการ์ด — ผู้ใช้: "ย่อขนาดหน้าต่างตามด้วยไม่ได้หรอ")
     มุมซ้ายบนของตัวใบ (ใต้แถบแท็บ .ld-tabs) ทับมุมการ์ด ตัดส่วนที่ยาวเกินการ์ดด้วย clip (พิกัดก่อนย่อ จึงหารด้วย k)
     arc = เดินตามเส้นโค้ง bezier กำลังสองที่จุดคุมย้อยลงล่าง (ย้อยขั้นต่ำ 170px การ์ดที่อยู่ใกล้ปลายทางก็ยังเห็นโค้ง) */
  function flight(el, r, c, pOf, n, st) {
    var tabs = el.querySelector(".ld-tabs"), th = tabs ? tabs.offsetHeight : 0;
    var k = c.width / r.width, B0 = Math.max(0, r.height - th - c.height / k);
    var x0 = c.left - r.left, y0 = c.top - r.top - th * k, d = Math.hypot(x0, y0);
    var cx = st.arc ? x0 * .55 : x0 / 2, cy = st.arc ? Math.max(y0, 0) * .6 + Math.max(d * .45, 170) : y0 / 2;
    var fr = [];
    for (var i = 0; i <= n; i++) {
      var p = pOf(i / n), q = 1 - p, qc = Math.max(0, q);
      var x = q * q * x0 + 2 * q * p * cx, y = q * q * y0 + 2 * q * p * cy;
      var f = { offset: i / n, transformOrigin: "0 0",
        transform: (st.turn ? "perspective(1800px) " : "") + "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (k + (1 - k) * p).toFixed(4) + ")" +
          (st.turn ? " rotateY(" + (st.turn * qc).toFixed(1) + "deg)" : ""),
        clipPath: "inset(" + (th * qc).toFixed(1) + "px 0px " + (B0 * qc).toFixed(1) + "px 0px round " + (15 / k * qc).toFixed(1) + "px)" };
      if (st.blur) { f.filter = "blur(" + (st.blur * qc).toFixed(1) + "px)"; f.opacity = Math.min(1, .15 + p * 1.4).toFixed(2); }
      fr.push(f);
    }
    return fr;
  }

  window.pgZoomFromCard = function (el) {
    var ok = fresh(), o = from;
    from = null;
    if (!el || !ok) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    last = o.el;
    var st = style();
    el.style.animation = "none";   // แทนท่าเข้าเดิม (.pg-sheet-in)
    o.el.style.visibility = "hidden";   // ใบทับที่การ์ดพอดี ซ่อนการ์ดกันซ้อนสองชั้น
    var a = el.animate(flight(el, r, o.r, st.open, 36, st), { duration: st.dur });
    a.onfinish = a.oncancel = function () { o.el.style.visibility = ""; };
    return true;
  };

  window.pgZoomToCard = function (el) {
    var card = last;
    last = null;
    if (!el || !card || !card.isConnected || still()) return false;
    var c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c.width || !r.width || c.bottom < 0 || c.top > innerHeight) return false;
    var DUR = 500, st = style();
    var bd = document.createElement("div");   // พื้นหลังมืดจางออกตาม (ตัวจริงหายพร้อมลิ้นชัก)
    Object.assign(bd.style, { position: "fixed", inset: "0", background: "rgba(8,20,14,.45)", zIndex: "2147482999", pointerEvents: "none" });
    var g = el.cloneNode(true);
    Object.assign(g.style, { position: "fixed", margin: "0", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px",
      zIndex: "2147483000", pointerEvents: "none", animation: "none" });
    document.body.appendChild(bd);
    document.body.appendChild(g);
    card.style.visibility = "hidden";
    bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR, easing: "ease-out", fill: "forwards" });
    var a = g.animate(flight(g, r, c, function (t) { return 1 - easeInOut(t); }, 30, st), { duration: DUR, fill: "forwards" });
    a.onfinish = function () {   // ถึงการ์ดแล้ว ค่อยจางเผยการ์ดจริง
      card.style.visibility = "";
      g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" }).onfinish = function () { g.remove(); bd.remove(); };
    };
    a.oncancel = function () { card.style.visibility = ""; g.remove(); bd.remove(); };
    return true;
  };

  /* ปุ่มเลือกท่า — ชั่วคราว เฉพาะ localhost (เว็บจริงไม่เห็น) ลบทิ้งเมื่อผู้ใช้เลือกแล้ว */
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    var mk = function () {
      var bar = document.createElement("div");
      bar.id = "pg-motion-pick";
      Object.assign(bar.style, { position: "fixed", left: "50%", bottom: "46px", transform: "translateX(-50%)", zIndex: "2147483600", display: "flex", gap: "4px",
        padding: "4px", borderRadius: "999px", background: "var(--surface)", boxShadow: "0 8px 24px -6px rgba(8,20,14,.4)", font: "700 12px/1 'IBM Plex Sans Thai',sans-serif" });
      var draw = function () {
        var cur = 1;
        try { cur = +localStorage.getItem("pgMotion") || 1; } catch (e) {}
        bar.innerHTML = '<span style="padding:7px 8px;color:var(--text-3)">ท่าเปิดใบลูกค้า</span>';
        Object.keys(STYLES).forEach(function (key) {
          var b = document.createElement("button");
          b.textContent = key + " " + STYLES[key].name;
          var on = +key === cur;
          Object.assign(b.style, { border: "none", cursor: "pointer", padding: "7px 11px", borderRadius: "999px", font: "inherit",
            background: on ? "var(--primary)" : "transparent", color: on ? "#fff" : "var(--text-2)" });
          b.onclick = function () { try { localStorage.setItem("pgMotion", key); } catch (e) {} draw(); };
          bar.appendChild(b);
        });
      };
      draw();
      document.body.appendChild(bar);
    };
    if (document.body) mk(); else document.addEventListener("DOMContentLoaded", mk);
  }
})();
