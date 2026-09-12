function OmPhotos({
  ticketId,
  slot,
  currentUser,
  disabled
}) {
  const store = window.useOmTicketPhotos(ticketId);
  const [busy, setBusy] = React.useState(0);
  const list = store.photos.filter(p => (p.slot || "before") === slot);
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const f of files) {
      try {
        store.add(await window.resizeImageFile(f, 1200, 0.72), slot, currentUser);
      } catch (err) {}
      setBusy(n => n - 1);
    }
  };
  return React.createElement("div", null, !disabled && React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: list.length ? 11 : 0
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 15
  }), " ", busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)", React.createElement("input", {
    type: "file",
    accept: "image/*",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  })), !list.length && disabled && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(144px, 1fr))",
      gap: 10
    }
  }, list.map(p => React.createElement("div", {
    key: p.id,
    style: {
      border: "1px solid var(--border)",
      borderRadius: 11,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      background: "#0d1512"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "รูปหน้างาน",
    style: {
      width: "100%",
      height: 108,
      objectFit: "cover",
      display: "block"
    }
  }), !disabled && React.createElement("button", {
    type: "button",
    onClick: () => store.remove(p.id),
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49",
    style: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 8,
      border: "none",
      background: "rgba(0,0,0,.55)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "#fff"
  }))), React.createElement(window.DrPhotoCap, {
    value: p.cap,
    disabled: disabled,
    onSave: v => store.setCap(p.id, v)
  })))));
}
function OmTicketCard({
  t,
  onOpen
}) {
  const st = window.omTicketStatusOf(t.status);
  const sev = window.OM_SEVERITY_BY[t.severity] || window.OM_SEVERITY_BY.normal;
  const over = window.omTicketOverdue(t);
  const cov = window.omCoverTH(t.cover);
  return React.createElement("button", {
    onClick: () => onOpen(t),
    style: {
      width: "100%",
      textAlign: "left",
      fontFamily: "inherit",
      cursor: "pointer",
      marginBottom: 9,
      border: "1px solid var(--border)",
      borderLeft: "3px solid " + sev.color,
      borderRadius: 12,
      background: "var(--surface)",
      padding: "11px 12px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginBottom: 4
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, t.no), over && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10.5,
      fontWeight: 800,
      color: "#EF4444"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 11,
    color: "#EF4444"
  }), " \u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14 ", over.over, " \u0E27\u0E31\u0E19"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 10.5,
      fontWeight: 700,
      color: sev.color
    }
  }, sev.th)), React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1.35
    }
  }, t.title || (window.OM_TICKET_CAT_BY[t.category] || {}).th || "(ยังไม่ได้ใส่หัวเรื่อง)"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, t.siteName || t.siteCode, " \xB7 ", t.siteCode, t.reportedAt ? " · แจ้ง " + window.drShort(t.reportedAt.slice(0, 10)) : ""), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8,
      flexWrap: "wrap"
    }
  }, React.createElement(window.OmPill, {
    th: st.th,
    color: st.color
  }), React.createElement(window.OmPill, {
    th: cov.th,
    color: cov.color
  }), t.apptDate && React.createElement(window.OmPill, {
    th: "นัด " + window.drShort(t.apptDate),
    color: "#0EA5E9"
  })));
}
function OmJobFacts({
  job,
  site
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [fileBusy, setFileBusy] = React.useState(false);
  const [fileErr, setFileErr] = React.useState(false);
  const s = site || {};
  const j = job || null;
  const phone = j && j.phone || s.phone || "";
  const addr = [j && j.address || s.address || "", j && j.province || s.province || ""].filter(Boolean).join(", ");
  const map = j && j.map;
  const kw = j && j.kw || s.kw || null;
  const specs = j ? [["แบรนด์", j.brand || "—"], ["ขนาดระบบ", (j.kw || "—") + " kW"], ["จำนวนแผง", (j.panels || "—") + " แผง"], ["ระบบไฟฟ้า", (j.phase || "1") + " เฟส"], ["แบตเตอรี่", j.battery ? j.batSize || "มี" : "ไม่มี"], ["ระบบ / ออฟติไมเซอร์", j.connect || "—"], ["ระบบ Backup", j.backup ? "มี" : "ไม่มี"]] : [["ขนาดระบบ", kw ? kw + " kW" : "—"], ["จำนวนแผง", s.panels ? s.panels + " แผง" : "—"], ["แบรนด์", s.brand || "—"]];
  const cell = (label, value) => React.createElement("div", {
    key: label
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".04em",
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      marginTop: 2
    }
  }, value));
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      background: "var(--surface)",
      borderRadius: 13,
      padding: isMobile ? 13 : 15,
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 14,
    color: "var(--primary)"
  }), React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".07em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E14\u0E34\u0E21"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      padding: "2px 8px",
      borderRadius: 6
    }
  }, s.code || j && j.code || ""), j && React.createElement(window.OmPill, {
    th: j.type === "home" ? "งานบ้าน" : "งานโครงการ",
    color: "#0EA5E9"
  }), !j && React.createElement(window.OmPill, {
    th: "\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A \xB7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E07\u0E32\u0E19",
    color: "#94A3B8"
  }), s.comDate && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08 ", window.drDateTH(s.comDate))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, phone && React.createElement("a", {
    href: "tel:" + phone,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--bg)",
      textDecoration: "none",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      fontFamily: "var(--mono)"
    }
  }, React.createElement(Icon, {
    name: "phone",
    size: 13,
    color: "var(--text-3)"
  }), " ", phone), map && React.createElement("a", {
    href: map,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--bg)",
      textDecoration: "none",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"), j && j.hasDesign && React.createElement("button", {
    disabled: fileBusy,
    onClick: () => {
      setFileBusy(true);
      (window.openJobFileOnce ? window.openJobFileOnce(j.id, "design") : Promise.resolve(false)).then(ok => {
        setFileBusy(false);
        if (!ok) setFileErr(true);
      });
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--bg)",
      cursor: fileBusy ? "wait" : "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#2563EB",
      opacity: fileBusy ? .55 : 1
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 13,
    color: "#2563EB"
  }), " ", fileBusy ? "กำลังเปิดแบบ…" : "เปิดแบบ (PDF)"), j && !j.hasDesign && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 13,
    color: "var(--text-3)"
  }), " \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E1A\u0E1A\u0E41\u0E19\u0E1A\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49")), fileErr && React.createElement("div", {
    style: {
      fontSize: 11.5,
      lineHeight: 1.5,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: 9,
      padding: "7px 10px",
      marginBottom: 12
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E25\u0E2D\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E08\u0E32\u0E01\u0E43\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E0A\u0E47\u0E01\u0E27\u0E48\u0E32\u0E40\u0E1A\u0E23\u0E32\u0E27\u0E4C\u0E40\u0E0B\u0E2D\u0E23\u0E4C\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E1B\u0E4A\u0E2D\u0E1B\u0E2D\u0E31\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E25\u0E48\u0E32"), addr && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 12,
    color: "var(--text-3)",
    style: {
      verticalAlign: -1
    }
  }), " ", addr), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: 12
    }
  }, specs.map(([k, v]) => cell(k, v)), j && cell("ช่างที่ติดตั้ง", (window.SF.TECH_BY_ID[j.tech] || {}).name || "—"), j && cell("เซลล์เจ้าของงาน", j.salesName || "—"))));
}
function OmTicketModal({
  ticket,
  site,
  job,
  users,
  role,
  currentUser,
  visits,
  onOpenVisit,
  onNewVisit,
  onClose,
  onPatch,
  onMove,
  onRemove
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const canWrite = window.omCanWrite(role, null);
  const canDelete = window.omCanDelete(role);
  const [tab, setTab] = React.useState("before");
  const [delAsk, setDelAsk] = React.useState(false);
  const [moveNote, setMoveNote] = React.useState("");
  if (!ticket) return null;
  const t = ticket;
  const st = window.omTicketStatusOf(t.status);
  const over = window.omTicketOverdue(t);
  const locked = !canWrite || window.omTicketKey(t.status) === "closed";
  const set = fields => {
    if (!locked) onPatch(t.id, fields);
  };
  const nexts = window.omTicketNext(t, role);
  const guess = site ? window.omCoverOf(site, t.category) : null;
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 95,
      background: "rgba(8,20,26,.5)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent: "center",
      padding: isMobile ? 0 : 24
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 760,
      maxHeight: isMobile ? "94vh" : "88vh",
      overflowY: "auto",
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: isMobile ? "18px 18px 0 0" : 18,
      boxShadow: "0 24px 60px rgba(0,0,0,.28)"
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: "var(--bg)",
      borderBottom: "1px solid var(--border)",
      padding: isMobile ? "14px 13px" : "16px 20px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: st.color + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "wrench",
    size: 18,
    color: st.color
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, t.title || "(ยังไม่ได้ใส่หัวเรื่อง)"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, t.no, " \xB7 ", t.siteCode, t.siteName ? " · " + t.siteName : "")), React.createElement(window.OmPill, {
    th: st.th,
    color: st.color
  }), React.createElement("button", {
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), canWrite && !!nexts.length && React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 11,
      flexWrap: "wrap"
    }
  }, nexts.map(n => React.createElement("button", {
    key: n.key,
    onClick: () => {
      onMove(t, n.key, moveNote);
      setMoveNote("");
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: n.color,
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 14,
    color: "#fff"
  }), " ", n.th)))), React.createElement("div", {
    style: {
      padding: isMobile ? "14px 13px 24px" : "18px 20px 26px"
    }
  }, over && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 13px",
      marginBottom: 14,
      border: "1px solid #EF444440",
      background: "#EF44440e",
      borderRadius: 12
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#EF4444"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E41\u0E08\u0E49\u0E07\u0E21\u0E32\u0E41\u0E25\u0E49\u0E27 ", React.createElement("b", null, over.age, " \u0E27\u0E31\u0E19"), " \xB7 \u0E23\u0E30\u0E14\u0E31\u0E1A", (window.OM_SEVERITY_BY[t.severity] || {}).th, " \u0E04\u0E27\u0E23\u0E1B\u0E34\u0E14\u0E20\u0E32\u0E22\u0E43\u0E19 ", over.limit, " \u0E27\u0E31\u0E19")), window.omTicketKey(t.status) === "closed" && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 13px",
      marginBottom: 14,
      border: "1px solid #10B98140",
      background: "#10B98114",
      borderRadius: 12
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 15,
    color: "#10B981"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22 ", React.createElement("b", null, t.closedByName || "-"), t.closedAt ? " · " + window.drDateTH(t.closedAt.slice(0, 10)) : "", " \xB7 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", window.omCanApprove(role) ? " — หัวหน้ากดเปิดกลับมาทำต่อได้ที่ปุ่มด้านบน" : "")), React.createElement(OmJobFacts, {
    job: job,
    site: site
  }), React.createElement(window.DrSection, {
    n: "1",
    title: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E08\u0E49\u0E07\u0E27\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23",
    tone: "#7C5CFC"
  }, React.createElement(window.DrLabel, {
    hint: "\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E31\u0E49\u0E19 \u0E46 \u0E43\u0E2B\u0E49\u0E2D\u0E48\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E23\u0E39\u0E49\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E17\u0E31\u0E19\u0E17\u0E35"
  }, "\u0E2B\u0E31\u0E27\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07"), React.createElement("input", {
    value: t.title || "",
    disabled: locked,
    onChange: e => set({
      title: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E02\u0E36\u0E49\u0E19\u0E44\u0E1F\u0E41\u0E14\u0E07 \u0E44\u0E1F\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E49\u0E32\u0E19",
    style: window.OM_INPUT
  }), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, null, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), React.createElement(window.DrText, {
    value: t.detail,
    disabled: locked,
    rows: 3,
    placeholder: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E25\u0E48\u0E32\u0E27\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23 \u0E40\u0E01\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E2B\u0E23\u0E48 \u0E40\u0E04\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E21",
    onChange: v => set({
      detail: v
    })
  })), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, null, "\u0E2B\u0E21\u0E27\u0E14\u0E1B\u0E31\u0E0D\u0E2B\u0E32"), React.createElement(window.DrChips, {
    options: window.OM_TICKET_CAT,
    value: t.category,
    disabled: locked,
    onChange: v => set({
      category: v || "other"
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
      marginTop: 14
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E1B\u0E34\u0E14\u0E40\u0E04\u0E2A"
  }, "\u0E04\u0E27\u0E32\u0E21\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07"), React.createElement(window.DrChips, {
    options: window.OM_SEVERITY,
    value: t.severity,
    disabled: locked,
    onChange: v => set({
      severity: v || "normal"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E41\u0E08\u0E49\u0E07\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E17\u0E32\u0E07\u0E44\u0E2B\u0E19"), React.createElement(window.DrChips, {
    options: window.OM_TICKET_SOURCE,
    value: t.source,
    disabled: locked,
    onChange: v => set({
      source: v || "phone"
    })
  }))), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement(window.DrLabel, {
    hint: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E08\u0E49\u0E07\u0E08\u0E23\u0E34\u0E07 \u0E43\u0E0A\u0E49\u0E19\u0E31\u0E1A\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E1B\u0E34\u0E14\u0E40\u0E04\u0E2A"
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E08\u0E49\u0E07"), React.createElement("input", {
    type: "date",
    value: (t.reportedAt || "").slice(0, 10),
    disabled: locked,
    onChange: e => {
      if (e.target.value) set({
        reportedAt: e.target.value + "T00:00:00.000Z"
      });
    },
    style: Object.assign({}, window.OM_INPUT, {
      width: "auto",
      padding: "8px 11px",
      fontFamily: "var(--mono)",
      fontSize: 13
    })
  }))), React.createElement(window.DrSection, {
    n: "2",
    title: "\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E34\u0E14\u0E40\u0E07\u0E34\u0E19",
    tone: "#1B9B75",
    hint: site ? "" : "ไม่พบทะเบียนไซต์ ตรวจประกันอัตโนมัติไม่ได้"
  }, guess && guess.note && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "10px 12px",
      marginBottom: 12,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      borderRadius: 11
    }
  }, React.createElement(Icon, {
    name: "shield",
    size: 15,
    color: window.omCoverTH(guess.cover).color
  }), React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E49: ", React.createElement("b", {
    style: {
      color: window.omCoverTH(guess.cover).color
    }
  }, window.omCoverTH(guess.cover).th), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, guess.note)), !locked && t.cover !== guess.cover && React.createElement("button", {
    onClick: () => set({
      cover: guess.cover,
      coverWid: guess.wid,
      coverNote: guess.note
    }),
    style: {
      padding: "6px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49")), React.createElement(window.DrChips, {
    disabled: locked,
    value: t.cover,
    onChange: v => set({
      cover: v || "unknown"
    }),
    options: ["warranty", "charge", "goodwill", "unknown"].map(k => ({
      key: k,
      th: window.omCoverTH(k).th,
      color: window.omCoverTH(k).color
    }))
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
      gap: 12,
      marginTop: 13
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("input", {
    value: t.coverNote || "",
    disabled: locked,
    onChange: e => set({
      coverNote: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E16\u0E36\u0E07 2573 \xB7 \u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E04\u0E34\u0E14\u0E41\u0E22\u0E01",
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 11px",
      fontSize: 13
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E1A\u0E32\u0E17"
  }, "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E19\u0E2D"), React.createElement("input", {
    value: t.quoteAmt == null ? "" : String(t.quoteAmt),
    disabled: locked,
    inputMode: "decimal",
    onChange: e => {
      const v = e.target.value.replace(/[^0-9.]/g, "");
      set({
        quoteAmt: v === "" ? null : +v
      });
    },
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 11px",
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })))), React.createElement(window.DrSection, {
    n: "3",
    title: "\u0E19\u0E31\u0E14\u0E27\u0E31\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    tone: "#F59E0B"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E27\u0E31\u0E19\u0E19\u0E31\u0E14"), React.createElement("input", {
    type: "date",
    value: t.apptDate || "",
    disabled: locked,
    onChange: e => set({
      apptDate: e.target.value
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement("input", {
    type: "time",
    value: t.apptFrom || "",
    disabled: locked,
    onChange: e => set({
      apptFrom: e.target.value
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E16\u0E36\u0E07"), React.createElement("input", {
    type: "time",
    value: t.apptTo || "",
    disabled: locked,
    onChange: e => set({
      apptTo: e.target.value
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  }))), t.apptDate && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 8
    }
  }, window.drDateTH(t.apptDate, true)), React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement(window.DrLabel, null, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"), React.createElement("select", {
    value: t.assigneeId || "",
    disabled: locked,
    onChange: e => {
      const id = e.target.value;
      const u = (users || []).find(x => x.id === id) || null;
      set({
        assigneeId: id || null,
        assigneeName: u ? u.name : "",
        techId: u ? u.techId || null : null
      });
      if (u && window.omNotify) {
        window.omNotify({
          toUserId: u.id,
          toTechId: u.techId || null,
          omSiteId: t.siteId,
          title: "มอบหมายงานบริการ · " + (t.title || t.no),
          body: (t.siteName || t.siteCode || "") + (t.apptDate ? " · นัด " + window.drShort(t.apptDate) : " · ยังไม่ได้นัดวัน")
        });
      }
    },
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22 \u2014"), (users || []).filter(u => u.active !== false).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name, u.techId ? "" : " (ไม่ใช่ช่าง)"))), !t.assigneeId && t.techId && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 5
    }
  }, "\u0E40\u0E14\u0E34\u0E21\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E0A\u0E48\u0E32\u0E07 ", (window.SF.TECH_BY_ID[t.techId] || {}).name || t.techId))), React.createElement(window.DrSection, {
    n: "4",
    title: "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A",
    tone: "#0EA5E9",
    hint: "\u0E01\u0E48\u0E2D\u0E19\u0E0B\u0E48\u0E2D\u0E21 = \u0E2A\u0E20\u0E32\u0E1E\u0E15\u0E2D\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E08\u0E49\u0E07"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginBottom: 12
    }
  }, [["before", "ก่อนซ่อม"], ["after", "หลังซ่อม"]].map(([k, th]) => React.createElement("button", {
    key: k,
    type: "button",
    onClick: () => setTab(k),
    style: {
      padding: "7px 14px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
      background: tab === k ? "var(--primary-soft)" : "var(--surface)",
      color: tab === k ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, th))), React.createElement(OmPhotos, {
    ticketId: t.id,
    slot: tab,
    currentUser: currentUser,
    disabled: locked
  })), React.createElement(window.DrSection, {
    n: "5",
    title: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E0B\u0E48\u0E2D\u0E21",
    tone: "#10B981"
  }, React.createElement(window.DrLabel, {
    hint: "\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2D\u0E30\u0E44\u0E23"
  }, "\u0E2A\u0E23\u0E38\u0E1B\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33"), React.createElement(window.DrText, {
    value: t.result,
    disabled: locked,
    rows: 3,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1F\u0E34\u0E27\u0E2A\u0E4C DC \u0E1D\u0E31\u0E48\u0E07\u0E2A\u0E15\u0E23\u0E34\u0E07 2 \xB7 \u0E02\u0E31\u0E19\u0E08\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E49\u0E07\u0E41\u0E16\u0E27 \xB7 \u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E44\u0E1F\u0E40\u0E02\u0E49\u0E32\u0E1B\u0E01\u0E15\u0E34",
    onChange: v => set({
      result: v
    })
  }), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, {
    hint: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E15\u0E2D\u0E19\u0E01\u0E14\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"), React.createElement("input", {
    value: t.closeNote || "",
    disabled: locked,
    onChange: e => set({
      closeNote: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E41\u0E25\u0E30\u0E1E\u0E2D\u0E43\u0E08 \xB7 \u0E41\u0E19\u0E30\u0E19\u0E33\u0E43\u0E2B\u0E49\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E2D\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E23\u0E47\u0E27\u0E02\u0E36\u0E49\u0E19",
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 11px",
      fontSize: 13
    })
  }))), React.createElement(window.DrSection, {
    n: "6",
    title: "\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    tone: "#1B9B75",
    hint: (visits || []).length ? "ออกไปแล้ว " + (visits || []).length + " ใบ" : ""
  }, !(visits || []).length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginBottom: onNewVisit ? 11 : 0
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), (visits || []).map(v => {
    const vs = window.omVisitStatusOf(v.status);
    return React.createElement("button", {
      key: v.id,
      type: "button",
      onClick: () => onOpenVisit && onOpenVisit(v.id),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 10px",
        marginBottom: 7,
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--surface)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement(Icon, {
      name: "file",
      size: 14,
      color: "#1B9B75"
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, v.no, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        fontWeight: 400,
        color: "var(--text-3)"
      }
    }, "\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 ", window.drShort(v.date), v.charge != null ? " · " + Number(v.charge).toLocaleString("th-TH") + " บาท" : "")), React.createElement(window.OmPill, {
      th: vs.th,
      color: vs.color
    }), React.createElement(Icon, {
      name: "chevronRight",
      size: 14,
      color: "var(--text-3)"
    }));
  }), canWrite && onNewVisit && React.createElement("button", {
    type: "button",
    onClick: () => onNewVisit({
      kind: "repair",
      ticketId: t.id,
      found: t.detail || t.title,
      cover: t.cover,
      date: t.apptDate || undefined
    }),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 14
  }), " \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23")), React.createElement(window.DrSection, {
    n: "7",
    title: "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49",
    tone: "#94A3B8",
    hint: (t.hist || []).length + " รายการ"
  }, (t.hist || []).slice().reverse().map((h, i) => {
    const to = window.omTicketStatusOf(h.to);
    return React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "7px 0",
        borderBottom: i < (t.hist || []).length - 1 ? "1px solid var(--border)" : "none"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: to.color,
        marginTop: 5,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, to.th, h.note ? React.createElement("span", {
      style: {
        fontWeight: 400,
        color: "var(--text-3)"
      }
    }, " \xB7 ", h.note) : null), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, String(h.at || "").slice(0, 10) ? window.drShort(h.at.slice(0, 10)) + " " + String(h.at).slice(11, 16) : "", h.byName ? " · " + h.byName : "")));
  })), canDelete && (delAsk ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "12px 13px",
      flexWrap: "wrap",
      border: "1px solid #EF444440",
      background: "#EF44440e",
      borderRadius: 12
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 160,
      fontSize: 12.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, "\u0E25\u0E1A\u0E43\u0E1A ", t.no, " \u0E17\u0E31\u0E49\u0E07\u0E43\u0E1A? \u0E23\u0E39\u0E1B\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E2B\u0E32\u0E22\u0E16\u0E32\u0E27\u0E23 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"), React.createElement("button", {
    onClick: () => setDelAsk(false),
    style: {
      padding: "7px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => {
      onRemove(t.id);
      onClose();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 13px",
      borderRadius: 9,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#fff"
  }), " \u0E25\u0E1A\u0E40\u0E25\u0E22")) : React.createElement("button", {
    onClick: () => setDelAsk(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#EF4444"
  }), " \u0E25\u0E1A\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E0B\u0E48\u0E2D\u0E21\u0E19\u0E35\u0E49 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)")))));
}
const OM_BOARD_COLS = ["new", "accepted", "scheduled"];
function OmTicketBoard({
  sites,
  jobById,
  users,
  ticketStore,
  visitStore,
  role,
  currentUser,
  onNewVisit,
  onOpenVisit
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    tickets,
    loading,
    save,
    patch,
    remove
  } = ticketStore;
  const [openId, setOpenId] = React.useState(null);
  const [showDone, setShowDone] = React.useState(false);
  const [newFor, setNewFor] = React.useState("");
  const canWrite = window.omCanWrite(role, null);
  const siteById = React.useMemo(() => {
    const m = {};
    (sites || []).forEach(s => {
      if (s && s.id) m[s.id] = s;
    });
    return m;
  }, [sites]);
  const cur = tickets.find(x => x.id === openId) || null;
  const roll = React.useMemo(() => window.omTicketRollup(tickets), [tickets]);
  const closed = tickets.filter(t => !window.omTicketOpen(t));
  const openNew = () => {
    const s = siteById[newFor];
    if (!canWrite || !s) return;
    const rec = window.omBlankTicket(s, tickets, currentUser);
    save(rec);
    window.omNotify({
      toPerm: "om",
      omSiteId: s.id,
      title: "ใบแจ้งซ่อมใหม่ · " + rec.no,
      body: (s.name || s.code || "") + " — เปิดเรื่องโดย " + ((currentUser || {}).name || "")
    });
    setOpenId(rec.id);
  };
  const move = (t, to, note) => {
    const rec = window.omTicketMove(t, to, currentUser, note);
    if (rec) save(rec);
  };
  const col = key => {
    const st = window.omTicketStatusOf(key);
    const list = tickets.filter(t => window.omTicketKey(t.status) === key);
    return React.createElement("div", {
      key: key,
      style: {
        minWidth: isMobile ? 0 : 240,
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 9
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: st.color
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, st.th), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, list.length)), list.map(t => React.createElement(OmTicketCard, {
      key: t.id,
      t: t,
      onOpen: x => setOpenId(x.id)
    })), !list.length && React.createElement("div", {
      style: {
        border: "1px dashed var(--border)",
        borderRadius: 11,
        padding: "14px 8px",
        textAlign: "center",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35"));
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement(window.OmStat, {
    label: "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1B\u0E34\u0E14",
    value: roll.open,
    color: "var(--text-1)",
    hint: roll.newly ? "แจ้งใหม่ยังไม่ได้ดู " + roll.newly : ""
  }), React.createElement(window.OmStat, {
    label: "\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E1B\u0E34\u0E14\u0E40\u0E04\u0E2A",
    value: roll.overdue,
    color: "#EF4444"
  }), React.createElement(window.OmStat, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E14\u0E31\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    value: roll.down,
    color: "#EF4444"
  }), React.createElement(window.OmStat, {
    label: "\u0E1B\u0E34\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",
    value: roll.closed,
    color: "#10B981"
  })), canWrite && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap",
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      borderRadius: 12,
      padding: "10px 12px"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E44\u0E0B\u0E15\u0E4C"), React.createElement(window.SearchPick, {
    value: newFor,
    onChange: setNewFor,
    minWidth: 180,
    items: (sites || []).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th")),
    emptyLabel: "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E0B\u0E15\u0E4C \u2014",
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E49\u0E19\u0E2B\u0E32"
  }), React.createElement("button", {
    onClick: openNew,
    disabled: !newFor,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: newFor ? "var(--primary)" : "var(--surface3)",
      color: newFor ? "#fff" : "var(--text-3)",
      cursor: newFor ? "pointer" : "default",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: newFor ? "#fff" : "var(--text-3)"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E0B\u0E48\u0E2D\u0E21")), loading && React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: 14,
      alignItems: "flex-start",
      overflowX: isMobile ? "visible" : "auto",
      paddingBottom: 4
    }
  }, OM_BOARD_COLS.map(col)), !!closed.length && React.createElement("div", null, React.createElement("button", {
    onClick: () => setShowDone(v => !v),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "8px 13px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    style: {
      transform: showDone ? "none" : "rotate(-90deg)"
    }
  }), "\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E08\u0E1A\u0E41\u0E25\u0E49\u0E27 ", closed.length, " \u0E43\u0E1A"), showDone && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 10,
      marginTop: 11
    }
  }, closed.map(t => React.createElement(OmTicketCard, {
    key: t.id,
    t: t,
    onOpen: x => setOpenId(x.id)
  })))), cur && React.createElement(OmTicketModal, {
    ticket: cur,
    site: siteById[cur.siteId] || null,
    job: (jobById || {})[cur.siteId] || null,
    users: users,
    role: role,
    currentUser: currentUser,
    visits: ((visitStore || {}).visits || []).filter(v => v.ticketId === cur.id),
    onNewVisit: onNewVisit ? opts => onNewVisit(siteById[cur.siteId], opts) : null,
    onOpenVisit: onOpenVisit,
    onClose: () => setOpenId(null),
    onPatch: patch,
    onMove: move,
    onRemove: remove
  }));
}
Object.assign(window, {
  OmPhotos,
  OmTicketCard,
  OmTicketModal,
  OmTicketBoard,
  OM_BOARD_COLS
});