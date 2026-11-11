/* ============================================================
   ไซต์ MikroTik — ส่วนที่แตะฐานข้อมูล ใช้ร่วมกันระหว่าง api/mikrotik/site.mjs และ api/mikrotik/rsc.mjs
   (docs/mikrotik.md) · ไม่มี dependency
   ============================================================ */

import crypto from "node:crypto";
import { rtdbGet, rtdbSet, rtdbDelete, rtdbEtag, rtdbSetIf } from "./line.mjs";
import { MT_ENV, mtMissingEnv, identityOf, wgPublicOf, unseal, buildRsc, buildServerPeer } from "./mikrotik.mjs";

export const aad = (n, field) => "mt/" + n + "/" + field;

/* ประกอบสคริปต์ของไซต์ N จากกุญแจที่เข้ารหัสไว้ — คืน {rsc, peer, filename} หรือ {error, status} */
export async function scriptFor(n, site) {
  const miss = mtMissingEnv();
  if (miss.length) return { error: "ยังไม่ได้ตั้ง env: " + miss.join(", "), need_env: true, status: 503 };
  const sec = await rtdbGet("mtSecrets/" + n);
  if (!sec || !sec.wg_priv || !sec.web_pass) return { error: "ไม่พบกุญแจของไซต์นี้ — กด \"สร้างคีย์ใหม่\"", status: 409 };
  let priv, pass;
  try {
    priv = unseal(sec.wg_priv, aad(n, "wg_priv"));
    pass = unseal(sec.web_pass, aad(n, "web_pass"));
  } catch (e) {
    return { error: "ถอดรหัสกุญแจไม่ได้ — MT_ENC_KEY ถูกเปลี่ยน? (กด \"สร้างคีย์ใหม่\" ถ้าตั้งใจเปลี่ยน)", status: 409 };
  }
  if (wgPublicOf(priv) !== site.wg_pub) return { error: "กุญแจที่เก็บไว้ไม่ตรงกับ public key ของไซต์ — กด \"สร้างคีย์ใหม่\"", status: 409 };
  return {
    rsc: buildRsc({ n, name: site.name, wgPrivateKey: priv, serverPublicKey: MT_ENV.serverPub(), endpoint: MT_ENV.endpoint(), webPassword: pass }),
    peer: buildServerPeer({ n, name: site.name, publicKey: site.wg_pub }),
    filename: identityOf(n, site.name) + ".rsc",
  };
}

/* ================================================================
   ลิงก์ดึงสคริปต์แบบใช้ครั้งเดียว (คำสั่งบรรทัดเดียว — hEX /tool fetch เอง)
   เก็บแค่ SHA-256 ของโทเคนใน mtSecrets/fetch/<hash> (ปิดอ่านด้วยกฎ) — ฐานรั่วก็เอาไปใช้ไม่ได้
   หมดอายุ 15 นาที · ใช้แล้วลบทันที (ลบแบบมีเงื่อนไข ETag — ยิงพร้อมกันสองครั้งได้ไฟล์ครั้งเดียว)
   ================================================================ */
export const FETCH_TTL_MS = 15 * 60e3;
const hashOf = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
export const validToken = (t) => typeof t === "string" && /^[A-Za-z0-9_-]{43}$/.test(t);

export async function issueFetchToken(n, by) {
  /* เก็บกวาดโทเคนที่หมดอายุแล้ว (ไม่มีวันมีเยอะ — ออกทีละไซต์) */
  const all = (await rtdbGet("mtSecrets/fetch").catch(() => null)) || {};
  const now = Date.now();
  for (const h of Object.keys(all)) if (!(all[h] && all[h].exp > now)) await rtdbDelete("mtSecrets/fetch/" + h).catch(() => null);
  const token = crypto.randomBytes(32).toString("base64url");
  const exp = now + FETCH_TTL_MS;
  await rtdbSet("mtSecrets/fetch/" + hashOf(token), { n, exp, by: by || "" });
  return { token, exp };
}

/* คืน n เมื่อโทเคนถูก + ยังไม่หมดอายุ + ยังไม่เคยใช้ (แล้วลบทิ้ง) · ไม่ผ่าน = null */
export async function claimFetchToken(token) {
  if (!validToken(token)) return null;
  const path = "mtSecrets/fetch/" + hashOf(token);
  const cur = await rtdbEtag(path);
  if (!cur.value) return null;
  if (!(await rtdbSetIf(path, null, cur.etag))) return null;   // มีคนใช้ตัดหน้า
  if (!(cur.value.exp > Date.now())) return null;
  return Number(cur.value.n);
}
