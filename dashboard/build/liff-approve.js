const LN_AP_KIND = [{
  key: "daily",
  th: "รายงาน",
  icon: "pen",
  color: "#0EA5E9"
}, {
  key: "ec",
  th: "เบิกเงิน",
  icon: "wallet",
  color: "#8B5CF6"
}, {
  key: "ot",
  th: "โอที",
  icon: "clock",
  color: "#6366F1"
}];
const LN_AP_KIND_BY = {};
LN_AP_KIND.forEach(k => {
  LN_AP_KIND_BY[k.key] = k;
});
function lnCanApproveAny(role, jobs, me) {
  if (window.ecCanApprove(role) || window.tmCanOtApprove(role)) return true;
  if (window.hasRole(role, "admin")) return true;
  const uid = (me || {}).id || "";
  return !!uid && (jobs || []).some(j => j && j.eeId === uid);
}
const LN_AP_SHEET = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  background: "var(--bg)",
  overflowY: "auto",
  overflowX: "hidden"
};
const LN_AP_NOTE = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none",
  resize: "vertical",
  lineHeight: 1.6
};
function LnApRows({
  rows
}) {
  const use = (rows || []).filter(r => r[1] != null && r[1] !== "");
  if (!use.length) return null;
  return React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden"
    }
  }, use.map((r, i) => React.createElement("div", {
    key: r[0],
    style: {
      display: "flex",
      gap: 10,
      padding: "10px 13px",
      borderTop: i ? "1px solid var(--border)" : "none",
      background: i % 2 ? "var(--surface2)" : "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      flex: "0 0 104px",
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, r[0]), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: "var(--text-1)",
      lineHeight: 1.6,
      wordBreak: "break-word"
    }
  }, r[1]))));
}
function LnApHead({
  kind,
  no,
  title,
  sub,
  onClose
}) {
  const k = LN_AP_KIND_BY[kind] || LN_AP_KIND[0];
  return React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "13px 16px",
      paddingTop: "calc(13px + env(safe-area-inset-top, 0px))",
      display: "flex",
      gap: 11,
      alignItems: "flex-start"
    }
  }, React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 99,
      display: "grid",
      placeItems: "center",
      background: k.color + "1F"
    }
  }, React.createElement(Icon, {
    name: k.icon,
    size: 16,
    color: k.color
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, no && React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, no), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), sub && React.createElement("div", {
    style: {
      marginTop: 2,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, sub)), React.createElement("button", {
    onClick: onClose,
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 99,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 16,
      cursor: "pointer",
      lineHeight: "30px",
      padding: 0
    }
  }, "\xD7"));
}
function LnApDecide({
  okText,
  noText,
  hint,
  onOk,
  onNo,
  busy
}) {
  const [noting, setNoting] = React.useState(false);
  const [note, setNote] = React.useState("");
  if (noting) {
    return React.createElement("div", {
      style: {
        display: "grid",
        gap: 8,
        marginTop: 14
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 800,
        color: "var(--text-3)"
      }
    }, "\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E2D\u0E30\u0E44\u0E23 / \u0E17\u0E33\u0E44\u0E21\u0E16\u0E36\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("textarea", {
      value: note,
      onChange: e => setNote(e.target.value),
      rows: 3,
      placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E22\u0E2D\u0E14\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E1A\u0E34\u0E25 \xB7 \u0E02\u0E2D\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21 \xB7 \u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E43\u0E1A\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32",
      style: LN_AP_NOTE
    }), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, React.createElement("button", {
      onClick: () => {
        setNoting(false);
        setNote("");
      },
      style: {
        flex: 1,
        padding: "13px 14px",
        borderRadius: 11,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 13.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("button", {
      onClick: () => onNo(note.trim()),
      disabled: !note.trim() || busy,
      style: {
        flex: 2,
        padding: "13px 14px",
        borderRadius: 11,
        border: "none",
        background: note.trim() ? "#EF4444" : "var(--border-strong)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13.5,
        fontWeight: 800,
        cursor: note.trim() ? "pointer" : "default"
      }
    }, noText)), !note.trim() && React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        lineHeight: 1.6
      }
    }, "\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E02\u0E35\u0E22\u0E19\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E43\u0E1A\u0E04\u0E37\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E39\u0E49\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E2D\u0E30\u0E44\u0E23 \u0E44\u0E21\u0E48\u0E07\u0E31\u0E49\u0E19\u0E08\u0E30\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21"));
  }
  return React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    onClick: () => setNoting(true),
    disabled: busy,
    style: {
      flex: 1,
      padding: "14px 14px",
      borderRadius: 12,
      border: "1px solid #EF4444",
      background: "var(--surface)",
      color: "#EF4444",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, noText), React.createElement("button", {
    onClick: onOk,
    disabled: busy,
    style: {
      flex: 2,
      padding: "14px 14px",
      borderRadius: 12,
      border: "none",
      background: "#10B981",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, busy ? "กำลังบันทึก…" : okText)), hint && React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.6
    }
  }, hint));
}
function LnApprDrSheet({
  me,
  role,
  job,
  date,
  rec,
  notify,
  onClose
}) {
  const store = window.useDailyReports(job.id);
  const photos = window.useDailyPhotos(job.id, date);
  const sigs = window.useDailySigns(job.id, date);
  const mine = window.useDrMySign((me || {}).id || null);
  const [busy, setBusy] = React.useState(false);
  const [pad, setPad] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [zoom, setZoom] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const cur = (store.byDate || {})[date] || rec;
  const done = cur.status !== "sent";
  const doApprove = img => {
    setBusy(true);
    if (img) sigs.sign("app", img, me);
    store.patch(date, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      appId: (me || {}).id || null,
      appName: (me || {}).name || ""
    });
    setBusy(false);
    setMsg("อนุมัติแล้ว");
  };
  const approve = () => {
    if (sigs.signs.app && sigs.signs.app.img) return doApprove(null);
    if (mine.sign && mine.sign.img) return doApprove(mine.sign.img);
    setPad(true);
  };
  const back = note => {
    setBusy(true);
    store.patch(date, {
      status: "draft",
      approvedAt: null,
      appId: null,
      appName: null,
      backNote: note,
      backAt: new Date().toISOString(),
      backById: (me || {}).id || null,
      backByName: (me || {}).name || ""
    });
    if (notify && cur.byId && cur.byId !== ((me || {}).id || "")) {
      notify({
        toUserId: cur.byId,
        type: "daily",
        event: "back",
        jobId: job.id,
        jobName: job.name,
        title: "รายงานประจำวันถูกตีกลับ ต้องแก้ไข",
        body: [job.code, window.drDateTH(date), note].filter(Boolean).join(" · ")
      });
    }
    setBusy(false);
    setMsg("ตีกลับให้แก้แล้ว");
  };
  const st = window.drStatusOf(cur.status);
  return React.createElement("div", {
    style: LN_AP_SHEET
  }, React.createElement(LnApHead, {
    kind: "daily",
    no: window.drDocNo(job, date, store.dates),
    title: job.code + " · " + (job.name || ""),
    sub: window.drDateTH(date, true),
    onClose: onClose
  }), React.createElement("div", {
    style: {
      padding: 16,
      display: "grid",
      gap: 13
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 99,
      background: st.color + "1A",
      color: st.color,
      fontSize: 11,
      fontWeight: 800
    }
  }, st.th), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", cur.byName || "—")), React.createElement(LnApRows, {
    rows: [["วันนี้ทำอะไร", cur.work], ["ความคืบหน้า", cur.pct != null && cur.pct !== "" ? cur.pct + "%" : ""], ["ปัญหา/อุปสรรค", cur.problem], ["พรุ่งนี้จะทำ", cur.nextDay], ["ทีมหน้างาน", cur.team]]
  }), photos.photos.length > 0 && React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 ", photos.photos.length, " \u0E23\u0E39\u0E1B"), photos.photos.map(p => React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "flex-start"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: "",
    onClick: () => setZoom(p.dataUrl),
    style: {
      width: 84,
      height: 84,
      objectFit: "cover",
      borderRadius: 10,
      border: "1px solid var(--border)",
      flexShrink: 0
    }
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12.5,
      lineHeight: 1.6,
      color: p.cap ? "var(--text-1)" : "var(--text-3)"
    }
  }, p.cap || "ไม่ได้เขียนคำอธิบายไว้")))), sigs.signs.by && sigs.signs.by.img && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "11px 13px",
      borderRadius: 12,
      border: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("img", {
    src: sigs.signs.by.img,
    alt: "",
    style: {
      height: 34,
      maxWidth: 130,
      objectFit: "contain"
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", sigs.signs.by.name || "", React.createElement("br", null), window.drDateTH(window.drSignDay(sigs.signs.by)), " ", window.drSignTime(sigs.signs.by))), msg ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: "center"
    }
  }, msg) : done ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--surface2)",
      color: "var(--text-3)",
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 1.6
    }
  }, "\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2D\u0E32\u0E08\u0E21\u0E35\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19") : React.createElement(LnApDecide, {
    okText: "\u0E40\u0E0B\u0E47\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E19\u0E35\u0E49",
    noText: "\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E49",
    busy: busy,
    hint: mine.sign && mine.sign.img ? "ระบบจะเซ็นด้วยลายเซ็นที่คุณบันทึกไว้" : "กดแล้วจะให้เซ็นก่อนหนึ่งครั้ง",
    onOk: approve,
    onNo: back
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))"
    }
  }, msg ? "กลับไปรายการ" : "ปิด")), pad && window.DrSignPad && React.createElement(window.DrSignPad, {
    title: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    hint: "\u0E40\u0E0B\u0E47\u0E19\u0E41\u0E25\u0E49\u0E27\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E25\u0E47\u0E2D\u0E01\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35",
    saved: mine.sign,
    onClose: () => setPad(false),
    remember: remember,
    onRemember: setRemember,
    onSave: img => {
      if (remember) mine.save(img);
      setPad(false);
      doApprove(img);
    }
  }), zoom && React.createElement("div", {
    onClick: () => setZoom(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 70,
      background: "rgba(0,0,0,.92)",
      display: "grid",
      placeItems: "center",
      padding: 14,
      cursor: "zoom-out"
    }
  }, React.createElement("img", {
    src: zoom,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain"
    }
  })));
}
function LnApPdf({
  shot
}) {
  const url = React.useMemo(() => {
    try {
      return window.dataUrlToBlobUrl(shot.dataUrl);
    } catch (e) {
      return shot.dataUrl;
    }
  }, [shot.dataUrl]);
  return React.createElement("a", {
    href: url,
    target: "_blank",
    rel: "noopener",
    style: {
      width: 96,
      height: 96,
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      display: "grid",
      placeItems: "center",
      gap: 4,
      textDecoration: "none",
      color: "var(--text-2)",
      fontSize: 10.5,
      fontWeight: 700,
      textAlign: "center",
      padding: 6
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 20,
    color: "var(--text-3)"
  }), React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "100%"
    }
  }, shot.name || "บิล PDF"));
}
function LnApprEcSheet({
  me,
  role,
  claim,
  store,
  onClose
}) {
  const rec = window.useEcReceipts(claim.id);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const cur = (store.claims || []).find(c => c.id === claim.id) || claim;
  const done = cur.status !== "sent";
  const chk = window.ecApproveCheck(cur, me, role);
  const move = (to, note) => {
    setBusy(true);
    const next = window.ecMove(cur, to, me, note || "");
    store.save(next);
    if (cur.byId && cur.byId !== ((me || {}).id || "")) {
      window.ecNotify({
        toUserId: cur.byId,
        title: (to === "approved" ? "ใบเบิกได้รับอนุมัติ · " : "ใบเบิกไม่อนุมัติ · ") + (cur.no || ""),
        body: [window.ecBaht(cur.amount) + " บาท", note || ""].filter(Boolean).join(" · ")
      });
    }
    setBusy(false);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };
  const st = window.ecStatusOf(cur.status);
  return React.createElement("div", {
    style: LN_AP_SHEET
  }, React.createElement(LnApHead, {
    kind: "ec",
    no: cur.no,
    title: window.ecKindOf(cur.kind).th + " · " + window.ecBaht(cur.amount) + " บาท",
    sub: (cur.byName || "") + " · " + window.drDateTH(cur.date),
    onClose: onClose
  }), React.createElement("div", {
    style: {
      padding: 16,
      display: "grid",
      gap: 13
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 99,
      background: st.color + "1A",
      color: st.color,
      fontSize: 11,
      fontWeight: 800
    }
  }, st.th), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, window.ecPayOf(cur.payMethod).th)), React.createElement(LnApRows, {
    rows: [["งาน/ไซต์", [cur.siteCode, cur.siteName].filter(Boolean).join(" · ")], ["เหตุผล", cur.note], ["ส่งถึง", cur.approverName]]
  }), (cur.items || []).length > 0 && React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, (cur.items || []).map((it, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      padding: "10px 13px",
      borderTop: i ? "1px solid var(--border)" : "none"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: "var(--text-1)",
      wordBreak: "break-word"
    }
  }, it.name || "—"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, window.ecBaht(it.amount))))), React.createElement("div", {
    style: {
      display: "grid",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E34\u0E25\u0E41\u0E19\u0E1A ", rec.shots.length, " \u0E43\u0E1A"), rec.shots.length === 0 ? React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 11,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)",
      fontSize: 12,
      lineHeight: 1.6
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E34\u0E25\u0E41\u0E19\u0E1A\u0E21\u0E32\u0E14\u0E49\u0E27\u0E22 \u2014 \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49 \u0E41\u0E15\u0E48\u0E08\u0E30\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E2D\u0E14\u0E19\u0E35\u0E49\u0E15\u0E2D\u0E19\u0E1B\u0E34\u0E14\u0E1A\u0E31\u0E0D\u0E0A\u0E35") : React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, rec.shots.map((sh, i) => window.ecReceiptKind(sh) === "pdf" ? React.createElement(LnApPdf, {
    key: i,
    shot: sh
  }) : React.createElement("img", {
    key: i,
    src: sh.dataUrl,
    alt: "",
    onClick: () => setZoom(sh.dataUrl),
    style: {
      width: 96,
      height: 96,
      objectFit: "cover",
      borderRadius: 10,
      border: "1px solid var(--border)"
    }
  })))), msg ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: "center"
    }
  }, msg) : done ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--surface2)",
      color: "var(--text-3)",
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 1.6
    }
  }, "\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2D\u0E32\u0E08\u0E21\u0E35\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19") : !chk.ok ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 1.6
    }
  }, chk.why) : React.createElement(LnApDecide, {
    okText: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E19\u0E35\u0E49",
    noText: "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    busy: busy,
    onOk: () => move("approved", ""),
    onNo: note => move("rejected", note)
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))"
    }
  }, msg ? "กลับไปรายการ" : "ปิด")), zoom && React.createElement("div", {
    onClick: () => setZoom(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 70,
      background: "rgba(0,0,0,.92)",
      display: "grid",
      placeItems: "center",
      padding: 14,
      cursor: "zoom-out"
    }
  }, React.createElement("img", {
    src: zoom,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain"
    }
  })));
}
function LnApprOtSheet({
  me,
  role,
  rec,
  store,
  onClose
}) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const cur = (store.rows || []).find(r => r.id === rec.id) || rec;
  const done = cur.status !== "sent";
  const chk = window.tmOtApproveCheck(cur, me, role);
  const move = (to, note) => {
    setBusy(true);
    const next = window.tmOtMove(cur, to, me, note || "");
    store.save(next);
    if (cur.userId && cur.userId !== ((me || {}).id || "")) {
      window.tmNotify({
        toUserId: cur.userId,
        title: (to === "approved" ? "ใบขอ OT ได้รับอนุมัติ · " : to === "rejected" ? "ใบขอ OT ไม่อนุมัติ · " : "ใบขอ OT ถูกตีกลับ · ") + (cur.no || ""),
        body: [window.drDateTH(cur.date), window.tmDur(cur.mins), note || ""].filter(Boolean).join(" · ")
      });
    }
    setBusy(false);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };
  const st = window.tmOtStatusOf(cur.status);
  const kind = window.tmOtKindOf(cur.kind) || {};
  return React.createElement("div", {
    style: LN_AP_SHEET
  }, React.createElement(LnApHead, {
    kind: "ot",
    no: cur.no,
    title: (cur.userName || "") + " · " + window.tmDur(cur.mins),
    sub: window.drDateTH(cur.date, true),
    onClose: onClose
  }), React.createElement("div", {
    style: {
      padding: 16,
      display: "grid",
      gap: 13
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 99,
      background: st.color + "1A",
      color: st.color,
      fontSize: 11,
      fontWeight: 800
    }
  }, st.th), kind.th && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, kind.th)), React.createElement(LnApRows, {
    rows: [["ช่วงเวลา", (cur.from || "") + " – " + (cur.to || "")], ["รวม", window.tmDur(cur.mins)], ["งาน", [cur.jobCode, cur.jobName].filter(Boolean).join(" · ")], ["เหตุผล", cur.reason], ["ส่งถึง", cur.approverName]]
  }), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 11,
      background: "var(--surface2)",
      color: "var(--text-3)",
      fontSize: 11.5,
      lineHeight: 1.7
    }
  }, "\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E02\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E1A\u0E44\u0E14\u0E49", React.createElement("br", null), "\u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E41\u0E19\u0E48\u0E43\u0E08 \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E41\u0E1C\u0E48\u0E19\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19\u0E1A\u0E19\u0E40\u0E27\u0E47\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), msg ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: "center"
    }
  }, msg) : done ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--surface2)",
      color: "var(--text-3)",
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 1.6
    }
  }, "\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2D\u0E32\u0E08\u0E21\u0E35\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19") : !chk.ok ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 1.6
    }
  }, chk.why) : React.createElement(LnApDecide, {
    okText: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E19\u0E35\u0E49",
    noText: "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    busy: busy,
    onOk: () => move("approved", ""),
    onNo: note => move("rejected", note)
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))"
    }
  }, msg ? "กลับไปรายการ" : "ปิด")));
}
function LnApproveTab({
  me,
  role,
  jobs,
  notify
}) {
  const drAll = window.useDailyAll();
  const ecStore = window.useEcClaims();
  const otStore = window.useOtClaims();
  const [kind, setKind] = React.useState("daily");
  const [open, setOpen] = React.useState(null);
  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach(j => {
      if (j && j.id) m[j.id] = j;
    });
    return m;
  }, [jobs]);
  const drList = React.useMemo(() => {
    const out = [];
    Object.keys(drAll.all || {}).forEach(jid => {
      const job = jobById[jid];
      if (!job) return;
      const byDate = drAll.all[jid] || {};
      Object.keys(byDate).forEach(d => {
        const r = byDate[d];
        if (!r || r.status !== "sent") return;
        if (!window.drCanApprove(role, job, me, r)) return;
        out.push({
          job: job,
          date: d,
          rec: r
        });
      });
    });
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [drAll.all, jobById, role, me]);
  const ecList = React.useMemo(() => (ecStore.claims || []).filter(c => c && c.status === "sent" && window.ecApproveCheck(c, me, role).ok), [ecStore.claims, me, role]);
  const otList = React.useMemo(() => (otStore.rows || []).filter(r => r && r.status === "sent" && window.tmOtApproveCheck(r, me, role).ok), [otStore.rows, me, role]);
  const n = {
    daily: drList.length,
    ec: ecList.length,
    ot: otList.length
  };
  const chips = LN_AP_KIND.map(k => ({
    key: k.key,
    th: k.th + (n[k.key] ? " " + n[k.key] : "")
  }));
  const loading = drAll.loading || ecStore.loading || otStore.loading;
  const jumped = React.useRef(false);
  React.useEffect(() => {
    if (jumped.current || loading) return;
    jumped.current = true;
    const first = LN_AP_KIND.filter(k => n[k.key] > 0)[0];
    if (first) setKind(first.key);
  }, [loading, n.daily, n.ec, n.ot]);
  const row = (key, title, sub, right, onClick) => {
    const k = LN_AP_KIND_BY[kind];
    return React.createElement("div", {
      key: key,
      onClick: onClick,
      style: {
        display: "flex",
        gap: 11,
        alignItems: "center",
        padding: "13px 16px",
        cursor: "pointer",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: 99,
        display: "grid",
        placeItems: "center",
        background: k.color + "1F"
      }
    }, React.createElement(Icon, {
      name: k.icon,
      size: 16,
      color: k.color
    })), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, title), React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 12,
        color: "var(--text-3)"
      }
    }, sub)), right && React.createElement("div", {
      style: {
        flexShrink: 0,
        fontFamily: "var(--mono)",
        fontSize: 13.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, right));
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "12px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement(window.LnPick, {
    items: chips,
    value: kind,
    onPick: setKind
  }), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E2D\u0E04\u0E38\u0E13\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19 \xB7 \u0E23\u0E27\u0E21 ", n.daily + n.ec + n.ot, " \u0E43\u0E1A")), loading ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : kind === "daily" ? drList.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5,
      lineHeight: 1.7
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\u0E43\u0E1A\u0E08\u0E30\u0E21\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E32\u0E07\u0E01\u0E14\u0E2A\u0E48\u0E07\u0E43\u0E19\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A")) : drList.map(x => row(x.job.id + "/" + x.date, x.job.code + " · " + (x.job.name || ""), window.drDateTH(x.date) + " · โดย " + (x.rec.byName || "—"), x.rec.pct != null ? x.rec.pct + "%" : "", () => setOpen({
    kind: "daily",
    job: x.job,
    date: x.date,
    rec: x.rec
  }))) : kind === "ec" ? ecList.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") : ecList.map(c => row(c.id, window.ecKindOf(c.kind).th + " · " + (c.byName || ""), window.drShort(c.date) + (c.siteCode ? " · " + c.siteCode : "") + (c.receiptCount ? " · บิล " + c.receiptCount + " ใบ" : " · ไม่มีบิล"), window.ecBaht(c.amount), () => setOpen({
    kind: "ec",
    claim: c
  }))) : otList.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E02\u0E2D OT \u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34") : otList.map(r => row(r.id, (r.userName || "") + " · " + window.tmDur(r.mins), window.drShort(r.date) + " · " + (r.from || "") + "–" + (r.to || "") + (r.reason ? " · " + r.reason : ""), "", () => setOpen({
    kind: "ot",
    rec: r
  }))), open && open.kind === "daily" && React.createElement(LnApprDrSheet, {
    me: me,
    role: role,
    job: open.job,
    date: open.date,
    rec: open.rec,
    notify: notify,
    onClose: () => setOpen(null)
  }), open && open.kind === "ec" && React.createElement(LnApprEcSheet, {
    me: me,
    role: role,
    claim: open.claim,
    store: ecStore,
    onClose: () => setOpen(null)
  }), open && open.kind === "ot" && React.createElement(LnApprOtSheet, {
    me: me,
    role: role,
    rec: open.rec,
    store: otStore,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LN_AP_KIND,
  LN_AP_KIND_BY,
  lnCanApproveAny,
  LnApproveTab,
  LnApprDrSheet,
  LnApprEcSheet,
  LnApprOtSheet,
  LnApDecide,
  LnApRows,
  LnApHead,
  LnApPdf
});