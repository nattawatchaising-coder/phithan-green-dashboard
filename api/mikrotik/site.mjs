/* ============================================================
   ไซต์ MikroTik — สร้าง/แก้/ลบไซต์ · สร้างสคริปต์ .rsc + peer ฝั่งเซิร์ฟเวอร์  (docs/mikrotik.md)

   GET  /api/mikrotik/site → { configured, missing: [ชื่อ env ที่ขาด] }   (ไม่บอกค่า)
   POST /api/mikrotik/site   Authorization: Bearer <Firebase ID token> — เฉพาะแอดมิน (อ่าน users/<uid> ล่าสุด ไม่เชื่อ claim)
     { action: "create", n, name, note }   → สร้างไซต์ + คู่คีย์ WireGuard + รหัส user เว็บ (เลข N ซ้ำ = 409)
     { action: "edit",   n, name, note }   → แก้ชื่อ/หมายเหตุ (คีย์ไม่เปลี่ยน — ต้องสร้างสคริปต์ใหม่ไปรันถ้าเปลี่ยนชื่อ)
     { action: "script", n }               → { rsc, peer, filename } ถอดรหัสแล้วประกอบสคริปต์ (ไม่เก็บสคริปต์ไว้ที่ไหน)
     { action: "rotate", n }               → คีย์ WireGuard + รหัส user เว็บชุดใหม่ (ต้องรันสคริปต์ใหม่ + แก้ peer บนเซิร์ฟเวอร์)
     { action: "remove", n }               → ลบ mtSites/N และ mtSecrets/N

   ข้อมูล
     mtSites/{N}   (พนักงานที่ล็อกอินอ่านได้) n name note wg_pub wg_ip lan created_* updated_* keys_at script_at script_by
     mtSecrets/{N} (เซิร์ฟเวอร์เท่านั้น — ต้องวางกฎ .read/.write false ใน Console) wg_priv web_pass: AES-256-GCM ด้วย MT_ENC_KEY
   เว็บไม่เขียน mtSites/mtSecrets เอง ทุกการเขียนผ่าน endpoint นี้ (service account)
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbSet, rtdbDelete, rtdbEtag, rtdbSetIf, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import {
  MT, MT_ENV, mtMissingEnv, validN, validName, sitePlan, identityOf,
  wgKeypair, wgPublicOf, seal, unseal, randomPassword, buildRsc, buildServerPeer,
} from "../_lib/mikrotik.mjs";

const NOTE_MAX = 500;
const aad = (n, field) => "mt/" + n + "/" + field;

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
    if (miss.length) return json({ error: "ยังไม่ได้ตั้ง env: " + miss.join(", "), need_env: true }, 503);
    const sec = await rtdbGet("mtSecrets/" + n);
    if (!sec || !sec.wg_priv || !sec.web_pass) return json({ error: "ไม่พบกุญแจของไซต์นี้ — กด \"สร้างคีย์ใหม่\"" }, 409);
    let priv, pass;
    try {
      priv = unseal(sec.wg_priv, aad(n, "wg_priv"));
      pass = unseal(sec.web_pass, aad(n, "web_pass"));
    } catch (e) {
      return json({ error: "ถอดรหัสกุญแจไม่ได้ — MT_ENC_KEY ถูกเปลี่ยน? (กด \"สร้างคีย์ใหม่\" ถ้าตั้งใจเปลี่ยน)" }, 409);
    }
    if (wgPublicOf(priv) !== site.wg_pub) return json({ error: "กุญแจที่เก็บไว้ไม่ตรงกับ public key ของไซต์ — กด \"สร้างคีย์ใหม่\"" }, 409);
    const rsc = buildRsc({ n, name: site.name, wgPrivateKey: priv, serverPublicKey: MT_ENV.serverPub(), endpoint: MT_ENV.endpoint(), webPassword: pass });
    const peer = buildServerPeer({ n, name: site.name, publicKey: site.wg_pub });
    await rtdbUpdate(path, { script_at: now, script_by: a.by }).catch(() => null);
    return json({ ok: true, rsc, peer, filename: identityOf(n, site.name) + ".rsc" });
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
