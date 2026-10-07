import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
test('actual Login, Add Admin and customer edit: four independent eyes, values/focus retained, no submissions and responsive CSS', async () => {
  const html = `<!doctype html><html><body><div id="root"></div><script type="module">
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {MemoryRouter} from 'react-router-dom';
    import Login from '/src/pages/Login.jsx';
    import AddAdmin from '/src/pages/AddAdmin.jsx';
    import Users from '/src/pages/Users.jsx';
    import api from '/src/utils/admin-api.js';
    import '/src/App.css';
    window.submissions=0; window.mutations=0;
    document.addEventListener('submit',event=>{window.submissions++;event.preventDefault();},true);
    api.defaults.adapter=async config=>{
      if(config.method!=='get'){window.mutations++;throw Error('Unexpected mutation');}
      return {data:{users:[{_id:'fixture',name:'Fixture Customer',role:'user',email:'fixture@example.test'}]},status:200,statusText:'OK',headers:{},config};
    };
    window.remount=(page='login')=>{if(window.reactRoot)window.reactRoot.unmount();window.reactRoot=createRoot(document.getElementById('root'));
      window.reactRoot.render(React.createElement(MemoryRouter,null,React.createElement({login:Login,add:AddAdmin,users:Users}[page])));};
    window.remount('login');
  </script></body></html>`;
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [{ name: 'password-fixture', configureServer(server) {
    server.middlewares.use(async (req, res, next) => { if(req.url!=='/__password-check')return next();res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__password-check',html)); });
  } }] });
  await server.listen(); const port = server.httpServer.address().port;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bstore-password-'));
  const chrome = spawn(process.env.BSTORE_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { windowsHide:true, stdio:'ignore' });
  let socket, send;
  try {
    let tabs;
    for(let i=0;i<60;i++){try {const debugPort=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];tabs=await(await fetch('http://127.0.0.1:'+debugPort+'/json')).json();break;}catch{await wait(200);}}
    assert.ok(tabs?.length,'Chrome must start');socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
    await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));let id=0;const callbacks=new Map(),errors=[];
    socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const callback=callbacks.get(message.id);callbacks.delete(message.id);message.error?callback.reject(Error(JSON.stringify(message.error))):callback.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
    send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;callbacks.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
    const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
    const until=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await wait(100);}throw Error('Timed out: '+expression+'; exceptions: '+JSON.stringify(errors)+'; page: '+await evaluate('document.body?.innerText'));};
    await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/__password-check'});
    await until(`typeof window.remount==='function'`);
    for(const [page,count] of [['login',1],['add',2],['users',1]]) {
    await evaluate(`window.remount('${page}')`);
    if(page==='users'){await until(`!!document.querySelector('.user-edit-button')`);await evaluate(`document.querySelector('.user-edit-button').click()`);}
    await until(`document.querySelectorAll('.bstore-password-field').length===${count}`);
    if(page==='users') {
      assert.equal(await evaluate(`document.querySelector('input[name="email"]').required`),false);
      await evaluate(`document.querySelector('input[name="email"]').value='';`);
      assert.equal(await evaluate(`document.querySelector('input[name="email"]').checkValidity()`),true);
      await evaluate(`document.querySelector('input[name="email"]').value='invalid-address';`);
      assert.equal(await evaluate(`document.querySelector('input[name="email"]').checkValidity()`),false);
      await evaluate(`document.querySelector('input[name="email"]').value='valid@example.test';`);
      assert.equal(await evaluate(`document.querySelector('input[name="email"]').checkValidity()`),true);
    }
    await evaluate(`window.fields=()=>[...document.querySelectorAll('.bstore-password-field input')];window.eyes=()=>[...document.querySelectorAll('.bstore-password-eye')];window.fields().forEach((input,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'fixture-'+i);input.dispatchEvent(new Event('input',{bubbles:true}));});`);
    assert.equal(await evaluate(`window.fields().every(input=>input.type==='password')`),true);
    const values=await evaluate(`window.fields().map(input=>input.value)`), autocomplete=await evaluate(`window.fields().map(input=>input.autocomplete)`);
    for(let i=0;i<count;i++) {
      await evaluate(`window.fields()[${i}].scrollIntoView({block:'center'});window.fields()[${i}].focus();window.fields()[${i}].setSelectionRange(2,4);`);
      const point=await evaluate(`(()=>{const r=window.eyes()[${i}].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
      await until(`window.fields()[${i}].type==='text'`);await wait(30);
      assert.deepEqual(await evaluate(`window.fields().map(input=>input.type)`),values.map((_value,j)=>j===i?'text':'password'));
      assert.deepEqual(await evaluate(`window.fields().map(input=>input.value)`),values);
      assert.deepEqual(await evaluate(`window.fields().map(input=>input.autocomplete)`),autocomplete);
      const cursor=await evaluate(`({focused:document.activeElement===window.fields()[${i}],start:window.fields()[${i}].selectionStart,end:window.fields()[${i}].selectionEnd})`);
      assert.deepEqual(cursor,{focused:true,start:2,end:4},page+' field '+i+': '+JSON.stringify(cursor));
      assert.equal(await evaluate(`window.eyes()[${i}].getAttribute('aria-label')`),'Hide password');
      await evaluate(`window.eyes()[${i}].click()`);await until(`window.fields()[${i}].type==='password'`);
    }
    for(const width of [320,375,1440]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await wait(80);
      assert.equal(await evaluate(`window.fields().every((input,i)=>{const a=input.getBoundingClientRect(),b=window.eyes()[i].getBoundingClientRect(),s=getComputedStyle(input);return parseFloat(s.paddingRight)>=52 && b.width>=44 && b.height>=44 && b.left>=a.left && b.right<=a.right+1 && Math.abs((a.top+a.bottom-b.top-b.bottom)/2)<1;})`),true);
    }
    assert.equal(await evaluate('window.submissions'),0);assert.equal(await evaluate('window.mutations'),0);
    await evaluate(`window.remount('${page}')`);
    if(page==='users'){await until(`!!document.querySelector('.user-edit-button')`);await evaluate(`document.querySelector('.user-edit-button').click()`);}
    await until(`document.querySelectorAll('.bstore-password-field').length===${count}`);
    assert.equal(await evaluate(`window.fields().every(input=>input.type==='password')`),true);
    }
    assert.deepEqual(errors,[]);console.log('PASS: all four panel password fields, independent visibility, unchanged values/autocomplete, mouse focus/cursor, non-submit eyes, hidden remount and CSS at 320/375/1440px.');
  } finally {
    if(socket?.readyState===WebSocket.OPEN && send) await Promise.race([send('Browser.close').catch(()=>{}),wait(1000)]);
    socket?.close();
    if (chrome.exitCode === null) {
      const exited = new Promise(resolve => chrome.once('exit', resolve));
      chrome.kill();
      await Promise.race([exited, wait(5000)]);
    }
    await server.close();
    if(path.dirname(profile)===path.resolve(os.tmpdir()) && path.basename(profile).startsWith('bstore-password-')) await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
  }
});
