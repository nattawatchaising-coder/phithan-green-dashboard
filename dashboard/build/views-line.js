const LN_KIND = [{
  key: "assign",
  th: "มอบหมายงาน",
  icon: "🔧",
  hint: "ช่างถูกมอบหมายงานใหม่ — เรื่องที่ควรเปิดไว้เสมอ"
}, {
  key: "reject",
  th: "เอกสารถูกตีกลับ",
  icon: "⚠️",
  hint: "งานค้างจนกว่าเจ้าตัวจะรู้ — ควรเปิดไว้เสมอ"
}, {
  key: "om",
  th: "งานบริการหลังการขาย",
  icon: "🛠️",
  hint: "ใบแจ้งซ่อม · มอบหมายงานบริการ"
}, {
  key: "expense",
  th: "ใบเบิกเงิน",
  icon: "💸",
  hint: "ส่งขออนุมัติ · อนุมัติ · จ่ายคืน"
}, {
  key: "ot",
  th: "ใบขอ OT",
  icon: "⏱️",
  hint: "ขออนุมัติ · ผลการอนุมัติ"
}, {
  key: "permit",
  th: "งานขออนุญาต",
  icon: "📄",
  hint: "เอกสารพร้อมยื่น"
}, {
  key: "daily",
  th: "รายงานประจำวัน",
  icon: "📝",
  hint: "ส่งรายงาน · อนุมัติรายงาน"
}, {
  key: "attend",
  th: "เตือนเรื่องลงเวลา",
  icon: "📍",
  hint: "สรุปตอนเย็น — ยังไม่ออกงาน · ยังไม่ส่งรายงาน"
}, {
  key: "info",
  th: "อื่น ๆ",
  icon: "🔔",
  hint: "แจ้งเตือนที่ไม่เข้าชนิดไหนเลย"
}];
const LN_QUOTA_DEFAULT = 300;
function useLnPushLog(n) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!window.FBDB) {
      setLoading(false);
      return;
    }
    const ref = window.FBDB.ref("lnPushLog").orderByKey().limitToLast(Math.max(50, +n || 800));
    const h = ref.on("value", s => {
      const v = s.val() || {};
      setRows(Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k])));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [n]);
  return {
    rows,
    loading
  };
}
function useLnConfig() {
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("config/linePush");
    const h = ref.on("value", s => setCfg(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(next => {
    if (window.FBDB) window.FBDB.ref("config/linePush").set(next);
  }, []);
  return {
    cfg,
    save
  };
}
function useLnLinks() {
  const [links, setLinks] = React.useState({});
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("lineLinks");
    const h = ref.on("value", s => setLinks(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  return links;
}
const lnMonthOf = at => String(at || "").slice(0, 7);
function lnLocalParts(t) {
  const d = new Date(t);
  const iso = new Date(t - d.getTimezoneOffset() * 60000).toISOString();
  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16)
  };
}
function lnLeftText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return m + " นาที";
  const h = Math.floor(m / 60);
  return h + " ชม." + (m % 60 ? " " + m % 60 + " น." : "");
}
function LnWebSwitch({
  currentUser
}) {
  const gate = window.useLnWebGate ? window.useLnWebGate() : {
    cfg: null,
    loading: true,
    open: false,
    now: Date.now(),
    save: function () {}
  };
  const [hours, setHours] = React.useState("8");
  const cfg = gate.cfg || {};
  const hrs = window.LN_WEB_HOURS || [];
  const openIt = hKey => {
    const h = (hrs.find(x => x.key === hKey) || {}).h || 0;
    gate.save({
      on: 1,
      until: h ? new Date(Date.now() + h * 3600000).toISOString() : null,
      at: new Date().toISOString(),
      byId: (currentUser || {}).id || "",
      byName: (currentUser || {}).name || ""
    });
  };
  const shut = () => gate.save({
    on: 0,
    until: null,
    at: new Date().toISOString(),
    byId: (currentUser || {}).id || "",
    byName: (currentUser || {}).name || ""
  });
  const left = gate.open && cfg.until ? Date.parse(cfg.until) - gate.now : 0;
  const until = cfg.until ? lnLocalParts(Date.parse(cfg.until)) : null;
  const tone = gate.open ? "#F59E0B" : "var(--text-3)";
  return React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E17\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E0A\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C"), React.createElement("div", {
    style: {
      marginTop: 4,
      marginBottom: 10,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E2B\u0E19\u0E49\u0E32 ", React.createElement("b", null, "/liff.html"), " \u0E40\u0E1B\u0E34\u0E14\u0E1A\u0E19\u0E04\u0E2D\u0E21\u0E44\u0E14\u0E49\u0E14\u0E49\u0E27\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E14\u0E34\u0E21 \u2014 \u0E21\u0E35\u0E44\u0E27\u0E49\u0E14\u0E39\u0E41\u0E25\u0E30\u0E41\u0E01\u0E49\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E15\u0E2D\u0E19\u0E1E\u0E31\u0E12\u0E19\u0E32\u0E23\u0E30\u0E1A\u0E1A", React.createElement("br", null), "\u0E0A\u0E48\u0E32\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E43\u0E0A\u0E49\u0E17\u0E32\u0E07\u0E19\u0E35\u0E49 (\u0E40\u0E02\u0E32\u0E40\u0E02\u0E49\u0E32\u0E08\u0E32\u0E01\u0E40\u0E21\u0E19\u0E39\u0E43\u0E19\u0E41\u0E0A\u0E15) \u0E1B\u0E01\u0E15\u0E34\u0E08\u0E36\u0E07\u0E04\u0E27\u0E23\u0E1B\u0E34\u0E14\u0E44\u0E27\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E15\u0E2D\u0E19\u0E08\u0E30\u0E43\u0E0A\u0E49"), React.createElement("div", {
    style: {
      padding: "15px 17px",
      borderRadius: 15,
      background: "var(--surface)",
      border: "1px solid " + (gate.open ? tone : "var(--border)")
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: gate.open ? tone : "var(--text-2)"
    }
  }, gate.loading ? "กำลังอ่านค่า…" : gate.open ? "เปิดอยู่" : "ปิดอยู่"), React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, gate.loading ? "\u00a0" : gate.open ? cfg.until ? "ปิดเองอัตโนมัติ " + window.drShort(until.date) + " " + until.time + " น. · เหลืออีก " + lnLeftText(left) : "เปิดค้างไว้จนกว่าจะกดปิดเอง" : "ใครเปิด /liff.html บนเบราว์เซอร์จะเจอจอแจ้งว่าทางเข้านี้ปิดอยู่", cfg.byName ? React.createElement(React.Fragment, null, React.createElement("br", null), gate.open ? "เปิดโดย " : "ปิดโดย ", cfg.byName) : null)), React.createElement("button", {
    onClick: () => gate.open ? shut() : openIt(hours),
    disabled: gate.loading,
    style: {
      width: 46,
      height: 26,
      borderRadius: 99,
      border: "none",
      cursor: gate.loading ? "default" : "pointer",
      padding: 3,
      background: gate.open ? tone : "var(--surface3)",
      display: "flex",
      justifyContent: gate.open ? "flex-end" : "flex-start",
      transition: "background .15s"
    }
  }, React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 99,
      background: "#fff",
      display: "block"
    }
  }))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, gate.open ? "ต่อเวลาเป็น" : "เปิดครั้งนี้นาน"), hrs.map(x => React.createElement("button", {
    key: x.key,
    onClick: () => {
      setHours(x.key);
      if (gate.open) openIt(x.key);
    },
    style: {
      padding: "5px 12px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (hours === x.key ? "var(--primary)" : "var(--border)"),
      background: hours === x.key ? "var(--primary-soft)" : "var(--surface2)",
      color: hours === x.key ? "var(--primary)" : "var(--text-2)"
    }
  }, x.th)))), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D", React.createElement("b", null, "\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E31\u0E19\u0E40\u0E1C\u0E25\u0E2D \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E33\u0E41\u0E1E\u0E07\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22"), " \u2014 \u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E01\u0E31\u0E19\u0E04\u0E19\u0E41\u0E1B\u0E25\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E23\u0E34\u0E07 \u0E46 \u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19 \u0E2A\u0E27\u0E34\u0E15\u0E0A\u0E4C\u0E19\u0E35\u0E49\u0E41\u0E04\u0E48\u0E40\u0E2D\u0E32\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01 URL \u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E30\u0E43\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E43\u0E0A\u0E49", React.createElement("br", null), "\u0E1B\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48", React.createElement("b", null, "\u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E43\u0E04\u0E23\u0E40\u0E25\u0E22"), " \u2014 \u0E0A\u0E48\u0E32\u0E07\u0E40\u0E02\u0E49\u0E32\u0E08\u0E32\u0E01\u0E40\u0E21\u0E19\u0E39\u0E43\u0E19\u0E41\u0E0A\u0E15\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34 \u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E40\u0E02\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34"));
}
function LineAdminView({
  users,
  currentUser
}) {
  const log = useLnPushLog(800);
  const {
    cfg,
    save
  } = useLnConfig();
  const links = useLnLinks();
  const [month, setMonth] = React.useState(window.drToday().slice(0, 7));
  const quota = Math.max(1, +(cfg || {}).quota || LN_QUOTA_DEFAULT);
  const kinds = cfg && cfg.kinds || null;
  const isOn = k => kinds ? !!kinds[k] : true;
  const months = React.useMemo(() => {
    const set = {};
    (log.rows || []).forEach(r => {
      const m = lnMonthOf(r.at);
      if (m) set[m] = 1;
    });
    set[window.drToday().slice(0, 7)] = 1;
    return Object.keys(set).sort().reverse();
  }, [log.rows]);
  const stat = React.useMemo(() => {
    const out = {
      sent: 0,
      fail: 0,
      calls: 0,
      byKind: {},
      byDay: {}
    };
    (log.rows || []).forEach(r => {
      if (lnMonthOf(r.at) !== month) return;
      const ok = +r.ok || 0;
      out.calls += 1;
      out.sent += ok;
      out.fail += Math.max(0, (+r.n || 0) - ok);
      const k = r.kind || "info";
      out.byKind[k] = (out.byKind[k] || 0) + ok;
      const d = String(r.at || "").slice(0, 10);
      out.byDay[d] = (out.byDay[d] || 0) + ok;
    });
    return out;
  }, [log.rows, month]);
  const unbound = React.useMemo(() => (users || []).filter(u => u && u.active !== false && !u.lineUserId), [users]);
  const bound = (users || []).filter(u => u && u.active !== false && u.lineUserId).length;
  const pct = Math.min(100, Math.round(stat.sent / quota * 100));
  const tone = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";
  const days = Object.keys(stat.byDay).sort();
  const peak = days.reduce((a, d) => Math.max(a, stat.byDay[d]), 0) || 1;
  const today = window.drToday();
  const sameMonth = month === today.slice(0, 7);
  const dayNo = sameMonth ? +today.slice(8, 10) : 31;
  const projected = sameMonth && dayNo > 2 ? Math.round(stat.sent / dayNo * 31) : null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      minHeight: 0,
      maxWidth: 900
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("select", {
    value: month,
    onChange: e => setMonth(e.target.value),
    style: window.TM_IN
  }, months.map(m => React.createElement("option", {
    key: m,
    value: m
  }, window.drDateTH(m + "-01").replace(/^\d+ /, "")))), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1C\u0E39\u0E01 LINE \u0E41\u0E25\u0E49\u0E27 ", bound, " \u0E04\u0E19", unbound.length ? " · ยังไม่ผูก " + unbound.length + " คน" : "")), React.createElement("div", {
    style: {
      padding: "16px 18px",
      borderRadius: 15,
      background: "var(--surface)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 32,
      fontWeight: 800,
      color: tone
    }
  }, stat.sent), React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "/ ", quota, " \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"), React.createElement("label", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E42\u0E04\u0E27\u0E15\u0E32\u0E02\u0E2D\u0E07\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08", React.createElement("input", {
    type: "number",
    min: 1,
    value: quota,
    onChange: e => save(Object.assign({}, cfg || {}, {
      quota: Math.max(1, +e.target.value || LN_QUOTA_DEFAULT)
    })),
    style: Object.assign({}, window.TM_IN, {
      width: 92,
      padding: "6px 9px",
      fontSize: 12
    })
  }))), React.createElement("div", {
    style: {
      marginTop: 11,
      height: 9,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: tone,
      transition: "width .25s"
    }
  })), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, "\u0E40\u0E23\u0E35\u0E22\u0E01\u0E2A\u0E48\u0E07 ", stat.calls, " \u0E04\u0E23\u0E31\u0E49\u0E07 \xB7 \u0E2A\u0E48\u0E07\u0E16\u0E36\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A ", stat.sent, " \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21", stat.fail ? " · ส่งไม่สำเร็จ " + stat.fail : "", projected != null && React.createElement("div", {
    style: {
      marginTop: 3,
      color: projected > quota ? "#EF4444" : "var(--text-3)",
      fontWeight: projected > quota ? 700 : 400
    }
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E08\u0E30\u0E08\u0E1A\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 ", projected, " \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21", projected > quota ? " — เกินโควตา ควรปิดชนิดที่ไม่เร่งด่วนด้านล่าง" : "")), days.length > 0 && React.createElement("div", {
    style: {
      marginTop: 13,
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height: 54
    }
  }, days.map(d => React.createElement("div", {
    key: d,
    title: window.drDateTH(d) + " · " + stat.byDay[d] + " ข้อความ",
    style: {
      flex: 1,
      minWidth: 4,
      height: Math.max(3, Math.round(stat.byDay[d] / peak * 54)),
      background: "var(--primary)",
      opacity: .75,
      borderRadius: 3
    }
  }))), React.createElement("div", {
    style: {
      marginTop: 11,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E17\u0E35\u0E48 ", React.createElement("b", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E23\u0E32\u0E2A\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E44\u0E1B"), " \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48 LINE \u0E19\u0E31\u0E1A\u0E43\u0E2B\u0E49 \u2014 \u0E22\u0E2D\u0E14\u0E08\u0E23\u0E34\u0E07\u0E14\u0E39\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 LINE OA Manager \u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E04\u0E27\u0E23\u0E43\u0E01\u0E25\u0E49\u0E01\u0E31\u0E19 \u0E16\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19\u0E21\u0E32\u0E01\u0E41\u0E1B\u0E25\u0E27\u0E48\u0E32\u0E21\u0E35\u0E1A\u0E32\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49", React.createElement("br", null), "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E15\u0E2D\u0E19\u0E21\u0E35\u0E04\u0E19\u0E17\u0E31\u0E01\u0E41\u0E0A\u0E15 (reply) ", React.createElement("b", null, "\u0E44\u0E21\u0E48\u0E19\u0E31\u0E1A\u0E42\u0E04\u0E27\u0E15\u0E32"), " \u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49")), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19\u0E2A\u0E48\u0E07\u0E40\u0E02\u0E49\u0E32 LINE \u0E1A\u0E49\u0E32\u0E07"), React.createElement("div", {
    style: {
      marginTop: 4,
      marginBottom: 10,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27", React.createElement("b", null, "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E2B\u0E32\u0E22"), " \u2014 \u0E43\u0E1A\u0E22\u0E31\u0E07\u0E02\u0E36\u0E49\u0E19\u0E01\u0E23\u0E30\u0E14\u0E34\u0E48\u0E07\u0E1A\u0E19\u0E40\u0E27\u0E47\u0E1A\u0E41\u0E25\u0E30\u0E43\u0E19\u0E41\u0E2D\u0E1B\u0E44\u0E25\u0E19\u0E4C\u0E04\u0E23\u0E1A\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21 \u0E41\u0E04\u0E48\u0E44\u0E21\u0E48\u0E40\u0E14\u0E49\u0E07\u0E40\u0E02\u0E49\u0E32\u0E41\u0E0A\u0E15", React.createElement("br", null), "\u0E21\u0E35\u0E1C\u0E25\u0E17\u0E31\u0E19\u0E17\u0E35 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E31\u0E1B\u0E40\u0E27\u0E47\u0E1A\u0E43\u0E2B\u0E21\u0E48"), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, LN_KIND.map(k => {
    const on = isOn(k.key);
    const used = stat.byKind[k.key] || 0;
    return React.createElement("div", {
      key: k.key,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 17,
        width: 22,
        textAlign: "center"
      }
    }, k.icon), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, k.th), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        lineHeight: 1.5
      }
    }, k.hint)), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 800,
        color: used ? "var(--text-1)" : "var(--text-3)",
        minWidth: 42,
        textAlign: "right"
      }
    }, used), React.createElement("button", {
      onClick: () => {
        const base = {};
        LN_KIND.forEach(x => {
          base[x.key] = isOn(x.key) ? 1 : 0;
        });
        base[k.key] = on ? 0 : 1;
        save(Object.assign({}, cfg || {}, {
          kinds: base
        }));
      },
      style: {
        width: 46,
        height: 26,
        borderRadius: 99,
        border: "none",
        cursor: "pointer",
        padding: 3,
        background: on ? "var(--primary)" : "var(--surface3)",
        display: "flex",
        justifyContent: on ? "flex-end" : "flex-start",
        transition: "background .15s"
      }
    }, React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        borderRadius: 99,
        background: "#fff",
        display: "block"
      }
    })));
  }))), unbound.length > 0 && React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1C\u0E39\u0E01\u0E1A\u0E31\u0E0D\u0E0A\u0E35 LINE \xB7 ", unbound.length, " \u0E04\u0E19"), React.createElement("div", {
    style: {
      marginTop: 4,
      marginBottom: 9,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E04\u0E19\u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E35\u0E49", React.createElement("b", null, "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E17\u0E32\u0E07 LINE \u0E40\u0E25\u0E22"), " \u0E44\u0E21\u0E48\u0E27\u0E48\u0E32\u0E08\u0E30\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E27\u0E34\u0E15\u0E0A\u0E4C\u0E44\u0E27\u0E49\u0E22\u0E31\u0E07\u0E44\u0E07 \u2014 \u0E40\u0E02\u0E32\u0E08\u0E30\u0E40\u0E2B\u0E47\u0E19\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E01\u0E23\u0E30\u0E14\u0E34\u0E48\u0E07\u0E1A\u0E19\u0E40\u0E27\u0E47\u0E1A", React.createElement("br", null), "\u0E27\u0E34\u0E18\u0E35\u0E1C\u0E39\u0E01: \u0E41\u0E2D\u0E14 OA \u0E40\u0E1B\u0E47\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19 \u2192 \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07 \u2192 \u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E14\u0E34\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, unbound.map(u => React.createElement("span", {
    key: u.id,
    style: {
      padding: "5px 11px",
      borderRadius: 99,
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      fontSize: 12,
      color: "var(--text-2)",
      fontWeight: 600
    }
  }, u.name)))), React.createElement(LnWebSwitch, {
    currentUser: currentUser
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.8
    }
  }, React.createElement("b", null, "\u0E16\u0E49\u0E32\u0E42\u0E04\u0E27\u0E15\u0E32\u0E43\u0E01\u0E25\u0E49\u0E40\u0E15\u0E47\u0E21"), " \u0E25\u0E33\u0E14\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E17\u0E33: \u0E1B\u0E34\u0E14 \u201C\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u201D \u0E01\u0E31\u0E1A \u201C\u0E2D\u0E37\u0E48\u0E19 \u0E46\u201D \u0E01\u0E48\u0E2D\u0E19 (\u0E04\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E2D\u0E1B\u0E40\u0E08\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27) \u2192 \u0E1B\u0E34\u0E14 \u201C\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u201D \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E2A\u0E34\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2192 \u0E40\u0E01\u0E47\u0E1A \u201C\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22\u0E07\u0E32\u0E19\u201D \u0E01\u0E31\u0E1A \u201C\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E16\u0E39\u0E01\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A\u201D \u0E44\u0E27\u0E49\u0E08\u0E19\u0E16\u0E36\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2A\u0E2D\u0E07\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E04\u0E49\u0E32\u0E07\u0E16\u0E49\u0E32\u0E04\u0E19\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49", React.createElement("br", null), React.createElement("b", null, "\u0E16\u0E49\u0E32\u0E40\u0E15\u0E47\u0E21\u0E1A\u0E48\u0E2D\u0E22"), " \u0E17\u0E32\u0E07\u0E41\u0E01\u0E49\u0E08\u0E23\u0E34\u0E07\u0E04\u0E37\u0E2D\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1E\u0E47\u0E01\u0E40\u0E01\u0E08\u0E02\u0E2D\u0E07 LINE OA \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E44\u0E25\u0E48\u0E1B\u0E34\u0E14\u0E08\u0E19\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E2D\u0E30\u0E44\u0E23"));
}
Object.assign(window, {
  LineAdminView,
  LnWebSwitch,
  LN_KIND,
  useLnPushLog,
  useLnConfig,
  useLnLinks,
  lnLocalParts,
  lnLeftText
});