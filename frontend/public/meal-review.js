export function adjustMealItem(original, grams, oil, sugar){
 if(!Number.isFinite(grams)||grams<=0||grams>10000)throw new Error('请输入0–10000g之间的有效成品份量。');
 const row=structuredClone(original),e=row.estimate;
 const known=Number.isFinite(e.addedOilPer100g)&&Number.isFinite(e.addedSugarPer100g);
 if(known){
  if(![oil,sugar].every(x=>Number.isFinite(x)&&x>=0)||oil+sugar>grams)throw new Error('油糖用量不能为负，合计不能超过成品份量。');
  const oil100=oil*100/grams,sugar100=sugar*100/grams;
  const fat=row.food.fat-e.addedOilPer100g+oil100;
  const carbs=row.food.carbs-e.addedSugarPer100g+sugar100;
  const kcal=row.food.kcal+9*(oil100-e.addedOilPer100g)+4*(sugar100-e.addedSugarPer100g);
  if(fat<0||carbs<0||kcal<0||row.food.protein+fat+carbs>100.5)throw new Error('修改后的营养比例不合理，请核对份量和油糖克数。');
  if(Math.abs(oil100-e.addedOilPer100g)>1e-8||Math.abs(sugar100-e.addedSugarPer100g)>1e-8){
   row.food.fat=fat;row.food.carbs=carbs;row.food.kcal=kcal;
   row.food.source='用户调整油糖后的营养估算；原参考：'+row.food.source;
   row.food.label=null;e.nutritionBasis='model';
   for(const key of ['sourceId','sourceUrl','matchedName','sourceRelease'])delete e[key];
  }
  e.addedOilPer100g=oil100;e.addedSugarPer100g=sugar100;
 }
 row.grams=grams;
 if(grams!==original.grams){e.gramsEstimated=false;e.portionMin=grams;e.portionMax=grams;}
 e.assumptions=[known?`用户核对：成品${grams}g，其中额外油${oil.toFixed(1)}g、糖${sugar.toFixed(1)}g；替换原油糖估计，不重复添加。`:`用户核对成品份量${grams}g；模型未分离油糖，保留原营养估计。`,...e.assumptions.slice(0,7)];
 return row;
}

export function createMealReview(action,{save,cancel,guard}){
 const host=document.createElement('section');host.className='card meal-review';
 const title=document.createElement('h2');title.textContent='核对这一餐 · 尚未保存';host.append(title);
 const hint=document.createElement('p');hint.className='muted';hint.textContent='油和糖是本次吃下这份成品中的额外添加量，不是整锅用量，也不是总脂肪或总碳水。修改会替换原估计，不会重复计算。其他食材比例仍为估算。';host.append(hint);
 const editors=[];
 function field(label,value,disabled=false){const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.type='number';input.step='any';input.min='0';input.max='10000';input.value=value;input.disabled=disabled;wrap.append(input);return {wrap,input};}
 for(const row of action.items){
  const panel=document.createElement('div');panel.className='meal-review-item';const heading=document.createElement('h3');heading.textContent=row.food.name;panel.append(heading);
  const known=Number.isFinite(row.estimate.addedOilPer100g)&&Number.isFinite(row.estimate.addedSugarPer100g);
  const fields=document.createElement('div');fields.className='fields';
  const grams=field('成品可食份量（g）',row.grams),oil=field('这份中的额外油（g）',known?row.estimate.addedOilPer100g*row.grams/100:'',!known),sugar=field('这份中的额外糖（g）',known?row.estimate.addedSugarPer100g*row.grams/100:'',!known);
  fields.append(grams.wrap,oil.wrap,sugar.wrap);panel.append(fields);
  const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=known?'查看原始估算依据':'未提供油糖拆分：可修改份量，重新分析后可调整油糖';details.append(summary);const notes=document.createElement('p');notes.textContent=row.estimate.assumptions.join('\n');details.append(notes);panel.append(details);
  const read=()=>{const value=input=>input.value.trim()===''?NaN:Number(input.value);return adjustMealItem(row,value(grams.input),value(oil.input),value(sugar.input));};
  const preview=document.createElement('p');preview.className='meal-review-preview';preview.setAttribute('aria-live','polite');panel.append(preview);
  const refresh=()=>{try{const r=read();preview.textContent=`≈ ${(r.food.kcal*r.grams/100).toFixed(0)} kcal · 蛋白 ${(r.food.protein*r.grams/100).toFixed(1)}g · 碳水 ${(r.food.carbs*r.grams/100).toFixed(1)}g · 脂肪 ${(r.food.fat*r.grams/100).toFixed(1)}g`;}catch(e){preview.textContent=e.message;}};
  for(const input of [grams.input,oil.input,sugar.input])input.addEventListener('input',refresh);
  refresh();editors.push(read);host.append(panel);
 }
 const controls=document.createElement('div');controls.className='actions';const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='核对完成，保存这一餐';confirm.onclick=()=>guard(async()=>{await save({type:'meal_estimate',items:editors.map(read => read())});});
 const abort=document.createElement('button');abort.type='button';abort.textContent='取消，不保存';abort.onclick=()=>cancel();controls.append(confirm,abort);host.append(controls);return host;
}
