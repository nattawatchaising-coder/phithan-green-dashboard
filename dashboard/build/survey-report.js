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
const SV_I18N = {
  "รายงานผลสำรวจหน้างาน": ["Site Survey Report", "现场勘查报告"],
  "สำรวจ:": ["Surveyed:", "勘查日期："],
  "รายงาน:": ["Reported:", "报告日期："],
  "โครงการ": ["Project", "项目"],
  "ลูกค้า": ["Customer", "客户"],
  "ขนาด": ["Size", "规模"],
  "แผง": ["Modules", "组件"],
  "รหัสงาน": ["Job code", "项目编号"],
  "ที่อยู่": ["Address", "地址"],
  "ผลการตรวจสอบ": ["Survey findings", "勘查结果"],
  "สภาพหลังคา": ["Roof condition", "屋面状况"],
  "พื้นที่จะวางแผ่นโซลาร์เซลล์": ["Area for the solar array", "组件安装区域"],
  "ประเภทหลังคา": ["Roof type", "屋面类型"],
  "โครงสร้างรับน้ำหนัก": ["Load-bearing structure", "承重结构"],
  "มีวัตถุที่ส่งผลกระทบต่อการรับแสง": ["Objects that shade the array", "影响采光的物体"],
  "ตาข่ายกันนก": ["Bird netting", "防鸟网"],
  "ระบบไฟฟ้า": ["Electrical system", "电气系统"],
  "สายเมนเดิม": ["Existing main cable", "原主干电缆"],
  "มิเตอร์": ["Utility meter", "电表"],
  "ตู้ MDB": ["MDB panel", "总配电柜"],
  "เซฟตี้คัตในตู้": ["Safety switch in the panel", "柜内安全开关"],
  "เมนกันดูด (RCD / RCCB)": ["Main earth-leakage device (RCD / RCCB)", "主漏电保护器（RCD / RCCB）"],
  "ตำแหน่ง MDB": ["MDB location", "配电柜位置"],
  "จุดติดตั้งอินเวอร์เตอร์": ["Inverter mounting point", "逆变器安装位置"],
  "พิกัด GPS หน้างาน": ["Site GPS coordinates", "现场 GPS 坐标"],
  "ความต้องการพิเศษ": ["Special requirements", "特殊要求"],
  "หมายเหตุ": ["Notes", "备注"],
  "เงาบัง:": ["Shading:", "遮挡："],
  "ภาพประกอบการสำรวจ": ["Survey photographs", "勘查照片"],
  "แนบไฟล์เอกสารแยก:": ["Attached as a separate file:", "另附文件："],
  "(เปิดดูได้จากหน้าคลังสินค้า)": ["(available from the inventory page)", "（可在库存页面查看）"],
  "ผู้สำรวจ:": ["Surveyed by:", "勘查人："],
  "ออกรายงาน:": ["Report issued:", "出具日期："],
  "รูป": ["photos", "张"],
  "มี": ["Yes", "有"],
  "ไม่มี": ["No", "无"],
  "โทร ": ["Tel ", "电话 "],
  "ระยะเดินสาย (รวม {} ม.)": ["Cable runs (total {} m)", "线缆路由（合计 {} 米）"],
  "อื่นๆ ({})": ["Other ({})", "其他（{}）"],
  "ดี (แข็งแรง)": ["Good (sound)", "良好（结构稳固）"],
  "พอใช้": ["Fair", "一般"],
  "ทรุดโทรม / ต้องเสริม": ["Deteriorated / needs reinforcement", "老化，需加固"],
  "ผ่าน": ["Pass", "合格"],
  "ต้องเสริม / แก้ไข": ["Needs reinforcement / rectification", "需加固或整改"],
  "ติดตั้ง": ["To be installed", "安装"],
  "ไม่ติดตั้ง": ["Not installed", "不安装"],
  "ในอาคาร (Indoor)": ["Indoor", "室内"],
  "นอกอาคาร (Outdoor)": ["Outdoor", "室外"],
  "มีช่องว่างเพียงพอ": ["Sufficient spare ways", "柜内空间充足"],
  "มีช่องว่างจำกัด": ["Limited spare ways", "柜内空间有限"],
  "เต็ม / ต้องเพิ่มตู้": ["Full / additional panel required", "已满，需增柜"],
  "แผง → อินเวอร์เตอร์ (สาย DC)": ["Modules → inverter (DC cable)", "组件 → 逆变器（直流线）"],
  "อินเวอร์เตอร์ → ตู้ MDB (สาย AC)": ["Inverter → MDB (AC cable)", "逆变器 → 配电柜（交流线）"],
  "CT / Meter → อินเวอร์เตอร์": ["CT / meter → inverter", "CT / 电表 → 逆变器"],
  "สายกราวด์ → หลักดิน": ["Earth cable → ground rod", "接地线 → 接地极"]
};
function SurveyReport({
  job,
  photos,
  docs,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [lang, setLang] = React.useState(() => window.pgLang ? window.pgLang() : "th");
  const pickLang = id => {
    setLang(id);
    if (window.pgSetLang) window.pgSetLang(id);
  };
  const T = React.useMemo(() => window.pgT ? window.pgT(SV_I18N, lang) : k => k, [lang]);
  const DT = iso => lang === "th" || !window.pgDate ? repDate(iso) : !iso ? "-" : window.pgDate(String(iso).slice(0, 10), lang);
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
    document.title = T("รายงานผลสำรวจหน้างาน") + " " + (job.code || "") + " " + (job.name || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const noteLines = [s.note].concat(s.shadingNote ? [T("เงาบัง:") + " " + s.shadingNote] : []).concat((window.SURVEY_NOTE_BLOCKS || []).map(b => String(s[b.key] || "").trim() ? T(b.th) + ": " + s[b.key] : "")).filter(Boolean);
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
  }, shots.length, " \u0E23\u0E39\u0E1B", (docs || []).length ? " · DATA SHEET " + docs.length + " ใบ" : "", " \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), typeof window.LangPick === "function" && React.createElement(window.LangPick, {
    value: lang,
    onChange: pickLang
  }), React.createElement("button", {
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
      fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
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
  }, T("รายงานผลสำรวจหน้างาน")), React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "var(--text-3)",
      marginTop: 3
    }
  }, "SOLAR SITE SURVEY REPORT"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandMark, {
    size: 22,
    variant: "light"
  }), React.createElement(window.BrandWord, {
    size: 16,
    color: "var(--brand-ink)"
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, React.createElement("div", null, T("สำรวจ:"), " ", DT(s.startedAt)), React.createElement("div", null, T("รายงาน:"), " ", DT(s.completedAt || s.updatedAt || s.startedAt)))), React.createElement("div", {
    className: "sv-rep-info",
    style: {
      marginTop: 16,
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden"
    }
  }, React.createElement(RepCell, {
    k: T("โครงการ"),
    v: job.name
  }), React.createElement(RepCell, {
    k: T("ลูกค้า"),
    v: job.name
  }), React.createElement(RepCell, {
    k: T("ขนาด"),
    v: size
  }), React.createElement(RepCell, {
    k: "Inverter",
    v: s.invModel
  }), React.createElement(RepCell, {
    k: T("แผง"),
    v: s.panelModel
  }), React.createElement(RepCell, {
    k: "Monitoring",
    v: s.monitoring
  }), React.createElement(RepCell, {
    k: "Meter/CT",
    v: s.meterCt
  }), React.createElement(RepCell, {
    k: T("รหัสงาน"),
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
  }, T("ที่อยู่")), React.createElement("div", {
    style: {
      padding: "7px 10px",
      fontSize: 11.5,
      color: "var(--text-1)"
    }
  }, [job.address, job.province].filter(Boolean).join(" ") || "-", job.phone ? " · " + T("โทร ") + job.phone : "")), React.createElement(RepSection, {
    title: T("ผลการตรวจสอบ")
  }, React.createElement(RepGroup, {
    icon: "\uD83C\uDFE0",
    title: T("สภาพหลังคา")
  }, React.createElement(RepCheck, {
    label: T("พื้นที่จะวางแผ่นโซลาร์เซลล์"),
    value: s.buildingType
  }), React.createElement(RepCheck, {
    label: T("ประเภทหลังคา"),
    value: s.roofType
  }), React.createElement(RepCheck, {
    label: T("สภาพหลังคา"),
    value: T(roofCond)
  }), React.createElement(RepCheck, {
    label: T("โครงสร้างรับน้ำหนัก"),
    value: T(structure)
  }), React.createElement(RepCheck, {
    label: T("มีวัตถุที่ส่งผลกระทบต่อการรับแสง"),
    value: (s.shadingTags || []).join(", ")
  }), React.createElement(RepCheck, {
    label: T("ตาข่ายกันนก"),
    value: T(birdNet)
  })), React.createElement(RepGroup, {
    icon: "\u26A1",
    title: T("ระบบไฟฟ้า")
  }, React.createElement(RepCheck, {
    label: T("ระบบไฟฟ้า"),
    value: s.phase ? s.phase + (lang === "th" ? " เฟส" : " Phase") : ""
  }), React.createElement(RepCheck, {
    label: "Main Breaker",
    value: s.mainBreaker
  }), React.createElement(RepCheck, {
    label: T("สายเมนเดิม"),
    value: s.mainCable
  }), React.createElement(RepCheck, {
    label: T("มิเตอร์"),
    value: meter
  }), React.createElement(RepCheck, {
    label: T("ตู้ MDB"),
    value: [s.mdbBrand, T(mdbSpace)].filter(Boolean).join(" · ")
  }), React.createElement(RepCheck, {
    label: T("เซฟตี้คัตในตู้"),
    value: T(_yn(s.mdbSafety))
  }), React.createElement(RepCheck, {
    label: T("เมนกันดูด (RCD / RCCB)"),
    value: T(_yn(s.mdbRccb))
  }), React.createElement(RepCheck, {
    label: T("ตำแหน่ง MDB"),
    value: T(s.mdbLoc)
  }), React.createElement(RepCheck, {
    label: T("จุดติดตั้งอินเวอร์เตอร์"),
    value: T(invLoc)
  }), React.createElement(RepCheck, {
    label: T("พิกัด GPS หน้างาน"),
    value: gps
  })), window.SURVEY_CABLE_LEGS.some(l => +s[l.key] > 0) && React.createElement(RepGroup, {
    icon: "\uD83D\uDCCF",
    title: T("ระยะเดินสาย (รวม {} ม.)").replace("{}", window.cableTotal(s))
  }, window.SURVEY_CABLE_LEGS.map(l => React.createElement(RepCheck, {
    key: l.key,
    label: T(l.th),
    value: +s[l.key] > 0 ? s[l.key] + (lang === "th" ? " ม." : lang === "zh" ? " 米" : " m") : ""
  }))), (s.specials || []).filter(Boolean).length > 0 && React.createElement(RepGroup, {
    icon: "\u26A0\uFE0F",
    title: T("ความต้องการพิเศษ")
  }, (s.specials || []).filter(Boolean).map((v, i) => React.createElement(RepCheck, {
    key: i,
    label: T("อื่นๆ ({})").replace("{}", i + 1),
    value: v
  })))), noteLines.length > 0 && React.createElement(RepSection, {
    title: T("หมายเหตุ")
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
  }, noteLines.join("\n"))), shots.length > 0 && React.createElement(RepSection, {
    title: T("ภาพประกอบการสำรวจ") + " (" + shots.length + " " + T("รูป") + ")"
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
  }, T("แนบไฟล์เอกสารแยก:"), " ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, d.doc.name), " ", T("(เปิดดูได้จากหน้าคลังสินค้า)"))))), React.createElement("div", {
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
  }, React.createElement("div", null, T("ผู้สำรวจ:"), " ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, s.byName || "-")), React.createElement("div", null, T("ออกรายงาน:"), " ", DT(new Date().toISOString())))));
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