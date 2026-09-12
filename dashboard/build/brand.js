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
const BRAND_FACETS = {
  light: ["#0A4D68", "#0E6478", "#148080", "#1B9B75", "#22B36A", "#147A8C"],
  dark: ["#2E9BC4", "#37B0C4", "#3DC4B4", "#4FD79A", "#5FE38A", "#34AEC4"],
  theme: ["var(--fx-1)", "var(--fx-2)", "var(--fx-3)", "var(--fx-4)", "var(--fx-5)", "var(--fx-6)"]
};
const BRAND_BOLT = {
  light: "#FFFFFF",
  dark: "#0A2530",
  theme: "var(--fx-cut)"
};
const BRAND_FACET_PTS = ["100,100 160.6,65 100,30", "100,100 100,30 39.4,65", "100,100 39.4,65 39.4,135", "100,100 39.4,135 100,170", "100,100 100,170 160.6,135", "100,100 160.6,135 160.6,65"];
const BRAND_BOLT_PTS = "104,55 74,101 92,101 84,145 120,91 98,91";
const BRAND_SOLID_OP = [1, 0.85, 0.7, 0.85, 1, 0.7];
function BrandMark({
  size,
  style,
  variant,
  boltColor
}) {
  const s = size || 40;
  const solid = variant === "solid";
  const set = BRAND_FACETS[variant] || BRAND_FACETS.theme;
  const bolt = boltColor || (solid ? "#12405A" : BRAND_BOLT[variant] || BRAND_BOLT.theme);
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 200 200",
    style: style,
    "aria-label": BRANDING.name,
    role: "img"
  }, BRAND_FACET_PTS.map((pts, i) => React.createElement("polygon", {
    key: i,
    points: pts,
    fill: solid ? "#FFFFFF" : set[i],
    opacity: solid ? BRAND_SOLID_OP[i] : undefined
  })), React.createElement("polygon", {
    points: BRAND_BOLT_PTS,
    fill: bolt
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
  sub,
  variant,
  color,
  subColor
}) {
  const s = size || 46;
  const word = Math.round(s * (stack ? 0.27 : 0.49));
  const tag = Math.max(9, Math.round(word * 0.3));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: stack ? "column" : "row",
      alignItems: "center",
      gap: stack ? Math.round(s * 0.13) : 14,
      justifyContent: "center"
    }
  }, React.createElement(BrandMark, {
    size: s,
    variant: variant
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: stack ? "center" : "flex-start",
      gap: 2
    }
  }, React.createElement(BrandWord, {
    size: word,
    color: color,
    plusColor: variant === "solid" ? "#DFF7E4" : undefined
  }), React.createElement("div", {
    style: {
      fontFamily: "var(--brand-font)",
      fontSize: tag,
      letterSpacing: ".3em",
      textTransform: "uppercase",
      color: subColor || "var(--brand-muted)",
      fontWeight: 500,
      paddingLeft: ".3em"
    }
  }, sub || BRANDING.tagline)));
}
function brandHeadHTML(opts) {
  const o = opts || {};
  const px = o.size || 38;
  return '<div style="display:flex;align-items:center;gap:11px">' + '<span style="width:' + px + 'px;height:' + px + 'px;flex-shrink:0;display:block">' + BRAND_MARK_SVG + "</span>" + '<span><span style="display:block;white-space:nowrap;font-weight:700;font-size:' + Math.round(px * 0.55) + "px;letter-spacing:-.02em;color:" + BRANDING.ink + '">' + 'flash<span style="color:' + BRANDING.green + '">+</span>solar</span>' + '<span style="display:block;font-size:' + Math.max(7, Math.round(px * 0.21)) + "px;letter-spacing:.26em;color:" + BRANDING.muted + '">' + BRANDING.tagline + "</span></span></div>";
}
Object.assign(window, {
  BRANDING,
  BRAND_MARK_SVG,
  BrandMark,
  BrandWord,
  BrandLockup,
  brandHeadHTML
});