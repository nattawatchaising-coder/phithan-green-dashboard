function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TM_IN = {
  padding: "9px 11px",
  borderRadius: "var(--r-chip)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none"
};
const TM_IN_W = Object.assign({}, TM_IN, {
  width: "100%"
});
const TM_LB = {
  display: "grid",
  gap: 4,
  minWidth: 0
};
const TM_WD_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
function tmWdOf(d) {
  const s = String(d || "");
  return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12).getDay();
}
function TmPill({
  s,
  size
}) {
  const st = window.tmOtStatusOf(s);
  return React.createElement("span", {
    style: {
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: "var(--r-pill)",
      background: st.color + "1A",
      color: st.color,
      fontSize: size === "sm" ? 10.5 : 11.5,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, st.th);
}
function TmStat({
  label,
  value,
  unit,
  color,
  hint,
  on,
  onClick
}) {
  return React.createElement("button", {
    onClick: onClick,
    disabled: !onClick,
    style: {
      flex: "1 1 180px",
      minWidth: 165,
      textAlign: "left",
      padding: "12px 14px",
      borderRadius: "var(--r-tile)",
      border: "none",
      boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      background: on ? "var(--primary-soft)" : "var(--surface)",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      marginTop: 3,
      display: "flex",
      alignItems: "baseline",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 22,
      fontWeight: 800,
      color: color || "var(--text-1)"
    }
  }, value), unit && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, unit)), hint && React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, hint));
}
async function tmExportMonthXlsx(rows, days, ym, otRows, users, cfg) {
  if (!window.XLSX) {
    alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)");
    return;
  }
  if (!rows || !rows.length) {
    alert("เดือนนี้ยังไม่มีข้อมูลให้ออกไฟล์");
    return;
  }
  const X = window.XLSX;
  const FONT = "Tahoma";
  const C = {
    brand: "1D854B",
    brandDk: "12603A",
    brandSoft: "EAF6EF",
    white: "FFFFFF",
    border: "CBD8D0",
    text: "16241D",
    sub: "5A6B62",
    alt: "F4FAF6",
    warn: "FDECEA",
    warnTx: "B42318"
  };
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
  const H = m => !m ? "" : Math.round(m / 60 * 100) / 100;
  const cols = ["ชื่อ"].concat(days.map(d => +d.slice(8))).concat(["วันที่ลงเวลา", "ชั่วโมงรวม", "OT อนุมัติแล้ว", "ลืมกดออก", "ไม่มีพิกัด"]);
  const lastC = cols.length - 1;
  const aoa = [],
    merges = [],
    meta = [],
    rowsH = [];
  let R = 0;
  const push = (cells, type, hpt) => {
    aoa.push(cells);
    meta[R] = type;
    if (hpt) rowsH[R] = {
      hpt: hpt
    };
    R += 1;
  };
  const full = r => merges.push({
    s: {
      r: r,
      c: 0
    },
    e: {
      r: r,
      c: lastC
    }
  });
  push(["สรุปเวลาทำงานรายเดือน · " + window.tmYmTH(ym)], "title", 30);
  full(R - 1);
  push(["flash+solar · ตัวเลขจากใบลงเวลาที่พนักงานปั๊มเอง ยังไม่ใช่ยอดจ่าย"], "subtitle", 20);
  full(R - 1);
  push([], "spacer", 6);
  push(cols, "head", 26);
  let alt = false;
  rows.forEach(r => {
    const line = [r.name].concat(days.map(d => r.byDay[d] ? H(r.byDay[d].mins) : "")).concat([r.days || "", H(r.mins), H(r.otMins), r.noOut || "", r.noGps || ""]);
    push(line, alt ? "itemAlt" : "item", 19);
    alt = !alt;
  });
  const sum = k => rows.reduce((a, r) => a + (+r[k] || 0), 0);
  push(["รวมทั้งสิ้น"].concat(days.map(() => "")).concat([sum("days"), H(sum("mins")), H(sum("otMins")), sum("noOut") || "", sum("noGps") || ""]), "total", 24);
  merges.push({
    s: {
      r: R - 1,
      c: 1
    },
    e: {
      r: R - 1,
      c: days.length
    }
  });
  push([], "spacer", 8);
  push(["ช่องว่าง = ไม่มีใบลงเวลาในวันนั้น · ใบที่ลืมกดออกงานชั่วโมงเป็นศูนย์ ระบบไม่เดาเวลาเลิกงานให้"], "foot", 18);
  full(R - 1);
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{
    wch: 22
  }].concat(days.map(() => ({
    wch: 5.2
  }))).concat([{
    wch: 12
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 10
  }, {
    wch: 10
  }]);
  ws["!rows"] = rowsH;
  ws["!freeze"] = {
    xSplit: 1,
    ySplit: 4
  };
  ws["!autofilter"] = null;
  const styleCell = (r, c) => {
    const t = meta[r];
    if (t === "spacer") return null;
    const s = {
      font: {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.text
        }
      },
      alignment: {
        vertical: "center"
      }
    };
    if (t === "title") {
      s.font = {
        name: FONT,
        sz: 15,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "subtitle") {
      s.font = {
        name: FONT,
        sz: 10.5,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandSoft
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "head") {
      s.font = {
        name: FONT,
        sz: 10,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "center",
        wrapText: true
      };
      s.border = boxAll;
    } else if (t === "total") {
      s.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandDk
        }
      };
      s.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "center"
      };
      s.border = boxAll;
      if (c > days.length + 1) s.numFmt = "#,##0.00";
    } else if (t === "foot") {
      s.font = {
        name: FONT,
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    } else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.alt
        }
      };
      s.border = boxAll;
      if (c === 0) {
        s.alignment = {
          horizontal: "left",
          vertical: "center"
        };
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.text
          }
        };
      } else {
        s.alignment = {
          horizontal: "center",
          vertical: "center"
        };
        if (c !== lastC - 1 && c !== lastC && c !== days.length + 1) s.numFmt = "0.00";
      }
      if (c === lastC - 1 && aoa[r][c]) {
        s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.warn
          }
        };
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.warnTx
          }
        };
      }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({
        r: r,
        c: c
      });
      const st = styleCell(r, c);
      if (!st) continue;
      if (!ws[ref]) ws[ref] = {
        t: "s",
        v: ""
      };
      ws[ref].s = st;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "เวลาทำงาน");
  const otMine = {};
  (otRows || []).forEach(o => {
    if (!o || !o.userId) return;
    if (window.tmYm(o.date) !== ym) return;
    if (o.status !== "sent" && o.status !== "approved") return;
    (otMine[o.userId] || (otMine[o.userId] = [])).push(o);
  });
  const want = rows.filter(r => r.days > 0 || (otMine[r.userId] || []).length);
  let detail = {};
  try {
    detail = await window.tmFetchMonthDetail(want.map(r => r.userId), ym);
  } catch (e) {
    detail = {};
  }
  const used = {
    "เวลาทำงาน": 1
  };
  want.forEach(r => {
    const list = (otMine[r.userId] || []).slice();
    list.sort((a2, b2) => String(a2.date + a2.from).localeCompare(String(b2.date + b2.from)));
    X.utils.book_append_sheet(wb, tmPersonSheet(X, r, list, detail[r.userId] || {}, days, ym, cfg, FONT, C), tmSheetName(r.name, used));
  });
  X.writeFile(wb, "สรุปเวลาทำงาน_" + ym + ".xlsx");
}
function tmSheetName(raw, used) {
  let n = String(raw || "พนักงาน").replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "พนักงาน";
  if (used[n]) {
    let i = 2;
    while (used[n.slice(0, 28) + " " + i]) i += 1;
    n = n.slice(0, 28) + " " + i;
  }
  used[n] = 1;
  return n;
}
const TM_DOW_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
function tmPersonSheet(X, person, list, recs, days, ym, cfg, FONT, C) {
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
  const H = m => !m ? 0 : Math.round(m / 60 * 100) / 100;
  const name = person.name || person.userId;
  const office = window.tmWhNorm(cfg).office;
  const lastC = 12;
  const aoa = [],
    merges = [],
    meta = [],
    rowsH = [],
    links = {};
  let R = 0;
  const push = (cells, type, hpt) => {
    aoa.push(cells);
    meta[R] = type;
    if (hpt) rowsH[R] = {
      hpt: hpt
    };
    R += 1;
  };
  const full = r => merges.push({
    s: {
      r: r,
      c: 0
    },
    e: {
      r: r,
      c: lastC
    }
  });
  push(["ใบลงเวลาและการทำงานล่วงเวลา รายบุคคล"], "title", 30);
  full(R - 1);
  push([name + " · " + window.tmYmTH(ym)], "subtitle", 22);
  full(R - 1);
  push([], "spacer", 6);
  const otByDay = {};
  list.forEach(o => {
    (otByDay[o.date] || (otByDay[o.date] = [])).push(o);
  });
  let otApproved = 0,
    otWaiting = 0,
    payApproved = 0;
  list.forEach(o => {
    const m = +o.mins || 0;
    if (o.status === "approved") {
      otApproved += m;
      payApproved += window.tmOtPayMins(o, cfg);
    } else otWaiting += m;
  });
  push(["วันที่ลงเวลา", person.days || 0, "ชั่วโมงรวม", H(person.mins), "OT อนุมัติแล้ว", H(otApproved), "ชม.คิดค่าแรง", H(payApproved), "ลืมกดออกงาน", person.noOut || 0, "ไม่มีพิกัด", person.noGps || 0, ""], "kv", 21);
  push([], "spacer", 8);
  push(["รายวัน — เวลาเข้า-ออก และตำแหน่งตอนปั๊ม"], "sec", 22);
  full(R - 1);
  push(["วันที่", "วัน", "เข้า", "ออก", "รวม (ชม.)", "ที่ทำงาน", "งานที่แจ้ง", "พิกัดตอนเข้า", "พิกัดตอนออก", "ห่างจากออฟฟิศ", "แผนที่", "OT วันนี้ (ชม.)", "OT ประเภท / เรื่องที่ทำ"], "head", 28);
  const dayStart = R;
  let alt = false,
    shown = 0;
  (days || []).forEach(d => {
    const rec = recs[d] || null;
    const idx = person.byDay ? person.byDay[d] : null;
    const ots = otByDay[d] || [];
    if (!rec && !idx && !ots.length) return;
    shown += 1;
    const IN = rec && rec.in || null,
      OUT = rec && rec.out || null;
    const otMins = ots.reduce((a2, o) => a2 + (+o.mins || 0), 0);
    const otTxt = ots.map(o => window.tmOtKindOf(o.kind).th + (o.reason ? " — " + o.reason : "") + (o.status === "approved" ? "" : " (" + window.tmOtStatusOf(o.status).th + ")")).join(" · ");
    const place = idx && idx.place || rec && (rec.in && rec.in.place || rec.place) || "";
    const hm = (x, k) => x && x.hm || idx && idx[k] || "";
    push([window.drDateTH(d), TM_DOW_TH[new Date(d + "T00:00:00").getDay()], hm(IN, "in"), hm(OUT, "out"), rec || idx ? H(rec ? window.tmWorkedMins(rec, cfg) : idx && idx.mins || 0) : "", place ? window.tmPlaceOf(place).th : "", rec && rec.jobCode || idx && idx.jobCode || "", window.tmGpsTH(IN), window.tmGpsTH(OUT), window.tmDistTH(window.tmOfficeDist(IN, cfg)), window.tmGpsUrl(IN) ? "เปิดแผนที่" : "", otMins ? H(otMins) : "", otTxt], alt ? "itemAlt" : "item", 19);
    if (window.tmGpsUrl(IN)) links[R - 1 + ":10"] = window.tmGpsUrl(IN);
    alt = !alt;
  });
  if (!shown) {
    push(["เดือนนี้ไม่มีใบลงเวลาเลย"], "muted", 20);
    full(R - 1);
  } else {
    push(["รวมทั้งเดือน", "", "", "", H(person.mins), "", "", "", "", "", "", H(otApproved), "ชั่วโมง OT ที่อนุมัติแล้ว"], "total", 24);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 5
      },
      e: {
        r: R - 1,
        c: 10
      }
    });
  }
  push([], "spacer", 10);
  push(["ใบขออนุมัติทำงานล่วงเวลา (OT) ในเดือนนี้"], "sec", 22);
  full(R - 1);
  push(["ลำดับ", "วันที่", "ตั้งแต่", "ถึง", "รวม (ชม.)", "ประเภท", "อัตรา", "ชม.คิดค่าแรง", "งาน", "ปฏิบัติหน้าที่", "สถานะในระบบ", "ผู้อนุมัติในระบบ", ""], "head", 28);
  const otStart = R;
  if (!list.length) {
    push(["เดือนนี้ไม่มีใบ OT ที่ส่งขออนุมัติ"], "muted", 20);
    full(R - 1);
  }
  alt = false;
  list.forEach((o, i) => {
    const mins = +o.mins || 0;
    const rt = window.tmOtRate(o, cfg);
    push([i + 1, window.drDateTH(o.date), o.from || "", o.to || "", H(mins), window.tmOtKindOf(o.kind).th, o.parts && o.parts.length ? window.tmOtPartsTH(o.parts) : rt, H(window.tmOtPayMins(o, cfg)), o.jobCode || "—", o.reason || "", window.tmOtStatusOf(o.status).th, o.approverName || "—", ""], alt ? "itemAlt2" : "item2", 19);
    alt = !alt;
  });
  if (list.length) {
    push(["รวมที่อนุมัติแล้วในระบบ", "", "", "", H(otApproved), "ชั่วโมง", "", H(payApproved), "ชม.คิดค่าแรง", "", "", "", ""], "total2", 24);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 8
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
    push(["ยังรออนุมัติในระบบ", "", "", "", H(otWaiting), "ชั่วโมง", "", "", "ต้องกดอนุมัติในระบบก่อนจึงจะนับเป็นยอดจ่าย", "", "", "", ""], otWaiting ? "warnRow" : "muted2", 22);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 8
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
  }
  push([], "spacer", 14);
  const sign3 = r => {
    merges.push({
      s: {
        r: r,
        c: 0
      },
      e: {
        r: r,
        c: 3
      }
    });
    merges.push({
      s: {
        r: r,
        c: 4
      },
      e: {
        r: r,
        c: 7
      }
    });
    merges.push({
      s: {
        r: r,
        c: 8
      },
      e: {
        r: r,
        c: lastC
      }
    });
  };
  push(["ลงชื่อผู้ปฏิบัติงาน ....................................", "", "", "", "ลงชื่อหัวหน้างานผู้อนุมัติ ....................................", "", "", "", "ลงชื่อฝ่ายบุคคล / ผู้ตรวจสอบ ....................................", "", "", "", ""], "sign", 34);
  sign3(R - 1);
  push(["(" + name + ")", "", "", "", "(....................................)  วันที่ ......./......./.......", "", "", "", "(....................................)  วันที่ ......./......./.......", "", "", "", ""], "signSub", 22);
  sign3(R - 1);
  push([], "spacer", 8);
  push(["พิกัดคือตำแหน่งของ “เครื่องที่กดปั๊ม” ตอนกด ไม่ใช่การยืนยันว่าอยู่ที่ไซต์นั้นจริง — ระบบยังไม่มีพิกัดไซต์ให้เทียบระยะ"], "foot", 16);
  full(R - 1);
  push(["ช่องพิกัดที่ว่างหรือขึ้นเหตุผล แปลว่าจับพิกัดไม่ได้ตอนนั้น ระบบไม่เคยบล็อกการลงเวลาด้วยเหตุนี้"], "foot", 16);
  full(R - 1);
  push([office.lat != null ? "ระยะวัดจากพิกัดออฟฟิศที่ตั้งไว้ " + (office.name ? office.name + " " : "") + (+office.lat).toFixed(6) + ", " + (+office.lng).toFixed(6) + " (รัศมีที่ถือว่าถึงออฟฟิศ " + office.radius + " ม.)" : "ยังไม่ได้ตั้งพิกัดออฟฟิศในระบบ ช่อง “ห่างจากออฟฟิศ” จึงว่างทั้งคอลัมน์"], "foot", 16);
  full(R - 1);
  push(["เวลาในใบ OT เป็นเวลาที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้ — เทียบกับตารางรายวันข้างบนได้"], "foot", 16);
  full(R - 1);
  push(["การเซ็นบนกระดาษไม่ได้เปลี่ยนสถานะในระบบ ใบที่ยังรออนุมัติต้องกดอนุมัติในระบบด้วย"], "foot", 16);
  full(R - 1);
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{
    wch: 14
  }, {
    wch: 5
  }, {
    wch: 8
  }, {
    wch: 8
  }, {
    wch: 10
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 19
  }, {
    wch: 19
  }, {
    wch: 14
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 40
  }];
  ws["!rows"] = rowsH;
  ws["!freeze"] = {
    xSplit: 1,
    ySplit: dayStart
  };
  const styleCell = (r, c) => {
    const t = meta[r];
    if (t === "spacer") return null;
    const s2 = {
      font: {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.text
        }
      },
      alignment: {
        vertical: "center"
      }
    };
    if (t === "title") {
      s2.font = {
        name: FONT,
        sz: 15,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "subtitle") {
      s2.font = {
        name: FONT,
        sz: 12,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandSoft
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "sec") {
      s2.font = {
        name: FONT,
        sz: 11.5,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "center"
      };
    } else if (t === "kv") {
      s2.border = boxAll;
      if (c % 2 === 0) {
        s2.font = {
          name: FONT,
          sz: 9.5,
          color: {
            rgb: C.sub
          }
        };
        s2.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brandSoft
          }
        };
        s2.alignment = {
          horizontal: "right",
          vertical: "center"
        };
      } else {
        s2.font = {
          name: FONT,
          sz: 11.5,
          bold: true,
          color: {
            rgb: C.text
          }
        };
        s2.alignment = {
          horizontal: "center",
          vertical: "center"
        };
        if (c === 3 || c === 5 || c === 7) s2.numFmt = "0.00";
      }
    } else if (t === "head") {
      s2.font = {
        name: FONT,
        sz: 10,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center",
        wrapText: true
      };
      s2.border = boxAll;
    } else if (t === "total" || t === "total2") {
      s2.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandDk
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      s2.border = boxAll;
      if (c === 4 || t === "total" && c === 11 || t === "total2" && c === 7) s2.numFmt = "0.00";
    } else if (t === "warnRow") {
      s2.font = {
        name: FONT,
        sz: 10.5,
        bold: true,
        color: {
          rgb: C.warnTx
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.warn
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      s2.border = boxAll;
      if (c === 4) s2.numFmt = "0.00";
    } else if (t === "muted" || t === "muted2") {
      s2.font = {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.sub
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      if (t === "muted2") s2.border = boxAll;
      if (t === "muted2" && c === 4) s2.numFmt = "0.00";
    } else if (t === "sign") {
      s2.font = {
        name: FONT,
        sz: 11,
        color: {
          rgb: C.text
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "bottom"
      };
    } else if (t === "signSub") {
      s2.font = {
        name: FONT,
        sz: 10,
        color: {
          rgb: C.sub
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "top"
      };
    } else if (t === "foot") {
      s2.font = {
        name: FONT,
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    } else if (t === "item" || t === "itemAlt" || t === "item2" || t === "itemAlt2") {
      const two = t === "item2" || t === "itemAlt2";
      if (t === "itemAlt" || t === "itemAlt2") s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.alt
        }
      };
      s2.border = boxAll;
      const wrapCol = two ? 9 : 12;
      if (c === wrapCol) s2.alignment = {
        horizontal: "left",
        vertical: "center",
        wrapText: true
      };else if (c === 0 || !two && (c === 6 || c === 7 || c === 8) || two && c === 8) s2.alignment = {
        horizontal: "left",
        vertical: "center"
      };else {
        s2.alignment = {
          horizontal: "center",
          vertical: "center"
        };
      }
      if (c === 4) s2.numFmt = "0.00";
      if (two && c === 7) s2.numFmt = "0.00";
      if (two && c === 6) s2.numFmt = '0.##" เท่า"';
      if (!two && c === 11 && aoa[r][c]) {
        s2.numFmt = "0.00";
        s2.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        };
      }
      if (!two && (c === 7 || c === 8 || c === 9)) s2.font = {
        name: "Consolas",
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    }
    return s2;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({
        r: r,
        c: c
      });
      const st = styleCell(r, c);
      if (!st) continue;
      if (!ws[ref]) ws[ref] = {
        t: "s",
        v: ""
      };
      ws[ref].s = st;
    }
  }
  Object.keys(links).forEach(k => {
    const rc = k.split(":");
    const ref = X.utils.encode_cell({
      r: +rc[0],
      c: +rc[1]
    });
    if (!ws[ref]) return;
    ws[ref].l = {
      Target: links[k],
      Tooltip: "เปิดตำแหน่งนี้ใน Google Maps"
    };
    ws[ref].s = Object.assign({}, ws[ref].s, {
      font: {
        name: FONT,
        sz: 10,
        bold: true,
        underline: true,
        color: {
          rgb: "1155CC"
        }
      }
    });
  });
  return ws;
}
function TmOtModal({
  rec,
  cfg,
  jobs,
  users,
  role,
  currentUser,
  onSave,
  onMove,
  onDelete,
  onClose
}) {
  const [f, setF] = React.useState(rec);
  React.useEffect(() => {
    setF(rec);
  }, [rec && rec.id]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  const isAdmin = window.usePgAdmin ? window.usePgAdmin() : false;
  if (!f) return null;
  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && f.status === "draft";
  const set = (k, v) => setF(p => {
    let next = Object.assign({}, p, {
      [k]: v
    });
    if (k === "kind") next.rate = window.tmOtRate(v, cfg);
    if (next.status === "draft") next = window.tmOtFill(next, cfg);
    return next;
  });
  const pend = f.status === "draft" || f.status === "sent";
  const cur = pend ? window.tmOtFill(f, cfg) : f;
  const mins = pend ? cur.mins : +f.mins || 0;
  const rate = window.tmOtRate(cur, cfg);
  const span = window.tmSpanMins(f.from, f.to);
  const nexts = window.tmOtNext(f, role, currentUser);
  const why = window.tmOtApproveCheck(f, currentUser, role).why;
  return React.createElement("div", _extends({
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(15,23,42,.45)",
      display: "grid",
      placeItems: "center",
      padding: 18
    }
  }, box), React.createElement("div", {
    style: {
      width: "min(620px,100%)",
      maxHeight: "90vh",
      overflow: "auto",
      background: "var(--bg)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: 17,
      padding: 20
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, f.no), React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmNameOf(users, f.userId, f.userName))), React.createElement(TmPill, {
    s: f.status
  }), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "var(--text-3)"
  }))), React.createElement("div", {
    style: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: f.date,
    disabled: !editable,
    onChange: e => set("date", e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement(window.PgTime, {
    value: f.from,
    disabled: !editable,
    onChange: t => set("from", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E16\u0E36\u0E07"), React.createElement(window.PgTime, {
    value: f.to,
    disabled: !editable,
    onChange: t => set("to", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement("select", {
    value: f.kind,
    disabled: !editable,
    onChange: e => set("kind", e.target.value),
    style: TM_IN_W
  }, window.TM_OT_KIND.map(k => React.createElement("option", {
    key: k.key,
    value: k.key
  }, k.th))))), React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 20,
      fontWeight: 800,
      color: mins ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, window.tmDur(mins)), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ", window.tmDur(span))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, cur.parts && cur.parts.length ? window.tmOtPartsTH(cur.parts) : window.tmRateTH(rate)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "= ", (Math.round(window.tmOtPayMins(Object.assign({}, cur, {
    mins: mins
  }), cfg) / 60 * 100) / 100).toFixed(2), " \u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07")), React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.tmIsWorkday(f.date, cfg) ? "วันทำงาน — นับตามช่วงที่กรอกทั้งช่วง" : "วันหยุด — " + window.tmDur(window.tmWhNorm(cfg).workMins) + " แรก (หักพัก " + window.tmDur(window.tmWhNorm(cfg).lunchMins) + ") ×" + window.tmWhNorm(cfg).otRates.holiday + " · เกินจากนั้น ×" + window.tmWhNorm(cfg).otRates.holidayOt, window.tmWhNorm(cfg).roundMins > 0 ? " · ปัดลงทีละ " + window.tmWhNorm(cfg).roundMins + " นาที" : "", window.tmWhNorm(cfg).minOtMins > 0 ? " · ไม่ถึง " + window.tmWhNorm(cfg).minOtMins + " นาทีไม่นับ" : "")), React.createElement("label", {
    style: {
      marginTop: 12,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07"), React.createElement("select", {
    value: f.jobId || "",
    disabled: !editable,
    onChange: e => {
      const j = (jobs || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        jobId: j ? j.id : null,
        jobCode: j ? j.code : ""
      }));
    },
    style: TM_IN
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E07\u0E32\u0E19 \u2014"), (jobs || []).map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name)))), React.createElement("label", {
    style: {
      marginTop: 10,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E19\u0E2D\u0E01\u0E40\u0E27\u0E25\u0E32"), React.createElement("textarea", {
    value: f.reason || "",
    disabled: !editable,
    rows: 3,
    onChange: e => set("reason", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E02\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49\u0E40\u0E0A\u0E49\u0E32",
    style: Object.assign({}, TM_IN, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("label", {
    style: {
      marginTop: 10,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), editable ? React.createElement("select", {
    value: f.approverId || "",
    onChange: e => {
      const u = (users || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        approverId: u ? u.id : null,
        approverName: u ? u.name : ""
      }));
    },
    style: TM_IN
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07) \u2014"), window.tmOtApprovers(users, {
    id: f.userId
  }).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name))) : React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: f.approverName ? "var(--text-1)" : "#F59E0B",
      fontWeight: 700
    }
  }, f.approverName || "ไม่ได้ระบุคนอนุมัติ — ใบนี้อยู่ในกองกลาง")), editable && !f.approverId && React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "#F59E0B",
      lineHeight: 1.6
    }
  }, "\u0E2A\u0E48\u0E07\u0E44\u0E14\u0E49\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u0E41\u0E15\u0E48\u0E43\u0E1A\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E01\u0E47\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2B\u0E22\u0E34\u0E1A \u2014 \u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E27\u0E49\u0E43\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E04\u0E49\u0E32\u0E07"), f.cancelledAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E42\u0E14\u0E22\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E43\u0E1A \xB7 ", window.drShort(String(f.cancelledAt).slice(0, 10))), f.decidedAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, window.tmOtStatusOf(f.status).th, " \u0E42\u0E14\u0E22 ", f.decidedByName || "-", " \xB7 ", window.drShort(String(f.decidedAt).slice(0, 10)), f.decidedNote ? React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, "\u201C", f.decidedNote, "\u201D") : null), React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, editable && React.createElement("button", {
    onClick: () => {
      onSave(cur);
      onClose();
    },
    style: {
      padding: "9px 16px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), nexts.map(s => {
    const soft = s.key === "cancelled" || s.key === "draft" && f.status === "sent" && !mine;
    const label = s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ" : s.key === "cancelled" ? "ยกเลิกใบนี้" : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
    return React.createElement("button", {
      key: s.key,
      onClick: () => {
        onMove(cur, s.key);
        onClose();
      },
      style: {
        padding: "9px 16px",
        borderRadius: "var(--r-chip)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        border: soft ? "1px solid var(--border-strong)" : "none",
        background: soft ? "var(--surface)" : s.color,
        color: soft ? s.color : "#fff"
      }
    }, label);
  }), f.status === "sent" && !mine && why && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, why), (mine && f.status === "draft" || isAdmin) && onDelete && React.createElement("button", {
    onClick: async () => {
      const ok = await window.askConfirm({
        title: "ลบใบ " + (f.no || "OT") + " ?",
        body: "ลบแล้วกู้คืนไม่ได้",
        ok: "ลบใบนี้",
        danger: true
      });
      if (ok) {
        onDelete(f.id);
        onClose();
      }
    },
    style: {
      marginLeft: "auto",
      padding: "9px 14px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49"))));
}
function TmOtRow({
  rec,
  users,
  onOpen
}) {
  const k = window.tmOtKindOf(rec.kind);
  return React.createElement("button", {
    onClick: () => onOpen(rec),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "11px 14px",
      border: "none",
      borderBottom: "1px solid var(--divider)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, rec.no), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmNameOf(users, rec.userId, rec.userName)), React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: "var(--r-pill)",
      background: k.color + "1A",
      color: k.color,
      fontSize: 10.5,
      fontWeight: 800
    }
  }, k.th), React.createElement(TmPill, {
    s: rec.status,
    size: "sm"
  }), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmDur(rec.mins))), React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, window.drDateTH(rec.date), " \xB7 ", rec.from, "-", rec.to, rec.jobCode ? " · " + rec.jobCode : "", rec.reason ? " · " + rec.reason : ""));
}
function TmOfficeCfg({
  office,
  onChange
}) {
  const o = office || {};
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k, v) => onChange(Object.assign({}, o, {
    [k]: v
  }));
  const has = o.lat != null && o.lng != null && o.lat !== "" && o.lng !== "";
  const useHere = async () => {
    setBusy(true);
    setErr("");
    const g = await window.captureGps();
    setBusy(false);
    if (!g || g.err) {
      setErr(g && g.msg ? g.msg : "จับพิกัดไม่สำเร็จ");
      return;
    }
    onChange(Object.assign({}, o, {
      lat: g.lat,
      lng: g.lng
    }));
  };
  const numIn = (k, ph) => React.createElement("input", {
    type: "number",
    step: "0.000001",
    value: o[k] == null ? "" : o[k],
    placeholder: ph,
    onChange: e => set(k, e.target.value === "" ? null : +e.target.value),
    style: TM_IN_W
  });
  return React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E40\u0E23\u0E35\u0E22\u0E01"), React.createElement("input", {
    value: o.name || "",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E43\u0E2B\u0E0D\u0E48",
    maxLength: 60,
    onChange: e => set("name", e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E30\u0E15\u0E34\u0E08\u0E39\u0E14 (lat)"), numIn("lat", "13.736717")), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E2D\u0E07\u0E08\u0E34\u0E08\u0E39\u0E14 (lng)"), numIn("lng", "100.523186")), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E31\u0E28\u0E21\u0E35\u0E17\u0E35\u0E48\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E16\u0E36\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28 (\u0E21.)"), React.createElement("input", {
    type: "number",
    min: 20,
    max: 5000,
    step: 10,
    value: o.radius == null ? 150 : o.radius,
    onChange: e => set("radius", +e.target.value),
    style: TM_IN_W
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 9
    }
  }, React.createElement("button", {
    onClick: useHere,
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-1)",
      cursor: busy ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 800
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 13
  }), " ", busy ? "กำลังจับพิกัด…" : "ใช้ตำแหน่งที่ยืนอยู่ตอนนี้"), has && React.createElement("a", {
    href: window.tmGpsUrl(o),
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--primary)"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39\u0E43\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 \u2197"), has && React.createElement("button", {
    onClick: () => onChange(Object.assign({}, o, {
      lat: null,
      lng: null
    })),
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--tint-red-tx2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700
    }
  }, "\u0E25\u0E49\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14"), err && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, err)), React.createElement("div", {
    style: {
      marginTop: 11,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      border: "none",
      boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B66" : "var(--shadow-sm)",
      background: o.lock ? "rgba(245,158,11,.07)" : "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => has && set("lock", !o.lock),
    disabled: !has,
    "aria-pressed": !!o.lock,
    title: has ? "" : "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดล็อกได้",
    style: {
      position: "relative",
      width: 52,
      height: 30,
      borderRadius: "var(--r-pill)",
      flexShrink: 0,
      border: "none",
      boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B" : "var(--shadow-sm)",
      background: !has ? "var(--surface2)" : o.lock ? "#F59E0B" : "var(--surface2)",
      cursor: has ? "pointer" : "not-allowed",
      padding: 0
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: o.lock ? 25 : 3,
      width: 22,
      height: 22,
      borderRadius: "var(--r-pill)",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(8,20,14,.3)",
      transition: "left .15s"
    }
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E25\u0E47\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E2D\u0E19\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 ", o.lock ? "· เปิดอยู่" : "· ปิดอยู่"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, !has ? "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดได้" : o.lock ? "กดเข้างานได้เฉพาะตอนอยู่ในรัศมี " + (o.radius == null ? 150 : o.radius) + " ม. จากพิกัดนี้" : "กดเข้างานได้จากทุกที่ ระบบบันทึกระยะห่างไว้ให้ดูเฉย ๆ"))), o.lock && React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      lineHeight: 1.75
    }
  }, React.createElement("b", null, "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E39\u0E49\u0E44\u0E27\u0E49"), " \u2014 GPS \u0E43\u0E19\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E04\u0E25\u0E32\u0E14\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E49\u0E2D\u0E22\u0E40\u0E21\u0E15\u0E23 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E2D\u0E32\u0E08\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E16\u0E49\u0E32\u0E40\u0E08\u0E2D\u0E1A\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E31\u0E28\u0E21\u0E35\u0E41\u0E17\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E17\u0E34\u0E49\u0E07 \xB7 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E08\u0E30\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22", React.createElement("br", null), "\u0E01\u0E32\u0E23", React.createElement("b", null, "\u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E16\u0E39\u0E01\u0E25\u0E47\u0E2D\u0E01"), " \u2014 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E34\u0E14\u0E01\u0E30\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E21\u0E2D \u0E44\u0E21\u0E48\u0E07\u0E31\u0E49\u0E19\u0E08\u0E30\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E01\u0E30\u0E04\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E15\u0E32\u0E21\u0E41\u0E01\u0E49")), React.createElement("div", {
    style: {
      marginTop: 9,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, has ? React.createElement("span", null, "\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48 ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, (+o.lat).toFixed(6), ", ", (+o.lng).toFixed(6)), " ", "\xB7 \u0E1B\u0E31\u0E4A\u0E21\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E31\u0E28\u0E21\u0E35 ", React.createElement("b", null, o.radius == null ? 150 : o.radius, " \u0E21."), " \u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E27\u0E48\u0E32 \u201C\u0E16\u0E36\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u201D") : React.createElement("b", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28 \u2014 \u0E41\u0E1C\u0E48\u0E19\u0E40\u0E27\u0E25\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07"), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21 \u201C\u0E43\u0E0A\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u201D \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E15\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E01\u0E14\u0E08\u0E32\u0E01\u0E17\u0E35\u0E48\u0E1A\u0E49\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E30\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E49\u0E32\u0E19 \u0E42\u0E14\u0E22\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E30\u0E44\u0E23\u0E40\u0E15\u0E37\u0E2D\u0E19", React.createElement("br", null), "\u0E1B\u0E01\u0E15\u0E34\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E40\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E44\u0E01\u0E25 \u0E08\u0E30\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E47\u0E15\u0E48\u0E2D\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14 ", React.createElement("b", null, "\u0E25\u0E47\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14"), " \u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E32\u0E07\u0E25\u0E48\u0E32\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19", React.createElement("br", null), "\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E04\u0E19\u0E17\u0E35\u0E48\u0E01\u0E14 \u201C\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u201D \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \xB7 \u0E07\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49")));
}
function TmWorkHours({
  cfg,
  onSave
}) {
  const [f, setF] = React.useState(window.tmWhNorm(cfg));
  React.useEffect(() => {
    setF(window.tmWhNorm(cfg));
  }, [cfg]);
  const [hDate, setHDate] = React.useState("");
  const [hName, setHName] = React.useState("");
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 640
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement(window.PgTime, {
    value: f.startEarly,
    onChange: t => set("startEarly", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E0A\u0E49\u0E32\u0E2A\u0E38\u0E14"), React.createElement(window.PgTime, {
    value: f.startLate,
    onChange: t => set("startLate", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E25\u0E30 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    step: 30,
    value: f.workMins,
    onChange: e => set("workMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1E\u0E31\u0E01\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.lunchMins,
    onChange: e => set("lunchMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "OT \u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33\u0E17\u0E35\u0E48\u0E19\u0E31\u0E1A (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.minOtMins,
    onChange: e => set("minOtMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E31\u0E14\u0E40\u0E28\u0E29 OT \u0E17\u0E35\u0E25\u0E30 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.roundMins,
    onChange: e => set("roundMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14 OT \u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "number",
    min: 0,
    max: 28,
    value: f.cutoffDay,
    onChange: e => set("cutoffDay", +e.target.value),
    style: TM_IN_W
  }))), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E23\u0E2D\u0E1A\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", null, window.tmPeriodTH(window.tmPeriodOf(window.drToday(), f))), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, window.tmWhNorm(f).cutoffDay ? "ใบ OT ของวันที่ " + window.tmWhNorm(f).cutoffDay + " นับเข้ารอบนี้ · วันที่ " + (window.tmWhNorm(f).cutoffDay + 1) + " เป็นต้นไปนับเข้ารอบถัดไป" : "ใส่ 0 = ใช้เดือนปฏิทิน (วันที่ 1 ถึงสิ้นเดือน) · ถ้าฝ่ายบุคคลปิดยอดวันที่ 25 ให้ใส่ 25", React.createElement("br", null), "\u0E15\u0E31\u0E49\u0E07\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 28 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E44\u0E21\u0E48\u0E21\u0E35\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 29-31 \u0E17\u0E38\u0E01\u0E1B\u0E35 \u0E23\u0E2D\u0E1A\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E40\u0E07\u0E35\u0E22\u0E1A \u0E46")), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E40\u0E02\u0E49\u0E32 ", f.startEarly, " \u2192 \u0E40\u0E25\u0E34\u0E01 ", React.createElement("b", null, window.tmWhNorm(f).end), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, " (\u0E17\u0E33\u0E07\u0E32\u0E19 ", window.tmDur(f.workMins), " + \u0E1E\u0E31\u0E01 ", window.tmDur(f.lunchMins), ")"), React.createElement("br", null), "\u0E40\u0E02\u0E49\u0E32 ", f.startLate, " \u2192 \u0E40\u0E25\u0E34\u0E01 ", React.createElement("b", null, window.tmDayWindow({
    in: {
      hm: f.startLate
    }
  }, f).end), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19 ", f.startEarly, " \u0E44\u0E21\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E40\u0E25\u0E34\u0E01\u0E40\u0E23\u0E47\u0E27\u0E02\u0E36\u0E49\u0E19 \xB7 \u0E40\u0E02\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E07 ", f.startLate, " \u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E15\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E19\u0E31\u0E1A\u0E27\u0E48\u0E32\u0E2A\u0E32\u0E22\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E07 ", f.startLate, " \u0E41\u0E25\u0E49\u0E27\u0E17\u0E33\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A ", window.tmDur(f.workMins), " (\u0E17\u0E33\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E44\u0E21\u0E48\u0E19\u0E31\u0E1A\u0E2A\u0E32\u0E22)")), React.createElement(TmOfficeCfg, {
    office: f.office,
    onChange: o => set("office", o)
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07 OT (\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 10
    }
  }, window.TM_OT_KIND.map(k => React.createElement("label", {
    key: k.key,
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: k.color
    }
  }, k.th), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement("input", {
    type: "number",
    min: 0,
    max: 10,
    step: 0.5,
    value: (f.otRates || {})[k.key] != null ? (f.otRates || {})[k.key] : "",
    onChange: e => set("otRates", Object.assign({}, f.otRates, {
      [k.key]: e.target.value === "" ? "" : +e.target.value
    })),
    style: Object.assign({}, TM_IN, {
      width: 88
    })
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E40\u0E17\u0E48\u0E32")), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, k.hint)))), React.createElement("div", {
    style: {
      marginTop: 9,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E15\u0E32\u0E21\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19\u0E44\u0E17\u0E22 (\u0E1E.\u0E23.\u0E1A.\u0E04\u0E38\u0E49\u0E21\u0E04\u0E23\u0E2D\u0E07\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19 \u0E21.61-63) \u2014 \u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19 1.5 \u0E40\u0E17\u0E48\u0E32 \xB7 \u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 2 \u0E40\u0E17\u0E48\u0E32 \xB7 \u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 3 \u0E40\u0E17\u0E48\u0E32", React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u201C\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u201D \u0E15\u0E31\u0E49\u0E07 2 \u0E40\u0E17\u0E48\u0E32\u0E44\u0E27\u0E49\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19 \u2014 \u0E16\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E25\u0E39\u0E01\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01 1 \u0E40\u0E17\u0E48\u0E32 \u0E43\u0E2B\u0E49\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19 1 \xB7 \u201C\u0E07\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19\u201D \u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E44\u0E27\u0E49\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E17\u0E35\u0E48\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07", React.createElement("br", null), "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E44\u0E14\u0E49 \u0E41\u0E15\u0E48\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E31\u0E19\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49 \u0E15\u0E31\u0E49\u0E07\u0E40\u0E17\u0E48\u0E32\u0E44\u0E2B\u0E23\u0E48\u0E01\u0E47\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E19\u0E08\u0E23\u0E34\u0E07", React.createElement("br", null), React.createElement("b", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E48 \u201C\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u201D (\u0E19\u0E32\u0E17\u0E35\u0E08\u0E23\u0E34\u0E07 \xD7 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13) \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E04\u0E34\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19"), "\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E40\u0E2D\u0E32\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E44\u0E1B\u0E04\u0E39\u0E13\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E04\u0E19\u0E15\u0E48\u0E2D", React.createElement("br", null), "\u0E41\u0E01\u0E49\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E40\u0E01\u0E48\u0E32 \u0E43\u0E1A\u0E41\u0E15\u0E48\u0E25\u0E30\u0E43\u0E1A\u0E16\u0E48\u0E32\u0E22\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E31\u0E27\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27"))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, DAYS.map((d, i) => {
    const on = f.days.indexOf(i) >= 0;
    return React.createElement("button", {
      key: i,
      onClick: () => set("days", on ? f.days.filter(x => x !== i) : f.days.concat([i]).sort()),
      style: {
        width: 46,
        padding: "8px 0",
        borderRadius: "var(--r-chip)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, d);
  }))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E17\u0E35\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, React.createElement("input", {
    type: "date",
    value: hDate,
    onChange: e => setHDate(e.target.value),
    style: TM_IN
  }), React.createElement("input", {
    value: hName,
    onChange: e => setHName(e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14",
    style: Object.assign({}, TM_IN, {
      flex: 1,
      minWidth: 160
    })
  }), React.createElement("button", {
    disabled: !hDate,
    onClick: () => {
      set("holidays", Object.assign({}, f.holidays, {
        [hDate]: hName || "วันหยุด"
      }));
      setHDate("");
      setHName("");
    },
    style: {
      padding: "9px 15px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: hDate ? "var(--primary)" : "var(--surface3)",
      color: hDate ? "#fff" : "var(--text-3)",
      cursor: hDate ? "pointer" : "default",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21")), Object.keys(f.holidays || {}).sort().map(d => React.createElement("div", {
    key: d,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "7px 11px",
      borderBottom: "1px solid var(--divider)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, window.drDateTH(d)), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, f.holidays[d]), React.createElement("button", {
    onClick: () => {
      const h = Object.assign({}, f.holidays);
      delete h[d];
      set("holidays", h);
    },
    style: {
      marginLeft: "auto",
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "var(--tint-red-tx2)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E25\u0E1A"))), Object.keys(f.holidays || {}).length === 0 && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E27\u0E31\u0E19\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E48\u0E07\u0E23\u0E2D\u0E1A\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A \u201C\u0E2A\u0E23\u0E38\u0E1B\u0E40\u0E14\u0E37\u0E2D\u0E19\u201D \u0E41\u0E25\u0E30\u0E1A\u0E19\u0E43\u0E1A OT \u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2D\u0E2D\u0E01\u0E44\u0E1B \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27", React.createElement("br", null), "\u0E04\u0E48\u0E32\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13\u0E27\u0E48\u0E32 \u201C\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E21\u0E32\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT \u0E01\u0E35\u0E48\u0E19\u0E32\u0E17\u0E35\u201D \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E15\u0E2D\u0E1A\u0E41\u0E17\u0E19\u0E43\u0E2B\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E01\u0E32\u0E23\u0E40\u0E14\u0E32\u0E41\u0E17\u0E19\u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E01\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E1A\u0E2D\u0E01\u0E40\u0E25\u0E22", React.createElement("br", null), "\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E40\u0E01\u0E48\u0E32 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E19\u0E32\u0E17\u0E35\u0E44\u0E27\u0E49\u0E43\u0E19\u0E15\u0E31\u0E27\u0E43\u0E1A\u0E02\u0E2D\u0E07\u0E21\u0E31\u0E19\u0E40\u0E2D\u0E07"), React.createElement("div", null, React.createElement("button", {
    onClick: () => onSave(f),
    style: {
      padding: "10px 20px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19")));
}
const TM_CSS = `
.tmv{display:flex;flex-direction:column;gap:16px;min-height:0}
.tmv-card{background:var(--surface);border:1px solid var(--card-bd);border-radius:var(--r-card);padding:18px 20px}
.tmv-hero{display:flex;flex-wrap:wrap;justify-content:space-between;gap:18px 28px;align-items:center;padding:20px 24px}
.tmv-hero-me{display:flex;align-items:center;gap:16px;min-width:0;flex:1 1 300px}
.tmv-hero-ic{width:54px;height:54px;border-radius:var(--r-tile);display:grid;place-items:center;flex-shrink:0}
.tmv-k{font-size:12px;font-weight:700;color:var(--text-3)}
.tmv-big{font-family:var(--display);font-size:30px;font-weight:700;line-height:1.2;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.tmv-big small{font-size:16px;font-weight:600;color:var(--text-3);margin:0 4px}
.tmv-hero-r{display:flex;align-items:center;gap:16px 24px;flex-wrap:wrap;justify-content:flex-end;flex:0 1 auto}
.tmv-team{display:grid;gap:8px;width:310px;max-width:100%}
.tmv-stack{display:flex;gap:2px;height:9px;border-radius:var(--r-pill);overflow:hidden;background:var(--surface3)}
.tmv-stack i{display:block;height:100%}
.tmv-leg{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:11.5px;font-weight:700;color:var(--text-3)}
.tmv-leg span{display:inline-flex;align-items:center;gap:5px}
.tmv-leg b{font-family:var(--display);font-size:17px;font-weight:700;color:var(--text-1)}
.tmv-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tmv-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:var(--r-pill);font-size:11px;font-weight:700;white-space:nowrap}
.tmv-seg{display:flex;gap:3px;padding:4px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-inset);width:fit-content;max-width:100%;overflow-x:auto;scrollbar-width:none}
.tmv-seg::-webkit-scrollbar{display:none}
.tmv-seg>button{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border:none;border-radius:var(--r-pill);background:transparent;color:var(--text-3);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0}
.tmv-seg>button:hover{color:var(--text-1)}
.tmv-seg>button.on{background:var(--surface);color:var(--text-1);box-shadow:var(--shadow-sm)}
.tmv-seg.sm>button{padding:6px 13px;font-size:12px}
.tmv-badge{min-width:19px;padding:1px 6px;border-radius:var(--r-pill);background:var(--tint-amber-bg2);color:var(--tint-amber-tx);font-family:var(--mono);font-size:10.5px;font-weight:800;text-align:center}
.tmv-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tmv-hd{display:flex;align-items:baseline;gap:6px 10px;flex-wrap:wrap;margin-bottom:12px}
.tmv-hd .t{font-size:14px;font-weight:700;color:var(--text-1)}
.tmv-hd .s{font-size:11.5px;color:var(--text-3)}
.tmv-hd .r{margin-left:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.tmv-ib{width:34px;height:34px;display:grid;place-items:center;border:none;border-radius:var(--r-chip);background:var(--surface2);box-shadow:var(--shadow-sm);color:var(--text-2);cursor:pointer;flex-shrink:0;padding:0}
.tmv-ib:hover{background:var(--surface3);color:var(--text-1)}
.tmv-ib.dngr{color:var(--tint-red-tx2)}
.tmv-ib.xs{width:30px;height:30px}
.tmv-date{font-family:var(--display);font-size:19px;font-weight:700;color:var(--text-1);padding:0 6px;white-space:nowrap}
.tmv-sw{display:inline-block;width:16px;height:8px;border-radius:var(--r-pill)}
.tmv-tl-row{display:grid;grid-template-columns:230px minmax(0,1fr) 112px 72px;grid-template-areas:"who trk tim act";align-items:center;column-gap:16px;padding:9px 0;border-top:1px solid var(--divider)}
.tmv-tl-row.axis{border-top:none;padding:0 0 2px}
.tmv-who{grid-area:who;display:flex;align-items:center;gap:10px;min-width:0}
.tmv-who-n{font-size:13.5px;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmv-who-s{font-size:11px;color:var(--text-3);display:flex;gap:4px 8px;align-items:center;flex-wrap:wrap;margin-top:1px}
.tmv-trk{grid-area:trk;position:relative;height:26px;border-radius:8px;background:var(--surface2);overflow:visible}
.tmv-axis{grid-area:trk;position:relative;height:16px}
.tmv-axis span{position:absolute;top:0;transform:translateX(-50%);font-family:var(--mono);font-size:10px;font-weight:600;color:var(--text-3)}
.tmv-band{position:absolute;top:0;bottom:0;background:var(--primary-soft)}
.tmv-tick{position:absolute;top:0;bottom:0;width:1px;background:var(--divider)}
.tmv-span{position:absolute;top:6px;bottom:6px;border-radius:var(--r-pill);background:var(--primary);min-width:8px}
.tmv-span.live{background:repeating-linear-gradient(-45deg,var(--primary) 0 5px,var(--primary-bright) 5px 10px)}
.tmv-span.forgot{background:var(--tint-red-tx2)}
.tmv-now{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;border-radius:2px;background:var(--tint-red-tx2)}
.tmv-tim{grid-area:tim;text-align:right;line-height:1.35}
.tmv-tim b{display:block;font-family:var(--mono);font-size:12.5px;font-weight:700;color:var(--text-1);white-space:nowrap}
.tmv-tim span{font-size:11px;color:var(--text-3);white-space:nowrap}
.tmv-act{grid-area:act;display:flex;gap:6px;justify-content:flex-end}
.tmv-empty{display:grid;justify-items:center;gap:8px;padding:30px 12px;text-align:center;font-size:13px;color:var(--text-3)}
.tmv-empty i{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--surface2)}
.tmv-people{display:flex;flex-wrap:wrap;gap:8px}
.tmv-person{display:inline-flex;align-items:center;gap:8px;padding:4px 5px 4px 4px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-sm);font-size:12.5px;font-weight:700;color:var(--text-1)}
.tmv-person>span:last-child:not(.tmv-av){padding-right:8px}
.tmv-person .x{padding:4px 10px;border:none;border-radius:var(--r-pill);background:var(--primary-soft);color:var(--primary-dark);font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer}
.tmv-list{display:grid;gap:9px}
.tmv-grp{display:flex;align-items:baseline;gap:8px;margin:10px 4px 0;font-size:13px;font-weight:700;color:var(--text-1)}
.tmv-grp:first-child{margin-top:0}
.tmv-grp span{font-size:11.5px;font-weight:600;color:var(--text-3)}
.tmv-req{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:0 14px;align-items:center;padding:13px 16px;border-radius:var(--r-tile);background:var(--surface);box-shadow:var(--shadow-sm);cursor:pointer;transition:transform .15s,box-shadow .15s;outline:none}
.tmv-req:hover,.tmv-req:focus-visible{transform:translateY(-2px);box-shadow:var(--hov-sh)}
.tmv-req:active{transform:translateY(0)}
.tmv-req-ic{width:44px;height:44px;border-radius:var(--r-tile);display:grid;place-items:center}
.tmv-req-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;font-weight:700;color:var(--text-1)}
.tmv-req-s{margin-top:3px;font-size:12px;color:var(--text-2);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tmv-req-r{font-size:11.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmv-req-amt{display:grid;gap:6px;justify-items:end}
.tmv-req-amt b{font-family:var(--display);font-size:20px;font-weight:700;color:var(--text-1);white-space:nowrap}
.tmv-no{font-family:var(--mono);font-size:10.5px;font-weight:600;color:var(--text-3)}
.tmv-search{display:flex;align-items:center;gap:8px;padding:0 14px;height:40px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-inset);flex:1 1 220px;max-width:300px}
.tmv-search input{flex:1;min-width:0;border:none !important;background:transparent !important;box-shadow:none !important;outline:none;font-family:inherit;font-size:13px;color:var(--text-1);padding:0}
.tmv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));padding:8px 4px}
.tmv-stat{padding:8px 20px;border-left:1px solid var(--divider)}
.tmv-stat:first-child{border-left:none}
.tmv-stat .l{font-size:11.5px;font-weight:700;color:var(--text-3)}
.tmv-stat .v{font-family:var(--display);font-size:28px;font-weight:700;line-height:1.25;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.tmv-stat .v small{font-family:var(--sans);font-size:12px;font-weight:600;color:var(--text-3);margin-left:5px}
.tmv-pp{border-radius:var(--r-tile);background:var(--surface);box-shadow:var(--shadow-sm)}
.tmv-pp.dim{opacity:.6}
.tmv-pp-row{display:grid;grid-template-columns:210px minmax(0,1fr) 170px auto;grid-template-areas:"who heat ot act";align-items:center;gap:10px 20px;padding:13px 16px}
.tmv-heat{grid-area:heat;min-width:0;max-width:560px}
.tmv-heat-g{display:grid;gap:3px}
.tmv-heat-g i{display:block;height:24px;border-radius:5px;background:color-mix(in srgb,var(--text-3) 20%,transparent)}
.tmv-heat-g i.off{background:color-mix(in srgb,var(--st-design-fg) 34%,transparent)}
.tmv-heat-g i.offw{box-shadow:inset 0 -4px 0 var(--st-design-fg)}
.tmv-heat-g i.forgot{background:var(--tint-red-tx2)}
.tmv-heat-ax{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9.5px;color:var(--text-3);margin-top:3px}
.tmv-ot{grid-area:ot;display:grid;gap:3px;font-size:11.5px;color:var(--text-3)}
.tmv-ot b{font-family:var(--display);font-size:16px;font-weight:700;color:var(--text-1);margin-right:3px}
.tmv-pp-act{grid-area:act;display:flex;gap:6px;align-items:center;justify-content:flex-end}
.tmv-pp-more{padding:2px 16px 16px}
.tmv-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;max-width:760px}
.tmv-cal .h{text-align:center;font-size:10.5px;font-weight:700;color:var(--text-3)}
.tmv-cal .d{min-width:0;min-height:58px;padding:7px 9px;border-radius:var(--r-chip);background:var(--surface2)}
.tmv-cal .d.on{background:var(--surface);box-shadow:var(--shadow-sm)}
.tmv-cal .d.bad{box-shadow:inset 0 0 0 1px var(--tint-red-bd)}
.tmv-cal .d.off{opacity:.45}
.tmv-cal .d.pk{cursor:pointer;transition:transform .12s,box-shadow .12s,opacity .12s}
.tmv-cal .d.pk:hover{opacity:1;transform:translateY(-2px);box-shadow:var(--hov-sh)}
.tmv-cal .d.pk.off:hover::after{content:"+ ลงแทน";display:block;font-size:10.5px;font-weight:700;color:var(--primary-dark);margin-top:2px}
/* แคบ (กว้างของพื้นที่หน้า < 860 ไม่ใช่กว้างจอ — แถบเมนูข้างกินที่ไปแล้ว) ดู useTmNarrow */
.tmv.nw .tmv-hero{padding:16px}
.tmv.nw .tmv-hero-r{justify-content:flex-end;flex:1 1 100%}
.tmv.nw .tmv-team{width:auto;flex:1 1 220px}
.tmv.nw .tmv-big{font-size:26px}
.tmv.nw .tmv-card{padding:14px}
.tmv.nw .tmv-tl-row{grid-template-columns:minmax(0,1fr) auto auto;grid-template-areas:"who tim act" "trk trk trk";row-gap:8px}
.tmv.nw .tmv-tl-row.axis{display:none}
.tmv.nw .tmv-pp-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"who act" "heat heat" "ot ot"}
.tmv.nw .tmv-ot{grid-auto-flow:column;justify-content:start;gap:14px}
.tmv.nw .tmv-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
.tmv.nw .tmv-stat{padding:8px 12px}
.tmv.nw .tmv-stat:nth-child(odd){border-left:none}
.tmv.nw .tmv-req{grid-template-columns:40px minmax(0,1fr) auto;gap:0 12px;padding:12px 13px}
.tmv.nw .tmv-req-ic{width:40px;height:40px}
.tmv.nw .tmv-req-amt b{font-size:17px}
.tmv.nw .tmv-search{max-width:none}
@media (prefers-reduced-motion:reduce){.tmv-req:hover,.tmv-req:focus-visible{transform:none}}`;
const tmMinOf = s => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s || ""));
  return m ? +m[1] * 60 + +m[2] : null;
};
const tmHrs = m => !m ? "0" : (Math.round(m / 60 * 10) / 10).toLocaleString("en-US", {
  maximumFractionDigits: 1
});
function TmCard({
  children,
  className,
  style
}) {
  return React.createElement("div", {
    className: "tmv-card" + (className ? " " + className : ""),
    style: Object.assign({
      boxShadow: "var(--shadow-card)"
    }, style)
  }, children);
}
const TM_AV_K = ["takeoff", "design", "install", "done", "queue"];
function TmAvatar({
  uid,
  name,
  size
}) {
  const s = size || 32;
  const img = window.useUserAvatar ? window.useUserAvatar(uid).avatar : null;
  const k = TM_AV_K[Array.from(String(uid || name || "")).reduce((a, c) => a + c.charCodeAt(0), 0) % TM_AV_K.length];
  const ini = (String(name || "?").replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, "").replace(/^[เแโใไ]/, "").trim().charAt(0) || "?").toUpperCase();
  return img ? React.createElement("img", {
    className: "tmv-av",
    src: img,
    alt: "",
    style: {
      width: s,
      height: s,
      borderRadius: "50%",
      objectFit: "cover",
      flexShrink: 0
    }
  }) : React.createElement("span", {
    className: "tmv-av",
    style: {
      width: s,
      height: s,
      borderRadius: "50%",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--st-" + k + "-soft)",
      color: "var(--st-" + k + "-fg)",
      fontSize: Math.round(s * 0.42),
      fontWeight: 700
    }
  }, ini);
}
function TmSeg({
  items,
  value,
  onChange,
  sm
}) {
  return React.createElement("div", {
    className: "tmv-seg" + (sm ? " sm" : ""),
    role: "tablist"
  }, items.map(it => React.createElement("button", {
    key: it.k,
    role: "tab",
    "aria-selected": value === it.k,
    className: value === it.k ? "on" : "",
    onClick: () => onChange(it.k)
  }, it.ic && React.createElement(Icon, {
    name: it.ic,
    size: sm ? 13 : 15,
    color: value === it.k ? "var(--primary)" : "currentColor"
  }), it.th, it.n > 0 && React.createElement("span", {
    className: "tmv-badge"
  }, it.n))));
}
function TmHelp({
  children
}) {
  return React.createElement("details", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7,
      padding: "0 4px"
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--text-2)",
      width: "fit-content"
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E27\u0E34\u0E18\u0E35\u0E04\u0E34\u0E14 / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, children));
}
function TmFacts({
  items
}) {
  return React.createElement("div", {
    className: "tmv-leg"
  }, items.filter(Boolean).map((it, i) => React.createElement("span", {
    key: i,
    title: it.hint || ""
  }, it.label, " ", React.createElement("b", {
    style: {
      color: it.color || undefined
    }
  }, it.value), " ", it.unit)));
}
function useTmDayStatus(date, cfg, users) {
  const lvRows = window.useLeaves().rows;
  const lvTypes = window.useLeaveTypes().types;
  const onLeave = React.useMemo(() => window.lvOnDay(lvRows, date), [lvRows, date]);
  const day = window.useAttendDay(date);
  const workday = window.tmIsWorkday(date, cfg);
  const rows = React.useMemo(() => (day.rows || []).filter(r => !window.tmIsSysAcct({
    id: r.userId
  })), [day.rows]);
  const missing = React.useMemo(() => {
    if (!workday) return [];
    const have = {};
    rows.forEach(r => {
      have[r.userId] = 1;
    });
    return (users || []).filter(u => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend") && !have[u.id] && !onLeave[u.id]);
  }, [rows, users, workday, onLeave]);
  const leaving = (users || []).filter(u => u && onLeave[u.id] && !rows.some(r => r.userId === u.id));
  return {
    rows,
    loading: day.loading,
    missing,
    leaving,
    onLeave,
    lvTypes,
    workday
  };
}
function useTmNarrow() {
  const ref = React.useRef(null);
  const [nw, setNw] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => setNw(el.clientWidth < 860));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [nw, ref];
}
function useTmNow(on) {
  const [, setT] = React.useState(0);
  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setT(x => x + 1), 60000);
    return () => clearInterval(id);
  }, [on]);
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function tmTlRange(items, cfg, nowM) {
  const w = window.tmDayWindow(null, cfg);
  let lo = w.startMins,
    hi = w.endMins;
  items.forEach(it => {
    if (it.a != null) lo = Math.min(lo, it.a);
    if (it.b != null) hi = Math.max(hi, it.b);
    if (it.live && nowM != null) hi = Math.max(hi, nowM);
  });
  lo = Math.max(0, Math.floor(lo / 60) * 60 - 60);
  hi = Math.min(30 * 60, Math.ceil(hi / 60) * 60 + 60);
  return {
    lo,
    hi,
    band: [w.startMins, w.endMins]
  };
}
function TmTimeline({
  items,
  range,
  nowM,
  band
}) {
  const lo = range.lo,
    hi = range.hi,
    span = Math.max(1, hi - lo);
  const pct = m => Math.max(0, Math.min(100, (m - lo) / span * 100));
  const step = span > 12 * 60 ? 120 : 60;
  const ticks = [];
  for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) ticks.push(m);
  const lab = m => String(Math.floor(m / 60) % 24).padStart(2, "0");
  return React.createElement("div", null, React.createElement("div", {
    className: "tmv-tl-row axis"
  }, React.createElement("div", {
    className: "tmv-axis"
  }, ticks.map(m => React.createElement("span", {
    key: m,
    style: {
      left: pct(m) + "%"
    }
  }, lab(m))))), items.map(it => React.createElement("div", {
    key: it.key,
    className: "tmv-tl-row"
  }, React.createElement("div", {
    className: "tmv-who"
  }, it.who), React.createElement("div", {
    className: "tmv-trk",
    title: it.title || ""
  }, band && React.createElement("i", {
    className: "tmv-band",
    style: {
      left: pct(band[0]) + "%",
      width: Math.max(0, pct(band[1]) - pct(band[0])) + "%"
    }
  }), ticks.map(m => React.createElement("i", {
    key: m,
    className: "tmv-tick",
    style: {
      left: pct(m) + "%"
    }
  })), it.trk, it.a != null && React.createElement("i", {
    className: "tmv-span" + (it.live ? " live" : it.forgot ? " forgot" : ""),
    style: {
      left: pct(it.a) + "%",
      width: it.b != null ? Math.max(0, pct(it.b) - pct(it.a)) + "%" : 8
    }
  }), it.now && nowM != null && nowM > lo && nowM < hi && React.createElement("i", {
    className: "tmv-now",
    style: {
      left: pct(nowM) + "%"
    }
  })), React.createElement("div", {
    className: "tmv-tim"
  }, it.tim), React.createElement("div", {
    className: "tmv-act"
  }, it.act))));
}
function TmLegend({
  items
}) {
  return React.createElement("span", {
    className: "tmv-leg",
    style: {
      fontWeight: 600,
      fontSize: 11
    }
  }, items.map(([bg, th]) => React.createElement("span", {
    key: th
  }, React.createElement("i", {
    className: "tmv-sw",
    style: {
      background: bg
    }
  }), th)));
}
const TM_LEG = [["var(--primary-soft)", "เวลางานปกติ"], ["var(--primary)", "ทำงาน"], ["repeating-linear-gradient(-45deg,var(--primary) 0 3px,var(--primary-bright) 3px 6px)", "ยังไม่ออก"], ["var(--tint-red-tx2)", "ลืมกดออก"]];
function TmEmpty({
  icon,
  tone,
  children
}) {
  return React.createElement("div", {
    className: "tmv-empty"
  }, React.createElement("i", {
    style: tone ? {
      background: "var(--st-design-soft)"
    } : undefined
  }, React.createElement(Icon, {
    name: icon || "clock",
    size: 22,
    color: tone || "var(--text-3)"
  })), children);
}
const TM_WD_FULL = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
function tmOffTH(d, cfg) {
  if (window.tmIsWorkday(d, cfg)) return "";
  const n = window.tmWhNorm(cfg).holidays[String(d || "").slice(0, 10)];
  return "วันหยุด · " + (n || TM_WD_FULL[tmWdOf(d)]);
}
const TM_OFF_PILL = {
  background: "var(--st-design-soft)",
  color: "var(--st-design-fg)"
};
function TmHero({
  me,
  cfg,
  users,
  canAll,
  otMonthMins,
  canOt,
  onNewOt
}) {
  const t = me.today;
  const inHM = t && t.in && t.in.hm,
    outHM = t && t.out && t.out.hm;
  const offTH = tmOffTH(window.drToday(), cfg);
  const state = !inHM ? offTH ? "off" : "none" : outHM ? "done" : "live";
  const ST = {
    off: {
      th: offTH,
      bg: TM_OFF_PILL.background,
      fg: TM_OFF_PILL.color,
      ic: "calendar"
    },
    none: {
      th: "ยังไม่ได้ลงเวลา",
      bg: "var(--tint-amber-bg2)",
      fg: "var(--tint-amber-tx)",
      ic: "clock"
    },
    live: {
      th: "กำลังทำงาน",
      bg: "var(--primary-soft)",
      fg: "var(--primary-dark)",
      ic: "clock"
    },
    done: {
      th: "ออกงานแล้ว",
      bg: "var(--surface2)",
      fg: "var(--text-2)",
      ic: "check"
    }
  }[state];
  return React.createElement(TmCard, {
    className: "tmv-hero"
  }, React.createElement("div", {
    className: "tmv-hero-me"
  }, React.createElement("div", {
    className: "tmv-hero-ic",
    style: {
      background: ST.bg
    }
  }, React.createElement(Icon, {
    name: ST.ic,
    size: 26,
    color: ST.fg,
    sw: 2
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "tmv-k"
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19 \xB7 ", window.drDateTH(window.drToday(), true)), React.createElement("div", {
    className: "tmv-big"
  }, inHM ? React.createElement(React.Fragment, null, inHM, React.createElement("small", null, "\u2192"), outHM || React.createElement("small", {
    style: {
      margin: 0
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01")) : React.createElement("span", {
    style: {
      fontSize: 21,
      color: state === "off" ? "var(--st-design-fg)" : "var(--text-2)"
    }
  }, state === "off" ? "วันนี้วันหยุด" : "ยังไม่ได้ลงเวลา")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 3
    }
  }, React.createElement("span", {
    className: "tmv-pill",
    style: {
      background: ST.bg,
      color: ST.fg
    }
  }, ST.th), offTH && state !== "off" && React.createElement("span", {
    className: "tmv-pill",
    style: TM_OFF_PILL
  }, offTH), React.createElement("span", {
    className: "tmv-k",
    style: {
      fontWeight: 600
    }
  }, state === "off" ? "ถ้ามาทำงานให้ลงเวลาตามปกติ" : state === "none" ? "ลงเวลาจากแอปในไลน์" : state === "done" ? "ทำงาน " + window.tmDur(window.tmWorkedMins(t, cfg)) : "เข้างานแล้ว"), React.createElement("span", {
    className: "tmv-k",
    style: {
      fontWeight: 600
    }
  }, "\xB7 OT \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, otMonthMins ? window.tmDur(otMonthMins) : "—"))))), React.createElement("div", {
    className: "tmv-hero-r"
  }, canAll && React.createElement(TmTeamToday, {
    cfg: cfg,
    users: users
  }), React.createElement("button", {
    className: "btn btn-pri",
    onClick: onNewOt,
    disabled: !canOt
  }, React.createElement(Icon, {
    name: "plus",
    size: 15,
    color: "#fff",
    sw: 2.2
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A OT")));
}
function TmTeamToday({
  cfg,
  users
}) {
  const st = useTmDayStatus(window.drToday(), cfg, users);
  const live = st.rows.filter(r => r.in && !r.out).length;
  const out = st.rows.filter(r => r.out).length;
  const seg = [[live, "var(--primary)", "ทำงานอยู่"], [out, "var(--st-takeoff-fg)", "ออกแล้ว"], [st.leaving.length, "var(--st-design-fg)", "ลา"], [st.missing.length, "var(--st-queue-fg)", "ยังไม่ลง"]];
  const tot = seg.reduce((a, s) => a + s[0], 0);
  return React.createElement("div", {
    className: "tmv-team"
  }, React.createElement("div", {
    className: "tmv-k"
  }, "\u0E17\u0E35\u0E21\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 \xB7 \u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E25\u0E49\u0E27 ", st.rows.length, tot ? " จาก " + (tot - st.leaving.length) : "", " \u0E04\u0E19"), React.createElement("div", {
    className: "tmv-stack"
  }, seg.filter(s => s[0] > 0).map(s => React.createElement("i", {
    key: s[2],
    style: {
      flex: s[0],
      background: s[1]
    }
  }))), React.createElement("div", {
    className: "tmv-leg"
  }, seg.filter(s => s[0] > 0 || s[2] === "ทำงานอยู่").map(s => React.createElement("span", {
    key: s[2]
  }, React.createElement("i", {
    className: "tmv-dot",
    style: {
      background: s[1]
    }
  }), React.createElement("b", null, s[0]), s[2]))));
}
function tmEdOf(users, cfg, uid, nm, date, inHM, outHM) {
  const u = (users || []).find(x => x && x.id === uid) || {
    id: uid,
    name: nm
  };
  const c = window.tmWhNorm(cfg);
  return {
    user: u,
    date: date,
    inHM: inHM || c.startEarly,
    outHM: outHM != null ? outHM : c.end,
    isNew: !inHM
  };
}
function TmTimeEdit({
  ed,
  cfg,
  currentUser,
  onClose,
  onSaved
}) {
  const admin = window.useAttendAdmin(currentUser);
  const [inHM, setIn] = React.useState(ed.inHM);
  const [outHM, setOut] = React.useState(ed.outHM);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const save = async () => {
    if (busy) return;
    setBusy(true);
    setErr("");
    const res = await admin.setTimes(ed.user, ed.date, inHM, outHM, "", cfg).catch(e => ({
      ok: false,
      why: String(e && e.message || e)
    }));
    if (!res.ok) {
      setBusy(false);
      setErr(res.why);
      return;
    }
    onSaved(inHM + " – " + (outHM || "ยังไม่ออก"));
  };
  const offTH = tmOffTH(ed.date, cfg);
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(15,23,42,.45)",
      display: "grid",
      placeItems: "center",
      padding: 18
    },
    onMouseDown: e => {
      if (e.target === e.currentTarget && !busy) onClose();
    }
  }, React.createElement("div", {
    style: {
      width: "min(420px,100%)",
      background: "var(--bg)",
      boxShadow: "var(--shadow-modal)",
      borderRadius: "var(--r-card)",
      padding: 20,
      display: "grid",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement(TmAvatar, {
    uid: ed.user.id,
    name: ed.user.name,
    size: 40
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, ed.user.name), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, ed.isNew ? "ลงเวลาแทน" : "แก้เวลาลงงาน", " \xB7 ", window.drDateTH(ed.date, true))), offTH && React.createElement("span", {
    className: "tmv-pill",
    style: Object.assign({
      marginLeft: "auto"
    }, TM_OFF_PILL)
  }, offTH)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
      gap: 9,
      alignItems: "end"
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement(window.PgTime, {
    value: inHM,
    ariaLabel: "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19",
    onChange: setIn,
    style: TM_IN_W
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-3)",
      paddingBottom: 10
    }
  }, "\u0E16\u0E36\u0E07"), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19 (\u0E27\u0E48\u0E32\u0E07 = \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01)"), React.createElement(window.PgTime, {
    value: outHM,
    ariaLabel: "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19",
    onChange: setOut,
    style: TM_IN_W
  }))), err && React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    type: "button",
    className: "btn",
    disabled: busy,
    onClick: onClose
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    type: "button",
    className: "btn btn-pri",
    disabled: busy || !inHM,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "บันทึกเวลา"))));
}
function TmDaySheet({
  date,
  setDate,
  cfg,
  users,
  currentUser
}) {
  const st = useTmDayStatus(date, cfg, users);
  const admin = window.useAttendAdmin(currentUser);
  const [msg, setMsg] = React.useState("");
  const today = window.drToday();
  const isToday = date === today;
  const nowM = useTmNow(isToday);
  const nameOf = r => window.tmNameOf(users, r.userId, r.name);
  const gpsCell = r => {
    if (!r.gps && r.fix) return null;
    if (r.geoBy === "admin") return React.createElement("a", {
      href: window.tmGpsUrl(r),
      target: "_blank",
      rel: "noreferrer",
      title: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28 \u2014 \u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19",
      style: {
        fontWeight: 700,
        textDecoration: "none",
        color: "var(--text-3)"
      }
    }, "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28");
    if (!r.gps) return React.createElement("span", {
      style: {
        color: "var(--tint-amber-tx)",
        fontWeight: 700
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14");
    const ok = React.createElement("span", {
      style: {
        color: "var(--tint-ok-tx)",
        fontWeight: 700
      }
    }, "\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14");
    if (r.lat == null || r.lng == null) return ok;
    const d = window.tmOfficeDist(r, cfg);
    const link = kid => React.createElement("a", {
      href: window.tmGpsUrl(r),
      target: "_blank",
      rel: "noreferrer",
      title: "พิกัดตอนเข้างาน " + window.tmGpsTH(r),
      style: {
        fontWeight: 700,
        textDecoration: "none"
      }
    }, kid);
    if (d == null) return link(ok);
    const near = d <= window.tmWhNorm(cfg).office.radius;
    const office = r.place === "office";
    const color = !office ? "var(--text-3)" : near ? "var(--tint-ok-tx)" : "var(--tint-red-tx2)";
    return link(React.createElement("span", {
      style: {
        color: color
      }
    }, office ? near ? "ถึงออฟฟิศ" : "ห่างออฟฟิศ " + window.tmDistTH(d) : "ห่างออฟฟิศ " + window.tmDistTH(d)));
  };
  const del = async r => {
    const ok = await window.askConfirm({
      title: "ลบใบลงเวลาของ " + nameOf(r) + "?",
      body: window.drDateTH(date, true) + " · " + (r.in || "—") + " – " + (r.out || "—") + " · " + window.tmDur(r.mins) + "\nลบแล้วคนคนนี้กดลงเวลาของวันนี้ใหม่ได้ตั้งแต่ต้น",
      ok: "ลบใบนี้",
      danger: true,
      icon: "trash"
    });
    if (!ok) return;
    const res = await admin.removeDay(r.userId, date);
    setMsg(res.ok ? "ลบใบลงเวลาของ " + nameOf(r) + " แล้ว" : "ลบไม่สำเร็จ — " + res.why);
  };
  const isAdmin = window.usePgAdmin();
  const [ed, setEd] = React.useState(null);
  const openEd = (uid, nm, inHM, outHM) => setEd(tmEdOf(users, cfg, uid, nm, date, inHM, outHM));
  const workday = st.workday;
  const offTH = tmOffTH(date, cfg);
  const rows = st.rows.slice().sort((a, b) => String(a.in || "99").localeCompare(String(b.in || "99")));
  const totalMins = rows.reduce((a, r) => a + (+r.mins || 0), 0);
  const items = rows.map(r => {
    const a = tmMinOf(r.in);
    let b = tmMinOf(r.out);
    if (a != null && b != null && b < a) b += 1440;
    const live = !!(isToday && r.in && !r.out);
    const forgot = !!(!isToday && r.in && !r.out);
    if (live) b = Math.max(nowM, a + 5);
    const late = !!(workday && window.tmIsLate(r.in, r.out, r.mins, cfg));
    const job = r.place === "office" || r.fix && !r.jobCode ? "ออฟฟิศ" : r.jobCode || "";
    const nm = nameOf(r);
    return {
      key: r.userId,
      a: a,
      b: forgot ? null : b,
      live: live,
      forgot: forgot,
      now: isToday,
      title: nm + " · " + (r.in || "—") + " – " + (r.out || (live ? "ยังไม่ออก" : "ลืมกดออก")),
      who: React.createElement(React.Fragment, null, React.createElement(TmAvatar, {
        uid: r.userId,
        name: nm
      }), React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, React.createElement("div", {
        className: "tmv-who-n"
      }, nm), React.createElement("div", {
        className: "tmv-who-s"
      }, job && React.createElement("span", {
        style: {
          fontFamily: job === "ออฟฟิศ" ? "inherit" : "var(--mono)"
        }
      }, job), gpsCell(r)))),
      tim: React.createElement(React.Fragment, null, React.createElement("b", null, r.in || "—", " \u2013 ", r.out || "…"), React.createElement("span", {
        style: {
          fontWeight: forgot || live || late ? 700 : 500,
          color: forgot ? "var(--tint-red-tx2)" : late ? "var(--tint-amber-tx)" : live ? "var(--primary-dark)" : undefined
        }
      }, forgot ? "ลืมกดออก" : live ? "กำลังทำงาน" : window.tmDur(r.mins), late ? " · สาย" : "")),
      act: React.createElement(React.Fragment, null, isAdmin && React.createElement("button", {
        className: "tmv-ib xs",
        title: "\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01",
        onClick: () => openEd(r.userId, nm, r.in, r.out || "")
      }, React.createElement(Icon, {
        name: "pen",
        size: 14
      })), React.createElement("button", {
        className: "tmv-ib xs dngr",
        title: "\u0E25\u0E1A\u0E43\u0E1A\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32",
        onClick: () => del(r)
      }, React.createElement(Icon, {
        name: "trash",
        size: 14
      })))
    };
  });
  const range = tmTlRange(items, cfg, isToday ? nowM : null);
  const stillIn = items.filter(x => x.live).length;
  const forgotN = items.filter(x => x.forgot).length;
  const attendUsers = (users || []).filter(u => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend"));
  return React.createElement("div", {
    className: "tmv",
    style: {
      gap: 14
    }
  }, React.createElement("div", {
    className: "tmv-bar"
  }, React.createElement("button", {
    className: "tmv-ib",
    title: "\u0E27\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    onClick: () => setDate(window.drAddDays(date, -1))
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 16
  })), React.createElement("span", {
    className: "tmv-date"
  }, window.drDateTH(date, true)), React.createElement("button", {
    className: "tmv-ib",
    title: "\u0E27\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
    onClick: () => setDate(window.drAddDays(date, 1))
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16
  })), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value || today),
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E19",
    style: Object.assign({}, TM_IN, {
      padding: "7px 10px",
      fontSize: 12.5
    })
  }), !isToday && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setDate(today)
  }, "\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), offTH && React.createElement("span", {
    className: "tmv-pill",
    style: TM_OFF_PILL
  }, React.createElement(Icon, {
    name: "calendar",
    size: 12,
    color: "var(--st-design-fg)",
    sw: 2.2
  }), " ", offTH), isAdmin && React.createElement("select", {
    value: "",
    title: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19",
    onChange: e => {
      const u = attendUsers.find(x => x.id === e.target.value);
      if (!u) return;
      const r = rows.find(x => x.userId === u.id);
      openEd(u.id, u.name, r ? r.in : "", r ? r.out || "" : null);
    },
    style: Object.assign({}, TM_IN, {
      marginLeft: "auto",
      minWidth: 170,
      padding: "8px 10px",
      fontSize: 12.5
    })
  }, React.createElement("option", {
    value: ""
  }, "+ \u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19\u2026"), attendUsers.map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), (st.missing.length > 0 || st.leaving.length > 0) && React.createElement(TmCard, null, st.missing.length > 0 && React.createElement("div", null, React.createElement("div", {
    className: "tmv-hd",
    style: {
      marginBottom: 10
    }
  }, React.createElement("span", {
    className: "t"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("span", {
    className: "tmv-badge",
    style: {
      alignSelf: "center"
    }
  }, st.missing.length), React.createElement("span", {
    className: "s"
  }, "\u0E17\u0E31\u0E01\u0E16\u0E32\u0E21\u0E01\u0E48\u0E2D\u0E19", isAdmin ? " หรือกดลงเวลาแทน" : "")), React.createElement("div", {
    className: "tmv-people"
  }, st.missing.map(u => React.createElement("span", {
    key: u.id,
    className: "tmv-person"
  }, React.createElement(TmAvatar, {
    uid: u.id,
    name: u.name,
    size: 26
  }), React.createElement("span", {
    style: {
      paddingRight: isAdmin ? 0 : 8
    }
  }, u.name), isAdmin && React.createElement("button", {
    className: "x",
    onClick: () => openEd(u.id, u.name, "", null)
  }, "\u0E25\u0E07\u0E41\u0E17\u0E19"))))), st.leaving.length > 0 && React.createElement("div", {
    style: {
      marginTop: st.missing.length ? 16 : 0
    }
  }, React.createElement("div", {
    className: "tmv-hd",
    style: {
      marginBottom: 10
    }
  }, React.createElement("span", {
    className: "t"
  }, "\u0E25\u0E32\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("span", {
    className: "s"
  }, st.leaving.length, " \u0E04\u0E19")), React.createElement("div", {
    className: "tmv-people"
  }, st.leaving.map(u => {
    const lr = st.onLeave[u.id],
      lt = window.lvTypeOf(st.lvTypes, lr.type);
    return React.createElement("span", {
      key: u.id,
      className: "tmv-person",
      title: lr.no + " · " + window.lvRangeTH(lr)
    }, React.createElement(TmAvatar, {
      uid: u.id,
      name: u.name,
      size: 26
    }), u.name, React.createElement("span", {
      className: "tmv-pill",
      style: {
        background: lt.color + "1A",
        color: lt.color
      }
    }, lt.th));
  })))), React.createElement(TmCard, null, React.createElement("div", {
    className: "tmv-hd"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19"), React.createElement("span", {
    className: "s"
  }, rows.length, " \u0E04\u0E19 \xB7 \u0E23\u0E27\u0E21 ", window.tmDur(totalMins), stillIn ? " · ยังทำงานอยู่ " + stillIn : "", forgotN ? " · ลืมกดออก " + forgotN : ""), offTH && React.createElement("span", {
    className: "tmv-pill",
    style: TM_OFF_PILL
  }, offTH), React.createElement("span", {
    className: "r"
  }, React.createElement(TmLegend, {
    items: TM_LEG
  }))), st.loading ? React.createElement(TmEmpty, null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : rows.length === 0 ? offTH ? React.createElement(TmEmpty, {
    icon: "calendar",
    tone: "var(--st-design-fg)"
  }, React.createElement("b", {
    style: {
      fontSize: 14,
      color: "var(--st-design-fg)"
    }
  }, offTH), React.createElement("span", {
    style: {
      fontSize: 11.5
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19 \u2014 \u0E16\u0E49\u0E32\u0E21\u0E35\u0E04\u0E19\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48")) : React.createElement(TmEmpty, null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 11.5
    }
  }, "\u0E0A\u0E48\u0E32\u0E07\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C")) : React.createElement(TmTimeline, {
    items: items,
    range: range,
    nowM: isToday ? nowM : null,
    band: workday ? range.band : null
  })), msg && React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      padding: "0 4px"
    }
  }, msg), ed && React.createElement(TmTimeEdit, {
    ed: ed,
    cfg: cfg,
    currentUser: currentUser,
    onClose: () => setEd(null),
    onSaved: t => {
      setMsg("แก้เวลาของ " + (ed.user.name || "") + " แล้ว · " + t);
      setEd(null);
    }
  }));
}
function TmMyDays({
  rows,
  cfg
}) {
  const today = window.drToday();
  const nowM = useTmNow(true);
  const items = (rows || []).map(r => {
    const inHM = r.in && r.in.hm,
      outHM = r.out && r.out.hm;
    const a = tmMinOf(inHM);
    let b = tmMinOf(outHM);
    if (a != null && b != null && b < a) b += 1440;
    const live = !!(r.date === today && inHM && !outHM);
    const forgot = !!(r.date !== today && inHM && !outHM);
    if (live) b = Math.max(nowM, a + 5);
    const wd = TM_WD_TH[tmWdOf(r.date)];
    const offTH = tmOffTH(r.date, cfg);
    return {
      key: r.date,
      a: a,
      b: forgot ? null : b,
      live: live,
      forgot: forgot,
      now: r.date === today,
      who: React.createElement(React.Fragment, null, React.createElement("span", {
        style: {
          width: 38,
          height: 38,
          borderRadius: "var(--r-chip)",
          background: offTH ? "var(--st-design-soft)" : "var(--surface2)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          lineHeight: 1.05
        }
      }, React.createElement("span", {
        style: {
          textAlign: "center"
        }
      }, React.createElement("span", {
        style: {
          display: "block",
          fontSize: 9.5,
          fontWeight: 700,
          color: offTH ? "var(--st-design-fg)" : "var(--text-3)"
        }
      }, wd), React.createElement("span", {
        style: {
          fontFamily: "var(--display)",
          fontSize: 15,
          fontWeight: 700,
          color: offTH ? "var(--st-design-fg)" : "var(--text-1)"
        }
      }, +String(r.date).slice(8)))), React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, React.createElement("div", {
        className: "tmv-who-n"
      }, window.drDateTH(r.date)), React.createElement("div", {
        className: "tmv-who-s"
      }, offTH ? React.createElement("span", {
        style: {
          color: "var(--st-design-fg)",
          fontWeight: 700
        }
      }, offTH) : null, r.jobCode ? React.createElement("span", {
        style: {
          fontFamily: "var(--mono)"
        }
      }, r.jobCode) : null, !(r.in && r.in.lat) && React.createElement("span", {
        style: {
          color: "var(--tint-amber-tx)",
          fontWeight: 700
        }
      }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14")))),
      tim: React.createElement(React.Fragment, null, React.createElement("b", null, inHM || "—", " \u2013 ", outHM || "…"), React.createElement("span", {
        style: {
          fontWeight: forgot || live ? 700 : 500,
          color: forgot ? "var(--tint-red-tx2)" : live ? "var(--primary-dark)" : undefined
        }
      }, forgot ? "ลืมกดออก" : live ? "กำลังทำงาน" : window.tmDur(window.tmWorkedMins(r, cfg))))
    };
  });
  const range = tmTlRange(items, cfg, nowM);
  return React.createElement(TmCard, null, React.createElement("div", {
    className: "tmv-hd"
  }, React.createElement("span", {
    className: "t"
  }, "\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("span", {
    className: "s"
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07 30 \u0E27\u0E31\u0E19"), React.createElement("span", {
    className: "r"
  }, React.createElement(TmLegend, {
    items: TM_LEG
  }))), items.length === 0 ? React.createElement(TmEmpty, null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 11.5
    }
  }, "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C")) : React.createElement(TmTimeline, {
    items: items,
    range: range,
    nowM: nowM,
    band: range.band
  }));
}
function TmReqCard({
  x,
  users,
  lvTypes,
  onOpen,
  onApprove
}) {
  const r = x.r;
  const nm = window.tmNameOf(users, r.userId, r.userName);
  let color, icon, title, amt, line;
  if (x.t === "ot") {
    const k = window.tmOtKindOf(r.kind);
    color = k.color;
    icon = "clock";
    title = "OT · " + k.th;
    amt = window.tmDur(r.mins);
    line = window.drDateTH(r.date) + " · " + (r.from || "") + "–" + (r.to || "") + (r.jobCode ? " · " + r.jobCode : "");
  } else {
    const lt = window.lvTypeOf(lvTypes, r.type);
    color = lt.color;
    icon = "calendar";
    title = lt.th;
    amt = window.lvDaysTH(r.days);
    line = window.lvRangeTH(r);
  }
  return React.createElement("div", {
    className: "tmv-req",
    role: "button",
    tabIndex: 0,
    onClick: () => onOpen(x),
    onKeyDown: e => {
      if (e.key === "Enter") onOpen(x);
    }
  }, React.createElement("div", {
    className: "tmv-req-ic",
    style: {
      background: color + "1A"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 20,
    color: color,
    sw: 2
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "tmv-req-t"
  }, title, React.createElement(TmPill, {
    s: r.status,
    size: "sm"
  }), React.createElement("span", {
    className: "tmv-no"
  }, r.no)), React.createElement("div", {
    className: "tmv-req-s"
  }, React.createElement(TmAvatar, {
    uid: r.userId,
    name: nm,
    size: 20
  }), React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, nm), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\xB7"), React.createElement("span", null, line)), r.reason && String(r.reason).trim() !== "-" ? React.createElement("div", {
    className: "tmv-req-r"
  }, r.reason) : null), React.createElement("div", {
    className: "tmv-req-amt"
  }, React.createElement("b", null, amt), onApprove && React.createElement("button", {
    className: "btn btn-soft btn-sm",
    onClick: e => {
      e.stopPropagation();
      onApprove(x);
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 13,
    sw: 2.4
  }), " \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")));
}
function TmRequests({
  users,
  role,
  currentUser,
  otVisible,
  lv,
  lvTypes,
  lvQuota,
  onOpenOt,
  onOpenLv,
  otWaiting,
  lvWaiting,
  onApprove
}) {
  const uid = (currentUser || {}).id || null;
  const canApprove = window.tmCanOtApprove(role) || window.lvCanApprove(role);
  const canAll = canApprove || window.tmCanAttendAll(role);
  const [scope, setScope] = React.useState(() => otWaiting.length + lvWaiting.length > 0 ? "inbox" : "mine");
  const [kind, setKind] = React.useState("all");
  const [q, setQ] = React.useState("");
  const lvVis = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role), [lv.rows, currentUser, role]);
  const year = +String(window.drToday()).slice(0, 4);
  const myBal = React.useMemo(() => window.lvBalance(lv.rows, lvQuota.map, uid, year, lvTypes).filter(b => b.quota !== 0 || b.used || b.pending), [lv.rows, lvQuota.map, uid, year, lvTypes]);
  const list = React.useMemo(() => {
    const pickOt = scope === "inbox" ? otWaiting : scope === "mine" ? otVisible.filter(r => r.userId === uid) : otVisible;
    const pickLv = scope === "inbox" ? lvWaiting : scope === "mine" ? lvVis.filter(r => r.userId === uid) : lvVis;
    let out = [];
    if (kind !== "lv") out = out.concat(pickOt.map(r => ({
      t: "ot",
      d: r.date,
      r: r
    })));
    if (kind !== "ot") out = out.concat(pickLv.map(r => ({
      t: "lv",
      d: r.from,
      r: r
    })));
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter(x => (x.t === "ot" ? [x.r.no, x.r.userName, x.r.jobCode, x.r.reason, window.tmOtKindOf(x.r.kind).th] : [x.r.no, x.r.userName, x.r.reason, window.lvTypeOf(lvTypes, x.r.type).th]).some(v => String(v || "").toLowerCase().includes(kw)));
    out.sort((a, b) => String(b.d || "").localeCompare(String(a.d || "")) || String(b.r.createdAt || "").localeCompare(String(a.r.createdAt || "")));
    return out;
  }, [scope, kind, q, otVisible, otWaiting, lvVis, lvWaiting, uid, lvTypes]);
  const SC = (canApprove ? [{
    k: "inbox",
    th: "รอฉันอนุมัติ",
    n: otWaiting.length + lvWaiting.length
  }] : []).concat([{
    k: "mine",
    th: "ของฉัน"
  }]).concat(canAll ? [{
    k: "all",
    th: "ทั้งหมด"
  }] : []);
  const groups = [];
  list.forEach(x => {
    const ym = String(x.d || "").slice(0, 7);
    const g = groups[groups.length - 1];
    if (g && g.ym === ym) g.items.push(x);else groups.push({
      ym: ym,
      items: [x]
    });
  });
  return React.createElement("div", {
    className: "tmv",
    style: {
      gap: 14
    }
  }, React.createElement("div", {
    className: "tmv-bar",
    style: {
      gap: 10
    }
  }, React.createElement(TmSeg, {
    items: SC,
    value: scope,
    onChange: setScope
  }), React.createElement(TmSeg, {
    sm: true,
    items: [{
      k: "all",
      th: "ทุกชนิด"
    }, {
      k: "ot",
      th: "OT",
      ic: "clock"
    }, {
      k: "lv",
      th: "ลา",
      ic: "calendar"
    }],
    value: kind,
    onChange: setKind
  }), React.createElement("label", {
    className: "tmv-search",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"
  }))), scope === "mine" && kind !== "ot" && myBal.length > 0 && React.createElement("div", {
    className: "tmv-bar",
    style: {
      gap: 8,
      padding: "0 4px"
    }
  }, React.createElement("span", {
    className: "tmv-k"
  }, "\u0E27\u0E31\u0E19\u0E25\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D \u0E1B\u0E35 ", year + 543), myBal.map(b => React.createElement("span", {
    key: b.type.key,
    className: "tmv-pill",
    style: {
      background: b.type.color + "1A",
      color: b.type.color,
      padding: "5px 12px",
      fontSize: 12
    }
  }, b.type.th, React.createElement("b", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 15,
      color: b.left != null && b.left <= 0 ? "var(--tint-red-tx2)" : "var(--text-1)"
    }
  }, b.left == null ? "∞" : Math.round(b.left * 10) / 10), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, b.quota == null ? "ไม่จำกัด" : "/ " + Math.round(b.quota * 10) / 10 + " วัน")))), list.length === 0 ? React.createElement(TmCard, null, React.createElement(TmEmpty, {
    icon: scope === "inbox" ? "check" : "list"
  }, scope === "inbox" ? "ไม่มีคำขอรอคุณอนุมัติ — เคลียร์หมดแล้ว" : "ยังไม่มีคำขอ")) : React.createElement("div", {
    className: "tmv-list"
  }, groups.map(g => React.createElement(React.Fragment, {
    key: g.ym || "none"
  }, React.createElement("div", {
    className: "tmv-grp"
  }, g.ym ? window.tmYmTH(g.ym) : "ไม่ระบุวันที่", React.createElement("span", null, g.items.length, " \u0E43\u0E1A")), g.items.map(x => React.createElement(TmReqCard, {
    key: x.t + x.r.id,
    x: x,
    users: users,
    lvTypes: lvTypes,
    onOpen: y => y.t === "ot" ? onOpenOt(y.r.id) : onOpenLv(y.r.id),
    onApprove: scope === "inbox" ? onApprove : null
  }))))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      padding: "0 4px"
    }
  }, "\u0E0A\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A OT \u0E41\u0E25\u0E30\u0E22\u0E37\u0E48\u0E19\u0E43\u0E1A\u0E25\u0E32\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C \u2014 \u0E01\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \u0E41\u0E01\u0E49 \u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"));
}
function TmDayGrid({
  days,
  byDay,
  onPick
}) {
  const today = window.drToday();
  return React.createElement("div", {
    className: "tmv-cal"
  }, TM_WD_TH.map(w => React.createElement("div", {
    key: w,
    className: "h"
  }, w)), Array.from({
    length: tmWdOf(days[0])
  }, (_, i) => React.createElement("div", {
    key: "pad" + i
  })), days.map(d => {
    const x = byDay[d];
    const open = x && x.in && !x.out;
    return React.createElement("div", {
      key: d,
      className: "d" + (x ? " on" : " off") + (open ? " bad" : "") + (onPick && d <= today ? " pk" : ""),
      title: onPick && d <= today ? (x ? "กดเพื่อแก้เวลา" : "กดเพื่อลงเวลาแทน") + " · " + window.drDateTH(d) : window.drDateTH(d),
      onClick: onPick && d <= today ? () => onPick(d, x) : undefined
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700
      }
    }, +d.slice(8)), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        fontWeight: 700,
        color: open ? "var(--tint-red-tx2)" : "var(--text-1)"
      }
    }, x ? (x.in || "—") + "–" + (x.out || "?") : "—"), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, x ? window.tmDur(x.mins) : ""));
  }));
}
const TM_HEAT_LEG = [["color-mix(in srgb, var(--primary) 100%, transparent)", "ทำงาน (เข้ม = นาน)"], ["color-mix(in srgb, var(--text-3) 20%, transparent)", "ไม่มีใบ"], ["color-mix(in srgb, var(--st-design-fg) 34%, transparent)", "วันหยุด"], ["var(--tint-red-tx2)", "ลืมกดออก"]];
function TmHeat({
  days,
  byDay,
  cfg
}) {
  const wh = window.tmWhNorm(cfg);
  const full = wh.workMins || 480;
  const offTH = d => wh.holidays[d] ? "วันหยุด " + wh.holidays[d] : "วันหยุด";
  return React.createElement("div", {
    className: "tmv-heat"
  }, React.createElement("div", {
    className: "tmv-heat-g",
    style: {
      gridTemplateColumns: "repeat(" + days.length + ", minmax(0,1fr))"
    }
  }, days.map(d => {
    const x = byDay[d];
    const off = !window.tmIsWorkday(d, cfg);
    const tag = off ? " · " + offTH(d) : "";
    if (!x || !x.in) return React.createElement("i", {
      key: d,
      className: off ? "off" : "",
      title: window.drDateTH(d) + (off ? tag : " · ไม่มีใบ")
    });
    if (!x.out) return React.createElement("i", {
      key: d,
      className: "forgot",
      title: window.drDateTH(d) + tag + " · " + x.in + " – ลืมกดออก"
    });
    const p = Math.round(35 + 65 * Math.min(1, (+x.mins || 0) / full));
    return React.createElement("i", {
      key: d,
      className: off ? "offw" : "",
      title: window.drDateTH(d) + tag + " · " + x.in + "–" + x.out + " · " + window.tmDur(x.mins),
      style: {
        background: "color-mix(in srgb, var(--primary) " + p + "%, var(--surface2))"
      }
    });
  })), React.createElement("div", {
    className: "tmv-heat-ax"
  }, React.createElement("span", null, "1"), React.createElement("span", null, Math.ceil(days.length / 2)), React.createElement("span", null, days.length)));
}
function TmMonthAll({
  cfg,
  users,
  jobs,
  otRows,
  byName,
  canAll,
  currentUser
}) {
  const isAdmin = window.usePgAdmin();
  const [ed, setEd] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [ym, setYm] = React.useState(window.tmYmNow);
  const {
    byDate,
    loading
  } = window.useAttendMonth(canAll ? ym : null);
  const [pick, setPick] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [onlyApproved, setOnlyApproved] = React.useState(false);
  const [paper, setPaper] = React.useState(null);
  const days = React.useMemo(() => window.tmMonthDays(ym), [ym]);
  const cut = window.tmWhNorm(cfg).cutoffDay;
  const period = React.useMemo(() => window.tmPeriodOf(cut ? days[Math.min(cut, days.length) - 1] : days[0], cfg), [days, cfg, cut]);
  const att = React.useMemo(() => canAll ? window.tmMonthRollup(byDate, users, cfg, otRows, ym) : [], [canAll, byDate, users, cfg, otRows, ym]);
  const otPeople = React.useMemo(() => {
    const src = (otRows || []).filter(r => window.tmInPeriod(r && r.date, period) && (!onlyApproved || r.status === "approved"));
    return window.tmOtByPerson(src, users, cfg);
  }, [otRows, period, onlyApproved, users, cfg]);
  const rows = React.useMemo(() => {
    const map = {},
      order = [];
    const get = (id, name) => {
      const k = id || "name:" + name;
      if (!map[k]) {
        map[k] = {
          key: k,
          id: id,
          name: name,
          a: null,
          o: null
        };
        order.push(k);
      }
      return map[k];
    };
    att.forEach(a => {
      get(a.userId, a.name).a = a;
    });
    otPeople.forEach(g => {
      const r = get(g.id, g.name);
      r.o = g;
      if (!r.name) r.name = g.name;
    });
    const has = r => r.a && r.a.days || r.o && r.o.rows.length ? 1 : 0;
    return order.map(k => map[k]).sort((x, y) => has(y) - has(x) || String(x.name).localeCompare(String(y.name), "th"));
  }, [att, otPeople]);
  const tot = rows.reduce((t, r) => ({
    days: t.days + (r.a ? r.a.days : 0),
    mins: t.mins + (r.a ? r.a.mins : 0),
    noOut: t.noOut + (r.a ? r.a.noOut : 0),
    otOk: t.otOk + (r.o ? r.o.minsApproved : 0),
    pay: t.pay + (r.o ? r.o.payApproved : 0),
    wait: t.wait + (r.o ? r.o.minsWaiting : 0)
  }), {
    days: 0,
    mins: 0,
    noOut: 0,
    otOk: 0,
    pay: 0,
    wait: 0
  });
  const stat = (l, v, u, color) => React.createElement("div", {
    className: "tmv-stat"
  }, React.createElement("div", {
    className: "l"
  }, l), React.createElement("div", {
    className: "v",
    style: {
      color: color || undefined
    }
  }, v, React.createElement("small", null, u)));
  return React.createElement("div", {
    className: "tmv",
    style: {
      gap: 14
    }
  }, React.createElement("div", {
    className: "tmv-bar"
  }, React.createElement("button", {
    className: "tmv-ib",
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19",
    onClick: () => setYm(window.tmYmShift(ym, -1))
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 16
  })), React.createElement("span", {
    className: "tmv-date",
    style: {
      minWidth: 130,
      textAlign: "center"
    }
  }, window.tmYmTH(ym)), React.createElement("button", {
    className: "tmv-ib",
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
    onClick: () => setYm(window.tmYmShift(ym, 1))
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16
  })), ym !== window.tmYmNow() && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setYm(window.tmYmNow())
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"), cut ? React.createElement("span", {
    className: "tmv-k",
    style: {
      fontWeight: 600
    }
  }, "OT \u0E23\u0E2D\u0E1A ", window.tmPeriodTH(period)) : null, canAll && React.createElement("button", {
    className: "btn btn-pri",
    style: {
      marginLeft: "auto"
    },
    disabled: busy,
    onClick: async () => {
      if (busy) return;
      setBusy(true);
      try {
        await tmExportMonthXlsx(att, days, ym, otRows, users, cfg);
      } finally {
        setBusy(false);
      }
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 15,
    color: "#fff",
    sw: 2
  }), " ", busy ? "กำลังเตรียมไฟล์…" : "ออก Excel ทั้งเดือน")), React.createElement(TmCard, {
    className: "tmv-stats",
    style: {
      padding: "8px 4px"
    }
  }, canAll && stat("ชั่วโมงทำงานรวม", tmHrs(tot.mins), "ชม. · " + tot.days + " วัน-คน"), stat("OT อนุมัติแล้ว", tmHrs(tot.otOk), "ชม."), stat("ชม.คิดค่าแรง OT", tmHrs(tot.pay), "ชม.", "var(--primary-dark)"), tot.wait > 0 ? stat("OT รออนุมัติ", tmHrs(tot.wait), "ชม.", "var(--tint-amber-tx)") : null, canAll && stat("ลืมกดออก", tot.noOut, "ใบ", tot.noOut ? "var(--tint-red-tx2)" : undefined)), canAll && rows.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      padding: "0 4px"
    }
  }, React.createElement(TmLegend, {
    items: TM_HEAT_LEG
  })), canAll && loading ? React.createElement(TmCard, null, React.createElement(TmEmpty, null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")) : rows.length === 0 ? React.createElement(TmCard, null, React.createElement(TmEmpty, {
    icon: "calendar"
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49")) : React.createElement("div", {
    className: "tmv-list"
  }, rows.map(r => {
    const a = r.a,
      o = r.o;
    const empty = !(a && a.days) && !(o && o.rows.length);
    return React.createElement("div", {
      key: r.key,
      className: "tmv-pp" + (empty ? " dim" : "")
    }, React.createElement("div", {
      className: "tmv-pp-row"
    }, React.createElement("div", {
      className: "tmv-who"
    }, React.createElement(TmAvatar, {
      uid: r.id,
      name: r.name,
      size: 36
    }), React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      className: "tmv-who-n"
    }, r.name), React.createElement("div", {
      className: "tmv-who-s"
    }, canAll && (a && a.days ? React.createElement("span", null, "\u0E21\u0E32 ", a.days, " \u0E27\u0E31\u0E19 \xB7 ", tmHrs(a.mins), " \u0E0A\u0E21.") : React.createElement("span", null, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32")), a && a.noOut ? React.createElement("span", {
      style: {
        color: "var(--tint-red-tx2)",
        fontWeight: 700
      }
    }, "\u0E25\u0E37\u0E21\u0E2D\u0E2D\u0E01 ", a.noOut) : null))), canAll && a ? React.createElement(TmHeat, {
      days: days,
      byDay: a.byDay,
      cfg: cfg
    }) : React.createElement("div", {
      style: {
        gridArea: "heat"
      }
    }), React.createElement("div", {
      className: "tmv-ot"
    }, o && (o.minsApproved || o.minsWaiting) ? React.createElement(React.Fragment, null, React.createElement("span", null, React.createElement("b", null, tmHrs(o.minsApproved)), "\u0E0A\u0E21. OT \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("span", null, React.createElement("b", {
      style: {
        color: "var(--primary-dark)"
      }
    }, tmHrs(o.payApproved)), "\u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), o.minsWaiting ? React.createElement("span", {
      style: {
        color: "var(--tint-amber-tx)",
        fontWeight: 700
      }
    }, "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 ", tmHrs(o.minsWaiting), " \u0E0A\u0E21.") : null) : React.createElement("span", null, "\u0E44\u0E21\u0E48\u0E21\u0E35 OT")), React.createElement("div", {
      className: "tmv-pp-act"
    }, o && o.rows.length > 0 && React.createElement("button", {
      className: "btn btn-soft btn-sm",
      onClick: () => setPaper(o),
      title: "\u0E43\u0E1A\u0E2A\u0E23\u0E38\u0E1B OT \u0E02\u0E2D\u0E07\u0E04\u0E19\u0E19\u0E35\u0E49 \u0E43\u0E2B\u0E49\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E0B\u0E47\u0E19"
    }, React.createElement(Icon, {
      name: "file",
      size: 13
    }), " \u0E43\u0E1A OT"), canAll && a && a.days > 0 && React.createElement("button", {
      className: "tmv-ib xs",
      title: pick === r.key ? "ซ่อนรายวัน" : "ดูรายวัน",
      onClick: () => setPick(pick === r.key ? null : r.key)
    }, React.createElement(Icon, {
      name: "chevronDown",
      size: 15,
      style: {
        transform: pick === r.key ? "rotate(180deg)" : "none",
        transition: "transform .15s"
      }
    })))), pick === r.key && a && React.createElement("div", {
      className: "tmv-pp-more"
    }, React.createElement(TmDayGrid, {
      days: days,
      byDay: a.byDay,
      onPick: isAdmin && r.id ? (d, x) => setEd(tmEdOf(users, cfg, r.id, r.name, d, x && x.in, x && x.in ? x.out || "" : null)) : null
    }), isAdmin && React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 8
      }
    }, "\u0E01\u0E14\u0E0A\u0E48\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A")));
  })), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)",
      cursor: "pointer",
      width: "fit-content",
      padding: "0 4px"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: onlyApproved,
    onChange: e => setOnlyApproved(e.target.checked),
    style: {
      width: 15,
      height: 15
    }
  }), "\u0E43\u0E1A OT \u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C \u2014 \u0E40\u0E2D\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27"), React.createElement(TmHelp, null, React.createElement("b", null, "\u0E2D\u0E2D\u0E01 Excel \u0E17\u0E31\u0E49\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19"), " = \u0E41\u0E1C\u0E48\u0E19\u0E2A\u0E23\u0E38\u0E1B\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E41\u0E1C\u0E48\u0E19 + \u0E41\u0E1C\u0E48\u0E19\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E41\u0E22\u0E01\u0E23\u0E32\u0E22\u0E04\u0E19 (\u0E40\u0E02\u0E49\u0E32 \xB7 \u0E2D\u0E2D\u0E01 \xB7 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \xB7 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E08\u0E49\u0E07 \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48) \u0E15\u0E48\u0E2D\u0E14\u0E49\u0E27\u0E22\u0E43\u0E1A OT \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E0B\u0E47\u0E19", React.createElement("br", null), React.createElement("b", null, "\u0E43\u0E1A OT"), " = \u0E43\u0E1A A4 \u0E02\u0E2D\u0E07\u0E04\u0E19\u0E19\u0E31\u0E49\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E1A\u0E15\u0E48\u0E2D\u0E23\u0E2D\u0E1A \u0E43\u0E2B\u0E49\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E0B\u0E47\u0E19 (\u0E1C\u0E39\u0E49\u0E02\u0E2D \xB7 \u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 \u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25) \u2014 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E34\u0E14\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30 \u0E41\u0E15\u0E48\u0E22\u0E2D\u0E14\u0E41\u0E22\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14", React.createElement("br", null), "\u0E41\u0E16\u0E1A\u0E2A\u0E35\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19: \u0E40\u0E02\u0E35\u0E22\u0E27\u0E40\u0E02\u0E49\u0E21\u0E15\u0E32\u0E21\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E35\u0E48\u0E17\u0E33 \xB7 \u0E41\u0E14\u0E07 = \u0E25\u0E37\u0E21\u0E01\u0E14\u0E2D\u0E2D\u0E01 \xB7 \u0E21\u0E48\u0E27\u0E07 = \u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 (\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 = \u0E40\u0E02\u0E35\u0E22\u0E27\u0E21\u0E35\u0E02\u0E35\u0E14\u0E21\u0E48\u0E27\u0E07\u0E25\u0E48\u0E32\u0E07) \xB7 \u0E40\u0E17\u0E32 = \u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A \u2014 \u0E0A\u0E35\u0E49\u0E17\u0E35\u0E48\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E40\u0E27\u0E25\u0E32 \u0E01\u0E14\u0E25\u0E39\u0E01\u0E28\u0E23\u0E17\u0E49\u0E32\u0E22\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E32\u0E07\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19", React.createElement("br", null), "\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E1B\u0E31\u0E4A\u0E21\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01 \u0E2B\u0E31\u0E01\u0E1E\u0E31\u0E01\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49 \xB7 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E25\u0E37\u0E21\u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E28\u0E39\u0E19\u0E22\u0E4C \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E41\u0E17\u0E47\u0E1A \"\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\"", React.createElement("br", null), "\u201C\u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u201D = \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 OT \xD7 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 (\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14: 8 \u0E0A\u0E21.\u0E41\u0E23\u0E01 \xD7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \xD7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14) \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19", React.createElement("br", null), "\u0E23\u0E2D\u0E1A OT ", cut ? "ตัดยอดทุกวันที่ " + cut + " — เดือนนี้นับ " + window.tmPeriodTH(period) : "ใช้เดือนปฏิทิน (ยังไม่ได้ตั้งวันตัดยอดในแท็บตั้งค่า)"), msg && React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      padding: "0 4px"
    }
  }, msg), ed && React.createElement(TmTimeEdit, {
    ed: ed,
    cfg: cfg,
    currentUser: currentUser,
    onClose: () => setEd(null),
    onSaved: t => {
      setMsg("ลงเวลาของ " + (ed.user.name || "") + " " + window.drDateTH(ed.date) + " แล้ว · " + t);
      setEd(null);
    }
  }), paper && window.TmOtPaper && React.createElement(window.TmOtPaper, {
    person: paper,
    period: period,
    rows: paper.rows,
    jobs: jobs,
    users: users,
    cfg: cfg,
    byName: byName,
    onClose: () => setPaper(null)
  }));
}
function TmSettings({
  wh,
  users,
  role,
  lv,
  lvTp,
  lvQuota
}) {
  const canWh = window.can(role, "manageUsers");
  const canQuota = window.lvCanQuota(role);
  const SUBS = [].concat(canWh ? [{
    k: "wh",
    th: "เวลาทำงาน · วันหยุด · อัตรา OT",
    ic: "clock"
  }] : []).concat(canWh ? [{
    k: "types",
    th: "ประเภทการลา",
    ic: "list"
  }] : []).concat(canQuota ? [{
    k: "quota",
    th: "ยอดวันลารายคน",
    ic: "users"
  }] : []);
  const [sub, setSub] = React.useState(SUBS.length ? SUBS[0].k : "");
  const [year, setYear] = React.useState(+String(window.drToday()).slice(0, 4));
  return React.createElement("div", {
    className: "tmv",
    style: {
      gap: 14
    }
  }, React.createElement("div", {
    className: "tmv-bar"
  }, React.createElement(TmSeg, {
    sm: true,
    items: SUBS,
    value: sub,
    onChange: setSub
  }), sub === "quota" && React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("button", {
    className: "tmv-ib",
    onClick: () => setYear(year - 1)
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 16
  })), React.createElement("span", {
    className: "tmv-date",
    style: {
      fontSize: 16
    }
  }, "\u0E1B\u0E35 ", year + 543), React.createElement("button", {
    className: "tmv-ib",
    onClick: () => setYear(year + 1)
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16
  })))), sub === "wh" && React.createElement(TmWorkHours, {
    cfg: wh.cfg,
    onSave: wh.save
  }), sub === "types" && window.LvTypesEditor && React.createElement(window.LvTypesEditor, {
    types: lvTp.types,
    onSave: lvTp.save
  }), sub === "quota" && window.LvQuotaTable && React.createElement(window.LvQuotaTable, {
    users: (users || []).filter(u => !window.tmIsSysAcct(u)),
    types: lvTp.types,
    rows: lv.rows,
    quota: lvQuota,
    year: year
  }));
}
function AttendView({
  jobs,
  users,
  role,
  currentUser
}) {
  const wh = window.useWorkHours();
  const ot = window.useOtClaims(wh.cfg);
  const lv = window.useLeaves();
  const lvTp = window.useLeaveTypes();
  const lvQuota = window.useLeaveQuota();
  const lvTypes = lvTp.types;
  const [tab, setTab] = React.useState("day");
  const [date, setDate] = React.useState(window.drToday());
  const [open, setOpen] = React.useState(null);
  const [openLv, setOpenLv] = React.useState(null);
  const canAll = window.tmCanAttendAll(role);
  const uid = (currentUser || {}).id || null;
  const visible = React.useMemo(() => window.tmOtVisible(ot.rows, currentUser, role), [ot.rows, currentUser, role]);
  const otWaiting = React.useMemo(() => visible.filter(r => r.status === "sent" && window.tmOtApproveCheck(r, currentUser, role).ok), [visible, currentUser, role]);
  const lvWaiting = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role).filter(r => r.status === "sent" && window.lvApproveCheck(r, currentUser, role).ok), [lv.rows, currentUser, role]);
  const me = window.useAttend(uid, 30);
  const ymNow = window.tmYmNow();
  const myOtMonth = visible.filter(r => r.userId === uid && r.status === "approved" && String(r.date || "").slice(0, 7) === ymNow).reduce((a, r) => a + (+r.mins || 0), 0);
  const openNew = () => {
    const rec = window.tmOtBlank(currentUser, users, ot.rows, null, wh.cfg);
    ot.save(rec);
    setOpen(rec.id);
    setTab("req");
  };
  const move = (rec, to) => {
    const next = window.tmOtMove(rec, to, currentUser, "");
    if (!next) return;
    ot.save(next);
    const when = window.drDateTH(next.date) + " " + next.from + "-" + next.to;
    if (to === "sent" && next.approverId) {
      window.tmNotify({
        toUserId: next.approverId,
        title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins)
      });
    } else if (to === "sent") {
      window.tmNotify({
        toPerm: "otApprove",
        title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins)
      });
    } else if (to === "approved" || to === "rejected") {
      window.tmNotify({
        toUserId: next.userId,
        title: (to === "approved" ? "อนุมัติ OT แล้ว · " : "ไม่อนุมัติ OT · ") + next.no,
        body: when + " · " + window.tmDur(next.mins) + " · โดย " + ((currentUser || {}).name || "")
      });
    } else if (to === "draft" && rec.status === "sent" && next.userId !== uid) {
      window.tmNotify({
        toUserId: next.userId,
        title: "ตีกลับใบ OT · " + next.no,
        body: when + " · แก้แล้วส่งใหม่ได้ · โดย " + ((currentUser || {}).name || "")
      });
    } else if (to === "cancelled" && rec.status === "sent" && next.approverId) {
      window.tmNotify({
        toUserId: next.approverId,
        title: "ยกเลิกใบขอ OT · " + next.no,
        body: next.userName + " · " + when + " · ไม่ต้องพิจารณาแล้ว"
      });
    }
  };
  const moveLv = (rec, to, note) => {
    const next = window.lvMove(Object.assign({}, rec, {
      days: window.lvCountDays(rec.from, rec.to, rec.part, wh.cfg)
    }), to, currentUser, note || "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(rec, next, currentUser, lvTypes);
  };
  const approve = async x => {
    const r = x.r;
    const nm = window.tmNameOf(users, r.userId, r.userName);
    if (x.t === "ot") {
      const ok = await window.askConfirm({
        title: "อนุมัติ OT " + (r.no || "") + " ?",
        body: nm + " · " + window.drDateTH(r.date) + " " + r.from + "–" + r.to + " · " + window.tmDur(r.mins) + (r.reason ? "\n" + r.reason : ""),
        ok: "อนุมัติ",
        icon: "check"
      });
      if (ok) move(window.tmOtFill(r, wh.cfg), "approved");
    } else {
      const lt = window.lvTypeOf(lvTypes, r.type);
      const b = window.lvBalance(lv.rows, lvQuota.map, r.userId, window.lvYearOf(r.from), lvTypes).find(y => y.type.key === r.type);
      const ok = await window.askConfirm({
        title: "อนุมัติ" + lt.th + " " + (r.no || "") + " ?",
        body: nm + " · " + window.lvRangeTH(r) + " · " + window.lvDaysTH(r.days) + (b && b.left != null ? "\nคงเหลือหลังอนุมัติ " + Math.round(b.left * 10) / 10 + " วัน" : "") + (r.reason ? "\n" + r.reason : ""),
        ok: "อนุมัติ",
        icon: "check"
      });
      if (ok) moveLv(r, "approved", "");
    }
  };
  const canSet = window.can(role, "manageUsers") || window.lvCanQuota(role);
  const TABS = [{
    k: "day",
    th: canAll ? "วันนี้" : "เวลาของฉัน",
    ic: "clock"
  }, {
    k: "req",
    th: "คำขอ OT · ลา",
    ic: "list",
    n: otWaiting.length + lvWaiting.length
  }, {
    k: "month",
    th: "สรุปเดือน",
    ic: "chart"
  }].concat(canSet ? [{
    k: "cfg",
    th: "ตั้งค่า",
    ic: "settings"
  }] : []);
  const cur = (ot.rows || []).find(r => r.id === open) || null;
  const curLv = (lv.rows || []).find(r => r.id === openLv) || null;
  const jobSorted = React.useMemo(() => (jobs || []).slice().sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);
  const [narrow, rootRef] = useTmNarrow();
  return React.createElement("div", {
    className: "tmv" + (narrow ? " nw" : ""),
    ref: rootRef
  }, React.createElement("style", null, TM_CSS), React.createElement(TmHero, {
    me: me,
    cfg: wh.cfg,
    users: users,
    canAll: canAll,
    otMonthMins: myOtMonth,
    canOt: window.tmCanOt(role),
    onNewOt: openNew
  }), React.createElement(TmSeg, {
    items: TABS,
    value: tab,
    onChange: setTab
  }), tab === "day" && (canAll ? React.createElement(TmDaySheet, {
    date: date,
    setDate: setDate,
    cfg: wh.cfg,
    users: users,
    currentUser: currentUser
  }) : React.createElement(TmMyDays, {
    rows: me.rows,
    cfg: wh.cfg
  })), tab === "req" && React.createElement(TmRequests, {
    users: users,
    role: role,
    currentUser: currentUser,
    otVisible: visible,
    lv: lv,
    lvTypes: lvTypes,
    lvQuota: lvQuota,
    otWaiting: otWaiting,
    lvWaiting: lvWaiting,
    onOpenOt: setOpen,
    onOpenLv: setOpenLv,
    onApprove: approve
  }), tab === "month" && React.createElement(TmMonthAll, {
    cfg: wh.cfg,
    users: users,
    jobs: jobSorted,
    otRows: canAll ? ot.rows : visible,
    byName: (currentUser || {}).name || "",
    canAll: canAll,
    currentUser: currentUser
  }), tab === "cfg" && canSet && React.createElement(TmSettings, {
    wh: wh,
    users: users,
    role: role,
    lv: lv,
    lvTp: lvTp,
    lvQuota: lvQuota
  }), cur && React.createElement(TmOtModal, {
    rec: cur,
    cfg: wh.cfg,
    jobs: jobSorted,
    users: users,
    role: role,
    currentUser: currentUser,
    onSave: ot.save,
    onMove: move,
    onDelete: ot.remove,
    onClose: () => setOpen(null)
  }), curLv && window.LvModal && React.createElement(window.LvModal, {
    rec: curLv,
    cfg: wh.cfg,
    types: lvTypes,
    users: users,
    rows: lv.rows,
    quota: lvQuota.map,
    role: role,
    currentUser: currentUser,
    onSave: lv.save,
    onMove: moveLv,
    onDelete: lv.remove,
    onClose: () => setOpenLv(null)
  }));
}
Object.assign(window, {
  TM_IN,
  TM_IN_W,
  TM_LB,
  TM_WD_TH,
  tmWdOf,
  AttendView,
  TmDaySheet,
  TmMonthAll,
  TmRequests,
  TmSettings,
  TmDayGrid,
  TmMyDays,
  TmOtModal,
  TmOtRow,
  TmWorkHours,
  TmFacts,
  TmHelp,
  TmHero,
  TmTeamToday,
  TmTimeline,
  TmAvatar,
  TmSeg,
  TmCard,
  TmReqCard,
  TmHeat,
  tmOffTH,
  TmTimeEdit,
  useTmDayStatus,
  tmExportMonthXlsx,
  tmPersonSheet,
  tmSheetName,
  TmStat,
  TmPill
});
