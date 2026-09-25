/* ══════════════════════════════════════════════════
   สมุดตรวจรับและส่งมอบระบบ — หน้าจอกรอก

   กรอกทีละนิดระหว่างทำงานได้ เป็นเหตุผลทั้งหมดที่ทำฟีเจอร์นี้ ⇒ ไม่มีปุ่ม "บันทึก" ก้อนใหญ่
   ทุกช่องบันทึกตอนออกจากช่อง ทุกการติ๊กบันทึกทันที ปิดหน้าไปกลางทางแล้วกลับมาต่อได้

   ⚠ ช่องกรอก (PmField) กับแถวเช็คลิสต์ (PmDocRow) ประกาศที่ระดับโมดูล ไม่ใช่ในตัว modal
     ถ้าประกาศข้างใน React จะถือเป็นคอมโพเนนต์ตัวใหม่ทุกครั้งที่เรนเดอร์ แล้วสร้าง input ใหม่
     ⇒ เคอร์เซอร์เด้งออกจากช่องทุกตัวอักษรที่พิมพ์ (กับดักเดียวกับที่ inspect.jsx เขียนเตือนไว้)

   ⚠ ใช้ window.askConfirm ไม่ใช่ confirm() ของเบราว์เซอร์ (ดูเหตุผลใน confirm.jsx)

   ชื่อระดับบนสุดทุกตัวในไฟล์นี้ขึ้นต้นด้วย Pm / pm / PM_
   ══════════════════════════════════════════════════ */

const PM_STATE_COLOR = { na: "#94A3B8", empty: "#94A3B8", partial: "#F59E0B", done: "var(--tint-green-tx)" };

const pmInputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, boxSizing: "border-box",
};

/* ── หนึ่งช่องกรอกของแผ่น Summary ──
   หัวข้ออังกฤษ/ไทยคู่กันตามต้นฉบับ · บันทึกตอนออกจากช่อง ไม่ใช่ทุกตัวอักษร
   ป้าย "จาก BOQ" ฯลฯ แปลว่าค่านี้ระบบเดาให้ ยังไม่มีใครยืนยัน — ความหมายคือ "ช่วยตรวจที" */
function PmField({ field, value, prefilled, onCommit }) {
  const [v, setV] = React.useState(value == null ? "" : String(value));
  const ref = React.useRef(value);
  /* ค่าจากข้างนอกเปลี่ยน (คนอื่นแก้พร้อมกัน หรือ BOQ อัปเดต) — รับมาเฉพาะตอนไม่ได้พิมพ์ค้างอยู่ */
  React.useEffect(() => {
    if (String(ref.current == null ? "" : ref.current) !== String(value == null ? "" : value)) {
      ref.current = value; setV(value == null ? "" : String(value));
    }
  }, [value]);

  const commit = () => { ref.current = v; onCommit(field.key, v); };
  const label = (
    <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>
      {field.en}
      <span style={{ fontWeight: 400, color: "var(--text-3)" }}> ({field.th})</span>
      {field.unit ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · {field.unit}</span> : null}
      {field.req ? <span style={{ color: "#DC2626" }}> *</span> : null}
      {prefilled && String(v).trim() !== "" ? (
        <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 99, background: "var(--primary-soft)",
          color: "var(--primary-dark)", fontSize: 10, fontWeight: 700 }}>
          {window.PM_FROM_LABEL[field.from] || "เติมให้"}
        </span>
      ) : null}
    </label>
  );

  return (
    <div style={{ marginBottom: 11 }}>
      {label}
      {field.type === "area" ? (
        <textarea value={v} rows={2} onChange={(e) => setV(e.target.value)} onBlur={commit}
          style={Object.assign({}, pmInputStyle, { resize: "vertical" })} />
      ) : field.type === "select" ? (
        <select value={v} onChange={(e) => { setV(e.target.value); ref.current = e.target.value; onCommit(field.key, e.target.value); }}
          style={pmInputStyle}>
          <option value="">— ยังไม่เลือก —</option>
          {(field.opts || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={v} type={field.type === "date" ? "date" : field.type === "num" ? "number" : "text"}
          placeholder={field.ph || ""} inputMode={field.type === "num" ? "decimal" : undefined}
          onChange={(e) => setV(e.target.value)} onBlur={commit} style={pmInputStyle} />
      )}
    </div>
  );
}

/* ── หนึ่งบรรทัดของรายการเอกสาร ──
   สามสถานะ: ยังไม่ตอบ / มี (√) / ไม่เกี่ยวข้อง (–)
   "ไม่เกี่ยวข้อง" ไม่ใช่ทางลัด — ต้นฉบับกา "-" ให้เอกสารที่ไซต์นั้นไม่มีจริง เช่นไซต์ที่ไม่มีระบบล้างแผง
   ทั้งสองอย่างนับว่า "ตอบแล้ว" เท่ากัน */
function PmDocRow({ item, job, value, onSet }) {
  const lb = window.pmDocLabel(item, job);
  const btn = (val, text, color) => {
    const on = value === val;
    return (
      <button onClick={() => onSet(item.key, on ? null : val)}
        style={{ width: 38, height: 32, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 800,
          border: "1px solid " + (on ? color : "var(--border-strong)"),
          background: on ? color : "var(--surface)", color: on ? "#fff" : "var(--text-3)" }}>
        {text}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>{lb.en}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{lb.th}</span>
      </span>
      {btn("y", "√", "#16A34A")}
      {btn("n", "–", "#64748B")}
    </div>
  );
}

/* ── หนึ่งช่องในตาราง ──
   แยกเป็นคอมโพเนนต์ระดับโมดูลด้วยเหตุผลเดียวกับ PmField — ประกาศข้างใน modal เมื่อไร
   เคอร์เซอร์เด้งออกทุกตัวอักษรที่พิมพ์ ซึ่งบนตารางที่มีสามสิบช่องคือใช้งานไม่ได้เลย */
function PmCell({ col, value, onCommit, mobile }) {
  const [v, setV] = React.useState(value == null ? "" : String(value));
  const ref = React.useRef(value);
  React.useEffect(() => {
    if (String(ref.current == null ? "" : ref.current) !== String(value == null ? "" : value)) {
      ref.current = value; setV(value == null ? "" : String(value));
    }
  }, [value]);
  const commit = () => { ref.current = v; onCommit(col.key, v); };
  const st = Object.assign({}, pmInputStyle, { padding: mobile ? "9px 11px" : "6px 8px", fontSize: mobile ? 13.5 : 12.5, borderRadius: 8 });
  if (col.type === "select") {
    return (
      <select value={v} style={st}
        onChange={(e) => { setV(e.target.value); ref.current = e.target.value; onCommit(col.key, e.target.value); }}>
        <option value="">—</option>
        {(col.opts || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  return (
    <input value={v} type={col.type === "num" ? "number" : "text"} inputMode={col.type === "num" ? "decimal" : undefined}
      onChange={(e) => setV(e.target.value)} onBlur={commit} style={st} />
  );
}

/* ── หนึ่งแถวของตาราง ──
   จอกว้างเป็นแถวของตารางจริง จอแคบเป็นการ์ดช่องละบรรทัด
   ไม่ใช้ตารางเลื่อนแนวนอนบนมือถือ เพราะ C1 มีเก้าคอลัมน์ ช่างจะต้องเลื่อนซ้ายขวาทุกแถว */
function PmTableRow({ table, row, no, mobile, onSet, onRemove }) {
  const cols = table.cols || [];
  const set = (k, v) => onSet(row.id, k, v);
  /* แถวที่กรอกช่องบังคับยังไม่ครบ ไม่มีผลตรวจ — ห้ามขึ้นป้าย NG
     กดสร้างแถวทีเดียวได้แปดแถวพร้อมชื่อจุดวัด ถ้าตัดสินจากเท่านั้น แปดแถวจะแดงทันทีทั้งที่ยังไม่มีใครหยิบมิเตอร์ไปวัด
     ซึ่งอ่านว่า "ทดสอบแล้วไม่ผ่าน" ทั้งที่ความจริงคือ "ยังไม่ได้ทดสอบ" */
  const done = cols.every((c) => !c.req || String(row[c.key] == null ? "" : row[c.key]).trim() !== "");
  const ok = table.pass && table.resultCol !== false && done ? table.pass(row) : null;

  if (mobile) {
    return (
      <div style={{ marginBottom: 11, padding: 11, border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: "var(--text-1)" }}>แถวที่ {no}</span>
          {ok === null ? null : (
            <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10.5, fontWeight: 800,
              background: ok ? "var(--tint-ok-bg)" : "var(--tint-red-bg)", color: ok ? "var(--tint-ok-tx)" : "#B91C1C" }}>
              {ok ? "ผ่าน" : "ยังไม่ผ่าน"}
            </span>
          )}
          <button onClick={() => onRemove(row)} aria-label="ลบแถว"
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
              color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
        {cols.map((c) => (
          <div key={c.key} style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 3 }}>
              {c.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({c.th})</span>
              {c.unit ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · {c.unit}</span> : null}
              {c.req ? <span style={{ color: "#DC2626" }}> *</span> : null}
            </label>
            <PmCell col={c} value={row[c.key]} onCommit={set} mobile={true} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <tr>
      <td style={{ padding: "4px 5px", fontSize: 11, color: "var(--text-3)", textAlign: "center", verticalAlign: "middle" }}>{no}</td>
      {cols.map((c) => (
        <td key={c.key} style={{ padding: "4px 5px", verticalAlign: "middle" }}>
          <PmCell col={c} value={row[c.key]} onCommit={set} mobile={false} />
        </td>
      ))}
      <td style={{ padding: "4px 5px", textAlign: "center", verticalAlign: "middle", whiteSpace: "nowrap" }}>
        {ok === null ? null : (
          <span style={{ marginRight: 5, padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800,
            background: ok ? "var(--tint-ok-bg)" : "var(--tint-red-bg)", color: ok ? "var(--tint-ok-tx)" : "#B91C1C" }}>
            {ok ? "ผ่าน" : "NG"}
          </span>
        )}
        <button onClick={() => onRemove(row)} aria-label="ลบแถว"
          style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)",
            color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, lineHeight: 1 }}>×</button>
      </td>
    </tr>
  );
}

/* ── แถบแนบรูปของหัวข้อหนึ่ง ──
   สิ่งที่แสดงที่นี่คือ "สารบัญ" ไม่ใช่ตัวรูป — ฟอร์มสมัครเฉพาะ handoverPhotoIdx
   ซึ่งไม่มี dataUrl ติดมา สมุดหนึ่งเล่มรูปจริงหนักราวยี่สิบเมกะไบต์ ดูดทุกครั้งที่เปิดฟอร์มคือเน็ตของช่าง
   รูปจริงไปโผล่ตอนเปิดกระดาษ ที่เดียวที่ต้องใช้ไบต์จริง */
function PmPhotoStrip({ photos, busy, label, onAdd, onRemove, onCap }) {
  const ref = React.useRef(null);
  return (
    <div style={{ marginTop: 10, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 10,
      background: "var(--surface-2, var(--surface))" }}>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ flex: 1, minWidth: 130, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
          {label}
          <span style={{ fontWeight: 400, color: "var(--text-3)" }}>
            {photos.length ? " · " + photos.length + " รูป" : " · ยังไม่มีรูป"}
          </span>
        </span>
        <button onClick={() => ref.current && ref.current.click()} disabled={busy}
          style={{ padding: "6px 11px", borderRadius: 8, border: "1px dashed var(--border-strong)", background: "var(--surface)",
            color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
          {busy ? "กำลังย่อรูป…" : "＋ แนบรูป"}
        </button>
      </div>
      {photos.map((x, i) => (
        <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: "var(--text-3)" }}>#{i + 1}</span>
          <input defaultValue={x.cap || ""} placeholder="คำบรรยายรูป (พิมพ์ใต้รูปในใบ)"
            onBlur={(e) => onCap(x.id, e.target.value)}
            style={Object.assign({}, pmInputStyle, { fontSize: 12, padding: "6px 9px" })} />
          <button onClick={() => onRemove(x)} aria-label="ลบรูป"
            style={{ flexShrink: 0, border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", padding: 3 }}>
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── หนึ่งตาราง: ช่องหัวตาราง + แถว + ปุ่มเพิ่ม ── */
function PmTableBlock({ table, hdr, rows, mobile, onHdr, onSet, onAdd, onRemove, onSeed,
  photos, photoBusy, onAddPhoto, onRemovePhoto, onCapPhoto }) {
  const cols = table.cols || [];
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9, paddingBottom: 4,
        borderBottom: "1px solid var(--border)" }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>
          {table.code ? <span style={{ color: "var(--text-3)" }}>{table.code} · </span> : null}
          {table.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({table.th})</span>
        </span>
        <span style={{ flexShrink: 0, fontSize: 11, color: "var(--text-3)" }}>{rows.length} แถว</span>
      </div>

      {(table.hdr || []).length ? (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", columnGap: 14, marginBottom: 6 }}>
          {(table.hdr || []).map((f) => (
            <PmField key={f.key} field={f} value={hdr[f.key]} prefilled={false} onCommit={onHdr} />
          ))}
        </div>
      ) : null}

      {table.unitNote ? (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 7 }}>{table.unitNote}</div>
      ) : null}

      {!rows.length ? (
        <div style={{ padding: "14px 12px", border: "1px dashed var(--border-strong)", borderRadius: 11, textAlign: "center",
          fontSize: 12, color: "var(--text-3)", marginBottom: 9 }}>
          ยังไม่มีแถวในตารางนี้
        </div>
      ) : mobile ? (
        rows.map((r, i) => (
          <PmTableRow key={r.id} table={table} row={r} no={i + 1} mobile={true} onSet={onSet} onRemove={onRemove} />
        ))
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 40 + cols.length * 96 }}>
            <thead>
              <tr>
                <th style={{ width: 28, padding: "4px 5px", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>#</th>
                {cols.map((c) => (
                  <th key={c.key} style={{ padding: "4px 5px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--text-2)" }}>
                    {c.en}{c.req ? <span style={{ color: "#DC2626" }}> *</span> : null}
                    <span style={{ display: "block", fontWeight: 400, color: "var(--text-3)" }}>
                      {c.th}{c.unit ? " · " + c.unit : ""}
                    </span>
                  </th>
                ))}
                <th style={{ width: 66 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <PmTableRow key={r.id} table={table} row={r} no={i + 1} mobile={false} onSet={onSet} onRemove={onRemove} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 9 }}>
        <button onClick={onAdd}
          style={{ padding: "8px 13px", borderRadius: 9, border: "1px dashed var(--border-strong)", background: "var(--surface)",
            color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          + เพิ่มแถว
        </button>
        {/* ปุ่มสร้างแถวให้อัตโนมัติขึ้นเฉพาะตอนตารางยังว่าง — ไม่งั้นกดซ้ำแล้วได้แถวซ้อนกันสองชุด */}
        {table.seed && !rows.length ? (
          <button onClick={onSeed}
            style={{ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--primary)", background: "var(--primary-soft)",
              color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            สร้างแถวจากข้อมูลที่มีอยู่
          </button>
        ) : null}
      </div>

      {/* รูปของหัวข้อนี้ — อยู่ติดกับตารางที่มันเป็นหลักฐาน ไม่ใช่กองรวมท้ายเล่ม
          ช่างถ่ายรูปตอนที่ยืนอยู่ตรงจุดที่วัด ไม่ใช่กลับมาไล่จัดทีหลัง ตอนนั้นไม่มีใครจำได้แล้วว่ารูปไหนของอะไร */}
      {onAddPhoto ? (
        <PmPhotoStrip photos={photos || []} busy={photoBusy} label={"รูปประกอบหัวข้อนี้"}
          onAdd={onAddPhoto} onRemove={onRemovePhoto} onCap={onCapPhoto} />
      ) : null}
    </div>
  );
}

/* ── หนึ่งช่องลงนาม ── */
function PmSignRow({ block, value, onCommit }) {
  const v = value || {};
  const [name, setName] = React.useState(v.name || "");
  const [date, setDate] = React.useState(v.date || "");
  React.useEffect(() => { setName((value || {}).name || ""); setDate((value || {}).date || ""); }, [value]);
  return (
    <div style={{ marginBottom: 13, padding: 11, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
        {block.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({block.th})</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={name} placeholder="ชื่อผู้ลงนาม" onChange={(e) => setName(e.target.value)}
          onBlur={() => onCommit(block.key, { name: name, date: date })}
          style={Object.assign({}, pmInputStyle, { flex: 2, minWidth: 160 })} />
        <input value={date} type="date" onChange={(e) => { setDate(e.target.value); onCommit(block.key, { name: name, date: e.target.value }); }}
          style={Object.assign({}, pmInputStyle, { flex: 1, minWidth: 140 })} />
      </div>
      {/* ชื่อที่พิมพ์ไม่แทนลายเซ็นจริง กระดาษยังเว้นช่องเซ็นเสมอ */}
      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 5 }}>ใบที่พิมพ์ออกมายังเว้นช่องเซ็นด้วยปากกาไว้เสมอ</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   หน้าหลัก
   ══════════════════════════════════════════════════ */
function PmHandoverModal({ job, currentUser, onClose, onSummary }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const jobId = job ? job.id : null;
  const store = window.usePmHandover(jobId);
  const ph = window.usePmPhotoIdx(jobId);
  /* รูปที่ไม่ได้แนบกับหัวข้อใด — หมวด "รูปประกอบ" เป็นของชุดนี้เท่านั้น
     ถ้าเอา ph.idx ทั้งก้อนมาโชว์ รูปจะโผล่สองที่ ทั้งใต้หัวข้อและในหมวดนี้ แล้วคนจะลบซ้ำกัน */
  const genPhotos = React.useMemo(() => window.pmPhotosOf(ph.idx, "gen", ""), [ph.idx]);
  const [tab, setTab] = React.useState("home");
  const [paper, setPaper] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);

  const rec = store.rec;
  const started = !!(rec && rec.meta);
  const sum = React.useMemo(() => window.pmMerged(rec, job, currentUser), [rec, job, currentUser]);
  const prog = React.useMemo(() => window.pmProgress(rec, job, currentUser), [rec, job, currentUser]);
  const newer = started ? window.pmNewerItems(rec, job, currentUser) : 0;

  /* เงาบนใบงาน — เขียนตามหลังทุกครั้งที่ความครบเปลี่ยน ให้การ์ดกับหน้ารายการอ่านสถานะได้
     ⚠ ข้ามตอนอยู่ในกล่องทราย เพราะ store.patch เขียน jobs/<id> ของจริงเสมอ (ไม่รู้จัก PM_ROOT) */
  const lastShadow = React.useRef("");
  React.useEffect(() => {
    if (!started || !onSummary || window.PM_ROOT) return;
    const s = window.pmSummaryOf(rec, job, currentUser);
    const sig = [s.pct, s.done, s.total, s.status, s.ver].join("|");
    if (sig === lastShadow.current) return;
    lastShadow.current = sig;
    onSummary(s);
  }, [rec, job, currentUser, started, onSummary]);

  if (!job) return null;

  const setField = (key, val) => store.patch("sum", { [key]: val == null ? "" : String(val) }, currentUser);
  const setDoc = (key, val) => store.patch("docs", { [key]: val }, currentUser);

  /* เพิ่ม/ลบชุดของกลุ่มที่กดเพิ่มได้ (แผง · อินเวอร์เตอร์)
     จำนวนชุดเก็บเป็นตัวเลขในหมวด sum ช่องเดียว ไม่ได้เก็บเป็นรายการ ⇒ เขียนทีละใบเหมือนช่องอื่น */
  const addSet = (g) => store.patch("sum", { [g.repeat.countKey]: String(g.setCount + 1) }, currentUser);

  /* ลบชุดสุดท้าย — ล้างค่าที่กรอกไว้ในชุดนั้นด้วย ไม่งั้นค่าเก่าจะดึงจำนวนชุดกลับขึ้นมาเอง
     (pmSetCount ห้ามจำนวนชุดต่ำกว่าชุดที่ยังมีข้อมูล) */
  const removeSet = async (g) => {
    const filled = (g.fields || []).some((f) => String(sum[f.key] == null ? "" : sum[f.key]).trim() !== "");
    if (filled) {
      const ok = await window.askConfirm({
        title: "ลบ" + g.th + "?", icon: "alert", ok: "ลบชุดนี้", danger: true,
        body: "ชุดนี้มีข้อมูลกรอกไว้แล้ว ลบแล้วค่าที่กรอกในชุดนี้จะหายไป",
      });
      if (!ok) return;
    }
    const patch = { [g.repeat.countKey]: String(Math.max(1, g.setCount - 1)) };
    (g.fields || []).forEach((f) => { patch[f.key] = ""; });
    store.patch("sum", patch, currentUser);
  };
  const setSign = (key, val) => store.patch("sign", { [key]: val }, currentUser);

  /* ── แผ่นที่เป็นตาราง ──
     ทุกคำสั่งเขียนที่ "ใบ" เสมอ — ช่องเดียวของแถวเดียว ไม่เคยเขียนทั้งตาราง
     ตอนคอมมิชชันนิ่งมีสองสามคนกรอกคนละแถวพร้อมกันจริง เขียนทั้งก้อนคือลบงานของคนอื่นเงียบ ๆ */
  const tPath = (tb, tail) => "tests/" + tab + "/" + tb.key + (tail ? "/" + tail : "");
  const setHdr = (tb) => (key, val) => store.patch(tPath(tb, "hdr"), { [key]: val == null ? "" : String(val) }, currentUser);
  const setCell = (tb) => (rowId, key, val) =>
    store.patch(tPath(tb, "rows/" + rowId), { [key]: val == null ? "" : String(val) }, currentUser);

  const addRow = (tb, data) => {
    const rows = window.pmRowsOf(rec, tab, tb.key);
    const row = Object.assign({ ord: window.pmNextOrd(rows) }, data || {});
    store.patch(tPath(tb, "rows/" + window.pmRowId()), row, currentUser);
  };

  /* สร้างแถวชุดหนึ่งจากข้อมูลที่มีอยู่ — เขียนทีเดียวทั้งชุด ไม่งั้นสิบแถวคือสิบคำสั่ง */
  const seedRows = (tb) => {
    const list = tb.seed(job, sum) || [];
    if (!list.length) {
      window.askConfirm({ title: "ยังสร้างแถวให้ไม่ได้", icon: "alert", ok: "เข้าใจ", danger: false,
        body: "ตารางนี้สร้างแถวจากจำนวนอินเวอร์เตอร์ในแผ่นข้อมูลโครงการ ซึ่งยังไม่ได้กรอก · กรอกจำนวนเครื่องก่อนแล้วกดใหม่" });
      return;
    }
    const base = window.pmNextOrd(window.pmRowsOf(rec, tab, tb.key));
    const up = {};
    list.forEach((d, i) => { up[window.pmRowId() + i] = Object.assign({ ord: base + i * 10 }, d); });
    store.patch(tPath(tb, "rows"), up, currentUser);
  };

  const removeRow = async (tb, row) => {
    const filled = (tb.cols || []).some((c) => String(row[c.key] == null ? "" : row[c.key]).trim() !== "");
    if (filled) {
      const ok = await window.askConfirm({ title: "ลบแถวนี้?", icon: "trash", ok: "ลบแถว", danger: true,
        body: "แถวนี้มีค่าที่กรอกไว้แล้ว ลบแล้วค่าในแถวนี้จะหายไป" });
      if (!ok) return;
    }
    store.patch(tPath(tb, "rows"), { [row.id]: null }, currentUser);
  };

  /* meta บอกว่ารูปชุดนี้เป็นของหัวข้อไหน — ไม่ส่งมาคือรูปรวมท้ายเล่ม (sec: "gen") */
  const addPhotos = async (files, meta) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i].type || arr[i].type.indexOf("image/") !== 0) continue;
        /* โปรไฟล์มือถือ — รูปละ ~200KB สมุดเต็มเล่มมีได้ร้อยกว่ารูป ถ้าใหญ่กว่านี้ช่างจ่ายค่าเน็ตเอง */
        const dataUrl = await window.resizeImageFile(arr[i], 1100, 0.70);
        ph.add(dataUrl, meta || { sec: "gen" }, currentUser);
      }
    } finally { setBusy(false); }
  };

  const removePhoto = async (x) => {
    const ok = await window.askConfirm({ title: "ลบรูปนี้?", icon: "trash", ok: "ลบรูป", danger: true });
    if (ok) ph.remove(x.id);
  };

  /* จำนวนรูปต่อสลอต เก็บไว้ให้ตัวเช็คความครบอ่าน (เฟสถัดไปที่รูปเป็นรายการบังคับจะได้ใช้ได้ทันที) */
  React.useEffect(() => {
    if (!started) return;
    const flags = window.pmPhotoFlags(ph.idx);
    const cur = (rec && rec.flags) || {};
    if (JSON.stringify(flags) === JSON.stringify(cur)) return;
    store.patch("flags", flags, currentUser);
  }, [ph.idx, started]);

  const signOff = async () => {
    if (prog.missing.length) {
      const ok = await window.askConfirm({
        title: "ปิดเล่มทั้งที่ยังไม่ครบ?", icon: "alert", ok: "ปิดเล่มเลย",
        body: "ยังขาดอีก " + prog.missing.length + " รายการ · ปิดเล่มได้ แต่ใบที่พิมพ์ออกมาจะมีหน้าบอกว่าขาดอะไรบ้างติดไปด้วย",
      });
      if (!ok) return;
    }
    store.setStatus("signed", currentUser);
  };

  const secs = window.PM_SECTIONS;
  const cur = window.PM_SEC_BY[tab];

  const tabBtn = (sec) => {
    const st = prog.bySection[sec.key] || { pct: 0, state: "empty", done: 0, total: 0 };
    const on = tab === sec.key;
    return (
      <button key={sec.key} onClick={() => setTab(sec.key)}
        style={{ flexShrink: 0, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
          border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
          background: on ? "var(--primary-soft)" : "var(--surface)", textAlign: "left" }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: on ? "var(--primary-dark)" : "var(--text-1)" }}>
          {sec.th}
        </span>
        <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: PM_STATE_COLOR[st.state] || "var(--text-3)" }}>
          {st.total ? st.done + "/" + st.total + " · " + st.pct + "%" : "ไม่มีรายการบังคับ"}
        </span>
      </button>
    );
  };

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 132,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(760px,100%)",
          maxHeight: isMobile ? "94dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          {/* หัวหน้าต่าง */}
          <div style={{ flexShrink: 0, padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "#16A34A1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="check" size={17} color="#16A34A" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>สมุดตรวจรับและส่งมอบระบบ</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {job.code} · {job.name}
              </div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10,
              border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>

          {!started ? (
            /* ── ยังไม่เปิดเล่ม ── */
            <div style={{ padding: 26, textAlign: "center" }}>
              <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
                ยังไม่ได้เปิดสมุดส่งมอบของงานนี้<br />
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  เปิดแล้วกรอกเพิ่มทีละอย่างได้ระหว่างทำงาน · ข้อมูลที่ระบบรู้อยู่แล้วจะถูกเติมให้ก่อน
                </span>
              </div>
              <button onClick={() => store.open(currentUser)} disabled={!window.FBDB}
                style={{ padding: "11px 20px", borderRadius: 11, border: "1px solid var(--primary)", background: "var(--primary)",
                  color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: window.FBDB ? "pointer" : "not-allowed",
                  opacity: window.FBDB ? 1 : .5 }}>
                เปิดสมุดส่งมอบ
              </button>
              {!window.FBDB ? (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>ต้องต่อฐานข้อมูลก่อนจึงจะเปิดเล่มได้</div>
              ) : null}
            </div>
          ) : (
            <React.Fragment>
              {/* แถบความครบ */}
              <div style={{ flexShrink: 0, padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>
                    กรอกแล้ว {prog.pct}%
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>({prog.done}/{prog.total} รายการ)</span>
                  <span style={{ flex: 1 }} />
                  {(rec.meta || {}).status === "signed" ? (
                    <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--tint-ok-bg)",
                      border: "1px solid var(--tint-ok-bd)", color: "var(--tint-ok-tx)", fontSize: 10.5, fontWeight: 800 }}>
                      ส่งมอบแล้ว
                    </span>
                  ) : null}
                </div>
                <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                  <div style={{ width: prog.pct + "%", height: "100%", borderRadius: 99,
                    background: prog.pct >= 100 ? "var(--tint-green-tx)" : "#F59E0B", transition: "width .2s" }} />
                </div>
              </div>

              {/* แบนเนอร์รายการใหม่ — สมัครใจเสมอ ไม่อัปเดตเองเพราะจะทำให้เล่มที่เคยครบกลายเป็นไม่ครบ */}
              {newer ? (
                <div style={{ flexShrink: 0, padding: "9px 16px", background: "var(--tint-amber-bg)", borderBottom: "1px solid var(--tint-amber-bd)",
                  display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: "var(--tint-amber-tx)" }}>
                    แบบฟอร์มมีรายการบังคับใหม่เพิ่มมา {newer} รายการ — เล่มนี้ยังใช้แบบเดิมอยู่
                  </span>
                  <button onClick={store.bumpVer}
                    style={{ flexShrink: 0, padding: "6px 11px", borderRadius: 8, border: "1px solid var(--tint-amber-bd)",
                      background: "var(--surface)", color: "var(--tint-amber-tx)", fontFamily: "inherit", fontSize: 11.5,
                      fontWeight: 700, cursor: "pointer" }}>
                    อัปเดตแบบฟอร์ม
                  </button>
                </div>
              ) : null}

              {/* แถบเลือกหมวด */}
              {/* ⚠ flexShrink: 0 ทุกแถวที่ไม่ใช่ส่วนเลื่อน — หน้าต่างนี้เป็น flex คอลัมน์ที่มีเพดานความสูง
                  ถ้าไม่ห้ามหด เบราว์เซอร์จะบีบแถบหมวดจนบรรทัด "14/26 · 54%" ถูกตัดหายไปครึ่งตัว
                  พอเนื้อหาข้างในยาว (ซึ่งยาวเสมอ) */}
              <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto",
                borderBottom: "1px solid var(--border)" }}>
                <button onClick={() => setTab("home")}
                  style={{ flexShrink: 0, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    border: "1px solid " + (tab === "home" ? "var(--primary)" : "var(--border-strong)"),
                    background: tab === "home" ? "var(--primary-soft)" : "var(--surface)", textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700,
                    color: tab === "home" ? "var(--primary-dark)" : "var(--text-1)" }}>ภาพรวม</span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: PM_STATE_COLOR[prog.pct >= 100 ? "done" : "partial"] }}>
                    {prog.done}/{prog.total} · {prog.pct}%
                  </span>
                </button>
                {secs.map(tabBtn)}
                <button onClick={() => setTab("photo")}
                  style={{ flexShrink: 0, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                    border: "1px solid " + (tab === "photo" ? "var(--primary)" : "var(--border-strong)"),
                    background: tab === "photo" ? "var(--primary-soft)" : "var(--surface)", textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 700,
                    color: tab === "photo" ? "var(--primary-dark)" : "var(--text-1)" }}>รูปประกอบ</span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>
                    {genPhotos.length} รูป
                  </span>
                </button>
              </div>

              {/* เนื้อหา */}
              <div style={{ padding: 16, overflowY: "auto", flex: 1, minHeight: 0 }}>
                {tab === "home" ? (
                  <div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 13 }}>
                      เปิดสมุดแล้ว · กรอกไปแล้ว <b style={{ color: "var(--text-1)" }}>{prog.pct}%</b>{" "}
                      ({prog.done} จาก {prog.total} รายการ)
                      {prog.missing.length ? <span> · ยังขาดอีก {prog.missing.length} รายการ</span> : <span> · ครบทุกรายการแล้ว</span>}
                    </div>
                    {secs.map((sec) => {
                      const st = prog.bySection[sec.key] || { pct: 0, done: 0, total: 0, state: "empty" };
                      return (
                        <button key={sec.key} onClick={() => setTab(sec.key)}
                          style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 9, padding: "11px 13px",
                            borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)",
                            cursor: "pointer", fontFamily: "inherit" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{sec.th}</span>
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{sec.en}</span>
                            </span>
                            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: PM_STATE_COLOR[st.state] || "var(--text-3)" }}>
                              {st.total ? st.done + "/" + st.total + " · " + st.pct + "%" : "ไม่บังคับ"}
                            </span>
                          </div>
                          {st.total ? (
                            <div style={{ height: 5, borderRadius: 99, background: "var(--border)", overflow: "hidden", marginTop: 8 }}>
                              <div style={{ width: st.pct + "%", height: "100%", borderRadius: 99,
                                background: PM_STATE_COLOR[st.state] || "var(--border-strong)" }} />
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                    <button onClick={() => setTab("photo")}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 13px", borderRadius: 12,
                        border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>รูปประกอบ</span>
                      <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>Photos · {genPhotos.length} รูป</span>
                    </button>
                  </div>
                ) : null}

                {cur && cur.kind === "fields" && window.pmGroupsOf(cur, sum).map((g) => (
                  <div key={g.key} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9,
                      paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: "var(--text-1)" }}>
                        {g.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({g.th})</span>
                        {g.optional ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}> · ไม่บังคับ</span> : null}
                      </span>
                      {/* ลบได้เฉพาะชุดสุดท้าย — ลบชุดกลางแล้วต้องเลื่อนคีย์ของชุดถัดไปทั้งหมด
                          ซึ่งเป็นการย้ายข้อมูลที่คนกรอกไว้ข้ามช่อง ผิดพลาดแล้วกู้ไม่ได้ */}
                      {g.repeat && g.setNo === g.setCount && g.setCount > 1 ? (
                        <button onClick={() => removeSet(g)}
                          style={{ flexShrink: 0, padding: "4px 9px", borderRadius: 8, border: "1px solid var(--border-strong)",
                            background: "var(--surface)", color: "var(--text-3)", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                            cursor: "pointer" }}>
                          ลบชุดนี้
                        </button>
                      ) : null}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", columnGap: 14 }}>
                      {(g.fields || []).map((f) => (
                        <PmField key={f.key} field={f} value={sum[f.key]}
                          prefilled={window.pmIsPrefilled(rec, f.key) && !!f.from} onCommit={setField} />
                      ))}
                    </div>
                    {/* ปุ่มเพิ่มอยู่ท้ายชุดสุดท้ายของกลุ่มนั้น ไม่ใช่รวมกันไว้ข้างล่างสุด
                        จะได้เห็นว่ากำลังเพิ่มชุดของอะไร ตอนหน้าจอยาวจนหัวกลุ่มเลื่อนพ้นตาไปแล้ว */}
                    {g.repeat && g.setNo === g.setCount && g.setCount < g.repeat.max ? (
                      <button onClick={() => addSet(g)}
                        style={{ marginTop: 2, padding: "8px 13px", borderRadius: 9, border: "1px dashed var(--border-strong)",
                          background: "var(--surface)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12.5,
                          fontWeight: 700, cursor: "pointer" }}>
                        + {g.repeat.addTh}
                      </button>
                    ) : null}
                  </div>
                ))}

                {cur && cur.kind === "checklist" && (cur.groups || []).map((g) => (
                  <div key={g.key} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", marginBottom: 4,
                      paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
                      {g.en} <span style={{ fontWeight: 400, color: "var(--text-3)" }}>({g.th})</span>
                    </div>
                    {(g.items || []).map((it) => (
                      <PmDocRow key={it.key} item={it} job={job} value={(rec.docs || {})[it.key]} onSet={setDoc} />
                    ))}
                  </div>
                ))}

                {cur && cur.kind === "table" && (cur.tables || []).map((tb) => (
                  <PmTableBlock key={tb.key} table={tb} mobile={isMobile}
                    hdr={window.pmTableOf(rec, cur.key, tb.key).hdr || {}}
                    rows={window.pmRowsOf(rec, cur.key, tb.key)}
                    onHdr={setHdr(tb)} onSet={setCell(tb)}
                    onAdd={() => addRow(tb)} onSeed={() => seedRows(tb)} onRemove={(row) => removeRow(tb, row)}
                    photos={window.pmPhotosOf(ph.idx, cur.key, tb.key)} photoBusy={busy}
                    onAddPhoto={(files) => addPhotos(files, { sec: cur.key, slot: tb.key })}
                    onRemovePhoto={removePhoto} onCapPhoto={ph.setCap} />
                ))}

                {cur && cur.kind === "sign" && (
                  <React.Fragment>
                    {(cur.blocks || []).map((b) => (
                      <PmSignRow key={b.key} block={b} value={(rec.sign || {})[b.key]} onCommit={setSign} />
                    ))}
                    {(rec.meta || {}).status !== "signed" ? (
                      <button onClick={signOff}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 11, border: "1px solid var(--primary)",
                          background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                        ปิดเล่ม · บันทึกว่าส่งมอบแล้ว
                      </button>
                    ) : (
                      <button onClick={() => store.setStatus("draft", currentUser)}
                        style={{ width: "100%", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
                          background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        เปิดเล่มกลับมาแก้ไข
                      </button>
                    )}
                  </React.Fragment>
                )}

                {tab === "photo" && (
                  <React.Fragment>
                    <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                      onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                    <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                      style={{ width: "100%", marginBottom: 14, padding: "11px 16px", borderRadius: 11,
                        border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
                        fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
                      {busy ? "กำลังย่อรูป…" : "＋ เพิ่มรูปประกอบการส่งมอบ"}
                    </button>
                    {!genPhotos.length ? (
                      <div style={{ padding: 28, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>
                        ยังไม่มีรูปรวม · รูปที่เพิ่มตรงนี้จะไปอยู่ท้ายไฟล์ PDF หน้าละ 6 รูป
                        <span style={{ display: "block", marginTop: 6 }}>
                          รูปของแต่ละหัวข้อ แนบได้ใต้หัวข้อนั้นโดยตรง และจะพิมพ์ต่อท้ายแผ่นของหัวข้อนั้น
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                        {genPhotos.map((x, i) => (
                          <div key={x.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 9, background: "var(--surface)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-2)" }}>#{i + 1}</span>
                              <span style={{ flex: 1, fontSize: 10.5, color: "var(--text-3)" }}>{x.byName || ""}</span>
                              <button onClick={() => removePhoto(x)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-3)", padding: 2 }}>
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                            <input defaultValue={x.cap || ""} placeholder="คำบรรยายรูป (พิมพ์ใต้รูปในใบ)"
                              onBlur={(e) => ph.setCap(x.id, e.target.value)}
                              style={Object.assign({}, pmInputStyle, { fontSize: 12.5, padding: "7px 9px" })} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                      รูปถูกย่อก่อนเก็บเพื่อไม่ให้เปลืองเน็ตของช่างหน้างาน · ไฟล์ Excel ฝังรูปไม่ได้
                      แผ่น Photos ในนั้นเป็นสารบัญที่อ้างเลขรูปชุดเดียวกับใน PDF
                    </div>
                  </React.Fragment>
                )}
              </div>

              {/* รายการที่ยังขาด + ปุ่มออกรายงาน */}
              <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "11px 16px" }}>
                {prog.missing.length ? (
                  <details style={{ marginBottom: 10 }}>
                    <summary style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                      ⚠️ ยังขาดอีก {prog.missing.length} รายการ · แตะเพื่อดู
                    </summary>
                    <div style={{ maxHeight: 170, overflowY: "auto", marginTop: 8 }}>
                      {prog.missing.map((m, i) => (
                        <button key={m.key + i} onClick={() => setTab(m.section)}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 8px", marginBottom: 3,
                            borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer",
                            fontFamily: "inherit", fontSize: 11.5, color: "var(--text-2)" }}>
                          <b style={{ color: "var(--text-3)", fontWeight: 700 }}>{m.secTh}</b> · {m.th}
                        </button>
                      ))}
                    </div>
                  </details>
                ) : (
                  <div style={{ marginBottom: 10, fontSize: 12.5, fontWeight: 700, color: "var(--tint-green-tx)" }}>
                    ✓ กรอกครบทุกรายการแล้ว
                  </div>
                )}
                <button onClick={() => setPaper(true)}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--primary)",
                    background: "var(--primary-soft)", color: "var(--primary-dark)", fontFamily: "inherit",
                    fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                  ดูรายงาน · บันทึก PDF / ออกไฟล์ Excel
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {paper && started && <PmPaperHost job={job} rec={rec} sum={sum} prog={prog} onClose={() => setPaper(false)} />}
    </React.Fragment>
  );
}

/* กระดาษต้องการรูปตัวจริงพร้อม dataUrl ซึ่งหนัก จึงเพิ่งไปโหลดตอนเปิดกระดาษ ไม่ใช่ตอนเปิดฟอร์ม
   (แยกเป็นคอมโพเนนต์เพราะ hook เรียกแบบมีเงื่อนไขไม่ได้) */
function PmPaperHost({ job, rec, sum, prog, onClose }) {
  const photos = window.usePmPhotos(job ? job.id : null, true);
  if (!window.PmHandoverPaper) return null;
  return <window.PmHandoverPaper job={job} rec={rec} sum={sum} prog={prog} photos={photos} onClose={onClose} />;
}

Object.assign(window, { PmField, PmDocRow, PmSignRow, PmHandoverModal, PmPaperHost });
