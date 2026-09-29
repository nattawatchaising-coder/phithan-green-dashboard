function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VC_W = 1000,
  VC_H = 580;
const VC_SCALE = 2;
const VC_FONT = "'IBM Plex Sans Thai', sans-serif";
const vcFont = (w, px) => w + " " + px + "px " + VC_FONT;
function vcFit(x, text, maxW, weight, px, min) {
  let p = px;
  x.font = vcFont(weight, p);
  while (p > (min || 12) && x.measureText(text).width > maxW) {
    p -= 1;
    x.font = vcFont(weight, p);
  }
  return p;
}
function vcLoadImg(src) {
  return new Promise(done => {
    if (!src) return done(null);
    const im = new Image();
    im.onload = () => done(im);
    im.onerror = () => done(null);
    im.src = src;
  });
}
function vcTitle(user) {
  const rs = (window.userRoles ? window.userRoles(user) : []) || [];
  const info = window.ROLE_INFO || {};
  const th = rs.map(r => (info[r] || {}).th).filter(Boolean);
  return th.length ? th.join(" · ") : "";
}
const vcEsc = v => String(v || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[;,]/g, m => "\\" + m);
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
  if (full && B.taxId) L.push("NOTE:" + vcEsc("เลขประจำตัวผู้เสียภาษี " + B.taxId));
  if (full && B.addrTH) L.push("ADR;TYPE=WORK:;;" + vcEsc(B.addrTH) + ";;;;");
  L.push("END:VCARD");
  return L.join("\r\n") + "\r\n";
}
async function vcDraw(user, avatarUrl) {
  const B = window.BRANDING || {};
  const cv = document.createElement("canvas");
  cv.width = VC_W * VC_SCALE;
  cv.height = VC_H * VC_SCALE;
  const x = cv.getContext("2d");
  x.scale(VC_SCALE, VC_SCALE);
  try {
    if (document.fonts) {
      await Promise.all([vcFont(400, 16), vcFont(600, 16), vcFont(700, 16)].map(f => document.fonts.load(f, "ก")));
      await document.fonts.ready;
    }
  } catch (e) {}
  const [logo, face] = await Promise.all([vcLoadImg(window.brandDocURL ? window.brandDocURL() : ""), vcLoadImg(avatarUrl)]);
  x.fillStyle = "#FFFFFF";
  x.fillRect(0, 0, VC_W, VC_H);
  const bar = x.createLinearGradient(0, 0, 0, VC_H);
  bar.addColorStop(0, B.green || "#22B36A");
  bar.addColorStop(1, B.deep || "#0A4D68");
  x.fillStyle = bar;
  x.fillRect(0, 0, 12, VC_H);
  let hx = 56;
  if (logo) {
    const h = 116,
      w = Math.round(logo.width * (h / logo.height));
    x.drawImage(logo, hx, 22, w, h);
    hx += w + 20;
  }
  const hw = 944 - hx;
  x.textBaseline = "alphabetic";
  x.fillStyle = B.ink || "#0F2B33";
  vcFit(x, B.legalTH || "", hw, 700, 58, 30);
  x.fillText(B.legalTH || "", hx, 86);
  x.fillStyle = B.muted || "#5B8A8A";
  vcFit(x, B.legal || "", hw, 600, 19, 13);
  x.fillText(B.legal || "", hx, 114);
  vcFit(x, B.desc || "", hw, 400, 17, 12);
  x.fillText(B.desc || "", hx, 139);
  x.strokeStyle = "#E3ECE8";
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(56, 164);
  x.lineTo(944, 164);
  x.stroke();
  const rs = (window.userRoles ? window.userRoles(user) : []) || [];
  const head = (window.ROLE_INFO || {})[rs[0]] || {
    color: B.leaf || "#1B9B75"
  };
  const cx = 116,
    cy = 250,
    r = 58;
  x.save();
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.closePath();
  x.fillStyle = head.color;
  x.fill();
  if (face) {
    x.clip();
    const s = Math.max(r * 2 / face.width, r * 2 / face.height);
    const w = face.width * s,
      h = face.height * s;
    x.drawImage(face, cx - w / 2, cy - h / 2, w, h);
  } else {
    x.fillStyle = "#FFFFFF";
    x.font = vcFont(700, 46);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(String(user.name || "?").slice(0, 1), cx, cy + 2);
    x.textAlign = "left";
    x.textBaseline = "alphabetic";
  }
  x.restore();
  const nm = String(user.name || "").trim();
  x.fillStyle = B.ink || "#0F2B33";
  vcFit(x, nm, 460, 700, 44, 24);
  x.fillText(nm, 200, 242);
  const title = vcTitle(user);
  if (title) {
    x.fillStyle = head.color;
    vcFit(x, title, 460, 600, 23, 15);
    x.fillText(title, 200, 278);
  }
  const rows = [];
  if (user.phone) rows.push(["โทร", String(user.phone).trim()]);
  if (user.email) rows.push(["อีเมล", String(user.email).trim()]);
  if (!rows.length) rows.push(["โทร", B.tel || ""]);
  let ry = 360;
  rows.forEach(([lb, v]) => {
    x.fillStyle = B.muted || "#5B8A8A";
    x.font = vcFont(600, 15);
    x.fillText(lb, 56, ry);
    x.fillStyle = B.ink || "#0F2B33";
    vcFit(x, v, 520, 600, 26, 15);
    x.fillText(v, 148, ry + 2);
    ry += 54;
  });
  const qz = 186,
    qx = 706,
    qy = 226;
  if (window.qrcode) {
    try {
      const q = window.qrcode(0, "M");
      q.addData(vcText(user, false), "Byte");
      q.make();
      const n = q.getModuleCount(),
        m = qz / n;
      x.fillStyle = "#FFFFFF";
      x.fillRect(qx, qy, qz, qz);
      x.fillStyle = "#0F2B33";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (q.isDark(i, j)) x.fillRect(qx + j * m, qy + i * m, m + 1, m + 1);
      }
    } catch (e) {}
  }
  x.fillStyle = B.muted || "#5B8A8A";
  x.font = vcFont(600, 15);
  x.textAlign = "center";
  x.fillText("สแกนเพื่อบันทึกลงรายชื่อ", qx + qz / 2, qy + qz + 26);
  x.textAlign = "left";
  const fh = 106;
  x.fillStyle = B.deep || "#0A4D68";
  x.fillRect(0, VC_H - fh, VC_W, fh);
  x.fillStyle = "rgba(255,255,255,.94)";
  x.font = vcFont(600, 17);
  x.fillText(B.addrTH || "", 56, VC_H - 60);
  x.fillStyle = "rgba(255,255,255,.74)";
  x.font = vcFont(400, 15);
  x.fillText("เลขประจำตัวผู้เสียภาษี " + (B.taxId || ""), 56, VC_H - 34);
  x.textAlign = "right";
  x.fillStyle = "rgba(255,255,255,.94)";
  x.font = vcFont(600, 17);
  x.fillText("โทร " + (B.tel || ""), VC_W - 56, VC_H - 60);
  x.fillStyle = "rgba(255,255,255,.74)";
  x.font = vcFont(400, 15);
  x.fillText(B.email || "", VC_W - 56, VC_H - 34);
  x.textAlign = "left";
  return cv;
}
const vcSlug = user => String((user || {}).name || "namecard").trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "namecard";
function vcSaveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function VcCardModal({
  user,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const av = window.useUserAvatar((user || {}).id);
  const box = React.useRef(null);
  const cvRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let dead = false;
    setReady(false);
    vcDraw(user, av.avatar).then(cv => {
      if (dead || !box.current) return;
      cvRef.current = cv;
      cv.style.width = "100%";
      cv.style.height = "auto";
      cv.style.display = "block";
      cv.style.borderRadius = "12px";
      box.current.innerHTML = "";
      box.current.appendChild(cv);
      setReady(true);
    });
    return () => {
      dead = true;
    };
  }, [user.name, user.phone, user.email, user.line, user.role, user.roles, av.avatar]);
  const savePng = () => {
    if (!cvRef.current) return;
    cvRef.current.toBlob(b => {
      if (b) vcSaveBlob(b, "นามบัตร " + vcSlug(user) + ".png");
    }, "image/png");
  };
  const saveVcf = () => {
    vcSaveBlob(new Blob([vcText(user, true)], {
      type: "text/vcard;charset=utf-8"
    }), vcSlug(user) + ".vcf");
  };
  const canShare = !!(navigator.canShare && navigator.share);
  const share = async () => {
    if (!cvRef.current) return;
    cvRef.current.toBlob(async b => {
      if (!b) return;
      const f = new File([b], "นามบัตร " + vcSlug(user) + ".png", {
        type: "image/png"
      });
      try {
        if (navigator.canShare({
          files: [f]
        })) await navigator.share({
          files: [f],
          title: "นามบัตร"
        });else vcSaveBlob(b, "นามบัตร " + vcSlug(user) + ".png");
      } catch (e) {}
    }, "image/png");
  };
  const thin = {
    padding: "10px 15px",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text-2)",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7
  };
  const empty = !user.phone && !user.email && !user.line;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      zIndex: 130,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(640px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E19\u0E32\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), React.createElement("div", {
    style: {
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, React.createElement("div", {
    ref: box,
    style: {
      borderRadius: 12,
      overflow: "hidden",
      background: "#FFFFFF",
      border: "1px solid var(--border)",
      minHeight: 120,
      boxShadow: "0 8px 26px rgba(8,20,14,.12)"
    }
  }), empty && React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "flex-start",
      padding: "11px 13px",
      borderRadius: 11,
      background: "#F59E0B14",
      border: "1px solid #F59E0B40"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)",
      lineHeight: 1.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23 \u0E2D\u0E35\u0E40\u0E21\u0E25 \u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E25\u0E19\u0E4C\u0E44\u0E2D\u0E14\u0E35 \u2014 \u0E19\u0E32\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E41\u0E17\u0E19 \u0E01\u0E23\u0E2D\u0E01\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E19\u0E32\u0E21\u0E1A\u0E31\u0E15\u0E23\u0E08\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E40\u0E2D\u0E07")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: savePng,
    disabled: !ready,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: ready ? "pointer" : "default",
      opacity: ready ? 1 : .5
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E39\u0E1B"), canShare && React.createElement("button", {
    onClick: share,
    disabled: !ready,
    style: thin
  }, React.createElement(Icon, {
    name: "link",
    size: 14
  }), " \u0E41\u0E0A\u0E23\u0E4C"), React.createElement("button", {
    onClick: saveVcf,
    style: thin
  }, React.createElement(Icon, {
    name: "download",
    size: 14
  }), " \u0E44\u0E1F\u0E25\u0E4C\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D (.vcf)")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E23\u0E39\u0E1B\u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D\u0E17\u0E32\u0E07\u0E44\u0E25\u0E19\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \xB7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E41\u0E01\u0E19\u0E04\u0E34\u0E27\u0E2D\u0E32\u0E23\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E0A\u0E37\u0E48\u0E2D\u0E01\u0E31\u0E1A\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E17\u0E31\u0E19\u0E17\u0E35 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E32\u0E21 \xB7 \u0E44\u0E1F\u0E25\u0E4C .vcf \u0E44\u0E27\u0E49\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E41\u0E01\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E31\u0E19"))));
}
Object.assign(window, {
  VcCardModal,
  vcText,
  vcDraw,
  VC_W,
  VC_H
});