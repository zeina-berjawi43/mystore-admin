import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { sortChecklistProducts, uncheckedChecklistText } from '../src/utils/dashboard-checklist.js';

test('WhatsApp action shares only current unchecked products without checkbox writes and preserves large-list fallback',async()=>{
  const source=readFileSync('src/pages/Dashboard.jsx','utf8').replace(/\r\n/g,'\n');
  const start=source.indexOf('const shareConfirmedProducts =');
  const code=source.slice(start,source.indexOf('\n  };',start)+5).replace('const shareConfirmedProducts','globalThis.share');
  let opened='',closed=false,copied='',requests=0;
  const ctx={shareBusy:false,checkingProductId:null,statistics:{confirmedProducts:[{name:'Prepared A',quantity:3,checked:true},{name:'Unprepared B',quantity:2,checked:false}]},sortChecklistProducts,uncheckedChecklistText,setShareBusy(){},setShareMessage(){},setShareText:value=>{copied=value;},
    window:{open:()=>({opener:null,close:()=>{closed=true;},location:{replace:url=>{opened=url;}}})},
    sessionStorageAdapter:{getItem:()=> 'fixture'},API_URL:'https://fixture',
    axios:{get:async url=>{requests++;assert.equal(url,'https://fixture/dashboard/confirmed-products/share');return{data:{text:'Prepared A × 3\nUnprepared B × 2'}};}}};
  vm.runInNewContext(code,ctx);await ctx.share();assert.equal(requests,0);
  assert.equal(new URL(opened).searchParams.get('text'),'Confirmed Order Products\nUnprepared B × 2');assert.equal(closed,false);
  ctx.statistics={confirmedProducts:[{name:'x'.repeat(10000),quantity:1,checked:false}]};await ctx.share();assert.ok(copied.includes('x'.repeat(10000)));assert.equal(closed,true);
  // No PUT/POST methods or preparation-state setters exist in this fixture.
});

test('bidi inputs and preview use browser direction without reversing or inserting control characters',()=>{
  const code=readFileSync('src/pages/Notifications.jsx','utf8');
  assert.ok((code.match(/dir="auto"/g)||[]).length>=4);
  assert.ok(code.includes("unicodeBidi: 'plaintext'"));assert.ok(code.includes("whiteSpace: 'pre-wrap'"));
  assert.ok(code.includes('setBody(event.target.value)'));assert.ok(!code.includes('.reverse()'));
});
