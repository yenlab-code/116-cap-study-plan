const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,capacity}=require('../scheduler.js'),completion=require('../completion-rewards.js');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const p=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const signature=x=>{const s=JSON.stringify(x);let v=2166136261;for(let i=0;i<s.length;i++)v=Math.imul(v^s.charCodeAt(i),16777619);return s.length+':'+(v>>>0);};
const baseline=[["F1","851:2524185758"],["B1","641:1912696388"],["M0","593:1458756648"],["M1","632:2636876438"],["P0","480:2139445200"],["F2","591:4188635541"],["S","822:602271602"],["C","623:3316538785"],["M2","582:316667845"],["G","443:236999026"],["F3","512:1829969384"],["M3","485:2280126707"],["B2","405:718895367"],["E","492:586696910"],["F4-I25","1392:465798944"],["M4-I25","1291:1110460296"],["M5-I25","1174:1570294388"],["S2-I24","812:3368698348"],["數學-20261015-V26","1008:523060717"],["理化-20261015-V26","999:2654355838"],["英文-20261016-V25","1105:1838867004"],["理化-20261016-V26","1010:1786327300"],["國文-20261017-V25","1096:4142911329"],["歷史-20261017-V25","1025:1847011139"],["地理-20261017-V25","1018:2796952365"],["數學-20261017-V26","1013:2827980672"],["地科-20261018-V25","1037:2950853372"],["數學-20261020-V26","1010:3938109477"],["生物-20261020-V27","1021:1159746384"],["數學-20261022-V26","1007:1510898953"],["理化-20261022-V27","1026:3471917840"],["英文-20261023-V25","1114:94462044"],["理化-20261023-V27","1026:3785167621"],["國文-20261024-V25","1094:2646696782"],["歷史-20261024-V25","1027:2992128259"],["地理-20261024-V25","1023:3552902106"],["數學-20261024-V26","1015:1124825019"],["地科-20261025-V25","1044:4170643874"],["公民-20261025-V27","1029:2402157666"],["理化-20261025-V27","1285:3495698108"],["生物-20261025-V27","1160:1383471064"],["理化-20261026-V30","1120:512979252"],["生物-20261026-V30","1120:2090003177"],["公民-20261026-V30","1164:2768733773"],["數學-20261027-V26","1008:1403632935"],["生物-20261027-V30","1117:2848465236"],["數學-20261029-V26","1064:890573186"],["理化-20261029-V30","1102:1034040155"],["英文-20261030-V25","1136:1208463894"],["理化-20261030-V30","1107:2396730437"],["國文-20261031-V25","1094:1252660113"],["歷史-20261031-V25","1079:3863803184"],["地理-20261031-V25","1020:3212603721"],["數學-20261031-V26","1016:4069167587"],["地科-20261101-V25","1044:2083894504"],["公民-20261101-V30","1165:3731816832"],["理化-20261101-V30","1123:4122576193"],["生物-20261101-V30","1119:1454788280"],["數學-20261103-V26","1008:2603766754"],["生物-20261103-V30","1116:2831055085"],["數學-20261105-V31","1138:1205011602"],["理化-20261105-V31","1090:2610397779"],["英文-20261106-V31","1157:2898999671"],["理化-20261106-V31","1238:3276537657"],["國文-20261107-V31","1185:2741707957"],["歷史-20261107-V31","1105:1305930368"],["地理-20261107-V31","1155:143983574"],["數學-20261107-V31","1088:2701450738"],["地科-20261108-V31","1186:2232253940"],["公民-20261108-V31","1157:976055529"],["理化-20261108-V31","1094:3394728530"],["生物-20261108-V31","1093:2164587987"]],all=new Map([...p.tasks,...p.retiredTasks].map(t=>[t.id,t]));
for(const [id,sig] of baseline)assert.equal(signature(all.get(id)),sig,'改排前原卡完整保存 '+id);
assert.equal(signature(p.retiredTasks.slice(0,106)),'87726:2734614229','既有歷史未改');
assert.equal(p.tasks.reduce((s,t)=>s+t.minutes,0),2570,'總時間不增不減');
assert.equal(p.endDate,'2026-11-13');
assert.equal(p.tasks.filter(t=>t.id.endsWith('-V32')).length,16);
const ends={"國文":[13,84],"英文":[7,66],"數學":[12,78],"理化":[5,84],"生物":[6,64],"地科":[5,32],"歷史":[9,60],"地理":[8,67],"公民":[8,59]};
for(const [subject,[start,end]] of Object.entries(ends)){
 const pages=p.tasks.filter(t=>t.subject===subject&&t.date>='2026-10-15'&&t.coverage).flatMap(t=>Array.from({length:t.coverage.end-t.coverage.start+1},(_,i)=>i+t.coverage.start));
 assert.deepEqual(pages,Array.from({length:end-start+1},(_,i)=>start+i),subject+'全部原範圍不重複、不跳頁');
}
for(const day of ['2026-10-26','2026-11-09','2026-11-10']){
 assert.equal(capacity(day,{[day]:{availableMinutes:180}},p),0);
 assert.ok(!p.tasks.some(t=>t.date===day));
 const fixture={...p,tasks:[{id:'pending',date:'2026-10-01',minutes:15,kind:'教材複習'}]};
 const r=build(fixture,{records:{pending:{reason:'event'}},days:{[day]:{availableMinutes:180}}},day);
 assert.ok(r.moved.every(t=>t.to!==day),'封鎖日不能自動補入');
}
for(const [day,budget] of [['2026-11-12',75],['2026-11-13',70],['2026-11-11',0]]){
 assert.equal(p.tasks.filter(t=>t.date===day).reduce((s,t)=>s+t.minutes,0),budget);
 assert.ok(budget<=capacity(day,{},p));
}
const cancelled=p.retiredTasks.filter(t=>t.date==='2026-10-26'&&t.id.endsWith('-V30'));
assert.equal(cancelled.length,3);for(const t of cancelled)assert.equal(completion.eligible(t,p),false,'取消任務不算逾期');
const state={records:Object.fromEntries(p.retiredTasks.map(t=>[t.id,{read:true,practice:true,correct:true}])),days:{}},before=JSON.stringify(state),r=build(p,state,'2026-10-26');
assert.equal(JSON.stringify(state),before);assert.equal(r.occupied['2026-10-26']||0,0);
assert.ok(p.tasks.filter(t=>t.id.endsWith('-V32')).every(t=>!state.records[t.id]));
const science=p.tasks.find(t=>t.subject==='理化'&&t.date==='2026-11-08');assert.deepEqual(science.coverage,{start:62,end:75});
assert.ok(science.materials.some(m=>m.includes('理化_理化最新知.pdf')&&m.includes('72')));assert.equal(science.minutes,70);
console.log('補習重排：今日封鎖、原卡逐項保存、全部頁碼與總時間保留、旅行不補入、取消不扣款及11/13接續通過');

