function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
.bq-nav .mt.warn{color:var(--tint-amber-tx)}
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
.bq-btn.gh{border-color:var(--tint-ok-tx);background:rgba(34,163,91,.08);color:var(--tint-ok-tx)}
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
.bq-spec>div[data-miss="1"]{background:var(--tint-amber-bg);border-color:var(--tint-amber-bd)}
.bq-spec>div[data-miss="1"] .v{color:var(--tint-amber-tx)}
.bq-spec>div[data-bad="1"]{background:var(--tint-red-bg);border-color:var(--tint-red-bd2)}
.bq-spec>div[data-bad="1"] .v{color:var(--tint-red-tx2)}
/* ปุ่มลิงก์เล็ก ๆ ท้ายป้ายช่องกรอก — กดแล้วกลับไปใช้ค่าอัตโนมัติ */
.bq-auto{border:0;background:none;padding:0;margin-left:auto;cursor:pointer;font-family:inherit;
  font-size:9.5px;font-weight:800;color:var(--primary-dark);text-decoration:underline;white-space:nowrap}
/* ปุ่มลบท้ายแถว — เงียบ ๆ ไว้ก่อน ค่อยเป็นสีแดงตอนเอาเมาส์ไปชี้ จะได้ไม่แย่งสายตากับข้อมูลในแถว */
.bq-x{height:36px;width:100%;background:none;border:1px solid transparent;color:var(--text-3);
  border-radius:9px;cursor:pointer;display:grid;place-items:center;transition:background .12s,color .12s,border-color .12s}
.bq-x:hover{background:#EF44441a;border-color:#EF444433;color:#EF4444}
.bq-note{margin-top:9px;display:flex;align-items:flex-start;gap:7px;padding:9px 12px;border-radius:10px;
  font-size:12px;font-weight:600;line-height:1.5}
.bq-note.warn{background:var(--tint-amber-bg);border:1px solid var(--tint-amber-bd);color:var(--tint-amber-tx2)}
.bq-note.ok{background:var(--tint-ok-bg);border:1px solid var(--tint-ok-bd);color:var(--tint-ok-tx)}

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
function BoqLocked({
  value,
  unit,
  num
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "var(--surface3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "9px 11px"
    },
    title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E01\u0E49\u0E07\u0E32\u0E19"
  }, React.createElement(Icon, {
    name: "lock",
    size: 13,
    color: "var(--text-3)"
  }), React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "right",
      fontFamily: num ? "var(--mono)" : "inherit",
      fontSize: num ? 15 : 13.5,
      fontWeight: num ? 700 : 600,
      color: num ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, value), unit && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, unit));
}
function BoqInvCount({
  value,
  auto,
  onChange,
  style
}) {
  const manual = +value > 0;
  const shown = manual ? +value : auto;
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement("input", {
    type: "number",
    min: 1,
    step: 1,
    style: Object.assign({}, style, {
      flex: 1,
      minWidth: 0
    }),
    value: shown || "",
    onChange: e => onChange(Math.max(0, parseInt(e.target.value) || 0))
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, "\u0E15\u0E31\u0E27"), manual ? React.createElement("button", {
    type: "button",
    className: "bq-auto",
    onClick: () => onChange(0),
    title: auto > 0 ? "กลับไปใช้ค่าอัตโนมัติ " + auto + " ตัว" : "กลับไปใช้ค่าอัตโนมัติ"
  }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34", auto > 0 ? " " + auto : "") : React.createElement("span", {
    className: "bq-auto",
    style: {
      textDecoration: "none",
      cursor: "default"
    },
    title: "\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E27\u0E21 \xF7 MAX PV \u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27"
  }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"));
}
function WireArt({
  art,
  w,
  h
}) {
  const S = "var(--text-3)",
    A = "var(--primary)",
    F = "var(--surface3)",
    BG = "var(--surface)";
  const uid = "wa-" + (art || "x");
  const hatch = "url(#" + uid + "-hatch)",
    soil = "url(#" + uid + "-soil)";
  const cd = (x, y, r) => React.createElement("g", {
    key: "c" + x + "_" + y
  }, React.createElement("circle", {
    cx: x,
    cy: y,
    r: r,
    fill: BG,
    stroke: A,
    strokeWidth: "1.6"
  }), React.createElement("circle", {
    cx: x,
    cy: y,
    r: r * 0.36,
    fill: A
  }));
  const wall = (x, y, ww, hh) => React.createElement("g", {
    key: "w"
  }, React.createElement("rect", {
    x: x,
    y: y,
    width: ww,
    height: hh,
    fill: hatch,
    stroke: S,
    strokeWidth: "1.3"
  }));
  const body = {
    g1: React.createElement("g", null, wall(4, 6, 124, 66), React.createElement("path", {
      d: "M4 20 q7-6 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0",
      fill: "none",
      stroke: S,
      strokeWidth: "1.5"
    }), React.createElement("circle", {
      cx: "66",
      cy: "47",
      r: "19",
      fill: BG,
      stroke: S,
      strokeWidth: "1.7"
    }), React.createElement("circle", {
      cx: "66",
      cy: "47",
      r: "15.5",
      fill: "none",
      stroke: S,
      strokeWidth: "1",
      opacity: ".55"
    }), cd(60, 42, 5), cd(72, 42, 5), cd(66, 53, 5)),
    g2: React.createElement("g", null, wall(4, 6, 18, 66), React.createElement("line", {
      x1: "22",
      y1: "6",
      x2: "22",
      y2: "72",
      stroke: S,
      strokeWidth: "1.7"
    }), React.createElement("path", {
      d: "M22 40h20",
      stroke: S,
      strokeWidth: "2.4"
    }), React.createElement("circle", {
      cx: "66",
      cy: "40",
      r: "21",
      fill: BG,
      stroke: S,
      strokeWidth: "1.7"
    }), React.createElement("circle", {
      cx: "66",
      cy: "40",
      r: "17",
      fill: "none",
      stroke: S,
      strokeWidth: "1",
      opacity: ".55"
    }), cd(59, 35, 5.5), cd(74, 35, 5.5), cd(66, 47, 5.5), React.createElement("path", {
      d: "M98 26q8 4 16 0M98 40q8 4 16 0M98 54q8 4 16 0",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".5"
    })),
    g3: React.createElement("g", null, wall(4, 6, 124, 16), React.createElement("line", {
      x1: "4",
      y1: "22",
      x2: "128",
      y2: "22",
      stroke: S,
      strokeWidth: "1.7"
    }), [34, 66, 98].map(x => React.createElement("path", {
      key: "k" + x,
      d: "M" + (x - 13) + " 22v8a13 13 0 0 0 26 0v-8",
      fill: "none",
      stroke: S,
      strokeWidth: "1.4"
    })), [34, 66, 98].map(x => React.createElement("g", {
      key: "s" + x
    }, React.createElement("circle", {
      cx: x,
      cy: 38,
      r: "11",
      fill: BG,
      stroke: S,
      strokeWidth: "1.5"
    }), cd(x, 38, 5.5)))),
    g4: React.createElement("g", null, React.createElement("rect", {
      x: "4",
      y: "62",
      width: "124",
      height: "10",
      fill: hatch,
      stroke: S,
      strokeWidth: "1.3"
    }), [30, 66, 102].map(x => React.createElement("g", {
      key: "p" + x
    }, React.createElement("rect", {
      x: x - 3,
      y: 44,
      width: "6",
      height: "18",
      fill: F,
      stroke: S,
      strokeWidth: "1.3"
    }), React.createElement("ellipse", {
      cx: x,
      cy: 42,
      rx: "9",
      ry: "4",
      fill: F,
      stroke: S,
      strokeWidth: "1.3"
    }), React.createElement("ellipse", {
      cx: x,
      cy: 35,
      rx: "7",
      ry: "3.5",
      fill: F,
      stroke: S,
      strokeWidth: "1.3"
    }), cd(x, 25, 6.5)))),
    g5: React.createElement("g", null, React.createElement("rect", {
      x: "4",
      y: "20",
      width: "124",
      height: "52",
      fill: soil,
      stroke: S,
      strokeWidth: "1.3"
    }), React.createElement("line", {
      x1: "4",
      y1: "20",
      x2: "128",
      y2: "20",
      stroke: S,
      strokeWidth: "2"
    }), React.createElement("circle", {
      cx: "66",
      cy: "47",
      r: "19",
      fill: BG,
      stroke: S,
      strokeWidth: "1.7"
    }), React.createElement("circle", {
      cx: "66",
      cy: "47",
      r: "15.5",
      fill: "none",
      stroke: S,
      strokeWidth: "1",
      opacity: ".55"
    }), cd(60, 42, 5), cd(72, 42, 5), cd(66, 53, 5)),
    g6: React.createElement("g", null, React.createElement("rect", {
      x: "4",
      y: "20",
      width: "124",
      height: "52",
      fill: soil,
      stroke: S,
      strokeWidth: "1.3"
    }), React.createElement("line", {
      x1: "4",
      y1: "20",
      x2: "128",
      y2: "20",
      stroke: S,
      strokeWidth: "2"
    }), [38, 66, 94].map(x => React.createElement("g", {
      key: "b" + x
    }, React.createElement("circle", {
      cx: x,
      cy: 48,
      r: "12",
      fill: BG,
      stroke: S,
      strokeWidth: "1.5"
    }), cd(x, 48, 6)))),
    g7: React.createElement("g", null, React.createElement("path", {
      d: "M12 26v34h108V26",
      fill: "none",
      stroke: S,
      strokeWidth: "2.2"
    }), React.createElement("line", {
      x1: "12",
      y1: "60",
      x2: "120",
      y2: "60",
      stroke: S,
      strokeWidth: "2.4"
    }), [30, 52, 74, 96].map(x => cd(x, 50, 9)), React.createElement("path", {
      d: "M28 20v-8M52 20v-8M76 20v-8M100 20v-8",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    }), React.createElement("path", {
      d: "M25 16l3-4 3 4M49 16l3-4 3 4M73 16l3-4 3 4M97 16l3-4 3 4",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    })),
    ladder: React.createElement("g", null, React.createElement("path", {
      d: "M12 24v36h108V24",
      fill: "none",
      stroke: S,
      strokeWidth: "2.2"
    }), [14, 31, 48, 65, 82, 99, 116].map(x => React.createElement("line", {
      key: "r" + x,
      x1: x,
      y1: "59",
      x2: x + 4,
      y2: "59",
      stroke: S,
      strokeWidth: "4.5",
      strokeLinecap: "round"
    })), [30, 52, 74, 96].map(x => cd(x, 48, 9)), React.createElement("path", {
      d: "M28 18v-8M52 18v-8M76 18v-8M100 18v-8",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    }), React.createElement("path", {
      d: "M25 14l3-4 3 4M49 14l3-4 3 4M73 14l3-4 3 4M97 14l3-4 3 4",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    }), React.createElement("path", {
      d: "M40 74v-6M63 74v-6M86 74v-6",
      stroke: S,
      strokeWidth: "1.2",
      opacity: ".45"
    }), React.createElement("path", {
      d: "M37.5 70.5l2.5-3 2.5 3M60.5 70.5l2.5-3 2.5 3M83.5 70.5l2.5-3 2.5 3",
      fill: "none",
      stroke: S,
      strokeWidth: "1.2",
      opacity: ".45"
    })),
    trayVent: React.createElement("g", null, React.createElement("path", {
      d: "M12 24v36h108V24",
      fill: "none",
      stroke: S,
      strokeWidth: "2.2"
    }), React.createElement("line", {
      x1: "12",
      y1: "60",
      x2: "120",
      y2: "60",
      stroke: S,
      strokeWidth: "2.4"
    }), [22, 34, 46, 58, 70, 82, 94, 106].map(x => React.createElement("circle", {
      key: "h" + x,
      cx: x,
      cy: "60",
      r: "1.9",
      fill: "var(--surface)",
      stroke: S,
      strokeWidth: "1"
    })), [30, 52, 74, 96].map(x => cd(x, 50, 9)), React.createElement("path", {
      d: "M28 18v-8M52 18v-8M76 18v-8M100 18v-8",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    }), React.createElement("path", {
      d: "M25 14l3-4 3 4M49 14l3-4 3 4M73 14l3-4 3 4M97 14l3-4 3 4",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    })),
    traySolid: React.createElement("g", null, React.createElement("path", {
      d: "M12 24v36h108V24",
      fill: "none",
      stroke: S,
      strokeWidth: "2.2"
    }), React.createElement("rect", {
      x: "12",
      y: "58",
      width: "108",
      height: "4",
      fill: F,
      stroke: S,
      strokeWidth: "1.6"
    }), [30, 52, 74, 96].map(x => cd(x, 49, 9)), React.createElement("path", {
      d: "M40 18v-8M76 18v-8",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    }), React.createElement("path", {
      d: "M37 14l3-4 3 4M73 14l3-4 3 4",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".55"
    })),
    trayCover: React.createElement("g", null, React.createElement("rect", {
      x: "10",
      y: "14",
      width: "112",
      height: "9",
      rx: "2",
      fill: F,
      stroke: S,
      strokeWidth: "1.7"
    }), [22, 110].map(x => React.createElement("line", {
      key: "lk" + x,
      x1: x,
      y1: "23",
      x2: x,
      y2: "27",
      stroke: S,
      strokeWidth: "1.6"
    })), React.createElement("path", {
      d: "M16 25v35h100V25",
      fill: "none",
      stroke: S,
      strokeWidth: "2.2"
    }), React.createElement("line", {
      x1: "16",
      y1: "60",
      x2: "116",
      y2: "60",
      stroke: S,
      strokeWidth: "2.6"
    }), [34, 55, 76, 97].map(x => cd(x, 50, 9)), React.createElement("path", {
      d: "M45 40v-9M87 40v-9",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".5"
    }), React.createElement("path", {
      d: "M42.5 33.5l2.5-3 2.5 3M84.5 33.5l2.5-3 2.5 3",
      fill: "none",
      stroke: S,
      strokeWidth: "1.3",
      opacity: ".5"
    }), React.createElement("path", {
      d: "M38 29h14M80 29h14",
      stroke: S,
      strokeWidth: "1.6",
      opacity: ".5"
    }))
  }[art];
  if (!body) return null;
  return React.createElement("svg", {
    viewBox: "0 0 132 78",
    width: w || 132,
    height: h || 78,
    style: {
      flexShrink: 0,
      display: "block"
    },
    "aria-hidden": "true"
  }, React.createElement("defs", null, React.createElement("pattern", {
    id: uid + "-hatch",
    width: "7",
    height: "7",
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)"
  }, React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "7",
    stroke: S,
    strokeWidth: "1.1",
    opacity: ".38"
  })), React.createElement("pattern", {
    id: uid + "-soil",
    width: "10",
    height: "10",
    patternUnits: "userSpaceOnUse"
  }, React.createElement("circle", {
    cx: "2.5",
    cy: "2.5",
    r: "1.1",
    fill: S,
    opacity: ".42"
  }), React.createElement("circle", {
    cx: "7.5",
    cy: "7",
    r: "1.1",
    fill: S,
    opacity: ".42"
  }))), body);
}
const MEAS_KIND_TH = {
  cable: "สายไฟ",
  conduit: "ท่อร้อยสาย",
  tray: "รางเดินสาย",
  ladder: "บันไดลิง",
  walkway: "ทางเดิน",
  guardrail: "ราวกันตก",
  other: "อื่น ๆ"
};
const MEAS_KIND_COLOR = {
  cable: "#F97316",
  conduit: "#0EA5E9",
  tray: "#8B5CF6",
  ladder: "#D946EF",
  walkway: "#14B8A6",
  guardrail: "#E11D48",
  other: "#64748B"
};
function measLen(m) {
  const pts = m && m.pts || [];
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot((+pts[i].x || 0) - (+pts[i - 1].x || 0), (+pts[i].z || 0) - (+pts[i - 1].z || 0));
  return Math.round((s + Math.abs(+(m && m.rise) || 0)) * 100) / 100;
}
function useMeas3D(jobId) {
  const [ms, setMs] = React.useState([]);
  React.useEffect(() => {
    if (!jobId) {
      setMs([]);
      return;
    }
    const take = v => setMs((v && v.measures || []).filter(m => m && (m.pts || []).length >= 2));
    if (window.FBDB) {
      const ref = window.FBDB.ref("plan3d/" + jobId);
      const h = ref.on("value", s => take(s.val()));
      return () => ref.off("value", h);
    }
    try {
      take(JSON.parse(localStorage.getItem("sf_plan3d_" + jobId) || "null"));
    } catch (e) {
      setMs([]);
    }
  }, [jobId]);
  return ms;
}
function Meas3DModal({
  list,
  targets,
  defaultTarget,
  onApply,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [pick, setPick] = React.useState(() => {
    const o = {};
    (list || []).forEach(m => {
      o[m.id] = defaultTarget(m);
    });
    return o;
  });
  const rows = (list || []).filter(m => pick[m.id]);
  const sum = Math.round(rows.reduce((s, m) => s + measLen(m), 0) * 100) / 100;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 130,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(620px,100%)",
      maxHeight: isMobile ? "92dvh" : "88vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.45)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E30\u0E22\u0E30\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A 3D"), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      marginTop: 3
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E41\u0E15\u0E48\u0E25\u0E30\u0E23\u0E30\u0E22\u0E30\u0E08\u0E30\u0E25\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19")), React.createElement("div", {
    style: {
      padding: 16,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, (list || []).length === 0 && React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5,
      lineHeight: 1.7
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E2A\u0E49\u0E19\u0E27\u0E31\u0E14\u0E43\u0E19\u0E41\u0E1A\u0E1A 3D \u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49", React.createElement("br", null), "\u0E40\u0E1B\u0E34\u0E14 \u201C\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 3D\u201D \u2192 \u0E41\u0E17\u0E47\u0E1A ", React.createElement("b", null, "\u0E27\u0E31\u0E14\u0E23\u0E30\u0E22\u0E30"), " \u2192 \u0E04\u0E25\u0E34\u0E01\u0E44\u0E25\u0E48\u0E08\u0E38\u0E14\u0E1A\u0E19\u0E1C\u0E31\u0E07 \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), (list || []).map(m => {
    const col = MEAS_KIND_COLOR[m.kind] || MEAS_KIND_COLOR.other;
    const rise = Math.abs(+m.rise || 0);
    return React.createElement("div", {
      key: m.id,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 12px",
        background: "var(--surface)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 210px",
        gap: 10,
        alignItems: "center"
      }
    }, React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: col,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, m.name || "ระยะ"), React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 800,
        color: col,
        marginLeft: "auto",
        flexShrink: 0
      }
    }, measLen(m).toFixed(2), " \u0E21.")), React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 3
      }
    }, MEAS_KIND_TH[m.kind] || MEAS_KIND_TH.other, " \xB7 ", (m.pts || []).length, " \u0E08\u0E38\u0E14", rise ? " · รวมขึ้น–ลง " + rise + " ม." : "")), React.createElement(Dropdown, {
      value: pick[m.id] || "",
      options: targets,
      placeholder: "\u2014 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49 \u2014",
      onChange: v => setPick(p => Object.assign({}, p, {
        [m.id]: v
      }))
    }));
  })), React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 ", rows.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", rows.length ? " · รวม " + sum.toFixed(2) + " ม." : ""), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      background: "var(--surface2)",
      border: "1px solid var(--border-strong)",
      color: "var(--text-2)",
      borderRadius: 10,
      padding: "9px 16px",
      fontWeight: 700,
      fontSize: 12.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    disabled: !rows.length,
    onClick: () => {
      onApply(rows.map(m => ({
        m: m,
        target: pick[m.id]
      })));
      onClose();
    },
    style: {
      background: rows.length ? "var(--primary)" : "var(--surface3)",
      border: "none",
      color: rows.length ? "#fff" : "var(--text-3)",
      borderRadius: 10,
      padding: "9px 20px",
      fontWeight: 800,
      fontSize: 12.5,
      cursor: rows.length ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32"))));
}
function BOQEditor({
  job,
  onClose,
  onSave,
  priceMap,
  stock
}) {
  const bdClose = window.useBackdropClose(onClose);
  const baht = n => (Math.round((+n || 0) * 100) / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [b, setB] = React.useState(() => {
    const base = job && job.boq ? Object.assign(window.BOQ.blankBOQ(job), job.boq) : window.BOQ.blankBOQ(job);
    if (job) {
      if (job.panels != null && job.panels !== "") base.panels = job.panels;
      base.batteryKwh = job.battery ? parseFloat(job.batSize) || 0 : 0;
      base.backup = !!job.backup;
      base.birdnet = !!job.birdnet;
      base.hwOptimizer = !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี");
      if (job.backup && (!base.hwBackup || base.hwBackup === "none")) base.hwBackup = "backupbox";else if (!job.backup) base.hwBackup = "none";
      base.jobType = job.type || "";
      base.comboType = job.comboType || "ready";
    }
    if (Array.isArray(base.cables)) {
      base.cables = base.cables.filter(c => !(c.name === "COMBINER-BAT." && !(job && job.battery) || c.name === "COMBINER-BACKUP" && !(job && job.backup))).map(c => {
        if (!c.type && c.name === "GROUND") return Object.assign({}, c, {
          type: "IEC01(THW)1Cx6 SQ.MM. Y/G"
        });
        if (!c.type && c.name === "LAN") return Object.assign({}, c, {
          type: "LAN CAT6"
        });
        return c;
      });
    }
    return base;
  });
  const hasBattery = !!(job && job.battery);
  const hasBackup = !!(job && job.backup);
  const [adv, setAdv] = React.useState(false);
  const set = (k, v) => setB(p => Object.assign({}, p, {
    [k]: v
  }));
  const setSpare = (k, v) => setB(p => Object.assign({}, p, {
    sparePct: Object.assign({}, p.sparePct, {
      [k]: v
    })
  }));
  const setRow = (i, k, v) => setB(p => {
    const rows = p.rows.slice();
    rows[i] = Object.assign({}, rows[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      rows
    });
  });
  const addRow = () => setB(p => Object.assign({}, p, {
    rows: p.rows.concat([{
      panels: 0,
      count: 1
    }])
  }));
  const fillRemaining = rem => {
    if (rem > 0) setB(p => Object.assign({}, p, {
      rows: p.rows.concat([{
        panels: rem,
        count: 1
      }])
    }));
  };
  const delRow = i => setB(p => Object.assign({}, p, {
    rows: p.rows.filter((_, j) => j !== i)
  }));
  const setCab = (i, k, v) => setB(p => {
    const cs = p.cables.slice();
    cs[i] = Object.assign({}, cs[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      cables: cs
    });
  });
  const addCab = () => setB(p => Object.assign({}, p, {
    cables: p.cables.concat([{
      name: "",
      type: "",
      length: ""
    }])
  }));
  const delCab = i => setB(p => Object.assign({}, p, {
    cables: p.cables.filter((_, j) => j !== i)
  }));
  const resetCabCond = i => setB(p => {
    const cs = p.cables.slice();
    const x = Object.assign({}, cs[i]);
    delete x.method;
    delete x.group;
    delete x.ncond;
    delete x.core;
    cs[i] = x;
    return Object.assign({}, p, {
      cables: cs
    });
  });
  const [cabOpen, setCabOpen] = React.useState({});
  const WIRECALC_DEF = {
    volt: 0,
    battKw: 5,
    strings: 1,
    backupMainA: 0,
    ins: "pvc",
    method: "conduitAir",
    group: "g1",
    ncond: "",
    core: "single"
  };
  const wcalc = Object.assign({}, WIRECALC_DEF, b.wireCalc || {});
  const WCALC_STR = {
    ins: 1,
    method: 1,
    group: 1,
    ncond: 1,
    core: 1
  };
  const setWcalc = (k, v) => setB(p => Object.assign({}, p, {
    wireCalc: Object.assign({}, WIRECALC_DEF, p.wireCalc || {}, {
      [k]: WCALC_STR[k] ? v : +v || 0
    })
  }));
  const setMethodPick = v => {
    const m = (window.BOQ.WIRE_METHODS || []).find(x => x.key === v) || {};
    setB(p => {
      const cur = Object.assign({}, WIRECALC_DEF, p.wireCalc || {});
      const g = m.groups && m.groups.length && m.groups.indexOf(cur.group) < 0 ? m.groups[0] : cur.group;
      return Object.assign({}, p, {
        wireCalc: Object.assign({}, cur, {
          method: v,
          group: g
        })
      });
    });
  };
  const wcPhase = +b.phase === 3 ? 3 : 1;
  const wcVolt = +wcalc.volt || (wcPhase === 3 ? 400 : 230);
  const wcStrings = Math.max(1, Math.round(+wcalc.strings || 1));
  const calcIns = wcalc.ins || "pvc";
  const calcPick = (window.BOQ.normWireMethod || ((m, g) => ({
    method: m,
    group: g
  })))(wcalc.method || "conduitAir", wcalc.group || "g1");
  const calcMethod = calcPick.method;
  const calcGroup = calcPick.group;
  const calcNCond = wcalc.ncond ? String(wcalc.ncond) : wcPhase === 3 ? "3" : "2";
  const calcDerate = +wcalc.derate > 0 ? +wcalc.derate : 1;
  const coreOpts = (window.BOQ.ampCoresFor || (() => []))(calcGroup);
  const corePick = wcalc.core || "single";
  const calcCore = (window.BOQ.ampCoreKey || (() => "single"))(calcGroup, corePick, corePick);
  const pickWire = amp => window.BOQ.pickWireSize((+amp || 0) * 1.25, calcIns, {
    method: calcMethod,
    group: calcGroup,
    ncond: calcNCond,
    core: calcCore,
    derate: calcDerate
  });
  const ampSrc = window.BOQ.ampTableFor ? window.BOQ.ampTableFor(calcIns, calcMethod, window.BOQ.ampColKey(calcGroup, calcNCond, calcCore)) : {
    tbl: {},
    borrowed: false
  };
  const ampSrcTh = k => ((window.BOQ.WIRE_METHODS || []).find(m => m.key === k) || {}).th || k;
  const [artOpen, setArtOpen] = React.useState(false);
  const hasAmpTbl = !!(ampSrc.tbl && Object.keys(ampSrc.tbl).length);
  const grpMeta = (window.BOQ.AMP_GROUPS || []).find(g => g.key === calcGroup) || {};
  const mtdMeta = (window.BOQ.WIRE_METHODS || []).find(m => m.key === calcMethod) || {};
  const microUnit = (window.BOQ.MICRO || []).find(m => m.ratio === b.microRatio) || (window.BOQ.MICRO || [])[1] || {};
  const microW = parseFloat((String(microUnit.model || "").match(/(\d+(?:\.\d+)?)\s*watt/i) || [])[1]) || 1250;
  const wireCalcRows = React.useMemo(() => {
    const sysKw = +(job && job.kw || 0);
    const battKw = hasBattery ? +wcalc.battKw || 0 : 0;
    const combinedKw = sysKw + battKw;
    const div = wcPhase === 3 ? Math.sqrt(3) * wcVolt : wcVolt;
    const phaseNote = wcPhase === 3 ? "3 เฟส · √3×" + wcVolt + "V" : "1 เฟส · " + wcVolt + "V";
    const backupA = +wcalc.backupMainA || 0;
    const microAmp = microW / 230;
    const rows = [{
      kind: "micromicro",
      label: "MICRO-MICRO",
      w: microW,
      ampTotal: microAmp,
      ampString: microAmp,
      wire: pickWire(microAmp),
      note: "สายต่อไมโคร · ไมโคร 1 ตัว · 1 เฟส 230V · " + Math.round(microW / 10) / 100 + " kW",
      splittable: false
    }];
    const mw = sysKw * 1000;
    const microTotal = div ? mw / div : 0;
    const microString = microTotal / wcStrings;
    rows.push({
      kind: "main",
      label: "MICRO-COMBINER",
      w: mw,
      ampTotal: microTotal,
      ampString: microString,
      wire: pickWire(microString),
      note: phaseNote + " · " + sysKw + " kW" + (wcStrings > 1 ? " · แบ่ง " + wcStrings + " สตริง" : ""),
      splittable: true
    });
    const cw = combinedKw * 1000;
    const combAmp = div ? cw / div : 0;
    rows.push({
      kind: "mcb",
      label: hasBackup ? "COMBINER → BACKUP (รวม MICRO+BAT)" : "COMBINER → MCB ตู้ลูกค้า",
      w: cw,
      ampTotal: combAmp,
      ampString: combAmp,
      wire: pickWire(combAmp),
      battAmp: div ? battKw * 1000 / div : 0,
      note: "รวม MICRO" + (battKw ? " + BAT " + battKw + " kW" : "") + " · " + phaseNote + " · " + Math.round(combinedKw * 100) / 100 + " kW",
      splittable: false
    });
    if (hasBackup) {
      rows.push({
        kind: "backup",
        label: "BACKUP → เมนไฟ (MAIN)",
        w: null,
        ampTotal: backupA,
        ampString: backupA,
        wire: backupA ? pickWire(backupA) : "—",
        needInput: !backupA,
        note: backupA ? "ตามเมนเบรกเกอร์ที่ Backup · " + backupA + " A" : "⚠ ระบุกระแสเมนที่จะ Backup (A) ด้านบน",
        splittable: false
      });
    }
    return rows;
  }, [job, microW, wcPhase, wcVolt, wcalc.battKw, wcalc.backupMainA, wcStrings, hasBattery, hasBackup, calcIns, calcMethod, calcGroup, calcNCond]);
  const cableAmp = (name, opts) => window.BOQ.ampacityOf(name, opts);
  const reqAmpFor = cabName => {
    const n = (cabName || "").toUpperCase();
    if (/LAN|CAT|GROUND|กราว|ดิน/.test(n)) return null;
    if (/PV-INVERTER/.test(n)) return null;
    const invAcPer = selInv ? +selInv.outA || 0 : 0;
    const invCnt = result && result.meta && result.meta.invCount || 1;
    if (/MCB_SOLAR-MDB/.test(n)) return invAcPer ? invAcPer * invCnt * 1.25 : null;
    if (/INVERTER-MCB_SOLAR/.test(n)) return invAcPer ? invAcPer * 1.25 : null;
    const microRow = wireCalcRows.find(r => r.kind === "micromicro");
    const mainRow = wireCalcRows.find(r => r.kind === "main") || wireCalcRows[0];
    const mcbRow = wireCalcRows.find(r => r.kind === "mcb") || mainRow;
    const backupRow = wireCalcRows.find(r => r.kind === "backup");
    if (/MICRO[\s-]*MICRO/.test(n)) return microRow ? microRow.ampTotal * 1.25 : 0;
    if (/MICRO/.test(n)) return mainRow.ampString * 1.25;
    if (/BACKUP|สำรอง/.test(n)) return backupRow && backupRow.ampTotal ? backupRow.ampTotal * 1.25 : null;
    if (/BAT|แบต/.test(n)) return mcbRow.battAmp ? mcbRow.battAmp * 1.25 : null;
    return mcbRow.ampTotal * 1.25;
  };
  const CABLE_PT_KEY = "boq_cable_points_v1";
  const [customPts, setCustomPts] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CABLE_PT_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });
  const addCablePt = name => {
    const v = (name || "").trim();
    if (!v) return;
    setCustomPts(p => {
      if (p.indexOf(v) >= 0 || (window.BOQ.CABLE_POINTS || []).indexOf(v) >= 0) return p;
      const next = p.concat([v]);
      try {
        localStorage.setItem(CABLE_PT_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };
  const cablePtOptions = React.useMemo(() => {
    const used = (b.cables || []).map(c => c.name).filter(Boolean);
    const all = [...new Set((window.BOQ.CABLE_POINTS || []).concat(customPts).concat(used))];
    return all.map(n => ({
      value: n,
      label: n
    }));
  }, [customPts, b.cables]);
  const cond = b.conduit || {
    imc: [],
    upvc: [],
    pullbox: []
  };
  const setCond = (kind, i, k, v) => setB(p => {
    const c = Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit);
    const a = (c[kind] || []).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    c[kind] = a;
    return Object.assign({}, p, {
      conduit: c
    });
  });
  const addCond = (kind, item) => setB(p => {
    const c = Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit);
    c[kind] = (c[kind] || []).concat([item]);
    return Object.assign({}, p, {
      conduit: c
    });
  });
  const delCond = (kind, i) => setB(p => {
    const c = Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit);
    c[kind] = (c[kind] || []).filter((_, j) => j !== i);
    return Object.assign({}, p, {
      conduit: c
    });
  });
  const setFlexSize = (size, v) => setB(p => {
    const c = Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit);
    c.flex = Object.assign({}, c.flex, {
      [size]: v
    });
    return Object.assign({}, p, {
      conduit: c
    });
  });
  const setUpFlexSize = (size, v) => setB(p => {
    const c = Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit);
    c.upFlex = Object.assign({}, c.upFlex, {
      [size]: v
    });
    return Object.assign({}, p, {
      conduit: c
    });
  });
  const setCondVal = (k, v) => setB(p => Object.assign({}, p, {
    conduit: Object.assign({
      imc: [],
      upvc: [],
      pullbox: []
    }, p.conduit, {
      [k]: v
    })
  }));
  const condFits = React.useMemo(() => window.BOQ.condFittings(), []);
  const trayFits = React.useMemo(() => window.BOQ.trayFittings(), []);
  const SPARE_DEF = {
    clamp: 10,
    bushing: 10,
    cchannel: 10,
    connector: 10,
    coupling: 10,
    upStraight: 10,
    upClamp: 10,
    upConnector: 10
  };
  const setCSpare = (k, v) => setB(p => Object.assign({}, p, {
    conduitSpare: Object.assign({}, SPARE_DEF, p.conduitSpare, {
      [k]: v
    })
  }));
  const [condOpen, setCondOpen] = React.useState({});
  const condPools = [["imc", window.BOQ.IMC_SIZES], ["upvc", window.BOQ.UPVC_SIZES]];
  const condLen = Math.round(condPools.reduce((s, [k]) => s + (cond[k] || []).reduce((t, x) => t + (+x.length || 0), 0), 0));
  const condBad = condPools.reduce((n, [k, sizes]) => n + (cond[k] || []).filter(x => (x.cables || []).length && !window.BOQ.conduitCheck(x.size, x.cables, sizes).ok).length, 0);
  const TRAY_DEF = {
    way: [],
    tray: [],
    spare: 10,
    extra: []
  };
  const tw = Object.assign({}, TRAY_DEF, b.tray);
  const trayLen = Math.round((tw.way || []).concat(tw.tray || []).reduce((s, x) => s + (+x.length || 0), 0));
  const trayWorst = condPools.reduce((f, [k, sizes]) => (cond[k] || []).reduce((g, x) => (x.cables || []).length ? Math.min(g, window.BOQ.conduitCheck(x.size, x.cables, sizes).derate) : g, f), [["way", window.BOQ.WAY_SIZES], ["tray", window.BOQ.TRAY_SIZES]].reduce((f, [k, sizes]) => (tw[k] || []).reduce((g, x) => (x.cables || []).length ? Math.min(g, window.BOQ.trayCheck(x.size, x.cables, k === "tray", sizes).derate) : g, f), 1));
  const trayBad = [["way", window.BOQ.WAY_SIZES], ["tray", window.BOQ.TRAY_SIZES]].reduce((n, [k, sizes]) => n + (tw[k] || []).filter(x => (x.cables || []).length && (() => {
    const c = window.BOQ.trayCheck(x.size, x.cables, k === "tray", sizes);
    return !(c.ok && c.widthOk);
  })()).length, 0);
  const setTrayRow = (kind, i, k, v) => setB(p => {
    const t = Object.assign({}, TRAY_DEF, p.tray);
    const a = (t[kind] || []).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    t[kind] = a;
    return Object.assign({}, p, {
      tray: t
    });
  });
  const addTrayRow = (kind, item) => setB(p => {
    const t = Object.assign({}, TRAY_DEF, p.tray);
    t[kind] = (t[kind] || []).concat([item]);
    return Object.assign({}, p, {
      tray: t
    });
  });
  const delTrayRow = (kind, i) => setB(p => {
    const t = Object.assign({}, TRAY_DEF, p.tray);
    t[kind] = (t[kind] || []).filter((_, j) => j !== i);
    return Object.assign({}, p, {
      tray: t
    });
  });
  const setTrayVal = (k, v) => setB(p => Object.assign({}, p, {
    tray: Object.assign({}, TRAY_DEF, p.tray, {
      [k]: v
    })
  }));
  const [trayOpen, setTrayOpen] = React.useState({});
  const SUP_DEF = {
    inv: 0,
    invKind: "floor",
    mdb: 0,
    mdbKind: "floor",
    spare: 10,
    extra: []
  };
  const sup = Object.assign({}, SUP_DEF, b.support);
  const setSup = (k, v) => setB(p => Object.assign({}, p, {
    support: Object.assign({}, SUP_DEF, p.support, {
      [k]: v
    })
  }));
  const svcList = (key, preset) => b[key] == null ? preset.map(x => Object.assign({}, x, {
    price: 0
  })) : b[key];
  const setSvc = (key, preset, i, k, v) => setB(p => {
    const a = (p[key] == null ? preset.map(x => Object.assign({}, x, {
      price: 0
    })) : p[key]).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    return Object.assign({}, p, {
      [key]: a
    });
  });
  const addSvc = (key, preset) => setB(p => {
    const a = (p[key] == null ? preset.map(x => Object.assign({}, x, {
      price: 0
    })) : p[key]).slice();
    return Object.assign({}, p, {
      [key]: a.concat([{
        name: "",
        qty: 1,
        unit: "งาน",
        price: 0,
        auto: ""
      }])
    });
  });
  const delSvc = (key, preset, i) => setB(p => {
    const a = p[key] == null ? preset.map(x => Object.assign({}, x, {
      price: 0
    })) : p[key];
    return Object.assign({}, p, {
      [key]: a.filter((_, j) => j !== i)
    });
  });
  const resetSvc = key => setB(p => Object.assign({}, p, {
    [key]: null
  }));
  const laborMode = b.laborMode === "lump" ? "lump" : "split";
  const LUMP_DEF = {
    basis: "w",
    rate: 0,
    note: ""
  };
  const lump = Object.assign({}, LUMP_DEF, b.laborLump);
  const setLump = (k, v) => setB(p => Object.assign({}, p, {
    laborLump: Object.assign({}, LUMP_DEF, p.laborLump, {
      [k]: v
    })
  }));
  const STRUCT_DEF = {
    ladder: [],
    walkway: [],
    walkwayThk: 35,
    guardrail: [],
    ladderSpare: 5,
    walkwaySpare: 10,
    guardrailSpare: 5,
    ladderExtra: [],
    walkwayExtra: [],
    guardrailExtra: [],
    steel: {}
  };
  const setSteel = (kind, k, v) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    const sm = Object.assign({}, s.steel);
    sm[kind] = Object.assign({}, sm[kind], {
      [k]: v === "" || v == null ? "" : v
    });
    s.steel = sm;
    return Object.assign({}, p, {
      struct: s
    });
  });
  const st = Object.assign({}, STRUCT_DEF, b.struct);
  const setStruct = (kind, i, k, v) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    const a = (s[kind] || []).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    s[kind] = a;
    return Object.assign({}, p, {
      struct: s
    });
  });
  const addStruct = (kind, item) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    s[kind] = (s[kind] || []).concat([item]);
    return Object.assign({}, p, {
      struct: s
    });
  });
  const delStruct = (kind, i) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    s[kind] = (s[kind] || []).filter((_, j) => j !== i);
    return Object.assign({}, p, {
      struct: s
    });
  });
  const setStructVal = (k, v) => setB(p => Object.assign({}, p, {
    struct: Object.assign({}, STRUCT_DEF, p.struct, {
      [k]: v
    })
  }));
  const addStructExtra = kind => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    const key = kind + "Extra";
    s[key] = (s[key] || []).concat([{
      name: "",
      qty: "",
      unit: ""
    }]);
    return Object.assign({}, p, {
      struct: s
    });
  });
  const setStructExtra = (kind, i, k, v) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    const key = kind + "Extra";
    const a = (s[key] || []).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    s[key] = a;
    return Object.assign({}, p, {
      struct: s
    });
  });
  const delStructExtra = (kind, i) => setB(p => {
    const s = Object.assign({}, STRUCT_DEF, p.struct);
    const key = kind + "Extra";
    s[key] = (s[key] || []).filter((_, j) => j !== i);
    return Object.assign({}, p, {
      struct: s
    });
  });
  const structRows = ["ladder", "walkway", "guardrail"].reduce((s, k) => s + (st[k] || []).length, 0) + ["ladderExtra", "walkwayExtra", "guardrailExtra"].reduce((s, k) => s + (st[k] || []).filter(x => (x.name || "").trim()).length, 0);
  const [advS, setAdvS] = React.useState(structRows > 0);
  const [advC, setAdvC] = React.useState(false);
  const isHome = !!(job && job.type === "home");
  const [openSec, setOpenSec] = React.useState("info");
  const secProps = key => ({
    open: openSec === key,
    onToggle: () => setOpenSec(key)
  });
  const [advU, setAdvU] = React.useState(false);
  const meas3d = useMeas3D(job ? job.id : null);
  const [measOpen, setMeasOpen] = React.useState(null);
  const measFor = kinds => meas3d.filter(m => kinds.indexOf(m.kind || "other") >= 0 || (m.kind || "other") === "other");
  const measTargets = React.useMemo(() => {
    const IMC = window.BOQ.IMC_SIZES || [],
      UPVC = window.BOQ.UPVC_SIZES || [];
    const WAY = window.BOQ.WAY_SIZES || [],
      TRAY = window.BOQ.TRAY_SIZES || [];
    const o = (b.cables || []).map((c, i) => ({
      value: "cab:" + i,
      group: "สายไฟ — ทับความยาวเดิม",
      label: (c.name || "สายแถวที่ " + (i + 1)) + (c.length ? " (เดิม " + c.length + " ม.)" : "")
    }));
    o.push({
      value: "cab:new",
      group: "สายไฟ — ทับความยาวเดิม",
      label: "+ เพิ่มสายเส้นใหม่ตามชื่อระยะ"
    });
    if (IMC[0]) o.push({
      value: "imc",
      group: "เพิ่มแถวใหม่",
      label: "ท่อ IMC (" + IMC[0] + ")"
    });
    if (UPVC[0]) o.push({
      value: "upvc",
      group: "เพิ่มแถวใหม่",
      label: "ท่อ uPVC (" + UPVC[0] + ")"
    });
    if (WAY[0]) o.push({
      value: "way",
      group: "เพิ่มแถวใหม่",
      label: "Wireway (" + WAY[0] + ")"
    });
    if (TRAY[0]) o.push({
      value: "tray",
      group: "เพิ่มแถวใหม่",
      label: "Cable Tray (" + TRAY[0] + ")"
    });
    o.push({
      value: "ladder",
      group: "เพิ่มแถวใหม่",
      label: "บันไดลิง (ความสูง)"
    });
    o.push({
      value: "walkway",
      group: "เพิ่มแถวใหม่",
      label: "ทางเดิน Walkway (ความยาว)"
    });
    o.push({
      value: "guardrail",
      group: "เพิ่มแถวใหม่",
      label: "ราวกันตก (ความยาว)"
    });
    return o;
  }, [b.cables]);
  const measDefault = m => {
    const k = m.kind || "other";
    if (k === "cable") {
      const key = (m.name || "").trim().toUpperCase();
      const hit = (b.cables || []).findIndex(c => (c.name || "").trim().toUpperCase() === key);
      return hit >= 0 ? "cab:" + hit : "cab:new";
    }
    if (k === "conduit") return "imc";
    if (k === "tray") return "way";
    if (k === "ladder" || k === "walkway" || k === "guardrail") return k;
    return "";
  };
  const applyMeas = rows => {
    const IMC = window.BOQ.IMC_SIZES || [],
      UPVC = window.BOQ.UPVC_SIZES || [];
    const WAY = window.BOQ.WAY_SIZES || [],
      TRAY = window.BOQ.TRAY_SIZES || [];
    rows.forEach(({
      m,
      target
    }) => {
      const L = measLen(m);
      if (/^cab:\d+$/.test(target)) setCab(+target.slice(4), "length", L);else if (target === "cab:new") setB(p => Object.assign({}, p, {
        cables: (p.cables || []).concat([{
          name: (m.name || "").trim(),
          type: "",
          length: L
        }])
      }));else if (target === "imc") addCond("imc", {
        size: IMC[0],
        length: L,
        cables: []
      });else if (target === "upvc") addCond("upvc", {
        size: UPVC[0],
        length: L,
        cables: []
      });else if (target === "way") addTrayRow("way", {
        size: WAY[0],
        length: L,
        cables: []
      });else if (target === "tray") addTrayRow("tray", {
        size: TRAY[0],
        length: L,
        cables: []
      });else if (target === "ladder") addStruct("ladder", {
        h: L
      });else if (target === "walkway") addStruct("walkway", {
        len: L
      });else if (target === "guardrail") addStruct("guardrail", {
        len: L,
        corners: 0
      });
    });
  };
  const MeasBar = ({
    kinds
  }) => {
    const list = measFor(kinds);
    if (!list.length) return null;
    const sum = Math.round(list.reduce((s, m) => s + measLen(m), 0) * 100) / 100;
    return React.createElement("div", {
      style: {
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 9,
        padding: "9px 12px",
        background: "var(--tint-blue-bg, rgba(37,99,235,.08))",
        border: "1px solid rgba(37,99,235,.24)",
        borderRadius: 11
      }
    }, React.createElement(Icon, {
      name: "grid",
      size: 15,
      color: "#2563EB"
    }), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "#1D4ED8"
      }
    }, "\u0E27\u0E31\u0E14\u0E44\u0E27\u0E49\u0E43\u0E19\u0E41\u0E1A\u0E1A 3D ", list.length, " \u0E23\u0E30\u0E22\u0E30 \xB7 \u0E23\u0E27\u0E21 ", sum.toFixed(2), " \u0E21."), React.createElement("button", {
      onClick: () => setMeasOpen(kinds),
      style: {
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#2563EB",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "6px 12px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "\u0E14\u0E36\u0E07\u0E23\u0E30\u0E22\u0E30\u0E40\u0E02\u0E49\u0E32\u0E15\u0E32\u0E23\u0E32\u0E07"));
  };
  const csp = Object.assign({}, SPARE_DEF, b.conduitSpare);
  const KITS = window.BOQ.PROJECT_KITS || [];
  const project = window.BOQ.normProject(b.project);
  const kitOf = k => project[k] || {};
  const setKit = (k, key, v) => setB(p => {
    const pr = window.BOQ.normProject(p.project);
    pr[k] = Object.assign({}, pr[k], {
      [key]: v
    });
    return Object.assign({}, p, {
      project: pr
    });
  });
  const kitCount = k => {
    const st = kitOf(k.key);
    return k.items.reduce((s, it) => s + Math.max(0, +st[it.key] || 0), 0) + window.BOQ.kitExtraKeys(k).reduce((s, ek) => s + (st[ek] || []).filter(x => (x.name || "").trim() && +x.qty > 0).length, 0);
  };
  const KIT_SECS = [{
    key: "project",
    sec: "board",
    icon: "box",
    title: "ตู้ไฟ",
    hint: "ตู้ไฟของงานโครงการ — กรอกจำนวนตู้ แล้วกรอกอุปกรณ์ที่อยู่ในตู้นั้น · ราคาดึงจากคลังเหมือนวัสดุอื่น"
  }, {
    key: "watersys",
    sec: "water",
    icon: "power",
    title: "ระบบน้ำ (ปั๊ม · ถัง · ท่อ)",
    hint: "ระบบล้างแผง — กรอกเฉพาะที่งานนี้มี ที่เหลือปล่อยว่าง · ราคาดึงจากคลังเหมือนวัสดุอื่น"
  }];
  const kitSections = KIT_SECS.map(s => {
    const kits = KITS.filter(k => k.sec === s.sec);
    return Object.assign({}, s, {
      kits: kits,
      count: kits.reduce((n, k) => n + kitCount(k), 0)
    });
  });
  const PRICE_DEF = {
    contractor: 0,
    sell: 0,
    discount: 0,
    vat: window.BOQ.VAT_RATE
  };
  const pricing = Object.assign({}, PRICE_DEF, b.pricing || {});
  const setPricing = (k, v) => setB(p => Object.assign({}, p, {
    pricing: Object.assign({}, PRICE_DEF, p.pricing || {}, {
      [k]: v === "" ? "" : +v || 0
    })
  }));
  const result = window.BOQ.calcBOQ(b);
  const priced = window.BOQ.applyPrices(result, priceMap || {}, b.pick || {});
  const pb = window.BOQ.priceBreakdown(priced.grandTotal, pricing, (result.meta.kw || 0) * 1000);
  const siteTotal = (priced.groups || []).filter(g => g.group === window.BOQ.G_TRANSPORT || g.group === window.BOQ.G_MANAGE).reduce((s, g) => s + g.subtotal, 0);
  const accAllowGrp = (priced.groups || []).find(g => g.allowance);
  const accAllow = accAllowGrp ? accAllowGrp.subtotal : 0;
  const accBase = accAllowGrp ? (accAllowGrp.items.find(it => it.allowBase != null) || {}).allowBase || 0 : 0;
  const supAuto = b.inverterModel ? Math.max(1, Math.round(result.meta.invCount || 1)) : 0;
  const remaining = result.meta.panelCount - result.meta.rowsSum;
  const selInv = (window.BOQ.INVERTERS || []).find(x => x.model === b.inverterModel);
  const isHuawei = !!(selInv && selInv.inputs > 0);
  const jobBrand = job && job.brand || "";
  const jobPhaseNum = String(job && job.phase) === "3" ? 3 : 1;
  const brandInvs = (window.BOQ.INVERTERS || []).filter(x => (!jobBrand || x.model.toLowerCase().indexOf(jobBrand.toLowerCase()) >= 0) && (!x.phase || x.phase === jobPhaseNum));
  const showMicro = !jobBrand || /atmoce/i.test(jobBrand);
  const invOptions = (showMicro ? [{
    value: "",
    label: "ไมโคร ATMOCE (ตามอัตรา)"
  }] : []).concat(brandInvs.map(x => ({
    value: x.model,
    label: x.model + (x.kw ? " · " + x.kw + "kW" : "")
  })));
  React.useEffect(() => {
    const inList = brandInvs.some(x => x.model === b.inverterModel);
    if (!showMicro && !inList && brandInvs.length) set("inverterModel", brandInvs[0].model);else if (showMicro && b.inverterModel && !inList) set("inverterModel", "");
  }, [jobBrand, jobPhaseNum]);
  const maxPvTotal = selInv ? (selInv.maxPv || 0) * result.meta.invCount : 0;
  const pvOver = isHuawei && maxPvTotal > 0 && result.meta.kw > maxPvTotal;
  const perMppt = Math.max(1, Math.round(+(selInv && selInv.strPerMppt) || 1));
  const capPerInv = selInv ? Math.max(1, (+selInv.inputs || 1) * perMppt) : 1;
  const selPanel = window.BOQ.findPanel ? window.BOQ.findPanel(b.panelModel) : null;
  const isStringInv = !!(selInv && (selInv.type === "string" || selInv.type === "hybrid"));
  const scfg = isStringInv && window.BOQ.stringConfig ? window.BOQ.stringConfig(selPanel, selInv, {
    series: b.dcSeries != null && b.dcSeries !== "" ? b.dcSeries : undefined
  }) : null;
  const plan = scfg && scfg.ready && window.BOQ.stringPlan ? window.BOQ.stringPlan(result.meta.panelCount, scfg.series, selInv, result.meta.invCount) : null;
  const vdropFor = c => {
    if (!window.BOQ.calcVdrop || !c) return null;
    const n = (c.name || "").toUpperCase(),
      type = c.type || "";
    if (/LAN|CAT/i.test(type) || /GROUND|กราว|ดิน/.test(n)) return null;
    const size = window.BOQ.cableSizeNum(type),
      len = +c.length || 0;
    if (!size || !len) return null;
    const ins = window.BOQ.cableInsClass(type);
    const isDc = /PV1-F|PV CABLE/i.test(type) || /PV-INVERTER/.test(n);
    if (isDc) {
      if (!(scfg && scfg.ready && scfg.stringVop)) return null;
      const imp = +(selPanel && selPanel.imp) || 0;
      if (!imp) return null;
      const r = window.BOQ.calcVdrop({
        length: len,
        amp: imp,
        size,
        volts: scfg.stringVop,
        ins,
        phase: 1,
        dc: true
      });
      return r ? Object.assign(r, {
        dc: true
      }) : null;
    }
    const req = reqAmpFor(c.name);
    if (!req) return null;
    const ph = wcPhase === 3 && !/MICRO[\s-]*MICRO/.test(n) ? 3 : 1;
    const volts = ph === 3 ? +wcVolt || 400 : wcPhase === 3 ? 230 : +wcVolt || 230;
    return window.BOQ.calcVdrop({
      length: len,
      amp: req / 1.25,
      size,
      volts,
      ins,
      phase: ph,
      dc: false
    });
  };
  const vdropSum = React.useMemo(() => {
    let dc = 0,
      ac = 0,
      any = false;
    (b.cables || []).forEach(c => {
      const r = vdropFor(c);
      if (!r) return;
      any = true;
      if (r.dc) dc = Math.max(dc, r.pct);else ac += r.pct;
    });
    const LIM = window.BOQ.VD_LIMIT || {
      dc: 2,
      ac: 3,
      total: 5
    };
    return {
      any,
      dc: Math.round(dc * 100) / 100,
      ac: Math.round(ac * 100) / 100,
      total: Math.round((dc + ac) * 100) / 100,
      lim: LIM
    };
  }, [b.cables, scfg, wcPhase, wcVolt, selPanel, wireCalcRows, result]);
  const prevStringRef = React.useRef(null);
  React.useEffect(() => {
    if (prevStringRef.current === null) {
      prevStringRef.current = isStringInv;
      return;
    }
    if (prevStringRef.current === isStringInv) return;
    prevStringRef.current = isStringInv;
    const SYS = window.BOQ;
    const sysAll = (SYS.MICRO_CABLE_NAMES || []).concat(SYS.STRING_CABLE_POINTS || []);
    const defaults = isStringInv ? SYS.DEFAULT_STRING_CABLES || [] : (SYS.DEFAULT_CABLES || []).filter(c => (SYS.MICRO_CABLE_NAMES || []).indexOf(c.name) >= 0 && !(c.name === "COMBINER-BAT." && !hasBattery || c.name === "COMBINER-BACKUP" && !hasBackup));
    setB(p => {
      const keep = (p.cables || []).filter(c => sysAll.indexOf(c.name) < 0);
      return Object.assign({}, p, {
        cables: defaults.map(d => Object.assign({}, d)).concat(keep)
      });
    });
  }, [isStringInv]);
  const stringCalcRows = React.useMemo(() => {
    if (!isStringInv) return [];
    const invCount = result && result.meta && result.meta.invCount || 1;
    const outA = selInv ? +selInv.outA || 0 : 0;
    const phN = wcPhase === 3 ? "3 เฟส" : "1 เฟส";
    const rows = [];
    if (scfg && scfg.ready) {
      rows.push({
        kind: "pv",
        label: "PV-INVERTER (DC)",
        w: Math.round((scfg.series || 1) * (scfg.vRef || 0) * (scfg.isc || 0)),
        ampTotal: scfg.isc,
        ampString: scfg.isc,
        wire: scfg.dcWire,
        splittable: false,
        note: "สาย DC · " + scfg.series + " แผงอนุกรม · " + scfg.stringVop + "V · Isc " + scfg.isc + " A"
      });
    } else {
      rows.push({
        kind: "pv",
        label: "PV-INVERTER (DC)",
        w: null,
        ampTotal: 0,
        ampString: 0,
        wire: "—",
        needInput: true,
        splittable: false,
        note: "⚠ กรอก Voc/Isc แผง + ช่วง MPPT อินเวอร์เตอร์ (คลัง) เพื่อคำนวณสาย DC"
      });
    }
    rows.push({
      kind: "invmcb",
      label: "INVERTER → MCB_SOLAR",
      w: outA ? Math.round(outA * wcVolt) : null,
      ampTotal: outA,
      ampString: outA,
      wire: outA ? pickWire(outA) : "—",
      needInput: !outA,
      splittable: false,
      note: outA ? "กระแสออกอินเวอร์เตอร์/ตัว · " + phN + " · " + outA + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง"
    });
    const totalA = outA * invCount;
    rows.push({
      kind: "mcbmdb",
      label: "MCB_SOLAR → MDB (ตู้เมน)",
      w: totalA ? Math.round(totalA * wcVolt) : null,
      ampTotal: totalA,
      ampString: totalA,
      wire: totalA ? pickWire(totalA) : "—",
      needInput: !totalA,
      splittable: false,
      note: totalA ? "รวม " + invCount + " ตัว · " + phN + " · " + (Math.round(totalA * 10) / 10).toFixed(1) + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง"
    });
    return rows;
  }, [isStringInv, selInv, scfg, result, wcVolt, wcPhase, calcIns, calcMethod, calcGroup, calcNCond]);
  const calcRows = isStringInv ? stringCalcRows : wireCalcRows;
  const guardRun = fn => {
    if (remaining === 0) {
      fn();
      return;
    }
    const placed = "วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + " แผง";
    askConfirm({
      title: remaining > 0 ? "ยังวางแผงไม่ครบ — ขาดอีก " + remaining + " แผง" : "วางแผงเกินไป " + -remaining + " แผง",
      body: placed + (remaining > 0 ? "\nปริมาณ Mounting ที่ออกมาจะไม่ครบ" : "") + "\nต้องการดำเนินการต่อหรือไม่?",
      ok: "ดำเนินการต่อ",
      danger: false,
      icon: "alert"
    }).then(ok => {
      if (ok) fn();
    });
  };
  const opt = arr => arr.map(x => ({
    value: x,
    label: typeof x === "string" ? x.trim() : x
  }));
  const GROUP_COLOR = {
    "PV MODULE": "#22A35B",
    INVERTER: "#7C5CFC",
    "COMBINER BOX": "#4F46E5",
    MOUNTING: "#F59E0B",
    CABLE: "#0EA5E9",
    "RACE WAY": "#64748B",
    GROUNDING: "#A16207",
    "LADDER (บันไดลิง)": "#0D9488",
    "WALKWAY": "#D97706",
    "GUARD RAIL": "#DB2777",
    ACCESSORIES: "#EC4899",
    [window.BOQ.G_TRAY]: "#0891B2",
    [window.BOQ.G_SUPPORT]: "#78716C",
    [window.BOQ.G_LABOR]: "#2563EB",
    [window.BOQ.G_PERMIT]: "#9333EA",
    [window.BOQ.G_TRANSPORT]: "#0F766E",
    [window.BOQ.G_MANAGE]: "var(--tint-amber-tx)",
    "ตู้ไฟ": "#475569",
    "ระบบสูบน้ำ (WATER SYSTEM)": "#0284C7",
    "ถังเก็บน้ำ (TANK)": "#0369A1",
    "ท่อน้ำ (PIPE)": "#0E7490",
    "อุปกรณ์มอนิเตอร์": "#6D28D9"
  };
  const stockItems = stock && stock.items || [];
  const canEditPrice = !!(priceMap && stock && stock.upsertItem && window.saveMatPrice);
  const [editPx, setEditPx] = React.useState(null);
  const isService = grp => (window.BOQ.SERVICE_GROUPS || []).indexOf(grp) >= 0;
  const commitPx = () => {
    setEditPx(cur => {
      if (!cur) return null;
      if (String(cur.val).trim() !== "" && +cur.val >= 0) {
        window.saveMatPrice(stock, {
          name: cur.name,
          group: cur.group,
          unit: cur.unit,
          price: +cur.val
        });
      }
      return null;
    });
  };
  const [editVar, setEditVar] = React.useState(null);
  const setPick = (key, sku) => setB(p => {
    const pk = Object.assign({}, p.pick);
    if (!sku) delete pk[key];else pk[key] = sku;
    return Object.assign({}, p, {
      pick: pk
    });
  });
  const setRename = (key, name) => setB(p => {
    const r = Object.assign({}, p.rename);
    const v = String(name || "").trim();
    if (!v) delete r[key];else r[key] = v;
    const kp = Object.assign({}, p.renameKeep);
    if (!v) delete kp[key];
    return Object.assign({}, p, {
      rename: r,
      renameKeep: kp
    });
  });
  const setRenameKeep = (key, on) => setB(p => {
    const kp = Object.assign({}, p.renameKeep);
    if (on) kp[key] = true;else delete kp[key];
    return Object.assign({}, p, {
      renameKeep: kp
    });
  });
  const [editQty, setEditQty] = React.useState(null);
  const setQtyAdj = (key, v) => setB(p => {
    const a = Object.assign({}, p.qtyAdj);
    if (v == null || String(v).trim() === "") delete a[key];else a[key] = Math.max(0, +v || 0);
    return Object.assign({}, p, {
      qtyAdj: a
    });
  });
  const commitQty = () => setEditQty(cur => {
    if (cur) setQtyAdj(cur.key, cur.val);
    return null;
  });
  const matInfo = React.useMemo(() => {
    const m = {};
    (window.BOQ.catalog() || []).forEach(c => {
      m[c.name] = {
        unit: c.unit
      };
    });
    stockItems.forEach(s => {
      m[s.name] = {
        unit: s.unit || m[s.name] && m[s.name].unit || "",
        code: s.sku
      };
    });
    Object.keys(priceMap || {}).forEach(n => {
      m[n] = {
        unit: priceMap[n].unit || m[n] && m[n].unit || "",
        code: priceMap[n].code
      };
    });
    return m;
  }, [priceMap, stockItems.length]);
  const accCat = React.useMemo(() => {
    const SF = window.SF;
    const g2cat = SF.BOQ_GROUP_TO_CAT || {};
    const catTh = key => SF.STOCK_CAT_BY[key] ? SF.STOCK_CAT_BY[key].th : "อื่นๆ";
    const cat = window.BOQ.catalog() || [];
    const catKeys = new Set(cat.map(c => c.name));
    const byCat = {};
    const add = (c, n) => {
      if (!n) return;
      (byCat[c] = byCat[c] || new Set()).add(n);
    };
    cat.forEach(c => add(catTh(g2cat[c.group] || "accessory"), c.name));
    Object.keys(priceMap || {}).forEach(n => {
      if (!catKeys.has(n)) add(catTh(g2cat[priceMap[n].group] || "accessory"), n);
    });
    stockItems.forEach(s => add(catTh(s.cat), s.name));
    const order = (SF.STOCK_CATS || []).map(c => c.th);
    const cats = Object.keys(byCat).sort((a, z) => {
      const ia = order.indexOf(a),
        iz = order.indexOf(z);
      return (ia < 0 ? 99 : ia) - (iz < 0 ? 99 : iz);
    });
    const map = {};
    cats.forEach(c => {
      map[c] = [...byCat[c]].sort();
    });
    return {
      cats,
      map
    };
  }, [priceMap, stockItems.length]);
  const cableCat = window.BOQ.cableCategory || (n => "อื่นๆ");
  const CABLE_CAT_ORDER = window.BOQ.CABLE_GROUPS || ["อื่นๆ"];
  const cableTypeOptions = React.useMemo(() => {
    const wiringStock = stockItems.filter(s => window.SF.mainCatOf(s.cat) === "wiring");
    const groupByName = {};
    wiringStock.forEach(s => {
      if (s.name && s.cableGroup) groupByName[s.name] = s.cableGroup;
    });
    const used = (b.cables || []).map(c => c.type).filter(Boolean);
    const base = wiringStock.length ? wiringStock.map(s => s.name) : window.BOQ.CABLE_TYPES || [];
    return [...new Set(base.concat(used))].map(n => ({
      value: n,
      label: n,
      group: groupByName[n] || cableCat(n)
    })).sort((a, z) => CABLE_CAT_ORDER.indexOf(a.group) - CABLE_CAT_ORDER.indexOf(z.group) || String(a.value).localeCompare(String(z.value), "th", {
      numeric: true
    }));
  }, [stockItems, b.cables]);
  const methodOptions = (window.BOQ.WIRE_METHODS || []).map(m => ({
    value: m.key,
    label: m.th,
    sub: m.sub
  }));
  const insOptions = (window.BOQ.INS_CLASSES || []).map(c => ({
    value: c.key,
    label: c.th
  }));
  const groupOptions = (window.BOQ.AMP_GROUPS || []).map(g => ({
    value: g.key,
    label: g.th,
    sub: g.sub
  }));
  const groupOptionsFor = methodKey => {
    const m = (window.BOQ.WIRE_METHODS || []).find(x => x.key === methodKey);
    const allow = m && m.groups && m.groups.length ? m.groups : null;
    return allow ? groupOptions.filter(o => allow.indexOf(o.value) >= 0) : groupOptions;
  };
  const ncondOptions = (window.BOQ.AMP_NCOND || []).map(n => ({
    value: n.key,
    label: n.th
  }));
  const matSub = window.BOQ.materialSubGroup || (() => "อื่นๆ");
  const MAT_SUB_ORDER = window.BOQ.MATERIAL_SUBGROUPS || ["อื่นๆ"];
  const matItemOptions = (items, cat) => (items || []).map(n => ({
    value: n,
    label: n,
    group: matSub(n, cat)
  })).sort((a, z) => MAT_SUB_ORDER.indexOf(a.group) - MAT_SUB_ORDER.indexOf(z.group) || String(a.value).localeCompare(String(z.value), "th", {
    numeric: true
  }));
  const allMatOptions = React.useMemo(() => {
    const out = [],
      seen = {};
    accCat.cats.forEach(c => (accCat.map[c] || []).forEach(n => {
      const k = window.BOQ.matKey(n);
      if (seen[k]) return;
      seen[k] = 1;
      out.push({
        value: n,
        label: n,
        group: c
      });
    }));
    return out;
  }, [accCat]);
  const pipeOptions = React.useMemo(() => {
    const std = window.BOQ.pipeFittings().map(f => ({
      value: f.name,
      label: f.name,
      group: f.group
    }));
    const seen = new Set(std.map(o => window.BOQ.matKey(o.value)));
    stockItems.forEach(s => {
      const n = s.name || "";
      if (!/PP-?R|ท่อน้ำ|วาล์ว/i.test(n)) return;
      const k = window.BOQ.matKey(n);
      if (seen.has(k)) return;
      seen.add(k);
      std.push({
        value: n,
        label: n,
        group: "มีในคลังแล้ว"
      });
    });
    return std;
  }, [stockItems.length]);
  const accList = b.accessories || [];
  const setAcc = (i, k, v) => setB(p => {
    const a = (p.accessories || []).slice();
    a[i] = Object.assign({}, a[i], {
      [k]: v
    });
    if (k === "name" && matInfo[v]) a[i].unit = matInfo[v].unit || a[i].unit;
    return Object.assign({}, p, {
      accessories: a
    });
  });
  const setAccCat = (i, v) => setB(p => {
    const a = (p.accessories || []).slice();
    a[i] = Object.assign({}, a[i], {
      cat: v,
      name: ""
    });
    return Object.assign({}, p, {
      accessories: a
    });
  });
  const addAcc = () => setB(p => Object.assign({}, p, {
    accessories: (p.accessories || []).concat([{
      cat: "",
      name: "",
      qty: 1,
      unit: ""
    }])
  }));
  const delAcc = i => setB(p => Object.assign({}, p, {
    accessories: (p.accessories || []).filter((_, j) => j !== i)
  }));
  const ConduitList = ({
    kind,
    label,
    sizes,
    valKey,
    unitText,
    hint,
    check
  }) => {
    const OD = window.BOQ.CABLE_OD || {};
    const odTypes = Object.keys(OD);
    const setCables = (i, cs) => setCond(kind, i, "cables", cs);
    return React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginBottom: hint ? 3 : 7
      }
    }, label), hint && React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, hint), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, (cond[kind] || []).map((x, i) => {
      const cbs = x.cables || [];
      const chk = check ? window.BOQ.conduitCheck(x.size, cbs, sizes) : null;
      const open = condOpen[kind + i];
      const any = cbs.length > 0;
      const row = React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 78px 36px",
          gap: 8,
          alignItems: "center"
        }
      }, React.createElement(Dropdown, {
        value: x.size,
        onChange: v => setCond(kind, i, "size", v),
        options: opt(sizes),
        placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E19\u0E32\u0E14"
      }), React.createElement("input", {
        type: "number",
        style: numStyle,
        value: x[valKey],
        placeholder: unitText,
        onChange: e => setCond(kind, i, valKey, e.target.value)
      }), React.createElement("button", {
        onClick: () => delCond(kind, i),
        title: "\u0E25\u0E1A",
        style: {
          height: 40,
          background: "#EF444414",
          border: "none",
          color: "#EF4444",
          borderRadius: 9,
          cursor: "pointer",
          display: "grid",
          placeItems: "center"
        }
      }, React.createElement(Icon, {
        name: "x",
        size: 14
      })));
      if (!check) return React.createElement("div", {
        key: i
      }, row);
      return React.createElement("div", {
        key: i,
        style: {
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 9,
          background: "var(--surface2)"
        }
      }, row, React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 7,
          flexWrap: "wrap"
        }
      }, React.createElement("button", {
        onClick: () => setCondOpen(p => Object.assign({}, p, {
          [kind + i]: !open
        })),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          color: "var(--text-2)",
          fontWeight: 700,
          fontSize: 11.5,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0
        }
      }, React.createElement(Icon, {
        name: "settings",
        size: 13,
        color: "var(--text-2)"
      }), " \u0E2A\u0E32\u0E22\u0E17\u0E35\u0E48\u0E23\u0E49\u0E2D\u0E22\u0E43\u0E19\u0E17\u0E48\u0E2D\u0E19\u0E35\u0E49", any ? " (" + cbs.length + ")" : "", React.createElement(Icon, {
        name: "chevronDown",
        size: 13,
        color: "var(--text-2)",
        style: {
          transform: open ? "rotate(180deg)" : "none"
        }
      })), any && React.createElement("span", {
        style: {
          marginLeft: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: chk.ok ? "var(--tint-green-tx)" : "var(--tint-red-tx2)"
        }
      }, React.createElement("span", null, "\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21 ", chk.fillPct, "% / ", chk.limit, "%"), React.createElement("span", {
        style: {
          color: "var(--text-3)",
          fontWeight: 700
        }
      }, "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \xD7", chk.derate.toFixed(2)), React.createElement("span", null, chk.ok ? "✓" : "✗"))), open && React.createElement("div", {
        style: {
          marginTop: 9,
          display: "flex",
          flexDirection: "column",
          gap: 7
        }
      }, cbs.map((c, j) => React.createElement("div", {
        key: j,
        style: {
          display: "grid",
          gridTemplateColumns: isMobile ? "minmax(0,1fr) 72px 56px 32px" : "minmax(0,1fr) 92px 66px 32px",
          gap: 7,
          alignItems: "center"
        }
      }, React.createElement(Dropdown, {
        value: c.type,
        onChange: v => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          type: v,
          size: +(Object.keys(OD[v] || {})[0] || 2.5)
        }) : y)),
        options: opt(odTypes)
      }), React.createElement(Dropdown, {
        value: String(c.size),
        onChange: v => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          size: +v
        }) : y)),
        options: Object.keys(OD[c.type] || {}).map(s => ({
          value: s,
          label: s + " mm²"
        }))
      }), React.createElement("input", {
        type: "number",
        min: 1,
        style: numStyle,
        value: c.qty,
        placeholder: "\u0E40\u0E2A\u0E49\u0E19",
        onChange: e => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          qty: e.target.value
        }) : y))
      }), React.createElement("button", {
        onClick: () => setCables(i, cbs.filter((_, k) => k !== j)),
        title: "\u0E25\u0E1A",
        style: {
          height: 38,
          background: "#EF444414",
          border: "none",
          color: "#EF4444",
          borderRadius: 9,
          cursor: "pointer",
          display: "grid",
          placeItems: "center"
        }
      }, React.createElement(Icon, {
        name: "x",
        size: 13
      })))), React.createElement("button", {
        onClick: () => setCables(i, cbs.concat([{
          type: odTypes[0],
          size: +(Object.keys(OD[odTypes[0]] || {})[0] || 2.5),
          qty: 1
        }])),
        style: {
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "var(--surface3)",
          color: "var(--text-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 9,
          padding: "6px 10px",
          fontWeight: 700,
          fontSize: 11.5,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, React.createElement(Icon, {
        name: "plus",
        size: 12,
        color: "var(--text-2)"
      }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E32\u0E22"), any && React.createElement(React.Fragment, null, React.createElement("div", {
        className: "bq-spec",
        style: {
          marginTop: 2
        }
      }, React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E23\u0E39\u0E43\u0E19\u0E17\u0E48\u0E2D"), React.createElement("span", {
        className: "v"
      }, "\xD8", chk.dim.w, " = ", chk.dim.area.toLocaleString(), " mm\xB2")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E22\u0E23\u0E27\u0E21"), React.createElement("span", {
        className: "v"
      }, chk.area.toLocaleString(), " mm\xB2")), React.createElement("div", {
        "data-bad": chk.ok ? "0" : "1"
      }, React.createElement("span", {
        className: "k"
      }, "\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21 (\u0E40\u0E01\u0E13\u0E11\u0E4C ", chk.limit, "%)"), React.createElement("span", {
        className: "v hi"
      }, chk.fillPct, "%")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2A\u0E32\u0E22\u0E43\u0E19\u0E17\u0E48\u0E2D"), React.createElement("span", {
        className: "v"
      }, chk.runs, " \u0E40\u0E2A\u0E49\u0E19")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E15\u0E31\u0E27\u0E19\u0E33\u0E19\u0E33\u0E01\u0E23\u0E30\u0E41\u0E2A"), React.createElement("span", {
        className: "v"
      }, chk.cores, " \u0E40\u0E2A\u0E49\u0E19")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E25\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A"), React.createElement("span", {
        className: "v hi"
      }, "\xD7", chk.derate.toFixed(2))), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E17\u0E48\u0E2D\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33"), React.createElement("span", {
        className: "v"
      }, chk.needArea.toLocaleString(), " mm\xB2")), React.createElement("div", {
        "data-miss": chk.unknown.length ? "1" : "0"
      }, React.createElement("span", {
        className: "k"
      }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 OD"), React.createElement("span", {
        className: "v"
      }, chk.unknown.length ? chk.unknown.length + " ชนิด" : "ครบ"))), chk.dim.area === 0 && React.createElement("div", {
        className: "bq-note warn"
      }, React.createElement(Icon, {
        name: "alert",
        size: 15,
        color: "#F59E0B"
      }), React.createElement("span", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E19\u0E32\u0E14\u0E23\u0E39\u0E43\u0E19\u0E02\u0E2D\u0E07\u0E17\u0E48\u0E2D \"", x.size, "\" \u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E08\u0E36\u0E07\u0E15\u0E23\u0E27\u0E08 % \u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21\u0E43\u0E2B\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E48\u0E32\u0E23\u0E39\u0E43\u0E19\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E15\u0E32\u0E23\u0E32\u0E07 IMC_CONDUIT / UPVC_CONDUIT \u0E43\u0E19 boq.js")), chk.dim.area > 0 && !chk.ok && React.createElement("div", {
        className: "bq-note warn"
      }, React.createElement(Icon, {
        name: "alert",
        size: 15,
        color: "#F59E0B"
      }), React.createElement("span", null, "\u0E2A\u0E32\u0E22\u0E01\u0E34\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48 ", chk.fillPct, "% \u0E40\u0E01\u0E34\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C ", chk.limit, "% (", chk.runs === 1 ? "ร้อยสายเส้นเดียว" : chk.runs === 2 ? "ร้อย 2 เส้น" : "ร้อยตั้งแต่ 3 เส้นขึ้นไป", ") \u2014 ", chk.suggest ? "ขยับเป็น " + chk.suggest : "ต้องใช้ท่อที่มีพื้นที่อย่างน้อย " + chk.needArea.toLocaleString() + " mm² หรือแยกร้อยสองท่อ")), chk.ok && React.createElement("div", {
        className: "bq-note ok"
      }, React.createElement(Icon, {
        name: "check",
        size: 15,
        color: "#22A35B"
      }), React.createElement("span", null, "\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C \u2014 \u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E35\u0E01 ", (chk.limit - chk.fillPct).toFixed(1), "% \xB7 \u0E2D\u0E22\u0E48\u0E32\u0E25\u0E37\u0E21\u0E40\u0E2D\u0E32\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \xD7", chk.derate.toFixed(2), " \u0E44\u0E1B\u0E2B\u0E32\u0E23\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E02\u0E2D\u0E07\u0E2A\u0E32\u0E22\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E44\u0E1F")))));
    }), React.createElement("button", {
      onClick: () => addCond(kind, check ? {
        size: sizes[0],
        [valKey]: 0,
        cables: []
      } : {
        size: sizes[0],
        [valKey]: 0
      }),
      style: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 9,
        padding: "7px 11px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: "plus",
      size: 13,
      color: "var(--text-2)"
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21 ", label)));
  };
  const TrayList = ({
    kind,
    label,
    sizes,
    hint
  }) => {
    const isTray = kind === "tray";
    const OD = window.BOQ.CABLE_OD || {};
    const odTypes = Object.keys(OD);
    const setCables = (i, cs) => setTrayRow(kind, i, "cables", cs);
    return React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginBottom: 3
      }
    }, label), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, hint), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, (tw[kind] || []).map((x, i) => {
      const cbs = x.cables || [];
      const chk = window.BOQ.trayCheck(x.size, cbs, isTray, sizes);
      const open = trayOpen[kind + i];
      const any = cbs.length > 0;
      return React.createElement("div", {
        key: i,
        style: {
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 9,
          background: "var(--surface2)"
        }
      }, React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 78px 36px",
          gap: 8,
          alignItems: "center"
        }
      }, React.createElement(Dropdown, {
        value: x.size,
        onChange: v => setTrayRow(kind, i, "size", v),
        options: opt(sizes),
        placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E19\u0E32\u0E14"
      }), React.createElement("input", {
        type: "number",
        style: numStyle,
        value: x.length,
        placeholder: "\u0E21.",
        onChange: e => setTrayRow(kind, i, "length", e.target.value)
      }), React.createElement("button", {
        onClick: () => delTrayRow(kind, i),
        title: "\u0E25\u0E1A",
        style: {
          height: 40,
          background: "#EF444414",
          border: "none",
          color: "#EF4444",
          borderRadius: 9,
          cursor: "pointer",
          display: "grid",
          placeItems: "center"
        }
      }, React.createElement(Icon, {
        name: "x",
        size: 14
      }))), React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 7,
          flexWrap: "wrap"
        }
      }, React.createElement("button", {
        onClick: () => setTrayOpen(p => Object.assign({}, p, {
          [kind + i]: !open
        })),
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          color: "var(--text-2)",
          fontWeight: 700,
          fontSize: 11.5,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0
        }
      }, React.createElement(Icon, {
        name: "settings",
        size: 13,
        color: "var(--text-2)"
      }), " \u0E2A\u0E32\u0E22\u0E17\u0E35\u0E48\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E23\u0E32\u0E07\u0E19\u0E35\u0E49", any ? " (" + cbs.length + ")" : "", React.createElement(Icon, {
        name: "chevronDown",
        size: 13,
        color: "var(--text-2)",
        style: {
          transform: open ? "rotate(180deg)" : "none"
        }
      })), any && React.createElement("span", {
        style: {
          marginLeft: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: chk.ok && chk.widthOk ? "var(--tint-green-tx)" : "var(--tint-red-tx2)"
        }
      }, React.createElement("span", null, "\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21 ", chk.fillPct, "% / ", chk.limit, "%"), React.createElement("span", {
        style: {
          color: "var(--text-3)",
          fontWeight: 700
        }
      }, "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \xD7", chk.derate.toFixed(2)), React.createElement("span", null, chk.ok && chk.widthOk ? "✓" : "✗"))), open && React.createElement("div", {
        style: {
          marginTop: 9,
          display: "flex",
          flexDirection: "column",
          gap: 7
        }
      }, cbs.map((c, j) => React.createElement("div", {
        key: j,
        style: {
          display: "grid",
          gridTemplateColumns: isMobile ? "minmax(0,1fr) 72px 56px 32px" : "minmax(0,1fr) 92px 66px 32px",
          gap: 7,
          alignItems: "center"
        }
      }, React.createElement(Dropdown, {
        value: c.type,
        onChange: v => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          type: v,
          size: +(Object.keys(OD[v] || {})[0] || 2.5)
        }) : y)),
        options: opt(odTypes)
      }), React.createElement(Dropdown, {
        value: String(c.size),
        onChange: v => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          size: +v
        }) : y)),
        options: Object.keys(OD[c.type] || {}).map(s => ({
          value: s,
          label: s + " mm²"
        }))
      }), React.createElement("input", {
        type: "number",
        min: 1,
        style: numStyle,
        value: c.qty,
        placeholder: "\u0E40\u0E2A\u0E49\u0E19",
        onChange: e => setCables(i, cbs.map((y, k) => k === j ? Object.assign({}, y, {
          qty: e.target.value
        }) : y))
      }), React.createElement("button", {
        onClick: () => setCables(i, cbs.filter((_, k) => k !== j)),
        title: "\u0E25\u0E1A",
        style: {
          height: 38,
          background: "#EF444414",
          border: "none",
          color: "#EF4444",
          borderRadius: 9,
          cursor: "pointer",
          display: "grid",
          placeItems: "center"
        }
      }, React.createElement(Icon, {
        name: "x",
        size: 13
      })))), React.createElement("button", {
        onClick: () => setCables(i, cbs.concat([{
          type: odTypes[0],
          size: +(Object.keys(OD[odTypes[0]] || {})[0] || 2.5),
          qty: 1
        }])),
        style: {
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "var(--surface3)",
          color: "var(--text-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: 9,
          padding: "6px 10px",
          fontWeight: 700,
          fontSize: 11.5,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, React.createElement(Icon, {
        name: "plus",
        size: 12,
        color: "var(--text-2)"
      }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E32\u0E22"), any && React.createElement(React.Fragment, null, React.createElement("div", {
        className: "bq-spec",
        style: {
          marginTop: 2
        }
      }, React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E23\u0E32\u0E07"), React.createElement("span", {
        className: "v"
      }, chk.dim.w, "\xD7", chk.dim.h, " = ", chk.dim.area.toLocaleString(), " mm\xB2")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E22\u0E23\u0E27\u0E21"), React.createElement("span", {
        className: "v"
      }, chk.area.toLocaleString(), " mm\xB2")), React.createElement("div", {
        "data-bad": chk.ok ? "0" : "1"
      }, React.createElement("span", {
        className: "k"
      }, "\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21 (\u0E40\u0E01\u0E13\u0E11\u0E4C ", chk.limit, "%)"), React.createElement("span", {
        className: "v hi"
      }, chk.fillPct, "%")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E15\u0E31\u0E27\u0E19\u0E33\u0E19\u0E33\u0E01\u0E23\u0E30\u0E41\u0E2A"), React.createElement("span", {
        className: "v"
      }, chk.cores, " \u0E40\u0E2A\u0E49\u0E19")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E25\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A"), React.createElement("span", {
        className: "v hi"
      }, "\xD7", chk.derate.toFixed(2))), isTray && React.createElement("div", {
        "data-bad": chk.widthOk ? "0" : "1"
      }, React.createElement("span", {
        className: "k"
      }, "\u0E1C\u0E25\u0E23\u0E27\u0E21 \xD8 (\u0E27\u0E32\u0E07\u0E0A\u0E31\u0E49\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27)"), React.createElement("span", {
        className: "v"
      }, chk.odSum, " / ", chk.dim.w, " mm")), React.createElement("div", null, React.createElement("span", {
        className: "k"
      }, "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E23\u0E32\u0E07\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33"), React.createElement("span", {
        className: "v"
      }, chk.needArea.toLocaleString(), " mm\xB2")), React.createElement("div", {
        "data-miss": chk.unknown.length ? "1" : "0"
      }, React.createElement("span", {
        className: "k"
      }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 OD"), React.createElement("span", {
        className: "v"
      }, chk.unknown.length ? chk.unknown.length + " ชนิด" : "ครบ"))), !chk.ok && React.createElement("div", {
        className: "bq-note warn"
      }, React.createElement(Icon, {
        name: "alert",
        size: 15,
        color: "#F59E0B"
      }), React.createElement("span", null, "\u0E2A\u0E32\u0E22\u0E01\u0E34\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48 ", chk.fillPct, "% \u0E40\u0E01\u0E34\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C ", chk.limit, "% \u2014 ", chk.suggest ? "ขยับเป็น " + chk.suggest : "ต้องใช้รางที่มีพื้นที่อย่างน้อย " + chk.needArea.toLocaleString() + " mm² หรือแยกเดินสองราง")), chk.ok && !chk.widthOk && React.createElement("div", {
        className: "bq-note warn"
      }, React.createElement(Icon, {
        name: "alert",
        size: 15,
        color: "#F59E0B"
      }), React.createElement("span", null, "\u0E1C\u0E25\u0E23\u0E27\u0E21\u0E40\u0E2A\u0E49\u0E19\u0E1C\u0E48\u0E32\u0E19\u0E28\u0E39\u0E19\u0E22\u0E4C\u0E01\u0E25\u0E32\u0E07 ", chk.odSum, " mm \u0E01\u0E27\u0E49\u0E32\u0E07\u0E01\u0E27\u0E48\u0E32\u0E23\u0E32\u0E07 ", chk.dim.w, " mm \u2014 \u0E2A\u0E32\u0E22\u0E08\u0E30\u0E0B\u0E49\u0E2D\u0E19\u0E01\u0E31\u0E19\u0E2B\u0E25\u0E32\u0E22\u0E0A\u0E31\u0E49\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E04\u0E34\u0E14\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E25\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E22\u0E32\u0E22\u0E23\u0E32\u0E07")), chk.ok && chk.widthOk && React.createElement("div", {
        className: "bq-note ok"
      }, React.createElement(Icon, {
        name: "check",
        size: 15,
        color: "#22A35B"
      }), React.createElement("span", null, "\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C \u2014 \u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E35\u0E01 ", (chk.limit - chk.fillPct).toFixed(1), "% \xB7 \u0E2D\u0E22\u0E48\u0E32\u0E25\u0E37\u0E21\u0E40\u0E2D\u0E32\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \xD7", chk.derate.toFixed(2), " \u0E44\u0E1B\u0E2B\u0E32\u0E23\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E02\u0E2D\u0E07\u0E2A\u0E32\u0E22\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E44\u0E1F")))));
    }), React.createElement("button", {
      onClick: () => addTrayRow(kind, {
        size: sizes[0],
        length: 0,
        cables: []
      }),
      style: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 9,
        padding: "7px 11px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: "plus",
      size: 13,
      color: "var(--text-2)"
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21 ", label)));
  };
  const FitList = ({
    rows,
    onChange,
    catalog,
    hint
  }) => {
    const list = rows || [];
    const set = (i, patch) => onChange(list.map((y, j) => j === i ? Object.assign({}, y, patch) : y));
    const options = React.useMemo(() => {
      const base = catalog.map(f => ({
        value: f.name,
        label: f.name,
        group: f.group
      }));
      const known = new Set(base.map(o => o.value));
      list.forEach(x => {
        const n = (x.name || "").trim();
        if (n && !known.has(n)) {
          known.add(n);
          base.push({
            value: n,
            label: n,
            group: "พิมพ์เอง"
          });
        }
      });
      return base;
    }, [catalog, list]);
    const unitOf = n => {
      const f = catalog.find(x => x.name === n);
      return f ? f.unit : "";
    };
    return React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginBottom: 3
      }
    }, "\u0E02\u0E49\u0E2D\u0E07\u0E2D / \u0E02\u0E49\u0E2D\u0E25\u0E14 / \u0E2A\u0E32\u0E21\u0E17\u0E32\u0E07"), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, hint), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, list.map((x, i) => React.createElement("div", {
      key: i,
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 78px 62px 36px",
        gap: 8,
        alignItems: "center"
      }
    }, React.createElement(Dropdown, {
      value: x.name || "",
      options: options,
      placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D",
      wrap: true,
      addable: true,
      onAdd: () => {},
      onChange: v => set(i, {
        name: v,
        unit: x.unit || unitOf(v) || "ชุด"
      })
    }), React.createElement("input", {
      type: "number",
      style: numStyle,
      value: x.qty != null ? x.qty : "",
      placeholder: "\u0E08\u0E33\u0E19\u0E27\u0E19",
      onChange: e => set(i, {
        qty: e.target.value
      })
    }), React.createElement("input", {
      value: x.unit || "",
      placeholder: "\u0E2B\u0E19\u0E48\u0E27\u0E22",
      style: inputStyle,
      onChange: e => set(i, {
        unit: e.target.value
      })
    }), React.createElement("button", {
      onClick: () => onChange(list.filter((_, j) => j !== i)),
      title: "\u0E25\u0E1A",
      style: {
        height: 40,
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        borderRadius: 9,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 14
    })))), React.createElement("button", {
      onClick: () => onChange(list.concat([{
        name: "",
        qty: "",
        unit: (catalog[0] || {}).unit || "ชุด"
      }])),
      style: {
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 9,
        padding: "7px 11px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: "plus",
      size: 13,
      color: "var(--text-2)"
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D")));
  };
  const SVC_GROUP = {
    labor: window.BOQ.G_LABOR,
    permit: window.BOQ.G_PERMIT,
    transport: window.BOQ.G_TRANSPORT,
    manage: window.BOQ.G_MANAGE
  };
  const SvcTable = ({
    sKey,
    preset,
    qtyLabel,
    total,
    perW
  }) => {
    const rows = svcList(sKey, preset);
    const g = (priced.groups || []).find(x => x.group === SVC_GROUP[sKey]);
    const live = g && g.items || [];
    const sum = total != null ? total : g ? g.subtotal : 0;
    const sumPerW = perW != null ? perW : g ? g.perW : 0;
    return React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "minmax(0,1fr) 62px 36px" : "minmax(0,1fr) 84px 62px 96px 36px",
        gap: 8,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: ".05em",
        color: "var(--text-3)",
        textTransform: "uppercase",
        padding: "0 2px"
      }
    }, React.createElement("span", null, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), !isMobile && React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, qtyLabel), !isMobile && React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("span", null)), rows.map((r, i) => {
      const q = live[i] ? live[i].qty : +r.qty || 0;
      const tot = q * (+r.price || 0);
      return React.createElement("div", {
        key: i,
        style: {
          display: "grid",
          gridTemplateColumns: isMobile ? "minmax(0,1fr) 62px 36px" : "minmax(0,1fr) 84px 62px 96px 36px",
          gap: 8,
          alignItems: "center"
        }
      }, React.createElement("span", {
        style: {
          minWidth: 0
        }
      }, React.createElement("input", {
        value: r.name,
        onChange: e => setSvc(sKey, preset, i, "name", e.target.value),
        style: Object.assign({}, inputStyle, {
          width: "100%"
        }),
        placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"
      }), tot > 0 && React.createElement("span", {
        style: {
          display: "block",
          fontSize: 10,
          color: "var(--text-3)",
          marginTop: 2,
          paddingLeft: 2
        }
      }, "= \u0E3F", baht(tot), result.meta.kw > 0 ? " · ฿" + baht(tot / (result.meta.kw * 1000)) + "/W" : "")), !isMobile && (r.auto ? React.createElement("span", {
        style: {
          textAlign: "right",
          fontFamily: "var(--mono)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--primary-dark)"
        },
        title: "\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E1C\u0E25\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"
      }, (Math.round(q * 100) / 100).toLocaleString()) : React.createElement("input", {
        type: "number",
        style: numStyle,
        value: r.qty != null ? r.qty : "",
        onChange: e => setSvc(sKey, preset, i, "qty", e.target.value)
      })), !isMobile && React.createElement("input", {
        value: r.unit || "",
        onChange: e => setSvc(sKey, preset, i, "unit", e.target.value),
        style: Object.assign({}, inputStyle, {
          width: "100%",
          textAlign: "right"
        })
      }), React.createElement("input", {
        type: "number",
        style: numStyle,
        value: r.price != null ? r.price : "",
        placeholder: "0",
        onChange: e => setSvc(sKey, preset, i, "price", e.target.value)
      }), React.createElement("button", {
        className: "bq-x",
        onClick: () => delSvc(sKey, preset, i),
        title: "\u0E25\u0E1A\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14"
      }, React.createElement(Icon, {
        name: "x",
        size: 14
      })));
    }), sum > 0 && React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "10px 12px",
        marginTop: 2,
        background: "var(--primary-soft)",
        borderRadius: 10
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: ".06em",
        color: "var(--primary-dark)"
      }
    }, "\u0E23\u0E27\u0E21\u0E17\u0E38\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14"), React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-.03em",
        fontVariantNumeric: "tabular-nums",
        color: "var(--primary-dark)"
      }
    }, "\u0E3F", baht(sum), sumPerW > 0 ? React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        marginLeft: 6
      }
    }, "\xB7 \u0E3F", baht(sumPerW), "/W") : null)), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      }
    }, React.createElement("button", {
      onClick: () => addSvc(sKey, preset),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "none",
        color: "var(--primary-dark)",
        border: "1px dashed var(--border-strong)",
        borderRadius: 9,
        padding: "6px 12px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: "plus",
      size: 13,
      color: "var(--primary-dark)"
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14"), b[sKey] != null && React.createElement("button", {
      onClick: () => resetSvc(sKey),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 9,
        padding: "8px 12px",
        fontWeight: 700,
        fontSize: 12.5,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "\u0E04\u0E37\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19")));
  };
  const StructBlock = ({
    kind,
    label,
    color,
    addLabel,
    cols,
    blank,
    extra,
    spare,
    onSpare,
    extraItems,
    onExtraAdd,
    onExtraChange,
    onExtraDel
  }) => React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 12,
      background: "var(--surface2)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginBottom: 9
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: color
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, label), extra && React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, extra)), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, (st[kind] || []).map((x, i) => React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: cols.map(() => "1fr").join(" ") + " 36px",
      gap: 8,
      alignItems: "center"
    }
  }, cols.map(c => React.createElement("input", {
    key: c.k,
    type: "number",
    style: numStyle,
    value: x[c.k] != null ? x[c.k] : "",
    placeholder: c.ph,
    onChange: e => setStruct(kind, i, c.k, e.target.value)
  })), React.createElement("button", {
    onClick: () => delStruct(kind, i),
    title: "\u0E25\u0E1A",
    style: {
      height: 40,
      background: "#EF444414",
      border: "none",
      color: "#EF4444",
      borderRadius: 9,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14
  })))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("button", {
    onClick: () => addStruct(kind, Object.assign({}, blank)),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "var(--surface3)",
      color: "var(--text-2)",
      border: "1px solid var(--border-strong)",
      borderRadius: 9,
      padding: "7px 11px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: "var(--text-2)"
  }), " ", addLabel), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "% \u0E40\u0E1C\u0E37\u0E48\u0E2D"), React.createElement("input", {
    type: "number",
    min: 0,
    max: 99,
    style: Object.assign({}, numStyle, {
      width: 58
    }),
    value: spare != null ? spare : "",
    placeholder: "5",
    onChange: e => onSpare(e.target.value)
  })))), extraItems && extraItems.length > 0 && React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E40\u0E1E\u0E34\u0E48\u0E21 (\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A)"), extraItems.map((x, i) => React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 64px 52px 36px",
      gap: 6,
      alignItems: "center"
    }
  }, React.createElement("input", {
    value: x.name || "",
    onChange: e => onExtraChange(i, "name", e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E2A\u0E14\u0E38",
    style: inputStyle
  }), React.createElement("input", {
    type: "number",
    value: x.qty || "",
    onChange: e => onExtraChange(i, "qty", e.target.value),
    placeholder: "\u0E08\u0E33\u0E19\u0E27\u0E19",
    style: numStyle
  }), React.createElement("input", {
    value: x.unit || "",
    onChange: e => onExtraChange(i, "unit", e.target.value),
    placeholder: "\u0E2B\u0E19\u0E48\u0E27\u0E22",
    style: inputStyle
  }), React.createElement("button", {
    onClick: () => onExtraDel(i),
    style: {
      height: 40,
      background: "#EF444414",
      border: "none",
      color: "#EF4444",
      borderRadius: 9,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14
  }))))), React.createElement("button", {
    onClick: onExtraAdd,
    style: {
      marginTop: extraItems && extraItems.length > 0 ? 6 : 10,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "none",
      border: "none",
      color: "var(--text-3)",
      fontWeight: 600,
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      padding: 0
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 12,
    color: "var(--text-3)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A"));
  const exportXlsx = () => {
    if (!window.XLSX) {
      alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)");
      return;
    }
    const X = window.XLSX;
    const hasPrice = priced.grandTotal > 0;
    const C = {
      brand: "1D854B",
      brandDk: "0F5233",
      brandSoft: "EAF6EF",
      group: "D3E9DC",
      alt: "F6FAF7",
      white: "FFFFFF",
      line: "C3D4CA",
      lineSoft: "E2EBE5",
      text: "16241D",
      sub: "6B7C73",
      red: "B4232A",
      gold: "8A6D1F",
      goldSoft: "FBF6E7"
    };
    const FONT = "Tahoma";
    const hair = {
      style: "hair",
      color: {
        rgb: C.lineSoft
      }
    };
    const thin = {
      style: "thin",
      color: {
        rgb: C.line
      }
    };
    const med = {
      style: "medium",
      color: {
        rgb: C.brand
      }
    };
    const moneyFmt = '#,##0.00;[Red]-#,##0.00';
    const qtyFmt = '#,##0.##';
    const pctFmt = '0.0"%"';
    const perWFmt = '#,##0.000';
    const mkSheet = (lastC, colW) => {
      const S = {
        aoa: [],
        merges: [],
        meta: [],
        rows: [],
        lastC: lastC,
        colW: colW,
        R: 0
      };
      S.push = (cells, type, hpt) => {
        const row = [];
        for (let i = 0; i <= lastC; i++) row.push(cells[i] != null ? cells[i] : "");
        S.aoa.push(row);
        S.meta[S.R] = type;
        if (hpt) S.rows[S.R] = {
          hpt: hpt
        };
        S.R += 1;
        return S.R - 1;
      };
      S.merge = (r, c1, c2) => {
        if (c2 > c1) S.merges.push({
          s: {
            r: r,
            c: c1
          },
          e: {
            r: r,
            c: c2
          }
        });
      };
      S.band = (cells, type, hpt) => {
        const r = S.push(cells, type, hpt);
        S.merge(r, 0, lastC);
        return r;
      };
      S.gap = hpt => S.push([], "spacer", hpt || 7);
      return S;
    };
    const docHead = (S, title, sub) => {
      S.band([title], "title", 34);
      S.band([sub], "subtitle", 19);
      S.gap(5);
    };
    const paint = (S, styleFn) => {
      const ws = X.utils.aoa_to_sheet(S.aoa);
      ws["!merges"] = S.merges;
      ws["!cols"] = S.colW;
      ws["!rows"] = S.rows;
      ws["!margins"] = {
        left: 0.4,
        right: 0.4,
        top: 0.55,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3
      };
      const range = X.utils.decode_range(ws["!ref"]);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const s = styleFn(S.meta[r], r, c);
          if (!s) continue;
          const ref = X.utils.encode_cell({
            r: r,
            c: c
          });
          if (!ws[ref]) ws[ref] = {
            t: "s",
            v: ""
          };
          ws[ref].s = s;
        }
      }
      return ws;
    };
    const commonStyle = (t, lastC, c) => {
      if (t === "spacer") return {
        font: {
          name: FONT,
          sz: 6
        }
      };
      if (t === "title") return {
        font: {
          name: FONT,
          sz: 15,
          bold: true,
          color: {
            rgb: C.white
          }
        },
        fill: {
          patternType: "solid",
          fgColor: {
            rgb: C.brand
          }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
      if (t === "subtitle") return {
        font: {
          name: FONT,
          sz: 10,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        },
        fill: {
          patternType: "solid",
          fgColor: {
            rgb: C.brandSoft
          }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          bottom: med
        }
      };
      if (t === "note") return {
        font: {
          name: FONT,
          sz: 9.5,
          italic: true,
          color: {
            rgb: C.sub
          }
        },
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true
        }
      };
      if (t === "sec") return {
        font: {
          name: FONT,
          sz: 11,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        },
        alignment: {
          horizontal: "left",
          vertical: "center"
        },
        border: {
          bottom: {
            style: "medium",
            color: {
              rgb: C.group
            }
          }
        }
      };
      return null;
    };
    const F = (f, v) => ({
      t: "n",
      f: f,
      v: +v || 0
    });
    const CL = c => X.utils.encode_col(c);
    const AT = (col, r) => col + (r + 1);
    const jobName = job && job.name || "—";
    const jobCode = job && job.code || "—";
    const kwTxt = (result.meta.kw || 0).toLocaleString("en-US", {
      maximumFractionDigits: 2
    }) + " kWp";
    const itemCount = priced.groups.reduce((s, g) => s + g.items.length, 0);
    const cols = hasPrice ? ["ลำดับ", "รหัสวัสดุ", "รายการ", "ยี่ห้อ", "รุ่น", "จำนวน", "หน่วย", "ราคา/หน่วย", "จำนวนเงิน"] : ["ลำดับ", "รหัสวัสดุ", "รายการ", "ยี่ห้อ", "รุ่น", "จำนวน", "หน่วย"];
    const cNo = 0,
      cCode = 1,
      cName = 2,
      cBrand = 3,
      cModel = 4,
      cQty = 5,
      cUnit = 6,
      cPrice = 7;
    const lastC = cols.length - 1;
    const colW = hasPrice ? [{
      wch: 7
    }, {
      wch: 14
    }, {
      wch: 40
    }, {
      wch: 15
    }, {
      wch: 18
    }, {
      wch: 9.5
    }, {
      wch: 8
    }, {
      wch: 13
    }, {
      wch: 15
    }] : [{
      wch: 7
    }, {
      wch: 16
    }, {
      wch: 46
    }, {
      wch: 16
    }, {
      wch: 20
    }, {
      wch: 11
    }, {
      wch: 10
    }];
    const A = mkSheet(lastC, colW);
    docHead(A, "บัญชีแสดงปริมาณวัสดุ  ·  BILL OF QUANTITIES", "PHITHAN GREEN  —  งานติดตั้งระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์");
    const mid = Math.ceil((lastC + 1) / 2);
    const info = [["โครงการ", jobName, "รหัสงาน", jobCode], ["ขนาดระบบ", (result.meta.panelCount || 0).toLocaleString("en-US") + " แผง  ·  " + kwTxt, "ระบบไฟ", String(b.phase) === "3" ? "3 เฟส 380V" : "1 เฟส 220V"], ["จำนวนรายการ", itemCount.toLocaleString("en-US") + " รายการ / " + priced.groups.length + " หมวด", "วันที่ออกเอกสาร", window.SF.TODAY || ""]];
    info.forEach(row => {
      const cells = [];
      cells[0] = row[0];
      cells[1] = row[1];
      cells[mid] = row[2];
      cells[mid + 1] = row[3];
      const r = A.push(cells, "info", 18);
      A.merge(r, 1, mid - 1);
      A.merge(r, mid + 1, lastC);
    });
    A.gap(9);
    A.push(cols, "head", 24);
    const QC = CL(cQty),
      PC = CL(cPrice),
      TC = CL(lastC);
    const groupRows = [];
    let n = 0,
      bodyStart = null,
      bodyEnd = null;
    priced.groups.forEach(g => {
      n += 1;
      const grow = [];
      grow[0] = "หมวด " + n;
      grow[1] = g.group;
      const gr = A.push(grow, "group", 21);
      A.merge(gr, 1, hasPrice ? lastC - 1 : lastC);
      if (bodyStart == null) bodyStart = gr;
      groupRows.push(gr);
      const first = A.R;
      g.items.forEach((it, k) => {
        const base = [n + "." + (k + 1), it.code || "", it.name || "", it.brand || "", it.model || "", +it.qty || 0, it.unit || ""];
        if (hasPrice) {
          const er = A.R;
          base.push(it.price || 0);
          base.push(F("ROUND(" + AT(QC, er) + "*" + AT(PC, er) + ",2)", it.total || 0));
        }
        A.push(base, k % 2 === 0 ? "item" : "itemAlt", 17);
      });
      const tail = A.push([], "grouptail", 5);
      bodyEnd = tail;
      if (hasPrice) A.aoa[gr][lastC] = g.items.length ? F("ROUND(SUM(" + AT(TC, first) + ":" + AT(TC, tail) + "),2)", g.subtotal) : 0;
    });
    if (hasPrice) {
      const gsum = 'SUMIF($' + CL(0) + "$" + (bodyStart + 1) + ":$" + CL(0) + "$" + (bodyEnd + 1) + ',"หมวด*",$' + TC + "$" + (bodyStart + 1) + ":$" + TC + "$" + (bodyEnd + 1) + ")";
      const totRow = [];
      totRow[cName] = "รวมต้นทุนใบถอดวัสดุ (ก่อน VAT)";
      totRow[lastC] = F("ROUND(" + gsum + ",2)", priced.grandTotal);
      const tr = A.push(totRow, "total", 26);
      A.merge(tr, 0, lastC - 1);
    }
    A.gap(6);
    const nr = A.band([hasPrice ? "หมายเหตุ  ·  ปริมาณคำนวณจากแบบและรวม % เผื่อแล้ว  ·  ราคาเป็นราคาต้นทุนก่อนภาษีมูลค่าเพิ่ม  ·  ช่องยอดเป็นสูตร แก้จำนวน/ราคา หรือแทรกบรรทัดในหมวด แล้วยอดหมวด ยอดรวม และชีตสรุปราคาคิดใหม่ให้เอง  ·  เอกสารสร้างอัตโนมัติจากระบบ PHITHAN GREEN" : "หมายเหตุ  ·  ปริมาณคำนวณจากแบบและรวม % เผื่อแล้ว  ·  เอกสารสร้างอัตโนมัติจากระบบ PHITHAN GREEN"], "note", 26);
    A.merges.push({
      s: {
        r: nr,
        c: 0
      },
      e: {
        r: nr,
        c: lastC
      }
    });
    const wsA = paint(A, (t, r, c) => {
      const com = commonStyle(t, lastC, c);
      if (com) return com;
      const s = {
        font: {
          name: FONT,
          sz: 10.5,
          color: {
            rgb: C.text
          }
        },
        alignment: {
          vertical: "center"
        }
      };
      if (t === "info") {
        const isLabel = c === 0 || c === mid;
        if (isLabel) {
          s.font = {
            name: FONT,
            sz: 10,
            bold: true,
            color: {
              rgb: C.sub
            }
          };
          s.alignment = {
            horizontal: "left",
            vertical: "center"
          };
        } else {
          s.font = {
            name: FONT,
            sz: 11,
            bold: true,
            color: {
              rgb: C.text
            }
          };
          s.alignment = {
            horizontal: "left",
            vertical: "center"
          };
        }
        s.border = {
          bottom: hair
        };
      } else if (t === "head") {
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.white
          }
        };
        s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brand
          }
        };
        s.alignment = {
          horizontal: c === cName || c === cBrand || c === cModel ? "left" : "center",
          vertical: "center",
          wrapText: true
        };
        s.border = {
          top: thin,
          bottom: thin,
          left: {
            style: "thin",
            color: {
              rgb: C.brand
            }
          },
          right: {
            style: "thin",
            color: {
              rgb: C.brand
            }
          }
        };
      } else if (t === "group") {
        s.font = {
          name: FONT,
          sz: 11,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        };
        s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.group
          }
        };
        s.alignment = {
          horizontal: c === 0 ? "center" : c === lastC ? "right" : "left",
          vertical: "center"
        };
        if (c === lastC && hasPrice) s.numFmt = moneyFmt;
        s.border = {
          top: thin,
          bottom: thin,
          left: hair,
          right: hair
        };
      } else if (t === "grouptail") {
        s.font = {
          name: FONT,
          sz: 5
        };
        s.border = {
          left: hair,
          right: hair,
          bottom: hair
        };
      } else if (t === "item" || t === "itemAlt") {
        if (t === "itemAlt") s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.alt
          }
        };
        s.border = {
          top: hair,
          bottom: hair,
          left: hair,
          right: hair
        };
        if (c === cNo) {
          s.alignment = {
            horizontal: "center",
            vertical: "center"
          };
          s.font = {
            name: FONT,
            sz: 9.5,
            color: {
              rgb: C.sub
            }
          };
        } else if (c === cCode) {
          s.alignment = {
            horizontal: "center",
            vertical: "center"
          };
          s.font = {
            name: FONT,
            sz: 9,
            color: {
              rgb: C.sub
            }
          };
        } else if (c === cName) s.alignment = {
          horizontal: "left",
          vertical: "center",
          wrapText: true,
          indent: 1
        };else if (c === cBrand) {
          s.alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
            indent: 1
          };
          s.font = {
            name: FONT,
            sz: 9.5,
            bold: true,
            color: {
              rgb: C.sub
            }
          };
        } else if (c === cModel) {
          s.alignment = {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
            indent: 1
          };
          s.font = {
            name: FONT,
            sz: 9.5,
            color: {
              rgb: C.sub
            }
          };
        } else if (c === cQty) {
          s.alignment = {
            horizontal: "right",
            vertical: "center"
          };
          s.numFmt = qtyFmt;
          s.font = {
            name: FONT,
            sz: 10.5,
            bold: true,
            color: {
              rgb: C.text
            }
          };
        } else if (c === cUnit) {
          s.alignment = {
            horizontal: "center",
            vertical: "center"
          };
          s.font = {
            name: FONT,
            sz: 10,
            color: {
              rgb: C.sub
            }
          };
        } else {
          s.alignment = {
            horizontal: "right",
            vertical: "center"
          };
          s.numFmt = moneyFmt;
          if (c === lastC) s.font = {
            name: FONT,
            sz: 10.5,
            bold: true,
            color: {
              rgb: C.text
            }
          };
        }
      } else if (t === "total") {
        s.font = {
          name: FONT,
          sz: 12,
          bold: true,
          color: {
            rgb: C.white
          }
        };
        s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brandDk
          }
        };
        s.alignment = {
          horizontal: "right",
          vertical: "center",
          indent: c === lastC ? 0 : 1
        };
        if (c === lastC) s.numFmt = moneyFmt;
        s.border = {
          top: med,
          bottom: med
        };
      }
      return s;
    });
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, wsA, "ใบถอดวัสดุ");
    if (hasPrice) {
      const B2 = mkSheet(3, [{
        wch: 3
      }, {
        wch: 44
      }, {
        wch: 18
      }, {
        wch: 14
      }]);
      const L = 1,
        V = 2,
        U = 3;
      docHead(B2, "สรุปราคาโครงการ  ·  PRICE SUMMARY", jobName + "   ·   " + jobCode + "   ·   " + kwTxt);
      const kv = (label, value, unit, type) => {
        const cells = [];
        cells[L] = label;
        cells[V] = value;
        if (unit != null) cells[U] = unit;
        return B2.push(cells, type || "kv", 19);
      };
      const sec = t => {
        const cells = [];
        cells[L] = t;
        const r = B2.push(cells, "sec", 22);
        B2.merge(r, L, U);
        return r;
      };
      const head3 = (a, b2, c3) => {
        const cells = [];
        cells[L] = a;
        cells[V] = b2;
        cells[U] = c3;
        return B2.push(cells, "head", 20);
      };
      const SV = CL(V),
        SU = CL(U);
      const S1 = "'ใบถอดวัสดุ'!";
      const watt = Math.round((result.meta.kw || 0) * 1000);
      const perWf = (r, v) => watt > 0 ? F(AT(SV, r) + "/" + watt, v) : 0;
      sec("ต้นทุนแยกตามหมวดงาน");
      head3("หมวดงาน", "จำนวนเงิน (บาท)", "สัดส่วน");
      const gStart = B2.R;
      priced.groups.forEach((g, i) => {
        const cells = [];
        cells[L] = g.group;
        cells[V] = F(S1 + "$" + TC + "$" + (groupRows[i] + 1), g.subtotal);
        B2.push(cells, i % 2 === 0 ? "item" : "itemAlt", 18);
      });
      const gEnd = B2.R - 1;
      const rSum = kv("รวมต้นทุนใบถอดวัสดุ", F("ROUND(SUM(" + AT(SV, gStart) + ":" + AT(SV, gEnd) + "),2)", priced.grandTotal), 100, "sum");
      for (let r = gStart; r <= gEnd; r++) {
        const share = priced.grandTotal > 0 ? priced.groups[r - gStart].subtotal / priced.grandTotal * 100 : 0;
        B2.aoa[r][U] = F("IF($" + SV + "$" + (rSum + 1) + "=0,0," + AT(SV, r) + "/$" + SV + "$" + (rSum + 1) + "*100)", share);
      }
      B2.gap(10);
      sec("โครงสร้างราคา");
      head3("รายการ", "จำนวนเงิน (บาท)", "฿ / วัตต์");
      const vf = 1 + pb.vat / 100;
      const rCost = kv("ต้นทุนวัสดุ + ค่าแรงติดตั้ง", F(AT(SV, rSum), pb.cost), null, "kv");
      const rCon = pb.contractor > 0 ? kv("ค่าแรงผู้รับเหมา", pb.contractor, null, "kv") : null;
      const rTot = kv("ต้นทุนรวม", F(AT(SV, rCost) + (rCon != null ? "+" + AT(SV, rCon) : ""), pb.totalCost), null, "strong");
      B2.aoa[rTot][U] = perWf(rTot, pb.costPerW);
      kv("ต้นทุนรวม + VAT " + pb.vat + "%", F("ROUND(" + AT(SV, rTot) + "*" + vf + ",2)", pb.totalCostVat), null, "kv");
      let rSell = null,
        rNet = null;
      if (pb.sell > 0) {
        rSell = kv("ราคาขาย", pb.sell, null, "strong");
        B2.aoa[rSell][U] = perWf(rSell, pb.sellPerW);
        kv("ราคาขาย + VAT " + pb.vat + "%", F("ROUND(" + AT(SV, rSell) + "*" + vf + ",2)", pb.sellVat), null, "kv");
      }
      if (pb.discount > 0) {
        const rDis = kv("ส่วนลด", -pb.discount, null, "neg");
        rNet = kv("ราคาหลังส่วนลด", F(rSell != null ? AT(SV, rSell) + "+" + AT(SV, rDis) : String(pb.net), pb.net), null, "strong");
        B2.aoa[rNet][U] = perWf(rNet, pb.netPerW);
        kv("ราคาหลังส่วนลด + VAT " + pb.vat + "%", F("ROUND(" + AT(SV, rNet) + "*" + vf + ",2)", pb.netVat), null, "kv");
      }
      if (pb.sell > 0) {
        B2.gap(10);
        sec("กำไรและอัตรากำไร");
        head3("รายการ", "จำนวนเงิน (บาท)", "อัตรากำไร");
        const profitRow = (label, priceRow, amt, mg) => {
          const cells = [];
          cells[L] = label;
          cells[V] = F(AT(SV, priceRow) + "-" + AT(SV, rTot), amt);
          const r = B2.push(cells, "profit", 20);
          B2.aoa[r][U] = F("IF(" + AT(SV, priceRow) + "=0,0," + AT(SV, r) + "/" + AT(SV, priceRow) + "*100)", mg);
          return r;
        };
        profitRow("กำไรจากราคาขาย", rSell, pb.profit, pb.margin);
        if (rNet != null) profitRow("กำไรหลังหักส่วนลด", rNet, pb.netProfit, pb.netMargin);
      }
      B2.gap(8);
      const bn = B2.push([null, "หมายเหตุ  ·  ต้นทุนมาจากใบถอดวัสดุในชีตแรก  ·  ราคาต่อวัตต์คิดจากกำลังติดตั้งด้าน DC " + kwTxt + "  ·  เอกสารภายใน ไม่ใช่ใบเสนอราคา"], "note", 26);
      B2.merge(bn, L, U);
      const wsB = paint(B2, (t, r, c) => {
        if (c === 0 && t !== "title" && t !== "subtitle") return {
          fill: {
            patternType: "solid",
            fgColor: {
              rgb: C.white
            }
          }
        };
        const com = commonStyle(t, 3, c);
        if (com) return com;
        const s = {
          font: {
            name: FONT,
            sz: 10.5,
            color: {
              rgb: C.text
            }
          },
          alignment: {
            vertical: "center"
          }
        };
        const right = {
          horizontal: "right",
          vertical: "center"
        };
        if (t === "head") {
          s.font = {
            name: FONT,
            sz: 10,
            bold: true,
            color: {
              rgb: C.white
            }
          };
          s.fill = {
            patternType: "solid",
            fgColor: {
              rgb: C.brand
            }
          };
          s.alignment = c === L ? {
            horizontal: "left",
            vertical: "center",
            indent: 1
          } : {
            horizontal: "right",
            vertical: "center",
            indent: 1
          };
          return s;
        }
        s.border = {
          top: hair,
          bottom: hair,
          left: hair,
          right: hair
        };
        if (t === "itemAlt") s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.alt
          }
        };
        if (t === "sum") {
          s.font = {
            name: FONT,
            sz: 11,
            bold: true,
            color: {
              rgb: C.brandDk
            }
          };
          s.fill = {
            patternType: "solid",
            fgColor: {
              rgb: C.group
            }
          };
        } else if (t === "strong") {
          s.font = {
            name: FONT,
            sz: 11,
            bold: true,
            color: {
              rgb: C.brandDk
            }
          };
          s.fill = {
            patternType: "solid",
            fgColor: {
              rgb: C.brandSoft
            }
          };
        } else if (t === "neg") {
          s.font = {
            name: FONT,
            sz: 10.5,
            color: {
              rgb: C.red
            }
          };
        } else if (t === "profit") {
          s.font = {
            name: FONT,
            sz: 11.5,
            bold: true,
            color: {
              rgb: C.gold
            }
          };
          s.fill = {
            patternType: "solid",
            fgColor: {
              rgb: C.goldSoft
            }
          };
        }
        if (c === L) {
          s.alignment = {
            horizontal: "left",
            vertical: "center",
            indent: 1,
            wrapText: true
          };
        } else {
          s.alignment = Object.assign({
            indent: 1
          }, right);
          s.numFmt = c === V ? moneyFmt : t === "item" || t === "itemAlt" || t === "sum" || t === "profit" ? pctFmt : perWFmt;
        }
        return s;
      });
      X.utils.book_append_sheet(wb, wsB, "สรุปราคา");
    }
    const stamp = (window.SF.TODAY || "").replace(/-/g, "");
    const fn = "BOQ_" + jobCode.replace(/[\\/:*?"<>|]/g, "-") + "_" + stamp + ".xlsx";
    X.writeFile(wb, fn);
  };
  const numStyle = Object.assign({}, inputStyle, {
    textAlign: "right"
  });
  const cabSelStyle = {
    fontSize: 12,
    padding: "6px 9px",
    borderRadius: 9,
    background: "var(--surface)"
  };
  const CAB_COLS = "minmax(150px,1fr) minmax(0,1.35fr) 88px 34px";
  const dcStrings = result.meta.plan && result.meta.plan.strings || 1;
  const dcOf = c => window.BOQ.pvDcLength(+c.length || 0, dcStrings);
  const cabLenSum = Math.round((b.cables || []).reduce((s, c) => s + (window.BOQ.isPvDcCable(c.type) ? dcOf(c).total : +c.length || 0), 0));
  const wireDone = (b.cables || []).filter(c => c.type && +c.length > 0).length;
  const navSecs = [{
    key: "info",
    icon: "sun",
    title: "ข้อมูลระบบ",
    meta: b.panels + " แผง · " + result.meta.kw + " kW · " + (String(b.phase) === "3" ? "3 เฟส" : "1 เฟส")
  }, isHuawei ? {
    key: "hybrid",
    icon: "bolt",
    title: "ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid"),
    meta: selInv.model
  } : null, isStringInv && scfg ? {
    key: "dc",
    icon: "bolt",
    title: "สาย DC / การต่ออนุกรม",
    meta: scfg.ready ? scfg.series + " แผงอนุกรม" + (plan ? " · " + plan.strings + " สตริง" : "") + " · " + scfg.dcWire : "ยังกรอกสเปคไม่ครบ",
    tone: !scfg.ready ? "warn" : plan && plan.over ? "warn" : "ok"
  } : null, {
    key: "layout",
    icon: "grid",
    title: "การจัดวางแผง",
    meta: "วางแล้ว " + result.meta.rowsSum + " / " + result.meta.panelCount + " แผง",
    tone: remaining === 0 ? "ok" : "warn"
  }, {
    key: "wire",
    icon: "power",
    title: "สายไฟ",
    meta: wireDone ? wireDone + " เส้นที่ระบุครบ" + (vdropSum.any ? " · แรงดันตก " + vdropSum.total + "%" : "") : "ยังไม่ได้กรอกระยะสาย",
    tone: !wireDone ? "" : vdropSum.total > vdropSum.lim.total ? "warn" : "ok"
  }, {
    key: "raceway",
    icon: "grid",
    title: "ท่อร้อยสาย",
    meta: condLen > 0 ? "รวม " + condLen + " ม." + (condBad > 0 ? " · " + condBad + " ท่อสายแน่นเกิน" : "") : "ยังไม่ได้กรอก",
    tone: condLen > 0 ? condBad > 0 ? "warn" : "ok" : ""
  }, {
    key: "tray",
    icon: "grid",
    title: "รางไฟ (Wireway / Tray)",
    meta: trayLen > 0 ? "รวม " + trayLen + " ม." + (trayBad > 0 ? " · " + trayBad + " รางสายแน่นเกิน" : "") : "ยังไม่ได้กรอก",
    tone: trayLen > 0 ? trayBad > 0 ? "warn" : "ok" : ""
  }].concat(isHome ? [] : kitSections.map(sc => ({
    key: sc.key,
    icon: sc.icon,
    title: sc.title,
    meta: sc.count > 0 ? sc.count + " รายการ" : "ยังไม่ได้กรอก",
    tone: sc.count > 0 ? "ok" : ""
  }))).concat([!isHome ? {
    key: "site",
    icon: "power",
    title: "ขนส่ง & บริหารจัดการ",
    meta: siteTotal > 0 ? "฿" + baht(siteTotal) : "ยังไม่ได้กรอก",
    tone: siteTotal > 0 ? "ok" : ""
  } : null, {
    key: "support",
    icon: "box",
    title: "โครงสร้างรองรับอุปกรณ์",
    meta: sup.inv + sup.mdb > 0 ? "อินเวอร์เตอร์ " + sup.inv + " · ตู้ " + sup.mdb : "ยังไม่ได้ถอด",
    tone: sup.inv + sup.mdb > 0 ? "ok" : ""
  }, !isHome ? {
    key: "struct",
    icon: "box",
    title: "งานเพิ่มเติม — โครงสร้าง",
    meta: structRows > 0 ? "กรอกแล้ว " + structRows + " รายการ" : "บันได · ทางเดิน · ราวกันตก",
    tone: structRows > 0 ? "ok" : ""
  } : null, isHome ? {
    key: "acc",
    icon: "box",
    title: "Accessories",
    meta: (accList || []).length ? accList.length + " รายการ" : "ยังไม่เพิ่ม"
  } : {
    key: "acc",
    icon: "box",
    title: "Accessories Allowance " + window.BOQ.ACC_ALLOW_PCT + "%",
    meta: accAllow > 0 ? "฿" + baht(accAllow) + " (" + window.BOQ.ACC_ALLOW_PCT + "% ของ ฿" + baht(accBase) + ")" : "ยังไม่มีราคาทุน",
    tone: accAllow > 0 ? "ok" : ""
  }, {
    key: "labor",
    icon: "power",
    title: "ค่าแรงติดตั้ง",
    meta: (laborMode === "lump" ? "เหมารวม · " : "แยกรายการ · ") + (priced.laborTotal > 0 ? "฿" + baht(priced.laborTotal) + " · ฿" + baht(priced.laborPerW) + "/W" : "ยังไม่ได้ตั้งเรต"),
    tone: priced.laborTotal > 0 ? "ok" : "warn"
  }, {
    key: "permit",
    icon: "box",
    title: "ค่าขออนุญาต & เอกสาร",
    meta: priced.permitTotal > 0 ? "฿" + baht(priced.permitTotal) : "ยังไม่ได้กรอกค่าธรรมเนียม",
    tone: priced.permitTotal > 0 ? "ok" : "warn"
  }, {
    key: "removable",
    icon: "box",
    title: "รายการวัสดุที่ถอดได้",
    meta: priced.grandTotal > 0 ? "รวม ฿" + baht(priced.grandTotal) : "ยังไม่มีราคา",
    tone: priced.grandTotal > 0 ? "ok" : ""
  }, {
    key: "price",
    icon: "bolt",
    title: "แบ่งราคา & กำไร",
    meta: pb.sell > 0 ? "ขาย ฿" + baht(pb.net || pb.sell) + " · กำไร " + (pb.net > 0 ? pb.netMargin : pb.margin) + "%" : "ยังไม่ได้ตั้งราคาขาย",
    tone: pb.sell > 0 ? (pb.net > 0 ? pb.netProfit : pb.profit) > 0 ? "ok" : "warn" : ""
  }]).filter(Boolean);
  const itemCount = priced.groups.reduce((a, g) => a + g.items.length, 0);
  return React.createElement("div", {
    className: "bq"
  }, React.createElement("style", null, BQ_CSS), React.createElement("div", {
    className: "bq-head"
  }, React.createElement("span", {
    className: "mark"
  }, React.createElement(Icon, {
    name: "box",
    size: 16,
    color: "currentColor"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "eb"
  }, "\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38 BOQ", job && job.code ? " · " + job.code : ""), React.createElement("div", {
    className: "nm"
  }, job ? job.name : "งาน")), React.createElement("button", {
    className: "x",
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14"
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    className: "bq-body"
  }, React.createElement("div", {
    className: "bq-rail"
  }, React.createElement("span", {
    className: "bq-eb"
  }, "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D"), navSecs.map(s => React.createElement("button", {
    key: s.key,
    className: "bq-nav",
    "data-on": openSec === s.key ? "1" : "0",
    onClick: () => setOpenSec(s.key)
  }, React.createElement("span", {
    className: "ic"
  }, React.createElement(Icon, {
    name: s.icon,
    size: 13,
    color: "currentColor"
  })), React.createElement("span", {
    className: "tx"
  }, React.createElement("span", {
    className: "tt"
  }, s.title), React.createElement("span", {
    className: "mt " + (s.tone || "")
  }, s.meta))))), React.createElement("div", {
    className: "bq-main"
  }, React.createElement("div", {
    className: "bq-wrap"
  }, React.createElement(BoqSection, _extends({
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E30\u0E1A\u0E1A",
    icon: "sun"
  }, secProps("info")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07"
  }, React.createElement(BoqLocked, {
    value: b.panels,
    unit: "\u0E41\u0E1C\u0E07",
    num: true
  })), React.createElement(Field, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 (kW)"
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "flex-end",
      gap: 4,
      background: "var(--surface3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "9px 11px"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, result.meta.kw.toLocaleString()), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "kW"))), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32 (\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19)"
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "var(--surface3)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "9px 11px"
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 13,
    color: "var(--text-3)"
  }), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-1)"
    }
  }, String(b.phase) === "3" ? "3 เฟส" : "1 เฟส")))), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "อินเวอร์เตอร์" + (jobBrand ? " · " + jobBrand : "")
  }, React.createElement(Dropdown, {
    value: b.inverterModel || "",
    onChange: v => set("inverterModel", v),
    options: invOptions
  }))), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, !b.inverterModel ? React.createElement(Field, {
    label: "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E44\u0E21\u0E42\u0E04\u0E23"
  }, React.createElement(Dropdown, {
    value: b.microRatio,
    onChange: v => set("microRatio", v),
    options: [{
      value: "1:1",
      label: "1:1 (1 แผง/ตัว)"
    }, {
      value: "2:1",
      label: "2:1 (2 แผง/ตัว)"
    }]
  })) : React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49)"
  }, React.createElement(BoqInvCount, {
    value: b.invCount,
    auto: result.meta.invAuto,
    onChange: v => set("invCount", v),
    style: numStyle
  }))), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07"
  }, React.createElement(Dropdown, {
    value: b.panelModel,
    onChange: v => set("panelModel", v),
    options: window.BOQ.PANELS.map(p => ({
      value: p.model,
      label: p.model,
      sub: p.wp ? p.wp + "W" : "",
      group: p.group || ""
    }))
  }))), hasBattery && React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48 (kWh)"
  }, React.createElement(BoqLocked, {
    value: b.batteryKwh,
    unit: "kWh",
    num: true
  }))), hasBackup && React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A Backup"
  }, React.createElement(BoqLocked, {
    value: b.backup ? "ติดตั้ง" : "ไม่ติดตั้ง"
  }))), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"
  }, React.createElement(Dropdown, {
    value: b.roof,
    onChange: v => set("roof", v),
    options: opt(window.BOQ.ROOF_OPTIONS)
  }))))), isHuawei && React.createElement(BoqSection, _extends({
    title: "ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid") + " (" + selInv.model + ")",
    icon: "bolt"
  }, secProps("hybrid")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E14\u0E49)"
  }, React.createElement(BoqInvCount, {
    value: b.invCount,
    auto: result.meta.invAuto,
    onChange: v => set("invCount", v),
    style: numStyle
  })), React.createElement(Field, {
    label: "String ต่อตัว (รับได้ " + capPerInv + ")"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.strings || (plan ? plan.perInv : selInv.inputs),
    min: 1,
    max: capPerInv,
    onChange: e => set("strings", Math.min(Math.max(parseInt(e.target.value) || 0, 0), capPerInv))
  })), React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E44\u0E1F"
  }, React.createElement(Dropdown, {
    value: b.hwBackup || "none",
    onChange: v => set("hwBackup", v),
    options: [{
      value: "none",
      label: "ไม่ติดตั้ง"
    }, {
      value: "smartguard",
      label: "SmartGuard"
    }, {
      value: "backupbox",
      label: "Backup Box"
    }]
  })), React.createElement(Field, {
    label: "Optimizer (1:1 \u0E15\u0E48\u0E2D\u0E41\u0E1C\u0E07)"
  }, React.createElement(Dropdown, {
    value: !!b.hwOptimizer,
    onChange: v => set("hwOptimizer", v),
    options: [{
      value: false,
      label: "ไม่ใช้"
    }, {
      value: true,
      label: "ใช้"
    }]
  })), React.createElement(Field, {
    label: "\u0E15\u0E39\u0E49\u0E44\u0E1F\u0E40\u0E1E\u0E34\u0E48\u0E21 (case by case)"
  }, React.createElement(Dropdown, {
    value: !!b.hwExtraPanel,
    onChange: v => set("hwExtraPanel", v),
    options: [{
      value: false,
      label: "ไม่มี"
    }, {
      value: true,
      label: "มี"
    }]
  }))), pvOver && React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 12px",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd2)",
      borderRadius: 10,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-red-tx)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#EF4444"
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07 ", result.meta.kw, " kW \u0E40\u0E01\u0E34\u0E19 MAX PV \u0E23\u0E27\u0E21 ", maxPvTotal, " kW (", selInv.invCount || result.meta.invCount, " \u0E15\u0E31\u0E27 \xD7 ", selInv.maxPv, " kW) \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E14\u0E41\u0E1C\u0E07"), selInv.unitFixed && React.createElement("div", {
    className: "bq-note warn"
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", null, "\u0E04\u0E25\u0E31\u0E07\u0E01\u0E23\u0E2D\u0E01 MAX PV / kW \u0E02\u0E2D\u0E07\u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19 \"\u0E27\u0E31\u0E15\u0E15\u0E4C\" \u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E1B\u0E25\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E34\u0E42\u0E25\u0E27\u0E31\u0E15\u0E15\u0E4C\u0E43\u0E2B\u0E49\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E04\u0E27\u0E23\u0E44\u0E1B\u0E41\u0E01\u0E49\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E25\u0E31\u0E07 \u203A \u0E2A\u0E40\u0E1B\u0E04\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E47\u0E19 kW \u0E08\u0E23\u0E34\u0E07 \u0E46")), React.createElement("div", {
    style: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E40\u0E1B\u0E04\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \xB7 ", selInv.model), React.createElement("div", {
    className: "bq-spec"
  }, [{
    k: "กำลังต่อตัว",
    v: selInv.kw ? selInv.kw + " kW" : "—",
    miss: !selInv.kw
  }, {
    k: "MAX PV ต่อตัว",
    v: selInv.maxPv ? selInv.maxPv + " kWp" : "ไม่ระบุ (ใช้ kW แทน)",
    miss: !selInv.maxPv
  }, {
    k: "เฟส",
    v: selInv.phase ? selInv.phase + " เฟส" : "—",
    miss: !selInv.phase,
    bad: !!selInv.phase && selInv.phase !== (String(b.phase) === "3" ? 3 : 1)
  }, {
    k: "กระแสออก (AC)",
    v: selInv.outA ? selInv.outA + " A" : "—",
    miss: !selInv.outA
  }, {
    k: "จำนวน MPPT",
    v: selInv.inputs ? selInv.inputs + " ช่อง" : "—",
    miss: !selInv.inputs
  }, {
    k: "สตริงต่อ MPPT",
    v: selInv.strPerMppt ? selInv.strPerMppt : "ไม่ระบุ (คิด 1)",
    miss: !selInv.strPerMppt
  }, {
    k: "รับสตริงได้/ตัว",
    v: capPerInv + " สตริง",
    hi: true
  }, {
    k: "ช่วง MPPT",
    v: selInv.mpptVmin && selInv.mpptVmax ? selInv.mpptVmin + "–" + selInv.mpptVmax + " V" : "—",
    miss: !(selInv.mpptVmin && selInv.mpptVmax)
  }, {
    k: "Vdc สูงสุด",
    v: selInv.maxVdc ? selInv.maxVdc + " V" : "—",
    miss: !selInv.maxVdc
  }, {
    k: "กระแส input/สตริง",
    v: selInv.maxInA ? selInv.maxInA + " A" : "—",
    miss: !selInv.maxInA
  }, {
    k: "กระแสสูงสุด/MPPT",
    v: selInv.maxMpptA ? selInv.maxMpptA + " A" : "—",
    miss: !selInv.maxMpptA
  }, {
    k: "MAX PV รวมทั้งงาน",
    v: maxPvTotal ? maxPvTotal + " kWp" : "—",
    hi: true,
    bad: pvOver
  }].map((c, i) => React.createElement("div", {
    key: i,
    "data-miss": c.miss ? "1" : "0",
    "data-bad": c.bad ? "1" : "0"
  }, React.createElement("span", {
    className: "k"
  }, c.k), React.createElement("span", {
    className: "v " + (c.hi && !c.bad ? "hi" : "")
  }, c.v)))), React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "* \u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27 = \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19(\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E27\u0E21 \xF7 MAX PV \u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27) \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49 \xB7 Combiner Box + DC (Fuse/Holder/MCB/MC4) \u0E04\u0E34\u0E14\u0E15\u0E32\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19 String \xB7 RCBO/SPD/Smart Meter/Backup \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E40\u0E1F\u0E2A (", selInv.phase === 3 ? "3" : "1", " \u0E40\u0E1F\u0E2A) \xB7 RCBO \u0E02\u0E19\u0E32\u0E14\u0E08\u0E32\u0E01\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 \xD7 1.25")), isStringInv && scfg && React.createElement(BoqSection, _extends({
    title: "\u0E2A\u0E32\u0E22 DC / \u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 String (PV1-F)",
    icon: "bolt"
  }, secProps("dc")), !scfg.ready ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 13px",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: 10,
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--tint-amber-tx2)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), " ", scfg.warns.join(" · ")) : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      padding: "10px 12px",
      borderRadius: 10,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginBottom: 3,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "\u0E41\u0E1C\u0E07 \xB7 ", b.panelModel), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "Voc ", scfg.voc, " V \xB7 Isc ", scfg.isc, " A", scfg.vmp ? " · Vmp " + scfg.vmp + " V" : "")), React.createElement("div", {
    style: {
      padding: "10px 12px",
      borderRadius: 10,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginBottom: 3
    }
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19 MPPT \xB7 ", selInv.model), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, scfg.vmin, "\u2013", scfg.vmax, " Vdc", scfg.maxVdc ? " · สูงสุด " + scfg.maxVdc + " V" : ""))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "auto 1fr",
      gap: 12,
      alignItems: "center"
    }
  }, React.createElement(Field, {
    label: "แผงต่ออนุกรม/สตริง" + (scfg.maxSeries >= scfg.minSeries ? " (แนะนำ " + scfg.minSeries + "–" + scfg.maxSeries + ")" : "")
  }, React.createElement("input", {
    type: "number",
    style: Object.assign({}, numStyle, {
      width: 130
    }),
    min: 1,
    value: b.dcSeries != null && b.dcSeries !== "" ? b.dcSeries : scfg.recSeries,
    onChange: e => set("dcSeries", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))
  })), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E41\u0E19\u0E30\u0E19\u0E33 = \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07 MPPT \u0E41\u0E25\u0E30 Voc \u0E23\u0E27\u0E21\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(4, 1fr)",
      gap: 10
    }
  }, [{
    l: "แรงดันทำงานรวม",
    v: scfg.stringVop + " V",
    ok: scfg.inRange
  }, {
    l: "Voc รวม (เปิดวงจร)",
    v: scfg.stringVoc + " V",
    ok: !scfg.overMaxVdc
  }, {
    l: "กระแส DC (Isc×1.25)",
    v: scfg.dcAmp + " A",
    ok: null
  }, {
    l: "ขนาดสาย DC PV1-F",
    v: scfg.dcWire,
    ok: null,
    hi: true
  }].map((c, i) => React.createElement("div", {
    key: i,
    style: {
      padding: "10px 12px",
      borderRadius: 10,
      background: "var(--surface3)",
      border: "1px solid " + (c.ok === false ? "var(--tint-red-bd2)" : "var(--border)")
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginBottom: 3
    }
  }, c.l), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 800,
      color: c.hi ? "var(--primary-dark)" : c.ok === false ? "var(--tint-red-tx2)" : "var(--text-1)"
    }
  }, c.v, c.ok === true ? " ✓" : c.ok === false ? " ✗" : "")))), plan && React.createElement("div", null, React.createElement("div", {
    style: {
      marginBottom: 8,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E1C\u0E19\u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 ", plan.panels, " \u0E41\u0E1C\u0E07 \xF7 ", plan.series, " \u0E41\u0E1C\u0E07/\u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("div", {
    className: "bq-spec"
  }, React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E23\u0E27\u0E21"), React.createElement("span", {
    className: "v hi"
  }, plan.strings, " \u0E2A\u0E15\u0E23\u0E34\u0E07")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E41\u0E1C\u0E07\u0E40\u0E15\u0E47\u0E21"), React.createElement("span", {
    className: "v"
  }, plan.full, " \xD7 ", plan.series, " \u0E41\u0E1C\u0E07")), React.createElement("div", {
    "data-miss": plan.uneven ? "1" : "0"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E40\u0E28\u0E29"), React.createElement("span", {
    className: "v"
  }, plan.rest > 0 ? "1 × " + plan.rest + " แผง" : "ไม่มี")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("span", {
    className: "v"
  }, plan.perInv, " / ", plan.capPerInv)), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("span", {
    className: "v"
  }, plan.invCount, " \u0E15\u0E31\u0E27")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E23\u0E27\u0E21"), React.createElement("span", {
    className: "v"
  }, plan.cap, " \u0E0A\u0E48\u0E2D\u0E07")), React.createElement("div", {
    "data-bad": plan.over ? "1" : "0"
  }, React.createElement("span", {
    className: "k"
  }, plan.over ? "เกินช่องรับ" : "ช่องที่ยังว่าง"), React.createElement("span", {
    className: "v"
  }, plan.over ? plan.strings - plan.cap : plan.spare, " \u0E2A\u0E15\u0E23\u0E34\u0E07")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A DC \u0E23\u0E27\u0E21/\u0E15\u0E31\u0E27"), React.createElement("span", {
    className: "v"
  }, Math.round(plan.perInv * scfg.dcAmp * 10) / 10, " A"))), plan.over ? React.createElement("div", {
    className: "bq-note warn"
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07 ", plan.strings, " \u0E40\u0E2A\u0E49\u0E19 \u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E0A\u0E48\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E23\u0E27\u0E21 ", plan.cap, " \u0E0A\u0E48\u0E2D\u0E07 (", plan.invCount, " \u0E15\u0E31\u0E27 \xD7 ", plan.capPerInv, ") \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E2A\u0E48 Combiner \u0E23\u0E27\u0E21\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07")) : plan.uneven ? React.createElement("div", {
    className: "bq-note warn"
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E21\u0E35\u0E41\u0E04\u0E48 ", plan.rest, " \u0E41\u0E1C\u0E07 \u2014 \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 ", Math.round(plan.rest * scfg.vRef * 10) / 10, " V ", plan.rest * scfg.vRef < scfg.vmin ? "ต่ำกว่าช่วง MPPT " + scfg.vmin + " V เครื่องจะไม่ดึงกำลังจากสตริงนี้" : "ต่ำกว่าสตริงอื่น ควรแยกเข้า MPPT คนละช่อง")) : React.createElement("div", {
    className: "bq-note ok"
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#22A35B"
  }), React.createElement("span", null, "\u0E41\u0E1A\u0E48\u0E07\u0E25\u0E07\u0E15\u0E31\u0E27 ", plan.strings, " \u0E2A\u0E15\u0E23\u0E34\u0E07 \xD7 ", plan.series, " \u0E41\u0E1C\u0E07 \xB7 \u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E0A\u0E48\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E07\u0E2D\u0E35\u0E01 ", plan.spare, " \u0E0A\u0E48\u0E2D\u0E07"))), scfg.warns.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, scfg.warns.map((w, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "8px 12px",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd2)",
      borderRadius: 9,
      fontSize: 12,
      fontWeight: 600,
      color: "var(--tint-red-tx)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 14,
    color: "#EF4444"
  }), " ", w))), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "* \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01 ", scfg.vmp ? "Vmp" : "Voc", " \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 \xB7 \u0E2A\u0E32\u0E22 DC \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01 Isc \xD7 1.25 (PV1-F \u0E17\u0E2D\u0E07\u0E41\u0E14\u0E07) \xB7 \u0E2A\u0E32\u0E22\u0E04\u0E39\u0E48 \u0E41\u0E14\u0E07(+)/\u0E14\u0E33(\u2212) \u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07"))), React.createElement(BoqSection, _extends({
    title: "\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 (\u0E41\u0E16\u0E27)",
    icon: "grid"
  }, secProps("layout"), {
    right: React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: remaining === 0 ? "var(--primary-dark)" : "#EF4444"
      }
    }, "\u0E27\u0E32\u0E07\u0E41\u0E25\u0E49\u0E27 ", result.meta.rowsSum, " / ", result.meta.panelCount, " \u0E41\u0E1C\u0E07")
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, b.rows.map((r, i) => React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 40px",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement(Field, {
    label: i === 0 ? "แผง/แถว" : ""
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: r.panels,
    onChange: e => setRow(i, "panels", e.target.value)
  })), React.createElement(Field, {
    label: i === 0 ? "จำนวนแถว" : ""
  }, React.createElement("input", {
    type: "number",
    min: "0",
    style: numStyle,
    value: r.count,
    onChange: e => setRow(i, "count", e.target.value)
  })), React.createElement("button", {
    onClick: () => delRow(i),
    title: "\u0E25\u0E1A\u0E41\u0E16\u0E27",
    style: {
      height: 40,
      marginTop: i === 0 ? 18 : 0,
      background: "#EF444414",
      border: "none",
      color: "#EF4444",
      borderRadius: 9,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  })))), React.createElement("button", {
    onClick: addRow,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      border: "none",
      borderRadius: 9,
      padding: "8px 12px",
      fontWeight: 700,
      fontSize: 12.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27")), remaining === 0 ? React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 12px",
      background: "var(--primary-soft)",
      borderRadius: 10,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--primary-dark)",
    sw: 2.6
  }), " \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E04\u0E23\u0E1A\u0E15\u0E32\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E25\u0E49\u0E27 (", result.meta.panelCount, " \u0E41\u0E1C\u0E07)") : remaining > 0 ? React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      padding: "9px 12px",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd2)",
      borderRadius: 10,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-red-tx)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#EF4444"
  }), " \u0E22\u0E31\u0E07\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ", remaining, " \u0E41\u0E1C\u0E07", React.createElement("button", {
    onClick: () => fillRemaining(remaining),
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "#EF4444",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 11px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: "#fff"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27 ", remaining, " \u0E41\u0E1C\u0E07")) : React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 12px",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: 10,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-amber-tx)"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), " \u0E27\u0E32\u0E07\u0E40\u0E01\u0E34\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07 ", -remaining, " \u0E41\u0E1C\u0E07 \u2014 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07/\u0E41\u0E16\u0E27"), React.createElement("button", {
    onClick: () => setAdv(v => !v),
    style: {
      marginTop: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      border: "none",
      color: "var(--text-2)",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 13,
    color: "var(--text-2)"
  }), " \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07 (\u0E23\u0E32\u0E07 / \u0E23\u0E30\u0E22\u0E30\u0E40\u0E1C\u0E37\u0E48\u0E2D) ", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-2)",
    style: {
      transform: adv ? "rotate(180deg)" : "none"
    }
  })), adv && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 12,
      background: "var(--surface2)",
      borderRadius: 10,
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(4, minmax(0,1fr))",
      gap: 10
    }
  }, React.createElement(Field, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E23\u0E32\u0E07"
  }, React.createElement(Dropdown, {
    value: b.railSize,
    onChange: v => set("railSize", v),
    options: [{
      value: 4.2,
      label: "4.2 ม."
    }, {
      value: 4.8,
      label: "4.8 ม."
    }]
  })), React.createElement(Field, {
    label: "\u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E41\u0E1C\u0E07 (\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.gap,
    onChange: e => set("gap", e.target.value)
  })), React.createElement(Field, {
    label: "\u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E2B\u0E31\u0E27\u0E17\u0E49\u0E32\u0E22 (\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.endSpare,
    onChange: e => set("endSpare", e.target.value)
  })), React.createElement(Field, {
    label: "L-FEET/\u0E23\u0E32\u0E07"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.lfeetPerRail,
    onChange: e => set("lfeetPerRail", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D RAIL"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.rail,
    onChange: e => setSpare("rail", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D JOINER"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.joiner,
    onChange: e => setSpare("joiner", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D MID"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.midClamp,
    onChange: e => setSpare("midClamp", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D END"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.endClamp,
    onChange: e => setSpare("endClamp", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D L-FEET"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.lfeet,
    onChange: e => setSpare("lfeet", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D GROUND LUG"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: b.sparePct.ground,
    onChange: e => setSpare("ground", e.target.value)
  })))), React.createElement(BoqSection, _extends({
    title: "\u0E2A\u0E32\u0E22\u0E44\u0E1F",
    icon: "power"
  }, secProps("wire"), {
    right: cabLenSum > 0 ? React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E23\u0E27\u0E21 ", cabLenSum, " \u0E21.") : null
  }), React.createElement(MeasBar, {
    kinds: ["cable"]
  }), !isMobile && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: CAB_COLS,
      gap: 8,
      padding: "0 2px 6px",
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, React.createElement("span", null, "\u0E08\u0E38\u0E14\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22"), React.createElement("span", null, "\u0E0A\u0E19\u0E34\u0E14\u0E2A\u0E32\u0E22\u0E44\u0E1F"), React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27"), React.createElement("span", null)), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 10 : 2
    }
  }, b.cables.map((c, i) => {
    const isComm = /LAN|CAT/i.test(c.type || "");
    const isDC = /PV1-F|PV CABLE/i.test(c.type || "") || /PV-INVERTER/i.test(c.name || "");
    const own = !!(c.method || c.group || c.ncond || c.core);
    const rawMethod = c.method || calcMethod;
    const rawMeta = (window.BOQ.WIRE_METHODS || []).find(m => m.key === rawMethod) || {};
    const rawGroup = c.group || ((rawMeta.groups || []).indexOf(calcGroup) >= 0 ? calcGroup : (rawMeta.groups || ["g1"])[0]);
    const pick = (window.BOQ.normWireMethod || ((m, g) => ({
      method: m,
      group: g
    })))(rawMethod, rawGroup);
    const method = pick.method;
    const group = pick.group;
    const ncond = c.ncond || calcNCond;
    const coreType = window.BOQ.cableCoreType(c.type);
    const rowCoreOpts = (window.BOQ.ampCoresFor || (() => []))(group);
    const coreKey = (window.BOQ.ampCoreKey || (() => coreType))(group, c.core || coreType, c.core || coreType);
    const coreTh = (window.BOQ.AMP_CORE_LABEL || {})[coreKey] || (coreType === "multi" ? "หลายแกน" : "แกนเดียว");
    const hasSize = window.BOQ.cableSizeNum(c.type) != null;
    const amp = cableAmp(c.type, {
      method,
      group,
      ncond,
      core: coreKey,
      orient: coreKey
    });
    const req = reqAmpFor(c.name);
    const bad = amp != null && req && amp < req;
    const showHint = !!c.type && !isComm && !isDC;
    const vd = isComm ? null : vdropFor(c);
    const open = !!cabOpen[i];
    const mShort = (window.BOQ.WIRE_METHODS || []).find(m => m.key === method) || {};
    const condTh = (mShort.short || mShort.th || method) + " · " + ((window.BOQ.AMP_GROUPS || []).find(g => g.key === group) || {}).th + " · " + ncond + " ตัวนำ · " + coreTh;
    return React.createElement("div", {
      key: i,
      style: Object.assign({
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 7 : 3,
        padding: isMobile ? "10px 11px" : "5px 2px"
      }, isMobile ? {
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)"
      } : {
        borderTop: i === 0 ? "none" : "1px solid var(--border)"
      })
    }, isMobile && React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".05em",
        textTransform: "uppercase",
        color: "var(--text-3)"
      }
    }, "\u0E08\u0E38\u0E14\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22"), React.createElement(Dropdown, {
      value: c.name || "",
      onChange: v => setCab(i, "name", v),
      options: cablePtOptions,
      placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E38\u0E14 \u2014",
      addable: true,
      onAdd: addCablePt
    })), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "minmax(0,1fr) 64px 34px" : CAB_COLS,
        gap: 8,
        alignItems: "center"
      }
    }, !isMobile && React.createElement(Dropdown, {
      value: c.name || "",
      onChange: v => setCab(i, "name", v),
      options: cablePtOptions,
      placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E38\u0E14 \u2014",
      addable: true,
      onAdd: addCablePt
    }), React.createElement(Dropdown, {
      value: c.type,
      onChange: v => setCab(i, "type", v),
      options: cableTypeOptions,
      placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E32\u0E22\u0E44\u0E1F \u2014"
    }), React.createElement("input", {
      type: "number",
      style: numStyle,
      value: c.length,
      placeholder: window.BOQ.isPvDcCable(c.type) ? "ไกลสุด" : "ม.",
      title: window.BOQ.isPvDcCable(c.type) ? "สาย DC — กรอก “ระยะเส้นที่ไกลที่สุด” (สตริงที่อยู่ไกลอินเวอร์เตอร์สุด) ระบบคูณจำนวนสตริงและเผื่อให้เอง" : undefined,
      onChange: e => setCab(i, "length", e.target.value)
    }), React.createElement("button", {
      className: "bq-x",
      onClick: () => delCab(i),
      title: "\u0E25\u0E1A\u0E2A\u0E32\u0E22\u0E40\u0E2A\u0E49\u0E19\u0E19\u0E35\u0E49"
    }, React.createElement(Icon, {
      name: "x",
      size: 14
    }))), (showHint || isDC || vd) && React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        fontSize: 11,
        lineHeight: 1.5
      }
    }, showHint && React.createElement("button", {
      type: "button",
      onClick: () => setCabOpen(p => Object.assign({}, p, {
        [i]: !open
      })),
      title: own ? "เส้นนี้ตั้งเงื่อนไขเอง — กดเพื่อแก้" : "ตามค่าตั้งต้นของงาน — กดเพื่อตั้งเฉพาะเส้นนี้",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        border: "1px solid " + (own ? "var(--border-strong)" : "transparent"),
        background: own ? "var(--surface)" : "var(--surface2)",
        color: own ? "var(--text-2)" : "var(--text-3)",
        borderRadius: 99,
        padding: "3px 9px",
        fontSize: 10.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, own && React.createElement("span", {
      style: {
        width: 5,
        height: 5,
        borderRadius: 99,
        background: "var(--primary)"
      }
    }), condTh, React.createElement(Icon, {
      name: "chevronDown",
      size: 12,
      color: "var(--text-3)",
      style: {
        transform: open ? "rotate(180deg)" : "none"
      }
    })), showHint && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 700,
        color: bad || amp == null ? "var(--tint-red-tx)" : req ? "var(--tint-green-tx)" : "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: amp == null || bad ? "alert" : req ? "check" : "bolt",
      size: 11,
      color: bad || amp == null ? "var(--tint-red-tx)" : req ? "var(--tint-green-tx)" : "var(--text-3)"
    }), amp != null ? "พิกัด ~" + amp + " A" + (req ? " / ต้องการ " + (Math.round(req * 10) / 10).toFixed(1) + " A" : "") + (bad ? " · ไม่พอ" : req ? " · ผ่าน" : "") : !hasSize ? "เลือกสายที่ระบุขนาด (SQ.MM.) ก่อน" : "ยังไม่มีตารางพิกัดของเงื่อนไขนี้"), vd && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 700,
        color: vd.ok ? "var(--text-3)" : "var(--tint-amber-tx)"
      },
      title: "ΔV = " + (vd.phase === 3 ? "√3" : "2") + " × " + vd.length + " ม. × " + Math.round(vd.amp * 100) / 100 + " A × ρ ÷ " + vd.size + " mm²  ·  เกณฑ์ ≤ " + vd.lim + "%"
    }, React.createElement(Icon, {
      name: vd.ok ? "check" : "alert",
      size: 11,
      color: vd.ok ? "var(--text-3)" : "var(--tint-amber-tx)"
    }), "\u0394V ", vd.pct, "%", !vd.ok && (vd.minSize ? " · ต้องใช้ ≥ " + vd.minSize + " mm²" : " · เกินขนาดสายที่มี ให้ลดระยะหรือเพิ่มแรงดัน")), isDC && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "bolt",
      size: 11,
      color: "var(--text-3)"
    }), "\u0E2A\u0E32\u0E22 DC", scfg && scfg.ready ? " · แนะนำ " + scfg.dcWire : "", " \u2014 \u0E14\u0E39\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \u201C\u0E2A\u0E32\u0E22 DC / \u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 String\u201D"), window.BOQ.isPvDcCable(c.type) && +c.length > 0 && (() => {
      const d = dcOf(c);
      return React.createElement("span", {
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontWeight: 700,
          color: "var(--primary-dark)"
        },
        title: "\u0E23\u0E30\u0E22\u0E30\u0E44\u0E01\u0E25\u0E2A\u0E38\u0E14 \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E2A\u0E15\u0E23\u0E34\u0E07 \xD7 \u0E40\u0E1C\u0E37\u0E48\u0E2D 1.2 = \u0E23\u0E30\u0E22\u0E30\u0E15\u0E48\u0E2D 1 \u0E02\u0E31\u0E49\u0E27 \xB7 \u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E32\u0E22 2 \u0E2A\u0E35 \u0E41\u0E14\u0E07(+) \u0E01\u0E31\u0E1A \u0E14\u0E33(\u2212) \u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19"
      }, React.createElement(Icon, {
        name: "check",
        size: 11,
        color: "var(--primary-dark)"
      }), d.farthest.toLocaleString() + " ม. × " + d.strings + " สตริง × " + d.spare + " = ", React.createElement("b", null, d.perPole.toLocaleString() + " ม./ขั้ว"), " · แดง " + d.perPole.toLocaleString() + " + ดำ " + d.perPole.toLocaleString() + " = รวม " + d.total.toLocaleString() + " ม.");
    })()), showHint && open && React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        padding: "8px 9px",
        marginTop: 1,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: 10
      }
    }, React.createElement("div", {
      style: {
        width: isMobile ? "100%" : 206,
        flexShrink: 0
      }
    }, React.createElement(Dropdown, {
      value: method,
      onChange: v => setCab(i, "method", v),
      options: methodOptions,
      placeholder: "\u0E27\u0E34\u0E18\u0E35\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22",
      wrap: true,
      style: cabSelStyle
    })), React.createElement("div", {
      style: {
        width: isMobile ? "calc(50% - 3px)" : 118,
        flexShrink: 0
      }
    }, React.createElement(Dropdown, {
      value: group,
      onChange: v => setCab(i, "group", v),
      options: groupOptionsFor(method),
      style: cabSelStyle
    })), React.createElement("div", {
      style: {
        width: isMobile ? "calc(50% - 3px)" : 96,
        flexShrink: 0
      }
    }, React.createElement(Dropdown, {
      value: ncond,
      onChange: v => setCab(i, "ncond", v),
      options: ncondOptions,
      style: cabSelStyle
    })), React.createElement("div", {
      style: {
        width: isMobile ? "100%" : 142,
        flexShrink: 0
      }
    }, React.createElement(Dropdown, {
      value: coreKey,
      onChange: v => setCab(i, "core", v),
      disabled: rowCoreOpts.length < 2,
      options: rowCoreOpts.map(x => ({
        value: x.key,
        label: x.th
      })),
      style: cabSelStyle
    })), own && React.createElement("button", {
      type: "button",
      onClick: () => resetCabCond(i),
      style: {
        border: 0,
        background: "none",
        color: "var(--text-3)",
        fontSize: 10.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        textDecoration: "underline",
        textUnderlineOffset: 3
      }
    }, "\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19")));
  }), React.createElement("button", {
    onClick: addCab,
    style: {
      alignSelf: "flex-start",
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      color: "var(--primary-dark)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 9,
      padding: "6px 12px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2A\u0E32\u0E22"), vdropSum.any && (() => {
    const L = vdropSum.lim;
    const cell = (lb, val, lim, tip) => React.createElement("span", {
      title: tip,
      style: {
        display: "inline-flex",
        alignItems: "baseline",
        gap: 5,
        fontSize: 11.5,
        fontWeight: 700,
        color: val > lim ? "var(--tint-amber-tx)" : "var(--text-2)"
      }
    }, lb, " ", React.createElement("b", {
      style: {
        fontSize: 13.5,
        color: val > lim ? "var(--tint-amber-tx)" : "var(--text-1)"
      }
    }, val, "%"), React.createElement("span", {
      style: {
        fontWeight: 600,
        color: "var(--text-3)"
      }
    }, "/ ", lim, "%"));
    const bad = vdropSum.dc > L.dc || vdropSum.ac > L.ac || vdropSum.total > L.total;
    return React.createElement("div", {
      style: {
        display: "flex",
        gap: 18,
        flexWrap: "wrap",
        alignItems: "center",
        padding: "10px 13px",
        borderRadius: 11,
        border: "1px solid " + (bad ? "#F59E0B55" : "var(--border)"),
        background: bad ? "#F59E0B12" : "var(--surface2)"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, React.createElement(Icon, {
      name: "bolt",
      size: 12,
      color: bad ? "var(--tint-amber-tx)" : "var(--primary)"
    }), "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01\u0E23\u0E27\u0E21"), cell("ฝั่ง DC", vdropSum.dc, L.dc, "เส้นที่ตกมากสุดฝั่ง DC (แต่ละสตริงเป็นเส้นทางของตัวเอง ไม่บวกกัน)"), cell("ฝั่ง AC", vdropSum.ac, L.ac, "บวกทุกช่วงฝั่ง AC ตั้งแต่อินเวอร์เตอร์ถึงตู้เมน"), cell("รวมทั้งเส้นทาง", vdropSum.total, L.total, "DC + AC — เกณฑ์ออกแบบทั่วไปไม่เกิน 5%"), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 600
      }
    }, bad ? "เกินเกณฑ์ — ขยับขนาดสายขึ้นหรือลดระยะ ไม่งั้นไฟหายไปกับสายและแรงดันปลายทางตก" : "อยู่ในเกณฑ์ · คิดที่กระแสใช้งานจริงและความต้านทานทองแดงตอนสายร้อน"));
  })()), React.createElement("div", {
    style: {
      marginTop: 16,
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface2)"
    }
  }, React.createElement("div", {
    style: {
      padding: "11px 14px 12px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 11
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      paddingBottom: 7,
      marginRight: 2
    }
  }, React.createElement(Icon, {
    name: "bolt",
    size: 13,
    color: "var(--primary)"
  }), " \u0E15\u0E32\u0E23\u0E32\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E44\u0E1F", React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\xB7 ", wcPhase, " \u0E40\u0E1F\u0E2A")), !isMobile && React.createElement("span", {
    style: {
      width: 1,
      height: 22,
      background: "var(--border)",
      marginRight: 4,
      marginBottom: 6
    }
  }), React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      width: isMobile ? "100%" : 152
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E19\u0E34\u0E14\u0E09\u0E19\u0E27\u0E19"), React.createElement(Dropdown, {
    value: calcIns,
    onChange: v => setWcalc("ins", v),
    options: insOptions,
    style: {
      height: 34,
      fontSize: 12.5,
      padding: "6px 9px"
    }
  })), [{
    label: "แรงดัน",
    unit: "V",
    value: wcVolt,
    key: "volt",
    min: undefined
  }, isStringInv ? null : {
    label: "แบ่ง String",
    unit: "",
    value: wcStrings,
    key: "strings",
    min: "1"
  }, hasBattery ? {
    label: "กำลังแบต",
    unit: "kW",
    value: wcalc.battKw,
    key: "battKw",
    min: undefined
  } : null, hasBackup ? {
    label: "เมน Backup",
    unit: "A",
    value: wcalc.backupMainA || "",
    key: "backupMainA",
    min: undefined,
    ph: "—"
  } : null].filter(Boolean).map(f => React.createElement("label", {
    key: f.key,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      width: isMobile ? "calc(50% - 5px)" : 104
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, f.label, f.unit ? " (" + f.unit + ")" : ""), React.createElement("input", {
    type: "number",
    min: f.min,
    placeholder: f.ph,
    value: f.value,
    onChange: e => setWcalc(f.key, e.target.value),
    style: Object.assign({}, numStyle, {
      width: "100%",
      height: 34,
      fontSize: 12.5,
      padding: "6px 9px"
    })
  })))), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "flex-end"
    }
  }, [{
    k: "method",
    lb: "วิธีเดินสาย",
    w: isMobile ? "100%" : 0,
    grow: 1,
    min: 268,
    el: React.createElement(Dropdown, {
      value: calcMethod,
      onChange: setMethodPick,
      options: methodOptions
    })
  }, {
    k: "group",
    lb: "กลุ่มการติดตั้ง",
    w: isMobile ? "calc(50% - 4px)" : 124,
    el: React.createElement(Dropdown, {
      value: calcGroup,
      onChange: v => setWcalc("group", v),
      options: groupOptionsFor(calcMethod)
    })
  }, {
    k: "ncond",
    lb: "ตัวนำมีกระแส",
    w: isMobile ? "calc(50% - 4px)" : 116,
    el: React.createElement(Dropdown, {
      value: calcNCond,
      onChange: v => setWcalc("ncond", v),
      options: ncondOptions
    })
  }, {
    k: "core",
    lb: "แกนสาย",
    w: isMobile ? "calc(50% - 4px)" : 146,
    el: React.createElement(Dropdown, {
      value: calcCore,
      onChange: v => setWcalc("core", v),
      disabled: coreOpts.length < 2,
      options: coreOpts.map(c => ({
        value: c.key,
        label: c.th
      }))
    })
  }].map(f => React.createElement("label", {
    key: f.k,
    style: {
      width: f.w || undefined,
      flex: f.grow && !isMobile ? "1 1 " + f.min + "px" : "0 0 auto",
      minWidth: f.grow && !isMobile ? f.min : undefined,
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, f.lb), f.el))), React.createElement("div", {
    style: {
      marginTop: 11,
      paddingTop: 11,
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 11,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, mtdMeta.art && mtdMeta.art !== grpMeta.art && React.createElement(WireArt, {
    art: mtdMeta.art,
    w: 84,
    h: 50
  }), React.createElement(WireArt, {
    art: grpMeta.art,
    w: 84,
    h: 50
  }), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 170
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, mtdMeta.th), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginTop: 1
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C ", React.createElement("b", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, (grpMeta.th || calcGroup) + " · " + calcNCond + " ตัวนำ · " + ((window.BOQ.AMP_CORE_LABEL || {})[calcCore] || calcCore)), grpMeta.sub ? " — " + grpMeta.sub : ""), mtdMeta.groups && mtdMeta.groups.indexOf(calcGroup) < 0 && React.createElement("button", {
    type: "button",
    onClick: () => setWcalc("group", mtdMeta.groups[0]),
    style: {
      marginTop: 4,
      border: 0,
      background: "var(--tint-amber-bg2)",
      color: "var(--tint-amber-tx2)",
      borderRadius: 7,
      padding: "3px 8px",
      fontWeight: 700,
      fontSize: 10,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E27\u0E34\u0E18\u0E35\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A ", ((window.BOQ.AMP_GROUPS || []).find(g => g.key === mtdMeta.groups[0]) || {}).th || mtdMeta.groups[0], " \u2014 \u0E01\u0E14\u0E2A\u0E25\u0E31\u0E1A")), React.createElement("button", {
    type: "button",
    onClick: () => setArtOpen(!artOpen),
    style: {
      border: 0,
      background: "none",
      color: "var(--text-3)",
      padding: "2px 0",
      fontWeight: 700,
      fontSize: 10.5,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, artOpen ? "ซ่อนรูป" : "เลือกจากรูป")), artOpen && React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, [{
    title: "วิธีเดินสาย",
    items: (window.BOQ.WIRE_METHODS || []).map(m => ({
      key: m.key,
      art: m.art,
      name: m.th,
      note: ((window.BOQ.AMP_GROUPS || []).find(g => g.key === (m.groups || [])[0]) || {}).th || "",
      on: calcMethod === m.key,
      pick: () => setMethodPick(m.key),
      tip: m.sub
    }))
  }, {
    title: "กลุ่มการติดตั้ง",
    items: (window.BOQ.AMP_GROUPS || []).map(g => ({
      key: g.key,
      art: g.art,
      name: g.th,
      note: g.sub,
      on: calcGroup === g.key,
      pick: () => setWcalc("group", g.key),
      tip: g.desc
    }))
  }].map(sec => React.createElement("div", {
    key: sec.title
  }, React.createElement("div", {
    style: {
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: ".07em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 6
    }
  }, sec.title), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
      gap: 7
    }
  }, sec.items.map(it => React.createElement("button", {
    key: it.key,
    type: "button",
    onClick: it.pick,
    title: it.tip || it.name,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
      padding: "6px 5px 7px",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "center",
      border: "1px solid " + (it.on ? "var(--primary)" : "var(--border)"),
      background: it.on ? "var(--primary-soft)" : "var(--surface)"
    }
  }, React.createElement(WireArt, {
    art: it.art,
    w: "100%",
    h: 46
  }), React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: 700,
      lineHeight: 1.35,
      color: it.on ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, it.name), it.note && React.createElement("span", {
    style: {
      fontSize: 9,
      color: "var(--text-3)",
      lineHeight: 1.3
    }
  }, it.note)))))))), React.createElement("div", {
    style: {
      marginTop: 11,
      paddingTop: 11,
      borderTop: "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E25\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A"), React.createElement("input", {
    type: "number",
    min: 0.1,
    max: 1,
    step: 0.05,
    value: wcalc.derate != null && wcalc.derate !== "" ? wcalc.derate : 1,
    onChange: e => setWcalc("derate", e.target.value),
    style: Object.assign({}, numStyle, {
      width: 76,
      height: 32,
      fontSize: 12.5,
      padding: "5px 9px"
    })
  }), trayWorst < 1 && React.createElement("button", {
    type: "button",
    onClick: () => setWcalc("derate", trayWorst),
    style: {
      border: 0,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      borderRadius: 7,
      padding: "4px 9px",
      fontWeight: 700,
      fontSize: 10.5,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    },
    title: "\u0E43\u0E0A\u0E49\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E17\u0E35\u0E48\u0E41\u0E22\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E08\u0E32\u0E01\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E17\u0E48\u0E2D\u0E23\u0E49\u0E2D\u0E22\u0E2A\u0E32\u0E22\u0E41\u0E25\u0E30\u0E23\u0E32\u0E07\u0E44\u0E1F"
  }, "\u0E43\u0E0A\u0E49 \xD7", trayWorst.toFixed(2), " \u0E08\u0E32\u0E01\u0E17\u0E48\u0E2D/\u0E23\u0E32\u0E07"), React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-3)"
    }
  }, "1.00 = \u0E27\u0E07\u0E08\u0E23\u0E40\u0E14\u0E35\u0E22\u0E27 \xB7 4\u20136 \u0E15\u0E31\u0E27\u0E19\u0E33 0.80 \xB7 7\u20139 0.70 \xB7 10\u201320 0.50")), (!hasAmpTbl || ampSrc.borrowed) && React.createElement("div", {
    className: "bq-note",
    style: {
      marginTop: 10,
      background: ampSrc.borrowed ? "var(--tint-ok-bg)" : "var(--tint-amber-bg)",
      border: "1px solid " + (ampSrc.borrowed ? "var(--tint-ok-bd)" : "var(--tint-amber-bd)"),
      color: ampSrc.borrowed ? "var(--tint-ok-tx)" : "var(--tint-amber-tx2)"
    }
  }, React.createElement(Icon, {
    name: ampSrc.borrowed ? "check" : "alert",
    size: 15,
    color: ampSrc.borrowed ? "#22A35B" : "#F59E0B"
  }), React.createElement("span", null, ampSrc.borrowed ? "ใช้ตารางพิกัดของ \"" + ampSrcTh(ampSrc.from) + "\" — " + (mtdMeta.baseWhy || "ระบายความร้อนแบบเดียวกัน") : "ยังไม่มีตารางของคอลัมน์นี้ — \"สายแนะนำ\" จะขึ้น \"—\" จนกว่าจะกรอกที่หน้าคลัง › พิกัดสาย วสท.")), React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      marginTop: 7
    }
  }, "\u0E2A\u0E32\u0E22\u0E41\u0E19\u0E30\u0E19\u0E33 = \u0E02\u0E19\u0E32\u0E14\u0E40\u0E25\u0E47\u0E01\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E23\u0E31\u0E1A\u0E01\u0E23\u0E30\u0E41\u0E2A \xD71.25 \u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E19\u0E35\u0E49", calcDerate < 1 ? " · หักตัวคูณ ×" + calcDerate.toFixed(2) + " แล้ว" : "")), isMobile ? React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "10px 12px"
    }
  }, calcRows.map((r, i) => {
    const metric = (label, val, sub, hi) => React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: ".02em",
        color: "var(--text-3)",
        textTransform: "uppercase"
      }
    }, label), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13.5,
        fontWeight: 700,
        color: hi ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, val), sub && React.createElement("div", {
      style: {
        fontSize: 9.5,
        color: "var(--text-3)"
      }
    }, sub));
    return React.createElement("div", {
      key: i,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 10,
        background: "var(--surface)",
        padding: "10px 12px"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8
      }
    }, React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, r.label), r.needInput && React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--tint-amber-tx)",
        marginTop: 1
      }
    }, r.note)), React.createElement("span", {
      style: {
        flexShrink: 0,
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 700,
        color: r.needInput ? "var(--text-3)" : "var(--primary-dark)",
        background: r.needInput ? "var(--surface3)" : "var(--primary-soft)",
        padding: "4px 10px",
        borderRadius: 7
      }
    }, r.wire)), !r.needInput && React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        borderTop: "1px solid var(--border)",
        marginTop: 9,
        paddingTop: 9
      }
    }, metric("กำลัง (W)", r.w == null ? "—" : Math.round(r.w).toLocaleString()), metric("กระแสรวม (A)", (Math.round(r.ampTotal * 10) / 10).toFixed(1)), metric(isStringInv ? "กระแส (A)" : "กระแส/สตริง", (Math.round(r.ampString * 10) / 10).toFixed(1), "×1.25 = " + (Math.round(r.ampString * 1.25 * 10) / 10).toFixed(1), r.splittable && wcStrings > 1)));
  })) : React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12.5,
      minWidth: 540
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      color: "var(--text-3)",
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: ".04em"
    }
  }, React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "8px 14px",
      fontWeight: 700
    }
  }, "\u0E0A\u0E38\u0E14\u0E04\u0E33\u0E19\u0E27\u0E13"), React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "8px 10px",
      fontWeight: 700
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07 (W)"), React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "8px 10px",
      fontWeight: 700
    }
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E23\u0E27\u0E21 (A)"), React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "8px 10px",
      fontWeight: 700
    }
  }, isStringInv ? "กระแส (A)" : "กระแส/สตริง (A)"), React.createElement("th", {
    style: {
      textAlign: "right",
      padding: "8px 14px",
      fontWeight: 700
    }
  }, isStringInv ? "สายแนะนำ" : "สายแนะนำ/สตริง"))), React.createElement("tbody", null, calcRows.map((r, i) => React.createElement("tr", {
    key: i,
    style: {
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("td", {
    style: {
      padding: "9px 14px",
      color: "var(--text-1)"
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, r.label), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: r.needInput ? "var(--tint-amber-tx)" : "var(--text-3)"
    }
  }, r.note)), React.createElement("td", {
    style: {
      padding: "9px 10px",
      textAlign: "right",
      fontFamily: "var(--mono)",
      color: "var(--text-2)"
    }
  }, r.w == null ? "—" : Math.round(r.w).toLocaleString()), React.createElement("td", {
    style: {
      padding: "9px 10px",
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, r.needInput ? "—" : (Math.round(r.ampTotal * 10) / 10).toFixed(1)), React.createElement("td", {
    style: {
      padding: "9px 10px",
      textAlign: "right",
      fontFamily: "var(--mono)"
    }
  }, r.needInput ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2014") : React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      fontWeight: 700,
      color: r.splittable && wcStrings > 1 ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, (Math.round(r.ampString * 10) / 10).toFixed(1)), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 9.5,
      color: "var(--text-3)"
    }
  }, "\xD71.25 = ", (Math.round(r.ampString * 1.25 * 10) / 10).toFixed(1)))), React.createElement("td", {
    style: {
      padding: "9px 14px",
      textAlign: "right"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-block",
      fontFamily: "var(--mono)",
      fontSize: 12,
      fontWeight: 700,
      color: r.needInput ? "var(--text-3)" : "var(--primary-dark)",
      background: r.needInput ? "var(--surface3)" : "var(--primary-soft)",
      padding: "3px 9px",
      borderRadius: 7
    }
  }, r.wire))))))), !isMobile && React.createElement("div", {
    style: {
      padding: "9px 14px",
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      borderTop: "1px solid var(--border)"
    }
  }, isStringInv ? "* PV-INVERTER = สาย DC จากแผง→อินเวอร์เตอร์ (Isc × 1.25, สาย PV1-F ขั้นต่ำ 6 mm²) · INVERTER→MCB_SOLAR = กระแสออกอินเวอร์เตอร์/ตัว · MCB_SOLAR→MDB = กระแสออกรวมทุกตัว → ตู้เมน · ขนาดสาย AC เลือกให้รับกระแส ×1.25 ตามพิกัด วสท. · กระแสออกตั้งค่าได้ที่หน้าคลัง › สเปคอินเวอร์เตอร์" : "* MICRO-MICRO = ไมโคร 1 ตัว (" + microW + "W) ÷ 230V (อุปกรณ์ 1 เฟส) · MICRO-COMBINER (กระแส/สตริง) = กระแสรวม ÷ จำนวน String · COMBINER→MCB ใช้กระแสรวมทุกสตริง · กระแสรวม: 1 เฟส = W ÷ V · 3 เฟส = W ÷ (√3 × แรงดันไลน์ V) · ขนาดสายแนะนำเลือกให้รับกระแส ×1.25 (โหลดต่อเนื่อง) อ้างพิกัดสายทองแดง IEC01/THW โดยประมาณ — โปรดตรวจสอบกับวิธีเดินสายจริง"))), React.createElement(BoqSection, _extends({
    title: "\u0E17\u0E48\u0E2D\u0E23\u0E49\u0E2D\u0E22\u0E2A\u0E32\u0E22 (RACE WAY)",
    icon: "grid"
  }, secProps("raceway"), {
    right: condLen > 0 ? React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E23\u0E27\u0E21 ", condLen, " \u0E21.") : null
  }), React.createElement(MeasBar, {
    kinds: ["conduit"]
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, ConduitList({
    kind: "imc",
    label: "ท่อ IMC (3m/ท่อน)",
    sizes: window.BOQ.IMC_SIZES,
    valKey: "length",
    unitText: "ม.",
    check: true,
    hint: "ท่อเหล็ก IMC ยาว 3.0 ม./ท่อน — กรอกความยาวรวมของแต่ละขนาด"
  }), ConduitList({
    kind: "upvc",
    label: "ท่อ uPVC",
    sizes: window.BOQ.UPVC_SIZES,
    valKey: "length",
    unitText: "ม.",
    check: true,
    hint: "ท่อขาว uPVC ยาว 2.9 ม./ท่อน — ขนาดที่เรียกเป็นขนาดนอก ระบบหักผนังท่อให้แล้วตอนตรวจ % เติมเต็ม"
  }), ConduitList({
    kind: "pullbox",
    label: "PULL BOX",
    sizes: window.BOQ.PULLBOX_SIZES,
    valKey: "qty",
    unitText: "ชิ้น",
    hint: "กล่องพักสาย — กรอกจำนวนใบ (ไม่มีสายวิ่งผ่านเป็นเส้นให้ตรวจ % เติมเต็ม)"
  }), FitList({
    rows: cond.extra,
    onChange: v => setCondVal("extra", v),
    catalog: condFits,
    hint: "ของท่อร้อยสายโดยเฉพาะ — เลือกได้ครบทุกขนาด แยกกลุ่ม IMC กับ uPVC (คนละอันกับข้องอของรางไฟ)"
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "* \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C IMC (\u0E41\u0E04\u0E25\u0E49\u0E21\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E1A / \u0E1A\u0E38\u0E0A\u0E0A\u0E34\u0E48\u0E07,\u0E25\u0E47\u0E2D\u0E01\u0E19\u0E31\u0E17 / \u0E23\u0E32\u0E07\u0E0B\u0E35 / \u0E04\u0E2D\u0E19\u0E40\u0E19\u0E04\u0E40\u0E15\u0E2D\u0E23\u0E4C / \u0E04\u0E38\u0E1B\u0E1B\u0E34\u0E49\u0E07) \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E17\u0E48\u0E2D + \u0E08\u0E33\u0E19\u0E27\u0E19 PULL BOX"), React.createElement("button", {
    onClick: () => setAdvC(v => !v),
    style: {
      marginTop: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      border: "none",
      color: "var(--text-2)",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 13,
    color: "var(--text-2)"
  }), " \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C IMC (% \u0E40\u0E1C\u0E37\u0E48\u0E2D / \u0E17\u0E48\u0E2D\u0E2D\u0E48\u0E2D\u0E19) ", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-2)",
    style: {
      transform: advC ? "rotate(180deg)" : "none"
    }
  })), advC && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 12,
      background: "var(--surface2)",
      borderRadius: 10,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 10
    }
  }, React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E41\u0E04\u0E25\u0E49\u0E21\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E1A"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.clamp,
    onChange: e => setCSpare("clamp", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E1A\u0E38\u0E0A\u0E0A\u0E34\u0E48\u0E07/\u0E25\u0E47\u0E2D\u0E01\u0E19\u0E31\u0E17"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.bushing,
    onChange: e => setCSpare("bushing", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E23\u0E32\u0E07\u0E0B\u0E35"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.cchannel,
    onChange: e => setCSpare("cchannel", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E04\u0E2D\u0E19\u0E40\u0E19\u0E04\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.connector,
    onChange: e => setCSpare("connector", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E04\u0E38\u0E1B\u0E1B\u0E34\u0E49\u0E07"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.coupling,
    onChange: e => setCSpare("coupling", e.target.value)
  })), [...new Set((cond.imc || []).map(x => (x.size || "").trim()).filter(Boolean))].map(sz => React.createElement(Field, {
    key: sz,
    label: "ท่ออ่อน IMC " + sz.replace(/^IMC\s*/i, "") + " (กล่อง)"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: (cond.flex || {})[sz] != null ? cond.flex[sz] : 1,
    onChange: e => setFlexSize(sz, e.target.value)
  })))), React.createElement("button", {
    onClick: () => setAdvU(v => !v),
    style: {
      marginTop: 8,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      border: "none",
      color: "var(--text-2)",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 13,
    color: "var(--text-2)"
  }), " \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C uPVC (% \u0E40\u0E1C\u0E37\u0E48\u0E2D / \u0E17\u0E48\u0E2D\u0E2D\u0E48\u0E2D\u0E19) ", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-2)",
    style: {
      transform: advU ? "rotate(180deg)" : "none"
    }
  })), advU && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: 12,
      background: "var(--surface2)",
      borderRadius: 10,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 10
    }
  }, React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D\u0E15\u0E23\u0E07"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.upStraight,
    onChange: e => setCSpare("upStraight", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E41\u0E04\u0E25\u0E21\u0E1B\u0E4C\u0E01\u0E49\u0E32\u0E21\u0E1B\u0E39"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.upClamp,
    onChange: e => setCSpare("upClamp", e.target.value)
  })), React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E04\u0E2D\u0E19\u0E40\u0E19\u0E47\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E4C uPVC"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: csp.upConnector,
    onChange: e => setCSpare("upConnector", e.target.value)
  })), [...new Set((cond.upvc || []).map(x => (x.size || "").trim()).filter(Boolean))].map(sz => React.createElement(Field, {
    key: sz,
    label: "ท่ออ่อนขาว " + ((sz.match(/(\d+)\s*mm/) || [])[1] || "") + "mm (กล่อง)"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: (cond.upFlex || {})[sz] != null ? cond.upFlex[sz] : 1,
    onChange: e => setUpFlexSize(sz, e.target.value)
  }))))), React.createElement(BoqSection, _extends({
    title: "\u0E23\u0E32\u0E07\u0E44\u0E1F (Wireway / Cable Tray)",
    icon: "grid"
  }, secProps("tray"), {
    right: trayLen > 0 ? React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E23\u0E27\u0E21 ", trayLen, " \u0E21.") : null
  }), React.createElement(MeasBar, {
    kinds: ["tray"]
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, TrayList({
    kind: "way",
    label: "Wireway เหล็กมีฝา",
    sizes: window.BOQ.WAY_SIZES,
    hint: "รางเหล็กพับมีฝาปิด ยาว " + window.BOQ.WAY_PIPE_LEN.toFixed(1) + " ม./ท่อน — กรอกความยาวรวมของแต่ละขนาด"
  }), TrayList({
    kind: "tray",
    label: "Cable Tray บันได",
    sizes: window.BOQ.TRAY_SIZES,
    hint: "รางบันได ยาว " + window.BOQ.TRAY_PIPE_LEN.toFixed(1) + " ม./ท่อน — ใช้เดินสายจำนวนมากระยะไกล"
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "160px 1fr",
      gap: 12,
      alignItems: "center"
    }
  }, React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: tw.spare,
    onChange: e => setTrayVal("spare", e.target.value)
  })), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E15\u0E31\u0E27\u0E23\u0E32\u0E07 = \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19\u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27/\u0E17\u0E48\u0E2D\u0E19 \xB7 \u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D = \u0E17\u0E38\u0E01\u0E23\u0E2D\u0E22\u0E15\u0E48\u0E2D +2 \xB7 \u0E02\u0E32\u0E41\u0E02\u0E27\u0E19 = \u0E17\u0E38\u0E01 1.5 \u0E21. \xB7 \u0E1E\u0E38\u0E4A\u0E01\u0E40\u0E2B\u0E25\u0E47\u0E01 4 \u0E15\u0E31\u0E27/\u0E02\u0E32")), FitList({
    rows: tw.extra,
    onChange: v => setTrayVal("extra", v),
    catalog: trayFits,
    hint: "ของรางไฟโดยเฉพาะ — เลือกได้ครบทุกขนาด แยกกลุ่ม Wireway กับ Cable Tray บันได"
  }))), !isHome && kitSections.map(sc => React.createElement(BoqSection, _extends({
    key: sc.key,
    title: sc.title,
    icon: sc.icon
  }, secProps(sc.key), {
    right: sc.count > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, sc.count, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23") : null
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 14
    }
  }, sc.hint), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, sc.kits.map((k, ki) => {
    const st = kitOf(k.key);
    const numBox = it => React.createElement("label", {
      key: it.key,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, it.name, " ", React.createElement("span", {
      style: {
        color: "var(--border-strong)"
      }
    }, "(", it.unit, ")")), React.createElement("input", {
      type: "number",
      min: 0,
      placeholder: "0",
      value: st[it.key] != null ? st[it.key] : "",
      onChange: e => setKit(k.key, it.key, e.target.value === "" ? "" : Math.max(0, +e.target.value || 0)),
      style: Object.assign({}, numStyle, {
        width: "100%",
        height: 34,
        fontSize: 12.5,
        padding: "6px 9px"
      })
    }));
    const extraList = (stateKey, ofWhat, small, opts) => {
      const options = opts || allMatOptions;
      const extra = st[stateKey] || [];
      const setExtra = v => setKit(k.key, stateKey, v);
      const patch = (i, o) => setExtra(extra.map((y, j) => j === i ? Object.assign({}, y, o) : y));
      const upd = (i, key) => e => patch(i, {
        [key]: e.target.value
      });
      const pickName = (i, v) => patch(i, Object.assign({
        name: v
      }, matInfo[v] && matInfo[v].unit ? {
        unit: matInfo[v].unit
      } : {}));
      const nameCell = (x, i) => x.custom ? React.createElement("input", {
        autoFocus: true,
        value: x.name || "",
        placeholder: "พิมพ์ชื่อ อุปกรณ์ประกอบ " + ofWhat,
        style: Object.assign({}, inputStyle, cabSelStyle),
        onChange: upd(i, "name")
      }) : React.createElement(Dropdown, {
        value: x.name || "",
        onChange: v => pickName(i, v),
        style: cabSelStyle,
        placeholder: "เลือกจากคลัง — " + ofWhat,
        options: options,
        addable: true,
        onAdd: v => patch(i, {
          name: v,
          custom: true
        })
      });
      const customToggle = (x, i) => React.createElement("button", {
        type: "button",
        onClick: () => patch(i, {
          custom: !x.custom
        }),
        title: x.custom ? "กลับไปเลือกจากคลังสินค้า" : "พิมพ์ชื่อเอง (ของที่ยังไม่มีในคลัง)",
        style: {
          border: 0,
          background: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--text-3)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          alignSelf: "flex-start"
        }
      }, x.custom ? "เลือกจากคลังแทน" : "พิมพ์เอง");
      return React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 8
        }
      }, extra.map((x, i) => (small ? React.createElement("div", {
        key: i,
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 5
        }
      }, nameCell(x, i), React.createElement("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) 30px",
          gap: 5,
          alignItems: "center"
        }
      }, React.createElement("input", {
        type: "number",
        min: 0,
        value: x.qty != null ? x.qty : "",
        placeholder: "\u0E08\u0E33\u0E19\u0E27\u0E19",
        style: Object.assign({}, numStyle, cabSelStyle),
        onChange: upd(i, "qty")
      }), React.createElement("input", {
        value: x.unit || "",
        placeholder: "\u0E2B\u0E19\u0E48\u0E27\u0E22",
        style: Object.assign({}, inputStyle, cabSelStyle),
        onChange: upd(i, "unit")
      }), React.createElement("button", {
        className: "bq-x",
        onClick: () => setExtra(extra.filter((_, j) => j !== i)),
        title: "\u0E25\u0E1A"
      }, React.createElement(Icon, {
        name: "x",
        size: 13
      }))), customToggle(x, i)) : React.createElement("div", {
        key: i,
        style: {
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 72px 62px 34px",
          gap: 7,
          alignItems: "center"
        }
      }, React.createElement("span", {
        style: {
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3
        }
      }, nameCell(x, i), customToggle(x, i)), React.createElement("input", {
        type: "number",
        min: 0,
        value: x.qty != null ? x.qty : "",
        placeholder: "\u0E08\u0E33\u0E19\u0E27\u0E19",
        style: Object.assign({}, numStyle, cabSelStyle),
        onChange: upd(i, "qty")
      }), React.createElement("input", {
        value: x.unit || "",
        placeholder: "\u0E2B\u0E19\u0E48\u0E27\u0E22",
        style: Object.assign({}, inputStyle, cabSelStyle),
        onChange: upd(i, "unit")
      }), React.createElement("button", {
        className: "bq-x",
        onClick: () => setExtra(extra.filter((_, j) => j !== i)),
        title: "\u0E25\u0E1A"
      }, React.createElement(Icon, {
        name: "x",
        size: 13
      }))))), React.createElement("button", {
        onClick: () => setExtra(extra.concat([{
          name: "",
          qty: "",
          unit: "ชิ้น"
        }])),
        style: {
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          color: "var(--text-2)",
          border: "1px dashed var(--border-strong)",
          borderRadius: 9,
          padding: "5px 10px",
          fontWeight: 700,
          fontSize: small ? 10.5 : 11,
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, React.createElement(Icon, {
        name: "plus",
        size: 12,
        color: "var(--text-2)"
      }), " \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A ", ofWhat));
    };
    return React.createElement("div", {
      key: k.key,
      style: ki === 0 ? null : {
        paddingTop: 16,
        borderTop: "1px solid var(--border)"
      }
    }, sc.kits.length > 1 && React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginBottom: k.hint ? 3 : 7
      }
    }, k.th), k.hint && React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, k.hint)), k.boards ? React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))",
        gap: 9,
        alignItems: "start"
      }
    }, k.boards.map(bd => React.createElement("div", {
      key: bd.key,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 10,
        background: "var(--surface2)",
        display: "flex",
        flexDirection: "column",
        gap: 9
      }
    }, numBox({
      key: bd.key,
      name: bd.name,
      unit: bd.unit
    }), (bd.items || []).length > 0 && React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 8,
        borderTop: "1px dashed var(--border-strong)"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: ".05em",
        textTransform: "uppercase",
        color: "var(--text-3)"
      }
    }, "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E43\u0E19\u0E15\u0E39\u0E49\u0E19\u0E35\u0E49"), bd.items.map(it => numBox(it))), React.createElement("div", {
      style: {
        paddingTop: 8,
        borderTop: "1px dashed var(--border-strong)"
      }
    }, extraList(bd.extraKey, bd.name, true))))) : React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(3, minmax(0,1fr))",
        gap: 9
      }
    }, k.items.map(it => numBox(it))), extraList("extra", k.th, false, k.key === "pipe" ? pipeOptions : null)));
  })))), !isHome && React.createElement(BoqSection, _extends({
    title: "\u0E02\u0E19\u0E2A\u0E48\u0E07 & \u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    icon: "power"
  }, secProps("site"), {
    right: siteTotal > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E3F", baht(siteTotal)) : null
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, "\u0E04\u0E48\u0E32\u0E02\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E44\u0E0B\u0E15\u0E4C\u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E21\u0E35\u0E08\u0E23\u0E34\u0E07 \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E49\u0E25\u0E1A\u0E17\u0E34\u0E49\u0E07\u0E44\u0E14\u0E49"), React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8
    }
  }, "\u0E02\u0E19\u0E2A\u0E48\u0E07 & \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23"), SvcTable({
    sKey: "transport",
    preset: window.BOQ.TRANSPORT_PRESET,
    qtyLabel: "จำนวน"
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      margin: "18px 0 8px"
    }
  }, "\u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"), SvcTable({
    sKey: "manage",
    preset: window.BOQ.MANAGE_PRESET,
    qtyLabel: "จำนวน"
  })), React.createElement(BoqSection, _extends({
    title: "\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C (Inverter / \u0E15\u0E39\u0E49 MDB)",
    icon: "box"
  }, secProps("support"), {
    right: React.createElement("button", {
      onClick: () => {
        setSup("inv", supAuto);
        setSup("mdb", 1);
      },
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "6px 11px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      },
      title: supAuto > 0 ? "ตั้งเป็นอินเวอร์เตอร์ " + supAuto + " ตัว + ตู้ 1 ใบ" : "ไมโครอินเวอร์เตอร์ยึดใต้แผงอยู่แล้ว — ตั้งเฉพาะตู้ 1 ใบ"
    }, "\u0E43\u0E0A\u0E49\u0E15\u0E32\u0E21\u0E23\u0E30\u0E1A\u0E1A")
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 14
    }
  }, "\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E31\u0E27\u0E43\u0E2B\u0E0D\u0E48\u0E41\u0E25\u0E30\u0E15\u0E39\u0E49 MDB \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E42\u0E04\u0E23\u0E07\u0E40\u0E2B\u0E25\u0E47\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E09\u0E32\u0E01\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E22\u0E36\u0E14\u0E1C\u0E19\u0E31\u0E07\u0E40\u0E1B\u0E25\u0E48\u0E32 \u0E46 \u2014 \u0E43\u0E2A\u0E48 0 \u0E16\u0E49\u0E32\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E42\u0E04\u0E23\u0E07"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E08\u0E38\u0E14\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement("input", {
    type: "number",
    min: 0,
    step: 1,
    style: numStyle,
    value: sup.inv,
    onChange: e => setSup("inv", e.target.value === "" ? 0 : Math.max(0, Math.round(+e.target.value || 0)))
  })), React.createElement(Field, {
    label: "\u0E41\u0E1A\u0E1A\u0E22\u0E36\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, React.createElement(Dropdown, {
    value: sup.invKind,
    onChange: v => setSup("invKind", v),
    options: Object.keys(window.BOQ.SUPPORT_KINDS).map(k => ({
      value: k,
      label: window.BOQ.SUPPORT_KINDS[k].label
    }))
  })), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "% \u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E2A\u0E14\u0E38"
  }, React.createElement("input", {
    type: "number",
    style: numStyle,
    value: sup.spare,
    onChange: e => setSup("spare", e.target.value)
  }))), React.createElement(Field, {
    label: "\u0E08\u0E38\u0E14\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E15\u0E39\u0E49 MDB / \u0E15\u0E39\u0E49\u0E44\u0E1F"
  }, React.createElement("input", {
    type: "number",
    min: 0,
    step: 1,
    style: numStyle,
    value: sup.mdb,
    onChange: e => setSup("mdb", e.target.value === "" ? 0 : Math.max(0, Math.round(+e.target.value || 0)))
  })), React.createElement(Field, {
    label: "\u0E41\u0E1A\u0E1A\u0E22\u0E36\u0E14\u0E15\u0E39\u0E49"
  }, React.createElement(Dropdown, {
    value: sup.mdbKind,
    onChange: v => setSup("mdbKind", v),
    options: Object.keys(window.BOQ.SUPPORT_KINDS).map(k => ({
      value: k,
      label: window.BOQ.SUPPORT_KINDS[k].label
    }))
  }))), React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement(SteelSpecBlock, {
    st: st,
    setSteel: setSteel
  })), sup.inv + sup.mdb > 0 && React.createElement("div", {
    className: "bq-note ok",
    style: {
      marginTop: 14
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#22A35B"
  }), React.createElement("span", null, "\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E14\u0E39\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E23\u0E34\u0E07\u0E44\u0E14\u0E49\u0E43\u0E19\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \"\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E17\u0E35\u0E48\u0E16\u0E2D\u0E14\u0E44\u0E14\u0E49\" \u0E2B\u0E21\u0E27\u0E14 ", window.BOQ.G_SUPPORT, " (\u0E23\u0E27\u0E21\u0E2A\u0E35\u0E01\u0E31\u0E19\u0E2A\u0E19\u0E34\u0E21 \u0E25\u0E27\u0E14\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21 \u0E43\u0E1A\u0E15\u0E31\u0E14\u0E40\u0E2B\u0E25\u0E47\u0E01)"))), React.createElement(BoqSection, _extends({
    title: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    icon: "power"
  }, secProps("labor"), {
    right: priced.laborTotal > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E3F", baht(priced.laborTotal), " \xB7 \u0E3F", baht(priced.laborPerW), "/W") : null
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14,
      flexWrap: "wrap"
    }
  }, [{
    v: "lump",
    t: "เหมารวม",
    d: "ราคาเดียวจบ"
  }, {
    v: "split",
    t: "แยกรายการงาน",
    d: "เห็นทีละงาน"
  }].map(m => React.createElement("button", {
    key: m.v,
    type: "button",
    onClick: () => set("laborMode", m.v),
    style: {
      flex: "1 1 180px",
      textAlign: "left",
      padding: "10px 13px",
      borderRadius: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      border: "1px solid " + (laborMode === m.v ? "var(--primary)" : "var(--border-strong)"),
      background: laborMode === m.v ? "var(--primary-soft)" : "var(--surface2)"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 800,
      color: laborMode === m.v ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, m.t), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, m.d)))), laborMode === "lump" ? React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E15\u0E01\u0E25\u0E07\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E49\u0E2D\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E10\u0E32\u0E19\u0E04\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E23\u0E15 \u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E39\u0E13\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "200px 140px minmax(0,1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E10\u0E32\u0E19\u0E04\u0E34\u0E14"
  }, React.createElement(Dropdown, {
    value: lump.basis,
    onChange: v => setLump("basis", v),
    options: [{
      value: "w",
      label: "ต่อวัตต์ (฿/W)"
    }, {
      value: "job",
      label: "เหมาทั้งงาน (บาท)"
    }, {
      value: "kw",
      label: "ต่อ kW (฿/kW)"
    }, {
      value: "panel",
      label: "ต่อแผง (฿/แผง)"
    }]
  })), React.createElement(Field, {
    label: lump.basis === "w" ? "฿ ต่อวัตต์" : lump.basis === "kw" ? "฿ ต่อ kW" : lump.basis === "panel" ? "฿ ต่อแผง" : "฿ เหมาทั้งงาน"
  }, React.createElement("input", {
    type: "number",
    min: 0,
    style: numStyle,
    value: lump.rate,
    placeholder: "0",
    onChange: e => setLump("rate", e.target.value)
  })), React.createElement("div", {
    style: {
      gridColumn: isMobile ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E43\u0E19\u0E43\u0E1A BOQ (\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19)"
  }, React.createElement("input", {
    value: lump.note,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2B\u0E21\u0E32\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A \u0E23\u0E27\u0E21\u0E19\u0E31\u0E48\u0E07\u0E23\u0E49\u0E32\u0E19",
    style: inputStyle,
    onChange: e => setLump("note", e.target.value)
  })))), React.createElement("div", {
    className: "bq-spec"
  }, React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E10\u0E32\u0E19\u0E04\u0E34\u0E14"), React.createElement("span", {
    className: "v"
  }, lump.basis === "w" ? Math.round(result.meta.kw * 1000).toLocaleString() + " W" : lump.basis === "kw" ? result.meta.kw.toLocaleString() + " kW" : lump.basis === "panel" ? result.meta.panelCount.toLocaleString() + " แผง" : "1 งาน")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E40\u0E23\u0E15"), React.createElement("span", {
    className: "v"
  }, "\u0E3F", baht(lump.rate))), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E23\u0E27\u0E21"), React.createElement("span", {
    className: "v hi"
  }, "\u0E3F", baht(priced.laborTotal))), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E04\u0E34\u0E14\u0E40\u0E1B\u0E47\u0E19"), React.createElement("span", {
    className: "v hi"
  }, "\u0E3F", baht(priced.laborPerW), "/W")))) : React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, "\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E02\u0E2D\u0E07\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E40\u0E25\u0E02\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E1C\u0E25\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 (\u0E41\u0E1C\u0E07/\u0E15\u0E31\u0E27/\u0E40\u0E21\u0E15\u0E23) \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E41\u0E04\u0E48 \"\u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22\" \xB7 \u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E17\u0E35\u0E48\u0E23\u0E32\u0E04\u0E32 0 \u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E1A\u0E27\u0E01\u0E40\u0E02\u0E49\u0E32\u0E22\u0E2D\u0E14"), SvcTable({
    sKey: "labor",
    preset: window.BOQ.LABOR_PRESET,
    qtyLabel: "ปริมาณ",
    total: priced.laborTotal,
    perW: priced.laborPerW
  }))), React.createElement(BoqSection, _extends({
    title: "\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 & \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    icon: "box"
  }, secProps("permit"), {
    right: priced.permitTotal > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E3F", baht(priced.permitTotal)) : null
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, "\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21\u0E08\u0E23\u0E34\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14\u0E23\u0E30\u0E1A\u0E1A \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E40\u0E14\u0E32\u0E43\u0E2B\u0E49 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08/\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14 \xB7 \u0E25\u0E1A\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E2D\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22"), SvcTable({
    sKey: "permit",
    preset: window.BOQ.PERMIT_PRESET,
    qtyLabel: "จำนวน",
    total: priced.permitTotal,
    perW: priced.permitPerW
  })), !isHome && React.createElement(BoqSection, _extends({
    title: "\u0E07\u0E32\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 (Input) \u2014 \u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07",
    icon: "box"
  }, secProps("struct"), {
    right: React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 9
      }
    }, structRows > 0 && React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ", structRows, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("button", {
      onClick: () => setAdvS(v => !v),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface3)",
        color: "var(--text-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "6px 11px",
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: advS ? "chevronDown" : "plus",
      size: 13,
      color: "var(--text-2)",
      style: {
        transform: advS ? "rotate(180deg)" : "none"
      }
    }), " ", advS ? "ซ่อน" : "กรอกข้อมูล"))
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E43\u0E19\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 BOQ \u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01 \u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E16\u0E2D\u0E14)"), advS && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      marginTop: 14
    }
  }, React.createElement(MeasBar, {
    kinds: ["ladder", "walkway", "guardrail"]
  }), React.createElement(SteelSpecBlock, {
    st: st,
    setSteel: setSteel
  }), StructBlock({
    kind: "ladder",
    label: "LADDER (บันไดลิง)",
    color: "#0D9488",
    addLabel: "เพิ่มจุด",
    cols: [{
      k: "h",
      ph: "ความสูง (m)"
    }],
    blank: {
      h: ""
    },
    spare: st.ladderSpare != null ? st.ladderSpare : 5,
    onSpare: v => setStructVal("ladderSpare", +v),
    extraItems: st.ladderExtra || [],
    onExtraAdd: () => addStructExtra("ladder"),
    onExtraChange: (i, k, v) => setStructExtra("ladder", i, k, v),
    onExtraDel: i => delStructExtra("ladder", i)
  }), StructBlock({
    kind: "walkway",
    label: "WALKWAY",
    color: "#D97706",
    addLabel: "เพิ่มแนว",
    cols: [{
      k: "len",
      ph: "ความยาวแนว (m)"
    }],
    blank: {
      len: ""
    },
    extra: React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, "END CLAMP"), React.createElement("span", {
      style: {
        width: 96
      }
    }, React.createElement(Dropdown, {
      value: st.walkwayThk || 35,
      onChange: v => setStructVal("walkwayThk", +v),
      options: [{
        value: 30,
        label: "30mm."
      }, {
        value: 35,
        label: "35mm."
      }]
    }))),
    spare: st.walkwaySpare != null ? st.walkwaySpare : 10,
    onSpare: v => setStructVal("walkwaySpare", +v),
    extraItems: st.walkwayExtra || [],
    onExtraAdd: () => addStructExtra("walkway"),
    onExtraChange: (i, k, v) => setStructExtra("walkway", i, k, v),
    onExtraDel: i => delStructExtra("walkway", i)
  }), StructBlock({
    kind: "guardrail",
    label: "GUARD RAIL",
    color: "#DB2777",
    addLabel: "เพิ่มจุด",
    cols: [{
      k: "len",
      ph: "ความยาว layout (m)"
    }, {
      k: "corners",
      ph: "จำนวนมุม"
    }],
    blank: {
      len: "",
      corners: ""
    },
    spare: st.guardrailSpare != null ? st.guardrailSpare : 5,
    onSpare: v => setStructVal("guardrailSpare", +v),
    extraItems: st.guardrailExtra || [],
    onExtraAdd: () => addStructExtra("guardrail"),
    onExtraChange: (i, k, v) => setStructExtra("guardrail", i, k, v),
    onExtraDel: i => delStructExtra("guardrail", i)
  }))), isHome ? React.createElement(BoqSection, _extends({
    title: "Accessories (\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E2D\u0E07)",
    icon: "box"
  }, secProps("acc")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, accList.map((a, i) => {
    const items = a.cat === "พิมพ์เอง" ? [] : accCat.map[a.cat] || [];
    return React.createElement("div", {
      key: i,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 11,
        padding: 9,
        display: "flex",
        flexDirection: "column",
        gap: 7
      }
    }, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 36px",
        gap: 8,
        alignItems: "center"
      }
    }, React.createElement(Dropdown, {
      value: a.cat || "",
      onChange: v => setAccCat(i, v),
      options: [{
        value: "",
        label: "— เลือกหมวด —"
      }].concat(accCat.cats.map(c => ({
        value: c,
        label: c
      }))).concat([{
        value: "พิมพ์เอง",
        label: "✎ พิมพ์เอง"
      }])
    }), React.createElement("button", {
      onClick: () => delAcc(i),
      title: "\u0E25\u0E1A",
      style: {
        height: 40,
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        borderRadius: 9,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 14
    }))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 72px",
        gap: 8,
        alignItems: "center"
      }
    }, a.cat === "พิมพ์เอง" ? React.createElement("input", {
      value: a.name,
      onChange: e => setAcc(i, "name", e.target.value),
      placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E2A\u0E14\u0E38",
      style: inputStyle
    }) : React.createElement(Dropdown, {
      value: a.name || "",
      onChange: v => setAcc(i, "name", v),
      disabled: !a.cat,
      options: [{
        value: "",
        label: a.cat ? "— เลือกวัสดุ —" : "เลือกหมวดก่อน"
      }].concat(matItemOptions(items, a.cat))
    }), React.createElement("input", {
      type: "number",
      style: numStyle,
      value: a.qty,
      placeholder: "\u0E08\u0E33\u0E19\u0E27\u0E19",
      onChange: e => setAcc(i, "qty", e.target.value)
    })));
  }), React.createElement("button", {
    onClick: addAcc,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      border: "none",
      borderRadius: 9,
      padding: "8px 12px",
      fontWeight: 700,
      fontSize: 12.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E2D\u0E07")), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "* \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14 \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E2A\u0E14\u0E38 (\u0E08\u0E32\u0E01\u0E23\u0E32\u0E04\u0E32\u0E27\u0E31\u0E2A\u0E14\u0E38 + \u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32) \u0E2B\u0E23\u0E37\u0E2D \"\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E07\" \u2014 \u0E16\u0E49\u0E32\u0E21\u0E35\u0E23\u0E32\u0E04\u0E32\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E04\u0E34\u0E14\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E43\u0E2B\u0E49")) : React.createElement(BoqSection, _extends({
    title: "Accessories Allowance " + window.BOQ.ACC_ALLOW_PCT + "%",
    icon: "box"
  }, secProps("acc"), {
    right: accAllow > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E3F", baht(accAllow)) : null
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, "\u0E07\u0E32\u0E19\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E44\u0E25\u0E48\u0E16\u0E2D\u0E14 Accessories \u0E17\u0E35\u0E25\u0E30\u0E0A\u0E34\u0E49\u0E19 \u2014 \u0E04\u0E34\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1C\u0E37\u0E48\u0E2D ", window.BOQ.ACC_ALLOW_PCT, "% \u0E02\u0E2D\u0E07\u0E23\u0E32\u0E04\u0E32\u0E17\u0E38\u0E19\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E17\u0E35\u0E48\u0E16\u0E2D\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E07\u0E32\u0E19 (\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07 \u0E04\u0E48\u0E32\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u0E02\u0E19\u0E2A\u0E48\u0E07 \u0E1A\u0E23\u0E34\u0E2B\u0E32\u0E23\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23 \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E15\u0E31\u0E27\u0E21\u0E31\u0E19\u0E40\u0E2D\u0E07)"), React.createElement("div", {
    className: "bq-spec"
  }, React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E10\u0E32\u0E19\u0E04\u0E34\u0E14 \xB7 \u0E23\u0E32\u0E04\u0E32\u0E17\u0E38\u0E19\u0E27\u0E31\u0E2A\u0E14\u0E38"), React.createElement("span", {
    className: "v"
  }, "\u0E3F", baht(accBase))), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1C\u0E37\u0E48\u0E2D"), React.createElement("span", {
    className: "v"
  }, window.BOQ.ACC_ALLOW_PCT, "%")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E1C\u0E37\u0E48\u0E2D Accessories"), React.createElement("span", {
    className: "v hi"
  }, "\u0E3F", baht(accAllow))))), React.createElement(BoqSection, _extends({
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E17\u0E35\u0E48\u0E16\u0E2D\u0E14\u0E44\u0E14\u0E49",
    icon: "box"
  }, secProps("removable"), {
    right: priced.grandTotal > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--primary-dark)"
      }
    }, "\u0E23\u0E27\u0E21 \u0E3F", baht(priced.grandTotal)) : null
  }), priced.grandTotal > 0 && React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      marginBottom: 8,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E15\u0E15\u0E4C \xB7 ", Math.round(result.meta.kw * 1000).toLocaleString(), " W (", result.meta.kw.toLocaleString(), " kW)"), React.createElement("div", {
    className: "bq-spec"
  }, React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E04\u0E48\u0E32\u0E27\u0E31\u0E2A\u0E14\u0E38"), React.createElement("span", {
    className: "v"
  }, "\u0E3F", baht(priced.matPerW), "/W")), React.createElement("div", {
    "data-miss": priced.laborTotal > 0 ? "0" : "1"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), React.createElement("span", {
    className: "v"
  }, priced.laborTotal > 0 ? "฿" + baht(priced.laborPerW) + "/W" : "ยังไม่ตั้งเรต")), React.createElement("div", {
    "data-miss": priced.permitTotal > 0 ? "0" : "1"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15"), React.createElement("span", {
    className: "v"
  }, priced.permitTotal > 0 ? "฿" + baht(priced.permitPerW) + "/W" : "ยังไม่กรอก")), React.createElement("div", null, React.createElement("span", {
    className: "k"
  }, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), React.createElement("span", {
    className: "v hi"
  }, "\u0E3F", baht(priced.perW), "/W"))), React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, priced.groups.filter(g => g.subtotal > 0).slice().sort((a, c) => c.subtotal - a.subtotal).map((g, i) => React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "minmax(0,1fr) 78px" : "150px 1fr 96px 84px",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: GROUP_COLOR[g.group] || "var(--text-3)",
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, g.group)), !isMobile && React.createElement("span", {
    style: {
      height: 6,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: Math.max(2, g.subtotal / priced.grandTotal * 100) + "%",
      background: GROUP_COLOR[g.group] || "var(--text-3)",
      borderRadius: 99
    }
  })), !isMobile && React.createElement("span", {
    style: {
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, "\u0E3F", baht(g.subtotal)), React.createElement("span", {
    style: {
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--primary-dark)",
      fontVariantNumeric: "tabular-nums"
    },
    title: "฿" + baht(g.perKw) + "/kW"
  }, "\u0E3F", baht(g.perW), "/W"))))), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, priced.groups.map((g, gi) => React.createElement("div", {
    key: gi
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 14px",
      background: "var(--surface2)",
      borderTop: gi ? "1px solid var(--border)" : "none",
      boxShadow: "inset 0 -1px 0 var(--border)"
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: GROUP_COLOR[g.group] || "var(--text-3)",
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: "var(--text-2)",
      letterSpacing: ".09em"
    }
  }, g.group), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap"
    }
  }, g.subtotal > 0 ? "฿" + baht(g.subtotal) + (g.perW > 0 ? " · ฿" + baht(g.perW) + "/W" : "") : g.items.length ? g.items.length + " รายการ" : "")), g.items.length === 0 ? React.createElement("div", {
    style: {
      padding: "9px 14px",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u2014") : g.items.map((it, ii) => React.createElement("div", {
    key: ii,
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? priced.grandTotal > 0 ? "minmax(0,1fr) 56px 64px" : "minmax(0,1fr) 56px" : "1fr 68px 84px",
      gap: 8,
      padding: "9px 14px",
      borderTop: "1px solid var(--border)",
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      color: "var(--text-1)",
      lineHeight: 1.35
    }
  }, (it.name || "").trim()), it.renamed && React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10,
      color: "var(--text-3)",
      lineHeight: 1.3
    },
    title: it.priceName ? "เปลี่ยนแค่ชื่อบนใบ จำนวนและราคายังคิดจากชื่อเดิม" : "ระบบถอดจำนวนจากชื่อนี้ — เปลี่ยนชื่อแล้วจำนวนไม่เปลี่ยน"
  }, "\u0E16\u0E2D\u0E14\u0E08\u0E32\u0E01 \u201C", it.nameAuto, "\u201D", it.priceName ? " · ราคาเดิม" : ""), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      marginTop: 1
    }
  }, (() => {
    const vEditable = canEditPrice && !isService(g.group) && !it.allowancePct && (it.name || "").trim();
    const n = (it.variants || []).length;
    if (!vEditable && !it.variantLabel) return null;
    if (!vEditable) return React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, it.variantLabel);
    return React.createElement("button", {
      type: "button",
      onClick: () => setEditVar({
        name: it.name,
        group: g.group,
        unit: it.unit,
        rkey: window.BOQ.qtyKey(g.group, it.nameAuto || it.name),
        nameAuto: it.nameAuto || it.name,
        priceName: it.priceName || it.name
      }),
      title: n > 1 ? n + " ยี่ห้อ/รุ่นในคลัง — กดเพื่อเลือกหรือแก้" : "กดเพื่อระบุยี่ห้อ/รุ่น และแก้ราคา (บันทึกลงคลังสินค้า)",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 7px",
        borderRadius: 99,
        border: "1px solid " + (it.variantLabel ? "var(--border-strong)" : "transparent"),
        background: it.variantLabel ? "var(--surface2)" : "transparent",
        color: it.variantLabel ? "var(--text-2)" : "var(--text-3)",
        fontFamily: "inherit",
        fontSize: 10.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, it.variantLabel || "+ ระบุยี่ห้อ/รุ่น", n > 1 && React.createElement("span", {
      style: {
        color: "var(--primary-dark)"
      }
    }, n, " \u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01"), n > 1 && React.createElement(Icon, {
      name: "chevronDown",
      size: 11,
      color: "var(--text-3)"
    }));
  })(), it.code ? React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, it.code) : null)), (() => {
    const qEditable = !isService(g.group) && !it.allowancePct && (it.name || "").trim();
    const qKey = qEditable ? window.BOQ.qtyKey(g.group, it.nameAuto || it.name) : "";
    if (editQty && editQty.key === qKey && qKey) return React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, React.createElement("input", {
      autoFocus: true,
      type: "number",
      min: 0,
      step: "any",
      value: editQty.val,
      onChange: e => setEditQty(p => Object.assign({}, p, {
        val: e.target.value
      })),
      onKeyDown: e => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitQty();
        }
        if (e.key === "Escape") setEditQty(null);
      },
      onBlur: commitQty,
      style: {
        width: "100%",
        height: 30,
        padding: "0 6px",
        textAlign: "right",
        borderRadius: 8,
        border: "1px solid var(--primary)",
        background: "var(--surface)",
        color: "var(--text-1)",
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 700,
        outline: "none"
      }
    }), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 9,
        color: "var(--text-3)"
      }
    }, "\u0E27\u0E48\u0E32\u0E07 = \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"));
    return React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, React.createElement("span", {
      onClick: qEditable ? () => setEditQty({
        key: qKey,
        val: String(Math.round(it.qty * 100) / 100)
      }) : undefined,
      title: qEditable ? it.qtyAdj ? "แก้เอง (อัตโนมัติ " + (Math.round(it.qtyAuto * 100) / 100).toLocaleString() + ") — ลบค่าออกเพื่อกลับไปใช้อัตโนมัติ" : "กดเพื่อแก้จำนวน" : undefined,
      style: {
        fontFamily: "var(--display)",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-.02em",
        fontVariantNumeric: "tabular-nums",
        color: it.qtyAdj ? "var(--primary-dark)" : "var(--text-1)",
        cursor: qEditable ? "pointer" : "default",
        borderBottom: qEditable ? "1px dashed var(--border-strong)" : "none"
      }
    }, (Math.round(it.qty * 100) / 100).toLocaleString()), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: ".04em",
        color: "var(--text-3)"
      }
    }, it.unit));
  })(), (!isMobile || priced.grandTotal > 0) && (() => {
    const editable = canEditPrice && !isService(g.group) && !it.allowancePct && (it.name || "").trim();
    const editing = editPx && editPx.name === it.name;
    if (editing) return React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, React.createElement("input", {
      autoFocus: true,
      type: "number",
      min: 0,
      step: "any",
      value: editPx.val,
      onChange: e => setEditPx(p => Object.assign({}, p, {
        val: e.target.value
      })),
      onKeyDown: e => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitPx();
        }
        if (e.key === "Escape") setEditPx(null);
      },
      onBlur: commitPx,
      style: {
        width: "100%",
        height: 30,
        padding: "0 7px",
        textAlign: "right",
        borderRadius: 8,
        border: "1px solid var(--primary)",
        background: "var(--surface)",
        color: "var(--text-1)",
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 700,
        outline: "none"
      }
    }), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 9,
        color: "var(--text-3)"
      }
    }, "\u0E1A\u0E32\u0E17/", it.unit || "หน่วย"));
    return React.createElement("span", {
      style: {
        textAlign: "right"
      }
    }, React.createElement("span", {
      onClick: editable ? () => setEditPx({
        name: it.name,
        group: g.group,
        unit: it.unit,
        val: it.price > 0 ? String(it.price) : ""
      }) : undefined,
      title: editable ? "แก้ราคา/หน่วย — บันทึกลงคลังสินค้า" : undefined,
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: it.total > 0 ? "var(--text-1)" : "var(--text-3)",
        cursor: editable ? "pointer" : "default",
        borderBottom: editable ? "1px dashed var(--border-strong)" : "none"
      }
    }, it.total > 0 ? baht(it.total) : "–"), it.price > 0 ? React.createElement("span", {
      style: {
        display: "block",
        fontSize: 9.5,
        color: "var(--text-3)",
        fontVariantNumeric: "tabular-nums"
      }
    }, "@", baht(it.price)) : null);
  })())))), priced.grandTotal > 0 && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "13px 14px",
      background: "var(--primary-soft)",
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".08em",
      color: "var(--primary-dark)"
    }
  }, "\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E23\u0E27\u0E21"), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-.035em",
      fontVariantNumeric: "tabular-nums",
      color: "var(--primary-dark)"
    }
  }, "\u0E3F", baht(priced.grandTotal)))), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, '* กดที่ "จำนวน" เพื่อแก้จำนวนเองได้ (ตัวเลขเขียวคือแก้เอง · ลบค่าออกแล้วกด Enter = กลับไปใช้จำนวนอัตโนมัติ) ', canEditPrice ? '· กดที่ตัวเลขราคาเพื่อแก้ราคา/หน่วย — บันทึกลงคลังสินค้า จึงเห็นตรงกับเมนู "ราคา BOQ" · หมวดค่าแรง/ค่าขออนุญาต/ขนส่ง/บริหาร แก้ที่หัวข้อของหมวดนั้น' : '· ราคาดึงจากเมนู "ราคาวัสดุ" — รายการที่ยังไม่ใส่ราคาจะขึ้น "–"')), React.createElement(BoqSection, _extends({
    title: "\u0E41\u0E1A\u0E48\u0E07\u0E23\u0E32\u0E04\u0E32 & \u0E01\u0E33\u0E44\u0E23",
    icon: "bolt"
  }, secProps("price"), {
    right: pb.sell > 0 ? React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: (pb.net > 0 ? pb.netProfit : pb.profit) > 0 ? "var(--primary-dark)" : "var(--tint-amber-tx)"
      }
    }, "\u0E01\u0E33\u0E44\u0E23 ", pb.net > 0 ? pb.netMargin : pb.margin, "%") : null
  }), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginBottom: 14
    }
  }, "\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E43\u0E1A\u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32 \u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22 \u0E41\u0E25\u0E30\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E34\u0E14 VAT \u0E01\u0E33\u0E44\u0E23 \u0E41\u0E25\u0E30\u0E1A\u0E32\u0E17\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E15\u0E15\u0E4C\u0E43\u0E2B\u0E49"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
      gap: 10,
      marginBottom: 14
    }
  }, [{
    k: "contractor",
    lb: "ค่าแรงผู้รับเหมา (฿)",
    tip: "ค่าจ้างทีมผู้รับเหมาที่มารับงานนี้ — บวกเข้าเป็นต้นทุน"
  }, {
    k: "sell",
    lb: "ราคาขาย (฿)",
    tip: "ราคาขายก่อน VAT และก่อนหักส่วนลด"
  }, {
    k: "discount",
    lb: "ส่วนลด (฿)",
    tip: "จำนวนเงินที่ลดให้ลูกค้า — ราคาหลังลดคำนวณให้"
  }, {
    k: "vat",
    lb: "VAT (%)",
    tip: "ปกติ 7% — แก้ได้ถ้างานนี้คิดต่าง"
  }].map(f => React.createElement("label", {
    key: f.k,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    },
    title: f.tip
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, f.lb), React.createElement("input", {
    type: "number",
    min: 0,
    placeholder: "0",
    value: pricing[f.k] != null ? pricing[f.k] : "",
    onChange: e => setPricing(f.k, e.target.value),
    style: Object.assign({}, numStyle, {
      width: "100%",
      height: 36
    })
  })))), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, [{
    lb: "ต้นทุนวัสดุ + ค่าแรง (จาก BOQ)",
    v: pb.cost,
    sub: priced.perW > 0 ? "฿" + baht(priced.perW) + "/W" : ""
  }, {
    lb: "ค่าแรงผู้รับเหมา",
    v: pb.contractor,
    dim: true
  }, {
    lb: "ต้นทุนรวม",
    v: pb.totalCost,
    strong: true,
    sub: pb.costPerW > 0 ? "฿" + baht(pb.costPerW) + "/W" : ""
  }, {
    lb: "ต้นทุนรวม + VAT " + pb.vat + "%",
    v: pb.totalCostVat,
    dim: true
  }, {
    lb: "ราคาขาย",
    v: pb.sell,
    strong: true,
    sub: pb.sellPerW > 0 ? "฿" + baht(pb.sellPerW) + "/W" : ""
  }, {
    lb: "ราคาขาย + VAT " + pb.vat + "%",
    v: pb.sellVat,
    dim: true
  }, pb.discount > 0 ? {
    lb: "ราคาหลังส่วนลด (ลด ฿" + baht(pb.discount) + ")",
    v: pb.net,
    strong: true,
    sub: pb.netPerW > 0 ? "฿" + baht(pb.netPerW) + "/W" : ""
  } : null, pb.discount > 0 ? {
    lb: "ราคาหลังส่วนลด + VAT " + pb.vat + "%",
    v: pb.netVat,
    dim: true
  } : null].filter(Boolean).map((r, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      padding: "9px 14px",
      borderTop: i === 0 ? "none" : "1px solid var(--border)",
      background: r.strong ? "var(--surface2)" : "transparent"
    }
  }, React.createElement("span", {
    style: {
      fontSize: r.strong ? 12 : 11.5,
      fontWeight: r.strong ? 700 : 600,
      color: r.dim ? "var(--text-3)" : "var(--text-1)"
    }
  }, r.lb), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      gap: 8
    }
  }, r.sub && React.createElement("span", {
    style: {
      fontSize: 10,
      color: "var(--text-3)",
      fontVariantNumeric: "tabular-nums"
    }
  }, r.sub), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: r.strong ? 14 : 12.5,
      fontWeight: r.strong ? 800 : 600,
      fontVariantNumeric: "tabular-nums",
      color: r.v > 0 ? r.dim ? "var(--text-2)" : "var(--text-1)" : "var(--text-3)"
    }
  }, r.v > 0 ? "฿" + baht(r.v) : "—"))))), pb.sell > 0 && (() => {
    const profit = pb.discount > 0 ? pb.netProfit : pb.profit;
    const margin = pb.discount > 0 ? pb.netMargin : pb.margin;
    const good = profit > 0;
    return React.createElement("div", {
      style: {
        marginTop: 12,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        padding: "12px 14px",
        borderRadius: 12,
        background: good ? "var(--primary-soft)" : "var(--tint-amber-bg2)",
        border: "1px solid " + (good ? "var(--tint-ok-bd)" : "var(--tint-amber-bd)")
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "baseline",
        gap: 7
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: ".06em",
        color: good ? "var(--primary-dark)" : "var(--tint-amber-tx2)"
      }
    }, "\u0E01\u0E33\u0E44\u0E23"), React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: "-.035em",
        fontVariantNumeric: "tabular-nums",
        color: good ? "var(--primary-dark)" : "var(--tint-amber-tx2)"
      }
    }, "\u0E3F", baht(profit)), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: good ? "var(--primary-dark)" : "var(--tint-amber-tx2)"
      }
    }, "(", margin, "%)")), React.createElement("span", {
      style: {
        fontSize: 11,
        color: good ? "var(--primary-dark)" : "var(--tint-amber-tx2)",
        fontWeight: 600
      }
    }, good ? "คิดจากราคา" + (pb.discount > 0 ? "หลังส่วนลด" : "ขาย") + " หักต้นทุนรวม (วัสดุ + ค่าแรงติดตั้ง + ค่าแรงผู้รับเหมา) · ตัวเลขนี้ยังไม่รวม VAT" : "ราคานี้ขายแล้วขาดทุน — ต้นทุนรวม ฿" + baht(pb.totalCost) + " สูงกว่าราคาที่ตั้งไว้"));
  })())))), React.createElement("div", {
    className: "bq-foot"
  }, React.createElement("span", {
    className: "bq-kpis"
  }, React.createElement("span", {
    className: "bq-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07"), React.createElement("span", {
    className: "v"
  }, (b.panels || 0).toLocaleString(), React.createElement("small", null, "\u0E41\u0E1C\u0E07"))), React.createElement("span", {
    className: "bq-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), React.createElement("span", {
    className: "v"
  }, result.meta.kw.toLocaleString(), React.createElement("small", null, "kW"))), React.createElement("span", {
    className: "bq-kpi"
  }, React.createElement("span", {
    className: "k"
  }, b.inverterModel ? "อินเวอร์เตอร์" : "ไมโคร"), React.createElement("span", {
    className: "v"
  }, result.meta.invCount, React.createElement("small", null, "\u0E15\u0E31\u0E27"))), React.createElement("span", {
    className: "bq-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E27\u0E31\u0E2A\u0E14\u0E38"), React.createElement("span", {
    className: "v"
  }, itemCount.toLocaleString(), React.createElement("small", null, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))), React.createElement("span", {
    className: "bq-kpi"
  }, React.createElement("span", {
    className: "k"
  }, "\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E23\u0E27\u0E21"), React.createElement("span", {
    className: "v hi"
  }, priced.grandTotal > 0 ? "฿" + baht(priced.grandTotal) : "—")), React.createElement("span", {
    className: "bq-kpi",
    title: priced.perKw > 0 ? "฿" + baht(priced.perKw) + "/kW" : ""
  }, React.createElement("span", {
    className: "k"
  }, "\u0E15\u0E48\u0E2D\u0E27\u0E31\u0E15\u0E15\u0E4C"), React.createElement("span", {
    className: "v hi"
  }, priced.perW > 0 ? "฿" + baht(priced.perW) : "—")), pb.sell > 0 && React.createElement("span", {
    className: "bq-kpi",
    title: "ราคาขาย" + (pb.discount > 0 ? "หลังส่วนลด" : "") + " ฿" + baht(pb.net || pb.sell) + " · รวม VAT ฿" + baht(pb.discount > 0 ? pb.netVat : pb.sellVat)
  }, React.createElement("span", {
    className: "k"
  }, "\u0E01\u0E33\u0E44\u0E23"), React.createElement("span", {
    className: "v hi"
  }, pb.discount > 0 ? pb.netMargin : pb.margin, React.createElement("small", null, "%")))), React.createElement("span", {
    className: "bq-gap"
  }), remaining !== 0 && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--tint-amber-tx)",
      marginRight: 12,
      whiteSpace: "nowrap"
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: "#F59E0B",
      boxShadow: "0 0 0 3px rgba(245,158,11,.22)"
    }
  }), "\u0E22\u0E31\u0E07\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E44\u0E21\u0E48\u0E04\u0E23\u0E1A ", Math.abs(remaining), " \u0E41\u0E1C\u0E07"), React.createElement("button", {
    className: "bq-btn",
    style: {
      marginRight: 8
    },
    onClick: onClose
  }, "\u0E1B\u0E34\u0E14"), React.createElement("button", {
    className: "bq-btn gh",
    style: {
      marginRight: 8
    },
    onClick: () => guardRun(exportXlsx)
  }, React.createElement(Icon, {
    name: "box",
    size: 15,
    color: "var(--tint-ok-tx)"
  }), " Excel"), onSave && React.createElement("button", {
    className: "bq-btn pri",
    onClick: () => guardRun(() => onSave(Object.assign({}, b, {
      project: project
    })))
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 BOQ")), measOpen && React.createElement(Meas3DModal, {
    list: measFor(measOpen),
    targets: measTargets,
    defaultTarget: measDefault,
    onApply: applyMeas,
    onClose: () => setMeasOpen(null)
  }), editVar && React.createElement(MatVariantModal, {
    item: editVar,
    stock: stock,
    priceMap: priceMap || {},
    matOptions: allMatOptions,
    picked: (b.pick || {})[window.BOQ.matKey(editVar.priceName || editVar.name)] || "",
    onPick: sku => setPick(window.BOQ.matKey(editVar.priceName || editVar.name), sku),
    renamed: (b.rename || {})[editVar.rkey] || "",
    keepPrice: !!(b.renameKeep || {})[editVar.rkey],
    onRename: nm => {
      const v = String(nm || "").trim();
      setRename(editVar.rkey, v);
      setEditVar(p => {
        const nn = v || p.nameAuto;
        const keep = v && (b.renameKeep || {})[p.rkey];
        return Object.assign({}, p, {
          name: nn,
          priceName: keep ? p.nameAuto : nn
        });
      });
    },
    onKeepPrice: on => {
      setRenameKeep(editVar.rkey, on);
      setEditVar(p => Object.assign({}, p, {
        priceName: on ? p.nameAuto : p.name
      }));
    },
    onClose: () => setEditVar(null)
  }));
}
function SteelSpecBlock({
  st,
  setSteel
}) {
  const SP = window.BOQ.STEEL_SPECS;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const sel = st && st.steel || {};
  const KINDS = ["box", "round", "flat", "angle", "plate", "anchor"];
  const changed = KINDS.some(k => (sel[k] || {}).size || (sel[k] || {}).thk || (sel[k] || {}).barLen);
  const reset = () => KINDS.forEach(k => {
    setSteel(k, "size", "");
    setSteel(k, "thk", "");
    setSteel(k, "barLen", "");
  });
  const [open, setOpen] = React.useState(false);
  const summary = changed ? KINDS.filter(k => (sel[k] || {}).size || (sel[k] || {}).thk || (sel[k] || {}).barLen).map(k => window.BOQ.steelName(k, sel[k])).join(" · ") : "ใช้ขนาดมาตรฐานทั้งหมด";
  return React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: open ? 12 : "10px 12px",
      background: "var(--surface2)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => setOpen(v => !v),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      border: "none",
      color: "var(--text-2)",
      fontWeight: 700,
      fontSize: 11.5,
      cursor: "pointer",
      fontFamily: "inherit",
      padding: 0,
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 13,
    color: "var(--text-2)"
  }), "\u0E02\u0E19\u0E32\u0E14 / \u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E40\u0E2B\u0E25\u0E47\u0E01", React.createElement(Icon, {
    name: "chevronDown",
    size: 13,
    color: "var(--text-2)",
    style: {
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  })), !open && React.createElement("span", {
    title: summary,
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 10.5,
      fontWeight: changed ? 700 : 500,
      color: changed ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, summary), open && changed && React.createElement("button", {
    type: "button",
    onClick: reset,
    style: {
      marginLeft: "auto",
      border: 0,
      background: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), !open ? null : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5,
      margin: "8px 0 10px"
    }
  }, "\u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07 \u0E1A\u0E31\u0E19\u0E44\u0E14\u0E25\u0E34\u0E07 \xB7 \u0E23\u0E32\u0E27\u0E01\u0E31\u0E19\u0E15\u0E01 \xB7 \u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u2014 \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E17\u0E48\u0E2D\u0E19\u0E41\u0E25\u0E49\u0E27\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E2A\u0E49\u0E19\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 10
    }
  }, KINDS.map(k => {
    const S = SP[k];
    const cur = sel[k] || {};
    const nm = window.BOQ.steelName(k, cur);
    const isLen = !!S.barLen;
    return React.createElement("div", {
      key: k,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "9px 10px",
        background: "var(--surface)"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        color: "var(--text-2)",
        marginBottom: 6
      }
    }, S.th), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: S.thks.length ? isLen ? "1fr 1fr 78px" : "1fr 1fr" : isLen ? "1fr 78px" : "1fr",
        gap: 6
      }
    }, React.createElement(Dropdown, {
      value: cur.size == null || cur.size === "" ? S.dSize : cur.size,
      onChange: v => setSteel(k, "size", v === S.dSize ? "" : v),
      options: S.sizes.map(z => ({
        value: z,
        label: String(z) + (S.sizeUnit ? " " + S.sizeUnit : "")
      }))
    }), S.thks.length > 0 && React.createElement(Dropdown, {
      value: cur.thk == null || cur.thk === "" ? S.dThk === "" ? "__none" : S.dThk : cur.thk,
      onChange: v => setSteel(k, "thk", v === "__none" ? "" : v),
      options: [{
        value: "__none",
        label: "ไม่ระบุหนา"
      }].concat(S.thks.map(t => ({
        value: t,
        label: "หนา " + t + " มม."
      })))
    }), isLen && React.createElement(Dropdown, {
      value: +cur.barLen || S.barLen,
      onChange: v => setSteel(k, "barLen", +v === S.barLen ? "" : +v),
      options: [4, 5, 6, 8].map(L => ({
        value: L,
        label: L + " ม./ท่อน"
      }))
    })), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginTop: 5,
        lineHeight: 1.4
      },
      title: "\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E08\u0E30\u0E44\u0E1B\u0E42\u0E1C\u0E25\u0E48\u0E43\u0E19\u0E43\u0E1A\u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07"
    }, "\u0E16\u0E2D\u0E14\u0E40\u0E1B\u0E47\u0E19 \u201C", nm, "\u201D"));
  }))));
}
function MatVariantModal({
  item,
  stock,
  priceMap,
  matOptions,
  picked,
  onPick,
  renamed,
  onRename,
  keepPrice,
  onKeepPrice,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const baht = n => (Math.round((+n || 0) * 100) / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  const priceSrc = item.priceName || item.name;
  const key = window.BOQ.matKey(priceSrc);
  const linked = (stock && stock.items || []).find(s => (s.aka || []).some(n => window.BOQ.matKey(n) === key));
  const rec = priceMap[key] || {};
  const variants = rec.variants || [];
  const cur = variants.find(v => v.sku === picked) || variants[0] || null;
  const [f, setF] = React.useState(() => ({
    brand: cur && cur.brand || "",
    model: cur && cur.model || "",
    price: cur && cur.price > 0 ? String(cur.price) : "",
    id: cur && cur.id || "",
    isNew: false
  }));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const loadVariant = v => setF({
    brand: v.brand || "",
    model: v.model || "",
    price: v.price > 0 ? String(v.price) : "",
    id: v.id,
    isNew: false
  });
  const curId = cur && cur.id || "";
  React.useEffect(() => {
    setF({
      brand: cur && cur.brand || "",
      model: cur && cur.model || "",
      price: cur && cur.price > 0 ? String(cur.price) : "",
      id: curId,
      isNew: false
    });
  }, [curId, key]);
  const startNew = () => setF({
    brand: "",
    model: "",
    price: "",
    id: "",
    isNew: true
  });
  const save = () => {
    const id = window.saveMatPrice(stock, {
      name: priceSrc,
      group: item.group,
      unit: item.unit,
      brand: f.brand,
      model: f.model,
      price: +f.price || 0,
      id: f.isNew ? "" : f.id,
      forceNew: f.isNew
    });
    const saved = (stock && stock.items || []).find(s => s.id === id);
    if (f.isNew) onPick("");else if (saved && saved.sku) onPick(saved.sku);
    onClose();
  };
  const inp = {
    background: "var(--surface2)",
    border: "1px solid var(--border-strong)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    outline: "none",
    width: "100%"
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 120,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(520px,100%)",
      maxHeight: isMobile ? "92dvh" : "88vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.45)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D \xB7 \u0E23\u0E38\u0E48\u0E19 \xB7 \u0E23\u0E32\u0E04\u0E32"), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      marginTop: 3
    }
  }, item.name)), React.createElement("div", {
    style: {
      padding: 20,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, onRename && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E43\u0E1A\u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07"), React.createElement(Dropdown, {
    value: item.name,
    onChange: v => onRename(v === (item.nameAuto || item.name) ? "" : v),
    options: (matOptions || []).some(o => o.value === item.name) ? matOptions : [{
      value: item.name,
      label: item.name,
      group: "ชื่อปัจจุบัน"
    }].concat(matOptions || []),
    addable: true,
    onAdd: v => onRename(v),
    placeholder: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"
  }), renamed ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, React.createElement("span", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E16\u0E2D\u0E14\u0E43\u0E2B\u0E49\u0E0A\u0E37\u0E48\u0E2D \u201C", item.nameAuto, "\u201D"), React.createElement("button", {
    type: "button",
    onClick: () => onRename(""),
    style: {
      border: 0,
      background: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, "\u0E43\u0E0A\u0E49\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E14\u0E34\u0E21")), onKeepPrice && React.createElement("label", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      cursor: "pointer",
      background: keepPrice ? "var(--primary-soft)" : "var(--surface2)",
      padding: "9px 11px",
      borderRadius: 10,
      border: "1px solid " + (keepPrice ? "var(--primary)" : "var(--border)")
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: !!keepPrice,
    onChange: e => onKeepPrice(e.target.checked),
    style: {
      width: 15,
      height: 15,
      marginTop: 1,
      accentColor: "var(--primary)",
      flexShrink: 0,
      cursor: "pointer"
    }
  }), React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 700,
      color: keepPrice ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, "\u0E43\u0E0A\u0E49\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E21\u0E48 \u0E41\u0E15\u0E48\u0E04\u0E34\u0E14\u0E23\u0E32\u0E04\u0E32\u0E40\u0E14\u0E34\u0E21"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginTop: 2
    }
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E04\u0E48\u0E04\u0E33\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E19\u0E43\u0E1A \u0E23\u0E32\u0E04\u0E32\u0E22\u0E31\u0E07\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01 \u201C", item.nameAuto, "\u201D \u2014 \u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E41\u0E25\u0E30\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E44\u0E21\u0E48\u0E02\u0E22\u0E31\u0E1A")))) : React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E37\u0E48\u0E19\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E32\u0E04\u0E32\u0E08\u0E30\u0E14\u0E36\u0E07\u0E08\u0E32\u0E01\u0E02\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \u0E22\u0E2D\u0E14\u0E43\u0E19\u0E43\u0E1A\u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E1E\u0E35\u0E49\u0E22\u0E19"), !variants.length && React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontSize: 11,
      lineHeight: 1.5,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "9px 11px",
      borderRadius: 9
    }
  }, React.createElement("span", {
    style: {
      display: "flex",
      gap: 7,
      alignItems: "flex-start"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 13,
    color: "var(--tint-amber-tx)",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement("span", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 \u0E23\u0E32\u0E04\u0E32\u0E08\u0E36\u0E07\u0E40\u0E1B\u0E47\u0E19 0 \u2014 \u0E16\u0E49\u0E32\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 \u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E19\u0E31\u0E49\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E23\u0E32\u0E04\u0E32\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")), stock && stock.linkAlias && React.createElement(Dropdown, {
    value: "",
    placeholder: "\u0E1C\u0E39\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 (\u0E23\u0E2B\u0E31\u0E2A\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C)\u2026",
    options: matOptions || [],
    onChange: v => {
      const t = (stock.items || []).find(s => s.name && window.BOQ.matKey(s.name) === window.BOQ.matKey(v));
      if (t) stock.linkAlias(t.id, priceSrc);
    }
  }))), variants.length > 1 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E15\u0E31\u0E27\u0E44\u0E2B\u0E19"), variants.map(v => {
    const on = cur && v.sku === cur.sku;
    return React.createElement("button", {
      key: v.id || v.sku,
      type: "button",
      onClick: () => {
        onPick(v.sku);
        loadVariant(v);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: "9px 11px",
        borderRadius: 11,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
        background: on ? "var(--primary-soft)" : "var(--surface)"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        flexShrink: 0,
        background: on ? "var(--primary)" : "var(--surface3)"
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, v.label || "(ยังไม่ระบุยี่ห้อ/รุ่น)"), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, v.sku)), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 700,
        color: v.price > 0 ? "var(--text-1)" : "var(--text-3)",
        whiteSpace: "nowrap"
      }
    }, v.price > 0 ? "฿" + baht(v.price) : "–"));
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9,
      paddingTop: variants.length > 1 ? 12 : 0,
      borderTop: variants.length > 1 ? "1px solid var(--border)" : "none"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, f.isNew ? "เพิ่มยี่ห้อ/รุ่นใหม่ของของชิ้นนี้" : "แก้รายละเอียด (บันทึกลงคลังสินค้า)"), priceSrc !== item.name && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5,
      marginTop: -3
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E01\u0E49\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E0A\u0E37\u0E48\u0E2D \u201C", priceSrc, "\u201D \u0E0B\u0E36\u0E48\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E23\u0E32\u0E04\u0E32\u0E43\u0E2B\u0E49\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E19\u0E35\u0E49"), linked && React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: -3
    }
  }, React.createElement("span", null, "\u0E1C\u0E39\u0E01\u0E44\u0E27\u0E49\u0E01\u0E31\u0E1A ", React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, linked.name), linked.sku ? React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, " \xB7 ", linked.sku) : null), stock.unlinkAlias && React.createElement("button", {
    type: "button",
    onClick: () => stock.unlinkAlias(linked.id, priceSrc),
    style: {
      border: 0,
      background: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--primary-dark)",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E01")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 9
    }
  }, React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D (Brand)"), React.createElement("input", {
    autoFocus: true,
    style: inp,
    value: f.brand,
    onChange: e => set("brand", e.target.value),
    placeholder: "THAI PP-R / SANWA"
  })), React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E38\u0E48\u0E19 (Model)"), React.createElement("input", {
    style: inp,
    value: f.model,
    onChange: e => set("model", e.target.value),
    placeholder: "D25 / CKT 20"
  }))), React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22 (\u0E1A\u0E32\u0E17", item.unit ? " ต่อ " + item.unit : "", ")"), React.createElement("input", {
    type: "number",
    min: 0,
    step: "any",
    style: Object.assign({}, inp, {
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontWeight: 700
    }),
    value: f.price,
    onChange: e => set("price", e.target.value),
    placeholder: "0",
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      }
    }
  })), !f.isNew && React.createElement("button", {
    type: "button",
    onClick: startNew,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: "none",
      color: "var(--primary-dark)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 9,
      padding: "6px 11px",
      fontWeight: 700,
      fontSize: 11.5,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 12,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D/\u0E23\u0E38\u0E48\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E02\u0E2D\u0E07\u0E02\u0E2D\u0E07\u0E0A\u0E34\u0E49\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "* \u0E41\u0E01\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48 = \u0E41\u0E01\u0E49\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u0E40\u0E25\u0E22 \u0E40\u0E2B\u0E47\u0E19\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E25\u0E31\u0E07 \u0E2B\u0E19\u0E49\u0E32\u0E23\u0E32\u0E04\u0E32 BOQ \u0E41\u0E25\u0E30\u0E17\u0E38\u0E01\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E02\u0E2D\u0E07\u0E0A\u0E34\u0E49\u0E19\u0E19\u0E35\u0E49", variants.length > 1 ? " · ส่วน “งานนี้ใช้ตัวไหน” เก็บไว้ที่งานนี้งานเดียว" : "")), React.createElement("div", {
    style: {
      padding: "13px 20px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      flexShrink: 0
    }
  }, React.createElement("button", {
    className: "bq-btn",
    onClick: onClose
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "bq-btn pri",
    onClick: save
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function BoqSection({
  title,
  icon,
  right,
  children,
  open
}) {
  if (!open) return null;
  return React.createElement("div", {
    className: "bq-card"
  }, React.createElement("div", {
    className: "hd"
  }, React.createElement(Icon, {
    name: icon,
    size: 15,
    color: "var(--primary)"
  }), React.createElement("span", {
    className: "t"
  }, title), right && React.createElement("span", {
    className: "r"
  }, right)), children);
}
Object.assign(window, {
  BOQEditor
});