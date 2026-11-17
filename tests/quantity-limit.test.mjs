import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { quantityLimitFormValues, quantityLimitPayload } from '../src/utils/quantity-limit.js';

test('Admin Panel quantity limit: saved values load into the form', () => {
  assert.deepEqual(quantityLimitFormValues({}), { quantityLimitEnabled: false, maxQuantityPerOrder: '' }); // legacy product
  assert.deepEqual(quantityLimitFormValues({ quantityLimitEnabled: true, maxQuantityPerOrder: 6 }), { quantityLimitEnabled: true, maxQuantityPerOrder: '6' });
  assert.deepEqual(quantityLimitFormValues({ quantityLimitEnabled: false, maxQuantityPerOrder: null }), { quantityLimitEnabled: false, maxQuantityPerOrder: '' });
});

test('Admin Panel quantity limit: enable, edit, disable and invalid input', () => {
  assert.deepEqual(quantityLimitPayload(true, '6').body, { quantityLimitEnabled: true, maxQuantityPerOrder: 6 });
  assert.deepEqual(quantityLimitPayload(true, ' 12 ').body, { quantityLimitEnabled: true, maxQuantityPerOrder: 12 });
  assert.deepEqual(quantityLimitPayload(false, '6').body, { quantityLimitEnabled: false, maxQuantityPerOrder: null });
  assert.deepEqual(quantityLimitPayload(false, 'garbage').body, { quantityLimitEnabled: false, maxQuantityPerOrder: null });
  for (const bad of ['', '  ', '0', '-1', '2.5', '1e3', 'six', '1000001']) {
    assert.ok(quantityLimitPayload(true, bad).error, bad);
  }
});

test('Admin Panel quantity limit: Add/Edit product form sends and renders the fields', () => {
  const source = readFileSync(new URL('../src/pages/Products.jsx', import.meta.url), 'utf8');
  assert.match(source, /Limit Quantity Per Order/);
  assert.match(source, /Maximum Quantity Per Order \*/);
  assert.match(source, /\.\.\.quantityLimitFormValues\(product\)/);
  assert.match(source, /\.\.\.quantityLimit\.body/);
  // Inline price/discount/availability edits still send only their own field.
  assert.match(source, /body: JSON\.stringify\(\{ availability: newAvailability \}\)/);
  assert.match(source, /body: JSON\.stringify\(\{ discount \}\)/);
});

test('Admin Panel products list: indicator only for enabled limits, showing the saved maximum', async () => {
  const { activeQuantityLimit } = await import('../src/utils/quantity-limit.js');
  assert.equal(activeQuantityLimit({}), null);
  assert.equal(activeQuantityLimit({ quantityLimitEnabled: false, maxQuantityPerOrder: 6 }), null);
  assert.equal(activeQuantityLimit({ quantityLimitEnabled: true, maxQuantityPerOrder: 6 }), 6);
  const source = readFileSync(new URL('../src/pages/Products.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/pages/Products.css', import.meta.url), 'utf8');
  assert.match(source, /Max \{activeQuantityLimit\(product\)\} \/ order/);
  assert.match(css, /\.quantity-limit-badge \{[^}]*var\(--info-bg\)/);
});
