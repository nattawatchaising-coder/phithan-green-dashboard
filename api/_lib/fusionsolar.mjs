/* ============================================================
   flash+solar — ซิงก์ข้อมูลจาก Huawei FusionSolar Northbound API (ฝั่งเซิร์ฟเวอร์เท่านั้น)
   ใช้ร่วม api/cron/fusionsolar.mjs (อัตโนมัติ) · api/fusionsolar/sync.mjs (ปุ่มแอดมิน) · tools/fusionsolar-run.mjs
   ข้อตกลงทั้งหมดอยู่ docs/fusionsolar.md

   ── ข้อมูล (Firebase RTDB · เทียบกับตาราง SQL ในสเปก) ──
     fsSites/{siteId}      = sites    · FusionSolar เป็นต้นทางของรายชื่อไซต์
     fsDevices/{devId}     = devices  · key = fusionsolar_dev_id (สตริง — เลขยาวเกิน int)
     fsSyncLogs/{logId}    = sync_logs · logId = "L" + เวลา ms (เรียงตามเวลาเอง)
     fsState               = ล็อก · เวลาโดน 407 · เคอร์เซอร์งานค้าง · อนุมัติรอบแรก (เขียนได้เฉพาะเซิร์ฟเวอร์)

   ── สิ่งที่ซิงก์ห้ามทำ ──
   - ห้ามแตะ jobs/ omSites/ หรือโหนดอื่นของงาน — เขียนแค่ fs* สี่โหนดข้างบน
   - ห้ามลบไซต์/อุปกรณ์ — หายจาก FusionSolar = ตั้ง fs_status = "not_found_in_fusionsolar"
   - ห้ามเขียนทับทั้ง node — PATCH ทีละฟิลด์ ("<id>/<field>") ฟิลด์ที่ผู้ใช้กรอก (jobIds omSiteIds note ...) จึงอยู่ครบ
   - dry run = ไม่เขียนอะไรเลยแม้แต่ log/ล็อก

   ── Huawei ──
   POST JSON ทุกคำขอ · login ได้ xsrf-token (header) + cookie → ส่ง XSRF-TOKEN + cookie เดิมทุกคำขอ
   failCode 305 = token หมดอายุ → login ใหม่แล้วลองซ้ำครั้งเดียว · 407 = ถี่เกิน → หยุดทั้งรอบ จด blocked_until
   เว้นระยะ GAP_MS ระหว่างคำขอ (ผู้ใช้สั่ง ≥ 2–3 วิ) · function รันได้ 60 วิ (vercel.json) → หยุดรับคำขอใหม่ที่ BUDGET_MS
   งานที่ทำไม่ทัน = เคอร์เซอร์ใน fsState รอบหน้าทำต่อ

   ⚠ ไม่มี dependency เหมือน line.mjs
   ============================================================ */

import { rtdbGet, rtdbUpdate, rtdbSet, rtdbEtag, rtdbSetIf } from "./line.mjs";

export const FS = {
  base: () => (process.env.FUSIONSOLAR_BASE || "https://intl.fusionsolar.huawei.com/thirdData").trim().replace(/\/+$/, ""),
  user: () => (process.env.FUSIONSOLAR_USER || "").trim(),
  pass: () => (process.env.FUSIONSOLAR_PASS || "").trim(),
};
export const fsReady = () => !!(FS.user() && FS.pass());

const GAP_MS = Number(process.env.FUSIONSOLAR_GAP_MS) || 3000;
const BATCH = 100;                 // สูงสุดต่อคำขอของ getStationRealKpi / getDevList / getDevRealKpi
const BUDGET_MS = 42000;           // เลยนี้แล้วไม่เริ่มคำขอใหม่ — เผื่อคำขอที่ค้าง + เขียนฐานข้อมูลก่อนชน 60 วิ
const REQ_TIMEOUT = 15000;
const BLOCK_MS = 15 * 60000;       // โดน 407 แล้วพักกี่นาที
const LOCK_MS = 90000;             // ล็อกค้างนานกว่านี้ = รอบก่อนตายกลางทาง ยึดต่อได้

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const iso = () => new Date().toISOString();
const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };

/* ── ประเภทอุปกรณ์ (สเปกข้อ 5) — ชุดเดียวกับ FS_DEV_TYPES ใน dashboard/fusionsolar.jsx ── */
export const DEV_TYPES = {
  1: "String inverter", 38: "Residential inverter", 2: "SmartLogger", 63: "SmartLogger", 62: "Smart Dongle",
  17: "Grid meter", 47: "Power meter", 39: "Battery", 41: "ESS", 46: "Optimizer",
};
export const devTypeName = (t) => DEV_TYPES[t] || ("ไม่ทราบประเภท (devTypeId " + t + ")");

/* key ของ RTDB ห้ามมี . # $ [ ] / */
const safeKey = (s) => String(s || "").replace(/[.#$\[\]\/]/g, "_");
export const siteIdFor = (code) => "FS-" + String(code || "").replace(/[^A-Za-z0-9_-]/g, "_");

/* ── ข้อผิดพลาดจาก Huawei ── */
export class FsError extends Error {
  constructor(api, failCode, message) {
    super(message || ("failCode " + failCode));
    this.api = api; this.failCode = failCode == null ? null : failCode;
    this.rateLimited = Number(failCode) === 407;
    /* ล็อกอินไม่ผ่าน = หยุดทั้งรอบ — ลองรหัสผิดซ้ำทุกชุดเสี่ยงบัญชีถูกล็อก */
    this.fatal = this.rateLimited || api === "/login";
  }
}
const errRec = (e) => ({ at: iso(), api: (e && e.api) || "", failCode: e && e.failCode != null ? e.failCode : null,
  message: String((e && e.message) || e || "").slice(0, 300) });

/* id อุปกรณ์เป็นเลข 16 หลัก — แปลงเป็นสตริงก่อน JSON.parse กันเลขเพี้ยน (เกิน 2^53 ได้) */
function parseBody(text) {
  return JSON.parse(String(text || "").replace(/"(id|devId)"\s*:\s*(-?\d+)/g, '"$1":"$2"'));
}

/* ================================================================
   ตัวยิง API — login ครั้งเดียวต่อรอบ ใช้ token ซ้ำ · เว้นระยะทุกคำขอ
   ================================================================ */
export function fsClient(opt) {
  const o = opt || {};
  let token = "", cookie = "", dead = null, last = Number(o.lastCallAt) || 0, calls = 0;

  async function raw(api, payload, isLogin) {
    const d = last + GAP_MS - Date.now();
    if (d > 0) await sleep(d);
    last = Date.now(); calls++;
    const headers = { "content-type": "application/json" };
    if (!isLogin) { headers["XSRF-TOKEN"] = token; if (cookie) headers.cookie = cookie; }
    let r, text;
    try {
      r = await fetch(FS.base() + api, { method: "POST", headers, body: JSON.stringify(payload || {}), signal: AbortSignal.timeout(REQ_TIMEOUT) });
      text = await r.text();
    } catch (e) { throw new FsError(api, null, "เชื่อมต่อไม่ได้: " + (e && e.message)); }
    let j;
    try { j = parseBody(text); } catch (e) { throw new FsError(api, null, "HTTP " + r.status + " ไม่ใช่ JSON"); }
    return { r, j: j || {} };
  }
  const bad = (api, j) => new FsError(api, j.failCode, (j.message || j.data || ("failCode " + j.failCode)) + "");

  async function login() {
    if (dead) throw dead;
    const { r, j } = await raw("/login", { userName: FS.user(), systemCode: FS.pass() }, true);
    if (!j.success) throw (dead = bad("/login", j));
    const sc = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie()
      : (r.headers.get("set-cookie") ? [r.headers.get("set-cookie")] : []);
    cookie = sc.map((c) => String(c).split(";")[0].trim()).filter(Boolean).join("; ");
    token = r.headers.get("xsrf-token") || "";
    if (!token) { const m = /XSRF-TOKEN=([^;]+)/i.exec(cookie); if (m) token = m[1]; }
    if (!token) throw new FsError("/login", null, "ไม่มี xsrf-token ในคำตอบ");
  }

  async function call(api, payload) {
    if (!token) await login();
    let { j } = await raw(api, payload);
    if (!j.success && Number(j.failCode) === 305) {
      token = ""; await login();
      ({ j } = await raw(api, payload));
    }
    if (!j.success) throw bad(api, j);
    return j.data;
  }

  return { call, get calls() { return calls; }, get last() { return last; } };
}

/* ================================================================
   ส่วนคำนวณ (ไม่ยิงอะไร) — แยกไว้ให้ dry run กับรอบจริงใช้ตัวเดียวกัน
   ================================================================ */

/* station code → siteId (ไม่นับไซต์ที่ถูกรวมเข้าไซต์อื่นแล้ว) */
export function siteIndex(sites) {
  const m = {};
  Object.keys(sites || {}).forEach((id) => {
    const s = sites[id];
    if (s && s.fusionsolar_station_code && !s.merged_into) m[s.fusionsolar_station_code] = id;
  });
  return m;
}

/* แผนอัปเดตไซต์จากรายชื่อสถานี — คืน patch แบบ "<id>/<field>" สำหรับ PATCH ที่ fsSites */
export function planSites(stations, sites, now) {
  const t = now || iso();
  const idx = siteIndex(sites);
  const patch = {}, created = [], updated = [], changed = [], notFound = [], seen = {};
  (stations || []).forEach((st) => {
    if (!st || !st.code || seen[st.code]) return;
    seen[st.code] = 1;
    const id = idx[st.code];
    if (!id) {
      let nid = siteIdFor(st.code), n = 2;
      while ((sites || {})[nid] || patch[nid + "/id"]) nid = siteIdFor(st.code) + "-" + n++;
      Object.assign(patch, {
        [nid + "/id"]: nid, [nid + "/name"]: st.name || st.code, [nid + "/fusionsolar_station_code"]: st.code,
        [nid + "/capacity_kw"]: st.kw, [nid + "/address"]: st.address || "", [nid + "/source"]: "fusionsolar",
        [nid + "/fs_status"]: "found", [nid + "/last_synced_at"]: t, [nid + "/created_at"]: t,
      });
      created.push({ id: nid, code: st.code, name: st.name || "" });
      return;
    }
    const cur = sites[id] || {};
    /* ไซต์ที่ผู้ใช้สร้างเองแล้วผูกรหัสทีหลัง — FusionSolar จะเขียนทับชื่อ/ขนาด/ที่อยู่ (สเปก)
       เก็บค่าที่ผู้ใช้กรอกไว้ครั้งเดียวก่อน จะได้ไม่หายไปเฉย ๆ */
    if (cur.source === "manual" && cur.manual_saved !== true) {
      Object.assign(patch, { [id + "/manual_name"]: cur.name || "", [id + "/manual_address"]: cur.address || "",
        [id + "/manual_capacity_kw"]: cur.capacity_kw == null ? null : cur.capacity_kw, [id + "/manual_saved"]: true });
    }
    const diff = (cur.name || "") !== (st.name || cur.name || "") || num(cur.capacity_kw) !== st.kw || (cur.address || "") !== (st.address || "");
    Object.assign(patch, {
      [id + "/name"]: st.name || cur.name || st.code, [id + "/capacity_kw"]: st.kw, [id + "/address"]: st.address || "",
      [id + "/last_synced_at"]: t,
    });
    if (cur.fs_status !== "found") patch[id + "/fs_status"] = "found";
    updated.push({ id, code: st.code, name: st.name || "" });
    if (diff || cur.fs_status !== "found") changed.push({ id, code: st.code, name: st.name || "" });
  });
  Object.keys(idx).forEach((code) => {
    if (seen[code]) return;
    const id = idx[code];
    if ((sites[id] || {}).fs_status !== "not_found_in_fusionsolar") patch[id + "/fs_status"] = "not_found_in_fusionsolar";
    notFound.push({ id, code, name: (sites[id] || {}).name || "" });
  });
  return { patch, created, updated, changed, notFound };
}

/* แผนอัปเดตอุปกรณ์ — codes = สถานีที่ดึงรายชื่ออุปกรณ์สำเร็จในรอบนี้ (อุปกรณ์ที่หายตัดสินได้เฉพาะสถานีพวกนี้) */
export function planDevices(devs, codes, devices, codeToSite, now) {
  const t = now || iso();
  const patch = {}, out = { created: 0, updated: 0, notFound: 0 }, seen = {};
  (devs || []).forEach((d) => {
    if (!d || d.id == null) return;
    const id = safeKey(String(d.id));
    seen[id] = 1;
    const had = !!(devices || {})[id];
    Object.assign(patch, {
      [id + "/fusionsolar_dev_id"]: String(d.id), [id + "/site_id"]: codeToSite[d.stationCode] || null,
      [id + "/station_code"]: d.stationCode || "", [id + "/dev_name"]: d.devName || "",
      [id + "/dev_type_id"]: num(d.devTypeId), [id + "/esn_code"]: d.esnCode || "", [id + "/model"]: d.model || "",
      [id + "/software_version"]: d.softwareVersion || "", [id + "/fs_status"]: "found", [id + "/last_synced_at"]: t,
    });
    had ? out.updated++ : out.created++;
  });
  const inRun = {}; (codes || []).forEach((c) => { inRun[c] = 1; });
  Object.keys(devices || {}).forEach((id) => {
    const d = devices[id] || {};
    if (seen[id] || !inRun[d.station_code]) return;
    if (d.fs_status !== "not_found_in_fusionsolar") patch[id + "/fs_status"] = "not_found_in_fusionsolar";
    out.notFound++;
  });
  return { patch, out };
}

/* รวม patch แบบ "<id>/<field>" เข้าก้อนในหน่วยความจำ — dry run ใช้ต่อขั้น KPI ได้เหมือนเขียนแล้ว */
function applyPatch(obj, patch) {
  Object.keys(patch).forEach((k) => {
    const i = k.indexOf("/"), id = k.slice(0, i), f = k.slice(i + 1);
    obj[id] = Object.assign({}, obj[id] || {}, { [f]: patch[k] });
  });
  return obj;
}

/* ส่ง PATCH ทีละไม่เกิน ~400 ฟิลด์ (ฐานจำกัดขนาดคำขอ · ไซต์หลายร้อยเป็นหลายพันฟิลด์) */
async function writePatch(root, patch) {
  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += 400) {
    const part = {}; keys.slice(i, i + 400).forEach((k) => { part[k] = patch[k]; });
    await rtdbUpdate(root, part);
  }
}

/* ================================================================
   รอบซิงก์
   job: "sites" (ไซต์+อุปกรณ์ วันละครั้ง) · "kpi" (ข้อมูลผลิต+ค่าอุปกรณ์ ทุกชั่วโมง) · "all" (sites แล้ว kpi)
   ================================================================ */
export async function runSync(o) {
  const job = ["sites", "kpi", "all"].includes(o.job) ? o.job : "all";
  const dry = o.dryRun !== false;
  const t0 = Date.now();
  const left = () => BUDGET_MS - (Date.now() - t0);
  const log = {
    started_at: iso(), finished_at: null, job, trigger: o.trigger || "manual", by: o.by || null, dry_run: dry, ok: false,
    created: 0, updated: 0, not_found: 0, dev_created: 0, dev_updated: 0, dev_not_found: 0,
    stations: 0, kpi_sites: 0, kpi_devices: 0, requests: 0, pending: 0, errors: [], note: "",
  };
  const res = { log, preview: null };
  let c = null;           // ตัวยิง API — สร้างหลังผ่านด่านล็อก (finish อ่านจำนวนคำขอจากตัวนี้)

  if (!fsReady()) { log.note = "ยังไม่ได้ตั้ง FUSIONSOLAR_USER / FUSIONSOLAR_PASS"; log.errors.push({ at: iso(), api: "", failCode: null, message: log.note }); return finish(); }

  let state = {};
  try { state = (await rtdbGet("fsState")) || {}; } catch (e) { log.errors.push(errRec(e)); return finish(); }
  if (state.blocked_until && Date.parse(state.blocked_until) > Date.now()) {
    log.note = "พักจาก failCode 407 ถึง " + state.blocked_until; return finish(true);
  }

  /* ล็อก — รอบจริงเท่านั้น (dry run ไม่เขียนอะไร) */
  let lockEtag = null;
  if (!dry) {
    try {
      const cur = await rtdbEtag("fsState/lock");
      if (cur.value && Date.now() - Date.parse(cur.value.at) < LOCK_MS) { log.note = "มีรอบซิงก์อื่นกำลังทำงาน"; return finish(true, true); }
      const mine = { at: iso(), job, trigger: log.trigger };
      if (!(await rtdbSetIf("fsState/lock", mine, cur.etag))) { log.note = "มีรอบซิงก์อื่นกำลังทำงาน"; return finish(true, true); }
      lockEtag = true;
    } catch (e) { log.errors.push(errRec(e)); return finish(); }
  }

  c = fsClient({ lastCallAt: Date.parse(state.last_call_at || "") || 0 });
  const st = {};          // ค่าที่จะเขียนกลับ fsState
  let sites = {}, devices = {};
  try {
    sites = (await rtdbGet("fsSites")) || {};
    devices = (await rtdbGet("fsDevices")) || {};
  } catch (e) { log.errors.push(errRec(e)); return finish(); }

  const preview = { create: [], update: [], changed: [], not_found: [], kpi: [] };
  res.preview = preview;
  try {
    if (job === "sites" || job === "all") await doSites();
    if ((job === "kpi" || job === "all") && left() > GAP_MS * 2) await doKpi();
    else if (job === "all") { log.pending++; log.note = (log.note ? log.note + " · " : "") + "ข้อมูลผลิตไม่ทันในรอบนี้"; }
  } catch (e) {
    log.errors.push(errRec(e));
    if (e && e.rateLimited) {
      log.note = "โดน failCode 407 (ถี่เกิน) — พัก " + (BLOCK_MS / 60000) + " นาที";
      st.blocked_until = new Date(Date.now() + BLOCK_MS).toISOString();
    } else if (e && e.fatal) log.note = "ล็อกอิน FusionSolar ไม่ผ่าน — หยุดทั้งรอบ (เช็ก FUSIONSOLAR_USER / FUSIONSOLAR_PASS)";
  }
  return finish();

  async function doSites() {
    const stations = await fetchStations();
    log.stations = stations.length;
    const p = planSites(stations, sites, iso());
    log.created = p.created.length; log.updated = p.updated.length; log.not_found = p.notFound.length;
    preview.create = p.created; preview.update = p.updated; preview.changed = p.changed; preview.not_found = p.notFound;
    if (!dry) await writePatch("fsSites", p.patch);
    applyPatch(sites, p.patch);

    /* รายชื่ออุปกรณ์ของสถานีที่ยังมีอยู่ ทีละ 100 — ไม่ทันเวลา = จำเคอร์เซอร์ไว้ทำต่อรอบหน้า */
    const idx = siteIndex(sites);
    const codes = Object.keys(idx).filter((k) => sites[idx[k]].fs_status === "found").sort();
    const batches = chunk(codes, BATCH);
    let i = dry ? 0 : Math.min(Number(state.dev_cursor) || 0, batches.length);
    if (i >= batches.length) i = 0;
    for (; i < batches.length; i++) {
      if (left() < GAP_MS + REQ_TIMEOUT) break;
      let list;
      try { list = await c.call("/getDevList", { stationCodes: batches[i].join(",") }); }
      catch (e) { if (e.fatal) { st.dev_cursor = i; throw e; } log.errors.push(errRec(e)); continue; }
      const dp = planDevices(Array.isArray(list) ? list : [], batches[i], devices, idx, iso());
      log.dev_created += dp.out.created; log.dev_updated += dp.out.updated; log.dev_not_found += dp.out.notFound;
      if (!dry) await writePatch("fsDevices", dp.patch);
      applyPatch(devices, dp.patch);
    }
    log.pending += batches.length - i;
    st.dev_cursor = i >= batches.length ? 0 : i;
    if (!dry) st.last_sites_at = iso();
  }

  /* รายชื่อสถานี — getStationList ก่อน (สเปก) ใช้ไม่ได้ค่อยใช้ /stations แบ่งหน้า แล้วจำว่าใช้ตัวไหน
     ต้องได้ครบทุกหน้า ไม่งั้นตัดสินว่า "ไม่พบใน FusionSolar" ผิด → พลาดหน้าไหน = ยกเลิกขั้นไซต์ */
  async function fetchStations() {
    if (state.station_api !== "stations") {
      try {
        const d = await c.call("/getStationList", {});
        if (!Array.isArray(d)) throw new FsError("/getStationList", null, "data ไม่ใช่รายการ");
        st.station_api = "getStationList";
        return d.map((s) => ({ code: s.stationCode, name: s.stationName || "", address: s.stationAddr || "",
          kw: num(s.capacity) == null ? null : Math.round(num(s.capacity) * 1000 * 1000) / 1000 }));
      } catch (e) {
        if (e.fatal) throw e;
        log.errors.push(Object.assign(errRec(e), { message: errRec(e).message + " → ใช้ /stations แทน" }));
      }
    }
    const out = [];
    for (let p = 1; ; p++) {
      if (left() < GAP_MS + REQ_TIMEOUT) throw new FsError("/stations", null, "ดึงรายชื่อไม่ครบทุกหน้าในเวลาที่มี (ถึงหน้า " + (p - 1) + ")");
      const d = await c.call("/stations", { pageNo: p });
      ((d && d.list) || []).forEach((s) => out.push({ code: s.plantCode, name: s.plantName || "", address: s.plantAddress || "", kw: num(s.capacity) }));
      if (!d || p >= (Number(d.pageCount) || 1)) break;
    }
    st.station_api = "stations";
    return out;
  }

  async function doKpi() {
    const idx = siteIndex(sites);
    const codes = Object.keys(idx).filter((k) => sites[idx[k]].fs_status === "found").sort();
    const byType = {};
    Object.keys(devices).sort().forEach((id) => {
      const d = devices[id] || {};
      if (d.fs_status === "not_found_in_fusionsolar" || d.dev_type_id == null) return;
      if (!idx[d.station_code] || sites[idx[d.station_code]].fs_status !== "found") return;
      (byType[d.dev_type_id] || (byType[d.dev_type_id] = [])).push(id);
    });
    const batches = chunk(codes, BATCH).map((b) => ({ kind: "st", ids: b }));
    Object.keys(byType).sort((a, b) => a - b).forEach((t) => chunk(byType[t], BATCH).forEach((b) => batches.push({ kind: "dev", type: +t, ids: b })));
    if (!batches.length) { log.note = (log.note ? log.note + " · " : "") + "ยังไม่มีไซต์/อุปกรณ์ให้ดึงข้อมูลผลิต"; return; }

    let i = dry ? 0 : Math.min(Number(state.kpi_cursor) || 0, batches.length);
    if (i >= batches.length) i = 0;
    for (; i < batches.length; i++) {
      if (left() < GAP_MS + REQ_TIMEOUT) break;
      const b = batches[i];
      const t = iso();
      try {
        if (b.kind === "st") {
          const data = await c.call("/getStationRealKpi", { stationCodes: b.ids.join(",") });
          const patch = {};
          (Array.isArray(data) ? data : []).forEach((r) => {
            const id = idx[r && r.stationCode]; if (!id) return;
            const m = r.dataItemMap || {};
            Object.assign(patch, { [id + "/day_kwh"]: num(m.day_power), [id + "/month_kwh"]: num(m.month_power),
              [id + "/total_kwh"]: num(m.total_power), [id + "/health_state"]: num(m.real_health_state), [id + "/kpi_updated_at"]: t });
            log.kpi_sites++;
            if (preview.kpi.length < 20) preview.kpi.push({ code: r.stationCode, name: sites[id].name || "", day_kwh: num(m.day_power),
              month_kwh: num(m.month_power), total_kwh: num(m.total_power), health_state: num(m.real_health_state) });
          });
          if (!dry) await writePatch("fsSites", patch);
        } else {
          const data = await c.call("/getDevRealKpi", { devIds: b.ids.join(","), devTypeId: b.type });
          const patch = {};
          (Array.isArray(data) ? data : []).forEach((r) => {
            const id = safeKey(String(r && r.devId)); if (!devices[id]) return;
            Object.assign(patch, { [id + "/last_kpi_json"]: JSON.stringify(r.dataItemMap || {}), [id + "/last_kpi_at"]: t });
            log.kpi_devices++;
            if (preview.kpi.length < 20) preview.kpi.push({ devId: String(r.devId), dev_name: devices[id].dev_name || "",
              dev_type_id: b.type, dataItemMap: r.dataItemMap || {} });
          });
          if (!dry) await writePatch("fsDevices", patch);
        }
      } catch (e) {
        if (e.fatal) { st.kpi_cursor = i; throw e; }
        log.errors.push(errRec(e));
      }
    }
    log.pending += batches.length - i;
    st.kpi_cursor = i >= batches.length ? 0 : i;
    if (!dry) st.last_kpi_at = iso();
  }

  /* จบรอบ: dry run คืนผลเฉย ๆ · รอบจริงเขียน log + fsState แล้วปลดล็อก
     skipped = ไม่ได้เริ่มงาน (พัก 407 / มีรอบอื่นอยู่) — จดแค่ log (skipped: true) ไม่แตะ fsState · ไม่นับเป็น error */
  async function finish(skipped, busy) {
    log.requests = c ? c.calls : 0;
    log.finished_at = iso();
    log.ok = !log.errors.some((e) => e.api !== "/getStationList") || !!skipped;
    log.ms = Date.now() - t0;
    if (skipped) res.skipped = true;
    if (busy) res.busy = true;
    if (dry) return res;
    try {
      if (skipped) { log.id = "L" + t0; log.skipped = true; await rtdbSet("fsSyncLogs/" + log.id, log); return res; }
      st.last_call_at = !c || !c.last ? state.last_call_at || null : new Date(c.last).toISOString();
      if (o.approve) { st.approved_at = iso(); st.approved_by = o.by || null; }
      await rtdbUpdate("fsState", st);
      const key = "L" + t0;
      log.id = key;
      await rtdbSet("fsSyncLogs/" + key, log);
    } catch (e) { log.errors.push(errRec(e)); log.ok = false; }
    if (lockEtag) await rtdbSet("fsState/lock", null).catch(() => {});
    return res;
  }
}
