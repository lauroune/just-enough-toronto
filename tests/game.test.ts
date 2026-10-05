import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, factsForDay, starterBrief, planDelivery, runDelivery, toggleFact, BUDGET } from '../src/game.ts';
import type { Brief, FactId } from '../src/game.ts';
const brief = (ids:FactId[], day=0):Brief => Object.fromEntries(factsForDay(day).filter(f=>ids.includes(f.id)).map(f=>[f.id,f]));
test('starter succeeds, and removing decorative details preserves its outcome',()=>{
  const full=runDelivery(starterBrief(),MISSIONS[0]); const compact=runDelivery(brief(['works','entrance']),MISSIONS[0]);
  assert.equal(full.success,true); assert.deepEqual(full.points,compact.points); assert.equal(compact.success,true);
});
test('a changed task makes gate width necessary and selects a different route',()=>{
  assert.equal(runDelivery(brief(['works','entrance']),MISSIONS[1]).fact,'gate');
  const result=runDelivery(brief(['works','entrance','gate']),MISSIONS[1]);
  assert.equal(result.success,true); assert.equal(result.route,'Park path');
});
test('planner cannot read weather or true world; evaluator discovers obstruction locally',()=>{
  const memory=brief(['works','entrance','gate']);
  const plan=planDelivery(memory,90);
  assert.deepEqual(planDelivery(memory,90),plan);
  assert.equal(runDelivery(memory,MISSIONS[1]).success,true);
  assert.equal(runDelivery(memory,MISSIONS[2]).fact,'park');
});
test('one targeted street update repairs stale memory',()=>{
  const memory=brief(['works','entrance','gate']); memory.works=factsForDay(2).find(f=>f.id==='works');
  const result=runDelivery(memory,MISSIONS[2]); assert.equal(result.success,true); assert.equal(result.route,'Queen Street');
});
test('missing entrance fails at the front door; adding fact repairs arrival',()=>{
  assert.equal(runDelivery(brief(['works']),MISSIONS[0]).fact,'entrance');
  assert.equal(runDelivery(brief(['works','entrance']),MISSIONS[0]).success,true);
});
test('a blank brief cannot see the closure or hidden entrance',()=>{
  assert.equal(planDelivery({},45)?.nodes.at(-1),'front');
  assert.equal(runDelivery({},MISSIONS[0]).fact,'works');
});
test('failed journeys stop before the physical obstacle, without passing through it',()=>{
  for(const [cards,chapter,id] of [[[],0,'works'],[['works','entrance'],1,'gate'],[['works','entrance','gate'],2,'park']] as [FactId[],number,FactId][]){
    const result=runDelivery(brief(cards),MISSIONS[chapter]);const stop=result.points.at(-1)!;const obstacle=factsForDay(chapter).find(f=>f.id===id)!.position;
    assert.equal(result.fact,id);assert.ok(Math.hypot(stop[0]-obstacle[0],stop[1]-obstacle[1])>=.8);assert.ok(result.minutes>0);
  }
});
test('known blocked routes yield no invented escape',()=>{
  const b=brief(['works','gate','entrance']); b.park=factsForDay(2).find(f=>f.id==='park');
  assert.equal(planDelivery(b,90),null); assert.equal(runDelivery(b,MISSIONS[2]).success,false);
});
test('budget is enforced, removal works, original memory remains immutable',()=>{
  const original=starterBrief(); const gate=factsForDay(0).find(f=>f.id==='gate')!;
  assert.equal(Object.keys(toggleFact(original,gate)).length,BUDGET);
  assert.equal(original.gate,undefined);
  const reduced=toggleFact(original,original.mural!); assert.equal(reduced.mural,undefined); assert.ok(original.mural);
  assert.ok(toggleFact(reduced,gate).gate);
});
test('all legal briefs are finite and every chapter has successful solutions',()=>{
  for(const mission of MISSIONS) {
    const facts=factsForDay(mission.index); let wins=0;
    for(let mask=0;mask<64;mask++) {
      const selected=facts.filter((_,i)=>mask & 1<<i); if(selected.length>BUDGET) continue;
      const result=runDelivery(Object.fromEntries(selected.map(f=>[f.id,f])),mission);
      assert.ok(Number.isFinite(result.minutes)); assert.ok(result.points.length); if(result.success) wins++;
    }
    assert.ok(wins>0);
  }
});
