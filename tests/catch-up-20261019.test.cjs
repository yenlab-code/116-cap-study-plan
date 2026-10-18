const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,completed}=require('../scheduler.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const plan=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const changed=plan.tasks.filter(t=>t.id.endsWith('-V27'));
assert.equal(changed.length,13);
const oldIds=['公民-20261018-V25','理化-20261018-V26','生物-20261018-V26'];
for(const id of oldIds){assert.ok(!plan.tasks.some(t=>t.id===id));assert.ok(plan.retiredTasks.some(t=>t.id===id));}
assert.deepEqual(plan.tasks.find(t=>t.id==='地科-20261018-V25').coverage,{start:5,end:11});
assert.equal(plan.tasks.find(t=>t.id==='地科-20261018-V25').date,'2026-10-18');
// 舊完成與未完成紀錄均保留，不能重複搬入補回卡，也不能勾選新範圍。
const records=Object.fromEntries(oldIds.map(id=>[id,{reason:'event',read:false,practice:false,correct:false}]));
records['地科-20261018-V25']={read:true,practice:true,correct:true};
const state={records,days:{}},before=JSON.stringify(state),schedule=build(plan,state,'2026-10-19');
assert.equal(JSON.stringify(state),before);
assert.ok(oldIds.every(id=>!Object.hasOwn(schedule.assigned,id)));
assert.ok(changed.every(t=>!completed(records[t.id])));
assert.ok(!schedule.moved.some(t=>oldIds.includes(t.id)));
const expected={
 '2026-10-20':[['生物',6,11,30]],
 '2026-10-22':[['理化',16,19,30]],
 '2026-10-23':[['理化',20,21,15]],
 '2026-10-25':[['公民',8,20,35],['理化',22,35,70],['生物',12,22,40]]
};
for(const [date,rows] of Object.entries(expected))assert.deepEqual(changed.filter(t=>t.date===date).map(t=>[t.subject,t.coverage.start,t.coverage.end,t.minutes]),rows);
// 每一個舊範圍的每頁，恰好被排入新版或列入待排；沒有遺漏、重複或跳頁。
const sources=plan.retiredTasks.filter(t=>['公民','理化','生物'].includes(t.subject)&&t.date>='2026-10-18'&&t.id.endsWith(t.subject==='公民'?'V25':'V26'));
assert.equal(sources.length,16);
for(const source of sources){
 const pages=[];
 for(const t of [...changed,...plan.deferredRanges])for(const p of t.sourcePieces||[]){
  if(p.sourceTaskId!==source.id)continue;
  assert.equal(t.subject,source.subject);
  for(let page=p.start;page<=p.end;page++)pages.push(page);
 }
 assert.deepEqual(pages.sort((a,b)=>a-b),Array.from({length:source.coverage.end-source.coverage.start+1},(_,i)=>source.coverage.start+i),source.id);
}
assert.equal(plan.deferredRanges.reduce((s,t)=>s+t.minutes,0),145);
assert.deepEqual(plan.deferredRanges.map(t=>[t.subject,t.coverage.start,t.coverage.end,t.minutes]),[['公民',34,46,35],['理化',56,64,70],['生物',46,56,40]]);
assert.ok(plan.deferredRanges.every(t=>t.earliestDate==='2026-11-05'&&!t.date));
assert.ok(html.includes('id="catchUpSchedule"'));
assert.ok(html.includes('id="deferredSummary"'));
console.log('三科補回、地科保留、舊紀錄隔離、全部頁碼無遺漏與145分鐘順延檢查通過');
