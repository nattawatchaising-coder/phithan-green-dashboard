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
function SuSpec({
  label,
  value,
  src,
  suffix,
  step,
  onChange,
  onReset
}) {
  return React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, label), React.createElement("span", {
    className: "su-src " + src,
    style: {
      marginLeft: "auto"
    }
  }, src === "stock" ? "คลัง" : src === "edit" ? "แก้เอง" : "ค่ากลาง"), src === "edit" && React.createElement("button", {
    className: "p3-lnk",
    style: {
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      onReset();
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32")), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: step || 0.01,
    placeholder: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38",
    value: value == null || value === 0 ? "" : value,
    onChange: e => onChange(e.target.value === "" ? null : +e.target.value)
  }), suffix && React.createElement("span", {
    className: "p3-sfx"
  }, suffix)));
}
function SuFacing({
  tilt,
  az,
  size
}) {
  const s = size || 46,
    r = s / 2 - 3;
  const a = (az - 90) * Math.PI / 180;
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 " + s + " " + s,
    style: {
      display: "block",
      flex: "0 0 auto"
    }
  }, React.createElement("circle", {
    cx: s / 2,
    cy: s / 2,
    r: r,
    fill: "none",
    stroke: "var(--ln2)",
    strokeWidth: "1"
  }), React.createElement("text", {
    x: s / 2,
    y: "8",
    textAnchor: "middle",
    fontSize: "7",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "N"), React.createElement("line", {
    x1: s / 2,
    y1: s / 2,
    x2: s / 2 + Math.cos(a) * r * 0.82,
    y2: s / 2 + Math.sin(a) * r * 0.82,
    stroke: "var(--ac)",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: s / 2,
    cy: s / 2,
    r: "2.4",
    fill: "var(--ac)"
  }), React.createElement("text", {
    x: s / 2,
    y: s - 1,
    textAnchor: "middle",
    fontSize: "8",
    fontWeight: "800",
    fill: "var(--text-2)"
  }, Math.round(tilt), "\xB0"));
}
function SuMicroGlyph({
  per,
  mppt,
  on
}) {
  const n = Math.max(1, per || 1);
  const W = 20 + n * 22,
    H = 40;
  const c = on ? "var(--ac)" : "var(--text-3)";
  const indep = (mppt || 1) >= n;
  return React.createElement("svg", {
    width: W,
    height: H,
    viewBox: "0 0 " + W + " " + H,
    style: {
      display: "block",
      flex: "0 0 auto"
    }
  }, Array.from({
    length: n
  }).map((_, i) => {
    const x = 10 + i * 22;
    return React.createElement("g", {
      key: i
    }, React.createElement("rect", {
      x: x,
      y: "3",
      width: "17",
      height: "11",
      rx: "2",
      fill: on ? "var(--acs)" : "transparent",
      stroke: c,
      strokeWidth: "1.4"
    }), React.createElement("path", {
      d: "M" + (x + 8.5) + " 14 v" + (indep ? 8 : 5),
      stroke: c,
      strokeWidth: "1.4",
      strokeLinecap: "round",
      strokeDasharray: indep ? null : "2 2"
    }));
  }), !indep && React.createElement("path", {
    d: "M18.5 19 H" + (10 + (n - 1) * 22 + 8.5) + " V22",
    stroke: c,
    strokeWidth: "1.4",
    fill: "none"
  }), React.createElement("rect", {
    x: "6",
    y: "22",
    width: W - 12,
    height: "12",
    rx: "3",
    fill: on ? "var(--ac)" : "transparent",
    stroke: c,
    strokeWidth: "1.4"
  }), React.createElement("path", {
    d: "M" + W / 2 + " 34 v4",
    stroke: c,
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }));
}
function SuVoltBand({
  rows,
  inv,
  sel,
  onPick
}) {
  const vmin = scNum(inv.mpptVmin),
    vmax = scNum(inv.mpptVmax),
    vdc = scNum(inv.maxVdc);
  const top = Math.max(vdc, vmax) * 1.06 || 1;
  const px = v => Math.max(0, Math.min(100, v / top * 100));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      height: 15,
      fontSize: 9,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      left: px(vmin) + "%",
      transform: "translateX(-50%)"
    }
  }, vmin, "V"), React.createElement("span", {
    style: {
      position: "absolute",
      left: px(vmax) + "%",
      transform: "translateX(-50%)"
    }
  }, vmax, "V"), vdc ? React.createElement("span", {
    style: {
      position: "absolute",
      left: px(vdc) + "%",
      transform: "translateX(-50%)",
      color: "var(--tint-red-tx)"
    }
  }, vdc, "V") : null), rows.map(r => {
    const lo = px(r.vmpHot),
      hi = px(r.vmpCold);
    const on = sel === r.n;
    return React.createElement("button", {
      key: r.n,
      onClick: () => onPick && onPick(r.n),
      title: r.ok ? "แรงดันทำงาน " + r.vmpHot + "–" + r.vmpCold + " V · Voc เย็น " + r.vocCold + " V" : r.fails.join(" · "),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        border: "1px solid " + (on ? "var(--ac)" : "transparent"),
        background: on ? "var(--acs)" : "transparent",
        borderRadius: 10,
        padding: "5px 7px",
        width: "100%",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 30,
        fontSize: 11.5,
        fontWeight: 800,
        color: r.ok ? "var(--text-1)" : "var(--text-3)",
        flex: "0 0 auto"
      }
    }, r.n), React.createElement("span", {
      style: {
        position: "relative",
        flex: 1,
        height: 18,
        borderRadius: 6,
        background: "var(--surface2)",
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        position: "absolute",
        left: px(vmin) + "%",
        width: px(vmax) - px(vmin) + "%",
        top: 0,
        bottom: 0,
        background: "rgba(34,163,91,.14)"
      }
    }), vdc ? React.createElement("span", {
      style: {
        position: "absolute",
        left: px(vdc) + "%",
        top: 0,
        bottom: 0,
        width: 2,
        background: "var(--tint-red-tx)"
      }
    }) : null, React.createElement("span", {
      style: {
        position: "absolute",
        left: lo + "%",
        width: Math.max(1.5, hi - lo) + "%",
        top: 4,
        height: 10,
        borderRadius: 99,
        background: r.ok ? "linear-gradient(90deg,#F59E0B,#22A35B)" : "var(--tint-red-tx)",
        opacity: r.ok ? 1 : .55
      }
    }), React.createElement("span", {
      style: {
        position: "absolute",
        left: px(r.vocCold) + "%",
        top: 1,
        bottom: 1,
        width: 2,
        background: r.vocCold > vdc && vdc ? "var(--tint-red-tx)" : "var(--text-3)"
      }
    })), React.createElement("span", {
      style: {
        width: 54,
        textAlign: "right",
        fontSize: 10,
        fontWeight: 800,
        flex: "0 0 auto",
        color: r.ok ? r.score >= 75 ? "var(--acd)" : "var(--text-2)" : "var(--tint-red-tx)"
      }
    }, r.ok ? r.band : "ไม่ผ่าน"));
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 9.5,
      color: "var(--text-3)",
      paddingLeft: 39
    }
  }, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#F59E0B"
    }
  }, "\u25A0"), " \u0E41\u0E1C\u0E07\u0E23\u0E49\u0E2D\u0E19 (\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14)"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#22A35B"
    }
  }, "\u25A0"), " \u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19 (\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14)"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-red-tx)"
    }
  }, "\u2502"), " \u0E40\u0E1E\u0E14\u0E32\u0E19 Voc")));
}
const SU_SCOLOR = ["#22A35B", "#2563EB", "#D97706", "#7C3AED", "var(--tint-red-tx2)", "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#4F46E5"];
const suColor = i => SU_SCOLOR[(i - 1 + SU_SCOLOR.length) % SU_SCOLOR.length];
function SuLayout2D({
  foot,
  assign,
  active,
  onPaint,
  height,
  labels,
  colorOf,
  unitName
}) {
  const wrapRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const b = foot.bounds;
  const pad = 1.2;
  const W = b.maxX - b.minX + pad * 2,
    H = b.maxZ - b.minZ + pad * 2;
  const vb = b.minX - pad + " " + (b.minZ - pad) + " " + Math.max(1, W) + " " + Math.max(1, H);
  const paintAt = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.dataset && el.dataset.uid) onPaint(el.dataset.uid);
  };
  return React.createElement("div", {
    ref: wrapRef,
    style: {
      position: "relative",
      borderRadius: 12,
      border: "1px solid var(--ln)",
      background: "var(--surface2)",
      overflow: "hidden",
      touchAction: "none"
    }
  }, React.createElement("svg", {
    viewBox: vb,
    style: {
      width: "100%",
      height: height || 340,
      display: "block",
      cursor: active ? "crosshair" : "default"
    },
    onPointerDown: e => {
      if (!active) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
      setDrag(true);
      paintAt(e);
    },
    onPointerMove: e => {
      if (drag && active) paintAt(e);
    },
    onPointerUp: () => setDrag(false),
    onPointerCancel: () => setDrag(false)
  }, foot.outlines.map((o, i) => React.createElement("polygon", {
    key: i,
    points: o.pts.map(p => p[0] + "," + p[1]).join(" "),
    fill: "rgba(148,163,184,.10)",
    stroke: "var(--ln2)",
    strokeWidth: "0.08"
  })), foot.panels.map(p => {
    const s = assign[p.uid] || 0;
    const c = s ? colorOf ? colorOf(p.uid, s) : suColor(s) : null;
    const un = unitName || "สตริง";
    return React.createElement("polygon", {
      key: p.uid,
      "data-uid": p.uid,
      points: p.pts.map(q => q[0] + "," + q[1]).join(" "),
      fill: c ? c : "#CBD5E1",
      fillOpacity: c ? 0.88 : 0.5,
      stroke: c ? "#fff" : "#94A3B8",
      strokeWidth: "0.035",
      strokeDasharray: c ? null : "0.12 0.09",
      style: {
        cursor: active ? "crosshair" : "pointer"
      }
    }, React.createElement("title", null, p.roofName + " · " + p.key + (s ? " · " + un + " " + s : " · ยังไม่อยู่" + un + "ไหน") + (labels && labels[p.uid] ? " · เฟส " + labels[p.uid] : "")));
  }), labels && foot.panels.map(p => {
    const t = labels[p.uid];
    if (!t) return null;
    const cx = p.pts.reduce((a, q) => a + q[0], 0) / p.pts.length;
    const cz = p.pts.reduce((a, q) => a + q[1], 0) / p.pts.length;
    return React.createElement("text", {
      key: "L" + p.uid,
      x: cx,
      y: cz + 0.16,
      textAnchor: "middle",
      fontSize: "0.44",
      fontWeight: "800",
      fill: "#fff",
      stroke: "rgba(0,0,0,.35)",
      strokeWidth: "0.05",
      paintOrder: "stroke",
      style: {
        pointerEvents: "none",
        userSelect: "none"
      }
    }, t);
  }), React.createElement("g", {
    transform: "translate(" + (b.minX - pad + 0.7) + "," + (b.minZ - pad + 0.7) + ")"
  }, React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1.1",
    stroke: "var(--tint-red-tx)",
    strokeWidth: "0.09"
  }), React.createElement("text", {
    x: "0",
    y: "-0.15",
    fontSize: "0.62",
    fontWeight: "800",
    fill: "var(--tint-red-tx)",
    textAnchor: "middle"
  }, "N"))));
}
function SuMonthly({
  data
}) {
  const max = Math.max.apply(null, data.concat([1]));
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 4,
      height: 128
    }
  }, data.map((v, i) => React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 8.5,
      fontWeight: 800,
      color: "var(--text-3)"
    }
  }, Math.round(v / 100) / 10, "k"), React.createElement("div", {
    title: SC_MON[i] + " · " + v.toLocaleString() + " kWh",
    style: {
      width: "100%",
      height: Math.max(2, v / max * 88),
      borderRadius: "5px 5px 2px 2px",
      background: "linear-gradient(180deg,#3DBE74,#1E8A4C)"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 8.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, SC_MON[i].replace(".", "")))));
}
function SuLifeChart({
  rows
}) {
  const W = 560,
    H = 132,
    pad = 4;
  const max = Math.max.apply(null, rows.map(r => r.kwh));
  const x = i => pad + i / Math.max(1, rows.length - 1) * (W - pad * 2);
  const y = v => H - 18 - v / max * (H - 34);
  const line = rows.map((r, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(r.kwh).toFixed(1)).join(" ");
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block"
    },
    preserveAspectRatio: "none"
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "suFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#22A35B",
    stopOpacity: ".28"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#22A35B",
    stopOpacity: "0"
  }))), React.createElement("path", {
    d: line + " L" + x(rows.length - 1) + " " + (H - 18) + " L" + x(0) + " " + (H - 18) + " Z",
    fill: "url(#suFill)"
  }), React.createElement("path", {
    d: line,
    fill: "none",
    stroke: "#22A35B",
    strokeWidth: "2",
    strokeLinejoin: "round"
  }), rows.map((r, i) => (i % 2 === 0 || i === rows.length - 1) && React.createElement("g", {
    key: i
  }, React.createElement("circle", {
    cx: x(i),
    cy: y(r.kwh),
    r: "2.6",
    fill: "#fff",
    stroke: "#22A35B",
    strokeWidth: "1.6"
  }), React.createElement("text", {
    x: x(i),
    y: H - 5,
    textAnchor: "middle",
    fontSize: "8.5",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, "\u0E1B\u0E35 ", r.year))));
}
function suScrub(geo, onHour) {
  if (!onHour) return null;
  return e => {
    const el = e.currentTarget;
    const pick = cx => {
      const b = el.getBoundingClientRect();
      const f = (cx - b.left) / b.width * geo.W;
      onHour(scClamp(geo.h0 + (f - geo.L) / (geo.W - geo.L - geo.R) * (geo.h1 - geo.h0), geo.h0, geo.h1));
    };
    pick(e.clientX);
    const move = ev => pick(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}
function SuDayLight({
  sim,
  groups,
  hour,
  onHour
}) {
  const W = 660,
    H = 254,
    L = 44,
    R = 14,
    T = 20,
    B = 30;
  if (!sim || !sim.rows.length) return null;
  const top = Math.max(200, sim.maxGhi, sim.maxPoa) * 1.1;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5),
    h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = h => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Y = v => H - B - v / top * (H - T - B);
  const path = f => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Y(f(r)).toFixed(1)).join(" ");
  const area = f => path(f) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Y(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Y(0) + " Z";
  const cur = sim.rows.reduce((a, r) => Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a, sim.rows[0]);
  const ticks = [];
  for (let h = Math.ceil(h0); h <= h1; h++) if (h % 2 === 0) ticks.push(h);
  return React.createElement("div", {
    style: {
      position: "relative"
    }
  }, React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible",
      cursor: onHour ? "col-resize" : "default"
    },
    onPointerDown: suScrub({
      W,
      L,
      R,
      h0,
      h1
    }, onHour)
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "suPoaFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#22A35B",
    stopOpacity: ".30"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#22A35B",
    stopOpacity: ".02"
  })), React.createElement("pattern", {
    id: "suShadeHatch",
    width: "6",
    height: "6",
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)"
  }, React.createElement("rect", {
    width: "6",
    height: "6",
    fill: "rgba(71,85,105,.20)"
  }), React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "6",
    stroke: "#475569",
    strokeWidth: "2",
    opacity: ".55"
  }))), [0, 0.25, 0.5, 0.75, 1].map((f, k) => React.createElement("g", {
    key: k
  }, React.createElement("line", {
    x1: L,
    y1: Y(top * f),
    x2: W - R,
    y2: Y(top * f),
    stroke: "var(--ln)",
    strokeWidth: "1",
    strokeDasharray: f ? "3 4" : null
  }), React.createElement("text", {
    x: L - 7,
    y: Y(top * f) + 3.5,
    textAnchor: "end",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, Math.round(top * f)))), ticks.map(h => React.createElement("text", {
    key: h,
    x: X(h),
    y: H - B + 14,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, h, ":00")), React.createElement("text", {
    x: L - 7,
    y: 9,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "W/m\xB2"), sim.shadeFrom != null && React.createElement("path", {
    d: path(r => r.poaAvg) + " " + sim.rows.slice().reverse().map((r, i) => (i ? "L" : "L") + X(r.h).toFixed(1) + " " + Y(r.per && groups.length ? poaNetAvg(r, groups) : 0).toFixed(1)).join(" ") + " Z",
    fill: "url(#suShadeHatch)"
  }), React.createElement("path", {
    d: area(r => groups.length ? poaNetAvg(r, groups) : 0),
    fill: "url(#suPoaFill)"
  }), React.createElement("path", {
    d: path(r => r.ghi),
    fill: "none",
    stroke: "var(--text-3)",
    strokeWidth: "1.4",
    strokeDasharray: "5 4"
  }), React.createElement("path", {
    d: path(r => r.poaAvg),
    fill: "none",
    stroke: "#22A35B",
    strokeWidth: "1.3",
    opacity: ".45"
  }), React.createElement("path", {
    d: path(r => groups.length ? poaNetAvg(r, groups) : 0),
    fill: "none",
    stroke: "#22A35B",
    strokeWidth: "2.3",
    strokeLinejoin: "round"
  }), React.createElement("line", {
    x1: X(cur.h),
    y1: T,
    x2: X(cur.h),
    y2: H - B,
    stroke: "var(--ac)",
    strokeWidth: "1.6"
  }), React.createElement("circle", {
    cx: X(cur.h),
    cy: Y(groups.length ? poaNetAvg(cur, groups) : 0),
    r: "4.5",
    fill: "#fff",
    stroke: "var(--ac)",
    strokeWidth: "2.2"
  }), React.createElement("g", {
    transform: "translate(" + scClamp(X(cur.h), L + 4, W - R - 96) + "," + (T + 2) + ")"
  }, React.createElement("rect", {
    width: "94",
    height: "17",
    rx: "5",
    fill: "var(--ac)"
  }), React.createElement("text", {
    x: "47",
    y: "12",
    textAnchor: "middle",
    fontSize: "9.5",
    fontWeight: "800",
    fill: "#fff"
  }, ivHM(cur.h), " \xB7 ", Math.round(groups.length ? poaNetAvg(cur, groups) : 0), " W/m\xB2"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700,
      paddingLeft: 44
    }
  }, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2505"), " \u0E41\u0E2A\u0E07\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E23\u0E32\u0E1A"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#22A35B"
    }
  }, "\u2501"), " \u0E41\u0E2A\u0E07\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E07\u0E08\u0E23\u0E34\u0E07 (\u0E2B\u0E25\u0E31\u0E07\u0E2B\u0E31\u0E01\u0E40\u0E07\u0E32)"), sim.shadeFrom != null && React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#475569"
    }
  }, "\u25A8"), " \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E01\u0E34\u0E19\u0E44\u0E1B")));
}
function poaNetAvg(row, groups) {
  let s = 0,
    n = 0;
  groups.forEach(g => {
    const p = row.per[g.key];
    if (p) {
      s += p.poaNet * g.count;
      n += g.count;
    }
  });
  return n ? s / n : 0;
}
function SuDayPower({
  sim,
  groups,
  acKw,
  hour,
  onHour
}) {
  const W = 660,
    H = 214,
    L = 42,
    R = 42,
    T = 36,
    B = 28;
  if (!sim || !sim.rows.length) return null;
  const pTop = Math.max(1, sim.rows.reduce((a, r) => Math.max(a, r.dc), 0)) * 1.12;
  const tTop = 90;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5),
    h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = h => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Yp = v => H - B - v / pTop * (H - T - B);
  const Yt = v => H - B - v / tTop * (H - T - B);
  const line = (f, Yf) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Yf(f(r)).toFixed(1)).join(" ");
  const tOf = r => {
    let s = 0,
      n = 0;
    groups.forEach(g => {
      const p = r.per[g.key];
      if (p) {
        s += p.tCell * g.count;
        n += g.count;
      }
    });
    return n ? s / n : 0;
  };
  const cur = sim.rows.reduce((a, r) => Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a, sim.rows[0]);
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    onPointerDown: suScrub({
      W,
      L,
      R,
      h0,
      h1
    }, onHour),
    style: {
      width: "100%",
      display: "block",
      overflow: "visible",
      cursor: onHour ? "col-resize" : "default"
    }
  }, [0, 0.5, 1].map((f, k) => React.createElement("g", {
    key: k
  }, React.createElement("line", {
    x1: L,
    y1: Yp(pTop * f),
    x2: W - R,
    y2: Yp(pTop * f),
    stroke: "var(--ln)",
    strokeWidth: "1",
    strokeDasharray: f ? "3 4" : null
  }), React.createElement("text", {
    x: L - 6,
    y: Yp(pTop * f) + 3.5,
    textAnchor: "end",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, scR(pTop * f, 1)), React.createElement("text", {
    x: W - R + 6,
    y: Yt(tTop * f) + 3.5,
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--tint-red-tx2)"
  }, Math.round(tTop * f)))), React.createElement("text", {
    x: L - 6,
    y: 9,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "kW"), React.createElement("text", {
    x: W - R + 6,
    y: 9,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--tint-red-tx2)"
  }, "\xB0C"), acKw > 0 && acKw < pTop && React.createElement("g", null, React.createElement("line", {
    x1: L,
    y1: Yp(acKw),
    x2: W - R,
    y2: Yp(acKw),
    stroke: "var(--tint-amber-tx)",
    strokeWidth: "1.4",
    strokeDasharray: "5 3"
  }), React.createElement("text", {
    x: W - R - 2,
    y: Yp(acKw) - 4,
    textAnchor: "end",
    fontSize: "9",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, "\u0E40\u0E1E\u0E14\u0E32\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C ", acKw, " kW")), React.createElement("path", {
    d: line(r => r.dc, Yp) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Yp(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Yp(0) + " Z",
    fill: "rgba(34,163,91,.14)"
  }), React.createElement("path", {
    d: line(r => r.dc, Yp),
    fill: "none",
    stroke: "#22A35B",
    strokeWidth: "1.4",
    strokeDasharray: "4 3"
  }), React.createElement("path", {
    d: line(r => r.ac, Yp),
    fill: "none",
    stroke: "#0F7A43",
    strokeWidth: "2.3",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: line(tOf, Yt),
    fill: "none",
    stroke: "var(--tint-red-tx2)",
    strokeWidth: "1.7",
    strokeLinejoin: "round",
    opacity: ".85"
  }), (() => {
    const pk = sim.rows.reduce((a, r) => r.ac > a.ac ? r : a, sim.rows[0]);
    const tk = sim.rows.reduce((a, r) => tOf(r) > tOf(a) ? r : a, sim.rows[0]);
    const farP = Math.abs(pk.h - cur.h) > 0.9,
      farT = Math.abs(tk.h - cur.h) > 0.9;
    return React.createElement(React.Fragment, null, React.createElement("circle", {
      cx: X(pk.h),
      cy: Yp(pk.ac),
      r: "3.2",
      fill: "#fff",
      stroke: "#0F7A43",
      strokeWidth: "1.8"
    }), farP && React.createElement("text", {
      x: scClamp(X(pk.h), L + 34, W - R - 34),
      y: Yp(pk.ac) - 7,
      textAnchor: "middle",
      fontSize: "9.5",
      fontWeight: "800",
      fill: "#0F7A43"
    }, "\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ", scR(pk.ac, 2), " kW"), React.createElement("circle", {
      cx: X(tk.h),
      cy: Yt(tOf(tk)),
      r: "3",
      fill: "#fff",
      stroke: "var(--tint-red-tx2)",
      strokeWidth: "1.6"
    }), farT && React.createElement("text", {
      x: scClamp(X(tk.h), L + 30, W - R - 30),
      y: Yt(tOf(tk)) - 6,
      textAnchor: "middle",
      fontSize: "9",
      fontWeight: "800",
      fill: "var(--tint-red-tx2)"
    }, "\u0E23\u0E49\u0E2D\u0E19\u0E2A\u0E38\u0E14 ", scR(tOf(tk), 0), "\xB0C"));
  })(), React.createElement("line", {
    x1: X(cur.h),
    y1: T,
    x2: X(cur.h),
    y2: H - B,
    stroke: "var(--ac)",
    strokeWidth: "1.4"
  }), React.createElement("circle", {
    cx: X(cur.h),
    cy: Yp(cur.ac),
    r: "4",
    fill: "#fff",
    stroke: "var(--ac)",
    strokeWidth: "2"
  }), React.createElement("circle", {
    cx: X(cur.h),
    cy: Yt(tOf(cur)),
    r: "3.4",
    fill: "#fff",
    stroke: "var(--tint-red-tx2)",
    strokeWidth: "1.8"
  }), React.createElement("g", {
    transform: "translate(" + scClamp(X(cur.h) + 7, L, W - R - 104) + "," + (T + 1) + ")"
  }, React.createElement("rect", {
    width: "102",
    height: "30",
    rx: "6",
    fill: "var(--surface)",
    stroke: "var(--ln2)"
  }), React.createElement("text", {
    x: "7",
    y: "13",
    fontSize: "9.5",
    fontWeight: "800",
    fill: "var(--text-2)"
  }, ivHM(cur.h)), React.createElement("text", {
    x: "95",
    y: "13",
    textAnchor: "end",
    fontSize: "9.5",
    fontWeight: "800",
    fill: "#0F7A43"
  }, scR(cur.ac, 2), " kW"), React.createElement("text", {
    x: "7",
    y: "25",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, "DC ", scR(cur.dc, 2)), React.createElement("text", {
    x: "95",
    y: "25",
    textAnchor: "end",
    fontSize: "9",
    fontWeight: "800",
    fill: "var(--tint-red-tx2)"
  }, "\u0E40\u0E0B\u0E25\u0E25\u0E4C ", scR(tOf(cur), 0), "\xB0C")), [6, 9, 12, 15, 18].filter(h => h >= h0 && h <= h1).map(h => React.createElement("text", {
    key: h,
    x: X(h),
    y: H - B + 13,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, h, ":00")));
}
function SuYearMap({
  year,
  mode,
  month,
  onMonth
}) {
  if (!year || !year.months.length) return null;
  const hrs = year.hours;
  const colLight = v => {
    if (v <= 2) return "var(--surface3)";
    const t = scClamp(v / Math.max(1, year.maxPoa), 0, 1);
    const stops = [[219, 234, 254], [134, 211, 180], [74, 179, 122], [250, 204, 21], [245, 158, 11]];
    const f = t * (stops.length - 1),
      i = Math.min(stops.length - 2, Math.floor(f)),
      k = f - i;
    const c = [0, 1, 2].map(j => Math.round(stops[i][j] + (stops[i + 1][j] - stops[i][j]) * k));
    return "rgb(" + c.join(",") + ")";
  };
  const colShade = (v, poa) => {
    if (poa <= 2) return "var(--surface3)";
    if (v <= 0.5) return "#E8F5ED";
    return v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)";
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      paddingLeft: 34
    }
  }, hrs.map(h => React.createElement("span", {
    key: h,
    style: {
      flex: 1,
      fontSize: 8,
      fontWeight: 700,
      color: "var(--text-3)",
      textAlign: "center",
      minWidth: 0
    }
  }, h % 2 === 0 ? h : ""))), year.months.map(mo => React.createElement("div", {
    key: mo.m,
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement("button", {
    onClick: () => onMonth && onMonth(mo),
    title: mo.label + " · " + mo.dayKwh + " kWh/วัน · เงา " + mo.shadeLossPct + "%",
    style: {
      width: 34,
      flex: "0 0 auto",
      fontSize: 9.5,
      fontWeight: 800,
      textAlign: "right",
      border: "none",
      background: "none",
      color: month === mo.m ? "var(--acd)" : "var(--text-3)",
      cursor: "pointer",
      padding: 0
    }
  }, mo.label.replace(".", "")), React.createElement("span", {
    style: {
      display: "flex",
      flex: 1,
      gap: 1,
      height: 15,
      borderRadius: 4,
      overflow: "hidden",
      outline: month === mo.m ? "1.5px solid var(--ac)" : "none",
      outlineOffset: 1
    }
  }, mo.cells.map((c, i) => React.createElement("span", {
    key: i,
    title: mo.label + " " + ivHM(c.h) + " · แสง " + c.poa + " W/m²" + (c.shade > 0.5 ? " · เงาบัง " + c.shade + "%" : ""),
    style: {
      flex: 1,
      background: mode === "shade" ? colShade(c.shade, c.poa) : colLight(c.poa)
    }
  }))), React.createElement("span", {
    style: {
      width: 54,
      flex: "0 0 auto",
      fontSize: 9.5,
      fontWeight: 700,
      textAlign: "right",
      color: mode === "shade" ? mo.shadeLossPct >= 5 ? "var(--tint-red-tx)" : mo.shadeLossPct > 0 ? "var(--tint-amber-tx)" : "var(--text-3)" : "var(--text-2)"
    }
  }, mode === "shade" ? mo.shadeLossPct + "%" : Math.round(mo.monthKwh / 100) / 10 + "k"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      paddingLeft: 40,
      marginTop: 3,
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, mode === "shade" ? React.createElement(React.Fragment, null, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#E8F5ED"
    }
  }, "\u25A0"), " \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E07\u0E32"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-amber-bd)"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#F59E0B"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E21\u0E32\u0E01"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-red-tx2)"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E40\u0E01\u0E37\u0E2D\u0E1A\u0E2B\u0E21\u0E14"), React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, "\u0E02\u0E27\u0E32\u0E2A\u0E38\u0E14 = \u0E40\u0E2A\u0E35\u0E22\u0E44\u0E1B\u0E01\u0E35\u0E48 % \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19")) : React.createElement(React.Fragment, null, React.createElement("span", null, "\u0E2D\u0E48\u0E2D\u0E19 = \u0E41\u0E14\u0E14\u0E19\u0E49\u0E2D\u0E22"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#4AB37A"
    }
  }, "\u25A0"), " \u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#F59E0B"
    }
  }, "\u25A0"), " \u0E41\u0E23\u0E07\u0E2A\u0E38\u0E14 ", year.maxPoa, " W/m\xB2"), React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, "\u0E02\u0E27\u0E32\u0E2A\u0E38\u0E14 = \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E17\u0E31\u0E49\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19 (kWh)"))));
}
function SuShadeStrip({
  sim,
  groups
}) {
  if (!sim || !sim.rows.length) return null;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5),
    h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const col = v => v <= 0.5 ? "var(--surface3)" : v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)";
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, groups.map(g => React.createElement("div", {
    key: g.key,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, React.createElement("span", {
    style: {
      width: 118,
      flex: "0 0 auto",
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-2)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    title: g.label
  }, g.roofName, g.side ? " · " + g.side : ""), React.createElement("span", {
    style: {
      display: "flex",
      flex: 1,
      height: 15,
      borderRadius: 5,
      overflow: "hidden",
      gap: 1
    }
  }, sim.rows.map((r, i) => {
    const v = r.per[g.key] ? r.per[g.key].shade : 0;
    return React.createElement("span", {
      key: i,
      title: ivHM(r.h) + " · เงาบัง " + v + "%",
      style: {
        flex: 1,
        background: col(v)
      }
    });
  })))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      paddingLeft: 127,
      fontSize: 9,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, React.createElement("span", null, ivHM(h0)), React.createElement("span", null, "\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07"), React.createElement("span", null, ivHM(h1))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      paddingLeft: 127,
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#E5E9E6"
    }
  }, "\u25A0"), " \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E07\u0E32"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-amber-bd)"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E1A\u0E32\u0E07\u0E2A\u0E48\u0E27\u0E19"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#F59E0B"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E21\u0E32\u0E01"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-red-tx2)"
    }
  }, "\u25A0"), " \u0E1A\u0E31\u0E07\u0E40\u0E01\u0E37\u0E2D\u0E1A\u0E2B\u0E21\u0E14")));
}
function SuIvChart({
  curves,
  stcRef,
  meas,
  height,
  focusId
}) {
  const W = 620,
    H = 372,
    L = 46,
    R = 48,
    T = 16,
    B = 32;
  const list = (curves || []).filter(x => x && x.curve);
  if (!list.length) return null;
  const solo = focusId != null ? list.find(x => x.id === focusId) : null;
  const exp = solo ? solo.curve : list[0].curve;
  const mx = f => list.reduce((a, x) => Math.max(a, f(x.curve)), 0);
  const vTop = Math.max(mx(c => c.voc), stcRef ? stcRef.voc : 0, meas && meas.voc ? meas.voc : 0) * 1.07;
  const iTop = Math.max(mx(c => c.isc), stcRef ? stcRef.isc : 0, meas && meas.isc ? meas.isc : 0) * 1.16;
  const pTop = Math.max(mx(c => c.pmax), stcRef ? stcRef.pmax : 0, meas && meas.pmax ? meas.pmax : 0) * 1.16;
  const X = v => L + v / vTop * (W - L - R);
  const Yi = i => H - B - i / iTop * (H - T - B);
  const Yp = p => H - B - p / pTop * (H - T - B);
  const path = (pts, fy, fv) => pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  const ivOf = c => path(c.pts, Yi, q => q.i);
  const pvOf = c => path(c.pts, Yp, q => q.p);
  const gridV = 5,
    gridI = 4;
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      height: height || "auto",
      display: "block",
      overflow: "visible"
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "suIvFill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#22A35B",
    stopOpacity: ".16"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#22A35B",
    stopOpacity: "0"
  }))), Array.from({
    length: gridI + 1
  }).map((_, k) => {
    const y = T + (H - T - B) * k / gridI,
      iv = iTop * (1 - k / gridI),
      pv = pTop * (1 - k / gridI);
    return React.createElement("g", {
      key: "h" + k
    }, React.createElement("line", {
      x1: L,
      y1: y,
      x2: W - R,
      y2: y,
      stroke: "var(--ln)",
      strokeWidth: "1",
      strokeDasharray: k === gridI ? null : "3 4"
    }), React.createElement("text", {
      x: L - 7,
      y: y + 3.5,
      textAnchor: "end",
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--text-3)"
    }, scR(iv, iTop > 20 ? 0 : 1)), React.createElement("text", {
      x: W - R + 7,
      y: y + 3.5,
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--tint-amber-tx)"
    }, pv >= 1000 ? scR(pv / 1000, 1) + "k" : scR(pv, 0)));
  }), Array.from({
    length: gridV + 1
  }).map((_, k) => {
    const v = vTop * k / gridV;
    return React.createElement("g", {
      key: "v" + k
    }, React.createElement("line", {
      x1: X(v),
      y1: T,
      x2: X(v),
      y2: H - B,
      stroke: "var(--ln)",
      strokeWidth: "1",
      strokeDasharray: "3 4",
      opacity: k ? 1 : 0
    }), React.createElement("text", {
      x: X(v),
      y: H - B + 13,
      textAnchor: "middle",
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--text-3)"
    }, scR(v, 0)));
  }), React.createElement("line", {
    x1: L,
    y1: T,
    x2: L,
    y2: H - B,
    stroke: "var(--ln2)",
    strokeWidth: "1.2"
  }), React.createElement("text", {
    x: L - 7,
    y: T - 5,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "A"), React.createElement("text", {
    x: W - R + 7,
    y: T - 5,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, "W"), React.createElement("text", {
    x: W - R,
    y: H - 4,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 (V)"), stcRef && React.createElement("path", {
    d: ivOf(stcRef),
    fill: "none",
    stroke: "var(--text-3)",
    strokeWidth: "1.3",
    strokeDasharray: "5 4",
    opacity: ".5"
  }), solo ? React.createElement("g", null, React.createElement("path", {
    d: ivOf(exp) + " L" + X(exp.voc) + " " + Yi(0) + " L" + X(0) + " " + Yi(0) + " Z",
    fill: "url(#suIvFill)"
  }), React.createElement("path", {
    d: ivOf(exp),
    fill: "none",
    stroke: solo.color || "#22A35B",
    strokeWidth: "2.2",
    strokeLinejoin: "round"
  }), React.createElement("path", {
    d: pvOf(exp),
    fill: "none",
    stroke: "#D97706",
    strokeWidth: "1.7",
    strokeDasharray: "4 3"
  }), React.createElement("line", {
    x1: X(exp.vmp),
    y1: Yi(exp.imp),
    x2: X(exp.vmp),
    y2: H - B,
    stroke: solo.color || "#22A35B",
    strokeWidth: "1",
    strokeDasharray: "2 3",
    opacity: ".7"
  }), React.createElement("line", {
    x1: L,
    y1: Yi(exp.imp),
    x2: X(exp.vmp),
    y2: Yi(exp.imp),
    stroke: solo.color || "#22A35B",
    strokeWidth: "1",
    strokeDasharray: "2 3",
    opacity: ".7"
  }), React.createElement("circle", {
    cx: X(exp.vmp),
    cy: Yi(exp.imp),
    r: "4",
    fill: "#fff",
    stroke: solo.color || "#22A35B",
    strokeWidth: "2.2"
  }), React.createElement("text", {
    x: X(exp.vmp),
    y: Yi(exp.imp) - 9,
    textAnchor: "middle",
    fontSize: "9.5",
    fontWeight: "800",
    fill: solo.color || "var(--acd)"
  }, scR(exp.pmax >= 1000 ? exp.pmax / 1000 : exp.pmax, 2), exp.pmax >= 1000 ? " kW" : " W")) : React.createElement("g", null, list.map(x => React.createElement("g", {
    key: x.id
  }, React.createElement("path", {
    d: ivOf(x.curve),
    fill: "none",
    stroke: x.color,
    strokeWidth: "2",
    strokeLinejoin: "round",
    opacity: ".92"
  }), React.createElement("circle", {
    cx: X(x.curve.vmp),
    cy: Yi(x.curve.imp),
    r: "3.6",
    fill: "#fff",
    stroke: x.color,
    strokeWidth: "2"
  }))), (() => {
    const rows = list.map(x => ({
      c: x.color,
      t: x.name,
      v: scR(scNum(x.watt, x.curve.pmax), 0).toLocaleString() + " W"
    })).concat([{
      c: null,
      t: "ที่มาตรฐาน STC (1000 W/m² · 25°C)",
      v: ""
    }]);
    const cols = rows.length > 10 ? 2 : 1;
    const per = Math.ceil(rows.length / cols);
    const rh = 12,
      cw = cols > 1 ? 158 : 176,
      pad = 7;
    const bw = cw * cols + pad,
      bh = per * rh + pad * 1.6,
      bx = L + 52,
      by = H - B - bh - 12;
    return React.createElement("g", null, React.createElement("rect", {
      x: bx,
      y: by,
      width: bw,
      height: bh,
      rx: "6",
      fill: "var(--surface)",
      fillOpacity: "0.93",
      stroke: "var(--ln2)"
    }), rows.map((r, i) => {
      const cx = bx + pad + Math.floor(i / per) * cw,
        cy = by + pad + i % per * rh + 7;
      return React.createElement("g", {
        key: i
      }, React.createElement("rect", {
        x: cx,
        y: cy - 3.4,
        width: "12",
        height: "3",
        rx: "1.5",
        fill: r.c || "var(--text-3)",
        fillOpacity: r.c ? 1 : 0.55
      }), React.createElement("text", {
        x: cx + 17,
        y: cy,
        fontSize: "8.5",
        fontWeight: r.c ? 700 : 600,
        fill: r.c ? "var(--text-2)" : "var(--text-3)"
      }, r.t), r.v && React.createElement("text", {
        x: cx + cw - 12,
        y: cy,
        textAnchor: "end",
        fontSize: "8.5",
        fontWeight: "800",
        fill: "var(--text-1)"
      }, r.v));
    }));
  })()), meas && (meas.voc || meas.isc) && React.createElement("g", null, meas.voc ? React.createElement("g", null, React.createElement("circle", {
    cx: X(meas.voc),
    cy: Yi(0),
    r: "4.2",
    fill: "#2563EB"
  }), React.createElement("text", {
    x: X(meas.voc),
    y: Yi(0) - 8,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "800",
    fill: "#1D4ED8"
  }, "Voc")) : null, meas.isc ? React.createElement("g", null, React.createElement("circle", {
    cx: X(0),
    cy: Yi(meas.isc),
    r: "4.2",
    fill: "#2563EB"
  }), React.createElement("text", {
    x: X(0) + 8,
    y: Yi(meas.isc) - 5,
    fontSize: "9",
    fontWeight: "800",
    fill: "#1D4ED8"
  }, "Isc")) : null, meas.vmp && meas.imp ? React.createElement("g", null, React.createElement("circle", {
    cx: X(meas.vmp),
    cy: Yi(meas.imp),
    r: "5",
    fill: "#2563EB",
    stroke: "#fff",
    strokeWidth: "1.6"
  }), React.createElement("text", {
    x: X(meas.vmp),
    y: Yi(meas.imp) + 15,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "800",
    fill: "#1D4ED8"
  }, "\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49")) : null));
}
const SU_GRAMP = ["#0B5F35", "#15803D", "#22A35B", "#6FC48F", "#B3DEC4"];
const SU_TRAMP = ["#1D4ED8", "#0F7A43", "#D97706", "var(--tint-red-tx2)"];
function SuIvFamily({
  curves,
  mode,
  showPv
}) {
  const W = 620,
    H = 356,
    L = 46,
    R = 50,
    T = 18,
    B = 32;
  const list = (curves || []).filter(Boolean);
  if (!list.length) return null;
  const ramp = mode === "temp" ? SU_TRAMP : SU_GRAMP;
  const colOf = i => ramp[Math.min(i, ramp.length - 1)];
  const vTop = list.reduce((a, c) => Math.max(a, c.voc), 0) * 1.08;
  const iTop = list.reduce((a, c) => Math.max(a, c.isc), 0) * 1.14;
  const pTop = list.reduce((a, c) => Math.max(a, c.pmax), 0) * 1.14;
  const X = v => L + v / vTop * (W - L - R);
  const Yi = i => H - B - i / iTop * (H - T - B);
  const Yp = p => H - B - p / pTop * (H - T - B);
  const path = (pts, fy, fv) => pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  const gI = 4,
    gV = 5;
  const locus = list.map((c, k) => (k ? "L" : "M") + X(c.vmp).toFixed(1) + " " + Yi(c.imp).toFixed(1)).join(" ");
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, Array.from({
    length: gI + 1
  }).map((_, k) => {
    const y = T + (H - T - B) * k / gI,
      iv = iTop * (1 - k / gI),
      pv = pTop * (1 - k / gI);
    return React.createElement("g", {
      key: "h" + k
    }, React.createElement("line", {
      x1: L,
      y1: y,
      x2: W - R,
      y2: y,
      stroke: "var(--ln)",
      strokeWidth: "1",
      strokeDasharray: k === gI ? null : "3 4"
    }), React.createElement("text", {
      x: L - 7,
      y: y + 3.5,
      textAnchor: "end",
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--text-3)"
    }, scR(iv, iTop > 20 ? 0 : 1)), showPv && React.createElement("text", {
      x: W - R + 7,
      y: y + 3.5,
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--tint-amber-tx)"
    }, pv >= 1000 ? scR(pv / 1000, 1) + "k" : scR(pv, 0)));
  }), Array.from({
    length: gV + 1
  }).map((_, k) => {
    const v = vTop * k / gV;
    return React.createElement("g", {
      key: "v" + k
    }, React.createElement("line", {
      x1: X(v),
      y1: T,
      x2: X(v),
      y2: H - B,
      stroke: "var(--ln)",
      strokeWidth: "1",
      strokeDasharray: "3 4",
      opacity: k ? 1 : 0
    }), React.createElement("text", {
      x: X(v),
      y: H - B + 13,
      textAnchor: "middle",
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--text-3)"
    }, scR(v, 0)));
  }), React.createElement("line", {
    x1: L,
    y1: T,
    x2: L,
    y2: H - B,
    stroke: "var(--ln2)",
    strokeWidth: "1.2"
  }), React.createElement("text", {
    x: L - 7,
    y: T - 5,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "A"), showPv && React.createElement("text", {
    x: W - R + 7,
    y: T - 5,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, "W"), React.createElement("text", {
    x: W - R,
    y: H - 4,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 (V)"), showPv && React.createElement("path", {
    d: locus,
    fill: "none",
    stroke: "var(--text-3)",
    strokeWidth: "1",
    strokeDasharray: "2 4",
    opacity: ".5"
  }), list.map((c, i) => React.createElement("g", {
    key: c.key
  }, showPv && React.createElement("path", {
    d: path(c.pts, Yp, q => q.p),
    fill: "none",
    stroke: colOf(i),
    strokeWidth: "1.4",
    strokeDasharray: "4 3",
    opacity: ".75"
  }), React.createElement("path", {
    d: path(c.pts, Yi, q => q.i),
    fill: "none",
    stroke: colOf(i),
    strokeWidth: "2.1",
    strokeLinejoin: "round"
  }), React.createElement("circle", {
    cx: X(c.vmp),
    cy: Yi(c.imp),
    r: "3.6",
    fill: "var(--surface)",
    stroke: colOf(i),
    strokeWidth: "2"
  }))), (() => {
    const rh = 12.5,
      cw = 196,
      pad = 8;
    const bh = list.length * rh + pad * 2 + 12,
      bx = L + 20,
      by = H - B - bh - 10;
    return React.createElement("g", null, React.createElement("rect", {
      x: bx,
      y: by,
      width: cw + pad,
      height: bh,
      rx: "7",
      fill: "var(--surface)",
      fillOpacity: ".94",
      stroke: "var(--ln2)"
    }), React.createElement("text", {
      x: bx + pad,
      y: by + pad + 8,
      fontSize: "8",
      fontWeight: "800",
      fill: "var(--text-3)",
      letterSpacing: ".08em"
    }, mode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง"), list.map((c, i) => {
      const cy = by + pad + 20 + i * rh + 3;
      return React.createElement("g", {
        key: c.key
      }, React.createElement("rect", {
        x: bx + pad,
        y: cy - 3.4,
        width: "13",
        height: "3",
        rx: "1.5",
        fill: colOf(i)
      }), React.createElement("text", {
        x: bx + pad + 19,
        y: cy,
        fontSize: "8.5",
        fontWeight: "700",
        fill: "var(--text-2)"
      }, c.label), React.createElement("text", {
        x: bx + pad + 86,
        y: cy,
        fontSize: "8.5",
        fontWeight: "700",
        fill: "var(--text-3)"
      }, scR(c.vmp, 0), " V \xB7 ", scR(c.imp, 1), " A"), React.createElement("text", {
        x: bx + cw - 4,
        y: cy,
        textAnchor: "end",
        fontSize: "8.5",
        fontWeight: "800",
        fill: "var(--text-1)"
      }, c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : scR(c.pmax, 0) + " W"));
    }));
  })());
}
const SU_ISO = [{
  at: 0.40,
  c: "var(--tint-red-tx)",
  o: 0.85,
  lb: "40%+"
}, {
  at: 0.20,
  c: "var(--tint-red-tx2)",
  o: 0.60,
  lb: "20–40%"
}, {
  at: 0.10,
  c: "#F59E0B",
  o: 0.62,
  lb: "10–20%"
}, {
  at: 0.05,
  c: "#F59E0B",
  o: 0.40,
  lb: "5–10%"
}, {
  at: 0.01,
  c: "#F59E0B",
  o: 0.22,
  lb: "1–5%"
}];
const suIsoBand = f => SU_ISO.find(b => f >= b.at) || null;
function SuSunPath({
  path,
  iso,
  mark
}) {
  if (!path || !path.paths.length) return null;
  const W = 640,
    H = 330,
    L = 40,
    R = 16,
    T = 16,
    B = 30;
  const a0 = 0,
    a1 = 360,
    altTop = 90;
  const X = az => L + (az - a0) / (a1 - a0) * (W - L - R);
  const Y = alt => H - B - scClamp(alt, 0, altTop) / altTop * (H - T - B);
  const cw = iso ? Math.abs(X(iso.azStep) - X(0)) : 0;
  const ch = iso ? Math.abs(Y(0) - Y(iso.altStep)) : 0;
  const compass = [[0, "เหนือ"], [45, "ตอ.เฉียงเหนือ"], [90, "ตะวันออก"], [135, "ตอ.เฉียงใต้"], [180, "ใต้"], [225, "ตต.เฉียงใต้"], [270, "ตะวันตก"], [315, "ตต.เฉียงเหนือ"], [360, "เหนือ"]];
  const line = pts => pts.map((q, k) => (k ? "L" : "M") + X(q.az).toFixed(1) + " " + Y(q.alt).toFixed(1)).join(" ");
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, React.createElement("rect", {
    x: L,
    y: T,
    width: W - L - R,
    height: H - T - B,
    rx: "6",
    fill: "var(--bg)",
    opacity: ".55"
  }), iso && iso.cells.map((c, i) => {
    const b = suIsoBand(c.f);
    if (!b) return null;
    return React.createElement("rect", {
      key: i,
      x: X(c.az) - cw / 2,
      y: Y(c.alt) - ch / 2,
      width: cw + 0.6,
      height: ch + 0.6,
      fill: b.c,
      opacity: b.o
    });
  }), Array.from({
    length: 7
  }).map((_, k) => {
    const alt = k * 15;
    return React.createElement("g", {
      key: "a" + k
    }, React.createElement("line", {
      x1: L,
      y1: Y(alt),
      x2: W - R,
      y2: Y(alt),
      stroke: "var(--ln)",
      strokeWidth: "1",
      strokeDasharray: k ? "3 4" : null,
      opacity: ".9"
    }), React.createElement("text", {
      x: L - 6,
      y: Y(alt) + 3.4,
      textAnchor: "end",
      fontSize: "9",
      fontWeight: "700",
      fill: "var(--text-3)"
    }, alt, "\xB0"));
  }), compass.map(([az, lb], k) => React.createElement("g", {
    key: k
  }, React.createElement("line", {
    x1: X(az),
    y1: T,
    x2: X(az),
    y2: H - B,
    stroke: "var(--ln)",
    strokeWidth: "1",
    strokeDasharray: "3 4",
    opacity: az === 0 || az === 360 ? 0 : 1
  }), React.createElement("text", {
    x: X(az),
    y: H - B + 13,
    textAnchor: az === 0 ? "start" : az === 360 ? "end" : "middle",
    fontSize: "8.5",
    fontWeight: az === 180 ? 800 : 700,
    fill: az === 180 ? "var(--text-2)" : "var(--text-3)"
  }, lb))), React.createElement("text", {
    x: L - 6,
    y: T - 4,
    textAnchor: "end",
    fontSize: "8",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "\u0E2A\u0E39\u0E07"), path.hours.map(hr => React.createElement("g", {
    key: hr.h
  }, hr.segs.map((sg, k) => React.createElement("path", {
    key: k,
    d: line(sg),
    fill: "none",
    stroke: "var(--text-3)",
    strokeWidth: "1",
    strokeDasharray: "2 3",
    opacity: ".55"
  })), React.createElement("text", {
    x: X(hr.pts[0].az),
    y: Y(hr.pts[0].alt) - 5,
    textAnchor: "middle",
    fontSize: "8",
    fontWeight: "800",
    fill: "var(--text-3)",
    opacity: ".9"
  }, hr.h))), path.paths.map((p, i) => {
    const main = i === 0 || i === path.paths.length - 1 || i === 3;
    return React.createElement("g", {
      key: p.doy
    }, p.segs.map((sg, k) => React.createElement("path", {
      key: k,
      d: line(sg),
      fill: "none",
      stroke: "var(--tint-amber-tx)",
      strokeWidth: main ? 1.9 : 1.2,
      opacity: main ? 0.95 : 0.6,
      strokeLinecap: "round"
    })));
  }), [path.paths[0], path.paths[path.paths.length - 1]].map((p, i) => p && p.peak ? React.createElement("text", {
    key: i,
    x: scClamp(X(p.peak.az), L + 34, W - R - 34),
    y: Y(p.peak.alt) + (i ? 13 : -7),
    textAnchor: "middle",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, p.label) : null), mark && mark.alt > 0 && mark.az >= a0 && mark.az <= a1 && React.createElement("g", null, React.createElement("circle", {
    cx: X(mark.az),
    cy: Y(mark.alt),
    r: "9",
    fill: "#F59E0B",
    opacity: ".22"
  }), React.createElement("circle", {
    cx: X(mark.az),
    cy: Y(mark.alt),
    r: "4.6",
    fill: "#F59E0B",
    stroke: "var(--surface)",
    strokeWidth: "1.6"
  }), React.createElement("text", {
    x: X(mark.az),
    y: Y(mark.alt) - 13,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, mark.label || "ตอนนี้")));
}
function SuLossFlow({
  chain
}) {
  const rows = (chain || []).filter(Boolean);
  if (!rows.length) return null;
  const top = rows.reduce((a, r) => Math.max(a, r.kwh || 0), 1);
  const W = 620,
    X0 = 28,
    TW = 132,
    XL = 232,
    LX = 244;
  const HL = 46,
    HM = 40,
    TOP = 12;
  const cut = (s, n) => s && s.length > n ? s.slice(0, n - 1) + "…" : s || "";
  const wOf = v => scClamp(v / top, 0, 1) * TW;
  const seg = [];
  let prev = rows[0].kwh,
    y = TOP;
  rows.forEach(r => {
    const h = r.kind === "loss" || r.kind === "gain" ? HL : HM;
    seg.push({
      r,
      y0: y,
      y1: y + h,
      wA: wOf(prev),
      wB: wOf(r.kwh)
    });
    prev = r.kwh;
    y += h;
  });
  const last = seg[seg.length - 1];
  const H = last.y1 + 20;
  const trunk = "M" + X0 + " " + TOP + " L" + (X0 + seg[0].wA).toFixed(1) + " " + TOP + " " + seg.map(s => {
    const yc = (s.y0 + s.y1) / 2;
    return "L" + (X0 + s.wA).toFixed(1) + " " + yc.toFixed(1) + " L" + (X0 + s.wB).toFixed(1) + " " + yc.toFixed(1) + " L" + (X0 + s.wB).toFixed(1) + " " + s.y1.toFixed(1);
  }).join(" ") + " L" + (X0 + last.wB / 2).toFixed(1) + " " + (last.y1 + 14).toFixed(1) + " L" + X0 + " " + last.y1.toFixed(1) + " Z";
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "hidden"
    }
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "suFlowG",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#3ECF84"
  }), React.createElement("stop", {
    offset: "55%",
    stopColor: "#22A35B"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#0B6B3A"
  }))), React.createElement("path", {
    d: trunk,
    fill: "url(#suFlowG)"
  }), seg.map(s => (s.r.kind === "loss" || s.r.kind === "gain") && Math.abs(s.wA - s.wB) > 0.2 ? React.createElement("line", {
    key: "t" + s.r.k,
    x1: X0,
    y1: (s.y0 + s.y1) / 2,
    x2: X0 + Math.min(s.wA, s.wB),
    y2: (s.y0 + s.y1) / 2,
    stroke: "#fff",
    strokeWidth: "1",
    opacity: ".28"
  }) : null), seg.map(s => {
    const R = s.r,
      yc = (s.y0 + s.y1) / 2;
    const heavy = R.kind === "loss" && R.pct >= 3;
    const zero = R.kind === "loss" && R.loss <= 0;
    if (R.kind === "loss" || R.kind === "gain") {
      const gain = R.kind === "gain";
      const col = gain ? "#2563EB" : heavy ? "var(--tint-red-tx2)" : "#EFA53A";
      const th = Math.max(3.6, Math.abs(s.wA - s.wB));
      const inner = X0 + Math.min(s.wA, s.wB);
      const yA = yc - th / 2,
        yB = yc + th / 2;
      const HEAD = 9,
        FLARE = 3.4;
      const ribbon = zero ? null : gain ? "M" + XL + " " + yA + " L" + (inner + HEAD) + " " + yA + " L" + (inner + HEAD) + " " + (yA - FLARE) + " L" + inner + " " + yc + " L" + (inner + HEAD) + " " + (yB + FLARE) + " L" + (inner + HEAD) + " " + yB + " L" + XL + " " + yB + " Z" : "M" + inner + " " + yA + " L" + (XL - HEAD) + " " + yA + " L" + (XL - HEAD) + " " + (yA - FLARE) + " L" + XL + " " + yc + " L" + (XL - HEAD) + " " + (yB + FLARE) + " L" + (XL - HEAD) + " " + yB + " L" + inner + " " + yB + " Z";
      return React.createElement("g", {
        key: R.k
      }, ribbon ? React.createElement("path", {
        d: ribbon,
        fill: col,
        opacity: gain ? 0.78 : heavy ? 0.92 : 0.85
      }) : React.createElement("line", {
        x1: X0 + s.wA,
        y1: yc,
        x2: XL,
        y2: yc,
        stroke: "var(--ln2)",
        strokeWidth: "1",
        strokeDasharray: "2 4"
      }), React.createElement("text", {
        x: LX,
        y: yc - 9,
        fontSize: "10",
        fontWeight: "700",
        fill: zero ? "var(--text-3)" : "var(--text-2)"
      }, cut(R.label, 66)), React.createElement("text", {
        x: LX,
        y: yc + 3,
        fontSize: "9.5",
        fontWeight: "800",
        fill: zero ? "var(--text-3)" : gain ? "#1D4ED8" : heavy ? "var(--tint-red-tx)" : "var(--tint-amber-tx)"
      }, gain ? "+" + R.pct + "%  ·  " + R.gain.toLocaleString() + " kWh" : zero ? "ไม่เสียพลังงานในด่านนี้" : "−" + R.pct + "%  ·  " + R.loss.toLocaleString() + " kWh", R.unit ? React.createElement("tspan", {
        fill: "var(--text-3)",
        fontWeight: "700"
      }, "   → " + R.unit) : null), R.note && React.createElement("text", {
        x: LX,
        y: yc + 14,
        fontSize: "8.5",
        fontWeight: "600",
        fill: "var(--text-3)"
      }, cut(R.note, 70)));
    }
    const big = R.kind === "end",
      first = R.kind === "start";
    const accent = big ? "var(--acd)" : first ? "var(--tint-amber-tx)" : "var(--ln2)";
    return React.createElement("g", {
      key: R.k
    }, React.createElement("line", {
      x1: X0,
      y1: s.y1,
      x2: XL + 4,
      y2: s.y1,
      stroke: big ? "var(--acd)" : "var(--ln2)",
      strokeWidth: big ? 1.4 : 1,
      strokeDasharray: big ? null : "3 4",
      opacity: big ? 0.7 : 1
    }), React.createElement("rect", {
      x: LX - 9,
      y: s.y1 - 32,
      width: "3",
      height: "30",
      rx: "1.5",
      fill: accent,
      opacity: big || first ? 1 : 0.5
    }), React.createElement("text", {
      x: LX,
      y: s.y1 - 23,
      fontSize: "10.5",
      fontWeight: "800",
      fill: "var(--text-1)"
    }, cut(R.label, 60)), React.createElement("text", {
      x: LX,
      y: s.y1 - 11,
      fontSize: "9.5",
      fontWeight: "800",
      fill: big ? "var(--acd)" : first ? "var(--tint-amber-tx)" : "var(--text-2)"
    }, R.kwh.toLocaleString(), " kWh", R.unit ? React.createElement("tspan", {
      fill: "var(--text-3)",
      fontWeight: "700"
    }, "   ·   " + R.unit) : null, big ? React.createElement("tspan", {
      fill: "var(--acd)",
      fontWeight: "800"
    }, "   ·   PR " + R.pct + "%") : null), R.note && React.createElement("text", {
      x: LX,
      y: s.y1 - 1,
      fontSize: "8.5",
      fontWeight: "600",
      fill: "var(--text-3)"
    }, cut(R.note, 70)));
  }));
}
function SuEnviron({
  env,
  years
}) {
  if (!env) return null;
  const tiles = [{
    ic: "tree",
    v: env.trees.toLocaleString(),
    u: "ต้น",
    lb: "เท่ากับปลูกไม้ยืนต้น",
    sub: "ดูดซับ 9.5 kgCO₂/ต้น/ปี"
  }, {
    ic: "map",
    v: env.carKm.toLocaleString(),
    u: "กม.",
    lb: "เท่ากับไม่ขับรถยนต์",
    sub: "0.12 kgCO₂/กม."
  }, {
    ic: "coin",
    v: env.petrol.toLocaleString(),
    u: "ลิตร",
    lb: "เท่ากับน้ำมันเบนซิน",
    sub: "2.31 kgCO₂/ลิตร"
  }, {
    ic: "sun",
    v: env.homes.toLocaleString(),
    u: "หลัง",
    lb: "เท่ากับไฟบ้านทั้งปี",
    sub: "ครัวเรือนไทย ~200 หน่วย/เดือน"
  }];
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "su-env"
  }, React.createElement("div", {
    className: "hero"
  }, React.createElement("span", {
    className: "eb"
  }, "\u0E25\u0E14\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E1B\u0E35\u0E25\u0E30"), React.createElement("span", {
    className: "big"
  }, env.co2YearT.toLocaleString(), React.createElement("small", null, "tCO\u2082e")), React.createElement("span", {
    className: "sub"
  }, "\u0E15\u0E25\u0E2D\u0E14 ", years, " \u0E1B\u0E35 \u0E23\u0E27\u0E21 ", React.createElement("b", null, env.co2LifeT.toLocaleString(), " tCO\u2082e"), " \xB7 \u0E04\u0E34\u0E14\u0E17\u0E35\u0E48 ", env.ef, " kgCO\u2082e \u0E15\u0E48\u0E2D\u0E44\u0E1F\u0E1F\u0E49\u0E32 1 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E08\u0E32\u0E01\u0E2A\u0E32\u0E22\u0E2A\u0E48\u0E07 (\u0E2D\u0E1A\u0E01.)")), React.createElement("div", {
    className: "tiles"
  }, tiles.map(t => React.createElement("div", {
    key: t.lb,
    className: "tile"
  }, React.createElement(P3Icon, {
    name: t.ic,
    size: 13
  }), React.createElement("span", {
    className: "v"
  }, t.v, React.createElement("small", null, t.u)), React.createElement("span", {
    className: "lb"
  }, t.lb), React.createElement("span", {
    className: "sb"
  }, t.sub))))), env.carbonPayback != null && React.createElement("div", {
    className: "su-env-pb"
  }, React.createElement("span", {
    className: "l"
  }, "\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19\u0E17\u0E32\u0E07\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19"), React.createElement("span", {
    className: "bar"
  }, React.createElement("span", {
    style: {
      width: scClamp(env.carbonPayback / Math.max(1, years) * 100, 1, 100) + "%"
    }
  })), React.createElement("span", {
    className: "r"
  }, React.createElement("b", null, env.carbonPayback), " \u0E1B\u0E35")));
}
function SuLightBar({
  irr
}) {
  const parts = [{
    k: "beam",
    v: irr.beam,
    c: "#F59E0B",
    lb: "ลำแสงตรง"
  }, {
    k: "diff",
    v: irr.diff,
    c: "#60A5FA",
    lb: "แสงฟุ้งจากฟ้า"
  }, {
    k: "refl",
    v: irr.refl,
    c: "#A78BFA",
    lb: "สะท้อนจากพื้น"
  }];
  const tot = Math.max(1, irr.poa);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      height: 26,
      borderRadius: 8,
      overflow: "hidden",
      background: "var(--surface3)"
    }
  }, parts.map(p => p.v > 0 && React.createElement("div", {
    key: p.k,
    title: p.lb + " " + p.v + " W/m²",
    style: {
      width: p.v / tot * 100 + "%",
      background: p.c,
      display: "grid",
      placeItems: "center",
      fontSize: 9.5,
      fontWeight: 800,
      color: "#fff",
      minWidth: 0,
      overflow: "hidden"
    }
  }, p.v / tot > 0.12 ? p.v : "")), irr.shadeLoss > 0 && React.createElement("div", {
    title: "เงาบังไป " + irr.shadeLoss + " W/m²",
    style: {
      width: irr.shadeLoss / tot * 100 + "%",
      background: "repeating-linear-gradient(45deg,#64748B,#64748B 3px,#475569 3px,#475569 6px)",
      display: "grid",
      placeItems: "center",
      fontSize: 9.5,
      fontWeight: 800,
      color: "#fff"
    }
  }, "\u0E40\u0E07\u0E32")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 13,
      flexWrap: "wrap",
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, parts.map(p => React.createElement("span", {
    key: p.k
  }, React.createElement("b", {
    style: {
      color: p.c
    }
  }, "\u25A0"), " ", p.lb, " ", p.v)), irr.shadeLoss > 0 && React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#475569"
    }
  }, "\u25A0"), " \u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07 \u2212", irr.shadeLoss)));
}
function SuThermo({
  temp
}) {
  const stops = [{
    v: temp.tAmb,
    lb: "อากาศ",
    c: "#60A5FA"
  }, {
    v: temp.tBack,
    lb: "หลังแผง",
    c: "#F59E0B"
  }, {
    v: temp.tCell,
    lb: "เซลล์",
    c: "var(--tint-red-tx2)"
  }];
  const lo = 20,
    hi = Math.max(80, temp.tCell + 6);
  const px = v => scClamp((v - lo) / (hi - lo) * 100, 0, 100);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      height: 12,
      borderRadius: 99,
      background: "linear-gradient(90deg,#93C5FD,#FCD34D,#F87171)"
    }
  }, stops.map(s => React.createElement("span", {
    key: s.lb,
    title: s.lb + " " + s.v + " °C",
    style: {
      position: "absolute",
      left: px(s.v) + "%",
      top: -3,
      transform: "translateX(-50%)",
      width: 4,
      height: 18,
      borderRadius: 99,
      background: "#fff",
      boxShadow: "0 0 0 1.5px " + s.c
    }
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap"
    }
  }, stops.map(s => React.createElement("span", {
    key: s.lb,
    className: "p3-stat"
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: s.c,
      display: "inline-block"
    }
  }), s.lb, " ", React.createElement("b", null, s.v, "\xB0C"))), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: temp.rise > 30 ? "var(--tint-amber-tx)" : undefined
    }
  }, "\u0E23\u0E49\u0E2D\u0E19\u0E01\u0E27\u0E48\u0E32\u0E2D\u0E32\u0E01\u0E32\u0E28 ", React.createElement("b", null, "+", temp.rise, "\xB0C"))));
}
const SU_FLOW = {
  direct: {
    c: "#22A35B",
    label: "ใช้ตรง ๆ ตอนนั้น"
  },
  chg: {
    c: "#2563EB",
    label: "เก็บเข้าแบต"
  },
  dis: {
    c: "#6366F1",
    label: "จ่ายออกจากแบต"
  },
  exp: {
    c: "#EFA53A",
    label: "ขายคืนการไฟฟ้า"
  },
  curt: {
    c: "var(--tint-red-tx2)",
    label: "ตัดทิ้ง (ห้ามไหลย้อน)"
  },
  imp: {
    c: "#94A3B8",
    label: "ซื้อจากการไฟฟ้า"
  }
};
function SuFlowDay({
  rows,
  mode,
  on,
  height
}) {
  const keys = mode === "load" ? ["direct", "dis", "imp"] : ["direct", "chg", "exp", "curt"];
  const W = 620,
    H = height || 152,
    L = 30,
    R = on && mode === "pv" ? 30 : 8,
    T = 12,
    B = 18;
  const top = Math.max(0.02, rows.reduce((a, r) => Math.max(a, keys.reduce((s, k) => s + (r[k] || 0), 0)), 0));
  const X = h => L + (h + 0.5) / 24 * (W - L - R);
  const bw = (W - L - R) / 24 * 0.76;
  const Y = v => T + (1 - v / top) * (H - T - B);
  const socPts = rows.map(r => X(r.h) + "," + (T + (1 - scClamp(r.soc, 0, 100) / 100) * (H - T - B))).join(" ");
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, [0, 0.5, 1].map(f => React.createElement("g", {
    key: f
  }, React.createElement("line", {
    x1: L,
    y1: Y(top * f),
    x2: W - R,
    y2: Y(top * f),
    stroke: "var(--ln)",
    strokeWidth: "1"
  }), React.createElement("text", {
    x: L - 4,
    y: Y(top * f) + 3,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, scR(top * f, 2)))), React.createElement("text", {
    x: 2,
    y: T - 3,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "kWh"), rows.map(r => {
    let acc = 0;
    return React.createElement("g", {
      key: r.h
    }, keys.map(k => {
      const v = r[k] || 0;
      if (v <= 0) return null;
      const y0 = Y(acc + v),
        h = Math.max(0.6, Y(acc) - Y(acc + v));
      acc += v;
      return React.createElement("rect", {
        key: k,
        x: X(r.h) - bw / 2,
        y: y0,
        width: bw,
        height: h,
        fill: SU_FLOW[k].c,
        opacity: k === "curt" ? 0.85 : 0.92
      }, React.createElement("title", null, r.h + ":00 · " + SU_FLOW[k].label + " " + scR(v, 2) + " kWh"));
    }));
  }), on && mode === "pv" && React.createElement("g", null, React.createElement("polyline", {
    points: socPts,
    fill: "none",
    stroke: "#0F172A",
    strokeWidth: "1.6",
    strokeDasharray: "5 3",
    opacity: ".65"
  }), React.createElement("text", {
    x: W - R + 4,
    y: T + 4,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "100%"), React.createElement("text", {
    x: W - R + 4,
    y: H - B + 3,
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "0%")), [0, 3, 6, 9, 12, 15, 18, 21].map(h => React.createElement("text", {
    key: h,
    x: X(h),
    y: H - 5,
    textAnchor: "middle",
    fontSize: "8.5",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, h)), React.createElement("text", {
    x: W - R,
    y: H - 5,
    textAnchor: "end",
    fontSize: "8",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "\u0E19."));
}
function SuPxx({
  px,
  mode
}) {
  const rows = mode === "one" ? px.one : px.avg;
  const sig = (mode === "one" ? px.sigma1 : px.sigmaN) / 100;
  const W = 620,
    H = 168,
    L = 8,
    R = 8,
    T = 14,
    B = 30;
  const p50 = px.p50 || 1,
    lo = p50 * (1 - 3.2 * sig),
    hi = p50 * (1 + 3.2 * sig);
  const X = v => L + (v - lo) / Math.max(1e-9, hi - lo) * (W - L - R);
  const Y = f => T + (1 - f) * (H - T - B);
  const N = 121,
    pts = [];
  for (let i = 0; i < N; i++) {
    const v = lo + (hi - lo) * i / (N - 1);
    const t = (v - p50) / Math.max(1e-9, p50 * sig);
    pts.push({
      x: X(v),
      y: Y(Math.exp(-0.5 * t * t)),
      v
    });
  }
  const p90 = (rows.find(r => r.p === 90) || rows[0]).kwh;
  const line = pts.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const under = pts.filter(p => p.v <= p90);
  const fill = under.length ? "M" + under[0].x.toFixed(1) + " " + Y(0) + " L" + under.map(p => p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" L") + " L" + under[under.length - 1].x.toFixed(1) + " " + Y(0) + " Z" : "";
  const marks = [{
    p: 50,
    v: p50,
    c: "#0B5F35"
  }, {
    p: 90,
    v: p90,
    c: "var(--tint-amber-tx)"
  }];
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, React.createElement("line", {
    x1: L,
    y1: Y(0),
    x2: W - R,
    y2: Y(0),
    stroke: "var(--ln2)",
    strokeWidth: "1.2"
  }), fill && React.createElement("path", {
    d: fill,
    fill: "var(--tint-amber-tx)",
    opacity: ".16"
  }), React.createElement("polyline", {
    points: line,
    fill: "none",
    stroke: "#0B5F35",
    strokeWidth: "2"
  }), marks.map(m => React.createElement("g", {
    key: m.p
  }, React.createElement("line", {
    x1: X(m.v),
    y1: Y(0),
    x2: X(m.v),
    y2: Y(m.p === 50 ? 1 : Math.exp(-0.5 * Math.pow((m.v - p50) / (p50 * sig), 2))),
    stroke: m.c,
    strokeWidth: "1.6",
    strokeDasharray: m.p === 50 ? "" : "4 3"
  }), React.createElement("text", {
    x: X(m.v),
    y: T - 4,
    textAnchor: "middle",
    fontSize: "10",
    fontWeight: "800",
    fill: m.c
  }, "P", m.p), React.createElement("text", {
    x: X(m.v),
    y: H - 16,
    textAnchor: "middle",
    fontSize: "10",
    fontWeight: "800",
    fill: m.c
  }, m.v.toLocaleString()))), React.createElement("text", {
    x: L,
    y: H - 3,
    fontSize: "8.5",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, "\u0E41\u0E22\u0E48\u0E01\u0E27\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E34\u0E14"), React.createElement("text", {
    x: W - R,
    y: H - 3,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, "\u0E14\u0E35\u0E01\u0E27\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E34\u0E14"), React.createElement("text", {
    x: X(p90),
    y: H - 3,
    textAnchor: "middle",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, "\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E15\u0E01\u0E25\u0E07\u0E21\u0E32\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E19\u0E35\u0E49 10%"));
}
function SuCash({
  roi
}) {
  const W = 620,
    H = 176,
    L = 4,
    B = 22,
    T = 10;
  const rows = roi.rows;
  const lo = Math.min(-roi.capex, 0),
    hi = Math.max(1, rows[rows.length - 1].cum);
  const X = i => L + i / Math.max(1, rows.length) * (W - L * 2);
  const Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const bw = (W - L * 2) / rows.length * 0.72;
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    style: {
      width: "100%",
      display: "block",
      overflow: "visible"
    }
  }, React.createElement("line", {
    x1: L,
    y1: Y(0),
    x2: W - L,
    y2: Y(0),
    stroke: "var(--ln2)",
    strokeWidth: "1.2"
  }), rows.map((r, i) => React.createElement("rect", {
    key: i,
    x: X(i),
    y: Math.min(Y(r.cum), Y(0)),
    width: bw,
    height: Math.max(1, Math.abs(Y(r.cum) - Y(0))),
    rx: "2",
    fill: r.cum >= 0 ? "#22A35B" : "#CBD5E1",
    opacity: r.cum >= 0 ? 0.9 : 0.85
  }, React.createElement("title", null, "ปี " + r.year + " · สะสม " + r.cum.toLocaleString() + " บาท"))), roi.payback != null && roi.payback <= rows.length && React.createElement("g", null, React.createElement("line", {
    x1: X(roi.payback),
    y1: T,
    x2: X(roi.payback),
    y2: H - B,
    stroke: "var(--tint-amber-tx)",
    strokeWidth: "1.6",
    strokeDasharray: "4 3"
  }), React.createElement("text", {
    x: X(roi.payback) + 5,
    y: T + 10,
    fontSize: "10",
    fontWeight: "800",
    fill: "var(--tint-amber-tx)"
  }, "\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19\u0E1B\u0E35\u0E17\u0E35\u0E48 ", roi.payback)), rows.map((r, i) => (i % 5 === 4 || i === 0) && React.createElement("text", {
    key: "t" + i,
    x: X(i) + bw / 2,
    y: H - 7,
    textAnchor: "middle",
    fontSize: "9",
    fontWeight: "700",
    fill: "var(--text-3)"
  }, r.year)), React.createElement("text", {
    x: W - L,
    y: H - 7,
    textAnchor: "end",
    fontSize: "8.5",
    fontWeight: "800",
    fill: "var(--text-3)"
  }, "\u0E1B\u0E35"));
}
function SolarWorkspace({
  job,
  st,
  sys,
  onChange,
  onClose,
  snap
}) {
  const [step, setStep] = React.useState(0);
  const [snapImg, setSnapImg] = React.useState(null);
  React.useEffect(() => {
    if (typeof snap === "function") {
      const u = snap();
      if (u) setSnapImg(u);
    }
  }, []);
  const S = sys || scBlankSys();
  const set = patch => onChange(Object.assign({}, S, patch));
  const B = window.BOQ || {};
  const stockPanels = B.PANELS || [],
    stockInv = B.INVERTERS || [],
    micros = B.MICRO || [];
  const panel = scPanelSpec(S),
    inv = scInvSpec(S);
  const stockPanel = stockPanels.find(p => p.model === S.panelModel) || {};
  const stockInvRow = stockInv.find(p => p.model === S.invModel) || {};
  const srcOf = (ov, stock, key) => ov && ov[key] != null ? "edit" : stock[key] != null && stock[key] !== 0 ? "stock" : "def";
  const setP = (k, v) => {
    const o = Object.assign({}, S.panel);
    if (v == null) delete o[k];else o[k] = v;
    set({
      panel: o
    });
  };
  const setI = (k, v) => {
    const o = Object.assign({}, S.inv);
    if (v == null) delete o[k];else o[k] = v;
    set({
      inv: o
    });
  };
  const idx = React.useMemo(() => scPanelIndex(st), [st]);
  const groups = idx.groups;
  const foot = React.useMemo(() => typeof p3FootAll === "function" ? p3FootAll(st) : {
    panels: [],
    outlines: [],
    bounds: {
      minX: -5,
      maxX: 5,
      minZ: -5,
      maxZ: 5
    }
  }, [st]);
  const totalPanels = groups.reduce((a, g) => a + g.count, 0);
  const isMicro = S.mode === "micro";
  const [activeStr, setActiveStr] = React.useState(1);
  const range = React.useMemo(() => panel.voc && inv.mpptVmin ? scSeriesRange(panel, inv, S.env) : null, [panel.voc, panel.vmp, panel.tcVoc, inv.mpptVmin, inv.mpptVmax, inv.maxVdc, S.env]);
  const isManual = !!S.manual;
  const autoSeed = React.useMemo(() => !isMicro && panel.voc && inv.mpptVmin && foot.panels.length ? scAutoAssign(foot.panels, idx.byPanel, groups, panel, inv, S.env, {
    invCount: S.invCount
  }) : {}, [isMicro, foot, idx, groups, panel, inv, S.env, S.invCount]);
  const effAssign = isManual ? S.assign || {} : autoSeed;
  const plan = React.useMemo(() => !isMicro && panel.voc ? scStringsFromAssign(effAssign, idx.byPanel, groups, panel, inv, S.env, {
    invCount: S.invCount,
    totalPanels,
    mpptPick: S.mpptPick
  }) : null, [isMicro, effAssign, idx, groups, panel, inv, S.env, S.invCount, totalPanels, S.mpptPick]);
  const pickMppt = (sid, slot) => {
    const next = Object.assign({}, S.mpptPick || {});
    if (slot == null) delete next[sid];else next[sid] = slot;
    set({
      mpptPick: next
    });
  };
  const doAuto = () => set({
    assign: autoSeed,
    manual: true
  });
  const paint = uid => {
    const a = Object.assign({}, effAssign);
    if (!activeStr) delete a[uid];else a[uid] = activeStr;
    set({
      assign: a,
      manual: true
    });
  };
  const strIds = plan && plan.strings ? plan.strings.map(s => s.id || 0).filter(Boolean) : [];
  const nextStr = (strIds.length ? Math.max.apply(null, strIds) : 0) + 1;
  const microPlans = React.useMemo(() => isMicro ? scMicroPlan(groups, panel, micros, S.env, S) : null, [isMicro, groups, panel, micros, S.env, S.microRatio, S.micro]);
  const stockMicroRow = micros.find(m => m.ratio === S.microRatio) || micros[0] || {};
  const setM = (k, v) => {
    const o = Object.assign({}, S.micro);
    if (v == null) delete o[k];else o[k] = v;
    set({
      micro: o
    });
  };
  const microSel = microPlans ? microPlans.find(m => m.ratio === S.microRatio) || microPlans[0] : null;
  const microAuto = React.useMemo(() => isMicro && microSel && foot.panels.length ? scMicroAssign(foot.panels, idx.byPanel, groups, microSel.per) : {
    assign: {},
    units: []
  }, [isMicro, foot, idx, groups, microSel && microSel.per]);
  const microManual = !!S.microManual;
  const microAssign = microManual ? S.microAssign || {} : microAuto.assign;
  const microUnits = React.useMemo(() => {
    if (!isMicro || !microSel) return [];
    const bag = {};
    foot.panels.forEach(p => {
      const id = microAssign[p.uid];
      if (!id) return;
      if (!bag[id]) bag[id] = {
        id,
        uids: [],
        gks: {}
      };
      bag[id].uids.push(p.uid);
      const gk = idx.byPanel[p.uid];
      if (gk) bag[id].gks[gk] = (bag[id].gks[gk] || 0) + 1;
    });
    return Object.keys(bag).map(k => {
      const u = bag[k],
        gks = Object.keys(u.gks);
      const g = groups.find(x => x.key === gks[0]);
      return {
        id: +k,
        n: u.uids.length,
        uids: u.uids,
        gLabel: g ? g.label : "—",
        mixed: gks.length > 1,
        over: u.uids.length > microSel.per
      };
    }).sort((a, b) => a.id - b.id);
  }, [isMicro, microAssign, foot, idx, groups, microSel && microSel.per]);
  const microUnassigned = isMicro ? foot.panels.filter(p => !microAssign[p.uid]).length : 0;
  const jobPhase = String(job && job.phase) === "3" ? 3 : 1;
  const phases = S.phases == null ? jobPhase : scNum(S.phases, 1) === 3 ? 3 : 1;
  const phaseBins = React.useMemo(() => isMicro && microSel && typeof scMicroPhases === "function" ? scMicroPhases(microUnits, {
    phases,
    wp: panel.wp,
    acW: microSel.acW,
    acV: microSel.acV,
    perBranch: microSel.perBranch,
    override: S.microPhase || {}
  }) : [], [isMicro, microUnits, phases, panel.wp, microSel, S.microPhase]);
  const phaseBal = React.useMemo(() => typeof scPhaseBalance === "function" ? scPhaseBalance(phaseBins, 10) : null, [phaseBins]);
  const setUnitPhase = (uid, ph) => {
    const o = Object.assign({}, S.microPhase || {});
    if (!ph) delete o[uid];else o[uid] = ph;
    set({
      microPhase: o
    });
  };
  const uidPhase = React.useMemo(() => {
    const m = {};
    if (phases !== 3) return m;
    phaseBins.forEach(b => b.units.forEach(u => (u.uids || []).forEach(x => {
      m[x] = b.label;
    })));
    return m;
  }, [phases, phaseBins]);
  const SU_PHCOLOR = {
    L1: "#D97706",
    L2: "#2563EB",
    L3: "#0F7A43"
  };
  const [muColorBy, setMuColorBy] = React.useState("unit");
  const [activeMu, setActiveMu] = React.useState(1);
  const nextMu = (microUnits.length ? Math.max.apply(null, microUnits.map(u => u.id)) : 0) + 1;
  const paintMu = uid => {
    const a = Object.assign({}, microAssign);
    if (!activeMu) delete a[uid];else a[uid] = activeMu;
    set({
      microAssign: a,
      microManual: true
    });
  };
  const acKw = isMicro ? microSel ? microSel.acKw : 0 : scR(scNum(inv.kw) * Math.max(1, scNum(S.invCount, 1)), 2);
  const dcKwAll = totalPanels * scNum(panel.wp) / 1000;
  const invSuggest = Math.max(1, Math.ceil(dcKwAll / Math.max(0.1, scNum(inv.maxPv) || scNum(inv.kw) * 1.3)));
  const use3d = !(S.shadeOff === true);
  const hc = scHalfCut(panel);
  const microIndep = isMicro && microSel ? microSel.nSeries <= 1 : false;
  const elecCfg = Object.assign({}, IV_ELEC, {
    halfCut: hc.half
  }, S.elec || {});
  const setElec = p => set({
    elec: Object.assign({}, elecCfg, p)
  });
  const shade3d = React.useMemo(() => use3d && typeof ivShadeAnnual === "function" && groups.length ? ivShadeAnnual(st, idx.byPanel, groups, {
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng,
    albedo: S.env && S.env.albedo,
    elec: elecCfg
  }) : null, [use3d, st, idx, groups, S.env, S.elec, hc.half]);
  const lossEff = React.useMemo(() => {
    const base = Object.assign({}, SC_LOSS, S.loss || {});
    if (microIndep && base.mismatch === SC_LOSS.mismatch) base.mismatch = 0.3;
    return base;
  }, [S.loss, microIndep]);
  const invEffUse = (S.inv && S.inv.effEuro) != null ? S.inv.effEuro : (S.inv && S.inv.eff) != null ? S.inv.eff : scNum(inv.effEuro) || inv.eff;
  const energy = React.useMemo(() => groups.length && panel.wp ? scEnergy(groups, panel, {
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng,
    loss: lossEff,
    shadeByGroup: shade3d ? shade3d.byGroup : null,
    invEff: isMicro ? microSel ? microSel.eff : 96.5 : invEffUse,
    mount: S.site && S.site.mount || "close",
    wind: (S.site && S.site.wind) != null ? S.site.wind : SC_WIND,
    acKw,
    tamb: S.tamb,
    kc: S.kc
  }) : null, [groups, panel, lossEff, S.inv, S.tamb, S.kc, acKw, isMicro, inv.eff, st.sun, shade3d, microSel && microSel.eff, S.site && S.site.mount, S.site && S.site.wind]);
  const life = energy ? scLife(energy.annual, panel, S.years) : null;
  const env = React.useMemo(() => energy && life && typeof scEnviron === "function" ? scEnviron(energy.annual, life.total, S.years, energy.dcKw, S.envf) : null, [energy, life, S.years, S.envf]);
  const loadCfg = Object.assign({}, SC_LOAD, S.load || {});
  const setLoad = p => set({
    load: Object.assign({}, loadCfg, p)
  });
  const battCfg = Object.assign({}, SC_BATT, S.batt || {});
  const setBatt = p => set({
    batt: Object.assign({}, battCfg, p)
  });
  const gridCfg = Object.assign({
    mode: "sell",
    expLimitKw: 0
  }, S.grid || {});
  const setGrid = p => set({
    grid: Object.assign({}, gridCfg, p)
  });
  const prof = React.useMemo(() => scLoadProfile(loadCfg), [S.load]);
  const battS = scBattSpec(battCfg);
  const dis = React.useMemo(() => energy && energy.hourly && prof.annual > 0 && typeof scDispatch === "function" ? scDispatch(energy.hourly, prof, battCfg, {
    zeroExport: gridCfg.mode === "zero",
    expLimitKw: gridCfg.mode === "limit" ? gridCfg.expLimitKw : 0
  }) : null, [energy, prof, S.batt, S.grid]);
  const [flowMon, setFlowMon] = React.useState(3);
  const uncCfg = Object.assign({}, SC_UNC, S.unc || {});
  const setUnc = p => set({
    unc: Object.assign({}, uncCfg, p)
  });
  const [pxMode, setPxMode] = React.useState("avg");
  const px = React.useMemo(() => energy && energy.annual && typeof scPxx === "function" ? scPxx(energy.annual, uncCfg, S.roi && S.roi.years || IV_ROI.years) : null, [energy, S.unc, S.roi]);
  const site = Object.assign({
    date: "",
    hour: null,
    wind: 1,
    mount: "close",
    tAmb: null,
    ghi: null,
    shade: 0,
    age: 0
  }, S.site || {});
  const siteDate = site.date || new Date().toISOString().slice(0, 10);
  const setSite = p => set({
    site: Object.assign({}, site, {
      date: siteDate
    }, p)
  });
  const meas = S.meas || {};
  const setMeas = (id, p) => set({
    meas: Object.assign({}, meas, {
      [id]: Object.assign({}, meas[id] || {}, p)
    })
  });
  const par = React.useMemo(() => typeof ivExtract === "function" ? ivExtract(panel) : null, [panel.voc, panel.isc, panel.vmp, panel.imp, panel.wp, panel.cells]);
  const ivUnits = React.useMemo(() => {
    if (isMicro) {
      const nS = microSel ? microSel.nSeries : 1;
      return microUnits.map(u => {
        const g = groups.find(x => x.key === idx.byPanel[u.uids[0]]) || groups[0] || {};
        return {
          id: "m:" + u.id,
          name: "ไมโคร " + u.id,
          sid: u.id,
          n: nS,
          tilt: g.tilt == null ? 0 : g.tilt,
          az: g.az == null ? 180 : g.az,
          gk: g.key,
          uids: u.uids,
          count: u.n,
          label: g.label,
          micro: true
        };
      });
    }
    return (plan && plan.strings ? plan.strings : []).map(s => ({
      id: "s:" + s.id,
      name: "สตริง " + s.id,
      sid: s.id,
      n: s.n,
      tilt: s.tilt == null ? 0 : s.tilt,
      az: s.az == null ? 180 : s.az,
      gk: s.groupKey,
      label: s.label
    }));
  }, [isMicro, groups, plan, microUnits, idx, microSel && microSel.nSeries]);
  const monthNow = new Date(siteDate + "T12:00:00").getMonth();
  const setMonth = m => setSite({
    date: (siteDate.slice(0, 4) || "2026") + "-" + String((m % 12 + 12) % 12 + 1).padStart(2, "0") + "-15"
  });
  const stepMonth = d => setMonth((isFinite(monthNow) ? monthNow : 6) + d);
  const sim = React.useMemo(() => typeof ivDaySim === "function" && groups.length && panel.wp ? ivDaySim(st, panel, groups, idx.byPanel, {
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng,
    date: siteDate,
    tAmb: site.tAmb,
    ghi: site.ghi,
    refHour: site.hour == null ? 12 : site.hour,
    albedo: S.env && S.env.albedo,
    elec: elecCfg,
    acKw,
    invEff: isMicro ? microSel ? microSel.eff : 96.5 : invEffUse,
    dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92
  }) : null, [st, panel, groups, idx, siteDate, site.tAmb, site.ghi, site.hour, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  const hourAuto = site.hour == null || site.hour === "";
  const simHour = hourAuto ? sim ? sim.bestHour : 12 : scNum(site.hour, 12);
  const [mapMode, setMapMode] = React.useState("light");
  const yearOpt = {
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng,
    year: +siteDate.slice(0, 4) || undefined,
    tAmb: site.tAmb,
    albedo: S.env && S.env.albedo,
    elec: elecCfg,
    acKw,
    invEff: isMicro ? microSel ? microSel.eff : 96.5 : invEffUse,
    dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92
  };
  const canYear = typeof ivYearSim === "function" && groups.length > 0 && panel.wp > 0;
  const year = React.useMemo(() => step >= 2 && canYear ? ivYearSim(st, panel, groups, idx.byPanel, yearOpt) : null, [step >= 2, st, panel, groups, idx, siteDate.slice(0, 4), site.tAmb, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  const sunPath = React.useMemo(() => typeof ivSunPath === "function" ? ivSunPath({
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng
  }) : null, [st.sun && st.sun.lat, st.sun && st.sun.lng]);
  const [isoOn, setIsoOn] = React.useState(true);
  const [isoShade, setIsoShade] = React.useState(null);
  React.useEffect(() => {
    if (!(step >= 2 && isoOn && typeof ivIsoShade === "function")) {
      setIsoShade(null);
      return;
    }
    let dead = false;
    const t = setTimeout(() => {
      const r = ivIsoShade(st, {});
      if (!dead) setIsoShade(r);
    }, 30);
    return () => {
      dead = true;
      clearTimeout(t);
    };
  }, [step >= 2, isoOn, st]);
  const simRow = sim ? sim.rows.reduce((a, r) => Math.abs(r.h - simHour) < Math.abs(a.h - simHour) ? r : a, sim.rows[0]) : null;
  const shadeAuto = site.shadeAuto !== false;
  const shadeUid = React.useMemo(() => typeof ivShadeMoment === "function" && groups.length ? ivShadeMoment(st, idx.byPanel, groups, {
    lat: st.sun && st.sun.lat,
    lng: st.sun && st.sun.lng,
    date: siteDate,
    hour: simHour
  }) : null, [st, idx, groups, siteDate, simHour]);
  const ivRows = React.useMemo(() => {
    if (!par) return [];
    return ivUnits.map(u => {
      const m = meas[u.id] || {};
      const uids = shadeUid && shadeUid.byUid ? isMicro ? u.uids || [] : foot.panels.filter(p => effAssign[p.uid] === u.sid).map(p => p.uid) : [];
      const fracs = uids.map(x => shadeUid.byUid[x] || 0);
      const el = fracs.length ? ivElecLoss(fracs, elecCfg) : null;
      const cell = simRow && u.gk != null ? simRow.per[u.gk] : null;
      const auto = shadeAuto ? isMicro ? el ? scR(el.elec * 100, 1) : cell ? cell.shade : null : cell ? cell.shade : null : null;
      const shade = m.shade != null && m.shade !== "" ? scNum(m.shade) : auto != null ? auto : scNum(site.shade, 0);
      const irr = ivIrradiance({
        lat: st.sun && st.sun.lat,
        lng: st.sun && st.sun.lng,
        date: siteDate,
        hour: simHour,
        tilt: u.tilt,
        az: u.az,
        ghi: site.ghi,
        shade,
        albedo: S.env && S.env.albedo
      });
      const tAmb = site.tAmb != null && site.tAmb !== "" ? scNum(site.tAmb) : SC_TAMB[isFinite(monthNow) ? monthNow : 6];
      const temp = ivCellTemp(irr.poaNet, tAmb, site.wind, site.mount);
      const a = ivAssess({
        panel,
        par,
        irr,
        temp,
        nSeries: u.n,
        nPar: 1,
        ageYears: site.age,
        meas: m
      });
      return {
        u,
        irr,
        temp,
        a,
        m,
        shade,
        shadeAuto: auto,
        fracs,
        el
      };
    });
  }, [par, ivUnits, meas, site.shade, site.tAmb, site.wind, site.mount, site.ghi, site.age, siteDate, panel, st.sun, monthNow, simRow, simHour, shadeAuto, shadeUid, foot, effAssign, isMicro, idx, S.elec]);
  const [ivSel, setIvSel] = React.useState(null);
  const [measOpen, setMeasOpen] = React.useState(false);
  const ivCur = ivSel == null ? null : ivRows.find(r => r.u.id === ivSel) || null;
  const ivMain = ivCur || ivRows[0] || null;
  const ivDone = ivRows.filter(r => r.a && r.a.hasMeas);
  const ivAvg = ivDone.length ? scR(ivDone.reduce((a, r) => a + (r.a.ratio || 0), 0) / ivDone.length, 1) : null;
  const ivOutliers = React.useMemo(() => {
    if (ivDone.length < 2) return [];
    const v = ivDone.map(r => r.a.ratio).sort((a, b) => a - b);
    const med = v[Math.floor(v.length / 2)];
    return ivDone.filter(r => r.a.ratio < med - 5).map(r => ({
      name: r.u.name,
      ratio: r.a.ratio,
      med
    }));
  }, [ivDone]);
  const [famMode, setFamMode] = React.useState("irr");
  const [famScope, setFamScope] = React.useState("mod");
  const famStrN = ivMain && ivMain.u ? ivMain.u.n : 1;
  const famN = famScope === "str" ? famStrN : 1;
  const ivFam = React.useMemo(() => typeof ivFamily === "function" && par ? ivFamily(par, panel, {
    mode: famMode,
    nSeries: famN,
    tc: 25,
    g: 1000
  }) : [], [par, panel, famMode, famN]);
  const roiCfg = Object.assign({}, IV_ROI, S.roi || {});
  const setRoi = p => set({
    roi: Object.assign({}, roiCfg, p)
  });
  const [roiP, setRoiP] = React.useState("p50");
  const battRepYear = dis && dis.on && dis.battLife ? Math.max(1, Math.round(dis.battLife)) : 0;
  const roiX = {
    split: dis ? {
      direct: dis.fDirect,
      dis: dis.fDis,
      exp: dis.fExp
    } : null,
    battCapex: dis && dis.on ? battS.capex : 0,
    battRepYear,
    battRepCost: dis && dis.on ? battS.capex : 0,
    battDegY: dis && dis.on ? scNum(battCfg.degY, 0) : 0,
    kYield: roiP === "p90" && px ? px.kP90 : 1
  };
  const roi = React.useMemo(() => energy && energy.annual ? ivRoi(energy.annual, panel, energy.dcKw, roiCfg, roiX) : null, [energy, panel, S.roi, dis, roiP, px, S.batt]);
  const ready = {
    equip: !!(panel.wp && (isMicro ? microSel : inv.model)),
    plan: !!(isMicro ? microSel : plan && plan.strings.length)
  };
  const steps = [{
    t: "อุปกรณ์",
    s: panel.model ? (panel.model.length > 26 ? panel.model.slice(0, 26) + "…" : panel.model) + (isMicro ? " · ไมโคร" : inv.model ? " · " + inv.model.slice(0, 18) : "") : "เลือกแผง + อินเวอร์เตอร์",
    ic: "layers"
  }, {
    t: isMicro ? "การต่อไมโคร" : "การต่อสตริง",
    s: isMicro ? microSel ? microSel.ratio + " · " + microSel.units + " ตัว" : "—" : plan && plan.strings.length ? plan.strings.length + " สตริง · " + plan.panels + " แผง" : "—",
    ic: "grid"
  }, {
    t: "แสง เงา & เส้น I-V",
    s: sim ? SC_MON[isFinite(monthNow) ? monthNow : 6] + " · " + sim.dayKwh + " kWh/วัน" + (sim.shadeLossPct > 0 ? " · เงา " + sim.shadeLossPct + "%" : "") : "จำลองรายเดือน",
    ic: "curve"
  }, {
    t: "ผลผลิต " + S.years + " ปี",
    s: energy ? energy.annual.toLocaleString() + " kWh/ปี" + (px ? " · P90 " + px.p90avg.toLocaleString() : "") : "—",
    ic: "sun"
  }, {
    t: "โหลด & แบตเตอรี่",
    s: dis ? "ใช้เอง " + dis.selfPct + "%" + (dis.on ? " · แบต " + battS.cap + " kWh" : "") + (dis.curtPct > 0 ? " · ตัดทิ้ง " + dis.curtPct + "%" : "") : "ยังไม่ได้กรอกยอดใช้ไฟ",
    ic: "bulb"
  }, {
    t: "คืนทุน & ROI",
    s: roi ? (roi.payback ? "คืนทุน " + roi.payback + " ปี" : "ยังไม่คืนทุนใน " + roi.years + " ปี") + (roi.irr != null ? " · IRR " + roi.irr + "%" : "") : "—",
    ic: "coin"
  }];
  const warns = [].concat(plan ? plan.warns : [], microSel ? microSel.warns : []);
  const [repOpen, setRepOpen] = React.useState(false);
  const repPick = React.useMemo(() => Object.assign(typeof rpPickAll === "function" ? rpPickAll() : {}, S.report || {}), [S.report]);
  const repToggle = k => set({
    report: Object.assign({}, repPick, {
      [k]: !repPick[k]
    })
  });
  const repPreset = only => {
    const all = typeof rpPickAll === "function" ? rpPickAll() : {};
    if (!only) {
      set({
        report: all
      });
      return;
    }
    const next = {};
    Object.keys(all).forEach(k => {
      next[k] = only.indexOf(k) >= 0;
    });
    set({
      report: next
    });
  };
  const repCount = (typeof RP_SECTIONS !== "undefined" ? RP_SECTIONS : []).filter(s => repPick[s.key]).length;
  const [repHtml, setRepHtml] = React.useState(null);
  const doReport = () => {
    if (typeof suReportHTML !== "function") {
      alert("ยังโหลดตัวสร้างรายงานไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง");
      return;
    }
    setRepOpen(false);
    const yearNow = year || (canYear ? ivYearSim(st, panel, groups, idx.byPanel, yearOpt) : null);
    const isoNow = isoShade || (typeof ivIsoShade === "function" && totalPanels ? ivIsoShade(st, {}) : null);
    const famG = par && typeof ivFamily === "function" ? ivFamily(par, panel, {
      mode: "irr",
      nSeries: 1,
      tc: 25
    }) : [];
    const famT = par && typeof ivFamily === "function" ? ivFamily(par, panel, {
      mode: "temp",
      nSeries: famStrN,
      g: 1000
    }) : [];
    setRepHtml(suReportHTML({
      job,
      sys: S,
      panel,
      inv,
      groups,
      plan,
      microSel,
      isMicro,
      energy,
      life,
      roi,
      roiCfg,
      env,
      sunPath,
      isoShade: isoNow,
      ivFamG: famG,
      ivFamT: famT,
      dis,
      prof,
      px,
      pxMode,
      battS,
      gridCfg,
      roiP,
      ivRows,
      ivDone,
      ivAvg,
      ivOutliers,
      site,
      siteDate,
      acKw,
      totalPanels,
      warns,
      foot,
      assign: isMicro ? microAssign : effAssign,
      microUnits,
      phases,
      phaseBins,
      phaseBal,
      uidPhase,
      shade3d,
      sim,
      simHour,
      year: yearNow,
      snapImg,
      pick: repPick
    }));
  };
  return React.createElement("div", {
    className: "p3 su"
  }, React.createElement("style", null, SU_CSS), React.createElement("div", {
    className: "p3-head",
    style: {
      padding: "11px 18px"
    }
  }, React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      background: "rgba(245,158,11,.14)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      color: "var(--tint-amber-tx)"
    }
  }, React.createElement(P3Icon, {
    name: "sun",
    size: 16
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".14em",
      color: "var(--text-3)",
      textTransform: "uppercase"
    }
  }, "\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32", job && job.code ? " · " + job.code : ""), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, job ? job.name : "")), React.createElement("button", {
    className: "ghost",
    onClick: onClose,
    title: "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07"
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    className: "su-body"
  }, React.createElement("div", {
    className: "su-rail"
  }, React.createElement("span", {
    className: "p3-eb",
    style: {
      padding: "0 8px 6px"
    }
  }, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19"), steps.map((s, i) => React.createElement("button", {
    key: i,
    className: "su-step",
    "data-on": step === i ? "1" : "0",
    "data-done": i < step ? "1" : "0",
    onClick: () => setStep(i)
  }, React.createElement("span", {
    className: "no"
  }, i < step ? "✓" : i + 1), React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    className: "tt",
    style: {
      display: "block"
    }
  }, s.t), React.createElement("span", {
    className: "sb",
    style: {
      display: "block"
    }
  }, s.s)))), React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 14
    }
  }, React.createElement("div", {
    className: "p3-card",
    style: {
      gap: 7,
      padding: "10px 11px"
    }
  }, React.createElement("span", {
    className: "p3-eb"
  }, "\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34"), React.createElement("span", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      color: "var(--text-1)",
      lineHeight: 1
    }
  }, totalPanels, " ", React.createElement("small", {
    style: {
      fontSize: 10,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E1C\u0E07")), React.createElement("span", {
    className: "p3-note"
  }, groups.length, " \u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07 \xB7 \u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E17\u0E34\u0E28/\u0E21\u0E38\u0E21\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E22\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E01\u0E31\u0E19")))), React.createElement("div", {
    className: "su-main"
  }, React.createElement("div", {
    className: "su-wrap"
  }, !totalPanels && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 \u2014 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E21\u0E32\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A"), step === 0 && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "su-pick"
  }, [["string", "สตริงอินเวอร์เตอร์", "แผงหลายแผงต่ออนุกรมเข้าตัวเดียว · ถูกกว่า ดูแลจุดเดียว แต่ทั้งสตริงต้องทิศ/มุมเดียวกัน และเงาบังแผงเดียวฉุดทั้งสตริง"], ["micro", "ไมโครอินเวอร์เตอร์", "แปลงไฟที่แผงเลย 1 หรือ 2 แผงต่อตัว · เงาบังแผงไหนเสียแค่แผงนั้น วางคนละทิศได้อิสระ แต่ราคาสูงกว่า"]].map(([k, h, d]) => React.createElement("button", {
    key: k,
    "data-on": S.mode === k ? "1" : "0",
    onClick: () => set({
      mode: k
    })
  }, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%"
    }
  }, React.createElement("svg", {
    width: "40",
    height: "22",
    viewBox: "0 0 40 22",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, k === "string" ? React.createElement(React.Fragment, null, React.createElement("rect", {
    x: "1",
    y: "3",
    width: "7",
    height: "6",
    rx: "1"
  }), React.createElement("rect", {
    x: "10",
    y: "3",
    width: "7",
    height: "6",
    rx: "1"
  }), React.createElement("rect", {
    x: "19",
    y: "3",
    width: "7",
    height: "6",
    rx: "1"
  }), React.createElement("path", {
    d: "M8 6h2M17 6h2M26 6h5v9h-8"
  }), React.createElement("rect", {
    x: "14",
    y: "13",
    width: "9",
    height: "7",
    rx: "1.5"
  })) : React.createElement(React.Fragment, null, React.createElement("rect", {
    x: "2",
    y: "2",
    width: "8",
    height: "6",
    rx: "1"
  }), React.createElement("rect", {
    x: "15",
    y: "2",
    width: "8",
    height: "6",
    rx: "1"
  }), React.createElement("rect", {
    x: "28",
    y: "2",
    width: "8",
    height: "6",
    rx: "1"
  }), React.createElement("path", {
    d: "M6 8v3M19 8v3M32 8v3"
  }), React.createElement("rect", {
    x: "2",
    y: "11",
    width: "8",
    height: "5",
    rx: "1.5"
  }), React.createElement("rect", {
    x: "15",
    y: "11",
    width: "8",
    height: "5",
    rx: "1.5"
  }), React.createElement("rect", {
    x: "28",
    y: "11",
    width: "8",
    height: "5",
    rx: "1.5"
  }), React.createElement("path", {
    d: "M6 16v2h26v-2"
  }))), React.createElement("span", {
    className: "h"
  }, h)), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "grid",
    size: 13
  }), "\u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E2A\u0E40\u0E1B\u0E04\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32")), React.createElement("select", {
    className: "p3-inp",
    value: S.panelModel || "",
    onChange: e => set({
      panelModel: e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07 \u2014"), (() => {
    const opt = p => React.createElement("option", {
      key: p.model,
      value: p.model
    }, p.model, " (", p.wp, "W)");
    const groups = [];
    stockPanels.forEach(p => {
      const g = String(p.group || "").trim();
      let e = groups.find(x => x.g === g);
      if (!e) groups.push(e = {
        g,
        list: []
      });
      e.list.push(p);
    });
    groups.sort((a, b) => (a.g ? 0 : 1) - (b.g ? 0 : 1));
    if (groups.length === 1 && !groups[0].g) return stockPanels.map(opt);
    return groups.map(x => x.g ? React.createElement("optgroup", {
      key: x.g,
      label: x.g
    }, x.list.map(opt)) : React.createElement("optgroup", {
      key: "_etc",
      label: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E08\u0E31\u0E14\u0E2B\u0E21\u0E27\u0E14\u0E22\u0E48\u0E2D\u0E22"
    }, x.list.map(opt)));
  })()), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32 @ STC", React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "1000 W/m\xB2 \xB7 \u0E40\u0E0B\u0E25\u0E25\u0E4C 25\xB0C \xB7 AM1.5"), React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 9
    }
  }, React.createElement(SuSpec, {
    label: "Pmax (STC)",
    value: panel.wp,
    step: 5,
    suffix: "W",
    src: srcOf(S.panel, stockPanel, "wp"),
    onChange: v => setP("wp", v),
    onReset: () => setP("wp", null)
  }), React.createElement(SuSpec, {
    label: "Voc (STC)",
    value: panel.voc,
    suffix: "V",
    src: srcOf(S.panel, stockPanel, "voc"),
    onChange: v => setP("voc", v),
    onReset: () => setP("voc", null)
  }), React.createElement(SuSpec, {
    label: "Isc (STC)",
    value: panel.isc,
    suffix: "A",
    src: srcOf(S.panel, stockPanel, "isc"),
    onChange: v => setP("isc", v),
    onReset: () => setP("isc", null)
  }), React.createElement(SuSpec, {
    label: "Vmp (STC)",
    value: panel.vmp,
    suffix: "V",
    src: srcOf(S.panel, stockPanel, "vmp"),
    onChange: v => setP("vmp", v),
    onReset: () => setP("vmp", null)
  }), React.createElement(SuSpec, {
    label: "Imp (STC)",
    value: panel.imp,
    suffix: "A",
    src: srcOf(S.panel, stockPanel, "imp"),
    onChange: v => setP("imp", v),
    onReset: () => setP("imp", null)
  })), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, "\u0E04\u0E48\u0E32\u0E15\u0E32\u0E21\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 & \u0E2D\u0E32\u0E22\u0E38\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 9
    }
  }, React.createElement(SuSpec, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Voc",
    value: panel.tcVoc,
    suffix: "%/\xB0C",
    src: srcOf(S.panel, stockPanel, "tcVoc"),
    onChange: v => setP("tcVoc", v),
    onReset: () => setP("tcVoc", null)
  }), React.createElement(SuSpec, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Isc",
    value: panel.tcIsc,
    suffix: "%/\xB0C",
    src: srcOf(S.panel, stockPanel, "tcIsc"),
    onChange: v => setP("tcIsc", v),
    onReset: () => setP("tcIsc", null)
  }), React.createElement(SuSpec, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Pmax",
    value: panel.tcPmax,
    suffix: "%/\xB0C",
    src: srcOf(S.panel, stockPanel, "tcPmax"),
    onChange: v => setP("tcPmax", v),
    onReset: () => setP("tcPmax", null)
  }), React.createElement(SuSpec, {
    label: "NOCT / NMOT",
    value: panel.noct,
    step: 1,
    suffix: "\xB0C",
    src: srcOf(S.panel, stockPanel, "noct"),
    onChange: v => setP("noct", v),
    onReset: () => setP("noct", null)
  }), React.createElement(SuSpec, {
    label: "\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E41\u0E23\u0E01",
    value: panel.deg1,
    step: 0.1,
    suffix: "%",
    src: srcOf(S.panel, stockPanel, "deg1"),
    onChange: v => setP("deg1", v),
    onReset: () => setP("deg1", null)
  }), React.createElement(SuSpec, {
    label: "\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E16\u0E31\u0E14\u0E44\u0E1B",
    value: panel.degY,
    step: 0.05,
    suffix: "%/\u0E1B\u0E35",
    src: srcOf(S.panel, stockPanel, "degY"),
    onChange: v => setP("degY", v),
    onReset: () => setP("degY", null)
  })), React.createElement("span", {
    className: "p3-note"
  }, "\u0E01\u0E23\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C ", React.createElement("b", null, "STC"), " \u0E43\u0E19\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E41\u0E1B\u0E25\u0E07\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E40\u0E2D\u0E07\u0E14\u0E49\u0E27\u0E22\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E41\u0E25\u0E30 NOCT \u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07 \xB7 \u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E25\u0E31\u0E07\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E08\u0E30\u0E40\u0E15\u0E34\u0E21\u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E01\u0E49\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49 \u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E07\u0E32\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E04\u0E25\u0E31\u0E07")), !isMicro ? React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "box",
    size: 13
  }), "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 9
    }
  }, React.createElement("select", {
    className: "p3-inp",
    style: {
      flex: 1
    },
    value: S.invModel || "",
    onChange: e => set({
      invModel: e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2014"), stockInv.map(p => React.createElement("option", {
    key: p.model,
    value: p.model
  }, p.model))), React.createElement("label", {
    className: "p3-f",
    style: {
      width: 108,
      flex: "0 0 auto"
    }
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      gap: 5
    }
  }, React.createElement("span", null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27"), inv.kw && S.invCount !== invSuggest ? React.createElement("button", {
    className: "p3-lnk",
    style: {
      marginLeft: "auto",
      fontSize: 9.5
    },
    title: "กำลังแผง " + scR(dcKwAll, 1) + " kWp ÷ " + (scNum(inv.maxPv) || scR(scNum(inv.kw) * 1.3, 1)) + " kW ต่อตัว",
    onClick: e => {
      e.preventDefault();
      set({
        invCount: invSuggest
      });
    }
  }, "\u0E43\u0E0A\u0E49 ", invSuggest) : null), React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "1",
    step: "1",
    value: S.invCount,
    onChange: e => set({
      invCount: Math.max(1, +e.target.value || 1)
    })
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 9
    }
  }, React.createElement(SuSpec, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07 AC",
    value: inv.kw,
    step: 0.1,
    suffix: "kW",
    src: srcOf(S.inv, stockInvRow, "kw"),
    onChange: v => setI("kw", v),
    onReset: () => setI("kw", null)
  }), React.createElement(SuSpec, {
    label: "MPPT \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14",
    value: inv.mpptVmin,
    step: 5,
    suffix: "V",
    src: srcOf(S.inv, stockInvRow, "mpptVmin"),
    onChange: v => setI("mpptVmin", v),
    onReset: () => setI("mpptVmin", null)
  }), React.createElement(SuSpec, {
    label: "MPPT \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    value: inv.mpptVmax,
    step: 5,
    suffix: "V",
    src: srcOf(S.inv, stockInvRow, "mpptVmax"),
    onChange: v => setI("mpptVmax", v),
    onReset: () => setI("mpptVmax", null)
  }), React.createElement(SuSpec, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 DC \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    value: inv.maxVdc,
    step: 10,
    suffix: "V",
    src: srcOf(S.inv, stockInvRow, "maxVdc"),
    onChange: v => setI("maxVdc", v),
    onReset: () => setI("maxVdc", null)
  }), React.createElement(SuSpec, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E17\u0E33\u0E07\u0E32\u0E19",
    value: inv.vStart,
    step: 10,
    suffix: "V",
    src: srcOf(S.inv, stockInvRow, "vStart"),
    onChange: v => setI("vStart", v),
    onReset: () => setI("vStart", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/\u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15",
    value: inv.maxInA,
    step: 0.5,
    suffix: "A",
    src: srcOf(S.inv, stockInvRow, "maxInA"),
    onChange: v => setI("maxInA", v),
    onReset: () => setI("maxInA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/MPPT",
    value: inv.maxMpptA,
    step: 0.5,
    suffix: "A",
    src: srcOf(S.inv, stockInvRow, "maxMpptA"),
    onChange: v => setI("maxMpptA", v),
    onReset: () => setI("maxMpptA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/MPPT",
    value: inv.maxIscA,
    step: 0.5,
    suffix: "A",
    src: srcOf(S.inv, stockInvRow, "maxIscA"),
    onChange: v => setI("maxIscA", v),
    onReset: () => setI("maxIscA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19 MPPT",
    value: inv.inputs,
    step: 1,
    suffix: "\u0E0A\u0E48\u0E2D\u0E07",
    src: srcOf(S.inv, stockInvRow, "inputs"),
    onChange: v => setI("inputs", v),
    onReset: () => setI("inputs", null)
  }), React.createElement(SuSpec, {
    label: "\u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15\u0E15\u0E48\u0E2D 1 MPPT",
    value: inv.strPerMppt,
    step: 1,
    suffix: "\u0E02\u0E31\u0E49\u0E27",
    src: srcOf(S.inv, stockInvRow, "strPerMppt"),
    onChange: v => setI("strPerMppt", v),
    onReset: () => setI("strPerMppt", null)
  }), React.createElement(SuSpec, {
    label: "\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E (\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15)",
    value: inv.effEuro || inv.eff,
    step: 0.1,
    suffix: "%",
    src: srcOf(S.inv, stockInvRow, inv.effEuro ? "effEuro" : "eff"),
    onChange: v => setI(inv.effEuro ? "effEuro" : "eff", v),
    onReset: () => setI(inv.effEuro ? "effEuro" : "eff", null)
  })), panel.imp && (() => {
    const per = scStringsPerMppt(panel, inv);
    const cur = scCurrent(panel, inv, per);
    const lay = scPinLayout(inv, S.invCount);
    const row = (lb, val, lim, tip) => React.createElement("span", {
      className: "p3-stat",
      title: tip,
      style: {
        color: lim && val > lim ? "var(--tint-red-tx)" : undefined
      }
    }, lb, " ", React.createElement("b", null, val, " A"), lim ? React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontWeight: 700
      }
    }, "\xA0/ ", lim, " A") : React.createElement("span", {
      style: {
        color: "var(--text-3)"
      }
    }, "\xA0/ \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38"));
    return React.createElement("div", {
      style: {
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        borderTop: "1px solid var(--ln)",
        paddingTop: 9
      }
    }, row("1 สตริง (Imp)", cur.impA, cur.limIn, "Imp ของแผง 1 สตริง เทียบกับกระแสสูงสุดของ 1 ขั้ว"), row("รวมใน 1 MPPT", cur.opA, cur.limOp, "ทุกสตริงที่ขนานเข้าช่อง MPPT เดียวกันรวมกัน เทียบกับกระแสสูงสุดต่อ MPPT"), row("ลัดวงจร (Isc×1.25)", cur.scA, cur.limSc, "Isc×1.25 ตามมาตรฐานการติดตั้ง เทียบกับพิกัดกระแสลัดวงจรของช่อง MPPT"), React.createElement("span", {
      className: "p3-stat",
      title: "ขั้วที่มี " + lay.phys + " ต่อ MPPT · ตัดลงถ้ากระแสขนานเกินพิกัด"
    }, "\u0E02\u0E19\u0E32\u0E19\u0E44\u0E14\u0E49 ", React.createElement("b", null, per), " \u0E2A\u0E15\u0E23\u0E34\u0E07/MPPT"), React.createElement("span", {
      className: "p3-stat",
      title: lay.mppt + " ช่อง MPPT × " + lay.phys + " ขั้ว"
    }, "\u0E02\u0E31\u0E49\u0E27\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A ", React.createElement("b", null, lay.pins)));
  })(), (!inv.mpptVmin || !inv.maxVdc) && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E48\u0E27\u0E07 MPPT / \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E44\u0E14\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E44\u0E1B\u0E40\u0E15\u0E34\u0E21\u0E16\u0E32\u0E27\u0E23\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \u203A \u0E2A\u0E40\u0E1B\u0E04\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C")) : React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "box",
    size: 13
  }), "\u0E44\u0E21\u0E42\u0E04\u0E23\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")), React.createElement("div", {
    className: "su-mgrid"
  }, (microPlans || []).map((m, i) => {
    const on = (S.microRatio || (microPlans[0] || {}).ratio) === m.ratio;
    return React.createElement("button", {
      key: m.ratio,
      className: "su-mcard",
      "data-on": on ? "1" : "0",
      "data-bad": m.ok ? "0" : "1",
      onClick: () => set({
        microRatio: m.ratio
      })
    }, React.createElement("span", {
      className: "rt"
    }, React.createElement(SuMicroGlyph, {
      per: m.per,
      mppt: m.nMppt,
      on: on
    }), React.createElement("b", null, "\u0E41\u0E1C\u0E07 ", m.per, " : \u0E44\u0E21\u0E42\u0E04\u0E23 1"), i === 0 && m.ok && React.createElement("span", {
      className: "tag"
    }, "\u0E41\u0E19\u0E30\u0E19\u0E33"), !m.ok && React.createElement("span", {
      className: "tag bad"
    }, "\u0E2A\u0E40\u0E1B\u0E04\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19")), React.createElement("span", {
      className: "mo"
    }, m.model), React.createElement("span", {
      className: "st"
    }, React.createElement("span", null, React.createElement("i", null, "\u0E43\u0E0A\u0E49"), React.createElement("b", null, m.units), " \u0E15\u0E31\u0E27"), React.createElement("span", null, React.createElement("i", null, "AC/\u0E15\u0E31\u0E27"), React.createElement("b", null, m.acW), " W"), React.createElement("span", null, React.createElement("i", null, "DC/AC"), React.createElement("b", null, m.dcAc)), React.createElement("span", null, React.createElement("i", null, "MPPT"), React.createElement("b", null, m.nMppt), " \u0E0A\u0E48\u0E2D\u0E07")), React.createElement("span", {
      className: "wy"
    }, m.why));
  })), microSel && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, "\u0E2A\u0E40\u0E1B\u0E04\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E48\u0E2D 1 \u0E15\u0E31\u0E27", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E41\u0E01\u0E49\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E33\u0E44\u0E27\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 9
    }
  }, React.createElement(SuSpec, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07 AC \u0E15\u0E48\u0E2D\u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07",
    value: microSel.spec.acW,
    step: 50,
    suffix: "W",
    src: srcOf(S.micro, stockMicroRow, "acW"),
    onChange: v => setM("acW", v),
    onReset: () => setM("acW", null)
  }), React.createElement(SuSpec, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 DC \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    value: microSel.spec.maxVdc,
    step: 5,
    suffix: "V",
    src: srcOf(S.micro, stockMicroRow, "maxVdc"),
    onChange: v => setM("maxVdc", v),
    onReset: () => setM("maxVdc", null)
  }), React.createElement(SuSpec, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19 MPPT",
    value: microSel.spec.mppt,
    step: 1,
    suffix: "\u0E0A\u0E48\u0E2D\u0E07",
    src: srcOf(S.micro, stockMicroRow, "mppt"),
    onChange: v => setM("mppt", v),
    onReset: () => setM("mppt", null)
  }), React.createElement(SuSpec, {
    label: "MPPT \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14",
    value: microSel.spec.mpptVmin,
    step: 1,
    suffix: "V",
    src: srcOf(S.micro, stockMicroRow, "mpptVmin"),
    onChange: v => setM("mpptVmin", v),
    onReset: () => setM("mpptVmin", null)
  }), React.createElement(SuSpec, {
    label: "MPPT \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    value: microSel.spec.mpptVmax,
    step: 1,
    suffix: "V",
    src: srcOf(S.micro, stockMicroRow, "mpptVmax"),
    onChange: v => setM("mpptVmax", v),
    onReset: () => setM("mpptVmax", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/\u0E0A\u0E48\u0E2D\u0E07",
    value: microSel.spec.maxInA,
    step: 0.5,
    suffix: "A",
    src: srcOf(S.micro, stockMicroRow, "maxInA"),
    onChange: v => setM("maxInA", v),
    onReset: () => setM("maxInA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/\u0E0A\u0E48\u0E2D\u0E07",
    value: microSel.spec.maxIscA,
    step: 0.5,
    suffix: "A",
    src: srcOf(S.micro, stockMicroRow, "maxIscA"),
    onChange: v => setM("maxIscA", v),
    onReset: () => setM("maxIscA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E23\u0E31\u0E1A\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14",
    value: microSel.spec.wpMin,
    step: 10,
    suffix: "W",
    src: srcOf(S.micro, stockMicroRow, "wpMin"),
    onChange: v => setM("wpMin", v),
    onReset: () => setM("wpMin", null)
  }), React.createElement(SuSpec, {
    label: "\u0E23\u0E31\u0E1A\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    value: microSel.spec.wpMax,
    step: 10,
    suffix: "W",
    src: srcOf(S.micro, stockMicroRow, "wpMax"),
    onChange: v => setM("wpMax", v),
    onReset: () => setM("wpMax", null)
  }), React.createElement(SuSpec, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 AC/\u0E15\u0E31\u0E27",
    value: microSel.spec.outA,
    step: 0.1,
    suffix: "A",
    src: srcOf(S.micro, stockMicroRow, "outA"),
    onChange: v => setM("outA", v),
    onReset: () => setM("outA", null)
  }), React.createElement(SuSpec, {
    label: "\u0E15\u0E48\u0E2D\u0E1E\u0E48\u0E27\u0E07\u0E44\u0E14\u0E49/\u0E27\u0E07\u0E08\u0E23",
    value: microSel.spec.perBranch,
    step: 1,
    suffix: "\u0E15\u0E31\u0E27",
    src: srcOf(S.micro, stockMicroRow, "perBranch"),
    onChange: v => setM("perBranch", v),
    onReset: () => setM("perBranch", null)
  }), React.createElement(SuSpec, {
    label: "\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E",
    value: microSel.spec.eff,
    step: 0.1,
    suffix: "%",
    src: srcOf(S.micro, stockMicroRow, "eff"),
    onChange: v => setM("eff", v),
    onReset: () => setM("eff", null)
  })), panel.imp && React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat",
    style: {
      color: microSel.cur.limOp && microSel.cur.opA > microSel.cur.limOp ? "var(--tint-red-tx)" : undefined
    }
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E17\u0E33\u0E07\u0E32\u0E19 (Imp) ", React.createElement("b", null, microSel.cur.opA, " A"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\xA0/ ", microSel.cur.limOp || "—", " A")), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: microSel.cur.limSc && microSel.cur.scA > microSel.cur.limSc ? "var(--tint-red-tx)" : undefined
    }
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23 (Isc\xD71.25) ", React.createElement("b", null, microSel.cur.scA, " A"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\xA0/ ", microSel.cur.limSc || "—", " A")), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D 1 MPPT ", React.createElement("b", null, microSel.nSeries), " \u0E43\u0E1A")), React.createElement("div", {
    className: "su-mfact"
  }, React.createElement("span", {
    className: "ic"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 14
  })), React.createElement("span", null, React.createElement("b", null, "\u0E17\u0E33\u0E44\u0E21\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E41\u0E25\u0E49\u0E27\u0E40\u0E2A\u0E35\u0E22\u0E41\u0E04\u0E48\u0E41\u0E1C\u0E07\u0E19\u0E31\u0E49\u0E19"), " \u2014 \u0E44\u0E21\u0E42\u0E04\u0E23\u0E15\u0E34\u0E14\u0E43\u0E15\u0E49\u0E41\u0E1C\u0E07\u0E41\u0E25\u0E30\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19 AC \u0E15\u0E23\u0E07\u0E08\u0E38\u0E14\u0E19\u0E31\u0E49\u0E19\u0E40\u0E25\u0E22 \u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49\u0E21\u0E35 MPPT ", React.createElement("b", null, microSel.nMppt, " \u0E0A\u0E48\u0E2D\u0E07\u0E2D\u0E34\u0E2A\u0E23\u0E30"), " \u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E07 ", React.createElement("b", null, microSel.per, " \u0E43\u0E1A"), " \u0E08\u0E36\u0E07\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A", React.createElement("b", null, " 1 \u0E0A\u0E48\u0E2D\u0E07 = ", microSel.nSeries, " \u0E41\u0E1C\u0E07"), " \u2014 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E1C\u0E07\u0E2B\u0E32\u0E08\u0E38\u0E14\u0E17\u0E33\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07 \u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E08\u0E36\u0E07\u0E15\u0E01\u0E04\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u0E44\u0E21\u0E48\u0E09\u0E38\u0E14\u0E43\u0E1A\u0E02\u0E49\u0E32\u0E07 \u0E46 \u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E17\u0E38\u0E01\u0E43\u0E1A\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19"))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E41\u0E1A\u0E1A 2:1 \u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E01\u0E27\u0E48\u0E32\u0E41\u0E15\u0E48\u0E41\u0E1C\u0E07\u0E04\u0E39\u0E48\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E34\u0E28/\u0E21\u0E38\u0E21\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E0A\u0E47\u0E04\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27\u0E08\u0E32\u0E01\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34 \u2014 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E44\u0E2B\u0E19\u0E41\u0E1C\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E25\u0E02\u0E04\u0E35\u0E48\u0E08\u0E30\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E44\u0E27\u0E49")), React.createElement("button", {
    className: "p3-b pri",
    style: {
      alignSelf: "flex-end",
      padding: "10px 20px"
    },
    onClick: () => setStep(1)
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 ", isMicro ? "การต่อไมโคร" : "การต่อสตริง", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  }))), step === 1 && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "roof",
    size: 13
  }), "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E08\u0E32\u0E01\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, groups.length, " \u0E01\u0E25\u0E38\u0E48\u0E21")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap"
    }
  }, groups.map(g => React.createElement("div", {
    key: g.key,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      border: "1px solid var(--ln)",
      borderRadius: 12,
      padding: "8px 12px 8px 8px",
      minWidth: 168
    }
  }, React.createElement(SuFacing, {
    tilt: g.tilt,
    az: g.az
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, g.count, " \u0E41\u0E1C\u0E07"), React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      lineHeight: 1.45
    }
  }, g.roofName, g.side ? " · " + g.side : ""), React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E2D\u0E35\u0E22\u0E07 ", g.tilt, "\xB0 \xB7 \u0E17\u0E34\u0E28 ", g.az, "\xB0")))))), !isMicro && range && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 13
  }), "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 (\u0E15\u0E48\u0E2D 1 \u0E2A\u0E15\u0E23\u0E34\u0E07)", React.createElement("span", {
    className: "ln"
  })), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -3
    }
  }, "\u0E41\u0E16\u0E1A\u0E04\u0E37\u0E2D\u0E0A\u0E48\u0E27\u0E07\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E15\u0E2D\u0E19", React.createElement("b", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E41\u0E1C\u0E07\u0E23\u0E49\u0E2D\u0E19\u0E08\u0E31\u0E14"), "\u0E16\u0E36\u0E07\u0E15\u0E2D\u0E19", React.createElement("b", {
    style: {
      color: "var(--acd)"
    }
  }, "\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19"), " \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E40\u0E02\u0E35\u0E22\u0E27 (\u0E0A\u0E48\u0E27\u0E07 MPPT) \u0E15\u0E25\u0E2D\u0E14 \u0E41\u0E25\u0E30\u0E02\u0E35\u0E14 Voc \u0E2B\u0E49\u0E32\u0E21\u0E40\u0E25\u0E22\u0E40\u0E2A\u0E49\u0E19\u0E41\u0E14\u0E07"), React.createElement(SuVoltBand, {
    rows: range.rows.filter(r => r.n >= Math.max(1, range.min - 2) && r.n <= range.max + 2),
    inv: inv,
    sel: S.series || range.best,
    onPick: n => set({
      series: n
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49 ", React.createElement("b", null, range.min, "\u2013", range.max), " \u0E41\u0E1C\u0E07/\u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E19\u0E30\u0E19\u0E33 ", React.createElement("b", null, range.best), " \u0E41\u0E1C\u0E07"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E15\u0E48\u0E2D MPPT ", React.createElement("b", null, scStringsPerMppt(panel, inv))))), !isMicro && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "plan",
    size: 13
  }), "\u0E1C\u0E31\u0E07\u0E41\u0E1C\u0E07 2 \u0E21\u0E34\u0E15\u0E34", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, isManual ? "แก้เอง" : "ระบบจัดให้")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, (plan && plan.strings ? plan.strings : []).map(s => React.createElement("button", {
    key: s.id,
    className: "p3-chip",
    "data-on": activeStr === s.id ? "1" : "0",
    onClick: () => setActiveStr(s.id),
    title: s.chk.ok ? "สตริง " + s.id + " · " + s.chk.band + " — กดแล้วแตะแผงในผังเพื่อย้ายเข้าสตริงนี้" : s.chk.fails.join(" · "),
    style: {
      borderColor: activeStr === s.id ? suColor(s.id) : "var(--ln2)",
      background: activeStr === s.id ? suColor(s.id) + "1E" : "var(--surface)",
      color: activeStr === s.id ? suColor(s.id) : "var(--text-2)"
    }
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: suColor(s.id),
      width: 9,
      height: 9
    }
  }), "\u0E2A\u0E15\u0E23\u0E34\u0E07 ", s.id, " \xB7 ", React.createElement("b", null, s.n), !s.chk.ok && React.createElement("span", {
    style: {
      color: "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, "!"), s.mixed && React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 800
    }
  }, "\u2307"))), React.createElement("button", {
    className: "p3-chip",
    onClick: () => setActiveStr(nextStr),
    "data-on": activeStr === nextStr ? "1" : "0",
    title: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E08\u0E30\u0E43\u0E2A\u0E48"
  }, React.createElement(P3Icon, {
    name: "plus",
    size: 12
  }), "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E21\u0E48"), React.createElement("button", {
    className: "p3-chip",
    onClick: () => setActiveStr(0),
    "data-on": activeStr === 0 ? "1" : "0",
    title: "\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07",
    style: {
      borderStyle: "dashed"
    }
  }, React.createElement(P3Icon, {
    name: "trash",
    size: 12
  }), "\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6
    }
  }, isManual && React.createElement("button", {
    className: "p3-b sm",
    onClick: () => set({
      assign: {},
      manual: false
    }),
    title: "\u0E17\u0E34\u0E49\u0E07\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E43\u0E2B\u0E49"
  }, React.createElement(P3Icon, {
    name: "reset",
    size: 13
  }), "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14"), !isManual && React.createElement("button", {
    className: "p3-b sm",
    onClick: doAuto,
    title: "\u0E22\u0E36\u0E14\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E23\u0E34\u0E48\u0E21\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07"
  }, React.createElement(P3Icon, {
    name: "check",
    size: 13
  }), "\u0E22\u0E36\u0E14\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07"))), React.createElement(SuLayout2D, {
    foot: foot,
    assign: effAssign,
    active: activeStr !== null,
    onPaint: paint
  }), React.createElement("span", {
    className: "p3-note"
  }, isManual ? "กำลังใช้ผังที่แก้เอง · เลือกสตริงด้านบนแล้วแตะหรือลากบนแผงเพื่อย้ายเข้าสตริงนั้น · แผงเทาประ = ยังไม่อยู่สตริงไหน" : "ระบบแบ่งสตริงให้แล้วตามที่เห็น — แตะหรือลากบนแผงได้เลยถ้าจะแก้ (แก้ครั้งแรกระบบจะยึดผังนี้เป็นของคุณทันที)", " · มองจากด้านบน ทิศเหนืออยู่บน")), !isMicro && plan && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "layers",
    size: 13
  }), "\u0E1C\u0E31\u0E07\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, plan.strings.length, " \u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 ", plan.panels, " \u0E41\u0E1C\u0E07")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "\u0E01\u0E25\u0E38\u0E48\u0E21"), React.createElement("th", null, "\u0E02\u0E31\u0E49\u0E27\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E35\u0E22\u0E1A \xB7 INV / MPPT / \u0E0A\u0E48\u0E2D\u0E07"), React.createElement("th", null, "Voc \u0E40\u0E22\u0E47\u0E19"), React.createElement("th", null, "\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19"), React.createElement("th", null, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), React.createElement("tbody", null, plan.strings.map((s, i) => React.createElement("tr", {
    key: i,
    "data-on": s.id && activeStr === s.id ? "1" : "0"
  }, React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: suColor(s.id || i + 1)
    }
  }), React.createElement("b", null, "#", s.id || i + 1))), React.createElement("td", null, React.createElement("b", null, s.n)), React.createElement("td", {
    style: {
      maxWidth: 190,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      color: s.mixed ? "var(--tint-amber-tx)" : undefined
    }
  }, s.label), React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("select", {
    className: "p3-inp su-slot",
    value: (S.mpptPick || {})[s.id] != null ? (S.mpptPick || {})[s.id] : "",
    onChange: e => pickMppt(s.id, e.target.value === "" ? null : +e.target.value),
    "data-pick": s.picked ? "1" : "0",
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E08\u0E30\u0E40\u0E2A\u0E35\u0E22\u0E1A\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E02\u0E31\u0E49\u0E27\u0E44\u0E2B\u0E19 \u2014 INV = \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48 \xB7 MPPT = \u0E0A\u0E48\u0E2D\u0E07 MPPT \xB7 \u0E0A\u0E48\u0E2D\u0E07 = \u0E02\u0E31\u0E49\u0E27\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E19\u0E31\u0E49\u0E19 \xB7 \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 = \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E25\u0E48\u0E25\u0E07\u0E02\u0E31\u0E49\u0E27\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07"
  }, React.createElement("option", {
    value: ""
  }, s.pin == null ? "— ไม่มีขั้วเหลือ —" : "อัตโนมัติ · " + s.addr), Array.from({
    length: plan.pins
  }).map((_, k) => {
    const own = (plan.owner || {})[k] || [];
    const mine = own.indexOf(s.id) >= 0;
    const busy = own.filter(x => x !== s.id);
    return React.createElement("option", {
      key: k,
      value: k
    }, scMpptName(k, inv, S.invCount) + (busy.length ? " · สตริง #" + busy.join(", #") : mine ? "" : " · ว่าง"));
  })), s.picked && React.createElement("span", {
    title: "\u0E1B\u0E31\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E2D\u0E07",
    style: {
      color: "var(--acd)",
      fontWeight: 800,
      fontSize: 11
    }
  }, "\u25CF"))), React.createElement("td", null, s.chk.vocCold, " V"), React.createElement("td", null, s.chk.vmpHot, "\u2013", s.chk.vmpCold, " V"), React.createElement("td", {
    style: {
      color: s.chk.ok ? "var(--acd)" : "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, s.chk.ok ? s.chk.band : "ไม่ผ่าน")))))), plan.fuse && React.createElement("div", {
    className: "su-alert " + (plan.fuse.need ? "warn" : ""),
    style: !plan.fuse.need ? {
      background: "var(--surface2)",
      borderLeftColor: "var(--ln2)"
    } : null
  }, React.createElement(P3Icon, {
    name: plan.fuse.need ? "height" : "check",
    size: 14
  }), plan.fuse.need ? React.createElement("span", null, React.createElement("b", null, "\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2A\u0E48\u0E1F\u0E34\u0E27\u0E2A\u0E4C\u0E2A\u0E15\u0E23\u0E34\u0E07 ", plan.fuse.count, " \u0E15\u0E31\u0E27", plan.fuse.amp ? " ขนาด " + plan.fuse.amp + " A" : ""), " (\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E23\u0E30\u0E1A\u0E2D\u0E01\u0E1F\u0E34\u0E27\u0E2A\u0E4C) \u2014 ", plan.fuse.why, plan.fuse.isc ? " · เลือกจาก Isc " + plan.fuse.isc + " A × 1.5" : "") : React.createElement("span", null, "\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E1F\u0E34\u0E27\u0E2A\u0E4C\u0E2A\u0E15\u0E23\u0E34\u0E07 \u2014 ", plan.fuse.why)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "DC ", React.createElement("b", null, plan.dcKw), " kWp"), React.createElement("span", {
    className: "p3-stat"
  }, "AC ", React.createElement("b", null, plan.acKw), " kW"), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: plan.dcAc > 1.4 || plan.dcAc < 0.85 ? "var(--tint-amber-tx)" : undefined
    }
  }, "DC/AC ", React.createElement("b", null, plan.dcAc)))), isMicro && microSel && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "layers",
    size: 13
  }), "\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E44\u0E21\u0E42\u0E04\u0E23", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, microSel.model)), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "\u0E44\u0E21\u0E42\u0E04\u0E23"), React.createElement("th", null, "\u0E0A\u0E48\u0E2D\u0E07 MPPT"), React.createElement("th", null, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"))), React.createElement("tbody", null, groups.map(g => {
    const u = Math.ceil(g.count / microSel.per),
      odd = microSel.per > 1 && g.count % microSel.per;
    return React.createElement("tr", {
      key: g.key
    }, React.createElement("td", {
      style: {
        maxWidth: 210
      }
    }, g.label), React.createElement("td", null, React.createElement("b", null, g.count)), React.createElement("td", null, React.createElement("b", null, u), " \u0E15\u0E31\u0E27"), React.createElement("td", null, u * microSel.nMppt, " \u0E0A\u0E48\u0E2D\u0E07"), React.createElement("td", {
      style: {
        color: odd ? "var(--tint-amber-tx)" : "var(--text-3)"
      }
    }, odd ? "เหลือแผงเดี่ยว 1 แผง (ตัวสุดท้ายใช้ช่องเดียว)" : "ลงตัวพอดี"));
  })))), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E40\u0E1B\u0E04\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E15\u0E48\u0E2D 1 \u0E0A\u0E48\u0E2D\u0E07 MPPT", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, microSel.nSeries, " \u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08"), React.createElement("th", null, "\u0E44\u0E14\u0E49"), React.createElement("th", null, "\u0E1E\u0E34\u0E01\u0E31\u0E14"), React.createElement("th", null, "\u0E1C\u0E25"))), React.createElement("tbody", null, microSel.chk.checks.map(c => React.createElement("tr", {
    key: c.k
  }, React.createElement("td", null, c.k === "voc" ? "Voc ตอนอากาศเย็น " + scNum((S.env || {}).tMin, 15) + "°C" : c.k === "hot" ? "Vmp ตอนแผงร้อน " + scNum((S.env || {}).tCellHot, 65) + "°C" : "Vmp ตอนอากาศเย็น"), React.createElement("td", null, React.createElement("b", null, scR(c.v, 1)), " V"), React.createElement("td", null, c.k === "hot" ? "≥ " : "≤ ", c.lim, " V"), React.createElement("td", {
    style: {
      color: c.ok ? "#12794A" : "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, c.ok ? "ผ่าน" : "ไม่ผ่าน"))), React.createElement("tr", null, React.createElement("td", null, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E17\u0E33\u0E07\u0E32\u0E19 Imp"), React.createElement("td", null, React.createElement("b", null, microSel.cur.opA), " A"), React.createElement("td", null, microSel.cur.limOp ? "≤ " + microSel.cur.limOp + " A" : "ยังไม่ระบุ"), React.createElement("td", {
    style: {
      color: !microSel.cur.limOp ? "var(--text-3)" : microSel.cur.opA <= microSel.cur.limOp ? "#12794A" : "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, !microSel.cur.limOp ? "—" : microSel.cur.opA <= microSel.cur.limOp ? "ผ่าน" : "ไม่ผ่าน")), React.createElement("tr", null, React.createElement("td", null, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23 Isc\xD71.25"), React.createElement("td", null, React.createElement("b", null, microSel.cur.scA), " A"), React.createElement("td", null, microSel.cur.limSc ? "≤ " + microSel.cur.limSc + " A" : "ยังไม่ระบุ"), React.createElement("td", {
    style: {
      color: !microSel.cur.limSc ? "var(--text-3)" : microSel.cur.scA <= microSel.cur.limSc ? "#12794A" : "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, !microSel.cur.limSc ? "—" : microSel.cur.scA <= microSel.cur.limSc ? "ผ่าน" : "ไม่ผ่าน")), (microSel.spec.wpMin > 0 || microSel.spec.wpMax > 0) && React.createElement("tr", null, React.createElement("td", null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A"), React.createElement("td", null, React.createElement("b", null, scNum(panel.wp)), " W"), React.createElement("td", null, microSel.spec.wpMin || "—", " \u2013 ", microSel.spec.wpMax || "—", " W"), React.createElement("td", {
    style: {
      color: (!microSel.spec.wpMin || scNum(panel.wp) >= microSel.spec.wpMin) && (!microSel.spec.wpMax || scNum(panel.wp) <= microSel.spec.wpMax) ? "#12794A" : "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, (!microSel.spec.wpMin || scNum(panel.wp) >= microSel.spec.wpMin) && (!microSel.spec.wpMax || scNum(panel.wp) <= microSel.spec.wpMax) ? "ผ่าน" : "ไม่ผ่าน"))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E44\u0E21\u0E42\u0E04\u0E23\u0E21\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 \u201C\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E2A\u0E31\u0E49\u0E19 \u0E46\u201D \u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u2014 1 \u0E0A\u0E48\u0E2D\u0E07 MPPT = 1 \u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E41\u0E1C\u0E07 ", microSel.nSeries, " \u0E43\u0E1A \u0E08\u0E36\u0E07\u0E15\u0E23\u0E27\u0E08\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19/\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E14\u0E49\u0E27\u0E22\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E23"), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, React.createElement(P3Icon, {
    name: "plan",
    size: 13
  }), "\u0E08\u0E31\u0E14\u0E41\u0E1C\u0E07\u0E40\u0E02\u0E49\u0E32\u0E15\u0E31\u0E27\u0E44\u0E21\u0E42\u0E04\u0E23", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, microManual ? "แก้เอง" : "ระบบจัดให้")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, microUnits.map(u => React.createElement("button", {
    key: u.id,
    className: "p3-chip",
    "data-on": activeMu === u.id ? "1" : "0",
    onClick: () => setActiveMu(u.id),
    title: u.mixed ? "ตัวนี้คร่อมกลุ่มทิศทาง — แผงคนละทิศห้ามอยู่ไมโครตัวเดียวกัน" : u.over ? "ใส่แผงเกินที่ไมโครรุ่นนี้รับได้" : "ไมโคร " + u.id + " · " + u.gLabel,
    style: {
      borderColor: activeMu === u.id ? suColor(u.id) : "var(--ln2)",
      background: activeMu === u.id ? suColor(u.id) + "1E" : "var(--surface)",
      color: activeMu === u.id ? suColor(u.id) : "var(--text-2)"
    }
  }, React.createElement("span", {
    className: "dot",
    style: {
      background: suColor(u.id),
      width: 9,
      height: 9
    }
  }), "\u0E44\u0E21\u0E42\u0E04\u0E23 ", u.id, " \xB7 ", React.createElement("b", null, u.n), (u.mixed || u.over) && React.createElement("span", {
    style: {
      color: "var(--tint-red-tx)",
      fontWeight: 800
    }
  }, "!"))), React.createElement("button", {
    className: "p3-chip",
    onClick: () => setActiveMu(nextMu),
    "data-on": activeMu === nextMu ? "1" : "0",
    title: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E44\u0E21\u0E42\u0E04\u0E23\u0E15\u0E31\u0E27\u0E43\u0E2B\u0E21\u0E48 \u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E08\u0E30\u0E43\u0E2A\u0E48"
  }, React.createElement(P3Icon, {
    name: "plus",
    size: 12
  }), "\u0E44\u0E21\u0E42\u0E04\u0E23\u0E43\u0E2B\u0E21\u0E48"), React.createElement("button", {
    className: "p3-chip",
    onClick: () => setActiveMu(0),
    "data-on": activeMu === 0 ? "1" : "0",
    title: "\u0E41\u0E15\u0E30\u0E41\u0E1C\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E44\u0E21\u0E42\u0E04\u0E23",
    style: {
      borderStyle: "dashed"
    }
  }, React.createElement(P3Icon, {
    name: "trash",
    size: 12
  }), "\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, phases === 3 && React.createElement("span", {
    className: "p3-seg wide"
  }, [["unit", "สีตามไมโคร"], ["phase", "สีตามเฟส"]].map(([k, t]) => React.createElement("button", {
    key: k,
    "data-on": muColorBy === k ? "1" : "0",
    onClick: () => setMuColorBy(k)
  }, t))), microManual ? React.createElement("button", {
    className: "p3-b sm",
    onClick: () => set({
      microAssign: {},
      microManual: false
    }),
    title: "\u0E17\u0E34\u0E49\u0E07\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E43\u0E2B\u0E49"
  }, React.createElement(P3Icon, {
    name: "reset",
    size: 13
  }), "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14") : React.createElement("button", {
    className: "p3-b sm",
    onClick: () => set({
      microAssign: microAuto.assign,
      microManual: true
    }),
    title: "\u0E22\u0E36\u0E14\u0E01\u0E32\u0E23\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E23\u0E34\u0E48\u0E21\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07"
  }, React.createElement(P3Icon, {
    name: "check",
    size: 13
  }), "\u0E22\u0E36\u0E14\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E44\u0E27\u0E49\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07"))), React.createElement(SuLayout2D, {
    foot: foot,
    assign: microAssign,
    active: activeMu !== null,
    onPaint: paintMu,
    unitName: "\u0E44\u0E21\u0E42\u0E04\u0E23",
    labels: phases === 3 ? uidPhase : null,
    colorOf: phases === 3 && muColorBy === "phase" ? uid => SU_PHCOLOR[uidPhase[uid]] || "#94A3B8" : null
  }), React.createElement("span", {
    className: "p3-note"
  }, microSel.per > 1 ? "ระบบจับคู่แผงที่ติดกันบนหลังคาให้แล้ว (สายจะได้สั้น) — แตะหรือลากบนแผงเพื่อย้ายเข้าตัวที่เลือกไว้ด้านบน · แผงคนละทิศห้ามอยู่ตัวเดียวกัน" : "อัตราส่วน 1:1 — แผงทุกใบมีไมโครของตัวเอง สีในผังคือหมายเลขตัว ไม่ต้องจับคู่อะไรเพิ่ม", phases === 3 ? " · ตัวหนังสือบนแผงคือเฟสที่แผงนั้นลง (L1/L2/L3)" : "", " · มองจากด้านบน ทิศเหนืออยู่บน"), (microUnassigned > 0 || microUnits.some(u => u.mixed || u.over)) && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), React.createElement("span", null, microUnassigned > 0 && React.createElement(React.Fragment, null, "\u0E22\u0E31\u0E07\u0E21\u0E35\u0E41\u0E1C\u0E07 ", React.createElement("b", null, microUnassigned), " \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E44\u0E21\u0E42\u0E04\u0E23\u0E15\u0E31\u0E27\u0E44\u0E2B\u0E19 "), microUnits.filter(u => u.mixed).length > 0 && React.createElement(React.Fragment, null, "\xB7 \u0E21\u0E35 ", React.createElement("b", null, microUnits.filter(u => u.mixed).length), " \u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E04\u0E23\u0E48\u0E2D\u0E21\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07 (\u0E41\u0E1C\u0E07\u0E04\u0E19\u0E25\u0E30\u0E17\u0E34\u0E28\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E22\u0E01\u0E15\u0E31\u0E27\u0E01\u0E31\u0E19) "), microUnits.filter(u => u.over).length > 0 && React.createElement(React.Fragment, null, "\xB7 \u0E21\u0E35 ", React.createElement("b", null, microUnits.filter(u => u.over).length), " \u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E43\u0E2A\u0E48\u0E41\u0E1C\u0E07\u0E40\u0E01\u0E34\u0E19 ", microSel.per, " \u0E43\u0E1A"))), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, React.createElement(P3Icon, {
    name: "grid",
    size: 13
  }), "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E41\u0E1A\u0E48\u0E07\u0E40\u0E1F\u0E2A", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide"
  }, [[1, "1 เฟส"], [3, "3 เฟส"]].map(([v, t]) => React.createElement("button", {
    key: v,
    "data-on": phases === v ? "1" : "0",
    onClick: () => set({
      phases: v
    })
  }, t)))), phases === 1 ? React.createElement("span", {
    className: "p3-note"
  }, "\u0E23\u0E30\u0E1A\u0E1A 1 \u0E40\u0E1F\u0E2A \u2014 \u0E44\u0E21\u0E42\u0E04\u0E23\u0E17\u0E38\u0E01\u0E15\u0E31\u0E27\u0E25\u0E07\u0E40\u0E1F\u0E2A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E2B\u0E21\u0E14 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E1A\u0E48\u0E07\u0E01\u0E25\u0E38\u0E48\u0E21", jobPhase === 3 ? " · หมายเหตุ: ข้อมูลงานระบุไว้เป็น 3 เฟส" : "") : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "su-phgrid"
  }, phaseBins.map(b => React.createElement("div", {
    key: b.phase,
    className: "su-phcard",
    "data-ph": b.phase
  }, React.createElement("span", {
    className: "hd"
  }, React.createElement("b", null, b.label), React.createElement("i", null, b.count, " \u0E15\u0E31\u0E27")), React.createElement("span", {
    className: "big"
  }, b.acKw, React.createElement("small", null, "kW")), React.createElement("span", {
    className: "sub"
  }, b.panels, " \u0E41\u0E1C\u0E07 \xB7 ", b.amps, " A", b.branches ? " · " + b.branches + " วงจร" : ""), React.createElement("span", {
    className: "bar"
  }, React.createElement("i", {
    style: {
      width: (phaseBins.reduce((a, x) => Math.max(a, x.dcW), 1) ? b.dcW / phaseBins.reduce((a, x) => Math.max(a, x.dcW), 1) * 100 : 0) + "%"
    }
  })), React.createElement("span", {
    className: "us"
  }, b.units.map(u => u.id).join(" · ") || "—")))), phaseBal && React.createElement("div", {
    className: "su-alert " + (phaseBal.ok ? "good" : "warn")
  }, React.createElement(P3Icon, {
    name: phaseBal.ok ? "check" : "height",
    size: 14
  }), React.createElement("span", null, phaseBal.ok ? React.createElement(React.Fragment, null, "\u0E40\u0E1F\u0E2A\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E14\u0E35 \u2014 \u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19 ", React.createElement("b", null, phaseBal.spread), " \u0E15\u0E31\u0E27 (", phaseBal.pct, "% \u0E02\u0E2D\u0E07\u0E01\u0E33\u0E25\u0E31\u0E07) \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C ", phaseBal.tol, "%") : React.createElement(React.Fragment, null, "\u0E40\u0E1F\u0E2A\u0E44\u0E21\u0E48\u0E2A\u0E21\u0E14\u0E38\u0E25 \u2014 \u0E40\u0E1F\u0E2A\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E31\u0E01\u0E01\u0E31\u0E1A\u0E40\u0E1A\u0E32\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19 ", React.createElement("b", null, phaseBal.pct, "%"), " (", phaseBal.spread, " \u0E15\u0E31\u0E27) \u0E40\u0E01\u0E34\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C ", phaseBal.tol, "% \u0E04\u0E27\u0E23\u0E40\u0E01\u0E25\u0E35\u0E48\u0E22\u0E43\u0E2B\u0E21\u0E48"))), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E44\u0E21\u0E42\u0E04\u0E23"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07"), React.createElement("th", null, "\u0E40\u0E1F\u0E2A"))), React.createElement("tbody", null, phaseBins.reduce((all, b) => all.concat(b.units.map(u => ({
    u,
    b
  }))), []).sort((a, z) => a.u.id - z.u.id).map(({
    u,
    b
  }) => React.createElement("tr", {
    key: u.id
  }, React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: suColor(u.id)
    }
  }), React.createElement("b", null, "\u0E44\u0E21\u0E42\u0E04\u0E23 ", u.id))), React.createElement("td", null, u.n), React.createElement("td", {
    style: {
      maxWidth: 190
    }
  }, u.gLabel), React.createElement("td", null, React.createElement("span", {
    className: "su-phpick"
  }, [1, 2, 3].map(ph => React.createElement("button", {
    key: ph,
    "data-on": b.phase === ph ? "1" : "0",
    "data-ph": ph,
    title: (S.microPhase || {})[u.id] === ph ? "ล็อกไว้เอง — กดซ้ำเพื่อให้ระบบเกลี่ยเอง" : "ย้ายไปเฟสนี้",
    onClick: () => setUnitPhase(u.id, (S.microPhase || {})[u.id] === ph ? null : ph)
  }, "L", ph, (S.microPhase || {})[u.id] === ph ? "•" : ""))))))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E25\u0E35\u0E48\u0E22\u0E43\u0E2B\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E40\u0E1F\u0E2A\u0E43\u0E01\u0E25\u0E49\u0E40\u0E04\u0E35\u0E22\u0E07\u0E01\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27 (\u0E44\u0E21\u0E42\u0E04\u0E23 ", microUnits.length, " \u0E15\u0E31\u0E27 \u2192", " ", phaseBins.map(b => b.count).join("/"), ") \u2014 \u0E01\u0E14 L1/L2/L3 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E25\u0E47\u0E2D\u0E01\u0E15\u0E31\u0E27\u0E44\u0E2B\u0E19\u0E44\u0E27\u0E49\u0E40\u0E1F\u0E2A\u0E44\u0E2B\u0E19\u0E40\u0E2D\u0E07 \u0E08\u0E38\u0E14 \u2022 \u0E04\u0E37\u0E2D\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E27\u0E49 \u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E40\u0E01\u0E25\u0E35\u0E48\u0E22\u0E23\u0E2D\u0E1A \u0E46 \u0E43\u0E2B\u0E49\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E2D\u0E07", Object.keys(S.microPhase || {}).length > 0 && React.createElement("button", {
    className: "p3-lnk",
    style: {
      marginLeft: 6
    },
    onClick: () => set({
      microPhase: {}
    })
  }, "\u0E25\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E25\u0E47\u0E2D\u0E01\u0E44\u0E27\u0E49"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E44\u0E21\u0E42\u0E04\u0E23\u0E23\u0E27\u0E21 ", React.createElement("b", null, microUnits.length || microSel.units), " \u0E15\u0E31\u0E27", microManual && microUnits.length !== microSel.units ? React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\xA0(\u0E08\u0E31\u0E14\u0E40\u0E2D\u0E07)") : null), React.createElement("span", {
    className: "p3-stat"
  }, "DC ", React.createElement("b", null, microSel.dcKw), " kWp"), React.createElement("span", {
    className: "p3-stat"
  }, "AC ", React.createElement("b", null, microSel.acKw), " kW"), React.createElement("span", {
    className: "p3-stat"
  }, "DC/AC ", React.createElement("b", null, microSel.dcAc)), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A AC \u0E23\u0E27\u0E21 ", React.createElement("b", null, microSel.acAmpTotal), " A"), microSel.branches > 0 && React.createElement("span", {
    className: "p3-stat",
    title: "ต่อพ่วงได้ " + microSel.perBranch + " ตัวต่อวงจร"
  }, "\u0E27\u0E07\u0E08\u0E23\u0E22\u0E48\u0E2D\u0E22 AC ", React.createElement("b", null, microSel.branches), " \u0E27\u0E07\u0E08\u0E23"))), warns.map((w, i) => React.createElement("div", {
    key: i,
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), React.createElement("span", null, w))), (microSel && microSel.notes ? microSel.notes : []).map((n, i) => React.createElement("div", {
    key: "mn" + i,
    className: "su-alert info"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 14
  }), React.createElement("span", null, n))), (plan && plan.notes ? plan.notes : []).map((n, i) => React.createElement("div", {
    key: "n" + i,
    className: "su-alert info"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 14
  }), React.createElement("span", null, n))), !warns.length && (plan || microSel) && React.createElement("div", {
    className: "su-alert good"
  }, React.createElement(P3Icon, {
    name: "check",
    size: 14
  }), "\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E1C\u0E48\u0E32\u0E19\u0E17\u0E38\u0E01\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02 \u2014 \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E17\u0E31\u0E49\u0E07\u0E15\u0E2D\u0E19\u0E23\u0E49\u0E2D\u0E19\u0E08\u0E31\u0E14\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "space-between"
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: () => setStep(0)
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 20px"
    },
    onClick: () => setStep(2)
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E15\u0E23\u0E27\u0E08\u0E27\u0E31\u0E14 I-V", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  })))), step === 2 && React.createElement(React.Fragment, null, !par && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E22\u0E31\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E2A\u0E49\u0E19 I-V \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 Voc / Isc / Vmp / Imp \u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19 (\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C)"), sim && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "sun",
    size: 13
  }), "\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E41\u0E2A\u0E07\u0E15\u0E25\u0E2D\u0E14\u0E27\u0E31\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "su-mstep"
  }, React.createElement("button", {
    onClick: () => stepMonth(-1),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"
  }, React.createElement(P3Icon, {
    name: "arrow",
    size: 12
  })), React.createElement("b", null, "\u0E27\u0E31\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19", SC_MON[isFinite(monthNow) ? monthNow : 6]), React.createElement("button", {
    onClick: () => stepMonth(1),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B"
  }, React.createElement(P3Icon, {
    name: "arrow",
    size: 12
  })))), React.createElement(SuDayLight, {
    sim: sim,
    groups: groups,
    hour: simHour,
    onHour: h => setSite({
      hour: scR(h, 2)
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E1E\u0E23\u0E30\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E02\u0E36\u0E49\u0E19 ", React.createElement("b", null, ivHM(sim.sunrise))), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E15\u0E01 ", React.createElement("b", null, ivHM(sim.sunset))), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E41\u0E14\u0E14\u0E41\u0E23\u0E07\u0E2A\u0E38\u0E14 ", React.createElement("b", null, sim.maxPoa), " W/m\xB2 \u0E15\u0E2D\u0E19 ", React.createElement("b", null, ivHM(sim.peak ? sim.peak.h : null))), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", null, sim.dayKwh), " kWh"), sim.clipHours > 0 && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14 ", React.createElement("b", null, sim.clipHours), " \u0E0A\u0E21."), sim.shadeLossPct > 0 && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E40\u0E07\u0E32\u0E01\u0E34\u0E19\u0E44\u0E1B ", React.createElement("b", null, sim.shadeLossKwh), " kWh (", sim.shadeLossPct, "%)")), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, React.createElement(P3Icon, {
    name: "tree",
    size: 12
  }), "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E23\u0E32\u0E22\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \u2014 \u0E08\u0E32\u0E01\u0E15\u0E31\u0E27\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E41\u0E25\u0E30\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, sim.shadeFrom != null ? "โดนบัง " + ivHM(sim.shadeFrom) + "–" + ivHM(sim.shadeTo) : "ไม่มีเงาบังทั้งวัน")), React.createElement(SuShadeStrip, {
    sim: sim,
    groups: groups
  }), React.createElement("span", {
    className: "p3-note"
  }, "\u0E22\u0E34\u0E07\u0E25\u0E33\u0E41\u0E2A\u0E07\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E17\u0E38\u0E01\u0E43\u0E1A (", sim.panels, " \u0E43\u0E1A \xD7 5 \u0E08\u0E38\u0E14) \u0E17\u0E38\u0E01 15 \u0E19\u0E32\u0E17\u0E35 \u0E44\u0E1B\u0E2B\u0E32\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C \u0E41\u0E25\u0E49\u0E27\u0E14\u0E39\u0E27\u0E48\u0E32\u0E0A\u0E19", React.createElement("b", null, " \u0E15\u0E31\u0E27\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", sim.buildings, " \u0E0A\u0E34\u0E49\u0E19"), " \xB7 ", React.createElement("b", null, "\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E44\u0E27\u0E49 ", sim.obstacles, " \u0E0A\u0E34\u0E49\u0E19"), " \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E1C\u0E07\u0E41\u0E16\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E25\u0E48\u0E32 \u2014 \u0E25\u0E32\u0E01\u0E1A\u0E19\u0E01\u0E23\u0E32\u0E1F\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E14\u0E39\u0E44\u0E14\u0E49"), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, React.createElement(P3Icon, {
    name: "curve",
    size: 12
  }), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E41\u0E25\u0E30\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E15\u0E25\u0E2D\u0E14\u0E27\u0E31\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ", sim.peak ? scR(sim.peak.ac, 2) : 0, " kW \u0E15\u0E2D\u0E19 ", ivHM(sim.peak ? sim.peak.h : null))), React.createElement(SuDayPower, {
    sim: sim,
    groups: groups,
    acKw: acKw,
    hour: simHour,
    onHour: h => setSite({
      hour: scR(h, 2)
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#22A35B"
    }
  }, "\u2505"), " \u0E01\u0E33\u0E25\u0E31\u0E07 DC \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "#0F7A43"
    }
  }, "\u2501"), " \u0E01\u0E33\u0E25\u0E31\u0E07 AC \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E08\u0E23\u0E34\u0E07"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--tint-red-tx2)"
    }
  }, "\u2501"), " \u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E40\u0E0B\u0E25\u0E25\u0E4C (\u0E41\u0E01\u0E19\u0E02\u0E27\u0E32)"))), year && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "map",
    size: 13
  }), "\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35 12 \u0E40\u0E14\u0E37\u0E2D\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("button", {
    "data-on": mapMode === "light" ? "1" : "0",
    onClick: () => setMapMode("light")
  }, "\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49"), React.createElement("button", {
    "data-on": mapMode === "shade" ? "1" : "0",
    onClick: () => setMapMode("shade")
  }, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07"))), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27\u0E04\u0E37\u0E2D 1 \u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E37\u0E2D\u0E04\u0E23\u0E36\u0E48\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \u2014 \u0E01\u0E14\u0E17\u0E35\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E01\u0E23\u0E32\u0E1F\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19"), React.createElement(SuYearMap, {
    year: year,
    mode: mapMode,
    month: isFinite(monthNow) ? monthNow : 0,
    onMonth: mo => setSite({
      date: mo.date
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat",
    title: "\u0E23\u0E27\u0E21\u0E08\u0E32\u0E01\u0E27\u0E31\u0E19\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E14\u0E39\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E14\u0E34\u0E19\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E1B\u0E35"
  }, "\u0E1C\u0E25\u0E34\u0E15\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35 (\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13) ", React.createElement("b", null, Math.round(year.totalKwh / 1000).toLocaleString()), " MWh"), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: year.shadeLossPct > 0 ? "var(--tint-amber-tx)" : undefined
    }
  }, "\u0E40\u0E07\u0E32\u0E01\u0E34\u0E19\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35 ", React.createElement("b", null, year.shadeLossKwh.toLocaleString()), " kWh (", year.shadeLossPct, "%)"), year.worstMonth && year.worstMonth.shadeLossPct > 0 && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E2B\u0E19\u0E31\u0E01\u0E2A\u0E38\u0E14 ", React.createElement("b", null, year.worstMonth.label), " (", year.worstMonth.shadeLossPct, "%)"), year.clipHours > 0 && React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 ", React.createElement("b", null, year.clipHours), " \u0E0A\u0E21./\u0E1B\u0E35")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("th", null, "\u0E41\u0E14\u0E14\u0E02\u0E36\u0E49\u0E19\u2013\u0E15\u0E01"), React.createElement("th", null, "\u0E41\u0E14\u0E14\u0E41\u0E23\u0E07\u0E2A\u0E38\u0E14"), React.createElement("th", null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14"), React.createElement("th", null, "\u0E1C\u0E25\u0E34\u0E15/\u0E27\u0E31\u0E19"), React.createElement("th", null, "\u0E1C\u0E25\u0E34\u0E15/\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("th", null, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07"))), React.createElement("tbody", null, year.months.map(mo => React.createElement("tr", {
    key: mo.m,
    "data-on": mo.m === monthNow ? "1" : "0"
  }, React.createElement("td", null, React.createElement("b", null, mo.label)), React.createElement("td", null, ivHM(mo.sunrise), "\u2013", ivHM(mo.sunset)), React.createElement("td", null, mo.maxPoa, " W/m\xB2"), React.createElement("td", null, scR(mo.peakAc, 2), " kW"), React.createElement("td", null, scR(mo.dayKwh, 1), " kWh"), React.createElement("td", null, React.createElement("b", null, mo.monthKwh.toLocaleString()), " kWh"), React.createElement("td", {
    style: {
      fontWeight: 800,
      color: mo.shadeLossPct >= 5 ? "var(--tint-red-tx)" : mo.shadeLossPct > 0 ? "var(--tint-amber-tx)" : "var(--text-3)"
    }
  }, mo.shadeLossPct, "%", mo.shadeFrom != null ? " (" + ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + ")" : ""))))))), sunPath && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "sunShadow",
    size: 13
  }), "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C & \u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("button", {
    "data-on": isoOn ? "1" : "0",
    onClick: () => setIsoOn(true)
  }, "\u0E0B\u0E49\u0E2D\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E40\u0E07\u0E32"), React.createElement("button", {
    "data-on": isoOn ? "0" : "1",
    onClick: () => setIsoOn(false)
  }, "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07"))), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E41\u0E01\u0E19\u0E19\u0E2D\u0E19\u0E04\u0E37\u0E2D\u0E17\u0E34\u0E28\u0E17\u0E35\u0E48\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E2D\u0E22\u0E39\u0E48 \u0E41\u0E01\u0E19\u0E15\u0E31\u0E49\u0E07\u0E04\u0E37\u0E2D\u0E21\u0E38\u0E21\u0E2A\u0E39\u0E07\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E02\u0E2D\u0E1A\u0E1F\u0E49\u0E32 \u2014 \u0E40\u0E2A\u0E49\u0E19\u0E42\u0E04\u0E49\u0E07\u0E2A\u0E35\u0E2A\u0E49\u0E21\u0E04\u0E37\u0E2D\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E23\u0E30\u0E04\u0E37\u0E2D\u0E40\u0E27\u0E25\u0E32 \xB7 \u0E1E\u0E37\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E2A\u0E35\u0E04\u0E37\u0E2D", React.createElement("b", null, "\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E41\u0E1C\u0E07\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07"), " \u0E22\u0E34\u0E48\u0E07\u0E40\u0E02\u0E49\u0E21\u0E22\u0E34\u0E48\u0E07\u0E42\u0E14\u0E19\u0E2B\u0E19\u0E31\u0E01 \u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E44\u0E2B\u0E19\u0E27\u0E34\u0E48\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E35 \u0E41\u0E1B\u0E25\u0E27\u0E48\u0E32\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E49\u0E19\u0E42\u0E14\u0E19\u0E40\u0E07\u0E32\u0E41\u0E19\u0E48\u0E19\u0E2D\u0E19"), React.createElement(SuSunPath, {
    path: sunPath,
    iso: isoShade,
    mark: ivMain && ivMain.irr && !ivMain.irr.night ? {
      alt: ivMain.irr.alt,
      az: ivMain.irr.az,
      label: ivHM(simHour)
    } : null
  }), isoOn && isoShade && React.createElement("div", {
    className: "su-isolg",
    style: {
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A"), SU_ISO.slice().reverse().map(b => React.createElement("span", {
    key: b.lb
  }, React.createElement("i", {
    style: {
      background: b.c,
      opacity: b.o
    }
  }), b.lb)), !isoShade.any && React.createElement("span", {
    style: {
      color: "var(--acd)",
      fontWeight: 800
    }
  }, "\xB7 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E41\u0E2A\u0E07\u0E44\u0E2B\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E41\u0E1C\u0E07\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E40\u0E25\u0E22")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E25\u0E30\u0E15\u0E34\u0E08\u0E39\u0E14 ", React.createElement("b", null, scR(scNum(st.sun && st.sun.lat, 13.75), 3), "\xB0")), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E1B\u0E35 ", React.createElement("b", null, sunPath.maxAlt, "\xB0")), sunPath.paths[0] && sunPath.paths[0].peak && React.createElement("span", {
    className: "p3-stat"
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E22\u0E32\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 ", React.createElement("b", null, ivHM(sunPath.paths[0].rise), "\u2013", ivHM(sunPath.paths[0].set))), sunPath.paths[sunPath.paths.length - 1] && React.createElement("span", {
    className: "p3-stat"
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 ", React.createElement("b", null, ivHM(sunPath.paths[sunPath.paths.length - 1].rise), "\u2013", ivHM(sunPath.paths[sunPath.paths.length - 1].set))), isoShade && isoShade.worst && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E2B\u0E19\u0E31\u0E01\u0E2A\u0E38\u0E14 ", React.createElement("b", null, "\u0E17\u0E34\u0E28 ", isoShade.worst.az, "\xB0 \u0E2A\u0E39\u0E07 ", isoShade.worst.alt, "\xB0"), " (", scR(isoShade.worst.f * 100, 1), "%)")), isoOn && !isoShade && React.createElement("span", {
    className: "p3-note"
  }, totalPanels > 0 ? "กำลังยิงลำแสงไปทั่วท้องฟ้าเพื่อวาดแผนที่เงา…" : "ยังไม่มีแผงในผัง 3 มิติ จึงยังวาดแผนที่เงาไม่ได้ — เส้นทางเดินดวงอาทิตย์ด้านบนคิดจากละติจูดของหน้างานล้วน ๆ"), isoOn && isoShade && isoShade.sampled > 0 && React.createElement("span", {
    className: "p3-note"
  }, "\u0E1C\u0E31\u0E07\u0E19\u0E35\u0E49\u0E21\u0E35 ", isoShade.panels, " \u0E41\u0E1C\u0E07 \u2014 \u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E40\u0E07\u0E32\u0E2A\u0E38\u0E48\u0E21\u0E41\u0E1C\u0E07\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19 ", isoShade.sampled, " \u0E43\u0E1A\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E1C\u0E31\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E27\u0E32\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E19\u0E17\u0E35 (\u0E15\u0E31\u0E27\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E04\u0E34\u0E14\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E0A\u0E34\u0E49\u0E19) \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E07\u0E32\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E32\u0E44\u0E1B\u0E04\u0E34\u0E14\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E08\u0E23\u0E34\u0E07\u0E22\u0E31\u0E07\u0E04\u0E34\u0E14\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E43\u0E1A\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "cloud",
    size: 13
  }), "\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19", SC_MON[isFinite(monthNow) ? monthNow : 6], React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, ivMain && ivMain.irr.measured ? "ใช้ค่าที่วัดได้จริง" : "ค่าเฉลี่ยรายเดือนของไทย")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, SC_MON.map((mm, i) => React.createElement("button", {
    key: i,
    className: "p3-chip",
    "data-on": i === monthNow ? "1" : "0",
    onClick: () => setMonth(i),
    style: {
      padding: "5px 9px",
      fontSize: 10.5
    }
  }, mm))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))",
      gap: 9
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", null, "\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19"), React.createElement("span", {
    className: "su-src " + (hourAuto ? "stock" : "edit")
  }, hourAuto ? "ระบบเลือกให้" : "เลือกเอง"), !hourAuto && React.createElement("button", {
    className: "p3-lnk",
    style: {
      marginLeft: "auto",
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      setSite({
        hour: null
      });
    }
  }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")), React.createElement("input", {
    className: "p3-inp",
    type: "time",
    value: (() => {
      const hh = Math.floor(simHour),
        mm = Math.round((simHour - hh) * 60);
      return String(hh).padStart(2, "0") + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0");
    })(),
    onChange: e => {
      const p = (e.target.value || "12:00").split(":");
      setSite({
        hour: scClamp(+p[0] + (+p[1] || 0) / 60, 4, 20)
      });
    }
  })), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19"), React.createElement("span", {
    className: "su-src " + (site.tAmb == null ? "stock" : "edit")
  }, site.tAmb == null ? "เฉลี่ยเดือนนี้" : "แก้เอง"), site.tAmb != null && React.createElement("button", {
    className: "p3-lnk",
    style: {
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      setSite({
        tAmb: null
      });
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32")), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    value: site.tAmb == null ? SC_TAMB[isFinite(monthNow) ? monthNow : 6] : site.tAmb,
    onChange: e => setSite({
      tAmb: e.target.value === "" ? null : +e.target.value
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\xB0C"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E23\u0E47\u0E27\u0E25\u0E21"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    step: "0.5",
    value: site.wind,
    onChange: e => setSite({
      wind: Math.max(0, +e.target.value || 0)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "m/s"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E21\u0E41\u0E2A\u0E07\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E23\u0E32\u0E1A"), React.createElement("span", {
    className: "su-src " + (site.ghi == null ? "stock" : "edit")
  }, site.ghi == null ? "จำลอง" : "แก้เอง"), site.ghi != null && React.createElement("button", {
    className: "p3-lnk",
    style: {
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      setSite({
        ghi: null
      });
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32")), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    step: "10",
    value: site.ghi == null ? simRow ? simRow.ghi : "" : site.ghi,
    onChange: e => setSite({
      ghi: e.target.value === "" ? null : +e.target.value
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "W/m\xB2"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E2D\u0E32\u0E22\u0E38\u0E23\u0E30\u0E1A\u0E1A \u0E13 \u0E27\u0E31\u0E19\u0E27\u0E31\u0E14"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    max: "30",
    step: "0.5",
    value: site.age,
    onChange: e => setSite({
      age: scClamp(+e.target.value || 0, 0, 30)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1B\u0E35")))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E27\u0E34\u0E18\u0E35\u0E22\u0E36\u0E14\u0E41\u0E1C\u0E07 (\u0E21\u0E35\u0E1C\u0E25\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E2A\u0E30\u0E2A\u0E21)"), React.createElement("select", {
    className: "p3-inp",
    value: site.mount,
    onChange: e => setSite({
      mount: e.target.value
    })
  }, Object.keys(IV_MOUNT).map(k => React.createElement("option", {
    key: k,
    value: k
  }, IV_MOUNT[k].label, " \u2014 ", IV_MOUNT[k].note)))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E15\u0E2D\u0E19\u0E27\u0E31\u0E14", React.createElement("span", {
    className: "su-src " + (shadeAuto ? "stock" : "edit")
  }, shadeAuto ? "จากโมเดล 3 มิติ" : "กรอกเอง"), React.createElement("button", {
    className: "p3-lnk",
    style: {
      marginLeft: "auto",
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      setSite({
        shadeAuto: !shadeAuto
      });
    }
  }, shadeAuto ? "กรอกเอง" : "ให้ระบบคิดจากผัง 3 มิติ")), shadeAuto ? React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
      minHeight: 30
    }
  }, ivRows.map(r => React.createElement("span", {
    key: r.u.id,
    className: "p3-stat",
    style: {
      color: r.shade >= 10 ? "var(--tint-red-tx)" : r.shade > 0 ? "var(--tint-amber-tx)" : undefined
    }
  }, r.u.name, " ", React.createElement("b", null, scR(r.shade, 1), "%"))), !ivRows.some(r => r.shade > 0.5) && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--acd)"
    }
  }, React.createElement(P3Icon, {
    name: "check",
    size: 12
  }), "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E40\u0E25\u0E22\u0E43\u0E19\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49")) : React.createElement(P3NumRange, {
    span: true,
    label: "",
    value: site.shade,
    min: 0,
    max: 60,
    step: 1,
    suffix: "%",
    onChange: v => setSite({
      shade: v
    })
  }))), ivMain && !ivMain.irr.night && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, "\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E15\u0E01\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E07\u0E08\u0E23\u0E34\u0E07 (", ivMain.u.name, " \xB7 \u0E40\u0E2D\u0E35\u0E22\u0E07 ", scR(ivMain.u.tilt, 0), "\xB0 \u0E17\u0E34\u0E28 ", scR(ivMain.u.az, 0), "\xB0)", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--acd)"
    }
  }, ivMain.irr.poaNet, " W/m\xB2")), React.createElement(SuLightBar, {
    irr: ivMain.irr
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat",
    title: "\u0E41\u0E2A\u0E07\u0E23\u0E27\u0E21\u0E17\u0E35\u0E48\u0E15\u0E01\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E23\u0E32\u0E1A"
  }, "\u0E41\u0E2A\u0E07\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E23\u0E32\u0E1A ", React.createElement("b", null, ivMain.irr.ghi), " W/m\xB2"), React.createElement("span", {
    className: "p3-stat",
    title: "\u0E21\u0E38\u0E21\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E25\u0E33\u0E41\u0E2A\u0E07\u0E01\u0E31\u0E1A\u0E40\u0E2A\u0E49\u0E19\u0E15\u0E31\u0E49\u0E07\u0E09\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E07 \u2014 \u0E22\u0E34\u0E48\u0E07\u0E19\u0E49\u0E2D\u0E22\u0E22\u0E34\u0E48\u0E07\u0E44\u0E14\u0E49\u0E41\u0E2A\u0E07\u0E40\u0E15\u0E47\u0E21"
  }, "\u0E21\u0E38\u0E21\u0E15\u0E01\u0E01\u0E23\u0E30\u0E17\u0E1A ", React.createElement("b", null, ivMain.irr.aoi, "\xB0")), React.createElement("span", {
    className: "p3-stat",
    title: "\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E30\u0E17\u0E49\u0E2D\u0E19\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E1C\u0E34\u0E27\u0E01\u0E23\u0E30\u0E08\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E41\u0E2A\u0E07\u0E40\u0E02\u0E49\u0E32\u0E40\u0E09\u0E35\u0E22\u0E07"
  }, "\u0E1C\u0E48\u0E32\u0E19\u0E1C\u0E34\u0E27\u0E01\u0E23\u0E30\u0E08\u0E01 ", React.createElement("b", null, scR(ivMain.irr.iam * 100, 1), "%")), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: ivMain.irr.tiltGain >= 1 ? "var(--acd)" : "var(--tint-amber-tx)"
    },
    title: "\u0E21\u0E38\u0E21\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E44\u0E14\u0E49\u0E41\u0E2A\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32/\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E1E\u0E37\u0E49\u0E19\u0E23\u0E32\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E44\u0E2B\u0E23\u0E48"
  }, "\u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32", ivMain.irr.tiltGain >= 1 ? "ช่วยเพิ่ม" : "ทำให้ลด", " ", React.createElement("b", null, scR(Math.abs(ivMain.irr.tiltGain - 1) * 100, 1), "%")), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E2A\u0E39\u0E07 ", React.createElement("b", null, ivMain.irr.alt, "\xB0"), " \u0E17\u0E34\u0E28 ", React.createElement("b", null, ivMain.irr.az, "\xB0"))), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 3
    }
  }, React.createElement(P3Icon, {
    name: "thermo",
    size: 12
  }), "\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E2A\u0E30\u0E2A\u0E21\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E07", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, ivMain.temp.label)), React.createElement(SuThermo, {
    temp: ivMain.temp
  }), React.createElement("span", {
    className: "p3-note"
  }, "\u0E41\u0E1C\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E49\u0E2D\u0E19\u0E40\u0E17\u0E48\u0E32\u0E2D\u0E32\u0E01\u0E32\u0E28 \u2014 \u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E44\u0E1F\u0E08\u0E30\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E04\u0E49\u0E32\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 \u0E22\u0E34\u0E48\u0E07\u0E22\u0E36\u0E14\u0E0A\u0E34\u0E14\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E22\u0E34\u0E48\u0E07\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01 \u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E23\u0E49\u0E2D\u0E19 ", React.createElement("b", null, ivMain.temp.tCell, "\xB0C"), " \u0E04\u0E37\u0E2D\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 25\xB0C \u0E2D\u0E22\u0E39\u0E48 ", scR(ivMain.temp.tCell - 25, 1), "\xB0C \u2192 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E32\u0E22\u0E44\u0E1B ", React.createElement("b", null, scR(Math.abs(scNum(panel.tcPmax, -0.29)) * (ivMain.temp.tCell - 25), 1), "%"), " \u0E08\u0E32\u0E01\u0E2A\u0E31\u0E21\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49 (", scNum(panel.tcPmax, -0.29), " %/\xB0C)")), ivMain && ivMain.irr.night && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19/\u0E15\u0E01\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E48\u0E27\u0E07 8:00\u201316:00 \u0E08\u0E30\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49\u0E41\u0E21\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14")), ivMain && ivMain.a && ivMain.a.exp && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "curve",
    size: 13
  }), "\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E27\u0E23\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49\u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01", isMicro ? "ตัว" : "สตริง", " \u0E13 \u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, ivRows.length, " ", isMicro ? "ตัว" : "สตริง", " \xB7 ", ivMain.a.cond.g, " W/m\xB2 \xB7 \u0E40\u0E0B\u0E25\u0E25\u0E4C ", scR(ivMain.a.cond.tc, 0), "\xB0C")), ivCur && ivCur.el && ivCur.el.geo > 0 && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), React.createElement("span", null, React.createElement("b", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E19\u0E35\u0E49\u0E42\u0E14\u0E19\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E43\u0E19\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49"), " \u2014 \u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E08\u0E23\u0E34\u0E07 ", React.createElement("b", null, scR(ivCur.el.geo * 100, 1), "%"), "\u0E41\u0E15\u0E48\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21\u0E01\u0E31\u0E19 \u0E01\u0E23\u0E30\u0E41\u0E2A\u0E44\u0E2B\u0E25\u0E44\u0E14\u0E49\u0E40\u0E17\u0E48\u0E32\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E41\u0E22\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E44\u0E14\u0E42\u0E2D\u0E14\u0E1A\u0E32\u0E22\u0E1E\u0E32\u0E2A\u0E08\u0E36\u0E07\u0E15\u0E31\u0E14\u0E17\u0E48\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E17\u0E34\u0E49\u0E07", React.createElement("b", null, " ", ivCur.el.subLost, " \u0E08\u0E32\u0E01 ", ivCur.el.subTotal, " \u0E17\u0E48\u0E2D\u0E19"), " \u2192 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E32\u0E22\u0E08\u0E23\u0E34\u0E07 ", React.createElement("b", {
    style: {
      color: "var(--tint-red-tx)"
    }
  }, scR(ivCur.el.elec * 100, 1), "%"), ivCur.el.geo > 0 ? " (แรงกว่าคิดตามพื้นที่ " + scR(ivCur.el.elec / Math.max(0.0001, ivCur.el.geo), 1) + " เท่า)" : "", " · เส้นเขียวหักผลนี้ไปแล้ว")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb su-pick-row"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), isMicro && React.createElement("th", null, "\u0E15\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07"), React.createElement("th", null, "\u0E41\u0E2A\u0E07"), React.createElement("th", null, "\u0E40\u0E0B\u0E25\u0E25\u0E4C"), React.createElement("th", null, "Voc"), React.createElement("th", null, "Isc"), React.createElement("th", null, "Vmp"), React.createElement("th", null, "Imp"), React.createElement("th", null, isMicro ? "Pmax/ช่อง" : "Pmax"), isMicro && React.createElement("th", null, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E15\u0E31\u0E27"))), React.createElement("tbody", null, ivRows.map((r, i) => r.a && r.a.exp && React.createElement("tr", {
    key: r.u.id,
    "data-on": ivSel === r.u.id ? "1" : "0",
    onClick: () => setIvSel(ivSel === r.u.id ? null : r.u.id),
    title: ivSel === r.u.id ? "กดอีกครั้งเพื่อยกเลิก" : "กดเพื่อดูว่าเส้นนี้โดนเงาบังอยู่เท่าไหร่"
  }, React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: suColor(r.u.sid || i + 1)
    }
  }), React.createElement("b", null, r.u.name))), React.createElement("td", null, React.createElement("b", null, isMicro ? r.u.count || r.u.n : r.u.n)), isMicro && React.createElement("td", null, r.u.n, " \u0E43\u0E1A"), React.createElement("td", null, r.a.cond.g), React.createElement("td", null, scR(r.a.cond.tc, 0), "\xB0C"), React.createElement("td", null, scR(r.a.exp.voc, 1)), React.createElement("td", null, scR(r.a.exp.isc, 2)), React.createElement("td", null, scR(r.a.exp.vmp, 1)), React.createElement("td", null, scR(r.a.exp.imp, 2)), React.createElement("td", null, React.createElement("b", null, scR(r.a.exp.pmax, 0)), " W"), isMicro && React.createElement("td", null, React.createElement("b", null, scR(r.a.exp.pmax * Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n))), 0)), " W")))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22: \u0E41\u0E2A\u0E07 W/m\xB2 \xB7 Voc/Vmp \u0E40\u0E1B\u0E47\u0E19\u0E42\u0E27\u0E25\u0E15\u0E4C \xB7 Isc/Imp \u0E40\u0E1B\u0E47\u0E19\u0E41\u0E2D\u0E21\u0E1B\u0E4C \u2014 \u0E1E\u0E01\u0E15\u0E32\u0E23\u0E32\u0E07\u0E19\u0E35\u0E49\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E16\u0E49\u0E32\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E19\u0E35\u0E49\u0E40\u0E01\u0E34\u0E19 5% \u0E04\u0E48\u0E2D\u0E22\u0E44\u0E25\u0E48\u0E2B\u0E32\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38", isMicro ? " · ไมโคร 1 ตัวรับแผง " + (microSel ? microSel.per : 1) + " ใบ แต่แยกเป็นช่อง MPPT อิสระช่องละ " + (microSel ? microSel.nSeries : 1) + " ใบ ค่าไฟฟ้าในตารางจึงเป็นของ 1 ช่อง (ที่เครื่องวัดอ่านได้ตอนถอดสายมาวัดทีละเส้น) ส่วน “รวมทั้งตัว” คือทุกช่องบวกกัน · เส้นของแต่ละตัวคิดจากเงาที่ตกบนแผงของตัวนั้นเองล้วน ๆ ตัวที่โดนบังจึงต่ำลงคนเดียว ไม่ลากตัวอื่นลงไปด้วย" : "")), !!ivFam.length && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "curve",
    size: 13
  }), "\u0E40\u0E2A\u0E49\u0E19 P-V & I-V ", famMode === "temp" ? "ที่อุณหภูมิเซลล์ต่าง ๆ" : "ที่ความเข้มแสงต่าง ๆ", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("button", {
    "data-on": famMode === "irr" ? "1" : "0",
    onClick: () => setFamMode("irr")
  }, "\u0E44\u0E25\u0E48\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E21\u0E41\u0E2A\u0E07"), React.createElement("button", {
    "data-on": famMode === "temp" ? "1" : "0",
    onClick: () => setFamMode("temp")
  }, "\u0E44\u0E25\u0E48\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    className: "p3-seg"
  }, React.createElement("button", {
    "data-on": famScope === "mod" ? "1" : "0",
    onClick: () => setFamScope("mod")
  }, "\u0E15\u0E48\u0E2D 1 \u0E41\u0E1C\u0E07"), React.createElement("button", {
    "data-on": famScope === "str" ? "1" : "0",
    onClick: () => setFamScope("str")
  }, "\u0E17\u0E31\u0E49\u0E07", isMicro ? "ช่อง" : "สตริง", " \xB7 ", famStrN, " \u0E41\u0E1C\u0E07")), React.createElement("span", {
    className: "p3-stat",
    style: {
      marginLeft: "auto"
    }
  }, famMode === "temp" ? "ตรึงแสงไว้ที่ 1000 W/m²" : "ตรึงอุณหภูมิเซลล์ไว้ที่ 25 °C (มาตรฐาน STC)")), React.createElement(SuIvFamily, {
    curves: ivFam,
    mode: famMode,
    showPv: true
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 9.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u2501"), " \u0E40\u0E2A\u0E49\u0E19 I-V \u2014 \u0E01\u0E23\u0E30\u0E41\u0E2A (\u0E41\u0E01\u0E19\u0E0B\u0E49\u0E32\u0E22)"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u2505"), " \u0E40\u0E2A\u0E49\u0E19 P-V \u2014 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F (\u0E41\u0E01\u0E19\u0E02\u0E27\u0E32)"), React.createElement("span", null, React.createElement("b", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u25E6"), " \u0E08\u0E38\u0E14\u0E01\u0E25\u0E21 = \u0E08\u0E38\u0E14\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (MPP) \u0E17\u0E35\u0E48\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E25\u0E48\u0E15\u0E32\u0E21")), React.createElement("span", {
    className: "p3-note"
  }, famMode === "temp" ? React.createElement(React.Fragment, null, React.createElement("b", null, "\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E01\u0E34\u0E19\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E34\u0E19\u0E01\u0E23\u0E30\u0E41\u0E2A"), " \u2014 \u0E2A\u0E31\u0E07\u0E40\u0E01\u0E15\u0E27\u0E48\u0E32\u0E40\u0E2A\u0E49\u0E19\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E32\u0E41\u0E01\u0E19\u0E0B\u0E49\u0E32\u0E22 (Voc \u0E25\u0E14\u0E25\u0E07) \u0E41\u0E15\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E40\u0E01\u0E37\u0E2D\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E0A\u0E47\u0E01 Voc \u0E15\u0E2D\u0E19\u0E40\u0E0A\u0E49\u0E32\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 (\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E08\u0E30\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 \u0E2D\u0E32\u0E08\u0E40\u0E01\u0E34\u0E19\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C) \u0E41\u0E25\u0E30\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E15\u0E2D\u0E19\u0E1A\u0E48\u0E32\u0E22\u0E41\u0E14\u0E14\u0E41\u0E23\u0E07\u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E44\u0E1F\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E34\u0E14 \xB7 \u0E41\u0E1C\u0E07\u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49 ", scNum(panel.tcPmax, -0.29), " %/\xB0C", ivMain && ivMain.temp ? " · ตอนนี้ที่หน้างานเซลล์ร้อน " + ivMain.temp.tCell + " °C" : "") : React.createElement(React.Fragment, null, React.createElement("b", null, "\u0E41\u0E2A\u0E07\u0E01\u0E34\u0E19\u0E01\u0E23\u0E30\u0E41\u0E2A \u0E44\u0E21\u0E48\u0E04\u0E48\u0E2D\u0E22\u0E01\u0E34\u0E19\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19"), " \u2014 \u0E41\u0E2A\u0E07\u0E25\u0E14\u0E04\u0E23\u0E36\u0E48\u0E07\u0E2B\u0E19\u0E36\u0E48\u0E07 \u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E14\u0E04\u0E23\u0E36\u0E48\u0E07\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E15\u0E32\u0E21 \u0E41\u0E15\u0E48 Voc \u0E41\u0E17\u0E1A\u0E44\u0E21\u0E48\u0E02\u0E22\u0E31\u0E1A (\u0E15\u0E01\u0E41\u0E1A\u0E1A\u0E25\u0E2D\u0E01\u0E32\u0E23\u0E34\u0E17\u0E36\u0E21) \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E27\u0E31\u0E19\u0E40\u0E21\u0E06\u0E04\u0E23\u0E36\u0E49\u0E21\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E08\u0E48\u0E32\u0E22\u0E44\u0E1F\u0E44\u0E14\u0E49 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E22\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u0E0A\u0E48\u0E27\u0E07 MPPT \u0E2D\u0E22\u0E39\u0E48 \xB7 \u0E01\u0E23\u0E32\u0E1F\u0E19\u0E35\u0E49\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E2A\u0E40\u0E1B\u0E04\u0E02\u0E2D\u0E07 ", panel.model || "แผงที่เลือก", " \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E01\u0E23\u0E32\u0E1F\u0E1A\u0E19\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15\u0E44\u0E14\u0E49\u0E15\u0E23\u0E07 \u0E46 \u0E17\u0E35\u0E48\u0E42\u0E2B\u0E21\u0E14 \"\u0E15\u0E48\u0E2D 1 \u0E41\u0E1C\u0E07\"")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, famMode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง"), React.createElement("th", null, "Voc"), React.createElement("th", null, "Isc"), React.createElement("th", null, "Vmp"), React.createElement("th", null, "Imp"), React.createElement("th", null, "Pmax"), React.createElement("th", null, "Fill Factor"), React.createElement("th", null, "\u0E40\u0E17\u0E35\u0E22\u0E1A STC"))), React.createElement("tbody", null, ivFam.map((c, i) => React.createElement("tr", {
    key: c.key
  }, React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: (famMode === "temp" ? SU_TRAMP : SU_GRAMP)[Math.min(i, 4)]
    }
  }), React.createElement("b", null, c.label))), React.createElement("td", null, c.voc, " V"), React.createElement("td", null, c.isc, " A"), React.createElement("td", null, c.vmp, " V"), React.createElement("td", null, c.imp, " A"), React.createElement("td", null, React.createElement("b", null, c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : c.pmax + " W")), React.createElement("td", null, c.ff, "%"), React.createElement("td", {
    style: {
      fontWeight: 800,
      color: i === 0 ? "var(--acd)" : "var(--text-3)"
    }
  }, ivFam[0].pmax > 0 ? scR(c.pmax / ivFam[0].pmax * 100, 1) + "%" : "—"))))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "space-between"
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: () => setStep(1)
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 20px"
    },
    onClick: () => setStep(3)
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  })))), step === 3 && energy && life && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, [["ผลผลิตปีแรก", life.rows[0].kwh.toLocaleString(), "kWh"], ["ต่อกำลังติดตั้ง", energy.perKwp.toLocaleString(), "kWh/kWp/ปี"], ["Performance Ratio", energy.pr, "%"], ["รวม " + S.years + " ปี", Math.round(life.total / 1000).toLocaleString(), "MWh"]].map(([k, v, u]) => React.createElement("div", {
    key: k,
    className: "p3-card",
    style: {
      gap: 3,
      padding: "12px 13px"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, k), React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: "var(--text-1)",
      letterSpacing: "-.5px",
      lineHeight: 1.15
    }
  }, v), React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, u)))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "sun",
    size: 13
  }), "\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 (\u0E1B\u0E35\u0E41\u0E23\u0E01)", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "kWh")), React.createElement(SuMonthly, {
    data: energy.monthly
  }), React.createElement("span", {
    className: "p3-note"
  }, "\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E25\u0E30\u0E15\u0E34\u0E08\u0E39\u0E14 ", scR(scNum(st.sun && st.sun.lat, 13.75), 2), "\xB0 \u0E15\u0E01\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E23\u0E30\u0E19\u0E32\u0E1A\u0E40\u0E2D\u0E35\u0E22\u0E07\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E01\u0E25\u0E38\u0E48\u0E21\u0E41\u0E1C\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E2B\u0E31\u0E01\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E15\u0E32\u0E21\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "layers",
    size: 13
  }), "\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E01\u0E25\u0E38\u0E48\u0E21"), React.createElement("th", null, "\u0E40\u0E2D\u0E35\u0E22\u0E07"), React.createElement("th", null, "\u0E17\u0E34\u0E28"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "kWp"), React.createElement("th", null, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07"), React.createElement("th", null, "kWh/kWp"), React.createElement("th", null, "kWh/\u0E1B\u0E35"))), React.createElement("tbody", null, energy.perGroup.map(g => React.createElement("tr", {
    key: g.key
  }, React.createElement("td", {
    style: {
      maxWidth: 170,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, g.roofName, g.side ? " · " + g.side : ""), React.createElement("td", null, g.tilt, "\xB0"), React.createElement("td", null, g.az, "\xB0"), React.createElement("td", null, g.count), React.createElement("td", null, g.kwp), React.createElement("td", {
    style: {
      color: g.shade >= 5 ? "var(--tint-amber-tx)" : undefined
    }
  }, g.shade || 0, "%"), React.createElement("td", null, g.kwhPerKwp.toLocaleString()), React.createElement("td", null, React.createElement("b", null, g.kwh.toLocaleString()))))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2B\u0E31\u0E01\u0E04\u0E48\u0E32\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E2D\u0E37\u0E48\u0E19 \u2014 \u0E14\u0E39\u0E04\u0E48\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E2B\u0E31\u0E01\u0E17\u0E35\u0E48\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "reset",
    size: 13
  }), "\u0E04\u0E48\u0E32\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21 ", S.years, " \u0E1B\u0E35", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E1B\u0E35\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E40\u0E2B\u0E25\u0E37\u0E2D ", life.lastPct, "%")), React.createElement(SuLifeChart, {
    rows: life.rows
  }), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E1B\u0E35"), life.rows.map(r => React.createElement("th", {
    key: r.year,
    style: {
      textAlign: "right"
    }
  }, r.year)))), React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    style: {
      fontWeight: 700
    }
  }, "kWh"), life.rows.map(r => React.createElement("td", {
    key: r.year,
    style: {
      textAlign: "right"
    }
  }, Math.round(r.kwh / 100) / 10, "k"))), React.createElement("tr", null, React.createElement("td", {
    style: {
      fontWeight: 700
    }
  }, "\u0E40\u0E2B\u0E25\u0E37\u0E2D %"), life.rows.map(r => React.createElement("td", {
    key: r.year,
    style: {
      textAlign: "right"
    }
  }, r.factor))))))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "tree",
    size: 13
  }), "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E15\u0E25\u0E2D\u0E14\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, shade3d ? "คำนวณจากโมเดล 3 มิติแล้ว" : "ยังใช้ค่า % ที่กรอกมือ")), !shade3d ? React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E04\u0E34\u0E14\u0E40\u0E07\u0E32\u0E08\u0E32\u0E01\u0E42\u0E21\u0E40\u0E14\u0E25\u0E44\u0E27\u0E49 \u0E43\u0E0A\u0E49 % \u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E41\u0E17\u0E19"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      alignSelf: "flex-start"
    },
    onClick: () => set({
      shadeOff: false
    })
  }, React.createElement(P3Icon, {
    name: "sunShadow",
    size: 14
  }), "\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E34\u0E14\u0E40\u0E07\u0E32\u0E08\u0E32\u0E01\u0E42\u0E21\u0E40\u0E14\u0E25 3 \u0E21\u0E34\u0E15\u0E34")) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E40\u0E07\u0E32\u0E40\u0E0A\u0E34\u0E07\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48 ", React.createElement("b", null, shade3d.geoOnly, "%")), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-red-tx)"
    }
  }, "+ \u0E1C\u0E25\u0E09\u0E38\u0E14\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E15\u0E23\u0E34\u0E07 ", React.createElement("b", null, shade3d.elecExtra, "%")), React.createElement("span", {
    className: "p3-stat",
    style: {
      color: shade3d.overall >= 5 ? "var(--tint-amber-tx)" : "var(--acd)",
      fontWeight: 800
    }
  }, "= \u0E40\u0E2A\u0E35\u0E22\u0E08\u0E23\u0E34\u0E07 ", React.createElement("b", null, shade3d.overall, "%"), " \u0E15\u0E48\u0E2D\u0E1B\u0E35"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E15\u0E31\u0E27\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 ", React.createElement("b", null, shade3d.buildings), " \u0E0A\u0E34\u0E49\u0E19"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 ", React.createElement("b", null, shade3d.obstacles), " \u0E0A\u0E34\u0E49\u0E19")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 9,
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    title: "\u0E44\u0E14\u0E42\u0E2D\u0E14\u0E15\u0E31\u0E27\u0E40\u0E25\u0E47\u0E01\u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E15\u0E48\u0E2D\u0E2A\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 \u0E17\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E32\u0E07\u0E25\u0E31\u0E14\u0E43\u0E2B\u0E49\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E49\u0E2D\u0E21\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E40\u0E07\u0E32 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E21\u0E35\u0E21\u0E31\u0E19\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E08\u0E30\u0E23\u0E49\u0E2D\u0E19\u0E08\u0E31\u0E14\u0E08\u0E19\u0E44\u0E2B\u0E21\u0E49"
  }, "\u0E44\u0E14\u0E42\u0E2D\u0E14\u0E1A\u0E32\u0E22\u0E1E\u0E32\u0E2A\u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E07"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "1",
    max: "6",
    step: "1",
    value: elecCfg.diodes,
    onChange: e => setElec({
      diodes: scClamp(+e.target.value || 3, 1, 6)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E17\u0E48\u0E2D\u0E19"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    title: "PVsyst \u0E41\u0E19\u0E30\u0E19\u0E33 60\u201380% \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E21\u0E48\u0E33\u0E40\u0E2A\u0E21\u0E2D \xB7 100% \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E41\u0E16\u0E27\u0E1A\u0E31\u0E07\u0E41\u0E16\u0E27"
  }, "\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E1C\u0E25\u0E17\u0E32\u0E07\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    max: "100",
    step: "5",
    value: elecCfg.kElec,
    onChange: e => setElec({
      kElec: scClamp(+e.target.value || 80, 0, 100)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "%"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", null, "\u0E41\u0E1C\u0E07\u0E04\u0E23\u0E36\u0E48\u0E07\u0E40\u0E0B\u0E25\u0E25\u0E4C"), React.createElement("span", {
    className: "su-src " + (S.elec && S.elec.halfCut != null ? "edit" : "stock")
  }, S.elec && S.elec.halfCut != null ? "แก้เอง" : hc.why)), React.createElement("button", {
    className: "p3-b sm",
    onClick: () => setElec({
      halfCut: !elecCfg.halfCut
    }),
    title: "\u0E41\u0E1C\u0E07\u0E04\u0E23\u0E36\u0E48\u0E07\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E17\u0E19\u0E40\u0E07\u0E32\u0E44\u0E14\u0E49\u0E14\u0E35\u0E01\u0E27\u0E48\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07\u0E15\u0E31\u0E49\u0E07\u0E41\u0E25\u0E30\u0E40\u0E07\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E16\u0E1A\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19\u0E40\u0E15\u0E47\u0E21\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E41\u0E16\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E1A\u0E31\u0E07\u0E41\u0E16\u0E27\u0E2B\u0E25\u0E31\u0E07) \u2014 \u0E40\u0E07\u0E32\u0E15\u0E49\u0E19\u0E44\u0E21\u0E49/\u0E1B\u0E25\u0E48\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E22\u0E48\u0E2D\u0E21\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E02\u0E48\u0E32\u0E22"
  }, React.createElement(P3Icon, {
    name: elecCfg.halfCut ? "check" : "plus",
    size: 13
  }), elecCfg.halfCut ? "ใช่ · ทนเงาแถบแนวนอน" : "ไม่ใช่ / เงาเป็นหย่อม"))), React.createElement("span", {
    className: "p3-note"
  }, React.createElement("b", null, "\u0E44\u0E14\u0E42\u0E2D\u0E14\u0E1A\u0E32\u0E22\u0E1E\u0E32\u0E2A\u0E04\u0E37\u0E2D\u0E2D\u0E30\u0E44\u0E23"), " \u2014 \u0E44\u0E14\u0E42\u0E2D\u0E14\u0E15\u0E31\u0E27\u0E40\u0E25\u0E47\u0E01 \u0E46 \u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E15\u0E48\u0E2D\u0E2A\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 (\u0E1B\u0E01\u0E15\u0E34 3 \u0E15\u0E31\u0E27 \u0E41\u0E1A\u0E48\u0E07\u0E41\u0E1C\u0E07\u0E40\u0E1B\u0E47\u0E19 3 \u0E17\u0E48\u0E2D\u0E19) \u0E17\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E32\u0E07\u0E25\u0E31\u0E14\u0E43\u0E2B\u0E49\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E49\u0E2D\u0E21\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E40\u0E07\u0E32 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E21\u0E35\u0E21\u0E31\u0E19 \u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E08\u0E30\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E15\u0E49\u0E32\u0E19\u0E17\u0E32\u0E19\u0E23\u0E49\u0E2D\u0E19\u0E08\u0E31\u0E14\u0E08\u0E19\u0E41\u0E1C\u0E07\u0E44\u0E2B\u0E21\u0E49 (hot spot) \u0E21\u0E31\u0E19\u0E08\u0E36\u0E07\u0E22\u0E2D\u0E21\u0E15\u0E31\u0E14\u0E17\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19\u0E17\u0E34\u0E49\u0E07\u0E41\u0E17\u0E19 \u2014 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E40\u0E07\u0E32\u0E19\u0E34\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E40\u0E2A\u0E35\u0E22\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E49\u0E2D\u0E19 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48"), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07"), React.createElement("th", null))), React.createElement("tbody", null, groups.map(g => {
    const v = scNum(shade3d.byGroup[g.key], 0);
    return React.createElement("tr", {
      key: g.key
    }, React.createElement("td", {
      style: {
        maxWidth: 210,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, g.label), React.createElement("td", null, g.count), React.createElement("td", {
      style: {
        fontWeight: 800,
        color: v >= 8 ? "var(--tint-red-tx)" : v >= 3 ? "var(--tint-amber-tx)" : "var(--acd)"
      }
    }, v, "%"), React.createElement("td", {
      style: {
        width: 110
      }
    }, React.createElement("span", {
      className: "su-bar",
      style: {
        display: "block",
        height: 6
      }
    }, React.createElement("span", {
      style: {
        width: scClamp(v * 5, 0, 100) + "%",
        background: v >= 8 ? "var(--tint-red-tx2)" : v >= 3 ? "#D97706" : "#22A35B"
      }
    }))));
  })))), !!(shade3d.worst || []).length && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, "\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07\u0E2B\u0E19\u0E31\u0E01\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, shade3d.worst.map(w => React.createElement("span", {
    key: w.uid,
    className: "p3-chip",
    style: {
      cursor: "default",
      color: w.pct >= 15 ? "var(--tint-red-tx)" : "var(--tint-amber-tx)"
    }
  }, w.roofName, " \xB7 ", w.key, " ", React.createElement("b", null, w.pct, "%")))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E41\u0E1C\u0E07\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E16\u0E49\u0E32\u0E22\u0E49\u0E32\u0E22\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E04\u0E27\u0E23\u0E41\u0E22\u0E01\u0E44\u0E1B\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E21\u0E31\u0E19\u0E40\u0E2D\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49\u0E2D\u0E2D\u0E1B\u0E15\u0E34\u0E44\u0E21\u0E40\u0E0B\u0E2D\u0E23\u0E4C \u2014 \u0E44\u0E21\u0E48\u0E07\u0E31\u0E49\u0E19\u0E08\u0E30\u0E09\u0E38\u0E14\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E25\u0E07\u0E21\u0E32")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "p3-b sm",
    onClick: () => set({
      shadeOff: true
    })
  }, "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E01\u0E23\u0E2D\u0E01 % \u0E40\u0E2D\u0E07")), React.createElement("span", {
    className: "p3-note"
  }, "\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34 \u2014 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E2B\u0E31\u0E01\u0E40\u0E07\u0E32\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E25\u0E33\u0E41\u0E2A\u0E07\u0E15\u0E23\u0E07\u0E17\u0E35\u0E48\u0E42\u0E14\u0E19\u0E1A\u0E31\u0E07 (\u0E41\u0E2A\u0E07\u0E1F\u0E38\u0E49\u0E07\u0E08\u0E32\u0E01\u0E17\u0E49\u0E2D\u0E07\u0E1F\u0E49\u0E32\u0E22\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E41\u0E1C\u0E07\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48) \xB7 \u0E19\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E2D\u0E32\u0E04\u0E32\u0E23/\u0E1C\u0E34\u0E27\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E44\u0E27\u0E49 \u0E41\u0E25\u0E30\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07"))), !!(energy.chain && energy.chain.length) && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 13
  }), "\u0E41\u0E1C\u0E19\u0E20\u0E32\u0E1E\u0E04\u0E48\u0E32\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49 \u2192 \u0E44\u0E1F\u0E17\u0E35\u0E48\u0E02\u0E32\u0E22\u0E44\u0E14\u0E49 \u0E40\u0E2B\u0E25\u0E37\u0E2D ", energy.chain[energy.chain.length - 1].pct, "%")), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E44\u0E25\u0E48\u0E08\u0E32\u0E01\u0E41\u0E2A\u0E07\u0E17\u0E35\u0E48\u0E15\u0E01\u0E1A\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E1C\u0E07\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35\u0E25\u0E07\u0E21\u0E32\u0E17\u0E35\u0E25\u0E30\u0E14\u0E48\u0E32\u0E19\u0E08\u0E19\u0E16\u0E36\u0E07\u0E44\u0E1F AC \u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E17\u0E38\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E21\u0E32\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E40\u0E27\u0E25\u0E32\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E33\u0E19\u0E27\u0E13\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E08\u0E36\u0E07\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E1B\u0E35\u0E41\u0E23\u0E01\u0E40\u0E1B\u0E4A\u0E30"), React.createElement(SuLossFlow, {
    chain: energy.chain
  }), React.createElement("span", {
    className: "p3-note"
  }, React.createElement("b", null, "Performance Ratio ", energy.pr, "%"), " \u0E04\u0E37\u0E2D\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E2B\u0E32\u0E23\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E41\u0E23\u0E01 \u2014 \u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E02\u0E49\u0E32\u0E21\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23\u0E44\u0E14\u0E49 \u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E19\u0E43\u0E08\u0E27\u0E48\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E2B\u0E19\u0E41\u0E14\u0E14\u0E41\u0E23\u0E07\u0E01\u0E27\u0E48\u0E32\u0E01\u0E31\u0E19 (\u0E07\u0E32\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E1A\u0E49\u0E32\u0E19\u0E43\u0E19\u0E44\u0E17\u0E22\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E14\u0E35\u0E21\u0E31\u0E01\u0E44\u0E14\u0E49 78\u201384%)")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 13
  }), "\u0E04\u0E48\u0E32\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E23\u0E27\u0E21 ", energy.dcLoss, "% \u0E1D\u0E31\u0E48\u0E07 DC", shade3d ? " + เงา " + energy.shadeLoss + "%" : "")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "4px 18px"
    }
  }, [["soil", "ฝุ่น/คราบบนแผง"], ["mismatch", "แผงไม่เท่ากัน (mismatch)"], ["wire", "สูญเสียในสาย DC"]].concat(shade3d ? [] : [["shade", "เงาบัง"]]).concat([["avail", "ระบบหยุด/ซ่อมบำรุง"]]).map(([k, lb]) => React.createElement(P3NumRange, {
    key: k,
    span: true,
    label: lb,
    value: S.loss[k],
    min: 0,
    max: 15,
    step: 0.5,
    suffix: "%",
    onChange: v => set({
      loss: Object.assign({}, S.loss, {
        [k]: v
      })
    })
  }))), energy.clipLoss > 0.2 && React.createElement("div", {
    className: "su-alert " + (energy.clipLoss > 8 ? "bad" : "warn")
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), React.createElement("span", null, "DC/AC = ", energy.dcAc, " \u2192 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E23\u0E31\u0E1A\u0E44\u0E21\u0E48\u0E2B\u0E21\u0E14\u0E0A\u0E48\u0E27\u0E07\u0E41\u0E14\u0E14\u0E41\u0E23\u0E07 \u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E17\u0E34\u0E49\u0E07 ", React.createElement("b", null, energy.clipKwh.toLocaleString(), " kWh/\u0E1B\u0E35 (", energy.clipLoss, "%)"), energy.clipLoss > 8 ? " — เพิ่มขนาด/จำนวนอินเวอร์เตอร์คุ้มกว่ามาก" : " — ปกติของการออกแบบให้ DC มากกว่า AC เล็กน้อย"))), env && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "tree",
    size: 13
  }), "\u0E1C\u0E25\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E15\u0E48\u0E2D\u0E2A\u0E34\u0E48\u0E07\u0E41\u0E27\u0E14\u0E25\u0E49\u0E2D\u0E21", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E40\u0E17\u0E48\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E04\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E1B\u0E35")), React.createElement(SuEnviron, {
    env: env,
    years: S.years
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 9,
      borderTop: "1px solid var(--ln)",
      paddingTop: 10
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", null, "\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E08\u0E32\u0E01\u0E2A\u0E32\u0E22\u0E2A\u0E48\u0E07"), React.createElement("span", {
    className: "su-src " + (S.envf && S.envf.ef != null ? "edit" : "def")
  }, S.envf && S.envf.ef != null ? "แก้เอง" : "อบก."), S.envf && S.envf.ef != null && React.createElement("button", {
    className: "p3-lnk",
    style: {
      fontSize: 9.5
    },
    onClick: e => {
      e.preventDefault();
      set({
        envf: Object.assign({}, S.envf, {
          ef: null
        })
      });
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32")), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    step: "0.01",
    value: S.envf && S.envf.ef != null ? S.envf.ef : SC_ENVF.ef,
    onChange: e => set({
      envf: Object.assign({}, S.envf, {
        ef: e.target.value === "" ? null : +e.target.value
      })
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "kg/kWh"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb",
    title: "\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E44\u0E1B\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E16\u0E25\u0E38\u0E07\u0E0B\u0E34\u0E25\u0E34\u0E04\u0E2D\u0E19 \u0E1C\u0E25\u0E34\u0E15\u0E41\u0E1C\u0E07 \u0E02\u0E19\u0E2A\u0E48\u0E07 \u0E08\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014 \u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22\u0E17\u0E35\u0E48\u0E25\u0E14\u0E44\u0E14\u0E49\u0E15\u0E48\u0E2D\u0E1B\u0E35 \u0E01\u0E47\u0E44\u0E14\u0E49 '\u0E1B\u0E35\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E27\u0E01\u0E15\u0E48\u0E2D\u0E42\u0E25\u0E01\u0E08\u0E23\u0E34\u0E07 \u0E46'"
  }, "\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    step: "10",
    value: S.envf && S.envf.embod != null ? S.envf.embod : SC_ENVF.embod,
    onChange: e => set({
      envf: Object.assign({}, S.envf, {
        embod: e.target.value === "" ? null : +e.target.value
      })
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "kg/kWp")))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E19\u0E32\u0E14 ", energy.dcKw, " kWp \u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E32\u0E27 ", React.createElement("b", null, env.embodT, " tCO\u2082e"), " (\u0E16\u0E25\u0E38\u0E07\u0E0B\u0E34\u0E25\u0E34\u0E04\u0E2D\u0E19 \u0E1C\u0E25\u0E34\u0E15\u0E41\u0E1C\u0E07 \u0E02\u0E19\u0E2A\u0E48\u0E07 \u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07) \u0E41\u0E25\u0E49\u0E27\u0E25\u0E14\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49\u0E1B\u0E35\u0E25\u0E30 ", env.co2YearT, " tCO\u2082e \u2192 ", React.createElement("b", null, "\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19\u0E17\u0E32\u0E07\u0E04\u0E32\u0E23\u0E4C\u0E1A\u0E2D\u0E19\u0E43\u0E19 ", env.carbonPayback, " \u0E1B\u0E35"), env.ratio ? " และตลอด " + S.years + " ปีจะลดได้ราว " + env.ratio + " เท่าของที่ใช้ไปตอนสร้าง" : "", " \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E1C\u0E25\u0E04\u0E33\u0E19\u0E27\u0E13\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E02\u0E2D\u0E07\u0E2D\u0E38\u0E15\u0E2A\u0E32\u0E2B\u0E01\u0E23\u0E23\u0E21")), px && React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "probe",
    size: 13
  }), "\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E43\u0E08\u0E02\u0E2D\u0E07\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 \xB7 P50 / P90", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide",
    style: {
      marginLeft: "auto"
    }
  }, [["avg", "เฉลี่ยตลอด " + px.years + " ปี"], ["one", "ปีใดปีหนึ่ง"]].map(([k, t]) => React.createElement("button", {
    key: k,
    "data-on": pxMode === k ? "1" : "0",
    onClick: () => setPxMode(k)
  }, t)))), React.createElement(SuPxx, {
    px: px,
    mode: pxMode
  }), React.createElement("div", {
    className: "su-tiles"
  }, [["P50 · ค่ากลาง", px.p50, "kWh/ปี", "โอกาสได้มากกว่านี้ครึ่งหนึ่ง"], ["P90 · แบบระมัดระวัง", pxMode === "one" ? px.p90one : px.p90avg, "kWh/ปี", "มั่นใจ 90% ว่าไม่ต่ำกว่านี้"], ["ต่ำกว่าค่ากลาง", scR(100 - (pxMode === "one" ? px.p90one : px.p90avg) / (px.p50 || 1) * 100, 1), "%", "ส่วนต่างที่ควรเผื่อไว้ตอนเสนอราคา"], ["ความไม่แน่นอนรวม", pxMode === "one" ? px.sigma1 : px.sigmaN, "% (1σ)", "รวมทุกก้อนแบบรากที่สองของผลบวกกำลังสอง"]].map(([k, v, u, d]) => React.createElement("div", {
    key: k
  }, React.createElement("span", {
    className: "k"
  }, k), React.createElement("span", {
    className: "v"
  }, typeof v === "number" ? v.toLocaleString() : v, React.createElement("small", null, u)), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 9
    }
  }, px.parts.map(p => React.createElement("label", {
    key: p.k,
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, p.label), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    min: "0",
    max: "20",
    value: uncCfg[p.k],
    onChange: e => setUnc({
      [p.k]: scClamp(+e.target.value || 0, 0, 20)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\xB1 %"))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E17\u0E35\u0E48\u0E04\u0E33\u0E19\u0E27\u0E13\u0E21\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07 (P50) \u2014 \u0E1B\u0E35\u0E17\u0E35\u0E48\u0E40\u0E21\u0E06\u0E40\u0E22\u0E2D\u0E30\u0E08\u0E30\u0E44\u0E14\u0E49\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E1B\u0E35\u0E17\u0E35\u0E48\u0E41\u0E14\u0E14\u0E14\u0E35\u0E08\u0E30\u0E44\u0E14\u0E49\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E2A\u0E19\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E37\u0E48\u0E19\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23 \u0E43\u0E2B\u0E49\u0E22\u0E36\u0E14 ", React.createElement("b", null, "P90 = ", (pxMode === "one" ? px.p90one : px.p90avg).toLocaleString(), " kWh/\u0E1B\u0E35"), " \u0E08\u0E30\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E01\u0E27\u0E48\u0E32 \xB7 \u0E21\u0E2D\u0E07\u0E22\u0E32\u0E27\u0E2B\u0E25\u0E32\u0E22\u0E1B\u0E35\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1B\u0E23\u0E1B\u0E23\u0E27\u0E19\u0E02\u0E2D\u0E07\u0E41\u0E2A\u0E07\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 P90 \u0E08\u0E36\u0E07\u0E02\u0E22\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32\u0E43\u0E01\u0E25\u0E49\u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07\u0E21\u0E32\u0E01\u0E02\u0E36\u0E49\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end"
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: () => setStep(2)
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("label", {
    className: "p3-f",
    style: {
      width: 108
    }
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E1B\u0E35"), React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "1",
    max: "30",
    step: "1",
    value: S.years,
    onChange: e => set({
      years: scClamp(+e.target.value || 15, 1, 30)
    })
  })), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 20px"
    },
    onClick: () => setStep(4)
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E42\u0E2B\u0E25\u0E14 & \u0E41\u0E1A\u0E15", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  })))), step === 3 && !energy && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E22\u0E31\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07\u0E41\u0E25\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07\u0E01\u0E48\u0E2D\u0E19"), step === 4 && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 13
  }), "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E41\u0E1A\u0E1A\u0E44\u0E2B\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, prof.annual > 0 ? prof.annual.toLocaleString() + " หน่วย/ปี" : "ยังไม่ได้กรอก")), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49 \u0E41\u0E15\u0E48 ", React.createElement("b", null, "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E44\u0E1F\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19"), " \u2014 \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07\u0E17\u0E31\u0E19\u0E17\u0E35\u0E21\u0E35\u0E04\u0E48\u0E32\u0E40\u0E17\u0E48\u0E32\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E40\u0E15\u0E47\u0E21 \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E41\u0E04\u0E48\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19 \u0E01\u0E23\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: 9
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E25\u0E31\u0E01\u0E29\u0E13\u0E30\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E44\u0E1F"), React.createElement("select", {
    className: "p3-inp",
    value: loadCfg.preset,
    onChange: e => setLoad({
      preset: e.target.value
    })
  }, Object.keys(SC_LOADS).map(k => React.createElement("option", {
    key: k,
    value: k
  }, SC_LOADS[k].label)))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, loadCfg.mode === "year" ? "ใช้ไฟทั้งปี" : "ใช้ไฟเฉลี่ยเดือนละ"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "10",
    min: "0",
    value: loadCfg.mode === "year" ? loadCfg.kwhYear : loadCfg.kwhMonth,
    onChange: e => setLoad(loadCfg.mode === "year" ? {
      kwhYear: +e.target.value || 0
    } : {
      kwhMonth: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19"), React.createElement("select", {
    className: "p3-inp",
    value: loadCfg.mode,
    onChange: e => setLoad({
      mode: e.target.value
    })
  }, React.createElement("option", {
    value: "month"
  }, "\u0E15\u0E48\u0E2D\u0E40\u0E14\u0E37\u0E2D\u0E19 (\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E08\u0E32\u0E01\u0E1A\u0E34\u0E25)"), React.createElement("option", {
    value: "year"
  }, "\u0E15\u0E48\u0E2D\u0E1B\u0E35")))), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, prof.hint), loadCfg.preset === "custom" && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E23\u0E32\u0E22\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-h24"
  }, (loadCfg.shape && loadCfg.shape.length === 24 ? loadCfg.shape : SC_LOADS.custom.shape).map((v, h) => React.createElement("label", {
    key: h
  }, React.createElement("i", null, h), React.createElement("input", {
    type: "number",
    step: "0.5",
    min: "0",
    value: v,
    onChange: e => {
      const arr = (loadCfg.shape && loadCfg.shape.length === 24 ? loadCfg.shape : SC_LOADS.custom.shape).slice();
      arr[h] = Math.max(0, +e.target.value || 0);
      setLoad({
        shape: arr
      });
    }
  })))), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, "\u0E43\u0E2A\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E19\u0E01\u0E47\u0E1E\u0E2D (\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19 2 \u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 8) \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E41\u0E25\u0E49\u0E27\u0E04\u0E39\u0E13\u0E14\u0E49\u0E27\u0E22\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E08\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07")), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 2
    }
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E44\u0E2B\u0E19\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E1B\u0E01\u0E15\u0E34", React.createElement("span", {
    className: "ln"
  }), React.createElement("button", {
    className: "p3-b sm",
    onClick: () => setLoad({
      monScale: SC_MONSCALE_AC.slice()
    })
  }, "\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E49\u0E2D\u0E19\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E2D\u0E23\u0E4C"), React.createElement("button", {
    className: "p3-b sm",
    onClick: () => setLoad({
      monScale: null
    })
  }, "\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E38\u0E01\u0E40\u0E14\u0E37\u0E2D\u0E19")), React.createElement("div", {
    className: "su-h24"
  }, SC_MON.map((mo, m) => React.createElement("label", {
    key: m
  }, React.createElement("i", null, mo), React.createElement("input", {
    type: "number",
    step: "1",
    min: "0",
    value: loadCfg.monScale && loadCfg.monScale.length === 12 ? loadCfg.monScale[m] : 100,
    onChange: e => {
      const arr = loadCfg.monScale && loadCfg.monScale.length === 12 ? loadCfg.monScale.slice() : new Array(12).fill(100);
      arr[m] = Math.max(0, +e.target.value || 0);
      setLoad({
        monScale: arr
      });
    }
  })))), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E1B\u0E47\u0E19 % \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E04\u0E48\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 \u2014 \u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E49\u0E27\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35\u0E22\u0E31\u0E07\u0E40\u0E17\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21 \u0E41\u0E04\u0E48\u0E22\u0E49\u0E32\u0E22\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E44\u0E1B\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E40\u0E22\u0E2D\u0E30\u0E01\u0E27\u0E48\u0E32")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "link",
    size: 13
  }), "\u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E1D\u0E31\u0E48\u0E07\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-pick"
  }, [["sell", "ขายคืนได้ไม่จำกัด", "ขนานไฟแล้วปล่อยส่วนเกินเข้าระบบได้เต็มที่"], ["limit", "จำกัดกำลังที่ปล่อยได้", "การไฟฟ้าอนุญาตให้ไหลย้อนได้ไม่เกินค่าที่กำหนด"], ["zero", "ห้ามไหลย้อน (zero export)", "ต้องติดมิเตอร์ตรวจจับ + สั่งอินเวอร์เตอร์หรี่กำลังลง"]].map(([k, h, d]) => React.createElement("button", {
    key: k,
    "data-on": gridCfg.mode === k ? "1" : "0",
    onClick: () => setGrid({
      mode: k
    })
  }, React.createElement("span", {
    className: "h"
  }, h), React.createElement("span", {
    className: "d"
  }, d)))), gridCfg.mode === "limit" && React.createElement("label", {
    className: "p3-f",
    style: {
      maxWidth: 220
    }
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E2D\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    min: "0",
    value: gridCfg.expLimitKw,
    onChange: e => setGrid({
      expLimitKw: Math.max(0, +e.target.value || 0)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "kW"))), dis && dis.curt > 0 && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E23\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E34\u0E49\u0E07\u0E1B\u0E35\u0E25\u0E30 ", React.createElement("b", null, "\xA0", dis.curt.toLocaleString(), " \u0E2B\u0E19\u0E48\u0E27\u0E22 (", dis.curtPct, "%)"), "\xA0 \u2014", dis.on ? " ลองเพิ่มความจุแบตหรือกำลังชาร์จ จะเก็บส่วนนี้ไว้ใช้ตอนเย็นได้" : " แบตเตอรี่จะช่วยเก็บส่วนนี้ไว้ใช้ทีหลังแทนที่จะทิ้งไปเปล่า ๆ")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "box",
    size: 13
  }), "\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "p3-seg wide",
    style: {
      marginLeft: "auto"
    }
  }, React.createElement("button", {
    "data-on": !battCfg.on ? "1" : "0",
    onClick: () => setBatt({
      on: false
    })
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E1A\u0E15"), React.createElement("button", {
    "data-on": battCfg.on ? "1" : "0",
    onClick: () => setBatt({
      on: true
    })
  }, "\u0E21\u0E35\u0E41\u0E1A\u0E15"))), battCfg.on && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 9
    }
  }, React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E0A\u0E19\u0E34\u0E14\u0E40\u0E0B\u0E25\u0E25\u0E4C"), React.createElement("select", {
    className: "p3-inp",
    value: battCfg.chem,
    onChange: e => {
      const c = SC_CHEM[e.target.value] || SC_CHEM.lfp;
      setBatt({
        chem: e.target.value,
        dod: c.dod,
        rte: c.rte,
        cycles: c.cycles,
        calYears: c.calYears,
        eol: c.eol,
        cost: c.cost
      });
    }
  }, Object.keys(SC_CHEM).map(k => React.createElement("option", {
    key: k,
    value: k
  }, SC_CHEM[k].label)))), [["kwh", "ความจุตามป้าย", "kWh", 0.5], ["dod", "ใช้ได้จริง (DoD)", "%", 1], ["pKw", "ชาร์จ/จ่ายสูงสุด", "kW", 0.5], ["rte", "ประสิทธิภาพไป-กลับ", "%", 0.5], ["reserve", "กันไว้เผื่อไฟดับ", "%", 5], ["standby", "แบตกินเองต่อวัน", "%", 0.1], ["cycles", "จำนวนรอบจนหมดอายุ", "รอบ", 100], ["calYears", "อายุปฏิทิน", "ปี", 1], ["degY", "เสื่อมปีละ", "%", 0.5]].map(([k, lb, sfx, stp]) => React.createElement("label", {
    key: k,
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, lb), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: stp,
    min: "0",
    value: battCfg[k],
    onChange: e => setBatt({
      [k]: Math.max(0, +e.target.value || 0)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, sfx)))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E34\u0E14\u0E23\u0E32\u0E04\u0E32\u0E41\u0E1A\u0E1A"), React.createElement("select", {
    className: "p3-inp",
    value: battCfg.costMode,
    onChange: e => setBatt({
      costMode: e.target.value
    })
  }, React.createElement("option", {
    value: "perKwh"
  }, "\u0E1A\u0E32\u0E17\u0E15\u0E48\u0E2D kWh"), React.createElement("option", {
    value: "lump"
  }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, battCfg.costMode === "lump" ? "ราคารวมทั้งชุด" : "ราคาต่อ kWh"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "500",
    min: "0",
    value: battCfg.costMode === "lump" ? battCfg.lump : battCfg.cost,
    onChange: e => setBatt(battCfg.costMode === "lump" ? {
      lump: +e.target.value || 0
    } : {
      cost: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17")))), React.createElement("div", {
    className: "su-tiles"
  }, [["ใช้งานได้จริง", battS.usable, "kWh", "ความจุป้าย × DoD"], ["ส่วนที่ลดค่าไฟได้", battS.work, "kWh", "หักที่กันไว้เผื่อไฟดับแล้ว"], ["ใช้ไปปีละ", dis && dis.on ? dis.cycles : 0, "รอบ", "จากการจำลองจ่ายไฟจริงทั้งปี"], ["น่าจะอยู่ได้", dis && dis.battLife != null ? dis.battLife : "—", "ปี", dis && dis.byCycle != null && dis.byCycle < scNum(battCfg.calYears) ? "หมดรอบก่อนหมดอายุปฏิทิน" : "หมดอายุปฏิทินก่อนใช้ครบรอบ"], ["เงินค่าแบต", battS.capex, "บาท", "รวมอยู่ในเงินลงทุนของขั้นถัดไปแล้ว"]].map(([k, v, u, d]) => React.createElement("div", {
    key: k
  }, React.createElement("span", {
    className: "k"
  }, k), React.createElement("span", {
    className: "v"
  }, typeof v === "number" ? v.toLocaleString() : v, React.createElement("small", null, u)), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, "\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E14\u0E39\u0E08\u0E32\u0E01\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15\u0E02\u0E2D\u0E07\u0E41\u0E1A\u0E15\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A: \u0E04\u0E27\u0E32\u0E21\u0E08\u0E38\u0E1B\u0E49\u0E32\u0E22 \xB7 DoD \xB7 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E0A\u0E32\u0E23\u0E4C\u0E08/\u0E08\u0E48\u0E32\u0E22 (\u0E40\u0E2D\u0E32\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E15\u0E31\u0E27\u0E41\u0E1A\u0E15\u0E01\u0E31\u0E1A\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E44\u0E2E\u0E1A\u0E23\u0E34\u0E14) \xB7 \u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E\u0E44\u0E1B-\u0E01\u0E25\u0E31\u0E1A \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19 \xB7 \u0E2D\u0E32\u0E22\u0E38\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19 \xB7 \u0E04\u0E27\u0E32\u0E21\u0E08\u0E38\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E15\u0E2D\u0E19\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 \xB7 \u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E0A\u0E47\u0E04\u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E2D\u0E32\u0E21\u0E32\u0E04\u0E34\u0E14\u0E40\u0E07\u0E34\u0E19\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E23\u0E30\u0E1A\u0E1A (48V \u0E2B\u0E23\u0E37\u0E2D HV) \u0E27\u0E48\u0E32\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E44\u0E2E\u0E1A\u0E23\u0E34\u0E14\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E2B\u0E21 \xB7 \u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \xB7 \u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 IEC 62619 / \u0E21\u0E2D\u0E01. \xB7 \u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19")), !battCfg.on && React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E41\u0E1A\u0E15 \u2014 \u0E44\u0E1F\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E40\u0E01\u0E34\u0E19\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19\u0E17\u0E35\u0E48\u0E23\u0E32\u0E04\u0E32\u0E16\u0E39\u0E01\u0E01\u0E27\u0E48\u0E32\u0E04\u0E48\u0E32\u0E44\u0E1F (\u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E39\u0E01\u0E15\u0E31\u0E14\u0E17\u0E34\u0E49\u0E07\u0E16\u0E49\u0E32\u0E2B\u0E49\u0E32\u0E21\u0E44\u0E2B\u0E25\u0E22\u0E49\u0E2D\u0E19) \u0E01\u0E14 \u201C\u0E21\u0E35\u0E41\u0E1A\u0E15\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E27\u0E48\u0E32\u0E04\u0E38\u0E49\u0E21\u0E44\u0E2B\u0E21\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E01\u0E47\u0E1A\u0E44\u0E27\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E2D\u0E19\u0E40\u0E22\u0E47\u0E19")), dis ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "su-tiles"
  }, [["ผลิตแล้วได้ใช้เอง", dis.selfPct, "%", (dis.direct + dis.dis).toLocaleString() + " จาก " + dis.pv.toLocaleString() + " หน่วย/ปี", dis.selfPct >= 60], ["ไฟที่ใช้มาจากโซลาร์", dis.suffPct, "%", "ที่เหลือยังต้องซื้อ " + dis.imp.toLocaleString() + " หน่วย/ปี", dis.suffPct >= 40], ["ขายคืนการไฟฟ้า", dis.expPct, "%", dis.exp.toLocaleString() + " หน่วย/ปี", null], ["ตัดทิ้งเพราะห้ามไหลย้อน", dis.curtPct, "%", dis.curt.toLocaleString() + " หน่วย/ปี", dis.curt > 0 ? false : true]].map(([k, v, u, d, good]) => React.createElement("div", {
    key: k,
    "data-good": good == null ? undefined : good ? "1" : "0"
  }, React.createElement("span", {
    className: "k"
  }, k), React.createElement("span", {
    className: "v"
  }, v, React.createElement("small", null, u)), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "curve",
    size: 13
  }), "\u0E44\u0E1F\u0E17\u0E31\u0E49\u0E07\u0E27\u0E31\u0E19\u0E44\u0E2B\u0E25\u0E44\u0E1B\u0E44\u0E2B\u0E19 \xB7 ", SC_MON[flowMon], React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    className: "su-mstep"
  }, React.createElement("button", {
    onClick: () => setFlowMon((flowMon + 11) % 12),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"
  }, React.createElement(P3Icon, {
    name: "arrow",
    size: 12
  })), React.createElement("b", null, SC_MON[flowMon]), React.createElement("button", {
    onClick: () => setFlowMon((flowMon + 1) % 12),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B"
  }, React.createElement(P3Icon, {
    name: "arrow",
    size: 12
  })))), React.createElement("span", {
    className: "p3-note",
    style: {
      marginTop: -2
    }
  }, "\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49\u0E43\u0E19\u0E27\u0E31\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 \u0E16\u0E39\u0E01\u0E40\u0E2D\u0E32\u0E44\u0E1B\u0E17\u0E33\u0E2D\u0E30\u0E44\u0E23\u0E1A\u0E49\u0E32\u0E07"), React.createElement(SuFlowDay, {
    rows: dis.dayRows[flowMon],
    mode: "pv",
    on: dis.on
  }), React.createElement("div", {
    className: "su-flg"
  }, ["direct", "chg", "exp", "curt"].map(k => React.createElement("span", {
    key: k
  }, React.createElement("i", {
    style: {
      background: SU_FLOW[k].c
    }
  }), SU_FLOW[k].label)), dis.on && React.createElement("span", null, React.createElement("i", {
    className: "dash"
  }), "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E44\u0E1F\u0E43\u0E19\u0E41\u0E1A\u0E15 (0\u2013100%)")), React.createElement("span", {
    className: "p3-eb",
    style: {
      marginTop: 6
    }
  }, "\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E0A\u0E49 \u0E21\u0E32\u0E08\u0E32\u0E01\u0E44\u0E2B\u0E19", React.createElement("span", {
    className: "ln"
  })), React.createElement(SuFlowDay, {
    rows: dis.dayRows[flowMon],
    mode: "load",
    on: dis.on
  }), React.createElement("div", {
    className: "su-flg"
  }, ["direct", "dis", "imp"].map(k => React.createElement("span", {
    key: k
  }, React.createElement("i", {
    style: {
      background: SU_FLOW[k].c
    }
  }), SU_FLOW[k].label)))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 13
  }), "\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("th", null, "\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49"), React.createElement("th", null, "\u0E43\u0E0A\u0E49\u0E44\u0E1F"), React.createElement("th", null, "\u0E43\u0E0A\u0E49\u0E15\u0E23\u0E07 \u0E46"), dis.on && React.createElement("th", null, "\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E15"), React.createElement("th", null, "\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19"), dis.curt > 0 && React.createElement("th", null, "\u0E15\u0E31\u0E14\u0E17\u0E34\u0E49\u0E07"), React.createElement("th", null, "\u0E0B\u0E37\u0E49\u0E2D\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("th", null, "\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07 %"))), React.createElement("tbody", null, dis.months.map(mo => React.createElement("tr", {
    key: mo.m,
    "data-on": mo.m === flowMon ? "1" : "0",
    onClick: () => setFlowMon(mo.m),
    style: {
      cursor: "pointer"
    }
  }, React.createElement("td", null, React.createElement("b", null, mo.label)), React.createElement("td", null, Math.round(mo.pv).toLocaleString()), React.createElement("td", null, Math.round(mo.load).toLocaleString()), React.createElement("td", null, Math.round(mo.direct).toLocaleString()), dis.on && React.createElement("td", null, Math.round(mo.dis).toLocaleString()), React.createElement("td", null, Math.round(mo.exp).toLocaleString()), dis.curt > 0 && React.createElement("td", {
    style: {
      color: mo.curt > 0 ? "var(--dngr)" : undefined
    }
  }, Math.round(mo.curt).toLocaleString()), React.createElement("td", null, Math.round(mo.imp).toLocaleString()), React.createElement("td", null, React.createElement("b", null, mo.selfPct))))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E1B\u0E47\u0E19 kWh \xB7 \u0E01\u0E14\u0E17\u0E35\u0E48\u0E41\u0E16\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E01\u0E23\u0E32\u0E1F\u0E23\u0E32\u0E22\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E31\u0E49\u0E19", dis.on ? " · ไฟหายไปในการเก็บ-จ่ายของแบตปีละ " + dis.battLoss.toLocaleString() + " หน่วย (ประสิทธิภาพไป-กลับ " + battCfg.rte + "%)" : ""))) : React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E22\u0E31\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E01\u0E48\u0E2D\u0E19 (\u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01 \u0E02\u0E31\u0E49\u0E19\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E2A\u0E44\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C \u201C\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07\u0E01\u0E35\u0E48 %\u201D \u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "space-between"
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: () => setStep(3)
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 20px"
    },
    onClick: () => setStep(5)
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \xB7 \u0E04\u0E37\u0E19\u0E17\u0E38\u0E19", React.createElement(P3Icon, {
    name: "arrow",
    size: 14
  })))), step === 5 && roi && React.createElement(React.Fragment, null, px && React.createElement("div", {
    className: "p3-card",
    style: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      padding: "11px 13px"
    }
  }, React.createElement("span", {
    className: "p3-eb",
    style: {
      margin: 0
    }
  }, React.createElement(P3Icon, {
    name: "probe",
    size: 13
  }), "\u0E04\u0E34\u0E14\u0E17\u0E35\u0E48\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E43\u0E08"), React.createElement("span", {
    className: "p3-seg wide"
  }, React.createElement("button", {
    "data-on": roiP === "p50" ? "1" : "0",
    onClick: () => setRoiP("p50")
  }, "P50 \xB7 \u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07"), React.createElement("button", {
    "data-on": roiP === "p90" ? "1" : "0",
    onClick: () => setRoiP("p90")
  }, "P90 \xB7 \u0E23\u0E30\u0E21\u0E31\u0E14\u0E23\u0E30\u0E27\u0E31\u0E07")), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0,
      flex: 1,
      minWidth: 200,
      border: "none",
      padding: 0
    }
  }, "\u0E43\u0E0A\u0E49\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 ", React.createElement("b", null, Math.round(energy.annual * roi.kYield).toLocaleString(), " kWh/\u0E1B\u0E35"), roiP === "p90" ? " (ต่ำกว่าค่ากลาง " + scR((1 - roi.kYield) * 100, 1) + "% เผื่อปีที่แดดไม่ดี)" : " (ค่ากลาง — โอกาสได้มากกว่านี้ครึ่งหนึ่ง)")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, [["คืนทุนภายใน", roi.payback ? roi.payback : "ไม่คืนใน " + roi.years, roi.payback ? "ปี" : "ปี", roi.payback && roi.payback <= 8], ["ผลตอบแทน IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี", roi.irr != null && roi.irr >= 8], ["มูลค่าปัจจุบันสุทธิ", Math.round(roi.npv / 1000).toLocaleString(), "พันบาท", roi.npv > 0], ["ต้นทุนไฟที่ผลิตเอง", roi.lcoe, "บาท/หน่วย", roi.lcoe < scNum(roiCfg.tariff)]].map(([k, v, u, good]) => React.createElement("div", {
    key: k,
    className: "p3-card",
    style: {
      gap: 3,
      padding: "12px 13px"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, k), React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-.5px",
      lineHeight: 1.15,
      color: good ? "var(--acd)" : "var(--text-1)"
    }
  }, v), React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, u)))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "coin",
    size: 13
  }), "\u0E40\u0E07\u0E34\u0E19\u0E25\u0E07\u0E17\u0E38\u0E19\u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E44\u0E1F", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-pick",
    style: {
      gap: 8
    }
  }, [["perWp", "คิดเป็นบาทต่อวัตต์", "เหมาะกับตอนเสนอราคา — ระบบคูณกำลังติดตั้งให้เอง"], ["lump", "กรอกยอดรวมทั้งโครงการ", "ใช้ยอดตามสัญญาจริง รวมทุกอย่างแล้ว"]].map(([k, h, d]) => React.createElement("button", {
    key: k,
    "data-on": roiCfg.costMode === k ? "1" : "0",
    onClick: () => setRoi({
      costMode: k
    })
  }, React.createElement("span", {
    className: "h"
  }, h), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))",
      gap: 9
    }
  }, roiCfg.costMode === "perWp" ? React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E15\u0E15\u0E4C"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    value: roiCfg.perWp,
    onChange: e => setRoi({
      perWp: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17/W"))) : React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "1000",
    value: roiCfg.lump,
    onChange: e => setRoi({
      lump: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E44\u0E14\u0E49"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.05",
    value: roiCfg.tariff,
    onChange: e => setRoi({
      tariff: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E02\u0E36\u0E49\u0E19\u0E1B\u0E35\u0E25\u0E30"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    value: roiCfg.escal,
    onChange: e => setRoi({
      escal: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "%"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E25\u0E30"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.05",
    value: roiCfg.exportRate,
    onChange: e => setRoi({
      exportRate: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E48\u0E32\u0E14\u0E39\u0E41\u0E25\u0E23\u0E31\u0E01\u0E29\u0E32\u0E15\u0E48\u0E2D\u0E1B\u0E35"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.1",
    value: roiCfg.om,
    onChange: e => setRoi({
      om: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "% \u0E02\u0E2D\u0E07\u0E04\u0E48\u0E32\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E34\u0E14\u0E25\u0E14"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    value: roiCfg.discount,
    onChange: e => setRoi({
      discount: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "%"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E21\u0E2D\u0E07\u0E44\u0E1B\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "5",
    max: "30",
    step: "1",
    value: roiCfg.years,
    onChange: e => setRoi({
      years: scClamp(+e.target.value || 25, 5, 30)
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1B\u0E35"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E1B\u0E35\u0E17\u0E35\u0E48"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    min: "0",
    max: "30",
    step: "1",
    value: roiCfg.invRepYear,
    onChange: e => setRoi({
      invRepYear: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1B\u0E35"))), React.createElement("label", {
    className: "p3-f"
  }, React.createElement("span", {
    className: "lb"
  }, "\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "1000",
    value: roiCfg.invRepCost,
    onChange: e => setRoi({
      invRepCost: +e.target.value || 0
    })
  }), React.createElement("span", {
    className: "p3-sfx"
  }, "\u0E1A\u0E32\u0E17")))), dis ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "su-tiles"
  }, [["ใช้เอง", scR(dis.fSelf * 100, 1), "%", "คิดที่ค่าไฟเต็ม " + roiCfg.tariff + " บาท/หน่วย"], ["ขายคืน", scR(dis.fExp * 100, 1), "%", "คิดที่ " + roiCfg.exportRate + " บาท/หน่วย"], ["ตัดทิ้ง", scR(dis.fCurt * 100, 1), "%", "ไม่ได้เงินเลย"], ["เงินค่าแบต", roi.battCapex, "บาท", roi.battCapex > 0 ? "เปลี่ยนใหม่ทุก " + battRepYear + " ปี" : "ไม่มีแบตในระบบนี้"]].map(([k, v, u, d]) => React.createElement("div", {
    key: k
  }, React.createElement("span", {
    className: "k"
  }, k), React.createElement("span", {
    className: "v"
  }, typeof v === "number" ? v.toLocaleString() : v, React.createElement("small", null, u)), React.createElement("span", {
    className: "d"
  }, d)))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E14\u0E32 \u2014 \u0E21\u0E32\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E15\u0E48\u0E2D\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35\u0E43\u0E19\u0E02\u0E31\u0E49\u0E19 \u201C\u0E42\u0E2B\u0E25\u0E14 & \u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48\u201D \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49\u0E01\u0E31\u0E1A\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E08\u0E30\u0E41\u0E01\u0E49\u0E44\u0E14\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19\u0E19\u0E31\u0E49\u0E19")) : React.createElement(React.Fragment, null, React.createElement(P3NumRange, {
    label: "\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49 \u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07\u0E01\u0E35\u0E48 %",
    value: roiCfg.selfUse,
    min: 0,
    max: 100,
    step: 5,
    suffix: "%",
    onChange: v => setRoi({
      selfUse: v
    })
  }), React.createElement("span", {
    className: "p3-note"
  }, "\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E40\u0E2D\u0E07\u0E04\u0E34\u0E14\u0E17\u0E35\u0E48\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E40\u0E15\u0E47\u0E21 ", React.createElement("b", null, roiCfg.tariff, " \u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"), " \xB7 \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D ", 100 - scNum(roiCfg.selfUse), "% \u0E04\u0E34\u0E14\u0E17\u0E35\u0E48\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19 ", React.createElement("b", null, roiCfg.exportRate, " \u0E1A\u0E32\u0E17"), " \u2014 \u0E2D\u0E22\u0E32\u0E01\u0E44\u0E14\u0E49\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E41\u0E21\u0E48\u0E19\u0E01\u0E27\u0E48\u0E32\u0E19\u0E35\u0E49 \u0E43\u0E2B\u0E49\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E01\u0E23\u0E2D\u0E01\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E44\u0E1F\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E19\u0E02\u0E31\u0E49\u0E19 \u201C\u0E42\u0E2B\u0E25\u0E14 & \u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48\u201D \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E08\u0E33\u0E25\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E17\u0E35\u0E25\u0E30\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E31\u0E49\u0E07\u0E1B\u0E35"))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "curve",
    size: 13
  }), "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E2A\u0E30\u0E2A\u0E21", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, "\u0E25\u0E07\u0E17\u0E38\u0E19 ", roi.capex.toLocaleString(), " \u0E1A\u0E32\u0E17", roi.battCapex > 0 ? " · โซลาร์ " + roi.pvCapex.toLocaleString() + " (" + roi.perWp + " บาท/W) + แบต " + roi.battCapex.toLocaleString() : " (" + roi.perWp + " บาท/W)")), React.createElement(SuCash, {
    roi: roi
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E1B\u0E35\u0E41\u0E23\u0E01 ", React.createElement("b", null, roi.rows[0].net.toLocaleString()), " \u0E1A\u0E32\u0E17"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E23\u0E27\u0E21 ", roi.years, " \u0E1B\u0E35 ", React.createElement("b", null, Math.round(roi.totalSave / 1000).toLocaleString()), " \u0E1E\u0E31\u0E19\u0E1A\u0E32\u0E17"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34 ", React.createElement("b", null, Math.round(roi.netTotal / 1000).toLocaleString()), " \u0E1E\u0E31\u0E19\u0E1A\u0E32\u0E17"), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E1C\u0E25\u0E34\u0E15\u0E23\u0E27\u0E21 ", React.createElement("b", null, Math.round(roi.totalKwh / 1000).toLocaleString()), " MWh"))), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 13
  }), "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14", React.createElement("span", {
    className: "ln"
  })), React.createElement("div", {
    className: "su-scroll",
    style: {
      maxHeight: 320,
      overflowY: "auto"
    }
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E1B\u0E35"), React.createElement("th", null, "\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15"), React.createElement("th", null, "\u0E40\u0E2B\u0E25\u0E37\u0E2D %"), React.createElement("th", null, "\u0E1B\u0E23\u0E30\u0E2B\u0E22\u0E31\u0E14\u0E04\u0E48\u0E32\u0E44\u0E1F"), React.createElement("th", null, "\u0E02\u0E32\u0E22\u0E04\u0E37\u0E19"), React.createElement("th", null, "\u0E04\u0E48\u0E32\u0E14\u0E39\u0E41\u0E25"), React.createElement("th", null, "\u0E2A\u0E38\u0E17\u0E18\u0E34"), React.createElement("th", null, "\u0E2A\u0E30\u0E2A\u0E21"))), React.createElement("tbody", null, roi.rows.map(r => React.createElement("tr", {
    key: r.year,
    "data-on": roi.payback && Math.ceil(roi.payback) === r.year ? "1" : "0"
  }, React.createElement("td", null, React.createElement("b", null, r.year)), React.createElement("td", null, r.kwh.toLocaleString()), React.createElement("td", null, r.keep), React.createElement("td", null, r.save.toLocaleString()), React.createElement("td", null, r.sell.toLocaleString()), React.createElement("td", null, (r.om + r.rep).toLocaleString()), React.createElement("td", null, React.createElement("b", null, r.net.toLocaleString())), React.createElement("td", {
    style: {
      color: r.cum >= 0 ? "var(--acd)" : "var(--text-3)",
      fontWeight: 800
    }
  }, r.cum.toLocaleString())))))), React.createElement("span", {
    className: "p3-note"
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E32\u0E17 \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E25\u0E14\u0E25\u0E07\u0E17\u0E38\u0E01\u0E1B\u0E35\u0E15\u0E32\u0E21\u0E04\u0E48\u0E32\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07 \u0E2A\u0E48\u0E27\u0E19\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19\u0E1B\u0E35\u0E25\u0E30 ", roiCfg.escal, "% \u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49")), React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb"
  }, React.createElement(P3Icon, {
    name: "cube",
    size: 13
  }), "\u0E20\u0E32\u0E1E\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34\u0E43\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, snapImg ? "พร้อมแนบ" : "ยังไม่มีภาพ")), snapImg ? React.createElement("img", {
    src: snapImg,
    alt: "\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34",
    style: {
      width: "100%",
      maxHeight: 260,
      objectFit: "contain",
      borderRadius: 11,
      border: "1px solid var(--ln)",
      background: "var(--surface2)",
      display: "block"
    }
  }) : React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0
    }
  }, "\u0E22\u0E31\u0E07\u0E16\u0E48\u0E32\u0E22\u0E20\u0E32\u0E1E\u0E09\u0E32\u0E01 3 \u0E21\u0E34\u0E15\u0E34\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E1B\u0E01\u0E15\u0E34 \u0E41\u0E04\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    className: "p3-b sm",
    disabled: typeof snap !== "function",
    onClick: () => {
      const u = snap && snap();
      if (u) setSnapImg(u);
    }
  }, React.createElement(P3Icon, {
    name: "camera",
    size: 13
  }), "\u0E16\u0E48\u0E32\u0E22\u0E43\u0E2B\u0E21\u0E48"), React.createElement("span", {
    className: "p3-note",
    style: {
      margin: 0,
      border: "none",
      padding: 0
    }
  }, "\u0E2D\u0E22\u0E32\u0E01\u0E44\u0E14\u0E49\u0E21\u0E38\u0E21\u0E2D\u0E37\u0E48\u0E19 \u2014 \u0E01\u0E14 \u201C\u0E40\u0E2A\u0E23\u0E47\u0E08\u201D \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2B\u0E21\u0E38\u0E19\u0E01\u0E25\u0E49\u0E2D\u0E07\u0E43\u0E19\u0E42\u0E2B\u0E21\u0E14 3 \u0E21\u0E34\u0E15\u0E34\u0E43\u0E2B\u0E49\u0E44\u0E14\u0E49\u0E21\u0E38\u0E21\u0E17\u0E35\u0E48\u0E0A\u0E2D\u0E1A \u0E41\u0E25\u0E49\u0E27\u0E40\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E21\u0E48 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E16\u0E48\u0E32\u0E22\u0E21\u0E38\u0E21\u0E19\u0E31\u0E49\u0E19\u0E43\u0E2B\u0E49"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "space-between"
    }
  }, React.createElement("button", {
    className: "p3-b",
    onClick: () => setStep(4)
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 20px"
    },
    onClick: () => setRepOpen(true)
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 14
  }), "\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 PDF"))), step === 5 && !roi && React.createElement("div", {
    className: "su-alert warn"
  }, React.createElement(P3Icon, {
    name: "height",
    size: 14
  }), "\u0E22\u0E31\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E01\u0E48\u0E2D\u0E19 (\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E02\u0E31\u0E49\u0E19\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15)")))), React.createElement("div", {
    className: "su-foot"
  }, React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 DC"), React.createElement("span", {
    className: "v"
  }, energy ? energy.dcKw : 0, React.createElement("small", null, "kWp"))), React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C AC"), React.createElement("span", {
    className: "v"
  }, acKw || 0, React.createElement("small", null, "kW"))), React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "DC/AC"), React.createElement("span", {
    className: "v",
    style: {
      color: energy && (energy.dcAc > 1.4 || energy.dcAc && energy.dcAc < 0.85) ? "var(--tint-amber-tx)" : undefined
    }
  }, energy ? energy.dcAc : "—")), React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, isMicro ? "ไมโคร" : "สตริง"), React.createElement("span", {
    className: "v"
  }, isMicro ? microSel ? microSel.units : 0 : plan ? plan.strings.length : 0, React.createElement("small", null, isMicro ? "ตัว" : "สตริง"))), React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E1B\u0E35\u0E41\u0E23\u0E01"), React.createElement("span", {
    className: "v"
  }, life ? life.rows[0].kwh.toLocaleString() : "—", React.createElement("small", null, "kWh"))), React.createElement("span", {
    className: "su-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E23\u0E27\u0E21 ", S.years, " \u0E1B\u0E35"), React.createElement("span", {
    className: "v"
  }, life ? Math.round(life.total / 1000).toLocaleString() : "—", React.createElement("small", null, "MWh"))), React.createElement("span", {
    style: {
      flex: 1
    }
  }), !!warns.length && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--tint-amber-tx)",
      marginRight: 12
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: "#F59E0B",
      boxShadow: "0 0 0 3px rgba(245,158,11,.22)"
    }
  }), warns.length, " \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E23\u0E41\u0E01\u0E49"), React.createElement("button", {
    className: "p3-b",
    style: {
      padding: "10px 16px",
      marginRight: 8
    },
    onClick: () => setRepOpen(true),
    disabled: !energy,
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E08\u0E30\u0E2D\u0E2D\u0E01 \u0E41\u0E25\u0E49\u0E27\u0E2A\u0E31\u0E48\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C/\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF"
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 15
  }), "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 PDF"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "10px 22px"
    },
    onClick: onClose
  }, React.createElement(P3Icon, {
    name: "check",
    size: 15
  }), "\u0E40\u0E2A\u0E23\u0E47\u0E08")), repOpen && React.createElement("div", {
    className: "su-sheet-bg",
    onMouseDown: e => {
      if (e.target === e.currentTarget) setRepOpen(false);
    }
  }, React.createElement("div", {
    className: "su-sheet"
  }, React.createElement("div", {
    className: "su-sheet-hd"
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "var(--acs)",
      display: "grid",
      placeItems: "center",
      color: "var(--acd)",
      flexShrink: 0
    }
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 15
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h4", null, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), React.createElement("p", null, "\u0E15\u0E34\u0E4A\u0E01\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E32\u0E01\u0E43\u0E2B\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E44\u0E1F\u0E25\u0E4C \u2014 \u0E40\u0E25\u0E02\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E08\u0E30\u0E44\u0E25\u0E48\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E25\u0E02\u0E02\u0E32\u0E14")), React.createElement("button", {
    className: "ghost",
    onClick: () => setRepOpen(false),
    title: "\u0E1B\u0E34\u0E14"
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), React.createElement("div", {
    className: "su-sheet-bd"
  }, (typeof RP_SECTIONS !== "undefined" ? RP_SECTIONS : []).map(s => React.createElement("div", {
    className: "grp",
    key: s.key
  }, React.createElement("button", {
    className: "su-ck",
    "data-on": repPick[s.key] ? "1" : "0",
    onClick: () => repToggle(s.key)
  }, React.createElement("span", {
    className: "bx"
  }, repPick[s.key] && React.createElement(P3Icon, {
    name: "check",
    size: 12
  })), React.createElement("span", {
    className: "tx"
  }, React.createElement("b", null, s.label), s.note && React.createElement("i", null, s.note))), (s.subs || []).map(b => React.createElement("button", {
    key: b.key,
    className: "su-ck sub",
    "data-on": repPick[b.key] ? "1" : "0",
    "data-off": repPick[s.key] ? "0" : "1",
    onClick: () => repToggle(b.key)
  }, React.createElement("span", {
    className: "bx"
  }, repPick[b.key] && React.createElement(P3Icon, {
    name: "check",
    size: 12
  })), React.createElement("span", {
    className: "tx"
  }, React.createElement("b", null, b.label), b.note && React.createElement("i", null, b.note))))))), React.createElement("div", {
    className: "su-sheet-ft"
  }, React.createElement("button", {
    className: "p3-b sm",
    onClick: () => repPreset(null),
    title: "\u0E40\u0E2D\u0E32\u0E17\u0E38\u0E01\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D"
  }, "\u0E17\u0E31\u0E49\u0E07\u0E40\u0E25\u0E48\u0E21"), React.createElement("button", {
    className: "p3-b sm",
    onClick: () => repPreset(["cover", "summary", "prod", "shade", "pxx", "env", "load", "loadDay", "loadMon", "battSpec", "roi"]),
    title: "\u0E2B\u0E19\u0E49\u0E32\u0E1B\u0E01 \xB7 \u0E2A\u0E23\u0E38\u0E1B \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 \xB7 \u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E44\u0E1F \xB7 \u0E04\u0E37\u0E19\u0E17\u0E38\u0E19 \u2014 \u0E15\u0E31\u0E14\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E17\u0E32\u0E07\u0E40\u0E17\u0E04\u0E19\u0E34\u0E04\u0E2D\u0E2D\u0E01"
  }, "\u0E09\u0E1A\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("button", {
    className: "p3-b sm",
    onClick: () => repPreset(["equip", "wiring", "layout", "iv", "ivDay", "ivYear", "ivAll", "ivMeas"]),
    title: "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \xB7 \u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D \xB7 \u0E1C\u0E31\u0E07 \xB7 \u0E40\u0E2A\u0E49\u0E19 I-V \u2014 \u0E40\u0E2D\u0E32\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49\u0E0A\u0E48\u0E32\u0E07\u0E16\u0E37\u0E2D\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"
  }, "\u0E09\u0E1A\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: repCount ? "var(--text-3)" : "var(--tint-amber-tx)",
      marginRight: 4
    }
  }, repCount ? repCount + " หัวข้อ" : "ยังไม่เลือกหัวข้อ"), React.createElement("button", {
    className: "p3-b pri",
    style: {
      padding: "9px 18px"
    },
    onClick: doReport,
    disabled: !repCount && !repPick.cover && !repPick.summary
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 14
  }), "\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19")))), repHtml && typeof SuReportView === "function" && React.createElement(SuReportView, {
    html: repHtml,
    onClose: () => setRepHtml(null),
    title: "รายงานออกแบบระบบ" + (job && job.code ? " " + job.code : "")
  }));
}
function SolarDesignHost({
  job,
  onClose
}) {
  const {
    saved,
    loading,
    save
  } = usePlan3d(job ? job.id : null);
  const [sysLocal, setSysLocal] = React.useState(null);
  const st = React.useMemo(() => {
    const base = p3Blank(job);
    if (!saved) return base;
    const m = Object.assign({}, base, saved, {
      sun: Object.assign({}, base.sun, saved.sun || {})
    });
    m.roofs = (saved.roofs || []).map(r => Object.assign({}, p3NewRoof(1), r, {
      skips: r.skips || {},
      pts: r.pts || null
    }));
    m.obstacles = saved.obstacles || [];
    return m;
  }, [saved, job && job.id]);
  const stRef = React.useRef(st);
  stRef.current = st;
  const pend = React.useRef(null),
    timer = React.useRef(null);
  const flush = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const s = pend.current;
    if (!s) return;
    pend.current = null;
    const wp = scNum((scPanelSpec(s) || {}).wp, 0);
    save(Object.assign({}, stRef.current, wp ? {
      sys: s,
      wp: wp
    } : {
      sys: s
    }));
  }, [save]);
  React.useEffect(() => flush, [flush]);
  if (!job) return null;
  if (loading) {
    return React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 130,
        background: "var(--bg)",
        display: "grid",
        placeItems: "center",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E1C\u0E31\u0E07\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u2026");
  }
  return React.createElement(React.Fragment, null, React.createElement("style", null, typeof P3_CSS === "string" ? P3_CSS : ""), React.createElement(SolarWorkspace, {
    job: job,
    st: st,
    sys: sysLocal || st.sys || scBlankSys(),
    onClose: () => {
      flush();
      onClose();
    },
    onChange: s => {
      setSysLocal(s);
      pend.current = s;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 900);
    }
  }));
}
Object.assign(window, {
  SolarWorkspace,
  SolarDesignHost,
  SuVoltBand,
  SuFacing,
  SU_CSS
});