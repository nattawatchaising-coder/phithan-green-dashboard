function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PERMIT_TYPES = [{
  key: "self",
  th: "ใช้เอง ไม่ขายไฟ",
  sub: "Zero Export — มีอุปกรณ์กันไฟไหลย้อน"
}, {
  key: "public",
  th: "โซลาร์ภาคประชาชน",
  sub: "ขายไฟส่วนเกินคืนการไฟฟ้า"
}, {
  key: "biz",
  th: "โรงงาน / อาคารธุรกิจ",
  sub: "ระบบใหญ่ · มีหม้อแปลงของตัวเอง"
}];
const PERMIT_AUTHS = [{
  value: "PEA",
  label: "กฟภ. (PEA)"
}, {
  value: "MEA",
  label: "กฟน. (MEA)"
}];
const PERMIT_PHASES = [{
  value: "1",
  label: "1 เฟส"
}, {
  value: "3",
  label: "3 เฟส"
}];
const PERMIT_YESNO = [{
  value: "yes",
  label: "มี"
}, {
  value: "no",
  label: "ไม่มี"
}];
const PERMIT_PHOTO_SLOTS = [{
  key: "meter",
  group: "จุดรับไฟ",
  label: "มิเตอร์ไฟฟ้า",
  hint: "ต้องอ่านหมายเลขมิเตอร์และขนาด เช่น 15(45) ออก",
  req: true
}, {
  key: "house",
  group: "จุดรับไฟ",
  label: "หน้าบ้าน / อาคาร",
  hint: "ให้เห็นบ้านเลขที่ชัดเจน",
  req: true
}, {
  key: "pole",
  group: "จุดรับไฟ",
  label: "เสาไฟ / หม้อแปลงต้นที่รับไฟ",
  hint: "ให้เห็นหมายเลขเสาบนป้าย",
  req: true
}, {
  key: "mdbClosed",
  group: "ตู้ไฟ",
  label: "ตู้ MDB ปิดฝา",
  hint: "มุมกว้างให้เห็นตำแหน่งที่ติดตั้ง",
  req: true
}, {
  key: "mdbOpen",
  group: "ตู้ไฟ",
  label: "ตู้ MDB เปิดฝา",
  hint: "ให้เห็นเมนเบรกเกอร์และขนาดที่พิมพ์ไว้",
  req: true
}, {
  key: "acBreaker",
  group: "ตู้ไฟ",
  label: "เบรกเกอร์ AC ของโซลาร์",
  hint: "ตัวที่เพิ่มเข้าไปใหม่ ให้เห็นขนาด",
  req: true
}, {
  key: "acWiring",
  group: "ตู้ไฟ",
  label: "จุดเข้าสาย AC ในตู้",
  hint: "ให้เห็นการเข้าสายและการขันแน่น"
}, {
  key: "ct",
  group: "ตู้ไฟ",
  label: "CT คล้องสายเมน",
  hint: "จุดที่คล้อง CT ของระบบกันไฟไหลย้อน",
  when: f => f.zeroExport === "yes",
  req: true
}, {
  key: "inverter",
  group: "อินเวอร์เตอร์",
  label: "อินเวอร์เตอร์ติดตั้งเสร็จ",
  hint: "มุมกว้างเห็นตำแหน่งที่ยึดผนัง",
  req: true
}, {
  key: "invPlate",
  group: "อินเวอร์เตอร์",
  label: "เนมเพลทอินเวอร์เตอร์",
  hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออกทุกตัว — ตีกลับบ่อยที่สุด",
  req: true
}, {
  key: "dcIso",
  group: "อินเวอร์เตอร์",
  label: "DC Isolator / ตู้ DC",
  hint: "ถ้ามีติดตั้ง"
}, {
  key: "arrayWide",
  group: "แผงโซลาร์",
  label: "แผงบนหลังคา มุมรวม",
  hint: "ให้เห็นทั้งอาร์เรย์ในรูปเดียว",
  req: true
}, {
  key: "arrayClose",
  group: "แผงโซลาร์",
  label: "แผงมุมใกล้",
  hint: "ให้เห็นรางและตัวยึดจับแผง"
}, {
  key: "panelPlate",
  group: "แผงโซลาร์",
  label: "สติกเกอร์หลังแผง",
  hint: "⚠ ถ่ายใกล้ ให้อ่านรุ่นและ Serial ออก — ตีกลับบ่อย",
  req: true
}, {
  key: "ground",
  group: "ความปลอดภัย",
  label: "หลักดิน + จุดต่อสายดิน",
  hint: "ให้เห็นหลักดินและสายที่ต่อเข้าจริง",
  req: true
}, {
  key: "warnSign",
  group: "ความปลอดภัย",
  label: "ป้ายเตือนที่ติดหน้าตู้",
  hint: "ป้าย “มีระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์”",
  req: true
}];
const PERMIT_SLOT_BY = Object.fromEntries(PERMIT_PHOTO_SLOTS.map(s => [s.key, s]));
const PERMIT_PHOTO_GROUPS = PERMIT_PHOTO_SLOTS.reduce((a, s) => a.indexOf(s.group) === -1 ? a.concat([s.group]) : a, []);
const PERMIT_STEPS = [{
  n: 1,
  icon: "file",
  th: "ประเภท & จุดรับไฟ"
}, {
  n: 2,
  icon: "bolt",
  th: "ระบบไฟเดิม"
}, {
  n: 3,
  icon: "panel",
  th: "ระบบใหม่ & อุปกรณ์"
}, {
  n: 4,
  icon: "image",
  th: "รูปถ่าย"
}, {
  n: 5,
  icon: "check",
  th: "ตรวจสอบ & ส่งต่อ"
}];
const PERMIT_STATUS = {
  draft: {
    th: "ช่างกำลังเก็บข้อมูล",
    color: "#94A3B8"
  },
  sent: {
    th: "รอฝ่ายขออนุญาตรับ",
    color: "#F59E0B"
  },
  filing: {
    th: "กำลังยื่นการไฟฟ้า",
    color: "#3B82F6"
  },
  approved: {
    th: "การไฟฟ้าอนุมัติแล้ว",
    color: "#10B981"
  },
  rejected: {
    th: "ตีกลับ ต้องแก้ไข",
    color: "#EF4444"
  }
};
function blankPermit(job) {
  return {
    status: "draft",
    permitType: "",
    auth: "",
    ca: "",
    meterNo: "",
    meterSize: "",
    branch: "",
    poleNo: "",
    phase: String(job && job.phase || "1") === "3" ? "3" : "1",
    mainAT: "",
    mainAF: "",
    mainCable: "",
    mdbBrand: "",
    rccb: "",
    kwp: job && job.kw ? String(job.kw) : "",
    kwac: "",
    acBreaker: "",
    dcIsolator: "",
    zeroExport: "",
    eldModel: "",
    invs: [{
      model: job && job.brand || "",
      sn: ""
    }],
    panelModel: "",
    panelWatt: "",
    panelQty: "",
    panelSns: ["", ""],
    trafoKva: "",
    trafoVolt: "",
    gps: null,
    doneDate: "",
    byName: "",
    note: ""
  };
}
function permitRequiredFields(f) {
  const req = [{
    key: "permitType",
    th: "ประเภทการขออนุญาต",
    step: 1
  }, {
    key: "auth",
    th: "การไฟฟ้าที่ยื่น",
    step: 1
  }, {
    key: "ca",
    th: "หมายเลขผู้ใช้ไฟฟ้า (CA)",
    step: 1
  }, {
    key: "meterNo",
    th: "หมายเลขมิเตอร์",
    step: 1
  }, {
    key: "meterSize",
    th: "ขนาดมิเตอร์",
    step: 1
  }, {
    key: "poleNo",
    th: "หมายเลขเสาไฟ",
    step: 1
  }, {
    key: "mainAT",
    th: "ขนาดเมนเบรกเกอร์ (AT)",
    step: 2
  }, {
    key: "mainCable",
    th: "ขนาดสายเมน",
    step: 2
  }, {
    key: "kwp",
    th: "ขนาดติดตั้ง kWp",
    step: 3
  }, {
    key: "acBreaker",
    th: "เบรกเกอร์ AC ของโซลาร์",
    step: 3
  }, {
    key: "zeroExport",
    th: "มีระบบกันไฟไหลย้อนไหม",
    step: 3
  }, {
    key: "panelModel",
    th: "รุ่นแผง",
    step: 3
  }, {
    key: "panelQty",
    th: "จำนวนแผง",
    step: 3
  }, {
    key: "doneDate",
    th: "วันที่ติดตั้งเสร็จ",
    step: 3
  }];
  if (f.permitType === "biz") req.push({
    key: "trafoKva",
    th: "ขนาดหม้อแปลง (kVA)",
    step: 2
  });
  return req;
}
function permitMissing(f, photos) {
  const out = [];
  permitRequiredFields(f).forEach(r => {
    if (!String(f[r.key] || "").trim()) out.push({
      kind: "field",
      th: r.th,
      step: r.step
    });
  });
  (f.invs || []).forEach((iv, i) => {
    if (!String(iv.model || "").trim()) out.push({
      kind: "field",
      th: "รุ่นอินเวอร์เตอร์ตัวที่ " + (i + 1),
      step: 3
    });
    if (!String(iv.sn || "").trim()) out.push({
      kind: "field",
      th: "Serial อินเวอร์เตอร์ตัวที่ " + (i + 1),
      step: 3
    });
  });
  if (!(f.panelSns || []).some(s => String(s || "").trim())) out.push({
    kind: "field",
    th: "Serial แผง (อย่างน้อย 1 แผ่น)",
    step: 3
  });
  PERMIT_PHOTO_SLOTS.forEach(s => {
    if (s.when && !s.when(f)) return;
    if (!s.req) return;
    const p = photos && photos[s.key];
    if (!p || !p.dataUrl) out.push({
      kind: "photo",
      th: "รูป: " + s.label,
      step: 4
    });
  });
  return out;
}
function permitTotalItems(f) {
  let n = permitRequiredFields(f).length + 1;
  n += (f.invs || []).length * 2;
  PERMIT_PHOTO_SLOTS.forEach(s => {
    if (s.req && (!s.when || s.when(f))) n++;
  });
  return n;
}
function permitProgress(f, photos) {
  if (!f) return {
    pct: 0,
    missing: [],
    done: 0,
    total: 1
  };
  const total = permitTotalItems(f);
  const missing = permitMissing(f, photos);
  const done = Math.max(0, total - missing.length);
  return {
    pct: Math.round(done / total * 100),
    missing,
    done,
    total
  };
}
function permitStatusOf(job) {
  const p = job && job.permit;
  if (!p || !p.status) return null;
  return Object.assign({
    key: p.status
  }, PERMIT_STATUS[p.status] || PERMIT_STATUS.draft);
}
function usePermitPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setPhotos({});
      return;
    }
    const ref = window.FBDB.ref("permitPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setPhotos(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user, extra) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).update(Object.assign({
      slot,
      dataUrl,
      by: user && user.id || null,
      byName: user && user.name || "-",
      at: new Date().toISOString()
    }, extra || {}));
  }, [jobId]);
  const removePhoto = React.useCallback(slot => {
    if (jobId && window.FBDB) window.FBDB.ref("permitPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return {
    photos,
    setPhoto,
    removePhoto
  };
}
const P_INPUT = {
  background: "var(--surface2)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 10,
  outline: "none",
  width: "100%"
};
function PField({
  label,
  hint,
  required,
  children,
  full
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      gridColumn: full ? "1 / -1" : "auto",
      minWidth: 0
    }
  }, React.createElement("label", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".04em",
      color: "var(--text-3)"
    }
  }, label, required && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), children, hint && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.4
    }
  }, hint));
}
function PGrid({
  children,
  cols
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(" + (cols || 2) + ", 1fr)",
      gap: 13
    }
  }, children);
}
function PermitTypePicker({
  value,
  onChange
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, PERMIT_TYPES.map(t => {
    const on = value === t.key;
    return React.createElement("button", {
      type: "button",
      key: t.key,
      onClick: () => onChange(t.key),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 13px",
        borderRadius: 12,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
        background: on ? "var(--primary-soft)" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: 99,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        border: "2px solid " + (on ? "var(--primary)" : "var(--border-strong)")
      }
    }, on && React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 99,
        background: "var(--primary)"
      }
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
        color: on ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, t.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 1
      }
    }, t.sub)));
  }));
}
function PermitShotCard({
  slot,
  shot,
  busy,
  onPick,
  onRemove
}) {
  const inputRef = React.useRef(null);
  const has = !!(shot && shot.dataUrl);
  const warn = slot.hint.indexOf("⚠") === 0;
  return React.createElement("div", {
    style: {
      border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"),
      borderRadius: 13,
      padding: 11,
      borderLeft: "3px solid " + (has ? "var(--primary)" : slot.req ? "var(--tint-red-bd)" : "var(--surface3)"),
      background: has ? "var(--surface)" : "var(--surface2)",
      display: "flex",
      gap: 11,
      alignItems: "center"
    }
  }, has ? React.createElement("a", {
    href: shot.dataUrl,
    target: "_blank",
    rel: "noreferrer",
    style: {
      flexShrink: 0,
      lineHeight: 0
    }
  }, React.createElement("img", {
    src: shot.dataUrl,
    alt: "",
    style: {
      width: 54,
      height: 54,
      borderRadius: 10,
      objectFit: "cover",
      border: "1px solid var(--border)"
    }
  })) : React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: 10,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--surface3)",
      border: "1px dashed var(--border-strong)"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 17,
    color: "var(--text-3)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, slot.label, slot.req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      marginTop: 1,
      lineHeight: 1.4,
      color: warn ? "var(--tint-red-tx)" : "var(--text-3)",
      fontWeight: warn ? 600 : 400
    }
  }, slot.hint)), React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: e => {
      const fl = e.target.files && e.target.files[0];
      if (fl) onPick(fl);
      e.target.value = "";
    }
  }), React.createElement("span", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => inputRef.current && inputRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "7px 11px",
      borderRadius: 9,
      border: "none",
      background: has ? "var(--surface3)" : "var(--primary)",
      color: has ? "var(--text-2)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12,
      cursor: busy ? "wait" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 13,
    color: has ? "var(--text-2)" : "#fff"
  }), " ", busy ? "…" : has ? "ถ่ายใหม่" : "ถ่าย"), has && React.createElement("button", {
    type: "button",
    onClick: onRemove,
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14
  }))));
}
function PermitWizard({
  job,
  onClose,
  onSave,
  onSubmit,
  currentUser,
  stock,
  readOnly
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const media = usePermitPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankPermit(job), job && job.permit || {}));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const prog = permitProgress(f, media.photos);
  const locked = !!readOnly;
  const stockItems = stock && stock.items || [];
  const modelOptions = (mainCat, cur) => {
    const SF = window.SF,
      out = [];
    stockItems.forEach(s => {
      if (!s.name || !SF || SF.mainCatOf(s.cat) !== mainCat) return;
      out.push({
        value: s.name,
        label: s.name,
        sub: [s.brand, s.model].filter(Boolean).join(" · ")
      });
    });
    out.sort((a, b) => a.label.localeCompare(b.label, "th"));
    const v = (cur || "").trim();
    if (v && !out.some(o => o.value === v)) out.push({
      value: v,
      label: v,
      sub: "พิมพ์เอง"
    });
    return out;
  };
  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsErr("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setGpsBusy(true);
    setGpsErr("");
    navigator.geolocation.getCurrentPosition(pos => {
      set("gps", {
        lat: +pos.coords.latitude.toFixed(6),
        lng: +pos.coords.longitude.toFixed(6),
        acc: Math.round(pos.coords.accuracy || 0),
        at: new Date().toISOString()
      });
      setGpsBusy(false);
    }, err => {
      setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setGpsBusy(false);
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  };
  const pickPhoto = async (slotKey, file) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1600, 0.8);
      media.setPhoto(slotKey, dataUrl, currentUser);
    } catch (err) {
      alert("เพิ่มรูปไม่สำเร็จ: " + err.message);
    }
    setBusySlot(null);
  };
  const setInv = (i, k, v) => setF(p => {
    const arr = (p.invs || []).slice();
    arr[i] = Object.assign({}, arr[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      invs: arr
    });
  });
  const addInv = () => setF(p => Object.assign({}, p, {
    invs: (p.invs || []).concat([{
      model: "",
      sn: ""
    }])
  }));
  const delInv = i => setF(p => Object.assign({}, p, {
    invs: (p.invs || []).filter((_, x) => x !== i)
  }));
  const setSn = (i, v) => setF(p => {
    const arr = (p.panelSns || []).slice();
    arr[i] = v;
    return Object.assign({}, p, {
      panelSns: arr
    });
  });
  const save = extra => {
    const rec = Object.assign({}, f, {
      updatedAt: new Date().toISOString(),
      byName: f.byName || currentUser && currentUser.name || ""
    }, extra || {});
    onSave(rec);
    return rec;
  };
  const doSubmit = () => {
    const rec = save({
      status: "sent",
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser && currentUser.name || ""
    });
    onSubmit && onSubmit(rec);
    onClose();
  };
  const shownSlots = PERMIT_PHOTO_SLOTS.filter(s => !s.when || s.when(f));
  const photoDone = shownSlots.filter(s => media.photos[s.key] && media.photos[s.key].dataUrl).length;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 118,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 20,
      width: isMobile ? "100%" : "min(760px,100%)",
      height: isMobile ? "96dvh" : "min(880px, 92vh)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "15px 20px 0",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 11,
      background: "#14B8A61c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 18,
    color: "#14B8A6"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, job ? job.code + " · " + (job.name || "") : "")), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
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
  }))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      height: 7,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: prog.pct + "%",
      height: "100%",
      borderRadius: 99,
      transition: "width .3s",
      background: prog.pct === 100 ? "var(--primary)" : "#F59E0B"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: prog.pct === 100 ? "var(--primary-dark)" : "var(--text-2)",
      flexShrink: 0
    }
  }, prog.pct, "%")), React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 5,
      marginTop: 11,
      paddingBottom: 11,
      overflowX: "auto"
    }
  }, PERMIT_STEPS.map(s => {
    const on = step === s.n;
    return React.createElement("button", {
      key: s.n,
      onClick: () => setStep(s.n),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 11px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid " + (on ? "transparent" : "var(--border)"),
        background: on ? "var(--primary)" : "var(--surface)",
        color: on ? "#fff" : "var(--text-2)"
      }
    }, React.createElement(Icon, {
      name: s.icon,
      size: 13,
      color: on ? "#fff" : "var(--text-3)"
    }), " ", s.th);
  }))), React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13,
      pointerEvents: locked ? "none" : "auto",
      opacity: locked ? .75 : 1
    }
  }, step === 1 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDCC4 \u0E22\u0E37\u0E48\u0E19\u0E41\u0E1A\u0E1A\u0E44\u0E2B\u0E19",
    sub: "\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E1A\u0E1A\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E04\u0E19\u0E25\u0E30\u0E0A\u0E38\u0E14 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E32\u0E21"
  }, React.createElement(PermitTypePicker, {
    value: f.permitType,
    onChange: v => set("permitType", v)
  })), React.createElement(SurveyBlock, {
    title: "\u26A1 \u0E08\u0E38\u0E14\u0E23\u0E31\u0E1A\u0E44\u0E1F",
    sub: "\u0E25\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E41\u0E25\u0E30\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E40\u0E1B\u0E4A\u0E30 \u0E1C\u0E34\u0E14\u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E17\u0E35\u0E48\u0E22\u0E37\u0E48\u0E19",
    required: true
  }, React.createElement(Segmented, {
    value: f.auth,
    onChange: v => set("auth", v),
    options: PERMIT_AUTHS
  })), React.createElement(PField, {
    label: "\u0E40\u0E1F\u0E2A"
  }, React.createElement(Segmented, {
    value: f.phase,
    onChange: v => set("phase", v),
    options: PERMIT_PHASES
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E1F\u0E49\u0E32 (CA)",
    required: true,
    hint: "\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F \u0E21\u0E38\u0E21\u0E1A\u0E19"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.ca,
    onChange: e => set("ca", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 020012345678"
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    required: true,
    hint: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E1B\u0E31\u0E14\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.meterNo,
    onChange: e => set("meterNo", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 12345678"
  })), React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    required: true,
    hint: "\u0E40\u0E0A\u0E48\u0E19 15(45), 30(100)"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.meterSize,
    onChange: e => set("meterSize", e.target.value),
    placeholder: "15(45)"
  })), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E40\u0E2A\u0E32\u0E44\u0E1F\u0E15\u0E49\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E44\u0E1F",
    required: true,
    hint: "\u0E2D\u0E48\u0E32\u0E19\u0E08\u0E32\u0E01\u0E1B\u0E49\u0E32\u0E22\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E1A\u0E19\u0E40\u0E2A\u0E32"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.poleNo,
    onChange: e => set("poleNo", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 5FA-01-234"
  })), React.createElement(PField, {
    label: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E2A\u0E32\u0E02\u0E32 / \u0E40\u0E02\u0E15\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    full: true,
    hint: "\u0E14\u0E39\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F \u0E43\u0E0A\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E48\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E22\u0E37\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E44\u0E2B\u0E19"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.branch,
    onChange: e => set("branch", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E1F\u0E20. \u0E2A\u0E32\u0E02\u0E32\u0E1A\u0E32\u0E07\u0E25\u0E30\u0E21\u0E38\u0E07"
  }))))), step === 2 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0C \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E40\u0E14\u0E34\u0E21\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    sub: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E40\u0E02\u0E35\u0E22\u0E19\u0E43\u0E19 Single Line Diagram"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AT (\u0E41\u0E2D\u0E21\u0E1B\u0E4C)",
    required: true,
    hint: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.mainAT,
    onChange: e => set("mainAT", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 50"
  })), React.createElement(PField, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AF (\u0E41\u0E2D\u0E21\u0E1B\u0E4C)"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.mainAF,
    onChange: e => set("mainAF", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 100"
  })), React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19",
    required: true,
    hint: "\u0E40\u0E0A\u0E48\u0E19 2x25 sq.mm THW"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.mainCable,
    onChange: e => set("mainCable", e.target.value),
    placeholder: "2x25 sq.mm"
  })), React.createElement(PField, {
    label: "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D\u0E15\u0E39\u0E49 MDB"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.mdbBrand,
    onChange: e => set("mdbBrand", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Schneider"
  }))), React.createElement(SurveyToggle, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E19\u0E34\u0E14\u0E01\u0E31\u0E19\u0E14\u0E39\u0E14 (RCD / RCCB)",
    hint: "\u0E21\u0E35\u0E1C\u0E25\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    value: f.rccb,
    onChange: v => set("rccb", v),
    options: PERMIT_YESNO
  })), f.permitType === "biz" && React.createElement(SurveyBlock, {
    title: "\uD83C\uDFED \u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    sub: "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19/\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07 (kVA)",
    required: true
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.trafoKva,
    onChange: e => set("trafoKva", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 250"
  })), React.createElement(PField, {
    label: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19",
    hint: "\u0E40\u0E0A\u0E48\u0E19 22 kV / 400 V"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.trafoVolt,
    onChange: e => set("trafoVolt", e.target.value),
    placeholder: "22 kV"
  }))))), step === 3 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\u2600\uFE0F \u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 kWp (\u0E1D\u0E31\u0E48\u0E07 DC)",
    required: true
  }, React.createElement("input", {
    inputMode: "decimal",
    style: P_INPUT,
    value: f.kwp,
    onChange: e => set("kwp", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10.4"
  })), React.createElement(PField, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E25\u0E34\u0E15 kW (\u0E1D\u0E31\u0E48\u0E07 AC)",
    hint: "\u0E15\u0E32\u0E21\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    inputMode: "decimal",
    style: P_INPUT,
    value: f.kwac,
    onChange: e => set("kwac", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10"
  })), React.createElement(PField, {
    label: "\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C AC \u0E02\u0E2D\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    required: true,
    hint: "\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49 MDB"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.acBreaker,
    onChange: e => set("acBreaker", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 32A 2P"
  })), React.createElement(PField, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08",
    required: true
  }, React.createElement("input", {
    type: "date",
    style: P_INPUT,
    value: f.doneDate,
    onChange: e => set("doneDate", e.target.value)
  }))), React.createElement(SurveyToggle, {
    label: "\u0E21\u0E35 DC Isolator",
    value: f.dcIsolator,
    onChange: v => set("dcIsolator", v),
    options: PERMIT_YESNO
  }), React.createElement(SurveyToggle, {
    label: "\u0E21\u0E35\u0E23\u0E30\u0E1A\u0E1A\u0E01\u0E31\u0E19\u0E44\u0E1F\u0E44\u0E2B\u0E25\u0E22\u0E49\u0E2D\u0E19 (Zero Export / ELD)",
    hint: "\u0E16\u0E49\u0E32\u0E21\u0E35 \u0E15\u0E49\u0E2D\u0E07\u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E08\u0E38\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07 CT \u0E14\u0E49\u0E27\u0E22",
    value: f.zeroExport,
    onChange: v => set("zeroExport", v),
    options: PERMIT_YESNO
  }), f.zeroExport === "yes" && React.createElement(PField, {
    label: "\u0E23\u0E38\u0E48\u0E19\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E01\u0E31\u0E19\u0E44\u0E1F\u0E44\u0E2B\u0E25\u0E22\u0E49\u0E2D\u0E19 (ELD / Smart Meter)",
    hint: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E02\u0E2D\u0E2A\u0E40\u0E1B\u0E01\u0E15\u0E31\u0E27\u0E19\u0E35\u0E49\u0E14\u0E49\u0E27\u0E22"
  }, React.createElement("input", {
    style: P_INPUT,
    value: f.eldModel,
    onChange: e => set("eldModel", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Huawei Smart Power Sensor DTSU666-H"
  }))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD27 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    sub: "\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30\u0E15\u0E31\u0E27 \u0E1E\u0E23\u0E49\u0E2D\u0E21 Serial \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17 \u2014 \u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, (f.invs || []).map((iv, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(PField, {
    label: "ตัวที่ " + (i + 1) + " — รุ่น",
    required: true
  }, React.createElement(Dropdown, {
    value: iv.model,
    onChange: v => setInv(i, "model", v),
    options: modelOptions("inverter", iv.model),
    placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(PField, {
    label: "Serial",
    required: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: iv.sn,
    onChange: e => setInv(i, "sn", e.target.value),
    placeholder: "\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17"
  }))), (f.invs || []).length > 1 && React.createElement("button", {
    type: "button",
    onClick: () => delInv(i),
    title: "\u0E25\u0E1A\u0E15\u0E31\u0E27\u0E19\u0E35\u0E49",
    style: {
      width: 38,
      height: 38,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14
  })))), React.createElement("button", {
    type: "button",
    onClick: addInv,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    sw: 2.4
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E35\u0E01\u0E15\u0E31\u0E27"))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD06 \u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C",
    sub: "Serial \u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 1\u20132 \u0E41\u0E1C\u0E48\u0E19\u0E1E\u0E2D \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E25\u0E48\u0E17\u0E38\u0E01\u0E41\u0E1C\u0E48\u0E19"
  }, React.createElement(PGrid, null, React.createElement(PField, {
    label: "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07",
    required: true,
    full: true
  }, React.createElement(Dropdown, {
    value: f.panelModel,
    onChange: v => set("panelModel", v),
    options: modelOptions("panel", f.panelModel),
    placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"
  })), React.createElement(PField, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E07 (W)"
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.panelWatt,
    onChange: e => set("panelWatt", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 620"
  })), React.createElement(PField, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07",
    required: true
  }, React.createElement("input", {
    inputMode: "numeric",
    style: P_INPUT,
    value: f.panelQty,
    onChange: e => set("panelQty", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 16"
  })), React.createElement(PField, {
    label: "Serial \u0E41\u0E1C\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48 1",
    required: true,
    full: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: (f.panelSns || [])[0] || "",
    onChange: e => setSn(0, e.target.value),
    placeholder: "\u0E2D\u0E48\u0E32\u0E19\u0E08\u0E32\u0E01\u0E2A\u0E15\u0E34\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07"
  })), React.createElement(PField, {
    label: "Serial \u0E41\u0E1C\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48 2",
    full: true
  }, React.createElement("input", {
    style: P_INPUT,
    value: (f.panelSns || [])[1] || "",
    onChange: e => setSn(1, e.target.value),
    placeholder: "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A"
  })))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCCD \u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"
  }, React.createElement(PField, {
    label: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 (GPS)",
    hint: "\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E02\u0E2D\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E08\u0E38\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E04\u0E33\u0E02\u0E2D"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    type: "button",
    onClick: captureGps,
    disabled: gpsBusy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: gpsBusy ? "wait" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 14,
    color: "#fff"
  }), " ", gpsBusy ? "กำลังจับพิกัด…" : f.gps ? "จับพิกัดใหม่" : "จับพิกัดตรงนี้"), f.gps && React.createElement("span", {
    style: {
      fontSize: 12,
      fontFamily: "var(--mono)",
      color: "var(--text-2)"
    }
  }, f.gps.lat, ", ", f.gps.lng, " ", React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\xB1", f.gps.acc, "m")), gpsErr && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 600
    }
  }, gpsErr))), React.createElement(PField, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E16\u0E36\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",
    hint: "\u0E40\u0E0A\u0E48\u0E19 \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19 / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E27\u0E31\u0E19\u0E15\u0E23\u0E27\u0E08"
  }, React.createElement("textarea", {
    rows: 3,
    style: Object.assign({}, P_INPUT, {
      resize: "vertical"
    }),
    value: f.note,
    onChange: e => set("note", e.target.value),
    placeholder: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E47\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49"
  })))), step === 4 && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      fontSize: 12,
      color: "var(--tint-amber-tx)",
      fontWeight: 600,
      lineHeight: 1.5
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E01\u0E25\u0E32\u0E07\u0E41\u0E14\u0E14\u0E08\u0E49\u0E32\u0E41\u0E25\u0E49\u0E27\u0E40\u0E19\u0E21\u0E40\u0E1E\u0E25\u0E17\u0E21\u0E31\u0E01\u0E2A\u0E30\u0E17\u0E49\u0E2D\u0E19\u0E08\u0E19\u0E2D\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 \u2014 \u0E43\u0E0A\u0E49\u0E21\u0E37\u0E2D\u0E1A\u0E31\u0E07\u0E40\u0E07\u0E32\u0E41\u0E25\u0E49\u0E27\u0E16\u0E48\u0E32\u0E22\u0E43\u0E01\u0E25\u0E49 \u0E46 \u0E08\u0E30\u0E1C\u0E48\u0E32\u0E19\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E23\u0E2D\u0E1A\u0E41\u0E23\u0E01", React.createElement("span", {
    style: {
      display: "block",
      marginTop: 3,
      fontWeight: 700
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27 ", photoDone, "/", shownSlots.length, " \u0E0A\u0E48\u0E2D\u0E07")), PERMIT_PHOTO_GROUPS.map(g => {
    const list = shownSlots.filter(s => s.group === g);
    if (!list.length) return null;
    return React.createElement(SurveyBlock, {
      key: g,
      title: g
    }, React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 9
      }
    }, list.map(s => React.createElement(PermitShotCard, {
      key: s.key,
      slot: s,
      shot: media.photos[s.key],
      busy: busySlot === s.key,
      onPick: file => pickPhoto(s.key, file),
      onRemove: () => media.removePhoto(s.key)
    }))));
  })), step === 5 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: prog.missing.length ? "⚠️ ยังขาดอีก " + prog.missing.length + " อย่าง" : "✅ เก็บครบแล้ว",
    sub: prog.missing.length ? "แตะรายการเพื่อกระโดดไปหน้าที่ต้องแก้" : "กดส่งต่อได้เลย ฝ่ายขออนุญาตจะได้รับแจ้งเตือนทันที"
  }, prog.missing.length === 0 ? React.createElement("div", {
    style: {
      padding: "18px 0",
      textAlign: "center",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E30\u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, prog.missing.map((m, i) => React.createElement("button", {
    key: i,
    onClick: () => setStep(m.step),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderRadius: 10,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit",
      width: "100%",
      border: "1px solid var(--tint-red-bd)",
      background: "var(--tint-red-bg)"
    }
  }, React.createElement(Icon, {
    name: m.kind === "photo" ? "camera" : "pen",
    size: 14,
    color: "var(--tint-red-tx)"
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--tint-red-tx)"
    }
  }, m.th), React.createElement(Icon, {
    name: "chevronRight",
    size: 14,
    color: "var(--tint-red-tx)"
  }))))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCE4 \u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15",
    sub: "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27\u0E22\u0E31\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E14\u0E49 \u0E16\u0E49\u0E32\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E01\u0E14\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19"
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.6
    }
  }, "\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E35\u0E49\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E25\u0E38\u0E21\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E01\u0E47\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19, Single Line Diagram \u0E25\u0E07\u0E19\u0E32\u0E21\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23, \u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 \u0E41\u0E25\u0E30\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D \u0E01\u0E01\u0E1E. \u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E31\u0E14\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E15\u0E48\u0E2D"), React.createElement("button", {
    type: "button",
    onClick: doSubmit,
    disabled: prog.missing.length > 0,
    style: {
      width: "100%",
      padding: "13px 16px",
      borderRadius: 12,
      border: "none",
      marginTop: 4,
      background: prog.missing.length ? "var(--surface3)" : "var(--primary)",
      color: prog.missing.length ? "var(--text-3)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: prog.missing.length ? "not-allowed" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 17,
    color: prog.missing.length ? "var(--text-3)" : "#fff"
  }), prog.missing.length ? "กรอกให้ครบก่อนถึงจะส่งได้" : "ส่งต่อแอดมินขออนุญาต")))), React.createElement("div", {
    style: {
      padding: "12px 18px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom, 0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: () => setStep(s => Math.max(1, s - 1)),
    disabled: step === 1,
    style: {
      padding: "11px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: step === 1 ? "var(--text-3)" : "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: step === 1 ? "default" : "pointer"
    }
  }, "\u0E22\u0E49\u0E2D\u0E19"), React.createElement("button", {
    onClick: () => {
      save();
      onClose();
    },
    style: {
      flex: 1,
      padding: "11px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), React.createElement("button", {
    onClick: () => setStep(s => Math.min(5, s + 1)),
    disabled: step === 5,
    style: {
      padding: "11px 20px",
      borderRadius: 11,
      border: "none",
      background: step === 5 ? "var(--surface3)" : "var(--primary)",
      color: step === 5 ? "var(--text-3)" : "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: step === 5 ? "default" : "pointer"
    }
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B"))));
}
Object.assign(window, {
  PermitWizard,
  blankPermit,
  usePermitPhotos,
  permitProgress,
  permitMissing,
  permitStatusOf,
  PERMIT_PHOTO_SLOTS,
  PERMIT_SLOT_BY,
  PERMIT_STEPS,
  PERMIT_STATUS,
  PERMIT_TYPES
});