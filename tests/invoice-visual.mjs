// Render the production invoice templates in installed Chrome, without API access.
// Run: node tests/invoice-visual.mjs [before|after]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithOxc } from 'vite';
import assert from 'node:assert/strict';
const root = path.resolve('..'), out = path.join(root, '.invoice-acceptance', process.argv[2] || 'after');
fs.mkdirSync(out, { recursive: true });
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'admin-panel/public/splash-logo-removebg-preview.png')).toString('base64');
let source = read('admin-panel/src/pages/Invoice.jsx').replace(/^import[\s\S]*?;\s*/gm, '').replace('export default Invoice;', 'globalThis.layouts = [ThermalPrintLayout, ThermalPreview, A4Preview];');
const context = { React };
vm.runInNewContext((await transformWithOxc(source, 'Invoice.jsx', { jsx: { runtime: 'classic' } })).code, context);
const require = createRequire(path.join(root, 'admin-app/package.json'));
const ts = require('typescript');
const { harness } = require('./scripts/check-admin.cjs');
const thermal = harness('src/services/thermal-invoice.ts').exports;
const usb = harness('src/services/usb-invoice.ts', [], { dependencies: { './thermal-invoice': thermal } }).exports;
const nativeReact = require('react');
const nativeServer = require('react-dom/server');
const nativeWeb = require('react-native-web');
const appLogo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'admin-app/assets/images/logo.png')).toString('base64');
function nativePreview(props, format) {
 const h=harness('src/app/invoices/[invoiceId].tsx', ['setInvoice','setLoading','setFormat','setPreviewOpen','setNotes','setDiscountPercent','setCopyType']);
 const state=h.render().handlers;state.setInvoice({...props.invoice,status:'Draft'});state.setLoading(false);state.setFormat(format);state.setPreviewOpen(true);state.setNotes(props.notes);state.setDiscountPercent(String(props.totals.discount));state.setCopyType(props.copyType);
 const find=n=>{if(!n||typeof n!=='object')return null; if(n.props?.style?.width===(format==='A4'?794:302.36))return n;return (n.props?.children||[]).flat(Infinity).map(find).find(Boolean);};
 const surface=find(h.render().tree);if(!surface)throw Error('Native document surface not found');
 const convert=n=>{
  if(n==null||typeof n!=='object')return n;
  const p={...n.props};delete p.children;
  if(typeof n.type==='function')return convert(n.type(n.props));
  const type=n.type==='Fragment'?nativeReact.Fragment:n.type==='Text'?nativeWeb.Text:n.type==='View'?nativeWeb.View:nativeWeb.Image;
  if(type===nativeWeb.Image)p.source={uri:appLogo};
  return nativeReact.createElement(type,p,...(n.props?.children||[]).flat(Infinity).map(convert));
 };
 nativeWeb.AppRegistry.registerComponent('InvoiceAcceptance',()=>()=>convert(surface));
 const application=nativeWeb.AppRegistry.getApplication('InvoiceAcceptance',{});
 return `<html><head>${nativeServer.renderToStaticMarkup(application.getStyleElement())}</head><body style="margin:0">${nativeServer.renderToStaticMarkup(application.element)}</body></html>`;
}
const appSource = read('admin-app/src/app/invoices/[invoiceId].tsx');
const ast = ts.createSourceFile('invoice.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const helpers = new Set(['formatPrice','formatDate','getCustomerName','getItemQuantity','getItemPrice','escapeHtml','getLogoUri','buildInvoiceHtml','THERMAL_PREVIEW_COLUMNS']);
const selected = ast.statements.filter(n => ts.isVariableStatement(n) && n.declarationList.declarations.some(d => helpers.has(d.name.getText(ast))));
const app = { exports: {}, ...thermal, Image: { resolveAssetSource: () => ({ uri: appLogo }) }, LOGO: 1, console };
vm.runInNewContext(ts.transpileModule(selected.map(n => n.getText(ast)).join('\n') + '\nexports.build = buildInvoiceHtml;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, app);
const css = ['admin-panel/src/App.css','admin-panel/src/pages/Invoice.css'].map(read).join('\n');
const cases = [];
for (const count of [1, 4, 35]) for (const discount of [0, 10.5]) {
 const items = Array.from({length:count}, (_,i) => ({_id:String(i), productName:i%3===1?'Very long product name premium family selection with additional specifications and packaging details '+ 'LongWord'.repeat(6):`Product ${i+1} - Coffee`,quantity:[1,99,999][i%3],price:[.98,14.45,999.99][i%3]}));
 const subtotal=items.reduce((sum,item)=>sum+item.quantity*item.price,0);
 const props={invoice:{invoiceNumber:'INV-2026-000012345',createdAt:'2026-09-27T14:30:00Z',customer:{firstName:'John',lastName:count===1?'Smith':'Smith with a very long customer family name for acceptance',phone:'+961 70 123456',email:count===1?'':'customer.acceptance@example.com',address:'Building 123, Long Street, Apartment 45, Beirut, Lebanon. '.repeat(count===1?1:3)},items},totals:{subtotal,discount,discountAmount:subtotal*discount/100,total:subtotal*(1-discount/100)},notes:count===1?'':'Deliver carefully. Long notes remain fully printable. '.repeat(5),copyType:discount?'Store':'Customer',showDiscount:true};
 for(const format of ['80mm','A4']) for(const mode of ['preview','print']) {
  const html=renderToStaticMarkup(React.createElement(context.layouts[format==='A4'?2:mode==='print'?0:1],props)).replaceAll('/splash-logo-removebg-preview.png',logo);
  const wrapper=mode==='print'?`<div class="invoice-page invoice-page-${format.toLowerCase()}">${format==='A4'?'<div class="invoice-a4-print">':''}${html}${format==='A4'?'</div>':''}</div>`:`<div class="invoice-preview-modal ${format==='A4'?'a4':'thermal'}"><div class="invoice-preview-paper ${format==='A4'?'a4':'thermal'}-preview-paper">${html}</div></div>`;
  cases.push({name:`panel-${format}-${mode}-${count}-${discount}`,format,mode,html:`<html><head><style>${css}</style></head><body>${wrapper}</body></html>`});
 }
 for(const format of ['A4','80mm']) cases.push({name:`app-${format}-print-${count}-${discount}`,format,mode:'print',html:app.exports.build({...props,format})});
 if(count===4) for(const format of ['A4','80mm']) cases.push({name:`app-native-web-${format}-preview-${count}-${discount}`,format,mode:'preview',html:nativePreview(props,format)});
 if(count===4) {
  const receipt={...props.invoice,customer:{...props.invoice.customer,name:'John '+props.invoice.customer.lastName},items:items.map(i=>({name:i.productName,quantity:i.quantity,price:i.price})),date:'Sep 27, 2026',totals:props.totals,notes:props.notes,copyType:props.copyType,showDiscount:true};
  const text=thermal.buildThermalInvoice(receipt);
  fs.writeFileSync(path.join(out,`bluetooth-${discount}.txt`),text);
  fs.writeFileSync(path.join(out,`usb-${discount}.bin`),Buffer.from(usb.buildUsbInvoice(receipt)));
  const lines=text.trimEnd().split('\n').map(line=>{
   const align=line.startsWith('[C]')?'center':line.startsWith('[R]')?'right':'left';
   if(line.startsWith('[L]')&&line.includes('[R]')){const [l,r]=line.slice(3).split('[R]');line=l+' '.repeat(Math.max(1,42-l.replace(/<[^>]+>/g,'').length-r.replace(/<[^>]+>/g,'').length))+r;}
   return `<div style="text-align:${align};${line.includes('size="tall"')?'line-height:2;transform-origin:left center;':''}">${line.replace(/\[[LCR]\]/g,'').replace(/<font size="tall">/g,'<span style="display:inline-block;transform:scaleY(1.6)">').replace(/<font size="normal">/g,'<span>').replace(/<\/font>/g,'</span>')}</div>`;
  }).join('');
  cases.push({name:`escpos-text-simulation-4-${discount}`,format:'80mm',mode:'preview',html:`<html><body style="margin:0;background:white"><div style="box-sizing:border-box;width:80mm;padding:6mm 4mm 16mm;font:10.8px/1.35 monospace;white-space:pre">${lines}</div></body></html>`});
 }
}
const browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9335',`--user-data-dir=${path.join(root,'.invoice-acceptance/chrome-profile')}`,'about:blank'], {windowsHide:true,stdio:'ignore'});
try {
 let tabs; for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9335/json')).json();break;}catch{await new Promise(r=>setTimeout(r,250));}}
 if(!tabs) throw Error('Chrome did not start');
 const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await send('Page.enable');
 const results=[];
 for(const c of cases){
  const file=path.join(out,c.name+'.html');fs.writeFileSync(file,c.html);
  await send('Emulation.setDeviceMetricsOverride',{width:c.format==='A4'?794:303,height:1200,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{media:c.mode==='print'?'print':'screen'});
  await send('Page.navigate',{url:pathToFileURL(file).href});
  for(let i=0;i<80;i++) { const ready=await send('Runtime.evaluate',{expression:`location.href === ${JSON.stringify(pathToFileURL(file).href)} && document.readyState === 'complete'`,returnByValue:true}); if(ready.result.value)break;await new Promise(r=>setTimeout(r,50)); }
  await send('Runtime.evaluate',{expression:'Promise.all([document.fonts.ready, ...[...document.images].map(i=>i.decode().catch(()=>{}))])',awaitPromise:true});
  const metrics=await send('Runtime.evaluate',{expression:`JSON.stringify([...document.querySelectorAll('[class*="product"],[class*="number"],[class*="summary"],[class*="total"],[class*="header"]')].filter(e=>e.getBoundingClientRect().width).map(e=>({cls:e.className,text:e.innerText?.slice(0,90),x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,scroll:e.scrollWidth,client:e.clientWidth,font:getComputedStyle(e).fontSize,columns:getComputedStyle(e).gridTemplateColumns})))`,returnByValue:true});
  results.push({name:c.name,metrics:JSON.parse(metrics.result.value)});
  if(process.argv[2]!=='before') {
   const validation=await send('Runtime.evaluate',{expression:`JSON.stringify((()=>{
     const surface=document.querySelector('.invoice-thermal-print,.a4-preview-content,.thermal-page,.a4-page');if(!surface)return {};
     const bounds=surface.getBoundingClientRect(),style=getComputedStyle(surface),bad=[];
     const safeLeft=bounds.left+parseFloat(style.paddingLeft),safeRight=bounds.right-parseFloat(style.paddingRight);
     const walker=document.createTreeWalker(surface,NodeFilter.SHOW_TEXT);let text;
     while(text=walker.nextNode()){if(!text.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(text);for(const r of range.getClientRects())if(r.width && (r.left<safeLeft-1||r.right>safeRight+1))bad.push(text.textContent.trim());}
     const heading=surface.querySelector('.thermal-print-products-head,.thermal-product-header,.a4-preview-products-head,.a4-table-header');
     const qty=heading&&[...heading.children].find(e=>/^qty$/i.test(e.textContent.trim()));
     let qtyLines=0;if(qty){const range=document.createRange();range.selectNodeContents(qty);qtyLines=[...range.getClientRects()].filter(r=>r.width).length;}
     const summary=surface.querySelector('.thermal-print-summary,.totals,.a4-preview-summary,.a4-summary');
     const rows=surface.querySelectorAll('.thermal-print-product-row,.thermal-product-row,.a4-preview-product-row,.a4-table-row');
     return {bad,qtyLines,summaryAfterProducts:!rows.length||summary.getBoundingClientRect().top>=rows[rows.length-1].getBoundingClientRect().bottom-1,images:[...surface.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)};
   })())`,returnByValue:true});
   const checks=JSON.parse(validation.result.value);results.at(-1).checks=checks;
   if(checks.bad){assert.deepEqual(checks.bad,[],c.name+' text beyond document edges');assert.equal(checks.qtyLines,1,c.name+' QTY must fit one line');assert.equal(checks.summaryAfterProducts,true,c.name+' totals must follow final product');assert.equal(checks.images,true,c.name+' missing logo');}
  }
  const layout=await send('Page.getLayoutMetrics');const height=Math.min(16000,Math.ceil(layout.cssContentSize.height));
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:c.format==='A4'?794:303,height,scale:1}});
  fs.writeFileSync(path.join(out,c.name+'.png'),Buffer.from(shot.data,'base64'));
  if(c.mode==='print'){const pdf=await send('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,paperWidth:c.format==='A4'?8.2677:3.1496,paperHeight:11.6929,marginTop:0,marginBottom:0,marginLeft:0,marginRight:0});fs.writeFileSync(path.join(out,c.name+'.pdf'),Buffer.from(pdf.data,'base64'));}
 }
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(results,null,2));
 console.log(`Rendered ${cases.length} production-template cases to ${out}`);
 await send('Browser.close');ws.close();
} finally {browser.kill();}
