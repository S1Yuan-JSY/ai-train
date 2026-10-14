import test from 'node:test';
import assert from 'node:assert/strict';
import {ActionSchema,applyAction,emptyState} from '../../frontend/src/core';

test('meal response with backend default label null saves all five items',()=>{
 const names=['米饭','卤制去皮鸡腿肉','含糖西红柿炒蛋','水煮鸡全蛋','羊杂面'];
 // Synthetic values exercise the response contract, not nutritional estimates.
 const items=names.map((name,i)=>({food:{name,protein:10,carbs:20,fat:5,kcal:165,source:'测试数据',label:null},grams:[200,150,100,200,500][i],estimate:{assumptions:['测试数据'],confidence:'低',gramsEstimated:i>2,portionMin:[200,150,100,180,400][i],portionMax:[200,150,100,240,600][i],nutritionBasis:'model'}}));
 const action=ActionSchema.parse({type:'meal_estimate',items});
 const result=applyAction(emptyState(),action,'five-foods');
 assert.equal(result.state.diet.rows.length,5);
 assert.deepEqual(result.state.diet.rows.map(row=>row.grams),[200,150,100,200,500]);
 assert.equal(applyAction(result.state,action,'five-foods').state.diet.rows.length,5);
 const withoutLabel=structuredClone(items);delete (withoutLabel[0].food as {label?:null}).label;
 assert.doesNotThrow(()=>ActionSchema.parse({type:'meal_estimate',items:withoutLabel}));
 assert.throws(()=>ActionSchema.parse({type:'meal_estimate',items:[{...items[0],food:{...items[0].food,label:{unexpected:true}}}]}));
 assert.throws(()=>ActionSchema.parse({type:'meal_estimate',items:[{...items[0],food:{...items[0].food,unexpected:true}}]}));
});
