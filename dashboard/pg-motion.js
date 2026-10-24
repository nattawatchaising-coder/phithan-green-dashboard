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
  /* SH = clip ขยายเลยขอบใบออกไปทีละนิดจนพ้นเงา — clip-path ตัดเงาใบทิ้ง ถ้าค้างกรอบพอดีใบ จบท่าแล้วเงาโผล่พรวด
     (ผู้ใช้: "ขอบเงากระดาษนี้แหละ ที่ทำให้รู้สึกอยู่ ๆ ก็มีขึ้นมา") */
  var SH = 90;
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
        clipPath: "inset(" + (th * q - SH * p).toFixed(1) + "px " + (-SH * p).toFixed(1) + "px " + (B0 * q - SH * p).toFixed(1) + "px " + (-SH * p).toFixed(1) + "px round " + (15 / k * q + SH * p).toFixed(1) + "px)",
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

/* ── ลากการ์ดบนบอร์ดงานติดตั้ง: หยิบ · ลาก · วาง แบบมีท่า (ผู้ใช้: "ทำอนิเมชั่น ลากย้าย กดวางลงด้วยสิ" ต.ค. 2026) ──
   ภาพลากของเบราว์เซอร์เป็นรูปนิ่ง ทำท่าไม่ได้ → ซ่อนภาพนั้น (รูปใส 1px) แล้ววาดสำเนาการ์ดลอยตามเมาส์เอง
   - หยิบ: สำเนาย่อจากเต็มใบลงเหลือ 72% รอบจุดที่จับ (จุดที่จับอยู่ใต้เมาส์ตลอด) ด้วยสปริงเด้งนิด ๆ + เงาลอย
   - ลาก: เอียงตามความเร็วแนวนอน (สปริง) ปล่อยมือนิ่งก็ตั้งตรงเอง
   - วางลงคอลัมน์: รอการ์ดไปโผล่ที่ใหม่ แล้วสำเนาบินลงไปทับพอดีขยายกลับเต็มใบ · ย้ายไม่ได้/ยกเลิก/รอยืนยัน = บินกลับที่เดิม
   - วางลงถังขยะ: pgDragTrash ให้ dropTrash ใน views-flow.jsx บินสำเนาที่ลอยอยู่เข้าถังต่อเลย
   ใช้กับการ์ดที่มี data-lid (ลูกค้า) / data-jid (งาน) — views-flow.jsx startDrag เรียก pgDragLift */
(function () {
  var NONE = new Image();
  NONE.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  var cur = null;   // { g, w, h, gx, gy, mx, my, s, vs, rot, vr, vx, lx, raf, sel, home, done }
  function still() { return !document.body.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  // ตำแหน่งมุมซ้ายบน (ก่อน scale รอบจุดกลาง) ที่ทำให้จุดที่จับ (gx,gy) อยู่ใต้เมาส์
  function pos(d) { return { x: d.mx - d.w / 2 - d.s * (d.gx - d.w / 2), y: d.my - d.h / 2 - d.s * (d.gy - d.h / 2) }; }
  function tf(x, y, s, r) { return "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(4) + ") rotate(" + r.toFixed(2) + "deg)"; }
  function draw(d) { var p = pos(d); d.g.style.transform = tf(p.x, p.y, d.s, d.rot); }
  function tick() {
    var d = cur;
    if (!d || d.done) return;
    // ความเร็วแนวนอนแบบหน่วง → มุมเอียงเป้า · สเกลสปริงเข้า .72
    d.vx = d.vx * .8 + (d.mx - d.lx) * .2; d.lx = d.mx;
    var rt = Math.max(-9, Math.min(9, d.vx * .9));
    d.vr += (rt - d.rot) * .16; d.vr *= .72; d.rot += d.vr;
    d.vs += (.72 - d.s) * .2; d.vs *= .68; d.s += d.vs;
    draw(d);
    d.raf = requestAnimationFrame(tick);
  }
  function onOver(e) { if (cur && !cur.done && (e.clientX || e.clientY)) { cur.mx = e.clientX; cur.my = e.clientY; } }
  function stop(d) {
    d.done = true;
    cancelAnimationFrame(d.raf);
    document.removeEventListener("dragover", onOver, true);
    document.removeEventListener("drop", onDropAny, true);
    document.removeEventListener("dragend", onEnd, true);
    if (cur === d) cur = null;
  }
  // บินสำเนาจากท่าปัจจุบันไปทับการ์ดจริง แล้วเผยการ์ด
  function flyTo(d, el) {
    stop(d);
    if (!el || !el.isConnected) { d.g.remove(); if (d.home) d.home.style.visibility = ""; return; }
    var r = el.getBoundingClientRect(), p = pos(d);
    el.style.visibility = "hidden";
    /* ปรับสำเนาให้กว้าง/สูงเท่าการ์ดปลายทางก่อนบิน (คงจุดกลางเดิม) — คอลัมน์กว้างไม่เท่ากัน ชื่อตัดบรรทัดคนละแบบ
       ถ้าบินไปขนาดเดิม ถึงที่แล้วตัวหนังสือกระโดด (ผู้ใช้: "ทำไมตัวหนังสือมันขยับ") */
    var cx = p.x + d.w / 2, cy = p.y + d.h / 2;
    d.w = r.width; d.h = r.height;
    d.g.style.width = d.w + "px"; d.g.style.height = d.h + "px";
    p = { x: cx - d.w / 2, y: cy - d.h / 2 };
    var kf = [
      { transform: tf(p.x, p.y, d.s, d.rot), boxShadow: "0 26px 50px -12px rgba(8,20,14,.5)" },
      { transform: tf(r.left, r.top, 1.025, 0), boxShadow: "0 10px 24px -8px rgba(8,20,14,.35)", offset: .72 },
      { transform: tf(r.left, r.top, 1, 0), boxShadow: "0 1px 3px rgba(8,20,14,.12)" }
    ], opt = { duration: 420, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" };
    /* ย้ายคอลัมน์แล้วสี/ป้ายของการ์ดเปลี่ยนตามขั้น — สำเนาการ์ดหน้าตาใหม่ซ้อนบินไปด้วยกัน ค่อย ๆ จางขึ้นทับระหว่างบิน
       (ผู้ใช้: "มาดีละ แต่จะไม่มีตอนเปลี่ยนสี" — เดิมบินเป็นสีเก่าแล้วเปลี่ยนพรวดตอนถึง) */
    var n2 = null;
    if (el !== d.home) {
      n2 = el.cloneNode(true);
      n2.removeAttribute("data-lid"); n2.removeAttribute("data-jid");
      n2.style.cssText = d.g.style.cssText;
      n2.style.visibility = "";
      var rail = el.style.getPropertyValue("--rail");   // cssText ข้างบนทับสีขั้นของการ์ดใหม่ไปด้วย ใส่คืน
      if (rail) n2.style.setProperty("--rail", rail); else n2.style.removeProperty("--rail");
      document.body.appendChild(n2);
      n2.animate(kf, opt);
      n2.animate([{ opacity: 0 }, { opacity: 0, offset: .15 }, { opacity: 1, offset: .8 }, { opacity: 1 }], { duration: 420, fill: "forwards" });
    }
    var a = d.g.animate(kf, opt);
    a.onfinish = a.oncancel = function () { el.style.visibility = ""; d.g.remove(); if (n2) n2.remove(); };
  }
  function find(d) { return document.querySelector(d.sel); }
  // วางลงคอลัมน์ — รอการ์ดย้ายไปที่ใหม่ (ข้อมูลอัปเดต → React วาดใหม่) สูงสุด ~20 เฟรม ไม่ย้าย = กลับที่เดิม
  function land(d) {
    var n = 0, h = d.home && d.home.getBoundingClientRect();
    (function wait() {
      var el = find(d);
      var moved = el && (el !== d.home || !h || Math.abs(el.getBoundingClientRect().left - h.left) > 4 || Math.abs(el.getBoundingClientRect().top - h.top) > 4);
      if (moved || ++n > 20) { flyTo(d, el); return; }
      requestAnimationFrame(wait);
    })();
  }
  function onDropAny() {
    var d = cur;
    if (!d) return;
    setTimeout(function () { if (cur === d && !d.claimed) flyTo(d, find(d)); }, 0);   // วางตรงที่ไม่มีใครรับ
  }
  function onEnd() {
    var d = cur;
    if (d && !d.claimed) setTimeout(function () { if (cur === d && !d.claimed) flyTo(d, find(d)); }, 0);
  }

  window.pgDragLift = function (e, el, sel) {
    if (cur) { var old = cur; stop(old); old.g.remove(); }   // ลากใหม่ทั้งที่ของเก่ายังไม่จบ เก็บของเก่าทิ้ง
    if (!el || !e.dataTransfer || !e.dataTransfer.setDragImage || still()) return false;
    var r = el.getBoundingClientRect();
    e.dataTransfer.setDragImage(NONE, 0, 0);
    var g = el.cloneNode(true);
    g.removeAttribute("data-drag");
    g.removeAttribute("data-lid"); g.removeAttribute("data-jid");
    Object.assign(g.style, { position: "fixed", left: "0", top: "0", margin: "0", width: r.width + "px", height: r.height + "px", boxSizing: "border-box",
      zIndex: "300", pointerEvents: "none", transition: "none", animation: "none", transformOrigin: "50% 50%", willChange: "transform",
      boxShadow: "0 26px 50px -12px rgba(8,20,14,.5), 0 6px 14px -6px rgba(8,20,14,.25)" });
    var d = cur = { g: g, w: r.width, h: r.height, gx: e.clientX - r.left, gy: e.clientY - r.top, mx: e.clientX, my: e.clientY,
      s: 1, vs: 0, rot: 0, vr: 0, vx: 0, lx: e.clientX, sel: sel, home: el };
    draw(d);
    document.body.appendChild(g);
    document.addEventListener("dragover", onOver, true);
    document.addEventListener("drop", onDropAny, true);
    document.addEventListener("dragend", onEnd, true);
    d.raf = requestAnimationFrame(tick);
    return true;
  };
  // คอลัมน์รับการ์ดแล้ว (doDrop) — บินลงที่ใหม่เมื่อการ์ดไปโผล่
  window.pgDragDrop = function () { var d = cur; if (!d) return; d.claimed = true; land(d); };
  /* ถังขยะรับ — สำเนาที่ลอยอยู่บินโค้งเข้าปากถัง (rect = ปุ่มถัง) เสร็จแล้วเรียก cb · ไม่มีสำเนาลอย = false */
  window.pgDragTrash = function (t, cb) {
    var d = cur;
    if (!d || !t) return false;
    d.claimed = true;
    stop(d);
    var p = pos(d), ex = t.left + t.width / 2 - d.w / 2, ey = t.top + t.height / 2 - d.h / 2;
    var a = d.g.animate([
      { transform: tf(p.x, p.y, d.s, d.rot), opacity: 1 },
      { transform: tf(p.x + (ex - p.x) * .45, p.y + (ey - p.y) * .45 - 46, d.s * .6, -6), opacity: 1, offset: .5 },
      { transform: tf(ex, ey, .06, -12), opacity: .35 }
    ], { duration: 600, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" });
    a.onfinish = function () { d.g.remove(); cb(); };
    return true;
  };
})();
