const BRANDING = {
  name: "flash+solar",
  nameUpper: "FLASH + SOLAR",
  legal: "FLASH + SOLAR CO., LTD.",
  tagline: "CLEAN ENERGY",
  taglineTH: "ระบบติดตามงานติดตั้ง",
  desc: "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า",
  email: "solar@phithangreen.com",
  tel: "064-867-5020",
  telNote: "064-867-5020 (ฝ่ายวิศวกรรม)",
  site: "www.phithangreen.com",
  ink: "#0F2B33",
  deep: "#0A4D68",
  teal: "#148080",
  green: "#22B36A",
  leaf: "#1B9B75",
  muted: "#5B8A8A",
  markURL: "dashboard/assets/flash-mark.svg",
  markPNG: "dashboard/assets/flash-mark.png"
};
const BRAND_MARK_SVG = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' + '<polygon points="100,100 160.6,65 100,30" fill="#0A4D68"/>' + '<polygon points="100,100 100,30 39.4,65" fill="#0E6478"/>' + '<polygon points="100,100 39.4,65 39.4,135" fill="#148080"/>' + '<polygon points="100,100 39.4,135 100,170" fill="#1B9B75"/>' + '<polygon points="100,100 100,170 160.6,135" fill="#22B36A"/>' + '<polygon points="100,100 160.6,135 160.6,65" fill="#147A8C"/>' + '<polygon points="104,55 74,101 92,101 84,145 120,91 98,91" fill="#FFFFFF"/></svg>';
function BrandMark({
  size,
  style
}) {
  const s = size || 40;
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 200 200",
    style: style,
    "aria-label": BRANDING.name,
    role: "img"
  }, React.createElement("polygon", {
    points: "100,100 160.6,65 100,30",
    fill: "#0A4D68"
  }), React.createElement("polygon", {
    points: "100,100 100,30 39.4,65",
    fill: "#0E6478"
  }), React.createElement("polygon", {
    points: "100,100 39.4,65 39.4,135",
    fill: "#148080"
  }), React.createElement("polygon", {
    points: "100,100 39.4,135 100,170",
    fill: "#1B9B75"
  }), React.createElement("polygon", {
    points: "100,100 100,170 160.6,135",
    fill: "#22B36A"
  }), React.createElement("polygon", {
    points: "100,100 160.6,135 160.6,65",
    fill: "#147A8C"
  }), React.createElement("polygon", {
    points: "104,55 74,101 92,101 84,145 120,91 98,91",
    fill: "#FFFFFF"
  }));
}
function BrandWord({
  size,
  color,
  plusColor,
  style
}) {
  return React.createElement("span", {
    style: Object.assign({
      fontFamily: "var(--brand-font)",
      fontWeight: 700,
      letterSpacing: "-.02em",
      fontSize: size || 20,
      color: color || "var(--brand-ink)",
      lineHeight: 1,
      whiteSpace: "nowrap"
    }, style)
  }, "flash", React.createElement("span", {
    style: {
      color: plusColor || BRANDING.green
    }
  }, "+"), "solar");
}
function BrandLockup({
  size,
  stack,
  sub
}) {
  const s = size || 46;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: stack ? "column" : "row",
      alignItems: "center",
      gap: stack ? 12 : 14,
      justifyContent: "center"
    }
  }, React.createElement(BrandMark, {
    size: s
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: stack ? "center" : "flex-start",
      gap: 3
    }
  }, React.createElement(BrandWord, {
    size: s * 0.62
  }), React.createElement("div", {
    style: {
      fontFamily: "var(--brand-font)",
      fontSize: Math.max(9, s * 0.2),
      letterSpacing: ".3em",
      textTransform: "uppercase",
      color: "var(--brand-muted)",
      fontWeight: 500,
      paddingLeft: ".3em"
    }
  }, sub || BRANDING.tagline)));
}
function brandHeadHTML(opts) {
  const o = opts || {};
  const px = o.size || 38;
  return '<div style="display:flex;align-items:center;gap:11px">' + '<span style="width:' + px + 'px;height:' + px + 'px;flex-shrink:0;display:block">' + BRAND_MARK_SVG + "</span>" + '<span><span style="display:block;font-weight:700;font-size:' + Math.round(px * 0.55) + "px;letter-spacing:-.02em;color:" + BRANDING.ink + '">' + 'flash<span style="color:' + BRANDING.green + '">+</span>solar</span>' + '<span style="display:block;font-size:' + Math.max(7, Math.round(px * 0.21)) + "px;letter-spacing:.26em;color:" + BRANDING.muted + '">' + BRANDING.tagline + "</span></span></div>";
}
Object.assign(window, {
  BRANDING,
  BRAND_MARK_SVG,
  BrandMark,
  BrandWord,
  BrandLockup,
  brandHeadHTML
});