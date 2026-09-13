const LN_DR_MAX = 8;
const LN_DR_FIELD = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none"
};
const LN_DR_LABEL = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--text-3)"
};
function LnDailyForm({
  me,
  role,
  job,
  date,
  store,
  notify
}) {
  const photos = window.useDailyPhotos(job.id, date);
  const sigs = window.useDailySigns(job.id, date);
  const mine = window.useDrMySign((me || {}).id || null);
  const prev = React.useMemo(() => window.drPrevOf(store.byDate, date), [store.byDate, date]);
  const saved = store.byDate[date] || null;
  const [form, setForm] = React.useState(null);
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [zoom, setZoom] = React.useState(null);
  React.useEffect(() => {
    setForm(saved ? Object.assign(window.drBlank(job, date, me, prev), saved) : window.drBlank(job, date, me, prev));
    setMsg("");
  }, [job.id, date, !!saved]);
  if (!form) return null;
  const locked = form.status === "approved" || form.status === "sent";
  const set = fields => setForm(p => {
    const n = Object.assign({}, p, fields);
    if (n.mode !== "project") n.pct = window.drRollup(n.steps);
    return n;
  });
  const setStep = (i, pct) => set({
    steps: (form.steps || []).map((r, x) => x === i ? Object.assign({}, r, {
      pct: Math.max(0, Math.min(100, +pct || 0))
    }) : r)
  });
  const onPick = async e => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(0, LN_DR_MAX - photos.photos.length));
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    for (const f of files) {
      try {
        photos.add(await window.resizeImageFile(f, 1100, 0.70), me);
      } catch (err) {}
    }
    setBusy(false);
  };
  const saveDraft = () => {
    store.save(date, form);
    setMsg("บันทึกร่างแล้ว");
  };
  const doSend = () => {
    const rec = Object.assign({}, form, {
      status: "sent",
      sentAt: new Date().toISOString(),
      byId: (me || {}).id || null,
      byName: (me || {}).name || ""
    });
    store.save(date, rec);
    setForm(rec);
    const eeId = job.eeId || "";
    if (notify && eeId && eeId !== ((me || {}).id || "")) {
      notify({
        toUserId: eeId,
        type: "daily",
        event: "sent",
        jobId: job.id,
        jobName: job.name,
        title: "รายงานประจำวันรออนุมัติ",
        body: [job.code, window.drDateTH(date), "โดย " + ((me || {}).name || "ช่าง")].filter(Boolean).join(" · ")
      });
    }
    setMsg("ส่งให้วิศวกรอนุมัติแล้ว");
  };
  const send = () => {
    if (sigs.signs.by && sigs.signs.by.img) return doSend();
    if (mine.sign && mine.sign.img) {
      sigs.sign("by", mine.sign.img, me);
      return doSend();
    }
    setPad(true);
  };
  const onSign = (img, drawn) => {
    sigs.sign("by", img, me);
    if (drawn && remember) mine.save(img);
    setPad(null);
    doSend();
  };
  const full = photos.photos.length >= LN_DR_MAX;
  return React.createElement("div", {
    style: {
      display: "grid",
      gap: 14,
      paddingTop: 14
    }
  }, locked && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 12.5,
      fontWeight: 700,
      textAlign: "center",
      background: window.drStatusOf(form.status).color + "1A",
      color: window.drStatusOf(form.status).color
    }
  }, window.drStatusOf(form.status).th, " \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E08\u0E32\u0E01\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E41\u0E25\u0E49\u0E27"), window.drNoEe(job) && !locked && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 12,
      lineHeight: 1.6,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A \u2014 \u0E2A\u0E48\u0E07\u0E43\u0E1A\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E21\u0E32\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, [["weatherAm", "ช่วงเช้า"], ["weatherPm", "ช่วงบ่าย"]].map(([k, th]) => React.createElement("div", {
    key: k,
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginBottom: 4
    }
  }, th), React.createElement("select", {
    value: form[k] || "",
    disabled: locked,
    onChange: e => set({
      [k]: e.target.value
    }),
    style: Object.assign({}, LN_DR_FIELD, {
      fontSize: 14
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014"), window.DR_WEATHER.map(w => React.createElement("option", {
    key: w.key,
    value: w.key
  }, w.th))))))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07"), React.createElement("textarea", {
    rows: 4,
    value: form.work || "",
    disabled: locked,
    onChange: e => set({
      work: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E22\u0E01\u0E41\u0E1C\u0E07\u0E02\u0E36\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 1-3 \u0E40\u0E2A\u0E23\u0E47\u0E08 \xB7 \u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 DC \u0E1D\u0E31\u0E48\u0E07\u0E15\u0E30\u0E27\u0E31\u0E19\u0E2D\u0E2D\u0E01",
    style: Object.assign({}, LN_DR_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E37\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 19,
      fontWeight: 800,
      color: "var(--primary-dark)"
    }
  }, form.mode === "project" ? window.drRollup(form.steps) : form.pct, "%"), prev && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19 ", +prev.pct || 0, "%")), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, (form.steps || []).map((r, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "9px 11px",
      borderBottom: "1px solid var(--border)",
      background: r.head && form.mode === "project" && !r.no.includes(".") ? "var(--surface2)" : "var(--surface)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11,
      color: "var(--text-3)",
      minWidth: 26
    }
  }, r.no), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, r.th), React.createElement("input", {
    value: r.pct || "",
    disabled: locked,
    inputMode: "numeric",
    placeholder: "0",
    onChange: e => setStep(i, e.target.value),
    style: {
      width: 58,
      padding: "7px 8px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontSize: 13,
      textAlign: "right",
      outline: "none"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "%"))))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E1B\u0E31\u0E0D\u0E2B\u0E32 / \u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04"), React.createElement("textarea", {
    rows: 2,
    value: form.problem || "",
    disabled: locked,
    onChange: e => set({
      problem: e.target.value
    }),
    placeholder: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E47\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49",
    style: Object.assign({}, LN_DR_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E41\u0E1C\u0E19\u0E07\u0E32\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49"), React.createElement("textarea", {
    rows: 2,
    value: form.nextDay || "",
    disabled: locked,
    onChange: e => set({
      nextDay: e.target.value
    }),
    style: Object.assign({}, LN_DR_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E17\u0E35\u0E21\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("input", {
    value: form.team || "",
    disabled: locked,
    onChange: e => set({
      team: e.target.value
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0A\u0E48\u0E32\u0E07 3 \u0E04\u0E19 \xB7 \u0E1C\u0E39\u0E49\u0E0A\u0E48\u0E27\u0E22 2 \u0E04\u0E19",
    style: LN_DR_FIELD
  })), React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11,
      color: full ? "var(--tint-amber-tx)" : "var(--text-3)"
    }
  }, photos.photos.length, "/", LN_DR_MAX, " \u0E23\u0E39\u0E1B")), React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, photos.photos.map(p => React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "flex-start"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: "",
    onClick: () => setZoom(p.dataUrl),
    style: {
      width: 84,
      height: 84,
      objectFit: "cover",
      borderRadius: 10,
      border: "1px solid var(--border)"
    }
  }), !locked && React.createElement("button", {
    onClick: () => photos.remove(p.id),
    style: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 99,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      lineHeight: "24px",
      padding: 0
    }
  }, "\xD7")), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, locked ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: p.cap ? "var(--text-1)" : "var(--text-3)",
      lineHeight: 1.6
    }
  }, p.cap || "ไม่ได้เขียนคำอธิบายไว้") : React.createElement(LnPhotoCap, {
    value: p.cap || "",
    onSave: v => photos.setCap(p.id, v)
  })))), !locked && !full && React.createElement("label", {
    style: {
      width: 84,
      height: 84,
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      display: "grid",
      placeItems: "center",
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 22,
    color: "var(--text-3)"
  }), React.createElement("input", {
    type: "file",
    accept: "image/*",
    capture: "environment",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  }))), full && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E04\u0E23\u0E1A ", LN_DR_MAX, " \u0E23\u0E39\u0E1B\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E1A\u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E2D\u0E01\u0E01\u0E48\u0E2D\u0E19\u0E16\u0E36\u0E07\u0E08\u0E30\u0E16\u0E48\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E14\u0E49", React.createElement("br", null), "\u0E08\u0E33\u0E01\u0E31\u0E14\u0E44\u0E27\u0E49\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E44\u0E14\u0E49\u0E40\u0E23\u0E47\u0E27\u0E1A\u0E19\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E04\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E2D\u0E48\u0E32\u0E19")), msg && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      textAlign: "center",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)"
    }
  }, msg), !locked && React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, React.createElement("button", {
    onClick: send,
    disabled: busy || !(form.work || "").trim(),
    style: {
      width: "100%",
      padding: "16px 18px",
      borderRadius: 15,
      border: "none",
      fontFamily: "inherit",
      fontSize: 16,
      fontWeight: 800,
      cursor: "pointer",
      background: !busy && (form.work || "").trim() ? "var(--primary)" : "var(--surface3)",
      color: !busy && (form.work || "").trim() ? "#fff" : "var(--text-3)"
    }
  }, busy ? "กำลังบันทึก…" : "เซ็นแล้วส่งให้อนุมัติ"), React.createElement("button", {
    onClick: saveDraft,
    disabled: busy,
    style: {
      width: "100%",
      padding: "13px 18px",
      borderRadius: 13,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19"), !(form.work || "").trim() && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center"
    }
  }, "\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E48\u0E2D\u0E07 \u201C\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07\u201D \u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E25\u0E48\u0E32\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C\u0E01\u0E31\u0E1A\u0E43\u0E04\u0E23")), locked && sigs.signs.by && sigs.signs.by.img && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "11px 13px",
      borderRadius: 12,
      border: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("img", {
    src: sigs.signs.by.img,
    alt: "",
    style: {
      height: 34,
      maxWidth: 130,
      objectFit: "contain"
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", sigs.signs.by.name || "", React.createElement("br", null), window.drDateTH(window.drSignDay(sigs.signs.by)), " ", window.drSignTime(sigs.signs.by))), pad && React.createElement(window.DrSignPad, {
    title: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01",
    hint: "เซ็นแล้วระบบจะส่งใบนี้ให้" + (job.eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "อนุมัติทันที",
    saved: mine.sign,
    onSave: onSign,
    onClose: () => setPad(null),
    remember: remember,
    onRemember: setRemember
  }), zoom && React.createElement("div", {
    onClick: () => setZoom(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 70,
      background: "rgba(0,0,0,.92)",
      display: "grid",
      placeItems: "center",
      padding: 14,
      cursor: "zoom-out"
    }
  }, React.createElement("img", {
    src: zoom,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain"
    }
  })));
}
function LnPhotoCap({
  value,
  onSave
}) {
  const [v, setV] = React.useState(value || "");
  const [focus, setFocus] = React.useState(false);
  React.useEffect(() => {
    if (!focus) setV(value || "");
  }, [value, focus]);
  return React.createElement("input", {
    value: v,
    onChange: e => setV(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => {
      setFocus(false);
      if ((value || "") !== v) onSave(v);
    },
    placeholder: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49 \u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 1",
    style: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 16,
      outline: "none"
    }
  });
}
function LnDailyTab({
  me,
  role,
  jobs,
  notify
}) {
  const [jobId, setJobId] = React.useState(() => ((jobs || [])[0] || {}).id || "");
  const [date, setDate] = React.useState(window.drToday());
  const store = window.useDailyReports(jobId || null);
  const job = (jobs || []).find(j => j.id === jobId) || null;
  const day = window.drDayState(store.byDate, date);
  if (!window.can(role, "editJob")) {
    return React.createElement("div", {
      style: {
        padding: 34,
        textAlign: "center",
        color: "var(--text-3)",
        fontSize: 13.5
      }
    }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E02\u0E35\u0E22\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19");
  }
  return React.createElement("div", {
    style: {
      padding: 18
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E07\u0E32\u0E19"), React.createElement("select", {
    value: jobId,
    onChange: e => setJobId(e.target.value),
    style: LN_DR_FIELD
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19 \u2014"), (jobs || []).slice(0, 80).map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name)))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: LN_DR_LABEL
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value || window.drToday()),
    style: LN_DR_FIELD
  }))), job && React.createElement("div", {
    style: {
      marginTop: 11,
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, window.drDocNo(job, date, store.dates)), React.createElement("span", {
    style: {
      marginLeft: "auto",
      padding: "3px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 800,
      background: day.color + "1A",
      color: day.color
    }
  }, day.th)), !job ? React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5,
      lineHeight: 1.7
    }
  }, (jobs || []).length === 0 ? "ยังไม่มีงานที่กำลังดำเนินอยู่ของคุณ — รายการนี้ตัดงานที่ติดตั้งเสร็จแล้วออก" : "เลือกงานก่อน แล้วฟอร์มรายงานของวันนั้นจะขึ้นมา") : React.createElement(LnDailyForm, {
    me: me,
    role: role,
    job: job,
    date: date,
    store: store,
    notify: notify
  }), React.createElement("div", {
    style: {
      marginTop: 16,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7,
      textAlign: "center"
    }
  }, "\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A A4 \u0E17\u0E33\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E1A\u0E19\u0E04\u0E2D\u0E21\u0E1E\u0E34\u0E27\u0E40\u0E15\u0E2D\u0E23\u0E4C", React.createElement("br", null), "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E08\u0E32\u0E01\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E0B\u0E49\u0E33"));
}
Object.assign(window, {
  LnDailyTab,
  LnDailyForm,
  LN_DR_MAX
});