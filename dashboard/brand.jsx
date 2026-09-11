/* ══════════════════════════════════════════════════
   flash+solar — ตราสัญลักษณ์และข้อมูลบริษัทที่ใช้ร่วมกันทั้งระบบ

   ทุกที่ที่โชว์ชื่อบริษัท โลโก้ อีเมล เบอร์โทร หรือเว็บไซต์ ให้ดึงจากไฟล์นี้ที่เดียว
   (เอกสารที่ส่งลูกค้า — ใบเสนอราคา BOQ รายงานออกแบบ แบบ DXF สไลด์สำรวจ — ใช้ชุดเดียวกันหมด)
   เปลี่ยนชื่อ/ที่อยู่ติดต่อทีเดียวตรงนี้ แล้วเปลี่ยนพร้อมกันทุกหน้าและทุกเอกสาร
   ══════════════════════════════════════════════════ */

const BRANDING = {
  name: "flash+solar",                 /* ชื่อในโลโก้ — ตัวเล็กทั้งหมด มีเครื่องหมายบวกสีเขียวคั่นกลาง */
  nameUpper: "FLASH + SOLAR",          /* สำหรับเอกสารราชการ/หัวแบบ ที่ใช้ตัวพิมพ์ใหญ่ */
  legal: "FLASH + SOLAR CO., LTD.",
  tagline: "CLEAN ENERGY",
  taglineTH: "ระบบติดตามงานติดตั้ง",
  desc: "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า",

  /* ── ที่อยู่ติดต่อ ──
     ยังเป็นของเดิมอยู่ เพราะยังไม่ได้อีเมล/เว็บของชื่อใหม่ พอได้โดเมนใหม่แล้วแก้ 3 บรรทัดนี้พอ */
  email: "solar@phithangreen.com",
  tel: "064-867-5020",
  telNote: "064-867-5020 (ฝ่ายวิศวกรรม)",
  site: "www.phithangreen.com",

  /* ── สีแบรนด์ ──
     มาจากหกเหลี่ยมในโลโก้โดยตรง ใช้กับเอกสารที่พิมพ์ออกมา (ในหน้าจอใช้ตัวแปร CSS --primary ฯลฯ) */
  ink: "#0F2B33",       /* ตัวหนังสือเข้ม (ชื่อในโลโก้) */
  deep: "#0A4D68",      /* น้ำเงินอมเขียวเข้ม — หัวเรื่อง เส้นคั่นหนา */
  teal: "#148080",      /* เขียวอมฟ้ากลาง */
  green: "#22B36A",     /* เขียวสด — เครื่องหมายบวกในโลโก้ */
  leaf: "#1B9B75",      /* เขียวหลัก (ปุ่ม/กราฟ) */
  muted: "#5B8A8A",     /* ตัวหนังสือรอง ใต้โลโก้ */

  markURL: "dashboard/assets/flash-mark.svg",
  markPNG: "dashboard/assets/flash-mark.png",   /* ใช้กับหน้าต่างพิมพ์/แคนวาส ที่ SVG บางเบราว์เซอร์ไม่ยอมวาด */
};

/* ตราสัญลักษณ์เป็นโค้ด SVG ตรง ๆ — เอาไปแปะในหน้าต่างพิมพ์ (ใบเสนอราคา/ใบขออนุญาต)
   ที่แทรกเอกสารด้วยสตริง HTML ได้เลย ไม่ต้องรอโหลดไฟล์รูปก่อนสั่งพิมพ์ */
const BRAND_MARK_SVG =
  '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' +
  '<polygon points="100,100 160.6,65 100,30" fill="#0A4D68"/>' +
  '<polygon points="100,100 100,30 39.4,65" fill="#0E6478"/>' +
  '<polygon points="100,100 39.4,65 39.4,135" fill="#148080"/>' +
  '<polygon points="100,100 39.4,135 100,170" fill="#1B9B75"/>' +
  '<polygon points="100,100 100,170 160.6,135" fill="#22B36A"/>' +
  '<polygon points="100,100 160.6,135 160.6,65" fill="#147A8C"/>' +
  '<polygon points="104,55 74,101 92,101 84,145 120,91 98,91" fill="#FFFFFF"/></svg>';

/* ── ตราสัญลักษณ์ 3 แบบตามไฟล์ออกแบบ (Emblem) ──
   light  = พื้นสว่าง — หกเหลี่ยมสีเข้ม สายฟ้าสีขาว (แบบหลัก)
   dark   = พื้นมืด — หกเหลี่ยมเฉดสว่างขึ้น สายฟ้าเป็นสีเข้ม ไม่งั้นตราจมพื้น
   solid  = วางบนแผ่นสีเข้ม/ไล่สี — หกเหลี่ยมสีขาวไล่ความทึบ
   ไม่ระบุแบบ = ใช้ตัวแปร CSS ให้เปลี่ยนตามธีมเอง (โหมดกราไฟต์สลับเป็นชุด dark อัตโนมัติ)
   เอกสารที่พิมพ์ลงกระดาษต้องระบุ variant="light" เสมอ ไม่งั้นพิมพ์ตามธีมบนจอ */
const BRAND_FACETS = {
  light: ["#0A4D68", "#0E6478", "#148080", "#1B9B75", "#22B36A", "#147A8C"],
  dark:  ["#2E9BC4", "#37B0C4", "#3DC4B4", "#4FD79A", "#5FE38A", "#34AEC4"],
  theme: ["var(--fx-1)", "var(--fx-2)", "var(--fx-3)", "var(--fx-4)", "var(--fx-5)", "var(--fx-6)"],
};
const BRAND_BOLT = { light: "#FFFFFF", dark: "#0A2530", theme: "var(--fx-cut)" };
/* ด้านของหกเหลี่ยม เรียงลำดับเดียวกับชุดสีข้างบน — ทุกด้านแผ่ออกจากจุดกึ่งกลาง 100,100 */
const BRAND_FACET_PTS = [
  "100,100 160.6,65 100,30", "100,100 100,30 39.4,65", "100,100 39.4,65 39.4,135",
  "100,100 39.4,135 100,170", "100,100 100,170 160.6,135", "100,100 160.6,135 160.6,65",
];
const BRAND_BOLT_PTS = "104,55 74,101 92,101 84,145 120,91 98,91";
/* ความทึบของแต่ละด้านตอนวางบนแผ่นสีเข้ม — ให้ยังเห็นเหลี่ยมมุมทั้งที่เป็นสีขาวล้วน */
const BRAND_SOLID_OP = [1, 0.85, 0.7, 0.85, 1, 0.7];

/* หกเหลี่ยมในโลโก้ — วาดด้วย SVG ในหน้าเว็บ จะได้คมทุกขนาดและไม่ต้องโหลดไฟล์รูปเพิ่ม */
function BrandMark({ size, style, variant, boltColor }) {
  const s = size || 40;
  const solid = variant === "solid";
  const set = BRAND_FACETS[variant] || BRAND_FACETS.theme;
  const bolt = boltColor || (solid ? "#12405A" : BRAND_BOLT[variant] || BRAND_BOLT.theme);
  return (
    <svg width={s} height={s} viewBox="0 0 200 200" style={style} aria-label={BRANDING.name} role="img">
      {BRAND_FACET_PTS.map((pts, i) => (
        <polygon key={i} points={pts} fill={solid ? "#FFFFFF" : set[i]}
          opacity={solid ? BRAND_SOLID_OP[i] : undefined} />
      ))}
      <polygon points={BRAND_BOLT_PTS} fill={bolt} />
    </svg>
  );
}

/* ชื่อในโลโก้ — "flash" + เครื่องหมายบวกสีเขียว + "solar"
   ฟอนต์ Outfit น้ำหนัก 700 บีบช่องไฟ -0.02em ตามที่กำหนดไว้ในชุดแบรนด์ */
function BrandWord({ size, color, plusColor, style }) {
  return (
    <span style={Object.assign({ fontFamily: "var(--brand-font)", fontWeight: 700, letterSpacing: "-.02em",
      fontSize: size || 20, color: color || "var(--brand-ink)", lineHeight: 1, whiteSpace: "nowrap" }, style)}>
      flash<span style={{ color: plusColor || BRANDING.green }}>+</span>solar
    </span>
  );
}

/* โลโก้เต็มชุด (หกเหลี่ยม + ชื่อ + CLEAN ENERGY) — สัดส่วนตามไฟล์ออกแบบ
   แนวตั้ง ตราใหญ่ ชื่อเล็กกว่ามาก (150/40) · แนวนอน ตราเล็กลง ชื่อใหญ่ขึ้น (78/38) */
function BrandLockup({ size, stack, sub, variant, color, subColor }) {
  const s = size || 46;
  const word = Math.round(s * (stack ? 0.27 : 0.49));
  const tag = Math.max(9, Math.round(word * 0.3));
  return (
    <div style={{ display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center",
      gap: stack ? Math.round(s * 0.13) : 14, justifyContent: "center" }}>
      <BrandMark size={s} variant={variant} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: stack ? "center" : "flex-start", gap: 2 }}>
        <BrandWord size={word} color={color} plusColor={variant === "solid" ? "#DFF7E4" : undefined} />
        <div style={{ fontFamily: "var(--brand-font)", fontSize: tag, letterSpacing: ".3em",
          textTransform: "uppercase", color: subColor || "var(--brand-muted)", fontWeight: 500, paddingLeft: ".3em" }}>
          {sub || BRANDING.tagline}
        </div>
      </div>
    </div>
  );
}

/* หัวกระดาษของเอกสารที่พิมพ์ผ่านหน้าต่างใหม่ (ใบเสนอราคา · ใบขออนุญาต · รายงานออกแบบ)
   คืนเป็นสตริง HTML เพราะเอกสารพวกนั้นประกอบด้วยการต่อสตริง ไม่ได้ render ด้วย React */
function brandHeadHTML(opts) {
  const o = opts || {};
  const px = o.size || 38;
  return '<div style="display:flex;align-items:center;gap:11px">' +
    '<span style="width:' + px + 'px;height:' + px + 'px;flex-shrink:0;display:block">' + BRAND_MARK_SVG + "</span>" +
    '<span><span style="display:block;font-weight:700;font-size:' + Math.round(px * 0.55) + "px;letter-spacing:-.02em;color:" + BRANDING.ink + '">' +
    'flash<span style="color:' + BRANDING.green + '">+</span>solar</span>' +
    '<span style="display:block;font-size:' + Math.max(7, Math.round(px * 0.21)) + "px;letter-spacing:.26em;color:" + BRANDING.muted + '">' +
    BRANDING.tagline + "</span></span></div>";
}

Object.assign(window, { BRANDING, BRAND_MARK_SVG, BrandMark, BrandWord, BrandLockup, brandHeadHTML });
