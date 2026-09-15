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
import { flexNotif, pushCard } from "../_lib/flex.mjs";

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
  if (n.event && ["reject", "permit", "assign", "om", "daily", "expense", "ot", "attend", "info"].indexOf(n.event) >= 0) return n.event;
  if (n.type === "daily") return "daily";
  if (n.type === "om") return "om";
  if (n.type === "expense") return "expense";
  if (n.type === "ot") return "ot";
  if (n.type === "attend") return "attend";
  if (n.type === "assign") return "assign";
  if (n.type === "permit") return /ตีกลับ|แก้ไข/.test(n.title || "") ? "reject" : "permit";
  return "info";
}
const KIND_ICON = { reject: "⚠️", permit: "📄", assign: "🔧", om: "🛠️", daily: "📝", expense: "💸", ot: "⏱️", attend: "📍", info: "🔔" };

/* ── เติมชื่องานให้ใบแจ้งเตือน ──
   ใบส่วนใหญ่ไม่ได้พกชื่องานมาด้วย พกแค่ id (omNotify ส่ง omSiteId · บางที่ส่ง jobId)
   ผลคือการ์ดขึ้นแต่หัวเรื่องกับเวลา อ่านแล้วไม่รู้ว่าเป็นงานของใคร
   เติมที่นี่จุดเดียวได้ผลกับใบเก่าทุกใบที่ยังไม่ได้ส่งด้วย ต่างจากการไล่แก้คนสร้างใบทีละที่
   ซึ่งมีห้าไฟล์และแก้แล้วก็ยังช่วยใบที่เขียนไปแล้วไม่ได้

   id มาจากฐานข้อมูลก็จริง แต่ต่อเข้า path ตรง ๆ ไม่ได้ — ตัวที่มี / หรือ . จะเปลี่ยน
   ความหมายของ path ทั้งเส้น จึงรับเฉพาะรูปแบบ id ที่ระบบนี้ออกจริง */
const idOk = (v) => /^[A-Za-z0-9_-]{1,60}$/.test(String(v || ""));

export async function fillJob(n) {
  if (n.jobName) return n;                       /* คนสร้างใบใส่มาแล้ว ไม่ต้องยุ่ง */
  const grab = async (path, id) => {
    if (!idOk(id)) return null;
    return await rtdbGet(path + "/" + id).catch(() => null);
  };
  if (n.omSiteId) {
    const site = await grab("omSites", n.omSiteId);
    /* ไซต์ที่เปิดไว้โดยยังไม่ได้ตั้งชื่อจะมี name เป็นค่าว่าง — ใช้รหัสแทน
       รหัสยังพาไปหาใบที่ถูกได้ ดีกว่าการ์ดที่ไม่บอกอะไรเลย */
    n.jobName = (site && site.name) || "";
    n.jobCode = n.jobCode || (site && site.code) || (idOk(n.omSiteId) ? n.omSiteId : "");
    return n;
  }
  if (n.jobId) {
    const job = await grab("jobs", n.jobId);
    n.jobName = (job && job.name) || "";
    n.jobCode = n.jobCode || (job && job.code) || (idOk(n.jobId) ? n.jobId : "");
  }
  return n;
}

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

  /* ใบที่ต้นทางบอกว่าอย่าเด้ง — ใบที่ยังไม่มีเจ้าของ (ดู omNotify ใน om.jsx)
     ด่านนี้ซ้ำกับฝั่งหน้าเว็บโดยตั้งใจ เพราะ endpoint นี้ยิงซ้ำจากที่อื่นได้
     (cron · เรียกมือตอนไล่ใบค้าง) ซึ่งไม่ได้ผ่านการตัดสินใจฝั่งหน้าเว็บเลย
     ไม่เขียน lnPushLog ไว้ เพราะร่องรอยอยู่ในตัวเรคคอร์ดเองแล้ว (push: false)
     และถ้าเขียนไว้ ใบนี้จะถูกกันไม่ให้ส่งตลอดไปแม้ภายหลังจะเปลี่ยนใจ */
  if (n.push === false) return json({ sent: 0, skipped: "no-push" });

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

  /* เติมชื่องานก่อนประกอบทั้งการ์ดและตัวหนังสือสำรอง จะได้ไม่ต่างกันสองแบบ */
  await fillJob(n).catch(() => {});

  const text = [
    (KIND_ICON[kind] || "🔔") + " " + (n.title || "แจ้งเตือน"),
    n.body || "",
    n.jobName ? "งาน: " + n.jobName : (n.jobCode ? "งาน: " + n.jobCode : ""),
  ].filter(Boolean).join("\n");

  /* ส่งเป็นการ์ด Flex — กดได้ทั้งใบ เข้าตรงแท็บที่เกี่ยวกับเรื่องนั้นในแอป
     ตัวหนังสือชุดเดิมยังประกอบไว้ ใช้เป็นตาข่ายรับเวลาการ์ดถูกปฏิเสธ (ดู pushCard) */
  const card = flexNotif(kind, n);

  const results = [];
  for (const u of targets) {
    const r = await pushCard(pushMessage, u.lineUserId, card, text);
    results.push({ userId: u.id, ok: r.ok, status: r.status, err: r.err || "", fellback: !!r.fellback });
  }

  /* บันทึกไว้เสมอ แม้ไม่มีใครให้ส่ง — ตัวนับโควตารายเดือนกับการกันส่งซ้ำอ่านจากตรงนี้ */
  await rtdbSet("lnPushLog/" + notifId, {
    at: new Date().toISOString(), kind,
    n: results.length, ok: results.filter((x) => x.ok).length, results,
  }).catch(() => {});

  return json({ sent: results.filter((x) => x.ok).length, of: results.length });
}
