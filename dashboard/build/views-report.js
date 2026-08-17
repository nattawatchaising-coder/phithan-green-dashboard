function rpDateRange(s, e) {
  if (!s) return "ยังไม่นัดติดตั้ง";
  if (!e || e === s) return thDate(s);
  const d1 = parseDate(s),
    d2 = parseDate(e);
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) return d1.getDate() + "-" + d2.getDate() + " " + TH_MONTHS[d2.getMonth()];
  return thDate(s) + " - " + thDate(e);
}
const RP_TYPE = j => j.type === "project" ? "ติดตั้งงานโครงการ" : "ติดตั้งบ้าน";
function rpHeader(j) {
  const parts = [rpDateRange(j.startDate, j.deadline), RP_TYPE(j), j.name || "(ไม่ระบุชื่อ)"];
  if (j.phase) parts.push(j.phase + " เฟส");
  if (j.kw) parts.push(j.kw + " kWp.");
  if (j.brand) parts.push(j.brand);
  let head = parts.join(" ");
  const st = stageOf(j.stage);
  head += " — สถานะ: " + (st ? st.th : j.stage);
  if (j.delayed && j.lateStages && j.lateStages[0]) head += " ⚠ ล่าช้า " + j.lateStages[0].daysLate + " วัน";
  return head;
}
function rpBullets(j) {
  const SF = window.SF;
  const b = [];
  if (j.battery) {
    let t = "ระบบแบตเตอรี่" + (j.batSize && j.batSize !== "ไม่มี" ? " " + j.batSize : "");
    if (j.backup) t += " + ระบบ Back Up";
    b.push(t);
  } else if (j.backup) {
    b.push("ระบบ Back Up");
  }
  if (j.connect && j.connect !== "-") b.push("ออฟติไมเซอร์ " + j.connect);
  if ((j.brand || "").toUpperCase().includes("ATMOCE")) b.push("ตู้ Combiner: " + (j.comboType === "assembled" ? "ตู้ประกอบ" : "ตู้สำเร็จ"));
  if (j.birdnet) b.push("ติดตั้งตาข่ายกันนก");
  const notReady = (SF.MATERIALS || []).filter(m => {
    const s = j.mat[m.key];
    return s === "waiting" || s === "none";
  });
  if (j.matReady) b.push("วัสดุพร้อมติดตั้งครบแล้ว ✅");else if (notReady.length) b.push("รอวัสดุ: " + notReady.map(m => m.th + (j.mat[m.key] === "waiting" ? " (รอของ)" : " (ยังไม่สั่ง)")).join(", "));
  const tech = SF.TECH_BY_ID[j.tech];
  if (tech) b.push("ช่างผู้รับผิดชอบ: " + tech.name + (tech.role ? " (" + tech.role + ")" : ""));
  if (j.contractor) b.push("ทีมรับเหมา: " + j.contractor);
  if (j.province) b.push("พื้นที่: " + j.province + (j.address ? " · " + j.address : ""));
  if (j.problem) b.push("⚠ ปัญหา: " + j.problem);
  if (j.note) b.push("หมายเหตุ: " + j.note);
  if (j.trello) b.push(j.trello);else if (j.map) b.push(j.map);
  return b;
}
function rpJobText(j) {
  return rpHeader(j) + "\n" + rpBullets(j).map(x => "  • " + x).join("\n");
}
function rpFullText(sections) {
  const total = sections.reduce((n, s) => n + s.jobs.length, 0);
  const head = "สรุปสถานะงานติดตั้ง — " + thDate(window.SF.TODAY, true) + " (" + total + " งาน)";
  const body = sections.filter(s => s.jobs.length).map(s => "【 " + s.title + " (" + s.jobs.length + ") 】\n\n" + s.jobs.map(rpJobText).join("\n\n")).join("\n\n");
  return head + "\n\n" + body;
}
function rpCopy(text, done) {
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done && done(true);
    } catch (e) {
      done && done(false);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done && done(true), fallback);
  } else fallback();
}
function rpDownload(text) {
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "รายงานสถานะงาน-" + window.SF.TODAY + ".txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const RP_LINK = s => /^https?:\/\//.test(s);
function ReportBlock({
  job,
  onOpen
}) {
  const [copied, setCopied] = React.useState(false);
  const st = stageOf(job.stage);
  const bullets = rpBullets(job);
  const copy = () => rpCopy(rpJobText(job), ok => {
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  });
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "14px 16px",
      boxShadow: "var(--shadow-sm)",
      position: "relative"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: st ? st.color : "var(--text-3)",
      marginTop: 7,
      flexShrink: 0
    }
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1.45
    }
  }, rpHeader(job)), React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: "8px 0 0",
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, bullets.map((x, i) => React.createElement("li", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, "\u2022"), RP_LINK(x) ? React.createElement("a", {
    href: x,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#3B82F6",
      wordBreak: "break-all",
      textDecoration: "none"
    }
  }, x) : React.createElement("span", {
    style: {
      color: x.startsWith("⚠") ? "var(--tint-red-tx2)" : "var(--text-2)"
    }
  }, x))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: copy,
    title: "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 10px",
      borderRadius: 9,
      border: "1px solid " + (copied ? "var(--primary)" : "var(--border-strong)"),
      background: copied ? "var(--primary-soft)" : "var(--surface2)",
      color: copied ? "var(--primary-dark)" : "var(--text-2)",
      fontSize: 11.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: copied ? "check" : "file",
    size: 13,
    color: copied ? "var(--primary-dark)" : "var(--text-2)"
  }), copied ? "คัดลอกแล้ว" : "คัดลอก"), onOpen && React.createElement("button", {
    onClick: () => onOpen(job),
    title: "\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19",
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 15,
    color: "var(--text-2)"
  })))));
}
function ReportView({
  jobs,
  onOpen
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [copiedAll, setCopiedAll] = React.useState(false);
  const [showText, setShowText] = React.useState(false);
  const [hideDone, setHideDone] = React.useState(false);
  const sortFn = (a, b) => {
    const sa = a.startDate || "9999",
      sb = b.startDate || "9999";
    if (sa !== sb) return sa < sb ? -1 : 1;
    return (a.code || "").localeCompare(b.code || "");
  };
  const active = React.useMemo(() => jobs.filter(j => j.stage !== "done").slice().sort(sortFn), [jobs]);
  const done = React.useMemo(() => jobs.filter(j => j.stage === "done").slice().sort(sortFn), [jobs]);
  const sections = React.useMemo(() => {
    const s = [{
      title: "กำลังดำเนินการ",
      key: "active",
      color: "var(--primary)",
      jobs: active
    }];
    if (!hideDone) s.push({
      title: "เสร็จสิ้นแล้ว",
      key: "done",
      color: stageOf("done").color,
      jobs: done
    });
    return s;
  }, [active, done, hideDone]);
  const fullText = React.useMemo(() => rpFullText(sections), [sections]);
  const copyAll = () => rpCopy(fullText, ok => {
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1800);
    }
  });
  if (!jobs.length) {
    return React.createElement("div", {
      style: {
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "file",
      size: 40,
      color: "var(--text-3)"
    }), React.createElement("div", {
      style: {
        marginTop: 12,
        fontSize: 14
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E15\u0E32\u0E21\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E07\u0E44\u0E27\u0E49"));
  }
  const btn = extra => Object.assign({
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 16px",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    border: "none"
  }, extra);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: isMobile ? 14 : "16px 18px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      marginTop: 2
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23 ", active.length, " \xB7 \u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19 ", done.length, " \xB7 ", thDate(window.SF.TODAY, true))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setHideDone(v => !v),
    style: btn({
      background: hideDone ? "var(--primary-soft)" : "var(--surface2)",
      color: hideDone ? "var(--primary-dark)" : "var(--text-2)",
      border: "1px solid " + (hideDone ? "var(--primary)" : "var(--border-strong)")
    })
  }, React.createElement(Icon, {
    name: hideDone ? "eyeOff" : "check",
    size: 16,
    color: hideDone ? "var(--primary-dark)" : "var(--text-2)"
  }), hideDone ? "ซ่อนงานเสร็จสิ้นอยู่" : "ซ่อนงานเสร็จสิ้น"), React.createElement("button", {
    onClick: () => setShowText(v => !v),
    style: btn({
      background: "var(--surface2)",
      color: "var(--text-2)",
      border: "1px solid var(--border-strong)"
    })
  }, React.createElement(Icon, {
    name: "eye",
    size: 16,
    color: "var(--text-2)"
  }), " ", showText ? "ซ่อนข้อความ" : "ดูข้อความล้วน"), React.createElement("button", {
    onClick: () => rpDownload(fullText),
    style: btn({
      background: "var(--surface2)",
      color: "var(--text-2)",
      border: "1px solid var(--border-strong)"
    })
  }, React.createElement(Icon, {
    name: "download",
    size: 16,
    color: "var(--text-2)"
  }), " \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 .txt"), React.createElement("button", {
    onClick: copyAll,
    style: btn({
      background: copiedAll ? "var(--primary-dark)" : "var(--primary)",
      color: "#fff",
      boxShadow: "0 2px 8px rgba(34,163,91,.25)"
    })
  }, React.createElement(Icon, {
    name: copiedAll ? "check" : "file",
    size: 16,
    color: "#fff"
  }), " ", copiedAll ? "คัดลอกทั้งหมดแล้ว ✓" : "คัดลอกข้อความทั้งหมด"))), showText && React.createElement("textarea", {
    readOnly: true,
    value: fullText,
    onFocus: e => e.target.select(),
    style: {
      width: "100%",
      minHeight: 240,
      padding: 14,
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontSize: 12.5,
      lineHeight: 1.6,
      resize: "vertical",
      outline: "none"
    }
  }), sections.filter(s => s.jobs.length).map(s => React.createElement("div", {
    key: s.key,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "2px 2px",
      marginTop: 4
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: s.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: ".03em",
      color: s.color
    }
  }, s.title), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, s.jobs.length), React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border)",
      marginLeft: 4
    }
  })), s.jobs.map(j => React.createElement(ReportBlock, {
    key: j.id,
    job: j,
    onOpen: onOpen
  })))));
}
function DailyReportButton({
  job
}) {
  const [open, setOpen] = React.useState(false);
  return React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setOpen(true);
    },
    title: "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19",
    style: {
      marginTop: 10,
      width: "100%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "8px 12px",
      borderRadius: 9,
      border: "1px dashed var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), open && ReactDOM.createPortal(React.createElement(DailyReportModal, {
    job: job,
    role: (window.DR_ME || {}).role,
    currentUser: (window.DR_ME || {}).user,
    onClose: () => setOpen(false)
  }), document.body));
}