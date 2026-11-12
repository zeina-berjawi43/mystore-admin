// Run after npm run build. All BStore APIs and WhatsApp windows are mocked locally.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const root = path.resolve('dist'), evidence = path.resolve('.release-check/dashboard-checklist');
fs.mkdirSync(evidence, { recursive: true });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function fixture() {
  const token = 'header.' + btoa(JSON.stringify({ exp: 4102444800, sid: 'fixture', role: 'admin' })) + '.signature';
  Object.entries({ accessToken: token, refreshToken: 'fixture', user: JSON.stringify({ _id: 'admin', role: 'admin' }), rememberMe: 'true', isLoggedIn: 'true' }).forEach(([key, value]) => localStorage.setItem(key, value));
  window.fixtureProducts = location.search.includes('large')
    ? Array.from({ length: 1000 }, (_, i) => ({ productId: String(i), name: 'منتج ' + i, quantity: i + 1, checked: i % 2 === 0 }))
    : [
      { productId: 'z', name: 'Zoo', quantity: 100, checked: true },
      { productId: 'm', name: 'موز', quantity: 90, checked: false },
      { productId: 'b', name: 'banana', quantity: 80, checked: false },
      { productId: 'o', name: 'زيت', quantity: 3, checked: true },
      { productId: 'a', name: 'Apple', quantity: 2, checked: false },
      { productId: 'r', name: 'أرز', quantity: 1, checked: false },
    ];
  window.sharedUrls = []; window.openCount = 0; window.closedCount = 0;
  window.open = () => {
    if (window.blockPopups) return null;
    window.openCount++;
    return { opener: null, close: () => { window.closedCount++; }, location: { replace: url => window.sharedUrls.push(url) } };
  };
  const raw = window.fetch;
  window.fetch = async (input, options = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.includes('mystore-backend')) return raw(input, options);
    const route = new URL(url).pathname;
    let data = {};
    if (route === '/auth/refresh-token') data = { accessToken: token };
    if (route === '/dashboard/statistics') data = { statistics: { confirmedProducts: window.fixtureProducts } };
    if (route.endsWith('/check')) {
      const id = route.split('/').at(-2), body = JSON.parse(options.body);
      const product = window.fixtureProducts.find(row => row.productId === id);
      product.checked = body.checked; data = { product: { ...product } };
    }
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}

const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png' }[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
let chrome, socket;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(evidence, 'chrome-'));
  chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let tabs;
  for (let i = 0; i < 60; i++) {
    try { const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break; } catch { await wait(200); }
  }
  assert.ok(tabs?.some(tab => tab.type === 'page'), 'Headless Chrome started');
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0; const callbacks = new Map(), errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const callback = callbacks.get(message.id); callbacks.delete(message.id); message.error ? callback.reject(Error(JSON.stringify(message.error))) : callback.resolve(message.result); }
    else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; callbacks.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await wait(100); } throw Error('Timed out: ' + expression + '\n' + await evaluate('document.body.innerText')); };
  const names = () => evaluate(`Array.from(document.querySelectorAll('.confirmed-product-name strong'), el => el.textContent)`);
  const share = () => evaluate(`document.querySelector('.whatsapp-share-button').click()`);
  const text = async () => new URL(await evaluate('window.sharedUrls.at(-1)')).searchParams.get('text');
  const toggle = async (name, checked) => {
    await evaluate(`document.querySelector(${JSON.stringify(`[aria-label="Mark ${name} as ${checked ? 'prepared' : 'not prepared'}"]`)}).click()`);
    await until(`Boolean(document.querySelector(${JSON.stringify(`[aria-label="Mark ${name} as ${checked ? 'not prepared' : 'prepared'}"]`)}))`);
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + fixture.toString() + ')()' });
  const url = `http://127.0.0.1:${server.address().port}/dashboard`;
  await send('Page.navigate', { url }); await until(`document.querySelectorAll('.confirmed-product-row').length === 6`);
  const expected = ['أرز', 'زيت', 'موز', 'Apple', 'banana', 'Zoo'];
  assert.deepEqual(await names(), expected);
  await share(); assert.equal(await text(), 'Confirmed Order Products\nأرز × 1\nموز × 90\nApple × 2\nbanana × 80');
  await toggle('Apple', true); await share(); assert.ok(!(await text()).includes('Apple')); assert.deepEqual(await names(), expected);
  await toggle('Apple', false); await share(); assert.ok((await text()).includes('Apple × 2')); assert.deepEqual(await names(), expected);
  for (const name of ['أرز', 'موز', 'Apple', 'banana']) await toggle(name, true);
  const count = await evaluate('window.openCount'); await share();
  await until(`document.querySelector('[role=status]')?.textContent === 'No unchecked products to share.'`);
  assert.equal(await evaluate('window.openCount'), count); assert.equal((await names()).length, 6);
  assert.deepEqual(await evaluate('window.fixtureProducts.map(row => row.quantity)'), [100, 90, 80, 3, 2, 1]);
  await toggle('banana', false); await evaluate('window.blockPopups = true'); await share();
  await until(`Array.from(document.querySelectorAll('a')).some(a => a.textContent === 'Open WhatsApp Share')`);
  const link = await evaluate(`Array.from(document.querySelectorAll('a')).find(a => a.textContent === 'Open WhatsApp Share').href`);
  assert.equal(new URL(link).searchParams.get('text'), 'Confirmed Order Products\nbanana × 80');
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(evidence, 'panel.png'), Buffer.from(screenshot.data, 'base64'));
  await send('Page.navigate', { url: url + '?large' }); await until(`document.querySelectorAll('.confirmed-product-row').length === 1000`); await share();
  await until(`Boolean(document.querySelector('textarea[aria-label="Complete WhatsApp product list"]'))`);
  const large = await evaluate(`document.querySelector('textarea[aria-label="Complete WhatsApp product list"]').value`);
  assert.equal(large.split('\n').length, 501); assert.ok(large.includes('منتج 999 × 1000')); assert.ok(!large.includes('منتج 998 ×'));
  assert.equal(await evaluate('window.sharedUrls.length'), 0); assert.equal(await evaluate('window.closedCount'), 1);
  assert.equal(errors.length, 0);
  console.log('PASS browser: bilingual A–Z, stable check/uncheck ordering, unchanged quantities, unchecked-only WhatsApp text, all-checked guard, blocked popup and large-list text fallbacks; no runtime exceptions. All API and WhatsApp calls mocked.');
} finally {
  socket?.close(); chrome?.kill();
  await new Promise(resolve => server.close(resolve));
}
