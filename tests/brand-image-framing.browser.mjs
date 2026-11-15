import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { crc32, deflateSync } from 'node:zlib';
import { createServer } from 'vite';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
// Optional read-only download supplied by the caller; never contacts BStore.
const nestleFile = process.argv.find(value => value.startsWith('--nestle-image='))?.slice('--nestle-image='.length);

// Real RGBA fixtures, generated locally without changing any uploaded image.
function transparentLogo(width, height, margin) {
  const chunk = (type, data) => {
    const name = Buffer.from(type), length = Buffer.alloc(4), checksum = Buffer.alloc(4);
    length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, checksum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  for (let y = Math.ceil(height * margin); y < height * (1 - margin); y++) {
    for (let x = Math.ceil(width * margin); x < width * (1 - margin); x++) {
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      pixels.set([220, 30, 70, 255], offset);
    }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

test('Brand editor CSS preserves geometry, gradual zoom, dragging, saved framing and Customer preview; Product unchanged', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bstore-brand-editor-'));
  const pngs = { transparent: transparentLogo(600, 300, .1), margins: transparentLogo(1000, 800, .45) };
  const html = `<!doctype html><html><body><div id="root"></div><script type="module">
    import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
    import Editor from '/src/components/ImageFrameEditor.jsx';import '/src/App.css';import '/src/pages/Products.css';
    window.shape='portrait';window.saved=null;window.instance=0;
    const root=createRoot(document.getElementById('root'));
    function Fixture({brand}) {
      const [value,setValue]=useState(brand ? window.saved ? JSON.parse(window.saved) : null : {zoom:1,x:0,y:0});
      const change=next=>{setValue(next);if(brand)window.frame=next;};if(brand){window.frame=value;window.renderedFrame=JSON.stringify(value);window.rendered=window.instance;}
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
          if (pngs[shape]) { res.setHeader('Content-Type', 'image/png'); res.end(pngs[shape]); return; }
          if (shape === 'nestle' && nestleFile) {
            res.setHeader('Content-Type', 'image/jpeg'); res.end(fs.readFileSync(nestleFile)); return;
          }
          const [width, height] = shape === 'portrait' ? [400, 800] : shape === 'landscape' ? [800, 400]
            : shape === 'wide' ? [2000, 200] : shape === 'tall' ? [200, 2000]
            : shape === 'small' ? [32, 16] : shape === 'large' ? [4096, 2048]
            : shape === 'nestle' ? [515, 388] : [400, 400];
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
      throw Error('Timed out: ' + expression + '; frame=' + JSON.stringify(await evaluate('window.frame')));
    };
    const ready = () => until(`window.rendered===window.instance && document.querySelectorAll('button[aria-label="Zoom in"]').length === 2 && [...document.querySelectorAll('button[aria-label="Zoom in"]')].every(button=>!button.disabled)`);
    const committed = async () => {
      await until('window.renderedFrame===JSON.stringify(window.frame)');
      await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    };
    const saveAndReopen = async frame => {
      await committed();
      await evaluate(`document.querySelector('#save').click()`);
      assert.deepEqual(await evaluate('JSON.parse(window.saved)'), frame, 'Save uses the committed dragged frame');
      await evaluate('window.reopen()'); await ready();
      assert.deepEqual(await evaluate('window.frame'), frame, 'Reopen preserves the saved frame exactly');
    };
    const geometry = id => evaluate(`(() => {
      const box=document.querySelector('#${id} .frame-editor-preview'),img=box.querySelector('img');
      const r=img.getBoundingClientRect(),b=box.getBoundingClientRect(),s=getComputedStyle(img);
      return {width:r.width,height:r.height,box:box.clientWidth,left:r.left-b.left-box.clientLeft,top:r.top-b.top-box.clientTop,
        maxHeight:s.maxHeight,padding:s.padding,border:s.borderWidth,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight};
    })()`);
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1100, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.httpServer.address().port + '/__brand-editor' });
    await ready();
    for (const [shape, aspect] of [['square', 1], ['portrait', 0.5], ['landscape', 2]]) {
      await evaluate(`window.shape=${JSON.stringify(shape)};window.saved=JSON.stringify({zoom:1,x:0,y:0});window.reopen()`); await ready();
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
    await committed();
    const b = await evaluate(`(()=>{const r=document.querySelector('#brand .frame-editor-preview').getBoundingClientRect();return{x:r.x+160,y:r.y+160}})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: b.x, y: b.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x + 25, y: b.y - 30, buttons: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x + 25, y: b.y - 30, button: 'left', clickCount: 1 });
    const frame = await evaluate('window.frame'); assert.ok(frame.x < 0 && frame.y > 0, 'Legacy drag: ' + JSON.stringify({ frame, b }));
    await saveAndReopen(frame);
    const main = await geometry('brand');
    const preview = await evaluate(`(()=>{const box=document.querySelector('#brand .frame-editor-customer-preview'),img=box.querySelector('img'),r=img.getBoundingClientRect(),b=box.getBoundingClientRect();return{width:r.width/box.clientWidth,height:r.height/box.clientHeight,left:(r.left-b.left-box.clientLeft)/box.clientWidth,top:(r.top-b.top-box.clientTop)/box.clientHeight};})()`);
    for (const property of ['width', 'height', 'left', 'top']) assert.ok(Math.abs(preview[property] - main[property] / main.box) < 0.001, property + ' matches Customer square crop');

    // Original fit -> v2 must keep the same scale baseline for every logo shape.
    for (const shape of ['square', 'portrait', 'landscape', 'wide', 'tall', 'small', 'large', 'transparent', 'margins', 'nestle']) {
      await evaluate(`window.shape=${JSON.stringify(shape)};window.saved=null;window.reopen()`); await ready();
      const original = await geometry('brand'), aspect = original.naturalWidth / original.naturalHeight;
      const drawnWidth = original.width * Math.min(1, aspect), drawnHeight = original.height * Math.min(1, 1 / aspect);
      await evaluate(`document.querySelector('#brand button[aria-label="Zoom in"]').click()`);
      await until('window.frame?.version===2 && window.frame.scale===1.1');
      let enlarged = await geometry('brand');
      assert.ok(Math.abs(enlarged.width / drawnWidth - 1.1) < .001, shape + ' first + scales width by exactly 1.1');
      assert.ok(Math.abs(enlarged.height / drawnHeight - 1.1) < .001, shape + ' first + scales height by exactly 1.1');
      assert.equal(await evaluate(`document.querySelector('#brand .frame-editor-controls span').textContent`), '1.10×');
      await evaluate(`document.querySelector('#brand button[aria-label="Zoom in"]').click()`);
      await until('window.frame.scale===1.2');
      await evaluate(`document.querySelector('#brand button[aria-label="Zoom out"]').click()`);
      await until('window.frame.scale===1.1');
      assert.ok(Math.abs((await geometry('brand')).width - enlarged.width) < .05);
      await evaluate(`(()=>{const slider=document.querySelector('#brand input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(slider,'1.11');slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await until('window.frame.scale===1.11');
      await committed();
      assert.equal(await evaluate(`document.querySelector('#brand .frame-editor-controls span').textContent`), '1.11×');
      const point = await evaluate(`(()=>{const r=document.querySelector('#brand .frame-editor-preview').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x + 15, y: point.y - 20, buttons: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x + 15, y: point.y - 20, button: 'left', clickCount: 1 });
      const moved = await evaluate('window.frame'); assert.ok(moved.x < 0 && moved.y > 0);
      await saveAndReopen(moved);
      enlarged = await geometry('brand');
      const small = await evaluate(`(()=>{const b=document.querySelector('#brand .frame-editor-customer-preview'),r=b.querySelector('img').getBoundingClientRect(),p=b.getBoundingClientRect();return{width:r.width/b.clientWidth,height:r.height/b.clientHeight,left:(r.left-p.left-b.clientLeft)/b.clientWidth,top:(r.top-p.top-b.clientTop)/b.clientHeight}})()`);
      for (const key of ['width','height','left','top']) assert.ok(Math.abs(small[key]-enlarged[key]/enlarged.box)<.001, shape + ' saved preview ' + key);
      await evaluate(`[...document.querySelectorAll('#brand button')].find(b=>b.textContent==='Reset / Center').click()`);
      await until('window.frame.scale===1 && window.frame.x===0 && window.frame.y===0');
      await evaluate(`Array.from(document.querySelectorAll('#brand button')).find(b=>b.textContent==='Original fit').click()`);
      await until('window.frame===null');
      assert.ok(Math.abs((await geometry('brand')).width-original.width)<.05);
    }
    console.log('PASS: first-click 10% zoom, slider precision, +/- steps, dragging, reset, original fit and saved previews; Nestle fixture: ' + (nestleFile ? 'actual public image' : '515x388 local SVG'));
    assert.deepEqual(errors, []);
  } finally { socket?.close(); chrome.kill(); await server.close(); }
});
