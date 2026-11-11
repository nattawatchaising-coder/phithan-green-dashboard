/* เทสต์ /api/mikrotik/site — ไม่แตะ Firebase/Google จริง: fetch ถูกแทนด้วยฐานข้อมูลในหน่วยความจำ
   + ใบรับรอง ID token ที่เซ็นเองในเทสต์ · รัน: npm test */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const PROJECT = "mt-test-project";
const RTDB = "https://mt-test.example.firebaseio.com";
const { privateKey: saKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const idKey = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const ENC = crypto.randomBytes(32).toString("base64");

process.env.RTDB_URL = RTDB;
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
  client_email: "sa@" + PROJECT + ".iam.gserviceaccount.com", project_id: PROJECT,
  private_key: saKey.export({ type: "pkcs8", format: "pem" }),
});

/* ---------- ฐานข้อมูลปลอม (REST ของ RTDB: GET/PUT/PATCH/DELETE + ETag/if-match) ---------- */
let db = {};
const calls = [];
const getAt = (p) => p.split("/").filter(Boolean).reduce((o, k) => (o == null ? null : o[k] ?? null), db);
function setAt(p, v) {
  const ks = p.split("/").filter(Boolean);
  let o = db;
  ks.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] == null) o[k] = {}; o = o[k]; });
  if (v == null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v;
}
const etagOf = (v) => crypto.createHash("sha1").update(JSON.stringify(v ?? null)).digest("hex");
const res = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...headers } });

globalThis.fetch = async (url, opt = {}) => {
  url = String(url);
  const method = (opt.method || "GET").toUpperCase();
  calls.push(method + " " + url);
  if (url.startsWith("https://oauth2.googleapis.com/token")) return res({ access_token: "fake", expires_in: 3600 });
  if (url.includes("securetoken@system.gserviceaccount.com")) return res({ k1: idKey.publicKey.export({ type: "spki", format: "pem" }) });
  if (url.startsWith(RTDB)) {
    const path = decodeURIComponent(url.slice(RTDB.length).replace(/\.json.*$/, ""));
    const h = opt.headers || {};
    if (method === "GET") return res(getAt(path), 200, h["x-firebase-etag"] ? { etag: etagOf(getAt(path)) } : {});
    if (method === "PUT") {
      if (h["if-match"] && h["if-match"] !== etagOf(getAt(path))) return res({ error: "etag" }, 412);
      setAt(path, JSON.parse(opt.body)); return res(JSON.parse(opt.body));
    }
    if (method === "PATCH") { const cur = getAt(path) || {}; setAt(path, { ...cur, ...JSON.parse(opt.body) }); return res({}); }
    if (method === "DELETE") { setAt(path, null); return res(null); }
  }
  throw new Error("fetch ที่ไม่คาดไว้: " + method + " " + url);
};

function idToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = enc({ alg: "RS256", kid: "k1" }) + "." + enc({ aud: PROJECT, iss: "https://securetoken.google.com/" + PROJECT, sub: uid, iat: now, exp: now + 600 });
  return head + "." + crypto.createSign("RSA-SHA256").update(head).sign(idKey.privateKey).toString("base64url");
}

const { wgKeypair, wgPublicOf, unseal } = await import("../api/_lib/mikrotik.mjs");
const SERVER = wgKeypair();
function setEnv(on) {
  if (on) {
    process.env.MT_WG_ENDPOINT = "vpn.example.com:51820";
    process.env.MT_WG_SERVER_PUBKEY = SERVER.publicKey;
    process.env.MT_ENC_KEY = ENC;
  } else { delete process.env.MT_WG_ENDPOINT; delete process.env.MT_WG_SERVER_PUBKEY; delete process.env.MT_ENC_KEY; }
}
const api = await import("../api/mikrotik/site.mjs");
const call = async (payload, uid = "u-admin") => {
  const r = await api.POST(new Request("http://x/api/mikrotik/site", { method: "POST",
    headers: uid ? { authorization: "Bearer " + idToken(uid) } : {}, body: JSON.stringify(payload) }));
  return { status: r.status, body: await r.json() };
};

test.beforeEach(() => {
  db = { users: { "u-admin": { id: "u-admin", name: "แอดมิน", roles: ["admin"] }, "u-tech": { id: "u-tech", name: "ช่าง", role: "tech" },
    "u-off": { id: "u-off", roles: ["admin"], active: false } } };
  setEnv(true);
});

test("GET บอกแค่ env ที่ขาด ไม่บอกค่า", async () => {
  setEnv(false);
  let j = await (await api.GET()).json();
  assert.equal(j.configured, false);
  assert.deepEqual(j.missing, ["MT_WG_ENDPOINT", "MT_WG_SERVER_PUBKEY", "MT_ENC_KEY"]);
  setEnv(true);
  j = await (await api.GET()).json();
  assert.deepEqual(j, { configured: true, missing: [] });
});

test("ต้องล็อกอิน · ต้องเป็นแอดมิน · บัญชีปิดใช้ไม่ได้", async () => {
  assert.equal((await call({ action: "create", n: 1, name: "A" }, null)).status, 401);
  assert.equal((await call({ action: "create", n: 1, name: "A" }, "u-tech")).status, 403);
  assert.equal((await call({ action: "create", n: 1, name: "A" }, "u-off")).status, 403);
  assert.equal((await call({ action: "create", n: 1, name: "A" }, "u-nobody")).status, 403);
  assert.equal(db.mtSites, undefined);
});

test("สร้างไซต์: บันทึกทะเบียน + secret เข้ารหัส · เลขซ้ำได้ 409", async () => {
  const r = await call({ action: "create", n: 7, name: "ThaiSteel", note: "โรงงานบางนา" });
  assert.equal(r.status, 200);
  const s = db.mtSites[7];
  assert.equal(s.name, "ThaiSteel");
  assert.equal(s.wg_ip, "10.99.0.17");
  assert.equal(s.lan, "10.10.7.0/24");
  assert.equal(s.created_by, "แอดมิน");
  const sec = db.mtSecrets[7];
  assert.match(sec.wg_priv, /^v1\./);
  const priv = unseal(sec.wg_priv, "mt/7/wg_priv", ENC);
  assert.equal(wgPublicOf(priv), s.wg_pub);
  assert.ok(!JSON.stringify(db.mtSites).includes(priv), "private key ห้ามอยู่ใน mtSites");
  assert.ok(!JSON.stringify(r.body).includes(priv), "create ห้ามส่ง private key กลับ");

  const dup = await call({ action: "create", n: 7, name: "Other" });
  assert.equal(dup.status, 409);
  assert.equal(db.mtSites[7].name, "ThaiSteel");
  assert.equal(db.mtSecrets[7].wg_priv, sec.wg_priv, "เลขซ้ำต้องไม่ทับ secret เดิม");
});

test("ตรวจค่าที่ส่งมา", async () => {
  for (const n of [0, 245, "x", 1.5]) assert.equal((await call({ action: "create", n, name: "A" })).status, 400, String(n));
  for (const name of ["", "มีไทย", 'a"b', "-a"]) assert.equal((await call({ action: "create", n: 3, name })).status, 400, name);
  assert.equal((await call({ action: "what", n: 3 })).status, 404);
});

test("ยังไม่ตั้ง env: สร้าง/ขอสคริปต์ไม่ได้ (503)", async () => {
  setEnv(false);
  const r = await call({ action: "create", n: 2, name: "A" });
  assert.equal(r.status, 503);
  assert.equal(r.body.need_env, true);
});

test("ขอสคริปต์: ได้ .rsc + peer ที่ตรงกับคีย์ที่เก็บ", async () => {
  await call({ action: "create", n: 9, name: "Plant9" });
  const r = await call({ action: "script", n: 9 });
  assert.equal(r.status, 200);
  assert.equal(r.body.filename, "SITE09-Plant9.rsc");
  const priv = unseal(db.mtSecrets[9].wg_priv, "mt/9/wg_priv", ENC);
  const pass = unseal(db.mtSecrets[9].web_pass, "mt/9/web_pass", ENC);
  assert.ok(r.body.rsc.includes(`private-key="${priv}"`));
  assert.ok(r.body.rsc.includes(`public-key="${SERVER.publicKey}"`));
  assert.ok(r.body.rsc.includes(`password="${pass}"`));
  assert.ok(!r.body.rsc.includes(SERVER.privateKey));
  assert.ok(r.body.peer.includes("PublicKey = " + db.mtSites[9].wg_pub));
  assert.ok(r.body.peer.includes("AllowedIPs = 10.99.0.19/32, 10.10.9.0/24"));
  assert.ok(db.mtSites[9].script_at);
  assert.equal((await call({ action: "script", n: 9 }, "u-tech")).status, 403);
});

test("MT_ENC_KEY เปลี่ยน → ขอสคริปต์ได้ 409 ไม่พัง", async () => {
  await call({ action: "create", n: 4, name: "A" });
  process.env.MT_ENC_KEY = crypto.randomBytes(32).toString("base64");
  const r = await call({ action: "script", n: 4 });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /ถอดรหัส/);
});

test("สร้างคีย์ใหม่: public key เปลี่ยน secret เปลี่ยน", async () => {
  await call({ action: "create", n: 11, name: "A" });
  const before = { pub: db.mtSites[11].wg_pub, sec: db.mtSecrets[11].wg_priv };
  const r = await call({ action: "rotate", n: 11 });
  assert.equal(r.status, 200);
  assert.notEqual(db.mtSites[11].wg_pub, before.pub);
  assert.notEqual(db.mtSecrets[11].wg_priv, before.sec);
  assert.equal(wgPublicOf(unseal(db.mtSecrets[11].wg_priv, "mt/11/wg_priv", ENC)), db.mtSites[11].wg_pub);
});

test("แก้ชื่อ/หมายเหตุ ไม่แตะคีย์ · ลบไซต์ลบทั้งสองโหนด", async () => {
  await call({ action: "create", n: 12, name: "A" });
  const pub = db.mtSites[12].wg_pub;
  assert.equal((await call({ action: "edit", n: 12, name: "B", note: "x" })).status, 200);
  assert.equal(db.mtSites[12].name, "B");
  assert.equal(db.mtSites[12].wg_pub, pub);
  assert.equal((await call({ action: "remove", n: 12 })).status, 200);
  assert.equal(db.mtSites[12], undefined);
  assert.equal(db.mtSecrets[12], undefined);
  assert.equal((await call({ action: "script", n: 12 })).status, 404);
});

test("ไม่มีการยิงออกไปที่อื่นนอกจาก Google token/certs และฐานข้อมูลปลอม", () => {
  for (const c of calls) assert.match(c, /oauth2\.googleapis\.com|securetoken|mt-test\.example\.firebaseio\.com/);
});
