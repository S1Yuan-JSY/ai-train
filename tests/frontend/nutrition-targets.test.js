import test from 'node:test';
import assert from 'node:assert/strict';
import {targetProgress} from '../../frontend/public/nutrition-targets.js';
test('daily target progress distinguishes shortfall, reached and excess',()=>{
 assert.deepEqual(targetProgress(50,100),{percent:50,text:'还差 50.0g'});
 assert.deepEqual(targetProgress(100,100),{percent:100,text:'已达目标'});
 assert.deepEqual(targetProgress(120,100),{percent:100,text:'超出 20.0g'});
 assert.throws(()=>targetProgress(10,0));assert.throws(()=>targetProgress(10,NaN));
});
