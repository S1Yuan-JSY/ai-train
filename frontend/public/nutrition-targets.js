export function targetProgress(consumed,target){
 if(!Number.isFinite(consumed)||consumed<0||!Number.isFinite(target)||target<=0)throw new Error('目标应为大于0的有效克数');
 const difference=consumed-target;
 return {percent:Math.min(100,consumed/target*100),text:Math.abs(difference)<0.05?'已达目标':difference>0?`超出 ${difference.toFixed(1)}g`:`还差 ${(-difference).toFixed(1)}g`};
}
export function renderNutritionTargets(host,targets,totals,onSave,onClear){
 host.replaceChildren();const title=document.createElement('h2');title.textContent='每日营养目标';host.append(title);
 const hint=document.createElement('p');hint.className='muted';hint.textContent='自行设置每天的蛋白质、碳水和脂肪目标；按今天已保存的饮食计算，估算记录会影响进度的准确性。';host.append(hint);
 const form=document.createElement('form');const fields=document.createElement('div');fields.className='fields';const inputs={};
 for(const [key,name,max] of [['protein','蛋白质',1000],['carbs','碳水',2000],['fat','脂肪',1000]]){
  const label=document.createElement('label');label.textContent=name+'目标（g/天）';const input=document.createElement('input');input.type='number';input.min='0.1';input.max=String(max);input.step='any';input.required=true;input.value=targets?.[key]??'';label.append(input);fields.append(label);inputs[key]=input;
  if(targets){const progress=targetProgress(totals[key],targets[key]);const text=document.createElement('p');text.textContent=`${name}：${totals[key].toFixed(1)} / ${targets[key]}g · ${progress.text}`;const bar=document.createElement('progress');bar.max=100;bar.value=progress.percent;bar.setAttribute('aria-label',name+'目标完成比例');label.append(text,bar);}
 }
 form.append(fields);const save=document.createElement('button');save.className='primary';save.textContent='保存每日目标';form.append(save);
 form.onsubmit=e=>{e.preventDefault();const value=Object.fromEntries(Object.entries(inputs).map(([k,input])=>[k,Number(input.value)]));onSave(value);};host.append(form);
 if(targets){const clear=document.createElement('button');clear.type='button';clear.textContent='清除目标';clear.onclick=onClear;host.append(clear);}
}
