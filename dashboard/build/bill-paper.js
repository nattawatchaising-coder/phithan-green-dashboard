const BP_INK = "#15211A";
const BP_LINE = "#C9D5CE";
const BP_SOFT = "#5A6B62";
const BP_ACCENT = "#6366F1";
function useBlPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}
const bpDate = v => !v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10);
function BpHead({
  compact
}) {
  const B = window.BRANDING || {};
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid " + BP_INK,
      paddingBottom: compact ? 7 : 10,
      marginBottom: compact ? 10 : 16
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, window.BrandDoc ? React.createElement(window.BrandDoc, {
    height: compact ? 36 : 46,
    name: false
  }) : null, React.createElement("div", {
    style: {
      minWidth: 0,
      lineHeight: 1.55
    }
  }, React.createElement("div", {
    style: {
      fontSize: compact ? 12 : 13,
      fontWeight: 800,
      color: BP_INK
    }
  }, B.legal), B.legalTH ? React.createElement("div", {
    style: {
      fontSize: compact ? 9.5 : 10.5,
      color: BP_SOFT
    }
  }, B.legalTH) : null, !compact && B.addrTH ? React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: BP_SOFT
    }
  }, B.addrTH) : null, !compact && B.taxId ? React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: BP_SOFT
    }
  }, "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 ", B.taxId) : null)), React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "right",
      fontSize: 9.5,
      color: BP_SOFT,
      lineHeight: 1.7
    }
  }, B.tel ? React.createElement("div", null, "\u0E42\u0E17\u0E23 ", B.tel) : null, B.email ? React.createElement("div", null, B.email) : null));
}
function bpQty(it) {
  const q = (it || {}).qty;
  const n = q === "" || q == null ? null : +q;
  return n != null && isFinite(n) && n > 0 ? (Math.round(n * 100) / 100).toLocaleString("en-US") : "";
}
function BpSign({
  role,
  who,
  pad,
  date
}) {
  return React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: BP_SOFT,
      marginBottom: pad == null ? 46 : pad
    }
  }, "\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D"), React.createElement("div", {
    style: {
      borderTop: "1px solid " + BP_LINE,
      paddingTop: 5,
      fontSize: 10.5,
      fontWeight: 700,
      color: BP_INK,
      minHeight: 15
    }
  }, role), React.createElement("div", {
    style: {
      fontSize: 11,
      color: BP_SOFT,
      marginTop: 4,
      lineHeight: 1.9
    }
  }, "(.........................................)"), who ? React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: BP_SOFT,
      marginTop: 3,
      wordBreak: "break-word"
    }
  }, who) : null, date !== false ? React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: BP_SOFT,
      marginTop: 8
    }
  }, "\u2026\u2026\u2026. / \u2026\u2026\u2026. / \u2026\u2026\u2026.") : null);
}
function BlDeliveryPaper({
  job,
  bill,
  row,
  photos,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [part, setPart] = React.useState("all");
  useBlPrintBody();
  const B = window.BRANDING || {};
  const j = job || {};
  const b = bill || {};
  const r = row || {};
  const list = (photos || []).filter(p => p && p.dataUrl);
  const st = window.blStatusOf(r.status);
  const amount = window.blR2(r.amount);
  const rate = +b.vatRate || 0;
  const base = rate > 0 ? window.blR2(amount / (1 + rate / 100)) : amount;
  const vat = window.blR2(amount - base);
  const kwp = +b.kwp || +j.kw || 0;
  const site = [j.address, j.province].filter(Boolean).join(" ");
  const place = [j.name, site].filter(Boolean).join(" ");
  const docNo = r.docNo || window.blDocNo(j, r);
  const items = window.blItemsUsed(r);
  const doPrint = () => {
    const old = document.title;
    document.title = docNo + " วางบิลงวดที่ " + (r.n || 1) + " " + (j.code || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const groups = window.blPhotoGroups(r, list);
  const pages = [];
  groups.forEach(g => {
    const n = Math.ceil(g.photos.length / 4);
    for (let i = 0; i < g.photos.length; i += 4) {
      pages.push({
        head: g.head,
        date: g.date,
        shots: g.photos.slice(i, i + 4),
        sub: i / 4 + 1,
        subN: n
      });
    }
  });
  const paper = {
    maxWidth: 900,
    margin: "0 auto",
    background: "#fff",
    color: BP_INK,
    padding: isMobile ? "20px 16px" : "30px 34px",
    borderRadius: isMobile ? 0 : 12,
    boxShadow: "0 20px 60px rgba(8,20,14,.28)"
  };
  const tab = (id, label) => React.createElement("button", {
    key: id,
    onClick: () => setPart(id),
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid " + (part === id ? BP_ACCENT : "var(--border-strong)"),
      background: part === id ? BP_ACCENT + "18" : "var(--surface)",
      color: part === id ? BP_ACCENT : "var(--text-2)"
    }
  }, label);
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 210,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 150
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, docNo, " \xB7 \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", r.n || 1), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, j.code || "-", " \xB7 ", window.sBaht(amount), " \u0E1A\u0E32\u0E17 \xB7 ", st.th)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, tab("all", "ทั้งชุด"), tab("letter", "เฉพาะใบแจ้งส่งมอบ"), tab("photos", "เฉพาะรูป")), React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), part !== "photos" && React.createElement("div", {
    className: "sv-rep-paper",
    style: paper
  }, React.createElement("div", {
    className: "bl-page"
  }, React.createElement(BpHead, null), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      fontSize: 11,
      color: BP_SOFT,
      lineHeight: 1.8,
      marginBottom: 4
    }
  }, React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("div", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", React.createElement("b", {
    style: {
      color: BP_INK,
      fontFamily: "var(--mono)"
    }
  }, docNo)), React.createElement("div", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ", React.createElement("b", {
    style: {
      color: BP_INK
    }
  }, bpDate(r.docDate) || "…………………………")))), React.createElement("div", {
    style: {
      textAlign: "center",
      margin: "6px 0 18px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: BP_INK,
      letterSpacing: "-.2px"
    }
  }, "\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E41\u0E08\u0E49\u0E07\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", r.n || 1), React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "WORK DELIVERY & PAYMENT NOTICE")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: BP_INK,
      lineHeight: 2,
      marginBottom: 14
    }
  }, React.createElement("div", null, React.createElement("b", {
    style: {
      display: "inline-block",
      minWidth: 58
    }
  }, "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07"), " ", window.blSubjectOf(r)), React.createElement("div", null, React.createElement("b", {
    style: {
      display: "inline-block",
      minWidth: 58
    }
  }, "\u0E40\u0E23\u0E35\u0E22\u0E19"), " ", j.name || "…………………………"), React.createElement("div", null, React.createElement("b", {
    style: {
      display: "inline-block",
      minWidth: 58
    }
  }, "\u0E2D\u0E49\u0E32\u0E07\u0E16\u0E36\u0E07"), " ", b.ref || (b.quoteNo ? "ใบเสนอราคาเลขที่ " + b.quoteNo : "…………………………"))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: BP_INK,
      lineHeight: 2,
      textIndent: 38,
      marginBottom: 10
    }
  }, "\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48 ", B.legalTH || B.legal, " \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E08\u0E32\u0E01 ", j.name || "…………………………", " ", "\u0E43\u0E2B\u0E49\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E41\u0E2A\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C", kwp > 0 ? " ขนาดกำลังการผลิต " + kwp + " กิโลวัตต์" : "", place ? " ณ " + place : "", " ", "\u0E17\u0E32\u0E07", B.legalTH || B.legal, " \u0E44\u0E14\u0E49\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E07\u0E32\u0E19\u0E43\u0E19\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", r.n || 1, " \u0E41\u0E25\u0E49\u0E27\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E14\u0E49\u0E27\u0E22\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E14\u0E31\u0E07\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      margin: "0 0 14px 38px"
    }
  }, items.length ? items.map((it, i) => React.createElement("div", {
    key: it.id || i,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 11.5,
      color: BP_INK,
      lineHeight: 1.8,
      marginBottom: 3
    }
  }, React.createElement("span", {
    style: {
      flexShrink: 0,
      fontWeight: 700,
      minWidth: 18
    }
  }, i + 1, "."), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, it.text), bpQty(it) ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 40,
      color: BP_SOFT
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 58,
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, bpQty(it)), React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 52
    }
  }, it.unit || "")) : null)) : React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#B04A3A"
    }
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49 \u2014")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: BP_INK,
      lineHeight: 2,
      textIndent: 38,
      marginBottom: 14
    }
  }, "\u0E08\u0E36\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E21\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E42\u0E1B\u0E23\u0E14\u0E1E\u0E34\u0E08\u0E32\u0E23\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19 \u0E41\u0E25\u0E30\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E04\u0E48\u0E32\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48 ", r.n || 1, " ", "\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 ", window.sBaht(amount), " \u0E1A\u0E32\u0E17 (", window.ecBahtText ? window.ecBahtText(amount) : "", ") \u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E19\u0E44\u0E27\u0E49 \u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E08\u0E49\u0E32\u0E07\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19\u0E08\u0E49\u0E32\u0E07\u0E41\u0E25\u0E30\u0E1C\u0E39\u0E49\u0E27\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07 \u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23\u0E14\u0E31\u0E07\u0E01\u0E25\u0E48\u0E32\u0E27\u0E44\u0E14\u0E49\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27"), React.createElement("div", {
    className: "bl-foot",
    style: {
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: 6
    }
  }, React.createElement("div", {
    style: {
      minWidth: 262,
      border: "1px solid " + BP_LINE,
      borderRadius: 10,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "8px 12px",
      background: "#F7FAF9"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: BP_INK
    }
  }, "\u0E22\u0E2D\u0E14\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49", rate > 0 ? " (รวมภาษีมูลค่าเพิ่ม " + rate + "%)" : ""), React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: BP_INK,
      fontFamily: "var(--mono)"
    }
  }, window.sBaht(amount))), rate > 0 && React.createElement("div", {
    style: {
      padding: "6px 12px",
      fontSize: 9.5,
      color: BP_SOFT,
      lineHeight: 1.75,
      borderTop: "1px solid #ECF1EE"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", null, "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, window.sBaht(base))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between"
    }
  }, React.createElement("span", null, "\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 ", rate, "%"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, window.sBaht(vat)))))), React.createElement("div", {
    style: {
      fontSize: 9,
      color: BP_SOFT,
      marginBottom: 20
    }
  }, "* \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 30,
      paddingTop: 18
    }
  }, React.createElement(BpSign, {
    role: "\u0E1C\u0E39\u0E49\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19",
    who: B.legalTH || B.legal
  }), React.createElement(BpSign, {
    role: "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19",
    who: j.name || ""
  }))))), part !== "letter" && pages.map((pg, pi) => React.createElement("div", {
    key: pi,
    className: "sv-rep-paper" + (part === "photos" && pi === 0 ? "" : " bl-sheet"),
    style: Object.assign({}, paper, {
      marginTop: isMobile ? 12 : 16
    })
  }, React.createElement("div", {
    className: "bl-page"
  }, React.createElement(BpHead, {
    compact: true
  }), React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: BP_INK
    }
  }, "\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", r.n || 1, " \u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontSize: 10,
      color: BP_SOFT,
      marginTop: 2
    }
  }, [j.code, j.name].filter(Boolean).join(" · "), pages.length > 1 ? " · แผ่นที่ " + (pi + 1) + "/" + pages.length : "")), (pg.head || pg.date) && React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 12,
      fontWeight: 700,
      color: BP_INK,
      borderTop: "1px solid " + BP_LINE,
      borderBottom: "1px solid " + BP_LINE,
      padding: "7px 0",
      marginBottom: 12
    }
  }, pg.head, pg.date ? " ณ วันที่ " + bpDate(pg.date) : "", pg.subN > 1 ? React.createElement("span", {
    style: {
      fontWeight: 600,
      color: BP_SOFT
    }
  }, " (", pg.sub, "/", pg.subN, ")") : null), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginBottom: 16
    }
  }, pg.shots.map(p => React.createElement("div", {
    key: p.id,
    className: "bl-shot",
    style: {
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      border: "1px solid " + BP_LINE,
      borderRadius: 8,
      overflow: "hidden",
      background: "#F3F6F5"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "",
    style: {
      display: "block",
      width: "100%"
    }
  })), p.cap ? React.createElement("div", {
    style: {
      fontSize: 10,
      color: BP_SOFT,
      marginTop: 4,
      lineHeight: 1.5
    }
  }, p.cap) : null))), React.createElement("div", {
    className: "bl-foot",
    style: {
      display: "flex",
      gap: 40,
      paddingTop: 14,
      breakInside: "avoid",
      justifyContent: "center"
    }
  }, React.createElement(BpSign, {
    role: "\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23",
    who: j.name || "",
    pad: 38,
    date: false
  }), React.createElement(BpSign, {
    role: "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E08\u0E49\u0E32\u0E07",
    who: B.legalTH || B.legal,
    pad: 38,
    date: false
  }))))), part !== "letter" && !pages.length && React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      maxWidth: 900,
      margin: "14px auto 0",
      padding: "14px 16px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      fontSize: 12.5,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E41\u0E19\u0E1A\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A \u2014 \u0E40\u0E1B\u0E34\u0E14 \u201C\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19\u201D \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21"), !isMobile && React.createElement("div", {
    style: {
      height: 24
    }
  })), document.body);
}
Object.assign(window, {
  BlDeliveryPaper,
  useBlPrintBody,
  BpHead,
  BpSign
});