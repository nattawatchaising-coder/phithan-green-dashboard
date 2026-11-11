/* เทสต์ตัวสร้างสคริปต์ MikroTik (api/_lib/mikrotik.mjs) — รัน: npm test */
import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  MT, sitePlan, validN, validName, identityOf, parseEndpoint, isWgKey,
  wgKeypair, wgPublicOf, seal, unseal, randomPassword, buildRsc, buildServerPeer, mtMissingEnv,
} from "../api/_lib/mikrotik.mjs";

const KEY = crypto.randomBytes(32).toString("base64");
const site = () => {
  const kp = wgKeypair();
  const srv = wgKeypair();
  return {
    n: 5, name: "ThaiSteel", wgPrivateKey: kp.privateKey, serverPublicKey: srv.publicKey,
    endpoint: "vpn.example.com:51820", webPassword: randomPassword(24), _pub: kp.publicKey,
  };
};

test("แผน IP ตามที่ผู้ใช้กำหนด", () => {
  const p = sitePlan(5);
  assert.equal(p.lanNet, "10.10.5.0/24");
  assert.equal(p.router, "10.10.5.1");
  assert.equal(p.smartlogger, "10.10.5.10");
  assert.equal(p.gateway, "10.10.5.20");
  assert.equal(p.poolFrom, "10.10.5.100");
  assert.equal(p.poolTo, "10.10.5.200");
  assert.equal(p.wgIp, "10.99.0.15");
  assert.equal(sitePlan(244).wgIp, "10.99.0.254");
});

test("เลขไซต์ N อยู่ในช่วง 1–244 เท่านั้น", () => {
  for (const ok of [1, 12, 244]) assert.ok(validN(ok));
  for (const bad of [0, -1, 245, 1.5, NaN, "5"]) assert.ok(!validN(bad), String(bad));
  assert.throws(() => sitePlan(245));
});

test("ชื่อไซต์และ identity", () => {
  assert.equal(identityOf(5, "ThaiSteel"), "SITE05-ThaiSteel");
  assert.equal(identityOf(123, "A"), "SITE123-A");
  for (const ok of ["ThaiSteel", "abc-123", "A"]) assert.ok(validName(ok), ok);
  for (const bad of ["", "-abc", "มีไทย", 'a"b', "a b", "a$b", "x".repeat(25), "a;b"]) assert.ok(!validName(bad), bad);
});

test("endpoint: รับ host[:port] กัน ตัวอักษรแทรกคำสั่ง", () => {
  assert.deepEqual(parseEndpoint("vpn.example.com"), { host: "vpn.example.com", port: 51820 });
  assert.deepEqual(parseEndpoint("1.2.3.4:5000"), { host: "1.2.3.4", port: 5000 });
  assert.deepEqual(parseEndpoint("[2001:db8::1]:51820"), { host: "2001:db8::1", port: 51820 });
  for (const bad of ["", "a b", 'x" ; /system reset', "host:0", "host:70000", "host:abc"]) assert.equal(parseEndpoint(bad), null, bad);
});

test("คีย์ WireGuard: คู่คีย์ถูกต้อง + ตรง test vector RFC 7748", () => {
  const kp = wgKeypair();
  assert.ok(isWgKey(kp.privateKey) && isWgKey(kp.publicKey));
  assert.equal(wgPublicOf(kp.privateKey), kp.publicKey);
  const alicePriv = Buffer.from("77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a", "hex").toString("base64");
  const alicePub = Buffer.from("8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a", "hex").toString("base64");
  assert.equal(wgPublicOf(alicePriv), alicePub);
  assert.notEqual(wgKeypair().privateKey, kp.privateKey);
});

test("เข้ารหัส/ถอดรหัส secret · aad ผิด/กุญแจผิด/แก้ข้อมูล = ถอดไม่ได้", () => {
  const box = seal("secret-123", "mt/5/wg_priv", KEY);
  assert.match(box, /^v1\./);
  assert.ok(!box.includes("secret-123"));
  assert.equal(unseal(box, "mt/5/wg_priv", KEY), "secret-123");
  assert.throws(() => unseal(box, "mt/6/wg_priv", KEY));
  assert.throws(() => unseal(box, "mt/5/wg_priv", crypto.randomBytes(32).toString("base64")));
  const p = box.split("."); p[3] = Buffer.from("x" + Buffer.from(p[3], "base64url").toString()).toString("base64url");
  assert.throws(() => unseal(p.join("."), "mt/5/wg_priv", KEY));
  assert.throws(() => seal("x", "a", "short"));
  assert.notEqual(seal("same", "a", KEY), seal("same", "a", KEY)); // iv สุ่มทุกครั้ง
});

test("รหัสผ่านสุ่ม: ตัวอักษร/ตัวเลขล้วน ไม่ซ้ำ", () => {
  const a = randomPassword(24), b = randomPassword(24);
  assert.match(a, /^[A-Za-z0-9]{24}$/);
  assert.notEqual(a, b);
});

test("env ที่ขาด", () => {
  const keep = { ...process.env };
  delete process.env.MT_WG_ENDPOINT; delete process.env.MT_WG_SERVER_PUBKEY; delete process.env.MT_ENC_KEY;
  assert.deepEqual(mtMissingEnv(), ["MT_WG_ENDPOINT", "MT_WG_SERVER_PUBKEY", "MT_ENC_KEY"]);
  process.env.MT_WG_ENDPOINT = "bad host"; process.env.MT_WG_SERVER_PUBKEY = "x"; process.env.MT_ENC_KEY = "abc";
  assert.equal(mtMissingEnv().length, 3);
  process.env.MT_WG_ENDPOINT = "vpn.example.com"; process.env.MT_WG_SERVER_PUBKEY = wgKeypair().publicKey; process.env.MT_ENC_KEY = KEY;
  assert.deepEqual(mtMissingEnv(), []);
  process.env = keep;
});

test("สคริปต์ .rsc มีครบทุกส่วนที่สั่ง", () => {
  const o = site();
  const r = buildRsc(o);
  const has = (s) => assert.ok(r.includes(s), "ไม่พบ: " + s);
  has('/system identity set name="SITE05-ThaiSteel"');
  // LAN + DHCP + NAT
  has('add address=10.10.5.1/24 interface="bridge"');
  has("ranges=10.10.5.100-10.10.5.200");
  has("add address=10.10.5.0/24 gateway=10.10.5.1 dns-server=10.10.5.1");
  has("add chain=srcnat action=masquerade out-interface=ether1");
  has("interface=ether1"); // dhcp-client WAN
  // WireGuard
  has(`private-key="${o.wgPrivateKey}"`);
  has(`public-key="${o.serverPublicKey}" endpoint-address="vpn.example.com" endpoint-port=51820 allowed-address=10.99.0.1/32 persistent-keepalive=25s`);
  has('add address=10.99.0.15/24 interface="wg-pg"');
  // firewall input / forward
  has("in-interface=wg-pg src-address=10.99.0.1 protocol=tcp dst-port=443");
  has("in-interface=wg-pg src-address=10.99.0.1 protocol=icmp");
  has("action=drop in-interface=ether1");
  has("dst-address=10.10.5.20 protocol=tcp dst-port=502");
  has("dst-address=10.10.5.10 protocol=tcp dst-port=80,443");
  has("dst-address=10.10.5.20 protocol=tcp dst-port=80,443");
  has("dst-address=10.10.5.10 protocol=icmp");
  has("dst-address=10.10.5.20 protocol=icmp");
  assert.ok(!/dst-address=[^ ]*,/.test(r), "dst-address ใส่ลิสต์ไม่ได้");
  // นอกบรรทัดคอมเมนต์ (#) ต้องเป็น ASCII ล้วน — RouterOS อ่านค่าที่ไม่ใช่ ASCII เพี้ยน
  for (const line of r.split("\r\n")) if (!line.startsWith("#")) assert.match(line, /^[\x20-\x7e]*$/, line);
  // ไม่มีกฎ accept ใดเปิดจากฝั่ง WAN
  assert.ok(!/action=accept[^\r\n]*in-interface=ether1/.test(r));
  // certificate + services
  has('add name="pg-https" common-name="10.10.5.1"');
  has('sign "pg-https"');
  for (const s of ["www", "telnet", "ftp", "api", "api-ssl"]) has(`set ${s} disabled=yes`);
  has('set www-ssl disabled=no certificate="pg-https"');
  // user group / user
  has("policy=read,api,rest-api,test,reboot");
  assert.ok(!/policy=[^\r\n]*\bwrite\b/.test(r), "กลุ่มต้องไม่มีสิทธิ์ write");
  has(`password="${o.webPassword}" address=10.99.0.1/32`);
  // cloud
  has("/ip cloud set ddns-enabled=yes back-to-home-vpn=enabled");
  // คอมเมนต์ไทยอธิบาย
  assert.ok((r.match(/^# ---------- \d+\) .*[ก-๙]/gm) || []).length >= 10, "ต้องมีหัวข้อคอมเมนต์ไทยทุกส่วน");
});

test("สคริปต์รันซ้ำได้: ของที่มีชื่อเช็กก่อนเพิ่ม · ของไม่มีชื่อลบของเดิม (pg-mt) ก่อน", () => {
  const r = buildRsc(site()).split("\r\n");
  // ทุก add ที่ไม่ได้อยู่ใน :if ต้องมี remove ของ section เดียวกันมาก่อน
  let section = "", removed = new Set();
  for (const line of r) {
    if (line.startsWith("/")) { section = line.split(" ").slice(0, 3).filter((w) => !w.includes("=")).join(" "); }
    if (/^remove /.test(line)) removed.add(section);
    if (/^add /.test(line)) assert.ok(removed.has(section), "add ไม่มี remove ก่อน ใน " + section + ": " + line);
  }
  // ของที่มีชื่อ = :if [:len [find name=...]] = 0
  for (const name of ["bridge", "pg-pool", "pg-dhcp", "wg-pg", "pg-https", "pg-ro", "pg-web"]) {
    assert.ok(r.some((l) => l.includes(`:if ([:len [find name="${name}"]] = 0)`)), "ไม่เช็กก่อนเพิ่ม: " + name);
  }
  // ใบรับรองไม่สร้างใหม่ถ้ามีแล้ว (fingerprint คงเดิม)
  assert.ok(!r.some((l) => /^remove .*pg-https/.test(l)));
});

test("ลำดับกฎ firewall: ย้ายขึ้นบนสุดจากข้อท้ายไปข้อแรก", () => {
  const r = buildRsc(site());
  const moves = [...r.matchAll(/^move \[find comment~"\^pg-mt (in|fw)(\d\d) "\] destination=0$/gm)].map((m) => m[1] + m[2]);
  assert.deepEqual(moves.slice(0, 6), ["in06", "in05", "in04", "in03", "in02", "in01"]);
  assert.deepEqual(moves.slice(6), ["fw09", "fw08", "fw07", "fw06", "fw05", "fw04", "fw03", "fw02", "fw01"]);
});

test("สคริปต์ไม่ยอมรับค่าที่อาจแทรกคำสั่ง", () => {
  const o = site();
  assert.throws(() => buildRsc({ ...o, name: 'x" ; /system reset-configuration' }));
  assert.throws(() => buildRsc({ ...o, endpoint: 'h"; /user remove' }));
  assert.throws(() => buildRsc({ ...o, webPassword: 'abc"$x' }));
  assert.throws(() => buildRsc({ ...o, wgPrivateKey: "nope" }));
  assert.throws(() => buildRsc({ ...o, n: 0 }));
});

test("สคริปต์ไม่มี private key ของเซิร์ฟเวอร์ และ endpoint มาจากค่าที่ส่งเข้า", () => {
  const o = site();
  const r = buildRsc({ ...o, endpoint: "203.0.113.9:6000" });
  assert.ok(r.includes('endpoint-address="203.0.113.9" endpoint-port=6000'));
});

test("peer ฝั่งเซิร์ฟเวอร์ (wg-quick)", () => {
  const pub = wgKeypair().publicKey;
  const p = buildServerPeer({ n: 5, name: "ThaiSteel", publicKey: pub });
  assert.equal(p, `# ไซต์ 05 · SITE05-ThaiSteel\n[Peer]\nPublicKey = ${pub}\nAllowedIPs = 10.99.0.15/32, 10.10.5.0/24\n`);
  assert.throws(() => buildServerPeer({ n: 5, name: "ThaiSteel", publicKey: "x" }));
});
