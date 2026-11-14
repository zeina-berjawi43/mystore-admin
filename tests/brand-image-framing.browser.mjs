import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('Brand editor CSS preserves geometry, gradual zoom, dragging, saved framing and Customer preview; Product unchanged', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bstore-brand-editor-'));
  const html = `<!doctype html><html><body><div id="root"></div><script type="module">
    import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
    import Editor from '/src/components/ImageFrameEditor.jsx';import '/src/App.css';import '/src/pages/Products.css';
    window.shape='portrait';window.saved=null;window.instance=0;
    const root=createRoot(document.getElementById('root'));
    function Fixture({brand}) {
      const [value,setValue]=useState(brand && window.saved ? JSON.parse(window.saved) : {zoom:1,x:0,y:0});
      const change=next=>{setValue(next);if(brand)window.frame=next;};if(brand)window.frame=value;
      return React.createElement('div',{id:brand?'brand':'product',className:brand?'management-form-group':'form-group',style:{width:400}},
        React.createElement(Editor,{src:'/__image/'+window.shape,circle:brand,value,onChange:change,onClear:()=>change(null)}),
        brand && React.createElement('button',{id:'save',onClick:()=>{window.saved=JSON.stringify(value);}},'Save fixture'));
    }
    window.reopen=()=>root.render(React.createElement('div',{style:{display:'flex',gap:40},key:++window.instance},React.createElement(Fixture,{brand:true}),React.createElement(Fixture,{brand:false})));
    window.reopen();
  </script></body></html>`;
  const server = await createServer({ configLoader: 'native', cacheDir: path.join(directory, 'vite'),
    server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'brand-editor-fixture', configureServer(s) {
      s.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/__image/')) {
          const shape = req.url.split('/').pop();
          const [width, height] = shape === 'portrait' ? [400, 800] : shape === 'landscape' ? [800, 400] : [400, 400];
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="coral"/><circle cx="50%" cy="50%" r="90" fill="white"/></svg>`);
          return;
        }
        if (req.url !== '/__brand-editor') return next();
        res.setHeader('Content-Type', 'text/html'); res.end(await s.transformIndexHtml('/__brand-editor', html));
      });
    } }] });
  await server.listen();
  const chrome = spawn(process.env.BSTORE_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'],
    { windowsHide: true, stdio: 'ignore' });
  let socket;
  try {
    let tabs;
    for (let i = 0; i < 60; i++) {
      try {
        const port = fs.readFileSync(path.join(directory, 'DevToolsActivePort'), 'utf8').split('\n')[0];
        tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); break;
      } catch { await wait(100); }
    }
    assert.ok(tabs?.some(tab => tab.type === 'page'), 'Chrome starts');
    socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let id = 0; const callbacks = new Map(), errors = [];
    socket.addEventListener('message', event => {
      const m = JSON.parse(event.data);
      if (m.id) { const p = callbacks.get(m.id); callbacks.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); }
      else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id; callbacks.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params }));
    });
    const evaluate = async expression => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value;
    };
    const until = async expression => {
      for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await wait(100); }
      throw Error('Timed out: ' + expression);
    };
    const ready = () => until(`document.querySelectorAll('button[aria-label="Zoom in"]').length === 2 && [...document.querySelectorAll('button[aria-label="Zoom in"]')].every(button=>!button.disabled)`);
    const geometry = id => evaluate(`(() => {
      const box=document.querySelector('#${id} .frame-editor-preview'),img=box.querySelector('img');
      const r=img.getBoundingClientRect(),b=box.getBoundingClientRect(),s=getComputedStyle(img);
      return {width:r.width,height:r.height,box:box.clientWidth,left:r.left-b.left-box.clientLeft,top:r.top-b.top-box.clientTop,
        maxHeight:s.maxHeight,padding:s.padding,border:s.borderWidth};
    })()`);
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.httpServer.address().port + '/__brand-editor' });
    await ready();
    for (const [shape, aspect] of [['square', 1], ['portrait', 0.5], ['landscape', 2]]) {
      await evaluate(`window.shape=${JSON.stringify(shape)};window.saved=null;window.reopen()`); await ready();
      for (const zoom of [1, 1.1, 1.11, 2, 4]) {
        await evaluate(`for(const slider of document.querySelectorAll('input[aria-label="Image zoom"]')) {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(slider,${JSON.stringify(String(zoom))});
          slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));
        }`);
        await until(`Math.abs(window.frame.zoom-${zoom})<0.0001`);
        for (const id of ['brand', 'product']) {
          const g = await geometry(id);
          assert.ok(Math.abs(g.width / g.height - aspect) < 0.001, `${id} ${shape} ${zoom}: ${JSON.stringify(g)}`);
          assert.ok(Math.abs(g.width - Math.max(1, aspect) * g.box * zoom) < 0.1);
          assert.ok(Math.abs(g.height - Math.max(1, 1 / aspect) * g.box * zoom) < 0.1);
          assert.equal(g.maxHeight, 'none'); assert.equal(g.padding, '0px'); assert.equal(g.border, '0px');
        }
      }
    }
    // Button zoom increments by 0.1; drag still uses normalized travel bounds.
    await evaluate(`window.shape='portrait';window.saved=JSON.stringify({zoom:2,x:0,y:0});window.reopen()`); await ready();
    await evaluate(`document.querySelector('#brand button[aria-label="Zoom in"]').click()`);
    await until('Math.abs(window.frame.zoom-2.1)<0.0001');
    const b = await evaluate(`(()=>{const r=document.querySelector('#brand .frame-editor-preview').getBoundingClientRect();return{x:r.x+160,y:r.y+160}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x + 25, y: b.y - 30, buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x + 25, y: b.y - 30, button: 'left', clickCount: 1 });
    const frame = await evaluate('window.frame'); assert.ok(frame.x < 0 && frame.y > 0);
    await evaluate(`document.querySelector('#save').click();window.reopen()`); await ready();
    assert.deepEqual(await evaluate('window.frame'), frame);
    const main = await geometry('brand');
    const preview = await evaluate(`(()=>{const box=document.querySelector('#brand .frame-editor-customer-preview'),img=box.querySelector('img'),r=img.getBoundingClientRect(),b=box.getBoundingClientRect();return{width:r.width/box.clientWidth,height:r.height/box.clientHeight,left:(r.left-b.left-box.clientLeft)/box.clientWidth,top:(r.top-b.top-box.clientTop)/box.clientHeight};})()`);
    for (const property of ['width', 'height', 'left', 'top']) assert.ok(Math.abs(preview[property] - main[property] / main.box) < 0.001, property + ' matches Customer square crop');
    assert.deepEqual(errors, []);
  } finally { socket?.close(); chrome.kill(); await server.close(); }
});
