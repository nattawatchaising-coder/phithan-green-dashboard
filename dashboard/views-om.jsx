/* ============================================================
   flash+solar — งานบริการหลังการขาย: หน้ารายการไซต์ · แผงไซต์ · ฟอร์มไซต์นอกระบบ

   ตรรกะทั้งหมดอยู่ใน om.jsx ไฟล์นี้มีแต่หน้าจอ
   ชิ้นส่วนฟอร์มยืมของรายงานประจำวัน (window.DrLabel / DrText / DrSection ฯลฯ)
   เพราะสองโมดูลนี้ต้องหน้าตาเหมือนกัน แก้ที่เดียวเปลี่ยนพร้อมกัน

   ตั้งชื่อ top-level ขึ้นต้นด้วย Om/om กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const OM_INPUT = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

/* ป้ายสถานะกลม ๆ ใช้ทั้งในรายการและในแผงไซต์ */
function OmPill({ th, color, sub }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
      fontSize: 11.5, fontWeight: 700, color: color, background: color + "1a", borderRadius: 99, padding: "3px 10px" }}>
      {th}{sub && <span style={{ fontWeight: 500, opacity: 0.85 }}>{sub}</span>}
    </span>
  );
}

function OmStat({ label, value, color, hint, on, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ flex: 1, minWidth: 108, textAlign: "left", padding: "11px 13px", borderRadius: 12, fontFamily: "inherit",
        background: on ? (color || "var(--primary)") + "14" : "var(--surface2)",
        border: "1px solid " + (on ? (color || "var(--primary)") : "var(--border)"),
        cursor: onClick ? "pointer" : "default" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: color, lineHeight: 1.2 }}>{value}</div>
      {hint && <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{hint}</div>}
    </button>
  );
}

/* แถบเวลาประกันที่เหลือ — เห็นด้วยตาว่าเหลือมากน้อยแค่ไหน ไม่ต้องอ่านตัวเลข */
function OmWarrantyBar({ w }) {
  const st = window.omWarrantyState(w);
  const total = ((+w.years || 0) * 12 + (+w.months || 0)) * 30.4;
  const left = st.key === "expired" ? 0 : Math.max(0, Math.min(1, total ? st.days / total : 0));
  return (
    <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: (left * 100).toFixed(1) + "%", background: st.color, borderRadius: 99 }} />
    </div>
  );
}

/* ── ทะเบียนประกันของไซต์หนึ่ง ──
   แก้ตรงนี้ที่เดียว ไม่มีปุ่มบันทึกแยก — เขียนลงฐานข้อมูลทันทีแบบเดียวกับที่อื่นในระบบ */
function OmWarrantyTable({ site, disabled, onChange }) {
  const list = window.omWarrantyList(site);
  const setW = (id, fields) => {
    const w = Object.assign({}, site.warranties || {});
    w[id] = Object.assign({}, w[id], fields);
    onChange(w);
  };
  const add = () => {
    const id = window.omNewId("OW");
    const w = Object.assign({}, site.warranties || {});
    w[id] = { id, kind: "other", label: "", years: 1, months: 0, start: site.comDate || window.drToday(), note: "" };
    onChange(w);
  };
  const del = (id) => {
    const w = Object.assign({}, site.warranties || {});
    delete w[id];
    onChange(w);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!list.length && (
        <div style={{ padding: "14px 6px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีรายการประกัน</div>
      )}
      {list.map((w) => {
        const st = window.omWarrantyState(w);
        const kind = window.OM_WARRANTY_KIND_BY[w.kind] || window.OM_WARRANTY_KIND_BY.other;
        return (
          <div key={w.id} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: "11px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: kind.color, flexShrink: 0 }} />
              <input value={w.label || ""} disabled={disabled} placeholder="ชื่อรายการประกัน"
                onChange={(e) => setW(w.id, { label: e.target.value })}
                style={Object.assign({}, OM_INPUT, { flex: 1, minWidth: 130, width: "auto", padding: "7px 10px", fontSize: 13, fontWeight: 700 })} />
              <OmPill th={st.th} color={st.color} />
              {!disabled && (
                <button type="button" onClick={() => del(w.id)} title="ลบรายการประกันนี้"
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)",
                    cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-3)" }}>
                  <Icon name="trash" size={13} />
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))", gap: 8, marginBottom: 9 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>ประเภท</span>
                <select value={w.kind || "other"} disabled={disabled} onChange={(e) => setW(w.id, { kind: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5 })}>
                  {window.OM_WARRANTY_KIND.map((k) => <option key={k.key} value={k.key}>{k.th}</option>)}
                </select>
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>เริ่มคุ้มครอง</span>
                <input type="date" value={w.start || ""} disabled={disabled} onChange={(e) => setW(w.id, { start: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)" })} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>กี่ปี</span>
                <input value={String(w.years == null ? "" : w.years)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => setW(w.id, { years: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, marginBottom: 3 }}>เพิ่มอีกกี่เดือน</span>
                <input value={String(w.months == null ? "" : w.months)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => setW(w.id, { months: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                  style={Object.assign({}, OM_INPUT, { padding: "7px 9px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </label>
            </div>
            <OmWarrantyBar w={w} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                คุ้มครองถึง <b style={{ color: "var(--text-2)", fontFamily: "var(--mono)" }}>{st.end ? window.drDateTH(st.end) : "—"}</b>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color }}>{window.omWarrantyLeftTH(w)}</span>
            </div>
          </div>
        );
      })}
      {!disabled && (
        <button type="button" onClick={add}
          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
            border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="plus" size={14} /> เพิ่มรายการประกัน
        </button>
      )}
    </div>
  );
}

/* ── แผงไซต์ ──
   เฟสนี้มีข้อมูลไซต์ · วันรับมอบ · ทะเบียนประกัน · ตั้งค่ารอบล้างแผง
   ส่วนนัดล้างจริง ใบแจ้งซ่อม และใบรายงานเข้าบริการ จะมาในเฟสถัดไป */
function OmSiteModal({ site, job, role, onClose, onPatch, onRemove }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const disabled = !window.omCanWrite(role, null);
  const canDelete = window.omCanDelete(role);
  const [delAsk, setDelAsk] = React.useState(false);
  if (!site) return null;
  const st = window.omSiteWarrantyState(site);
  const clean = site.clean || window.omBlankClean(site.comDate);
  const set = (fields) => { if (!disabled) onPatch(site.id, fields); };
  const setClean = (fields) => set({ clean: Object.assign({}, clean, fields) });

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(8,20,26,.5)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 760, maxHeight: isMobile ? "94vh" : "88vh", overflowY: "auto",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: isMobile ? "18px 18px 0 0" : 18, boxShadow: "0 24px 60px rgba(0,0,0,.28)" }}>

        {/* หัวแผง */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg)", borderBottom: "1px solid var(--border)",
          padding: isMobile ? "14px 13px" : "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: st.color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="shield" size={18} color={st.color} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>{site.name || "(ยังไม่ได้ตั้งชื่อไซต์)"}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                {site.code} · {window.omIsExternal(site.id) ? "ไซต์นอกระบบ" : "งานติดตั้งของเรา"}
                {typeof site.kw === "number" && site.kw > 0 ? " · " + site.kw + " kW" : ""}
              </div>
            </div>
            <OmPill th={st.th} color={st.color} />
            <button onClick={onClose} title="ปิด"
              style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
              <Icon name="x" size={15} />
            </button>
          </div>
        </div>

        <div style={{ padding: isMobile ? "14px 13px 24px" : "18px 20px 26px" }}>
          {disabled && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: 12 }}>
              <Icon name="lock" size={15} color="var(--text-3)" />
              <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>ดูได้อย่างเดียว — ไม่มีสิทธิ์แก้งานบริการหลังการขาย</span>
            </div>
          )}

          {/* งานที่ผูกอยู่ถูกลบจากฐานข้อมูลแล้ว — ตั้งใจให้ไซต์ค้างอยู่ เพราะภาระประกันยังอยู่ */}
          {site.source === "job" && !job && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", marginBottom: 14,
              border: "1px solid #F59E0B40", background: "#F59E0B14", borderRadius: 12 }}>
              <Icon name="alert" size={15} color="#F59E0B" />
              <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>ใบงานต้นทางถูกลบจากฐานข้อมูลแล้ว · ทะเบียนบริการยังอยู่ต่อเพราะประกันยังไม่หมด</span>
            </div>
          )}

          <window.DrSection n="1" title="ข้อมูลไซต์" hint={site.tech ? "" : "ยังไม่ได้ระบุช่างผู้ดูแล"}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <window.DrLabel>ชื่อไซต์ / ลูกค้า</window.DrLabel>
                <input value={site.name || ""} disabled={disabled} onChange={(e) => set({ name: e.target.value })} style={OM_INPUT} />
              </div>
              <div>
                <window.DrLabel>เบอร์ติดต่อ</window.DrLabel>
                <input value={site.phone || ""} disabled={disabled} onChange={(e) => set({ phone: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { fontFamily: "var(--mono)" })} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <window.DrLabel>ที่ตั้ง</window.DrLabel>
              <window.DrText value={site.address} disabled={disabled} rows={2} onChange={(v) => set({ address: v })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 12 }}>
              <div>
                <window.DrLabel>จังหวัด</window.DrLabel>
                <input value={site.province || ""} disabled={disabled} onChange={(e) => set({ province: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })} />
              </div>
              <div>
                <window.DrLabel>ขนาด (kW)</window.DrLabel>
                <input value={String(site.kw == null ? "" : site.kw)} disabled={disabled} inputMode="decimal"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); set({ kw: v === "" ? null : +v }); }}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </div>
              <div>
                <window.DrLabel>จำนวนแผง</window.DrLabel>
                <input value={String(site.panels == null ? "" : site.panels)} disabled={disabled} inputMode="numeric"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); set({ panels: v === "" ? null : +v }); }}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5, fontFamily: "var(--mono)", textAlign: "right" })} />
              </div>
              <div>
                <window.DrLabel>ยี่ห้อ</window.DrLabel>
                <input value={site.brand || ""} disabled={disabled} onChange={(e) => set({ brand: e.target.value })}
                  style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontSize: 12.5 })} />
              </div>
            </div>
          </window.DrSection>

          <window.DrSection n="2" title="วันรับมอบงาน" tone="#0EA5E9"
            hint={window.OM_COMSRC_TH[site.comSrc] || ""}>
            {/* วันนี้คือจุดตั้งต้นของทั้งประกันและรอบล้างแผง เดาผิดแล้วผิดยาว จึงต้องให้คนยืนยัน */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input type="date" value={site.comDate || ""} disabled={disabled}
                onChange={(e) => set({ comDate: e.target.value, comSrc: "confirmed" })}
                style={Object.assign({}, OM_INPUT, { width: "auto", padding: "8px 11px", fontFamily: "var(--mono)", fontSize: 13 })} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{site.comDate ? window.drDateTH(site.comDate, true) : "—"}</span>
            </div>
            {window.omComUnsure(site) && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11, padding: "10px 12px",
                border: "1px solid #F59E0B40", background: "#F59E0B14", borderRadius: 11 }}>
                <Icon name="alert" size={15} color="#F59E0B" />
                <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-1)" }}>
                  วันรับมอบเป็นค่าประมาณ ({window.OM_COMSRC_TH[site.comSrc] || "ไม่ทราบที่มา"}) กรุณายืนยัน
                </span>
                {!disabled && (
                  <button onClick={() => set({ comSrc: "confirmed" })}
                    style={{ padding: "6px 12px", borderRadius: 9, border: "none", background: "#F59E0B", color: "#fff",
                      cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>ยืนยันวันนี้ถูกแล้ว</button>
                )}
              </div>
            )}
          </window.DrSection>

          <window.DrSection n="3" title="ทะเบียนประกัน" tone="#1B9B75"
            hint={"เตือนล่วงหน้า " + window.OM_WARN_DAYS + " วันก่อนหมด"}>
            <OmWarrantyTable site={site} disabled={disabled} onChange={(w) => set({ warranties: w })} />
          </window.DrSection>

          <window.DrSection n="4" title="รอบล้างแผง" tone="#0EA5E9"
            hint="ตั้งค่ารอบไว้ก่อน — หน้าตารางล้างแผงจะมาในขั้นถัดไป">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <button type="button" disabled={disabled} onClick={() => setClean({ on: !clean.on })}
                style={{ padding: "7px 13px", borderRadius: 99, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 700,
                  border: "1px solid " + (clean.on ? "#0EA5E9" : "var(--border-strong)"),
                  background: clean.on ? "#0EA5E91e" : "var(--surface)", color: clean.on ? "#0EA5E9" : "var(--text-2)" }}>
                {clean.on ? "อยู่ในรอบล้างแผง" : "ไม่อยู่ในรอบล้างแผง"}
              </button>
            </div>
            {clean.on && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <div>
                  <window.DrLabel>ล้างทุกกี่เดือน</window.DrLabel>
                  <input value={String(clean.everyMon == null ? "" : clean.everyMon)} disabled={disabled} inputMode="numeric"
                    onChange={(e) => setClean({ everyMon: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <div>
                  <window.DrLabel hint="ตามสัญญา">ล้างฟรีกี่ครั้ง</window.DrLabel>
                  <input value={String(clean.freeCount == null ? "" : clean.freeCount)} disabled={disabled} inputMode="numeric"
                    onChange={(e) => setClean({ freeCount: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0 })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", textAlign: "right" })} />
                </div>
                <div>
                  <window.DrLabel hint="ครั้งแรก">ครบรอบวันที่</window.DrLabel>
                  <input type="date" value={clean.firstDue || ""} disabled={disabled}
                    onChange={(e) => setClean({ firstDue: e.target.value })}
                    style={Object.assign({}, OM_INPUT, { padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 12.5 })} />
                </div>
              </div>
            )}
            {clean.on && site.comDate && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 9 }}>
                นับจากวันรับมอบ {window.drShort(site.comDate)} + {clean.everyMon || 0} เดือน = {" "}
                <b style={{ color: "var(--text-2)", fontFamily: "var(--mono)" }}>
                  {window.drShort(window.omAddMonths(site.comDate, clean.everyMon || 0))}
                </b>
              </div>
            )}
          </window.DrSection>

          <window.DrSection n="5" title="หมายเหตุ" tone="#94A3B8">
            <window.DrText value={site.note} disabled={disabled} rows={2}
              placeholder="เช่น หลังคาสูง ต้องใช้กระเช้า · ลูกค้าสะดวกเฉพาะวันเสาร์"
              onChange={(v) => set({ note: v })} />
          </window.DrSection>

          {canDelete && (
            delAsk ? (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", flexWrap: "wrap",
                border: "1px solid #EF444440", background: "#EF44440e", borderRadius: 12 }}>
                <span style={{ flex: 1, minWidth: 160, fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                  ลบทะเบียนบริการของ {site.code}? ประวัติประกันและรอบล้างแผงหายถาวร (ใบงานไม่ถูกแตะ)
                </span>
                <button onClick={() => setDelAsk(false)}
                  style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>ยกเลิก</button>
                <button onClick={() => { onRemove(site.id); onClose(); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "none",
                    background: "#EF4444", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                  <Icon name="trash" size={14} color="#fff" /> ลบเลย
                </button>
              </div>
            ) : (
              <button onClick={() => setDelAsk(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9,
                  border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "#EF4444" }}>
                <Icon name="trash" size={14} color="#EF4444" /> ลบทะเบียนบริการนี้ (เฉพาะแอดมิน)
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ── หน้าหลัก ── */
function OmView({ jobs, role, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { sites, loading, upsert, patch, remove } = window.useOmSites();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("");      /* "" | "soon" | "expired" | "unsure" */
  const [open, setOpen] = React.useState(null);        /* siteId ที่เปิดแผงอยู่ */
  const [enrolling, setEnrolling] = React.useState(false);
  const canWrite = window.omCanWrite(role, null);

  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach((j) => { if (j && j.id) m[j.id] = j; });
    return m;
  }, [jobs]);

  const pending = React.useMemo(() => window.omEnrollable(jobs, sites), [jobs, sites]);
  const roll = React.useMemo(() => window.omRollup(sites), [sites]);

  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = (sites || []).map((s) => ({ site: s, st: window.omSiteWarrantyState(s) }))
      .filter((r) => {
        if (filter === "unsure" && !window.omComUnsure(r.site)) return false;
        if ((filter === "soon" || filter === "expired") && r.st.key !== filter) return false;
        if (!kw) return true;
        return [r.site.name, r.site.code, r.site.province, r.site.address, r.site.phone]
          .some((v) => String(v || "").toLowerCase().includes(kw));
      });
    /* เรียงให้เรื่องที่ต้องรีบอยู่บนสุด: หมดประกัน → ใกล้หมด → เหลือน้อยก่อน */
    const rank = { expired: 0, soon: 1, active: 2, none: 3 };
    out.sort((a, b) => (rank[a.st.key] - rank[b.st.key]) || (a.st.days - b.st.days));
    return out;
  }, [sites, q, filter]);

  const enrollAll = () => {
    if (!canWrite || !pending.length) return;
    setEnrolling(true);
    pending.forEach((j) => upsert(window.omSiteFromJob(j, currentUser)));
    setEnrolling(false);
  };
  const addExternal = () => {
    if (!canWrite) return;
    const rec = window.omBlankSite(sites, currentUser);
    upsert(rec);
    setOpen(rec.id);
  };
  const tog = (k) => setFilter(filter === k ? "" : k);
  const cur = (sites || []).find((s) => s.id === open) || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <OmStat label="ไซต์ในสัญญาบริการ" value={roll.total} color="var(--text-1)"
          hint={roll.kwSites ? roll.kw.toFixed(1) + " kW (เฉพาะไซต์ที่มีข้อมูลขนาดระบบ)" : ""} />
        <OmStat label="ใกล้หมดประกัน" value={roll.warnSoon} color="#F59E0B"
          hint={"เหลือไม่เกิน " + window.OM_WARN_DAYS + " วัน"} on={filter === "soon"} onClick={() => tog("soon")} />
        <OmStat label="หมดประกันแล้ว" value={roll.warnExpired} color="#EF4444" on={filter === "expired"} onClick={() => tog("expired")} />
        <OmStat label="วันรับมอบยังไม่ยืนยัน" value={roll.unsure} color="#7C5CFC" on={filter === "unsure"} onClick={() => tog("unsure")} />
      </div>

      {/* แถบขึ้นทะเบียน — คำนวณสดจากงานที่ปิดแล้ว ไม่ได้ผูกกับการเดินขั้นงาน
          ให้คนกดยืนยันเอง เพราะวันรับมอบ (= วันเริ่มประกัน) เดาเองไม่ได้เสมอ */}
      {!!pending.length && (
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", flexWrap: "wrap",
          border: "1px solid #1B9B7540", background: "#1B9B7512", borderRadius: 14 }}>
          <Icon name="wrench" size={17} color="#1B9B75" />
          <span style={{ flex: 1, minWidth: 180, fontSize: 12.5, color: "var(--text-1)" }}>
            มีงานที่ติดตั้งเสร็จแล้วแต่ยังไม่ขึ้นทะเบียนบริการ <b>{pending.length}</b> งาน
            <span style={{ display: "block", color: "var(--text-3)", fontSize: 11.5 }}>
              {pending.slice(0, 4).map((j) => j.code).join(" · ")}{pending.length > 4 ? " · อีก " + (pending.length - 4) : ""}
            </span>
          </span>
          {canWrite && (
            <button onClick={enrollAll} disabled={enrolling}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none",
                background: "#1B9B75", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
              <Icon name="plus" size={14} color="#fff" /> ขึ้นทะเบียนทั้งหมด
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center" }}>
            <Icon name="search" size={15} color="var(--text-3)" />
          </span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อไซต์ · รหัส · จังหวัด · เบอร์โทร"
            style={Object.assign({}, OM_INPUT, { padding: "9px 12px 9px 34px", fontSize: 13 })} />
        </div>
        {canWrite && (
          <button onClick={addExternal}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10,
              border: "1px dashed var(--border-strong)", background: "var(--surface)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
            <Icon name="plus" size={14} /> เพิ่มไซต์นอกระบบ
          </button>
        )}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface2)", overflow: "hidden" }}>
        {loading && <div style={{ padding: 20, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด...</div>}
        {!loading && !rows.length && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>
            {sites.length ? "ไม่มีไซต์ที่ตรงกับที่ค้นหา" : "ยังไม่มีไซต์ในสัญญาบริการ — ขึ้นทะเบียนจากงานที่ติดตั้งเสร็จ หรือเพิ่มไซต์นอกระบบ"}
          </div>
        )}
        {rows.map((r) => {
          const s = r.site;
          const unsure = window.omComUnsure(s);
          return (
            <button key={s.id} onClick={() => setOpen(s.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: isMobile ? "11px 12px" : "13px 16px",
                borderBottom: "1px solid var(--border)", background: "none", border: "none", borderTop: "none",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: r.st.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name || "(ยังไม่ได้ตั้งชื่อไซต์)"}</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>
                  {s.code}{s.province ? " · " + s.province : ""}
                  {typeof s.kw === "number" && s.kw > 0 ? " · " + s.kw + " kW" : ""}
                  {s.comDate ? " · รับมอบ " + window.drShort(s.comDate) : ""}
                </span>
              </span>
              {unsure && <OmPill th="ยังไม่ยืนยันวันรับมอบ" color="#7C5CFC" />}
              <OmPill th={r.st.th} color={r.st.color}
                sub={r.st.key === "none" ? "" : "· " + window.omDaysTH(r.st)} />
              <Icon name="chevronRight" size={15} color="var(--text-3)" />
            </button>
          );
        })}
      </div>

      {cur && (
        <OmSiteModal site={cur} job={jobById[cur.id] || null} role={role}
          onClose={() => setOpen(null)} onPatch={patch} onRemove={remove} />
      )}
    </div>
  );
}

Object.assign(window, { OM_INPUT, OmPill, OmStat, OmWarrantyBar, OmWarrantyTable, OmSiteModal, OmView });
