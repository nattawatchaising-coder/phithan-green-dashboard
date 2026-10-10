/* ============================================================
   flash+solar — สิทธิ์ Google/Firebase ฝั่งเซิร์ฟเวอร์ (service account)

   ทำสองอย่าง:
   1. customToken(uid, claims) — ใบผ่านให้เบราว์เซอร์เอาไป signInWithCustomToken
      ฐานข้อมูลจึงรู้ว่าใครเป็นใคร (auth.uid = id ผู้ใช้ในระบบ) แทนที่จะเป็นคนไม่ระบุตัวตน
   2. accessToken() — ให้ endpoint/cron ยิง REST ด้วยสิทธิ์ผู้ดูแล (ข้ามกฎฐานข้อมูล)
      ไม่งั้นวันที่รัดกฎเป็น auth != null ทุก route จะได้ 401

   ⚠ ไม่มี dependency เหมือน line.mjs — เซ็น RS256 ด้วย node:crypto เอง
   ⚠ ค่าลับอยู่ใน Vercel Environment Variables ชื่อ FIREBASE_SERVICE_ACCOUNT เท่านั้น
      (วางไฟล์ JSON ที่ดาวน์โหลดจาก Firebase ทั้งก้อน) — ห้ามมีในไฟล์ใด ๆ ของ repo
   ยังไม่ได้ตั้ง = configured() เป็น false แล้วทุกอย่างทำงานแบบเดิม (ยิง REST เปล่า)
   ============================================================ */

import crypto from "node:crypto";

let _sa;   // undefined = ยังไม่ได้อ่าน · null = ไม่มี/อ่านไม่ได้
function sa() {
  if (_sa !== undefined) return _sa;
  _sa = null;
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (!raw) return _sa;
  try {
    /* รับได้ทั้ง JSON ตรง ๆ และ base64 ของ JSON — บางคนวางแบบ base64 เพราะกลัวขึ้นบรรทัดใหม่พัง */
    const j = JSON.parse(raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
    /* private_key ที่ผ่านการก๊อปมักเหลือ \n เป็นตัวอักษรสองตัว ไม่ใช่ขึ้นบรรทัดจริง */
    const key = String(j.private_key || "").replace(/\\n/g, "\n");
    if (j.client_email && key.includes("PRIVATE KEY")) _sa = { email: j.client_email, key };
  } catch (e) {}
  return _sa;
}

export const configured = () => !!sa();

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

function signJwt(payload) {
  const s = sa();
  const head = b64url({ alg: "RS256", typ: "JWT" }) + "." + b64url(payload);
  const sig = crypto.createSign("RSA-SHA256").update(head).sign(s.key).toString("base64url");
  return head + "." + sig;
}

/* ใบผ่านอายุ 1 ชม. — ใช้แค่ครั้งเดียวตอนล็อกอิน หลังจากนั้น SDK ต่ออายุเองด้วย refresh token
   claims ใส่ตำแหน่งไว้ให้กฎขั้นถัดไปใช้ (auth.token.roles) — ตอนนี้กฎยังไม่ได้อ่าน */
export function customToken(uid, claims) {
  if (!sa()) return null;
  const now = Math.floor(Date.now() / 1000);
  return signJwt({
    iss: sa().email, sub: sa().email,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now, exp: now + 3600, uid: String(uid), claims: claims || {},
  });
}

/* access token ของ service account — เก็บไว้ใช้ซ้ำจนใกล้หมดอายุ (instance ของ Vercel อยู่ได้หลายคำขอ) */
let _tok = null, _tokExp = 0;
export async function accessToken() {
  if (!sa()) return null;
  if (_tok && Date.now() < _tokExp - 60000) return _tok;
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: sa().email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + assertion,
  });
  if (!r.ok) throw new Error("google token " + r.status);
  const j = await r.json();
  _tok = j.access_token; _tokExp = Date.now() + (Number(j.expires_in) || 3600) * 1000;
  return _tok;
}
