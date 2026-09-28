// Full production editor + modal in Chrome, offline API fixture only.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import assert from 'node:assert/strict';
const root=path.resolve('..'), out=path.join(root,'.invoice-acceptance/professional');
const invoice={_id:'fixture',status:'Draft',invoiceNumber:'INV-2026-000012345',createdAt:'2026-09-27T14:30:00Z',format:'80mm',copyType:'Customer',notes:'Saved notes',discountPercent:0,customer:{firstName:'John',lastName:'Smith',email:'customer@example.test',phone:'+96170123456',address:'Beirut'},items:Array.from({length:4},(_,i)=>({_id:String(i),productName:i===1?'Long product name '.repeat(10):`Product ${i+1}`,quantity:1,price:12.5}))};
const entry=path.resolve('node_modules/.cache/invoice-acceptance-entry.jsx');fs.mkdirSync(path.dirname(entry),{recursive:true});
fs.writeFileSync(entry,`import React from 'react';import {createRoot} from 'react-dom/client';import Invoice from '${path.resolve('src/pages/Invoice.jsx').replaceAll('\\','/')}';createRoot(document.getElementById('root')).render(<Invoice/>);`);
const result=await build({configFile:false,logLevel:'error',define:{'process.env.NODE_ENV':'"production"'},build:{write:false,lib:{entry,name:'InvoiceUI',formats:['iife']},minify:false},plugins:[react(),{
 name:'offline-invoice-ui',
 transform(code,id){if(id.endsWith('/src/pages/Invoice.jsx'))return {code:code.replace(/import\s*\{\s*useNavigate,\s*useParams,?\s*\}\s*from "react-router-dom";/,`const useNavigate=()=>()=>{};const useParams=()=>({invoiceId:'fixture'});`).replace('import axios from "../utils/admin-api";',`const axios={get:async()=>({data:{invoice:globalThis.__invoiceFixture || ${JSON.stringify(invoice)}}}),post:async()=>{throw Error('Writes disabled in acceptance')},put:async()=>{throw Error('Writes disabled in acceptance')}};`),map:null};}
}]});
const outputs=(Array.isArray(result)?result[0]:result).output;const js=outputs.find(x=>x.type==='chunk').code,css=outputs.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>x.source).join('\n');
const logo='data:image/png;base64,'+fs.readFileSync('public/splash-logo-removebg-preview.png').toString('base64');
const file=path.join(out,'panel-editor-interactive.html');
fs.writeFileSync(path.join(out,'panel-editor-bundle.js'),js.replaceAll('/splash-logo-removebg-preview.png',logo));
fs.writeFileSync(file,`<!doctype html><html><head><title>admin-panel</title><style>${fs.readFileSync('src/App.css','utf8')}\n${css}</style></head><body><div id="root"></div><script src="panel-editor-bundle.js"></script></body></html>`);
const browser=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9336',`--user-data-dir=${path.join(root,'.invoice-acceptance/chrome-ui-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')console.error(JSON.stringify(m.params));if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const click=async label=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);await new Promise(r=>setTimeout(r,80));};
 const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:`sessionStorage.setItem('rememberMe','false');sessionStorage.setItem('accessToken','offline-fixture-token');`});await send('Emulation.setDeviceMetricsOverride',{width:1200,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:pathToFileURL(file).href});
 for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('textarea')`))break;await new Promise(r=>setTimeout(r,80));}
 assert.equal(await evaluate(`!!document.querySelector('textarea')`),true,'production editor loaded');
 await evaluate('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');
 const hidden=()=>evaluate(`[...document.querySelectorAll('.invoice-page > .invoice-thermal-print,.invoice-page > .invoice-a4-print')].every(e=>getComputedStyle(e).display==='none')`);
 assert.equal(await hidden(),true,'print-only copies must be hidden on normal editor');
 assert.equal(await evaluate(`!!document.querySelector('.invoice-preview-overlay')`),false);
 await shot('panel-editor-only');
 await evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Unsaved acceptance notes');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 for(const [selector,value] of [['.invoice-edit-input.quantity','3'],['.invoice-price-input input','20'],['.invoice-discount-row input','10']]) {
   await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   await new Promise(r=>setTimeout(r,40));
 }
 await click('Store Copy');
 for(const format of ['80mm','A4']){
   if(format==='A4')await click('A4');
   await click('Preview');
   const text=await evaluate(`document.querySelector('.invoice-preview-paper').innerText`);
   for(const expected of ['Unsaved acceptance notes','Store Copy','John Smith','customer@example.test','Thank you','05:30 PM','Discount (10%)','$97.50','$87.75','$20.00'])assert.ok(text.includes(expected),format+' '+expected);
   assert.equal(await evaluate(`(()=>{const e=document.querySelector('.invoice-preview-body');return ['auto','scroll'].includes(getComputedStyle(e).overflowY)})()`),true,'modal scrolls');
   const same=await evaluate(`(()=>{const modal=document.querySelector('.invoice-preview-paper').textContent;const print=document.querySelector(${JSON.stringify(format==='A4'?'.invoice-a4-print':'.invoice-page > .invoice-thermal-print')});return modal===print.textContent})()`);
   assert.equal(same,true,'modal and print same invoice data');await shot('panel-modal-'+format);
   await click('Close');assert.equal(await evaluate(`document.querySelector('textarea').value`),'Unsaved acceptance notes');assert.equal(await hidden(),true);
 }
 // Clearing a saved note must not resurrect it in either shared template.
 await evaluate(`(()=>{const e=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await click('Preview');assert.equal(await evaluate(`document.querySelector('.invoice-preview-paper').innerText.includes('Saved notes')`),false);
 await evaluate(`document.querySelector('[aria-label="Close invoice preview"]').click()`);await new Promise(r=>setTimeout(r,80));
 assert.equal(await evaluate(`!!document.querySelector('.invoice-preview-overlay')`),false);
 // Exercise the actual downloaded PDF flow, including image capture and jsPDF.
 await evaluate(`window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async blob=>{window.__savedPdf=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});},close:async()=>{}})})`);
 await click('Save as PDF');
 for(let i=0;i<200;i++){if(await evaluate('!!window.__savedPdf'))break;await new Promise(r=>setTimeout(r,100));}
 const pdf=await evaluate('window.__savedPdf');assert.ok(pdf,'downloaded PDF created: '+await evaluate('document.body.innerText.slice(0,500)'));fs.writeFileSync(path.join(out,'panel-A4-download-4.pdf'),Buffer.from(pdf,'base64'));
 const long={...invoice,format:'A4',items:Array.from({length:35},(_,i)=>({...invoice.items[i%4],_id:String(i)}))};
 const picker=await evaluate('String(window.showSaveFilePicker)');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__invoiceFixture=${JSON.stringify(long)};window.showSaveFilePicker=${picker};`});
 await send('Page.reload');await new Promise(r=>setTimeout(r,700));await click('Save as PDF');
 for(let i=0;i<200;i++){if(await evaluate('!!window.__savedPdf'))break;await new Promise(r=>setTimeout(r,100));}
 const longPdf=await evaluate('window.__savedPdf');assert.ok(longPdf,'long downloaded PDF created');fs.writeFileSync(path.join(out,'panel-A4-download-35.pdf'),Buffer.from(longPdf,'base64'));
 fs.writeFileSync(path.join(out,'ui-checks.json'),JSON.stringify({editorOnly:true,sharedTemplates:true,modalScroll:true,closeRetainsEdits:true,clearedNotesStayCleared:true},null,2));
 console.log('PASS full editor: hidden print copies; A4/80mm shared modal; scroll; Close/X; unsaved notes and Store Copy; cleared notes.');
 await send('Browser.close');
}finally{ws?.close();browser.kill();}


