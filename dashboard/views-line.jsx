/* ============================================================
   flash+solar — หน้าแอดมิน "แจ้งเตือน LINE"

   มีอยู่สองเรื่องเท่านั้น และทั้งสองเรื่องมีเพราะ **โควตา**:

   1. ตัวนับรายเดือน — OA แผนฟรีส่งข้อความได้ราว 300 ข้อความ/เดือน
      ข้อความที่เกินจะได้ 429 จาก LINE แล้ว **หายไปเงียบ ๆ** ไม่มีใครรู้
      นี่คือทางที่ระบบนี้จะพังแบบเงียบที่สุด จึงต้องเห็นกำแพงก่อนจะชน
   2. สวิตช์เลือกชนิด — เมื่อใกล้เต็ม ให้ปิดเรื่องที่ไม่เร่งด่วนก่อน
      เก็บใน config/linePush ซึ่งเซิร์ฟเวอร์อ่านทุกครั้งที่ส่ง → ปรับได้โดยไม่ต้อง deploy ใหม่

   ตัวเลขทั้งหมดมาจาก lnPushLog ที่ /api/line/push เขียนไว้ทุกครั้งที่ส่ง
   **นี่คือจำนวนที่เราส่งเอง ไม่ใช่ยอดที่ LINE นับ** — ตัวเลขจริงของ LINE ดูได้ที่
   หน้า OA Manager เท่านั้น ทั้งสองตัวควรใกล้กันแต่ไม่ต้องตรงกันเป๊ะ

   คำนำหน้า ln / Ln / LN
   ============================================================ */

/* ต้องตรงกับ kindOf ใน api/line/push.mjs — ถ้าเพิ่มชนิดที่นั่นแล้วลืมที่นี่
   สวิตช์ของชนิดใหม่จะไม่มีให้กด แล้วมันจะส่งตลอดไปโดยปิดไม่ได้ */
const LN_KIND = [
  { key: "assign",  th: "มอบหมายงาน",        icon: "🔧", hint: "ช่างถูกมอบหมายงานใหม่ — เรื่องที่ควรเปิดไว้เสมอ" },
  { key: "reject",  th: "เอกสารถูกตีกลับ",    icon: "⚠️", hint: "งานค้างจนกว่าเจ้าตัวจะรู้ — ควรเปิดไว้เสมอ" },
  { key: "om",      th: "งานบริการหลังการขาย", icon: "🛠️", hint: "ใบแจ้งซ่อม · มอบหมายงานบริการ" },
  { key: "expense", th: "ใบเบิกเงิน",         icon: "💸", hint: "ส่งขออนุมัติ · อนุมัติ · จ่ายคืน" },
  { key: "ot",      th: "ใบขอ OT",            icon: "⏱️", hint: "ขออนุมัติ · ผลการอนุมัติ" },
  { key: "permit",  th: "งานขออนุญาต",        icon: "📄", hint: "เอกสารพร้อมยื่น" },
  { key: "daily",   th: "รายงานประจำวัน",     icon: "📝", hint: "ส่งรายงาน · อนุมัติรายงาน" },
  { key: "attend",  th: "เตือนเรื่องลงเวลา",  icon: "📍", hint: "สรุปตอนเย็น — ยังไม่ออกงาน · ยังไม่ส่งรายงาน" },
  { key: "info",    th: "อื่น ๆ",             icon: "🔔", hint: "แจ้งเตือนที่ไม่เข้าชนิดไหนเลย" },
];

const LN_QUOTA_DEFAULT = 300;

/* อ่าน lnPushLog — คีย์คือ notifId ซึ่งขึ้นต้นด้วยเวลาแบบ base36 จึงเรียงตามเวลาโดยธรรมชาติ
   limitToLast กันไว้ เพราะโหนดนี้โตขึ้นทุกครั้งที่ส่งและไม่มีใครลบให้ */
function useLnPushLog(n) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!window.FBDB) { setLoading(false); return; }
    const ref = window.FBDB.ref("lnPushLog").orderByKey().limitToLast(Math.max(50, +n || 800));
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      setRows(Object.keys(v).map((k) => Object.assign({ id: k }, v[k])));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [n]);
  return { rows, loading };
}

function useLnConfig() {
  const [cfg, setCfg] = React.useState(null);
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("config/linePush");
    const h = ref.on("value", (s) => setCfg(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback((next) => {
    if (window.FBDB) window.FBDB.ref("config/linePush").set(next);
  }, []);
  return { cfg, save };
}

/* บัญชีที่ผูก LINE แล้ว — อ่านแบบ shallow ไม่ได้ใน SDK ฝั่งเว็บ จึงอ่านทั้งโหนด
   (เล็กมาก: หนึ่งแถวต่อพนักงานหนึ่งคน) */
function useLnLinks() {
  const [links, setLinks] = React.useState({});
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("lineLinks");
    const h = ref.on("value", (s) => setLinks(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  return links;
}

const lnMonthOf = (at) => String(at || "").slice(0, 7);

/* เวลาไทยของ timestamp — toISOString() เป็น UTC จึงต้องเลื่อนก่อนตัดเอาวันที่
   ห้ามใช้ toLocaleDateString("th-TH") เพราะรันไทม์คนละตัวคืน พ.ศ./ค.ศ. ไม่เหมือนกัน */
function lnLocalParts(t) {
  const d = new Date(t);
  const iso = new Date(t - d.getTimezoneOffset() * 60000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

function lnLeftText(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (m < 60) return m + " นาที";
  const h = Math.floor(m / 60);
  return h + " ชม." + (m % 60 ? " " + (m % 60) + " น." : "");
}

/* ── ทางเข้าหน้าช่างจากเบราว์เซอร์ — เปิด/ปิด/ตั้งเวลาปิดเอง ──
   กฎว่า "เปิดอยู่ไหม" อยู่ที่ lnWebOpen ใน line.jsx ที่เดียว หน้านี้ไม่ตัดสินเอง */
function LnWebSwitch({ currentUser }) {
  const gate = window.useLnWebGate ? window.useLnWebGate() : { cfg: null, loading: true, open: false, now: Date.now(), save: function () {} };
  const [hours, setHours] = React.useState("8");
  const cfg = gate.cfg || {};
  const hrs = (window.LN_WEB_HOURS || []);

  const openIt = (hKey) => {
    const h = (hrs.find((x) => x.key === hKey) || {}).h || 0;
    gate.save({
      on: 1,
      until: h ? new Date(Date.now() + h * 3600000).toISOString() : null,
      at: new Date().toISOString(),
      byId: (currentUser || {}).id || "",
      byName: (currentUser || {}).name || "",
    });
  };
  const shut = () => gate.save({ on: 0, until: null, at: new Date().toISOString(),
    byId: (currentUser || {}).id || "", byName: (currentUser || {}).name || "" });

  const left = gate.open && cfg.until ? Date.parse(cfg.until) - gate.now : 0;
  const until = cfg.until ? lnLocalParts(Date.parse(cfg.until)) : null;
  const tone = gate.open ? "#F59E0B" : "var(--text-3)";

  return (
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ทางเข้าหน้าช่างจากเบราว์เซอร์</div>
      <div style={{ marginTop: 4, marginBottom: 10, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        หน้า <b>/liff.html</b> เปิดบนคอมได้ด้วยชื่อผู้ใช้กับรหัสเดิม — มีไว้ดูและแก้หน้าจอมือถือตอนพัฒนาระบบ
        <br />ช่างไม่ได้ใช้ทางนี้ (เขาเข้าจากเมนูในแชต) ปกติจึงควรปิดไว้ แล้วเปิดเฉพาะตอนจะใช้
      </div>

      <div style={{ padding: "15px 17px", borderRadius: 15, background: "var(--surface)",
        border: "1px solid " + (gate.open ? tone : "var(--border)") }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: gate.open ? tone : "var(--text-2)" }}>
              {gate.loading ? "กำลังอ่านค่า…" : gate.open ? "เปิดอยู่" : "ปิดอยู่"}
            </div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
              {gate.loading ? "\u00a0"
                : gate.open
                  ? (cfg.until
                      ? "ปิดเองอัตโนมัติ " + window.drShort(until.date) + " " + until.time + " น. · เหลืออีก " + lnLeftText(left)
                      : "เปิดค้างไว้จนกว่าจะกดปิดเอง")
                  : "ใครเปิด /liff.html บนเบราว์เซอร์จะเจอจอแจ้งว่าทางเข้านี้ปิดอยู่"}
              {cfg.byName ? <React.Fragment><br />{gate.open ? "เปิดโดย " : "ปิดโดย "}{cfg.byName}</React.Fragment> : null}
            </div>
          </div>
          <button onClick={() => (gate.open ? shut() : openIt(hours))} disabled={gate.loading}
            style={{ width: 46, height: 26, borderRadius: 99, border: "none", cursor: gate.loading ? "default" : "pointer", padding: 3,
              background: gate.open ? tone : "var(--surface3)", display: "flex",
              justifyContent: gate.open ? "flex-end" : "flex-start", transition: "background .15s" }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, background: "#fff", display: "block" }} />
          </button>
        </div>

        {/* เลือกอายุก่อนเปิด — พอเปิดแล้วกดปุ่มเดิมซ้ำได้เพื่อต่อเวลา */}
        <div style={{ marginTop: 13, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 700 }}>
            {gate.open ? "ต่อเวลาเป็น" : "เปิดครั้งนี้นาน"}
          </span>
          {hrs.map((x) => (
            <button key={x.key} onClick={() => { setHours(x.key); if (gate.open) openIt(x.key); }}
              style={{ padding: "5px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                border: "1px solid " + (hours === x.key ? "var(--primary)" : "var(--border)"),
                background: hours === x.key ? "var(--primary-soft)" : "var(--surface2)",
                color: hours === x.key ? "var(--primary)" : "var(--text-2)" }}>{x.th}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 9, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
        นี่คือ<b>ล็อกกันเผลอ ไม่ใช่กำแพงความปลอดภัย</b> — สิ่งที่กันคนแปลกหน้าจริง ๆ ยังเป็นรหัสผ่าน
        สวิตช์นี้แค่เอาฟอร์มออกจาก URL สาธารณะในวันที่ไม่ได้ใช้
        <br />ปิดอยู่<b>ไม่กระทบใครเลย</b> — ช่างเข้าจากเมนูในแชตได้ตามปกติ แอดมินเข้าเว็บนี้ได้ตามปกติ
      </div>
    </div>
  );
}

function LineAdminView({ users, currentUser }) {
  const log = useLnPushLog(800);
  const { cfg, save } = useLnConfig();
  const links = useLnLinks();
  const [month, setMonth] = React.useState(window.drToday().slice(0, 7));

  const quota = Math.max(1, +((cfg || {}).quota) || LN_QUOTA_DEFAULT);
  /* ยังไม่เคยตั้งค่า = เปิดทุกชนิด (เหมือนที่เซิร์ฟเวอร์ตีความ) — ต้องให้หน้าจอตรงกับพฤติกรรมจริง */
  const kinds = (cfg && cfg.kinds) || null;
  const isOn = (k) => (kinds ? !!kinds[k] : true);

  const months = React.useMemo(() => {
    const set = {};
    (log.rows || []).forEach((r) => { const m = lnMonthOf(r.at); if (m) set[m] = 1; });
    set[window.drToday().slice(0, 7)] = 1;
    return Object.keys(set).sort().reverse();
  }, [log.rows]);

  const stat = React.useMemo(() => {
    const out = { sent: 0, fail: 0, calls: 0, byKind: {}, byDay: {} };
    (log.rows || []).forEach((r) => {
      if (lnMonthOf(r.at) !== month) return;
      const ok = +r.ok || 0;
      out.calls += 1;
      out.sent += ok;
      out.fail += Math.max(0, (+r.n || 0) - ok);
      const k = r.kind || "info";
      out.byKind[k] = (out.byKind[k] || 0) + ok;
      const d = String(r.at || "").slice(0, 10);
      out.byDay[d] = (out.byDay[d] || 0) + ok;
    });
    return out;
  }, [log.rows, month]);

  /* คนที่ยังไม่ผูก LINE = คนที่จะไม่มีวันได้รับแจ้งเตือนเลย และไม่มีอะไรบนหน้าจอบอก
     จนกว่าจะมีคนสังเกต — ต้องโชว์ ไม่ใช่ปล่อยให้เงียบ */
  const unbound = React.useMemo(() => (users || []).filter((u) =>
    u && u.active !== false && !u.lineUserId), [users]);
  const bound = (users || []).filter((u) => u && u.active !== false && u.lineUserId).length;

  const pct = Math.min(100, Math.round((stat.sent / quota) * 100));
  const tone = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981";

  const days = Object.keys(stat.byDay).sort();
  const peak = days.reduce((a, d) => Math.max(a, stat.byDay[d]), 0) || 1;

  /* เหลือกี่วันในเดือนนี้ กับอัตราที่ใช้อยู่ — คำถามจริงคือ "จะพอถึงสิ้นเดือนไหม" ไม่ใช่ "ส่งไปเท่าไหร่แล้ว" */
  const today = window.drToday();
  const sameMonth = month === today.slice(0, 7);
  const dayNo = sameMonth ? +today.slice(8, 10) : 31;
  const projected = sameMonth && dayNo > 2 ? Math.round((stat.sent / dayNo) * 31) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0, maxWidth: 900 }}>

      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>เดือน</span>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={window.TM_IN}>
          {months.map((m) => <option key={m} value={m}>{window.drDateTH(m + "-01").replace(/^\d+ /, "")}</option>)}
        </select>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
          ผูก LINE แล้ว {bound} คน{unbound.length ? " · ยังไม่ผูก " + unbound.length + " คน" : ""}
        </span>
      </div>

      {/* โควตา */}
      <div style={{ padding: "16px 18px", borderRadius: 15, background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 32, fontWeight: 800, color: tone }}>{stat.sent}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)" }}>/ {quota} ข้อความในเดือนนี้</span>
          <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-3)" }}>
            โควตาของแพ็กเกจ
            <input type="number" min={1} value={quota}
              onChange={(e) => save(Object.assign({}, cfg || {}, { quota: Math.max(1, +e.target.value || LN_QUOTA_DEFAULT) }))}
              style={Object.assign({}, window.TM_IN, { width: 92, padding: "6px 9px", fontSize: 12 })} />
          </label>
        </div>

        <div style={{ marginTop: 11, height: 9, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: tone, transition: "width .25s" }} />
        </div>

        <div style={{ marginTop: 9, fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
          เรียกส่ง {stat.calls} ครั้ง · ส่งถึงผู้รับ {stat.sent} ข้อความ
          {stat.fail ? " · ส่งไม่สำเร็จ " + stat.fail : ""}
          {projected != null && (
            <div style={{ marginTop: 3, color: projected > quota ? "#EF4444" : "var(--text-3)", fontWeight: projected > quota ? 700 : 400 }}>
              อัตราปัจจุบันจะจบเดือนที่ประมาณ {projected} ข้อความ
              {projected > quota ? " — เกินโควตา ควรปิดชนิดที่ไม่เร่งด่วนด้านล่าง" : ""}
            </div>
          )}
        </div>

        {days.length > 0 && (
          <div style={{ marginTop: 13, display: "flex", alignItems: "flex-end", gap: 3, height: 54 }}>
            {days.map((d) => (
              <div key={d} title={window.drDateTH(d) + " · " + stat.byDay[d] + " ข้อความ"}
                style={{ flex: 1, minWidth: 4, height: Math.max(3, Math.round((stat.byDay[d] / peak) * 54)),
                  background: "var(--primary)", opacity: .75, borderRadius: 3 }} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 11, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
          ตัวเลขนี้นับจากที่ <b>ระบบเราส่งออกไป</b> ไม่ใช่ยอดที่ LINE นับให้ — ยอดจริงดูได้ที่ LINE OA Manager
          ทั้งสองตัวควรใกล้กัน ถ้าต่างกันมากแปลว่ามีบางอย่างส่งข้อความนอกระบบนี้
          <br />ข้อความตอบกลับตอนมีคนทักแชต (reply) <b>ไม่นับโควตา</b> จึงไม่อยู่ในตัวเลขนี้
        </div>
      </div>

      {/* สวิตช์ชนิด */}
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>เรื่องไหนส่งเข้า LINE บ้าง</div>
        <div style={{ marginTop: 4, marginBottom: 10, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
          ปิดแล้ว<b>ไม่ได้ทำให้แจ้งเตือนหาย</b> — ใบยังขึ้นกระดิ่งบนเว็บและในแอปไลน์ครบเหมือนเดิม แค่ไม่เด้งเข้าแชต
          <br />มีผลทันที ไม่ต้องอัปเว็บใหม่
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
          {LN_KIND.map((k) => {
            const on = isOn(k.key);
            const used = stat.byKind[k.key] || 0;
            return (
              <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{k.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{k.th}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>{k.hint}</div>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800,
                  color: used ? "var(--text-1)" : "var(--text-3)", minWidth: 42, textAlign: "right" }}>{used}</span>
                <button onClick={() => {
                    /* ครั้งแรกที่กด ต้องเขียนสถานะของ "ทุกชนิด" ลงไป ไม่ใช่ชนิดเดียว
                       เพราะ config ที่มีคีย์ kinds แล้วถือว่าอันที่ไม่อยู่ในนั้น = ปิด
                       ถ้าเขียนคีย์เดียว ชนิดที่เหลือจะถูกปิดหมดโดยไม่มีใครสั่ง */
                    const base = {};
                    LN_KIND.forEach((x) => { base[x.key] = isOn(x.key) ? 1 : 0; });
                    base[k.key] = on ? 0 : 1;
                    save(Object.assign({}, cfg || {}, { kinds: base }));
                  }}
                  style={{ width: 46, height: 26, borderRadius: 99, border: "none", cursor: "pointer", padding: 3,
                    background: on ? "var(--primary)" : "var(--surface3)", display: "flex",
                    justifyContent: on ? "flex-end" : "flex-start", transition: "background .15s" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 99, background: "#fff", display: "block" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* คนที่ยังไม่ผูก */}
      {unbound.length > 0 && (
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ยังไม่ได้ผูกบัญชี LINE · {unbound.length} คน</div>
          <div style={{ marginTop: 4, marginBottom: 9, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
            คนกลุ่มนี้<b>ไม่ได้รับแจ้งเตือนทาง LINE เลย</b> ไม่ว่าจะตั้งสวิตช์ไว้ยังไง — เขาจะเห็นเฉพาะกระดิ่งบนเว็บ
            <br />วิธีผูก: แอด OA เป็นเพื่อน → เปิดเมนูด้านล่าง → กรอกชื่อผู้ใช้กับรหัสเดิมครั้งเดียว
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {unbound.map((u) => (
              <span key={u.id} style={{ padding: "5px 11px", borderRadius: 99, background: "var(--surface2)",
                border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>{u.name}</span>
            ))}
          </div>
        </div>
      )}

      <LnWebSwitch currentUser={currentUser} />

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.8 }}>
        <b>ถ้าโควตาใกล้เต็ม</b> ลำดับที่ควรทำ: ปิด “รายงานประจำวัน” กับ “อื่น ๆ” ก่อน (คนเปิดแอปเจออยู่แล้ว) →
        ปิด “ใบเบิกเงิน” เฉพาะช่วงสิ้นเดือน → เก็บ “มอบหมายงาน” กับ “เอกสารถูกตีกลับ” ไว้จนถึงที่สุด
        เพราะสองเรื่องนี้คืองานที่จะค้างถ้าคนไม่รู้
        <br /><b>ถ้าเต็มบ่อย</b> ทางแก้จริงคือขึ้นแพ็กเกจของ LINE OA ไม่ใช่ไล่ปิดจนไม่เหลืออะไร
      </div>
    </div>
  );
}

Object.assign(window, { LineAdminView, LnWebSwitch, LN_KIND, useLnPushLog, useLnConfig, useLnLinks, lnLocalParts, lnLeftText });
