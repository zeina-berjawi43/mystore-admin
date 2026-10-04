import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import { transformWithOxc } from 'vite';

test('sidebar preserves pricing route/icon directly below Customers', () => {
  const source = readFileSync('src/components/Sidebar.jsx', 'utf8');
  const array = source.match(/const menuItems = (\[[\s\S]*?\]);/)[1];
  const items = vm.runInNewContext(array);
  const index = items.findIndex(item => item.name === 'Customers');
  assert.equal(items[index + 1].name, 'Pricing Settings'); assert.equal(items[index + 1].path, '/pricing'); assert.equal(items[index + 1].icon, '$');
  assert.equal(items.filter(item => item.path === '/pricing').length, 1);
});

test('unchanged panel pricing loads authoritative values and saves six fields, guarding concurrent saves', async () => {
  const source = readFileSync('src/pages/PricingSettings.jsx', 'utf8').replace(/^import.*;\s*$/gm, '')
    .replace('  return <div', '  globalThis.handlers={classes,setClasses,save,message,saving};\n  return <div');
  const { code } = await transformWithOxc(source.replace('export default function', 'function') + '\nglobalThis.Screen=PricingSettings;', 'Pricing.jsx', { jsx: { runtime: 'classic' } });
  const slots = []; let cursor = 0, effect, finish; const writes = [];
  const classes = { A: { adjustment: -4, minimum: 200 }, B: { adjustment: 1, minimum: 150 }, C: { adjustment: 25, minimum: 80 } };
  const context = { React, useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef: initial => { const i = cursor++; return slots[i] ||= { current: initial }; }, useEffect: fn => { effect ||= fn; }, getToken: () => 'fixture',
    api: { get: async (url, config) => { assert.ok(url.endsWith('/pricing')); assert.equal(config.headers.Authorization, 'Bearer fixture'); return { data: { classes } }; },
      put: async (url, body) => { writes.push({ url, body }); await new Promise(resolve => { finish = resolve; }); return { data: { classes: body.classes } }; } } };
  vm.createContext(context); vm.runInContext(code, context);
  const render = () => { cursor = 0; context.Screen(); return context.handlers; };
  render(); effect(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(render().classes, classes);
  const first = render().save({ preventDefault() {} }); await render().save({ preventDefault() {} });
  assert.equal(writes.length, 1); assert.deepEqual(JSON.parse(JSON.stringify(writes[0].body)), { classes });
  assert.equal(render().saving, true); finish(); await first; assert.match(render().message, /saved/);
});

test('actual backend customer update accepts omitted/empty email, normalizes provided email and preserves admin requirement', async () => {
  const routes = new Map(); let user, saved;
  const router = Object.fromEntries(['get','put','post','delete'].map(method => [method, (route, ...handlers) => routes.set(`${method} ${route}`, handlers.at(-1))]));
  const dependencies = { express: { Router: () => router }, mongoose: { Types: { ObjectId: { isValid: () => true } } }, bcryptjs: {},
    '../models/User': { findById: async () => user, findOne: async () => null },
    '../middleware/authMiddleware': () => {}, '../middleware/adminMiddleware': () => {}, '../services/accountDeletionService': {} };
  vm.runInNewContext(readFileSync('../backend/routes/userRoutes.js', 'utf8'), { module: { exports: {} }, console, require: name => dependencies[name] });
  async function update(role, body) {
    saved = false; user = { _id: 'fixture', role, save: async () => { saved = true; }, toObject: () => ({ ...user }) };
    let status, response;
    await routes.get('put /admin/:userId')({ params: { userId: 'fixture' }, user: { role: 'admin' }, body }, { status: code => { status = code; return { json: value => { response = value; } }; } });
    return { status, response };
  }
  for (const body of [{ address: 'New address' }, { address: 'New address', email: '' }]) {
    assert.equal((await update('user', body)).status, 200); assert.equal(saved, true); assert.equal(user.address, 'New address'); assert.equal(user.email, undefined);
  }
  assert.equal((await update('user', { email: ' CUSTOMER@EXAMPLE.TEST ' })).status, 200); assert.equal(user.email, 'customer@example.test');
  assert.equal((await update('admin', { email: '' })).status, 400); assert.equal(saved, false);
});
