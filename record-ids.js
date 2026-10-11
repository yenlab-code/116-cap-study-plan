(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.capRecordIds=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const codes={國文:'CH',英文:'EN',數學:'MA',理化:'PC',生物:'BI',地科:'ES',歷史:'HI',地理:'GE',公民:'CI',作文:'WR',總控:'CO'};
  const allowed=/^[A-Za-z0-9_-]{1,32}$/;
  function create(tasks){
    const to=new Map(),from=new Map();
    for(const task of tasks){
      const id=task.id;
      const storageId=allowed.test(id)?id:codes[task.subject]&&id.startsWith(task.subject+'-')?codes[task.subject]+id.slice(task.subject.length):'';
      if(!allowed.test(storageId))throw Error('任務識別名稱無法同步：'+id);
      if(from.has(storageId)&&from.get(storageId)!==id)throw Error('任務識別名稱重複：'+id);
      to.set(id,storageId);from.set(storageId,id);
    }
    return {
      toStorage(id){const value=to.get(id)||id;if(!allowed.test(value))throw Error('任務識別名稱無法同步：'+id);return value;},
      fromStorage(id){return from.get(id)||id;},
      read(records){
        const result={...records};
        for(const [storageId,id] of from)if(storageId!==id&&Object.hasOwn(records,storageId)){
          result[id]={...(records[id]||{}),...records[storageId]};delete result[storageId];
        }
        return result;
      }
    };
  }
  return {create};
});
