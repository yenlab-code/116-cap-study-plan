(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.capTaskCards=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function update(container,getRecord,canEdit,homeworkDone){
    for(const card of container.querySelectorAll('[data-id]')){
      const r=getRecord(card.dataset.id),done=!!(r.read&&r.practice&&r.correct);
      card.classList.toggle('done',done);
      card.querySelector('fieldset').disabled=!canEdit||!homeworkDone;
      for(const input of card.querySelectorAll('[data-field]')){
        input.disabled=!canEdit;
        const field=input.dataset.field;
        if(input.type==='checkbox')input.checked=!!r[field];
        else if(input!==container.ownerDocument.activeElement)input.value=r[field]??'';
      }
      const status=done?'本次自評完成；仍需依計畫延後再測。':'尚未達到本次自評完成條件。';
      if(card.querySelector('.status').textContent!==status)card.querySelector('.status').textContent=status;
    }
  }
  return {update};
});
