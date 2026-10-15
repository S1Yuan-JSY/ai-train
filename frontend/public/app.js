import {createMealReview} from './meal-review.js?v=20261015-save-fix';
import {renderCoachMarkdown} from './coach-format.js?v=20261013-coach';
import {initLabelPanel} from './label.js?v=20261011-camera';
import {emptyState,ProfileSchema,FoodSchema,ActionSchema,applyAction,parseLocal,metabolism,totals,rollover,localDay,findTraining,saveTrainingPlan,removeTrainingPlan,trainingDate,labelFood,labelExtras,parseLabelText} from './core.js?v=20261014-review';
let state=emptyState(),revision=0,token='',connected=false,busy=false,pending=null;
let user=null,threadId=null,agentEnabled=false;let resetLabel=null;
let selectedDate=localDay(),calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tell=message=>{$('notice').textContent=message;$('login-notice').textContent=message;};
function lock(value){busy=value;document.querySelectorAll('button').forEach(b=>b.disabled=value||b.dataset.unavailable==='true');}
async function api(path,method='GET',body){const response=await fetch(path,{method,credentials:'same-origin',signal:AbortSignal.timeout(path==='/agent/chat'?90000:path==='/meal/analyze'?60000:30000),headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});let result;try{result=await response.json();}catch{throw new Error('服务器返回格式异常，请检查服务是否运行。');}if(!response.ok){if(result.thread_id)threadId=result.thread_id;throw new Error(typeof result.detail==='string'?result.detail:result.error??`请求失败 (${response.status})`);}return result;}
async function persist(next,message){if(!connected)throw new Error('请先在设置页连接长期记忆。');const result=await api('/memory','PUT',{revision,state:next});revision=result.revision;state=next;render();tell(message);}
async function guarded(fn){if(busy)return;lock(true);try{await fn();}catch(e){tell(e.message);}finally{lock(false);}}
function previewBatch(action){
 pending=action;$('pending').replaceChildren();
 const rows=action.actions.map((a,i)=>[i+1,a.type==='set'?a.exercise:({start:'开始训练',finish:'结束训练',weight:'体重',bodyfat:'体脂',food:'饮食'}[a.type]),a.type==='set'?`${a.weight}kg × ${a.reps??'待补'}次`:a.day??a.name??a.value??'']);
 const box=card('核对批量记录',table(['顺序','动作','内容'],rows));
 box.append(actionButton('核对正确，全部保存',async()=>{if(pending)await commit(pending);}),actionButton('取消',async()=>{pending=null;$('pending').replaceChildren();tell('已取消，未保存。');}));
 $('pending').append(box);tell(`已解析 ${action.actions.length} 项，请核对后全部保存。`);
}
function reviewMeal(action){
 const parsed=ActionSchema.parse(action);if(parsed.type!=='meal_estimate')throw new Error('饮食分析格式异常，未保存。');
 show('diet');const container=$('meal-review');container.replaceChildren(createMealReview(parsed,{
  guard:guarded,
  save:async revised=>{await commit(ActionSchema.parse(revised));container.replaceChildren();$('meal-message').value='';$('message').value='';$('nutrition-summary').scrollIntoView({behavior:'smooth',block:'center'});},
  cancel:()=>{container.replaceChildren();tell('已取消本次饮食草稿，未保存。');}
 }));tell('识别完成，请核对份量和油糖后保存。');container.scrollIntoView({behavior:'smooth',block:'start'});
}
async function commit(action){
 if(action.type==='batch'){
  const firstTraining=action.actions.find(a=>['start','set','finish'].includes(a.type));
  if(!rollover(state).current&&firstTraining?.type==='set'){
   pending=action;$('pending').replaceChildren();const box=card('选择本批记录的训练日','<p>选择后一次保存全部记录。</p>');
   for(const day of ['胸日','背日','腿日','肩日','手臂日','全身日'])box.append(actionButton(day,async()=>{await commit({type:'batch',actions:[{type:'start',day},...action.actions]});}));
   box.append(actionButton('取消',async()=>{pending=null;$('pending').replaceChildren();tell('已取消，未保存。');}));$('pending').append(box);return;
  }
  const id=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;
  const result=applyAction(state,action,id);
  if(!result.state.processed.includes(id)){tell(result.message);return;}
  await persist(result.state,result.message);pending=null;$('pending').replaceChildren();$('message').value='';return;
 }
if(action.type==='ask'){tell(action.message);$('message').value='';return;}if(action.type==='training_query'){const result=findTraining(state,action);$('pending').replaceChildren();if(result){$('pending').append(card(`${action.scope==='previous'?'上次':'本次'} ${result.day} · ${new Date(result.at).toLocaleString('zh-CN')}`,trainingTable(result)));tell('已从保存的训练记录读取，下方展示明细。');}else tell('暂无对应训练记录。请先记录训练并输入“结束训练”，才能查询上次训练。');$('message').value='';return;}if(action.type==='set'&&!state.current){pending=action;$('pending').replaceChildren();const box=card('选择训练日，保存刚才这一组',`<p>${esc(action.exercise)} · ${action.weight}kg · ${action.reps??'待补'}次</p>`);for(const day of ['胸日','背日','腿日','肩日','手臂日','全身日'])box.append(actionButton(day,async()=>{const id=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;const started=state.current?state:applyAction(state,{type:'start',day},`${id}-start`).state;const result=applyAction(started,action,id);await persist(result.state,result.message);pending=null;$('pending').replaceChildren();$('message').value='';$('training').scrollIntoView({behavior:'smooth',block:'start'});}));$('pending').append(box);tell('还没有开始训练。请选择训练日，刚才这组数据会保留并保存。');return;}const id=globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`;const result=applyAction(state,action,id);if(!result.state.processed.includes(id)){tell(result.message);return;}await persist(result.state,result.message);pending=null;$('pending').replaceChildren();$('message').value='';if(['set','start','finish'].includes(action.type))$('training').scrollIntoView({behavior:'smooth',block:'start'});}
function table(headers,rows){return `<div class="scroll"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="muted">暂无记录</td></tr>`}</tbody></table></div>`;}
function trainingTable(t){return table(['动作','组','kg','次数'],t.sets.map((r,i)=>[r.exercise,i+1,r.weight,r.reps??'待补']));}
function actionButton(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=()=>guarded(fn);return b;}
function card(title,html){const div=document.createElement('div');div.className='card';const h=document.createElement('h2');h.textContent=title;div.append(h);const content=document.createElement('div');content.innerHTML=html;div.append(content);return div;}
const profileFields=[['height','身高 cm *','number'],['weight','体重 kg *','number'],['sex','性别 *',['男','女']],['age','年龄 *','number'],['goal','训练目标 *',['减脂','增肌']],['mode','训练方式 *',['健身房','自重']],['plan','训练计划 *（没有可填“待制定”）','text'],['injuries','伤病、膝腰肩问题（选填）','text'],['allergies','过敏食物（选填）','text'],['conditions','慢性病（选填）','text'],['forbidden','禁忌动作（选填）','text']];
const foodFields=[['name','食物名称（注明生熟、品牌）','text'],['protein','蛋白质 g / 100g','number'],['carbs','碳水 g / 100g','number'],['fat','脂肪 g / 100g','number'],['kcal','热量 kcal / 100g','number'],['source','来源（包装标签、数据库条目）','text']];
function fields(container,definitions,prefix){$(container).innerHTML=definitions.map(([key,label,type])=>`<label class="${['plan','source','injuries'].includes(key)?'wide':''}">${esc(label)}${Array.isArray(type)?`<select id="${prefix}-${key}"><option value="">请选择</option>${type.map(v=>`<option>${esc(v)}</option>`).join('')}</select>`:`<input id="${prefix}-${key}" type="${type}" ${type==='number'?'step="any"':''} autocomplete="off">`}</label>`).join('');}
fields('profile-fields',profileFields,'p');fields('food-fields',foodFields,'f');
function render(){
 const view=rollover(state);
 const p=state.profile,last=state.weights.at(-1);const d=rollover(state).diet,total=totals(d.rows);
 $('overview').innerHTML=`<h2>${esc(localDay())} · 今日状态</h2><div class="metrics"><div class="metric"><strong>${p?esc(p.weight):last?esc(last.value):'—'}</strong><span>体重 kg</span></div><div class="metric"><strong>${p?metabolism(p).toFixed(0):'—'}</strong><span>基础代谢估算 kcal/天</span></div><div class="metric"><strong>${total.kcal.toFixed(0)}</strong><span>已记录摄入 kcal</span></div></div><p class="muted">${p?`${esc(p.goal)} · ${esc(p.mode)} · 指定 BMR 公式估算，非实测`:'档案待完善：请在档案页补全必填项。'}</p>`;
 $('history').innerHTML=table(['体重测量时间','kg'],[...state.weights].reverse().map(x=>[new Date(x.at).toLocaleString('zh-CN'),x.value]))+table(['体脂测量时间','%'],[...state.bodyfats].reverse().map(x=>[new Date(x.at).toLocaleString('zh-CN'),x.value]));
 for(const[key]of profileFields)$(`p-${key}`).value=state.profile?.[key]??'';
 $('record-status').innerHTML=`<h2>训练记录</h2><p>${state.current?`进行中：${esc(state.current.day)} · ${state.current.sets.length}组已保存`:'当前没有进行中的训练'}。已保留 ${Object.keys(state.previous).length} 种训练日的上次完成记录。</p><p class="muted">每组记录成功后立即显示在下方；结束训练后移入上次训练。数据保存到当前登录账号。</p>`;
 $('training').replaceChildren();
 if(state.current){const t=state.current;const current=card(`本次 ${t.day}`,trainingTable(t));
  t.sets.forEach((r,i)=>{const row=document.createElement('div');row.className='row-actions';row.append(actionButton(`第${i+1}组：${r.reps===null?'补次数':'修改次数'}`,async()=>{const response=prompt('输入次数（1–500）',r.reps??'');if(response===null)return;const n=Number(response);if(!Number.isInteger(n)||n<1||n>500)throw new Error('次数应是1–500的整数。');const next=structuredClone(rollover(state));next.current.sets[i].reps=n;await persist(next,'次数已保存。');}),actionButton(`撤销第${i+1}组`,async()=>{const next=structuredClone(rollover(state));next.current.sets.splice(i,1);await persist(next,'该训练组已撤销。');}));current.append(row);});
  current.append(actionButton('结束训练',()=>commit({type:'finish'})));$('training').append(current);
 }
 renderArchives(view,'training-history','trainings');
 if(!state.current&&!Object.keys(view.archives??{}).some(date=>view.archives[date].trainings.length))$('training').append(card('暂无训练记录','<p>输入“练胸日”开始记录。</p>'));
 renderCalendar();
 const todaySchedule=(state.schedules??[]).find(x=>x.date===localDay());
 $('today-plan').innerHTML=`<span class="plan-dot"></span><div><strong>${todaySchedule?`今日计划 · ${esc(todaySchedule.day)}`:'今天，由你安排'}</strong><p>${todaySchedule?`${esc(todaySchedule.time)} 开始 · ${todaySchedule.duration}分钟 · ${esc(todaySchedule.notes||'按计划稳步完成')}`:'在下方日历选择训练部位与时间，也可以直接开始记录。'}</p></div>`;
 $('nutrition-summary').innerHTML=`<div class="nutrition-metrics">${[['能量',total.kcal,'kcal'],['蛋白质',total.protein,'g'],['碳水',total.carbs,'g'],['脂肪',total.fat,'g']].map(([name,value,unit])=>`<div><span>${name}</span><strong>${Number(value).toFixed(name==='能量'?0:1)}<small>${unit}</small></strong></div>`).join('')}</div>`;
 const hasEstimate=d.rows.some(r=>r.estimate);
 $('diet-table').innerHTML=table(['食物','份量g','蛋白g','碳水g','脂肪g','kcal'],d.rows.map(r=>[r.food.name,r.estimate?`${r.grams}${r.estimate.gramsEstimated?'（估）':'（明确）'}`:r.grams,...[r.food.protein,r.food.carbs,r.food.fat,r.food.kcal].map(v=>`${r.estimate?'≈':''}${(v*r.grams/100).toFixed(r.food.label?2:1)}`)]))+`<p class="summary">${hasEstimate?'估算合计':'合计'} ${total.kcal.toFixed(0)} kcal · 蛋白 ${total.protein.toFixed(1)}g · 碳水 ${total.carbs.toFixed(1)}g · 脂肪 ${total.fat.toFixed(1)}g</p><p class="muted">仅汇总已记录食物。官方条目是参考值，模型估算另行标识；份量范围不包含烹饪和配方的全部不确定性。往日记录按日期保存并折叠，可在下方展开查看。</p>`;
 d.rows.forEach((r,i)=>{const row=document.createElement('div');row.className='meal-row';const text=document.createElement('p');text.className='muted';text.textContent=`${r.food.name}${r.estimate?.gramsEstimated?`，可食部分估算范围 ${r.estimate.portionMin}–${r.estimate.portionMax}g`:''}。来源：${r.food.source}`;row.append(text);
 if(r.estimate){const badge=document.createElement('span');badge.className='source-badge '+(r.estimate.nutritionBasis==='database'?'':'estimated');badge.textContent=`${r.estimate.nutritionBasis==='database'?'USDA参考':'模型估算'} · ${r.estimate.gramsEstimated?'份量估计':'已提供克数'}`;row.prepend(badge);if(r.estimate.nutritionBasis==='database'&&r.estimate.sourceId?.match(/^FDC\d+$/)){const link=document.createElement('a');link.href=`https://fdc.nal.usda.gov/food-details/${r.estimate.sourceId.slice(3)}/nutrients`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='查看原始条目 ↗';link.className='source-link';row.append(link);}const details=document.createElement('details');details.innerHTML=`<summary>${esc(r.food.name)} · 匹配与份量假设</summary><ul>${r.estimate.assumptions.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>`;row.append(details);}
 if(r.food.label?.extras.length){const extra=document.createElement('p');extra.className='muted';extra.textContent='标签换算 · '+labelExtras(r.food.label,r.grams).map(n=>`${n.name} ${n.amount.toFixed(2)}${n.unit}`).join(' · ');row.append(extra);}
 row.append(actionButton(`修改第${i+1}条份量`,async()=>{const input=prompt('输入实际摄入克数（可食部分）',String(r.grams));if(input===null)return;const grams=Number(input);if(!Number.isFinite(grams)||grams<=0||grams>10000)throw new Error('克数应大于0且不超过10000。');const next=structuredClone(rollover(state));next.diet.rows[i].grams=grams;if(next.diet.rows[i].estimate){const e=next.diet.rows[i].estimate;e.gramsEstimated=false;e.portionMin=grams;e.portionMax=grams;e.assumptions=[`用户修正重量为${grams}g；营养成分沿用该条记录所注明来源。`,...e.assumptions.slice(0,7)];}await persist(next,'份量已修正，营养汇总已重新计算。');}),actionButton(`撤销第${i+1}条`,async()=>{const next=structuredClone(rollover(state));next.diet.rows.splice(i,1);await persist(next,'饮食记录已撤销。');}));$('diet-table').append(row);});
 renderArchives(view,'diet-history','meals');
 $('food-table').innerHTML=table(['每100g','蛋白','碳水','脂肪','kcal'],state.foods.map(f=>[f.name,f.protein,f.carbs,f.fat,f.kcal]));
}
function renderArchives(view,target,kind){
 const host=$(target);const openDates=new Set([...host.querySelectorAll('details[open]')].map(d=>d.dataset.date));host.replaceChildren();
 const dates=Object.keys(view.archives??{}).filter(date=>view.archives[date][kind].length).sort().reverse();
 if(!dates.length){host.textContent='暂无往日记录。';return;}
 for(const date of dates){
  const daily=view.archives[date],rows=daily[kind],details=document.createElement('details');details.className='daily-archive';details.dataset.date=date;
  const summary=document.createElement('summary');const n=totals(daily.meals);
  summary.textContent=kind==='meals'?`${date} · ${rows.length}项饮食 · ${n.kcal.toFixed(0)} kcal`:`${date}${date===localDay()?' · 今天':''} · ${rows.length}次训练 · ${rows.reduce((sum,t)=>sum+t.sets.length,0)}组`;
  details.append(summary);let loaded=false;details.ontoggle=()=>{if(!details.open||loaded)return;loaded=true;const body=document.createElement('div');
   if(kind==='meals'){
    body.innerHTML=table(['食物','克数','蛋白g','碳水g','脂肪g','kcal'],rows.map(r=>[r.food.name,r.grams,...[r.food.protein,r.food.carbs,r.food.fat,r.food.kcal].map(v=>(v*r.grams/100).toFixed(r.food.label?2:1))]))+`<p class="summary">蛋白 ${n.protein.toFixed(1)}g · 碳水 ${n.carbs.toFixed(1)}g · 脂肪 ${n.fat.toFixed(1)}g</p>`;
    for(const r of rows){const source=document.createElement('p');source.className='muted';source.textContent=`${r.food.name} · ${r.food.source}${r.food.label?.extras.length?' · '+labelExtras(r.food.label,r.grams).map(x=>`${x.name} ${x.amount.toFixed(2)}${x.unit}`).join(' · '):''}`;body.append(source);}
   }else for(const t of rows){body.append(card(`${t.day} · ${new Date(t.at).toLocaleTimeString('zh-CN')}${t.autoClosed?' · 跨日归档':''}`,trainingTable(t)));}
   details.append(body);
  };host.append(details);details.open=openDates.has(date)||(kind==='trainings'&&date===localDay());
 }
}
function show(tab){if(tab!=='diet')resetLabel?.closeCamera?.();document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===tab));document.querySelectorAll('#tabs button').forEach(x=>(x.classList.toggle('active',x.dataset.tab===tab),x.setAttribute('aria-pressed',String(x.dataset.tab===tab))));window.scrollTo(0,0);}
$('tabs').onclick=e=>{const t=e.target.closest('[data-tab]');if(t)show(t.dataset.tab);};
document.querySelectorAll('[data-message]').forEach(b=>b.onclick=()=>{$('message').value=b.dataset.message;});
$('connect-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{const value=$('access-token').value.trim();clearIdentity();token=value;await loadAccount();tell('已连接旧版共享档案；独立 Agent 记忆请登录账号。');show('record');});};
$('profile-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{const raw={};for(const[key,label,type]of profileFields){const value=$(`p-${key}`).value.trim();if(label.includes('*')&&!value)throw new Error(`缺少：${label}`);raw[key]=type==='number'?Number(value):value||null;}const parsed=ProfileSchema.parse(raw);const next=structuredClone(rollover(state));if(next.profile?.weight!==parsed.weight)next.weights.push({value:parsed.weight,at:new Date().toISOString()});next.profile=parsed;await persist(next,'个人档案已保存，基础代谢估算已更新。');});};
$('food-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{const raw={};for(const[key,,type]of foodFields){const value=$(`f-${key}`).value.trim();if(!value)throw new Error('请填写所有营养值和来源，未知数据不能填成0。');raw[key]=type==='number'?Number(value):value;}const parsed=FoodSchema.parse(raw);const next=structuredClone(rollover(state));next.foods=[...next.foods.filter(f=>f.name!==parsed.name),parsed];await persist(next,'食物已保存。旧的饮食记录保留原营养快照。');$('food-form').reset();});};
$('send').onclick=()=>guarded(async()=>{if(!connected)throw new Error('请先在设置页连接长期记忆。');const text=$('message').value.trim();if(!text)return;pending=null;$('pending').replaceChildren();const local=parseLocal(text,state);const isMeal=/吃了|吃过|吃的是|早餐|午餐|晚餐|加餐/.test(text);const context={day:state.current?.day??null,lastExercise:state.current?.sets.at(-1)?.exercise??null,foods:state.foods.map(f=>f.name)};
 if(isMeal&&!(local?.type==='food'&&state.foods.some(f=>f.name===local.name))){if(!$('online').checked)throw new Error('这条饮食描述需要联网估算，请启用 DeepSeek；也可用食物库的明确名称和克数离线记录。');tell('正在调用提取 tool，再分析营养和份量；结果将整理为待核对草稿。');const result=await api('/meal/analyze','POST',{text,context});const action=ActionSchema.parse(result.action);if(action.type!=='meal_estimate')throw new Error('饮食分析格式异常，未保存。');reviewMeal(action);return;}
 if(local){if(local.type==='batch')previewBatch(local);else await commit(local);return;}if(!$('online').checked)throw new Error('请用明确格式记录，或启用 DeepSeek 解析。');const result=await api('/parse','POST',{text,context});const action=ActionSchema.parse(result.action);if(action.type==='ask'){tell(action.message);return;}if(action.type==='batch'){previewBatch(action);return;}pending=action;const pre=document.createElement('pre');pre.textContent=JSON.stringify(action,null,2);$('pending').append(pre,actionButton('核对正确，保存',async()=>{if(pending)await commit(pending);}),actionButton('取消',async()=>{pending=null;$('pending').replaceChildren();tell('已取消，未保存。');}));tell('LangChain 已解析，请核对后保存。');});
$('message').oninput=()=>{pending=null;$('pending').replaceChildren();};
$('export').onclick=()=>{if(!connected){tell('请先连接记忆。');return;}const blob=new Blob([JSON.stringify({...rollover(state),processed:[]},null,2)],{type:'application/json'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download=`ai-train-${localDay()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);};
function dayCheck(){if(!connected||busy)return;const next=rollover(state);if(next!==state)guarded(()=>persist(next,'往日饮食与训练已按日期归档，已切换到今天。'));}
setInterval(dayCheck,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)dayCheck();});

function fillSchedule(){const plan=(state.schedules??[]).find(p=>p.date===selectedDate);$('schedule-date').value=selectedDate;const options=['胸日','背日','腿日','肩日','手臂日','腹日','全身日','休息日'];$('schedule-day').value=plan?(options.includes(plan.day)?plan.day:'自定义'):'胸日';$('schedule-custom').value=plan&&!options.includes(plan.day)?plan.day:'';$('schedule-time').value=plan?.time??'19:00';$('schedule-duration').value=plan?.duration??45;$('schedule-notes').value=plan?.notes??'';}
function renderCalendar(){const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();$('calendar-month').textContent=`${year}年${month+1}月`;$('calendar-grid').replaceChildren();const offset=(new Date(year,month,1).getDay()+6)%7;for(let i=0;i<offset;i++){const blank=document.createElement('span');blank.className='calendar-blank';$('calendar-grid').append(blank);}const count=new Date(year,month+1,0).getDate();for(let day=1;day<=count;day++){const date=localDay(new Date(year,month,day)),plan=(state.schedules??[]).find(p=>p.date===date);const button=document.createElement('button');button.type='button';button.className=`calendar-day${date===selectedDate?' selected':''}${date===localDay()?' today':''}${plan?' planned':''}`;button.setAttribute('aria-label',`${date}${plan?` ${plan.day} ${plan.time}`:''}`);button.setAttribute('aria-pressed',String(date===selectedDate));button.innerHTML=`<span>${day}</span>${plan?`<small>${esc(plan.day)}<br>${esc(plan.time)}</small>`:''}`;button.onclick=()=>{selectedDate=date;renderCalendar();};$('calendar-grid').append(button);}fillSchedule();const rows=(state.schedules??[]).filter(p=>p.date>=localDay()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,14);$('schedule-list').innerHTML=table(['日期','训练','时间','分钟'],rows.map(p=>[p.date,p.day,p.time,p.duration]));}
$('month-prev').onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderCalendar();};
$('month-next').onclick=()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar();};
$('calendar-today').onclick=()=>{selectedDate=localDay();calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();};
$('schedule-date').onchange=()=>{if(!$('schedule-date').value)return;selectedDate=$('schedule-date').value;const [y,m]=selectedDate.split('-').map(Number);calendarMonth=new Date(y,m-1,1);renderCalendar();};
$('schedule-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{const day=$('schedule-day').value==='自定义'?$('schedule-custom').value.trim():$('schedule-day').value;const plan={date:$('schedule-date').value,day,time:$('schedule-time').value,duration:Number($('schedule-duration').value),notes:$('schedule-notes').value.trim()};const next=saveTrainingPlan(rollover(state),plan);selectedDate=plan.date;await persist(next,`${plan.date} ${plan.day}计划已保存，开始时间${plan.time}，预计${plan.duration}分钟。`);});};
$('schedule-delete').onclick=()=>guarded(async()=>{const date=$('schedule-date').value;if(!(state.schedules??[]).some(p=>p.date===date)){tell('当天没有已保存的计划。');return;}await persist(removeTrainingPlan(rollover(state),date),'当天计划已删除，实际训练记录保留。');});
$('schedule-start').onclick=()=>guarded(async()=>{const plan=(state.schedules??[]).find(p=>p.date===$('schedule-date').value);if(!plan)throw new Error('请先保存当天计划。');if(plan.day==='休息日')throw new Error('当前为休息日计划。');if(state.current)throw new Error('当前训练尚未结束，请先到记录页结束训练。');await commit({type:'start',day:plan.day});show('record');tell(`已按${plan.date}的${plan.day}计划开始本次训练，实际记录时间为现在。`);});

render();show('settings');

function clearIdentity(){$('meal-review').replaceChildren();resetLabel?.();$('app-shell').hidden=true;$('login-screen').hidden=false;connected=false;user=null;threadId=null;agentEnabled=false;token='';state=emptyState();revision=0;pending=null;$('pending').replaceChildren();$('chat-history').replaceChildren();$('agent-memories').replaceChildren();$('thread-select').innerHTML='<option value="">新会话</option>';$('message').value='';$('chat-message').value='';$('meal-message').value='';$('nutrition-results').replaceChildren();$('preference-form').reset();render();}
async function loadAccount(){const me=await api('/auth/me');user=me.user;agentEnabled=me.agent_memory&&user.id!=='legacy';const result=await api('/memory');state=result.state??emptyState();revision=result.revision;connected=true;const normalized=rollover(state);if(normalized!==state)await persist(normalized,'往日记录已归档。');else render();$('login-screen').hidden=true;$('app-shell').hidden=false;$('account-status').textContent=`当前：${user.username}`;$('agent-status').textContent=agentEnabled?'个人记忆已连接 · 训练知识 + USDA 食物参考':'请登录个人账号后使用私教对话。';if(agentEnabled){await refreshMemories();await refreshThreads();}await searchNutrition('');tell('已连接个人账号，服务端记录已恢复。');}
async function refreshThreads(){const result=await api('/agent/threads');$('thread-select').innerHTML='<option value="">新会话</option>'+result.threads.map(t=>`<option value="${esc(t.id)}">${esc(new Date(t.created*1000).toLocaleString('zh-CN'))} · ${esc(t.id.slice(0,6))}</option>`).join('');$('thread-select').value=threadId??'';}
function appendChat(role,content,sources=[]){const box=document.createElement('div');box.className='chat-message '+(role==='human'?'from-user':'from-coach');const title=document.createElement('strong');title.textContent=role==='human'?'你':'爱练私教';const p=document.createElement('div');const text=typeof content==='string'?content:JSON.stringify(content);title.className='chat-author';if(role==='human'){p.className='chat-user-text';p.textContent=text;}else{p.className='coach-prose';p.innerHTML=renderCoachMarkdown(text);}box.append(title,p);if(sources.length){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=`知识参考 · ${sources.length}个片段`;details.append(summary);for(const source of sources){const item=document.createElement('div');item.dataset.source=source.id;item.tabIndex=-1;const heading=document.createElement('strong');heading.textContent=`[${source.id}] ${source.source}`;const excerpt=document.createElement('p');excerpt.textContent=source.text;item.append(heading,excerpt);details.append(item);}box.append(details);}for(const button of p.querySelectorAll('[data-citation]')){const item=[...box.querySelectorAll('[data-source]')].find(el=>el.dataset.source===button.dataset.citation);if(item)button.onclick=()=>{item.closest('details').open=true;item.scrollIntoView({block:'nearest',behavior:'smooth'});item.focus({preventScroll:true});};else{const label=document.createElement('span');label.className='coach-citation unavailable';label.textContent=button.textContent;label.title='当前消息未附带该参考片段';button.replaceWith(label);}}$('chat-history').append(box);box.scrollIntoView({block:'nearest'});}
async function refreshMemories(){const result=await api('/agent/memories');$('agent-memories').replaceChildren();if(!result.memories.length)$('agent-memories').textContent='暂无长期偏好；可以在对话中说“记住…”，或在下方填写。';for(const memory of result.memories){const row=card(memory.key,`<p>${esc(memory.text)}</p><p class="muted">用户陈述 · ${esc(memory.updated_at)}</p>`);row.append(actionButton('修改',async()=>{$('preference-key').value=memory.key;$('preference-text').value=memory.text;}),actionButton('删除记忆',async()=>{await api(`/agent/memories/${encodeURIComponent(memory.key)}`,'DELETE');await refreshMemories();tell('已删除长期记忆。旧会话文字仍保留，可切换新会话。');}));$('agent-memories').append(row);}}
$('account-form').onsubmit=e=>{e.preventDefault();const mode=e.submitter?.value??'login';guarded(async()=>{clearIdentity();const body={username:$('username').value.trim(),password:$('password').value};await api(`/auth/${mode}`,'POST',body);$('password').value='';await loadAccount();show(state.profile?'home':'profile');});};
$('logout').onclick=()=>guarded(async()=>{token='';await api('/auth/logout','POST',{});clearIdentity();$('access-token').value='';$('password').value='';$('account-status').textContent='已退出登录。';$('agent-status').textContent='请登录账号。';tell('已退出，服务端数据保留。');show('settings');});
$('import-legacy').onclick=()=>guarded(async()=>{if(!user||user.id==='legacy')throw new Error('请先登录独立账号。');const invite=prompt('输入旧档案的 APP_ACCESS_TOKEN，导入只允许空账号。');if(!invite)return;await api('/memory/import-legacy','POST',{invite_token:invite});await loadAccount();tell('旧档案已复制到当前账号，原档案保留。');});
$('memory-refresh').onclick=()=>guarded(refreshMemories);
$('preference-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{await api(`/agent/memories/${encodeURIComponent($('preference-key').value.trim())}`,'PUT',{text:$('preference-text').value.trim()});await refreshMemories();$('preference-form').reset();tell('长期记忆已保存；同主题旧内容已更新。');});};
$('chat-send').onclick=()=>guarded(async()=>{if(!agentEnabled)throw new Error('请先登录个人账号。');const text=$('chat-message').value.trim();if(!text)return;$('chat-send').disabled=true;$('chat-progress').textContent='私教正在查阅知识与个人记录…';let result;try{result=await api('/agent/chat','POST',{text,thread_id:threadId});}finally{$('chat-send').disabled=false;$('chat-progress').textContent='Enter 发送 · Shift + Enter 换行';}threadId=result.thread_id;appendChat('human',text);appendChat('ai',result.answer,result.sources??[]);$('chat-message').value='';await refreshMemories();await refreshThreads();tell('私教已回复，对话已保存。');});
$('thread-select').onchange=()=>guarded(async()=>{threadId=$('thread-select').value||null;$('chat-history').replaceChildren();if(threadId){const result=await api(`/agent/threads/${threadId}/messages`);for(const message of result.messages)appendChat(message.role,message.content,message.sources??[]);}tell(threadId?'历史会话已恢复。':'已开启新会话，长期记忆仍会读取。');});
// HttpOnly sessions survive page reloads. Never store passwords or API keys in browser storage.
guarded(async()=>{try{await loadAccount();show('home');}catch(e){if(e.message!=='请登录账号')tell(e.message);}});

$('new-chat').onclick=()=>{$('thread-select').value='';$('thread-select').dispatchEvent(new Event('change'));};
for(const button of document.querySelectorAll('[data-coach]'))button.onclick=()=>{$('chat-message').value=button.dataset.coach;$('chat-message').focus();};
$('chat-message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(!$('chat-send').disabled)$('chat-send').click();}});

// Structured nutrition retrieval: no model call needed for a known food and grams.
let nutritionOffset=0,nutritionQuery='',nutritionRequest=0;
async function searchNutrition(query,offset=0){
 const requestId=++nutritionRequest;
 nutritionQuery=query;nutritionOffset=offset;
 const params=new URLSearchParams({q:query,offset:String(offset),limit:'12',category:$('nutrition-category').value,method:$('nutrition-method').value});
 const result=await api('/nutrition/search?'+params);
 if(requestId!==nutritionRequest)return;
 if($('nutrition-category').options.length===1)for(const category of result.categories){const option=document.createElement('option');option.value=category;option.textContent=category;$('nutrition-category').append(option);}
 $('nutrition-prev').dataset.unavailable=String(offset===0);$('nutrition-next').dataset.unavailable=String(offset+result.foods.length>=result.total);
 $('nutrition-prev').disabled=busy||offset===0;$('nutrition-next').disabled=busy||offset+result.foods.length>=result.total;
 $('nutrition-page').textContent=result.total?`${offset+1}–${offset+result.foods.length} / ${result.total} 条`:'0 条';
 $('nutrition-status').textContent=`已收录 ${result.count} 条官方参考 · 当前匹配 ${result.total} 条 · ${result.foods.length?'请选择与实际食物相符的生熟和烹调形态':'未找到匹配条目，可手动录入包装标签或用餐食描述估算'}`;
 $('nutrition-results').replaceChildren();
 for(const food of result.foods){
  const box=document.createElement('article');box.className='food-reference';
  const title=document.createElement('h3');title.textContent=food.name;
  const original=document.createElement('p');original.className='muted';original.textContent=food.description;
  const numbers=document.createElement('p');numbers.className='food-numbers';numbers.textContent=`${food.per100g.kcal} kcal · 蛋白 ${food.per100g.protein}g · 碳水 ${food.per100g.carbs}g · 脂肪 ${food.per100g.fat}g / 100g`;
  const nutrients=document.createElement('details');const nutrientTitle=document.createElement('summary');nutrientTitle.textContent='膳食纤维、矿物质与维生素（每100g）';nutrients.append(nutrientTitle);
  const extra=document.createElement('p');extra.className='muted';extra.textContent=[['fiber','膳食纤维','g'],['calcium','钙','mg'],['iron','铁','mg'],['magnesium','镁','mg'],['potassium','钾','mg'],['sodium','钠','mg'],['zinc','锌','mg'],['vitaminC','维生素C','mg']].map(([key,name,unit])=>`${name} ${food.nutrientsPer100g?.[key]==null?'未提供':food.nutrientsPer100g[key]+unit}`).join(' · ');nutrients.append(extra);
  const link=document.createElement('a');link.href=`https://fdc.nal.usda.gov/food-details/${food.fdc_id}/nutrients`;link.target='_blank';link.rel='noopener noreferrer';link.className='source-link';link.textContent=`USDA · ${food.id} · 2018-04 ↗`;
  const controls=document.createElement('div');controls.className='food-portion';const label=document.createElement('label');label.textContent='可食重量（g）';const input=document.createElement('input');input.type='number';input.min='0.1';input.max='10000';input.step='any';input.value='100';label.append(input);
  const button=actionButton('记录到今天',async()=>{const grams=Number(input.value);if(!Number.isFinite(grams)||grams<=0||grams>10000)throw new Error('请输入有效的可食克数（0–10000g）。');const result=await api('/nutrition/portion','POST',{food_id:food.id,grams});await commit(ActionSchema.parse(result.action));$('nutrition-summary').scrollIntoView({behavior:'smooth',block:'center'});});
  controls.append(label,button);box.append(title,original,numbers,nutrients,link,controls);$('nutrition-results').append(box);
 }
}
$('nutrition-search-form').onsubmit=e=>{e.preventDefault();guarded(()=>searchNutrition($('nutrition-query').value.trim()));};
for(const button of document.querySelectorAll('[data-food-query]'))button.onclick=()=>guarded(async()=>{$('nutrition-query').value=button.dataset.foodQuery;await searchNutrition(button.dataset.foodQuery);});
for(const button of document.querySelectorAll('[data-open]'))button.onclick=()=>show(button.dataset.open);
$('meal-form').onsubmit=e=>{e.preventDefault();guarded(async()=>{const text=$('meal-message').value.trim();if(!text)return;if(!connected)throw new Error('请先登录账号。');$('meal-progress').textContent='正在提取食物、检索参考数据并估计份量…';try{const result=await api('/meal/analyze','POST',{text,context:{day:state.current?.day??null,lastExercise:state.current?.sets.at(-1)?.exercise??null,foods:state.foods.map(f=>f.name)}});reviewMeal(result.action);}finally{$('meal-progress').textContent='优先检索官方条目 · 模糊份量会标注估算';}});};

for(const id of ['nutrition-category','nutrition-method'])$(id).onchange=()=>guarded(()=>searchNutrition($('nutrition-query').value.trim()));
$('nutrition-prev').onclick=()=>guarded(()=>searchNutrition(nutritionQuery,Math.max(0,nutritionOffset-12)));
$('nutrition-next').onclick=()=>guarded(()=>searchNutrition(nutritionQuery,nutritionOffset+12));

resetLabel=initLabelPanel({isConnected:()=>connected,save:async(row,remember)=>{
 if(busy)throw new Error('另一条记录正在保存，请稍后重试。');lock(true);
 try{const next=structuredClone(rollover(state));next.diet.rows.push(row);if(remember)next.foods=[...next.foods.filter(f=>f.name!==row.food.name),row.food];await persist(next,'包装标签营养已按克换算并保存。');}finally{lock(false);}
}});
