const WS_KINDS = [{
  key: "survey",
  th: "สำรวจ",
  doneTh: "สำรวจแล้ว",
  planTh: "นัดสำรวจ",
  color: "#3B82F6",
  icon: "search"
}, {
  key: "install",
  th: "ติดตั้ง",
  doneTh: "ติดตั้งแล้ว",
  planTh: "นัดติดตั้ง",
  color: "#84CC16",
  icon: "bolt"
}, {
  key: "service",
  th: "บริการ",
  doneTh: "บริการแล้ว",
  planTh: "นัดบริการ",
  color: "#F59E0B",
  icon: "wrench"
}];
const WS_PERIODS = [{
  key: "day",
  th: "รายวัน",
  title: "ประจำวัน"
}, {
  key: "week",
  th: "รายสัปดาห์",
  title: "ประจำสัปดาห์"
}, {
  key: "month",
  th: "รายเดือน",
  title: "ประจำเดือน"
}];
const WS_BUCKETS = [{
  key: "done",
  th: "ทำแล้ว",
  color: "#10B981"
}, {
  key: "plan",
  th: "นัดหมาย",
  color: "#0EA5E9"
}];
const WS_DAY_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const WS_DAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WS_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const WS_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const wsPad = n => (n < 10 ? "0" : "") + n;
const wsISO = d => d.getFullYear() + "-" + wsPad(d.getMonth() + 1) + "-" + wsPad(d.getDate());
const wsParse = iso => new Date(String(iso).slice(0, 10) + "T00:00:00");
const wsToday = () => wsISO(new Date());
const wsAddDays = (iso, n) => {
  const d = wsParse(iso);
  d.setDate(d.getDate() + n);
  return wsISO(d);
};
function wsDayOf(ts) {
  if (!ts) return "";
  const s = String(ts);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s.slice(0, 10) : wsISO(d);
}
function wsTimeOf(ts) {
  if (!ts) return "";
  const s = String(ts);
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : wsPad(d.getHours()) + ":" + wsPad(d.getMinutes());
}
const wsShort = iso => {
  const d = wsParse(iso);
  return isNaN(d.getTime()) ? "—" : d.getDate() + " " + WS_MON_TH[d.getMonth()];
};
const wsShortDay = iso => {
  const d = wsParse(iso);
  return isNaN(d.getTime()) ? "—" : WS_DAY_SHORT[d.getDay()] + " " + d.getDate() + " " + WS_MON_TH[d.getMonth()];
};
function wsRange(period, anchor) {
  const a = wsParse(anchor);
  if (period === "day") return {
    start: anchor,
    end: anchor
  };
  if (period === "week") {
    const dow = (a.getDay() + 6) % 7;
    const s = wsAddDays(anchor, -dow);
    return {
      start: s,
      end: wsAddDays(s, 6)
    };
  }
  return {
    start: wsISO(new Date(a.getFullYear(), a.getMonth(), 1)),
    end: wsISO(new Date(a.getFullYear(), a.getMonth() + 1, 0))
  };
}
function wsShift(period, anchor, n) {
  if (period === "day") return wsAddDays(anchor, n);
  if (period === "week") return wsAddDays(anchor, 7 * n);
  const a = wsParse(anchor);
  return wsISO(new Date(a.getFullYear(), a.getMonth() + n, 1));
}
const wsOverlaps = (r, s, e) => !!s && s <= r.end && (e || s) >= r.start;
function wsRangeLabel(period, r) {
  const s = wsParse(r.start),
    e = wsParse(r.end);
  const yr = d => d.getFullYear() + 543;
  if (period === "day") return WS_DAY_TH[s.getDay()] + " " + s.getDate() + " " + WS_MON_TH[s.getMonth()] + " " + yr(s);
  if (period === "month") return WS_MON_FULL[s.getMonth()] + " " + yr(s);
  if (s.getMonth() === e.getMonth()) return s.getDate() + "–" + e.getDate() + " " + WS_MON_TH[s.getMonth()] + " " + yr(e);
  return s.getDate() + " " + WS_MON_TH[s.getMonth()] + " – " + e.getDate() + " " + WS_MON_TH[e.getMonth()] + " " + yr(e);
}
function wsSubRanges(period, r) {
  if (period === "day") return [];
  const out = [];
  if (period === "week") {
    for (let d = r.start; d <= r.end; d = wsAddDays(d, 1)) out.push({
      start: d,
      end: d,
      th: wsShortDay(d)
    });
    return out;
  }
  let s = r.start,
    i = 1;
  while (s <= r.end) {
    const dow = (wsParse(s).getDay() + 6) % 7;
    let e = wsAddDays(s, 6 - dow);
    if (e > r.end) e = r.end;
    out.push({
      start: s,
      end: e,
      th: "สัปดาห์ " + i + " · " + wsShort(s) + (e !== s ? "–" + wsShort(e) : "")
    });
    s = wsAddDays(e, 1);
    i++;
  }
  return out;
}
const wsTypes = () => window.SF && window.SF.TYPES || [];
function wsTypeOf(t) {
  if (!t) return "home";
  if (wsTypes().some(x => x.key === t)) return t;
  return t === "biz" || t === "project" ? "project" : "home";
}
const wsTypeInfo = k => wsTypes().find(x => x.key === k) || {
  key: k,
  th: k === "all" ? "รวม" : k,
  color: "var(--text-2)"
};
function wsBuildItems(src) {
  const SF = window.SF || {};
  const jobsById = {};
  (src.jobs || []).forEach(j => {
    if (j) jobsById[j.id] = j;
  });
  const leadsById = {};
  (src.leads || []).forEach(l => {
    if (l) leadsById[l.id] = l;
  });
  const sitesById = {};
  (src.sites || []).forEach(s => {
    if (s) sitesById[s.id] = s;
  });
  const techName = id => {
    const t = id && SF.TECH_BY_ID && SF.TECH_BY_ID[id];
    return t ? t.nick || t.name : "";
  };
  const out = [];
  const ASB = window.APPT_STATUS_BY || {};
  (src.appts || []).forEach(a => {
    if (!a || !a.start) return;
    const job = a.projectId ? jobsById[a.projectId] || null : null;
    const lead = a.leadId ? leadsById[a.leadId] || null : null;
    const tgt = job || lead;
    const st = ASB[a.status] || ASB.scheduled || {
      th: a.status || "",
      color: "#94A3B8"
    };
    const base = {
      kind: "survey",
      targetId: a.projectId || a.leadId || a.id,
      type: wsTypeOf(tgt ? tgt.type : ""),
      code: tgt && tgt.code || a.jobCode || "",
      name: tgt && tgt.name || a.jobName || "(ไม่ระบุชื่อ)",
      province: tgt && tgt.province || a.province || "",
      who: techName(a.engineerId),
      status: {
        th: st.th,
        color: st.color
      },
      sub: lead && !job ? "ลูกค้าสำรวจ (ยังไม่เป็นงาน)" : "",
      note: a.notes || "",
      job: job,
      prio: 2
    };
    if (a.status !== "canceled" && a.status !== "rescheduled") out.push(Object.assign({}, base, {
      bucket: "plan",
      key: "sa-p-" + a.id,
      day: wsDayOf(a.start),
      time: wsTimeOf(a.start)
    }));
    if (a.status === "done") out.push(Object.assign({}, base, {
      bucket: "done",
      key: "sa-d-" + a.id,
      day: wsDayOf(a.completedAt) || wsDayOf(a.start),
      time: wsTimeOf(a.completedAt) || wsTimeOf(a.start)
    }));
  });
  (src.jobs || []).forEach(j => {
    if (!j) return;
    const s = SF.installDate ? SF.installDate(j) : "";
    const e = s ? SF.installEnd ? SF.installEnd(j) : s : "";
    const reports = Object.keys((src.dailyAll || {})[j.id] || {}).sort();
    const base = {
      kind: "install",
      targetId: j.id,
      type: wsTypeOf(j.type),
      code: j.code || j.id,
      name: j.name || "(ไม่ระบุชื่อ)",
      province: j.province || "",
      who: techName(j.tech),
      job: j,
      reports: reports,
      note: j.problem || "",
      sub: ""
    };
    if (s) {
      const st = j.stage === "done" ? {
        th: "เสร็จสิ้นแล้ว",
        color: "#10B981"
      } : j.stage === "install" ? {
        th: "กำลังติดตั้ง",
        color: "#84CC16"
      } : j.delayed ? {
        th: "เลยวันนัด · ยังไม่เริ่ม",
        color: "#EF4444"
      } : {
        th: "รอถึงวันนัด",
        color: "#F59E0B"
      };
      out.push(Object.assign({}, base, {
        bucket: "plan",
        key: "j-p-" + j.id,
        day: s,
        dayEnd: e,
        time: "",
        status: st,
        prio: 2
      }));
    }
    if (j.stage === "done") {
      const h = (j.hist || []).find(x => x && x.key === "done" && x.status !== "pending" && (x.date || x.at));
      const dd = h && (h.date || wsDayOf(h.at)) || e || "";
      if (dd) out.push(Object.assign({}, base, {
        bucket: "done",
        key: "j-d-" + j.id,
        day: dd,
        time: h ? wsTimeOf(h.at) : "",
        status: {
          th: "เสร็จสิ้น",
          color: "#10B981"
        },
        prio: 3
      }));
    } else if (j.stage === "install" && s) {
      out.push(Object.assign({}, base, {
        bucket: "done",
        key: "j-w-" + j.id,
        day: s,
        dayEnd: e,
        time: "",
        status: {
          th: "กำลังติดตั้ง",
          color: "#84CC16"
        },
        prio: 2
      }));
    }
    reports.forEach(d => {
      out.push(Object.assign({}, base, {
        bucket: "done",
        key: "j-r-" + j.id + "-" + d,
        day: d,
        time: "",
        status: {
          th: "มีรายงานหน้างาน",
          color: "#84CC16"
        },
        prio: 1
      }));
    });
  });
  const siteBase = (siteId, fallbackName) => {
    const site = sitesById[siteId] || {};
    const j = jobsById[site.jobId || siteId] || null;
    return {
      kind: "service",
      targetId: siteId || fallbackName || "?",
      type: wsTypeOf(j ? j.type : site.type),
      code: site.code || j && j.code || siteId || "",
      name: site.name || j && j.name || fallbackName || "(ไม่ระบุชื่อ)",
      province: site.province || j && j.province || "",
      who: techName(site.tech),
      job: j,
      note: "",
      sub: ""
    };
  };
  const TSB = window.OM_TICKET_STATUS_BY || {};
  const tkey = window.omTicketKey || (k => k);
  (src.tickets || []).forEach(t => {
    if (!t) return;
    const k = tkey(t.status);
    const st = TSB[k] || {
      th: k || "",
      color: "#94A3B8"
    };
    const b = siteBase(t.siteId, t.siteName);
    b.who = t.assigneeName || techName(t.techId) || b.who;
    b.sub = "ใบแจ้งซ่อม " + (t.no || "") + (t.title ? " · " + t.title : "");
    if (t.apptDate && (k === "scheduled" || k === "closed")) out.push(Object.assign({}, b, {
      bucket: "plan",
      key: "t-p-" + t.id,
      day: t.apptDate,
      time: t.apptFrom || "",
      status: {
        th: st.th,
        color: st.color
      },
      prio: 2
    }));
    if (k === "closed" && t.closedAt) out.push(Object.assign({}, b, {
      bucket: "done",
      key: "t-d-" + t.id,
      day: wsDayOf(t.closedAt),
      time: wsTimeOf(t.closedAt),
      status: {
        th: "ปิดงานแล้ว",
        color: "#10B981"
      },
      prio: 2
    }));
  });
  const CSB = window.OM_CLEAN_STATUS || {};
  const cleanLive = window.omCleanLive || (v => !!v && v.status !== "canceled" && v.status !== "skipped");
  (src.cleanAll || []).forEach(v => {
    if (!cleanLive(v)) return;
    const d = v.date || v.due;
    if (!d) return;
    const st = CSB[v.status] || CSB.planned || {
      th: v.status || "",
      color: "#94A3B8"
    };
    const b = siteBase(v.siteId);
    b.who = techName(v.techId) || b.who;
    b.sub = "ล้างแผง" + (v.free ? " (ครั้งฟรีตามสัญญา)" : "");
    out.push(Object.assign({}, b, {
      bucket: "plan",
      key: "c-p-" + v.id,
      day: d,
      time: v.timeFrom || "",
      status: {
        th: st.th,
        color: st.color
      },
      prio: 1
    }));
    if (v.status === "done") out.push(Object.assign({}, b, {
      bucket: "done",
      key: "c-d-" + v.id,
      day: wsDayOf(v.doneAt) || d,
      time: wsTimeOf(v.doneAt) || v.timeFrom || "",
      status: {
        th: "ล้างแล้ว",
        color: "#10B981"
      },
      prio: 1
    }));
  });
  const VKB = window.OM_VISIT_KIND_BY || {};
  const vst = window.omVisitStatusOf || (() => ({
    th: "",
    color: "#94A3B8"
  }));
  (src.visits || []).forEach(v => {
    if (!v || !v.date) return;
    const kind = VKB[v.kind] || {
      th: "เข้าบริการ"
    };
    const st = vst(v.status);
    const b = siteBase(v.siteId, v.siteName);
    b.who = techName(v.team) || v.byName || b.who;
    b.sub = "ใบรายงานเข้าบริการ " + (v.no || "");
    out.push(Object.assign({}, b, {
      bucket: "done",
      key: "v-d-" + v.id,
      day: v.date,
      time: v.timeIn || "",
      status: {
        th: kind.th + (st.th ? " · " + st.th : ""),
        color: st.color
      },
      prio: 3
    }));
  });
  return out;
}
function wsSelect(items, range, type, kind, bucket) {
  const hit = [];
  (items || []).forEach(it => {
    if (it.kind !== kind || it.bucket !== bucket) return;
    if (type !== "all" && it.type !== type) return;
    if (!wsOverlaps(range, it.day, it.dayEnd)) return;
    hit.push(it);
  });
  hit.sort((a, b) => (b.prio || 0) - (a.prio || 0));
  const byT = new Map();
  hit.forEach(it => {
    const k = it.targetId;
    if (!byT.has(k)) byT.set(k, Object.assign({}, it, {
      n: 1
    }));else byT.get(k).n++;
  });
  const rows = Array.from(byT.values()).sort((a, b) => {
    const ka = a.day + " " + (a.time || "99:99"),
      kb = b.day + " " + (b.time || "99:99");
    return ka < kb ? -1 : ka > kb ? 1 : String(a.code).localeCompare(String(b.code));
  });
  return {
    rows,
    houses: rows.length,
    items: hit.length
  };
}
const wsCount = (items, range, type, kind, bucket) => wsSelect(items, range, type, kind, bucket).houses;
function wsWhen(it, range) {
  const multi = range.start !== range.end;
  const day = multi ? wsShort(it.day) + (it.dayEnd && it.dayEnd !== it.day && it.dayEnd > it.day ? "–" + wsShort(it.dayEnd) : "") : "";
  return [day, it.time].filter(Boolean).join(" ");
}
function wsRowText(it, range) {
  const parts = [];
  const when = wsWhen(it, range);
  if (when) parts.push(when);
  parts.push(((it.code ? it.code + " " : "") + it.name).trim() + " (" + wsTypeInfo(it.type).th + ")");
  if (it.province) parts.push(it.province);
  if (it.who) parts.push(it.who);
  if (it.sub) parts.push(it.sub);
  if (it.status && it.status.th) parts.push(it.status.th);
  const rep = it.reports ? it.reports.filter(d => d >= range.start && d <= range.end).length : 0;
  if (rep) parts.push("รายงานหน้างาน " + rep + " วัน");
  if (it.n > 1) parts.push("×" + it.n + " รายการ");
  let line = parts.join(" · ");
  if (it.note) line += " ⚠ " + it.note;
  return line;
}
function wsFullText(items, period, range, type) {
  const P = WS_PERIODS.find(p => p.key === period) || WS_PERIODS[0];
  const lines = ["📋 สรุปรายงาน" + P.title + " " + wsRangeLabel(period, range) + (type !== "all" ? " — " + wsTypeInfo(type).th : "")];
  WS_KINDS.forEach(k => {
    lines.push("• " + k.doneTh + " " + wsCount(items, range, type, k.key, "done") + " บ้าน · " + k.planTh + " " + wsCount(items, range, type, k.key, "plan") + " บ้าน");
  });
  if (type === "all") {
    lines.push("");
    lines.push("แยกประเภท (ทำแล้ว/นัดหมาย)");
    wsTypes().forEach(t => {
      lines.push("  " + t.th + ": " + WS_KINDS.map(k => k.th + " " + wsCount(items, range, t.key, k.key, "done") + "/" + wsCount(items, range, t.key, k.key, "plan")).join(" · "));
    });
  }
  WS_KINDS.forEach(k => {
    WS_BUCKETS.forEach(b => {
      const sel = wsSelect(items, range, type, k.key, b.key);
      if (!sel.rows.length) return;
      lines.push("");
      lines.push("【 " + (b.key === "done" ? k.doneTh : k.planTh) + " (" + sel.houses + " บ้าน) 】");
      sel.rows.forEach(it => lines.push("  • " + wsRowText(it, range)));
    });
  });
  return lines.join("\n");
}
function wsCopy(text, done) {
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done && done(true);
    } catch (e) {
      done && done(false);
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done && done(true), fallback);else fallback();
}
function wsDownload(text, name) {
  const blob = new Blob([text], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const WS_BTN = extra => Object.assign({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 13px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--text-2)",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap"
}, extra || {});
function WsPill({
  status
}) {
  if (!status || !status.th) return null;
  return React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: status.color,
      background: status.color + "1A",
      padding: "3px 8px",
      borderRadius: 99,
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, status.th);
}
function WsRow({
  it,
  range,
  onOpen
}) {
  const click = it.job && onOpen ? () => onOpen(it.job) : null;
  const when = wsWhen(it, range);
  const rep = it.reports ? it.reports.filter(d => d >= range.start && d <= range.end).length : 0;
  const meta = [it.province, it.who, it.sub].filter(Boolean).join(" · ");
  const T = wsTypeInfo(it.type);
  const Tag = click ? "button" : "div";
  return React.createElement(Tag, {
    onClick: click || undefined,
    title: click ? "เปิดใบงาน" : undefined,
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      width: "100%",
      textAlign: "left",
      padding: "10px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontFamily: "inherit",
      cursor: click ? "pointer" : "default",
      color: "inherit"
    },
    onMouseEnter: click ? e => {
      e.currentTarget.style.background = "var(--surface2)";
    } : undefined,
    onMouseLeave: click ? e => {
      e.currentTarget.style.background = "var(--surface)";
    } : undefined
  }, React.createElement("span", {
    style: {
      width: 3,
      alignSelf: "stretch",
      borderRadius: 99,
      background: T.color,
      flexShrink: 0
    }
  }), React.createElement("div", {
    style: {
      width: 64,
      flexShrink: 0,
      fontFamily: "var(--mono)",
      fontSize: 12,
      fontWeight: 600,
      color: when ? "var(--text-2)" : "var(--text-3)",
      lineHeight: 1.4,
      paddingTop: 1
    }
  }, when || "—"), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, it.code && React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, it.code), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, it.name), React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: T.color,
      background: T.color + "1A",
      padding: "2px 7px",
      borderRadius: 6
    }
  }, T.th), it.n > 1 && React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, "\xD7", it.n)), (meta || rep > 0) && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      marginTop: 3,
      lineHeight: 1.45
    }
  }, meta, rep > 0 && React.createElement("span", {
    style: {
      color: "#84CC16",
      fontWeight: 700
    }
  }, meta ? " · " : "", "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 ", rep, " \u0E27\u0E31\u0E19")), it.note && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-red-tx2)",
      marginTop: 3,
      lineHeight: 1.45
    }
  }, "\u26A0 ", it.note)), React.createElement(WsPill, {
    status: it.status
  }));
}
function WsList({
  title,
  color,
  sel,
  range,
  onOpen
}) {
  return React.createElement("div", {
    className: "pnl",
    style: {
      padding: 16
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 10
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: color,
      flexShrink: 0,
      alignSelf: "center"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 15,
      fontWeight: 700,
      color: sel.houses ? "var(--text-1)" : "var(--text-3)",
      letterSpacing: "-.02em"
    }
  }, sel.houses), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E49\u0E32\u0E19", sel.items > sel.houses ? " · " + sel.items + " รายการ" : "")), sel.rows.length === 0 ? React.createElement("div", {
    style: {
      padding: "14px 0 6px",
      fontSize: 12.5,
      color: "var(--text-3)",
      textAlign: "center"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, sel.rows.map(it => React.createElement(WsRow, {
    key: it.key,
    it: it,
    range: range,
    onOpen: onOpen
  }))));
}
function WsMatrix({
  items,
  range,
  type,
  onType
}) {
  const cols = [{
    key: "all",
    th: "รวม",
    color: "var(--primary)"
  }].concat(wsTypes());
  return React.createElement("div", {
    className: "pnl",
    style: {
      padding: 0,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    className: "pnl-hd",
    style: {
      padding: "14px 18px 10px"
    }
  }, React.createElement("span", {
    className: "t"
  }, "\u0E23\u0E27\u0E21 \xB7 \u0E41\u0E22\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19"), React.createElement("span", {
    className: "s"
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E49\u0E32\u0E19 (\u0E44\u0E0B\u0E15\u0E4C\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33) \xB7 \u0E01\u0E14\u0E2B\u0E31\u0E27\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E01\u0E23\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07")), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    className: "ws-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null), cols.map(c => React.createElement("th", {
    key: c.key,
    className: type === c.key ? "hi" : "",
    onClick: () => onType(c.key),
    style: {
      cursor: "pointer"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: c.color
    }
  }), c.th))))), React.createElement("tbody", null, WS_KINDS.map(k => WS_BUCKETS.map((b, bi) => React.createElement("tr", {
    key: k.key + b.key
  }, React.createElement("td", {
    style: {
      fontWeight: bi ? 500 : 700,
      color: bi ? "var(--text-2)" : "var(--text-1)",
      paddingLeft: 18
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: bi ? "transparent" : k.color,
      flexShrink: 0
    }
  }), bi ? k.planTh : k.doneTh)), cols.map(c => {
    const n = wsCount(items, range, c.key, k.key, b.key);
    return React.createElement("td", {
      key: c.key,
      className: "num" + (n ? "" : " zero") + (type === c.key ? " hi" : "")
    }, n);
  }))))))));
}
function WsBreakdown({
  items,
  period,
  range,
  type
}) {
  const subs = wsSubRanges(period, range);
  if (!subs.length) return null;
  const today = wsToday();
  return React.createElement("div", {
    className: "pnl",
    style: {
      padding: 0,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    className: "pnl-hd",
    style: {
      padding: "14px 18px 10px"
    }
  }, React.createElement("span", {
    className: "t"
  }, period === "week" ? "รายวันในสัปดาห์" : "รายสัปดาห์ในเดือน"), React.createElement("span", {
    className: "s"
  }, type === "all" ? "ทุกประเภท" : wsTypeInfo(type).th, " \xB7 \u0E17\u0E33\u0E41\u0E25\u0E49\u0E27 / \u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22")), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    className: "ws-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null), WS_KINDS.map(k => React.createElement("th", {
    key: k.key,
    colSpan: 2
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: k.color
    }
  }), k.th)))), React.createElement("tr", null, React.createElement("th", null), WS_KINDS.map(k => WS_BUCKETS.map(b => React.createElement("th", {
    key: k.key + b.key,
    style: {
      fontWeight: 600,
      color: "var(--text-3)",
      paddingTop: 0
    }
  }, b.th))))), React.createElement("tbody", null, subs.map(r => {
    const isToday = today >= r.start && today <= r.end;
    return React.createElement("tr", {
      key: r.start,
      style: isToday ? {
        background: "var(--primary-soft)"
      } : undefined
    }, React.createElement("td", {
      style: {
        paddingLeft: 18,
        fontWeight: isToday ? 800 : 600,
        color: isToday ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, r.th, isToday ? " · วันนี้" : ""), WS_KINDS.map(k => WS_BUCKETS.map(b => {
      const n = wsCount(items, r, type, k.key, b.key);
      return React.createElement("td", {
        key: k.key + b.key,
        className: "num" + (n ? "" : " zero")
      }, n);
    })));
  })))));
}
const wsNoStore = () => ({});
function SummaryView({
  jobs,
  appts,
  leads,
  onOpen
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [period, setPeriodRaw] = React.useState(() => {
    try {
      const v = localStorage.getItem("pg-ws-period");
      return WS_PERIODS.some(p => p.key === v) ? v : "day";
    } catch (e) {
      return "day";
    }
  });
  const setPeriod = p => {
    try {
      localStorage.setItem("pg-ws-period", p);
    } catch (e) {}
    setPeriodRaw(p);
  };
  const [anchor, setAnchor] = React.useState(wsToday);
  const [type, setType] = React.useState("all");
  const [copied, setCopied] = React.useState(false);
  const [showText, setShowText] = React.useState(false);
  const omSites = (window.useOmSites || wsNoStore)();
  const omClean = (window.useOmCleanVisits || wsNoStore)();
  const omTicket = (window.useOmTickets || wsNoStore)();
  const omVisit = (window.useOmVisits || wsNoStore)();
  const daily = (window.useDailyAll || wsNoStore)();
  const items = React.useMemo(() => wsBuildItems({
    jobs: jobs,
    appts: appts,
    leads: leads,
    sites: omSites.sites || [],
    cleanAll: omClean.all || [],
    tickets: omTicket.tickets || [],
    visits: omVisit.visits || [],
    dailyAll: daily.all || {}
  }), [jobs, appts, leads, omSites.sites, omClean.all, omTicket.tickets, omVisit.visits, daily.all]);
  const range = React.useMemo(() => wsRange(period, anchor), [period, anchor]);
  const P = WS_PERIODS.find(p => p.key === period) || WS_PERIODS[0];
  const isCurrent = wsToday() >= range.start && wsToday() <= range.end;
  const fullText = React.useMemo(() => wsFullText(items, period, range, type), [items, period, range, type]);
  const copyAll = () => wsCopy(fullText, ok => {
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  });
  const navBtn = extra => Object.assign({
    width: 34,
    height: 34,
    borderRadius: 9,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    color: "var(--text-2)",
    flexShrink: 0
  }, extra || {});
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    className: "pnl",
    style: {
      padding: isMobile ? 14 : "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement(Segmented, {
    value: period,
    onChange: setPeriod,
    options: WS_PERIODS.map(p => ({
      value: p.key,
      label: p.th
    }))
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("button", {
    onClick: () => setAnchor(wsShift(period, anchor, -1)),
    title: "\u0E0A\u0E48\u0E27\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    "aria-label": "\u0E0A\u0E48\u0E27\u0E07\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    style: navBtn()
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "var(--text-2)",
    style: {
      transform: "rotate(180deg)"
    }
  })), React.createElement("button", {
    onClick: () => setAnchor(wsShift(period, anchor, 1)),
    title: "\u0E0A\u0E48\u0E27\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B",
    "aria-label": "\u0E0A\u0E48\u0E27\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B",
    style: navBtn()
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "var(--text-2)"
  })), !isCurrent && React.createElement("button", {
    onClick: () => setAnchor(wsToday()),
    style: WS_BTN({
      padding: "7px 11px",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      border: "1px solid var(--primary)"
    })
  }, "\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49")), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E1B\u0E17\u0E35\u0E48\u0E27\u0E31\u0E19", React.createElement("input", {
    type: "date",
    value: anchor,
    onChange: e => {
      if (e.target.value) setAnchor(e.target.value);
    },
    style: {
      padding: "6px 9px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5
    }
  })), React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setShowText(v => !v),
    style: WS_BTN()
  }, React.createElement(Icon, {
    name: "eye",
    size: 15,
    color: "var(--text-2)"
  }), " ", showText ? "ซ่อนข้อความ" : "ดูข้อความ"), !isMobile && React.createElement("button", {
    onClick: () => wsDownload(fullText, "สรุปรายงาน-" + range.start + (range.end !== range.start ? "_" + range.end : "") + ".txt"),
    style: WS_BTN()
  }, React.createElement(Icon, {
    name: "download",
    size: 15,
    color: "var(--text-2)"
  }), " .txt"), React.createElement("button", {
    onClick: copyAll,
    style: WS_BTN({
      background: copied ? "var(--primary-dark)" : "var(--primary)",
      color: "#fff",
      border: "none"
    })
  }, React.createElement(Icon, {
    name: copied ? "check" : "file",
    size: 15,
    color: "#fff"
  }), " ", copied ? "คัดลอกแล้ว ✓" : "คัดลอกส่ง LINE"))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E23\u0E38\u0E1B\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19", P.title), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: isMobile ? 20 : 24,
      fontWeight: 700,
      color: "var(--text-1)",
      letterSpacing: "-.02em"
    }
  }, wsRangeLabel(period, range)), isCurrent && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      padding: "2px 8px",
      borderRadius: 99
    }
  }, period === "day" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, [{
    key: "all",
    th: "รวมทุกประเภท",
    color: "var(--primary)"
  }].concat(wsTypes()).map(t => {
    const on = type === t.key;
    return React.createElement("button", {
      key: t.key,
      onClick: () => setType(t.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 13px",
        borderRadius: 99,
        fontFamily: "inherit",
        border: "1px solid " + (on ? t.color : "transparent"),
        background: on ? t.color + "18" : "var(--surface2)",
        color: on ? t.color : "var(--text-2)",
        fontSize: 12.5,
        fontWeight: on ? 800 : 600,
        cursor: "pointer"
      }
    }, React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: t.color
      }
    }), t.th);
  }))), showText && React.createElement("textarea", {
    readOnly: true,
    value: fullText,
    onFocus: e => e.target.select(),
    style: {
      width: "100%",
      minHeight: 240,
      padding: 14,
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      boxSizing: "border-box",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontSize: 12.5,
      lineHeight: 1.6,
      resize: "vertical",
      outline: "none"
    }
  }), React.createElement("div", {
    className: "ws-kinds"
  }, WS_KINDS.map(k => React.createElement("div", {
    key: k.key,
    className: "pnl",
    style: {
      padding: isMobile ? 14 : 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 9,
      background: k.color + "1A",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: k.icon,
    size: 15,
    color: k.color
  })), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, k.th), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginLeft: "auto"
    }
  }, type === "all" ? "ทุกประเภท" : wsTypeInfo(type).th)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 0,
      marginTop: 14
    }
  }, WS_BUCKETS.map((b, i) => {
    const n = wsCount(items, range, type, k.key, b.key);
    return React.createElement("div", {
      key: b.key,
      style: {
        flex: 1,
        minWidth: 0,
        padding: i ? "0 0 0 16px" : "0 16px 0 0",
        borderLeft: i ? "1px solid var(--border)" : "none"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 650,
        color: "var(--text-2)"
      }
    }, b.key === "done" ? k.doneTh : k.planTh), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 5,
        marginTop: 6
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: isMobile ? 30 : 36,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-.035em",
        fontVariantNumeric: "tabular-nums",
        color: n ? "var(--text-1)" : "var(--text-3)"
      }
    }, n), React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-3)"
      }
    }, "\u0E1A\u0E49\u0E32\u0E19")));
  }))))), React.createElement(WsMatrix, {
    items: items,
    range: range,
    type: type,
    onType: setType
  }), React.createElement(WsBreakdown, {
    items: items,
    period: period,
    range: range,
    type: type
  }), WS_KINDS.map(k => React.createElement("div", {
    key: k.key,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "2px 2px",
      marginTop: 4
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: k.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: ".03em",
      color: k.color
    }
  }, k.th), React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border)",
      marginLeft: 4
    }
  })), React.createElement("div", {
    className: "ws-lists"
  }, WS_BUCKETS.map(b => React.createElement(WsList, {
    key: b.key,
    title: b.key === "done" ? k.doneTh : k.planTh,
    color: b.color,
    sel: wsSelect(items, range, type, k.key, b.key),
    range: range,
    onOpen: onOpen
  }))))));
}
Object.assign(window, {
  SummaryView,
  wsBuildItems,
  wsSelect,
  wsCount,
  wsRange,
  wsShift,
  wsSubRanges,
  wsRangeLabel,
  wsFullText,
  wsTypeOf,
  WS_KINDS,
  WS_PERIODS
});