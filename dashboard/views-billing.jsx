/* ============================================================
   flash+solar — งวดงาน · วางบิล: การ์ดในใบงาน · แผงตั้งงวด · หน้ารวมของบัญชี

   ตรรกะทั้งหมดอยู่ใน billing.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มและป้ายยืมของใบเบิกเงิน (window.EC_INPUT / EcPill / EcStat / EcBigShot)
   เพราะทุกโมดูลในระบบต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   กฎการออกแบบของไฟล์นี้: ไม่มีคอมโพเนนต์ไหนแตะ Firebase หรือ store เอง
   การเขียนข้อมูลงวดรับมาเป็น prop (onSaveBills) เสมอ — สิทธิ์จึงกั้นได้ที่จุดต่อสาย
   และตรรกะทั้งชุดทดสอบได้โดยไม่ต้องเขียนฐานข้อมูลจริง (มีแต่รูปที่เขียนผ่าน useBillPhotos)

   ตั้งชื่อ top-level ขึ้นต้นด้วย Bl/bl กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const BL_ACCENT = "#6366F1";
const BL_INPUT = () => window.EC_INPUT || { width: "100%", padding: "10px 12px" };

const blMoney = (n) => (window.sBaht ? window.sBaht(n) : String(n));
const blDay = (v) => (v ? (window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10)) : "—");

function BlPill({ row, sub }) {
  const st = window.blStatusOf((row || {}).status);
  return <window.EcPill th={st.th} color={st.color} sub={sub} />;
}

/* ── แถบงวด ──
   หนึ่งช่องต่อหนึ่งงวด ไม่ใช่ต่อหนึ่งสถานะ — จำนวนงวดไม่เท่ากันทุกสัญญา
   แถบขั้นตอนตายตัวแบบงานขออนุญาตจึงใช้ไม่ได้ · อ่านทั้งโปรเจคจบในบรรทัดเดียว */
function BlRail({ rows, curId, onPick }) {
  const list = (rows || []).filter(window.blLive);
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {list.map((r) => {
        const st = window.blStatusOf(r.status);
        const on = r.id === curId;
        return (
          <div key={r.id} onClick={onPick ? () => onPick(r) : undefined}
            style={{ flex: 1, minWidth: 0, cursor: onPick ? "pointer" : "default" }}>
            <div style={{ height: 4, borderRadius: 99, background: st.color, opacity: r.status === "pending" ? 0.35 : 1 }} />
            <div style={{ fontSize: 9.5, marginTop: 3, color: on ? st.color : "var(--text-3)", fontWeight: on ? 800 : 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>งวด {r.n}</div>
          </div>
        );
      })}
    </div>
  );
}

/* กล่องเตือนในการ์ด — โทนเดียวกับกล่อง "ไม่ผ่าน" ของงานขออนุญาต */
function BlNote({ tone, children }) {
  const c = tone === "ok"
    ? { bg: "var(--tint-ok-bg)", bd: "var(--tint-ok-bd)", tx: "var(--tint-ok-tx)" }
    : tone === "red"
      ? { bg: "var(--tint-red-bg)", bd: "var(--tint-red-bd)", tx: "var(--tint-red-tx)" }
      : { bg: "var(--tint-amber-bg)", bd: "var(--tint-amber-bd)", tx: "var(--tint-amber-tx)" };
  return (
    <div style={{ margin: "0 12px 10px", padding: "8px 11px", borderRadius: 10, background: c.bg,
      border: "1px solid " + c.bd, color: c.tx, fontSize: 11.5, lineHeight: 1.55 }}>{children}</div>
  );
}

/* ปุ่มเดินสถานะ — สร้างจาก blNext เท่านั้น ขั้นที่ผิดกติกาจึงไม่โผล่ตั้งแต่แรก */
function BlMoveBtns({ row, bills, role, currentUser, job, onMove, size }) {
  const nexts = window.blNext(row, role, currentUser, bills);
  const block = window.blReadyToBill(row, bills);
  const showWhy = row && row.status === "ready" && !block.ok && window.blCanUse(role);
  if (!nexts.length && !showWhy) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {nexts.map((s) => {
        const fwd = window.blFlowIdx(s.key) > window.blFlowIdx(row.status);
        return (
          <button key={s.key} onClick={() => onMove(row, s.key)}
            style={{ padding: size === "sm" ? "6px 10px" : "8px 12px", borderRadius: 9, fontFamily: "inherit",
              fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 700, cursor: "pointer",
              border: fwd ? "none" : "1px solid var(--border-strong)",
              background: fwd ? s.color : "var(--surface)", color: fwd ? "#fff" : "var(--text-2)" }}>
            {window.blFlowIdx(s.key) < window.blFlowIdx(row.status) ? "ถอยกลับ · " + s.short
              : s.key === "ready" ? "ถึงงวด" : s.key === "billed" ? "ออกเอกสาร"
                : s.key === "accepted" ? "ส่งมอบเอกสาร" : s.key === "paid" ? "รับเงิน" : s.th}
          </button>
        );
      })}
      {showWhy && <span style={{ fontSize: 11, color: "var(--tint-amber-tx)" }}>· {block.why}</span>}
    </div>
  );
}

/* คำถามถัดไปของคนที่เพิ่งกด "รับเงิน" คือ "แล้วยังเหลืออีกเท่าไร" — ตอบตรงนั้นเลย ไม่ต้องให้ไปเปิดหน้าอื่น
   คิดจากก้อนที่เพิ่งบันทึก ไม่รอ Firebase ตีกลับ คนกดต้องเห็นผลเดี๋ยวนั้น */
function BlPaidSum({ info, onClose, flush }) {
  if (!info) return null;
  const S = info.S;
  return (
    <div style={{ margin: flush ? "0 0 12px" : "0 12px 10px", padding: "10px 12px", borderRadius: 10,
      background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)", color: "var(--tint-ok-tx)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800 }}>
          ✔ บันทึกรับเงินงวดที่ {info.n} แล้ว {blMoney(info.amt)} บาท{info.job ? " · " + info.job : ""}
        </span>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit",
          fontSize: 13, fontFamily: "inherit", padding: 0 }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6, fontSize: 12 }}>
        <span>รับเงินแล้วรวม <b style={{ fontFamily: "var(--mono)" }}>{blMoney(S.collected)}</b> บาท ({S.doneCount}/{S.count} งวด)</span>
        {S.allPaid
          ? <b>เก็บเงินครบทุกงวดแล้ว</b>
          : <span>คงค้างอีก <b style={{ fontFamily: "var(--mono)" }}>{blMoney(S.remain)}</b> บาท จากทั้งสัญญา {blMoney(S.grand || S.total)} บาท</span>}
      </div>
    </div>
  );
}

/* แถบเงินสามช่อง — ตัวเลขที่บัญชีมองหาก่อนเสมอ อ่านได้โดยไม่ต้องกดอะไร */
function BlMoneyStrip({ S }) {
  const cells = [
    ["ยอดรวมสัญญา", S.grand || S.total, "var(--text-1)"],
    ["รับเงินแล้ว", S.collected, "#10B981"],
    ["คงค้าง", S.remain, S.remain > 0.01 ? "#F59E0B" : "var(--text-3)"],
  ];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {cells.map(([label, v, color]) => (
        <div key={label} style={{ flex: 1, minWidth: 0, padding: "7px 9px", borderRadius: 9,
          background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: color, fontFamily: "var(--mono)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{blMoney(v)}</div>
        </div>
      ))}
    </div>
  );
}
/* ── กล่องบันทึกรับเงิน ──
   เลขอ้างอิงพิมพ์ผิดหรือพิมพ์มั่วก็ได้ ภาพสลิปคือของที่คนตรวจสอบขอดูจริง
   ไฟล์ถูกอุ้มไว้ในหน่วยความจำจนกว่าจะกดบันทึก — กดยกเลิกแล้วต้องไม่มีอะไรค้างในฐาน
   (มาตรฐานเดียวกับสลิปรอบจ่ายคืนของใบเบิก ทั้งขนาด ปุ่ม และเพดานไฟล์) */
function BlPayModal({ row, onCancel, onOk }) {
  const r = row || {};
  const [ref, setRef] = React.useState(r.payRef || "");
  const [slips, setSlips] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(0);

  const pick = async (e, pdf) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    for (const f of files) {
      setBusy((n) => n + 1);
      try {
        if (pdf) {
          if (!(f.type === "application/pdf" || /\.pdf$/i.test(f.name))) { setErr("รองรับเฉพาะไฟล์ PDF"); }
          else if (f.size > window.EC_PDF_MAX_MB * 1024 * 1024) {
            setErr("ไฟล์ใหญ่เกิน " + window.EC_PDF_MAX_MB + " MB (" + window.ecFileSize(f.size) + ") — ถ่ายเป็นรูปแทนได้");
          } else {
            const url = await window.readFileAsDataURL(f);
            setSlips((a) => a.concat([{ dataUrl: url, fileKind: "pdf", name: f.name, size: f.size }]));
          }
        } else {
          /* ย่อ 1400px เท่ากับรูปประกอบเอกสาร — สลิปต้องอ่านเลขที่บัญชีกับยอดออกเวลาซูมดู */
          const url = await window.resizeImageFile(f, 1400, 0.78);
          setSlips((a) => a.concat([{ dataUrl: url, fileKind: "img", name: f.name, size: f.size }]));
        }
      } catch (x) { setErr("อ่านไฟล์ไม่สำเร็จ: " + f.name); }
      setBusy((n) => n - 1);
    }
  };

  const drop = (i) => setSlips((a) => a.filter((x, k) => k !== i));
  const dash = { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
    border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,20,14,.5)", overflow: "auto", padding: "18px 12px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", background: "var(--surface)", borderRadius: 16,
        boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "18px 20px 0" }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: "grid", placeItems: "center",
            background: "#10B9811a" }}>
            <Icon name="wallet" size={18} color="#10B981" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.45 }}>
              รับเงินงวดที่ {r.n} · {blMoney(r.amount)} บาท
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 5, lineHeight: 1.6 }}>
              บันทึกว่าลูกค้าโอนเงินงวดนี้ครบแล้ว
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>เลขอ้างอิงการโอน / เลขสลิป</div>
          <input value={ref} maxLength={120} onChange={(e) => setRef(e.target.value)} placeholder="ไม่มีก็เว้นว่างได้"
            style={BL_INPUT()} />

          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", margin: "14px 0 5px" }}>
            สลิปโอนเงิน / ไฟล์แนบ <span style={{ fontWeight: 400 }}>· ไม่บังคับ · แนบได้หลายใบ เปิดดูย้อนหลังได้ในรายละเอียดงวด</span>
          </div>
          {slips.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: 9, marginBottom: 8,
              border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface2)" }}>
              {s.fileKind === "pdf" ? (
                <span style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 9, display: "grid", placeItems: "center", background: "#EF44441a" }}>
                  <Icon name="file" size={19} color="#EF4444" />
                </span>
              ) : (
                <img src={s.dataUrl} alt="" style={{ width: 48, height: 48, flexShrink: 0, objectFit: "cover",
                  borderRadius: 9, border: "1px solid var(--border)" }} />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name || "สลิปโอนเงิน"}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>
                  {s.fileKind === "pdf" ? "PDF" : "รูปภาพ"}{s.size ? " · " + window.ecFileSize(s.size) : ""} · จะบันทึกพร้อมการรับเงิน
                </span>
              </span>
              <button onClick={() => drop(i)} title="เอาออก"
                style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 8, display: "grid", placeItems: "center",
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                <Icon name="x" size={14} color="var(--text-2)" />
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={dash}>
              <Icon name="camera" size={15} color="var(--text-2)" /> {busy ? "กำลังอ่านไฟล์…" : "ถ่าย/เลือกรูปสลิป"}
              <input type="file" accept="image/*" multiple onChange={(e) => pick(e, false)} style={{ display: "none" }} />
            </label>
            <label style={dash}>
              <Icon name="file" size={15} color="var(--text-2)" /> แนบไฟล์ PDF
              <input type="file" accept="application/pdf,.pdf" multiple onChange={(e) => pick(e, true)} style={{ display: "none" }} />
            </label>
          </div>
          {err && <div style={{ fontSize: 11.5, color: "var(--tint-red-tx)", marginTop: 8 }}>{err}</div>}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "18px 20px 20px" }}>
          <button onClick={onCancel} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ยกเลิก
          </button>
          <button onClick={() => { if (!busy) onOk(ref, slips); }} disabled={!!busy}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: busy ? "var(--surface3)" : "#10B981",
              color: busy ? "var(--text-3)" : "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
            บันทึกรับเงิน
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   การ์ดในใบงาน
   ══════════════════════════════════════════════════ */
function BlJobCard({ job, quotes, leads, role, currentUser, readOnly, onOpen, onSaveBills }) {
  const j = job || {};
  const [print, setPrint] = React.useState(null);
  const [paid, setPaid] = React.useState(null);
  const [pay, setPay] = React.useState(null);   /* งวดที่กำลังกรอกข้อมูลการรับเงิน */
  const S = window.blSummary(j);
  const bills = j.bills || null;
  const quote = window.blPickQuote(quotes, j, leads);
  const drift = window.blDrift(j, quote);
  const cur = S.cur;
  const rows = window.blRows(j);
  const ro = readOnly || !onSaveBills;

  const move = (row, to) => {
    if (!onSaveBills) return;
    const go = (opt) => {
      const next = window.blMove(row, to, currentUser, opt || {}, j);
      const nb = Object.assign({}, bills, { rows: rows.map((r) => (r.id === row.id ? next : r)) });
      onSaveBills(nb);
      /* สรุปยอดทันทีที่กดรับเงิน คิดจากก้อนใหม่ ไม่รอฐานข้อมูลตีกลับ */
      setPaid(to === "paid" ? { n: next.n, amt: window.blR2(next.paidAmt), S: window.blSummary({ bills: nb }) } : null);
    };
    if (to !== "paid") return go();
    /* กรอกเลขอ้างอิงและแนบสลิปให้เสร็จก่อน แล้วค่อยเดินสถานะ — ไฟล์ถูกเขียนหลังกดยืนยันเท่านั้น
       prompt() ของเบราว์เซอร์ใช้ไม่ได้อยู่แล้ว (ถูกบล็อกใน WebView หลายตัว รวมถึงของ LINE) */
    setPay({ row: row, go: go, job: job });
  };

  const st = cur ? window.blStatusOf(cur.status) : null;
  const sub = !S.has
    ? (j.noBill ? "ไม่ต้องตั้งงวดงาน — แอดมินเอาออกจากรายการไว้"
      : quote ? "ยังไม่ได้ตั้งงวด · ดึงจาก " + (quote.no || "ใบเสนอราคา") : "ยังไม่ได้ตั้งงวด · งานนี้ไม่มีใบเสนอราคา ต้องกรอกเอง")
    : "งวด " + (S.doneCount + (cur && cur.status === "paid" ? 0 : 1)) + "/" + S.count
      + " · รับแล้ว " + blMoney(S.collected) + " · คงค้าง " + blMoney(S.remain) + " บาท";

  return (
    <div style={{ marginBottom: 22, border: "1px solid " + (S.overdue.length ? "var(--tint-amber-bd)" : "var(--border-strong)"),
      borderLeft: "3px solid " + (st ? st.color : (!S.has && quote ? "var(--primary)" : "var(--border-strong)")),
      borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>

      <button onClick={onOpen} disabled={!onOpen}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          background: "none", border: "none", cursor: onOpen ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: BL_ACCENT + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="file" size={17} color={BL_ACCENT} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>เอกสารงวดงาน · วางบิล</span>
          <span style={{ display: "block", fontSize: 11.5, color: st ? st.color : (!S.has && quote ? "var(--primary-dark)" : "var(--text-3)"),
            fontWeight: S.has ? 700 : 400 }}>{sub}</span>
        </span>
        {onOpen && <Icon name="arrowRight" size={16} color="var(--text-3)" />}
      </button>

      {S.has && (
        <div style={{ padding: "0 14px 12px", display: "grid", gap: 10 }}>
          <BlRail rows={rows} curId={cur ? cur.id : null} />
          <BlMoneyStrip S={S} />
        </div>
      )}

      {/* งวดที่กำลังเดินอยู่ — บรรทัดเดียวที่บัญชีต้องอ่าน แล้วต่อด้วยปุ่มที่กดได้จริง */}
      {S.has && cur && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 14px", background: "var(--surface2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: ro ? 0 : 9 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>งวดที่ {cur.n}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-2)", fontFamily: "var(--mono)" }}>{blMoney(cur.amount)} บาท</span>
            <BlPill row={cur} />
            {cur.docNo ? <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{cur.docNo}</span> : null}
          </div>
          {!ro && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <BlMoveBtns row={cur} bills={bills} role={role} currentUser={currentUser} job={j} onMove={move} size="sm" />
              {window.blPrintable(cur) && (
                <button onClick={() => setPrint(cur)}
                  style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  พิมพ์เอกสาร
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <BlPaidSum info={paid} onClose={() => setPaid(null)} />

      {!!S.overdue.length && (
        <BlNote>⏰ เลยกำหนดวางบิล {S.overdue.map((r) => "งวด " + r.n + " (" + blDay(r.due) + ")").join(" · ")} — ยังไม่ได้ออกเอกสาร</BlNote>
      )}
      {S.mismatch && (
        <BlNote>ผลรวมรายงวด {blMoney(S.total)} ไม่เท่ากับยอดตามใบเสนอราคา {blMoney(S.grand)} บาท — ตรวจตัวเลขอีกครั้ง</BlNote>
      )}
      {drift && (
        <BlNote>ใบเสนอราคา {quote && quote.no ? quote.no : ""} ถูกแก้หลังตั้งงวด — เปิดแผงตั้งงวดแล้วกด “ถอดงวดใหม่จากใบล่าสุด”</BlNote>
      )}
      {S.allPaid && <BlNote tone="ok">✔ เก็บเงินครบทุกงวดแล้ว รวม {blMoney(S.collected)} บาท</BlNote>}

      {print && <BlPrintHost job={j} row={print} onClose={() => setPrint(null)} />}
      {pay && (
        <BlPayModal row={pay.row} onCancel={() => setPay(null)}
          onOk={(ref, slips) => {
            slips.forEach((s) => window.blAddSlip(pay.job.id, pay.row.id, s, currentUser));
            pay.go({ ref: ref, slipN: slips.length });
            setPay(null);
          }} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   เลือกรูปประกอบ — รูปที่มีอยู่แล้วในงาน + อัปโหลดเพิ่ม
   คัดลอก dataUrl มาเก็บที่งวดเสมอ ไม่อ้างอิงรูปต้นทาง (ดูหมายเหตุใน billing.jsx)
   ══════════════════════════════════════════════════ */
function BlPhotoPick({ job, row, api, items, itemId, currentUser, onClose }) {
  const j = job || {};
  const [tab, setTab] = React.useState("daily");
  const [busy, setBusy] = React.useState(0);
  const [err, setErr] = React.useState("");
  const daily = window.useDailyReports ? window.useDailyReports(j.id) : { dates: [] };
  const dates = daily.dates || [];
  const [day, setDay] = React.useState("");
  React.useEffect(() => { if (!day && dates.length) setDay(dates[dates.length - 1]); }, [dates.length]);
  const dayPhotos = window.useDailyPhotos(j.id, tab === "daily" ? day : null);
  const media = window.useJobMedia(tab === "job" ? j.id : null);
  /* สลิปการรับเงินอยู่โหนดเดียวกัน แต่ไม่ใช่รูปประกอบเอกสาร — ห้ามโผล่ในแผงนี้และห้ามถูกพิมพ์ */
  const picked = window.blDocPhotos(api.photos);
  const its = items || [];
  const itemCap = (its.find((x) => x.id === itemId) || {}).text || "";
  const mine = itemId ? picked.filter((p) => p.item === itemId) : picked.filter((p) => !p.item || !its.some((x) => x.id === p.item));
  const has = (srcRef) => picked.some((p) => p.srcRef && p.srcRef === srcRef);

  /* รูปที่เลือกจากในนี้ถูกผูกกับข้อที่กดเข้ามาทันที — ย้ายทีหลังได้จากรายการด้านล่าง */
  const take = (p, src, srcRef) => {
    if (has(srcRef)) return;
    api.add(p.dataUrl, { cap: p.cap || "", user: currentUser, src: src, srcRef: srcRef, item: itemId || "" });
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    for (const f of files) {
      if (!/^image\//.test(f.type || "")) { setErr("เลือกได้เฉพาะไฟล์รูป"); continue; }
      setBusy((n) => n + 1);
      try {
        /* ย่อที่ 1400px คุณภาพ 0.78 — สูงกว่ารูปหน้างานเพราะรูปพวกนี้ถูกพิมพ์ที่ราว 76 มม. บน A4
           ลูกค้าต้องมองออกว่าติดตั้งอะไรไปแล้ว ไม่ใช่เห็นเป็นก้อนเบลอ */
        const url = await window.resizeImageFile(f, 1400, 0.78);
        api.add(url, { user: currentUser, src: "upload", srcRef: "", item: itemId || "" });
      } catch (x) { setErr("ย่อรูปไม่สำเร็จ ลองรูปอื่น"); }
      setBusy((n) => n - 1);
    }
  };

  const grid = (list, src, refOf) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))", gap: 8 }}>
      {list.map((p) => {
        const sr = refOf(p);
        const on = has(sr);
        return (
          <button key={p.id} onClick={() => take(p, src, sr)} disabled={on}
            style={{ padding: 0, border: "2px solid " + (on ? "var(--primary)" : "var(--border)"), borderRadius: 10,
              overflow: "hidden", background: "var(--surface2)", cursor: on ? "default" : "pointer", position: "relative" }}>
            <img src={p.dataUrl} alt="" style={{ display: "block", width: "100%", height: 78, objectFit: "cover", opacity: on ? 0.45 : 1 }} />
            {on && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800, color: "var(--primary-dark)" }}>เลือกแล้ว</span>}
          </button>
        );
      })}
      {!list.length && <div style={{ fontSize: 12, color: "var(--text-3)", padding: "10px 2px" }}>ไม่มีรูปในกลุ่มนี้</div>}
    </div>
  );

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      style={{ padding: "7px 12px", borderRadius: 9, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (tab === id ? BL_ACCENT : "var(--border-strong)"),
        background: tab === id ? BL_ACCENT + "18" : "var(--surface)", color: tab === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(8,20,14,.5)", overflow: "auto", padding: "18px 12px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>
              รูปประกอบงวดที่ {(row || {}).n}{itemCap ? " · " + itemCap : ""}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              {itemId ? "รูปที่เลือกจะเข้ารายการนี้ · " : ""}ทั้งงวดมี {picked.length} รูป · แผ่นละ 4 รูปเวลาพิมพ์
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        <div style={{ padding: 15 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {tabBtn("daily", "รูปรายงานประจำวัน")}
            {tabBtn("job", "รูปหน้างาน")}
            {tabBtn("up", "อัปโหลดใหม่")}
          </div>

          {tab === "daily" && (
            <div>
              <select value={day} onChange={(e) => setDay(e.target.value)}
                style={Object.assign({}, BL_INPUT(), { marginBottom: 10, maxWidth: 260 })}>
                {!dates.length && <option value="">ยังไม่มีรายงานประจำวัน</option>}
                {dates.slice().reverse().map((d) => <option key={d} value={d}>{blDay(d)}</option>)}
              </select>
              {grid(dayPhotos.photos || [], "daily", (p) => day + "/" + p.id)}
            </div>
          )}
          {tab === "job" && grid(media.photos || [], "job", (p) => "job/" + p.id)}
          {tab === "up" && (
            <div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 11,
                border: "1px dashed var(--border-strong)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                <Icon name="camera" size={16} color="var(--text-2)" />
                {busy ? "กำลังย่อรูป…" : "เลือกไฟล์รูป"}
                <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: "none" }} />
              </label>
              {err && <div style={{ fontSize: 11.5, color: "var(--tint-red-tx)", marginTop: 8 }}>{err}</div>}
            </div>
          )}

          {/* รูปที่เลือกไว้แล้ว — คำบรรยายของแต่ละรูปพิมพ์ใต้รูปบนกระดาษ */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)", marginBottom: 8 }}>
              {itemId ? "รูปของรายการนี้" : "รูปที่ยังไม่ผูกกับรายการ"} ({mine.length})
            </div>
            {mine.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <img src={p.dataUrl} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                <input value={p.cap || ""} onChange={(e) => api.setCap(p.id, e.target.value)} placeholder="คำบรรยายใต้รูป (ไม่ใส่ก็ได้)"
                  style={Object.assign({}, BL_INPUT(), { fontSize: 12.5, padding: "8px 10px" })} />
                {/* ย้ายรูปข้ามรายการโดยไม่ต้องลบแล้วเลือกใหม่ — รูปที่อัปโหลดเองมีอยู่ชุดเดียว เลือกใหม่ไม่ได้ */}
                <select value={p.item || ""} onChange={(e) => api.setItem(p.id, e.target.value)}
                  style={Object.assign({}, BL_INPUT(), { width: 168, flexShrink: 0, fontSize: 12, padding: "8px 10px" })}>
                  <option value="">— ไม่ผูกกับรายการ —</option>
                  {its.map((x, i) => <option key={x.id} value={x.id}>{(i + 1) + ". " + (x.text || "(ยังไม่ตั้งชื่อ)")}</option>)}
                </select>
                <button onClick={() => api.remove(p.id)} style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 9,
                  border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", cursor: "pointer" }}>
                  <Icon name="trash" size={14} color="var(--tint-red-tx)" />
                </button>
              </div>
            ))}
            {!mine.length && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้เลือกรูป</div>}
          </div>
        </div>

        <div style={{ padding: "12px 15px", borderTop: "1px solid var(--border)", textAlign: "right" }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--primary)",
            color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>เสร็จแล้ว</button>
        </div>
      </div>
    </div>
  );
}

/* รายละเอียดของงวดหนึ่ง — รายการส่งมอบ (ชื่อ · จำนวน · หน่วย · วันที่ · รูปของข้อนั้น)
   รายการชุดนี้ถูกพิมพ์สองที่: เป็นข้อ 1, 2, 3 บนใบแจ้งส่งมอบ และเป็นหัวข้อที่แยกรูปบนหน้ารูป */
function BlRowDetail({ job, row, onPatch, currentUser, readOnly }) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  const [pick, setPick] = React.useState(null);      /* id ของข้อที่กำลังเลือกรูปให้ */
  const items = window.blItems(row);
  const docs = window.blDocPhotos(api.photos);
  const slips = window.blSlipsOf(api.photos);
  const photosOf = (id) => docs.filter((p) => p.item === id);
  /* รูปที่เลือกไว้ตั้งแต่ก่อนมีระบบแยกข้อ — ยังพิมพ์ได้ แต่ต้องมีที่ให้ย้ายเข้าข้อ */
  const loose = docs.filter((p) => !p.item || !items.some((it) => it.id === p.item));

  const putItem = (id, fields) => onPatch({ items: items.map((it) => (it.id === id ? Object.assign({}, it, fields) : it)) });
  const addItem = () => onPatch({ items: items.concat([window.blBlankItem()]) });
  const delItem = (it) => {
    const ps = photosOf(it.id);
    const drop = () => { ps.forEach((p) => api.remove(p.id)); onPatch({ items: items.filter((x) => x.id !== it.id) }); };
    if (!ps.length) return drop();
    /* ลบข้อแล้วรูปของข้อนั้นไม่มีที่อยู่ ถามก่อนเสมอ — รูปเป็นของที่ช่างขึ้นไปถ่ายมาจริง */
    window.askConfirm({ title: "ลบรายการนี้?", body: "รูป " + ps.length + " รูปที่ผูกไว้กับรายการนี้จะถูกลบไปด้วย",
      ok: "ลบรายการ", danger: true, icon: "trash" }).then((ok) => { if (ok) drop(); });
  };

  /* จำนวนรูปสะท้อนกลับไปที่ตัวงวด ให้หน้ารวมบอกได้ว่างวดไหนยังไม่มีรูปโดยไม่ต้องโหลดรูป */
  React.useEffect(() => {
    const ids = api.photos.map((p) => p.id);
    if (readOnly) return;
    if (ids.join(",") !== (row.photoIds || []).join(",")) onPatch({ photoIds: ids });
  }, [api.photos.length]);

  const lbl = { fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 };
  const thumbs = (ps, itId) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {ps.slice(0, 10).map((p) => (
        <img key={p.id} src={p.dataUrl} alt="" title={p.cap || ""}
          style={{ width: 46, height: 36, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
      ))}
      {ps.length > 10 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>+{ps.length - 10}</span>}
      {!readOnly && (
        <button onClick={() => setPick(itId)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px dashed var(--border-strong)", background: "var(--surface)",
            color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
          <Icon name="camera" size={13} color="var(--text-2)" /> {ps.length ? "แก้รูป" : "เลือกรูป"}
        </button>
      )}
      {!ps.length && readOnly && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่มีรูป</span>}
    </div>
  );

  return (
    <div style={{ padding: "12px 14px", background: "var(--surface2)", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <div>
          <div style={lbl}>เรื่อง (ว่างไว้ = ใช้ข้อความมาตรฐาน)</div>
          <input value={row.subject || ""} disabled={readOnly} onChange={(e) => onPatch({ subject: e.target.value })}
            placeholder={window.blSubjectOf(Object.assign({}, row, { subject: "" }))} style={BL_INPUT()} />
        </div>

        <div>
          <div style={lbl}>
            รายการที่ส่งมอบในงวดนี้ — พิมพ์เป็นข้อ 1, 2, 3 บนใบ และแยกรูปเป็นหน้า ๆ ตามรายการ
          </div>
          <datalist id="bl-units">{window.BL_UNITS.map((u) => <option key={u} value={u} />)}</datalist>

          {items.map((it, i) => {
            const ps = photosOf(it.id);
            return (
              <div key={it.id} style={{ display: "flex", gap: 8, marginBottom: 8, padding: "10px 11px", borderRadius: 11,
                background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span style={{ width: 18, flexShrink: 0, textAlign: "right", fontSize: 12.5, fontWeight: 800,
                  color: "var(--text-3)", paddingTop: 11 }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 7 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <input value={it.text || ""} disabled={readOnly} onChange={(e) => putItem(it.id, { text: e.target.value })}
                      placeholder="เช่น ติดตั้งแผงโซลาร์เซลล์ 550W แล้วเสร็จ"
                      style={Object.assign({}, BL_INPUT(), { flex: 3, minWidth: 190, width: "auto" })} />
                    <input type="number" value={it.qty == null ? "" : it.qty} disabled={readOnly}
                      onChange={(e) => putItem(it.id, { qty: e.target.value === "" ? null : +e.target.value })}
                      placeholder="จำนวน" style={Object.assign({}, BL_INPUT(), { width: 92, flexShrink: 0, fontFamily: "var(--mono)" })} />
                    <input list="bl-units" value={it.unit || ""} disabled={readOnly}
                      onChange={(e) => putItem(it.id, { unit: e.target.value })}
                      placeholder="หน่วย" style={Object.assign({}, BL_INPUT(), { width: 96, flexShrink: 0 })} />
                    <input type="date" value={it.date || ""} disabled={readOnly} title="วันที่ทำงานข้อนี้ — พิมพ์บนหน้ารูป"
                      onChange={(e) => putItem(it.id, { date: e.target.value })}
                      style={Object.assign({}, BL_INPUT(), { width: 152, flexShrink: 0 })} />
                  </div>
                  {thumbs(ps, it.id)}
                  {/* พรีวิวบรรทัดที่จะพิมพ์จริง — จำนวนกับหน่วยถูกต่อท้ายชื่อให้เอง ไม่ต้องพิมพ์ซ้ำในช่องชื่อ */}
                  {window.blItemText(it) ? (
                    <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                      บนเอกสาร: <b style={{ color: "var(--text-2)" }}>{window.blItemText(it)}</b>
                      {ps.length ? " · หน้ารูป " + Math.ceil(ps.length / 4) + " แผ่น (" + ps.length + " รูป)" : ""}
                    </div>
                  ) : null}
                </div>
                {!readOnly && (
                  <button onClick={() => delItem(it)} title="ลบรายการนี้"
                    style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 9, border: "1px solid var(--border-strong)",
                      background: "var(--surface)", color: "var(--text-3)", cursor: "pointer" }}>
                    <Icon name="trash" size={14} color="var(--text-3)" />
                  </button>
                )}
              </div>
            );
          })}

          {!readOnly && (
            <button onClick={addItem} style={{ padding: "7px 12px", borderRadius: 9, border: "1px dashed var(--border-strong)",
              background: "none", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              + เพิ่มรายการ
            </button>
          )}
        </div>

        {/* รูปที่ยังไม่ได้ผูกกับข้อไหน — พิมพ์ได้อยู่ แต่ไปกองท้ายสุดโดยไม่มีหัวข้อ */}
        {!!loose.length && (
          <div style={{ padding: "9px 11px", borderRadius: 10, background: "var(--tint-amber-bg)",
            border: "1px solid var(--tint-amber-bd)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--tint-amber-tx)", marginBottom: 6 }}>
              รูปที่ยังไม่ได้ผูกกับรายการ ({loose.length}) — จะพิมพ์ไว้แผ่นท้ายสุดแบบไม่มีหัวข้อ
            </div>
            {thumbs(loose, "")}
          </div>
        )}

        {!!slips.length && (
          <div style={{ padding: "9px 11px", borderRadius: 10, background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--tint-ok-tx)", marginBottom: 7 }}>
              สลิป / หลักฐานการรับเงิน ({slips.length}) — ไม่ถูกพิมพ์บนเอกสารที่ส่งลูกค้า
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {slips.map((p) => (
                <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 9,
                  background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <a href={p.dataUrl} target="_blank" rel="noreferrer" download={p.name || undefined}
                    title={(p.name || "สลิป") + " — กดเพื่อเปิด/บันทึก"}
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", color: "var(--text-2)" }}>
                    {p.fileKind === "pdf"
                      ? <span style={{ width: 34, height: 34, borderRadius: 7, display: "grid", placeItems: "center", background: "#EF44441a" }}>
                          <Icon name="file" size={15} color="#EF4444" />
                        </span>
                      : <img src={p.dataUrl} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 7, border: "1px solid var(--border)" }} />}
                    <span style={{ fontSize: 11.5, fontWeight: 700, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name || "สลิปโอนเงิน"}
                    </span>
                  </a>
                  {!readOnly && (
                    <button onClick={() => api.remove(p.id)} title="ลบสลิปใบนี้"
                      style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, lineHeight: 1 }}>
                      <Icon name="x" size={13} color="var(--text-3)" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={lbl}>บันทึกภายใน (ไม่พิมพ์บนเอกสาร)</div>
          <input value={row.note || ""} disabled={readOnly} onChange={(e) => onPatch({ note: e.target.value })} style={BL_INPUT()} />
        </div>

        {/* ประวัติการเดินสถานะ — ใครกดอะไรเมื่อไร ตรวจย้อนได้ */}
        {!!(row.hist || []).length && (
          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
            {row.hist.slice().reverse().map((h, i) => (
              <div key={i}>
                {window.thDateTime ? window.thDateTime(h.at) : h.at} · {window.blStatusOf(h.to).th}
                {h.byName ? " · " + h.byName : ""}{h.note ? " · " + h.note : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {pick !== null && <BlPhotoPick job={job} row={row} api={api} items={items} itemId={pick}
        currentUser={currentUser} onClose={() => setPick(null)} />}
    </div>
  );
}


/* ══════════════════════════════════════════════════
   แผงตั้งงวดงาน — แก้ตัวเลขและเนื้อหาของงวด (การเดินสถานะอยู่ที่การ์ด/หน้ารวม)
   ══════════════════════════════════════════════════ */
function BlSetupModal({ job, quotes, leads, role, currentUser, readOnly, focusRowId, onClose, onSaveBills }) {
  /* พิมพ์จากในแผงได้เลย ไม่ต้องปิดแล้วไปหาปุ่มที่การ์ดหรือหน้ารวม — คนตั้งงวดคือคนที่ต้องเห็นใบก่อนใคร
     พิมพ์จากร่างที่ยังไม่บันทึกได้ด้วย ตรวจคำบนใบแล้วค่อยกดบันทึก */
  const [printRow, setPrintRow] = React.useState(null);
  const j = job || {};
  const ro = readOnly || !onSaveBills;
  const list = window.quotesOfJob(quotes, j, leads);
  const pick = window.blPickQuote(quotes, j, leads);

  const [bills, setBills] = React.useState(() => j.bills || window.blSeed(null, j, currentUser));
  const [qid, setQid] = React.useState(() => (j.bills && j.bills.quoteId) || (pick ? pick.id : ""));
  const [open, setOpen] = React.useState(focusRowId || null);
  const [msg, setMsg] = React.useState("");
  const [dirty, setDirty] = React.useState(false);

  const quote = list.find((q) => q.id === qid) || null;
  const rows = bills.rows || [];
  const sum = window.blR2(rows.filter(window.blLive).reduce((a, r) => a + (+r.amount || 0), 0));
  const drift = quote && bills.sig && bills.sig !== window.blSig(quote);

  const put = (fields) => { setBills((b) => Object.assign({}, b, fields)); setDirty(true); };
  const putRow = (id, fields) => {
    setBills((b) => Object.assign({}, b, { rows: (b.rows || []).map((r) => (r.id === id ? Object.assign({}, r, fields) : r)) }));
    setDirty(true);
  };

  /* % กับจำนวนเงินต้องเดินตามกันเสมอ ไม่งั้นใบที่พิมพ์ออกไปจะขัดกับเงื่อนไขที่เขียนอยู่บรรทัดเดียวกัน */
  const setPct = (row, v) => {
    const pct = v === "" ? null : +v;
    const amt = pct != null && bills.grand ? window.blR2(bills.grand * pct / 100) : row.amount;
    putRow(row.id, { pct: pct, amount: amt });
  };

  const seed = () => {
    if (!quote) { setMsg("เลือกใบเสนอราคาก่อน"); return; }
    const next = window.blReseed(bills, quote, j, currentUser);
    setBills(next); setDirty(true);
    setMsg(next.locked
      ? "ถอดงวดใหม่แล้ว — ข้ามงวดที่ออกเอกสารไปแล้ว " + next.locked + " งวด (ตัวเลขบนใบที่ส่งไปต้องไม่เปลี่ยน)"
      : "ถอดได้ " + (next.rows || []).length + " งวดจากเงื่อนไขการชำระเงิน"
        + (next.pctTotal !== 100 ? " · เงื่อนไขในใบรวมได้ " + next.pctTotal + "% ไม่ครบ 100%" : ""));
  };

  const addRow = () => {
    const n = rows.length ? Math.max.apply(null, rows.map((r) => +r.n || 0)) + 1 : 1;
    setBills((b) => Object.assign({}, b, {
      rows: (b.rows || []).concat([window.blBlankRow({ n: n, line: "งวดที่ " + n + " · " })]),
    }));
    setDirty(true);
  };
  /* งานเก่าที่เพิ่งถูกใส่เข้าฐานข้อมูลย้อนหลัง บางทีตั้งงวดไปแล้วถึงรู้ว่าไม่ต้องเก็บเงินผ่านระบบ
     เปิดให้เฉพาะแอดมิน เพราะนี่คือการลบเลขที่เอกสารกับประวัติการรับเงินทิ้งทั้งชุด */
  const dropAll = () => {
    if (!onSaveBills) return;
    window.askConfirm({
      title: "เอางวดงานของ " + (j.code || "งานนี้") + " ออกทั้งชุด?",
      body: "งวดทั้งหมด " + rows.length + " งวด พร้อมสถานะ เลขที่เอกสาร และประวัติการรับเงิน จะหายไปจากงานนี้"
        + " · งานจะกลับไปอยู่ในรายการ “ยังไม่ตั้งงวด” และตั้งใหม่ได้ตลอด",
      ok: "เอาออกทั้งชุด", danger: true, icon: "trash",
    }).then((ok) => { if (ok) { onSaveBills(null); onClose(); } });
  };

  const delRow = (row) => {
    if (window.blRowLocked(row)) return;
    setBills((b) => Object.assign({}, b, { rows: (b.rows || []).filter((r) => r.id !== row.id) }));
    setDirty(true);
  };

  const save = () => {
    if (!onSaveBills) return;
    onSaveBills(Object.assign({}, bills, {
      from: quote ? bills.from : "manual",
      quoteId: quote ? quote.id : "", quoteNo: quote ? quote.no || "" : "",
      grand: window.blR2(bills.grand), vatRate: +bills.vatRate || 0, kwp: +bills.kwp || 0,
    }));
    setDirty(false);
    setMsg("บันทึกแล้ว");
  };

  const modeBtn = (id, label) => (
    <button onClick={() => { put({ from: id }); if (id === "manual") setQid(""); else if (pick) setQid(pick.id); }} disabled={ro}
      style={{ padding: "8px 14px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: ro ? "default" : "pointer",
        border: "1px solid " + (bills.from === id ? BL_ACCENT : "var(--border-strong)"),
        background: bills.from === id ? BL_ACCENT + "18" : "var(--surface)", color: bills.from === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  const cell = { padding: "7px 8px", fontSize: 12.5, color: "var(--text-1)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };
  const head = { padding: "7px 8px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "left",
    borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 180, background: "rgba(8,20,14,.5)", overflow: "auto", padding: "18px 12px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: BL_ACCENT + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="file" size={17} color={BL_ACCENT} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>ตั้งงวดงาน · {j.code || ""}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {j.name || ""}{ro ? " · ดูได้อย่างเดียว" : ""}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
            <Icon name="x" size={15} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {/* ── แหล่งที่มาของงวด ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {modeBtn("quote", "จากใบเสนอราคา")}
            {modeBtn("manual", "กรอกเอง")}
          </div>

          {bills.from !== "manual" ? (
            <div style={{ marginBottom: 14 }}>
              {list.length ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: 2, minWidth: 240 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ใบเสนอราคาที่ใช้ถอดงวด</div>
                    <select value={qid} disabled={ro} onChange={(e) => setQid(e.target.value)} style={BL_INPUT()}>
                      {list.map((q) => {
                        const T = window.quoteTotals(q);
                        const s = (window.QUOTE_STATUS_BY || {})[q.status];
                        return (
                          <option key={q.id} value={q.id}>
                            {(q.no || q.id) + " · " + (window.thDate ? window.thDate(q.date, true) : "") + " · " + ((s && s.th) || q.status) + " · " + blMoney(T.grand)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {quote && quote.status === "accepted" && (
                    <span style={{ padding: "6px 11px", borderRadius: 99, background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)",
                      color: "var(--tint-ok-tx)", fontSize: 11.5, fontWeight: 700 }}>ลูกค้าตกลงแล้ว</span>
                  )}
                  {!ro && (
                    <button onClick={seed} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: BL_ACCENT,
                      color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      ดึงงวดจากเงื่อนไขการชำระเงิน
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: "11px 13px", borderRadius: 11, background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)",
                  color: "var(--tint-amber-tx)", fontSize: 12.5, lineHeight: 1.6 }}>
                  งานนี้ไม่มีใบเสนอราคาในระบบ — สลับไป “กรอกเอง” แล้วตั้งยอดกับเงื่อนไขของแต่ละงวดเอง
                </div>
              )}
              {quote && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
                  ยอดตามใบ {blMoney(window.quoteTotals(quote).grand)} บาท (รวม VAT {window.quoteTotals(quote).vatRate}%)
                  {(() => {
                    const sp = window.quoteTermSplit(quote.terms, window.quoteTotals(quote).grand);
                    return sp.pctTotal !== 100
                      ? <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}> · เงื่อนไขในใบรวมได้ {sp.pctTotal}% ไม่ครบ 100%</span>
                      : null;
                  })()}
                </div>
              )}
              {drift && (
                <div style={{ marginTop: 8, padding: "10px 13px", borderRadius: 11, background: "var(--tint-amber-bg)",
                  border: "1px solid var(--tint-amber-bd)", color: "var(--tint-amber-tx)", fontSize: 12.5, lineHeight: 1.6 }}>
                  ใบเสนอราคาถูกแก้หลังตั้งงวด — กด “ดึงงวดจากเงื่อนไขการชำระเงิน” เพื่อถอดใหม่
                  (งวดที่ออกเอกสารไปแล้วจะไม่ถูกเขียนทับ)
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ยอดรวมทั้งสัญญา (รวม VAT)</div>
                <input type="number" value={bills.grand || ""} disabled={ro} onChange={(e) => put({ grand: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ width: 96 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>VAT %</div>
                <input type="number" value={bills.vatRate} disabled={ro} onChange={(e) => put({ vatRate: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ width: 110 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>ขนาด kWp</div>
                <input type="number" value={bills.kwp || ""} disabled={ro} onChange={(e) => put({ kwp: +e.target.value || 0 })} style={BL_INPUT()} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>อ้างถึงสัญญา / ใบสั่งซื้อเลขที่</div>
                <input value={bills.ref || ""} disabled={ro} onChange={(e) => put({ ref: e.target.value })} style={BL_INPUT()} />
              </div>
            </div>
          )}

          {msg && (
            <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 10, background: "var(--tint-ok-bg)",
              border: "1px solid var(--tint-ok-bd)", color: "var(--tint-ok-tx)", fontSize: 12.5 }}>{msg}</div>
          )}

          {/* ── ตารางงวด ── */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, head, { width: 52 })}>งวด</th>
                    <th style={head}>เงื่อนไข</th>
                    <th style={Object.assign({}, head, { width: 74 })}>%</th>
                    <th style={Object.assign({}, head, { width: 128 })}>จำนวนเงิน</th>
                    <th style={Object.assign({}, head, { width: 142 })}>กำหนดวางบิล</th>
                    <th style={Object.assign({}, head, { width: 150 })}>สถานะ</th>
                    <th style={Object.assign({}, head, { width: 86 })}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const lock = window.blRowLocked(r);
                    const dis = ro || lock;
                    return (
                      <React.Fragment key={r.id}>
                        <tr>
                          <td style={Object.assign({}, cell, { fontWeight: 800 })}>
                            <input type="number" value={r.n} disabled={dis} onChange={(e) => putRow(r.id, { n: +e.target.value || 1 })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <input value={r.line || ""} disabled={dis} onChange={(e) => putRow(r.id, { line: e.target.value })}
                              placeholder="งวดที่ 1 · มัดจำ 30% เมื่อตกลงทำสัญญา"
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 8px", fontSize: 12.5 })} />
                            {lock && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>ออกเอกสารแล้ว — แก้ตัวเลขไม่ได้</div>}
                          </td>
                          <td style={cell}>
                            <input type="number" value={r.pct == null ? "" : r.pct} disabled={dis} placeholder="—"
                              onChange={(e) => setPct(r, e.target.value)}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <input type="number" value={r.amount || 0} disabled={dis} onChange={(e) => putRow(r.id, { amount: +e.target.value || 0, pct: null })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
                          </td>
                          <td style={cell}>
                            <input type="date" value={r.due || ""} disabled={ro} onChange={(e) => putRow(r.id, { due: e.target.value })}
                              style={Object.assign({}, BL_INPUT(), { padding: "6px 7px", fontSize: 12.5 })} />
                          </td>
                          <td style={cell}>
                            <BlPill row={r} />
                            {r.docNo ? <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, fontFamily: "var(--mono)" }}>{r.docNo}</div> : null}
                          </td>
                          <td style={Object.assign({}, cell, { whiteSpace: "nowrap" })}>
                            <button onClick={() => setOpen(open === r.id ? null : r.id)}
                              style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
                                color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                              {open === r.id ? "ย่อ" : "แก้ใบ"}
                            </button>
                            {window.blPrintable(r) && (
                              <button onClick={() => setPrintRow(r)} title="พิมพ์ชุดเอกสารของงวดนี้"
                                style={{ marginLeft: 4, padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border-strong)",
                                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5,
                                  fontWeight: 700, cursor: "pointer" }}>
                                พิมพ์
                              </button>
                            )}
                            {!ro && !lock && (
                              <button onClick={() => delRow(r)} title="ลบงวดนี้"
                                style={{ marginLeft: 4, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-strong)",
                                  background: "var(--surface)", color: "var(--text-3)", cursor: "pointer" }}>
                                <Icon name="trash" size={13} color="var(--text-3)" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {open === r.id && (
                          <tr><td colSpan={7} style={{ padding: 0 }}>
                            <BlRowDetail job={j} row={r} currentUser={currentUser} readOnly={ro}
                              onPatch={(f) => putRow(r.id, f)} />
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {!rows.length && (
                    <tr><td colSpan={7} style={Object.assign({}, cell, { color: "var(--text-3)", textAlign: "center", padding: 22 })}>
                      ยังไม่มีงวด — {bills.from === "manual" ? "กด “เพิ่มงวด”" : "กด “ดึงงวดจากเงื่อนไขการชำระเงิน”"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px",
              borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
              {!ro && (
                <button onClick={addRow} style={{ padding: "7px 12px", borderRadius: 9, border: "1px dashed var(--border-strong)",
                  background: "none", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  + เพิ่มงวด
                </button>
              )}
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                ผลรวมรายงวด <b style={{ fontFamily: "var(--mono)", color: "var(--text-1)" }}>{blMoney(sum)}</b>
                {bills.grand ? <span> / ยอดตามใบ <b style={{ fontFamily: "var(--mono)" }}>{blMoney(bills.grand)}</b></span> : null}
                {bills.grand && Math.abs(sum - window.blR2(bills.grand)) > 0.01 ? (
                  <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}> · ต่างกัน {blMoney(window.blR2(bills.grand) - sum)} บาท</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          {!ro && window.hasRole(role, "admin") && window.blHas(j) && (
            <button onClick={dropAll} title="ลบงวดงานทั้งชุดออกจากงานนี้ (เฉพาะแอดมิน)"
              style={{ marginRight: "auto", padding: "10px 14px", borderRadius: 11, border: "1px solid var(--tint-red-bd)",
                background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              เอางวดงานออก
            </button>
          )}
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            ปิด
          </button>
          {printRow && <BlPrintHost job={Object.assign({}, j, { bills: bills })} row={printRow} onClose={() => setPrintRow(null)} />}
          {!ro && (
            <button onClick={save} disabled={!dirty}
              style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: dirty ? "var(--primary)" : "var(--surface3)",
                color: dirty ? "#fff" : "var(--text-3)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: dirty ? "pointer" : "default" }}>
              บันทึก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* เปิดกระดาษของงวดหนึ่ง — ตัวกลางที่ดึงรูปของงวดนั้นมาให้ BlDeliveryPaper */
function BlPrintHost({ job, row, onClose }) {
  const api = window.useBillPhotos(job ? job.id : null, row ? row.id : null);
  if (!job || !row) return null;
  return <window.BlDeliveryPaper job={job} bill={job.bills || {}} row={row} photos={api.photos} onClose={onClose} />;
}

/* ══════════════════════════════════════════════════
   หน้ารวมงวดงาน — มุมของบัญชี: วันนี้ต้องวางบิลใบไหน ค้างรับเท่าไร
   ══════════════════════════════════════════════════ */
function BillingView({ jobs, quotes, leads, role, currentUser, onOpenJob, onSaveBills, onSetup, onSkip }) {
  const today = window.drToday ? window.drToday() : "";
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [onlyNew, setOnlyNew] = React.useState(false);
  const [print, setPrint] = React.useState(null);
  const [paid, setPaid] = React.useState(null);
  const [pay, setPay] = React.useState(null);      /* งวดที่กำลังกรอกข้อมูลการรับเงิน */
  /* ย่อ/ขยายรายงาน — เก็บเฉพาะงานที่ผู้ใช้กดเอง ที่เหลือใช้ค่าปริยาย (งานที่เก็บเงินครบแล้วย่อไว้)
     หน้านี้ยาวขึ้นทุกเดือนตามจำนวนงาน ถ้าไม่ย่องานที่จบแล้ว งานที่ต้องลงมือจะถูกดันตกจอ */
  const [fold, setFold] = React.useState({});
  const ro = !onSaveBills;

  const withBills = (jobs || []).filter((j) => window.blHas(j));
  /* คิดสดทุกรอบ ไม่ memo — สรุปของงานหนึ่งงานคือการบวกไม่กี่สิบตัวเลข
     แต่ตัวเลขต้องตรงกับที่เพิ่งกดเปลี่ยนสถานะไปทันที ไม่งั้นบัญชีจะไม่เชื่อหน้าจอ */
  const sums = {};
  withBills.forEach((j) => { sums[j.id] = window.blSummary(j, today); });

  /* ไทล์สรุป — ตัวเลขทั้งบริษัท ไม่ใช่ของงานเดียว บัญชีเปิดหน้านี้มาเพื่ออ่านสี่ตัวนี้ก่อน */
  const tiles = (() => {
    let readyN = 0, readyB = 0, waitB = 0, monthPaid = 0, overdueN = 0;
    const ym = String(today).slice(0, 7);
    withBills.forEach((j) => {
      window.blRows(j).filter(window.blLive).forEach((r) => {
        if (r.status === "ready") { readyN++; readyB += +r.amount || 0; }
        if (window.blFlowIdx(r.status) >= window.blFlowIdx("billed") && r.status !== "paid") {
          waitB += (+r.amount || 0) - (+r.paidAmt || 0);
        }
        if (r.paidAt && String(r.paidAt).slice(0, 7) === ym) monthPaid += +r.paidAmt || 0;
        if (window.blOverdue(r, today)) overdueN++;
      });
    });
    return { readyN, readyB: window.blR2(readyB), waitB: window.blR2(waitB), monthPaid: window.blR2(monthPaid), overdueN };
  })();

  const kw = q.trim().toLowerCase();
  const rowHit = (j, r) => {
    if (filter === "overdue" && !window.blOverdue(r, today)) return false;
    if (filter !== "all" && filter !== "overdue" && r.status !== filter) return false;
    if (!kw) return true;
    return [j.code, j.name, r.docNo, r.line].filter(Boolean).join(" ").toLowerCase().indexOf(kw) >= 0;
  };

  const groups = withBills.map((j) => ({ job: j, rows: window.blRows(j).filter((r) => rowHit(j, r)), S: sums[j.id] }))
    .filter((g) => g.rows.length)
    .sort((a, b) => String(a.job.code || "").localeCompare(String(b.job.code || "")));

  /* งานที่ติดตั้งแล้วแต่ยังไม่ตั้งงวด — นี่คือรายการที่บัญชีต้องลงมือจริง และเป็นเหตุผลที่หน้านี้มีอยู่ */
  /* งานเก่าที่ติดตั้งจบไปก่อนมีระบบนี้ แล้วเพิ่งถูกใส่เข้าฐานข้อมูลย้อนหลัง จะไม่มีวันถูกตั้งงวด
     ปล่อยไว้รายการนี้จะยาวขึ้นเรื่อย ๆ จนไม่มีใครอ่าน — แอดมินเอาออกได้ และเอากลับได้เสมอ */
  const pendingSetup = (jobs || []).filter((j) => !window.blHas(j) && !j.noBill && (j.stage === "install" || j.stage === "done"))
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
  const skipped = (jobs || []).filter((j) => j.noBill && !window.blHas(j))
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));

  const skip = (j, off) => {
    if (!onSkip) return;
    if (!off) return onSkip(j.id, false);
    window.askConfirm({
      title: "เอา " + (j.code || "งานนี้") + " ออกจากรายการงวดงาน?",
      body: (j.name || "") + " จะไม่ขึ้นในรายการ “ยังไม่ตั้งงวด” อีก — ใช้กับงานเก่าที่ติดตั้งจบไปแล้วและไม่ได้เก็บเงินผ่านระบบนี้"
        + " · ข้อมูลงานไม่ถูกแตะต้อง และแอดมินกดเอากลับได้ตลอด",
      ok: "เอาออกจากรายการ", icon: "file",
    }).then((ok) => { if (ok) onSkip(j.id, true); });
  };

  const move = (job, row, to) => {
    if (!onSaveBills) return;
    const go = (opt) => {
      const next = window.blMove(row, to, currentUser, opt || {}, job);
      const nb = Object.assign({}, job.bills, {
        rows: window.blRows(job).map((r) => (r.id === row.id ? next : r)),
      });
      onSaveBills(job.id, nb);
      setPaid(to === "paid"
        ? { n: next.n, amt: window.blR2(next.paidAmt), job: (job.code || "") + " · " + (job.name || ""), S: window.blSummary({ bills: nb }) }
        : null);
    };
    if (to !== "paid") return go();
    /* กรอกเลขอ้างอิงและแนบสลิปให้เสร็จก่อน แล้วค่อยเดินสถานะ — ไฟล์ถูกเขียนหลังกดยืนยันเท่านั้น
       prompt() ของเบราว์เซอร์ใช้ไม่ได้อยู่แล้ว (ถูกบล็อกใน WebView หลายตัว รวมถึงของ LINE) */
    setPay({ row: row, go: go, job: job });
  };

  const chip = (id, label) => (
    <button key={id} onClick={() => setFilter(id)}
      style={{ padding: "6px 12px", borderRadius: 99, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
        border: "1px solid " + (filter === id ? BL_ACCENT : "var(--border-strong)"),
        background: filter === id ? BL_ACCENT + "18" : "var(--surface)", color: filter === id ? BL_ACCENT : "var(--text-2)" }}>{label}</button>
  );

  const head = { padding: "7px 9px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "left",
    borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
  const cell = { padding: "8px 9px", fontSize: 12.5, color: "var(--text-1)", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  return (
    <div>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
        <window.EcStat label="ถึงงวด · รอออกเอกสาร" value={tiles.readyN} unit="งวด" color="#F59E0B"
          hint={blMoney(tiles.readyB) + " บาท"} on={filter === "ready"} onClick={() => setFilter(filter === "ready" ? "all" : "ready")} />
        <window.EcStat label="ออกเอกสารแล้ว · รอรับเงิน" value={blMoney(tiles.waitB)} unit="บาท" color="#3B82F6"
          on={filter === "billed"} onClick={() => setFilter(filter === "billed" ? "all" : "billed")} />
        <window.EcStat label="รับเงินแล้วเดือนนี้" value={blMoney(tiles.monthPaid)} unit="บาท" color="#10B981" />
        <window.EcStat label="เลยกำหนดออกเอกสาร" value={tiles.overdueN} unit="งวด" color="#EF4444"
          on={filter === "overdue"} onClick={() => setFilter(filter === "overdue" ? "all" : "overdue")} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา รหัสงาน · ลูกค้า · เลขที่เอกสาร · เงื่อนไข"
          style={Object.assign({}, BL_INPUT(), { maxWidth: 320 })} />
        {chip("all", "ทั้งหมด")}
        {chip("ready", "ถึงงวด")}
        {chip("billed", "ออกเอกสารแล้ว")}
        {chip("accepted", "ส่งมอบเอกสารแล้ว")}
        {chip("paid", "รับเงินแล้ว")}
        {chip("overdue", "เลยกำหนด")}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          เฉพาะงานที่ยังไม่ตั้งงวด
        </label>
      </div>

      <BlPaidSum info={paid} onClose={() => setPaid(null)} flush />

      {!onlyNew && groups.map((g) => {
        const j = g.job, S = g.S;
        /* ค่าปริยาย = ย่องานที่เก็บเงินครบแล้ว · กดเมื่อไรความตั้งใจของคนกดชนะค่าปริยาย */
        const shut = fold[j.id] === undefined ? S.allPaid : fold[j.id];
        return (
          <div key={j.id} style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", marginBottom: 12, background: "var(--surface)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "11px 13px", background: "var(--surface2)",
              borderBottom: "1px solid var(--border)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
                  {j.code} · {j.name}{+j.kw ? <span style={{ fontWeight: 600, color: "var(--text-3)" }}> · {j.kw} kW</span> : null}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                  ยอดรวมสัญญา {blMoney(S.grand || S.total)} บาท · รับเงินแล้ว {blMoney(S.collected)} · คงค้าง {blMoney(S.remain)}
                </div>
              </div>
              <div style={{ width: 170, flexShrink: 0 }}><BlRail rows={window.blRows(j)} curId={S.cur ? S.cur.id : null} /></div>
              <button onClick={() => setFold((f) => Object.assign({}, f, { [j.id]: !shut }))}
                title={shut ? "กางตารางงวดของงานนี้" : "ย่อเหลือแค่บรรทัดสรุป"}
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                {shut ? "ขยาย · " + g.rows.length + " งวด" : "ย่อ"}
              </button>
              {onOpenJob && (
                <button onClick={() => onOpenJob(j.id)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  เปิดใบงาน
                </button>
              )}
              {onSetup && !ro && (
                <button onClick={() => onSetup(j)} style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: BL_ACCENT,
                  color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  ตั้งงวด / แก้ใบ
                </button>
              )}
            </div>

            {!shut && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={Object.assign({}, head, { width: 46 })}>งวด</th>
                    <th style={head}>เงื่อนไข</th>
                    <th style={Object.assign({}, head, { width: 110, textAlign: "right" })}>จำนวนเงิน</th>
                    <th style={Object.assign({}, head, { width: 96 })}>กำหนด</th>
                    <th style={Object.assign({}, head, { width: 126 })}>เลขที่เอกสาร</th>
                    <th style={Object.assign({}, head, { width: 96 })}>ออกเอกสาร</th>
                    <th style={Object.assign({}, head, { width: 122, textAlign: "right" })}>รับเงิน</th>
                    <th style={Object.assign({}, head, { width: 132 })}>สถานะ</th>
                    <th style={head}></th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <tr key={r.id} style={{ background: window.blOverdue(r, today) ? "var(--tint-amber-bg)" : "transparent" }}>
                      <td style={Object.assign({}, cell, { fontWeight: 800 })}>{r.n}</td>
                      <td style={cell}>{r.line || "—"}</td>
                      <td style={Object.assign({}, cell, { textAlign: "right", fontFamily: "var(--mono)" })}>{blMoney(r.amount)}</td>
                      <td style={cell}>{r.due ? blDay(r.due) : "—"}</td>
                      <td style={Object.assign({}, cell, { fontFamily: "var(--mono)", fontSize: 11.5 })}>{r.docNo || "—"}</td>
                      <td style={cell}>{r.billedAt ? blDay(r.billedAt) : "—"}</td>
                      <td style={Object.assign({}, cell, { textAlign: "right", fontFamily: "var(--mono)", fontSize: 11.5 })}>
                        {+r.paidAmt ? blMoney(r.paidAmt) + (window.blR2(r.paidAmt) < window.blR2(r.amount) ? " / " + blMoney(r.amount) : "") : "—"}
                        {+r.paySlip ? <span title={"มีสลิป/ไฟล์แนบ " + r.paySlip + " ไฟล์ — เปิดดูได้ในแผงตั้งงวด"} style={{ marginLeft: 5 }}>📎</span> : null}
                      </td>
                      <td style={cell}><BlPill row={r} /></td>
                      <td style={Object.assign({}, cell, { whiteSpace: "nowrap" })}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {!ro && <BlMoveBtns row={r} bills={j.bills} role={role} currentUser={currentUser} job={j} onMove={(row, to) => move(j, row, to)} size="sm" />}
                          {window.blPrintable(r) && (
                            <button onClick={() => setPrint({ job: j, row: r })}
                              style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                                color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                              พิมพ์
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        );
      })}

      {!onlyNew && !groups.length && (
        <div style={{ padding: 26, textAlign: "center", fontSize: 13, color: "var(--text-3)", border: "1px dashed var(--border-strong)", borderRadius: 13 }}>
          ไม่มีงวดงานที่ตรงกับตัวกรอง
        </div>
      )}

      {!!pendingSetup.length && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-2)", marginBottom: 8 }}>
            งานที่ติดตั้งแล้วแต่ยังไม่ตั้งงวด ({pendingSetup.length})
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {pendingSetup.map((j) => {
              const qt = window.blPickQuote(quotes, j, leads);
              return (
                <div key={j.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                  padding: "10px 13px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{j.code} · {j.name}</div>
                    <div style={{ fontSize: 11.5, color: qt ? "var(--primary-dark)" : "var(--text-3)" }}>
                      {qt ? "มีใบเสนอราคา " + (qt.no || "") + " · ดึงงวดได้เลย" : "ไม่มีใบเสนอราคา — ต้องกรอกงวดเอง"}
                    </div>
                  </div>
                  {onSetup && !ro && (
                    <button onClick={() => onSetup(j)} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: BL_ACCENT,
                      color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ตั้งงวด</button>
                  )}
                  {onSkip && (
                    <button onClick={() => skip(j, true)} title="งานนี้ไม่ต้องตั้งงวด — เอาออกจากรายการ (เฉพาะแอดมิน)"
                      style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
                        color: "var(--text-3)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      เอาออก
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {onSkip && !!skipped.length && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-3)", marginBottom: 8 }}>
            งานที่เอาออกจากรายการงวดงาน ({skipped.length})
          </div>
          <div style={{ border: "1px dashed var(--border-strong)", borderRadius: 13, overflow: "hidden" }}>
            {skipped.map((j) => (
              <div key={j.id} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                padding: "9px 13px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--text-3)" }}>{j.code} · {j.name}</div>
                <button onClick={() => skip(j, false)}
                  style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    color: "var(--text-2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  เอากลับเข้ารายการ
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {print && <BlPrintHost job={print.job} row={print.row} onClose={() => setPrint(null)} />}
      {pay && (
        <BlPayModal row={pay.row} onCancel={() => setPay(null)}
          onOk={(ref, slips) => {
            slips.forEach((s) => window.blAddSlip(pay.job.id, pay.row.id, s, currentUser));
            pay.go({ ref: ref, slipN: slips.length });
            setPay(null);
          }} />
      )}
    </div>
  );
}

Object.assign(window, {
  BL_ACCENT, BlPill, BlRail, BlNote, BlMoveBtns, BlPaidSum, BlMoneyStrip,
  BlJobCard, BlPayModal, BlPhotoPick, BlRowDetail, BlSetupModal, BlPrintHost, BillingView,
});
