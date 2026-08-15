/* ============================================================
   SolarFlow — cloud store (Firebase Realtime DB + localStorage fallback)

   - ถ้า FBDB พร้อม (firebase-config.js ตั้งค่าครบ) → ใช้ Firebase
     ข้อมูล real-time, ทุก browser เห็นพร้อมกัน
   - ถ้า FBDB เป็น null → ใช้ localStorage (โหมด offline)
     ข้อมูลอยู่เครื่องเดียว ทำงานได้โดยไม่ต้องเน็ต
   ============================================================ */

const _FB = () => !!window.FBDB;
const _fbr  = (path)        => window.FBDB.ref(path);
const _fbGet = (path)       => window.FBDB.ref(path).once("value");
const _fbSet = (path, val)  => window.FBDB.ref(path).set(val);
const _fbUpd = (path, val)  => window.FBDB.ref(path).update(val);
const _fbRem = (path)       => window.FBDB.ref(path).remove();
const _fbTx  = (path, fn)   => window.FBDB.ref(path).transaction(fn);

/** Convert Firebase snapshot object → plain array, or null if empty */
function _snap2arr(snapshot) {
  const v = snapshot.val();
  if (!v || typeof v !== "object") return null;
  return Object.values(v);
}

/** localStorage helpers (unchanged from original) */
const SF_STORE_KEY = "solarflow_db_v2";
const SF_STOCK_KEY = "solarflow_stock_v2";
const SF_MOVES_KEY = "solarflow_moves_v2";
const SF_STOCKCAT_KEY = "solarflow_stockcats_v1";
const SF_STOCKIMG_KEY = "solarflow_stockimg_v1";
const SF_STOCKDOC_KEY = "solarflow_stockdoc_v1";
const SF_TECH_KEY  = "solarflow_techs_v1";
const SF_BRAND_KEY = "solarflow_brands_v1";

function _lsGet(key, seed) {
  try {
    const s = localStorage.getItem(key);
    if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a; }
  } catch (e) {}
  return seed.map((x) => Object.assign({}, x));
}
function _lsGetRaw(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function _lsSetRaw(key, data) { try { if (data) localStorage.setItem(key, JSON.stringify(data)); else localStorage.removeItem(key); } catch (e) {} }
function _lsSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

/** Arr → Firebase object keyed by item.id */
function _toObj(arr) { return Object.fromEntries(arr.map((x) => [x.id, x])); }

/* ================================================================
   Job helpers (unchanged from original)
   ================================================================ */

function nextCode(raw) {
  let max = 2400;
  raw.forEach((j) => {
    const n = parseInt((j.code || "").replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return "SF-" + (max + 1);
}

function blankJob(raw) {
  const code = nextCode(raw);
  return {
    id: code, code, name: "", phone: "", type: "home",
    address: "", province: "กรุงเทพฯ",
    gps: [0.5 + (Math.random() - 0.5) * 0.2, 0.45 + (Math.random() - 0.5) * 0.2],
    map: "", trello: "", contractor: "", laborCost: null, brand: "ATMOCE", kw: 5, panels: 9, phase: "1",
    battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false, comboType: "ready",
    stage: "design", startDate: window.SF.TODAY, deadline: window.SF.TODAY, tech: "t1", problem: null,
    mat: { panel: "none", inverter: "none", structure: "none", wiring: "none",
           battery: "none", backup: "none", birdnet: "none" },
    hist: window.SF.STAGES.map((s, i) => ({
      key: s.key, status: i === 0 ? "current" : "pending",
      date: i === 0 ? window.SF.TODAY : null,
      at: i === 0 ? new Date().toISOString() : null,
      recorded: i === 0, blocked: false,
    })),
    note: "",
  };
}

/* ================================================================
   useJobStore
   ================================================================ */
function useJobStore() {
  const SF_SEED = () => window.SF.SEED.map((j) => Object.assign({}, j));

  const [raw, setRaw]       = React.useState(_FB() ? null : () => _lsGet(SF_STORE_KEY, SF_SEED()));
  const [loading, setLoading] = React.useState(_FB());
  const rawRef = React.useRef(raw);
  React.useEffect(() => { rawRef.current = raw; }, [raw]);

  /* ---------- Firebase real-time listener ---------- */
  React.useEffect(() => {
    if (!_FB()) return;
    const ref = _fbr("jobs");
    // seed ตัวอย่างเฉพาะครั้งแรกจริง — ตรวจครั้งเดียวตอนเริ่ม (แยกจาก realtime listener)
    // เพื่อให้ "ลบหมดแล้วไม่เด้งกลับ"
    ref.once("value").then((snap) => {
      if (!_snap2arr(snap)) {
        _fbGet("meta/jobsSeeded").then((m) => {
          if (!m.val()) { _fbSet("meta/jobsSeeded", true); ref.set(_toObj(SF_SEED())); }
        });
      } else { _fbSet("meta/jobsSeeded", true); }
    });
    // realtime listener — อัปเดต state อย่างเดียว ไม่ seed
    const handler = ref.on("value", (snap) => {
      setRaw(_snap2arr(snap) || []);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", handler);
  }, []);

  /* ---------- localStorage sync (offline mode only) ---------- */
  React.useEffect(() => {
    if (!_FB() && raw !== null) _lsSet(SF_STORE_KEY, raw);
  }, [raw]);

  /* ---------- derived jobs ----------
     งานที่ถูกลบจะไม่หายจากฐานทันที แต่ติดธง deleted ไว้ (ถังขยะ) — เผลอกดลบแล้วกู้คืนได้
     ทุกหน้าจออ่านจาก jobs เหมือนเดิม จึงไม่เห็นงานในถังขยะ ส่วนรหัสงานเดิมก็ไม่ถูกนำไปใช้ซ้ำ */
  const jobs = React.useMemo(() => (raw || []).filter((j) => !j.deleted).map(window.SF.deriveJob), [raw]);
  const trash = React.useMemo(() => (raw || []).filter((j) => j.deleted)
    .sort((a, b) => String(b.deletedAt || "").localeCompare(String(a.deletedAt || ""))), [raw]);

  /* ---------- mutations ---------- */
  const upsert = React.useCallback((rec) => {
    if (_FB()) {
      _fbSet("jobs/" + rec.id, rec);
    } else {
      setRaw((prev) => {
        const i = prev.findIndex((j) => j.id === rec.id);
        if (i === -1) return [Object.assign({}, rec), ...prev];
        const copy = prev.slice();
        copy[i] = Object.assign({}, prev[i], rec);
        return copy;
      });
    }
  }, []);

  const patch = React.useCallback((id, fields) => {
    if (_FB()) {
      _fbUpd("jobs/" + id, fields);
    } else {
      setRaw((prev) => prev.map((j) => j.id === id ? Object.assign({}, j, fields) : j));
    }
  }, []);

  /* ลบ = ย้ายเข้าถังขยะ (ยังอยู่ในฐาน แต่ไม่แสดงที่ไหน) · by = ชื่อคนที่กดลบ ไว้ดูย้อนหลัง */
  const remove = React.useCallback((id, by) => {
    const fields = { deleted: true, deletedAt: new Date().toISOString(), deletedBy: by || "" };
    if (_FB()) _fbUpd("jobs/" + id, fields);
    else setRaw((prev) => prev.map((j) => j.id === id ? Object.assign({}, j, fields) : j));
  }, []);

  const restore = React.useCallback((id) => {
    const fields = { deleted: null, deletedAt: null, deletedBy: null };
    if (_FB()) _fbUpd("jobs/" + id, fields);
    else setRaw((prev) => prev.map((j) => j.id === id ? Object.assign({}, j, { deleted: false }) : j));
  }, []);

  /* ลบถาวร — ออกจากฐานจริง กู้คืนไม่ได้ (หน้าจอกั้นด้วยรหัสผ่านก่อนเรียกตัวนี้) */
  const purge = React.useCallback((id) => {
    if (_FB()) _fbRem("jobs/" + id);
    else setRaw((prev) => prev.filter((j) => j.id !== id));
  }, []);

  /* เปลี่ยนงานไปยัง stage ใดก็ได้ (เลื่อนหน้า/ถอยหลัง/ข้ามขั้น) แล้วบันทึกเวลาจริง
     ใช้ร่วมกันทั้ง: drag การ์ดในบอร์ด, dropdown ในตาราง, และปุ่มเลื่อนขั้นใน drawer */
  const setStage = React.useCallback((id, targetKey) => {
    const job = (rawRef.current || []).find((j) => j.id === id);
    if (!job) return;
    const stages    = window.SF.STAGES;
    const targetIdx = window.SF.STAGE_INDEX[targetKey];
    if (targetIdx == null || job.stage === targetKey) return; // ไม่เปลี่ยน → ไม่ทำอะไร
    const curIdx = window.SF.STAGE_INDEX[job.stage];
    const now    = new Date();
    const today  = window.SF.TODAY;             // วันที่จริง (YYYY-MM-DD)
    const at     = now.toISOString();           // เวลาจริงเต็ม (วัน + เวลา)

    const prevHist = job.hist || stages.map((s, i) => ({
      key: s.key, status: i < curIdx ? "done" : i === curIdx ? "current" : "pending",
      date: i <= curIdx ? today : null, at: null, recorded: false, blocked: false,
    }));
    const newHist = stages.map((s, i) => {
      const h = prevHist[i] || { key: s.key };
      if (i < targetIdx) {
        // ขั้นก่อนหน้า target = เสร็จแล้ว · คงเวลาเดิมที่เคยบันทึกไว้
        // ขั้นที่ "ข้าม" (ไม่เคยทำจริง) จะไม่ใส่เวลาปลอม — ปล่อยว่างไว้
        return { ...h, key: s.key, status: "done", date: h.date || null, at: h.at || null, recorded: !!h.at, blocked: false };
      }
      if (i === targetIdx) {
        // ขั้นปัจจุบันใหม่ · ถ้าเคยมาขั้นนี้แล้ว = คงเวลาเดิม (ความจำเก่า ไม่เขียนทับ)
        // ถ้ายังไม่เคยมา = บันทึกเวลาจริงตอนนี้
        const seen = !!h.at;
        return { ...h, key: s.key, status: "current", date: seen ? h.date : today, at: seen ? h.at : at, recorded: true, blocked: false };
      }
      // ขั้นถัดไป = ยังไม่ถึง · เก็บเวลาเดิมไว้เป็นความจำ (ไม่ลบ) เปลี่ยนแค่สถานะ
      return { ...h, key: s.key, status: "pending", recorded: false, blocked: false };
    });

    patch(id, { stage: targetKey, problem: targetKey === "done" ? null : (job.problem || null), hist: newHist });
  }, [patch]);

  // เลื่อนขั้นถัดไป (ปุ่มใน drawer) — ใช้ logic เดียวกับ setStage
  const advance = React.useCallback((id) => {
    const job = (rawRef.current || []).find((j) => j.id === id);
    if (!job) return;
    const idx     = window.SF.STAGE_INDEX[job.stage];
    const nextIdx = Math.min(idx + 1, window.SF.STAGES.length - 1);
    setStage(id, window.SF.STAGES[nextIdx].key);
  }, [setStage]);

  const setMat = React.useCallback((id, matKey, status) => {
    if (_FB()) {
      _fbSet("jobs/" + id + "/mat/" + matKey, status);
    } else {
      setRaw((prev) => prev.map((j) =>
        j.id === id ? Object.assign({}, j, { mat: Object.assign({}, j.mat, { [matKey]: status }) }) : j
      ));
    }
  }, []);

  const resetDB = React.useCallback(() => {
    const seed = SF_SEED();
    if (_FB()) {
      _fbr("jobs").set(_toObj(seed));
    } else {
      setRaw(seed);
    }
  }, []);

  return {
    raw: raw || [], jobs, trash, loading,
    upsert, patch, remove, restore, purge, advance, setStage, setMat, resetDB,
    blank: () => blankJob(rawRef.current || []),
  };
}

/* ================================================================
   Stock helpers
   ================================================================ */
function blankItem(items) {
  let max = 0;
  items.forEach((it) => {
    const n = parseInt((it.id || "").replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  /* brand/model — ของชิ้นเดียวกันมีหลายยี่ห้อ/หลายรุ่น ราคาไม่เท่ากัน
     ชื่อ (name) ยังเป็นตัวจับคู่กับใบถอดของ · brand+model เป็นตัวแยกว่าเป็นของตัวไหน */
  return { id: "IV-" + String(max + 1).padStart(2, "0"), sku: "", name: "", brand: "", model: "", desc: "", aka: [], cat: "panel", unit: "ชิ้น", qty: 0, min: 0, loc: "", price: 0 };
}

/* ================================================================
   useStockStore
   ================================================================ */
function useStockStore() {
  const ISEED = () => window.SF.INVENTORY_SEED.map((x) => Object.assign({}, x));
  const MSEED = () => window.SF.MOVES_SEED.map((x) => Object.assign({}, x));

  const [items, setItems]     = React.useState(_FB() ? null : () => _lsGet(SF_STOCK_KEY, ISEED()));
  const [moves, setMoves]     = React.useState(_FB() ? null : () => _lsGet(SF_MOVES_KEY, MSEED()));
  const [cats, setCats]       = React.useState(() => _lsGet(SF_STOCKCAT_KEY, []));   // หมวดที่ผู้ใช้สร้างเอง
  const [loading, setLoading] = React.useState(_FB());

  const itemsRef = React.useRef(items);
  const movesRef = React.useRef(moves);
  const catsRef  = React.useRef(cats);
  React.useEffect(() => { itemsRef.current = items; }, [items]);
  React.useEffect(() => { movesRef.current = moves; }, [moves]);
  React.useEffect(() => { catsRef.current = cats; }, [cats]);

  /* ---------- Firebase listeners ---------- */
  React.useEffect(() => {
    if (!_FB()) return;
    let iDone = false, mDone = false;
    const done = () => { if (iDone && mDone) setLoading(false); };

    const iRef = _fbr("stock");
    // seed ครั้งเดียวตอนเริ่ม (แยกจาก listener) — ลบหมดแล้วไม่เด้งกลับ
    iRef.once("value").then((snap) => {
      if (!_snap2arr(snap)) {
        _fbGet("meta/stockSeeded").then((m) => {
          if (!m.val()) { _fbSet("meta/stockSeeded", true); iRef.set(_toObj(ISEED())); }
        });
      } else { _fbSet("meta/stockSeeded", true); }
    });
    const iH = iRef.on("value", (snap) => {
      setItems(_snap2arr(snap) || []); iDone = true; done();
    }, () => { iDone = true; done(); });

    const mRef = _fbr("moves");
    mRef.once("value").then((snap) => {
      if (!_snap2arr(snap)) {
        _fbGet("meta/movesSeeded").then((m) => {
          if (!m.val()) { _fbSet("meta/movesSeeded", true); mRef.set(_toObj(MSEED())); }
        });
      } else { _fbSet("meta/movesSeeded", true); }
    });
    const mH = mRef.on("value", (snap) => {
      const arr = _snap2arr(snap) || [];
      // เรียงใหม่ล่าสุดก่อน (id เป็น MV-ตัวเลข)
      arr.sort((a, b) => {
        const na = parseInt((a.id || "").replace(/\D/g, ""), 10);
        const nb = parseInt((b.id || "").replace(/\D/g, ""), 10);
        return nb - na;
      });
      setMoves(arr); mDone = true; done();
    }, () => { mDone = true; done(); });

    const cRef = _fbr("stockCats");
    const cH = cRef.on("value", (snap) => { setCats(_snap2arr(snap) || []); }, () => {});

    return () => { iRef.off("value", iH); mRef.off("value", mH); cRef.off("value", cH); };
  }, []);

  /* หมวดที่ผู้ใช้สร้างเอง — ต่อท้ายหมวดมาตรฐาน ใช้ได้ทุกที่ที่มีตัวเลือกหมวด */
  /* parent ว่าง = หมวดหลัก · ใส่คีย์หมวดหลัก = หมวดย่อยของหมวดนั้น
     คืนคีย์ที่ได้ (หรือคีย์ของหมวดชื่อซ้ำที่มีอยู่แล้ว) ให้เอาไปเลือกต่อได้เลย */
  const addCat = React.useCallback((th, parent) => {
    const name = String(th || "").trim();
    const par = String(parent || "").trim();
    if (!name) return "";
    const cur = catsRef.current || [];
    const dup = cur.find((c) => c.th === name && (c.parent || "") === par);
    if (dup) return dup.key;
    // ชื่อชนหมวดมาตรฐาน (เฉพาะตอนสร้างหมวดหลัก) → ใช้ตัวที่มีอยู่ ไม่สร้างซ้ำ
    if (!par) { const std = (window.SF.STOCK_CATS || []).find((c) => c.th === name && !c.custom); if (std) return std.key; }
    const COLORS = ["#0891B2", "#DB2777", "#65A30D", "#C026D3", "#EA580C", "#0D9488", "#6366F1", "#B45309"];
    const pre = par ? "sub" : "cus";
    let n = 1, key;
    do { key = pre + n; n += 1; } while (cur.some((c) => c.key === key));
    const rec = { key: key, th: name, color: COLORS[cur.length % COLORS.length], icon: "box", custom: true };
    if (par) rec.parent = par;
    if (_FB()) _fbSet("stockCats/" + key, rec); else setCats((p) => p.concat([rec]));
    return key;
  }, []);

  // ลบหมวดหลัก = ลบหมวดย่อยใต้มันด้วย ไม่ให้เหลือหมวดย่อยที่ไม่มีแม่
  const removeCat = React.useCallback((key) => {
    const kids = (catsRef.current || []).filter((c) => c.parent === key).map((c) => c.key);
    [key].concat(kids).forEach((k) => { if (_FB()) _fbRem("stockCats/" + k); });
    if (!_FB()) setCats((p) => p.filter((c) => c.key !== key && c.parent !== key));
  }, []);

  /* ---------- localStorage sync ---------- */
  React.useEffect(() => { if (!_FB() && items !== null) _lsSet(SF_STOCK_KEY, items); }, [items]);
  React.useEffect(() => { if (!_FB() && moves !== null) _lsSet(SF_MOVES_KEY, moves); }, [moves]);
  React.useEffect(() => { if (!_FB()) _lsSet(SF_STOCKCAT_KEY, cats || []); }, [cats]);
  /* ลงทะเบียนหมวดที่สร้างเองเข้า SF.STOCK_CATS ให้ทุกหน้าที่มีตัวเลือกหมวดเห็นพร้อมกัน
     ต้องทำตอน render ไม่ใช่ใน effect — effect ทำงานหลัง render รอบที่ cats เปลี่ยนไปแล้ว
     หน้าจอจะยังวาดด้วยหมวดชุดเก่า แล้วไม่มีอะไรมากระตุ้นให้วาดใหม่ หมวดที่เพิ่งสร้างเลยไม่โผล่ */
  React.useMemo(() => { if (window.SF.setCustomCats) window.SF.setCustomCats(cats || []); }, [cats]);

  /* ---------- mutations ---------- */
  /* เปลี่ยนชื่อของในคลัง = ใบถอดของที่ทำไว้แล้วจะหาราคาไม่เจอ (มันจับคู่ด้วยชื่อ)
     จึงเก็บชื่อเดิมไว้ใน aka ให้จับคู่ได้ทั้งชื่อเก่าและชื่อใหม่ ของเก่าไม่พัง */
  const withAka = (rec) => {
    const prev = (itemsRef.current || []).find((x) => x.id === rec.id);
    if (!prev || !prev.name || !rec.name || prev.name === rec.name) return rec;
    const aka = (rec.aka || prev.aka || []).slice();
    if (aka.indexOf(prev.name) < 0) aka.push(prev.name);
    return Object.assign({}, rec, { aka: aka.filter((n) => n && n !== rec.name) });
  };

  const upsertItem = React.useCallback((rec0) => {
    const rec = withAka(rec0);
    if (_FB()) {
      _fbSet("stock/" + rec.id, rec);
    } else {
      setItems((prev) => {
        const i = prev.findIndex((x) => x.id === rec.id);
        if (i === -1) return [Object.assign({}, rec), ...prev];
        const copy = prev.slice(); copy[i] = Object.assign({}, prev[i], rec); return copy;
      });
    }
  }, []);

  /* ── รูปสินค้า ──
     เก็บแยกโหนด stockImg/{id} ไม่ปนกับ stock — รายการของ 300+ ชิ้นถูกโหลดทุกครั้งที่เปิดแอป
     ถ้าเอา base64 ไปแปะไว้ในนั้นด้วย ทั้งแอปจะอืดทันที
     โหลดรูปเฉพาะตอนเปิดหน้าคลัง (เรียก enableImages) */
  const [imgs, setImgs] = React.useState(() => (_FB() ? {} : _lsGet(SF_STOCKIMG_KEY, {})));
  const [imgOn, setImgOn] = React.useState(false);
  const enableImages = React.useCallback(() => setImgOn(true), []);
  React.useEffect(() => {
    if (!imgOn || !_FB()) return;
    const r = _fbr("stockImg");
    const h = r.on("value", (snap) => setImgs(snap.val() || {}), () => {});
    return () => r.off("value", h);
  }, [imgOn]);
  React.useEffect(() => { if (!_FB()) _lsSet(SF_STOCKIMG_KEY, imgs || {}); }, [imgs]);

  const setImage = React.useCallback((id, dataUrl) => {
    if (!id) return;
    const v = dataUrl || "";
    if (_FB()) { if (v) _fbSet("stockImg/" + id, v); else _fbRem("stockImg/" + id); }
    // อัปเดตในเครื่องทันทีด้วย ไม่ต้องรอ listener เด้งกลับ — เลือกรูปแล้วเห็นเลย
    setImgs((p) => { const m = Object.assign({}, p); if (v) m[id] = v; else delete m[id]; return m; });
    // ธง img บนตัวรายการ — ใช้บอกว่ามีรูปโดยไม่ต้องโหลดรูปจริง
    const it = (itemsRef.current || []).find((x) => x.id === id);
    if (it && !!it.img !== !!v) upsertItem(Object.assign({}, it, { img: !!v }));
  }, []);

  /* ── เอกสาร / DATA SHEET ──
     ไฟล์ PDF ใหญ่กว่ารูปมาก จึงไม่โหลดยกโช่ง—ดึงทีละใบตอนกดเปิดดู
     ชื่อ/ขนาดเก็บไว้ที่ตัวรายการ (doc) จึงรู้ได้ว่ามีเอกสารโดยไม่ต้องโหลด */
  const DOC_MAX = 6 * 1024 * 1024;   // กันไฟล์ใหญ่เกินจน RTDB รับไม่ไหว
  const [docCache, setDocCache] = React.useState({});
  const loadDoc = React.useCallback((id) => {
    if (!id) return Promise.resolve(null);
    if (docCache[id] !== undefined) return Promise.resolve(docCache[id]);
    if (!_FB()) { const v = _lsGetRaw(SF_STOCKDOC_KEY + "_" + id); setDocCache((p) => Object.assign({}, p, { [id]: v })); return Promise.resolve(v); }
    return _fbGet("stockDoc/" + id).then((sn) => {
      const v = sn.val() || null;
      setDocCache((p) => Object.assign({}, p, { [id]: v }));
      return v;
    }).catch(() => null);
  }, [docCache]);

  const setDoc = React.useCallback((id, doc) => {
    if (!id) return;
    if (doc && doc.data && doc.data.length > DOC_MAX) { alert("ไฟล์ใหญ่เกิน 6 MB — ลดขนาดไฟล์ก่อนอัป"); return; }
    if (_FB()) { if (doc) _fbSet("stockDoc/" + id, doc); else _fbRem("stockDoc/" + id); }
    else _lsSetRaw(SF_STOCKDOC_KEY + "_" + id, doc);
    setDocCache((p) => Object.assign({}, p, { [id]: doc || null }));
    const it = (itemsRef.current || []).find((x) => x.id === id);
    if (it) {
      const meta = doc ? { name: doc.name || "datasheet.pdf", size: doc.size || 0 } : null;
      const cur = it.doc || null;
      if (JSON.stringify(cur) !== JSON.stringify(meta)) {
        const rec = Object.assign({}, it);
        if (meta) rec.doc = meta; else delete rec.doc;
        upsertItem(rec);
        if (!meta && _FB()) _fbRem("stock/" + id + "/doc");   // set() ไม่ลบคีย์ที่หายไปให้เอง
      }
    }
  }, []);

  /* ผูกชื่อที่ใบถอดของเรียก เข้ากับของในคลังชิ้นนี้ — แก้ครั้งเดียว ใช้ได้ทุกงาน */
  const linkAlias = React.useCallback((id, boqName) => {
    const nm = String(boqName || "").trim();
    const it = (itemsRef.current || []).find((x) => x.id === id);
    if (!nm || !it || nm === it.name) return;
    const aka = (it.aka || []).slice();
    if (aka.indexOf(nm) >= 0) return;
    aka.push(nm);
    upsertItem(Object.assign({}, it, { aka: aka }));
  }, [upsertItem]);

  const unlinkAlias = React.useCallback((id, boqName) => {
    const it = (itemsRef.current || []).find((x) => x.id === id);
    if (!it) return;
    upsertItem(Object.assign({}, it, { aka: (it.aka || []).filter((n) => n !== boqName) }));
  }, [upsertItem]);

  const removeItem = React.useCallback((id) => {
    if (_FB()) { _fbRem("stock/" + id); }
    else { setItems((prev) => prev.filter((x) => x.id !== id)); }
  }, []);

  const move = React.useCallback((itemId, type, qty, ref, note, by, jobId) => {
    qty = Math.abs(parseInt(qty) || 0);
    if (!qty) return;

    const currentMoves = movesRef.current || [];
    let maxN = 1000;
    currentMoves.forEach((m) => {
      const n = parseInt((m.id || "").replace(/\D/g, ""), 10);
      if (n > maxN) maxN = n;
    });
    const mvId = "MV-" + (maxN + 1);
    const mv   = { id: mvId, itemId, type, qty, date: window.SF.TODAY, ref: ref || "-", note: note || "", by: by || "-", jobId: jobId || "" };

    // "in" (รับเข้า) และ "return" (คืนของ) เพิ่มสต็อก, "out" (เบิกออก) ลดสต็อก
    const adds = (type === "in" || type === "return");
    if (_FB()) {
      // atomic qty update via transaction
      _fbTx("stock/" + itemId + "/qty", (cur) =>
        Math.max(0, (cur || 0) + (adds ? qty : -qty))
      );
      _fbSet("moves/" + mvId, mv);
    } else {
      setItems((prev) => prev.map((x) =>
        x.id === itemId ? Object.assign({}, x, { qty: Math.max(0, x.qty + (adds ? qty : -qty)) }) : x
      ));
      setMoves((prev) => [mv, ...prev]);
    }
  }, []);

  const resetStock = React.useCallback(() => {
    const iseed = ISEED();
    const mseed = MSEED();
    if (_FB()) {
      _fbr("stock").set(_toObj(iseed));
      _fbr("moves").set(_toObj(mseed));
    } else {
      setItems(iseed);
      setMoves(mseed);
    }
  }, []);

  return {
    items: items || [], moves: moves || [], cats: cats || [], imgs: imgs || {}, loading,
    upsertItem, removeItem, move, resetStock, linkAlias, unlinkAlias, addCat, removeCat, setImage, enableImages,
    loadDoc, setDoc,
    blankItem: () => blankItem(itemsRef.current || []),
  };
}

/* ================================================================
   useTechStore
   ================================================================ */
const TECH_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#7C5CFC", "#EF4444", "#14B8A6", "#EC4899", "#0EA5E9"];
const TECH_SEED   = window.SF.TECHS.map((t) => Object.assign({}, t));

function blankTech(techs) {
  let max = 0;
  techs.forEach((t) => { const n = parseInt((t.id || "").replace(/\D/g, ""), 10); if (!isNaN(n) && n > max) max = n; });
  return { id: "t" + (max + 1), name: "", nick: "", role: "ช่างติดตั้ง", color: TECH_COLORS[techs.length % TECH_COLORS.length] };
}

function syncTechGlobals(techs) {
  window.SF.TECHS      = techs;
  window.SF.TECH_BY_ID = Object.fromEntries(techs.map((t) => [t.id, t]));
}

function useTechStore() {
  const [techs, setTechs]     = React.useState(_FB() ? TECH_SEED : () => _lsGet(SF_TECH_KEY, TECH_SEED));
  const [loading, setLoading] = React.useState(false); // techs load fast; don't block UI

  // sync window.SF globals every render (same as original)
  syncTechGlobals(techs);

  React.useEffect(() => {
    if (!_FB()) return;
    const ref = _fbr("techs");
    const h = ref.on("value", (snap) => {
      const arr = _snap2arr(snap);
      if (!arr) {
        ref.set(_toObj(TECH_SEED));
        return;
      }
      setTechs(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  React.useEffect(() => {
    if (!_FB()) _lsSet(SF_TECH_KEY, techs);
  }, [techs]);

  const upsert = React.useCallback((rec) => {
    if (_FB()) {
      _fbSet("techs/" + rec.id, rec);
    } else {
      setTechs((prev) => {
        const i = prev.findIndex((t) => t.id === rec.id);
        if (i === -1) return prev.concat([Object.assign({}, rec)]);
        const copy = prev.slice(); copy[i] = Object.assign({}, prev[i], rec); return copy;
      });
    }
  }, []);

  const remove = React.useCallback((id) => {
    if (_FB()) { _fbRem("techs/" + id); }
    else { setTechs((prev) => prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)); }
  }, []);

  const resetTechs = React.useCallback(() => {
    const seed = TECH_SEED.map((t) => Object.assign({}, t));
    if (_FB()) { _fbr("techs").set(_toObj(seed)); }
    else { setTechs(seed); }
  }, []);

  return { techs, loading, upsert, remove, resetTechs, blankTech: () => blankTech(techs), colors: TECH_COLORS };
}

/* ================================================================
   useBrandStore
   ================================================================ */
const BRAND_SEED = [
  { name: "ATMOCE", battery: true },
  { name: "Huawei", battery: true },
];

function syncBrandGlobals(brands) {
  window.SF.BRAND_LIST   = brands;
  window.SF.BRANDS       = brands.map((b) => b.name);
  window.SF.BRAND_BY_NAME = Object.fromEntries(brands.map((b) => [b.name, b]));
}

function _brandKey(name) { return name.replace(/[^a-zA-Z0-9_-]/g, "_"); }

function useBrandStore() {
  const [brands, setBrands]   = React.useState(_FB() ? BRAND_SEED : () => _lsGet(SF_BRAND_KEY, BRAND_SEED));
  const [loading, setLoading] = React.useState(false);

  // sync window.SF globals every render
  syncBrandGlobals(brands);

  React.useEffect(() => {
    if (!_FB()) return;
    const ref = _fbr("brands");
    const h = ref.on("value", (snap) => {
      const v = snap.val();
      if (!v) {
        const obj = Object.fromEntries(BRAND_SEED.map((b) => [_brandKey(b.name), b]));
        ref.set(obj);
        return;
      }
      setBrands(Object.values(v));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  React.useEffect(() => {
    if (!_FB()) _lsSet(SF_BRAND_KEY, brands);
  }, [brands]);

  const upsert = React.useCallback((rec, origName) => {
    if (_FB()) {
      const key    = _brandKey(rec.name);
      const oldKey = origName != null ? _brandKey(origName) : key;
      if (oldKey !== key) _fbRem("brands/" + oldKey); // renamed → remove old key
      _fbSet("brands/" + key, rec);
    } else {
      setBrands((prev) => {
        const lookupKey = origName != null ? origName : rec.name;
        const i = prev.findIndex((b) => b.name === lookupKey);
        if (i === -1) {
          if (prev.some((b) => b.name === rec.name)) return prev;
          return prev.concat([Object.assign({}, rec)]);
        }
        const copy = prev.slice(); copy[i] = Object.assign({}, prev[i], rec); return copy;
      });
    }
  }, []);

  const remove = React.useCallback((name) => {
    if (_FB()) { _fbRem("brands/" + _brandKey(name)); }
    else { setBrands((prev) => prev.length <= 1 ? prev : prev.filter((b) => b.name !== name)); }
  }, []);

  const resetBrands = React.useCallback(() => {
    const seed = BRAND_SEED.map((b) => Object.assign({}, b));
    if (_FB()) {
      _fbr("brands").set(Object.fromEntries(seed.map((b) => [_brandKey(b.name), b])));
    } else {
      setBrands(seed);
    }
  }, []);

  return { brands, loading, upsert, remove, resetBrands };
}

/* ================================================================
   usePriceStore — ฐานราคาวัสดุ BOQ (รหัส + ราคา/หน่วย ต่อชื่อวัสดุ)
   ================================================================ */
const SF_PRICE_KEY = "solarflow_prices_v1";
function _priceKey(name) { return String(name || "").replace(/[.#$\[\]\/]/g, "_"); }

function usePriceStore() {
  const [priceMap, setMap] = React.useState(_FB() ? {} : () => _lsGet(SF_PRICE_KEY, {}));
  const [loading, setLoading] = React.useState(_FB());

  React.useEffect(() => {
    if (!_FB()) { setLoading(false); return; }
    const ref = _fbr("boqPrices");
    const h = ref.on("value", (snap) => {
      const v = snap.val() || {};
      const m = {};
      Object.keys(v).forEach((k) => { const r = v[k]; if (r && r.name) m[r.name] = { code: r.code || "", price: +r.price || 0, unit: r.unit || "", group: r.group || "" }; });
      setMap(m);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  React.useEffect(() => { if (!_FB()) _lsSet(SF_PRICE_KEY, priceMap); }, [priceMap]);

  const setPrice = React.useCallback((name, code, price, unit, group) => {
    const rec = { name: name, code: code || "", price: +price || 0, unit: unit || "", group: group || "" };
    if (_FB()) {
      _fbSet("boqPrices/" + _priceKey(name), rec);
    } else {
      setMap((p) => Object.assign({}, p, { [name]: { code: rec.code, price: rec.price, unit: rec.unit, group: rec.group } }));
    }
  }, []);

  const removePrice = React.useCallback((name) => {
    if (_FB()) { _fbRem("boqPrices/" + _priceKey(name)); }
    else { setMap((p) => { const c = Object.assign({}, p); delete c[name]; return c; }); }
  }, []);

  return { priceMap: priceMap || {}, loading, setPrice, removePrice };
}

/* ================================================================
   useJobFileFlags — ดัชนีเบาๆ ว่าแต่ละงานแนบ "แบบ"/"BOQ" แล้วหรือยัง
   เก็บที่ jobFileFlags/{jobId} = { design, boq } (ไม่มี base64) ให้การ์ดหน้าบอร์ดโชว์ได้เร็ว
   ================================================================ */
function useJobFileFlags() {
  const [flags, setFlags] = React.useState({});
  React.useEffect(() => {
    if (!_FB()) return;
    const ref = _fbr("jobFileFlags");
    const h = ref.on("value", (snap) => {
      const v = snap.val() || {};
      const m = {};
      Object.keys(v).forEach((id) => { const r = v[id] || {}; m[id] = { design: !!r.design, boq: !!r.boq }; });
      setFlags(m);
    }, () => {});
    return () => ref.off("value", h);
  }, []);
  return flags;
}

/* ================================================================
   useAmpacityStore — ค่าพิกัดกระแสสายไฟที่แก้จากเล่ม วสท. (ทับค่าเริ่มต้นใน BOQ)
   เก็บแบบ flat: key = "<cls>__<method>__<sizeEnc>" → amp (เลี่ยงจุดในคีย์ Firebase)
   ================================================================ */
const SF_AMP_KEY = "solarflow_ampacity_v1";
// คีย์ = "<ins>__<method>__<group>__<ncond>__<core>__<sizeEnc>" (เลี่ยงจุดในคีย์ Firebase)
const _ampEnc = (ins, method, group, ncond, core, size) => [ins, method, group, ncond, core, String(size).replace(/\./g, "_")].join("__");
function _ampFlatToNested(flat) {
  const out = {};
  Object.keys(flat || {}).forEach((k) => {
    const p = k.split("__"); if (p.length !== 6) return;
    const v = +flat[k]; if (!(v > 0)) return;
    const ins = p[0], method = p[1], col = p[2] + "|" + p[3] + "|" + p[4], size = p[5].replace(/_/g, ".");
    out[ins] = out[ins] || {}; out[ins][method] = out[ins][method] || {}; out[ins][method][col] = out[ins][method][col] || {};
    out[ins][method][col][size] = v;
  });
  return out;
}
function _ampLsGet() { try { const s = localStorage.getItem(SF_AMP_KEY); return s ? (JSON.parse(s) || {}) : {}; } catch (e) { return {}; } }

function useAmpacityStore() {
  const flatRef = React.useRef(_FB() ? {} : _ampLsGet());
  const [overrides, setOv] = React.useState(() => _ampFlatToNested(flatRef.current));
  const [loading, setLoading] = React.useState(_FB());

  React.useEffect(() => {
    if (!_FB()) { setLoading(false); return; }
    const ref = _fbr("cableAmpacity");
    const h = ref.on("value", (snap) => {
      const v = snap.val() || {};
      flatRef.current = v; setOv(_ampFlatToNested(v)); setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  // setCell(ins, method, group, ncond, core, size, amp)
  const setCell = React.useCallback((ins, method, group, ncond, core, size, amp) => {
    const key = _ampEnc(ins, method, group, ncond, core, size); const val = +amp || 0;
    if (_FB()) {
      if (val > 0) _fbSet("cableAmpacity/" + key, val); else _fbRem("cableAmpacity/" + key);
    } else {
      const next = Object.assign({}, flatRef.current);
      if (val > 0) next[key] = val; else delete next[key];
      flatRef.current = next; _lsSet(SF_AMP_KEY, next); setOv(_ampFlatToNested(next));
    }
  }, []);

  const reset = React.useCallback(() => {
    if (_FB()) { _fbRem("cableAmpacity"); }
    else { flatRef.current = {}; _lsSet(SF_AMP_KEY, {}); setOv({}); }
  }, []);

  return { overrides, loading, setCell, reset };
}

/* ================================================================
   Export to window (same pattern as original)
   ================================================================ */
Object.assign(window, {
  useJobStore, useStockStore, useTechStore, useBrandStore, usePriceStore, useAmpacityStore,
  blankJob, blankItem, blankTech, nextCode,
  SF_STORE_KEY,
});
