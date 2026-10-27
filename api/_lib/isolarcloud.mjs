/* ============================================================
   flash+solar — ตัวยิง Sungrow iSolarCloud OpenAPI (V1 · ไม่ใช่ OAuth2) ฝั่งเซิร์ฟเวอร์เท่านั้น
   ข้อตกลงอยู่ docs/isolarcloud.md

   ── การยืนยันตัว ──
   ทุกคำขอ POST · header x-access-key (Access Key ของแอปใน Developer Portal) + sys_code 901
   body = พารามิเตอร์ + appkey + lang + api_key_param {timestamp ms, nonce 32 ตัว} (+ token หลัง login)
   login: /openapi/login {user_account, user_password, login_type "1"} → result_data.token (login_state "1" = ผ่าน)
   สำเร็จ = result_code "1" · ข้อมูลอยู่ result_data

   ── เข้ารหัส (แอปที่เปิด encrypt ใน portal — ค่าเริ่ม) ──
   ทุกคำขอสุ่มกุญแจ 16 ตัว (A-Za-z0-9) → body JSON เข้า AES-128-ECB PKCS7 เป็น hex ตัวใหญ่ ส่งเป็น body ดิบ
   กุญแจนั้นเข้า RSA PKCS#1 v1.5 ด้วย RSA public key ของแอป (base64 DER) ทีละชิ้น (ขนาดโมดูลัส − 11) → base64 url-safe
   ใส่ header x-random-secret-key · คำตอบเป็น hex เข้ารหัสด้วยกุญแจเดียวกัน (บางข้อผิดพลาดตอบ JSON ตรง ๆ)

   ── env ──
   ISOLARCLOUD_BASE (ค่าเริ่ม https://gateway.isolarcloud.com.hk — ไทยอยู่เซิร์ฟเวอร์สากล) · ISOLARCLOUD_APPKEY
   ISOLARCLOUD_ACCESS_KEY · ISOLARCLOUD_RSA_KEY · ISOLARCLOUD_USER · ISOLARCLOUD_PASS · ISOLARCLOUD_ENCRYPT ("0" = ปิด)
   ISOLARCLOUD_GAP_MS เว้นระหว่างคำขอ (ค่าเริ่ม 1000)
   ============================================================ */
import crypto from "node:crypto";
import { rtdbGet, rtdbUpdate, rtdbSet, rtdbEtag, rtdbSetIf } from "./line.mjs";

const env = (k, d) => (process.env[k] == null || process.env[k] === "" ? d : String(process.env[k]).trim());
export const ISC = {
  base: () => env("ISOLARCLOUD_BASE", "https://gateway.isolarcloud.com.hk").replace(/\/+$/, ""),
  appkey: () => env("ISOLARCLOUD_APPKEY", ""),
  accessKey: () => env("ISOLARCLOUD_ACCESS_KEY", ""),
  rsaKey: () => env("ISOLARCLOUD_RSA_KEY", ""),
  user: () => env("ISOLARCLOUD_USER", ""),
  pass: () => env("ISOLARCLOUD_PASS", ""),
  encrypt: () => env("ISOLARCLOUD_ENCRYPT", "1") !== "0",
};
export const iscReady = () => !!(ISC.appkey() && ISC.accessKey() && ISC.user() && ISC.pass() && (!ISC.encrypt() || ISC.rsaKey()));

const GAP_MS = Number(process.env.ISOLARCLOUD_GAP_MS) || 1000;
const REQ_TIMEOUT = 15000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const randStr = (n) => { const b = crypto.randomBytes(n); let s = ""; for (let i = 0; i < n; i++) s += ALNUM[b[i] % ALNUM.length]; return s; };

/* ── เข้ารหัส ── */
const aesKey = (k) => { const b = Buffer.alloc(16, 0x20); Buffer.from(k, "utf8").copy(b, 0, 0, 16); return b; };
export function aesEncHex(text, key) {
  const c = crypto.createCipheriv("aes-128-ecb", aesKey(key), null);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("hex").toUpperCase();
}
export function aesDecHex(hex, key) {
  const d = crypto.createDecipheriv("aes-128-ecb", aesKey(key), null);
  return Buffer.concat([d.update(Buffer.from(String(hex).trim(), "hex")), d.final()]).toString("utf8");
}
/* public key จาก portal เป็น base64 ของ DER (SPKI) — ยอมทั้ง url-safe/ธรรมดา มี/ไม่มี = และแบบ PEM */
function pubKey(b64) {
  const s = String(b64 || "").trim();
  if (/BEGIN PUBLIC KEY/.test(s)) return crypto.createPublicKey(s);
  const der = Buffer.from(s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return crypto.createPublicKey({ key: der, format: "der", type: "spki" });
}
export function rsaEncB64Url(text, b64) {
  const key = pubKey(b64);
  const max = key.asymmetricKeyDetails.modulusLength / 8 - 11;
  const src = Buffer.from(text, "utf8"), out = [];
  for (let i = 0; i < src.length; i += max)
    out.push(crypto.publicEncrypt({ key, padding: crypto.constants.RSA_PKCS1_PADDING }, src.subarray(i, i + max)));
  return Buffer.concat(out).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

/* ── ข้อผิดพลาด ── */
export class IscError extends Error {
  constructor(api, code, message) {
    super(message || ("result_code " + code));
    this.api = api; this.code = code == null ? null : String(code);
    /* login ไม่ผ่าน / กุญแจแอปผิด = หยุดทั้งรอบ ไม่ลองซ้ำ (เสี่ยงบัญชีถูกล็อก) */
    this.fatal = api === "/openapi/login" || /^E9(1[0-9])$/.test(this.code || "");
  }
}
/* รหัสที่เจอบ่อย (จากผู้ใช้ OpenAPI คนอื่น — ยังไม่ได้ยืนยันกับเอกสารทางการ) */
const CODE_TH = {
  E912: "Access Key (x-access-key) ไม่ถูกต้อง",
  E919: "บัญชีนี้ไม่อยู่ในรายชื่อที่แอปอนุญาต (whitelist) — เพิ่มใน Developer Portal",
  er_invalid_appkey: "appkey ไม่ถูกต้อง หรือใช้ผิดเซิร์ฟเวอร์ (ISOLARCLOUD_BASE)",
};
export const iscErrText = (e) => (e && CODE_TH[e.code]) || (e && e.message) || String(e || "");

/* ================================================================
   ตัวยิง — login ครั้งเดียวต่อรอบ · token หมดอายุ = login ใหม่ลองซ้ำครั้งเดียว · เว้นระยะทุกคำขอ
   ================================================================ */
export function iscClient(opt) {
  const o = opt || {};
  let token = "", dead = null, last = Number(o.lastCallAt) || 0, calls = 0, loggedIn = false;
  const log = o.onRaw || null;   // (api, bodyPlain, jsonResp) — สคริปต์สำรวจใช้ดูของจริง

  async function raw(api, params) {
    const d = last + GAP_MS - Date.now();
    if (d > 0) await sleep(d);
    last = Date.now(); calls++;
    const body = Object.assign({}, params || {}, {
      appkey: ISC.appkey(), lang: "_en_US",
      api_key_param: { timestamp: String(Date.now()), nonce: randStr(32) },
    });
    if (token) body.token = token;
    const headers = { "content-type": "application/json;charset=UTF-8", "x-access-key": ISC.accessKey(), sys_code: "901" };
    if (token) headers.token = token;
    const enc = ISC.encrypt();
    let key = "", payload = JSON.stringify(body);
    if (enc) {
      key = randStr(16);
      try { headers["x-random-secret-key"] = rsaEncB64Url(key, ISC.rsaKey()); }
      catch (e) { throw Object.assign(new IscError(api, "rsa", "RSA public key ใช้ไม่ได้: " + e.message), { fatal: true }); }
      payload = aesEncHex(payload, key);
    }
    let r, text;
    try {
      r = await fetch(ISC.base() + api, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(REQ_TIMEOUT) });
      text = await r.text();
    } catch (e) {
      const c = e && e.cause, why = c ? [c.code, c.message].filter(Boolean).join(" ") : "";
      throw new IscError(api, null, "เชื่อมต่อไม่ได้: " + (e && e.message) + (why ? " (" + why + ")" : "") + " · " + ISC.base());
    }
    let j;
    const t = String(text || "").trim();
    try {
      j = t.startsWith("{") ? JSON.parse(t) : JSON.parse(enc ? aesDecHex(t, key) : t);
    } catch (e) { throw new IscError(api, "http" + r.status, "HTTP " + r.status + " อ่านคำตอบไม่ได้: " + t.slice(0, 120)); }
    if (log) log(api, Object.assign({}, body, body.user_password ? { user_password: "***" } : {}), j);
    return j || {};
  }
  const bad = (api, j) => new IscError(api, j.result_code, (j.result_msg || "result_code " + j.result_code) + "");

  async function login() {
    if (dead) throw dead;
    const j = await raw("/openapi/login", { user_account: ISC.user(), user_password: ISC.pass(), login_type: "1" });
    const rd = j.result_data || {};
    if (String(j.result_code) !== "1" || !rd.token) {
      const msg = j.result_code !== "1" ? (j.result_msg || "") : ("login_state " + rd.login_state + (rd.msg ? " " + rd.msg : ""));
      throw (dead = new IscError("/openapi/login", j.result_code !== "1" ? j.result_code : "login_state_" + rd.login_state, msg));
    }
    token = rd.token; loggedIn = true;
    return rd;
  }

  async function call(api, params) {
    if (!token) await login();
    let j = await raw(api, params);
    if (String(j.result_code) !== "1" && /token/i.test(j.result_msg || "")) { token = ""; await login(); j = await raw(api, params); }
    if (String(j.result_code) !== "1") throw bad(api, j);
    return j.result_data;
  }

  return { call, login, get calls() { return calls; }, get last() { return last; }, get loggedIn() { return loggedIn; } };
}

/* ── คำขอที่ใช้ ── ทีละหน้า 100 แถว */
export async function iscPlants(c) {
  const out = [];
  for (let p = 1; p < 50; p++) {
    const d = await c.call("/openapi/getPowerStationList", { curPage: p, size: 100 });
    const list = (d && d.pageList) || [];
    out.push(...list);
    if (!list.length || out.length >= (Number(d.rowCount) || 0)) break;
  }
  return out;
}
export async function iscDevices(c, psId) {
  const out = [];
  for (let p = 1; p < 20; p++) {
    const d = await c.call("/openapi/getDeviceList", { ps_id: String(psId), curPage: p, size: 100 });
    const list = (d && d.pageList) || [];
    out.push(...list);
    if (!list.length || out.length >= (Number(d.rowCount) || 0)) break;
  }
  return out;
}
/* ค่าตอนนี้ — device_type เดียวต่อคำขอ · ps_key ของไซต์ = "<ps_id>_11_0_0" · point id ใส่เป็นเลข (ไม่มี p นำหน้า)
   คำตอบ device_point_list[].device_point = { ps_key, device_sn, p<id>: ค่า, ... } */
export async function iscRealtime(c, deviceType, psKeys, pointIds) {
  const d = await c.call("/openapi/getDeviceRealTimeData", {
    device_type: Number(deviceType), ps_key_list: psKeys.map(String), point_id_list: pointIds.map(String),
  });
  return ((d && d.device_point_list) || []).map((x) => (x && x.device_point) || x);
}
/* ชื่อ point ทั้งหมดของประเภทอุปกรณ์ (ไว้สำรวจว่า p<id> คืออะไร) */
export async function iscPointInfo(c, deviceType) {
  const d = await c.call("/openapi/getOpenPointInfo", { device_type: Number(deviceType), type: "2", curPage: 1, size: 999 });
  return (d && (d.pageList || d.list)) || d || [];
}
/* point ระดับไซต์ (device_type 11) ที่รู้ความหมายแล้ว — W/Wh */
export const PLANT_POINTS = {
  83022: "ผลิตวันนี้ (Wh)", 83024: "ผลิตสะสม (Wh)", 83033: "กำลังผลิตตอนนี้ (W)", 83025: "ชั่วโมงเทียบเท่า (h)",
  83001: "กำลังต่อ kWp (W/Wp)", 83102: "ซื้อไฟวันนี้ (Wh)", 83072: "ขายไฟวันนี้ (Wh)", 83106: "ใช้ไฟตอนนี้ (W)",
};

/* ================================================================
   รอบซิงก์ Sungrow → fsSites / fsDevices / fsKpiDay / fsKpiMonth (โหนดเดียวกับ FusionSolar ให้หน้าเว็บใช้ร่วม)
   job: "sites" (ไซต์ + รายชื่ออุปกรณ์ทุกไซต์ + ค่าผลิต) · "kpi" (ไซต์ + ค่าผลิต + ค่าอุปกรณ์ · ดึงรายชื่ออุปกรณ์เฉพาะไซต์ที่ยังไม่มี)
   ⚠ ไซต์ Sungrow ห้ามมี fusionsolar_station_code — ซิงก์ Huawei จะตัดสินว่า "ไม่พบใน FusionSolar"
     ผูกด้วย isc_ps_id · id = "SG-<ps_id>" · อุปกรณ์ id = "SG-<ps_key>" station_code = "SG-<ps_id>" (ไม่ชนรหัส Huawei)
   ค่าอุปกรณ์แปลงเป็น key แบบ Huawei (kW/kWh) ลง last_kpi_json — การ์ด/กราฟ/ตัวตรวจ "ควรดู" ใช้ของเดิมได้ · ค่าดิบเก็บ isc_raw_json
   สถานะใน fsState/isc (แยกจาก Huawei): lock approved_at approved_by last_call_at last_sites_at last_kpi_at kpi_snap login_fail refresh_at
   ================================================================ */
const BUDGET_MS = 40000, LOCK_MS = 90000, LOGIN_RETRY_MS = 60 * 60000, BATCH = 100;
const iso = () => new Date().toISOString();
const num = (v) => { if (v == null || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const chunk = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);
const safeKey = (s) => String(s || "").replace(/[.#$\[\]\/]/g, "_");
export const iscSiteId = (psId) => "SG-" + safeKey(psId);
const devId = (psKey) => "SG-" + safeKey(psKey);

/* ค่า {unit, value} ของรายชื่อไซต์ → kW/kWh/kWp (เจอจริง: total_energy เป็น MWh · ไซต์เล็กเป็น kWh) */
const MUL = { w: 1e-3, kw: 1, mw: 1e3, gw: 1e6, wh: 1e-3, kwh: 1, mwh: 1e3, gwh: 1e6, wp: 1e-3, kwp: 1, mwp: 1e3, gwp: 1e6 };
export function iscUnit(x) {
  if (x == null) return null;
  if (typeof x !== "object") return num(x);
  const v = num(x.value), m = MUL[String(x.unit || "").trim().toLowerCase()];
  return v == null ? null : r3(m == null ? v : v * m);
}
/* ประเภทอุปกรณ์ Sungrow → เลขประเภทแบบ Huawei ที่หน้าเว็บรู้จัก (1 อินเวอร์เตอร์ · 7 มิเตอร์ → 47 · 9 logger → 63 · 22 โมดูลสื่อสาร WiNet-S → 62 · 5 สถานีวัดแดด → 10) */
export const ISC_TYPE = { 1: 1, 7: 47, 9: 63, 22: 62, 5: 10 };
const INV_PTS = [1, 2, 87, 4, 14, 24, 25, 26, 27, 29, 18, 19, 20, 21, 22, 23, 5, 6, 7, 8, 9, 10, 45, 46, 47, 48, 49, 50, 51, 52];
const MPPT = [[5, 6], [7, 8], [9, 10], [45, 46], [47, 48], [49, 50], [51, 52]];
const MET_PTS = [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8014, 8018, 8022, 8030, 8031, 8062, 8063, 8064];
const LOG_PTS = [10026, 10027, 10028, 10593, 10594, 10037, 10038];
const putter = (k) => (key, v) => { if (v != null) k[key] = v; };
const div = (v, d) => (v == null ? null : r3(v / d));
export function iscInvKpi(p) {
  const g = (id) => num(p["p" + id]), k = {}, put = putter(k);
  const ac = g(24), dc = g(14);
  put("active_power", div(ac, 1000)); put("mppt_power", div(dc, 1000));
  put("day_cap", div(g(1), 1000)); put("total_cap", div(g(2), 1000)); put("month_cap", div(g(87), 1000));
  put("temperature", g(4)); put("power_factor", g(26)); put("elec_freq", g(27)); put("reactive_power", div(g(25), 1000));
  put("a_u", g(18)); put("b_u", g(19)); put("c_u", g(20)); put("a_i", g(21)); put("b_i", g(22)); put("c_i", g(23));
  if (ac != null && dc > 0) put("efficiency", Math.round((ac / dc) * 1000) / 10);
  /* MPPT n → pvN_u/pvN_i (Sungrow ให้แรงดันต่อ MPPT ไม่ใช่ต่อสตริง) · ช่องที่ไม่ได้ต่อตัดทิ้ง — ไม่ได้ต่อก็มีแรงดันค้างได้
     (ของจริง 40.9 V 0 A) ถ้าไม่ตัด ตัวตรวจ "สตริงกระแสต่ำ" จะเตือนผิด → นับเฉพาะ ≥ 100 V */
  MPPT.forEach(([u, i], n) => { if (g(u) >= 100) { put("pv" + (n + 1) + "_u", g(u)); put("pv" + (n + 1) + "_i", g(i)); } });
  put("isc_state", g(29));
  return k;
}
/* มิเตอร์: forward = ซื้อจากกริด (ตรวจกับ "ซื้อวันนี้" ของไซต์จริง 1,222 kWh ตรงกัน) · reverse = ขาย
   p8018 = ใช้ไฟ − โซลาร์ (ติดลบ = ขาย · ตรวจ: −1,247 W = 221,496 − 222,743) → แบบ Huawei: active_power บวก = ขาย (W)
   แบบ Huawei: active_cap = ขายสะสม · reverse_active_cap = ซื้อสะสม (kWh) */
export function iscMeterKpi(p) {
  const g = (id) => num(p["p" + id]), k = {}, put = putter(k);
  put("active_power", g(8018) == null ? null : -g(8018));
  put("active_cap", div(g(8031), 1000)); put("reverse_active_cap", div(g(8030), 1000));
  put("a_u", g(8000)); put("b_u", g(8001)); put("c_u", g(8002)); put("ab_u", g(8003)); put("bc_u", g(8004)); put("ca_u", g(8005));
  put("a_i", g(8006)); put("b_i", g(8007)); put("c_i", g(8008)); put("power_factor", g(8014)); put("grid_frequency", g(8064));
  put("reactive_power", g(8022)); put("day_buy_kwh", div(g(8062), 1000)); put("day_sell_kwh", div(g(8063), 1000));
  /* มิเตอร์ 1 เฟส (บ้าน · ของจริง EM-610) ส่งเฟส B/C = 0 → ใช้ meter_u/meter_i แบบ Huawei ไม่งั้นการ์ดขึ้น "238 / 0 / 0 V" */
  if (!g(8001) && !g(8002) && !g(8007) && !g(8008)) {
    ["a_u", "b_u", "c_u", "ab_u", "bc_u", "ca_u", "a_i", "b_i", "c_i"].forEach((x) => delete k[x]);
    put("meter_u", g(8000)); put("meter_i", g(8006));
  }
  return k;
}
export function iscLoggerKpi(p) {
  const g = (id) => num(p["p" + id]), k = {}, put = putter(k);
  put("active_power", div(g(10026), 1000)); put("day_cap", div(g(10027), 1000)); put("total_cap", div(g(10028), 1000));
  put("month_cap", div(g(10593), 1000)); put("year_cap", div(g(10594), 1000)); put("dev_count", g(10037)); put("fault_dev_count", g(10038));
  return k;
}
/* สุขภาพไซต์แบบ Huawei (1 ออฟไลน์ · 2 มีปัญหา · 3 ปกติ) · ps_status 1 = ออนไลน์ · ps_fault_status 1 เสีย 2 เตือน (3/4 ปกติ — ของจริงทุกไซต์ = 3) */
export const iscHealth = (pl) => (Number(pl.ps_status) !== 1 ? 1 : [1, 2].includes(Number(pl.ps_fault_status)) ? 2 : 3);

export async function runIscSync(opt) {
  const o = opt || {};
  const job = o.job === "sites" ? "sites" : "kpi";
  const dry = o.dryRun !== false;
  const t0 = Date.now();
  const left = () => BUDGET_MS - (Date.now() - t0);
  const log = { started_at: iso(), finished_at: null, vendor: "isolarcloud", job, trigger: o.trigger || "manual", by: o.by || null, dry_run: dry, ok: false,
    created: 0, updated: 0, not_found: 0, dev_created: 0, dev_updated: 0, dev_not_found: 0, stations: 0, kpi_sites: 0, kpi_devices: 0,
    requests: 0, pending: 0, errors: [], note: "" };
  const res = { log, preview: null };
  const errRec = (e) => ({ at: iso(), api: (e && e.api) || "", failCode: e && e.code != null ? e.code : null, message: String(iscErrText(e)).slice(0, 300) });
  let c = null, lockOn = false, state = {};
  const st = {};
  if (!iscReady()) { log.note = "ยังไม่ได้ตั้ง ISOLARCLOUD_APPKEY / ACCESS_KEY / RSA_KEY / USER / PASS"; log.errors.push({ at: iso(), api: "", failCode: null, message: log.note }); return finish(); }

  try { state = (await rtdbGet("fsState/isc")) || {}; } catch (e) { log.errors.push(errRec(e)); return finish(); }
  const lf = state.login_fail;
  if (lf && log.trigger !== "manual" && log.trigger !== "tool" && Date.now() - (Date.parse(lf.at) || 0) < LOGIN_RETRY_MS) {
    log.note = "รอลองล็อกอินใหม่ (พลาดเมื่อ " + lf.at + ": " + (lf.text || "") + ")"; return finish(true);
  }
  if (!dry) {
    try {
      const cur = await rtdbEtag("fsState/isc/lock");
      if (cur.value && Date.now() - Date.parse(cur.value.at) < LOCK_MS) { log.note = "มีรอบซิงก์ Sungrow อื่นกำลังทำงาน"; return finish(true, true); }
      if (!(await rtdbSetIf("fsState/isc/lock", { at: iso(), job, trigger: log.trigger }, cur.etag))) { log.note = "มีรอบซิงก์ Sungrow อื่นกำลังทำงาน"; return finish(true, true); }
      lockOn = true;
    } catch (e) { log.errors.push(errRec(e)); return finish(); }
  }
  c = iscClient({ lastCallAt: Date.parse(state.last_call_at || "") || 0 });
  let sites = {}, devices = {};
  try { sites = (await rtdbGet("fsSites")) || {}; devices = (await rtdbGet("fsDevices")) || {}; } catch (e) { log.errors.push(errRec(e)); return finish(); }
  const preview = { create: [], update: [], changed: [], not_found: [], kpi: [] };
  res.preview = preview;
  const bkk = (ms) => { const x = new Date(ms + 7 * 3600e3).toISOString(); return { day: x.slice(0, 10), mon: x.slice(0, 7), hh: x.slice(11, 13) }; };
  const k = bkk(Date.now()), snapKey = k.day + " " + k.hh;
  const snap = dry || state.kpi_snap !== snapKey;       // ค่ารายชั่วโมง h/p/m จดเฉพาะรอบแรกของชั่วโมง (เหมือน Huawei)
  const now = iso();

  try {
    /* 1) รายชื่อไซต์ — มีผลิตวันนี้/สะสม/กำลังตอนนี้มาด้วย (คำขอเดียวได้ค่าทุกไซต์) · พลาด = โยนออก ไม่ตัดสิน "ไม่พบ" ผิด */
    const plants = await iscPlants(c);
    log.stations = plants.length;
    const idx = {};
    Object.keys(sites).forEach((id) => { const s = sites[id]; if (s && s.isc_ps_id != null && !s.merged_into) idx[String(s.isc_ps_id)] = id; });
    const patch = {}, dayP = {}, seen = {};
    plants.forEach((pl) => {
      const ps = String(pl.ps_id || ""); if (!ps || seen[ps]) return; seen[ps] = 1;
      let id = idx[ps];
      const isNew = !id;
      if (isNew) { id = iscSiteId(ps); Object.assign(patch, { [id + "/id"]: id, [id + "/created_at"]: now, [id + "/source"]: "isolarcloud", [id + "/isc_ps_id"]: ps }); }
      const cur = sites[id] || {};
      const kw = iscUnit(pl.total_capcity), name = pl.ps_name || ps;
      const addr = pl.ps_location && String(pl.ps_location).trim().length > 2 ? String(pl.ps_location).trim() : "";
      /* ไซต์ที่ไม่ได้ปักหมุดส่งพิกัดหลอกใกล้ 0,0 (ของจริง 0.0027, 0.0155) → ล้างทิ้ง */
      const lat = num(pl.latitude), lng = num(pl.longitude);
      const geoOk = lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(Math.abs(lat) <= 1 && Math.abs(lng) <= 1);
      Object.assign(patch, { [id + "/name"]: name, [id + "/capacity_kw"]: kw, [id + "/address"]: addr || cur.address || "",
        [id + "/fs_status"]: "found", [id + "/last_synced_at"]: now, [id + "/lat"]: geoOk ? lat : null, [id + "/lng"]: geoOk ? lng : null });
      if (pl.install_date) patch[id + "/grid_date"] = String(pl.install_date).slice(0, 10);
      const day = iscUnit(pl.today_energy), total = iscUnit(pl.total_energy), hs = iscHealth(pl);
      Object.assign(patch, { [id + "/day_kwh"]: day, [id + "/total_kwh"]: total, [id + "/health_state"]: hs, [id + "/kpi_updated_at"]: now,
        [id + "/isc_power_kw"]: iscUnit(pl.curr_power), [id + "/isc_alarm_count"]: num(pl.alarm_count), [id + "/isc_fault_count"]: num(pl.fault_count) });
      if (day != null) { dayP[id + "/" + k.day + "/kwh"] = day; if (snap) dayP[id + "/" + k.day + "/h/" + k.hh] = day; }
      if (isNew) { log.created++; preview.create.push({ id, code: ps, name }); }
      else {
        log.updated++; preview.update.push({ id, code: ps, name });
        if (cur.name !== name || num(cur.capacity_kw) !== kw || cur.fs_status !== "found") preview.changed.push({ id, code: ps, name });
      }
      sites[id] = Object.assign({}, cur, { id, isc_ps_id: ps, name, fs_status: "found" });
      idx[ps] = id; log.kpi_sites++;
      if (preview.kpi.length < 20) preview.kpi.push({ code: ps, name, day_kwh: day, total_kwh: total, power_kw: iscUnit(pl.curr_power), health_state: hs });
    });
    Object.keys(idx).forEach((ps) => {
      if (seen[ps]) return;
      const id = idx[ps];
      if ((sites[id] || {}).fs_status !== "not_found_in_fusionsolar") patch[id + "/fs_status"] = "not_found_in_fusionsolar";
      preview.not_found.push({ id, code: ps, name: (sites[id] || {}).name || "" }); log.not_found++;
    });
    if (!dry) { await writePatch("fsSites", patch); await writePatch("fsKpiDay", dayP); }

    /* 2) รายชื่ออุปกรณ์ — job sites ทุกไซต์ · job kpi เฉพาะไซต์ที่ยังไม่มีอุปกรณ์สักตัว (ไซต์ใหม่ขึ้นค่าได้ทันที) */
    const mine = (id) => String(id).startsWith("SG-") && devices[id] && devices[id].isc_ps_key;
    const hasDev = {}; Object.keys(devices).forEach((id) => { if (mine(id)) hasDev[devices[id].site_id] = 1; });
    for (const ps of Object.keys(seen)) {
      const sid = idx[ps];
      if (job !== "sites" && hasDev[sid]) continue;
      if (left() < 8000) { log.pending++; continue; }
      let list;
      try { list = await iscDevices(c, ps); } catch (e) { if (e.fatal) throw e; log.errors.push(errRec(e)); continue; }
      const dp = {}, got = {};
      list.forEach((d) => {
        if (!d || !d.ps_key) return;
        const id = devId(d.ps_key), t = num(d.device_type); got[id] = 1;
        devices[id] ? log.dev_updated++ : log.dev_created++;
        Object.assign(dp, { [id + "/isc_ps_key"]: String(d.ps_key), [id + "/site_id"]: sid, [id + "/station_code"]: iscSiteId(ps),
          [id + "/dev_name"]: d.device_name || "", [id + "/dev_type_id"]: ISC_TYPE[t] != null ? ISC_TYPE[t] : null,
          [id + "/isc_device_type"]: t, [id + "/isc_type_name"]: d.type_name || "", [id + "/esn_code"]: d.device_sn || "",
          [id + "/model"]: d.device_model_code || "", [id + "/fs_status"]: "found", [id + "/last_synced_at"]: now });
        devices[id] = Object.assign({}, devices[id] || {}, { isc_ps_key: String(d.ps_key), site_id: sid, isc_device_type: t, dev_name: d.device_name || "", fs_status: "found" });
      });
      Object.keys(devices).forEach((id) => {
        if (got[id] || !mine(id) || devices[id].site_id !== sid) return;
        if (devices[id].fs_status !== "not_found_in_fusionsolar") dp[id + "/fs_status"] = "not_found_in_fusionsolar";
        log.dev_not_found++;
      });
      if (!dry) await writePatch("fsDevices", dp);
    }
    if (job === "sites" && !dry) st.last_sites_at = iso();

    /* 3) ค่าอุปกรณ์ตอนนี้ — device_type เดียวต่อคำขอ ทีละ 100 */
    const byType = {};
    Object.keys(devices).forEach((id) => {
      const d = devices[id];
      if (!mine(id) || d.fs_status === "not_found_in_fusionsolar" || ![1, 7, 9].includes(d.isc_device_type)) return;
      if ((sites[d.site_id] || {}).fs_status !== "found") return;
      (byType[d.isc_device_type] = byType[d.isc_device_type] || []).push(id);
    });
    const PTS = { 1: INV_PTS, 7: MET_PTS, 9: LOG_PTS }, CONV = { 1: iscInvKpi, 7: iscMeterKpi, 9: iscLoggerKpi };
    const month = {};
    for (const t of Object.keys(byType)) {
      for (const ids of chunk(byType[t], BATCH)) {
        if (left() < 6000) { log.pending++; continue; }
        let rows;
        try { rows = await iscRealtime(c, t, ids.map((id) => devices[id].isc_ps_key), PTS[t]); }
        catch (e) { if (e.fatal) throw e; log.errors.push(errRec(e)); continue; }
        const dp = {}, kd = {}, at = iso();
        rows.forEach((p) => {
          const id = devId(p.ps_key); if (!devices[id]) return;
          const kpi = CONV[t](p), sid = devices[id].site_id;
          const raw = {}; Object.keys(p).forEach((x) => { if (/^p\d+$/.test(x) || x === "device_time" || x === "dev_fault_status" || x === "dev_status") raw[x] = p[x]; });
          Object.assign(dp, { [id + "/last_kpi_json"]: JSON.stringify(kpi), [id + "/isc_raw_json"]: JSON.stringify(raw), [id + "/last_kpi_at"]: at });
          if (snap && +t === 1 && kpi.active_power != null) kd[sid + "/" + k.day + "/p/" + k.hh + "/" + id] = kpi.active_power;
          if (snap && +t === 7 && kpi.active_cap != null && kpi.reverse_active_cap != null) kd[sid + "/" + k.day + "/m/" + k.hh + "/" + id] = { a: kpi.active_cap, r: kpi.reverse_active_cap };
          if (+t === 1 && kpi.month_cap != null) month[sid] = (month[sid] || 0) + kpi.month_cap;
          log.kpi_devices++;
          if (preview.kpi.length < 30) preview.kpi.push({ devId: id, dev_name: devices[id].dev_name || "", isc_device_type: +t, kpi });
        });
        if (!dry) { await writePatch("fsDevices", dp); await writePatch("fsKpiDay", kd); }
      }
    }
    /* ผลิตเดือนนี้ = รวม "Yield this month" (p87) ของอินเวอร์เตอร์ (รายชื่อไซต์ไม่มีค่าเดือน · logger ไม่ส่ง p10593) */
    const mp = {}, mon = {};
    Object.keys(month).forEach((sid) => { mp[sid + "/month_kwh"] = r3(month[sid]); mon[sid + "/" + k.mon] = r3(month[sid]); });
    if (!dry) { await writePatch("fsSites", mp); await writePatch("fsKpiMonth", mon); st.last_kpi_at = iso(); if (snap && !log.pending) st.kpi_snap = snapKey; }
  } catch (e) {
    log.errors.push(errRec(e));
    if (e && e.fatal) {
      log.note = iscErrText(e) + " — หยุดทั้งรอบ";
      st.login_fail = { since: (lf && lf.since) || iso(), at: iso(), failCode: e.code, message: String(e.message || "").slice(0, 200), text: "ล็อกอิน iSolarCloud ไม่ผ่าน: " + iscErrText(e) };
    }
  }
  if (c && c.loggedIn && lf) st.login_fail = null;
  return finish();

  async function finish(skipped, busy) {
    log.requests = c ? c.calls : 0;
    log.finished_at = iso();
    log.ok = !log.errors.length || !!skipped;
    log.ms = Date.now() - t0;
    if (skipped) res.skipped = true;
    if (busy) res.busy = true;
    if (dry) return res;
    const key = "L" + t0 + "i";                         // ต่อท้าย i ไม่ชน log ของ Huawei ที่เริ่มมิลลิวินาทีเดียวกัน
    try {
      log.id = key;
      if (skipped) { log.skipped = true; await rtdbSet("fsSyncLogs/" + key, log); return res; }
      st.last_call_at = c && c.last ? new Date(c.last).toISOString() : state.last_call_at || null;
      if (o.approve) { st.approved_at = iso(); st.approved_by = o.by || null; }
      await rtdbUpdate("fsState/isc", st);
      await rtdbSet("fsSyncLogs/" + key, log);
    } catch (e) { log.errors.push(errRec(e)); log.ok = false; }
    if (lockOn) await rtdbSet("fsState/isc/lock", null).catch(() => {});
    return res;
  }
}
async function writePatch(root, patch) {
  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += 400) { const part = {}; keys.slice(i, i + 400).forEach((x) => { part[x] = patch[x]; }); await rtdbUpdate(root, part); }
}
