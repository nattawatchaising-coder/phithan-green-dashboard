/* ============================================================
   PHITHAN GREEN — BOQ Editor (ถอดวัสดุต่องาน)
   กรอกพารามิเตอร์ → คำนวณรายการวัสดุอัตโนมัติ → บันทึก / ดาวน์โหลด Excel
   ============================================================ */

/* ── หน้าตาแบบเดียวกับเวิร์กสเปซวางแผง 3 มิติ ──
   เต็มจอ · หัวข้ออยู่แถบซ้าย · สรุปตัวเลขติดขอบล่างเห็นตลอด
   (เดิมเป็นกล่องกลางจอที่ต้องพับ-กางหัวข้อ ทำให้เลื่อนหาของนาน และไม่รู้ว่ายอดรวมเปลี่ยนไปแค่ไหน) */
const BQ_CSS = `
.bq{position:fixed;inset:0;z-index:120;background:var(--bg);display:flex;flex-direction:column;
  font-family:inherit;animation:bqIn .18s ease}
@keyframes bqIn{from{opacity:0}to{opacity:1}}
.bq-head{flex-shrink:0;display:flex;align-items:center;gap:11px;padding:11px 18px;
  border-bottom:1px solid var(--border);background:var(--surface)}
.bq-head .mark{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;
  background:var(--primary-soft);color:var(--primary-dark)}
.bq-head .eb{font-size:9.5px;font-weight:700;letter-spacing:.14em;color:var(--text-3);text-transform:uppercase}
.bq-head .nm{font-size:14.5px;font-weight:700;color:var(--text-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-head .x{width:32px;height:32px;border-radius:9px;border:1px solid var(--border);background:var(--surface);
  cursor:pointer;display:grid;place-items:center;color:var(--text-2);flex-shrink:0}
.bq-head .x:hover{background:var(--surface2);color:var(--text-1)}

.bq-body{flex:1;min-height:0;display:flex}
.bq-rail{width:236px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);
  padding:14px 11px;display:flex;flex-direction:column;gap:3px;overflow-y:auto}
.bq-main{flex:1;min-width:0;overflow-y:auto;padding:20px 22px 28px}
.bq-wrap{max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.bq-eb{font-size:9.5px;font-weight:800;letter-spacing:.13em;color:var(--text-3);text-transform:uppercase;padding:0 8px 7px}

/* แถวหัวข้อในแถบซ้าย — ทั้งแถวกดได้ · ค่าที่กรอกแล้วโชว์ตรงขวาเลย ไม่ต้องเปิดเข้าไปดู */
.bq-nav{display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:11px;border:0;width:100%;
  background:none;text-align:left;cursor:pointer;font-family:inherit;transition:background .14s;position:relative}
.bq-nav:hover{background:var(--surface2)}
.bq-nav[data-on="1"]{background:var(--primary-soft)}
.bq-nav[data-on="1"]::before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:3px;
  border-radius:0 3px 3px 0;background:var(--primary)}
.bq-nav .ic{width:24px;height:24px;border-radius:8px;flex:0 0 auto;display:grid;place-items:center;
  background:var(--surface3);color:var(--text-3)}
.bq-nav[data-on="1"] .ic{background:var(--primary);color:#fff}
.bq-nav .tx{flex:1;min-width:0}
.bq-nav .tt{display:block;font-size:12.5px;font-weight:700;color:var(--text-1);line-height:1.3;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-nav[data-on="1"] .tt{color:var(--primary-dark)}
.bq-nav .mt{display:block;font-size:10px;font-weight:600;color:var(--text-3);line-height:1.4;margin-top:1px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-nav .mt.warn{color:#B45309}
.bq-nav .mt.ok{color:var(--primary-dark)}

/* การ์ดเนื้อหา */
.bq-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 20px 20px}
.bq-card>.hd{display:flex;align-items:center;gap:9px;padding-bottom:12px;margin-bottom:14px;
  border-bottom:1px solid var(--border)}
.bq-card>.hd .t{font-size:13.5px;font-weight:700;color:var(--text-1);letter-spacing:-.01em}
.bq-card>.hd .r{margin-left:auto;flex-shrink:0}

/* แถบสรุปล่าง */
.bq-foot{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);
  padding:10px 18px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:0}
.bq-kpis{display:flex;align-items:center;min-width:0}
.bq-gap{flex:1}
.bq-kpi{display:flex;flex-direction:column;gap:2px;padding:0 16px;border-left:1px solid var(--border);min-width:0}
.bq-kpi:first-child{border-left:none;padding-left:0}
.bq-kpi .k{font-size:9.5px;font-weight:700;color:var(--text-3);white-space:nowrap}
.bq-kpi .v{font-size:15px;font-weight:800;color:var(--text-1);letter-spacing:-.3px;white-space:nowrap;
  font-variant-numeric:tabular-nums}
.bq-kpi .v small{font-size:10px;font-weight:700;color:var(--text-3);margin-left:2px}
.bq-kpi .v.hi{color:var(--primary-dark)}
.bq-btn{padding:10px 16px;border-radius:11px;border:1px solid var(--border-strong);background:var(--surface);
  color:var(--text-2);font-weight:700;font-family:inherit;font-size:13px;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.bq-btn:hover{background:var(--surface2)}
.bq-btn.gh{border-color:#1d854b;background:rgba(34,163,91,.08);color:#1d854b}
.bq-btn.pri{border:0;background:var(--primary);color:#fff;padding:10px 24px}
.bq-btn.pri:hover{filter:brightness(1.06)}

/* ตารางสเปคจากคลัง + ตัวเลขที่คำนวณได้ — ช่องที่ยังไม่กรอกในคลังขึ้นสีส้มให้เห็นว่าต้องไปเติม */
.bq-spec{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.bq-spec>div{padding:9px 11px;border-radius:10px;background:var(--surface3);border:1px solid var(--border);min-width:0}
.bq-spec .k{display:block;font-size:10px;font-weight:700;color:var(--text-3);margin-bottom:3px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-spec .v{display:block;font-family:var(--mono);font-size:13.5px;font-weight:800;color:var(--text-1);
  font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bq-spec .v.hi{color:var(--primary-dark)}
.bq-spec>div[data-miss="1"]{background:#FFFBEB;border-color:#FDE68A}
.bq-spec>div[data-miss="1"] .v{color:#B45309}
.bq-spec>div[data-bad="1"]{background:#FEF2F2;border-color:#FBD3D3}
.bq-spec>div[data-bad="1"] .v{color:#DC2626}
/* ปุ่มลิงก์เล็ก ๆ ท้ายป้ายช่องกรอก — กดแล้วกลับไปใช้ค่าอัตโนมัติ */
.bq-auto{border:0;background:none;padding:0;margin-left:auto;cursor:pointer;font-family:inherit;
  font-size:9.5px;font-weight:800;color:var(--primary-dark);text-decoration:underline;white-space:nowrap}
/* ปุ่มลบท้ายแถว — เงียบ ๆ ไว้ก่อน ค่อยเป็นสีแดงตอนเอาเมาส์ไปชี้ จะได้ไม่แย่งสายตากับข้อมูลในแถว */
.bq-x{height:36px;width:100%;background:none;border:1px solid transparent;color:var(--text-3);
  border-radius:9px;cursor:pointer;display:grid;place-items:center;transition:background .12s,color .12s,border-color .12s}
.bq-x:hover{background:#EF44441a;border-color:#EF444433;color:#EF4444}
.bq-note{margin-top:9px;display:flex;align-items:flex-start;gap:7px;padding:9px 12px;border-radius:10px;
  font-size:12px;font-weight:600;line-height:1.5}
.bq-note.warn{background:#FFFBEB;border:1px solid #FDE68A;color:#92400E}
.bq-note.ok{background:rgba(34,163,91,.07);border:1px solid #BBE7CD;color:#1d854b}

@media (max-width:860px){
  .bq-body{flex-direction:column}
  .bq-spec{grid-template-columns:repeat(2,minmax(0,1fr))}
  .bq-rail{width:100%;flex-direction:row;gap:5px;overflow-x:auto;padding:9px 11px;
    border-right:none;border-bottom:1px solid var(--border)}
  .bq-rail>.bq-eb{display:none}
  .bq-nav{width:auto;flex:0 0 auto;min-width:0;padding:7px 11px}
  .bq-nav .mt{display:none}
  .bq-nav[data-on="1"]::before{display:none}
  .bq-main{padding:13px 12px 22px}
  .bq-card{padding:14px 14px 16px;border-radius:14px}
  /* จอแคบ: ตัวเลขสรุปเลื่อนแนวนอนแถวบน · ปุ่มลงมาอยู่แถวล่างเต็มความกว้าง จะได้ไม่ทับกัน */
  .bq-foot{flex-wrap:wrap;gap:8px;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px))}
  .bq-kpis{width:100%;overflow-x:auto;padding-bottom:2px}
  .bq-kpi{padding:0 11px}
  .bq-kpi .v{font-size:14px}
  .bq-gap{display:none}
  .bq-foot .bq-btn{flex:1;justify-content:center;padding:11px 10px;margin:0 !important}
  .bq-foot .bq-btn.pri{flex:1.6}
}
`;

// ช่องแสดงค่าแบบล็อก (อ่านอย่างเดียว) — ค่ามาจากข้อมูลงาน แก้ได้ที่หน้าแก้งานเท่านั้น
function BoqLocked({ value, unit, num }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }} title="ตั้งค่าจากหน้าแก้งาน">
      <Icon name="lock" size={13} color="var(--text-3)" />
      <span style={{ flex: 1, textAlign: "right", fontFamily: num ? "var(--mono)" : "inherit", fontSize: num ? 15 : 13.5, fontWeight: num ? 700 : 600, color: num ? "var(--primary-dark)" : "var(--text-1)" }}>{value}</span>
      {unit && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{unit}</span>}
    </div>
  );
}

/* จำนวนอินเวอร์เตอร์ — ปกติคิดให้อัตโนมัติจาก กำลังแผงรวม ÷ MAX PV ต่อตัว
   พิมพ์ทับได้สำหรับงานที่ต้องแบ่งอินเวอร์เตอร์ตามทิศหลังคา/ตามอาคาร · ล้างช่องหรือกด "อัตโนมัติ" เพื่อกลับไปใช้ค่าคำนวณ */
function BoqInvCount({ value, auto, onChange, style }) {
  const manual = +value > 0;
  const shown = manual ? +value : auto;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <input type="number" min={1} step={1} style={Object.assign({}, style, { flex: 1, minWidth: 0 })}
        value={shown || ""} onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))} />
      <span style={{ fontSize: 11.5, color: "var(--text-3)", flexShrink: 0 }}>ตัว</span>
      {manual
        ? <button type="button" className="bq-auto" onClick={() => onChange(0)}
            title={auto > 0 ? "กลับไปใช้ค่าอัตโนมัติ " + auto + " ตัว" : "กลับไปใช้ค่าอัตโนมัติ"}>อัตโนมัติ{auto > 0 ? " " + auto : ""}</button>
        : <span className="bq-auto" style={{ textDecoration: "none", cursor: "default" }} title="คิดจากกำลังแผงรวม ÷ MAX PV ต่อตัว">อัตโนมัติ</span>}
    </div>
  );
}

/* ── รูปประกอบ "ลักษณะการติดตั้ง" (วสท. แบ่งไว้ 7 กลุ่ม) ──
   วาดเป็น SVG ในโค้ดเลย ไม่ต้องพึ่งไฟล์รูปข้างนอก · ใช้สีตามธีมจึงสลับโหมดมืดได้เอง
   อ่านรูปยังไง: ยิ่งสายอยู่ในที่โล่ง ลมพัดผ่านได้ ระบายความร้อนยิ่งดี พิกัดกระแสยิ่งสูง
   ฝังในฉนวนความร้อน (กลุ่ม 1) แย่ที่สุด → รางบันไดในอากาศ (กลุ่ม 7) ดีที่สุด */
function WireArt({ art, w, h }) {
  const S = "var(--text-3)", A = "var(--primary)", F = "var(--surface3)", BG = "var(--surface)";
  const uid = "wa-" + (art || "x");
  const hatch = "url(#" + uid + "-hatch)", soil = "url(#" + uid + "-soil)";
  // ตัวนำ 1 เส้น: วงนอก = ฉนวน · จุดกลาง = ทองแดง
  const cd = (x, y, r) => <g key={"c" + x + "_" + y}><circle cx={x} cy={y} r={r} fill={BG} stroke={A} strokeWidth="1.6" /><circle cx={x} cy={y} r={r * 0.36} fill={A} /></g>;
  const wall = (x, y, ww, hh) => <g key="w"><rect x={x} y={y} width={ww} height={hh} fill={hatch} stroke={S} strokeWidth="1.3" /></g>;
  const body = {
    // กลุ่ม 1 — ท่ออยู่ในผนัง/ฝ้าที่มีฉนวนความร้อน (เส้นหยักคือฉนวน) ความร้อนออกไม่ได้
    g1: <g>{wall(4, 6, 124, 66)}
      <path d="M4 20 q7-6 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0" fill="none" stroke={S} strokeWidth="1.5" />
      <circle cx="66" cy="47" r="19" fill={BG} stroke={S} strokeWidth="1.7" />
      <circle cx="66" cy="47" r="15.5" fill="none" stroke={S} strokeWidth="1" opacity=".55" />
      {cd(60, 42, 5)}{cd(72, 42, 5)}{cd(66, 53, 5)}</g>,
    // กลุ่ม 2 — ท่อร้อยสายเกาะผนัง/ลอยในอากาศ (เส้นโค้งขวา = อากาศถ่ายเทได้)
    g2: <g>{wall(4, 6, 18, 66)}
      <line x1="22" y1="6" x2="22" y2="72" stroke={S} strokeWidth="1.7" />
      <path d="M22 40h20" stroke={S} strokeWidth="2.4" />
      <circle cx="66" cy="40" r="21" fill={BG} stroke={S} strokeWidth="1.7" />
      <circle cx="66" cy="40" r="17" fill="none" stroke={S} strokeWidth="1" opacity=".55" />
      {cd(59, 35, 5.5)}{cd(74, 35, 5.5)}{cd(66, 47, 5.5)}
      <path d="M98 26q8 4 16 0M98 40q8 4 16 0M98 54q8 4 16 0" fill="none" stroke={S} strokeWidth="1.3" opacity=".5" /></g>,
    // กลุ่ม 3 — สายมีเปลือกนอกยึดเกาะผนัง/เพดานโดยตรง ไม่มีท่อ (ครึ่งวงบนคือคลิปรัดสาย)
    g3: <g>{wall(4, 6, 124, 16)}
      <line x1="4" y1="22" x2="128" y2="22" stroke={S} strokeWidth="1.7" />
      {[34, 66, 98].map((x) => <path key={"k" + x} d={"M" + (x - 13) + " 22v8a13 13 0 0 0 26 0v-8"} fill="none" stroke={S} strokeWidth="1.4" />)}
      {[34, 66, 98].map((x) => <g key={"s" + x}><circle cx={x} cy={38} r="11" fill={BG} stroke={S} strokeWidth="1.5" />{cd(x, 38, 5.5)}</g>)}</g>,
    // กลุ่ม 4 — วางบนลูกถ้วยในอากาศ เว้นระยะห่างกัน ระบายความร้อนได้รอบเส้น
    g4: <g><rect x="4" y="62" width="124" height="10" fill={hatch} stroke={S} strokeWidth="1.3" />
      {[30, 66, 102].map((x) => <g key={"p" + x}>
        <rect x={x - 3} y={44} width="6" height="18" fill={F} stroke={S} strokeWidth="1.3" />
        <ellipse cx={x} cy={42} rx="9" ry="4" fill={F} stroke={S} strokeWidth="1.3" />
        <ellipse cx={x} cy={35} rx="7" ry="3.5" fill={F} stroke={S} strokeWidth="1.3" />
        {cd(x, 25, 6.5)}</g>)}</g>,
    // กลุ่ม 5 — ท่อร้อยสายฝังใต้ดิน (จุด = เนื้อดิน) ดินพาความร้อนออกช้ากว่าอากาศ
    g5: <g><rect x="4" y="20" width="124" height="52" fill={soil} stroke={S} strokeWidth="1.3" />
      <line x1="4" y1="20" x2="128" y2="20" stroke={S} strokeWidth="2" />
      <circle cx="66" cy="47" r="19" fill={BG} stroke={S} strokeWidth="1.7" />
      <circle cx="66" cy="47" r="15.5" fill="none" stroke={S} strokeWidth="1" opacity=".55" />
      {cd(60, 42, 5)}{cd(72, 42, 5)}{cd(66, 53, 5)}</g>,
    // กลุ่ม 6 — ฝังดินโดยตรง ไม่มีท่อ (ต้องเป็นสายที่ฝังดินได้ เช่น NYY)
    g6: <g><rect x="4" y="20" width="124" height="52" fill={soil} stroke={S} strokeWidth="1.3" />
      <line x1="4" y1="20" x2="128" y2="20" stroke={S} strokeWidth="2" />
      {[38, 66, 94].map((x) => <g key={"b" + x}><circle cx={x} cy={48} r="12" fill={BG} stroke={S} strokeWidth="1.5" />{cd(x, 48, 6)}</g>)}</g>,
    /* กลุ่ม 7 — สายวางบนรางเคเบิล เอาแค่ตัวรางเปล่า ๆ (รูปรวมของกลุ่ม)
       รางแต่ละแบบมีรูปของตัวเองอีกที — ดูที่ traySolid / trayVent / ladder / trayCover */
    g7: <g><path d="M12 26v34h108V26" fill="none" stroke={S} strokeWidth="2.2" />
      <line x1="12" y1="60" x2="120" y2="60" stroke={S} strokeWidth="2.4" />
      {[30, 52, 74, 96].map((x) => cd(x, 50, 9))}
      <path d="M28 20v-8M52 20v-8M76 20v-8M100 20v-8" stroke={S} strokeWidth="1.3" opacity=".55" />
      <path d="M25 16l3-4 3 4M49 16l3-4 3 4M73 16l3-4 3 4M97 16l3-4 3 4" fill="none" stroke={S} strokeWidth="1.3" opacity=".55" /></g>,
    /* รางบันได (Ladder) เปิดฝา — พื้นรางเป็นขั้นบันไดเว้นช่อง ลมผ่านได้มากที่สุด พิกัดสูงสุดของกลุ่ม 7
       (มองจากด้านหน้า: ขีดสั้น ๆ ที่พื้นราง = ขั้นบันไดที่เห็นเป็นท่อน ๆ) */
    ladder: <g><path d="M12 24v36h108V24" fill="none" stroke={S} strokeWidth="2.2" />
      {[14, 31, 48, 65, 82, 99, 116].map((x) => <line key={"r" + x} x1={x} y1="59" x2={x + 4} y2="59" stroke={S} strokeWidth="4.5" strokeLinecap="round" />)}
      {[30, 52, 74, 96].map((x) => cd(x, 48, 9))}
      <path d="M28 18v-8M52 18v-8M76 18v-8M100 18v-8" stroke={S} strokeWidth="1.3" opacity=".55" />
      <path d="M25 14l3-4 3 4M49 14l3-4 3 4M73 14l3-4 3 4M97 14l3-4 3 4" fill="none" stroke={S} strokeWidth="1.3" opacity=".55" />
      {/* ลมลอดขึ้นจากใต้รางได้ตามช่องระหว่างขั้นบันได */}
      <path d="M40 74v-6M63 74v-6M86 74v-6" stroke={S} strokeWidth="1.2" opacity=".45" />
      <path d="M37.5 70.5l2.5-3 2.5 3M60.5 70.5l2.5-3 2.5 3M83.5 70.5l2.5-3 2.5 3" fill="none" stroke={S} strokeWidth="1.2" opacity=".45" /></g>,
    // Cable Tray ระบายอากาศ ไม่มีฝา — พื้นรางเจาะรู ลมขึ้นจากใต้รางได้ (ต่างจากบันไดตรงที่พื้นยังเป็นแผ่น)
    trayVent: <g><path d="M12 24v36h108V24" fill="none" stroke={S} strokeWidth="2.2" />
      <line x1="12" y1="60" x2="120" y2="60" stroke={S} strokeWidth="2.4" />
      {[22, 34, 46, 58, 70, 82, 94, 106].map((x) => <circle key={"h" + x} cx={x} cy="60" r="1.9" fill="var(--surface)" stroke={S} strokeWidth="1" />)}
      {[30, 52, 74, 96].map((x) => cd(x, 50, 9))}
      <path d="M28 18v-8M52 18v-8M76 18v-8M100 18v-8" stroke={S} strokeWidth="1.3" opacity=".55" />
      <path d="M25 14l3-4 3 4M49 14l3-4 3 4M73 14l3-4 3 4M97 14l3-4 3 4" fill="none" stroke={S} strokeWidth="1.3" opacity=".55" /></g>,
    // Cable Tray พื้นทึบ ไม่มีฝา — ลมออกได้ทางบนอย่างเดียว พิกัดต่ำกว่าแบบระบายอากาศ
    traySolid: <g><path d="M12 24v36h108V24" fill="none" stroke={S} strokeWidth="2.2" />
      <rect x="12" y="58" width="108" height="4" fill={F} stroke={S} strokeWidth="1.6" />
      {[30, 52, 74, 96].map((x) => cd(x, 49, 9))}
      <path d="M40 18v-8M76 18v-8" stroke={S} strokeWidth="1.3" opacity=".55" />
      <path d="M37 14l3-4 3 4M73 14l3-4 3 4" fill="none" stroke={S} strokeWidth="1.3" opacity=".55" /></g>,
    /* รางเคเบิลปิดฝา (รวมรางเดินสายปิดมีฝา/Wireway) — ฝาปิดทับด้านบน ความร้อนออกไม่ได้
       พื้นรางวาดครบทั้งสามแบบ (ทึบ · เจาะรู · ขั้นบันได) เพราะปิดฝาแล้วคิดเหมือนกันหมด */
    trayCover: <g><rect x="10" y="14" width="112" height="9" rx="2" fill={F} stroke={S} strokeWidth="1.7" />
      {[22, 110].map((x) => <line key={"lk" + x} x1={x} y1="23" x2={x} y2="27" stroke={S} strokeWidth="1.6" />)}
      <path d="M16 25v35h100V25" fill="none" stroke={S} strokeWidth="2.2" />
      <line x1="16" y1="60" x2="116" y2="60" stroke={S} strokeWidth="2.6" />
      {[34, 55, 76, 97].map((x) => cd(x, 50, 9))}
      {/* ความร้อนลอยขึ้นแล้วชนฝา ออกไม่ได้ — พิกัดกระแสจึงต่ำกว่าแบบเปิดฝา */}
      <path d="M45 40v-9M87 40v-9" stroke={S} strokeWidth="1.3" opacity=".5" />
      <path d="M42.5 33.5l2.5-3 2.5 3M84.5 33.5l2.5-3 2.5 3" fill="none" stroke={S} strokeWidth="1.3" opacity=".5" />
      <path d="M38 29h14M80 29h14" stroke={S} strokeWidth="1.6" opacity=".5" /></g>,
  }[art];
  if (!body) return null;
  return (
    <svg viewBox="0 0 132 78" width={w || 132} height={h || 78} style={{ flexShrink: 0, display: "block" }} aria-hidden="true">
      <defs>
        <pattern id={uid + "-hatch"} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke={S} strokeWidth="1.1" opacity=".38" />
        </pattern>
        <pattern id={uid + "-soil"} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.1" fill={S} opacity=".42" />
          <circle cx="7.5" cy="7" r="1.1" fill={S} opacity=".42" />
        </pattern>
      </defs>
      {body}
    </svg>
  );
}

function BOQEditor({ job, onClose, onSave, priceMap, stock }) {
  const bdClose = window.useBackdropClose(onClose);
  const baht = (n) => (Math.round((+n || 0) * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [b, setB] = React.useState(() => {
    const base = job && job.boq ? Object.assign(window.BOQ.blankBOQ(job), job.boq) : window.BOQ.blankBOQ(job);
    // สเปคหลักดึงจากข้อมูลงานเสมอ (ฐานข้อมูลเป็นตัวตั้ง) — แบต/Backup/ออฟติไมเซอร์/จำนวนแผง
    if (job) {
      if (job.panels != null && job.panels !== "") base.panels = job.panels;
      base.batteryKwh = job.battery ? (parseFloat(job.batSize) || 0) : 0;
      base.backup = !!job.backup;
      base.birdnet = !!job.birdnet;   // บ้านติดตาข่ายกันนก → ถอดวัสดุกันนกให้อัตโนมัติ
      base.hwOptimizer = !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี");
      // งานมี Backup → ตั้งระบบสำรองไฟของ Huawei ให้ (เริ่มที่ Backup Box เปลี่ยนเป็น SmartGuard ได้)
      if (job.backup && (!base.hwBackup || base.hwBackup === "none")) base.hwBackup = "backupbox";
      else if (!job.backup) base.hwBackup = "none";
      base.jobType = job.type || "";  // สะท้อน type ปัจจุบันของงานเสมอ
      base.comboType = job.comboType || "ready";   // ตู้ Combiner (สำเร็จ/ประกอบ) สะท้อนงานเสมอ
    }
    // ปรับค่าเริ่มต้นสายไฟตามงาน: เลือก GROUND/LAN ให้ (ถ้ายังว่าง) · ตัด COMBINER-BAT./BACKUP ออกถ้างานไม่มีแบต/Backup
    if (Array.isArray(base.cables)) {
      base.cables = base.cables
        .filter((c) => !((c.name === "COMBINER-BAT." && !(job && job.battery)) || (c.name === "COMBINER-BACKUP" && !(job && job.backup))))
        .map((c) => {
          if (!c.type && c.name === "GROUND") return Object.assign({}, c, { type: "IEC01(THW)1Cx6 SQ.MM. Y/G" });
          if (!c.type && c.name === "LAN") return Object.assign({}, c, { type: "LAN CAT6" });
          return c;
        });
    }
    return base;
  });
  const hasBattery = !!(job && job.battery);
  const hasBackup = !!(job && job.backup);
  const [adv, setAdv] = React.useState(false);
  const set = (k, v) => setB((p) => Object.assign({}, p, { [k]: v }));
  const setSpare = (k, v) => setB((p) => Object.assign({}, p, { sparePct: Object.assign({}, p.sparePct, { [k]: v }) }));

  const setRow = (i, k, v) => setB((p) => { const rows = p.rows.slice(); rows[i] = Object.assign({}, rows[i], { [k]: v }); return Object.assign({}, p, { rows }); });
  const addRow = () => setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: 0, count: 1 }]) }));
  const fillRemaining = (rem) => { if (rem > 0) setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: rem, count: 1 }]) })); };
  const delRow = (i) => setB((p) => Object.assign({}, p, { rows: p.rows.filter((_, j) => j !== i) }));

  const setCab = (i, k, v) => setB((p) => { const cs = p.cables.slice(); cs[i] = Object.assign({}, cs[i], { [k]: v }); return Object.assign({}, p, { cables: cs }); });
  const addCab = () => setB((p) => Object.assign({}, p, { cables: p.cables.concat([{ name: "", type: "", length: "" }]) }));
  const delCab = (i) => setB((p) => Object.assign({}, p, { cables: p.cables.filter((_, j) => j !== i) }));
  /* ล้างเงื่อนไขเฉพาะเส้น — กลับไปใช้ค่าตั้งต้นของงาน (ที่ตั้งไว้ในตารางคำนวณขนาดสายไฟ)
     เก็บเป็น "ไม่มีคีย์" ไม่ใช่ค่าว่าง เพื่อให้แยกออกว่าเส้นนี้ตั้งใจแก้เองหรือแค่ตามค่าตั้งต้น */
  const resetCabCond = (i) => setB((p) => {
    const cs = p.cables.slice(); const x = Object.assign({}, cs[i]);
    delete x.method; delete x.group; delete x.ncond; delete x.core;
    cs[i] = x; return Object.assign({}, p, { cables: cs });
  });
  const [cabOpen, setCabOpen] = React.useState({});   // แถวไหนกางเงื่อนไขเฉพาะเส้นอยู่

  // ── ตารางคำนวณขนาดสายไฟ: ไหลตามวงจร MICRO-MICRO → MICRO-COMBINER → COMBINER(รวม BAT+MICRO) → BACKUP/เมน หรือ → MCB ตู้ลูกค้า ──
  // ins/method/group/ncond = สมมุติฐานของ "สายแนะนำ" ในตารางคำนวณ ตามพิกัด วสท.
  const WIRECALC_DEF = { volt: 0, battKw: 5, strings: 1, backupMainA: 0, ins: "pvc", method: "conduitAir", group: "g1", ncond: "", core: "single" };
  const wcalc = Object.assign({}, WIRECALC_DEF, b.wireCalc || {});
  const WCALC_STR = { ins: 1, method: 1, group: 1, ncond: 1, core: 1 };
  const setWcalc = (k, v) => setB((p) => Object.assign({}, p, { wireCalc: Object.assign({}, WIRECALC_DEF, p.wireCalc || {}, { [k]: WCALC_STR[k] ? v : (+v || 0) }) }));
  /* เปลี่ยนวิธีเดินสาย = เปลี่ยนตารางพิกัด — ถ้ากลุ่มที่ค้างอยู่ใช้กับวิธีใหม่ไม่ได้ ให้ย้ายกลุ่มให้เลย
     ไม่งั้นได้คู่ที่ไม่มีในมาตรฐาน (เช่น รางเคเบิล + กลุ่มที่ 1) แล้วช่อง "สายแนะนำ" ขึ้น "—" โดยไม่รู้สาเหตุ */
  const setMethodPick = (v) => {
    const m = (window.BOQ.WIRE_METHODS || []).find((x) => x.key === v) || {};
    setB((p) => {
      const cur = Object.assign({}, WIRECALC_DEF, p.wireCalc || {});
      const g = m.groups && m.groups.length && m.groups.indexOf(cur.group) < 0 ? m.groups[0] : cur.group;
      return Object.assign({}, p, { wireCalc: Object.assign({}, cur, { method: v, group: g }) });
    });
  };
  const wcPhase = +b.phase === 3 ? 3 : 1;
  const wcVolt = +wcalc.volt || (wcPhase === 3 ? 400 : 230);
  const wcStrings = Math.max(1, Math.round(+wcalc.strings || 1));   // แบ่งกี่ String (ขั้นต่ำ 1)
  const calcIns = wcalc.ins || "pvc";
  // งานเก่าที่บันทึกวิธีที่เลิกใช้แล้วไว้ (เช่น Wireway) ให้เด้งไปวิธีที่ใช้แทนทันที ไม่ปล่อยช่องว่าง
  const calcPick = (window.BOQ.normWireMethod || ((m, g) => ({ method: m, group: g })))(wcalc.method || "conduitAir", wcalc.group || "g1");
  const calcMethod = calcPick.method;
  const calcGroup = calcPick.group;
  const calcNCond = wcalc.ncond ? String(wcalc.ncond) : (wcPhase === 3 ? "3" : "2");   // ว่าง = ตามเฟส
  const calcDerate = +wcalc.derate > 0 ? +wcalc.derate : 1;   // ตัวคูณลดกระแส (หลายวงจรในช่อง/รางเดียวกัน)
  /* แกนย่อยของคอลัมน์ — แต่ละกลุ่มแยกไม่เหมือนกัน (ดู AMP_GROUPS.cores ใน boq.js)
     กลุ่ม 1,2,3,7 = แกนเดียว/หลายแกน · กลุ่ม 4 = แนวตั้ง/แนวราบ · กลุ่ม 5,6 = รวมเป็นคอลัมน์เดียว */
  const coreOpts = (window.BOQ.ampCoresFor || (() => []))(calcGroup);
  /* ค่าที่ผู้ใช้เลือกไว้ อาจไม่มีในกลุ่มที่เพิ่งสลับมา (เช่นเลือก "หลายแกน" ไว้ แล้วย้ายไปกลุ่ม 4 ที่มีแต่แนวตั้ง/แนวราบ)
     ampCoreKey จะเด้งไปตัวที่กลุ่มนั้นมีจริงให้เอง */
  const corePick = wcalc.core || "single";
  const calcCore = (window.BOQ.ampCoreKey || (() => "single"))(calcGroup, corePick, corePick);
  // เลือกขนาดสายให้รับ กระแส×1.25 (โหลดต่อเนื่อง) — ตามพิกัด วสท. (ฉนวน+วิธี+กลุ่ม+จำนวนตัวนำ+แกน) แล้วหักตัวคูณลดกระแส
  const pickWire = (amp) => window.BOQ.pickWireSize((+amp || 0) * 1.25, calcIns, { method: calcMethod, group: calcGroup, ncond: calcNCond, core: calcCore, derate: calcDerate });
  // ตารางพิกัดของวิธีที่เลือกมีจริงไหม / ยืมมาจากวิธีอื่นไหม — ไว้บอกผู้ใช้ตรง ๆ
  const ampSrc = window.BOQ.ampTableFor
    ? window.BOQ.ampTableFor(calcIns, calcMethod, window.BOQ.ampColKey(calcGroup, calcNCond, calcCore))
    : { tbl: {}, borrowed: false };
  const ampSrcTh = (k) => ((window.BOQ.WIRE_METHODS || []).find((m) => m.key === k) || {}).th || k;
  /* รูปประกอบลักษณะการติดตั้ง — เลือกกลุ่มผิดคือคำนวณสายผิดทั้งงาน แต่ชื่อกลุ่มอย่างเดียวจำยาก
     จึงโชว์รูปของกลุ่มที่เลือกไว้ตลอด และกางดูทั้ง 7 กลุ่มเทียบกันได้ */
  const [artOpen, setArtOpen] = React.useState(false);
  const hasAmpTbl = !!(ampSrc.tbl && Object.keys(ampSrc.tbl).length);   // ไม่มีตาราง = ช่อง "สายแนะนำ" จะขึ้น "—"
  const grpMeta = (window.BOQ.AMP_GROUPS || []).find((g) => g.key === calcGroup) || {};
  const mtdMeta = (window.BOQ.WIRE_METHODS || []).find((m) => m.key === calcMethod) || {};
  // กำลังไมโครต่อ 1 ตัว (จากรุ่นที่เลือก: 2:1 = 1250W, 1:1 = 500W) — ใช้คิดสาย MICRO-MICRO
  const microUnit = (window.BOQ.MICRO || []).find((m) => m.ratio === b.microRatio) || (window.BOQ.MICRO || [])[1] || {};
  const microW = parseFloat((String(microUnit.model || "").match(/(\d+(?:\.\d+)?)\s*watt/i) || [])[1]) || 1250;
  const wireCalcRows = React.useMemo(() => {
    const sysKw = +((job && job.kw) || 0);
    const battKw = hasBattery ? (+wcalc.battKw || 0) : 0;
    const combinedKw = sysKw + battKw;
    const div = wcPhase === 3 ? Math.sqrt(3) * wcVolt : wcVolt;   // 3 เฟส: √3 × แรงดันไลน์
    const phaseNote = wcPhase === 3 ? "3 เฟส · √3×" + wcVolt + "V" : "1 เฟส · " + wcVolt + "V";
    const backupA = +wcalc.backupMainA || 0;

    // 1) MICRO-MICRO: ไมโคร 1 ตัว (อุปกรณ์ 1 เฟส 230V) — ไม่หารสตริง
    const microAmp = microW / 230;
    const rows = [
      { kind: "micromicro", label: "MICRO-MICRO", w: microW, ampTotal: microAmp, ampString: microAmp,
        wire: pickWire(microAmp), note: "สายต่อไมโคร · ไมโคร 1 ตัว · 1 เฟส 230V · " + (Math.round(microW / 10) / 100) + " kW", splittable: false },
    ];
    // 2) MICRO-COMBINER: ต่อสตริง (กระแสไมโครรวม ÷ String) — กระแสรวม = ไมโครทุกสตริง
    const mw = sysKw * 1000; const microTotal = div ? mw / div : 0; const microString = microTotal / wcStrings;
    rows.push({ kind: "main", label: "MICRO-COMBINER", w: mw, ampTotal: microTotal, ampString: microString,
      wire: pickWire(microString), note: phaseNote + " · " + sysKw + " kW" + (wcStrings > 1 ? " · แบ่ง " + wcStrings + " สตริง" : ""), splittable: true });
    // 3) COMBINER รวม BAT + MICRO → MCB ตู้ลูกค้า (กรณีไม่มี Backup) / หรือเป็น feed เข้าระบบ Backup
    const cw = combinedKw * 1000; const combAmp = div ? cw / div : 0;
    rows.push({ kind: "mcb", label: hasBackup ? "COMBINER → BACKUP (รวม MICRO+BAT)" : "COMBINER → MCB ตู้ลูกค้า",
      w: cw, ampTotal: combAmp, ampString: combAmp, wire: pickWire(combAmp), battAmp: div ? (battKw * 1000) / div : 0,
      note: "รวม MICRO" + (battKw ? " + BAT " + battKw + " kW" : "") + " · " + phaseNote + " · " + (Math.round(combinedKw * 100) / 100) + " kW", splittable: false });
    // 4) BACKUP → เมนไฟ (MAIN): ใช้ขนาดเมนเบรกเกอร์ที่จะ Backup (กรอกเอง) — เว้นว่างไว้ก่อนได้
    if (hasBackup) {
      rows.push({ kind: "backup", label: "BACKUP → เมนไฟ (MAIN)", w: null, ampTotal: backupA, ampString: backupA,
        wire: backupA ? pickWire(backupA) : "—", needInput: !backupA,
        note: backupA ? "ตามเมนเบรกเกอร์ที่ Backup · " + backupA + " A" : "⚠ ระบุกระแสเมนที่จะ Backup (A) ด้านบน", splittable: false });
    }
    return rows;
  }, [job, microW, wcPhase, wcVolt, wcalc.battKw, wcalc.backupMainA, wcStrings, hasBattery, hasBackup, calcIns, calcMethod, calcGroup, calcNCond]);
  // ── พิกัดกระแสของสายแต่ละเส้น: อ่านชนิด/ขนาด/แกนจากชื่อ + วิธี/กลุ่ม/จำนวนตัวนำ → เทียบพิกัด วสท. ──
  const cableAmp = (name, opts) => window.BOQ.ampacityOf(name, opts);
  // กระแสที่สายต้องรับ (×1.25) ตามจุดเดินสาย — MICRO-MICRO=ไมโคร 1 ตัว · MICRO-COMBINER=ต่อสตริง · COMBINER-BAT=กระแสแบต · COMBINER-BACKUP=ตามเมน · COMBINER-MCB=รวม MICRO+BAT · สายดิน/แลน=ไม่คิดโหลด
  const reqAmpFor = (cabName) => {
    const n = (cabName || "").toUpperCase();
    if (/LAN|CAT|GROUND|กราว|ดิน/.test(n)) return null;
    // ── จุดเดินสายระบบ String/Hybrid ──
    if (/PV-INVERTER/.test(n)) return null;                                  // DC string — คิดในส่วนสาย DC แยก
    const invAcPer = selInv ? (+selInv.outA || 0) : 0;                       // กระแสออก AC ต่ออินเวอร์เตอร์ 1 ตัว
    const invCnt = (result && result.meta && result.meta.invCount) || 1;
    if (/MCB_SOLAR-MDB/.test(n)) return invAcPer ? invAcPer * invCnt * 1.25 : null;   // รวมทุกตัว → ตู้เมน
    if (/INVERTER-MCB_SOLAR/.test(n)) return invAcPer ? invAcPer * 1.25 : null;       // ต่ออินเวอร์เตอร์ 1 ตัว
    const microRow = wireCalcRows.find((r) => r.kind === "micromicro");
    const mainRow = wireCalcRows.find((r) => r.kind === "main") || wireCalcRows[0];
    const mcbRow = wireCalcRows.find((r) => r.kind === "mcb") || mainRow;
    const backupRow = wireCalcRows.find((r) => r.kind === "backup");
    if (/MICRO[\s-]*MICRO/.test(n)) return microRow ? microRow.ampTotal * 1.25 : 0;   // ไมโคร 1 ตัว
    if (/MICRO/.test(n)) return mainRow.ampString * 1.25;                              // MICRO-COMBINER = ต่อสตริง
    if (/BACKUP|สำรอง/.test(n)) return backupRow && backupRow.ampTotal ? backupRow.ampTotal * 1.25 : null;  // ตามเมนที่ Backup
    if (/BAT|แบต/.test(n)) return mcbRow.battAmp ? mcbRow.battAmp * 1.25 : null;        // กระแสแบต
    return mcbRow.ampTotal * 1.25;                                                      // COMBINER → MCB = รวม MICRO+BAT
  };

  // ชื่อจุดเดินสาย: ตัวเลือกตั้งต้น + ที่ผู้ใช้เพิ่มเอง (เก็บใน localStorage ใช้ซ้ำได้)
  const CABLE_PT_KEY = "boq_cable_points_v1";
  const [customPts, setCustomPts] = React.useState(() => { try { return JSON.parse(localStorage.getItem(CABLE_PT_KEY) || "[]"); } catch (e) { return []; } });
  const addCablePt = (name) => {
    const v = (name || "").trim(); if (!v) return;
    setCustomPts((p) => { if (p.indexOf(v) >= 0 || (window.BOQ.CABLE_POINTS || []).indexOf(v) >= 0) return p; const next = p.concat([v]); try { localStorage.setItem(CABLE_PT_KEY, JSON.stringify(next)); } catch (e) {} return next; });
  };
  const cablePtOptions = React.useMemo(() => {
    const used = (b.cables || []).map((c) => c.name).filter(Boolean);
    const all = [...new Set((window.BOQ.CABLE_POINTS || []).concat(customPts).concat(used))];
    return all.map((n) => ({ value: n, label: n }));
  }, [customPts, b.cables]);

  // ── ท่อร้อยสาย (RACE WAY) ──
  const cond = b.conduit || { imc: [], upvc: [], pullbox: [] };
  const setCond = (kind, i, k, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); const a = (c[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); c[kind] = a; return Object.assign({}, p, { conduit: c }); });
  const addCond = (kind, item) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).concat([item]); return Object.assign({}, p, { conduit: c }); });
  const delCond = (kind, i) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { conduit: c }); });
  const setFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.flex = Object.assign({}, c.flex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const setUpFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.upFlex = Object.assign({}, c.upFlex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const SPARE_DEF = { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10 };
  const setCSpare = (k, v) => setB((p) => Object.assign({}, p, { conduitSpare: Object.assign({}, SPARE_DEF, p.conduitSpare, { [k]: v }) }));
  const [condOpen, setCondOpen] = React.useState({});   // ท่อแถวไหนกางตารางตรวจสายอยู่
  const condPools = [["imc", window.BOQ.IMC_SIZES], ["upvc", window.BOQ.UPVC_SIZES]];
  const condLen = Math.round(condPools.reduce((s, [k]) => s + (cond[k] || []).reduce((t, x) => t + (+x.length || 0), 0), 0));
  // ท่อที่กรอกสายไว้แล้วแต่ % เติมเต็มยังเกินเกณฑ์
  const condBad = condPools.reduce((n, [k, sizes]) =>
    n + (cond[k] || []).filter((x) => (x.cables || []).length && !window.BOQ.conduitCheck(x.size, x.cables, sizes).ok).length, 0);
  // ── รางไฟ (WIREWAY / CABLE TRAY) — โครงสร้างข้อมูลเหมือนท่อร้อยสาย: {size, length} ต่อแถว ──
  const TRAY_DEF = { way: [], tray: [], spare: 10, extra: [] };
  const tw = Object.assign({}, TRAY_DEF, b.tray);
  const trayLen = Math.round(((tw.way || []).concat(tw.tray || [])).reduce((s, x) => s + (+x.length || 0), 0));
  /* ตัวคูณลดกระแสที่แย่ที่สุดจากรางที่กรอกสายไว้ — ส่งไปเป็นค่าแนะนำให้ตารางคำนวณขนาดสายไฟ */
  const trayWorst = condPools.reduce((f, [k, sizes]) =>
    (cond[k] || []).reduce((g, x) => ((x.cables || []).length
      ? Math.min(g, window.BOQ.conduitCheck(x.size, x.cables, sizes).derate) : g), f),
    [["way", window.BOQ.WAY_SIZES], ["tray", window.BOQ.TRAY_SIZES]].reduce((f, [k, sizes]) =>
      (tw[k] || []).reduce((g, x) => ((x.cables || []).length
        ? Math.min(g, window.BOQ.trayCheck(x.size, x.cables, k === "tray", sizes).derate) : g), f), 1));
  // นับรางที่กรอกสายไว้แล้วแต่ยังไม่ผ่านเกณฑ์ % เติมเต็ม / วางชั้นเดียว
  const trayBad = [["way", window.BOQ.WAY_SIZES], ["tray", window.BOQ.TRAY_SIZES]].reduce((n, [k, sizes]) =>
    n + (tw[k] || []).filter((x) => (x.cables || []).length && (() => { const c = window.BOQ.trayCheck(x.size, x.cables, k === "tray", sizes); return !(c.ok && c.widthOk); })()).length, 0);
  const setTrayRow = (kind, i, k, v) => setB((p) => { const t = Object.assign({}, TRAY_DEF, p.tray); const a = (t[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); t[kind] = a; return Object.assign({}, p, { tray: t }); });
  const addTrayRow = (kind, item) => setB((p) => { const t = Object.assign({}, TRAY_DEF, p.tray); t[kind] = (t[kind] || []).concat([item]); return Object.assign({}, p, { tray: t }); });
  const delTrayRow = (kind, i) => setB((p) => { const t = Object.assign({}, TRAY_DEF, p.tray); t[kind] = (t[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { tray: t }); });
  const setTrayVal = (k, v) => setB((p) => Object.assign({}, p, { tray: Object.assign({}, TRAY_DEF, p.tray, { [k]: v }) }));
  const [trayOpen, setTrayOpen] = React.useState({});   // แถวไหนกางตารางตรวจสายอยู่

  // ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ──
  const SUP_DEF = { inv: 0, invKind: "floor", mdb: 0, mdbKind: "floor", spare: 10, extra: [] };
  const sup = Object.assign({}, SUP_DEF, b.support);
  const setSup = (k, v) => setB((p) => Object.assign({}, p, { support: Object.assign({}, SUP_DEF, p.support, { [k]: v }) }));

  // ── ค่าแรง / ค่าขออนุญาต — null = ยังไม่เคยแก้ ใช้รายการตั้งต้น (ต้องคัดลอกก่อนแก้ครั้งแรก) ──
  const svcList = (key, preset) => (b[key] == null ? preset.map((x) => Object.assign({}, x, { price: 0 })) : b[key]);
  const setSvc = (key, preset, i, k, v) => setB((p) => {
    const a = (p[key] == null ? preset.map((x) => Object.assign({}, x, { price: 0 })) : p[key]).slice();
    a[i] = Object.assign({}, a[i], { [k]: v });
    return Object.assign({}, p, { [key]: a });
  });
  const addSvc = (key, preset) => setB((p) => {
    const a = (p[key] == null ? preset.map((x) => Object.assign({}, x, { price: 0 })) : p[key]).slice();
    return Object.assign({}, p, { [key]: a.concat([{ name: "", qty: 1, unit: "งาน", price: 0, auto: "" }]) });
  });
  const delSvc = (key, preset, i) => setB((p) => {
    const a = (p[key] == null ? preset.map((x) => Object.assign({}, x, { price: 0 })) : p[key]);
    return Object.assign({}, p, { [key]: a.filter((_, j) => j !== i) });
  });
  const resetSvc = (key) => setB((p) => Object.assign({}, p, { [key]: null }));
  // ค่าแรง: เหมารวม vs แยกรายการ — เก็บข้อมูลทั้งสองแบบไว้ สลับกลับไปมาไม่หาย
  const laborMode = b.laborMode === "lump" ? "lump" : "split";
  const LUMP_DEF = { basis: "w", rate: 0, note: "" };
  const lump = Object.assign({}, LUMP_DEF, b.laborLump);
  const setLump = (k, v) => setB((p) => Object.assign({}, p, { laborLump: Object.assign({}, LUMP_DEF, p.laborLump, { [k]: v }) }));

  // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา
  const STRUCT_DEF = { ladder: [], walkway: [], walkwayThk: 35, guardrail: [], ladderSpare: 5, walkwaySpare: 10, guardrailSpare: 5, ladderExtra: [], walkwayExtra: [], guardrailExtra: [] };
  const st = Object.assign({}, STRUCT_DEF, b.struct);
  const setStruct = (kind, i, k, v) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const a = (s[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); s[kind] = a; return Object.assign({}, p, { struct: s }); });
  const addStruct = (kind, item) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); s[kind] = (s[kind] || []).concat([item]); return Object.assign({}, p, { struct: s }); });
  const delStruct = (kind, i) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); s[kind] = (s[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { struct: s }); });
  const setStructVal = (k, v) => setB((p) => Object.assign({}, p, { struct: Object.assign({}, STRUCT_DEF, p.struct, { [k]: v }) }));
  const addStructExtra = (kind) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; s[key] = (s[key] || []).concat([{ name: "", qty: "", unit: "" }]); return Object.assign({}, p, { struct: s }); });
  const setStructExtra = (kind, i, k, v) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; const a = (s[key] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); s[key] = a; return Object.assign({}, p, { struct: s }); });
  const delStructExtra = (kind, i) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; s[key] = (s[key] || []).filter((_, j) => j !== i); return Object.assign({}, p, { struct: s }); });
  const [advS, setAdvS] = React.useState(false);
  const [advC, setAdvC] = React.useState(false);
  const isHome = !!(job && job.type === "home");  // งานบ้าน = ไม่มีงานโครงสร้างเพิ่มเติม
  // หัวข้อที่กำลังเปิดอยู่ — เลือกจากแถบซ้าย ทีละหัวข้อ (เนื้อหาที่ไม่ได้เลือกไม่ต้องเรนเดอร์ให้หนักเปล่า)
  const [openSec, setOpenSec] = React.useState("info");
  const secProps = (key) => ({ open: openSec === key, onToggle: () => setOpenSec(key) });
  const [advU, setAdvU] = React.useState(false);

  const csp = Object.assign({}, SPARE_DEF, b.conduitSpare);

  const result = window.BOQ.calcBOQ(b);
  const priced = window.BOQ.applyPrices(result, priceMap || {});
  /* จุดรองรับที่ควรเป็น — เฉพาะอินเวอร์เตอร์สตริง/ไฮบริดที่เป็นกล่องแขวนผนัง/ตั้งพื้น
     ไมโครอินเวอร์เตอร์ยึดใต้แผงอยู่แล้ว ไม่ต้องทำโครง (และ invCount ของไมโครเป็น LOT ไม่ใช่จำนวนตัว เช่น 155 แผง 2:1 = 77.5) */
  const supAuto = b.inverterModel ? Math.max(1, Math.round(result.meta.invCount || 1)) : 0;
  const remaining = result.meta.panelCount - result.meta.rowsSum; // >0 ขาด, <0 เกิน, 0 ครบ
  // อินเวอร์เตอร์ String/Hybrid ที่เลือก (Huawei = มี combiner box)
  const selInv = (window.BOQ.INVERTERS || []).find((x) => x.model === b.inverterModel);
  const isHuawei = !!(selInv && selInv.inputs > 0);
  // ── กรองรุ่นอินเวอร์เตอร์ตามแบรนด์ + เฟส ของงาน ──
  const jobBrand = (job && job.brand) || "";
  const jobPhaseNum = String(job && job.phase) === "3" ? 3 : 1;
  const brandInvs = (window.BOQ.INVERTERS || []).filter((x) =>
    (!jobBrand || x.model.toLowerCase().indexOf(jobBrand.toLowerCase()) >= 0) &&
    (!x.phase || x.phase === jobPhaseNum)   // เฉพาะรุ่นที่เฟสตรงกับงาน (รุ่นที่ไม่ระบุเฟส = แสดงทุกเฟส)
  );
  const showMicro = !jobBrand || /atmoce/i.test(jobBrand);   // ไมโคร ATMOCE เป็นของแบรนด์ ATMOCE
  const invOptions = (showMicro ? [{ value: "", label: "ไมโคร ATMOCE (ตามอัตรา)" }] : [])
    .concat(brandInvs.map((x) => ({ value: x.model, label: x.model + (x.kw ? " · " + x.kw + "kW" : "") })));
  // แบรนด์ที่ไม่มีไมโคร (เช่น Huawei) / เปลี่ยนเฟส แล้วรุ่นที่เลือกไม่ตรง → เลือกรุ่นแรกที่ตรงให้
  React.useEffect(() => {
    const inList = brandInvs.some((x) => x.model === b.inverterModel);
    if (!showMicro && !inList && brandInvs.length) set("inverterModel", brandInvs[0].model);
    else if (showMicro && b.inverterModel && !inList) set("inverterModel", "");
  }, [jobBrand, jobPhaseNum]); // eslint-disable-line
  const maxPvTotal = selInv ? (selInv.maxPv || 0) * result.meta.invCount : 0;
  const pvOver = isHuawei && maxPvTotal > 0 && result.meta.kw > maxPvTotal;
  // ช่องรับสตริงต่อตัว = จำนวน MPPT × สตริงต่อ MPPT (แผนสตริงคิดหลังรู้ scfg ด้านล่าง)
  const perMppt = Math.max(1, Math.round(+(selInv && selInv.strPerMppt) || 1));
  const capPerInv = selInv ? Math.max(1, (+selInv.inputs || 1) * perMppt) : 1;

  // ── การต่ออนุกรมแผง (String) + สาย DC PV1-F — เฉพาะอินเวอร์เตอร์ String/Hybrid ──
  const selPanel = window.BOQ.findPanel ? window.BOQ.findPanel(b.panelModel) : null;
  const isStringInv = !!(selInv && (selInv.type === "string" || selInv.type === "hybrid"));
  const scfg = isStringInv && window.BOQ.stringConfig
    ? window.BOQ.stringConfig(selPanel, selInv, { series: (b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : undefined })
    : null;
  /* แผนสตริง — "ลงสตริงละ N แผง แล้วได้กี่สตริง" · ต้องรู้ Voc/ช่วง MPPT ก่อน (scfg.ready) */
  const plan = scfg && scfg.ready && window.BOQ.stringPlan
    ? window.BOQ.stringPlan(result.meta.panelCount, scfg.series, selInv, result.meta.invCount)
    : null;

  /* ── แรงดันตกของสายแต่ละเส้น ──
     ใช้ "กระแสใช้งานจริง" ไม่ใช่ ×1.25 — ตัวคูณ 1.25 มีไว้เลือกพิกัดกระแสของสาย (ความร้อน)
     ส่วนแรงดันตกเกิดที่ภาระจริง · สาย DC คิดที่ Imp ของสตริง เทียบกับแรงดันทำงานของสตริงนั้น */
  const vdropFor = (c) => {
    if (!window.BOQ.calcVdrop || !c) return null;
    const n = (c.name || "").toUpperCase(), type = c.type || "";
    if (/LAN|CAT/i.test(type) || /GROUND|กราว|ดิน/.test(n)) return null;
    const size = window.BOQ.cableSizeNum(type), len = +c.length || 0;
    if (!size || !len) return null;
    const ins = window.BOQ.cableInsClass(type);
    const isDc = /PV1-F|PV CABLE/i.test(type) || /PV-INVERTER/.test(n);
    if (isDc) {
      if (!(scfg && scfg.ready && scfg.stringVop)) return null;
      const imp = +(selPanel && selPanel.imp) || 0;
      if (!imp) return null;
      const r = window.BOQ.calcVdrop({ length: len, amp: imp, size, volts: scfg.stringVop, ins, phase: 1, dc: true });
      return r ? Object.assign(r, { dc: true }) : null;
    }
    const req = reqAmpFor(c.name);
    if (!req) return null;
    /* ไมโคร 1 ตัวเป็นอุปกรณ์ 1 เฟสเสมอ แม้ระบบรวมจะเป็น 3 เฟส */
    const ph = wcPhase === 3 && !/MICRO[\s-]*MICRO/.test(n) ? 3 : 1;
    const volts = ph === 3 ? (+wcVolt || 400) : (wcPhase === 3 ? 230 : (+wcVolt || 230));
    return window.BOQ.calcVdrop({ length: len, amp: req / 1.25, size, volts, ins, phase: ph, dc: false });
  };
  /* รวมเส้นทางไฟ: DC สูงสุด + AC สูงสุด — มาตรฐานคุมทั้งเส้นทางไม่ให้เกิน 5% */
  const vdropSum = React.useMemo(() => {
    let dc = 0, ac = 0, any = false;
    (b.cables || []).forEach((c) => {
      const r = vdropFor(c);
      if (!r) return;
      any = true;
      if (r.dc) dc = Math.max(dc, r.pct); else ac += r.pct;
    });
    const LIM = (window.BOQ.VD_LIMIT || { dc: 2, ac: 3, total: 5 });
    return { any, dc: Math.round(dc * 100) / 100, ac: Math.round(ac * 100) / 100,
      total: Math.round((dc + ac) * 100) / 100, lim: LIM };
  }, [b.cables, scfg, wcPhase, wcVolt, selPanel, wireCalcRows, result]);

  // ── สลับชุดจุดเดินสายอัตโนมัติเมื่อเปลี่ยนระหว่างไมโคร ↔ String/Hybrid ──
  // String/Hybrid → PV-INVERTER / INVERTER-MCB_SOLAR / MCB_SOLAR-MDB · ไมโคร → MICRO-MICRO / MICRO-COMBINER ...
  // คงแถวสายดิน/แลน/จุดที่ผู้ใช้เพิ่มเองไว้ · ครั้งแรกที่เปิด (โหลดของเดิม) จะไม่แตะ
  const prevStringRef = React.useRef(null);
  React.useEffect(() => {
    if (prevStringRef.current === null) { prevStringRef.current = isStringInv; return; }
    if (prevStringRef.current === isStringInv) return;
    prevStringRef.current = isStringInv;
    const SYS = window.BOQ;
    const sysAll = (SYS.MICRO_CABLE_NAMES || []).concat(SYS.STRING_CABLE_POINTS || []);
    const defaults = isStringInv
      ? (SYS.DEFAULT_STRING_CABLES || [])
      : (SYS.DEFAULT_CABLES || []).filter((c) => (SYS.MICRO_CABLE_NAMES || []).indexOf(c.name) >= 0
          && !((c.name === "COMBINER-BAT." && !hasBattery) || (c.name === "COMBINER-BACKUP" && !hasBackup)));
    setB((p) => {
      const keep = (p.cables || []).filter((c) => sysAll.indexOf(c.name) < 0);   // สายดิน/แลน/custom
      return Object.assign({}, p, { cables: defaults.map((d) => Object.assign({}, d)).concat(keep) });
    });
  }, [isStringInv]); // eslint-disable-line

  // ── แถวตารางคำนวณสายสำหรับระบบ String/Hybrid (DC + AC ออกอินเวอร์เตอร์) ──
  const stringCalcRows = React.useMemo(() => {
    if (!isStringInv) return [];
    const invCount = (result && result.meta && result.meta.invCount) || 1;
    const outA = selInv ? (+selInv.outA || 0) : 0;
    const phN = wcPhase === 3 ? "3 เฟส" : "1 เฟส";
    const rows = [];
    // 1) PV-INVERTER (DC) — Isc × 1.25 → สาย PV1-F
    if (scfg && scfg.ready) {
      rows.push({ kind: "pv", label: "PV-INVERTER (DC)", w: Math.round((scfg.series || 1) * (scfg.vRef || 0) * (scfg.isc || 0)),
        ampTotal: scfg.isc, ampString: scfg.isc, wire: scfg.dcWire, splittable: false,
        note: "สาย DC · " + scfg.series + " แผงอนุกรม · " + scfg.stringVop + "V · Isc " + scfg.isc + " A" });
    } else {
      rows.push({ kind: "pv", label: "PV-INVERTER (DC)", w: null, ampTotal: 0, ampString: 0, wire: "—", needInput: true, splittable: false,
        note: "⚠ กรอก Voc/Isc แผง + ช่วง MPPT อินเวอร์เตอร์ (คลัง) เพื่อคำนวณสาย DC" });
    }
    // 2) INVERTER → MCB_SOLAR (AC ต่ออินเวอร์เตอร์ 1 ตัว)
    rows.push({ kind: "invmcb", label: "INVERTER → MCB_SOLAR", w: outA ? Math.round(outA * wcVolt) : null,
      ampTotal: outA, ampString: outA, wire: outA ? pickWire(outA) : "—", needInput: !outA, splittable: false,
      note: outA ? "กระแสออกอินเวอร์เตอร์/ตัว · " + phN + " · " + outA + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง" });
    // 3) MCB_SOLAR → MDB (AC รวมทุกตัว → ตู้เมน)
    const totalA = outA * invCount;
    rows.push({ kind: "mcbmdb", label: "MCB_SOLAR → MDB (ตู้เมน)", w: totalA ? Math.round(totalA * wcVolt) : null,
      ampTotal: totalA, ampString: totalA, wire: totalA ? pickWire(totalA) : "—", needInput: !totalA, splittable: false,
      note: totalA ? "รวม " + invCount + " ตัว · " + phN + " · " + (Math.round(totalA * 10) / 10).toFixed(1) + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง" });
    return rows;
  }, [isStringInv, selInv, scfg, result, wcVolt, wcPhase, calcIns, calcMethod, calcGroup, calcNCond]);

  const calcRows = isStringInv ? stringCalcRows : wireCalcRows;

  // กันพลาด: ถ้าจำนวนแผงในแถวไม่ตรงกับจำนวนแผงรวม ให้ยืนยันก่อน
  const guardRun = (fn) => {
    if (remaining !== 0) {
      const msg = remaining > 0
        ? ("⚠ ยังวางแผงไม่ครบ — ขาดอีก " + remaining + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nปริมาณ Mounting จะไม่ครบ ต้องการดำเนินการต่อหรือไม่?")
        : ("⚠ วางแผงเกินจำนวน " + (-remaining) + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nต้องการดำเนินการต่อหรือไม่?");
      if (!confirm(msg)) return;
    }
    fn();
  };

  const opt = (arr) => arr.map((x) => ({ value: x, label: typeof x === "string" ? x.trim() : x }));

  const GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", "COMBINER BOX": "#4F46E5", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", "LADDER (บันไดลิง)": "#0D9488", "WALKWAY": "#D97706", "GUARD RAIL": "#DB2777", ACCESSORIES: "#EC4899",
    [window.BOQ.G_TRAY]: "#0891B2", [window.BOQ.G_SUPPORT]: "#78716C",
    [window.BOQ.G_LABOR]: "#2563EB", [window.BOQ.G_PERMIT]: "#9333EA" };

  // ── Accessories: เพิ่มของ / ดึงจากราคาวัสดุ + คลังสินค้า ──
  const stockItems = (stock && stock.items) || [];
  const matInfo = React.useMemo(() => {
    const m = {};
    (window.BOQ.catalog() || []).forEach((c) => { m[c.name] = { unit: c.unit }; });
    stockItems.forEach((s) => { m[s.name] = { unit: s.unit || (m[s.name] && m[s.name].unit) || "", code: s.sku }; });
    Object.keys(priceMap || {}).forEach((n) => { m[n] = { unit: (priceMap[n].unit || (m[n] && m[n].unit) || ""), code: priceMap[n].code }; });
    return m;
  }, [priceMap, stockItems.length]);
  // จัดวัสดุเป็นหมวดสำหรับเลือกใน Accessories
  const accCat = React.useMemo(() => {
    const SF = window.SF;
    const g2cat = SF.BOQ_GROUP_TO_CAT || {};
    // หมวด BOQ → key คลัง → ชื่อไทยของหมวดคลัง (ใช้ taxonomy เดียวกับคลังสินค้า ครบทุกหมวด)
    const catTh = (key) => (SF.STOCK_CAT_BY[key] ? SF.STOCK_CAT_BY[key].th : "อื่นๆ");
    const cat = window.BOQ.catalog() || [];
    const catKeys = new Set(cat.map((c) => c.name));
    const byCat = {};
    const add = (c, n) => { if (!n) return; (byCat[c] = byCat[c] || new Set()).add(n); };
    cat.forEach((c) => add(catTh(g2cat[c.group] || "accessory"), c.name));
    Object.keys(priceMap || {}).forEach((n) => { if (!catKeys.has(n)) add(catTh(g2cat[priceMap[n].group] || "accessory"), n); });
    stockItems.forEach((s) => add(catTh(s.cat), s.name));
    const order = (SF.STOCK_CATS || []).map((c) => c.th);
    const cats = Object.keys(byCat).sort((a, z) => { const ia = order.indexOf(a), iz = order.indexOf(z); return (ia < 0 ? 99 : ia) - (iz < 0 ? 99 : iz); });
    const map = {}; cats.forEach((c) => { map[c] = [...byCat[c]].sort(); });
    return { cats, map };
  }, [priceMap, stockItems.length]);

  // ชนิดสายไฟ: ดึงจากคลังสินค้าหมวด "สายไฟ / ไฟฟ้า" (wiring) — ไม่มีของในคลังจึง fallback รายการตั้งต้น
  // จัดหมวดสายไฟ: ใช้หมวดที่ตั้งในคลัง (cableGroup) ก่อน · ไม่มีก็เดาจากชื่อ
  const cableCat = window.BOQ.cableCategory || ((n) => "อื่นๆ");
  const CABLE_CAT_ORDER = window.BOQ.CABLE_GROUPS || ["อื่นๆ"];
  const cableTypeOptions = React.useMemo(() => {
    const wiringStock = stockItems.filter((s) => s.cat === "wiring");
    const groupByName = {};
    wiringStock.forEach((s) => { if (s.name && s.cableGroup) groupByName[s.name] = s.cableGroup; });
    const used = (b.cables || []).map((c) => c.type).filter(Boolean);
    const base = wiringStock.length ? wiringStock.map((s) => s.name) : (window.BOQ.CABLE_TYPES || []);
    return [...new Set(base.concat(used))]
      .map((n) => ({ value: n, label: n, group: groupByName[n] || cableCat(n) }))
      // เรียงตามหมวด แล้วตามชื่อ (ให้รายการหมวดเดียวกันอยู่ติดกัน → หัวข้อหมวดถูกต้อง)
      .sort((a, z) => (CABLE_CAT_ORDER.indexOf(a.group) - CABLE_CAT_ORDER.indexOf(z.group)) || String(a.value).localeCompare(String(z.value), "th", { numeric: true }));
  }, [stockItems, b.cables]);
  // ตัวเลือกพิกัดกระแส วสท.: วิธีเดินสาย / ฉนวน / กลุ่มการติดตั้ง / จำนวนตัวนำมีกระแส
  const methodOptions = (window.BOQ.WIRE_METHODS || []).map((m) => ({ value: m.key, label: m.th, sub: m.sub }));
  const insOptions = (window.BOQ.INS_CLASSES || []).map((c) => ({ value: c.key, label: c.th }));
  // ชื่อกลุ่มสั้น ๆ บนปุ่ม · คำอธิบายไปอยู่บรรทัดที่สองในเมนู (ปุ่มแคบ ชื่อยาวจะถูกตัดหาย)
  const groupOptions = (window.BOQ.AMP_GROUPS || []).map((g) => ({ value: g.key, label: g.th, sub: g.sub }));
  /* กลุ่มการติดตั้งขึ้นกับวิธีเดินสาย — เลือกวิธีก่อน แล้วเหลือเฉพาะกลุ่มที่ใช้กับวิธีนั้นได้จริง
     (เดินในท่อวิธีเดียวใช้ได้ 3 กลุ่ม เพราะ วสท. แยกที่ท่อไปวางตรงไหน · รางเคเบิลมีแต่กลุ่ม 7) */
  const groupOptionsFor = (methodKey) => {
    const m = (window.BOQ.WIRE_METHODS || []).find((x) => x.key === methodKey);
    const allow = m && m.groups && m.groups.length ? m.groups : null;
    return allow ? groupOptions.filter((o) => allow.indexOf(o.value) >= 0) : groupOptions;
  };
  const ncondOptions = (window.BOQ.AMP_NCOND || []).map((n) => ({ value: n.key, label: n.th }));

  // ตัวเลือกวัสดุใน Accessories: แบ่งกลุ่มย่อย (ชิปฟิลเตอร์) เหมือน dropdown สายไฟ · เดาจากชื่อ
  const matSub = window.BOQ.materialSubGroup || (() => "อื่นๆ");
  const MAT_SUB_ORDER = window.BOQ.MATERIAL_SUBGROUPS || ["อื่นๆ"];
  const matItemOptions = (items, cat) => (items || [])
    .map((n) => ({ value: n, label: n, group: matSub(n, cat) }))
    // เรียงตามกลุ่มย่อย แล้วตามชื่อ (ให้รายการกลุ่มเดียวกันอยู่ติดกัน)
    .sort((a, z) => (MAT_SUB_ORDER.indexOf(a.group) - MAT_SUB_ORDER.indexOf(z.group)) || String(a.value).localeCompare(String(z.value), "th", { numeric: true }));

  const accList = b.accessories || [];
  const setAcc = (i, k, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); if (k === "name" && matInfo[v]) a[i].unit = matInfo[v].unit || a[i].unit; return Object.assign({}, p, { accessories: a }); });
  const setAccCat = (i, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { cat: v, name: "" }); return Object.assign({}, p, { accessories: a }); });
  const addAcc = () => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).concat([{ cat: "", name: "", qty: 1, unit: "" }]) }));
  const delAcc = (i) => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).filter((_, j) => j !== i) }));

  /* รายการท่อร้อยสาย — หน้าตาเดียวกับรายการรางไฟ: เลือกขนาด + ความยาวรวมของขนาดนั้น
     กางออกได้เพื่อใส่สายที่จะร้อยในท่อนั้น แล้วตรวจ % เติมเต็ม + ตัวคูณลดกระแส
     (PULL BOX ไม่มีสายร้อยผ่านเป็นเส้น ๆ ให้ตรวจ จึงกรอกแค่จำนวน) */
  const ConduitList = ({ kind, label, sizes, valKey, unitText, hint, check }) => {
    const OD = window.BOQ.CABLE_OD || {};
    const odTypes = Object.keys(OD);
    const setCables = (i, cs) => setCond(kind, i, "cables", cs);
    return (
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: hint ? 3 : 7 }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 7 }}>{hint}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(cond[kind] || []).map((x, i) => {
            const cbs = x.cables || [];
            const chk = check ? window.BOQ.conduitCheck(x.size, cbs, sizes) : null;
            const open = condOpen[kind + i];
            const any = cbs.length > 0;
            const row = (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px 36px", gap: 8, alignItems: "center" }}>
                <Dropdown value={x.size} onChange={(v) => setCond(kind, i, "size", v)} options={opt(sizes)} placeholder="เลือกขนาด" />
                <input type="number" style={numStyle} value={x[valKey]} placeholder={unitText} onChange={(e) => setCond(kind, i, valKey, e.target.value)} />
                <button onClick={() => delCond(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
              </div>
            );
            if (!check) return <div key={i}>{row}</div>;
            return (
              <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 9, background: "var(--surface2)" }}>
                {row}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
                  <button onClick={() => setCondOpen((p) => Object.assign({}, p, { [kind + i]: !open }))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    <Icon name="settings" size={13} color="var(--text-2)" /> สายที่ร้อยในท่อนี้{any ? " (" + cbs.length + ")" : ""}
                    <Icon name="chevronDown" size={13} color="var(--text-2)" style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {any && (
                    <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                      color: chk.ok ? "#16A34A" : "#DC2626" }}>
                      <span>เติมเต็ม {chk.fillPct}% / {chk.limit}%</span>
                      <span style={{ color: "var(--text-3)", fontWeight: 700 }}>ตัวคูณ ×{chk.derate.toFixed(2)}</span>
                      <span>{chk.ok ? "✓" : "✗"}</span>
                    </span>
                  )}
                </div>
                {open && (
                  <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                    {cbs.map((c, j) => (
                      <div key={j} style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 72px 56px 32px" : "minmax(0,1fr) 92px 66px 32px", gap: 7, alignItems: "center" }}>
                        <Dropdown value={c.type} onChange={(v) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { type: v, size: +(Object.keys(OD[v] || {})[0] || 2.5) }) : y))} options={opt(odTypes)} />
                        <Dropdown value={String(c.size)} onChange={(v) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { size: +v }) : y))} options={Object.keys(OD[c.type] || {}).map((s) => ({ value: s, label: s + " mm²" }))} />
                        <input type="number" min={1} style={numStyle} value={c.qty} placeholder="เส้น" onChange={(e) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { qty: e.target.value }) : y))} />
                        <button onClick={() => setCables(i, cbs.filter((_, k) => k !== j))} title="ลบ" style={{ height: 38, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                      </div>
                    ))}
                    <button onClick={() => setCables(i, cbs.concat([{ type: odTypes[0], size: +(Object.keys(OD[odTypes[0]] || {})[0] || 2.5), qty: 1 }]))}
                      style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "6px 10px", fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={12} color="var(--text-2)" /> เพิ่มสาย</button>
                    {any && (
                      <>
                        <div className="bq-spec" style={{ marginTop: 2 }}>
                          <div><span className="k">รูในท่อ</span><span className="v">Ø{chk.dim.w} = {chk.dim.area.toLocaleString()} mm²</span></div>
                          <div><span className="k">พื้นที่สายรวม</span><span className="v">{chk.area.toLocaleString()} mm²</span></div>
                          <div data-bad={chk.ok ? "0" : "1"}><span className="k">เติมเต็ม (เกณฑ์ {chk.limit}%)</span><span className="v hi">{chk.fillPct}%</span></div>
                          <div><span className="k">จำนวนสายในท่อ</span><span className="v">{chk.runs} เส้น</span></div>
                          <div><span className="k">ตัวนำนำกระแส</span><span className="v">{chk.cores} เส้น</span></div>
                          <div><span className="k">ตัวคูณลดกระแส</span><span className="v hi">×{chk.derate.toFixed(2)}</span></div>
                          <div><span className="k">พื้นที่ท่อขั้นต่ำ</span><span className="v">{chk.needArea.toLocaleString()} mm²</span></div>
                          <div data-miss={chk.unknown.length ? "1" : "0"}><span className="k">ไม่มีข้อมูล OD</span><span className="v">{chk.unknown.length ? chk.unknown.length + " ชนิด" : "ครบ"}</span></div>
                        </div>
                        {chk.dim.area === 0 && (
                          <div className="bq-note warn">
                            <Icon name="alert" size={15} color="#F59E0B" />
                            <span>ยังไม่มีขนาดรูในของท่อ "{x.size}" ในระบบ จึงตรวจ % เติมเต็มให้ไม่ได้ — เพิ่มค่ารูในได้ที่ตาราง IMC_CONDUIT / UPVC_CONDUIT ใน boq.js</span>
                          </div>
                        )}
                        {chk.dim.area > 0 && !chk.ok && (
                          <div className="bq-note warn">
                            <Icon name="alert" size={15} color="#F59E0B" />
                            <span>สายกินพื้นที่ {chk.fillPct}% เกินเกณฑ์ {chk.limit}% ({chk.runs === 1 ? "ร้อยสายเส้นเดียว" : chk.runs === 2 ? "ร้อย 2 เส้น" : "ร้อยตั้งแต่ 3 เส้นขึ้นไป"}) — {chk.suggest ? "ขยับเป็น " + chk.suggest : "ต้องใช้ท่อที่มีพื้นที่อย่างน้อย " + chk.needArea.toLocaleString() + " mm² หรือแยกร้อยสองท่อ"}</span>
                          </div>
                        )}
                        {chk.ok && (
                          <div className="bq-note ok">
                            <Icon name="check" size={15} color="#22A35B" />
                            <span>ผ่านเกณฑ์ — เหลือพื้นที่อีก {(chk.limit - chk.fillPct).toFixed(1)}% · อย่าลืมเอาตัวคูณ ×{chk.derate.toFixed(2)} ไปหารพิกัดกระแสของสายในตารางคำนวณขนาดสายไฟ</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => addCond(kind, check ? { size: sizes[0], [valKey]: 0, cables: [] } : { size: sizes[0], [valKey]: 0 })} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> เพิ่ม {label}</button>
        </div>
      </div>
    );
  };

  /* รายการรางไฟ — เลือกขนาด + ความยาวรวมของขนาดนั้น (ข้อต่อ/ขาแขวน/พุก คิดต่อจากความยาวให้เอง)
     กางออกได้เพื่อใส่สายที่จะเดินในรางนั้น แล้วตรวจ % เติมเต็ม + ตัวคูณลดกระแส */
  const TrayList = ({ kind, label, sizes, hint }) => {
    const isTray = kind === "tray";
    const OD = window.BOQ.CABLE_OD || {};
    const odTypes = Object.keys(OD);
    const setCables = (i, cs) => setTrayRow(kind, i, "cables", cs);
    return (
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 7 }}>{hint}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(tw[kind] || []).map((x, i) => {
            const cbs = x.cables || [];
            const chk = window.BOQ.trayCheck(x.size, cbs, isTray, sizes);
            const open = trayOpen[kind + i];
            const any = cbs.length > 0;
            return (
              <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 9, background: "var(--surface2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px 36px", gap: 8, alignItems: "center" }}>
                  <Dropdown value={x.size} onChange={(v) => setTrayRow(kind, i, "size", v)} options={opt(sizes)} placeholder="เลือกขนาด" />
                  <input type="number" style={numStyle} value={x.length} placeholder="ม." onChange={(e) => setTrayRow(kind, i, "length", e.target.value)} />
                  <button onClick={() => delTrayRow(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
                  <button onClick={() => setTrayOpen((p) => Object.assign({}, p, { [kind + i]: !open }))}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    <Icon name="settings" size={13} color="var(--text-2)" /> สายที่เดินในรางนี้{any ? " (" + cbs.length + ")" : ""}
                    <Icon name="chevronDown" size={13} color="var(--text-2)" style={{ transform: open ? "rotate(180deg)" : "none" }} />
                  </button>
                  {any && (
                    <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                      color: chk.ok && chk.widthOk ? "#16A34A" : "#DC2626" }}>
                      <span>เติมเต็ม {chk.fillPct}% / {chk.limit}%</span>
                      <span style={{ color: "var(--text-3)", fontWeight: 700 }}>ตัวคูณ ×{chk.derate.toFixed(2)}</span>
                      <span>{chk.ok && chk.widthOk ? "✓" : "✗"}</span>
                    </span>
                  )}
                </div>
                {open && (
                  <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                    {cbs.map((c, j) => (
                      <div key={j} style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 72px 56px 32px" : "minmax(0,1fr) 92px 66px 32px", gap: 7, alignItems: "center" }}>
                        <Dropdown value={c.type} onChange={(v) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { type: v, size: +(Object.keys(OD[v] || {})[0] || 2.5) }) : y))} options={opt(odTypes)} />
                        <Dropdown value={String(c.size)} onChange={(v) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { size: +v }) : y))} options={Object.keys(OD[c.type] || {}).map((s) => ({ value: s, label: s + " mm²" }))} />
                        <input type="number" min={1} style={numStyle} value={c.qty} placeholder="เส้น" onChange={(e) => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, { qty: e.target.value }) : y))} />
                        <button onClick={() => setCables(i, cbs.filter((_, k) => k !== j))} title="ลบ" style={{ height: 38, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                      </div>
                    ))}
                    <button onClick={() => setCables(i, cbs.concat([{ type: odTypes[0], size: +(Object.keys(OD[odTypes[0]] || {})[0] || 2.5), qty: 1 }]))}
                      style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "6px 10px", fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={12} color="var(--text-2)" /> เพิ่มสาย</button>
                    {any && (
                      <>
                        <div className="bq-spec" style={{ marginTop: 2 }}>
                          <div><span className="k">พื้นที่ราง</span><span className="v">{chk.dim.w}×{chk.dim.h} = {chk.dim.area.toLocaleString()} mm²</span></div>
                          <div><span className="k">พื้นที่สายรวม</span><span className="v">{chk.area.toLocaleString()} mm²</span></div>
                          <div data-bad={chk.ok ? "0" : "1"}><span className="k">เติมเต็ม (เกณฑ์ {chk.limit}%)</span><span className="v hi">{chk.fillPct}%</span></div>
                          <div><span className="k">ตัวนำนำกระแส</span><span className="v">{chk.cores} เส้น</span></div>
                          <div><span className="k">ตัวคูณลดกระแส</span><span className="v hi">×{chk.derate.toFixed(2)}</span></div>
                          {isTray && <div data-bad={chk.widthOk ? "0" : "1"}><span className="k">ผลรวม Ø (วางชั้นเดียว)</span><span className="v">{chk.odSum} / {chk.dim.w} mm</span></div>}
                          <div><span className="k">พื้นที่รางขั้นต่ำ</span><span className="v">{chk.needArea.toLocaleString()} mm²</span></div>
                          <div data-miss={chk.unknown.length ? "1" : "0"}><span className="k">ไม่มีข้อมูล OD</span><span className="v">{chk.unknown.length ? chk.unknown.length + " ชนิด" : "ครบ"}</span></div>
                        </div>
                        {!chk.ok && (
                          <div className="bq-note warn">
                            <Icon name="alert" size={15} color="#F59E0B" />
                            <span>สายกินพื้นที่ {chk.fillPct}% เกินเกณฑ์ {chk.limit}% — {chk.suggest ? "ขยับเป็น " + chk.suggest : "ต้องใช้รางที่มีพื้นที่อย่างน้อย " + chk.needArea.toLocaleString() + " mm² หรือแยกเดินสองราง"}</span>
                          </div>
                        )}
                        {chk.ok && !chk.widthOk && (
                          <div className="bq-note warn">
                            <Icon name="alert" size={15} color="#F59E0B" />
                            <span>ผลรวมเส้นผ่านศูนย์กลาง {chk.odSum} mm กว้างกว่าราง {chk.dim.w} mm — สายจะซ้อนกันหลายชั้น ต้องคิดตัวคูณลดกระแสเพิ่มหรือขยายราง</span>
                          </div>
                        )}
                        {chk.ok && chk.widthOk && (
                          <div className="bq-note ok">
                            <Icon name="check" size={15} color="#22A35B" />
                            <span>ผ่านเกณฑ์ — เหลือพื้นที่อีก {(chk.limit - chk.fillPct).toFixed(1)}% · อย่าลืมเอาตัวคูณ ×{chk.derate.toFixed(2)} ไปหารพิกัดกระแสของสายในตารางคำนวณขนาดสายไฟ</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => addTrayRow(kind, { size: sizes[0], length: 0, cables: [] })} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> เพิ่ม {label}</button>
        </div>
      </div>
    );
  };

  /* ตารางค่าแรง / ค่าขออนุญาต — ปริมาณช่องที่มี auto จะวิ่งตามผลถอดวัสดุเอง แก้ไม่ได้ (แต่ลบทั้งบรรทัดได้) */
  const SvcTable = ({ sKey, preset, qtyLabel, total, perW }) => {
    const rows = svcList(sKey, preset);
    const g = (priced.groups || []).find((x) => x.group === (sKey === "labor" ? window.BOQ.G_LABOR : window.BOQ.G_PERMIT));
    const live = (g && g.items) || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 62px 36px" : "minmax(0,1fr) 84px 62px 96px 36px", gap: 8,
          fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", color: "var(--text-3)", textTransform: "uppercase", padding: "0 2px" }}>
          <span>รายการ</span>{!isMobile && <span style={{ textAlign: "right" }}>{qtyLabel}</span>}
          {!isMobile && <span style={{ textAlign: "right" }}>หน่วย</span>}
          <span style={{ textAlign: "right" }}>ราคา/หน่วย</span><span />
        </div>
        {rows.map((r, i) => {
          const q = live[i] ? live[i].qty : (+r.qty || 0);
          const tot = q * (+r.price || 0);
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 62px 36px" : "minmax(0,1fr) 84px 62px 96px 36px", gap: 8, alignItems: "center" }}>
              <span style={{ minWidth: 0 }}>
                <input value={r.name} onChange={(e) => setSvc(sKey, preset, i, "name", e.target.value)} style={Object.assign({}, inputStyle, { width: "100%" })} placeholder="ชื่อรายการ" />
                {tot > 0 && <span style={{ display: "block", fontSize: 10, color: "var(--text-3)", marginTop: 2, paddingLeft: 2 }}>= ฿{baht(tot)}{result.meta.kw > 0 ? " · ฿" + baht(tot / (result.meta.kw * 1000)) + "/W" : ""}</span>}
              </span>
              {!isMobile && (r.auto
                ? <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }} title="ปริมาณคิดจากผลถอดวัสดุอัตโนมัติ">{(Math.round(q * 100) / 100).toLocaleString()}</span>
                : <input type="number" style={numStyle} value={r.qty != null ? r.qty : ""} onChange={(e) => setSvc(sKey, preset, i, "qty", e.target.value)} />)}
              {!isMobile && <input value={r.unit || ""} onChange={(e) => setSvc(sKey, preset, i, "unit", e.target.value)} style={Object.assign({}, inputStyle, { width: "100%", textAlign: "right" })} />}
              <input type="number" style={numStyle} value={r.price != null ? r.price : ""} placeholder="0" onChange={(e) => setSvc(sKey, preset, i, "price", e.target.value)} />
              <button onClick={() => delSvc(sKey, preset, i)} title="ลบบรรทัด" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
            </div>
          );
        })}
        {total > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 12px", marginTop: 2,
            background: "var(--primary-soft)", borderRadius: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", color: "var(--primary-dark)" }}>รวมทุกบรรทัด</span>
            <span style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 700, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums", color: "var(--primary-dark)" }}>
              ฿{baht(total)}{perW > 0 ? <span style={{ fontSize: 11.5, fontWeight: 700, marginLeft: 6 }}>· ฿{baht(perW)}/W</span> : null}
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => addSvc(sKey, preset)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มบรรทัด</button>
          {b[sKey] != null && <button onClick={() => resetSvc(sKey)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>คืนรายการตั้งต้น</button>}
        </div>
      </div>
    );
  };

  // บล็อกกรอกงานโครงสร้าง (LADDER/WALKWAY/GUARD RAIL) — แต่ละ "จุด/แนว" = 1 แถว
  const StructBlock = ({ kind, label, color, addLabel, cols, blank, extra, spare, onSpare, extraItems, onExtraAdd, onExtraChange, onExtraDel }) => (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--surface2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{label}</span>
        {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {(st[kind] || []).map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: cols.map(() => "1fr").join(" ") + " 36px", gap: 8, alignItems: "center" }}>
            {cols.map((c) => (
              <input key={c.k} type="number" style={numStyle} value={x[c.k] != null ? x[c.k] : ""} placeholder={c.ph}
                onChange={(e) => setStruct(kind, i, c.k, e.target.value)} />
            ))}
            <button onClick={() => delStruct(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => addStruct(kind, Object.assign({}, blank))} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> {addLabel}</button>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)" }}>% เผื่อ</span>
            <input type="number" min={0} max={99} style={Object.assign({}, numStyle, { width: 58 })} value={spare != null ? spare : ""} placeholder="5" onChange={(e) => onSpare(e.target.value)} />
          </span>
        </div>
      </div>
      {(extraItems && extraItems.length > 0) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-3)" }}>วัสดุเพิ่ม (นอกระบบ)</span>
          {extraItems.map((x, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 64px 52px 36px", gap: 6, alignItems: "center" }}>
              <input value={x.name || ""} onChange={(e) => onExtraChange(i, "name", e.target.value)} placeholder="ชื่อวัสดุ" style={inputStyle} />
              <input type="number" value={x.qty || ""} onChange={(e) => onExtraChange(i, "qty", e.target.value)} placeholder="จำนวน" style={numStyle} />
              <input value={x.unit || ""} onChange={(e) => onExtraChange(i, "unit", e.target.value)} placeholder="หน่วย" style={inputStyle} />
              <button onClick={() => onExtraDel(i)} style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onExtraAdd} style={{ marginTop: extraItems && extraItems.length > 0 ? 6 : 10, display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--text-3)", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        <Icon name="plus" size={12} color="var(--text-3)" /> เพิ่มวัสดุนอกระบบ
      </button>
    </div>
  );

  const exportXlsx = () => {
    if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
    const X = window.XLSX;
    const hasPrice = priced.grandTotal > 0;

    // ── จานสี (ธีมเขียว PHITHAN GREEN) ──
    const C = {
      brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF",
      group: "D6EBDF", alt: "F4FAF6", white: "FFFFFF",
      border: "CBD8D0", text: "16241D", sub: "5A6B62",
    };
    const FONT = "Tahoma"; // รองรับภาษาไทยทุกเครื่อง Windows
    const thin = { style: "thin", color: { rgb: C.border } };
    const boxAll = { top: thin, bottom: thin, left: thin, right: thin };

    // ── หัวคอลัมน์ + ความกว้าง ตามว่ามีราคาหรือไม่ ──
    const cols = hasPrice
      ? ["ลำดับ", "รหัส", "รายการวัสดุ", "จำนวน", "หน่วย", "ราคา/หน่วย", "ราคารวม"]
      : ["ลำดับ", "รหัส", "รายการวัสดุ", "จำนวน", "หน่วย"];
    const lastC = cols.length - 1;
    const colW = hasPrice
      ? [{ wch: 7 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 8 }, { wch: 13 }, { wch: 15 }]
      : [{ wch: 7 }, { wch: 17 }, { wch: 54 }, { wch: 10 }, { wch: 10 }];

    const aoa = [];
    const merges = [];
    const meta = [];   // ประเภทของแต่ละแถว (ใช้กำหนดสไตล์)
    const rowsH = [];  // ความสูงแถว (hpt)
    let R = 0;
    const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
    const fullMerge = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

    // หัวเอกสาร
    pushRow(["บัญชีแสดงปริมาณวัสดุ (Bill of Quantities)"], "title", 30); fullMerge(R - 1);
    pushRow(["PHITHAN GREEN · ระบบติดตามงานติดตั้งโซลาร์เซลล์"], "subtitle", 20); fullMerge(R - 1);
    pushRow([], "spacer", 6);

    // ข้อมูลงาน (ป้าย/ค่า — ค่าผสานช่องที่เหลือ)
    const info = [
      ["โครงการ", job ? (job.name || "") : ""],
      ["รหัสงาน", job ? (job.code || "") : ""],
      ["ขนาดระบบ", (result.meta.panelCount || 0) + " แผง   ·   " + (result.meta.kw || 0) + " kW"],
      ["วันที่ออกเอกสาร", window.SF.TODAY || ""],
    ];
    info.forEach((row) => {
      const cells = [row[0]]; for (let i = 1; i <= lastC; i++) cells.push(i === 1 ? row[1] : "");
      pushRow(cells, "info", 19); merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
    });
    pushRow([], "spacer", 8);

    // หัวตาราง
    pushRow(cols, "head", 22);

    // กลุ่ม + รายการ
    let n = 0;
    priced.groups.forEach((g) => {
      n += 1;
      const grow = ["ลำดับที่ " + n, ""]; for (let i = 2; i <= lastC; i++) grow.push(i === 2 ? g.group : "");
      pushRow(grow, "group", 20); merges.push({ s: { r: R - 1, c: 2 }, e: { r: R - 1, c: lastC } });
      g.items.forEach((it, k) => {
        const base = [n + "." + (k + 1), it.code || "", it.name || "", +it.qty || 0, it.unit || ""];
        if (hasPrice) base.push(it.price || 0, it.total || 0);
        pushRow(base, k % 2 === 0 ? "item" : "itemAlt");
      });
    });

    // รวม
    if (hasPrice) {
      pushRow([], "spacer", 6);
      const trow = []; for (let i = 0; i <= lastC; i++) trow.push("");
      trow[2] = "ต้นทุนรวมทั้งสิ้น"; trow[lastC] = priced.grandTotal;
      pushRow(trow, "total", 24);
      merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: lastC - 1 } });
    }

    // ── สร้างชีต + ลงสไตล์ ──
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = colW;
    ws["!rows"] = rowsH;

    const moneyFmt = '#,##0.00';
    const qtyFmt = '#,##0.##';
    const styleCell = (r, c) => {
      const t = meta[r];
      if (t === "spacer") return null;
      const s = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center" } };
      if (t === "title") {
        s.font = { name: FONT, sz: 16, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brand } };
        s.alignment = { horizontal: "center", vertical: "center" };
      } else if (t === "subtitle") {
        s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } };
        s.alignment = { horizontal: "center", vertical: "center" };
      } else if (t === "info") {
        if (c === 0) { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; s.alignment = { horizontal: "right", vertical: "center" }; }
        else { s.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "center" }; }
        s.border = { bottom: thin };
      } else if (t === "head") {
        s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brand } };
        s.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "center" };
        s.border = boxAll;
      } else if (t === "group") {
        s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.brandDk } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.group } };
        s.alignment = { horizontal: c < 2 ? "center" : "left", vertical: "center" };
        s.border = boxAll;
      } else if (t === "item" || t === "itemAlt") {
        if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
        s.border = boxAll;
        if (c === 0) s.alignment = { horizontal: "center", vertical: "center" };
        else if (c === 1) { s.alignment = { horizontal: "center", vertical: "center" }; s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
        else if (c === 2) s.alignment = { horizontal: "left", vertical: "center", wrapText: true };
        else if (c === 3) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = qtyFmt; }
        else if (c === 4) s.alignment = { horizontal: "center", vertical: "center" };
        else if (c === 5 || c === 6) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = moneyFmt; }
      } else if (t === "total") {
        s.font = { name: FONT, sz: 12, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } };
        s.alignment = { horizontal: c === lastC ? "right" : "right", vertical: "center" };
        if (c === lastC) s.numFmt = moneyFmt;
        s.border = boxAll;
      }
      return s;
    };

    const range = X.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = X.utils.encode_cell({ r: r, c: c });
        const s = styleCell(r, c);
        if (!s) continue;
        if (!ws[ref]) ws[ref] = { t: "s", v: "" };  // สร้างช่องว่างให้พื้น/เส้นขอบขึ้น
        ws[ref].s = s;
      }
    }

    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, "BOQ");
    const fn = "BOQ_" + (job ? job.code : "job") + ".xlsx";
    X.writeFile(wb, fn);
  };

  const numStyle = Object.assign({}, inputStyle, { textAlign: "right" });
  // ดรอปดาวน์เงื่อนไขใต้สายแต่ละเส้น — เป็นข้อมูลรอง จึงเล็กกว่าแถวหลักหนึ่งระดับ
  const cabSelStyle = { fontSize: 12, padding: "6px 9px", borderRadius: 9, background: "var(--surface)" };
  // คอลัมน์ของรายการสายไฟ — ใช้ทั้งหัวตารางและทุกแถว จะได้ตรงกันเสมอ
  const CAB_COLS = "minmax(150px,1fr) minmax(0,1.35fr) 88px 34px";
  const cabLenSum = Math.round((b.cables || []).reduce((s, c) => s + (+c.length || 0), 0));

  /* ── สารบัญด้านซ้าย ── ข้อความบรรทัดล่างคือ "สถานะย่อ" ของหัวข้อนั้น เห็นได้โดยไม่ต้องเปิดเข้าไป */
  const wireDone = (b.cables || []).filter((c) => c.type && +c.length > 0).length;
  const navSecs = [
    { key: "info", icon: "sun", title: "ข้อมูลระบบ",
      meta: b.panels + " แผง · " + result.meta.kw + " kW · " + (String(b.phase) === "3" ? "3 เฟส" : "1 เฟส") },
    isHuawei ? { key: "hybrid", icon: "bolt", title: "ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid"),
      meta: selInv.model } : null,
    isStringInv && scfg ? { key: "dc", icon: "bolt", title: "สาย DC / การต่ออนุกรม",
      meta: scfg.ready ? scfg.series + " แผงอนุกรม" + (plan ? " · " + plan.strings + " สตริง" : "") + " · " + scfg.dcWire : "ยังกรอกสเปคไม่ครบ",
      tone: !scfg.ready ? "warn" : (plan && plan.over ? "warn" : "ok") } : null,
    { key: "layout", icon: "grid", title: "การจัดวางแผง",
      meta: "วางแล้ว " + result.meta.rowsSum + " / " + result.meta.panelCount + " แผง", tone: remaining === 0 ? "ok" : "warn" },
    { key: "wire", icon: "power", title: "สายไฟ",
      meta: wireDone ? wireDone + " เส้นที่ระบุครบ" + (vdropSum.any ? " · แรงดันตก " + vdropSum.total + "%" : "") : "ยังไม่ได้กรอกระยะสาย",
      tone: !wireDone ? "" : (vdropSum.total > vdropSum.lim.total ? "warn" : "ok") },
    { key: "raceway", icon: "grid", title: "ท่อร้อยสาย",
      meta: condLen > 0 ? "รวม " + condLen + " ม." + (condBad > 0 ? " · " + condBad + " ท่อสายแน่นเกิน" : "") : "ยังไม่ได้กรอก",
      tone: condLen > 0 ? (condBad > 0 ? "warn" : "ok") : "" },
    { key: "tray", icon: "grid", title: "รางไฟ (Wireway / Tray)",
      meta: trayLen > 0 ? "รวม " + trayLen + " ม." + (trayBad > 0 ? " · " + trayBad + " รางสายแน่นเกิน" : "") : "ยังไม่ได้กรอก",
      tone: trayLen > 0 ? (trayBad > 0 ? "warn" : "ok") : "" },
    { key: "support", icon: "box", title: "โครงสร้างรองรับอุปกรณ์",
      meta: sup.inv + sup.mdb > 0 ? "อินเวอร์เตอร์ " + sup.inv + " · ตู้ " + sup.mdb : "ยังไม่ได้ถอด", tone: sup.inv + sup.mdb > 0 ? "ok" : "" },
    !isHome ? { key: "struct", icon: "box", title: "งานเพิ่มเติม — โครงสร้าง", meta: "บันได · ทางเดิน · ราวกันตก" } : null,
    { key: "acc", icon: "box", title: "Accessories", meta: (accList || []).length ? accList.length + " รายการ" : "ยังไม่เพิ่ม" },
    { key: "labor", icon: "power", title: "ค่าแรงติดตั้ง",
      meta: (laborMode === "lump" ? "เหมารวม · " : "แยกรายการ · ")
        + (priced.laborTotal > 0 ? "฿" + baht(priced.laborTotal) + " · ฿" + baht(priced.laborPerW) + "/W" : "ยังไม่ได้ตั้งเรต"),
      tone: priced.laborTotal > 0 ? "ok" : "warn" },
    { key: "permit", icon: "box", title: "ค่าขออนุญาต & เอกสาร",
      meta: priced.permitTotal > 0 ? "฿" + baht(priced.permitTotal) : "ยังไม่ได้กรอกค่าธรรมเนียม",
      tone: priced.permitTotal > 0 ? "ok" : "warn" },
    { key: "removable", icon: "box", title: "รายการวัสดุที่ถอดได้",
      meta: priced.grandTotal > 0 ? "รวม ฿" + baht(priced.grandTotal) : "ยังไม่มีราคา", tone: priced.grandTotal > 0 ? "ok" : "" },
  ].filter(Boolean);
  const itemCount = priced.groups.reduce((a, g) => a + g.items.length, 0);

  return (
    <div className="bq">
      <style>{BQ_CSS}</style>
      {/* header */}
      <div className="bq-head">
        <span className="mark"><Icon name="box" size={16} color="currentColor" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eb">ถอดวัสดุ BOQ{job && job.code ? " · " + job.code : ""}</div>
          <div className="nm">{job ? job.name : "งาน"}</div>
        </div>
        <button className="x" onClick={onClose} title="ปิด"><Icon name="x" size={16} /></button>
      </div>

      <div className="bq-body">
        {/* สารบัญ */}
        <div className="bq-rail">
          <span className="bq-eb">หัวข้อ</span>
          {navSecs.map((s) => (
            <button key={s.key} className="bq-nav" data-on={openSec === s.key ? "1" : "0"} onClick={() => setOpenSec(s.key)}>
              <span className="ic"><Icon name={s.icon} size={13} color="currentColor" /></span>
              <span className="tx">
                <span className="tt">{s.title}</span>
                <span className={"mt " + (s.tone || "")}>{s.meta}</span>
              </span>
            </button>
          ))}
        </div>

        {/* เนื้อหาของหัวข้อที่เลือก */}
        <div className="bq-main">
          <div className="bq-wrap">
          {/* ── ข้อมูลระบบ ── */}
          <BoqSection title="ข้อมูลระบบ" icon="sun" {...secProps("info")}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))", gap: 12 }}>
              <Field label="จำนวนแผง"><BoqLocked value={b.panels} unit="แผง" num /></Field>
              <Field label="ขนาดติดตั้ง (kW)">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.kw.toLocaleString()}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>kW</span>
                </div>
              </Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ระบบไฟฟ้า (ตามงาน)">
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <Icon name="lock" size={13} color="var(--text-3)" />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{String(b.phase) === "3" ? "3 เฟส" : "1 เฟส"}</span>
                </div>
              </Field></div>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label={"อินเวอร์เตอร์" + (jobBrand ? " · " + jobBrand : "")}><Dropdown value={b.inverterModel || ""} onChange={(v) => set("inverterModel", v)} options={invOptions} /></Field></div>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>{!b.inverterModel
                ? <Field label="อัตราไมโคร"><Dropdown value={b.microRatio} onChange={(v) => set("microRatio", v)} options={[{ value: "1:1", label: "1:1 (1 แผง/ตัว)" }, { value: "2:1", label: "2:1 (2 แผง/ตัว)" }]} /></Field>
                : <Field label="จำนวนอินเวอร์เตอร์ (แก้ไขได้)"><BoqInvCount value={b.invCount} auto={result.meta.invAuto} onChange={(v) => set("invCount", v)} style={numStyle} /></Field>}</div>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="รุ่นแผง"><Dropdown value={b.panelModel} onChange={(v) => set("panelModel", v)} options={opt(window.BOQ.PANELS.map((p) => p.model))} /></Field></div>
              {hasBattery && <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="แบตเตอรี่ (kWh)"><BoqLocked value={b.batteryKwh} unit="kWh" num /></Field></div>}
              {hasBackup && <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ระบบ Backup"><BoqLocked value={b.backup ? "ติดตั้ง" : "ไม่ติดตั้ง"} /></Field></div>}
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ประเภทหลังคา"><Dropdown value={b.roof} onChange={(v) => set("roof", v)} options={opt(window.BOQ.ROOF_OPTIONS)} /></Field></div>
            </div>
          </BoqSection>

          {/* ── ระบบอินเวอร์เตอร์ Hybrid/On-grid (Huawei) ── */}
          {isHuawei && (
            <BoqSection title={"ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid") + " (" + selInv.model + ")"} icon="bolt" {...secProps("hybrid")}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))", gap: 12 }}>
                <Field label="จำนวนอินเวอร์เตอร์ (แก้ไขได้)">
                  <BoqInvCount value={b.invCount} auto={result.meta.invAuto} onChange={(v) => set("invCount", v)} style={numStyle} />
                </Field>
                <Field label={"String ต่อตัว (รับได้ " + capPerInv + ")"}>
                  <input type="number" style={numStyle} value={b.strings || (plan ? plan.perInv : selInv.inputs)} min={1} max={capPerInv}
                    onChange={(e) => set("strings", Math.min(Math.max(parseInt(e.target.value) || 0, 0), capPerInv))} />
                </Field>
                <Field label="ระบบสำรองไฟ">
                  <Dropdown value={b.hwBackup || "none"} onChange={(v) => set("hwBackup", v)} options={[
                    { value: "none", label: "ไม่ติดตั้ง" },
                    { value: "smartguard", label: "SmartGuard" },
                    { value: "backupbox", label: "Backup Box" },
                  ]} />
                </Field>
                <Field label="Optimizer (1:1 ต่อแผง)"><Dropdown value={!!b.hwOptimizer} onChange={(v) => set("hwOptimizer", v)} options={[{ value: false, label: "ไม่ใช้" }, { value: true, label: "ใช้" }]} /></Field>
                <Field label="ตู้ไฟเพิ่ม (case by case)"><Dropdown value={!!b.hwExtraPanel} onChange={(v) => set("hwExtraPanel", v)} options={[{ value: false, label: "ไม่มี" }, { value: true, label: "มี" }]} /></Field>
              </div>
              {pvOver && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                  <Icon name="alert" size={15} color="#EF4444" /> กำลังแผง {result.meta.kw} kW เกิน MAX PV รวม {maxPvTotal} kW ({selInv.invCount || result.meta.invCount} ตัว × {selInv.maxPv} kW) — เพิ่มจำนวนอินเวอร์เตอร์หรือลดแผง
                </div>
              )}
              {selInv.unitFixed && (
                <div className="bq-note warn">
                  <Icon name="alert" size={15} color="#F59E0B" />
                  <span>คลังกรอก MAX PV / kW ของรุ่นนี้เป็น "วัตต์" ระบบแปลงกลับเป็นกิโลวัตต์ให้ชั่วคราวแล้ว — ควรไปแก้ที่หน้าคลัง › สเปคอินเวอร์เตอร์ ให้เป็น kW จริง ๆ</span>
                </div>
              )}

              {/* สเปคจากคลัง — ตัวเลขทุกตัวที่ใช้คิด BOQ อยู่ตรงนี้หมด ช่องส้ม = ยังไม่กรอกในคลัง */}
              <div style={{ marginTop: 16, marginBottom: 8, fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
                สเปคจากคลังสินค้า · {selInv.model}
              </div>
              <div className="bq-spec">
                {[
                  { k: "กำลังต่อตัว", v: selInv.kw ? selInv.kw + " kW" : "—", miss: !selInv.kw },
                  { k: "MAX PV ต่อตัว", v: selInv.maxPv ? selInv.maxPv + " kWp" : "ไม่ระบุ (ใช้ kW แทน)", miss: !selInv.maxPv },
                  { k: "เฟส", v: selInv.phase ? selInv.phase + " เฟส" : "—", miss: !selInv.phase, bad: !!selInv.phase && selInv.phase !== (String(b.phase) === "3" ? 3 : 1) },
                  { k: "กระแสออก (AC)", v: selInv.outA ? selInv.outA + " A" : "—", miss: !selInv.outA },
                  { k: "จำนวน MPPT", v: selInv.inputs ? selInv.inputs + " ช่อง" : "—", miss: !selInv.inputs },
                  { k: "สตริงต่อ MPPT", v: selInv.strPerMppt ? selInv.strPerMppt : "ไม่ระบุ (คิด 1)", miss: !selInv.strPerMppt },
                  { k: "รับสตริงได้/ตัว", v: capPerInv + " สตริง", hi: true },
                  { k: "ช่วง MPPT", v: selInv.mpptVmin && selInv.mpptVmax ? selInv.mpptVmin + "–" + selInv.mpptVmax + " V" : "—", miss: !(selInv.mpptVmin && selInv.mpptVmax) },
                  { k: "Vdc สูงสุด", v: selInv.maxVdc ? selInv.maxVdc + " V" : "—", miss: !selInv.maxVdc },
                  { k: "กระแส input/สตริง", v: selInv.maxInA ? selInv.maxInA + " A" : "—", miss: !selInv.maxInA },
                  { k: "กระแสสูงสุด/MPPT", v: selInv.maxMpptA ? selInv.maxMpptA + " A" : "—", miss: !selInv.maxMpptA },
                  { k: "MAX PV รวมทั้งงาน", v: maxPvTotal ? maxPvTotal + " kWp" : "—", hi: true, bad: pvOver },
                ].map((c, i) => (
                  <div key={i} data-miss={c.miss ? "1" : "0"} data-bad={c.bad ? "1" : "0"}>
                    <span className="k">{c.k}</span><span className={"v " + (c.hi && !c.bad ? "hi" : "")}>{c.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                * จำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) พิมพ์ทับได้ · Combiner Box + DC (Fuse/Holder/MCB/MC4) คิดตามจำนวน String · RCBO/SPD/Smart Meter/Backup เลือกตามเฟส ({selInv.phase === 3 ? "3" : "1"} เฟส) · RCBO ขนาดจากกระแสออก × 1.25
              </div>
            </BoqSection>
          )}

          {/* ── สาย DC / การต่ออนุกรม String (PV1-F) — เฉพาะอินเวอร์เตอร์ String/Hybrid ── */}
          {isStringInv && scfg && (
            <BoqSection title="สาย DC / การต่ออนุกรม String (PV1-F)" icon="bolt" {...secProps("dc")}>
              {!scfg.ready ? (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 13px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "#92400E" }}>
                  <Icon name="alert" size={15} color="#F59E0B" /> {scfg.warns.join(" · ")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>แผง · {b.panelModel}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>Voc {scfg.voc} V · Isc {scfg.isc} A{scfg.vmp ? " · Vmp " + scfg.vmp + " V" : ""}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3 }}>ช่วงทำงาน MPPT · {selInv.model}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{scfg.vmin}–{scfg.vmax} Vdc{scfg.maxVdc ? " · สูงสุด " + scfg.maxVdc + " V" : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 12, alignItems: "center" }}>
                    <Field label={"แผงต่ออนุกรม/สตริง" + (scfg.maxSeries >= scfg.minSeries ? " (แนะนำ " + scfg.minSeries + "–" + scfg.maxSeries + ")" : "")}>
                      <input type="number" style={Object.assign({}, numStyle, { width: 130 })} min={1}
                        value={(b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : scfg.recSeries}
                        onChange={(e) => set("dcSeries", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))} />
                    </Field>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                      ช่วงแนะนำ = แรงดันทำงานรวมอยู่ในช่วง MPPT และ Voc รวมไม่เกินแรงดันระบบสูงสุด
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(4, 1fr)", gap: 10 }}>
                    {[
                      { l: "แรงดันทำงานรวม", v: scfg.stringVop + " V", ok: scfg.inRange },
                      { l: "Voc รวม (เปิดวงจร)", v: scfg.stringVoc + " V", ok: !scfg.overMaxVdc },
                      { l: "กระแส DC (Isc×1.25)", v: scfg.dcAmp + " A", ok: null },
                      { l: "ขนาดสาย DC PV1-F", v: scfg.dcWire, ok: null, hi: true },
                    ].map((c, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface3)", border: "1px solid " + (c.ok === false ? "#FBD3D3" : "var(--border)") }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3 }}>{c.l}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: c.hi ? "var(--primary-dark)" : (c.ok === false ? "#DC2626" : "var(--text-1)") }}>{c.v}{c.ok === true ? " ✓" : c.ok === false ? " ✗" : ""}</div>
                      </div>
                    ))}
                  </div>
                  {/* ── แผนสตริง — ลงสตริงละกี่แผง แล้วได้กี่สตริง ต่อเข้าอินเวอร์เตอร์พอไหม ── */}
                  {plan && (
                    <div>
                      <div style={{ marginBottom: 8, fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
                        แผนสตริง · {plan.panels} แผง ÷ {plan.series} แผง/สตริง
                      </div>
                      <div className="bq-spec">
                        <div><span className="k">จำนวนสตริงรวม</span><span className="v hi">{plan.strings} สตริง</span></div>
                        <div><span className="k">สตริงที่แผงเต็ม</span><span className="v">{plan.full} × {plan.series} แผง</span></div>
                        <div data-miss={plan.uneven ? "1" : "0"}><span className="k">สตริงเศษ</span><span className="v">{plan.rest > 0 ? "1 × " + plan.rest + " แผง" : "ไม่มี"}</span></div>
                        <div><span className="k">สตริงต่ออินเวอร์เตอร์</span><span className="v">{plan.perInv} / {plan.capPerInv}</span></div>
                        <div><span className="k">อินเวอร์เตอร์</span><span className="v">{plan.invCount} ตัว</span></div>
                        <div><span className="k">ช่องรับสตริงรวม</span><span className="v">{plan.cap} ช่อง</span></div>
                        <div data-bad={plan.over ? "1" : "0"}><span className="k">{plan.over ? "เกินช่องรับ" : "ช่องที่ยังว่าง"}</span><span className="v">{plan.over ? plan.strings - plan.cap : plan.spare} สตริง</span></div>
                        <div><span className="k">กระแส DC รวม/ตัว</span><span className="v">{Math.round(plan.perInv * scfg.dcAmp * 10) / 10} A</span></div>
                      </div>
                      {plan.over ? (
                        <div className="bq-note warn">
                          <Icon name="alert" size={15} color="#F59E0B" />
                          <span>สตริง {plan.strings} เส้น มากกว่าช่องรับรวม {plan.cap} ช่อง ({plan.invCount} ตัว × {plan.capPerInv}) — เพิ่มจำนวนอินเวอร์เตอร์ เพิ่มแผงต่อสตริง หรือใส่ Combiner รวมสตริงก่อนเข้าเครื่อง</span>
                        </div>
                      ) : plan.uneven ? (
                        <div className="bq-note warn">
                          <Icon name="alert" size={15} color="#F59E0B" />
                          <span>สตริงสุดท้ายมีแค่ {plan.rest} แผง — แรงดัน {Math.round(plan.rest * scfg.vRef * 10) / 10} V {plan.rest * scfg.vRef < scfg.vmin ? "ต่ำกว่าช่วง MPPT " + scfg.vmin + " V เครื่องจะไม่ดึงกำลังจากสตริงนี้" : "ต่ำกว่าสตริงอื่น ควรแยกเข้า MPPT คนละช่อง"}</span>
                        </div>
                      ) : (
                        <div className="bq-note ok">
                          <Icon name="check" size={15} color="#22A35B" />
                          <span>แบ่งลงตัว {plan.strings} สตริง × {plan.series} แผง · เหลือช่องว่างอีก {plan.spare} ช่อง</span>
                        </div>
                      )}
                    </div>
                  )}
                  {scfg.warns.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {scfg.warns.map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#B91C1C" }}>
                          <Icon name="alert" size={14} color="#EF4444" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                    * แรงดันทำงานคิดจาก {scfg.vmp ? "Vmp" : "Voc"} × จำนวนแผงต่ออนุกรม · สาย DC เลือกจาก Isc × 1.25 (PV1-F ทองแดง) · สายคู่ แดง(+)/ดำ(−) ต่อสตริง
                  </div>
                </div>
              )}
            </BoqSection>
          )}

          {/* ── การจัดวางแผง ── */}
          <BoqSection title="การจัดวางแผง (แถว)" icon="grid" {...secProps("layout")}
            right={<span style={{ fontSize: 11.5, fontWeight: 700, color: remaining === 0 ? "var(--primary-dark)" : "#EF4444" }}>
              วางแล้ว {result.meta.rowsSum} / {result.meta.panelCount} แผง
            </span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                  <Field label={i === 0 ? "แผง/แถว" : ""}><input type="number" style={numStyle} value={r.panels} onChange={(e) => setRow(i, "panels", e.target.value)} /></Field>
                  <Field label={i === 0 ? "จำนวนแถว" : ""}><input type="number" min="0" style={numStyle} value={r.count} onChange={(e) => setRow(i, "count", e.target.value)} /></Field>
                  <button onClick={() => delRow(i)} title="ลบแถว" style={{ height: 40, marginTop: i === 0 ? 18 : 0, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
                </div>
              ))}
              <button onClick={addRow} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มแถว</button>
            </div>

            {/* สถานะวางแผงให้ครบ — กันพลาด */}
            {remaining === 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "var(--primary-soft)", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "var(--primary-dark)" }}>
                <Icon name="check" size={15} color="var(--primary-dark)" sw={2.6} /> วางแผงครบตามจำนวนแล้ว ({result.meta.panelCount} แผง)
              </div>
            ) : remaining > 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                <Icon name="alert" size={15} color="#EF4444" /> ยังขาดอีก {remaining} แผง
                <button onClick={() => fillRemaining(remaining)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={13} color="#fff" /> เพิ่มแถว {remaining} แผง
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF9EC", border: "1px solid #FCE4B6", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                <Icon name="alert" size={15} color="#F59E0B" /> วางเกินจำนวนแผง {-remaining} แผง — ตรวจสอบจำนวนแผง/แถว
              </div>
            )}

            <button onClick={() => setAdv((v) => !v)} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าขั้นสูง (ราง / ระยะเผื่อ) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: adv ? "rotate(180deg)" : "none" }} />
            </button>
            {adv && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(4, minmax(0,1fr))", gap: 10 }}>
                <Field label="ขนาดราง"><Dropdown value={b.railSize} onChange={(v) => set("railSize", v)} options={[{ value: 4.2, label: "4.2 ม." }, { value: 4.8, label: "4.8 ม." }]} /></Field>
                <Field label="เผื่อระหว่างแผง (ม.)"><input type="number" style={numStyle} value={b.gap} onChange={(e) => set("gap", e.target.value)} /></Field>
                <Field label="เผื่อหัวท้าย (ม.)"><input type="number" style={numStyle} value={b.endSpare} onChange={(e) => set("endSpare", e.target.value)} /></Field>
                <Field label="L-FEET/ราง"><input type="number" style={numStyle} value={b.lfeetPerRail} onChange={(e) => set("lfeetPerRail", e.target.value)} /></Field>
                <Field label="% เผื่อ RAIL"><input type="number" style={numStyle} value={b.sparePct.rail} onChange={(e) => setSpare("rail", e.target.value)} /></Field>
                <Field label="% เผื่อ JOINER"><input type="number" style={numStyle} value={b.sparePct.joiner} onChange={(e) => setSpare("joiner", e.target.value)} /></Field>
                <Field label="% เผื่อ MID"><input type="number" style={numStyle} value={b.sparePct.midClamp} onChange={(e) => setSpare("midClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ END"><input type="number" style={numStyle} value={b.sparePct.endClamp} onChange={(e) => setSpare("endClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ L-FEET"><input type="number" style={numStyle} value={b.sparePct.lfeet} onChange={(e) => setSpare("lfeet", e.target.value)} /></Field>
                <Field label="% เผื่อ GROUND LUG"><input type="number" style={numStyle} value={b.sparePct.ground} onChange={(e) => setSpare("ground", e.target.value)} /></Field>
              </div>
            )}
          </BoqSection>

          {/* ── สายไฟ ── */}
          <BoqSection title="สายไฟ" icon="power" {...secProps("wire")}
            right={cabLenSum > 0 ? <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary-dark)" }}>รวม {cabLenSum} ม.</span> : null}>
            {/* หัวคอลัมน์ — เดิมไม่มีเลย ต้องเดาเอาว่าช่องไหนคืออะไร */}
            {!isMobile && (
              <div style={{ display: "grid", gridTemplateColumns: CAB_COLS, gap: 8, padding: "0 2px 6px",
                fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
                <span>จุดเดินสาย</span><span>ชนิดสายไฟ</span><span style={{ textAlign: "right" }}>ความยาว</span><span />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 10 : 2 }}>
              {b.cables.map((c, i) => {
                const isComm = /LAN|CAT/i.test(c.type || "");
                const isDC = /PV1-F|PV CABLE/i.test(c.type || "") || /PV-INVERTER/i.test(c.name || "");  // สาย DC คิดขนาดในส่วนสาย DC แยก
                /* เงื่อนไขของสายเส้นนี้ — ไม่ได้ตั้งเอง = ตามค่าตั้งต้นของงาน (ตารางคำนวณขนาดสายไฟ)
                   ปกติทั้งงานเดินแบบเดียวกัน จะได้ไม่ต้องมากดซ้ำทุกเส้น เส้นไหนต่างค่อยกดแก้เฉพาะเส้น */
                const own = !!(c.method || c.group || c.ncond || c.core);
                const rawMethod = c.method || calcMethod;
                const rawMeta = (window.BOQ.WIRE_METHODS || []).find((m) => m.key === rawMethod) || {};
                // ไม่ได้เลือกกลุ่มเอง → ตามค่าตั้งต้นถ้าวิธีนี้ใช้กลุ่มนั้นได้ ไม่งั้นใช้กลุ่มแรกของวิธีนั้น
                const rawGroup = c.group || ((rawMeta.groups || []).indexOf(calcGroup) >= 0 ? calcGroup : (rawMeta.groups || ["g1"])[0]);
                // แถวเก่าที่บันทึกวิธีที่เลิกใช้แล้วไว้ ให้เด้งไปวิธีที่ใช้แทน (ดู WIRE_METHOD_LEGACY)
                const pick = (window.BOQ.normWireMethod || ((m, g) => ({ method: m, group: g })))(rawMethod, rawGroup);
                const method = pick.method;
                const group = pick.group;
                const ncond = c.ncond || calcNCond;
                const coreType = window.BOQ.cableCoreType(c.type);   // single / multi (จากชื่อ 1C/nC)
                /* กลุ่มที่เลือกอาจไม่ได้แยกคอลัมน์ตามแกนเดียว/หลายแกน (กลุ่ม 5,6 รวมกัน · กลุ่ม 4 แยกแนวการวาง)
                   ตั้งต้นใช้ค่าที่อ่านจากชื่อสาย แล้วเด้งเข้าแกนย่อยที่กลุ่มนั้นมีจริง — ผู้ใช้แก้ทับได้ */
                const rowCoreOpts = (window.BOQ.ampCoresFor || (() => []))(group);
                const coreKey = (window.BOQ.ampCoreKey || (() => coreType))(group, c.core || coreType, c.core || coreType);
                const coreTh = (window.BOQ.AMP_CORE_LABEL || {})[coreKey] || (coreType === "multi" ? "หลายแกน" : "แกนเดียว");
                const hasSize = window.BOQ.cableSizeNum(c.type) != null;
                const amp = cableAmp(c.type, { method, group, ncond, core: coreKey, orient: coreKey });
                const req = reqAmpFor(c.name);
                const bad = amp != null && req && amp < req;
                const showHint = !!c.type && !isComm && !isDC;
                const vd = isComm ? null : vdropFor(c);
                const open = !!cabOpen[i];
                const mShort = ((window.BOQ.WIRE_METHODS || []).find((m) => m.key === method) || {});
                const condTh = (mShort.short || mShort.th || method) + " · " + ((window.BOQ.AMP_GROUPS || []).find((g) => g.key === group) || {}).th + " · " + ncond + " ตัวนำ · " + coreTh;
                return (
                <div key={i} style={Object.assign({ display: "flex", flexDirection: "column", gap: isMobile ? 7 : 3, padding: isMobile ? "10px 11px" : "5px 2px" },
                  isMobile ? { border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }
                    : { borderTop: i === 0 ? "none" : "1px solid var(--border)" })}>
                  {isMobile && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>จุดเดินสาย</span>
                      <Dropdown value={c.name || ""} onChange={(v) => setCab(i, "name", v)} options={cablePtOptions} placeholder="— เลือกจุด —" addable onAdd={addCablePt} />
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 64px 34px" : CAB_COLS, gap: 8, alignItems: "center" }}>
                    {!isMobile && <Dropdown value={c.name || ""} onChange={(v) => setCab(i, "name", v)} options={cablePtOptions} placeholder="— เลือกจุด —" addable onAdd={addCablePt} />}
                    <Dropdown value={c.type} onChange={(v) => setCab(i, "type", v)} options={cableTypeOptions} placeholder="— เลือกสายไฟ —" />
                    <input type="number" style={numStyle} value={c.length} placeholder="ม." onChange={(e) => setCab(i, "length", e.target.value)} />
                    <button className="bq-x" onClick={() => delCab(i)} title="ลบสายเส้นนี้"><Icon name="x" size={14} /></button>
                  </div>
                  {/* บรรทัดสถานะ — ปกติเห็นแค่สรุปสั้น ๆ กดที่ป้ายเงื่อนไขถึงจะกางช่องแก้เฉพาะเส้น */}
                  {(showHint || isDC || vd) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11, lineHeight: 1.5 }}>
                      {showHint && (
                        <button type="button" onClick={() => setCabOpen((p) => Object.assign({}, p, { [i]: !open }))}
                          title={own ? "เส้นนี้ตั้งเงื่อนไขเอง — กดเพื่อแก้" : "ตามค่าตั้งต้นของงาน — กดเพื่อตั้งเฉพาะเส้นนี้"}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid " + (own ? "var(--border-strong)" : "transparent"),
                            background: own ? "var(--surface)" : "var(--surface2)", color: own ? "var(--text-2)" : "var(--text-3)",
                            borderRadius: 99, padding: "3px 9px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          {own && <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--primary)" }} />}
                          {condTh}
                          <Icon name="chevronDown" size={12} color="var(--text-3)" style={{ transform: open ? "rotate(180deg)" : "none" }} />
                        </button>
                      )}
                      {showHint && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700,
                          color: bad || amp == null ? "#B91C1C" : (req ? "#16A34A" : "var(--text-3)") }}>
                          <Icon name={amp == null || bad ? "alert" : (req ? "check" : "bolt")} size={11} color={bad || amp == null ? "#B91C1C" : (req ? "#16A34A" : "var(--text-3)")} />
                          {amp != null
                            ? "พิกัด ~" + amp + " A" + (req ? " / ต้องการ " + (Math.round(req * 10) / 10).toFixed(1) + " A" : "") + (bad ? " · ไม่พอ" : (req ? " · ผ่าน" : ""))
                            : (!hasSize ? "เลือกสายที่ระบุขนาด (SQ.MM.) ก่อน" : "ยังไม่มีตารางพิกัดของเงื่อนไขนี้")}
                        </span>
                      )}
                      {vd && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: vd.ok ? "var(--text-3)" : "#B45309" }}
                          title={"ΔV = " + (vd.phase === 3 ? "√3" : "2") + " × " + vd.length + " ม. × " + Math.round(vd.amp * 100) / 100 + " A × ρ ÷ " + vd.size + " mm²  ·  เกณฑ์ ≤ " + vd.lim + "%"}>
                          <Icon name={vd.ok ? "check" : "alert"} size={11} color={vd.ok ? "var(--text-3)" : "#B45309"} />
                          ΔV {vd.pct}%
                          {!vd.ok && (vd.minSize ? " · ต้องใช้ ≥ " + vd.minSize + " mm²" : " · เกินขนาดสายที่มี ให้ลดระยะหรือเพิ่มแรงดัน")}
                        </span>
                      )}
                      {isDC && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, color: "var(--text-3)" }}>
                          <Icon name="bolt" size={11} color="var(--text-3)" />
                          สาย DC{scfg && scfg.ready ? " · แนะนำ " + scfg.dcWire : ""} — ดูหัวข้อ “สาย DC / การต่ออนุกรม String”
                        </span>
                      )}
                    </div>
                  )}
                  {showHint && open && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "8px 9px", marginTop: 1,
                      background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10 }}>
                      <div style={{ width: isMobile ? "100%" : 206, flexShrink: 0 }}>
                        <Dropdown value={method} onChange={(v) => setCab(i, "method", v)} options={methodOptions} placeholder="วิธีเดินสาย" wrap style={cabSelStyle} />
                      </div>
                      <div style={{ width: isMobile ? "calc(50% - 3px)" : 118, flexShrink: 0 }}>
                        <Dropdown value={group} onChange={(v) => setCab(i, "group", v)} options={groupOptionsFor(method)} style={cabSelStyle} />
                      </div>
                      <div style={{ width: isMobile ? "calc(50% - 3px)" : 96, flexShrink: 0 }}>
                        <Dropdown value={ncond} onChange={(v) => setCab(i, "ncond", v)} options={ncondOptions} style={cabSelStyle} />
                      </div>
                      {/* แกนสาย — ตั้งต้นอ่านจากชื่อสาย (1C = แกนเดียว · nC = หลายแกน) แก้ทับได้ถ้าตารางกลุ่มนั้นแยกอย่างอื่น */}
                      <div style={{ width: isMobile ? "100%" : 142, flexShrink: 0 }}>
                        <Dropdown value={coreKey} onChange={(v) => setCab(i, "core", v)} disabled={rowCoreOpts.length < 2}
                          options={rowCoreOpts.map((x) => ({ value: x.key, label: x.th }))} style={cabSelStyle} />
                      </div>
                      {own && (
                        <button type="button" onClick={() => resetCabCond(i)}
                          style={{ border: 0, background: "none", color: "var(--text-3)", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
                          ใช้ค่าตั้งต้น
                        </button>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
              <button onClick={addCab} style={{ alignSelf: "flex-start", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 5, background: "none", color: "var(--primary-dark)", border: "1px dashed var(--border-strong)", borderRadius: 9, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--primary-dark)" /> เพิ่มสาย</button>
              {/* ── สรุปแรงดันตกทั้งเส้นทาง — มาตรฐานคุมทั้ง DC, AC และผลรวม ── */}
              {vdropSum.any && (() => {
                const L = vdropSum.lim;
                const cell = (lb, val, lim, tip) => (
                  <span title={tip} style={{ display: "inline-flex", alignItems: "baseline", gap: 5, fontSize: 11.5, fontWeight: 700,
                    color: val > lim ? "#B45309" : "var(--text-2)" }}>
                    {lb} <b style={{ fontSize: 13.5, color: val > lim ? "#B45309" : "var(--text-1)" }}>{val}%</b>
                    <span style={{ fontWeight: 600, color: "var(--text-3)" }}>/ {lim}%</span>
                  </span>
                );
                const bad = vdropSum.dc > L.dc || vdropSum.ac > L.ac || vdropSum.total > L.total;
                return (
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", padding: "10px 13px", borderRadius: 11,
                    border: "1px solid " + (bad ? "#F59E0B55" : "var(--border)"), background: bad ? "#F59E0B12" : "var(--surface2)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-1)" }}>
                      <Icon name="bolt" size={12} color={bad ? "#B45309" : "var(--primary)"} />แรงดันตกรวม
                    </span>
                    {cell("ฝั่ง DC", vdropSum.dc, L.dc, "เส้นที่ตกมากสุดฝั่ง DC (แต่ละสตริงเป็นเส้นทางของตัวเอง ไม่บวกกัน)")}
                    {cell("ฝั่ง AC", vdropSum.ac, L.ac, "บวกทุกช่วงฝั่ง AC ตั้งแต่อินเวอร์เตอร์ถึงตู้เมน")}
                    {cell("รวมทั้งเส้นทาง", vdropSum.total, L.total, "DC + AC — เกณฑ์ออกแบบทั่วไปไม่เกิน 5%")}
                    <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>
                      {bad ? "เกินเกณฑ์ — ขยับขนาดสายขึ้นหรือลดระยะ ไม่งั้นไฟหายไปกับสายและแรงดันปลายทางตก" : "อยู่ในเกณฑ์ · คิดที่กระแสใช้งานจริงและความต้านทานทองแดงตอนสายร้อน"}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* ── ตารางคำนวณขนาดสายไฟ (จากกระแส Micro-inverter) ── */}
            <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface2)" }}>
              <div style={{ padding: "11px 14px 12px", borderBottom: "1px solid var(--border)" }}>
                {/* หัวการ์ด — ชื่ออยู่ซ้าย ตัวเลขตั้งต้นเกาะขวา ช่องกว้างพอดีตัวเลข ไม่ยืดเต็มแถว */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 11 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", display: "inline-flex", alignItems: "center", gap: 6, paddingBottom: 7, marginRight: 2 }}>
                    <Icon name="bolt" size={13} color="var(--primary)" /> ตารางคำนวณขนาดสายไฟ
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>· {wcPhase} เฟส</span>
                  </span>
                  {!isMobile && <span style={{ width: 1, height: 22, background: "var(--border)", marginRight: 4, marginBottom: 6 }} />}
                  {/* ฉนวนอยู่แถวบนคู่กับแรงดัน — เป็นค่าของ "ตัวสาย" ไม่ใช่ของวิธีเดิน และย้ายมาแล้วแถวล่างเหลือที่ให้ชื่อวิธีเดินสายเต็ม ๆ */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, width: isMobile ? "100%" : 152 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>ชนิดฉนวน</span>
                    <Dropdown value={calcIns} onChange={(v) => setWcalc("ins", v)} options={insOptions} style={{ height: 34, fontSize: 12.5, padding: "6px 9px" }} />
                  </label>
                  {[
                    { label: "แรงดัน", unit: "V", value: wcVolt, key: "volt", min: undefined },
                    isStringInv ? null : { label: "แบ่ง String", unit: "", value: wcStrings, key: "strings", min: "1" },
                    hasBattery ? { label: "กำลังแบต", unit: "kW", value: wcalc.battKw, key: "battKw", min: undefined } : null,
                    hasBackup ? { label: "เมน Backup", unit: "A", value: wcalc.backupMainA || "", key: "backupMainA", min: undefined, ph: "—" } : null,
                  ].filter(Boolean).map((f) => (
                    <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 3, width: isMobile ? "calc(50% - 5px)" : 104 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{f.label}{f.unit ? " (" + f.unit + ")" : ""}</span>
                      <input type="number" min={f.min} placeholder={f.ph} value={f.value} onChange={(e) => setWcalc(f.key, e.target.value)}
                        style={Object.assign({}, numStyle, { width: "100%", height: 34, fontSize: 12.5, padding: "6px 9px" })} />
                    </label>
                  ))}
                </div>

                {/* เงื่อนไขพิกัดตาม วสท. — วิธีเดินสายชื่อยาวสุดและเป็นตัวตั้งต้นของกลุ่ม จึงให้กินที่ที่เหลือทั้งหมด */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
                  {[
                    { k: "method", lb: "วิธีเดินสาย", w: isMobile ? "100%" : 0, grow: 1, min: 268,
                      el: <Dropdown value={calcMethod} onChange={setMethodPick} options={methodOptions} /> },
                    { k: "group", lb: "กลุ่มการติดตั้ง", w: isMobile ? "calc(50% - 4px)" : 124,
                      el: <Dropdown value={calcGroup} onChange={(v) => setWcalc("group", v)} options={groupOptionsFor(calcMethod)} /> },
                    { k: "ncond", lb: "ตัวนำมีกระแส", w: isMobile ? "calc(50% - 4px)" : 116,
                      el: <Dropdown value={calcNCond} onChange={(v) => setWcalc("ncond", v)} options={ncondOptions} /> },
                    /* แกนสาย — กลุ่ม 1,2,3,7 = แกนเดียว/หลายแกน · กลุ่ม 4 = แนวตั้ง/แนวราบ · กลุ่ม 5,6 = รวมคอลัมน์เดียว */
                    { k: "core", lb: "แกนสาย", w: isMobile ? "calc(50% - 4px)" : 146,
                      el: <Dropdown value={calcCore} onChange={(v) => setWcalc("core", v)} disabled={coreOpts.length < 2}
                        options={coreOpts.map((c) => ({ value: c.key, label: c.th }))} /> },
                  ].map((f) => (
                    <label key={f.k} style={{ width: f.w || undefined, flex: f.grow && !isMobile ? "1 1 " + f.min + "px" : "0 0 auto",
                      minWidth: f.grow && !isMobile ? f.min : undefined, display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{f.lb}</span>
                      {f.el}
                    </label>
                  ))}
                </div>

                {/* แถบสรุป — รูปของวิธีที่เลือก + คอลัมน์ที่กำลังอ่าน · ไม่ต้องมีกรอบซ้อนกรอบ ใช้เส้นคั่นพอ */}
                <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: 11, alignItems: "center", flexWrap: "wrap" }}>
                    {mtdMeta.art && mtdMeta.art !== grpMeta.art && <WireArt art={mtdMeta.art} w={84} h={50} />}
                    <WireArt art={grpMeta.art} w={84} h={50} />
                    <div style={{ flex: 1, minWidth: 170 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-1)" }}>{mtdMeta.th}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5, marginTop: 1 }}>
                        อ่านคอลัมน์ <b style={{ color: "var(--text-2)", fontWeight: 700 }}>{(grpMeta.th || calcGroup) + " · " + calcNCond + " ตัวนำ · " + ((window.BOQ.AMP_CORE_LABEL || {})[calcCore] || calcCore)}</b>
                        {grpMeta.sub ? " — " + grpMeta.sub : ""}
                      </div>
                      {mtdMeta.groups && mtdMeta.groups.indexOf(calcGroup) < 0 && (
                        <button type="button" onClick={() => setWcalc("group", mtdMeta.groups[0])}
                          style={{ marginTop: 4, border: 0, background: "#FEF3C7", color: "#92400E", borderRadius: 7, padding: "3px 8px", fontWeight: 700, fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                          วิธีนี้ใช้กับ {((window.BOQ.AMP_GROUPS || []).find((g) => g.key === mtdMeta.groups[0]) || {}).th || mtdMeta.groups[0]} — กดสลับ
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => setArtOpen(!artOpen)}
                      style={{ border: 0, background: "none", color: "var(--text-3)", padding: "2px 0", fontWeight: 700, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {artOpen ? "ซ่อนรูป" : "เลือกจากรูป"}
                    </button>
                  </div>
                  {artOpen && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { title: "วิธีเดินสาย", items: (window.BOQ.WIRE_METHODS || []).map((m) => ({ key: m.key, art: m.art, name: m.th, note: ((window.BOQ.AMP_GROUPS || []).find((g) => g.key === (m.groups || [])[0]) || {}).th || "", on: calcMethod === m.key, pick: () => setMethodPick(m.key), tip: m.sub })) },
                        { title: "กลุ่มการติดตั้ง", items: (window.BOQ.AMP_GROUPS || []).map((g) => ({ key: g.key, art: g.art, name: g.th, note: g.sub, on: calcGroup === g.key, pick: () => setWcalc("group", g.key), tip: g.desc })) },
                      ].map((sec) => (
                        <div key={sec.title}>
                          <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".07em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>{sec.title}</div>
                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))", gap: 7 }}>
                            {sec.items.map((it) => (
                              <button key={it.key} type="button" onClick={it.pick} title={it.tip || it.name}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 5px 7px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                                  border: "1px solid " + (it.on ? "var(--primary)" : "var(--border)"),
                                  background: it.on ? "var(--primary-soft)" : "var(--surface)" }}>
                                <WireArt art={it.art} w="100%" h={46} />
                                <span style={{ fontSize: 9.5, fontWeight: 700, lineHeight: 1.35, color: it.on ? "var(--primary-dark)" : "var(--text-1)" }}>{it.name}</span>
                                {it.note && <span style={{ fontSize: 9, color: "var(--text-3)", lineHeight: 1.3 }}>{it.note}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ตัวคูณลดกระแส — หลายวงจรในท่อ/รางเดียวกัน ระบายความร้อนแย่ลง พิกัดที่ใช้ได้จริงจึงต่ำกว่าตาราง */}
                <div style={{ marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>ตัวคูณลดกระแส</span>
                  <input type="number" min={0.1} max={1} step={0.05} value={wcalc.derate != null && wcalc.derate !== "" ? wcalc.derate : 1}
                    onChange={(e) => setWcalc("derate", e.target.value)}
                    style={Object.assign({}, numStyle, { width: 76, height: 32, fontSize: 12.5, padding: "5px 9px" })} />
                  {trayWorst < 1 && (
                    <button type="button" onClick={() => setWcalc("derate", trayWorst)}
                      style={{ border: 0, background: "var(--primary-soft)", color: "var(--primary-dark)", borderRadius: 7, padding: "4px 9px", fontWeight: 700, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                      title="ใช้ตัวคูณที่แย่ที่สุดจากหัวข้อท่อร้อยสายและรางไฟ">ใช้ ×{trayWorst.toFixed(2)} จากท่อ/ราง</button>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>1.00 = วงจรเดียว · 4–6 ตัวนำ 0.80 · 7–9 0.70 · 10–20 0.50</span>
                </div>

                {(!hasAmpTbl || ampSrc.borrowed) && (
                  <div className="bq-note" style={{ marginTop: 10, background: ampSrc.borrowed ? "rgba(34,163,91,.07)" : "#FFFBEB", border: "1px solid " + (ampSrc.borrowed ? "#BBE7CD" : "#FDE68A"), color: ampSrc.borrowed ? "#1d854b" : "#92400E" }}>
                    <Icon name={ampSrc.borrowed ? "check" : "alert"} size={15} color={ampSrc.borrowed ? "#22A35B" : "#F59E0B"} />
                    <span>{ampSrc.borrowed
                      ? "ใช้ตารางพิกัดของ \"" + ampSrcTh(ampSrc.from) + "\" — " + (mtdMeta.baseWhy || "ระบายความร้อนแบบเดียวกัน")
                      : "ยังไม่มีตารางของคอลัมน์นี้ — \"สายแนะนำ\" จะขึ้น \"—\" จนกว่าจะกรอกที่หน้าคลัง › พิกัดสาย วสท."}</span>
                  </div>
                )}
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 7 }}>สายแนะนำ = ขนาดเล็กสุดที่รับกระแส ×1.25 ได้ตามคอลัมน์นี้{calcDerate < 1 ? " · หักตัวคูณ ×" + calcDerate.toFixed(2) + " แล้ว" : ""}</div>
              </div>
              {isMobile ? (
                /* มือถือ: แต่ละชุดคำนวณเป็นการ์ด แสดงค่าครบในใบเดียว ไม่ต้องเลื่อนแนวนอน */
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px" }}>
                  {calcRows.map((r, i) => {
                    const metric = (label, val, sub, hi) => (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".02em", color: "var(--text-3)", textTransform: "uppercase" }}>{label}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 700, color: hi ? "var(--primary-dark)" : "var(--text-1)" }}>{val}</div>
                        {sub && <div style={{ fontSize: 9.5, color: "var(--text-3)" }}>{sub}</div>}
                      </div>
                    );
                    return (
                      <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{r.label}</div>
                            {r.needInput && <div style={{ fontSize: 10.5, color: "#B45309", marginTop: 1 }}>{r.note}</div>}
                          </div>
                          <span style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: r.needInput ? "var(--text-3)" : "var(--primary-dark)", background: r.needInput ? "var(--surface3)" : "var(--primary-soft)", padding: "4px 10px", borderRadius: 7 }}>{r.wire}</span>
                        </div>
                        {!r.needInput && (
                          <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", marginTop: 9, paddingTop: 9 }}>
                            {metric("กำลัง (W)", r.w == null ? "—" : Math.round(r.w).toLocaleString())}
                            {metric("กระแสรวม (A)", (Math.round(r.ampTotal * 10) / 10).toFixed(1))}
                            {metric(isStringInv ? "กระแส (A)" : "กระแส/สตริง", (Math.round(r.ampString * 10) / 10).toFixed(1), "×1.25 = " + (Math.round(r.ampString * 1.25 * 10) / 10).toFixed(1), r.splittable && wcStrings > 1)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 540 }}>
                  <thead>
                    <tr style={{ color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      <th style={{ textAlign: "left", padding: "8px 14px", fontWeight: 700 }}>ชุดคำนวณ</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>กำลัง (W)</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>กระแสรวม (A)</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>{isStringInv ? "กระแส (A)" : "กระแส/สตริง (A)"}</th>
                      <th style={{ textAlign: "right", padding: "8px 14px", fontWeight: 700 }}>{isStringInv ? "สายแนะนำ" : "สายแนะนำ/สตริง"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcRows.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "9px 14px", color: "var(--text-1)" }}>
                          <span style={{ fontWeight: 600 }}>{r.label}</span>
                          <span style={{ display: "block", fontSize: 10.5, color: r.needInput ? "#B45309" : "var(--text-3)" }}>{r.note}</span>
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-2)" }}>{r.w == null ? "—" : Math.round(r.w).toLocaleString()}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{r.needInput ? "—" : (Math.round(r.ampTotal * 10) / 10).toFixed(1)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)" }}>
                          {r.needInput ? <span style={{ color: "var(--text-3)" }}>—</span> : (
                            <React.Fragment>
                              <span style={{ fontWeight: 700, color: r.splittable && wcStrings > 1 ? "var(--primary-dark)" : "var(--text-1)" }}>{(Math.round(r.ampString * 10) / 10).toFixed(1)}</span>
                              <span style={{ display: "block", fontSize: 9.5, color: "var(--text-3)" }}>×1.25 = {(Math.round(r.ampString * 1.25 * 10) / 10).toFixed(1)}</span>
                            </React.Fragment>
                          )}
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right" }}>
                          <span style={{ display: "inline-block", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: r.needInput ? "var(--text-3)" : "var(--primary-dark)", background: r.needInput ? "var(--surface3)" : "var(--primary-soft)", padding: "3px 9px", borderRadius: 7 }}>{r.wire}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
              {!isMobile && (
              <div style={{ padding: "9px 14px", fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5, borderTop: "1px solid var(--border)" }}>
                {isStringInv
                  ? "* PV-INVERTER = สาย DC จากแผง→อินเวอร์เตอร์ (Isc × 1.25, สาย PV1-F ขั้นต่ำ 6 mm²) · INVERTER→MCB_SOLAR = กระแสออกอินเวอร์เตอร์/ตัว · MCB_SOLAR→MDB = กระแสออกรวมทุกตัว → ตู้เมน · ขนาดสาย AC เลือกให้รับกระแส ×1.25 ตามพิกัด วสท. · กระแสออกตั้งค่าได้ที่หน้าคลัง › สเปคอินเวอร์เตอร์"
                  : "* MICRO-MICRO = ไมโคร 1 ตัว (" + microW + "W) ÷ 230V (อุปกรณ์ 1 เฟส) · MICRO-COMBINER (กระแส/สตริง) = กระแสรวม ÷ จำนวน String · COMBINER→MCB ใช้กระแสรวมทุกสตริง · กระแสรวม: 1 เฟส = W ÷ V · 3 เฟส = W ÷ (√3 × แรงดันไลน์ V) · ขนาดสายแนะนำเลือกให้รับกระแส ×1.25 (โหลดต่อเนื่อง) อ้างพิกัดสายทองแดง IEC01/THW โดยประมาณ — โปรดตรวจสอบกับวิธีเดินสายจริง"}
              </div>
              )}
            </div>
          </BoqSection>

          {/* ── ท่อร้อยสาย (RACE WAY) ── */}
          <BoqSection title="ท่อร้อยสาย (RACE WAY)" icon="grid" {...secProps("raceway")}
            right={condLen > 0 ? <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary-dark)" }}>รวม {condLen} ม.</span> : null}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ConduitList kind="imc" label="ท่อ IMC (3m/ท่อน)" sizes={window.BOQ.IMC_SIZES} valKey="length" unitText="ม." check
                hint="ท่อเหล็ก IMC ยาว 3.0 ม./ท่อน — กรอกความยาวรวมของแต่ละขนาด" />
              <ConduitList kind="upvc" label="ท่อ uPVC" sizes={window.BOQ.UPVC_SIZES} valKey="length" unitText="ม." check
                hint="ท่อขาว uPVC ยาว 2.9 ม./ท่อน — ขนาดที่เรียกเป็นขนาดนอก ระบบหักผนังท่อให้แล้วตอนตรวจ % เติมเต็ม" />
              <ConduitList kind="pullbox" label="PULL BOX" sizes={window.BOQ.PULLBOX_SIZES} valKey="qty" unitText="ชิ้น"
                hint="กล่องพักสาย — กรอกจำนวนใบ (ไม่มีสายวิ่งผ่านเป็นเส้นให้ตรวจ % เติมเต็ม)" />
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
              * อุปกรณ์ IMC (แคล้มประกับ / บุชชิ่ง,ล็อกนัท / รางซี / คอนเนคเตอร์ / คุปปิ้ง) คำนวณอัตโนมัติจากความยาวท่อ + จำนวน PULL BOX
            </div>
            {/* ตั้งค่า IMC */}
            <button onClick={() => setAdvC((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ IMC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advC ? "rotate(180deg)" : "none" }} />
            </button>
            {advC && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ แคล้มประกับ"><input type="number" style={numStyle} value={csp.clamp} onChange={(e) => setCSpare("clamp", e.target.value)} /></Field>
                <Field label="% เผื่อ บุชชิ่ง/ล็อกนัท"><input type="number" style={numStyle} value={csp.bushing} onChange={(e) => setCSpare("bushing", e.target.value)} /></Field>
                <Field label="% เผื่อ รางซี"><input type="number" style={numStyle} value={csp.cchannel} onChange={(e) => setCSpare("cchannel", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเนคเตอร์"><input type="number" style={numStyle} value={csp.connector} onChange={(e) => setCSpare("connector", e.target.value)} /></Field>
                <Field label="% เผื่อ คุปปิ้ง"><input type="number" style={numStyle} value={csp.coupling} onChange={(e) => setCSpare("coupling", e.target.value)} /></Field>
                {[...new Set((cond.imc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อน IMC " + sz.replace(/^IMC\s*/i, "") + " (กล่อง)"}><input type="number" style={numStyle} value={(cond.flex || {})[sz] != null ? cond.flex[sz] : 1} onChange={(e) => setFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}

            {/* ตั้งค่า uPVC */}
            <button onClick={() => setAdvU((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ uPVC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advU ? "rotate(180deg)" : "none" }} />
            </button>
            {advU && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ ข้อต่อตรง"><input type="number" style={numStyle} value={csp.upStraight} onChange={(e) => setCSpare("upStraight", e.target.value)} /></Field>
                <Field label="% เผื่อ แคลมป์ก้ามปู"><input type="number" style={numStyle} value={csp.upClamp} onChange={(e) => setCSpare("upClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเน็ตเตอร์ uPVC"><input type="number" style={numStyle} value={csp.upConnector} onChange={(e) => setCSpare("upConnector", e.target.value)} /></Field>
                {[...new Set((cond.upvc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อนขาว " + ((sz.match(/(\d+)\s*mm/) || [])[1] || "") + "mm (กล่อง)"}><input type="number" style={numStyle} value={(cond.upFlex || {})[sz] != null ? cond.upFlex[sz] : 1} onChange={(e) => setUpFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}
          </BoqSection>

          {/* ── รางไฟ (WIREWAY / CABLE TRAY) ── */}
          <BoqSection title="รางไฟ (Wireway / Cable Tray)" icon="grid" {...secProps("tray")}
            right={trayLen > 0 ? <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary-dark)" }}>รวม {trayLen} ม.</span> : null}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TrayList kind="way" label="Wireway เหล็กมีฝา" sizes={window.BOQ.WAY_SIZES}
                hint={"รางเหล็กพับมีฝาปิด ยาว " + window.BOQ.WAY_PIPE_LEN.toFixed(1) + " ม./ท่อน — กรอกความยาวรวมของแต่ละขนาด"} />
              <TrayList kind="tray" label="Cable Tray บันได" sizes={window.BOQ.TRAY_SIZES}
                hint={"รางบันได ยาว " + window.BOQ.TRAY_PIPE_LEN.toFixed(1) + " ม./ท่อน — ใช้เดินสายจำนวนมากระยะไกล"} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 1fr", gap: 12, alignItems: "center" }}>
                <Field label="% เผื่อ อุปกรณ์ประกอบ">
                  <input type="number" style={numStyle} value={tw.spare} onChange={(e) => setTrayVal("spare", e.target.value)} />
                </Field>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                  ตัวราง = ปัดขึ้นตามความยาว/ท่อน · ชุดข้อต่อ = ทุกรอยต่อ +2 · ขาแขวน = ทุก 1.5 ม. · พุ๊กเหล็ก 4 ตัว/ขา
                </div>
              </div>
              {/* ข้องอ / ข้อลด / สามทาง — รูปทรงไม่ตายตัว กรอกจำนวนเองตามแบบ */}
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 7 }}>ข้องอ / ข้อลด / สามทาง (กรอกเอง)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(tw.extra || []).map((x, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px 62px 36px", gap: 8, alignItems: "center" }}>
                      <input value={x.name || ""} placeholder="เช่น ข้องอ 90° Wireway 100x100 mm." style={inputStyle} onChange={(e) => setTrayVal("extra", (tw.extra || []).map((y, j) => j === i ? Object.assign({}, y, { name: e.target.value }) : y))} />
                      <input type="number" style={numStyle} value={x.qty != null ? x.qty : ""} placeholder="จำนวน" onChange={(e) => setTrayVal("extra", (tw.extra || []).map((y, j) => j === i ? Object.assign({}, y, { qty: e.target.value }) : y))} />
                      <input value={x.unit || ""} placeholder="หน่วย" style={inputStyle} onChange={(e) => setTrayVal("extra", (tw.extra || []).map((y, j) => j === i ? Object.assign({}, y, { unit: e.target.value }) : y))} />
                      <button onClick={() => setTrayVal("extra", (tw.extra || []).filter((_, j) => j !== i))} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setTrayVal("extra", (tw.extra || []).concat([{ name: "", qty: "", unit: "ชุด" }]))} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> เพิ่มอุปกรณ์</button>
                </div>
              </div>
            </div>
          </BoqSection>

          {/* ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ── */}
          <BoqSection title="โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB)" icon="box" {...secProps("support")}
            right={<button onClick={() => { setSup("inv", supAuto); setSup("mdb", 1); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
              title={supAuto > 0 ? "ตั้งเป็นอินเวอร์เตอร์ " + supAuto + " ตัว + ตู้ 1 ใบ" : "ไมโครอินเวอร์เตอร์ยึดใต้แผงอยู่แล้ว — ตั้งเฉพาะตู้ 1 ใบ"}>ใช้ตามระบบ</button>}>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 14 }}>
              อินเวอร์เตอร์ตัวใหญ่และตู้ MDB ต้องมีโครงเหล็กหรือฉากรองรับ ไม่ได้ยึดผนังเปล่า ๆ — ใส่ 0 ถ้างานนี้ไม่ต้องทำโครง
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))", gap: 12 }}>
              <Field label="จุดรองรับอินเวอร์เตอร์"><input type="number" min={0} step={1} style={numStyle} value={sup.inv} onChange={(e) => setSup("inv", e.target.value === "" ? 0 : Math.max(0, Math.round(+e.target.value || 0)))} /></Field>
              <Field label="แบบยึดอินเวอร์เตอร์"><Dropdown value={sup.invKind} onChange={(v) => setSup("invKind", v)} options={Object.keys(window.BOQ.SUPPORT_KINDS).map((k) => ({ value: k, label: window.BOQ.SUPPORT_KINDS[k].label }))} /></Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="% เผื่อวัสดุ"><input type="number" style={numStyle} value={sup.spare} onChange={(e) => setSup("spare", e.target.value)} /></Field></div>
              <Field label="จุดรองรับตู้ MDB / ตู้ไฟ"><input type="number" min={0} step={1} style={numStyle} value={sup.mdb} onChange={(e) => setSup("mdb", e.target.value === "" ? 0 : Math.max(0, Math.round(+e.target.value || 0)))} /></Field>
              <Field label="แบบยึดตู้"><Dropdown value={sup.mdbKind} onChange={(v) => setSup("mdbKind", v)} options={Object.keys(window.BOQ.SUPPORT_KINDS).map((k) => ({ value: k, label: window.BOQ.SUPPORT_KINDS[k].label }))} /></Field>
            </div>
            {sup.inv + sup.mdb > 0 && (
              <div className="bq-note ok" style={{ marginTop: 14 }}>
                <Icon name="check" size={15} color="#22A35B" />
                <span>ถอดวัสดุให้แล้ว — ดูรายการจริงได้ในหัวข้อ "รายการวัสดุที่ถอดได้" หมวด {window.BOQ.G_SUPPORT} (รวมสีกันสนิม ลวดเชื่อม ใบตัดเหล็ก)</span>
              </div>
            )}
          </BoqSection>

          {/* ── ค่าแรงติดตั้ง ── */}
          <BoqSection title="ค่าแรงติดตั้ง" icon="power" {...secProps("labor")}
            right={priced.laborTotal > 0 ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>฿{baht(priced.laborTotal)} · ฿{baht(priced.laborPerW)}/W</span> : null}>
            {/* เหมารวม = ตกลงราคาเดียวจบ · แยกรายการ = เห็นว่าเงินไปอยู่งานไหน (ใช้ต่อรองและคุมหน้างานได้) */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {[{ v: "lump", t: "เหมารวม", d: "ราคาเดียวจบ" }, { v: "split", t: "แยกรายการงาน", d: "เห็นทีละงาน" }].map((m) => (
                <button key={m.v} type="button" onClick={() => set("laborMode", m.v)}
                  style={{ flex: "1 1 180px", textAlign: "left", padding: "10px 13px", borderRadius: 11, cursor: "pointer", fontFamily: "inherit",
                    border: "1px solid " + (laborMode === m.v ? "var(--primary)" : "var(--border-strong)"),
                    background: laborMode === m.v ? "var(--primary-soft)" : "var(--surface2)" }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: laborMode === m.v ? "var(--primary-dark)" : "var(--text-1)" }}>{m.t}</span>
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>{m.d}</span>
                </button>
              ))}
            </div>

            {laborMode === "lump" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                  ตกลงค่าแรงเป็นก้อนเดียว — เลือกฐานคิดแล้วกรอกเรต ระบบคูณปริมาณจริงของงานนี้ให้เอง
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "200px 140px minmax(0,1fr)", gap: 12 }}>
                  <Field label="ฐานคิด">
                    <Dropdown value={lump.basis} onChange={(v) => setLump("basis", v)} options={[
                      { value: "w", label: "ต่อวัตต์ (฿/W)" },
                      { value: "job", label: "เหมาทั้งงาน (บาท)" },
                      { value: "kw", label: "ต่อ kW (฿/kW)" },
                      { value: "panel", label: "ต่อแผง (฿/แผง)" },
                    ]} />
                  </Field>
                  <Field label={lump.basis === "w" ? "฿ ต่อวัตต์" : lump.basis === "kw" ? "฿ ต่อ kW" : lump.basis === "panel" ? "฿ ต่อแผง" : "฿ เหมาทั้งงาน"}>
                    <input type="number" min={0} style={numStyle} value={lump.rate} placeholder="0" onChange={(e) => setLump("rate", e.target.value)} />
                  </Field>
                  <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
                    <Field label="ชื่อที่จะขึ้นในใบ BOQ (เว้นว่าง = ใช้ชื่อมาตรฐาน)">
                      <input value={lump.note} placeholder="เช่น ค่าแรงติดตั้งเหมาทั้งระบบ รวมนั่งร้าน" style={inputStyle} onChange={(e) => setLump("note", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <div className="bq-spec">
                  <div><span className="k">ฐานคิด</span><span className="v">{lump.basis === "w" ? Math.round(result.meta.kw * 1000).toLocaleString() + " W" : lump.basis === "kw" ? result.meta.kw.toLocaleString() + " kW" : lump.basis === "panel" ? result.meta.panelCount.toLocaleString() + " แผง" : "1 งาน"}</span></div>
                  <div><span className="k">เรต</span><span className="v">฿{baht(lump.rate)}</span></div>
                  <div><span className="k">ค่าแรงรวม</span><span className="v hi">฿{baht(priced.laborTotal)}</span></div>
                  <div><span className="k">คิดเป็น</span><span className="v hi">฿{baht(priced.laborPerW)}/W</span></div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 12 }}>
                  ปริมาณของบรรทัดที่ขึ้นเลขสีเขียวดึงจากผลถอดวัสดุให้เอง (แผง/ตัว/เมตร) — กรอกแค่ "ราคาต่อหน่วย" · บรรทัดที่ราคา 0 จะไม่ถูกบวกเข้ายอด
                </div>
                <SvcTable sKey="labor" preset={window.BOQ.LABOR_PRESET} qtyLabel="ปริมาณ" total={priced.laborTotal} perW={priced.laborPerW} />
              </div>
            )}
          </BoqSection>

          {/* ── ค่าขออนุญาต & เอกสาร ── */}
          <BoqSection title="ค่าขออนุญาต & เอกสาร" icon="box" {...secProps("permit")}
            right={priced.permitTotal > 0 ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>฿{baht(priced.permitTotal)}</span> : null}>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 12 }}>
              ค่าธรรมเนียมจริงเปลี่ยนตามพื้นที่และขนาดระบบ ระบบจึงไม่เดาให้ — กรอกตามใบเสร็จ/ประกาศล่าสุด · ลบบรรทัดที่งานนี้ไม่ต้องขอได้เลย
            </div>
            <SvcTable sKey="permit" preset={window.BOQ.PERMIT_PRESET} qtyLabel="จำนวน" total={priced.permitTotal} perW={priced.permitPerW} />
          </BoqSection>

          {/* ── งานเพิ่มเติม (Input): โครงสร้างบนหลังคา — เฉพาะงานโครงการ ไม่แสดงงานบ้าน ── */}
          {!isHome && (
          <BoqSection title="งานเพิ่มเติม (Input) — โครงสร้าง" icon="box" {...secProps("struct")}
            right={<button onClick={() => setAdvS((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name={advS ? "chevronDown" : "plus"} size={13} color="var(--text-2)" style={{ transform: advS ? "rotate(180deg)" : "none" }} /> {advS ? "ซ่อน" : "กรอกข้อมูล"}</button>}>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
              เลือกกรอกเฉพาะงานที่มีในโครงการ — ระบบจะถอดวัสดุเพิ่มลงรายการ BOQ ให้อัตโนมัติ (งานที่ไม่กรอก จะไม่ถูกถอด)
            </div>
            {advS && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                <StructBlock kind="ladder" label="LADDER (บันไดลิง)" color="#0D9488" addLabel="เพิ่มจุด"
                  cols={[{ k: "h", ph: "ความสูง (m)" }]} blank={{ h: "" }}
                  spare={st.ladderSpare != null ? st.ladderSpare : 5} onSpare={(v) => setStructVal("ladderSpare", +v)}
                  extraItems={st.ladderExtra || []}
                  onExtraAdd={() => addStructExtra("ladder")}
                  onExtraChange={(i, k, v) => setStructExtra("ladder", i, k, v)}
                  onExtraDel={(i) => delStructExtra("ladder", i)} />
                <StructBlock kind="walkway" label="WALKWAY" color="#D97706" addLabel="เพิ่มแนว"
                  cols={[{ k: "len", ph: "ความยาวแนว (m)" }]} blank={{ len: "" }}
                  extra={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>END CLAMP</span>
                    <span style={{ width: 96 }}><Dropdown value={st.walkwayThk || 35} onChange={(v) => setStructVal("walkwayThk", +v)} options={[{ value: 30, label: "30mm." }, { value: 35, label: "35mm." }]} /></span>
                  </span>}
                  spare={st.walkwaySpare != null ? st.walkwaySpare : 10} onSpare={(v) => setStructVal("walkwaySpare", +v)}
                  extraItems={st.walkwayExtra || []}
                  onExtraAdd={() => addStructExtra("walkway")}
                  onExtraChange={(i, k, v) => setStructExtra("walkway", i, k, v)}
                  onExtraDel={(i) => delStructExtra("walkway", i)} />
                <StructBlock kind="guardrail" label="GUARD RAIL" color="#DB2777" addLabel="เพิ่มจุด"
                  cols={[{ k: "len", ph: "ความยาว layout (m)" }, { k: "corners", ph: "จำนวนมุม" }]} blank={{ len: "", corners: "" }}
                  spare={st.guardrailSpare != null ? st.guardrailSpare : 5} onSpare={(v) => setStructVal("guardrailSpare", +v)}
                  extraItems={st.guardrailExtra || []}
                  onExtraAdd={() => addStructExtra("guardrail")}
                  onExtraChange={(i, k, v) => setStructExtra("guardrail", i, k, v)}
                  onExtraDel={(i) => delStructExtra("guardrail", i)} />
              </div>
            )}
          </BoqSection>
          )}

          {/* ── Accessories ── */}
          <BoqSection title="Accessories (เพิ่มของ)" icon="box" {...secProps("acc")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accList.map((a, i) => {
                const items = a.cat === "พิมพ์เอง" ? [] : (accCat.map[a.cat] || []);
                return (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 11, padding: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 36px", gap: 8, alignItems: "center" }}>
                      <Dropdown value={a.cat || ""} onChange={(v) => setAccCat(i, v)}
                        options={[{ value: "", label: "— เลือกหมวด —" }].concat(accCat.cats.map((c) => ({ value: c, label: c }))).concat([{ value: "พิมพ์เอง", label: "✎ พิมพ์เอง" }])} />
                      <button onClick={() => delAcc(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 72px", gap: 8, alignItems: "center" }}>
                      {a.cat === "พิมพ์เอง"
                        ? <input value={a.name} onChange={(e) => setAcc(i, "name", e.target.value)} placeholder="ชื่อวัสดุ" style={inputStyle} />
                        : <Dropdown value={a.name || ""} onChange={(v) => setAcc(i, "name", v)} disabled={!a.cat} options={[{ value: "", label: a.cat ? "— เลือกวัสดุ —" : "เลือกหมวดก่อน" }].concat(matItemOptions(items, a.cat))} />}
                      <input type="number" style={numStyle} value={a.qty} placeholder="จำนวน" onChange={(e) => setAcc(i, "qty", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button onClick={addAcc} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มของ</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* เลือกหมวด → เลือกวัสดุ (จากราคาวัสดุ + คลังสินค้า) หรือ "พิมพ์เอง" — ถ้ามีราคาในระบบจะคิดต้นทุนให้</div>
          </BoqSection>

          {/* ── ผลลัพธ์ BOQ ── */}
          <BoqSection title="รายการวัสดุที่ถอดได้" icon="box" {...secProps("removable")}
            right={priced.grandTotal > 0 ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>รวม ฿{baht(priced.grandTotal)}</span> : null}>
            {/* ── สรุปต้นทุนต่อ kW ── ตัวเลขที่ใช้เทียบข้ามงานได้จริง ── */}
            {priced.grandTotal > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 8, fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>
                  ต้นทุนต่อวัตต์ · {Math.round(result.meta.kw * 1000).toLocaleString()} W ({result.meta.kw.toLocaleString()} kW)
                </div>
                <div className="bq-spec">
                  <div><span className="k">ค่าวัสดุ</span><span className="v">฿{baht(priced.matPerW)}/W</span></div>
                  <div data-miss={priced.laborTotal > 0 ? "0" : "1"}><span className="k">ค่าแรง</span><span className="v">{priced.laborTotal > 0 ? "฿" + baht(priced.laborPerW) + "/W" : "ยังไม่ตั้งเรต"}</span></div>
                  <div data-miss={priced.permitTotal > 0 ? "0" : "1"}><span className="k">ค่าขออนุญาต</span><span className="v">{priced.permitTotal > 0 ? "฿" + baht(priced.permitPerW) + "/W" : "ยังไม่กรอก"}</span></div>
                  <div><span className="k">รวมทั้งหมด</span><span className="v hi">฿{baht(priced.perW)}/W</span></div>
                </div>
                {/* แยกรายหมวด เรียงจากแพงสุด — หาว่าเงินหายไปไหนได้ในบรรทัดเดียว */}
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  {priced.groups.filter((g) => g.subtotal > 0).slice().sort((a, c) => c.subtotal - a.subtotal).map((g, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) 78px" : "150px 1fr 96px 84px", gap: 8, alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: GROUP_COLOR[g.group] || "var(--text-3)", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.group}</span>
                      </span>
                      {!isMobile && (
                        <span style={{ height: 6, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
                          <span style={{ display: "block", height: "100%", width: Math.max(2, (g.subtotal / priced.grandTotal) * 100) + "%", background: GROUP_COLOR[g.group] || "var(--text-3)", borderRadius: 99 }} />
                        </span>
                      )}
                      {!isMobile && <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>฿{baht(g.subtotal)}</span>}
                      <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 800, color: "var(--primary-dark)", fontVariantNumeric: "tabular-nums" }} title={"฿" + baht(g.perKw) + "/kW"}>฿{baht(g.perW)}/W</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {priced.groups.map((g, gi) => (
                <div key={gi}>
                  {/* หัวหมวดลอยติดขอบบนตอนเลื่อน — รายการยาว ๆ จะได้รู้ตลอดว่าอ่านอยู่หมวดไหน */}
                  <div style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 14px", background: "var(--surface2)", borderTop: gi ? "1px solid var(--border)" : "none",
                    boxShadow: "inset 0 -1px 0 var(--border)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: GROUP_COLOR[g.group] || "var(--text-3)", flexShrink: 0 }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-2)", letterSpacing: ".09em" }}>{g.group}</span>
                    {/* ยอดรายหมวด + บาทต่อ kW — เห็นทันทีว่าหมวดไหนกินต้นทุนเท่าไรต่อกำลังติดตั้ง */}
                    <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {g.subtotal > 0
                        ? "฿" + baht(g.subtotal) + (g.perW > 0 ? " · ฿" + baht(g.perW) + "/W" : "")
                        : (g.items.length ? g.items.length + " รายการ" : "")}
                    </span>
                  </div>
                  {g.items.length === 0 ? (
                    <div style={{ padding: "9px 14px", fontSize: 12, color: "var(--text-3)" }}>—</div>
                  ) : g.items.map((it, ii) => (
                    <div key={ii} style={{ display: "grid", gridTemplateColumns: isMobile ? (priced.grandTotal > 0 ? "minmax(0,1fr) 46px 64px" : "minmax(0,1fr) auto") : "1fr 56px 84px", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-1)", lineHeight: 1.35 }}>{(it.name || "").trim()}</span>
                        {it.code ? <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{it.code}</span> : null}
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, letterSpacing: "-.02em",
                          fontVariantNumeric: "tabular-nums", color: "var(--text-1)" }}>{(Math.round(it.qty * 100) / 100).toLocaleString()}</span>
                        <span style={{ display: "block", fontSize: 9.5, fontWeight: 600, letterSpacing: ".04em", color: "var(--text-3)" }}>{it.unit}</span>
                      </span>
                      {(!isMobile || priced.grandTotal > 0) && (
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                          color: it.total > 0 ? "var(--text-1)" : "var(--text-3)" }}>{it.total > 0 ? baht(it.total) : "–"}</span>
                        {it.price > 0 ? <span style={{ display: "block", fontSize: 9.5, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>@{baht(it.price)}</span> : null}
                      </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {priced.grandTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "13px 14px",
                  background: "var(--primary-soft)", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "var(--primary-dark)" }}>ต้นทุนรวม</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, letterSpacing: "-.035em",
                    fontVariantNumeric: "tabular-nums", color: "var(--primary-dark)" }}>฿{baht(priced.grandTotal)}</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* ราคาดึงจากเมนู "ราคาวัสดุ" — รายการที่ยังไม่ใส่ราคาจะขึ้น "–"</div>
          </BoqSection>
          </div>
        </div>
      </div>

      {/* สรุปติดขอบล่าง — เห็นตัวเลขเปลี่ยนทันทีขณะแก้ ไม่ต้องเลื่อนไปดูท้ายรายการ */}
      <div className="bq-foot">
        <span className="bq-kpis">
        <span className="bq-kpi"><span className="k">จำนวนแผง</span><span className="v">{(b.panels || 0).toLocaleString()}<small>แผง</small></span></span>
        <span className="bq-kpi"><span className="k">ขนาดติดตั้ง</span><span className="v">{result.meta.kw.toLocaleString()}<small>kW</small></span></span>
        <span className="bq-kpi"><span className="k">{b.inverterModel ? "อินเวอร์เตอร์" : "ไมโคร"}</span><span className="v">{result.meta.invCount}<small>ตัว</small></span></span>
        <span className="bq-kpi"><span className="k">รายการวัสดุ</span><span className="v">{itemCount.toLocaleString()}<small>รายการ</small></span></span>
        <span className="bq-kpi"><span className="k">ต้นทุนรวม</span><span className="v hi">{priced.grandTotal > 0 ? "฿" + baht(priced.grandTotal) : "—"}</span></span>
        <span className="bq-kpi" title={priced.perKw > 0 ? "฿" + baht(priced.perKw) + "/kW" : ""}><span className="k">ต่อวัตต์</span><span className="v hi">{priced.perW > 0 ? "฿" + baht(priced.perW) : "—"}</span></span>
        </span>
        <span className="bq-gap" />
        {remaining !== 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: "#B45309", marginRight: 12, whiteSpace: "nowrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,.22)" }} />
            ยังวางแผงไม่ครบ {Math.abs(remaining)} แผง
          </span>
        )}
        <button className="bq-btn" style={{ marginRight: 8 }} onClick={onClose}>ปิด</button>
        <button className="bq-btn gh" style={{ marginRight: 8 }} onClick={() => guardRun(exportXlsx)}><Icon name="box" size={15} color="#1d854b" /> Excel</button>
        {onSave && <button className="bq-btn pri" onClick={() => guardRun(() => onSave(b))}><Icon name="check" size={15} color="#fff" /> บันทึก BOQ</button>}
      </div>
    </div>
  );
}

/* การ์ดเนื้อหา 1 หัวข้อ — เลือกจากแถบซ้าย · หัวข้อที่ไม่ได้เลือกไม่เรนเดอร์เลย */
function BoqSection({ title, icon, right, children, open }) {
  if (!open) return null;
  return (
    <div className="bq-card">
      <div className="hd">
        <Icon name={icon} size={15} color="var(--primary)" />
        <span className="t">{title}</span>
        {right && <span className="r">{right}</span>}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { BOQEditor });
