// iSolarCloud ปลอม port 8791 — ตรวจการเข้ารหัสแบบเดียวกับของจริง (RSA กุญแจ AES · body AES-ECB hex) ไว้ทดสอบ api/_lib/isolarcloud.mjs
//   node tools/isolarcloud-mock.mjs   · GET /__pub = public key (base64 DER url-safe) ให้ตัวยิงใช้
//   env MOCK_PLAIN=1 = แอปไม่เข้ารหัส (ตอบ JSON ตรง ๆ)
import http from 'node:http';
import crypto from 'node:crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 1024 });
const PUB = publicKey.export({ type: 'spki', format: 'der' }).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
const plain = process.env.MOCK_PLAIN === '1';
const aesKey = (k) => { const b = Buffer.alloc(16, 0x20); Buffer.from(k, 'utf8').copy(b, 0, 0, 16); return b; };
const dec = (hex, k) => { const d = crypto.createDecipheriv('aes-128-ecb', aesKey(k), null); return Buffer.concat([d.update(Buffer.from(hex, 'hex')), d.final()]).toString('utf8'); };
const enc = (s, k) => { const c = crypto.createCipheriv('aes-128-ecb', aesKey(k), null); return Buffer.concat([c.update(s, 'utf8'), c.final()]).toString('hex').toUpperCase(); };
/* ถอด x-random-secret-key — ทำเองแบบ PKCS#1 v1.5 (Node ใหม่ปิด RSA_PKCS1_PADDING ฝั่ง privateDecrypt) */
const rsaDec = (b64) => {
  const buf = Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const out = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_NO_PADDING }, buf);
  return out.subarray(out.indexOf(0, 2) + 1).toString('utf8');
};
const PLANTS = [{ ps_id: 1234567, ps_name: 'ไซต์ทดสอบ Sungrow', total_capcity: { value: '10.5', unit: 'kWp' }, ps_status: 1, online_status: 1, ps_fault_status: 3 },
  { ps_id: 7654321, ps_name: 'โรงงานทดสอบ', total_capcity: { value: '120', unit: 'kWp' }, ps_status: 1, online_status: 1, ps_fault_status: 3 }];
const TOKEN = 'TOK_' + Date.now();
const ok = (d) => ({ req_serial_num: 'x', result_code: '1', result_msg: 'success', result_data: d });
const route = (api, b) => {
  if (b.appkey !== 'MOCKAPPKEY') return { result_code: 'er_invalid_appkey', result_msg: 'appkey is incorrect' };
  if (api === '/openapi/login') return b.user_password === 'mock' ? ok({ token: TOKEN, user_id: '99', login_state: '1' }) : ok({ login_state: '0', msg: 'wrong password' });
  if (b.token !== TOKEN) return { result_code: 'E00003', result_msg: 'token is invalid' };
  if (api === '/openapi/getPowerStationList') return ok({ rowCount: PLANTS.length, pageList: b.curPage === 1 ? PLANTS : [] });
  if (api === '/openapi/getDeviceList') return ok({ rowCount: 2, pageList: b.curPage === 1 ? [
    { device_type: 1, device_name: 'SG10RT', ps_key: b.ps_id + '_1_1_1', device_sn: 'A21', device_model_code: 'SG10RT' },
    { device_type: 7, device_name: 'Meter', ps_key: b.ps_id + '_7_1_1', device_sn: 'M1' }] : [] });
  if (api === '/openapi/getDeviceRealTimeData') return ok({ device_point_list: b.ps_key_list.map((k) => ({ device_point: Object.assign({ ps_key: k },
    ...b.point_id_list.map((p) => ({ ['p' + p]: String(+p % 1000 * 3) }))) })) });
  if (api === '/openapi/getOpenPointInfo') return ok({ pageList: [{ point_id: 1, point_name: 'Daily Yield' }, { point_id: 24, point_name: 'Total Active Power' }] });
  return { result_code: '0', result_msg: 'unknown api' };
};
http.createServer((q, s) => {
  let raw = ''; q.on('data', (c) => (raw += c)); q.on('end', () => {
    if (q.url === '/__pub') return s.end(PUB);
    if (q.headers['x-access-key'] !== 'mockaccess') return s.end(JSON.stringify({ result_code: 'E912', result_msg: 'Illegal x-access-key' }));
    let key = '', b;
    try {
      if (plain) b = JSON.parse(raw);
      else { key = rsaDec(q.headers['x-random-secret-key'] || ''); b = JSON.parse(dec(raw, key)); }
    } catch (e) { return s.end(JSON.stringify({ result_code: 'E900', result_msg: 'decrypt failed: ' + e.message })); }
    if (!b.api_key_param || !b.api_key_param.nonce || String(b.api_key_param.nonce).length !== 32) return s.end(JSON.stringify({ result_code: 'E901', result_msg: 'bad api_key_param' }));
    const r = JSON.stringify(route(q.url, b));
    s.end(plain ? r : enc(r, key));
  });
}).listen(8791, () => console.log('iSolarCloud ปลอม http://localhost:8791' + (plain ? ' (ไม่เข้ารหัส)' : '')));
