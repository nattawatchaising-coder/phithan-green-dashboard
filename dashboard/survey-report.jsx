/* ============================================================
   flash+solar — รายงานผลสำรวจหน้างาน (Solar Site Survey Report)
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

/* ── พจนานุกรมรายงานผลสำรวจ (ไทย → [อังกฤษ, จีน]) ──
   ใบนี้เป็นคอมโพเนนต์ React จึงแปลทีละข้อความด้วย window.pgT (ดู i18n.jsx)
   ค่าที่ช่างกรอก/เลือกเอง (รุ่นอุปกรณ์ ยี่ห้อ หมายเหตุ คำบรรยายรูป) ไม่อยู่ในตารางนี้ */
const SV_I18N = {
  "รายงานผลสำรวจหน้างาน": ["Site Survey Report", "现场勘查报告"],
  "สำรวจ:": ["Surveyed:", "勘查日期："],
  "รายงาน:": ["Reported:", "报告日期："],
  "โครงการ": ["Project", "项目"],
  "ลูกค้า": ["Customer", "客户"],
  "ขนาด": ["Size", "规模"],
  "แผง": ["Modules", "组件"],
  "รหัสงาน": ["Job code", "项目编号"],
  "ที่อยู่": ["Address", "地址"],
  "ผลการตรวจสอบ": ["Survey findings", "勘查结果"],
  "สภาพหลังคา": ["Roof condition", "屋面状况"],
  "พื้นที่จะวางแผ่นโซลาร์เซลล์": ["Area for the solar array", "组件安装区域"],
  "ประเภทหลังคา": ["Roof type", "屋面类型"],
  "โครงสร้างรับน้ำหนัก": ["Load-bearing structure", "承重结构"],
  "มีวัตถุที่ส่งผลกระทบต่อการรับแสง": ["Objects that shade the array", "影响采光的物体"],
  "ตาข่ายกันนก": ["Bird netting", "防鸟网"],
  "ระบบไฟฟ้า": ["Electrical system", "电气系统"],
  "สายเมนเดิม": ["Existing main cable", "原主干电缆"],
  "มิเตอร์": ["Utility meter", "电表"],
  "ตู้ MDB": ["MDB panel", "总配电柜"],
  "เซฟตี้คัตในตู้": ["Safety switch in the panel", "柜内安全开关"],
  "เมนกันดูด (RCD / RCCB)": ["Main earth-leakage device (RCD / RCCB)", "主漏电保护器（RCD / RCCB）"],
  "ตำแหน่ง MDB": ["MDB location", "配电柜位置"],
  "จุดติดตั้งอินเวอร์เตอร์": ["Inverter mounting point", "逆变器安装位置"],
  "พิกัด GPS หน้างาน": ["Site GPS coordinates", "现场 GPS 坐标"],
  "ความต้องการพิเศษ": ["Special requirements", "特殊要求"],
  "หมายเหตุ": ["Notes", "备注"],
  "เงาบัง:": ["Shading:", "遮挡："],
  "ภาพประกอบการสำรวจ": ["Survey photographs", "勘查照片"],
  "แนบไฟล์เอกสารแยก:": ["Attached as a separate file:", "另附文件："],
  "(เปิดดูได้จากหน้าคลังสินค้า)": ["(available from the inventory page)", "（可在库存页面查看）"],
  "ผู้สำรวจ:": ["Surveyed by:", "勘查人："],
  "ออกรายงาน:": ["Report issued:", "出具日期："],
  "รูป": ["photos", "张"],
  "มี": ["Yes", "有"],
  "ไม่มี": ["No", "无"],
  "โทร ": ["Tel ", "电话 "],
  "ระยะเดินสาย (รวม {} ม.)": ["Cable runs (total {} m)", "线缆路由（合计 {} 米）"],
  "อื่นๆ ({})": ["Other ({})", "其他（{}）"],
  /* ค่าที่เลือกจากรายการใน survey.jsx — สภาพหลังคา โครงสร้าง ตาข่ายกันนก จุดติดตั้ง ช่องว่างในตู้ ช่วงเดินสาย */
  "ดี (แข็งแรง)": ["Good (sound)", "良好（结构稳固）"],
  "พอใช้": ["Fair", "一般"],
  "ทรุดโทรม / ต้องเสริม": ["Deteriorated / needs reinforcement", "老化，需加固"],
  "ผ่าน": ["Pass", "合格"],
  "ต้องเสริม / แก้ไข": ["Needs reinforcement / rectification", "需加固或整改"],
  "ติดตั้ง": ["To be installed", "安装"],
  "ไม่ติดตั้ง": ["Not installed", "不安装"],
  "ในอาคาร (Indoor)": ["Indoor", "室内"],
  "นอกอาคาร (Outdoor)": ["Outdoor", "室外"],
  "มีช่องว่างเพียงพอ": ["Sufficient spare ways", "柜内空间充足"],
  "มีช่องว่างจำกัด": ["Limited spare ways", "柜内空间有限"],
  "เต็ม / ต้องเพิ่มตู้": ["Full / additional panel required", "已满，需增柜"],
  "แผง → อินเวอร์เตอร์ (สาย DC)": ["Modules → inverter (DC cable)", "组件 → 逆变器（直流线）"],
  "อินเวอร์เตอร์ → ตู้ MDB (สาย AC)": ["Inverter → MDB (AC cable)", "逆变器 → 配电柜（交流线）"],
  "CT / Meter → อินเวอร์เตอร์": ["CT / meter → inverter", "CT / 电表 → 逆变器"],
  "สายกราวด์ → หลักดิน": ["Earth cable → ground rod", "接地线 → 接地极"],
};

function SurveyReport({ job, photos, docs, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  /* ภาษาของใบ — สลับสดจากแถบด้านบน ซึ่งไม่ติดไปในหน้าพิมพ์อยู่แล้ว
     วันที่ไทยเป็น พ.ศ. อังกฤษ/จีนเป็น ค.ศ. จึงแยกฟังก์ชันไว้ ห้ามแปลผ่าน T() */
  const [lang, setLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));
  const pickLang = (id) => { setLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = React.useMemo(() => (window.pgT ? window.pgT(SV_I18N, lang) : (k) => k), [lang]);
  const DT = (iso) => (lang === "th" || !window.pgDate ? repDate(iso)
    : !iso ? "-" : window.pgDate(String(iso).slice(0, 10), lang));
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
    document.title = T("รายงานผลสำรวจหน้างาน") + " " + (job.code || "") + " " + (job.name || "");
    window.print();
    setTimeout(() => { document.title = old; }, 800);
  };

  /* หมายเหตุที่จะขึ้นในรายงาน — ของงานรวม ๆ ก่อน แล้วต่อด้วยบันทึกที่เขียนแยกตามหัวข้อ
     ติดชื่อหัวข้อนำหน้าไว้ ไม่งั้นข้อความจะกองรวมกันจนไม่รู้ว่าพูดถึงเรื่องไหน */
  const noteLines = [s.note]
    .concat(s.shadingNote ? [T("เงาบัง:") + " " + s.shadingNote] : [])
    .concat((window.SURVEY_NOTE_BLOCKS || []).map((b) => (String(s[b.key] || "").trim() ? T(b.th) + ": " + s[b.key] : "")))
    .filter(Boolean);

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
        {typeof window.LangPick === "function" && (
          <window.LangPick value={lang} onChange={pickLang} />
        )}
        <button onClick={doPrint} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 16px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Icon name="file" size={16} color="#fff" /> บันทึก PDF
        </button>
      </div>

      {/* กระดาษรายงาน */}
      {/* ฟอนต์ไทยของแอปไม่มีตัวอักษรจีน — เลือกจีนแล้วต้องระบุชุดฟอนต์ที่มีจีนให้ชัด */}
      <div className="sv-rep-paper" style={{ maxWidth: 900, margin: "0 auto", background: "#fff", color: "#15211A",
        fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
        padding: isMobile ? "20px 16px" : "34px 38px", borderRadius: isMobile ? 0 : 12, boxShadow: "0 20px 60px rgba(8,20,14,.28)" }}>
        {/* หัวรายงาน */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", borderBottom: "2px solid var(--primary)", paddingBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.01em" }}>{T("รายงานผลสำรวจหน้างาน")}</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".12em", color: "var(--text-3)", marginTop: 3 }}>SOLAR SITE SURVEY REPORT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
              <window.BrandDoc height={30} />
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.7 }}>
            <div>{T("สำรวจ:")} {DT(s.startedAt)}</div>
            <div>{T("รายงาน:")} {DT(s.completedAt || s.updatedAt || s.startedAt)}</div>
          </div>
        </div>

        {/* ตารางข้อมูลโครงการ */}
        <div className="sv-rep-info" style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <RepCell k={T("โครงการ")} v={job.name} />
          <RepCell k={T("ลูกค้า")} v={job.name} />
          <RepCell k={T("ขนาด")} v={size} />
          <RepCell k="Inverter" v={s.invModel} />
          <RepCell k={T("แผง")} v={s.panelModel} />
          <RepCell k="Monitoring" v={s.monitoring} />
          <RepCell k="Meter/CT" v={s.meterCt} />
          <RepCell k={T("รหัสงาน")} v={job.code} />
          <div style={{ padding: "7px 10px", borderRight: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", background: "var(--surface2)" }}>{T("ที่อยู่")}</div>
          <div style={{ padding: "7px 10px", fontSize: 11.5, color: "var(--text-1)" }}>{[job.address, job.province].filter(Boolean).join(" ") || "-"}{job.phone ? " · " + T("โทร ") + job.phone : ""}</div>
        </div>

        {/* ผลการตรวจสอบ */}
        <RepSection title={T("ผลการตรวจสอบ")}>
          <RepGroup icon="🏠" title={T("สภาพหลังคา")}>
            <RepCheck label={T("พื้นที่จะวางแผ่นโซลาร์เซลล์")} value={s.buildingType} />
            <RepCheck label={T("ประเภทหลังคา")} value={s.roofType} />
            <RepCheck label={T("สภาพหลังคา")} value={T(roofCond)} />
            <RepCheck label={T("โครงสร้างรับน้ำหนัก")} value={T(structure)} />
            <RepCheck label={T("มีวัตถุที่ส่งผลกระทบต่อการรับแสง")} value={(s.shadingTags || []).join(", ")} />
            <RepCheck label={T("ตาข่ายกันนก")} value={T(birdNet)} />
          </RepGroup>

          <RepGroup icon="⚡" title={T("ระบบไฟฟ้า")}>
            <RepCheck label={T("ระบบไฟฟ้า")} value={s.phase ? s.phase + (lang === "th" ? " เฟส" : " Phase") : ""} />
            <RepCheck label="Main Breaker" value={s.mainBreaker} />
            <RepCheck label={T("สายเมนเดิม")} value={s.mainCable} />
            <RepCheck label={T("มิเตอร์")} value={meter} />
            <RepCheck label={T("ตู้ MDB")} value={[s.mdbBrand, T(mdbSpace)].filter(Boolean).join(" · ")} />
            <RepCheck label={T("เซฟตี้คัตในตู้")} value={T(_yn(s.mdbSafety))} />
            <RepCheck label={T("เมนกันดูด (RCD / RCCB)")} value={T(_yn(s.mdbRccb))} />
            <RepCheck label={T("ตำแหน่ง MDB")} value={T(s.mdbLoc)} />
            <RepCheck label={T("จุดติดตั้งอินเวอร์เตอร์")} value={T(invLoc)} />
            <RepCheck label={T("พิกัด GPS หน้างาน")} value={gps} />
          </RepGroup>

          {/* ระยะเดินสายแยกช่วง — ช่วงไหนไม่ได้วัดก็ไม่ต้องขึ้น */}
          {window.SURVEY_CABLE_LEGS.some((l) => +s[l.key] > 0) && (
            <RepGroup icon="📏" title={T("ระยะเดินสาย (รวม {} ม.)").replace("{}", window.cableTotal(s))}>
              {window.SURVEY_CABLE_LEGS.map((l) => <RepCheck key={l.key} label={T(l.th)} value={+s[l.key] > 0 ? s[l.key] + (lang === "th" ? " ม." : lang === "zh" ? " 米" : " m") : ""} />)}
            </RepGroup>
          )}

          {(s.specials || []).filter(Boolean).length > 0 && (
            <RepGroup icon="⚠️" title={T("ความต้องการพิเศษ")}>
              {(s.specials || []).filter(Boolean).map((v, i) => <RepCheck key={i} label={T("อื่นๆ ({})").replace("{}", i + 1)} value={v} />)}
            </RepGroup>
          )}
        </RepSection>

        {/* หมายเหตุ — รวมหมายเหตุของงานกับบันทึกที่เขียนไว้ตามหัวข้อ
            ของที่เขียนแยกหัวข้อติดชื่อหัวข้อนำหน้าไว้ รูปที่แนบคู่กันไปอยู่ในหมวดเดียวกันด้านล่าง */}
        {noteLines.length > 0 && (
          <RepSection title={T("หมายเหตุ")}>
            <div style={{ marginTop: 10, background: "#FFF8F1", border: "1px solid #F5E3D3", borderRadius: 8, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "var(--text-1)" }}>
              {noteLines.join("\n")}
            </div>
          </RepSection>
        )}

        {/* ภาพประกอบ */}
        {shots.length > 0 && (
          <RepSection title={T("ภาพประกอบการสำรวจ") + " (" + shots.length + " " + T("รูป") + ")"}>
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
                      {T("แนบไฟล์เอกสารแยก:")} <b style={{ color: "var(--text-1)" }}>{d.doc.name}</b> {T("(เปิดดูได้จากหน้าคลังสินค้า)")}
                    </div>}
              </div>
            ))}
          </React.Fragment>
        )}

        {/* ท้ายรายงาน */}
        <div style={{ marginTop: 22, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-2)", breakInside: "avoid" }}>
          <div>{T("ผู้สำรวจ:")} <b style={{ color: "var(--text-1)" }}>{s.byName || "-"}</b></div>
          <div>{T("ออกรายงาน:")} {DT(new Date().toISOString())}</div>
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
