import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithOxc } from 'vite';
import { sortChecklistProducts, uncheckedChecklistText } from '../src/utils/dashboard-checklist.js';

const products = () => [
  { productId: 'z', name: 'Zoo', quantity: 100, checked: true },
  { productId: 'm', name: 'موز', quantity: 90, checked: false },
  { productId: 'b', name: 'banana', quantity: 80, checked: false },
  { productId: 'o', name: 'زيت', quantity: 3, checked: true },
  { productId: 'a', name: 'Apple', quantity: 2, checked: false },
  { productId: 'r', name: 'أرز', quantity: 1, checked: false },
];
const expectedNames = ['أرز', 'زيت', 'موز', 'Apple', 'banana', 'Zoo'];
const source = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8')
  .replace(/^import[^\n]*;\s*/gm, '')
  .replace('  if (loading) {', '  globalThis.handlers = { fetchDashboard, toggleConfirmedProductCheck, shareConfirmedProducts, setStatistics, statistics, shareText, shareMessage };\n  if (loading) {')
  .replace('export default Dashboard;', 'globalThis.Dashboard = Dashboard;');
const { code } = await transformWithOxc(source, 'Dashboard.jsx', { jsx: { runtime: 'classic' } });

async function page(rows = products(), options = {}) {
  const states = [], popups = [], writes = [], requests = []; let cursor = 0;
  const ctx = { React, sortChecklistProducts, uncheckedChecklistText,
    useEffect() {}, useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    sessionStorageAdapter: { getItem: () => 'fixture' },
    window: { open: (url, target) => { assert.equal(url, 'about:blank'); assert.equal(target, '_blank'); if (options.blocked) return null;
      const popup = { opener: {}, closed: false, close() { this.closed = true; }, location: { replace(value) { popup.url = value; } } }; popups.push(popup); return popup; } },
    axios: { get: async url => { requests.push(url); assert.ok(url.endsWith('/dashboard/statistics')); return { data: { statistics: { confirmedProducts: rows } } }; },
      put: async (url, body) => { writes.push({ url, body }); const row = rows.find(item => url.endsWith('/' + item.productId + '/check')); assert.ok(row);
        return options.update ? options.update(row, body) : { data: { product: { ...row, checked: body.checked } } }; } },
    alert: () => assert.fail('Unexpected alert'), console,
  };
  vm.runInNewContext(code, ctx);
  const render = () => { cursor = 0; return renderToStaticMarkup(ctx.Dashboard()); };
  render(); await ctx.handlers.fetchDashboard(); render();
  return { ctx, render, popups, writes, requests };
}

test('Arabic/English sorting ignores quantity and checked state, preserves input and stable ties', () => {
  const rows = products(), before = JSON.stringify(rows);
  assert.deepEqual(sortChecklistProducts(rows).map(row => row.name), expectedNames);
  assert.equal(JSON.stringify(rows), before);
  assert.deepEqual(sortChecklistProducts(rows.map(row => ({ ...row, quantity: 1000 - row.quantity, checked: !row.checked }))).map(row => row.name), expectedNames);
  const ties = [{ name: 'apple', quantity: 1 }, { name: 'Apple', quantity: 99, checked: true }];
  assert.deepEqual(sortChecklistProducts(ties), ties);
});

test('Web Panel behavior matches the inspected Admin App helper for sorting and text formatting', async () => {
  const appSource = readFileSync(new URL('../../admin-app/src/services/dashboard-checklist.ts', import.meta.url), 'utf8');
  const app = await transformWithOxc(appSource, 'dashboard-checklist.ts');
  const ctx = {}; vm.runInNewContext(app.code.replace(/export /g, '') + '\nglobalThis.reference = {sortChecklistProducts, uncheckedChecklistText};', ctx);
  const rows = [...products(), { name: 'Apple', productId: 'a2', quantity: 7, checked: true }, { name: 'Unknown Product', productId: 'missing', quantity: 4 }];
  for (const values of [rows, rows.map(row => ({ ...row, checked: !row.checked })), [], rows.map(row => ({ ...row, checked: true }))]) {
    assert.equal(JSON.stringify(sortChecklistProducts(values)), JSON.stringify(ctx.reference.sortChecklistProducts(values)));
    assert.equal(uncheckedChecklistText(sortChecklistProducts(values)), ctx.reference.uncheckedChecklistText(ctx.reference.sortChecklistProducts(values)));
  }
});

test('real Dashboard renders every product alphabetically with original quantities and checkbox states', async () => {
  const p = await page(); const html = p.render();
  const names = Array.from(html.matchAll(/class="confirmed-product-name">\s*<strong>(.*?)<\/strong>/g), match => match[1]);
  assert.deepEqual(names, expectedNames);
  assert.match(html, /aria-label="Mark Zoo as not prepared"/);
  assert.match(html, /aria-label="Mark Apple as prepared"/);
  assert.equal((html.match(/class="confirmed-product-row/g) || []).length, products().length);
  assert.equal(JSON.stringify(p.ctx.handlers.statistics.confirmedProducts), JSON.stringify(products()));
});

test('checking excludes an item from shared text, unchecking restores it without reordering or quantity changes', async () => {
  const p = await page();
  const text = async () => { await p.ctx.handlers.shareConfirmedProducts(); p.render(); return new URL(p.popups.at(-1).url).searchParams.get('text'); };
  assert.equal(await text(), 'Confirmed Order Products\nأرز × 1\nموز × 90\nApple × 2\nbanana × 80');
  const toggle = async () => { const row = p.ctx.handlers.statistics.confirmedProducts.find(item => item.productId === 'a'); await p.ctx.handlers.toggleConfirmedProductCheck(row); return p.render(); };
  let html = await toggle(); assert.ok(!(await text()).includes('Apple')); assert.match(html, /Mark Apple as not prepared/);
  html = await toggle(); assert.ok((await text()).includes('Apple × 2')); assert.match(html, /Mark Apple as prepared/);
  assert.deepEqual(Array.from(html.matchAll(/class="confirmed-product-name">\s*<strong>(.*?)<\/strong>/g), match => match[1]), expectedNames);
  assert.deepEqual(Array.from(p.ctx.handlers.statistics.confirmedProducts, row => row.quantity), products().map(row => row.quantity));
  assert.equal(p.requests.length, 1); assert.equal(p.writes.length, 2); assert.ok(p.popups.every(popup => popup.opener === null));
});

for (const rows of [[], products().map(row => ({ ...row, checked: true }))]) test(`${rows.length ? 'all-checked' : 'empty'} checklist reports an empty selection without opening WhatsApp`, async () => {
  const p = await page(rows); await p.ctx.handlers.shareConfirmedProducts(); const html = p.render();
  assert.match(html, /role="status">No unchecked products to share\./); assert.equal(p.popups.length, 0);
});

test('blocked popups keep the existing text link fallback and exclude checked products', async () => {
  const p = await page(products(), { blocked: true }); await p.ctx.handlers.shareConfirmedProducts(); const html = p.render();
  assert.match(html, /Open WhatsApp Share/);
  const text = new URL(p.ctx.handlers.shareMessage).searchParams.get('text');
  assert.ok(text.includes('Apple × 2')); assert.ok(!text.includes('Zoo')); assert.ok(!text.includes('زيت'));
});

test('large lists preserve all unchecked text in the existing copy fallback; all-checked sharing clears previous copy text', async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({ productId: String(i), name: 'منتج ' + i, quantity: i + 1, checked: i % 2 === 0 }));
  const p = await page(rows); await p.ctx.handlers.shareConfirmedProducts(); let html = p.render();
  assert.match(html, /Complete WhatsApp product list/); assert.equal(p.ctx.handlers.shareText.split('\n').length, 501);
  assert.ok(p.ctx.handlers.shareText.includes('منتج 999 × 1000')); assert.ok(!p.ctx.handlers.shareText.includes('منتج 998 ×'));
  assert.equal(p.popups[0].closed, true);
  p.ctx.handlers.setStatistics({ confirmedProducts: rows.map(row => ({ ...row, checked: true })) }); p.render();
  await p.ctx.handlers.shareConfirmedProducts(); html = p.render();
  assert.equal(p.ctx.handlers.shareText, ''); assert.doesNotMatch(html, /Complete WhatsApp product list/); assert.equal(p.popups.length, 1);
});

test('share is disabled while a checkbox save is pending and then uses the saved state', async () => {
  let release; const update = new Promise(resolve => { release = resolve; });
  const p = await page(products(), { update: () => update });
  const row = p.ctx.handlers.statistics.confirmedProducts.find(item => item.productId === 'a');
  const saving = p.ctx.handlers.toggleConfirmedProductCheck(row); const html = p.render();
  assert.match(html, /class="whatsapp-share-button"[^>]*disabled/);
  await p.ctx.handlers.shareConfirmedProducts(); assert.equal(p.popups.length, 0);
  release({ data: { product: { ...row, checked: true } } }); await saving; p.render();
  await p.ctx.handlers.shareConfirmedProducts(); assert.ok(!new URL(p.popups[0].url).searchParams.get('text').includes('Apple'));
});
