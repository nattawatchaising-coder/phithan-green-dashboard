/* ============================================================
   ไซต์ MikroTik — สร้าง/แก้/ลบไซต์ · สร้างสคริปต์ .rsc + peer ฝั่งเซิร์ฟเวอร์  (docs/mikrotik.md)

   GET  /api/mikrotik/site → { configured, missing: [ชื่อ env ที่ขาด] }   (ไม่บอกค่า)
   POST /api/mikrotik/site   Authorization: Bearer <Firebase ID token> — เฉพาะแอดมิน (อ่าน users/<uid> ล่าสุด ไม่เชื่อ claim)
     { action: "create", n, name, note }   → สร้างไซต์ + คู่คีย์ WireGuard + รหัส user เว็บ (เลข N ซ้ำ = 409)
     { action: "edit",   n, name, note }   → แก้ชื่อ/หมายเหตุ (คีย์ไม่เปลี่ยน — ต้องสร้างสคริปต์ใหม่ไปรันถ้าเปลี่ยนชื่อ)
     { action: "script", n }               → { rsc, peer, filename } ถอดรหัสแล้วประกอบสคริปต์ (ไม่เก็บสคริปต์ไว้ที่ไหน)
     { action: "fetch-token", n }          → { command, command_nocheck, peer, exp } คำสั่งบรรทัดเดียวให้ hEX ดึงสคริปต์เอง (ใช้ครั้งเดียว 15 นาที)
     { action: "rotate", n }               → คีย์ WireGuard + รหัส user เว็บชุดใหม่ (ต้องรันสคริปต์ใหม่ + แก้ peer บนเซิร์ฟเวอร์)
     { action: "remove", n }               → ลบ mtSites/N และ mtSecrets/N

   ข้อมูล
     mtSites/{N}   (พนักงานที่ล็อกอินอ่านได้) n name note wg_pub wg_ip lan created_* updated_* keys_at script_at script_by
     mtSecrets/{N} (เซิร์ฟเวอร์เท่านั้น — ต้องวางกฎ .read/.write false ใน Console) wg_priv web_pass: AES-256-GCM ด้วย MT_ENC_KEY
   เว็บไม่เขียน mtSites/mtSecrets เอง ทุกการเขียนผ่าน endpoint นี้ (service account)
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbSet, rtdbDelete, rtdbEtag, rtdbSetIf, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import { MT, MT_ENV, parseEndpoint, mtMissingEnv, validN, validName, sitePlan, wgKeypair, seal, randomPassword } from "../_lib/mikrotik.mjs";
import { aad, scriptFor, issueFetchToken } from "../_lib/mtstore.mjs";

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
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const a = await admin(request);
  if (a.err) return a.err;
  const b = (await body(request)) || {};
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

  if (b.action === "remove") {
    await rtdbDelete("mtSecrets/" + n);
    await rtdbDelete(path);
    return json({ ok: true });
  }

  return json({ error: "action ไม่รู้จัก" }, 400);
}
