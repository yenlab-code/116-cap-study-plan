const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {build,capacity} = require('../scheduler.js');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const plan = JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);

let result = build(plan,{records:{F1:{reason:'homework'},B1:{reason:'prerequisite'}},days:{}},'2026-10-02');
assert.equal(result.assigned.F1,'2026-10-04'); // 10/2、10/3 的原訂容量已用滿。
assert.deepEqual(result.needsHelp,['B1']);
assert.equal(result.assigned.B1,'2026-10-01');
assert.equal(result.unreported.length,0); // 空白資料不被當成已回報的未完成。

result = build(plan,{records:{F1:{reason:'homework',read:true,practice:true,correct:true}},days:{}},'2026-10-02');
assert.equal(result.assigned.F1,'2026-10-01');
assert.equal(result.moved.length,0);

result = build(plan,{records:{F1:{reason:'homework'}},days:{'2026-10-04':{availableMinutes:0}}},'2026-10-02');
assert.equal(result.assigned.F1,'2026-10-01'); // 段考前無足夠容量，保留原日期並明確列出待調整。
assert.ok(result.overflow.includes('F1'));
assert.equal(capacity('2027-02-28',{}),0);
console.log('排程測試通過');

assert.equal(capacity('2026-10-14',{},plan),0);
assert.equal(capacity('2026-10-15',{},plan),0);
assert.equal(capacity('2026-10-12',{},plan),0);
assert.equal(capacity('2026-10-14',{ '2026-10-14':{availableMinutes:20}},plan),20);
result = build(plan,{records:{W:{reason:'homework'}},days:{}},'2026-10-14');
assert.ok(!['2026-10-14','2026-10-15'].includes(result.assigned.W));
const ids = plan.tasks.map(t=>t.id);
assert.equal(new Set(ids).size,ids.length);
for(const date of [...new Set(plan.tasks.map(t=>t.date))]){
 const total=plan.tasks.filter(t=>t.date===date).reduce((sum,t)=>sum+t.minutes,0);
 assert.ok(total<=capacity(date,{},plan),'原訂任務超出容量：'+date);
}
console.log('新增任務與段考日容量檢查通過');

assert.equal(plan.endDate,'2026-10-22');
assert.equal(capacity('2026-10-17',{},plan),145);
assert.equal(capacity('2026-10-18',{},plan),175);
assert.equal(capacity('2026-10-18',{'2026-10-18':{availableMinutes:60}},plan),60);
const totalBetween=(start,end)=>plan.tasks.filter(t=>t.date>=start&&t.date<=end).reduce((s,t)=>s+t.minutes,0);
assert.equal(totalBetween('2026-10-08','2026-10-13'),370);
assert.equal(totalBetween('2026-10-16','2026-10-22'),545);
assert.equal(plan.weeklyQuota.reduce((s,row)=>s+row[3],0),121);
assert.equal(plan.weeklyQuota.reduce((s,row)=>s+row[1]+row[2],0),2544);
const archivedIds=plan.retiredTasks.map(t=>t.id);
assert.ok(archivedIds.includes('F4'));
assert.ok(!ids.some(id=>archivedIds.includes(id)));
result=build(plan,{records:{F4:{read:true,practice:true,correct:true}},days:{}},'2026-10-08');
assert.equal(result.assigned['F4-I24'],'2026-10-08');
assert.equal(result.occupied['2026-10-08'],70); // 舊版完成狀態不能讓加量任務自動完成。
assert.ok(!Object.hasOwn(result.assigned,'F4'));
const scriptMatches=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
for(const match of scriptMatches){if(match[0].includes('application/json')||!match[1].trim())continue;new Function(match[1]);}
assert.ok(html.includes('for(const t of allTasks){const r=input.records[t.id]'));
assert.ok(html.includes('for(const t of allTasks){const scheduled=assigned[t.id]||t.date'));
console.log('加量預算、舊紀錄隔離與JavaScript語法檢查通過');

