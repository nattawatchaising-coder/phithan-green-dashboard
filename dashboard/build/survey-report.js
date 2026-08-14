const TH_MONTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function repDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.getDate() + " " + TH_MONTH[d.getMonth()] + " " + (d.getFullYear() + 543);
}
const _lbl = (list, v) => {
  const x = (list || []).find(o => o.value === v);
  return x ? x.label : v || "";
};
const _yn = v => v === "yes" ? "มี" : v === "no" ? "ไม่มี" : "";
function RepCheck({
  label,
  value
}) {
  const on = !!(value !== "" && value != null && String(value).trim());
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 7,
      fontSize: 11.5,
      lineHeight: 1.5,
      breakInside: "avoid"
    }
  }, React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 3,
      flexShrink: 0,
      marginTop: 2,
      display: "grid",
      placeItems: "center",
      background: on ? "var(--primary)" : "transparent",
      border: on ? "none" : "1.4px solid #B9C4BD"
    }
  }, on && React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, React.createElement("path", {
    d: "M20 6L9 17l-5-5"
  }))), React.createElement("span", {
    style: {
      color: on ? "var(--text-1)" : "var(--text-3)"
    }
  }, label, on && React.createElement("span", {
    style: {
      fontStyle: "italic",
      color: "var(--text-2)"
    }
  }, " (", value, ")")));
}
function RepGroup({
  icon,
  title,
  children
}) {
  return React.createElement("div", {
    style: {
      marginTop: 12,
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      fontWeight: 800,
      color: "var(--primary-dark)",
      marginBottom: 7
    }
  }, React.createElement("span", null, icon), title), React.createElement("div", {
    className: "sv-rep-grid2"
  }, children));
}
function RepSection({
  title,
  children
}) {
  return React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid var(--border)",
      paddingBottom: 6
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: "var(--primary)"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title)), children);
}
function RepCell({
  k,
  v
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "7px 10px",
      borderRight: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      background: "var(--surface2)"
    }
  }, k), React.createElement("div", {
    style: {
      padding: "7px 10px",
      borderBottom: "1px solid var(--border)",
      fontSize: 11.5,
      color: "var(--text-1)"
    }
  }, v || "-"));
}
function SurveyReport({
  job,
  photos,
  docs,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const s = job && job.survey || {};
  const shots = window.sortedShots(photos || {});
  const gps = s.gps && s.gps.lat ? s.gps.lat + ", " + s.gps.lng : "";
  const shotGroups = React.useMemo(() => {
    const out = [],
      by = {};
    shots.forEach(sh => {
      const c = (sh.cat || "").trim();
      if (!by[c]) {
        by[c] = {
          cat: c,
          shots: []
        };
        out.push(by[c]);
      }
      by[c].shots.push(sh);
    });
    return out;
  }, [photos]);
  const doPrint = () => {
    const old = document.title;
    document.title = "รายงานสำรวจ " + (job.code || "") + " " + (job.name || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const roofCond = _lbl(window.SURVEY_ROOF_COND, s.roofCondition);
  const structure = _lbl(window.SURVEY_PASS, s.structureOk);
  const birdNet = _lbl(window.SURVEY_BIRDNET, s.birdNet);
  const invLoc = _lbl(window.SURVEY_INV_LOC, s.inverterLoc);
  const mdbSpace = _lbl(window.SURVEY_MDB_SPACE, s.mdbSpace);
  const meter = [s.meterAuth, s.meterSize].filter(Boolean).join(" · ");
  const size = [s.sizeKw ? s.sizeKw + " kW" : "", s.phase ? "(" + s.phase + " Phase)" : ""].filter(Boolean).join(" ");
  return React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 140,
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
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, shots.length, " \u0E23\u0E39\u0E1B", (docs || []).length ? " · DATA SHEET " + docs.length + " ใบ" : "", " \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("button", {
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
      color: "#15211A",
      padding: isMobile ? "20px 16px" : "34px 38px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid var(--primary)",
      paddingBottom: 12
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 22,
      fontWeight: 800,
      color: "var(--text-1)",
      letterSpacing: "-.01em"
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "var(--text-3)",
      marginTop: 3
    }
  }, "SOLAR SITE SURVEY REPORT"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--primary-dark)",
      marginTop: 6
    }
  }, "PHITHAN GREEN")), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, React.createElement("div", null, "\u0E2A\u0E33\u0E23\u0E27\u0E08: ", repDate(s.startedAt)), React.createElement("div", null, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19: ", repDate(s.completedAt || s.updatedAt || s.startedAt)))), React.createElement("div", {
    className: "sv-rep-info",
    style: {
      marginTop: 16,
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden"
    }
  }, React.createElement(RepCell, {
    k: "\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23",
    v: job.name
  }), React.createElement(RepCell, {
    k: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    v: job.name
  }), React.createElement(RepCell, {
    k: "\u0E02\u0E19\u0E32\u0E14",
    v: size
  }), React.createElement(RepCell, {
    k: "Inverter",
    v: s.invModel
  }), React.createElement(RepCell, {
    k: "\u0E41\u0E1C\u0E07",
    v: s.panelModel
  }), React.createElement(RepCell, {
    k: "Monitoring",
    v: s.monitoring
  }), React.createElement(RepCell, {
    k: "Meter/CT",
    v: s.meterCt
  }), React.createElement(RepCell, {
    k: "\u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19",
    v: job.code
  }), React.createElement("div", {
    style: {
      padding: "7px 10px",
      borderRight: "1px solid var(--border)",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      background: "var(--surface2)"
    }
  }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), React.createElement("div", {
    style: {
      padding: "7px 10px",
      fontSize: 11.5,
      color: "var(--text-1)"
    }
  }, [job.address, job.province].filter(Boolean).join(" ") || "-", job.phone ? " · โทร " + job.phone : "")), React.createElement(RepSection, {
    title: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A"
  }, React.createElement(RepGroup, {
    icon: "\uD83C\uDFE0",
    title: "\u0E2A\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"
  }, React.createElement(RepCheck, {
    label: "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E48\u0E19\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E40\u0E0B\u0E25\u0E25\u0E4C",
    value: s.buildingType
  }), React.createElement(RepCheck, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    value: s.roofType
  }), React.createElement(RepCheck, {
    label: "\u0E2A\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    value: roofCond
  }), React.createElement(RepCheck, {
    label: "\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01",
    value: structure
  }), React.createElement(RepCheck, {
    label: "\u0E21\u0E35\u0E27\u0E31\u0E15\u0E16\u0E38\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E15\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E41\u0E2A\u0E07",
    value: (s.shadingTags || []).join(", ")
  }), React.createElement(RepCheck, {
    label: "\u0E15\u0E32\u0E02\u0E48\u0E32\u0E22\u0E01\u0E31\u0E19\u0E19\u0E01",
    value: birdNet
  })), React.createElement(RepGroup, {
    icon: "\u26A1",
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32"
  }, React.createElement(RepCheck, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    value: s.phase ? s.phase + " เฟส" : ""
  }), React.createElement(RepCheck, {
    label: "Main Breaker",
    value: s.mainBreaker
  }), React.createElement(RepCheck, {
    label: "\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E40\u0E14\u0E34\u0E21",
    value: s.mainCable
  }), React.createElement(RepCheck, {
    label: "\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    value: meter
  }), React.createElement(RepCheck, {
    label: "\u0E15\u0E39\u0E49 MDB",
    value: [s.mdbBrand, mdbSpace].filter(Boolean).join(" · ")
  }), React.createElement(RepCheck, {
    label: "\u0E40\u0E0B\u0E1F\u0E15\u0E35\u0E49\u0E04\u0E31\u0E15\u0E43\u0E19\u0E15\u0E39\u0E49",
    value: _yn(s.mdbSafety)
  }), React.createElement(RepCheck, {
    label: "\u0E40\u0E21\u0E19\u0E01\u0E31\u0E19\u0E14\u0E39\u0E14 (RCD / RCCB)",
    value: _yn(s.mdbRccb)
  }), React.createElement(RepCheck, {
    label: "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 MDB",
    value: s.mdbLoc
  }), React.createElement(RepCheck, {
    label: "\u0E08\u0E38\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    value: invLoc
  }), React.createElement(RepCheck, {
    label: "\u0E1E\u0E34\u0E01\u0E31\u0E14 GPS \u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    value: gps
  })), window.SURVEY_CABLE_LEGS.some(l => +s[l.key] > 0) && React.createElement(RepGroup, {
    icon: "\uD83D\uDCCF",
    title: "ระยะเดินสาย (รวม " + window.cableTotal(s) + " ม.)"
  }, window.SURVEY_CABLE_LEGS.map(l => React.createElement(RepCheck, {
    key: l.key,
    label: l.th,
    value: +s[l.key] > 0 ? s[l.key] + " ม." : ""
  }))), (s.specials || []).filter(Boolean).length > 0 && React.createElement(RepGroup, {
    icon: "\u26A0\uFE0F",
    title: "\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E40\u0E28\u0E29"
  }, (s.specials || []).filter(Boolean).map((v, i) => React.createElement(RepCheck, {
    key: i,
    label: "อื่นๆ (" + (i + 1) + ")",
    value: v
  })))), (s.note || s.shadingNote) && React.createElement(RepSection, {
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"
  }, React.createElement("div", {
    style: {
      marginTop: 10,
      background: "#FFF8F1",
      border: "1px solid #F5E3D3",
      borderRadius: 8,
      padding: "12px 14px",
      fontSize: 11.5,
      lineHeight: 1.75,
      whiteSpace: "pre-wrap",
      color: "var(--text-1)"
    }
  }, [s.note, s.shadingNote ? "เงาบัง: " + s.shadingNote : ""].filter(Boolean).join("\n"))), shots.length > 0 && React.createElement(RepSection, {
    title: "ภาพประกอบการสำรวจ (" + shots.length + " รูป)"
  }, React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, shotGroups.map(g => React.createElement(React.Fragment, {
    key: g.cat || "_"
  }, g.cat && shotGroups.length > 1 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--primary-dark)",
      marginTop: 4,
      breakInside: "avoid"
    }
  }, "\u25B8 ", g.cat), g.shots.map(sh => {
    const i = shots.indexOf(sh);
    return (React.createElement("div", {
        key: sh.key,
        className: "sv-rep-shot",
        "data-p": sh.ah > sh.aw ? "1" : "0",
        style: {
          border: "1px solid var(--border)",
          borderRadius: 9,
          padding: 10,
          breakInside: "avoid"
        }
      }, React.createElement("div", {
        style: {
          fontSize: 11.5,
          fontWeight: 800,
          color: "var(--text-1)",
          marginBottom: 7
        }
      }, i + 1, ". ", window.shotTitle(sh)), React.createElement("div", {
        style: {
          textAlign: "center"
        }
      }, React.createElement("div", {
        style: {
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
          lineHeight: 0,
          borderRadius: 6,
          overflow: "hidden"
        }
      }, React.createElement("img", {
        src: sh.dataUrl,
        alt: window.shotTitle(sh)
      }), React.createElement(window.AnnOverlay, {
        ann: sh.ann,
        aw: sh.aw,
        ah: sh.ah
      }))), sh.caption && React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--text-2)",
          marginTop: 7
        }
      }, sh.caption))
    );
  }))))), (docs || []).length > 0 && React.createElement(React.Fragment, null, (docs || []).map(d => React.createElement("div", {
    key: d.role,
    className: "sv-rep-ds",
    style: {
      breakBefore: "page",
      pageBreakBefore: "always",
      marginTop: 22
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid var(--border)",
      paddingBottom: 6,
      marginBottom: 12
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: "var(--primary)"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "DATA SHEET \u2014 ", d.role), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-2)",
      marginLeft: "auto"
    }
  }, d.name)), /^image\//.test(d.doc.type || "") ? React.createElement("img", {
    src: d.doc.data,
    alt: d.name,
    style: {
      width: "100%",
      display: "block",
      borderRadius: 8,
      border: "1px solid var(--border)"
    }
  }) : React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-2)",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, "\u0E41\u0E19\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E22\u0E01: ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, d.doc.name), " (\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32)")))), React.createElement("div", {
    style: {
      marginTop: 22,
      paddingTop: 12,
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 11,
      color: "var(--text-2)",
      breakInside: "avoid"
    }
  }, React.createElement("div", null, "\u0E1C\u0E39\u0E49\u0E2A\u0E33\u0E23\u0E27\u0E08: ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, s.byName || "-")), React.createElement("div", null, "\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19: ", repDate(new Date().toISOString())))));
}
function SurveyReportHost({
  job,
  stock,
  onClose
}) {
  const media = window.useSurveyPhotos(job ? job.id : null);
  const s = job && job.survey || {};
  const items = stock && stock.items || [];
  const withDoc = React.useMemo(() => {
    const names = [{
      role: "Inverter",
      name: s.invModel
    }, {
      role: "แผงโซลาร์",
      name: s.panelModel
    }];
    return names.map(x => {
      const nm = String(x.name || "").trim();
      if (!nm) return null;
      const it = items.find(i => (i.name || "").trim() === nm && i.doc);
      return it ? {
        role: x.role,
        item: it
      } : null;
    }).filter(Boolean);
  }, [items, s.invModel, s.panelModel]);
  const [docs, setDocs] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    if (!withDoc.length || !stock || !stock.loadDoc) {
      setDocs([]);
      return;
    }
    Promise.all(withDoc.map(w => stock.loadDoc(w.item.id).then(d => d && d.data ? {
      role: w.role,
      name: w.item.name,
      doc: d
    } : null).catch(() => null))).then(list => {
      if (!dead) setDocs(list.filter(Boolean));
    });
    return () => {
      dead = true;
    };
  }, [withDoc]);
  if (!job) return null;
  return React.createElement(SurveyReport, {
    job: job,
    photos: media.photos,
    docs: docs,
    onClose: onClose
  });
}
Object.assign(window, {
  SurveyReport,
  SurveyReportHost,
  repDate
});