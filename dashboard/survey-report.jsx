/* ============================================================
   PHITHAN GREEN — รายงานผลสำรวจหน้างาน (Solar Site Survey Report)
   หน้ารายงานพร้อมพิมพ์ · กด "บันทึก PDF" = สั่งพิมพ์ของเบราว์เซอร์ → Save as PDF
   ใช้วิธีนี้เพราะได้ PDF ภาษาไทยคมชัดจริง เลือกข้อความได้ ไม่ต้องฝังฟอนต์ไทยหลายเมกฯ
   และบนมือถือกดแชร์ต่อจากหน้าพิมพ์ได้เลย
   ============================================================ */

const TH_MONTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function repDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.getDate() + " " + TH_MONTH[d.getMonth()] + " " + (d.getFullYear() + 543);
}
const _lbl = (list, v) => { const x = (list || []).find((o) => o.value === v); return x ? x.label : (v || ""); };
const _yn = (v) => (v === "yes" ? "มี" : v === "no" ? "ไม่มี" : "");

/* แถวติ๊กในหัวข้อ "ผลการตรวจสอบ" — ติ๊กเมื่อมีค่า · ค่าขึ้นในวงเล็บตัวเอียง */
function RepCheck({ label, value }) {
  const on = !!(value !== "" && value != null && String(value).trim());
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 11.5, lineHeight: 1.5, breakInside: "avoid" }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, flexShrink: 0, marginTop: 2, display: "grid", placeItems: "center",
        background: on ? "var(--primary)" : "transparent", border: on ? "none" : "1.4px solid #B9C4BD" }}>
        {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
      </span>
      <span style={{ color: on ? "var(--text-1)" : "var(--text-3)" }}>
        {label}{on && <span style={{ fontStyle: "italic", color: "var(--text-2)" }}> ({value})</span>}
      </span>
    </div>
  );
}
function RepGroup({ icon, title, children }) {
  return (
    <div style={{ marginTop: 12, breakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--primary-dark)", marginBottom: 7 }}>
        <span>{icon}</span>{title}
      </div>
      <div className="sv-rep-grid2">{children}</div>
    </div>
  );
}
function RepSection({ title, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--primary)" }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
function RepCell({ k, v }) {
  return (
    <React.Fragment>
      <div style={{ padding: "7px 10px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", background: "var(--surface2)" }}>{k}</div>
      <div style={{ padding: "7px 10px", borderBottom: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-1)" }}>{v || "-"}</div>
    </React.Fragment>
  );
}

function SurveyReport({ job, photos, docs, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const s = (job && job.survey) || {};
  const shots = window.sortedShots(photos || {});
  const gps = s.gps && s.gps.lat ? s.gps.lat + ", " + s.gps.lng : "";
  /* จัดกลุ่มรูปตามหมวดที่ช่างเลือกไว้ ยังเรียงตามลำดับเดิม — รูปบังคับกับรูปที่ไม่ได้ตั้งหมวด
     อยู่กลุ่มไม่มีชื่อ กองอยู่ต้นรายการเหมือนเดิม รายงานเก่าที่ยังไม่มีหมวดจึงหน้าตาไม่เปลี่ยน */
  const shotGroups = React.useMemo(() => {
    const out = [], by = {};
    shots.forEach((sh) => {
      const c = (sh.cat || "").trim();
      if (!by[c]) { by[c] = { cat: c, shots: [] }; out.push(by[c]); }
      by[c].shots.push(sh);
    });
    return out;
  }, [photos]);

  // เปิดหน้าพิมพ์ของเบราว์เซอร์ → เลือก "บันทึกเป็น PDF" (มือถือมีปุ่มแชร์ต่อในหน้าเดียวกัน)
  const doPrint = () => {
    const old = document.title;
    document.title = "รายงานสำรวจ " + (job.code || "") + " " + (job.name || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  const roofCond = _lbl(window.SURVEY_ROOF_COND, s.roofCondition);
  const structure = _lbl(window.SURVEY_PASS, s.structureOk);
  const birdNet = _lbl(window.SURVEY_BIRDNET, s.birdNet);
  const invLoc = _lbl(window.SURVEY_INV_LOC, s.inverterLoc);
  const mdbSpace = _lbl(window.SURVEY_MDB_SPACE, s.mdbSpace);
  const meter = [s.meterAuth, s.meterSize].filter(Boolean).join(" · ");
  const size = [s.sizeKw ? s.sizeKw + " kW" : "", s.phase ? "(" + s.phase + " Phase)" : ""].filter(Boolean).join(" ");

  return (
    <div className="sv-rep-overlay" style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(8,20,14,.55)", overflow: "auto", padding: isMobile ? 0 : "24px 16px" }}>
      {/* แถบปุ่ม — ไม่ติดไปในไฟล์ที่พิมพ์ */}
      <div className="sv-rep-noprint" style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", gap: 9, alignItems: "center", padding: "11px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)", marginBottom: isMobile ? 0 : 16, borderRadius: isMobile ? 0 : 12, maxWidth: 900, marginLeft: "auto", marginRight: "auto", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>รายงานผลสำรวจหน้างาน</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>{shots.length} รูป{(docs || []).length ? " · DATA SHEET " + docs.length + " ใบ" : ""} · กดปุ่มแล้วเลือก “บันทึกเป็น PDF”</div>
        </div>
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* กระดาษรายงาน */}
      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A", padding: isMobile ? "20px 16px" : "34px 38px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>
        {/* หัวรายงาน */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", borderBottom: "2px solid var(--primary)", paddingBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.01em" }}>รายงานผลสำรวจหน้างาน</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".12em", color: "var(--text-3)", marginTop: 3 }}>SOLAR SITE SURVEY REPORT</div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)", marginTop: 6 }}>PHITHAN GREEN</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.7 }}>
            <div>สำรวจ: {repDate(s.startedAt)}</div>
            <div>รายงาน: {repDate(s.completedAt || s.updatedAt || s.startedAt)}</div>
          </div>
        </div>

        {/* ตารางข้อมูลโครงการ */}
        <div className="sv-rep-info" style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <RepCell k="โครงการ" v={job.name} />
          <RepCell k="ลูกค้า" v={job.name} />
          <RepCell k="ขนาด" v={size} />
          <RepCell k="Inverter" v={s.invModel} />
          <RepCell k="แผง" v={s.panelModel} />
          <RepCell k="Monitoring" v={s.monitoring} />
          <RepCell k="Meter/CT" v={s.meterCt} />
          <RepCell k="รหัสงาน" v={job.code} />
          <div style={{ padding: "7px 10px", borderRight: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", background: "var(--surface2)" }}>ที่อยู่</div>
          <div style={{ padding: "7px 10px", fontSize: 11.5, color: "var(--text-1)" }}>{[job.address, job.province].filter(Boolean).join(" ") || "-"}{job.phone ? " · โทร " + job.phone : ""}</div>
        </div>

        {/* ผลการตรวจสอบ */}
        <RepSection title="ผลการตรวจสอบ">
          <RepGroup icon="🏠" title="สภาพหลังคา">
            <RepCheck label="พื้นที่จะวางแผ่นโซลาร์เซลล์" value={s.buildingType} />
            <RepCheck label="ประเภทหลังคา" value={s.roofType} />
            <RepCheck label="สภาพหลังคา" value={roofCond} />
            <RepCheck label="โครงสร้างรับน้ำหนัก" value={structure} />
            <RepCheck label="มีวัตถุที่ส่งผลกระทบต่อการรับแสง" value={(s.shadingTags || []).join(", ")} />
            <RepCheck label="ตาข่ายกันนก" value={birdNet} />
          </RepGroup>

          <RepGroup icon="⚡" title="ระบบไฟฟ้า">
            <RepCheck label="ระบบไฟฟ้า" value={s.phase ? s.phase + " เฟส" : ""} />
            <RepCheck label="Main Breaker" value={s.mainBreaker} />
            <RepCheck label="สายเมนเดิม" value={s.mainCable} />
            <RepCheck label="มิเตอร์" value={meter} />
            <RepCheck label="ตู้ MDB" value={[s.mdbBrand, mdbSpace].filter(Boolean).join(" · ")} />
            <RepCheck label="เซฟตี้คัตในตู้" value={_yn(s.mdbSafety)} />
            <RepCheck label="เมนกันดูด (RCD / RCCB)" value={_yn(s.mdbRccb)} />
            <RepCheck label="ตำแหน่ง MDB" value={s.mdbLoc} />
            <RepCheck label="จุดติดตั้งอินเวอร์เตอร์" value={invLoc} />
            <RepCheck label="พิกัด GPS หน้างาน" value={gps} />
          </RepGroup>

          {/* ระยะเดินสายแยกช่วง — ช่วงไหนไม่ได้วัดก็ไม่ต้องขึ้น */}
          {window.SURVEY_CABLE_LEGS.some((l) => +s[l.key] > 0) && (
            <RepGroup icon="📏" title={"ระยะเดินสาย (รวม " + window.cableTotal(s) + " ม.)"}>
              {window.SURVEY_CABLE_LEGS.map((l) => <RepCheck key={l.key} label={l.th} value={+s[l.key] > 0 ? s[l.key] + " ม." : ""} />)}
            </RepGroup>
          )}

          {(s.specials || []).filter(Boolean).length > 0 && (
            <RepGroup icon="⚠️" title="ความต้องการพิเศษ">
              {(s.specials || []).filter(Boolean).map((v, i) => <RepCheck key={i} label={"อื่นๆ (" + (i + 1) + ")"} value={v} />)}
            </RepGroup>
          )}
        </RepSection>

        {/* หมายเหตุ */}
        {(s.note || s.shadingNote) && (
          <RepSection title="หมายเหตุ">
            <div style={{ marginTop: 10, background: "#FFF8F1", border: "1px solid #F5E3D3", borderRadius: 8, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "var(--text-1)" }}>
              {[s.note, s.shadingNote ? "เงาบัง: " + s.shadingNote : ""].filter(Boolean).join("\n")}
            </div>
          </RepSection>
        )}

        {/* ภาพประกอบ */}
        {shots.length > 0 && (
          <RepSection title={"ภาพประกอบการสำรวจ (" + shots.length + " รูป)"}>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {shotGroups.map((g) => (
                <React.Fragment key={g.cat || "_"}>
                {/* หัวหมวดรูป — ขึ้นเฉพาะตอนที่มีการแบ่งหมวดจริง ๆ ไม่งั้นรายงานเดิมจะมีหัวว่างเปล่าโผล่มา */}
                {g.cat && shotGroups.length > 1 && (
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--primary-dark)", marginTop: 4, breakInside: "avoid" }}>▸ {g.cat}</div>
                )}
                {g.shots.map((sh) => { const i = shots.indexOf(sh); return (
                /* รูปแนวตั้งถ้าปล่อยเต็มความกว้างจะกินกระดาษทั้งหน้า — จำกัดความสูงแล้วจัดกลาง
                   กรอบ inline-block เพื่อให้เท่าขนาดรูปพอดี ลูกศรที่วาดทับจะได้ไม่เลื่อน */
                <div key={sh.key} className="sv-rep-shot" data-p={sh.ah > sh.aw ? "1" : "0"}
                  style={{ border: "1px solid var(--border)", borderRadius: 9, padding: 10, breakInside: "avoid" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-1)", marginBottom: 7 }}>{i + 1}. {window.shotTitle(sh)}</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", lineHeight: 0, borderRadius: 6, overflow: "hidden" }}>
                      <img src={sh.dataUrl} alt={window.shotTitle(sh)} />
                      <window.AnnOverlay ann={sh.ann} aw={sh.aw} ah={sh.ah} />
                    </div>
                  </div>
                  {sh.caption && <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 7 }}>{sh.caption}</div>}
                </div>
                ); })}
                </React.Fragment>
              ))}
            </div>
          </RepSection>
        )}

        {/* DATA SHEET ของรุ่นที่เสนอ — ขึ้นหน้าใหม่ทุกใบ จะได้เป็นเอกสารแนบเต็มหน้า
           ไฟล์ PDF ฝังในหน้าพิมพ์ไม่ได้ ขึ้นเป็นบรรทัดอ้างอิงชื่อไฟล์ไว้แทน */}
        {(docs || []).length > 0 && (
          <React.Fragment>
            {(docs || []).map((d) => (
              <div key={d.role} className="sv-rep-ds" style={{ breakBefore: "page", pageBreakBefore: "always", marginTop: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--primary)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>DATA SHEET — {d.role}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-2)", marginLeft: "auto" }}>{d.name}</span>
                </div>
                {/^image\//.test(d.doc.type || "")
                  ? <img src={d.doc.data} alt={d.name} style={{ width: "100%", display: "block", borderRadius: 8, border: "1px solid var(--border)" }} />
                  : <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                      แนบไฟล์เอกสารแยก: <b style={{ color: "var(--text-1)" }}>{d.doc.name}</b> (เปิดดูได้จากหน้าคลังสินค้า)
                    </div>}
              </div>
            ))}
          </React.Fragment>
        )}

        {/* ท้ายรายงาน */}
        <div style={{ marginTop: 22, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-2)", breakInside: "avoid" }}>
          <div>ผู้สำรวจ: <b style={{ color: "var(--text-1)" }}>{s.byName || "-"}</b></div>
          <div>ออกรายงาน: {repDate(new Date().toISOString())}</div>
        </div>
      </div>
    </div>
  );
}

/* ตัวห่อ — โหลดรูปของงาน/ลูกค้ารายนี้ให้รายงาน (hook เรียกในคอมโพเนนต์เท่านั้น)
   พร้อมดึง DATA SHEET ของรุ่นที่เสนอ (อินเวอร์เตอร์ / แผง) จากคลัง มาต่อท้ายเป็นหน้ารายงาน
   เอกสารเก็บแยกโหนด โหลดทีละใบเฉพาะตอนออกรายงาน ไม่ถ่วงตอนเปิดแอป */
function SurveyReportHost({ job, stock, onClose }) {
  const media = window.useSurveyPhotos(job ? job.id : null);
  const s = (job && job.survey) || {};
  const items = (stock && stock.items) || [];
  const withDoc = React.useMemo(() => {
    const names = [{ role: "Inverter", name: s.invModel }, { role: "แผงโซลาร์", name: s.panelModel }];
    return names.map((x) => {
      const nm = String(x.name || "").trim();
      if (!nm) return null;
      const it = items.find((i) => (i.name || "").trim() === nm && i.doc);
      return it ? { role: x.role, item: it } : null;
    }).filter(Boolean);
  }, [items, s.invModel, s.panelModel]);
  const [docs, setDocs] = React.useState([]);
  React.useEffect(() => {
    let dead = false;
    if (!withDoc.length || !stock || !stock.loadDoc) { setDocs([]); return; }
    Promise.all(withDoc.map((w) => stock.loadDoc(w.item.id)
      .then((d) => (d && d.data ? { role: w.role, name: w.item.name, doc: d } : null))
      .catch(() => null)))
      .then((list) => { if (!dead) setDocs(list.filter(Boolean)); });
    return () => { dead = true; };
  }, [withDoc]);
  if (!job) return null;
  return <SurveyReport job={job} photos={media.photos} docs={docs} onClose={onClose} />;
}

Object.assign(window, { SurveyReport, SurveyReportHost, repDate });
