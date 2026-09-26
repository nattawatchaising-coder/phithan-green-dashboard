const PM_INK = "#15211A";
const PM_LINE = "#C9D5CE";
const PM_SOFT = "#5A6B62";
const PM_HEAD_BG = "#F2F8F4";
function usePmPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}
const pmpDate = v => !v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10);
const pmpTh = {
  textAlign: "left",
  padding: "5px 7px",
  fontSize: 10,
  fontWeight: 700,
  color: PM_SOFT,
  borderBottom: "1px solid " + PM_LINE,
  borderTop: "1px solid " + PM_LINE
};
const pmpTd = {
  padding: "5px 7px",
  fontSize: 10.5,
  color: PM_INK,
  borderBottom: "1px solid #ECF1EE",
  verticalAlign: "top",
  wordBreak: "break-word"
};
function pmpValue(f, sum) {
  const raw = sum[f.key];
  if (raw === null || raw === undefined || String(raw) === "") return "";
  if (f.key === "gpsLat") return window.pmDms(raw, true);
  if (f.key === "gpsLng") return window.pmDms(raw, false);
  if (f.type === "date") return pmpDate(raw);
  return String(raw) + (f.unit ? " " + f.unit : "");
}
function PmHandoverPaper({
  job,
  rec,
  sum,
  prog,
  photos,
  onClose
}) {
  usePmPrintBody();
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const B = window.BRANDING || {};
  const j = job || {};
  const r = rec || {};
  const s = sum || {};
  const p = prog || {
    pct: 0,
    done: 0,
    total: 0,
    missing: []
  };
  const list = photos || [];
  const sumSec = window.PM_SEC_BY.sum;
  const docSec = window.PM_SEC_BY.docs;
  const signSec = window.PM_SEC_BY.sign;
  const doPrint = () => {
    const old = document.title;
    document.title = "Handover " + (j.code || "") + " " + (s.projName || j.name || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const doXlsx = () => window.pmExportXlsx(j, r, s, p, list);
  const ordered = window.pmPhotoOrder(list);
  const photoNoOf = {};
  ordered.forEach((x, i) => {
    photoNoOf[x.id] = i + 1;
  });
  const chunk6 = arr => {
    const out = [];
    for (let i = 0; i < arr.length; i += 6) out.push(arr.slice(i, i + 6));
    return out;
  };
  const headBar = (title, thTitle) => React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 14,
      flexWrap: "wrap",
      borderBottom: "2px solid " + PM_INK,
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
  }, window.BrandDoc ? React.createElement(window.BrandDoc, {
    height: 46
  }) : null), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: PM_INK,
      letterSpacing: "-.2px"
    }
  }, title), React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: PM_INK,
      marginTop: 1
    }
  }, thTitle), React.createElement("div", {
    style: {
      fontSize: 10,
      color: PM_SOFT,
      marginTop: 2
    }
  }, [j.code, s.projName || j.name].filter(Boolean).join(" · "))), React.createElement("div", {
    style: {
      flexShrink: 0,
      textAlign: "right",
      fontSize: 9.5,
      color: PM_SOFT,
      lineHeight: 1.6
    }
  }, B.tel ? React.createElement("div", null, "\u0E42\u0E17\u0E23 ", B.tel) : null, B.email ? React.createElement("div", null, B.email) : null, React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, "Date of Inspection: ", React.createElement("b", {
    style: {
      color: PM_INK
    }
  }, pmpDate(s.inspDate) || "—")), React.createElement("div", null, "Completeness: ", React.createElement("b", {
    style: {
      color: PM_INK
    }
  }, p.pct, "%"))));
  const pmpRow = (f, val) => React.createElement("div", {
    key: f.key,
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 7,
      marginBottom: 7
    }
  }, React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 150,
      lineHeight: 1.3
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10,
      fontWeight: 700,
      color: PM_INK
    }
  }, f.en), f.th ? React.createElement("span", {
    style: {
      display: "block",
      fontSize: 9,
      color: PM_SOFT
    }
  }, f.th) : null), React.createElement("span", {
    style: {
      fontSize: 11,
      color: PM_SOFT,
      flexShrink: 0
    }
  }, ":"), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(RpFill, {
    value: val,
    minWidth: 80
  })));
  const groupHead = (en, th) => React.createElement("div", {
    style: {
      marginTop: 10,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottom: "1px solid " + PM_LINE
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: PM_INK
    }
  }, en), React.createElement("span", {
    style: {
      fontSize: 10,
      color: PM_SOFT
    }
  }, " (", th, ")"));
  const PM_SUM_UNITS = 16;
  const sumPages = (() => {
    const pages = [];
    let cur = [],
      used = 0;
    window.pmGroupsOf(sumSec, s).forEach(g => {
      const u = Math.ceil((g.fields || []).length / 2) + 1;
      if (cur.length && used + u > PM_SUM_UNITS) {
        pages.push(cur);
        cur = [];
        used = 0;
      }
      cur.push(g);
      used += u;
    });
    if (cur.length) pages.push(cur);
    return pages;
  })();
  const pmRowDone = (tb, row) => (tb.cols || []).every(c => !c.req || String(row[c.key] == null ? "" : row[c.key]).trim() !== "");
  const pmRowOk = (tb, row, hdr) => tb.pass && pmRowDone(tb, row) ? tb.pass(row, hdr || {}) : null;
  const pmCellText = (c, row, hdr) => {
    const v = c.calc ? c.calc(row, hdr || {}) : row[c.key];
    return v == null || v === "" ? "" : String(v);
  };
  const pmHasResult = tb => !!tb.pass && tb.resultCol !== false;
  const tableSheets = [];
  window.PM_SECTIONS.forEach(sec => {
    if (sec.kind !== "table" || (sec.since || 1) > (p.ver || 1)) return;
    (sec.tables || []).forEach(tb => {
      const t = window.pmTableOf(r, sec.key, tb.key);
      const rows = window.pmRowsOf(r, sec.key, tb.key);
      const hdr = t.hdr || {};
      const hasHdr = (tb.hdr || []).some(f => String(hdr[f.key] == null ? "" : hdr[f.key]).trim() !== "");
      if (!rows.length && !hasHdr && !window.pmPhotosOf(ordered, sec.key, tb.key).length) return;
      tableSheets.push({
        sec: sec,
        tb: tb,
        hdr: hdr,
        rows: rows
      });
    });
  });
  const tableSheet = (x, i) => {
    const tb = x.tb;
    const cols = tb.cols || [];
    const wsum = cols.reduce((a, c) => a + (c.w || 1), 0);
    return React.createElement("div", {
      className: "pm-sheet",
      key: "tb-" + x.sec.key + "-" + tb.key
    }, headBar((x.sec.code ? x.sec.code + ". " : "") + tb.en, x.sec.th + " · " + tb.th), (tb.hdr || []).length ? React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        columnGap: 22,
        marginBottom: 4
      }
    }, (tb.hdr || []).map(f => pmpRow(f, pmpValue(f, x.hdr)))) : null, tb.unitNote ? React.createElement("div", {
      style: {
        fontSize: 9.5,
        color: PM_SOFT,
        marginBottom: 5
      }
    }, tb.unitNote) : null, React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed"
      }
    }, React.createElement("thead", null, React.createElement("tr", {
      style: {
        breakInside: "avoid",
        pageBreakInside: "avoid"
      }
    }, React.createElement("th", {
      style: Object.assign({}, pmpTh, {
        width: 26,
        textAlign: "center"
      })
    }, "#"), cols.map(c => React.createElement("th", {
      key: c.key,
      style: Object.assign({}, pmpTh, {
        width: (c.w || 1) / wsum * 100 + "%"
      })
    }, c.en, React.createElement("span", {
      style: {
        display: "block",
        fontWeight: 400,
        fontSize: 9
      }
    }, c.th, c.unit ? " (" + c.unit + ")" : ""))), pmHasResult(tb) ? React.createElement("th", {
      style: Object.assign({}, pmpTh, {
        width: 40,
        textAlign: "center"
      })
    }, "Result") : null)), React.createElement("tbody", null, x.rows.map((row, ri) => {
      const ok = pmRowOk(tb, row, x.hdr);
      const gHead = tb.groupBy && (ri === 0 || x.rows[ri - 1][tb.groupBy] !== row[tb.groupBy]) ? String(row[tb.groupBy] == null ? "" : row[tb.groupBy]) : null;
      return React.createElement(React.Fragment, {
        key: row.id
      }, gHead !== null ? React.createElement("tr", null, React.createElement("td", {
        colSpan: cols.length + 1 + (pmHasResult(tb) ? 1 : 0),
        style: Object.assign({}, pmpTd, {
          background: "#F7FAF9",
          fontWeight: 700,
          fontSize: 9.5
        })
      }, (tb.groupEn || "Inverter") + " " + (gHead || "—") + " · " + (tb.groupTh || "ชุดที่") + " " + (gHead || "—"))) : null, React.createElement("tr", null, React.createElement("td", {
        style: Object.assign({}, pmpTd, {
          textAlign: "center",
          color: PM_SOFT,
          fontSize: 9.5
        })
      }, ri + 1), cols.map(c => React.createElement("td", {
        key: c.key,
        style: c.calc ? Object.assign({}, pmpTd, {
          color: PM_SOFT
        }) : pmpTd
      }, pmCellText(c, row, x.hdr))), pmHasResult(tb) ? React.createElement("td", {
        style: Object.assign({}, pmpTd, {
          textAlign: "center",
          fontWeight: 700,
          color: ok === null ? PM_SOFT : ok ? "#15803D" : "#B91C1C"
        })
      }, ok === null ? "" : ok ? "OK" : "NG") : null));
    }))), React.createElement("div", {
      style: {
        marginTop: 7,
        fontSize: 9.5,
        color: PM_SOFT
      }
    }, x.rows.length, " \u0E41\u0E16\u0E27", tb.pass ? " · ผ่าน " + x.rows.filter(row => pmRowOk(tb, row, x.hdr) === true).length + " แถว" : ""));
  };
  const photoSheets = (title, thTitle, arr, keyPrefix) => chunk6(arr).map((pg, pi) => React.createElement("div", {
    className: "pm-sheet",
    key: keyPrefix + "-ph-" + pi
  }, headBar(title, thTitle), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, pg.map(x => React.createElement("div", {
    key: x.id,
    className: "pm-shot",
    style: {
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }
  }, React.createElement("img", {
    src: x.dataUrl,
    alt: "",
    style: {
      width: "100%",
      height: 186,
      objectFit: "cover",
      border: "1px solid " + PM_LINE,
      borderRadius: 4,
      display: "block"
    }
  }), React.createElement("div", {
    style: {
      fontSize: 9.5,
      color: PM_SOFT,
      marginTop: 3
    }
  }, "#", photoNoOf[x.id], x.cap ? " · " + x.cap : ""))))));
  const paper = React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 175,
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
  }, "\u0E2A\u0E21\u0E38\u0E14\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, j.code || "", " \xB7 \u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ", p.pct, "% (", p.done, "/", p.total, ")")), React.createElement("button", {
    onClick: doXlsx,
    title: "\u0E44\u0E1F\u0E25\u0E4C Excel \u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22 \u2014 \u0E23\u0E39\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C PDF",
    style: {
      padding: "9px 13px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, "\u0E2D\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C Excel"), React.createElement("button", {
    onClick: doPrint,
    style: {
      padding: "9px 15px",
      borderRadius: 10,
      border: "1px solid var(--primary)",
      background: "var(--primary)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      color: "#fff",
      flexShrink: 0
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: PM_INK,
      padding: isMobile ? "18px 14px" : "26px 30px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 8px 30px rgba(0,0,0,.18)"
    }
  }, sumPages.map((groups, pi) => React.createElement("div", {
    className: "pm-sheet",
    key: "sum" + pi
  }, headBar("Commissioning & Handover Report" + (pi ? " (cont.)" : ""), "รายงานตรวจรับและส่งมอบระบบ" + (pi ? " (ต่อ)" : "")), groups.map(g => React.createElement("div", {
    key: g.key
  }, groupHead(g.en, g.th), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      columnGap: 22
    }
  }, (g.fields || []).map(f => pmpRow(f, pmpValue(f, s)))))))), tableSheets.map((x, i) => React.createElement(React.Fragment, {
    key: "tbx-" + x.sec.key + "-" + x.tb.key
  }, tableSheet(x, i), photoSheets(window.pmSlotLabel(x.sec.key, x.tb.key).en + " — Photos", window.pmSlotLabel(x.sec.key, x.tb.key).th, window.pmPhotosOf(ordered, x.sec.key, x.tb.key), x.sec.key + "-" + x.tb.key))), React.createElement("div", {
    className: "pm-sheet pm-page"
  }, headBar("Handover Documents Checklist", "รายการเอกสารส่งมอบ"), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, pmpTh, {
      width: 30,
      textAlign: "center"
    })
  }, "#"), React.createElement("th", {
    style: pmpTh
  }, "Document ", React.createElement("span", {
    style: {
      fontWeight: 400
    }
  }, "(\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23)")), React.createElement("th", {
    style: Object.assign({}, pmpTh, {
      width: 48,
      textAlign: "center"
    })
  }, "Yes"), React.createElement("th", {
    style: Object.assign({}, pmpTh, {
      width: 48,
      textAlign: "center"
    })
  }, "No"))), React.createElement("tbody", null, (() => {
    const out = [];
    let n = 0;
    (docSec.groups || []).forEach(g => {
      out.push(React.createElement("tr", {
        key: "g-" + g.key,
        style: {
          breakInside: "avoid",
          pageBreakInside: "avoid"
        }
      }, React.createElement("td", {
        colSpan: 4,
        style: {
          padding: "6px 7px",
          background: PM_HEAD_BG,
          fontSize: 10.5,
          fontWeight: 800,
          color: PM_INK,
          borderBottom: "1px solid " + PM_LINE
        }
      }, g.en, " ", React.createElement("span", {
        style: {
          fontWeight: 400,
          color: PM_SOFT
        }
      }, "(", g.th, ")"))));
      (g.items || []).forEach(it => {
        n += 1;
        const v = (r.docs || {})[it.key];
        out.push(React.createElement("tr", {
          key: it.key
        }, React.createElement("td", {
          style: Object.assign({}, pmpTd, {
            textAlign: "center",
            color: PM_SOFT,
            fontSize: 9.5
          })
        }, n), React.createElement("td", {
          style: pmpTd
        }, window.pmDocLabel(it, job).en, React.createElement("span", {
          style: {
            color: PM_SOFT,
            fontSize: 9.5
          }
        }, " (", window.pmDocLabel(it, job).th, ")")), React.createElement("td", {
          style: Object.assign({}, pmpTd, {
            textAlign: "center",
            fontSize: 13
          })
        }, v === "y" ? "√" : ""), React.createElement("td", {
          style: Object.assign({}, pmpTd, {
            textAlign: "center",
            fontSize: 13
          })
        }, v === "n" ? "–" : "")));
      });
    });
    return out;
  })())), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 10,
      color: PM_SOFT
    }
  }, "\u0E15\u0E2D\u0E1A\u0E41\u0E25\u0E49\u0E27 ", p.bySection && p.bySection.docs ? p.bySection.docs.done : 0, " \u0E08\u0E32\u0E01", " ", p.bySection && p.bySection.docs ? p.bySection.docs.total : 0, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("div", {
    className: "pm-foot",
    style: {
      display: "flex",
      gap: 14,
      marginTop: 26,
      paddingTop: 10,
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }
  }, (signSec.blocks || []).map(b => React.createElement(RpSign, {
    key: b.key,
    en: b.en,
    th: b.th,
    name: ((r.sign || {})[b.key] || {}).name || ""
  })))), p.missing && p.missing.length ? React.createElement("div", {
    className: "pm-sheet"
  }, headBar("Outstanding Items", "รายการที่ยังขาด"), React.createElement("div", {
    style: {
      border: "1.5px solid #DC2626",
      background: "#FEF2F2",
      borderRadius: 8,
      padding: "10px 12px",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "#B91C1C"
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C \u2014 \u0E22\u0E31\u0E07\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ", p.missing.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#991B1B",
      marginTop: 2
    }
  }, "This handover package is incomplete \xB7 ", p.missing.length, " item(s) outstanding")), (() => {
    const by = {};
    p.missing.forEach(m => {
      (by[m.section] || (by[m.section] = [])).push(m);
    });
    return Object.keys(by).map(k => React.createElement("div", {
      key: k,
      style: {
        marginBottom: 12,
        breakInside: "avoid",
        pageBreakInside: "avoid"
      }
    }, groupHead((window.PM_SEC_BY[k] || {}).en || k, (window.PM_SEC_BY[k] || {}).th || ""), by[k].map((m, i) => React.createElement("div", {
      key: m.key + i,
      style: {
        fontSize: 10.5,
        color: PM_INK,
        padding: "3px 0 3px 14px"
      }
    }, "\u2022 ", m.en, " ", React.createElement("span", {
      style: {
        color: PM_SOFT,
        fontSize: 9.5
      }
    }, "(", m.th, ")")))));
  })()) : null, photoSheets("Photo Report", "รูปประกอบการส่งมอบ", window.pmPhotosOf(ordered, "gen", ""), "gen")));
  return ReactDOM.createPortal(paper, document.body);
}
function pmExportXlsx(job, rec, sum, prog, photoIdx) {
  if (!window.XLSX) {
    alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)");
    return;
  }
  const X = window.XLSX;
  const j = job || {};
  const r = rec || {};
  const s = sum || {};
  const p = prog || {
    pct: 0,
    done: 0,
    total: 0,
    missing: []
  };
  const idx = photoIdx || [];
  const C = {
    brand: "1D854B",
    brandDk: "12603A",
    brandSoft: "EAF6EF",
    group: "D6EBDF",
    alt: "F4FAF6",
    white: "FFFFFF",
    border: "CBD8D0",
    text: "16241D",
    sub: "5A6B62",
    warn: "B45309",
    warnBg: "FEF3C7"
  };
  const FONT = "Tahoma";
  const thin = {
    style: "thin",
    color: {
      rgb: C.border
    }
  };
  const boxAll = {
    top: thin,
    bottom: thin,
    left: thin,
    right: thin
  };
  const makeSheet = (cols, colW, build) => {
    const lastC = cols.length - 1;
    const aoa = [],
      merges = [],
      meta = [],
      rowsH = [];
    let R = 0;
    const pushRow = (cells, type, hpt) => {
      aoa.push(cells);
      meta[R] = type;
      if (hpt) rowsH[R] = {
        hpt: hpt
      };
      R += 1;
    };
    const fullMerge = () => merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
    const pad = (first, rest) => {
      const a = [first];
      for (let i = 1; i <= lastC; i++) a.push(i === 1 ? rest : "");
      return a;
    };
    pushRow(["สมุดตรวจรับและส่งมอบระบบ · Commissioning & Handover"], "title", 30);
    fullMerge();
    pushRow([(s.projName || j.name || "") + (j.code ? "  ·  " + j.code : "")], "subtitle", 20);
    fullMerge();
    pushRow([], "spacer", 6);
    [["กรอกแล้ว", p.pct + "%   (" + p.done + " / " + p.total + " รายการ)"], ["วันที่ตรวจสอบ", s.inspDate ? window.drDateTH(s.inspDate) : "-"], ["สถานะ", (r.meta || {}).status === "signed" ? "ส่งมอบแล้ว" : "ยังไม่ส่งมอบ"], ["วันที่ออกเอกสาร", window.drDateTH(window.drToday())]].forEach(row => {
      pushRow(pad(row[0], row[1]), "info", 19);
      merges.push({
        s: {
          r: R - 1,
          c: 1
        },
        e: {
          r: R - 1,
          c: lastC
        }
      });
    });
    pushRow([], "spacer", 8);
    pushRow(cols, "head", 24);
    build(pushRow, merges, () => R, lastC);
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = colW;
    ws["!rows"] = rowsH;
    const styleCell = (row, c) => {
      const t = meta[row];
      if (t === "spacer") return null;
      const st = {
        font: {
          name: FONT,
          sz: 11,
          color: {
            rgb: C.text
          }
        },
        alignment: {
          vertical: "center",
          wrapText: true
        }
      };
      if (t === "title") {
        st.font = {
          name: FONT,
          sz: 15,
          bold: true,
          color: {
            rgb: C.white
          }
        };
        st.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brand
          }
        };
        st.alignment = {
          horizontal: "center",
          vertical: "center"
        };
      } else if (t === "subtitle") {
        st.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        };
        st.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brandSoft
          }
        };
        st.alignment = {
          horizontal: "center",
          vertical: "center"
        };
      } else if (t === "info") {
        if (c === 0) {
          st.font = {
            name: FONT,
            sz: 10.5,
            bold: true,
            color: {
              rgb: C.sub
            }
          };
          st.alignment = {
            horizontal: "right",
            vertical: "center"
          };
        } else {
          st.font = {
            name: FONT,
            sz: 11.5,
            bold: true,
            color: {
              rgb: C.text
            }
          };
          st.alignment = {
            horizontal: "left",
            vertical: "center"
          };
        }
        st.border = {
          bottom: thin
        };
      } else if (t === "head") {
        st.font = {
          name: FONT,
          sz: 11,
          bold: true,
          color: {
            rgb: C.white
          }
        };
        st.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brand
          }
        };
        st.alignment = {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        };
        st.border = boxAll;
      } else if (t === "group") {
        st.font = {
          name: FONT,
          sz: 11,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        };
        st.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.group
          }
        };
        st.alignment = {
          horizontal: "left",
          vertical: "center"
        };
        st.border = boxAll;
      } else if (t === "foot") {
        st.font = {
          name: FONT,
          sz: 9.5,
          color: {
            rgb: C.sub
          }
        };
        st.alignment = {
          horizontal: "left",
          vertical: "center",
          wrapText: true
        };
      } else if (t === "item" || t === "itemAlt" || t === "miss") {
        if (t === "itemAlt") st.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.alt
          }
        };
        if (t === "miss") {
          st.fill = {
            patternType: "solid",
            fgColor: {
              rgb: C.warnBg
            }
          };
          st.font = {
            name: FONT,
            sz: 11,
            bold: true,
            color: {
              rgb: C.warn
            }
          };
        }
        st.border = boxAll;
        if (c === 0) st.alignment = {
          horizontal: "center",
          vertical: "center"
        };
      }
      return st;
    };
    const range = X.utils.decode_range(ws["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = X.utils.encode_cell({
          r: row,
          c: c
        });
        const st = styleCell(row, c);
        if (!st) continue;
        if (!ws[ref]) ws[ref] = {
          t: "s",
          v: ""
        };
        ws[ref].s = st;
      }
    }
    return ws;
  };
  const wsSum = makeSheet(["หัวข้อ (EN)", "หัวข้อ (ไทย)", "ค่า", "หน่วย"], [{
    wch: 42
  }, {
    wch: 30
  }, {
    wch: 34
  }, {
    wch: 10
  }], (pushRow, merges, getR, lastC) => {
    window.pmGroupsOf(window.PM_SEC_BY.sum, s).forEach(g => {
      pushRow([g.en + "  (" + g.th + ")", "", "", ""], "group", 20);
      merges.push({
        s: {
          r: getR() - 1,
          c: 0
        },
        e: {
          r: getR() - 1,
          c: lastC
        }
      });
      (g.fields || []).forEach((f, i) => {
        const v = s[f.key];
        const has = v !== null && v !== undefined && String(v) !== "";
        const shown = !has ? "ยังไม่กรอก" : f.key === "gpsLat" ? window.pmDms(v, true) : f.key === "gpsLng" ? window.pmDms(v, false) : f.type === "date" ? window.drDateTH(String(v).slice(0, 10)) : String(v);
        pushRow([f.en, f.th, shown, f.unit || ""], !has && f.req ? "miss" : i % 2 === 0 ? "item" : "itemAlt");
      });
    });
  });
  const wsDoc = makeSheet(["#", "Document (EN)", "เอกสาร (ไทย)", "Yes", "No", "สถานะ"], [{
    wch: 6
  }, {
    wch: 52
  }, {
    wch: 38
  }, {
    wch: 7
  }, {
    wch: 7
  }, {
    wch: 14
  }], (pushRow, merges, getR, lastC) => {
    let n = 0;
    (window.PM_SEC_BY.docs.groups || []).forEach(g => {
      pushRow([g.en + "  (" + g.th + ")", "", "", "", "", ""], "group", 20);
      merges.push({
        s: {
          r: getR() - 1,
          c: 0
        },
        e: {
          r: getR() - 1,
          c: lastC
        }
      });
      (g.items || []).forEach((it, i) => {
        n += 1;
        const v = (r.docs || {})[it.key];
        const answered = v === "y" || v === "n";
        const lb = window.pmDocLabel(it, j);
        pushRow([n, lb.en, lb.th, v === "y" ? "√" : "", v === "n" ? "–" : "", answered ? v === "y" ? "มีเอกสาร" : "ไม่เกี่ยวข้อง" : "ยังไม่ตอบ"], !answered ? "miss" : i % 2 === 0 ? "item" : "itemAlt");
      });
    });
    pushRow([], "spacer", 8);
    pushRow(["ช่องลงนาม"], "group", 20);
    merges.push({
      s: {
        r: getR() - 1,
        c: 0
      },
      e: {
        r: getR() - 1,
        c: lastC
      }
    });
    (window.PM_SEC_BY.sign.blocks || []).forEach((b, i) => {
      const v = (r.sign || {})[b.key] || {};
      pushRow(["", b.en, b.th, v.name || "", v.date ? window.drDateTH(String(v.date).slice(0, 10)) : "", v.name ? "ลงนามแล้ว" : "ยังไม่ลงนาม"], !v.name ? "miss" : i % 2 === 0 ? "item" : "itemAlt");
    });
  });
  const wsChk = makeSheet(["#", "หมวด", "รายการที่ยังขาด (EN)", "รายการที่ยังขาด (ไทย)"], [{
    wch: 6
  }, {
    wch: 26
  }, {
    wch: 52
  }, {
    wch: 40
  }], pushRow => {
    if (!p.missing.length) {
      pushRow(["", "", "กรอกครบทุกรายการแล้ว", "ไม่มีรายการค้าง"], "item");
      return;
    }
    p.missing.forEach((m, i) => {
      pushRow([i + 1, m.secTh || m.section, m.en, m.th], i % 2 === 0 ? "item" : "itemAlt");
    });
  });
  const phOrdered = window.pmPhotoOrder(idx);
  const wsPh = makeSheet(["#", "หัวข้อ", "Heading", "แถว", "คำบรรยาย", "เวลา", "ผู้ถ่าย"], [{
    wch: 6
  }, {
    wch: 34
  }, {
    wch: 30
  }, {
    wch: 12
  }, {
    wch: 34
  }, {
    wch: 18
  }, {
    wch: 18
  }], (pushRow, merges, getR, lastC) => {
    phOrdered.forEach((ph, i) => {
      const lb = window.pmSlotLabel(ph.sec, ph.slot);
      pushRow([i + 1, lb.th, lb.en, ph.rowId || "", ph.cap || "", ph.at ? window.drDateTH(String(ph.at).slice(0, 10)) : "", ph.byName || ""], i % 2 === 0 ? "item" : "itemAlt");
    });
    pushRow([], "spacer", 8);
    pushRow(["รูปถ่ายทั้งหมด " + idx.length + " รูป อยู่ในไฟล์ PDF ของชุดเดียวกัน — แผ่นนี้เป็นสารบัญรูป " + "(เลขรูปตรงกับเลขที่พิมพ์ใต้รูปใน PDF) · ไลบรารี Excel ที่ระบบใช้ฝังรูปลงไฟล์ไม่ได้"], "foot", 30);
    merges.push({
      s: {
        r: getR() - 1,
        c: 0
      },
      e: {
        r: getR() - 1,
        c: lastC
      }
    });
  });
  const tableWs = [];
  window.PM_SECTIONS.forEach(sec => {
    if (sec.kind !== "table" || (sec.since || 1) > (p.ver || 1)) return;
    (sec.tables || []).forEach(tb => {
      const rows = window.pmRowsOf(r, sec.key, tb.key);
      const hdr = window.pmTableOf(r, sec.key, tb.key).hdr || {};
      const cols = tb.cols || [];
      const head = ["#"].concat(cols.map(c => c.en + (c.unit ? " (" + c.unit + ")" : "")));
      const colW = [{
        wch: 6
      }].concat(cols.map(c => ({
        wch: Math.min(40, 14 * (c.w || 1))
      })));
      const hasRes = !!tb.pass && tb.resultCol !== false;
      if (hasRes) {
        head.push("Result");
        colW.push({
          wch: 10
        });
      }
      const ws = makeSheet(head, colW, (pushRow, merges, getR, lastC) => {
        (tb.hdr || []).forEach(f => {
          const v = hdr[f.key];
          const has = v !== null && v !== undefined && String(v) !== "";
          pushRow([f.en + "  (" + f.th + ")", has ? String(v) + (f.unit ? " " + f.unit : "") : "ยังไม่กรอก"], !has && f.req ? "miss" : "group", 19);
          merges.push({
            s: {
              r: getR() - 1,
              c: 1
            },
            e: {
              r: getR() - 1,
              c: lastC
            }
          });
        });
        pushRow(["หัวข้อไทย: " + cols.map(c => c.th).join("  ·  ")], "foot", 18);
        merges.push({
          s: {
            r: getR() - 1,
            c: 0
          },
          e: {
            r: getR() - 1,
            c: lastC
          }
        });
        if (!rows.length) {
          pushRow(["", "ยังไม่ได้เพิ่มแถวในตารางนี้"], tb.minRows ? "miss" : "item");
          return;
        }
        rows.forEach((row, i) => {
          if (tb.groupBy && (i === 0 || rows[i - 1][tb.groupBy] !== row[tb.groupBy])) {
            pushRow([(tb.groupTh || "ชุดที่") + " " + (row[tb.groupBy] || "—")], "group", 19);
            merges.push({
              s: {
                r: getR() - 1,
                c: 0
              },
              e: {
                r: getR() - 1,
                c: lastC
              }
            });
          }
          const cells = [i + 1].concat(cols.map(c => {
            const v = c.calc ? c.calc(row, hdr) : row[c.key];
            return v === null || v === undefined || v === "" ? c.req ? "ยังไม่กรอก" : "" : String(v);
          }));
          const miss = cols.some(c => c.req && String(row[c.key] == null ? "" : row[c.key]).trim() === "");
          if (hasRes) cells.push(miss ? "" : tb.pass(row, hdr) ? "OK" : "NG");
          pushRow(cells, miss ? "miss" : i % 2 === 0 ? "item" : "itemAlt");
        });
      });
      tableWs.push({
        name: tb.code || (sec.tables.length > 1 ? tb.en : sec.code || sec.key),
        ws: ws
      });
    });
  });
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, wsSum, "Summary");
  X.utils.book_append_sheet(wb, wsDoc, "Documents");
  X.utils.book_append_sheet(wb, wsChk, "Checklist");
  tableWs.forEach(t => X.utils.book_append_sheet(wb, t.ws, String(t.name).replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31)));
  X.utils.book_append_sheet(wb, wsPh, "Photos");
  X.writeFile(wb, "Handover_" + (j.code || "job") + "_" + window.drToday() + ".xlsx");
}
Object.assign(window, {
  usePmPrintBody,
  PmHandoverPaper,
  pmExportXlsx
});