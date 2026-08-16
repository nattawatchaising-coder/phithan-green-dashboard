function byInstallDate(a, b) {
  return (a.startDate || "9999-99-99").localeCompare(b.startDate || "9999-99-99");
}
function KanbanCard({
  job,
  onOpen,
  onDragStart,
  dragging
}) {
  const s = stageOf(job.stage);
  return (React.createElement("div", {
      draggable: true,
      onDragStart: e => onDragStart(e, job),
      onClick: () => onOpen(job),
      style: {
        background: "var(--surface)",
        border: "1px solid " + (job.problem ? "var(--tint-red-bd)" : "var(--border)"),
        borderRadius: 14,
        padding: "13px 14px",
        cursor: "grab",
        boxShadow: "var(--shadow-sm)",
        opacity: dragging ? 0.4 : 1,
        borderLeft: job.problem ? "3px solid var(--mark-danger)" : job.delayed ? "3px solid var(--mark-warn)" : "1px solid var(--border)",
        transition: "box-shadow .16s, transform .16s, border-color .16s"
      },
      onMouseEnter: e => {
        e.currentTarget.style.boxShadow = "0 8px 22px rgba(8,20,14,.09)";
        e.currentTarget.style.transform = "translateY(-2px)";
      },
      onMouseLeave: e => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.transform = "none";
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 7,
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-3)",
        letterSpacing: "-.01em"
      }
    }, job.code), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, job.trello && React.createElement("a", {
      href: job.trello,
      target: "_blank",
      rel: "noreferrer",
      onClick: e => e.stopPropagation(),
      title: "\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14 Trello",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 700,
        color: "#fff",
        background: "#0079BF",
        padding: "3px 8px",
        borderRadius: 6,
        textDecoration: "none"
      }
    }, React.createElement(Icon, {
      name: "trello",
      size: 11,
      color: "#fff"
    }), " Trello"), React.createElement(TypeBadge, {
      type: job.type
    }))), (job.hasDesign || job.hasBoq) && React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginBottom: 6,
        flexWrap: "wrap"
      }
    }, job.hasDesign && React.createElement(DocChip, {
      job: job,
      kind: "design",
      label: "\u0E41\u0E1A\u0E1A",
      color: "#2563EB",
      soft: "#2563EB14"
    }), job.hasBoq && React.createElement(DocChip, {
      job: job,
      kind: "boq",
      label: "BOQ",
      color: "#0D9488",
      soft: "#0D948814"
    })), React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 700,
        color: "var(--text-1)",
        lineHeight: 1.3,
        marginBottom: 3,
        letterSpacing: "-.01em"
      }
    }, job.name), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        color: "var(--text-3)",
        marginBottom: 10,
        whiteSpace: "nowrap",
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, React.createElement(Icon, {
      name: "pin",
      size: 11,
      style: {
        verticalAlign: -1
      }
    }), " ", job.province, " \xB7 ", React.createElement("span", {
      style: {
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, job.brand)), job.birdnet && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        flexShrink: 0,
        fontSize: 10.5,
        fontWeight: 700,
        color: "#0D9488",
        background: "#0D948814",
        border: "1px solid #0D948844",
        padding: "2px 7px",
        borderRadius: 99
      }
    }, React.createElement(Icon, {
      name: "net",
      size: 10,
      color: "#0D9488"
    }), "\u0E01\u0E31\u0E19\u0E19\u0E01"), job.backup && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        flexShrink: 0,
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--primary-dark)",
        background: "var(--primary-soft)",
        padding: "2px 7px",
        borderRadius: 99
      }
    }, React.createElement(Icon, {
      name: "shield",
      size: 10,
      color: "var(--primary-dark)"
    }), "Backup")), job.permit && job.permit.status && (() => {
      const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
      if (!pst) return null;
      const rejected = job.permit.status === "rejected";
      return React.createElement("div", {
        style: {
          marginBottom: 10,
          padding: "6px 9px",
          borderRadius: 9,
          background: pst.color + "14",
          border: "1px solid " + pst.color + (rejected ? "" : "33")
        }
      }, React.createElement("div", {
        style: {
          fontSize: 10.5,
          fontWeight: 800,
          color: pst.color
        }
      }, React.createElement(Icon, {
        name: "shield",
        size: 10,
        color: pst.color,
        style: {
          verticalAlign: -1
        }
      }), " \u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \xB7 ", pst.th), rejected && job.permit.rejectReason && React.createElement("div", {
        style: {
          fontSize: 10.5,
          color: pst.color,
          marginTop: 3,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }
      }, job.permit.rejectReason));
    })(), job.problem && React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--tint-red-tx)",
        background: "var(--tint-red-bg)",
        borderRadius: 8,
        padding: "6px 8px",
        marginBottom: 10,
        lineHeight: 1.4,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, "\u26A0 ", job.problem), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 11,
        flexWrap: "wrap",
        fontSize: 11.5
      }
    }, React.createElement("span", {
      style: {
        color: "var(--text-2)",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums"
      }
    }, React.createElement("b", {
      style: {
        color: "var(--text-1)",
        fontWeight: 700
      }
    }, job.kw), " kW", React.createElement("span", {
      style: {
        color: "var(--text-3)",
        margin: "0 5px"
      }
    }, "\xB7"), React.createElement("b", {
      style: {
        color: "var(--text-1)",
        fontWeight: 700
      }
    }, job.panels), " \u0E41\u0E1C\u0E07", React.createElement("span", {
      style: {
        color: "var(--text-3)",
        margin: "0 5px"
      }
    }, "\xB7"), job.phase || "1", " \u0E40\u0E1F\u0E2A"), job.battery && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--primary-dark)",
        background: "var(--primary-soft)",
        padding: "2px 7px",
        borderRadius: 99
      }
    }, React.createElement(Icon, {
      name: "battery",
      size: 10,
      color: "var(--primary-dark)"
    }), job.batSize), (job.brand || "").toUpperCase().includes("ATMOCE") && job.comboType === "assembled" && React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-2)",
        background: "var(--surface2)",
        padding: "2px 7px",
        borderRadius: 99
      }
    }, "\u0E15\u0E39\u0E49\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A")), React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 10,
        borderTop: "1px solid var(--border)",
        gap: 8,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0
      }
    }, React.createElement(TechAvatar, {
      techId: job.tech,
      size: 24
    }), job.startDate ? React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "-.01em",
        color: job.delayed ? "#D93025" : "var(--text-2)"
      }
    }, thDate(job.startDate)) : React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 10,
        fontWeight: 700,
        color: "var(--tint-amber-tx)",
        background: "var(--tint-amber-bg2)",
        border: "1px solid #FCD34D",
        padding: "2px 7px",
        borderRadius: 99,
        whiteSpace: "nowrap"
      }
    }, React.createElement(Icon, {
      name: "alert",
      size: 10,
      color: "var(--tint-amber-tx)"
    }), " \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E31\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07")), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, React.createElement(MatDots, {
      mat: job.mat
    }), React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "-.02em",
        fontVariantNumeric: "tabular-nums",
        color: job.matReady ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, job.matReadyPct, "%"))), job.stage === "install" && React.createElement(DailyReportButton, {
      job: job
    }))
  );
}
function DocChip({
  job,
  kind,
  label,
  color,
  soft
}) {
  const [open, setOpen] = React.useState(false);
  return React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      setOpen(true);
    },
    title: "ดู" + label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10,
      fontWeight: 700,
      color: color,
      background: soft,
      border: "1px solid " + color + "44",
      padding: "2px 7px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 10,
    color: color
  }), label), open && ReactDOM.createPortal(React.createElement(DocViewer, {
    job: job,
    kind: kind,
    label: label,
    color: color,
    onClose: () => setOpen(false)
  }), document.body));
}
function DocViewer({
  job,
  kind,
  label,
  color,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job.id);
  const files = (media.files || []).filter(f => f.kind === kind);
  const [idx, setIdx] = React.useState(0);
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);
  const cur = files[idx] || files[0];
  const blobUrl = React.useMemo(() => {
    try {
      return cur ? dataUrlToBlobUrl(cur.dataUrl) : null;
    } catch (e) {
      return null;
    }
  }, [cur && cur.id]);
  React.useEffect(() => () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);
  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = cur.name || label + ".pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 130,
      display: "grid",
      placeItems: isMobile ? "stretch" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? 0 : 16,
      width: isMobile ? "100%" : "min(900px,96vw)",
      height: isMobile ? "100%" : "92vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: color + "16",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: color
  })), React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: color,
      letterSpacing: ".04em"
    }
  }, label, " \xB7 ", job.code), React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, cur ? cur.name : "กำลังโหลด…")), blobUrl && React.createElement("button", {
    onClick: () => window.open(blobUrl, "_blank", "noopener"),
    title: "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D",
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "link",
    size: 16,
    color: "var(--text-2)"
  })), blobUrl && React.createElement("button", {
    onClick: download,
    title: "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14",
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 16,
    color: "var(--text-2)"
  })), React.createElement("button", {
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    style: {
      width: 34,
      height: 34,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), files.length > 1 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: "8px 12px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      overflowX: "auto",
      flexShrink: 0
    }
  }, files.map((f, i) => React.createElement("button", {
    key: f.id,
    onClick: () => setIdx(i),
    style: {
      flexShrink: 0,
      padding: "5px 11px",
      borderRadius: 8,
      fontSize: 11.5,
      fontWeight: 600,
      fontFamily: "inherit",
      cursor: "pointer",
      border: "1px solid " + (i === idx ? color : "var(--border-strong)"),
      background: i === idx ? color + "14" : "var(--surface)",
      color: i === idx ? color : "var(--text-2)",
      maxWidth: 160,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, f.name))), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      background: "var(--surface2)",
      display: "grid"
    }
  }, blobUrl ? React.createElement("iframe", {
    key: cur.id,
    src: blobUrl,
    title: cur.name,
    style: {
      width: "100%",
      height: "100%",
      border: "none"
    }
  }) : React.createElement("div", {
    style: {
      placeSelf: "center",
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13,
      padding: 24
    }
  }, slow ? React.createElement(React.Fragment, null, React.createElement(Icon, {
    name: "alert",
    size: 22,
    color: "var(--text-3)"
  }), React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E44\u0E1F\u0E25\u0E4C ", label, " (\u0E2D\u0E32\u0E08\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27)")) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      width: 26,
      height: 26,
      border: "3px solid var(--border)",
      borderTopColor: color,
      borderRadius: "50%",
      margin: "0 auto 10px",
      animation: "spin .8s linear infinite"
    }
  }), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E44\u0E1F\u0E25\u0E4C\u2026"))), isMobile && blobUrl && React.createElement("div", {
    style: {
      padding: "10px 14px calc(10px + env(safe-area-inset-bottom,0px))",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: () => window.open(blobUrl, "_blank", "noopener"),
    style: {
      flex: 1,
      padding: "11px",
      borderRadius: 10,
      border: "none",
      background: color,
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "link",
    size: 16,
    color: "#fff"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D"), React.createElement("button", {
    onClick: download,
    style: {
      flex: "0 0 auto",
      padding: "11px 16px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 16,
    color: "var(--text-2)"
  })))));
}
function Stat({
  icon,
  text,
  accent
}) {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      color: accent ? "var(--primary-dark)" : "var(--text-2)",
      background: accent ? "var(--primary-soft)" : "var(--surface2)",
      padding: "3px 7px",
      borderRadius: 7
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 11,
    color: accent ? "var(--primary-dark)" : "var(--text-3)"
  }), text);
}
function KanbanView({
  jobs,
  onOpen,
  onMoveStage
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const onDragStart = (e, job) => {
    setDrag(job.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = stageKey => {
    if (drag) onMoveStage(drag, stageKey);
    setDrag(null);
    setOver(null);
  };
  if (isMobile) return React.createElement(KanbanMobile, {
    jobs: jobs,
    onOpen: onOpen
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      overflowX: "auto",
      paddingBottom: 12,
      minHeight: 0,
      flex: 1
    }
  }, SF.STAGES.map(s => {
    const col = jobs.filter(j => j.stage === s.key).sort(byInstallDate);
    const isOver = over === s.key;
    return React.createElement("div", {
      key: s.key,
      onDragOver: e => {
        e.preventDefault();
        setOver(s.key);
      },
      onDragLeave: () => setOver(o => o === s.key ? null : o),
      onDrop: () => onDrop(s.key),
      style: {
        width: 264,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        background: isOver ? s.soft : "var(--surface2)",
        border: "1px solid " + (isOver ? s.color : "var(--border)"),
        transition: "background .15s, border-color .15s"
      }
    }, React.createElement("div", {
      style: {
        padding: "13px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 1,
        background: isOver ? s.soft : "var(--surface2)",
        borderRadius: "17px 17px 0 0",
        transition: "background .15s"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: s.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".05em",
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, s.th)), React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "-.02em",
        color: col.length ? "var(--text-1)" : "var(--text-3)",
        fontVariantNumeric: "tabular-nums"
      }
    }, col.length)), React.createElement("div", {
      style: {
        padding: 11,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        overflowY: "auto",
        flex: 1,
        minHeight: 80
      }
    }, col.map(j => React.createElement(KanbanCard, {
      key: j.id,
      job: j,
      onOpen: onOpen,
      onDragStart: onDragStart,
      dragging: drag === j.id
    })), col.length === 0 && React.createElement("div", {
      style: {
        padding: "20px 0",
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-3)",
        border: "1.5px dashed var(--border-strong)",
        borderRadius: 10
      }
    }, isOver ? "วางที่นี่" : "ว่าง")));
  }));
}
function KanbanMobile({
  jobs,
  onOpen
}) {
  const SF = window.SF;
  const [collapsed, setCollapsed] = React.useState({});
  const noop = () => {};
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, SF.STAGES.map(s => {
    const col = jobs.filter(j => j.stage === s.key).sort(byInstallDate);
    const isOpen = collapsed[s.key] !== undefined ? !collapsed[s.key] : false;
    const problems = col.filter(j => j.problem || j.delayed).length;
    return React.createElement("div", {
      key: s.key,
      style: {
        borderRadius: 14,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        overflow: "hidden"
      }
    }, React.createElement("button", {
      onClick: () => setCollapsed(c => ({
        ...c,
        [s.key]: isOpen
      })),
      style: {
        width: "100%",
        padding: "13px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        borderBottom: isOpen ? "1px solid var(--border)" : "none"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 99,
        background: s.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, s.th), problems > 0 && React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "#EF4444",
        background: "var(--tint-red-bg2)",
        padding: "1px 6px",
        borderRadius: 99,
        flexShrink: 0
      }
    }, problems, "\u26A0")), React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 600,
        color: s.fg,
        background: s.soft,
        minWidth: 24,
        height: 24,
        borderRadius: 99,
        display: "grid",
        placeItems: "center",
        padding: "0 7px"
      }
    }, col.length), React.createElement(Icon, {
      name: "chevronDown",
      size: 17,
      color: "var(--text-3)",
      style: {
        transform: isOpen ? "none" : "rotate(-90deg)",
        transition: "transform .18s"
      }
    }))), isOpen && React.createElement("div", {
      style: {
        padding: 11,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, col.map(j => React.createElement(KanbanCard, {
      key: j.id,
      job: j,
      onOpen: onOpen,
      onDragStart: noop,
      dragging: false
    })), col.length === 0 && React.createElement("div", {
      style: {
        padding: "16px 0",
        textAlign: "center",
        fontSize: 12,
        color: "var(--text-3)"
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E02\u0E31\u0E49\u0E19\u0E19\u0E35\u0E49")));
  }));
}
Object.assign(window, {
  KanbanView,
  KanbanCard,
  KanbanMobile
});