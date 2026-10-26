const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,capacity}=require('../scheduler.js');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const plan=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const old=JSON.parse(fs.readFileSync(path.join(root,'plan-before-holiday-20261026.json'),'utf8'));
assert.deepEqual(plan.tasks.filter(t=>t.date<'2026-10-26'),old.tasks.filter(t=>t.date<'2026-10-26'));
assert.deepEqual(plan.tasks.filter(t=>t.date==='2026-10-26'),[]);
assert.equal(capacity('2026-10-26',{},plan),0);
for(const date of ['2026-10-19','2026-10-28','2026-11-02','2026-11-04'])assert.equal(capacity(date,{},plan),0);
assert.equal(capacity('2026-10-26',{'2026-10-26':{availableMinutes:180}},plan),0);
assert.equal(plan.tasks.filter(t=>t.date<='2026-11-04').reduce((s,t)=>s+t.minutes,0),old.tasks.reduce((s,t)=>s+t.minutes,0));
assert.deepEqual(plan.deferredRanges,[]);
for(const subject of ['公民','理化','生物']){
 const pages=ts=>ts.filter(t=>t.subject===subject&&t.coverage).flatMap(t=>Array.from({length:t.coverage.end-t.coverage.start+1},(_,i)=>t.coverage.start+i)).sort((a,b)=>a-b);
 const end={公民:46,理化:64,生物:56}[subject];
 assert.deepEqual(pages(plan.tasks.filter(t=>t.date>='2026-10-26')).filter(n=>n<=end),pages([...old.tasks.filter(t=>t.date>='2026-10-26'),...old.deferredRanges]));
}
const replaced=old.tasks.filter(t=>t.date>='2026-10-26'&&['公民','理化','生物'].includes(t.subject));
for(const task of replaced)assert.deepEqual(plan.retiredTasks.find(t=>t.id===task.id),task);
const state={records:Object.fromEntries(replaced.map(t=>[t.id,{read:true,practice:true,correct:true,note:'舊卡完成紀錄'}])),days:{}},before=JSON.stringify(state);
const result=build(plan,state,'2026-10-26');
assert.equal(JSON.stringify(state),before);
assert.equal(result.occupied['2026-10-26']||0,0);
for(const t of replaced)assert.ok(!Object.hasOwn(result.assigned,t.id));
assert.match(plan.dayNotes['2026-10-26'],/下午需到補習班/);
assert.match(plan.dayNotes['2026-10-26'],/全部取消/);
if(fs.existsSync(path.join(root,'new-plan.json')))assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'new-plan.json'),'utf8')),plan);
assert.ok(!html.includes('共145分待排'));
console.log('10/26補習取消容量、禁止補入、歷史逐項保留、頁碼完整與新舊勾選隔離通過');
