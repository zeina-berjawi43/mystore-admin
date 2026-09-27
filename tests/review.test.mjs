import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithOxc } from 'vite';
import { createAuthTransport } from '../src/utils/auth-transport.js';

const source = readFileSync(new URL('../src/pages/Invoice.jsx', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '')
  .replace('export default Invoice;', 'globalThis.layouts = [ThermalPrintLayout, ThermalPreview, A4Preview];');
const { code } = await transformWithOxc(source, 'Invoice.jsx', { jsx: { runtime: 'classic' } });
const context = { React };
vm.runInNewContext(code, context);
for (const [index, label] of ['physical thermal', 'thermal preview', 'A4 preview'].entries()) {
  test(`${label}: all data and copies survive; discount hidden only at zero`, () => {
    for (const discount of [0, '0', null, undefined, 10]) for (const copyType of ['Customer', 'Store']) {
      const props = { invoice: { invoiceNumber: 'TEST-1', createdAt: '2026-09-27', customer: { firstName: 'John', lastName: 'Smith', phone: '70123456', address: 'Long address '.repeat(20) }, items: [{ productName: 'Long product '.repeat(20), quantity: 12345, price: 123456.78 }] },
        totals: { subtotal: 100, discount, discountAmount: Number(discount) || 0, total: 90 }, notes: 'All notes must print', copyType };
      const html = renderToStaticMarkup(React.createElement(context.layouts[index], props));
      assert.equal(html.includes('Discount ('), Number(discount) > 0);
      for (const value of ['TEST-1', 'John Smith', '70123456', 'Subtotal', '$90.00', 'All notes must print', copyType]) assert.ok(html.includes(value), `${label}: ${value}`);
      assert.ok(html.includes('12345')); assert.ok(html.includes('123456.78'));
    }
  });
}
const restoreSource = readFileSync(new URL('../src/utils/restore-session.js', import.meta.url), 'utf8')
  .replace(/^import[^\n]+\n/gm, '').replace('export async function', 'async function') + '\nglobalThis.restore = restoreAdminSession;';
function setup(status = 200) {
  const data = new Map([['refreshToken', 'valid-refresh'], ['accessToken', 'expired'], ['user', '{"role":"admin"}']]);
  const storage = { getItem: key => data.get(key) ?? null, commitAccess: async (expected, value) => { if (data.get('refreshToken') !== expected) return false; data.set('accessToken', value); return true; },
    clearSession: async expected => { if ((data.get('refreshToken') ?? null) !== expected) return false; data.clear(); return true; } };
  let requests = 0;
  const authTransport = createAuthTransport(storage, async () => { requests++; return new Response(JSON.stringify({ accessToken: 'fresh' }), { status }); }, () => {});
  const ctx = { storage, authTransport }; vm.runInNewContext(restoreSource, ctx);
  return { ...ctx, data, requests: () => requests };
}
test('startup restores an expired or missing access token through the existing refresh transport', async () => {
  for (const missing of [false, true]) {
    const f = setup(); if (missing) f.data.delete('accessToken');
    assert.equal(await f.restore(), true); assert.equal(f.data.get('accessToken'), 'fresh'); assert.equal(f.requests(), 1);
  }
});
test('invalid/revoked refresh sessions become anonymous, temporary failures preserve credentials', async () => {
  for (const status of [401, 403]) { const f = setup(status); assert.equal(await f.restore(), false); assert.equal(f.data.size, 0); }
  for (const status of [429, 500, 503]) { const f = setup(status); await assert.rejects(f.restore()); assert.equal(f.data.get('refreshToken'), 'valid-refresh'); }
});
test('explicit logout cannot restore; startup/login/deep links all use the restoration gate', async () => {
  const f = setup(); await f.authTransport.logout(); assert.equal(await f.restore(), false);
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /return <SessionGate>\{children\}<\/SessionGate>/);
  assert.match(app, /<SessionGate login><Login \/><\/SessionGate>/);
  const gate = readFileSync(new URL('../src/components/SessionGate.jsx', import.meta.url), 'utf8');
  assert.match(gate, /useState\('loading'\)/); assert.match(gate, /restoreAdminSession\(\).then/);
  assert.match(gate, /state === 'error'/); assert.match(gate, /Navigate to="\/dashboard"/);
});
