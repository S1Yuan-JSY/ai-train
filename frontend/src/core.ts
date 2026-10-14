import { z } from 'zod';
import {LabelSourceSchema} from './label';
export {labelFood,labelExtras,parseLabelText} from './label';

export const ProfileSchema = z.object({
  height: z.number().min(80).max(250), weight: z.number().min(20).max(400),
  sex: z.enum(['男','女']), age: z.number().int().min(18).max(100),
  goal: z.enum(['减脂','增肌']), mode: z.enum(['健身房','自重']),
  plan: z.string().trim().min(1).max(2000),
  injuries: z.string().max(2000).nullable(), allergies: z.string().max(2000).nullable(),
  conditions: z.string().max(2000).nullable(), forbidden: z.string().max(2000).nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;
export const EstimateSchema=z.object({assumptions:z.array(z.string().min(1).max(200)).min(1).max(8),confidence:z.enum(['低','中']),gramsEstimated:z.boolean(),portionMin:z.number().gt(0).max(10000),portionMax:z.number().gt(0).max(10000),nutritionBasis:z.enum(['database','model']).optional(),sourceId:z.string().regex(/^FDC\d+$/).optional(),sourceUrl:z.string().url().startsWith('https://fdc.nal.usda.gov/').optional(),matchedName:z.string().max(100).optional(),sourceRelease:z.string().max(40).optional(),addedOilPer100g:z.number().min(0).max(100).optional(),addedSugarPer100g:z.number().min(0).max(100).optional()}).strict();
const EstimatedMealItemSchema=z.object({food:z.object({name:z.string().min(1).max(100),protein:z.number().min(0).max(100),carbs:z.number().min(0).max(100),fat:z.number().min(0).max(100),kcal:z.number().min(0).max(1000),source:z.string().min(1).max(500),label:LabelSourceSchema.nullish()}).strict().refine(f=>f.protein+f.carbs+f.fat<=100.5),grams:z.number().gt(0).max(10000),estimate:EstimateSchema}).strict().refine(x=>x.estimate.portionMin<=x.grams&&x.grams<=x.estimate.portionMax,'份量估算范围不正确');
const RecordActionSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('weight'),value:z.number().min(20).max(400)}).strict(),
  z.object({type:z.literal('bodyfat'),value:z.number().gt(0).lt(100)}).strict(),
  z.object({type:z.literal('start'),day:z.string().trim().min(1).max(40)}).strict(),
  z.object({type:z.literal('set'),exercise:z.string().trim().min(1).max(80),weight:z.number().min(0).max(1000),reps:z.number().int().min(1).max(500).nullable()}).strict(),
  z.object({type:z.literal('food'),name:z.string().trim().min(1).max(100),grams:z.number().gt(0).max(10000)}).strict(),
  z.object({type:z.literal('finish')}).strict(),
]);
export const ActionSchema = z.discriminatedUnion('type', [
  ...RecordActionSchema.options,
  z.object({type:z.literal('batch'),actions:z.array(RecordActionSchema).min(1).max(100)}).strict(),
  z.object({type:z.literal('ask'),message:z.string().min(1).max(1000)}).strict(),
  z.object({type:z.literal('training_query'),day:z.string().nullable(),scope:z.enum(['previous','current'])}).strict(),
  z.object({type:z.literal('meal_estimate'),items:z.array(EstimatedMealItemSchema).min(1).max(30)}).strict(),
]);
export type Action=z.infer<typeof ActionSchema>;
export const FoodSchema=z.object({name:z.string().trim().min(1).max(100),protein:z.number().min(0).max(100),carbs:z.number().min(0).max(100),fat:z.number().min(0).max(100),kcal:z.number().min(0).max(1000),source:z.string().trim().min(1).max(500),label:LabelSourceSchema.nullish()}).refine(x=>x.protein+x.carbs+x.fat<=100.5,'每100g的三大营养素总量不能超过100g');
export type Food=z.infer<typeof FoodSchema>;
type Measurement={value:number;at:string};
export type Training={day:string;at:string;date?:string;autoClosed?:boolean;sets:{exercise:string;weight:number;reps:number|null}[]};
export const TrainingPlanSchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const [y,m,d]=value.split('-').map(Number);const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;},'日期无效'),day:z.string().trim().min(1).max(40),time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),duration:z.number().int().min(1).max(600),notes:z.string().trim().max(2000)}).strict();
export type TrainingPlan=z.infer<typeof TrainingPlanSchema>;
export type State={version:1;profile:Profile|null;weights:Measurement[];bodyfats:Measurement[];current:Training|null;previous:Record<string,Training>;schedules?:TrainingPlan[];foods:Food[];diet:{date:string;rows:{food:Food;grams:number;estimate?:z.infer<typeof EstimateSchema>|null}[]};processed:string[];archives?:Record<string,{meals:State['diet']['rows'];trainings:Training[]}>};
export function saveTrainingPlan(state:State,raw:unknown):State{const plan=TrainingPlanSchema.parse(raw);return {...state,schedules:[...(state.schedules??[]).filter(p=>p.date!==plan.date),plan].sort((a,b)=>a.date.localeCompare(b.date))};}
export function removeTrainingPlan(state:State,date:string):State{return {...state,schedules:(state.schedules??[]).filter(p=>p.date!==date)};}
export function localDay(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function emptyState():State{return {version:1,profile:null,weights:[],bodyfats:[],current:null,previous:{},foods:[],diet:{date:localDay(),rows:[]},processed:[]};}
export function metabolism(p:Profile){return 13.88*p.weight+4.16*p.height-3.43*p.age-112.40*(p.sex==='男'?0:1)+54.34;}
export function delta(previous:Measurement|undefined,current:Measurement,unit:string){
  if(!previous)return '首次记录，暂无上次测量。';
  const days=(Date.parse(current.at)-Date.parse(previous.at))/86400000;
  const diff=current.value-previous.value;
  const displayUnit=unit==='个百分点'?'%':unit;
  return `上次：${new Date(previous.at).toLocaleString('zh-CN')}，${previous.value}${displayUnit}。变化 ${diff>=0?'+':''}${diff.toFixed(2)}${unit}；间隔 ${days.toFixed(2)} 天。${days>0?`平均每周 ${(diff/days*7).toFixed(2)}${unit}（短间隔变化不代表长期趋势）。`:'同一时刻，无法计算变化速度。'}`;
}
export function totals(rows:State['diet']['rows']){return rows.reduce((t,r)=>({protein:t.protein+r.food.protein*r.grams/100,carbs:t.carbs+r.food.carbs*r.grams/100,fat:t.fat+r.food.fat*r.grams/100,kcal:t.kcal+r.food.kcal*r.grams/100}),{protein:0,carbs:0,fat:0,kcal:0});}
export function trainingDate(t:Training){return t.date??localDay(new Date(t.at));}
export function archiveTraining(s:State,t:Training){
 const date=trainingDate(t);s.archives??={};const old=s.archives[date]??{meals:[],trainings:[]};
 if(!old.trainings.some(x=>x.at===t.at&&x.day===t.day))s.archives[date]={...old,trainings:[...old.trainings,structuredClone(t)]};
}
export function rollover(s:State,now=new Date()):State{
 const today=localDay(now);
 const needsMigration=Object.values(s.previous).some(t=>!s.archives?.[trainingDate(t)]?.trainings.some(x=>x.at===t.at&&x.day===t.day));
 const oldCurrent=!!s.current&&trainingDate(s.current)<today;
 if(s.diet.date===today&&!needsMigration&&!oldCurrent)return s;
 const next:State=structuredClone(s);next.archives??={};
 for(const t of Object.values(next.previous))archiveTraining(next,t);
 if(oldCurrent&&next.current){if(next.current.sets.length){next.current.autoClosed=true;archiveTraining(next,next.current);next.previous[next.current.day]=next.current;}next.current=null;}
 if(next.diet.date!==today){
  const old=next.archives[next.diet.date]??{meals:[],trainings:[]};
  if(next.diet.rows.length)next.archives[next.diet.date]={...old,meals:[...old.meals,...next.diet.rows]};
  const restored=next.archives[today]?.meals??[];
  if(next.archives[today])next.archives[today]={...next.archives[today],meals:[]};
  next.diet={date:today,rows:restored};
 }
 return next;
}
export function applyAction(input:State,raw:unknown,id:string,now=new Date()):{state:State;message:string}{
  const query=ActionSchema.parse(raw);
  if(query.type==='training_query'){const training=findTraining(input,query);return {state:input,message:training?`${training.day} · ${new Date(training.at).toLocaleString('zh-CN')}：${training.sets.map(r=>`${r.exercise} ${r.weight}kg × ${r.reps??'未填'}次`).join('；')}`:'暂无对应训练记录。上次训练需要先记录并结束训练。'};}
  const a=ActionSchema.parse(raw); const base=rollover(input,now);
  if(base.processed.includes(id))return {state:base,message:'该请求已经保存，未重复记录。'};
  if(a.type==='batch'){
    let next=base;
    for(const [index,action] of a.actions.entries()){
      const childId=`${id}:${index}`;
      const result=applyAction(next,action,childId,new Date(now.getTime()+index));
      if(!result.state.processed.includes(childId))return {state:input,message:`第${index+1}项：${result.message}整批尚未保存。`};
      next=result.state;
    }
    next.processed=[...base.processed,id];
    return {state:next,message:`已保存 ${a.actions.length} 项记录，其中训练 ${a.actions.filter(x=>x.type==='set').length} 组。`};
  }
  const s:State=JSON.parse(JSON.stringify(base)); const at=now.toISOString(); let message='';
  if(a.type==='ask')return {state:base,message:a.message};
  if(a.type==='weight'||a.type==='bodyfat'){
    const list=a.type==='weight'?s.weights:s.bodyfats;
    const last=[...list].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
    const record={value:a.value,at}; message=delta(last,record,a.type==='weight'?'kg':'个百分点');list.push(record);
    if(a.type==='weight'&&s.profile)s.profile.weight=a.value;
    message=`已记录${a.type==='weight'?'体重':'体脂率'} ${a.value}${a.type==='weight'?'kg':'%'}。${message}`;
  }else if(a.type==='start'){
    if(s.current)return {state:base,message:`${s.current.day}尚未结束，请先输入“结束训练”。`};
    s.current={day:a.day,at,date:localDay(now),sets:[]};message=s.previous[a.day]?`已开始${a.day}，下方展示上次同类训练。`:`已开始${a.day}，暂无上次记录。`;
  }else if(a.type==='set'){
    if(!s.current)return {state:base,message:'请先输入“练胸日”等训练日名称。'};
    s.current.sets.push({exercise:a.exercise,weight:a.weight,reps:a.reps});
    message=`已记录 ${a.exercise} ${a.weight}kg。${a.reps===null?'还缺次数；可在表格中点击“补次数”。':''}`;
  }else if(a.type==='finish'){
    if(!s.current?.sets.length)return {state:base,message:'当前没有可保存的训练组。'};
    archiveTraining(s,s.current);s.previous[s.current.day]=s.current;s.current=null;message='训练已结束，上次同类训练已更新。';
  }else if(a.type==='meal_estimate'){
    s.diet.rows.push(...a.items);message=`已整理并保存 ${a.items.length} 项饮食估算。营养来源、份量与做法假设见饮食表，可修改或撤销。`;
  }else if(a.type==='food'){
    const food=s.foods.find(f=>f.name===a.name);
    if(!food)return {state:base,message:`食物库中没有“${a.name}”。请先在食物页按包装标签或可靠来源添加每100g营养数据，并区分生熟。`};
    s.diet.rows.push({food:{...food},grams:a.grams}); message=`已记录 ${a.name} ${a.grams}g。营养按“${food.source}”计算。`;
  }
  s.processed.push(id);return {state:s,message};
}
export function parseLocal(text:string,s:State):Action|null{
  const t=text.trim();let m:RegExpMatchArray|null;
  const parts=t.split(/[；;\n]+|[，,](?=\s*(?:练.{1,5}日|结束训练|(?:今天)?体重|(?:第[一二三四五六七八九十\d]+组)|[^，,\d]{1,15}\s*\d+(?:\.\d+)?\s*(?:kg|公斤|千克)))/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1){
    const actions:z.infer<typeof RecordActionSchema>[]=[];let context=structuredClone(s);
    for(const part of parts){
      const action=parseLocal(part,context);
      if(!action||action.type==='ask'||action.type==='training_query'||action.type==='meal_estimate')return null;
      const items=action.type==='batch'?action.actions:[action];actions.push(...items);
      if(actions.length>100)return {type:'ask',message:'一次最多记录100项，请分批输入。'};
      for(const item of items){
        if(item.type==='set')context.current={day:context.current?.day??'待选择',at:new Date().toISOString(),sets:[...(context.current?.sets??[]),item]};
        else if(item.type==='start')context.current={day:item.day,at:new Date().toISOString(),sets:[]};
        else if(item.type==='finish')context.current=null;
      }
    }
    return {type:'batch',actions};
  }
  // Multi-set inputs go through structured model parsing; never absorb counts into an exercise name.
  if(/(?:[2-9]\d*|1\d+|[二两三四五六七八九十]+)\s*组/.test(t)&&!/^第[二三四五六七八九十\d]+组/.test(t)){
    const repeated=t.match(/^(.+?)\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)[，,\s]*(\d+)组[，,\s]*每组\s*(\d+)次[。！!]?$/i);
    if(repeated){
      const count=Number(repeated[3]);
      if(count>100)return {type:'ask',message:'一次最多记录100组，请分批输入。'};
      if(count>0&&!/[\d，,；;]|总共|计划|打算|明天/.test(repeated[1]))return {type:'batch',actions:Array.from({length:count},()=>({type:'set' as const,exercise:repeated[1].trim(),weight:Number(repeated[2]),reps:Number(repeated[4])}))};
    }
    return null;
  }
  if(/[；;\n]|(?:kg|公斤|千克).*?(?:kg|公斤|千克)/i.test(t))return null;
  if(/上次|上一次|最近一次|本次|这次|当前训练/.test(t)&&/练|训练|卧推|深蹲|做了|动作|记录/.test(t)){
    const part=t.match(/胸|背|腿|肩|手臂|腹|全身/);
    return {type:'training_query',day:part?`${part[0]}日`:null,scope:/本次|这次|当前训练/.test(t)?'current':'previous'};
  }
  if(/^(?:我的|当前|现在的)?体重(?:是多少|多少|记录)[？?]?$/.test(t)){
    const last=s.weights.at(-1);return {type:'ask',message:last?`最近体重 ${last.value}kg，测量时间 ${new Date(last.at).toLocaleString('zh-CN')}。`:'暂无体重记录，请输入“今天体重60kg”等测量值。'};
  }
  if(/^(?:我的|当前)?(?:基础代谢|静息代谢)(?:是多少|多少)?[？?]?$/.test(t))return {type:'ask',message:s.profile?`基础代谢估算 ${metabolism(s.profile).toFixed(0)} kcal/天。指定 BMR 公式（男性=0，女性=1），输入为 ${s.profile.weight}kg、${s.profile.height}cm、${s.profile.age}岁、${s.profile.sex}，不是实测值。`:'请先在档案页填写身高、体重、性别、年龄等必填项。'};
  if(/^(?:今天|今日)?(?:饮食总结|营养总结)[？?]?$/.test(t)){const d=rollover(s).diet;const n=totals(d.rows);const mark=d.rows.some(r=>r.estimate)?'≈':'';return {type:'ask',message:`${d.date} 已记录 ${d.rows.length} 项食物，蛋白质 ${mark}${n.protein.toFixed(1)}g、碳水 ${mark}${n.carbs.toFixed(1)}g、脂肪 ${mark}${n.fat.toFixed(1)}g、热量 ${mark}${n.kcal.toFixed(0)}kcal。仅汇总已记录食物。${mark?'包含参考换算或模型估算，具体来源与份量假设见饮食页。':''}`};}
  if(/^结束训练[。！!]?$/.test(t))return {type:'finish'};
  if((m=t.match(/^(?:今天)?(?:的)?体重(?:是|为)?\s*(\d+(?:\.\d+)?)\s*(kg|公斤|千克|斤)?[。！!]?$/i)))return {type:'weight',value:Number(m[1])/(m[2]==='斤'?2:1)};
  if((m=t.match(/^(?:今天)?体脂(?:率)?(?:是|为)?\s*(\d+(?:\.\d+)?)\s*%?[。！!]?$/)))return {type:'bodyfat',value:Number(m[1])};
  if((m=t.match(/^(?:开始)?练?(.{1,15})日$/)))return {type:'start',day:`${m[1]}日`};
  const setText=t.replace(/^(?:刚刚|刚)?(?:做了|做完了|完成了)?\s*/,'').replace(/[，,、]/g,' ').replace(/[。！!]$/,'').trim();
  const patterns=[/^(?:1|一)组\s*(.+?)\s*(\d+)次\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)$/i,/^(.+?)\s*(?:1|一)组\s*(\d+)次\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)$/i,/^(.+?)\s*(\d+)次\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)$/i];
  if((m=setText.match(/^([^\d，,；;]+?)\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)\s*(\d+)次$/i))&&!/组|计划|明天|打算/.test(m[1]))return {type:'set',exercise:m[1].trim(),weight:Number(m[2]),reps:Number(m[3])};
  for(const pattern of patterns){const found=setText.match(pattern);if(found)return {type:'set',exercise:found[1].trim(),reps:Number(found[2]),weight:Number(found[3])};}
  if((m=setText.match(/^(?:1|一)组\s*(.+?)\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)(?:\s*(?:做了)?(\d+)次)?$/i)))return {type:'set',exercise:m[1].trim(),weight:Number(m[2]),reps:m[3]?Number(m[3]):null};
  if((m=setText.match(/^(.+?)\s*(?:1|一)组\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)(?:\s*(?:做了)?(\d+)次)?$/i)))return {type:'set',exercise:m[1].trim(),weight:Number(m[2]),reps:m[3]?Number(m[3]):null};
  if((m=t.match(/^(?:刚做了|做了)?(.+?)\s*1组\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤|千克)(?:\s*(\d+)次)?[。！!]?$/i)))return {type:'set',exercise:m[1].trim(),weight:Number(m[2]),reps:m[3]?Number(m[3]):null};
  if((m=t.match(/^(?:第[二三四五六七八九十\d]+组|再来一组)\s*(\d+(?:\.\d+)?)\s*(?:kg|公斤)(?:做了)?\s*(\d+)次[。！!]?$/i))&&s.current?.sets.length)return {type:'set',exercise:s.current.sets.at(-1)!.exercise,weight:Number(m[1]),reps:Number(m[2])};
  if((m=t.match(/^(?:今天)?(?:吃了|吃)\s*(.+?)\s*(\d+(?:\.\d+)?)\s*(?:g|克)[。！!]?$/i)))return {type:'food',name:m[1].trim(),grams:Number(m[2])};
  return null;
}

export function findTraining(s:State,query:{day:string|null;scope:'previous'|'current'}):Training|null{
  const normalize=(day:string)=>day.replace(/^练/,'');
  if(query.scope==='current')return s.current&&(!query.day||normalize(s.current.day)===normalize(query.day))?s.current:null;
  const rows=Object.values(s.previous).filter(r=>!query.day||normalize(r.day)===normalize(query.day));
  return rows.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0]??null;
}
