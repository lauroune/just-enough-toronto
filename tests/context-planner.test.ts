import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planRoute} from '../src/context-planner';
test('a different neighbourhood can supply its own graph and access rules',()=>{
 const nodes={library:[],market:[],lane:[],home:[]};
 const edges=[{a:'library',b:'lane',minutes:1,width:60},{a:'lane',b:'home',minutes:1,width:60},{a:'library',b:'market',minutes:3,width:120},{a:'market',b:'home',minutes:2,width:120}] as const;
 assert.deepEqual(planRoute(nodes,edges,'library','home',e=>e.width>=90)?.nodes,['library','market','home']);
 assert.equal(planRoute(nodes,edges,'library','home',()=>true)?.minutes,2);
 assert.equal(planRoute(nodes,edges,'library','home',()=>false),null);
});
test('planner handles start at goal and disconnected destination',()=>{
 const nodes={a:[],b:[]};assert.deepEqual(planRoute(nodes,[],'a','a',()=>true),{nodes:['a'],edges:[],minutes:0});assert.equal(planRoute(nodes,[],'a','b',()=>true),null);
});
test('invalid contributed edges fail with useful messages',()=>{
 assert.throws(()=>planRoute({a:[],b:[]},[{a:'a',b:'b',minutes:NaN}],'a','a',()=>true),/non-negative/);
 assert.throws(()=>planRoute({a:[],b:[]},[{a:'a',b:'b',minutes:-1}],'a','b',()=>true),/non-negative/);
 assert.throws(()=>planRoute<string,{a:string;b:string;minutes:number}>({a:[],b:[]},[{a:'a',b:'missing',minutes:1}],'a','b',()=>true),/missing node/);
});
