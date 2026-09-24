const BL_ACCENT = "#6366F1";
const BL_INPUT = () => window.EC_INPUT || {
  width: "100%",
  padding: "10px 12px"
};
const blMoney = n => window.sBaht ? window.sBaht(n) : String(n);
const blDay = v => v ? window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10) : "—";
function BlPill({
  row,
  sub
}) {
  const st = window.blStatusOf((row || {}).status);
  return React.createElement(window.EcPill, {
    th: st.th,
    color: st.color,
    sub: sub
  });
}
function BlRail({
  rows,
  curId,
  onPick
}) {
  const list = (rows || []).filter(window.blLive);
  if (!list.length) return null;
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, list.map(r => {
    const st = window.blStatusOf(r.status);
    const on = r.id === curId;
    return React.createElement("div", {
      key: r.id,
      onClick: onPick ? () => onPick(r) : undefined,
      style: {
        flex: 1,
        minWidth: 0,
        cursor: onPick ? "pointer" : "default"
      }
    }, React.createElement("div", {
      style: {
        height: 4,
        borderRadius: 99,
        background: st.color,
        opacity: r.status === "pending" ? 0.35 : 1
      }
    }), React.createElement("div", {
      style: {
        fontSize: 9.5,
        marginTop: 3,
        color: on ? st.color : "var(--text-3)",
        fontWeight: on ? 800 : 600,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, "\u0E07\u0E27\u0E14 ", r.n));
  }));
}
function BlNote({
  tone,
  children
}) {
  const c = tone === "ok" ? {
    bg: "var(--tint-ok-bg)",
    bd: "var(--tint-ok-bd)",
    tx: "var(--tint-ok-tx)"
  } : tone === "red" ? {
    bg: "var(--tint-red-bg)",
    bd: "var(--tint-red-bd)",
    tx: "var(--tint-red-tx)"
  } : {
    bg: "var(--tint-amber-bg)",
    bd: "var(--tint-amber-bd)",
    tx: "var(--tint-amber-tx)"
  };
  return React.createElement("div", {
    style: {
      margin: "0 12px 10px",
      padding: "8px 11px",
      borderRadius: 10,
      background: c.bg,
      border: "1px solid " + c.bd,
      color: c.tx,
      fontSize: 11.5,
      lineHeight: 1.55
    }
  }, children);
}
function BlMoveBtns({
  row,
  bills,
  role,
  currentUser,
  job,
  onMove,
  size
}) {
  const nexts = window.blNext(row, role, currentUser, bills);
  const block = window.blReadyToBill(row, bills);
  const showWhy = row && row.status === "ready" && !block.ok && window.blCanUse(role);
  if (!nexts.length && !showWhy) return null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center"
    }
  }, nexts.map(s => {
    const fwd = window.blFlowIdx(s.key) > window.blFlowIdx(row.status);
    return React.createElement("button", {
      key: s.key,
      onClick: () => onMove(row, s.key),
      style: {
        padding: size === "sm" ? "6px 10px" : "8px 12px",
        borderRadius: 9,
        fontFamily: "inherit",
        fontSize: size === "sm" ? 11.5 : 12.5,
        fontWeight: 700,
        cursor: "pointer",
        border: fwd ? "none" : "1px solid var(--border-strong)",
        background: fwd ? s.color : "var(--surface)",
        color: fwd ? "#fff" : "var(--text-2)"
      }
    }, s.key === "void" ? "ยกเลิกงวด" : s.key === "billed" ? "ออกเอกสาร · วางบิล" : s.key === "accepted" ? "ลูกค้ารับมอบแล้ว" : s.key === "paid" ? "รับเงินแล้ว" : window.blFlowIdx(s.key) < window.blFlowIdx(row.status) ? "ถอยกลับ · " + s.short : s.th);
  }), showWhy && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--tint-amber-tx)"
    }
  }, "\xB7 ", block.why));
}
function BlJobCard({
  job,
  quotes,
  leads,
  role,
  currentUser,
  readOnly,
  onOpen,
  onSaveBills
}) {
  const j = job || {};
  const [print, setPrint] = React.useState(null);
  const S = window.blSummary(j);
  const bills = j.bills || null;
  const quote = window.blPickQuote(quotes, j, leads);
  const drift = window.blDrift(j, quote);
  const cur = S.cur;
  const rows = window.blRows(j);
  const ro = readOnly || !onSaveBills;
  const move = (row, to) => {
    if (!onSaveBills) return;
    let opt = {};
    if (to === "void") {
      const why = window.prompt("ยกเลิกงวดที่ " + row.n + " เพราะอะไร (บันทึกไว้ในประวัติ)");
      if (why == null) return;
      opt.note = why;
    }
    if (to === "paid") {
      const ref = window.prompt("เลขอ้างอิงการโอน / เลขสลิป (ไม่มีก็เว้นว่าง)", row.payRef || "");
      if (ref == null) return;
      opt.ref = ref;
    }
    const next = window.blMove(row, to, currentUser, opt, j);
    onSaveBills(Object.assign({}, bills, {
      rows: rows.map(r => r.id === row.id ? next : r)
    }));
  };
  const st = cur ? window.blStatusOf(cur.status) : null;
  const sub = !S.has ? quote ? "ยังไม่ได้ตั้งงวด · ดึงจาก " + (quote.no || "ใบเสนอราคา") : "ยังไม่ได้ตั้งงวด · งานนี้ไม่มีใบเสนอราคา ต้องกรอกเอง" : "งวด " + (S.doneCount + (cur && cur.status === "paid" ? 0 : 1)) + "/" + S.count + " · รับแล้ว " + blMoney(S.collected) + " · ค้างรับ " + blMoney(S.outstanding) + " บาท";
  return React.createElement("div", {
    style: {
      marginBottom: 22,
      border: "1px solid " + (S.overdue.length ? "var(--tint-amber-bd)" : "var(--border-strong)"),
      borderLeft: "3px solid " + (st ? st.color : !S.has && quote ? "var(--primary)" : "var(--border-strong)"),
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, React.createElement("button", {
    onClick: onOpen,
    disabled: !onOpen,
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "none",
      border: "none",
      cursor: onOpen ? "pointer" : "default",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: BL_ACCENT + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 17,
    color: BL_ACCENT
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19 \xB7 \u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: st ? st.color : !S.has && quote ? "var(--primary-dark)" : "var(--text-3)",
      fontWeight: S.has ? 700 : 400
    }
  }, sub)), onOpen && React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), S.has && React.createElement("div", {
    style: {
      padding: "0 14px 12px"
    }
  }, React.createElement(BlRail, {
    rows: rows,
    curId: cur ? cur.id : null
  })), S.has && cur && React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border)",
      padding: "10px 14px",
      background: "var(--surface2)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: ro ? 0 : 9
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", cur.n), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      fontFamily: "var(--mono)"
    }
  }, blMoney(cur.amount), " \u0E1A\u0E32\u0E17"), React.createElement(BlPill, {
    row: cur
  }), cur.docNo ? React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, cur.docNo) : null), !ro && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement(BlMoveBtns, {
    row: cur,
    bills: bills,
    role: role,
    currentUser: currentUser,
    job: j,
    onMove: move,
    size: "sm"
  }), window.blFlowIdx(cur.status) >= window.blFlowIdx("billed") && React.createElement("button", {
    onClick: () => setPrint(cur),
    style: {
      padding: "6px 10px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"))), !!S.overdue.length && React.createElement(BlNote, null, "\u23F0 \u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25 ", S.overdue.map(r => "งวด " + r.n + " (" + blDay(r.due) + ")").join(" · "), " \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), S.mismatch && React.createElement(BlNote, null, "\u0E1C\u0E25\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E07\u0E27\u0E14 ", blMoney(S.total), " \u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A\u0E22\u0E2D\u0E14\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 ", blMoney(S.grand), " \u0E1A\u0E32\u0E17 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07"), drift && React.createElement(BlNote, null, "\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 ", quote && quote.no ? quote.no : "", " \u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E07\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 \u201C\u0E16\u0E2D\u0E14\u0E07\u0E27\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E08\u0E32\u0E01\u0E43\u0E1A\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u201D"), S.allPaid && React.createElement(BlNote, {
    tone: "ok"
  }, "\u2714 \u0E40\u0E01\u0E47\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E07\u0E27\u0E14\u0E41\u0E25\u0E49\u0E27 \u0E23\u0E27\u0E21 ", blMoney(S.collected), " \u0E1A\u0E32\u0E17"), print && React.createElement(BlPrintHost, {
    job: j,
    row: print,
    onClose: () => setPrint(null)
  }));
}
function BlPhotoPick({
  job,
  row,
  api,
  currentUser,
  onClose
}) {
  const j = job || {};
  const [tab, setTab] = React.useState("daily");
  const [busy, setBusy] = React.useState(0);
  const [err, setErr] = React.useState("");
  const daily = window.useDailyReports ? window.useDailyReports(j.id) : {
    dates: []
  };
  const dates = daily.dates || [];
  const [day, setDay] = React.useState("");
  React.useEffect(() => {
    if (!day && dates.length) setDay(dates[dates.length - 1]);
  }, [dates.length]);
  const dayPhotos = window.useDailyPhotos(j.id, tab === "daily" ? day : null);
  const media = window.useJobMedia(tab === "job" ? j.id : null);
  const picked = api.photos || [];
  const has = srcRef => picked.some(p => p.srcRef && p.srcRef === srcRef);
  const take = (p, src, srcRef) => {
    if (has(srcRef)) return;
    api.add(p.dataUrl, {
      cap: p.cap || "",
      user: currentUser,
      src: src,
      srcRef: srcRef
    });
  };
  const onFiles = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    for (const f of files) {
      if (!/^image\//.test(f.type || "")) {
        setErr("เลือกได้เฉพาะไฟล์รูป");
        continue;
      }
      setBusy(n => n + 1);
      try {
        const url = await window.resizeImageFile(f, 1400, 0.78);
        api.add(url, {
          user: currentUser,
          src: "upload",
          srcRef: ""
        });
      } catch (x) {
        setErr("ย่อรูปไม่สำเร็จ ลองรูปอื่น");
      }
      setBusy(n => n - 1);
    }
  };
  const grid = (list, src, refOf) => React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))",
      gap: 8
    }
  }, list.map(p => {
    const sr = refOf(p);
    const on = has(sr);
    return React.createElement("button", {
      key: p.id,
      onClick: () => take(p, src, sr),
      disabled: on,
      style: {
        padding: 0,
        border: "2px solid " + (on ? "var(--primary)" : "var(--border)"),
        borderRadius: 10,
        overflow: "hidden",
        background: "var(--surface2)",
        cursor: on ? "default" : "pointer",
        position: "relative"
      }
    }, React.createElement("img", {
      src: p.dataUrl,
      alt: "",
      style: {
        display: "block",
        width: "100%",
        height: 78,
        objectFit: "cover",
        opacity: on ? 0.45 : 1
      }
    }), on && React.createElement("span", {
      style: {
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        fontSize: 11,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27"));
  }), !list.length && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      padding: "10px 2px"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E43\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E35\u0E49"));
  const tabBtn = (id, label) => React.createElement("button", {
    onClick: () => setTab(id),
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid " + (tab === id ? BL_ACCENT : "var(--border-strong)"),
      background: tab === id ? BL_ACCENT + "18" : "var(--surface)",
      color: tab === id ? BL_ACCENT : "var(--text-2)"
    }
  }, label);
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 190,
      background: "rgba(8,20,14,.5)",
      overflow: "auto",
      padding: "18px 12px"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      background: "var(--surface)",
      borderRadius: 14,
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 15px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 ", (row || {}).n), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ", picked.length, " \u0E23\u0E39\u0E1B \xB7 \u0E41\u0E1C\u0E48\u0E19\u0E25\u0E30 4 \u0E23\u0E39\u0E1B\u0E40\u0E27\u0E25\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C")), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
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
      padding: 15
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, tabBtn("daily", "รูปรายงานประจำวัน"), tabBtn("job", "รูปหน้างาน"), tabBtn("up", "อัปโหลดใหม่")), tab === "daily" && React.createElement("div", null, React.createElement("select", {
    value: day,
    onChange: e => setDay(e.target.value),
    style: Object.assign({}, BL_INPUT(), {
      marginBottom: 10,
      maxWidth: 260
    })
  }, !dates.length && React.createElement("option", {
    value: ""
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19"), dates.slice().reverse().map(d => React.createElement("option", {
    key: d,
    value: d
  }, blDay(d)))), grid(dayPhotos.photos || [], "daily", p => day + "/" + p.id)), tab === "job" && grid(media.photos || [], "job", p => "job/" + p.id), tab === "up" && React.createElement("div", null, React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      borderRadius: 11,
      border: "1px dashed var(--border-strong)",
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 16,
    color: "var(--text-2)"
  }), busy ? "กำลังย่อรูป…" : "เลือกไฟล์รูป", React.createElement("input", {
    type: "file",
    accept: "image/*",
    multiple: true,
    onChange: onFiles,
    style: {
      display: "none"
    }
  })), err && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--tint-red-tx)",
      marginTop: 8
    }
  }, err)), React.createElement("div", {
    style: {
      marginTop: 16,
      borderTop: "1px solid var(--border)",
      paddingTop: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-2)",
      marginBottom: 8
    }
  }, "\u0E23\u0E39\u0E1B\u0E43\u0E19\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49 (", picked.length, ")"), picked.map(p => React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      marginBottom: 8
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: "",
    style: {
      width: 64,
      height: 48,
      objectFit: "cover",
      borderRadius: 8,
      border: "1px solid var(--border)"
    }
  }), React.createElement("input", {
    value: p.cap || "",
    onChange: e => api.setCap(p.id, e.target.value),
    placeholder: "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E23\u0E39\u0E1B (\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E01\u0E47\u0E44\u0E14\u0E49)",
    style: Object.assign({}, BL_INPUT(), {
      fontSize: 12.5,
      padding: "8px 10px"
    })
  }), React.createElement("button", {
    onClick: () => api.remove(p.id),
    style: {
      width: 32,
      height: 32,
      flexShrink: 0,
      borderRadius: 9,
      border: "1px solid var(--tint-red-bd)",
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx)",
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "var(--tint-red-tx)"
  })))), !picked.length && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B"))), React.createElement("div", {
    style: {
      padding: "12px 15px",
      borderTop: "1px solid var(--border)",
      textAlign: "right"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "10px 18px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27"))));
}
function BlRowDetail({
  job,
  row,
  onPatch,
  currentUser,
  readOnly
}) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  const [pick, setPick] = React.useState(false);
  const items = row.items || [];
  const setItem = (i, v) => onPatch({
    items: items.map((s, k) => k === i ? v : s)
  });
  const addItem = () => onPatch({
    items: items.concat([""])
  });
  const delItem = i => onPatch({
    items: items.filter((s, k) => k !== i)
  });
  React.useEffect(() => {
    const ids = api.photos.map(p => p.id);
    if (readOnly) return;
    if (ids.join(",") !== (row.photoIds || []).join(",")) onPatch({
      photoIds: ids
    });
  }, [api.photos.length]);
  return React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "var(--surface2)",
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07 (\u0E27\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49 = \u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19)"), React.createElement("input", {
    value: row.subject || "",
    disabled: readOnly,
    onChange: e => onPatch({
      subject: e.target.value
    }),
    placeholder: window.blSubjectOf(Object.assign({}, row, {
      subject: ""
    })),
    style: BL_INPUT()
  })), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E43\u0E19\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D 1, 2, 3 \u0E1A\u0E19\u0E43\u0E1A"), items.map((s, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      width: 20,
      flexShrink: 0,
      textAlign: "right",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-3)",
      paddingTop: 10
    }
  }, i + 1, "."), React.createElement("input", {
    value: s,
    disabled: readOnly,
    onChange: e => setItem(i, e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E40\u0E0B\u0E25\u0E25\u0E4C 550W \u0E08\u0E33\u0E19\u0E27\u0E19 120 \u0E41\u0E1C\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E2A\u0E23\u0E47\u0E08 100%",
    style: BL_INPUT()
  }), !readOnly && React.createElement("button", {
    onClick: () => delItem(i),
    style: {
      width: 38,
      flexShrink: 0,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "var(--text-3)"
  })))), !readOnly && React.createElement("button", {
    onClick: addItem,
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "none",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      flex: 2,
      minWidth: 190
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E39\u0E1B"), React.createElement("input", {
    value: row.cap || "",
    disabled: readOnly,
    onChange: e => onPatch({
      cap: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C 100%",
    style: BL_INPUT()
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 140
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: row.capDate || "",
    disabled: readOnly,
    onChange: e => onPatch({
      capDate: e.target.value
    }),
    style: BL_INPUT()
  }))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A (", api.photos.length, ")"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, api.photos.slice(0, 8).map(p => React.createElement("img", {
    key: p.id,
    src: p.dataUrl,
    alt: "",
    style: {
      width: 54,
      height: 42,
      objectFit: "cover",
      borderRadius: 7,
      border: "1px solid var(--border)"
    }
  })), api.photos.length > 8 && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "+", api.photos.length - 8), !readOnly && React.createElement("button", {
    onClick: () => setPick(true),
    style: {
      padding: "8px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B"))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E20\u0E32\u0E22\u0E43\u0E19 (\u0E44\u0E21\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23)"), React.createElement("input", {
    value: row.note || "",
    disabled: readOnly,
    onChange: e => onPatch({
      note: e.target.value
    }),
    style: BL_INPUT()
  })), !!(row.hist || []).length && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, row.hist.slice().reverse().map((h, i) => React.createElement("div", {
    key: i
  }, window.thDateTime ? window.thDateTime(h.at) : h.at, " \xB7 ", window.blStatusOf(h.to).th, h.byName ? " · " + h.byName : "", h.note ? " · " + h.note : "")))), pick && React.createElement(BlPhotoPick, {
    job: job,
    row: row,
    api: api,
    currentUser: currentUser,
    onClose: () => setPick(false)
  }));
}
function BlSetupModal({
  job,
  quotes,
  leads,
  role,
  currentUser,
  readOnly,
  focusRowId,
  onClose,
  onSaveBills
}) {
  const j = job || {};
  const ro = readOnly || !onSaveBills;
  const list = window.quotesOfJob(quotes, j, leads);
  const pick = window.blPickQuote(quotes, j, leads);
  const [bills, setBills] = React.useState(() => j.bills || window.blSeed(null, j, currentUser));
  const [qid, setQid] = React.useState(() => j.bills && j.bills.quoteId || (pick ? pick.id : ""));
  const [open, setOpen] = React.useState(focusRowId || null);
  const [msg, setMsg] = React.useState("");
  const [dirty, setDirty] = React.useState(false);
  const quote = list.find(q => q.id === qid) || null;
  const rows = bills.rows || [];
  const sum = window.blR2(rows.filter(window.blLive).reduce((a, r) => a + (+r.amount || 0), 0));
  const drift = quote && bills.sig && bills.sig !== window.blSig(quote);
  const put = fields => {
    setBills(b => Object.assign({}, b, fields));
    setDirty(true);
  };
  const putRow = (id, fields) => {
    setBills(b => Object.assign({}, b, {
      rows: (b.rows || []).map(r => r.id === id ? Object.assign({}, r, fields) : r)
    }));
    setDirty(true);
  };
  const setPct = (row, v) => {
    const pct = v === "" ? null : +v;
    const amt = pct != null && bills.grand ? window.blR2(bills.grand * pct / 100) : row.amount;
    putRow(row.id, {
      pct: pct,
      amount: amt
    });
  };
  const seed = () => {
    if (!quote) {
      setMsg("เลือกใบเสนอราคาก่อน");
      return;
    }
    const next = window.blReseed(bills, quote, j, currentUser);
    setBills(next);
    setDirty(true);
    setMsg(next.locked ? "ถอดงวดใหม่แล้ว — ข้ามงวดที่ออกเอกสารไปแล้ว " + next.locked + " งวด (ตัวเลขบนใบที่ส่งไปต้องไม่เปลี่ยน)" : "ถอดได้ " + (next.rows || []).length + " งวดจากเงื่อนไขการชำระเงิน" + (next.pctTotal !== 100 ? " · เงื่อนไขในใบรวมได้ " + next.pctTotal + "% ไม่ครบ 100%" : ""));
  };
  const addRow = () => {
    const n = rows.length ? Math.max.apply(null, rows.map(r => +r.n || 0)) + 1 : 1;
    setBills(b => Object.assign({}, b, {
      rows: (b.rows || []).concat([window.blBlankRow({
        n: n,
        line: "งวดที่ " + n + " · "
      })])
    }));
    setDirty(true);
  };
  const delRow = row => {
    if (window.blRowLocked(row)) return;
    setBills(b => Object.assign({}, b, {
      rows: (b.rows || []).filter(r => r.id !== row.id)
    }));
    setDirty(true);
  };
  const save = () => {
    if (!onSaveBills) return;
    onSaveBills(Object.assign({}, bills, {
      from: quote ? bills.from : "manual",
      quoteId: quote ? quote.id : "",
      quoteNo: quote ? quote.no || "" : "",
      grand: window.blR2(bills.grand),
      vatRate: +bills.vatRate || 0,
      kwp: +bills.kwp || 0
    }));
    setDirty(false);
    setMsg("บันทึกแล้ว");
  };
  const modeBtn = (id, label) => React.createElement("button", {
    onClick: () => {
      put({
        from: id
      });
      if (id === "manual") setQid("");else if (pick) setQid(pick.id);
    },
    disabled: ro,
    style: {
      padding: "8px 14px",
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: ro ? "default" : "pointer",
      border: "1px solid " + (bills.from === id ? BL_ACCENT : "var(--border-strong)"),
      background: bills.from === id ? BL_ACCENT + "18" : "var(--surface)",
      color: bills.from === id ? BL_ACCENT : "var(--text-2)"
    }
  }, label);
  const cell = {
    padding: "7px 8px",
    fontSize: 12.5,
    color: "var(--text-1)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "top"
  };
  const head = {
    padding: "7px 8px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "left",
    borderBottom: "1px solid var(--border-strong)",
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 180,
      background: "rgba(8,20,14,.5)",
      overflow: "auto",
      padding: "18px 12px"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: "0 auto",
      background: "var(--surface)",
      borderRadius: 14,
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: BL_ACCENT + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 17,
    color: BL_ACCENT
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19 \xB7 ", j.code || ""), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, j.name || "", ro ? " · ดูได้อย่างเดียว" : "")), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
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
      padding: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, modeBtn("quote", "จากใบเสนอราคา"), modeBtn("manual", "กรอกเอง")), bills.from !== "manual" ? React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, list.length ? React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    style: {
      flex: 2,
      minWidth: 240
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E16\u0E2D\u0E14\u0E07\u0E27\u0E14"), React.createElement("select", {
    value: qid,
    disabled: ro,
    onChange: e => setQid(e.target.value),
    style: BL_INPUT()
  }, list.map(q => {
    const T = window.quoteTotals(q);
    const s = (window.QUOTE_STATUS_BY || {})[q.status];
    return React.createElement("option", {
      key: q.id,
      value: q.id
    }, (q.no || q.id) + " · " + (window.thDate ? window.thDate(q.date, true) : "") + " · " + (s && s.th || q.status) + " · " + blMoney(T.grand));
  }))), quote && quote.status === "accepted" && React.createElement("span", {
    style: {
      padding: "6px 11px",
      borderRadius: 99,
      background: "var(--tint-ok-bg)",
      border: "1px solid var(--tint-ok-bd)",
      color: "var(--tint-ok-tx)",
      fontSize: 11.5,
      fontWeight: 700
    }
  }, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E15\u0E01\u0E25\u0E07\u0E41\u0E25\u0E49\u0E27"), !ro && React.createElement("button", {
    onClick: seed,
    style: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: BL_ACCENT,
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E14\u0E36\u0E07\u0E07\u0E27\u0E14\u0E08\u0E32\u0E01\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19")) : React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 11,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      lineHeight: 1.6
    }
  }, "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u2014 \u0E2A\u0E25\u0E31\u0E1A\u0E44\u0E1B \u201C\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u201D \u0E41\u0E25\u0E49\u0E27\u0E15\u0E31\u0E49\u0E07\u0E22\u0E2D\u0E14\u0E01\u0E31\u0E1A\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E07\u0E27\u0E14\u0E40\u0E2D\u0E07"), quote && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 6
    }
  }, "\u0E22\u0E2D\u0E14\u0E15\u0E32\u0E21\u0E43\u0E1A ", blMoney(window.quoteTotals(quote).grand), " \u0E1A\u0E32\u0E17 (\u0E23\u0E27\u0E21 VAT ", window.quoteTotals(quote).vatRate, "%)", (() => {
    const sp = window.quoteTermSplit(quote.terms, window.quoteTotals(quote).grand);
    return sp.pctTotal !== 100 ? React.createElement("span", {
      style: {
        color: "var(--tint-amber-tx)",
        fontWeight: 700
      }
    }, " \xB7 \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E43\u0E19\u0E43\u0E1A\u0E23\u0E27\u0E21\u0E44\u0E14\u0E49 ", sp.pctTotal, "% \u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A 100%") : null;
  })()), drift && React.createElement("div", {
    style: {
      marginTop: 8,
      padding: "10px 13px",
      borderRadius: 11,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      lineHeight: 1.6
    }
  }, "\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E16\u0E39\u0E01\u0E41\u0E01\u0E49\u0E2B\u0E25\u0E31\u0E07\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14 \u2014 \u0E01\u0E14 \u201C\u0E14\u0E36\u0E07\u0E07\u0E27\u0E14\u0E08\u0E32\u0E01\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E16\u0E2D\u0E14\u0E43\u0E2B\u0E21\u0E48 (\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A)")) : React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 160
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E31\u0E0D\u0E0D\u0E32 (\u0E23\u0E27\u0E21 VAT)"), React.createElement("input", {
    type: "number",
    value: bills.grand || "",
    disabled: ro,
    onChange: e => put({
      grand: +e.target.value || 0
    }),
    style: BL_INPUT()
  })), React.createElement("div", {
    style: {
      width: 96
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "VAT %"), React.createElement("input", {
    type: "number",
    value: bills.vatRate,
    disabled: ro,
    onChange: e => put({
      vatRate: +e.target.value || 0
    }),
    style: BL_INPUT()
  })), React.createElement("div", {
    style: {
      width: 110
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E02\u0E19\u0E32\u0E14 kWp"), React.createElement("input", {
    type: "number",
    value: bills.kwp || "",
    disabled: ro,
    onChange: e => put({
      kwp: +e.target.value || 0
    }),
    style: BL_INPUT()
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, "\u0E2D\u0E49\u0E32\u0E07\u0E16\u0E36\u0E07\u0E2A\u0E31\u0E0D\u0E0D\u0E32 / \u0E43\u0E1A\u0E2A\u0E31\u0E48\u0E07\u0E0B\u0E37\u0E49\u0E2D\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), React.createElement("input", {
    value: bills.ref || "",
    disabled: ro,
    onChange: e => put({
      ref: e.target.value
    }),
    style: BL_INPUT()
  }))), msg && React.createElement("div", {
    style: {
      marginBottom: 12,
      padding: "9px 12px",
      borderRadius: 10,
      background: "var(--tint-ok-bg)",
      border: "1px solid var(--tint-ok-bd)",
      color: "var(--tint-ok-tx)",
      fontSize: 12.5
    }
  }, msg), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 680
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, head, {
      width: 52
    })
  }, "\u0E07\u0E27\u0E14"), React.createElement("th", {
    style: head
  }, "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02"), React.createElement("th", {
    style: Object.assign({}, head, {
      width: 74
    })
  }, "%"), React.createElement("th", {
    style: Object.assign({}, head, {
      width: 128
    })
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), React.createElement("th", {
    style: Object.assign({}, head, {
      width: 142
    })
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"), React.createElement("th", {
    style: Object.assign({}, head, {
      width: 150
    })
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), React.createElement("th", {
    style: Object.assign({}, head, {
      width: 86
    })
  }))), React.createElement("tbody", null, rows.map(r => {
    const lock = window.blRowLocked(r);
    const dis = ro || lock;
    return React.createElement(React.Fragment, {
      key: r.id
    }, React.createElement("tr", {
      style: {
        background: r.status === "void" ? "var(--surface2)" : "transparent"
      }
    }, React.createElement("td", {
      style: Object.assign({}, cell, {
        fontWeight: 800
      })
    }, React.createElement("input", {
      type: "number",
      value: r.n,
      disabled: dis,
      onChange: e => putRow(r.id, {
        n: +e.target.value || 1
      }),
      style: Object.assign({}, BL_INPUT(), {
        padding: "6px 7px",
        fontSize: 12.5
      })
    })), React.createElement("td", {
      style: cell
    }, React.createElement("input", {
      value: r.line || "",
      disabled: dis,
      onChange: e => putRow(r.id, {
        line: e.target.value
      }),
      placeholder: "\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48 1 \xB7 \u0E21\u0E31\u0E14\u0E08\u0E33 30% \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E15\u0E01\u0E25\u0E07\u0E17\u0E33\u0E2A\u0E31\u0E0D\u0E0D\u0E32",
      style: Object.assign({}, BL_INPUT(), {
        padding: "6px 8px",
        fontSize: 12.5,
        textDecoration: r.status === "void" ? "line-through" : "none"
      })
    }), lock && React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginTop: 3
      }
    }, "\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E41\u0E01\u0E49\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49")), React.createElement("td", {
      style: cell
    }, React.createElement("input", {
      type: "number",
      value: r.pct == null ? "" : r.pct,
      disabled: dis,
      placeholder: "\u2014",
      onChange: e => setPct(r, e.target.value),
      style: Object.assign({}, BL_INPUT(), {
        padding: "6px 7px",
        fontSize: 12.5
      })
    })), React.createElement("td", {
      style: cell
    }, React.createElement("input", {
      type: "number",
      value: r.amount || 0,
      disabled: dis,
      onChange: e => putRow(r.id, {
        amount: +e.target.value || 0,
        pct: null
      }),
      style: Object.assign({}, BL_INPUT(), {
        padding: "6px 7px",
        fontSize: 12.5,
        fontFamily: "var(--mono)"
      })
    })), React.createElement("td", {
      style: cell
    }, React.createElement("input", {
      type: "date",
      value: r.due || "",
      disabled: ro,
      onChange: e => putRow(r.id, {
        due: e.target.value
      }),
      style: Object.assign({}, BL_INPUT(), {
        padding: "6px 7px",
        fontSize: 12.5
      })
    })), React.createElement("td", {
      style: cell
    }, React.createElement(BlPill, {
      row: r
    }), r.docNo ? React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginTop: 3,
        fontFamily: "var(--mono)"
      }
    }, r.docNo) : null, r.status === "void" && r.voidWhy ? React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--tint-red-tx)",
        marginTop: 2
      }
    }, r.voidWhy) : null), React.createElement("td", {
      style: Object.assign({}, cell, {
        whiteSpace: "nowrap"
      })
    }, React.createElement("button", {
      onClick: () => setOpen(open === r.id ? null : r.id),
      style: {
        padding: "6px 9px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, open === r.id ? "ย่อ" : "แก้ใบ"), !ro && !lock && React.createElement("button", {
      onClick: () => delRow(r),
      title: "\u0E25\u0E1A\u0E07\u0E27\u0E14\u0E19\u0E35\u0E49",
      style: {
        marginLeft: 4,
        padding: "6px 8px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-3)",
        cursor: "pointer"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13,
      color: "var(--text-3)"
    })))), open === r.id && React.createElement("tr", null, React.createElement("td", {
      colSpan: 7,
      style: {
        padding: 0
      }
    }, React.createElement(BlRowDetail, {
      job: j,
      row: r,
      currentUser: currentUser,
      readOnly: ro,
      onPatch: f => putRow(r.id, f)
    }))));
  }), !rows.length && React.createElement("tr", null, React.createElement("td", {
    colSpan: 7,
    style: Object.assign({}, cell, {
      color: "var(--text-3)",
      textAlign: "center",
      padding: 22
    })
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E27\u0E14 \u2014 ", bills.from === "manual" ? "กด “เพิ่มงวด”" : "กด “ดึงงวดจากเงื่อนไขการชำระเงิน”"))))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      padding: "10px 12px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface2)"
    }
  }, !ro && React.createElement("button", {
    onClick: addRow,
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "none",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E27\u0E14"), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E1C\u0E25\u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E07\u0E27\u0E14 ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)",
      color: "var(--text-1)"
    }
  }, blMoney(sum)), bills.grand ? React.createElement("span", null, " / \u0E22\u0E2D\u0E14\u0E15\u0E32\u0E21\u0E43\u0E1A ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, blMoney(bills.grand))) : null, bills.grand && Math.abs(sum - window.blR2(bills.grand)) > 0.01 ? React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700
    }
  }, " \xB7 \u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19 ", blMoney(window.blR2(bills.grand) - sum), " \u0E1A\u0E32\u0E17") : null)))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      padding: "12px 16px",
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "10px 16px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"), !ro && React.createElement("button", {
    onClick: save,
    disabled: !dirty,
    style: {
      padding: "10px 20px",
      borderRadius: 11,
      border: "none",
      background: dirty ? "var(--primary)" : "var(--surface3)",
      color: dirty ? "#fff" : "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: dirty ? "pointer" : "default"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function BlPrintHost({
  job,
  row,
  onClose
}) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  if (!job || !row) return null;
  return React.createElement(window.BlDeliveryPaper, {
    job: job,
    bill: job.bills || {},
    row: row,
    photos: api.photos,
    onClose: onClose
  });
}
function BillingView({
  jobs,
  quotes,
  leads,
  role,
  currentUser,
  onOpenJob,
  onSaveBills,
  onSetup
}) {
  const today = window.drToday ? window.drToday() : "";
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [onlyNew, setOnlyNew] = React.useState(false);
  const [print, setPrint] = React.useState(null);
  const ro = !onSaveBills;
  const withBills = (jobs || []).filter(j => window.blHas(j));
  const sums = {};
  withBills.forEach(j => {
    sums[j.id] = window.blSummary(j, today);
  });
  const tiles = (() => {
    let readyN = 0,
      readyB = 0,
      waitB = 0,
      monthPaid = 0,
      overdueN = 0;
    const ym = String(today).slice(0, 7);
    withBills.forEach(j => {
      window.blRows(j).filter(window.blLive).forEach(r => {
        if (r.status === "ready") {
          readyN++;
          readyB += +r.amount || 0;
        }
        if (window.blFlowIdx(r.status) >= window.blFlowIdx("billed") && r.status !== "paid") {
          waitB += (+r.amount || 0) - (+r.paidAmt || 0);
        }
        if (r.paidAt && String(r.paidAt).slice(0, 7) === ym) monthPaid += +r.paidAmt || 0;
        if (window.blOverdue(r, today)) overdueN++;
      });
    });
    return {
      readyN,
      readyB: window.blR2(readyB),
      waitB: window.blR2(waitB),
      monthPaid: window.blR2(monthPaid),
      overdueN
    };
  })();
  const kw = q.trim().toLowerCase();
  const rowHit = (j, r) => {
    if (filter === "overdue" && !window.blOverdue(r, today)) return false;
    if (filter !== "all" && filter !== "overdue" && r.status !== filter) return false;
    if (!kw) return true;
    return [j.code, j.name, r.docNo, r.line].filter(Boolean).join(" ").toLowerCase().indexOf(kw) >= 0;
  };
  const groups = withBills.map(j => ({
    job: j,
    rows: window.blRows(j).filter(r => rowHit(j, r)),
    S: sums[j.id]
  })).filter(g => g.rows.length).sort((a, b) => String(a.job.code || "").localeCompare(String(b.job.code || "")));
  const pendingSetup = (jobs || []).filter(j => !window.blHas(j) && (j.stage === "install" || j.stage === "done")).sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
  const move = (job, row, to) => {
    if (!onSaveBills) return;
    let opt = {};
    if (to === "void") {
      const why = window.prompt("ยกเลิกงวดที่ " + row.n + " เพราะอะไร (บันทึกไว้ในประวัติ)");
      if (why == null) return;
      opt.note = why;
    }
    if (to === "paid") {
      const ref = window.prompt("เลขอ้างอิงการโอน / เลขสลิป (ไม่มีก็เว้นว่าง)", row.payRef || "");
      if (ref == null) return;
      opt.ref = ref;
    }
    const next = window.blMove(row, to, currentUser, opt, job);
    onSaveBills(job.id, Object.assign({}, job.bills, {
      rows: window.blRows(job).map(r => r.id === row.id ? next : r)
    }));
  };
  const chip = (id, label) => React.createElement("button", {
    key: id,
    onClick: () => setFilter(id),
    style: {
      padding: "6px 12px",
      borderRadius: 99,
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid " + (filter === id ? BL_ACCENT : "var(--border-strong)"),
      background: filter === id ? BL_ACCENT + "18" : "var(--surface)",
      color: filter === id ? BL_ACCENT : "var(--text-2)"
    }
  }, label);
  const head = {
    padding: "7px 9px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "left",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap"
  };
  const cell = {
    padding: "8px 9px",
    fontSize: 12.5,
    color: "var(--text-1)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle"
  };
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement(window.EcStat, {
    label: "\u0E16\u0E36\u0E07\u0E07\u0E27\u0E14 \xB7 \u0E23\u0E2D\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25",
    value: tiles.readyN,
    unit: "\u0E07\u0E27\u0E14",
    color: "#F59E0B",
    hint: blMoney(tiles.readyB) + " บาท",
    on: filter === "ready",
    onClick: () => setFilter(filter === "ready" ? "all" : "ready")
  }), React.createElement(window.EcStat, {
    label: "\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E23\u0E2D\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19",
    value: blMoney(tiles.waitB),
    unit: "\u0E1A\u0E32\u0E17",
    color: "#3B82F6",
    on: filter === "billed",
    onClick: () => setFilter(filter === "billed" ? "all" : "billed")
  }), React.createElement(window.EcStat, {
    label: "\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E49\u0E27\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49",
    value: blMoney(tiles.monthPaid),
    unit: "\u0E1A\u0E32\u0E17",
    color: "#10B981"
  }), React.createElement(window.EcStat, {
    label: "\u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25",
    value: tiles.overdueN,
    unit: "\u0E07\u0E27\u0E14",
    color: "#EF4444",
    on: filter === "overdue",
    onClick: () => setFilter(filter === "overdue" ? "all" : "overdue")
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
      marginBottom: 14
    }
  }, React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19 \xB7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \xB7 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \xB7 \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02",
    style: Object.assign({}, BL_INPUT(), {
      maxWidth: 320
    })
  }), chip("all", "ทั้งหมด"), chip("ready", "รอวางบิล"), chip("billed", "วางบิลแล้ว"), chip("accepted", "รับมอบแล้ว"), chip("paid", "รับเงินแล้ว"), chip("overdue", "เลยกำหนด"), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5,
      color: "var(--text-2)",
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: onlyNew,
    onChange: e => setOnlyNew(e.target.checked)
  }), "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14")), !onlyNew && groups.map(g => {
    const j = g.job,
      S = g.S;
    return React.createElement("div", {
      key: j.id,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 13,
        overflow: "hidden",
        marginBottom: 12,
        background: "var(--surface)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "11px 13px",
        background: "var(--surface2)",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, j.code, " \xB7 ", j.name, +j.kw ? React.createElement("span", {
      style: {
        fontWeight: 600,
        color: "var(--text-3)"
      }
    }, " \xB7 ", j.kw, " kW") : null), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E2A\u0E31\u0E0D\u0E0D\u0E32 ", blMoney(S.grand || S.total), " \u0E1A\u0E32\u0E17 \xB7 \u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27 ", blMoney(S.collected), " \xB7 \u0E04\u0E49\u0E32\u0E07\u0E23\u0E31\u0E1A ", blMoney(S.outstanding), S.voided ? " · ยกเลิก " + S.voided + " งวด" : "")), React.createElement("div", {
      style: {
        width: 170,
        flexShrink: 0
      }
    }, React.createElement(BlRail, {
      rows: window.blRows(j),
      curId: S.cur ? S.cur.id : null
    })), onOpenJob && React.createElement("button", {
      onClick: () => onOpenJob(j.id),
      style: {
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E07\u0E32\u0E19"), onSetup && !ro && React.createElement("button", {
      onClick: () => onSetup(j),
      style: {
        padding: "8px 12px",
        borderRadius: 10,
        border: "none",
        background: BL_ACCENT,
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14 / \u0E41\u0E01\u0E49\u0E43\u0E1A")), React.createElement("div", {
      style: {
        overflowX: "auto"
      }
    }, React.createElement("table", {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: 860
      }
    }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
      style: Object.assign({}, head, {
        width: 46
      })
    }, "\u0E07\u0E27\u0E14"), React.createElement("th", {
      style: head
    }, "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 110,
        textAlign: "right"
      })
    }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 96
      })
    }, "\u0E01\u0E33\u0E2B\u0E19\u0E14"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 126
      })
    }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 96
      })
    }, "\u0E27\u0E32\u0E07\u0E1A\u0E34\u0E25"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 122,
        textAlign: "right"
      })
    }, "\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"), React.createElement("th", {
      style: Object.assign({}, head, {
        width: 132
      })
    }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), React.createElement("th", {
      style: head
    }))), React.createElement("tbody", null, g.rows.map(r => React.createElement("tr", {
      key: r.id,
      style: {
        background: window.blOverdue(r, today) ? "var(--tint-amber-bg)" : "transparent"
      }
    }, React.createElement("td", {
      style: Object.assign({}, cell, {
        fontWeight: 800
      })
    }, r.n), React.createElement("td", {
      style: Object.assign({}, cell, {
        textDecoration: r.status === "void" ? "line-through" : "none"
      })
    }, r.line || "—", r.status === "void" && r.voidWhy ? React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--tint-red-tx)"
      }
    }, r.voidWhy) : null), React.createElement("td", {
      style: Object.assign({}, cell, {
        textAlign: "right",
        fontFamily: "var(--mono)"
      })
    }, blMoney(r.amount)), React.createElement("td", {
      style: cell
    }, r.due ? blDay(r.due) : "—"), React.createElement("td", {
      style: Object.assign({}, cell, {
        fontFamily: "var(--mono)",
        fontSize: 11.5
      })
    }, r.docNo || "—"), React.createElement("td", {
      style: cell
    }, r.billedAt ? blDay(r.billedAt) : "—"), React.createElement("td", {
      style: Object.assign({}, cell, {
        textAlign: "right",
        fontFamily: "var(--mono)",
        fontSize: 11.5
      })
    }, +r.paidAmt ? blMoney(r.paidAmt) + (window.blR2(r.paidAmt) < window.blR2(r.amount) ? " / " + blMoney(r.amount) : "") : "—"), React.createElement("td", {
      style: cell
    }, React.createElement(BlPill, {
      row: r
    })), React.createElement("td", {
      style: Object.assign({}, cell, {
        whiteSpace: "nowrap"
      })
    }, React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap"
      }
    }, !ro && React.createElement(BlMoveBtns, {
      row: r,
      bills: j.bills,
      role: role,
      currentUser: currentUser,
      job: j,
      onMove: (row, to) => move(j, row, to),
      size: "sm"
    }), window.blFlowIdx(r.status) >= window.blFlowIdx("billed") && React.createElement("button", {
      onClick: () => setPrint({
        job: j,
        row: r
      }),
      style: {
        padding: "6px 10px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C")))))))));
  }), !onlyNew && !groups.length && React.createElement("div", {
    style: {
      padding: 26,
      textAlign: "center",
      fontSize: 13,
      color: "var(--text-3)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 13
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07"), !!pendingSetup.length && React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-2)",
      marginBottom: 8
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14 (", pendingSetup.length, ")"), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, pendingSetup.map(j => {
    const qt = window.blPickQuote(quotes, j, leads);
    return React.createElement("div", {
      key: j.id,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 13px",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, j.code, " \xB7 ", j.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: qt ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, qt ? "มีใบเสนอราคา " + (qt.no || "") + " · ดึงงวดได้เลย" : "ไม่มีใบเสนอราคา — ต้องกรอกงวดเอง")), onSetup && !ro && React.createElement("button", {
      onClick: () => onSetup(j),
      style: {
        padding: "8px 14px",
        borderRadius: 10,
        border: "none",
        background: BL_ACCENT,
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E15\u0E31\u0E49\u0E07\u0E07\u0E27\u0E14"));
  }))), print && React.createElement(BlPrintHost, {
    job: print.job,
    row: print.row,
    onClose: () => setPrint(null)
  }));
}
Object.assign(window, {
  BL_ACCENT,
  BlPill,
  BlRail,
  BlNote,
  BlMoveBtns,
  BlJobCard,
  BlPhotoPick,
  BlRowDetail,
  BlSetupModal,
  BlPrintHost,
  BillingView
});