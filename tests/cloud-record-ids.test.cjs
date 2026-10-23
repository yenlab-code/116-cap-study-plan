const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const plan=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const all=[...plan.tasks,...plan.retiredTasks],mapping=require('../record-ids.js').create(all);
const storage=all.map(t=>mapping.toStorage(t.id));
assert.equal(new Set(storage).size,all.length);
for(const t of all){const id=mapping.toStorage(t.id);assert.match(id,/^[A-Za-z0-9_-]{1,32}$/);assert.equal(mapping.fromStorage(id),t.id);}
assert.equal(mapping.toStorage('F1'),'F1');
assert.equal(mapping.toStorage('理化-20261018-V26'),'PC-20261018-V26');
assert.notEqual(mapping.toStorage('理化-20261018-V26'),mapping.toStorage('理化-20261018-V25'));
const payload={read:true,practice:true,correct:true,minutes:70,note:'書本第24頁'};
assert.deepEqual(mapping.read({'PC-20261018-V26':payload,F1:{read:true}}),{'理化-20261018-V26':payload,F1:{read:true}});
assert.deepEqual(mapping.read({'理化-20261018-V26':{read:false},'PC-20261018-V26':payload})['理化-20261018-V26'],payload);
assert.throws(()=>mapping.toStorage('無效/路徑'));
const assetVersion=plan.version.match(/^v(\d+\.\d+\.\d+)/)[1];
assert.ok(html.includes(`<script src="record-ids.js?v=${assetVersion}"></script>`));
assert.ok(html.includes(`<script type="module" src="cloud-sync.js?v=${assetVersion}"></script>`));
(async()=>{
 let authCallback,published,saved;
 const listeners={};
 const auth={currentUser:{uid:'fixture-user',email:'fixture@example.invalid'}};
 const nodes=Object.fromEntries(['#signInForm','#accountStatus','#signOut'].map(k=>[k,{classList:{add(){},remove(){}},addEventListener(){}}]));
 nodes['#plan-data']={textContent:JSON.stringify(plan)};
 const authSDK={getAuth:()=>auth,onAuthStateChanged:(a,fn)=>{authCallback=fn;},signOut:async()=>{}};
 const dbSDK={getFirestore:()=>({}),doc:(db,...parts)=>({parts}),collection:(db,...parts)=>({parts}),getDoc:async()=>({data:()=>({role:'student'})}),onSnapshot:(ref,fn)=>{listeners[ref.parts.at(-1)]=fn;return ()=>{};},serverTimestamp:()=>({fixtureTimestamp:true}),runTransaction:async(db,fn)=>fn({get:async()=>({exists:()=>false}),set:(ref,value)=>{saved={id:ref.parts.at(-1),value};}})};
 const window={CAP_FIREBASE:{enabled:true,familyId:'fixture-family',config:{apiKey:'fixture',projectId:'fixture',appId:'fixture'}},capRecordIds:require('../record-ids.js'),capUI:{cloudState:(mode,data)=>{published={mode,data};}}};
 const source=fs.readFileSync(path.join(root,'cloud-sync.js'),'utf8').replace(/import\(`/g,'sdkImport(`');
 const context={window,document:{querySelector:s=>nodes[s]},sdkImport:async url=>url.includes('firebase-app.js')?{initializeApp:()=>({})}:url.includes('firebase-auth.js')?authSDK:dbSDK};
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 await authCallback(auth.currentUser);
 listeners.records({docs:[{id:'PC-20261018-V26',data:()=>payload}]});
 listeners.days({docs:[]});
 assert.equal(published.mode,'student');
 assert.equal(published.data.records['理化-20261018-V26'].correct,true);
 for(const field of ['read','practice','correct']){
  await window.capCloud.writeRecord('理化-20261018-V26',{[field]:true});
  assert.equal(saved.id,'PC-20261018-V26');
  assert.equal(saved.value[field],true);
 }
 await window.capCloud.writeRecord('F1',{read:true});assert.equal(saved.id,'F1');
 const completion=require('../completion-rewards.js'),encoded=completion.encode('2026-10-23','補完成備註');
 await window.capCloud.writeRecord('理化-20261023-V27',{read:true,practice:true,correct:true,note:encoded});
 assert.deepEqual(completion.decode(saved.value.note),{date:'2026-10-23',text:'補完成備註'});
 assert.ok(Object.keys(saved.value).every(k=>['read','practice','correct','minutes','reason','note','updatedAt'].includes(k)));
 await window.capCloud.writeDay('2026-10-18',{homeworkDone:true});assert.equal(saved.id,'2026-10-18');
 console.log('雲端任務ID無碰撞、完成日期與備註沿用既有欄位、單次完整寫入及重新載入對應檢查通過');
})().catch(e=>{console.error(e);process.exitCode=1;});
