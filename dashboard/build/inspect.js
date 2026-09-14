const _IRFB = () => window.FBDB || null;
const _irRef = p => window.FBDB.ref(p);
const IR_KINDS = ["ส่งมอบหลังคา (Roof Handover)", "โครงสร้างรองรับแผง (Mounting Structure)", "ติดตั้งแผง (PV Module Installation)", "งานระบบไฟฟ้า (Electrical Works)", "ก่อนส่งมอบงาน (Final Inspection)"];
const IR_ITEM_RESULTS = [{
  key: "pass",
  en: "Pass",
  th: "ผ่าน",
  mark: "✓",
  color: "#16A34A"
}, {
  key: "fail",
  en: "Fail",
  th: "ไม่ผ่าน",
  mark: "✗",
  color: "#EF4444"
}, {
  key: "na",
  en: "N/A",
  th: "ไม่เกี่ยวข้อง",
  mark: "–",
  color: "#64748B"
}];
const IR_ITEM_BY = {};
IR_ITEM_RESULTS.forEach(r => {
  IR_ITEM_BY[r.key] = r;
});
const IR_ITEM_PRESETS = {
  "ส่งมอบหลังคา (Roof Handover)": ["สภาพแผ่นหลังคา (รอยบุบ/รอยขีดข่วน)", "รอยรั่ว / คราบน้ำที่มีอยู่เดิม", "สภาพโครงสร้างรองรับหลังคา", "ทางขึ้น-ลงหลังคาและจุดยึดเชือกนิรภัย", "สิ่งกีดขวางบนหลังคา (ท่อ/พัดลม/สกายไลท์)", "ความสะอาดพื้นที่ก่อนรับมอบ"],
  "โครงสร้างรองรับแผง (Mounting Structure)": ["ระยะและแนวรางตามแบบ", "จุดยึดและการซีลกันรั่ว", "แรงขันน็อตตามสเปก", "การต่อลงดินของโครงสร้าง"],
  "ติดตั้งแผง (PV Module Installation)": ["จำนวนแผงและตำแหน่งตามผัง", "ระยะห่างและแนวแผงเรียบร้อย", "คลิปยึดแผงครบและแน่น", "สภาพแผง (ไม่มีรอยร้าว/รอยกระแทก)", "การเก็บสายใต้แผง"],
  "งานระบบไฟฟ้า (Electrical Works)": ["การเดินสาย DC และการรัดสาย", "ขั้วต่อ MC4 แน่นและถูกขั้ว", "ตู้ DC/AC และอุปกรณ์ป้องกัน", "การต่อลงดินและระบบกันฟ้าผ่า", "ป้ายเตือนและป้ายระบุวงจร"],
  "ก่อนส่งมอบงาน (Final Inspection)": ["ทดสอบการทำงานของระบบ", "ค่าที่วัดได้ตรงกับที่ออกแบบ", "ความสะอาดและเก็บงานหน้างาน", "เอกสารส่งมอบครบถ้วน"]
};
const IR_ITEM_FALLBACK = ["ความถูกต้องตามแบบ", "คุณภาพงานติดตั้ง", "ความปลอดภัยหน้างาน", "ความสะอาดเรียบร้อย"];
const irPresetItems = kind => IR_ITEM_PRESETS[kind] || IR_ITEM_FALLBACK;
const irNewItem = name => ({
  id: "it-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  name: name || "",
  result: "",
  note: ""
});
function irItemTally(items) {
  const t = {
    pass: 0,
    fail: 0,
    na: 0,
    blank: 0,
    total: (items || []).length
  };
  (items || []).forEach(x => {
    t[x.result || "blank"] = (t[x.result || "blank"] || 0) + 1;
  });
  return t;
}
const IR_RESULTS = [{
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
const IR_RESULT_BY = {};
IR_RESULTS.forEach(r => {
  IR_RESULT_BY[r.key] = r;
});
function irNextNo(list) {
  let mx = 0;
  (list || []).forEach(x => {
    const m = /(\d+)\s*$/.exec(x.no || "");
    if (m) mx = Math.max(mx, +m[1]);
  });
  const n = Math.max(mx, (list || []).length) + 1;
  return "IR-" + (n < 10 ? "0" + n : String(n));
}
function irBlank(job, no, kind) {
  const j = job || {};
  const B = window.BRANDING || {};
  return {
    no: no || "IR-01",
    kind: kind || IR_KINDS[0],
    to: "",
    project: j.name || "",
    contractor: B.legal || "",
    reqDate: new Date().toISOString().slice(0, 10),
    reqItems: "",
    inspAt: "",
    refIr: "",
    others: "",
    reqBy: "",
    items: [],
    result: "",
    resultOther: "",
    summary: "",
    note: "",
    issueBy: "",
    inspectedBy: "",
    approvedBy: "",
    clientBy: ""
  };
}
const irPhotoPath = (jobId, rec) => rec && rec.photoPath || "inspectionPhotos/" + jobId + "/" + (rec && rec.id || "x");
function useJobInspections(jobId) {
  const [rows, setRows] = React.useState([]);
  const [legacy, setLegacy] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId || !_IRFB()) {
      setRows([]);
      setLegacy(null);
      setLoading(false);
      return;
    }
    const a = _irRef("inspections/" + jobId);
    const ha = a.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((x, y) => String(x.no || "").localeCompare(String(y.no || "")));
      setRows(arr);
      setLoading(false);
    });
    const b = _irRef("roofHandover/" + jobId);
    const hb = b.on("value", s => setLegacy(s.val() || null));
    return () => {
      a.off("value", ha);
      b.off("value", hb);
    };
  }, [jobId]);
  const list = React.useMemo(() => {
    const out = rows.slice();
    if (legacy && !rows.some(x => x.id === "roof")) {
      out.unshift(Object.assign({}, legacy, {
        id: "roof",
        no: legacy.no || "IR-01",
        kind: legacy.kind || IR_KINDS[0],
        photoPath: "roofPhotos/" + jobId
      }));
    }
    return out;
  }, [rows, legacy, jobId]);
  const save = React.useCallback((id, patch, user) => {
    if (!jobId || !_IRFB() || !id) return;
    _irRef("inspections/" + jobId + "/" + id).update(Object.assign({
      id: id
    }, patch, {
      updatedAt: new Date().toISOString(),
      updatedBy: (user || {}).id || null,
      updatedByName: (user || {}).name || ""
    }));
  }, [jobId]);
  const create = React.useCallback((job, kind, user) => {
    if (!jobId || !_IRFB()) return null;
    const id = "IR-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const rec = Object.assign(irBlank(job, irNextNo(list), kind), {
      id: id,
      createdAt: new Date().toISOString(),
      createdBy: (user || {}).id || null,
      createdByName: (user || {}).name || ""
    });
    _irRef("inspections/" + jobId + "/" + id).set(rec);
    return rec;
  }, [jobId, list]);
  const remove = React.useCallback(id => {
    if (!jobId || !_IRFB() || !id) return;
    _irRef("inspections/" + jobId + "/" + id).remove();
    if (id === "roof") _irRef("roofHandover/" + jobId).remove();
  }, [jobId]);
  return {
    list: list,
    loading: loading,
    save: save,
    create: create,
    remove: remove
  };
}
function useIrPhotos(path) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!path || !_IRFB()) {
      setPhotos([]);
      return;
    }
    const ref = _irRef(path);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [path]);
  const add = React.useCallback((dataUrl, user) => {
    if (!path || !_IRFB()) return;
    const id = "IRP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _irRef(path + "/" + id).set({
      id: id,
      dataUrl: dataUrl,
      cap: "",
      at: new Date().toISOString(),
      by: (user || {}).id || null,
      byName: (user || {}).name || ""
    });
  }, [path]);
  const setCap = React.useCallback((id, cap) => {
    if (!path || !_IRFB()) return;
    _irRef(path + "/" + id).update({
      cap: cap || ""
    });
  }, [path]);
  const remove = React.useCallback(id => {
    if (!path || !_IRFB()) return;
    _irRef(path + "/" + id).remove();
  }, [path]);
  return {
    photos: photos,
    add: add,
    setCap: setCap,
    remove: remove
  };
}
function irJobSummary(list) {
  const arr = list || [];
  if (!arr.length) return {
    label: "ยังไม่มีใบตรวจ · แตะเพื่อสร้าง",
    color: "var(--text-3)",
    bold: false
  };
  const last = arr[arr.length - 1];
  const r = IR_RESULT_BY[last.result];
  const head = arr.length + " ใบ · ล่าสุด " + (last.no || "");
  if (!r) return {
    label: head + " · ยังไม่สรุปผล",
    color: "#F59E0B",
    bold: true
  };
  return {
    label: head + " · " + r.th,
    color: r.color,
    bold: true
  };
}
function InspectionListModal({
  job,
  currentUser,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = useJobInspections(job ? job.id : null);
  const [openId, setOpenId] = React.useState(null);
  const [picking, setPicking] = React.useState(false);
  const [ask, setAsk] = React.useState(null);
  if (!job) return null;
  const editing = openId ? store.list.find(x => x.id === openId) : null;
  const startNew = kind => {
    const rec = store.create(job, kind, currentUser);
    setPicking(false);
    if (rec) setOpenId(rec.id);
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 128,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(680px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
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
  }, "\u0E43\u0E1A\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E07\u0E32\u0E19 (Inspection Report)"), React.createElement("div", {
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
      padding: 14,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, store.loading && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026"), !store.loading && !store.list.length && React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13,
      background: "var(--surface)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 14
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E15\u0E23\u0E27\u0E08\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49", React.createElement("br", null), "\u0E01\u0E14 \u201C\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E15\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E21\u0E48\u201D \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2D\u0E30\u0E44\u0E23"), store.list.map(x => {
    const r = IR_RESULT_BY[x.result];
    return React.createElement("div", {
      key: x.id,
      style: {
        border: "1px solid var(--border)",
        borderLeft: "3px solid " + (r ? r.color : "var(--border-strong)"),
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden"
      }
    }, React.createElement("button", {
      onClick: () => setOpenId(x.id),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 13px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
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
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        color: "var(--text-3)",
        fontSize: 11.5,
        marginRight: 7
      }
    }, x.no), x.kind), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: r ? r.color : "var(--text-3)",
        fontWeight: r ? 700 : 400,
        marginTop: 2
      }
    }, r ? "ผลตรวจ: " + r.th : "ยังไม่สรุปผลการตรวจ", x.reqDate ? " · ขอตรวจ " + (window.drDateTH ? window.drDateTH(x.reqDate) : x.reqDate) : "")), React.createElement(Icon, {
      name: "arrowRight",
      size: 16,
      color: "var(--text-3)"
    })), ask === x.id ? React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 13px",
        borderTop: "1px solid var(--border)"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 150,
        fontSize: 12,
        fontWeight: 700,
        color: "#EF4444",
        lineHeight: 1.5
      }
    }, "\u0E25\u0E1A\u0E43\u0E1A ", x.no, " ? \u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48\u0E41\u0E19\u0E1A\u0E44\u0E27\u0E49\u0E08\u0E30\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48 \u0E41\u0E15\u0E48\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B"), React.createElement("button", {
      onClick: () => {
        store.remove(x.id);
        setAsk(null);
      },
      style: {
        padding: "7px 13px",
        borderRadius: 9,
        border: "none",
        background: "#EF4444",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E40\u0E25\u0E22"), React.createElement("button", {
      onClick: () => setAsk(null),
      style: {
        padding: "7px 13px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement("div", {
      style: {
        padding: "0 13px 10px"
      }
    }, React.createElement("button", {
      onClick: () => setAsk(x.id),
      style: {
        padding: "5px 10px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49")));
  }), picking && React.createElement("div", {
    style: {
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      padding: 12,
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 9
    }
  }, "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2D\u0E30\u0E44\u0E23"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, IR_KINDS.map(k => React.createElement("button", {
    key: k,
    onClick: () => startNew(k),
    style: {
      textAlign: "left",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, k)), React.createElement("button", {
    onClick: () => startNew(""),
    style: {
      textAlign: "left",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer"
    }
  }, "\u0E2D\u0E37\u0E48\u0E19 \u0E46 \u2014 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E07\u0E43\u0E19\u0E43\u0E1A")))), React.createElement("div", {
    style: {
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10
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
    onClick: () => setPicking(v => !v),
    style: {
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: 12,
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " ", picking ? "ปิดรายการประเภท" : "สร้างใบตรวจใหม่")))), editing && React.createElement(InspectionFormModal, {
    job: job,
    rec: editing,
    currentUser: currentUser,
    onSave: patch => store.save(editing.id, patch, currentUser),
    onClose: () => setOpenId(null)
  }));
}
function IrField({
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
function IrItemRow({
  item,
  no,
  inp,
  onChange,
  onRemove,
  isMobile
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: isMobile ? "stretch" : "center",
      flexDirection: isMobile ? "column" : "row",
      padding: "9px 10px",
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      flexShrink: 0,
      fontSize: 11,
      fontFamily: "var(--mono)",
      color: "var(--text-3)",
      minWidth: 20
    }
  }, no, "."), React.createElement("input", {
    value: item.name,
    onChange: e => onChange({
      name: e.target.value
    }),
    placeholder: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08",
    style: Object.assign({}, inp, {
      flex: 2,
      minWidth: 0
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexShrink: 0
    }
  }, IR_ITEM_RESULTS.map(r => {
    const on = item.result === r.key;
    return React.createElement("button", {
      key: r.key,
      type: "button",
      onClick: () => onChange({
        result: on ? "" : r.key
      }),
      title: r.th + " (" + r.en + ")",
      "aria-label": r.th,
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 800,
        display: "grid",
        placeItems: "center",
        lineHeight: 1,
        border: "1px solid " + (on ? r.color : "var(--border-strong)"),
        background: on ? r.color + "16" : "var(--surface)",
        color: on ? r.color : "var(--text-3)"
      }
    }, r.mark);
  })), React.createElement("input", {
    value: item.note,
    onChange: e => onChange({
      note: e.target.value
    }),
    placeholder: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    style: Object.assign({}, inp, {
      flex: 1.4,
      minWidth: 0
    })
  }), React.createElement("button", {
    type: "button",
    onClick: onRemove,
    title: "\u0E25\u0E1A\u0E02\u0E49\u0E2D\u0E19\u0E35\u0E49",
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "#EF4444"
  })));
}
function InspectionFormModal({
  job,
  rec,
  currentUser,
  onSave,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const path = irPhotoPath(job ? job.id : "", rec);
  const photos = useIrPhotos(path);
  const [f, setF] = React.useState(() => {
    const base = Object.assign(irBlank(job), rec || {}, {
      photoPath: path
    });
    base.items = Array.isArray(base.items) ? base.items : [];
    return base;
  });
  const [paper, setPaper] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const tally = irItemTally(f.items);
  const set = (k, v) => {
    setF(p => Object.assign({}, p, {
      [k]: v
    }));
    setSaved(false);
  };
  const fillPreset = () => set("items", irPresetItems(f.kind).map(n => irNewItem(n)));
  const doSave = () => {
    onSave(f);
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
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 132,
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
  }, React.createElement("div", {
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
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      color: "var(--text-3)",
      fontSize: 12,
      marginRight: 7
    }
  }, f.no), "Inspection Report"), React.createElement("div", {
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
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 ", React.createElement("span", {
    style: sub
  }, "(Inspection type)")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, IR_KINDS.map(k => {
    const on = f.kind === k;
    return React.createElement("button", {
      key: k,
      type: "button",
      onClick: () => set("kind", k),
      style: {
        padding: "7px 12px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, k);
  })), React.createElement("input", {
    value: f.kind,
    onChange: e => set("kind", e.target.value),
    placeholder: "\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E2D\u0E07",
    style: inp
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(IrField, {
    label: "Report No.",
    thai: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.no,
    onChange: e => set("no", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "To",
    thai: "\u0E40\u0E23\u0E35\u0E22\u0E19",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.to,
    onChange: e => set("to", e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A / \u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E04\u0E32\u0E23",
    style: inp
  })), React.createElement(IrField, {
    label: "Project Name",
    thai: "\u0E0A\u0E37\u0E48\u0E2D\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.project,
    onChange: e => set("project", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Contractor",
    thai: "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.contractor,
    onChange: e => set("contractor", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Request Date",
    thai: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    type: "date",
    value: f.reqDate,
    onChange: e => set("reqDate", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Inspection Date and Time",
    thai: "\u0E27\u0E31\u0E19\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    type: "datetime-local",
    value: f.inspAt,
    onChange: e => set("inspAt", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Request to inspect",
    thai: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A",
    wide: true,
    lbl: lbl,
    sub: sub
  }, React.createElement("textarea", {
    value: f.reqItems,
    onChange: e => set("reqItems", e.target.value),
    rows: 2,
    placeholder: "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E43\u0E2B\u0E49\u0E0A\u0E31\u0E14\u0E27\u0E48\u0E32\u0E02\u0E2D\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E27\u0E08\u0E2D\u0E30\u0E44\u0E23\u0E1A\u0E49\u0E32\u0E07",
    style: Object.assign({}, inp, {
      resize: "vertical",
      lineHeight: 1.5
    })
  })), React.createElement(IrField, {
    label: "Ref IR No.",
    thai: "\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E08\u0E32\u0E01 IR \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.refIr,
    onChange: e => set("refIr", e.target.value),
    placeholder: "\u0E16\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33 \u0E43\u0E2A\u0E48\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E14\u0E34\u0E21",
    style: inp
  })), React.createElement(IrField, {
    label: "Request by",
    thai: "\u0E02\u0E2D\u0E42\u0E14\u0E22",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.reqBy,
    onChange: e => set("reqBy", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Others",
    thai: "\u0E2D\u0E37\u0E48\u0E19 \u0E46",
    wide: true,
    lbl: lbl,
    sub: sub
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
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 ", React.createElement("span", {
    style: sub
  }, "(Checklist)")), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, IR_ITEM_RESULTS.map((r, i) => React.createElement("span", {
    key: r.key
  }, i ? " · " : "", React.createElement("b", {
    style: {
      color: r.color
    }
  }, r.mark), " ", r.th))), tally.total > 0 && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      color: "#16A34A"
    }
  }, "\u0E1C\u0E48\u0E32\u0E19 ", tally.pass), tally.fail ? React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " \xB7 \u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19 ", tally.fail) : null, tally.blank ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, " \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E34\u0E4A\u0E01 ", tally.blank) : null), React.createElement("span", {
    style: {
      flex: 1
    }
  }), !f.items.length && React.createElement("button", {
    type: "button",
    onClick: fillPreset,
    style: {
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E43\u0E2A\u0E48\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E35\u0E49"), React.createElement("button", {
    type: "button",
    onClick: () => set("items", f.items.concat([irNewItem("")])),
    style: {
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D")), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 11,
      background: "var(--surface)",
      overflow: "hidden"
    }
  }, !f.items.length ? React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 \u2014 \u0E01\u0E14 \u201C\u0E43\u0E2A\u0E48\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E35\u0E49\u201D \u0E41\u0E25\u0E49\u0E27\u0E41\u0E01\u0E49\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49") : f.items.map((it, i) => React.createElement(IrItemRow, {
    key: it.id || i,
    item: it,
    no: i + 1,
    inp: inp,
    isMobile: isMobile,
    onChange: patch => set("items", f.items.map((x, j) => j === i ? Object.assign({}, x, patch) : x)),
    onRemove: () => set("items", f.items.filter((x, j) => j !== i))
  })))), React.createElement("div", {
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
  }, IR_RESULTS.map(r => {
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
  })), React.createElement(IrField, {
    label: "Summary",
    thai: "\u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08",
    wide: true,
    lbl: lbl,
    sub: sub
  }, React.createElement("textarea", {
    value: f.summary,
    onChange: e => set("summary", e.target.value),
    rows: 4,
    placeholder: "\u0E2A\u0E23\u0E38\u0E1B\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \u0E40\u0E0A\u0E48\u0E19 \"\u0E15\u0E23\u0E27\u0E08\u0E41\u0E25\u0E49\u0E27\u0E1C\u0E48\u0E32\u0E19 5 \u0E08\u0E32\u0E01 6 \u0E02\u0E49\u0E2D \u0E15\u0E34\u0E14\u0E17\u0E35\u0E48\u0E23\u0E2D\u0E22\u0E23\u0E31\u0E48\u0E27\u0E42\u0E0B\u0E19 B \u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32\u0E0B\u0E48\u0E2D\u0E21\u0E41\u0E25\u0E49\u0E27\u0E19\u0E31\u0E14\u0E15\u0E23\u0E27\u0E08\u0E0B\u0E49\u0E33\"",
    style: Object.assign({}, inp, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement(IrField, {
    label: "Note",
    thai: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    wide: true,
    lbl: lbl,
    sub: sub
  }, React.createElement("textarea", {
    value: f.note,
    onChange: e => set("note", e.target.value),
    rows: 3,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \"\u0E42\u0E0B\u0E19 B \u0E21\u0E35\u0E23\u0E2D\u0E22\u0E23\u0E31\u0E48\u0E27\u0E40\u0E14\u0E34\u0E21 2 \u0E08\u0E38\u0E14 \u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27\"",
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
  }, React.createElement(IrField, {
    label: "Issue By",
    thai: "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A \xB7 EPC",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.issueBy,
    onChange: e => set("issueBy", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Inspected By",
    thai: "\u0E1C\u0E39\u0E49\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A \xB7 EPC",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.inspectedBy,
    onChange: e => set("inspectedBy", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Approved By",
    thai: "\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \xB7 Project Manager",
    lbl: lbl,
    sub: sub
  }, React.createElement("input", {
    value: f.approvedBy,
    onChange: e => set("approvedBy", e.target.value),
    style: inp
  })), React.createElement(IrField, {
    label: "Approved by Client",
    thai: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E42\u0E14\u0E22\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    lbl: lbl,
    sub: sub
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
  }, "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 ", React.createElement("span", {
    style: sub
  }, "(\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22\u0E43\u0E0A\u0E49\u0E23\u0E39\u0E1B\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49)")), React.createElement(IrPhotoPicker, {
    store: photos,
    currentUser: currentUser
  })), rec && rec.updatedAt && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 ", window.drDateTH ? window.drDateTH(rec.updatedAt, true) : rec.updatedAt, rec.updatedByName ? " · โดย " + rec.updatedByName : "")), React.createElement("div", {
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
  }, saved ? "บันทึกแล้ว" : "บันทึก")))), paper && window.InspectionPaper && React.createElement(window.InspectionPaper, {
    job: job,
    rec: f,
    photos: photos.photos,
    onClose: () => setPaper(false)
  }));
}
function IrPhotoPicker({
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
    alt: p.cap || "รูปการตรวจ",
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
  IR_KINDS,
  IR_RESULTS,
  IR_RESULT_BY,
  IR_ITEM_RESULTS,
  IR_ITEM_BY,
  IR_ITEM_PRESETS,
  irBlank,
  irNextNo,
  irPhotoPath,
  irJobSummary,
  irPresetItems,
  irNewItem,
  irItemTally,
  useJobInspections,
  useIrPhotos,
  InspectionListModal,
  InspectionFormModal,
  IrPhotoPicker
});