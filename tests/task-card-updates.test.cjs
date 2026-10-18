const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const {createRequire}=require('node:module');
let playwright;
try{playwright=require('playwright');}catch{
 const bundled=createRequire('C:/Users/jensc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/');
 playwright=bundled('playwright');
}
const {chromium}=playwright;
(async()=>{
 const original=fs.readFileSync(path.join(root,'index.html'),'utf8');
 let fixture=original.replace('<script src="firebase-config.js"></script>','<script>window.CAP_FIREBASE={enabled:false};</script>').replace(/<script type="module" src="cloud-sync.js[^\"]*"><\/script>/,'');
 // 隔離測試直接載入本次實際檔案，免連線伺服器或家庭資料庫。
 for(const file of ['scheduler.js','record-ids.js','task-card-updates.js'])fixture=fixture.replace(new RegExp('<script src="'+file.replaceAll('.','\\.')+'(?:\\?[^\"]*)?"></script>'),()=>'<script>'+fs.readFileSync(path.join(root,file),'utf8')+'</script>');
 let browser;
 try{
  const installed='C:/Program Files/Google/Chrome/Application/chrome.exe';
  const executablePath=process.env.CAP_TEST_CHROME||(fs.existsSync(installed)?installed:undefined);
  browser=await chromium.launch({headless:true,executablePath});
  for(const viewport of [{width:1200,height:900},{width:390,height:844}]){
   const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent(fixture);
   await page.locator('#day').fill('2026-10-15');await page.locator('#day').dispatchEvent('change');
   await page.evaluate(()=>{
    window.fixtureData={records:{},days:{'2026-10-15':{homeworkDone:true}}};
    window.capCloud={writeRecord:async()=>{},writeDay:async()=>{}};
    window.capUI.cloudState('student',window.fixtureData);
    window.fixtureCard=document.querySelector('#cards [data-id]');
   });
   const card=page.locator('#cards [data-id]').first();
   await card.locator('details summary').click();
   for(const field of ['read','practice','correct']){
    const box=card.locator(`[data-field="${field}"]`);
    await box.scrollIntoViewIfNeeded();await box.check();
    const before=await page.evaluate(field=>({scroll:scrollY,top:document.querySelector(`[data-field="${field}"]`).getBoundingClientRect().top}),field);
    await page.evaluate(field=>{
     const id=window.fixtureCard.dataset.id;
     window.fixtureData.records[id]={...(window.fixtureData.records[id]||{}),[field]:true};
     window.capUI.cloudState('student',window.fixtureData);
    },field);
    const after=await page.evaluate(field=>({scroll:scrollY,top:document.querySelector(`[data-field="${field}"]`).getBoundingClientRect().top,same:window.fixtureCard===document.querySelector('#cards [data-id]'),open:window.fixtureCard.querySelector('details').open,checked:window.fixtureCard.querySelector(`[data-field="${field}"]`).checked,focused:document.activeElement===window.fixtureCard.querySelector(`[data-field="${field}"]`),notes:document.querySelectorAll('#stats .notice').length}),field);
    assert.equal(after.same,true);assert.equal(after.open,true);assert.equal(after.checked,true);assert.equal(after.focused,true);assert.equal(after.notes,1);
    assert.ok(Math.abs(after.scroll-before.scroll)<=1,'同步後捲動位置改變');
    assert.ok(Math.abs(after.top-before.top)<=1,'同步後勾選框位置改變');
   }
   const note=card.locator('textarea');await note.fill('尚未送出的停點');
   await page.evaluate(()=>window.capUI.cloudState('student',window.fixtureData));
   assert.equal(await note.inputValue(),'尚未送出的停點');
   assert.equal(await note.evaluate(el=>el===document.activeElement),true);
   await page.locator('#day').fill('2026-10-10');await page.locator('#day').dispatchEvent('change');assert.equal(await page.locator('#cards [data-id]').count(),0);
   await page.locator('#day').fill('2026-10-15');await page.locator('#day').dispatchEvent('change');assert.equal(await page.locator('#cards [data-id]').count(),2);
   await page.evaluate(()=>window.capUI.cloudState('parent',window.fixtureData));
   assert.equal(await page.locator('#cards [data-field="read"]').first().isDisabled(),true);
   await page.locator('#day').fill('2026-10-25');await page.locator('#day').dispatchEvent('change');
   assert.equal(await page.locator('#cards [data-id]').count(),4);
   assert.equal(await page.locator('#stats strong').first().textContent(),'175');
   assert.ok((await page.locator('#cards').textContent()).includes('書本第22～35頁'));
   await page.locator('#today > .notice summary').click();
   assert.equal(await page.locator('#catchUpSchedule tbody tr').count(),13);
   assert.ok((await page.locator('#deferredSummary').textContent()).includes('145分待排'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'頁面出現水平溢出');
   if(process.env.CAP_TEST_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.CAP_TEST_SCREENSHOT_DIR,'catch-up-'+viewport.width+'.png'),fullPage:true});
   assert.deepEqual(errors,[]);
   console.log(`${viewport.width}px：雲端更新保留卡片、展開說明、焦點、輸入與畫面位置；日期及權限切換正常`);
   await page.close();
  }
 }finally{if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
