/* ============================================================
   ไซต์ MikroTik — สร้าง/แก้/ลบไซต์ · สร้างสคริปต์ .rsc + peer ฝั่งเซิร์ฟเวอร์  (docs/mikrotik.md)

   GET  /api/mikrotik/site → { configured, missing: [ชื่อ env ที่ขาด] }   (ไม่บอกค่า)
   POST /api/mikrotik/site   Authorization: Bearer <Firebase ID token> — เฉพาะแอดมิน (อ่าน users/<uid> ล่าสุด ไม่เชื่อ claim)
     { action: "create", n, name, note }   → สร้างไซต์ + คู่คีย์ WireGuard + รหัส user เว็บ (เลข N ซ้ำ = 409)
     { action: "edit",   n, name, note }   → แก้ชื่อ/หมายเหตุ (คีย์ไม่เปลี่ยน — ต้องสร้างสคริปต์ใหม่ไปรันถ้าเปลี่ยนชื่อ)
     { action: "script", n }               → { rsc, peer, filename } ถอดรหัสแล้วประกอบสคริปต์ (ไม่เก็บสคริปต์ไว้ที่ไหน)
     { action: "fetch-token", n }          → { command, command_nocheck, peer, exp } คำสั่งบรรทัดเดียวให้ hEX ดึงสคริปต์เอง (ใช้ครั้งเดียว 15 นาที)
     { action: "rotate", n }               → คีย์ WireGuard + รหัส user เว็บชุดใหม่ (ต้องรันสคริปต์ใหม่ + แก้ peer บนเซิร์ฟเวอร์)
     { action: "remove", n }               → ลบ mtSites/N และ mtSecrets/N (+ mtStatus/N)
   เฟส 2 (สถานะไซต์ — agent บน VPS เรียก ?agent=1 ดู api/_lib/mtagent.mjs)
     { action: "pin-fp", n, fp }           → ยืนยัน fingerprint ใบรับรอง https ของ hEX (fp "" = ยกเลิก) · ยังไม่ยืนยัน = agent ไม่ส่งรหัส
     { action: "cmd", n, type }            → เข้าคิวคำสั่ง reboot | log (ลงลายเซ็น MT_CMD_SECRET) → { id }
     { action: "cmd-get", id }             → { cmd: { state pending|sent|done|error|expired, error, data } }
     ⚠ ไม่มี action แก้ IP / firewall / WireGuard ของเราเตอร์ — ห้ามเพิ่ม (ผู้ใช้กำหนด)
   เฟส 3 (มิเตอร์ · บิลรายเดือน)
     { action: "meter-cfg", n, meter_model, meter_unit }  → รุ่นมิเตอร์ที่ agent อ่าน (leos-ipm310 | pm2200 | none) · unit id
     { action: "bill-cfg", n, cust, addr, rate, reg, vat } → ตั้งค่าบิลของไซต์ (ชื่อ/ที่อยู่ลูกค้า · บาท/kWh · ช่อง kwh_imp|kwh_exp|kwh_net · คิด VAT 7%)
     { action: "bill-save", n, month, start, end, ... }    → บันทึกบิลเดือน YYYY-MM ลง mtBills/N/YYYYMM (คิด kWh/ยอดเงินใหม่ที่เซิร์ฟเวอร์)

   ข้อมูล
     mtSites/{N}   (พนักงานที่ล็อกอินอ่านได้) n name note wg_pub wg_ip lan created_* updated_* keys_at script_at script_by
     mtSecrets/{N} (เซิร์ฟเวอร์เท่านั้น — ต้องวางกฎ .read/.write false ใน Console) wg_priv web_pass: AES-256-GCM ด้วย MT_ENC_KEY
   เว็บไม่เขียน mtSites/mtSecrets เอง ทุกการเขียนผ่าน endpoint นี้ (service account)
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbSet, rtdbDelete, rtdbEtag, rtdbSetIf, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import crypto from "node:crypto";
import { MT, MT_ENV, parseEndpoint, mtMissingEnv, validN, validName, sitePlan, wgKeypair, seal, randomPassword,
  MT_CMD_TYPES, MT_CMD_TTL_MS, cmdSig, normFp, MT_METER_MODELS, MT_BILL_REGS, billCalc } from "../_lib/mikrotik.mjs";
import { aad, scriptFor, issueFetchToken } from "../_lib/mtstore.mjs";
import { agentPOST } from "../_lib/mtagent.mjs";

const NOTE_MAX = 500;

export async function GET() {
  const missing = mtMissingEnv();
  if (!ENV.rtdb()) missing.push("RTDB_URL");
  return json({ configured: missing.length === 0, missing });
}

async function admin(request) {
  const tok = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const who = await verifyFirebaseIdToken(tok).catch(() => null);
  if (!who) return { err: json({ error: "ต้องล็อกอินก่อน" }, 401) };
  const u = await rtdbGet("users/" + who.uid.replace(/[.#$\[\]\/]/g, "")).catch(() => null);
  if (!u || u.active === false) return { err: json({ error: "บัญชีถูกปิด" }, 403) };
  if (!rolesOf(u).includes("admin")) return { err: json({ error: "เฉพาะแอดมิน" }, 403) };
  return { by: u.name || u.id || who.uid };
}

function freshSecrets(n) {
  const kp = wgKeypair();
  const pass = randomPassword(24);
  return {
    pub: kp.publicKey,
    secrets: { wg_priv: seal(kp.privateKey, aad(n, "wg_priv")), web_pass: seal(pass, aad(n, "web_pass")), v: 1 },
  };
}

export async function POST(request) {
  /* mt-agent บน VPS (Bearer MT_AGENT_KEY ไม่ใช่ล็อกอินพนักงาน) — รวมไว้ไฟล์นี้เพราะ Vercel ฟรีจำกัด 12 ฟังก์ชัน */
  if (new URL(request.url).searchParams.get("agent") === "1") return agentPOST(request);
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const a = await admin(request);
  if (a.err) return a.err;
  const b = (await body(request)) || {};
  /* ข้อมูลประกอบคู่มือ (แอดมินเท่านั้น): IP ของ VPS สำหรับคำสั่ง ssh */
  if (b.action === "info") {
    const ep = parseEndpoint(MT_ENV.endpoint());
    return json({ ok: true, server_host: ep ? ep.host : "" });
  }
  if (b.action === "cmd-get") {
    const id = String(b.id || "");
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return json({ error: "id ผิด" }, 400);
    const c = await rtdbGet("mtCmd/" + id);
    if (!c) return json({ error: "ไม่พบคำสั่ง" }, 404);
    const { sig, ...pub } = c;
    return json({ ok: true, cmd: pub });
  }
  const n = Number(b.n);
  if (!validN(n)) return json({ error: "เลขไซต์ต้องเป็นจำนวนเต็ม " + MT.N_MIN + "–" + MT.N_MAX }, 400);
  const miss = mtMissingEnv();
  const now = new Date().toISOString();
  const path = "mtSites/" + n;

  if (b.action === "create") {
    if (miss.length) return json({ error: "ยังไม่ได้ตั้ง env: " + miss.join(", "), need_env: true }, 503);
    const name = String(b.name || "").trim();
    if (!validName(name)) return json({ error: "ชื่อไซต์ใช้ได้แค่ A-Z a-z 0-9 และ - (ขึ้นต้นด้วยตัวอักษร/ตัวเลข ไม่เกิน 24 ตัว)" }, 400);
    const P = sitePlan(n);
    const { pub, secrets } = freshSecrets(n);
    const rec = {
      n, name, note: String(b.note || "").slice(0, NOTE_MAX), wg_pub: pub, wg_ip: P.wgIp, lan: P.lanNet,
      created_at: now, created_by: a.by, keys_at: now,
    };
    /* จองเลข N แบบ atomic — เขียนได้เฉพาะเมื่อยังว่าง (ETag ของค่า null) · คนกดพร้อมกันได้ 409 คนหนึ่ง */
    const cur = await rtdbEtag(path);
    if (cur.value != null) return json({ error: "เลขไซต์ " + n + " ถูกใช้แล้ว (" + (cur.value.name || "") + ")" }, 409);
    if (!(await rtdbSetIf(path, rec, cur.etag))) return json({ error: "เลขไซต์ " + n + " เพิ่งถูกใช้ไป" }, 409);
    /* เขียน secret หลังจองเลขได้แล้วเท่านั้น — กันไปทับ secret ของไซต์ที่มีอยู่ */
    await rtdbSet("mtSecrets/" + n, secrets);
    return json({ ok: true, site: rec });
  }

  const site = await rtdbGet(path);
  if (!site) return json({ error: "ไม่พบไซต์ " + n }, 404);

  if (b.action === "edit") {
    const name = String(b.name == null ? site.name : b.name).trim();
    if (!validName(name)) return json({ error: "ชื่อไซต์ใช้ได้แค่ A-Z a-z 0-9 และ -" }, 400);
    const patch = { name, note: String(b.note == null ? site.note || "" : b.note).slice(0, NOTE_MAX), updated_at: now, updated_by: a.by };
    await rtdbUpdate(path, patch);
    return json({ ok: true, site: Object.assign({}, site, patch) });
  }

  if (b.action === "script") {
    const r = await scriptFor(n, site);
    if (r.error) return json({ error: r.error, need_env: r.need_env }, r.status);
    await rtdbUpdate(path, { script_at: now, script_by: a.by }).catch(() => null);
    return json({ ok: true, rsc: r.rsc, peer: r.peer, filename: r.filename });
  }

  /* คำสั่งบรรทัดเดียว: hEX ดึงสคริปต์เองด้วยโทเคนใช้ครั้งเดียว 15 นาที (api/mikrotik/rsc.mjs)
     ลองสร้างสคริปต์ก่อนออกโทเคน — กุญแจ/env เสียจะได้รู้ที่เว็บ ไม่ใช่ไปรู้ที่เราเตอร์ */
  if (b.action === "fetch-token") {
    const r = await scriptFor(n, site);
    if (r.error) return json({ error: r.error, need_env: r.need_env }, r.status);
    const { token, exp } = await issueFetchToken(n, a.by);
    const url = new URL(request.url).origin + "/api/mikrotik/rsc?t=" + token;
    const tail = " dst-path=pg-setup.rsc; /import file-name=pg-setup.rsc verbose=yes; /file remove pg-setup.rsc";
    return json({
      /* host ของ VPS ไว้แสดง ssh root@<host> ในขั้นตอน (แอดมินเท่านั้น — GET สาธารณะไม่บอก) */
      ok: true, exp, peer: r.peer, server_host: parseEndpoint(MT_ENV.endpoint()).host,
      command: '/tool fetch url="' + url + '" check-certificate=yes-without-crl' + tail,
      /* RouterOS บางรุ่นไม่มีใบรับรอง CA ในเครื่อง → ตรวจ https ไม่ผ่าน · โทเคนยังไม่ถูกใช้ (คำขอไม่ถึงเว็บ) ใช้บรรทัดนี้ต่อได้ */
      command_nocheck: '/tool fetch url="' + url + '" check-certificate=no' + tail,
    });
  }

  if (b.action === "rotate") {
    if (miss.length) return json({ error: "ยังไม่ได้ตั้ง env: " + miss.join(", "), need_env: true }, 503);
    const { pub, secrets } = freshSecrets(n);
    await rtdbSet("mtSecrets/" + n, secrets);
    const patch = { wg_pub: pub, keys_at: now, keys_by: a.by };
    await rtdbUpdate(path, patch);
    return json({ ok: true, site: Object.assign({}, site, patch) });
  }

  /* ยืนยันใบรับรอง: เทียบกับบรรทัด "cert fingerprint" ท้ายสคริปต์ หรือค่าที่ agent เห็น (mtStatus/N/tls/fp) */
  if (b.action === "pin-fp") {
    const raw = String(b.fp == null ? "" : b.fp).trim();
    const fp = normFp(raw);
    if (raw && !fp) return json({ error: "fingerprint ต้องเป็น SHA-256 (ตัวเลขฐาน 16 จำนวน 64 ตัว)" }, 400);
    const patch = fp ? { fp, fp_at: now, fp_by: a.by } : { fp: null, fp_at: null, fp_by: null };
    await rtdbUpdate(path, patch);
    return json({ ok: true, fp });
  }

  /* คำสั่งไปเราเตอร์ — มีแค่รีบูต/ดู log (อ่านอย่างเดียว) · agent ทำภายในรอบถัดไป (~30 วิ) */
  if (b.action === "cmd") {
    if (!MT_CMD_TYPES.includes(b.type)) return json({ error: "คำสั่งไม่รู้จัก" }, 400);
    if (MT_ENV.cmdSecret().length < 32) return json({ error: "ยังไม่ได้ตั้ง env: MT_CMD_SECRET", need_env: true }, 503);
    if (!site.fp) return json({ error: "ยังไม่ได้ยืนยันใบรับรองของไซต์นี้ — agent ยังไม่เข้าเราเตอร์" }, 409);
    /* กดซ้ำระหว่างรอ = ได้คำสั่งเดิม (กันรีบูตซ้ำสองรอบ) */
    const all = (await rtdbGet("mtCmd").catch(() => null)) || {};
    const t = Date.now();
    for (const id of Object.keys(all)) {
      const c = all[id];
      if (c && Number(c.n) === n && c.type === b.type && (c.state === "pending" || c.state === "sent") && t - Number(c.ts) < MT_CMD_TTL_MS)
        return json({ ok: true, id, again: true });
    }
    const id = t.toString(36) + crypto.randomBytes(6).toString("base64url");
    const c = { id, n, type: b.type, ts: t };
    await rtdbSet("mtCmd/" + id, Object.assign({}, c, { by: a.by, at: now, state: "pending", sig: cmdSig(c) }));
    return json({ ok: true, id });
  }

  /* เฟส 3: มิเตอร์และบิล — ตั้งค่าที่ agent/เว็บใช้ ไม่แตะค่าในเราเตอร์ */
  if (b.action === "meter-cfg") {
    const model = String(b.meter_model || "");
    if (!MT_METER_MODELS.includes(model)) return json({ error: "รุ่นมิเตอร์ไม่รู้จัก" }, 400);
    const unit = Number(b.meter_unit == null ? 1 : b.meter_unit);
    if (!Number.isInteger(unit) || unit < 0 || unit > 247) return json({ error: "unit id ต้องเป็น 0–247" }, 400);
    await rtdbUpdate(path, { meter_model: model, meter_unit: unit, updated_at: now, updated_by: a.by });
    return json({ ok: true });
  }
  if (b.action === "bill-cfg") {
    const rate = Number(b.rate);
    if (!(rate >= 0 && rate <= 100)) return json({ error: "ราคาต่อหน่วยต้องเป็น 0–100 บาท" }, 400);
    if (!MT_BILL_REGS.includes(b.reg)) return json({ error: "ช่องคิดเงินต้องเป็น kwh_imp / kwh_exp / kwh_net" }, 400);
    const bill = { cust: String(b.cust || "").slice(0, 200), addr: String(b.addr || "").slice(0, 300), rate, reg: b.reg, vat: b.vat !== false,
      note: String(b.note || "").slice(0, 300), at: now, by: a.by };
    await rtdbUpdate(path, { bill });
    return json({ ok: true, bill });
  }
  if (b.action === "bill-save") {
    /* VAT ตามที่ตั้งไว้ของไซต์ (ไม่เชื่อค่าจากหน้าเว็บ) */
    const r = billCalc(Object.assign({}, b, { vat: !(site.bill && site.bill.vat === false) }));
    if (r.error) return json({ error: r.error }, 400);
    const key = r.month.replace("-", "");
    const rec = Object.assign(r, { n, no: "SITE" + String(n).padStart(2, "0") + "-" + key,
      cust: String((site.bill && site.bill.cust) || "").slice(0, 200), addr: String((site.bill && site.bill.addr) || "").slice(0, 300),
      note: String(b.note || "").slice(0, 300), at: now, by: a.by });
    await rtdbSet("mtBills/" + n + "/" + key, rec);
    return json({ ok: true, bill: rec });
  }

  if (b.action === "remove") {
    await rtdbDelete("mtStatus/" + n).catch(() => null);
    await rtdbDelete("mtSecrets/" + n);
    await rtdbDelete(path);
    return json({ ok: true });
  }

  return json({ error: "action ไม่รู้จัก" }, 400);
}
