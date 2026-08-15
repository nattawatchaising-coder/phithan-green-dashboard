/* ============================================================
   PHITHAN GREEN — เวิร์กสเปซ "ออกแบบระบบ & ผลผลิต 15 ปี"
   เปิดจากโหมดวางแผง 3D · ใช้ทิศ/มุมของแผงจริงจากโมเดล
   คำนวณทั้งหมดอยู่ใน solarcalc.jsx (ไฟล์นี้เป็น UI ล้วน)
   ============================================================ */
const SU_CSS = `
.su{position:fixed;inset:0;z-index:130;background:var(--bg);display:flex;flex-direction:column}
.su-body{flex:1;min-height:0;display:flex}
.su-rail{width:212px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);
  padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto}
.su-main{flex:1;min-width:0;overflow-y:auto;padding:20px 22px 26px;background:var(--bg)}
.su-wrap{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

/* ---- ขั้นตอนด้านซ้าย ---- */
.su-step{display:flex;gap:10px;align-items:flex-start;padding:10px 10px;border-radius:12px;border:none;
  background:transparent;text-align:left;width:100%;transition:background .15s ease}
.su-step:hover{background:var(--surface2)}
.su-step[data-on="1"]{background:var(--acs)}
.su-step .no{width:21px;height:21px;border-radius:99px;flex:0 0 auto;display:grid;place-items:center;
  font-size:10.5px;font-weight:800;background:var(--surface3);color:var(--text-3);margin-top:1px}
.su-step[data-on="1"] .no{background:var(--ac);color:#fff}
.su-step[data-done="1"] .no{background:var(--acs);color:var(--acd)}
.su-step .tt{font-size:12.5px;font-weight:700;color:var(--text-1);line-height:1.35}
.su-step[data-on="1"] .tt{color:var(--acd)}
.su-step .sb{font-size:10.5px;color:var(--text-3);line-height:1.45;margin-top:2px;
  overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

/* ---- แถบสรุปล่าง ---- */
.su-foot{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);
  padding:10px 18px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:0}
.su-kpi{display:flex;flex-direction:column;gap:2px;padding:0 16px;border-left:1px solid var(--ln);min-width:0}
.su-kpi:first-child{border-left:none;padding-left:0}
.su-kpi .k{font-size:9.5px;font-weight:700;color:var(--text-3);white-space:nowrap}
.su-kpi .v{font-size:15px;font-weight:800;color:var(--text-1);letter-spacing:-.3px;white-space:nowrap}
.su-kpi .v small{font-size:10px;font-weight:700;color:var(--text-3);margin-left:2px}

/* ---- การ์ดเลือกโหมด ---- */
.su-pick{display:flex;gap:10px}
.su-pick button{flex:1;display:flex;flex-direction:column;gap:7px;align-items:flex-start;padding:13px 14px;
  border-radius:14px;border:1.5px solid var(--ln2);background:var(--surface);text-align:left;transition:all .15s ease}
.su-pick button:hover{border-color:var(--text-3)}
.su-pick button[data-on="1"]{border-color:var(--ac);background:var(--acs);box-shadow:0 0 0 3px var(--acs)}
.su-pick .h{font-size:13px;font-weight:800;color:var(--text-1)}
.su-pick button[data-on="1"] .h{color:var(--acd)}
.su-pick .d{font-size:10.5px;color:var(--text-3);line-height:1.55}

/* ---- ตาราง ---- */
.su-tb{width:100%;border-collapse:collapse;font-size:11.5px}
.su-tb th{text-align:left;font-size:9.5px;font-weight:800;color:var(--text-3);padding:0 8px 6px;white-space:nowrap}
.su-tb td{padding:6px 8px;border-top:1px solid var(--ln);color:var(--text-2);font-variant-numeric:tabular-nums}
.su-tb tr[data-on="1"] td{background:var(--acs)}
.su-tb td b{color:var(--text-1);font-weight:800}
.su-scroll{overflow-x:auto;margin:0 -2px;padding:0 2px}
/* ช่องเลือก MPPT ในตาราง — เตี้ยกว่าอินพุตปกติ ให้แถวไม่บวม และจางไว้จนกว่าจะปักเอง */
.su-slot{width:auto;min-width:186px;padding:3px 6px;font-size:11px;font-weight:700;
  border-color:transparent;background:transparent;color:var(--text-2);cursor:pointer}
.su-slot:hover{border-color:var(--ln2);background:var(--surface2)}
.su-slot[data-pick="1"]{border-color:var(--ac);background:var(--acs);color:var(--text-1)}
/* ปุ่มสลับแบบยาว (ข้อความล้วน) — เวอร์ชันเดิมออกแบบไว้ให้ไอคอนซ้อนข้อความ เลยแคบไป */
.su .p3-seg.wide{gap:3px}
.su .p3-seg.wide button{flex-direction:row;padding:6px 16px;font-size:10.5px;white-space:nowrap;min-width:74px;justify-content:center}
/* ตารางที่กดเลือกแถวได้ */
.su-pick-row tbody tr{cursor:pointer;transition:background .12s ease}
.su-pick-row tbody tr:hover td{background:var(--surface2)}
.su-pick-row tbody tr[data-on="1"] td{background:var(--acs)}
.su-pick-row tbody tr[data-on="1"] td:first-child{box-shadow:inset 2px 0 0 var(--ac)}

/* ---- แผ่นเลือกเนื้อหารายงาน ---- */
.su-sheet-bg{position:absolute;inset:0;z-index:40;background:rgba(11,25,20,.42);backdrop-filter:blur(2px);
  display:grid;place-items:center;padding:26px;animation:suFade .16s ease}
@keyframes suFade{from{opacity:0}to{opacity:1}}
.su-sheet{width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--surface);
  border:1px solid var(--ln2);border-radius:20px;box-shadow:0 26px 60px -18px rgba(11,25,20,.42);overflow:hidden}
.su-sheet-hd{display:flex;gap:12px;align-items:flex-start;padding:17px 20px 14px;border-bottom:1px solid var(--ln)}
.su-sheet-hd h4{font-size:14px;font-weight:800;color:var(--text-1);margin:0 0 2px}
.su-sheet-hd p{font-size:10.5px;color:var(--text-3);margin:0;line-height:1.5}
.su-sheet-bd{overflow-y:auto;padding:8px 12px 12px}
.su-sheet-ft{display:flex;align-items:center;gap:8px;padding:13px 16px;border-top:1px solid var(--ln);background:var(--surface2)}
/* แถวติ๊ก — ทั้งแถวกดได้ ไม่ต้องเล็งช่องสี่เหลี่ยม */
.su-ck{display:flex;gap:11px;align-items:flex-start;width:100%;padding:9px 10px;border:0;border-radius:12px;
  background:none;text-align:left;cursor:pointer;font-family:inherit;transition:background .13s}
.su-ck:hover{background:var(--surface2)}
.su-ck .bx{flex:0 0 auto;width:18px;height:18px;border-radius:6px;border:1.5px solid var(--ln2);margin-top:1px;
  display:grid;place-items:center;color:#fff;transition:all .13s}
.su-ck[data-on="1"] .bx{background:var(--ac);border-color:var(--ac)}
.su-ck .tx{min-width:0}
.su-ck .tx b{display:block;font-size:12px;font-weight:700;color:var(--text-1);line-height:1.35}
.su-ck .tx i{display:block;font-style:normal;font-size:10px;color:var(--text-3);line-height:1.45;margin-top:1px}
.su-ck[data-on="0"] .tx b{color:var(--text-3)}
.su-ck.sub{padding-left:14px;margin-left:22px}
.su-ck.sub .tx b{font-size:11.5px;font-weight:650}
.su-ck.sub[data-off="1"]{opacity:.4;pointer-events:none}
.su-sheet-bd .grp+.grp{border-top:1px solid var(--ln)}

/* ---- กรอบรายชื่อเส้น I-V + กำลัง ---- */
.su-ivlegend{display:flex;flex-wrap:wrap;gap:5px 14px;border:1px solid var(--ln);border-radius:10px;
  padding:8px 11px;font-size:10px}
.su-ivlegend span{display:flex;align-items:center;gap:5px;font-weight:700;color:var(--text-2);white-space:nowrap}
.su-ivlegend i{width:13px;height:3px;border-radius:2px;display:block;flex:0 0 auto}
.su-ivlegend i.dash{background:repeating-linear-gradient(90deg,var(--text-3) 0 4px,transparent 4px 7px)}
.su-ivlegend b{font-weight:800;color:var(--text-1);font-variant-numeric:tabular-nums}
.su-ivlegend .mute{color:var(--text-3);font-weight:650}

/* ---- แบ่งเฟส L1/L2/L3 ---- */
.su-phgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}
.su-phcard{display:flex;flex-direction:column;gap:4px;padding:11px 13px;border-radius:13px;
  border:1px solid var(--ln2);background:var(--surface);position:relative;overflow:hidden}
.su-phcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px}
.su-phcard[data-ph="1"]::before{background:#D97706}
.su-phcard[data-ph="2"]::before{background:#2563EB}
.su-phcard[data-ph="3"]::before{background:#0F7A43}
.su-phcard .hd{display:flex;align-items:baseline;gap:7px}
.su-phcard .hd b{font-size:13px;font-weight:800;letter-spacing:.04em}
.su-phcard .hd i{font-style:normal;font-size:10px;font-weight:700;color:var(--text-3);margin-left:auto}
.su-phcard .big{font-size:21px;font-weight:800;letter-spacing:-.5px;line-height:1.1}
.su-phcard .big small{font-size:10px;font-weight:700;color:var(--text-3);margin-left:3px}
.su-phcard .sub{font-size:9.5px;font-weight:650;color:var(--text-3)}
.su-phcard .bar{display:block;height:4px;border-radius:99px;background:var(--surface3);overflow:hidden;margin-top:2px}
.su-phcard .bar i{display:block;height:100%;border-radius:99px;background:currentColor;opacity:.75}
.su-phcard[data-ph="1"] .bar i{background:#D97706}
.su-phcard[data-ph="2"] .bar i{background:#2563EB}
.su-phcard[data-ph="3"] .bar i{background:#0F7A43}
.su-phcard .us{font-size:9px;font-weight:700;color:var(--text-3);letter-spacing:.02em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ปุ่มเลือกเฟสในตาราง */
.su-phpick{display:inline-flex;gap:3px}
.su-phpick button{border:1px solid var(--ln2);background:var(--surface);color:var(--text-3);
  font-family:inherit;font-size:10px;font-weight:800;padding:3px 8px;border-radius:7px;cursor:pointer;letter-spacing:.02em}
.su-phpick button:hover{border-color:var(--ac);color:var(--text-1)}
.su-phpick button[data-on="1"][data-ph="1"]{background:#FEF3E2;border-color:#D97706;color:var(--tint-amber-tx)}
.su-phpick button[data-on="1"][data-ph="2"]{background:#E8F0FE;border-color:#2563EB;color:#1D4ED8}
.su-phpick button[data-on="1"][data-ph="3"]{background:var(--acs);border-color:var(--ac);color:var(--acd)}

/* ---- ไมโครอินเวอร์เตอร์: การ์ดเลือกอัตราส่วน ---- */
.su-mgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.su-mcard{display:flex;flex-direction:column;gap:7px;text-align:left;cursor:pointer;font-family:inherit;
  padding:13px 14px;border-radius:14px;border:1.5px solid var(--ln2);background:var(--surface);
  color:var(--text-1);transition:border-color .15s,background .15s,box-shadow .15s}
.su-mcard:hover{border-color:var(--ac)}
.su-mcard[data-on="1"]{border-color:var(--ac);background:var(--acs);box-shadow:0 1px 3px rgba(13,23,20,.07)}
.su-mcard[data-bad="1"]{border-color:rgba(185,28,28,.38)}
.su-mcard .rt{display:flex;align-items:center;gap:9px}
.su-mcard .rt b{font-size:13.5px;font-weight:800;letter-spacing:-.1px}
.su-mcard .tag{margin-left:auto;font-size:8.5px;font-weight:800;padding:2px 7px;border-radius:99px;
  background:var(--ac);color:#fff;white-space:nowrap}
.su-mcard .tag.bad{background:var(--dngr)}
.su-mcard .mo{font-size:10px;color:var(--text-3);line-height:1.45;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.su-mcard .st{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding-top:7px;border-top:1px solid var(--ln)}
.su-mcard .st span{display:flex;flex-direction:column;gap:1px;min-width:0}
.su-mcard .st i{font-style:normal;font-size:8.5px;font-weight:700;color:var(--text-3);letter-spacing:.02em}
.su-mcard .st b{font-size:12.5px;font-weight:800;letter-spacing:-.2px}
.su-mcard .wy{font-size:9.5px;font-weight:650;color:var(--text-3);line-height:1.45}
.su-mcard[data-on="1"] .wy{color:var(--acd)}
/* กล่องอธิบายหลักการทำงานของไมโคร */
.su-mfact{display:flex;gap:10px;align-items:flex-start;padding:11px 13px;border-radius:12px;
  background:var(--acs);border-left:3px solid var(--ac);font-size:10.5px;line-height:1.65;color:var(--text-2)}
.su-mfact .ic{color:var(--acd);flex:0 0 auto;margin-top:1px}
.su-mfact b{color:var(--text-1)}

/* ---- แถวตัวเลขสรุป (ใช้ซ้ำได้ทุกการ์ด) ---- */
.su-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:9px}
.su-tiles>div{display:flex;flex-direction:column;gap:2px;min-width:0;padding:10px 12px;border-radius:12px;
  background:var(--surface2);border:1px solid var(--ln)}
.su-tiles .k{font-size:9.5px;font-weight:800;color:var(--text-3);letter-spacing:.02em}
.su-tiles .v{font-size:18px;font-weight:800;letter-spacing:-.4px;color:var(--text-1);line-height:1.2;
  font-variant-numeric:tabular-nums}
.su-tiles .v small{font-size:9.5px;font-weight:700;color:var(--text-3);margin-left:4px;letter-spacing:0}
.su-tiles .d{font-size:9.5px;font-weight:650;color:var(--text-3);line-height:1.45}
.su-tiles>div[data-good="1"] .v{color:var(--acd)}
.su-tiles>div[data-good="0"] .v{color:var(--tint-amber-tx)}

/* ---- คำอธิบายสีของกราฟไฟทั้งวัน ---- */
.su-flg{display:flex;flex-wrap:wrap;gap:5px 14px;align-items:center}
.su-flg span{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:var(--text-2)}
.su-flg i{width:10px;height:10px;border-radius:3px;flex:0 0 auto}
.su-flg i.dash{width:14px;height:0;border-top:1.6px dashed #0F172A;border-radius:0;opacity:.65}

/* ---- ตัวแก้รูปโหลด 24 ช่อง ---- */
.su-h24{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px}
.su-h24 label{display:flex;flex-direction:column;gap:2px;min-width:0}
.su-h24 i{font-style:normal;font-size:8.5px;font-weight:800;color:var(--text-3);text-align:center}
.su-h24 input{width:100%;padding:4px 2px;text-align:center;font-size:10.5px;font-weight:700;
  border:1px solid var(--ln2);border-radius:7px;background:var(--surface);color:var(--text-1);font-family:inherit}
.su-h24 input:focus{outline:none;border-color:var(--ac)}
@media (max-width:820px){.su-h24{grid-template-columns:repeat(6,minmax(0,1fr))}}

/* ---- ป้ายที่มาของค่า ---- */
.su-src{font-size:8.5px;font-weight:800;padding:2px 6px;border-radius:99px;letter-spacing:.02em;white-space:nowrap}
.su-src.stock{background:var(--acs);color:var(--acd)}
.su-src.def{background:var(--surface3);color:var(--text-3)}
.su-src.edit{background:rgba(37,99,235,.12);color:#1D4ED8}

/* ---- จอแคบ: ขั้นตอนย้ายมาเป็นแถบนอนด้านบน ---- */
@media (max-width:820px){
  .su-body{flex-direction:column}
  .su-rail{width:100%;flex-direction:row;gap:6px;overflow-x:auto;padding:10px 12px;border-right:none;border-bottom:1px solid var(--border)}
  .su-rail>.p3-eb,.su-rail>div:last-child{display:none}
  .su-step{width:auto;flex:1 0 auto;min-width:132px;padding:8px 10px}
  .su-main{padding:14px 13px 20px}
  .su-pick{flex-direction:column}
  .su-foot{overflow-x:auto;gap:0;padding:9px 12px}
  .su-kpi{padding:0 11px}
}

.su-bar{height:8px;border-radius:99px;background:var(--surface3);overflow:hidden}
.su-bar span{display:block;height:100%;border-radius:99px;transition:width .3s ease}
.su-alert{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;line-height:1.6;border-radius:11px;padding:9px 11px}
.su-alert.warn{background:rgba(245,158,11,.11);border:1px solid rgba(180,83,9,.22);color:#8A4408}
.su-alert.bad{background:rgba(185,28,28,.08);border:1px solid rgba(185,28,28,.24);color:#991B1B}
.su-alert.good{background:var(--acs);border:1px solid transparent;color:var(--acd)}
.su-alert.info{background:rgba(37,99,235,.07);border:1px solid rgba(37,99,235,.18);color:#1D4ED8}

/* ---- ปุ่มเดินดูทีละเดือน ---- */
.su-mstep{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--ln2);border-radius:99px;
  padding:2px 3px;background:var(--surface)}
.su-mstep b{font-size:10.5px;font-weight:700;color:var(--text-2);padding:0 6px;white-space:nowrap;
  min-width:118px;text-align:center}
.su-mstep button{width:21px;height:21px;border:none;border-radius:99px;background:transparent;cursor:pointer;
  display:grid;place-items:center;color:var(--text-3);padding:0;transition:background .12s ease,color .12s ease}
.su-mstep button:hover{background:var(--acs);color:var(--acd)}
.su-mstep button:first-child{transform:rotate(180deg)}

/* ---- ผลกระทบต่อสิ่งแวดล้อม ---- */
.su-env{display:grid;grid-template-columns:minmax(210px,.9fr) 2fr;gap:14px;align-items:stretch}
.su-env .hero{display:flex;flex-direction:column;gap:5px;justify-content:center;padding:14px 15px;border-radius:14px;
  background:linear-gradient(140deg,var(--acs),transparent 78%);border:1px solid var(--ln2)}
.su-env .hero .eb{font-size:9px;font-weight:800;letter-spacing:.14em;color:var(--acd);text-transform:uppercase}
.su-env .hero .big{font-family:var(--font-num,inherit);font-size:38px;font-weight:800;letter-spacing:-.045em;
  line-height:1;color:var(--text-1);font-variant-numeric:tabular-nums;display:flex;align-items:baseline;gap:7px}
.su-env .hero .big small{font-size:12px;font-weight:800;letter-spacing:0;color:var(--acd)}
.su-env .hero .sub{font-size:9.5px;line-height:1.6;color:var(--text-3)}
.su-env .hero .sub b{color:var(--text-2)}
.su-env .tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;
  background:var(--ln);border:1px solid var(--ln);border-radius:14px;overflow:hidden}
.su-env .tile{display:flex;flex-direction:column;gap:3px;padding:12px 13px;background:var(--surface);color:var(--acd)}
.su-env .tile .v{font-family:var(--font-num,inherit);font-size:20px;font-weight:800;letter-spacing:-.03em;
  color:var(--text-1);line-height:1.05;font-variant-numeric:tabular-nums}
.su-env .tile .v small{font-size:9.5px;font-weight:700;color:var(--text-3);margin-left:4px;letter-spacing:0}
.su-env .tile .lb{font-size:10px;font-weight:700;color:var(--text-2)}
.su-env .tile .sb{font-size:8.5px;color:var(--text-3);line-height:1.4}
.su-env-pb{display:flex;align-items:center;gap:11px;padding-top:10px;border-top:1px solid var(--ln)}
.su-env-pb .l{font-size:10.5px;font-weight:700;color:var(--text-2);white-space:nowrap}
.su-env-pb .bar{flex:1;height:7px;border-radius:99px;background:var(--surface3);overflow:hidden}
.su-env-pb .bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#22A35B,#0F7A43)}
.su-env-pb .r{font-size:10px;font-weight:700;color:var(--text-3);white-space:nowrap}
.su-env-pb .r b{font-family:var(--font-num,inherit);font-size:14px;color:var(--text-1);letter-spacing:-.3px}
@media (max-width:720px){ .su-env{grid-template-columns:1fr} }

/* ---- คำอธิบายระดับเงาบนแผนที่ดวงอาทิตย์ ---- */
.su-isolg{display:flex;flex-wrap:wrap;gap:5px 12px;align-items:center}
.su-isolg span{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:700;color:var(--text-3)}
.su-isolg i{width:13px;height:9px;border-radius:2px;display:block}
`;

/* กล่องกรอกเลขพร้อมป้ายบอกที่มาของค่า (คลัง / ค่ากลาง / แก้เอง) */
function SuSpec({ label, value, src, suffix, step, onChange, onReset }) {
  return (
    <label className="p3-f">
      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span className={"su-src " + src} style={{ marginLeft: "auto" }}>{src === "stock" ? "คลัง" : src === "edit" ? "แก้เอง" : "ค่ากลาง"}</span>
        {src === "edit" && <button className="p3-lnk" style={{ fontSize: 9.5 }} onClick={(e) => { e.preventDefault(); onReset(); }}>คืนค่า</button>}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {/* 0 = ยังไม่ได้กรอกจากดาต้าชีต — โชว์ช่องว่างพร้อมคำใบ้ ดีกว่าโชว์ "0" ที่อ่านเหมือนค่าจริง */}
        <input className="p3-inp" type="number" step={step || 0.01} placeholder="ยังไม่ระบุ"
          value={value == null || value === 0 ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? null : +e.target.value)} />
        {suffix && <span className="p3-sfx">{suffix}</span>}
      </span>
    </label>
  );
}

/* เข็มทิศเล็ก + มุมเอียง — บอกทิศทางของกลุ่มแผงแบบเห็นภาพ */
function SuFacing({ tilt, az, size }) {
  const s = size || 46, r = s / 2 - 3;
  const a = (az - 90) * Math.PI / 180;
  return (
    <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} style={{ display: "block", flex: "0 0 auto" }}>
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="var(--ln2)" strokeWidth="1" />
      <text x={s / 2} y="8" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--text-3)">N</text>
      <line x1={s / 2} y1={s / 2} x2={s / 2 + Math.cos(a) * r * 0.82} y2={s / 2 + Math.sin(a) * r * 0.82}
        stroke="var(--ac)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={s / 2} cy={s / 2} r="2.4" fill="var(--ac)" />
      <text x={s / 2} y={s - 1} textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--text-2)">{Math.round(tilt)}°</text>
    </svg>
  );
}

/* ภาพเล็ก ๆ ของอัตราส่วน แผง : ไมโคร — แผงกี่ใบเสียบเข้ากล่องเดียว และมี MPPT กี่ช่อง
   เส้นจากแผงลงกล่อง = 1 เส้นต่อ 1 ช่อง MPPT (เห็นทันทีว่าแยกอิสระกี่ทาง) */
function SuMicroGlyph({ per, mppt, on }) {
  const n = Math.max(1, per || 1);
  const W = 20 + n * 22, H = 40;
  const c = on ? "var(--ac)" : "var(--text-3)";
  const indep = (mppt || 1) >= n;                    // ช่องเท่าจำนวนแผง = อิสระทุกใบ
  return (
    <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ display: "block", flex: "0 0 auto" }}>
      {Array.from({ length: n }).map((_, i) => {
        const x = 10 + i * 22;
        return (
          <g key={i}>
            <rect x={x} y="3" width="17" height="11" rx="2" fill={on ? "var(--acs)" : "transparent"} stroke={c} strokeWidth="1.4" />
            <path d={"M" + (x + 8.5) + " 14 v" + (indep ? 8 : 5)} stroke={c} strokeWidth="1.4" strokeLinecap="round"
              strokeDasharray={indep ? null : "2 2"} />
          </g>
        );
      })}
      {!indep && <path d={"M18.5 19 H" + (10 + (n - 1) * 22 + 8.5) + " V22"} stroke={c} strokeWidth="1.4" fill="none" />}
      <rect x="6" y="22" width={W - 12} height="12" rx="3" fill={on ? "var(--ac)" : "transparent"} stroke={c} strokeWidth="1.4" />
      <path d={"M" + (W / 2) + " 34 v4"} stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ── แถบแรงดัน: ให้เห็นด้วยตาว่าสตริงยาวเท่านี้ "ตกอยู่ในช่วงทำงาน" หรือหลุด ── */
function SuVoltBand({ rows, inv, sel, onPick }) {
  const vmin = scNum(inv.mpptVmin), vmax = scNum(inv.mpptVmax), vdc = scNum(inv.maxVdc);
  const top = Math.max(vdc, vmax) * 1.06 || 1;
  const px = (v) => Math.max(0, Math.min(100, v / top * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {/* สเกลบนสุด */}
      <div style={{ position: "relative", height: 15, fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>
        <span style={{ position: "absolute", left: px(vmin) + "%", transform: "translateX(-50%)" }}>{vmin}V</span>
        <span style={{ position: "absolute", left: px(vmax) + "%", transform: "translateX(-50%)" }}>{vmax}V</span>
        {vdc ? <span style={{ position: "absolute", left: px(vdc) + "%", transform: "translateX(-50%)", color: "var(--tint-red-tx)" }}>{vdc}V</span> : null}
      </div>
      {rows.map((r) => {
        const lo = px(r.vmpHot), hi = px(r.vmpCold);
        const on = sel === r.n;
        return (
          <button key={r.n} onClick={() => onPick && onPick(r.n)} title={r.ok ? "แรงดันทำงาน " + r.vmpHot + "–" + r.vmpCold + " V · Voc เย็น " + r.vocCold + " V" : r.fails.join(" · ")}
            style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid " + (on ? "var(--ac)" : "transparent"),
              background: on ? "var(--acs)" : "transparent", borderRadius: 10, padding: "5px 7px", width: "100%", textAlign: "left" }}>
            <span style={{ width: 30, fontSize: 11.5, fontWeight: 800, color: r.ok ? "var(--text-1)" : "var(--text-3)", flex: "0 0 auto" }}>{r.n}</span>
            <span style={{ position: "relative", flex: 1, height: 18, borderRadius: 6, background: "var(--surface2)", overflow: "hidden" }}>
              {/* ช่วงทำงาน MPPT = พื้นเขียวจาง */}
              <span style={{ position: "absolute", left: px(vmin) + "%", width: (px(vmax) - px(vmin)) + "%", top: 0, bottom: 0, background: "rgba(34,163,91,.14)" }} />
              {vdc ? <span style={{ position: "absolute", left: px(vdc) + "%", top: 0, bottom: 0, width: 2, background: "var(--tint-red-tx)" }} /> : null}
              {/* ช่วงแรงดันจริงของสตริงนี้ ร้อน→เย็น */}
              <span style={{ position: "absolute", left: lo + "%", width: Math.max(1.5, hi - lo) + "%", top: 4, height: 10, borderRadius: 99,
                background: r.ok ? "linear-gradient(90deg,#F59E0B,#22A35B)" : "var(--tint-red-tx)", opacity: r.ok ? 1 : .55 }} />
              {/* Voc ตอนอากาศเย็น = ขีดที่ห้ามเลยเส้นแดง */}
              <span style={{ position: "absolute", left: px(r.vocCold) + "%", top: 1, bottom: 1, width: 2, background: r.vocCold > vdc && vdc ? "var(--tint-red-tx)" : "var(--text-3)" }} />
            </span>
            <span style={{ width: 54, textAlign: "right", fontSize: 10, fontWeight: 800, flex: "0 0 auto",
              color: r.ok ? (r.score >= 75 ? "var(--acd)" : "var(--text-2)") : "var(--tint-red-tx)" }}>{r.ok ? r.band : "ไม่ผ่าน"}</span>
          </button>
        );
      })}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", paddingLeft: 39 }}>
        <span><b style={{ color: "#F59E0B" }}>■</b> แผงร้อน (แรงดันต่ำสุด)</span>
        <span><b style={{ color: "#22A35B" }}>■</b> อากาศเย็น (แรงดันสูงสุด)</span>
        <span><b style={{ color: "var(--tint-red-tx)" }}>│</b> เพดาน Voc</span>
      </div>
    </div>
  );
}

/* สีประจำสตริง — ไล่โทนให้แยกออกจากกันชัดแม้อยู่ติดกัน */
const SU_SCOLOR = ["#22A35B", "#2563EB", "#D97706", "#7C3AED", "var(--tint-red-tx2)", "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#4F46E5"];
const suColor = (i) => SU_SCOLOR[(i - 1 + SU_SCOLOR.length) % SU_SCOLOR.length];

/* ── ผังแผง 2D (มองจากด้านบน) — แตะ/ลากเพื่อจัดแผงเข้าสตริง ──
   foot = ผลจาก p3FootAll(st) · assign = { uid: หมายเลขสตริง } */
/* labels = { uid: "L1" } เขียนทับบนแผง · colorOf(uid, กลุ่ม) = แทนที่สีประจำกลุ่ม · unitName = คำเรียกในทูลทิป */
function SuLayout2D({ foot, assign, active, onPaint, height, labels, colorOf, unitName }) {
  const wrapRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const b = foot.bounds;
  const pad = 1.2;
  const W = (b.maxX - b.minX) + pad * 2, H = (b.maxZ - b.minZ) + pad * 2;
  const vb = (b.minX - pad) + " " + (b.minZ - pad) + " " + Math.max(1, W) + " " + Math.max(1, H);
  /* ลากผ่านแผงไหนก็ทาแผงนั้น — ใช้ elementFromPoint เพื่อให้ลากยาว ๆ ได้ลื่น ไม่ต้องแตะทีละแผง */
  const paintAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.dataset && el.dataset.uid) onPaint(el.dataset.uid);
  };
  return (
    <div ref={wrapRef} style={{ position: "relative", borderRadius: 12, border: "1px solid var(--ln)", background: "var(--surface2)", overflow: "hidden", touchAction: "none" }}>
      <svg viewBox={vb} style={{ width: "100%", height: height || 340, display: "block", cursor: active ? "crosshair" : "default" }}
        onPointerDown={(e) => { if (!active) return;
          /* จับ pointer ไว้เพื่อให้ลากออกนอก svg แล้วยังทาต่อได้ — บางเบราว์เซอร์โยน error ถ้า pointer ไม่ active */
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
          setDrag(true); paintAt(e); }}
        onPointerMove={(e) => { if (drag && active) paintAt(e); }}
        onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)}>
        {/* เส้นขอบผืนหลังคา */}
        {foot.outlines.map((o, i) => (
          <polygon key={i} points={o.pts.map((p) => p[0] + "," + p[1]).join(" ")}
            fill="rgba(148,163,184,.10)" stroke="var(--ln2)" strokeWidth="0.08" />
        ))}
        {/* แผง */}
        {foot.panels.map((p) => {
          const s = assign[p.uid] || 0;
          const c = s ? (colorOf ? colorOf(p.uid, s) : suColor(s)) : null;
          const un = unitName || "สตริง";
          return (
            <polygon key={p.uid} data-uid={p.uid} points={p.pts.map((q) => q[0] + "," + q[1]).join(" ")}
              fill={c ? c : "#CBD5E1"} fillOpacity={c ? 0.88 : 0.5}
              stroke={c ? "#fff" : "#94A3B8"} strokeWidth="0.035" strokeDasharray={c ? null : "0.12 0.09"}
              style={{ cursor: active ? "crosshair" : "pointer" }}>
              <title>{p.roofName + " · " + p.key + (s ? " · " + un + " " + s : " · ยังไม่อยู่" + un + "ไหน")
                + (labels && labels[p.uid] ? " · เฟส " + labels[p.uid] : "")}</title>
            </polygon>
          );
        })}
        {/* ป้ายบอกเฟสบนแผงแต่ละใบ — เขียนทับตรงกลางแผง ให้อ่านออกแม้พิมพ์ขาวดำ
            pointerEvents none เพื่อไม่ให้บังการแตะทาสีแผง */}
        {labels && foot.panels.map((p) => {
          const t = labels[p.uid];
          if (!t) return null;
          const cx = p.pts.reduce((a, q) => a + q[0], 0) / p.pts.length;
          const cz = p.pts.reduce((a, q) => a + q[1], 0) / p.pts.length;
          return (
            <text key={"L" + p.uid} x={cx} y={cz + 0.16} textAnchor="middle" fontSize="0.44" fontWeight="800"
              fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth="0.05" paintOrder="stroke"
              style={{ pointerEvents: "none", userSelect: "none" }}>{t}</text>
          );
        })}
        {/* เข็มทิศ: บนจอ +Z = ทิศใต้ ตามฉาก 3 มิติ */}
        <g transform={"translate(" + (b.minX - pad + 0.7) + "," + (b.minZ - pad + 0.7) + ")"}>
          <line x1="0" y1="0" x2="0" y2="1.1" stroke="var(--tint-red-tx)" strokeWidth="0.09" />
          <text x="0" y="-0.15" fontSize="0.62" fontWeight="800" fill="var(--tint-red-tx)" textAnchor="middle">N</text>
        </g>
      </svg>
    </div>
  );
}

/* ── กราฟแท่งรายเดือน ── */
function SuMonthly({ data }) {
  const max = Math.max.apply(null, data.concat([1]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 128 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--text-3)" }}>{Math.round(v / 100) / 10}k</span>
          <div title={SC_MON[i] + " · " + v.toLocaleString() + " kWh"}
            style={{ width: "100%", height: Math.max(2, v / max * 88), borderRadius: "5px 5px 2px 2px",
              background: "linear-gradient(180deg,#3DBE74,#1E8A4C)" }} />
          <span style={{ fontSize: 8.5, color: "var(--text-3)", fontWeight: 700 }}>{SC_MON[i].replace(".", "")}</span>
        </div>
      ))}
    </div>
  );
}

/* ── กราฟผลผลิตสะสม/รายปี 15 ปี (พื้นที่ + เส้นเสื่อม) ── */
function SuLifeChart({ rows }) {
  const W = 560, H = 132, pad = 4;
  const max = Math.max.apply(null, rows.map((r) => r.kwh));
  const x = (i) => pad + i / Math.max(1, rows.length - 1) * (W - pad * 2);
  const y = (v) => H - 18 - (v / max) * (H - 34);
  const line = rows.map((r, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(r.kwh).toFixed(1)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="suFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22A35B" stopOpacity=".28" /><stop offset="100%" stopColor="#22A35B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={line + " L" + x(rows.length - 1) + " " + (H - 18) + " L" + x(0) + " " + (H - 18) + " Z"} fill="url(#suFill)" />
      <path d={line} fill="none" stroke="#22A35B" strokeWidth="2" strokeLinejoin="round" />
      {rows.map((r, i) => (i % 2 === 0 || i === rows.length - 1) && (
        <g key={i}>
          <circle cx={x(i)} cy={y(r.kwh)} r="2.6" fill="#fff" stroke="#22A35B" strokeWidth="1.6" />
          <text x={x(i)} y={H - 5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--text-3)">ปี {r.year}</text>
        </g>
      ))}
    </svg>
  );
}

/* ตัวช่วยลากเลื่อนเวลาบนกราฟรายวัน — ใช้ร่วมกันทั้งกราฟแสงและกราฟกำลังไฟ
   (เก็บ element ไว้ก่อน เพราะ React เคลียร์ currentTarget ทิ้งหลังจบ handler) */
function suScrub(geo, onHour) {
  if (!onHour) return null;
  return (e) => {
    const el = e.currentTarget;
    const pick = (cx) => {
      const b = el.getBoundingClientRect();
      const f = (cx - b.left) / b.width * geo.W;
      onHour(scClamp(geo.h0 + (f - geo.L) / (geo.W - geo.L - geo.R) * (geo.h1 - geo.h0), geo.h0, geo.h1));
    };
    pick(e.clientX);
    const move = (ev) => pick(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}

/* ── กราฟความเข้มแสงตลอดวัน ──
   เส้นเทา = แสงบนพื้นราบ · พื้นเขียว = แสงที่ตกบนหน้าแผงจริงหลังหักเงา
   แถบลายทแยง = ส่วนที่เงาบังกินไป (เห็นชัดว่าตึก/ต้นไม้บังช่วงไหนของวัน) */
function SuDayLight({ sim, groups, hour, onHour }) {
  const W = 660, H = 254, L = 44, R = 14, T = 20, B = 30;
  if (!sim || !sim.rows.length) return null;
  const top = Math.max(200, sim.maxGhi, sim.maxPoa) * 1.1;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Y = (v) => H - B - v / top * (H - T - B);
  const path = (f) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Y(f(r)).toFixed(1)).join(" ");
  const area = (f) => path(f) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Y(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Y(0) + " Z";
  const cur = sim.rows.reduce((a, r) => (Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a), sim.rows[0]);
  const ticks = [];
  for (let h = Math.ceil(h0); h <= h1; h++) if (h % 2 === 0) ticks.push(h);
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible", cursor: onHour ? "col-resize" : "default" }}
        onPointerDown={suScrub({ W, L, R, h0, h1 }, onHour)}>
        <defs>
          <linearGradient id="suPoaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22A35B" stopOpacity=".30" /><stop offset="100%" stopColor="#22A35B" stopOpacity=".02" />
          </linearGradient>
          <pattern id="suShadeHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(71,85,105,.20)" /><line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="2" opacity=".55" />
          </pattern>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, k) => (
          <g key={k}>
            <line x1={L} y1={Y(top * f)} x2={W - R} y2={Y(top * f)} stroke="var(--ln)" strokeWidth="1" strokeDasharray={f ? "3 4" : null} />
            <text x={L - 7} y={Y(top * f) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{Math.round(top * f)}</text>
          </g>
        ))}
        {ticks.map((h) => (
          <text key={h} x={X(h)} y={H - B + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{h}:00</text>
        ))}
        <text x={L - 7} y={9} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">W/m²</text>
        {/* ส่วนที่เงากิน = ระหว่างเส้น POA เต็ม กับ POA หลังหักเงา */}
        {sim.shadeFrom != null && (
          <path d={path((r) => r.poaAvg) + " " + sim.rows.slice().reverse().map((r, i) =>
            (i ? "L" : "L") + X(r.h).toFixed(1) + " " + Y(r.per && groups.length ? poaNetAvg(r, groups) : 0).toFixed(1)).join(" ") + " Z"}
            fill="url(#suShadeHatch)" />
        )}
        <path d={area((r) => (groups.length ? poaNetAvg(r, groups) : 0))} fill="url(#suPoaFill)" />
        <path d={path((r) => r.ghi)} fill="none" stroke="var(--text-3)" strokeWidth="1.4" strokeDasharray="5 4" />
        <path d={path((r) => r.poaAvg)} fill="none" stroke="#22A35B" strokeWidth="1.3" opacity=".45" />
        <path d={path((r) => (groups.length ? poaNetAvg(r, groups) : 0))} fill="none" stroke="#22A35B" strokeWidth="2.3" strokeLinejoin="round" />
        {/* เส้นเวลาปัจจุบัน */}
        <line x1={X(cur.h)} y1={T} x2={X(cur.h)} y2={H - B} stroke="var(--ac)" strokeWidth="1.6" />
        <circle cx={X(cur.h)} cy={Y(groups.length ? poaNetAvg(cur, groups) : 0)} r="4.5" fill="#fff" stroke="var(--ac)" strokeWidth="2.2" />
        <g transform={"translate(" + scClamp(X(cur.h), L + 4, W - R - 96) + "," + (T + 2) + ")"}>
          <rect width="94" height="17" rx="5" fill="var(--ac)" />
          <text x="47" y="12" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
            {ivHM(cur.h)} · {Math.round(groups.length ? poaNetAvg(cur, groups) : 0)} W/m²
          </text>
        </g>
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700, paddingLeft: 44 }}>
        <span><b style={{ color: "var(--text-3)" }}>┅</b> แสงบนพื้นราบ</span>
        <span><b style={{ color: "#22A35B" }}>━</b> แสงบนหน้าแผงจริง (หลังหักเงา)</span>
        {sim.shadeFrom != null && <span><b style={{ color: "#475569" }}>▨</b> ส่วนที่เงาบังกินไป</span>}
      </div>
    </div>
  );
}
/* แสงบนหน้าแผงหลังหักเงา เฉลี่ยถ่วงน้ำหนักด้วยจำนวนแผงของแต่ละกลุ่ม */
function poaNetAvg(row, groups) {
  let s = 0, n = 0;
  groups.forEach((g) => { const p = row.per[g.key]; if (p) { s += p.poaNet * g.count; n += g.count; } });
  return n ? s / n : 0;
}

/* ── กำลังไฟ + อุณหภูมิเซลล์ ตลอดวัน ── */
function SuDayPower({ sim, groups, acKw, hour, onHour }) {
  const W = 660, H = 214, L = 42, R = 42, T = 36, B = 28;
  if (!sim || !sim.rows.length) return null;
  const pTop = Math.max(1, sim.rows.reduce((a, r) => Math.max(a, r.dc), 0)) * 1.12;
  const tTop = 90;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Yp = (v) => H - B - v / pTop * (H - T - B);
  const Yt = (v) => H - B - v / tTop * (H - T - B);
  const line = (f, Yf) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Yf(f(r)).toFixed(1)).join(" ");
  const tOf = (r) => { let s = 0, n = 0; groups.forEach((g) => { const p = r.per[g.key]; if (p) { s += p.tCell * g.count; n += g.count; } }); return n ? s / n : 0; };
  const cur = sim.rows.reduce((a, r) => (Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a), sim.rows[0]);
  return (
    <svg viewBox={"0 0 " + W + " " + H} onPointerDown={suScrub({ W, L, R, h0, h1 }, onHour)}
      style={{ width: "100%", display: "block", overflow: "visible", cursor: onHour ? "col-resize" : "default" }}>
      {[0, 0.5, 1].map((f, k) => (
        <g key={k}>
          <line x1={L} y1={Yp(pTop * f)} x2={W - R} y2={Yp(pTop * f)} stroke="var(--ln)" strokeWidth="1" strokeDasharray={f ? "3 4" : null} />
          <text x={L - 6} y={Yp(pTop * f) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(pTop * f, 1)}</text>
          <text x={W - R + 6} y={Yt(tTop * f) + 3.5} fontSize="9" fontWeight="700" fill="var(--tint-red-tx2)">{Math.round(tTop * f)}</text>
        </g>
      ))}
      <text x={L - 6} y={9} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">kW</text>
      <text x={W - R + 6} y={9} fontSize="8.5" fontWeight="800" fill="var(--tint-red-tx2)">°C</text>
      {/* เพดานอินเวอร์เตอร์ */}
      {acKw > 0 && acKw < pTop && (
        <g>
          <line x1={L} y1={Yp(acKw)} x2={W - R} y2={Yp(acKw)} stroke="var(--tint-amber-tx)" strokeWidth="1.4" strokeDasharray="5 3" />
          <text x={W - R - 2} y={Yp(acKw) - 4} textAnchor="end" fontSize="9" fontWeight="800" fill="var(--tint-amber-tx)">เพดานอินเวอร์เตอร์ {acKw} kW</text>
        </g>
      )}
      <path d={line((r) => r.dc, Yp) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Yp(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Yp(0) + " Z"}
        fill="rgba(34,163,91,.14)" />
      <path d={line((r) => r.dc, Yp)} fill="none" stroke="#22A35B" strokeWidth="1.4" strokeDasharray="4 3" />
      <path d={line((r) => r.ac, Yp)} fill="none" stroke="#0F7A43" strokeWidth="2.3" strokeLinejoin="round" />
      <path d={line(tOf, Yt)} fill="none" stroke="var(--tint-red-tx2)" strokeWidth="1.7" strokeLinejoin="round" opacity=".85" />
      {/* จุดสูงสุดของแต่ละเส้น พร้อมตัวเลข */}
      {(() => {
        const pk = sim.rows.reduce((a, r) => (r.ac > a.ac ? r : a), sim.rows[0]);
        const tk = sim.rows.reduce((a, r) => (tOf(r) > tOf(a) ? r : a), sim.rows[0]);
        /* ถ้าจุดสูงสุดอยู่ตรงกับเวลาที่กำลังดูอยู่ ไม่ต้องเขียนซ้ำ (กล่องค่าปัจจุบันบอกอยู่แล้ว) */
        const farP = Math.abs(pk.h - cur.h) > 0.9, farT = Math.abs(tk.h - cur.h) > 0.9;
        return (
          <React.Fragment>
            <circle cx={X(pk.h)} cy={Yp(pk.ac)} r="3.2" fill="#fff" stroke="#0F7A43" strokeWidth="1.8" />
            {farP && (
              <text x={scClamp(X(pk.h), L + 34, W - R - 34)} y={Yp(pk.ac) - 7} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#0F7A43">
                สูงสุด {scR(pk.ac, 2)} kW
              </text>
            )}
            <circle cx={X(tk.h)} cy={Yt(tOf(tk))} r="3" fill="#fff" stroke="var(--tint-red-tx2)" strokeWidth="1.6" />
            {farT && (
              <text x={scClamp(X(tk.h), L + 30, W - R - 30)} y={Yt(tOf(tk)) - 6} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--tint-red-tx2)">
                ร้อนสุด {scR(tOf(tk), 0)}°C
              </text>
            )}
          </React.Fragment>
        );
      })()}
      {/* ค่าที่เวลาปัจจุบัน */}
      <line x1={X(cur.h)} y1={T} x2={X(cur.h)} y2={H - B} stroke="var(--ac)" strokeWidth="1.4" />
      <circle cx={X(cur.h)} cy={Yp(cur.ac)} r="4" fill="#fff" stroke="var(--ac)" strokeWidth="2" />
      <circle cx={X(cur.h)} cy={Yt(tOf(cur))} r="3.4" fill="#fff" stroke="var(--tint-red-tx2)" strokeWidth="1.8" />
      <g transform={"translate(" + scClamp(X(cur.h) + 7, L, W - R - 104) + "," + (T + 1) + ")"}>
        <rect width="102" height="30" rx="6" fill="var(--surface)" stroke="var(--ln2)" />
        <text x="7" y="13" fontSize="9.5" fontWeight="800" fill="var(--text-2)">{ivHM(cur.h)}</text>
        <text x="95" y="13" textAnchor="end" fontSize="9.5" fontWeight="800" fill="#0F7A43">{scR(cur.ac, 2)} kW</text>
        <text x="7" y="25" fontSize="9" fontWeight="700" fill="var(--text-3)">DC {scR(cur.dc, 2)}</text>
        <text x="95" y="25" textAnchor="end" fontSize="9" fontWeight="800" fill="var(--tint-red-tx2)">เซลล์ {scR(tOf(cur), 0)}°C</text>
      </g>
      {[6, 9, 12, 15, 18].filter((h) => h >= h0 && h <= h1).map((h) => (
        <text key={h} x={X(h)} y={H - B + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{h}:00</text>
      ))}
    </svg>
  );
}

/* ── แผนที่ทั้งปี: เดือน × ชั่วโมง ──
   โหมด "แสง" = ความเข้มแสงบนหน้าแผงจริง · โหมด "เงา" = โดนบังกี่ % ณ ชั่วโมงนั้น
   อ่านได้ทันทีว่าเงามาช่วงไหนของวัน เดือนไหนของปี */
function SuYearMap({ year, mode, month, onMonth }) {
  if (!year || !year.months.length) return null;
  const hrs = year.hours;
  const colLight = (v) => {
    if (v <= 2) return "var(--surface3)";
    const t = scClamp(v / Math.max(1, year.maxPoa), 0, 1);
    /* ไล่จาก ฟ้าอ่อน → เขียว → เหลือง → ส้ม ตามความแรง */
    const stops = [[219, 234, 254], [134, 211, 180], [74, 179, 122], [250, 204, 21], [245, 158, 11]];
    const f = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(f)), k = f - i;
    const c = [0, 1, 2].map((j) => Math.round(stops[i][j] + (stops[i + 1][j] - stops[i][j]) * k));
    return "rgb(" + c.join(",") + ")";
  };
  const colShade = (v, poa) => {
    if (poa <= 2) return "var(--surface3)";
    if (v <= 0.5) return "#E8F5ED";
    return v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)";
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 34 }}>
        {hrs.map((h) => (
          <span key={h} style={{ flex: 1, fontSize: 8, fontWeight: 700, color: "var(--text-3)", textAlign: "center", minWidth: 0 }}>
            {h % 2 === 0 ? h : ""}
          </span>
        ))}
      </div>
      {year.months.map((mo) => (
        <div key={mo.m} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => onMonth && onMonth(mo)} title={mo.label + " · " + mo.dayKwh + " kWh/วัน · เงา " + mo.shadeLossPct + "%"}
            style={{ width: 34, flex: "0 0 auto", fontSize: 9.5, fontWeight: 800, textAlign: "right", border: "none", background: "none",
              color: month === mo.m ? "var(--acd)" : "var(--text-3)", cursor: "pointer", padding: 0 }}>
            {mo.label.replace(".", "")}
          </button>
          <span style={{ display: "flex", flex: 1, gap: 1, height: 15, borderRadius: 4, overflow: "hidden",
            outline: month === mo.m ? "1.5px solid var(--ac)" : "none", outlineOffset: 1 }}>
            {mo.cells.map((c, i) => (
              <span key={i} title={mo.label + " " + ivHM(c.h) + " · แสง " + c.poa + " W/m²" + (c.shade > 0.5 ? " · เงาบัง " + c.shade + "%" : "")}
                style={{ flex: 1, background: mode === "shade" ? colShade(c.shade, c.poa) : colLight(c.poa) }} />
            ))}
          </span>
          <span style={{ width: 54, flex: "0 0 auto", fontSize: 9.5, fontWeight: 700, textAlign: "right",
            color: mode === "shade" ? (mo.shadeLossPct >= 5 ? "var(--tint-red-tx)" : mo.shadeLossPct > 0 ? "var(--tint-amber-tx)" : "var(--text-3)") : "var(--text-2)" }}>
            {mode === "shade" ? mo.shadeLossPct + "%" : Math.round(mo.monthKwh / 100) / 10 + "k"}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 40, marginTop: 3, fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        {mode === "shade" ? (
          <React.Fragment>
            <span><b style={{ color: "#E8F5ED" }}>■</b> ไม่มีเงา</span>
            <span><b style={{ color: "var(--tint-amber-bd)" }}>■</b> บังบางส่วน</span>
            <span><b style={{ color: "#F59E0B" }}>■</b> บังมาก</span>
            <span><b style={{ color: "var(--tint-red-tx2)" }}>■</b> บังเกือบหมด</span>
            <span style={{ marginLeft: "auto" }}>ขวาสุด = เสียไปกี่ % ของเดือนนั้น</span>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <span>อ่อน = แดดน้อย</span>
            <span><b style={{ color: "#4AB37A" }}>■</b> ปานกลาง</span>
            <span><b style={{ color: "#F59E0B" }}>■</b> แรงสุด {year.maxPoa} W/m²</span>
            <span style={{ marginLeft: "auto" }}>ขวาสุด = ผลผลิตทั้งเดือน (kWh)</span>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ── แถบเงารายชั่วโมง: สตริงไหนโดนบังตอนไหนของวัน ── */
function SuShadeStrip({ sim, groups }) {
  if (!sim || !sim.rows.length) return null;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const col = (v) => (v <= 0.5 ? "var(--surface3)" : v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {groups.map((g) => (
        <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 118, flex: "0 0 auto", fontSize: 10, fontWeight: 700, color: "var(--text-2)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={g.label}>{g.roofName}{g.side ? " · " + g.side : ""}</span>
          <span style={{ display: "flex", flex: 1, height: 15, borderRadius: 5, overflow: "hidden", gap: 1 }}>
            {sim.rows.map((r, i) => {
              const v = r.per[g.key] ? r.per[g.key].shade : 0;
              return <span key={i} title={ivHM(r.h) + " · เงาบัง " + v + "%"} style={{ flex: 1, background: col(v) }} />;
            })}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 127, fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>
        <span>{ivHM(h0)}</span><span>เที่ยง</span><span>{ivHM(h1)}</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 127, fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        <span><b style={{ color: "#E5E9E6" }}>■</b> ไม่มีเงา</span>
        <span><b style={{ color: "var(--tint-amber-bd)" }}>■</b> บังบางส่วน</span>
        <span><b style={{ color: "#F59E0B" }}>■</b> บังมาก</span>
        <span><b style={{ color: "var(--tint-red-tx2)" }}>■</b> บังเกือบหมด</span>
      </div>
    </div>
  );
}

/* ── กราฟเส้น I-V + P-V ──
   exp = เส้นที่ควรได้ ณ สภาพอากาศตอนวัด · stcRef = เส้นเดียวกันแต่ที่มาตรฐาน STC
   meas = ค่าที่วัดได้จริง (แต้มจุด ไม่ลากเส้น เพราะเครื่องวัดส่วนใหญ่รายงานแค่ 5 ค่า) */
/* curves = [{ id, name, curve, color }] · focusId = ดูสตริงเดียว (null = รวมทุกสตริง)
   โหมดรวม: วาดทุกเส้นแยกสี ไม่มีเส้นกำลัง/พื้นระบาย เพื่อไม่ให้ลายตา
   โหมดเดี่ยว: ใส่พื้นระบาย เส้นกำลัง และจุด MPP พร้อมตัวเลขเต็ม */
function SuIvChart({ curves, stcRef, meas, height, focusId }) {
  /* สูงกว่าปกติตั้งใจ — หลายเส้นทับกันแถวหัวเข่า ต้องมีพื้นที่แนวตั้งพอถึงจะแยกออก */
  const W = 620, H = 372, L = 46, R = 48, T = 16, B = 32;
  const list = (curves || []).filter((x) => x && x.curve);
  if (!list.length) return null;
  const solo = focusId != null ? list.find((x) => x.id === focusId) : null;
  const exp = solo ? solo.curve : list[0].curve;
  const mx = (f) => list.reduce((a, x) => Math.max(a, f(x.curve)), 0);
  const vTop = Math.max(mx((c) => c.voc), stcRef ? stcRef.voc : 0, meas && meas.voc ? meas.voc : 0) * 1.07;
  const iTop = Math.max(mx((c) => c.isc), stcRef ? stcRef.isc : 0, meas && meas.isc ? meas.isc : 0) * 1.16;
  const pTop = Math.max(mx((c) => c.pmax), stcRef ? stcRef.pmax : 0, meas && meas.pmax ? meas.pmax : 0) * 1.16;
  const X = (v) => L + v / vTop * (W - L - R);
  const Yi = (i) => H - B - i / iTop * (H - T - B);
  const Yp = (p) => H - B - p / pTop * (H - T - B);
  const path = (pts, fy, fv) => pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  const ivOf = (c) => path(c.pts, Yi, (q) => q.i);
  const pvOf = (c) => path(c.pts, Yp, (q) => q.p);
  const gridV = 5, gridI = 4;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: height || "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="suIvFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22A35B" stopOpacity=".16" /><stop offset="100%" stopColor="#22A35B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* เส้นตาราง + สเกล */}
      {Array.from({ length: gridI + 1 }).map((_, k) => {
        const y = T + (H - T - B) * k / gridI, iv = iTop * (1 - k / gridI), pv = pTop * (1 - k / gridI);
        return (
          <g key={"h" + k}>
            <line x1={L} y1={y} x2={W - R} y2={y} stroke="var(--ln)" strokeWidth="1" strokeDasharray={k === gridI ? null : "3 4"} />
            <text x={L - 7} y={y + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(iv, iTop > 20 ? 0 : 1)}</text>
            <text x={W - R + 7} y={y + 3.5} fontSize="9" fontWeight="700" fill="var(--tint-amber-tx)">{pv >= 1000 ? scR(pv / 1000, 1) + "k" : scR(pv, 0)}</text>
          </g>
        );
      })}
      {Array.from({ length: gridV + 1 }).map((_, k) => {
        const v = vTop * k / gridV;
        return (
          <g key={"v" + k}>
            <line x1={X(v)} y1={T} x2={X(v)} y2={H - B} stroke="var(--ln)" strokeWidth="1" strokeDasharray="3 4" opacity={k ? 1 : 0} />
            <text x={X(v)} y={H - B + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(v, 0)}</text>
          </g>
        );
      })}
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ln2)" strokeWidth="1.2" />
      <text x={L - 7} y={T - 5} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">A</text>
      <text x={W - R + 7} y={T - 5} fontSize="8.5" fontWeight="800" fill="var(--tint-amber-tx)">W</text>
      <text x={W - R} y={H - 4} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">แรงดัน (V)</text>

      {/* เส้นอ้างอิงที่ STC — จาง ๆ ไว้เทียบว่าอากาศตอนวัดกินไปเท่าไหร่ */}
      {stcRef && <path d={ivOf(stcRef)} fill="none" stroke="var(--text-3)" strokeWidth="1.3" strokeDasharray="5 4" opacity=".5" />}
      {solo ? (
        /* ── ดูสตริงเดียว: เต็มรูปแบบ ── */
        <g>
          <path d={ivOf(exp) + " L" + X(exp.voc) + " " + Yi(0) + " L" + X(0) + " " + Yi(0) + " Z"} fill="url(#suIvFill)" />
          <path d={ivOf(exp)} fill="none" stroke={solo.color || "#22A35B"} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={pvOf(exp)} fill="none" stroke="#D97706" strokeWidth="1.7" strokeDasharray="4 3" />
          <line x1={X(exp.vmp)} y1={Yi(exp.imp)} x2={X(exp.vmp)} y2={H - B} stroke={solo.color || "#22A35B"} strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          <line x1={L} y1={Yi(exp.imp)} x2={X(exp.vmp)} y2={Yi(exp.imp)} stroke={solo.color || "#22A35B"} strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          <circle cx={X(exp.vmp)} cy={Yi(exp.imp)} r="4" fill="#fff" stroke={solo.color || "#22A35B"} strokeWidth="2.2" />
          <text x={X(exp.vmp)} y={Yi(exp.imp) - 9} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={solo.color || "var(--acd)"}>
            {scR(exp.pmax >= 1000 ? exp.pmax / 1000 : exp.pmax, 2)}{exp.pmax >= 1000 ? " kW" : " W"}
          </text>
        </g>
      ) : (
        /* ── รวมทุกสตริง: แยกสี จุด MPP + ชื่อกำกับ ── */
        <g>
          {list.map((x) => (
            <g key={x.id}>
              <path d={ivOf(x.curve)} fill="none" stroke={x.color} strokeWidth="2" strokeLinejoin="round" opacity=".92" />
              <circle cx={X(x.curve.vmp)} cy={Yi(x.curve.imp)} r="3.6" fill="#fff" stroke={x.color} strokeWidth="2" />
            </g>
          ))}
          {/* กรอบชื่อเส้น + กำลัง วางในกราฟมุมซ้ายล่าง — ช่วงแรงดันต่ำกระแสยังอยู่บนสุด พื้นที่ตรงนี้จึงว่างเสมอ */}
          {(() => {
            const rows = list.map((x) => ({ c: x.color, t: x.name, v: scR(scNum(x.watt, x.curve.pmax), 0).toLocaleString() + " W" }))
              .concat([{ c: null, t: "ที่มาตรฐาน STC (1000 W/m² · 25°C)", v: "" }]);
            const cols = rows.length > 10 ? 2 : 1;
            const per = Math.ceil(rows.length / cols);
            const rh = 12, cw = cols > 1 ? 158 : 176, pad = 7;
            const bw = cw * cols + pad, bh = per * rh + pad * 1.6, bx = L + 52, by = H - B - bh - 12;
            return (
              <g>
                <rect x={bx} y={by} width={bw} height={bh} rx="6" fill="var(--surface)" fillOpacity="0.93" stroke="var(--ln2)" />
                {rows.map((r, i) => {
                  const cx = bx + pad + Math.floor(i / per) * cw, cy = by + pad + (i % per) * rh + 7;
                  return (
                    <g key={i}>
                      <rect x={cx} y={cy - 3.4} width="12" height="3" rx="1.5" fill={r.c || "var(--text-3)"} fillOpacity={r.c ? 1 : 0.55} />
                      <text x={cx + 17} y={cy} fontSize="8.5" fontWeight={r.c ? 700 : 600} fill={r.c ? "var(--text-2)" : "var(--text-3)"}>{r.t}</text>
                      {r.v && <text x={cx + cw - 12} y={cy} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-1)">{r.v}</text>}
                    </g>
                  );
                })}
              </g>
            );
          })()}
        </g>
      )}
      {/* ค่าที่วัดได้จริง */}
      {meas && (meas.voc || meas.isc) && (
        <g>
          {meas.voc ? <g><circle cx={X(meas.voc)} cy={Yi(0)} r="4.2" fill="#2563EB" />
            <text x={X(meas.voc)} y={Yi(0) - 8} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1D4ED8">Voc</text></g> : null}
          {meas.isc ? <g><circle cx={X(0)} cy={Yi(meas.isc)} r="4.2" fill="#2563EB" />
            <text x={X(0) + 8} y={Yi(meas.isc) - 5} fontSize="9" fontWeight="800" fill="#1D4ED8">Isc</text></g> : null}
          {meas.vmp && meas.imp ? <g>
            <circle cx={X(meas.vmp)} cy={Yi(meas.imp)} r="5" fill="#2563EB" stroke="#fff" strokeWidth="1.6" />
            <text x={X(meas.vmp)} y={Yi(meas.imp) + 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1D4ED8">วัดได้</text>
          </g> : null}
        </g>
      )}
    </svg>
  );
}

/* ============================================================
   ชุดเส้น I-V & P-V ที่ความเข้มแสง / อุณหภูมิต่าง ๆ
   ============================================================ */
const SU_GRAMP = ["#0B5F35", "#15803D", "#22A35B", "#6FC48F", "#B3DEC4"];
const SU_TRAMP = ["#1D4ED8", "#0F7A43", "#D97706", "var(--tint-red-tx2)"];
function SuIvFamily({ curves, mode, showPv }) {
  const W = 620, H = 356, L = 46, R = 50, T = 18, B = 32;
  const list = (curves || []).filter(Boolean);
  if (!list.length) return null;
  const ramp = mode === "temp" ? SU_TRAMP : SU_GRAMP;
  const colOf = (i) => ramp[Math.min(i, ramp.length - 1)];
  const vTop = list.reduce((a, c) => Math.max(a, c.voc), 0) * 1.08;
  const iTop = list.reduce((a, c) => Math.max(a, c.isc), 0) * 1.14;
  const pTop = list.reduce((a, c) => Math.max(a, c.pmax), 0) * 1.14;
  const X = (v) => L + v / vTop * (W - L - R);
  const Yi = (i) => H - B - i / iTop * (H - T - B);
  const Yp = (p) => H - B - p / pTop * (H - T - B);
  const path = (pts, fy, fv) => pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  const gI = 4, gV = 5;
  /* เส้นร้อยจุดกำลังสูงสุดของทุกเส้น — เห็นทันทีว่า MPPT ต้องไล่ตามจุดไปทางไหน */
  const locus = list.map((c, k) => (k ? "L" : "M") + X(c.vmp).toFixed(1) + " " + Yi(c.imp).toFixed(1)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      {Array.from({ length: gI + 1 }).map((_, k) => {
        const y = T + (H - T - B) * k / gI, iv = iTop * (1 - k / gI), pv = pTop * (1 - k / gI);
        return (
          <g key={"h" + k}>
            <line x1={L} y1={y} x2={W - R} y2={y} stroke="var(--ln)" strokeWidth="1" strokeDasharray={k === gI ? null : "3 4"} />
            <text x={L - 7} y={y + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(iv, iTop > 20 ? 0 : 1)}</text>
            {showPv && <text x={W - R + 7} y={y + 3.5} fontSize="9" fontWeight="700" fill="var(--tint-amber-tx)">{pv >= 1000 ? scR(pv / 1000, 1) + "k" : scR(pv, 0)}</text>}
          </g>
        );
      })}
      {Array.from({ length: gV + 1 }).map((_, k) => {
        const v = vTop * k / gV;
        return (
          <g key={"v" + k}>
            <line x1={X(v)} y1={T} x2={X(v)} y2={H - B} stroke="var(--ln)" strokeWidth="1" strokeDasharray="3 4" opacity={k ? 1 : 0} />
            <text x={X(v)} y={H - B + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(v, 0)}</text>
          </g>
        );
      })}
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ln2)" strokeWidth="1.2" />
      <text x={L - 7} y={T - 5} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">A</text>
      {showPv && <text x={W - R + 7} y={T - 5} fontSize="8.5" fontWeight="800" fill="var(--tint-amber-tx)">W</text>}
      <text x={W - R} y={H - 4} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">แรงดัน (V)</text>

      {showPv && <path d={locus} fill="none" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="2 4" opacity=".5" />}
      {list.map((c, i) => (
        <g key={c.key}>
          {showPv && <path d={path(c.pts, Yp, (q) => q.p)} fill="none" stroke={colOf(i)} strokeWidth="1.4" strokeDasharray="4 3" opacity=".75" />}
          <path d={path(c.pts, Yi, (q) => q.i)} fill="none" stroke={colOf(i)} strokeWidth="2.1" strokeLinejoin="round" />
          <circle cx={X(c.vmp)} cy={Yi(c.imp)} r="3.6" fill="var(--surface)" stroke={colOf(i)} strokeWidth="2" />
        </g>
      ))}
      {/* กรอบสรุปมุมซ้ายล่าง — ช่วงแรงดันต่ำเส้นทุกเส้นอยู่บนสุดเสมอ พื้นที่ตรงนี้จึงว่างแน่นอน */}
      {(() => {
        const rh = 12.5, cw = 196, pad = 8;
        const bh = list.length * rh + pad * 2 + 12, bx = L + 20, by = H - B - bh - 10;
        return (
          <g>
            <rect x={bx} y={by} width={cw + pad} height={bh} rx="7" fill="var(--surface)" fillOpacity=".94" stroke="var(--ln2)" />
            <text x={bx + pad} y={by + pad + 8} fontSize="8" fontWeight="800" fill="var(--text-3)" letterSpacing=".08em">
              {mode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง"}
            </text>
            {list.map((c, i) => {
              const cy = by + pad + 20 + i * rh + 3;
              return (
                <g key={c.key}>
                  <rect x={bx + pad} y={cy - 3.4} width="13" height="3" rx="1.5" fill={colOf(i)} />
                  <text x={bx + pad + 19} y={cy} fontSize="8.5" fontWeight="700" fill="var(--text-2)">{c.label}</text>
                  <text x={bx + pad + 86} y={cy} fontSize="8.5" fontWeight="700" fill="var(--text-3)">{scR(c.vmp, 0)} V · {scR(c.imp, 1)} A</text>
                  <text x={bx + cw - 4} y={cy} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-1)">
                    {c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : scR(c.pmax, 0) + " W"}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}
    </svg>
  );
}

/* ============================================================
   เส้นทางเดินดวงอาทิตย์ + แผนที่เงาบัง
   ============================================================ */
/* ระดับเงาบังแบบขั้นบันได — อ่านง่ายกว่าไล่เฉดต่อเนื่อง เพราะดูออกว่า "เกินกี่ %" ตรงไหน */
const SU_ISO = [
  { at: 0.40, c: "var(--tint-red-tx)", o: 0.85, lb: "40%+" },
  { at: 0.20, c: "var(--tint-red-tx2)", o: 0.60, lb: "20–40%" },
  { at: 0.10, c: "#F59E0B", o: 0.62, lb: "10–20%" },
  { at: 0.05, c: "#F59E0B", o: 0.40, lb: "5–10%" },
  { at: 0.01, c: "#F59E0B", o: 0.22, lb: "1–5%" },
];
const suIsoBand = (f) => SU_ISO.find((b) => f >= b.at) || null;
function SuSunPath({ path, iso, mark }) {
  if (!path || !path.paths.length) return null;
  const W = 640, H = 330, L = 40, R = 16, T = 16, B = 30;
  /* แกนทิศต้องเต็ม 0–360° เสมอ — ที่ละติจูดไทย ฤดูร้อนดวงอาทิตย์อ้อมไปทางเหนือจริง ๆ */
  const a0 = 0, a1 = 360, altTop = 90;
  const X = (az) => L + (az - a0) / (a1 - a0) * (W - L - R);
  const Y = (alt) => H - B - scClamp(alt, 0, altTop) / altTop * (H - T - B);
  const cw = iso ? Math.abs(X(iso.azStep) - X(0)) : 0;
  const ch = iso ? Math.abs(Y(0) - Y(iso.altStep)) : 0;
  const compass = [[0, "เหนือ"], [45, "ตอ.เฉียงเหนือ"], [90, "ตะวันออก"], [135, "ตอ.เฉียงใต้"], [180, "ใต้"], [225, "ตต.เฉียงใต้"], [270, "ตะวันตก"], [315, "ตต.เฉียงเหนือ"], [360, "เหนือ"]];
  const line = (pts) => pts.map((q, k) => (k ? "L" : "M") + X(q.az).toFixed(1) + " " + Y(q.alt).toFixed(1)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      <rect x={L} y={T} width={W - L - R} height={H - T - B} rx="6" fill="var(--bg)" opacity=".55" />
      {/* แผนที่เงา — ช่องละ 1 ทิศทางแสง */}
      {iso && iso.cells.map((c, i) => {
        const b = suIsoBand(c.f);
        if (!b) return null;
        return <rect key={i} x={X(c.az) - cw / 2} y={Y(c.alt) - ch / 2} width={cw + 0.6} height={ch + 0.6}
          fill={b.c} opacity={b.o} />;
      })}
      {/* เส้นตาราง */}
      {Array.from({ length: 7 }).map((_, k) => {
        const alt = k * 15;
        return (
          <g key={"a" + k}>
            <line x1={L} y1={Y(alt)} x2={W - R} y2={Y(alt)} stroke="var(--ln)" strokeWidth="1" strokeDasharray={k ? "3 4" : null} opacity=".9" />
            <text x={L - 6} y={Y(alt) + 3.4} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{alt}°</text>
          </g>
        );
      })}
      {compass.map(([az, lb], k) => (
        <g key={k}>
          <line x1={X(az)} y1={T} x2={X(az)} y2={H - B} stroke="var(--ln)" strokeWidth="1" strokeDasharray="3 4"
            opacity={az === 0 || az === 360 ? 0 : 1} />
          <text x={X(az)} y={H - B + 13} textAnchor={az === 0 ? "start" : az === 360 ? "end" : "middle"}
            fontSize="8.5" fontWeight={az === 180 ? 800 : 700}
            fill={az === 180 ? "var(--text-2)" : "var(--text-3)"}>{lb}</text>
        </g>
      ))}
      <text x={L - 6} y={T - 4} textAnchor="end" fontSize="8" fontWeight="800" fill="var(--text-3)">สูง</text>

      {/* เส้นชั่วโมง */}
      {path.hours.map((hr) => (
        <g key={hr.h}>
          {hr.segs.map((sg, k) => (
            <path key={k} d={line(sg)} fill="none" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="2 3" opacity=".55" />
          ))}
          <text x={X(hr.pts[0].az)} y={Y(hr.pts[0].alt) - 5} textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--text-3)" opacity=".9">{hr.h}</text>
        </g>
      ))}
      {/* เส้นทางเดินของแต่ละเดือน */}
      {path.paths.map((p, i) => {
        const main = i === 0 || i === path.paths.length - 1 || i === 3;
        return (
          <g key={p.doy}>
            {p.segs.map((sg, k) => (
              <path key={k} d={line(sg)} fill="none" stroke="var(--tint-amber-tx)" strokeWidth={main ? 1.9 : 1.2}
                opacity={main ? 0.95 : 0.6} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
      {/* ป้ายกำกับเส้นบนสุด/ล่างสุด — ที่เหลือเดาได้จากลำดับ */}
      {[path.paths[0], path.paths[path.paths.length - 1]].map((p, i) => (p && p.peak ? (
        <text key={i} x={scClamp(X(p.peak.az), L + 34, W - R - 34)} y={Y(p.peak.alt) + (i ? 13 : -7)}
          textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--tint-amber-tx)">{p.label}</text>
      ) : null))}
      {/* ดวงอาทิตย์ ณ เวลาที่กำลังดูอยู่ */}
      {mark && mark.alt > 0 && mark.az >= a0 && mark.az <= a1 && (
        <g>
          <circle cx={X(mark.az)} cy={Y(mark.alt)} r="9" fill="#F59E0B" opacity=".22" />
          <circle cx={X(mark.az)} cy={Y(mark.alt)} r="4.6" fill="#F59E0B" stroke="var(--surface)" strokeWidth="1.6" />
          <text x={X(mark.az)} y={Y(mark.alt) - 13} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--tint-amber-tx)">{mark.label || "ตอนนี้"}</text>
        </g>
      )}
    </svg>
  );
}

/* ============================================================
   แผนภาพค่าสูญเสียของระบบ
   ============================================================ */
/* กราฟไหล (Sankey) — ลำน้ำสีเขียวไหลลงจากบนสุด แล้วมีสายแยกออกข้างทางทุกครั้งที่เสียพลังงาน
   ความกว้างของลำน้ำ = พลังงานที่เหลืออยู่จริง · ความหนาของสายที่แยกออก = ที่เสียไปในด่านนั้น
   อ่านได้ในแวบเดียวว่าด่านไหนกินหนัก โดยไม่ต้องไล่อ่านตัวเลขทีละบรรทัด */
function SuLossFlow({ chain }) {
  const rows = (chain || []).filter(Boolean);
  if (!rows.length) return null;
  /* ลำน้ำกว้างขึ้นได้ตอนขึ้นหลังคาเอียง — สเกลจึงต้องอิงค่ามากสุดของทั้งสาย ไม่ใช่บรรทัดแรก */
  const top = rows.reduce((a, r) => Math.max(a, r.kwh || 0), 1);
  const W = 620, X0 = 28, TW = 132, XL = 232, LX = 244;
  const HL = 46, HM = 40, TOP = 12;
  const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
  const wOf = (v) => scClamp(v / top, 0, 1) * TW;
  const seg = [];
  let prev = rows[0].kwh, y = TOP;
  rows.forEach((r) => {
    const h = r.kind === "loss" || r.kind === "gain" ? HL : HM;
    seg.push({ r, y0: y, y1: y + h, wA: wOf(prev), wB: wOf(r.kwh) });
    prev = r.kwh; y += h;
  });
  const last = seg[seg.length - 1];
  const H = last.y1 + 20;
  /* ขอบขวาของลำน้ำหักมุมเป็นขั้น ๆ ตรงกลางแถวที่มีการแยก — สายที่แยกออกจะได้หนาเท่ากันตลอด
     (ถ้าให้ลาดทั้งแถว สายจะบานเป็นปากแตรและอ่านความหนาไม่ได้) */
  const trunk = "M" + X0 + " " + TOP + " L" + (X0 + seg[0].wA).toFixed(1) + " " + TOP + " " +
    seg.map((s) => {
      const yc = (s.y0 + s.y1) / 2;
      return "L" + (X0 + s.wA).toFixed(1) + " " + yc.toFixed(1) +
        " L" + (X0 + s.wB).toFixed(1) + " " + yc.toFixed(1) +
        " L" + (X0 + s.wB).toFixed(1) + " " + s.y1.toFixed(1);
    }).join(" ") +
    " L" + (X0 + last.wB / 2).toFixed(1) + " " + (last.y1 + 14).toFixed(1) +
    " L" + X0 + " " + last.y1.toFixed(1) + " Z";
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "hidden" }}>
      <defs>
        <linearGradient id="suFlowG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ECF84" /><stop offset="55%" stopColor="#22A35B" /><stop offset="100%" stopColor="#0B6B3A" />
        </linearGradient>
      </defs>
      <path d={trunk} fill="url(#suFlowG)" />
      {/* เส้นคั่นบาง ๆ ตรงจุดที่ลำน้ำแคบลง — ทำให้เห็นว่าแต่ละด่านกินไปเท่าไหร่ ทั้งที่คอดลงทีละนิด */}
      {seg.map((s) => (s.r.kind === "loss" || s.r.kind === "gain") && Math.abs(s.wA - s.wB) > 0.2 ? (
        <line key={"t" + s.r.k} x1={X0} y1={(s.y0 + s.y1) / 2} x2={X0 + Math.min(s.wA, s.wB)} y2={(s.y0 + s.y1) / 2}
          stroke="#fff" strokeWidth="1" opacity=".28" />
      ) : null)}
      {seg.map((s) => {
        const R = s.r, yc = (s.y0 + s.y1) / 2;
        const heavy = R.kind === "loss" && R.pct >= 3;
        const zero = R.kind === "loss" && R.loss <= 0;
        /* กำไรกับค่าสูญเสียใช้รูปทรงเดียวกัน ต่างกันที่ทิศทางและสี — สายฟ้าเข้า vs สายที่รั่วออก */
        if (R.kind === "loss" || R.kind === "gain") {
          const gain = R.kind === "gain";
          const col = gain ? "#2563EB" : heavy ? "var(--tint-red-tx2)" : "#EFA53A";
          /* ความหนาของสาย = ความกว้างที่ลำน้ำเปลี่ยนไปพอดี — อ่านเทียบกันได้ด้วยตาเปล่า */
          const th = Math.max(3.6, Math.abs(s.wA - s.wB));
          const inner = X0 + Math.min(s.wA, s.wB);
          const yA = yc - th / 2, yB = yc + th / 2;
          const HEAD = 9, FLARE = 3.4;
          /* กำไรวิ่งเข้าลำน้ำ (หัวลูกศรอยู่ติดลำน้ำ) · ค่าสูญเสียวิ่งออก (หัวลูกศรอยู่ปลายขวา) */
          const ribbon = zero ? null : gain
            ? "M" + XL + " " + yA + " L" + (inner + HEAD) + " " + yA +
              " L" + (inner + HEAD) + " " + (yA - FLARE) + " L" + inner + " " + yc +
              " L" + (inner + HEAD) + " " + (yB + FLARE) + " L" + (inner + HEAD) + " " + yB + " L" + XL + " " + yB + " Z"
            : "M" + inner + " " + yA + " L" + (XL - HEAD) + " " + yA +
              " L" + (XL - HEAD) + " " + (yA - FLARE) + " L" + XL + " " + yc +
              " L" + (XL - HEAD) + " " + (yB + FLARE) + " L" + (XL - HEAD) + " " + yB + " L" + inner + " " + yB + " Z";
          return (
            <g key={R.k}>
              {ribbon
                ? <path d={ribbon} fill={col} opacity={gain ? 0.78 : heavy ? 0.92 : 0.85} />
                : <line x1={X0 + s.wA} y1={yc} x2={XL} y2={yc} stroke="var(--ln2)" strokeWidth="1" strokeDasharray="2 4" />}
              <text x={LX} y={yc - 9} fontSize="10" fontWeight="700" fill={zero ? "var(--text-3)" : "var(--text-2)"}>{cut(R.label, 66)}</text>
              <text x={LX} y={yc + 3} fontSize="9.5" fontWeight="800"
                fill={zero ? "var(--text-3)" : gain ? "#1D4ED8" : heavy ? "var(--tint-red-tx)" : "var(--tint-amber-tx)"}>
                {gain ? "+" + R.pct + "%  ·  " + R.gain.toLocaleString() + " kWh"
                  : zero ? "ไม่เสียพลังงานในด่านนี้" : "−" + R.pct + "%  ·  " + R.loss.toLocaleString() + " kWh"}
                {R.unit ? <tspan fill="var(--text-3)" fontWeight="700">{"   → " + R.unit}</tspan> : null}
              </text>
              {R.note && <text x={LX} y={yc + 14} fontSize="8.5" fontWeight="600" fill="var(--text-3)">{cut(R.note, 70)}</text>}
            </g>
          );
        }
        /* หมุดหลัก — ต้นทาง / พลังงานนาม / เข้าอินเวอร์เตอร์ / ออกจากระบบ */
        const big = R.kind === "end", first = R.kind === "start";
        const accent = big ? "var(--acd)" : first ? "var(--tint-amber-tx)" : "var(--ln2)";
        return (
          <g key={R.k}>
            <line x1={X0} y1={s.y1} x2={XL + 4} y2={s.y1} stroke={big ? "var(--acd)" : "var(--ln2)"}
              strokeWidth={big ? 1.4 : 1} strokeDasharray={big ? null : "3 4"} opacity={big ? 0.7 : 1} />
            <rect x={LX - 9} y={s.y1 - 32} width="3" height="30" rx="1.5" fill={accent} opacity={big || first ? 1 : 0.5} />
            <text x={LX} y={s.y1 - 23} fontSize="10.5" fontWeight="800" fill="var(--text-1)">{cut(R.label, 60)}</text>
            <text x={LX} y={s.y1 - 11} fontSize="9.5" fontWeight="800" fill={big ? "var(--acd)" : first ? "var(--tint-amber-tx)" : "var(--text-2)"}>
              {R.kwh.toLocaleString()} kWh
              {R.unit ? <tspan fill="var(--text-3)" fontWeight="700">{"   ·   " + R.unit}</tspan> : null}
              {big ? <tspan fill="var(--acd)" fontWeight="800">{"   ·   PR " + R.pct + "%"}</tspan> : null}
            </text>
            {R.note && <text x={LX} y={s.y1 - 1} fontSize="8.5" fontWeight="600" fill="var(--text-3)">{cut(R.note, 70)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   ผลกระทบต่อสิ่งแวดล้อม
   ============================================================ */
function SuEnviron({ env, years }) {
  if (!env) return null;
  const tiles = [
    { ic: "tree", v: env.trees.toLocaleString(), u: "ต้น", lb: "เท่ากับปลูกไม้ยืนต้น", sub: "ดูดซับ 9.5 kgCO₂/ต้น/ปี" },
    { ic: "map", v: env.carKm.toLocaleString(), u: "กม.", lb: "เท่ากับไม่ขับรถยนต์", sub: "0.12 kgCO₂/กม." },
    { ic: "coin", v: env.petrol.toLocaleString(), u: "ลิตร", lb: "เท่ากับน้ำมันเบนซิน", sub: "2.31 kgCO₂/ลิตร" },
    { ic: "sun", v: env.homes.toLocaleString(), u: "หลัง", lb: "เท่ากับไฟบ้านทั้งปี", sub: "ครัวเรือนไทย ~200 หน่วย/เดือน" },
  ];
  return (
    <React.Fragment>
      <div className="su-env">
        <div className="hero">
          <span className="eb">ลดคาร์บอนได้ปีละ</span>
          <span className="big">{env.co2YearT.toLocaleString()}<small>tCO₂e</small></span>
          <span className="sub">ตลอด {years} ปี รวม <b>{env.co2LifeT.toLocaleString()} tCO₂e</b> · คิดที่ {env.ef} kgCO₂e ต่อไฟฟ้า 1 หน่วยจากสายส่ง (อบก.)</span>
        </div>
        <div className="tiles">
          {tiles.map((t) => (
            <div key={t.lb} className="tile">
              <P3Icon name={t.ic} size={13} />
              <span className="v">{t.v}<small>{t.u}</small></span>
              <span className="lb">{t.lb}</span>
              <span className="sb">{t.sub}</span>
            </div>
          ))}
        </div>
      </div>
      {env.carbonPayback != null && (
        <div className="su-env-pb">
          <span className="l">คืนทุนทางคาร์บอน</span>
          <span className="bar"><span style={{ width: scClamp(env.carbonPayback / Math.max(1, years) * 100, 1, 100) + "%" }} /></span>
          <span className="r"><b>{env.carbonPayback}</b> ปี</span>
        </div>
      )}
    </React.Fragment>
  );
}

/* ── แถบแยกส่วนของแสงที่ตกบนหน้าแผง ── */
function SuLightBar({ irr }) {
  const parts = [
    { k: "beam", v: irr.beam, c: "#F59E0B", lb: "ลำแสงตรง" },
    { k: "diff", v: irr.diff, c: "#60A5FA", lb: "แสงฟุ้งจากฟ้า" },
    { k: "refl", v: irr.refl, c: "#A78BFA", lb: "สะท้อนจากพื้น" },
  ];
  const tot = Math.max(1, irr.poa);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", background: "var(--surface3)" }}>
        {parts.map((p) => p.v > 0 && (
          <div key={p.k} title={p.lb + " " + p.v + " W/m²"}
            style={{ width: (p.v / tot * 100) + "%", background: p.c, display: "grid", placeItems: "center",
              fontSize: 9.5, fontWeight: 800, color: "#fff", minWidth: 0, overflow: "hidden" }}>
            {p.v / tot > 0.12 ? p.v : ""}
          </div>
        ))}
        {irr.shadeLoss > 0 && (
          <div title={"เงาบังไป " + irr.shadeLoss + " W/m²"}
            style={{ width: (irr.shadeLoss / tot * 100) + "%", background: "repeating-linear-gradient(45deg,#64748B,#64748B 3px,#475569 3px,#475569 6px)",
              display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 800, color: "#fff" }}>เงา</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 13, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        {parts.map((p) => <span key={p.k}><b style={{ color: p.c }}>■</b> {p.lb} {p.v}</span>)}
        {irr.shadeLoss > 0 && <span><b style={{ color: "#475569" }}>■</b> เงาบัง −{irr.shadeLoss}</span>}
      </div>
    </div>
  );
}

/* ── ความร้อนสะสมหลังแผง: อากาศ → หลังแผง → เซลล์ ── */
function SuThermo({ temp }) {
  const stops = [{ v: temp.tAmb, lb: "อากาศ", c: "#60A5FA" }, { v: temp.tBack, lb: "หลังแผง", c: "#F59E0B" }, { v: temp.tCell, lb: "เซลล์", c: "var(--tint-red-tx2)" }];
  const lo = 20, hi = Math.max(80, temp.tCell + 6);
  const px = (v) => scClamp((v - lo) / (hi - lo) * 100, 0, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ position: "relative", height: 12, borderRadius: 99, background: "linear-gradient(90deg,#93C5FD,#FCD34D,#F87171)" }}>
        {stops.map((s) => (
          <span key={s.lb} title={s.lb + " " + s.v + " °C"} style={{ position: "absolute", left: px(s.v) + "%", top: -3, transform: "translateX(-50%)",
            width: 4, height: 18, borderRadius: 99, background: "#fff", boxShadow: "0 0 0 1.5px " + s.c }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stops.map((s) => (
          <span key={s.lb} className="p3-stat"><span style={{ width: 8, height: 8, borderRadius: 99, background: s.c, display: "inline-block" }} />
            {s.lb} <b>{s.v}°C</b></span>
        ))}
        <span className="p3-stat" style={{ color: temp.rise > 30 ? "var(--tint-amber-tx)" : undefined }}>ร้อนกว่าอากาศ <b>+{temp.rise}°C</b></span>
      </div>
    </div>
  );
}

/* ── กราฟกระแสเงินสดสะสม + จุดคุ้มทุน ── */
/* ── ไฟทั้งวันไหลไปไหนบ้าง ──
   mode "pv"   = ไฟที่ผลิตได้แยกเป็น ใช้ตรง ๆ / เข้าแบต / ขายคืน / ตัดทิ้ง (+ เส้นระดับไฟในแบต)
   mode "load" = ไฟที่ใช้ทั้งวันมาจากไหน แสงตรง / แบต / ซื้อจากการไฟฟ้า */
const SU_FLOW = {
  direct: { c: "#22A35B", label: "ใช้ตรง ๆ ตอนนั้น" },
  chg:    { c: "#2563EB", label: "เก็บเข้าแบต" },
  dis:    { c: "#6366F1", label: "จ่ายออกจากแบต" },
  exp:    { c: "#EFA53A", label: "ขายคืนการไฟฟ้า" },
  curt:   { c: "var(--tint-red-tx2)", label: "ตัดทิ้ง (ห้ามไหลย้อน)" },
  imp:    { c: "#94A3B8", label: "ซื้อจากการไฟฟ้า" },
};
function SuFlowDay({ rows, mode, on, height }) {
  const keys = mode === "load" ? ["direct", "dis", "imp"] : ["direct", "chg", "exp", "curt"];
  const W = 620, H = height || 152, L = 30, R = on && mode === "pv" ? 30 : 8, T = 12, B = 18;
  const top = Math.max(0.02, rows.reduce((a, r) => Math.max(a, keys.reduce((s, k) => s + (r[k] || 0), 0)), 0));
  const X = (h) => L + (h + 0.5) / 24 * (W - L - R);
  const bw = (W - L - R) / 24 * 0.76;
  const Y = (v) => T + (1 - v / top) * (H - T - B);
  const socPts = rows.map((r) => X(r.h) + "," + (T + (1 - scClamp(r.soc, 0, 100) / 100) * (H - T - B))).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} y1={Y(top * f)} x2={W - R} y2={Y(top * f)} stroke="var(--ln)" strokeWidth="1" />
          <text x={L - 4} y={Y(top * f) + 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="var(--text-3)">{scR(top * f, 2)}</text>
        </g>
      ))}
      <text x={2} y={T - 3} fontSize="8.5" fontWeight="800" fill="var(--text-3)">kWh</text>
      {rows.map((r) => {
        let acc = 0;
        return (
          <g key={r.h}>
            {keys.map((k) => {
              const v = r[k] || 0; if (v <= 0) return null;
              const y0 = Y(acc + v), h = Math.max(0.6, Y(acc) - Y(acc + v)); acc += v;
              return <rect key={k} x={X(r.h) - bw / 2} y={y0} width={bw} height={h} fill={SU_FLOW[k].c} opacity={k === "curt" ? 0.85 : 0.92}>
                <title>{r.h + ":00 · " + SU_FLOW[k].label + " " + scR(v, 2) + " kWh"}</title></rect>;
            })}
          </g>
        );
      })}
      {on && mode === "pv" && (
        <g>
          <polyline points={socPts} fill="none" stroke="#0F172A" strokeWidth="1.6" strokeDasharray="5 3" opacity=".65" />
          <text x={W - R + 4} y={T + 4} fontSize="8.5" fontWeight="800" fill="var(--text-3)">100%</text>
          <text x={W - R + 4} y={H - B + 3} fontSize="8.5" fontWeight="800" fill="var(--text-3)">0%</text>
        </g>
      )}
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
        <text key={h} x={X(h)} y={H - 5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--text-3)">{h}</text>
      ))}
      <text x={W - R} y={H - 5} textAnchor="end" fontSize="8" fontWeight="800" fill="var(--text-3)">น.</text>
    </svg>
  );
}

/* ── ผลผลิตนี้มั่นใจได้แค่ไหน (P50/P90) ──
   วาดเป็นระฆังคว่ำของการแจกแจงปกติ แล้วแรเงาส่วนที่ "ต่ำกว่า P90" ให้เห็นว่าโอกาสพลาดมีแค่ 10% */
function SuPxx({ px, mode }) {
  const rows = mode === "one" ? px.one : px.avg;
  const sig = (mode === "one" ? px.sigma1 : px.sigmaN) / 100;
  const W = 620, H = 168, L = 8, R = 8, T = 14, B = 30;
  const p50 = px.p50 || 1, lo = p50 * (1 - 3.2 * sig), hi = p50 * (1 + 3.2 * sig);
  const X = (v) => L + (v - lo) / Math.max(1e-9, hi - lo) * (W - L - R);
  const Y = (f) => T + (1 - f) * (H - T - B);
  const N = 121, pts = [];
  for (let i = 0; i < N; i++) {
    const v = lo + (hi - lo) * i / (N - 1);
    const t = (v - p50) / Math.max(1e-9, p50 * sig);
    pts.push({ x: X(v), y: Y(Math.exp(-0.5 * t * t)), v });
  }
  const p90 = (rows.find((r) => r.p === 90) || rows[0]).kwh;
  const line = pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const under = pts.filter((p) => p.v <= p90);
  const fill = under.length
    ? "M" + under[0].x.toFixed(1) + " " + Y(0) + " L" + under.map((p) => p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" L")
      + " L" + under[under.length - 1].x.toFixed(1) + " " + Y(0) + " Z" : "";
  const marks = [{ p: 50, v: p50, c: "#0B5F35" }, { p: 90, v: p90, c: "var(--tint-amber-tx)" }];
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      <line x1={L} y1={Y(0)} x2={W - R} y2={Y(0)} stroke="var(--ln2)" strokeWidth="1.2" />
      {fill && <path d={fill} fill="var(--tint-amber-tx)" opacity=".16" />}
      <polyline points={line} fill="none" stroke="#0B5F35" strokeWidth="2" />
      {marks.map((m) => (
        <g key={m.p}>
          <line x1={X(m.v)} y1={Y(0)} x2={X(m.v)} y2={Y(m.p === 50 ? 1 : Math.exp(-0.5 * Math.pow((m.v - p50) / (p50 * sig), 2)))}
            stroke={m.c} strokeWidth="1.6" strokeDasharray={m.p === 50 ? "" : "4 3"} />
          <text x={X(m.v)} y={T - 4} textAnchor="middle" fontSize="10" fontWeight="800" fill={m.c}>P{m.p}</text>
          <text x={X(m.v)} y={H - 16} textAnchor="middle" fontSize="10" fontWeight="800" fill={m.c}>{m.v.toLocaleString()}</text>
        </g>
      ))}
      <text x={L} y={H - 3} fontSize="8.5" fontWeight="700" fill="var(--text-3)">แย่กว่าที่คิด</text>
      <text x={W - R} y={H - 3} textAnchor="end" fontSize="8.5" fontWeight="700" fill="var(--text-3)">ดีกว่าที่คิด</text>
      <text x={X(p90)} y={H - 3} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--tint-amber-tx)">โอกาสตกลงมาต่ำกว่านี้ 10%</text>
    </svg>
  );
}

function SuCash({ roi }) {
  const W = 620, H = 176, L = 4, B = 22, T = 10;
  const rows = roi.rows;
  const lo = Math.min(-roi.capex, 0), hi = Math.max(1, rows[rows.length - 1].cum);
  const X = (i) => L + i / Math.max(1, rows.length) * (W - L * 2);
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const bw = (W - L * 2) / rows.length * 0.72;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      <line x1={L} y1={Y(0)} x2={W - L} y2={Y(0)} stroke="var(--ln2)" strokeWidth="1.2" />
      {rows.map((r, i) => (
        <rect key={i} x={X(i)} y={Math.min(Y(r.cum), Y(0))} width={bw} height={Math.max(1, Math.abs(Y(r.cum) - Y(0)))}
          rx="2" fill={r.cum >= 0 ? "#22A35B" : "#CBD5E1"} opacity={r.cum >= 0 ? 0.9 : 0.85}>
          <title>{"ปี " + r.year + " · สะสม " + r.cum.toLocaleString() + " บาท"}</title>
        </rect>
      ))}
      {roi.payback != null && roi.payback <= rows.length && (
        <g>
          <line x1={X(roi.payback)} y1={T} x2={X(roi.payback)} y2={H - B} stroke="var(--tint-amber-tx)" strokeWidth="1.6" strokeDasharray="4 3" />
          <text x={X(roi.payback) + 5} y={T + 10} fontSize="10" fontWeight="800" fill="var(--tint-amber-tx)">คืนทุนปีที่ {roi.payback}</text>
        </g>
      )}
      {rows.map((r, i) => (i % 5 === 4 || i === 0) && (
        <text key={"t" + i} x={X(i) + bw / 2} y={H - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{r.year}</text>
      ))}
      <text x={W - L} y={H - 7} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">ปี</text>
    </svg>
  );
}

/* ============================================================
   SolarWorkspace
   ============================================================ */
function SolarWorkspace({ job, st, sys, onChange, onClose, snap }) {
  const [step, setStep] = React.useState(0);
  /* ภาพฉาก 3 มิติสำหรับรายงาน — ถ่ายตอนเปิดหน้านี้ ตามมุมกล้องที่ผู้ใช้ตั้งไว้ล่าสุด */
  const [snapImg, setSnapImg] = React.useState(null);
  React.useEffect(() => { if (typeof snap === "function") { const u = snap(); if (u) setSnapImg(u); } }, []);
  const S = sys || scBlankSys();
  const set = (patch) => onChange(Object.assign({}, S, patch));
  const B = window.BOQ || {};
  const stockPanels = B.PANELS || [], stockInv = B.INVERTERS || [], micros = B.MICRO || [];

  /* ── สเปคที่ใช้จริง (คลัง → แก้ทับ → ค่ากลาง) ── */
  const panel = scPanelSpec(S), inv = scInvSpec(S);
  const stockPanel = stockPanels.find((p) => p.model === S.panelModel) || {};
  const stockInvRow = stockInv.find((p) => p.model === S.invModel) || {};
  const srcOf = (ov, stock, key) => (ov && ov[key] != null ? "edit" : (stock[key] != null && stock[key] !== 0 ? "stock" : "def"));
  const setP = (k, v) => { const o = Object.assign({}, S.panel); if (v == null) delete o[k]; else o[k] = v; set({ panel: o }); };
  const setI = (k, v) => { const o = Object.assign({}, S.inv); if (v == null) delete o[k]; else o[k] = v; set({ inv: o }); };

  /* ── กลุ่มทิศทาง + รอยเท้าแผงมองจากบน (มาจากโมเดล 3 มิติทั้งคู่) ── */
  const idx = React.useMemo(() => scPanelIndex(st), [st]);
  const groups = idx.groups;
  const foot = React.useMemo(() => (typeof p3FootAll === "function" ? p3FootAll(st) : { panels: [], outlines: [], bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 } }), [st]);
  const totalPanels = groups.reduce((a, g) => a + g.count, 0);
  const isMicro = S.mode === "micro";
  const [activeStr, setActiveStr] = React.useState(1);

  /* ── สตริง / ไมโคร ── */
  const range = React.useMemo(() => (panel.voc && inv.mpptVmin ? scSeriesRange(panel, inv, S.env) : null), [panel.voc, panel.vmp, panel.tcVoc, inv.mpptVmin, inv.mpptVmax, inv.maxVdc, S.env]);
  /* ระบบจัดสตริงให้เองตั้งแต่เปิดเข้ามา — ผังจึงมีสีและแตะแก้ได้ทันที ไม่ต้องกดปุ่มก่อน
     ยังไม่เขียนลง state จนกว่าผู้ใช้จะแตะแก้จริง (จะได้ไม่ขึ้น "ยังไม่บันทึก" ทั้งที่ยังไม่ได้แตะอะไร) */
  const isManual = !!S.manual;
  const autoSeed = React.useMemo(() => (!isMicro && panel.voc && inv.mpptVmin && foot.panels.length
    ? scAutoAssign(foot.panels, idx.byPanel, groups, panel, inv, S.env, { invCount: S.invCount })
    : {}), [isMicro, foot, idx, groups, panel, inv, S.env, S.invCount]);
  const effAssign = isManual ? (S.assign || {}) : autoSeed;
  /* ตาราง/ผัง/จานสี อ่านจากชุดข้อมูลเดียวกันทั้งหมด จะได้ไม่มีทางขัดกันเอง */
  const plan = React.useMemo(() => (!isMicro && panel.voc
    ? scStringsFromAssign(effAssign, idx.byPanel, groups, panel, inv, S.env, { invCount: S.invCount, totalPanels, mpptPick: S.mpptPick })
    : null), [isMicro, effAssign, idx, groups, panel, inv, S.env, S.invCount, totalPanels, S.mpptPick]);
  /* ปักช่อง MPPT เอง: เก็บเป็น { สตริงที่: ช่องที่ } · null = คืนให้ระบบไล่ลงช่องว่างให้ */
  const pickMppt = (sid, slot) => {
    const next = Object.assign({}, S.mpptPick || {});
    if (slot == null) delete next[sid]; else next[sid] = slot;
    set({ mpptPick: next });
  };
  const doAuto = () => set({ assign: autoSeed, manual: true });
  const paint = (uid) => {
    const a = Object.assign({}, effAssign);
    if (!activeStr) delete a[uid]; else a[uid] = activeStr;
    set({ assign: a, manual: true });
  };
  const strIds = plan && plan.strings ? plan.strings.map((s) => s.id || 0).filter(Boolean) : [];
  const nextStr = (strIds.length ? Math.max.apply(null, strIds) : 0) + 1;
  const microPlans = React.useMemo(() => (isMicro ? scMicroPlan(groups, panel, micros, S.env, S) : null),
    [isMicro, groups, panel, micros, S.env, S.microRatio, S.micro]);
  const stockMicroRow = micros.find((m) => m.ratio === S.microRatio) || micros[0] || {};
  const setM = (k, v) => { const o = Object.assign({}, S.micro); if (v == null) delete o[k]; else o[k] = v; set({ micro: o }); };
  const microSel = microPlans ? (microPlans.find((m) => m.ratio === S.microRatio) || microPlans[0]) : null;
  /* ── จัดแผงเข้า "ตัวไมโคร" — แบบเดียวกับจัดสตริง แต่ตัวละ per ใบ ──
     ระบบจับคู่แผงที่ติดกันบนหลังคาให้ก่อน แตะแก้เองได้ทีหลัง (เก็บใน S.microAssign) */
  const microAuto = React.useMemo(() => (isMicro && microSel && foot.panels.length
    ? scMicroAssign(foot.panels, idx.byPanel, groups, microSel.per) : { assign: {}, units: [] }),
    [isMicro, foot, idx, groups, microSel && microSel.per]);
  const microManual = !!S.microManual;
  const microAssign = microManual ? (S.microAssign || {}) : microAuto.assign;
  /* สร้างรายการตัวไมโครจากผังที่ใช้จริง (ไม่ว่าจะระบบจัดหรือแก้เอง) จะได้ตรงกันทุกที่ */
  const microUnits = React.useMemo(() => {
    if (!isMicro || !microSel) return [];
    const bag = {};
    foot.panels.forEach((p) => {
      const id = microAssign[p.uid];
      if (!id) return;
      if (!bag[id]) bag[id] = { id, uids: [], gks: {} };
      bag[id].uids.push(p.uid);
      const gk = idx.byPanel[p.uid]; if (gk) bag[id].gks[gk] = (bag[id].gks[gk] || 0) + 1;
    });
    return Object.keys(bag).map((k) => {
      const u = bag[k], gks = Object.keys(u.gks);
      const g = groups.find((x) => x.key === gks[0]);
      return { id: +k, n: u.uids.length, uids: u.uids, gLabel: g ? g.label : "—",
        mixed: gks.length > 1, over: u.uids.length > microSel.per };
    }).sort((a, b) => a.id - b.id);
  }, [isMicro, microAssign, foot, idx, groups, microSel && microSel.per]);
  const microUnassigned = isMicro ? foot.panels.filter((p) => !microAssign[p.uid]).length : 0;
  /* ── ระบบ 3 เฟส: ไมโครเป็นอุปกรณ์ 1 เฟส ต้องกระจายตัวลง L1/L2/L3 เอง ──
     ค่าตั้งต้นดึงจากข้อมูลงาน (job.phase) แก้ทับได้ในหน้านี้ */
  const jobPhase = String(job && job.phase) === "3" ? 3 : 1;
  const phases = S.phases == null ? jobPhase : (scNum(S.phases, 1) === 3 ? 3 : 1);
  const phaseBins = React.useMemo(() => (isMicro && microSel && typeof scMicroPhases === "function"
    ? scMicroPhases(microUnits, { phases, wp: panel.wp, acW: microSel.acW, acV: microSel.acV,
        perBranch: microSel.perBranch, override: S.microPhase || {} })
    : []), [isMicro, microUnits, phases, panel.wp, microSel, S.microPhase]);
  const phaseBal = React.useMemo(() => (typeof scPhaseBalance === "function" ? scPhaseBalance(phaseBins, 10) : null), [phaseBins]);
  const setUnitPhase = (uid, ph) => {
    const o = Object.assign({}, S.microPhase || {});
    if (!ph) delete o[uid]; else o[uid] = ph;
    set({ microPhase: o });
  };
  /* uid ของแผง → เฟสที่ตัวไมโครของมันอยู่ (ใช้เขียนป้าย L1/L2/L3 บนผัง 2 มิติ) */
  const uidPhase = React.useMemo(() => {
    const m = {};
    if (phases !== 3) return m;
    phaseBins.forEach((b) => b.units.forEach((u) => (u.uids || []).forEach((x) => { m[x] = b.label; })));
    return m;
  }, [phases, phaseBins]);
  const SU_PHCOLOR = { L1: "#D97706", L2: "#2563EB", L3: "#0F7A43" };
  const [muColorBy, setMuColorBy] = React.useState("unit");   // unit = สีตามตัวไมโคร · phase = สีตามเฟส
  const [activeMu, setActiveMu] = React.useState(1);
  const nextMu = (microUnits.length ? Math.max.apply(null, microUnits.map((u) => u.id)) : 0) + 1;
  const paintMu = (uid) => {
    const a = Object.assign({}, microAssign);
    if (!activeMu) delete a[uid]; else a[uid] = activeMu;
    set({ microAssign: a, microManual: true });
  };

  /* AC รวม = กำลังอินเวอร์เตอร์ × จำนวนตัว — ต้องคิดได้แม้สเปค MPPT ในคลังยังว่าง (ไม่งั้นผลผลิตจะไม่ถูกตัดยอด) */
  const acKw = isMicro ? (microSel ? microSel.acKw : 0) : scR(scNum(inv.kw) * Math.max(1, scNum(S.invCount, 1)), 2);
  /* จำนวนตัวที่พอดี = กำลังแผงรวม ÷ กำลัง PV สูงสุดต่อตัว (ถ้าคลังไม่ระบุ ใช้ 1.3 เท่าของ kW) */
  const dcKwAll = totalPanels * scNum(panel.wp) / 1000;
  const invSuggest = Math.max(1, Math.ceil(dcKwAll / Math.max(0.1, scNum(inv.maxPv) || scNum(inv.kw) * 1.3)));
  /* ── เงาบังทั้งปีจากโมเดล 3 มิติ — คิดให้อัตโนมัติ ──
     คำนวณใหม่เองทุกครั้งที่ผังเปลี่ยน (ราว 50 มิลลิวินาที) จะได้ไม่มีทางที่ตัวเลขผลผลิต
     กับเงาที่เห็นในกราฟรายวันจะขัดกันเอง · ปิดได้ถ้าอยากกรอก % เอง */
  const use3d = !(S.shadeOff === true);
  /* ตั้งค่าโมเดล "เงาบังนิดเดียวแต่ฉุดทั้งสตริง" (ไดโอดบายพาส)
     แผงครึ่งเซลล์เดาให้จากข้อมูลคลัง — แก้ทับได้ */
  const hc = scHalfCut(panel);
  /* ทุกแผงมี MPPT ของตัวเอง (ไมโคร 1 แผง/ช่อง) — ใช้ตัดค่าสูญเสีย "แผงไม่เท่ากัน" ทิ้ง */
  const microIndep = isMicro && microSel ? microSel.nSeries <= 1 : false;
  const elecCfg = Object.assign({}, IV_ELEC, { halfCut: hc.half }, S.elec || {});
  const setElec = (p) => set({ elec: Object.assign({}, elecCfg, p) });
  const shade3d = React.useMemo(() => (use3d && typeof ivShadeAnnual === "function" && groups.length
    ? ivShadeAnnual(st, idx.byPanel, groups, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, albedo: S.env && S.env.albedo, elec: elecCfg })
    : null), [use3d, st, idx, groups, S.env, S.elec, hc.half]);
  /* ค่าสูญเสีย "แผงไม่เท่ากัน" (mismatch) มาจากการที่ทุกแผงในสตริงถูกบังคับให้ใช้กระแสเท่ากัน
     ใบที่อ่อนกว่าจึงฉุดทั้งสตริง — ไมโครที่ให้ MPPT แผงละช่องไม่มีปัญหานี้ เหลือแค่ความคลาดของตัวแปลงเอง
     (แนวทางเดียวกับที่ PVsyst/อุตสาหกรรมใช้: สตริง ~2% · ไมโคร/ออปติไมเซอร์ ~0.3%) */
  const lossEff = React.useMemo(() => {
    const base = Object.assign({}, SC_LOSS, S.loss || {});
    /* ปรับให้เฉพาะตอนที่ยังเป็นค่ากลาง 2% อยู่ — ถ้าผู้ใช้ตั้งเองแล้วเคารพค่าที่ตั้ง */
    if (microIndep && base.mismatch === SC_LOSS.mismatch) base.mismatch = 0.3;
    return base;
  }, [S.loss, microIndep]);
  /* ผลผลิตต้องคิดด้วย "ประสิทธิภาพยุโรป" (ถ่วงน้ำหนักตามภาระจริงตลอดวัน) ไม่ใช่ค่าสูงสุดบนดาต้าชีต
     ซึ่งเกิดขึ้นแค่จุดเดียว — ถ้าคลังยังไม่กรอกค่ายุโรป ค่อยใช้ค่าสูงสุดแทน */
  const invEffUse = (S.inv && S.inv.effEuro) != null ? S.inv.effEuro
    : (S.inv && S.inv.eff) != null ? S.inv.eff : (scNum(inv.effEuro) || inv.eff);
  const energy = React.useMemo(() => (groups.length && panel.wp
    ? scEnergy(groups, panel, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, loss: lossEff,
        shadeByGroup: shade3d ? shade3d.byGroup : null,
        invEff: isMicro ? (microSel ? microSel.eff : 96.5) : invEffUse,
        /* วิธียึดแผง/ลม ใช้ชุดเดียวกับตอนคำนวณเส้น I-V — อุณหภูมิเซลล์จะได้ตรงกันทั้งระบบ */
        mount: (S.site && S.site.mount) || "close", wind: (S.site && S.site.wind) != null ? S.site.wind : SC_WIND,
        acKw, tamb: S.tamb, kc: S.kc })
    : null), [groups, panel, lossEff, S.inv, S.tamb, S.kc, acKw, isMicro, inv.eff, st.sun, shade3d, microSel && microSel.eff,
      S.site && S.site.mount, S.site && S.site.wind]);
  const life = energy ? scLife(energy.annual, panel, S.years) : null;
  /* ผลกระทบต่อสิ่งแวดล้อม — คิดจากไฟที่ผลิตได้จริงคูณค่าการปล่อยของไฟจากสายส่ง */
  const env = React.useMemo(() => (energy && life && typeof scEnviron === "function"
    ? scEnviron(energy.annual, life.total, S.years, energy.dcKw, S.envf) : null),
    [energy, life, S.years, S.envf]);

  /* ══ โหลดของลูกค้า · แบตเตอรี่ · ข้อจำกัดฝั่งการไฟฟ้า ══
     ทั้งสามอย่างนี้ไม่เปลี่ยนผลผลิต แต่เปลี่ยน "มูลค่า" ของไฟที่ผลิตได้
     — ไฟที่ใช้เองมีค่าเท่าค่าไฟเต็ม · ไฟที่ขายคืนได้ราคาถูกกว่า · ไฟที่ห้ามไหลย้อนแล้วไม่มีที่ไปคือศูนย์ */
  const loadCfg = Object.assign({}, SC_LOAD, S.load || {});
  const setLoad = (p) => set({ load: Object.assign({}, loadCfg, p) });
  const battCfg = Object.assign({}, SC_BATT, S.batt || {});
  const setBatt = (p) => set({ batt: Object.assign({}, battCfg, p) });
  /* mode: sell = ขายคืนได้ไม่จำกัด · limit = การไฟฟ้าให้ปล่อยได้ไม่เกินกี่ kW · zero = ห้ามไหลย้อนเด็ดขาด */
  const gridCfg = Object.assign({ mode: "sell", expLimitKw: 0 }, S.grid || {});
  const setGrid = (p) => set({ grid: Object.assign({}, gridCfg, p) });
  const prof = React.useMemo(() => scLoadProfile(loadCfg), [S.load]);
  const battS = scBattSpec(battCfg);
  /* ยังไม่กรอกยอดใช้ไฟ = คิดไม่ได้ว่าใช้เองเท่าไหร่ → ปล่อยเป็น null แล้วให้ ROI กลับไปใช้สไลเดอร์ % เหมือนเดิม */
  const dis = React.useMemo(() => (energy && energy.hourly && prof.annual > 0 && typeof scDispatch === "function"
    ? scDispatch(energy.hourly, prof, battCfg, { zeroExport: gridCfg.mode === "zero",
        expLimitKw: gridCfg.mode === "limit" ? gridCfg.expLimitKw : 0 })
    : null), [energy, prof, S.batt, S.grid]);
  const [flowMon, setFlowMon] = React.useState(3);      // เดือนที่กำลังดูกราฟไฟทั้งวัน (เม.ย. = ร้อนสุด)
  /* ── ความมั่นใจของตัวเลขผลผลิต ── */
  const uncCfg = Object.assign({}, SC_UNC, S.unc || {});
  const setUnc = (p) => set({ unc: Object.assign({}, uncCfg, p) });
  const [pxMode, setPxMode] = React.useState("avg");    // avg = เฉลี่ยตลอดอายุโครงการ · one = ปีใดปีหนึ่ง
  const px = React.useMemo(() => (energy && energy.annual && typeof scPxx === "function"
    ? scPxx(energy.annual, uncCfg, (S.roi && S.roi.years) || IV_ROI.years) : null), [energy, S.unc, S.roi]);

  /* ══ ตรวจวัด I-V ══ */
  const site = Object.assign({ date: "", hour: null, wind: 1, mount: "close", tAmb: null, ghi: null, shade: 0, age: 0 }, S.site || {});
  const siteDate = site.date || new Date().toISOString().slice(0, 10);
  const setSite = (p) => set({ site: Object.assign({}, site, { date: siteDate }, p) });
  const meas = S.meas || {};
  const setMeas = (id, p) => set({ meas: Object.assign({}, meas, { [id]: Object.assign({}, meas[id] || {}, p) }) });
  const par = React.useMemo(() => (typeof ivExtract === "function" ? ivExtract(panel) : null),
    [panel.voc, panel.isc, panel.vmp, panel.imp, panel.wp, panel.cells]);
  /* หน่วยที่ตรวจวัดได้ — โหมดสตริงวัดทีละสตริง · โหมดไมโครวัดทีละแผง (แยกตามกลุ่มทิศทาง) */
  const ivUnits = React.useMemo(() => {
    /* ไมโคร = ดูทีละ "ตัว" ไม่ใช่ทีละกลุ่มทิศทาง — เพราะแต่ละตัวโดนเงาไม่เท่ากัน
       เส้น I-V จึงต้องแยกกันคนละเส้น ถึงจะเห็นว่าตัวไหนตกและตัวไหนยังปกติ */
    if (isMicro) {
      const nS = microSel ? microSel.nSeries : 1;
      return microUnits.map((u) => {
        const g = groups.find((x) => x.key === idx.byPanel[u.uids[0]]) || groups[0] || {};
        return { id: "m:" + u.id, name: "ไมโคร " + u.id, sid: u.id, n: nS,
          tilt: g.tilt == null ? 0 : g.tilt, az: g.az == null ? 180 : g.az,
          gk: g.key, uids: u.uids, count: u.n, label: g.label, micro: true };
      });
    }
    /* ทิศ 0° = หันเหนือ ห้ามใช้ || เพราะ 0 จะกลายเป็น 180 (เคยพลาดตรงนี้ ผลลัพธ์ด้านเหนือเลยเท่าด้านใต้) */
    return (plan && plan.strings ? plan.strings : []).map((s) => ({ id: "s:" + s.id, name: "สตริง " + s.id, sid: s.id, n: s.n,
      tilt: s.tilt == null ? 0 : s.tilt, az: s.az == null ? 180 : s.az, gk: s.groupKey, label: s.label }));
  }, [isMicro, groups, plan, microUnits, idx, microSel && microSel.nSeries]);
  const monthNow = new Date(siteDate + "T12:00:00").getMonth();
  /* เดินดูทีละเดือน — วนกลับต้นปี/ปลายปีให้เอง กดรัวได้ไม่ต้องกลัวตกขอบ */
  const setMonth = (m) => setSite({ date: (siteDate.slice(0, 4) || "2026") + "-" + String(((m % 12) + 12) % 12 + 1).padStart(2, "0") + "-15" });
  const stepMonth = (d) => setMonth((isFinite(monthNow) ? monthNow : 6) + d);
  /* ── จำลองทั้งวันอัตโนมัติ: แสง เงา อุณหภูมิ กำลังไฟ ทุก 15 นาที ตั้งแต่เช้าถึงเย็น ──
     ทุกอย่างในขั้นนี้อ่านจากผลจำลองชุดเดียวกัน ตัวเลขบนกราฟกับในตารางจึงตรงกันเสมอ */
  const sim = React.useMemo(() => (typeof ivDaySim === "function" && groups.length && panel.wp
    ? ivDaySim(st, panel, groups, idx.byPanel, {
        lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate,
        tAmb: site.tAmb, ghi: site.ghi, refHour: site.hour == null ? 12 : site.hour,
        albedo: S.env && S.env.albedo, elec: elecCfg, acKw, invEff: isMicro ? (microSel ? microSel.eff : 96.5) : invEffUse,
        dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92 })
    : null), [st, panel, groups, idx, siteDate, site.tAmb, site.ghi, site.hour, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  /* เวลาที่ใช้ดู — ถ้ายังไม่ได้เลือกเอง ระบบเลือก "ช่วงที่เหมาะจะออกไปวัดที่สุด" ให้ (แดดแรง ไม่มีเงา) */
  const hourAuto = site.hour == null || site.hour === "";
  const simHour = hourAuto ? (sim ? sim.bestHour : 12) : scNum(site.hour, 12);
  /* จำลองทั้ง 12 เดือน — วันตัวแทนของแต่ละเดือน ใช้ทำแผนที่ เดือน × ชั่วโมง */
  const [mapMode, setMapMode] = React.useState("light");
  /* หนักสุดในหน้านี้ (12 วันจำลอง) — คำนวณต่อเมื่อเปิดมาถึงขั้นตรวจวัดจริง ๆ ไม่ถ่วงตอนเปิดหน้าแรก */
  const yearOpt = {
    lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, year: +siteDate.slice(0, 4) || undefined,
    tAmb: site.tAmb, albedo: S.env && S.env.albedo, elec: elecCfg, acKw,
    invEff: isMicro ? (microSel ? microSel.eff : 96.5) : invEffUse,
    dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92,
  };
  const canYear = typeof ivYearSim === "function" && groups.length > 0 && panel.wp > 0;
  const year = React.useMemo(() => (step >= 2 && canYear ? ivYearSim(st, panel, groups, idx.byPanel, yearOpt) : null),
    [step >= 2, st, panel, groups, idx, siteDate.slice(0, 4), site.tAmb, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  /* ── เส้นทางเดินดวงอาทิตย์ + แผนที่เงาบนแกน ทิศ × มุมสูง ──
     เส้นทางเดินขึ้นกับละติจูดอย่างเดียว คิดเร็วมาก · แผนที่เงาต้องยิงลำแสงหลายร้อยทิศ
     จึงคิดต่อเมื่อเปิดมาถึงขั้นนี้จริง ๆ และจำผลไว้จนกว่าผัง 3 มิติจะเปลี่ยน */
  const sunPath = React.useMemo(() => (typeof ivSunPath === "function"
    ? ivSunPath({ lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng }) : null),
    [st.sun && st.sun.lat, st.sun && st.sun.lng]);
  const [isoOn, setIsoOn] = React.useState(true);
  const [isoShade, setIsoShade] = React.useState(null);
  /* ยิงลำแสงพันกว่าทิศทาง — งานใหญ่ใช้เวลาเกินครึ่งวินาที ถ้าคิดตอน render จอจะค้าง
     จึงให้การ์ดขึ้นก่อนแล้วค่อยคิดในคิวถัดไป ผู้ใช้เห็นหัวข้อกับคำอธิบายทันที */
  React.useEffect(() => {
    if (!(step >= 2 && isoOn && typeof ivIsoShade === "function")) { setIsoShade(null); return; }
    let dead = false;
    const t = setTimeout(() => { const r = ivIsoShade(st, {}); if (!dead) setIsoShade(r); }, 30);
    return () => { dead = true; clearTimeout(t); };
  }, [step >= 2, isoOn, st]);
  const simRow = sim ? sim.rows.reduce((a, r) => (Math.abs(r.h - simHour) < Math.abs(a.h - simHour) ? r : a), sim.rows[0]) : null;
  const shadeAuto = site.shadeAuto !== false;
  /* เงารายแผง ณ เวลาที่ดู — ใช้สร้างเส้น I-V แบบมีขั้นบันไดของสตริงที่โดนบัง */
  const shadeUid = React.useMemo(() => (typeof ivShadeMoment === "function" && groups.length
    ? ivShadeMoment(st, idx.byPanel, groups, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate, hour: simHour })
    : null), [st, idx, groups, siteDate, simHour]);
  const ivRows = React.useMemo(() => {
    if (!par) return [];
    return ivUnits.map((u) => {
      const m = meas[u.id] || {};
      /* แผงที่อยู่ในหน่วยนี้จริง ๆ — ไมโครใช้ผังที่จับคู่ไว้ · สตริงใช้ผังที่ทาสีไว้ */
      const uids = shadeUid && shadeUid.byUid
        ? (isMicro ? (u.uids || []) : foot.panels.filter((p) => effAssign[p.uid] === u.sid).map((p) => p.uid))
        : [];
      const fracs = uids.map((x) => (shadeUid.byUid[x] || 0));
      const el = fracs.length ? ivElecLoss(fracs, elecCfg) : null;
      /* เงาอ่านจากผลจำลอง ณ เวลานั้น (มาจากการยิงลำแสงจริงในโมเดล 3 มิติ)
         ไมโครคิดจากแผงของตัวเองล้วน ๆ ไม่เฉลี่ยทั้งกลุ่ม — ไม่งั้นทุกตัวจะได้ค่าเท่ากันหมด
         ซึ่งขัดกับหลักการของไมโครที่แต่ละตัวเป็นอิสระต่อกัน */
      const cell = simRow && u.gk != null ? simRow.per[u.gk] : null;
      const auto = shadeAuto
        ? (isMicro ? (el ? scR(el.elec * 100, 1) : (cell ? cell.shade : null)) : (cell ? cell.shade : null))
        : null;
      const shade = m.shade != null && m.shade !== "" ? scNum(m.shade) : (auto != null ? auto : scNum(site.shade, 0));
      const irr = ivIrradiance({ lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate, hour: simHour,
        tilt: u.tilt, az: u.az, ghi: site.ghi, shade, albedo: S.env && S.env.albedo });
      const tAmb = site.tAmb != null && site.tAmb !== "" ? scNum(site.tAmb) : SC_TAMB[isFinite(monthNow) ? monthNow : 6];
      const temp = ivCellTemp(irr.poaNet, tAmb, site.wind, site.mount);
      const a = ivAssess({ panel, par, irr, temp, nSeries: u.n, nPar: 1, ageYears: site.age, meas: m });
      return { u, irr, temp, a, m, shade, shadeAuto: auto, fracs, el };
    });
  }, [par, ivUnits, meas, site.shade, site.tAmb, site.wind, site.mount, site.ghi, site.age, siteDate, panel, st.sun, monthNow, simRow, simHour, shadeAuto, shadeUid, foot, effAssign, isMicro, idx, S.elec]);
  /* null = แสดงรวมทุกสตริงในกราฟเดียว · ใส่ id = เจาะดูสตริงเดียว (กดเลือกจากตารางด้านล่างกราฟ) */
  const [ivSel, setIvSel] = React.useState(null);
  const [measOpen, setMeasOpen] = React.useState(false);
  const ivCur = ivSel == null ? null : (ivRows.find((r) => r.u.id === ivSel) || null);
  const ivMain = ivCur || ivRows[0] || null;         // ตัวแทนสำหรับข้อมูลที่ต้องมีค่าเสมอ (สภาพอากาศ/อุณหภูมิ)
  const ivDone = ivRows.filter((r) => r.a && r.a.hasMeas);
  const ivAvg = ivDone.length ? scR(ivDone.reduce((a, r) => a + (r.a.ratio || 0), 0) / ivDone.length, 1) : null;
  /* สตริงไหนต่ำกว่าเพื่อนผิดปกติ = mismatch ระหว่างสตริง (อินเวอร์เตอร์จะดึงลงทั้งช่อง) */
  const ivOutliers = React.useMemo(() => {
    if (ivDone.length < 2) return [];
    const v = ivDone.map((r) => r.a.ratio).sort((a, b) => a - b);
    const med = v[Math.floor(v.length / 2)];
    return ivDone.filter((r) => r.a.ratio < med - 5).map((r) => ({ name: r.u.name, ratio: r.a.ratio, med }));
  }, [ivDone]);

  /* ── ชุดเส้น I-V / P-V ที่ความเข้มแสงและอุณหภูมิต่าง ๆ ──
     แบบเดียวกับกราฟคู่บนดาต้าชีตแผง แต่คิดจากสเปคของแผงรุ่นที่เลือกจริง
     ต่อ 1 แผง = เอาไปเทียบกับดาต้าชีตได้ตรง ๆ · ทั้งสตริง = ค่าที่เครื่องวัดจะอ่านได้ที่หน้างาน */
  const [famMode, setFamMode] = React.useState("irr");     // irr = ไล่ความเข้มแสง · temp = ไล่อุณหภูมิ
  const [famScope, setFamScope] = React.useState("mod");   // mod = 1 แผง · str = ทั้งสตริง
  const famStrN = ivMain && ivMain.u ? ivMain.u.n : 1;      // แผงอนุกรมของสตริง/ช่องที่กำลังดูอยู่
  const famN = famScope === "str" ? famStrN : 1;
  const ivFam = React.useMemo(() => (typeof ivFamily === "function" && par
    ? ivFamily(par, panel, { mode: famMode, nSeries: famN, tc: 25, g: 1000 }) : []),
    [par, panel, famMode, famN]);

  /* ══ ROI ══ */
  const roiCfg = Object.assign({}, IV_ROI, S.roi || {});
  const setRoi = (p) => set({ roi: Object.assign({}, roiCfg, p) });
  /* คิดคืนทุนที่ระดับความมั่นใจไหน — P50 คือค่ากลาง · P90 คือแบบระมัดระวังที่ธนาคารชอบดู */
  const [roiP, setRoiP] = React.useState("p50");
  /* ปีที่ต้องเปลี่ยนแบต: อายุที่คำนวณได้จากรอบการใช้งานจริง ปัดขึ้นเป็นจำนวนเต็มปี */
  const battRepYear = dis && dis.on && dis.battLife ? Math.max(1, Math.round(dis.battLife)) : 0;
  const roiX = {
    split: dis ? { direct: dis.fDirect, dis: dis.fDis, exp: dis.fExp } : null,
    battCapex: dis && dis.on ? battS.capex : 0,
    battRepYear, battRepCost: dis && dis.on ? battS.capex : 0,
    battDegY: dis && dis.on ? scNum(battCfg.degY, 0) : 0,
    kYield: roiP === "p90" && px ? px.kP90 : 1,
  };
  const roi = React.useMemo(() => (energy && energy.annual ? ivRoi(energy.annual, panel, energy.dcKw, roiCfg, roiX) : null),
    [energy, panel, S.roi, dis, roiP, px, S.batt]);

  const ready = { equip: !!(panel.wp && (isMicro ? microSel : inv.model)), plan: !!(isMicro ? microSel : (plan && plan.strings.length)) };
  const steps = [
    { t: "อุปกรณ์", s: panel.model ? (panel.model.length > 26 ? panel.model.slice(0, 26) + "…" : panel.model) + (isMicro ? " · ไมโคร" : inv.model ? " · " + inv.model.slice(0, 18) : "") : "เลือกแผง + อินเวอร์เตอร์", ic: "layers" },
    { t: isMicro ? "การต่อไมโคร" : "การต่อสตริง", s: isMicro ? (microSel ? microSel.ratio + " · " + microSel.units + " ตัว" : "—") : (plan && plan.strings.length ? plan.strings.length + " สตริง · " + plan.panels + " แผง" : "—"), ic: "grid" },
    { t: "แสง เงา & เส้น I-V", s: sim ? SC_MON[isFinite(monthNow) ? monthNow : 6] + " · " + sim.dayKwh + " kWh/วัน" + (sim.shadeLossPct > 0 ? " · เงา " + sim.shadeLossPct + "%" : "") : "จำลองรายเดือน", ic: "curve" },
    { t: "ผลผลิต " + S.years + " ปี", s: energy ? energy.annual.toLocaleString() + " kWh/ปี" + (px ? " · P90 " + px.p90avg.toLocaleString() : "") : "—", ic: "sun" },
    { t: "โหลด & แบตเตอรี่", s: dis ? "ใช้เอง " + dis.selfPct + "%" + (dis.on ? " · แบต " + battS.cap + " kWh" : "") + (dis.curtPct > 0 ? " · ตัดทิ้ง " + dis.curtPct + "%" : "") : "ยังไม่ได้กรอกยอดใช้ไฟ", ic: "bulb" },
    { t: "คืนทุน & ROI", s: roi ? (roi.payback ? "คืนทุน " + roi.payback + " ปี" : "ยังไม่คืนทุนใน " + roi.years + " ปี") + (roi.irr != null ? " · IRR " + roi.irr + "%" : "") : "—", ic: "coin" },
  ];

  const warns = [].concat(plan ? plan.warns : [], microSel ? microSel.warns : []);

  /* ── เลือกเนื้อหาที่จะออกรายงาน ──
     เก็บไว้กับงาน (S.report) เพราะแต่ละงานส่งให้คนละคนดู — ลูกค้าคนเดิมเปิดรายงานซ้ำจะได้เหมือนเดิม */
  const [repOpen, setRepOpen] = React.useState(false);
  const repPick = React.useMemo(() => Object.assign(
    typeof rpPickAll === "function" ? rpPickAll() : {}, S.report || {}), [S.report]);
  const repToggle = (k) => set({ report: Object.assign({}, repPick, { [k]: !repPick[k] }) });
  const repPreset = (only) => {
    const all = typeof rpPickAll === "function" ? rpPickAll() : {};
    if (!only) { set({ report: all }); return; }
    const next = {};
    Object.keys(all).forEach((k) => { next[k] = only.indexOf(k) >= 0; });
    set({ report: next });
  };
  const repCount = (typeof RP_SECTIONS !== "undefined" ? RP_SECTIONS : []).filter((s) => repPick[s.key]).length;

  /* รวมทุกอย่างที่คำนวณไว้แล้วส่งให้ตัวสร้างรายงาน — ไม่คำนวณซ้ำ ตัวเลขในรายงานจึงตรงกับบนจอเป๊ะ */
  const [repHtml, setRepHtml] = React.useState(null);
  const doReport = () => {
    if (typeof suReportHTML !== "function") { alert("ยังโหลดตัวสร้างรายงานไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง"); return; }
    setRepOpen(false);
    /* รายงานต้องมีข้อมูล 12 เดือนเสมอ — ถ้ากดปุ่มตั้งแต่ยังไม่ผ่านขั้นที่ 3 ให้คำนวณตรงนี้เลย
       (ไม่งั้นจะได้รายงานที่หัวข้อทั้งปีหายไปเงียบ ๆ) */
    const yearNow = year || (canYear ? ivYearSim(st, panel, groups, idx.byPanel, yearOpt) : null);
    /* แผนที่เงาคิดต่อเมื่อเปิดถึงขั้นที่ 3 — ถ้ากดออกรายงานตั้งแต่ขั้นแรก ต้องคิดตรงนี้ให้ครบ */
    const isoNow = isoShade || (typeof ivIsoShade === "function" && totalPanels ? ivIsoShade(st, {}) : null);
    /* กราฟดาต้าชีตในรายงานตรึงเงื่อนไขไว้ ไม่ผูกกับปุ่มที่ผู้ใช้กดค้างไว้บนหน้าจอ */
    const famG = par && typeof ivFamily === "function" ? ivFamily(par, panel, { mode: "irr", nSeries: 1, tc: 25 }) : [];
    const famT = par && typeof ivFamily === "function" ? ivFamily(par, panel, { mode: "temp", nSeries: famStrN, g: 1000 }) : [];
    /* เปิดรายงานให้ดูบนจอก่อน (เหมือนรายงานผลสำรวจ) แล้วค่อยกด "บันทึก PDF" ในแถบด้านบน */
    setRepHtml(suReportHTML({ job, sys: S, panel, inv, groups, plan, microSel, isMicro, energy, life, roi, roiCfg,
      env, sunPath, isoShade: isoNow, ivFamG: famG, ivFamT: famT,
      dis, prof, px, pxMode, battS, gridCfg, roiP,
      ivRows, ivDone, ivAvg, ivOutliers, site, siteDate, acKw, totalPanels, warns, foot,
      /* โหมดไมโครใช้ผัง "แผงอยู่ไมโครตัวไหน" แทนผังสตริง — ผังในรายงานจะได้ตรงกับที่เห็นบนจอ */
      assign: isMicro ? microAssign : effAssign, microUnits, phases, phaseBins, phaseBal, uidPhase,
      shade3d, sim, simHour, year: yearNow, snapImg, pick: repPick }));
  };

  return (
    <div className="p3 su">
      <style>{SU_CSS}</style>
      {/* header */}
      <div className="p3-head" style={{ padding: "11px 18px" }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(245,158,11,.14)", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--tint-amber-tx)" }}>
          <P3Icon name="sun" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", color: "var(--text-3)", textTransform: "uppercase" }}>
            ออกแบบระบบไฟฟ้า{job && job.code ? " · " + job.code : ""}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : ""}</div>
        </div>
        <button className="ghost" onClick={onClose} title="กลับไปหน้าวางแผง"><Icon name="x" size={16} /></button>
      </div>

      <div className="su-body">
        {/* ขั้นตอน */}
        <div className="su-rail">
          <span className="p3-eb" style={{ padding: "0 8px 6px" }}>ขั้นตอน</span>
          {steps.map((s, i) => (
            <button key={i} className="su-step" data-on={step === i ? "1" : "0"} data-done={i < step ? "1" : "0"} onClick={() => setStep(i)}>
              <span className="no">{i < step ? "✓" : i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span className="tt" style={{ display: "block" }}>{s.t}</span>
                <span className="sb" style={{ display: "block" }}>{s.s}</span>
              </span>
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 14 }}>
            <div className="p3-card" style={{ gap: 7, padding: "10px 11px" }}>
              <span className="p3-eb">แผงในผัง 3 มิติ</span>
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{totalPanels} <small style={{ fontSize: 10, color: "var(--text-3)" }}>แผง</small></span>
              <span className="p3-note">{groups.length} กลุ่มทิศทาง · แผงที่ทิศ/มุมต่างกันต้องแยกสตริงกัน</span>
            </div>
          </div>
        </div>

        {/* เนื้อหา */}
        <div className="su-main">
          <div className="su-wrap">
            {!totalPanels && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังไม่มีแผงในผัง — กลับไปวางแผงบนหลังคาก่อน แล้วค่อยมาออกแบบระบบ</div>
            )}

            {/* ══ ขั้น 1 · อุปกรณ์ ══ */}
            {step === 0 && (
              <React.Fragment>
                <div className="su-pick">
                  {[["string", "สตริงอินเวอร์เตอร์", "แผงหลายแผงต่ออนุกรมเข้าตัวเดียว · ถูกกว่า ดูแลจุดเดียว แต่ทั้งสตริงต้องทิศ/มุมเดียวกัน และเงาบังแผงเดียวฉุดทั้งสตริง"],
                    ["micro", "ไมโครอินเวอร์เตอร์", "แปลงไฟที่แผงเลย 1 หรือ 2 แผงต่อตัว · เงาบังแผงไหนเสียแค่แผงนั้น วางคนละทิศได้อิสระ แต่ราคาสูงกว่า"]].map(([k, h, d]) => (
                    <button key={k} data-on={S.mode === k ? "1" : "0"} onClick={() => set({ mode: k })}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        {/* ไดอะแกรมเล็ก ๆ บอกวิธีต่อ */}
                        <svg width="40" height="22" viewBox="0 0 40 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                          {k === "string" ? (
                            <React.Fragment>
                              <rect x="1" y="3" width="7" height="6" rx="1" /><rect x="10" y="3" width="7" height="6" rx="1" /><rect x="19" y="3" width="7" height="6" rx="1" />
                              <path d="M8 6h2M17 6h2M26 6h5v9h-8" /><rect x="14" y="13" width="9" height="7" rx="1.5" />
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <rect x="2" y="2" width="8" height="6" rx="1" /><rect x="15" y="2" width="8" height="6" rx="1" /><rect x="28" y="2" width="8" height="6" rx="1" />
                              <path d="M6 8v3M19 8v3M32 8v3" /><rect x="2" y="11" width="8" height="5" rx="1.5" /><rect x="15" y="11" width="8" height="5" rx="1.5" /><rect x="28" y="11" width="8" height="5" rx="1.5" />
                              <path d="M6 16v2h26v-2" />
                            </React.Fragment>
                          )}
                        </svg>
                        <span className="h">{h}</span>
                      </span>
                      <span className="d">{d}</span>
                    </button>
                  ))}
                </div>

                {/* ── แผง ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="grid" size={13} />แผงโซลาร์<span className="ln" />
                    <span style={{ fontWeight: 600 }}>สเปคดึงจากคลังสินค้า</span></span>
                  {/* จัดตามหมวดย่อยที่ตั้งไว้ในคลัง (AIKO / JINKO / LONGI …) รุ่นเยอะแล้วหาง่ายกว่าไล่ทีละบรรทัด
                      รุ่นที่ยังไม่ได้จัดหมวดย่อยจะไปกองรวมกันท้ายสุด */}
                  <select className="p3-inp" value={S.panelModel || ""} onChange={(e) => set({ panelModel: e.target.value })}>
                    <option value="">— เลือกรุ่นแผง —</option>
                    {(() => {
                      const opt = (p) => <option key={p.model} value={p.model}>{p.model} ({p.wp}W)</option>;
                      const groups = [];
                      stockPanels.forEach((p) => {
                        const g = String(p.group || "").trim();
                        let e = groups.find((x) => x.g === g);
                        if (!e) groups.push(e = { g, list: [] });
                        e.list.push(p);
                      });
                      groups.sort((a, b) => (a.g ? 0 : 1) - (b.g ? 0 : 1));   // ที่ยังไม่จัดหมวด ไว้ท้ายสุด
                      if (groups.length === 1 && !groups[0].g) return stockPanels.map(opt);
                      return groups.map((x) => (x.g
                        ? <optgroup key={x.g} label={x.g}>{x.list.map(opt)}</optgroup>
                        : <optgroup key="_etc" label="ยังไม่จัดหมวดย่อย">{x.list.map(opt)}</optgroup>));
                    })()}
                  </select>
                  {/* ค่าไฟฟ้าทั้งหมดคือคอลัมน์ STC ในดาต้าชีต (ไม่ใช่คอลัมน์ NOCT/NMOT) */}
                  <span className="p3-eb" style={{ marginTop: 2 }}>ค่าไฟฟ้า @ STC<span style={{ fontWeight: 600 }}>1000 W/m² · เซลล์ 25°C · AM1.5</span><span className="ln" /></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                    <SuSpec label="Pmax (STC)" value={panel.wp} step={5} suffix="W" src={srcOf(S.panel, stockPanel, "wp")} onChange={(v) => setP("wp", v)} onReset={() => setP("wp", null)} />
                    <SuSpec label="Voc (STC)" value={panel.voc} suffix="V" src={srcOf(S.panel, stockPanel, "voc")} onChange={(v) => setP("voc", v)} onReset={() => setP("voc", null)} />
                    <SuSpec label="Isc (STC)" value={panel.isc} suffix="A" src={srcOf(S.panel, stockPanel, "isc")} onChange={(v) => setP("isc", v)} onReset={() => setP("isc", null)} />
                    <SuSpec label="Vmp (STC)" value={panel.vmp} suffix="V" src={srcOf(S.panel, stockPanel, "vmp")} onChange={(v) => setP("vmp", v)} onReset={() => setP("vmp", null)} />
                    <SuSpec label="Imp (STC)" value={panel.imp} suffix="A" src={srcOf(S.panel, stockPanel, "imp")} onChange={(v) => setP("imp", v)} onReset={() => setP("imp", null)} />
                  </div>
                  <span className="p3-eb" style={{ marginTop: 2 }}>ค่าตามอุณหภูมิ &amp; อายุการใช้งาน<span className="ln" /></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                    <SuSpec label="ค่าอุณหภูมิ Voc" value={panel.tcVoc} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcVoc")} onChange={(v) => setP("tcVoc", v)} onReset={() => setP("tcVoc", null)} />
                    <SuSpec label="ค่าอุณหภูมิ Isc" value={panel.tcIsc} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcIsc")} onChange={(v) => setP("tcIsc", v)} onReset={() => setP("tcIsc", null)} />
                    <SuSpec label="ค่าอุณหภูมิ Pmax" value={panel.tcPmax} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcPmax")} onChange={(v) => setP("tcPmax", v)} onReset={() => setP("tcPmax", null)} />
                    <SuSpec label="NOCT / NMOT" value={panel.noct} step={1} suffix="°C" src={srcOf(S.panel, stockPanel, "noct")} onChange={(v) => setP("noct", v)} onReset={() => setP("noct", null)} />
                    <SuSpec label="เสื่อมปีแรก" value={panel.deg1} step={0.1} suffix="%" src={srcOf(S.panel, stockPanel, "deg1")} onChange={(v) => setP("deg1", v)} onReset={() => setP("deg1", null)} />
                    <SuSpec label="เสื่อมปีถัดไป" value={panel.degY} step={0.05} suffix="%/ปี" src={srcOf(S.panel, stockPanel, "degY")} onChange={(v) => setP("degY", v)} onReset={() => setP("degY", null)} />
                  </div>
                  <span className="p3-note">
                    กรอกจากคอลัมน์ <b>STC</b> ในดาต้าชีตเท่านั้น — ระบบจะแปลงไปที่อุณหภูมิใช้งานจริงเองด้วยค่าอุณหภูมิและ NOCT ด้านล่าง ·
                    ค่าที่คลังยังไม่มีจะเติมค่ากลางให้ก่อน แก้ทับได้ ผูกกับงานนี้งานเดียว ไม่กระทบคลัง
                  </span>
                </div>

                {/* ── อินเวอร์เตอร์ ── */}
                {!isMicro ? (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="box" size={13} />สตริงอินเวอร์เตอร์<span className="ln" /></span>
                    <div style={{ display: "flex", gap: 9 }}>
                      <select className="p3-inp" style={{ flex: 1 }} value={S.invModel || ""} onChange={(e) => set({ invModel: e.target.value })}>
                        <option value="">— เลือกรุ่นอินเวอร์เตอร์ —</option>
                        {stockInv.map((p) => <option key={p.model} value={p.model}>{p.model}</option>)}
                      </select>
                      <label className="p3-f" style={{ width: 108, flex: "0 0 auto" }}>
                        <span className="lb" style={{ display: "flex", gap: 5 }}>
                          <span>จำนวนตัว</span>
                          {inv.kw && S.invCount !== invSuggest ? (
                            <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }} title={"กำลังแผง " + scR(dcKwAll, 1) + " kWp ÷ " + (scNum(inv.maxPv) || scR(scNum(inv.kw) * 1.3, 1)) + " kW ต่อตัว"}
                              onClick={(e) => { e.preventDefault(); set({ invCount: invSuggest }); }}>ใช้ {invSuggest}</button>
                          ) : null}
                        </span>
                        <input className="p3-inp" type="number" min="1" step="1" value={S.invCount} onChange={(e) => set({ invCount: Math.max(1, +e.target.value || 1) })} />
                      </label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                      <SuSpec label="กำลัง AC" value={inv.kw} step={0.1} suffix="kW" src={srcOf(S.inv, stockInvRow, "kw")} onChange={(v) => setI("kw", v)} onReset={() => setI("kw", null)} />
                      <SuSpec label="MPPT ต่ำสุด" value={inv.mpptVmin} step={5} suffix="V" src={srcOf(S.inv, stockInvRow, "mpptVmin")} onChange={(v) => setI("mpptVmin", v)} onReset={() => setI("mpptVmin", null)} />
                      <SuSpec label="MPPT สูงสุด" value={inv.mpptVmax} step={5} suffix="V" src={srcOf(S.inv, stockInvRow, "mpptVmax")} onChange={(v) => setI("mpptVmax", v)} onReset={() => setI("mpptVmax", null)} />
                      <SuSpec label="แรงดัน DC สูงสุด" value={inv.maxVdc} step={10} suffix="V" src={srcOf(S.inv, stockInvRow, "maxVdc")} onChange={(v) => setI("maxVdc", v)} onReset={() => setI("maxVdc", null)} />
                      <SuSpec label="แรงดันเริ่มทำงาน" value={inv.vStart} step={10} suffix="V" src={srcOf(S.inv, stockInvRow, "vStart")} onChange={(v) => setI("vStart", v)} onReset={() => setI("vStart", null)} />
                      <SuSpec label="กระแสสูงสุด/อินพุต" value={inv.maxInA} step={0.5} suffix="A" src={srcOf(S.inv, stockInvRow, "maxInA")} onChange={(v) => setI("maxInA", v)} onReset={() => setI("maxInA", null)} />
                      <SuSpec label="กระแสสูงสุด/MPPT" value={inv.maxMpptA} step={0.5} suffix="A" src={srcOf(S.inv, stockInvRow, "maxMpptA")} onChange={(v) => setI("maxMpptA", v)} onReset={() => setI("maxMpptA", null)} />
                      <SuSpec label="กระแสลัดวงจรสูงสุด/MPPT" value={inv.maxIscA} step={0.5} suffix="A" src={srcOf(S.inv, stockInvRow, "maxIscA")} onChange={(v) => setI("maxIscA", v)} onReset={() => setI("maxIscA", null)} />
                      <SuSpec label="จำนวน MPPT" value={inv.inputs} step={1} suffix="ช่อง" src={srcOf(S.inv, stockInvRow, "inputs")} onChange={(v) => setI("inputs", v)} onReset={() => setI("inputs", null)} />
                      <SuSpec label="อินพุตต่อ 1 MPPT" value={inv.strPerMppt} step={1} suffix="ขั้ว" src={srcOf(S.inv, stockInvRow, "strPerMppt")} onChange={(v) => setI("strPerMppt", v)} onReset={() => setI("strPerMppt", null)} />
                      <SuSpec label="ประสิทธิภาพ (ใช้คิดผลผลิต)" value={inv.effEuro || inv.eff} step={0.1} suffix="%" src={srcOf(S.inv, stockInvRow, inv.effEuro ? "effEuro" : "eff")} onChange={(v) => setI(inv.effEuro ? "effEuro" : "eff", v)} onReset={() => setI(inv.effEuro ? "effEuro" : "eff", null)} />
                    </div>
                    {/* เทียบกระแสให้เห็นทันทีว่าคู่ไหนเทียบกับคู่ไหน */}
                    {panel.imp && (() => {
                      const per = scStringsPerMppt(panel, inv);
                      const cur = scCurrent(panel, inv, per);
                      const lay = scPinLayout(inv, S.invCount);
                      const row = (lb, val, lim, tip) => (
                        <span className="p3-stat" title={tip} style={{ color: lim && val > lim ? "var(--tint-red-tx)" : undefined }}>
                          {lb} <b>{val} A</b>{lim ? <span style={{ color: "var(--text-3)", fontWeight: 700 }}>&nbsp;/ {lim} A</span> : <span style={{ color: "var(--text-3)" }}>&nbsp;/ ยังไม่ระบุ</span>}
                        </span>
                      );
                      return (
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                          {row("1 สตริง (Imp)", cur.impA, cur.limIn, "Imp ของแผง 1 สตริง เทียบกับกระแสสูงสุดของ 1 ขั้ว")}
                          {row("รวมใน 1 MPPT", cur.opA, cur.limOp, "ทุกสตริงที่ขนานเข้าช่อง MPPT เดียวกันรวมกัน เทียบกับกระแสสูงสุดต่อ MPPT")}
                          {row("ลัดวงจร (Isc×1.25)", cur.scA, cur.limSc, "Isc×1.25 ตามมาตรฐานการติดตั้ง เทียบกับพิกัดกระแสลัดวงจรของช่อง MPPT")}
                          <span className="p3-stat" title={"ขั้วที่มี " + lay.phys + " ต่อ MPPT · ตัดลงถ้ากระแสขนานเกินพิกัด"}>
                            ขนานได้ <b>{per}</b> สตริง/MPPT</span>
                          <span className="p3-stat" title={lay.mppt + " ช่อง MPPT × " + lay.phys + " ขั้ว"}>ขั้วทั้งระบบ <b>{lay.pins}</b></span>
                        </div>
                      );
                    })()}
                    {(!inv.mpptVmin || !inv.maxVdc) && (
                      <div className="su-alert warn"><P3Icon name="height" size={14} />รุ่นนี้ยังไม่ได้กรอกช่วง MPPT / แรงดันสูงสุดในคลัง — กรอกตรงนี้ก่อนได้ แล้วค่อยไปเติมถาวรที่หน้าคลังสินค้า › สเปคอินเวอร์เตอร์</div>
                    )}
                  </div>
                ) : (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="box" size={13} />ไมโครอินเวอร์เตอร์<span className="ln" /><span style={{ fontWeight: 600 }}>แนะนำอัตราส่วนให้อัตโนมัติ</span></span>
                    {/* ── เลือกอัตราส่วนแผง : ไมโคร ── */}
                    <div className="su-mgrid">
                      {(microPlans || []).map((m, i) => {
                        const on = (S.microRatio || (microPlans[0] || {}).ratio) === m.ratio;
                        return (
                          <button key={m.ratio} className="su-mcard" data-on={on ? "1" : "0"} data-bad={m.ok ? "0" : "1"}
                            onClick={() => set({ microRatio: m.ratio })}>
                            <span className="rt">
                              <SuMicroGlyph per={m.per} mppt={m.nMppt} on={on} />
                              <b>แผง {m.per} : ไมโคร 1</b>
                              {i === 0 && m.ok && <span className="tag">แนะนำ</span>}
                              {!m.ok && <span className="tag bad">สเปคไม่ผ่าน</span>}
                            </span>
                            <span className="mo">{m.model}</span>
                            <span className="st">
                              <span><i>ใช้</i><b>{m.units}</b> ตัว</span>
                              <span><i>AC/ตัว</i><b>{m.acW}</b> W</span>
                              <span><i>DC/AC</i><b>{m.dcAc}</b></span>
                              <span><i>MPPT</i><b>{m.nMppt}</b> ช่อง</span>
                            </span>
                            <span className="wy">{m.why}</span>
                          </button>
                        );
                      })}
                    </div>
                    {microSel && (
                      <React.Fragment>
                        {/* ── สเปคไฟฟ้า ชุดเดียวกับสตริงอินเวอร์เตอร์ ── */}
                        <span className="p3-eb" style={{ marginTop: 3 }}>สเปคไฟฟ้าต่อ 1 ตัว<span className="ln" />
                          <span style={{ fontWeight: 600 }}>แก้ทับได้ ระบบจำไว้เฉพาะงานนี้</span></span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                          <SuSpec label="กำลัง AC ต่อเนื่อง" value={microSel.spec.acW} step={50} suffix="W" src={srcOf(S.micro, stockMicroRow, "acW")} onChange={(v) => setM("acW", v)} onReset={() => setM("acW", null)} />
                          <SuSpec label="แรงดัน DC สูงสุด" value={microSel.spec.maxVdc} step={5} suffix="V" src={srcOf(S.micro, stockMicroRow, "maxVdc")} onChange={(v) => setM("maxVdc", v)} onReset={() => setM("maxVdc", null)} />
                          <SuSpec label="จำนวน MPPT" value={microSel.spec.mppt} step={1} suffix="ช่อง" src={srcOf(S.micro, stockMicroRow, "mppt")} onChange={(v) => setM("mppt", v)} onReset={() => setM("mppt", null)} />
                          <SuSpec label="MPPT ต่ำสุด" value={microSel.spec.mpptVmin} step={1} suffix="V" src={srcOf(S.micro, stockMicroRow, "mpptVmin")} onChange={(v) => setM("mpptVmin", v)} onReset={() => setM("mpptVmin", null)} />
                          <SuSpec label="MPPT สูงสุด" value={microSel.spec.mpptVmax} step={1} suffix="V" src={srcOf(S.micro, stockMicroRow, "mpptVmax")} onChange={(v) => setM("mpptVmax", v)} onReset={() => setM("mpptVmax", null)} />
                          <SuSpec label="กระแสทำงานสูงสุด/ช่อง" value={microSel.spec.maxInA} step={0.5} suffix="A" src={srcOf(S.micro, stockMicroRow, "maxInA")} onChange={(v) => setM("maxInA", v)} onReset={() => setM("maxInA", null)} />
                          <SuSpec label="กระแสลัดวงจรสูงสุด/ช่อง" value={microSel.spec.maxIscA} step={0.5} suffix="A" src={srcOf(S.micro, stockMicroRow, "maxIscA")} onChange={(v) => setM("maxIscA", v)} onReset={() => setM("maxIscA", null)} />
                          <SuSpec label="รับแผงต่ำสุด" value={microSel.spec.wpMin} step={10} suffix="W" src={srcOf(S.micro, stockMicroRow, "wpMin")} onChange={(v) => setM("wpMin", v)} onReset={() => setM("wpMin", null)} />
                          <SuSpec label="รับแผงสูงสุด" value={microSel.spec.wpMax} step={10} suffix="W" src={srcOf(S.micro, stockMicroRow, "wpMax")} onChange={(v) => setM("wpMax", v)} onReset={() => setM("wpMax", null)} />
                          <SuSpec label="กระแสออก AC/ตัว" value={microSel.spec.outA} step={0.1} suffix="A" src={srcOf(S.micro, stockMicroRow, "outA")} onChange={(v) => setM("outA", v)} onReset={() => setM("outA", null)} />
                          <SuSpec label="ต่อพ่วงได้/วงจร" value={microSel.spec.perBranch} step={1} suffix="ตัว" src={srcOf(S.micro, stockMicroRow, "perBranch")} onChange={(v) => setM("perBranch", v)} onReset={() => setM("perBranch", null)} />
                          <SuSpec label="ประสิทธิภาพ" value={microSel.spec.eff} step={0.1} suffix="%" src={srcOf(S.micro, stockMicroRow, "eff")} onChange={(v) => setM("eff", v)} onReset={() => setM("eff", null)} />
                        </div>
                        {/* เทียบกระแสเข้า 1 ช่อง MPPT ให้เห็นทันที (แบบเดียวกับสตริง) */}
                        {panel.imp && (
                          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                            <span className="p3-stat" style={{ color: microSel.cur.limOp && microSel.cur.opA > microSel.cur.limOp ? "var(--tint-red-tx)" : undefined }}>
                              กระแสทำงาน (Imp) <b>{microSel.cur.opA} A</b>
                              <span style={{ color: "var(--text-3)", fontWeight: 700 }}>&nbsp;/ {microSel.cur.limOp || "—"} A</span>
                            </span>
                            <span className="p3-stat" style={{ color: microSel.cur.limSc && microSel.cur.scA > microSel.cur.limSc ? "var(--tint-red-tx)" : undefined }}>
                              กระแสลัดวงจร (Isc×1.25) <b>{microSel.cur.scA} A</b>
                              <span style={{ color: "var(--text-3)", fontWeight: 700 }}>&nbsp;/ {microSel.cur.limSc || "—"} A</span>
                            </span>
                            <span className="p3-stat">แผงต่อ 1 MPPT <b>{microSel.nSeries}</b> ใบ</span>
                          </div>
                        )}
                        {/* จุดขายจริงของไมโคร — อธิบายให้เห็นภาพ ไม่ใช่แค่ข้อความ */}
                        <div className="su-mfact">
                          <span className="ic"><P3Icon name="bulb" size={14} /></span>
                          <span>
                            <b>ทำไมเงาบังแล้วเสียแค่แผงนั้น</b> — ไมโครติดใต้แผงและแปลงเป็น AC ตรงจุดนั้นเลย
                            รุ่นนี้มี MPPT <b>{microSel.nMppt} ช่องอิสระ</b> ต่อแผง <b>{microSel.per} ใบ</b> จึงเท่ากับ
                            <b> 1 ช่อง = {microSel.nSeries} แผง</b> — แต่ละแผงหาจุดทำงานของตัวเอง
                            แผงที่โดนบังจึงตกคนเดียว ไม่ฉุดใบข้าง ๆ ต่างจากสตริงที่ทุกใบต้องใช้กระแสเท่ากัน
                          </span>
                        </div>
                      </React.Fragment>
                    )}
                    <span className="p3-note">แบบ 2:1 ประหยัดกว่าแต่แผงคู่เดียวกันต้องอยู่ทิศ/มุมเดียวกัน ระบบเช็คให้แล้วจากผัง 3 มิติ — กลุ่มไหนแผงเป็นเลขคี่จะเตือนไว้</span>
                  </div>
                )}
                <button className="p3-b pri" style={{ alignSelf: "flex-end", padding: "10px 20px" }} onClick={() => setStep(1)}>
                  ถัดไป · {isMicro ? "การต่อไมโคร" : "การต่อสตริง"}<P3Icon name="arrow" size={14} />
                </button>
              </React.Fragment>
            )}

            {/* ══ ขั้น 2 · การต่อ ══ */}
            {step === 1 && (
              <React.Fragment>
                {/* กลุ่มทิศทาง */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="roof" size={13} />กลุ่มทิศทางจากผัง 3 มิติ<span className="ln" /><span style={{ fontWeight: 600 }}>{groups.length} กลุ่ม</span></span>
                  <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                    {groups.map((g) => (
                      <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--ln)", borderRadius: 12, padding: "8px 12px 8px 8px", minWidth: 168 }}>
                        <SuFacing tilt={g.tilt} az={g.az} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{g.count} แผง</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.45 }}>{g.roofName}{g.side ? " · " + g.side : ""}</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>เอียง {g.tilt}° · ทิศ {g.az}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!isMicro && range && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="height" size={13} />จำนวนแผงต่ออนุกรม (ต่อ 1 สตริง)<span className="ln" /></span>
                    <span className="p3-note" style={{ marginTop: -3 }}>
                      แถบคือช่วงแรงดันจริงของสตริง ตั้งแต่ตอน<b style={{ color: "var(--tint-amber-tx)" }}>แผงร้อนจัด</b>ถึงตอน<b style={{ color: "var(--acd)" }}>อากาศเย็น</b> —
                      ต้องอยู่ในพื้นเขียว (ช่วง MPPT) ตลอด และขีด Voc ห้ามเลยเส้นแดง
                    </span>
                    <SuVoltBand rows={range.rows.filter((r) => r.n >= Math.max(1, range.min - 2) && r.n <= range.max + 2)}
                      inv={inv} sel={S.series || range.best} onPick={(n) => set({ series: n })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">ต่อได้ <b>{range.min}–{range.max}</b> แผง/สตริง</span>
                      <span className="p3-stat">ระบบแนะนำ <b>{range.best}</b> แผง</span>
                      <span className="p3-stat">สตริงต่อ MPPT <b>{scStringsPerMppt(panel, inv)}</b></span>
                    </div>
                  </div>
                )}

                {/* ── ผัง 2D: จัดแผงเข้าสตริงเองได้ ── */}
                {!isMicro && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="plan" size={13} />ผังแผง 2 มิติ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{isManual ? "แก้เอง" : "ระบบจัดให้"}</span></span>
                    {/* จานสี = เลือกสตริงที่จะทา แล้วแตะ/ลากบนแผงในผัง (ใช้ได้ทันที ไม่ต้องกดปุ่มก่อน) */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {(plan && plan.strings ? plan.strings : []).map((s) => (
                        <button key={s.id} className="p3-chip" data-on={activeStr === s.id ? "1" : "0"}
                          onClick={() => setActiveStr(s.id)}
                          title={s.chk.ok ? "สตริง " + s.id + " · " + s.chk.band + " — กดแล้วแตะแผงในผังเพื่อย้ายเข้าสตริงนี้" : s.chk.fails.join(" · ")}
                          style={{ borderColor: activeStr === s.id ? suColor(s.id) : "var(--ln2)",
                            background: activeStr === s.id ? suColor(s.id) + "1E" : "var(--surface)",
                            color: activeStr === s.id ? suColor(s.id) : "var(--text-2)" }}>
                          <span className="dot" style={{ background: suColor(s.id), width: 9, height: 9 }} />
                          สตริง {s.id} · <b>{s.n}</b>
                          {!s.chk.ok && <span style={{ color: "var(--tint-red-tx)", fontWeight: 800 }}>!</span>}
                          {s.mixed && <span style={{ color: "var(--tint-amber-tx)", fontWeight: 800 }}>⌇</span>}
                        </button>
                      ))}
                      <button className="p3-chip" onClick={() => setActiveStr(nextStr)} data-on={activeStr === nextStr ? "1" : "0"}
                        title="เริ่มสตริงใหม่ แล้วแตะแผงที่จะใส่">
                        <P3Icon name="plus" size={12} />สตริงใหม่
                      </button>
                      <button className="p3-chip" onClick={() => setActiveStr(0)} data-on={activeStr === 0 ? "1" : "0"}
                        title="แตะแผงเพื่อเอาออกจากสตริง" style={{ borderStyle: "dashed" }}>
                        <P3Icon name="trash" size={12} />เอาออก
                      </button>
                      <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        {isManual && (
                          <button className="p3-b sm" onClick={() => set({ assign: {}, manual: false })}
                            title="ทิ้งที่แก้เองทั้งหมด กลับไปใช้ที่ระบบจัดให้">
                            <P3Icon name="reset" size={13} />คืนค่าที่ระบบจัด
                          </button>
                        )}
                        {!isManual && (
                          <button className="p3-b sm" onClick={doAuto} title="ยึดการจัดชุดนี้ไว้ แล้วเริ่มแก้เอง">
                            <P3Icon name="check" size={13} />ยึดชุดนี้ไว้แก้เอง
                          </button>
                        )}
                      </span>
                    </div>
                    <SuLayout2D foot={foot} assign={effAssign} active={activeStr !== null} onPaint={paint} />
                    <span className="p3-note">
                      {isManual
                        ? "กำลังใช้ผังที่แก้เอง · เลือกสตริงด้านบนแล้วแตะหรือลากบนแผงเพื่อย้ายเข้าสตริงนั้น · แผงเทาประ = ยังไม่อยู่สตริงไหน"
                        : "ระบบแบ่งสตริงให้แล้วตามที่เห็น — แตะหรือลากบนแผงได้เลยถ้าจะแก้ (แก้ครั้งแรกระบบจะยึดผังนี้เป็นของคุณทันที)"}
                      {" · มองจากด้านบน ทิศเหนืออยู่บน"}
                    </span>
                  </div>
                )}

                {!isMicro && plan && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="layers" size={13} />ผังการต่อ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{plan.strings.length} สตริง · {plan.panels} แผง</span></span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>สตริง</th><th>แผง</th><th>กลุ่ม</th><th>ขั้วที่เสียบ · INV / MPPT / ช่อง</th><th>Voc เย็น</th><th>ช่วงทำงาน</th><th>สถานะ</th></tr></thead>
                        <tbody>
                          {plan.strings.map((s, i) => (
                            <tr key={i} data-on={s.id && activeStr === s.id ? "1" : "0"}>
                              <td>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 9, height: 9, borderRadius: 99, background: suColor(s.id || i + 1) }} />
                                  <b>#{s.id || i + 1}</b>
                                </span>
                              </td>
                              <td><b>{s.n}</b></td>
                              <td style={{ maxWidth: 190, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: s.mixed ? "var(--tint-amber-tx)" : undefined }}>{s.label}</td>
                              <td>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <select className="p3-inp su-slot" value={(S.mpptPick || {})[s.id] != null ? (S.mpptPick || {})[s.id] : ""}
                                    onChange={(e) => pickMppt(s.id, e.target.value === "" ? null : +e.target.value)}
                                    data-pick={s.picked ? "1" : "0"}
                                    title="เลือกเองว่าจะเสียบสตริงนี้เข้าขั้วไหน — INV = อินเวอร์เตอร์ตัวที่ · MPPT = ช่อง MPPT · ช่อง = ขั้วในช่องนั้น · อัตโนมัติ = ระบบไล่ลงขั้วที่ว่าง">
                                    <option value="">{s.pin == null ? "— ไม่มีขั้วเหลือ —" : "อัตโนมัติ · " + s.addr}</option>
                                    {Array.from({ length: plan.pins }).map((_, k) => {
                                      const own = (plan.owner || {})[k] || [];
                                      const mine = own.indexOf(s.id) >= 0;
                                      const busy = own.filter((x) => x !== s.id);
                                      return <option key={k} value={k}>{scMpptName(k, inv, S.invCount) +
                                        (busy.length ? " · สตริง #" + busy.join(", #") : mine ? "" : " · ว่าง")}</option>;
                                    })}
                                  </select>
                                  {s.picked && <span title="ปักช่องเอง" style={{ color: "var(--acd)", fontWeight: 800, fontSize: 11 }}>●</span>}
                                </span>
                              </td>
                              <td>{s.chk.vocCold} V</td>
                              <td>{s.chk.vmpHot}–{s.chk.vmpCold} V</td>
                              <td style={{ color: s.chk.ok ? "var(--acd)" : "var(--tint-red-tx)", fontWeight: 800 }}>{s.chk.ok ? s.chk.band : "ไม่ผ่าน"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* ฟิวส์สตริง — จำเป็นเมื่อขนานตั้งแต่ 3 เส้นต่อ 1 ช่อง MPPT */}
                    {plan.fuse && (
                      <div className={"su-alert " + (plan.fuse.need ? "warn" : "")} style={!plan.fuse.need ? { background: "var(--surface2)", borderLeftColor: "var(--ln2)" } : null}>
                        <P3Icon name={plan.fuse.need ? "height" : "check"} size={14} />
                        {plan.fuse.need
                          ? <span><b>ต้องใส่ฟิวส์สตริง {plan.fuse.count} ตัว{plan.fuse.amp ? " ขนาด " + plan.fuse.amp + " A" : ""}</b> (พร้อมกระบอกฟิวส์) — {plan.fuse.why}
                            {plan.fuse.isc ? " · เลือกจาก Isc " + plan.fuse.isc + " A × 1.5" : ""}</span>
                          : <span>ไม่ต้องใช้ฟิวส์สตริง — {plan.fuse.why}</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">DC <b>{plan.dcKw}</b> kWp</span>
                      <span className="p3-stat">AC <b>{plan.acKw}</b> kW</span>
                      <span className="p3-stat" style={{ color: plan.dcAc > 1.4 || plan.dcAc < 0.85 ? "var(--tint-amber-tx)" : undefined }}>DC/AC <b>{plan.dcAc}</b></span>
                    </div>
                  </div>
                )}

                {isMicro && microSel && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="layers" size={13} />การต่อไมโคร<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{microSel.model}</span></span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>กลุ่มทิศทาง</th><th>แผง</th><th>ไมโคร</th><th>ช่อง MPPT</th><th>หมายเหตุ</th></tr></thead>
                        <tbody>
                          {groups.map((g) => {
                            const u = Math.ceil(g.count / microSel.per), odd = microSel.per > 1 && g.count % microSel.per;
                            return (
                              <tr key={g.key}>
                                <td style={{ maxWidth: 210 }}>{g.label}</td>
                                <td><b>{g.count}</b></td>
                                <td><b>{u}</b> ตัว</td>
                                <td>{u * microSel.nMppt} ช่อง</td>
                                <td style={{ color: odd ? "var(--tint-amber-tx)" : "var(--text-3)" }}>{odd ? "เหลือแผงเดี่ยว 1 แผง (ตัวสุดท้ายใช้ช่องเดียว)" : "ลงตัวพอดี"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* ── ตรวจแรงดัน/กระแสของ 1 ช่อง MPPT (= สตริงสั้น ๆ ที่มีแผง n ใบ) ── */}
                    <span className="p3-eb" style={{ marginTop: 3 }}>ตรวจสเปคไฟฟ้าต่อ 1 ช่อง MPPT<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{microSel.nSeries} แผงต่อช่อง</span></span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>รายการตรวจ</th><th>ได้</th><th>พิกัด</th><th>ผล</th></tr></thead>
                        <tbody>
                          {microSel.chk.checks.map((c) => (
                            <tr key={c.k}>
                              <td>{c.k === "voc" ? "Voc ตอนอากาศเย็น " + scNum((S.env || {}).tMin, 15) + "°C"
                                : c.k === "hot" ? "Vmp ตอนแผงร้อน " + scNum((S.env || {}).tCellHot, 65) + "°C"
                                : "Vmp ตอนอากาศเย็น"}</td>
                              <td><b>{scR(c.v, 1)}</b> V</td>
                              <td>{c.k === "hot" ? "≥ " : "≤ "}{c.lim} V</td>
                              <td style={{ color: c.ok ? "#12794A" : "var(--tint-red-tx)", fontWeight: 800 }}>{c.ok ? "ผ่าน" : "ไม่ผ่าน"}</td>
                            </tr>
                          ))}
                          <tr>
                            <td>กระแสทำงาน Imp</td><td><b>{microSel.cur.opA}</b> A</td>
                            <td>{microSel.cur.limOp ? "≤ " + microSel.cur.limOp + " A" : "ยังไม่ระบุ"}</td>
                            <td style={{ color: !microSel.cur.limOp ? "var(--text-3)" : microSel.cur.opA <= microSel.cur.limOp ? "#12794A" : "var(--tint-red-tx)", fontWeight: 800 }}>
                              {!microSel.cur.limOp ? "—" : microSel.cur.opA <= microSel.cur.limOp ? "ผ่าน" : "ไม่ผ่าน"}</td>
                          </tr>
                          <tr>
                            <td>กระแสลัดวงจร Isc×1.25</td><td><b>{microSel.cur.scA}</b> A</td>
                            <td>{microSel.cur.limSc ? "≤ " + microSel.cur.limSc + " A" : "ยังไม่ระบุ"}</td>
                            <td style={{ color: !microSel.cur.limSc ? "var(--text-3)" : microSel.cur.scA <= microSel.cur.limSc ? "#12794A" : "var(--tint-red-tx)", fontWeight: 800 }}>
                              {!microSel.cur.limSc ? "—" : microSel.cur.scA <= microSel.cur.limSc ? "ผ่าน" : "ไม่ผ่าน"}</td>
                          </tr>
                          {(microSel.spec.wpMin > 0 || microSel.spec.wpMax > 0) && (
                            <tr>
                              <td>กำลังแผงที่รองรับ</td><td><b>{scNum(panel.wp)}</b> W</td>
                              <td>{microSel.spec.wpMin || "—"} – {microSel.spec.wpMax || "—"} W</td>
                              <td style={{ color: (!microSel.spec.wpMin || scNum(panel.wp) >= microSel.spec.wpMin) && (!microSel.spec.wpMax || scNum(panel.wp) <= microSel.spec.wpMax) ? "#12794A" : "var(--tint-red-tx)", fontWeight: 800 }}>
                                {(!microSel.spec.wpMin || scNum(panel.wp) >= microSel.spec.wpMin) && (!microSel.spec.wpMax || scNum(panel.wp) <= microSel.spec.wpMax) ? "ผ่าน" : "ไม่ผ่าน"}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <span className="p3-note">
                      ไมโครมองเป็น “สตริงสั้น ๆ” ได้เลย — 1 ช่อง MPPT = 1 สตริงที่มีแผง {microSel.nSeries} ใบ
                      จึงตรวจแรงดัน/กระแสด้วยเกณฑ์เดียวกับสตริงอินเวอร์เตอร์ทุกประการ
                    </span>

                    {/* ── ผัง 2 มิติ: จัดแผงเข้าตัวไมโครเอง (แบบเดียวกับจัดสตริง) ── */}
                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="plan" size={13} />จัดแผงเข้าตัวไมโคร<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{microManual ? "แก้เอง" : "ระบบจัดให้"}</span></span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {microUnits.map((u) => (
                        <button key={u.id} className="p3-chip" data-on={activeMu === u.id ? "1" : "0"}
                          onClick={() => setActiveMu(u.id)}
                          title={u.mixed ? "ตัวนี้คร่อมกลุ่มทิศทาง — แผงคนละทิศห้ามอยู่ไมโครตัวเดียวกัน"
                            : u.over ? "ใส่แผงเกินที่ไมโครรุ่นนี้รับได้" : "ไมโคร " + u.id + " · " + u.gLabel}
                          style={{ borderColor: activeMu === u.id ? suColor(u.id) : "var(--ln2)",
                            background: activeMu === u.id ? suColor(u.id) + "1E" : "var(--surface)",
                            color: activeMu === u.id ? suColor(u.id) : "var(--text-2)" }}>
                          <span className="dot" style={{ background: suColor(u.id), width: 9, height: 9 }} />
                          ไมโคร {u.id} · <b>{u.n}</b>
                          {(u.mixed || u.over) && <span style={{ color: "var(--tint-red-tx)", fontWeight: 800 }}>!</span>}
                        </button>
                      ))}
                      <button className="p3-chip" onClick={() => setActiveMu(nextMu)} data-on={activeMu === nextMu ? "1" : "0"}
                        title="เริ่มไมโครตัวใหม่ แล้วแตะแผงที่จะใส่"><P3Icon name="plus" size={12} />ไมโครใหม่</button>
                      <button className="p3-chip" onClick={() => setActiveMu(0)} data-on={activeMu === 0 ? "1" : "0"}
                        title="แตะแผงเพื่อเอาออกจากไมโคร" style={{ borderStyle: "dashed" }}><P3Icon name="trash" size={12} />เอาออก</button>
                      <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                        {phases === 3 && (
                          <span className="p3-seg wide">
                            {[["unit", "สีตามไมโคร"], ["phase", "สีตามเฟส"]].map(([k, t]) => (
                              <button key={k} data-on={muColorBy === k ? "1" : "0"} onClick={() => setMuColorBy(k)}>{t}</button>
                            ))}
                          </span>
                        )}
                        {microManual ? (
                          <button className="p3-b sm" onClick={() => set({ microAssign: {}, microManual: false })}
                            title="ทิ้งที่แก้เองทั้งหมด กลับไปใช้ที่ระบบจับคู่ให้"><P3Icon name="reset" size={13} />คืนค่าที่ระบบจัด</button>
                        ) : (
                          <button className="p3-b sm" onClick={() => set({ microAssign: microAuto.assign, microManual: true })}
                            title="ยึดการจับคู่ชุดนี้ไว้ แล้วเริ่มแก้เอง"><P3Icon name="check" size={13} />ยึดชุดนี้ไว้แก้เอง</button>
                        )}
                      </span>
                    </div>
                    <SuLayout2D foot={foot} assign={microAssign} active={activeMu !== null} onPaint={paintMu}
                      unitName="ไมโคร"
                      labels={phases === 3 ? uidPhase : null}
                      colorOf={phases === 3 && muColorBy === "phase"
                        ? (uid) => SU_PHCOLOR[uidPhase[uid]] || "#94A3B8" : null} />
                    <span className="p3-note">
                      {microSel.per > 1
                        ? "ระบบจับคู่แผงที่ติดกันบนหลังคาให้แล้ว (สายจะได้สั้น) — แตะหรือลากบนแผงเพื่อย้ายเข้าตัวที่เลือกไว้ด้านบน · แผงคนละทิศห้ามอยู่ตัวเดียวกัน"
                        : "อัตราส่วน 1:1 — แผงทุกใบมีไมโครของตัวเอง สีในผังคือหมายเลขตัว ไม่ต้องจับคู่อะไรเพิ่ม"}
                      {phases === 3 ? " · ตัวหนังสือบนแผงคือเฟสที่แผงนั้นลง (L1/L2/L3)" : ""}
                      {" · มองจากด้านบน ทิศเหนืออยู่บน"}
                    </span>
                    {(microUnassigned > 0 || microUnits.some((u) => u.mixed || u.over)) && (
                      <div className="su-alert warn"><P3Icon name="height" size={14} /><span>
                        {microUnassigned > 0 && <React.Fragment>ยังมีแผง <b>{microUnassigned}</b> ใบที่ไม่ได้อยู่ไมโครตัวไหน </React.Fragment>}
                        {microUnits.filter((u) => u.mixed).length > 0 && <React.Fragment>· มี <b>{microUnits.filter((u) => u.mixed).length}</b> ตัวที่คร่อมกลุ่มทิศทาง (แผงคนละทิศต้องแยกตัวกัน) </React.Fragment>}
                        {microUnits.filter((u) => u.over).length > 0 && <React.Fragment>· มี <b>{microUnits.filter((u) => u.over).length}</b> ตัวที่ใส่แผงเกิน {microSel.per} ใบ</React.Fragment>}
                      </span></div>
                    )}
                    {/* ── แบ่งเฟส: ไมโครเป็นอุปกรณ์ 1 เฟส ระบบ 3 เฟสต้องเกลี่ยลง L1/L2/L3 ── */}
                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="grid" size={13} />ระบบไฟและการแบ่งเฟส<span className="ln" />
                      <span className="p3-seg wide">
                        {[[1, "1 เฟส"], [3, "3 เฟส"]].map(([v, t]) => (
                          <button key={v} data-on={phases === v ? "1" : "0"} onClick={() => set({ phases: v })}>{t}</button>
                        ))}
                      </span>
                    </span>
                    {phases === 1 ? (
                      <span className="p3-note">ระบบ 1 เฟส — ไมโครทุกตัวลงเฟสเดียวกันหมด ไม่ต้องแบ่งกลุ่ม
                        {jobPhase === 3 ? " · หมายเหตุ: ข้อมูลงานระบุไว้เป็น 3 เฟส" : ""}</span>
                    ) : (
                      <React.Fragment>
                        <div className="su-phgrid">
                          {phaseBins.map((b) => (
                            <div key={b.phase} className="su-phcard" data-ph={b.phase}>
                              <span className="hd"><b>{b.label}</b><i>{b.count} ตัว</i></span>
                              <span className="big">{b.acKw}<small>kW</small></span>
                              <span className="sub">{b.panels} แผง · {b.amps} A{b.branches ? " · " + b.branches + " วงจร" : ""}</span>
                              <span className="bar"><i style={{ width: (phaseBins.reduce((a, x) => Math.max(a, x.dcW), 1)
                                ? b.dcW / phaseBins.reduce((a, x) => Math.max(a, x.dcW), 1) * 100 : 0) + "%" }} /></span>
                              <span className="us">{b.units.map((u) => u.id).join(" · ") || "—"}</span>
                            </div>
                          ))}
                        </div>
                        {phaseBal && (
                          <div className={"su-alert " + (phaseBal.ok ? "good" : "warn")}>
                            <P3Icon name={phaseBal.ok ? "check" : "height"} size={14} />
                            <span>
                              {phaseBal.ok
                                ? <React.Fragment>เฟสสมดุลดี — ต่างกัน <b>{phaseBal.spread}</b> ตัว ({phaseBal.pct}% ของกำลัง) อยู่ในเกณฑ์ {phaseBal.tol}%</React.Fragment>
                                : <React.Fragment>เฟสไม่สมดุล — เฟสที่หนักกับเบาต่างกัน <b>{phaseBal.pct}%</b> ({phaseBal.spread} ตัว) เกินเกณฑ์ {phaseBal.tol}% ควรเกลี่ยใหม่</React.Fragment>}
                            </span>
                          </div>
                        )}
                        {/* ย้ายเฟสรายตัว — ระบบเกลี่ยให้แล้ว แต่หน้างานอาจต้องสลับตามตำแหน่งสายจริง */}
                        <div className="su-scroll">
                          <table className="su-tb">
                            <thead><tr><th>ไมโคร</th><th>แผง</th><th>กลุ่มทิศทาง</th><th>เฟส</th></tr></thead>
                            <tbody>
                              {phaseBins.reduce((all, b) => all.concat(b.units.map((u) => ({ u, b }))), [])
                                .sort((a, z) => a.u.id - z.u.id).map(({ u, b }) => (
                                <tr key={u.id}>
                                  <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ width: 9, height: 9, borderRadius: 99, background: suColor(u.id) }} />
                                    <b>ไมโคร {u.id}</b></span></td>
                                  <td>{u.n}</td>
                                  <td style={{ maxWidth: 190 }}>{u.gLabel}</td>
                                  <td>
                                    <span className="su-phpick">
                                      {[1, 2, 3].map((ph) => (
                                        <button key={ph} data-on={b.phase === ph ? "1" : "0"} data-ph={ph}
                                          title={(S.microPhase || {})[u.id] === ph ? "ล็อกไว้เอง — กดซ้ำเพื่อให้ระบบเกลี่ยเอง" : "ย้ายไปเฟสนี้"}
                                          onClick={() => setUnitPhase(u.id, (S.microPhase || {})[u.id] === ph ? null : ph)}>
                                          L{ph}{(S.microPhase || {})[u.id] === ph ? "•" : ""}
                                        </button>
                                      ))}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <span className="p3-note">
                          ระบบเกลี่ยให้กำลังแต่ละเฟสใกล้เคียงกันที่สุดแล้ว (ไมโคร {microUnits.length} ตัว →{" "}
                          {phaseBins.map((b) => b.count).join("/")}) — กด L1/L2/L3 เพื่อล็อกตัวไหนไว้เฟสไหนเอง จุด • คือตัวที่ล็อกไว้
                          ที่เหลือระบบจะเกลี่ยรอบ ๆ ให้ใหม่เอง
                          {Object.keys(S.microPhase || {}).length > 0 && (
                            <button className="p3-lnk" style={{ marginLeft: 6 }} onClick={() => set({ microPhase: {} })}>ล้างที่ล็อกไว้</button>
                          )}
                        </span>
                      </React.Fragment>
                    )}

                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">ไมโครรวม <b>{microUnits.length || microSel.units}</b> ตัว
                        {microManual && microUnits.length !== microSel.units ? <span style={{ color: "var(--text-3)", fontWeight: 700 }}>&nbsp;(จัดเอง)</span> : null}</span>
                      <span className="p3-stat">DC <b>{microSel.dcKw}</b> kWp</span>
                      <span className="p3-stat">AC <b>{microSel.acKw}</b> kW</span>
                      <span className="p3-stat">DC/AC <b>{microSel.dcAc}</b></span>
                      <span className="p3-stat">กระแส AC รวม <b>{microSel.acAmpTotal}</b> A</span>
                      {microSel.branches > 0 && (
                        <span className="p3-stat" title={"ต่อพ่วงได้ " + microSel.perBranch + " ตัวต่อวงจร"}>
                          วงจรย่อย AC <b>{microSel.branches}</b> วงจร</span>
                      )}
                    </div>
                  </div>
                )}

                {warns.map((w, i) => (
                  <div key={i} className="su-alert warn"><P3Icon name="height" size={14} /><span>{w}</span></div>
                ))}
                {/* ข้อมูลที่ยังขาด — ไม่ใช่ความผิดพลาด แค่ยังตรวจให้ไม่ได้ */}
                {(microSel && microSel.notes ? microSel.notes : []).map((n, i) => (
                  <div key={"mn" + i} className="su-alert info"><P3Icon name="bulb" size={14} /><span>{n}</span></div>
                ))}
                {(plan && plan.notes ? plan.notes : []).map((n, i) => (
                  <div key={"n" + i} className="su-alert info"><P3Icon name="bulb" size={14} /><span>{n}</span></div>
                ))}
                {!warns.length && (plan || microSel) && (
                  <div className="su-alert good"><P3Icon name="check" size={14} />การต่อผ่านทุกเงื่อนไข — แรงดันอยู่ในช่วงทำงานทั้งตอนร้อนจัดและอากาศเย็น</div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(0)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(2)}>ถัดไป · ตรวจวัด I-V<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}

            {/* ══ ขั้น 3 · ตรวจวัด I-V + ชดเชยสภาพอากาศ ══ */}
            {step === 2 && (
              <React.Fragment>
                {!par && (
                  <div className="su-alert warn"><P3Icon name="height" size={14} />ยังสร้างเส้น I-V ไม่ได้ — ต้องมี Voc / Isc / Vmp / Imp ของแผงครบก่อน (กลับไปกรอกที่ขั้นอุปกรณ์)</div>
                )}

                {/* ── จำลองทั้งวันอัตโนมัติ ── */}
                {sim && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="sun" size={13} />จำลองแสงตลอดวัน<span className="ln" />
                      {/* เดินดูทีละเดือนได้จากตรงนี้เลย ไม่ต้องเลื่อนลงไปหาแถบเลือกเดือนด้านล่าง */}
                      <span className="su-mstep">
                        <button onClick={() => stepMonth(-1)} title="เดือนก่อนหน้า"><P3Icon name="arrow" size={12} /></button>
                        <b>วันเฉลี่ยของเดือน{SC_MON[isFinite(monthNow) ? monthNow : 6]}</b>
                        <button onClick={() => stepMonth(1)} title="เดือนถัดไป"><P3Icon name="arrow" size={12} /></button>
                      </span></span>
                    <SuDayLight sim={sim} groups={groups} hour={simHour} onHour={(h) => setSite({ hour: scR(h, 2) })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">พระอาทิตย์ขึ้น <b>{ivHM(sim.sunrise)}</b></span>
                      <span className="p3-stat">ตก <b>{ivHM(sim.sunset)}</b></span>
                      <span className="p3-stat">แดดแรงสุด <b>{sim.maxPoa}</b> W/m² ตอน <b>{ivHM(sim.peak ? sim.peak.h : null)}</b></span>
                      <span className="p3-stat">ผลิตได้วันนี้ <b>{sim.dayKwh}</b> kWh</span>
                      {sim.clipHours > 0 && <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>อินเวอร์เตอร์ตัดยอด <b>{sim.clipHours}</b> ชม.</span>}
                      {sim.shadeLossPct > 0 && <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>เงากินไป <b>{sim.shadeLossKwh}</b> kWh ({sim.shadeLossPct}%)</span>}
                    </div>

                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="tree" size={12} />เงาบังรายชั่วโมง — จากตัวอาคารและสิ่งบดบังในผัง 3 มิติ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{sim.shadeFrom != null ? "โดนบัง " + ivHM(sim.shadeFrom) + "–" + ivHM(sim.shadeTo) : "ไม่มีเงาบังทั้งวัน"}</span></span>
                    <SuShadeStrip sim={sim} groups={groups} />
                    <span className="p3-note">
                      ยิงลำแสงจากแผงทุกใบ ({sim.panels} ใบ × 5 จุด) ทุก 15 นาที ไปหาดวงอาทิตย์ แล้วดูว่าชน
                      <b> ตัวอาคาร/หลังคา {sim.buildings} ชิ้น</b> · <b>สิ่งบดบังที่สำรวจไว้ {sim.obstacles} ชิ้น</b> หรือแผงแถวหน้าหรือเปล่า —
                      ลากบนกราฟด้านบนเพื่อเลื่อนเวลาดูได้
                    </span>

                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="curve" size={12} />กำลังไฟและอุณหภูมิเซลล์ตลอดวัน<span className="ln" />
                      <span style={{ fontWeight: 600 }}>สูงสุด {sim.peak ? scR(sim.peak.ac, 2) : 0} kW ตอน {ivHM(sim.peak ? sim.peak.h : null)}</span></span>
                    <SuDayPower sim={sim} groups={groups} acKw={acKw} hour={simHour} onHour={(h) => setSite({ hour: scR(h, 2) })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
                      <span><b style={{ color: "#22A35B" }}>┅</b> กำลัง DC จากแผง</span>
                      <span><b style={{ color: "#0F7A43" }}>━</b> กำลัง AC ที่ออกจากอินเวอร์เตอร์จริง</span>
                      <span><b style={{ color: "var(--tint-red-tx2)" }}>━</b> อุณหภูมิเซลล์ (แกนขวา)</span>
                    </div>
                  </div>
                )}

                {/* ── ทั้ง 12 เดือน ── */}
                {year && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="map" size={13} />ทั้งปี 12 เดือน<span className="ln" />
                      <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                        <button data-on={mapMode === "light" ? "1" : "0"} onClick={() => setMapMode("light")}>แสงที่ได้</button>
                        <button data-on={mapMode === "shade" ? "1" : "0"} onClick={() => setMapMode("shade")}>เงาบัง</button>
                      </span></span>
                    <span className="p3-note" style={{ marginTop: -2 }}>
                      แต่ละแถวคือ 1 เดือน แต่ละช่องคือครึ่งชั่วโมง — กดที่ชื่อเดือนเพื่อดูกราฟรายวันของเดือนนั้น
                    </span>
                    <SuYearMap year={year} mode={mapMode} month={isFinite(monthNow) ? monthNow : 0}
                      onMonth={(mo) => setSite({ date: mo.date })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat" title="รวมจากวันตัวแทนของแต่ละเดือน — ตัวเลขทางการดูที่ขั้นผลผลิต ซึ่งเดินครบทุกวันของปี">
                        ผลิตทั้งปี (ประมาณ) <b>{Math.round(year.totalKwh / 1000).toLocaleString()}</b> MWh</span>
                      <span className="p3-stat" style={{ color: year.shadeLossPct > 0 ? "var(--tint-amber-tx)" : undefined }}>
                        เงากินทั้งปี <b>{year.shadeLossKwh.toLocaleString()}</b> kWh ({year.shadeLossPct}%)</span>
                      {year.worstMonth && year.worstMonth.shadeLossPct > 0 && (
                        <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>เดือนที่โดนหนักสุด <b>{year.worstMonth.label}</b> ({year.worstMonth.shadeLossPct}%)</span>
                      )}
                      {year.clipHours > 0 && <span className="p3-stat">อินเวอร์เตอร์ตัดยอดรวม <b>{year.clipHours}</b> ชม./ปี</span>}
                    </div>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>เดือน</th><th>แดดขึ้น–ตก</th><th>แดดแรงสุด</th><th>กำลังสูงสุด</th><th>ผลิต/วัน</th><th>ผลิต/เดือน</th><th>เงาบัง</th></tr></thead>
                        <tbody>
                          {year.months.map((mo) => (
                            <tr key={mo.m} data-on={mo.m === monthNow ? "1" : "0"}>
                              <td><b>{mo.label}</b></td>
                              <td>{ivHM(mo.sunrise)}–{ivHM(mo.sunset)}</td>
                              <td>{mo.maxPoa} W/m²</td>
                              <td>{scR(mo.peakAc, 2)} kW</td>
                              <td>{scR(mo.dayKwh, 1)} kWh</td>
                              <td><b>{mo.monthKwh.toLocaleString()}</b> kWh</td>
                              <td style={{ fontWeight: 800, color: mo.shadeLossPct >= 5 ? "var(--tint-red-tx)" : mo.shadeLossPct > 0 ? "var(--tint-amber-tx)" : "var(--text-3)" }}>
                                {mo.shadeLossPct}%{mo.shadeFrom != null ? " (" + ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + ")" : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── เส้นทางเดินดวงอาทิตย์ + แผนที่เงาบัง ── */}
                {sunPath && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="sunShadow" size={13} />เส้นทางเดินดวงอาทิตย์ &amp; แผนที่เงาบัง<span className="ln" />
                      <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                        <button data-on={isoOn ? "1" : "0"} onClick={() => setIsoOn(true)}>ซ้อนแผนที่เงา</button>
                        <button data-on={isoOn ? "0" : "1"} onClick={() => setIsoOn(false)}>เฉพาะเส้นทาง</button>
                      </span></span>
                    <span className="p3-note" style={{ marginTop: -2 }}>
                      แกนนอนคือทิศที่ดวงอาทิตย์อยู่ แกนตั้งคือมุมสูงเหนือขอบฟ้า — เส้นโค้งสีส้มคือเส้นทางที่ดวงอาทิตย์เดินในวันนั้น
                      ตัวเลขบนเส้นประคือเวลา · พื้นหลังสีคือ<b>ทิศทางแสงที่ทำให้แผงโดนบัง</b> ยิ่งเข้มยิ่งโดนหนัก
                      เส้นทางเดินเส้นไหนวิ่งผ่านพื้นที่สี แปลว่าเดือนนั้นเวลานั้นโดนเงาแน่นอน
                    </span>
                    <SuSunPath path={sunPath} iso={isoShade}
                      mark={ivMain && ivMain.irr && !ivMain.irr.night
                        ? { alt: ivMain.irr.alt, az: ivMain.irr.az, label: ivHM(simHour) } : null} />
                    {isoOn && isoShade && (
                      <div className="su-isolg" style={{ borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                        <span style={{ fontWeight: 800, color: "var(--text-2)" }}>เงาบังเฉลี่ยทั้งระบบ</span>
                        {SU_ISO.slice().reverse().map((b) => (
                          <span key={b.lb}><i style={{ background: b.c, opacity: b.o }} />{b.lb}</span>
                        ))}
                        {!isoShade.any && <span style={{ color: "var(--acd)", fontWeight: 800 }}>· ไม่มีทิศทางแสงไหนที่ทำให้แผงโดนบังเลย</span>}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">ละติจูด <b>{scR(scNum(st.sun && st.sun.lat, 13.75), 3)}°</b></span>
                      <span className="p3-stat">ดวงอาทิตย์สูงสุดของปี <b>{sunPath.maxAlt}°</b></span>
                      {sunPath.paths[0] && sunPath.paths[0].peak && (
                        <span className="p3-stat">วันที่ยาวที่สุด <b>{ivHM(sunPath.paths[0].rise)}–{ivHM(sunPath.paths[0].set)}</b></span>
                      )}
                      {sunPath.paths[sunPath.paths.length - 1] && (
                        <span className="p3-stat">วันที่สั้นที่สุด <b>{ivHM(sunPath.paths[sunPath.paths.length - 1].rise)}–{ivHM(sunPath.paths[sunPath.paths.length - 1].set)}</b></span>
                      )}
                      {isoShade && isoShade.worst && (
                        <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>
                          ทิศทางที่โดนหนักสุด <b>ทิศ {isoShade.worst.az}° สูง {isoShade.worst.alt}°</b> ({scR(isoShade.worst.f * 100, 1)}%)</span>
                      )}
                    </div>
                    {isoOn && !isoShade && (
                      <span className="p3-note">{totalPanels > 0
                        ? "กำลังยิงลำแสงไปทั่วท้องฟ้าเพื่อวาดแผนที่เงา…"
                        : "ยังไม่มีแผงในผัง 3 มิติ จึงยังวาดแผนที่เงาไม่ได้ — เส้นทางเดินดวงอาทิตย์ด้านบนคิดจากละติจูดของหน้างานล้วน ๆ"}</span>
                    )}
                    {isoOn && isoShade && isoShade.sampled > 0 && (
                      <span className="p3-note">
                        ผังนี้มี {isoShade.panels} แผง — แผนที่เงาสุ่มแผงตัวแทน {isoShade.sampled} ใบกระจายทั่วผังเพื่อให้วาดได้ทันที
                        (ตัวบดบังคิดครบทุกชิ้น) · ตัวเลขเงาที่เอาไปคิดผลผลิตจริงยังคิดครบทุกใบเหมือนเดิม
                      </span>
                    )}
                  </div>
                )}

                {/* ── สภาพอากาศเฉลี่ยของเดือนที่เลือก ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="cloud" size={13} />สภาพอากาศเฉลี่ยเดือน{SC_MON[isFinite(monthNow) ? monthNow : 6]}<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{ivMain && ivMain.irr.measured ? "ใช้ค่าที่วัดได้จริง" : "ค่าเฉลี่ยรายเดือนของไทย"}</span></span>
                  {/* เลือกเดือน — ทุกอย่างในหน้านี้อ้างอิงวันตัวแทนของเดือนนั้น */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {SC_MON.map((mm, i) => (
                      <button key={i} className="p3-chip" data-on={i === monthNow ? "1" : "0"}
                        onClick={() => setMonth(i)}
                        style={{ padding: "5px 9px", fontSize: 10.5 }}>{mm}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))", gap: 9 }}>
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>เวลาในวัน</span>
                        <span className={"su-src " + (hourAuto ? "stock" : "edit")}>{hourAuto ? "ระบบเลือกให้" : "เลือกเอง"}</span>
                        {!hourAuto && <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ hour: null }); }}>อัตโนมัติ</button>}
                      </span>
                      <input className="p3-inp" type="time" value={(() => { const hh = Math.floor(simHour), mm = Math.round((simHour - hh) * 60);
                        return String(hh).padStart(2, "0") + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0"); })()}
                        onChange={(e) => { const p = (e.target.value || "12:00").split(":");
                          setSite({ hour: scClamp(+p[0] + (+p[1] || 0) / 60, 4, 20) }); }} />
                    </label>
                    {/* เติมค่าจำลองของเดือนนั้นให้เห็นเป็นตัวเลขจริง ไม่ใช่ช่องว่าง — แก้ทับได้ */}
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>อุณหภูมิอากาศกลางวัน</span>
                        <span className={"su-src " + (site.tAmb == null ? "stock" : "edit")}>{site.tAmb == null ? "เฉลี่ยเดือนนี้" : "แก้เอง"}</span>
                        {site.tAmb != null && <button className="p3-lnk" style={{ fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ tAmb: null }); }}>คืนค่า</button>}
                      </span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5"
                          value={site.tAmb == null ? SC_TAMB[isFinite(monthNow) ? monthNow : 6] : site.tAmb}
                          onChange={(e) => setSite({ tAmb: e.target.value === "" ? null : +e.target.value })} />
                        <span className="p3-sfx">°C</span></span></label>
                    <label className="p3-f"><span className="lb">ความเร็วลม</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" step="0.5" value={site.wind} onChange={(e) => setSite({ wind: Math.max(0, +e.target.value || 0) })} />
                        <span className="p3-sfx">m/s</span></span></label>
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ความเข้มแสงบนพื้นราบ</span>
                        <span className={"su-src " + (site.ghi == null ? "stock" : "edit")}>{site.ghi == null ? "จำลอง" : "แก้เอง"}</span>
                        {site.ghi != null && <button className="p3-lnk" style={{ fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ ghi: null }); }}>คืนค่า</button>}
                      </span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" step="10"
                          value={site.ghi == null ? (simRow ? simRow.ghi : "") : site.ghi}
                          onChange={(e) => setSite({ ghi: e.target.value === "" ? null : +e.target.value })} />
                        <span className="p3-sfx">W/m²</span></span></label>
                    <label className="p3-f"><span className="lb">อายุระบบ ณ วันวัด</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" max="30" step="0.5" value={site.age} onChange={(e) => setSite({ age: scClamp(+e.target.value || 0, 0, 30) })} />
                        <span className="p3-sfx">ปี</span></span></label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="p3-f"><span className="lb">วิธียึดแผง (มีผลกับความร้อนสะสม)</span>
                      <select className="p3-inp" value={site.mount} onChange={(e) => setSite({ mount: e.target.value })}>
                        {Object.keys(IV_MOUNT).map((k) => <option key={k} value={k}>{IV_MOUNT[k].label} — {IV_MOUNT[k].note}</option>)}
                      </select></label>
                    {/* เงา: อ่านจากโมเดล 3 มิติให้อัตโนมัติ หรือจะกรอกเองก็ได้ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>
                        เงาบังตอนวัด
                        <span className={"su-src " + (shadeAuto ? "stock" : "edit")}>{shadeAuto ? "จากโมเดล 3 มิติ" : "กรอกเอง"}</span>
                        <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ shadeAuto: !shadeAuto }); }}>
                          {shadeAuto ? "กรอกเอง" : "ให้ระบบคิดจากผัง 3 มิติ"}
                        </button>
                      </span>
                      {shadeAuto ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minHeight: 30 }}>
                          {ivRows.map((r) => (
                            <span key={r.u.id} className="p3-stat" style={{ color: r.shade >= 10 ? "var(--tint-red-tx)" : r.shade > 0 ? "var(--tint-amber-tx)" : undefined }}>
                              {r.u.name} <b>{scR(r.shade, 1)}%</b>
                            </span>
                          ))}
                          {!ivRows.some((r) => r.shade > 0.5) && (
                            <span className="p3-stat" style={{ color: "var(--acd)" }}><P3Icon name="check" size={12} />ไม่มีเงาบังเลยในเวลานี้</span>
                          )}
                        </div>
                      ) : (
                        <P3NumRange span label="" value={site.shade} min={0} max={60} step={1} suffix="%" onChange={(v) => setSite({ shade: v })} />
                      )}
                    </div>
                  </div>
                  {ivMain && !ivMain.irr.night && (
                    <React.Fragment>
                      <span className="p3-eb" style={{ marginTop: 3 }}>แสงที่ตกบนหน้าแผงจริง ({ivMain.u.name} · เอียง {scR(ivMain.u.tilt, 0)}° ทิศ {scR(ivMain.u.az, 0)}°)<span className="ln" />
                        <span style={{ fontWeight: 700, color: "var(--acd)" }}>{ivMain.irr.poaNet} W/m²</span></span>
                      <SuLightBar irr={ivMain.irr} />
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                        <span className="p3-stat" title="แสงรวมที่ตกบนพื้นราบ">แสงบนพื้นราบ <b>{ivMain.irr.ghi}</b> W/m²</span>
                        <span className="p3-stat" title="มุมระหว่างลำแสงกับเส้นตั้งฉากหน้าแผง — ยิ่งน้อยยิ่งได้แสงเต็ม">มุมตกกระทบ <b>{ivMain.irr.aoi}°</b></span>
                        <span className="p3-stat" title="แสงที่สะท้อนออกจากผิวกระจกเมื่อแสงเข้าเฉียง">ผ่านผิวกระจก <b>{scR(ivMain.irr.iam * 100, 1)}%</b></span>
                        <span className="p3-stat" style={{ color: ivMain.irr.tiltGain >= 1 ? "var(--acd)" : "var(--tint-amber-tx)" }}
                          title="มุมเอียงหลังคาทำให้ได้แสงมากกว่า/น้อยกว่าพื้นราบเท่าไหร่">
                          มุมหลังคา{ivMain.irr.tiltGain >= 1 ? "ช่วยเพิ่ม" : "ทำให้ลด"} <b>{scR(Math.abs(ivMain.irr.tiltGain - 1) * 100, 1)}%</b></span>
                        <span className="p3-stat">ดวงอาทิตย์สูง <b>{ivMain.irr.alt}°</b> ทิศ <b>{ivMain.irr.az}°</b></span>
                      </div>
                      <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="thermo" size={12} />ความร้อนสะสมหน้าแผง<span className="ln" />
                        <span style={{ fontWeight: 600 }}>{ivMain.temp.label}</span></span>
                      <SuThermo temp={ivMain.temp} />
                      <span className="p3-note">
                        แผงไม่ได้ร้อนเท่าอากาศ — แสงที่ไม่ได้แปลงเป็นไฟจะกลายเป็นความร้อนค้างอยู่หลังแผง ยิ่งยึดชิดหลังคายิ่งระบายไม่ออก
                        ตอนนี้เซลล์ร้อน <b>{ivMain.temp.tCell}°C</b> คือสูงกว่ามาตรฐาน 25°C อยู่ {scR(ivMain.temp.tCell - 25, 1)}°C
                        → กำลังหายไป <b>{scR(Math.abs(scNum(panel.tcPmax, -0.29)) * (ivMain.temp.tCell - 25), 1)}%</b> จากสัมประสิทธิ์อุณหภูมิของแผงรุ่นนี้ ({scNum(panel.tcPmax, -0.29)} %/°C)
                      </span>
                    </React.Fragment>
                  )}
                  {ivMain && ivMain.irr.night && (
                    <div className="su-alert warn"><P3Icon name="height" size={14} />เวลาที่เลือกดวงอาทิตย์ยังไม่ขึ้น/ตกแล้ว — เลือกช่วง 8:00–16:00 จะวัดได้แม่นที่สุด</div>
                  )}
                </div>

                {/* ── เส้น I-V (รวมทุกสตริง · กดในตารางเพื่อเจาะดูทีละเส้น) ── */}
                {ivMain && ivMain.a && ivMain.a.exp && (
                  <div className="p3-card">
                    {/* กราฟเส้น I-V ย้ายไปการ์ด "เส้น P-V & I-V" ด้านล่างแล้ว — ตรงนี้เหลือเฉพาะ
                        ตัวเลขที่ต้องพกไปวัดหน้างาน ซึ่งกราฟชุดใหม่ไม่ได้บอก (แยกรายสตริงตามเงาที่โดนจริง) */}
                    <span className="p3-eb"><P3Icon name="curve" size={13} />
                      ค่าที่ควรวัดได้ของทุก{isMicro ? "ตัว" : "สตริง"} ณ เวลานี้<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{ivRows.length} {isMicro ? "ตัว" : "สตริง"} · {ivMain.a.cond.g} W/m² · เซลล์ {scR(ivMain.a.cond.tc, 0)}°C</span>
                    </span>

                    {/* ── เงาบังนิดเดียวแต่ฉุดทั้งสตริง ── */}
                    {ivCur && ivCur.el && ivCur.el.geo > 0 && (
                      <div className="su-alert warn"><P3Icon name="height" size={14} />
                        <span>
                          <b>สตริงนี้โดนเงาบังในเวลานี้</b> — เงาบังพื้นที่จริง <b>{scR(ivCur.el.geo * 100, 1)}%</b>
                          แต่แผงต่ออนุกรมกัน กระแสไหลได้เท่าตัวที่แย่ที่สุด ไดโอดบายพาสจึงตัดท่อนที่โดนบังทิ้ง
                          <b> {ivCur.el.subLost} จาก {ivCur.el.subTotal} ท่อน</b> →
                          กำลังหายจริง <b style={{ color: "var(--tint-red-tx)" }}>{scR(ivCur.el.elec * 100, 1)}%</b>
                          {ivCur.el.geo > 0 ? " (แรงกว่าคิดตามพื้นที่ " + scR(ivCur.el.elec / Math.max(0.0001, ivCur.el.geo), 1) + " เท่า)" : ""}
                          {" · เส้นเขียวหักผลนี้ไปแล้ว"}
                        </span>
                      </div>
                    )}

                    {/* กดแถวเพื่อดูว่าเส้นนั้นโดนเงาบังอยู่เท่าไหร่ */}
                    <div className="su-scroll">
                      <table className="su-tb su-pick-row">
                        <thead><tr><th></th><th>แผง</th>{isMicro && <th>ต่อช่อง</th>}<th>แสง</th><th>เซลล์</th><th>Voc</th><th>Isc</th><th>Vmp</th><th>Imp</th><th>{isMicro ? "Pmax/ช่อง" : "Pmax"}</th>{isMicro && <th>รวมทั้งตัว</th>}</tr></thead>
                        <tbody>
                          {ivRows.map((r, i) => r.a && r.a.exp && (
                            <tr key={r.u.id} data-on={ivSel === r.u.id ? "1" : "0"}
                              onClick={() => setIvSel(ivSel === r.u.id ? null : r.u.id)}
                              title={ivSel === r.u.id ? "กดอีกครั้งเพื่อยกเลิก" : "กดเพื่อดูว่าเส้นนี้โดนเงาบังอยู่เท่าไหร่"}>
                              <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 9, height: 9, borderRadius: 99, background: suColor(r.u.sid || i + 1) }} />
                                <b>{r.u.name}</b></span></td>
                              <td><b>{isMicro ? (r.u.count || r.u.n) : r.u.n}</b></td>
                              {isMicro && <td>{r.u.n} ใบ</td>}
                              <td>{r.a.cond.g}</td><td>{scR(r.a.cond.tc, 0)}°C</td>
                              <td>{scR(r.a.exp.voc, 1)}</td><td>{scR(r.a.exp.isc, 2)}</td>
                              <td>{scR(r.a.exp.vmp, 1)}</td><td>{scR(r.a.exp.imp, 2)}</td>
                              <td><b>{scR(r.a.exp.pmax, 0)}</b> W</td>
                              {/* ไมโคร 1 ตัวมีหลายช่อง MPPT — กำลังรวมของตัวนั้นคือทุกช่องบวกกัน */}
                              {isMicro && <td><b>{scR(r.a.exp.pmax * Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n))), 0)}</b> W</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <span className="p3-note">หน่วย: แสง W/m² · Voc/Vmp เป็นโวลต์ · Isc/Imp เป็นแอมป์ — พกตารางนี้ไปหน้างานได้เลย ถ้าวัดได้ต่างจากนี้เกิน 5% ค่อยไล่หาสาเหตุ{isMicro ? " · ไมโคร 1 ตัวรับแผง " + (microSel ? microSel.per : 1) + " ใบ แต่แยกเป็นช่อง MPPT อิสระช่องละ " + (microSel ? microSel.nSeries : 1) + " ใบ ค่าไฟฟ้าในตารางจึงเป็นของ 1 ช่อง (ที่เครื่องวัดอ่านได้ตอนถอดสายมาวัดทีละเส้น) ส่วน “รวมทั้งตัว” คือทุกช่องบวกกัน · เส้นของแต่ละตัวคิดจากเงาที่ตกบนแผงของตัวนั้นเองล้วน ๆ ตัวที่โดนบังจึงต่ำลงคนเดียว ไม่ลากตัวอื่นลงไปด้วย" : ""}</span>

                  </div>
                )}

                {/* ── เส้น P-V & I-V ที่ความเข้มแสง/อุณหภูมิต่าง ๆ (แบบดาต้าชีต) ── */}
                {!!ivFam.length && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="curve" size={13} />เส้น P-V &amp; I-V {famMode === "temp" ? "ที่อุณหภูมิเซลล์ต่าง ๆ" : "ที่ความเข้มแสงต่าง ๆ"}<span className="ln" />
                      <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                        <button data-on={famMode === "irr" ? "1" : "0"} onClick={() => setFamMode("irr")}>ไล่ความเข้มแสง</button>
                        <button data-on={famMode === "temp" ? "1" : "0"} onClick={() => setFamMode("temp")}>ไล่อุณหภูมิ</button>
                      </span></span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="p3-seg">
                        <button data-on={famScope === "mod" ? "1" : "0"} onClick={() => setFamScope("mod")}>ต่อ 1 แผง</button>
                        <button data-on={famScope === "str" ? "1" : "0"} onClick={() => setFamScope("str")}>
                          ทั้ง{isMicro ? "ช่อง" : "สตริง"} · {famStrN} แผง</button>
                      </span>
                      <span className="p3-stat" style={{ marginLeft: "auto" }}>
                        {famMode === "temp" ? "ตรึงแสงไว้ที่ 1000 W/m²" : "ตรึงอุณหภูมิเซลล์ไว้ที่ 25 °C (มาตรฐาน STC)"}</span>
                    </div>
                    <SuIvFamily curves={ivFam} mode={famMode} showPv />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
                      <span><b style={{ color: "var(--text-2)" }}>━</b> เส้น I-V — กระแส (แกนซ้าย)</span>
                      <span><b style={{ color: "var(--text-2)" }}>┅</b> เส้น P-V — กำลังไฟ (แกนขวา)</span>
                      <span><b style={{ color: "var(--text-3)" }}>◦</b> จุดกลม = จุดกำลังสูงสุด (MPP) ที่อินเวอร์เตอร์ต้องไล่ตาม</span>
                    </div>
                    <span className="p3-note">
                      {famMode === "temp" ? (
                        <React.Fragment>
                          <b>ความร้อนกินแรงดัน ไม่ได้กินกระแส</b> — สังเกตว่าเส้นเลื่อนเข้าหาแกนซ้าย (Voc ลดลง) แต่ความสูงเกือบไม่เปลี่ยน
                          นี่คือเหตุผลที่ต้องเช็ก Voc ตอนเช้าที่อากาศเย็นที่สุด (แรงดันจะสูงสุด อาจเกินพิกัดอินเวอร์เตอร์)
                          และเหตุผลที่ตอนบ่ายแดดแรงแต่ได้ไฟน้อยกว่าที่คิด · แผงรุ่นนี้ {scNum(panel.tcPmax, -0.29)} %/°C
                          {ivMain && ivMain.temp ? " · ตอนนี้ที่หน้างานเซลล์ร้อน " + ivMain.temp.tCell + " °C" : ""}
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <b>แสงกินกระแส ไม่ค่อยกินแรงดัน</b> — แสงลดครึ่งหนึ่ง กระแสลดครึ่งหนึ่งตาม แต่ Voc แทบไม่ขยับ (ตกแบบลอการิทึม)
                          นี่คือเหตุผลที่วันเมฆครึ้มระบบยังจ่ายไฟได้ อินเวอร์เตอร์ยังเข้าช่วง MPPT อยู่ ·
                          กราฟนี้คิดจากสเปคของ {panel.model || "แผงที่เลือก"} เทียบกับกราฟบนดาต้าชีตได้ตรง ๆ ที่โหมด "ต่อ 1 แผง"
                        </React.Fragment>
                      )}
                    </span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>{famMode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง"}</th><th>Voc</th><th>Isc</th><th>Vmp</th><th>Imp</th><th>Pmax</th><th>Fill Factor</th><th>เทียบ STC</th></tr></thead>
                        <tbody>
                          {ivFam.map((c, i) => (
                            <tr key={c.key}>
                              <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 9, height: 9, borderRadius: 99, background: (famMode === "temp" ? SU_TRAMP : SU_GRAMP)[Math.min(i, 4)] }} />
                                <b>{c.label}</b></span></td>
                              <td>{c.voc} V</td><td>{c.isc} A</td><td>{c.vmp} V</td><td>{c.imp} A</td>
                              <td><b>{c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : c.pmax + " W"}</b></td>
                              <td>{c.ff}%</td>
                              <td style={{ fontWeight: 800, color: i === 0 ? "var(--acd)" : "var(--text-3)" }}>
                                {ivFam[0].pmax > 0 ? scR(c.pmax / ivFam[0].pmax * 100, 1) + "%" : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(1)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(3)}>ถัดไป · ผลผลิต<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}

            {/* ══ ขั้น 4 · ผลผลิต ══ */}
            {step === 3 && energy && life && (
              <React.Fragment>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {[["ผลผลิตปีแรก", life.rows[0].kwh.toLocaleString(), "kWh"],
                    ["ต่อกำลังติดตั้ง", energy.perKwp.toLocaleString(), "kWh/kWp/ปี"],
                    ["Performance Ratio", energy.pr, "%"],
                    ["รวม " + S.years + " ปี", Math.round(life.total / 1000).toLocaleString(), "MWh"]].map(([k, v, u]) => (
                    <div key={k} className="p3-card" style={{ gap: 3, padding: "12px 13px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{k}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.5px", lineHeight: 1.15 }}>{v}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{u}</span>
                    </div>
                  ))}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="sun" size={13} />ผลผลิตรายเดือน (ปีแรก)<span className="ln" /><span style={{ fontWeight: 600 }}>kWh</span></span>
                  <SuMonthly data={energy.monthly} />
                  <span className="p3-note">คิดจากตำแหน่งดวงอาทิตย์จริงที่ละติจูด {scR(scNum(st.sun && st.sun.lat, 13.75), 2)}° ตกกระทบระนาบเอียงของแต่ละกลุ่มแผง แล้วหักอุณหภูมิเซลล์ตามสภาพอากาศรายเดือน</span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="layers" size={13} />แยกตามกลุ่มทิศทาง<span className="ln" /></span>
                  <div className="su-scroll">
                    <table className="su-tb">
                      <thead><tr><th>กลุ่ม</th><th>เอียง</th><th>ทิศ</th><th>แผง</th><th>kWp</th><th>เงาบัง</th><th>kWh/kWp</th><th>kWh/ปี</th></tr></thead>
                      <tbody>
                        {energy.perGroup.map((g) => (
                          <tr key={g.key}>
                            <td style={{ maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.roofName}{g.side ? " · " + g.side : ""}</td>
                            <td>{g.tilt}°</td><td>{g.az}°</td><td>{g.count}</td><td>{g.kwp}</td>
                            <td style={{ color: g.shade >= 5 ? "var(--tint-amber-tx)" : undefined }}>{g.shade || 0}%</td>
                            <td>{g.kwhPerKwp.toLocaleString()}</td><td><b>{g.kwh.toLocaleString()}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="p3-note">ตัวเลขนี้ยังไม่หักค่าสูญเสียอื่น — ดูค่าหลังหักที่การ์ดด้านบน</span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="reset" size={13} />ค่าเสื่อม {S.years} ปี<span className="ln" />
                    <span style={{ fontWeight: 600 }}>ปีสุดท้ายเหลือ {life.lastPct}%</span></span>
                  <SuLifeChart rows={life.rows} />
                  <div className="su-scroll">
                    <table className="su-tb">
                      <thead><tr><th>ปี</th>{life.rows.map((r) => <th key={r.year} style={{ textAlign: "right" }}>{r.year}</th>)}</tr></thead>
                      <tbody>
                        <tr><td style={{ fontWeight: 700 }}>kWh</td>{life.rows.map((r) => <td key={r.year} style={{ textAlign: "right" }}>{Math.round(r.kwh / 100) / 10}k</td>)}</tr>
                        <tr><td style={{ fontWeight: 700 }}>เหลือ %</td>{life.rows.map((r) => <td key={r.year} style={{ textAlign: "right" }}>{r.factor}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── เงาบังทั้งปี คำนวณจากโมเดล 3 มิติ ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="tree" size={13} />เงาบังตลอดทั้งปี<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{shade3d ? "คำนวณจากโมเดล 3 มิติแล้ว" : "ยังใช้ค่า % ที่กรอกมือ"}</span></span>
                  {!shade3d ? (
                    <React.Fragment>
                      <span className="p3-note" style={{ marginTop: -2 }}>
                        ตอนนี้ปิดการคิดเงาจากโมเดลไว้ ใช้ % ที่กรอกเองด้านล่างแทน
                      </span>
                      <button className="p3-b pri" style={{ alignSelf: "flex-start" }} onClick={() => set({ shadeOff: false })}>
                        <P3Icon name="sunShadow" size={14} />ให้ระบบคิดเงาจากโมเดล 3 มิติ
                      </button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span className="p3-stat">เงาเชิงพื้นที่ <b>{shade3d.geoOnly}%</b></span>
                        <span className="p3-stat" style={{ color: "var(--tint-red-tx)" }}>+ ผลฉุดทั้งสตริง <b>{shade3d.elecExtra}%</b></span>
                        <span className="p3-stat" style={{ color: shade3d.overall >= 5 ? "var(--tint-amber-tx)" : "var(--acd)", fontWeight: 800 }}>
                          = เสียจริง <b>{shade3d.overall}%</b> ต่อปี</span>
                        <span className="p3-stat">ตัวอาคาร/หลังคา <b>{shade3d.buildings}</b> ชิ้น</span>
                        <span className="p3-stat">สิ่งบดบังในผัง <b>{shade3d.obstacles}</b> ชิ้น</span>
                      </div>
                      {/* ตั้งค่าโมเดลไฟฟ้า */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                        <label className="p3-f">
                          <span className="lb" title="ไดโอดตัวเล็กในกล่องต่อสายหลังแผง ทำหน้าที่เป็นทางลัดให้กระแสเดินอ้อมส่วนที่โดนเงา ถ้าไม่มีมันเซลล์ที่โดนบังจะร้อนจัดจนไหม้">
                            ไดโอดบายพาสต่อแผง</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" min="1" max="6" step="1" value={elecCfg.diodes}
                              onChange={(e) => setElec({ diodes: scClamp(+e.target.value || 3, 1, 6) })} />
                            <span className="p3-sfx">ท่อน</span></span></label>
                        <label className="p3-f"><span className="lb" title="PVsyst แนะนำ 60–80% สำหรับเงาไม่สม่ำเสมอ · 100% สำหรับแถวบังแถว">สัดส่วนผลทางไฟฟ้า</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" min="0" max="100" step="5" value={elecCfg.kElec}
                              onChange={(e) => setElec({ kElec: scClamp(+e.target.value || 80, 0, 100) })} />
                            <span className="p3-sfx">%</span></span></label>
                        <label className="p3-f">
                          <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span>แผงครึ่งเซลล์</span>
                            <span className={"su-src " + ((S.elec && S.elec.halfCut != null) ? "edit" : "stock")}>
                              {(S.elec && S.elec.halfCut != null) ? "แก้เอง" : hc.why}</span>
                          </span>
                          <button className="p3-b sm" onClick={() => setElec({ halfCut: !elecCfg.halfCut })}
                            title="แผงครึ่งเซลล์ทนเงาได้ดีกว่าเฉพาะเมื่อวางตั้งและเงาเป็นแถบแนวนอนเต็มความกว้าง (เช่น แถวหน้าบังแถวหลัง) — เงาต้นไม้/ปล่องเป็นหย่อมไม่เข้าข่าย">
                            <P3Icon name={elecCfg.halfCut ? "check" : "plus"} size={13} />{elecCfg.halfCut ? "ใช่ · ทนเงาแถบแนวนอน" : "ไม่ใช่ / เงาเป็นหย่อม"}
                          </button>
                        </label>
                      </div>
                      <span className="p3-note">
                        <b>ไดโอดบายพาสคืออะไร</b> — ไดโอดตัวเล็ก ๆ ในกล่องต่อสายหลังแผง (ปกติ 3 ตัว แบ่งแผงเป็น 3 ท่อน)
                        ทำหน้าที่เป็นทางลัดให้กระแสเดินอ้อมส่วนที่โดนเงา ถ้าไม่มีมัน เซลล์ที่โดนบังจะกลายเป็นตัวต้านทานร้อนจัดจนแผงไหม้ (hot spot)
                        มันจึงยอมตัดท่อนนั้นทิ้งแทน — นี่คือเหตุผลที่เงานิดเดียวเสียกำลังเป็นก้อน ไม่ได้เสียตามสัดส่วนพื้นที่
                      </span>
                      <div className="su-scroll">
                        <table className="su-tb">
                          <thead><tr><th>กลุ่มทิศทาง</th><th>แผง</th><th>เงาบัง</th><th></th></tr></thead>
                          <tbody>
                            {groups.map((g) => {
                              const v = scNum(shade3d.byGroup[g.key], 0);
                              return (
                                <tr key={g.key}>
                                  <td style={{ maxWidth: 210, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.label}</td>
                                  <td>{g.count}</td>
                                  <td style={{ fontWeight: 800, color: v >= 8 ? "var(--tint-red-tx)" : v >= 3 ? "var(--tint-amber-tx)" : "var(--acd)" }}>{v}%</td>
                                  <td style={{ width: 110 }}>
                                    <span className="su-bar" style={{ display: "block", height: 6 }}>
                                      <span style={{ width: scClamp(v * 5, 0, 100) + "%", background: v >= 8 ? "var(--tint-red-tx2)" : v >= 3 ? "#D97706" : "#22A35B" }} />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {!!(shade3d.worst || []).length && (
                        <React.Fragment>
                          <span className="p3-eb" style={{ marginTop: 2 }}>แผงที่โดนบังหนักที่สุด<span className="ln" /></span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {shade3d.worst.map((w) => (
                              <span key={w.uid} className="p3-chip" style={{ cursor: "default", color: w.pct >= 15 ? "var(--tint-red-tx)" : "var(--tint-amber-tx)" }}>
                                {w.roofName} · {w.key} <b>{w.pct}%</b>
                              </span>
                            ))}
                          </div>
                          <span className="p3-note">แผงพวกนี้ถ้าย้ายที่ไม่ได้ ควรแยกไปสตริงของมันเอง หรือใช้ออปติไมเซอร์ — ไม่งั้นจะฉุดทั้งสตริงลงมา</span>
                        </React.Fragment>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="p3-b sm" onClick={() => set({ shadeOff: true })}>กลับไปกรอก % เอง</button>
                      </div>
                      <span className="p3-note">
                        คิดใหม่ให้เองทุกครั้งที่แก้ผัง 3 มิติ — ตัวเลขผลผลิตด้านบนหักเงาชุดนี้ไปแล้ว ·
                        นับเฉพาะลำแสงตรงที่โดนบัง (แสงฟุ้งจากท้องฟ้ายังเข้าถึงแผงได้อยู่) ·
                        นับตัวอาคาร/ผิวหลังคา สิ่งบดบังที่สำรวจไว้ และแผงที่บังกันเอง
                      </span>
                    </React.Fragment>
                  )}
                </div>

                {/* ── แผนภาพค่าสูญเสียตลอดเส้นทาง แสง → ไฟ AC ── */}
                {!!(energy.chain && energy.chain.length) && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="height" size={13} />แผนภาพค่าสูญเสียของระบบ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>แสงที่ได้ → ไฟที่ขายได้ เหลือ {energy.chain[energy.chain.length - 1].pct}%</span></span>
                    <span className="p3-note" style={{ marginTop: -2 }}>
                      ไล่จากแสงที่ตกบนหน้าแผงทั้งปีลงมาทีละด่านจนถึงไฟ AC ที่ออกจากระบบจริง —
                      ทุกบรรทัดมาจากการเดินเวลาชุดเดียวกับที่คำนวณผลผลิตด้านบน บรรทัดสุดท้ายจึงเท่ากับตัวเลขผลผลิตปีแรกเป๊ะ
                    </span>
                    <SuLossFlow chain={energy.chain} />
                    <span className="p3-note">
                      <b>Performance Ratio {energy.pr}%</b> คือบรรทัดสุดท้ายหารบรรทัดแรก — เป็นตัวเลขที่ใช้เทียบคุณภาพงานติดตั้งข้ามโครงการได้
                      โดยไม่ต้องสนใจว่าหน้างานไหนแดดแรงกว่ากัน (งานหลังคาบ้านในไทยที่ออกแบบดีมักได้ 78–84%)
                    </span>
                  </div>
                )}

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="height" size={13} />ค่าสูญเสียของระบบ<span className="ln" />
                    <span style={{ fontWeight: 600 }}>รวม {energy.dcLoss}% ฝั่ง DC{shade3d ? " + เงา " + energy.shadeLoss + "%" : ""}</span></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 18px" }}>
                    {[["soil", "ฝุ่น/คราบบนแผง"], ["mismatch", "แผงไม่เท่ากัน (mismatch)"], ["wire", "สูญเสียในสาย DC"]]
                      .concat(shade3d ? [] : [["shade", "เงาบัง"]]).concat([["avail", "ระบบหยุด/ซ่อมบำรุง"]]).map(([k, lb]) => (
                      <P3NumRange key={k} span label={lb} value={S.loss[k]} min={0} max={15} step={0.5} suffix="%"
                        onChange={(v) => set({ loss: Object.assign({}, S.loss, { [k]: v }) })} />
                    ))}
                  </div>
                  {energy.clipLoss > 0.2 && (
                    <div className={"su-alert " + (energy.clipLoss > 8 ? "bad" : "warn")}><P3Icon name="height" size={14} />
                      <span>DC/AC = {energy.dcAc} → อินเวอร์เตอร์รับไม่หมดช่วงแดดแรง ถูกตัดทิ้ง <b>{energy.clipKwh.toLocaleString()} kWh/ปี ({energy.clipLoss}%)</b>
                        {energy.clipLoss > 8 ? " — เพิ่มขนาด/จำนวนอินเวอร์เตอร์คุ้มกว่ามาก" : " — ปกติของการออกแบบให้ DC มากกว่า AC เล็กน้อย"}</span></div>
                  )}
                </div>

                {/* ── ผลกระทบต่อสิ่งแวดล้อม ── */}
                {env && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="tree" size={13} />ผลกระทบต่อสิ่งแวดล้อม<span className="ln" />
                      <span style={{ fontWeight: 600 }}>ตัวเลขเทียบเท่าทั้งหมดคิดต่อปี</span></span>
                    <SuEnviron env={env} years={S.years} />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, borderTop: "1px solid var(--ln)", paddingTop: 10 }}>
                      <label className="p3-f">
                        <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span>ค่าการปล่อยของไฟจากสายส่ง</span>
                          <span className={"su-src " + (S.envf && S.envf.ef != null ? "edit" : "def")}>
                            {S.envf && S.envf.ef != null ? "แก้เอง" : "อบก."}</span>
                          {S.envf && S.envf.ef != null && <button className="p3-lnk" style={{ fontSize: 9.5 }}
                            onClick={(e) => { e.preventDefault(); set({ envf: Object.assign({}, S.envf, { ef: null }) }); }}>คืนค่า</button>}
                        </span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" min="0" step="0.01"
                            value={S.envf && S.envf.ef != null ? S.envf.ef : SC_ENVF.ef}
                            onChange={(e) => set({ envf: Object.assign({}, S.envf, { ef: e.target.value === "" ? null : +e.target.value }) })} />
                          <span className="p3-sfx">kg/kWh</span></span></label>
                      <label className="p3-f">
                        <span className="lb" title="คาร์บอนที่ใช้ไปตั้งแต่ถลุงซิลิคอน ผลิตแผง ขนส่ง จนติดตั้งเสร็จ — หารด้วยที่ลดได้ต่อปี ก็ได้ 'ปีที่ระบบเริ่มเป็นบวกต่อโลกจริง ๆ'">คาร์บอนที่ใช้สร้างระบบ</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" min="0" step="10"
                            value={S.envf && S.envf.embod != null ? S.envf.embod : SC_ENVF.embod}
                            onChange={(e) => set({ envf: Object.assign({}, S.envf, { embod: e.target.value === "" ? null : +e.target.value }) })} />
                          <span className="p3-sfx">kg/kWp</span></span></label>
                    </div>
                    <span className="p3-note">
                      ระบบขนาด {energy.dcKw} kWp นี้ใช้คาร์บอนสร้างราว <b>{env.embodT} tCO₂e</b> (ถลุงซิลิคอน ผลิตแผง ขนส่ง ติดตั้ง)
                      แล้วลดคืนได้ปีละ {env.co2YearT} tCO₂e → <b>คืนทุนทางคาร์บอนใน {env.carbonPayback} ปี</b>
                      {env.ratio ? " และตลอด " + S.years + " ปีจะลดได้ราว " + env.ratio + " เท่าของที่ใช้ไปตอนสร้าง" : ""} ·
                      ตัวเลขทั้งหมดคิดจากไฟที่ระบบนี้ผลิตได้จริงตามผลคำนวณด้านบน ไม่ใช่ค่าเฉลี่ยของอุตสาหกรรม
                    </span>
                  </div>
                )}

                {/* ── ตัวเลขนี้มั่นใจได้แค่ไหน ── */}
                {px && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="probe" size={13} />ความมั่นใจของผลผลิต · P50 / P90<span className="ln" />
                      <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                        {[["avg", "เฉลี่ยตลอด " + px.years + " ปี"], ["one", "ปีใดปีหนึ่ง"]].map(([k, t]) => (
                          <button key={k} data-on={pxMode === k ? "1" : "0"} onClick={() => setPxMode(k)}>{t}</button>
                        ))}
                      </span>
                    </span>
                    <SuPxx px={px} mode={pxMode} />
                    <div className="su-tiles">
                      {[["P50 · ค่ากลาง", px.p50, "kWh/ปี", "โอกาสได้มากกว่านี้ครึ่งหนึ่ง"],
                        ["P90 · แบบระมัดระวัง", pxMode === "one" ? px.p90one : px.p90avg, "kWh/ปี", "มั่นใจ 90% ว่าไม่ต่ำกว่านี้"],
                        ["ต่ำกว่าค่ากลาง", scR(100 - (pxMode === "one" ? px.p90one : px.p90avg) / (px.p50 || 1) * 100, 1), "%", "ส่วนต่างที่ควรเผื่อไว้ตอนเสนอราคา"],
                        ["ความไม่แน่นอนรวม", pxMode === "one" ? px.sigma1 : px.sigmaN, "% (1σ)", "รวมทุกก้อนแบบรากที่สองของผลบวกกำลังสอง"]].map(([k, v, u, d]) => (
                        <div key={k}>
                          <span className="k">{k}</span>
                          <span className="v">{typeof v === "number" ? v.toLocaleString() : v}<small>{u}</small></span>
                          <span className="d">{d}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9 }}>
                      {px.parts.map((p) => (
                        <label key={p.k} className="p3-f"><span className="lb">{p.label}</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" step="0.5" min="0" max="20" value={uncCfg[p.k]}
                              onChange={(e) => setUnc({ [p.k]: scClamp(+e.target.value || 0, 0, 20) })} />
                            <span className="p3-sfx">± %</span></span></label>
                      ))}
                    </div>
                    <span className="p3-note">
                      ตัวเลขผลผลิตที่คำนวณมาเป็นค่ากลาง (P50) — ปีที่เมฆเยอะจะได้น้อยกว่านั้น ปีที่แดดดีจะได้มากกว่า
                      เวลาเสนอลูกค้าหรือยื่นธนาคาร ให้ยึด <b>P90 = {(pxMode === "one" ? px.p90one : px.p90avg).toLocaleString()} kWh/ปี</b> จะปลอดภัยกว่า
                      · มองยาวหลายปีความแปรปรวนของแสงเฉลี่ยกันเอง ตัวเลข P90 จึงขยับเข้าใกล้ค่ากลางมากขึ้น
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <button className="p3-b" onClick={() => setStep(2)}>ย้อนกลับ</button>
                  <label className="p3-f" style={{ width: 108 }}>
                    <span className="lb">จำนวนปี</span>
                    <input className="p3-inp" type="number" min="1" max="30" step="1" value={S.years} onChange={(e) => set({ years: scClamp(+e.target.value || 15, 1, 30) })} />
                  </label>
                  <span style={{ flex: 1 }} />
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(4)}>ถัดไป · โหลด &amp; แบต<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}
            {step === 3 && !energy && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังคำนวณไม่ได้ — ต้องมีแผงในผังและเลือกรุ่นแผงก่อน</div>
            )}

            {/* ══ ขั้น 4 · โหลดลูกค้า · แบตเตอรี่ · ห้ามไหลย้อน ══ */}
            {step === 4 && (
              <React.Fragment>
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="bulb" size={13} />ลูกค้าใช้ไฟแบบไหน<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{prof.annual > 0 ? prof.annual.toLocaleString() + " หน่วย/ปี" : "ยังไม่ได้กรอก"}</span></span>
                  <span className="p3-note" style={{ marginTop: -2 }}>
                    ผลผลิตไม่เปลี่ยนตามข้อมูลตรงนี้ แต่ <b>มูลค่าของไฟเปลี่ยน</b> — หน่วยที่ใช้เองทันทีมีค่าเท่าค่าไฟเต็ม
                    ส่วนที่เหลือได้แค่ราคาขายคืน กรอกจากบิลค่าไฟของลูกค้าได้เลย
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9 }}>
                    <label className="p3-f"><span className="lb">ลักษณะการใช้ไฟ</span>
                      <select className="p3-inp" value={loadCfg.preset} onChange={(e) => setLoad({ preset: e.target.value })}>
                        {Object.keys(SC_LOADS).map((k) => <option key={k} value={k}>{SC_LOADS[k].label}</option>)}
                      </select></label>
                    <label className="p3-f"><span className="lb">{loadCfg.mode === "year" ? "ใช้ไฟทั้งปี" : "ใช้ไฟเฉลี่ยเดือนละ"}</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="10" min="0"
                          value={loadCfg.mode === "year" ? loadCfg.kwhYear : loadCfg.kwhMonth}
                          onChange={(e) => setLoad(loadCfg.mode === "year" ? { kwhYear: +e.target.value || 0 } : { kwhMonth: +e.target.value || 0 })} />
                        <span className="p3-sfx">หน่วย</span></span></label>
                    <label className="p3-f"><span className="lb">กรอกเป็น</span>
                      <select className="p3-inp" value={loadCfg.mode} onChange={(e) => setLoad({ mode: e.target.value })}>
                        <option value="month">ต่อเดือน (เฉลี่ยจากบิล)</option>
                        <option value="year">ต่อปี</option>
                      </select></label>
                  </div>
                  <span className="p3-note" style={{ margin: 0 }}>{prof.hint}</span>

                  {loadCfg.preset === "custom" && (
                    <React.Fragment>
                      <span className="p3-eb" style={{ marginTop: 2 }}>น้ำหนักการใช้ไฟรายชั่วโมง<span className="ln" /></span>
                      <div className="su-h24">
                        {(loadCfg.shape && loadCfg.shape.length === 24 ? loadCfg.shape : SC_LOADS.custom.shape).map((v, h) => (
                          <label key={h}><i>{h}</i>
                            <input type="number" step="0.5" min="0" value={v} onChange={(e) => {
                              const arr = (loadCfg.shape && loadCfg.shape.length === 24 ? loadCfg.shape : SC_LOADS.custom.shape).slice();
                              arr[h] = Math.max(0, +e.target.value || 0); setLoad({ shape: arr });
                            }} /></label>
                        ))}
                      </div>
                      <span className="p3-note" style={{ margin: 0 }}>
                        ใส่เป็นตัวเลขเทียบกันก็พอ (เช่น กลางคืน 2 กลางวัน 8) ระบบจะเทียบสัดส่วนแล้วคูณด้วยยอดใช้ไฟจริงให้เอง
                      </span>
                    </React.Fragment>
                  )}

                  <span className="p3-eb" style={{ marginTop: 2 }}>เดือนไหนใช้ไฟมากกว่าปกติ<span className="ln" />
                    <button className="p3-b sm" onClick={() => setLoad({ monScale: SC_MONSCALE_AC.slice() })}>หน้าร้อนเปิดแอร์</button>
                    <button className="p3-b sm" onClick={() => setLoad({ monScale: null })}>เท่ากันทุกเดือน</button>
                  </span>
                  <div className="su-h24">
                    {SC_MON.map((mo, m) => (
                      <label key={m}><i>{mo}</i>
                        <input type="number" step="1" min="0"
                          value={loadCfg.monScale && loadCfg.monScale.length === 12 ? loadCfg.monScale[m] : 100}
                          onChange={(e) => {
                            const arr = (loadCfg.monScale && loadCfg.monScale.length === 12 ? loadCfg.monScale.slice() : new Array(12).fill(100));
                            arr[m] = Math.max(0, +e.target.value || 0); setLoad({ monScale: arr });
                          }} /></label>
                    ))}
                  </div>
                  <span className="p3-note" style={{ margin: 0 }}>
                    หน่วยเป็น % เทียบกับค่าเฉลี่ย — ปรับแล้วยอดใช้ไฟทั้งปียังเท่าเดิม แค่ย้ายน้ำหนักไปเดือนที่ใช้เยอะกว่า
                  </span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="link" size={13} />ข้อจำกัดฝั่งการไฟฟ้า<span className="ln" /></span>
                  <div className="su-pick">
                    {[["sell", "ขายคืนได้ไม่จำกัด", "ขนานไฟแล้วปล่อยส่วนเกินเข้าระบบได้เต็มที่"],
                      ["limit", "จำกัดกำลังที่ปล่อยได้", "การไฟฟ้าอนุญาตให้ไหลย้อนได้ไม่เกินค่าที่กำหนด"],
                      ["zero", "ห้ามไหลย้อน (zero export)", "ต้องติดมิเตอร์ตรวจจับ + สั่งอินเวอร์เตอร์หรี่กำลังลง"]].map(([k, h, d]) => (
                      <button key={k} data-on={gridCfg.mode === k ? "1" : "0"} onClick={() => setGrid({ mode: k })}>
                        <span className="h">{h}</span><span className="d">{d}</span>
                      </button>
                    ))}
                  </div>
                  {gridCfg.mode === "limit" && (
                    <label className="p3-f" style={{ maxWidth: 220 }}><span className="lb">ปล่อยออกได้ไม่เกิน</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5" min="0" value={gridCfg.expLimitKw}
                          onChange={(e) => setGrid({ expLimitKw: Math.max(0, +e.target.value || 0) })} />
                        <span className="p3-sfx">kW</span></span></label>
                  )}
                  {dis && dis.curt > 0 && (
                    <div className="su-alert warn"><P3Icon name="height" size={14} />
                      ต้องหรี่กำลังทิ้งปีละ <b>&nbsp;{dis.curt.toLocaleString()} หน่วย ({dis.curtPct}%)</b>&nbsp; —
                      {dis.on ? " ลองเพิ่มความจุแบตหรือกำลังชาร์จ จะเก็บส่วนนี้ไว้ใช้ตอนเย็นได้" : " แบตเตอรี่จะช่วยเก็บส่วนนี้ไว้ใช้ทีหลังแทนที่จะทิ้งไปเปล่า ๆ"}
                    </div>
                  )}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="box" size={13} />แบตเตอรี่<span className="ln" />
                    <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                      <button data-on={!battCfg.on ? "1" : "0"} onClick={() => setBatt({ on: false })}>ไม่มีแบต</button>
                      <button data-on={battCfg.on ? "1" : "0"} onClick={() => setBatt({ on: true })}>มีแบต</button>
                    </span></span>
                  {battCfg.on && (
                    <React.Fragment>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9 }}>
                        <label className="p3-f"><span className="lb">ชนิดเซลล์</span>
                          <select className="p3-inp" value={battCfg.chem} onChange={(e) => {
                            const c = SC_CHEM[e.target.value] || SC_CHEM.lfp;
                            setBatt({ chem: e.target.value, dod: c.dod, rte: c.rte, cycles: c.cycles, calYears: c.calYears, eol: c.eol, cost: c.cost });
                          }}>
                            {Object.keys(SC_CHEM).map((k) => <option key={k} value={k}>{SC_CHEM[k].label}</option>)}
                          </select></label>
                        {[["kwh", "ความจุตามป้าย", "kWh", 0.5], ["dod", "ใช้ได้จริง (DoD)", "%", 1],
                          ["pKw", "ชาร์จ/จ่ายสูงสุด", "kW", 0.5], ["rte", "ประสิทธิภาพไป-กลับ", "%", 0.5],
                          ["reserve", "กันไว้เผื่อไฟดับ", "%", 5], ["standby", "แบตกินเองต่อวัน", "%", 0.1],
                          ["cycles", "จำนวนรอบจนหมดอายุ", "รอบ", 100], ["calYears", "อายุปฏิทิน", "ปี", 1],
                          ["degY", "เสื่อมปีละ", "%", 0.5]].map(([k, lb, sfx, stp]) => (
                          <label key={k} className="p3-f"><span className="lb">{lb}</span>
                            <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              <input className="p3-inp" type="number" step={stp} min="0" value={battCfg[k]}
                                onChange={(e) => setBatt({ [k]: Math.max(0, +e.target.value || 0) })} />
                              <span className="p3-sfx">{sfx}</span></span></label>
                        ))}
                        <label className="p3-f"><span className="lb">คิดราคาแบบ</span>
                          <select className="p3-inp" value={battCfg.costMode} onChange={(e) => setBatt({ costMode: e.target.value })}>
                            <option value="perKwh">บาทต่อ kWh</option>
                            <option value="lump">ยอดรวมทั้งชุด</option>
                          </select></label>
                        <label className="p3-f"><span className="lb">{battCfg.costMode === "lump" ? "ราคารวมทั้งชุด" : "ราคาต่อ kWh"}</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" step="500" min="0"
                              value={battCfg.costMode === "lump" ? battCfg.lump : battCfg.cost}
                              onChange={(e) => setBatt(battCfg.costMode === "lump" ? { lump: +e.target.value || 0 } : { cost: +e.target.value || 0 })} />
                            <span className="p3-sfx">บาท</span></span></label>
                      </div>
                      <div className="su-tiles">
                        {[["ใช้งานได้จริง", battS.usable, "kWh", "ความจุป้าย × DoD"],
                          ["ส่วนที่ลดค่าไฟได้", battS.work, "kWh", "หักที่กันไว้เผื่อไฟดับแล้ว"],
                          ["ใช้ไปปีละ", dis && dis.on ? dis.cycles : 0, "รอบ", "จากการจำลองจ่ายไฟจริงทั้งปี"],
                          ["น่าจะอยู่ได้", dis && dis.battLife != null ? dis.battLife : "—", "ปี",
                            dis && dis.byCycle != null && dis.byCycle < scNum(battCfg.calYears)
                              ? "หมดรอบก่อนหมดอายุปฏิทิน" : "หมดอายุปฏิทินก่อนใช้ครบรอบ"],
                          ["เงินค่าแบต", battS.capex, "บาท", "รวมอยู่ในเงินลงทุนของขั้นถัดไปแล้ว"]].map(([k, v, u, d]) => (
                          <div key={k}><span className="k">{k}</span>
                            <span className="v">{typeof v === "number" ? v.toLocaleString() : v}<small>{u}</small></span>
                            <span className="d">{d}</span></div>
                        ))}
                      </div>
                      <span className="p3-note" style={{ margin: 0 }}>
                        ค่าที่ต้องดูจากดาต้าชีตของแบตให้ครบ: ความจุป้าย · DoD · กำลังชาร์จ/จ่าย (เอาค่าที่น้อยกว่าระหว่างตัวแบตกับอินเวอร์เตอร์ไฮบริด) ·
                        ประสิทธิภาพไป-กลับ · จำนวนรอบที่รับประกัน · อายุปฏิทิน · ความจุคงเหลือตอนหมดอายุ ·
                        ที่ยังต้องเช็คแต่ไม่ได้เอามาคิดเงินตรงนี้คือ แรงดันระบบ (48V หรือ HV) ว่าตรงกับไฮบริดที่เลือกไหม · ช่วงอุณหภูมิใช้งาน ·
                        มาตรฐาน IEC 62619 / มอก. · เงื่อนไขการรับประกัน
                      </span>
                    </React.Fragment>
                  )}
                  {!battCfg.on && (
                    <span className="p3-note" style={{ margin: 0 }}>
                      ยังไม่ใส่แบต — ไฟที่ผลิตเกินความต้องการตอนนั้นจะถูกขายคืนที่ราคาถูกกว่าค่าไฟ (หรือถูกตัดทิ้งถ้าห้ามไหลย้อน)
                      กด “มีแบต” เพื่อดูว่าคุ้มไหมที่จะเก็บไว้ใช้ตอนเย็น
                    </span>
                  )}
                </div>

                {dis ? (
                  <React.Fragment>
                    <div className="su-tiles">
                      {[["ผลิตแล้วได้ใช้เอง", dis.selfPct, "%", (dis.direct + dis.dis).toLocaleString() + " จาก " + dis.pv.toLocaleString() + " หน่วย/ปี", dis.selfPct >= 60],
                        ["ไฟที่ใช้มาจากโซลาร์", dis.suffPct, "%", "ที่เหลือยังต้องซื้อ " + dis.imp.toLocaleString() + " หน่วย/ปี", dis.suffPct >= 40],
                        ["ขายคืนการไฟฟ้า", dis.expPct, "%", dis.exp.toLocaleString() + " หน่วย/ปี", null],
                        ["ตัดทิ้งเพราะห้ามไหลย้อน", dis.curtPct, "%", dis.curt.toLocaleString() + " หน่วย/ปี", dis.curt > 0 ? false : true]].map(([k, v, u, d, good]) => (
                        <div key={k} data-good={good == null ? undefined : (good ? "1" : "0")}>
                          <span className="k">{k}</span><span className="v">{v}<small>{u}</small></span><span className="d">{d}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p3-card">
                      <span className="p3-eb"><P3Icon name="curve" size={13} />ไฟทั้งวันไหลไปไหน · {SC_MON[flowMon]}<span className="ln" />
                        <span className="su-mstep">
                          <button onClick={() => setFlowMon((flowMon + 11) % 12)} title="เดือนก่อนหน้า"><P3Icon name="arrow" size={12} /></button>
                          <b>{SC_MON[flowMon]}</b>
                          <button onClick={() => setFlowMon((flowMon + 1) % 12)} title="เดือนถัดไป"><P3Icon name="arrow" size={12} /></button>
                        </span></span>
                      <span className="p3-note" style={{ marginTop: -2 }}>ไฟที่ผลิตได้ในวันเฉลี่ยของเดือนนี้ ถูกเอาไปทำอะไรบ้าง</span>
                      <SuFlowDay rows={dis.dayRows[flowMon]} mode="pv" on={dis.on} />
                      <div className="su-flg">
                        {["direct", "chg", "exp", "curt"].map((k) => (
                          <span key={k}><i style={{ background: SU_FLOW[k].c }} />{SU_FLOW[k].label}</span>
                        ))}
                        {dis.on && <span><i className="dash" />ระดับไฟในแบต (0–100%)</span>}
                      </div>
                      <span className="p3-eb" style={{ marginTop: 6 }}>ไฟที่ลูกค้าใช้ มาจากไหน<span className="ln" /></span>
                      <SuFlowDay rows={dis.dayRows[flowMon]} mode="load" on={dis.on} />
                      <div className="su-flg">
                        {["direct", "dis", "imp"].map((k) => (
                          <span key={k}><i style={{ background: SU_FLOW[k].c }} />{SU_FLOW[k].label}</span>
                        ))}
                      </div>
                    </div>

                    <div className="p3-card">
                      <span className="p3-eb"><P3Icon name="doc" size={13} />รายเดือน<span className="ln" /></span>
                      <div className="su-scroll">
                        <table className="su-tb">
                          <thead><tr><th>เดือน</th><th>ผลิตได้</th><th>ใช้ไฟ</th><th>ใช้ตรง ๆ</th>
                            {dis.on && <th>จากแบต</th>}<th>ขายคืน</th>{dis.curt > 0 && <th>ตัดทิ้ง</th>}
                            <th>ซื้อจากการไฟฟ้า</th><th>ใช้เอง %</th></tr></thead>
                          <tbody>
                            {dis.months.map((mo) => (
                              <tr key={mo.m} data-on={mo.m === flowMon ? "1" : "0"} onClick={() => setFlowMon(mo.m)} style={{ cursor: "pointer" }}>
                                <td><b>{mo.label}</b></td>
                                <td>{Math.round(mo.pv).toLocaleString()}</td>
                                <td>{Math.round(mo.load).toLocaleString()}</td>
                                <td>{Math.round(mo.direct).toLocaleString()}</td>
                                {dis.on && <td>{Math.round(mo.dis).toLocaleString()}</td>}
                                <td>{Math.round(mo.exp).toLocaleString()}</td>
                                {dis.curt > 0 && <td style={{ color: mo.curt > 0 ? "var(--dngr)" : undefined }}>{Math.round(mo.curt).toLocaleString()}</td>}
                                <td>{Math.round(mo.imp).toLocaleString()}</td>
                                <td><b>{mo.selfPct}</b></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <span className="p3-note">
                        หน่วยเป็น kWh · กดที่แถวเพื่อดูกราฟรายชั่วโมงของเดือนนั้น
                        {dis.on ? " · ไฟหายไปในการเก็บ-จ่ายของแบตปีละ " + dis.battLoss.toLocaleString() + " หน่วย (ประสิทธิภาพไป-กลับ " + battCfg.rte + "%)" : ""}
                      </span>
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="su-alert warn"><P3Icon name="height" size={14} />
                    ยังคำนวณการใช้เองไม่ได้ — กรอกยอดใช้ไฟของลูกค้าด้านบนก่อน (ถ้าไม่กรอก ขั้นคืนทุนจะกลับไปใช้สไลเดอร์ “ใช้เองกี่ %” แบบเดิม)
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(3)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(5)}>ถัดไป · คืนทุน<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}

            {/* ══ ขั้น 5 · คืนทุน & ROI ══ */}
            {step === 5 && roi && (
              <React.Fragment>
                {px && (
                  <div className="p3-card" style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "11px 13px" }}>
                    <span className="p3-eb" style={{ margin: 0 }}><P3Icon name="probe" size={13} />คิดที่ระดับความมั่นใจ</span>
                    <span className="p3-seg wide">
                      <button data-on={roiP === "p50" ? "1" : "0"} onClick={() => setRoiP("p50")}>P50 · ค่ากลาง</button>
                      <button data-on={roiP === "p90" ? "1" : "0"} onClick={() => setRoiP("p90")}>P90 · ระมัดระวัง</button>
                    </span>
                    <span className="p3-note" style={{ margin: 0, flex: 1, minWidth: 200, border: "none", padding: 0 }}>
                      ใช้ผลผลิต <b>{Math.round(energy.annual * roi.kYield).toLocaleString()} kWh/ปี</b>
                      {roiP === "p90" ? " (ต่ำกว่าค่ากลาง " + scR((1 - roi.kYield) * 100, 1) + "% เผื่อปีที่แดดไม่ดี)" : " (ค่ากลาง — โอกาสได้มากกว่านี้ครึ่งหนึ่ง)"}
                    </span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {[["คืนทุนภายใน", roi.payback ? roi.payback : "ไม่คืนใน " + roi.years, roi.payback ? "ปี" : "ปี", roi.payback && roi.payback <= 8],
                    ["ผลตอบแทน IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี", roi.irr != null && roi.irr >= 8],
                    ["มูลค่าปัจจุบันสุทธิ", Math.round(roi.npv / 1000).toLocaleString(), "พันบาท", roi.npv > 0],
                    ["ต้นทุนไฟที่ผลิตเอง", roi.lcoe, "บาท/หน่วย", roi.lcoe < scNum(roiCfg.tariff)]].map(([k, v, u, good]) => (
                    <div key={k} className="p3-card" style={{ gap: 3, padding: "12px 13px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{k}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1.15, color: good ? "var(--acd)" : "var(--text-1)" }}>{v}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{u}</span>
                    </div>
                  ))}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="coin" size={13} />เงินลงทุนและค่าไฟ<span className="ln" /></span>
                  <div className="su-pick" style={{ gap: 8 }}>
                    {[["perWp", "คิดเป็นบาทต่อวัตต์", "เหมาะกับตอนเสนอราคา — ระบบคูณกำลังติดตั้งให้เอง"],
                      ["lump", "กรอกยอดรวมทั้งโครงการ", "ใช้ยอดตามสัญญาจริง รวมทุกอย่างแล้ว"]].map(([k, h, d]) => (
                      <button key={k} data-on={roiCfg.costMode === k ? "1" : "0"} onClick={() => setRoi({ costMode: k })}>
                        <span className="h">{h}</span><span className="d">{d}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))", gap: 9 }}>
                    {roiCfg.costMode === "perWp" ? (
                      <label className="p3-f"><span className="lb">ราคาต่อวัตต์</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" step="0.5" value={roiCfg.perWp} onChange={(e) => setRoi({ perWp: +e.target.value || 0 })} />
                          <span className="p3-sfx">บาท/W</span></span></label>
                    ) : (
                      <label className="p3-f"><span className="lb">ยอดรวมทั้งโครงการ</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" step="1000" value={roiCfg.lump} onChange={(e) => setRoi({ lump: +e.target.value || 0 })} />
                          <span className="p3-sfx">บาท</span></span></label>
                    )}
                    <label className="p3-f"><span className="lb">ค่าไฟที่ประหยัดได้</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.05" value={roiCfg.tariff} onChange={(e) => setRoi({ tariff: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท/หน่วย</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าไฟขึ้นปีละ</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5" value={roiCfg.escal} onChange={(e) => setRoi({ escal: +e.target.value || 0 })} />
                        <span className="p3-sfx">%</span></span></label>
                    <label className="p3-f"><span className="lb">ขายคืนหน่วยละ</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.05" value={roiCfg.exportRate} onChange={(e) => setRoi({ exportRate: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าดูแลรักษาต่อปี</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.1" value={roiCfg.om} onChange={(e) => setRoi({ om: +e.target.value || 0 })} />
                        <span className="p3-sfx">% ของค่าติดตั้ง</span></span></label>
                    <label className="p3-f"><span className="lb">อัตราคิดลด</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5" value={roiCfg.discount} onChange={(e) => setRoi({ discount: +e.target.value || 0 })} />
                        <span className="p3-sfx">%</span></span></label>
                    <label className="p3-f"><span className="lb">มองไปข้างหน้า</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="5" max="30" step="1" value={roiCfg.years} onChange={(e) => setRoi({ years: scClamp(+e.target.value || 25, 5, 30) })} />
                        <span className="p3-sfx">ปี</span></span></label>
                    <label className="p3-f"><span className="lb">เปลี่ยนอินเวอร์เตอร์ปีที่</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" max="30" step="1" value={roiCfg.invRepYear} onChange={(e) => setRoi({ invRepYear: +e.target.value || 0 })} />
                        <span className="p3-sfx">ปี</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าเปลี่ยนอินเวอร์เตอร์</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="1000" value={roiCfg.invRepCost} onChange={(e) => setRoi({ invRepCost: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท</span></span></label>
                  </div>
                  {dis ? (
                    <React.Fragment>
                      <div className="su-tiles">
                        {[["ใช้เอง", scR(dis.fSelf * 100, 1), "%", "คิดที่ค่าไฟเต็ม " + roiCfg.tariff + " บาท/หน่วย"],
                          ["ขายคืน", scR(dis.fExp * 100, 1), "%", "คิดที่ " + roiCfg.exportRate + " บาท/หน่วย"],
                          ["ตัดทิ้ง", scR(dis.fCurt * 100, 1), "%", "ไม่ได้เงินเลย"],
                          ["เงินค่าแบต", roi.battCapex, "บาท", roi.battCapex > 0 ? "เปลี่ยนใหม่ทุก " + battRepYear + " ปี" : "ไม่มีแบตในระบบนี้"]].map(([k, v, u, d]) => (
                          <div key={k}><span className="k">{k}</span>
                            <span className="v">{typeof v === "number" ? v.toLocaleString() : v}<small>{u}</small></span>
                            <span className="d">{d}</span></div>
                        ))}
                      </div>
                      <span className="p3-note">
                        สัดส่วนนี้ไม่ได้เดา — มาจากการจำลองชั่วโมงต่อชั่วโมงทั้งปีในขั้น “โหลด &amp; แบตเตอรี่”
                        เทียบไฟที่ผลิตได้กับไฟที่ลูกค้าใช้จริง จะแก้ได้ต้องกลับไปแก้ที่ขั้นนั้น
                      </span>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <P3NumRange label="ไฟที่ผลิตได้ ใช้เองกี่ %" value={roiCfg.selfUse} min={0} max={100} step={5} suffix="%"
                        onChange={(v) => setRoi({ selfUse: v })} />
                      <span className="p3-note">
                        ส่วนที่ใช้เองคิดที่ค่าไฟเต็ม <b>{roiCfg.tariff} บาท/หน่วย</b> · ส่วนที่เหลือ {100 - scNum(roiCfg.selfUse)}% คิดที่ราคาขายคืน <b>{roiCfg.exportRate} บาท</b> —
                        อยากได้ตัวเลขที่แม่นกว่านี้ ให้กลับไปกรอกยอดใช้ไฟของลูกค้าในขั้น “โหลด &amp; แบตเตอรี่” ระบบจะจำลองให้ทีละชั่วโมงทั้งปี
                      </span>
                    </React.Fragment>
                  )}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="curve" size={13} />กระแสเงินสดสะสม<span className="ln" />
                    <span style={{ fontWeight: 600 }}>ลงทุน {roi.capex.toLocaleString()} บาท
                      {roi.battCapex > 0
                        ? " · โซลาร์ " + roi.pvCapex.toLocaleString() + " (" + roi.perWp + " บาท/W) + แบต " + roi.battCapex.toLocaleString()
                        : " (" + roi.perWp + " บาท/W)"}</span></span>
                  <SuCash roi={roi} />
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                    <span className="p3-stat">ประหยัดปีแรก <b>{roi.rows[0].net.toLocaleString()}</b> บาท</span>
                    <span className="p3-stat">รวม {roi.years} ปี <b>{Math.round(roi.totalSave / 1000).toLocaleString()}</b> พันบาท</span>
                    <span className="p3-stat">กำไรสุทธิ <b>{Math.round(roi.netTotal / 1000).toLocaleString()}</b> พันบาท</span>
                    <span className="p3-stat">ผลิตรวม <b>{Math.round(roi.totalKwh / 1000).toLocaleString()}</b> MWh</span>
                  </div>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="doc" size={13} />ตารางกระแสเงินสด<span className="ln" /></span>
                  <div className="su-scroll" style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="su-tb">
                      <thead><tr><th>ปี</th><th>ผลผลิต</th><th>เหลือ %</th><th>ประหยัดค่าไฟ</th><th>ขายคืน</th><th>ค่าดูแล</th><th>สุทธิ</th><th>สะสม</th></tr></thead>
                      <tbody>
                        {roi.rows.map((r) => (
                          <tr key={r.year} data-on={roi.payback && Math.ceil(roi.payback) === r.year ? "1" : "0"}>
                            <td><b>{r.year}</b></td>
                            <td>{r.kwh.toLocaleString()}</td><td>{r.keep}</td>
                            <td>{r.save.toLocaleString()}</td><td>{r.sell.toLocaleString()}</td>
                            <td>{(r.om + r.rep).toLocaleString()}</td>
                            <td><b>{r.net.toLocaleString()}</b></td>
                            <td style={{ color: r.cum >= 0 ? "var(--acd)" : "var(--text-3)", fontWeight: 800 }}>{r.cum.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="p3-note">หน่วยเป็นบาท · ผลผลิตลดลงทุกปีตามค่าเสื่อมของแผง ส่วนค่าไฟเพิ่มขึ้นปีละ {roiCfg.escal}% ตามที่ตั้งไว้</span>
                </div>

                {/* ── ภาพผัง 3 มิติที่จะแนบไปในรายงาน ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="cube" size={13} />ภาพผัง 3 มิติในรายงาน<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{snapImg ? "พร้อมแนบ" : "ยังไม่มีภาพ"}</span></span>
                  {snapImg ? (
                    <img src={snapImg} alt="ผัง 3 มิติ" style={{ width: "100%", maxHeight: 260, objectFit: "contain",
                      borderRadius: 11, border: "1px solid var(--ln)", background: "var(--surface2)", display: "block" }} />
                  ) : (
                    <span className="p3-note" style={{ margin: 0 }}>ยังถ่ายภาพฉาก 3 มิติไม่ได้ — รายงานจะออกได้ปกติ แค่ไม่มีรูปประกอบ</span>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="p3-b sm" disabled={typeof snap !== "function"}
                      onClick={() => { const u = snap && snap(); if (u) setSnapImg(u); }}>
                      <P3Icon name="camera" size={13} />ถ่ายใหม่
                    </button>
                    <span className="p3-note" style={{ margin: 0, border: "none", padding: 0 }}>
                      อยากได้มุมอื่น — กด “เสร็จ” กลับไปหมุนกล้องในโหมด 3 มิติให้ได้มุมที่ชอบ แล้วเปิดหน้านี้ใหม่ ระบบจะถ่ายมุมนั้นให้
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(4)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setRepOpen(true)}>
                    <P3Icon name="doc" size={14} />ออกรายงาน PDF
                  </button>
                </div>
              </React.Fragment>
            )}
            {step === 5 && !roi && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังคำนวณคืนทุนไม่ได้ — ต้องมีผลผลิตก่อน (กลับไปขั้นผลผลิต)</div>
            )}
          </div>
        </div>
      </div>

      {/* สรุปติดขอบล่าง เห็นตลอดทุกขั้นตอน */}
      <div className="su-foot">
        <span className="su-kpi"><span className="k">กำลังติดตั้ง DC</span><span className="v">{energy ? energy.dcKw : 0}<small>kWp</small></span></span>
        <span className="su-kpi"><span className="k">อินเวอร์เตอร์ AC</span><span className="v">{acKw || 0}<small>kW</small></span></span>
        <span className="su-kpi"><span className="k">DC/AC</span>
          <span className="v" style={{ color: energy && (energy.dcAc > 1.4 || (energy.dcAc && energy.dcAc < 0.85)) ? "var(--tint-amber-tx)" : undefined }}>{energy ? energy.dcAc : "—"}</span></span>
        <span className="su-kpi"><span className="k">{isMicro ? "ไมโคร" : "สตริง"}</span>
          <span className="v">{isMicro ? (microSel ? microSel.units : 0) : (plan ? plan.strings.length : 0)}<small>{isMicro ? "ตัว" : "สตริง"}</small></span></span>
        <span className="su-kpi"><span className="k">ผลผลิตปีแรก</span><span className="v">{life ? life.rows[0].kwh.toLocaleString() : "—"}<small>kWh</small></span></span>
        <span className="su-kpi"><span className="k">รวม {S.years} ปี</span><span className="v">{life ? Math.round(life.total / 1000).toLocaleString() : "—"}<small>MWh</small></span></span>
        <span style={{ flex: 1 }} />
        {!!warns.length && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: "var(--tint-amber-tx)", marginRight: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,.22)" }} />
            {warns.length} ข้อควรแก้
          </span>
        )}
        <button className="p3-b" style={{ padding: "10px 16px", marginRight: 8 }} onClick={() => setRepOpen(true)} disabled={!energy}
          title="เลือกหัวข้อที่จะออก แล้วสั่งพิมพ์/บันทึกเป็น PDF">
          <P3Icon name="doc" size={15} />รายงาน PDF
        </button>
        <button className="p3-b pri" style={{ padding: "10px 22px" }} onClick={onClose}>
          <P3Icon name="check" size={15} />เสร็จ
        </button>
      </div>

      {/* ── เลือกเนื้อหาก่อนออกรายงาน ── */}
      {repOpen && (
        <div className="su-sheet-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) setRepOpen(false); }}>
          <div className="su-sheet">
            <div className="su-sheet-hd">
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--acs)", display: "grid", placeItems: "center", color: "var(--acd)", flexShrink: 0 }}>
                <P3Icon name="doc" size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>เลือกเนื้อหาที่จะออกรายงาน</h4>
                <p>ติ๊กเฉพาะหัวข้อที่อยากให้อยู่ในไฟล์ — เลขหัวข้อจะไล่ใหม่ให้เอง ไม่มีเลขขาด</p>
              </div>
              <button className="ghost" onClick={() => setRepOpen(false)} title="ปิด"><Icon name="x" size={15} /></button>
            </div>
            <div className="su-sheet-bd">
              {(typeof RP_SECTIONS !== "undefined" ? RP_SECTIONS : []).map((s) => (
                <div className="grp" key={s.key}>
                  <button className="su-ck" data-on={repPick[s.key] ? "1" : "0"} onClick={() => repToggle(s.key)}>
                    <span className="bx">{repPick[s.key] && <P3Icon name="check" size={12} />}</span>
                    <span className="tx"><b>{s.label}</b>{s.note && <i>{s.note}</i>}</span>
                  </button>
                  {(s.subs || []).map((b) => (
                    <button key={b.key} className="su-ck sub" data-on={repPick[b.key] ? "1" : "0"}
                      data-off={repPick[s.key] ? "0" : "1"} onClick={() => repToggle(b.key)}>
                      <span className="bx">{repPick[b.key] && <P3Icon name="check" size={12} />}</span>
                      <span className="tx"><b>{b.label}</b>{b.note && <i>{b.note}</i>}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="su-sheet-ft">
              <button className="p3-b sm" onClick={() => repPreset(null)} title="เอาทุกหัวข้อ">ทั้งเล่ม</button>
              <button className="p3-b sm" onClick={() => repPreset(["cover", "summary", "prod", "shade", "pxx",
                "env", "load", "loadDay", "loadMon", "battSpec", "roi"])}
                title="หน้าปก · สรุป · ผลผลิต · การใช้ไฟ · คืนทุน — ตัดรายละเอียดทางเทคนิคออก">ฉบับลูกค้า</button>
              <button className="p3-b sm" onClick={() => repPreset(["equip", "wiring", "layout", "iv", "ivDay", "ivYear", "ivAll", "ivMeas"])}
                title="อุปกรณ์ · การต่อ · ผัง · เส้น I-V — เอาไว้ให้ช่างถือหน้างาน">ฉบับหน้างาน</button>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: repCount ? "var(--text-3)" : "var(--tint-amber-tx)", marginRight: 4 }}>
                {repCount ? repCount + " หัวข้อ" : "ยังไม่เลือกหัวข้อ"}
              </span>
              <button className="p3-b pri" style={{ padding: "9px 18px" }} onClick={doReport}
                disabled={!repCount && !repPick.cover && !repPick.summary}>
                <P3Icon name="doc" size={14} />ออกรายงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ตัวอย่างรายงานบนจอ — กด "บันทึก PDF" ในแถบด้านบนเพื่อพิมพ์/เก็บเป็นไฟล์ */}
      {repHtml && typeof SuReportView === "function" && (
        <SuReportView html={repHtml} onClose={() => setRepHtml(null)}
          title={"รายงานออกแบบระบบ" + (job && job.code ? " " + job.code : "")} />
      )}
    </div>
  );
}

/* ============================================================
   SolarDesignHost — เข้า "ออกแบบระบบ + ผลผลิต" ตรง ๆ โดยไม่ต้องเปิดจอ 3 มิติก่อน
   ------------------------------------------------------------
   ผังแผง/ทิศ/เงา ยังอ่านจากโมเดล 3 มิติที่บันทึกไว้ของงานนี้เหมือนเดิม (plan3d/{jobId})
   ต่างกันแค่ไม่ต้องรอโหลด Three.js กับฉาก 3 มิติ — เปิดบนมือถือแล้วเข้าถึงเร็วกว่ามาก
   แลกกับที่ไม่มีภาพฉาก 3 มิติไปแปะหัวรายงาน (ต้องเข้าทางจอ 3 มิติถึงจะถ่ายภาพได้)
   ============================================================ */
function SolarDesignHost({ job, onClose }) {
  const { saved, loading, save } = usePlan3d(job ? job.id : null);
  const [sysLocal, setSysLocal] = React.useState(null);   // null = ยังไม่ได้แก้อะไร ใช้ค่าที่บันทึกไว้
  /* ต่อของเก่าให้ครบรูปแบบปัจจุบันแบบเดียวกับที่ Plan3DEditor ทำตอนโหลด
     ไม่งั้นผังที่บันทึกไว้ก่อนเพิ่มฟิลด์ใหม่จะอ่านแล้วพัง */
  const st = React.useMemo(() => {
    const base = p3Blank(job);
    if (!saved) return base;
    const m = Object.assign({}, base, saved, { sun: Object.assign({}, base.sun, saved.sun || {}) });
    m.roofs = (saved.roofs || []).map((r) => Object.assign({}, p3NewRoof(1), r, { skips: r.skips || {}, pts: r.pts || null }));
    m.obstacles = saved.obstacles || [];
    return m;
  }, [saved, job && job.id]);

  /* เขียนลงฐานข้อมูลแบบหน่วงเวลา — ในเวิร์กสเปซผู้ใช้ลากสไลเดอร์/พิมพ์เลขรัว ๆ
     ถ้าเซฟทุกครั้งที่ค่าเปลี่ยนจะยิงเน็ตเป็นร้อยครั้ง (เน็ตหน้างานช้าอยู่แล้ว) */
  const stRef = React.useRef(st); stRef.current = st;
  const pend = React.useRef(null), timer = React.useRef(null);
  const flush = React.useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const s = pend.current;
    if (!s) return;
    pend.current = null;
    const wp = scNum((scPanelSpec(s) || {}).wp, 0);
    /* เลือกรุ่นแผงแล้วให้ kWp ที่จอ 3 มิติใช้ตามไปด้วย จะได้ไม่ขัดกันสองที่ (ตรงกับที่ Plan3DEditor ทำ) */
    save(Object.assign({}, stRef.current, wp ? { sys: s, wp: wp } : { sys: s }));
  }, [save]);
  React.useEffect(() => flush, [flush]);   // ปิดหน้าต่างระหว่างที่ยังหน่วงอยู่ → เซฟให้ก่อน

  if (!job) return null;
  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 130, background: "var(--bg)", display: "grid", placeItems: "center",
        fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>กำลังเปิดผังของงานนี้…</div>
    );
  }
  return (
    <React.Fragment>
      {/* เวิร์กสเปซใช้คลาส .p3-* ซึ่งปกติ Plan3DEditor เป็นคนใส่ CSS ให้ — เข้าตรงจึงต้องใส่เอง */}
      <style>{typeof P3_CSS === "string" ? P3_CSS : ""}</style>
    <SolarWorkspace job={job} st={st} sys={sysLocal || st.sys || scBlankSys()} onClose={() => { flush(); onClose(); }}
      onChange={(s) => {
        setSysLocal(s);
        pend.current = s;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, 900);
      }} />
    </React.Fragment>
  );
}

Object.assign(window, { SolarWorkspace, SolarDesignHost, SuVoltBand, SuFacing, SU_CSS });
