const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
// Validate an existing Expo web export; never builds native apps or contacts the API.
const evidence = path.resolve(__dirname, '../../mystore/.navigation-check');
fs.mkdirSync(evidence, { recursive: true });
const root = process.env.BSTORE_WEB_EXPORT ? path.resolve(process.env.BSTORE_WEB_EXPORT) : path.resolve(__dirname,'../dist');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = http.createServer((req, res) => {
  let name = decodeURIComponent(req.url.split('?')[0]);
  if (name === '/fixture.svg') { res.setHeader('Content-Type', 'image/svg+xml'); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#f3cc84"/><rect x="200" width="200" height="300" fill="#e35b3f"/><circle cx="300" cy="150" r="80" fill="#fff"/><text x="300" y="165" font-size="45" text-anchor="middle">BStore</text></svg>'); return; }

  let file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) file = path.join(root,'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf' };
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const mock = () => {
 const token='header.'+btoa(JSON.stringify({exp:4102444800,sid:'fixture',role:'admin'}))+'.signature';
 localStorage.setItem('accessToken',token);localStorage.setItem('refreshToken','fixture');localStorage.setItem('user',JSON.stringify({_id:'admin',role:'admin'}));
 const nativeFetch=window.fetch;window.sentDraft=null;
 window.fetch=async(input,options={})=>{
  const url=typeof input==='string'?input:input.url;if(!url.includes('mystore-backend'))return nativeFetch(input,options);
  const route=new URL(url).pathname;let body={};
  if(route==='/auth/refresh-token')body={accessToken:token};
  if(route==='/admin/send-offer-notification'){window.sentDraft=JSON.parse(options.body);body={sent:1};}
  return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
 };
};
(async () => {
  await new Promise(resolve => server.listen(4175, '127.0.0.1', resolve));
  const profile = fs.mkdtempSync(path.join(evidence, 'ui-ux-chrome-'));
  const chrome = spawn(process.env.BSTORE_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  let socket, id = 0; const callbacks = new Map(), errors = [], checks = [];
  try {
    let tabs;
    for (let attempt = 0; attempt < 60; attempt++) { try { const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]; tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break; } catch { await wait(200); } }
    assert.ok(tabs?.some(tab=>tab.type==='page'), 'Headless Chrome must expose a page');
    socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (message.id) { const pair = callbacks.get(message.id); callbacks.delete(message.id); message.error ? pair.reject(Error(JSON.stringify(message.error))) : pair.resolve(message.result); } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails); });
    const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; callbacks.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
    const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
    const until = async expression => { for (let n = 0; n < 100; n++) { if (await evaluate(expression)) return; await wait(100); } throw Error('Timed out: ' + expression + '\n' + await evaluate('document.body.innerText')); };
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 450, deviceScaleFactor: 1, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: '(' + mock.toString() + ')()' });
    await send('Page.navigate', { url: 'http://127.0.0.1:4175/notifications' });
    await until(`document.body && !!document.querySelector('textarea')`);

    const cases = ['عرض جديد!','BStore offers (20%)!','BStore: مرحباً (20%)! 🎉','عروض BStore: خصم 20% 🎉','(123) طلب #45: شامبو BStore!','🎉 مرحباً (BStore)\nLine 2: 123!','  مرحباً BStore!  '];
    assert.ok(cases.some(text => /\p{Script=Arabic}/u.test(text)));
    assert.ok(cases.some(text => /\p{Extended_Pictographic}/u.test(text)));
    for(const text of cases){
      await evaluate(`(()=>{for(const [selector,value] of [['input[type="text"]',${JSON.stringify(text.replace(/\n/g,' '))}],['textarea',${JSON.stringify(text)}]]){const e=document.querySelector(selector),proto=e.tagName==='INPUT'?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
      await until(`document.querySelector('[aria-label="Notification preview"]').textContent.includes(${JSON.stringify(text)})`);
      const actual=await evaluate(`({value:document.querySelector('textarea').value,dir:document.querySelector('textarea').getAttribute('dir'),direction:getComputedStyle(document.querySelector('textarea')).direction,bidi:getComputedStyle(document.querySelector('textarea')).unicodeBidi})`);
      assert.equal(actual.value,text);assert.equal(actual.dir,'auto');assert.equal(actual.bidi,'plaintext');
      assert.equal(actual.direction,text.startsWith('BStore')?'ltr':'rtl');
      checks.push('Exact bidi draft and preview: '+text);
    }
    const draft=await evaluate(`({title:document.querySelector('input[type="text"]').value,body:document.querySelector('textarea').value})`);
    await evaluate(`document.querySelector('.notification-send-button').click()`);
    await until('window.sentDraft!==null');assert.deepEqual(await evaluate('window.sentDraft'),draft);
    checks.push('Sending preserves exact administrator draft with no bidi controls inserted');
    assert.equal(errors.length,0,JSON.stringify(errors));fs.writeFileSync(path.join(evidence,'phase4-admin-browser-results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
  }finally{socket?.close();chrome.kill();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
