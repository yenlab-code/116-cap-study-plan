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
assert.equal(result.assigned.F1,'2026-10-08');
assert.equal(capacity('2027-02-28',{}),0);
console.log('排程測試通過');
