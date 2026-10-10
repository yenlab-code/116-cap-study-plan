const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,capacity}=require('../scheduler.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const plan=JSON.parse(html.match(/<script id="plan-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const total=(a,b)=>plan.tasks.filter(t=>t.date>=a&&t.date<=b).reduce((s,t)=>s+t.minutes,0);
const add=(s,n)=>new Date(Date.parse(s+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
for(const date of plan.blockedDates.filter(d=>d<='2026-10-14')){
 assert.equal(total(date,date),0);
 assert.equal(capacity(date,{},plan),0);
 assert.equal(capacity(date,{[date]:{availableMinutes:180}},plan),0);
 assert.match(plan.dayNotes[date],/自行準備第一次段考/);
 const fixture={...plan,tasks:[{id:'pending',date:'2026-10-09',minutes:25,kind:'國一複習'}]};
 const days=Object.fromEntries(plan.blockedDates.map(d=>[d,{availableMinutes:180}]));
 const state={records:{pending:{reason:'homework'}},days},before=JSON.stringify(state);
 const r=build(fixture,state,date);
 assert.equal(r.assigned.pending,'2026-10-15');
 assert.ok(r.moved.every(m=>!plan.blockedDates.includes(m.to)));
 assert.equal(JSON.stringify(state),before);
}
assert.equal(plan.endDate,'2026-11-04');
assert.equal(total('2026-10-10','2026-10-14'),0);
assert.equal(total('2026-10-15','2026-10-15'),75);
assert.deepEqual(plan.tasks.filter(t=>t.date==='2026-10-15').map(t=>[t.subject,t.coverage]),[['數學',{start:12,end:18}],['理化',{start:5,end:11}]]);
for(const start of ['2026-10-15','2026-10-22','2026-10-29']){
 const week=plan.tasks.filter(t=>t.date>=start&&t.date<=add(start,6));
 assert.equal(total(start,add(start,6)),545);
 assert.equal(week.filter(t=>t.subject==='總控').reduce((s,t)=>s+t.minutes,0),60);
 assert.equal(week.filter(t=>t.subject==='作文').reduce((s,t)=>s+t.minutes,0),25);
 assert.equal(week.filter(t=>t.coverage).reduce((s,t)=>s+t.minutes,0),460);
 assert.equal(new Set(week.filter(t=>t.coverage).map(t=>t.subject)).size,9);
 for(const offset of [4,6])assert.equal(total(add(start,offset),add(start,offset)),0);
}
for(const date of new Set(plan.tasks.map(t=>t.date)))assert.ok(total(date,date)<=capacity(date,{},plan),date);
assert.equal(capacity('2026-10-24',{},plan),145);
assert.equal(capacity('2026-10-25',{},plan),175);
assert.equal(capacity('2026-10-25',{'2026-10-25':{availableMinutes:60}},plan),60);
assert.equal(capacity('2027-02-28',{},plan),0);
assert.equal(plan.weeklyQuota.reduce((s,r)=>s+r[3],0),121);
assert.equal(plan.weeklyQuota.reduce((s,r)=>s+r[1]+r[2],0),2544);
const ids=plan.tasks.map(t=>t.id),archived=plan.retiredTasks.map(t=>t.id);
assert.equal(new Set([...ids,...archived]).size,ids.length+archived.length);
assert.ok(['H2-I24','D2-I24','G2-I24','C2-I24','E2-I24','W2-I24','M6-I24','F5-I24','S3-I24','M7-I24','P1-I24'].every(id=>archived.includes(id)));
let r=build(plan,{records:Object.fromEntries(archived.map(id=>[id,{read:true,practice:true,correct:true}])),days:{}},'2026-10-15');
assert.equal(r.occupied['2026-10-15'],75);
assert.ok(archived.every(id=>!Object.hasOwn(r.assigned,id)));
r=build(plan,{records:{'F4-I24':{read:true,practice:true,correct:true}},days:{}},'2026-10-08');
assert.equal(r.occupied['2026-10-08'],75);
assert.equal(r.assigned['F4-I25'],'2026-10-08');
r=build(plan,{records:{F1:{reason:'homework',read:true,practice:true,correct:true}},days:{}},'2026-10-02');
assert.equal(r.assigned.F1,'2026-10-01');
assert.equal(r.moved.length,0);
r=build(plan,{records:{B1:{reason:'prerequisite'}},days:{}},'2026-10-15');
assert.ok(r.needsHelp.includes('B1'));
assert.ok(r.unreported.includes('F1'));
r=build({...plan,tasks:[{id:'last',date:'2026-10-31',minutes:20,kind:'國一複習'}]},{records:{last:{reason:'event'}},days:{}},'2026-11-04');
assert.equal(r.moved.length,0);
assert.ok(r.overflow.includes('last'));
for(const subject of plan.weeklyQuota.map(r=>r[0])){
 const ts=plan.tasks.filter(t=>t.date>='2026-10-15'&&t.subject===subject&&t.coverage).sort((a,b)=>a.date.localeCompare(b.date));
 for(let i=1;i<ts.length;i++)assert.equal(ts[i].coverage.start,ts[i-1].coverage.end+1,subject);
}
for(const [subject,text] of [['英文','英語_單元3~5.pdf'],['數學','數學_單元4~9.pdf'],['歷史','歷史_單元3~4.pdf']])assert.ok(plan.tasks.some(t=>t.subject===subject&&t.materials.some(m=>m.includes(text))));
for(const t of plan.tasks.filter(t=>t.date>='2026-10-15'))assert.ok(!/PDF\s*第?\s*\d+\s*頁/.test(t.body));
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[0].includes('application/json')||!m[1].trim())continue;new Function(m[1]);}
const fn=html.match(/function reportWindow\(date\)\{[^\n]+/)[0],reportWindow=new Function('plan',fn+';return reportWindow;')(plan);
assert.deepEqual(reportWindow('2026-10-21'),{start:'2026-10-15',end:'2026-10-21'});
assert.deepEqual(reportWindow('2026-10-22'),{start:'2026-10-22',end:'2026-10-28'});
assert.ok(html.includes('for(const t of allTasks){const r=input.records[t.id]'));
assert.ok(html.includes('for(const t of allTasks){const scheduled=assigned[t.id]||t.date'));
console.log('取消期間封鎖、三週545分鐘、歷史紀錄隔離、教材接續、摘要與語法檢查通過');



// 預先保留畢業旅行，即使未來延伸計畫或有可用分鐘也不能塞任務。
for(const date of ['2026-11-09','2026-11-10']){
 assert.ok(plan.blockedDates.includes(date));
 assert.equal(capacity(date,{},plan),0);
 assert.equal(capacity(date,{[date]:{availableMinutes:180}},plan),0);
 assert.equal(total(date,date),0);
 assert.match(plan.dayNotes[date],/畢業旅行/);
 const fixture={...plan,endDate:'2026-11-20',tasks:[{id:'trip-pending',date:'2026-11-08',minutes:25,kind:'國一複習'}]};
 const state={records:{'trip-pending':{reason:'event'}},days:{'2026-11-09':{availableMinutes:180},'2026-11-10':{availableMinutes:180},'2026-11-11':{availableMinutes:30}}};
 const r=build(fixture,state,date);
 assert.equal(r.assigned['trip-pending'],'2026-11-11');
 assert.ok(r.moved.every(m=>!['2026-11-09','2026-11-10'].includes(m.to)));
}
console.log('11/9、11/10畢業旅行保留與未來改排檢查通過');
