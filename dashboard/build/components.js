const ICONS = {
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM4 14h6v6H4z",
  kanban: "M4 4h16M5.5 6.5v13.5M12 6.5v8.5M18.5 6.5v11",
  table: "M4 5h16v14H4zM4 10h16M10 10v9",
  calendar: "M4 5h16v15H4zM4 10h16M8.5 3v4M15.5 3v4M8.5 15h0M12 15h0M15.5 15h0",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronDown: "M6 9l6 6 6-6",
  x: "M6 6l12 12M18 6 6 18",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  home: "M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5",
  building: "M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2",
  battery: "M3 8h14v8H3zM17 11h3v2h-3M6 11v2M9 11v2",
  sun: "M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  panel: "M3 4h18l1 9H2zM7 13v7M17 13v7M12 4v16M2 13h20M5 20h14",
  check: "M5 12l4 4L19 7",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 7.5V12l3 1.8",
  alert: "M12 3 2 20h20zM12 10v4M12 17.5v.5",
  user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  pin: "M12 21.5c4.7-5.3 7-9.1 7-11.5a7 7 0 1 0-14 0c0 2.4 2.3 6.2 7 11.5zM12 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  box: "M21 8 12 3 3 8l9 5zM3 8v8l9 5 9-5V8M12 13v8",
  wallet: "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9V6.6a2 2 0 0 1 1.7-2l9.6-1.5a1 1 0 0 1 1.2 1V6M20 11.5h-3a1.5 1.5 0 0 0 0 3h3",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h0M4.5 12h0M4.5 18h0",
  trend: "M4 16.5l5.5-5.5 4 4L20 8M20 8h-4.5M20 8v4.5",
  chart: "M4.5 3.5v16h16M8.5 16.5v-4.5M13 16.5v-8.5M17.5 16.5v-5.5",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  settings: "M10.54 4.13L13.46 4.13L13.65 6.23L14.91 6.75L16.53 5.41L18.59 7.47L17.25 9.09L17.77 10.35L19.87 10.54L19.87 13.46L17.77 13.65L17.25 14.91L18.59 16.53L16.53 18.59L14.91 17.25L13.65 17.77L13.46 19.87L10.54 19.87L10.35 17.77L9.09 17.25L7.47 18.59L5.41 16.53L6.75 14.91L6.23 13.65L4.13 13.46L4.13 10.54L6.23 10.35L6.75 9.09L5.41 7.47L7.47 5.41L9.09 6.75L10.35 6.23zM12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z",
  menu: "M3 6h18M3 12h18M3 18h18",
  flow: "M5 6h6M5 12h14M5 18h9M17 4l2 2-2 2M14 16l2 2-2 2",
  wrench: "M14.6 6.3a1 1 0 0 0 0 1.4l1.7 1.7a1 1 0 0 0 1.4 0l4-4a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z",
  history: "M3 3v5h5M3.05 13a9 9 0 1 0 2.5-6.5L3 8M12 7v5l4 2",
  shield: "M12 3 4.5 5.8v5.7c0 4.7 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.8 7.5-9.5V5.8zM12 3v18",
  image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 16l-5-5L5 21",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 10h0M12 10h0M16 10h0",
  power: "M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  net: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  file: "M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8zM14 2.5V8h5.5M8 13h8M8 17h6",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  ruler: "M3 15 15 3l6 6L9 21zM7.5 10.5l2 2M10.5 7.5l2 2M13.5 4.5l2 2",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  clipboard: "M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 2.5h6a1 1 0 0 1 1 1V5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1zM9 12h6M9 16h4",
  camera: "M3 7h3l2-3h8l2 3h3v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  shuffle: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  hand: "M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 11a2 2 0 0 1 4 0v3a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1a2 2 0 0 1 4 0",
  trash: "M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3",
  undo: "M3 7v6h6M3.5 13a9 9 0 1 1 2.6 6.4",
  gridDots: "M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18",
  sparkle: "M11 3 12.9 8.1 18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9zM18 15l.75 2.25L21 18l-2.25.75L18 21l-.75-2.25L15 18l2.25-.75z"
};
function Icon({
  name,
  size = 18,
  color = "currentColor",
  fill = "none",
  sw = 1.75,
  style
}) {
  const d = ICONS[name];
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: fill,
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flexShrink: 0,
      ...style
    }
  }, d.split("M").filter(Boolean).map((seg, i) => React.createElement("path", {
    key: i,
    d: "M" + seg
  })));
}
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function thDate(s, withYear) {
  if (!s) return "—";
  const d = parseDate(s);
  return d.getDate() + " " + TH_MONTHS[d.getMonth()] + (withYear ? " " + (d.getFullYear() + 543).toString().slice(-2) : "");
}
function thDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.getDate() + " " + TH_MONTHS[d.getMonth()] + " " + (d.getFullYear() + 543).toString().slice(-2);
  const time = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  return date + " · " + time + " น.";
}
function fmtBaht(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "k";
  return "" + n;
}
function stageOf(key) {
  return window.SF.STAGES[window.SF.STAGE_INDEX[key]];
}
function StageBadge({
  stageKey,
  size = "md"
}) {
  const s = stageOf(stageKey);
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const fs = size === "sm" ? 11 : 12.5;
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: pad,
      borderRadius: "var(--r-pill)",
      background: s.soft,
      color: s.fg,
      fontWeight: 600,
      fontSize: fs,
      whiteSpace: "nowrap"
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--r-pill)",
      background: s.color
    }
  }), s.th);
}
const HdrCtx = React.createContext(null);
const HDR_SLOT_ID = "app-hdr-filter-slot";
function HdrSlot() {
  return React.createElement("div", {
    id: HDR_SLOT_ID,
    className: "header-filters in-top"
  });
}
function HdrSlotFill({
  children
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [el, setEl] = React.useState(null);
  React.useEffect(() => {
    setEl(isMobile ? null : document.getElementById(HDR_SLOT_ID));
  });
  if (isMobile) return children;
  return el ? ReactDOM.createPortal(children, el) : null;
}
function TypeBadge({
  type
}) {
  const key = type === "biz" ? "project" : type;
  const t = window.SF.TYPES.find(x => x.key === key) || window.SF.TYPES[0];
  if (!t) return null;
  return React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--type-" + t.key + "-fg, " + t.color + ")",
      background: "var(--type-" + t.key + "-bg, " + t.color + "1A)",
      padding: "3px 8px",
      borderRadius: "var(--r-chip)",
      whiteSpace: "nowrap"
    }
  }, t.th);
}
function MatChip({
  status,
  label,
  compact
}) {
  const m = window.SF.MAT_STATUS[status] || window.SF.MAT_STATUS.none;
  return React.createElement("span", {
    title: label ? label + " · " + m.th : m.th,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: compact ? "2px 7px" : "3px 9px",
      borderRadius: "var(--r-pill)",
      background: m.soft,
      color: m.fg,
      fontWeight: 700,
      fontSize: compact ? 10.5 : 11,
      whiteSpace: "nowrap"
    }
  }, React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--r-pill)",
      background: m.color,
      flexShrink: 0
    }
  }), !compact && (label || m.th));
}
function TechAvatar({
  techId,
  size = 28,
  showName
}) {
  const t = window.SF.TECH_BY_ID[techId];
  if (!t) return null;
  const initial = t.nick.slice(0, 2);
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: "var(--r-pill)",
      background: t.color,
      color: "#fff",
      display: "grid",
      placeItems: "center",
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0
    }
  }, initial), showName && React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--text-1)"
    }
  }, t.name));
}
function ProgressBar({
  pct,
  color = "var(--primary)",
  height = 6
}) {
  return React.createElement("div", {
    style: {
      height,
      borderRadius: "var(--r-pill)",
      background: "var(--surface3)",
      overflow: "hidden",
      width: "100%"
    }
  }, React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      borderRadius: "var(--r-pill)",
      background: color,
      transition: "width .5s cubic-bezier(.2,.8,.2,1)"
    }
  }));
}
function MatDots({
  mat
}) {
  const items = window.SF.MATERIALS.filter(m => mat[m.key] !== "na");
  const allReady = items.length > 0 && items.every(m => mat[m.key] === "ready");
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 3,
      alignItems: "center"
    },
    title: allReady ? "วัสดุครบ พร้อมติดตั้ง" : undefined
  }, items.map(m => {
    const st = window.SF.MAT_STATUS[mat[m.key]] || window.SF.MAT_STATUS.none;
    return React.createElement("span", {
      key: m.key,
      title: m.th + " · " + st.th,
      style: {
        width: 7,
        height: 7,
        borderRadius: 2,
        background: st.color
      }
    });
  }), allReady && React.createElement("span", {
    style: {
      display: "inline-grid",
      placeItems: "center",
      width: 15,
      height: 15,
      borderRadius: "var(--r-pill)",
      background: "var(--primary)",
      marginLeft: 2
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 10,
    color: "#fff",
    sw: 3
  })));
}
function Segmented({
  options,
  value,
  onChange,
  flat
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("div", {
    className: flat ? "seg-flat" : null,
    style: {
      display: "inline-flex",
      background: flat ? "transparent" : "var(--surface3)",
      borderRadius: isMobile ? 9 : 10,
      padding: flat ? 0 : isMobile ? 2 : 3,
      gap: flat ? 4 : 2
    }
  }, options.map(o => {
    const active = o.value === value;
    return React.createElement("button", {
      key: o.value,
      onClick: () => onChange(o.value),
      "data-on": active ? "1" : "0",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: isMobile ? "5px 10px" : "6px 12px",
        borderRadius: flat ? 9 : 8,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: isMobile ? 11.5 : 12.5,
        fontWeight: active ? 700 : 600,
        whiteSpace: "nowrap",
        background: active ? flat ? "var(--surface3)" : "var(--surface)" : "transparent",
        color: active ? "var(--text-1)" : flat ? "var(--text-3)" : "var(--text-2)",
        boxShadow: active && !flat ? "0 1px 3px rgba(0,0,0,.08)" : "none",
        transition: "all .15s"
      }
    }, o.icon && React.createElement(Icon, {
      name: o.icon,
      size: 15
    }), o.label);
  }));
}
function Dropdown({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  style,
  addable,
  onAdd,
  wrap,
  renderHover
}) {
  const [open, setOpen] = React.useState(false);
  const [hov, setHov] = React.useState(null);
  const [rect, setRect] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [addText, setAddText] = React.useState("");
  const btnRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const cur = (options || []).find(o => String(o.value) === String(value));
  const [cat, setCat] = React.useState(null);
  const [q, setQ] = React.useState("");
  const groupList = React.useMemo(() => [...new Set((options || []).map(o => o.group).filter(Boolean))], [options]);
  const hasGroups = groupList.length > 1;
  const hasSearch = (options || []).length >= 12;
  const byCat = hasGroups && cat ? (options || []).filter(o => o.group === cat) : options || [];
  const qq = q.trim().toLowerCase();
  const shown = qq ? byCat.filter(o => (String(o.label || "") + " " + String(o.sub || "") + " " + String(o.group || "")).toLowerCase().indexOf(qq) >= 0) : byCat;
  const openMenu = () => {
    if (disabled) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const needUp = spaceBelow < 260 && r.top > spaceBelow;
    const maxH = Math.min(400, (needUp ? r.top : spaceBelow) - 12);
    const hasSub = (options || []).some(o => o.sub);
    const longest = (options || []).reduce((m, o) => Math.max(m, String(o.label || "").length), 0);
    const want = hasSub || longest > 26 ? Math.min(Math.max(330, longest * 7 + 48), 520) : 0;
    const w = want ? Math.min(Math.max(r.width, want), window.innerWidth - 16) : r.width;
    setRect({
      left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)),
      width: w,
      maxH,
      top: needUp ? null : r.bottom + 6,
      bottom: needUp ? window.innerHeight - r.top + 6 : null
    });
    setOpen(true);
  };
  const submitAdd = () => {
    const v = (addText || "").trim();
    if (!v) {
      setAdding(false);
      return;
    }
    if (onAdd) onAdd(v);
    onChange(v);
    setAddText("");
    setAdding(false);
    setOpen(false);
  };
  React.useEffect(() => {
    if (!open) return;
    const close = e => {
      if (panelRef.current && e && e.target && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const t = setTimeout(() => {
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    }, 250);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);
  React.useEffect(() => {
    if (!open) {
      setAdding(false);
      setAddText("");
      setCat(null);
      setQ("");
      setHov(null);
    }
  }, [open]);
  const hovCard = open && rect && hov && renderHover ? renderHover(hov.o) : null;
  const HW = 280,
    hRight = rect && rect.left + rect.width + 8 + HW <= window.innerWidth;
  return React.createElement(React.Fragment, null, React.createElement("button", {
    type: "button",
    ref: btnRef,
    onClick: openMenu,
    disabled: disabled,
    style: Object.assign({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
      background: "var(--surface2)",
      border: "none",
      boxShadow: open ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13.5,
      padding: "9px 11px",
      borderRadius: 10,
      outline: "none",
      cursor: disabled ? "default" : "pointer",
      textAlign: "left",
      opacity: disabled ? 0.55 : 1
    }, style || {})
  }, React.createElement("span", {
    style: wrap ? {
      flex: 1,
      minWidth: 0,
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      whiteSpace: "normal",
      lineHeight: 1.3
    } : {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, cur ? cur.label : placeholder || "—"), React.createElement(Icon, {
    name: "chevronDown",
    size: 16,
    color: "var(--text-3)",
    style: {
      flexShrink: 0,
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  })), open && rect && ReactDOM.createPortal(React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      touchAction: "none"
    }
  }), React.createElement("div", {
    ref: panelRef,
    style: {
      position: "fixed",
      top: rect.top != null ? rect.top : undefined,
      bottom: rect.bottom != null ? rect.bottom : undefined,
      left: rect.left,
      width: rect.width,
      zIndex: 201,
      background: "var(--bg)",
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-pop)",
      maxHeight: rect.maxH || 320,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: 5
    }
  }, hasSearch && React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: "1px 2px 7px"
    }
  }, React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E49\u0E19\u0E2B\u0E32\u2026",
    autoFocus: !window.matchMedia("(max-width: 860px)").matches,
    onKeyDown: e => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    style: {
      width: "100%",
      background: "var(--surface2)",
      border: "none",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13,
      padding: "8px 10px",
      borderRadius: 9,
      outline: "none"
    }
  })), hasGroups && React.createElement("div", {
    style: {
      flexShrink: 0,
      display: "flex",
      flexWrap: "wrap",
      gap: 5,
      padding: "1px 2px 8px",
      background: "var(--bg)",
      borderBottom: "1px solid var(--divider)",
      marginBottom: 4
    }
  }, [null].concat(groupList).map(g => {
    const on = cat === g;
    return React.createElement("button", {
      type: "button",
      key: g || "__all",
      onClick: e => {
        e.stopPropagation();
        setCat(g);
      },
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "var(--r-pill)",
        cursor: "pointer",
        fontFamily: "inherit",
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
        background: on ? "var(--primary)" : "var(--surface2)",
        color: on ? "#fff" : "var(--text-2)"
      }
    }, g || "ทั้งหมด");
  })), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      overscrollBehavior: "contain"
    }
  }, shown.map((o, idx) => {
    const active = String(o.value) === String(value);
    const head = hasGroups && !cat && o.group && o.group !== (shown[idx - 1] || {}).group ? React.createElement("div", {
      key: "h-" + o.group,
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: ".04em",
        color: "var(--text-3)",
        padding: "8px 11px 3px"
      }
    }, o.group) : null;
    return React.createElement(React.Fragment, {
      key: String(o.value)
    }, head, React.createElement("button", {
      type: "button",
      onClick: () => {
        onChange(o.value);
        setOpen(false);
      },
      onMouseEnter: renderHover ? e => setHov({
        o: o,
        y: e.currentTarget.getBoundingClientRect().top
      }) : undefined,
      onMouseLeave: renderHover ? () => setHov(h => h && h.o === o ? null : h) : undefined,
      style: {
        width: "100%",
        display: "flex",
        alignItems: o.sub ? "flex-start" : "center",
        gap: 8,
        padding: "10px 11px",
        borderRadius: 9,
        border: "none",
        background: active ? "var(--primary-soft)" : "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        fontSize: 13.5,
        fontWeight: active ? 700 : 500,
        color: active ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        lineHeight: 1.35
      }
    }, o.label), o.sub && React.createElement("span", {
      style: {
        display: "block",
        marginTop: 2,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.45,
        color: "var(--text-3)",
        whiteSpace: "normal"
      }
    }, o.sub)), active && React.createElement(Icon, {
      name: "check",
      size: 15,
      color: "var(--primary)",
      sw: 2.6,
      style: {
        flexShrink: 0,
        marginTop: o.sub ? 2 : 0
      }
    })));
  }), shown.length === 0 && React.createElement("div", {
    style: {
      padding: "14px 11px",
      fontSize: 12.5,
      color: "var(--text-3)",
      textAlign: "center"
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A \u201C", q, "\u201D", addable ? " — พิมพ์ชื่อใหม่ได้ที่ปุ่มด้านล่าง" : "")), addable && (adding ? React.createElement("div", {
    style: {
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 7px",
      marginTop: 2,
      borderTop: "1px solid var(--divider)"
    }
  }, React.createElement("input", {
    autoFocus: true,
    value: addText,
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E21\u0E48",
    onChange: e => setAddText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitAdd();
      } else if (e.key === "Escape") {
        setAdding(false);
        setAddText("");
      }
    },
    style: {
      flex: 1,
      minWidth: 0,
      background: "var(--surface2)",
      border: "none",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13,
      padding: "8px 9px",
      borderRadius: 8,
      outline: "none"
    }
  }), React.createElement("button", {
    type: "button",
    onClick: submitAdd,
    title: "\u0E40\u0E1E\u0E34\u0E48\u0E21",
    style: {
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      width: 32,
      height: 32,
      background: "var(--primary)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff",
    sw: 2.6
  }))) : React.createElement("button", {
    type: "button",
    onClick: () => {
      setAdding(true);
      if (q.trim()) setAddText(q.trim());
    },
    style: {
      flexShrink: 0,
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 11px",
      borderRadius: 9,
      border: "none",
      marginTop: 2,
      borderTop: "1px solid var(--divider)",
      background: "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--primary-dark)"
  }), " ", q.trim() ? "ใช้ชื่อ “" + q.trim() + "”" : "พิมพ์ชื่อเอง"))), hovCard && React.createElement("div", {
    style: {
      position: "fixed",
      zIndex: 202,
      width: HW,
      pointerEvents: "none",
      left: hRight ? rect.left + rect.width + 8 : Math.max(8, rect.left - HW - 8),
      top: Math.max(8, Math.min(hov.y - 10, window.innerHeight - 360)),
      background: "var(--surface)",
      borderRadius: "var(--r-card)",
      boxShadow: "var(--shadow-pop)",
      overflow: "hidden"
    }
  }, hovCard)), document.body));
}
function useBackdropClose(onClose) {
  const down = React.useRef(false);
  return {
    onMouseDown: e => {
      down.current = e.target === e.currentTarget;
    },
    onClick: e => {
      const ok = e.target === e.currentTarget && down.current;
      down.current = false;
      if (ok) onClose();
    }
  };
}
function newMatSaveCtx(stock) {
  const items = stock && stock.items || [];
  let maxId = 0;
  items.forEach(it => {
    const n = parseInt(String(it.id || "").replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  });
  return {
    maxId: maxId,
    used: items.map(s => s.sku).filter(Boolean)
  };
}
function saveMatPrice(stock, opt, ctx) {
  const SF = window.SF || {};
  const mk = window.BOQ && window.BOQ.matKey || (x => String(x || "").trim());
  const items = stock && stock.items || [];
  const name = String(opt && opt.name || "").trim();
  if (!name || !stock || !stock.upsertItem) return null;
  const c = ctx || newMatSaveCtx(stock);
  const existing = opt.forceNew ? null : opt.id ? items.find(s => s.id === opt.id) : items.find(s => s.name && mk(s.name) === mk(name));
  const catKey = existing ? existing.cat : (SF.BOQ_GROUP_TO_CAT || {})[opt.group] || "other";
  const sku = String(opt && opt.code || "").trim() || existing && existing.sku || SF.genMatCode(catKey, items, c.used);
  c.used.push(sku);
  const price = Math.max(0, +opt.price || 0);
  const vf = {};
  if (opt.brand != null) vf.brand = String(opt.brand).trim();
  if (opt.model != null) vf.model = String(opt.model).trim();
  if (existing) {
    stock.upsertItem(Object.assign({}, existing, vf, {
      sku: sku,
      price: price,
      unit: existing.unit || opt.unit || ""
    }));
    return existing.id;
  }
  c.maxId += 1;
  const id = "IV-" + String(c.maxId).padStart(2, "0");
  stock.upsertItem(Object.assign({
    id: id,
    name: name,
    sku: sku,
    cat: catKey,
    unit: opt.unit || "",
    qty: 0,
    min: 0,
    loc: "",
    price: price
  }, vf));
  return id;
}
function SearchPick({
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
  allowEmpty,
  minWidth
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const boxRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const all = items || [];
  const cur = all.find(it => it && it.id === value) || null;
  const none = allowEmpty !== false;
  React.useEffect(() => {
    const h = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return all.slice(0, 60);
    return all.filter(it => ((it.code || "") + " " + (it.name || "")).toLowerCase().indexOf(kw) >= 0).slice(0, 60);
  }, [all, q]);
  const pick = it => {
    onChange(it ? it.id : "");
    setQ("");
    setOpen(false);
    if (inputRef.current) inputRef.current.blur();
  };
  const onKey = e => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHi(n => Math.max(0, Math.min(list.length - 1, n + (e.key === "ArrowDown" ? 1 : -1))));
      return;
    }
    if (e.key === "Enter" && open) {
      e.preventDefault();
      pick(list[hi] || null);
    }
  };
  const shown = cur ? [cur.code, cur.name].filter(Boolean).join(" · ") : "";
  const row = (it, i) => React.createElement("button", {
    key: it ? it.id : "_none",
    type: "button",
    onMouseEnter: () => setHi(i),
    onClick: () => pick(it),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "8px 11px",
      border: "none",
      background: i === hi ? "var(--surface2)" : "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      color: it ? "var(--text-1)" : "var(--text-3)"
    }
  }, it ? React.createElement(React.Fragment, null, it.code ? React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, it.code) : null, React.createElement("span", null, it.code && it.name ? " · " : "", it.name || "")) : emptyLabel || "— ไม่เลือก —");
  return React.createElement("div", {
    ref: boxRef,
    style: {
      position: "relative",
      flex: 1,
      minWidth: minWidth || 200
    }
  }, React.createElement("input", {
    ref: inputRef,
    value: open ? q : shown,
    onChange: e => {
      setQ(e.target.value);
      setHi(0);
      setOpen(true);
    },
    onFocus: () => {
      setQ("");
      setHi(0);
      setOpen(true);
    },
    onKeyDown: onKey,
    placeholder: placeholder || "พิมพ์เพื่อค้นหา",
    style: {
      width: "100%",
      padding: "8px 10px",
      paddingRight: cur && !open ? 30 : 10,
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5,
      boxSizing: "border-box"
    }
  }), cur && !open && React.createElement("button", {
    type: "button",
    onClick: () => pick(null),
    title: "\u0E25\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49",
    style: {
      position: "absolute",
      top: "50%",
      right: 7,
      transform: "translateY(-50%)",
      width: 20,
      height: 20,
      borderRadius: 6,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 13,
    color: "var(--text-3)"
  })), open && React.createElement("div", {
    style: {
      position: "absolute",
      zIndex: 30,
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      maxHeight: 280,
      overflowY: "auto",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: "var(--r-chip)",
      boxShadow: "0 12px 28px rgba(8,20,26,.18)"
    }
  }, none && row(null, -1), list.map((it, i) => row(it, i)), !list.length && React.createElement("div", {
    style: {
      padding: "10px 11px",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E33\u0E04\u0E49\u0E19")));
}
function pgTimeFix(raw, min, max) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s) return "";
  let h, m;
  const c = s.indexOf(":");
  if (c >= 0) {
    h = +s.slice(0, c).replace(/[^0-9]/g, "");
    const mm = s.slice(c + 1).replace(/[^0-9]/g, "");
    m = mm === "" ? 0 : +mm;
  } else {
    const d = s.replace(/[^0-9]/g, "").slice(0, 4);
    if (!d) return "";
    h = d.length <= 2 ? +d : +d.slice(0, d.length - 2);
    m = d.length <= 2 ? 0 : +d.slice(-2);
  }
  if (!isFinite(h)) return "";
  if (!isFinite(m)) m = 0;
  if (h > 23) {
    h = 23;
    m = 59;
  }
  const p2 = x => (x < 10 ? "0" : "") + x;
  let out = p2(Math.max(0, h)) + ":" + p2(Math.max(0, Math.min(59, m)));
  if (min && max && max < min) {
    if (out < min && out > max) out = max;
  } else {
    if (min && out < min) out = min;
    if (max && out > max) out = max;
  }
  return out;
}
function PgTime({
  value,
  onChange,
  disabled,
  min,
  max,
  style,
  placeholder,
  ariaLabel
}) {
  const [txt, setTxt] = React.useState(value || "");
  const [typing, setTyping] = React.useState(false);
  React.useEffect(() => {
    if (!typing) setTxt(value || "");
  }, [value, typing]);
  const type = e => {
    let t = String(e.target.value).replace(/[^0-9:]/g, "").slice(0, 5);
    if (t.indexOf(":") < 0 && t.length > 2) t = t.slice(0, t.length - 2) + ":" + t.slice(-2);
    setTyping(true);
    setTxt(t);
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(t)) {
      const fix = pgTimeFix(t, min, max);
      if (fix !== (value || "")) onChange(fix);
    }
  };
  const done = e => {
    const fix = pgTimeFix(e.target.value, min, max);
    setTyping(false);
    setTxt(fix);
    if (fix !== (value || "")) onChange(fix);
  };
  return React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    value: txt,
    disabled: disabled,
    "aria-label": ariaLabel,
    placeholder: placeholder || "--:--",
    onChange: type,
    onBlur: done,
    onKeyDown: e => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
    style: style
  });
}
function pgSetViewer(u) {
  const a = !!u && !!window.hasRole && window.hasRole(window.userRoles(u), "admin");
  if (window.__pgAdmin === a) return;
  window.__pgAdmin = a;
  try {
    window.dispatchEvent(new Event("pg-viewer"));
  } catch (e) {}
}
function usePgAdmin() {
  const [a, setA] = React.useState(!!window.__pgAdmin);
  React.useEffect(() => {
    const h = () => setA(!!window.__pgAdmin);
    window.addEventListener("pg-viewer", h);
    h();
    return () => window.removeEventListener("pg-viewer", h);
  }, []);
  return a;
}
function pgSetHidden(path, name, on) {
  const nm = "“" + (name || "รายนี้") + "”";
  const ask = window.askConfirm ? window.askConfirm(on ? {
    title: "ซ่อน " + nm + " ไว้เฉพาะแอดมิน?",
    body: "คนที่ไม่ใช่แอดมินจะไม่เห็นรายนี้ (รวมใบเสนอราคาและนัด) จนกว่าจะกดยกเลิกซ่อน",
    ok: "ซ่อน",
    icon: "eyeOff"
  } : {
    title: "ยกเลิกซ่อน " + nm + " ?",
    body: "ตอนนี้เห็นเฉพาะแอดมิน — ยกเลิกแล้วทุกตำแหน่งที่มีสิทธิ์จะเห็นรายนี้ (รวมใบเสนอราคาและนัด)",
    ok: "ยกเลิกซ่อน",
    icon: "eye"
  }) : Promise.resolve(true);
  ask.then(y => {
    if (y && window.FBDB) window.FBDB.ref(path).update({
      adminOnly: on ? true : null
    });
  });
}
function AdminHideBtn({
  rec,
  path
}) {
  const admin = usePgAdmin();
  if (!admin || !rec) return null;
  const on = !!rec.adminOnly;
  return React.createElement("button", {
    type: "button",
    onClick: e => {
      e.stopPropagation();
      pgSetHidden(path, rec.name, !on);
    },
    title: on ? "เห็นเฉพาะแอดมิน — กดเพื่อให้ทุกคนเห็น" : "ซ่อนรายนี้ไว้ให้เห็นเฉพาะแอดมิน",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 9px",
      height: 22,
      border: "none",
      cursor: "pointer",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      background: on ? "var(--surface2)" : "transparent",
      boxShadow: on ? "var(--shadow-inset)" : "none",
      color: on ? "var(--text-2)" : "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: on ? "eyeOff" : "eye",
    size: 13,
    sw: 2.2
  }), on ? "ซ่อนอยู่ · ยกเลิกซ่อน" : "ซ่อน");
}
const pgAdminFlag = () => window.__pgAdmin ? {
  adminOnly: true
} : {};
function AdminOnlyMark({
  rec,
  size = 14,
  onClick
}) {
  if (!rec || !rec.adminOnly) return null;
  const tip = "เฉพาะแอดมิน — คนอื่นไม่เห็นรายนี้" + (onClick ? " · กดเพื่อเปิดให้ทุกคนเห็น" : "");
  const ic = React.createElement(Icon, {
    name: "eyeOff",
    size: size,
    color: "var(--text-3)",
    sw: 2.2
  });
  if (onClick) return React.createElement("button", {
    type: "button",
    title: tip,
    "aria-label": tip,
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      marginRight: 6,
      width: size + 14,
      height: size + 14,
      padding: 0,
      border: "none",
      borderRadius: "var(--r-chip)",
      cursor: "pointer",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    }
  }, ic);
  return React.createElement("span", {
    title: tip,
    "aria-label": tip,
    style: {
      display: "inline-flex",
      verticalAlign: -2,
      marginRight: 5
    }
  }, ic);
}
Object.assign(window, {
  Icon,
  ICONS,
  SearchPick,
  pgSetViewer,
  usePgAdmin,
  pgAdminFlag,
  AdminOnlyMark,
  pgSetHidden,
  AdminHideBtn,
  StageBadge,
  TypeBadge,
  MatChip,
  TechAvatar,
  ProgressBar,
  MatDots,
  Segmented,
  Dropdown,
  useBackdropClose,
  PgTime,
  pgTimeFix,
  thDate,
  thDateTime,
  fmtBaht,
  stageOf,
  parseDate,
  TH_MONTHS,
  TH_DAYS,
  saveMatPrice,
  newMatSaveCtx,
  HdrCtx,
  HdrSlot,
  HdrSlotFill
});