/* ============================================================
   POST /api/line/push   { notifId }  →  { sent, skipped }

   ส่งแจ้งเตือนที่เพิ่งถูกเขียนลง notifications/{id} ต่อเข้า LINE

   ── ทำไม body ส่งมาแค่ notifId ──
   เซิร์ฟเวอร์อ่านเนื้อความจากฐานข้อมูลเองทั้งหมด ไม่รับข้อความจาก client เลย
   endpoint นี้จึงใช้ยิงข้อความมั่ว ๆ หาใครไม่ได้ อย่างแย่ที่สุดที่ทำได้
   คือส่งซ้ำแจ้งเตือนที่มีอยู่แล้วในฐานข้อมูลที่คนคนนั้นเขียนได้อยู่แล้ว

   ── โควตา ──
   OA แผนฟรีส่ง push ได้ราว 300 ข้อความ/เดือน เกินแล้วได้ 429 และข้อความ**หายเงียบ**
   จึงต้อง (ก) ส่งเฉพาะชนิดที่อยู่ใน config/linePush  (ข) บันทึกผลทุกครั้งลง lnPushLog
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbSet, pushMessage } from "../_lib/line.mjs";

/* ── สำเนาของ DEFAULT_PERMS (dashboard/auth.jsx) เฉพาะเท่าที่ใช้ตัดสิน toPerm ──
   ทุกวันนี้มีที่เดียวที่ใช้ toPerm คือ "permit" (app.jsx ตอนส่งข้อมูลขออนุญาต)
   ถ้าเพิ่ม toPerm ค่าใหม่ ต้องมาเติมตารางนี้ด้วย ไม่งั้นคนที่ควรได้จะไม่ได้ */
const DEFAULT_PERMS = {
  admin:  { permit: 1, om: 1, expense: 1, expenseApprove: 1, expensePay: 1 },
  lead:   { permit: 1, om: 1, expense: 1, expenseApprove: 1 },
  ee:     { permit: 1, om: 1, expense: 1 },
  draft:  {},
  tech:   { om: 1, expense: 1 },
  permit: { permit: 1 },
  sales:  {},
};
const ROLE_ALIAS = { manager: "lead", survey: "ee", office: "admin" };
/* สิทธิ์ที่มีอยู่ก่อนจะเริ่มบันทึกช่อง known — ตรงกับ PERM_KEYS_V1 ใน auth.jsx */
const PERM_KEYS_V1 = ["viewAll", "addJob", "editJob", "delJob", "price", "leads",
  "dispatch", "doSurvey", "design", "permit", "stock", "manageUsers"];

const rolesOf = (u) => {
  const raw = Array.isArray(u.roles) && u.roles.length ? u.roles : (u.role ? [u.role] : ["tech"]);
  return raw.map((r) => ROLE_ALIAS[r] || r);
};

/* ตัดสินสิทธิ์แบบเดียวกับ applyRoleConfig + can() ในเว็บ */
function canDo(user, key, cfg) {
  return rolesOf(user).some((r) => {
    const c = cfg && cfg[r];
    if (!c || !c.perms) return !!(DEFAULT_PERMS[r] || {})[key];
    const known = Array.isArray(c.known) ? c.known : PERM_KEYS_V1;
    if (known.indexOf(key) < 0) return !!(DEFAULT_PERMS[r] || {})[key];
    return !!c.perms[key];
  });
}

/* ชนิดของแจ้งเตือน — ตรงกับ notifKindKey (auth.jsx) */
function kindOf(n) {
  if (n.event && ["reject", "permit", "assign", "om", "daily", "expense", "info"].indexOf(n.event) >= 0) return n.event;
  if (n.type === "daily") return "daily";
  if (n.type === "om") return "om";
  if (n.type === "expense") return "expense";
  if (n.type === "assign") return "assign";
  if (n.type === "permit") return /ตีกลับ|แก้ไข/.test(n.title || "") ? "reject" : "permit";
  return "info";
}
const KIND_ICON = { reject: "⚠️", permit: "📄", assign: "🔧", om: "🛠️", daily: "📝", expense: "💸", info: "🔔" };

/* ชื่อ export ต้องเป็น POST ห้ามใช้ `export default`
   Vercel ตีความ default export ว่าเป็นลายเซ็นเก่า (req, res) => void
   ซึ่ง req เป็น IncomingMessage ไม่มี .text() และค่าที่ return ถูกทิ้ง → 500 ทุกครั้ง
   ตั้งชื่อตามเมธอดแทน จึงได้ Request/Response แบบเว็บมาตรฐาน ที่อ่าน body ดิบได้ */
export async function POST(request) {
  if (!ENV.token() || !ENV.rtdb()) return json({ error: "server not configured" }, 500);

  const b = await body(request);
  const notifId = b && b.notifId ? String(b.notifId) : "";
  if (!/^N-[A-Za-z0-9_-]{1,40}$/.test(notifId)) return json({ error: "bad request" }, 400);

  let n = null;
  try { n = await rtdbGet("notifications/" + notifId); } catch (e) { return json({ error: "db" }, 502); }
  if (!n) return json({ error: "not found" }, 404);

  /* กันส่งซ้ำ — หน้าเว็บอาจยิงซ้ำตอนเน็ตสะดุด และโควตาแพงเกินกว่าจะปล่อย */
  const prev = await rtdbGet("lnPushLog/" + notifId).catch(() => null);
  if (prev) return json({ sent: 0, skipped: "already" });

  const kind = kindOf(n);
  const allow = await rtdbGet("config/linePush").catch(() => null);
  /* ยังไม่ตั้งค่า = ส่งทุกชนิด · ตั้งแล้วให้ยึดตามนั้น (ปรับได้โดยไม่ต้อง deploy ใหม่) */
  if (allow && allow.kinds && !allow.kinds[kind]) return json({ sent: 0, skipped: "kind:" + kind });

  let users = null, cfg = null;
  try {
    users = await rtdbGet("users");
    cfg   = await rtdbGet("rolePerms").catch(() => null);
  } catch (e) { return json({ error: "db" }, 502); }
  const list = users && typeof users === "object" ? Object.values(users) : [];

  /* เงื่อนไข "ใบนี้ถึงใคร" ต้องตรงกับ myNotifs ใน app.jsx เป๊ะ
     ไม่งั้นจะเกิดกรณีที่ LINE เด้งแต่เปิดเว็บแล้วไม่เห็นใบนั้น (หรือกลับกัน) */
  const targets = list.filter((u) =>
    u && u.active !== false && u.lineUserId && (
      (n.toUserId && u.id === n.toUserId) ||
      (n.toTechId && u.techId && u.techId === n.toTechId) ||
      (n.toPerm && canDo(u, n.toPerm, cfg))
    ));

  const text = [
    (KIND_ICON[kind] || "🔔") + " " + (n.title || "แจ้งเตือน"),
    n.body || "",
    n.jobName ? "งาน: " + n.jobName : "",
  ].filter(Boolean).join("\n");

  const results = [];
  for (const u of targets) {
    const r = await pushMessage(u.lineUserId, [{ type: "text", text: text.slice(0, 4900) }]);
    results.push({ userId: u.id, ok: r.ok, status: r.status, err: r.err || "" });
  }

  /* บันทึกไว้เสมอ แม้ไม่มีใครให้ส่ง — ตัวนับโควตารายเดือนกับการกันส่งซ้ำอ่านจากตรงนี้ */
  await rtdbSet("lnPushLog/" + notifId, {
    at: new Date().toISOString(), kind,
    n: results.length, ok: results.filter((x) => x.ok).length, results,
  }).catch(() => {});

  return json({ sent: results.filter((x) => x.ok).length, of: results.length });
}
