/* ============================================================
   SolarFlow / PHITHAN GREEN — Job media
   - รูปถ่ายหน้างาน (ย่อรูปแล้วเก็บ base64 ใน RTDB: jobPhotos/{jobId})
   - กล่องข้อความ / บันทึกงาน (jobComments/{jobId})
   โหลดเฉพาะงานที่เปิด drawer เพื่อไม่ให้ job list ช้า
   ============================================================ */

const _MFB   = () => !!window.FBDB;
const _mref  = (p) => window.FBDB.ref(p);
const _msnap = (s) => { const v = s.val(); if (!v || typeof v !== "object") return []; return Object.values(v); };

/* ย่อไฟล์รูป → JPEG dataURL (กว้าง/สูงสุด ~1000px, คุณภาพ 0.72)
   ลดขนาดก่อนเก็บลง DB เพื่อไม่ให้ฐานข้อมูลบวม */
function resizeImageFile(file, maxDim, quality) {
  maxDim = maxDim || 1000; quality = quality || 0.72;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        try { resolve(canvas.toDataURL("image/jpeg", quality)); } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* hook: โหลดรูป + คอมเมนต์ของงานที่เปิดอยู่ */
function useJobMedia(jobId) {
  const [photos, setPhotos] = React.useState([]);
  const [comments, setComments] = React.useState([]);

  React.useEffect(() => {
    if (!jobId || !_MFB()) { setPhotos([]); setComments([]); return; }
    const pRef = _mref("jobPhotos/" + jobId);
    const cRef = _mref("jobComments/" + jobId);
    const ph = pRef.on("value", (s) => { const a = _msnap(s); a.sort((x, y) => (x.at || "").localeCompare(y.at || "")); setPhotos(a); });
    const ch = cRef.on("value", (s) => { const a = _msnap(s); a.sort((x, y) => (x.at || "").localeCompare(y.at || "")); setComments(a); });
    return () => { pRef.off("value", ph); cRef.off("value", ch); };
  }, [jobId]);

  const addPhoto = React.useCallback((dataUrl, user, caption) => {
    if (!jobId) return;
    const id = "P-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _mref("jobPhotos/" + jobId + "/" + id).set({
      id, jobId, dataUrl, by: (user && user.id) || null, byName: (user && user.name) || "-",
      caption: caption || "", at: new Date().toISOString(),
    });
  }, [jobId]);

  const removePhoto = React.useCallback((id) => { if (jobId) _mref("jobPhotos/" + jobId + "/" + id).remove(); }, [jobId]);

  const addComment = React.useCallback((text, user) => {
    if (!jobId || !text.trim()) return;
    const id = "C-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _mref("jobComments/" + jobId + "/" + id).set({
      id, jobId, userId: (user && user.id) || null, userName: (user && user.name) || "-",
      text: text.trim(), at: new Date().toISOString(),
    });
  }, [jobId]);

  const removeComment = React.useCallback((id) => { if (jobId) _mref("jobComments/" + jobId + "/" + id).remove(); }, [jobId]);

  return { photos, comments, addPhoto, removePhoto, addComment, removeComment };
}

/* ── รูปหน้างาน — แถวเดียวเลื่อนแนวนอน + ดูรูปใหญ่ (เลื่อน/ปัดดูได้) ── */
function JobPhotos({ media, currentUser, canManage }) {
  const [busy, setBusy] = React.useState(false);
  const [lbIndex, setLbIndex] = React.useState(null); // ดัชนีรูปที่กำลังดูใหญ่ (null = ปิด)
  const fileRef = React.useRef(null);
  const touchX = React.useRef(null);
  const n = media.photos.length;

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        const url = await resizeImageFile(f);
        media.addPhoto(url, currentUser);
      }
    } catch (err) { alert("อัปโหลดรูปไม่สำเร็จ: " + err.message); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canDelete = (p) => canManage || (currentUser && p.by === currentUser.id);
  const prev = () => setLbIndex((i) => (i - 1 + n) % n);
  const next = () => setLbIndex((i) => (i + 1) % n);

  // ลูกศรคีย์บอร์ด / Esc เมื่อเปิดดูรูปใหญ่
  React.useEffect(() => {
    if (lbIndex === null) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setLbIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lbIndex, n]);

  const cur = lbIndex !== null ? media.photos[lbIndex] : null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="image" size={14} color="var(--text-2)" /> รูปหน้างาน{n > 0 && " · " + n}
        </span>
        <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
            border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)",
            fontWeight: 600, fontFamily: "inherit", fontSize: 12.5, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          <Icon name="plus" size={14} color="var(--primary-dark)" sw={2.4} /> {busy ? "กำลังเพิ่ม..." : "เพิ่มรูป"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
      </div>

      {n === 0 ? (
        <div onClick={() => fileRef.current && fileRef.current.click()}
          style={{ padding: "22px 0", textAlign: "center", fontSize: 12.5, color: "var(--text-3)",
            border: "1.5px dashed var(--border-strong)", borderRadius: 12, cursor: "pointer" }}>
          ยังไม่มีรูป · แตะเพื่อเพิ่มรูปหน้างาน
        </div>
      ) : (
        // แถวเดียว เลื่อนแนวนอน
        <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4, margin: "0 -2px", paddingLeft: 2, paddingRight: 2 }}>
          {media.photos.map((p, idx) => (
            <div key={p.id} style={{ position: "relative", width: 96, height: 96, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "var(--surface3)" }}>
              <img src={p.dataUrl} alt={p.caption || "รูปหน้างาน"} onClick={() => setLbIndex(idx)}
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
              {canDelete(p) && (
                <button onClick={() => { if (confirm("ลบรูปนี้?")) media.removePhoto(p.id); }} title="ลบรูป"
                  style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 6, border: "none",
                    background: "rgba(8,20,14,.55)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="x" size={12} color="#fff" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {cur && (
        <div onClick={() => setLbIndex(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { if (touchX.current == null || n < 2) return; const dx = e.changedTouches[0].clientX - touchX.current; if (dx > 45) prev(); else if (dx < -45) next(); touchX.current = null; }}
          style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.9)", zIndex: 130,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <img src={cur.dataUrl} alt={cur.caption || ""} onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "68vh", borderRadius: 10, objectFit: "contain" }} />

          {/* ปุ่มควบคุมด้านล่าง: ก่อนหน้า · ตำแหน่ง · ถัดไป */}
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {n > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <button onClick={prev} aria-label="ก่อนหน้า"
                  style={{ width: 48, height: 48, borderRadius: 99, border: "none", background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 28, lineHeight: 1, cursor: "pointer", display: "grid", placeItems: "center" }}>‹</button>
                <span style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, minWidth: 52, textAlign: "center" }}>{lbIndex + 1} / {n}</span>
                <button onClick={next} aria-label="ถัดไป"
                  style={{ width: 48, height: 48, borderRadius: 99, border: "none", background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 28, lineHeight: 1, cursor: "pointer", display: "grid", placeItems: "center" }}>›</button>
              </div>
            )}
            <div style={{ color: "#fff", fontSize: 12.5, textAlign: "center", opacity: 0.85 }}>
              {cur.caption ? cur.caption + " · " : ""}โดย {cur.byName} · {thDateTime ? thDateTime(cur.at) : ""}
            </div>
            <button onClick={() => setLbIndex(null)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,.4)",
              background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── พูดคุย / บันทึกงาน ── */
function JobComments({ media, currentUser, canManage }) {
  const [text, setText] = React.useState("");
  const send = () => { if (!text.trim()) return; media.addComment(text, currentUser); setText(""); };
  const canDelete = (c) => canManage || (currentUser && c.userId === currentUser.id);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="message" size={14} color="var(--text-2)" /> พูดคุย / บันทึกงาน{media.comments.length > 0 && " · " + media.comments.length}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {media.comments.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", padding: "12px 0" }}>ยังไม่มีข้อความ · เริ่มบันทึก/พูดคุยได้เลย</div>
        )}
        {media.comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
              background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 12 }}>{(c.userName || "?").slice(0, 1)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{c.userName}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{thDateTime ? thDateTime(c.at) : ""}</span>
                {canDelete(c) && (
                  <button onClick={() => { if (confirm("ลบข้อความนี้?")) media.removeComment(c.id); }}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 11, padding: 0 }}>ลบ</button>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); } }}
          placeholder="พิมพ์ข้อความ / บันทึกงาน... (Ctrl+Enter เพื่อส่ง)" rows={1}
          style={{ flex: 1, resize: "vertical", height: 44, minHeight: 44, boxSizing: "border-box", background: "var(--surface2)", border: "1px solid var(--border-strong)",
            color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.4, padding: "11px 12px", borderRadius: 11, outline: "none" }} />
        <button onClick={send} disabled={!text.trim()}
          style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 11, border: "none",
            background: text.trim() ? "var(--primary)" : "var(--text-3)", color: "#fff", cursor: text.trim() ? "pointer" : "default",
            display: "grid", placeItems: "center", transition: "background .15s" }}>
          <Icon name="arrowRight" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { useJobMedia, resizeImageFile, JobPhotos, JobComments });
