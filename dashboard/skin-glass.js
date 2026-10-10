/* ================================================================
   ธีมกระจก — หน้าตาภายในเว็บแบบเดียวกับหน้าเข้าสู่ระบบ · **เป็นค่าเริ่มของเว็บจริงแล้ว** (ผู้ใช้เลือก ต.ค. 2026)
   ค่าเริ่ม = พื้นหลังไล่สีชุด "ทะเล" (html[data-skin-bg="mesh"]) · อีกแบบคือรูปฟาร์มโซลาร์เบลอ (PHOTO)
   เปลี่ยนรูป = วางไฟล์ใน dashboard/assets/ แล้วแก้ PHOTO ข้างล่าง

   ธีมเดิมยังอยู่ครบ: ทุกกฎอยู่ใต้ html[data-skin="glass"] และเปลี่ยนแค่ค่าตัวแปร (token) + ชั้นกระจก
   เลือกได้ต่อเครื่อง (localStorage "pg-skin" = glass/off · "pg-skin-bg" = mesh/photo)
     - ต่อท้าย URL ?skin=mesh (ไล่สี) · ?skin=glass (รูป) · ?skin=off (กลับไปธีมเดิม)
     - localhost มีปุ่มลอยมุมขวาล่าง กดวน ปิด → รูป → ไล่สี
   ห้ามเอาคลาส lg-* ของหน้าล็อกอินมาใช้ (DESIGN.md) — ชุดนี้ใช้ตัวแปร --sk-* ของตัวเอง
   ================================================================ */
(function () {
  var KEY = "pg-skin", BGKEY = "pg-skin-bg";
  var root = document.documentElement;
  // mode: "" ปิด · "photo" รูป · "mesh" ไล่สี
  var save = function (m) {
    try {
      localStorage.setItem(KEY, m ? "glass" : "off");   // "off" ต้องจดไว้ ไม่งั้นกลับเป็นค่าเริ่ม (เปิด)
      if (m) localStorage.setItem(BGKEY, m);
    } catch (e) {}
  };
  var apply = function (m) {
    m ? root.setAttribute("data-skin", "glass") : root.removeAttribute("data-skin");
    m === "mesh" ? root.setAttribute("data-skin-bg", "mesh") : root.removeAttribute("data-skin-bg");
  };
  try {
    var q = new URLSearchParams(location.search).get("skin");
    if (q === "glass") save("photo");
    else if (q === "mesh") save("mesh");
    else if (q === "off") save("");
  } catch (e) {}
  // ค่าเริ่ม (ยังไม่เคยเลือก) = ไล่สี · เลือกปิดไว้ = ธีมเดิม · แบบรูปต้องเคยเลือกไว้ (pg-skin-bg = "photo")
  var mode = "mesh";
  try {
    if (localStorage.getItem(KEY) === "off") mode = "";
    else if (localStorage.getItem(BGKEY) === "photo") mode = "photo";
  } catch (e) {}
  apply(mode);

  var PHOTO = "dashboard/assets/skin-solarfarm.jpg?v=2";
  var G = 'html[data-skin="glass"]';
  var L = G + ':not([data-theme="aurora"])';   // ชุดสว่าง — ต้องไม่ทับตัวแปรของโหมดกราไฟต์
  var D = G + '[data-theme="aurora"]';
  var M = G + '[data-skin-bg="mesh"]';
  /* ชุดสีพื้นหลังแบบไล่สี — แต่ละชุดมีโหมดสว่าง (l) และกราไฟต์ (d): สีพื้น + สีวง 4 วง (r,g,b,ความเข้ม) */
  var MESH_PAL = [
    { n: "เขียวแบรนด์", l: ["#E6EFEC", [27,155,117,.55], [110,196,222,.60], [255,205,160,.70], [140,214,184,.55]],
      d: ["#0D1120", [27,155,117,.42], [80,70,180,.45], [170,70,120,.32], [20,120,150,.38]] },
    { n: "พระอาทิตย์ขึ้น", l: ["#FBF1E8", [255,160,110,.55], [255,212,130,.65], [236,130,160,.45], [150,196,230,.50]],
      d: ["#170E16", [200,90,60,.42], [210,150,60,.34], [150,50,110,.40], [60,60,150,.40]] },
    { n: "ทะเล", l: ["#E8F2F8", [70,150,230,.50], [110,215,215,.55], [160,180,250,.50], [196,236,226,.60]],
      d: ["#07111E", [30,100,200,.45], [20,150,160,.38], [90,80,200,.40], [10,70,130,.45]] },
    { n: "ลาเวนเดอร์", l: ["#F2EEF8", [176,146,240,.50], [248,166,206,.50], [146,196,250,.50], [255,218,186,.60]],
      d: ["#110D21", [120,80,220,.45], [190,70,150,.35], [60,90,200,.40], [150,90,60,.30]] },
    { n: "ป่าเขา", l: ["#EEF3E6", [140,196,84,.50], [232,206,100,.55], [80,176,146,.50], [196,228,166,.60]],
      d: ["#0B130D", [60,140,60,.42], [160,140,40,.32], [20,120,100,.40], [80,110,40,.36]] },
    { n: "พีชมิ้นต์", l: ["#F5F1EC", [255,180,150,.55], [130,220,190,.55], [255,226,160,.55], [170,210,240,.45]],
      d: ["#11121A", [190,100,80,.36], [30,150,120,.40], [170,140,60,.30], [60,100,170,.38]] },
  ];
  // ตำแหน่งวงตั้งต้น (x%, y%, กว้าง%, สูง%) — แบบเดิมก่อนมีการสุ่ม
  var MESH_POS = [[10,14,42,52], [88,8,40,50], [74,88,48,55], [18,92,40,48]];
  var MKEY = "pg-skin-mesh";
  var mesh = { p: 2, pos: MESH_POS };   // ค่าเริ่ม = ทะเล (ผู้ใช้เลือก)
  try {
    var mj = JSON.parse(localStorage.getItem(MKEY) || "null");
    if (mj && MESH_PAL[mj.p] && mj.pos && mj.pos.length === 4) mesh = mj;
  } catch (e) {}
  var meshCss = function () {
    var pal = MESH_PAL[mesh.p] || MESH_PAL[0];
    var layer = function (set, light) {
      var g = set.slice(1).map(function (c, k) {
        var o = mesh.pos[k];
        return "radial-gradient(" + o[2] + "% " + o[3] + "% at " + o[0] + "% " + o[1] + "%,rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + c[3] + "),transparent 70%)";
      });
      if (light) g.push("radial-gradient(36% 42% at 50% 46%,rgba(255,250,240,.7),transparent 70%)");
      return "background-color:" + set[0] + ";background-image:" + g.join(",");
    };
    return M + ':not([data-theme="aurora"]) .app-root::before{' + layer(pal.l, true) + "}" +
      M + '[data-theme="aurora"] .app-root::before{' + layer(pal.d, false) + "}";
  };
  var r2 = function (a, b) { return Math.round(a + Math.random() * (b - a)); };
  // สุ่ม: ชุดสีใหม่ (ไม่ซ้ำชุดเดิม) + วงสีย้ายที่ — กระจายทีละมุมกันวงกองรวมกัน
  var shuffleMesh = function () {
    var p = mesh.p;
    while (MESH_PAL.length > 1 && p === mesh.p) p = Math.floor(Math.random() * MESH_PAL.length);
    var corners = [[0, 0], [1, 0], [1, 1], [0, 1]].sort(function () { return Math.random() - 0.5; });
    mesh = { p: p, pos: corners.map(function (c) {
      return [c[0] ? r2(55, 100) : r2(0, 45), c[1] ? r2(55, 100) : r2(0, 45), r2(34, 56), r2(40, 62)];
    }) };
    try { localStorage.setItem(MKEY, JSON.stringify(mesh)); } catch (e) {}
    mst.textContent = meshCss();
  };

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
    "--surface:rgba(28,31,40,.62);--surface2:rgba(255,255,255,.07);--surface3:rgba(255,255,255,.12);--r-card:26px;--gr-card:rgba(28,31,40,.55);",
    "--shadow-card:inset 0 1px 0 var(--sk-edge),0 26px 60px -24px rgba(0,0,0,.6);",
    "--shadow-sm:inset 0 1px 0 rgba(255,255,255,.10),0 6px 18px -10px rgba(0,0,0,.6)}",

    /* ── พื้นหลัง: ภาพฟาร์มโซลาร์เต็มจอ เบลอนิดเดียว + ผ้าคลุมจาง ── */
    G + " body{background:#C9D3D6}",
    G + " .app-root{position:relative;isolation:isolate}",
    G + " .app-root::before{content:'';position:fixed;inset:-40px;z-index:-2;pointer-events:none;",
    "background:url('" + PHOTO + "') 65% center/cover;filter:blur(6px)}",
    G + " .app-root::after{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:var(--sk-wash)}",

    /* ── พื้นหลังแบบไล่สี (ไม่ใช้รูป): วงสีฟุ้งหลายวงจากชุดสี MESH_PAL ── */
    M + ":not([data-theme=\"aurora\"]){--sk-wash:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.18))}",
    M + "[data-theme=\"aurora\"]{--sk-wash:linear-gradient(180deg,rgba(8,10,18,.20),rgba(8,10,18,.38))}",
    M + " .app-root::before{inset:0;filter:none}",
    /* สี/ตำแหน่งวงสีสร้างใน meshCss() ข้างล่าง (สลับชุดสี/สุ่มตำแหน่งได้) */

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

    /* โหมดมืด: รางบอร์ด (เดิมผสมดำ 34%) และหัวตาราง (--gr-card !important) — หัวตารางติดหนึบต้องทึบพอให้แถวที่เลื่อนผ่านไม่ทะลุ */
    D + " .bd-col{background:rgba(8,10,18,.32);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}",
    D + " .app-content thead th{background:rgba(22,25,34,.94)!important}",
    /* การ์ดตัวเลข (stat-rail) เบลอฉากหลังเหมือนแผ่นอื่น */
    G + " .stat-rail>button{-webkit-backdrop-filter:var(--sk-blur);backdrop-filter:var(--sk-blur)}",

    /* แถบต้อนรับหน้าภาพรวม (.ov-hero): ใช้รูปฟาร์มโซลาร์รูปเดียวกับพื้นหลัง · ผ้าคลุมเปลี่ยนจากเขียวแบรนด์ทึบ
       เป็นน้ำเงินเทาเข้มจาง ๆ ทางซ้าย (ผู้ใช้ว่าเขียวเกิน) — ตัวหนังสือขาวยังอ่านออก แล้วโปร่งไปทางขวาให้เห็นรูป */
    G + " .ov-hero{background:#2A3F4A url('" + PHOTO + "') right 72%/cover no-repeat}",
    /* ผ้าคลุมต้องคลุมใต้เส้นขอบ 1px ด้วย (inset:-1px) ไม่งั้นรูปดิบโผล่เป็นขอบสว่างรอบแถบ */
    G + " .ov-hero{border-color:transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),var(--shadow-sm)}",
    G + " .ov-hero::after{inset:-1px;border-radius:inherit;background:linear-gradient(100deg,rgba(14,32,44,.74) 0,rgba(14,32,44,.58) 30%,rgba(14,32,44,.22) 62%,rgba(14,32,44,.06) 90%)}",
    G + " .ov-hero-fig{background:rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px) saturate(1.3);backdrop-filter:blur(10px) saturate(1.3)}",

    /* เมนูเด้ง/ดรอปดาวน์ที่ลอยทับของอื่น (inline position:absolute|fixed + พื้น --surface) เช่น เมนูตั้งค่าท้ายแถบเมนู
       กระจกใสปกติทำให้ตัวหนังสือข้างหลังโผล่ทะลุ — ทำให้ทึบเกือบเต็ม + เบลอแรง */
    L + " [style*='position: absolute'][style*='background: var(--surface)']," + L + " [style*='position: fixed'][style*='background: var(--surface)']{--surface:rgba(250,252,252,.94)}",
    D + " [style*='position: absolute'][style*='background: var(--surface)']," + D + " [style*='position: fixed'][style*='background: var(--surface)']{--surface:rgba(30,33,44,.95)}",
    G + " [style*='position: absolute'][style*='background: var(--surface)']," + G + " [style*='position: fixed'][style*='background: var(--surface)']{-webkit-backdrop-filter:blur(28px) saturate(1.5);backdrop-filter:blur(28px) saturate(1.5)}",

    /* ปุ่มย่อ/ขยายแถบเมนู: เขียวแบรนด์ตลอด (ผู้ใช้เลือก) แต่ไม่มีวงแหวนสีพื้นทึบรอบ ๆ แบบเดิม — ใช้เงาฟุ้งสีเขียวแทน */
    G + " .sidebar>button[aria-label='ย่อ/ขยายแถบเมนู']{width:28px!important;height:28px!important;right:-14px!important;border:none!important;",
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 4px 14px -3px color-mix(in srgb,var(--primary) 65%,transparent)!important;transition:filter .15s,box-shadow .15s}",
    G + " .sidebar>button[aria-label='ย่อ/ขยายแถบเมนู'] svg{stroke-width:2.2}",
    G + " .sidebar>button[aria-label='ย่อ/ขยายแถบเมนู']:hover{filter:brightness(1.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px -3px color-mix(in srgb,var(--primary) 80%,transparent)!important}",

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
    ".sk-toggle.sk-dice{right:auto;left:auto}",
  ].join("");

  var st = document.createElement("style");
  st.id = "skin-glass-css";
  st.textContent = CSS;
  (document.head || root).appendChild(st);
  var mst = document.createElement("style");
  mst.id = "skin-glass-mesh";
  mst.textContent = meshCss();
  (document.head || root).appendChild(mst);

  var h = location.hostname;
  if (!(h === "localhost" || h === "127.0.0.1")) return;
  var addBtn = function () {
    var b = document.createElement("button");
    b.className = "sk-toggle";
    var LABEL = { "": "ปิด", photo: "รูป", mesh: "ไล่สี" };
    // ปุ่มสุ่มสี — โผล่เฉพาะตอนเป็นแบบไล่สี อยู่ซ้ายปุ่มหลัก
    var d = document.createElement("button");
    d.className = "sk-toggle sk-dice";
    d.textContent = "🎲 สุ่มสี";
    d.title = "เปลี่ยนชุดสีและย้ายตำแหน่งวงสี — จำค่าเฉพาะเครื่องนี้";
    var show = function () {
      b.setAttribute("data-on", mode ? "1" : "0");
      b.textContent = "ธีมกระจก · " + LABEL[mode] + (mode === "mesh" ? " · " + MESH_PAL[mesh.p].n : "");
      d.style.display = mode === "mesh" ? "" : "none";
      d.style.right = (b.offsetWidth + 20) + "px";
    };
    d.onclick = function () { shuffleMesh(); show(); };
    show();
    b.title = "กดวน ปิด → รูป → ไล่สี — จำค่าเฉพาะเครื่องนี้";
    b.onclick = function () {
      mode = mode === "" ? "photo" : mode === "photo" ? "mesh" : "";
      save(mode);
      apply(mode);
      show();
    };
    document.body.appendChild(b);
    document.body.appendChild(d);
    show();
  };
  if (document.body) addBtn();
  else document.addEventListener("DOMContentLoaded", addBtn);
})();
