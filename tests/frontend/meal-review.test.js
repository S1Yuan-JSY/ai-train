import test from 'node:test';
import assert from 'node:assert/strict';
import {adjustMealItem} from '../../frontend/public/meal-review.js';
const original={food:{name:'合成测试菜',protein:10,carbs:20,fat:10,kcal:210,source:'模型估算'},grams:200,estimate:{addedOilPer100g:5,addedSugarPer100g:4,nutritionBasis:'model',assumptions:['测试'],gramsEstimated:true,portionMin:150,portionMax:250}};
test('replace oil and sugar already included rather than double counting',()=>{
 assert.equal(adjustMealItem(original,200,10,8).food.kcal,210);
 const revised=adjustMealItem(original,200,4,2);
 assert.equal(revised.food.fat,7);assert.equal(revised.food.carbs,17);assert.equal(revised.food.kcal,171);
 assert.equal(original.food.kcal,210);
 assert.equal(adjustMealItem(original,200,4,2).food.kcal,revised.food.kcal);
});
test('portion changes keep explicit portion oil totals and mark revised source',()=>{
 const reference=structuredClone(original);reference.estimate.nutritionBasis='database';reference.estimate.sourceId='FDC123';
 const row=adjustMealItem(reference,100,0,0);
 assert.equal(row.food.kcal,149);assert.equal(row.estimate.nutritionBasis,'model');assert.equal(row.estimate.sourceId,undefined);
 assert.equal(row.estimate.portionMin,100);assert.equal(row.estimate.gramsEstimated,false);
 assert.throws(()=>adjustMealItem(original,200,-1,2));assert.throws(()=>adjustMealItem(original,0,0,0));assert.throws(()=>adjustMealItem(original,200,NaN,0));
 assert.throws(()=>adjustMealItem(original,200,200,200));
});
test('old responses without separated oil and sugar do not assume zero',()=>{
 const row=structuredClone(original);delete row.estimate.addedOilPer100g;delete row.estimate.addedSugarPer100g;
 assert.equal(adjustMealItem(row,100,NaN,NaN).food.kcal,210);
});
