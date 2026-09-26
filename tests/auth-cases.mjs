import assert from 'node:assert/strict';
import { test } from 'node:test';
/* global setImmediate */

const json = (status, value = {}) => new Response(JSON.stringify(value), { status });
const pending = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
export function authCases(label, createAuthTransport, API_URL) {
  const fixture = send => {
    const data = new Map([['accessToken', 'old-access'], ['refreshToken', 'session-a'], ['user', 'admin']]);
    let cleared = 0;
    const storage = {
      getItem: key => data.get(key) ?? null,
      commitAccess(expected, access) { if (data.get('refreshToken') !== expected) return false; data.set('accessToken', access); return true; },
      clearSession(expected) { if ((data.get('refreshToken') ?? null) !== expected) return false; data.clear(); return true; },
    };
    const transport = createAuthTransport(storage, send, () => { cleared++; });
    return { data, transport, cleared: () => cleared, request: (path = '/users') => transport.fetch(API_URL + path, { headers: { Authorization: 'Bearer old-access' } }) };
  };
  test(`${label}: expired access, concurrent and late 401s share one refresh`, async () => {
    let refreshes = 0, retried = 0;
    const delayed = pending();
    const f = fixture(async (url, options) => {
      if (url.endsWith('/refresh-token')) { refreshes++; await tick(); return json(200, { accessToken: 'new-access' }); }
      if (options.headers.get('Authorization') === 'Bearer new-access') { retried++; return json(200); }
      if (url.endsWith('/late')) return delayed.promise;
      return json(401);
    });
    const late = f.request('/late');
    await Promise.all(Array.from({ length: 12 }, () => f.request()));
    delayed.resolve(json(401)); assert.equal((await late).status, 200);
    assert.equal(refreshes, 1); assert.equal(retried, 13); assert.equal(f.cleared(), 0);
  });
  test(`${label}: invalid refresh clears once and never loops`, async () => {
    let refreshes = 0;
    const f = fixture(async url => { if (url.endsWith('/refresh-token')) refreshes++; return json(401); });
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => f.request()));
    assert.ok(results.every(result => result.status === 'rejected'));
    assert.equal(refreshes, 1); assert.equal(f.cleared(), 1); assert.equal(f.data.size, 0);
  });
  for (const status of [429, 503]) test(`${label}: refresh ${status} preserves credentials`, async () => {
    const f = fixture(async url => json(url.endsWith('/refresh-token') ? status : 401));
    await assert.rejects(f.request(), /unavailable/); assert.equal(f.data.get('refreshToken'), 'session-a'); assert.equal(f.cleared(), 0);
  });
  for (const status of [200, 401]) test(`${label}: stale refresh ${status} cannot overwrite/clear replacement login`, async () => {
    const delayed = pending();
    const f = fixture(async url => url.endsWith('/refresh-token') ? delayed.promise : json(401));
    const result = f.request(); await tick();
    f.data.set('refreshToken', 'session-b'); f.data.set('accessToken', 'access-b');
    delayed.resolve(json(status, { accessToken: 'stale-access' }));
    await assert.rejects(result, /Session changed/);
    assert.equal(f.data.get('accessToken'), 'access-b'); assert.equal(f.cleared(), 0);
  });
  for (const status of [200, 401]) test(`${label}: stale API ${status} cannot affect replacement login`, async () => {
    const delayed = pending(); let calls = 0;
    const f = fixture(async () => { calls++; return delayed.promise; });
    const result = f.request(); await tick();
    f.data.set('refreshToken', 'session-b'); f.data.set('accessToken', 'access-b');
    delayed.resolve(json(status)); await assert.rejects(result, /Session changed/);
    assert.equal(calls, 1); assert.equal(f.cleared(), 0); assert.equal(f.data.get('accessToken'), 'access-b');
  });
  test(`${label}: retry 401 stops and logs out once`, async () => {
    let calls = 0;
    const f = fixture(async url => { calls++; return url.endsWith('/refresh-token') ? json(200, { accessToken: 'new-access' }) : json(401); });
    await assert.rejects(f.request(), /Session expired/); assert.equal(calls, 3); assert.equal(f.cleared(), 1);
  });
  test(`${label}: protected auth endpoints refresh; login and foreign URLs do not`, async () => {
    let refreshes = 0;
    const f = fixture(async (url, options) => {
      if (url.endsWith('/refresh-token')) { refreshes++; return json(200, { accessToken: 'new-access' }); }
      return json(new Headers(options.headers).get('Authorization') === 'Bearer new-access' ? 200 : 401);
    });
    assert.equal((await f.request('/auth/add-admin')).status, 200);
    assert.equal((await f.request('/auth/admin/login')).status, 401);
    await f.transport.fetch('https://unrelated.test', { headers: { Authorization: 'external' } });
    assert.equal(refreshes, 1);
  });
  test(`${label}: upload transport shares refresh and preserves reusable body`, async () => {
    let refreshes = 0, sends = 0;
    const f = fixture(async () => { refreshes++; return json(200, { accessToken: 'new-access' }); });
    const body = new FormData(); body.append('image', 'mock-image');
    const upload = f.transport.withFetch(async (_url, init) => { sends++; assert.equal(init.body, body); return json(sends === 1 ? 401 : 200); });
    assert.equal((await upload(API_URL + '/upload/image', { method: 'POST', body, headers: { Authorization: 'Bearer old-access' } })).status, 200);
    assert.equal(refreshes, 1); assert.equal(sends, 2);
  });
  test(`${label}: logout clears before revocation and cannot resurrect from pending refresh`, async () => {
    const delayed = pending(); let revoked;
    const f = fixture(async (url, options) => {
      if (url.endsWith('/logout')) { revoked = JSON.parse(options.body).refreshToken; assert.equal(f.data.size, 0); return json(200); }
      return delayed.promise;
    });
    const refresh = f.transport.refresh('session-a'); await tick();
    await f.transport.logout(); delayed.resolve(json(200, { accessToken: 'late' }));
    await assert.rejects(refresh, /Session changed/);
    assert.equal(revoked, 'session-a'); assert.equal(f.data.size, 0); assert.equal(f.cleared(), 1);
  });
  test(`${label}: shared refresh lock coordinates separate client instances`, async () => {
    let access = 'expired', refreshes = 0, lock = Promise.resolve();
    const storage = {
      getItem: key => key === 'refreshToken' ? 'session-a' : access,
      commitAccess: (_expected, value) => { access = value; return true; }, clearSession: () => false,
      withRefreshLock(operation) { const result = lock.then(operation); lock = result.catch(() => {}); return result; },
    };
    const send = async () => { refreshes++; await tick(); return json(200, { accessToken: 'new-access' }); };
    const a = createAuthTransport(storage, send, () => {}), b = createAuthTransport(storage, send, () => {});
    assert.deepEqual(await Promise.all([a.refresh('session-a'), b.refresh('session-a')]), ['new-access','new-access']);
    assert.equal(refreshes, 1);
  });
}
