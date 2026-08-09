function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SURVEY_ROOF_TYPES = window.BOQ && window.BOQ.ROOF_OPTIONS && window.BOQ.ROOF_OPTIONS.length ? window.BOQ.ROOF_OPTIONS : ["เมทัลชีท", "กระเบื้องลอนคู่", "CPAC", "พื้นคอนกรีต (Slab)", "Shingle Roof", "อื่นๆ"];
const SURVEY_ROOF_COND = [{
  value: "good",
  label: "ดี (แข็งแรง)"
}, {
  value: "fair",
  label: "พอใช้"
}, {
  value: "poor",
  label: "ทรุดโทรม / ต้องเสริม"
}];
const SURVEY_SHADING_TAGS = ["ต้นไม้", "อาคารข้างเคียง", "เสาไฟ / สายไฟ", "ถังเก็บน้ำ", "ปล่องระบายอากาศ", "อื่นๆ"];
const SURVEY_INV_LOC = [{
  value: "indoor",
  label: "ในอาคาร (Indoor)"
}, {
  value: "outdoor",
  label: "นอกอาคาร (Outdoor)"
}];
const SURVEY_MDB_SPACE = [{
  value: "free",
  label: "มีช่องว่างเพียงพอ"
}, {
  value: "tight",
  label: "มีช่องว่างจำกัด"
}, {
  value: "full",
  label: "เต็ม / ต้องเพิ่มตู้"
}];
const SURVEY_PHOTO_SLOTS = [{
  key: "meter",
  label: "มิเตอร์ไฟฟ้า",
  hint: "ให้เห็นเลขมิเตอร์และขนาดชัดเจน"
}, {
  key: "mdb",
  label: "ภายในตู้ MDB (เปิดฝา)",
  hint: "เห็นเมนเบรกเกอร์และช่องว่าง"
}, {
  key: "roof",
  label: "ภาพรวมหลังคา",
  hint: "มุมกว้างเห็นพื้นที่ติดตั้ง"
}, {
  key: "truss",
  label: "โครงสร้าง / จันทันหลังคา",
  hint: "ดูความแข็งแรงของโครงสร้าง"
}, {
  key: "inverter",
  label: "จุดติดตั้งอินเวอร์เตอร์",
  hint: "ตำแหน่งที่จะติดตั้งจริง"
}];
function surveyStatus(job) {
  const s = job && job.survey;
  if (s && s.skip) return {
    state: "skip",
    pct: 100,
    label: "ไม่ต้องสำรวจ",
    color: "var(--tint-green-tx)"
  };
  if (!s || !s.startedAt) return {
    state: "none",
    pct: 0,
    label: "ยังไม่สำรวจ",
    color: "#94A3B8"
  };
  const fields = [!!(s.gps && s.gps.lat), !!s.meterSize, !!s.phase, !!s.roofType, !!(s.roofPitch !== "" && s.roofPitch != null), !!s.mdbBrand, !!s.mainBreaker, !!s.inverterLoc];
  const photos = s.photos || {};
  const checks = fields.concat(SURVEY_PHOTO_SLOTS.map(p => !!photos[p.key]));
  const done = checks.filter(Boolean).length;
  const pct = Math.round(done / checks.length * 100);
  if (pct >= 100) return {
    state: "done",
    pct: 100,
    label: "สำรวจครบ",
    color: "var(--tint-green-tx)"
  };
  return {
    state: "partial",
    pct,
    label: "สำรวจบางส่วน",
    color: "#F59E0B"
  };
}
function blankSurvey(job) {
  return {
    startedAt: "",
    updatedAt: "",
    completedAt: "",
    byName: "",
    gps: null,
    meterSize: "",
    phase: String(job && job.phase || "1") === "3" ? "3" : "1",
    roofType: job && job.roof || "",
    roofAge: "",
    roofCondition: "",
    roofPitch: "",
    azimuth: "",
    shadingTags: [],
    shadingNote: "",
    mdbBrand: "",
    mainBreaker: "",
    mdbSpace: "",
    inverterLoc: "",
    cableRun: "",
    photos: {}
  };
}
function useSurveyPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setPhotos({});
      return;
    }
    const ref = window.FBDB.ref("surveyPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setPhotos(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).set({
      slot,
      dataUrl,
      by: user && user.id || null,
      byName: user && user.name || "-",
      at: new Date().toISOString()
    });
  }, [jobId]);
  const removePhoto = React.useCallback(slot => {
    if (jobId && window.FBDB) window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return {
    photos,
    setPhoto,
    removePhoto
  };
}
function SurveyBlock({
  title,
  sub,
  children
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)",
      letterSpacing: ".01em"
    }
  }, title), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, sub)), children);
}
function SurveyPhotoSlot({
  slot,
  photo,
  busy,
  onPick,
  onRemove
}) {
  const inputRef = React.useRef(null);
  const has = !!photo;
  return React.createElement("div", {
    style: {
      border: "1px solid " + (has ? "var(--primary)" : "var(--border-strong)"),
      borderRadius: 12,
      padding: 11,
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: has ? "var(--primary-soft)" : "var(--surface2)"
    }
  }, React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 99,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: has ? "var(--primary)" : "var(--surface3)",
      color: "#fff"
    }
  }, has ? React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff",
    sw: 2.6
  }) : React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "var(--text-3)"
  })), has ? React.createElement("img", {
    src: photo.dataUrl,
    alt: slot.label,
    onClick: () => onPick(inputRef),
    style: {
      width: 52,
      height: 52,
      borderRadius: 9,
      objectFit: "cover",
      cursor: "pointer",
      flexShrink: 0,
      border: "1px solid var(--border)"
    }
  }) : null, React.createElement("span", {
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
  }, slot.label), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)"
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
      const f = e.target.files && e.target.files[0];
      if (f) onPick(null, f);
      e.target.value = "";
    }
  }), React.createElement("div", {
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
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: busy ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 13,
    color: has ? "var(--text-2)" : "#fff"
  }), busy ? "..." : has ? "ถ่ายใหม่" : "ถ่าย/อัปโหลด"), has && React.createElement("button", {
    type: "button",
    onClick: () => onRemove(slot.key),
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "none",
      background: "#EF444414",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 13
  }))));
}
const SURVEY_STEPS = [{
  n: 1,
  icon: "pin",
  th: "เช็คอิน & มิเตอร์"
}, {
  n: 2,
  icon: "box",
  th: "โครงสร้างหลังคา"
}, {
  n: 3,
  icon: "bolt",
  th: "ไฟฟ้า & ตำแหน่ง"
}, {
  n: 4,
  icon: "image",
  th: "รูปถ่ายบังคับ"
}];
function SurveyWizard({
  job,
  onClose,
  onSave,
  currentUser
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const media = useSurveyPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankSurvey(job), job && job.survey || {}));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const toggleTag = t => setF(p => {
    const cur = p.shadingTags || [];
    return Object.assign({}, p, {
      shadingTags: cur.includes(t) ? cur.filter(x => x !== t) : cur.concat([t])
    });
  });
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
  const pickPhoto = async (slotKey, fileRefOrNull, file) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1100, 0.72);
      media.setPhoto(slotKey, dataUrl, currentUser);
    } catch (err) {
      alert("เพิ่มรูปไม่สำเร็จ: " + err.message);
    }
    setBusySlot(null);
  };
  const st = surveyStatus(Object.assign({}, job, {
    survey: Object.assign({}, f, {
      photos: photoFlags()
    })
  }));
  function photoFlags() {
    const m = {};
    SURVEY_PHOTO_SLOTS.forEach(p => {
      if (media.photos[p.key]) m[p.key] = true;
    });
    return m;
  }
  const save = () => {
    const now = new Date().toISOString();
    const photos = photoFlags();
    const complete = surveyStatus(Object.assign({}, job, {
      survey: Object.assign({}, f, {
        startedAt: f.startedAt || now,
        photos
      })
    })).state === "done";
    const out = Object.assign({}, f, {
      photos,
      startedAt: f.startedAt || now,
      updatedAt: now,
      completedAt: complete ? f.completedAt || now : "",
      byName: currentUser && currentUser.name || f.byName || ""
    });
    if (onSave) onSave(out);
  };
  const labelStyle = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  const fld = (label, child, req) => React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: labelStyle
  }, label, req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), child);
  const numStyle = Object.assign({}, inputStyle, {
    textAlign: "left"
  });
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 115,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(680px,100%)",
      maxHeight: isMobile ? "96dvh" : "94vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 ", job ? job.code : ""), React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: "2px 0 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job ? job.name : "")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: st.color
    }
  }, st.pct, "%"), React.createElement("button", {
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
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 13
    }
  }, SURVEY_STEPS.map(s => {
    const active = s.n === step,
      done = s.n < step;
    return React.createElement("button", {
      key: s.n,
      onClick: () => setStep(s.n),
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0
      }
    }, React.createElement("span", {
      style: {
        width: "100%",
        height: 4,
        borderRadius: 99,
        background: active || done ? "var(--primary)" : "var(--surface3)"
      }
    }), React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: isMobile ? 0 : 11,
        fontWeight: active ? 800 : 600,
        color: active ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: s.icon,
      size: 13,
      color: active ? "var(--primary-dark)" : "var(--text-3)"
    }), !isMobile && s.th));
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      flex: 1,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13,
      background: "var(--surface2)"
    }
  }, step === 1 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDCCD \u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E34\u0E19 \u2014 \u0E1E\u0E34\u0E01\u0E31\u0E14 GPS",
    sub: "\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"
  }, React.createElement("button", {
    type: "button",
    onClick: captureGps,
    disabled: gpsBusy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "11px 14px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: gpsBusy ? "default" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 16,
    color: "#fff"
  }), gpsBusy ? "กำลังจับพิกัด..." : f.gps ? "จับพิกัดใหม่" : "จับพิกัด GPS ปัจจุบัน"), gpsErr && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 600
    }
  }, "\u26A0 ", gpsErr), f.gps && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "10px 12px",
      background: "var(--surface2)",
      borderRadius: 10,
      border: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, f.gps.lat, ", ", f.gps.lng, f.gps.acc ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, " \xB7 \xB1", f.gps.acc, "m") : null), React.createElement("a", {
    href: "https://www.google.com/maps?q=" + f.gps.lat + "," + f.gps.lng,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--primary-dark)",
      fontSize: 12,
      fontWeight: 700,
      textDecoration: "none",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"))), React.createElement(SurveyBlock, {
    title: "\u26A1 \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E14\u0E34\u0E21"
  }, fld("ขนาดมิเตอร์ไฟฟ้า", React.createElement("input", {
    value: f.meterSize,
    onChange: e => set("meterSize", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 15(45)A",
    style: inputStyle
  }), true), fld("ระบบไฟฟ้า (เฟส)", React.createElement(Segmented, {
    value: f.phase,
    onChange: v => set("phase", v),
    options: [{
      value: "1",
      label: "1 เฟส"
    }, {
      value: "3",
      label: "3 เฟส"
    }]
  }), true))), step === 2 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83C\uDFE0 \u0E0A\u0E19\u0E34\u0E14 & \u0E2A\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"
  }, fld("ประเภทหลังคา", React.createElement(Dropdown, {
    value: f.roofType,
    onChange: v => set("roofType", v),
    addable: true,
    onAdd: () => {},
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",
    options: SURVEY_ROOF_TYPES.map(r => ({
      value: r,
      label: r
    }))
  }), true), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, fld("อายุหลังคา (ปี)", React.createElement("input", {
    type: "number",
    value: f.roofAge,
    onChange: e => set("roofAge", e.target.value),
    placeholder: "\u0E1B\u0E35",
    style: numStyle
  })), fld("สภาพหลังคา", React.createElement(Dropdown, {
    value: f.roofCondition,
    onChange: v => set("roofCondition", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_ROOF_COND
  })))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCD0 \u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    sub: "\u0E04\u0E27\u0E32\u0E21\u0E25\u0E32\u0E14\u0E40\u0E2D\u0E35\u0E22\u0E07 \u0E41\u0E25\u0E30\u0E17\u0E34\u0E28\u0E2B\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (Azimuth)"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, fld("ความลาดเอียง (องศา)", React.createElement("input", {
    type: "number",
    value: f.roofPitch,
    onChange: e => set("roofPitch", e.target.value),
    placeholder: "0\u201390\xB0",
    style: numStyle
  }), true), fld("ทิศหัน / Azimuth (องศา)", React.createElement("input", {
    type: "number",
    value: f.azimuth,
    onChange: e => set("azimuth", e.target.value),
    placeholder: "0=N 90=E 180=S",
    style: numStyle
  }))), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, "0\xB0 = \u0E17\u0E34\u0E28\u0E40\u0E2B\u0E19\u0E37\u0E2D \xB7 90\xB0 = \u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E2D\u0E2D\u0E01 \xB7 180\xB0 = \u0E17\u0E34\u0E28\u0E43\u0E15\u0E49 \xB7 270\xB0 = \u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01")), React.createElement(SurveyBlock, {
    title: "\uD83C\uDF33 \u0E2A\u0E34\u0E48\u0E07\u0E01\u0E35\u0E14\u0E02\u0E27\u0E32\u0E07 / \u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07",
    sub: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E08\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E41\u0E2A\u0E07\u0E41\u0E14\u0E14"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, SURVEY_SHADING_TAGS.map(t => {
    const on = (f.shadingTags || []).includes(t);
    return React.createElement("button", {
      key: t,
      type: "button",
      onClick: () => toggleTag(t),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, on && React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "var(--primary-dark)",
      sw: 2.6
    }), t);
  })), React.createElement("textarea", {
    value: f.shadingNote,
    onChange: e => set("shadingNote", e.target.value),
    placeholder: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 \u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E49\u0E19\u0E44\u0E21\u0E49\u0E2A\u0E39\u0E07 5 \u0E21. \u0E17\u0E32\u0E07\u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01 \u0E1A\u0E31\u0E07\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22",
    rows: 2,
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.5
    })
  }))), step === 3 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0C \u0E15\u0E39\u0E49\u0E40\u0E21\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 (MDB)"
  }, fld("ยี่ห้อ / รุ่นตู้ MDB", React.createElement("input", {
    value: f.mdbBrand,
    onChange: e => set("mdbBrand", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Schneider, ABB, Haco",
    style: inputStyle
  }), true), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, fld("ขนาดเมนเบรกเกอร์", React.createElement("input", {
    value: f.mainBreaker,
    onChange: e => set("mainBreaker", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 100A, 3P",
    style: inputStyle
  }), true), fld("ช่องว่างในตู้", React.createElement(Dropdown, {
    value: f.mdbSpace,
    onChange: v => set("mdbSpace", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_MDB_SPACE
  })))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0B \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, fld("ตำแหน่งที่เสนอติดตั้ง", React.createElement(Segmented, {
    value: f.inverterLoc,
    onChange: v => set("inverterLoc", v),
    options: SURVEY_INV_LOC
  }), true), fld("ระยะเดินสายโดยประมาณ (เมตร)", React.createElement("input", {
    type: "number",
    value: f.cableRun,
    onChange: e => set("cableRun", e.target.value),
    placeholder: "\u0E23\u0E30\u0E22\u0E30\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07 \u2192 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2192 MDB",
    style: numStyle
  })))), step === 4 && React.createElement(SurveyBlock, {
    title: "\uD83D\uDCF7 \u0E23\u0E39\u0E1B\u0E16\u0E48\u0E32\u0E22\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A (Checklist)",
    sub: "ถ่ายให้ครบทั้ง " + SURVEY_PHOTO_SLOTS.length + " รูป เพื่อให้การสำรวจสมบูรณ์"
  }, !window.FBDB && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd)",
      borderRadius: 9,
      padding: "9px 11px"
    }
  }, "\u26A0 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Firebase \u0E08\u0E36\u0E07\u0E08\u0E30\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, SURVEY_PHOTO_SLOTS.map(slot => React.createElement(SurveyPhotoSlot, {
    key: slot.key,
    slot: slot,
    photo: media.photos[slot.key],
    busy: busySlot === slot.key,
    onPick: (ref, file) => {
      if (file) pickPhoto(slot.key, null, file);
    },
    onRemove: k => {
      if (confirm("ลบรูปนี้?")) media.removePhoto(k);
    }
  }))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, step > 1 ? React.createElement("button", {
    onClick: () => setStep(s => s - 1),
    style: {
      flex: "0 0 auto",
      padding: "12px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    color: "var(--text-2)",
    style: {
      transform: "scaleX(-1)"
    }
  }), " \u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A") : React.createElement("button", {
    onClick: onClose,
    style: {
      flex: "0 0 auto",
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
  }, "\u0E1B\u0E34\u0E14"), step < 4 ? React.createElement("button", {
    onClick: () => setStep(s => s + 1),
    style: {
      flex: 1,
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B ", React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "#fff"
  })) : React.createElement("button", {
    onClick: save,
    style: {
      flex: 1,
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E27\u0E08"))));
}
Object.assign(window, {
  SurveyWizard,
  surveyStatus,
  blankSurvey,
  useSurveyPhotos,
  SURVEY_PHOTO_SLOTS,
  SURVEY_STEPS
});