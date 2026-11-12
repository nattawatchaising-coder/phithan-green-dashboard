/* เทสต์ tools/mt-agent/agent.mjs (ตัวเฝ้าไซต์บน VPS) — ไม่แตะเราเตอร์/เว็บจริง · รัน: npm test */
import test from "node:test";
import assert from "node:assert/strict";
import tls from "node:tls";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import * as A from "../tools/mt-agent/agent.mjs";
import { cmdSig } from "../api/_lib/mikrotik.mjs";

test("ลายเซ็นคำสั่ง: สูตรของ agent ตรงกับของเว็บ · คำสั่งนอกรายการถูกปฏิเสธแม้ลายเซ็นถูก", () => {
  const S = "z".repeat(40);
  const c = { id: "abc123", n: 5, type: "reboot", ts: 1700000000000 };
  assert.equal(A.cmdSig(c, S), cmdSig(c, S));
  const bad = Object.assign({}, c, { type: "set-ip" });
  bad.sig = A.cmdSig(bad, S);
  assert.equal(A.cmdOk(bad, S, new Set(), c.ts), "คำสั่งไม่รู้จัก");
});

test("wg show dump → handshake ต่อ IP ไซต์", () => {
  const dump = "PRIV\tPUB\t51820\toff\n" +
    "peerA=\t(none)\t1.2.3.4:5555\t10.99.0.11/32,10.10.1.0/24\t1762870000\t1000\t2000\t25\n" +
    "peerB=\t(none)\t(none)\t10.99.0.12/32,10.10.2.0/24\t0\t0\t0\t25\n";
  const w = A.parseWgDump(dump);
  assert.deepEqual(w["10.99.0.11"], { hs: 1762870000, rx: 1000, tx: 2000, endpoint: "1.2.3.4:5555" });
  assert.equal(w["10.99.0.12"].hs, 0);
  assert.equal(w["10.99.0.12"].endpoint, "");
});

test("แยกคำตอบ HTTP ทั้งแบบ content-length และ chunked", () => {
  const a = A.parseHttp(Buffer.from('HTTP/1.1 200 OK\r\nContent-Length: 7\r\n\r\n{"a":1}'));
  assert.deepEqual([a.status, a.body], [200, '{"a":1}']);
  const b = A.parseHttp(Buffer.from('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n4\r\n{"a"\r\n3\r\n:2}\r\n0\r\n\r\n'));
  assert.equal(b.body, '{"a":2}');
});

test("ตัดข้อมูล REST ของ RouterOS", () => {
  const r = A.pickResource({ uptime: "1d2h", version: "7.21.5 (stable)", "board-name": "hEX", "cpu-load": "4", "free-memory": "200", "total-memory": "256" });
  assert.equal(r.cpu, 4); assert.equal(r.board, "hEX"); assert.equal(r.mem_total, 256);
  const i = A.pickIfaces([{ name: "ether1", type: "ether", running: "true", disabled: "false", "rx-byte": "10" }, { name: "lo", type: "loopback" }]);
  assert.equal(i.length, 1); assert.equal(i[0].running, true); assert.equal(i[0].rx, 10);
});

/* ---------- pin ใบรับรอง กับเซิร์ฟเวอร์ TLS ในเครื่อง (ต้องมี openssl — ไม่มีก็ข้าม) ---------- */
let cert = null;
try {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mtag-"));
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=hex",
    "-keyout", path.join(dir, "k.pem"), "-out", path.join(dir, "c.pem")], { stdio: "ignore" });
  cert = { key: fs.readFileSync(path.join(dir, "k.pem")), cert: fs.readFileSync(path.join(dir, "c.pem")) };
} catch (e) { cert = null; }

test("pin: ไม่มี pin = อ่าน fp แล้วจบ ไม่ส่งรหัส · ตรง = ส่งคำขอ · ไม่ตรง = ไม่ส่งอะไรเลย", { skip: !cert && "ไม่มี openssl" }, async () => {
  const got = [];
  const srv = tls.createServer(cert, (s) => {
    let buf = "";
    s.on("data", (d) => {
      buf += d;
      if (buf.includes("\r\n\r\n")) {
        got.push(buf);
        s.end('HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 18\r\nConnection: close\r\n\r\n{"board-name":"x"}');
      }
    });
    s.on("error", () => {});
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  const fp = A.normFp(new crypto.X509Certificate(cert.cert).fingerprint256);
  try {
    const a = await A.pinnedRequest({ host: "127.0.0.1", port, path: "/rest/system/resource", user: "pg-web", pass: "secret1" });
    assert.equal(a.fp, fp);
    assert.equal(a.status, undefined);
    const b = await A.pinnedRequest({ host: "127.0.0.1", port, pin: fp.toUpperCase(), path: "/rest/system/resource", user: "pg-web", pass: "secret2" });
    assert.equal(b.status, 200);
    assert.equal(b.json["board-name"], "x");
    await assert.rejects(A.pinnedRequest({ host: "127.0.0.1", port, pin: "0".repeat(64), path: "/x", user: "pg-web", pass: "secret3" }),
      (e) => e.code === "FP_MISMATCH" && e.fp === fp);
    await new Promise((r) => setTimeout(r, 100));
    const all = got.join("\n");
    assert.ok(all.includes(Buffer.from("pg-web:secret2").toString("base64")));
    assert.ok(!all.includes(Buffer.from("pg-web:secret1").toString("base64")), "ยังไม่ pin ห้ามส่งรหัส");
    assert.ok(!all.includes(Buffer.from("pg-web:secret3").toString("base64")), "fp ไม่ตรง ห้ามส่งรหัส");
  } finally { srv.close(); }
});

test("agent ไม่มีโค้ดแก้ค่าเราเตอร์ (path REST มีแค่ resource/interface/ip address/log/reboot)", () => {
  const src = fs.readFileSync(new URL("../tools/mt-agent/agent.mjs", import.meta.url), "utf8");
  const paths = [...src.matchAll(/"(\/rest\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(paths.length >= 5);
  assert.deepEqual(paths.filter((p) => !/^\/rest\/(system\/(resource|reboot)|interface|ip\/address|log)$/.test(p)), []);
  assert.deepEqual([...new Set([...src.matchAll(/method:\s*"(\w+)"/g)].map((m) => m[1]))], ["POST"]);
});

/* ---------- เฟส 3: Modbus ---------- */
import net from "node:net";

test("float จาก 2 register: LEOS word ต่ำมาก่อน · PM2200 word สูงมาก่อน", () => {
  const b = Buffer.alloc(4); b.writeFloatBE(230.5, 0);
  const hi = b.readUInt16BE(0), lo = b.readUInt16BE(2);
  assert.equal(A.decodeMeter(A.METER_PROFILES["leos-ipm310"], { 200: lo, 201: hi }).v1, 230.5);
  assert.equal(A.decodeMeter(A.METER_PROFILES["pm2200"], { 3027: hi, 3028: lo }).v1, 230.5);
  /* PF เป็น signed 16 บิต ×0.001 (ดิบ 1000 = 1.00 ตามหน้าจอมิเตอร์) */
  assert.equal(A.decodeMeter(A.METER_PROFILES["leos-ipm310"], { 251: 0x10000 - 950 }).pf, -0.95);
  assert.equal(A.decodeMeter(A.METER_PROFILES["leos-ipm310"], { 251: 1000 }).pf, 1);
  assert.equal(A.decodeMeter(A.METER_PROFILES["leos-ipm310"], { 252: 4996 }).hz, 49.96);
  assert.equal(A.rawHex(A.METER_PROFILES["leos-ipm310"], { 224: 1, 259: 0xabcd }).length, 144);
});

test("โปรไฟล์มิเตอร์: บล็อกครอบทุกช่อง · ไม่เกิน 125 register ต่อครั้ง · ตรงกับรายการรุ่นฝั่งเว็บ", async () => {
  const { MT_METER_MODELS } = await import("../api/_lib/mikrotik.mjs");
  assert.deepEqual(A.METER_MODELS.concat("none"), MT_METER_MODELS);
  for (const [name, P] of Object.entries(A.METER_PROFILES)) {
    const inBlock = (a) => P.blocks.some(([s, q]) => a >= s && a < s + q);
    for (const [k, a] of Object.entries(P.f32)) assert.ok(inBlock(a) && inBlock(a + 1), name + " " + k);
    for (const [k, [a]] of Object.entries(P.i16)) assert.ok(inBlock(a), name + " " + k);
    for (const [, q] of P.blocks) assert.ok(q <= 125);
  }
});

test("readMeter กับมิเตอร์ปลอม (Modbus TCP ในเครื่อง): อ่านหลายบล็อก · exception = error", async () => {
  const regs = {};
  const put = (a, v, lowFirst) => { const b = Buffer.alloc(4); b.writeFloatBE(v, 0); const hi = b.readUInt16BE(0), lo = b.readUInt16BE(2); regs[a] = lowFirst ? lo : hi; regs[a + 1] = lowFirst ? hi : lo; };
  put(230, 15.25, true); put(271, 123456.5, true); put(212, 10, true);
  let fcSeen = [];
  const srv = net.createServer((s) => {
    s.on("data", (d) => {
      for (let o = 0; o + 12 <= d.length; o += 12) {
        const tid = d.readUInt16BE(o), unit = d.readUInt8(o + 6), fc = d.readUInt8(o + 7), addr = d.readUInt16BE(o + 8), q = d.readUInt16BE(o + 10);
        fcSeen.push(fc);
        if (unit === 9) { const e = Buffer.alloc(9); e.writeUInt16BE(tid, 0); e.writeUInt16BE(3, 4); e.writeUInt8(unit, 6); e.writeUInt8(fc | 0x80, 7); e.writeUInt8(2, 8); s.write(e); continue; }
        const r = Buffer.alloc(9 + q * 2);
        r.writeUInt16BE(tid, 0); r.writeUInt16BE(3 + q * 2, 4); r.writeUInt8(unit, 6); r.writeUInt8(fc, 7); r.writeUInt8(q * 2, 8);
        for (let i = 0; i < q; i++) r.writeUInt16BE(regs[addr + i] || 0, 9 + i * 2);
        s.write(r);
      }
    });
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  try {
    const port = srv.address().port;
    const r = await A.readMeter("127.0.0.1", "leos-ipm310", 1, { port });
    assert.equal(r.v.kw, 15.25);
    assert.equal(r.v.kwh_imp, 123456.5);
    assert.equal(r.v.i1, 10);
    assert.deepEqual([...new Set(fcSeen)], [4], "LEOS ต้องใช้ FC04 อย่างเดียว");
    await assert.rejects(A.readMeter("127.0.0.1", "leos-ipm310", 9, { port }), /exception/);
  } finally { srv.close(); }
});

test("agent ไม่มีคำสั่ง Modbus เขียน (FC05/06/15/16)", () => {
  const src = fs.readFileSync(new URL("../tools/mt-agent/agent.mjs", import.meta.url), "utf8");
  for (const P of Object.values(A.METER_PROFILES)) assert.ok([3, 4].includes(P.fc));
  assert.ok(!/fc:\s*(5|6|15|16)\b/.test(src));
});
