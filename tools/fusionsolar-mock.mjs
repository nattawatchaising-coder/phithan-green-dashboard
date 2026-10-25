// FusionSolar ปลอมในเครื่อง — ทดสอบงานซิงก์โดยไม่ต้องมีรหัสจริง/ไม่กินโควตา Huawei (docs/fusionsolar.md)
//   node tools/fusionsolar-mock.mjs [port]      (ค่าเริ่ม 8790)
//   แล้วตั้ง FUSIONSOLAR_BASE=http://localhost:8790/thirdData
// เลียนพฤติกรรมที่งานซิงก์ต้องรับมือ:
//   - login คืน xsrf-token ใน header + cookie · คำขออื่นต้องส่ง XSRF-TOKEN + cookie ตรงกัน ไม่งั้น 305
//   - token หมดอายุหลัง MOCK_EXPIRE คำขอ (ค่าเริ่ม 4) → 305
//   - คำขอห่างกันน้อยกว่า MOCK_MIN_GAP ms (ค่าเริ่ม 2000) → 407
//   - MOCK_NO_STATIONLIST=1 → getStationList ตอบ failCode 401 (ทดสอบทางสำรอง /stations)
//   - MOCK_DROP=NE=... → สถานีนี้หายจากรายชื่อ (ทดสอบ not_found)
import http from 'node:http';

const PORT = Number(process.argv[2]) || 8790;
const EXPIRE = Number(process.env.MOCK_EXPIRE) || 4;
const MIN_GAP = process.env.MOCK_MIN_GAP == null ? 2000 : Number(process.env.MOCK_MIN_GAP);
const DROP = (process.env.MOCK_DROP || '').split(',').filter(Boolean);

const STATIONS = [
  { stationCode: 'NE=57489892', stationName: 'บ้านคุณ Phatcha', stationAddr: 'นนทบุรี', capacity: 0.01 },
  { stationCode: 'NE=11110001', stationName: 'โรงงานทดสอบ A', stationAddr: 'ชลบุรี', capacity: 0.2 },
  { stationCode: 'NE=11110002', stationName: 'บ้านทดสอบ B', stationAddr: 'ปทุมธานี', capacity: 0.005 },
];
const DEVS = [
  { id: 1000000057489895, devName: 'INV-Phatcha', devTypeId: 38, esnCode: 'HV2250000001', model: 'SUN2000-10KTL-M1', softwareVersion: 'V100R001C00SPC138', stationCode: 'NE=57489892' },
  { id: 1000000057489896, devName: 'Meter-Phatcha', devTypeId: 47, esnCode: 'DTSU666H001', model: 'DTSU666-H', softwareVersion: '', stationCode: 'NE=57489892' },
  { id: 1000000057489898, devName: 'LUNA-Phatcha', devTypeId: 39, esnCode: 'LUNA2000001', model: 'LUNA2000-10-S0', softwareVersion: 'V100R002C00', stationCode: 'NE=57489892' },
  { id: 1000000057489897, devName: 'Dongle-Phatcha', devTypeId: 62, esnCode: 'SDONGLE001', model: 'SDongleA-05', softwareVersion: 'V100R001', stationCode: 'NE=57489892' },
  { id: 1000000011110011, devName: 'INV-A1', devTypeId: 1, esnCode: 'HVA0001', model: 'SUN2000-100KTL-M1', softwareVersion: 'V100R001C10', stationCode: 'NE=11110001' },
  { id: 1000000011110012, devName: 'Logger-A', devTypeId: 63, esnCode: 'LOGA0001', model: 'SmartLogger3000A', softwareVersion: 'V300R023', stationCode: 'NE=11110001' },
  { id: 9123456789012345678, devName: 'แปลก-B', devTypeId: 999, esnCode: 'X1', model: 'Unknown', softwareVersion: '', stationCode: 'NE=11110002' },
];
// ชื่อ key ตามเอกสาร Northbound (getDevRealKpi) · ค่าตัวอย่างพอให้หน้าจอมีของจริงให้แสดง
const strings = (n, u, i, weak) => { const o = {}; for (let k = 1; k <= n; k++) { o['pv' + k + '_u'] = u + k % 3; o['pv' + k + '_i'] = k === weak ? +(i * 0.35).toFixed(2) : i; } return o; };
const KPI = {
  38: (h) => Object.assign({ inverter_state: 512, run_state: 1, total_cap: 15234.5 + h, day_cap: 32.1 + h, active_power: 6.42, reactive_power: 0.08,
    efficiency: 98.1, temperature: 41.2, power_factor: 0.999, elec_freq: 50.01, a_u: 231.4, a_i: 27.8, mppt_power: 6.6,
    open_time: Date.now() - 6 * 3600e3, close_time: 'N/A' }, strings(2, 412, 8.05)),
  1:  (h) => Object.assign({ inverter_state: 512, run_state: 1, total_cap: 402311 + h, day_cap: 512.4, active_power: 88.1, reactive_power: 1.2,
    efficiency: 98.6, temperature: 47.5, power_factor: 0.998, elec_freq: 49.98, ab_u: 401.2, bc_u: 399.8, ca_u: 400.5,
    a_i: 127.1, b_i: 126.8, c_i: 127.4, mppt_power: 90.2 }, strings(8, 610, 9.2, 5)),
  47: (h) => ({ meter_status: 1, run_state: 1, active_cap: 4110.2 + h, reverse_active_cap: 8021.4, active_power: -2310, reactive_power: 120,   // หน่วย W/var ทิศแบบ Huawei: บวก = ขาย
    power_factor: 0.98, grid_frequency: 50.01, meter_u: 229.8, meter_i: 10.1 }),
  39: () => ({ battery_status: 2, run_state: 1, battery_soc: 76, battery_soh: 99, ch_discharge_power: 1850, max_charge_power: 5000,
    max_discharge_power: 5000, busbar_u: 412.3, charge_cap: 1820.4, discharge_cap: 1675.9, ch_discharge_model: 4 }),
  62: () => ({ run_state: 1 }),
  63: () => ({ run_state: 1 }),
  999: () => ({ foo: 1, bar: 'x' }),
};

let tokens = {}, last = 0, n = 0;
const out = (res, j, hdr) => { res.writeHead(200, Object.assign({ 'content-type': 'application/json' }, hdr || {})); res.end(j); };
// เลขยาวเขียนเป็นตัวเลขดิบ (ไม่ผ่าน JSON.stringify) ให้เหมือน Huawei ที่ส่งเลข 16+ หลัก
const big = (o) => JSON.stringify(o).replace(/"__BIG(\d+)"/g, '$1');
const B = (id) => '__BIG' + BigInt(id).toString();
const BIGID = { 9123456789012345678: '9123456789012345678' };

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const api = req.url.replace(/^\/thirdData/, '');
    const now = Date.now();
    const gap = now - last; last = now; n++;
    let j = {}; try { j = JSON.parse(body || '{}'); } catch (e) {}
    console.log(new Date().toISOString().slice(11, 19), api, 'gap', gap, 'ms', JSON.stringify(j).slice(0, 80));
    if (MIN_GAP && gap < MIN_GAP && n > 1) return out(res, big({ success: false, failCode: 407, data: null, message: 'ACCESS_FREQUENCY_IS_TOO_HIGH' }));
    if (api === '/login') {
      if (j.userName !== 'api_tarnthanawat' || !j.systemCode) return out(res, big({ success: false, failCode: 20001, data: null, message: 'USERNAME_OR_PASSWORD_ERROR' }));
      const t = 'tok' + Math.random().toString(36).slice(2);
      tokens[t] = 0;
      return out(res, big({ success: true, failCode: 0, data: null }), { 'xsrf-token': t, 'set-cookie': ['XSRF-TOKEN=' + t + '; Path=/', 'web-auth=1; Path=/; HttpOnly'] });
    }
    const t = req.headers['xsrf-token'];
    if (!t || tokens[t] == null || !(req.headers.cookie || '').includes('XSRF-TOKEN=' + t) || tokens[t] >= EXPIRE) {
      return out(res, big({ success: false, failCode: 305, data: null, message: 'USER_MUST_RELOGIN' }));
    }
    tokens[t]++;
    const st = STATIONS.filter((s) => !DROP.includes(s.stationCode));
    const pick = (codes) => String(codes || '').split(',');
    if (api === '/getStationList') {
      if (process.env.MOCK_NO_STATIONLIST) return out(res, big({ success: false, failCode: 401, data: null, message: 'interface not supported' }));
      return out(res, big({ success: true, failCode: 0, data: st }));
    }
    if (api === '/stations') {
      const list = st.map((s) => ({ plantCode: s.stationCode, plantName: s.stationName, plantAddress: s.stationAddr, capacity: s.capacity * 1000 }));
      const size = 2, p = j.pageNo || 1;
      return out(res, big({ success: true, failCode: 0, data: { list: list.slice((p - 1) * size, p * size), pageCount: Math.ceil(list.length / size), pageNo: p, total: list.length } }));
    }
    if (api === '/getStationRealKpi') {
      const h = new Date().getMinutes() / 10;
      return out(res, big({ success: true, failCode: 0, data: pick(j.stationCodes).filter((c) => st.some((s) => s.stationCode === c)).map((c, i) => ({
        stationCode: c, dataItemMap: { day_power: 31.2 + i + h, month_power: 812.4 + i, total_power: 15234.5 + i * 100, real_health_state: [3, 2, 1][i % 3], day_income: 0 } })) }));
    }
    if (api === '/getDevList') {
      const codes = pick(j.stationCodes);
      return out(res, big({ success: true, failCode: 0, data: DEVS.filter((d) => codes.includes(d.stationCode)).map((d) => Object.assign({}, d, { id: B(BIGID[d.id] || d.id) })) }));
    }
    if (api === '/getDevRealKpi') {
      const ids = pick(j.devIds), h = new Date().getMinutes() / 10;
      const f = KPI[j.devTypeId];
      if (!f) return out(res, big({ success: false, failCode: 20013, data: null, message: 'devTypeId not supported' }));
      return out(res, big({ success: true, failCode: 0, data: ids.map((id) => ({ devId: B(id), dataItemMap: f(h) })) }));
    }
    out(res, big({ success: false, failCode: 404, data: null, message: 'no api ' + api }));
  });
}).listen(PORT, () => console.log('FusionSolar ปลอม http://localhost:' + PORT + '/thirdData'));
