import test from 'node:test';
import assert from 'node:assert/strict';
import {ActionSchema,applyAction,emptyState,parseLocal} from '../../frontend/src/core';

test('multiple exercises and repeated sets keep order and exact values',()=>{
 const action=parseLocal('练胸日；卧推60kg，3组，每组8次；飞鸟10kg12次；结束训练',emptyState());
 assert.equal(action?.type,'batch');
 const result=applyAction(emptyState(),action,'batch');
 assert.equal(result.state.previous['胸日'].sets.length,4);
 assert.deepEqual(result.state.previous['胸日'].sets.map(s=>[s.exercise,s.weight,s.reps]),[['卧推',60,8],['卧推',60,8],['卧推',60,8],['飞鸟',10,12]]);
 assert.equal(result.state.current,null);
 assert.deepEqual(applyAction(result.state,action,'batch').state,result.state);
});

test('batch failure rolls back earlier measurements and sets',()=>{
 const before=emptyState();
 const result=applyAction(before,{type:'batch',actions:[{type:'weight',value:60},{type:'set',exercise:'卧推',weight:60,reps:8}]},'fail');
 assert.equal(result.state,before);
 assert.equal(before.weights.length,0);
 assert.match(result.message,/整批尚未保存/);
 assert.throws(()=>applyAction(before,{type:'batch',actions:[{type:'weight',value:60},{type:'set',exercise:'卧推',weight:60,reps:-1}]},'invalid'));
});

test('two completed sessions in a batch retain both archive snapshots',()=>{
 const actions=Array.from({length:2},()=>[{type:'start',day:'胸日'},{type:'set',exercise:'卧推',weight:60,reps:8},{type:'finish'}]).flat();
 const result=applyAction(emptyState(),{type:'batch',actions},'two-sessions');
 assert.equal(Object.values(result.state.archives??{}).flatMap(a=>a.trainings).length,2);
});

test('continuation resolves previous exercise within the same batch',()=>{
 const action=parseLocal('练胸日；卧推60kg8次；第二组55kg做了10次',emptyState());
 const result=applyAction(emptyState(),action,'continuation');
 assert.equal(result.state.current?.sets[1].exercise,'卧推');
 assert.equal(result.state.current?.sets[1].weight,55);
});

test('unclear multi-set inputs use model instead of recording part of the text',()=>{
 for(const text of ['卧推3组总共24次60kg','做了3组卧推8次60kg','卧推60kg8次和深蹲40kg10次','卧推60kg8次；飞鸟重量忘了'])assert.equal(parseLocal(text,emptyState()),null);
 assert.throws(()=>ActionSchema.parse({type:'batch',actions:[]}));
 assert.throws(()=>ActionSchema.parse({type:'batch',actions:[{type:'batch',actions:[]}]}));
 assert.throws(()=>ActionSchema.parse({type:'batch',actions:Array(101).fill({type:'weight',value:60})}));
});
