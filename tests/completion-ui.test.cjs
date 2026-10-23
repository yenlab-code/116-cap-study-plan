const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),api=require('../completion-rewards.js');
const {createRequire}=require('node:module');
let playwright;try{playwright=require('playwright');}catch{playwright=createRequire('C:/Users/jensc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/')('playwright');}
(async()=>{
 let fixture=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<script src="firebase-config.js"></script>','<script>window.CAP_FIREBASE={enabled:false};</script>').replace(/<script type="module" src="cloud-sync.js[^\"]*"><\/script>/,'');
 for(const file of ['completion-rewards.js','scheduler.js','record-ids.js','task-card-updates.js'])fixture=fixture.replace(new RegExp('<script src="'+file.replaceAll('.','\\.')+'(?:\\?[^\"]*)?"></script>'),()=>'<script>'+fs.readFileSync(path.join(root,file),'utf8')+'</script>');
 const installed='C:/Program Files/Google/Chrome/Application/chrome.exe';
 const browser=await playwright.chromium.launch({headless:true,executablePath:process.env.CAP_TEST_CHROME||(fs.existsSync(installed)?installed:undefined)});
 try{for(const viewport of [{width:1200,height:900},{width:390,height:844},{width:304,height:700}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-10-23T12:00:00Z')});await page.route('**/*',route=>route.abort());await page.setContent(fixture);
  const selectDay=async day=>{await page.locator('#day').fill(day);await page.locator('#day').dispatchEvent('change');};
  const sync=()=>page.evaluate(()=>window.capUI.cloudState('student',window.fixtureData));
  const confirm=()=>page.evaluate(()=>{for(const {id,patch} of window.writes)window.fixtureData.records[id]={...(window.fixtureData.records[id]||{}),...patch};window.writes=[];window.capUI.cloudState('student',window.fixtureData);});
  await selectDay('2026-10-23');
  await page.evaluate(()=>{window.fixtureData={records:{},days:{}};window.writes=[];window.capCloud={writeRecord:async(id,patch)=>{window.writes.push({id,patch});},writeDay:async()=>{}};window.capUI.cloudState('student',window.fixtureData);window.fixtureCard=document.querySelector('#cards [data-id]');window.fixtureId=window.fixtureCard.dataset.id;});
  assert.equal(await page.locator('#countdown').textContent(),'204 天');
  assert.equal(await page.locator('#countdownWeeks').textContent(),'29 週又 1 天');
  assert.ok(!/收書|就寢|睡覺/.test(await page.locator('header,.countdown-panel').allTextContents().then(text=>text.join(''))));
  assert.ok(!/帳面淨額|待完成/.test(await page.locator('#rewardSummary').innerText()));
  assert.equal(await page.locator('.countdown-date').evaluate(el=>el.getBoundingClientRect().height<45),true,'手機日期不應斷行');
  if(process.env.CAP_TEST_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.CAP_TEST_SCREENSHOT_DIR,'compact-header-'+viewport.width+'.png')});
  const card=page.locator('#cards [data-id]').first(),box=card.locator('[data-field="done"]'),date=card.locator('[data-field="completedOn"]'),note=card.locator('textarea'),status=card.locator('.status');
  assert.equal(await card.locator('input[type="checkbox"]').count(),1);assert.equal(await card.locator('[data-field="minutes"],[data-field="reason"]').count(),0);assert.equal(await date.isDisabled(),true);
  await card.locator('details summary').click();await box.scrollIntoViewIfNeeded();await box.check();
  const before=await page.evaluate(()=>({scroll:scrollY,top:window.fixtureCard.getBoundingClientRect().top}));await sync();
  const after=await page.evaluate(()=>({scroll:scrollY,top:window.fixtureCard.getBoundingClientRect().top,same:window.fixtureCard===document.querySelector('#cards [data-id]'),open:window.fixtureCard.querySelector('details').open}));
  assert.equal(after.same,true);assert.equal(after.open,true);assert.ok(Math.abs(after.scroll-before.scroll)<=1);assert.ok(Math.abs(after.top-before.top)<=1);assert.equal(await box.isChecked(),true);assert.equal(await date.inputValue(),'2026-10-23');assert.match(await status.textContent(),/準時完成 · \+10 元/);await confirm();
  await note.fill('簡短補充 <img src=x onerror=alert(1)>');await sync();assert.equal(await note.inputValue(),'簡短補充 <img src=x onerror=alert(1)>');assert.equal(await note.evaluate(el=>el===document.activeElement),true);await note.blur();
  await date.fill('2026-10-22');assert.match(await status.textContent(),/準時完成/);
  await date.fill('2026-10-24');assert.equal(await date.inputValue(),'2026-10-22');assert.match(await page.locator('#feedback').textContent(),/不能晚於今天/);await confirm();
  await box.uncheck();assert.equal(await date.inputValue(),'');assert.equal(await date.isDisabled(),true);assert.match(await status.textContent(),/今天尚未結束，不扣款/);await confirm();
  await page.clock.setSystemTime(new Date('2026-10-24T12:00:00Z'));await sync();assert.match(await status.textContent(),/已逾期未完成 · −5 元/);
  await box.check();assert.equal(await date.inputValue(),'2026-10-24');assert.match(await status.textContent(),/已補完成 · −5 元/);
  await date.fill('2026-10-23');assert.match(await status.textContent(),/準時完成/);await confirm();
  const stored=await page.evaluate(()=>window.fixtureData.records[window.fixtureId]);assert.deepEqual(api.decode(stored.note),{date:'2026-10-23',text:'簡短補充 <img src=x onerror=alert(1)>'});assert.equal(await page.locator('#activity img').count(),0);
  await page.locator('[data-tab="adjust"]').click();const payload=await page.evaluate(()=>({schema:'cap116-records-v1',records:window.fixtureData.records,days:{}}));
  await page.locator('#import').setInputFiles({name:'fixture-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('備份已上傳'));assert.ok((await page.evaluate(()=>window.writes)).some(w=>api.decode(w.patch.note).date==='2026-10-23'));
  await page.locator('[data-tab="today"]').click();
  await page.evaluate(()=>{window.capUI.cloudState('signedOut',{records:{},days:{}});window.fixtureData.records[window.fixtureId]={read:true,practice:true,correct:true,note:'舊備註保留'};window.capUI.cloudState('student',window.fixtureData);});
  assert.equal(await date.inputValue(),'');assert.match(await status.textContent(),/完成日期待確認/);assert.equal(await note.inputValue(),'舊備註保留');
  await page.evaluate(()=>window.capUI.cloudState('parent',window.fixtureData));assert.equal(await box.isDisabled(),true);assert.equal(await date.isDisabled(),true);assert.equal(await note.isDisabled(),true);
  await page.evaluate(()=>window.capUI.cloudState('signedOut',{records:{},days:{}}));assert.match(await page.locator('#rewardSummary').textContent(),/登入後查看零用金/);assert.equal(await box.isDisabled(),true);
  await selectDay('2026-10-10');assert.equal(await page.locator('#cards [data-id]').count(),0);await selectDay('2026-10-25');assert.equal(await page.locator('#cards [data-id]').count(),4);assert.equal(await page.locator('#stats strong').first().textContent(),'175');await sync();
  await page.locator('#today > .notice summary').click();assert.equal(await page.locator('#catchUpSchedule tbody tr').count(),13);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'頁面出現水平溢出');
  if(process.env.CAP_TEST_SCREENSHOT_DIR){await selectDay('2026-10-23');await card.screenshot({path:path.join(process.env.CAP_TEST_SCREENSHOT_DIR,'completion-card-'+viewport.width+'.png')});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(process.env.CAP_TEST_SCREENSHOT_DIR,'reward-summary-'+viewport.width+'.png')});}
  assert.deepEqual(errors,[]);console.log(viewport.width+'px：單一勾選、日期更正、補完成、同步、備份、舊卡、唯讀、登出隱私與無水平溢出通過');await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
