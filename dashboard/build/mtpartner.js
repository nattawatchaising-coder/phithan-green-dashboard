function useMtPartnerData(p) {
  const ids = Object.keys(p && p.sites || {}).map(Number).filter(n => n > 0).sort((a, b) => a - b).join(",");
  const [sites, setSites] = React.useState({});
  const [status, setStatus] = React.useState({});
  React.useEffect(() => {
    setSites({});
    setStatus({});
    if (!ids || !window.FBDB) return;
    const offs = [];
    ids.split(",").forEach(n => {
      const r1 = window.FBDB.ref("mtSites/" + n),
        r2 = window.FBDB.ref("mtStatus/" + n);
      const h1 = r1.on("value", s => setSites(o => Object.assign({}, o, {
        [n]: s.val()
      })), () => setSites(o => Object.assign({}, o, {
        [n]: null
      })));
      const h2 = r2.on("value", s => setStatus(o => Object.assign({}, o, {
        [n]: s.val()
      })), () => {});
      offs.push(() => {
        r1.off("value", h1);
        r2.off("value", h2);
      });
    });
    return () => offs.forEach(f => f());
  }, [ids]);
  const want = ids ? ids.split(",") : [];
  const list = want.filter(n => sites[n]).map(n => Object.assign({}, sites[n], {
    n: Number(n)
  }));
  return {
    list,
    loading: want.some(n => !(n in sites)),
    status
  };
}
function mtLogoFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error("เลือกไฟล์รูปภาพ (PNG / JPG)"));
    const rd = new FileReader();
    rd.onerror = () => reject(new Error("อ่านไฟล์ไม่ได้"));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("เปิดรูปไม่ได้"));
      img.onload = () => {
        const k = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * k));
        c.height = Math.max(1, Math.round(img.height * k));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        let url = file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
        if (url.length > 280000) url = c.toDataURL("image/jpeg", 0.7);
        if (url.length > 280000) return reject(new Error("รูปใหญ่เกินไป ลองรูปที่เล็กลง"));
        resolve(url);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}
const mtFld = () => Object.assign({}, mtField, {
  background: "var(--surface2)",
  boxShadow: "var(--shadow-inset)"
});
const mtPCard = () => window.mtPanel({
  display: "flex",
  flexDirection: "column",
  gap: 14
});
function MtCompanyForm({
  pid,
  company,
  self,
  onDone
}) {
  const c = company || {};
  const init = {
    name: c.name || "",
    tax: c.tax || "",
    branch: c.branch || "",
    addr: c.addr || "",
    phone: c.phone || "",
    email: c.email || "",
    logo: c.logo || ""
  };
  const [f, setF] = React.useState(init);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const dirty = Object.keys(init).some(k => init[k] !== f[k]);
  const set = (k, v) => {
    setMsg("");
    setF(Object.assign({}, f, {
      [k]: v
    }));
  };
  const take = async file => {
    setErr("");
    try {
      set("logo", await mtLogoFromFile(file));
    } catch (x) {
      setErr(String(x.message || x));
    }
  };
  const pick = e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    take(file);
  };
  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await mtCall(Object.assign({
        action: "company",
        company: f
      }, self ? {} : {
        pid
      }));
      setMsg("บันทึกแล้ว");
      if (onDone) onDone();
    } catch (x) {
      setErr(String(x.message || x));
    }
    setBusy(false);
  };
  const fld = mtFld();
  const row = (k, label, ph, span, mono) => React.createElement("div", {
    style: {
      gridColumn: span ? "1 / -1" : undefined
    }
  }, React.createElement("div", {
    style: mtLbl
  }, label), React.createElement("input", {
    value: f[k],
    placeholder: ph || "",
    onChange: e => set(k, k === "tax" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value),
    style: Object.assign({}, fld, mono ? {
      fontFamily: "var(--mono)"
    } : {})
  }));
  const P = k => "var(--paper-" + k + ")";
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: 14,
      alignItems: "start"
    }
  }, React.createElement("div", {
    style: mtPCard()
  }, React.createElement(window.MtHead, {
    icon: "building",
    color: "var(--primary)",
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17",
    sub: "\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E1A\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E17\u0E38\u0E01\u0E44\u0E0B\u0E15\u0E4C\u0E02\u0E2D\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49"
  }), React.createElement("label", {
    onDragOver: e => {
      e.preventDefault();
      setDrag(true);
    },
    onDragLeave: () => setDrag(false),
    onDrop: e => {
      e.preventDefault();
      setDrag(false);
      take(e.dataTransfer.files && e.dataTransfer.files[0]);
    },
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      padding: 12,
      borderRadius: "var(--r-tile)",
      cursor: "pointer",
      background: drag ? "var(--primary-soft)" : "var(--surface2)",
      boxShadow: drag ? "inset 0 0 0 1.5px var(--primary)" : "var(--shadow-inset)"
    }
  }, React.createElement("div", {
    style: {
      width: 132,
      height: 76,
      borderRadius: 12,
      background: "var(--paper-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "var(--shadow-sm)"
    }
  }, f.logo ? React.createElement("img", {
    src: f.logo,
    alt: "",
    style: {
      maxWidth: "90%",
      maxHeight: "86%",
      objectFit: "contain"
    }
  }) : React.createElement(Icon, {
    name: "image",
    size: 26,
    color: "var(--paper-mute)"
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, f.logo ? "เปลี่ยนโลโก้" : "เพิ่มโลโก้บริษัท"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E04\u0E25\u0E34\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E32\u0E01\u0E23\u0E39\u0E1B\u0E21\u0E32\u0E27\u0E32\u0E07 \xB7 PNG \u0E1E\u0E37\u0E49\u0E19\u0E43\u0E2A\u0E2A\u0E27\u0E22\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E48\u0E2D\u0E23\u0E39\u0E1B\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07"), f.logo && React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-dngr",
    onClick: e => {
      e.preventDefault();
      set("logo", "");
    },
    style: {
      marginTop: 6
    }
  }, "\u0E40\u0E2D\u0E32\u0E42\u0E25\u0E42\u0E01\u0E49\u0E2D\u0E2D\u0E01")), React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp",
    onChange: pick,
    style: {
      display: "none"
    }
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12
    }
  }, row("name", "ชื่อบริษัท", "เช่น บริษัท พลังแดด จำกัด", true), row("tax", "เลขประจำตัวผู้เสียภาษี", "13 หลัก", false, true), row("branch", "สาขา", "สำนักงานใหญ่"), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement("div", {
    style: mtLbl
  }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), React.createElement("textarea", {
    rows: 3,
    value: f.addr,
    onChange: e => set("addr", e.target.value),
    style: Object.assign({}, fld, {
      resize: "vertical"
    })
  })), row("phone", "โทร"), row("email", "อีเมล")), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      alignItems: "center"
    }
  }, msg && !dirty && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700,
      display: "inline-flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    sw: 2.6
  }), msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy || !dirty,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "บันทึกข้อมูลบริษัท"))), React.createElement("div", {
    style: mtPCard()
  }, React.createElement(window.MtHead, {
    icon: "eye",
    title: "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2B\u0E31\u0E27\u0E1A\u0E34\u0E25",
    sub: "\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E32\u0E1A\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A"
  }), React.createElement("div", {
    style: {
      background: P("bg"),
      color: P("ink"),
      borderRadius: 12,
      boxShadow: "var(--shadow-sm)",
      padding: "18px 18px 14px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flex: "1 1 200px",
      minWidth: 0
    }
  }, f.logo && React.createElement("img", {
    src: f.logo,
    alt: "",
    style: {
      maxHeight: 52,
      maxWidth: 110,
      objectFit: "contain"
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      color: P("ink2"),
      lineHeight: 1.5,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: P("ink")
    }
  }, f.name || React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")), f.addr && React.createElement("div", {
    style: {
      whiteSpace: "pre-line"
    }
  }, f.addr), (f.tax || f.phone || f.email) && React.createElement("div", null, [f.tax ? "เลขประจำตัวผู้เสียภาษี " + f.tax + (f.branch ? " (" + f.branch + ")" : "") : "", f.phone ? "โทร " + f.phone : "", f.email].filter(Boolean).join(" · ")))), React.createElement("div", {
    style: {
      textAlign: "right",
      marginLeft: "auto"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: P("brand-dk")
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: P("ink3")
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E41\u0E2A\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C"))), React.createElement("div", {
    style: {
      height: 3,
      borderRadius: 2,
      background: P("brand"),
      margin: "12px 0 10px"
    }
  }), [70, 92, 55].map((w, i) => React.createElement("div", {
    key: i,
    style: {
      height: 7,
      width: w + "%",
      borderRadius: 4,
      background: P("line3"),
      marginBottom: 7
    }
  })))));
}
function MtPinForm() {
  const [old, setOld] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const save = async () => {
    setErr("");
    setMsg("");
    if (pin !== pin2) return setErr("รหัสใหม่สองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      await mtCall({
        action: "partner-pin",
        old,
        pin
      });
      setMsg("เปลี่ยนรหัสแล้ว — ใช้รหัสใหม่ในการเข้าครั้งถัดไป");
      setOld("");
      setPin("");
      setPin2("");
    } catch (x) {
      setErr(String(x.message || x));
    }
    setBusy(false);
  };
  const fld = mtFld();
  const strong = pin.length >= 10 ? 3 : pin.length >= 8 ? 2 : pin.length >= 6 ? 1 : 0;
  const t = show ? "text" : "password";
  return React.createElement("div", {
    style: Object.assign(mtPCard(), {
      maxWidth: 460,
      width: "100%",
      margin: "0 auto"
    })
  }, React.createElement(window.MtHead, {
    icon: "lock",
    color: "var(--primary)",
    title: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    sub: "\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 6 \u0E15\u0E31\u0E27"
  }), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E14\u0E34\u0E21"), React.createElement("input", {
    type: t,
    value: old,
    autoComplete: "current-password",
    onChange: e => setOld(e.target.value),
    style: fld
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48"), React.createElement("input", {
    type: t,
    value: pin,
    autoComplete: "new-password",
    onChange: e => setPin(e.target.value),
    style: fld
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 7
    }
  }, [1, 2, 3].map(i => React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: strong >= i ? strong === 1 ? "var(--tint-amber-tx)" : "var(--tint-ok-tx)" : "var(--surface3)"
    }
  }))), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, pin ? ["สั้นเกินไป", "ใช้ได้", "ดี", "ดีมาก"][strong] : "ยาวกว่า 8 ตัว และผสมตัวเลข/ตัวอักษรจะปลอดภัยกว่า")), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48"), React.createElement("input", {
    type: t,
    value: pin2,
    autoComplete: "new-password",
    onChange: e => setPin2(e.target.value),
    style: fld
  }), pin2 && pin !== pin2 && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-red-tx)",
      marginTop: 4
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48")), React.createElement("label", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      fontSize: 12.5,
      color: "var(--text-2)",
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: show,
    onChange: e => setShow(e.target.checked)
  }), "\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E2B\u0E31\u0E2A"), err && React.createElement("div", {
    style: mtErrBox
  }, err), msg && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy || !old || pin.length < 6 || pin !== pin2,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "เปลี่ยนรหัส"));
}
function MtPartnerEdit({
  p,
  sites,
  partners,
  onClose
}) {
  const isNew = !p;
  const [f, setF] = React.useState({
    name: p && p.name || "",
    username: p && p.username || "",
    pin: "",
    active: !p || p.active !== false,
    sites: Object.keys(p && p.sites || {}).map(Number)
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k, v) => setF(Object.assign({}, f, {
    [k]: v
  }));
  const toggle = n => set("sites", f.sites.includes(n) ? f.sites.filter(x => x !== n) : f.sites.concat(n));
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall({
        action: "partner-save",
        id: p ? p.id : undefined,
        name: f.name,
        username: f.username,
        pin: f.pin || undefined,
        active: f.active,
        sites: f.sites
      });
      onClose();
    } catch (x) {
      setErr(String(x.message || x));
    }
    setBusy(false);
  };
  const fld = mtFld();
  const ownerName = pid => partners[pid] && (partners[pid].company && partners[pid].company.name || partners[pid].name) || pid;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: mtPCard()
  }, React.createElement(window.MtHead, {
    icon: "user",
    color: "var(--primary)",
    title: isNew ? "เพิ่มบัญชีพาร์ทเนอร์" : "บัญชี " + p.name,
    sub: "\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E19\u0E35\u0E49\u0E14\u0E49\u0E27\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19 + \u0E23\u0E2B\u0E31\u0E2A \xB7 \u0E40\u0E2B\u0E47\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E15\u0E34\u0E4A\u0E01\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07"
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 (\u0E04\u0E19/\u0E17\u0E35\u0E21)"), React.createElement("input", {
    value: f.name,
    onChange: e => set("name", e.target.value),
    style: fld,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E38\u0E13\u0E2A\u0E21\u0E0A\u0E32\u0E22 (\u0E19\u0E31\u0E01\u0E25\u0E07\u0E17\u0E38\u0E19)"
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19"), React.createElement("input", {
    value: f.username,
    onChange: e => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "")),
    style: Object.assign({}, fld, {
      fontFamily: "var(--mono)"
    }),
    placeholder: "a-z 0-9 . _ -"
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, isNew ? "รหัสผ่าน (อย่างน้อย 6 ตัว)" : "ตั้งรหัสใหม่ (เว้นว่าง = ใช้รหัสเดิม)"), React.createElement("input", {
    value: f.pin,
    onChange: e => set("pin", e.target.value),
    style: Object.assign({}, fld, {
      fontFamily: "var(--mono)"
    }),
    autoComplete: "new-password"
  }))), React.createElement("label", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      fontSize: 13,
      cursor: "pointer",
      padding: "10px 12px",
      borderRadius: "var(--r-tile)",
      background: f.active ? "var(--tint-ok-bg)" : "var(--tint-red-bg)"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: f.active,
    onChange: e => set("active", e.target.checked)
  }), React.createElement("span", {
    style: {
      fontWeight: 700,
      color: f.active ? "var(--tint-ok-tx)" : "var(--tint-red-tx)"
    }
  }, f.active ? "เปิดใช้งาน" : "ปิดบัญชี"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, f.active ? "เข้าระบบได้" : "เข้าระบบไม่ได้ (ข้อมูลและบิลยังอยู่)"))), React.createElement("div", {
    style: mtPCard()
  }, React.createElement(window.MtHead, {
    icon: "building",
    title: "\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E44\u0E14\u0E49",
    sub: f.sites.length + " ไซต์ · ไซต์ละหนึ่งเจ้าของ — ติ๊กไซต์ที่มีเจ้าของแล้ว = ย้ายมาบัญชีนี้"
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      gap: 10
    }
  }, sites.map(s => {
    const on = f.sites.includes(s.n);
    const other = s.owner && (!p || s.owner !== p.id);
    return React.createElement("button", {
      key: s.n,
      type: "button",
      onClick: () => toggle(s.n),
      style: {
        textAlign: "left",
        border: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        padding: "11px 13px",
        borderRadius: "var(--r-tile)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        boxShadow: on ? "inset 0 0 0 1.5px var(--primary)" : "var(--shadow-sm)",
        color: "inherit"
      }
    }, React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 6,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        marginTop: 1,
        background: on ? "var(--primary)" : "var(--surface2)",
        boxShadow: on ? "none" : "var(--shadow-inset)"
      }
    }, on && React.createElement(Icon, {
      name: "check",
      size: 13,
      color: "#fff",
      sw: 3
    })), React.createElement("span", {
      style: {
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, window.mtCustOf(s).cust || s.name), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        fontFamily: "var(--mono)",
        color: "var(--text-3)"
      }
    }, mtIdent(s)), other && React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--tint-amber-tx)",
        marginTop: 2
      }
    }, "\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49: ", ownerName(s.owner))));
  }), !sites.length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C"))), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: window.mtPanel({
      padding: "12px 16px",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      flexWrap: "wrap",
      position: "sticky",
      bottom: 10,
      zIndex: 2
    })
  }, React.createElement("button", {
    className: "btn",
    onClick: onClose,
    disabled: busy
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "btn btn-pri",
    onClick: save,
    disabled: busy || !f.name || !f.username || isNew && f.pin.length < 6
  }, busy ? "กำลังบันทึก…" : isNew ? "สร้างบัญชี" : "บันทึก")), !isNew && React.createElement(MtCompanyForm, {
    key: p.id + (p.updated_at || ""),
    pid: p.id,
    company: p.company
  }));
}
function MtPartnerAdmin({
  sites,
  onBack
}) {
  const all = useMtRef("mtPartners");
  const [edit, setEdit] = React.useState(null);
  const partners = all || {};
  const list = Object.values(partners).filter(p => p && p.id).sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  const siteBy = {};
  (sites || []).forEach(s => {
    siteBy[s.n] = s;
  });
  const back = React.createElement("button", {
    className: "btn btn-sm",
    onClick: edit ? () => setEdit(null) : onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 14
  }), edit ? "รายชื่อพาร์ทเนอร์" : "ทุกไซต์");
  if (edit) return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", null, back), React.createElement(MtPartnerEdit, {
    key: edit,
    p: edit === "new" ? null : partners[edit],
    sites: sites,
    partners: partners,
    onClose: () => setEdit(null)
  }));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: window.mtPanel({
      display: "flex",
      flexDirection: "column",
      gap: 12
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, back, React.createElement("button", {
    className: "btn btn-pri",
    onClick: () => setEdit("new"),
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, React.createElement(window.MtBubble, {
    icon: "users",
    color: "var(--primary)",
    size: 46
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 22,
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C / \u0E19\u0E31\u0E01\u0E25\u0E07\u0E17\u0E38\u0E19"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E04\u0E48\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E1A\u0E43\u0E2B\u0E49 \xB7 \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E44\u0E0B\u0E15\u0E4C \u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E04\u0E32 \u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49 (\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49)")))), all === undefined ? React.createElement("div", {
    style: mtPCard()
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")) : !list.length ? React.createElement("div", {
    style: window.mtPanel({
      padding: "34px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8
    })
  }, React.createElement(window.MtBubble, {
    icon: "user",
    color: "var(--primary)",
    size: 50
  }), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14 \"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35\" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E41\u0E23\u0E01\u0E41\u0E25\u0E30\u0E21\u0E2D\u0E1A\u0E44\u0E0B\u0E15\u0E4C\u0E43\u0E2B\u0E49")) : React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 14
    }
  }, list.map(p => {
    const ns = Object.keys(p.sites || {}).map(Number).sort((a, b) => a - b);
    const off = p.active === false;
    return React.createElement("button", {
      key: p.id,
      type: "button",
      className: "mt-lift",
      onClick: () => setEdit(p.id),
      style: {
        textAlign: "left",
        border: "none",
        fontFamily: "inherit",
        color: "inherit",
        cursor: "pointer",
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        borderRadius: "var(--r-card)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: off ? 0.7 : 1
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center"
      }
    }, React.createElement("div", {
      style: {
        width: 64,
        height: 44,
        borderRadius: 10,
        background: "var(--paper-bg)",
        boxShadow: "var(--shadow-sm)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        flexShrink: 0
      }
    }, p.company && p.company.logo ? React.createElement("img", {
      src: p.company.logo,
      alt: "",
      style: {
        maxWidth: "88%",
        maxHeight: "80%",
        objectFit: "contain"
      }
    }) : React.createElement(Icon, {
      name: "building",
      size: 20,
      color: "var(--paper-mute)"
    })), React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 700,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, p.company && p.company.name || p.name), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, p.name, " \xB7 ", React.createElement("span", {
      style: {
        fontFamily: "var(--mono)"
      }
    }, p.username))), React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        background: off ? "var(--tint-red-bg)" : "var(--tint-ok-bg)",
        color: off ? "var(--tint-red-tx)" : "var(--tint-ok-tx)"
      }
    }, off ? "ปิดบัญชี" : "ใช้งาน")), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap"
      }
    }, ns.length ? ns.map(n => React.createElement("span", {
      key: n,
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: "var(--r-chip)",
        background: "var(--surface2)",
        color: "var(--text-2)"
      }
    }, siteBy[n] ? window.mtCustOf(siteBy[n]).cust || siteBy[n].name : "SITE" + mtPad(n))) : React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E21\u0E2D\u0E1A\u0E44\u0E0B\u0E15\u0E4C")), !(p.company && p.company.name) && React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--tint-amber-tx)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (\u0E2B\u0E31\u0E27\u0E1A\u0E34\u0E25\u0E08\u0E30\u0E27\u0E48\u0E32\u0E07)"));
  })));
}
function PartnerApp() {
  const uid = window.FBAUTH && window.FBAUTH.currentUser ? window.FBAUTH.currentUser.uid : "";
  const me = useMtRef(uid ? "mtPartners/" + uid : "");
  const [view, setView] = React.useState("sites");
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const logout = async () => {
    const ok = window.askConfirm ? await window.askConfirm({
      title: "ออกจากระบบ?",
      body: "ต้องใส่ชื่อล็อกอินและรหัสอีกครั้งเมื่อกลับมา",
      ok: "ออกจากระบบ",
      icon: "power"
    }) : true;
    if (!ok) return;
    try {
      localStorage.removeItem("solarflow_session_v1");
    } catch (e) {}
    (window.FBAUTH ? window.FBAUTH.signOut() : Promise.resolve()).then(() => location.reload(), () => location.reload());
  };
  const wrap = {
    height: "calc(100dvh - var(--kb, 0px))",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    color: "var(--text-1)",
    background: "radial-gradient(1200px 520px at 85% -10%, color-mix(in srgb, var(--fs-sun, #E8930C) 10%, transparent), transparent 70%)," + " radial-gradient(900px 480px at -10% 0%, color-mix(in srgb, var(--primary) 9%, transparent), transparent 70%), var(--bg)"
  };
  const inner = {
    maxWidth: 1240,
    margin: "0 auto",
    padding: isMobile ? "12px 12px 28px" : "18px 22px 36px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    boxSizing: "border-box"
  };
  if (me === undefined) return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: inner
  }, React.createElement("div", {
    style: {
      color: "var(--text-3)",
      fontSize: 13,
      padding: 24
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")));
  if (!me || me.active === false) return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: Object.assign({}, inner, {
      maxWidth: 460,
      paddingTop: 80
    })
  }, React.createElement("div", {
    style: window.mtPanel({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      textAlign: "center",
      padding: "32px 24px"
    })
  }, React.createElement(window.MtBubble, {
    icon: "lock",
    color: "var(--tint-red-tx)",
    size: 50
  }), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E1B\u0E34\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E1A\u0E31\u0E0D\u0E0A\u0E35"), React.createElement("button", {
    className: "btn",
    onClick: logout
  }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"))));
  const c = me.company || {};
  const opts = [{
    value: "sites",
    label: "ไซต์ของฉัน",
    icon: "sun"
  }, {
    value: "company",
    label: "บริษัท",
    icon: "building"
  }, {
    value: "pin",
    label: "รหัสผ่าน",
    icon: "lock"
  }];
  const nsite = Object.keys(me.sites || {}).length;
  return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: inner
  }, React.createElement("div", {
    style: window.mtPanel({
      padding: isMobile ? "12px 14px" : "12px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap"
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      minWidth: 0,
      flex: isMobile ? "1 1 0" : "1 1 240px"
    }
  }, React.createElement("div", {
    style: {
      width: 58,
      height: 42,
      borderRadius: 10,
      background: "var(--paper-bg)",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden",
      flexShrink: 0
    }
  }, c.logo ? React.createElement("img", {
    src: c.logo,
    alt: "",
    style: {
      maxWidth: "88%",
      maxHeight: "80%",
      objectFit: "contain"
    }
  }) : React.createElement(Icon, {
    name: "sun",
    size: 22,
    color: "var(--fs-sun, #E8930C)"
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 15.5,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, c.name || me.name), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, me.name, " \xB7 ", nsite, " \u0E44\u0E0B\u0E15\u0E4C \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F"))), window.Segmented && React.createElement("div", {
    style: {
      overflowX: "auto",
      maxWidth: "100%",
      order: isMobile ? 3 : 0,
      flexBasis: isMobile ? "100%" : "auto"
    }
  }, React.createElement(window.Segmented, {
    value: view,
    onChange: setView,
    options: opts
  })), React.createElement("button", {
    className: "btn btn-sm",
    onClick: logout,
    title: "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "power",
    size: 13
  }), isMobile ? "" : "ออกจากระบบ")), view === "sites" && !c.name && React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "11px 14px",
      borderRadius: "var(--r-tile)",
      background: "var(--tint-amber-bg)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 16,
    color: "var(--tint-amber-tx)"
  }), React.createElement("span", {
    style: {
      flex: "1 1 240px",
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u2014 \u0E2B\u0E31\u0E27\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E08\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25"), React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: () => setView("company")
  }, "\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")), view === "company" ? React.createElement(MtCompanyForm, {
    key: "c" + (me.updated_at || ""),
    pid: me.id,
    company: c,
    self: true
  }) : view === "pin" ? React.createElement(MtPinForm, null) : React.createElement(MtMonView, {
    partner: me
  }), React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: 11,
      color: "var(--text-3)",
      paddingTop: 4
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E17\u0E38\u0E01 1 \u0E19\u0E32\u0E17\u0E35 \xB7 \u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E23\u0E30\u0E1A\u0E1A\u0E42\u0E14\u0E22 ", React.createElement("span", {
    style: {
      fontFamily: "var(--brand-font, var(--display))",
      fontWeight: 700
    }
  }, "flash+solar"))));
}
Object.assign(window, {
  useMtPartnerData,
  MtPartnerAdmin,
  MtCompanyForm,
  PartnerApp
});