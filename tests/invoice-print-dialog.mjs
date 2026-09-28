// Actual Chromium print-preview UI. All Render-origin requests are intercepted
// and fulfilled from offline fixtures; this never contacts the live application.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';
const root=path.resolve('..'),out=path.join(root,'.invoice-acceptance/professional');
const format=process.argv[2] || '80mm';
const headers=process.argv[3] !== 'off';
const profile=path.join(root,'.invoice-acceptance/chrome-print-dialog');
fs.mkdirSync(path.join(profile,'Default'),{recursive:true});
fs.writeFileSync(path.join(profile,'Default/Preferences'),JSON.stringify({printing:{print_preview_sticky_settings:{appState:JSON.stringify({version:2,recentDestinations:[{id:'Save as PDF',origin:'local',account:''}],selectedDestinationId:'Save as PDF',isHeaderFooterEnabled:headers})}}}));
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=9337',`--user-data-dir=${profile}`,'--window-position=0,0','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-features=CalculateNativeWinOcclusion','--window-size=1200,1000','about:blank'],{windowsHide:true,stdio:'ignore'});
const sockets=[];
async function connect(url){const ws=new WebSocket(url);sockets.push(ws);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const events=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else events.forEach(fn=>fn(m));};return {send:(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));}),events};}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:9337/json')).json();break;}catch{await pause(100);}}
 const page=await connect(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await page.send('Page.enable');await page.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 page.events.push(m=>{if(m.method==='Fetch.requestPaused'){const url=m.params.request.url;const name=url.endsWith('.js')?'panel-editor-bundle.js':'panel-editor-interactive.html';page.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:(name.endsWith('.js')?'text/javascript':'text/html')+'; charset=utf-8'}],body:fs.readFileSync(path.join(out,name)).toString('base64')});}});
 await page.send('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('rememberMe','false');sessionStorage.setItem('accessToken','offline-fixture-token');`});
 await page.send('Page.navigate',{url:'https://mystore-admin.onrender.com/invoices/offline-acceptance'});await pause(1800);
 await page.send('Page.bringToFront');
 if(format==='A4'){await page.send('Runtime.evaluate',{expression:`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='A4').click()`});await pause(200);}
 page.send('Runtime.evaluate',{expression:`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Print').click()`,userGesture:true}).catch(()=>{});
 let tab;for(let i=0;i<100;i++){tabs=await(await fetch('http://127.0.0.1:9337/json')).json();tab=tabs.find(t=>t.url==='chrome://print/');if(tab)break;await pause(100);}
 if(!tab){console.log(await page.send('Runtime.evaluate',{expression:`JSON.stringify({text:document.body.innerText.slice(0,700),rule:document.getElementById('receipt-page-size')?.textContent,print:String(window.print)})`,returnByValue:true}));console.log(tabs.map(t=>({type:t.type,url:t.url})));throw Error('Chromium print-preview target did not open');}
 const preview=await connect(tab.webSocketDebuggerUrl);await preview.send('Page.enable');await pause(2500);
 const states=[];
 for(const enabled of [headers]){
  const result=await preview.send('Runtime.evaluate',{expression:`(()=>{const app=document.querySelector('print-preview-app');app.setSetting('headerFooter',${enabled});const s=app.getSetting('headerFooter');return JSON.stringify({headerFooter:s,document:app.documentInfo_,title:document.title})})()`,returnByValue:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  await pause(1500);states.push({enabled,result:result.result.value});
  const shot=await preview.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`chromium-${format}-print-dialog-headers-${enabled?'on':'off'}.png`),Buffer.from(shot.data,'base64'));
 }
 fs.writeFileSync(path.join(out,`chromium-${format}-headers-${headers?'on':'off'}.json`),JSON.stringify(states,null,2));
 console.log(`Captured actual chrome://print/ ${format}, Headers and footers ${headers?'ON':'OFF'}, intercepted offline Render-origin fixture.`);
 await page.send('Browser.close');
}finally{sockets.forEach(s=>s.close());browser.kill();}

