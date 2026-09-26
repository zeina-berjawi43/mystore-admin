import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { authCases } from './auth-cases.mjs';
import { createAuthTransport, API_URL } from '../src/utils/auth-transport.js';
import { whatsappPhone } from '../src/utils/whatsapp-phone.js';
authCases('Admin Panel', createAuthTransport, API_URL);

const makeStorage = () => {
  const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map };
};
test('Admin Panel: remember ON/OFF, migration, reload, logout and stale commit', async () => {
  globalThis.localStorage = makeStorage(); globalThis.sessionStorage = makeStorage();
  localStorage.setItem('rememberMe', 'false'); localStorage.setItem('accessToken', 'legacy');
  const { sessionStorageAdapter: storage, saveSession } = await import('../src/utils/session-storage.js');
  assert.equal(storage.getItem('accessToken'), null);
  const credentials = { accessToken: 'access', refreshToken: 'refresh', user: '{"role":"admin"}' };
  await saveSession(credentials, false);
  assert.equal(localStorage.getItem('refreshToken'), null); assert.equal(sessionStorage.getItem('refreshToken'), 'refresh');
  assert.equal(storage.getItem('accessToken'), 'access'); // same session/page reload
  globalThis.sessionStorage = makeStorage(); assert.equal(storage.getItem('accessToken'), null); // closed tab
  await saveSession(credentials, true);
  globalThis.sessionStorage = makeStorage(); assert.equal(storage.getItem('accessToken'), 'access');
  await saveSession({ ...credentials, accessToken: 'new', refreshToken: 'new-refresh' }, true);
  assert.equal(await storage.commitAccess('refresh', 'stale'), false);
  assert.equal(await storage.clearSession('refresh'), false);
  assert.equal(storage.getItem('accessToken'), 'new');
  localStorage.setItem('theme', 'dark'); localStorage.setItem('adminToken', 'legacy'); sessionStorage.setItem('token', 'legacy');
  assert.equal(await storage.clearSession('new-refresh'), true);
  for (const key of ['accessToken', 'refreshToken', 'adminToken', 'token', 'user', 'rememberMe']) {
    assert.equal(localStorage.getItem(key), null); assert.equal(sessionStorage.getItem(key), null);
  }
  assert.equal(localStorage.getItem('theme'), 'dark');
});

export const phoneCases = [
  ['03 123 456', '9613123456'], ['3123456', '9613123456'], ['(01) 123-456', '9611123456'],
  ...['70','71','76','78','79','81'].map(prefix => [prefix + '123456', '961' + prefix + '123456']),
  ['+961 03 123456', '9613123456'], ['+961 70 123456', '96170123456'],
  ['96170123456', '96170123456'], ['0096170123456', '96170123456'],
  ['+44 (20) 7946-0958', '442079460958'], ['442079460958', '442079460958'],
  ['+1 202 555 0123', '12025550123'], ['+39 06 6982', '39066982'],
  ['9617012345', null], ['96196170123456', null], ['7012345', null], ['03 12345', null],
  ['+961701234567', null], ['70x123456', null], ['', null], ['123', null],
];
for (const [input, expected] of phoneCases) test(`Admin Panel phone: ${input || '(empty)'}`, () => assert.equal(whatsappPhone(input), expected));
test('Admin Panel phone action preserves OTP encoding and normalizes the selected record only', () => {
  const source = readFileSync(new URL('../src/pages/PhoneVerification.jsx', import.meta.url), 'utf8');
  assert.match(source, /normalizeWhatsAppPhone\(phone\)/);
  assert.match(source, /BStore verification code: \$\{otp\}/);
  assert.match(source, /wa\.me\/\$\{cleanPhone\}\?text=\$\{encodeURIComponent/);
});
