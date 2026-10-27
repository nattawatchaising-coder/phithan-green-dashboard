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
/* เลยนี้แล้วไม่เริ่มคำขอใหม่ · คำขอสุดท้ายเริ่มได้ถึง BUDGET − (GAP + REQ_TIMEOUT) = 34 วิ จบช้าสุด 52 วิ เหลือ 8 วิเขียนฐานก่อนชน 60 วิ
   (เดิม 42 วิ = เริ่มคำขอได้ถึงแค่ 24 วิ รอบเดียวไม่ครบ ไซต์+อินเวอร์เตอร์รอบหนึ่ง มิเตอร์อีกรอบ ข้อมูลใหม่ทุก 30 นาทีแทน 15 — ผู้ใช้บ่นช้า 2026-10-27) */
const BUDGET_MS = 52000;
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
  17: "Grid meter", 47: "Power meter", 39: "Battery", 41: "ESS", 46: "Optimizer", 10: "EMI (environmental monitor)",
  23070: "EMMA (energy manager)", 23071: "SmartGuard (backup box)", 23076: "External meter",
};
/* ประเภทที่ไม่เก็บเลย — ออปติไมเซอร์ (46) ข้อมูลจริง 1,346 ตัว = 38% ของ fsDevices แต่ไม่ได้ใช้ (ผู้ใช้: "ออปติไมเซอร์ ไม่ต้องเอามาก็ได้") */
export const SKIP_TYPES = { 46: 1 };
/* ประเภทที่ดึงค่า KPI รายชั่วโมง · ประเภทที่ไม่รู้จักไม่ดึง (Huawei อาจไม่รองรับ getDevRealKpi) แต่ยังเก็บรายชื่ออุปกรณ์ตามปกติ
   ด็องเกิล (62) / SmartLogger (63) ตอบ failCode 20013 ทุกรอบ (ข้อมูลจริง 2026-10-26) — ไม่ดึง เสียเวลารอบละ 2 คำขอ */
export const KPI_TYPES = { 1: 1, 38: 1, 17: 1, 47: 1, 39: 1, 41: 1, 10: 1 };
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
/* failCode ตอน login → เหตุเป็นภาษาคน (20003 เจอจริง 2026-10-26: บัญชี Northbound หมดอายุ ไม่ใช่รหัสผิด) */
const LOGIN_FAIL_TH = {
  20001: "ไม่พบบัญชี API นี้ใน FusionSolar — เช็ก FUSIONSOLAR_USER",
  20002: "บัญชี API ถูกปิดใช้งานใน FusionSolar — แอดมินบริษัทเปิดใน Northbound Management",
  20003: "บัญชี API (Northbound) หมดอายุ — แอดมินบริษัทต่ออายุใน FusionSolar → System → Company Management → Northbound Management",
  20400: "ชื่อผู้ใช้หรือรหัส API ผิด — เช็ก FUSIONSOLAR_USER / FUSIONSOLAR_PASS",
};
export const loginFailText = (e) => LOGIN_FAIL_TH[Number(e && e.failCode)] || ("ล็อกอิน FusionSolar ไม่ผ่าน (" + ((e && e.message) || "") + ") — เช็ก FUSIONSOLAR_USER / FUSIONSOLAR_PASS");
/* ล็อกอินพลาดแล้ว รอบอัตโนมัติ (cron/gh/view) เว้นเท่านี้ก่อนลองใหม่ · แอดมินกดเองลองได้ทุกเมื่อ */
const LOGIN_RETRY_MS = 60 * 60000;
const HOURFILL_MS = 60 * 60000;   // รอบ kpi ดึงรายชั่วโมงของวันนี้จาก Huawei ซ้ำได้ชั่วโมงละครั้ง

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
  let token = "", cookie = "", dead = null, last = Number(o.lastCallAt) || 0, calls = 0, loggedIn = false;

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
    } catch (e) {
      /* fetch failed ของ Node บอกสาเหตุจริงไว้ใน e.cause (ENOTFOUND · ECONNREFUSED · ECONNRESET · ใบรับรอง) + โฮสต์ที่ยิง — ไว้แยกว่าเป็นที่ env/เครือข่าย */
      const c = e && e.cause, why = c ? [c.code, c.message].filter(Boolean).join(" ") : "";
      let host = ""; try { host = new URL(FS.base()).host; } catch (x) { host = "FUSIONSOLAR_BASE ผิดรูปแบบ"; }
      throw new FsError(api, null, "เชื่อมต่อไม่ได้: " + (e && e.message) + (why ? " (" + why + ")" : "") + " · " + host);
    }
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
    loggedIn = true;
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

  return { call, get calls() { return calls; }, get last() { return last; }, get loggedIn() { return loggedIn; } };
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
  /* พิกัด/วันเชื่อมกริด — มีเฉพาะ /stations · ไม่มีค่า = ไม่เขียน (ไม่ลบค่าเดิม)
     ไซต์ที่ไม่ได้ปักหมุดใน FusionSolar ส่งพิกัดหลอก 0,0 / 1,1 / -1,-1 (ข้อมูลจริง 14 ไซต์) → ล้างค่าทิ้ง ไม่ให้ไปโผล่กลางทะเลแอฟริกา */
  const geo = (id, st) => {
    if (st.lat != null && st.lng != null) {
      const ok = Math.abs(st.lat) <= 90 && Math.abs(st.lng) <= 180 && !(Math.abs(st.lat) <= 1 && Math.abs(st.lng) <= 1);
      patch[id + "/lat"] = ok ? st.lat : null; patch[id + "/lng"] = ok ? st.lng : null;
    }
    if (st.gridDate) patch[id + "/grid_date"] = String(st.gridDate);
  };
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
      geo(nid, st);
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
    geo(id, st);
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
    if (!d || d.id == null || SKIP_TYPES[num(d.devTypeId)]) return;
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
    if (seen[id] || !inRun[d.station_code] || SKIP_TYPES[d.dev_type_id]) return;
    if (d.fs_status !== "not_found_in_fusionsolar") patch[id + "/fs_status"] = "not_found_in_fusionsolar";
    out.notFound++;
  });
  return { patch, out };
}

/* กราฟกำลังไฟวันนี้ — ใช้ร่วมกับ isolarcloud.mjs · key = { day: "YYYY-MM-DD", hm: "HHmm" } เวลาไทยปัดลง 5 นาที */
export function fsWKey(ms) {
  const x = new Date(ms + 7 * 3600e3).toISOString();
  return { day: x.slice(0, 10), hm: x.slice(11, 13) + String(Math.floor(+x.slice(14, 16) / 5) * 5).padStart(2, "0") };
}
/* wPv = { siteId: kW } · wG = { "siteId/meterId": kW } → patch ของ fsKpiDay */
export function fsWPatch(wk, wPv, wG) {
  const out = {};
  Object.keys(wPv).forEach((sid) => { out[sid + "/" + wk.day + "/w/" + wk.hm + "/pv"] = Math.round(wPv[sid] * 1000) / 1000; });
  Object.keys(wG).forEach((k) => { const j = k.indexOf("/"); out[k.slice(0, j) + "/" + wk.day + "/w/" + wk.hm + "/g/" + k.slice(j + 1)] = wG[k]; });
  return out;
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
        "hist" (ข้อมูลผลิตย้อนหลังไว้วาดกราฟ — แอดมินกดเอง ไม่อยู่ใน all/cron)
   ================================================================ */
export async function runSync(o) {
  const job = ["sites", "kpi", "all", "hist", "histday"].includes(o.job) ? o.job : "all";
  const dry = o.dryRun !== false;
  const t0 = Date.now();
  const left = () => BUDGET_MS - (Date.now() - t0);
  const log = {
    started_at: iso(), finished_at: null, job, trigger: o.trigger || "manual", by: o.by || null, dry_run: dry, ok: false,
    created: 0, updated: 0, not_found: 0, dev_created: 0, dev_updated: 0, dev_not_found: 0,
    stations: 0, kpi_sites: 0, kpi_devices: 0, hist_months: 0, hist_days: 0, hist_hours: 0, requests: 0, pending: 0, errors: [], note: "",
  };
  const res = { log, preview: null };
  let c = null;           // ตัวยิง API — สร้างหลังผ่านด่านล็อก (finish อ่านจำนวนคำขอจากตัวนี้)

  if (!fsReady()) { log.note = "ยังไม่ได้ตั้ง FUSIONSOLAR_USER / FUSIONSOLAR_PASS"; log.errors.push({ at: iso(), api: "", failCode: null, message: log.note }); return finish(); }

  let state = {};
  try { state = (await rtdbGet("fsState")) || {}; } catch (e) { log.errors.push(errRec(e)); return finish(); }
  if (state.blocked_until && Date.parse(state.blocked_until) > Date.now()) {
    log.note = "พักจาก failCode 407 ถึง " + state.blocked_until; return finish(true);
  }
  /* ล็อกอินพลาดรอบก่อน (เช่นบัญชีหมดอายุ) — รอบอัตโนมัติไม่ลองซ้ำทุก 15 นาที รอชั่วโมงละครั้ง · แอดมินกดเองข้ามได้ */
  const lf = state.login_fail;
  if (lf && log.trigger !== "manual" && log.trigger !== "tool" && Date.now() - (Date.parse(lf.at) || 0) < LOGIN_RETRY_MS) {
    log.note = "รอลองล็อกอินใหม่ (พลาดเมื่อ " + lf.at + ": " + (lf.text || lf.message || "") + ")"; return finish(true);
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

  const preview = { create: [], update: [], changed: [], not_found: [], kpi: [], hist: [] };
  res.preview = preview;
  try {
    if (job === "hist") await doHist();
    if (job === "histday") await doHist(true);
    if (job === "sites" || job === "all") await doSites();
    /* เติมรายชั่วโมงของวันนี้ (ผลิต+ใช้ไฟ) จาก /getKpiStationHour ชั่วโมงละครั้ง (ทำก่อน doKpi — ไว้ท้ายแล้วรอบที่มีอุปกรณ์เยอะเวลาไม่พอ ไม่ได้ทำสักที) — รอบ kpi (GitHub ทุก 15 นาที) ข้ามบ่อยมาก
       หรือบัญชีหมดอายุ ชั่วโมงที่ไม่มีใครซิงก์จะว่างในกราฟ (ผู้ใช้: "กราฟมันไม่มีอะไรเลย" 2026-10-27) */
    if (job === "kpi" && !dry && left() > (GAP_MS + REQ_TIMEOUT) * 2 && Date.now() - (Date.parse(state.hourfill_at || "") || 0) >= HOURFILL_MS) {
      st.hourfill_at = iso(); await doHist("today");
    }
    if ((job === "kpi" || job === "all") && left() > GAP_MS * 2) await doKpi();
    else if (job === "all") { log.pending++; log.note = (log.note ? log.note + " · " : "") + "ข้อมูลผลิตไม่ทันในรอบนี้"; }
  } catch (e) {
    log.errors.push(errRec(e));
    if (e && e.rateLimited) {
      log.note = "โดน failCode 407 (ถี่เกิน) — พัก " + (BLOCK_MS / 60000) + " นาที";
      st.blocked_until = new Date(Date.now() + BLOCK_MS).toISOString();
    } else if (e && e.fatal) {
      log.note = loginFailText(e) + " — หยุดทั้งรอบ";
      /* จดไว้ให้หน้าไซต์ทั้งหมดขึ้นป้ายบอกทุกคน (ตัวเลขบนหน้าค้าง) · at = ครั้งแรกที่พลาด (since) + ครั้งล่าสุด */
      st.login_fail = { since: (state.login_fail && state.login_fail.since) || iso(), at: iso(),
        failCode: e.failCode == null ? null : e.failCode, message: String(e.message || "").slice(0, 200), text: loginFailText(e) };
    }
  }
  if (c && c.loggedIn && state.login_fail) st.login_fail = null;
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
      ((d && d.list) || []).forEach((s) => out.push({ code: s.plantCode, name: s.plantName || "", address: s.plantAddress || "", kw: num(s.capacity),
        lat: num(s.latitude), lng: num(s.longitude), gridDate: s.gridConnectionDate || null }));
      if (!d || p >= (Number(d.pageCount) || 1)) break;
    }
    st.station_api = "stations";
    return out;
  }

  /* ประวัติไว้วาดกราฟ (Huawei ให้แค่ค่าปัจจุบัน — เก็บเองทุกรอบ KPI ไม่ต้องยิง API เพิ่ม) · วัน/ชั่วโมงตามเวลาไทย
     fsKpiDay/{siteId}/{YYYY-MM-DD} = { kwh: ผลิตทั้งวันล่าสุด, h: {HH: ผลิตสะสมของวันถึงชั่วโมงนั้น}, p: {HH: {devId: kW อินเวอร์เตอร์}},
       m: {HH: {devId: {a: active_cap, r: reverse_active_cap}}} ตัวนับสะสมมิเตอร์ (หาไฟที่ใช้รายชั่วโมง), u: {HH: ใช้ไฟสะสมของวัน — จาก job hist} }
     fsKpiMonth/{siteId}/{YYYY-MM} = ผลิตทั้งเดือนล่าสุด */
  function bkk(ms) { const x = new Date(ms + 7 * 3600e3).toISOString(); return { day: x.slice(0, 10), mon: x.slice(0, 7), hh: x.slice(11, 13) }; }  // function: doKpi ถูกเรียกก่อนบรรทัดนี้

  async function doKpi() {
    const idx = siteIndex(sites);
    const codes = Object.keys(idx).filter((k) => sites[idx[k]].fs_status === "found").sort();
    const byType = {};
    Object.keys(devices).sort().forEach((id) => {
      const d = devices[id] || {};
      if (d.fs_status === "not_found_in_fusionsolar" || d.dev_type_id == null || !KPI_TYPES[d.dev_type_id]) return;
      if (!idx[d.station_code] || sites[idx[d.station_code]].fs_status !== "found") return;
      (byType[d.dev_type_id] || (byType[d.dev_type_id] = [])).push(id);
    });
    const batches = chunk(codes, BATCH).map((b) => ({ kind: "st", ids: b }));
    Object.keys(byType).sort((a, b) => a - b).forEach((t) => chunk(byType[t], BATCH).forEach((b) => batches.push({ kind: "dev", type: +t, ids: b })));
    if (!batches.length) { log.note = (log.note ? log.note + " · " : "") + "ยังไม่มีไซต์/อุปกรณ์ให้ดึงข้อมูลผลิต"; return; }

    /* ซิงก์ถี่กว่าชั่วโมงละครั้ง (ทุก 15 นาที + ตอนมีคนเปิดหน้าเว็บ) — ค่ารายชั่วโมง h/p/m จดเฉพาะรอบแรกของชั่วโมง
       (fsState/kpi_snap = วัน+ชั่วโมงที่จดแล้ว) ไม่งั้นค่าชั่วโมงถูกเขียนทับด้วยค่าท้ายชั่วโมง แท่งเลื่อนเวลา · kwh/ค่าไซต์อัปเดตทุกรอบ */
    const snapKey = bkk(Date.now()).day + " " + bkk(Date.now()).hh;
    const snap = dry || state.kpi_snap !== snapKey;
    /* กราฟกำลังไฟวันนี้ (kW) — จดทุกรอบ: w/{HHmm} = { pv: kW รวมอินเวอร์เตอร์ของไซต์, g: { มิเตอร์: kW ดิบ (ทิศตามมิเตอร์) } }
       HHmm = เวลาไทยปัดลง 5 นาทีของรอบนี้ · อุปกรณ์ของไซต์ที่รอบนี้ไม่ได้ดึง (งานแบ่งหลายรอบ) ใช้ค่าล่าสุดที่อายุ ≤ 20 นาที
       ไม่งั้นจุดหนึ่งมีแต่มิเตอร์ อีกจุดมีแต่อินเวอร์เตอร์ครึ่งเดียว — เส้นกราฟขาดเป็นจุด ๆ และค่าตกฮวบ (ผู้ใช้แจ้ง 2026-10-27) */
    const wKey = fsWKey(Date.now()), wPv = {}, wG = {}, wSeen = {};
    let i = dry ? 0 : Math.min(Number(state.kpi_cursor) || 0, batches.length);
    if (i >= batches.length) i = 0;
    for (; i < batches.length; i++) {
      if (left() < GAP_MS + REQ_TIMEOUT) break;
      const b = batches[i];
      const t = iso();
      try {
        if (b.kind === "st") {
          const data = await c.call("/getStationRealKpi", { stationCodes: b.ids.join(",") });
          const patch = {}, dayP = {}, monP = {}, k = bkk(Date.now());
          (Array.isArray(data) ? data : []).forEach((r) => {
            const id = idx[r && r.stationCode]; if (!id) return;
            const m = r.dataItemMap || {};
            if (num(m.day_power) != null) { dayP[id + "/" + k.day + "/kwh"] = num(m.day_power); if (snap) dayP[id + "/" + k.day + "/h/" + k.hh] = num(m.day_power); }
            if (num(m.month_power) != null) monP[id + "/" + k.mon] = num(m.month_power);
            Object.assign(patch, { [id + "/day_kwh"]: num(m.day_power), [id + "/month_kwh"]: num(m.month_power),
              [id + "/total_kwh"]: num(m.total_power), [id + "/health_state"]: num(m.real_health_state), [id + "/kpi_updated_at"]: t });
            log.kpi_sites++;
            if (preview.kpi.length < 20) preview.kpi.push({ code: r.stationCode, name: sites[id].name || "", day_kwh: num(m.day_power),
              month_kwh: num(m.month_power), total_kwh: num(m.total_power), health_state: num(m.real_health_state) });
          });
          if (!dry) { await writePatch("fsSites", patch); await writePatch("fsKpiDay", dayP); await writePatch("fsKpiMonth", monP); }
        } else {
          const data = await c.call("/getDevRealKpi", { devIds: b.ids.join(","), devTypeId: b.type });
          const patch = {}, dayP = {}, k = bkk(Date.now());
          (Array.isArray(data) ? data : []).forEach((r) => {
            const id = safeKey(String(r && r.devId)); if (!devices[id]) return;
            const pw = num((r.dataItemMap || {}).active_power);
            if (snap && (b.type === 1 || b.type === 38) && pw != null && devices[id].site_id) dayP[devices[id].site_id + "/" + k.day + "/p/" + k.hh + "/" + id] = pw;
            if (pw != null) wSeen[id] = 1;
            if ((b.type === 1 || b.type === 38) && pw != null && devices[id].site_id) wPv[devices[id].site_id] = (wPv[devices[id].site_id] || 0) + pw;
            if ((b.type === 47 || b.type === 17) && pw != null && devices[id].site_id) wG[devices[id].site_id + "/" + id] = Math.round(pw) / 1000;   // มิเตอร์ W → kW
            if (snap && (b.type === 47 || b.type === 17) && devices[id].site_id) {
              const a = num((r.dataItemMap || {}).active_cap), rv = num((r.dataItemMap || {}).reverse_active_cap);
              if (a != null && rv != null) dayP[devices[id].site_id + "/" + k.day + "/m/" + k.hh + "/" + id] = { a, r: rv };
            }
            Object.assign(patch, { [id + "/last_kpi_json"]: JSON.stringify(r.dataItemMap || {}), [id + "/last_kpi_at"]: t });
            log.kpi_devices++;
            if (preview.kpi.length < 20) preview.kpi.push({ devId: String(r.devId), dev_name: devices[id].dev_name || "",
              dev_type_id: b.type, dataItemMap: r.dataItemMap || {} });
          });
          if (!dry) { await writePatch("fsDevices", patch); await writePatch("fsKpiDay", dayP); }
        }
      } catch (e) {
        if (e.fatal) { st.kpi_cursor = i; throw e; }
        log.errors.push(errRec(e));
      }
    }
    const wTouched = {};
    Object.keys(wPv).forEach((s) => { wTouched[s] = 1; });
    Object.keys(wG).forEach((k) => { wTouched[k.split("/")[0]] = 1; });
    Object.keys(devices).forEach((id) => {
      const d = devices[id] || {}, sid = d.site_id, ty = Number(d.dev_type_id);
      if (!sid || !wTouched[sid] || wSeen[id] || !(ty === 1 || ty === 38 || ty === 47 || ty === 17)) return;
      if (Date.now() - (Date.parse(d.last_kpi_at || "") || 0) > 20 * 60e3) return;
      let pw = null; try { pw = num(JSON.parse(d.last_kpi_json || "{}").active_power); } catch (e) { return; }
      if (pw == null) return;
      if (ty === 1 || ty === 38) wPv[sid] = (wPv[sid] || 0) + pw; else wG[sid + "/" + id] = Math.round(pw) / 1000;
    });
    if (!dry) await writePatch("fsKpiDay", fsWPatch(wKey, wPv, wG));
    log.pending += batches.length - i;
    st.kpi_cursor = i >= batches.length ? 0 : i;
    if (!dry) st.last_kpi_at = iso();
    if (!dry && snap && i >= batches.length) st.kpi_snap = snapKey;
  }

  /* ข้อมูลผลิตย้อนหลัง (ผู้ใช้สั่ง — กราฟประวัติไม่ต้องรอเก็บเองทีละชั่วโมงเป็นเดือน) · ทีละ 100 สถานี
     คิวงานตายตัวต่อวัน: รายเดือนปีที่แล้ว+ปีนี้ (/getKpiStationMonth) → รายวันเดือนที่แล้ว+เดือนนี้ (/getKpiStationDay)
       → รายชั่วโมง 7 วันล่าสุด (/getKpiStationHour — ผู้ใช้อยากดูกราฟกำลังไฟวันก่อนหน้า 2026-10-27 · มี use_power = ไฟที่ใช้) · ไม่ทันเวลา = fsState/hist_cursor (+ hist_key = วันที่ของคิว ข้ามวันแล้วเริ่มใหม่)
     collectTime ที่ส่ง = เวลาเที่ยงวันไทยของวัน/กลางเดือน/กลางปีนั้น · collectTime ที่ได้กลับ = เวลาเริ่มของช่วง → แปลงเป็นวัน/ชั่วโมงไทย
     ค่าผลิต = inverter_power (เอกสาร Northbound) ไม่มีค่อยใช้ PVYield
     ช่วงที่ยังไม่จบ (วันนี้ · เดือนนี้) ไม่เขียน kwh ทับค่าสดของรอบ KPI · ชั่วโมงที่ยังไม่จบไม่เขียน
     รายชั่วโมง → h/{HH+1} = ผลิตสะสมของวันถึงปลายชั่วโมง HH (ความหมายเดียวกับค่าที่รอบ KPI จดตอน HH+1:07)
     hoursOnly (job "histday" — cron ทุกวัน 04:30) = รายชั่วโมงของเมื่อวาน+วันนี้อย่างเดียว ~2 คำขอ ไม่ใช้ hist_cursor · เติมชั่วโมงที่ซิงก์พลาด
     hoursOnly "today" = วันนี้อย่างเดียว (รอบ kpi ชั่วโมงละครั้ง) */
  async function doHist(hoursOnly) {
    const idx = siteIndex(sites);
    const groups = chunk(Object.keys(idx).filter((k) => sites[idx[k]].fs_status === "found").sort(), BATCH);
    if (!groups.length) { log.note = "ยังไม่มีไซต์ให้ดึงข้อมูลย้อนหลัง"; return; }
    const now = Date.now(), k0 = bkk(now);
    const y = +k0.mon.slice(0, 4), m = +k0.mon.slice(5, 7);
    const noon = (d) => Date.parse(d + "T12:00:00+07:00");
    const pad = (n) => String(n).padStart(2, "0");
    const tasks = [];
    if (!hoursOnly) {
      [y - 1, y].forEach((yy) => groups.forEach((g) => tasks.push({ kind: "mon", api: "/getKpiStationMonth", t: noon(yy + "-06-15"), g })));
      [m === 1 ? (y - 1) + "-12" : y + "-" + pad(m - 1), k0.mon].forEach((mm) => groups.forEach((g) => tasks.push({ kind: "day", api: "/getKpiStationDay", t: noon(mm + "-15"), g })));
    }
    for (let b = hoursOnly === "today" ? 0 : hoursOnly ? 1 : 6; b >= 0; b--) { const d = bkk(now - b * 864e5).day; groups.forEach((g) => tasks.push({ kind: "hour", api: "/getKpiStationHour", t: noon(d), g })); }
    const yv = (mp) => { const a = num((mp || {}).inverter_power); return a != null ? a : num((mp || {}).PVYield); };

    let i = dry || hoursOnly || state.hist_key !== k0.day ? 0 : Math.min(Number(state.hist_cursor) || 0, tasks.length);
    if (i >= tasks.length) i = 0;
    for (; i < tasks.length; i++) {
      if (left() < GAP_MS + REQ_TIMEOUT) break;
      const tk = tasks[i];
      let data;
      try { data = await c.call(tk.api, { stationCodes: tk.g.join(","), collectTime: tk.t }); }
      catch (e) { if (e.fatal) { if (!hoursOnly) { st.hist_cursor = i; st.hist_key = k0.day; } throw e; } log.errors.push(errRec(e)); continue; }
      const dayP = {}, monP = {}, hrs = {};
      (Array.isArray(data) ? data : []).forEach((r) => {
        const id = idx[r && r.stationCode], ct = num(r && r.collectTime);
        if (!id || ct == null) return;
        const k = bkk(ct), v = yv(r.dataItemMap), u = num((r.dataItemMap || {}).use_power);
        if (tk.kind === "mon") {
          if (v == null || k.mon >= k0.mon) return;
          monP[id + "/" + k.mon] = v; log.hist_months++;
        } else if (tk.kind === "day") {
          if (v == null || k.day >= k0.day) return;
          dayP[id + "/" + k.day + "/kwh"] = v; log.hist_days++;
        } else if (ct + 3600e3 <= now) {
          ((hrs[id] || (hrs[id] = {}))[k.day] || (hrs[id][k.day] = [])).push([+k.hh, v || 0, u]);
        }
        if (preview.hist.length < 20) preview.hist.push({ code: r.stationCode, name: sites[id].name || "", kind: tk.kind,
          at: tk.kind === "mon" ? k.mon : tk.kind === "day" ? k.day : k.day + " " + k.hh + ":00", kwh: v });
      });
      Object.keys(hrs).forEach((id) => Object.keys(hrs[id]).forEach((d) => {
        let acc = 0, accU = 0;
        const hasU = hrs[id][d].some((x) => x[2] != null);   // use_power มีเฉพาะไซต์ที่มีมิเตอร์
        hrs[id][d].sort((a, b) => a[0] - b[0]).forEach(([h, v, u]) => {
          acc += v; accU += u || 0;
          if (h + 1 > 23) return;
          dayP[id + "/" + d + "/h/" + pad(h + 1)] = Math.round(acc * 1000) / 1000; log.hist_hours++;
          if (hasU) dayP[id + "/" + d + "/u/" + pad(h + 1)] = Math.round(accU * 1000) / 1000;
        });
      }));
      if (!dry) { await writePatch("fsKpiDay", dayP); await writePatch("fsKpiMonth", monP); }
    }
    log.pending += tasks.length - i;
    if (hoursOnly) return;
    st.hist_cursor = i >= tasks.length ? 0 : i;
    st.hist_key = k0.day;
    if (!dry && i >= tasks.length) st.hist_done_at = iso();
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
