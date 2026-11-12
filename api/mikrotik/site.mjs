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
     { action: "bill-save", n, month, rate? }              → บันทึกบิลเดือน YYYY-MM ลง mtBills/N/YYYYMM — เลขมิเตอร์เซิร์ฟเวอร์อ่านเอง แก้ได้แค่ราคา
     { action: "site-info", n, info:{cust addr tax ...} }  → ทะเบียนไซต์ (ข้อมูลลูกค้าบนบิล)
     { action: "bill-del", n, month }                      → ลบบิล (แอดมิน · สำเนาไป mtSecrets/billTrash)
   พาร์ทเนอร์ (api/_lib/mtpartner.mjs) — เรียกได้แค่ company / partner-pin / site-info / bill-cfg / bill-save ของไซต์ตัวเอง
     { action: "partner-save", id?, name, username, pin?, active, sites:[N] } (แอดมิน) · { action: "company", pid?, company } · { action: "partner-pin", pid?|old, pin }

   ข้อมูล
     mtSites/{N}   (พนักงานที่ล็อกอินอ่านได้) n name note wg_pub wg_ip lan created_* updated_* keys_at script_at script_by
     mtSecrets/{N} (เซิร์ฟเวอร์เท่านั้น — ต้องวางกฎ .read/.write false ใน Console) wg_priv web_pass: AES-256-GCM ด้วย MT_ENC_KEY
   เว็บไม่เขียน mtSites/mtSecrets เอง ทุกการเขียนผ่าน endpoint นี้ (service account)
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbSet, rtdbDelete, rtdbEtag, rtdbSetIf, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import crypto from "node:crypto";
import { MT, MT_ENV, parseEndpoint, mtMissingEnv, validN, validName, sitePlan, wgKeypair, seal, randomPassword,
  MT_CMD_TYPES, MT_CMD_TTL_MS, cmdSig, normFp, MT_METER_MODELS, MT_BILL_REGS, billCalc, billReadings } from "../_lib/mikrotik.mjs";
import { isPartnerUid, partnerAction, cleanSiteInfo } from "../_lib/mtpartner.mjs";
import { aad, scriptFor, issueFetchToken } from "../_lib/mtstore.mjs";
import { agentPOST } from "../_lib/mtagent.mjs";

const NOTE_MAX = 500;

export async function GET() {
  const missing = mtMissingEnv();
  if (!ENV.rtdb()) missing.push("RTDB_URL");
  return json({ configured: missing.length === 0, missing });
}

/* ใครเรียก: แอดมิน (อ่าน users/<uid> ล่าสุด ไม่เชื่อ claim) หรือพาร์ทเนอร์ (claim ext + บัญชีใน mtPartners ยังเปิดอยู่) */
async function who(request) {
  const tok = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const w = await verifyFirebaseIdToken(tok).catch(() => null);
  if (!w) return { err: json({ error: "ต้องล็อกอินก่อน" }, 401) };
  if (isPartnerUid(w.uid)) {
    const p = w.claims && w.claims.ext === true ? await rtdbGet("mtPartners/" + w.uid).catch(() => null) : null;
    if (!p || p.active === false) return { err: json({ error: "บัญชีถูกปิด" }, 403) };
    return { partner: p, id: p.id, by: p.name || p.username, kind: "partner" };
  }
  const u = await rtdbGet("users/" + w.uid.replace(/[.#$\[\]\/]/g, "")).catch(() => null);
  if (!u || u.active === false) return { err: json({ error: "บัญชีถูกปิด" }, 403) };
  if (!rolesOf(u).includes("admin")) return { err: json({ error: "เฉพาะแอดมิน" }, 403) };
  return { admin: true, id: u.id, by: u.name || u.id || w.uid, kind: "staff" };
}
/* action ที่พาร์ทเนอร์ทำได้ (เฉพาะไซต์ที่ตัวเองเป็นเจ้าของ) — นอกนั้นแอดมินเท่านั้น */
const PARTNER_OK = ["company", "partner-pin", "site-info", "bill-cfg", "bill-save"];

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
  const a = await who(request);
  if (a.err) return a.err;
  const b = (await body(request)) || {};
  if (a.partner && !PARTNER_OK.includes(b.action)) return json({ error: "เฉพาะแอดมิน" }, 403);
  const pr = await partnerAction(a, b, new Date().toISOString());
  if (pr) return pr;
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
  if (a.partner && site.owner !== a.id) return json({ error: "ไม่พบไซต์ " + n }, 404);

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
  /* ทะเบียนไซต์ — ข้อมูลลูกค้า/สถานที่ที่ขึ้นบนบิล (แอดมิน หรือพาร์ทเนอร์เจ้าของไซต์) */
  if (b.action === "site-info") {
    const info = cleanSiteInfo(b.info);
    if (info.error) return json({ error: info.error }, 400);
    await rtdbUpdate(path, { info: Object.assign(info, { at: now, by: a.by }) });
    return json({ ok: true, info });
  }
  /* ตั้งค่าบิล: ราคาต่อหน่วย + VAT · ช่องที่จด (reg) แก้ได้เฉพาะแอดมิน (เรื่องการต่อสาย CT) */
  if (b.action === "bill-cfg") {
    const old = site.bill || {};
    const rate = Number(b.rate);
    if (b.rate === "" || b.rate == null || !(rate >= 0 && rate <= 100)) return json({ error: "ราคาต่อหน่วยต้องเป็น 0–100 บาท" }, 400);
    const reg = a.admin && b.reg != null ? b.reg : old.reg || "kwh_imp";
    if (!MT_BILL_REGS.includes(reg)) return json({ error: "ช่องคิดเงินต้องเป็น kwh_imp / kwh_exp / kwh_net" }, 400);
    const bill = Object.assign({}, old, { rate, reg, vat: b.vat !== false, at: now, by: a.by });
    await rtdbUpdate(path, { bill });
    return json({ ok: true, bill });
  }
  /* บันทึกบิล — เลขมิเตอร์เซิร์ฟเวอร์อ่านเองจาก mtMeter (ผู้ใช้สั่ง 2026-11-11 "เลขไม่ต้องให้แก้ แก้แค่ราคาต่อหน่วย")
     หน้าเว็บส่งแค่เดือน + ราคาต่อหน่วย (ไม่ส่ง = ราคาที่ตั้งไว้) · VAT ตามที่ตั้งของไซต์
     บันทึกทับเดือนเดิม = เก็บฉบับก่อนไว้ใน hist/<เวลา> (รู้ว่าใครออกบิลไหนเมื่อไหร่ · ผู้ใช้สั่งเก็บผู้ออกบิล) */
  if (b.action === "bill-save") {
    const cfg = site.bill || {};
    const reg = MT_BILL_REGS.includes(cfg.reg) ? cfg.reg : "kwh_imp";
    const rate = b.rate == null || b.rate === "" ? Number(cfg.rate) : Number(b.rate);
    const [days, st] = await Promise.all([rtdbGet("mtMeter/" + n + "/d").catch(() => null), rtdbGet("mtStatus/" + n).catch(() => null)]);
    const live = st && st.meter && st.meter.modbus && st.meter.modbus.ok && st.meter.v && st.at ? { v: st.meter.v, at: Date.parse(st.at) } : null;
    const rd = billReadings(days, String(b.month || ""), reg, live);
    if (rd.error) return json({ error: rd.error }, 400);
    const r = billCalc(Object.assign({}, rd, { month: b.month, rate, reg, vat: cfg.vat !== false }));
    if (r.error) return json({ error: r.error }, 400);
    const key = r.month.replace("-", "");
    const info = site.info || {};
    let issuer = null;
    if (site.owner) {
      const p = await rtdbGet("mtPartners/" + site.owner).catch(() => null);
      const c = (p && p.company) || {};
      issuer = { pid: site.owner, name: c.name || (p && p.name) || "", addr: c.addr || "", tax: c.tax || "", branch: c.branch || "", phone: c.phone || "", email: c.email || "" };
    }
    const prev = await rtdbGet("mtBills/" + n + "/" + key).catch(() => null);
    const hist = Object.assign({}, (prev && prev.hist) || {});
    if (prev) { const { hist: _h, ...old } = prev; hist[Date.parse(prev.at) || Date.now()] = old; }
    const hk = Object.keys(hist).sort();
    while (hk.length > 20) delete hist[hk.shift()];
    const rec = Object.assign(r, { n, no: "SITE" + String(n).padStart(2, "0") + "-" + key, partial: rd.partial || null,
      cust: info.cust || cfg.cust || "", addr: info.addr || cfg.addr || "", cust_tax: info.tax || "", cust_branch: info.branch || "",
      place: info.place || "", ca: info.ca || "", meter_no: info.meter_no || "", issuer,
      note: String(b.note || "").slice(0, 300), at: now, by: a.by, by_id: a.id, by_kind: a.kind, hist: hk.length ? hist : null });
    await rtdbSet("mtBills/" + n + "/" + key, rec);
    return json({ ok: true, bill: rec });
  }

  /* ลบบิลที่ออกแล้ว (แอดมินกดเองในเว็บ · ผู้ใช้ขอลบบิลทดสอบ 2026-11-12) — เก็บสำเนาไว้ใน mtSecrets/billTrash (ปิดอ่าน) เผื่อกู้ */
  if (b.action === "bill-del") {
    const key = String(b.month || "").replace("-", "");
    if (!/^\d{4}(0[1-9]|1[0-2])$/.test(key)) return json({ error: "เดือนต้องเป็น YYYY-MM" }, 400);
    const prev = await rtdbGet("mtBills/" + n + "/" + key);
    if (!prev) return json({ error: "ไม่พบบิล" }, 404);
    await rtdbSet("mtSecrets/billTrash/" + n + "-" + key + "-" + Date.now(), Object.assign({}, prev, { deleted_at: now, deleted_by: a.by }));
    await rtdbDelete("mtBills/" + n + "/" + key);
    return json({ ok: true });
  }

  if (b.action === "remove") {
    if (site.owner) await rtdbUpdate("mtPartners/" + site.owner + "/sites", { [n]: null }).catch(() => null);
    await rtdbDelete("mtStatus/" + n).catch(() => null);
    await rtdbDelete("mtSecrets/" + n);
    await rtdbDelete(path);
    return json({ ok: true });
  }

  return json({ error: "action ไม่รู้จัก" }, 400);
}
