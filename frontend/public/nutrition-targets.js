export function targetProgress(consumed,target){
 if(!Number.isFinite(consumed)||consumed<0||!Number.isFinite(target)||target<=0)throw new Error('目标应为大于0的有效克数');
 const difference=consumed-target;
 return {percent:Math.min(100,consumed/target*100),text:Math.abs(difference)<0.05?'已达目标':difference>0?`超出 ${difference.toFixed(1)}g`:`还差 ${(-difference).toFixed(1)}g`};
}
export function targetsFromRatios(ratios,weight){
 if(!ratios||!Number.isFinite(weight)||weight<=0)return null;
 return Object.fromEntries(['protein','carbs','fat'].map(key=>{if(!Number.isFinite(ratios[key])||ratios[key]<=0)throw new Error('请输入有效系数');return [key,ratios[key]*weight];}));
}
export function renderNutritionTargets(host,ratios,weight,totals,onSave,onClear){
 host.replaceChildren();const title=document.createElement('h2');title.textContent='长期饮食设置 · 按体重换算';host.append(title);
 const hint=document.createElement('p');hint.className='muted';hint.textContent='填写每公斤体重对应的营养克数（g/kg）。例如系数2、体重60kg，对应120g。系数长期保存，无需每天填写，档案体重更新后自动重算。';host.append(hint);
 const targets=targetsFromRatios(ratios,weight);
 const form=document.createElement('form');const fields=document.createElement('div');fields.className='fields';const inputs={};
 for(const [key,name,max] of [['protein','蛋白质',10],['carbs','碳水',20],['fat','脂肪',10]]){
  const label=document.createElement('label');label.textContent=name+'（g/kg体重）';const input=document.createElement('input');input.type='number';input.min='0.01';input.max=String(max);input.step='any';input.required=true;input.value=ratios?.[key]??'';label.append(input);fields.append(label);inputs[key]=input;

 }
 form.append(fields);const preview=document.createElement('p');preview.className='muted';form.append(preview);
 const refresh=()=>{try{const t=targetsFromRatios(Object.fromEntries(Object.entries(inputs).map(([k,input])=>[k,Number(input.value)])),weight);preview.textContent=t?`按已保存体重 ${weight}kg：蛋白质 ${t.protein.toFixed(1)}g · 碳水 ${t.carbs.toFixed(1)}g · 脂肪 ${t.fat.toFixed(1)}g`:'请先保存档案体重；系数可以先保存。';}catch{preview.textContent='填写三项系数后预览换算克数。';}};form.addEventListener('input',refresh);refresh();
 const save=document.createElement('button');save.className='primary';save.textContent='保存长期饮食设置';form.append(save);form.onsubmit=e=>{e.preventDefault();onSave(Object.fromEntries(Object.entries(inputs).map(([k,input])=>[k,Number(input.value)])));};host.append(form);
 if(ratios){const clear=document.createElement('button');clear.type='button';clear.textContent='清除饮食设置';clear.onclick=onClear;host.append(clear);}
}
