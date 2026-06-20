/* ============================================================
   SolarFlow — shared UI components & helpers  (window globals)
   ============================================================ */

// ---------- Icon set (feather-ish, 1.75 stroke) ----------
const ICONS = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  kanban: "M4 4v16M10 4v10M16 4v13M4 4h16M10 4h0M16 4h0",
  table: "M3 5h18M3 12h18M3 19h18M9 5v14M15 5v14",
  calendar: "M3 5h18v16H3zM3 9h18M8 3v4M16 3v4",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  filter: "M3 5h18l-7 8v6l-4 2v-8z",
  chevronRight: "M9 6l6 6-6 6",
  chevronDown: "M6 9l6 6 6-6",
  x: "M6 6l12 12M18 6 6 18",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  battery: "M3 8h14v8H3zM17 11h3v2h-3M6 11v2M9 11v2",
  sun: "M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  panel: "M3 4h18l1 9H2zM7 13v7M17 13v7M12 4v16M2 13h20M5 20h14",
  check: "M5 12l4 4L19 7",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  alert: "M12 3 2 20h20zM12 10v4M12 17.5v.5",
  user: "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  pin: "M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12zM12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  box: "M21 8 12 3 3 8l9 5zM3 8v8l9 5 9-5V8M12 13v8",
  list: "M8 6h13M8 12h13M8 18h13M3 6h0M3 12h0M3 18h0",
  trend: "M3 17l6-6 4 4 8-8M21 7h-5M21 7v5",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15H4.5a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.6V4.5a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.1a2 2 0 0 1 0 4h-.1z",
  menu: "M3 6h18M3 12h18M3 18h18",
  flow: "M5 6h6M5 12h14M5 18h9M17 4l2 2-2 2M14 16l2 2-2 2",
  wrench: "M14.7 6.3a4 4 0 0 0-5.3 5.3L3 18l3 3 6.4-6.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.3-.4-.4-2.3z",
  history: "M3 3v5h5M3.05 13a9 9 0 1 0 2.5-6.5L3 8M12 7v5l4 2",
  shield: "M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5z",
  image: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 16l-5-5L5 21",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  power: "M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22",
};

function Icon({ name, size = 18, color = "currentColor", fill = "none", sw = 1.75, style }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, ...style }}>
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

// ---------- helpers ----------
const TH_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const TH_DAYS = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."];
function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function thDate(s, withYear) {
  if (!s) return "—";
  const d = parseDate(s);
  return d.getDate() + " " + TH_MONTHS[d.getMonth()] + (withYear ? " " + (d.getFullYear() + 543).toString().slice(-2) : "");
}
// แสดงวัน + เวลา จาก ISO timestamp (เช่น "8 มิ.ย. 69 · 14:30 น.")
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
function stageOf(key) { return window.SF.STAGES[window.SF.STAGE_INDEX[key]]; }

// ---------- Stage badge / dot ----------
function StageBadge({ stageKey, size = "md" }) {
  const s = stageOf(stageKey);
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 999, background: s.soft, color: s.color, fontWeight: 600, fontSize: fs, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color }} />
      {s.th}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = window.SF.TYPES.find((x) => x.key === type);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: t.color, background: t.color + "1A",
      padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{t.th}</span>
  );
}

// ---------- Material status chip ----------
function MatChip({ status, label, compact }) {
  const m = window.SF.MAT_STATUS[status];
  return (
    <span title={label ? label + " · " + m.th : m.th}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: compact ? "2px 6px" : "3px 8px",
        borderRadius: 6, background: m.soft, color: m.color, fontWeight: 600, fontSize: compact ? 10.5 : 11, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: compact ? 9 : 10 }}>{m.icon}</span>{!compact && (label || m.th)}
    </span>
  );
}

// ---------- Tech avatar ----------
function TechAvatar({ techId, size = 28, showName }) {
  const t = window.SF.TECH_BY_ID[techId];
  if (!t) return null;
  const initial = t.nick.slice(0, 2);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: size, height: size, borderRadius: 99, background: t.color,
        color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>{initial}</span>
      {showName && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{t.name}</span>}
    </span>
  );
}

// ---------- Progress bar ----------
function ProgressBar({ pct, color = "var(--primary)", height = 6 }) {
  return (
    <div style={{ height, borderRadius: 99, background: "var(--surface3)", overflow: "hidden", width: "100%" }}>
      <div style={{ width: pct + "%", height: "100%", borderRadius: 99, background: color, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
    </div>
  );
}

// ---------- Material readiness mini-bar (only needed items) ----------
function MatDots({ mat }) {
  const items = window.SF.MATERIALS.filter((m) => mat[m.key] !== "na");
  const allReady = items.length > 0 && items.every((m) => mat[m.key] === "ready");
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }} title={allReady ? "วัสดุครบ พร้อมติดตั้ง" : undefined}>
      {items.map((m) => {
        const st = window.SF.MAT_STATUS[mat[m.key]];
        return <span key={m.key} title={m.th + " · " + st.th}
          style={{ width: 7, height: 7, borderRadius: 2, background: st.color }} />;
      })}
      {allReady && (
        <span style={{ display: "inline-grid", placeItems: "center", width: 15, height: 15, borderRadius: 99, background: "var(--primary)", marginLeft: 2 }}>
          <Icon name="check" size={10} color="#fff" sw={3} />
        </span>
      )}
    </span>
  );
}

// ---------- Segmented control ----------
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface3)", borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
              background: active ? "var(--surface)" : "transparent", color: active ? "var(--text-1)" : "var(--text-2)",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>
            {o.icon && <Icon name={o.icon} size={15} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Dropdown — ตัวเลือกแบบกำหนดสไตล์เอง (แทน native select)
   ใช้ fixed-position สำหรับเมนู เพื่อไม่ให้ถูก modal ที่เลื่อนได้ตัดขอบ
   options: [{ value, label }] ── */
function Dropdown({ value, onChange, options, disabled, placeholder, style, addable, onAdd }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [addText, setAddText] = React.useState("");
  const btnRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const cur = (options || []).find((o) => String(o.value) === String(value));

  const openMenu = () => {
    if (disabled) return;
    const r = btnRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    setOpen(true);
  };
  const submitAdd = () => {
    const v = (addText || "").trim();
    if (!v) { setAdding(false); return; }
    if (onAdd) onAdd(v);
    onChange(v);
    setAddText(""); setAdding(false); setOpen(false);
  };

  React.useEffect(() => {
    if (!open) return;
    // ปิดเมื่อเลื่อน "นอก" เมนู (เลื่อนพื้นหลัง) แต่ไม่ปิดเมื่อเลื่อนในเมนูเอง
    const close = (e) => {
      if (panelRef.current && e && e.target && panelRef.current.contains(e.target)) return;
      setOpen(false);
    };
    // หน่วงเล็กน้อย กัน scroll-into-view ตอนกดปุ่มไปปิดเมนูทันที
    const t = setTimeout(() => {
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    }, 250);
    return () => { clearTimeout(t); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  React.useEffect(() => { if (!open) { setAdding(false); setAddText(""); } }, [open]);

  return (
    <React.Fragment>
      <button type="button" ref={btnRef} onClick={openMenu} disabled={disabled}
        style={Object.assign({
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%",
          background: "var(--surface2)", border: "1px solid " + (open ? "var(--primary)" : "var(--border-strong)"),
          color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, padding: "9px 11px", borderRadius: 10,
          outline: "none", cursor: disabled ? "default" : "pointer", textAlign: "left", opacity: disabled ? 0.55 : 1,
        }, style || {})}>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cur ? cur.label : (placeholder || "—")}
        </span>
        <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && rect && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200 }} />
          <div ref={panelRef} style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, zIndex: 201,
            background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 14px 40px rgba(8,20,14,.22)",
            maxHeight: 280, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: 5 }}>
            {(options || []).map((o) => {
              const active = String(o.value) === String(value);
              return (
                <button type="button" key={String(o.value)} onClick={() => { onChange(o.value); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 11px", borderRadius: 9, border: "none",
                    background: active ? "var(--primary-soft)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? "var(--primary-dark)" : "var(--text-1)" }}>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                  {active && <Icon name="check" size={15} color="var(--primary)" sw={2.6} />}
                </button>
              );
            })}
            {addable && (adding ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 7px", marginTop: 2, borderTop: "1px solid var(--border)" }}>
                <input autoFocus value={addText} placeholder="ชื่อตัวเลือกใหม่"
                  onChange={(e) => setAddText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } else if (e.key === "Escape") { setAdding(false); setAddText(""); } }}
                  style={{ flex: 1, minWidth: 0, background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, padding: "8px 9px", borderRadius: 8, outline: "none" }} />
                <button type="button" onClick={submitAdd} title="เพิ่ม" style={{ flexShrink: 0, display: "grid", placeItems: "center", width: 32, height: 32, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}><Icon name="check" size={15} color="#fff" sw={2.6} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => setAdding(true)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "10px 11px", borderRadius: 9, border: "none", marginTop: 2, borderTop: "1px solid var(--border)",
                  background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left", fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
                <Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มตัวเลือกใหม่
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

/* ปิด modal เมื่อคลิก backdrop — แต่ต้อง "กดเริ่ม" บน backdrop จริง ๆ
   กัน drag-select ในช่องกรอกแล้วปล่อยเมาส์นอกกรอบทำให้ปิดหน้าต่างหลุด */
function useBackdropClose(onClose) {
  const down = React.useRef(false);
  return {
    onMouseDown: (e) => { down.current = (e.target === e.currentTarget); },
    onClick: (e) => { const ok = e.target === e.currentTarget && down.current; down.current = false; if (ok) onClose(); },
  };
}

Object.assign(window, { Icon, ICONS, StageBadge, TypeBadge, MatChip, TechAvatar, ProgressBar, MatDots, Segmented, Dropdown, useBackdropClose,
  thDate, thDateTime, fmtBaht, stageOf, parseDate, TH_MONTHS, TH_DAYS });
