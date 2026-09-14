const _RFFB = () => window.FBDB || null;
const _rfRef = p => window.FBDB.ref(p);
const RF_RESULTS = [{
  key: "approved",
  en: "Approved",
  th: "อนุมัติ",
  color: "#16A34A"
}, {
  key: "rectified",
  en: "Rectified",
  th: "แก้ไข",
  color: "#F59E0B"
}, {
  key: "rejected",
  en: "Rejected",
  th: "ไม่ผ่าน",
  color: "#EF4444"
}, {
  key: "others",
  en: "Others",
  th: "อื่น ๆ",
  color: "#64748B"
}];
const RF_RESULT_BY = {};
RF_RESULTS.forEach(r => {
  RF_RESULT_BY[r.key] = r;
});
function rfBlank(job) {
  const j = job || {};
  const B = window.BRANDING || {};
  return {
    to: "",
    project: j.name || "",
    contractor: B.legal || "",
    reqDate: new Date().toISOString().slice(0, 10),
    reqItems: "ตรวจรับมอบพื้นที่หลังคาก่อนเริ่มงานติดตั้ง (Roof handover before installation)",
    inspAt: "",
    refIr: "",
    others: "",
    reqBy: "",
    result: "",
    resultOther: "",
    note: "",
    issueBy: "",
    inspectedBy: "",
    approvedBy: "",
    clientBy: ""
  };
}
function useRoofHandover(jobId) {
  const [rec, setRec] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId || !_RFFB()) {
      setRec(null);
      setLoading(false);
      return;
    }
    const ref = _rfRef("roofHandover/" + jobId);
    const h = ref.on("value", s => {
      setRec(s.val() || null);
      setLoading(false);
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const save = React.useCallback((patch, user) => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofHandover/" + jobId).update(Object.assign({}, patch, {
      updatedAt: new Date().toISOString(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || ""
    }));
  }, [jobId]);
  return {
    rec: rec,
    loading: loading,
    save: save
  };
}
function useRoofPhotos(jobId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !_RFFB()) {
      setPhotos([]);
      return;
    }
    const ref = _rfRef("roofPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const add = React.useCallback((dataUrl, user) => {
    if (!jobId || !_RFFB()) return;
    const id = "RFP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _rfRef("roofPhotos/" + jobId + "/" + id).set({
      id: id,
      dataUrl: dataUrl,
      cap: "",
      at: new Date().toISOString(),
      by: (user || {}).id || null,
      byName: (user || {}).name || ""
    });
  }, [jobId]);
  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofPhotos/" + jobId + "/" + id).update({
      cap: cap || ""
    });
  }, [jobId]);
  const remove = React.useCallback(id => {
    if (!jobId || !_RFFB()) return;
    _rfRef("roofPhotos/" + jobId + "/" + id).remove();
  }, [jobId]);
  return {
    photos: photos,
    add: add,
    setCap: setCap,
    remove: remove
  };
}
function rfSummary(rec, photoCount) {
  if (!rec) return {
    state: "none",
    label: "ยังไม่ได้ทำใบส่งมอบหลังคา",
    color: "var(--text-3)"
  };
  const r = RF_RESULT_BY[rec.result];
  if (!r) return {
    state: "draft",
    label: "กรอกไว้แล้ว · ยังไม่สรุปผลการตรวจ" + (photoCount ? " · " + photoCount + " รูป" : ""),
    color: "#F59E0B"
  };
  return {
    state: rec.result,
    label: "ผลตรวจ: " + r.th + (photoCount ? " · " + photoCount + " รูป" : ""),
    color: r.color
  };
}
function RfField({
  label,
  thai,
  wide,
  lbl,
  sub,
  children
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      gridColumn: wide ? "1 / -1" : "auto",
      minWidth: 0
    }
  }, React.createElement("label", {
    style: lbl
  }, label, " ", React.createElement("span", {
    style: sub
  }, "(", thai, ")")), children);
}
function RoofHandoverModal({
  job,
  currentUser,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = useRoofHandover(job ? job.id : null);
  const photos = useRoofPhotos(job ? job.id : null);
  const [f, setF] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    if (store.loading || f) return;
    setF(Object.assign(rfBlank(job), store.rec || {}));
  }, [store.loading, store.rec, f, job]);
  if (!job) return null;
  const set = (k, v) => {
    setF(p => Object.assign({}, p, {
      [k]: v
    }));
    setSaved(false);
  };
  const doSave = () => {
    store.save(f, currentUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const lbl = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  const sub = {
    fontSize: 10.5,
    color: "var(--text-3)",
    fontWeight: 500,
    textTransform: "none",
    letterSpacing: 0
  };
  const inp = Object.assign({}, inputStyle, {
    padding: "9px 11px",
    fontSize: 13
  });
  if (!f) {
    return React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,20,14,.45)",
        zIndex: 130,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontSize: 13
      }
    }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026");
  }
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 130,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(860px,100%)",
      maxHeight: isMobile ? "94dvh" : "92vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: "#0EA5E91c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "list",
    size: 17,
    color: "#0284C7"
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
  }, "\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (Roof Handover)"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.code, " \xB7 ", job.name)), React.createElement("button", {
    onClick: onClose,
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 16,
      lineHeight: 1
    }
  }, "\xD7")), React.createElement("div", {
    style: {
      padding: 16,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "To",
    thai: "\u0E40\u0E23\u0E35\u0E22\u0E19"
  }, React.createElement("input", {
    value: f.to,
    onChange: e => set("to", e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A / \u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23",
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Project Name",
    thai: "\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23"
  }, React.createElement("input", {
    value: f.project,
    onChange: e => set("project", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Contractor",
    thai: "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32"
  }, React.createElement("input", {
    value: f.contractor,
    onChange: e => set("contractor", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Request Date",
    thai: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D"
  }, React.createElement("input", {
    type: "date",
    value: f.reqDate,
    onChange: e => set("reqDate", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Request to inspect",
    thai: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
    wide: true
  }, React.createElement("textarea", {
    value: f.reqItems,
    onChange: e => set("reqItems", e.target.value),
    rows: 2,
    style: Object.assign({}, inp, {
      resize: "vertical",
      lineHeight: 1.5
    })
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Inspection Date and Time",
    thai: "\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A"
  }, React.createElement("input", {
    type: "datetime-local",
    value: f.inspAt,
    onChange: e => set("inspAt", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Ref IR No.",
    thai: "\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E08\u0E32\u0E01 IR \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"
  }, React.createElement("input", {
    value: f.refIr,
    onChange: e => set("refIr", e.target.value),
    placeholder: "\u0E16\u0E49\u0E32\u0E21\u0E35",
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Request by",
    thai: "\u0E02\u0E2D\u0E42\u0E14\u0E22"
  }, React.createElement("input", {
    value: f.reqBy,
    onChange: e => set("reqBy", e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E02\u0E2D\u0E15\u0E23\u0E27\u0E08",
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Others",
    thai: "\u0E2D\u0E37\u0E48\u0E19 \u0E46"
  }, React.createElement("input", {
    value: f.others,
    onChange: e => set("others", e.target.value),
    style: inp
  }))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("label", {
    style: lbl
  }, "The result of inspection ", React.createElement("span", {
    style: sub
  }, "(\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A)")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, RF_RESULTS.map(r => {
    const on = f.result === r.key;
    return React.createElement("button", {
      key: r.key,
      type: "button",
      onClick: () => set("result", on ? "" : r.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 14px",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        border: "1px solid " + (on ? r.color : "var(--border-strong)"),
        background: on ? r.color + "16" : "var(--surface)",
        color: on ? r.color : "var(--text-2)"
      }
    }, React.createElement("span", {
      style: {
        width: 13,
        height: 13,
        borderRadius: 4,
        flexShrink: 0,
        border: "1.5px solid " + (on ? r.color : "var(--border-strong)"),
        background: on ? r.color : "transparent"
      }
    }), r.en, " (", r.th, ")");
  })), f.result === "others" && React.createElement("input", {
    value: f.resultOther,
    onChange: e => set("resultOther", e.target.value),
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08",
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Note",
    thai: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    wide: true
  }, React.createElement("textarea", {
    value: f.note,
    onChange: e => set("note", e.target.value),
    rows: 3,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \"\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E42\u0E0B\u0E19 B \u0E21\u0E35\u0E23\u0E2D\u0E22\u0E23\u0E31\u0E48\u0E27\u0E40\u0E14\u0E34\u0E21 2 \u0E08\u0E38\u0E14 \u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27\"",
    style: Object.assign({}, inp, {
      resize: "vertical",
      lineHeight: 1.5
    })
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21\u0E17\u0E49\u0E32\u0E22\u0E43\u0E1A ", React.createElement("span", {
    style: sub
  }, "(\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2D\u0E2D\u0E01\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E0B\u0E47\u0E19\u0E2A\u0E14)")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Issue By",
    thai: "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A \xB7 EPC"
  }, React.createElement("input", {
    value: f.issueBy,
    onChange: e => set("issueBy", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Inspected By",
    thai: "\u0E1C\u0E39\u0E49\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A \xB7 EPC"
  }, React.createElement("input", {
    value: f.inspectedBy,
    onChange: e => set("inspectedBy", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Approved By",
    thai: "\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \xB7 Project Manager"
  }, React.createElement("input", {
    value: f.approvedBy,
    onChange: e => set("approvedBy", e.target.value),
    style: inp
  })), React.createElement(RfField, {
    lbl: lbl,
    sub: sub,
    label: "Approved by Client",
    thai: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"
  }, React.createElement("input", {
    value: f.clientBy,
    onChange: e => set("clientBy", e.target.value),
    style: inp
  })))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E23\u0E39\u0E1B\u0E2A\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E13 \u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A ", React.createElement("span", {
    style: sub
  }, "(\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22\u0E43\u0E0A\u0E49\u0E23\u0E39\u0E1B\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49)")), React.createElement(RoofPhotoPicker, {
    store: photos,
    currentUser: currentUser
  })), store.rec && store.rec.updatedAt && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 ", window.drDateTH ? window.drDateTH(store.rec.updatedAt, true) : store.rec.updatedAt, store.rec.updatedByName ? " · โดย " + store.rec.updatedByName : "")), React.createElement("div", {
    style: {
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "12px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"), React.createElement("button", {
    onClick: () => setPaper(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "12px 16px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"), React.createElement("button", {
    onClick: doSave,
    style: {
      flex: 1,
      minWidth: 150,
      padding: 12,
      borderRadius: 11,
      border: "none",
      background: saved ? "var(--tint-green-tx)" : "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, saved ? "บันทึกแล้ว" : "บันทึก")))), paper && window.RoofHandoverPaper && React.createElement(window.RoofHandoverPaper, {
    job: job,
    rec: f,
    photos: photos.photos,
    onClose: () => setPaper(false)
  }));
}
function RoofPhotoPicker({
  store,
  currentUser
}) {
  const [busy, setBusy] = React.useState(0);
  const list = store.photos;
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const file of files) {
      try {
        store.add(await window.resizeImageFile(file, 1400, 0.74), currentUser);
      } catch (err) {}
      setBusy(n => n - 1);
    }
  };
  return React.createElement("div", null, React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: list.length ? 11 : 0
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 15
  }), " ", busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)", React.createElement("input", {
    type: "file",
    accept: "image/*",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))",
      gap: 10
    }
  }, list.map(p => React.createElement("div", {
    key: p.id,
    style: {
      border: "1px solid var(--border)",
      borderRadius: 11,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      background: "#0d1512"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "รูปหลังคา",
    style: {
      width: "100%",
      height: 108,
      objectFit: "cover",
      display: "block"
    }
  }), React.createElement("button", {
    type: "button",
    onClick: () => store.remove(p.id),
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49",
    style: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 8,
      border: "none",
      background: "rgba(0,0,0,.55)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "#fff"
  }))), window.DrPhotoCap && React.createElement(window.DrPhotoCap, {
    value: p.cap,
    onSave: v => store.setCap(p.id, v)
  })))));
}
Object.assign(window, {
  RF_RESULTS,
  RF_RESULT_BY,
  rfBlank,
  rfSummary,
  useRoofHandover,
  useRoofPhotos,
  RoofHandoverModal,
  RoofPhotoPicker
});