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
assert.equal(result.assigned.F1,'2026-10-13'); // 新任務先占容量，10/8～10/11不硬塞。
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

