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
function MtCompanyForm({
  pid,
  company,
  self,
  onDone
}) {
  const c = company || {};
  const [f, setF] = React.useState({
    name: c.name || "",
    tax: c.tax || "",
    branch: c.branch || "",
    addr: c.addr || "",
    phone: c.phone || "",
    email: c.email || "",
    logo: c.logo || ""
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const set = (k, v) => setF(Object.assign({}, f, {
    [k]: v
  }));
  const pick = async e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    setErr("");
    try {
      set("logo", await mtLogoFromFile(file));
    } catch (x) {
      setErr(String(x.message || x));
    }
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
  const row = (k, label, ph, span) => React.createElement("div", {
    style: {
      gridColumn: span ? "1 / -1" : undefined
    }
  }, React.createElement("div", {
    style: mtLbl
  }, label), React.createElement("input", {
    value: f[k],
    placeholder: ph || "",
    onChange: e => set(k, k === "tax" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value),
    style: fld
  }));
  return React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E1A\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E17\u0E38\u0E01\u0E44\u0E0B\u0E15\u0E4C\u0E02\u0E2D\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      width: 150,
      height: 80,
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, f.logo ? React.createElement("img", {
    src: f.logo,
    alt: "",
    style: {
      maxWidth: "92%",
      maxHeight: "88%",
      objectFit: "contain"
    }
  }) : React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E42\u0E25\u0E42\u0E01\u0E49")), React.createElement("label", {
    className: "btn btn-sm btn-soft",
    style: {
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14
  }), "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B\u0E42\u0E25\u0E42\u0E01\u0E49", React.createElement("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp",
    onChange: pick,
    style: {
      display: "none"
    }
  })), f.logo && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => set("logo", "")
  }, "\u0E40\u0E2D\u0E32\u0E42\u0E25\u0E42\u0E01\u0E49\u0E2D\u0E2D\u0E01")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 10
    }
  }, row("name", "ชื่อบริษัท", "เช่น บริษัท พลังแดด จำกัด", true), row("tax", "เลขประจำตัวผู้เสียภาษี", "13 หลัก"), row("branch", "สาขา", "สำนักงานใหญ่"), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement("div", {
    style: mtLbl
  }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), React.createElement("textarea", {
    rows: 2,
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
  }, msg && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "บันทึกข้อมูลบริษัท")));
}
function MtPinForm() {
  const [old, setOld] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
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
      setMsg("เปลี่ยนรหัสแล้ว");
      setOld("");
      setPin("");
      setPin2("");
    } catch (x) {
      setErr(String(x.message || x));
    }
    setBusy(false);
  };
  const fld = mtFld();
  return React.createElement("div", {
    style: Object.assign({}, mtCard, {
      maxWidth: 420
    })
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E14\u0E34\u0E21"), React.createElement("input", {
    type: "password",
    value: old,
    onChange: e => setOld(e.target.value),
    style: fld
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48 (\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 6 \u0E15\u0E31\u0E27)"), React.createElement("input", {
    type: "password",
    value: pin,
    onChange: e => setPin(e.target.value),
    style: fld
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E2B\u0E21\u0E48"), React.createElement("input", {
    type: "password",
    value: pin2,
    onChange: e => setPin2(e.target.value),
    style: fld
  })), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      alignItems: "center"
    }
  }, msg && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy || !old || pin.length < 6,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "เปลี่ยนรหัส")));
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
  const [co, setCo] = React.useState(false);
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
      gap: 12
    }
  }, React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, isNew ? "เพิ่มบัญชีพาร์ทเนอร์" : "แก้บัญชี " + p.name), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 10
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
      gap: 8,
      alignItems: "center",
      fontSize: 13
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: f.active,
    onChange: e => set("active", e.target.checked)
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1A\u0E31\u0E0D\u0E0A\u0E35 (\u0E1B\u0E34\u0E14 = \u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48)"), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E40\u0E2B\u0E47\u0E19/\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E44\u0E14\u0E49 (\u0E44\u0E0B\u0E15\u0E4C\u0E25\u0E30\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07 \u2014 \u0E15\u0E34\u0E4A\u0E01\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E35\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 = \u0E22\u0E49\u0E32\u0E22\u0E21\u0E32\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49)"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, sites.map(s => React.createElement("label", {
    key: s.n,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      fontSize: 13,
      padding: "4px 0"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: f.sites.includes(s.n),
    onChange: () => toggle(s.n)
  }), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, mtIdent(s)), React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, mtCustOf(s).cust), s.owner && (!p || s.owner !== p.id) && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49: ", ownerName(s.owner)))), !sites.length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C"))), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      flexWrap: "wrap"
    }
  }, !isNew && React.createElement("button", {
    className: "btn btn-soft",
    onClick: () => setCo(!co)
  }, co ? "ซ่อนข้อมูลบริษัท" : "ข้อมูลบริษัท / โลโก้"), React.createElement("button", {
    className: "btn",
    onClick: onClose,
    disabled: busy
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "btn btn-pri",
    onClick: save,
    disabled: busy || !f.name || !f.username || isNew && f.pin.length < 6
  }, busy ? "กำลังบันทึก…" : "บันทึก"))), co && !isNew && React.createElement(MtCompanyForm, {
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
  const back = React.createElement("button", {
    className: "btn",
    onClick: edit ? () => setEdit(null) : onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 14
  }), edit ? "รายชื่อพาร์ทเนอร์" : "ทุกไซต์");
  if (edit) return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", null, back), React.createElement(MtPartnerEdit, {
    key: edit,
    p: edit === "new" ? null : partners[edit],
    sites: sites,
    partners: partners,
    onClose: () => setEdit(null)
  }));
  const th = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "left",
    padding: "6px 8px",
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, back, React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C / \u0E19\u0E31\u0E01\u0E25\u0E07\u0E17\u0E38\u0E19"), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    className: "btn btn-pri",
    onClick: () => setEdit("new"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35")), React.createElement("div", {
    style: Object.assign({}, mtCard, {
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.7
    })
  }, "\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E19\u0E35\u0E49\u0E14\u0E49\u0E27\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19 + \u0E23\u0E2B\u0E31\u0E2A \u0E41\u0E25\u0E49\u0E27\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E04\u0E48\u0E2B\u0E19\u0E49\u0E32 Monitoring \u0E02\u0E2D\u0E07\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E1A\u0E43\u0E2B\u0E49 \xB7 \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E44\u0E0B\u0E15\u0E4C \u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E04\u0E32 \u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49 (\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49)", React.createElement("br", null), "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E40\u0E02\u0E49\u0E32\u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E27\u0E32\u0E07\u0E01\u0E0E\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E43\u0E19 Firebase \u0E41\u0E25\u0E49\u0E27 (docs/security.md)"), React.createElement("div", {
    style: mtCard
  }, all === undefined ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : !list.length ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C") : React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: th
  }, "\u0E0A\u0E37\u0E48\u0E2D"), React.createElement("th", {
    style: th
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E2D\u0E34\u0E19"), React.createElement("th", {
    style: th
  }, "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"), React.createElement("th", {
    style: th
  }, "\u0E44\u0E0B\u0E15\u0E4C"), React.createElement("th", {
    style: th
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), React.createElement("tbody", null, list.map((p, i) => {
    const td = {
      padding: "9px 8px",
      fontSize: 12.5,
      background: i % 2 ? "var(--fs-zebra)" : "transparent"
    };
    const ns = Object.keys(p.sites || {}).map(Number);
    return React.createElement("tr", {
      key: p.id,
      className: "fs-row",
      onClick: () => setEdit(p.id),
      style: {
        cursor: "pointer"
      }
    }, React.createElement("td", {
      style: Object.assign({}, td, {
        fontWeight: 700
      })
    }, p.name), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, p.username), React.createElement("td", {
      style: td
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8
      }
    }, p.company && p.company.logo && React.createElement("img", {
      src: p.company.logo,
      alt: "",
      style: {
        height: 22,
        maxWidth: 60,
        objectFit: "contain"
      }
    }), p.company && p.company.name || React.createElement("span", {
      style: {
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01"))), React.createElement("td", {
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, ns.length ? ns.map(n => "SITE" + mtPad(n)).join(", ") : "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        color: p.active === false ? "var(--tint-red-tx)" : "var(--tint-ok-tx)",
        fontWeight: 700
      })
    }, p.active === false ? "ปิด" : "ใช้งาน"));
  }))))));
}
function PartnerApp() {
  const uid = window.FBAUTH && window.FBAUTH.currentUser ? window.FBAUTH.currentUser.uid : "";
  const me = useMtRef(uid ? "mtPartners/" + uid : "");
  const [view, setView] = React.useState("sites");
  const logout = () => {
    try {
      localStorage.removeItem("solarflow_session_v1");
    } catch (e) {}
    (window.FBAUTH ? window.FBAUTH.signOut() : Promise.resolve()).then(() => location.reload(), () => location.reload());
  };
  const wrap = {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text-1)"
  };
  const inner = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxSizing: "border-box"
  };
  if (me === undefined) return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: inner
  }, React.createElement("div", {
    style: {
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")));
  if (!me || me.active === false) return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: inner
  }, React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E1B\u0E34\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E14\u0E39\u0E41\u0E25\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("div", null, React.createElement("button", {
    className: "btn",
    onClick: logout
  }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A")))));
  const c = me.company || {};
  const opts = [{
    value: "sites",
    label: "ไซต์ของฉัน"
  }, {
    value: "company",
    label: "บริษัทของฉัน"
  }, {
    value: "pin",
    label: "รหัสผ่าน"
  }];
  return React.createElement("div", {
    style: wrap
  }, React.createElement("div", {
    style: inner
  }, React.createElement("div", {
    style: Object.assign({}, mtCard, {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
      padding: "12px 18px"
    })
  }, c.logo ? React.createElement("img", {
    src: c.logo,
    alt: "",
    style: {
      height: 40,
      maxWidth: 120,
      objectFit: "contain"
    }
  }) : React.createElement(Icon, {
    name: "sun",
    size: 26
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 15
    }
  }, c.name || me.name), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, me.name, " \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F")), React.createElement("div", {
    style: {
      flex: 1
    }
  }), window.Segmented ? React.createElement(window.Segmented, {
    value: view,
    onChange: setView,
    options: opts
  }) : opts.map(o => React.createElement("button", {
    key: o.value,
    className: view === o.value ? "btn btn-pri" : "btn",
    onClick: () => setView(o.value)
  }, o.label)), React.createElement("button", {
    className: "btn",
    onClick: logout
  }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A")), view === "company" ? React.createElement(MtCompanyForm, {
    key: "c" + (me.updated_at || ""),
    pid: me.id,
    company: c,
    self: true
  }) : view === "pin" ? React.createElement(MtPinForm, null) : React.createElement(MtMonView, {
    partner: me
  })));
}
Object.assign(window, {
  useMtPartnerData,
  MtPartnerAdmin,
  MtCompanyForm,
  PartnerApp
});