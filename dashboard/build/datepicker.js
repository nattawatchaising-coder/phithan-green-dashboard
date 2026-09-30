(function () {
  if (window.__pgDatePicker) return;
  window.__pgDatePicker = true;
  const MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const WEEK = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
  const css = `
.pgdp-wrap{position:fixed;inset:0;z-index:10050;-webkit-tap-highlight-color:transparent}
.pgdp{position:fixed;width:316px;box-sizing:border-box;padding:14px 14px 14px;border-radius:22px;
  background:var(--surface,#fff);color:var(--text-1,#0F2B33);font-family:inherit;
  box-shadow:var(--shadow-card),0 28px 56px -16px rgba(15,43,51,.22);
  opacity:0;transform:translateY(-4px) scale(.985);transform-origin:top center;transition:opacity .14s ease,transform .18s ease}
.pgdp.on{opacity:1;transform:none}
.pgdp-h{display:flex;align-items:center;justify-content:space-between;padding:0 2px 10px}
.pgdp-t{font-size:14.5px;font-weight:700;letter-spacing:.01em}
.pgdp-n{width:34px;height:34px;border:none;border-radius:999px;background:transparent;color:var(--text-2);
  cursor:pointer;display:grid;place-items:center;padding:0;box-shadow:none}
.pgdp-n:hover{background:var(--surface2)}
.pgdp-body{background:var(--surface2);border-radius:17px;padding:6px 6px 8px;box-shadow:var(--shadow-inset)}
.pgdp-w,.pgdp-g{display:grid;grid-template-columns:repeat(7,1fr)}
.pgdp-w{font-size:11.5px;font-weight:600;color:var(--text-3);text-align:center;padding:6px 0 6px}
.pgdp-g{row-gap:3px}
.pgdp-d{justify-self:center;width:38px;height:38px;padding:0;border:none;border-radius:999px;background:transparent;box-shadow:none;
  font-family:inherit;font-size:13.5px;font-weight:600;color:var(--text-1);cursor:pointer;font-variant-numeric:tabular-nums;
  transition:background .12s ease,color .12s ease}
.pgdp-d:hover{background:var(--primary-soft);color:var(--primary-dark)}
.pgdp-d.out{color:var(--text-3);opacity:.5;font-weight:500}
.pgdp-d.today{box-shadow:inset 0 0 0 1.5px var(--primary);color:var(--primary)}
.pgdp-d.sel,.pgdp-d.sel:hover{background:var(--primary);color:#fff;opacity:1;
  box-shadow:0 1px 1px -.5px rgba(15,43,51,.12),0 4px 10px -3px color-mix(in srgb,var(--primary) 70%,transparent)}
.pgdp-d:disabled{opacity:.22;cursor:not-allowed;background:none;color:var(--text-3)}
.pgdp-q{display:flex;justify-content:space-between;padding:10px 4px 0}
.pgdp-l{border:none;background:none;box-shadow:none;padding:2px 2px;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--primary);cursor:pointer}
.pgdp-l.mute{color:var(--text-3)}
.pgdp-f{display:flex;gap:9px;margin-top:12px}
.pgdp-b{flex:1;height:42px;border:none;border-radius:14px;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;
  background:var(--surface2);color:var(--text-2);box-shadow:var(--shadow-sm)}
.pgdp-b.pri{background:var(--primary-soft);color:var(--primary-dark)}
.pgdp-b:active,.pgdp-d:active{transform:scale(.96)}
input[type="date"]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:.5}
@media (max-width:559px){
  .pgdp-wrap{background:rgba(8,20,14,.36)}
  .pgdp{left:50% !important;top:auto !important;bottom:max(14px,env(safe-area-inset-bottom));width:min(372px,calc(100vw - 24px));
    transform:translate(-50%,10px);transform-origin:bottom center}
  .pgdp.on{transform:translate(-50%,0)}
  .pgdp-d{width:42px;height:42px;font-size:14.5px}
}`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  const pad = n => String(n).padStart(2, "0");
  const iso = (y, m, d) => y + "-" + pad(m + 1) + "-" + pad(d);
  const parse = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? {
      y: +m[1],
      m: +m[2] - 1,
      d: +m[3]
    } : null;
  };
  const todayIso = () => {
    const t = new Date();
    return iso(t.getFullYear(), t.getMonth(), t.getDate());
  };
  const svg = d => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' + 'stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
  let wrap = null,
    pop = null,
    inp = null,
    sel = "",
    vy = 0,
    vm = 0;
  function isDateInput(t) {
    return t && t.tagName === "INPUT" && t.type === "date" && !t.disabled && !t.readOnly && !t.closest(".pgdp-off");
  }
  const inRange = v => (!inp.min || v >= inp.min) && (!inp.max || v <= inp.max);
  function render() {
    const first = (new Date(vy, vm, 1).getDay() + 6) % 7;
    const today = todayIso();
    let cells = "";
    for (let i = 0; i < 42; i++) {
      const dt = new Date(vy, vm, 1 - first + i);
      const v = iso(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const cls = ["pgdp-d"];
      if (dt.getMonth() !== vm) cls.push("out");
      if (v === today) cls.push("today");
      if (v === sel) cls.push("sel");
      cells += '<button type="button" class="' + cls.join(" ") + '" data-a="d" data-v="' + v + '"' + (inRange(v) ? "" : " disabled") + ">" + dt.getDate() + "</button>";
    }
    pop.innerHTML = '<div class="pgdp-h">' + '<button type="button" class="pgdp-n" data-a="prev" aria-label="เดือนก่อน">' + svg("M15 18l-6-6 6-6") + "</button>" + '<div class="pgdp-t">' + MONTHS[vm] + " " + (vy + 543) + "</div>" + '<button type="button" class="pgdp-n" data-a="next" aria-label="เดือนถัดไป">' + svg("M9 18l6-6-6-6") + "</button>" + "</div>" + '<div class="pgdp-body">' + '<div class="pgdp-w">' + WEEK.map(w => "<div>" + w + "</div>").join("") + "</div>" + '<div class="pgdp-g">' + cells + "</div>" + "</div>" + '<div class="pgdp-q">' + '<button type="button" class="pgdp-l" data-a="today">วันนี้</button>' + (sel && !inp.required ? '<button type="button" class="pgdp-l mute" data-a="clear">ล้างวันที่</button>' : "<span></span>") + "</div>" + '<div class="pgdp-f">' + '<button type="button" class="pgdp-b" data-a="cancel">ยกเลิก</button>' + '<button type="button" class="pgdp-b pri" data-a="ok">ตกลง</button>' + "</div>";
  }
  function place() {
    if (!pop || !inp) return;
    if (window.innerWidth < 560) return;
    const r = inp.getBoundingClientRect();
    const w = pop.offsetWidth,
      h = pop.offsetHeight;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    let top = r.bottom + 8;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }
  function commit(v) {
    const t = inp;
    close();
    if (!t || t.value === v) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(t, v);
    t.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    t.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }
  function shift(n) {
    const d = new Date(vy, vm + n, 1);
    vy = d.getFullYear();
    vm = d.getMonth();
    render();
  }
  function pick(v) {
    sel = v;
    const p = parse(v);
    if (p) {
      vy = p.y;
      vm = p.m;
    }
    render();
  }
  function onAct(e) {
    const b = e.target.closest("[data-a]");
    if (!b || b.disabled) return;
    const a = b.dataset.a;
    if (a === "prev") shift(-1);else if (a === "next") shift(1);else if (a === "d") pick(b.dataset.v);else if (a === "today") {
      const t = todayIso();
      if (inRange(t)) pick(t);
    } else if (a === "clear") commit("");else if (a === "cancel") close();else if (a === "ok") commit(sel);
  }
  function open(t) {
    close();
    inp = t;
    sel = t.value || "";
    const p = parse(sel) || parse(todayIso());
    vy = p.y;
    vm = p.m;
    wrap = document.createElement("div");
    wrap.className = "pgdp-wrap";
    pop = document.createElement("div");
    pop.className = "pgdp";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "เลือกวันที่");
    wrap.appendChild(pop);
    render();
    ["pointerdown", "mousedown", "touchstart", "click"].forEach(ev => wrap.addEventListener(ev, e => e.stopPropagation(), {
      passive: true
    }));
    wrap.addEventListener("click", e => {
      if (e.target === wrap) close();else onAct(e);
    });
    pop.addEventListener("dblclick", e => {
      const b = e.target.closest('[data-a="d"]');
      if (b && !b.disabled) commit(b.dataset.v);
    });
    document.body.appendChild(wrap);
    place();
    requestAnimationFrame(() => pop && pop.classList.add("on"));
  }
  function close() {
    if (wrap) wrap.remove();
    wrap = pop = null;
    inp = null;
  }
  document.addEventListener("pointerdown", e => {
    if (!isDateInput(e.target)) return;
    e.preventDefault();
    if (!wrap) open(e.target);
  }, true);
  document.addEventListener("touchstart", e => {
    if (isDateInput(e.target)) e.preventDefault();
  }, {
    capture: true,
    passive: false
  });
  document.addEventListener("click", e => {
    if (isDateInput(e.target)) e.preventDefault();
  }, true);
  document.addEventListener("keydown", e => {
    if (wrap) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      const step = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -7,
        ArrowDown: 7
      }[e.key];
      if (step) {
        e.preventDefault();
        const p = parse(sel) || parse(todayIso());
        const d = new Date(p.y, p.m, p.d + step);
        const v = iso(d.getFullYear(), d.getMonth(), d.getDate());
        if (inRange(v)) pick(v);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (sel) commit(sel);
      }
      return;
    }
    if (isDateInput(e.target) && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(e.target);
    }
  }, true);
  window.addEventListener("scroll", place, true);
  window.addEventListener("resize", () => {
    if (wrap && window.innerWidth >= 560) place();
  });
  window.pgOpenDatePicker = el => {
    if (isDateInput(el)) open(el);
  };
})();