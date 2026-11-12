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
let RULES_PLACED = true;
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
  /* ตรวจกฎตอนพาร์ทเนอร์ล็อกอิน: แลกใบผ่าน → ลองอ่าน users ด้วยสิทธิ์พาร์ทเนอร์ */
  if (url.startsWith("https://identitytoolkit.googleapis.com/")) return res({ idToken: "partner-id-token" });
  if (url.startsWith(RTDB) && url.includes("auth=")) return RULES_PLACED ? res({ error: "Permission denied" }, 401) : res({ "u-admin": true });
  if (url.startsWith(RTDB)) {
    const path = decodeURIComponent(url.slice(RTDB.length).replace(/\.json.*$/, ""));
    const h = opt.headers || {};
    if (method === "GET") return res(getAt(path), 200, h["x-firebase-etag"] ? { etag: etagOf(getAt(path)) } : {});
    if (method === "PUT") {
      if (h["if-match"] && h["if-match"] !== etagOf(getAt(path))) return res({ error: "etag" }, 412);
      setAt(path, JSON.parse(opt.body)); return res(JSON.parse(opt.body));
    }
    /* PATCH ของ RTDB: คีย์มี / = อัปเดตหลายที่ · null = ลบ */
    if (method === "PATCH") { for (const [k, v] of Object.entries(JSON.parse(opt.body))) setAt(path + "/" + k, v); return res({}); }
    if (method === "DELETE") { setAt(path, null); return res(null); }
  }
  throw new Error("fetch ที่ไม่คาดไว้: " + method + " " + url);
};

function idToken(uid) {
  const now = Math.floor(Date.now() / 1000);
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const extra = /^p-/.test(uid) ? { ext: true, roles: ["partner"] } : {};
  const head = enc({ alg: "RS256", kid: "k1" }) + "." + enc(Object.assign({ aud: PROJECT, iss: "https://securetoken.google.com/" + PROJECT, sub: uid, iat: now, exp: now + 600 }, extra));
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

/* ---------- คำสั่งบรรทัดเดียว: โทเคนใช้ครั้งเดียว → hEX ดึงสคริปต์เอง ---------- */
const rscApi = await import("../api/mikrotik/rsc.mjs");
const fetchRsc = async (t) => {
  const r = await rscApi.GET(new Request("https://flashsolar.vercel.app/api/mikrotik/rsc?t=" + encodeURIComponent(t)));
  return { status: r.status, text: await r.text() };
};
const tokenOf = (cmd) => /[?&]t=([A-Za-z0-9_-]+)"/.exec(cmd)[1];

test("fetch-token: ได้คำสั่ง /tool fetch + /import + ลบไฟล์ · เก็บแค่ hash ของโทเคน", async () => {
  await call({ action: "create", n: 21, name: "Fetch" });
  const r = await call({ action: "fetch-token", n: 21 });
  assert.equal(r.status, 200);
  const t = tokenOf(r.body.command);
  assert.match(r.body.command, /^\/tool fetch url="http:\/\/x\/api\/mikrotik\/rsc\?t=[A-Za-z0-9_-]{43}" check-certificate=yes-without-crl dst-path=pg-setup\.rsc; \/import file-name=pg-setup\.rsc verbose=yes; \/file remove pg-setup\.rsc$/);
  assert.ok(r.body.command_nocheck.includes("check-certificate=no"));
  assert.ok(r.body.peer.includes("AllowedIPs = 10.99.0.31/32, 10.10.21.0/24"));
  assert.ok(r.body.exp > Date.now() + 14 * 60e3 && r.body.exp <= Date.now() + 15 * 60e3);
  assert.ok(!JSON.stringify(db).includes(t), "ห้ามเก็บโทเคนตัวจริงในฐาน");
  assert.equal(Object.keys(db.mtSecrets.fetch).length, 1);
  assert.equal((await call({ action: "fetch-token", n: 21 }, "u-tech")).status, 403);
});

test("rsc: โทเคนถูก = ได้สคริปต์ครั้งเดียว · ใช้ซ้ำ/ผิด = 404 :error", async () => {
  await call({ action: "create", n: 22, name: "Once" });
  const t = tokenOf((await call({ action: "fetch-token", n: 22 })).body.command);
  const a = await fetchRsc(t);
  assert.equal(a.status, 200);
  assert.ok(a.text.includes('/system identity set name="SITE22-Once"'));
  const priv = unseal(db.mtSecrets[22].wg_priv, "mt/22/wg_priv", ENC);
  assert.ok(a.text.includes(priv));
  assert.equal(db.mtSites[22].script_by, "hEX fetch");
  const b = await fetchRsc(t);
  assert.equal(b.status, 404);
  assert.match(b.text, /^:error "/);
  assert.ok(!b.text.includes(priv));
  for (const bad of ["", "x", t.slice(0, -1) + (t.endsWith("A") ? "B" : "A"), "../../users"]) assert.equal((await fetchRsc(bad)).status, 404, bad);
});

test("rsc: หมดอายุ 15 นาที = 404 · ไซต์ถูกลบ = 404", async () => {
  await call({ action: "create", n: 23, name: "Old" });
  const t = tokenOf((await call({ action: "fetch-token", n: 23 })).body.command);
  const h = Object.keys(db.mtSecrets.fetch)[0];
  db.mtSecrets.fetch[h].exp = Date.now() - 1;
  assert.equal((await fetchRsc(t)).status, 404);
  const t2 = tokenOf((await call({ action: "fetch-token", n: 23 })).body.command);
  await call({ action: "remove", n: 23 });
  assert.equal((await fetchRsc(t2)).status, 404);
});

test("fetch-token เก็บกวาดโทเคนหมดอายุ", async () => {
  await call({ action: "create", n: 24, name: "Gc" });
  db.mtSecrets.fetch = { old1: { n: 24, exp: Date.now() - 1000 }, old2: { n: 24, exp: 0 } };
  await call({ action: "fetch-token", n: 24 });
  assert.deepEqual(Object.keys(db.mtSecrets.fetch).filter((k) => k.startsWith("old")), []);
  assert.equal(Object.keys(db.mtSecrets.fetch).length, 1);
});

test("info: บอก IP ของ VPS เฉพาะแอดมิน (ใช้เติมคำสั่ง ssh ในคู่มือ)", async () => {
  const r = await call({ action: "info" });
  assert.equal(r.status, 200);
  assert.equal(r.body.server_host, "vpn.example.com");
  assert.equal((await call({ action: "info" }, "u-tech")).status, 403);
  assert.equal((await call({ action: "info" }, null)).status, 401);
});

/* ---------- เฟส 2: ยืนยันใบรับรอง · คิวคำสั่ง · ช่องทางของ agent ---------- */
/* agent เรียกผ่าน site.mjs?agent=1 (Vercel ฟรีจำกัด 12 ฟังก์ชัน) */
const agentLib = await import("../tools/mt-agent/agent.mjs");
const AGENT_KEY = "k".repeat(40), CMD_SECRET = "s".repeat(40);
const FP = "987d738d" + "0".repeat(56);
const agentCall = async (payload, key = AGENT_KEY) => {
  const r = await api.POST(new Request("http://x/api/mikrotik/site?agent=1", { method: "POST",
    headers: key ? { authorization: "Bearer " + key } : {}, body: JSON.stringify(payload || {}) }));
  return { status: r.status, body: await r.json() };
};
const withAgentEnv = () => { process.env.MT_AGENT_KEY = AGENT_KEY; process.env.MT_CMD_SECRET = CMD_SECRET; };

test("pin-fp: รับ fingerprint ได้ทั้งแบบมี : และตัวใหญ่ · ผิดรูป 400 · ว่าง = ยกเลิก · ช่างทำไม่ได้", async () => {
  await call({ action: "create", n: 31, name: "Pin" });
  const withColon = FP.toUpperCase().match(/../g).join(":");
  assert.equal((await call({ action: "pin-fp", n: 31, fp: withColon })).status, 200);
  assert.equal(db.mtSites[31].fp, FP);
  assert.equal((await call({ action: "pin-fp", n: 31, fp: "abc" })).status, 400);
  assert.equal((await call({ action: "pin-fp", n: 31, fp: FP }, "u-tech")).status, 403);
  assert.equal((await call({ action: "pin-fp", n: 31, fp: "" })).status, 200);
  assert.equal(db.mtSites[31].fp ?? null, null);
});

test("cmd: ต้องยืนยันใบรับรองก่อน · มีแค่ reboot/log · กดซ้ำได้คำสั่งเดิม · ลายเซ็นตรงกับที่ agent ตรวจ", async () => {
  withAgentEnv();
  await call({ action: "create", n: 32, name: "Cmd" });
  assert.equal((await call({ action: "cmd", n: 32, type: "reboot" })).status, 409);
  await call({ action: "pin-fp", n: 32, fp: FP });
  for (const type of ["set-ip", "firewall", "wireguard", "script", ""]) assert.equal((await call({ action: "cmd", n: 32, type })).status, 400, type);
  assert.equal((await call({ action: "cmd", n: 32, type: "reboot" }, "u-tech")).status, 403);
  const r = await call({ action: "cmd", n: 32, type: "reboot" });
  assert.equal(r.status, 200);
  const again = await call({ action: "cmd", n: 32, type: "reboot" });
  assert.equal(again.body.id, r.body.id);
  const c = db.mtCmd[r.body.id];
  assert.equal(c.state, "pending");
  assert.equal(agentLib.cmdOk(c, CMD_SECRET, new Set()), "", "agent ต้องยอมรับลายเซ็นจากเว็บ");
  assert.equal(agentLib.cmdOk(c, "x".repeat(40), new Set()), "ลายเซ็นไม่ถูก");
  assert.equal(agentLib.cmdOk(Object.assign({}, c, { type: "log" }), CMD_SECRET, new Set()), "ลายเซ็นไม่ถูก");
  assert.equal(agentLib.cmdOk(Object.assign({}, c, { n: 33 }), CMD_SECRET, new Set()), "ลายเซ็นไม่ถูก");
  assert.equal(agentLib.cmdOk(c, CMD_SECRET, new Set([c.id])), "ทำไปแล้ว");
  assert.equal(agentLib.cmdOk(c, CMD_SECRET, new Set(), c.ts + 11 * 60e3), "คำสั่งหมดอายุ");
  const g = await call({ action: "cmd-get", id: r.body.id });
  assert.equal(g.body.cmd.state, "pending");
  assert.equal(g.body.cmd.sig, undefined, "ไม่ส่งลายเซ็นให้เบราว์เซอร์");
});

test("agent: ต้องมี MT_AGENT_KEY ถูก · env ไม่ครบ = 503", async () => {
  delete process.env.MT_AGENT_KEY;
  assert.equal((await agentCall({})).status, 503);
  withAgentEnv();
  assert.equal((await agentCall({}, null)).status, 401);
  assert.equal((await agentCall({}, "k".repeat(39) + "x")).status, 401);
  assert.equal((await agentCall({})).status, 200);
});

test("agent: รหัสส่งเฉพาะไซต์ที่ยืนยันใบรับรอง · สถานะลง mtStatus · คำสั่งส่งครั้งเดียว · ผล log ลง mtCmd", async () => {
  withAgentEnv();
  await call({ action: "create", n: 41, name: "Pinned" });
  await call({ action: "create", n: 42, name: "NotYet" });
  await call({ action: "pin-fp", n: 41, fp: FP });
  const pass41 = unseal(db.mtSecrets[41].web_pass, "mt/41/web_pass", ENC);
  const id = (await call({ action: "cmd", n: 41, type: "log" })).body.id;

  const peek = await agentCall({ peek: true });
  assert.deepEqual(peek.body.cmds, []);
  assert.equal(db.mtCmd[id].state, "pending", "peek ห้ามหยิบคำสั่ง");

  const a = await agentCall({ status: { sites: { 41: { wg: { hs: 1 }, "bad.key": 1, res: { cpu: 3 } }, 42: { tls: { fp: FP } }, 99: { x: 1 } } } });
  assert.equal(a.status, 200);
  const s41 = a.body.sites.find((s) => s.n === 41), s42 = a.body.sites.find((s) => s.n === 42);
  assert.equal(s41.pass, pass41);
  assert.equal(s41.fp, FP);
  assert.equal(s42.pass, undefined, "ยังไม่ยืนยันใบรับรอง ห้ามส่งรหัส");
  assert.equal(db.mtStatus[41].res.cpu, 3);
  assert.equal(db.mtStatus[41]["bad.key"], undefined);
  assert.equal(db.mtStatus[99], undefined, "ไซต์ที่ไม่มีในทะเบียนไม่บันทึก");
  assert.ok(db.mtStatus._agent.at);
  assert.equal(a.body.cmds.length, 1);
  assert.equal(a.body.cmds[0].id, id);
  assert.equal(db.mtCmd[id].state, "sent");
  assert.equal((await agentCall({})).body.cmds.length, 0, "คำสั่งเดียวกันห้ามส่งซ้ำ");

  await agentCall({ results: [{ id, ok: true, data: [{ time: "10:00", topics: "system,info", message: "hello" }] }] });
  assert.equal(db.mtCmd[id].state, "done");
  assert.equal(db.mtCmd[id].data[0].message, "hello");
  /* ผลซ้ำ/ผลของคำสั่งที่ไม่ได้ส่ง = ไม่สนใจ */
  await agentCall({ results: [{ id, ok: false, error: "x" }] });
  assert.equal(db.mtCmd[id].state, "done");
  /* ลบไซต์ = ลบสถานะด้วย */
  await call({ action: "remove", n: 41 });
  assert.equal(db.mtStatus[41], undefined);
});

test("agent: คำสั่งค้างเกิน 10 นาที = expired ไม่ส่ง · จบเกิน 1 วัน = เก็บกวาด", async () => {
  withAgentEnv();
  await call({ action: "create", n: 43, name: "Old" });
  db.mtCmd = { oldpend: { n: 43, type: "reboot", ts: Date.now() - 11 * 60e3, state: "pending" },
    olddone: { n: 43, type: "log", ts: Date.now() - 25 * 3600e3, state: "done" } };
  const r = await agentCall({});
  assert.equal(r.body.cmds.length, 0);
  assert.equal(db.mtCmd.oldpend.state, "expired");
  assert.equal(db.mtCmd.olddone, undefined);
});

const agentLib2 = await import("../api/_lib/mtagent.mjs");
/* ---------- เฟส 3: มิเตอร์ · บิลรายเดือน ---------- */
test("meter: ค่ามิเตอร์ snap → ราย 5 นาที (เวลาไทย) + first/last ของวัน · ไม่ snap = ไม่เก็บประวัติ", async () => {
  withAgentEnv();
  await call({ action: "create", n: 51, name: "Meter" });
  const v = { kw: 12.5, kwh_imp: 1000.5, kwh_exp: 2, kwh_net: 998.5, v1: 230.1, junk: 9 };
  await agentCall({ status: { sites: { 51: { meter: { modbus: { ok: true }, v } } } } });
  assert.equal(db.mtMeter, undefined, "ไม่มี snap ห้ามเก็บ");
  await agentCall({ status: { snap: true, sites: { 51: { meter: { modbus: { ok: true }, v } } } } });
  const { day, hm } = agentLib2.thSlot(Date.now());
  assert.equal(db.mtMeter[51].h[day][hm].kwh_imp, 1000.5);
  assert.equal(db.mtMeter[51].h[day][hm].junk, undefined);
  assert.equal(db.mtMeter[51].d[day].first.kwh_imp, 1000.5);
  await agentCall({ status: { snap: true, sites: { 51: { meter: { modbus: { ok: true }, v: Object.assign({}, v, { kwh_imp: 1010, kw: 20 }) } } } } });
  assert.equal(db.mtMeter[51].d[day].first.kwh_imp, 1000.5, "first ของวันไม่ถูกทับ");
  assert.equal(db.mtMeter[51].d[day].last.kwh_imp, 1010);
  assert.equal(db.mtMeter[51].d[day].kw_max, 20);
});

test("thSlot: เวลาไทย · ปัดลงช่อง 5 นาที · ข้ามวันตอน 17:00 UTC", () => {
  assert.deepEqual(agentLib2.thSlot(Date.parse("2026-11-11T16:59:59Z")), { day: "20261111", hm: "2355" });
  assert.deepEqual(agentLib2.thSlot(Date.parse("2026-11-11T17:00:00Z")), { day: "20261112", hm: "0000" });
  assert.deepEqual(agentLib2.thSlot(Date.parse("2026-11-11T03:29:00Z")), { day: "20261111", hm: "1025" });
});

/* ข้อมูลมิเตอร์รายวันปลอม: 1 พ.ย. 1000 → 1 ธ.ค. 1250.5 */
const meterDays = () => ({ d: {
  "20261101": { first: { t: "0000", kwh_imp: 1000 }, last: { t: "2355", kwh_imp: 1008 } },
  "20261115": { first: { t: "0000", kwh_imp: 1100 }, last: { t: "2355", kwh_imp: 1110 } },
  "20261201": { first: { t: "0005", kwh_imp: 1250.5 }, last: { t: "2355", kwh_imp: 1260 } } } });

test("meter-cfg / bill-cfg / bill-save: เลขมิเตอร์เซิร์ฟเวอร์อ่านเอง แก้ได้แค่ราคา · คิดเงินที่เซิร์ฟเวอร์ · เก็บผู้ออกบิล", async () => {
  await call({ action: "create", n: 52, name: "Bill" });
  assert.equal((await call({ action: "meter-cfg", n: 52, meter_model: "pm2200", meter_unit: 3 })).status, 200);
  assert.equal(db.mtSites[52].meter_model, "pm2200");
  assert.equal((await call({ action: "meter-cfg", n: 52, meter_model: "xx" })).status, 400);
  assert.equal((await call({ action: "meter-cfg", n: 52, meter_model: "pm2200" }, "u-tech")).status, 403);
  assert.equal((await call({ action: "bill-cfg", n: 52, rate: 3.9, reg: "kwh_imp" })).status, 200);
  assert.equal(db.mtSites[52].bill.rate, 3.9);
  assert.equal((await call({ action: "bill-cfg", n: 52, rate: -1, reg: "kwh_imp" })).status, 400);
  assert.equal((await call({ action: "site-info", n: 52, info: { cust: "บจก. ทดสอบ", addr: "ชลบุรี", tax: "0105551234567", kwp: 500 } })).status, 200);
  assert.equal((await call({ action: "bill-save", n: 52, month: "2026-11" })).status, 400, "ยังไม่มีข้อมูลมิเตอร์ = บันทึกไม่ได้");
  db.mtMeter = { 52: meterDays() };
  /* ส่งเลขมาเองไม่มีผล — ใช้เลขจากมิเตอร์ */
  const r = await call({ action: "bill-save", n: 52, month: "2026-11", start: 0, end: 99999, amount: 1 });
  assert.equal(r.status, 200);
  const B = () => db.mtBills[52]["202611"];
  assert.deepEqual([B().start, B().end, B().kwh], [1000, 1250.5, 250.5]);
  assert.deepEqual([B().start_at, B().end_at], ["2026-11-01 00:00", "2026-12-01 00:05"]);
  assert.equal(B().amount, 976.95);
  assert.equal(B().vat, 68.39);
  assert.equal(B().total, 1045.34);
  assert.equal(B().no, "SITE52-202611");
  assert.equal(B().cust, "บจก. ทดสอบ");
  assert.equal(B().cust_tax, "0105551234567");
  assert.deepEqual([B().by, B().by_id, B().by_kind], ["แอดมิน", "u-admin", "staff"]);
  /* แก้ราคาตอนออกบิล + ปิด VAT ที่ตั้งค่าไซต์ → บันทึกทับ เก็บฉบับเดิมไว้ใน hist */
  await call({ action: "bill-cfg", n: 52, rate: 3.9, vat: false });
  await call({ action: "bill-save", n: 52, month: "2026-11", rate: 4, vat: true });
  assert.equal(B().rate, 4);
  assert.equal(B().vat, 0);
  assert.equal(B().total, 1002);
  assert.equal(Object.values(B().hist).length, 1);
  assert.equal(Object.values(B().hist)[0].total, 1045.34);
  assert.equal((await call({ action: "bill-save", n: 52, month: "2026-13" })).status, 400);
  assert.equal((await call({ action: "bill-save", n: 52, month: "2026-11" }, "u-tech")).status, 403);
});

test("bill-del: แอดมินลบบิลได้ (สำเนาไป mtSecrets/billTrash) · ช่าง/พาร์ทเนอร์ลบไม่ได้", async () => {
  await call({ action: "create", n: 53, name: "Del" });
  await call({ action: "bill-cfg", n: 53, rate: 4, reg: "kwh_imp" });
  db.mtMeter = { 53: meterDays() };
  assert.equal((await call({ action: "bill-save", n: 53, month: "2026-11" })).status, 200);
  assert.equal((await call({ action: "bill-del", n: 53, month: "2026-11" }, "u-tech")).status, 403);
  assert.equal((await call({ action: "bill-del", n: 53, month: "2026-10" })).status, 404);
  assert.equal((await call({ action: "bill-del", n: 53, month: "x" })).status, 400);
  assert.ok(db.mtBills[53]["202611"], "ยังอยู่");
  assert.equal((await call({ action: "bill-del", n: 53, month: "2026-11" })).status, 200);
  assert.equal((db.mtBills[53] || {})["202611"], undefined);
  const t = Object.entries(db.mtSecrets.billTrash);
  assert.equal(t.length, 1);
  assert.match(t[0][0], /^53-202611-\d+$/);
  assert.equal(t[0][1].kwh, 250.5);
  assert.equal(t[0][1].deleted_by, "แอดมิน");
});

test("billReadings: มิเตอร์ถูกรีเซ็ตกลางเดือน → นับจาก 0 ตั้งแต่วันรีเซ็ต", async () => {
  const { billReadings } = await import("../api/_lib/mikrotik.mjs");
  /* ปกติ ไม่รีเซ็ต */
  const a = billReadings(meterDays().d, "2026-11", "kwh_imp", null);
  assert.deepEqual([a.start, a.end, a.reset], [1000, 1250.5, false]);
  /* รีเซ็ตระหว่างวัน (12 พ.ย.: first 20456 → last 3) */
  const d1 = { "20261111": { first: { t: "0900", kwh_imp: 20400 }, last: { t: "2355", kwh_imp: 20450 } },
    "20261112": { first: { t: "0000", kwh_imp: 20450 }, last: { t: "2355", kwh_imp: 3 } },
    "20261130": { first: { t: "0000", kwh_imp: 200 }, last: { t: "2355", kwh_imp: 210 } } };
  const b = billReadings(d1, "2026-11", "kwh_imp", null);
  assert.deepEqual([b.start, b.end, b.reset, b.start_src, b.start_at], [0, 210, true, "รีเซ็ตมิเตอร์", "2026-11-12"]);
  /* รีเซ็ตข้ามคืน (วันถัดไป first ต่ำกว่า last วันก่อน) */
  const d2 = { "20261111": { first: { t: "0900", kwh_imp: 20400 }, last: { t: "2355", kwh_imp: 20450 } },
    "20261113": { first: { t: "0000", kwh_imp: 1 }, last: { t: "2355", kwh_imp: 9 } } };
  const c = billReadings(d2, "2026-11", "kwh_imp", null);
  assert.deepEqual([c.start, c.end, c.reset, c.start_at], [0, 9, true, "2026-11-13"]);
});

test("agent: kWh Export ติดลบจากมิเตอร์ → เก็บเป็นค่าบวก", async () => {
  withAgentEnv();
  await call({ action: "create", n: 54, name: "Exp" });
  await agentCall({ status: { snap: true, sites: { 54: { meter: { modbus: { ok: true }, v: { kwh_imp: 10, kwh_exp: -969.709, hz: 499.6 } } } } } });
  assert.equal(db.mtStatus[54].meter.v.kwh_exp, 969.709);
  assert.equal(db.mtStatus[54].meter.v.hz, 49.96, "agent รุ่นเก่าส่ง Hz ×10");
  const { day } = agentLib2.thSlot(Date.now());
  assert.equal(db.mtMeter[54].d[day].first.kwh_exp, 969.709);
});

test("agent ≤ v5: kW/kvar/kVA ของ LEOS เป็นวัตต์ → เซิร์ฟเวอร์หาร 1000 · v6 / PM2200 / ไม่บอกรุ่น = ไม่แตะ", async () => {
  withAgentEnv();
  await call({ action: "create", n: 55, name: "W" });
  await call({ action: "create", n: 56, name: "PM" });
  await call({ action: "meter-cfg", n: 56, meter_model: "pm2200" });
  const v = () => ({ kw: 6968.972, kw1: 6968.972, kvar: 161.387, kva: 6978.63, v1: 231.077, i1: 30.205, kwh_imp: 20459.436 });
  await agentCall({ ver: "5", status: { snap: true, sites: { 55: { meter: { modbus: { ok: true }, v: v() } }, 56: { meter: { modbus: { ok: true }, v: v() } } } } });
  const s = db.mtStatus[55].meter.v;
  assert.deepEqual([s.kw, s.kw1, s.kvar, s.kva, s.v1, s.i1, s.kwh_imp], [6.969, 6.969, 0.161, 6.979, 231.077, 30.205, 20459.436]);
  assert.equal(db.mtStatus[56].meter.v.kw, 6968.972, "PM2200 ไม่แตะ");
  const { day, hm } = agentLib2.thSlot(Date.now());
  assert.equal(db.mtMeter[55].h[day][hm].kw, 6.969);
  assert.equal(db.mtMeter[55].d[day].kw_max, 6.969);
  await agentCall({ ver: "6", status: { sites: { 55: { meter: { modbus: { ok: true }, v: { kw: 6.969 } } } } } });
  assert.equal(db.mtStatus[55].meter.v.kw, 6.969, "v6 ส่ง kW มาแล้ว ไม่หารซ้ำ");
});

test("พาร์ทเนอร์: แอดมินสร้าง+มอบไซต์ · ล็อกอินได้เมื่อวางกฎแล้วเท่านั้น · ทำได้แค่ไซต์ตัวเอง", async () => {
  await call({ action: "create", n: 60, name: "PA" });
  await call({ action: "create", n: 61, name: "PB" });
  db.mtMeter = { 60: meterDays(), 61: meterDays() };
  await call({ action: "bill-cfg", n: 60, rate: 4 });
  assert.equal((await call({ action: "partner-save", name: "นักลงทุน", username: "inv1", pin: "123", sites: [60] })).status, 400, "รหัสสั้นไป");
  assert.equal((await call({ action: "partner-save", name: "x", username: "admin", pin: "123456", sites: [] })).status, 409);
  assert.equal((await call({ action: "partner-save", name: "นักลงทุน", username: "inv1", pin: "secret99", sites: [60] }, "u-tech")).status, 403);
  const c = await call({ action: "partner-save", name: "นักลงทุน", username: "inv1", pin: "secret99", sites: [60] });
  assert.equal(c.status, 200);
  const pid = c.body.id;
  assert.match(pid, /^p-[0-9a-f]{16}$/);
  assert.equal(db.mtSites[60].owner, pid);
  assert.deepEqual(db.mtPartners[pid].sites, { 60: true });
  assert.ok(!JSON.stringify(db.mtPartners).includes("secret99"), "ไม่เก็บรหัสตรง ๆ");
  assert.match(db.mtSecrets.partners[pid].pin, /^s1./);
  assert.equal((await call({ action: "partner-save", name: "ซ้ำ", username: "INV1", pin: "secret99", sites: [] })).status, 409);

  /* ล็อกอินผ่าน /api/auth/login เดิม */
  const login = await import("../api/auth/login.mjs");
  const doLogin = async (u, pw) => { const r = await login.POST(new Request("http://x/api/auth/login", { method: "POST", body: JSON.stringify({ username: u, pin: pw }) })); return { status: r.status, body: await r.json() }; };
  assert.equal((await doLogin("inv1", "wrong")).status, 401);
  RULES_PLACED = false;
  const l0 = await doLogin("inv1", "secret99");
  assert.equal(l0.status, 503, "ยังไม่วางกฎ = ไม่ให้พาร์ทเนอร์เข้า");
  assert.ok(!l0.body.token);
  RULES_PLACED = true;
  const l1 = await doLogin("inv1", "secret99");
  assert.equal(l1.status, 200);
  assert.equal(l1.body.partner, true);
  const claims = JSON.parse(Buffer.from(l1.body.token.split(".")[1], "base64url").toString()).claims;
  assert.deepEqual(claims, { ext: true, roles: ["partner"] });

  /* พาร์ทเนอร์ทำได้: บริษัท+โลโก้ · ทะเบียนไซต์ · ราคา · บิล ของไซต์ตัวเอง */
  const logo = "data:image/png;base64," + Buffer.from("png").toString("base64");
  assert.equal((await call({ action: "company", company: { name: "บจก. พลังแดด", tax: "0105559999999", logo } }, pid)).status, 200);
  assert.equal(db.mtPartners[pid].company.logo, logo);
  assert.equal((await call({ action: "company", company: { logo: "data:text/html;base64,PHNjcmlwdD4=" } }, pid)).status, 400);
  assert.equal((await call({ action: "site-info", n: 60, info: { cust: "โรงงาน ก" } }, pid)).status, 200);
  assert.equal((await call({ action: "bill-cfg", n: 60, rate: 4.2, reg: "kwh_exp" }, pid)).status, 200);
  assert.equal(db.mtSites[60].bill.reg, "kwh_imp", "พาร์ทเนอร์เปลี่ยนช่องที่จดไม่ได้");
  const bs = await call({ action: "bill-save", n: 60, month: "2026-11" }, pid);
  assert.equal(bs.status, 200);
  const bill = db.mtBills[60]["202611"];
  assert.equal(bill.rate, 4.2);
  assert.equal(bill.issuer.name, "บจก. พลังแดด");
  assert.equal(bill.issuer.logo, undefined, "ไม่คัดลอกโลโก้ลงทุกบิล");
  assert.deepEqual([bill.by, bill.by_id, bill.by_kind], ["นักลงทุน", pid, "partner"]);
  /* ทำไม่ได้: ไซต์คนอื่น · งานแอดมิน · บัญชีถูกปิด */
  assert.equal((await call({ action: "bill-save", n: 61, month: "2026-11" }, pid)).status, 404);
  assert.equal((await call({ action: "site-info", n: 61, info: { cust: "x" } }, pid)).status, 404);
  for (const act of ["cmd", "pin-fp", "meter-cfg", "script", "remove", "edit", "partner-save", "info"])
    assert.equal((await call({ action: act, n: 60, type: "reboot" }, pid)).status, 403, act);
  assert.equal((await call({ action: "partner-pin", old: "wrong", pin: "newpass1" }, pid)).status, 403);
  assert.equal((await call({ action: "partner-pin", old: "secret99", pin: "newpass1" }, pid)).status, 200);
  assert.equal((await doLogin("inv1", "newpass1")).status, 200);
  /* ย้ายไซต์ 60 ไปพาร์ทเนอร์ใหม่ → คนเดิมหลุดสิทธิ์ */
  const c2 = await call({ action: "partner-save", name: "คนที่สอง", username: "inv2", pin: "secret22", sites: [60, 61] });
  assert.equal(db.mtSites[60].owner, c2.body.id);
  assert.ok(!(db.mtPartners[pid].sites || {})[60]);
  assert.equal((await call({ action: "bill-save", n: 60, month: "2026-11" }, pid)).status, 404);
  await call({ action: "partner-save", id: pid, name: "นักลงทุน", username: "inv1", active: false, sites: [] });
  assert.equal((await call({ action: "company", company: { name: "x" } }, pid)).status, 403);
  assert.equal((await doLogin("inv1", "newpass1")).status, 401);
});

test("agent ได้รุ่นมิเตอร์ของไซต์ไปด้วย", async () => {
  withAgentEnv();
  await call({ action: "create", n: 53, name: "Model" });
  await call({ action: "meter-cfg", n: 53, meter_model: "none", meter_unit: 1 });
  const r = await agentCall({ peek: true });
  assert.equal(r.body.sites.find((s) => s.n === 53).meter_model, "none");
});
