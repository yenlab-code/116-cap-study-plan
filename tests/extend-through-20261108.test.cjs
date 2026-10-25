const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {build,capacity}=require('../scheduler.js');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const plan=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(digest(plan.tasks.filter(t=>t.date<='2026-11-04')),'ae64feda4f2dc174b07fb6e91ec85cb471da0350b689ead75fe38381ce17dab0','所有原任務完整保留');
assert.equal(digest(plan.retiredTasks),'f470aac9fb449d758cb6ff5b377b7907dee2961831f33acfa84d1f7bbe5aa151','所有歷史卡完整保留');
const added=plan.tasks.filter(t=>t.date>='2026-11-05');
assert.equal(added.length,12);assert.equal(added.reduce((s,t)=>s+t.minutes,0),470);assert.equal(added.reduce((s,t)=>s+t.coverage.end-t.coverage.start+1,0),120);
assert.equal(plan.endDate,'2026-11-08');
for(const [date,total] of [['2026-11-05',75],['2026-11-06',75],['2026-11-07',145],['2026-11-08',175]]){
 assert.equal(added.filter(t=>t.date===date).reduce((s,t)=>s+t.minutes,0),total);assert.equal(capacity(date,{},plan),total);
}
for(const subject of plan.weeklyQuota.map(r=>r[0])){
 const prior=plan.tasks.filter(t=>t.subject===subject&&t.coverage&&t.date<='2026-11-04').at(-1),next=added.filter(t=>t.subject===subject);
 assert.ok(next.length>0,subject);assert.equal(next[0].coverage.start,prior.coverage.end+1,subject+'接續不跳頁');
 for(let i=1;i<next.length;i++)assert.equal(next[i].coverage.start,next[i-1].coverage.end+1);
}
const byId=id=>added.find(t=>t.id===id);
assert.ok(byId('國文-20261107-V31').materials.some(m=>m.includes('國文_單元1~3.pdf')&&m.includes('67～72')));
assert.ok(byId('國文-20261107-V31').materials.some(m=>m.includes('國文_單元4~6.pdf')&&m.includes('73～84')));
assert.ok(byId('理化-20261106-V31').materials.some(m=>m.includes('理化_理化最新知.pdf')&&m.includes('72')));
assert.ok(byId('理化-20261106-V31').materials.some(m=>m.includes('理化_單元1~6.pdf')&&m.includes('73～75')));
assert.ok(byId('地理-20261107-V31').materials.some(m=>m.includes('地理_單元4~6.pdf')&&m.includes('66～67')));
assert.ok(byId('地科-20261108-V31').materials.some(m=>m.includes('單元2_固體地球的變動.pdf')&&m.includes('30～32')));
assert.ok(byId('公民-20261108-V31').materials.some(m=>m.includes('公民_單元3~4.pdf')&&m.includes('49～59')));
const records=Object.fromEntries(plan.retiredTasks.map(t=>[t.id,{read:true,practice:true,correct:true}])),state={records,days:{}},before=JSON.stringify(state),result=build(plan,state,'2026-11-05');
assert.equal(JSON.stringify(state),before);for(const t of added)assert.equal(result.assigned[t.id],t.date);
for(const date of ['2026-11-09','2026-11-10']){assert.equal(capacity(date,{[date]:{availableMinutes:180}},plan),0);assert.ok(plan.blockedDates.includes(date));assert.ok(!plan.tasks.some(t=>t.date===date));}
if(fs.existsSync(path.join(root,'new-plan.json')))assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'new-plan.json'),'utf8')),plan);
assert.ok(html.includes('請選10/1～11/8'));assert.ok(html.includes('目前任務已排到11/8'));
console.log('接續至11/8：12項470分、九科120頁、原任務內容完整保留、跨檔與旅行封鎖通過');
