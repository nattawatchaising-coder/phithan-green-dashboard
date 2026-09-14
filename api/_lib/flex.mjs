/* ============================================================
   flash+solar — การ์ดแจ้งเตือนใน LINE (Flex Message)

   ── ทำไมเป็น Flex ไม่ใช่ "รูปภาพ" จริง ๆ ──
   LINE มีสามทางที่ทำให้แจ้งเตือนไม่ใช่ตัวหนังสือเปล่า:
     1. Flex Message — การ์ดที่บรรยายด้วย JSON กดได้ทั้งใบ ← ใช้ตัวนี้
     2. Imagemap    — รูปจริงที่แบ่งโซนกดได้ แต่ต้องมี **ไฟล์รูปใหม่ทุกใบแจ้งเตือน**
                      ซึ่งแปลว่าต้องวาดรูปฝั่งเซิร์ฟเวอร์ = ต้องมีไลบรารีวาดภาพ
                      แต่ vercel.json ตั้ง installCommand: null → ติดตั้งอะไรไม่ได้เลย
                      (ดูเหตุผลเต็มที่หัว _lib/line.mjs) ⇒ ทางนี้ปิดตายสำหรับเนื้อหาที่เปลี่ยนทุกใบ
     3. Template    — รูป + ปุ่ม แต่จัดวางอะไรไม่ได้เลยนอกจากที่เขากำหนดมา
   Flex จึงเป็นทางเดียวที่ได้ "การ์ดที่ออกแบบแล้วและกดได้" โดยไม่ต้องมีไฟล์รูป

   ── สิ่งที่ Flex ไม่ได้ช่วย ──
   โควตายังเท่าเดิม การ์ดหนึ่งใบ = หนึ่งข้อความ เหมือนตัวหนังสือเปล่าเป๊ะ
   และ altText ยังเป็นตัวหนังสือ เพราะนั่นคือสิ่งที่โผล่บนหน้าจอล็อกกับในรายการแชต
   คนส่วนใหญ่ตัดสินใจว่าจะเปิดไหมจากบรรทัดนั้น ไม่ใช่จากการ์ด ⇒ altText ต้องเขียนให้ดี

   ⚠ ไม่มี dependency — ดูเหตุผลที่หัว _lib/line.mjs
   ============================================================ */

/* LIFF ID ไม่ใช่ค่าลับ (อยู่ใน URL liff.line.me/<id> ที่ผู้ใช้กดอยู่แล้ว)
   ต้นทางของค่านี้คือ window.LN_LIFF_ID ใน liff.html — แก้ที่นั่นแล้วต้องมาแก้ที่นี่ด้วย
   ตั้ง LIFF_ID ใน Vercel Environment Variables ทับได้ เผื่อวันที่มี LIFF ตัวทดสอบ */
const LIFF_ID = (process.env.LIFF_ID || "2011577974-yzS9mgQQ").trim();

/* ── หน้าตาของแจ้งเตือนแต่ละชนิด ──
   สีกับแท็บปลายทางใช้ชุดเดียวกับ LN_NOTIF_KIND ใน dashboard/liff-app.jsx
   เห็นการ์ดสีม่วงแล้วกดเข้าไปต้องเจอแท็บเบิกเงินสีม่วงอันเดิม ไม่ใช่สีคนละชุด

   tab = แท็บที่จะเปิดให้เมื่อกดการ์ด — ต้องเป็นคีย์ที่มีอยู่จริงใน LN_TAB (liff-app.jsx)
   คีย์ที่พิมพ์ผิดจะไม่พัง แต่จะตกไปหน้าแรกเงียบ ๆ ซึ่งหาสาเหตุยากกว่าพัง */
export const LN_KIND = {
  reject:  { th: "ถูกตีกลับให้แก้",  icon: "⚠️", color: "#D93025", tab: "bell"  },
  permit:  { th: "งานขออนุญาต",    icon: "📄", color: "#64748B", tab: "bell"  },
  assign:  { th: "งานติดตั้ง",      icon: "🔧", color: "#1B9B75", tab: "jobs"  },
  om:      { th: "งานซ่อม",        icon: "🛠️", color: "#F59E0B", tab: "fix"   },
  daily:   { th: "รายงานประจำวัน",  icon: "📝", color: "#0EA5E9", tab: "daily" },
  expense: { th: "ใบเบิกเงิน",      icon: "💸", color: "#8B5CF6", tab: "ec"    },
  ot:      { th: "ใบขอ OT",        icon: "⏱️", color: "#6366F1", tab: "time"  },
  attend:  { th: "ลงเวลาทำงาน",    icon: "📍", color: "#10B981", tab: "time"  },
  info:    { th: "แจ้งเตือน",       icon: "🔔", color: "#94A3B8", tab: "bell"  },
};

export const liffUrl = (tab) =>
  "https://liff.line.me/" + LIFF_ID + (tab ? "?tab=" + encodeURIComponent(tab) : "");

/* ตัดข้อความให้พอดีช่อง — ตัดแล้วเติม … ให้รู้ว่ายังมีต่อ ไม่ใช่ตัดหน้าตาเฉย
   Flex ไม่บังคับความยาวต่อช่อง แต่การ์ดที่ยาวเกินจอจะถูกย่อโดย LINE เอง
   แบบที่เราคุมไม่ได้ว่าจะขาดตรงไหน — คุมเองดีกว่า */
const clip = (s, n) => {
  const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

/* "2026-09-13T07:32:11.000Z" → "13 ก.ย. 69 · 14:32" (เวลาไทย)
   ห้ามใช้ toLocale* บนเซิร์ฟเวอร์ — เหตุผลเดียวกับที่หัวส่วนวันที่ใน _lib/line.mjs */
const TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export function stampTH(iso) {
  const t = Date.parse(String(iso || ""));
  if (!isFinite(t)) return "";
  const d = new Date(t + 7 * 3600 * 1000);
  return d.getUTCDate() + " " + TH_MON[d.getUTCMonth()] + " " + String(d.getUTCFullYear() + 543).slice(2)
    + " · " + String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0");
}

/* แถวข้อมูลในการ์ด — ป้ายซ้ายกว้างคงที่ ค่าขวาตัดบรรทัดได้
   flex คงที่ฝั่งป้ายเพื่อให้หลายแถวเรียงตรงกัน ไม่ใช่เยื้องตามความยาวคำ

   ⚠ คืน null เมื่อค่าว่าง แล้วให้คนเรียกกรองทิ้ง — **ห้ามปล่อยช่อง text ว่างเด็ดขาด**
     LINE ไม่ได้ข้ามช่องนั้นให้ แต่ตอบ 400 แล้วทิ้งการ์ดทั้งใบ
     เคสที่เกิดจริง: n.at เป็นค่าที่ Date.parse อ่านไม่ออก → stampTH คืน "" */
const kv = (label, value) => {
  const v = clip(value, 90);
  if (!v) return null;
  return {
    type: "box", layout: "baseline", spacing: "sm", margin: "sm",
    contents: [
      { type: "text", text: label, size: "xs", color: "#93A3AC", flex: 2 },
      { type: "text", text: v, size: "xs", color: "#41535C", flex: 5, wrap: true },
    ],
  };
};

/* ================================================================
   การ์ดแจ้งเตือนหนึ่งใบ
   n = ใบใน notifications/{id} · kind = ผลของ kindOf() ใน push.mjs
   ================================================================ */
export function flexNotif(kind, n) {
  const k = LN_KIND[kind] || LN_KIND.info;
  const url = liffUrl(k.tab);
  const title = clip(n.title || k.th, 110);
  const detail = clip(n.body || "", 260);

  const body = [{ type: "text", text: title, weight: "bold", size: "md", color: "#152229", wrap: true }];
  if (detail) body.push({ type: "text", text: detail, size: "sm", color: "#5B6B73", wrap: true, margin: "md" });

  const rows = [
    kv("งาน", n.jobName),
    kv("รหัสงาน", n.jobCode),
    kv("จาก", n.byName),
    kv("เมื่อ", stampTH(n.at)),
  ].filter(Boolean);
  if (rows.length) {
    body.push({ type: "separator", margin: "lg", color: "#E8EDEA" });
    body.push({ type: "box", layout: "vertical", margin: "lg", contents: rows });
  }

  return {
    type: "flex",
    /* บรรทัดนี้คือสิ่งที่เด้งบนหน้าจอล็อก — ต้องอ่านจบได้โดยไม่ต้องเปิดแอป
       และเป็นตัวสำรองให้ LINE รุ่นเก่าที่แสดง Flex ไม่ได้ด้วย */
    altText: clip(k.icon + " " + title + (detail ? " — " + detail : ""), 380),
    contents: {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", backgroundColor: k.color, paddingAll: "13px",
        contents: [{ type: "text", text: k.icon + "  " + k.th, color: "#FFFFFF", size: "sm", weight: "bold" }],
      },
      body: { type: "box", layout: "vertical", paddingAll: "16px", contents: body },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px", paddingTop: "0px",
        contents: [{
          type: "button", style: "primary", height: "sm", color: k.color,
          action: { type: "uri", label: "เปิดดูในแอป", uri: url },
        }],
      },
      /* กดตรงไหนของการ์ดก็เข้าได้ ไม่ใช่ต้องเล็งปุ่มเล็ก ๆ ด้วยนิ้วโป้งข้างเดียวหน้างาน */
      action: { type: "uri", label: "เปิดดูในแอป", uri: url },
    },
  };
}

/* ================================================================
   การ์ดสรุปตอนเย็นของ cron — หลายบรรทัดในใบเดียว
   lines = ข้อความล้วน บรรทัดละเรื่อง (ขึ้นต้นด้วย • หรือ – อยู่แล้ว)
   ================================================================ */
export function flexDigest(dateTH, lines) {
  const k = LN_KIND.attend;
  const url = liffUrl("time");
  /* กรองบรรทัดว่างทิ้งก่อน แล้วค่อยตัดที่ 12 — กล่องที่ contents ว่าง
     หรือมีช่อง text ว่าง LINE ปฏิเสธทั้งใบเหมือนกัน (ดูหมายเหตุที่ kv)
     ตามหลักแล้ว cron ไม่ส่งใบที่ไม่มีเรื่องอยู่แล้ว แต่ฟังก์ชันนี้ต้องประกอบใบเสียไม่ได้ */
  const list = (lines || []).map((s) => clip(s, 120)).filter(Boolean).slice(0, 12)
    .map((s) => ({ type: "text", text: s, size: "sm", color: "#41535C", wrap: true, margin: "sm" }));
  if (!list.length) list.push({ type: "text", text: "ไม่มีเรื่องค้าง", size: "sm", color: "#93A3AC", wrap: true });

  return {
    type: "flex",
    altText: clip("📍 สรุปตอนเย็น " + dateTH + " — " + (lines || []).join(" · "), 380),
    contents: {
      type: "bubble", size: "kilo",
      header: {
        type: "box", layout: "vertical", backgroundColor: k.color, paddingAll: "13px",
        contents: [
          { type: "text", text: "📍  สรุปตอนเย็น", color: "#FFFFFF", size: "sm", weight: "bold" },
          { type: "text", text: dateTH, color: "#DFF5EB", size: "xs", margin: "xs" },
        ],
      },
      body: { type: "box", layout: "vertical", paddingAll: "16px", contents: list },
      footer: {
        type: "box", layout: "vertical", paddingAll: "12px", paddingTop: "0px",
        contents: [{
          type: "button", style: "primary", height: "sm", color: k.color,
          action: { type: "uri", label: "เปิดดูในแอป", uri: url },
        }],
      },
      action: { type: "uri", label: "เปิดดูในแอป", uri: url },
    },
  };
}

/* ================================================================
   ส่งการ์ด โดยมีตัวหนังสือเป็นตาข่ายรับ

   Flex ที่ประกอบผิดกติกาแม้นิดเดียว LINE ตอบ 400 แล้ว**ข้อความหายทั้งใบ**
   ซึ่งเป็นความเสี่ยงที่ตัวหนังสือเปล่าไม่เคยมี — ของสวยขึ้นต้องไม่แลกกับของไม่ถึง
   ถ้าการ์ดไม่ผ่าน ให้ส่งตัวหนังสือแบบเดิมตามไปทันที (คำขอที่ล้มไม่กินโควตา)
   และคืน fellback: true ไว้ให้ lnPushLog บันทึก จะได้รู้ว่าการ์ดพังโดยไม่ต้องรอคนมาบ่น
   ================================================================ */
export async function pushCard(pushMessage, to, card, fallbackText) {
  const r = await pushMessage(to, [card]);
  if (r.ok || !fallbackText) return r;
  /* 429 = โควตาหมด · 5xx = ฝั่ง LINE ล่ม — ส่งซ้ำเป็นตัวหนังสือก็ไม่ผ่านเหมือนกัน
     ลองใหม่เฉพาะ 400 ซึ่งแปลว่า "การ์ดใบนี้ผิดรูป" อย่างเดียว */
  if (r.status !== 400) return r;
  console.warn("[line/flex] การ์ดถูกปฏิเสธ ส่งเป็นตัวหนังสือแทน:", (r.err || "").slice(0, 200));
  const t = await pushMessage(to, [{ type: "text", text: String(fallbackText).slice(0, 4900) }]);
  return { ok: t.ok, status: t.status, err: t.err || "", fellback: true };
}
