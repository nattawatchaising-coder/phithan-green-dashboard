/* pg-motion.js — เปิด/ปิดใบลูกค้าฝ่ายขาย (LeadDrawer) แบบ "การ์ดขยายเป็นใบ แล้วหดกลับเป็นการ์ด"
   (ผู้ใช้: เวลาเปิดงานยังดูธรรมดาไป + ส่งวิดีโอต้นแบบ การ์ดเล็กขยายในที่ เนื้อใหม่จางขึ้นแบบเบลอ ปิดแล้วหดกลับ ต.ค. 2026)
   - จดการ์ด .bd-card ที่เพิ่งกด (capture) → ลิ้นชักที่เพิ่งเปิดเรียก pgZoomFromCard(แผ่นใบ)
     ใช้ตัวใบจริงตั้งแต่เฟรมแรก: ย่อทั้งใบให้กว้างเท่าการ์ด วางทับการ์ด ตัดส่วนเกินด้วย clip-path แล้วขยาย/เลื่อนเข้าที่พร้อมกัน
     (รอบแรกเป็นสำเนาการ์ดยืดเปล่า ๆ แล้วจางเป็นใบ — ผู้ใช้: "smooth แล้วแต่การแสดงมันแปลกๆ" กลางทางเป็นแผ่นว่าง)
   - ปิดด้วยปุ่ม × / Esc / คลิกพื้นหลัง เรียก pgZoomToCard(แผ่นใบ) ก่อน onClose: สำเนาใบ (ตัวจริงถูกถอดทันที) หดกลับเข้าการ์ดเดิมท่าเดียวกันแบบย้อน
   - ใบงานติดตั้ง (DetailDrawer ลิ้นชักขวา) ไม่ใช้ — ผู้ใช้บอกเลื่อนเข้าจากด้านข้างดีกว่า
   - ไม่ได้เปิดจากการ์ด (ปฏิทิน/ค้นหา) หรือการ์ดหายไปแล้ว = คืน false ใช้ท่าเข้า/ออกปกติของลิ้นชักนั้น
   - ปุ่มอื่นที่อยากให้ใบขยายออกมาจากตัวมัน ใส่ data-zoom (แถวใบเสนอราคาในใบลูกค้า → QuoteEditor · ผู้ใช้: "หน้าภายใน กดไปมันก็เด้งขึ้นมาปกติ")
     ใบซ้อนใบได้ (ใบลูกค้าเปิดอยู่ แล้วเปิดใบเสนอราคาทับ) — จึงจำการ์ดต้นทางไว้ที่ตัวใบแต่ละใบ (el._pgz) ไม่ใช่ตัวแปรเดียวรวม */
(function () {
  var from = null;
  document.addEventListener("click", function (e) {
    var c = e.target && e.target.closest && e.target.closest(".bd-card, [data-zoom]");
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
     เดินเส้นตรง เริ่มจาง แล้วชัดขึ้นระหว่างขยาย (เดิมเบลอด้วย — ตัดออกเพราะกระตุก ดู OPEN_DUR) */
  /* SH = clip ขยายเลยขอบใบออกไปทีละนิดจนพ้นเงา — clip-path ตัดเงาใบทิ้ง ถ้าค้างกรอบพอดีใบ จบท่าแล้วเงาโผล่พรวด
     (ผู้ใช้: "ขอบเงากระดาษนี้แหละ ที่ทำให้รู้สึกอยู่ ๆ ก็มีขึ้นมา") */
  var SH = 90;
  /* ไม่เบลอระหว่างบินแล้ว (ผู้ใช้: "รู้สึกกระตุกเวลากดเปิด" 29 ต.ค. 2026) — filter: blur บนใบเต็มขนาดต้องวาดใหม่ทุกเฟรม
     วัดจริงจอ 120Hz: เบลอ 10px เฟรมละ ~16 ms (~60fps กระตุก) · ไม่เบลอ ~8.6 ms ลื่นเต็มจอ · ลดเหลือ 4px ก็ยังช้าเท่าเดิม จึงตัดทิ้งทั้งหมด เหลือจางขึ้นแทน */
  var OPEN_DUR = 560, CLOSE_DUR = 500;
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
        opacity: Math.min(1, .15 + p * 1.4).toFixed(2) });
    }
    return fr;
  }

  // z = el._pgz = { card: ต้นทาง, watch } — ซ่อนต้นทางไว้จนใบนั้นปิด
  function unhide(el) { var z = el && el._pgz; if (!z) return; el._pgz = null; clearInterval(z.watch); z.card.style.visibility = ""; }

  window.pgZoomFromCard = function (el) {
    var ok = fresh(), o = from;
    from = null;
    if (!el || !ok) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    unhide(el);   // ใบเดิมเปลี่ยนไปแสดงลูกค้าอีกราย — คืนการ์ดรายก่อน
    el.style.animation = "none";   // แทนท่าเข้าเดิม (.pg-sheet-in)
    /* ซ่อนการ์ดไว้ตลอดที่ใบเปิด — ใบมาจากการ์ดนั้น ที่เดิมว่างไว้ ปิดแล้วใบหดกลับไปเติมที่ (ผู้ใช้: "เปิดมาแล้วให้หายไปก่อน ปิดค่อยกลับไปที่เดิม")
       ปิดทางอื่นที่ไม่เรียก pgZoomToCard (ย้ายลงถัง ฯลฯ) = เฝ้าดูใบถูกถอดจากหน้า แล้วคืนการ์ด */
    o.el.style.visibility = "hidden";
    el._pgz = { card: o.el, watch: setInterval(function () { if (!el.isConnected) unhide(el); }, 250) };
    el.animate(flight(el, r, o.r, easeOut, 36), { duration: OPEN_DUR });
    return true;
  };

  window.pgZoomToCard = function (el) {
    var z = el && el._pgz, card = z && z.card;
    if (!card || !card.isConnected || still()) { unhide(el); return false; }
    var c = card.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (!c.width || !r.width || c.bottom < 0 || c.top > innerHeight) { unhide(el); return false; }
    clearInterval(z.watch); el._pgz = null;   // การ์ดยังซ่อนอยู่ ท่าปิดเผยเองตอนใบถึงที่
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
   - หยิบ: สำเนาย่อจากเต็มใบลงเหลือ 72% รอบจุดที่จับ (จุดที่จับอยู่ใต้เมาส์ตลอด) ด้วยสปริงนุ่ม ๆ + เงาค่อย ๆ ลอยขึ้น
   - ลาก: ตามเมาส์แบบหน่วงนิด ๆ ให้ลื่น · เอียงตามความเร็วแนวนอน (สปริง) ปล่อยมือนิ่งก็ตั้งตรงเอง
   - คอลัมน์ที่จัดลำดับได้ (data-reorder · ช่วงขาย): การ์ดที่อยู่ใต้ตำแหน่งเมาส์ขยับลงหลบให้ที่ ช่องเดิมของตัวที่ลากปิดเข้าหากัน
     (ผู้ใช้: "เลื่อนจัดลำดับงานเองได้ไหม ทำอนิเมชั่นขยับแย่งที่ด้วย") — pgDragIndex บอกลำดับที่จะแทรก ให้ views-flow.jsx บันทึก
   - วางลงคอลัมน์: รอข้อมูลอัปเดต (MutationObserver จับตอน React ย้ายการ์ด ก่อนวาดจอ) การ์ดอื่นเลื่อนจากที่หลบไว้เข้าที่ใหม่ (FLIP)
     สำเนาบินลงทับการ์ดที่ไปโผล่ + การ์ดหน้าตาใหม่ (สีขั้นใหม่) จางขึ้นทับระหว่างบิน · ย้ายไม่ได้/ยกเลิก/รอยืนยัน = บินกลับที่เดิม
   - วางลงถังขยะ: pgDragTrash ให้ dropTrash ใน views-flow.jsx บินสำเนาที่ลอยอยู่เข้าถังต่อเลย
   ใช้กับการ์ดที่มี data-lid (ลูกค้า) / data-jid (งาน) — views-flow.jsx startDrag เรียก pgDragLift */
(function () {
  var NONE = new Image();
  NONE.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  var EASE = "cubic-bezier(.22,1,.36,1)";
  var cur = null;
  function still() { return !document.body.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  // ตำแหน่งมุมซ้ายบน (ก่อน scale รอบจุดกลาง) ที่ทำให้จุดที่จับ (gx,gy) อยู่ใต้เมาส์ (ตำแหน่งหน่วง px,py)
  function pos(d) { return { x: d.px - d.w / 2 - d.s * (d.gx - d.w / 2), y: d.py - d.h / 2 - d.s * (d.gy - d.h / 2) }; }
  function tf(x, y, s, r) { return "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(4) + ") rotate(" + r.toFixed(2) + "deg)"; }
  function draw(d) { var p = pos(d); d.g.style.transform = tf(p.x, p.y, d.s, d.rot); }
  function tick(now) {
    var d = cur;
    if (!d || d.done) return;
    edge(d, now);
    d.px += (d.mx - d.px) * .45; d.py += (d.my - d.py) * .45;
    // ความเร็วแนวนอนแบบหน่วง → มุมเอียงเป้า · สเกลสปริงนุ่มเข้า .72
    d.vx = d.vx * .8 + (d.px - d.lx) * .2; d.lx = d.px;
    var rt = Math.max(-9, Math.min(9, d.vx * .9));
    d.vr += (rt - d.rot) * .12; d.vr *= .74; d.rot += d.vr;
    d.vs += (.72 - d.s) * .11; d.vs *= .76; d.s += d.vs;
    draw(d);
    d.raf = requestAnimationFrame(tick);
  }
  /* เลื่อนคอลัมน์เองเมื่อลากเข้าใกล้ขอบบน/ล่าง — ความเร็วค่อย ๆ เร่ง/ผ่อน ตามระยะเข้าขอบ
     (ผู้ใช้: "ตอนที่จะเลื่อนไปล่างสุด ... มันเลื่อนเร็วไป แล้วไม่มีความ smooth" — เดิมพึ่งการเลื่อนอัตโนมัติของเบราว์เซอร์ กระโดดเร็ว) */
  function edge(d, now) {
    var dt = d.lt ? Math.min(.032, (now - d.lt) / 1000) : 0, want = 0, bd = d.sc && d.sc.isConnected ? d.sc : null;
    d.lt = now;
    if (bd) {
      var r = bd.getBoundingClientRect(), z = Math.min(90, r.height / 4);
      if (d.mx >= r.left && d.mx <= r.right) {
        if (d.my < r.top + z) want = -Math.pow(Math.min(1, (r.top + z - d.my) / z), 2);
        else if (d.my > r.bottom - z) want = Math.pow(Math.min(1, (d.my - r.bottom + z) / z), 2);
      }
    }
    d.as += (want * 560 - d.as) * Math.min(1, dt * 5);   // px/วินาที
    if (!bd || Math.abs(d.as) < 3) { d.acc = 0; return; }
    d.acc += d.as * dt;
    var step = d.acc < 0 ? Math.ceil(d.acc) : Math.floor(d.acc);
    if (!step) return;
    d.acc -= step;
    var before = bd.scrollTop;
    bd.scrollTop = before + step;
    if (bd.scrollTop !== before && d.col) room(d, d.col, d.my);
  }

  /* ── หลบให้ที่ ── ตำแหน่งการ์ดคิดจาก offsetTop (ไม่รวม transform ที่เราขยับเอง กันวนแกว่ง) — .bd เป็น position:relative */
  function cardsIn(col) { return col ? [].slice.call(col.querySelectorAll(".bd > .bd-card")) : []; }
  /* การ์ดหลบให้ที่ขยับด้วยสปริง (rAF) ไม่ใช่ CSS transition — ช่องว่างย้ายกลางทางแล้ววิ่งต่อจากความเร็วเดิม ไม่สะดุดเริ่มใหม่
     (ผู้ใช้: "ตอนที่มันเลื่อนแยกที่วางให้ทำให้มัน smooth มากกว่านี้หน่อย") · K/C เกือบหน่วงพอดี ไม่เด้งเกิน */
  var SP = new Map(), spRaf = 0, spLast = 0, K = 150, C = 24;
  function spTick(now) {
    var dt = Math.min(.032, (now - spLast) / 1000), live = 0;
    spLast = now;
    SP.forEach(function (st, c) {
      if (!c.isConnected) { SP.delete(c); return; }
      if (st.rest) return;
      for (var i = 0; i < 2; i++) { var a = -K * (st.y - st.t) - C * st.v; st.v += a * dt / 2; st.y += st.v * dt / 2; }
      if (Math.abs(st.y - st.t) < .3 && Math.abs(st.v) < 4) {
        st.y = st.t; st.v = 0; st.rest = true;
        if (!st.t) { SP.delete(c); c.style.transform = ""; c.style.transition = ""; return; }
      } else live++;
      c.style.transform = "translateY(" + st.y.toFixed(2) + "px)";
    });
    spRaf = live ? requestAnimationFrame(spTick) : 0;
  }
  function slide(c, y, from) {
    var st = SP.get(c);
    if (!st) { st = { y: 0, v: 0 }; SP.set(c, st); }
    if (from != null) { st.y = from; st.v = 0; }
    if (st.t === y && st.rest && from == null) return;
    st.t = y; st.rest = false;
    c.style.transition = "none";
    if (!spRaf) { spLast = performance.now(); spRaf = requestAnimationFrame(spTick); }
  }
  function unslide(cards) { cards.forEach(function (c) { if (SP.has(c)) slide(c, 0); }); }
  function room(d, col, y) {
    if (d.col !== col) {
      if (d.col) unslide(cardsIn(d.col));
      d.col = col; d.idx = null;
      if (d.home) d.home.style.opacity = "";
    }
    if (!col) return;
    var bd = col.querySelector(".bd"), all = cardsIn(col), own = all.indexOf(d.home) >= 0;
    var others = all.filter(function (c) { return c !== d.home; });
    var leads = others.filter(function (c) { return c.hasAttribute("data-lid"); });
    var top = bd.getBoundingClientRect().top - bd.scrollTop, idx = 0;
    leads.forEach(function (c) { if (top + c.offsetTop + c.offsetHeight / 2 < y) idx++; });
    if (idx === d.idx) return;
    d.idx = idx;
    var H = d.h0 + (parseFloat(getComputedStyle(bd).rowGap) || 10);
    var vi = idx < leads.length ? others.indexOf(leads[idx]) : (leads.length ? others.indexOf(leads[leads.length - 1]) + 1 : 0);
    var hi = all.indexOf(d.home);
    d.vi = vi;
    if (own) d.home.style.opacity = "0";   // ช่องเดิมว่าง — ตัวที่ลอยอยู่คือตัวมัน
    others.forEach(function (c, i) {
      slide(c, (own && all.indexOf(c) > hi ? -H : 0) + (i >= vi ? H : 0));
    });
  }
  /* ข้ามเข้าธาตุใหม่ (dragenter) ที่ไม่มีใครรับ เบราว์เซอร์ตั้งเป็น "วางไม่ได้" ทันที จนกว่า dragover รอบถัดไป (~50ms) จะมาถึง
     — กากบาทแดงแว้บทุกครั้งที่เมาส์ข้ามขอบการ์ด/หัวคอลัมน์ (ผู้ใช้: "เวลาลากการ์ดยังมีกระพริบห้ามแดง ๆ อยู่") จึงรับ dragenter ไว้ด้วย */
  function onEnter(e) {
    var d = cur;
    if (!d || d.done) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }
  function onOver(e) {
    var d = cur;
    if (!d || d.done) return;
    /* ทั้งหน้ารับการลากไว้ก่อน — ไม่งั้นเมาส์ข้ามหัวคอลัมน์/ช่องว่างแล้วเคอร์เซอร์ห้ามวาง (กากบาทแดง) ติด/ดับรัว ๆ
       วางผิดที่ = ไม่มีใครรับ บินกลับที่เดิม (onDropAny) · คอลัมน์/ถังที่รับไม่ได้เช็กเองใน onDrop (views-flow.jsx) */
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (!(e.clientX || e.clientY)) return;
    d.mx = e.clientX; d.my = e.clientY;
    var sc = e.target && e.target.closest ? e.target.closest(".bd-col") : null;
    d.sc = sc ? sc.querySelector(".bd") : null;
    var col = e.target && e.target.closest ? e.target.closest('.bd-col[data-reorder="1"]') : null;
    room(d, col, e.clientY);
  }
  function stop(d) {
    d.done = true;
    cancelAnimationFrame(d.raf);
    document.removeEventListener("dragover", onOver, true);
    document.removeEventListener("dragenter", onEnter, true);
    document.removeEventListener("drop", onDropAny, true);
    document.removeEventListener("dragend", onEnd, true);
    document.removeEventListener("mousemove", onLost, true);
    document.removeEventListener("pointerdown", onLost, true);
    if (cur === d) cur = null;
  }
  function settleBack(d) {   // ไม่มีอะไรย้าย — การ์ดที่หลบไว้กลับที่เดิม ช่องเดิมกลับมา
    if (d.col) unslide(cardsIn(d.col));
    if (d.home) d.home.style.opacity = "";
  }
  /* ── บินลง ── เดิน rAF เอง เล็งเป้าใหม่ทุกเฟรม (ไม่ใช่ WAAPI เป้าตายตัว)
     วางลงคอลัมน์จัดลำดับ = ออกบินทันทีไปที่ช่องว่างที่การ์ดอื่นหลบไว้ ไม่ต้องรอข้อมูลอัปเดต พอ React ย้ายการ์ดจริงแล้วค่อยเล็งการ์ดนั้นแทน
     (ผู้ใช้: "เวลาพึ่งวางไปแล้วเริ่มเลื่อน มันทำให้แสดงผลใบงานนั้นค้างแล้วกระตุก")
     · ลำดับไม่เปลี่ยน/ยกเลิก = เปลี่ยนเป้ากลางทางกลับที่เดิม บินรอบเดียว (เดิมบินกลับแล้วตัวรอข้อมูลบินซ้ำอีกรอบ — "เด้งสองรอบ") */
  var FLY = 540, fl = null, watch = null;
  function ease(t) { return 1 - Math.pow(1 - t, 4); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function find(d) { return document.querySelector(d.sel); }
  function rectOf(el) { var r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; }
  // ช่องว่างในคอลัมน์ที่วาง — คิดจากเป้าของสปริง (ที่การ์ดกำลังจะไปอยู่) ไม่ใช่ตำแหน่งระหว่างทาง
  function hole(d) {
    var col = d.col, bd = col && col.querySelector(".bd");
    if (!bd || d.vi == null) return null;
    var br = bd.getBoundingClientRect(), cs = getComputedStyle(bd), gap = parseFloat(cs.rowGap) || 10;
    var all = cardsIn(col), others = all.filter(function (c) { return c !== d.home; }), top0 = br.top - bd.scrollTop;
    function ty(c) { var st = SP.get(c); return top0 + c.offsetTop + (st ? st.t : 0); }
    var y, ref = others[0] || (all.indexOf(d.home) >= 0 ? d.home : null);
    if (d.vi < others.length) y = ty(others[d.vi]) - (d.h0 + gap);
    else if (others.length) { var l = others[others.length - 1]; y = ty(l) + l.offsetHeight + gap; }
    else y = br.top + (parseFloat(cs.paddingTop) || 0);
    return { left: ref ? br.left + ref.offsetLeft : br.left + (parseFloat(cs.paddingLeft) || 0), top: y, width: ref ? ref.offsetWidth : d.w0, height: d.h0 };
  }
  // เป้าตอนวางลงคอลัมน์: การ์ดจริงเมื่อย้ายแล้ว · ระหว่างรอ = ช่องว่าง (คอลัมน์จัดลำดับ) หรือค้างไว้ (คอลัมน์อื่น) · รอนานเกิน = กลับที่เดิม
  function aimDrop(d, ms) {
    var el = find(d), h = d.f.h;
    if (el) {
      var r = rectOf(el);
      var moved = el !== d.home || !h || Math.abs(r.left - h.left) > 4 || Math.abs(r.top - h.top) > 4;
      if (moved && (!d.col || el.closest(".bd-col") === d.col)) return { el: el, r: r, k: "el" };
    }
    var lim = d.col ? 900 : 400;
    if (ms < lim) return d.col ? { r: hole(d), k: "hole" } : null;
    settleBack(d);
    d.f.aim = aimHome;
    return aimHome(d);
  }
  function aimHome(d) { var el = find(d) || d.home; return el && el.isConnected ? { el: el, r: rectOf(el), k: "home" } : null; }
  function fly(d, aim) {
    stop(d);
    if (fl && fl !== d) endFly(fl);
    fl = d;
    document.addEventListener("wheel", onScrollFly, { capture: true, passive: true });
    document.addEventListener("scroll", onScrollFly, true);
    var p = pos(d);
    d.g.style.transition = "none";
    d.f = { t0: performance.now(), s0: performance.now(), x0: p.x + d.w / 2, y0: p.y + d.h / 2, sc0: d.s, r0: d.rot, k0: 1, aim: aim, el: null, n2: null, last: null,
      h: d.home && d.home.isConnected ? rectOf(d.home) : null };
    d.raf = requestAnimationFrame(flyTick);
  }
  function rebase(d, now) {   // เป้าย้ายไกล — ออกตัวใหม่จากท่าที่เห็นอยู่ ไม่กระโดด
    var f = d.f;
    f.x0 = f.cx; f.y0 = f.cy; f.sc0 = f.sc; f.r0 = f.rot; f.k0 = 1 - f.q; f.t0 = now;
  }
  function flyTick(now) {
    try { flyStep(now); } catch (err) { if (fl) endFly(fl); throw err; }   // พังกลางทาง — ไม่ทิ้งสำเนาค้างจอ
  }
  function flyStep(now) {
    var d = fl;
    if (!d) return;
    if (now - d.f.s0 > 2500) { endFly(d); return; }   // กันบินไม่จบ (เป้ากระโดดไปมา) — จบเลย ไม่ค้างจอ
    var f = d.f, a = f.aim(d, now - f.s0);
    if (!a || !a.r) {
      if (now - f.s0 > 1500) { endFly(d); return; }
      f.t0 = now;   // ยังไม่มีเป้า — ค้างท่าไว้ นับเวลาบินเมื่อมีเป้า
      d.raf = requestAnimationFrame(flyTick);
      return;
    }
    var r = a.r;
    var jump = f.last ? Math.abs(r.top - f.last.top) + Math.abs(r.left - f.last.left) : 0;
    /* ออกตัวใหม่เฉพาะตอนเปลี่ยนชนิดเป้า (ช่องว่าง → การ์ดจริง → ที่เดิม) แล้วเป้าไกล — เป้าขยับเพราะเลื่อนจอ/คอลัมน์ ให้ตามไปเฉย ๆ
       (เดิมเลื่อนลูกกลิ้งทันทีหลังวาง เป้าวิ่งทุกเฟรม ออกตัวใหม่ทุกเฟรม บินไม่จบ สำเนาค้างจอ) */
    if (f.last && ((a.k !== f.k && jump > 40) || (f.t >= 1 && !a.el && jump > 1))) rebase(d, now);
    f.last = r; f.k = a.k;
    if (a.el !== f.el) {
      if (f.el) f.el.style.visibility = "";
      f.el = a.el || null;
      if (f.el) f.el.style.visibility = "hidden";
      /* ย้ายคอลัมน์แล้วสี/ป้ายเปลี่ยนตามขั้น — สำเนาการ์ดหน้าตาใหม่ซ้อนบินไปด้วยกัน จางขึ้นทับระหว่างบิน
         (ผู้ใช้: "มาดีละ แต่จะไม่มีตอนเปลี่ยนสี") */
      if (f.el && f.el !== d.home && !f.n2) {
        var n2 = f.n2 = f.el.cloneNode(true);
        n2.setAttribute("data-pgfly", "");
        n2.removeAttribute("data-lid"); n2.removeAttribute("data-jid");
        n2.style.cssText = d.g.style.cssText;
        n2.style.visibility = "";
        var rail = f.el.style.getPropertyValue("--rail");   // cssText ข้างบนทับสีขั้นของการ์ดใหม่ไปด้วย ใส่คืน
        if (rail) n2.style.setProperty("--rail", rail); else n2.style.removeProperty("--rail");
        n2.style.opacity = "0";
        f.n0 = now;
        document.body.appendChild(n2);
      }
    }
    var t = Math.min(1, (now - f.t0) / FLY), e = ease(t), q = 1 - (1 - e) * f.k0;   // q = ความคืบหน้ารวมนับจากตอนปล่อย
    f.t = t; f.q = q;
    f.cx = mix(f.x0, r.left + r.width / 2, e); f.cy = mix(f.y0, r.top + r.height / 2, e);
    f.sc = mix(f.sc0, 1, e) + .025 * Math.sin(Math.PI * e) * f.k0; f.rot = mix(f.r0, 0, e);
    /* ปรับสำเนาให้กว้าง/สูงเท่าการ์ดปลายทาง (คงจุดกลาง) — ถ้าบินไปขนาดเดิม ถึงที่แล้วตัวหนังสือกระโดด
       (ผู้ใช้: "ทำไมตัวหนังสือมันขยับ") */
    d.w = r.width; d.h = r.height;
    var els = f.n2 ? [d.g, f.n2] : [d.g];
    var trf = tf(f.cx - d.w / 2, f.cy - d.h / 2, f.sc, f.rot);
    var sh = "0 " + mix(26, 1, q).toFixed(1) + "px " + mix(50, 3, q).toFixed(1) + "px " + mix(-12, 0, q).toFixed(1) + "px rgba(8,20,14," + mix(.5, .12, q).toFixed(3) + ")";
    els.forEach(function (g) { g.style.width = d.w + "px"; g.style.height = d.h + "px"; g.style.transform = trf; g.style.boxShadow = sh; });
    if (f.n2) f.n2.style.opacity = String(Math.max(0, Math.min(1, ((now - f.n0) / FLY - .1) / .55)));
    if (t >= 1 && a.el && (!f.n2 || now - f.n0 >= FLY * .65)) { endFly(d); return; }
    d.raf = requestAnimationFrame(flyTick);
  }
  /* ผู้ใช้เลื่อนจอ/คอลัมน์ระหว่างบินลง — เลิกบิน เผยการ์ดจริงในที่ของมัน สำเนาจางหายเร็ว ๆ
     (สำเนาลอยบน body ไม่ถูกคอลัมน์ตัดขอบ — เดิมไล่ตามการ์ดที่เลื่อนพ้นคอลัมน์ขึ้นไปทับหัวหน้า "วางปุ้บแล้วเลื่อนลูกกลิ้งเลย") */
  function onScrollFly() { var d = fl; if (d) { settleBack(d); endFly(d, true); } }   // ยังไม่ได้ข้อมูล = ช่องว่าง/ช่องเดิมคืนสภาพ ข้อมูลมาทีหลัง FLIP จัดให้
  function endFly(d, fade) {
    var f = d.f;
    cancelAnimationFrame(d.raf);
    if (fl === d) fl = null;
    if (!fl) { document.removeEventListener("wheel", onScrollFly, true); document.removeEventListener("scroll", onScrollFly, true); }
    if (f && f.el) f.el.style.visibility = "";
    var cur2 = document.querySelector(d.sel);   // FLIP อาจซ่อนโหนดใหม่หลังเฟรมสุดท้ายที่เล็ง
    if (cur2) cur2.style.visibility = "";
    var gone = [d.g].concat(f && f.n2 ? [f.n2] : []);
    if (fade && d.g.animate) {
      gone.forEach(function (n) {
        n.removeAttribute("data-pgfly");   // ไม่ให้ sweep เก็บก่อนจางเสร็จ
        var a = n.animate([{ opacity: getComputedStyle(n).opacity }, { opacity: 0 }], { duration: 150, fill: "forwards" });
        a.onfinish = a.oncancel = function () { n.remove(); };
      });
    } else gone.forEach(function (n) { n.remove(); });
    sweep();
  }
  // สำเนาที่หลงค้างบนจอ (ไม่ใช่ตัวที่กำลังลาก/บิน/บินเข้าถัง) — เก็บทิ้ง
  function sweep() {
    [].forEach.call(document.querySelectorAll("[data-pgfly]"), function (n) {
      if (n.getAttribute("data-pgfly") === "trash" || (cur && n === cur.g) || (fl && (n === fl.g || n === fl.f.n2))) return;
      n.remove();
    });
  }
  /* React ย้ายการ์ดแล้ว (ก่อนวาดจอ) — การ์ดอื่นเลื่อนจากตำแหน่งที่เห็นอยู่เข้าตำแหน่งใหม่ (FLIP) คงความเร็วสปริงเดิมไว้ ไม่หยุดแล้วออกตัวใหม่
     lay = ตำแหน่งตามเลย์เอาต์ (ไม่รวม translate ของเรา) ก่อนเปลี่ยน · ทำซ้ำได้ถ้า React วาดใหม่หลายรอบ */
  function layOf(cols, lay) {
    cols.forEach(function (col) { cardsIn(col).forEach(function (c) { var st = SP.get(c); lay.set(c, c.getBoundingClientRect().top - (st ? st.y : 0)); }); });
  }
  function flip(d, cols, lay) {
    cols.forEach(function (col) {
      var cards = cardsIn(col);
      var vis = cards.map(function (c) { var was = lay.get(c), st = SP.get(c); return was == null ? null : { y: was + (st ? st.y : 0), v: st ? st.v : 0 }; });
      cards.forEach(function (c) {
        c.style.transition = "none"; c.style.transform = ""; c.style.opacity = "";
        if (fl === d && c.matches(d.sel)) c.style.visibility = "hidden";   // ตัวที่ลาก — สำเนากำลังบินลงมาเติม
      });
      cards.forEach(function (c, i) {
        var w = vis[i];
        SP.delete(c);
        if (!w || c.matches(d.sel)) return;
        var dy = w.y - c.getBoundingClientRect().top;
        if (Math.abs(dy) < .5 && Math.abs(w.v) < 4) return;
        c.style.transform = "translateY(" + dy.toFixed(2) + "px)";
        SP.set(c, { y: dy, v: w.v, t: 0, rest: false });
      });
      cards.forEach(function (c) { if (!SP.has(c)) c.style.transition = ""; });
    });
    if (SP.size && !spRaf) { spLast = performance.now(); spRaf = requestAnimationFrame(spTick); }
  }
  function onDropAny(e) {
    var d = cur;
    if (!d) return;
    /* คิดช่องแทรกใหม่จากจุดที่ปล่อยจริง (ทำงานก่อน onDrop ของ React เพราะดักที่ document ช่วง capture)
       — dragover ครั้งล่าสุดอาจยังไม่ได้ชี้คอลัมน์นี้ (React เพิ่งใส่ data-reorder) ลำดับที่บันทึกจะได้ตรงกับที่ปล่อย */
    var col = e.target && e.target.closest ? e.target.closest('.bd-col[data-reorder="1"]') : null;
    if (col && (e.clientX || e.clientY)) room(d, col, e.clientY);
    setTimeout(function () { if (cur === d && !d.claimed) { settleBack(d); fly(d, aimHome); } }, 0);   // วางตรงที่ไม่มีใครรับ
  }
  /* ปล่อยนอกหน้าเว็บ หรือการ์ดต้นทางถูกวาดใหม่ระหว่างลาก — เบราว์เซอร์ไม่ส่ง dragend มาถึง document สำเนาเลยลอยค้าง
     ระหว่างลากจริงไม่มี mousemove · มี mousemove/กดเมาส์ = การลากจบไปแล้ว บินกลับที่เดิม */
  function onLost() {
    var d = cur;
    if (d && !d.claimed) { settleBack(d); fly(d, aimHome); }
  }
  function onEnd() {
    var d = cur;
    if (d && !d.claimed) setTimeout(function () { if (cur === d && !d.claimed) { settleBack(d); fly(d, aimHome); } }, 0);
  }

  window.pgDragLift = function (e, el, sel) {
    if (cur) { var old = cur; stop(old); old.g.remove(); settleBack(old); }   // ลากใหม่ทั้งที่ของเก่ายังไม่จบ เก็บของเก่าทิ้ง
    if (fl) endFly(fl);
    /* ลากใบใหม่ระหว่างใบก่อนยังบินลง — เลิกเฝ้า React ของรอบก่อน (ไม่งั้นมันรีเซ็ตการ์ดที่กำลังหลบให้รอบใหม่ — "เลื่อนกระทันหันตอนอนิเมชั่นยังไม่เสร็จมันบัค")
       แล้วเก็บสำเนาที่หลงค้างบนจอทิ้ง (ยกเว้นตัวที่กำลังบินเข้าถัง) */
    if (watch) { watch.disconnect(); watch = null; }
    [].forEach.call(document.querySelectorAll("[data-pgfly]"), function (n) { if (n.getAttribute("data-pgfly") !== "trash") n.remove(); });
    if (!el || !e.dataTransfer || !e.dataTransfer.setDragImage || still()) return false;
    var r = el.getBoundingClientRect();
    e.dataTransfer.setDragImage(NONE, 0, 0);
    var g = el.cloneNode(true);
    g.setAttribute("data-pgfly", "");
    g.removeAttribute("data-drag");
    g.removeAttribute("data-lid"); g.removeAttribute("data-jid");
    Object.assign(g.style, { position: "fixed", left: "0", top: "0", margin: "0", width: r.width + "px", height: r.height + "px", boxSizing: "border-box",
      zIndex: "300", pointerEvents: "none", transition: "box-shadow .4s ease", animation: "none", transformOrigin: "50% 50%", willChange: "transform",
      boxShadow: "0 2px 6px rgba(8,20,14,.15)" });
    var d = cur = { g: g, w: r.width, h: r.height, w0: r.width, h0: r.height, gx: e.clientX - r.left, gy: e.clientY - r.top,
      mx: e.clientX, my: e.clientY, px: e.clientX, py: e.clientY, as: 0, acc: 0,
      s: 1, vs: 0, rot: 0, vr: 0, vx: 0, lx: e.clientX, sel: sel, home: el, col: null, idx: null };
    draw(d);
    document.body.appendChild(g);
    requestAnimationFrame(function () { g.style.boxShadow = "0 26px 50px -12px rgba(8,20,14,.5), 0 6px 14px -6px rgba(8,20,14,.25)"; });   // เงาค่อย ๆ ลอยขึ้น
    document.addEventListener("dragover", onOver, true);
    document.addEventListener("dragenter", onEnter, true);
    document.addEventListener("drop", onDropAny, true);
    document.addEventListener("dragend", onEnd, true);
    document.addEventListener("mousemove", onLost, true);
    document.addEventListener("pointerdown", onLost, true);
    d.raf = requestAnimationFrame(tick);
    return true;
  };
  // ลำดับที่จะแทรกในคอลัมน์ที่วาง (นับเฉพาะการ์ดลูกค้า ไม่รวมตัวที่ลาก) · ไม่ได้อยู่เหนือคอลัมน์จัดลำดับ = null
  // doDrop เรียก pgDragDrop (ออกบินแล้ว cur ว่าง) ก่อนถามช่อง — ดูตัวที่กำลังบินด้วย
  window.pgDragIndex = function () { var d = cur || fl; return d && d.col ? d.idx : null; };
  // คอลัมน์รับการ์ดแล้ว (doDrop) — ออกบินทันที แล้วคอยจับตอน React ย้ายการ์ดเพื่อเลื่อนการ์ดอื่นเข้าที่
  window.pgDragDrop = function () {
    var d = cur;
    if (!d) return;
    d.claimed = true;
    var hc = d.home && d.home.closest(".bd-col"), cols = [d.col, hc].filter(function (c, i, a) { return c && a.indexOf(c) === i; });
    var lay = new Map();
    layOf(cols, lay);
    if (watch) watch.disconnect();
    var mo = watch = new MutationObserver(function () { flip(d, cols, lay); lay = new Map(); layOf(cols, lay); });
    cols.forEach(function (col) { var bd = col.querySelector(".bd"); if (bd) mo.observe(bd, { childList: true }); });
    setTimeout(function () { mo.disconnect(); if (watch === mo) watch = null; }, 1200);
    fly(d, aimDrop);
  };
  // วางที่เดิม/รอยืนยัน — ไม่มีอะไรเปลี่ยน เปลี่ยนเป้ากลับที่เดิม (บินอยู่แล้วก็แค่เล็งใหม่ ไม่บินซ้ำ)
  window.pgDragSettle = function () {
    var d = cur || fl;
    if (!d) return;
    settleBack(d);
    if (fl === d) d.f.aim = aimHome;
    else fly(d, aimHome);
  };
  /* ถังขยะรับ — สำเนาที่ลอยอยู่บินโค้งเข้าปากถัง (rect = ปุ่มถัง) เสร็จแล้วเรียก cb · ไม่มีสำเนาลอย = false */
  window.pgDragTrash = function (t, cb) {
    var d = cur;
    if (!d || !t) return false;
    d.claimed = true;
    stop(d);
    settleBack(d);
    d.g.setAttribute("data-pgfly", "trash");
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

/* ── แถบเลื่อนคอลัมน์บอร์ดเข้มเฉพาะตอนเลื่อน/ชี้ค้าง ── คลาส is-scrolling บน .bd (สีอยู่ใน index.html)
   แถบเลื่อนแนวนอนใต้บอร์ด (.fl-board) ทำแบบเดียวกัน — ชี้ค้างที่ขอบล่าง 14px แทนขอบขวา (ผู้ใช้: "ทำตัวด้านล่างนี้ด้วย")
   - เลื่อน = เข้มทันที หยุดเลื่อน 0.4 วิค่อยจาง (ผู้ใช้: "ตอนใช้ลูกกลิ้งเลื่อนแล้วปล่อยด้วยดิ" → 0.15 วิหมุนต่อ ๆ กันแล้วกระพริบ "เพิ่มนิดนึง แต่ไม่เยอะเท่าก่อน" (0.8))
   - เมาส์บนแถบเลื่อน (ขอบขวา 14px) ต้องค้าง 0.4 วิถึงเข้ม — แค่ลากผ่านไม่เข้ม · ออกจากแถบแล้วจางทันที
   ผู้ใช้: "ทำสีจางแบบเดิม เวลาเลื่อนค่อยเข้ม" · "หน่วงเวลาตอนเอาเมาส์ไปผ่าน" (ไม่ใช้ CSS :hover ของแถบ — หน่วงไม่ได้) */
(function () {
  var T = new Map(), HOLD = 400, DWELL = 400, hov = null, dw = 0;
  function isCol(el) { return el && el.classList && (el.classList.contains("fl-board") || (el.classList.contains("bd") && el.parentElement && el.parentElement.classList.contains("bd-col"))); }
  // แถบที่เมาส์ชี้อยู่ — คอลัมน์ (ขอบขวา) ก่อน ไม่โดนค่อยดูบอร์ด (ขอบล่าง)
  function bar(e) {
    if (!e.target || !e.target.closest) return null;
    var el = e.target.closest(".bd-col > .bd");
    if (el && el.scrollHeight > el.clientHeight && e.clientX >= el.getBoundingClientRect().right - 14) return el;
    el = e.target.closest(".fl-board");
    if (el && el.scrollWidth > el.clientWidth && e.clientY >= el.getBoundingClientRect().bottom - 14) return el;
    return null;
  }
  function show(el, keep) {
    if (!T.has(el)) el.classList.add("is-scrolling");
    clearTimeout(T.get(el));
    T.set(el, keep ? 0 : setTimeout(function () { el.classList.remove("is-scrolling"); T.delete(el); }, HOLD));
  }
  function hide(el) { clearTimeout(T.get(el)); T.delete(el); el.classList.remove("is-scrolling"); }
  document.addEventListener("scroll", function (e) { if (isCol(e.target)) show(e.target, e.target === hov && !dw); }, true);
  document.addEventListener("mousemove", function (e) {
    var el = bar(e);
    if (el === hov) return;
    if (hov && !dw) hide(hov);   // ออกจากแถบ — จางทันที (ผู้ใช้: "ไม่ต้องหน่วงตอนไม่ชี้")
    clearTimeout(dw); dw = 0;
    hov = el;
    if (el) dw = setTimeout(function () { dw = 0; if (hov === el) show(el, true); }, DWELL);
  }, { passive: true });
})();
/* ── ลากสลับลำดับแถวในรายการ (รายการในใบเสนอราคา) ── ท่าเดียวกับลากการ์ดบนบอร์ด: แถวลอยตามเมาส์ แถวอื่นหลบให้ที่ (สปริง)
   ลากชิดขอบบน/ล่างของกล่องที่เลื่อนได้ = เลื่อนเองแบบเร่ง/ผ่อน · ปล่อยแล้วสำเนาบินลงช่องใหม่ แถวอื่นเลื่อนเข้าที่ต่อจากท่าเดิม (FLIP)
   ใช้ pointer events ไม่ใช่ลากของเบราว์เซอร์ — แถวมีช่องกรอก/ข้อความ ลากของเบราว์เซอร์ไปลากข้อความแทน และมีเคอร์เซอร์กากบาทแดง
   วิธีใช้: แถวใส่ data-row (ลูกตรงของกล่องเดียวกัน · key ต้องคงที่ ไม่ใช่เลขลำดับ — React ต้องย้ายโหนดจริง FLIP ถึงจับได้)
   ปุ่มจับ onPointerDown={(e) => window.pgRowDrag(e, แถว, (from, to) => ย้ายในข้อมูล)} (ผู้ใช้: "ลากสลับบรรทัดในใบเสนอราคา" ต.ค. 2026) */
(function () {
  var K = 170, C = 26, d = null;
  var SP = new Map(), raf = 0, last = 0;
  function still() { return !document.body.animate || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function spTick(now) {
    var dt = Math.min(.032, (now - last) / 1000), live = 0;
    last = now;
    SP.forEach(function (st, el) {
      if (!el.isConnected) { SP.delete(el); return; }
      for (var i = 0; i < 2; i++) { var a = -K * (st.y - st.t) - C * st.v; st.v += a * dt / 2; st.y += st.v * dt / 2; }
      if (Math.abs(st.y - st.t) < .3 && Math.abs(st.v) < 4) {
        st.y = st.t; st.v = 0;
        if (!st.t) { SP.delete(el); el.style.transform = ""; return; }
      } else live++;
      el.style.transform = "translateY(" + st.y.toFixed(2) + "px)";
    });
    raf = live ? requestAnimationFrame(spTick) : 0;
  }
  function slide(el, y, from) {
    var st = SP.get(el);
    if (!st) { st = { y: 0, v: 0, t: 0 }; SP.set(el, st); }
    if (from != null) { st.y = from; st.v = 0; }
    st.t = y;
    if (still()) { st.y = y; st.v = 0; el.style.transform = y ? "translateY(" + y + "px)" : ""; if (!y) SP.delete(el); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(spTick); }
  }
  function rowsOf(list) { return [].filter.call(list.children, function (c) { return c.hasAttribute("data-row"); }); }
  // ตำแหน่งตามเลย์เอาต์ (ไม่รวม translate ที่เราขยับเอง)
  function layTop(el) { var st = SP.get(el); return el.getBoundingClientRect().top - (st ? st.y : 0); }
  function scroller(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      var oy = getComputedStyle(p).overflowY;
      if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return document.scrollingElement || document.documentElement;
  }
  function place(d) {
    var y = d.r0.top + (d.py - d.y0), s = d.s;
    d.g.style.transform = "translate(" + d.r0.left.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(4) + ")";
    d.cy = y + d.r0.height / 2;
  }
  function aim(d) {
    var to = 0;
    d.rows.forEach(function (r, i) { if (i !== d.from && layTop(r) + r.offsetHeight / 2 < d.cy) to++; });
    if (to === d.to) return;
    d.to = to;
    d.rows.forEach(function (r, i) {
      if (i === d.from) return;
      var y = 0;
      if (d.from < to && i > d.from && i <= to) y = -d.H;
      else if (to < d.from && i >= to && i < d.from) y = d.H;
      slide(r, y);
    });
  }
  function edge(d, now) {
    var dt = d.lt ? Math.min(.032, (now - d.lt) / 1000) : 0, want = 0, sc = d.sc;
    d.lt = now;
    var top = 0, bot = window.innerHeight;
    if (sc !== document.scrollingElement && sc !== document.documentElement) { var r = sc.getBoundingClientRect(); top = Math.max(0, r.top); bot = Math.min(bot, r.bottom); }
    var z = Math.min(80, (bot - top) / 4);
    if (d.py < top + z) want = -Math.pow(Math.min(1, (top + z - d.py) / z), 2);
    else if (d.py > bot - z) want = Math.pow(Math.min(1, (d.py - bot + z) / z), 2);
    d.as += (want * 620 - d.as) * Math.min(1, dt * 5);
    if (Math.abs(d.as) < 3) { d.acc = 0; return; }
    d.acc += d.as * dt;
    var step = d.acc < 0 ? Math.ceil(d.acc) : Math.floor(d.acc);
    if (!step) return;
    d.acc -= step;
    sc.scrollTop += step;   // สำเนาลอยกับจอ ไม่ต้องเลื่อนตาม — tick คิดช่องใหม่จากตำแหน่งแถวที่เลื่อนไปเอง
  }
  function tick(now) {
    if (!d || d.end) return;
    edge(d, now);
    d.vs += (1.025 - d.s) * .16; d.vs *= .72; d.s += d.vs;
    place(d);
    aim(d);
    d.raf = requestAnimationFrame(tick);
  }
  function onMove(e) {
    if (!d || e.pointerId !== d.pid) return;
    d.py = e.clientY;
    if (!d.live) {
      if (Math.abs(e.clientY - d.y0) < 4 && Math.abs(e.clientX - d.x0) < 4) return;
      lift(d);
    }
    e.preventDefault();
  }
  function lift(d) {
    d.live = true;
    var row = d.row, r = d.r0 = row.getBoundingClientRect();
    var g = d.g = row.cloneNode(true);
    // ค่าที่พิมพ์ในช่องกรอกไม่ติดมากับ cloneNode — คัดลอกให้สำเนาหน้าตาตรงกัน
    var a = row.querySelectorAll("input,textarea,select"), b = g.querySelectorAll("input,textarea,select");
    for (var i = 0; i < a.length; i++) { if (a[i].type === "checkbox" || a[i].type === "radio") b[i].checked = a[i].checked; else b[i].value = a[i].value; }
    g.removeAttribute("data-row");
    g.setAttribute("data-pgfly", "row");
    Object.assign(g.style, { position: "fixed", left: "0", top: "0", margin: "0", width: r.width + "px", height: r.height + "px", boxSizing: "border-box",
      zIndex: "300", pointerEvents: "none", transition: "box-shadow .3s ease", transformOrigin: "50% 50%", willChange: "transform" });
    document.body.appendChild(g);
    requestAnimationFrame(function () { g.style.boxShadow = "0 22px 44px -14px rgba(8,20,14,.45), 0 6px 14px -6px rgba(8,20,14,.22)"; });
    var gap = parseFloat(getComputedStyle(d.list).rowGap) || 0;
    d.H = r.height + gap;
    row.style.visibility = "hidden";   // ช่องเดิมว่าง — ตัวที่ลอยคือตัวมัน
    document.documentElement.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    place(d);
    d.raf = requestAnimationFrame(tick);
  }
  function onUp(e) {
    if (!d || (e && e.pointerId != null && e.pointerId !== d.pid)) return;
    finish(d, e && e.type === "pointerup");
  }
  function onKey(e) { if (d && e.key === "Escape") { d.to = d.from; finish(d, false); } }
  function unlisten() {
    window.removeEventListener("pointermove", onMove, true);
    window.removeEventListener("pointerup", onUp, true);
    window.removeEventListener("pointercancel", onUp, true);
    window.removeEventListener("blur", onUp);
    window.removeEventListener("keydown", onKey, true);
  }
  function finish(dd, commit) {
    unlisten();
    dd.end = true;
    cancelAnimationFrame(dd.raf);
    if (d === dd) d = null;
    document.documentElement.style.cursor = "";
    document.body.style.userSelect = "";
    if (!dd.live) return;   // แค่กดปุ่มจับ ไม่ได้ลาก
    var moved = commit && dd.to != null && dd.to !== dd.from;
    var list = dd.list, done = false;
    function settle() {   // จัดแถวเข้าที่จากท่าที่เห็นอยู่ แล้วสำเนาบินลงแถวตัวจริง
      if (done) return;
      done = true;
      mo.disconnect();
      clearTimeout(t);
      var rows = rowsOf(list);
      var vis = rows.map(function (r) { var st = SP.get(r); return { y: (seen.has(r) ? seen.get(r) : r.getBoundingClientRect().top), v: st ? st.v : 0 }; });
      rows.forEach(function (r) { SP.delete(r); r.style.transform = ""; });
      rows.forEach(function (r, i) {
        if (r === dd.row) return;
        var dy = vis[i].y - r.getBoundingClientRect().top;
        if (Math.abs(dy) < .5 && Math.abs(vis[i].v) < 4) return;
        var st = { y: dy, v: vis[i].v, t: 0 }; SP.set(r, st);
        r.style.transform = "translateY(" + dy.toFixed(2) + "px)";
      });
      if (SP.size && !raf) { last = performance.now(); raf = requestAnimationFrame(spTick); }
      fly(dd);
    }
    // ตำแหน่งที่เห็นบนจอตอนปล่อย (รวมที่หลบไว้) — React ย้ายโหนดแล้วจะเลื่อนต่อจากตรงนี้
    var seen = new Map();
    rowsOf(list).forEach(function (r) { seen.set(r, r.getBoundingClientRect().top); });
    var mo = new MutationObserver(settle);
    mo.observe(list, { childList: true });
    var t = setTimeout(settle, moved ? 400 : 0);   // ข้อมูลไม่ได้ย้าย (หรือ React ไม่ได้ย้ายโหนด) — คืนที่เดิม
    if (moved) { try { dd.cb(dd.from, dd.to); } catch (err) { settle(); throw err; } }
  }
  // สำเนาบินลงตำแหน่งแถวตัวจริง (อ่านเป้าใหม่ทุกเฟรม — เลื่อนจอระหว่างบินก็ยังลงตรง) แล้วเผยแถวจริง
  function fly(dd) {
    var g = dd.g, row = dd.row, t0 = performance.now(), D = still() ? 0 : 280;
    var m = /translate\(([-\d.]+)px,([-\d.]+)px\) scale\(([\d.]+)\)/.exec(g.style.transform) || [0, dd.r0.left, dd.r0.top, 1];
    var x0 = +m[1], y0 = +m[2], s0 = +m[3];
    g.style.boxShadow = "0 2px 6px rgba(8,20,14,.12)";
    function step(now) {
      var el = row.isConnected ? row : null;
      var p = D ? Math.min(1, (now - t0) / D) : 1, e = 1 - Math.pow(1 - p, 3);
      if (!el || p >= 1) { if (el) el.style.visibility = ""; g.remove(); return; }
      var r = el.getBoundingClientRect(), st = SP.get(el);
      var ty = r.top - (st ? st.y : 0);
      g.style.transform = "translate(" + (x0 + (r.left - x0) * e).toFixed(1) + "px," + (y0 + (ty - y0) * e).toFixed(1) + "px) scale(" + (s0 + (1 - s0) * e).toFixed(4) + ")";
      requestAnimationFrame(step);
    }
    step(performance.now());
  }
  window.pgRowDrag = function (e, row, cb) {
    if (d || !row || !row.parentElement || (e.button != null && e.button !== 0)) return;
    var list = row.parentElement, rows = rowsOf(list), from = rows.indexOf(row);
    if (from < 0 || rows.length < 2) return;
    e.preventDefault();   // ไม่เลือกข้อความ ไม่ย้ายโฟกัส
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) {}   // ลากออกนอกหน้าต่างแล้วปล่อย ยังได้ pointerup
    [].forEach.call(document.querySelectorAll('[data-pgfly="row"]'), function (n) { n.remove(); });
    d = { row: row, list: list, rows: rows, from: from, to: from, cb: cb, pid: e.pointerId, x0: e.clientX, y0: e.clientY, py: e.clientY,
      s: 1, vs: 0, as: 0, acc: 0, sc: scroller(list), live: false };
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    window.addEventListener("blur", onUp);
    window.addEventListener("keydown", onKey, true);
  };
})();
