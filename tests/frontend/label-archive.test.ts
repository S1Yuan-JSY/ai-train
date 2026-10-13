import {test} from 'node:test';
import assert from 'node:assert/strict';
import {labelFood,labelExtras,parseLabelText} from '../../frontend/src/label';
import {emptyState,applyAction,rollover,totals,FoodSchema,findTraining} from '../../frontend/src/core';
const label={basisAmount:100,basisUnit:'g',density:null,energy:836.8,energyUnit:'kJ',protein:10,fat:5,carbs:25,extras:[{name:'钠',amount:120,unit:'mg'}],text:'测试标签',confirmedAt:'2026-10-11T00:00:00.000Z'};
test('标签按克准确换算，保留原能量而非强制4/4/9',()=>{
 const food=FoodSchema.parse(labelFood('测试食物',label));const n=totals([{food,grams:35}]);
 assert.ok(Math.abs(n.kcal-70)<1e-9);assert.equal(n.protein,3.5);assert.equal(n.carbs,8.75);assert.equal(n.fat,1.75);
 assert.equal(labelExtras(food.label!,35)[0].amount,42);
 const serving=labelFood('每份标签',{...label,basisAmount:30,energy:60,energyUnit:'kcal',protein:3,fat:1.5,carbs:7.5});
 assert.equal(serving.kcal,200);assert.equal(serving.protein,10);
});
test('毫升标签必须有密度，空值/非有限/异常质量拒绝',()=>{
 assert.throws(()=>labelFood('测试',{...label,basisUnit:'ml'}));
 assert.equal(labelFood('测试',{...label,basisUnit:'ml',density:1.25}).protein,8);
 for(const patch of [{basisAmount:0},{protein:NaN},{energy:Infinity},{fat:-1},{basisAmount:1},{protein:undefined}])assert.throws(()=>labelFood('测试',{...label,...patch}));
});
test('OCR提取含量而非NRV，零值保留，多列/范围缺失不猜测',()=>{
 const r=parseLabelText('营养成分表\n每 100 克 NRV%\n能量 836.8 kJ 10%\n蛋白质 10 g 17%\n脂肪 0 g 0%\n碳水化合物 25 g 8%\n钠 120 mg 6%');
 assert.equal(r.energy,836.8);assert.equal(r.energyUnit,'kJ');assert.equal(r.protein,10);assert.equal(r.fat,0);assert.equal(r.basisAmount,100);assert.equal(r.extras[0].amount,120);
 assert.equal(parseLabelText('蛋白质 2 g 4 g').protein,undefined);
 assert.equal(parseLabelText('蛋白质 <1 g').protein,undefined);
 assert.equal(parseLabelText('蛋白质 17%').protein,undefined);
 assert.equal(parseLabelText('每100毫升').basisUnit,'ml');
 assert.equal(parseLabelText('每份(30克)').basisAmount,30);
});
test('跨日保留饮食与完整标签、重复刷新不重复归档，输入不变',()=>{
 const s=emptyState();s.diet={date:'2026-10-10',rows:[{food:labelFood('测试',label),grams:35}]};
 const next=rollover(s,new Date(2026,9,11,0,1));
 assert.equal(s.diet.rows.length,1);assert.equal(next.diet.rows.length,0);
 assert.equal(next.archives!['2026-10-10'].meals.length,1);
 assert.equal(next.archives!['2026-10-10'].meals[0].food.label!.energy,836.8);
 assert.equal(rollover(next,new Date(2026,9,11,12)),next);
 const backward=rollover(next,new Date(2026,9,10,12));assert.equal(backward.diet.rows.length,1);
 const forward=rollover(backward,new Date(2026,9,11,12));assert.equal(forward.archives!['2026-10-10'].meals.length,1);
});
test('同一训练类型多次完成均保留，previous仍指向最近一次',()=>{
 let s=emptyState();for(let n=1;n<=3;n++){
 const time=new Date(2026,9,n<3?10:11,8+n);
 s=applyAction(s,{type:'start',day:'胸日'},'s'+n,time).state;
 s=applyAction(s,{type:'set',exercise:'卧推',weight:40+n,reps:8},'r'+n,time).state;
 s=applyAction(s,{type:'finish'},'f'+n,time).state;
 }
 assert.equal(s.archives!['2026-10-10'].trainings.length,2);assert.equal(s.archives!['2026-10-11'].trainings.length,1);
 assert.equal(findTraining(s,{day:'胸日',scope:'previous'})!.sets[0].weight,43);
});
test('兼容旧previous；跨日未结束训练保留并关闭，不产生重复',()=>{
 const s=emptyState();s.diet.date='2026-10-10';const t={day:'胸日',at:new Date(2026,9,10,20).toISOString(),sets:[{exercise:'卧推',weight:60,reps:8}]};s.previous={'胸日':t};s.current={...t,day:'背日'};
 const next=rollover(s,new Date(2026,9,11,1));assert.equal(next.current,null);assert.equal(next.archives!['2026-10-10'].trainings.length,2);assert.equal(next.previous['背日'].autoClosed,true);
 assert.equal(rollover(next,new Date(2026,9,11,2)),next);
});

