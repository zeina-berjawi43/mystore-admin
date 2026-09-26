import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import axios from 'axios';
import { transformWithOxc } from 'vite';
import { createAuthTransport, API_URL } from '../src/utils/auth-transport.js';

const records = [
  { _id: 'customer', firstName: '  Maya ', lastName: ' Haddad  ', phone: '70123456', email: 'maya@example.test', address: 'Beirut', role: 'user', phoneVerified: true, whatsappOtp: '123456', whatsappOtpExpires: '2026-09-26T10:00:00Z' },
  { _id: 'legacy', name: 'Legacy Customer', phone: '03123456', role: 'user', phoneVerified: false },
  { _id: 'admin', name: 'Store Admin', firstName: 'Old', lastName: 'Customer', role: 'admin', email: 'admin@example.test' },
];

// Execute the real backend list handler with an offline database fixture.
// No connection, credentials, real customer reads or writes are involved.
async function backendResponse(users = records) {
  const routes = new Map();
  const router = Object.fromEntries(['get','put','post','delete'].map(method => [method, (route, ...handlers) => routes.set(`${method} ${route}`, handlers.at(-1))]));
  const dependencies = {
    express: { Router: () => router }, mongoose: {}, bcryptjs: {},
    '../models/User': { find: () => ({ select: fields => {
      assert.equal(fields, '-password');
      return { sort: async () => users };
    } }) },
    '../middleware/authMiddleware': () => {}, '../middleware/adminMiddleware': () => {},
    '../services/accountDeletionService': {},
  };
  const context = { module: { exports: {} }, console, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name];
  } };
  vm.runInNewContext(readFileSync(new URL('../../backend/routes/userRoutes.js', import.meta.url), 'utf8'), context);
  let body;
  await routes.get('get /admin/all')({}, { status: status => {
    assert.equal(status, 200); return { json: value => { body = JSON.parse(JSON.stringify(value)); } };
  } });
  return body;
}

const source = readFileSync(new URL('../src/pages/Users.jsx', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?;\s*/gm, '')
  .replace('  if (loading) {', '  globalThis.handlers = { fetchUsers, setSearch, setRoleFilter, setCurrentPage, setPageSize, openEditModal, handleDelete, form, filteredUsers, paginatedUsers };\n  if (loading) {')
  .replace('export default Users;', 'globalThis.Users = Users; globalThis.getUserName = getUserName;');
const { code } = await transformWithOxc(source, 'Users.jsx', { jsx: { runtime: 'classic' } });

async function page(users = records) {
  const body = await backendResponse(users);
  const states = []; let cursor = 0, refreshes = 0, requests = 0, confirmation, pagination;
  let access = 'expired';
  const storage = { getItem: key => key === 'refreshToken' ? 'session' : access,
    commitAccess: (_expected, value) => { access = value; return true; }, clearSession: () => false };
  const transport = createAuthTransport(storage, async (url, init) => {
    if (url.endsWith('/refresh-token')) { refreshes++; return new Response('{"accessToken":"fresh"}'); }
    assert.ok(url.startsWith(`${API_URL}/users/admin/all`)); requests++;
    return new Response(JSON.stringify(body), { status: init.headers.get('Authorization') === 'Bearer fresh' ? 200 : 401 });
  }, () => assert.fail('Unexpected logout'));
  const context = { React, axios: axios.create({ adapter: 'fetch', env: { fetch: transport.fetch, Request: null, Response: null } }),
    sessionStorageAdapter: storage,
    useEffect: () => {},
    useState: initial => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
    Pagination: props => { pagination = props; return null; },
    window: { confirm: message => { confirmation = message; return false; } },
  };
  vm.createContext(context); vm.runInContext(code, context);
  const render = () => { cursor = 0; return renderToStaticMarkup(context.Users()); };
  render(); await context.handlers.fetchUsers();
  return { context, render, body, refreshes: () => refreshes, requests: () => requests, confirmation: () => confirmation, pagination: () => pagination };
}

test('customer name renders from the real list response through Axios refresh/retry', async () => {
  const p = await page(); const html = p.render();
  assert.equal(p.body.users[0].name, undefined);
  assert.match(html, /<strong>Maya Haddad<\/strong>/);
  assert.match(html, /class="user-avatar">M<\/div>/);
  assert.match(html, /<strong>Legacy Customer<\/strong>/);
  assert.match(html, /<strong>Store Admin<\/strong>/);
  for (const value of ['70123456', 'maya@example.test', 'Beirut', '123456']) assert.ok(html.includes(value));
  assert.equal(p.context.handlers.filteredUsers[0].phoneVerified, true);
  assert.equal(p.refreshes(), 1); assert.equal(p.requests(), 2);
  assert.deepEqual(p.body.users, records); // display does not rewrite response fields
});

test('search matches first, last, full and legacy names, email and phone', async () => {
  const p = await page(); p.render();
  for (const [search, id] of [['maya','customer'], ['HADDAD','customer'], ['  Maya Haddad  ','customer'], ['Legacy Customer','legacy'], ['Store Admin','admin'], ['maya@example.test','customer'], ['03123456','legacy']]) {
    p.context.handlers.setSearch(search); p.render();
    assert.deepEqual(Array.from(p.context.handlers.filteredUsers, user => user._id), [id], search);
  }
});

test('role filtering and pagination still operate on the matched customers', async () => {
  const p = await page(); p.render(); p.context.handlers.setRoleFilter('user');
  p.context.handlers.setPageSize(1); p.context.handlers.setCurrentPage(2); p.render();
  assert.equal(p.pagination().totalItems, 2); assert.equal(p.pagination().currentPage, 2);
  assert.equal(p.context.handlers.paginatedUsers[0]._id, 'legacy');
  p.context.handlers.setSearch('Maya'); p.render();
  assert.equal(p.pagination().currentPage, 1); assert.equal(p.context.handlers.paginatedUsers[0]._id, 'customer');
});

test('edit prefill and delete confirmation use the same name without changing other fields', async () => {
  const p = await page(); p.render(); p.context.handlers.openEditModal(records[0]); const html = p.render();
  assert.equal(p.context.handlers.form.name, 'Maya Haddad');
  for (const key of ['email','phone','address','role']) assert.equal(p.context.handlers.form[key], records[0][key]);
  assert.match(html, /name="name" value="Maya Haddad"/);
  await p.context.handlers.handleDelete(records[0]);
  assert.equal(p.confirmation(), 'Are you sure you want to delete "Maya Haddad"?');
  assert.equal(p.requests(), 2); // cancellation issued no delete
});

test('partial, missing and legacy names render safely', async () => {
  const p = await page(); const name = p.context.getUserName;
  assert.equal(name({ firstName: ' Maya ', lastName: null }), 'Maya');
  assert.equal(name({ lastName: ' Haddad ' }), 'Haddad');
  assert.equal(name({ firstName: ' ', lastName: '', name: ' Legacy ' }), 'Legacy');
  assert.equal(name({}), '');
});
