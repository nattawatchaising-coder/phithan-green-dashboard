const loPad2 = n => (n < 10 ? "0" : "") + n;
const loISO = d => d.getFullYear() + "-" + loPad2(d.getMonth() + 1) + "-" + loPad2(d.getDate());
const loAddDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return loISO(d);
};
function loDaysInStage(job) {
  const h = job && job.hist || [];
  const cur = h.find(x => x && x.key === job.stage);
  const v = cur && (cur.at || cur.date);
  if (!v) return null;
  const s = String(v);
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function loDoneAt(job) {
  const h = job && job.hist || [];
  const d = h.find(x => x && x.key === "done");
  const v = d && (d.date || d.at);
  if (v) return String(v).slice(0, 10);
  const SF = window.SF;
  return SF.installEnd && SF.installEnd(job) || SF.installDate && SF.installDate(job) || "";
}
function loSpanDays(job) {
  const SF = window.SF;
  const s = SF.installDate && SF.installDate(job) || "";
  if (!s) return [];
  const e = SF.installEnd && SF.installEnd(job) || s;
  if (e < s) return [s];
  const out = [];
  let cur = s;
  let guard = 0;
  while (cur <= e && guard < 400) {
    out.push(cur);
    cur = loAddDays(cur, 1);
    guard += 1;
  }
  return out;
}
const loMedian = arr => {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};
function LoQueuePanel({
  jobs,
  onOpen
}) {
  const SF = window.SF;
  const today = SF.TODAY;
  const last = loAddDays(today, 13);
  const days = React.useMemo(() => {
    const map = {};
    (jobs || []).forEach(j => {
      if (j.stage === "done") return;
      loSpanDays(j).forEach(d => {
        if (d >= today && d <= last) (map[d] || (map[d] = [])).push(j);
      });
    });
    return Object.keys(map).sort().map(d => {
      const list = map[d];
      const byTech = {};
      list.forEach(j => {
        if (j.tech) byTech[j.tech] = (byTech[j.tech] || 0) + 1;
      });
      const clash = Object.keys(byTech).filter(t => byTech[t] > 1);
      return {
        d,
        list,
        clash
      };
    });
  }, [jobs, today, last]);
  const clashDays = days.filter(x => x.clash.length).length;
  const total = React.useMemo(() => {
    const s = new Set();
    days.forEach(x => x.list.forEach(j => s.add(j.id)));
    return s.size;
  }, [days]);
  return React.createElement("div", {
    className: "pnl",
    style: clashDays ? {
      borderLeft: "3px solid #D93025"
    } : null
  }, React.createElement(PanelTitle, {
    title: "\u0E04\u0E34\u0E27\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 14 \u0E27\u0E31\u0E19\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32",
    sub: total ? total + " งาน" + (clashDays ? " · มี " + clashDays + " วันที่ช่างชนคิว" : " · ไม่มีคิวชน") : "ยังไม่มีงานลงคิวในช่วงนี้"
  }), days.length === 0 ? React.createElement(Empty, {
    text: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E43\u0E19\u0E2A\u0E2D\u0E07\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32"
  }) : React.createElement("div", {
    style: {
      maxHeight: 420,
      overflowY: "auto",
      marginTop: 4
    }
  }, days.map(day => {
    const dt = parseDate(day.d);
    const isToday = day.d === today;
    return React.createElement("div", {
      key: day.d,
      style: {
        display: "flex",
        gap: 14,
        padding: "12px 2px",
        borderTop: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        width: 54,
        flexShrink: 0,
        textAlign: "center"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 650,
        color: isToday ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, window.TH_DAYS[dt.getDay()]), React.createElement("div", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 21,
        fontWeight: 700,
        lineHeight: 1.05,
        color: isToday ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, dt.getDate()), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, window.TH_MONTHS[dt.getMonth()])), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, day.list.map(j => {
      const bad = j.tech && day.clash.indexOf(j.tech) >= 0;
      return React.createElement("button", {
        key: j.id,
        onClick: () => onOpen(j),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 10px",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          background: "var(--surface)",
          border: "1px solid " + (bad ? "#FCA5A5" : "var(--border)"),
          borderRadius: 10
        },
        onMouseEnter: e => e.currentTarget.style.background = "var(--surface2)",
        onMouseLeave: e => e.currentTarget.style.background = "var(--surface)"
      }, React.createElement(TechAvatar, {
        techId: j.tech,
        size: 24
      }), React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, React.createElement("span", {
        style: {
          display: "block",
          fontSize: 13,
          fontWeight: 650,
          color: "var(--text-1)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, j.name), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 11.5,
          color: "var(--text-3)",
          marginTop: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, [j.province, j.kw ? j.kw + " kW" : "", j.tech ? "" : "ยังไม่มอบหมายช่าง"].filter(Boolean).join(" · "))), bad && React.createElement("span", {
        style: {
          flexShrink: 0,
          fontSize: 10.5,
          fontWeight: 800,
          color: "#D93025",
          background: "rgba(217,48,37,.11)",
          padding: "3px 8px",
          borderRadius: 99
        }
      }, "\u0E0A\u0E48\u0E32\u0E07\u0E0A\u0E19\u0E04\u0E34\u0E27"));
    })));
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "* \u201C\u0E0A\u0E48\u0E32\u0E07\u0E0A\u0E19\u0E04\u0E34\u0E27\u201D = \u0E0A\u0E48\u0E32\u0E07\u0E04\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E16\u0E39\u0E01\u0E25\u0E07\u0E44\u0E27\u0E49\u0E2A\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B\u0E43\u0E19\u0E27\u0E31\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \u2014 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22\u0E0A\u0E48\u0E32\u0E07\u0E44\u0E21\u0E48\u0E19\u0E31\u0E1A"));
}
function LoTechLoadPanel({
  jobs,
  techs,
  onTech
}) {
  const SF = window.SF;
  const today = SF.TODAY,
    soonMax = loAddDays(today, 7);
  const rows = React.useMemo(() => {
    const list = techs && techs.length ? techs : SF.TECHS || [];
    const base = list.map(t => ({
      id: t.id,
      name: t.name || t.nick || "—",
      color: t.color || "var(--primary)",
      n: 0,
      soon: 0,
      late: 0,
      kw: 0
    }));
    const byId = {};
    base.forEach(r => {
      byId[r.id] = r;
    });
    const none = {
      id: "__none",
      name: "ยังไม่มอบหมายช่าง",
      color: "var(--text-3)",
      n: 0,
      soon: 0,
      late: 0,
      kw: 0
    };
    (jobs || []).forEach(j => {
      if (j.stage === "done") return;
      const r = j.tech && byId[j.tech] || none;
      r.n += 1;
      r.kw += +j.kw || 0;
      if (j.delayed) r.late += 1;
      const s = SF.installDate ? SF.installDate(j) : "";
      if (s && s >= today && s <= soonMax) r.soon += 1;
    });
    const out = base.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    if (none.n) out.unshift(none);
    return out;
  }, [jobs, techs, today, soonMax]);
  const max = Math.max.apply(null, rows.map(r => r.n).concat([1]));
  const live = rows.reduce((s, r) => s + r.n, 0);
  return React.createElement("div", {
    className: "pnl"
  }, React.createElement(PanelTitle, {
    title: "\u0E20\u0E32\u0E23\u0E30\u0E07\u0E32\u0E19\u0E15\u0E48\u0E2D\u0E0A\u0E48\u0E32\u0E07",
    sub: "งานที่ยังไม่เสร็จ " + live + " งาน · คลิกเพื่อดูงานของช่างคนนั้น"
  }), rows.length === 0 ? React.createElement(Empty, {
    text: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E32\u0E07\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A"
  }) : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginTop: 16,
      maxHeight: 340,
      overflowY: "auto"
    }
  }, rows.map(r => React.createElement("button", {
    key: r.id,
    onClick: () => onTech && onTech(r.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: "none",
      padding: "2px 0",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      width: "100%"
    }
  }, React.createElement("span", {
    style: {
      width: 108,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12.5,
      fontWeight: 650,
      color: "var(--text-1)",
      lineHeight: 1.25,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: r.color,
      flexShrink: 0
    }
  }), r.name), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: 10,
      background: "var(--surface3)",
      borderRadius: 99,
      overflow: "hidden"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.max(r.n / max * 100, r.n ? 5 : 0) + "%",
      background: r.late ? "#D93025" : r.color,
      borderRadius: 99,
      transition: "width .6s cubic-bezier(.2,.8,.2,1)"
    }
  })), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, r.n === 0 ? "ว่าง — ยังไม่มีงานค้าง" : ["ติดตั้งใน 7 วัน " + r.soon + " งาน", r.late ? "ล่าช้า " + r.late + " งาน" : "", r.kw ? Math.round(r.kw * 10) / 10 + " kW" : ""].filter(Boolean).join(" · "))), React.createElement("span", {
    style: {
      width: 30,
      flexShrink: 0,
      textAlign: "right",
      fontFamily: "var(--display)",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-.03em",
      fontVariantNumeric: "tabular-nums",
      color: r.n ? "var(--text-1)" : "var(--text-3)"
    }
  }, r.n)))));
}
function LoStalePanel({
  jobs,
  onOpen
}) {
  const SF = window.SF;
  const rows = React.useMemo(() => {
    const known = [],
      unknown = [];
    (jobs || []).forEach(j => {
      if (j.stage === "done") return;
      const d = loDaysInStage(j);
      if (d == null) unknown.push({
        job: j,
        days: null
      });else if (d >= 7) known.push({
        job: j,
        days: d
      });
    });
    known.sort((a, b) => b.days - a.days);
    return {
      list: known.concat(unknown).slice(0, 10),
      known: known.length,
      unknown: unknown.length
    };
  }, [jobs]);
  const list = rows.list;
  const sub = rows.known ? "ค้างขั้นเดิมเกิน 7 วัน " + rows.known + " งาน" + (rows.unknown ? " · ไม่รู้ระยะเวลาอีก " + rows.unknown + " งาน" : "") : rows.unknown ? rows.unknown + " งานที่ไม่เคยเดินขั้นผ่านระบบ จึงไม่รู้ว่าค้างมานานแค่ไหน" : "ทุกงานขยับภายใน 7 วัน";
  return React.createElement("div", {
    className: "pnl"
  }, React.createElement(PanelTitle, {
    title: "\u0E07\u0E32\u0E19\u0E04\u0E49\u0E32\u0E07\u0E44\u0E21\u0E48\u0E02\u0E22\u0E31\u0E1A",
    sub: sub
  }), list.length === 0 ? React.createElement(Empty, {
    text: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E04\u0E49\u0E32\u0E07\u0E02\u0E31\u0E49\u0E19\u0E40\u0E14\u0E34\u0E21\u0E19\u0E32\u0E19\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34"
  }) : React.createElement("div", {
    className: "rows",
    style: {
      maxHeight: 330,
      overflowY: "auto"
    }
  }, list.map(r => {
    const j = r.job;
    const st = (SF.STAGES || []).find(x => x.key === j.stage) || {
      th: j.stage,
      color: "var(--text-3)"
    };
    const col = r.days == null ? "var(--text-3)" : r.days >= 14 ? "#D93025" : r.days >= 7 ? "#F59E0B" : st.color;
    return React.createElement("button", {
      key: j.id,
      onClick: () => onOpen(j)
    }, React.createElement("span", {
      className: "mk",
      style: {
        background: col
      }
    }), React.createElement("span", {
      className: "bd"
    }, React.createElement("span", {
      className: "nm"
    }, j.name), React.createElement("span", {
      className: "mt"
    }, [j.code, st.th, j.tech ? null : "ยังไม่มอบหมายช่าง"].filter(Boolean).join(" · "))), React.createElement("span", {
      className: "when",
      style: r.days != null && r.days >= 14 ? {
        color: "#D93025"
      } : null
    }, React.createElement("b", null, "\u0E04\u0E49\u0E32\u0E07\u0E02\u0E31\u0E49\u0E19\u0E19\u0E35\u0E49"), r.days == null ? "ไม่ทราบ" : r.days + " วัน"));
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "* \u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E02\u0E31\u0E49\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 \u2014 \u0E07\u0E32\u0E19\u0E40\u0E01\u0E48\u0E32\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E40\u0E14\u0E34\u0E19\u0E02\u0E31\u0E49\u0E19\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E27\u0E48\u0E32 \u201C\u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A\u201D"));
}
function LoBottleneckPanel({
  jobs,
  onStage
}) {
  const SF = window.SF;
  const rows = React.useMemo(() => (SF.STAGES || []).filter(s => s.key !== "done").map(s => {
    const list = (jobs || []).filter(j => j.stage === s.key);
    const ds = list.map(loDaysInStage).filter(x => x != null);
    return {
      s,
      n: list.length,
      med: loMedian(ds)
    };
  }), [jobs]);
  const max = Math.max.apply(null, rows.map(r => r.med || 0).concat([1]));
  const worst = rows.reduce((a, b) => (b.med || 0) > (a.med || 0) ? b : a, rows[0] || {
    s: {
      th: ""
    },
    med: null
  });
  return React.createElement("div", {
    className: "pnl"
  }, React.createElement(PanelTitle, {
    title: "\u0E04\u0E2D\u0E02\u0E27\u0E14\u0E15\u0E32\u0E21\u0E02\u0E31\u0E49\u0E19",
    sub: worst && worst.med ? "ค้างนานสุดที่ขั้น “" + worst.s.th + "” ราว " + worst.med + " วัน" : "คลิกที่ขั้นเพื่อดูรายการงาน"
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 18
    }
  }, rows.map(r => React.createElement("button", {
    key: r.s.key,
    onClick: () => onStage && onStage(r.s.key),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      width: "100%"
    }
  }, React.createElement("span", {
    style: {
      width: 104,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12.5,
      fontWeight: 650,
      color: "var(--text-1)",
      lineHeight: 1.25
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: r.s.color,
      flexShrink: 0
    }
  }), r.s.th), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: 10,
      background: "var(--surface3)",
      borderRadius: 99,
      overflow: "hidden"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.max((r.med || 0) / max * 100, r.n ? 5 : 0) + "%",
      background: r.s.color,
      borderRadius: 99,
      transition: "width .6s cubic-bezier(.2,.8,.2,1)"
    }
  })), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      marginTop: 4,
      color: r.med != null && r.med >= 14 ? "#D93025" : "var(--text-3)"
    }
  }, r.n === 0 ? "ไม่มีงานค้างขั้นนี้" : r.med == null ? "ไม่ทราบระยะเวลาที่ค้าง" : "ค้างมาแล้วราว " + r.med + " วัน (ค่ากลาง)")), React.createElement("span", {
    style: {
      width: 30,
      flexShrink: 0,
      textAlign: "right",
      fontFamily: "var(--display)",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-.03em",
      fontVariantNumeric: "tabular-nums",
      color: r.n ? "var(--text-1)" : "var(--text-3)"
    }
  }, r.n)))));
}
function LoPermitPanel({
  jobs,
  onGoPermit
}) {
  const n = React.useMemo(() => {
    const c = {
      todo: 0,
      draft: 0,
      sent: 0,
      filing: 0,
      rejected: 0,
      approved: 0
    };
    (jobs || []).forEach(j => {
      const st = j.permit && j.permit.status;
      if (!st) {
        if (j.stage === "done") c.todo += 1;
        return;
      }
      if (c[st] != null) c[st] += 1;
    });
    return c;
  }, [jobs]);
  const rows = [{
    k: "todo",
    th: "ติดตั้งเสร็จแต่ยังไม่เริ่มเก็บข้อมูล",
    v: n.todo,
    color: "#D93025"
  }, {
    k: "draft",
    th: "กำลังเก็บข้อมูลหน้างาน",
    v: n.draft,
    color: "#94A3B8"
  }, {
    k: "sent",
    th: "รอฝ่ายขออนุญาตรับงาน",
    v: n.sent,
    color: "#F59E0B"
  }, {
    k: "filing",
    th: "ยื่นการไฟฟ้าแล้ว",
    v: n.filing,
    color: "#0EA5E9"
  }, {
    k: "rejected",
    th: "ถูกตีกลับ ต้องแก้",
    v: n.rejected,
    color: "#D93025"
  }, {
    k: "approved",
    th: "การไฟฟ้าอนุมัติ",
    v: n.approved,
    color: "var(--primary)"
  }];
  const stuck = n.todo + n.rejected;
  return React.createElement("div", {
    className: "pnl",
    style: stuck ? {
      borderLeft: "3px solid #F59E0B"
    } : null
  }, React.createElement(PanelTitle, {
    title: "\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    sub: stuck ? stuck + " งานที่ต้องผลัก" : "ไม่มีใบค้างที่ฝั่งเรา"
  }), React.createElement("div", {
    className: "rows"
  }, rows.map(r => React.createElement("button", {
    key: r.k,
    onClick: () => onGoPermit && onGoPermit()
  }, React.createElement("span", {
    className: "mk",
    style: {
      background: r.color
    }
  }), React.createElement("span", {
    className: "bd"
  }, React.createElement("span", {
    className: "nm",
    style: {
      fontWeight: 600,
      fontSize: 12.5
    }
  }, r.th)), React.createElement("span", {
    className: "when",
    style: r.v && (r.k === "todo" || r.k === "rejected") ? {
      color: "#D93025"
    } : null
  }, React.createElement("b", null, "\u0E07\u0E32\u0E19"), r.v)))));
}
function LoSalesPanel({
  leads,
  quotes,
  onGoSales
}) {
  const month = window.SF.TODAY.slice(0, 7);
  const n = React.useMemo(() => {
    const L = leads || [],
      Q = quotes || [];
    let live = 0,
      late = 0,
      wonM = 0,
      pipe = 0,
      sale = 0,
      waiting = 0;
    L.forEach(l => {
      const k = window.salesStageKey ? window.salesStageKey(l) : l.status || "new";
      if (k === "won") {
        if (window.sMonthKey && window.sMonthKey(l.updatedAt) === month) wonM += 1;
        return;
      }
      if (k === "lost") return;
      live += 1;
      pipe += +l.expValue || 0;
      if (window.sOverdue && window.sOverdue(l.nextFollow)) late += 1;
    });
    Q.forEach(q => {
      if (q.status === "sent") waiting += 1;
      if (q.status === "accepted" && window.sMonthKey && window.sMonthKey(q.decidedAt || q.updatedAt) === month && window.quoteTotals) sale += window.quoteTotals(q).grand;
    });
    return {
      live,
      late,
      wonM,
      pipe,
      sale,
      waiting
    };
  }, [leads, quotes, month]);
  const rows = [{
    th: "ปิดการขายเดือนนี้",
    v: n.wonM + " ราย",
    sub: n.sale ? "฿" + fmtBaht(Math.round(n.sale)) : "ยังไม่มีใบที่ลูกค้าตกลง",
    color: "var(--primary)"
  }, {
    th: "ลูกค้าที่ยังไล่อยู่",
    v: n.live + " ราย",
    sub: n.pipe ? "มูลค่าที่คาดไว้ ฿" + fmtBaht(Math.round(n.pipe)) : "ยังไม่ได้ใส่มูลค่าที่คาด",
    color: "#0EA5E9"
  }, {
    th: "เลยวันติดตาม",
    v: n.late + " ราย",
    sub: n.late ? "เซลล์ต้องโทรก่อนใคร" : "ตามทันทุกราย",
    color: n.late ? "#D93025" : "var(--text-3)"
  }, {
    th: "ใบเสนอราคารอลูกค้าตอบ",
    v: n.waiting + " ใบ",
    sub: "ส่งไปแล้วยังไม่ตัดสิน",
    color: "#EC4899"
  }];
  const empty = !(leads || []).length && !(quotes || []).length;
  return React.createElement("div", {
    className: "pnl"
  }, React.createElement(PanelTitle, {
    title: "\u0E2A\u0E23\u0E38\u0E1B\u0E07\u0E32\u0E19\u0E02\u0E32\u0E22",
    sub: empty ? "ยังไม่มีข้อมูล" : "เดือน " + window.TH_MONTHS[parseDate(window.SF.TODAY).getMonth()]
  }), empty && React.createElement("div", {
    style: {
      padding: "18px 2px",
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E25\u0E30\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 11.5
    }
  }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32 \u201C\u0E07\u0E32\u0E19\u0E02\u0E32\u0E22\u201D \u0E41\u0E25\u0E49\u0E27\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E40\u0E2D\u0E07")), React.createElement("div", {
    className: "rows",
    style: {
      display: empty ? "none" : undefined
    }
  }, rows.map(r => React.createElement("button", {
    key: r.th,
    onClick: () => onGoSales && onGoSales()
  }, React.createElement("span", {
    className: "mk",
    style: {
      background: r.color
    }
  }), React.createElement("span", {
    className: "bd"
  }, React.createElement("span", {
    className: "nm",
    style: {
      fontWeight: 600,
      fontSize: 12.5
    }
  }, r.th), React.createElement("span", {
    className: "mt"
  }, r.sub)), React.createElement("span", {
    className: "when"
  }, r.v)))));
}
function LoMonthPanel({
  jobs
}) {
  const today = window.SF.TODAY;
  const month = today.slice(0, 7);
  const prevMonth = React.useMemo(() => {
    const d = parseDate(today);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return loISO(d).slice(0, 7);
  }, [today]);
  const n = React.useMemo(() => {
    let cur = 0,
      curKw = 0,
      prev = 0,
      prevKw = 0;
    (jobs || []).forEach(j => {
      if (j.stage !== "done") return;
      const m = loDoneAt(j).slice(0, 7);
      if (m === month) {
        cur += 1;
        curKw += +j.kw || 0;
      } else if (m === prevMonth) {
        prev += 1;
        prevKw += +j.kw || 0;
      }
    });
    return {
      cur,
      curKw,
      prev,
      prevKw
    };
  }, [jobs, month, prevMonth]);
  const pct = n.prev > 0 ? Math.round((n.cur - n.prev) / n.prev * 100) : null;
  const M = window.TH_MONTHS[parseDate(today).getMonth()];
  return React.createElement("div", {
    className: "pnl"
  }, React.createElement(PanelTitle, {
    title: "\u0E1C\u0E25\u0E07\u0E32\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49",
    sub: "งานที่ปิดจบในเดือน " + M
  }), React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 40,
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: "-.035em",
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, n.cur), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19")), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E27\u0E21 ", React.createElement("b", null, Math.round(n.curKw * 10) / 10), " kW"), React.createElement("div", {
    style: {
      marginTop: 14,
      paddingTop: 14,
      borderTop: "1px solid var(--border)",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, pct == null ? "เดือนก่อนไม่มีงานปิดจบ จึงยังเทียบไม่ได้" : React.createElement(React.Fragment, null, "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19 ", React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, n.prev), " \u0E07\u0E32\u0E19 (", Math.round(n.prevKw * 10) / 10, " kW) \xB7", " ", React.createElement("span", {
    style: {
      color: pct >= 0 ? "var(--primary-dark)" : "#D93025",
      fontWeight: 700
    }
  }, pct >= 0 ? "+" : "", pct, "%")))));
}
function LeadOverview({
  jobs,
  leads,
  quotes,
  stock,
  techs,
  onOpen,
  onStage,
  onKpi,
  onTech,
  onGoPermit,
  onGoSales
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const J = jobs || [];
  const active = J.filter(j => j.stage !== "done");
  const delayed = J.filter(j => j.delayed);
  const problem = active.filter(j => j.problem);
  const noInstall = active.filter(j => !(SF.installDate && SF.installDate(j)));
  const shortCount = React.useMemo(() => {
    const items = stock && stock.items || [],
      moves = stock && stock.moves || [];
    if (!items.length) return 0;
    const today = SF.TODAY,
      max = loAddDays(today, 14);
    return active.filter(j => {
      const s = SF.installDate ? SF.installDate(j) : "";
      if (!s) return false;
      const e = SF.installEnd && SF.installEnd(j) || s;
      if (!(e >= today && s <= max)) return false;
      return window.jobStockShortages ? window.jobStockShortages(j, items, moves).length > 0 : false;
    }).length;
  }, [jobs, stock]);
  const col = spec => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : spec,
    gap: 18
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, !isMobile && React.createElement(StatRail, {
    cols: 4,
    items: [{
      label: "ล่าช้ากว่ากำหนด",
      value: delayed.length,
      unit: "งาน",
      accent: "var(--text-3)",
      alert: delayed.length > 0,
      sub: delayed.length ? "เลยวันนัดติดตั้งแล้ว" : "ไม่มีงานเลยกำหนด",
      onClick: () => onKpi("delayed")
    }, {
      label: "ติดปัญหาหน้างาน",
      value: problem.length,
      unit: "งาน",
      accent: "#F59E0B",
      alert: problem.length > 0,
      sub: problem.length ? "มีบันทึกปัญหาค้างอยู่" : "ไม่มีงานติดปัญหา",
      onClick: () => onKpi("problem")
    }, {
      label: "ยังไม่นัดวันติดตั้ง",
      value: noInstall.length,
      unit: "งาน",
      accent: "#0EA5E9",
      sub: React.createElement(React.Fragment, null, "\u0E08\u0E32\u0E01 ", React.createElement("b", null, active.length), " \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E04\u0E49\u0E32\u0E07"),
      onClick: () => onKpi("noinstall")
    }, {
      label: "ของไม่พอ",
      value: shortCount,
      unit: "งาน",
      accent: "#EC4899",
      sub: shortCount ? "ต้องสั่งเพิ่มก่อนออกหน้างาน" : "ของครบทุกงานที่ใกล้ติดตั้ง"
    }]
  }), React.createElement(MaterialShortagePanel, {
    jobs: J,
    stock: stock,
    onOpen: onOpen
  }), React.createElement(LoQueuePanel, {
    jobs: J,
    onOpen: onOpen
  }), React.createElement("div", {
    style: col("1.15fr 1fr")
  }, React.createElement(LoTechLoadPanel, {
    jobs: J,
    techs: techs,
    onTech: onTech
  }), React.createElement(AlertsPanel, {
    jobs: J,
    onOpen: onOpen
  })), React.createElement("div", {
    style: col("1fr 1fr")
  }, React.createElement(LoStalePanel, {
    jobs: J,
    onOpen: onOpen
  }), React.createElement(LoBottleneckPanel, {
    jobs: J,
    onStage: onStage
  })), React.createElement("div", {
    style: col("1fr 1fr 1fr")
  }, React.createElement(LoPermitPanel, {
    jobs: J,
    onGoPermit: onGoPermit
  }), React.createElement(LoSalesPanel, {
    leads: leads,
    quotes: quotes,
    onGoSales: onGoSales
  }), React.createElement(LoMonthPanel, {
    jobs: J
  })));
}
Object.assign(window, {
  LeadOverview,
  loDaysInStage,
  loDoneAt,
  loSpanDays
});