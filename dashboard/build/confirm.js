let _openAsk = null;
function askConfirm(opts) {
  const o = typeof opts === "string" ? {
    title: opts
  } : opts || {};
  if (!_openAsk) return Promise.resolve(window.confirm(o.title || o.body || "ยืนยัน?"));
  return new Promise(resolve => _openAsk(Object.assign({}, o, {
    resolve
  })));
}
function ConfirmHost() {
  const [req, setReq] = React.useState(null);
  React.useEffect(() => {
    _openAsk = r => setReq(r);
    return () => {
      _openAsk = null;
    };
  }, []);
  const done = React.useCallback(ok => {
    setReq(cur => {
      if (cur && cur.resolve) cur.resolve(ok);
      return null;
    });
  }, []);
  React.useEffect(() => {
    if (!req) return;
    const onKey = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        done(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        done(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [req, done]);
  if (!req) return null;
  const danger = req.danger !== false;
  const accent = danger ? "#EF4444" : "var(--primary)";
  const icon = req.icon || (danger ? "trash" : "alert");
  return React.createElement("div", {
    onClick: () => done(false),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 9000,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-modal": "true",
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      width: "min(420px, 100%)",
      padding: 20,
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: danger ? "var(--tint-red-bg)" : "var(--primary-soft)"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 18,
    color: accent
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 800,
      color: "var(--text-1)",
      lineHeight: 1.45,
      wordBreak: "break-word"
    }
  }, req.title || "ยืนยันการทำรายการ?"), req.body && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      marginTop: 5,
      lineHeight: 1.6,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }
  }, req.body))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      marginTop: 18
    }
  }, React.createElement("button", {
    onClick: () => done(false),
    style: {
      padding: "10px 16px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, req.cancel || "ยกเลิก"), React.createElement("button", {
    autoFocus: true,
    onClick: () => done(true),
    style: {
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: accent,
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, req.ok || (danger ? "ลบ" : "ตกลง")))));
}
Object.assign(window, {
  askConfirm,
  ConfirmHost
});