const _MFB = () => !!window.FBDB;
const _mref = p => window.FBDB.ref(p);
const _msnap = s => {
  const v = s.val();
  if (!v || typeof v !== "object") return [];
  return Object.values(v);
};
function resizeImageFile(file, maxDim, quality) {
  maxDim = maxDim || 1000;
  quality = quality || 0.72;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round(h * maxDim / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round(w * maxDim / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function dataUrlToBlobUrl(dataUrl) {
  const [head, b64] = String(dataUrl || "").split(",");
  const mime = (head.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b64 || "");
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], {
    type: mime
  }));
}
function useJobMedia(jobId) {
  const [photos, setPhotos] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [files, setFiles] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !_MFB()) {
      setPhotos([]);
      setComments([]);
      setFiles([]);
      return;
    }
    const pRef = _mref("jobPhotos/" + jobId);
    const cRef = _mref("jobComments/" + jobId);
    const fRef = _mref("jobFiles/" + jobId);
    const ph = pRef.on("value", s => {
      const a = _msnap(s);
      a.sort((x, y) => (x.at || "").localeCompare(y.at || ""));
      setPhotos(a);
    });
    const ch = cRef.on("value", s => {
      const a = _msnap(s);
      a.sort((x, y) => (x.at || "").localeCompare(y.at || ""));
      setComments(a);
    });
    const fh = fRef.on("value", s => {
      const a = _msnap(s);
      a.sort((x, y) => (x.at || "").localeCompare(y.at || ""));
      setFiles(a);
      _mref("jobFileFlags/" + jobId).set({
        design: a.some(f => f.kind === "design"),
        boq: a.some(f => f.kind === "boq")
      });
    });
    return () => {
      pRef.off("value", ph);
      cRef.off("value", ch);
      fRef.off("value", fh);
    };
  }, [jobId]);
  const addFile = React.useCallback((dataUrl, meta, user) => {
    if (!jobId) return;
    const id = "F-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _mref("jobFiles/" + jobId + "/" + id).set({
      id,
      jobId,
      dataUrl,
      kind: meta && meta.kind || "other",
      name: meta && meta.name || "ไฟล์",
      size: meta && meta.size || 0,
      by: user && user.id || null,
      byName: user && user.name || "-",
      at: new Date().toISOString()
    });
  }, [jobId]);
  const removeFile = React.useCallback(id => {
    if (jobId) _mref("jobFiles/" + jobId + "/" + id).remove();
  }, [jobId]);
  const addPhoto = React.useCallback((dataUrl, user, caption) => {
    if (!jobId) return;
    const id = "P-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _mref("jobPhotos/" + jobId + "/" + id).set({
      id,
      jobId,
      dataUrl,
      by: user && user.id || null,
      byName: user && user.name || "-",
      caption: caption || "",
      at: new Date().toISOString()
    });
  }, [jobId]);
  const removePhoto = React.useCallback(id => {
    if (jobId) _mref("jobPhotos/" + jobId + "/" + id).remove();
  }, [jobId]);
  const addComment = React.useCallback((text, user) => {
    if (!jobId || !text.trim()) return;
    const id = "C-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _mref("jobComments/" + jobId + "/" + id).set({
      id,
      jobId,
      userId: user && user.id || null,
      userName: user && user.name || "-",
      text: text.trim(),
      at: new Date().toISOString()
    });
  }, [jobId]);
  const removeComment = React.useCallback(id => {
    if (jobId) _mref("jobComments/" + jobId + "/" + id).remove();
  }, [jobId]);
  return {
    photos,
    comments,
    files,
    addPhoto,
    removePhoto,
    addComment,
    removeComment,
    addFile,
    removeFile
  };
}
function JobPhotos({
  media,
  currentUser,
  canManage
}) {
  const [busy, setBusy] = React.useState(false);
  const [lbIndex, setLbIndex] = React.useState(null);
  const fileRef = React.useRef(null);
  const touchX = React.useRef(null);
  const n = media.photos.length;
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        const url = await resizeImageFile(f);
        media.addPhoto(url, currentUser);
      }
    } catch (err) {
      alert("อัปโหลดรูปไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const canDelete = p => canManage || currentUser && p.by === currentUser.id;
  const prev = () => setLbIndex(i => (i - 1 + n) % n);
  const next = () => setLbIndex(i => (i + 1) % n);
  React.useEffect(() => {
    if (lbIndex === null) return;
    const onKey = e => {
      if (e.key === "ArrowLeft") prev();else if (e.key === "ArrowRight") next();else if (e.key === "Escape") setLbIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbIndex, n]);
  const cur = lbIndex !== null ? media.photos[lbIndex] : null;
  return React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19", n > 0 && " · " + n), React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 12.5,
      cursor: busy ? "default" : "pointer",
      opacity: busy ? 0.6 : 1
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--primary-dark)",
    sw: 2.4
  }), " ", busy ? "กำลังเพิ่ม..." : "เพิ่มรูป"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  })), n === 0 ? React.createElement("div", {
    onClick: () => fileRef.current && fileRef.current.click(),
    style: {
      padding: "22px 0",
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)",
      border: "1.5px dashed var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B \xB7 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19") : React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      paddingBottom: 4,
      margin: "0 -2px",
      paddingLeft: 2,
      paddingRight: 2
    }
  }, media.photos.map((p, idx) => React.createElement("div", {
    key: p.id,
    style: {
      position: "relative",
      width: 96,
      height: 96,
      flexShrink: 0,
      borderRadius: 10,
      overflow: "hidden",
      background: "var(--surface3)"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.caption || "รูปหน้างาน",
    onClick: () => setLbIndex(idx),
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      cursor: "pointer"
    }
  }), canDelete(p) && React.createElement("button", {
    onClick: () => {
      askConfirm({
        title: "ลบรูปนี้?",
        ok: "ลบรูป"
      }).then(ok => {
        if (ok) media.removePhoto(p.id);
      });
    },
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 6,
      border: "none",
      background: "rgba(8,20,14,.55)",
      color: "#fff",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 12,
    color: "#fff"
  }))))), cur && React.createElement("div", {
    onClick: () => setLbIndex(null),
    onTouchStart: e => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: e => {
      if (touchX.current == null || n < 2) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (dx > 45) prev();else if (dx < -45) next();
      touchX.current = null;
    },
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.9)",
      zIndex: 130,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, React.createElement("img", {
    src: cur.dataUrl,
    alt: cur.caption || "",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: "100%",
      maxHeight: "68vh",
      borderRadius: 10,
      objectFit: "contain"
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12
    }
  }, n > 1 && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 20
    }
  }, React.createElement("button", {
    onClick: prev,
    "aria-label": "\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    style: {
      width: 48,
      height: 48,
      borderRadius: 99,
      border: "none",
      background: "rgba(255,255,255,.18)",
      color: "#fff",
      fontSize: 28,
      lineHeight: 1,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, "\u2039"), React.createElement("span", {
    style: {
      color: "#fff",
      fontFamily: "var(--mono)",
      fontSize: 14,
      fontWeight: 600,
      minWidth: 52,
      textAlign: "center"
    }
  }, lbIndex + 1, " / ", n), React.createElement("button", {
    onClick: next,
    "aria-label": "\u0E16\u0E31\u0E14\u0E44\u0E1B",
    style: {
      width: 48,
      height: 48,
      borderRadius: 99,
      border: "none",
      background: "rgba(255,255,255,.18)",
      color: "#fff",
      fontSize: 28,
      lineHeight: 1,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, "\u203A")), React.createElement("div", {
    style: {
      color: "#fff",
      fontSize: 12.5,
      textAlign: "center",
      opacity: 0.85
    }
  }, cur.caption ? cur.caption + " · " : "", "\u0E42\u0E14\u0E22 ", cur.byName, " \xB7 ", thDateTime ? thDateTime(cur.at) : ""), React.createElement("button", {
    onClick: () => setLbIndex(null),
    style: {
      padding: "8px 20px",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,.4)",
      background: "transparent",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"))));
}
const FILE_KINDS = {
  design: {
    th: "แบบ",
    color: "var(--kind-design)",
    soft: "rgba(37,99,235,.10)"
  },
  boq: {
    th: "BOQ",
    color: "var(--kind-boq)",
    soft: "rgba(13,148,136,.10)"
  },
  other: {
    th: "เอกสาร",
    color: "var(--kind-other)",
    soft: "rgba(100,116,139,.12)"
  }
};
const MAX_FILE_MB = 8;
function fmtBytes(n) {
  if (!n) return "";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
function JobFiles({
  media,
  currentUser,
  canManage
}) {
  const [busy, setBusy] = React.useState(false);
  const pickKind = React.useRef("other");
  const fileRef = React.useRef(null);
  const files = media.files || [];
  const trigger = kind => {
    pickKind.current = kind;
    if (fileRef.current) fileRef.current.click();
  };
  const onPick = async e => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setBusy(true);
    try {
      for (const f of list) {
        const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
        if (!isPdf) {
          alert("รองรับเฉพาะไฟล์ PDF: " + f.name);
          continue;
        }
        if (f.size > MAX_FILE_MB * 1024 * 1024) {
          alert("ไฟล์ใหญ่เกิน " + MAX_FILE_MB + "MB — กรุณาบีบอัดก่อน: " + f.name);
          continue;
        }
        const url = await readFileAsDataURL(f);
        media.addFile(url, {
          kind: pickKind.current,
          name: f.name,
          size: f.size
        }, currentUser);
      }
    } catch (err) {
      alert("อัปโหลดไฟล์ไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const open = (f, download) => {
    try {
      const url = dataUrlToBlobUrl(f.dataUrl);
      if (download) {
        const a = document.createElement("a");
        a.href = url;
        a.download = f.name || "เอกสาร.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.open(url, "_blank", "noopener");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert("เปิดไฟล์ไม่สำเร็จ: " + err.message);
    }
  };
  const canDelete = f => canManage || currentUser && f.by === currentUser.id;
  const UpBtn = ({
    kind,
    label
  }) => {
    const k = FILE_KINDS[kind];
    return React.createElement("button", {
      onClick: () => trigger(kind),
      disabled: busy,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: 9,
        border: "1px solid " + k.color + "55",
        background: k.soft,
        color: k.color,
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize: 12.5,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1
      }
    }, React.createElement(Icon, {
      name: "plus",
      size: 14,
      color: k.color,
      sw: 2.4
    }), " ", label);
  };
  return React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E41\u0E19\u0E1A (PDF)", files.length > 0 && " · " + files.length), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(UpBtn, {
    kind: "design",
    label: busy ? "กำลังอัปโหลด..." : "แบบ"
  }), React.createElement(UpBtn, {
    kind: "boq",
    label: "BOQ"
  })), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "application/pdf,.pdf",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  })), files.length === 0 ? React.createElement("div", {
    onClick: () => trigger("other"),
    style: {
      padding: "20px 0",
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)",
      border: "1.5px dashed var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 \xB7 \u0E41\u0E15\u0E30\u0E1B\u0E38\u0E48\u0E21 \u201C\u0E41\u0E1A\u0E1A\u201D \u0E2B\u0E23\u0E37\u0E2D \u201CBOQ\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14 PDF") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, files.map(f => {
    const k = FILE_KINDS[f.kind] || FILE_KINDS.other;
    return React.createElement("div", {
      key: f.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 11
      }
    }, React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: k.soft,
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "file",
      size: 17,
      color: k.color
    })), React.createElement("button", {
      onClick: () => open(f, false),
      title: "\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39",
      style: {
        flex: 1,
        minWidth: 0,
        background: "none",
        border: "none",
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 2
      }
    }, React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: ".04em",
        color: k.color,
        background: k.soft,
        padding: "1px 6px",
        borderRadius: 5,
        flexShrink: 0
      }
    }, k.th), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, f.name)), React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, fmtBytes(f.size), f.size ? " · " : "", "\u0E42\u0E14\u0E22 ", f.byName, " \xB7 ", thDateTime ? thDateTime(f.at) : "")), React.createElement("button", {
      onClick: () => open(f, true),
      title: "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14",
      "aria-label": "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14",
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "download",
      size: 15,
      color: "var(--text-2)"
    })), canDelete(f) && React.createElement("button", {
      onClick: () => {
        askConfirm({
          title: "ลบเอกสารนี้?",
          body: f.name || "",
          ok: "ลบเอกสาร"
        }).then(ok => {
          if (ok) media.removeFile(f.id);
        });
      },
      title: "\u0E25\u0E1A",
      "aria-label": "\u0E25\u0E1A",
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 15,
      color: "var(--text-3)"
    })));
  })));
}
function JobComments({
  media,
  currentUser,
  canManage
}) {
  const [text, setText] = React.useState("");
  const send = () => {
    if (!text.trim()) return;
    media.addComment(text, currentUser);
    setText("");
  };
  const canDelete = c => canManage || currentUser && c.userId === currentUser.id;
  return React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "message",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E1E\u0E39\u0E14\u0E04\u0E38\u0E22 / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19", media.comments.length > 0 && " · " + media.comments.length), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 12
    }
  }, media.comments.length === 0 && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      textAlign: "center",
      padding: "12px 0"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \xB7 \u0E40\u0E23\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01/\u0E1E\u0E39\u0E14\u0E04\u0E38\u0E22\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"), media.comments.map(c => React.createElement("div", {
    key: c.id,
    style: {
      display: "flex",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 99,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontSize: 12
    }
  }, (c.userName || "?").slice(0, 1)), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, c.userName), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, thDateTime ? thDateTime(c.at) : ""), canDelete(c) && React.createElement("button", {
    onClick: () => {
      askConfirm({
        title: "ลบข้อความนี้?",
        ok: "ลบข้อความ"
      }).then(ok => {
        if (ok) media.removeComment(c.id);
      });
    },
    style: {
      marginLeft: "auto",
      background: "none",
      border: "none",
      color: "var(--text-3)",
      cursor: "pointer",
      fontSize: 11,
      padding: 0
    }
  }, "\u0E25\u0E1A")), React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      marginTop: 2,
      lineHeight: 1.5,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }
  }, c.text))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, React.createElement("textarea", {
    value: text,
    onChange: e => setText(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        send();
      }
    },
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E07\u0E32\u0E19...",
    rows: 1,
    style: {
      flex: 1,
      resize: "vertical",
      height: 44,
      minHeight: 44,
      boxSizing: "border-box",
      background: "var(--surface2)",
      border: "1px solid var(--border-strong)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13.5,
      lineHeight: 1.4,
      padding: "11px 12px",
      borderRadius: 11,
      outline: "none"
    }
  }), React.createElement("button", {
    onClick: send,
    disabled: !text.trim(),
    style: {
      flexShrink: 0,
      width: 44,
      height: 44,
      borderRadius: 11,
      border: "none",
      background: text.trim() ? "var(--primary)" : "var(--surface3)",
      cursor: text.trim() ? "pointer" : "default",
      display: "grid",
      placeItems: "center",
      transition: "background .15s"
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 18,
    color: text.trim() ? "#fff" : "var(--text-3)"
  }))));
}
Object.assign(window, {
  useJobMedia,
  resizeImageFile,
  readFileAsDataURL,
  dataUrlToBlobUrl,
  JobPhotos,
  JobFiles,
  JobComments
});