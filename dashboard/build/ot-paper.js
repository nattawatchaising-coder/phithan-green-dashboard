const tmHrDec = mins => (Math.round((+mins || 0) / 60 * 100) / 100).toFixed(2);
function tmOtByPerson(rows, users, cfg) {
  const map = {};
  (rows || []).forEach(r => {
    if (!r) return;
    const k = r.userId || "name:" + (r.userName || "ไม่ระบุชื่อ");
    if (!map[k]) map[k] = {
      id: r.userId || null,
      name: window.tmNameOf(users, r.userId, r.userName) || "ไม่ระบุชื่อ",
      rows: [],
      mins: 0,
      minsApproved: 0,
      minsWaiting: 0,
      payApproved: 0,
      payWaiting: 0
    };
    const g = map[k];
    g.rows.push(r);
    const m = +r.mins || 0;
    const pay = window.tmOtPayMins(r, cfg);
    g.mins += m;
    if (r.status === "approved") {
      g.minsApproved += m;
      g.payApproved += pay;
    } else if (r.status === "draft" || r.status === "sent") {
      g.minsWaiting += m;
      g.payWaiting += pay;
    }
  });
  const out = Object.keys(map).map(k => map[k]);
  out.forEach(g => g.rows.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.from || "").localeCompare(String(b.from || ""))));
  out.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  return out;
}
function TmOtPaper({
  person,
  period,
  rows,
  jobs,
  users,
  cfg,
  byName,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const list = React.useMemo(() => (rows || []).slice().sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.from || "").localeCompare(String(b.from || ""))), [rows]);
  const jobName = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach(j => {
      if (j && j.code) m[String(j.code)] = j.name || "";
      if (j && j.id) m["#" + j.id] = j.name || "";
    });
    return rec => m[String(rec.jobCode || "")] || m["#" + rec.jobId] || "";
  }, [jobs]);
  const sum = React.useMemo(() => {
    let approved = 0,
      waiting = 0,
      rejected = 0,
      payApproved = 0,
      payWaiting = 0;
    list.forEach(o => {
      const m = +o.mins || 0;
      const pay = window.tmOtPayMins(o, cfg);
      if (o.status === "approved") {
        approved += m;
        payApproved += pay;
      } else if (o.status === "rejected" || o.status === "cancelled") rejected += m;else {
        waiting += m;
        payWaiting += pay;
      }
    });
    return {
      approved: approved,
      waiting: waiting,
      rejected: rejected,
      payApproved: payApproved,
      payWaiting: payWaiting
    };
  }, [list, cfg]);
  const doPrint = () => {
    const old = document.title;
    document.title = "ใบสรุป OT " + (person && person.name ? person.name : "") + " " + window.tmPeriodTH(period);
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const th = {
    textAlign: "center",
    padding: "6px 7px",
    fontSize: 10,
    fontWeight: 700,
    color: "#FFFFFF",
    background: "#1B9B75",
    border: "1px solid #C9D5CE",
    whiteSpace: "nowrap"
  };
  const td = {
    padding: "6px 7px",
    fontSize: 10.5,
    color: "#15211A",
    border: "1px solid #DCE4DF",
    textAlign: "center",
    verticalAlign: "middle"
  };
  const tdL = Object.assign({}, td, {
    textAlign: "left"
  });
  return React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
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
  }, "\u0E43\u0E1A\u0E2A\u0E23\u0E38\u0E1B OT \xB7 ", (person || {}).name || "-"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, window.tmPeriodTH(period), " \xB7 ", list.length, " \u0E43\u0E1A \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("button", {
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
      padding: isMobile ? "20px 16px" : "30px 34px",
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
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, "\u0E43\u0E1A\u0E2A\u0E23\u0E38\u0E1B\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "OVERTIME SUMMARY \u2014 FOR SUPERVISOR APPROVAL"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandDoc, {
    height: 40
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11,
      color: "#4A5A51",
      lineHeight: 1.75
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "#15211A"
    }
  }, (person || {}).name || "-"), React.createElement("div", null, "\u0E23\u0E2D\u0E1A ", window.tmPeriodTH(period)), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, list.length, " \u0E43\u0E1A"))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(TmPRow, {
    k: "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25",
    v: (person || {}).name || "-"
  }), React.createElement(TmPRow, {
    k: "\u0E23\u0E2D\u0E1A\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14",
    v: window.tmPeriodTH(period)
  }), React.createElement(TmPRow, {
    k: "\u0E23\u0E27\u0E21\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27",
    v: window.tmDur(sum.approved) + "  (" + tmHrDec(sum.approved) + " ชม.)"
  }), React.createElement(TmPRow, {
    k: "\u0E23\u0E27\u0E21\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07",
    v: tmHrDec(sum.payApproved) + " ชม.  (คูณอัตราแต่ละประเภทแล้ว)"
  }), React.createElement(TmPRow, {
    k: "\u0E22\u0E31\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A",
    v: sum.waiting ? window.tmDur(sum.waiting) + "  (" + tmHrDec(sum.waiting) + " ชม.)" : "—"
  }), React.createElement(TmPRow, {
    k: "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    v: byName || "-"
  }), React.createElement(TmPRow, {
    k: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    v: window.drDateTH(window.drToday(), true)
  })), React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid #DCE4DF",
      paddingBottom: 5,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 99,
      background: "#1B9B75"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "#15211A"
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49")), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 26
    })
  }, "#"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 92
    })
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 52
    })
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 52
    })
  }, "\u0E16\u0E36\u0E07"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 54
    })
  }, "\u0E23\u0E27\u0E21 (\u0E0A\u0E21.)"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 86
    })
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 44
    })
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 58
    })
  }, "\u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "left"
    })
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33 OT"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "left"
    })
  }, "\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48"), React.createElement("th", {
    style: Object.assign({}, th, {
      width: 72
    })
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), React.createElement("tbody", null, list.length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 11,
    style: Object.assign({}, td, {
      padding: 20,
      color: "#7A8A81"
    })
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A OT \u0E43\u0E19\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49")), list.map((o, i) => {
    const nm = jobName(o);
    const rt = window.tmOtRate(o, cfg);
    return React.createElement("tr", {
      key: o.id,
      style: i % 2 ? {
        background: "#F7FAF8"
      } : undefined
    }, React.createElement("td", {
      style: td
    }, i + 1), React.createElement("td", {
      style: td
    }, window.drDateTH(o.date)), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, o.from || "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, o.to || "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)",
        fontWeight: 700
      })
    }, tmHrDec(o.mins)), React.createElement("td", {
      style: td
    }, window.tmOtKindOf(o.kind).th), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, "\xD7", Math.round(rt * 100) / 100), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)",
        fontWeight: 700
      })
    }, tmHrDec((+o.mins || 0) * rt)), React.createElement("td", {
      style: tdL
    }, o.jobCode ? React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontWeight: 700
      }
    }, o.jobCode) : React.createElement("span", {
      style: {
        color: "#7A8A81"
      }
    }, "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E07\u0E32\u0E19"), nm && React.createElement("span", {
      style: {
        display: "block",
        color: "#4A5A51"
      }
    }, nm)), React.createElement("td", {
      style: tdL
    }, o.reason || React.createElement("span", {
      style: {
        color: "#B04A3A"
      }
    }, "\u2014 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01 \u2014")), React.createElement("td", {
      style: Object.assign({}, td, {
        fontWeight: 700,
        color: o.status === "approved" ? "#10B981" : o.status === "rejected" || o.status === "cancelled" ? "#94A3B8" : "#D97706"
      })
    }, window.tmOtStatusOf(o.status).th));
  })), React.createElement("tfoot", null, React.createElement("tr", null, React.createElement("td", {
    colSpan: 4,
    style: Object.assign({}, td, {
      textAlign: "right",
      fontWeight: 800,
      background: "#0A4D68",
      color: "#fff"
    })
  }, "\u0E23\u0E27\u0E21\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      background: "#0A4D68",
      color: "#fff"
    })
  }, tmHrDec(sum.approved)), React.createElement("td", {
    colSpan: 2,
    style: Object.assign({}, td, {
      textAlign: "right",
      background: "#0A4D68",
      color: "#fff"
    })
  }, "\u0E23\u0E27\u0E21\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      background: "#0A4D68",
      color: "#fff"
    })
  }, tmHrDec(sum.payApproved)), React.createElement("td", {
    colSpan: 3,
    style: Object.assign({}, td, {
      textAlign: "left",
      background: "#0A4D68",
      color: "#fff"
    })
  }, "\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 (\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E08\u0E23\u0E34\u0E07 ", window.tmDur(sum.approved), ")")), React.createElement("tr", null, React.createElement("td", {
    colSpan: 4,
    style: Object.assign({}, td, {
      textAlign: "right",
      fontWeight: 700,
      background: sum.waiting ? "#FEF3C7" : "#F7FAF8",
      color: sum.waiting ? "#92400E" : "#7A8A81"
    })
  }, "\u0E22\u0E31\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      background: sum.waiting ? "#FEF3C7" : "#F7FAF8",
      color: sum.waiting ? "#92400E" : "#7A8A81"
    })
  }, tmHrDec(sum.waiting)), React.createElement("td", {
    colSpan: 2,
    style: Object.assign({}, td, {
      textAlign: "right",
      background: sum.waiting ? "#FEF3C7" : "#F7FAF8",
      color: sum.waiting ? "#92400E" : "#7A8A81"
    })
  }, "\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E44\u0E14\u0E49"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      background: sum.waiting ? "#FEF3C7" : "#F7FAF8",
      color: sum.waiting ? "#92400E" : "#7A8A81"
    })
  }, tmHrDec(sum.payWaiting)), React.createElement("td", {
    colSpan: 3,
    style: Object.assign({}, td, {
      textAlign: "left",
      background: sum.waiting ? "#FEF3C7" : "#F7FAF8",
      color: sum.waiting ? "#92400E" : "#7A8A81"
    })
  }, "\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 ", sum.waiting ? "— ต้องกดอนุมัติในระบบก่อนจึงจะนับเป็นยอดจ่าย" : ""))))), React.createElement("div", {
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 18,
      breakInside: "avoid"
    }
  }, [{
    t: "ผู้ขอทำงานล่วงเวลา",
    n: (person || {}).name || ""
  }, {
    t: "หัวหน้างานผู้อนุมัติ",
    n: ""
  }, {
    t: "ฝ่ายบุคคล / ผู้ตรวจสอบ",
    n: ""
  }].map(s => React.createElement("div", {
    key: s.t
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62"
    }
  }, s.t), React.createElement("div", {
    style: {
      height: 42,
      borderBottom: "1px solid #C9D5CE",
      marginTop: 6
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D: ", React.createElement("b", null, s.n || "…………………………")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: \u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026")))), React.createElement("div", {
    style: {
      marginTop: 16,
      padding: "9px 12px",
      background: "#F7FAF8",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      fontSize: 9.5,
      color: "#5A6B62",
      lineHeight: 1.8
    }
  }, "\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E02\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E1A\u0E44\u0E14\u0E49 \u2014 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E41\u0E19\u0E48\u0E43\u0E08\u0E43\u0E2B\u0E49\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E41\u0E1C\u0E48\u0E19 \u201C\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u201D \u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19", React.createElement("br", null), "\u0E01\u0E32\u0E23\u0E40\u0E0B\u0E47\u0E19\u0E1A\u0E19\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E14\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E14\u0E49\u0E27\u0E22", React.createElement("br", null), "\u201C\u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u201D = \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E08\u0E23\u0E34\u0E07 \xD7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E31\u0E49\u0E19 \u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A (\u0E41\u0E15\u0E48\u0E25\u0E30\u0E43\u0E1A\u0E15\u0E23\u0E36\u0E07\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E44\u0E27\u0E49 \u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E21\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49)", React.createElement("br", null), "\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E2A\u0E23\u0E38\u0E1B\u0E16\u0E36\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E39\u0E13\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E04\u0E19\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01\u0E17\u0E35"), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 flash+solar \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E21\u0E37\u0E48\u0E2D ", window.drDateTH(window.drToday()))));
}
function TmPRow({
  k,
  v
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "6px 10px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62",
      background: "#F7FAF8",
      borderBottom: "1px solid #ECF1EE",
      whiteSpace: "nowrap"
    }
  }, k), React.createElement("div", {
    style: {
      padding: "6px 10px",
      fontSize: 11.5,
      color: "#15211A",
      borderBottom: "1px solid #ECF1EE"
    }
  }, v || "—"));
}
Object.assign(window, {
  TmOtPaper,
  TmPRow,
  tmOtByPerson,
  tmHrDec
});