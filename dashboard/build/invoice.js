const IV_ROOT = () => window.DR_ROOT || "";
const _ivRef = p => window.FBDB.ref(IV_ROOT() + p);
const ivR2 = v => Math.round((+v || 0) * 100) / 100;
const ivMoney = n => (+n || 0).toLocaleString("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const ivToday = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};
const ivDay = v => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
  return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
};
const IV_WHT = [0, 1, 2, 3, 5];
const IV_UNITS = ["งาน", "ระบบ", "ชุด", "ตัว", "แผง", "เครื่อง", "วัน", "เดือน", "ครั้ง", "เมตร"];
const IV_STATUS = {
  draft: {
    th: "ร่าง",
    color: "#94A3B8"
  },
  issued: {
    th: "ออกแล้ว",
    color: "#3B82F6"
  },
  paid: {
    th: "รับเงินแล้ว",
    color: "#10B981"
  },
  void: {
    th: "ยกเลิก",
    color: "#EF4444"
  }
};
function ivCompanyIssuer() {
  const B = window.BRANDING || {};
  return {
    key: "company",
    kind: "company",
    name: B.legalTH || "",
    addr: B.addrTH || "",
    taxId: B.taxId || "",
    branch: "สำนักงานใหญ่",
    tel: B.tel || "",
    email: B.email || "",
    web: B.site || "",
    vat: true,
    prefix: "IVT",
    signer: "",
    logo: true,
    banks: []
  };
}
const ivBlankIssuer = () => ({
  key: "P" + Date.now().toString(36),
  kind: "person",
  name: "",
  addr: "",
  taxId: "",
  branch: "",
  tel: "",
  email: "",
  web: "",
  vat: false,
  prefix: "INV",
  signer: "",
  logo: false,
  banks: []
});
function ivIssuers(cfg) {
  const L = cfg && Array.isArray(cfg.issuers) ? cfg.issuers.filter(Boolean) : [];
  return L.length ? L.map(x => Object.assign({
    banks: []
  }, x, {
    banks: Array.isArray(x.banks) ? x.banks.filter(Boolean) : []
  })) : [ivCompanyIssuer()];
}
const ivBlankItem = () => ({
  id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  t: "",
  d: "",
  qty: 1,
  unit: "งาน",
  price: 0
});
function ivBlank(issuer, user) {
  const today = ivToday();
  return {
    id: "IV" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: "",
    status: "draft",
    issuer: issuer.key,
    from: null,
    date: today,
    due: today,
    ref: "",
    cust: {
      name: "",
      addr: "",
      taxId: "",
      branch: "",
      contact: "",
      tel: "",
      email: ""
    },
    items: [ivBlankItem()],
    vat: !!issuer.vat,
    vatRate: window.BOQ && window.BOQ.VAT_RATE || 7,
    wht: 0,
    bank: 0,
    note: "",
    jobId: "",
    createdAt: new Date().toISOString(),
    by: (user || {}).name || "",
    adminOnly: window.__pgAdmin ? true : null
  };
}
const ivItems = inv => Array.isArray((inv || {}).items) ? inv.items.filter(Boolean) : [];
function ivTotals(inv) {
  const sub = ivR2(ivItems(inv).reduce((t, it) => t + (+it.qty || 0) * (+it.price || 0), 0));
  const rate = inv && inv.vat ? +inv.vatRate || 7 : 0;
  const vat = ivR2(sub * rate / 100),
    total = ivR2(sub + vat),
    wht = ivR2(sub * (+(inv || {}).wht || 0) / 100);
  return {
    sub,
    rate,
    vat,
    total,
    wht,
    pay: ivR2(total - wht)
  };
}
const ivTitle = inv => inv && inv.vat ? "ใบแจ้งหนี้/ใบกำกับภาษี" : "ใบแจ้งหนี้";
const ivFrom = (inv, issuers) => inv && inv.from || (issuers || []).find(x => x.key === (inv || {}).issuer) || (issuers || [])[0] || ivCompanyIssuer();
function ivAllocNo(prefix, date) {
  const pre = String(prefix || "INV").trim().toUpperCase() || "INV";
  const ym = String(date || ivToday()).slice(0, 7).replace("-", "");
  return _ivRef("invoiceSeq/" + pre + ym).transaction(c => (+c || 0) + 1).then(r => {
    if (!r.committed) throw new Error("จองเลขที่ไม่สำเร็จ");
    return pre + "-" + ym + String(r.snapshot.val()).padStart(5, "0");
  });
}
function useInvoiceStore() {
  const [list, setList] = React.useState(null);
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    if (!window.FBDB) {
      setList([]);
      setCfg({});
      return;
    }
    const a = _ivRef("invoices"),
      b = _ivRef("invoiceCfg");
    const ha = a.on("value", s => setList(Object.values(s.val() || {}).filter(Boolean)), () => setList([]));
    const hb = b.on("value", s => setCfg(s.val() || {}), () => setCfg({}));
    return () => {
      a.off("value", ha);
      b.off("value", hb);
    };
  }, []);
  const issuers = React.useMemo(() => ivIssuers(cfg), [cfg]);
  const save = React.useCallback((inv, issue) => {
    const iss = issuers.find(x => x.key === inv.issuer) || issuers[0];
    const rec = Object.assign({}, inv, {
      updatedAt: new Date().toISOString()
    });
    if (issue || rec.status !== "draft") rec.from = JSON.parse(JSON.stringify(iss));
    const go = issue && !rec.no ? ivAllocNo(iss.prefix, rec.date).then(no => Object.assign(rec, {
      no,
      status: "issued"
    })) : Promise.resolve(issue && rec.status === "draft" ? Object.assign(rec, {
      status: "issued"
    }) : rec);
    return go.then(r => _ivRef("invoices/" + r.id).set(r).then(() => r));
  }, [issuers]);
  const patch = React.useCallback((id, p) => _ivRef("invoices/" + id).update(p), []);
  const removeDraft = React.useCallback(id => _ivRef("invoices/" + id).remove(), []);
  const saveCfg = React.useCallback(c => _ivRef("invoiceCfg").set(c), []);
  return {
    list,
    cfg,
    issuers,
    save,
    patch,
    removeDraft,
    saveCfg,
    loading: list === null || cfg === null
  };
}
const ivIn = () => Object.assign({}, window.EC_INPUT || {
  width: "100%",
  padding: "10px 12px"
}, {
  boxShadow: "var(--shadow-inset)"
});
function IvFld({
  label,
  children,
  w
}) {
  return React.createElement("label", {
    style: {
      display: "block",
      minWidth: 0,
      flex: w ? "0 0 " + w : 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600,
      margin: "0 0 4px 2px"
    }
  }, label), children);
}
function IvRow({
  children
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, children);
}
function IvCard({
  title,
  right,
  children
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: "14px 16px",
      marginBottom: 12
    }
  }, (title || right) && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), right), children);
}
const ivBtn = primary => ({
  padding: "9px 14px",
  borderRadius: "var(--r-tile)",
  border: "none",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  background: primary ? "var(--primary)" : "var(--surface2)",
  color: primary ? "#fff" : "var(--text-2)",
  boxShadow: primary ? "var(--shadow-btn)" : "var(--shadow-sm)"
});
function InvoiceEditor({
  inv0,
  store,
  jobs,
  onClose,
  onPrint
}) {
  const [f, setF] = React.useState(() => JSON.parse(JSON.stringify(inv0)));
  const [busy, setBusy] = React.useState(false);
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const setC = (k, v) => setF(p => Object.assign({}, p, {
    cust: Object.assign({}, p.cust, {
      [k]: v
    })
  }));
  const setIt = (i, k, v) => setF(p => {
    const L = ivItems(p).slice();
    L[i] = Object.assign({}, L[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      items: L
    });
  });
  const iss = ivFrom(f.status === "draft" ? Object.assign({}, f, {
    from: null
  }) : f, store.issuers);
  const T = ivTotals(f);
  const locked = f.status === "void";
  const pickJob = id => {
    const j = (jobs || []).find(x => x.id === id);
    if (!j) return;
    setF(p => Object.assign({}, p, {
      jobId: id,
      ref: p.ref || j.code || "",
      cust: Object.assign({}, p.cust, {
        name: j.name || p.cust.name,
        addr: [j.address, j.province].filter(Boolean).join(" ") || p.cust.addr,
        tel: j.phone || p.cust.tel
      })
    }));
  };
  const doSave = issue => {
    if (issue && !String(f.cust.name || "").trim()) {
      window.askConfirm && window.askConfirm({
        title: "ยังไม่ได้กรอกชื่อลูกค้า",
        okText: "ตกลง"
      });
      return;
    }
    setBusy(true);
    store.save(f, issue).then(r => {
      setBusy(false);
      setF(r);
      if (issue) onPrint(r);
    }).catch(e => {
      setBusy(false);
      window.askConfirm && window.askConfirm({
        title: "บันทึกไม่สำเร็จ",
        body: String(e && e.message || e),
        okText: "ตกลง"
      });
    });
  };
  const IN = ivIn();
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(8,20,14,.45)",
      overflow: "auto",
      padding: "24px 12px"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 920,
      margin: "0 auto",
      background: "var(--bg)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-modal)",
      padding: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, ivTitle(f)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, f.no || "ร่าง — ยังไม่มีเลขที่ (ออกเลขตอนกดออกใบ)")), React.createElement("button", {
    style: ivBtn(),
    onClick: onClose
  }, "\u0E1B\u0E34\u0E14"), !locked && React.createElement("button", {
    style: ivBtn(),
    disabled: busy,
    onClick: () => doSave(false)
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01", f.status === "draft" ? "ร่าง" : ""), f.no && React.createElement("button", {
    style: ivBtn(),
    onClick: () => onPrint(f)
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C / PDF"), !locked && f.status === "draft" && React.createElement("button", {
    style: ivBtn(true),
    disabled: busy,
    onClick: () => doSave(true)
  }, busy ? "กำลังออกเลข…" : "ออกใบ + พิมพ์")), React.createElement(IvCard, {
    title: "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"
  }, React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E2D\u0E2D\u0E01\u0E43\u0E19\u0E19\u0E32\u0E21"
  }, React.createElement("select", {
    style: IN,
    value: f.issuer,
    disabled: f.status !== "draft",
    onChange: e => {
      const x = store.issuers.find(y => y.key === e.target.value);
      setF(p => Object.assign({}, p, {
        issuer: e.target.value,
        vat: !!(x && x.vat),
        bank: 0
      }));
    }
  }, store.issuers.map(x => React.createElement("option", {
    key: x.key,
    value: x.key
  }, x.name || "(ยังไม่ตั้งชื่อ)", " \xB7 ", x.kind === "person" ? "บุคคลธรรมดา" : "นิติบุคคล")))), React.createElement(IvFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01",
    w: "150px"
  }, React.createElement("input", {
    type: "date",
    style: IN,
    value: f.date,
    onChange: e => set("date", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E04\u0E23\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14",
    w: "150px"
  }, React.createElement("input", {
    type: "date",
    style: IN,
    value: f.due,
    onChange: e => set("due", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07",
    w: "170px"
  }, React.createElement("input", {
    style: IN,
    value: f.ref,
    onChange: e => set("ref", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32"
  }))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, iss.addr, iss.taxId ? " · เลขผู้เสียภาษี " + iss.taxId : "", iss.vat ? "" : " · ไม่จด VAT (ออกเป็นใบแจ้งหนี้อย่างเดียว)")), React.createElement(IvCard, {
    title: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    right: React.createElement("select", {
      style: Object.assign({}, IN, {
        width: 230,
        padding: "7px 10px",
        fontSize: 12.5
      }),
      value: "",
      onChange: e => pickJob(e.target.value)
    }, React.createElement("option", {
      value: ""
    }, "\u0E14\u0E36\u0E07\u0E0A\u0E37\u0E48\u0E2D/\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E32\u0E01\u0E07\u0E32\u0E19\u2026"), (jobs || []).filter(j => j && j.name).slice(0, 400).map(j => React.createElement("option", {
      key: j.id,
      value: j.id
    }, [j.code, j.name].filter(Boolean).join(" · "))))
  }, React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 / \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.name,
    onChange: e => setC("name", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35",
    w: "190px"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.taxId,
    onChange: e => setC("taxId", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E2A\u0E32\u0E02\u0E32",
    w: "150px"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.branch,
    onChange: e => setC("branch", e.target.value),
    placeholder: "\u0E2A\u0E33\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E0D\u0E48"
  }))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"
  }, React.createElement("textarea", {
    rows: 2,
    style: Object.assign({}, IN, {
      resize: "vertical"
    }),
    value: f.cust.addr,
    onChange: e => setC("addr", e.target.value)
  }))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.contact,
    onChange: e => setC("contact", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E42\u0E17\u0E23"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.tel,
    onChange: e => setC("tel", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E2D\u0E35\u0E40\u0E21\u0E25"
  }, React.createElement("input", {
    style: IN,
    value: f.cust.email,
    onChange: e => setC("email", e.target.value)
  })))), React.createElement(IvCard, {
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (\u0E23\u0E32\u0E04\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35)",
    right: React.createElement("button", {
      style: ivBtn(),
      onClick: () => set("items", ivItems(f).concat([ivBlankItem()]))
    }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")
  }, ivItems(f).map((it, i) => React.createElement("div", {
    key: it.id || i,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-start",
      padding: "8px 0",
      borderTop: i ? "1px solid var(--divider)" : "none",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      width: 22,
      paddingTop: 10,
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, i + 1, "."), React.createElement("div", {
    style: {
      flex: "1 1 260px",
      minWidth: 0
    }
  }, React.createElement("input", {
    style: Object.assign({}, IN, {
      fontWeight: 600
    }),
    value: it.t,
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    onChange: e => setIt(i, "t", e.target.value)
  }), React.createElement("textarea", {
    rows: 1,
    style: Object.assign({}, IN, {
      marginTop: 6,
      fontSize: 12.5,
      resize: "vertical"
    }),
    value: it.d,
    placeholder: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)",
    onChange: e => setIt(i, "d", e.target.value)
  })), React.createElement("input", {
    type: "number",
    style: Object.assign({}, IN, {
      width: 80,
      textAlign: "right"
    }),
    value: it.qty,
    onChange: e => setIt(i, "qty", e.target.value === "" ? "" : +e.target.value)
  }), React.createElement("input", {
    list: "iv-units",
    style: Object.assign({}, IN, {
      width: 84
    }),
    value: it.unit,
    onChange: e => setIt(i, "unit", e.target.value)
  }), React.createElement("input", {
    type: "number",
    style: Object.assign({}, IN, {
      width: 120,
      textAlign: "right"
    }),
    value: it.price,
    onChange: e => setIt(i, "price", e.target.value === "" ? "" : +e.target.value)
  }), React.createElement("div", {
    style: {
      width: 110,
      paddingTop: 10,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, ivMoney((+it.qty || 0) * (+it.price || 0))), React.createElement("button", {
    title: "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    style: Object.assign(ivBtn(), {
      padding: "8px 10px",
      color: "var(--tint-red-tx)"
    }),
    onClick: () => set("items", ivItems(f).filter((_, k) => k !== i))
  }, "\xD7"))), React.createElement("datalist", {
    id: "iv-units"
  }, IV_UNITS.map(u => React.createElement("option", {
    key: u,
    value: u
  })))), React.createElement(IvCard, {
    title: "\u0E20\u0E32\u0E29\u0E35 \xB7 \u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19"
  }, React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21",
    w: "190px"
  }, React.createElement("select", {
    style: IN,
    value: f.vat ? "1" : "0",
    disabled: !iss.vat,
    onChange: e => set("vat", e.target.value === "1")
  }, React.createElement("option", {
    value: "1"
  }, "\u0E04\u0E34\u0E14 VAT ", f.vatRate, "%"), React.createElement("option", {
    value: "0"
  }, "\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14 VAT"))), React.createElement(IvFld, {
    label: "\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",
    w: "150px"
  }, React.createElement("select", {
    style: IN,
    value: +f.wht || 0,
    onChange: e => set("wht", +e.target.value)
  }, IV_WHT.map(w => React.createElement("option", {
    key: w,
    value: w
  }, w ? w + "%" : "ไม่หัก")))), React.createElement(IvFld, {
    label: "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"
  }, React.createElement("select", {
    style: IN,
    value: +f.bank || 0,
    onChange: e => set("bank", +e.target.value)
  }, (iss.banks || []).length ? iss.banks.map((b, k) => React.createElement("option", {
    key: k,
    value: k
  }, [b.bank, b.no, b.name].filter(Boolean).join(" · "))) : React.createElement("option", {
    value: 0
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \u2014 \u0E44\u0E1B\u0E17\u0E35\u0E48 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23")))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"
  }, React.createElement("textarea", {
    rows: 2,
    style: Object.assign({}, IN, {
      resize: "vertical"
    }),
    value: f.note,
    onChange: e => set("note", e.target.value)
  }))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 18,
      flexWrap: "wrap",
      fontSize: 13,
      color: "var(--text-2)",
      fontVariantNumeric: "tabular-nums"
    }
  }, React.createElement("span", null, "\u0E01\u0E48\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E35 ", React.createElement("b", null, ivMoney(T.sub))), f.vat && React.createElement("span", null, "VAT ", React.createElement("b", null, ivMoney(T.vat))), React.createElement("span", null, "\u0E23\u0E27\u0E21 ", React.createElement("b", {
    style: {
      color: "var(--primary-dark)"
    }
  }, ivMoney(T.total))), T.wht > 0 && React.createElement("span", null, "\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22 ", React.createElement("b", null, ivMoney(T.wht)), " \xB7 \u0E0A\u0E33\u0E23\u0E30 ", React.createElement("b", null, ivMoney(T.pay))))))), document.body);
}
function InvoiceSettings({
  store,
  users,
  onClose
}) {
  const [L, setL] = React.useState(() => JSON.parse(JSON.stringify(store.issuers)));
  const [busy, setBusy] = React.useState(false);
  const setI = (i, k, v) => setL(p => {
    const c = p.slice();
    c[i] = Object.assign({}, c[i], {
      [k]: v
    });
    return c;
  });
  const setB = (i, k, bi, v) => setL(p => {
    const c = p.slice();
    const b = (c[i].banks || []).slice();
    b[bi] = Object.assign({}, b[bi], {
      [k]: v
    });
    c[i] = Object.assign({}, c[i], {
      banks: b
    });
    return c;
  });
  const IN = ivIn();
  const save = () => {
    setBusy(true);
    store.saveCfg({
      issuers: L
    }).then(() => {
      setBusy(false);
      onClose();
    }).catch(() => setBusy(false));
  };
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(8,20,14,.45)",
      overflow: "auto",
      padding: "24px 12px"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 820,
      margin: "0 auto",
      background: "var(--bg)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-modal)",
      padding: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), React.createElement("button", {
    style: ivBtn(),
    onClick: () => setL(p => p.concat([ivBlankIssuer()]))
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01 (\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E18\u0E23\u0E23\u0E21\u0E14\u0E32)"), React.createElement("button", {
    style: ivBtn(),
    onClick: onClose
  }, "\u0E1B\u0E34\u0E14"), React.createElement("button", {
    style: ivBtn(true),
    disabled: busy,
    onClick: save
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")), L.map((x, i) => React.createElement(IvCard, {
    key: x.key,
    title: (x.name || "ผู้ออกใหม่") + " · " + (x.kind === "person" ? "บุคคลธรรมดา" : "นิติบุคคล"),
    right: L.length > 1 && React.createElement("button", {
      style: Object.assign(ivBtn(), {
        color: "var(--tint-red-tx)"
      }),
      onClick: () => window.askConfirm({
        title: "ลบผู้ออก " + (x.name || "") + "?",
        body: "ใบที่ออกไปแล้วไม่เปลี่ยน (เก็บข้อมูลผู้ออกไว้ในใบ)",
        okText: "ลบ",
        danger: true
      }).then(ok => ok && setL(p => p.filter((_, k) => k !== i)))
    }, "\u0E25\u0E1A")
  }, React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",
    w: "150px"
  }, React.createElement("select", {
    style: IN,
    value: x.kind,
    onChange: e => setI(i, "kind", e.target.value)
  }, React.createElement("option", {
    value: "company"
  }, "\u0E19\u0E34\u0E15\u0E34\u0E1A\u0E38\u0E04\u0E04\u0E25"), React.createElement("option", {
    value: "person"
  }, "\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E18\u0E23\u0E23\u0E21\u0E14\u0E32"))), React.createElement(IvFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D (\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E1A\u0E19\u0E43\u0E1A)"
  }, React.createElement("input", {
    style: IN,
    value: x.name,
    onChange: e => setI(i, "name", e.target.value)
  }))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"
  }, React.createElement("textarea", {
    rows: 2,
    style: Object.assign({}, IN, {
      resize: "vertical"
    }),
    value: x.addr,
    onChange: e => setI(i, "addr", e.target.value)
  }))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 / \u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19"
  }, React.createElement("input", {
    style: IN,
    value: x.taxId,
    onChange: e => setI(i, "taxId", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E2A\u0E32\u0E02\u0E32",
    w: "150px"
  }, React.createElement("input", {
    style: IN,
    value: x.branch,
    onChange: e => setI(i, "branch", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E08\u0E14\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19 VAT",
    w: "150px"
  }, React.createElement("select", {
    style: IN,
    value: x.vat ? "1" : "0",
    onChange: e => setI(i, "vat", e.target.value === "1")
  }, React.createElement("option", {
    value: "1"
  }, "\u0E08\u0E14 (\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E01\u0E33\u0E01\u0E31\u0E1A\u0E20\u0E32\u0E29\u0E35\u0E44\u0E14\u0E49)"), React.createElement("option", {
    value: "0"
  }, "\u0E44\u0E21\u0E48\u0E08\u0E14")))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E42\u0E17\u0E23"
  }, React.createElement("input", {
    style: IN,
    value: x.tel,
    onChange: e => setI(i, "tel", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E2D\u0E35\u0E40\u0E21\u0E25"
  }, React.createElement("input", {
    style: IN,
    value: x.email,
    onChange: e => setI(i, "email", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E40\u0E27\u0E47\u0E1A\u0E44\u0E0B\u0E15\u0E4C"
  }, React.createElement("input", {
    style: IN,
    value: x.web,
    onChange: e => setI(i, "web", e.target.value)
  }))), React.createElement(IvRow, null, React.createElement(IvFld, {
    label: "\u0E04\u0E33\u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48",
    w: "130px"
  }, React.createElement("input", {
    style: Object.assign({}, IN, {
      fontFamily: "var(--mono)"
    }),
    value: x.prefix,
    onChange: e => setI(i, "prefix", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  })), React.createElement(IvFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 (\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E0B\u0E47\u0E19)"
  }, React.createElement("input", {
    style: IN,
    value: x.signer,
    onChange: e => setI(i, "signer", e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19 (\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49)",
    w: "210px"
  }, React.createElement("select", {
    style: IN,
    value: x.signUser || "",
    onChange: e => setI(i, "signUser", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2014 \u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19"), React.createElement("option", {
    value: "-"
  }, "\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19"), (users || []).filter(u => u && u.id && u.name).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), React.createElement(IvFld, {
    label: "\u0E42\u0E25\u0E42\u0E01\u0E49\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E1A\u0E19\u0E43\u0E1A",
    w: "150px"
  }, React.createElement("select", {
    style: IN,
    value: x.logo ? "1" : "0",
    onChange: e => setI(i, "logo", e.target.value === "1")
  }, React.createElement("option", {
    value: "1"
  }, "\u0E41\u0E2A\u0E14\u0E07"), React.createElement("option", {
    value: "0"
  }, "\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07")))), React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)",
      margin: "4px 0 6px"
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"), (x.banks || []).map((b, bi) => React.createElement(IvRow, {
    key: bi
  }, React.createElement(IvFld, {
    label: "\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23"
  }, React.createElement("input", {
    style: IN,
    value: b.bank || "",
    onChange: e => setB(i, "bank", bi, e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E18\u0E19\u0E32\u0E04\u0E32\u0E23\u0E01\u0E2A\u0E34\u0E01\u0E23\u0E44\u0E17\u0E22"
  })), React.createElement(IvFld, {
    label: "\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E0D\u0E0A\u0E35"
  }, React.createElement("input", {
    style: Object.assign({}, IN, {
      fontFamily: "var(--mono)"
    }),
    value: b.no || "",
    onChange: e => setB(i, "no", bi, e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E0D\u0E0A\u0E35"
  }, React.createElement("input", {
    style: IN,
    value: b.name || "",
    onChange: e => setB(i, "name", bi, e.target.value)
  })), React.createElement(IvFld, {
    label: "\u0E42\u0E25\u0E42\u0E01\u0E49\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23",
    w: "120px"
  }, React.createElement("label", {
    style: Object.assign({}, IN, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: 42,
      padding: 4,
      cursor: "pointer"
    })
  }, b.logo ? React.createElement("img", {
    src: b.logo,
    alt: "",
    style: {
      maxHeight: 34,
      maxWidth: 100,
      objectFit: "contain"
    }
  }) : React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "+ \u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14"), React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const fl = e.target.files && e.target.files[0];
      e.target.value = "";
      if (fl && window.resizeImageFile) window.resizeImageFile(fl, 240, 0.9).then(d => setB(i, "logo", bi, d));
    }
  })), b.logo && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-red-tx)",
      cursor: "pointer",
      textAlign: "center",
      marginTop: 3
    },
    onClick: () => setB(i, "logo", bi, "")
  }, "\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01")), React.createElement("button", {
    style: Object.assign(ivBtn(), {
      alignSelf: "flex-end",
      color: "var(--tint-red-tx)"
    }),
    onClick: () => setI(i, "banks", (x.banks || []).filter((_, k) => k !== bi))
  }, "\xD7"))), React.createElement("button", {
    style: ivBtn(),
    onClick: () => setI(i, "banks", (x.banks || []).concat([{
      bank: "",
      no: "",
      name: x.name || ""
    }]))
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35"))))), document.body);
}
const IV_INK = "#1F2A33",
  IV_SOFT = "#5B6770",
  IV_LINE = "#DCE6EA";
function ivPaperColors() {
  const B = window.BRANDING || {};
  return {
    deep: B.deep || "#0A4D68",
    tint: "#E6F2F6"
  };
}
function IvPage({
  inv,
  issuers,
  copy,
  sign
}) {
  const C = ivPaperColors(),
    x = ivFrom(inv, issuers),
    c = inv.cust || {},
    T = ivTotals(inv);
  const bank = (x.banks || [])[+inv.bank || 0];
  const curIss = (issuers || []).find(y => y.key === x.key) || {};
  const bankLogo = bank && (bank.logo || ((curIss.banks || []).find(b => b && b.no === bank.no) || {}).logo);
  const lab = {
    color: IV_INK,
    fontWeight: 700,
    whiteSpace: "nowrap",
    paddingRight: 8,
    verticalAlign: "top"
  };
  const party = rows => React.createElement("table", {
    style: {
      borderCollapse: "collapse",
      fontSize: 10.5,
      lineHeight: 1.55
    }
  }, React.createElement("tbody", null, rows.filter(r => r[1]).map(r => React.createElement("tr", {
    key: r[0]
  }, React.createElement("td", {
    style: lab
  }, r[0], " :"), React.createElement("td", {
    style: {
      color: IV_INK
    }
  }, r[1])))));
  const contact = rows => React.createElement("div", {
    style: {
      fontSize: 10.5,
      lineHeight: 1.7,
      color: IV_INK
    }
  }, rows.filter(r => r[1]).map(r => React.createElement("div", {
    key: r[0]
  }, React.createElement("span", {
    style: {
      color: IV_SOFT,
      display: "inline-block",
      width: 42
    }
  }, r[0]), r[1])));
  const taxTxt = (id, br) => id ? id + (br ? " (" + br + ")" : "") : "";
  const sec = (icon, title, body) => React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      padding: "10px 0",
      borderTop: "1px solid " + IV_LINE,
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      width: 92,
      fontSize: 11,
      fontWeight: 800,
      color: IV_INK
    }
  }, icon, " ", title), React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 11,
      color: IV_INK,
      lineHeight: 1.6
    }
  }, body));
  return React.createElement("div", {
    className: "iv-page bl-page",
    style: {
      color: IV_INK,
      fontSize: 11
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, x.logo && window.BrandDoc ? React.createElement(window.BrandDoc, {
    height: 46,
    name: false
  }) : React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: C.deep
    }
  }, x.name)), React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: IV_SOFT
    }
  }, "(", copy ? "สำเนา" : "ต้นฉบับ", ")"), React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      color: C.deep,
      lineHeight: 1.25
    }
  }, ivTitle(inv)))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginBottom: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, party([["ผู้ขาย", x.name], ["ที่อยู่", x.addr], ["เลขที่ภาษี", taxTxt(x.taxId, x.kind === "company" ? x.branch || "สำนักงานใหญ่" : "")]])), contact([["โทร", x.tel], ["อีเมล", x.email], ["เว็บ", x.web]])), React.createElement("div", {
    style: {
      width: 230,
      background: C.tint,
      borderRadius: 4,
      padding: "8px 12px"
    }
  }, React.createElement("table", {
    style: {
      borderCollapse: "collapse",
      fontSize: 10.5,
      lineHeight: 1.7,
      width: "100%"
    }
  }, React.createElement("tbody", null, [["เลขที่เอกสาร", inv.no || "(ร่าง)"], ["วันที่ออก", ivDay(inv.date)], ["วันที่ครบกำหนด", ivDay(inv.due)], ["อ้างอิง", inv.ref]].filter(r => r[1]).map(r => React.createElement("tr", {
    key: r[0]
  }, React.createElement("td", {
    style: lab
  }, r[0], " :"), React.createElement("td", {
    style: {
      textAlign: "left"
    }
  }, r[1]))))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginBottom: 14,
      paddingTop: 10,
      borderTop: "1px solid " + IV_LINE
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, party([["ลูกค้า", c.name], ["ที่อยู่", c.addr], ["เลขที่ภาษี", taxTxt(c.taxId, c.branch)]]))), React.createElement("div", {
    style: {
      width: 230
    }
  }, (c.contact || c.tel || c.email) && React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      marginBottom: 2
    }
  }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E17\u0E35\u0E48"), contact([["ชื่อ", c.contact], ["โทร", c.tel], ["อีเมล", c.email]]))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 10.5
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      background: C.tint
    }
  }, [["คำอธิบาย", "left"], ["จำนวน", "right", 60], ["หน่วย", "center", 52], ["ราคา", "right", 82], ["มูลค่าก่อนภาษี", "right", 96]].map(h => React.createElement("th", {
    key: h[0],
    style: {
      textAlign: h[1],
      padding: "7px 8px",
      fontWeight: 800,
      width: h[2]
    }
  }, h[0])))), React.createElement("tbody", null, ivItems(inv).map((it, i) => React.createElement("tr", {
    key: it.id || i,
    style: {
      borderBottom: "1px solid " + IV_LINE,
      breakInside: "avoid"
    }
  }, React.createElement("td", {
    style: {
      padding: "8px 8px",
      verticalAlign: "top"
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, i + 1, ". ", it.t), it.d ? React.createElement("div", {
    style: {
      color: IV_SOFT,
      whiteSpace: "pre-wrap",
      marginTop: 1,
      paddingLeft: 12
    }
  }, it.d) : null), React.createElement("td", {
    style: {
      padding: "8px",
      textAlign: "right",
      verticalAlign: "top"
    }
  }, ivMoney(it.qty)), React.createElement("td", {
    style: {
      padding: "8px",
      textAlign: "center",
      verticalAlign: "top"
    }
  }, it.unit), React.createElement("td", {
    style: {
      padding: "8px",
      textAlign: "right",
      verticalAlign: "top"
    }
  }, ivMoney(it.price)), React.createElement("td", {
    style: {
      padding: "8px",
      textAlign: "right",
      verticalAlign: "top"
    }
  }, ivMoney((+it.qty || 0) * (+it.price || 0))))))), React.createElement("div", {
    className: "bl-foot",
    style: {
      breakInside: "avoid",
      paddingTop: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      padding: "14px 0",
      breakInside: "avoid",
      borderTop: "1px solid " + IV_LINE
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      width: 92,
      fontSize: 11,
      fontWeight: 800
    }
  }, "\u0E2A\u0E23\u0E38\u0E1B"), React.createElement("table", {
    style: {
      borderCollapse: "collapse",
      fontSize: 10.5,
      lineHeight: 1.75
    }
  }, React.createElement("tbody", null, (inv.vat ? [["มูลค่าที่คำนวณภาษี " + T.rate + "%", T.sub], ["ภาษีมูลค่าเพิ่ม " + T.rate + "%", T.vat]] : [["มูลค่ารวม", T.sub]]).map(r => React.createElement("tr", {
    key: r[0]
  }, React.createElement("td", {
    style: {
      paddingRight: 24
    }
  }, r[0]), React.createElement("td", {
    style: {
      textAlign: "right",
      paddingRight: 6
    }
  }, ivMoney(r[1])), React.createElement("td", null, "\u0E1A\u0E32\u0E17"))), React.createElement("tr", null, React.createElement("td", {
    style: {
      paddingRight: 24,
      fontWeight: 700
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), React.createElement("td", {
    colSpan: 2,
    style: {
      color: IV_SOFT
    }
  }, window.ecBahtText ? window.ecBahtText(T.total) : ""))))), React.createElement("div", {
    style: {
      width: 230
    }
  }, React.createElement("div", {
    style: {
      background: C.tint,
      borderRadius: 4,
      padding: "10px 12px",
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 10.5
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: C.deep
    }
  }, ivMoney(T.total)), React.createElement("span", {
    style: {
      fontSize: 10.5
    }
  }, "\u0E1A\u0E32\u0E17")), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 10.5,
      lineHeight: 1.8,
      marginTop: 6
    }
  }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E2B\u0E31\u0E01 \u0E13 \u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22", inv.wht ? " " + inv.wht + "%" : ""), React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, ivMoney(T.wht), " \u0E1A\u0E32\u0E17")), React.createElement("tr", null, React.createElement("td", {
    style: {
      fontWeight: 700
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E0A\u0E33\u0E23\u0E30"), React.createElement("td", {
    style: {
      textAlign: "right",
      fontWeight: 700
    }
  }, ivMoney(T.pay), " \u0E1A\u0E32\u0E17")))))), bank && sec("", "ชำระเงิน", React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, bankLogo ? React.createElement("img", {
    src: bankLogo,
    alt: "",
    style: {
      height: 40,
      maxWidth: 70,
      objectFit: "contain"
    }
  }) : null, React.createElement("div", null, React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, bank.bank), React.createElement("div", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35 ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, bank.no)), React.createElement("div", {
    style: {
      color: IV_SOFT
    }
  }, bank.name)))), inv.note && sec("", "หมายเหตุ", React.createElement("div", {
    style: {
      whiteSpace: "pre-wrap"
    }
  }, inv.note)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      paddingTop: 14,
      borderTop: "1px solid " + IV_LINE,
      breakInside: "avoid"
    }
  }, React.createElement("div", {
    style: {
      width: 92,
      fontSize: 11,
      fontWeight: 800
    }
  }, "\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"), [["ผู้ออกเอกสาร (ผู้ขาย)", x.signer || x.name, inv.date, sign], ["ผู้รับเอกสาร (ลูกค้า)", c.name, ""]].map(s => React.createElement("div", {
    key: s[0],
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: 10.5
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      height: 54,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("span", null, s[0]), s[3] ? React.createElement("img", {
    src: s[3],
    alt: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19",
    style: {
      maxHeight: 36,
      maxWidth: "70%",
      objectFit: "contain",
      marginBottom: -2
    }
  }) : null), React.createElement("div", {
    style: {
      borderTop: "1px dotted " + IV_SOFT,
      margin: "0 18px",
      paddingTop: 4
    }
  }, s[1]), React.createElement("div", {
    style: {
      color: IV_SOFT,
      marginTop: 2
    }
  }, s[2] ? ivDay(s[2]) : "วันที่ ........................"))))));
}
function ivSignUserId(x, users) {
  if (!x || x.signUser === "-") return "";
  if (x.signUser) return x.signUser;
  const norm = s => String(s || "").replace(/^(นาย|นางสาว|นาง|น\.ส\.|คุณ)\s*/, "").replace(/\s+/g, " ").trim();
  const want = [x.signer, x.name].map(norm).filter(Boolean);
  const u = (users || []).find(u => u && u.name && want.indexOf(norm(u.name)) >= 0);
  return u ? u.id : "";
}
function useIvSign(x, users) {
  const uid = ivSignUserId(x, users);
  const [img, setImg] = React.useState("");
  React.useEffect(() => {
    setImg("");
    if (!uid || !window.FBDB) return;
    _ivRef("userSigns/" + uid).once("value").then(s => setImg((s.val() || {}).img || "")).catch(() => {});
  }, [uid]);
  return img;
}
function InvoicePaper({
  inv,
  issuers,
  users,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const fromX = ivFrom(inv, issuers),
    curX = (issuers || []).find(y => y.key === fromX.key);
  const sign = useIvSign(curX ? Object.assign({}, fromX, {
    signUser: curX.signUser,
    signer: fromX.signer || curX.signer
  }) : fromX, users);
  const [part, setPart] = React.useState("orig");
  if (window.useBlPrintBody) window.useBlPrintBody();
  const doPrint = () => {
    const old = document.title;
    document.title = (inv.no || "ใบแจ้งหนี้") + " " + ((inv.cust || {}).name || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const paper = {
    maxWidth: 820,
    margin: "0 auto",
    background: "var(--paper-bg)",
    padding: isMobile ? "20px 16px" : "34px 38px",
    borderRadius: isMobile ? 0 : 12,
    boxShadow: "var(--shadow-modal)"
  };
  const tab = (id, label) => React.createElement("button", {
    key: id,
    onClick: () => setPart(id),
    style: Object.assign(ivBtn(part === id), {
      padding: "7px 12px",
      fontSize: 12
    })
  }, label);
  const pages = part === "both" ? [false, true] : [part === "copy"];
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 220,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "var(--surface)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 820,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    style: ivBtn(),
    onClick: onClose
  }, "\u0E1B\u0E34\u0E14"), React.createElement("div", {
    style: {
      flex: 1,
      fontWeight: 800,
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontSize: 13
    }
  }, inv.no || "ร่าง"), tab("orig", "ต้นฉบับ"), tab("copy", "สำเนา"), tab("both", "ต้นฉบับ + สำเนา"), React.createElement("button", {
    style: ivBtn(true),
    onClick: doPrint
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), pages.map((cp, i) => React.createElement("div", {
    key: i,
    className: "sv-rep-paper" + (i ? " bl-sheet" : ""),
    style: Object.assign({}, paper, {
      marginTop: i ? 16 : 0
    })
  }, React.createElement(IvPage, {
    inv: inv,
    issuers: issuers,
    copy: cp,
    sign: sign
  }))), !isMobile && React.createElement("div", {
    style: {
      height: 24
    }
  })), document.body);
}
function InvoiceView({
  jobs,
  users,
  role,
  currentUser,
  q
}) {
  const store = useInvoiceStore();
  const admin = window.usePgAdmin ? window.usePgAdmin() : false;
  const [edit, setEdit] = React.useState(null);
  const [print, setPrint] = React.useState(null);
  const [setup, setSetup] = React.useState(false);
  const canUse = window.can ? window.can(role, "billing") : true;
  const qq = String(q || "").trim().toLowerCase();
  const rows = (store.list || []).filter(x => admin || !x.adminOnly).filter(x => !qq || [x.no, (x.cust || {}).name, x.ref].join(" ").toLowerCase().indexOf(qq) >= 0).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.no || "").localeCompare(String(a.no || "")));
  const newInv = () => setEdit(ivBlank(store.issuers[0], currentUser));
  const setStatus = (x, st) => window.askConfirm({
    title: (st === "void" ? "ยกเลิกใบ " : "บันทึกรับเงินใบ ") + (x.no || "") + "?",
    okText: "ยืนยัน",
    danger: st === "void"
  }).then(ok => ok && store.patch(x.id, {
    status: st
  }));
  const delDraft = x => window.askConfirm({
    title: "ลบร่างนี้?",
    body: (x.cust || {}).name || "",
    okText: "ลบ",
    danger: true
  }).then(ok => ok && store.removeDraft(x.id));
  if (store.loading) return React.createElement("div", {
    style: {
      padding: 30,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026");
  return React.createElement("div", {
    style: {
      padding: "4px 0 30px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49 ", rows.length, " \u0E43\u0E1A \xB7 \u0E2D\u0E2D\u0E01\u0E43\u0E19\u0E19\u0E32\u0E21\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E2B\u0E23\u0E37\u0E2D\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E18\u0E23\u0E23\u0E21\u0E14\u0E32"), canUse && React.createElement("button", {
    style: ivBtn(),
    onClick: () => setSetup(true)
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), canUse && React.createElement("button", {
    className: "btn-add",
    onClick: newInv
  }, "+ \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
      borderRadius: "var(--r-card)",
      padding: "6px 4px"
    }
  }, !rows.length && React.createElement("div", {
    style: {
      padding: 30,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49"), rows.map((x, i) => {
    const T = ivTotals(x),
      st = IV_STATUS[x.status] || IV_STATUS.draft,
      fr = ivFrom(x, store.issuers);
    return React.createElement("div", {
      key: x.id,
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "11px 14px",
        borderTop: i ? "1px solid var(--divider)" : "none",
        flexWrap: "wrap"
      }
    }, React.createElement("div", {
      style: {
        width: 150,
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)",
        cursor: "pointer"
      },
      onClick: () => canUse && setEdit(x)
    }, x.no || "ร่าง"), React.createElement("div", {
      style: {
        flex: "1 1 200px",
        minWidth: 0,
        cursor: "pointer"
      },
      onClick: () => canUse && setEdit(x)
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, window.AdminOnlyMark && React.createElement(window.AdminOnlyMark, {
      rec: x,
      size: 13,
      onClick: admin ? () => window.pgSetHidden(IV_ROOT() + "invoices/" + x.id, (x.cust || {}).name || x.no, false) : null
    }), (x.cust || {}).name || "(ยังไม่มีชื่อลูกค้า)"), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, ivDay(x.date), " \xB7 ", fr.name, x.ref ? " · " + x.ref : "")), React.createElement("div", {
      style: {
        width: 120,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, ivMoney(T.total)), window.EcPill ? React.createElement(window.EcPill, {
      th: st.th,
      color: st.color
    }) : st.th, React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, x.no && React.createElement("button", {
      style: Object.assign(ivBtn(), {
        padding: "6px 10px",
        fontSize: 12
      }),
      onClick: () => setPrint(x)
    }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C"), canUse && x.status === "issued" && React.createElement("button", {
      style: Object.assign(ivBtn(), {
        padding: "6px 10px",
        fontSize: 12
      }),
      onClick: () => setStatus(x, "paid")
    }, "\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E49\u0E27"), canUse && (x.status === "issued" || x.status === "paid") && React.createElement("button", {
      style: Object.assign(ivBtn(), {
        padding: "6px 10px",
        fontSize: 12,
        color: "var(--tint-red-tx)"
      }),
      onClick: () => setStatus(x, "void")
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), admin && !x.adminOnly && React.createElement("button", {
      title: "\u0E0B\u0E48\u0E2D\u0E19\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E47\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19",
      style: Object.assign(ivBtn(), {
        padding: "6px 10px",
        fontSize: 12
      }),
      onClick: () => window.pgSetHidden(IV_ROOT() + "invoices/" + x.id, (x.cust || {}).name || x.no, true)
    }, "\u0E0B\u0E48\u0E2D\u0E19"), canUse && x.status === "draft" && React.createElement("button", {
      style: Object.assign(ivBtn(), {
        padding: "6px 10px",
        fontSize: 12,
        color: "var(--tint-red-tx)"
      }),
      onClick: () => delDraft(x)
    }, "\u0E25\u0E1A\u0E23\u0E48\u0E32\u0E07")));
  })), edit && React.createElement(InvoiceEditor, {
    inv0: edit,
    store: store,
    jobs: jobs,
    onClose: () => setEdit(null),
    onPrint: r => setPrint(r)
  }), print && React.createElement(InvoicePaper, {
    inv: print,
    issuers: store.issuers,
    users: users,
    onClose: () => setPrint(null)
  }), setup && React.createElement(InvoiceSettings, {
    store: store,
    users: users,
    onClose: () => setSetup(false)
  }));
}
Object.assign(window, {
  InvoiceView,
  InvoicePaper,
  useInvoiceStore,
  ivTotals,
  ivAllocNo
});