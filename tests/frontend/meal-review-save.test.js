import test from 'node:test';
import assert from 'node:assert/strict';
import {createMealReview} from '../../frontend/public/meal-review.js';
test('confirm reads every edited meal and saves once; invalid values do not save',async()=>{
 class Element {
  children=[];_value='';textContent='';
  set value(v){this._value=String(v)} get value(){return this._value}
  append(...items){this.children.push(...items)}
  setAttribute(){} addEventListener(){}
 }
 const old=globalThis.document;globalThis.document={createElement:()=>new Element()};
 try{
  const row={grams:30,food:{name:'蛋白粉',protein:70,carbs:10,fat:5,kcal:365,source:'测试估算'},estimate:{assumptions:[],addedOilPer100g:0,addedSugarPer100g:0}};
  const saved=[];const host=createMealReview({items:[row,structuredClone(row)]},{save:async value=>saved.push(value),cancel:()=>{},guard:fn=>fn()});
  const grams=host.children[2].children[1].children[0].children[0];grams.value=40;
  const confirm=host.children.at(-1).children[0];await confirm.onclick();
  assert.equal(saved.length,1);assert.deepEqual(saved[0].items.map(x=>x.grams),[40,30]);
  grams.value='';await assert.rejects(confirm.onclick());assert.equal(saved.length,1);
 }finally{globalThis.document=old;}
});
