/* ══════════════════════════════════════════════════
   สมุดตรวจรับและส่งมอบระบบ — เอกสารที่ออกจากระบบ (A4 พิมพ์/บันทึก PDF + ไฟล์ Excel)

   หนึ่งชุดมีสี่ส่วน พิมพ์ออกมาเป็นไฟล์เดียว
   ── แผ่นที่ 1  Summary — ข้อมูลโครงการและระบบ
   ── แผ่นที่ 2  Documents Checklist + ช่องลงนามสี่ช่องตามต้นฉบับ
   ── แผ่นที่ 3  รายการที่ยังขาด (ขึ้นเฉพาะตอนยังไม่ครบ)
   ── แผ่นรูป   หน้าละ 6 รูป

   หัวข้อเป็นอังกฤษ/ไทยคู่กันตามต้นฉบับ เพราะใบนี้ไปถึงทั้ง EPC ที่อ่านอังกฤษ
   และช่างกับลูกค้าที่อ่านไทย จึงไม่มีปุ่มเลือกภาษา

   ⚠ แผ่นทั้งหมดสร้างจาก PM_SECTIONS ด้วยการวน ไม่ใช่เขียน JSX มือทีละช่อง
     นี่คือสิ่งที่ทำให้แผ่นทดสอบของเฟสถัดไปพิมพ์ตัวเองได้โดยไม่ต้องแก้ไฟล์นี้

   ⚠ แผ่นที่ 3 ต้องมี — เล่มที่ยังไม่ครบแล้วพิมพ์ออกมาต้องบอกความจริงว่ายังขาดอะไร
     ไม่ใช่เอกสารที่หน้าตาเหมือนฉบับสมบูรณ์

   ลอกโครงหน้ากระดาษ ปุ่มพิมพ์ และช่องลงนามมาจาก inspect-paper.jsx (rp/Rp)
   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย pm / Pm / PM_
   ══════════════════════════════════════════════════ */

const PM_INK = "#15211A";
const PM_LINE = "#C9D5CE";
const PM_SOFT = "#5A6B62";
const PM_HEAD_BG = "#F2F8F4";

/* กระดาษต้องแขวนตัวเองไว้กับ body ตอนพิมพ์ ไม่งั้นโดนกฎซ่อนเมนูซ่อนไปด้วยแล้วได้ PDF หน้าขาว
   (เปิดจากในโมดัลซึ่งอยู่ใต้ .app-root จึงต้องหนีออกมาทั้ง portal และคลาสนี้) */
function usePmPrintBody() {
  React.useEffect(() => {
    document.body.classList.add("sv-rep-printing");
    return () => document.body.classList.remove("sv-rep-printing");
  }, []);
}

const pmpDate = (v) => (!v ? "" : window.drDateTH ? window.drDateTH(String(v).slice(0, 10)) : String(v).slice(0, 10));

const pmpTh = { textAlign: "left", padding: "5px 7px", fontSize: 10, fontWeight: 700, color: PM_SOFT,
  borderBottom: "1px solid " + PM_LINE, borderTop: "1px solid " + PM_LINE };
const pmpTd = { padding: "5px 7px", fontSize: 10.5, color: PM_INK, borderBottom: "1px solid #ECF1EE",
  verticalAlign: "top", wordBreak: "break-word" };

/* ค่าที่จะพิมพ์ลงช่อง — พิกัดแปลงเป็นองศา-ลิปดา-ฟิลิปดาตามแบบฟอร์มต้นฉบับ วันที่เป็น พ.ศ. */
function pmpValue(f, sum) {
  const raw = sum[f.key];
  if (raw === null || raw === undefined || String(raw) === "") return "";
  if (f.key === "gpsLat") return window.pmDms(raw, true);
  if (f.key === "gpsLng") return window.pmDms(raw, false);
  if (f.type === "date") return pmpDate(raw);
  return String(raw) + (f.unit ? " " + f.unit : "");
}

function PmHandoverPaper({ job, rec, sum, prog, photos, onClose }) {
  usePmPrintBody();
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const B = window.BRANDING || {};
  const j = job || {};
  const r = rec || {};
  const s = sum || {};
  const p = prog || { pct: 0, done: 0, total: 0, missing: [] };
  const list = photos || [];
  const sumSec = window.PM_SEC_BY.sum;
  const docSec = window.PM_SEC_BY.docs;
  const signSec = window.PM_SEC_BY.sign;

  const doPrint = () => {
    const old = document.title;
    document.title = "Handover " + (j.code || "") + " " + (s.projName || j.name || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  /* รูปที่ส่งให้ตัวออกไฟล์คือสารบัญ ตัว dataUrl ไม่ได้ถูกใช้ (ฝังรูปลง xlsx ไม่ได้ ดูหมายเหตุท้ายไฟล์) */
  const doXlsx = () => window.pmExportXlsx(j, r, s, p, list);

  /* หนึ่งหน้ารูป = 6 รูป (2 คอลัมน์ x 3 แถว) เท่ากับใบตรวจสอบงาน */
  const photoPages = [];
  for (let i = 0; i < list.length; i += 6) photoPages.push(list.slice(i, i + 6));

  const headBar = (title, thTitle) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap",
      borderBottom: "2px solid " + PM_INK, paddingBottom: 9, marginBottom: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          {window.BrandDoc ? <window.BrandDoc height={46} /> : null}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: PM_INK, letterSpacing: "-.2px" }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: PM_INK, marginTop: 1 }}>{thTitle}</div>
        <div style={{ fontSize: 10, color: PM_SOFT, marginTop: 2 }}>
          {[j.code, s.projName || j.name].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", fontSize: 9.5, color: PM_SOFT, lineHeight: 1.6 }}>
        {B.tel ? <div>โทร {B.tel}</div> : null}
        {B.email ? <div>{B.email}</div> : null}
        <div style={{ marginTop: 3 }}>Date of Inspection: <b style={{ color: PM_INK }}>{pmpDate(s.inspDate) || "—"}</b></div>
        <div>Completeness: <b style={{ color: PM_INK }}>{p.pct}%</b></div>
      </div>
    </div>
  );

  /* แถวของแผ่น Summary — หัวข้ออังกฤษบรรทัดบน ไทยบรรทัดล่าง ในคอลัมน์กว้างตายตัว
     เคยวางไทยต่อท้ายอังกฤษในบรรทัดเดียวเพื่อประหยัดความสูง แต่พอสองคอลัมน์บนหน้า A4
     คำไทยยาว ๆ ("พิกัดตัดกระแสลัดวงจร" · "ยี่ห้อสวิตช์ตัดตอนฝั่งแผง") ถูกบีบจนหักกลางคำ
     อ่านไม่รู้เรื่อง · ความสูงที่เพิ่มขึ้นจัดการได้ด้วยการแบ่งหน้าเองข้างล่าง แต่คำที่หักกลางคำแก้ไม่ได้ */
  const pmpRow = (f, val) => (
    <div key={f.key} style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 7 }}>
      <span style={{ flexShrink: 0, width: 150, lineHeight: 1.3 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: PM_INK }}>{f.en}</span>
        {f.th ? <span style={{ display: "block", fontSize: 9, color: PM_SOFT }}>{f.th}</span> : null}
      </span>
      <span style={{ fontSize: 11, color: PM_SOFT, flexShrink: 0 }}>:</span>
      <span style={{ flex: 1, minWidth: 0 }}><RpFill value={val} minWidth={80} /></span>
    </div>
  );

  const groupHead = (en, th) => (
    <div style={{ marginTop: 10, marginBottom: 6, paddingBottom: 3, borderBottom: "1px solid " + PM_LINE }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: PM_INK }}>{en}</span>
      <span style={{ fontSize: 10, color: PM_SOFT }}> ({th})</span>
    </div>
  );

/* แผ่น Summary ยาวเกินหน้าเดียวมาตั้งแต่ v1 (เนื้อหา ~330mm ต่อพื้นที่พิมพ์ 273mm)
     ปล่อยให้เบราว์เซอร์ตัดเองจะได้หน้าแรกที่ว่างครึ่งหน้าแล้วเศษไหลไปหน้าสอง
     จึงแบ่งเองที่ "ขอบกลุ่ม" ประมาณจากจำนวนแถว (สองคอลัมน์) + หัวกลุ่ม
     หนึ่งหน่วย = หนึ่งแถวสองบรรทัด (อังกฤษ/ไทย) · PM_SUM_UNITS ตั้งต่ำกว่าที่วัดได้จริง
     เผื่อหัวข้อที่ยาวจนตกบรรทัดที่สาม และเผื่อชุดแผง/อินเวอร์เตอร์ที่คนกรอกกดเพิ่มเข้ามา */
  const PM_SUM_UNITS = 18;
  const sumPages = (() => {
    const pages = [];
    let cur = [], used = 0;
    window.pmGroupsOf(sumSec, s).forEach((g) => {
      const u = Math.ceil((g.fields || []).length / 2) + 1;
      if (cur.length && used + u > PM_SUM_UNITS) { pages.push(cur); cur = []; used = 0; }
      cur.push(g); used += u;
    });
    if (cur.length) pages.push(cur);
    return pages;
  })();

    /* เลขรูปวิ่งชุดเดียวกับที่ไฟล์ Excel ใช้อ้างถึง — สองไฟล์จะได้ชี้หากันได้ */
  let photoNo = 0;

  const paper = (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 175, background: "rgba(8,20,14,.55)",
      overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>

      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center",
        padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto",
        boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)",
          background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
          <Icon name="x" size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>สมุดตรวจรับและส่งมอบระบบ</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {j.code || ""} · กรอกแล้ว {p.pct}% ({p.done}/{p.total})
          </div>
        </div>
        <button onClick={doXlsx} title="ไฟล์ Excel ไม่มีรูปถ่าย — รูปอยู่ในไฟล์ PDF"
          style={{ padding: "9px 13px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>
          ออกไฟล์ Excel
        </button>
        <button onClick={doPrint}
          style={{ padding: "9px 15px", borderRadius: 10, border: "1px solid var(--primary)", background: "var(--primary)",
            cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          บันทึก PDF
        </button>
      </div>

      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: PM_INK,
        padding: isMobile ? "18px 14px" : "26px 30px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 8px 30px rgba(0,0,0,.18)" }}>

        {/* ── แผ่น Summary — แบ่งเองเป็นหน้า ๆ ที่ขอบกลุ่ม ── */}
        {sumPages.map((groups, pi) => (
          <div className="pm-sheet" key={"sum" + pi}>
            {headBar("Commissioning & Handover Report" + (pi ? " (cont.)" : ""),
              "รายงานตรวจรับและส่งมอบระบบ" + (pi ? " (ต่อ)" : ""))}
            {groups.map((g) => (
              <div key={g.key}>
                {groupHead(g.en, g.th)}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: 22 }}>
                  {(g.fields || []).map((f) => pmpRow(f, pmpValue(f, s)))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* ── แผ่นที่ 2 · Documents Checklist + ลงนาม ── */}
        <div className="pm-sheet pm-page">
          {headBar("Handover Documents Checklist", "รายการเอกสารส่งมอบ")}
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={Object.assign({}, pmpTh, { width: 30, textAlign: "center" })}>#</th>
                <th style={pmpTh}>Document <span style={{ fontWeight: 400 }}>(เอกสาร)</span></th>
                <th style={Object.assign({}, pmpTh, { width: 48, textAlign: "center" })}>Yes</th>
                <th style={Object.assign({}, pmpTh, { width: 48, textAlign: "center" })}>No</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const out = [];
                let n = 0;
                (docSec.groups || []).forEach((g) => {
                  out.push(
                    <tr key={"g-" + g.key} style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                      <td colSpan={4} style={{ padding: "6px 7px", background: PM_HEAD_BG, fontSize: 10.5, fontWeight: 800, color: PM_INK,
                        borderBottom: "1px solid " + PM_LINE }}>
                        {g.en} <span style={{ fontWeight: 400, color: PM_SOFT }}>({g.th})</span>
                      </td>
                    </tr>
                  );
                  (g.items || []).forEach((it) => {
                    n += 1;
                    const v = (r.docs || {})[it.key];
                    out.push(
                      <tr key={it.key}>
                        <td style={Object.assign({}, pmpTd, { textAlign: "center", color: PM_SOFT, fontSize: 9.5 })}>{n}</td>
                        <td style={pmpTd}>
                          {window.pmDocLabel(it, job).en}<span style={{ color: PM_SOFT, fontSize: 9.5 }}> ({window.pmDocLabel(it, job).th})</span>
                        </td>
                        {/* ช่องว่างปล่อยว่างไว้จริง ๆ ให้ติ๊กด้วยปากกาได้ตอนพิมพ์เล่มที่ยังไม่เสร็จ */}
                        <td style={Object.assign({}, pmpTd, { textAlign: "center", fontSize: 13 })}>{v === "y" ? "√" : ""}</td>
                        <td style={Object.assign({}, pmpTd, { textAlign: "center", fontSize: 13 })}>{v === "n" ? "–" : ""}</td>
                      </tr>
                    );
                  });
                });
                return out;
              })()}
            </tbody>
          </table>
          <div style={{ marginTop: 8, fontSize: 10, color: PM_SOFT }}>
            ตอบแล้ว {(p.bySection && p.bySection.docs ? p.bySection.docs.done : 0)} จาก{" "}
            {(p.bySection && p.bySection.docs ? p.bySection.docs.total : 0)} รายการ
          </div>

          {/* ช่องลงนามสี่ช่องตามต้นฉบับ — พิมพ์ชื่อจากในระบบไว้ แต่ยังเว้นช่องเซ็นจริงเสมอ */}
          <div className="pm-foot" style={{ display: "flex", gap: 14, marginTop: 26, paddingTop: 10,
            breakInside: "avoid", pageBreakInside: "avoid" }}>
            {(signSec.blocks || []).map((b) => (
              <RpSign key={b.key} en={b.en} th={b.th} name={((r.sign || {})[b.key] || {}).name || ""} />
            ))}
          </div>
        </div>

        {/* ── แผ่นที่ 3 · รายการที่ยังขาด ── */}
        {p.missing && p.missing.length ? (
          <div className="pm-sheet">
            {headBar("Outstanding Items", "รายการที่ยังขาด")}
            <div style={{ border: "1.5px solid #DC2626", background: "#FEF2F2", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#B91C1C" }}>
                เอกสารชุดนี้ยังไม่สมบูรณ์ — ยังขาดอีก {p.missing.length} รายการ
              </div>
              <div style={{ fontSize: 10, color: "#991B1B", marginTop: 2 }}>
                This handover package is incomplete · {p.missing.length} item(s) outstanding
              </div>
            </div>
            {(() => {
              const by = {};
              p.missing.forEach((m) => { (by[m.section] || (by[m.section] = [])).push(m); });
              return Object.keys(by).map((k) => (
                <div key={k} style={{ marginBottom: 12, breakInside: "avoid", pageBreakInside: "avoid" }}>
                  {groupHead((window.PM_SEC_BY[k] || {}).en || k, (window.PM_SEC_BY[k] || {}).th || "")}
                  {by[k].map((m, i) => (
                    <div key={m.key + i} style={{ fontSize: 10.5, color: PM_INK, padding: "3px 0 3px 14px" }}>
                      • {m.en} <span style={{ color: PM_SOFT, fontSize: 9.5 }}>({m.th})</span>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        ) : null}

        {/* ── แผ่นรูป ── */}
        {photoPages.map((pg, pi) => (
          <div className="pm-sheet" key={"ph-" + pi}>
            {headBar("Photo Report", "รูปประกอบการส่งมอบ")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {pg.map((ph) => {
                photoNo += 1;
                return (
                  <div key={ph.id} className="pm-shot" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
                    <img src={ph.dataUrl} alt="" style={{ width: "100%", height: 186, objectFit: "cover",
                      border: "1px solid " + PM_LINE, borderRadius: 4, display: "block" }} />
                    <div style={{ fontSize: 9.5, color: PM_SOFT, marginTop: 3 }}>
                      #{photoNo}{ph.cap ? " · " + ph.cap : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(paper, document.body);
}

/* ══════════════════════════════════════════════════
   ออกไฟล์ Excel

   ⚠ ไฟล์นี้ไม่มีรูปถ่าย และแก้ไม่ได้ด้วย — index.html โหลด xlsx-js-style ซึ่งเป็น SheetJS
     รุ่นชุมชนที่เพิ่มแค่การจัดรูปแบบเซลล์ เขียน xl/media/* กับ xl/drawings/* ไม่ได้
     (เป็นฟีเจอร์ของรุ่นเสียเงิน) ทางเลี่ยงมีแค่ประกอบไฟล์ zip เองหรือย้ายไลบรารี ซึ่งไม่คุ้ม
     ⇒ บอกผู้ใช้ตรง ๆ แล้วทำแผ่น Photos เป็นสารบัญที่อ้างเลขรูปชุดเดียวกับใน PDF แทน

   สไตล์ตารางลอกจาก ecExportXlsx (ec-paper.jsx) ให้ไฟล์ที่ออกจากระบบหน้าตาเป็นชุดเดียวกัน
   ══════════════════════════════════════════════════ */
function pmExportXlsx(job, rec, sum, prog, photoIdx) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  const X = window.XLSX;
  const j = job || {};
  const r = rec || {};
  const s = sum || {};
  const p = prog || { pct: 0, done: 0, total: 0, missing: [] };
  const idx = photoIdx || [];

  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", group: "D6EBDF", alt: "F4FAF6",
    white: "FFFFFF", border: "CBD8D0", text: "16241D", sub: "5A6B62", warn: "B45309", warnBg: "FEF3C7" };
  const FONT = "Tahoma";
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };

  /* สร้างแผ่นหนึ่งแผ่นจากรายการแถว — ทุกแผ่นใช้ชนิดแถวชุดเดียวกัน สไตล์จึงเขียนที่เดียว */
  const makeSheet = (cols, colW, build) => {
    const lastC = cols.length - 1;
    const aoa = [], merges = [], meta = [], rowsH = [];
    let R = 0;
    const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
    const fullMerge = () => merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: lastC } });
    const pad = (first, rest) => { const a = [first]; for (let i = 1; i <= lastC; i++) a.push(i === 1 ? rest : ""); return a; };

    pushRow(["สมุดตรวจรับและส่งมอบระบบ · Commissioning & Handover"], "title", 30); fullMerge();
    pushRow([(s.projName || j.name || "") + (j.code ? "  ·  " + j.code : "")], "subtitle", 20); fullMerge();
    pushRow([], "spacer", 6);
    [["กรอกแล้ว", p.pct + "%   (" + p.done + " / " + p.total + " รายการ)"],
     ["วันที่ตรวจสอบ", s.inspDate ? window.drDateTH(s.inspDate) : "-"],
     ["สถานะ", (r.meta || {}).status === "signed" ? "ส่งมอบแล้ว" : "ยังไม่ส่งมอบ"],
     ["วันที่ออกเอกสาร", window.drDateTH(window.drToday())]].forEach((row) => {
      pushRow(pad(row[0], row[1]), "info", 19);
      merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
    });
    pushRow([], "spacer", 8);
    pushRow(cols, "head", 24);

    build(pushRow, merges, () => R, lastC);

    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges; ws["!cols"] = colW; ws["!rows"] = rowsH;
    const styleCell = (row, c) => {
      const t = meta[row]; if (t === "spacer") return null;
      const st = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center", wrapText: true } };
      if (t === "title") { st.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; st.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; st.alignment = { horizontal: "center", vertical: "center" }; }
      else if (t === "subtitle") { st.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; st.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; st.alignment = { horizontal: "center", vertical: "center" }; }
      else if (t === "info") { if (c === 0) { st.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; st.alignment = { horizontal: "right", vertical: "center" }; } else { st.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; st.alignment = { horizontal: "left", vertical: "center" }; } st.border = { bottom: thin }; }
      else if (t === "head") { st.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; st.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; st.alignment = { horizontal: "center", vertical: "center", wrapText: true }; st.border = boxAll; }
      else if (t === "group") { st.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.brandDk } }; st.fill = { patternType: "solid", fgColor: { rgb: C.group } }; st.alignment = { horizontal: "left", vertical: "center" }; st.border = boxAll; }
      else if (t === "foot") { st.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; st.alignment = { horizontal: "left", vertical: "center", wrapText: true }; }
      else if (t === "item" || t === "itemAlt" || t === "miss") {
        if (t === "itemAlt") st.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
        /* แถวที่ยังไม่กรอกย้อมสีเตือน — เปิดไฟล์มาต้องเห็นทันทีว่าต้องไปทำอะไรต่อ */
        if (t === "miss") { st.fill = { patternType: "solid", fgColor: { rgb: C.warnBg } }; st.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.warn } }; }
        st.border = boxAll;
        if (c === 0) st.alignment = { horizontal: "center", vertical: "center" };
      }
      return st;
    };
    const range = X.utils.decode_range(ws["!ref"]);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = X.utils.encode_cell({ r: row, c: c }); const st = styleCell(row, c);
        if (!st) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = st;
      }
    }
    return ws;
  };

  /* ── แผ่น Summary ── */
  const wsSum = makeSheet(["หัวข้อ (EN)", "หัวข้อ (ไทย)", "ค่า", "หน่วย"],
    [{ wch: 42 }, { wch: 30 }, { wch: 34 }, { wch: 10 }],
    (pushRow, merges, getR, lastC) => {
      window.pmGroupsOf(window.PM_SEC_BY.sum, s).forEach((g) => {
        pushRow([g.en + "  (" + g.th + ")", "", "", ""], "group", 20);
        merges.push({ s: { r: getR() - 1, c: 0 }, e: { r: getR() - 1, c: lastC } });
        (g.fields || []).forEach((f, i) => {
          const v = s[f.key];
          const has = v !== null && v !== undefined && String(v) !== "";
          const shown = !has ? "ยังไม่กรอก"
            : f.key === "gpsLat" ? window.pmDms(v, true)
            : f.key === "gpsLng" ? window.pmDms(v, false)
            : f.type === "date" ? window.drDateTH(String(v).slice(0, 10)) : String(v);
          pushRow([f.en, f.th, shown, f.unit || ""], !has && f.req ? "miss" : (i % 2 === 0 ? "item" : "itemAlt"));
        });
      });
    });

  /* ── แผ่น Documents ── */
  const wsDoc = makeSheet(["#", "Document (EN)", "เอกสาร (ไทย)", "Yes", "No", "สถานะ"],
    [{ wch: 6 }, { wch: 52 }, { wch: 38 }, { wch: 7 }, { wch: 7 }, { wch: 14 }],
    (pushRow, merges, getR, lastC) => {
      let n = 0;
      (window.PM_SEC_BY.docs.groups || []).forEach((g) => {
        pushRow([g.en + "  (" + g.th + ")", "", "", "", "", ""], "group", 20);
        merges.push({ s: { r: getR() - 1, c: 0 }, e: { r: getR() - 1, c: lastC } });
        (g.items || []).forEach((it, i) => {
          n += 1;
          const v = (r.docs || {})[it.key];
          const answered = v === "y" || v === "n";
          const lb = window.pmDocLabel(it, j);
          pushRow([n, lb.en, lb.th, v === "y" ? "√" : "", v === "n" ? "–" : "",
            answered ? (v === "y" ? "มีเอกสาร" : "ไม่เกี่ยวข้อง") : "ยังไม่ตอบ"],
            !answered ? "miss" : (i % 2 === 0 ? "item" : "itemAlt"));
        });
      });
      pushRow([], "spacer", 8);
      pushRow(["ช่องลงนาม"], "group", 20);
      merges.push({ s: { r: getR() - 1, c: 0 }, e: { r: getR() - 1, c: lastC } });
      (window.PM_SEC_BY.sign.blocks || []).forEach((b, i) => {
        const v = (r.sign || {})[b.key] || {};
        pushRow(["", b.en, b.th, v.name || "", v.date ? window.drDateTH(String(v.date).slice(0, 10)) : "", v.name ? "ลงนามแล้ว" : "ยังไม่ลงนาม"],
          !v.name ? "miss" : (i % 2 === 0 ? "item" : "itemAlt"));
      });
    });

  /* ── แผ่น Checklist — นี่คือแผ่นที่ทำให้ไฟล์มีประโยชน์ระหว่างทำงาน ไม่ใช่แค่ตอนจบ ── */
  const wsChk = makeSheet(["#", "หมวด", "รายการที่ยังขาด (EN)", "รายการที่ยังขาด (ไทย)"],
    [{ wch: 6 }, { wch: 26 }, { wch: 52 }, { wch: 40 }],
    (pushRow) => {
      if (!p.missing.length) {
        pushRow(["", "", "กรอกครบทุกรายการแล้ว", "ไม่มีรายการค้าง"], "item");
        return;
      }
      p.missing.forEach((m, i) => {
        pushRow([i + 1, m.secTh || m.section, m.en, m.th], i % 2 === 0 ? "item" : "itemAlt");
      });
    });

  /* ── แผ่น Photos — สารบัญ ไม่มีรูป ── */
  const wsPh = makeSheet(["#", "หมวด", "สลอต", "แถว", "คำบรรยาย", "เวลา", "ผู้ถ่าย"],
    [{ wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 34 }, { wch: 18 }, { wch: 18 }],
    (pushRow, merges, getR, lastC) => {
      idx.forEach((ph, i) => {
        pushRow([i + 1, ph.sec || "", ph.slot || "", ph.rowId || "", ph.cap || "",
          ph.at ? window.drDateTH(String(ph.at).slice(0, 10)) : "", ph.byName || ""],
          i % 2 === 0 ? "item" : "itemAlt");
      });
      pushRow([], "spacer", 8);
      pushRow(["รูปถ่ายทั้งหมด " + idx.length + " รูป อยู่ในไฟล์ PDF ของชุดเดียวกัน — แผ่นนี้เป็นสารบัญรูป "
        + "(เลขรูปตรงกับเลขที่พิมพ์ใต้รูปใน PDF) · ไลบรารี Excel ที่ระบบใช้ฝังรูปลงไฟล์ไม่ได้"], "foot", 30);
      merges.push({ s: { r: getR() - 1, c: 0 }, e: { r: getR() - 1, c: lastC } });
    });

  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, wsSum, "Summary");
  X.utils.book_append_sheet(wb, wsDoc, "Documents");
  X.utils.book_append_sheet(wb, wsChk, "Checklist");
  X.utils.book_append_sheet(wb, wsPh, "Photos");
  X.writeFile(wb, "Handover_" + (j.code || "job") + "_" + window.drToday() + ".xlsx");
}

Object.assign(window, { usePmPrintBody, PmHandoverPaper, pmExportXlsx });
