(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.capTaskCards=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function update(container,getRecord,canEdit,homeworkDone,tasks=[],today,plan={},canCorrectDate=false){
    const api=globalThis.capCompletion;
    for(const card of container.querySelectorAll('[data-id]')){
      const r=getRecord(card.dataset.id),done=!!(r.read&&r.practice&&r.correct);
      const task=tasks.find(t=>t.id===card.dataset.id),meta=api.decode(r.note);
      card.classList.toggle('done',done);
      card.querySelector('fieldset').disabled=!canEdit&&!canCorrectDate;
      for(const input of card.querySelectorAll('[data-field]')){
        input.disabled=input.dataset.field==='completedOn'?!canCorrectDate||!done:!canEdit;
        const field=input.dataset.field;
        if(input.type==='checkbox')input.checked=done;
        else if(input!==container.ownerDocument.activeElement)input.value=field==='completedOn'?api.completedOn(r):field==='note'?meta.text:r[field]??'';
        if(field==='completedOn')input.max=today;
      }
      const status=api.status(task,r,today,plan);
      if(card.querySelector('.status').textContent!==status)card.querySelector('.status').textContent=status;
    }
  }
  return {update};
});
