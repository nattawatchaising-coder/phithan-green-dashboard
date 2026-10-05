function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DV_P3_FIRST = "ต้นแบบ";
const dvP3Key = (jobId, ver) => !jobId ? null : ver && String(ver) !== "1" ? jobId + "~" + ver : jobId;
const dvP3Split = key => {
  const m = /^(.*)~(\d+)$/.exec(String(key || ""));
  return m ? {
    jobId: m[1],
    ver: m[2]
  } : {
    jobId: key,
    ver: "1"
  };
};
const dvUser = u => ({
  by: u && (u.id || u.uid) || "",
  byName: u && (u.name || u.displayName) || ""
});
const dvNextId = ids => String(Math.max(1, ...ids.map(x => +x || 0)) + 1);
const dvWhen = t => {
  if (!t) return "";
  const d = new Date(t);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short"
  }) + " " + d.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit"
  });
};
function dvUseNode(path) {
  const [v, setV] = React.useState(undefined);
  React.useEffect(() => {
    if (!path || !window.FBDB) {
      setV(null);
      return;
    }
    const ref = window.FBDB.ref(path);
    const h = ref.on("value", s => setV(s.val() || null));
    return () => ref.off("value", h);
  }, [path]);
  return v;
}
function useP3Vers(jobId) {
  const idx = dvUseNode(jobId ? "plan3dVers/" + jobId : null);
  return React.useMemo(() => {
    const m = idx || {};
    const first = Object.assign({
      name: DV_P3_FIRST
    }, m["1"] || {}, {
      id: "1"
    });
    const rest = Object.keys(m).filter(k => k !== "1" && m[k]).sort((a, b) => +a - +b).map(k => Object.assign({
      name: "เวอร์ชัน " + k
    }, m[k], {
      id: k
    }));
    return {
      list: [first].concat(rest),
      loading: idx === undefined
    };
  }, [idx]);
}
const dvP3Name = (list, ver) => {
  const v = (list || []).find(x => x.id === String(ver || "1"));
  return v ? v.name : ver && ver !== "1" ? "เวอร์ชัน " + ver : DV_P3_FIRST;
};
function dvP3Saved(key, data) {
  if (!window.FBDB || !key) return;
  const k = dvP3Split(key);
  const s = window.p3PlanSummary ? window.p3PlanSummary(data) : null;
  window.FBDB.ref("plan3dVers/" + k.jobId + "/" + k.ver + "/sum").set({
    panels: s ? s.panels : 0,
    kwp: s ? s.kwp : 0,
    at: Date.now()
  });
}
function dvP3Create(jobId, fromVer, list, user, name) {
  const id = dvNextId((list || []).map(x => x.id));
  const db = window.FBDB;
  return db.ref("plan3d/" + dvP3Key(jobId, fromVer)).once("value").then(s => {
    const v = s.val();
    const meta = Object.assign({
      name: (name || "").trim() || "เวอร์ชัน " + id,
      from: String(fromVer || "1"),
      at: Date.now()
    }, dvUser(user));
    const src = (list || []).find(x => x.id === String(fromVer || "1"));
    if (src && src.sum) meta.sum = src.sum;
    return Promise.all([v ? db.ref("plan3d/" + dvP3Key(jobId, id)).set(v) : null, db.ref("plan3dVers/" + jobId + "/" + id).set(meta)]);
  }).then(() => id);
}
const dvP3Rename = (jobId, ver, name) => window.FBDB.ref("plan3dVers/" + jobId + "/" + ver + "/name").set((name || "").trim() || null);
const dvP3Delete = (jobId, ver) => String(ver) === "1" ? Promise.resolve() : Promise.all([window.FBDB.ref("plan3d/" + dvP3Key(jobId, ver)).remove(), window.FBDB.ref("plan3dVers/" + jobId + "/" + ver).remove()]);
function useBoqVers(jobId, activeBoq) {
  const node = dvUseNode(jobId ? "boqVers/" + jobId : null);
  return React.useMemo(() => {
    const act = String(activeBoq && activeBoq.ver || "1");
    const m = node || {};
    let list = Object.keys(m).filter(k => m[k]).sort((a, b) => +a - +b).map(k => Object.assign({
      name: "เวอร์ชัน " + k
    }, m[k], {
      id: k
    }));
    const real = list.length > 0;
    if (!real) list = activeBoq ? [{
      id: "1",
      name: "เวอร์ชัน 1",
      boq: activeBoq
    }] : [];
    list = list.map(x => x.id === act && activeBoq ? Object.assign({}, x, {
      boq: activeBoq
    }) : x);
    return {
      list,
      active: act,
      real,
      loading: node === undefined
    };
  }, [node, activeBoq]);
}
function dvBoqSave(jobId, ver, boq, vers, patchActive) {
  const v = String(ver || "1");
  const out = Object.assign({}, boq, {
    ver: v
  });
  const jobs = [];
  if (vers && vers.real && window.FBDB) jobs.push(window.FBDB.ref("boqVers/" + jobId + "/" + v).update({
    boq: out,
    at: Date.now()
  }));
  if (!vers || v === vers.active) patchActive(out);
  return Promise.all(jobs);
}
function dvBoqCreate(jobId, vers, opt, user) {
  const db = window.FBDB;
  const ps = [];
  const list = vers.list || [];
  if (!vers.real && list.length) {
    const first = list[0];
    ps.push(db.ref("boqVers/" + jobId + "/1").set(Object.assign({
      name: first.name,
      at: Date.now(),
      boq: Object.assign({}, first.boq, {
        ver: "1"
      })
    }, dvUser(user))));
  }
  const id = dvNextId(list.map(x => x.id));
  const src = opt.from ? list.find(x => x.id === opt.from) : null;
  const boq = Object.assign({}, src ? src.boq : {}, {
    ver: id,
    plan3d: String(opt.plan3d || "1")
  });
  delete boq.savedAt;
  ps.push(db.ref("boqVers/" + jobId + "/" + id).set(Object.assign({
    name: (opt.name || "").trim() || "เวอร์ชัน " + id,
    at: Date.now(),
    from: opt.from || "",
    boq
  }, dvUser(user))));
  return Promise.all(ps).then(() => ({
    id,
    boq
  }));
}
const dvBoqRename = (jobId, ver, name) => window.FBDB.ref("boqVers/" + jobId + "/" + ver + "/name").set((name || "").trim() || "เวอร์ชัน " + ver);
const dvBoqDelete = (jobId, ver) => window.FBDB.ref("boqVers/" + jobId + "/" + ver).remove();
const DV_CSS = `
.dv-bd{position:fixed;inset:0;background:rgba(8,20,14,.45);backdrop-filter:blur(3px);z-index:125;display:grid;place-items:center;padding:20px}
.dv-card{background:var(--bg);border-radius:18px;width:min(560px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45)}
.dv-hd{padding:16px 20px;background:var(--surface);box-shadow:var(--shadow-sm);flex-shrink:0;display:flex;align-items:center;gap:10px}
.dv-hd .k{font-size:10.5px;font-weight:800;color:var(--text-3)}
.dv-hd .t{font-size:14.5px;font-weight:700;color:var(--text-1);margin-top:2px}
.dv-list{padding:14px;overflow-y:auto;display:flex;flex-direction:column;gap:9px}
.dv-row{background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:11px 13px;display:flex;align-items:center;gap:11px}
.dv-row[data-on="1"]{box-shadow:var(--shadow-sm),inset 3px 0 0 var(--primary)}
.dv-row .no{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:12px;font-weight:800;flex-shrink:0;background:var(--surface2);color:var(--text-2)}
.dv-row[data-on="1"] .no{background:var(--primary-soft);color:var(--primary-dark)}
.dv-row .nm{font-size:13.5px;font-weight:700;color:var(--text-1);display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.dv-row .mt{font-size:11.5px;color:var(--text-3);margin-top:2px;line-height:1.45}
.dv-tag{font-size:10px;font-weight:800;padding:2px 7px;border-radius:var(--r-pill);background:var(--primary-soft);color:var(--primary-dark)}
.dv-tag.ind{background:color-mix(in srgb,#4F46E5 12%,transparent);color:#4F46E5}
.dv-ic{width:30px;height:30px;border-radius:9px;border:none;background:transparent;color:var(--text-3);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
.dv-ic:hover{background:var(--surface2);color:var(--text-1)}
.dv-ic:disabled{opacity:.35;cursor:default;background:transparent}
.dv-new{margin:0 14px 14px;background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:12px 13px;display:flex;flex-direction:column;gap:9px}
.dv-new .lb{font-size:10.5px;font-weight:800;color:var(--text-3)}
.dv-f{display:grid;grid-template-columns:110px 1fr;align-items:center;gap:9px}
.dv-f > span{font-size:12px;font-weight:700;color:var(--text-2)}
.dv-in{width:100%;box-sizing:border-box;background:var(--surface2);box-shadow:var(--shadow-inset);border:none;border-radius:var(--r-chip);padding:9px 11px;font-family:inherit;font-size:13px;color:var(--text-1)}
.dv-ft{padding:12px 16px;background:var(--surface);box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:10px;flex-shrink:0}
.dv-err{font-size:11.5px;font-weight:700;color:var(--tint-red-tx)}
@media (max-width:860px){.dv-bd{place-items:end center;padding:0}.dv-card{border-radius:20px 20px 0 0;width:100%;max-height:92dvh}.dv-f{grid-template-columns:1fr}}
`;
function DvShell({
  k,
  t,
  onClose,
  children,
  foot
}) {
  const bd = window.useBackdropClose ? window.useBackdropClose(onClose) : {
    onClick: onClose
  };
  React.useEffect(() => {
    const h = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return React.createElement("div", _extends({
    className: "dv-bd"
  }, bd), React.createElement("style", null, DV_CSS), React.createElement("div", {
    className: "dv-card",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "dv-hd"
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "k"
  }, k), React.createElement("div", {
    className: "t"
  }, t)), React.createElement("button", {
    className: "dv-ic",
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14"
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), children, foot && React.createElement("div", {
    className: "dv-ft"
  }, foot)));
}
function DvName({
  value,
  onSave,
  ro
}) {
  const [ed, setEd] = React.useState(null);
  if (ed == null) return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, value, !ro && React.createElement("button", {
    className: "dv-ic",
    style: {
      width: 24,
      height: 24
    },
    title: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D",
    onClick: e => {
      e.stopPropagation();
      setEd(value || "");
    }
  }, React.createElement(Icon, {
    name: "pen",
    size: 12
  })));
  const done = ok => {
    if (ok && ed.trim() && ed.trim() !== value) onSave(ed.trim());
    setEd(null);
  };
  return React.createElement("input", {
    className: "dv-in",
    autoFocus: true,
    value: ed,
    style: {
      padding: "5px 9px",
      maxWidth: 220
    },
    onClick: e => e.stopPropagation(),
    onChange: e => setEd(e.target.value),
    onBlur: () => done(true),
    onKeyDown: e => {
      if (e.key === "Enter") done(true);else if (e.key === "Escape") {
        e.stopPropagation();
        done(false);
      }
    }
  });
}
function P3VerModal({
  job,
  currentUser,
  boqLinks,
  onOpen,
  onClose,
  ro,
  mode
}) {
  const only = mode === "new";
  const jobId = job && job.id;
  const {
    list,
    loading
  } = useP3Vers(jobId);
  const [from, setFrom] = React.useState("1");
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const create = () => {
    setBusy(true);
    setErr("");
    dvP3Create(jobId, from, list, currentUser, name).then(id => {
      setBusy(false);
      onOpen(id);
    }).catch(e => {
      setBusy(false);
      setErr("สร้างไม่สำเร็จ — " + (e && e.message ? e.message : "ลองใหม่อีกครั้ง"));
    });
  };
  const del = v => {
    if (!window.confirm("ลบ \"" + v.name + "\" ทั้งแบบ?\nกู้คืนไม่ได้ — ต้นแบบและเวอร์ชันอื่นไม่ถูกแตะ")) return;
    dvP3Delete(jobId, v.id).catch(() => setErr("ลบไม่สำเร็จ"));
  };
  return React.createElement(DvShell, {
    k: "วางแผง 3D" + (job && job.code ? " · " + job.code : ""),
    t: only ? "ทำแบบ 3D ใหม่" : "จัดการเวอร์ชันแบบ",
    onClose: onClose
  }, !only && React.createElement("div", {
    className: "dv-list"
  }, list.map(v => {
    const links = (boqLinks || {})[v.id] || [];
    const s = v.sum;
    return React.createElement("div", {
      key: v.id,
      className: "dv-row",
      "data-on": v.id === "1" ? "1" : "0",
      style: {
        cursor: "pointer"
      },
      onClick: () => onOpen(v.id)
    }, React.createElement("span", {
      className: "no"
    }, v.id === "1" ? "V1" : "V" + v.id), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      className: "nm"
    }, React.createElement(DvName, {
      value: v.name,
      ro: ro,
      onSave: n => dvP3Rename(jobId, v.id, n)
    }), v.id === "1" && React.createElement("span", {
      className: "dv-tag"
    }, "\u0E15\u0E49\u0E19\u0E41\u0E1A\u0E1A"), links.map(n => React.createElement("span", {
      key: n,
      className: "dv-tag ind"
    }, "BOQ \xB7 ", n))), React.createElement("div", {
      className: "mt"
    }, s ? s.panels ? s.panels.toLocaleString() + " แผง · " + s.kwp + " kWp" : "ยังไม่มีแผง" : v.id === "1" ? "แบบเดิมของงานนี้" : "", s && s.at ? " · บันทึก " + dvWhen(s.at) : "", v.id !== "1" && v.from ? " · คัดลอกจาก " + dvP3Name(list, v.from) : "")), !ro && v.id !== "1" && React.createElement("button", {
      className: "dv-ic",
      title: links.length ? "มี BOQ ใช้แบบนี้อยู่ — ย้าย BOQ ไปแบบอื่นก่อนจึงลบได้" : "ลบเวอร์ชันนี้",
      disabled: links.length > 0,
      onClick: e => {
        e.stopPropagation();
        del(v);
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 14
    })), React.createElement(Icon, {
      name: "arrowRight",
      size: 16,
      color: "var(--text-3)"
    }));
  })), !ro && !loading && React.createElement("div", {
    className: "dv-new",
    style: only ? {
      marginTop: 14
    } : null
  }, !only && React.createElement("div", {
    className: "lb"
  }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48"), React.createElement("label", {
    className: "dv-f"
  }, React.createElement("span", null, "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E08\u0E32\u0E01"), React.createElement(Dropdown, {
    value: from,
    onChange: v => setFrom(v),
    options: list.map(v => ({
      value: v.id,
      label: (v.id === "1" ? "V1 · " : "V" + v.id + " · ") + v.name
    }))
  })), React.createElement("label", {
    className: "dv-f"
  }, React.createElement("span", null, "\u0E0A\u0E37\u0E48\u0E2D"), React.createElement("input", {
    className: "dv-in",
    value: name,
    placeholder: "เวอร์ชัน " + dvNextId(list.map(x => x.id)),
    onChange: e => setName(e.target.value)
  })), err && React.createElement("div", {
    className: "dv-err"
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy,
    onClick: create
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "#fff"
  }), " ", busy ? "กำลังคัดลอก…" : "สร้างแล้วเปิด"))));
}
function BoqVerModal({
  job,
  activeBoq,
  currentUser,
  patchActive,
  onOpen,
  onClose,
  ro,
  mode
}) {
  const only = mode === "new";
  const jobId = job && job.id;
  const vers = useBoqVers(jobId, activeBoq);
  const p3 = useP3Vers(jobId);
  const [from, setFrom] = React.useState("");
  const [plan, setPlan] = React.useState(null);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const fromDef = from || vers.active;
  const linked = vers.list.map(x => String((x.boq || {}).plan3d || "1"));
  const free = p3.list.filter(v => linked.indexOf(v.id) < 0);
  const planDef = plan != null ? plan : free.length ? free[free.length - 1].id : String(((vers.list.find(x => x.id === fromDef) || {}).boq || {}).plan3d || "1");
  const create = () => {
    setBusy(true);
    setErr("");
    dvBoqCreate(jobId, vers, {
      from: fromDef === "blank" ? "" : fromDef,
      plan3d: planDef,
      name
    }, currentUser).then(r => {
      setBusy(false);
      onOpen(r.id, r.boq, Object.assign({}, vers, {
        real: true
      }));
    }).catch(e => {
      setBusy(false);
      setErr("สร้างไม่สำเร็จ — " + (e && e.message ? e.message : "ลองใหม่อีกครั้ง"));
    });
  };
  const use = v => {
    patchActive(Object.assign({}, v.boq, {
      ver: v.id
    }));
  };
  const del = v => {
    if (!window.confirm("ลบ BOQ \"" + v.name + "\"?\nกู้คืนไม่ได้ — เวอร์ชันอื่นไม่ถูกแตะ")) return;
    dvBoqDelete(jobId, v.id).catch(() => setErr("ลบไม่สำเร็จ"));
  };
  const sell = b => b && b.pricing && +b.pricing.sell > 0 ? "ราคาขาย ฿" + Math.round(+b.pricing.sell).toLocaleString() : "";
  return React.createElement(DvShell, {
    k: "ถอดวัสดุ BOQ" + (job && job.code ? " · " + job.code : ""),
    t: only ? "ทำ BOQ ใบใหม่" : "จัดการเวอร์ชัน BOQ",
    onClose: onClose
  }, !only && React.createElement("div", {
    className: "dv-list"
  }, vers.list.length === 0 && React.createElement("div", {
    style: {
      padding: 14,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 BOQ \u2014 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E41\u0E23\u0E01\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07"), vers.list.map(v => {
    const on = v.id === vers.active;
    const b = v.boq || {};
    return React.createElement("div", {
      key: v.id,
      className: "dv-row",
      "data-on": on ? "1" : "0",
      style: {
        cursor: "pointer"
      },
      onClick: () => onOpen(v.id, b, vers)
    }, React.createElement("span", {
      className: "no"
    }, "V", v.id), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      className: "nm"
    }, vers.real ? React.createElement(DvName, {
      value: v.name,
      ro: ro,
      onSave: n => dvBoqRename(jobId, v.id, n)
    }) : v.name, on && React.createElement("span", {
      className: "dv-tag"
    }, "\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \xB7 \u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E14\u0E36\u0E07\u0E43\u0E1A\u0E19\u0E35\u0E49")), React.createElement("div", {
      className: "mt"
    }, "\u0E41\u0E1A\u0E1A 3D: ", React.createElement("b", {
      style: {
        color: "#4F46E5"
      }
    }, dvP3Name(p3.list, b.plan3d)), +b.panels > 0 ? " · " + b.panels + " แผง" : "", sell(b) ? " · " + sell(b) : "", v.at ? " · " + dvWhen(v.at) : "")), !ro && !on && React.createElement("button", {
      className: "btn btn-sm btn-soft",
      title: "\u0E43\u0E2B\u0E49\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32/\u0E07\u0E32\u0E19 \u0E43\u0E0A\u0E49 BOQ \u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
      onClick: e => {
        e.stopPropagation();
        use(v);
      }
    }, "\u0E43\u0E0A\u0E49\u0E43\u0E1A\u0E19\u0E35\u0E49"), !ro && !on && vers.real && React.createElement("button", {
      className: "dv-ic",
      title: "\u0E25\u0E1A\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E19\u0E35\u0E49",
      onClick: e => {
        e.stopPropagation();
        del(v);
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 14
    })), React.createElement(Icon, {
      name: "arrowRight",
      size: 16,
      color: "var(--text-3)"
    }));
  })), !ro && !vers.loading && React.createElement("div", {
    className: "dv-new",
    style: only ? {
      marginTop: 14
    } : null
  }, !only && React.createElement("div", {
    className: "lb"
  }, vers.list.length ? "สร้าง BOQ เวอร์ชันใหม่" : "สร้าง BOQ"), vers.list.length > 0 && React.createElement("label", {
    className: "dv-f"
  }, React.createElement("span", null, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E08\u0E32\u0E01"), React.createElement(Dropdown, {
    value: fromDef,
    onChange: v => {
      setFrom(v);
      setPlan(null);
    },
    options: vers.list.map(v => ({
      value: v.id,
      label: "คัดลอก V" + v.id + " · " + v.name
    })).concat([{
      value: "blank",
      label: "ใบเปล่า (ถอดใหม่หมด)"
    }])
  })), React.createElement("label", {
    className: "dv-f"
  }, React.createElement("span", null, "\u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E1A 3D"), React.createElement(Dropdown, {
    value: planDef,
    onChange: v => setPlan(v),
    options: p3.list.map(v => ({
      value: v.id,
      label: "V" + v.id + " · " + v.name + (v.sum && v.sum.panels ? " (" + v.sum.panels + " แผง)" : "")
    }))
  })), React.createElement("label", {
    className: "dv-f"
  }, React.createElement("span", null, "\u0E0A\u0E37\u0E48\u0E2D"), React.createElement("input", {
    className: "dv-in",
    value: name,
    placeholder: "เวอร์ชัน " + dvNextId(vers.list.map(x => x.id)),
    onChange: e => setName(e.target.value)
  })), err && React.createElement("div", {
    className: "dv-err"
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy,
    onClick: create
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "#fff"
  }), " ", busy ? "กำลังสร้าง…" : "สร้างแล้วเปิด"))));
}
function useDesignVersions({
  job,
  activeBoq,
  currentUser,
  patchActive,
  BoqEditor,
  editorProps,
  P3Entry,
  onP3Open,
  ro
}) {
  const jobId = job && job.id;
  const p3 = useP3Vers(jobId);
  const vers = useBoqVers(jobId, activeBoq);
  const [pick, setPick] = React.useState(null);
  const [ed, setEd] = React.useState(null);
  const [p3Ver, setP3Ver] = React.useState(null);
  React.useEffect(() => {
    setPick(null);
    setEd(null);
    setP3Ver(null);
  }, [jobId]);
  const boqLinks = React.useMemo(() => {
    const o = {};
    vers.list.forEach(v => {
      const k = String((v.boq || {}).plan3d || "1");
      (o[k] = o[k] || []).push(v.name);
    });
    return o;
  }, [vers.list]);
  const openBoq = force => {
    if (!force && vers.list.length <= 1) setEd({
      ver: (vers.list[0] || {}).id || "1",
      boq: activeBoq,
      vers
    });else setPick("boq");
  };
  const openP3 = force => {
    if (!force && p3.list.length <= 1) {
      if (onP3Open) onP3Open("1");else setP3Ver("1");
    } else setPick("p3");
  };
  const actName = (vers.list.find(x => x.id === vers.active) || {}).name;
  const boqSub = vers.list.length > 1 ? vers.list.length + " เวอร์ชัน · ใช้งาน: " + actName + " · แบบ 3D " + dvP3Name(p3.list, (activeBoq || {}).plan3d) : null;
  const p3Sub = p3.list.length > 1 ? p3.list.length + " เวอร์ชัน · " + p3.list.map(v => v.name).join(" · ") : null;
  const edJob = ed ? Object.assign({}, job, {
    boq: ed.boq || null
  }) : null;
  const edVers = ed ? vers.list.some(x => x.id === ed.ver) ? vers : ed.vers : null;
  const ui = React.createElement(React.Fragment, null, (pick === "p3" || pick === "p3-new") && React.createElement(P3VerModal, {
    mode: pick === "p3-new" ? "new" : null,
    job: job,
    currentUser: currentUser,
    boqLinks: boqLinks,
    ro: ro,
    onClose: () => setPick(null),
    onOpen: v => {
      setPick(null);
      if (onP3Open) onP3Open(v);else setP3Ver(v);
    }
  }), (pick === "boq" || pick === "boq-new") && React.createElement(BoqVerModal, {
    mode: pick === "boq-new" ? "new" : null,
    job: job,
    activeBoq: activeBoq,
    currentUser: currentUser,
    patchActive: patchActive,
    ro: ro,
    onClose: () => setPick(null),
    onOpen: (v, b, vs) => {
      setPick(null);
      setEd({
        ver: v,
        boq: b,
        vers: vs
      });
    }
  }), ed && BoqEditor && React.createElement(BoqEditor, _extends({}, editorProps, {
    job: edJob,
    ver: ed.ver,
    verName: (edVers.list.find(x => x.id === ed.ver) || {}).name || "เวอร์ชัน " + ed.ver,
    p3Vers: p3.list,
    onClose: () => setEd(null),
    onSave: ro || !patchActive ? null : b => {
      dvBoqSave(jobId, ed.ver, b, edVers, patchActive);
      setEd(null);
    }
  })), p3Ver && P3Entry && React.createElement(P3Entry, {
    job: job,
    ver: p3Ver,
    verName: dvP3Name(p3.list, p3Ver),
    currentUser: currentUser,
    onClose: () => setP3Ver(null)
  }));
  const openP3Ver = v => {
    if (onP3Open) onP3Open(v);else setP3Ver(v);
  };
  const openBoqVer = id => {
    const v = vers.list.find(x => x.id === id);
    setEd({
      ver: id,
      boq: v ? v.boq : null,
      vers
    });
  };
  const newP3 = () => setPick("p3-new");
  const newBoq = () => {
    if (!vers.list.length) setEd({
      ver: "1",
      boq: null,
      vers
    });else setPick("boq-new");
  };
  return {
    boqSub,
    p3Sub,
    openBoq,
    openP3,
    ui,
    nBoq: vers.list.length,
    nP3: p3.list.length,
    p3List: p3.list,
    boqVers: vers,
    boqLinks,
    openP3Ver,
    openBoqVer,
    newP3,
    newBoq,
    manageP3: () => setPick("p3"),
    manageBoq: () => setPick("boq")
  };
}
Object.assign(window, {
  dvP3Key,
  dvP3Split,
  dvP3Saved,
  dvP3Name,
  useP3Vers,
  useBoqVers,
  dvBoqSave,
  P3VerModal,
  BoqVerModal,
  useDesignVersions
});
function DvRowWrap({
  n,
  onVers,
  children
}) {
  return React.createElement("div", {
    style: {
      position: "relative"
    }
  }, onVers && React.isValidElement(children) ? React.cloneElement(children, {
    style: Object.assign({}, children.props.style, {
      paddingRight: 150
    })
  }) : children, onVers && React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    onClick: onVers,
    title: "\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \xB7 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E0A\u0E31\u0E19\u0E43\u0E2B\u0E21\u0E48",
    style: {
      position: "absolute",
      right: 42,
      top: "50%",
      transform: "translateY(calc(-50% - 4.5px))",
      padding: "5px 10px",
      fontSize: 11.5
    }
  }, React.createElement(Icon, {
    name: "history",
    size: 13
  }), " ", n > 1 ? n + " เวอร์ชัน" : "+ เวอร์ชัน"));
}
Object.assign(window, {
  DvRowWrap
});
const DVC_CSS = `
.dvc{background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:14px 16px;margin-bottom:10px}
.dvc-hd{display:flex;align-items:center;gap:9px}
.dvc-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0}
.dvc-t{display:block;font-size:13.5px;font-weight:700;color:var(--text-1)}
.dvc-s{display:block;font-size:11px;color:var(--text-3);margin-top:1px}
.dvc-btn{display:inline-flex;align-items:center;gap:4px;background:var(--surface2);box-shadow:var(--shadow-sm);border:none;border-radius:var(--r-chip);padding:5px 10px;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:700;color:var(--primary-dark);white-space:nowrap}
.dvc-btn.ghost{background:transparent;box-shadow:none;color:var(--text-3)}
.dvc-btn.ghost:hover{color:var(--text-1);background:var(--surface2)}
.dvc-list{margin-top:9px;display:flex;flex-direction:column;gap:6px}
.dvc-row{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);box-shadow:var(--shadow-sm);border:none;border-radius:var(--r-tile);cursor:pointer;font-family:inherit;text-align:left}
.dvc-row[data-on="1"]{background:var(--surface2)}
.dvc-row:hover{box-shadow:var(--shadow-card)}
.dvc-no{font-size:10.5px;font-weight:800;color:var(--text-2);background:var(--surface2);padding:2px 7px;border-radius:var(--r-pill);font-family:var(--mono)}
.dvc-row[data-on="1"] .dvc-no{background:var(--primary-soft);color:var(--primary-dark)}
.dvc-nm{font-size:12.5px;font-weight:700;color:var(--text-1)}
.dvc-tag{font-size:10px;font-weight:800;color:var(--primary-dark);background:var(--primary-soft);padding:1px 7px;border-radius:var(--r-pill)}
.dvc-mt{display:block;font-size:11px;color:var(--text-3);margin-top:1px}
.dvc-v{font-size:13px;font-weight:800;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.dvc-pill{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:var(--r-pill);white-space:nowrap}
.dvc-empty{font-size:12.5px;color:var(--text-3);margin-top:8px}
@media (max-width:560px){.dvc-pill{display:none}}
`;
function DvVerCard({
  kind,
  dvs,
  title,
  sub,
  icon,
  color,
  canNew
}) {
  const isP3 = kind === "p3";
  const p3List = dvs.p3List || [];
  const vers = dvs.boqVers || {
    list: []
  };
  const list = isP3 ? p3List : vers.list;
  const nfmt = n => (+n || 0).toLocaleString();
  const rows = list.map(v => {
    if (isP3) {
      const s = v.sum,
        links = (dvs.boqLinks || {})[v.id] || [];
      return {
        id: v.id,
        on: v.id === "1",
        name: v.name,
        tag: v.id === "1" ? "ต้นแบบ" : null,
        meta: [v.id === "1" ? "แบบแรกของงานนี้" : v.from ? "คัดลอกจาก " + dvP3Name(p3List, v.from) : "", s && s.at ? "บันทึก " + dvWhen(s.at) : v.at ? "สร้าง " + dvWhen(v.at) : "", v.byName || ""].filter(Boolean).join(" · "),
        val: s && s.panels ? nfmt(s.panels) + " แผง · " + s.kwp + " kWp" : s ? "ยังไม่มีแผง" : "",
        pill: links.length ? {
          th: "BOQ · " + links.join(", "),
          c: "#4F46E5"
        } : null
      };
    }
    const b = v.boq || {},
      on = v.id === vers.active;
    const sell = b.pricing && +b.pricing.sell > 0 ? +b.pricing.sell : 0;
    return {
      id: v.id,
      on,
      name: v.name,
      tag: on ? "ใช้งาน" : null,
      meta: ["แบบ 3D: " + dvP3Name(p3List, b.plan3d), +b.panels > 0 ? nfmt(b.panels) + " แผง" : "", v.at ? dvWhen(v.at) : "", v.byName || ""].filter(Boolean).join(" · "),
      val: sell ? "฿" + nfmt(Math.round(sell)) : "",
      pill: on ? {
        th: "ใบเสนอราคาดึงใบนี้",
        c: "#0F7A5C"
      } : null
    };
  });
  const ordered = rows.filter(r => r.on).concat(rows.filter(r => !r.on).sort((a, b) => +b.id - +a.id));
  const many = list.length > 1;
  const open = id => isP3 ? dvs.openP3Ver(id) : dvs.openBoqVer(id);
  return React.createElement("div", {
    className: "dvc"
  }, React.createElement("style", null, DVC_CSS), React.createElement("div", {
    className: "dvc-hd"
  }, React.createElement("span", {
    className: "dvc-ic",
    style: {
      background: "color-mix(in srgb," + color + " 13%,transparent)"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 16,
    color: color
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    className: "dvc-t"
  }, title), sub && React.createElement("span", {
    className: "dvc-s"
  }, sub)), canNew && many && React.createElement("button", {
    className: "dvc-btn ghost",
    onClick: isP3 ? dvs.manageP3 : dvs.manageBoq,
    title: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E25\u0E1A \xB7 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"), canNew && React.createElement("button", {
    className: "dvc-btn",
    onClick: isP3 ? dvs.newP3 : dvs.newBoq
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: "var(--primary-dark)"
  }), " ", isP3 ? "ทำแบบใหม่" : list.length ? "ทำใบใหม่" : "ถอด BOQ")), !ordered.length ? React.createElement("div", {
    className: "dvc-empty"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 BOQ \u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49") : React.createElement("div", {
    className: "dvc-list"
  }, ordered.map(r => React.createElement("button", {
    key: r.id,
    className: "dvc-row",
    "data-on": r.on && many ? "1" : "0",
    onClick: () => open(r.id)
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    className: "dvc-no"
  }, "V", r.id), React.createElement("span", {
    className: "dvc-nm"
  }, r.name), many && r.tag && React.createElement("span", {
    className: "dvc-tag"
  }, r.tag)), r.meta && React.createElement("span", {
    className: "dvc-mt"
  }, r.meta)), r.val && React.createElement("span", {
    className: "dvc-v"
  }, r.val), many && r.pill && React.createElement("span", {
    className: "dvc-pill",
    style: {
      color: r.pill.c,
      background: "color-mix(in srgb," + r.pill.c + " 11%,transparent)"
    }
  }, r.pill.th), React.createElement(Icon, {
    name: "arrowRight",
    size: 15,
    color: "var(--text-3)"
  })))));
}
Object.assign(window, {
  DvVerCard
});
