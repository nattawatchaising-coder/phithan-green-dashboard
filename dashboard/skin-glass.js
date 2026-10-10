/* ================================================================
   ธีมกระจก (ทดลอง) — หน้าตาภายในเว็บแบบเดียวกับหน้าเข้าสู่ระบบ
   ภาพถ่ายหน้าล็อกอินเป็นพื้นหลังทั้งแอป · แถบเมนู/หัวจอ/การ์ดเป็นกระจกฝ้า

   ไม่แตะธีมเดิม: ทุกกฎอยู่ใต้ html[data-skin="glass"] และเปลี่ยนแค่ค่าตัวแปร (token) + ชั้นกระจก
   ปิดอยู่เป็นค่าเริ่ม — เปิด/ปิดได้ 2 ทาง (จำค่าใน localStorage "pg-skin" ของเครื่องนั้น)
     - ต่อท้าย URL ?skin=glass (เปิด) · ?skin=off (ปิด)
     - localhost มีปุ่มลอยมุมขวาล่าง
   ห้ามเอาคลาส lg-* ของหน้าล็อกอินมาใช้ (DESIGN.md) — ชุดนี้ใช้ตัวแปร --sk-* ของตัวเอง
   ================================================================ */
(function () {
  var KEY = "pg-skin";
  var root = document.documentElement;
  try {
    var q = new URLSearchParams(location.search).get("skin");
    if (q === "glass") localStorage.setItem(KEY, "glass");
    else if (q === "off") localStorage.removeItem(KEY);
  } catch (e) {}
  var on = false;
  try { on = localStorage.getItem(KEY) === "glass"; } catch (e) {}
  if (on) root.setAttribute("data-skin", "glass");

  var G = 'html[data-skin="glass"]';
  var L = G + ':not([data-theme="aurora"])';   // ชุดสว่าง — ต้องไม่ทับตัวแปรของโหมดกราไฟต์
  var D = G + '[data-theme="aurora"]';
  var CSS = [
    /* ── ตัวแปร: แผ่นกลายเป็นกระจกขาวใส เงาเป็นแสงสะท้อนขอบบน + เงาฟุ้งอุ่นแบบการ์ดล็อกอิน ── */
    L + "{--sk-glass-a:rgba(255,255,255,.62);--sk-glass-b:rgba(255,255,255,.34);--sk-edge:rgba(255,255,255,.9);--sk-edge-lo:rgba(255,255,255,.18);",
    "--sk-wash:linear-gradient(180deg,rgba(236,241,240,.30),rgba(236,241,240,.50));--sk-blur:blur(22px) saturate(1.6);",
    "--bg:#EEF2F1;--surface:rgba(255,255,255,.58);--surface2:rgba(255,255,255,.46);--surface3:rgba(255,255,255,.72);",
    "--border:rgba(255,255,255,.55);--divider:rgba(15,43,51,.08);--r-card:26px;",
    "--shadow-card:inset 0 1px 0 var(--sk-edge),0 0 0 1px rgba(255,255,255,.5),0 2px 6px rgba(50,35,20,.05),0 26px 60px -24px rgba(50,35,20,.28);",
    "--shadow-sm:inset 0 1px 0 rgba(255,255,255,.85),0 0 0 1px rgba(255,255,255,.5),0 6px 18px -10px rgba(50,35,20,.22);",
    "--shadow-inset:inset 0 0 0 1px rgba(255,255,255,.75),inset 0 1px 2px rgba(15,43,51,.06);",
    "--hov-sh:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 1px rgba(255,255,255,.6),0 14px 30px -12px rgba(50,35,20,.3);",
    "--hov-sh-lg:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 1px rgba(255,255,255,.6),0 30px 60px -22px rgba(50,35,20,.34)}",

    /* ชุดกราไฟต์ — กระจกควันบนภาพที่ทาสีพลบค่ำทับ (เหมือนหน้าล็อกอินโหมดมืด) */
    D + "{--sk-glass-a:rgba(30,34,46,.62);--sk-glass-b:rgba(20,22,32,.40);--sk-edge:rgba(255,255,255,.22);--sk-edge-lo:rgba(255,255,255,.04);",
    "--sk-wash:linear-gradient(180deg,rgba(10,14,30,.72) 0%,rgba(40,24,40,.58) 55%,rgba(8,10,16,.80) 100%);--sk-blur:blur(22px) saturate(1.4);",
    "--surface:rgba(28,31,40,.62);--surface2:rgba(255,255,255,.07);--surface3:rgba(255,255,255,.12);--r-card:26px;",
    "--shadow-card:inset 0 1px 0 var(--sk-edge),0 26px 60px -24px rgba(0,0,0,.6);",
    "--shadow-sm:inset 0 1px 0 rgba(255,255,255,.10),0 6px 18px -10px rgba(0,0,0,.6)}",

    /* ── พื้นหลัง: ภาพถ่ายหน้าล็อกอินเต็มจอ เบลอนิดเดียว + ผ้าคลุมจาง ── */
    G + " body{background:#C9D3D6}",
    G + " .app-root{position:relative;isolation:isolate}",
    G + " .app-root::before{content:'';position:fixed;inset:-40px;z-index:-2;pointer-events:none;",
    "background:url('dashboard/assets/login-crew.jpg?v=2') 65% center/cover;filter:blur(6px)}",
    G + " .app-root::after{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:var(--sk-wash)}",

    /* ── แผ่นกระจก: แถบเมนู · หัวจอ · แผง · การ์ดใหญ่ทุกใบ (inline style ที่ใช้ --shadow-card) ── */
    G + " .sidebar," + G + " .app-header{background:linear-gradient(140deg,var(--sk-glass-a),var(--sk-glass-b));",
    "-webkit-backdrop-filter:var(--sk-blur);backdrop-filter:var(--sk-blur);border-color:transparent}",
    G + " .sidebar{box-shadow:inset -1px 0 0 var(--sk-edge-lo)}",
    G + " .app-header{box-shadow:inset 0 -1px 0 var(--sk-edge-lo)}",
    G + " .pnl," + G + " [style*='var(--shadow-card)']{background:linear-gradient(140deg,var(--sk-glass-a),var(--sk-glass-b));",
    "-webkit-backdrop-filter:var(--sk-blur);backdrop-filter:var(--sk-blur);border-color:transparent}",
    /* ขอบสะท้อนแสงไล่สี — ใส่เฉพาะคลาสที่รู้ตำแหน่ง (.pnl) ไม่ใส่การ์ด inline ที่อาจมี ::before ของตัวเอง */
    G + " .pnl{position:relative;isolation:isolate}",
    G + " .pnl::after{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:-1;",
    "background:linear-gradient(135deg,var(--sk-edge),var(--sk-edge-lo) 38%,var(--sk-edge-lo) 62%,var(--sk-edge));",
    "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;",
    "mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}",

    /* เมนูที่เลือก: แคปซูลกระจกขาวแทนพื้นเขียวจาง · ขีดเขียวซ้ายคงไว้ */
    L + " .nav-item:hover{background:rgba(255,255,255,.45)}",
    L + " .nav-item.active{background:rgba(255,255,255,.75);box-shadow:inset 0 1px 0 #fff,0 6px 16px -8px rgba(50,35,20,.25)}",

    /* รางบอร์ดงาน: ร่องกระจกขุ่น แทนพื้นเทาทึบ */
    L + " .bd-col{background:rgba(255,255,255,.22);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}",
    L + " .bd-card{background-color:rgba(255,255,255,.78)}",

    /* โมดัล/ลิ้นชัก: กระจกทึบขึ้น อ่านง่ายบนพื้นมืดของฉากหลังโมดัล */
    L + " [style*='var(--shadow-modal)']," + L + " [style*='var(--shadow-sheet)']{--surface:rgba(250,252,252,.86)}",
    D + " [style*='var(--shadow-modal)']," + D + " [style*='var(--shadow-sheet)']{--surface:rgba(28,31,40,.9)}",
    G + " [style*='var(--shadow-modal)']," + G + " [style*='var(--shadow-sheet)']{-webkit-backdrop-filter:blur(30px) saturate(1.5);backdrop-filter:blur(30px) saturate(1.5)}",

    /* พิมพ์เอกสาร: ไม่มีภาพพื้นหลัง */
    "@media print{" + G + " .app-root::before," + G + " .app-root::after{display:none}}",

    /* ปุ่มเปิด/ปิด (localhost) */
    ".sk-toggle{position:fixed;right:12px;bottom:10px;z-index:2147483646;border:none;cursor:pointer;font:600 12px/1.4 system-ui,sans-serif;",
    "padding:6px 13px;border-radius:999px;color:#1B2220;background:rgba(255,255,255,.75);",
    "-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.8),0 4px 14px rgba(0,0,0,.18)}",
    ".sk-toggle[data-on='1']{background:#1B9B75;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.2)}",
  ].join("");

  var st = document.createElement("style");
  st.id = "skin-glass-css";
  st.textContent = CSS;
  (document.head || root).appendChild(st);

  var h = location.hostname;
  if (!(h === "localhost" || h === "127.0.0.1")) return;
  var addBtn = function () {
    var b = document.createElement("button");
    b.className = "sk-toggle";
    b.setAttribute("data-on", on ? "1" : "0");
    b.textContent = on ? "ธีมกระจก (ทดลอง) · เปิด" : "ธีมกระจก (ทดลอง) · ปิด";
    b.title = "สลับหน้าตาแบบหน้าเข้าสู่ระบบ — จำค่าเฉพาะเครื่องนี้";
    b.onclick = function () {
      on = !on;
      try { on ? localStorage.setItem(KEY, "glass") : localStorage.removeItem(KEY); } catch (e) {}
      on ? root.setAttribute("data-skin", "glass") : root.removeAttribute("data-skin");
      b.setAttribute("data-on", on ? "1" : "0");
      b.textContent = on ? "ธีมกระจก (ทดลอง) · เปิด" : "ธีมกระจก (ทดลอง) · ปิด";
    };
    document.body.appendChild(b);
  };
  if (document.body) addBtn();
  else document.addEventListener("DOMContentLoaded", addBtn);
})();
