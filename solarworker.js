/* ================================================================
   PHITHAN GREEN — โรงคำนวณแสงและเงา (Web Worker)

   ทำไมต้องมีไฟล์นี้
   การจำลองเงาต้องยิงลำแสงจากแผงทุกใบไปหาดวงอาทิตย์ ทีละช่วงเวลา
   หลังคาโรงงานจริงงานหนึ่งมีแผง 4588 ใบ → จำลองทั้งปีใช้เวลาสิบกว่าวินาที
   ถ้าคิดในเธรดเดียวกับหน้าจอ เบราว์เซอร์จะวาดอะไรไม่ได้เลยตลอดเวลานั้น
   กดปุ่มก็ไม่ตอบ = "ค้าง" ในสายตาผู้ใช้

   ย้ายมาคิดในเธรดแยก หน้าจอจึงลื่นตลอด ระหว่างรอขึ้นว่า "กำลังคำนวณ"
   ตัวเลขที่ได้เป็นชุดเดียวกันเป๊ะ เพราะเรียกฟังก์ชันตัวเดียวกับที่หน้าเว็บใช้
   (ไม่ได้ก๊อปสูตรมาไว้ที่นี่ — ถ้าก๊อป สองที่จะค่อย ๆ เพี้ยนจากกัน)

   ไฟล์นี้เป็น .js ธรรมดา ไม่ผ่าน babel — อย่าใส่ JSX
   ================================================================ */

/* ไฟล์คำนวณลงท้ายด้วย Object.assign(window, {...}) ตามแบบของทั้งโปรเจกต์
   ในเธรดแยกไม่มี window ต้องชี้ให้เป็นตัวเดียวกับ global ก่อน importScripts */
self.window = self;

var SU_READY = false;

function suRun(m) {
  var o = m.opt || {};
  if (m.job === "annual") return self.ivShadeAnnual(m.st, m.byPanel, m.groups, o);
  if (m.job === "day") return self.ivDaySim(m.st, m.panel, m.groups, m.byPanel, o);
  if (m.job === "year") return self.ivYearSim(m.st, m.panel, m.groups, m.byPanel, o);
  if (m.job === "iso") return self.ivIsoShade(m.st, o);
  throw new Error("ไม่รู้จักงาน " + m.job);
}

self.onmessage = function (e) {
  var m = e.data || {};

  /* ข้อความแรก = บอกว่าไฟล์คำนวณอยู่ URL ไหน
     หน้าเว็บอ่าน src จริงจาก <script> ที่มันโหลดอยู่มาส่งให้ ?v= จึงตรงกันเสมอ
     ไม่ต้องมานั่งบัมพ์เลขรุ่นซ้ำอีกที่ ซึ่งลืมเมื่อไหร่ = เธรดแยกคิดด้วยสูตรเก่า */
  if (m.init) {
    try {
      self.importScripts.apply(self, m.init);
      SU_READY = typeof self.ivYearSim === "function";
      self.postMessage({ ready: SU_READY });
    } catch (err) {
      SU_READY = false;
      self.postMessage({ ready: false, why: String(err && err.message || err) });
    }
    return;
  }

  if (m.id == null) return;
  if (!SU_READY) { self.postMessage({ id: m.id, err: "ยังโหลดไฟล์คำนวณไม่เสร็จ" }); return; }
  try {
    var t0 = Date.now();
    var out = suRun(m);
    self.postMessage({ id: m.id, out: out, ms: Date.now() - t0 });
  } catch (err) {
    self.postMessage({ id: m.id, err: String(err && err.message || err) });
  }
};
