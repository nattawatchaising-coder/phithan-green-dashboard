/* ============================================================
   VCARD — นามบัตรอิเล็กทรอนิกส์ของผู้ใช้
   ข้อมูลทั้งหมดมาจาก "โปรไฟล์ของฉัน" (auth.jsx · MyProfileModal) ไม่มีช่องให้กรอกซ้ำที่นี่
   ที่เดียวที่แก้ชื่อ/เบอร์/อีเมล/ไลน์ได้คือหน้าโปรไฟล์ นามบัตรเป็นแค่มุมมองของข้อมูลชุดนั้น

   วาดลงแคนวาสตัวเดียว ไม่ใช่วาดเป็น DOM แล้วค่อยแปลงเป็นรูปทีหลัง
   เพราะนามบัตรใบนี้เกิดมาเพื่อออกไปเป็นรูป (ส่งไลน์ · แนบอีเมล) ไม่ใช่เพื่ออ่านบนจอ
   ถ้าวาดสองทาง (DOM ให้ดู + แคนวาสให้เซฟ) จะมีหน้าตาสองชุดที่ต้องไล่ให้ตรงกันตลอดไป
   แบบนี้สิ่งที่เห็นบนจอคือไฟล์ที่จะได้ พิกเซลต่อพิกเซล

   คิวอาร์บรรจุ vCard แบบย่อ (ไม่มีที่อยู่บริษัท) ส่วนไฟล์ .vcf ที่ดาวน์โหลดมีครบ
   ที่อยู่ภาษาไทยกิน 3 ไบต์ต่อตัวอักษร ใส่ลงคิวอาร์แล้วโมดูลถี่ขึ้นจนสแกนจากจอมือถือไม่ติด
   — คิวอาร์ที่สแกนไม่ติดไม่มีประโยชน์กว่าคิวอาร์ที่ไม่มีที่อยู่
   ============================================================ */

const VC_W = 1000, VC_H = 580;       /* หน่วยตรรกะ · ไฟล์ที่ออกคูณสองเพื่อจอความละเอียดสูง */
const VC_SCALE = 2;
const VC_FONT = "'IBM Plex Sans Thai', sans-serif";
const vcFont = (w, px) => w + " " + px + "px " + VC_FONT;

/* เขียนให้อยู่ในความกว้างที่กำหนด โดยลดขนาดตัวอักษรลง ไม่ตัดด้วยจุดไข่ปลา
   ชื่อคนกับอีเมลบนนามบัตรต้องอ่านได้ครบ — ชื่อที่ถูกตัดท้ายคือนามบัตรที่ใช้ไม่ได้
   และถ้าปล่อยยาวไป มันจะทับคิวอาร์ที่อยู่ขวามือ */
function vcFit(x, text, maxW, weight, px, min) {
  let p = px;
  x.font = vcFont(weight, p);
  while (p > (min || 12) && x.measureText(text).width > maxW) {
    p -= 1;
    x.font = vcFont(weight, p);
  }
  return p;
}

/* โหลดรูปให้เสร็จก่อนวาด — คืน null ถ้าโหลดไม่ได้ เพื่อให้นามบัตรยังออกได้โดยไม่มีโลโก้/รูป
   ไม่ throw เพราะรูปหายหนึ่งใบไม่ควรทำให้ทั้งใบพัง */
function vcLoadImg(src) {
  return new Promise((done) => {
    if (!src) return done(null);
    const im = new Image();
    im.onload = () => done(im);
    im.onerror = () => done(null);
    im.src = src;
  });
}

/* ตำแหน่งงานที่พิมพ์บนนามบัตร — ใช้ชื่อเต็ม ไม่ใช่ชื่อย่อที่ใช้ในชิปบนหน้าจอ
   "ช่าง" พออ่านในระบบเพราะมีบริบทรอบตัว แต่บนนามบัตรที่ไปอยู่ในมือลูกค้าต้องเป็น "ช่างติดตั้ง" */
function vcTitle(user) {
  const rs = (window.userRoles ? window.userRoles(user) : []) || [];
  const info = window.ROLE_INFO || {};
  const th = rs.map((r) => (info[r] || {}).th).filter(Boolean);
  return th.length ? th.join(" · ") : "";
}

/* หลีกอักขระตามข้อกำหนด vCard — ตัวคั่นฟิลด์คือ ; และ , ถ้าชื่อหรือที่อยู่มีอยู่จริงต้องหลีก
   ไม่งั้นนามสกุลที่มีลูกน้ำจะกลายเป็นสองฟิลด์ตอนเครื่องปลายทางอ่าน */
const vcEsc = (v) => String(v || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[;,]/g, (m) => "\\" + m);

/* vCard 3.0 · UTF-8 ไม่ประกาศ charset (3.0 ถือว่าเป็น UTF-8 อยู่แล้ว)
   ไม่พับบรรทัดตามข้อกำหนด 75 ไบต์ — โปรแกรมอ่านนามบัตรพลาดกับบรรทัดที่พับบ่อยกว่าบรรทัดยาว
   full=false คือรุ่นย่อสำหรับคิวอาร์ */
function vcText(user, full) {
  const B = window.BRANDING || {};
  const nm = String((user || {}).name || "").trim();
  const L = ["BEGIN:VCARD", "VERSION:3.0"];
  L.push("N:" + vcEsc(nm) + ";;;;");
  L.push("FN:" + vcEsc(nm));
  if (B.legalTH) L.push("ORG:" + vcEsc(B.legalTH));
  const t = vcTitle(user);
  if (t) L.push("TITLE:" + vcEsc(t));
  if (user.phone) L.push("TEL;TYPE=CELL:" + String(user.phone).trim());
  if (B.tel) L.push("TEL;TYPE=WORK:" + B.tel);
  if (user.email) L.push("EMAIL;TYPE=INTERNET:" + String(user.email).trim());
  /* ไม่ใส่ URL — โดเมนใน BRANDING.site ยังเป็นของชื่อเก่า เอาเข้ารายชื่อคือพาลูกค้าไปผิดที่
     กลับมาใส่ได้เมื่อมีโดเมนใหม่ — แก้ที่ BRANDING.site ที่เดียว ทุกเอกสารเปลี่ยนพร้อมกัน */
  /* ไม่ใส่ไลน์ — บนนามบัตรก็ไม่มี สองที่ต้องตรงกัน ไม่งั้นคนสแกนกับคนมองใบจะได้ข้อมูลคนละชุด */
  if (full && B.taxId) L.push("NOTE:" + vcEsc("เลขประจำตัวผู้เสียภาษี " + B.taxId));
  if (full && B.addrTH) L.push("ADR;TYPE=WORK:;;" + vcEsc(B.addrTH) + ";;;;");
  L.push("END:VCARD");
  return L.join("\r\n") + "\r\n";
}

/* ── วาดนามบัตร ──────────────────────────────────────────────
   คืนค่าเป็น canvas ที่วาดเสร็จแล้ว (ขนาดจริง = VC_W×VC_SCALE)
   เรียกได้จากทั้งตัวแสดงผลบนจอและตอนกดบันทึก — ทางเดียวกัน ภาพเดียวกัน */
async function vcDraw(user, avatarUrl) {
  const B = window.BRANDING || {};
  const cv = document.createElement("canvas");
  cv.width = VC_W * VC_SCALE; cv.height = VC_H * VC_SCALE;
  const x = cv.getContext("2d");
  x.scale(VC_SCALE, VC_SCALE);

  /* รอฟอนต์ให้พร้อมก่อน — แคนวาสไม่รอเหมือน DOM ถ้าวาดตอนฟอนต์ยังไม่มา
     ตัวหนังสือไทยจะออกมาเป็นฟอนต์สำรองของเครื่อง แล้วนามบัตรที่เซฟไปแล้วก็แก้ไม่ได้ */
  try {
    if (document.fonts) {
      await Promise.all([vcFont(400, 16), vcFont(600, 16), vcFont(700, 16)].map((f) => document.fonts.load(f, "ก")));
      await document.fonts.ready;
    }
  } catch (e) { /* เบราว์เซอร์ที่ไม่มี Font Loading API — วาดด้วยฟอนต์เท่าที่มี */ }

  const [logo, face] = await Promise.all([
    vcLoadImg(window.brandDocURL ? window.brandDocURL() : ""),
    vcLoadImg(avatarUrl),
  ]);

  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, VC_W, VC_H);

  /* แถบสีบาง ๆ ริมซ้าย — เส้นเดียวที่บอกว่าใบนี้เป็นของบริษัทไหนตอนถูกย่อเป็นรูปเล็กในแชต */
  const bar = x.createLinearGradient(0, 0, 0, VC_H);
  bar.addColorStop(0, B.green || "#22B36A"); bar.addColorStop(1, B.deep || "#0A4D68");
  x.fillStyle = bar; x.fillRect(0, 0, 12, VC_H);

  /* ── หัวใบ: ตรากับชื่อบริษัท ──
     ชื่อไทยเป็นตัวหลัก ชื่ออังกฤษลงมาเป็นบรรทัดรอง — คนที่รับนามบัตรใบนี้อ่านไทย
     ชื่ออังกฤษยังต้องมี เผื่อเอกสารข้ามชาติกับการค้นหาชื่อบริษัท แต่ไม่ใช่ตัวที่ต้องอ่านก่อน */
  /* ตรากึ่งกลางกับก้อนตัวหนังสือข้าง ๆ — คิดจากขอบบนของชื่อบริษัทถึงขอบล่างของคำโปรย
     ไม่ปักค่า y ตายตัว — วันไหนขนาดตัวหนังสือเปลี่ยน ตราจะเลื่อนตามเอง ไม่ค้างอยู่ขอบบน */
  const LOGO_H = 118, TXT_TOP = 45, TXT_BOT = 137;
  let hx = 56;
  if (logo) {
    const w = Math.round(logo.width * (LOGO_H / logo.height));
    x.drawImage(logo, hx, (TXT_TOP + TXT_BOT) / 2 - LOGO_H / 2, w, LOGO_H);
    hx += w + 20;
  }
  /* กว้างที่เหลือหลังตรา — คิดจาก hx จริง ไม่ใช่ค่าคงที่ ตราจะได้โตได้อีกโดยชื่อไม่ล้น */
  const hw = 944 - hx;
  x.textBaseline = "alphabetic";
  x.fillStyle = B.ink || "#0F2B33";
  vcFit(x, B.legalTH || "", hw, 700, 44, 26);
  x.fillText(B.legalTH || "", hx, 78);
  x.fillStyle = B.muted || "#5B8A8A";
  vcFit(x, B.legal || "", hw, 600, 17, 12);
  x.fillText(B.legal || "", hx, 106);
  vcFit(x, B.desc || "", hw, 400, 17, 12);
  x.fillText(B.desc || "", hx, 133);

  x.strokeStyle = "#E3ECE8"; x.lineWidth = 1;
  x.beginPath(); x.moveTo(56, 158); x.lineTo(944, 158); x.stroke();

  /* ── รูปและชื่อ ── */
  const rs = (window.userRoles ? window.userRoles(user) : []) || [];
  const head = (window.ROLE_INFO || {})[rs[0]] || { color: B.leaf || "#1B9B75" };
  const cx = 116, cy = 250, r = 58;
  x.save();
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.closePath();
  x.fillStyle = head.color; x.fill();
  if (face) {
    x.clip();
    /* ครอบให้เต็มวงกลมโดยไม่บิดสัดส่วน — รูปจากมือถือเป็นสี่เหลี่ยมผืนผ้าเสมอ */
    const s = Math.max((r * 2) / face.width, (r * 2) / face.height);
    const w = face.width * s, h = face.height * s;
    x.drawImage(face, cx - w / 2, cy - h / 2, w, h);
  } else {
    x.fillStyle = "#FFFFFF"; x.font = vcFont(700, 46);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(String(user.name || "?").slice(0, 1), cx, cy + 2);
    x.textAlign = "left"; x.textBaseline = "alphabetic";
  }
  x.restore();

  /* 460 = จากขอบซ้ายของชื่อ (200) ถึงขอบซ้ายคิวอาร์ (700) หักช่องไฟไว้ 40 */
  const nm = String(user.name || "").trim();
  x.fillStyle = B.ink || "#0F2B33";
  vcFit(x, nm, 460, 700, 38, 22);
  x.fillText(nm, 200, 242);
  const title = vcTitle(user);
  if (title) {
    x.fillStyle = head.color;
    vcFit(x, title, 460, 600, 23, 15);
    x.fillText(title, 200, 278);
  }

  /* ── ช่องทางติดต่อ ──
     ช่องที่ยังไม่ได้กรอกไม่ขึ้นเลย ไม่ใช่ขึ้นเป็นขีดว่าง — นามบัตรที่มีบรรทัด "อีเมล —"
     บอกลูกค้าว่าคนนี้กรอกข้อมูลไม่ครบ ซึ่งไม่ใช่สิ่งที่นามบัตรมีไว้บอก */
  const rows = [];
  if (user.phone) rows.push(["โทร", String(user.phone).trim()]);
  if (user.email) rows.push(["อีเมล", String(user.email).trim()]);
  if (!rows.length) rows.push(["โทร", B.tel || ""]);
  let ry = 360;
  rows.forEach(([lb, v]) => {
    x.fillStyle = B.muted || "#5B8A8A"; x.font = vcFont(600, 22);
    x.textAlign = "right";
    x.fillText(lb, 112, ry);
    x.textAlign = "left";
    x.fillStyle = B.ink || "#0F2B33";
    vcFit(x, v, 534, 600, 26, 15);          /* 130 → 660 ชนคิวอาร์พอดี เหลือช่องไฟ 40 */
    x.fillText(v, 126, ry + 2);
    ry += 54;
  });

  /* ── คิวอาร์ ── */
  const qz = 186, qx = 706, qy = 226;
  if (window.qrcode) {
    try {
      const q = window.qrcode(0, "M");            /* 0 = เลือกรุ่นให้พอดีเอง · M = ทนเปื้อนระดับกลาง */
      q.addData(vcText(user, false), "Byte");
      q.make();
      const n = q.getModuleCount(), m = qz / n;
      x.fillStyle = "#FFFFFF"; x.fillRect(qx, qy, qz, qz);
      x.fillStyle = "#0F2B33";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        /* +1 ปัดขึ้นกันเส้นขาวบาง ๆ ระหว่างโมดูลตอน m ไม่ลงตัว ซึ่งทำให้กล้องอ่านพลาด */
        if (q.isDark(i, j)) x.fillRect(qx + j * m, qy + i * m, m + 1, m + 1);
      }
    } catch (e) { /* ข้อมูลยาวเกินรุ่นใหญ่สุด — ปล่อยว่างไว้ ดีกว่าวาดคิวอาร์ที่อ่านไม่ออก */ }
  }
  x.fillStyle = B.muted || "#5B8A8A"; x.font = vcFont(600, 15);
  x.textAlign = "center";
  x.fillText("สแกนเพื่อบันทึกลงรายชื่อ", qx + qz / 2, qy + qz + 26);
  x.textAlign = "left";

  /* ── แถบท้าย: ที่อยู่จดทะเบียน เลขผู้เสียภาษี ช่องทางติดต่อกลาง ──
     สองอย่างแรกคือสิ่งที่ลูกค้านิติบุคคลต้องใช้ตอนตั้งเบิก ขาดไปแล้วเขาต้องโทรมาถาม
     ไม่มีเว็บไซต์ — BRANDING.site ยังเป็นโดเมนของชื่อเก่า นามบัตรที่พาลูกค้าไปผิดที่แย่กว่าไม่มี */
  const fh = 106;
  x.fillStyle = B.deep || "#0A4D68";
  x.fillRect(0, VC_H - fh, VC_W, fh);
  /* ซ้ายคือตัวบริษัท (ที่อยู่ เลขภาษี) ขวาคือช่องทางติดต่อกลาง
     คนละเรื่อง คนละเวลาใช้ — ตั้งเบิกหยิบซ้าย ติดต่อหยิบขวา ไม่ต้องกวาดสายตาผ่านอีกสามบรรทัด */
  x.fillStyle = "rgba(255,255,255,.94)"; x.font = vcFont(600, 17);
  x.fillText(B.addrTH || "", 56, VC_H - 60);
  x.fillStyle = "rgba(255,255,255,.74)"; x.font = vcFont(400, 17);
  x.fillText("เลขประจำตัวผู้เสียภาษี " + (B.taxId || ""), 56, VC_H - 34);

  x.textAlign = "right";
  x.fillStyle = "rgba(255,255,255,.94)"; x.font = vcFont(600, 17);
  x.fillText("โทร " + (B.tel || ""), VC_W - 56, VC_H - 60);
  x.fillStyle = "rgba(255,255,255,.74)"; x.font = vcFont(400, 17);
  x.fillText(B.email || "", VC_W - 56, VC_H - 34);
  x.textAlign = "left";

  return cv;
}

/* ชื่อไฟล์ — ใช้ชื่อคนเป็นชื่อไฟล์ ตัดอักขระที่ตั้งชื่อไฟล์ไม่ได้ออก
   ภาษาไทยในชื่อไฟล์ใช้ได้ทั้งวินโดวส์ แมค และแอนดรอยด์ ไม่ต้องถอดเป็นอังกฤษ */
const vcSlug = (user) => String((user || {}).name || "namecard").trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "namecard";

function vcSaveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  /* คลายทันทีไม่ได้ เบราว์เซอร์บางตัวยังไม่เริ่มโหลด — หน่วงสั้น ๆ แล้วค่อยคืนหน่วยความจำ */
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function VcCardModal({ user, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const av = window.useUserAvatar((user || {}).id);
  const box = React.useRef(null);
  const cvRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);

  /* วาดใหม่เมื่อข้อมูลหรือรูปเปลี่ยน — แก้เบอร์ในหน้าโปรไฟล์แล้วเปิดนามบัตร ต้องเห็นเบอร์ใหม่ */
  React.useEffect(() => {
    let dead = false;
    setReady(false);
    vcDraw(user, av.avatar).then((cv) => {
      if (dead || !box.current) return;
      cvRef.current = cv;
      cv.style.width = "100%"; cv.style.height = "auto"; cv.style.display = "block";
      cv.style.borderRadius = "12px";
      box.current.innerHTML = "";
      box.current.appendChild(cv);
      setReady(true);
    });
    return () => { dead = true; };
  }, [user.name, user.phone, user.email, user.line, user.role, user.roles, av.avatar]);

  const savePng = () => {
    if (!cvRef.current) return;
    cvRef.current.toBlob((b) => { if (b) vcSaveBlob(b, "นามบัตร " + vcSlug(user) + ".png"); }, "image/png");
  };
  const saveVcf = () => {
    vcSaveBlob(new Blob([vcText(user, true)], { type: "text/vcard;charset=utf-8" }), vcSlug(user) + ".vcf");
  };
  /* แชร์ตรงเข้าไลน์/แชตได้เฉพาะบนเครื่องที่รองรับ — บนเดสก์ท็อปส่วนใหญ่ไม่มี ปุ่มจะไม่ขึ้น
     ไม่ทำปุ่มที่กดแล้วไม่เกิดอะไร ให้ใช้ "บันทึกรูป" แล้วลากไฟล์ไปแทน */
  const canShare = !!(navigator.canShare && navigator.share);
  const share = async () => {
    if (!cvRef.current) return;
    cvRef.current.toBlob(async (b) => {
      if (!b) return;
      const f = new File([b], "นามบัตร " + vcSlug(user) + ".png", { type: "image/png" });
      try {
        if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: "นามบัตร" });
        else vcSaveBlob(b, "นามบัตร " + vcSlug(user) + ".png");
      } catch (e) { /* ผู้ใช้กดยกเลิกแผงแชร์ — ไม่ใช่ข้อผิดพลาด */ }
    }, "image/png");
  };

  const thin = { padding: "10px 15px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
    color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 7 };

  const empty = !user.phone && !user.email && !user.line;

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", zIndex: 130, display: "grid",
      placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18,
        width: isMobile ? "100%" : "min(640px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>

        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>นามบัตรของฉัน</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={15} /></button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* กรอบรอบนามบัตรเป็นของหน้าจอ ไม่ได้ติดไปในไฟล์ — ไฟล์ที่ได้เป็นสี่เหลี่ยมเต็มใบ */}
          <div ref={box} style={{ borderRadius: 12, overflow: "hidden", background: "#FFFFFF",
            border: "1px solid var(--border)", minHeight: 120, boxShadow: "0 8px 26px rgba(8,20,14,.12)" }} />

          {empty && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "11px 13px", borderRadius: 11,
              background: "#F59E0B14", border: "1px solid #F59E0B40" }}>
              <Icon name="alert" size={15} color="#F59E0B" />
              <span style={{ fontSize: 12.5, color: "var(--text-1)", lineHeight: 1.5 }}>
                ยังไม่ได้กรอกเบอร์โทร อีเมล หรือไลน์ไอดี — นามบัตรจะขึ้นเบอร์บริษัทแทน
                กรอกในหน้าโปรไฟล์แล้วกดบันทึก นามบัตรจะเปลี่ยนตามเอง
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={savePng} disabled={!ready}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 10, border: "none",
                background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                cursor: ready ? "pointer" : "default", opacity: ready ? 1 : .5 }}>
              <Icon name="image" size={14} color="#fff" /> บันทึกรูป
            </button>
            {canShare && <button onClick={share} disabled={!ready} style={thin}><Icon name="link" size={14} /> แชร์</button>}
            <button onClick={saveVcf} style={thin}><Icon name="download" size={14} /> ไฟล์รายชื่อ (.vcf)</button>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
            รูปส่งต่อทางไลน์หรืออีเมลได้เลย · ลูกค้าสแกนคิวอาร์แล้วชื่อกับเบอร์จะเข้ารายชื่อในเครื่องทันที
            ไม่ต้องพิมพ์ตาม · ไฟล์ .vcf ไว้ส่งให้คนที่สแกนไม่ได้ เปิดแล้วบันทึกลงรายชื่อเหมือนกัน
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VcCardModal, vcText, vcDraw, VC_W, VC_H });
