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
const SF_TECH_KEY  = "solarflow_techs_v1";
const SF_BRAND_KEY = "solarflow_brands_v1";

function _lsGet(key, seed) {
  try {
    const s = localStorage.getItem(key);
    if (s) { const a = JSON.parse(s); if (Array.isArray(a) && a.length) return a; }
  } catch (e) {}
  return seed.map((x) => Object.assign({}, x));
}
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
    map: "", brand: "ATMOCE", kw: 5, panels: 9,
    battery: false, batSize: "ไม่มี", connect: "-", backup: false, birdnet: false,
    stage: "design", deadline: window.SF.TODAY, tech: "t1", problem: null,
    mat: { panel: "none", inverter: "none", structure: "none", wiring: "none",
           battery: "none", backup: "none", birdnet: "none" },
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
    const handler = ref.on(
      "value",
      (snap) => {
        let arr = _snap2arr(snap);
        if (!arr) {
          // ครั้งแรก — seed ข้อมูลตัวอย่างลง Firebase
          const seed = SF_SEED();
          ref.set(_toObj(seed));
          arr = seed;
        }
        setRaw(arr);
        setLoading(false);
      },
      () => setLoading(false)      // error → unblock UI
    );
    return () => ref.off("value", handler);
  }, []);

  /* ---------- localStorage sync (offline mode only) ---------- */
  React.useEffect(() => {
    if (!_FB() && raw !== null) _lsSet(SF_STORE_KEY, raw);
  }, [raw]);

  /* ---------- derived jobs ---------- */
  const jobs = React.useMemo(() => (raw || []).map(window.SF.deriveJob), [raw]);

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

  const remove = React.useCallback((id) => {
    if (_FB()) {
      _fbRem("jobs/" + id);
    } else {
      setRaw((prev) => prev.filter((j) => j.id !== id));
    }
  }, []);

  const advance = React.useCallback((id) => {
    const job = (rawRef.current || []).find((j) => j.id === id);
    if (!job) return;
    const idx  = window.SF.STAGE_INDEX[job.stage];
    const next = window.SF.STAGES[Math.min(idx + 1, window.SF.STAGES.length - 1)].key;
    patch(id, { stage: next, problem: next === "done" ? null : job.problem });
  }, [patch]);

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
    raw: raw || [], jobs, loading,
    upsert, patch, remove, advance, setMat, resetDB,
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
  return { id: "IV-" + String(max + 1).padStart(2, "0"), sku: "", name: "", cat: "panel", unit: "ชิ้น", qty: 0, min: 0, loc: "" };
}

/* ================================================================
   useStockStore
   ================================================================ */
function useStockStore() {
  const ISEED = () => window.SF.INVENTORY_SEED.map((x) => Object.assign({}, x));
  const MSEED = () => window.SF.MOVES_SEED.map((x) => Object.assign({}, x));

  const [items, setItems]     = React.useState(_FB() ? null : () => _lsGet(SF_STOCK_KEY, ISEED()));
  const [moves, setMoves]     = React.useState(_FB() ? null : () => _lsGet(SF_MOVES_KEY, MSEED()));
  const [loading, setLoading] = React.useState(_FB());

  const itemsRef = React.useRef(items);
  const movesRef = React.useRef(moves);
  React.useEffect(() => { itemsRef.current = items; }, [items]);
  React.useEffect(() => { movesRef.current = moves; }, [moves]);

  /* ---------- Firebase listeners ---------- */
  React.useEffect(() => {
    if (!_FB()) return;
    let iDone = false, mDone = false;
    const done = () => { if (iDone && mDone) setLoading(false); };

    const iRef = _fbr("stock");
    const iH = iRef.on("value", (snap) => {
      let arr = _snap2arr(snap);
      if (!arr) { arr = ISEED(); iRef.set(_toObj(arr)); }
      setItems(arr); iDone = true; done();
    }, () => { iDone = true; done(); });

    const mRef = _fbr("moves");
    const mH = mRef.on("value", (snap) => {
      let arr = _snap2arr(snap);
      if (!arr) { arr = MSEED(); mRef.set(_toObj(arr)); }
      // เรียงใหม่ล่าสุดก่อน (id เป็น MV-ตัวเลข)
      arr.sort((a, b) => {
        const na = parseInt((a.id || "").replace(/\D/g, ""), 10);
        const nb = parseInt((b.id || "").replace(/\D/g, ""), 10);
        return nb - na;
      });
      setMoves(arr); mDone = true; done();
    }, () => { mDone = true; done(); });

    return () => { iRef.off("value", iH); mRef.off("value", mH); };
  }, []);

  /* ---------- localStorage sync ---------- */
  React.useEffect(() => { if (!_FB() && items !== null) _lsSet(SF_STOCK_KEY, items); }, [items]);
  React.useEffect(() => { if (!_FB() && moves !== null) _lsSet(SF_MOVES_KEY, moves); }, [moves]);

  /* ---------- mutations ---------- */
  const upsertItem = React.useCallback((rec) => {
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

  const removeItem = React.useCallback((id) => {
    if (_FB()) { _fbRem("stock/" + id); }
    else { setItems((prev) => prev.filter((x) => x.id !== id)); }
  }, []);

  const move = React.useCallback((itemId, type, qty, ref, note) => {
    qty = Math.abs(parseInt(qty) || 0);
    if (!qty) return;

    const currentMoves = movesRef.current || [];
    let maxN = 1000;
    currentMoves.forEach((m) => {
      const n = parseInt((m.id || "").replace(/\D/g, ""), 10);
      if (n > maxN) maxN = n;
    });
    const mvId = "MV-" + (maxN + 1);
    const mv   = { id: mvId, itemId, type, qty, date: window.SF.TODAY, ref: ref || "-", note: note || "" };

    if (_FB()) {
      // atomic qty update via transaction
      _fbTx("stock/" + itemId + "/qty", (cur) =>
        Math.max(0, (cur || 0) + (type === "in" ? qty : -qty))
      );
      _fbSet("moves/" + mvId, mv);
    } else {
      setItems((prev) => prev.map((x) =>
        x.id === itemId ? Object.assign({}, x, { qty: Math.max(0, x.qty + (type === "in" ? qty : -qty)) }) : x
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
    items: items || [], moves: moves || [], loading,
    upsertItem, removeItem, move, resetStock,
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
  { name: "ATMOCE", battery: true  },
  { name: "Huawei", battery: false },
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
   Export to window (same pattern as original)
   ================================================================ */
Object.assign(window, {
  useJobStore, useStockStore, useTechStore, useBrandStore,
  blankJob, blankItem, blankTech, nextCode,
  SF_STORE_KEY,
});
