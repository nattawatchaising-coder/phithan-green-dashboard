const MT_N_MAX = 244;
const MT_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,23}$/;
const mtPad = n => String(n).padStart(2, "0");
const mtIdent = s => "SITE" + mtPad(s.n) + "-" + s.name;
const MT_NO_API = "หน้านี้ใช้ได้บนเว็บจริง (flashsolar.vercel.app) เท่านั้น — เครื่องทดสอบ localhost ไม่มี API ไซต์ MikroTik";
const mtWhen = iso => iso ? new Date(iso).toLocaleString("th-TH", {
  dateStyle: "medium",
  timeStyle: "short"
}) : "—";
async function mtCall(payload) {
  const u = window.FBAUTH && window.FBAUTH.currentUser;
  if (!u) throw new Error("ยังไม่ได้ล็อกอินผ่านเซิร์ฟเวอร์ — ออกจากระบบแล้วเข้าใหม่");
  const tok = await u.getIdToken();
  const r = await fetch("/api/mikrotik/site", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + tok
    },
    body: JSON.stringify(payload)
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 404 && !j.error) throw new Error(MT_NO_API);
  if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
  return j;
}
function useMtSites() {
  const [val, setVal] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!window.FBDB) {
      setLoading(false);
      return;
    }
    const ref = window.FBDB.ref("mtSites");
    const h = ref.on("value", s => {
      setVal(s.val());
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const list = React.useMemo(() => {
    const v = val || {};
    return Object.keys(v).map(k => Object.assign({}, v[k], {
      n: Number(k)
    })).filter(s => s.n > 0).sort((a, b) => a.n - b.n);
  }, [val]);
  return {
    list,
    loading
  };
}
function useMtConfig() {
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/mikrotik/site").then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => alive && setCfg(j)).catch(() => alive && setCfg({
      configured: false,
      noApi: true,
      missing: []
    }));
    return () => {
      alive = false;
    };
  }, []);
  return cfg;
}
function MtSpec({
  label,
  value,
  mono
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "8px 11px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-1)",
      fontFamily: mono ? "var(--mono)" : "inherit",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    title: String(value)
  }, value));
}
const mtLbl = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  marginBottom: 5
};
const mtErrBox = {
  fontSize: 12.5,
  color: "var(--tint-red-tx)",
  background: "var(--tint-red-bg)",
  padding: "9px 12px",
  borderRadius: "var(--r-tile)",
  fontWeight: 600
};
const mtField = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  fontSize: 13.5,
  borderRadius: "var(--r-tile)",
  border: "none",
  fontFamily: "inherit"
};
function MtSiteForm({
  site,
  used,
  onDone,
  onCancel
}) {
  const isNew = !site;
  const nextFree = React.useMemo(() => {
    for (let i = 1; i <= MT_N_MAX; i++) if (!used.has(i)) return i;
    return "";
  }, [used]);
  const [n, setN] = React.useState(isNew ? String(nextFree) : String(site.n));
  const [name, setName] = React.useState(isNew ? "" : site.name);
  const [note, setNote] = React.useState(isNew ? "" : site.note || "");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const nNum = Number(n);
  const nErr = !/^\d+$/.test(n) || nNum < 1 || nNum > MT_N_MAX ? "1–" + MT_N_MAX : isNew && used.has(nNum) ? "เลขนี้ถูกใช้แล้ว" : "";
  const nameErr = name && !MT_NAME_RE.test(name) ? "ใช้ได้แค่ A-Z a-z 0-9 และ - (ไม่เกิน 24 ตัว)" : "";
  const ok = !nErr && name && !nameErr && !busy;
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall({
        action: isNew ? "create" : "edit",
        n: nNum,
        name,
        note
      });
      onDone(nNum);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
      borderRadius: "var(--r-card)",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, isNew ? "เพิ่มไซต์ใหม่" : "แก้ไซต์ " + mtPad(site.n)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "110px 1fr",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E40\u0E25\u0E02\u0E44\u0E0B\u0E15\u0E4C N"), React.createElement("input", {
    type: "number",
    min: "1",
    max: MT_N_MAX,
    value: n,
    disabled: !isNew,
    onChange: e => setN(e.target.value),
    style: Object.assign({}, mtField, {
      textAlign: "right",
      fontFamily: "var(--mono)"
    })
  }), nErr && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-red-tx)",
      marginTop: 4
    }
  }, nErr)), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E0B\u0E15\u0E4C (\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E31\u0E07\u0E01\u0E24\u0E29 \u2014 \u0E43\u0E0A\u0E49\u0E15\u0E31\u0E49\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E32\u0E40\u0E15\u0E2D\u0E23\u0E4C)"), React.createElement("input", {
    value: name,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 ThaiSteel",
    onChange: e => setName(e.target.value.trim()),
    style: mtField
  }), nameErr && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-red-tx)",
      marginTop: 4
    }
  }, nameErr))), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("textarea", {
    rows: 2,
    value: note,
    maxLength: 500,
    placeholder: "\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07 \xB7 \u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19 \xB7 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E23\u0E23\u0E39\u0E49",
    onChange: e => setNote(e.target.value),
    style: Object.assign({}, mtField, {
      resize: "vertical"
    })
  })), !nErr && name && !nameErr && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 8
    }
  }, React.createElement(MtSpec, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E32\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    value: "SITE" + mtPad(nNum) + "-" + name,
    mono: true
  }), React.createElement(MtSpec, {
    label: "LAN",
    value: "10.10." + nNum + ".0/24",
    mono: true
  }), React.createElement(MtSpec, {
    label: "IP \u0E43\u0E19 WireGuard",
    value: "10.99.0." + (10 + nNum),
    mono: true
  })), !isNew && name !== site.name && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E1B\u0E23\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E32\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E36\u0E07\u0E08\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19"), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: onCancel,
    disabled: busy
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "btn btn-pri",
    onClick: save,
    disabled: !ok
  }, busy ? "กำลังบันทึก…" : isNew ? "สร้างไซต์ + คีย์" : "บันทึก")));
}
function mtCopy(text, setMsg) {
  const done = () => {
    setMsg("คัดลอกแล้ว");
    setTimeout(() => setMsg(""), 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => setMsg("คัดลอกไม่ได้ — เลือกข้อความเอง"));else setMsg("เบราว์เซอร์นี้คัดลอกอัตโนมัติไม่ได้ — เลือกข้อความเอง");
}
function mtDownload(text, filename) {
  const url = URL.createObjectURL(new Blob([text], {
    type: "text/plain;charset=utf-8"
  }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function MtScriptBox({
  title,
  sub,
  text,
  filename
}) {
  const [msg, setMsg] = React.useState("");
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700
    }
  }, title), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, sub), React.createElement("div", {
    style: {
      flex: 1
    }
  }), msg && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--primary-dark)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => mtCopy(text, setMsg)
  }, "\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01"), filename && React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: () => mtDownload(text, filename)
  }, "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 ", filename)), React.createElement("textarea", {
    readOnly: true,
    value: text,
    rows: Math.min(14, text.split("\n").length + 1),
    spellCheck: false,
    style: Object.assign({}, mtField, {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      lineHeight: 1.5,
      whiteSpace: "pre",
      overflow: "auto",
      resize: "vertical"
    })
  }));
}
const mtPeerCmd = peer => "sudo mt-peer add <<'EOF'\n" + peer.replace(/\n+$/, "") + "\nEOF\n";
const mtStep = {
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--text-1)"
};
function MtFetchSteps({
  out
}) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15e3);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((out.exp - now) / 60e3));
  const until = new Date(out.exp).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit"
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      paddingTop: 4
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      padding: "9px 12px",
      borderRadius: "var(--r-tile)",
      color: left ? "var(--tint-amber-tx)" : "var(--tint-red-tx)",
      background: left ? "var(--tint-amber-bg)" : "var(--tint-red-bg)"
    }
  }, left ? "คำสั่งใช้ได้ครั้งเดียว ภายในเวลา " + until + " น. (อีก " + left + " นาที) — ห้ามส่งในแชต" : "คำสั่งหมดอายุแล้ว — กด \"คำสั่งตั้งค่า (บรรทัดเดียว)\" ใหม่"), React.createElement("div", {
    style: mtStep
  }, "1) \u0E40\u0E1E\u0E34\u0E48\u0E21 peer \u0E1A\u0E19\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C (\u0E17\u0E33\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E07\u0E02\u0E49\u0E2D 2 \u0E01\u0E47\u0E44\u0E14\u0E49)"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.6
    }
  }, "PowerShell \u0E1E\u0E34\u0E21\u0E1E\u0E4C ", React.createElement("code", null, "ssh root@", out.server_host || "<IP ของ VPS>"), " \u2192 \u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A root \u2192 \u0E23\u0E2D\u0E08\u0E19\u0E02\u0E36\u0E49\u0E19 ", React.createElement("code", null, "root@wg-server:~#"), " \u2192 \u0E27\u0E32\u0E07\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49 (\u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32) \u2192 \u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19 \"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E0B\u0E15\u0E4C \u2026 \u0E41\u0E25\u0E49\u0E27\""), React.createElement(MtScriptBox, {
    title: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E1A\u0E19 VPS",
    sub: "",
    text: mtPeerCmd(out.peer)
  }), React.createElement("div", {
    style: mtStep
  }, "2) \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 hEX \u2014 ether1 \u0E15\u0E48\u0E2D\u0E40\u0E19\u0E47\u0E15 \xB7 WinBox \u0E15\u0E48\u0E2D\u0E17\u0E32\u0E07 MAC \u2192 New Terminal \u2192 \u0E27\u0E32\u0E07\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E19\u0E35\u0E49 \u0E01\u0E14 Enter"), React.createElement(MtScriptBox, {
    title: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E1A\u0E19 hEX",
    sub: "\u0E14\u0E36\u0E07\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C \u2192 \u0E23\u0E31\u0E19 \u2192 \u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E17\u0E34\u0E49\u0E07\u0E40\u0E2D\u0E07 \xB7 \u0E02\u0E36\u0E49\u0E19 not allowed by device-mode = \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14 fetch (\u0E14\u0E39\u0E27\u0E34\u0E18\u0E35\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E17\u0E35\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19 \u0E02\u0E49\u0E2D 4)",
    text: out.command
  }), React.createElement("details", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 600
    }
  }, "\u0E16\u0E49\u0E32\u0E02\u0E36\u0E49\u0E19 error \u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07 certificate / SSL"), React.createElement("div", {
    style: {
      margin: "8px 0",
      lineHeight: 1.6
    }
  }, "RouterOS \u0E1A\u0E32\u0E07\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E15\u0E23\u0E27\u0E08 https \u2014 \u0E43\u0E0A\u0E49\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E19\u0E35\u0E49\u0E41\u0E17\u0E19 (\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E40\u0E14\u0E34\u0E21\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E44\u0E1B) \xB7 \u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E44\u0E21\u0E48\u0E15\u0E23\u0E27\u0E08\u0E27\u0E48\u0E32\u0E04\u0E38\u0E22\u0E01\u0E31\u0E1A\u0E40\u0E27\u0E47\u0E1A\u0E15\u0E31\u0E27\u0E08\u0E23\u0E34\u0E07"), React.createElement(MtScriptBox, {
    title: "\u0E44\u0E21\u0E48\u0E15\u0E23\u0E27\u0E08\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07",
    sub: "",
    text: out.command_nocheck
  })), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.6
    }
  }, "3) \u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E17\u0E49\u0E32\u0E22\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19 ", React.createElement("b", null, "OK - cert fingerprint"), " \xB7 \u0E40\u0E0A\u0E47\u0E01\u0E1A\u0E19 VPS: ", React.createElement("code", null, "mt-peer list")));
}
function MtSiteCard({
  s,
  isAdmin,
  onEdit
}) {
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");
  const [out, setOut] = React.useState(null);
  const act = async kind => {
    if (kind === "rotate") {
      const ok = await window.askConfirm({
        title: "สร้างคีย์ใหม่ให้ " + mtIdent(s) + "?",
        body: "คีย์ WireGuard และรหัส user เว็บชุดเดิมใช้ไม่ได้ทันทีที่รันสคริปต์ใหม่ · ต้องรันสคริปต์ใหม่ที่เราเตอร์ และแก้ PublicKey ของ peer บนเซิร์ฟเวอร์ ไม่งั้นไซต์หลุด VPN",
        ok: "สร้างคีย์ใหม่",
        danger: true,
        icon: "alert"
      });
      if (!ok) return;
    }
    if (kind === "remove") {
      const ok = await window.askConfirm({
        title: "ลบไซต์ " + mtIdent(s) + "?",
        body: "ลบทะเบียนไซต์และกุญแจที่เก็บไว้ถาวร กู้คืนไม่ได้ · ไม่แตะเราเตอร์จริง (ต้องลบ peer บนเซิร์ฟเวอร์เอง) · เลข " + s.n + " จะว่างให้ไซต์อื่นใช้",
        ok: "ลบถาวร",
        danger: true,
        icon: "trash"
      });
      if (!ok) return;
    }
    setBusy(kind);
    setErr("");
    try {
      const r = await mtCall({
        action: kind,
        n: s.n
      });
      if (kind === "script" || kind === "fetch-token") setOut(Object.assign({
        kind
      }, r));else setOut(null);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy("");
  };
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-card)",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      fontSize: 12,
      padding: "4px 10px",
      borderRadius: "var(--r-pill)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)"
    }
  }, mtPad(s.n)), React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "var(--mono)"
    }
  }, mtIdent(s)), s.note && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      flexBasis: "100%"
    }
  }, s.note)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 8
    }
  }, React.createElement(MtSpec, {
    label: "LAN",
    value: s.lan || "10.10." + s.n + ".0/24",
    mono: true
  }), React.createElement(MtSpec, {
    label: "hEX (\u0E40\u0E23\u0E32\u0E40\u0E15\u0E2D\u0E23\u0E4C)",
    value: "10.10." + s.n + ".1",
    mono: true
  }), React.createElement(MtSpec, {
    label: "SmartLogger",
    value: "10.10." + s.n + ".10",
    mono: true
  }), React.createElement(MtSpec, {
    label: "\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C / Waveshare",
    value: "10.10." + s.n + ".20",
    mono: true
  }), React.createElement(MtSpec, {
    label: "IP \u0E43\u0E19 WireGuard",
    value: s.wg_ip || "10.99.0." + (10 + s.n),
    mono: true
  }), React.createElement(MtSpec, {
    label: "public key",
    value: s.wg_pub || "—",
    mono: true
  }), React.createElement(MtSpec, {
    label: "\u0E04\u0E35\u0E22\u0E4C\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D",
    value: mtWhen(s.keys_at)
  }), React.createElement(MtSpec, {
    label: "\u0E02\u0E2D\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
    value: s.script_at ? mtWhen(s.script_at) + (s.script_by ? " · " + s.script_by : "") : "ยังไม่เคย"
  })), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    className: "btn btn-pri",
    disabled: !!busy,
    onClick: () => out && out.kind === "fetch-token" ? setOut(null) : act("fetch-token")
  }, busy === "fetch-token" ? "กำลังสร้าง…" : out && out.kind === "fetch-token" ? "ซ่อนคำสั่ง" : "คำสั่งตั้งค่า (บรรทัดเดียว)"), React.createElement("button", {
    className: "btn",
    disabled: !!busy,
    onClick: () => out && out.kind === "script" ? setOut(null) : act("script")
  }, busy === "script" ? "กำลังสร้าง…" : out && out.kind === "script" ? "ซ่อนสคริปต์" : "ดาวน์โหลด .rsc"), React.createElement("button", {
    className: "btn",
    disabled: !!busy,
    onClick: () => onEdit(s)
  }, "\u0E41\u0E01\u0E49\u0E0A\u0E37\u0E48\u0E2D/\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    className: "btn btn-dngr",
    disabled: !!busy,
    onClick: () => act("rotate")
  }, busy === "rotate" ? "กำลังสร้าง…" : "สร้างคีย์ใหม่"), React.createElement("button", {
    className: "btn btn-dngr",
    disabled: !!busy,
    onClick: () => act("remove")
  }, busy === "remove" ? "กำลังลบ…" : "ลบไซต์")), err && React.createElement("div", {
    style: mtErrBox
  }, err), out && out.kind === "fetch-token" && React.createElement(MtFetchSteps, {
    out: out
  }), out && out.kind === "script" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      paddingTop: 4
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "9px 12px",
      borderRadius: "var(--r-tile)",
      fontWeight: 600
    }
  }, "\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E21\u0E35\u0E01\u0E38\u0E0D\u0E41\u0E08\u0E25\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E44\u0E0B\u0E15\u0E4C \u2014 \u0E2B\u0E49\u0E32\u0E21\u0E2A\u0E48\u0E07\u0E43\u0E19\u0E41\u0E0A\u0E15\u0E01\u0E25\u0E38\u0E48\u0E21 \xB7 \u0E23\u0E31\u0E19\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E25\u0E1A\u0E44\u0E1F\u0E25\u0E4C\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E40\u0E23\u0E32\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E30\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07"), React.createElement(MtScriptBox, {
    title: "\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C RouterOS",
    sub: "\u0E23\u0E31\u0E19\u0E17\u0E35\u0E48 hEX \u0E14\u0E49\u0E27\u0E22 /import (\u0E15\u0E48\u0E2D WinBox \u0E17\u0E32\u0E07 MAC)",
    text: out.rsc,
    filename: out.filename
  }), React.createElement(MtScriptBox, {
    title: "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21 peer \u0E1A\u0E19\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C",
    sub: "SSH \u0E40\u0E02\u0E49\u0E32 VPS \u0E41\u0E25\u0E49\u0E27\u0E27\u0E32\u0E07\u0E17\u0E31\u0E49\u0E07\u0E01\u0E49\u0E2D\u0E19 (\u0E04\u0E25\u0E34\u0E01\u0E02\u0E27\u0E32) \u0E01\u0E14 Enter",
    text: "sudo mt-peer add <<'EOF'\n" + out.peer.replace(/\n+$/, "") + "\nEOF\n"
  })));
}
function MtSitesView({
  role
}) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const {
    list,
    loading
  } = useMtSites();
  const cfg = useMtConfig();
  const [host, setHost] = React.useState("");
  React.useEffect(() => {
    if (isAdmin && cfg && cfg.configured) mtCall({
      action: "info"
    }).then(j => setHost(j.server_host || "")).catch(() => {});
  }, [isAdmin, cfg && cfg.configured]);
  const [form, setForm] = React.useState(null);
  const used = React.useMemo(() => new Set(list.map(s => s.n)), [list]);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
      borderRadius: "var(--r-card)",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "baseline",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E44\u0E0B\u0E15\u0E4C MikroTik"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "hEX \u0E15\u0E48\u0E2D WireGuard \u0E40\u0E02\u0E49\u0E32\u0E40\u0E0B\u0E34\u0E23\u0E4C\u0E1F\u0E40\u0E27\u0E2D\u0E23\u0E4C \xB7 \u0E44\u0E0B\u0E15\u0E4C N \u0E43\u0E0A\u0E49 LAN 10.10.N.0/24 \u0E41\u0E25\u0E30 10.99.0.(10+N)"), React.createElement("div", {
    style: {
      flex: 1
    }
  }), isAdmin && !form && React.createElement("button", {
    className: "btn-add",
    onClick: () => setForm("new")
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E0B\u0E15\u0E4C")), cfg && cfg.noApi && React.createElement("div", {
    style: mtErrBox
  }, MT_NO_API), cfg && !cfg.configured && !cfg.noApi && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "9px 12px",
      borderRadius: "var(--r-tile)",
      fontWeight: 600
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07 env \u0E43\u0E19 Vercel: ", (cfg.missing || []).join(", "), " \u2014 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E0B\u0E15\u0E4C/\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E15\u0E31\u0E49\u0E07 (docs/mikrotik.md)"), !isAdmin && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E44\u0E0B\u0E15\u0E4C\u0E41\u0E25\u0E30\u0E2A\u0E04\u0E23\u0E34\u0E1B\u0E15\u0E4C\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19"), isAdmin && window.MtGuide && React.createElement(window.MtGuide, {
    sites: list,
    serverHost: host
  })), form && React.createElement(MtSiteForm, {
    site: form === "new" ? null : form,
    used: used,
    onCancel: () => setForm(null),
    onDone: () => setForm(null)
  }), loading ? React.createElement("div", {
    style: {
      padding: 18,
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : !list.length ? React.createElement("div", {
    style: {
      padding: 18,
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C") : list.map(s => React.createElement(MtSiteCard, {
    key: s.n,
    s: s,
    isAdmin: isAdmin,
    onEdit: x => setForm(x)
  })));
}
window.MtSitesView = MtSitesView;