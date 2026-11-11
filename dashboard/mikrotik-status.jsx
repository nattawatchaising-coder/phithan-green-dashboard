/* ============================================================
   ไซต์ MikroTik เฟส 2 — สถานะไซต์ (อ่านอย่างเดียว) · ยืนยันใบรับรอง · ดู log · รีบูต
   docs/mikrotik.md · ข้อมูลมาจาก mt-agent บน VPS (tools/mt-agent/agent.mjs) ผ่าน /api/mikrotik/site?agent=1 → mtStatus/{N}

   หน้าเว็บอ่าน mtStatus/ อย่างเดียว · กดยืนยันใบรับรอง/รีบูต/ดู log ผ่าน /api/mikrotik/site (เซิร์ฟเวอร์ตรวจแอดมินซ้ำ)
   ⚠ ห้ามเพิ่มปุ่มแก้ IP / firewall / WireGuard ของเราเตอร์ (ผู้ใช้กำหนด)
   ============================================================ */

const MT_ONLINE_HS_S = 180;      // handshake WireGuard ล่าสุดไม่เกิน 3 นาที = VPN ติด (keepalive 25 วิ)
const MT_STALE_MS = 5 * 60e3;    // agent ไม่ส่งสถานะเกิน 5 นาที = ข้อมูลเก่า

function useMtStatus() {
  const [val, setVal] = React.useState(null);
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("mtStatus");
    const h = ref.on("value", (s) => setVal(s.val() || {}), () => setVal({}));
    return () => ref.off("value", h);
  }, []);
  return val;
}
function useMtNow(ms) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms || 15e3); return () => clearInterval(t); }, [ms]);
  return now;
}

function mtAgo(ms) {
  if (ms == null || !isFinite(ms)) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return s + " วิที่แล้ว";
  if (s < 3600) return Math.round(s / 60) + " นาทีที่แล้ว";
  if (s < 86400) return Math.round(s / 3600) + " ชม.ที่แล้ว";
  return Math.round(s / 86400) + " วันที่แล้ว";
}
const mtMB = (b) => (b == null ? "—" : (b / 1048576).toFixed(0) + " MB");
/* RouterOS uptime "1w2d3h4m5s" → ไทยสั้น */
function mtUptime(u) {
  if (!u) return "—";
  const m = {}; String(u).replace(/(\d+)([wdhms])/g, (_, n, k) => { m[k] = Number(n); return ""; });
  const d = (m.w || 0) * 7 + (m.d || 0);
  return d ? d + " วัน " + (m.h || 0) + " ชม." : (m.h || 0) + " ชม. " + (m.m || 0) + " นาที";
}

/* สถานะรวมของไซต์ → { label, tone, why } */
function mtState(site, st, now) {
  if (!st || !st.at) return { label: "ยังไม่มีข้อมูล", tone: "gray", why: "agent ยังไม่เคยรายงานไซต์นี้" };
  if (now - Date.parse(st.at) > MT_STALE_MS) return { label: "ข้อมูลเก่า", tone: "gray", why: "agent ไม่ได้ส่งสถานะมา " + mtAgo(now - Date.parse(st.at)) };
  const hs = st.wg && st.wg.hs ? st.wg.hs * 1000 : 0;
  if (!hs || now - hs > MT_ONLINE_HS_S * 1000) return { label: "VPN หลุด", tone: "red", why: hs ? "handshake ล่าสุด " + mtAgo(now - hs) : "ยังไม่เคยต่อ VPN" };
  if (st.tls && st.tls.mismatch) return { label: "ใบรับรองไม่ตรง", tone: "red", why: "hEX เปลี่ยนใบรับรอง หรือมีเครื่องอื่นมาแทน — ตรวจก่อนยืนยันใหม่" };
  if (!site.fp) return { label: "รอยืนยันใบรับรอง", tone: "amber", why: "VPN ติดแล้ว · ยืนยัน fingerprint เพื่อให้ agent อ่านข้อมูลเราเตอร์" };
  if (st.rest && !st.rest.ok) return { label: "อ่านเราเตอร์ไม่ได้", tone: "amber", why: st.rest.error || "" };
  return { label: "ออนไลน์", tone: "green", why: "" };
}
const MT_TONE = {
  green: { bg: "var(--tint-ok-bg)", tx: "var(--tint-ok-tx)" },
  amber: { bg: "var(--tint-amber-bg)", tx: "var(--tint-amber-tx)" },
  red: { bg: "var(--tint-red-bg)", tx: "var(--tint-red-tx)" },
  gray: { bg: "var(--surface2)", tx: "var(--text-3)" },
};
function MtPill({ state }) {
  const t = MT_TONE[state.tone] || MT_TONE.gray;
  return <span title={state.why} style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: "var(--r-pill)", background: t.bg, color: t.tx, whiteSpace: "nowrap" }}>{state.label}</span>;
}
function MtDot({ ok, label, title }) {
  const c = ok == null ? "var(--text-3)" : ok ? "var(--tint-ok-tx)" : "var(--tint-red-tx)";
  return (
    <span title={title} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap" }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: c, flex: "none" }} />{label}
    </span>
  );
}
const mtWan = (st) => { const a = ((st && st.addrs) || []).find((x) => x.iface === "ether1"); return a ? a.address : "—"; };

/* ---------- ภาพรวมทุกไซต์ (บนสุดของหน้า) ---------- */
function MtStatusPanel({ sites, status }) {
  const now = useMtNow(15e3);
  const ag = status && status._agent;
  const agAt = ag ? Date.parse(ag.at || ag.seen || "") : NaN;
  const agentOk = isFinite(agAt) && now - agAt < MT_STALE_MS;
  const counts = { green: 0, amber: 0, red: 0, gray: 0 };
  const rows = sites.map((s) => { const st = status && status[s.n]; const k = mtState(s, st, now); counts[k.tone]++; return { s, st, k }; });
  const th = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "6px 8px", whiteSpace: "nowrap" };
  const td = { fontSize: 12.5, padding: "8px", whiteSpace: "nowrap" };
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>สถานะไซต์</div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
          {status == null ? "กำลังโหลด…" : !ag ? "ยังไม่ได้ติดตั้ง agent บน VPS (คู่มือ ข้อ 10)"
            : agentOk ? "agent บน VPS ติดต่อล่าสุด " + mtAgo(now - agAt) : "⚠ agent บน VPS เงียบไป " + mtAgo(now - agAt) + " — ดู journalctl -u mt-agent"}
        </div>
        <div style={{ flex: 1 }} />
        {sites.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {counts.green > 0 && <MtPill state={{ tone: "green", label: "ออนไลน์ " + counts.green }} />}
            {counts.amber > 0 && <MtPill state={{ tone: "amber", label: "ต้องดู " + counts.amber }} />}
            {counts.red > 0 && <MtPill state={{ tone: "red", label: "มีปัญหา " + counts.red }} />}
            {counts.gray > 0 && <MtPill state={{ tone: "gray", label: "ไม่มีข้อมูล " + counts.gray }} />}
          </div>
        )}
      </div>
      {sites.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>ไซต์</th><th style={th}>สถานะ</th><th style={th}>VPN</th><th style={th}>เปิดเครื่องมา</th>
              <th style={th}>CPU</th><th style={th}>IP โรงงาน (ether1)</th><th style={th}>SmartLogger</th><th style={th}>มิเตอร์</th>
            </tr></thead>
            <tbody>
              {rows.map(({ s, st, k }) => {
                const hs = st && st.wg && st.wg.hs ? now - st.wg.hs * 1000 : null;
                return (
                  <tr key={s.n}>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)", fontWeight: 700 })}>{mtIdent(s)}</td>
                    <td style={td} title={k.why}><MtPill state={k} /></td>
                    <td style={td}>{hs == null ? "—" : mtAgo(hs)}</td>
                    <td style={td}>{mtUptime(st && st.res && st.res.uptime)}</td>
                    <td style={td}>{st && st.res && st.res.cpu != null ? st.res.cpu + "%" : "—"}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{mtWan(st)}</td>
                    <td style={td}><MtDot ok={st && st.sl ? !!(st.sl.ping && st.sl.ping.ok) || !!(st.sl.web && st.sl.web.ok) : null} label={st && st.sl ? (st.sl.web && st.sl.web.ok ? "ตอบ" : st.sl.ping && st.sl.ping.ok ? "ping ได้" : "ไม่ตอบ") : "—"} /></td>
                    <td style={td}><MtDot ok={st && st.meter ? !!(st.meter.modbus && st.meter.modbus.ok) : null} label={st && st.meter ? (st.meter.modbus && st.meter.modbus.ok ? "Modbus ตอบ" : "ไม่ตอบ") : "—"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- รอผลคำสั่ง (agent ทำในรอบถัดไป ~30 วิ) ---------- */
function useMtCmd() {
  const [cmd, setCmd] = React.useState(null);   // { type, id, state, error, data, note }
  const alive = React.useRef(true);
  React.useEffect(() => () => { alive.current = false; }, []);
  const start = async (n, type) => {
    setCmd({ type, state: "sending" });
    try {
      const r = await mtCall({ action: "cmd", n, type });
      setCmd({ type, id: r.id, state: "pending" });
      const t0 = Date.now();
      while (alive.current && Date.now() - t0 < 12 * 60e3) {
        await new Promise((ok) => setTimeout(ok, 3000));
        const g = await mtCall({ action: "cmd-get", id: r.id }).catch(() => null);
        if (!g || !alive.current) continue;
        setCmd(Object.assign({ type, id: r.id }, g.cmd));
        if (["done", "error", "expired"].includes(g.cmd.state)) return;
      }
    } catch (e) { if (alive.current) setCmd({ type, state: "error", error: String(e.message || e) }); }
  };
  return [cmd, start, () => setCmd(null)];
}
const MT_CMD_TXT = { sending: "กำลังส่งคำสั่ง…", pending: "รอ agent หยิบคำสั่ง (ไม่เกิน ~30 วิ)…", sent: "agent กำลังทำ…", done: "เสร็จแล้ว", error: "ไม่สำเร็จ", expired: "หมดเวลา — agent ไม่ได้หยิบคำสั่งภายใน 10 นาที" };

/* ---------- ส่วนสถานะในการ์ดไซต์ ---------- */
function MtSiteLive({ s, st, isAdmin }) {
  const now = useMtNow(15e3);
  const k = mtState(s, st, now);
  const [cmd, startCmd, clearCmd] = useMtCmd();
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [fpIn, setFpIn] = React.useState("");
  const seen = (st && st.tls && st.tls.fp) || "";
  const pin = async (fp, mismatch) => {
    const ok = await window.askConfirm({
      title: (mismatch ? "เปลี่ยนใบรับรองที่ยืนยันของ " : "ยืนยันใบรับรองของ ") + mtIdent(s) + "?",
      body: "เทียบกับบรรทัด \"cert fingerprint\" ท้ายสคริปต์ตอนตั้งค่า hEX (หรือคำสั่ง /certificate print detail where name=pg-https บน hEX) ต้องตรงทุกตัว:\n" + fp +
        (mismatch ? "\n\n⚠ ใบรับรองเปลี่ยนจากที่เคยยืนยัน — ปกติจะเกิดเมื่อรีเซ็ต/เปลี่ยน hEX เท่านั้น ถ้าไม่ได้ทำ อย่ายืนยัน" : ""),
      ok: "ยืนยัน", danger: !!mismatch, icon: mismatch ? "alert" : "shield" });
    if (!ok) return;
    setBusy(true); setErr("");
    try { await mtCall({ action: "pin-fp", n: s.n, fp }); setFpIn(""); } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const reboot = async () => {
    const ok = await window.askConfirm({ title: "รีบูต " + mtIdent(s) + "?",
      body: "เราเตอร์จะดับประมาณ 1–2 นาที ระหว่างนั้น SmartLogger และมิเตอร์ของไซต์นี้ติดต่อไม่ได้ · ข้อมูลในเราเตอร์ไม่หาย",
      ok: "รีบูต", danger: true, icon: "alert" });
    if (ok) startCmd(s.n, "reboot");
  };
  const res = (st && st.res) || {};
  const ifs = ((st && st.ifaces) || []).filter((x) => /^ether|^wg-pg$/.test(x.name));
  const running = cmd && !["done", "error", "expired"].includes(cmd.state);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "10px 12px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <MtPill state={k} />
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>{k.why}</span>
        <div style={{ flex: 1 }} />
        {st && st.at && <span style={{ fontSize: 11, color: "var(--text-3)" }}>เช็กล่าสุด {mtAgo(now - Date.parse(st.at))}</span>}
      </div>

      {res.version && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text-2)" }}>
          <span>{res.board} · RouterOS {res.version}</span>
          <span>เปิดเครื่องมา {mtUptime(res.uptime)}</span>
          <span>CPU {res.cpu}%</span>
          <span>RAM ว่าง {mtMB(res.mem_free)} / {mtMB(res.mem_total)}</span>
          <span>IP โรงงาน <b style={{ fontFamily: "var(--mono)" }}>{mtWan(st)}</b></span>
        </div>
      )}
      {st && (st.sl || ifs.length > 0) && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {ifs.map((x) => <MtDot key={x.name} ok={x.disabled ? null : x.running} label={x.name} title={x.disabled ? "ปิดใช้" : x.running ? "มีสายเสียบ/ทำงาน" : "ไม่มีสาย"} />)}
          {st.sl && <MtDot ok={!!(st.sl.ping && st.sl.ping.ok) || !!(st.sl.web && st.sl.web.ok)} label={"SmartLogger .10" + (st.sl.ping && st.sl.ping.ok && st.sl.ping.ms != null ? " (" + st.sl.ping.ms + " ms)" : "")} />}
          {st.meter && <MtDot ok={!!(st.meter.modbus && st.meter.modbus.ok)} label="มิเตอร์ .20 Modbus" />}
        </div>
      )}

      {/* ยืนยันใบรับรอง (pin) — ยังไม่ยืนยัน agent ไม่ส่งรหัสเข้าเราเตอร์ */}
      {isAdmin && (!s.fp || (st && st.tls && st.tls.mismatch)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{s.fp ? "ใบรับรองที่ agent เห็นไม่ตรงกับที่ยืนยันไว้" : "ยืนยันใบรับรอง https ของ hEX"}</div>
          {seen ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code style={{ fontSize: 11, wordBreak: "break-all", flex: "1 1 300px" }}>{seen}</code>
              <button className={s.fp ? "btn btn-dngr" : "btn btn-pri"} disabled={busy} onClick={() => pin(seen, !!s.fp)}>{s.fp ? "ใช้ใบใหม่นี้" : "ตรงกับที่จดไว้ — ยืนยัน"}</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>agent ยังไม่เห็นใบรับรอง (VPN ยังไม่ติด) — หรือวาง fingerprint จากบรรทัดท้ายสคริปต์เองได้:</div>
          )}
          {!seen && (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={fpIn} onChange={(e) => setFpIn(e.target.value)} placeholder="cert fingerprint 64 ตัว" spellCheck={false}
                style={Object.assign({}, mtField, { fontFamily: "var(--mono)", fontSize: 11.5, background: "var(--surface)" })} />
              <button className="btn" disabled={busy || !/^[0-9a-fA-F:\s]{64,}$/.test(fpIn.trim())} onClick={() => pin(fpIn.replace(/[:\s]/g, "").toLowerCase(), false)}>ยืนยัน</button>
            </div>
          )}
        </div>
      )}

      {isAdmin && s.fp && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-sm" disabled={running} onClick={() => startCmd(s.n, "log")}>ดู log ล่าสุด</button>
          <button className="btn btn-sm btn-dngr" disabled={running} onClick={reboot}>รีบูตเราเตอร์</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--text-3)" }} title={s.fp}>ใบรับรอง {s.fp.slice(0, 8)}… ✓</span>
          <button className="btn btn-sm btn-soft" disabled={busy} onClick={async () => {
            if (await window.askConfirm({ title: "ยกเลิกการยืนยันใบรับรอง?", body: "agent จะหยุดอ่านข้อมูลเราเตอร์ไซต์นี้จนกว่าจะยืนยันใหม่", ok: "ยกเลิกยืนยัน", icon: "alert" }))
              { setBusy(true); await mtCall({ action: "pin-fp", n: s.n, fp: "" }).catch((e) => setErr(String(e.message || e))); setBusy(false); }
          }}>ยกเลิกยืนยัน</button>
        </div>
      )}
      {cmd && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, fontWeight: 600,
            color: cmd.state === "done" ? "var(--tint-ok-tx)" : ["error", "expired"].includes(cmd.state) ? "var(--tint-red-tx)" : "var(--text-2)" }}>
            {(cmd.type === "reboot" ? "รีบูต: " : "log: ") + (MT_CMD_TXT[cmd.state] || cmd.state)}
            {cmd.error ? " — " + cmd.error : cmd.note ? " — " + cmd.note : ""}
            <div style={{ flex: 1 }} />
            {!running && <button className="btn btn-sm btn-soft" onClick={clearCmd}>ปิด</button>}
          </div>
          {cmd.type === "log" && cmd.state === "done" && (
            <div style={{ maxHeight: 320, overflow: "auto", background: "var(--surface)", borderRadius: "var(--r-tile)", padding: "8px 10px", fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.55 }}>
              {(cmd.data || []).slice().reverse().map((l, i) => (
                <div key={i} style={{ color: /error|critical/.test(l.topics) ? "var(--tint-red-tx)" : /warning/.test(l.topics) ? "var(--tint-amber-tx)" : "var(--text-1)" }}>
                  <span style={{ color: "var(--text-3)" }}>{l.time} </span><span style={{ color: "var(--text-3)" }}>[{l.topics}] </span>{l.message}
                </div>
              ))}
              {!(cmd.data || []).length && <div style={{ color: "var(--text-3)" }}>ไม่มี log</div>}
            </div>
          )}
        </div>
      )}
      {err && <div style={mtErrBox}>{err}</div>}
    </div>
  );
}

window.useMtStatus = useMtStatus;
window.mtState = mtState;
window.MtPill = MtPill;
window.MtStatusPanel = MtStatusPanel;
window.MtSiteLive = MtSiteLive;
