const LN_SESSION_KEY = "solarflow_session_v1";
const LN_TEST = (() => {
  try {
    return new URLSearchParams(location.search).get("test") === "1";
  } catch (e) {
    return false;
  }
})();
function lnPush(notifId) {
  if (!notifId) return;
  try {
    fetch("/api/line/push", {
      method: "POST",
      keepalive: true,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        notifId: notifId
      })
    }).catch(() => {});
  } catch (e) {}
}
function useLnSession() {
  const [state, setState] = React.useState({
    phase: "loading",
    userId: null,
    error: "",
    idToken: null,
    profile: null
  });
  React.useEffect(() => {
    let dead = false;
    (async () => {
      const liffId = window.LN_LIFF_ID || "";
      if (!window.liff) return !dead && setState({
        phase: "error",
        error: "โหลด LINE SDK ไม่สำเร็จ ลองเปิดใหม่อีกครั้ง"
      });
      if (!liffId) return !dead && setState({
        phase: "error",
        error: "ยังไม่ได้ตั้ง LIFF ID ในหน้านี้"
      });
      try {
        await window.liff.init({
          liffId: liffId
        });
      } catch (e) {
        return !dead && setState({
          phase: "error",
          error: "เริ่มต้น LIFF ไม่สำเร็จ: " + (e && e.message || e)
        });
      }
      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }
      const idToken = window.liff.getIDToken();
      if (!idToken) return !dead && setState({
        phase: "error",
        error: "ไม่ได้รับ ID token — ต้องเปิด scope “openid” ให้ LIFF app ในคอนโซล LINE Developers"
      });
      let profile = null;
      try {
        profile = await window.liff.getProfile();
      } catch (e) {}
      try {
        const r = await fetch("/api/line/session", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({
            idToken: idToken
          })
        });
        const j = await r.json().catch(() => null);
        if (dead) return;
        if (!r.ok || !j) {
          const inLine = function () {
            try {
              return window.liff.isInClient();
            } catch (e) {
              return false;
            }
          }();
          const why = r.status === 401 ? inLine ? "เซสชันหมดอายุ — ปิดหน้านี้แล้วกดเมนูด้านล่างในแชตใหม่อีกครั้ง" : "หน้านี้เปิดได้จากแอป LINE เท่านั้น — กดเมนูด้านล่างในแชต flash+solar" : j && j.error || "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ";
          return setState({
            phase: "error",
            error: why,
            idToken,
            profile
          });
        }
        if (j.bound) {
          try {
            localStorage.setItem(LN_SESSION_KEY, j.userId);
          } catch (e) {}
          return setState({
            phase: "ready",
            userId: j.userId,
            idToken,
            profile,
            error: ""
          });
        }
        setState({
          phase: "bind",
          userId: null,
          idToken,
          profile,
          error: ""
        });
      } catch (e) {
        if (!dead) setState({
          phase: "error",
          error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ",
          idToken,
          profile
        });
      }
    })();
    return () => {
      dead = true;
    };
  }, []);
  const bind = React.useCallback(async (username, pin) => {
    try {
      const r = await fetch("/api/line/bind", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          idToken: state.idToken,
          username,
          pin
        })
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.userId) return {
        ok: false,
        error: j && j.error || "เชื่อมบัญชีไม่สำเร็จ"
      };
      try {
        localStorage.setItem(LN_SESSION_KEY, j.userId);
      } catch (e) {}
      setState(s => Object.assign({}, s, {
        phase: "ready",
        userId: j.userId,
        error: ""
      }));
      return {
        ok: true
      };
    } catch (e) {
      return {
        ok: false,
        error: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ"
      };
    }
  }, [state.idToken]);
  return {
    phase: state.phase,
    userId: state.userId,
    error: state.error,
    profile: state.profile,
    bind
  };
}
function LnSplash({
  text,
  sub,
  tone
}) {
  return React.createElement("div", {
    style: {
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: 28,
      background: "var(--bg)"
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center",
      maxWidth: 340
    }
  }, React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, window.BrandMark ? React.createElement(window.BrandMark, {
    size: 44
  }) : null), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: tone === "bad" ? "#EF4444" : "var(--text-1)",
      lineHeight: 1.5
    }
  }, text), sub && React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 12.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, sub)));
}
function LnBindScreen({
  profile,
  onBind
}) {
  const [u, setU] = React.useState("");
  const [p, setP] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const submit = async () => {
    if (busy) return;
    if (!u.trim() || !p) return setErr("กรอกชื่อผู้ใช้และรหัสผ่านให้ครบ");
    setBusy(true);
    setErr("");
    const r = await onBind(u.trim(), p);
    setBusy(false);
    if (!r.ok) setErr(r.error || "เชื่อมบัญชีไม่สำเร็จ");
  };
  const inp = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid var(--border-strong)",
    background: "var(--surface2)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 16,
    outline: "none"
  };
  return React.createElement("div", {
    style: {
      minHeight: "100dvh",
      background: "var(--bg)",
      padding: "34px 22px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 400,
      width: "100%",
      margin: "0 auto"
    }
  }, React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 22
    }
  }, window.BrandLockup ? React.createElement(window.BrandLockup, {
    size: 30
  }) : React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 22
    }
  }, "flash+solar"), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 13.5,
      color: "var(--text-2)",
      lineHeight: 1.6
    }
  }, "\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E1A\u0E31\u0E0D\u0E0A\u0E35 LINE ", profile && profile.displayName ? "“" + profile.displayName + "” " : "", "\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19", React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E17\u0E33\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E43\u0E0A\u0E49\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A"))), React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 18
    }
  }, React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)",
      letterSpacing: ".04em"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49"), React.createElement("input", {
    value: u,
    onChange: e => {
      setU(e.target.value);
      setErr("");
    },
    autoCapitalize: "none",
    autoCorrect: "off",
    autoComplete: "username",
    spellCheck: false,
    style: Object.assign({
      marginTop: 6,
      marginBottom: 14
    }, inp),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 somchai"
  }), React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)",
      letterSpacing: ".04em"
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"), React.createElement("input", {
    value: p,
    type: "password",
    inputMode: "numeric",
    autoComplete: "current-password",
    onChange: e => {
      setP(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter") submit();
    },
    style: Object.assign({
      marginTop: 6
    }, inp),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022"
  }), err && React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 12.5,
      color: "#EF4444",
      fontWeight: 600
    }
  }, "\u26A0 ", err), React.createElement("button", {
    onClick: submit,
    disabled: busy,
    style: {
      marginTop: 16,
      width: "100%",
      padding: "14px 16px",
      borderRadius: 12,
      border: "none",
      background: busy ? "var(--text-3)" : "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 15,
      cursor: busy ? "default" : "pointer"
    }
  }, busy ? "กำลังเชื่อม…" : "เชื่อมบัญชี")), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.6
    }
  }, "\u0E25\u0E37\u0E21\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \u2014 \u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17")));
}
function LnGate({
  children
}) {
  const s = useLnSession();
  if (s.phase === "loading") return React.createElement(LnSplash, {
    text: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A\u2026"
  });
  if (s.phase === "error") return React.createElement(LnSplash, {
    tone: "bad",
    text: "\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    sub: s.error
  });
  if (s.phase === "bind") return React.createElement(LnBindScreen, {
    profile: s.profile,
    onBind: s.bind
  });
  return children;
}
Object.assign(window, {
  LN_TEST,
  LN_SESSION_KEY,
  lnPush,
  useLnSession,
  LnGate,
  LnSplash,
  LnBindScreen
});