const pvcN = v => String(Math.round(v * 10000) / 10000);
const pvcEsc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pvcE = o => [o.x, -o.z, o.y];
const pvcAdd = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const pvcLen = a => Math.hypot(a[0], a[1], a[2]);
async function pvcScene(st) {
  const THREE = await p3LoadThree();
  const grp = new THREE.Group();
  const R = p3sBuild3D(THREE, grp, Object.assign({}, st, {
    baseMap: null,
    photo: null
  }), () => null);
  grp.updateMatrixWorld(true);
  const shade = [];
  const v = new THREE.Vector3();
  grp.traverse(m => {
    if (!m.isMesh || !m.castShadow || m.userData && m.userData.pv || !m.geometry || !m.geometry.attributes.position) return;
    const g = m.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const sc = m.matrixWorld.getMaxScaleOnAxis();
    if (g.boundingSphere && g.boundingSphere.radius * sc < 0.06) return;
    const pos = g.attributes.position,
      idx = g.index,
      n = idx ? idx.count : pos.count;
    const out = [];
    for (let i = 0; i + 2 < n; i += 3) {
      const t = [];
      for (let j = 0; j < 3; j++) {
        v.fromBufferAttribute(pos, idx ? idx.getX(i + j) : i + j).applyMatrix4(m.matrixWorld);
        t.push(v.x, -v.z, v.y);
      }
      const ax = t[3] - t[0],
        ay = t[4] - t[1],
        az = t[5] - t[2],
        bx = t[6] - t[0],
        by = t[7] - t[1],
        bz = t[8] - t[2];
      if (Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) < 1e-6) continue;
      out.push.apply(out, t);
    }
    if (out.length) shade.push(out);
  });
  grp.traverse(m => {
    if (m.geometry) m.geometry.dispose();
  });
  return {
    pvq: R && R.pvq || [],
    shade
  };
}
function pvcRack(q) {
  const c = pvcE(q.c);
  let U = pvcE(q.U),
    V = pvcE(q.V),
    n = pvcE(q.n);
  if (n[2] < 0) n = n.map(x => -x);
  let S = Math.abs(V[2]) >= Math.abs(U[2]) ? V : U;
  const H = S === V ? U : V;
  if (S[2] < 0) S = S.map(x => -x);
  let P = [pvcAdd(pvcAdd(c, S, 1), H, 1), pvcAdd(pvcAdd(c, S, 1), H, -1), pvcAdd(pvcAdd(c, S, -1), H, -1), pvcAdd(pvcAdd(c, S, -1), H, 1)];
  const a = P[3],
    b = P[1],
    d = P[2];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  if (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2] < 0) P = [P[1], P[0], P[3], P[2]];
  const tilt = Math.acos(Math.max(-1, Math.min(1, n[2]))) / P3_DEG;
  let az = (Math.atan2(n[0], n[1]) / P3_DEG + 360) % 360;
  if (tilt < 0.5) az = 180;
  const lS = 2 * pvcLen(S),
    lH = 2 * pvcLen(H);
  return {
    P,
    tilt,
    az,
    lS,
    lH,
    orient: lH >= lS ? "landscape" : "portrait"
  };
}
function pvcModule(st) {
  const sys = st.sys || {};
  const ps = (window.BOQ && window.BOQ.PANELS || []).find(p => p.model === sys.panelModel) || {};
  const model = ps.model || sys.panelModel || "PV module";
  return {
    name: model,
    maker: String(model).split(/\s+/)[0] || "Generic",
    wp: +ps.wp || +st.wp || 650,
    depth: +ps.frame || 30
  };
}
const pvcMat = (id, rgb) => `<material id="${id}" name="${id}"><instance_effect url="#${id}-fx"/></material>`;
const pvcFx = (id, rgb) => `<effect id="${id}-fx"><profile_COMMON><technique sid="standard"><lambert><diffuse><color sid="diffuse">${rgb} 1</color></diffuse></lambert></technique></profile_COMMON></effect>`;
function pvcGeom(id, arr, mat, extra) {
  const nv = arr.length / 3,
    nt = nv / 3;
  const p = [];
  for (let i = 0; i < nv; i++) p.push(i);
  return `<geometry id="${id}" name="${id}"><mesh>` + `<source id="${id}-pos"><float_array id="${id}-arr" count="${arr.length}">${arr.map(pvcN).join(" ")}</float_array>` + `<technique_common><accessor count="${nv}" source="#${id}-arr" stride="3"><param name="X" type="float"/><param name="Y" type="float"/><param name="Z" type="float"/></accessor></technique_common></source>` + `<vertices id="${id}-vtx"><input semantic="POSITION" source="#${id}-pos"/></vertices>` + `<triangles count="${nt}" material="${mat}"><input offset="0" semantic="VERTEX" source="#${id}-vtx"/><p>${p.join(" ")}</p></triangles>` + `</mesh>${extra || ""}</geometry>`;
}
const pvcBind = (sym, mat) => `<bind_material><technique_common><instance_material symbol="${sym}" target="#${mat}"/></technique_common></bind_material>`;
function pvcBuild2(st, job, S) {
  const M = pvcModule(st);
  const racks = S.pvq.map(pvcRack);
  const mLen = Math.round(Math.max(racks[0] ? Math.max(racks[0].lS, racks[0].lH) : 2.382, 0) * 1000);
  const mWid = Math.round((racks[0] ? Math.min(racks[0].lS, racks[0].lH) : 1.134) * 1000);
  const bm = st.baseMap || {},
    lat = +bm.lat,
    lng = +bm.lng;
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const name = job && (job.code || job.name) || "flash+solar";
  const geo = [],
    lib = [],
    vis = [];
  S.shade.forEach((arr, i) => {
    geo.push(pvcGeom("Shade" + i, arr, "M"));
    vis.push(`<node id="ShadeNode${i}" name="Shade ${i + 1}"><instance_geometry url="#Shade${i}">${pvcBind("M", "MatShade")}</instance_geometry></node>`);
  });
  racks.forEach((r, i) => {
    const P = r.P,
      arr = [].concat(P[3], P[1], P[2], P[1], P[3], P[0]);
    geo.push(pvcGeom("Rack" + i, arr, "M", `<extra><technique profile="PVCollada-2.0"><pv:rack><pv:rack_type>fixed_tilt</pv:rack_type><pv:row_spacing>0</pv:row_spacing><pv:column_spacing>0</pv:column_spacing>` + `<pv:module_rows>1</pv:module_rows><pv:module_columns>1</pv:module_columns><pv:module_orientation>${r.orient}</pv:module_orientation>` + `<pv:tilt>${r.tilt.toFixed(2)}</pv:tilt><pv:azimuth>${r.az.toFixed(2)}</pv:azimuth><pv:module_id>Module1</pv:module_id></pv:rack></technique></extra>`));
    lib.push(`<node id="TableModel${i}"><instance_geometry url="#Rack${i}">${pvcBind("M", "MatPV")}` + `<extra><technique profile="PVCollada-2.0"><pv:instance_rack id="rackInstance${i}"/></technique></extra></instance_geometry>` + `<extra><technique profile="PVCollada-2.0"><pv:table><pv:type>fixed</pv:type></pv:table></technique></extra></node>`);
    vis.push(`<node id="PVnode${i}" name="PV ${i + 1}"><instance_node url="#TableModel${i}"><extra><technique profile="PVCollada-2.0">` + `<pv:instance_table id="InstanceTable${i}"><pv:instance_racks_array><pv:instance_rack_ref id="rackRef${i}" url="#rackInstance${i}"/></pv:instance_racks_array></pv:instance_table>` + `</technique></extra></instance_node></node>`);
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:pv="https://pvcollada.org/2026/XMLSchema" xmlns="http://www.collada.org/2008/03/COLLADASchema" version="1.5.0">
<asset><contributor><author>flash+solar</author><authoring_tool>flash+solar 3D designer</authoring_tool><comments>${pvcEsc(name)} · ${racks.length} PV modules</comments></contributor>` + (isFinite(lat) && isFinite(lng) ? `<coverage><geographic_location><longitude>${lng}</longitude><latitude>${lat}</latitude><altitude mode="absolute">0</altitude></geographic_location></coverage>` : "") + `<created>${now}</created><modified>${now}</modified><unit meter="1" name="meter"/><up_axis>Z_UP</up_axis>
<extra><technique profile="PVCollada-2.0"><pv:software><pv:source>flash+solar</pv:source><pv:target>PVsyst</pv:target></pv:software><pv:project><pv:name>${pvcEsc(name)}</pv:name></pv:project>
<pv:components><pv:modules><pv:module id="Module1"><pv:manufacturer>${pvcEsc(M.maker)}</pv:manufacturer><pv:name>${pvcEsc(M.name)}</pv:name><pv:module_type>monofacial</pv:module_type>` + `<pv:nom_power>${M.wp}</pv:nom_power><pv:length>${mLen}</pv:length><pv:width>${mWid}</pv:width><pv:depth>${M.depth}</pv:depth></pv:module></pv:modules></pv:components></technique></extra></asset>
<library_materials>${pvcMat("MatShade")}${pvcMat("MatPV")}</library_materials>
<library_effects>${pvcFx("MatShade", "0.6 0.6 0.6")}${pvcFx("MatPV", "0.05 0.1 0.3")}</library_effects>
<library_geometries>
${geo.join("\n")}
</library_geometries>
<library_nodes>
${lib.join("\n")}
</library_nodes>
<library_visual_scenes><visual_scene id="Scene" name="Scene">
${vis.join("\n")}
</visual_scene></library_visual_scenes>
<scene><instance_visual_scene url="#Scene"/></scene>
</COLLADA>
`;
}
function pvcBuildDae(st, job, S) {
  const geo = [],
    vis = [];
  S.shade.forEach((arr, i) => {
    geo.push(pvcGeom("Shade" + i, arr, "M"));
    vis.push(`<node id="ShadeNode${i}" name="Shade_${i + 1}"><instance_geometry url="#Shade${i}">${pvcBind("M", "MatShade")}</instance_geometry></node>`);
  });
  const pv = [];
  S.pvq.map(pvcRack).forEach(r => {
    const P = r.P;
    pv.push.apply(pv, [].concat(P[3], P[1], P[2], P[1], P[3], P[0]));
  });
  if (pv.length) {
    geo.push(pvcGeom("PV_MODULES", pv, "M"));
    vis.push(`<node id="PVNode" name="PV_MODULES"><instance_geometry url="#PV_MODULES">${pvcBind("M", "MatPV")}</instance_geometry></node>`);
  }
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  return `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">
<asset><contributor><authoring_tool>flash+solar 3D designer</authoring_tool></contributor><created>${now}</created><modified>${now}</modified><unit meter="1" name="meter"/><up_axis>Z_UP</up_axis></asset>
<library_effects>${pvcFx("MatShade", "0.6 0.6 0.6")}${pvcFx("MatPV", "0.05 0.1 0.3")}</library_effects>
<library_materials>${pvcMat("MatShade")}${pvcMat("MatPV")}</library_materials>
<library_geometries>
${geo.join("\n")}
</library_geometries>
<library_visual_scenes><visual_scene id="Scene" name="Scene">
${vis.join("\n")}
</visual_scene></library_visual_scenes>
<scene><instance_visual_scene url="#Scene"/></scene>
</COLLADA>
`;
}
function pvcSetupText(st, job, design) {
  design = design || {};
  const L = [],
    ln = s => L.push(s == null ? "" : s);
  const name = job && (job.code || job.name) || "";
  const Mo = pvcModule(st);
  let M = null;
  try {
    M = p3SldModel(st, job, design);
  } catch (e) {
    M = null;
  }
  const fp = p3FootAll(st).panels;
  const ori = {},
    keyOf = {};
  fp.forEach(p => {
    const n = p.n || {
      x: 0,
      y: 1,
      z: 0
    };
    const tilt = Math.acos(Math.max(-1, Math.min(1, n.y))) / P3_DEG;
    let az = (Math.atan2(n.x, -n.z) / P3_DEG + 360) % 360;
    if (tilt < 0.5) az = 180;
    const t = Math.round(tilt),
      a = Math.round(az) % 360,
      k = t + "|" + a;
    (ori[k] = ori[k] || {
      tilt: t,
      az: a,
      n: 0,
      strings: []
    }).n++;
    keyOf[p.uid] = k;
  });
  const SS = design.strings || [],
    PA = {};
  (design.paths || []).forEach(q => {
    PA[q.id] = q.uids || [];
  });
  const loose = [];
  SS.forEach(s => {
    const cnt = {};
    (PA[s.id] || []).forEach(u => {
      const k = keyOf[u];
      if (k) cnt[k] = (cnt[k] || 0) + 1;
    });
    const ks = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
    const m = /INV(\d+)\s*\/\s*MPPT(\d+)/.exec(s.addr || "");
    const x = {
      id: s.id,
      n: s.n,
      inv: m ? +m[1] : null,
      mppt: m ? +m[2] : null,
      mixed: ks.length > 1
    };
    if (ks.length) ori[ks[0]].strings.push(x);else loose.push(x);
  });
  const pvAz = a => {
    const d = (a - 180 + 540) % 360 - 180;
    return (d > 0 ? "+" : "") + d;
  };
  const dirTh = a => ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"][Math.round(a / 45) % 8];
  ln("ใบสรุปตั้งค่า PVsyst · " + name);
  ln("สร้างจาก flash+solar " + new Date().toLocaleString("th-TH"));
  ln("ใช้คู่กับไฟล์ " + name + "-PVsyst.pvc2 (Near Shadings → File → Import a 3D scene)");
  ln("================================================================");
  ln("");
  ln("1) แผง (System → Select the PV module)");
  ln("   รุ่น          : " + Mo.name);
  ln("   กำลัง         : " + Mo.wp + " Wp");
  ln("   จำนวนทั้งหมด  : " + fp.length + " แผง = " + (fp.length * Mo.wp / 1000).toFixed(2) + " kWp");
  ln("");
  ln("2) อินเวอร์เตอร์ (System → Select the inverter)");
  if (M && M.inv) {
    ln("   รุ่น          : " + M.inv.model);
    ln("   จำนวน         : " + (M.units ? M.units.length : M.inv.count) + " เครื่อง" + (M.mppt && M.mppt.per ? " · " + M.mppt.per + " MPPT/เครื่อง" : "") + (M.mppt && M.mppt.phys ? " · " + M.mppt.phys + " ช่อง/MPPT" : ""));
  } else ln("   (ยังไม่ได้เลือกในหน้าออกแบบระบบ)");
  ln("");
  ln("3) Orientation — กลุ่มตามทิศ (หน้า Orientation เลือก \"Multi-orientation\" ถ้ามีมากกว่า 1 กลุ่ม)");
  ln("   ทิศแบบ PVsyst: 0° = ใต้ · ลบ = ตะวันออก · บวก = ตะวันตก");
  const G = Object.keys(ori).map(k => ori[k]).sort((a, b) => b.n - a.n);
  G.forEach((g, i) => ln("   กลุ่ม " + (i + 1) + " : เอียง " + g.tilt + "° · ทิศ " + pvAz(g.az) + "° (หัน" + dirTh(g.az) + " · " + g.az + "° จากเหนือ) · " + g.n + " แผง"));
  ln("");
  ln("4) System — Sub-array (1 กลุ่มทิศ = 1 sub-array · สตริงยาวไม่เท่ากันแยก sub-array)");
  G.forEach((g, i) => {
    if (!g.strings.length) {
      ln("   กลุ่ม " + (i + 1) + " : ไม่มีสตริง (ยังไม่ได้จัดสตริงในหน้าออกแบบระบบ)");
      return;
    }
    const byN = {};
    g.strings.forEach(s => {
      (byN[s.n] = byN[s.n] || []).push(s);
    });
    Object.keys(byN).sort((a, b) => b - a).forEach(n => {
      const A = byN[n],
        invs = {};
      A.forEach(s => {
        if (s.inv) (invs[s.inv] = invs[s.inv] || new Set()).add(s.mppt);
      });
      ln("   กลุ่ม " + (i + 1) + " (เอียง " + g.tilt + "° ทิศ " + pvAz(g.az) + "°) : " + A.length + " สตริง × " + n + " แผง = " + A.length * n + " แผง");
      ln("      Modules in series = " + n + " · Number of strings = " + A.length);
      Object.keys(invs).sort((a, b) => a - b).forEach(iv => ln("      INV" + iv + " : MPPT " + Array.from(invs[iv]).sort((a, b) => a - b).join(", ")));
      ln("      สตริง: " + A.map(s => "S" + s.id + (s.mixed ? "*" : "")).join(" "));
    });
  });
  if (loose.length) ln("   สตริงที่หาทิศไม่ได้ (ไม่มีแนวเดินสาย): " + loose.map(s => "S" + s.id + "(" + s.n + ")").join(" "));
  if (G.some(g => g.strings.some(s => s.mixed))) ln("   * = สตริงนี้มีแผงอยู่หลายทิศ (คร่อมสันหลังคา) — PVsyst ต้องการ 1 สตริงอยู่ทิศเดียว ใส่ไว้กลุ่มที่แผงส่วนใหญ่อยู่");
  ln("");
  ln("5) เช็กแรงดัน");
  if (M && M.pro && M.pro.vocMax) ln("   Voc สตริงยาวสุด @ " + M.pro.tMin + "°C = " + M.pro.vocMax + " V (อินเวอร์เตอร์รับได้ " + M.pro.maxVdc + " V) — PVsyst เตือนเกินค่านี้ = จัดสตริงใหม่");else ln("   (ไม่มีข้อมูล Voc)");
  ln("");
  ln("6) Near Shadings");
  ln("   Import ไฟล์ .pvc2 แล้วกด \"Table\" ดูค่าเงา · ถ้าจะคิดผลเงาตามสตริง (Module layout / electrical effect) ต้องจัดแผงเข้าสตริงใน PVsyst อีกครั้ง");
  return "\uFEFF" + L.join("\r\n") + "\r\n";
}
async function pvcExport(st, job, design) {
  const S = await pvcScene(st);
  if (!S.pvq.length) throw new Error("ยังไม่มีแผงในแบบ 3D");
  const base = (job && (job.code || job.name) || "plan3d") + "-PVsyst";
  p3SaveBlob(new Blob([pvcBuild2(st, job, S)], {
    type: "application/xml"
  }), base + ".pvc2");
  await new Promise(r => setTimeout(r, 400));
  p3SaveBlob(new Blob([pvcBuildDae(st, job, S)], {
    type: "model/vnd.collada+xml"
  }), base + ".dae");
  if (design) {
    await new Promise(r => setTimeout(r, 400));
    p3SaveBlob(new Blob([pvcSetupText(st, job, design)], {
      type: "text/plain;charset=utf-8"
    }), base + "-ตั้งค่า.txt");
  }
  return {
    panels: S.pvq.length,
    shades: S.shade.length
  };
}
Object.assign(window, {
  pvcScene,
  pvcRack,
  pvcBuild2,
  pvcBuildDae,
  pvcSetupText,
  pvcExport
});