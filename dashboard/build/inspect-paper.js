const RP_INK = "#15211A";
const RP_LINE = "#C9D5CE";
const RP_SOFT = "#5A6B62";
const rpDate = v => !v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10);
const rpDateTime = v => !v ? "" : window.drDateTH ? window.drDateTH(String(v).replace("T", " "), true) : String(v).replace("T", " ");
function RpFill({
  value,
  minWidth
}) {
  return React.createElement("span", {
    style: {
      display: "inline-block",
      minWidth: minWidth || 120,
      borderBottom: "1px dotted " + RP_LINE,
      padding: "0 4px 1px",
      fontSize: 11,
      color: RP_INK,
      whiteSpace: "pre-wrap"
    }
  }, value || " ");
}
function RpRow({
  en,
  th,
  value,
  minWidth
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 7
    }
  }, React.createElement("span", {
    style: {
      flexShrink: 0,
      minWidth: 178
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: RP_INK
    }
  }, en), th ? React.createElement("span", {
    style: {
      fontSize: 10,
      color: RP_SOFT
    }
  }, " (", th, ")") : null), React.createElement("span", {
    style: {
      fontSize: 11,
      color: RP_SOFT,
      flexShrink: 0
    }
  }, ":"), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(RpFill, {
    value: value,
    minWidth: minWidth
  })));
}
function RpSign({
  en,
  th,
  role,
  name
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
      fontWeight: 700,
      color: RP_INK
    }
  }, en), React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: RP_SOFT,
      marginBottom: 30
    }
  }, "(", th, ")"), React.createElement("div", {
    style: {
      borderTop: "1px solid " + RP_LINE,
      paddingTop: 5,
      fontSize: 10,
      color: RP_INK,
      minHeight: 15
    }
  }, name || " "), React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: RP_SOFT
    }
  }, role), React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: RP_SOFT,
      marginTop: 7
    }
  }, "\u2026\u2026\u2026. / \u2026\u2026\u2026. / \u2026\u2026\u2026."));
}
function InspectionPaper({
  job,
  rec,
  photos,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const B = window.BRANDING || {};
  const j = job || {};
  const r = rec || {};
  const list = photos || [];
  const res = (window.IR_RESULT_BY || {})[r.result] || null;
  const doPrint = () => {
    const old = document.title;
    document.title = (r.no || "IR") + " " + (r.kind || "Inspection Report") + " " + (j.code || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const pages = [];
  for (let i = 0; i < list.length; i += 6) pages.push(list.slice(i, i + 6));
  const headBar = (title, rev) => React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 14,
      flexWrap: "wrap",
      borderBottom: "2px solid " + RP_INK,
      paddingBottom: 9,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 7
    }
  }, window.BrandMark ? React.createElement(window.BrandMark, {
    size: 26,
    variant: "light"
  }) : null, window.BrandWord ? React.createElement(window.BrandWord, {
    size: 18,
    color: B.ink || RP_INK
  }) : null), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: RP_INK,
      letterSpacing: "-.2px"
    }
  }, title), r.kind ? React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: RP_INK,
      marginTop: 1
    }
  }, r.kind) : null, React.createElement("div", {
    style: {
      fontSize: 10,
      color: RP_SOFT,
      marginTop: 2
    }
  }, B.legal || "", j.code ? " · " + j.code : "", r.no ? " · " + r.no : "")), React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "right",
      fontSize: 9.5,
      color: RP_SOFT,
      lineHeight: 1.6
    }
  }, B.tel ? React.createElement("div", null, "\u0E42\u0E17\u0E23 ", B.tel) : null, B.email ? React.createElement("div", null, B.email) : null, React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, "Rev. ", React.createElement("b", {
    style: {
      color: RP_INK
    }
  }, rev)), React.createElement("div", null, "Approved By: ", React.createElement("b", {
    style: {
      color: RP_INK
    }
  }, r.approvedBy || "—"))));
  return React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 170,
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
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, r.no || "ใบตรวจ", " \xB7 ", r.kind || "Inspection Report"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, list.length ? list.length + " รูป · " + pages.length + " หน้ารูป" : "ยังไม่มีรูป — ใบรายงานรูปถ่ายจะไม่ถูกพิมพ์", " \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("button", {
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
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: RP_INK,
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, headBar("Inspection Report", "00"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 26px",
      marginBottom: 10
    }
  }, React.createElement(RpRow, {
    en: "To",
    th: "\u0E40\u0E23\u0E35\u0E22\u0E19",
    value: r.to
  }), React.createElement(RpRow, {
    en: "Project Name",
    th: "\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23",
    value: r.project || j.name
  }), React.createElement(RpRow, {
    en: "Contractor",
    th: "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32",
    value: r.contractor
  }), React.createElement(RpRow, {
    en: "Request Date",
    th: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D",
    value: rpDate(r.reqDate)
  })), React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 5
    }
  }, "Request to inspect ", React.createElement("span", {
    style: {
      fontSize: 10,
      color: RP_SOFT,
      fontWeight: 500
    }
  }, "(\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A)")), React.createElement("div", {
    style: {
      border: "1px solid " + RP_LINE,
      borderRadius: 4,
      padding: "9px 11px",
      fontSize: 11,
      minHeight: 52,
      whiteSpace: "pre-wrap",
      lineHeight: 1.7
    }
  }, r.reqItems || " ")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 26px",
      marginBottom: 10
    }
  }, React.createElement(RpRow, {
    en: "Inspection Date and Time",
    th: "\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
    value: rpDateTime(r.inspAt)
  }), React.createElement(RpRow, {
    en: "Ref IR No.",
    th: "\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E08\u0E32\u0E01 IR \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48",
    value: r.refIr
  }), React.createElement(RpRow, {
    en: "Others",
    th: "\u0E2D\u0E37\u0E48\u0E19 \u0E46",
    value: r.others
  }), React.createElement(RpRow, {
    en: "Request by",
    th: "\u0E02\u0E2D\u0E42\u0E14\u0E22",
    value: r.reqBy
  })), React.createElement("div", {
    style: {
      border: "1px solid " + RP_LINE,
      borderRadius: 4,
      padding: "10px 12px",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 8
    }
  }, "The result of inspection ", React.createElement("span", {
    style: {
      fontSize: 10,
      color: RP_SOFT,
      fontWeight: 500
    }
  }, "(\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A)")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 22,
      flexWrap: "wrap"
    }
  }, (window.IR_RESULTS || []).map(o => {
    const on = r.result === o.key;
    return React.createElement("span", {
      key: o.key,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 11
      }
    }, React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        border: "1px solid " + RP_INK,
        display: "inline-grid",
        placeItems: "center",
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1
      }
    }, on ? "✓" : " "), o.en, " (", o.th, ")");
  })), res && res.key === "others" && r.resultOther ? React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 8
    }
  }, "\u0E23\u0E30\u0E1A\u0E38: ", r.resultOther) : null), React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      marginBottom: 5
    }
  }, "Note ", React.createElement("span", {
    style: {
      fontSize: 10,
      color: RP_SOFT,
      fontWeight: 500
    }
  }, "(\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38)")), React.createElement("div", {
    style: {
      border: "1px solid " + RP_LINE,
      borderRadius: 4,
      padding: "9px 11px",
      fontSize: 11,
      minHeight: 60,
      whiteSpace: "pre-wrap",
      lineHeight: 1.7
    }
  }, r.note || " ")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }
  }, React.createElement(RpSign, {
    en: "Issue By",
    th: "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A",
    role: "EPC",
    name: r.issueBy
  }), React.createElement(RpSign, {
    en: "Inspected By",
    th: "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E42\u0E14\u0E22",
    role: "EPC",
    name: r.inspectedBy
  }), React.createElement(RpSign, {
    en: "Approved By",
    th: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22",
    role: "Project Manager",
    name: r.approvedBy
  }), React.createElement(RpSign, {
    en: "Approved by Client",
    th: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    role: "Customer",
    name: r.clientBy
  })), pages.map((page, pi) => React.createElement("div", {
    key: pi,
    style: {
      breakBefore: "page",
      pageBreakBefore: "always",
      paddingTop: 26
    }
  }, headBar("Photo Report", "00"), React.createElement("div", {
    style: {
      fontSize: 11,
      marginBottom: 10
    }
  }, "PROJECT : ", React.createElement("b", null, r.project || j.name || "—"), j.address ? React.createElement("span", {
    style: {
      color: RP_SOFT
    }
  }, " \xB7 ", j.address) : null, pages.length > 1 ? React.createElement("span", {
    style: {
      color: RP_SOFT
    }
  }, " \xB7 \u0E2B\u0E19\u0E49\u0E32\u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48 ", pi + 1, "/", pages.length) : null), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, page.map((p, i) => React.createElement("div", {
    key: p.id,
    style: {
      border: "1px solid " + RP_LINE,
      borderRadius: 4,
      overflow: "hidden",
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "รูปประกอบการตรวจ",
    style: {
      width: "100%",
      height: 186,
      objectFit: "cover",
      display: "block",
      background: "#EEF3F3"
    }
  }), React.createElement("div", {
    style: {
      padding: "6px 9px",
      fontSize: 10,
      color: RP_INK,
      borderTop: "1px solid " + RP_LINE,
      minHeight: 26
    }
  }, React.createElement("b", {
    style: {
      color: RP_SOFT
    }
  }, pi * 6 + i + 1, "."), " ", p.cap || " ")))), pi === pages.length - 1 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 20,
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }
  }, React.createElement(RpSign, {
    en: "Inspected by",
    th: "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E42\u0E14\u0E22",
    role: "EPC",
    name: r.inspectedBy
  }), React.createElement(RpSign, {
    en: "Approved by",
    th: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22",
    role: B.legal || "Contractor",
    name: r.approvedBy
  }), React.createElement(RpSign, {
    en: "Approved by Client",
    th: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    role: "Client",
    name: r.clientBy
  }))))));
}
Object.assign(window, {
  InspectionPaper,
  RpRow,
  RpSign,
  RpFill
});