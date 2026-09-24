function OmVisitPhotos({
  visitId,
  slot,
  currentUser,
  disabled
}) {
  const store = window.useOmVisitPhotos(visitId);
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
function OmVisitModal({
  visit,
  site,
  siteVisits,
  role,
  currentUser,
  onClose,
  onPatch,
  onRemove
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const sigs = window.useOmVisitSigns(visit ? visit.id : null);
  const mine = window.useOmMySign((currentUser || {}).id);
  const [tab, setTab] = React.useState("before");
  const [paper, setPaper] = React.useState(false);
  const [delAsk, setDelAsk] = React.useState(false);
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  if (!visit) return null;
  const v = visit;
  const st = window.omVisitStatusOf(v.status);
  const kind = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
  const canApprove = window.omCanApprove(role);
  const locked = !window.omCanWrite(role, v);
  const set = fields => {
    if (!locked) onPatch(v.id, fields);
  };
  const doSign = (slot, img) => {
    sigs.sign(slot, img, currentUser, slot === "cust" ? (site || {}).name || "" : (currentUser || {}).name || "");
  };
  const send = () => {
    if (!(sigs.signs.tech && sigs.signs.tech.img)) {
      setPad({
        slot: "tech",
        title: "ลายเซ็นช่างผู้ให้บริการ",
        then: markSent
      });
      return;
    }
    markSent();
  };
  const markSent = () => {
    onPatch(v.id, {
      status: "sent",
      sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || v.byId || null,
      byName: (currentUser || {}).name || v.byName || ""
    });
    window.omNotify({
      toPerm: "om",
      omSiteId: v.siteId,
      title: "ใบรายงานเข้าบริการรอตรวจ · " + (v.no || ""),
      body: ((site || {}).name || v.siteName || "") + " — ส่งโดย " + ((currentUser || {}).name || "")
    });
  };
  const approve = () => onPatch(v.id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
    appId: (currentUser || {}).id || null,
    appName: (currentUser || {}).name || ""
  });
  const unlock = () => onPatch(v.id, {
    status: "sent",
    approvedAt: null,
    appId: null,
    appName: ""
  });
  const btn = (bg, color, border) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    borderRadius: 10,
    border: border || "none",
    background: bg,
    color: color,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700
  });
  return React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
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
      maxWidth: 780,
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
      background: kind.color + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: kind.icon,
    size: 18,
    color: kind.color
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
  }, "\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \xB7 ", kind.th), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, v.no, " \xB7 ", v.siteCode, v.siteName ? " · " + v.siteName : "")), React.createElement(window.OmPill, {
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
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginTop: 11,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setPaper(true),
    style: btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)")
  }, React.createElement(Icon, {
    name: "file",
    size: 14
  }), " \u0E14\u0E39\u0E43\u0E1A A4 / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"), !locked && v.status === "draft" && React.createElement("button", {
    onClick: send,
    style: btn("var(--primary)", "#fff")
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#fff",
    sw: 2.6
  }), " \u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08"), canApprove && v.status === "sent" && React.createElement("button", {
    onClick: approve,
    style: btn("#10B981", "#fff")
  }, React.createElement(Icon, {
    name: "shield",
    size: 14,
    color: "#fff"
  }), " \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E19\u0E35\u0E49"), canApprove && v.status === "approved" && React.createElement("button", {
    onClick: unlock,
    style: btn("var(--surface)", "#F59E0B", "1px solid #F59E0B")
  }, React.createElement(Icon, {
    name: "lock",
    size: 14,
    color: "#F59E0B"
  }), " \u0E1B\u0E25\u0E14\u0E25\u0E47\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E49"))), React.createElement("div", {
    style: {
      padding: isMobile ? "14px 13px 24px" : "18px 20px 26px"
    }
  }, v.status === "approved" && React.createElement("div", {
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
  }, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22 ", React.createElement("b", null, v.appName || "-"), v.approvedAt ? " · " + window.drDateTH(window.drLocalDay(v.approvedAt)) : "", " \xB7 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49")), React.createElement(window.DrSection, {
    n: "1",
    title: "\u0E01\u0E32\u0E23\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49",
    tone: "#7C5CFC"
  }, React.createElement(window.DrLabel, null, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19"), React.createElement(window.DrChips, {
    options: window.OM_VISIT_KIND,
    value: v.kind,
    disabled: locked,
    onChange: x => set({
      kind: x || "repair"
    })
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 10,
      marginTop: 13
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32"), React.createElement("input", {
    type: "date",
    value: v.date || "",
    disabled: locked,
    onChange: e => set({
      date: e.target.value
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32"), React.createElement(window.PgTime, {
    value: v.timeIn || "",
    disabled: locked,
    onChange: t => set({
      timeIn: t
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E40\u0E27\u0E25\u0E32\u0E2D\u0E2D\u0E01"), React.createElement(window.PgTime, {
    value: v.timeOut || "",
    disabled: locked,
    onChange: t => set({
      timeOut: t
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E17\u0E35\u0E21\u0E0A\u0E48\u0E32\u0E07"), React.createElement("input", {
    value: v.team || "",
    disabled: locked,
    onChange: e => set({
      team: e.target.value
    }),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32",
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5
    })
  })))), React.createElement(window.DrSection, {
    n: "2",
    title: "\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A / \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33",
    tone: "#F59E0B"
  }, React.createElement(window.DrLabel, {
    hint: "\u0E2A\u0E20\u0E32\u0E1E\u0E17\u0E35\u0E48\u0E40\u0E08\u0E2D\u0E15\u0E2D\u0E19\u0E44\u0E1B\u0E16\u0E36\u0E07"
  }, "\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A\u0E2D\u0E30\u0E44\u0E23"), React.createElement(window.DrText, {
    value: v.found,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E41\u0E08\u0E49\u0E07 error 2031 \xB7 \u0E1F\u0E34\u0E27\u0E2A\u0E4C DC \u0E2A\u0E15\u0E23\u0E34\u0E07 2 \u0E02\u0E32\u0E14",
    onChange: x => set({
      found: x
    })
  }), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, null, "\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07"), React.createElement(window.DrText, {
    value: v.work,
    disabled: locked,
    rows: 3,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1F\u0E34\u0E27\u0E2A\u0E4C DC \xB7 \u0E02\u0E31\u0E19\u0E08\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E49\u0E07\u0E41\u0E16\u0E27 \xB7 \u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E17\u0E31\u0E49\u0E07 18 \u0E41\u0E1C\u0E07",
    onChange: x => set({
      work: x
    })
  })), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, {
    hint: "\u0E2A\u0E23\u0E38\u0E1B\u0E43\u0E2B\u0E49\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2D\u0E48\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08"
  }, "\u0E1C\u0E25\u0E2B\u0E25\u0E31\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E23\u0E47\u0E08"), React.createElement(window.DrText, {
    value: v.result,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E48\u0E32\u0E22\u0E44\u0E1F\u0E1B\u0E01\u0E15\u0E34 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E25\u0E34\u0E15\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32 5.2 kW",
    onChange: x => set({
      result: x
    })
  }))), React.createElement(window.DrSection, {
    n: "3",
    title: "\u0E2D\u0E30\u0E44\u0E2B\u0E25\u0E48 / \u0E27\u0E31\u0E2A\u0E14\u0E38\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49",
    tone: "#0EA5E9",
    hint: "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E43\u0E0A\u0E49\u0E2D\u0E30\u0E44\u0E23\u0E01\u0E47\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49"
  }, React.createElement(window.DrRows, {
    disabled: locked,
    rows: v.parts,
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E30\u0E44\u0E2B\u0E25\u0E48",
    cols: [{
      k: "name",
      th: "รายการ"
    }, {
      k: "qty",
      th: "จำนวน",
      w: 76,
      type: "num"
    }, {
      k: "unit",
      th: "หน่วย",
      w: 76
    }, {
      k: "note",
      th: "หมายเหตุ"
    }],
    onChange: rows => set({
      parts: rows
    })
  })), React.createElement(window.DrSection, {
    n: "4",
    title: "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    tone: "#1B9B75"
  }, React.createElement(window.DrChips, {
    disabled: locked,
    value: v.cover,
    onChange: x => set({
      cover: x || "unknown"
    }),
    options: ["warranty", "charge", "goodwill", "unknown"].map(k => ({
      key: k,
      th: window.omCoverTH(k).th,
      color: window.omCoverTH(k).color
    }))
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12,
      marginTop: 13
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E1A\u0E32\u0E17 \u2014 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07"
  }, "\u0E22\u0E2D\u0E14\u0E17\u0E35\u0E48\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"), React.createElement("input", {
    value: v.charge == null ? "" : String(v.charge),
    disabled: locked,
    inputMode: "decimal",
    onChange: e => {
      const x = e.target.value.replace(/[^0-9.]/g, "");
      set({
        charge: x === "" ? null : +x
      });
    },
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 11px",
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E40\u0E0A\u0E48\u0E19 \u0E27\u0E31\u0E19\u0E04\u0E23\u0E1A\u0E23\u0E2D\u0E1A\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E15\u0E48\u0E2D\u0E44\u0E1B"
  }, "\u0E19\u0E31\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B"), React.createElement("input", {
    type: "date",
    value: v.nextDue || "",
    disabled: locked,
    onChange: e => set({
      nextDue: e.target.value
    }),
    style: Object.assign({}, window.OM_INPUT, {
      padding: "8px 11px",
      fontFamily: "var(--mono)",
      fontSize: 13
    })
  }))), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(window.DrLabel, {
    hint: "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E32\u0E01\u0E1A\u0E2D\u0E01\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E49\u0E14\u0E39\u0E41\u0E25\u0E15\u0E48\u0E2D"
  }, "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33"), React.createElement(window.DrText, {
    value: v.advice,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0A\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E25\u0E49\u0E07\u0E1D\u0E38\u0E48\u0E19\u0E40\u0E22\u0E2D\u0E30 \u0E41\u0E19\u0E30\u0E19\u0E33\u0E25\u0E49\u0E32\u0E07\u0E17\u0E38\u0E01 4 \u0E40\u0E14\u0E37\u0E2D\u0E19",
    onChange: x => set({
      advice: x
    })
  }))), React.createElement(window.DrSection, {
    n: "5",
    title: "\u0E23\u0E39\u0E1B\u0E01\u0E48\u0E2D\u0E19 / \u0E2B\u0E25\u0E31\u0E07",
    tone: "#0EA5E9",
    hint: "\u0E23\u0E39\u0E1B\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19\u0E27\u0E48\u0E32\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E08\u0E23\u0E34\u0E07"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginBottom: 12
    }
  }, [["before", "ก่อนทำงาน"], ["after", "หลังทำงาน"]].map(([k, th]) => React.createElement("button", {
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
  }, th))), React.createElement(OmVisitPhotos, {
    visitId: v.id,
    slot: tab,
    currentUser: currentUser,
    disabled: locked
  })), React.createElement(window.DrSection, {
    n: "6",
    title: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19",
    tone: "#10B981",
    hint: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E40\u0E0B\u0E47\u0E19\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(window.DrSignSlot, {
    title: "\u0E0A\u0E48\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    sub: "\u0E1C\u0E39\u0E49\u0E40\u0E02\u0E49\u0E32\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19",
    sig: sigs.signs.tech,
    canSign: !locked,
    saved: mine.sign,
    onSign: () => setPad({
      slot: "tech",
      title: "ลายเซ็นช่างผู้ให้บริการ"
    }),
    onUseSaved: () => doSign("tech", mine.sign.img),
    onClear: () => sigs.clear("tech")
  }), React.createElement(window.DrSignSlot, {
    title: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    sub: "\u0E40\u0E0B\u0E47\u0E19\u0E23\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    sig: sigs.signs.cust,
    canSign: !locked,
    onSign: () => setPad({
      slot: "cust",
      title: "ลายเซ็นลูกค้าผู้รับบริการ",
      hint: "ให้ลูกค้าเซ็นในกรอบด้านล่างได้เลย"
    }),
    onClear: () => sigs.clear("cust")
  }))), window.omCanDelete(role) && (delAsk ? React.createElement("div", {
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
  }, "\u0E25\u0E1A\u0E43\u0E1A ", v.no, " \u0E17\u0E31\u0E49\u0E07\u0E43\u0E1A? \u0E23\u0E39\u0E1B\u0E41\u0E25\u0E30\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E2B\u0E32\u0E22\u0E16\u0E32\u0E27\u0E23 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"), React.createElement("button", {
    onClick: () => setDelAsk(false),
    style: btn("var(--surface)", "var(--text-2)", "1px solid var(--border-strong)")
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => {
      onRemove(v.id);
      onClose();
    },
    style: btn("#EF4444", "#fff")
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#fff"
  }), " \u0E25\u0E1A\u0E40\u0E25\u0E22")) : React.createElement("button", {
    onClick: () => setDelAsk(true),
    style: btn("var(--surface)", "#EF4444", "1px solid var(--border)")
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#EF4444"
  }), " \u0E25\u0E1A\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)"))))), pad && React.createElement(window.DrSignPad, {
    title: pad.title,
    hint: pad.hint,
    onClose: () => setPad(null),
    saved: pad.slot === "tech" ? mine.sign : null,
    remember: pad.slot === "tech" ? remember : undefined,
    onRemember: pad.slot === "tech" ? setRemember : undefined,
    onSave: (img, drawn) => {
      doSign(pad.slot, img);
      if (pad.slot === "tech" && drawn && remember) mine.save(img);
      const then = pad.then;
      setPad(null);
      if (then) then();
    }
  }), paper && React.createElement(OmVisitPaper, {
    visit: v,
    site: site,
    signs: sigs.signs,
    onClose: () => setPaper(false)
  }));
}
const OM_PAPER_I18N = {
  "ใบรายงานเข้าบริการ": ["Service Visit Report", "服务工单"],
  "ชื่อไซต์": ["Site", "站点名称"],
  "รหัสไซต์": ["Site code", "站点编号"],
  "ประเภทงาน": ["Visit type", "工单类型"],
  "ขนาดระบบ": ["System size", "系统容量"],
  "สถานที่": ["Location", "地址"],
  "ผู้ติดต่อ": ["Contact", "联系人"],
  "เวลาเข้า–ออก": ["Time in – out", "进出场时间"],
  "ทีมช่าง": ["Technicians", "施工人员"],
  "สถานะค่าบริการ": ["Charge status", "费用性质"],
  "ยอดเรียกเก็บ": ["Amount billed", "应收金额"],
  "ตรวจพบ": ["Findings", "检查发现"],
  "งานที่ทำ": ["Work performed", "处理内容"],
  "ผลหลังทำงานเสร็จ": ["Result after service", "处理结果"],
  "อะไหล่ / วัสดุที่ใช้": ["Parts and materials used", "所用配件与材料"],
  "รายการ": ["Description", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "หมายเหตุ": ["Note", "备注"],
  "คำแนะนำ / นัดครั้งถัดไป": ["Recommendations / next visit", "建议与下次服务"],
  "นัดครั้งถัดไป:": ["Next visit:", "下次服务："],
  "รูปก่อนทำงาน": ["Before service", "施工前照片"],
  "รูปหลังทำงาน": ["After service", "施工后照片"],
  "ช่างผู้ให้บริการ": ["Service technician", "服务技师"],
  "ลูกค้าผู้รับบริการ": ["Customer", "客户签收"],
  "อนุมัติโดย": ["Approved by", "批准人"],
  "ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ": ["Signed electronically in the system", "已在系统内电子签名"],
  "เอกสารนี้ออกจากระบบงานบริการหลังการขาย": ["Issued by the O&M system of", "本文件由售后运维系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "รูปที่": ["Photo", "照片"],
  "บาท": ["THB", "泰铢"],
  "แผง": ["modules", "块组件"],
  "รูป": ["photos", "张"],
  "ร่าง": ["Draft", "草稿"],
  "รอตรวจ": ["Pending review", "待审核"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "เข้าซ่อม": ["Repair", "维修"],
  "ล้างแผง": ["Panel cleaning", "组件清洗"],
  "เข้าตรวจเช็กระบบ": ["System inspection", "系统巡检"],
  "อยู่ในประกัน": ["Under warranty", "保修范围内"],
  "คิดค่าบริการ": ["Chargeable", "收费"],
  "บริการให้ฟรี": ["Goodwill (free)", "免费服务"],
  "ยังไม่ได้ตัดสิน": ["Not determined", "未确定"]
};
function OmPRow({
  k,
  v
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "6px 10px",
      borderRight: "1px solid #DCE4DF",
      borderBottom: "1px solid #DCE4DF",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#0A4D68",
      background: "#F3F7F4"
    }
  }, k), React.createElement("div", {
    style: {
      padding: "6px 10px",
      borderBottom: "1px solid #DCE4DF",
      fontSize: 11,
      color: "#15211A"
    }
  }, v || "-"));
}
function OmPBlock({
  title,
  children,
  avoid
}) {
  return React.createElement("div", {
    style: {
      marginTop: 16,
      breakInside: avoid ? "avoid" : "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid #DCE4DF",
      paddingBottom: 5,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 99,
      background: "#1B9B75"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "#15211A"
    }
  }, title)), children);
}
const omPara = t => React.createElement("div", {
  style: {
    fontSize: 11.5,
    lineHeight: 1.65,
    color: "#15211A",
    whiteSpace: "pre-wrap"
  }
}, t || "—");
const OM_SHOT_RATIOS = [{
  k: "4 / 3",
  th: "แนวนอน"
}, {
  k: "1 / 1",
  th: "จัตุรัส"
}, {
  k: "3 / 4",
  th: "แนวตั้ง"
}];
function omFrameOf(p) {
  const n = (x, d) => x == null || x === "" || !isFinite(+x) ? d : +x;
  return {
    z: Math.max(1, Math.min(3, n((p || {}).fz, 1))),
    x: n((p || {}).fx, 50),
    y: n((p || {}).fy, 50),
    full: !!(p || {}).ff
  };
}
function OmShot({
  p,
  n,
  ratio,
  tune,
  onFrame,
  T
}) {
  const [f, setF] = React.useState(() => omFrameOf(p));
  React.useEffect(() => {
    setF(omFrameOf(p));
  }, [p.fz, p.fx, p.fy, p.ff]);
  const box = React.useRef(null);
  const dr = React.useRef(null);
  const live = tune && !!onFrame;
  const save = nf => {
    if (onFrame) onFrame(p.id, {
      fz: Math.round(nf.z * 100) / 100,
      fx: Math.round(nf.x),
      fy: Math.round(nf.y),
      ff: nf.full ? 1 : 0
    });
  };
  const down = e => {
    if (!live) return;
    const el = box.current;
    dr.current = {
      cx: e.clientX,
      cy: e.clientY,
      x: f.x,
      y: f.y,
      w: el && el.clientWidth || 1,
      h: el && el.clientHeight || 1
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };
  const move = e => {
    const d = dr.current;
    if (!d) return;
    setF({
      z: f.z,
      full: f.full,
      x: Math.max(0, Math.min(100, d.x - (e.clientX - d.cx) / d.w * 100)),
      y: Math.max(0, Math.min(100, d.y - (e.clientY - d.cy) / d.h * 100))
    });
  };
  const up = () => {
    if (dr.current) {
      dr.current = null;
      save(f);
    }
  };
  return React.createElement("div", {
    className: "om-shot",
    style: {
      breakInside: "avoid",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden",
      background: "#fff"
    }
  }, React.createElement("div", {
    ref: box,
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: up,
    onPointerCancel: up,
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: ratio,
      overflow: "hidden",
      background: "#F3F7F4",
      cursor: live ? "move" : "default",
      touchAction: live ? "none" : "auto"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "",
    draggable: false,
    style: {
      width: "100%",
      height: "100%",
      display: "block",
      objectFit: f.full ? "contain" : "cover",
      objectPosition: f.x + "% " + f.y + "%",
      transform: f.z > 1 ? "scale(" + f.z + ")" : undefined,
      transformOrigin: f.x + "% " + f.y + "%"
    }
  }), live && React.createElement("div", {
    className: "sv-rep-noprint",
    onPointerDown: e => e.stopPropagation(),
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 9px",
      background: "rgba(8,24,17,.62)"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 12,
    color: "#fff"
  }), React.createElement("input", {
    type: "range",
    min: "1",
    max: "3",
    step: "0.05",
    value: f.z,
    disabled: f.full,
    onChange: e => setF({
      z: +e.target.value,
      x: f.x,
      y: f.y,
      full: f.full
    }),
    onPointerUp: () => save(f),
    onKeyUp: () => save(f),
    style: {
      flex: 1,
      minWidth: 0,
      accentColor: "#1B9B75",
      opacity: f.full ? .4 : 1
    }
  }), React.createElement("button", {
    type: "button",
    onClick: () => {
      const nf = {
        z: 1,
        x: 50,
        y: 50,
        full: !f.full
      };
      setF(nf);
      save(nf);
    },
    style: {
      padding: "3px 8px",
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,.45)",
      flexShrink: 0,
      background: f.full ? "#1B9B75" : "transparent",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 10.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, T("เต็มรูป")), React.createElement("button", {
    type: "button",
    onClick: () => {
      const nf = {
        z: 1,
        x: 50,
        y: 50,
        full: false
      };
      setF(nf);
      save(nf);
    },
    style: {
      padding: "3px 8px",
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,.45)",
      background: "transparent",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 10.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, T("ตั้งใหม่")))), React.createElement("div", {
    style: {
      padding: "5px 8px",
      fontSize: 10.5,
      color: "#4A5A51",
      borderTop: "1px solid #ECF1EE"
    }
  }, React.createElement("b", {
    style: {
      color: "#0A4D68"
    }
  }, T("รูปที่"), " ", n), p.cap ? " · " + p.cap : ""));
}
function OmPSheet({
  title,
  sub,
  head,
  children
}) {
  return React.createElement("div", {
    className: "om-sheet",
    style: {
      marginTop: 30
    }
  }, head, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: "-.01em",
      color: "#15211A"
    }
  }, title), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#7A8A81"
    }
  }, sub)), children);
}
function OmVisitPaper({
  visit,
  site,
  signs,
  photos,
  onFrame,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [fit, setFit] = React.useState(OM_SHOT_RATIOS[0].k);
  const [tune, setTune] = React.useState(false);
  const [lang, setLang] = React.useState(() => window.pgLang ? window.pgLang() : "th");
  const pickLang = id => {
    setLang(id);
    if (window.pgSetLang) window.pgSetLang(id);
  };
  const T = React.useMemo(() => window.pgT ? window.pgT(OM_PAPER_I18N, lang) : k => k, [lang]);
  const DT = iso => !iso ? "-" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang);
  const DTs = iso => !iso ? "-" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang);
  const own = window.useOmVisitPhotos(visit.id);
  const photoList = photos || own.photos;
  const frameSet = photos ? onFrame : own.setFrame;
  const v = visit;
  const kind = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
  const cov = window.omCoverTH(v.cover);
  const parts = (v.parts || []).filter(p => p && (p.name || p.qty));
  const before = photoList.filter(p => (p.slot || "before") === "before");
  const after = photoList.filter(p => p.slot === "after");
  const g = signs || {};
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
  const doPrint = () => {
    const old = document.title;
    document.title = T("ใบรายงานเข้าบริการ") + " " + (v.no || "") + " " + (v.date || "");
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const th = {
    textAlign: "left",
    padding: "5px 7px",
    fontSize: 10,
    fontWeight: 700,
    color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE",
    whiteSpace: "nowrap"
  };
  const td = {
    padding: "5px 7px",
    fontSize: 10.5,
    color: "#15211A",
    borderBottom: "1px solid #ECF1EE",
    verticalAlign: "top"
  };
  const sheetHead = React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 9,
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(window.BrandDoc, {
    height: 38
  })), React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 5
    }
  }, "SOLAR O&M \u2014 SERVICE VISIT REPORT")), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 10.5,
      color: "#4A5A51",
      lineHeight: 1.7
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "#15211A"
    }
  }, v.no), React.createElement("div", null, DT(v.date))));
  const shots = (title, list) => !list.length ? null : React.createElement(OmPSheet, {
    title: T(title),
    head: sheetHead,
    sub: list.length + " " + T("รูป") + " · " + (v.no || "") + (v.siteName || (site || {}).name ? " · " + (v.siteName || site.name) : "")
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, list.map((p, i) => React.createElement(OmShot, {
    key: p.id,
    p: p,
    n: i + 1,
    ratio: fit,
    tune: tune,
    onFrame: frameSet,
    T: T
  }))));
  return ReactDOM.createPortal(React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
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
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
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
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \xB7 ", window.drDateTH(v.date)), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, photoList.length, " \u0E23\u0E39\u0E1B \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), !!photoList.length && !!frameSet && React.createElement("button", {
    onClick: () => setTune(!tune),
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E44\u0E2B\u0E19\u0E02\u0E2D\u0E07\u0E23\u0E39\u0E1B",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "10px 13px",
      borderRadius: 11,
      border: "1px solid " + (tune ? "var(--primary)" : "var(--border-strong)"),
      background: tune ? "var(--primary)" : "var(--surface)",
      color: tune ? "#fff" : "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14,
    color: tune ? "#fff" : "var(--text-2)"
  }), " \u0E08\u0E31\u0E14\u0E01\u0E23\u0E2D\u0E1A\u0E23\u0E39\u0E1B"), typeof window.LangPick === "function" && React.createElement(window.LangPick, {
    value: lang,
    onChange: pickLang
  }), React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), tune && React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      maxWidth: 900,
      margin: "0 auto 14px",
      padding: "10px 14px",
      borderRadius: 12,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      flex: 1,
      minWidth: 180
    }
  }, "\u0E25\u0E32\u0E01\u0E1A\u0E19\u0E23\u0E39\u0E1B\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E47\u0E19 \xB7 \u0E41\u0E16\u0E1A\u0E25\u0E48\u0E32\u0E07\u0E04\u0E37\u0E2D\u0E0B\u0E39\u0E21 \xB7 \u0E15\u0E31\u0E49\u0E07\u0E41\u0E25\u0E49\u0E27\u0E08\u0E33\u0E44\u0E27\u0E49\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E39\u0E1B"), OM_SHOT_RATIOS.map(r => React.createElement("button", {
    key: r.k,
    onClick: () => setFit(r.k),
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      border: "1px solid " + (fit === r.k ? "var(--primary)" : "var(--border-strong)"),
      background: fit === r.k ? "var(--primary)" : "var(--surface)",
      color: fit === r.k ? "#fff" : "var(--text-2)"
    }
  }, r.th))), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
      fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    className: "om-page"
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, T("ใบรายงานเข้าบริการ")), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "SOLAR O&M \u2014 SERVICE VISIT REPORT"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandDoc, {
    height: 44
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11,
      color: "#4A5A51",
      lineHeight: 1.75
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "#15211A"
    }
  }, v.no), React.createElement("div", null, DT(v.date)))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(OmPRow, {
    k: T("ชื่อไซต์"),
    v: v.siteName || (site || {}).name
  }), React.createElement(OmPRow, {
    k: T("รหัสไซต์"),
    v: v.siteCode
  }), React.createElement(OmPRow, {
    k: T("ประเภทงาน"),
    v: T(kind.th)
  }), React.createElement(OmPRow, {
    k: T("ขนาดระบบ"),
    v: (site || {}).kw ? site.kw + " kW" + (site.panels ? " · " + site.panels + " " + T("แผง") : "") : "-"
  }), React.createElement(OmPRow, {
    k: T("สถานที่"),
    v: [(site || {}).address, (site || {}).province].filter(Boolean).join(" · ")
  }), React.createElement(OmPRow, {
    k: T("ผู้ติดต่อ"),
    v: [(site || {}).phone].filter(Boolean).join(" · ")
  }), React.createElement(OmPRow, {
    k: T("เวลาเข้า–ออก"),
    v: (v.timeIn || "-") + " – " + (v.timeOut || "-")
  }), React.createElement(OmPRow, {
    k: T("ทีมช่าง"),
    v: v.team || v.byName
  })), React.createElement("div", {
    style: {
      marginTop: 14,
      border: "1px solid #DCE4DF",
      borderRadius: 9,
      padding: "12px 14px",
      breakInside: "avoid",
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "#4A5A51"
    }
  }, T("สถานะค่าบริการ")), React.createElement("span", {
    style: {
      padding: "3px 11px",
      borderRadius: 99,
      fontSize: 11.5,
      fontWeight: 800,
      background: cov.color + "22",
      color: cov.color
    }
  }, T(cov.th)), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#4A5A51"
    }
  }, T("ยอดเรียกเก็บ")), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 17,
      fontWeight: 800,
      color: "#15211A"
    }
  }, v.charge == null ? "—" : Number(v.charge).toLocaleString("th-TH") + " " + T("บาท"))), React.createElement(OmPBlock, {
    title: T("ตรวจพบ"),
    avoid: true
  }, omPara(v.found)), React.createElement(OmPBlock, {
    title: T("งานที่ทำ"),
    avoid: true
  }, omPara(v.work)), React.createElement(OmPBlock, {
    title: T("ผลหลังทำงานเสร็จ"),
    avoid: true
  }, omPara(v.result)), !!parts.length && React.createElement(OmPBlock, {
    title: T("อะไหล่ / วัสดุที่ใช้")
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 26
    })
  }, "#"), React.createElement("th", {
    style: th
  }, T("รายการ")), React.createElement("th", {
    style: th
  }, T("จำนวน")), React.createElement("th", {
    style: th
  }, T("หน่วย")), React.createElement("th", {
    style: th
  }, T("หมายเหตุ")))), React.createElement("tbody", null, parts.map((p, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      color: "#7A8A81"
    })
  }, i + 1), React.createElement("td", {
    style: td
  }, p.name || "-"), React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)"
    })
  }, p.qty || "-"), React.createElement("td", {
    style: td
  }, p.unit || "-"), React.createElement("td", {
    style: td
  }, p.note || "-")))))), (v.advice || v.nextDue) && React.createElement(OmPBlock, {
    title: T("คำแนะนำ / นัดครั้งถัดไป"),
    avoid: true
  }, omPara(v.advice), v.nextDue && React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 11.5,
      color: "#15211A"
    }
  }, T("นัดครั้งถัดไป:"), " ", React.createElement("b", null, DT(v.nextDue)))), React.createElement("div", {
    className: "om-sign",
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      breakInside: "avoid"
    }
  }, [{
    t: T("ช่างผู้ให้บริการ"),
    n: v.byName,
    d: v.sentAt || v.updatedAt || v.createdAt,
    s: g.tech
  }, {
    t: T("ลูกค้าผู้รับบริการ"),
    n: v.siteName,
    d: v.date,
    s: g.cust
  }].map((x, i) => React.createElement("div", {
    key: i,
    style: {
      border: "1px solid #DCE4DF",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62"
    }
  }, x.t), React.createElement("div", {
    style: {
      height: 42,
      borderBottom: "1px solid #C9D5CE",
      marginTop: 6,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, x.s && x.s.img && React.createElement("img", {
    src: x.s.img,
    alt: "",
    style: {
      maxWidth: "88%",
      maxHeight: 40,
      objectFit: "contain"
    }
  })), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, T("ชื่อ:"), " ", React.createElement("b", null, x.s && x.s.name || x.n || "-")), x.s && x.s.img && React.createElement("div", {
    style: {
      fontSize: 8.5,
      color: "#8A9A91",
      marginTop: 3
    }
  }, T("ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ"), " ", window.drSignTime(x.s) ? window.drSignTime(x.s) + (lang === "th" ? " น." : "") : "")))), v.status === "approved" && React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 10,
      color: "#4A5A51",
      textAlign: "right"
    }
  }, T("อนุมัติโดย"), " ", React.createElement("b", {
    style: {
      color: "#15211A"
    }
  }, v.appName || "-"), v.approvedAt ? " · " + DTs(window.drLocalDay(v.approvedAt)) : ""), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, T("เอกสารนี้ออกจากระบบงานบริการหลังการขาย"), " flash+solar \xB7 ", v.no, " \xB7 ", T("พิมพ์เมื่อ"), " ", DTs(window.drToday()))), shots("รูปก่อนทำงาน", before), shots("รูปหลังทำงาน", after))), document.body);
}
function OmVisitList({
  sites,
  visitStore,
  role,
  currentUser
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    visits,
    loading,
    patch,
    remove
  } = visitStore;
  const [openId, setOpenId] = React.useState(null);
  const [filter, setFilter] = React.useState("");
  const [q, setQ] = React.useState("");
  const siteById = React.useMemo(() => {
    const m = {};
    (sites || []).forEach(s => {
      if (s && s.id) m[s.id] = s;
    });
    return m;
  }, [sites]);
  const roll = React.useMemo(() => window.omVisitRollup(visits), [visits]);
  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (visits || []).filter(v => {
      if (filter && (v.status || "draft") !== filter) return false;
      if (!kw) return true;
      return [v.no, v.siteName, v.siteCode, v.work, v.found].some(x => String(x || "").toLowerCase().includes(kw));
    });
  }, [visits, filter, q]);
  const cur = visits.find(x => x.id === openId) || null;
  const tog = k => setFilter(filter === k ? "" : k);
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
    label: "\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    value: roll.total,
    color: "var(--text-1)"
  }), React.createElement(window.OmStat, {
    label: "\u0E22\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07",
    value: roll.draft,
    color: "#94A3B8",
    on: filter === "draft",
    onClick: () => tog("draft")
  }), React.createElement(window.OmStat, {
    label: "\u0E23\u0E2D\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08",
    value: roll.sent,
    color: "#F59E0B",
    on: filter === "sent",
    onClick: () => tog("sent")
  }), React.createElement(window.OmStat, {
    label: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27",
    value: roll.approved,
    color: "#10B981",
    on: filter === "approved",
    onClick: () => tog("approved")
  })), React.createElement("div", {
    style: {
      position: "relative"
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      left: 11,
      top: "50%",
      transform: "translateY(-50%)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  })), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E40\u0E25\u0E02\u0E43\u0E1A \xB7 \u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E0B\u0E15\u0E4C \xB7 \u0E40\u0E19\u0E37\u0E49\u0E2D\u0E07\u0E32\u0E19",
    style: Object.assign({}, window.OM_INPUT, {
      padding: "9px 12px 9px 34px",
      fontSize: 13
    })
  })), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface2)",
      overflow: "hidden"
    }
  }, loading && React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."), !loading && !rows.length && React.createElement("div", {
    style: {
      padding: 24,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, visits.length ? "ไม่มีใบที่ตรงกับที่ค้นหา" : "ยังไม่มีใบรายงาน — เปิดจากใบแจ้งซ่อม หรือจากนัดล้างแผงที่ทำเสร็จแล้ว"), rows.map(v => {
    const st = window.omVisitStatusOf(v.status);
    const k = window.OM_VISIT_KIND_BY[v.kind] || window.OM_VISIT_KIND_BY.repair;
    return React.createElement("button", {
      key: v.id,
      onClick: () => setOpenId(v.id),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: isMobile ? "11px 12px" : "13px 16px",
        borderBottom: "1px solid var(--border)",
        background: "none",
        border: "none",
        borderTop: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement(Icon, {
      name: k.icon,
      size: 16,
      color: k.color
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, v.siteName || v.siteCode, " \xB7 ", k.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, v.no, " \xB7 ", window.drShort(v.date))), v.charge != null && React.createElement(window.OmPill, {
      th: Number(v.charge).toLocaleString("th-TH") + " บาท",
      color: "#F59E0B"
    }), React.createElement(window.OmPill, {
      th: st.th,
      color: st.color
    }), React.createElement(Icon, {
      name: "chevronRight",
      size: 15,
      color: "var(--text-3)"
    }));
  })), cur && React.createElement(OmVisitModal, {
    visit: cur,
    site: siteById[cur.siteId] || null,
    role: role,
    currentUser: currentUser,
    onClose: () => setOpenId(null),
    onPatch: patch,
    onRemove: remove
  }));
}
Object.assign(window, {
  OmVisitPhotos,
  OmVisitModal,
  OmVisitPaper,
  OmVisitList,
  OmPBlock,
  OmPRow,
  OmPSheet,
  OmShot,
  omFrameOf
});