// Move existing controls without replacing their nodes or event handlers.
export function simplifyLayout(){
 const $=id=>document.getElementById(id);
 const fold=(node,title)=>{if(!node)return;const details=document.createElement('details');details.className='card secondary-panel';const summary=document.createElement('summary');summary.textContent=title;node.before(details);details.append(summary,node);node.classList.remove('card');return details;};
 const schedule=fold($('schedule-form'),'编辑训练计划');
 $('calendar-grid').addEventListener('click',event=>{if(event.target.closest('button'))schedule.open=true;});
 fold($('schedule-list').closest('.card'),'近期训练安排');
 fold($('history').closest('.card'),'身体数据历史');
 fold($('training-history').closest('.card'),'训练历史');
 fold($('diet-history').closest('.card'),'往日饮食');
 fold($('label-panel'),'拍摄营养标签');
 fold(document.querySelector('.reference-library'),'饮食参考匹配 · 展开搜索');
 const record=$('message').closest('.card');$('record-status').after(record);
 const nutrition=$('nutrition-summary').closest('.card');$('diet').prepend($('meal-form'));$('meal-form').after($('meal-review'));$('meal-review').after(nutrition);document.querySelector('#diet .section-intro').hidden=true;
 for(const [id,title,subtitle] of [['record','训练记录','专注当下这一组。'],['profile','个人档案','身体、目标与长期饮食设置。'],['settings','账号设置','管理账号、模型与数据。']]){
  const heading=document.createElement('div');heading.className='page-heading';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=subtitle;heading.append(h,p);$(id).prepend(heading);
 }
 document.querySelector('#app-shell header small').textContent='AI-TRAIN';
 document.querySelector('#app-shell header p').textContent='训练 · 饮食 · 恢复';
 document.querySelector('.welcome-panel small').textContent='TODAY';
 document.querySelector('.welcome-panel h2').textContent='今天，也进一步。';
 document.querySelector('.welcome-panel p').textContent='记录训练与饮食，按自己的节奏前进。';
 document.querySelector('#diet .section-intro small').textContent='NUTRITION';
 document.querySelector('#diet .section-intro h2').textContent='饮食记录';
 document.querySelector('#diet .section-intro p').textContent='记录每一餐，让摄入与目标一目了然。';
 document.querySelector('.coach-heading small').textContent='AI COACH';
 document.querySelector('.coach-heading h2').textContent='爱练私教';
 document.querySelector('footer').textContent='爱练 · 每一点进步，都算数';
 const welcome=document.querySelector('.coach-welcome');const update=()=>{welcome.hidden=$('chat-history').children.length>0;};
 new MutationObserver(update).observe($('chat-history'),{childList:true});update();
 const profile=$('profile-fields');const optional=document.createElement('details');optional.className='profile-optional';const summary=document.createElement('summary');summary.textContent='身体限制与注意事项（选填）';optional.append(summary);const grid=document.createElement('div');grid.className='fields';optional.append(grid);profile.after(optional);
 for(const id of ['injuries','allergies','conditions','forbidden'])grid.append($('p-'+id).closest('label'));
}
