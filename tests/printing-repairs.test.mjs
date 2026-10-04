import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { printInvoice } from '../src/utils/receipt-page.js';

test('print waits for fonts and images, then opens the dialog exactly once', async () => {
  const events = [];
  globalThis.document = { fonts: { ready: Promise.resolve().then(() => events.push('fonts')) },
    querySelectorAll: () => [{ decode: async () => { events.push('image'); } }],
    querySelector: () => null, getElementById: () => null };
  globalThis.window = { print: () => events.push('print') };
  await printInvoice();
  assert.deepEqual(events, ['fonts', 'image', 'print']);
});

test('failed image loading propagates and does not report a successful print', async () => {
  let printed = false;
  globalThis.document = { fonts: { ready: Promise.resolve() }, querySelectorAll: () => [{ decode: async () => { throw Error('Logo unavailable'); } }] };
  globalThis.window = { print: () => { printed = true; } };
  await assert.rejects(printInvoice(), /Logo unavailable/);
  assert.equal(printed, false);
});

test('shared thermal preview/print uses a single thin inner separator', () => {
  const css = readFileSync(new URL('../src/pages/Invoice.css', import.meta.url), 'utf8');
  assert.match(css, /\.invoice-thermal-print \.thermal-print-product-row \{ border-bottom: none; \}/);
  assert.match(css, /\.thermal-print-product-row \+ \.thermal-print-product-row \{ border-top: 1px solid #777; \}/);
});
