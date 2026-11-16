/* เทสต์เอนจินคำนวณสาย (dashboard/cablecalc.jsx) — รัน: npm test
   ผลอ้างอิงจาก HANDOFF.md ข้อ 5 ของชุดที่ผู้ใช้ส่งมา + ตัวอย่างในรูปวิธีคิดของผู้ใช้ (16 พ.ย. 2026) */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const src = fs.readFileSync(new URL("../dashboard/cablecalc.jsx", import.meta.url), "utf8");
const ctx = { window: {} };
vm.runInNewContext(src, ctx);
const CC = ctx.window.CC;
const near = (a, b, d = 0.005) => assert.ok(Math.abs(a - b) <= d, a + " ≠ " + b);

const TRINA740 = { vmp: 42.1, imp: 17.58, voc: 50.3, isc: 18.66, beta: -0.24 };
const acBase = { sys: "3P", v: 400, ct: "1C", arr: "Trefoil", n: 1, ta: 40, cgm: "L-2D", trays: 1, vdLim: 2 };

test("INV01 SG150CX → SMDB: 320AT/400AF · 4-1C×185 · 0.10%", () => {
  const o = CC.ac(Object.assign({}, acBase, { imax: 240.6, k: 1.25, circ: 2, len: 6.5 }));
  assert.equal(o.at, 320); assert.equal(o.af, 400);
  assert.equal(o.use, 185); assert.equal(o.cable, "4-1C×185 mm²");
  near(o.pct, 0.10, 0.006); assert.ok(o.ok);
});

test("INV02 SG50CX-P2 → SMDB: 125AT/160AF · 4-1C×35 · 0.19%", () => {
  const o = CC.ac(Object.assign({}, acBase, { imax: 83.6, k: 1.25, circ: 2, len: 8 }));
  assert.equal(o.at, 125); assert.equal(o.af, 160);
  assert.equal(o.use, 35); near(o.pct, 0.19, 0.006);
});

test("สายเมน SMDB-1 → MDB 20 ม.: 324.2 A · 350AT · 4-1C×240 · 0.36%", () => {
  const o = CC.ac(Object.assign({}, acBase, { imax: 240.6 + 83.6, k: 1, circ: 1, len: 20 }));
  near(o.imax, 324.2, 1e-9); assert.equal(o.at, 350);
  assert.equal(o.use, 240); near(o.pct, 0.36, 0.006);
});

test("DC INV01 สตริง 125 ม. 20 แผง: 6 mm² · 2.26% (Cg 0.38)", () => {
  const o = CC.dcString({ n: 20, len: 125 }, TRINA740, { kDC: 1.25, ca: 1, cg: 0.38, vdLim: 3, minSize: 4 });
  assert.equal(o.use, 6); near(o.pct, 2.26, 0.006); assert.ok(o.ok);
});

test("Voc สูงสุด 20 × TSM-740 ที่ 15°C = 1,030.1 V", () => {
  near(CC.vocMax(20, 50.3, -0.24, 15), 1030.1, 0.05);
});

test("ตัวอย่างในรูปผู้ใช้: 25 × 620 W ที่ 5°C = 1,492 V · สาย 4 mm² 100 ม. VD 16.99 V = 1.43%", () => {
  near(CC.vocMax(25, 56.82, -0.25, 5), 1491.5, 0.05);
  const v = CC.dcVd(13.09, 100, 4, 25 * 47.37);
  near(v.r90, 6.49, 0.005); near(v.vd, 16.99, 0.01); near(v.pct, 1.43, 0.01);
});

test("สาย DC ไม่ต่ำกว่าขั้นต่ำ 4 mm² แม้กระแส/ระยะน้อย", () => {
  const o = CC.dcString({ n: 10, len: 5 }, { vmp: 40, imp: 10, voc: 48, isc: 10.5 }, { vdLim: 3, minSize: 4 });
  assert.equal(o.use, 4);
});

test("ตาราง Ca/Cg/PE", () => {
  assert.equal(CC.ca(40), 1); assert.equal(CC.ca(45), 0.96); assert.equal(CC.ca(52), 0.84);
  assert.equal(CC.cg("V-H", 2, 3), 0.81); assert.equal(CC.cg("L-H", 1, 6), 0.93); assert.equal(CC.cg("manual", 1, 1, 0.7), 0.7);
  assert.equal(CC.pe(320), 25); assert.equal(CC.pe(100), 10);
});

test("ประมาณระยะสาย DC จาก 3D: แนวฉาก + ลงหลังคา + สายข้ามแถว ÷ 2 × เผื่อ", () => {
  /* สตริง 4 แผง: 2 แผงติดกันที่ x=0..2 แล้วกระโดดไปแถวใหม่ x=10..12 (ห่าง 8 ม. > 3) · หลังคาสูง 6 ม. · อินเวอร์เตอร์ (0, 20) บนพื้น */
  const r = CC.dcRoutes([{ id: 1, pts: [[0, 0], [2, 0], [10, 0], [12, 0]], ys: [6, 6, 6, 6] }], [{ x: 0, z: 20, y: 0 }], { jump: 3, spare: 1.2 });
  const s = r[1];
  near(s.pos, 26, 1e-9);          // |0|+|20| + 6
  near(s.neg, 38, 1e-9);          // 12+20 + 6
  near(s.jump, 8, 1e-9);          // 2 → 10
  assert.equal(s.len, Math.ceil((26 + 38 + 8) / 2 * 1.2));   // 43.2 → 44
  assert.deepEqual(Object.keys(CC.dcRoutes([{ id: 2, pts: [[0, 0]] }], [], {})), []);   // ไม่มีจุดอินเวอร์เตอร์ = ไม่ประมาณ
});

test("หม้อแปลง 3000 kVA 22000/800 V %Z 6", () => {
  const x = CC.xfmr(3000, 22000, 800, 6);
  near(x.inHv, 78.73, 0.01); near(x.inLv, 2165.06, 0.01); near(x.iscLv, 36.08, 0.01);
});
