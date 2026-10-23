/* 完成日期與獎勵：沿用既有私人 note 欄位，無須更動家庭存取規則。 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.capCompletion=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const PREFIX='[cap116-completion-v1]',EXAM_DATE='2027-05-15',EXAM_END='2027-05-16';
  const policy={startDate:'2026-10-23',onTime:10,late:5};
  function validDate(s){
    if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
    const value=Date.parse(s+'T00:00:00Z');
    return Number.isFinite(value)&&new Date(value).toISOString().slice(0,10)===s;
  }
  function today(now=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const part=k=>parts.find(p=>p.type===k).value;
    return part('year')+'-'+part('month')+'-'+part('day');
  }
  function decode(note){
    const text=typeof note==='string'?note:'';
    if(text.startsWith(PREFIX))try{
      const data=JSON.parse(text.slice(PREFIX.length));
      if(data.v===1&&typeof data.text==='string'&&(data.date===''||validDate(data.date)))return {date:data.date,text:data.text};
    }catch{}
    return {date:'',text};
  }
  function encode(date,text){
    if(date!==''&&!validDate(date))throw Error('請填有效的完成日期。');
    const note=PREFIX+JSON.stringify({v:1,date,text:String(text??'')});
    if(note.length>2000)throw Error('備註太長，請縮短後再儲存。');
    return note;
  }
  const completed=r=>!!(r&&r.read&&r.practice&&r.correct);
  function timestampDate(value){
    if(!value)return '';
    const date=typeof value.toDate==='function'?value.toDate():typeof value.seconds==='number'?new Date(value.seconds*1000):new Date(value);
    return Number.isFinite(date.getTime())?today(date):'';
  }
  // 新格式只信任獨立的伺服器時間／家長更正欄位，備註不能影響計獎。
  function completedOn(r={}){
    if(!completed(r))return '';
    return r.recordFormat===2?timestampDate(r.dateOverride)||timestampDate(r.completedAt):decode(r.note).date;
  }
  function eligible(task,plan={}){
    return validDate(task.date)&&task.date>=policy.startDate&&task.date<EXAM_DATE&&!task.cancelled&&!task.rewardExcluded&&!plan.blockedDates?.includes(task.date);
  }
  function classify(task,r={},now=today(),plan={}){
    const done=completed(r),date=completedOn(r),counts=eligible(task,plan);
    if(done&&(!date||date>now))return {kind:'unknown',amount:0,done,date,counts};
    if(!counts)return {kind:done?'excluded-done':'excluded',amount:0,done,date,counts};
    if(done)return {kind:date<=task.date?'on-time':'late',amount:date<=task.date?policy.onTime:-policy.late,done,date,counts};
    return {kind:task.date<now?'overdue':'pending',amount:task.date<now?-policy.late:0,done,date,counts};
  }
  function status(task,r,now=today(),plan={}){
    const s=classify(task,r,now,plan);
    return ({'unknown':'已完成；完成日期待確認，暫不計獎扣款。','on-time':'準時完成 · +10 元','late':'已補完成 · −5 元（只扣一次，不補發獎勵）','overdue':'已逾期未完成 · −5 元（只扣一次）','pending':task.date===now?'今天完成可得 10 元；今天尚未結束，不扣款。':'尚未到期；完成後自動判斷是否準時。','excluded-done':'已完成；此任務不在獎勵計算範圍。','excluded':'尚未完成；此任務不在獎勵計算範圍。'})[s.kind];
  }
  function summarize(tasks,records={},now=today(),plan={}){
    const result={earned:0,deducted:0,net:0,payable:0,onTime:0,missed:0,unknown:0,pending:0,total:0};
    const seen=new Set();
    for(const t of tasks){
      if(seen.has(t.id))continue;seen.add(t.id);
      const s=classify(t,records[t.id],now,plan);if(!s.counts)continue;
      result.total++;
      if(s.kind==='on-time'){result.onTime++;result.earned+=s.amount;}
      else if(s.kind==='late'||s.kind==='overdue'){result.missed++;result.deducted-=s.amount;}
      else if(s.kind==='unknown')result.unknown++;
      else result.pending++;
    }
    result.net=result.earned-result.deducted;result.payable=Math.max(0,result.net);
    return result;
  }
  function countdown(now=today()){
    if(!validDate(now))throw Error('日期格式錯誤');
    const days=Math.round((Date.parse(EXAM_DATE+'T00:00:00Z')-Date.parse(now+'T00:00:00Z'))/86400000);
    return {days:Math.max(0,days),weeks:Math.floor(Math.max(0,days)/7),extraDays:Math.max(0,days)%7,label:days>0?'距離會考還有':now===EXAM_DATE?'今天是會考第一天':now===EXAM_END?'今天是會考第二天':'116 年會考已結束'};
  }
  return {EXAM_DATE,EXAM_END,policy,validDate,today,decode,encode,completed,completedOn,timestampDate,eligible,classify,status,summarize,countdown};
});
