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
  let token = "", dead = null, last = Number(o.lastCallAt) || 0, calls = 0;
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
    token = rd.token;
    return rd;
  }

  async function call(api, params) {
    if (!token) await login();
    let j = await raw(api, params);
    if (String(j.result_code) !== "1" && /token/i.test(j.result_msg || "")) { token = ""; await login(); j = await raw(api, params); }
    if (String(j.result_code) !== "1") throw bad(api, j);
    return j.result_data;
  }

  return { call, login, get calls() { return calls; }, get last() { return last; } };
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
